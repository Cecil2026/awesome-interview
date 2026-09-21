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

---

### 11. Design a distributed cache (Memcached / Redis cluster)

**Frequency:** High

**Difficulty:** Medium
**Topics:** system-design, caching, consistent-hashing, replication, eviction

**Answer:** Frame it as a partitioned in-memory key-value store, then spend your time on how keys map to nodes and what happens when a node dies.

**Step 1 — Clarify what we're building.** The core operations are `get(k)`, `set(k, v, ttl)`, and `delete(k)`; raise out loud whether it's a look-aside cache (app reads DB on miss) or read-through, whether we need persistence, and the eviction policy. The framing conclusion: it's a best-effort cache, so we optimize for latency and availability over strict durability.
**Step 2 — Do the napkin math.** Say 1M QPS, 90%+ reads, values ~1KB, 100GB hot set. That's read-heavy and latency-critical (sub-millisecond target), so everything lives in RAM and we shard across ~20-50 nodes to fit the working set plus headroom.
**Step 3 — Lay out the pieces.** A client library (or proxy like twemproxy/Envoy) that hashes keys to shards, a fleet of cache nodes each holding a slice of the keyspace, and optionally replicas per shard. Data model is flat key → value with a TTL and LRU/LFU metadata.
**Step 4 — Key placement and adding/removing nodes.** This is the scored decision. *Naive `hash(k) % N`* is simple but remaps almost every key when N changes — a cold-start stampede on the DB. *Consistent hashing* with virtual nodes remaps only ~1/N of keys on membership change and spreads load evenly, at the cost of more complex ring management. *Redis Cluster's 16384 hash slots* is a pragmatic middle ground: slots are assigned to nodes and moved explicitly, giving controlled resharding. I'd pick consistent hashing with virtual nodes for a Memcached-style tier, or hash slots if using Redis Cluster.
**Step 5 — Availability and the thundering herd.** Add replicas so a node failure doesn't dump traffic on the DB; on miss use *request coalescing / single-flight* so only one caller recomputes a hot key. Guard against *cache stampede* with early recomputation or randomized TTL jitter, and *cache penetration* (misses for nonexistent keys) with negative caching or a bloom filter.
**Step 6 — Consistency and hot keys.** Cache and DB can diverge; prefer *cache-aside with delete-on-write* over update-on-write to avoid stale races. Detect hot keys (a celebrity key on one shard) and replicate them to multiple nodes or add a small client-side local cache.

**Key points:**
- Consistent hashing (or Redis hash slots) is the whole game — it bounds remapping to ~1/N on membership changes.
- It's a best-effort cache: optimize latency and availability, accept eventual staleness.
- Defend the DB behind it: single-flight, TTL jitter, negative caching, replicas.
- Hot keys break uniform sharding — replicate them or cache locally.

---

### 12. Design a full-text search engine (Elasticsearch-style)

**Frequency:** Medium

**Difficulty:** Hard
**Topics:** system-design, inverted-index, sharding, ranking, indexing-pipeline

**Answer:** Build it around the inverted index, then walk indexing, query serving, ranking, and how you shard and scale.

**Step 1 — Clarify what we're building.** Operations are `index(doc)` and `search(query)` returning ranked results, maybe with filters, facets, and typo tolerance. Key unknowns: corpus size, acceptable index freshness (seconds? minutes?), and whether relevance ranking or exact filtering matters more. Conclusion: this is read-heavy search where query latency and relevance dominate.
**Step 2 — Do the napkin math.** Say 1B documents, ~1KB each = ~1TB raw text, 10K queries/sec. The index is a fraction of raw size but still large, so it must be sharded; queries are bursty and latency-sensitive (target p99 under a few hundred ms), while indexing is a steady background write stream.
**Step 3 — Lay out the pieces.** An ingestion pipeline (tokenize, normalize, stem, remove stopwords) feeding an inverted index (term → posting list of doc IDs + positions + term frequencies), a query coordinator that fans out to shards, and a document store for the original content. Add a segment-based index (immutable segments merged in background) like Lucene.
**Step 4 — Sharding and the scatter-gather query path.** The scored decision. Documents are partitioned across shards; a query is *scattered* to every shard, each returns its top-K, and the coordinator *gathers* and merges. Trade-off in shard count: *too few shards* limits parallelism and caps corpus size per node; *too many shards* multiplies per-query fan-out overhead and coordination cost. Replicas per shard give both availability and query throughput (reads served by any replica). I'd size shards to a target segment size (tens of GB) and scale replicas with query load.
**Step 5 — Ranking relevance.** A boolean match filters candidates, then score them: *TF-IDF/BM25* is the workhorse (term frequency, inverse document frequency, length normalization). For quality, add a two-phase approach — cheap BM25 retrieval to get top-1000, then a *learning-to-rank* or vector re-ranker on that small set. Mention query features: phrase matching, field boosting, typo tolerance via edit-distance/n-grams.
**Step 6 — Near-real-time indexing.** New docs go into small in-memory segments flushed frequently and merged into larger immutable segments; deletes are tombstones applied at merge. This buys near-real-time freshness without rewriting the whole index, at the cost of background merge I/O.

**Key points:**
- The inverted index + scatter-gather over shards is the core architecture.
- BM25 for first-pass relevance; a re-ranking stage for quality.
- Immutable segments + background merge give near-real-time indexing cheaply.
- Shard for corpus size, replicate for throughput and availability.

---

### 13. Design a ride-sharing service (Uber / Lyft)

**Frequency:** High

**Difficulty:** Hard
**Topics:** system-design, geospatial-index, matching, real-time, streaming

**Answer:** Center it on geospatial matching of riders to nearby drivers, then handle location updates, matching, and trip lifecycle.

**Step 1 — Clarify what we're building.** Core flows: drivers stream location, a rider requests a ride, we match them, then track the trip to completion and payment. Key unknowns: matching optimization goal (nearest? lowest ETA? global efficiency?), scale of a city vs global, and surge pricing. Conclusion: the hard part is real-time geospatial matching under constant location churn.
**Step 2 — Do the napkin math.** Say 5M active drivers globally each pinging every 4s = ~1.25M location writes/sec — write-heavy and continuous. Ride requests are far lower (thousands/sec) but latency-critical. Location data is high-volume, low-value-per-write, and naturally partitioned by geography.
**Step 3 — Lay out the pieces.** A location ingestion service writing driver positions to a geospatial index, a matching service, a trip service managing state (requested → matched → en route → completed), and a pricing service. Use a message queue (Kafka) for the location firehose and trip events.
**Step 4 — Geospatial indexing and matching.** The scored decision: how do we find nearby drivers fast? *Geohash* buckets encode lat/long into a string prefix so nearby points share prefixes — simple and queryable, but grid boundaries need neighbor-cell checks. *Google S2 / Uber H3* use hierarchical cells (H3 is hexagonal, giving uniform neighbor distances) — better spatial fidelity. *Naive distance scan* is a non-starter at this scale. I'd shard the index by region and use H3 cells; to match, look up the rider's cell plus adjacent cells and rank candidates by ETA (not raw distance — account for road network and direction). Dispatch with a short quorum window so we optimize over a batch rather than greedily grabbing the first driver.
**Step 5 — Trip state and consistency.** A trip is a state machine; matching must be exactly-once (never assign one driver to two riders) — use a lock/conditional update on the driver record. Persist trip state durably (it maps to money), while location data can be transient in memory/Redis with short TTL.
**Step 6 — Surge and hot spots.** Demand concentrates (airport, concert let-out); compute supply/demand ratio per cell to drive surge pricing, and pre-position via demand prediction. Handle GPS jitter and offline drivers with heartbeats and last-known-location decay.

**Key points:**
- Geospatial index (H3/S2/geohash) partitioned by region is the core; match by ETA, not raw distance.
- Location updates are a write-heavy firehose (transient); trip state is durable (money).
- Matching must be exactly-once — lock the driver during assignment.
- Surge and pre-positioning come from per-cell supply/demand ratios.

---

### 14. Design a food-delivery system (DoorDash / Uber Eats)

**Frequency:** Medium

**Difficulty:** Hard
**Topics:** system-design, matching, geospatial-index, workflow, real-time

**Answer:** It's a three-sided marketplace (eaters, restaurants, couriers); frame it around order lifecycle and courier dispatch, which is the delivery-specific twist over plain ride-sharing.

**Step 1 — Clarify what we're building.** Flows: browse restaurants and menus, place an order, restaurant accepts and cooks, a courier is dispatched, and delivery is tracked. Key unknowns: do we optimize per-order or batch multiple orders per courier, how we handle food-ready timing, and the catalog freshness (menus, availability). Conclusion: the interesting problem is dispatch that couples food prep time with courier travel time.
**Step 2 — Do the napkin math.** Say 20M orders/day ≈ 230 orders/sec average but heavily bursty around lunch/dinner (5-10x peaks). Browsing traffic dwarfs ordering (read-heavy catalog), while dispatch and tracking are the write-heavy, latency-sensitive real-time path during peaks.
**Step 3 — Lay out the pieces.** A catalog service (restaurants, menus, availability), an order service (a durable state machine), a dispatch/matching service using a geospatial index of couriers, a real-time tracking service, and payments. Catalog is cache-heavy; orders and payments are transactional.
**Step 4 — Courier dispatch and batching.** The scored decision. *Greedy nearest-courier* is simple but ignores food-ready time (courier arrives, waits idle) and misses batching. *Optimized batch assignment* solves a small assignment problem over a time window — matching couriers to orders minimizing total time, and *batching* multiple nearby orders (same restaurant or same route) onto one courier to raise efficiency, at the cost of slightly longer individual delivery times. The real lever is timing: dispatch so the courier arrives roughly when food is ready, using a *food-prep-time estimate*. I'd use windowed batch optimization with ETA + prep-time prediction.
**Step 5 — Order state and reliability.** The order is a durable state machine (placed → accepted → cooking → picked-up → delivered) with clear transitions and timeouts (restaurant doesn't accept → reassign or cancel). Payments use auth-on-order, capture-on-delivery to handle cancellations cleanly.
**Step 6 — Freshness and failure modes.** Menu/availability must be fresh — an item sold out mid-order needs graceful handling. Plan for courier no-shows (reassign), restaurant closures, and address errors; keep the eater informed with live ETA updates.

**Key points:**
- Three-sided marketplace; dispatch is the delivery-specific hard part.
- Couple prep-time prediction with courier ETA so pickup timing lines up.
- Batching multiple orders per courier trades individual speed for fleet efficiency.
- Order is a durable state machine; payments auth-then-capture.

---

### 15. Design a hotel / flight reservation system

**Frequency:** Medium

**Difficulty:** Hard
**Topics:** system-design, transactions, concurrency-control, inventory, consistency

**Answer:** This one is about correctness under contention — never double-book finite inventory — so frame it around inventory locking and the booking transaction.

**Step 1 — Clarify what we're building.** Flows: search availability, hold/reserve, then confirm-and-pay. Key unknowns: is inventory finite and unique (seat 14C, room 204) or fungible (any standard room), how long a hold lasts, and whether we integrate external providers (GDS/airlines). Conclusion: the defining constraint is strong consistency on inventory — overbooking is a correctness bug, not a UX annoyance.
**Step 2 — Do the napkin math.** Reads (search) vastly outnumber writes (bookings) — maybe 1000:1. Search is high-volume and can tolerate slightly stale availability; the write path is low-volume but must be strictly correct and contention-heavy on popular dates/flights.
**Step 3 — Lay out the pieces.** A search service over a read-optimized availability cache/index, an inventory service backing a transactional store (the source of truth), a booking/reservation service managing holds, and a payment integration. Separate the read model (fast, eventually consistent) from the write model (correct).
**Step 4 — Preventing double-booking.** The scored decision. *Pessimistic locking* (SELECT ... FOR UPDATE on the inventory row) serializes bookings for a room/seat — correct and simple, but holds locks and can throttle throughput on hot inventory. *Optimistic concurrency* (version number, retry on conflict) scales better under low contention but wastes work when many users grab the last seat. *Reserved-hold pattern*: decrement available count into a temporary hold with a TTL, confirm on payment, release on expiry — this is what real systems do, giving the user time to pay without permanently losing the seat. I'd use a hold with a short TTL, backed by a conditional/atomic decrement so two holds can't oversell.
**Step 5 — Consistency between search and truth.** Search reads a cache that may lag; that's acceptable because the authoritative check happens at hold-time (the atomic decrement). Show "only 2 left" optimistically but only commit against the transactional inventory.
**Step 6 — Idempotency and expiry.** Payment and confirmation must be idempotent (network retries can't double-charge or double-book) via an idempotency key. Expire abandoned holds to return inventory; reconcile with external providers (airlines) that are the ultimate source for their own seats.

**Key points:**
- Strong consistency on inventory is the whole point — overbooking is a bug.
- Hold-with-TTL + atomic decrement is the canonical pattern; confirm on payment.
- Split fast eventually-consistent search from correct transactional booking.
- Idempotency keys on payment/confirm prevent double-charge on retries.

---

### 16. Design a payment system / digital wallet

**Frequency:** High

**Difficulty:** Hard
**Topics:** system-design, transactions, idempotency, ledger, consistency

**Answer:** Money demands correctness and auditability, so frame it around a double-entry ledger, idempotency, and how you coordinate across external processors.

**Step 1 — Clarify what we're building.** Flows: fund a wallet, pay/transfer, withdraw, and check balance. Key unknowns: are we the ledger of record or a facade over banks/card networks, single vs multi-currency, and regulatory/audit requirements. Conclusion: correctness, auditability, and idempotency dominate — you cannot lose or duplicate money.
**Step 2 — Do the napkin math.** Volume is modest vs a social feed (say thousands of TPS) but every write is high-value and must be durable and consistent. It's write-heavy in the sense that every operation mutates balances, and reads (balance) must reflect committed state.
**Step 3 — Lay out the pieces.** An API/orchestration layer, a double-entry ledger service (the source of truth — every transaction is balanced debits and credits across accounts), a wallet/balance service, integrations with external payment processors/banks, and a reconciliation job. The ledger is append-only and immutable.
**Step 4 — Consistency across services and external processors.** The scored decision. A payment touches multiple systems (our ledger + an external processor) that can't share one ACID transaction. *Distributed 2PC* gives atomicity but is fragile and blocking across systems you don't control. *Saga with compensating transactions* is the practical choice: execute steps in sequence, and on failure run compensations (refund, reverse) — eventually consistent but resilient. *Outbox pattern* ensures the ledger write and the "publish payment event" happen atomically (write to an outbox table in the same DB transaction, relay asynchronously). I'd use a saga orchestrated over an outbox, with the ledger as the authoritative record.
**Step 5 — Idempotency and exactly-once effects.** Every mutating call carries an *idempotency key*; the server records the key + result so retries return the original outcome instead of double-charging. External callbacks (webhooks) also arrive multiple times — dedupe them. State transitions are explicit (pending → settled → refunded).
**Step 6 — Reconciliation, audit, and fraud.** Nightly reconciliation compares our ledger against processor statements to catch drift. Keep an immutable audit trail. Add fraud checks (velocity limits, anomaly detection) and handle partial failures (money left the source but processor timed out) via the saga's compensation and a manual-review queue.

**Key points:**
- Double-entry, append-only ledger is the source of truth — every entry balances.
- Idempotency keys everywhere; retries and duplicate webhooks must not double-move money.
- Saga + outbox for cross-service/external consistency, not 2PC.
- Reconciliation and immutable audit trails are non-negotiable for money.

---

### 17. Design a stock exchange / trading matching engine

**Frequency:** Low

**Difficulty:** Hard
**Topics:** system-design, matching-engine, low-latency, ordering, determinism

**Answer:** This is a latency-and-correctness problem: frame it around the order book, deterministic matching, and how you get microsecond latency with strict ordering.

**Step 1 — Clarify what we're building.** Flows: submit/cancel orders (limit, market), match buys against sells, publish fills and market data. Key unknowns: matching rules (price-time priority?), latency target, and fairness/regulatory guarantees. Conclusion: the core is a deterministic, single-threaded-per-symbol matching engine with strict ordering and ultra-low latency.
**Step 2 — Do the napkin math.** A hot symbol can see hundreds of thousands of order events/sec, with a latency target in *microseconds*, not milliseconds. It's write-heavy and extremely latency-sensitive; throughput bursts around market open/close and news events. This rules out anything that touches disk or network on the hot path.
**Step 3 — Lay out the pieces.** A gateway (auth, risk checks, rate limits), a sequencer that assigns a total order to incoming messages, the matching engine holding the order book per symbol in memory, and market-data + fills publishers. Persistence is via an event log, not a database on the hot path.
**Step 4 — The matching engine and the order book.** The scored decision. The order book is two sorted structures (bids descending, asks ascending); matching applies *price-time priority* — best price first, ties broken by arrival time. Design choice: *single-threaded per symbol* is the standard — one thread owns a symbol's book, eliminating locks and giving determinism (given the same input sequence, same output), which is essential for auditability and replay. Scale *horizontally by sharding symbols across engines*, not by threading one book. Keep the book in cache-friendly in-memory structures (arrays/intrusive lists) rather than a general map for latency.
**Step 5 — Ordering, durability, and recovery.** A *sequencer* stamps every event with a monotonic sequence number before matching, giving a single source of truth for order; the matching engine consumes this ordered stream. Durability via an *append-only event log* (write the input sequence, replay to rebuild state) rather than persisting book snapshots synchronously. On failover, a hot standby replays the log to the same deterministic state.
**Step 6 — Risk, fairness, and abuse.** Pre-trade risk checks (buying power, position limits) happen at the gateway before the engine. Fairness matters (no queue-jumping); guard against manipulation (spoofing, quote stuffing) with rate limits and surveillance downstream, off the hot path.

**Key points:**
- Deterministic, single-threaded-per-symbol matching with price-time priority.
- A sequencer gives strict total ordering; the event log gives durability and replay.
- Everything on the hot path is in-memory — no disk/DB/network synchronously.
- Scale by sharding symbols across engines, not by parallelizing one book.

---

### 18. Design an ad-serving / real-time bidding system

**Frequency:** Medium

**Difficulty:** Hard
**Topics:** system-design, low-latency, auction, budgeting, ranking

**Answer:** Frame it around the tight-latency auction: given an impression, select and price the best ad within a strict deadline, while respecting budgets.

**Step 1 — Clarify what we're building.** Flow: a request for an ad slot arrives, candidate ads are retrieved and ranked, an auction picks a winner and price, and the winning ad is served and later attributed (clicks/conversions). Key unknowns: the latency budget (RTB is ~100ms end to end), targeting richness, and budget-pacing goals. Conclusion: it's a low-latency retrieve-rank-auction pipeline with hard budget constraints.
**Step 2 — Do the napkin math.** Say 1M ad requests/sec, each needing candidate lookup + scoring + auction under ~10-50ms server-side. Massively read-heavy on targeting/candidate data, with a firehose of impression/click events flowing back for billing and model training. Latency is the binding constraint.
**Step 3 — Lay out the pieces.** An ad exchange/request entry point, a targeting/candidate-retrieval service (which ads are eligible for this user/context), a ranking service (predict click/conversion probability), an auction service, a budget/pacing service, and an event pipeline for impressions/clicks feeding billing and ML. Candidate data lives in fast in-memory stores.
**Step 4 — Candidate selection, ranking, and auction.** The scored decision. First *retrieve* eligible ads via targeting (inverted index / in-memory match on user + context) to cut millions of ads to hundreds. Then *rank* by expected value = bid × predicted CTR/CVR (a fast ML model, often a two-tower or GBDT served in-memory). Then run the *auction*: a *second-price (Vickrey)* auction charges the winner the runner-up's bid — incentive-compatible so advertisers bid truthfully — versus a *first-price* auction (winner pays their bid), now common in header bidding but requiring bid shading. I'd retrieve → score by eCPM → second-price auction, all within the latency budget.
**Step 5 — Budget pacing and consistency.** Advertisers have daily budgets; overspending is a real loss, so *pace* spend across the day (probabilistic throttling) rather than blowing the budget by noon. Budget counters are distributed and updated at high rate — use approximate/local counters with periodic reconciliation rather than a global lock per impression (accept slight overspend over strict correctness at this QPS).
**Step 6 — Attribution, fraud, and freshness.** Impression and click events arrive asynchronously and must be joined for attribution and billing (dedupe, handle late events). Filter *click fraud / invalid traffic* before billing. Keep budget and targeting data fresh enough that a paused campaign stops quickly.

**Key points:**
- Retrieve → rank by eCPM (bid × predicted CTR) → auction, all under ~50ms.
- Second-price auction is truthful; first-price needs bid shading.
- Budget pacing with approximate distributed counters beats a per-impression global lock.
- The event pipeline (impressions/clicks) drives billing, attribution, and model training.

---

### 19. Design a recommendation system

**Frequency:** Medium

**Difficulty:** Hard
**Topics:** system-design, ml-serving, candidate-generation, ranking, feature-store

**Answer:** Frame it as the industry-standard two-stage funnel — cheap candidate generation then expensive ranking — plus how you serve it fast and keep it fresh.

**Step 1 — Clarify what we're building.** Goal: given a user (and context), return a ranked list of items they'll engage with. Key unknowns: the objective (clicks? watch-time? long-term retention?), online vs batch serving, and the cold-start problem for new users/items. Conclusion: it's a retrieval-then-ranking ML system where quality and latency trade off explicitly.
**Step 2 — Do the napkin math.** Say 100M users, 10M items, needing recommendations in tens of milliseconds per request. Scoring all 10M items per request is impossible online — that's the forcing function for a funnel that narrows millions of items to a few hundred candidates before expensive ranking. Read-heavy serving; a large batch pipeline computes embeddings/features offline.
**Step 3 — Lay out the pieces.** An offline pipeline (train models, compute item/user embeddings), a candidate-generation service (fast retrieval), a ranking service (heavy model), a feature store serving user/item/context features online, and a serving layer applying business rules/diversity/dedup. Log impressions and engagement to close the training loop.
**Step 4 — Two-stage retrieval and ranking.** The scored decision. *Candidate generation* narrows the catalog cheaply: options are *collaborative filtering* (users who liked X liked Y — strong signal but cold-start weak), *content-based* (item feature similarity — handles new items), and *embedding + approximate nearest neighbor* (two-tower model → ANN index like HNSW/FAISS, the modern default, blending signals). Usually you blend several sources. Then *ranking* scores those few hundred candidates with a heavy model (deep net / GBDT) using rich cross features, optimizing the true objective. The trade-off is precision vs latency at each stage; the funnel exists to spend compute only where it pays off.
**Step 5 — Serving, freshness, and features.** A *feature store* gives consistent features online and offline (avoid training/serving skew). Precompute what you can (user embeddings refreshed periodically) and compute context features at request time. Cache candidate lists for hot users. Update models regularly; some signals (just-watched item) need near-real-time features.
**Step 6 — Cold start, diversity, and feedback loops.** New users get popularity/context-based fallbacks; new items get content-based exposure and exploration. Add *diversity/de-duplication* so the list isn't ten near-identical items, and *exploration* (bandits) to avoid a feedback loop that only ever shows what the model already favors.

**Key points:**
- Two-stage funnel: cheap candidate generation → heavy ranking; it exists to bound latency.
- Two-tower embeddings + ANN is the modern retrieval workhorse; blend with CF/content.
- Feature store prevents train/serve skew; precompute where possible.
- Handle cold start and add exploration/diversity to break feedback loops.

---

### 20. Design a leaderboard / ranking system

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, sorted-set, redis, sharding, real-time

**Answer:** Frame it around a sorted-set data structure for O(log n) rank queries, then handle scale, ties, and huge player counts.

**Step 1 — Clarify what we're building.** Operations: update a player's score, get top-N, and get a player's own rank (and neighbors). Key unknowns: total players, how many are on the global board, real-time vs periodic, and time windows (all-time, daily, weekly). Conclusion: the interesting challenge is efficient rank lookup, not just top-N, at scale.
**Step 2 — Do the napkin math.** Say 100M players, frequent score updates during play (write bursts around events), and very frequent reads of top-N and "my rank." Reads dominate and both score updates and rank reads must be fast. A naive `ORDER BY score` over 100M rows per rank query won't hold up.
**Step 3 — Lay out the pieces.** A score-ingestion service, a ranking store (the crux), and a query API for top-N and per-player rank. The natural fit is a *sorted set* (Redis ZSET, a skip-list + hash) giving O(log n) inserts and rank queries, with a durable store (DB) as the system of record behind it.
**Step 4 — The ranking data structure and computing rank at scale.** The scored decision. *Relational `ORDER BY` + COUNT* is trivial but O(n) per rank query — fine for small boards, dies at millions. *Redis sorted set* gives O(log n) `ZADD`/`ZRANK`/`ZREVRANGE` and is the default answer — top-N and a player's rank are both cheap. At 100M+ players a single ZSET gets large/hot, so *shard*: either partition by score range (rank = sum of counts in higher ranges — needs bucketed counts) or keep a global ZSET for the top tier and approximate deep ranks. For most players the exact global rank matters less than "top 5%," so *approximate ranking via score-bucket histograms* is a common scaling trick. I'd use Redis ZSET for the active/top board and bucketed approximation for deep ranks.
**Step 5 — Freshness, ties, and durability.** Updates apply in real time to the ZSET; ties break by a secondary key (earliest timestamp) by encoding it into the score. Redis is the fast serving layer but not the source of truth — persist scores to a DB and rebuild the ZSET on failure. For time-windowed boards, key ZSETs by window (e.g., `lb:daily:2026-09-21`) and expire them.
**Step 6 — Hot keys and abuse.** A single global board is a hot key — replicate reads and cache top-N (it changes slowly at the very top). Validate/anti-cheat score submissions server-side (signed, rate-limited) so the board isn't polluted.

**Key points:**
- Redis sorted set (ZSET) is the canonical answer: O(log n) updates and rank queries.
- For 100M+ players, shard or use score-bucket approximation for deep ranks.
- Encode tie-breakers into the score; DB is source of truth, ZSET is the serving layer.
- Time-windowed boards are separate expiring keys; cache/replicate the hot top-N.

---

### 21. Design a distributed job / cron scheduler at scale

**Frequency:** High

**Difficulty:** Hard
**Topics:** system-design, scheduling, distributed-systems, fault-tolerance, leader-election

**Answer:** Walk it as a durable store of schedules plus a dispatch loop, then spend your time on how you avoid double-firing and missed fires under failure.

**Step 1 — Clarify what we're building.** Core ops are register a job (fixed time, recurring cron, or delay), run it near its due time, and retry on failure. Raise the big unknowns: at-least-once vs exactly-once execution, how much clock skew we tolerate, and whether jobs are seconds-granular or minute-granular. The framing conclusion: treat execution as *at-least-once + idempotent jobs* — exactly-once at the executor is impractical.
**Step 2 — Do the napkin math.** Say 100M scheduled jobs, 10k firing per second at peak. That's write-light but the due-time scan is the hot path; it's bursty (top-of-minute and midnight spikes). Storage is ~100M rows × ~1KB = 100GB — trivial; the challenge is scan latency, not size.
**Step 3 — Lay out the pieces.** A durable schedule store (sharded DB) holding job + next_fire_time; a set of scheduler workers that pull due jobs; a queue (Kafka/SQS) between scheduling and execution; executor workers that run the payload; and a dead-letter path for repeated failures.
**Step 4 — How do we find due jobs and fire each exactly once?** The scored decision. *Option A — poll a time-indexed DB:* every worker queries `WHERE next_fire <= now` on its shard, claims rows via a conditional update / lease. Simple, but many workers hammer the index. *Option B — time-bucketed / hashed wheel:* bucket jobs into per-minute partitions so a worker owns a bucket via leader election or consistent hashing — no contention, but rebalancing on failover is fiddly. *Option C — timer wheel in memory* fed by the DB for the next N minutes: lowest latency for sub-second jobs, but must reload state after a crash. Prefer B for scale with a lease/claim so exactly one worker fires each job; combine with the queue so execution is decoupled.
**Step 5 — Handle failure without missing or duplicating fires.** Use leases with TTL: a worker claims a job for T seconds; if it dies, the lease expires and another retries — hence at-least-once. Persist `last_fired` before dispatch so recovery doesn't refire. Cap catch-up: after downtime, either fire-once or skip missed occurrences per policy, never replay hours of cron ticks.
**Step 6 — Guard rails.** Idempotency keys per (job, fire_time) so downstream dedupes; jitter the top-of-minute stampede; isolate tenants so one noisy job can't starve the dispatch loop; alert on jobs that miss their SLA window.

**Key points:**
- At-least-once delivery + idempotent jobs is the realistic contract; don't promise exactly-once execution.
- The core mechanism is a durable next_fire_time plus a lease/claim so exactly one worker fires each occurrence.
- Time-bucketing (partition by minute) with consistent hashing beats everyone polling one index.
- Decouple scheduling from execution with a queue; retries and DLQ live on the execution side.
- Have an explicit catch-up policy for downtime so you don't replay a backlog of ticks.

---

### 22. Design a distributed message queue (Kafka-style)

**Frequency:** High

**Difficulty:** Hard
**Topics:** system-design, messaging, replication, partitioning, durability

**Answer:** Frame it as an append-only partitioned log with replication, then spend your time on ordering, durability, and consumer offset semantics.

**Step 1 — Clarify what we're building.** Producers write messages to topics; consumers read them; we need durability, high throughput, and configurable ordering. Key unknowns: ordering guarantee (per-partition vs global), delivery semantics (at-least-once default), and retention (time/size based). Framing conclusion: model each topic as N *partitions*, each an ordered append-only log — ordering is only guaranteed within a partition.
**Step 2 — Do the napkin math.** Say 1M messages/sec, 1KB each = 1GB/sec write, ~86TB/day before retention trims it. This is write-heavy and sequential — perfect for append-only disk and OS page cache. Reads are mostly sequential too (consumers tail the log), so sequential I/O dominates and random seeks are the enemy.
**Step 3 — Lay out the pieces.** Brokers own partition replicas; each partition is a segmented log on disk (segment files + sparse index). A metadata/coordination layer (ZooKeeper/KRaft) tracks partition→leader assignment and membership. Producers hash a key to pick a partition; consumers form consumer groups; a coordinator assigns partitions to group members.
**Step 4 — Replication and the durability/latency trade-off.** The scored decision. Each partition has one leader and R followers; writes go to the leader and replicate. *Option A — ack after leader write only (acks=1):* lowest latency, but a leader crash before replication loses data. *Option B — ack after in-sync replicas persist (acks=all + ISR):* durable, survives leader loss, but latency and throughput drop and a shrinking ISR stalls writes. *Option C — quorum writes:* balance, but more complex leader election. Choose ISR-based acks=all for durability with a configurable min-ISR so producers trade safety vs latency per topic. On leader failure, elect a new leader from the ISR only, so no committed message is lost.
**Step 5 — Consumer offsets and delivery semantics.** Consumers track a per-partition offset; committing after processing gives at-least-once (reprocess on crash), committing before gives at-most-once. Exactly-once needs idempotent producers (sequence numbers) plus transactional commits linking offset + output. Store offsets in an internal topic so they survive rebalances.
**Step 6 — Retention, backpressure, and hot partitions.** Retain by time/size and compact keyed topics to keep latest value; expose consumer lag as the health metric; a hot key skews one partition, so pick partition keys carefully or over-partition. Segment + sparse index makes deletes cheap (drop old segments).

**Key points:**
- Ordering is per-partition only; parallelism and ordering trade off through partition count.
- Append-only segmented logs + sequential I/O + page cache are why it's fast.
- Durability comes from leader/follower replication with ISR and acks=all; elect leaders only from the ISR.
- Consumer-controlled offsets decide at-least-once vs at-most-once; exactly-once needs idempotence + transactions.
- Consumer lag is the key operational signal; hot partitions are the main skew risk.

---

### 23. Design a pub/sub system

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, messaging, fan-out, decoupling, delivery-semantics

**Answer:** Frame it as decoupling publishers from many subscribers via topics, then focus on fan-out strategy and delivery guarantees.

**Step 1 — Clarify what we're building.** Publishers send messages to a topic; every interested subscriber gets a copy — one-to-many, unlike a queue's one-to-one. Unknowns to raise: do subscribers need durable/replayable history or just live delivery, delivery semantics, and expected fan-out ratio (1 message → how many subscribers?). Framing conclusion: fan-out ratio drives the whole design.
**Step 2 — Do the napkin math.** Say 100k publishes/sec with average fan-out of 1000 subscribers = 100M deliveries/sec. The amplification is the story: modest ingest, enormous delivery. This is delivery-heavy and often bursty (a popular topic spikes).
**Step 3 — Lay out the pieces.** A broker layer holding topics and subscriptions; a subscription registry mapping topic→subscribers; a delivery layer pushing to subscribers (or letting them pull); optional per-subscriber durable buffers for offline consumers.
**Step 4 — Fan-out on write vs fan-out on read.** The scored decision. *Fan-out on write (push):* when a message arrives, copy it into each subscriber's buffer/connection immediately — low read latency, great for many active subscribers, but expensive for topics with millions of mostly-idle subscribers (write amplification). *Fan-out on read (pull):* keep one copy in the topic log; subscribers read at their own offset — cheap storage, natural replay, but each subscriber polls/maintains position (Kafka-style). *Hybrid:* push to online subscribers, pull-from-log for reconnecting ones. Pick fan-out-on-read for durability/replay and huge subscriber counts; push for low-latency live delivery to a bounded set.
**Step 5 — Delivery semantics and slow subscribers.** At-least-once by default (retry until ack). A slow or dead subscriber must not block others — give each an independent buffer with a bounded size, and drop / spill to disk / disconnect per policy when it overflows. Acks + retries per subscriber, not per topic.
**Step 6 — Filtering and guard rails.** Support attribute/content filtering so subscribers get only relevant messages (push filter to the broker to cut delivery volume); dedupe with message IDs; isolate topics so one hot topic can't starve others.

**Key points:**
- Pub/sub is one-to-many; the fan-out ratio dominates the design.
- Fan-out-on-write minimizes read latency; fan-out-on-read minimizes storage and enables replay — often hybrid.
- Give each subscriber an independent bounded buffer so one slow consumer doesn't block the topic.
- At-least-once with per-subscriber acks/retries is the default contract.
- Broker-side filtering cuts unnecessary delivery amplification.

---

### 24. Design a distributed lock service

**Frequency:** Medium

**Difficulty:** Hard
**Topics:** system-design, consensus, coordination, fault-tolerance, leases

**Answer:** Frame it as mutual exclusion across processes backed by a consensus store, then confront the hard truth that a lock without fencing isn't safe.

**Step 1 — Clarify what we're building.** Clients acquire a named lock, hold it, release it; only one holder at a time. Critical unknowns: what happens when a holder crashes or pauses (GC), do we need fairness, and is the lock for correctness or just efficiency. Framing conclusion: because clients can die or pause arbitrarily, every lock needs a *lease (TTL) + fencing token* — this is the make-or-break insight.
**Step 2 — Do the napkin math.** Locks are low-volume but latency-sensitive: maybe 10k acquire/release per second, sub-10ms. Tiny data (lock name → owner + expiry), but every op must go through consensus, so throughput is bounded by the consensus round-trip, not storage.
**Step 3 — Lay out the pieces.** A replicated coordination store (etcd/ZooKeeper/Chubby) running Raft/Paxos; a lock = a key with an owner, an expiry (lease), and a monotonically increasing version. Clients acquire via compare-and-set on that key.
**Step 4 — Leases and fencing tokens (why naive locks fail).** The scored decision. A lock with only a TTL is unsafe: a client can hold the lock, pause for a long GC past the TTL, the lock expires and is granted to another, then the first client wakes and acts — two holders. *Fix — fencing tokens:* the lock service returns a monotonically increasing token on each grant; the protected resource rejects any write with a token lower than the highest it has seen. *Trade-off:* the resource must be fencing-aware, but this is the only way to get correctness under pauses. *Alternative — pure TTL:* fine only for efficiency locks (avoid duplicate work) where double-execution is merely wasteful, not incorrect.
**Step 5 — Availability and consensus.** Back the lock state with Raft across an odd number of nodes so a minority failure survives; leader serves acquire/release. Renewal (heartbeat) extends the lease while the holder is alive; if heartbeats stop, the lease expires and the lock frees automatically — no manual cleanup of dead holders.
**Step 6 — Guard rails.** Clock skew: use the lock service's clock, not clients'; watch-based notification instead of busy polling; support blocking-acquire with a queue for fairness; set sane TTLs (too short = spurious loss, too long = slow recovery).

**Key points:**
- A lease/TTL alone is unsafe under GC pauses — you need fencing tokens and a resource that enforces them.
- Distinguish correctness locks (must fence) from efficiency locks (TTL is enough).
- State lives in a Raft/Paxos store; throughput is bounded by the consensus round-trip.
- Heartbeat-renewed leases auto-free locks held by dead clients.
- Never trust client clocks for expiry; use watches over polling.

---

### 25. Design a configuration / feature-flag service

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, configuration, caching, consistency, targeting

**Answer:** Frame it as a read-dominated store of flags with targeting rules, then focus on how clients evaluate flags fast without hammering the server.

**Step 1 — Clarify what we're building.** Ops: define a flag with targeting rules (%, user segments, environments), let services read the current value, and change it fast to roll out or kill a feature. Unknowns: staleness tolerance (how fast must a change propagate?), evaluation location (server-side vs in-SDK), and whether it's boolean flags or full config blobs. Framing conclusion: this is overwhelmingly read-heavy — optimize reads, accept eventual consistency.
**Step 2 — Do the napkin math.** Millions of flag evaluations per second across the fleet, but writes are rare (a few thousand a day). Ratio is like 1M:1 read:write. So the answer is caching everywhere; the source-of-truth store is tiny and barely loaded.
**Step 3 — Lay out the pieces.** A control-plane store for flag definitions + targeting rules; a distribution layer that pushes/serves the current ruleset; client SDKs that cache rules locally and evaluate in-process; an audit log of every change (who/when/what).
**Step 4 — Evaluate in the SDK vs call the server per check.** The scored decision. *Server-side evaluation (call per flag check):* always fresh, central logic, but adds a network hop to the hot path and a hard dependency — if the service is down, your app stalls. *Client-side / in-SDK evaluation:* the SDK downloads the whole ruleset and evaluates locally, so checks are in-memory and zero-latency and survive outages; the cost is propagation delay and shipping rules to every client. *Streaming push (SSE/websocket) vs polling for updates:* push cuts propagation to seconds but needs persistent connections; polling every 30–60s is simpler and usually fine. Choose in-SDK evaluation with streamed/polled rule updates and a last-known-good local cache.
**Step 5 — Consistency, staleness, and safe rollout.** Accept eventual consistency (seconds of skew across the fleet is fine). Support percentage rollouts via a stable hash of the user ID so a user's bucket is deterministic and sticky. A kill switch must propagate fastest — treat it as high priority.
**Step 6 — Guard rails.** Always serve a default value if the service/cache is unavailable (fail open or closed per flag); audit + version every change and support instant rollback; guard against a bad rule taking down all clients (validate before publish, canary the ruleset).

**Key points:**
- Extreme read:write ratio — cache everywhere and accept eventual consistency.
- In-SDK evaluation removes the hot-path hop and survives outages; the trade is propagation delay.
- Push (streaming) propagates in seconds; polling is simpler — choose per staleness need.
- Percentage rollouts use a stable hash of the user ID for deterministic, sticky bucketing.
- Fail to a safe default, version every change, and support instant rollback / kill switch.

---

### 26. Design a service-discovery system

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, service-discovery, health-checking, consistency, caching

**Answer:** Frame it as a live registry of healthy instances, then focus on health checking and the availability-vs-consistency choice.

**Step 1 — Clarify what we're building.** Services register their address on startup and deregister on shutdown; clients look up healthy instances for a service name. Unknowns: client-side vs server-side discovery, how fast a dead instance must disappear, and staleness tolerance. Framing conclusion: it's better to briefly serve a stale-but-mostly-healthy list than to be unavailable — favor availability (AP) over strict consistency.
**Step 2 — Do the napkin math.** Registrations are low-rate (instances come and go on deploy/scale), but lookups are extremely frequent — every caller resolving targets, potentially millions/sec, so it's read-heavy. Data is tiny (service → list of IP:port + metadata).
**Step 3 — Lay out the pieces.** A registry store (highly available, often gossip- or Raft-backed); a registration API + health-check subsystem; a query API; and client-side caches so lookups don't hit the registry per request.
**Step 4 — Health checking: push heartbeats vs pull probes.** The scored decision. *Pull (registry probes each instance):* the registry actively health-checks endpoints — accurate, but N probes don't scale and cross-network probing is noisy. *Push (instances heartbeat to the registry):* each instance renews a lease periodically; miss enough and it's evicted — scales far better and is the common choice (Eureka/Consul), but a network partition can wrongly evict a whole zone. *Mitigation — self-preservation:* if too many instances vanish at once, assume it's a network issue and stop evicting rather than empty the registry. Choose heartbeat/lease with self-preservation.
**Step 5 — Consistency model and client caching.** Registry is AP: a partitioned node serves its (possibly stale) view rather than erroring. Clients cache the instance list and refresh async, so a registry blip doesn't break traffic. Combine with client-side load balancing over the returned list.
**Step 6 — Guard rails.** Deregister gracefully on shutdown to avoid routing to draining instances; TTL tuning (too short = flapping, too long = traffic to dead hosts); include metadata (zone, version) so clients can do locality-aware or canary routing.

**Key points:**
- Read-heavy: optimize lookups and cache on the client.
- Favor AP — a slightly stale healthy list beats an unavailable registry.
- Heartbeat/lease health checks scale better than the registry probing everyone.
- Self-preservation prevents a partition from emptying the registry.
- Client-side caching + graceful deregistration keep traffic stable during registry blips.

---

### 27. Design an API gateway

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, api-gateway, routing, rate-limiting, auth

**Answer:** Frame it as the single entry point that offloads cross-cutting concerns from services, then focus on request lifecycle and keeping it from becoming a bottleneck.

**Step 1 — Clarify what we're building.** The gateway sits in front of backend services and handles routing, auth, rate limiting, TLS termination, and request/response transformation. Unknowns: how much logic belongs here vs in services (avoid a fat gateway), north-south only or also east-west, and latency budget. Framing conclusion: keep it a thin, stateless cross-cutting layer; business logic stays in services.
**Step 2 — Do the napkin math.** It sits on the critical path of every external request — say 100k req/sec — so its own added latency (target <5–10ms) and availability directly cap the whole system. It's stateless per request but must be horizontally scalable and highly available; it's the SPOF if not replicated.
**Step 3 — Lay out the pieces.** A pool of stateless gateway nodes behind a load balancer; a config/route store; a plugin pipeline (auth → rate limit → transform → route); integration with service discovery for upstreams; and a shared store (Redis) for state like rate-limit counters.
**Step 4 — The request pipeline and where cross-cutting logic lives.** The scored decision. Order the pipeline deliberately: terminate TLS, authenticate/authorize (validate JWT or call auth service), rate-limit, then route to the upstream. *Auth trade-off — validate JWT locally vs call an auth service per request:* local validation (verify signature) is fast and stateless but can't instantly revoke; a central check is authoritative but adds a hop — often local validation + short token TTL. *Rate-limit trade-off — per-node counters vs shared store:* per-node is fast but lets N nodes each allow the limit (N× overshoot); a shared Redis counter (token bucket) is globally accurate but adds latency and a dependency — pick shared for correctness with local fallback. Keep transformation light; don't put orchestration here.
**Step 5 — Resilience and not being a bottleneck.** Stateless nodes scale horizontally; use timeouts, retries with backoff, and circuit breakers per upstream so one slow service doesn't exhaust gateway threads. Isolate upstreams (bulkheads) and shed load when overwhelmed.
**Step 6 — Guard rails.** Cache auth/config lookups; per-client and per-route rate limits to stop abuse; observability (trace ID injected here) end to end; versioned routes for safe API evolution.

**Key points:**
- Keep it thin, stateless, and horizontally scalable — it's on every request's critical path.
- Deliberate pipeline order: TLS → auth → rate limit → route.
- Local JWT validation vs central auth trades revocation speed for latency; shared vs per-node rate limits trades accuracy for latency.
- Circuit breakers, timeouts, and bulkheads stop one bad upstream from taking down the gateway.
- Don't put business logic or orchestration in the gateway.

---

### 28. Design a load balancer

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, load-balancing, health-checking, high-availability, hashing

**Answer:** Frame it as distributing traffic across healthy backends, then focus on the L4-vs-L7 choice, the balancing algorithm, and not being a single point of failure.

**Step 1 — Clarify what we're building.** It spreads incoming requests across a backend pool, removes unhealthy nodes, and must itself be highly available. Unknowns: layer 4 (TCP) vs layer 7 (HTTP), whether sessions need stickiness, and connection vs request granularity. Framing conclusion: the L4/L7 choice determines features and cost, so decide it first.
**Step 2 — Do the napkin math.** It's on the path of all traffic — say millions of connections, 100k+ req/sec — so throughput and added latency are the whole game. L4 pushes packets and scales to very high throughput cheaply; L7 parses HTTP so it's richer but costs more CPU per request.
**Step 3 — Lay out the pieces.** The LB tier itself (multiple instances), a backend pool with health checks, a control plane for config/pool membership, and a mechanism to make the LB itself HA (VIP + failover, or ECMP/anycast across many LBs).
**Step 4 — L4 vs L7 and the balancing algorithm.** The scored decision. *L4 (transport):* forwards packets/connections by IP:port without reading payload — extremely fast, protocol-agnostic, but no content routing or HTTP-aware features. *L7 (application):* terminates HTTP, so it can route by path/header, do TLS termination, retries, and cookie stickiness — feature-rich but heavier. For the algorithm: *round-robin* is simple but ignores load; *least-connections* adapts to uneven request costs; *consistent hashing* keeps a client/key pinned to a backend (good for cache locality/stickiness) and minimizes reshuffling when the pool changes. Choose L7 when you need content routing and stickiness, L4 for raw throughput; least-connections or consistent-hash over plain round-robin.
**Step 5 — Health checking and not being a SPOF.** Active health checks (probe an endpoint) plus passive (eject on errors) remove bad backends; drain connections before removal. Make the LB itself redundant: active-passive with a floating VIP, or active-active behind anycast/ECMP so a dead LB just drops out. 
**Step 6 — Guard rails.** Slow-start new backends to avoid overload; outlier detection to eject flapping nodes; connection draining on deploy; watch for hot backends when using stickiness/hashing.

**Key points:**
- L4 = fast, protocol-agnostic packet forwarding; L7 = HTTP-aware routing, TLS, stickiness at higher cost.
- Least-connections adapts to uneven load; consistent hashing gives stickiness and minimal reshuffle on pool change.
- The LB must not be a SPOF — use VIP failover or anycast/ECMP for active-active.
- Active + passive health checks plus connection draining keep traffic off bad or draining nodes.
- Slow-start and outlier detection prevent overloading fresh or flapping backends.

---

### 29. Design a content delivery network (CDN)

**Frequency:** Medium

**Difficulty:** Hard
**Topics:** system-design, cdn, caching, geo-routing, invalidation

**Answer:** Frame it as caching content at edge locations near users, then focus on request routing, cache hierarchy, and invalidation.

**Step 1 — Clarify what we're building.** Cache static (and some dynamic) content at globally distributed edge PoPs so users fetch from nearby, cutting latency and origin load. Unknowns: content mix (static assets vs video vs dynamic), how fresh content must be, and cache-hit-ratio target. Framing conclusion: the goal is maximize edge hit ratio while keeping content acceptably fresh — those two pull against each other.
**Step 2 — Do the napkin math.** Say 90%+ of bytes should be served from the edge. If origin serves 10Gbps and hit ratio is 95%, the edge fleet serves ~200Gbps while origin sees only 5%. This is massively read-heavy and geographically distributed; the win is offloading origin and cutting RTT.
**Step 3 — Lay out the pieces.** Edge PoPs (cache servers) worldwide; a routing layer to send users to the best PoP; a tiered cache (edge → regional/shield → origin); the origin itself; and a control plane for config, purge, and analytics.
**Step 4 — How do we route users to the nearest healthy PoP?** The scored decision. *DNS-based routing:* the CDN's authoritative DNS returns an edge IP based on resolver geo/latency — simple and widely used, but granularity is limited to the resolver's location and TTLs slow failover. *Anycast:* the same IP is announced from every PoP and BGP routes users to the topologically nearest — fast failover and no DNS guessing, but you can't finely control which PoP and BGP can reroute mid-connection. *Trade-off:* DNS gives control and rich policy; anycast gives simplicity and fast failover; large CDNs combine both. Pair either with health-aware routing so a down PoP is pulled out.
**Step 5 — Cache hierarchy and origin protection.** A miss at the edge goes to a regional shield tier before origin, so a cold or unpopular object doesn't stampede origin. Coalesce concurrent misses for the same object into one origin fetch (request collapsing) to prevent thundering herds. Honor Cache-Control/TTL and use conditional revalidation (ETag/If-Modified-Since).
**Step 6 — Invalidation and freshness.** The hard part of caching. Support TTL expiry, explicit purge (by URL or tag), and cache-busting via versioned URLs (preferred — immutable content never needs purging). Purge must propagate to all PoPs quickly for takedowns. Handle large media with range requests and segment caching.

**Key points:**
- Success metric is edge hit ratio; a tiered edge→shield→origin cache protects the origin.
- DNS routing gives policy control; anycast gives fast failover — big CDNs use both, always health-aware.
- Request collapsing / coalescing prevents thundering herds on origin for hot misses.
- Invalidation is the hard part: prefer versioned/immutable URLs; support tag-based purge for the rest.
- Respect Cache-Control and use conditional revalidation to balance freshness vs hit ratio.

---

### 30. Design a DNS system

**Frequency:** Medium

**Difficulty:** Hard
**Topics:** system-design, dns, caching, hierarchy, availability

**Answer:** Frame it as a globally distributed, cached hierarchical name-to-IP lookup, then focus on the resolution flow, caching/TTLs, and extreme availability.

**Step 1 — Clarify what we're building.** Translate human names (example.com) to IPs via a hierarchy of authoritative servers, with resolvers and caching in between. Unknowns: are we building the resolver, the authoritative side, or both; consistency vs propagation speed; and read/write ratio. Framing conclusion: DNS is read-dominated and availability-critical — it must favor availability and heavy caching over instant consistency.
**Step 2 — Do the napkin math.** Queries run to the trillions/day globally; updates (record changes) are rare by comparison. So the ratio is astronomically read-heavy. Cache hit ratios are very high, so authoritative servers see only a fraction of raw query volume; the design is caching layered on a distributed hierarchy.
**Step 3 — Lay out the pieces.** Root servers → TLD servers (.com) → authoritative servers (for the zone); recursive resolvers that walk this chain on behalf of clients and cache results; and the client stub resolver. Records (A/AAAA, CNAME, MX, NS, etc.) live in zone files on authoritative servers.
**Step 4 — The resolution flow and where caching lives.** The scored decision. A recursive resolver, on a cache miss, queries a root (which returns the TLD's NS), then the TLD server (returns the zone's authoritative NS), then the authoritative server (returns the A record) — then caches each answer by its TTL. *The core trade-off is the TTL:* *long TTL* means high cache-hit ratio, low load, and fast lookups, but changes (like failover to a new IP) propagate slowly; *short TTL* means fast propagation and nimble failover, but far more queries hitting authoritative servers and higher latency. Choose TTLs per record: long for stable records, short for ones you may need to failover. Negative caching (cache NXDOMAIN) cuts repeated lookups for missing names.
**Step 5 — Availability and scale.** Authoritative and root servers are replicated worldwide via anycast — the same IP announced from many sites, so queries hit the nearest and load spreads with automatic failover. Every layer is redundant (multiple NS records); a resolver retries another server on timeout. This redundancy is why DNS almost never fully goes down.
**Step 6 — Guard rails and features.** DNS-based load balancing / geo-routing returns different IPs by client location or health (powering CDNs and failover); DNSSEC signs records to prevent spoofing/cache poisoning; watch TTL vs failover-speed trade-offs during incidents.

**Key points:**
- DNS is a cached hierarchical lookup (root → TLD → authoritative); resolvers do the recursive walk.
- Read-dominated and availability-critical — caching + anycast replication carry the load.
- TTL is the central trade-off: long = fewer queries but slow propagation; short = fast failover but more load.
- Anycast + multiple NS records + resolver retries make it extremely fault tolerant.
- DNS also powers geo/health-based routing (CDN, failover); DNSSEC guards against spoofing.

---

### 31. Design an object / blob store (S3-style)

**Frequency:** High

**Difficulty:** Hard
**Topics:** system-design, storage, replication, metadata, consistency

**Answer:** Frame it as two loosely-coupled planes — a metadata service that maps keys to physical locations and a data plane that stores immutable blobs — then defend how you durably place bytes and how you find them again.

**Step 1 — Clarify what we're building.** Core operations are PUT, GET, DELETE, and LIST by prefix over a flat key namespace inside buckets; objects can be bytes to TBs. Raise the unknowns out loud: durability target (11 nines?), read-after-write consistency, max object size, multipart uploads. The framing conclusion: objects are *large and immutable*, so metadata and data have wildly different access patterns and must be separated.
**Step 2 — Do the napkin math.** Assume 100 PB stored, avg object 1 MB → ~10^11 objects, so metadata alone is huge. Traffic is *read-heavy* (say 10:1) and *bursty* (uploads spike). 10^11 keys × ~200 B metadata ≈ 20 TB of index — too big for one node, must shard.
**Step 3 — Lay out the pieces.** A stateless API/gateway tier; a *metadata store* (sharded KV: key → list of chunk locations, size, etag, ACL); a *data plane* of storage nodes holding fixed-size chunks on local disks; a background repair/GC service; and a placement service.
**Step 4 — Durability: replication vs erasure coding.** This is the scored decision. *3x replication* is simple, fast to read, cheap to repair, but 200% storage overhead. *Erasure coding* (e.g. Reed-Solomon 10+4) gives similar durability at ~40% overhead but reconstruction reads many nodes and costs CPU, hurting tail latency and small-object efficiency. Real answer: replicate small/hot objects, erasure-code large/cold ones, and place fragments across *failure domains* (racks, AZs) so no single failure loses a quorum.
**Step 5 — Consistency and the write path.** Writes go to a quorum of chunk nodes, then the metadata commit is the *linearization point* — the object isn't visible until metadata references it, giving read-after-write for new keys. Multipart upload writes parts independently and a final "complete" call stitches them, enabling resumable TB uploads.
**Step 6 — Guard rails.** Immutable chunks make GC a mark-and-sweep against metadata references; use idempotent PUT via content hash to dedupe retries; rate-limit and shard hot keys; background scrubber verifies checksums to catch bit rot.

**Key points:**
- Split metadata plane from data plane — they scale and fail differently.
- Objects immutable + content-addressed chunks simplifies replication, caching, and GC.
- Erasure coding vs replication is the core cost/durability trade-off; spread across failure domains.
- Metadata commit is the consistency linearization point; enables read-after-write.

---

### 32. Design a distributed file system (GFS / HDFS)

**Frequency:** Medium

**Difficulty:** Hard
**Topics:** system-design, storage, replication, consensus, throughput

**Answer:** Walk it as a single logical namespace served by a master that owns metadata plus many chunkservers that stream data, then defend how the master stays out of the data path and survives failure.

**Step 1 — Clarify what we're building.** A POSIX-ish file system for huge files with *append-heavy, sequential* access (batch/log workloads), not tiny random writes. Ask: file sizes, read vs write mix, single-writer or concurrent append, consistency guarantees. Conclusion: optimize for *high throughput on large sequential I/O*, not low-latency small ops.
**Step 2 — Do the napkin math.** Files are GB-TB, split into 64–128 MB chunks. 10 PB / 128 MB ≈ 80M chunks. At 3x replication the master tracks ~240M chunk replicas — metadata fits in RAM (~100 B each ≈ tens of GB) if chunks are large. This is *why* chunks are huge: it keeps master metadata small.
**Step 3 — Lay out the pieces.** A *master/NameNode* holding the namespace tree and chunk→location map in memory (persisted via operation log + checkpoints); many *chunkservers/DataNodes* storing chunks as plain files; clients that ask the master for locations then talk to chunkservers directly.
**Step 4 — Keeping the master off the data path.** The scored decision. *Central master for metadata only*: clients get chunk handles + replica locations, then stream bytes straight to/from chunkservers, so the master's throughput never bounds data throughput. Compare to *fully distributed metadata* (harder consistency, more complex) — GFS chose the simpler single master and mitigates its load with large chunks, client caching of locations, and a lease system delegating write ordering to a *primary replica*.
**Step 5 — Replication and recovery.** Master detects dead chunkservers via heartbeats and re-replicates under-replicated chunks, balancing across racks. Writes use a primary-replica lease: client pushes data to all replicas (pipelined for bandwidth), then primary assigns a serial order and forwards, giving consistent replica state.
**Step 6 — Master availability.** Single master is the SPOF: mitigate with operation log replicated to shadow masters + fast checkpoint restore; HDFS adds a standby NameNode with a shared journal (QJM) and ZooKeeper failover. Atomic record append gives at-least-once semantics for concurrent writers.

**Key points:**
- Large chunks (64–128 MB) keep master metadata RAM-resident and reduce coordination.
- Master serves metadata only; data streams directly between clients and chunkservers.
- Primary-lease + pipelined push orders concurrent writes without master involvement.
- Master is the SPOF — protect with op-log, checkpoints, and standby failover.

---

### 33. Design a photo-sharing service (Instagram)

**Frequency:** High

**Difficulty:** Medium
**Topics:** system-design, feed, blob-storage, cdn, fanout

**Answer:** Frame it around two flows — upload/store media and generate each user's home feed — and spend your time on the feed fanout decision.

**Step 1 — Clarify what we're building.** Core ops: upload a photo, view a profile, and read a personalized home feed of followed accounts. Raise: is the feed chronological or ranked, how skewed is the follower graph (celebrities!), media sizes. Conclusion: the system is *read-heavy* and dominated by feed reads, so feed construction is the real problem.
**Step 2 — Do the napkin math.** 500M DAU, each opens the feed ~10x/day → ~5B feed reads/day ≈ 60K QPS avg, multiples at peak. Uploads maybe 100M/day ≈ 1K writes/s. Read:write ≈ 60:1 — *massively read-heavy*, justifying aggressive caching and precomputation.
**Step 3 — Lay out the pieces.** Object store + CDN for media; a metadata DB (posts, users, follows) in a sharded relational/KV store; a feed service; Redis for feed caches and counters; an async pipeline for image resizing (thumbnails, multiple resolutions).
**Step 4 — Feed generation: fanout-on-write vs fanout-on-read.** The scored decision. *Fanout-on-write (push)*: on post, insert the post id into every follower's precomputed feed list in Redis; reads are O(1) and instant, but a celebrity with 100M followers causes a write storm. *Fanout-on-read (pull)*: build the feed at read time by querying followees; cheap writes but expensive, slow reads at scale. Real answer is *hybrid*: push for normal users, and for high-fanout celebrities pull their recent posts at read time and merge — bounding both write amplification and read latency.
**Step 5 — Make the hot path fast.** Media served from CDN by immutable URL; feed cache holds only post ids (not full objects), hydrated from a hot post cache; precompute multiple image sizes on upload so clients fetch the right resolution.
**Step 6 — Guard rails.** Cap stored feed length (e.g. last 1000 ids); handle unfollow/delete by filtering at read time rather than rewriting caches; idempotent upload via client-supplied id; thumbnails generated async so upload returns fast.

**Key points:**
- Read-heavy → precompute feeds and cache aggressively.
- Hybrid fanout: push for the masses, pull for celebrities to avoid write storms.
- Store media in blob store + CDN; keep only post ids in feed caches.
- Multiple resolutions generated async; serve by immutable CDN URLs.

---

### 34. Design a comment system

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, nested-data, pagination, caching, ranking

**Answer:** Walk it as storing a tree of comments per entity, then defend how you fetch and paginate threaded replies efficiently.

**Step 1 — Clarify what we're building.** Core ops: post a comment (top-level or reply), read comments for an entity, edit/delete, and vote/sort. Raise: how deep can threads nest, sort order (top vs new), scale of a single hot thread. Conclusion: it's a *tree with hot spots* — a few viral threads dominate, so the read path and pagination model matter most.
**Step 2 — Do the napkin math.** Say 10M comments/day ≈ 120 writes/s, but reads are far higher and *skewed*: one viral post may get 100K comments and millions of reads. So design for the *long-tail hot thread*, not the average.
**Step 3 — Lay out the pieces.** A comments store keyed by (entity_id, comment_id) with parent_id, author, body, created_at, score; a counter for reply/vote counts; a cache for hot threads; optional search/ranking service.
**Step 4 — Modeling the tree and pagination.** The scored decision. *Adjacency list* (each row stores parent_id) is simple and write-cheap but reading a deep subtree needs recursive queries. *Materialized path* (store a path like `1/4/9`) makes fetching a subtree a single prefix range scan and orders naturally, at the cost of rewrites on move. *Closure table* stores all ancestor-descendant pairs — flexible queries but write-heavy. For most feeds, materialized path + limiting depth wins. Pagination should be *cursor/keyset* (by score+id), never OFFSET, because hot threads have huge offsets.
**Step 5 — Making the hot path fast.** Cache the top-N comments of hot threads and render "load more replies" lazily rather than the whole tree. Denormalize reply counts. Sort-by-top uses a periodically recomputed score; sort-by-new uses the id index directly.
**Step 6 — Guard rails.** Soft-delete (tombstone) so replies under a deleted comment survive; rate-limit posting and dedupe via client id for idempotency; spam/abuse filtering async; shard by entity so one viral thread's load is isolated.

**Key points:**
- It's a tree with heavy hot-spot skew — design for the viral thread.
- Materialized path enables single-scan subtree fetch; cap nesting depth.
- Use keyset/cursor pagination, never OFFSET, on large threads.
- Denormalize counts, cache top-N, load deep replies lazily; soft-delete to keep trees intact.

---

### 35. Design a like / reaction counter at scale

**Frequency:** High

**Difficulty:** Medium
**Topics:** system-design, counters, sharding, idempotency, eventual-consistency

**Answer:** Frame it as a write-heavy increment problem where the hard part is avoiding a single hot row while keeping counts roughly accurate.

**Step 1 — Clarify what we're building.** Core ops: like/unlike (toggle) and read a like count; also "did *I* like this". Raise: exact vs approximate counts, must a user's own like be immediately visible, how hot is the hottest item. Conclusion: the count itself can be *eventually consistent*, but a user's own toggle must feel instant and be *idempotent* (no double-count on retry).
**Step 2 — Do the napkin math.** A viral post gets 1M likes in an hour ≈ 280 writes/s to *one* counter, while reads of that count may be 100K/s. A naive `UPDATE ... SET count=count+1` serializes on one row — the hot-key problem is the whole game.
**Step 3 — Lay out the pieces.** A membership store (user_id, item_id) as the source of truth for who liked what (also answers "did I like this"); an aggregate counter per item; a cache layer for hot counts.
**Step 4 — Killing the hot row: sharded counters.** The scored decision. *Single row* is exact but serializes writes and melts under a viral item. *Sharded/striped counters*: split each item's count into N sub-counters (e.g. 100), increment a random shard, and sum on read — spreads write load 100x at the cost of a scatter-gather read. *Batched aggregation*: buffer increments in memory/Kafka and flush deltas every few seconds — hugely reduces DB writes and is naturally idempotent per batch, but the displayed count lags a little. Real answer: sharded counters plus write batching, with reads served from cache.
**Step 5 — Idempotency and correctness.** The membership table's unique (user, item) constraint makes like/unlike idempotent regardless of retries; derive the count from membership periodically to *reconcile* drift from the fast approximate counter. Show the user their own like immediately via optimistic UI.
**Step 6 — Guard rails.** Cache the aggregate with short TTL and serve slightly stale counts; rate-limit toggles; for extreme fan-out use probabilistic display ("1.2M"); reconcile counters against membership on a schedule to fix lost updates.

**Key points:**
- Count can be eventually consistent; a user's own toggle must be instant and idempotent.
- Unique (user,item) membership row is the source of truth and enables reconciliation.
- Sharded counters + batched aggregation defeat the hot-row bottleneck.
- Serve counts from cache; reconcile periodically against membership.

---

### 36. Design a view-count / analytics counter

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, streaming, deduplication, approximation, aggregation

**Answer:** Walk it as a firehose of view events aggregated into per-item counts, then defend how you dedupe unique viewers and trade exactness for scale.

**Step 1 — Clarify what we're building.** Core ops: record a view and read total views (and often *unique* views per time window). Raise: total vs unique counts, is exactness required or is ~1% error fine, real-time vs delayed. Conclusion: views are a *massive append-only write stream* and near-real-time approximate counts are usually acceptable — that unlocks cheap solutions.
**Step 2 — Do the napkin math.** 1B views/day ≈ 12K events/s avg, 10x at peak. Storing every raw event is possible but counting them synchronously isn't; and unique-viewer counting over millions of items with exact sets would need enormous memory. So: *stream + aggregate*, and approximate uniques.
**Step 3 — Lay out the pieces.** A lightweight ingestion endpoint → a durable log (Kafka); a stream processor (Flink/Spark) that aggregates by item and time window; a serving store for counts; a cache for hot items.
**Step 4 — Total counts vs unique counts.** The scored decision. For *totals*, buffer and increment (batched/sharded counters, as with likes). For *uniques*, exact counting needs a per-item set of viewer ids — memory-prohibitive at scale. *HyperLogLog* estimates cardinality in ~12 KB per item with ~2% error and supports merging across shards/windows, versus *exact sets* (accurate, huge) or *sampling* (cheap, biased). Real answer: HLL for unique views, plain summed counters for totals.
**Step 5 — Dedup and windowing.** Dedup repeat views per user via a short-lived key (Redis SETNX with TTL) or HLL membership so refreshes don't inflate counts. Emit rolling windows (hourly/daily) via tumbling windows in the stream processor; keep raw events in cheap storage for later recomputation.
**Step 6 — Guard rails.** Make ingestion fire-and-forget with a durable buffer so a slow aggregator never drops events; handle late/out-of-order events with watermarks; bot filtering; idempotent event ids to survive client retries.

**Key points:**
- Views are an append-only stream; ingest to Kafka, aggregate async, approximate is fine.
- HyperLogLog gives unique counts in KBs per item with mergeable ~2% error.
- Dedup with short-TTL keys so refreshes don't inflate; window with watermarks for late events.
- Keep raw events cheaply stored to recompute; decouple ingest from aggregation.

---

### 37. Design a real-time analytics dashboard

**Frequency:** Medium

**Difficulty:** Hard
**Topics:** system-design, streaming, olap, pre-aggregation, push

**Answer:** Frame it as an ingest→aggregate→query→push pipeline and defend how you serve sub-second aggregate queries over a live event stream.

**Step 1 — Clarify what we're building.** Users watch metrics (counts, rates, top-N, percentiles) update within seconds, sliced by dimensions and time. Raise: freshness target (1s? 1min?), query flexibility (fixed dashboards vs ad-hoc), cardinality of dimensions, retention. Conclusion: it's the classic tension between *freshness* and *query flexibility* — that choice drives the storage engine.
**Step 2 — Do the napkin math.** 100K events/s ingest, dashboards refresh every few seconds for thousands of concurrent viewers → high fan-out reads over recent data. Most queries touch the *last few minutes* heavily and history rarely — argues for a hot in-memory/recent tier plus a colder store.
**Step 3 — Lay out the pieces.** Ingestion → Kafka → a stream processor doing incremental aggregation → a real-time OLAP store (Druid/Pinot/ClickHouse) for sliceable queries → a query/API tier → WebSocket/SSE push to browsers.
**Step 4 — Pre-aggregation vs raw-on-read (the storage engine).** The scored decision. *Pre-aggregate at write time* (rollups in the stream job into fixed grains) gives instant fixed-dashboard reads but can't answer new ad-hoc questions. *Store raw and aggregate at query time* in a columnar OLAP store gives full flexibility but heavier queries. *Real-time OLAP (Druid/Pinot)* splits the difference: it ingests the stream into an indexed, columnar, time-partitioned store with optional rollup, serving both recent and historical slices fast — this is usually the right pick. Note the *lambda/kappa* choice for reconciling real-time with batch-corrected history.
**Step 5 — Delivering updates fast.** Push deltas over WebSocket/SSE rather than client polling; cache hot dashboard queries with 1–5s TTL so thousands of viewers of the same board hit cache; segment recent data in memory, age older segments to disk.
**Step 6 — Guard rails.** Handle late/out-of-order events with watermarks and accept the metric may nudge; guard high-cardinality dimensions (they explode pre-agg storage) with limits or approximation; degrade to slightly staler data under load rather than failing.

**Key points:**
- Core tension is freshness vs query flexibility; a real-time OLAP store (Druid/Pinot) balances both.
- Pre-aggregate fixed dashboards; keep raw for ad-hoc; consider lambda/kappa for correction.
- Push deltas via WebSocket/SSE and cache hot queries for the shared-dashboard fan-out.
- Watermarks for late events; bound high-cardinality dimensions.

---

### 38. Design a metrics / monitoring system (Prometheus-style)

**Frequency:** Medium

**Difficulty:** Hard
**Topics:** system-design, time-series, pull-vs-push, compression, alerting

**Answer:** Walk it as collect → store time-series → query → alert, and defend the pull-vs-push collection model plus how you store billions of cheap data points.

**Step 1 — Clarify what we're building.** Store labeled time-series (metric name + label set → timestamp/value stream), query them (rates, aggregations), and fire alerts. Raise: pull or push collection, cardinality expectations, retention, HA of the monitor itself. Conclusion: it's *append-heavy time-series with high label cardinality* — storage layout and cardinality control dominate.
**Step 2 — Do the napkin math.** 10K hosts × 1K series each = 10M active series, scraped every 15s → ~700K samples/s. Each sample is (timestamp, float). Naively 16 B × 700K/s ≈ 11 MB/s = ~1 TB/day — so *compression is mandatory*, not optional.
**Step 3 — Lay out the pieces.** Scrapers/collectors; a time-series DB with an inverted index from labels→series and a columnar sample store; a query engine (PromQL-style); an alerting/rule evaluator; long-term remote storage (Thanos/Cortex/Mimir) for scale-out.
**Step 4 — Pull vs push collection.** The scored decision. *Pull* (Prometheus scrapes targets' `/metrics`): the monitor controls rate, easily detects a target being *down* (scrape fails), and service discovery drives targets — but struggles with short-lived jobs and NAT'd targets. *Push* (agents send to a gateway): handles ephemeral/batch jobs and firewalled targets, but you lose free up/down detection and must handle backpressure. Real answer: pull as default with a *push gateway* for short-lived jobs. Second decision: *storage compression* — delta-of-delta encoding for timestamps and XOR (Gorilla) for float values shrinks samples to ~1–2 bytes each.
**Step 5 — Query and alerting.** The inverted label index resolves a query's series set, then the engine range-scans compressed chunks; rules evaluate on a schedule and hand firing alerts to an *alertmanager* that dedupes, groups, and routes with silence/inhibition. Downsample old data for cheap long-range queries.
**Step 6 — Guard rails.** *Cardinality is the killer* — a label with unbounded values (user id, request id) explodes the index; enforce label limits and drop offenders. Make the monitoring stack HA (redundant scrapers) so it survives what it watches; cap query cost to prevent one expensive PromQL from OOMing the server.

**Key points:**
- Append-heavy time-series; delta-of-delta + XOR (Gorilla) compression is mandatory (~1–2 B/sample).
- Pull collection gives free up/down detection + rate control; push gateway covers ephemeral jobs.
- Inverted label index for querying; separate alertmanager for dedup/grouping/routing.
- High label cardinality is the top failure mode — bound labels aggressively.

---

### 39. Design a log aggregation system

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, ingestion, indexing, buffering, retention

**Answer:** Frame it as ship → buffer → index → search over an enormous write stream, and defend how you make text logs searchable without indexing everything.

**Step 1 — Clarify what we're building.** Collect logs from thousands of services, centralize them, and support search/filter by time, service, and text plus tailing. Raise: structured vs free-text logs, search latency needs, retention, expected volume. Conclusion: it's *write-dominated at huge volume* with bursty spikes, and full-text indexing everything is the cost trap to avoid.
**Step 2 — Do the napkin math.** 10K hosts × 100 lines/s × 300 B ≈ 300 MB/s ≈ 25 TB/day raw. Reads (searches) are far rarer than writes but scan lots of data. So the pipeline must absorb *bursty multi-hundred-MB/s writes* and index selectively.
**Step 3 — Lay out the pieces.** A lightweight forwarder on each host (Fluent Bit/Filebeat) → a durable buffer (Kafka) → an ingestion/parsing tier → an indexed search store (Elasticsearch/OpenSearch or Loki) → cheap object storage for cold logs → a query/UI tier.
**Step 4 — Index everything vs index labels only.** The scored decision. *Full-text index every line* (Elasticsearch model) gives fast arbitrary search but the index can be as big as the data and ingestion is CPU/heap heavy — expensive at 25 TB/day. *Index only metadata labels, store raw log bodies compressed* (Loki model): cheap ingest and storage, but text search brute-force-scans matching chunks, so queries are slower. Real answer depends on need: label-only indexing for cost-sensitive high-volume ops logs, full-text where fast forensic search justifies the cost; often tier both. The *buffer (Kafka)* is non-negotiable — it decouples bursty producers from the slower indexer.
**Step 5 — Retention and tiering.** Time-partition indices (daily) so old data drops with cheap index deletes; roll hot→warm→cold, moving old segments to object storage; downsample or sample high-volume debug logs. Support live tailing via the streaming buffer.
**Step 6 — Guard rails.** Backpressure/drop-oldest at the forwarder so a slow backend never crashes the app; sample or rate-limit chatty services; parse to structured fields at ingest for cheaper filtering; multi-tenant quotas so one team can't flood the cluster.

**Key points:**
- Write-dominated and bursty; a Kafka buffer decouples producers from the indexer.
- Index-everything (Elasticsearch) vs index-labels-only (Loki) is the core cost/speed trade-off.
- Time-partitioned indices with hot/warm/cold tiering to object storage control retention cost.
- Backpressure and per-tenant quotas stop one noisy service from taking down aggregation.

---

### 40. Design a distributed tracing system

**Frequency:** Medium

**Difficulty:** Hard
**Topics:** system-design, tracing, sampling, context-propagation, spans

**Answer:** Walk it as propagate context → emit spans → assemble traces → query, and defend the sampling strategy that keeps it affordable without losing the interesting traces.

**Step 1 — Clarify what we're building.** Follow a single request across many services: each service emits *spans* (op, start/end, tags) tagged with a shared trace id, assembled into a per-request tree. Raise: overhead budget, sampling rate, do we need every error trace, storage horizon. Conclusion: tracing every request is *prohibitively expensive*, so the sampling decision is the whole design.
**Step 2 — Do the napkin math.** 1M req/s, each touching 20 services → 20M spans/s if you trace everything; at ~500 B/span that's 10 GB/s — absurd to store. Even 1% sampling is 200K spans/s. So the system is defined by *how aggressively and intelligently you sample*.
**Step 3 — Lay out the pieces.** Instrumentation libraries (OpenTelemetry) that propagate trace context via headers (W3C traceparent); per-host agents/collectors; a Kafka buffer; a span-assembly/storage backend (keyed by trace id); and a UI to render trace waterfalls and service dependency graphs.
**Step 4 — Head-based vs tail-based sampling.** The scored decision. *Head-based sampling* decides at the trace's start (e.g. keep 1%) — cheap, simple, and the decision propagates so all services agree, but you throw away most errors and slow traces because you decided before knowing the outcome. *Tail-based sampling* buffers all spans of a trace at the collector and decides after it completes — so you can *keep all errors and high-latency traces* and downsample boring fast ones, at the cost of buffering complete traces in memory and more collector complexity. Real answer: tail-based (or hybrid) so the traces you actually want survive. Context must propagate the sampling decision consistently.
**Step 5 — Assembly and querying.** Spans arrive independently and out of order; the backend groups by trace id (with a time window to wait for stragglers) into a tree. Index by trace id plus service/operation/latency for search; derive service dependency graphs and latency percentiles from aggregated spans.
**Step 6 — Guard rails.** Keep instrumentation overhead low (async, non-blocking export, drop under pressure) so tracing never harms the traced service; propagate context across async/thread boundaries and message queues; clock skew across hosts distorts waterfalls — rely on span parent-child ordering, not raw timestamps.

**Key points:**
- Tracing everything is unaffordable; the sampling strategy is the core design decision.
- Tail-based sampling keeps error/slow traces by deciding after completion; head-based is cheaper but blind.
- Propagate trace context (and the sampling decision) via headers across every hop.
- Assemble spans by trace id with a straggler window; watch clock skew and export overhead.

---

### 41. Design an alerting / on-call system

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, monitoring, time-series, deduplication, escalation

**Answer:** Walk from metric ingestion to rule evaluation, then spend most of your time on dedup/grouping and escalation because that is what separates a usable pager from an alert-storm.

**Step 1 — Clarify what we're building.** Core operations: ingest metrics/events, evaluate alerting rules, notify on-call engineers, let humans ack/resolve, and escalate if nobody responds. Raise the big unknowns out loud: do we own metric collection (like Prometheus) or just alerting on top of an existing TSDB? What notification channels (push, SMS, phone, Slack)? The framing conclusion that drives everything: *this is a low-throughput-of-alerts but high-stakes* system, so correctness and never-drop-a-page matter more than raw scale.
**Step 2 — Do the napkin math.** Millions of time-series scraped every 15-60s is high write volume for the TSDB, but the *alert* path is tiny — maybe thousands of firing alerts across the fleet at any moment. So the system is *write-heavy on ingestion, read-heavy/eval-heavy on rules, and low-volume but latency-and-reliability-critical on notification delivery*.
**Step 3 — Lay out the pieces.** Ingestion + TSDB (Prometheus/M3/VictoriaMetrics), a rule evaluator that periodically queries the TSDB, an alert manager that dedups/groups/routes, a notification dispatcher per channel with retries, and a state store (Postgres) for schedules, escalation policies, and incident state.
**Step 4 — Dedup, grouping, and escalation (the scored decision).** The heart is turning raw firing conditions into *one useful page*. Compare: *per-alert notification* (simple, but a rack failure pages you 200 times), versus *grouping by labels with a group-wait window* (batch alerts sharing labels for e.g. 30s before sending — collapses the storm, adds a small delay), versus *dependency-aware suppression* (if the parent "datacenter down" fires, suppress child alerts — powerful but needs a dependency graph you rarely have). Then escalation: an *escalation policy* is a timed chain (notify primary → wait 5m unacked → notify secondary → wait → notify manager), driven by a durable timer, with rotation from an on-call *schedule*.
**Step 5 — Never drop a page.** The notification path must be at-least-once with retries and multiple channels; ack must be idempotent (ack via any channel resolves the incident). Persist alert state before dispatching so a crash mid-send re-delivers. Use a dead-man's-switch (a heartbeat alert that fires if the alerting system itself goes quiet) so a broken pipeline is detectable.
**Step 6 — Guard rails.** Rate-limit/inhibit flapping alerts (require condition to hold for `for: 5m`), support maintenance windows/silences, and de-dupe repeated firings with a fingerprint so re-evaluation doesn't re-page.

**Key points:**
- The scored skill is alert *reduction*: grouping windows, inhibition, and dependency suppression turn a storm into one actionable page.
- Escalation policies + on-call schedules + durable timers are the on-call core; ack must be idempotent across channels.
- Reliability trumps scale: persist-before-send, at-least-once delivery, and a dead-man's-switch so silence is never mistaken for health.
- Separate the write-heavy TSDB path from the low-volume, reliability-critical notification path.

---

### 42. Design a collaborative document editor (Google Docs)

**Frequency:** High

**Difficulty:** Hard
**Topics:** system-design, operational-transform, crdt, websockets, concurrency

**Answer:** Frame it as a real-time concurrent-editing problem: land quickly on the conflict-resolution model (OT vs CRDT) because that single choice defines the whole system.

**Step 1 — Clarify what we're building.** Core operations: multiple users edit the same document concurrently, see each other's changes and cursors in near real-time, and never lose or corrupt text. Key unknowns to raise: how many concurrent editors per doc (10 vs 10,000)? Do we need full offline editing? Rich text or plain text? The framing conclusion: *concurrent conflicting edits on shared mutable state* is the whole problem — pick a convergence model first.
**Step 2 — Do the napkin math.** Most docs have 1-10 active editors; edits are tiny (a keystroke = a few bytes) but frequent (several per second per user). So per-doc it is *low bandwidth but very chatty and latency-sensitive* — the fan-out is small (co-editors of one doc), the challenge is ordering and convergence, not throughput.
**Step 3 — Lay out the pieces.** A stateful edit server (or actor) per active document holding the in-memory doc state, WebSocket connections from clients, a persistent op log + periodic snapshots in storage, and a presence/cursor channel. Documents are sharded so each active doc is owned by exactly one server instance.
**Step 4 — Conflict resolution: OT vs CRDT (the scored decision).** This is the entire interview. *Operational Transformation* transforms concurrent operations against each other (insert@5 vs delete@3) so all replicas converge; it needs a central server to order ops, is memory-efficient, and is what Google Docs actually uses — but the transform functions are notoriously hard to get right. *CRDTs* (e.g. RGA/Yjs) give each character a unique, ordered identity so operations commute and converge without a central authority; great for offline/P2P and simpler correctness, but they carry per-character metadata (tombstones) that bloats memory. Pick OT with a central sequencer for a server-authoritative product; pick a CRDT if offline-first or decentralization is required.
**Step 5 — Make the hot path fast and durable.** The single owning server serializes ops (giving a total order), broadcasts transformed ops to peers over WebSockets, and appends to a durable op log. Persist by periodic snapshot + op log so recovery replays from the last snapshot. Assign each client a revision number so it can catch up after reconnect.
**Step 6 — Presence, offline, and edge cases.** Cursors/selections go on a separate ephemeral channel (lossy is fine). On reconnect, the client sends its last-known revision and replays buffered local ops through transform. Handle a hot document (owning server overloaded) and single-owner failover by rehydrating from snapshot + log.

**Key points:**
- OT vs CRDT is the decision the interviewer scores — know the trade-off cold (central-ordering + memory-efficient vs commutative + offline-friendly but metadata-heavy).
- One owning server per active doc gives a total order; persistence = periodic snapshots + an append-only op log.
- Revision numbers let clients reconnect and catch up; presence/cursors ride a separate lossy channel.
- The problem is convergence and ordering of tiny concurrent edits, not raw throughput.

---

### 43. Design a real-time collaborative whiteboard

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, crdt, websockets, spatial-data, real-time

**Answer:** Treat it like Google Docs but for 2D spatial objects — the convergence model is similar, but the twist is high-frequency cursor/stroke streaming and spatial rendering.

**Step 1 — Clarify what we're building.** Core operations: users add/move/delete shapes, draw freehand strokes, and see each other's cursors and edits live on an infinite canvas. Unknowns to raise: max concurrent users per board? Do we persist every intermediate stroke point or just final shapes? Infinite canvas vs fixed page? Framing conclusion: unlike a doc's linear text, this is *concurrent edits on a set of independent spatial objects*, which makes conflict resolution easier (objects rarely conflict) but streaming harder.
**Step 2 — Do the napkin math.** A freehand stroke can emit dozens of points per second per user, and 10-50 people on a busy board multiplies that into a chatty firehose. So it is *very write/update-chatty and latency-critical*, with modest storage (a board is thousands of objects, not gigabytes).
**Step 3 — Lay out the pieces.** A stateful room server per board over WebSockets, an in-memory scene graph of objects keyed by ID, a persistence layer (object snapshots + op log), and a separate high-frequency ephemeral channel for live cursors and in-progress strokes.
**Step 4 — Conflict model + streaming (the scored decision).** Because objects are independent, a *last-writer-wins per object* or a *CRDT map keyed by object ID* converges cleanly — full OT is overkill since a move-rectangle-A and move-rectangle-B don't interfere. Compare update strategies: *send every stroke point immediately* (lowest latency, highest traffic), versus *client-side batching/throttling to ~30-60fps and sending deltas* (smooth enough, far less traffic), versus *send only the finalized stroke* (cheap, but peers don't see live drawing). The sweet spot is throttled in-progress deltas on the ephemeral channel, then one durable "stroke committed" op.
**Step 5 — Make the hot path fast.** In-progress strokes and cursors are lossy and ephemeral (drop is fine, latest wins); only committed objects hit the durable op log. Broadcast within the room server's in-memory fan-out; snapshot the scene periodically so late joiners load a snapshot then tail recent ops.
**Step 6 — Edge cases.** Handle huge boards with viewport-based loading (only sync objects in view), reconnection via last-seen op sequence, and abuse (cap objects/stroke rate per user).

**Key points:**
- Independent spatial objects make conflict resolution easy: LWW-per-object or a CRDT map beats full OT.
- Split traffic: throttled ephemeral cursor/stroke streaming vs a durable committed-object op log.
- Snapshots + op log let late joiners and reconnects catch up; viewport loading keeps huge boards cheap.
- The real challenge is high-frequency streaming and rendering, not conflict logic.

---

### 44. Design a CI/CD deployment pipeline system

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, orchestration, queueing, workflow, isolation

**Answer:** Walk from a commit trigger through build/test/deploy stages, then focus on the DAG scheduler and safe rollout because that is what a pipeline system actually is.

**Step 1 — Clarify what we're building.** Core operations: on a git push or PR, run a pipeline of stages (build → test → deploy) defined by config, on isolated runners, with logs, artifacts, and gated promotion across environments. Unknowns to raise: self-hosted vs managed runners? How many builds/day? Do we need deployment (not just CI)? Framing conclusion: this is a *durable, distributed workflow orchestrator* where each job is untrusted user code that must run isolated.
**Step 2 — Do the napkin math.** Even a big org runs maybe thousands to tens of thousands of pipelines/day — that's tens of jobs/second peak, spiky (everyone pushes before lunch). Jobs are minutes-long and CPU/IO heavy. So it is *bursty, compute-heavy, long-running-job* work: the scaling problem is the runner fleet, and the correctness problem is orchestration.
**Step 3 — Lay out the pieces.** A trigger/webhook receiver, a pipeline definition parser (YAML → DAG), a durable orchestrator/scheduler, a job queue, an autoscaling pool of isolated runners (containers/VMs), object storage for artifacts + logs, and a metadata DB for run state.
**Step 4 — DAG orchestration + isolation (the scored decision).** The heart is scheduling a *dependency graph of jobs* durably. Compare execution models: *a stateless queue of independent jobs* (simple, but can't express "deploy only after all tests pass" fan-in), versus *a durable workflow engine* (Temporal-style) that persists DAG state so a crashed orchestrator resumes mid-pipeline without re-running completed jobs — the right call. For runners, compare *containers* (fast startup, cheaper, weaker isolation) versus *fresh VMs/microVMs like Firecracker* (strong isolation for untrusted code, slower boot); untrusted third-party code pushes you toward microVMs or hardened, single-use containers.
**Step 5 — Deploys, rollout, and idempotency.** For the CD half, support progressive delivery: *rolling*, *blue-green*, or *canary* with automated health checks and rollback. Make job execution idempotent and retriable (retries must not double-deploy); use approval gates for prod promotion. Every job runs in a clean workspace to avoid state leakage between builds.
**Step 6 — Guard rails.** Cache dependencies to speed builds, stream logs to storage live, enforce per-tenant quotas and concurrency limits, and secure secrets injection so credentials never land in logs.

**Key points:**
- A durable DAG/workflow engine (not a flat job queue) is the scored decision — it resumes mid-pipeline and models fan-in gates.
- Untrusted job code demands isolation: microVMs/single-use containers over shared runners.
- Autoscale the bursty, compute-heavy runner fleet; keep orchestrator state in a durable DB.
- CD adds progressive rollout (canary/blue-green) + rollback and idempotent, gated deploys.

---

### 45. Design a container orchestration system (Kubernetes-lite)

**Frequency:** Low

**Difficulty:** Hard
**Topics:** system-design, scheduling, control-loop, distributed-systems, consensus

**Answer:** Frame it as a declarative control system: users declare desired state, the system continuously reconciles actual toward desired — then the scored decisions are the scheduler and the reconciliation loop.

**Step 1 — Clarify what we're building.** Core operations: users submit a desired spec (run N replicas of container X with these resources), the system places them on a fleet of worker nodes, keeps them running, reschedules on node failure, and exposes them via networking. Unknowns to raise: scale of the fleet (100 vs 100k nodes)? Do we need autoscaling, service discovery, storage? Framing conclusion: this is a *declarative, level-triggered control loop* over a distributed cluster — desired vs observed state reconciliation is the mental model.
**Step 2 — Do the napkin math.** Thousands of nodes, tens of thousands of pods, with a control plane fielding constant status heartbeats and watch events. The state store is small in bytes but *extremely read/watch-heavy and consistency-critical* (it's the single source of truth). Data plane (actual container traffic) is separate and huge.
**Step 3 — Lay out the pieces.** A strongly-consistent state store (etcd/Raft) as source of truth, an API server as the only writer to it, a scheduler that assigns pods to nodes, a set of controllers (reconcilers) each watching one resource type, and a per-node agent (kubelet-like) that runs containers and reports status.
**Step 4 — Scheduler + reconciliation model (the scored decision).** Two hearts. Scheduling: compare *random/round-robin placement* (trivial, ignores fit) versus a *filter-then-score scheduler* (filter nodes by resource/affinity constraints, then rank by bin-packing/spread) — the real answer, balancing utilization against blast-radius. Reconciliation: compare *edge-triggered* imperative commands (do X now — fragile, lost events break state) versus *level-triggered control loops* (each controller repeatedly compares desired vs observed and takes corrective action) — level-triggered is why Kubernetes self-heals: a dropped event just gets caught on the next reconcile.
**Step 5 — Failure handling and consistency.** The state store uses Raft for consistency; controllers are stateless and idempotent, using optimistic concurrency (resource versions) so two controllers don't conflict. Node agents heartbeat; a missed heartbeat marks the node unhealthy and its pods get rescheduled. Leader election ensures one active scheduler.
**Step 6 — Guard rails.** Watch/informer caches offload the API server from constant polling, rate-limit reconcile loops, respect resource quotas and pod disruption budgets, and separate the control plane from the data plane so a control-plane outage doesn't kill running workloads.

**Key points:**
- Level-triggered reconciliation (desired vs observed) is the core idea and the source of self-healing — know why it beats edge-triggered.
- Filter-then-score scheduling balances bin-packing utilization against failure blast-radius.
- A Raft-backed state store is the single source of truth; controllers are stateless, idempotent, and use optimistic concurrency.
- Separate control plane from data plane; watch caches and leader election keep it scalable and correct.

---

### 46. Design a feature store for machine learning

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, ml-infra, dual-store, consistency, data-pipeline

**Answer:** Frame it around the online/offline duality — the whole point of a feature store is serving the same feature consistently for training and low-latency inference.

**Step 1 — Clarify what we're building.** Core operations: define/compute features, materialize them, serve them offline in bulk for training and online at low latency for inference, all from one definition. Unknowns to raise: how many features and models? Batch vs streaming features? Latency SLA for online reads? Framing conclusion: the reason feature stores exist is *train/serve skew* — the same logic must feed both paths, so consistency between them is the core problem.
**Step 2 — Do the napkin math.** Online serving needs single-digit-millisecond point lookups at inference QPS (thousands to millions/s); offline training reads billions of rows in bulk. So it is a *two-workload* system: *high-QPS low-latency point reads online* and *high-throughput bulk scans offline* — no single store does both well.
**Step 3 — Lay out the pieces.** A feature registry (definitions/metadata), transformation pipelines (batch via Spark, streaming via Flink/Kafka), an offline store (data warehouse / Parquet on object storage), an online store (Redis/DynamoDB/Cassandra), and a materialization job syncing offline → online.
**Step 4 — Dual store + consistency (the scored decision).** The heart is the *offline/online split* and keeping them consistent. Compare: *compute features independently for each path* (fast but causes train/serve skew — the exact bug feature stores prevent), versus *define once, materialize to both* (single transformation feeds offline store for training and is pushed to the online store for serving — the right answer). The subtle part is *point-in-time correctness* for training: when generating a training set you must join features as they were at the label's timestamp (point-in-time join), never leaking future values — this prevents label leakage.
**Step 5 — Freshness and the online hot path.** Batch features refresh on a schedule; streaming features update the online store within seconds via a stream processor. Online reads are keyed lookups (entity ID → feature vector) served from a low-latency KV store; precompute and cache feature vectors so inference does no heavy computation.
**Step 6 — Guard rails.** Version feature definitions, track lineage, monitor for feature drift/staleness, and handle backfills when a new feature is added to historical data.

**Key points:**
- The reason to exist is eliminating train/serve skew: define once, materialize to both stores.
- Point-in-time joins prevent label leakage in training data — a classic scored detail.
- Two workloads, two stores: low-latency KV online, bulk-scan warehouse offline, kept in sync by materialization.
- Streaming vs batch features differ in freshness; version and monitor features for drift.

---

### 47. Design an ML model-serving / inference platform

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, ml-infra, gpu, batching, autoscaling

**Answer:** Walk from a model artifact to a served endpoint, then spend your time on batching + GPU utilization and safe model rollout, which are the scored decisions.

**Step 1 — Clarify what we're building.** Core operations: register a trained model, deploy it behind a low-latency prediction API, scale it, and roll out new versions safely. Unknowns to raise: online real-time vs batch inference? Model size (a small tree vs a 70B LLM)? Latency SLA and QPS? Framing conclusion: for real-time serving on expensive GPUs, the whole game is *keeping the accelerator busy while meeting a latency SLA*.
**Step 2 — Do the napkin math.** GPUs are the cost center; a single GPU inference might take 10-50ms, and GPUs are massively more efficient when fed batches. Traffic is bursty and latency-sensitive. So it is *latency-critical, expensive-per-unit-compute, and throughput-improves-with-batching* — utilization is the dominant cost lever.
**Step 3 — Lay out the pieces.** A model registry + artifact store, a serving runtime (Triton/TorchServe/vLLM) loading models onto GPU nodes, an inference gateway/router, an autoscaler, and a feature/context fetch step (often hitting the feature store) before prediction.
**Step 4 — Dynamic batching + GPU utilization (the scored decision).** The heart is throughput vs latency. Compare: *one request per forward pass* (lowest latency, terrible GPU utilization and cost), versus *dynamic batching* — accumulate incoming requests for a few milliseconds and run them as one batch (dramatically better throughput/$ at a small, bounded latency cost) — the right answer, with a max-batch-size and max-wait tunable to the SLA. Add *model-appropriate tricks*: for LLMs, continuous/in-flight batching and KV-cache reuse; quantization to fit bigger models or cut latency. Route by model so each GPU pool serves compatible models.
**Step 5 — Safe rollout and autoscaling.** Deploy new model versions via *canary/shadow* traffic (shadow: send a copy of live traffic to the new model, compare outputs, no user impact) before shifting real traffic; keep the old version for instant rollback. Autoscale on GPU utilization / queue depth, and handle cold starts (model load is slow) with warm pools and pre-loading.
**Step 6 — Guard rails.** Enforce per-request timeouts and a bounded queue (shed load rather than blow the SLA), monitor latency percentiles and prediction quality/drift, and cache repeated identical inputs.

**Key points:**
- Dynamic batching is the core lever: trade a few ms of latency for large GPU throughput/cost wins, bounded by max-batch/max-wait.
- LLM-specific serving adds continuous batching, KV-cache reuse, and quantization.
- Roll models out via shadow/canary with instant rollback; autoscale on GPU utilization and queue depth.
- GPUs are the cost center — utilization, load shedding, and warm pools for cold starts dominate the design.

---

### 48. Design an A/B testing / experimentation platform

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, experimentation, assignment, statistics, analytics

**Answer:** Walk from defining an experiment to assigning users and measuring results, then focus on deterministic bucketing and correct metric analysis — the two things that make experiments trustworthy.

**Step 1 — Clarify what we're building.** Core operations: define experiments with variants and traffic allocation, deterministically assign users to variants, log exposures and events, and compute statistically valid results. Unknowns: how many concurrent experiments? Client-side vs server-side assignment? Do experiments overlap on the same users? Framing conclusion: the platform's credibility rests on *consistent assignment* and *statistically correct analysis* — get those wrong and every decision built on it is garbage.
**Step 2 — Do the napkin math.** Assignment must happen on every request in the hot path at full site QPS (potentially millions/s) with sub-millisecond overhead. Event logging is a firehose (billions of events/day), analysis is offline batch. So it is *ultra-low-latency read-heavy on assignment* and *high-throughput write + heavy batch analytics on measurement*.
**Step 3 — Lay out the pieces.** An experiment config service (definitions, allocations, targeting), an assignment SDK/library embedded in apps, an exposure + event logging pipeline (Kafka → warehouse), and an analysis engine computing metrics and significance.
**Step 4 — Deterministic assignment (the scored decision).** The heart is bucketing that is *consistent, fast, and unbiased without a lookup*. Compare: *store each user's assignment in a DB* (consistent but a DB hit on every request — too slow, doesn't scale), versus *hash(user_id + experiment_id) mod 100* (stateless, deterministic, sub-microsecond, same user always gets the same variant) — the right answer. Salting the hash per experiment ensures independence so overlapping experiments don't correlate. To run many experiments at once, use *mutually exclusive layers/domains* (Google's overlapping-experiments model) so experiments that might interfere are isolated while independent ones share traffic.
**Step 5 — Correct measurement.** Log an *exposure event* only when a user actually hits the experiment (not just eligibility), so analysis measures the treated population. In analysis, watch for *peeking* (checking significance repeatedly inflates false positives — use fixed horizons or sequential testing), apply CUPED/variance reduction, and run sample-ratio-mismatch (SRM) checks to detect a broken assignment.
**Step 6 — Guard rails.** Support targeting/holdouts, guardrail metrics that auto-alert on harm, and instant kill-switch to ramp a bad variant to 0% without a deploy.

**Key points:**
- Deterministic hash-based bucketing (hash(user+exp) mod 100) is the scored decision — stateless, consistent, no DB lookup.
- Salted hashes + mutually-exclusive layers let many experiments run without cross-contamination.
- Trustworthy analysis: log real exposures, avoid peeking, check for sample-ratio mismatch, reduce variance.
- Guardrail metrics + kill-switch protect users from a harmful variant.

---

### 49. Design an email service at scale (send / receive)

**Frequency:** Low

**Difficulty:** Hard
**Topics:** system-design, smtp, queueing, deliverability, storage

**Answer:** Split it cleanly into the send path (outbound SMTP + deliverability) and the receive/store path (inbound SMTP + mailbox storage + search), and spend your time on deliverability and queue durability.

**Step 1 — Clarify what we're building.** Core operations: users send email (to any external domain), receive email from anywhere, and read/search/organize their mailbox. Unknowns: are we a mailbox provider (like Gmail) or a transactional sending API (like SES/SendGrid)? Scale of users/messages? Framing conclusion: email is two loosely-coupled systems glued by the SMTP protocol — *outbound delivery with reputation management* and *inbound receipt with mailbox storage* — decide which is emphasized.
**Step 2 — Do the napkin math.** A large provider handles billions of messages/day; each is small (KB of text, but attachments can be MB). Sending is bursty and must retry over hours; storage grows forever (petabytes) and is read-heavy per-user. So it is *write-heavy durable queueing on send*, and *massive, long-lived, read-heavy storage on receive*.
**Step 3 — Lay out the pieces.** Outbound: a submission API → a durable send queue → MTA workers that do SMTP delivery, plus bounce/complaint handling. Inbound: MX servers receiving SMTP → spam/virus filtering → mailbox storage. Plus a mailbox metadata store, blob storage for bodies/attachments, and a search index.
**Step 4 — Outbound delivery + deliverability (the scored decision).** The heart of the send path. Delivery must be *durable and retried*: enqueue the message, attempt SMTP, and on a soft failure (4xx / greylisting) retry with backoff over hours, on hard failure (5xx) bounce — the queue is the source of truth so nothing is lost. But the *scored* subtlety is deliverability, not mechanics: authenticate every message with *SPF, DKIM, and DMARC* or it lands in spam; manage sender *IP/domain reputation* by warming up IPs and throttling per-recipient-domain; process feedback loops and bounces to suppress bad addresses. Getting into the inbox is harder than sending the bytes.
**Step 5 — Inbound + mailbox storage.** MX servers accept mail, run spam/virus filtering, then write the body to blob storage and metadata (from/to/subject/folder/flags) to a per-user store; build an inverted index for search. Compare storing bodies *inline in the DB* (simple, but bloats it) versus *blob storage + metadata DB* (the right call at scale — cheap, dedupable). Dedupe identical attachments across recipients.
**Step 6 — Guard rails.** Idempotent sends (dedupe on message-id), rate-limit senders to fight abuse, encrypt at rest, and TLS for SMTP in transit. Handle poison messages in the send queue.

**Key points:**
- Two subsystems joined by SMTP: durable outbound delivery vs long-lived read-heavy inbound storage.
- Deliverability is the scored insight: SPF/DKIM/DMARC + IP reputation/warmup + bounce/FBL handling beat raw send mechanics.
- The send queue is the durable source of truth: retry soft failures with backoff, bounce hard failures.
- Mailbox = metadata DB + blob storage + search index; dedupe attachments, store bodies out of the DB.

---

### 50. Design a spam / abuse detection pipeline

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, ml, streaming, rules-engine, feedback-loop

**Answer:** Frame it as a layered defense combining fast rules, ML scoring, and async review, and spend your time on the inline-vs-async decision and the adversarial feedback loop.

**Step 1 — Clarify what we're building.** Core operations: evaluate content/actions (messages, posts, signups, transactions) and decide allow / block / challenge / review, in near real-time, and keep improving as abusers adapt. Unknowns: what surface (email spam, fake accounts, payment fraud, comment spam)? Latency budget in the user's path? Framing conclusion: this is an *adversarial* classification problem — attackers actively evade you — so the design must be layered and continuously retrained, not a static model.
**Step 2 — Do the napkin math.** Every user action flows through it at full product QPS (thousands to millions/s), and it must add only a few milliseconds inline. The vast majority is benign; abuse is a small, bursty, coordinated minority. So it is *high-QPS, ultra-low-latency inline, heavily class-imbalanced* — cheap filters must handle the common case and expensive analysis is reserved for the suspicious.
**Step 3 — Lay out the pieces.** An inline scoring gateway on the request path, a fast rules engine + blocklists, a feature service (user history, velocity, reputation), an ML model service, an async/streaming pipeline for heavier analysis and graph/clustering, a human-review queue, and a labels/feedback store feeding retraining.
**Step 4 — Inline vs async layered decisioning (the scored decision).** The heart is *where each check runs*. Compare a *single inline ML model* (simple, but you can't run expensive graph analysis in a few ms, and one model is brittle to new attacks) versus a *layered pipeline*: cheap deterministic rules/blocklists block the obvious inline in microseconds; a lightweight inline ML model scores the rest for an allow/challenge/block decision within the latency budget; and everything is *also* streamed to an async pipeline that does heavy work (device/IP clustering, graph analysis to catch coordinated rings, cross-account patterns) which can retroactively ban. This layering is the right answer — fast path for the 99%, deep analysis off the critical path. For borderline scores, *challenge* (CAPTCHA/2FA) instead of hard-block to cut false positives.
**Step 5 — The adversarial feedback loop.** Abuse is a moving target, so the design must retrain continuously: collect labels from user reports, human review, and confirmed-abuse outcomes, feed them back, and retrain/redeploy frequently. Prefer velocity/behavioral and reputation features over static content signatures (which abusers trivially mutate). Monitor for model degradation as attackers adapt.
**Step 6 — Guard rails.** Tune the precision/recall trade-off deliberately (a false block angers real users; a miss lets abuse through) — use challenges for the gray zone and human review for high-impact actions. Guard against feedback poisoning and keep an appeals path.

**Key points:**
- Layered defense is the scored decision: microsecond rules → inline lightweight ML → async heavy graph/cluster analysis that can retro-ban.
- Keep the common (benign) case cheap and inline; reserve expensive coordinated-abuse analysis for off the critical path.
- It's adversarial: continuous relabeling + retraining, and behavioral/velocity features over easily-mutated content signatures.
- Manage precision/recall with challenges (CAPTCHA/2FA) for the gray zone rather than hard-blocking everyone.

---

### 51. Design a fraud-detection system

**Frequency:** High

**Difficulty:** Hard
**Topics:** system-design, streaming, machine-learning, feature-store, low-latency

**Answer:** Frame it as a real-time scoring pipeline that sits inline on the transaction path, then layer in async model retraining and analyst tooling behind it.

**Step 1 — Clarify what we're building.** Core operation: given a transaction (payment, login, signup), return an approve/decline/challenge decision in tens of milliseconds. Key unknowns to raise: is scoring *inline* (blocks the transaction) or *near-line* (flags after the fact)? What's the acceptable false-positive rate versus missed-fraud rate? The framing conclusion that drives everything: this is a latency-critical, read-heavy scoring service with a heavy offline learning loop behind it.
**Step 2 — Do the napkin math.** Say 10k transactions/sec at peak, each needing a decision in <50ms p99. That's bursty (holiday spikes 5-10x) and overwhelmingly read-heavy on features — one score may touch 100+ features, so it's a fan-out read problem, not a write-throughput problem. Model retraining is a daily/hourly batch, tiny by comparison.
**Step 3 — Lay out the pieces.** Inline scoring service, a low-latency feature store (online), a streaming layer (Kafka + Flink) computing rolling aggregates ("txns in last 5 min for this card"), a rules engine for hard blocks, a model-serving tier, plus an offline warehouse and labeling/feedback pipeline. Decisions and features are logged for audit and training.
**Step 4 — Real-time features vs. model freshness.** This is the scored decision. *Pure rules engine:* explainable, instant to update, but brittle and gamed quickly. *Batch-only ML:* powerful models but features are hours stale — misses velocity attacks. *Streaming features + online model:* compute velocity/aggregate features in Flink, write to a fast online store (Redis/Cassandra) keyed by card/device/IP, and serve a gradient-boosted or NN model against them. Trade-off is the *dual-write / consistency* between the streaming aggregate and the point-in-time feature used at training, which causes train-serve skew if not from the same feature definitions — solve with a shared feature store that serves both offline (point-in-time correct) and online.
**Step 5 — Make the hot path fast and safe to fail.** Precompute and cache features; time-box each external lookup and fall back to a conservative default (or rules-only decision) on timeout, so a feature-store blip degrades to "challenge" not "outage." Combine model score with a rules override so you can react to a new attack in minutes without a retrain.
**Step 6 — Feedback loop and abuse.** Labels arrive late (chargebacks come weeks later), so guard against label leakage and delayed ground truth; watch for concept drift and adversarial adaptation. Add a challenge (step-up auth) path so borderline scores aren't a binary block, and shadow-deploy new models before they take traffic.

**Key points:**
- Inline decision in tens of ms → feature store + streaming aggregates are the backbone, not the model itself.
- The scored decision is streaming features vs. staleness; a shared offline/online feature store prevents train-serve skew.
- Rules engine + ML together: rules for instant, explainable blocks, ML for coverage.
- Fail safe: time-box lookups, degrade to challenge/rules rather than deny service.
- Labels are delayed and adversarial — plan for drift, feedback, and shadow deploys.

---

### 52. Design an authentication / SSO system (OAuth)

**Frequency:** High

**Difficulty:** Hard
**Topics:** system-design, oauth, security, tokens, identity

**Answer:** Walk it as an OAuth2/OIDC authorization-code flow, then defend the token design and the revocation story.

**Step 1 — Clarify what we're building.** Core operations: authenticate a user once and let many apps (first- and third-party) get scoped access without seeing the password. Unknowns to raise: are we the *identity provider* (like Google login) or a *relying party* integrating one? Web, mobile, and machine-to-machine clients? The conclusion that drives design: build an OIDC provider issuing signed tokens, with the authorization-code + PKCE flow as the default.
**Step 2 — Do the napkin math.** Logins are infrequent per user (once per session, maybe daily), but *token validation* happens on every API call — potentially 100k+ validations/sec across services. So the read-heavy hot path is verification, not login; that pushes us toward stateless, locally-verifiable tokens.
**Step 3 — Lay out the pieces.** Auth server (login UI, consent, token endpoint), a user/credential store (passwords as bcrypt/argon2), a signing-key service (JWKS with rotation), the resource servers that validate tokens, and a session store for the auth server's own cookie. OIDC adds an ID token (identity) alongside the OAuth access token (authorization).
**Step 4 — Stateless JWT vs. opaque reference tokens.** This is the heart. *JWT access tokens:* self-contained, signed, verified locally with the public key — zero lookup on the hot path, scales beautifully, but you *can't revoke a token before it expires*. *Opaque tokens:* random string, resource server introspects against the auth server — instantly revocable but adds a network hop and a central bottleneck on every call. The staff answer is usually *short-lived JWTs (5-15 min) + long-lived refresh tokens*: JWTs stay stateless and fast, refresh tokens are stored server-side so revoking the refresh token kills the session within one JWT lifetime. Use PKCE to protect the code exchange on public clients.
**Step 5 — Key management and revocation.** Rotate signing keys and publish them via JWKS so resource servers refresh public keys automatically; support multiple valid keys during rotation. For emergency revocation, maintain a small denylist of token IDs checked on the hot path, accepting the added lookup only for revoked tokens.
**Step 6 — Guard rails.** Refresh-token rotation with reuse detection (a reused refresh token means theft — revoke the whole family), bind tokens to client/audience to prevent replay across services, rate-limit the token endpoint, and always redirect through registered redirect URIs to stop open-redirect and code-injection attacks.

**Key points:**
- Login is rare; token validation is the hot path — optimize for stateless local verification.
- Core trade-off: JWT (fast, hard to revoke) vs. opaque (revocable, central lookup); resolve with short JWT + refresh token.
- PKCE + authorization-code flow is the default for web and mobile public clients.
- Key rotation via JWKS; refresh-token rotation with reuse detection stops replay/theft.
- Separate ID token (who you are) from access token (what you can do).

---

### 53. Design a session-management system

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, sessions, caching, cookies, security

**Answer:** Frame it around where session state lives, then reason from the cookie to the store to expiry and revocation.

**Step 1 — Clarify what we're building.** Core operations: create a session at login, look it up on every request, and destroy it on logout/expiry. Unknowns to raise: server-rendered web, SPA, or mobile? Do we need instant logout-everywhere? The conclusion that drives design: the read on every request dominates, so lookup cost is the thing to optimize.
**Step 2 — Do the napkin math.** With 10M active users, a session record is ~1KB → ~10GB, trivially fits in memory across a Redis cluster. Reads happen on essentially every authenticated request (say 100k/sec), writes only on login/refresh — extremely read-heavy with a small dataset.
**Step 3 — Lay out the pieces.** A signed cookie holding the session ID (HttpOnly, Secure, SameSite), a fast session store (Redis with TTL), and middleware that resolves cookie → session on each request. Store user ID, roles, CSRF token, expiry, and device metadata.
**Step 4 — Server-side session store vs. stateless signed cookies.** The scored decision. *Server-side sessions (opaque ID in cookie):* small cookie, easy instant revocation (delete the key), but every request hits the store — mitigated by it being an in-memory O(1) lookup. *Stateless signed cookies (all state in a JWT/signed blob):* zero store, no central dependency, but the cookie grows, can't be revoked before expiry, and stale data lives in the cookie. Pick server-side sessions when logout-everywhere and freshness matter; pick stateless when you want to avoid the store and sessions are short. A common hybrid is a server-side store with the cookie as just the key.
**Step 5 — Expiry and sliding windows.** Use Redis TTL for absolute expiry, plus a *sliding* refresh (bump TTL on activity) with an absolute cap so sessions can't live forever. Separate idle timeout from absolute lifetime.
**Step 6 — Security guard rails.** HttpOnly + Secure + SameSite to blunt XSS/CSRF, rotate the session ID on privilege change (login, elevation) to stop fixation, bind sessions loosely to device/IP for anomaly detection, and support "log out all devices" by keying sessions under the user for bulk deletion.

**Key points:**
- The per-request lookup is the hot path; keep sessions in an in-memory store with TTL.
- Decision: server-side opaque sessions (revocable) vs. stateless signed cookies (no store) — hybrid uses cookie-as-key.
- Sliding TTL for UX, absolute cap for security.
- HttpOnly/Secure/SameSite cookies; rotate ID on privilege change to prevent fixation.
- Index sessions by user to enable logout-everywhere.

---

### 54. Design a secrets-management / vault service

**Frequency:** Medium

**Difficulty:** Hard
**Topics:** system-design, security, encryption, access-control, key-management

**Answer:** Walk it as encryption-at-rest with an envelope-key hierarchy, then the access-control, auditing, and dynamic-secrets layers on top.

**Step 1 — Clarify what we're building.** Core operations: store, retrieve, rotate, and revoke secrets (DB passwords, API keys, certs) with strong auth and a full audit trail. Unknowns: static secrets only, or *dynamic* (generated on-demand, short-lived)? Who are the clients — humans, services, CI? The conclusion: this is a security-first system where the threat model and key hierarchy dominate over throughput.
**Step 2 — Do the napkin math.** Volume is modest — maybe thousands of secrets, thousands of reads/sec from services fetching credentials at boot or on rotation. Not throughput-bound; the hard requirements are confidentiality, availability (an outage locks everyone out of everything), and auditability.
**Step 3 — Lay out the pieces.** An API/auth layer, an encrypted storage backend, a *sealed* master-key mechanism, an audit log (append-only), and a policy engine mapping identities to paths. Optionally a dynamic-secrets engine that mints per-client DB users with a lease.
**Step 4 — The encryption key hierarchy and unseal.** This is the heart. Use *envelope encryption*: each secret is encrypted with a data key, data keys are encrypted by a master key, and the master key never touches disk in plaintext. Options for protecting the master key: *(a) an HSM/cloud KMS* — strongest, hardware-backed, but a hard external dependency; *(b) Shamir secret-sharing* to split the unseal key among N operators needing k to reconstruct — no single person can unseal, great for on-prem, but manual and slow to recover; *(c) auto-unseal via KMS* — operationally smooth but leans on the cloud provider. Trade-off is *operator control vs. availability*: manual unseal is safest against insider/cloud compromise but risks locking you out during an incident.
**Step 5 — Access control and identity.** Every request authenticates (service identity via mTLS/JWT/cloud IAM, not a shared secret) and is authorized by path-scoped policies with least privilege. Leases and TTLs on issued secrets mean a leaked credential auto-expires; support immediate revocation cascading through the lease tree.
**Step 6 — Dynamic secrets and audit.** Prefer *dynamic secrets* — generate a unique short-lived DB credential per client so a leak is contained and attributable — over long-lived shared passwords. Make the audit log append-only and tamper-evident (hash-chained), and encrypt it too since request metadata is sensitive.

**Key points:**
- Envelope encryption with a never-on-disk master key is the foundation.
- Scored decision: how the master key is protected (HSM/KMS vs. Shamir vs. auto-unseal) — trades operator control against availability.
- Identity-based, path-scoped, least-privilege access; no shared secrets to authenticate.
- Dynamic short-lived secrets contain and attribute leaks better than static ones.
- Append-only, tamper-evident, encrypted audit log; leases enable auto-expiry and cascading revocation.

---

### 55. Design a multi-datacenter distributed rate limiter

**Frequency:** High

**Difficulty:** Hard
**Topics:** system-design, rate-limiting, distributed-systems, consistency, caching

**Answer:** Start from the single-node algorithm, then confront the real question: how to enforce a global limit across datacenters without a synchronous cross-DC hop on every request.

**Step 1 — Clarify what we're building.** Core operation: allow N requests per key (user/API-key/IP) per window, returning allow/deny in sub-millisecond time. Unknowns: is the limit *global* (N across all DCs) or *per-DC*? How strict — is a small overshoot acceptable? The conclusion that drives everything: strict global limits force coordination; approximate global limits let each DC act locally, and that choice defines the design.
**Step 2 — Do the napkin math.** At 1M requests/sec across 3 DCs, the limiter is on the hot path of *every* request, so it must add <1ms and never be a single point of failure. Cross-DC latency is 50-150ms — doing a synchronous global check per request is a non-starter at this scale.
**Step 3 — Lay out the pieces.** A limiter library/sidecar at each edge, a per-DC fast counter store (Redis), and a cross-DC sync/gossip channel. Algorithm choice sits underneath: *token bucket* (allows bursts, smooth refill) vs. *sliding-window log/counter* (accurate, more memory) — token bucket is the usual default for its burst tolerance and O(1) state.
**Step 4 — Global enforcement across DCs.** This is the scored decision. *Synchronous central store:* one global Redis, perfectly accurate, but every request pays cross-DC latency and it's a SPOF — rejected. *Local limits with static split:* give each of 3 DCs N/3 of the budget, purely local and fast, but wastes budget when traffic is skewed to one DC. *Local counting + async aggregation:* each DC counts locally and gossips counts every few hundred ms; each DC enforces against the last-known global total. This is *eventually consistent* — you may overshoot by up to one sync interval's worth of traffic — but it's fast, DC-independent, and degrades gracefully. The trade-off is *accuracy vs. latency/availability*; most real systems accept small overshoot for local-speed decisions.
**Step 5 — Handle the hot key and failure.** A single hot API key can hammer one shard — shard counters and/or use a local in-memory pre-check before the Redis call. On store failure, *fail open* (allow) for availability or *fail closed* (deny) for protection — usually fail open for user-facing traffic, fail closed for abuse/security limits. Return standard 429 with Retry-After.
**Step 6 — Fairness and abuse.** Support multiple tiers (per-user, per-IP, global) evaluated together, add jitter to avoid synchronized retries stampeding at window boundaries, and prefer sliding windows over fixed windows to avoid the 2x burst at the window edge.

**Key points:**
- Every request is on the hot path — sub-ms, no SPOF, cross-DC sync must be async.
- Scored decision: strict global (synchronous, accurate, slow) vs. local-count + async gossip (eventually consistent, small overshoot, fast).
- Token bucket for bursts + O(1) state; sliding window for accuracy.
- Decide fail-open vs. fail-closed explicitly per limit type.
- Guard hot keys with local pre-checks and sharded counters; add jitter and tiered limits.

---

### 56. Design an audit-log / event-sourcing system

**Frequency:** Medium

**Difficulty:** Hard
**Topics:** system-design, event-sourcing, cqrs, append-only, immutability

**Answer:** Frame the event log as the single immutable source of truth, then derive read views from it and defend the append-only guarantees.

**Step 1 — Clarify what we're building.** Distinguish two things that share a design: an *audit log* (append-only record of who did what, for compliance) vs. *event sourcing* (store state changes as events and rebuild state by replaying them). Unknowns: do we need to reconstruct historical state, or just query "what happened"? Retention and compliance requirements? The conclusion: the log is append-only and immutable; everything else is a projection off it.
**Step 2 — Do the napkin math.** Write-heavy and monotonically growing — say 50k events/sec, ~1KB each → ~4TB/day uncompressed. Reads are a mix of recent-tail queries and occasional full replays. The dataset only grows, so retention/tiering and compaction dominate the storage story.
**Step 3 — Lay out the pieces.** An append-only event store (Kafka as the log, or a DB with an append-only events table), a schema/versioning registry for event types, *projections* that consume the log to build query-optimized read models, and a snapshot store to avoid replaying from time zero. This is CQRS: writes go to the log, reads hit the projections.
**Step 4 — Rebuilding state: replay vs. snapshots.** The heart of the design. Pure *replay from the beginning* is simple and fully auditable but gets slow as the log grows — replaying billions of events to answer one query is untenable. *Periodic snapshots* store materialized state at a version so you replay only events since the last snapshot — fast recovery, at the cost of snapshot storage and the discipline of keeping snapshots consistent with evolving event schemas. The related decision is *schema evolution*: events are immutable forever, so you need *upcasting* (transform old event versions to new on read) and additive-only changes; you can never rewrite history. Trade-off: snapshots buy read/recovery speed but add complexity and must be invalidated carefully when projection logic changes.
**Step 5 — Ordering, idempotency, and exactly-once projection.** Consumers must handle events in order per aggregate (partition by aggregate ID) and be idempotent (track last-processed offset) so a replay or redelivery doesn't double-apply. For audit specifically, guarantee ordering and completeness — a gap in the log is a compliance failure.
**Step 6 — Immutability and tamper-evidence.** Enforce append-only at the storage layer (no updates/deletes), hash-chain records so tampering is detectable, and handle GDPR "right to erasure" via *crypto-shredding* (encrypt PII per-subject and delete the key) rather than deleting events. Tier old segments to cold storage.

**Key points:**
- The append-only event log is the source of truth; read models are disposable projections (CQRS).
- Scored decision: replay vs. snapshots for rebuilding state — snapshots trade storage for recovery speed.
- Events are immutable forever → schema evolution via upcasting and additive changes only.
- Order per aggregate + idempotent, offset-tracked consumers make replay safe.
- Tamper-evidence via hash-chaining; GDPR erasure via crypto-shredding, not deletion.

---

### 57. Design a data warehouse / OLAP system

**Frequency:** Medium

**Difficulty:** Hard
**Topics:** system-design, olap, columnar-storage, analytics, data-modeling

**Answer:** Frame it as separating analytical query workloads from the operational stores, then defend the columnar storage, data model, and compute-storage split.

**Step 1 — Clarify what we're building.** Core operation: run large analytical aggregations (GROUP BY, JOINs, scans over billions of rows) for BI and reporting, distinct from OLTP's small point reads/writes. Unknowns: latency expectation (interactive dashboards vs. overnight reports), data freshness (hourly batch vs. near-real-time), and query concurrency. The conclusion: this is scan-and-aggregate over huge, mostly-append data — the opposite optimization target from a transactional DB.
**Step 2 — Do the napkin math.** Say 10TB of new data/day, queries scanning billions of rows but touching only a few columns. Reads are heavy, wide-scan, and bursty (business hours, Monday-morning reports); writes are bulk-append batches, not row-by-row. That read/aggregate shape is what justifies columnar storage.
**Step 3 — Lay out the pieces.** An ingestion/ETL layer landing data in the warehouse, columnar storage (Parquet/ORC on object storage, or a native columnar engine), a distributed query engine, a metadata/catalog, and a semantic/BI layer on top. Model as a *star schema*: fact tables (events/transactions) surrounded by dimension tables (user, product, time).
**Step 4 — Columnar storage and the compute/storage decision.** The heart. *Row-oriented (OLTP-style):* great for fetching whole rows, terrible for scanning one column across billions of rows. *Columnar:* stores each column contiguously, so a query reading 3 of 50 columns reads ~6% of the data, and per-column compression (RLE, dictionary) is dramatic — this is non-negotiable for OLAP. The second decision is *coupled vs. decoupled compute/storage*: classic MPP (Teradata/Redshift-classic) co-locates compute with data for speed but scales the two together and struggles with elastic bursts; *decoupled* (Snowflake/BigQuery/Presto-on-S3) stores data in cheap object storage and spins compute independently — cheaper, elastically scalable, multi-cluster isolation, at the cost of a network read from storage. Trade-off is *raw locality speed vs. elasticity and cost*; modern designs almost always pick decoupled with caching to hide the network.
**Step 5 — Make queries fast: partitioning, pruning, pre-aggregation.** Partition by date and cluster/sort by common filter columns so the engine *prunes* files via min/max statistics and reads only relevant partitions. Build materialized views/cubes for hot dashboard queries, and cache results. Use late-arriving-data handling and MERGE/upsert for corrections.
**Step 6 — Concurrency and cost governance.** Isolate workloads with separate compute clusters (ETL vs. BI vs. ad-hoc) so a heavy query doesn't starve dashboards, enforce query cost limits/quotas, and manage data lifecycle by tiering cold partitions.

**Key points:**
- OLAP = wide scans + aggregation over append-heavy data; the opposite of OLTP point access.
- Columnar storage + compression is mandatory: read only the columns you need.
- Scored decision: coupled MPP (locality/speed) vs. decoupled compute-storage (elastic, cheap) — modern default is decoupled + caching.
- Star schema (facts + dimensions); partition and sort to enable file pruning.
- Materialized views/cubes for hot queries; isolate workloads and govern query cost.

---

### 58. Design an ETL / batch data pipeline

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, etl, batch-processing, orchestration, idempotency

**Answer:** Walk it as extract → transform → load with an orchestrator on top, then defend idempotency, failure recovery, and the ELT-vs-ETL choice.

**Step 1 — Clarify what we're building.** Core operation: on a schedule, pull data from sources (DBs, APIs, files), transform/clean it, and load it into a warehouse or lake. Unknowns: batch cadence (hourly/daily), data volume, and how sources signal new data (full dump vs. incremental). The conclusion: this is a scheduled, dependency-ordered DAG of jobs where *reliability and reprocessing* matter more than latency.
**Step 2 — Do the napkin math.** Say 100 source tables, a few TB/day, jobs running hourly. Throughput must comfortably finish within the window (a 1-hour job on an hourly schedule leaves no slack — size for 2-3x headroom). It's write-heavy bulk movement, bursty at schedule boundaries, latency-tolerant.
**Step 3 — Lay out the pieces.** An orchestrator (Airflow/Dagster) managing the DAG and dependencies, extract connectors, a transform engine (Spark/dbt/SQL), a staging area, and the destination warehouse/lake. A metadata store tracks watermarks (last-loaded position) and run state.
**Step 4 — Incremental loads and idempotency.** The heart. *Full reload every run:* dead simple and self-correcting, but wasteful and infeasible past a certain size. *Incremental via watermark:* pull only rows changed since the last high-water mark (updated_at or an ID) — efficient, but must handle late-arriving and updated rows, and a naive re-run can duplicate data. The key discipline is *idempotency*: design loads so re-running a partition produces the same result — use *partition overwrite* (delete-and-reload the day's partition) or *MERGE/upsert on a key* rather than blind append. Trade-off: full reloads trade compute for simplicity/correctness; incremental trades efficiency for the complexity of watermarks and dedup. Staff answer: incremental with idempotent partition-level writes so any failed run is safely retryable.
**Step 5 — Failure recovery and orchestration.** Make each task retryable and checkpoint at partition granularity so a failure resumes from the last good partition, not the whole job. Encode dependencies in the DAG so downstream jobs wait for upstream success, and support backfills (re-run a date range) using the same idempotent code path.
**Step 6 — Data quality and schema drift.** Add validation gates (row counts, null/uniqueness checks, referential checks) that fail the run before bad data lands, handle source *schema evolution* gracefully, and emit lineage/metrics so you can trace and alert on freshness SLAs.

**Key points:**
- A scheduled dependency DAG where reliability and reprocessing beat latency.
- Scored decision: full reload (simple, wasteful) vs. incremental watermark loads (efficient, needs dedup) — make writes idempotent via partition overwrite or MERGE.
- Idempotency makes retries and backfills safe; checkpoint at partition granularity.
- Orchestrator encodes dependencies, retries, and backfills.
- Quality gates and schema-drift handling stop bad data before it lands; track lineage and freshness.

---

### 59. Design a stream-processing system (Flink-style)

**Frequency:** Medium

**Difficulty:** Hard
**Topics:** system-design, stream-processing, windowing, exactly-once, state-management

**Answer:** Frame it as continuous computation over unbounded streams, then defend the windowing/time model, state management, and exactly-once guarantees.

**Step 1 — Clarify what we're building.** Core operation: consume unbounded event streams and compute continuous results (aggregations, joins, pattern detection) with low latency. Unknowns: latency target (seconds vs. sub-second), and delivery guarantee (at-least-once vs. exactly-once). The conclusion that drives everything: unbounded data + stateful operators means *time semantics and fault-tolerant state* are the core problems, not raw throughput.
**Step 2 — Do the napkin math.** Say 1M events/sec, stateful aggregations keyed by user → potentially tens of GB of live operator state. It's continuous and write-heavy with a large in-flight state footprint, so state storage and checkpointing cost, not just compute, drive the design.
**Step 3 — Lay out the pieces.** A partitioned source (Kafka), a cluster of stateful worker tasks with the stream partitioned by key, local state backends (RocksDB) per operator, a checkpoint/snapshot store (durable object storage), and sinks. A job manager coordinates checkpoints and recovery.
**Step 4 — Event time vs. windowing and late data.** The heart. Processing on *processing time* (wall clock when the event arrives) is simple and low-latency but gives wrong results when events arrive out of order or delayed. *Event time* (the timestamp in the event) gives correct, reproducible results but requires *watermarks* — a heuristic saying "we believe all events up to time T have arrived" — to know when to close a window. Trade-off: aggressive watermarks close windows early (low latency, may drop late events) vs. conservative watermarks wait longer (higher latency, more completeness). Handle stragglers with *allowed lateness* and side outputs for very-late events. This event-time + watermark model is the single most-scored concept.
**Step 5 — State and exactly-once.** Large keyed state lives in an embedded store (RocksDB) and is periodically snapshotted via *distributed consistent checkpoints* (Chandy-Lamport barriers) to durable storage, so on failure the job restores state and rewinds the source offsets to the checkpoint. Combined with *transactional/idempotent sinks* (two-phase commit or dedup keys), this yields *exactly-once* end-to-end. At-least-once is cheaper (no barrier alignment) but requires the sink to dedup.
**Step 6 — Scaling and backpressure.** Repartition state on rescale (key groups), propagate backpressure upstream when a slow operator can't keep up so buffers don't overflow, and separate hot keys to avoid skewed partitions.

**Key points:**
- Unbounded + stateful → time semantics and fault-tolerant state are the core, not throughput.
- Scored decision: event time + watermarks vs. processing time — trades latency against completeness; use allowed-lateness for stragglers.
- Large keyed state in RocksDB + consistent checkpoints enable stateful recovery.
- Exactly-once = checkpointed state + rewindable source + transactional/idempotent sink.
- Handle backpressure and key skew; repartition state on rescale.

---

### 60. Design a change-data-capture (CDC) pipeline

**Frequency:** Medium

**Difficulty:** Hard
**Topics:** system-design, cdc, replication, kafka, consistency

**Answer:** Frame it as tailing the database's write-ahead log to stream row changes downstream, then defend log-based capture, ordering, and exactly-once delivery.

**Step 1 — Clarify what we're building.** Core operation: capture every insert/update/delete in a source database and deliver them as an ordered event stream to consumers (search index, cache, warehouse, other services). Unknowns: which sources (Postgres/MySQL/Mongo), do consumers need the full row or just the delta, and do we need the initial snapshot plus ongoing changes? The conclusion: read the DB's transaction log, not the tables, to get changes without impacting the source.
**Step 2 — Do the napkin math.** Change volume tracks the source's write rate — say 50k writes/sec → 50k change events/sec, each carrying before/after row images (~KBs). It's a continuous, write-heavy stream; the source's log retention and the connector's ability to keep up (lag) are the pressure points.
**Step 3 — Lay out the pieces.** A log-reading connector (Debezium-style) per source, a durable log/broker (Kafka) with one topic per table partitioned by primary key, a schema registry for evolving row schemas, and downstream sink connectors. The connector persists its read offset (LSN/binlog position) so it resumes without loss.
**Step 4 — Log-based vs. query-based capture.** The heart. *Query-based (polling):* periodically SELECT rows where updated_at > last_run — simple, no special DB access, but *misses deletes*, misses intermediate updates between polls, adds query load, and can't capture the exact commit order. *Trigger-based:* accurate but adds write-path overhead and couples app logic. *Log-based (WAL/binlog tailing):* reads the same log the DB uses for replication, so it captures every change including deletes, in exact commit order, with near-zero impact on the source — this is the staff answer. Trade-off: log-based needs replication privileges and is DB-version-specific, but it's the only approach that's complete and ordered. Handle the *initial snapshot* + seamless handoff to streaming (snapshot then resume from the LSN captured at snapshot start).
**Step 5 — Ordering and exactly-once.** Partition each table's topic by primary key so all changes to one row stay ordered on one partition. Consumers must be *idempotent* (upsert by key, apply only if newer LSN) because CDC is at-least-once by default — a connector restart can redeliver events since the last committed offset. Emit before/after images and tombstones for deletes so consumers can maintain compacted state (Kafka log compaction keeps the latest per key).
**Step 6 — Schema evolution and failure.** Propagate DDL/schema changes through the registry so downstream doesn't break, monitor replication *lag* and log retention (if the connector falls behind the log expiry, you must re-snapshot), and handle source failover by tracking a stable position (GTID) across replicas.

**Key points:**
- Tail the DB transaction log (WAL/binlog), don't poll tables — complete, ordered, low-impact.
- Scored decision: log-based vs. query/trigger-based — only log-based captures deletes and exact commit order.
- Partition by primary key for per-row ordering; consumers idempotent (upsert, LSN check) since delivery is at-least-once.
- Initial snapshot then seamless handoff to streaming at the captured LSN.
- Watch replication lag vs. log retention; propagate schema changes via a registry; handle failover with stable positions.

---

### 61. Design a time-series database

**Frequency:** Medium

**Difficulty:** Hard
**Topics:** system-design, time-series, storage-engine, compression, lsm-tree

**Answer:** Frame it as a write-optimized store for append-only, timestamped data, then walk from ingestion to the storage engine to query and retention.

**Step 1 — Clarify what we're building.** The core operations are `write(metric, tags, timestamp, value)` and range queries with aggregation (`avg/sum/rate over [t0,t1] grouped by tag`). Key unknowns to raise: cardinality of the tag space (this is the make-or-break dimension), retention horizon, and whether we need exact or approximate aggregates. The framing conclusion: writes vastly outnumber reads and arrive in timestamp order, so we optimize for sequential append.
**Step 2 — Do the napkin math.** 1M active series each emitting every 10s is ~100K points/s sustained, ~8.6B points/day. At 16 bytes/point raw that's ~140GB/day uncompressed — but time-series compresses 10-20x, so the real cost is CPU on ingest and the index, not raw disk. Shape: extremely write-heavy, append-mostly, bursty on incident spikes.
**Step 3 — Lay out the pieces.** An ingest tier that batches and shards by series ID, an in-memory head block for recent data (WAL-backed), on-disk immutable blocks partitioned by time window, and an inverted index mapping tag key-value pairs to series IDs.
**Step 4 — The storage engine and compression.** This is the scored decision. Compare an *LSM-tree* (great write throughput, but reads merge across levels and compaction competes with ingest) versus *time-partitioned immutable blocks* à la Prometheus/InfluxDB (each 2h block is written once then sealed, making retention a directory delete and eliminating in-place updates). For values, use *delta-of-delta* encoding on timestamps (regular intervals compress to near-zero) plus *XOR (Gorilla) compression* on floats — together this is the 10x win. The trade-off is that blocks are immutable, so out-of-order and late-arriving points need a separate mutable head or a rewrite.
**Step 5 — Taming cardinality on the read path.** The inverted index (tag→series) is what makes queries fast, but high-cardinality tags (e.g. request IDs) explode it and are the #1 real-world failure. Enforce cardinality limits, keep the index memory-resident per block, and use posting-list intersection to resolve multi-tag queries before scanning column chunks.
**Step 6 — Retention and downsampling.** Roll up raw data into pre-aggregated lower-resolution series (1m→1h→1d) via background compaction, and let time-partitioning make expiry an O(1) drop of whole blocks rather than row-level deletes.

**Key points:**
- Time-series is write-heavy and append-in-order — optimize for sequential writes and immutable, time-partitioned blocks.
- Delta-of-delta timestamps + XOR float compression give the 10-20x storage win.
- Tag cardinality is the real scaling limit; guard it explicitly.
- Retention = dropping whole time partitions; downsample old data instead of keeping raw forever.

---

### 62. Design a geospatial proximity / nearby-places service

**Frequency:** High

**Difficulty:** Medium
**Topics:** system-design, geospatial, geohash, quadtree, indexing

**Answer:** Frame it around the one hard query — "find the K nearest points to a lat/lng within radius R" — and let the spatial index choice carry the answer.

**Step 1 — Clarify what we're building.** Operations are `search(lat, lng, radius)` returning nearby places, plus updates when places (or moving drivers) change location. Key unknown to raise: are the points mostly static (restaurants) or constantly moving (ride-share drivers)? That single answer drives the index and the write path. Assume mostly-static places first.
**Step 2 — Do the napkin math.** 100M places, tens of millions of searches/day peaking at ~10K QPS. Each search touches a small geographic neighborhood, so the working set per query is tiny — the challenge is turning a 2D range query into something an index can answer in milliseconds. Shape: read-heavy, latency-sensitive.
**Step 3 — Lay out the pieces.** A location index, a places metadata store keyed by place ID, and a query service that resolves a point+radius into candidate cells then ranks by true distance.
**Step 4 — The spatial index.** This is the scored decision. Compare *geohash* (encode lat/lng into a base-32 string prefix so nearby points share prefixes — trivial to store in any KV/DB and range-scan, but suffers edge cases at cell boundaries, so you must query the 8 neighboring cells too) versus a *quadtree* (recursively subdivides space, adapting depth to density so dense cities get finer cells — better for skewed distributions but harder to shard and rebalance) versus *S2 cells / H3* (hierarchical, near-uniform cells with good neighbor math — the modern production choice). Geohash on a standard DB is the pragmatic default; call out the boundary problem and neighbor-cell fan-out explicitly.
**Step 5 — Ranking and radius correctness.** Cells give candidates, not answers: fetch candidates from the covering cells, compute true haversine distance, filter to radius, and sort. Pick cell precision so an average cell holds a manageable candidate count (tune the geohash length to the radius).
**Step 6 — Handling moving objects.** If points move (drivers), a write-heavy variant: keep the live index in memory (e.g. Redis GEO or an in-memory grid), accept eventual staleness of a few seconds, and TTL stale locations rather than doing expensive index deletes.

**Key points:**
- The whole problem is turning a 2D radius query into an index lookup: geohash / quadtree / S2 are the three answers.
- Always query neighbor cells and re-rank by true haversine distance — cell membership is approximate.
- Static places vs moving drivers changes everything about the write path.
- Tune cell precision to expected radius so candidate sets stay small.

---

### 63. Design a maps routing / navigation service

**Frequency:** Medium

**Difficulty:** Hard
**Topics:** system-design, graph, shortest-path, precomputation, routing

**Answer:** Frame it as shortest-path on a road graph where naive Dijkstra is far too slow, so the scored decision is the precomputation strategy.

**Step 1 — Clarify what we're building.** Core op: `route(source, dest)` returning the fastest path plus ETA; extensions are turn-by-turn and live-traffic re-routing. Key unknown: static shortest-distance vs time-dependent with live traffic — the latter is dramatically harder. The framing conclusion: on a continental graph, per-request Dijkstra (hundreds of millions of nodes) can't hit interactive latency, so we precompute.
**Step 2 — Do the napkin math.** A country road network is ~10^7-10^8 nodes and edges. Plain Dijkstra is O(E log V) — hundreds of ms to seconds per query, unacceptable at scale. We need sub-100ms per route at thousands of QPS, which forces heavy preprocessing that amortizes across queries.
**Step 3 — Lay out the pieces.** A graph store (nodes = intersections, edges = road segments with weights), an offline preprocessing pipeline that builds the acceleration structure, an online query service, and a traffic ingestion pipeline that adjusts edge weights.
**Step 4 — The routing algorithm / precomputation.** This is the heart. Compare *bidirectional Dijkstra* (search from both ends, meet in the middle — a constant-factor win, no preprocessing, but still too slow alone) versus *A\* with a geographic heuristic* (straight-line distance guides the search toward the goal — simple and effective for point-to-point) versus *Contraction Hierarchies* (offline, shortcut edges over less-important nodes so queries touch only a tiny fraction of the graph — millisecond queries, but preprocessing takes hours and must be rebuilt when weights change). CH (or CRP, its customizable cousin) is the production answer; the trade-off is preprocessing cost vs query speed, and CRP is chosen precisely because it separates the expensive topology phase from a cheap weight-update phase.
**Step 5 — Live traffic and time-dependence.** Live speeds change edge weights continuously. Full CH rebuilds are too slow, so use *Customizable Route Planning*: an expensive one-time topology partition plus a fast "customization" pass that re-applies fresh weights in seconds, enabling traffic-aware routing without full recomputation.
**Step 6 — Partitioning and edge cases.** Partition the graph geographically for long routes (route within/between regions), and handle turn restrictions, one-ways, and multi-modal (walking/transit) as edge attributes or overlay graphs.

**Key points:**
- Per-request Dijkstra doesn't scale to continental graphs — precompute with Contraction Hierarchies / CRP.
- The core trade-off is preprocessing cost vs query latency.
- Live traffic needs a cheap weight-update path (CRP customization), not a full rebuild.
- A\* with a geographic heuristic is the simple baseline worth naming first.

---

### 64. Design a live-streaming platform (Twitch)

**Frequency:** Medium

**Difficulty:** Hard
**Topics:** system-design, video-streaming, cdn, transcoding, low-latency

**Answer:** Frame it as one broadcaster ingesting to millions of viewers, and let the ingest→transcode→CDN pipeline plus the latency/scale trade-off carry it.

**Step 1 — Clarify what we're building.** A broadcaster pushes a live stream; many viewers watch with a few seconds of delay, plus live chat. Key unknown to raise: how low must latency be? "Broadcast" HLS latency (10-30s) is a totally different system than "interactive" sub-second WebRTC. The framing conclusion: assume seconds-of-latency HLS/DASH so we can lean on CDNs for the massive fan-out.
**Step 2 — Do the napkin math.** A popular stream is 1-to-millions fan-out: one ingest connection, potentially 1M+ concurrent viewers at ~5 Mbps each = terabits/s egress. Origin servers can't serve that directly — the entire viewer path must be CDN-cached. Shape: modest ingest, enormous read fan-out.
**Step 3 — Lay out the pieces.** RTMP/SRT ingest servers, a transcoding fleet that produces multiple bitrate renditions, a packager that segments into HLS/DASH chunks, origin storage, and a CDN that fans segments out to viewers.
**Step 4 — Protocol and fan-out strategy.** This is the scored decision. Compare *HLS/DASH over CDN* (chunked into 2-6s segments served as ordinary HTTP files — infinitely CDN-cacheable, so millions of viewers cost the same as static content, at the price of 10-30s glass-to-glass latency) versus *Low-Latency HLS / LL-DASH* (partial segments push latency to ~2-5s while keeping HTTP cacheability) versus *WebRTC* (sub-second, but peer/SFU connections don't CDN-cache and are far costlier per viewer). For a Twitch-scale audience, HLS-over-CDN is right because cacheability is what makes million-viewer fan-out affordable; reserve WebRTC for interactive low-latency modes.
**Step 5 — Transcoding and adaptive bitrate.** Each ingested stream is transcoded into a ladder of renditions (1080p/720p/480p/…) so clients adaptively switch to match bandwidth. This is CPU/GPU-heavy and per-stream, so autoscale the transcode fleet with the number of live channels, not viewers.
**Step 6 — Chat and edge cases.** Live chat is a separate fan-out problem (pub/sub with per-channel rooms, sampling messages for huge channels). Handle broadcaster disconnects (grace period), DVR/rewind (retain recent segments), and thundering-herd on stream start via CDN request collapsing.

**Key points:**
- The viewer fan-out must be CDN-cacheable — that's why HLS/DASH chunks beat WebRTC at scale.
- Latency target picks the protocol: HLS (seconds) vs LL-HLS vs WebRTC (sub-second).
- Transcode into a bitrate ladder for adaptive streaming; scale that fleet by channel count.
- Chat is a distinct pub/sub fan-out problem, not part of the video path.

---

### 65. Design a video-conferencing system (Zoom)

**Frequency:** Medium

**Difficulty:** Hard
**Topics:** system-design, webrtc, sfu, real-time, media-server

**Answer:** Frame it as N-way real-time bidirectional media where the media-routing topology (mesh vs MCU vs SFU) is the scored decision.

**Step 1 — Clarify what we're building.** Every participant both sends and receives audio/video in near real-time, plus screen share. Key unknown: typical meeting size — 2-person calls, 10-person team meetings, and 1000-person webinars want different topologies. The framing conclusion: sub-500ms interactive latency rules out CDN/HLS entirely; we need media servers routing UDP/WebRTC streams.
**Step 2 — Do the napkin math.** In an N-person call, each person sends 1 stream and must receive N-1. Full mesh means each client sends N-1 uploads — a 10-person mesh is 90 streams total and crushes uplink. This quadratic blowup is exactly why a central media router is needed. Shape: latency-critical, bandwidth-bound at the client uplink.
**Step 3 — Lay out the pieces.** A signaling service (SDP/ICE negotiation, room membership), STUN/TURN servers for NAT traversal, and media servers (SFUs) that receive each participant's stream and forward it to others.
**Step 4 — Media topology: mesh vs MCU vs SFU.** This is the heart. Compare *mesh P2P* (clients send directly to each other — zero server media cost and great for 2-4 people, but each client's uplink scales with N, so it collapses past a handful) versus *MCU* (server decodes all streams, composites them into one mixed stream, re-encodes — clients only send/receive one stream so weak devices cope, but server CPU is enormous and it adds latency) versus *SFU* (server forwards each stream selectively without decoding — clients send once, receive N-1, cheap server CPU, and enables per-viewer quality selection). SFU is the modern default; the trade-off is client download bandwidth (SFU) vs server compute (MCU). 
**Step 5 — Adaptive quality: simulcast and SVC.** To avoid one weak client dragging everyone down, senders push multiple resolution layers (*simulcast*) or a scalable-coded stream (*SVC*), and the SFU forwards the layer each receiver can handle. Combine with active-speaker detection so only visible/loud participants get high-res.
**Step 6 — NAT traversal and reliability.** Most clients are behind NAT, so ICE tries STUN first and falls back to TURN relays. Use UDP with jitter buffers and packet-loss concealment (real-time can't wait for TCP retransmits); scale by sharding rooms across SFUs and cascading SFUs for very large calls.

**Key points:**
- SFU (forward, don't mix) is the standard topology; mesh only for 2-4, MCU when clients are too weak to receive many streams.
- The core trade-off is client bandwidth (SFU) vs server CPU (MCU).
- Simulcast/SVC + active-speaker selection keep quality adaptive under heterogeneous networks.
- Real-time means UDP + jitter buffers + TURN fallback, never CDN/HLS.

---

### 66. Design a VoIP / voice-calling system

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, voip, signaling, rtp, nat-traversal

**Answer:** Frame it as two phases — signaling (set up the call) and media (carry the audio) — and make the real-time transport choices the scored part.

**Step 1 — Clarify what we're building.** Operations: place a call, ring the callee, connect audio, hang up — plus presence (who's online) and optional PSTN interconnect. Key unknown: app-to-app only, or bridging to real phone numbers (which drags in SIP/PSTN gateways and billing)? The framing conclusion: separate the control plane (signaling) from the data plane (media), because they have completely different requirements.
**Step 2 — Do the napkin math.** Audio is cheap: ~20-64 Kbps per stream with codecs like Opus, so bandwidth is a non-issue versus video. The real metrics are call setup latency (ring within ~1-2s), concurrent active calls, and end-to-end mouth-to-ear latency (<150ms for natural conversation). Shape: latency- and reliability-sensitive, low bandwidth.
**Step 3 — Lay out the pieces.** A signaling service for call setup and presence, STUN/TURN for NAT traversal, media relays for when P2P fails, and (if PSTN) SIP trunks to a telecom gateway.
**Step 4 — Media transport and path selection.** This is the scored decision. Media rides *RTP over UDP* (not TCP — a late voice packet is useless, so you drop it rather than retransmit, using jitter buffers and packet-loss concealment to smooth gaps). For the path, compare *direct P2P* (lowest latency and no server media cost, but fails behind symmetric NATs) versus *TURN-relayed* (always works but adds a hop and server bandwidth) — ICE negotiates the best available, preferring P2P and falling back to relay. Choose Opus as the codec for its adaptive bitrate and resilience.
**Step 5 — Signaling and presence.** Signaling establishes the session (invite/ring/answer/bye, SDP for codec negotiation) over a reliable persistent connection (WebSocket or SIP). Presence and routing must find the callee's current device(s) via a registry, ring them in parallel, and handle the callee being offline (push notification to wake the app).
**Step 6 — Reliability and edge cases.** Handle network handoff (Wi-Fi↔cellular) by re-negotiating ICE mid-call, apply echo cancellation and adaptive jitter buffering, and for PSTN handle E.164 numbering, DTMF, and per-minute billing/CDRs.

**Key points:**
- Split control plane (signaling, reliable) from data plane (RTP/UDP media, latency-first).
- Voice tolerates loss but not delay — UDP + jitter buffer + loss concealment, never TCP retransmit.
- ICE/STUN/TURN: prefer P2P, relay only when NAT forces it.
- Presence + parallel ring + push-to-wake is the call-setup path; PSTN adds SIP gateways and billing.

---

### 67. Design an online multiplayer game backend

**Frequency:** Medium

**Difficulty:** Hard
**Topics:** system-design, real-time, state-sync, authoritative-server, udp

**Answer:** Frame it around the authoritative game loop and state synchronization, since consistency-under-latency is what's being scored.

**Step 1 — Clarify what we're building.** Players in a shared session send inputs and see each other's actions in near real-time; the server must resolve a consistent world state. Key unknown: game genre — a fast twitch shooter (tens of ms matter, anti-cheat critical) vs a turn-based or async game are totally different. The framing conclusion: assume a real-time session game, so we need an authoritative server and a tight tick loop.
**Step 2 — Do the napkin math.** A session holds maybe 10-100 players; the server runs a fixed tick (e.g. 20-60 Hz) broadcasting state deltas to each client every 16-50ms. Per-player bandwidth is small but the update frequency is relentless and latency-bound. Shape: many small, frequent, latency-critical messages; horizontally scaled by sessions.
**Step 3 — Lay out the pieces.** A matchmaking/session service that assigns players to a game server instance, dedicated authoritative game-server processes running the simulation, a low-latency transport, and a persistence layer for progression/inventory (not per-tick state).
**Step 4 — Authoritative state and sync model.** This is the heart. The server must be *authoritative* to prevent cheating: clients send inputs, the server simulates and is the source of truth. To hide latency, compare *client-side prediction + server reconciliation* (client predicts its own movement immediately, server corrects if they diverge — smooth local feel) with *entity interpolation* (render other players slightly in the past using buffered states, trading a bit of staleness for smoothness) and *lag compensation* (server rewinds to the shooter's view when validating hits). These three together are the standard toolkit; the trade-off is responsiveness vs correctness, resolved by predicting locally and reconciling against the authority.
**Step 5 — Transport and tick loop.** Use *UDP* with a custom reliability layer (reliable for critical events, unreliable for positional updates that are superseded next tick) — TCP head-of-line blocking is fatal for real-time. Send *state deltas*, not full snapshots, and use area-of-interest filtering so each client only receives entities near it.
**Step 6 — Scaling and anti-cheat.** Scale by spinning up isolated game-server instances per session (stateless matchmaking in front); keep authoritative validation server-side, rate-limit inputs, and validate physics to catch speed/aim hacks. Persist durable progression asynchronously, never in the hot tick path.

**Key points:**
- Authoritative server is non-negotiable for cheat resistance; clients send inputs, server owns truth.
- Client prediction + interpolation + lag compensation hide latency without giving up authority.
- UDP with selective reliability and delta/area-of-interest updates beats TCP for real-time.
- Scale per-session on dedicated instances; persist progression off the tick loop.

---

### 68. Design a matchmaking system

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, matchmaking, queue, ranking, latency

**Answer:** Frame it as balancing three competing goals — match quality, wait time, and connection latency — with the matching algorithm as the scored core.

**Step 1 — Clarify what we're building.** Players enter a queue and get grouped into balanced matches. Key unknown to raise: what defines a "good" match — skill balance, low ping, or full lobbies? These conflict, and which you prioritize drives the algorithm. The framing conclusion: matchmaking is a continuous optimization trading match quality against wait time.
**Step 2 — Do the napkin math.** Queue depth and arrival rate set everything: at 10K players/min queuing for 10-player matches, that's ~1K matches/min, and off-peak thin queues are the hard case (few candidates → widen criteria or wait). Shape: bursty, pool-size-dependent, with a strict wait-time SLA.
**Step 3 — Lay out the pieces.** A queue/pool keyed by relevant buckets (region, mode, skill band), a rating store (per-player skill like Elo/Glicko/TrueSkill), and a matcher process that periodically scans the pool and forms matches, handing sessions to the game-server allocator.
**Step 4 — The matching algorithm and quality/wait trade-off.** This is the heart. Compare *strict bucketing* (only match players in the same skill/region bucket — fast and simple, but thin buckets stall and edges are arbitrary) versus *expanding search windows* (start with a tight skill/ping range and widen it the longer a player waits — the standard technique that directly trades match quality for wait time as time elapses) versus *global optimization* (periodically solve a batch assignment across the whole pool to maximize total match quality — best quality but higher latency and complexity). Expanding windows is the pragmatic default; state the widening schedule (e.g. ±50 skill/10s) explicitly since that IS the quality/wait dial.
**Step 5 — Rating and fairness.** Use a rating system (TrueSkill/Glicko with uncertainty) so new players match provisionally and converge fast; balance teams by minimizing skill variance across sides, and consider party/premade constraints (a 4-stack must face comparable coordination).
**Step 6 — Edge cases.** Handle thin off-peak queues (widen aggressively or backfill with bots), dodge/abandon penalties, latency caps so a good-skill match isn't unplayable across regions, and re-queue on match decline without losing wait credit.

**Key points:**
- Matchmaking optimizes a three-way tension: skill balance vs wait time vs ping.
- Expanding search windows are the standard lever — quality tightens early, relaxes as wait grows.
- A proper rating system (TrueSkill/Glicko) with uncertainty drives balanced teams.
- Thin queues (off-peak, high skill) are the real failure mode — widen, backfill, or bot.

---

### 69. Design a flash-sale / ticketing system (high contention)

**Frequency:** High

**Difficulty:** Hard
**Topics:** system-design, concurrency, inventory, idempotency, rate-limiting

**Answer:** Frame it around the one brutal constraint — thousands of buyers racing for scarce inventory in seconds without overselling — and make correct atomic decrement the scored decision.

**Step 1 — Clarify what we're building.** N units go on sale at time T; far more buyers than units arrive in a burst, and we must never oversell while staying responsive. Key unknown: is it fungible stock (100K identical items) or specific seats (seat 14A, one buyer)? The framing conclusion: this is a contention and correctness problem, not a throughput problem — the hot row is the bottleneck.
**Step 2 — Do the napkin math.** 1M users hitting "buy" for 10K items in the first 5 seconds = ~200K QPS against a single logical inventory counter. 99% of requests must be rejected fast. Shape: extreme, short, bursty write contention on a tiny hot key — the classic thundering herd.
**Step 3 — Lay out the pieces.** An edge/waiting-room layer to shed and pace load, a fast atomic inventory store (Redis) as the front-line gatekeeper, a durable order database as the system of record, and an async pipeline for payment and fulfillment.
**Step 4 — Atomic decrement without overselling.** This is the heart. Compare *DB row lock / SELECT FOR UPDATE* (correct but serializes on one row — the lock queue melts under 200K QPS) versus *optimistic concurrency (compare-and-set on a version/stock column)* (no lock held, retry on conflict — fine at moderate contention, but retry storms at this scale) versus *atomic decrement in Redis (DECR / Lua script)* (single-threaded, in-memory, atomically checks-and-decrements in microseconds, rejecting sold-out instantly — the front-line answer). Use Redis as the authoritative gate for the count and reconcile to the durable DB asynchronously; the trade-off is that Redis must be treated carefully for durability (AOF + reconciliation) since it's now holding truth during the sale.
**Step 5 — Idempotency and the async order path.** Each buy carries an idempotency key so retries (users mash the button) don't double-charge or double-decrement. Once Redis grants a unit, enqueue the order; process payment and seat assignment asynchronously, and release the held unit back if payment fails within a TTL (reservation hold).
**Step 6 — Load shedding and fairness.** Put a *virtual waiting room* / queue in front to admit users at a controlled rate, rate-limit per user/IP to blunt bots, and use a token/lottery approach for fairness rather than pure first-come chaos. Cache the "sold out" response at the edge so 99% of traffic never reaches the core.

**Key points:**
- The hot inventory key is the whole problem — use an atomic in-memory DECR (Redis/Lua), not DB row locks.
- Redis gates the count; the durable DB records orders asynchronously and reconciles.
- Idempotency keys + reservation TTLs prevent double-sells and stranded inventory on payment failure.
- Shed load early: waiting room, edge-cached sold-out, per-user rate limits so the core sees a fraction of traffic.

---

### 70. Design an e-commerce product catalog + search

**Frequency:** High

**Difficulty:** Medium
**Topics:** system-design, search, inverted-index, indexing, cqrs

**Answer:** Frame it as two synchronized systems — a source-of-truth catalog store and a denormalized search index — with the sync pipeline and relevance as the scored parts.

**Step 1 — Clarify what we're building.** Browse/filter a product catalog and full-text search with facets (category, price, brand) and ranking. Key unknown to raise: catalog size and write rate, and how fresh search must be after a price/stock change. The framing conclusion: the transactional store and the search engine have different data models, so we split reads from writes and sync between them.
**Step 2 — Do the napkin math.** 10M products, mostly reads: search/browse dominates at, say, 50K QPS, while catalog updates (price, inventory) are far lower but must propagate. Shape: heavily read-dominated, so we optimize the read path hard and accept eventual consistency on updates. 
**Step 3 — Lay out the pieces.** A catalog service backed by a relational/document store (source of truth for product data), a search cluster (Elasticsearch/OpenSearch) holding a denormalized, inverted-indexed copy, a change pipeline syncing the two, and a caching layer for hot queries and product pages.
**Step 4 — Search index and the sync pipeline (CQRS).** This is the heart. The catalog DB is great for transactions but terrible for full-text + faceted queries, so maintain a separate *inverted index* in a search engine (this is *CQRS*: write model ≠ read model). Compare *dual writes* (app writes DB and index together — simple but breaks atomicity, indexes drift on partial failure) versus *CDC / event-driven sync* (stream DB changes via change-data-capture or an event log into the indexer — decoupled, replayable, and the reliable production pattern) versus *periodic batch reindex* (simple, but stale and heavy). CDC/event-driven is the answer; the trade-off is added pipeline complexity for correctness and freshness, with batch reindex kept as a rebuild/backfill safety net.
**Step 5 — Relevance, facets, and freshness.** Ranking blends text relevance (BM25) with business signals (popularity, margin, in-stock boost). Facets/aggregations come from the search engine natively. For frequently-changing fields like price/inventory, either index them and accept seconds of lag via CDC, or fetch them live at render time so search stays fresh without reindexing on every stock tick.
**Step 6 — Performance and edge cases.** Cache hot search results and product pages, add typo tolerance/autocomplete (edge n-grams), paginate with search-after (not deep offset), and handle out-of-stock filtering and personalization as query-time boosts.

**Key points:**
- Split source-of-truth catalog (transactional) from a denormalized inverted search index — this is CQRS.
- Sync via CDC/event stream, not dual writes; keep batch reindex as a backfill safety net.
- Read-dominated: cache aggressively, and rank with BM25 + business boosts.
- Fast-changing price/stock either lag via CDC or are fetched live at render to avoid constant reindexing.

---

### 71. Design a shopping cart + checkout system

**Frequency:** High

**Difficulty:** Medium
**Topics:** system-design, e-commerce, idempotency, distributed-transactions, caching

**Answer:** Walk it as two coupled but distinct problems — a mutable, low-stakes cart, then a strongly-consistent, money-touching checkout — and spend your time on the checkout consistency story.

**Step 1 — Clarify what we're building.** Core operations: add/update/remove item, view cart, and "place order." Raise the unknowns out loud: is the cart for logged-in users only or also guests? Must carts persist across devices and survive weeks? Are prices/availability locked at add-time or re-validated at checkout? The framing conclusion that drives everything: the cart is best-effort and forgiving, but checkout is a financial transaction that must be exactly-once.

**Step 2 — Do the napkin math.** Assume 50M DAU, ~5 cart mutations each = 250M writes/day (~3K/s avg, 10x at peak). Checkouts are maybe 2% of that. So the cart is read/write-heavy and bursty; checkout is low-volume but high-value. This shape says: cart can live in a fast KV store, checkout deserves a real transactional store.

**Step 3 — Lay out the pieces.** Stateless cart service + checkout service; a KV store (Redis/DynamoDB) keyed by user/session for carts with a TTL; a relational orders DB; and synchronous calls to pricing, inventory, and payment services. Cart item = {sku, qty, price_snapshot, added_at}.

**Step 4 — Make checkout exactly-once and consistent.** This is the scored decision. The risk is double-charges and overselling under retries/double-clicks. Compare: *client-generated idempotency key* — the client sends a UUID per checkout attempt; the server dedups so a retry returns the original result (industry standard, Stripe-style). *Distributed 2PC across inventory+payment* — strong but slow, locks resources, poor availability. *Saga with compensations* — reserve inventory, charge payment, confirm order; on failure run compensating actions (release reservation, refund). Best answer: idempotency key on the write + a saga for the multi-service flow, because 2PC doesn't survive real-world partial failures.

**Step 5 — Re-validate at the boundary.** Never trust the cart's price/stock snapshot. At checkout, re-fetch current price (honor a short price-lock window if promised) and place an inventory *reservation* with a TTL so the item is held while payment processes, then commit or auto-expire.

**Step 6 — Guard rails.** Cap cart size and per-SKU qty to blunt abuse; merge guest cart into user cart on login; make "place order" idempotent even across sessions; emit an order-placed event for async fulfillment/email.

**Key points:**
- Cart = forgiving KV with TTL; checkout = transactional and exactly-once.
- Idempotency key is the one-line answer to double-charge; saga handles multi-service atomicity better than 2PC.
- Re-validate price and stock at checkout; use TTL inventory reservations, not add-to-cart holds.
- Separate the two services so cart load never threatens order integrity.

---

### 72. Design an inventory-management system

**Frequency:** Medium

**Difficulty:** Hard
**Topics:** system-design, concurrency, consistency, sharding, event-sourcing

**Answer:** Frame it around one hard question — how to decrement stock correctly under massive concurrency without overselling — and let everything else support that.

**Step 1 — Clarify what we're building.** Operations: check availability, reserve (hold), commit (sale), release, and restock. The unknowns to surface: single-warehouse or multi-location? Is overselling ever tolerable (backorder) or strictly forbidden? How fresh must the displayed count be? The conclusion that drives design: correctness of the *committed* count is non-negotiable; the *displayed* count can be slightly stale.

**Step 2 — Do the napkin math.** A flash sale on a hot SKU can drive 100K reservation attempts/second against a single row that starts at 1,000 units. This is not throughput-bound overall — it's a *hot-key contention* problem concentrated on a few SKUs. That shape dictates the whole design.

**Step 3 — Lay out the pieces.** Inventory service over a strongly-consistent store (SQL or a distributed DB with row-level atomics); stock is sharded by SKU; a reservation table with TTLs; an event log of all stock movements for audit and reconciliation.

**Step 4 — Prevent overselling under contention.** The heart. Compare: *pessimistic row lock* (SELECT ... FOR UPDATE) — simple, correct, but serializes all buyers of a hot SKU and can thrash. *Optimistic concurrency* (compare-and-swap on a version, retry on conflict) — great when contention is moderate, but retry storms on a truly hot key. *Atomic conditional decrement* (UPDATE SET qty=qty-1 WHERE qty>0, or Redis DECR with a Lua guard) — highest throughput per key, the standard for flash sales. Advanced: *split the counter into N sub-buckets* per SKU so writers spread across shards, summing for reads. Best answer: atomic conditional decrement + optional bucket-splitting for the hottest SKUs.

**Step 5 — Reservations with TTL.** Availability = on_hand − active_reservations. Reserve creates a TTL'd hold; commit converts it to a sale; expiry auto-releases so abandoned checkouts don't leak stock. A sweeper reconciles expired holds.

**Step 6 — Multi-location and reconciliation.** With warehouses, keep per-location counts and route to nearest with stock; run periodic reconciliation against the event log to catch drift; make restock and adjustment operations idempotent and audited.

**Key points:**
- The real problem is hot-key contention, not aggregate QPS.
- Atomic conditional decrement beats locks for oversell prevention at scale; bucket-split the hottest keys.
- Model availability as on_hand minus TTL reservations; auto-expire holds.
- Keep an append-only movement log for audit and reconciliation.

---

### 73. Design an order-management / fulfillment system

**Frequency:** Medium

**Difficulty:** Hard
**Topics:** system-design, state-machine, saga, event-driven, idempotency

**Answer:** Present the order as a long-lived state machine driven by events across many services, and center the answer on reliable multi-service orchestration.

**Step 1 — Clarify what we're building.** An order flows created → paid → allocated → picked → packed → shipped → delivered (with cancel/refund/return branches). The unknowns: how many downstream systems (payment, inventory, warehouse, carrier)? Is orchestration synchronous or event-driven? What are the SLAs and can steps be async for hours? Conclusion: this is a durable, auditable workflow spanning services that can each fail independently.

**Step 2 — Do the napkin math.** Say 10M orders/day (~120/s avg, spiky around promos), each generating ~10 state transitions and events → ~100M events/day. Modest write throughput but very high fan-out and a strong durability/audit requirement. The shape: not high-QPS, but high-reliability and long-running.

**Step 3 — Lay out the pieces.** Order service owning the order aggregate and its state; a durable event bus (Kafka); an orchestrator (saga coordinator or a workflow engine like Temporal); downstream adapters for payment/inventory/warehouse/shipping; an outbox table for reliable event publishing.

**Step 4 — Orchestrate the cross-service workflow.** The scored decision. Compare: *choreography* — each service reacts to events and emits its own; loosely coupled but the end-to-end flow is implicit and hard to debug/monitor. *Orchestration* — a central coordinator explicitly drives each step and knows the full state; easier to observe, version, and add compensations, at the cost of a central component. For a business-critical multi-step flow, prefer orchestration via a workflow engine, using the *saga* pattern: each forward step has a compensating action (refund payment, release inventory) so a late failure unwinds cleanly instead of leaving a half-shipped order.

**Step 5 — Exactly-once effects despite retries.** The bus is at-least-once, so every handler must be idempotent (dedup by order_id + step). Use the *transactional outbox* so a DB commit and its event publish can't diverge, and record each transition in an append-only log for full auditability.

**Step 6 — Edge cases.** Partial cancellation and returns reopen the state machine; handle carrier webhooks that arrive out of order; surface stuck orders via timeouts/alerts; make refunds idempotent.

**Key points:**
- Model the order as an explicit, auditable state machine.
- Orchestration + saga compensations beat pure choreography for debuggability and correctness.
- At-least-once bus ⇒ idempotent handlers + transactional outbox.
- Keep an append-only transition log; add timeouts to detect stuck workflows.

---

### 74. Design a coupon / promotion service

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, rules-engine, concurrency, caching, idempotency

**Answer:** Split it into two halves — a flexible rules-evaluation read path and a strictly-consistent redemption write path — and spend your time preventing over-redemption.

**Step 1 — Clarify what we're building.** Operations: create a promotion, evaluate which promos apply to a cart, and redeem on checkout. Unknowns to raise: what promo types (percentage off, fixed, BOGO, free shipping, stacking rules)? Are there global caps, per-user limits, single-use codes? Conclusion: evaluation is a read-heavy rules problem; redemption with limits is a consistency problem — treat them separately.

**Step 2 — Do the napkin math.** Every cart view evaluates promos: with 50M DAU and multiple views, that's tens of millions of evaluations/hour — read-heavy and cache-friendly. Redemptions match checkout volume (~2% of that) but are correctness-critical, especially for limited codes that draw a stampede at drop time.

**Step 3 — Lay out the pieces.** Promotion service with a rules engine; a config store for promo definitions (conditions + effects as data, not code); Redis cache for active promos and per-user redemption counts; a durable redemptions table as source of truth.

**Step 4 — Enforce redemption limits without over-issuing.** The heart. A "first 10,000 uses" or "once per user" coupon under a flash drop is a hot-counter problem. Compare: *check-then-write in app code* — racy, over-redeems under concurrency. *DB unique constraint* (user_id, coupon_id) for per-user single-use — clean and correct for that case. *Atomic counter with a cap* (Redis DECR guarded by a Lua script, or UPDATE ... WHERE used<limit) for global caps — high throughput and race-free. Best answer: unique constraints for per-user rules plus an atomic capped counter for global limits, with the durable table as the reconciling source of truth.

**Step 5 — Fast, flexible evaluation.** Represent promos as declarative rules (targeting + conditions + effect) so marketing can add campaigns without deploys; cache active promos hot; define deterministic *stacking/priority* rules so overlapping promos combine predictably and can never yield a negative total.

**Step 6 — Guard rails.** Idempotent redemption keyed by order_id so a checkout retry doesn't double-consume; validate expiry/eligibility server-side at redemption, never trusting the client; log every redemption for fraud analysis and rate-limit code-guessing.

**Key points:**
- Separate cache-friendly evaluation from consistency-critical redemption.
- Unique constraints for per-user limits; atomic capped counters for global caps.
- Rules-as-data engine keeps promo logic out of deploys; define explicit stacking order.
- Redemption must be idempotent per order and validated server-side.

---

### 75. Design a review & rating system

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, aggregation, caching, ranking, fanout

**Answer:** Treat it as a write-then-aggregate pipeline: cheap, correct writes, and pre-computed aggregates for the read-heavy product page.

**Step 1 — Clarify what we're building.** Operations: submit a review (stars + text), list reviews for an item, show the average rating, and vote reviews helpful. Unknowns: verified-purchase only? One review per user per item? Do we need real-time average or is eventual fine? Conclusion: reads (product pages) hugely outnumber writes, and the average must be shown fast — so pre-aggregate.

**Step 2 — Do the napkin math.** A large catalog: 100M items, maybe 500M reviews total, but reads are the story — a popular item's page loads millions of times/day while gaining a handful of reviews. Extremely read-heavy with a long-tail write pattern; a few hot items dominate reads.

**Step 3 — Lay out the pieces.** Review service; a reviews store (SQL or wide-column) keyed by item_id; a ratings-aggregate store holding {item_id → count, sum, histogram}; a cache/CDN for hot product pages; a search/index layer if reviews are searchable.

**Step 4 — Compute the aggregate rating efficiently.** The scored decision. Compare: *recompute on read* (AVG over all reviews) — always correct but scans grow unbounded and hammer the DB for hot items. *Incremental counters* — keep running count and sum per item, update atomically on each new review so average = sum/count in O(1); vastly cheaper reads. *Batch recompute* — periodic job rebuilds aggregates; simple and self-healing but stale. Best answer: incremental counters for the live average, plus a periodic batch reconcile to correct drift from deletions/edits/moderation. Store a star histogram too, since the distribution matters more than the mean.

**Step 5 — Make the read path fast and fair.** Serve product-page aggregates from cache; paginate reviews with keyset pagination; rank displayed reviews by a *helpfulness* score, not just recency, and dampen it (e.g. Wilson lower-bound) so a review with 5/5 helpful votes doesn't outrank one with 400/450.

**Step 6 — Guard rails.** Enforce one-review-per-user-per-item with a unique constraint; verified-purchase badge; route new reviews through moderation/spam detection before they count; make helpful-votes idempotent per user.

**Key points:**
- Read-heavy: pre-aggregate with incremental count+sum, reconcile in batch.
- Store the star histogram, not just the mean.
- Rank reviews by dampened helpfulness (Wilson), not raw votes or recency.
- Unique constraint for one-per-user; moderate before counting.

---

### 76. Design a news-aggregator system

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, crawling, ranking, deduplication, caching

**Answer:** Frame it as an ingestion pipeline feeding a ranked, personalizable feed, and focus on dedup/clustering and freshness-aware ranking.

**Step 1 — Clarify what we're building.** Pull articles from many sources, cluster duplicates of the same story, rank them, and serve a home feed (global or personalized). Unknowns: how many sources and how fresh (minutes vs hours)? Personalized or one global feed? Full-text or headlines+links? Conclusion: it's a read-heavy content system where *freshness* and *deduplication of the same story across outlets* are the differentiators.

**Step 2 — Do the napkin math.** Say 100K sources polled every few minutes → millions of fetched articles/day, but most are dupes or irrelevant; the served feed is tiny per user. Ingestion is write/compute-heavy and bursty (news breaks in waves); serving is read-heavy and extremely cacheable for a global feed.

**Step 3 — Lay out the pieces.** Crawlers/RSS pullers → a raw-article queue → a processing pipeline (parse, extract, embed, cluster) → an articles store + search index → a ranking service → a feed API with CDN caching. Store canonical story clusters, not just raw articles.

**Step 4 — Deduplicate and cluster the same story.** The heart. Ten outlets cover one event; users want one entry. Compare: *exact hashing (URL/content hash)* — catches reposts, misses rewrites. *MinHash/SimHash near-duplicate detection* — catches lightly-edited copies cheaply. *Embedding + clustering* (semantic similarity, then cluster within a time window) — groups genuinely different articles about the same event, the strongest approach, at higher compute cost. Best answer: cheap SimHash to kill obvious dupes, then embedding-based clustering within a rolling time window to form story clusters; pick a representative per cluster.

**Step 5 — Rank with freshness decay.** Score = quality/popularity signal × time-decay (e.g. Hacker News-style score/(age+2)^gravity) so breaking news surfaces and stale stories sink. For personalization, blend a topic/source affinity score; keep a cacheable global ranking as the base and layer light personalization on top.

**Step 6 — Guard rails.** Respect robots.txt and per-source rate limits; dedup fetches with conditional GETs/ETags; filter spam/low-quality sources; cap any single source's feed share for diversity.

**Key points:**
- Ingestion is bursty write/compute; serving is cacheable read.
- Cluster the same story across outlets: SimHash for cheap dupes, embeddings for semantic grouping.
- Rank with explicit freshness decay; personalize as a thin layer over a cached global feed.
- Be a polite crawler: robots.txt, ETags, per-source rate limits.

---

### 77. Design a content-moderation system

**Frequency:** Medium

**Difficulty:** Hard
**Topics:** system-design, ml-pipeline, async-processing, human-in-the-loop, scalability

**Answer:** Present a layered pipeline — fast automated filters, then ML scoring, then human review — and center the answer on the sync-vs-async publish decision and the precision/recall trade-off.

**Step 1 — Clarify what we're building.** Screen user content (text, images, video) for policy violations before or after it goes live, and give humans a review queue. Unknowns: which modalities? Must moderation be pre-publish (blocking) or post-publish (reactive)? What's the tolerance for false positives (blocking good content) vs false negatives (letting bad content through)? Conclusion: latency budget and the FP/FN balance shape the entire design.

**Step 2 — Do the napkin math.** A large platform: 1B posts/day (~12K/s avg, far higher at peak). Full ML scoring on every item — especially video — is expensive, so most content must pass a cheap first stage and only a fraction reach costly models or humans. The shape: extreme volume, so cost per item and human-queue throughput are the constraints.

**Step 3 — Lay out the pieces.** Ingestion → a fast rule/hash layer (banned-word lists, known-bad media via perceptual hashing like PhotoDNA) → ML classifiers per modality → a decision engine (allow / block / send-to-review) → a human-review console with a prioritized queue → a feedback loop retraining models on human labels.

**Step 4 — Choose the publish path and moderation timing.** The scored decision. Compare: *synchronous pre-publish* — safest, but adds latency to every post and can't run heavy models inline at 12K/s; reserve for high-risk surfaces (e.g. live-stream thumbnails, minors). *Asynchronous post-publish* — content goes live instantly and is scored in the background, taking it down within seconds if flagged; best throughput and UX for the common case. *Hybrid tiered* — cheap synchronous checks (hash/rules) block the obvious worst inline, while expensive ML runs async. Best answer: hybrid — synchronous cheap filters, async ML, with pre-publish blocking only for the highest-risk categories.

**Step 5 — Tune precision/recall and route humans wisely.** Use per-category thresholds: auto-block only above a high-confidence bar, auto-allow below a low bar, and send the uncertain *gray zone* to humans — this is where human capacity is spent well. Prioritize the queue by potential harm × reach (a viral post outranks an obscure one). Feed human decisions back as training labels.

**Step 6 — Guard rails.** Give users appeals and log every decision for auditability/regulatory needs; protect reviewers from graphic content (blurring, rotation, wellness limits); watch for adversarial evasion (leetspeak, image perturbation) and update filters; measure and correct model bias.

**Key points:**
- Layer cheap rules/hashes → ML → humans; only a fraction reaches each next stage.
- Hybrid timing: synchronous cheap blocking, async ML, pre-publish only for high-risk.
- Thresholds route the confident to automation and the gray zone to humans; prioritize queue by harm × reach.
- Close the loop: human labels retrain models; provide appeals and audit logs.

---

### 78. Design a bookmarking / read-later service (Pocket)

**Frequency:** Low

**Difficulty:** Medium
**Topics:** system-design, content-extraction, caching, search, sync

**Answer:** Frame it as save-then-extract: a fast save path plus an async pipeline that fetches and cleans the article for offline, searchable reading.

**Step 1 — Clarify what we're building.** Save a URL, extract a clean readable version, sync across devices, read offline, tag/search, and archive. Unknowns: do we store the full article content (copyright/storage) or just metadata? Offline support required? How important is full-text search? Conclusion: the save must feel instant, but the value-add — clean extraction and offline copy — is an async, storage-heavy job.

**Step 2 — Do the napkin math.** Say 10M users saving ~5 links/day = 50M saves/day (~600/s), each triggering a fetch + parse and storing ~100KB–1MB of cleaned content → tens of TB/month growing. Moderate write rate but heavy on storage and background fetch bandwidth; reads (a user's own list) are personal and cache-friendly.

**Step 3 — Lay out the pieces.** API + save service; a per-user items store (item = {url, title, tags, state, saved_at}); an async extraction pipeline (fetch → readability parse → strip ads → store text + thumbnail) in object storage; a search index (Elasticsearch) over extracted text; device-sync layer.

**Step 4 — Make save instant, extraction reliable.** The scored decision. Compare: *synchronous extraction on save* — user waits seconds while we fetch a possibly-slow page; bad UX and fragile. *Async via queue* — save writes the item immediately as "pending" and enqueues extraction; a worker fetches, parses, and flips it to "ready." Much better UX and lets us retry failures with backoff. Handle the failure modes explicitly: paywalls, dead links, JS-heavy pages (may need a headless renderer), huge media. Best answer: async pipeline with a state field and bounded retries, degrading gracefully to title+URL when extraction fails.

**Step 5 — Sync and offline.** Give each item a version/updated_at and expose a delta-sync endpoint (return changes since a client cursor) so devices reconcile cheaply; resolve conflicts last-write-wins on metadata like tags/read-state. Bundle extracted text for offline download.

**Step 6 — Guard rails.** Dedup re-saves of the same normalized URL per user; respect robots and store only what's permitted; full-text search over extracted content with per-user access scoping.

**Key points:**
- Save instantly as "pending"; extract asynchronously with retries and graceful degradation.
- Extraction (readability parse, ad-strip, offline copy) is the real value and the storage cost driver.
- Delta-sync by updated_at cursor for cheap multi-device reconciliation.
- Handle paywalls/JS pages/dead links explicitly; dedup by normalized URL.

---

### 79. Design a pastebin / code-sharing service

**Frequency:** Medium

**Difficulty:** Easy
**Topics:** system-design, key-generation, object-storage, caching, ttl

**Answer:** It's a write-once/read-many blob store behind a short URL — nail unique key generation and the metadata/blob split, then talk caching and expiry.

**Step 1 — Clarify what we're building.** Create a paste (text/code, optional syntax, optional expiry, optional visibility), get back a short URL, and view it. Unknowns: max paste size? Public/unlisted/private + password? TTL and one-time-view? Conclusion: pastes are immutable after creation and reads dominate writes massively — a classic read-heavy, cacheable, immutable-content system.

**Step 2 — Do the napkin math.** Say 10M pastes/day (~120/s writes) but each popular paste is read many times → maybe 100:1 read:write, so ~12K reads/s. Average paste is small (a few KB) but cap the max (say 10MB). Storage grows ~tens of GB/day before expiry reclaims it. Read-heavy, cache-friendly, immutable.

**Step 3 — Lay out the pieces.** API service; a metadata DB keyed by paste_id ({id, owner, syntax, created_at, expires_at, visibility, blob_ref}); a blob store (object storage) for the content itself; a CDN/cache for hot pastes; a background job to purge expired pastes.

**Step 4 — Generate unique short keys.** The scored decision even for an "easy" question. Compare: *auto-increment ID base62-encoded* — shortest keys, but sequential IDs are enumerable (guess neighbors) and leak volume. *Random N-char key with collision check* — unguessable, but needs a DB check (and retry) on collision; at low fill ratio collisions are rare. *Hash of content* — dedups identical pastes for free but is enumerable and reveals equality. Best answer: random base62 keys of length sized to the namespace (7 chars ≈ 3.5T combos) with a uniqueness check; for public sequential is fine, for unlisted/private randomness is essential.

**Step 5 — Serve reads fast.** Content is immutable, so cache aggressively — CDN + edge cache keyed by paste_id, effectively infinite TTL until expiry. Split small text inline in the DB vs large blobs in object storage. Do syntax highlighting client-side (or cache the rendered HTML) to keep the origin cheap.

**Step 6 — Guard rails.** Enforce TTL and one-time-view (delete-on-read atomically); rate-limit creation and scan for abuse (malware, secrets, spam); size limits; password-protect private pastes and don't cache those at shared layers.

**Key points:**
- Immutable, read-heavy: cache hard behind a CDN with effectively-infinite TTL.
- Random base62 keys for unguessability; check collisions; avoid enumerable sequential IDs for private content.
- Split metadata (DB) from content (object storage); size caps.
- Support TTL and one-time-view; rate-limit and scan creations for abuse.

---

### 80. Design a Q&A platform (Stack Overflow / Quora)

**Frequency:** Medium

**Difficulty:** Hard
**Topics:** system-design, search, ranking, caching, denormalization

**Answer:** Frame it around the read path — search and a well-ranked answer page — because a Q&A site is overwhelmingly read-heavy, then cover voting and reputation consistency.

**Step 1 — Clarify what we're building.** Post questions, post answers, vote up/down, accept an answer, tag, and — most importantly — search/find existing answers. Unknowns: search-driven or feed-driven traffic? How real-time must vote counts and rankings be? Reputation system? Conclusion: the dominant flow is a search-engine visitor landing on one question page, so search quality and a fast, well-ranked answer page are what's scored.

**Step 2 — Do the napkin math.** Classic 100:1+ read:write — millions of daily writes (questions/answers/votes) but billions of reads, most arriving from web search to a handful of popular questions. Extremely read-heavy with a long tail plus hot pages; content is fairly static once posted. This screams heavy caching and denormalization.

**Step 3 — Lay out the pieces.** API layer; content DB (questions, answers, comments, votes) — relational fits the relationships; a search index (Elasticsearch) as the primary discovery path; Redis cache + CDN for hot question pages; a tag service; an async pipeline updating scores/reputation and search docs.

**Step 4 — Rank answers and power search.** The heart, two linked decisions. *Answer ranking on a page*: accepted answer pinned first, then by a dampened score — not raw votes but a *Wilson lower-bound* (or Reddit-style) so a 30/32 answer beats a 5/5 one, avoiding the "few lucky early votes win forever" trap. *Search relevance*: combine full-text match (BM25) with signals like vote score, freshness, and tag match; consider semantic/vector search for question similarity to catch duplicates and "related questions." Best answer: BM25 + quality/recency signals for retrieval, Wilson-scored answer ordering for display, and duplicate detection via embedding similarity at post time.

**Step 5 — Serve the read path fast; make votes eventually-consistent.** Cache rendered question pages hard (CDN + Redis), invalidating on edit/new-answer; denormalize vote counts onto the answer row so a page load is one read, not an aggregate. Votes update the counter asynchronously and are eventually consistent — nobody needs the count exact to the millisecond, but enforce one-vote-per-user with a unique constraint.

**Step 6 — Guard rails.** Reputation gating (min rep to downvote/edit) to curb abuse; rate-limit posting and route through spam/quality checks; keep an edit history; make accept/vote idempotent per user.

**Key points:**
- Read-dominated and search-driven: invest in search relevance and heavy page caching.
- Rank answers by dampened score (Wilson), accepted answer pinned — not raw votes.
- Denormalize vote counts; votes are eventually consistent with a one-per-user unique constraint.
- Detect duplicate questions via semantic similarity; gate actions by reputation.

---

### 81. Design a forum / Reddit-style aggregator

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, feed-ranking, caching, voting, sharding

**Answer:** Walk it as a read-heavy content site: model posts/comments/votes, then spend your time on how ranked listings are computed and cached.

**Step 1 — Clarify what we're building.** Core ops are: submit a post to a subreddit, comment (nested), vote up/down, and read ranked listings (hot / new / top). The key unknowns to raise: how many communities, how deep comment threads go, and whether ranking must be real-time. The framing conclusion: this is overwhelmingly read-heavy with expensive ranked reads, so the whole design is about precomputing and caching listings.
**Step 2 — Do the napkin math.** Say 50M DAU, each reads ~30 listings/day → ~1.5B listing reads/day ≈ 20K QPS, bursty around events; writes (posts+comments+votes) are maybe 1-2 orders of magnitude lower. Read:write is roughly 100:1, so optimize reads.
**Step 3 — Lay out the pieces.** Post/comment service, vote service, a ranking/feed service, plus object store for media. Data model: `posts(id, sub_id, author, created_at, score)`, `comments` as an adjacency list or materialized path for nesting, `votes(user_id, post_id, dir)` for dedup. Shard posts by sub_id; cache rendered listings in Redis.
**Step 4 — How to compute and serve ranked listings.** This is the scored decision. Option A *compute-on-read*: run the hot-score formula (score decayed by age) over recent posts per request — simple and always fresh, but every read scans and sorts, which melts under 20K QPS. Option B *precompute per community*: maintain a sorted set (Redis ZSET) per sub keyed by hot-score, updated on each vote; reads are an O(log n) range scan — fast, and the classic answer. Option C *periodic batch recompute*: a job re-ranks every N minutes — cheapest but listings lag. Go with *precomputed ZSETs* for hot/top and a simple time index for new, recomputing decayed scores lazily on a timer since decay changes rankings even without new votes.
**Step 5 — Make voting cheap and fair.** Votes are the write hotspot. Dedup with the `votes` table (a user's vote is idempotent — flipping updates, not appends), buffer score deltas and flush in batches to avoid a write per click, and reconcile the cached ZSET asynchronously. Guard against a single viral post becoming a write hotspot by sharding its counter and summing.
**Step 6 — Guard rails.** Rate-limit submissions, detect vote brigading/bots, and cache comment trees with per-node vote counts loaded separately so a hot thread doesn't re-render on every vote.

**Key points:**
- Read-heavy: precompute ranked listings (Redis ZSET per community), don't sort on read.
- Hot-score decays with time, so recompute rankings on a timer, not only on votes.
- Votes must be idempotent (one row per user+post) and batched to survive spikes.
- Nested comments via materialized path or adjacency list; counts cached separately.
- Shard by community; split viral-post counters to avoid a single hot key.

---

### 82. Design a dating-app backend (Tinder)

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, geospatial, matching, recommendation, sharding

**Answer:** Frame it around two hard parts — serving a geo-filtered recommendation stack fast, and detecting mutual likes — then bolt on chat.

**Step 1 — Clarify what we're building.** Core ops: build a swipe deck of nearby candidates matching my filters, record swipe left/right, detect a match when two users both swiped right, then enable chat. Unknowns to raise: how strict the geo radius is, whether recommendations are ML-ranked or simple, and swipe volume per user. Framing conclusion: the deck query (geo + filters + freshness) and the match check are the two things to nail.
**Step 2 — Do the napkin math.** ~10M DAU, ~100 swipes/user/day → ~1B swipes/day ≈ 12K writes/sec average, spiky in evenings. Deck fetches are fewer than swipes (batch of 20-30 per fetch) but each is an expensive geo query. So it's write-heavy on swipes and compute-heavy on deck generation.
**Step 3 — Lay out the pieces.** Profile service, a recommendation/deck service, a swipe service, a match service, and chat. Store swipes in a fast KV keyed by `(swiper, target)`; store profiles with location. Precompute decks and cache them per user.
**Step 4 — Serving the geo-filtered deck.** This is the scored decision. Option A *bounding-box SQL*: `WHERE lat BETWEEN … AND lon BETWEEN …` with a B-tree — trivial but returns a square not a circle and scans poorly at scale. Option B *geohash buckets*: index users by geohash prefix, query the cell plus 8 neighbors — cheap prefix lookups, easy to shard, the pragmatic default; downside is edge effects at cell borders. Option C *specialized geo index* (Redis GEO / S2 / PostGIS): true radius queries with distance sort, richer but heavier. Pick *geohash sharding* for the candidate set, then rank in-app by ML score/filters. Precompute and cache each user's deck so a swipe session doesn't re-run geo queries.
**Step 5 — Detecting mutual likes.** On a right-swipe, write `(A→B)` then check whether `(B→A)` exists — a single KV lookup. If yes, create a match and notify both. Make the swipe write idempotent (re-swiping the same person is a no-op) and the match creation atomic so a simultaneous double right-swipe yields exactly one match, not two.
**Step 6 — Guard rails.** Never re-show swiped or blocked users (keep a seen-set / Bloom filter per user), rate-limit to fight bots, and shard swipe storage by swiper so a celebrity target doesn't become a hot partition.

**Key points:**
- Two hard parts: geo-filtered deck generation and mutual-like detection.
- Geohash bucketing gives cheap, sharded candidate lookups; rank the rest in-app.
- Match check is a single reverse-lookup; make swipe + match creation idempotent/atomic.
- Precompute decks and keep a per-user seen-set so users never repeat.
- Swipes are write-heavy and spiky — shard by swiper, batch, and expect evening peaks.

---

### 83. Design a calendar / scheduling system

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, recurrence, time-zones, invites, notifications

**Answer:** Frame it as a correctness problem first (recurrence + time zones), then a fan-out problem (invites and reminders).

**Step 1 — Clarify what we're building.** Core ops: create/edit an event (possibly recurring), invite attendees with RSVP, query "my events between X and Y", and fire reminders. Unknowns: how recurrence edits work (this-event vs. all-future), whether we need free/busy overlap detection, and reminder precision. Framing conclusion: recurrence expansion and time-zone/DST handling are the correctness core; invite fan-out and reminders are the scale core.
**Step 2 — Do the napkin math.** 500M users, a handful of events/day each, but reads dominate (clients poll the visible week/month). Range queries are the hot path — bursty at the top of the hour for reminders. Mostly read-heavy with a reminder-driven write/notify spike each minute.
**Step 3 — Lay out the pieces.** Event service, a recurrence expander, invite/RSVP service, and a reminder scheduler. Data model: store a recurring event once as an `RRULE` (RFC 5583) plus an `exceptions` table for edited/deleted single instances — never materialize every occurrence.
**Step 4 — Storing recurrence and answering range queries.** This is the scored decision. Option A *materialize every instance*: expand a "daily forever" event into rows — trivial reads but unbounded storage and painful edits. Option B *store the RRULE, expand on read*: keep one row + exceptions, expand occurrences within the queried window at read time — compact, correct for "edit this vs. all future," and the standard answer; cost is CPU per query, bounded because the window is small. Option C *hybrid*: store RRULE but cache materialized instances for the near-future window. Pick *store-rule-expand-on-read* with exceptions, since it makes edits and DST correct; store all times in UTC plus the originating IANA time-zone id so DST transitions expand correctly.
**Step 5 — Invites and free/busy.** Fan an invite out to attendees' calendars as lightweight references, track RSVP state per attendee, and compute free/busy by merging each attendee's occurrence intervals in the query window. Concurrent edits by organizer vs. attendee need a clear ownership rule (organizer owns the event; attendee owns their RSVP).
**Step 6 — Reminders at scale.** Don't scan all events every minute. Use a time-bucketed queue (sorted by fire-time, e.g. a Redis ZSET or a timer wheel); each minute pop the due bucket. Make reminder delivery idempotent so a retried scheduler run doesn't double-notify.

**Key points:**
- Store recurring events as an RRULE + exceptions; expand on read within the query window.
- Store UTC plus the IANA time-zone id so DST and "all future" edits stay correct.
- Range query over the visible window is the hot read path — keep it cheap and cacheable.
- Invites are references + per-attendee RSVP; free/busy merges occurrence intervals.
- Reminders use a time-bucketed queue, not a full scan; delivery must be idempotent.

---

### 84. Design a to-do / task app with cross-device sync

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, sync, offline-first, conflict-resolution, versioning

**Answer:** Frame it as an offline-first sync problem: the interesting part is reconciling edits made on multiple devices, some offline.

**Step 1 — Clarify what we're building.** Core ops: CRUD tasks/lists, mark done, reorder, and sync across a phone, tablet, and web — including edits made while offline. Unknowns: do we need real-time collaboration or just single-user multi-device, and how do we resolve two devices editing the same task? Framing conclusion: it's single-user multi-device sync, so a delta-sync + conflict-resolution scheme is the core, not raw scale.
**Step 2 — Do the napkin math.** Even 100M users with dozens of tasks each is tiny data (KBs per user). Sync frequency, not volume, drives load — each device pulls a delta on app open and pushes on edit. Write-light, sync-chatty; the challenge is correctness offline, not throughput.
**Step 3 — Lay out the pieces.** A sync API, a per-user datastore keyed by user, and a change-log/version per user. Data model: each task carries a stable id, a `version`/`updated_at`, and a `deleted` tombstone. Keep a monotonically increasing per-user change cursor so devices can ask "give me everything since cursor C."
**Step 4 — The sync + conflict model.** This is the scored decision. Option A *last-write-wins by timestamp*: simplest, but clock skew silently drops edits and it can't merge field-level changes. Option B *per-field LWW / version vectors*: track a version per field or a vector clock per device so concurrent edits to different fields both survive — more correct, more metadata. Option C *CRDTs*: conflict-free merge without a server referee, great for real-time collab but overkill here. For a single-user to-do app, pick *server-authoritative delta sync with per-item versioning*: client sends changes with the base version; server accepts if versions match, else returns the conflict for a defined merge (e.g. field-level LWW, tombstone wins for delete). Use tombstones so a delete on one device propagates instead of the item resurrecting.
**Step 5 — Efficient delta sync.** Client stores its last cursor; on sync it pulls all changes after that cursor and pushes local changes, then advances the cursor. This makes sync O(changes) not O(all tasks). Batch pushes and make them idempotent (client-generated ids) so a retried sync doesn't duplicate tasks.
**Step 6 — Edge cases.** Handle reordering (store fractional/ordered ranks, not array indices, so two inserts don't collide), and cap change-log growth by compacting old tombstones after all devices have synced past them.

**Key points:**
- It's offline-first sync: correctness of merges matters more than throughput.
- Delta sync via a per-user monotonic cursor — pull "changes since C," not everything.
- Per-item versioning beats naive timestamp LWW; use tombstones so deletes propagate.
- Client-generated ids + idempotent pushes prevent duplicates on retry.
- Store ordering as fractional ranks so concurrent reorders don't collide.

---

### 85. Design a note-taking sync service (Notion / Evernote)

**Frequency:** Medium

**Difficulty:** Hard
**Topics:** system-design, collaboration, crdt, operational-transform, storage

**Answer:** Walk it as a document-collaboration problem: the scored core is how concurrent edits to a shared, structured document are merged.

**Step 1 — Clarify what we're building.** Core ops: create nested pages/blocks, edit rich text and structured blocks, share with others, and sync in real time across devices. Key unknowns: is editing real-time collaborative (multiple people typing at once) or just multi-device single-user, how granular is a "block," and do we need offline editing. Framing conclusion: real-time collaboration on structured blocks is the hard part; assume that and the merge model dominates.
**Step 2 — Do the napkin math.** Reads dominate massively — most sessions are viewing, not editing. But editing generates a stream of tiny ops (keystrokes/block changes) per active collaborator; a doc with 5 live editors might see tens of ops/sec. So it's read-heavy overall with bursty, latency-sensitive write streams on hot docs.
**Step 3 — Lay out the pieces.** Doc service, a real-time collaboration/session layer (WebSocket) per active document, a persistence layer, and an object store for attachments. Data model: a document is a tree of blocks; each block has an id, type, content, and parent/order. Store the block tree plus an append-only op log per doc.
**Step 4 — The concurrent-edit merge model.** This is the scored decision, and the whole answer. Option A *lock the document*: only one editor at a time — trivially correct, terrible UX, disqualifying for "collaborative." Option B *Operational Transformation (OT)*: transform each op against concurrent ops via a central server that serializes and rebroadcasts — proven (Google Docs) but transform functions are notoriously hard to get right. Option C *CRDTs* (e.g. sequence CRDT for text, tree CRDT for blocks): each op carries enough identity (unique ids, causal metadata) that any order of application converges without a central referee — enables offline edits and simpler servers at the cost of per-element metadata and tombstone growth. For a Notion-style block model, favor *CRDTs*: block-level operations converge naturally and support offline; use a server as a relay + persistence, not an arbiter.
**Step 5 — Persistence and load performance.** Persist the op log (source of truth) and periodically snapshot the materialized block tree so opening a doc is O(snapshot + recent ops), not O(all history). Serve reads from the snapshot; hydrate the live session from snapshot + tail.
**Step 6 — Sharing, permissions, and edge cases.** Enforce per-page ACLs (inherited down the tree), compact tombstones once all replicas have observed them, and store large attachments in blob storage referenced by block id, not inline.

**Key points:**
- Real-time collab on structured blocks is the core; the merge model is what's scored.
- CRDTs converge without a central arbiter and enable offline; OT needs a serializing server.
- Model the doc as a block tree; keep an append-only op log as source of truth.
- Snapshot the materialized tree so opening a doc is fast, not a full replay.
- ACLs inherit down the tree; attachments live in blob store referenced by id.

---

### 86. Design a password-manager backend

**Frequency:** Low

**Difficulty:** Hard
**Topics:** system-design, security, encryption, zero-knowledge, key-management

**Answer:** This is a security-design question first: the whole answer hinges on the server never being able to read secrets (zero-knowledge / client-side encryption).

**Step 1 — Clarify what we're building.** Core ops: store encrypted credentials in a vault, sync the vault across devices, and let the user unlock with a master password. The critical unknown to raise loudly: can the server ever see plaintext? For a password manager the answer must be no — this is a zero-knowledge architecture, and stating that up front is what's scored. Everything else follows.
**Step 2 — Do the napkin math.** Data is tiny (a vault is KBs-MBs) and traffic is low — a sync on unlock and on change. This is not a scale problem; it's a correctness-and-security problem. Load shape: read-light, security-critical.
**Step 3 — Lay out the pieces.** Auth service, an encrypted-blob store (the vault), and a sync layer. The server stores only ciphertext plus metadata (item count, timestamps). The client does all crypto. Data model: `vault(user_id, encrypted_blob, version)` — the server treats the blob as opaque.
**Step 4 — Key derivation and the zero-knowledge boundary.** This is the scored decision. The master password must never leave the device, and the server must not be able to derive the encryption key from what it stores. Option A *derive one key from the master password* and send it to the server — wrong, server could decrypt. Option B *derive an encryption key locally* (via a slow KDF — Argon2id/scrypt/PBKDF2 with a high work factor and per-user salt) used only client-side, and separately derive an *auth* value the server can verify without learning the key — this is the correct split (encryption key stays local; auth is a different derived secret). Option C add a *secret key / device key* combined with the master password (1Password's approach) so a stolen server database plus a weak master password still isn't enough. Choose *local KDF with separated encryption vs. auth secrets*, ideally plus a device secret key. Encrypt each vault item under the derived key; the server only ever sees ciphertext.
**Step 5 — Sync, versioning, and recovery.** Sync the encrypted blob with a version so two devices don't clobber each other (optimistic concurrency; on conflict, merge client-side since only the client can read items). Recovery is a genuine tension: true zero-knowledge means a forgotten master password = unrecoverable data, so offer explicit escape hatches (recovery key, or account-recovery via trusted contacts) that the user opts into, never a server backdoor.
**Step 6 — Guard rails.** Rate-limit and add exponential backoff on unlock attempts, use a high KDF work factor to slow offline brute force if the blob leaks, rotate keys on master-password change by re-encrypting client-side, and store nothing derivable to plaintext server-side.

**Key points:**
- Zero-knowledge is the whole design: server stores ciphertext only, never sees plaintext.
- Derive the encryption key locally with a slow KDF (Argon2id) + salt; keep it off the server.
- Split encryption key from the auth secret so the server can authenticate without decrypting.
- Sync opaque encrypted blobs with versioning; resolve conflicts client-side.
- No server backdoor — recovery is an explicit opt-in (recovery key/device secret), a real trade-off.

---

### 87. Design a file sync & sharing service (Dropbox / Drive)

**Frequency:** High

**Difficulty:** Hard
**Topics:** system-design, chunking, deduplication, metadata, object-storage

**Answer:** Split it cleanly into two systems — bulk file bytes vs. tiny metadata — and spend your time on chunked, deduplicated, delta sync.

**Step 1 — Clarify what we're building.** Core ops: upload/download files, sync a local folder across devices, share files/folders, and handle large files and slow networks. Unknowns: max file size, whether we need versioning, and how aggressive dedup should be. Framing conclusion: separate the *metadata plane* (small, transactional, needs consistency) from the *data plane* (huge, in object storage), then make sync incremental.
**Step 2 — Do the napkin math.** Say 500M users, average 50 GB each → tens of exabytes — clearly object storage, not a database. Metadata is small per file but there are billions of files, so metadata QPS is high while byte throughput is the storage cost driver. Read:write skews toward reads (downloads/syncs), with big write bursts on bulk upload.
**Step 3 — Lay out the pieces.** A metadata service (file tree, versions, permissions) in a sharded DB, a block/chunk store in object storage (S3-style), a sync client, and a notification service to tell other devices "something changed." Data model: files are split into content-addressed chunks; a file = an ordered list of chunk hashes; metadata maps path → chunk list + version.
**Step 4 — Chunking, dedup, and delta sync.** This is the scored decision. When a file changes, you don't want to re-upload the whole thing. Option A *whole-file upload*: dead simple, but editing 1 byte of a 1 GB file re-sends 1 GB — unacceptable. Option B *fixed-size chunking* (e.g. 4 MB blocks): only changed blocks re-upload, content-hash each block for dedup so identical blocks (across files/users) store once — the standard answer; weakness is that an insert shifts all subsequent block boundaries. Option C *content-defined (Rabin) chunking*: boundaries chosen by rolling hash so an insert only affects nearby chunks — best delta efficiency, more complex. Pick *content-addressed chunking with dedup* (fixed 4 MB as the baseline, CDC if edits are insert-heavy): upload only chunks the server doesn't already have (check hashes first), and dedup globally.
**Step 5 — Consistency and change propagation.** The metadata store is the source of truth and must be consistent (a file appears only after all its chunks are committed — commit chunks, then atomically flip the metadata version). Notify other devices via long-poll/WebSocket so they pull the metadata delta and fetch only missing chunks. Keep version history by retaining old chunk lists.
**Step 6 — Guard rails.** Make uploads resumable (per-chunk, so a dropped connection resumes mid-file), verify chunk hashes on download for integrity, enforce sharing ACLs at the metadata layer, and reference-count chunks so dedup'd blocks aren't deleted while another file uses them.

**Key points:**
- Split metadata plane (consistent, sharded DB) from data plane (object storage).
- Content-addressed chunking + global dedup: upload only new/changed chunks, store identical blocks once.
- A file = ordered list of chunk hashes; commit chunks first, then flip metadata version atomically.
- Notify devices to pull metadata deltas and fetch only missing chunks; keep versions via old chunk lists.
- Resumable per-chunk uploads, hash verification, and reference-counted chunks for safe dedup.

---

### 88. Design a distributed quota / counter service

**Frequency:** Medium

**Difficulty:** Hard
**Topics:** system-design, rate-limiting, counters, consistency, sharding

**Answer:** Frame the central tension explicitly: enforcing a global limit accurately versus keeping the counter fast and available at scale.

**Step 1 — Clarify what we're building.** Core ops: increment a counter for a key (user/API-key/tenant) and check it against a quota (e.g. 1M requests/day, or 100 req/sec), across many app servers in many regions. The key unknown: how strict must the limit be — is a small overshoot acceptable, or must it be hard? Framing conclusion: strictness drives everything; most real quota systems accept slight overshoot for speed, and saying so is the scored insight.
**Step 2 — Do the napkin math.** This sits in the request hot path — if the API does 1M QPS, the counter service must handle 1M+ increments/sec with sub-millisecond added latency. Extremely write-heavy, latency-critical, and a single popular key is a natural hotspot. Availability matters: if the counter is down, do you fail open or closed?
**Step 3 — Lay out the pieces.** A counter store (in-memory, e.g. Redis or a purpose-built service), client-side libraries in each app server, and a config service holding quota definitions. Data model: `key → (count, window)`; use a sliding or fixed window, or token-bucket state per key.
**Step 4 — Global accuracy vs. speed.** This is the scored decision. Option A *single central counter* (one Redis with atomic INCR): globally accurate and simple, but every request pays a network round-trip and the key can hotspot — caps throughput and adds latency. Option B *local counters + periodic sync*: each server counts locally and reconciles with a central store every T ms — near-zero added latency and no per-request round-trip, but allows overshoot proportional to (servers × sync interval). Option C *token allocation / lease*: the central authority hands each server a batch of N permits; the server spends locally and requests more when low — bounds overshoot to at most one batch per server while amortizing coordination, the sweet spot for hard-ish limits at scale. Choose *token/lease allocation* when the limit must be near-hard, or *local + sync* when slight overshoot is fine; reserve the *single central counter* for low-QPS strict limits.
**Step 5 — Handling hotspots and windows.** Shard counters by key so unrelated keys don't contend; for a single hot key, split it into sub-counters across shards and sum. Prefer a sliding-window or token-bucket algorithm over a fixed window to avoid the double-burst at window boundaries.
**Step 6 — Failure behavior.** Decide fail-open (allow when the counter is unreachable — favors availability) vs. fail-closed (reject — favors correctness) per quota. Make increments idempotent where retries occur, and expire/TTL windows so stale keys don't leak memory.

**Key points:**
- State the strictness trade-off up front: near-hard limits cost coordination; overshoot buys speed.
- Token/lease allocation bounds overshoot while avoiding a round-trip per request.
- Local-count + periodic sync is fastest but overshoots by (servers × interval).
- Shard by key; split a single hot key into summed sub-counters to kill hotspots.
- Use sliding-window/token-bucket, TTL windows, and a deliberate fail-open vs. fail-closed choice.

---

### 89. Design a webhook-delivery system

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, queues, retries, idempotency, reliability

**Answer:** Frame it as reliable delivery to untrusted, flaky third-party endpoints — the scored core is retries, ordering, and not letting one bad consumer wreck the system.

**Step 1 — Clarify what we're building.** Core ops: an event happens in our system, we POST it to customer-registered URLs, and we guarantee it eventually arrives despite the customer's server being slow, down, or returning errors. Unknowns: at-least-once vs. exactly-once semantics, ordering guarantees, and how long we retry. Framing conclusion: aim for at-least-once with retries and let consumers dedupe — exactly-once across a network we don't control is a fantasy.
**Step 2 — Do the napkin math.** If we emit 100K events/sec and each has a few subscribers, that's hundreds of thousands of outbound HTTP calls/sec, many to slow endpoints. The killer is latency variance — a subscriber that takes 30s per call ties up workers. Write/dispatch-heavy with long-tail latency; must isolate slow consumers.
**Step 3 — Lay out the pieces.** An ingest API that writes events durably, a queue (Kafka/SQS) as the delivery buffer, a pool of delivery workers making the HTTP calls, and a dead-letter store for exhausted retries. Data model: `delivery(id, subscription, payload, attempt, next_retry_at, status)`.
**Step 4 — Retries, backoff, and failure isolation.** This is the scored decision. Option A *retry inline synchronously*: try, sleep, retry in the same request — trivially wrong, blocks and drops on crash. Option B *queue + exponential backoff with jitter*: on failure, re-enqueue with a growing delay (e.g. 1s, 4s, 16s… up to hours) and cap total attempts, then dead-letter — the standard reliable pattern; jitter prevents synchronized retry storms. Option C add a *per-subscriber circuit breaker*: when an endpoint is failing consistently, stop hammering it and back off the whole subscription so one dead consumer doesn't consume all workers or drown the queue. Combine B and C: durable queue, exponential backoff with jitter, capped attempts to a dead-letter queue, plus per-endpoint circuit breaking and concurrency limits so a slow consumer can't starve others.
**Step 5 — Delivery guarantees and idempotency.** Persist the event before ACKing the producer (so nothing is lost on crash), deliver at-least-once, and include a stable event id + signature in each webhook so consumers can dedupe and verify authenticity (HMAC of the payload). If ordering matters, key the queue by subscription so one subscriber's events stay ordered, accepting reduced parallelism.
**Step 6 — Guard rails.** Cap payload size and per-subscriber rate, expose a redelivery/replay API from the durable log, verify signatures, and set sane timeouts so a hanging endpoint frees the worker.

**Key points:**
- At-least-once delivery + consumer-side dedup; exactly-once over an uncontrolled network isn't real.
- Durable queue + exponential backoff with jitter + capped attempts → dead-letter queue.
- Per-endpoint circuit breakers and concurrency caps isolate slow/dead consumers.
- Sign payloads (HMAC) with a stable event id so consumers verify and dedupe.
- Persist before ACK; offer replay from the log; key by subscription if ordering is required.

---

### 90. Design an idempotency / exactly-once delivery layer

**Frequency:** Medium

**Difficulty:** Hard
**Topics:** system-design, idempotency, deduplication, consistency, distributed-systems

**Answer:** Lead with the honest framing: true exactly-once over a network is impossible, so you build at-least-once delivery plus exactly-once *processing* via idempotency keys — that distinction is the whole point.

**Step 1 — Clarify what we're building.** The goal: a client (or upstream service) may retry the same request (network timeout, crash-and-replay), and the operation — say, charging a card — must take effect exactly once. Unknown to raise: who supplies the dedup key, and over what time window must we remember it? Framing conclusion: guarantee exactly-once *effect*, not exactly-once *delivery*, by making the operation idempotent keyed on a client-supplied token.
**Step 2 — Do the napkin math.** The dedup store sits in the hot path of every mutating request — if the API does 50K writes/sec, it does 50K key lookups/sec, each adding latency to a payment. So it must be fast (in-memory/low-latency) and the retention window bounded, or the key store grows without limit. Latency-critical, write-heavy, storage bounded by window × rate.
**Step 3 — Lay out the pieces.** An idempotency-key store (fast KV with TTL), keyed on `(client_id, idempotency_key)`, holding the request's status and its saved response. Flow: on request, look up the key; if present, return the stored result; if absent, process and store atomically.
**Step 4 — Making check-and-execute atomic.** This is the scored decision, and the subtle one. The danger is two concurrent retries both seeing "key absent" and both executing. Option A *check-then-write (two steps)*: read, then insert if missing — racy; concurrent duplicates slip through. Option B *atomic insert-if-absent* (a unique constraint or `SET NX`): the first request wins the key and proceeds; a concurrent duplicate loses the insert and must wait for / return the first's result — correct, and the standard technique. Option C *tie the dedup record into the same transaction as the effect*: write the idempotency record in the same DB transaction that performs the charge, so the record and the effect commit or roll back together — strongest, eliminates the window where the effect happened but the key wasn't recorded (or vice-versa). Choose *atomic insert-if-absent*, and where the effect is in a transactional store, *commit the key in that same transaction*. Store an in-progress marker so a duplicate arriving mid-flight blocks or returns "processing" rather than re-executing.
**Step 5 — Handling retries and stored responses.** Persist the final response against the key so a retry after success returns the identical response (same status, same body) instead of re-charging. Handle the crash-mid-processing case: if a request is stuck "in-progress" past a timeout, decide via a recovery check whether the effect actually landed (idempotent downstream calls make this safe).
**Step 6 — Guard rails.** TTL keys (e.g. 24h) so the store stays bounded — long enough to cover realistic client retries; require client-generated keys (UUIDs); and push idempotency all the way down so downstream services (payment processors) also dedupe on the same key.

**Key points:**
- Exactly-once *delivery* is impossible; deliver at-least-once and make *processing* idempotent.
- Dedup on a client-supplied idempotency key with atomic insert-if-absent (unique constraint / SET NX).
- Best: write the idempotency record in the same transaction as the effect so they commit together.
- Store the response and an in-progress marker so retries return the same result, never re-execute.
- TTL the key store to bound growth; propagate the same key to downstream services.

---

### 91. Design a distributed transaction / saga coordinator

**Frequency:** Medium

**Difficulty:** Hard
**Topics:** system-design, distributed-transactions, saga, idempotency, consistency

**Answer:** Frame it as "we need atomic-ish outcomes across services that don't share a database," then walk from why 2PC hurts to how a saga gives you eventual consistency with compensations.

**Step 1 — Clarify what we're building.** The core operation is a business workflow spanning N services (e.g. order → payment → inventory → shipping) where each step commits locally but the whole thing must either complete or unwind. Key unknowns: can steps be undone (compensatable) or are some irreversible? What consistency does the product actually need? The framing conclusion: cross-service ACID is off the table, so we design for *eventual* consistency with explicit compensation.
**Step 2 — Do the napkin math.** Say 5k orders/sec, 4 steps each → ~20k step-transitions/sec, write-heavy on the saga log. Each saga may live seconds to minutes (payment retries, shipping), so we hold millions of in-flight sagas — state must be durable, not in memory.
**Step 3 — Lay out the pieces.** A saga definition (ordered steps + their compensations), a coordinator that drives transitions, a durable saga-state store (row per saga instance with current step + status), and a reliable message channel to invoke each service. Every step and compensation is an idempotent service call.
**Step 4 — Orchestration vs choreography.** This is the scored decision. *Orchestration:* a central coordinator explicitly calls each step and, on failure, runs compensations in reverse — easy to reason about, visualize, and debug, but the coordinator is a component you must make HA and it becomes a workflow bottleneck. *Choreography:* services emit events and react to each other with no central brain — no single bottleneck and loosely coupled, but the end-to-end flow is implicit, hard to trace, and cyclic dependencies creep in. For a complex multi-step money flow, pick orchestration; for a few loosely-related reactions, choreography. A middle path is a durable workflow engine (Temporal/Cadence) that gives orchestration semantics with built-in persistence and retries.
**Step 5 — Reliability of each transition.** Use the outbox pattern: the service writes its local state change and an outbox row in one local transaction, and a relay publishes it — this closes the dual-write gap. Every handler is idempotent keyed by saga-id + step so redelivery is safe. On step failure the coordinator triggers compensations backward; compensations must also be idempotent and, ideally, commutative.
**Step 6 — Guard rails.** Handle the "cannot compensate" case (money already captured) with a forward-recovery/retry queue plus alerting for manual intervention. Add per-saga timeouts so stuck sagas don't leak, and a dead-letter path for poison steps.

**Key points:**
- Give up distributed ACID; design for eventual consistency with explicit compensations.
- Orchestration = traceable but central; choreography = decoupled but opaque — name the trade-off out loud.
- Durable saga state + outbox pattern kills the dual-write problem.
- Every step and compensation must be idempotent (keyed by saga-id).
- Plan for irreversible steps with forward recovery and human-in-the-loop.

---

### 92. Design a multi-region active-active database

**Frequency:** Medium

**Difficulty:** Hard
**Topics:** system-design, replication, consistency, conflict-resolution, geo-distribution

**Answer:** Frame it around the one question the interviewer is really asking — "what happens when two regions accept a conflicting write at the same time?" — then work outward from there.

**Step 1 — Clarify what we're building.** Active-active means every region takes reads AND writes for low latency and survives a full-region loss. Key unknowns: do we need strong consistency or is read-your-writes / eventual acceptable? What's the conflict rate? The framing conclusion: active-active forces us to choose a consistency model up front, because that dictates the whole replication design.
**Step 2 — Do the napkin math.** Cross-region RTT is ~70–150 ms (US-EU); a synchronous quorum across 3 regions adds that to every write. If we do 100k writes/sec and most are region-local, paying 100 ms of cross-region latency per write is unacceptable — that pressure pushes us toward async replication for the common case.
**Step 3 — Lay out the pieces.** Regional DB clusters, an async replication bus between regions, a conflict-resolution layer, and a global routing/DNS tier that pins users to their nearest region with failover. Data model choices (per-key ownership, versioning metadata) matter as much as the boxes.
**Step 4 — How to handle conflicting concurrent writes.** The scored decision. *Last-write-wins with timestamps:* trivial, but silently loses data and needs tight clock sync (or hybrid logical clocks). *CRDTs:* mathematically merge without coordination — great for counters, sets, carts — but not every data type maps to a CRDT. *Synchronous consensus (Spanner/Raft with quorum):* strong consistency and no conflicts, but you pay cross-region latency on every write and lose availability if a quorum is unreachable. *Per-record home region (partitioned ownership):* writes for a key go to its owner region, eliminating conflicts while keeping most writes local — the pragmatic default for many systems. Choose based on whether the product can tolerate lost/merged writes.
**Step 5 — Consistency and failover.** For reads, offer per-request tunable consistency: local (fast, possibly stale) vs quorum (fresh). Use hybrid logical clocks to order events across regions. On region failure, promote replicas and re-home owned keys; on recovery, reconcile the divergence log.
**Step 6 — Guard rails.** Watch replication lag as a first-class SLO; cap it and shed writes or fail over before it grows unbounded. Guard against split-brain during partitions with fencing tokens / lease-based ownership.

**Key points:**
- The core question is concurrent-conflict handling — everything follows from your consistency choice.
- Cross-region RTT (~100 ms) makes synchronous global writes expensive; prefer async + per-key ownership.
- LWW loses data; CRDTs merge cleanly but only for some types; consensus is strong but slow.
- Hybrid logical clocks order cross-region events without perfect clocks.
- Treat replication lag as an SLO and design explicit failover + reconciliation.

---

### 93. Design a backup & disaster-recovery system

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, backup, disaster-recovery, storage, durability

**Answer:** Frame it around two numbers — RPO (how much data can we lose) and RTO (how fast must we recover) — because every design choice is justified against them.

**Step 1 — Clarify what we're building.** We protect stateful systems (databases, object stores) so we can restore after corruption, deletion, or region loss. Key unknowns: RPO and RTO targets, scale of data, and threat model (hardware failure vs ransomware vs bad deploy). The framing conclusion: RPO/RTO drive backup frequency and topology; nail those first.
**Step 2 — Do the napkin math.** Say 100 TB dataset, 5% daily change = 5 TB/day of deltas. A full backup over a 10 Gbps link is ~1 day — too slow to do nightly, so we do periodic fulls + frequent incrementals + continuous WAL/log shipping. Restore of 100 TB is the RTO bottleneck; that shapes storage-tier choice.
**Step 3 — Lay out the pieces.** A backup scheduler/orchestrator, agents that snapshot sources, a chunked+deduplicated+compressed backup store (object storage, versioned), a catalog/metadata index of what's where, and a restore/verify pipeline.
**Step 4 — Backup strategy and RPO/RTO trade-off.** The scored decision. *Full backups only:* simple restore, but huge storage and slow, so infrequent → poor RPO. *Full + incremental:* small frequent deltas → good RPO and cheap storage, but restore must replay a chain (slower RTO) and a broken link fails the chain. *Continuous / point-in-time (log shipping):* near-zero RPO and restore to any second, but more moving parts and storage. *Hot standby replica:* RTO in seconds via failover, but doubles cost and replicates corruption instantly (not a substitute for backups). Match the mix to the tier: continuous PITR for the primary DB, incrementals for object data, standby for the highest-tier service.
**Step 5 — Trust the backups.** Untested backups are worthless: run automated restore drills, checksum verification, and periodic game-days. Store copies across regions/accounts and keep immutable (WORM / object-lock) copies so ransomware or a rogue admin can't delete them (3-2-1 rule).
**Step 6 — Guard rails.** Encrypt at rest and in transit, keep tiered retention (daily/weekly/monthly), and isolate backup credentials from prod so one compromise can't wipe both.

**Key points:**
- RPO and RTO are the north stars — justify every choice against them.
- Full + incremental + continuous log shipping balances storage, RPO, and RTO.
- A replica is not a backup — it replicates corruption; keep immutable, off-account copies.
- Untested restores don't count: automate restore drills and integrity checks.
- Follow 3-2-1 and use object-lock/WORM to survive ransomware and rogue deletes.

---

### 94. Design an online schema-change / data-migration system

**Frequency:** Medium

**Difficulty:** Hard
**Topics:** system-design, migrations, backfill, backward-compatibility, zero-downtime

**Answer:** Frame it as "change the schema of a live, high-traffic table with zero downtime and a safe rollback," then walk the expand-migrate-contract playbook.

**Step 1 — Clarify what we're building.** We need to run DDL and backfills on tables that are being read and written continuously, without locking them or breaking the app. Key unknowns: table size, is a long lock acceptable, single DB or sharded fleet, and do we need online rollback? Framing conclusion: because we can't take a lock, we must decouple schema evolution from a single atomic step.
**Step 2 — Do the napkin math.** A 1 B-row table at 50k writes/sec: an in-place `ALTER` that rewrites the table could lock for hours — a non-starter. Backfilling 1 B rows in batches of 1k with throttling to avoid replication lag might take many hours to days, so the system must be resumable and pausable.
**Step 3 — Lay out the pieces.** A migration definition + version registry, a backfill job runner (batched, throttled, checkpointed), a shadow/ghost-table copier for rewrites, a change-capture hook to keep the copy in sync, and an app-side dual-read/dual-write toggle behind feature flags.
**Step 4 — How to apply the change without downtime.** The scored decision. *In-place ALTER:* simplest, fine for metadata-only changes (adding a nullable column) but locks/rewrites for real changes — unacceptable at scale. *Ghost-table / shadow-copy (gh-ost, pt-osc):* create a new table with the target schema, copy rows in batches while a trigger or binlog tailer replays live changes, then atomically swap — near-zero lock, resumable, but doubles storage and has a tricky cutover. *Expand-migrate-contract at the app layer:* deploy code that writes both old+new columns (expand), backfill old data, switch reads to new, then drop old (contract) — safest and rollback-friendly, but requires multiple deploys and careful ordering. Ghost-table for physical rewrites; expand-contract for logical schema evolution — often combine them.
**Step 5 — Safe backfill and cutover.** Backfill in idempotent, checkpointed batches with adaptive throttling driven by replication lag and DB load. Verify with a shadow-read comparison (old vs new) before flipping reads. Make the cutover a flag flip, not a deploy, so rollback is instant.
**Step 6 — Guard rails.** Never write code that can't tolerate both schemas mid-migration; gate each phase behind a flag; and for a sharded fleet, roll shard-by-shard with automatic halt on error-rate/lag regression.

**Key points:**
- You can't lock a hot table — decouple change into expand → backfill → contract phases.
- Ghost/shadow-table copy enables online rewrites; expand-contract enables safe logical change.
- Backfills must be batched, throttled by replication lag, checkpointed, and resumable.
- Gate every phase behind feature flags so cutover and rollback are instant flips.
- Verify with shadow reads before switching, and roll sharded fleets incrementally.

---

### 95. Design a TTL-expiry / large-scale garbage-collection system

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, ttl, garbage-collection, storage, batch-processing

**Answer:** Frame it as "reclaim expired data at scale without a full-table scan and without a thundering-herd of deletes," then choose your expiry mechanism.

**Step 1 — Clarify what we're building.** Objects (sessions, cache entries, uploads, soft-deleted rows) carry an expiry and must be physically reclaimed. Key unknowns: is lazy (on-read) expiry acceptable or must storage be freed promptly? scale and deletion rate? hard vs soft delete? Framing conclusion: at scale, scanning everything to find expired items is the enemy — the design is really about *finding* expired items cheaply.
**Step 2 — Do the napkin math.** 10 B objects, avg TTL 30 days → ~330 M expirations/day ≈ 3.8k deletes/sec sustained, but they cluster (everything set at midnight expires at midnight) → bursty. That burst is the real challenge; smoothing it drives the design.
**Step 3 — Lay out the pieces.** An expiry index (time-bucketed), a scheduler that pulls due buckets, a throttled delete-worker pool, and the underlying store. For cache-like data, a TTL field plus background eviction; for durable data, a two-phase soft-delete then GC.
**Step 4 — How to find and reclaim expired items.** The scored decision. *Lazy expiry (check on read):* zero background cost and always correct on access, but storage is never reclaimed for cold data — leaks space. *Full periodic scan:* simple, but O(all data) and murders the DB at scale. *Time-bucketed index / sorted queue:* store keys in buckets keyed by expiry minute (a sorted set / partitioned table); the GC only reads buckets whose time has passed — O(expired) not O(all). *Storage-native TTL:* let the engine do it (Redis TTL, DynamoDB TTL, RocksDB compaction filters, Cassandra tombstones) — cheapest to operate but you cede timing control and inherit its quirks (tombstone buildup). Combine lazy + bucketed background GC for correctness plus reclamation.
**Step 5 — Smooth the burst and delete safely.** Add jitter to TTLs and process buckets with a rate-limited worker pool to avoid delete storms and replication lag. Delete in batches, respect back-pressure from the store, and prefer soft-delete + async physical GC so a bad rule is recoverable.
**Step 6 — Guard rails.** Make GC idempotent and resumable via checkpoints; watch for tombstone/compaction pressure (Cassandra); and add a safety valve that halts mass deletion if the rate spikes abnormally (guards against a bug expiring everything).

**Key points:**
- The hard part is finding expired items cheaply — use a time-bucketed index, never a full scan.
- Lazy expiry never reclaims cold storage; pair it with background GC.
- Expirations are bursty (midnight cliff) — add TTL jitter and rate-limit deletes.
- Prefer soft-delete + async physical GC so mistakes are recoverable.
- Storage-native TTL is cheapest but watch tombstone/compaction side effects.

---

### 96. Design a click-tracking / link-analytics system

**Frequency:** High

**Difficulty:** Medium
**Topics:** system-design, analytics, event-ingestion, stream-processing, aggregation

**Answer:** Frame it as a write-heavy event pipeline: capture the click fast and redirect instantly, then do all the counting asynchronously downstream.

**Step 1 — Clarify what we're building.** A short/tracked link redirects the user AND records a click with attributes (time, geo, device, referrer) for real-time and historical analytics. Key unknowns: is exact count required or is approximate fine? real-time dashboards or daily reports? The framing conclusion: the redirect must be sub-100 ms, so tracking has to be off the critical path.
**Step 2 — Do the napkin math.** 10k clicks/sec average, 100k/sec peak on a viral link → hugely write-heavy and skewed. ~1 B clicks/day × ~200 bytes = ~200 GB/day raw; we can't query raw at read time, so pre-aggregation is mandatory.
**Step 3 — Lay out the pieces.** An edge redirect service (does the 302 immediately, fire-and-forget the event), a durable event bus (Kafka) as the buffer, stream processors that aggregate, an OLAP/time-series store for aggregates, raw event storage (S3/data lake) for replay, and a query/dashboard API.
**Step 4 — Batch vs stream aggregation (and exact vs approximate).** The scored decision. *Real-time stream aggregation (Flink/Spark Streaming):* dashboards update within seconds via windowed counters — great UX, but stateful streaming is operationally heavy and exactly-once needs care. *Batch aggregation (hourly/daily MapReduce over the lake):* simple, cheap, replayable, and accurate, but high latency. *Lambda/Kappa hybrid:* stream for fresh approximate numbers, batch to correct them — best of both, more complexity. For unique-visitor counts, exact distinct is expensive at this scale → use *HyperLogLog* for approximate uniques and *count-min sketch* for top-links; reserve exact counts for billing-grade metrics. Pick approximate-fast for dashboards, exact-batch for reports.
**Step 5 — Make ingestion durable and the redirect fast.** The redirect never blocks on tracking: enqueue asynchronously, and if the bus is down, still redirect. Kafka gives durability + replay so a downstream bug isn't data loss. Partition by link-id, but hot viral links create a partition skew — salt the key or pre-aggregate at the edge.
**Step 6 — Guard rails.** De-dup and filter bots (idempotency key per request, rate limits) so counts aren't inflated; handle late-arriving events with watermarks; and cache hot link→target lookups so the redirect stays fast.

**Key points:**
- Redirect first, track asynchronously — never block the user on analytics.
- Write-heavy + skewed (viral links); buffer through Kafka for durability and replay.
- Pre-aggregate; use HyperLogLog / count-min sketch for cheap approximate uniques and top-K.
- Stream for real-time dashboards, batch for accurate reports (lambda/kappa).
- Watch partition skew on hot links and de-dup bot traffic.

---

### 97. Design an online-judge (LeetCode-style) system

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, sandboxing, job-queue, isolation, scaling

**Answer:** Frame it around the one genuinely hard part — running untrusted user code safely — and build the async submission pipeline around it.

**Step 1 — Clarify what we're building.** Users submit code that we compile, run against hidden test cases under time/memory limits, and return a verdict (AC/WA/TLE/MLE/RE). Key unknowns: supported languages, throughput (contest spikes!), and how strong the isolation must be. Framing conclusion: we're running arbitrary hostile code, so sandbox isolation is the design's center of gravity.
**Step 2 — Do the napkin math.** Steady state maybe 100 submissions/sec, but a contest start is a thundering herd → 10k+/sec for minutes. Each run takes 1–10 s of CPU. So it's bursty and CPU-bound → a queue + elastic worker pool, sized for the burst, is mandatory.
**Step 3 — Lay out the pieces.** An API that accepts submissions and returns a job-id, a durable submission queue, a fleet of judge workers (the sandboxes), a test-case store (versioned, cached near workers), a results store, and a push/poll channel to deliver verdicts.
**Step 4 — How to sandbox untrusted code.** The scored decision. *Containers (Docker) with cgroups + seccomp + no network + read-only FS:* good isolation with low overhead and fast startup, the common default, but a kernel exploit escapes the shared kernel. *MicroVMs (Firecracker/gVisor):* near-VM isolation with container-like speed — stronger boundary, slightly more overhead, the modern choice for hostile multi-tenant code. *Full VMs / per-run ephemeral hosts:* strongest isolation, but slow and expensive to spin up. Layer defenses regardless: drop capabilities, disable networking, set rlimits, run as unprivileged user, and enforce CPU/memory/PID/wall-clock limits via cgroups. Pick microVMs when the threat model is serious, containers when speed dominates.
**Step 5 — Fair, elastic execution and accurate limits.** Decouple submit from judge via the queue so contest bursts just deepen the queue, not crash the site; autoscale workers on queue depth. Enforce time limits with a hard wall-clock kill (not just CPU time) and pin CPU to make timing deterministic. Cache test cases at workers to avoid I/O per run.
**Step 6 — Guard rails.** Prevent abuse (fork bombs → PID limits; disk fill → quota; network exfil → no net); ensure idempotent re-judging when test cases change; and isolate one submission's crash from the worker so it can be recycled cleanly.

**Key points:**
- Running untrusted code safely is the crux — sandbox with cgroups/seccomp; microVMs for stronger isolation.
- Async queue + elastic workers absorbs contest thundering-herds.
- Enforce wall-clock/CPU/memory/PID limits; pin CPU for deterministic timing.
- Cache versioned test cases near workers; support idempotent re-judge.
- Defense in depth: no network, read-only FS, unprivileged user, dropped capabilities.

---

### 98. Design a large-scale polling / survey system

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, counters, write-throughput, aggregation, real-time

**Answer:** Frame it as a write-heavy counter problem: the hard part isn't storing votes, it's counting a viral poll without a single hot row melting down.

**Step 1 — Clarify what we're building.** Users answer poll/survey questions; we tally results, often shown live. Key unknowns: single-choice votes vs multi-question surveys, must results be real-time, one-vote-per-user enforcement, and can counts be approximate/eventually consistent? Framing conclusion: a viral single-question poll is a hot-key write problem, so counter design dominates.
**Step 2 — Do the napkin math.** A poll pushed to 50 M users, 20% answer in the first hour → 10 M votes/hour, but bursts to 50k votes/sec, most hitting one poll → severe write hotspot on a handful of counters. Reads (live results) can be even higher. This screams for sharded counters + read caching.
**Step 3 — Lay out the pieces.** A vote-ingest API, a durable log/queue for votes, a counter store, a results cache, and a metadata store for poll definitions and per-user vote records (for dedup). Surveys add a response store keyed by respondent for multi-question forms.
**Step 4 — How to count votes at scale.** The scored decision. *Single atomic counter row per option:* simple and exact, but one row under 50k writes/sec is a lock/hotspot that collapses. *Sharded counters (N sub-counters summed on read):* spread writes across N shards to kill the hotspot, exact when summed, at the cost of read-time fan-in — the standard fix. *Approximate/streaming aggregation:* buffer votes in a queue and aggregate in windows, showing near-real-time approximate totals — cheapest for writes, but results lag slightly and need eventual reconciliation. *Redis INCR with periodic flush to durable store:* very fast, but durability gap on crash. For live viral polls, sharded counters or streamed aggregation; for accurate surveys, durable per-response storage aggregated in batch.
**Step 5 — Dedup and consistency.** Enforce one-vote-per-user with an idempotency key (user-id + poll-id) checked before increment, so retries and double-clicks don't inflate counts. Show results from a cache refreshed every few seconds; accept eventual consistency for the live number and reconcile from the durable log.
**Step 6 — Guard rails.** Rate-limit and bot-filter to stop ballot stuffing; for anonymous polls, dedup by device/IP heuristics; and keep the raw vote log so you can recompute if a counter is corrupted.

**Key points:**
- A viral poll is a hot-key write problem — sharded counters are the core fix.
- Sum shards on read for exact counts; stream-aggregate for cheap near-real-time totals.
- Enforce one-vote-per-user with an idempotency key before incrementing.
- Serve live results from a short-TTL cache; reconcile from the durable vote log.
- Rate-limit and bot-filter to prevent ballot stuffing.

---

### 99. Design a smart-home / IoT device platform

**Frequency:** Medium

**Difficulty:** Hard
**Topics:** system-design, iot, mqtt, device-state, time-series, connectivity

**Answer:** Frame it around the two things that make IoT different from web systems — millions of persistent, flaky connections and devices that go offline — then design the connectivity and state layers around that.

**Step 1 — Clarify what we're building.** Devices report telemetry and receive commands; users control them via app/cloud. Key unknowns: number of devices, telemetry frequency, real-time control latency needs, and how to handle offline/reconnecting devices. Framing conclusion: managing millions of long-lived, unreliable connections is the defining constraint, unlike request/response web.
**Step 2 — Do the napkin math.** 50 M devices, each a heartbeat + telemetry every 30 s → ~1.6 M msgs/sec, tiny payloads, sustained and always-on. Millions of concurrent TCP connections means connection handling, not CPU, is the bottleneck; and telemetry is append-heavy time-series.
**Step 3 — Lay out the pieces.** A device-connectivity/gateway tier holding the persistent connections, a message broker, a device-state/registry service (a digital twin per device), a time-series store for telemetry, a command/control path, and rules/automation engine + user API.
**Step 4 — Connection protocol and command delivery.** The scored decision. *MQTT over persistent TCP (with QoS levels):* purpose-built for constrained, lossy IoT — tiny overhead, pub/sub topics, QoS 0/1/2 for delivery guarantees, and last-will for disconnect detection — the standard choice; downside is you operate a stateful broker fleet holding millions of sessions. *HTTP long-poll / webhooks:* simple and firewall-friendly, but heavyweight per message and awkward for push. *CoAP over UDP:* ultra-lightweight for tiny devices, but unreliable transport needs app-level retries. For command delivery to possibly-offline devices, use a *device shadow / digital twin:* the desired state is stored server-side and synced when the device reconnects, so you never lose a command to a sleeping device. Choose MQTT + device shadow as the backbone.
**Step 5 — State, offline handling, and scale.** The digital twin holds reported vs desired state; commands write desired state and reconcile on reconnect. Shard the connection gateways and route by device-id; store telemetry in a time-series DB with downsampling/rollups and TTL for old high-resolution data.
**Step 6 — Guard rails.** Security is huge: per-device identity (X.509 certs), TLS, and revocation — a botnet of hijacked devices is the nightmare. Handle reconnection storms (a region flap reconnects millions at once) with backoff + jitter, and rate-limit per device.

**Key points:**
- The defining constraint is millions of persistent, unreliable connections — connection handling, not CPU, is the bottleneck.
- MQTT (pub/sub, QoS, last-will) is the IoT-native protocol; CoAP for the tiniest devices.
- Use a device shadow / digital twin so commands survive offline devices (desired vs reported state).
- Telemetry is append-heavy time-series — downsample, roll up, and TTL old data.
- Per-device certs + TLS are non-negotiable; plan for reconnection storms with backoff+jitter.

---

### 100. Design a health-check & auto-healing system

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, health-checks, failure-detection, orchestration, reliability

**Answer:** Frame it as a control loop — detect unhealthy instances reliably, then act to restore capacity — and spend your time on avoiding false positives that cause cascading self-inflicted outages.

**Step 1 — Clarify what we're building.** We continuously check service/instance health and automatically remediate (restart, replace, reroute traffic) without paging a human for routine failures. Key unknowns: what "healthy" means per service, blast radius of auto-actions, and how to avoid healing storms. Framing conclusion: the danger isn't detecting failure, it's overreacting to false positives, so the design centers on trustworthy signals + safe actions.
**Step 2 — Do the napkin math.** 10k instances probed every 5 s = 2k probes/sec — trivial load. The real numbers that matter are timing: detection latency (how fast we notice) vs stability (how sure we are before acting). Too-frequent/too-sensitive probing causes flapping; that trade-off is the whole game.
**Step 3 — Lay out the pieces.** Health probes (per instance), a health aggregator/failure detector, a decision/policy engine, an actuator that integrates with the orchestrator (K8s, load balancer, autoscaler), and an alerting path for cases beyond auto-heal.
**Step 4 — Probe type and avoiding false positives.** The scored decision. *Shallow liveness (process up / TCP accept):* cheap and stable, but misses deadlocks and dependency failures. *Deep readiness (checks DB, downstream deps):* catches real unavailability, but couples health to dependencies — a shared DB blip marks the whole fleet unhealthy and triggers a mass restart that makes it worse. So separate *liveness* (restart me if I'm broken) from *readiness* (stop sending me traffic, don't kill me). Require N-consecutive failures + timeouts before acting to survive transient blips, and *fail static* — if the checker itself can't reach a fleet, don't mass-remove it (assume healthy) to avoid a monitoring bug taking down prod. This liveness/readiness split + hysteresis is the scored insight.
**Step 5 — Safe remediation.** Escalate gradually: reroute traffic (drain) → restart → replace → alert human, never all at once. Cap the fraction of instances auto-healed concurrently (a budget) so healing can't remove more capacity than the outage. Use circuit breakers so a failing dependency isn't retried into the ground.
**Step 6 — Guard rails.** Prevent healing storms and flapping loops with rate limits and cooldowns; make actions idempotent; and always leave an audit trail + escalate to humans when auto-heal repeatedly fails (crash-loop = stop and page, don't restart forever).

**Key points:**
- The risk is overreacting to false positives — build trustworthy signals + safe actions, not just detection.
- Separate liveness (restart) from readiness (drain traffic) so dependency blips don't cause mass restarts.
- Require N-consecutive failures + hysteresis; fail static when the checker itself is blind.
- Cap concurrent auto-heals with a budget so remediation can't out-remove the outage.
- Escalate gradually (drain → restart → replace → page); detect crash-loops and stop.

---

### 101. Design a parking lot system

**Frequency:** High

**Difficulty:** Medium
**Topics:** system-design, ood, class-design, strategy-pattern

**Answer:** An OOD question isn't about capacity math — it's about decomposing a real system into clean classes: mine nouns from the requirements for classes and verbs for methods, show the relationships, and isolate the part most likely to change (here: pricing and spot assignment).

**Step 1 — Clarify scope.** Multi-level lot, multiple vehicle types (motorcycle, car, bus), spot sizes (small/medium/large), ticket on entry, fee by duration on exit. Ask: can a bus span multiple small spots? Monthly passes / reservations? Concurrent entry at multiple gates? Keep v1 small: one fee rule, fixed size mapping.

**Step 2 — Identify core classes (nouns → classes).** `ParkingLot` (aggregate root holding floors), `ParkingFloor`, `ParkingSpot` (size + occupancy), `Vehicle` (abstract, subclassed by `Motorcycle/Car/Bus`), `Ticket` (entry time, spot), `EntryGate/ExitGate`, `Payment`. Each class owns its own data and behavior — a `ParkingSpot` knows whether it can hold a given vehicle; don't scatter that logic.

**Step 3 — Relationships and key methods.** `ParkingLot.parkVehicle(vehicle)` finds a fitting free spot and issues a `Ticket`; `ParkingLot.unpark(ticket)` frees the spot and triggers billing. Isolate spot selection behind a `SpotAssignmentStrategy` (nearest / best-fit by size) so swapping the algorithm doesn't touch the main flow.

**Step 4 — The graded decision: pricing and spot fit.** Pricing changes most, so use the **Strategy pattern**: a `FeeStrategy` interface with `HourlyFeeStrategy`, `FlatDayFeeStrategy`, `WeekendFeeStrategy`; `ExitGate` holds a strategy reference. Spot fit is one-to-many (a car fits medium/large), so handle graceful fallback to a larger spot when there's no exact match.

**Step 5 — Concurrency and extensibility.** Multiple gates racing for the same spot is a race condition: pessimistically lock the candidate spot, or reserve atomically with CAS. Extensibility: adding EV charging spots = one new `Vehicle` subclass + one `ParkingSpot` type, no core changes — that's the acceptance test for good OOD (extend by adding classes, not editing old ones — the Open/Closed Principle).

**Key points:**
- Nouns → classes, verbs → methods: `ParkingLot/Floor/Spot/Vehicle/Ticket/Gate`.
- Isolate the most volatile logic (pricing) behind a `FeeStrategy` (Strategy pattern).
- Vehicle→spot is one-to-many; handle fallback when there's no exact fit.
- Guard the spot-assignment race across concurrent gates (lock or CAS).
- Acceptance test: new vehicle/spot types added by subclassing (Open/Closed), no edits to existing code.

---

### 102. Design a vending machine

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, ood, state-machine, state-pattern

**Answer:** The heart of this one is a **state machine**: the machine moves through "awaiting coins → has money → dispensing → making change," and the same action (insert coin, select product) behaves differently per state. Use the State pattern to wrap each state in a class and avoid a giant if-else.

**Step 1 — Clarify.** Support inserting coins (multiple denominations), selecting a product, dispensing, making change, and refunds. Ask: cashless payment? How to handle out-of-stock / insufficient funds? Concurrency (two people pressing) usually doesn't apply on a single machine, but mention it. v1: cash + single selection.

**Step 2 — Core classes.** `VendingMachine` (context holding current state + inventory), `State` (interface), `Product`, `Inventory` (product → count, price), `Coin`/`Cash` (denomination enum), `Transaction` (amount inserted so far).

**Step 3 — The graded decision: State pattern.** Define a `State` interface: `insertCoin()`, `selectProduct()`, `dispense()`, `refund()`. Subclass `IdleState`, `HasMoneyState`, `DispensingState`, `OutOfStockState`. `VendingMachine` **delegates** each operation to its current `state` object, which decides behavior and transitions to the next state. Contrast: an enum + `if (state == ...)` works but explodes as states grow; the State pattern localizes each state's rules.

**Step 4 — Key logic.** Change-making: greedily assemble from available coins (call out the edge case where exact change is impossible — either reject the sale or warn "no change"). Inventory: check before dispensing, decrement atomically on success. Failure path: a mid-transaction refund must return the full inserted amount and reset to Idle.

**Step 5 — Extensibility and trade-offs.** Adding card payment = a new `PaymentStrategy`, orthogonal to the state machine. Trade-off: the State pattern means more classes but stays maintainable; a small machine can get away with an enum switch. At the hardware layer, a dispense-motor failure needs a timeout/rollback.

**Key points:**
- It's fundamentally a state machine: same action behaves differently per state — reach for the **State pattern**.
- `State` interface + one subclass per state; `VendingMachine` delegates to the current state, which drives transitions.
- Greedy change-making; handle "can't make exact change"; check inventory before dispensing, decrement atomically after.
- Refund/failure paths must return money and reset to Idle.
- Add payment methods via the Strategy pattern, orthogonal to the state machine.

---

### 103. Design a library management system

**Frequency:** Medium

**Difficulty:** Medium
**Topics:** system-design, ood, class-design, domain-modeling

**Answer:** This one tests domain modeling. The trap: a "book" has two levels — the title (name/author, one) and the physical copy (the specific one on the shelf, many). Separating those two levels cleanly is the graded point.

**Step 1 — Clarify.** Members borrow/return books, with borrow limits and due dates, overdue fines, holds (reservations) on loaned books, and catalog search. Ask: e-books? Multiple branches? Fixed fine rules? v1: single branch, physical books, fixed fine.

**Step 2 — Core classes (the key distinction).** `Book` (the title: ISBN, name, author — the logical "kind of book") vs `BookItem` (a physical copy: barcode, shelf location, status available/loaned/reserved). One `Book` to many `BookItem`s. Also: `Member`, `Librarian` (both extend `Account`/`Person`), `Loan` (a lending record: BookItem, member, checkout date, due date), `Reservation`, `Catalog` (search), `Fine`.

**Step 3 — Relationships and key methods.** `Member.checkout(bookItem)`: verify under limit and copy is available → create a `Loan`, set the copy to loaned. `Member.return(loan)`: set back to available, generate a `Fine` if overdue, and if someone reserved it, notify and mark reserved. `Catalog.search(by title/author/subject)`.

**Step 4 — The graded decision: state and where rules live.** Make `BookItem`'s state transitions explicit (available → loaned → reserved → available). Put business rules in the right place: borrow limits and durations belong in a policy, not hardcoded — `LendingPolicy` (a regular member vs a teacher gets different limits/durations). Fine calculation goes in a `FineStrategy` (per-day, capped). Don't scatter these into `Member`.

**Step 5 — Extensibility and trade-offs.** Adding e-books = a `BookItem` subtype (no physical copy, can be lent concurrently), which may force abstracting away the "limited copies" assumption. Multiple branches = a `Library` owner on `BookItem` + inter-branch transfers. Trade-off: splitting `Book` from `BookItem` is wordier up front but correct — otherwise "3 copies of the same book" can't even be expressed.

**Key points:**
- Core modeling move: separate `Book` (title, one) from `BookItem` (physical copy, many) — the most common graded point.
- `Loan`/`Reservation`/`Fine` are their own classes carrying records and rules.
- Borrow limits/durations in a `LendingPolicy`, fines in a `FineStrategy` — configurable, not hardcoded.
- `BookItem` state machine: available → loaned → reserved → available.
- E-books/multi-branch extend the copy model smoothly — validating the initial split.
