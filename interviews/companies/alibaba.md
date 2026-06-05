# Alibaba

```yaml
company: Alibaba Group (Taobao, Tmall, Alipay/Ant Group, AliCloud, Cainiao, DingTalk)
typical_rounds: 1 HR screen + 3-5 technical (often tiered by interviewer level: P7 → P8 → P9) + 1 cross-team + HR final
focus_areas: Java middleware (Spring, Dubbo, MyBatis), distributed systems, JVM internals, e-commerce/payment system design
languages_allowed: Java strongly preferred; Go acceptable; some teams use C++
duration: 45-60 min per round
notable_quirks:
  - JVM tuning, GC algorithms, and Java concurrency (synchronized, AQS, CAS) are deep-dive topics
  - Behavioral mapped to 阿里六脉神剑 (Six Values): 客户第一, 团队合作, 拥抱变化, 诚信, 激情, 敬业
  - Architecture rounds often reference Alibaba-built systems (Dubbo, RocketMQ, Sentinel, Nacos, Seata)
  - Higher-level interviewers (P9+) ask philosophical "how would you design Taobao from scratch" questions
  - Some rounds in Mandarin even for English-speaking candidates if the team is mainland-based
sources: 1point3acres, NowCoder (牛客网), LeetCode-cn, Glassdoor
```

## Overview

Alibaba interviews lean heavily on Java backend depth — JVM internals, concurrency primitives, Spring framework internals, and the open-source middleware Alibaba itself contributes (Dubbo for RPC, RocketMQ for messaging, Nacos for config/discovery, Sentinel for flow control, Seata for distributed transactions). System design centers on e-commerce and payment scenarios: flash sales (秒杀), distributed transactions across Taobao + Alipay, and inventory consistency. Behavioral is mapped to the Six Values, particularly Customer First and Embracing Change.

## Questions

### 1. Reverse Nodes in K-Group

**Difficulty:** Hard
**Topics:** linked-list, recursion
**Position:** SWE
**Years:** P5-P6

**Question:** Given a linked list, reverse every k consecutive nodes. If remaining nodes are fewer than k, leave as-is.

**Approach:** Count k nodes ahead; if fewer, return head. Reverse the k nodes iteratively (3-pointer), recurse on the rest, attach. O(n). Edge: k=1 (no-op), k=n (full reverse). Watch off-by-one in the count.

**Tags:** #algorithm

---

### 2. Course Schedule II

**Difficulty:** Medium
**Topics:** graph, topological-sort, bfs
**Position:** SWE
**Years:** P5-P6

**Question:** Given `numCourses` and prerequisite pairs, return an order of courses you should take. Empty if impossible.

**Approach:** Kahn's algorithm (BFS topo sort): build adjacency + in-degrees, queue nodes with in-degree 0, pop and decrement neighbors. If output length < numCourses, cycle exists → return empty. O(V + E).

**Tags:** #algorithm

---

### 3. Longest Substring with At Most K Distinct Characters

**Difficulty:** Medium
**Topics:** sliding-window, hashmap, strings
**Position:** SWE
**Years:** P5-P6

**Question:** Given a string `s` and integer `k`, return the length of the longest substring containing at most `k` distinct characters.

**Approach:** Sliding window with `char -> count` map. Expand right; while map size > k, shrink left, decrementing/removing chars. Track max window length. O(n).

**Tags:** #algorithm

---

### 4. LFU Cache

**Difficulty:** Hard
**Topics:** ood, hashmap, linked-list, design
**Position:** SWE
**Years:** P6-P7

**Question:** Design an LFU (Least Frequently Used) cache with O(1) `get` and `put`. On evict, drop the least frequently used; tie-break by least recently used.

**Approach:** Two hashmaps + many doubly-linked lists. `key -> node`, `freq -> DLL of nodes with that freq`. On access, remove from current freq list, insert at head of (freq+1) list. Track `min_freq`. On evict, remove tail of `min_freq` list. Update `min_freq` when its list empties on increment.

**Tags:** #algorithm

---

### 5. Find Median from Data Stream

**Difficulty:** Hard
**Topics:** heap, design, streaming
**Position:** SWE
**Years:** P6-P7

**Question:** Implement `addNum(int)` and `findMedian()` for a stream of integers.

**Approach:** Max-heap for lower half, min-heap for upper half. Rebalance to keep sizes within 1. Median = top of larger heap, or average of tops. O(log n) add, O(1) find.

**Tags:** #algorithm

---

### 6. Reverse Pairs

**Difficulty:** Hard
**Topics:** merge-sort, bit, divide-and-conquer
**Position:** SWE
**Years:** P7

**Question:** Given an array, count pairs `(i, j)` with `i < j` and `nums[i] > 2 * nums[j]`.

**Approach:** Modified merge sort. During merge, for each `i` in left half, count `j` in right half such that `left[i] > 2 * right[j]` (two-pointer counting before merging). O(n log n). Alternative: BIT/Fenwick tree with coordinate compression.

**Tags:** #algorithm

---

### 7. Implement a Distributed Lock (in Java)

**Difficulty:** Medium
**Topics:** concurrency, redis, distributed-systems
**Position:** SWE
**Years:** P6-P7

**Question:** Implement a distributed lock in Java using Redis. Discuss correctness and edge cases.

**Approach:** `SET key uuid NX PX 30000` (atomic). Owner stored as UUID so only owner can release. Release via Lua script: GET → compare UUID → DEL atomically. Discuss: clock drift (lease-based), client GC pause (Kleppmann's fencing token argument), Redlock controversy. Alternative: Zookeeper ephemeral sequential node + watch on predecessor (cleaner correctness, higher latency).

**Tags:** #coding

---

### 8. Producer-Consumer with BlockingQueue

**Difficulty:** Medium
**Topics:** concurrency, java, threads
**Position:** SWE
**Years:** P5-P6

**Question:** Implement a producer-consumer pattern in Java. Compare `synchronized` + `wait/notify` vs `ReentrantLock` + `Condition` vs `BlockingQueue`.

**Approach:** Show all three. (1) `synchronized` block + `wait()` (release lock) / `notifyAll()` — error-prone, must use `while` not `if` on condition. (2) `ReentrantLock` with two `Condition`s (`notFull`, `notEmpty`) — finer control, can be unfair/fair. (3) `ArrayBlockingQueue` — production-grade, handles everything. Discuss when you'd write your own: rarely; prefer `LinkedBlockingQueue` or `Disruptor` for high-throughput.

**Tags:** #coding

---

### 9. Design Taobao Flash Sale (秒杀)

**Difficulty:** Hard
**Topics:** system-design, caching, queue, rate-limiting, consistency
**Position:** Senior SWE
**Years:** P7

**Question:** Design the backend for a Taobao 秒杀 (flash sale): 100K items go on sale at 10:00:00.000, millions of users hit "buy" at the same millisecond. Inventory must not over-sell.

**Approach:** Layered defense: (1) Client throttle + CAPTCHA on hot pages. (2) CDN caches the product page; the "buy" button is enabled by client-side timer (don't trust). (3) API gateway with Sentinel for global rate limiting. (4) Redis holds inventory counter; `DECR` is atomic, return -1 if oversold → reject. (5) Successful "lock" pushed to RocketMQ for async order creation (this prevents DB hot-row contention; downgrade to "order pending" UI). (6) Order service writes to sharded MySQL (shard by user_id), reconciles with the locked inventory. Discuss: idempotency tokens (user retries shouldn't double-order), cache warming (load inventory into Redis before sale), and graceful degradation (sell out → static page).

**Tags:** #system-design

---

### 10. Design Alipay Payment Flow

**Difficulty:** Hard
**Topics:** system-design, distributed-transactions, idempotency, payments
**Position:** Senior SWE
**Years:** P7-P8

**Question:** Design the payment flow when a user pays for an order on Taobao via Alipay. Cover failure cases.

**Approach:** Saga pattern across services: Order → Payment Account → Bank/Card. Each step is an idempotent local transaction; on failure, run compensating actions. Idempotency token (out_trade_no) prevents double-charges on retry. Use Seata or self-built TCC (Try-Confirm-Cancel) framework: Try reserves funds, Confirm captures, Cancel releases. Asynchronous bank callback updates final state. Discuss: reconciliation (daily batch matches our records vs bank's), eventual consistency window (user sees "processing" not "paid"), fraud signals, and PCI scope.

**Tags:** #system-design

---

### 11. Design RocketMQ-style Message Queue

**Difficulty:** Hard
**Topics:** system-design, message-queue, replication, ordering
**Position:** Senior SWE
**Years:** P7-P8

**Question:** Design a distributed message queue like RocketMQ supporting ordered messages, transactional messages, and high throughput.

**Approach:** Broker holds commit log + per-queue offsets. Producers write to a partition (consistent-hash or RR); consumers pull from offsets they manage. Replication: master-slave (sync or async). Ordered messages: producer pins to a partition by key. Transactional messages: 2-phase — send "half" message → broker holds → producer commits/rolls back → broker delivers or discards (with callback recovery for crashed producers). Discuss: zero-copy (mmap + sendfile) for throughput, consumer group rebalance on member change, and message backlog handling.

**Tags:** #system-design

---

### 12. Design a Distributed Configuration Center (Nacos-like)

**Difficulty:** Medium
**Topics:** system-design, distributed, watch, consistency
**Position:** Senior SWE
**Years:** P7

**Question:** Design a configuration center used by thousands of services to manage runtime config and service discovery.

**Approach:** Cluster of 3-5 servers using Raft for strong consistency on writes. Clients long-poll (or use SSE / WebSocket) for change notifications. Local client cache + fallback to disk if server unreachable. For service discovery, registry stores `(service, instance, healthy)` with heartbeat-based health check. Configs versioned; rollback supported. Discuss: graceful degradation (clients run on cached config if server is down), namespace/tenant isolation, and how config push avoids thundering herd (server staggers notifications).

**Tags:** #system-design

---

### 13. Design Cainiao Logistics Tracking

**Difficulty:** Hard
**Topics:** system-design, time-series, geospatial, ingestion
**Position:** Senior SWE
**Years:** P7

**Question:** Design the parcel tracking system for Cainiao — every package emits status events (picked up, in transit, delivered) and users query status in real time.

**Approach:** Events ingested via gateway → Kafka → consumer pipeline. Latest status per parcel kept in HBase or Cassandra (key = tracking_number, sorted columns by timestamp). Aggregated views (delivery ETAs, hub bottleneck stats) computed via Flink. Geospatial: each scan emits `(parcel_id, hub_id, lat/lng, ts)`; map view queries by bounding box on a geo-index (Elasticsearch or H3 cells). Discuss read fan-out (millions of users check the same package), notification triggers, and historical query of long-completed parcels (move to cold storage).

**Tags:** #system-design

---

### 14. Design an E-commerce Coupon / Promotion System

**Difficulty:** Hard
**Topics:** system-design, rules-engine, caching, anti-abuse
**Position:** Senior SWE
**Years:** P7

**Question:** Design the system that evaluates coupons and promotions at checkout — supports stacking rules, time-bound, user-eligibility, anti-abuse.

**Approach:** Rules engine (Drools-style or custom DSL) evaluates a cart against all applicable promotions. Coupons stored in Redis (per-user owned, per-campaign issued counters). Eligibility check: per-user limit (atomic decrement), time window, product/category match. Anti-abuse: device fingerprint, IP rate limit, ML risk score. Calculation order matters when stacking — define explicit priority: shop-coupon → category-coupon → platform-coupon. Async issue audit log for fraud investigation. Discuss: cache invalidation on rule change, A/B different promo logic, and how to roll back a bad campaign mid-flight.

**Tags:** #system-design

---

### 15. 客户第一: Tell me about a time you prioritized the customer over internal pressure

**Difficulty:** Medium
**Topics:** behavioral, customer-first, six-values
**Position:** SWE
**Years:** P5-P7

**Question:** Tell me about a time you pushed back on internal stakeholders to do what was right for the customer.

**Approach:** Maps to 客户第一 (Customer First). Show: (1) the internal pressure was concrete (deadline, exec ask, cost), (2) you identified specific customer harm with data, (3) you proposed an alternative that served both when possible, (4) you communicated up-chain not just refused. Result: customer-impact metric improved, internal relationship preserved.

**Tags:** #behavioral

---

### 16. 拥抱变化: Tell me about a time your project pivoted

**Difficulty:** Medium
**Topics:** behavioral, embrace-change, six-values
**Position:** SWE
**Years:** P5-P7

**Question:** Tell me about a time the direction of your project changed significantly. How did you adapt?

**Approach:** Maps to 拥抱变化 (Embrace Change). Alibaba reorganizes frequently — they want people who roll with it. Show: (1) you found the *opportunity* in the pivot (new tech to learn, new domain), (2) you helped teammates who were struggling with the change, (3) you delivered in the new direction with energy, not resentment. Avoid stories that secretly complain about leadership.

**Tags:** #behavioral

---

### 17. 团队合作: Time you helped a colleague succeed

**Difficulty:** Medium
**Topics:** behavioral, team-work, six-values
**Position:** SWE
**Years:** P6-P7

**Question:** Tell me about a time you went out of your way to help a teammate succeed, even when it didn't directly benefit you.

**Approach:** Maps to 团队合作 (Teamwork). Show: (1) specific colleague + situation (struggling promo case, blocked on something), (2) what you specifically did (pair programming, took on their on-call, ghost-wrote their design doc), (3) outcome for them — they shipped, got promoted, leveled up. Don't oversell your role; the teammate is the protagonist.

**Tags:** #behavioral

---

### 18. Toughest technical problem you've solved

**Difficulty:** Medium
**Topics:** behavioral, technical-depth, dive-deep
**Position:** Senior SWE
**Years:** P7

**Question:** Walk me through the hardest technical problem you've personally solved. Be detailed.

**Approach:** Higher-level (P8+) interviewers grade this heavily. Pick a problem with: (1) real complexity (not just "I learned a new framework"), (2) measurable impact, (3) trade-offs you made consciously, (4) what would do differently. Be ready for 20+ min of follow-up grilling. Bonus: if you can tie it to JVM internals or distributed-systems theory, P9 interviewers light up.

**Tags:** #behavioral

---

### 19. JVM tuning: troubleshoot full GC storms in a Java service

**Difficulty:** Hard
**Topics:** java, jvm, gc, performance
**Position:** SWE
**Years:** P6-P7

**Question:** A Java service shows long Full GC pauses every few minutes, causing latency spikes. Walk through how you'd diagnose and fix it.

**Approach:** (1) Enable GC logs (`-Xlog:gc*` for JDK 9+) and collect a heap dump (`jmap` or auto-on-OOM). (2) Analyze with GCViewer/JClarity — identify pause cause (allocation rate too high? old gen filling fast? metaspace?). (3) Common culprits: large object allocation (caches not bounded), memory leak (static collection growing), wrong collector (Parallel GC for low-latency = bad → switch to G1/ZGC/Shenandoah). (4) Tune heap sizing — too small Eden = frequent young GC, too large old gen = long Full GC. (5) Code fix: object pooling for hot paths, off-heap caching, lazy init. Mention `-XX:+HeapDumpOnOutOfMemoryError` always on in production.

**Tags:** #domain-knowledge

---

### 20. Distributed transaction: 2PC vs TCC vs Saga vs Seata

**Difficulty:** Hard
**Topics:** distributed-systems, transactions, seata, payments
**Position:** Senior SWE
**Years:** P7-P8

**Question:** A payment crosses three services (Order, Wallet, Coupon). Compare 2PC, TCC, Saga, and Seata AT mode for ensuring atomicity. Which would you pick at Alibaba scale?

**Approach:** **2PC** — synchronous, blocking; coordinator failure leaves participants in limbo. Not used at scale. **TCC (Try-Confirm-Cancel)** — application-defined; reserves resources in Try, captures in Confirm, releases in Cancel. Strong consistency, more code. **Saga** — chain of local transactions with compensating actions; eventual consistency, no isolation between steps (dirty reads possible by user). **Seata AT mode** — automatic compensation via undo logs; less code than TCC but requires DB integration and adds row-level "global locks." At Alibaba scale: TCC for payments (correctness critical, willing to code), Saga for non-financial flows (e.g., order → ship → notify), AT mode for green-field internal services. Discuss idempotency, retry policies, and reconciliation as safety nets.

**Tags:** #domain-knowledge

---

## Tips specific to Alibaba

- **Know Java middleware deeply.** Spring lifecycle, AOP, Dubbo RPC, MyBatis interceptors — interviewers go deep into source code.
- **JVM internals are non-negotiable.** GC algorithms (CMS, G1, ZGC), memory model (JMM), `volatile`/`synchronized`/`final` semantics. Know `AQS` internals.
- **Open-source contributions help a lot.** Especially to Alibaba-sponsored projects (Dubbo, RocketMQ, Nacos, Sentinel, Seata, Alink). Mention them concretely.
- **Six Values prep.** Have one story per value. The 客户第一 and 拥抱变化 stories get reused most.
- **Higher-level interviewers ask "design Taobao."** They want architectural narrative, not boxes. Practice talking through trade-offs out loud for 20+ minutes.

## Resources

- Alibaba tech blog (Chinese: alibaba-cloud.medium.com; some English mirrors)
- 牛客网 (NowCoder) interview reports for Alibaba — extensive Chinese-language db
- "Designing Data-Intensive Applications" — Kleppmann
- Open-source: github.com/apache/dubbo, github.com/apache/rocketmq, github.com/alibaba/Sentinel, github.com/seata/seata
