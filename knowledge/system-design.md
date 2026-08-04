# System Design (Scenario Walkthroughs)

Classic "design X" interview scenarios, worked end-to-end: requirements, capacity, API, data model, and the two or three decisions the interviewer actually scores. This is a starter set — a small, high-quality sample meant to grow. It complements [architecture.md](architecture.md), which covers the underlying patterns (CQRS, event-driven, consistency models) in isolation.

Each entry carries `**Difficulty:**` and `**Topics:**` metadata so the picker can filter and weight it like the company banks.

---

### 1. Design a URL shortener (TinyURL / bit.ly)

**Difficulty:** Medium
**Topics:** system-design, hashing, caching, sharding, read-heavy

**Answer:** Scope it first: create a short code for a long URL, redirect on lookup, ~100:1 read/write ratio, codes never expire (or TTL optional), analytics out of scope for v1. Capacity: 100M new URLs/day ≈ 1.2k writes/s, ~120k reads/s at 100:1 — this is a read-heavy, low-write system, so optimize the redirect path. Key generation is the central decision: (a) hash the URL (MD5/SHA) and take the first 7 base62 chars — collisions need a check-and-retry; (b) a distributed counter (or a range-leased ID service) base62-encoded — no collisions, but sequential codes are guessable and leak volume. A hybrid — counter feeding base62 with a per-shard offset — avoids both hot-counter contention and guessability. Storage is a simple KV: `code -> {long_url, created_at, owner}`; at 100M/day you need sharding by code hash. The redirect must be fast: put codes behind a cache (Redis/CDN) with a very high hit rate since the head of the distribution is tiny; a 301 is cacheable by the browser but hides analytics, so use 302 if you want per-hit counting. Guard the write path against duplicate submissions (idempotency on the long URL) and abusive shorteners (rate limit + malware/URL blocklist).

**Key points:**
- Read-heavy: cache/CDN the redirect, size the write path for far less traffic.
- Key generation is the real question — counter (no collisions, guessable) vs hash (collisions, opaque); know the tradeoff.
- 7 base62 chars = 62^7 ≈ 3.5 trillion codes — justify the length from capacity, don't guess.
- 301 (cacheable, loses analytics) vs 302 (per-hit counting) is a deliberate choice.

---

### 2. Design a social news feed (Twitter / Facebook timeline)

**Difficulty:** Hard
**Topics:** system-design, fan-out, caching, sharding, consistency

**Answer:** The core tension is fan-out-on-write (push) vs fan-out-on-read (pull). Push: when a user posts, write the post ID into every follower's precomputed feed list (in Redis). Reads are then O(1) — just read your list — which is great because reads dominate. But a celebrity with 100M followers triggers 100M writes per tweet (the "hot user" / thundering-herd problem) and wastes storage on inactive followers. Pull: store posts per author; at read time, gather the latest from everyone you follow and merge by time. Cheap writes, but expensive, high-latency reads that hammer the DB. The production answer is hybrid: push for normal users, pull for celebrities — a follower's feed is (their precomputed push feed) merged at read time with (recent posts from the handful of celebrities they follow). Data model: posts sharded by post ID (or author), a follower/following graph, and per-user feed caches. Ranking (chronological vs ML-scored) sits on top of retrieval. Feeds are eventually consistent — a new post appearing a few seconds late is fine, so you can lean on async fan-out workers and accept lag.

**Key points:**
- Name both strategies and the celebrity problem that forces the hybrid.
- Push = fast reads / expensive celebrity writes; pull = cheap writes / expensive reads.
- Reads dominate, so precompute; feeds tolerate eventual consistency, so fan out async.
- Separate retrieval (get candidate posts) from ranking (order them) — they scale differently.

---

### 3. Design a rate limiter

**Difficulty:** Medium
**Topics:** system-design, rate-limiting, concurrency, caching, distributed-systems

**Answer:** Clarify: per-user or per-IP? Where does it run — client, gateway, or per-service? What's the limit (e.g., 100 req/min) and what happens on breach (429 + `Retry-After`, or queue)? Algorithm choice is the meat: fixed window (a counter per time bucket) is trivial but allows 2× bursts at the boundary; sliding window log (store each request timestamp) is exact but memory-heavy; sliding window counter (weighted blend of current and previous window) is the common compromise; token bucket (tokens refill at a steady rate, each request spends one) naturally allows controlled bursts and is the usual default; leaky bucket smooths output to a fixed rate. In a distributed deployment the counter must be shared, so keep it in Redis and make the check-and-decrement atomic (a Lua script or `INCR` with expiry) to avoid races across gateway nodes; otherwise two nodes each admit a request that together breach the limit. Watch for the hot-key problem on a single popular user — shard or use local approximate counters with periodic reconciliation. Fail open or closed? For availability, usually fail open (allow traffic if the limiter is down) unless the endpoint is security-sensitive.

**Key points:**
- Token bucket is the sensible default (steady refill + controlled bursts); know why fixed-window bursts at boundaries.
- Distributed correctness needs an atomic check-and-decrement (Redis Lua / INCR+EXPIRE), not read-then-write.
- Return 429 with `Retry-After`; decide fail-open vs fail-closed explicitly.
- Hot keys on popular users need sharding or local approximate counters.

---

### 4. Design a distributed key-value store (Dynamo-style)

**Difficulty:** Hard
**Topics:** system-design, distributed-systems, consistency, replication, sharding

**Answer:** Requirements: get/put by key, horizontal scale, high availability, tunable consistency. Partitioning: consistent hashing places keys on a ring so adding/removing nodes moves only ~1/N of keys; virtual nodes even out load and hotspots. Replication: each key is written to the next N nodes clockwise on the ring (the preference list), skipping duplicates across physical hosts/racks. Consistency is tunable via quorums: with N replicas, choose R (read) and W (write) so that R + W > N gives read-your-writes consistency, while smaller R/W trade consistency for latency/availability (this is the CAP knob — Dynamo picks AP with eventual consistency). Concurrent writes to the same key create conflicts; resolve with vector clocks (detect causality, surface siblings to the app) or last-write-wins (simpler, can lose data). Failure handling: hinted handoff lets a healthy node temporarily accept writes for a down peer, replaying them on recovery; anti-entropy with Merkle trees efficiently re-syncs divergent replicas by comparing hashes top-down. Membership and failure detection use a gossip protocol so there's no central coordinator.

**Key points:**
- Consistent hashing + virtual nodes for partitioning and minimal reshuffling.
- R + W > N is the quorum rule for strong-ish reads; smaller values buy availability (CAP tradeoff).
- Conflict resolution: vector clocks (causal, keeps siblings) vs last-write-wins (lossy, simple).
- Hinted handoff + Merkle-tree anti-entropy + gossip = availability without a coordinator.

---

### 5. Design a messaging / chat system (WhatsApp, Messenger)

**Difficulty:** Hard
**Topics:** system-design, websockets, message-queue, consistency, fan-out

**Answer:** Requirements: 1:1 and group chat, online/offline delivery, delivery + read receipts, ordering within a conversation, media attachments. Connection layer: clients hold a persistent connection (WebSocket / long-poll) to a stateful gateway; a session registry (who's connected to which gateway) lets you route a message to the recipient's gateway. When the recipient is offline, persist to a per-user message store/queue and deliver on reconnect (plus a push notification). Ordering: assign a per-conversation sequence number (or a logical clock) so clients can order and detect gaps, rather than relying on wall-clock time across servers. Delivery semantics: at-least-once with client-side dedup by message ID gives the "sent → delivered → read" tick states; store acks to drive receipts. Group chat is fan-out: for small groups, write to each member's queue; for large groups, a shared per-group log that members read from scales better. Data model: messages sharded by conversation ID keeps a conversation's history co-located. Media goes to blob storage/CDN with the message carrying only a URL. Scale the stateless routing logic horizontally; the stateful piece is the connection gateways and the session registry.

**Key points:**
- Persistent connections + a session registry to route to the right gateway; offline → store-and-forward + push.
- Per-conversation sequence numbers for ordering and gap detection, not server clocks.
- At-least-once + dedup by message ID; acks drive delivered/read receipts.
- Shard by conversation ID; media to CDN by reference, not inline.

---

### 6. Design a web crawler

**Difficulty:** Medium
**Topics:** system-design, distributed-systems, message-queue, bloom-filter, politeness

**Answer:** Requirements: crawl billions of pages, extract links, refresh periodically, respect politeness (robots.txt, per-host rate limits), avoid traps. Core loop: a URL frontier (a set of queues) feeds fetcher workers → parse/extract → dedup → enqueue new URLs. The frontier is the interesting part: it must enforce politeness (don't hammer one host — partition queues by host so each host is served by one worker at a controlled rate) and priority (crawl important/fresh pages first). Deduplication at scale: you can't keep a hash set of billions of URLs in memory, so use a Bloom filter (fast, small, tolerates false positives that merely skip a few pages) backed by a persistent store for the truth. Content dedup (same page at different URLs) uses a content hash / simhash for near-duplicates. Politeness: cache and honor robots.txt per host, add crawl delays, and detect spider traps (infinite calendars, session-ID URLs) with depth/pattern limits. Freshness: re-crawl frequency adapts to how often a page actually changes. Everything is distributed and idempotent — a fetched-but-not-processed URL should be safely retryable.

**Key points:**
- The URL frontier encodes both politeness (per-host partitioning + delays) and priority.
- Bloom filter for URL-seen dedup at scale; content hash / simhash for duplicate pages.
- Respect robots.txt and detect traps (infinite/parametrized URLs) with depth limits.
- Idempotent, retryable stages so worker crashes don't corrupt the crawl.

---

### 7. Design a notification service (push / email / SMS fan-out)

**Difficulty:** Medium
**Topics:** system-design, message-queue, fan-out, idempotency, reliability

**Answer:** Requirements: send notifications across channels (push, email, SMS, in-app), handle high fan-out (a "breaking news" broadcast), respect user preferences and quiet hours, guarantee no duplicate sends. Architecture: producers publish a notification event → a queue/broker → workers that resolve recipients, apply preference/dedup filters, template the message per channel, and hand off to channel-specific providers (APNs/FCM, an email provider, an SMS gateway). Decoupling via a queue absorbs bursts and isolates a slow/failing provider from the rest. Reliability: providers fail and retry, so make sends idempotent — an idempotency key per (user, notification) so retries don't double-send; use a dead-letter queue for messages that exhaust retries. Rate limit per provider (they throttle you) and per user (don't spam). Preferences and templating are a lookup + render step before dispatch. For huge fan-outs, expand the recipient list asynchronously in batches rather than one giant synchronous loop. Track delivery status per channel for observability and receipts.

**Key points:**
- Queue-decoupled workers per channel absorb bursts and isolate provider failures.
- Idempotency key per (user, notification) + DLQ is the "no duplicates, no lost sends" story.
- Apply user preferences, quiet hours, and per-user/per-provider rate limits before dispatch.
- Expand large fan-outs asynchronously in batches, not one synchronous loop.

---

### 8. Design a typeahead / autocomplete service

**Difficulty:** Medium
**Topics:** system-design, trie, caching, read-heavy, ranking

**Answer:** Requirements: suggest top-k completions for a prefix in <100ms, ranked by popularity, updated as trends shift. This is extremely read-heavy with a latency SLO, so precompute. Data structure: a trie where each node stores the top-k most popular completions passing through it, so a lookup is "walk to the prefix node, return its cached top-k" — no per-request ranking. Building/refreshing the trie is an offline batch job over query logs (count query frequencies, propagate top-k up the trie); you rebuild periodically rather than mutating on every keystroke. Serving: the trie is sharded (e.g., by first letters) and heavily cached; the head of the query distribution is tiny and cacheable at the edge. Client side, debounce keystrokes and cache recent results to cut request volume. Handling scale in the ranking data: sample or approximate frequency counts (count-min sketch) rather than exact counts for the long tail. Personalization and typo tolerance (edit-distance / fuzzy matching) are v2 layers on top of the popularity baseline.

**Key points:**
- Precompute top-k at each trie node so serving is a walk + return, not a ranked query.
- Rebuild the trie offline from query-log frequencies on a schedule; don't mutate per keystroke.
- Read-heavy → shard the trie and cache aggressively; debounce on the client.
- Count-min sketch / sampling for long-tail frequency; fuzzy matching and personalization are later layers.

---

### 9. Design a distributed unique ID generator

**Difficulty:** Medium
**Topics:** system-design, distributed-systems, sharding, clock

**Answer:** Requirements: 64-bit IDs, unique across many machines, ideally roughly time-sortable, at high throughput, with no single point of contention. Options: (a) a central auto-increment DB — simple, ordered, but a bottleneck and SPOF; (b) UUIDv4 — trivially distributed and collision-free in practice, but 128-bit and not sortable, which hurts as a DB primary key (random inserts fragment B-trees); (c) DB ticket servers handing out ranges/segments to each node — reduces coordination but still central; (d) Snowflake — the standard interview answer: a 64-bit ID = timestamp (ms since a custom epoch) + machine/worker ID + a per-ms sequence counter. Snowflake gives time-ordered, sortable, coordination-free IDs; each node only needs a unique worker ID (assigned via config or a coordination service like ZooKeeper). The classic failure mode is clock skew / NTP going backwards — if the clock moves back, you can generate duplicates, so you must detect it and either wait or refuse to issue IDs until the clock catches up. Bit allocation (how many bits for timestamp vs machine vs sequence) is a capacity tradeoff you should be able to justify.

**Key points:**
- Snowflake: timestamp + worker ID + sequence in 64 bits — sortable and coordination-free.
- Compare against auto-increment (SPOF/bottleneck) and UUIDv4 (distributed but unsortable, poor PK).
- Clock going backwards is the key failure mode — detect skew and stall rather than duplicate.
- Bit allocation is a deliberate capacity decision (years of timestamps vs #nodes vs IDs/ms).

---

### 10. Design a video streaming platform (YouTube / Netflix)

**Difficulty:** Hard
**Topics:** system-design, cdn, storage, encoding, read-heavy

**Answer:** Split the problem into upload/ingest, storage/processing, and playback — playback is where scale lives. Upload: client uploads the raw file (resumable, chunked) to blob storage; a transcoding pipeline then re-encodes it into multiple resolutions and bitrates (240p→4K) and segments each into small chunks (HLS/DASH), producing a manifest. This adaptive bitrate setup lets the player switch quality per segment based on measured bandwidth, which is the core of smooth playback. Transcoding is embarrassingly parallel — fan out per-segment across a worker fleet driven by a queue. Storage: originals plus every rendition is huge, so tier it (hot renditions on fast storage/CDN, cold originals in cheap object storage). Playback: this is a massive read-heavy, bandwidth-bound problem, so a CDN is non-negotiable — segments are cached at edge PoPs close to users, and only cache misses hit origin. Popular content gets pre-warmed to edges. Metadata (titles, view counts, recommendations) is a separate, comparatively tiny service. View counts and recommendations run as async analytics off the playback path, not synchronously.

**Key points:**
- Adaptive bitrate: transcode to multiple renditions, segment + manifest (HLS/DASH), let the player switch per segment.
- Transcoding is parallel per-segment fan-out via a worker queue.
- Playback is CDN-first — edge-cache segments, pre-warm popular content, origin only on miss.
- Separate the tiny metadata/analytics services from the huge bandwidth-bound video path.
