# Mock Interview: Design a Distributed Rate Limiter

**Type:** System Design
**Difficulty:** L4 / L5
**Duration:** 45-60 minutes (simulated)
**Tags:** #system-design, #api-gateway, #redis, #token-bucket, #sliding-window

## Setup

The candidate is interviewing for a Senior/Staff engineering role on an API platform team. The interviewer is an L6 who owns the company's API gateway. The prompt is to design a distributed rate limiter that sits in front of the company's public APIs. The candidate has 50 minutes; the interviewer plans to spend the last 5-10 minutes on a deep-dive into the chosen algorithm and a discussion about what breaks at very high scale.

## Transcript

**INTERVIEWER:** I'd like you to design a rate limiter — distributed, sits at the API gateway layer, protecting backend services from overload and enforcing per-customer quotas. Take it where you want.

**CANDIDATE:** Got it. Let me clarify what we're building. By "rate limiter," do you mean a single component, or are we designing the entire API gateway around it?

**INTERVIEWER:** The rate limiter as a component, plus how it integrates with the gateway. Not the whole gateway, but enough to show how requests flow through.

**CANDIDATE:** And by "per-customer quotas" — what's the granularity? Per API key, per IP, per user, per endpoint?

**INTERVIEWER:** All of the above, configurable per rule. Customers should be able to define multiple rate limits — for example, "100 requests per second per IP, 10K per day per API key, 5 per second per IP per /login endpoint."

**CANDIDATE:** Okay. So it's a rules engine on top of a counting system. What about the scale?

**INTERVIEWER:** Aggregate traffic through the gateway: a few hundred thousand requests per second, peak around a million. Tens of thousands of customers, each with maybe 10 rules on average.

**CANDIDATE:** And the latency budget?

**INTERVIEWER:** This is the critical question. The rate limiter is on every request's critical path. We need single-digit milliseconds added latency, ideally under 2ms p99.

**CANDIDATE:** Tight. *(thinks)* Okay. What happens on a rate-limit violation?

**INTERVIEWER:** Return HTTP 429 Too Many Requests with a Retry-After header. Optionally include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers on all responses.

**CANDIDATE:** And the consistency requirement — if a customer has a limit of 100/sec, is it okay to let through 105 occasionally, or must it be exact?

**INTERVIEWER:** Some over-shoot is acceptable — call it within 5%. The point is to protect downstreams from overload, not to bill exactly. Hard enforcement is more important for paid quota tiers but even there a small buffer is okay.

**CANDIDATE:** That changes the design quite a bit — it means we can use eventually consistent counters in some cases. Good. Any other requirements? Auditing, debugging, dynamic config updates?

**INTERVIEWER:** Dynamic config: yes, customers update rules via an admin API and the change should take effect within a minute. Audit log of decisions: nice to have for the top 1% of customers or violations, not for every request. Debugging: customers should be able to see their current consumption.

**CANDIDATE:** Got it. Let me think about the algorithms first, then the architecture.

**INTERVIEWER:** Go.

**CANDIDATE:** Four classic rate-limit algorithms: fixed window, sliding window log, sliding window counter, token bucket. Let me sketch the trade-offs.

*(writes on whiteboard)*

```
Fixed window:        Count requests in each [now / window] bucket.
                     Simple. Boundary problem: 2x burst at window edge.

Sliding window log:  Store timestamp of every request in last N seconds.
                     Exact. Expensive: O(requests) memory and writes.

Sliding window cntr: Weight current and previous fixed windows by
                     elapsed-time fraction. Approximate but cheap.
                     Memory: 2 counters per rule.

Token bucket:        Tokens accrue at rate R, capacity B. Each request
                     consumes 1. Allows bursts up to B; throttles to R
                     long-term. State: (tokens, last_refill_time).
```

**INTERVIEWER:** Which would you pick?

**CANDIDATE:** Token bucket as the default. It gives the best UX — short bursts are fine, sustained over-rate throttles — which is what customers actually expect. Sliding window counter is a fine alternative if we want strict "no more than X per window."

**INTERVIEWER:** Why not fixed window?

**CANDIDATE:** The boundary problem. If a customer has 100/min, they could send 100 at 11:59:59 and another 100 at 12:00:01 — that's 200 requests in 2 seconds, technically within limit by the algorithm but a real overload. Sliding window or token bucket smoothes this.

**INTERVIEWER:** Sliding window log — when would you use it?

**CANDIDATE:** Low-rate, high-precision rules. Like "5 password resets per hour per account" — there the per-event audit log is itself useful, and the storage cost is trivial.

**INTERVIEWER:** Good. Show me the token bucket math.

**CANDIDATE:** Per-rule state: `(tokens: float, last_refill_ts: timestamp)`. On request:

```
now = current_time()
elapsed = now - last_refill_ts
tokens = min(capacity, tokens + elapsed * refill_rate)
if tokens >= 1:
    tokens -= 1
    last_refill_ts = now
    ALLOW
else:
    DENY (return Retry-After = (1 - tokens) / refill_rate)
```

The key insight: we don't run a background timer to add tokens. We compute the lazy refill at request time. State is two numbers per rule.

**INTERVIEWER:** Where does that state live?

**CANDIDATE:** This is the central question. Options. One: in-memory on each gateway node. Fast but inaccurate when traffic spreads across many gateways. Two: a centralized store like Redis. Consistent but adds latency and a single point. Three: hybrid — local cache with periodic sync.

**INTERVIEWER:** Let me push you to commit. What would you start with?

**CANDIDATE:** Redis-backed. Most workloads can tolerate the 0.5-1ms Redis round trip, and Redis can comfortably handle hundreds of thousands of ops per second. If we hit Redis's ceiling we'd add the local-cache layer; we wouldn't start with the complexity.

**INTERVIEWER:** Walk me through a request.

**CANDIDATE:** *(draws)*

```
Client request
   |
   v
[L4 LB]
   |
   v
[API Gateway Node]
   |
   |--> Identify principal (API key, IP, user_id)
   |--> Look up applicable rules (cached in node memory)
   |--> For each rule:
   |       LUA script in Redis:
   |         GET (tokens, last_refill_ts)
   |         compute new tokens
   |         IF allow: tokens -= 1, SET, return ALLOW
   |         ELSE: SET (no decrement), return DENY
   |--> If any rule denies: return 429
   |--> Else: forward to backend
   |
   v
[Backend]
```

**INTERVIEWER:** Why Lua script and not pipelined GET + SET?

**CANDIDATE:** Atomicity. The read-modify-write must be a single atomic operation, otherwise two concurrent requests both see the same tokens, both decrement, and we under-charge. Lua runs server-side in Redis and is single-threaded with respect to other commands on the same key.

**INTERVIEWER:** What about Redis cluster — does that affect the Lua approach?

**CANDIDATE:** All keys touched in one Lua script must be on the same Redis slot. We make sure each script touches one rate-limit key. If a customer has multiple rules, each is a separate script invocation, possibly to different shards. We'd pipeline them to minimize round trips.

**INTERVIEWER:** How many round trips per request in the worst case?

**CANDIDATE:** One per rule. Average 10 rules per customer, so up to 10 Redis ops per request. At 1 million rps, that's 10M Redis ops/sec — distributed across the Redis cluster, it's high but workable.

**INTERVIEWER:** Is that latency budget okay?

**CANDIDATE:** Pipelined within one round trip if all rules are on the same shard, the total is ~1ms. If they hit different shards, we issue in parallel and wait for the slowest, still ~1ms. Both within our 2ms budget.

**INTERVIEWER:** What if Redis is slow or down?

**CANDIDATE:** Fail-open vs fail-closed is the choice. Fail-open: if Redis is unavailable, the gateway lets the request through. Risk: backends get hammered during a Redis outage. Fail-closed: deny all requests. Risk: a Redis outage takes the whole API down.

**INTERVIEWER:** Which?

**CANDIDATE:** Fail-open is the typical default for rate limiters, because the failure mode of fail-closed is catastrophic — a Redis blip takes everything offline. But we'd combine it with a local fallback: each gateway maintains a coarse-grained local rate-limit using just its own observed traffic. So during a Redis outage, we're not unprotected, just less accurate.

**INTERVIEWER:** Tell me more about the local fallback.

**CANDIDATE:** Each gateway runs an in-process token bucket per (principal, rule). The local rate is scaled to assume the request is spread across N gateways — so if the global limit is 1000/sec and we have 10 gateways, each gateway permits 100/sec locally. During a Redis outage, we use the local limits as a hard cap. Some overshoot if traffic is unevenly distributed across gateways, but no full collapse.

**INTERVIEWER:** What if a customer is hitting only one gateway because of sticky routing?

**CANDIDATE:** Then their local limit is 100/sec instead of 1000/sec — we're throttling them more than we should. They get 429s during the outage. Trade-off we accept for Redis-down robustness. We can also pre-distribute "share quotas" based on observed historical distribution.

**INTERVIEWER:** Good. Let's talk about the rules engine. How do rules get loaded?

**CANDIDATE:** Customers define rules via an admin API. Rules are stored in a config database — Postgres. The gateway periodically polls the config service for changes (every few seconds), or subscribes to a change stream.

**INTERVIEWER:** Polling at scale — every gateway polling every few seconds is hammering the config service?

**CANDIDATE:** Yes — for 1000 gateways polling every 5 seconds, that's 200 rps to config, manageable but wasteful. Better: a config push service. Gateways open a streaming connection to the config service; new rules are pushed. Or use a pub/sub like Kafka or NATS for config events.

**INTERVIEWER:** Pull vs push — which is more resilient?

**CANDIDATE:** Pull is more resilient because the gateway is the active party — if the connection breaks, it just polls again. Push requires connection management and reconnect logic. I'd build push for efficiency but with a pull fallback that runs every few minutes to catch missed updates.

**INTERVIEWER:** Where do rules live on the gateway?

**CANDIDATE:** In-memory data structure, indexed for fast lookup by principal. When a request arrives, we identify the principal (API key, IP, user_id from JWT) and look up the matching rules. Lookup must be sub-microsecond.

**INTERVIEWER:** How do you handle rule changes mid-flight?

**CANDIDATE:** Atomic swap. Rules are immutable snapshots; on update, the gateway builds a new snapshot and atomically swaps the pointer. In-flight requests use whichever version was current when they started. Standard read-copy-update pattern.

**INTERVIEWER:** Good. Let me push on the Redis key design. What's the key for a rule?

**CANDIDATE:** Something like `rl:{principal}:{rule_id}` — for example, `rl:apikey-abc123:per-second-100`. The principal scopes the counter; the rule_id distinguishes multiple rules on the same principal.

**INTERVIEWER:** What's the value?

**CANDIDATE:** A small struct: tokens and last_refill_ts. Stored as either a serialized form or two separate Redis keys. I'd use a Redis hash: `HMSET key tokens ts`. Then the Lua script does HGET, computes, HMSET.

**INTERVIEWER:** What's the TTL?

**CANDIDATE:** Set TTL longer than the bucket's refill time. For a 100/sec rule, after a few seconds of inactivity the bucket is full anyway, so the state is reconstructible. We can set TTL to, say, 10 minutes; after that the key vanishes and the next request starts with a full bucket.

**INTERVIEWER:** What's the storage footprint?

**CANDIDATE:** Per active rule: ~100 bytes including Redis overhead. With 10K customers * 10 rules each = 100K active keys, that's 10MB. Negligible. Even with per-IP rules at higher cardinality — say a million active IPs — it's 100MB. One Redis node holds it comfortably.

**INTERVIEWER:** What about TTL on rules that change?

**CANDIDATE:** If a customer updates a rule's capacity or refill rate, the running token bucket state in Redis is now associated with the old rule semantics. We have a few options. Cleanest: include the rule version in the key — `rl:apikey-abc:rule-7:v3`. On rule update, version bumps, the old key naturally expires. State resets to a fresh bucket, which is the right thing because the new rule has different parameters.

**INTERVIEWER:** Doesn't that cause a brief over-allow window because the bucket is full immediately on version bump?

**CANDIDATE:** Yes — for one bucket-refill cycle. Mitigation: initialize the new bucket with the old bucket's remaining capacity (scaled to the new capacity) on first access. Adds a tiny bit of complexity but smooths the transition.

**INTERVIEWER:** What about scaling Redis itself?

**CANDIDATE:** Redis Cluster shards keys by hash. With 100K rps on rate-limit ops and a single Redis node handling ~100K ops/sec, we'd want at least 3-5 shards for headroom. At 1M rps and 10 ops per request, 10M Redis ops/sec — that's 100+ shards.

**INTERVIEWER:** That's a lot of Redis. Any way to reduce load?

**CANDIDATE:** Yes — local approximation with periodic reconciliation. Each gateway holds a local token bucket; on request, decrement locally. Every N requests or every T ms, sync the local consumption to Redis. The global state lags, but for most workloads the lag is acceptable. Lets us amortize Redis hits.

**INTERVIEWER:** Tell me more — what's the protocol?

**CANDIDATE:** Each gateway tracks `(local_consumed, last_sync_time)` per (principal, rule). On every Nth request or every T ms, the gateway calls Redis with the batched consumption: DECRBY by the batched count, get the new global remaining. If remaining is negative or low, reduce or stop the local quota until the next sync. Otherwise replenish the local quota for the next interval.

**INTERVIEWER:** What's the trade-off?

**CANDIDATE:** Less accuracy. If a customer goes from 0 to 1000 rps suddenly, the local bucket might allow some bursts before sync catches up. Overshoot proportional to the sync interval. For a 1-second sync interval and 1000 rps limit, worst-case overshoot is 1000 requests. That's a 100% overshoot — not great. So this technique works better for high-rate limits and isn't ideal for tight quotas.

**INTERVIEWER:** When would you use it then?

**CANDIDATE:** For coarse limits — like "per-hour 1M requests" — where the sync interval is small relative to the window. Or for IP-based DDoS protection where exact precision matters less than aggregate throughput protection.

**INTERVIEWER:** Okay. Let's switch and go deep on sliding window counter, since I want to make sure you understand the trade-offs.

**CANDIDATE:** Sure. The algorithm: maintain two counters — current window and previous window — both at fixed boundaries (e.g., per-minute). On request at time t, compute:

```
weight = (window_size - elapsed_in_current) / window_size
estimated_count = previous_count * weight + current_count
if estimated_count < limit:
    current_count += 1
    ALLOW
else:
    DENY
```

It approximates a sliding window by weighting the previous window's count by how much of it overlaps with the actual sliding window ending at "now."

**INTERVIEWER:** Why is it an approximation?

**CANDIDATE:** Because we don't know when within the previous window the requests came. We assume uniform distribution, which is rarely true. If all of the previous window's requests came near the end, the actual current load is higher than the estimate, and we under-throttle. Conversely if they came at the start, we over-throttle.

**INTERVIEWER:** How bad is the error?

**CANDIDATE:** Bounded by the previous window's count. Worst case ~50% off in either direction for highly bursty traffic, but in practice the error is small. For most workloads it's a great approximation with 2 counters per rule.

**INTERVIEWER:** When would you pick sliding window over token bucket?

**CANDIDATE:** When customers think in "X per minute" terms and we want to enforce that closely. Token bucket allows initial bursts up to capacity B; sliding window doesn't.

**INTERVIEWER:** What if you want both — burst tolerance AND a strict window limit?

**CANDIDATE:** Multiple rules. Customer has a token bucket rule (refill 100/sec, capacity 200) for burst tolerance, AND a sliding window rule (10K per minute) for window cap. Both must allow; either denies, request is rejected.

**INTERVIEWER:** Good. *(scribbles)* Now let's talk about edge cases. What about clock skew between gateway nodes?

**CANDIDATE:** Each gateway uses its local clock to compute timestamps in the Lua script — wait, no, the script runs in Redis. So Redis's clock is authoritative. As long as Redis is on NTP, clock skew within milliseconds.

**INTERVIEWER:** What if you have multiple Redis shards each with their own clock?

**CANDIDATE:** Each shard owns its keys; rules on different shards have independent clocks. NTP keeps them within a few ms, which is within our acceptable accuracy. We don't need cross-shard time coordination.

**INTERVIEWER:** What if a Redis node has clock jump — NTP correction?

**CANDIDATE:** A backward jump would let some requests through that shouldn't, briefly. A forward jump might erroneously refill buckets. Both are transient. We'd monitor for clock anomalies and alert. In Lua, we could read `TIME` from Redis itself, which is the most consistent within a shard.

**INTERVIEWER:** Good. What about a customer with billions of distinct IPs — like a DDoS attack from a botnet?

**CANDIDATE:** Per-IP rules at that scale explode Redis state. Each IP is a key with some overhead. Defense: cap the cardinality. If a rule is per-IP, we hash IPs into a bounded set of buckets — say 100K — and rate-limit per bucket. This loses per-IP fairness but bounds memory and protects against state explosion attacks.

**INTERVIEWER:** Doesn't that hurt legitimate users sharing a bucket with attackers?

**CANDIDATE:** Yes, it's a trade-off. Better defenses against DDoS are upstream — a CDN, a WAF, or an ML-based bot detector before the rate limiter. The rate limiter alone shouldn't be the front line against DDoS; it's protecting backends from logical overuse, not adversarial floods.

**INTERVIEWER:** Where would the WAF fit in your architecture?

**CANDIDATE:** *(draws)*

```
[CDN / Anycast]
   |
   v
[L4 LB]
   |
   v
[WAF / DDoS protection]   <-- IP reputation, signature detection, CAPTCHA
   |
   v
[L7 LB]
   |
   v
[API Gateway + Rate Limiter]
   |
   v
[Backend]
```

The WAF drops obvious bad traffic. The rate limiter handles per-customer quota enforcement.

**INTERVIEWER:** Good. *(checks clock)* Let's think about observability. What metrics do you expose?

**CANDIDATE:** Per-rule: requests allowed, requests denied, current consumption, refill rate. Per-customer: total requests, total denials, top rules by consumption. Gateway-wide: Redis latency p50/p99, Lua script execution time, local-fallback activation rate.

**INTERVIEWER:** What about per-customer visibility?

**CANDIDATE:** Customers see their own consumption via an admin API or dashboard. The data comes from the same Redis state (or a snapshot of it) — we can expose `current_tokens / capacity` per rule as a percentage.

**INTERVIEWER:** What about response headers — do you set X-RateLimit-Remaining on every response?

**CANDIDATE:** Yes — but we read it from the same Lua script that did the check, so no extra round trip. The Lua script returns `(allowed, remaining, reset_time)` in one call. The gateway just copies those into headers. Costs nothing extra and clients can self-throttle.

**INTERVIEWER:** What about debugging — a customer says "I'm getting 429s but I'm under my limit." How do you investigate?

**CANDIDATE:** Log a sample of denials with the rule that triggered, the principal, the current bucket state. Sampling rather than every denial — 1% sample or always-log for top customers. With the log, you can reconstruct what happened. We'd also expose a debug endpoint: "for this principal, show me the state of all matching rules right now."

**INTERVIEWER:** Where do those denial logs go?

**CANDIDATE:** Kafka -> a query-friendly store like ClickHouse or Elasticsearch. Indexed by (principal, rule, time) for fast lookup. Retention 30 days or so, depending on storage budget.

**INTERVIEWER:** *(scribbles)* Let me probe one more thing. You said 1ms p99 latency. What gets you there?

**CANDIDATE:** A few things. One: Redis must be on the same network as the gateway — same DC, ideally same rack. Round trip is 0.2-0.5ms. Two: pipelining when multiple rules apply. Three: Lua script keeps the read-modify-write atomic so we don't pay for OPTIMISTIC retries on contention. Four: local fallback amortization to reduce Redis calls for high-rate principals.

**INTERVIEWER:** And p99 specifically — what causes the tail?

**CANDIDATE:** Redis GC pauses, network jitter, Lua script contention on a hot key, occasional Redis cluster slot migrations. The fattest tail risk is hot-key contention — if one customer is sending so many requests that their bucket key becomes a hot Lua-script target, Redis serializes them and latency rises.

**INTERVIEWER:** How do you handle that?

**CANDIDATE:** Split the hot key across multiple shards: instead of one key for a customer's rule, hash the request into one of K sub-keys. Each sub-key holds 1/K of the quota. The customer sees a slightly different rate-limiting behavior (fairness across the K shards), but no single key is a bottleneck.

**INTERVIEWER:** Is that an automatic thing or manual?

**CANDIDATE:** Automatic for customers above a traffic threshold. We monitor per-key request rate; when a key exceeds, say, 10K rps, we promote it to sharded. The customer doesn't need to know — the gateway abstracts it.

**INTERVIEWER:** What about distributed quota across data centers?

**CANDIDATE:** Cross-DC rate limits are hard because the round trip between DCs is too slow for the per-request critical path. Two approaches. One: per-DC quotas (split the global limit across DCs) — simpler but unfair if traffic is unevenly distributed. Two: eventually consistent global counter with local approximation — each DC enforces a local cap based on its share, periodically reconciles with the others.

**INTERVIEWER:** Which?

**CANDIDATE:** Per-DC quotas as the default; switch to global eventual consistency only for high-tier customers who care. Global consistency adds complexity and lag; most customers' rate limits are coarse enough that per-DC splits are fine.

**INTERVIEWER:** What if a DC is down — does the customer get their quota share back?

**CANDIDATE:** Yes — a coordinator (or the customer's admin interface) reassigns the quotas. If DC-A is down and held 30% of the customer's quota, that 30% should flow to the remaining DCs. We'd have a control plane that watches DC health and rebalances quotas.

**INTERVIEWER:** And during a partition where DCs can't reach each other but are both up?

**CANDIDATE:** Each DC continues with its existing share. The total served could exceed the global quota during the partition, since both DCs are running independently and assuming the others are healthy. Acceptable in the short term; once the partition heals, the control plane reconciles and may temporarily reduce shares to compensate.

**INTERVIEWER:** Good. Let me push you to think about misuse. How could a customer game the system?

**CANDIDATE:** *(thinks)* A few ways. One: distributing their traffic to land on multiple gateways during a Redis outage, exceeding the per-gateway local fallback by a lot. Mitigation: the local fallback shouldn't be too lax — fail-open with a hard cap, not unbounded. Two: if we batch local consumption sync, sending a huge burst can land before sync catches up. Mitigation: bounded local buffer — once local consumed exceeds the gateway's share, deny locally without waiting for Redis.

**INTERVIEWER:** Anything else?

**CANDIDATE:** A more subtle one: if customers can configure rules, a malicious customer might define a rule with very low cost — like "100 trillion requests per hour" — effectively disabling rate limiting. Mitigation: tier-based rule configuration, with hard maximums per tier.

**INTERVIEWER:** And on the IP side?

**CANDIDATE:** IP spoofing on TCP isn't really possible without controlling the network path, but rotating IPs from cloud providers is trivial. So per-IP limits should aggregate to per-/24 or per-/16 for cloud ranges. We maintain a list of known cloud ranges and apply broader aggregation there. Bare IP rate-limiting is mostly effective against single-machine misuse, not distributed misuse.

**INTERVIEWER:** *(checks clock)* Last topic. What would you add if you had more time?

**CANDIDATE:** Several things. *(thinks)* One: smarter algorithms — adaptive rate limiting that ramps up when downstream services are healthy and ramps down when they're under load. We'd integrate with backend health signals. Two: cost-based rate limiting — different endpoints have different costs (a search query is expensive, a health check is cheap), so we'd charge "weight" per request rather than just count.

**INTERVIEWER:** Tell me more about cost-based.

**CANDIDATE:** Each endpoint has a configured cost; the rate limiter deducts that cost from the bucket. So a search query might cost 10 tokens, a simple GET might cost 1. Bucket capacity and refill rate are expressed in tokens. Customers' quotas are denominated in tokens, not requests. Works naturally with the existing token-bucket implementation — just change "decrement by 1" to "decrement by cost."

**INTERVIEWER:** What's the third thing?

**CANDIDATE:** A self-service rule playground — customers can test "what if I had this rule?" against their actual recent traffic to see how many requests would be denied. Helps them tune limits without rolling out and breaking production.

**INTERVIEWER:** Good. Anything else you wish you had time for?

**CANDIDATE:** I'd want to talk about queue-based rate limiting versus the reject-with-429 model. Some workloads prefer queueing (with a max queue length and timeout) rather than outright denial — it smooths bursts at the cost of latency. That's a different shape of the same problem and worth modeling.

**INTERVIEWER:** Alright, that's a wrap. Good run.

**CANDIDATE:** Thanks. Rate limiters are sneakily deep — every conversation finds new edge cases.

## What went well

- Clear, methodical algorithm comparison up front. Sketched all four classic algorithms with trade-offs before committing — that demonstrates breadth.
- Picked token bucket as the default with sound reasoning, then handled the follow-up on when sliding window or sliding-window-log would be better.
- Strong on the atomicity discussion — reached for Lua scripting on Redis immediately and explained why pipelined GET+SET is wrong.
- Local-fallback discussion was nuanced: fail-open with bounded local caps, not unbounded — caught the obvious anti-pattern.
- Recognized the hot-key problem and proposed key-splitting as the mitigation.
- Cost-based rate limiting was a clean extension at the end — shows the candidate understands how to compose primitives.

## What could've been stronger

- Was a bit slow to bring up cross-DC concerns; the interviewer had to prompt for it.
- Local-cache with periodic sync was correctly identified as imprecise but could have been more crisp about exactly when to use it — only mentioned high-rate / coarse limits after follow-up.
- DDoS mitigation was hand-waved at the WAF — could have shown more depth on what the rate limiter itself can do (per-/16 aggregation, exponentially-weighted moving averages, CAPTCHA escalation).
- Didn't explicitly call out the operational concern of Lua script deployment — script changes on Redis are subtle.
- Sliding window counter math was correct but the explanation of the error bound was a bit fuzzy.

## Key takeaways

- For most workloads, token bucket is the right default — it accommodates bursts naturally and is cheap to maintain.
- Atomicity matters. Read-modify-write must be a single atomic operation; on Redis that means Lua scripts (or Redis 7+ functions).
- Fail-open with bounded local fallback. A pure fail-open (no protection during Redis outage) lets backends drown; pure fail-closed lets a Redis blip take down the whole API.
- Hot keys are the main p99 risk. Detect with sampling, mitigate by splitting the key across shards.
- Cross-DC rate limiting is best avoided on the hot path. Use per-DC quotas with central rebalancing on DC failure.
- Cost-based rate limiting is a small extension of token bucket that gives much richer semantics — recommend it for any platform with heterogeneous endpoint cost.

## Reference architecture

```
                          +-------------------------+
                          |        Clients          |
                          +-----------+-------------+
                                      |
                                  Anycast
                                      |
                          +-----------v-------------+
                          |          CDN            |
                          +-----------+-------------+
                                      |
                          +-----------v-------------+
                          |     WAF / DDoS Prot     |
                          +-----------+-------------+
                                      |
                          +-----------v-------------+
                          |          L7 LB          |
                          +-----------+-------------+
                                      |
                +---------------------+----------------------+
                |                                            |
        +-------v---------+                          +-------v---------+
        |  Gateway Node 1 |                          |  Gateway Node N |
        |                 |                          |                 |
        |  Rules cache    |  <----config push--->    |  Rules cache    |
        |  Local fallback |                          |  Local fallback |
        |  buckets        |                          |  buckets        |
        +-------+---------+                          +-------+---------+
                |                                            |
                +-------------------+------------------------+
                                    |
                                    v
                          +---------+----------+
                          |   Redis Cluster    |
                          |   (sharded)        |
                          |                    |
                          |   Lua scripts:     |
                          |   token_bucket     |
                          |   sliding_window   |
                          +---------+----------+
                                    |
                                    v
                          +---------+----------+
                          |   Config Service   |
                          |    (Postgres +     |
                          |   push/pull API)   |
                          +--------------------+

                          [Observability]
                          - Denials sampled to Kafka -> ClickHouse
                          - Metrics to Prometheus
                          - Per-customer dashboards
```

Key numbers:
- 1M rps peak across the gateway tier
- 10 rules per request average -> 10M Redis ops/sec
- ~100 Redis cluster shards for headroom
- p99 added latency target: <2ms
- Local fallback kicks in on Redis unavailability with bounded per-gateway caps

Algorithm choices:
- Default: token bucket (lazy refill, 2 numbers per key)
- Strict windows: sliding window counter (2 counters per key, ~5% error)
- Audit-critical low-rate: sliding window log
- Cost-aware: token bucket with weighted decrement

Failure handling:
- Redis down: fail-open with bounded local fallback per gateway
- Gateway down: traffic shifts to other gateways via LB
- DC down: control plane redistributes per-DC quotas to surviving DCs
