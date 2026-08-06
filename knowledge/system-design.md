# System Design (Scenario Walkthroughs)

Classic "design X" interview scenarios, worked end-to-end: requirements, capacity, API, data model, and the two or three decisions the interviewer actually scores. This is a starter set — a small, high-quality sample meant to grow. It complements [architecture.md](architecture.md), which covers the underlying patterns (CQRS, event-driven, consistency models) in isolation.

Each entry carries `**Difficulty:**` and `**Topics:**` metadata so the picker can filter and weight it like the company banks.

---

### 1. Design a URL shortener (TinyURL / bit.ly)

**Frequency:** High

**Difficulty:** Medium
**Topics:** system-design, hashing, caching, sharding, read-heavy

**Answer:** Walk through it in the order an interviewer expects — scope, scale, design, then the one or two decisions that actually earn the score.

**Step 1 — Clarify what we're building.** The core is two operations: given a long URL, hand back a short code; given a short code, redirect to the original. Pin down the unknowns out loud: is the read/write ratio lopsided (yes — people create a link once and click it many times, roughly 100:1)? Do codes expire (assume no, or an optional TTL)? Do we need click analytics or custom aliases (say "out of scope for v1" so you don't over-build)? This framing puts "reads dominate" on the table, and that conclusion drives every later decision.

**Step 2 — Do the napkin math.** Suppose 100M new URLs per day. That's 100M ÷ 86,400s ≈ 1,200 writes/sec, and at 100:1 about 120,000 reads/sec. The point isn't the exact number — it's the *shape*: writes are modest, reads are heavy. So we spend the engineering budget on making the redirect path fast and treat writes as the easy side.

**Step 3 — Lay out the pieces.** A write stores a row; a read looks one up and returns an HTTP redirect. Storage is just a key-value map: `code -> {long_url, created_at, owner}`. At 100M/day the table is far too big for one machine, so shard it — split by a hash of the short code so a lookup goes straight to the right shard.

**Step 4 — The real question: how do we generate the short code?** This is what the interviewer is scoring, so slow down and compare the options *with their trade-offs*:
- *Hash the URL* (e.g. MD5/SHA, take the first 7 base62 characters). Simple, but two different URLs can land on the same code — a collision — so every write must check "is this code taken?" and retry with a different slice. Extra work on the write path.
- *Distributed counter* (0, 1, 2, … base62-encoded). No collisions ever, and it's fast. The downside: codes come out in order, so anyone can add 1 to your latest code to guess others and estimate how many links you've created — a business-intelligence leak.
- *Hybrid* — feed a counter into base62 but give each shard its own offset (or interleave the bits). This keeps writes collision-free *and* scrambles the sequence so it's no longer trivially guessable, while avoiding every write fighting over one global counter.

Why 7 characters? 62^7 ≈ 3.5 trillion codes — years of headroom at 100M/day. That's how you *justify* the length instead of guessing.

**Step 5 — Make the redirect fast.** Because the popular links are a tiny slice of all links, a cache (Redis, or a CDN) in front of the database gets a very high hit rate. Choose the redirect status deliberately too: a **301** is cached by the browser (fewer hits to you, but you lose per-click analytics), while a **302** comes back to you every time so you *can* count clicks. Pick based on whether analytics matter.

**Step 6 — Guard the write path.** Make creation idempotent (the same long URL from the same user returns the same code instead of piling up duplicates), and defend against abuse with rate limiting plus a malware/URL blocklist so the service isn't used to cloak bad links.

**Key points:**
- Read-heavy: cache/CDN the redirect, size the write path for far less traffic.
- Key generation is the real question — counter (no collisions, guessable) vs hash (collisions, opaque); the hybrid gets the best of both.
- 7 base62 chars = 62^7 ≈ 3.5 trillion codes — justify the length from capacity, don't guess.
- 301 (cacheable, loses analytics) vs 302 (per-hit counting) is a deliberate choice.

---

### 2. Design a social news feed (Twitter / Facebook timeline)

**Frequency:** High

**Difficulty:** Hard
**Topics:** system-design, fan-out, caching, sharding, consistency

**Answer:** The whole problem turns on one decision — when do you do the work of assembling a feed, at write time or at read time? Build up to it in stages.

**Step 1 — Clarify the product.** A feed is the merged, ranked stream of posts from everyone you follow. Ask: how many followers does a typical user have vs the extremes (most have hundreds; a celebrity has tens of millions)? Does the feed have to be real-time, or is a few seconds of lag fine (almost always fine)? Chronological or ranked? These answers decide everything, especially the celebrity question.

**Step 2 — Note the scale shape.** Reads massively dominate — people scroll far more than they post. So, like most consumer systems, we want reads to be cheap even if that makes writes do more work.

**Step 3 — The core choice: fan-out-on-write vs fan-out-on-read.**
- *Fan-out-on-write (push).* The moment someone posts, copy that post's ID into the precomputed feed list of every follower (kept in Redis). Reading a feed is then O(1) — just return your ready-made list. Great for reads. The catch: a celebrity with 100M followers triggers 100M writes for one post (the "hot user" / thundering-herd problem), and you waste storage precomputing feeds for followers who never log in.
- *Fan-out-on-read (pull).* Store posts per author and do nothing at write time. When someone opens their feed, gather the latest posts from everyone they follow and merge by time. Writes are cheap, but reads become expensive, high-latency, and hammer the database.

**Step 4 — Combine them (the production answer).** Use push for normal users and pull for celebrities. A follower's feed = their precomputed push feed, merged at read time with the recent posts of the handful of celebrities they follow. Now no single post fans out to 100M lists, and ordinary reads stay O(1).

**Step 5 — Data model.** Posts sharded by post ID (or author), a follower/following graph, and a per-user feed cache. Keep retrieval (which posts are candidates) separate from ranking (chronological vs an ML score) — they scale differently and you'll want to evolve ranking independently.

**Step 6 — Lean on eventual consistency.** A new post showing up a few seconds late is perfectly acceptable, so the fan-out can run on async workers. That tolerance for lag is what lets the whole thing scale.

**Key points:**
- Name both strategies and the celebrity problem that forces the hybrid.
- Push = fast reads / expensive celebrity writes; pull = cheap writes / expensive reads.
- Reads dominate, so precompute; feeds tolerate eventual consistency, so fan out async.
- Separate retrieval (get candidate posts) from ranking (order them) — they scale differently.

---

### 3. Design a rate limiter

**Frequency:** High

**Difficulty:** Medium
**Topics:** system-design, rate-limiting, concurrency, caching, distributed-systems

**Answer:** A rate limiter looks trivial until you ask "how exactly do we count?" and "how do we count correctly across many servers?" Work up to those two.

**Step 1 — Clarify the rules.** Limit per what — user, IP, API key? Where does it run — in the client, at the API gateway, or inside each service (gateway is the usual sweet spot)? What's the limit (say 100 req/min), and what happens on breach — reject with `429 Too Many Requests` + a `Retry-After` header, or queue the request? Nail these before touching algorithms.

**Step 2 — Pick the counting algorithm (the meat).** Compare them by accuracy vs cost:
- *Fixed window* — one counter per time bucket (e.g. per minute). Trivial, but allows a 2× burst straddling the boundary (end of one minute + start of the next).
- *Sliding window log* — store a timestamp per request and count those in the last 60s. Exact, but memory grows with traffic.
- *Sliding window counter* — blend the current and previous window by weight. The common compromise: nearly exact, cheap.
- *Token bucket* — tokens refill at a steady rate, each request spends one; if the bucket's empty you're limited. Naturally allows controlled bursts, and is the usual default answer.
- *Leaky bucket* — drains at a fixed rate, smoothing bursty input into steady output.

**Step 3 — Make it correct across servers.** With many gateway nodes the counter must be shared, so keep it in Redis. The trap: "read count, check, write count+1" is a race — two nodes both read 99, both admit, and you've allowed 101. Make the check-and-decrement atomic — a Lua script, or `INCR` with an `EXPIRE` — so the count-and-decide happens as one step.

**Step 4 — Handle the hot key.** One wildly popular user (or a global limit) turns their counter into a hot key that every node hammers. Shard the counter, or let each node keep a local approximate count and reconcile periodically, trading a little precision for a lot of throughput.

**Step 5 — Decide the failure mode.** If the limiter (or Redis) is down, do you fail open (allow traffic) or fail closed (block it)? For availability you usually fail open — except on security-sensitive endpoints (login, payments) where you fail closed.

**Key points:**
- Token bucket is the sensible default (steady refill + controlled bursts); know why fixed-window bursts at boundaries.
- Distributed correctness needs an atomic check-and-decrement (Redis Lua / INCR+EXPIRE), not read-then-write.
- Return 429 with `Retry-After`; decide fail-open vs fail-closed explicitly.
- Hot keys on popular users need sharding or local approximate counters.

---

### 4. Design a messaging / chat system (WhatsApp, Messenger)

**Frequency:** High

**Difficulty:** Hard
**Topics:** system-design, websockets, message-queue, consistency, fan-out

**Answer:** Chat is really a routing-and-delivery problem: get a message from one connected client to another (who may be offline), in order, exactly once as far as the user can tell. Layer it up.

**Step 1 — Requirements.** 1:1 and group chat, delivery whether the recipient is online or offline, delivery + read receipts, correct ordering within a conversation, and media attachments. These map almost one-to-one onto the design decisions below.

**Step 2 — The connection layer.** Unlike a request/response API, chat needs the server to push. So clients hold a persistent connection (WebSocket, or long-poll as a fallback) to a stateful gateway. Keep a session registry — who is connected to which gateway — so when A messages B you can look up B's gateway and route to it.

**Step 3 — Offline delivery.** If B isn't connected, don't drop the message: persist it to a per-user message store/queue and deliver on reconnect, plus fire a push notification. "Store and forward" is what makes chat feel reliable.

**Step 4 — Ordering.** Don't trust wall-clock timestamps across servers — clocks drift. Assign a per-conversation sequence number (or logical clock) so every client can sort messages and detect a gap ("I have 1, 2, 4 — where's 3?") and re-fetch.

**Step 5 — Delivery semantics and receipts.** Guarantee at-least-once delivery and dedup on the client by message ID — that combination looks like exactly-once to the user. Track acknowledgements at each stage to drive the "sent → delivered → read" tick states.

**Step 6 — Group chat is fan-out.** Small group: write the message into each member's queue (simple). Large group (thousands): a shared per-group log that members read from scales far better than fanning out to thousands of queues.

**Step 7 — Data model and scaling.** Shard messages by conversation ID so one conversation's history stays co-located and cheap to page through. Media goes to blob storage/CDN and the message carries only a URL, never the bytes. The routing logic is stateless and scales horizontally; the genuinely stateful parts are the connection gateways and the session registry.

**Key points:**
- Persistent connections + a session registry to route to the right gateway; offline → store-and-forward + push.
- Per-conversation sequence numbers for ordering and gap detection, not server clocks.
- At-least-once + dedup by message ID; acks drive delivered/read receipts.
- Shard by conversation ID; media to CDN by reference, not inline.

---

### 5. Design a web crawler

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, distributed-systems, message-queue, bloom-filter, politeness

**Answer:** A crawler is a big loop — fetch, extract links, enqueue, repeat — but scale and politeness turn each step into its own problem. Walk the loop, then the hard parts.

**Step 1 — Requirements.** Crawl billions of pages, extract their links, refresh periodically, respect politeness (robots.txt, per-host rate limits), and avoid traps. "Billions" and "politeness" are the two words that shape the design.

**Step 2 — The core loop.** A URL frontier (a set of queues) feeds fetcher workers → they download and parse pages → extract new links → dedup them → enqueue the new URLs back into the frontier. Everything else hangs off this loop.

**Step 3 — The frontier is the interesting part.** It encodes two things at once: politeness — don't hammer a single host, so partition queues by host and let one worker serve each host at a controlled rate — and priority — crawl important or fresh pages before obscure ones. Getting the frontier right is most of the design.

**Step 4 — Dedup at scale.** You can't hold a hash set of billions of URLs in memory. Use a Bloom filter for the "have I seen this URL?" check — small and fast, and its only error (a false positive) merely skips a page, which is acceptable — backed by a persistent store as the source of truth. For the *same page reachable at different URLs*, compare a content hash / simhash to catch near-duplicates.

**Step 5 — Politeness and traps.** Fetch and cache each host's robots.txt and honor it, add crawl delays, and detect spider traps — infinite calendars, session-ID URLs that generate endless links — with depth and URL-pattern limits so a crawler doesn't fall down a hole.

**Step 6 — Freshness and robustness.** Re-crawl frequency should adapt to how often a page actually changes (a news homepage often, an archived post rarely). Make every stage distributed and idempotent: a URL that was fetched but not fully processed must be safely retryable, so a worker crash never corrupts the crawl.

**Key points:**
- The URL frontier encodes both politeness (per-host partitioning + delays) and priority.
- Bloom filter for URL-seen dedup at scale; content hash / simhash for duplicate pages.
- Respect robots.txt and detect traps (infinite/parametrized URLs) with depth limits.
- Idempotent, retryable stages so worker crashes don't corrupt the crawl.

---

### 6. Design a notification service (push / email / SMS fan-out)

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, message-queue, fan-out, idempotency, reliability

**Answer:** A notification service is a pipeline: an event comes in, and it must reach the right people, on the right channels, once each — without melting under a broadcast. Follow the event through.

**Step 1 — Requirements.** Send across channels (push, email, SMS, in-app), handle high fan-out (a "breaking news" broadcast to millions), respect user preferences and quiet hours, and guarantee no duplicate sends. "Fan-out" and "no duplicates" are the hard constraints.

**Step 2 — The pipeline shape.** A producer publishes a notification event → a queue/broker → worker pool. The queue is the key architectural move: it absorbs bursts (a broadcast doesn't overwhelm anything downstream) and isolates a slow or failing provider so it can't back up the rest.

**Step 3 — What a worker does.** For each event a worker resolves the recipients, applies preference and dedup filters (drop users who opted out, are in quiet hours, or were already notified), templates the message per channel, and hands off to a channel-specific provider — APNs/FCM for push, an email provider, an SMS gateway.

**Step 4 — Reliability and no-duplicates.** Providers fail and get retried, and retries are where duplicates come from. Attach an idempotency key per (user, notification) so a retry is recognized and doesn't double-send. Send messages that exhaust their retries to a dead-letter queue for inspection rather than losing or looping them.

**Step 5 — Rate limiting, both directions.** Rate-limit per provider because they throttle you (exceed it and they drop your traffic), and per user so a buggy trigger can't spam someone with 100 pushes.

**Step 6 — Handle huge fan-outs.** A "notify all 10M users" event should expand the recipient list asynchronously in batches — enqueue chunks that workers pick up — not one giant synchronous loop that ties up a worker for an hour. Track delivery status per channel for observability and receipts.

**Key points:**
- Queue-decoupled workers per channel absorb bursts and isolate provider failures.
- Idempotency key per (user, notification) + DLQ is the "no duplicates, no lost sends" story.
- Apply user preferences, quiet hours, and per-user/per-provider rate limits before dispatch.
- Expand large fan-outs asynchronously in batches, not one synchronous loop.

---

### 7. Design a typeahead / autocomplete service

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, trie, caching, read-heavy, ranking

**Answer:** The whole design is dominated by one number: sub-100ms per keystroke. That latency budget forces you to precompute answers instead of computing them per request. Build around that.

**Step 1 — Requirements.** For a given prefix, return the top-k completions in under 100ms, ranked by popularity, and keep it current as trends shift. It's extremely read-heavy (every keystroke is a query) with a hard latency SLO — that combination screams "precompute."

**Step 2 — The data structure.** Use a trie (prefix tree), but with a twist: at each node, store the top-k most popular completions that pass through it. Now a lookup is just "walk down to the prefix node, return its cached top-k" — no ranking at request time, which is how you hit the latency budget.

**Step 3 — Building the trie (offline).** Don't mutate the trie on every keystroke. Instead run a periodic batch job over the query logs: count how often each query was typed, then propagate each node's top-k up the tree. You rebuild/refresh on a schedule (say hourly), which is what keeps it current without touching the serving path.

**Step 4 — Serving at scale.** Shard the trie (e.g. by first letter) across servers and cache aggressively — the head of the query distribution ("fac…" → "facebook") is tiny and cacheable right at the edge. On the client, debounce keystrokes (don't fire on every character) and cache recent results to cut request volume dramatically.

**Step 5 — Taming the ranking data.** You can't keep exact counts for every query in the long tail. Use sampling or an approximate counter like a count-min sketch — it slightly overcounts rare items but is tiny and fast, which is a fine trade for popularity ranking.

**Step 6 — Later layers.** Personalization (bias toward this user's history) and typo tolerance (edit-distance / fuzzy matching) are v2 features layered on top of the popularity baseline — mention them as extensions, don't let them complicate the core.

**Key points:**
- Precompute top-k at each trie node so serving is a walk + return, not a ranked query.
- Rebuild the trie offline from query-log frequencies on a schedule; don't mutate per keystroke.
- Read-heavy → shard the trie and cache aggressively; debounce on the client.
- Count-min sketch / sampling for long-tail frequency; fuzzy matching and personalization are later layers.

---

### 8. Design a video streaming platform (YouTube / Netflix)

**Frequency:** Medium

**Difficulty:** Hard
**Topics:** system-design, cdn, storage, encoding, read-heavy

**Answer:** Split the system into three stages — upload/ingest, storage/processing, and playback — and notice up front that playback is where the scale (and the money) lives. Take them in order.

**Step 1 — Upload / ingest.** A client uploads the raw file to blob storage. Make it resumable and chunked — video files are huge and a connection drop shouldn't restart a 4GB upload from zero.

**Step 2 — Processing (transcoding).** A pipeline re-encodes each raw upload into multiple resolutions and bitrates (240p → 4K) and cuts each into small segments (a few seconds each, HLS/DASH), producing a manifest that lists them. This is the setup for adaptive bitrate — the core of smooth playback (next step). Transcoding is embarrassingly parallel, so fan it out per-segment across a worker fleet driven by a queue.

**Step 3 — Adaptive bitrate playback.** Because it's pre-segmented at many qualities, the player can measure the viewer's current bandwidth and switch quality per segment — drop to 480p when the network dips, climb back to 1080p when it recovers — instead of buffering. This is *the* reason for all the transcoding in step 2.

**Step 4 — Storage tiering.** Originals plus every rendition is an enormous amount of data. Tier it: keep hot renditions on fast storage / CDN, and push cold originals to cheap object storage. Don't pay premium storage for a movie nobody watches.

**Step 5 — Playback is a CDN problem.** This is massively read-heavy and bandwidth-bound, so a CDN is non-negotiable: cache segments at edge PoPs close to users, and only a cache miss hits origin. Pre-warm popular content (a big new release) to the edges before the traffic spike.

**Step 6 — Keep metadata off the video path.** Titles, view counts, and recommendations are a separate, comparatively tiny service. Crucially, run view-count updates and recommendations as async analytics off the playback path — never make watching a video wait on a synchronous counter write.

**Key points:**
- Adaptive bitrate: transcode to multiple renditions, segment + manifest (HLS/DASH), let the player switch per segment.
- Transcoding is parallel per-segment fan-out via a worker queue.
- Playback is CDN-first — edge-cache segments, pre-warm popular content, origin only on miss.
- Separate the tiny metadata/analytics services from the huge bandwidth-bound video path.

---

### 9. Design a distributed key-value store (Dynamo-style)

**Frequency:** Low

**Difficulty:** Hard
**Topics:** system-design, distributed-systems, consistency, replication, sharding

**Answer:** This is the Dynamo paper as an interview question. The through-line: no central coordinator, stay available, and let the caller tune consistency. Build it up capability by capability.

**Step 1 — Requirements.** get/put by key (no queries, no joins), scale horizontally by adding commodity nodes, stay highly available under failure, and offer tunable consistency. That last point is the theme — we'll trade strict consistency for availability on purpose.

**Step 2 — Partitioning: where does a key live?** Naive `hash(key) % N` reshuffles almost everything when N changes. Instead use consistent hashing: place nodes on a ring, and a key belongs to the next node clockwise. Adding/removing a node now moves only ~1/N of keys. Give each physical node many virtual nodes on the ring so load and hotspots even out.

**Step 3 — Replication.** Write each key to the next N nodes clockwise (its "preference list"), skipping duplicates so the copies land on distinct physical hosts/racks. Now a node loss doesn't lose data.

**Step 4 — Tunable consistency via quorums.** With N replicas, let the caller pick R (nodes that must ack a read) and W (nodes that must ack a write). If R + W > N, any read overlaps at least one node that saw the latest write — read-your-writes consistency. Smaller R/W means faster, more available operations but staler reads. This is the CAP knob in your hands; Dynamo defaults to AP with eventual consistency.

**Step 5 — Resolve conflicting writes.** With loose quorums, two clients can write the same key concurrently. Options: vector clocks detect whether one write causally followed the other (and surface true conflicts as "siblings" for the app to merge), or last-write-wins by timestamp — simpler but silently drops one write. Name the trade-off.

**Step 6 — Survive failures.** Hinted handoff: if a target node is down, a healthy node temporarily accepts the write and replays it when the peer returns, so writes never block. Anti-entropy with Merkle trees: replicas compare tree hashes top-down to find exactly which keys diverged and re-sync only those, cheaply. Membership and failure detection ride a gossip protocol, so there's no central coordinator to be a SPOF.

**Key points:**
- Consistent hashing + virtual nodes for partitioning and minimal reshuffling.
- R + W > N is the quorum rule for strong-ish reads; smaller values buy availability (CAP tradeoff).
- Conflict resolution: vector clocks (causal, keeps siblings) vs last-write-wins (lossy, simple).
- Hinted handoff + Merkle-tree anti-entropy + gossip = availability without a coordinator.

---

### 10. Design a distributed unique ID generator

**Frequency:** Low

**Difficulty:** Medium
**Topics:** system-design, distributed-systems, sharding, clock

**Answer:** The goal is IDs that are unique across many machines with no coordination on the hot path, and ideally sortable by time. Reason through the options until Snowflake falls out as the answer.

**Step 1 — Requirements.** 64-bit IDs (compact, good as a DB key), unique across many machines, ideally roughly time-sortable, at high throughput, with no single point of contention. "No coordination per ID" is the constraint that kills the obvious approaches.

**Step 2 — Walk the options and why each falls short.**
- *Central auto-increment DB.* Simple and ordered, but every ID generation hits one database — a bottleneck and a single point of failure.
- *UUIDv4 (random).* Trivially distributed and collision-free in practice, but it's 128-bit and not time-sortable, which hurts as a primary key: random inserts scatter across a B-tree and fragment it.
- *DB ticket servers.* Hand each node a range/segment of IDs to use up before asking for more — cuts coordination, but there's still a central allocator.

**Step 3 — Snowflake (the standard answer).** Compose a 64-bit ID from three fields: a timestamp (ms since a custom epoch) + a machine/worker ID + a per-ms sequence counter. The timestamp makes IDs time-sortable, the worker ID makes them unique across machines, and the sequence counter allows many IDs within the same millisecond — all with no coordination when generating an ID.

**Step 4 — The one piece of coordination.** Each node still needs a unique worker ID. Assign it via static config, or a coordination service like ZooKeeper on startup — this happens once per node, not per ID.

**Step 5 — The classic failure mode: clocks.** Snowflake trusts the clock, so NTP stepping backwards is dangerous — if the clock moves back, you can re-issue timestamps you already used and generate duplicates. Detect it and either wait until the clock catches up, or refuse to issue IDs until it does. Always call this out.

**Step 6 — Bit allocation is a real decision.** How many bits for timestamp vs worker vs sequence is a capacity trade-off: more timestamp bits = more years before rollover, more worker bits = more machines, more sequence bits = more IDs per millisecond. Be ready to justify the split from the numbers.

**Key points:**
- Snowflake: timestamp + worker ID + sequence in 64 bits — sortable and coordination-free.
- Compare against auto-increment (SPOF/bottleneck) and UUIDv4 (distributed but unsortable, poor PK).
- Clock going backwards is the key failure mode — detect skew and stall rather than duplicate.
- Bit allocation is a deliberate capacity decision (years of timestamps vs #nodes vs IDs/ms).
