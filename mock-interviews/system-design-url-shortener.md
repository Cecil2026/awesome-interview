# Mock Interview: Design a URL Shortener (TinyURL / bit.ly)

**Type:** System Design
**Difficulty:** L4
**Duration:** 45-60 minutes (simulated)
**Tags:** #system-design, #scalability, #caching, #database-sharding, #base62

## Setup

The candidate is interviewing for a Senior Software Engineer (L4) role at a large consumer internet company. The interviewer is a Staff Engineer on the platform team. The prompt was shared at the start of the round with no advance prep. A shared virtual whiteboard is open. The candidate has a glass of water and a notebook; the interviewer has a stack of follow-up questions but is mostly improvising.

## Transcript

**INTERVIEWER:** Alright, thanks for joining. I'd like you to design a URL shortener — something like TinyURL or bit.ly. Take it wherever you want. I'll interrupt with questions as we go.

**CANDIDATE:** Sounds good. Before I jump in, can I take a few minutes to clarify the scope?

**INTERVIEWER:** Please.

**CANDIDATE:** Okay, so at a high level, users submit a long URL and we give back a short one. When someone hits the short URL, we redirect them to the original. That's the core. Do you want me to also cover analytics, custom aliases, expiration, user accounts?

**INTERVIEWER:** Let's say: redirect is the must-have, custom aliases are a nice-to-have, basic click analytics is a stretch goal. No user accounts for now — assume anonymous or API-key-based usage.

**CANDIDATE:** Got it. And what's the scale we're targeting? Like, are we a small startup or are we replacing bit.ly?

**INTERVIEWER:** Assume we're at bit.ly scale. Make reasonable estimates.

**CANDIDATE:** Okay. Let me back-of-envelope this. *(starts writing on whiteboard)* Public numbers for bit.ly are a few hundred million new links per month and around 10 billion clicks per month. So roughly: 100M writes a month is about 40 writes per second average. Reads — 10B a month is around 4000 per second average. With a 10x peak factor, call it 400 writes/sec and 40K reads/sec at peak.

**INTERVIEWER:** That read-write ratio seems important. What's it telling you?

**CANDIDATE:** It's about 100 to 1 read-heavy. So my system needs to be aggressively optimized for reads — cache, replicas, CDN if possible. Writes are negligible by comparison; I can centralize them.

**INTERVIEWER:** Good. What about storage?

**CANDIDATE:** If we keep links forever and we're adding 100M a month, that's 1.2B a year. Each row maybe 500 bytes — short code, long URL, created_at, owner_id, optional expiry. So roughly 600 GB per year. After five years, 3 TB. Manageable, but I'll want to think about sharding eventually.

**INTERVIEWER:** Good. Latency target?

**CANDIDATE:** For the redirect, I'd aim for p99 under 50ms end-to-end. The redirect is the user-visible critical path — any delay is felt directly.

**INTERVIEWER:** Fine. Anything else before you start designing?

**CANDIDATE:** One more: short code length. We have ~10^11 possible base62 codes at 6 characters, ~10^12 at 7. With 1.2B links a year and a 5-year horizon, 6 chars is borderline; 7 chars gives us headroom. I'll target 7.

**INTERVIEWER:** Why base62 specifically?

**CANDIDATE:** Base62 — a through z, A through Z, 0 through 9 — is URL-safe without escaping, case-sensitive so we get more density than base36, and avoids confusing characters less than base64 which uses `+` and `/`. Some shorteners go base58 to drop look-alikes like 0/O and 1/l, but base62 is the common choice.

**INTERVIEWER:** Okay, let's move on. Sketch me the API.

**CANDIDATE:** *(writes on whiteboard)*

```
POST /api/v1/shorten
  body: { "long_url": "https://...", "custom_alias": "optional", "expires_at": "optional" }
  returns: { "short_url": "https://tny.co/aB3xQ7p", "code": "aB3xQ7p" }

GET /{code}
  -> 301 or 302 redirect to long URL

GET /api/v1/links/{code}/stats   (stretch)
  returns: { "clicks": 1234, "created_at": "...", "long_url": "..." }
```

**INTERVIEWER:** 301 or 302?

**CANDIDATE:** *(pauses)* It depends. 301 is permanent — browsers cache it aggressively, which is great for our load but terrible if we want click analytics, because subsequent clicks bypass our server. 302 is temporary — every click hits us, so we can count it, but we lose the caching benefit.

**INTERVIEWER:** What would you pick?

**CANDIDATE:** For a URL shortener I'd default to 302. The analytics value is real, and the per-click overhead is manageable. If a customer doesn't need analytics, we could offer a 301 mode as an upgrade.

**INTERVIEWER:** Reasonable. Keep going.

**CANDIDATE:** Now the data model. The core table is straightforward.

```
links (
  code VARCHAR(10) PRIMARY KEY,
  long_url TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NULL,
  owner_id BIGINT NULL,
  is_custom BOOLEAN DEFAULT FALSE
)
```

For analytics, a separate table or stream:

```
clicks (
  code VARCHAR(10),
  clicked_at TIMESTAMP,
  ip_hash VARCHAR(64),
  referrer TEXT,
  user_agent_class VARCHAR(32)
)
```

**INTERVIEWER:** Why is `code` the primary key and not an auto-increment ID?

**CANDIDATE:** Because the lookup path is always by code. Making it the PK gives us a clustered index for free in most databases. There's no other access pattern that needs a separate ID — we never list links by "the 5000th link created."

**INTERVIEWER:** What if you wanted analytics joined back to a user?

**CANDIDATE:** Good point. I'd add `owner_id` as a secondary index, and possibly a separate `user_links` table if a user has lots of links. But the hot path — redirect — only needs the code lookup.

**INTERVIEWER:** Okay. SQL or NoSQL?

**CANDIDATE:** I'd start with SQL — Postgres, say. The data is small per row, structured, and the access patterns are simple. We don't need NoSQL's flexibility, and we benefit from transactions when we're checking for code collisions on custom aliases.

**INTERVIEWER:** What if I told you reads were 100K per second instead of 40K?

**CANDIDATE:** SQL is still fine — Postgres with read replicas and a Redis cache in front can easily do 100K reads per second. The bottleneck isn't the database engine, it's whether we hit disk. If 95% of reads hit the cache, the DB sees maybe 5K rps, which is trivial.

**INTERVIEWER:** Walk me through how a code gets generated. This is where it gets interesting.

**CANDIDATE:** Sure. Two main approaches. First: hash the long URL with MD5 or SHA-256, take the first N bytes, base62-encode them. Second: maintain a global counter, increment on each new link, base62-encode the counter value.

**INTERVIEWER:** Which do you prefer?

**CANDIDATE:** Hashing has the nice property that the same URL always produces the same code, so dedup is free. But you have collisions — even MD5 truncated to 7 base62 chars has meaningful collision probability at scale. So you need collision handling: if `links[code]` exists and the long_url differs, you have to rehash with a salt or fall back to another scheme.

**INTERVIEWER:** Okay, so hashing.

**CANDIDATE:** Yeah, I'd go with hash-then-check. Compute MD5, take the leading 42 bits, base62 it, do an `INSERT ... ON CONFLICT` and detect collision. If conflict and the existing long_url matches, return the existing code; if conflict and the URL differs, append a counter or random nonce and retry.

**INTERVIEWER:** *(scribbles)* Let me push on that. What's the worst case for retries?

**CANDIDATE:** At 7 base62 chars we have 3.5 trillion codes. With 6 billion links over five years, we're using 0.17% of the space. By birthday-paradox math, collisions become noticeable above a few percent fill, so retries should be rare — well under 1%.

**INTERVIEWER:** Hmm. But every write has to do a read to check for collision. And every retry is another read. Doesn't that hurt write throughput?

**CANDIDATE:** *(pauses)* That's fair. At 400 writes/sec it's not a problem, but it's an extra round trip. The cleaner approach might be the counter scheme — guarantees uniqueness, no read on the critical path.

**INTERVIEWER:** Tell me more about that.

**CANDIDATE:** Maintain a monotonic counter. On each write, fetch-and-increment, base62-encode the counter value, that's your code. No collisions possible by construction.

**INTERVIEWER:** What's the downside?

**CANDIDATE:** Three issues. One, the counter is a global resource — if it lives in one DB it's a write bottleneck. Two, sequential codes are guessable — anyone can iterate through links. Three, you lose URL-level dedup; the same URL submitted twice gets two different codes.

**INTERVIEWER:** How would you solve the bottleneck?

**CANDIDATE:** Hand out ranges. Each app server requests a block of, say, 10,000 counter values from a central allocator, then assigns them locally. The allocator only sees one request per 10K links. You can also shard the allocator — for example, have 16 allocators, each owning counters where `id mod 16 == allocator_id`.

**INTERVIEWER:** What about the guessability?

**CANDIDATE:** Two options. Apply a reversible bijection over the counter space before encoding — something like a Feistel cipher or simple multiplicative scramble. Codes look random but each one still maps 1:1 to a counter. Or accept it; for non-sensitive links, guessability is a feature, not a bug — short codes are inherently public.

**INTERVIEWER:** And the dedup loss?

**CANDIDATE:** I'd add a secondary index on the long URL — `UNIQUE (url_hash)` where `url_hash` is the SHA-256 of the normalized URL. On write, first check that index; if it exists, return the existing code. So we get dedup back, at the cost of one extra lookup, which is cacheable.

**INTERVIEWER:** And the dedup index — what's the key?

**CANDIDATE:** SHA-256 of the normalized long URL. Normalization is its own can of worms: lowercase the scheme and host, strip default ports, sort query parameters, decode unreserved percent-escapes, drop fragments, punycode for internationalized domains. Different normalization choices produce different dedup behavior, so we'd pick a convention and stick to it.

**INTERVIEWER:** Do you treat `?utm_source=foo` as the same URL as the bare version?

**CANDIDATE:** Usually no — marketing teams care about UTM parameters as distinct destinations. We'd preserve them by default. If a user wants aggressive dedup they could opt in via a parameter on the shorten call.

**INTERVIEWER:** Good pivot. Okay, sketch the high-level architecture.

**CANDIDATE:** *(starts drawing)*

```
[Clients]
   |
   v
[DNS / Anycast]
   |
   v
[L7 Load Balancer]    <- TLS termination, rate limiting
   |
   v
[App Servers (stateless)]
   |     \
   |      \-> [Counter Allocator Service]
   v
[Redis Cache]   <- code -> long_url
   |
   v
[Postgres Primary] -> [Read Replicas]
   |
   v
[Kafka] -> [Click Aggregator] -> [Analytics Store: ClickHouse]
```

The redirect path is: LB -> app server -> Redis -> 302. Cache miss falls through to a read replica.

**INTERVIEWER:** Tell me about the cache.

**CANDIDATE:** Redis cluster, key is the code, value is the long URL. TTL maybe 24 hours, with a stampede protection — singleflight or a probabilistic early-refresh.

**INTERVIEWER:** Why 24 hours specifically?

**CANDIDATE:** It's a balance. Longer TTLs improve hit rate but waste memory on cold keys. Shorter TTLs free memory faster but cause more cache misses. 24 hours roughly matches the half-life of a typical shared link — most click traffic happens within the first day. We'd tune this with real data once we had it.

**INTERVIEWER:** Hit rate?

**CANDIDATE:** URL traffic is power-law distributed — a small fraction of links account for most clicks. With a few hundred GB of Redis I'd expect 95-99% hit rate after warm-up.

**INTERVIEWER:** Where does that estimate come from?

**CANDIDATE:** Rough mental model. If the top 1% of links drive 80% of clicks — typical power-law shape — then caching just the top 1% of our 6B links is 60M entries. At ~200 bytes each in Redis with overhead, that's 12 GB, easily fits in one node. Caching the top 10% catches more of the long tail; that's 120 GB across the cluster.

**INTERVIEWER:** What about cold links? Old ones that haven't been seen.

**CANDIDATE:** They fall through to the DB. Latency goes from sub-millisecond to maybe 5ms — still well within our 50ms budget.

**INTERVIEWER:** Eviction policy?

**CANDIDATE:** LRU or LFU. I'd lean LFU because URL traffic is heavily skewed — once a link goes viral, it stays hot for a while; we want to retain those even if some random fresh link is more recently accessed. Redis supports both via `maxmemory-policy`.

**INTERVIEWER:** *(scribbles)* Okay, let's go deep on one thing. Let's say the DB has 10 billion rows. How do you keep redirects fast?

**CANDIDATE:** *(thinks for a moment)* Three layers. First, the cache absorbs the hot tail — that's our 95%+ hit rate. Second, the DB itself: with a clustered index on the code, lookups are essentially log(N) plus disk seek. For 10B rows that's about 33 index levels, but the top of the B-tree is cached in memory, so we're paying maybe one disk seek per lookup.

**INTERVIEWER:** Per lookup is still a lot if you have 40K reads per second.

**CANDIDATE:** Right, but most of those are cache hits. The DB sees the cache-miss residual — say 5%, which is 2000 reads/sec. A single Postgres node with SSDs can handle that comfortably.

**INTERVIEWER:** What if you couldn't fit the index in memory?

**CANDIDATE:** Then I'd shard. Partition by code — take a hash of the code modulo the shard count, so each shard owns a disjoint subset. Each shard has its own index, fits in memory, and reads are parallelized across shards. Application-level routing knows which shard owns which code.

**INTERVIEWER:** Why hash the code instead of range-partitioning?

**CANDIDATE:** Range partitioning by code would create hot spots. Newly created codes tend to be more popular than old ones, so the "newest" shard gets disproportionate traffic. Hashing spreads writes and reads uniformly across all shards. Range partitioning makes sense when range queries dominate — that's not our access pattern.

**INTERVIEWER:** How do you pick the shard count?

**CANDIDATE:** Capacity-driven. If I want each shard's working set under, say, 50 GB of index, and the whole index is 2 TB, I need 40 shards. Round up to 64 to leave headroom and to make the modulo math friendly.

**INTERVIEWER:** What about resharding?

**CANDIDATE:** Avoid it if possible — that's why I'd start with 64 even though I only need 40 today. If we do need to grow, consistent hashing or a virtual-shard layer makes it less painful. We map each code to a virtual shard (say 1024 buckets), and each physical shard owns a range of virtual shards. To grow, you split virtual shards across new physical nodes.

**INTERVIEWER:** Walk me through the migration when you split a virtual shard.

**CANDIDATE:** Copy phase: read all rows from the source virtual shard, write to the destination. Catch-up phase: stream incremental changes via logical replication or a CDC tool — Debezium or similar. Cutover: pause writes briefly for that virtual shard — milliseconds — flip the routing table, resume. Total user impact is a sub-second blip for traffic to that shard. We'd do this during low-traffic windows and one virtual shard at a time.

**INTERVIEWER:** What if you can't pause writes?

**CANDIDATE:** Double-write phase: writes go to both old and new shards during cutover; reads go to old until you flip. Then reads flip to new, and after a verification window, stop writing to old. Slower migration, zero pause. Standard online-schema-change pattern.

**INTERVIEWER:** And the choice between sync and async — how would you make it?

**CANDIDATE:** Async unless the business explicitly wants stronger guarantees. URL shortener writes are not money — losing a few seconds of writes during a regional failover is acceptable. The latency cost of sync replication isn't worth it for this workload.

**INTERVIEWER:** Good. Now let's go even deeper. Walk me through a single redirect end-to-end. I want microseconds.

**CANDIDATE:** *(pulls up a fresh whiteboard)*

```
Client sends GET /aB3xQ7p
  -> Anycast routes to nearest PoP                              ~5-30ms (network)
  -> L7 LB terminates TLS                                       ~1-2ms
  -> Forwards to app server (HTTP keepalive within DC)          ~0.5ms
  -> App server: parse path, extract code                       ~0.05ms
  -> Redis GET aB3xQ7p (over local network)                     ~0.5ms
  -> Cache hit: parse long URL                                  ~0.01ms
  -> Emit click event to Kafka (fire-and-forget, batched)       ~0.1ms
  -> Return 302 with Location header                            ~0.05ms
  -> Network back to client                                      ~5-30ms

Total server time: ~1-3ms
Total wall clock: ~15-65ms (mostly network)
```

So our p99 budget of 50ms is comfortable as long as the cache hits and we don't synchronously wait on Kafka.

**INTERVIEWER:** What if Kafka is down?

**CANDIDATE:** The click event should be fire-and-forget on the redirect path. If Kafka is unreachable, we buffer in memory and drop the oldest if the buffer fills. The redirect itself never blocks on analytics — analytics is best-effort.

**INTERVIEWER:** What if Redis is down?

**CANDIDATE:** Fall through to the DB. Latency goes up — maybe 5-10ms added per request, and the DB capacity becomes the bottleneck. We'd need a circuit breaker or a slow path that limits concurrent DB queries to avoid stampeding.

**INTERVIEWER:** Show me the stampede problem.

**CANDIDATE:** Sure. If a hot key expires from Redis and 10,000 requests hit at once, they all see a miss and all hit the DB simultaneously. The DB chokes, latency spikes, retries cascade.

**INTERVIEWER:** How do you fix it?

**CANDIDATE:** Singleflight on the app server — coalesce concurrent misses for the same key into a single DB query. Or probabilistic early expiration — a small fraction of clients refresh the cache slightly before TTL, so by the time TTL hits, most clients already have a fresh value. Or use Redis's `SETNX` to elect one client to refresh while others serve stale.

**INTERVIEWER:** What if a key is hot enough that even a local cache lookup is the bottleneck?

**CANDIDATE:** At that point we're talking 50K+ rps to a single server's loopback. Hot-key replication kicks in: serve the same content from N replicas, with the load balancer round-robining. We're effectively horizontally scaling that single URL. The CDN approach also helps because edge nodes terminate the request entirely without touching origin.

**INTERVIEWER:** Could you ever go cache-only for very hot keys?

**CANDIDATE:** Yes — pin them. If a code is on our "always-hot" list, we never evict it from any layer. Updates to those entries are pushed proactively. We'd flag links from accounts above a certain tier or links that have crossed a viral threshold.

**INTERVIEWER:** Good. Let's switch gears. How do you handle writes?

**CANDIDATE:** Write path: client POSTs to `/api/v1/shorten` with a long URL. The app server validates it — schema check, blocklist for malware/phishing domains, length check. Then it computes a normalized URL hash, checks the dedup index. If a code already exists, return it. Otherwise, request a counter from the allocator, base62-encode, INSERT into the primary DB.

**INTERVIEWER:** Order of operations for the counter — what if the counter is incremented but the INSERT fails?

**CANDIDATE:** You leak a code. That's fine — the code space is huge, leaks don't matter. The important guarantee is "no duplicates," not "no skips."

**INTERVIEWER:** What if the INSERT succeeds but the response to the client is lost?

**CANDIDATE:** Client retries. The retry comes in with the same long URL; the dedup index sees the existing row and returns the same code. So retries are idempotent at the URL level. For absolute safety we could have the client send an idempotency key in the request header, and we cache the response keyed by that for, say, 24 hours.

**INTERVIEWER:** Like Stripe's idempotency keys.

**CANDIDATE:** Exactly. Standard pattern. Costs us a Redis entry per write, which is small.

**INTERVIEWER:** Okay. What about the allocator? You mentioned ranges. What happens if an app server gets a range of 10K and then crashes?

**CANDIDATE:** Same thing — we leak the unused codes in that range. Not a problem at our scale. If we wanted to be tidy, the allocator could track outstanding ranges and reclaim them after a long timeout, but it's not worth the complexity.

**INTERVIEWER:** Tell me about the allocator's own consistency. What if there are two allocator instances and they hand out overlapping ranges?

**CANDIDATE:** That would be a bug. The allocator needs to be strongly consistent on counter increments. Options: a single instance with a hot standby, or back it with a strongly consistent store — etcd, ZooKeeper, or a row in Postgres updated with `SELECT ... FOR UPDATE`. I'd lean on Postgres since we already have it; the contention is low because each request is for a 10K-sized range.

**INTERVIEWER:** What's the failure mode if the Postgres row becomes a bottleneck?

**CANDIDATE:** It shouldn't at our scale. 400 writes/sec ÷ 10K block size = one allocator request every 25 seconds. Even at 10x traffic, it's one request every 2.5 seconds — a single row lock for milliseconds is fine. If we ever did saturate, we'd shard the counter space as I mentioned, or move to a system like Snowflake-style ID generation where each node embeds its own machine ID and a per-node sequence.

**INTERVIEWER:** Snowflake IDs are 64-bit though. How do they fit in our 7-char base62 space?

**CANDIDATE:** They don't directly — Snowflake IDs are too big. But we could borrow the pattern at smaller scale: 42 bits of counter space split into, say, 8 bits of machine ID and 34 bits of per-machine sequence. 2^34 is ~17 billion codes per machine, plenty. The trade-off is base62 encoding is now per-machine rather than monotonic globally, but monotonicity isn't a requirement.

**INTERVIEWER:** How do you shard the allocator if one DB row becomes contended?

**CANDIDATE:** 16 logical counter spaces, each with its own row. Each space allocates codes where `code mod 16 == space_id`. Encode the space ID into the high bits of the counter before base62 conversion, so codes from different spaces don't collide.

**INTERVIEWER:** Good. Custom aliases — how do those interact?

**CANDIDATE:** Custom aliases are user-chosen, so they sit outside the counter scheme. On a custom-alias request, we INSERT with the user's chosen code; if there's a conflict, return an error. The `is_custom` flag distinguishes them. We also need to reserve a namespace so custom aliases can't collide with counter-generated codes — for example, custom aliases must be at least 8 chars or start with a specific prefix.

**INTERVIEWER:** What if a custom alias is "google" — a common word?

**CANDIDATE:** *(laughs)* First come first served, in the simplest case. In practice you'd have a blocklist of high-value words and reserve them for premium customers, plus a profanity filter, plus a trademark dispute process. That's a product question more than a system design one, but you'd want hooks for it.

**INTERVIEWER:** Fair. Let's talk about consistency. If I create a link on the primary, can I redirect using it immediately from a replica?

**CANDIDATE:** Replication lag is typically tens of milliseconds with async replication. There's a small window where a new code exists on the primary but not yet on replicas. Two ways to handle: route writes-then-reads to the primary for a short window per user, or read-your-writes via session token. Most users won't notice — the gap is measured in tens of ms.

**INTERVIEWER:** What about the cache? You just wrote a new code; can you read it immediately?

**CANDIDATE:** The simplest thing is to populate the cache on write — write-through. After the INSERT succeeds, set the code in Redis with TTL. Then the first read hits the cache directly.

**INTERVIEWER:** Is there a risk if the cache write succeeds but the DB write rolls back?

**CANDIDATE:** Yes — you'd have a phantom entry in the cache. Mitigation: write to the DB first, then cache. If the cache write fails after a successful DB write, you've degraded to cache-aside — next read misses and refreshes. The reverse — cache first, then DB — is the dangerous direction.

**INTERVIEWER:** And the analytics counter?

**CANDIDATE:** That's eventually consistent on purpose. Click events go to Kafka, are aggregated by a stream processor — Flink or a custom consumer — and rolled up into ClickHouse on a one-minute or five-minute basis. Users see slightly stale counts; that's standard for analytics dashboards.

**INTERVIEWER:** What if a malicious user wants to inflate their click count?

**CANDIDATE:** Rate-limit per IP, deduplicate clicks from the same IP within a short window, optionally require a CAPTCHA-protected referrer for "verified" counts. Bot detection is its own problem; you'd want a downstream classifier. For the system design, just note we have an extension point.

**INTERVIEWER:** What about distinguishing clicks from prefetches? Browsers and link unfurlers fetch your URL just to preview it.

**CANDIDATE:** Good point. The simplest signal is the User-Agent — Slack's unfurler, Twitter's card fetcher, Facebook's preview bot all identify themselves. We tag those clicks with a `is_bot` flag and roll them up into a separate "previews" counter, not the user-facing click count. For unknown UAs that look bot-like — high RPS from one IP, no referrer, HEAD requests — we'd classify heuristically.

**INTERVIEWER:** What about HEAD vs GET?

**CANDIDATE:** Many unfurlers use HEAD to fetch just the headers. We can respond to HEAD with the 302 just like GET, but flag it as a non-click. The Location header still gets the recipient where they want to go if they end up doing a GET.

**INTERVIEWER:** And the click pipeline itself — what's its capacity?

**CANDIDATE:** 40K events per second peak, average payload maybe 200 bytes — 8 MB/sec of ingest. Kafka handles that on a single partition without breathing hard, but I'd partition by code to enable parallel consumption. Eight partitions gives us headroom for 10x growth.

**INTERVIEWER:** Why partition by code and not, say, by timestamp?

**CANDIDATE:** Because downstream aggregation rolls up per-code stats. If we partitioned by timestamp, every consumer would see events for every code, and we'd need cross-partition coordination to aggregate. Partitioning by code means each partition's consumer maintains its own slice of aggregates with no coordination.

**INTERVIEWER:** *(checks clock)* Okay. Failure scenarios. Walk me through what happens if the primary DB falls over.

**CANDIDATE:** Writes go down until failover completes. Reads continue to be served from replicas and cache. Once a replica is promoted to primary — automated via Patroni or similar — writes resume. The whole window should be under a minute for a managed Postgres.

**INTERVIEWER:** What's the user impact?

**CANDIDATE:** Existing redirects: zero, since reads are served from cache and replicas. New shortens: fail with 503 during the failover window. The client should retry with backoff. We could buffer write requests in a queue, but that adds eventual-consistency surprises.

**INTERVIEWER:** What if a whole region is down?

**CANDIDATE:** Multi-region active-active is hard with a single global counter, but achievable. Two approaches. One: per-region counter spaces, so each region allocates its own codes from a disjoint subset of the counter range. Two: full read replication globally, but writes go to a primary region; on primary-region failure, promote a secondary region.

**INTERVIEWER:** What's the RPO and RTO for the second approach?

**CANDIDATE:** RTO — recovery time — depends on how quickly your failover automation can promote a secondary. With Patroni or similar, well-tested, it can be sub-minute. RPO — data loss — depends on replication mode. Async replication means you can lose up to the replication lag, which between regions is hundreds of ms; that's tens to hundreds of writes at our scale. Sync replication zeros the RPO but adds the round-trip to every write, which would push write latency from milliseconds to hundreds of ms.

**INTERVIEWER:** Which would you pick?

**CANDIDATE:** Per-region counter spaces. It gives us write-local-read-anywhere with no cross-region writes on the hot path. The cost is more operational complexity — each region needs its own allocator, and we need to merge analytics across regions. But the latency win is significant for global users.

**INTERVIEWER:** Good. Let's talk about that latency win — how does global read work?

**CANDIDATE:** Each region has its own Postgres replica set, fed by async replication from the primary regions. Caches are local to each region. The redirect goes to the nearest region via anycast or geo-DNS. So a user in Tokyo hits Tokyo's LB, Tokyo's cache, Tokyo's replica — never crosses the Pacific.

**INTERVIEWER:** What's the replication lag between regions?

**CANDIDATE:** Inter-region replication is typically 100-500ms. For URL shortening that's fine — a user who creates a link in São Paulo and shares it on Twitter; the recipient in Mumbai might miss the first second of replication, but by the time the tweet is read, the link has propagated. We could also write-through the cache globally for the first few seconds after creation to mask the lag.

**INTERVIEWER:** *(scribbles)* I want to push on one more thing. Hot keys. What if a single short URL goes viral and gets 100K rps?

**CANDIDATE:** Single Redis key, single shard. Hot-key problem. Several mitigations: replicate hot keys across multiple Redis nodes and have the app server randomly pick one; or push the hot value into the app server's local memory with a short TTL — say 1 second — so most requests don't even hit Redis; or offload to a CDN with edge caching, since the response is just a 302 with a Location header.

**INTERVIEWER:** How do you detect a hot key in the first place?

**CANDIDATE:** Sampling. Each app server tracks a count-min sketch of accessed codes; periodically — every few seconds — it emits the top-K. A central aggregator merges the sketches and identifies keys above a threshold, then triggers the hot-key path: pin to local cache, replicate across Redis nodes, or push to the CDN. The detection-to-mitigation loop is sub-second in a well-tuned system.

**INTERVIEWER:** Count-min sketch — why not just a hash map?

**CANDIDATE:** Memory. With 100M codes per server, a full hash map is huge. A count-min sketch trades exact counts for bounded memory — a few MB gives you approximate frequencies with controllable error. For hot-key detection we only care about the top of the distribution, where the sketch is accurate.

**INTERVIEWER:** Would a CDN work for a 302 redirect?

**CANDIDATE:** CDNs can cache 302s if you set Cache-Control headers — most modern CDNs support it. The downside is you lose per-click analytics for cached requests. For very hot links you'd accept that trade-off, or sample analytics at the edge.

**INTERVIEWER:** Local app-server cache — wouldn't that have consistency issues if the URL changes?

**CANDIDATE:** Short codes are immutable by design — once issued, the long URL never changes. So local caching is safe; the only invalidation is deletion (link expiry or takedown), and we can broadcast invalidations on a Redis pub/sub channel. Local cache TTL of a few seconds means worst case a deleted link is served for a few extra seconds.

**INTERVIEWER:** Wait, are short codes really immutable? What about expiry?

**CANDIDATE:** Expiry is a soft delete — the code still exists, but we return a "this link has expired" page instead of redirecting. For checks, we can include `expires_at` in the cached value and let the app server compare to wall clock, so expiry doesn't require a cache invalidation.

**INTERVIEWER:** Good catch. Okay, one last area. Security. What's the threat model?

**CANDIDATE:** Few things to defend against. One: malicious long URLs — malware, phishing. Defense: integrate with Google Safe Browsing or similar; reject or warn before redirecting. Two: open redirect abuse — attackers use our shortener to disguise malicious URLs in phishing emails. Same defense plus reputation-based throttling on shorten requests. Three: enumeration — someone iterates short codes to harvest URLs. Defense: rate-limit per IP, use scrambled counters, and consider not exposing custom analytics endpoints publicly. Four: brute-force on custom alias creation — rate limit and CAPTCHA.

**INTERVIEWER:** What about TLS, secrets, all that?

**CANDIDATE:** TLS terminated at the LB, internal traffic optionally mTLS. Secrets for the allocator and DB in a secret manager — Vault or cloud equivalent. No long-lived credentials on app servers; use short-lived tokens.

**INTERVIEWER:** What about logging? Could the access log itself leak URLs?

**CANDIDATE:** Yes — every redirect logs the code, which is fine; but if we ever logged the long URL (say, in a debug branch), that's a privacy leak. Long URLs can contain session tokens, password reset links, or other sensitive paths. Policy: never log decoded long URLs at INFO level. If we need to log for debugging, hash them or truncate aggressively.

**INTERVIEWER:** Have you thought about GDPR-style deletion?

**CANDIDATE:** Yes. If a user has an account and requests deletion, we need to scrub their owner_id from the links table and the analytics events. For analytics, we'd use a delete-by-owner_id job over Kafka and ClickHouse. The shortened URL itself can stay — it's not personal data in isolation — but the association to the user is removed.

**INTERVIEWER:** What about rate limiting the shorten endpoint?

**CANDIDATE:** Token bucket per API key, plus a global cap per IP for unauthenticated traffic. The shorten endpoint is the abuse-prone one; we'd tier it — anonymous users get 100/day, authenticated get 10K/day, paid get unlimited within fair-use. Rate-limit state in Redis with atomic INCR + EXPIRE.

**INTERVIEWER:** Okay. *(checks notes)* We have about five minutes. If you had more time, what would you add?

**CANDIDATE:** A few things. *(thinks)* One: a real abuse-detection pipeline — ML model on shorten patterns to catch phishing rings before they go viral. Two: a tiered service — free users get a 7-char counter code with shared rate limits; paid users get short codes from a reserved namespace, custom domains, and SLA-backed analytics. Three: link versioning — the ability to update a long URL after issuance, for marketing campaigns. That breaks the immutability assumption but is a customer request. We'd need to add cache invalidation and probably bump the local-cache TTL down.

**INTERVIEWER:** What's the trickiest part of link versioning?

**CANDIDATE:** Cache invalidation across regions. Once we allow mutability, every layer that caches has to be invalidated, and we're back to the cache-coherence problem. The simplest solution is to make the new long URL effective with a brief delay — like, "this update will take effect within 30 seconds" — and rely on TTL expiry rather than active invalidation.

**INTERVIEWER:** Could you do explicit invalidation instead?

**CANDIDATE:** You could. Push an invalidation message on a pub/sub bus — Redis pub/sub or Kafka — and every cache subscriber drops the key. Works for Redis and for local app-server caches. The hard part is making it reliable: if a subscriber misses the message, it serves a stale value. So you'd combine pub/sub with a short TTL as a fallback.

**INTERVIEWER:** What's the cost of a short TTL?

**CANDIDATE:** Higher cache-miss rate, more load on the DB. If we drop from 24h to, say, 5 minutes, our hit rate falls noticeably for long-tail content. So link versioning has a real cost — it's not free. We'd probably gate it behind a paid tier and document the trade-off.

**INTERVIEWER:** Okay. Anything else you wish you'd had time for?

**CANDIDATE:** I'd want to spend more time on the analytics pipeline — there's a lot of structure in how you'd model funnels, geographic breakdowns, referrer chains. And I haven't talked at all about deployment, monitoring, capacity planning. Those are usually a whole other interview.

**INTERVIEWER:** One last question. If you had to pick the single biggest risk in this design, what would it be?

**CANDIDATE:** *(thinks)* The counter allocator. It's a single point of contention and a coordination dependency on the write path. If it has a bad day — slow Postgres row, lock contention, allocator service blip — every write is affected. It's well-mitigated with ranges and sharding, but it's still the spot I'd watch most carefully in production.

**INTERVIEWER:** How would you monitor it?

**CANDIDATE:** Allocator request latency p50/p99, range exhaustion rate, time-to-allocate-new-range, allocator availability. Page on p99 above some threshold or any availability blip. Plus chaos test it — kill the allocator periodically in staging and verify app servers degrade gracefully by serving from their existing ranges.

**INTERVIEWER:** Fair. Alright, that's time. Good work.

**CANDIDATE:** Thanks. That was fun.

## What went well

- Strong clarifying-questions phase up front — read/write ratio, latency budget, code length all locked down before diving in.
- Pivoted cleanly from hash-based codes to counter-based when pushed on the read-on-write cost. Acknowledged trade-offs of each approach instead of insisting the first answer was right.
- Used concrete numbers throughout: 400 writes/sec, 40K reads/sec, 95% cache hit rate, 64 shards. Numbers ground a design and signal experience.
- Smooth handling of follow-ups on hot keys, stampedes, and multi-region. Demonstrated familiarity with the canonical patterns without sounding rote.
- Explicitly considered failure modes (Kafka down, Redis down, DB primary down, whole region down) without being prompted on every one.

## What could've been stronger

- Counter allocator was hand-waved a bit; could have drawn out exactly how a range request and crash look on the wire.
- Didn't initially mention the dedup index when proposing the counter scheme — only added it after the interviewer probed dedup loss. Better to anticipate the trade-off.
- The 301 vs 302 trade-off was correct but could have framed it more sharply as a business decision (analytics revenue vs serving cost).
- Custom alias namespace collision was solved on the fly; a stronger candidate would have raised it earlier as a known issue.
- Briefly tripped on the "code immutability" question — recovered well, but it suggested the candidate hadn't thought through expiry semantics fully.

## Key takeaways

- For high-read systems, the cache hit rate dominates everything. Design around 95%+ and the rest of the architecture follows.
- Base62 + 7 characters gives ~3.5 trillion codes — more than enough for any realistic scale. Don't pick 5 or 6 chars without doing the math.
- Counter-based code generation is simpler than hash-based at scale, but bring a dedup index if URL deduplication is a feature.
- Multi-region active-active is achievable for read-heavy workloads via per-region counter spaces — keep writes local and tolerate brief cross-region replication lag.
- Always explicitly handle the "what if X is down" question for each component. Failure modes are where junior candidates lose points.

## Reference architecture

```
                          +----------------------+
                          |  Clients / Browsers  |
                          +----------+-----------+
                                     |
                              Anycast DNS
                                     |
                +--------------------+--------------------+
                |                                         |
         +------v------+                          +-------v------+
         |  Region A   |                          |   Region B   |
         |  (us-east)  |                          |  (eu-west)   |
         +-------------+                          +--------------+
                |                                         |
        +-------v-------+                         +-------v-------+
        |  L7 Load Bal  |                         |  L7 Load Bal  |
        |  TLS, rate-lim|                         |  TLS, rate-lim|
        +-------+-------+                         +-------+-------+
                |                                         |
        +-------v-------+                         +-------v-------+
        | App Servers   |                         | App Servers   |
        | (stateless)   |                         | (stateless)   |
        +---+-------+---+                         +---+-------+---+
            |       |                                 |       |
            |       +-----> Counter Allocator        |       +-----> Counter Allocator
            |               (counter space A)         |               (counter space B)
            |                                         |
    +-------v-------+                         +-------v-------+
    |  Redis Cluster|                         |  Redis Cluster|
    |  (code -> URL)|                         |  (code -> URL)|
    +-------+-------+                         +-------+-------+
            |                                         |
    +-------v-------+                         +-------v-------+
    | Postgres      |                         | Postgres      |
    | Primary +     | <----- async repl ----> | Primary +     |
    | Read Replicas |                         | Read Replicas |
    | (64 shards)   |                         | (64 shards)   |
    +-------+-------+                         +-------+-------+
            |                                         |
            +-----> Kafka (clicks) -----> Flink -----> ClickHouse
                                                       (analytics)
```

Hot path latency (cache hit): ~1-3ms server time, ~15-65ms wall clock.
Cold path (cache miss): +5-10ms for DB read replica lookup.
Cache hit rate target: 95%+, achieved via power-law traffic skew and LFU eviction.
Shard count: 64 (~50GB working set each at current scale, with headroom).
Region failover: automated via Patroni, sub-minute RTO.
