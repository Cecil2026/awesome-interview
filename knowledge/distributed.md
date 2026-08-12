# Distributed Systems Interview Questions

High-frequency distributed-systems questions covering consistency (CAP/PACELC), consensus (Paxos/Raft), replication and quorums, distributed transactions (2PC/Saga/TCC), locks and unique IDs, logical clocks, consistent hashing, and resilience patterns. This is a starter set — a small, high-quality sample meant to grow.

---

### 1. CAP theorem (and PACELC)

**Frequency:** High

**Question:** State the CAP theorem precisely and explain why "CA" is misleading. What does PACELC add?

**Answer:** CAP says that when a network **partition** (P) occurs, a distributed system must choose between **Consistency** (every read sees the latest write, i.e., linearizability) and **Availability** (every request gets a non-error response). You cannot have both *during a partition*. The common "pick 2 of 3" framing is misleading: partitions are not optional — networks fail — so P is always on the table. The real choice is **CP** (refuse/block requests to stay consistent, e.g., a system that errors when it can't reach a quorum) vs **AP** (keep serving, possibly stale, and reconcile later, e.g., Dynamo-style stores). "CA" only describes a single node or a system that assumes no partitions ever — not a real distributed choice.

**PACELC** extends this: *if Partition, choose A or C; Else (normal operation), choose between Latency and Consistency*. This captures the everyday trade-off CAP ignores — even with no partition, strong consistency (e.g., synchronous cross-region replication) costs latency, so systems like Dynamo are "PA/EL" and systems like a strongly-consistent store are "PC/EC."

**Key points:**
- During a partition: consistency vs availability — can't have both.
- Partitions aren't optional, so real choice is CP vs AP; "CA" isn't a meaningful distributed mode.
- PACELC: else (no partition) it's Latency vs Consistency — the everyday trade-off.

---

### 2. Consistency models

**Frequency:** High

**Question:** Compare strong, eventual, causal, and read-your-writes consistency.

**Answer:** Consistency models define what a read is allowed to return. **Strong consistency / linearizability** makes the system behave as if there's a single copy: once a write completes, every subsequent read (by anyone) sees it. Easiest to reason about, but requires coordination and costs latency/availability. **Eventual consistency** guarantees only that, *absent new writes*, replicas converge eventually — reads may return stale data in the meantime. Cheap and highly available, but the application must tolerate staleness and conflicts.

Between them are useful middle grounds. **Causal consistency** preserves cause-and-effect ordering: if write B depends on write A, everyone sees A before B, but concurrent (unrelated) writes may be seen in different orders — enough to prevent "reply appears before the message it answers." **Read-your-writes** (a session guarantee) ensures a user always sees their *own* updates, even if others see them later — commonly implemented by routing a user to a replica that has their writes or reading from the primary briefly after a write.

**Key points:**
- Strong/linearizable: single-copy illusion, latest write always visible; costly coordination.
- Eventual: converges when writes stop; reads may be stale; cheap and available.
- Causal: preserves dependency order, allows concurrent writes to differ.
- Read-your-writes: session guarantee — you see your own updates.

---

### 3. Consensus: Paxos vs Raft

**Frequency:** High

**Question:** What problem does distributed consensus solve, and how does Raft make it understandable versus Paxos?

**Answer:** Consensus lets a group of nodes agree on a single value/sequence of operations despite failures — the foundation for leader election, replicated logs, and strongly-consistent stores. It needs a **majority quorum** (⌊N/2⌋+1), which is why clusters are odd-sized (3, 5): a majority tolerates ⌊N/2⌋ failures and guarantees any two quorums overlap, preventing two conflicting decisions.

**Paxos** proves consensus is achievable but is notoriously hard to understand and to turn into a complete system (multi-Paxos for a log adds more). **Raft** was designed for understandability by decomposing the problem: (1) **leader election** — nodes are follower/candidate/leader; a randomized election timeout triggers a candidate to request votes, and a majority elects a leader for a **term**; (2) **log replication** — clients talk only to the leader, which appends entries and replicates them, committing once a majority acknowledges; (3) **safety** — an election restriction ensures only a node with all committed entries can win, so the log never loses committed data. Both need majorities and are equivalent in guarantees; Raft is just far easier to implement correctly (etcd, Consul, TiKV use it).

**Key points:**
- Consensus = agree on one value/order despite failures; needs majority quorum (odd N).
- Quorums overlap → no two conflicting decisions; tolerate ⌊N/2⌋ failures.
- Raft decomposes into leader election + log replication + safety; terms + randomized timeouts.
- Paxos and Raft are equivalent in power; Raft wins on understandability/implementation.

---

### 4. Leader election and split-brain

**Frequency:** High

**Question:** Why elect a leader, and how do systems avoid split-brain (two leaders)?

**Answer:** A single **leader** serializes writes, which simplifies consistency (one place decides order) and coordination. The danger is **split-brain**: a network partition makes two nodes each believe they're leader and both accept writes, causing divergent, conflicting state. The primary defense is **quorum**: a leader is only valid if a majority elected it, and since two majorities can't exist simultaneously, only one leader can hold quorum — the minority side must step down and stop serving writes.

Additional safeguards: **fencing tokens** — each new leadership grants a monotonically increasing epoch/term number, and resources (or a shared store) reject operations carrying a stale token, so a revived old leader can't do damage. **Leases** with expiry ensure a partitioned leader relinquishes authority after its lease lapses. Systems like ZooKeeper/etcd provide these primitives so applications don't reinvent them.

**Key points:**
- Leader serializes writes → simpler consistency; risk is split-brain (two leaders).
- Majority quorum: only one side can have a majority, so only one valid leader.
- Fencing tokens (monotonic epochs) reject stale-leader operations.
- Leases with expiry force partitioned leaders to step down.

---

### 5. Replication strategies

**Frequency:** High

**Question:** Compare single-leader, multi-leader, and leaderless replication.

**Answer:** **Single-leader** (primary/replica): all writes go to one leader that replicates to followers; reads can be served by followers. Simple, no write conflicts, but the leader is a bottleneck/SPOF and failover takes time. Replication can be **synchronous** (durable, higher latency) or **asynchronous** (fast, risks losing recent writes on failover). **Multi-leader**: multiple nodes accept writes (e.g., one per region) and replicate to each other — better write availability and locality, but **write conflicts** are inevitable and need resolution (last-write-wins, version vectors, CRDTs, or app-level merge).

**Leaderless** (Dynamo-style): clients write to several replicas and read from several; consistency is tuned by quorum — with N replicas, **W + R > N** guarantees a read overlaps the latest write. It uses **read repair** and **anti-entropy** to converge, and handles concurrent writes with version vectors. Highly available and no failover step, but gives eventual/tunable consistency, not linearizability.

**Key points:**
- Single-leader: no conflicts, simple; leader is bottleneck/SPOF; sync vs async replication trade durability for latency.
- Multi-leader: multi-region writes, but conflict resolution required (LWW/vectors/CRDTs).
- Leaderless: quorum W+R>N for overlap; read repair + anti-entropy; tunable, not linearizable.

---

### 6. Two-phase commit (2PC) and its problems

**Frequency:** High

**Question:** How does 2PC work, and why is it considered a blocking protocol?

**Answer:** 2PC coordinates an atomic commit across multiple nodes via a **coordinator**. Phase 1 (**prepare**): the coordinator asks every participant to prepare; each does the work, durably logs it, and votes yes (promising it *can* commit) or no. Phase 2 (**commit/abort**): if all voted yes, the coordinator tells everyone to commit; if any voted no, everyone aborts. Once a participant votes yes it must be able to honor a later commit, even after a crash.

The fatal weakness is **blocking**: if the coordinator crashes after participants voted yes but before broadcasting the decision, participants are stuck holding locks, unable to safely commit or abort (they don't know the outcome) — the system blocks until the coordinator recovers. The coordinator is a SPOF, and locks held across the round hurt throughput. **3PC** adds a pre-commit phase to reduce blocking but breaks under network partitions and is rarely used. In practice large systems avoid distributed 2PC in favor of sagas or by keeping transactions within one partition.

**Key points:**
- Phase 1 prepare (vote) → phase 2 commit/abort based on unanimous yes.
- Blocking: coordinator crash after votes leaves participants stuck holding locks.
- Coordinator is a SPOF; locks across the round limit throughput.
- 3PC reduces blocking but fails under partitions; large systems prefer sagas.

---

### 7. Saga pattern

**Frequency:** High

**Question:** What is a saga, and how do choreography and orchestration differ?

**Answer:** A **saga** implements a long-running distributed transaction as a sequence of **local** transactions, each with a **compensating** transaction that semantically undoes it. Instead of holding locks across services (2PC), each step commits locally; if a later step fails, the saga runs the compensations for the already-completed steps in reverse (e.g., cancel payment, restock item). This gives **eventual** atomicity and no long-held locks, at the cost of only guaranteeing consistency eventually and exposing intermediate states — so steps must be idempotent and compensations must be well-defined (some actions, like "email sent," can't truly be undone and need a counter-action).

**Choreography**: no central coordinator — each service reacts to events and emits the next event. Decoupled and simple for short flows, but the overall flow is implicit and hard to trace/debug as it grows. **Orchestration**: a central orchestrator explicitly drives each step and triggers compensations on failure. Clearer control flow, easier to monitor, but the orchestrator is a component to build and can become a coupling point.

**Key points:**
- Saga = chain of local transactions + compensating actions; no distributed locks.
- Eventual atomicity; intermediate states visible; steps idempotent, compensations defined.
- Choreography: event-driven, decoupled, flow implicit (hard to trace at scale).
- Orchestration: central driver, explicit/observable flow, orchestrator is extra component.

---

### 8. TCC (Try-Confirm-Cancel)

**Frequency:** Medium

**Question:** How does the TCC pattern work, and how does it compare to a saga?

**Answer:** **TCC** splits each participant's operation into three explicit steps. **Try**: reserve/lock the needed resources and check preconditions without committing the business effect (e.g., freeze the amount, reserve stock). **Confirm**: if all participants' Try succeeded, actually apply the effect using only the reserved resources (must be idempotent and should not fail). **Cancel**: if any Try failed, release the reservations. It's essentially application-level 2PC without a database-managed prepare — you implement the "prepare" as a business reservation.

Versus a saga: TCC reserves resources up front so the confirmed state is clean (no visible "committed then compensated" intermediate), giving better isolation, but it's more intrusive — every service must implement all three phases and hold reservations. Sagas are simpler and looser (commit-then-compensate) but expose intermediate states. TCC suits financial flows needing tight isolation; sagas suit longer, looser workflows.

**Key points:**
- Try (reserve) → Confirm (apply reserved) → Cancel (release); app-level 2PC.
- Confirm/Cancel must be idempotent; Try holds a reservation.
- Better isolation than saga (no dirty committed state), but more intrusive to implement.
- TCC for tight financial isolation; saga for looser long workflows.

---

### 9. Idempotency in distributed systems

**Frequency:** High

**Question:** Why is idempotency essential in distributed systems, and how do you implement it?

**Answer:** Networks give you **at-least-once** delivery by default: timeouts, retries, redelivered messages, and double-clicks all cause the same operation to arrive more than once. An **idempotent** operation produces the same result whether applied once or many times, so duplicates are harmless — this is what makes safe retries (and thus reliable distributed systems) possible. Without it, retries create double charges, duplicate orders, etc.

Common implementations: an **idempotency key** — the client sends a unique key with the request; the server records `(key → result)` and, on a repeat, replays the stored result instead of re-executing (reject if the same key arrives with a different payload). **Dedup tables / processed-message IDs** for consumers — record each handled message ID and skip repeats. **Natural idempotency** — design operations as `SET status = 'paid'` (idempotent) rather than `balance -= 10` (not). **Optimistic concurrency** with version numbers rejects stale re-applies. The key subtlety is atomicity: check-and-record must be atomic (a DB unique constraint or transaction) or two concurrent duplicates both slip through.

**Key points:**
- At-least-once delivery is the norm → duplicates happen → need idempotency for safe retries.
- Idempotency key: store (key → result), replay on repeat, reject mismatched payloads.
- Dedup by message ID; design naturally idempotent ops; version/optimistic checks.
- Check-and-record must be atomic (unique constraint/transaction) to avoid races.

---

### 10. Distributed locks

**Frequency:** High

**Question:** How do you implement a distributed lock, and what are the pitfalls of Redis-based locks?

**Answer:** A distributed lock lets only one node act at a time across machines. A basic **Redis** lock uses `SET key value NX PX ttl` — set only if absent, with a TTL so a crashed holder's lock auto-expires; release by deleting the key, but *only if you own it* (compare a unique token via a Lua script, so you don't delete someone else's lock after your TTL lapsed). The TTL is the crux: too short and the lock expires mid-work (two holders); too long and a crashed holder blocks everyone.

Pitfalls: TTL expiry while work is still running breaks mutual exclusion — the real fix is **fencing tokens** (a monotonically increasing number checked by the protected resource) so a stale lock holder's writes are rejected. **Redlock** (locking across N independent Redis nodes) is debated as unsafe under clock skew/GC pauses. For correctness-critical locks, a consensus-backed coordinator like **ZooKeeper** (ephemeral sequential znodes — the lowest sequence holds the lock, ephemerality auto-releases on session loss) or **etcd** (leases) is more robust than Redis, which is better suited to best-effort locking.

**Key points:**
- Redis: `SET NX PX ttl`; release with owner-token check via Lua; TTL balances safety vs liveness.
- TTL expiry mid-work breaks mutual exclusion → use fencing tokens on the resource.
- Redlock is contested under clock skew/pauses.
- ZooKeeper (ephemeral sequential znodes) / etcd leases for correctness-critical locks.

---

### 11. Distributed unique ID generation

**Frequency:** High

**Question:** How do you generate unique IDs at scale, and how does Snowflake work?

**Answer:** Auto-increment on a single DB doesn't scale (SPOF + bottleneck) and UUIDv4 is random — globally unique but 128-bit and terrible as a database index key because random inserts fragment B-trees. **Snowflake** produces a 64-bit, roughly time-ordered ID: a **timestamp** (ms since a custom epoch, ~41 bits) + a **machine/worker id** (~10 bits) + a per-ms **sequence** number (~12 bits). This gives sortable, index-friendly IDs generated locally without coordination, at millions per second. The catches: it depends on **clock monotonicity** — a backward clock jump (NTP correction) can produce duplicates, so implementations must detect and wait/refuse — and worker IDs must be assigned uniquely.

Alternatives: a **segment/leaf** approach hands each server a range (e.g., 1000 IDs) from a central store so it generates locally and only hits the DB per batch — simple and DB-backed, IDs monotonic but the step is guessable. UUIDv7 is a newer time-ordered UUID that's index-friendlier than v4. Choose based on whether you need sortability, guess-resistance, or minimal infrastructure.

**Key points:**
- Single-DB auto-increment = SPOF/bottleneck; UUIDv4 = unique but random (bad index locality).
- Snowflake 64-bit: timestamp + worker id + sequence → sortable, coordination-free, high throughput.
- Risk: clock going backward → duplicates; worker IDs must be unique.
- Segment/leaf hands out ID ranges (DB-backed batches); UUIDv7 = time-ordered UUID.

---

### 12. Logical clocks: Lamport and vector clocks

**Frequency:** Medium

**Question:** Why can't you rely on wall-clock time for ordering events, and how do Lamport and vector clocks help?

**Answer:** Physical clocks on different machines drift and are corrected by NTP, so wall-clock timestamps can't reliably order events across nodes (one node's "later" timestamp may be earlier in reality). **Logical clocks** order events by causality instead. A **Lamport clock** is a per-node counter: increment on each event, and on receiving a message set your counter to `max(local, received) + 1`. This guarantees that if A causally happened-before B then `L(A) < L(B)` — enough for a total order (break ties by node id) — but the converse fails: `L(A) < L(B)` does *not* prove A caused B, so Lamport clocks can't detect concurrency.

**Vector clocks** fix that: each node keeps a vector of counters (one per node) and includes it in messages, taking the element-wise max on receipt. Comparing two vectors reveals the exact relationship — one strictly dominates (causal order) or neither does (**concurrent**, i.e., a conflict). This is how leaderless stores (Dynamo) detect concurrent writes that need reconciliation. The cost is O(N) size per timestamp, which grows with the number of nodes.

**Key points:**
- Wall clocks drift/NTP-correct → unreliable cross-node ordering.
- Lamport clock: `max+1` on receive; captures happened-before but can't detect concurrency.
- Vector clock: per-node vector; comparison reveals causal-vs-concurrent → detects conflicts.
- Vector clocks cost O(N) per timestamp; used by Dynamo-style stores for conflict detection.

---

### 13. Consistent hashing

**Frequency:** High

**Question:** What problem does consistent hashing solve, and what are virtual nodes for?

**Answer:** With plain `hash(key) % N` sharding, changing N (adding/removing a node) remaps almost *every* key, causing a massive rebalance and cache-miss storm. **Consistent hashing** places both nodes and keys on a hash **ring**; a key belongs to the first node clockwise from it. Adding or removing a node only reassigns the keys between that node and its neighbor — roughly **K/N keys move**, not all of them — which is why it's used for sharded caches (memcached), Dynamo/Cassandra, and CDNs.

Plain consistent hashing can distribute unevenly (nodes land at uneven ring positions) and, worse, when a node dies all its load dumps onto one neighbor. **Virtual nodes** solve both: each physical node is placed at many points on the ring (many virtual tokens), so load is smoother and a failed node's keys spread across *many* remaining nodes instead of one. Virtual nodes also let you weight heterogeneous hardware by giving bigger machines more tokens.

**Key points:**
- `hash % N` remaps nearly all keys when N changes; consistent hashing moves only ~K/N.
- Ring: key → first node clockwise; used by caches, Dynamo/Cassandra, CDNs.
- Virtual nodes = many ring positions per node → even load + failed node's keys spread widely.
- Virtual nodes also enable weighting by capacity.

---

### 14. Message delivery semantics

**Frequency:** High

**Question:** Explain at-most-once, at-least-once, and exactly-once delivery, and whether true exactly-once is achievable.

**Answer:** **At-most-once**: send/process without retries — messages may be lost but never duplicated. Simplest, acceptable for tolerant data (metrics samples). **At-least-once**: retry until acknowledged — no loss, but crashes between processing and acking cause duplicates. This is the practical default, and it pushes the burden onto **idempotent** consumers. **Exactly-once**: each message affects the system's state exactly once.

True *physical* exactly-once delivery is impossible over an unreliable network (the classic result: you can't distinguish a lost message from a lost ack, so you must either risk loss or risk duplication). What real systems provide is exactly-once *processing/effect*: at-least-once delivery + deduplication (idempotency keys, processed-ID tables) or transactional commits (Kafka transactions, Flink checkpoints + 2PC sinks) so duplicates don't change the outcome. So the pragmatic answer is: aim for at-least-once delivery plus idempotency to get effectively-once results.

**Key points:**
- At-most-once: no retry, may lose, never dup. At-least-once: retry, no loss, may dup (default).
- Physical exactly-once delivery is impossible (can't distinguish lost msg vs lost ack).
- Achieve exactly-once *effect* via at-least-once + dedup/idempotency or transactions.
- Design consumers to be idempotent.

---

### 15. Resilience patterns: circuit breaker, bulkhead, timeouts

**Frequency:** High

**Question:** How do you stop one failing service from cascading across a distributed system?

**Answer:** In a distributed system, a slow/failing dependency can exhaust the caller's threads/connections and drag *it* down, cascading failure upstream. Defenses: **Timeouts** — never wait indefinitely; a hung call must fail fast so resources are freed. **Retries with exponential backoff + jitter** — retry transient failures, but bounded and jittered to avoid a synchronized "retry storm" that hammers a recovering service (and only retry idempotent operations). **Circuit breaker** — track failure rate to a dependency; when it crosses a threshold, "open" the circuit and fail fast without calling for a cooldown, then "half-open" to test recovery before closing. This gives the failing service room to recover and the caller fast failures instead of pile-ups.

**Bulkhead** — isolate resources per dependency (separate thread/connection pools) so one saturated dependency can't consume all capacity, like watertight compartments in a ship. **Rate limiting / load shedding** — reject or degrade under overload rather than collapsing. **Fallbacks** — return cached/default responses when a dependency is down. Together these keep partial failures partial.

**Key points:**
- Timeouts: fail fast, free resources; never wait forever.
- Retries: exponential backoff + jitter, bounded, idempotent-only, to avoid retry storms.
- Circuit breaker: open on high failure rate → fail fast → half-open to test recovery.
- Bulkhead: isolate pools per dependency; plus rate limiting/load shedding and fallbacks.

---

### 16. Service discovery

**Frequency:** Medium

**Question:** How do services find each other in a dynamic environment, and what are client-side vs server-side discovery?

**Answer:** In cloud/container environments instances come and go with changing IPs, so hardcoding addresses fails. A **service registry** (Consul, etcd, ZooKeeper, Eureka, or Kubernetes' built-in) is the source of truth: instances **register** on startup (and deregister on shutdown), and **health checks** remove unhealthy ones so traffic only routes to live instances. Consumers query the registry to resolve a service name to a current address.

**Client-side discovery**: the client queries the registry and picks an instance itself (doing its own load balancing) — fewer hops, but every client needs discovery logic. **Server-side discovery**: the client hits a stable load balancer/gateway that consults the registry and forwards — simpler clients, but the LB is an extra hop/component. Kubernetes uses server-side-style discovery via DNS + Services (a stable virtual IP fronting healthy pods). Health checking and TTL/heartbeat expiry are what keep the registry from routing to dead instances.

**Key points:**
- Registry (Consul/etcd/Eureka/K8s) + register/deregister + health checks = live address book.
- Client-side: client resolves + load-balances (fewer hops, logic in every client).
- Server-side: LB/gateway resolves and forwards (simpler clients, extra hop).
- Health checks/heartbeat expiry prevent routing to dead instances.

---

### 17. Distributed tracing and observability

**Frequency:** Medium

**Question:** How do you debug a request that spans many services, and what are traces, spans, and context propagation?

**Answer:** A single user request may touch dozens of services, so a per-service log tells you little about the end-to-end path. **Distributed tracing** stitches it together: each request gets a **trace id** at the edge, and every operation creates a **span** (a timed unit of work with a parent span id) that inherits that trace id. Propagating the trace/span ids through every call (**context propagation**, e.g., W3C `traceparent` headers) lets a backend (Jaeger, Zipkin, Tempo) reconstruct the full tree — showing which service was slow, where errors originated, and the critical path's latency breakdown.

Tracing is one of the three **observability pillars**: **metrics** (aggregate numbers/time series for dashboards and alerts), **logs** (discrete events, ideally structured and correlated by trace id), and **traces** (per-request causal flow). **OpenTelemetry** is the vendor-neutral standard for instrumenting all three. Because tracing every request is expensive, systems use **sampling** (head- or tail-based) to keep overhead manageable while still catching slow/error traces.

**Key points:**
- Trace id at the edge; each op is a span with a parent → reconstruct the request tree.
- Context propagation (e.g., `traceparent`) carries ids across service calls.
- Three pillars: metrics (aggregate), logs (events, correlate by trace id), traces (per-request flow).
- OpenTelemetry standardizes instrumentation; sampling controls overhead.

---

### 18. Heartbeats, failure detection, and gossip

**Frequency:** Medium

**Question:** How do distributed systems detect that a node has failed, and what is a gossip protocol?

**Answer:** You can't distinguish a **crashed** node from a **slow/partitioned** one purely by silence — this is the fundamental limit of failure detection, so detectors trade off between falsely declaring live nodes dead (aggressive timeout) and being slow to notice real deaths (lax timeout). The basic mechanism is **heartbeats**: nodes periodically ping; a missed threshold marks a node suspect/dead. A **phi-accrual** detector improves on fixed timeouts by outputting a *suspicion level* based on the recent distribution of heartbeat arrival times, adapting to network conditions instead of a hard cutoff.

**Gossip** (epidemic) protocols spread state without central coordination: each node periodically picks random peers and exchanges membership/state info, so knowledge (who's alive, metadata) propagates exponentially and the system converges in O(log N) rounds. It's highly scalable and resilient (no SPOF, tolerates partial failures) and underpins membership in Cassandra, DynamoDB, and Consul's SWIM protocol. The trade-off is eventual (not instant) convergence and some redundant message traffic.

**Key points:**
- Can't tell crashed from slow/partitioned → detectors trade false-positives vs detection lag.
- Heartbeats + timeout mark nodes dead; phi-accrual gives an adaptive suspicion level.
- Gossip: random peer exchange → exponential, O(log N) convergence, no SPOF.
- Used for membership in Cassandra/Dynamo/Consul (SWIM); cost is eventual convergence + redundant messages.

---

### 19. ZooKeeper: ZAB, znodes, watches

**Frequency:** High

**Question:** How does ZooKeeper work internally — ZAB, the znode model, and watches — and what is it good for?

**Answer:** ZooKeeper is a **strongly consistent, hierarchical key-value store** for coordination, not a general database. Data lives in **znodes** arranged like a filesystem; each write is totally ordered by the **ZAB (ZooKeeper Atomic Broadcast)** protocol, which elects a single **leader** and broadcasts state changes as ordered transactions (zxids) that a quorum must acknowledge before commit — giving **linearizable writes** and **FIFO client order**. Znode flavors drive the recipes:

- **Persistent** — survive until explicitly deleted (config, metadata).
- **Ephemeral** — auto-deleted when the creating session ends (liveness, presence).
- **Sequential** — server appends a monotonic counter (locks, queues, leader election).

**Watches** are one-shot triggers that notify a client when a znode changes, avoiding polling. Reads are served locally (and may be slightly stale unless you `sync`). Typical uses: leader election, distributed locks, service discovery, config management, and group membership.

**Key points:**
- ZAB gives totally-ordered, quorum-committed, linearizable writes.
- Ephemeral znodes tie state to a session for automatic cleanup.
- Sequential znodes enable fair locks and leader election.
- Watches are one-shot; re-register after each fire.

---

### 20. etcd, Raft, and coordination stores

**Frequency:** High

**Question:** How does etcd use Raft, and how does it compare to ZooKeeper and Consul as a coordination store?

**Answer:** etcd is a **distributed, strongly consistent key-value store** that replicates its log via **Raft**: a single elected leader appends client writes to a log, replicates to followers, and commits an entry once a **majority** persists it, then applies it to the MVCC-backed state machine. Every key carries a **revision** (a global monotonic version), enabling watches from a point in time, transactions (compare-and-swap), and **leases** for ephemeral keys — the primitives Kubernetes builds on. Compared with peers:

- **ZooKeeper** — older, ZAB (Raft-like), hierarchical znodes, mature but heavier client sessions and a Java stack.
- **Consul** — Raft-based too, but bundles service discovery, health checking, and DNS/service-mesh features out of the box.
- **etcd** — lean, gRPC/HTTP, MVCC + leases + watches, the de-facto Kubernetes datastore.

All three trade availability for consistency (**CP**) and require an odd-sized quorum.

**Key points:**
- etcd = Raft-replicated MVCC key-value store with revisions.
- Leases give ephemeral keys; watches stream changes from a revision.
- Consul adds discovery/health/mesh; ZooKeeper is the older ZAB option.
- All are CP and need a majority quorum to accept writes.

---

### 21. Quorum reads/writes and read-index leases

**Frequency:** Medium

**Question:** How do quorum reads and writes work, and how do read-index and leader-lease optimizations make reads linearizable without a log round-trip?

**Answer:** With N replicas, quorum systems require a **write quorum W** and **read quorum R** such that **W + R > N** (and W > N/2), guaranteeing any read intersects the latest write and preventing two conflicting writes. The naive way to serve a **linearizable read** in Raft is to push the read through the log so it's ordered after all prior commits — correct but a full consensus round-trip. **Read-index** optimizes this: the leader records its current commit index, confirms it is still leader via a lightweight **heartbeat quorum**, and once its state machine has applied up to that index, serves the read locally — no log append. **Leader leases** go further: while a time-bounded lease (safely shorter than the election timeout) holds, the leader knows no other leader exists and answers reads **purely locally**, trading a bounded clock assumption for zero-RPC reads.

**Key points:**
- W + R > N ensures read/write sets overlap; W > N/2 blocks split writes.
- Read-index confirms leadership via heartbeat, then reads locally.
- Leader leases allow local reads with no per-read RPC.
- Leases rely on bounded clock drift; keep lease < election timeout.

---

### 22. Hybrid Logical Clocks (HLC)

**Frequency:** Medium

**Question:** What problem do Hybrid Logical Clocks solve that plain physical or Lamport clocks do not, and how do they work?

**Answer:** Physical (NTP) clocks give human-meaningful timestamps but **drift and skew**, so they can violate causality; Lamport/vector logical clocks capture **happens-before** but carry no relation to wall-clock time. **HLC** combines both into a compact timestamp — a physical component **pt** plus a small logical counter **l** — that stays **close to physical time** while guaranteeing that if event A happens-before B, then HLC(A) < HLC(B). On each event a node sets its physical part to `max(local physical time, received pt, own pt)`; if the physical part didn't advance, it bumps the **logical counter** to preserve monotonic ordering; the counter resets whenever physical time moves forward. The result is a monotonic, causally-consistent timestamp bounded within clock skew of real time — usable for MVCC snapshots, ordering, and consistent reads. CockroachDB uses HLC for exactly this.

**Key points:**
- HLC = bounded-size physical time + logical counter.
- Preserves happens-before while tracking wall-clock closely.
- Logical counter absorbs stalls/skew, resetting as physical time advances.
- Enables causal MVCC ordering without atomic clocks (e.g. CockroachDB).

---

### 23. Spanner TrueTime and external consistency

**Frequency:** Medium

**Question:** What is TrueTime, and how does Spanner use it to provide externally consistent (linearizable) distributed transactions?

**Answer:** Google Spanner achieves **external consistency** — if transaction T1 commits before T2 starts in real time, T1's timestamp is smaller — across a globally distributed database. The enabler is **TrueTime**, an API backed by **GPS and atomic clocks** that returns an **interval** `[earliest, latest]` guaranteed to contain the true current time, with a bounded uncertainty **ε** (typically a few milliseconds). Instead of pretending clocks are exact, Spanner exposes the uncertainty and **waits it out**: to commit, a read-write transaction picks a commit timestamp at `TT.now().latest`, then performs a **commit wait** — blocking until `TT.now().earliest` passes that timestamp — so no later transaction can be assigned an earlier time. Combined with **Paxos** groups and two-phase commit across shards, this yields lock-free, linearizable snapshot reads at any timestamp. The cost is latency proportional to ε, so Google invests heavily in tight clock synchronization.

**Key points:**
- TrueTime returns a time interval with bounded uncertainty ε.
- Commit-wait blocks until uncertainty passes, ordering commits correctly.
- Gives external consistency (linearizability) plus lock-free snapshot reads.
- Latency scales with ε, motivating GPS/atomic-clock infrastructure.

---

### 24. Barriers, latches, and leader leases

**Frequency:** Medium

**Question:** How do you implement distributed barriers, latches, and leader leases as coordination recipes on a store like ZooKeeper or etcd?

**Answer:** These are **coordination recipes** built on ephemeral/sequential keys and watches. A **barrier** makes a group of workers wait until a condition holds: create a barrier znode, have each worker register, and release everyone when a **double barrier** counts enough participants both entering and leaving — used to synchronize phases of a batch job. A **latch/countdown latch** blocks tasks until N events complete, typically by watching a counter or child count reach a threshold. A **leader lease** grants exclusive leadership for a bounded time: the holder writes a key with a **lease/TTL**, and must **renew** before expiry to keep it; if the process dies or stalls, the lease expires and another node acquires it, preventing split-brain **without** waiting for a slow failure detector.

- **Barrier** — wait until all peers arrive (and optionally all leave).
- **Latch** — proceed once N prerequisites are met.
- **Lease** — time-bounded exclusivity that must be renewed.

**Key points:**
- Recipes lean on ephemeral keys, sequential ordering, and watches.
- Double barriers synchronize both entry and exit of a phase.
- Leases bound leadership by time; renew or lose it automatically.
- Fencing tokens guard against a stalled ex-holder acting late.

---

### 25. Cluster membership and view changes

**Frequency:** Medium

**Question:** How do nodes in a cluster agree on who is currently a member, and why must membership changes go through consensus?

**Answer:** **Membership** is the agreed set of nodes currently in the group; a **view** is a specific version of that set, and a **view change** is the transition when nodes join, leave, or are declared dead. Membership must itself be **agreed consistently**, because if two partitions disagree on the roster they can each form a quorum and split-brain. Consensus systems therefore treat configuration as **committed log entries**: Raft uses **joint consensus** (a transitional config requiring majorities of both old and new sets) so no window exists where two disjoint majorities can elect leaders. Failure detectors (heartbeats, phi-accrual) *propose* that a node is down, but the actual removal is committed through the same protocol. Beyond strong consensus, **virtual synchrony** (used by group communication toolkits) delivers messages relative to view changes, and **SWIM/gossip** offers eventually-consistent membership for large, looser clusters.

**Key points:**
- A view is one agreed version of the member set; changes are view changes.
- Membership changes go through consensus to avoid dual quorums.
- Raft joint consensus overlaps old/new configs to stay safe.
- Failure detectors propose; the log commits actual add/remove.

---

### 26. FLP impossibility and workarounds

**Frequency:** Medium

**Question:** What does the FLP impossibility result say, and how do real systems reach consensus despite it?

**Answer:** The **FLP result** (Fischer, Lynch, Paterson, 1985) proves that in a **fully asynchronous** system — no bound on message or processing delay — **no deterministic protocol can guarantee consensus** if even **one** process may crash, because you can never distinguish a **slow** node from a **failed** one, and an adversarial scheduler can keep delaying the deciding message forever. Crucially it constrains **guaranteed termination**, not safety: correct protocols never produce a wrong result, they just can't promise to always finish. Real systems sidestep it by weakening the model:

- **Timeouts / partial synchrony** — assume delays are eventually bounded, so failure detectors and election timeouts let progress resume (Raft, Paxos, ZAB).
- **Randomization** — randomized algorithms terminate with probability 1 (Ben-Or).

So Paxos/Raft keep **safety always** and achieve **liveness whenever the network is well-behaved** — the pragmatic escape from FLP.

**Key points:**
- FLP: no deterministic async consensus with even one crash-fault.
- It limits guaranteed termination, not safety.
- Can't tell a slow node from a dead one without timing assumptions.
- Real systems add timeouts/partial synchrony or randomization for liveness.

---

### 27. Tuning quorums: N, W, R and W+R>N

**Frequency:** High

**Question:** In a leaderless quorum store, what do N, W, and R mean, and what does W+R>N actually guarantee (and not guarantee)?

**Answer:** In a Dynamo-style store, **N** is the replication factor (copies per key), **W** is the number of replicas that must acknowledge a write, and **R** is the number that must respond to a read; the coordinator returns success once the threshold is met. The classic rule **W+R>N** forces the write set and read set to overlap by at least one replica, so a read is guaranteed to see at least one copy of the latest acknowledged write — this gives *read-your-writes-style* freshness but only if the same nodes are involved. Tuning shifts the trade-off:

- **W=N, R=1**: fast reads, slow/fragile writes.
- **W=1, R=N**: fast writes, slow reads.
- **W=R=⌈(N+1)/2⌉** (e.g., N=3,W=R=2): balanced quorum.

What it does *not* guarantee: it is not linearizability. Concurrent writes can still conflict, reads during in-flight writes may see old or new nondeterministically, and failures/sloppy quorums (writing to fallback nodes) can break the overlap. You still need conflict resolution (version vectors, read repair) on top.

**Key points:**
- N = replicas, W = write acks, R = read responses; success at threshold.
- W+R>N makes read and write sets overlap → read sees at least one latest write.
- Tune W/R to bias toward read vs write latency and durability.
- Overlap ≠ linearizability: concurrent writes conflict, sloppy quorums break it — still need conflict resolution.

---

### 28. Read repair and anti-entropy with Merkle trees

**Frequency:** Medium

**Question:** How do read repair and Merkle-tree anti-entropy keep replicas converged, and how do they differ?

**Answer:** Eventual-consistency stores need background mechanisms to fix stale replicas, and the two complementary ones are read repair and anti-entropy. **Read repair** is opportunistic and foreground: when a read touches multiple replicas and detects divergent versions, the coordinator returns the newest value to the client and asynchronously writes it back to the stale replicas. It is cheap and self-healing for hot (frequently read) keys, but cold keys that are never read never get repaired. **Anti-entropy** is a background process that compares entire datasets between replicas; doing that naively means shipping everything, so systems use **Merkle trees** — a hash tree where leaves hash key ranges and parents hash their children. Two replicas compare roots; if equal, they are identical and no data moves. If not, they recurse only into subtrees whose hashes differ, so the traffic is proportional to the *differences*, not the dataset size. Together they cover both hot keys (read repair) and cold/rarely-read keys (anti-entropy).

**Key points:**
- Read repair: foreground, opportunistic — fixes stale replicas seen during a read; only helps read keys.
- Anti-entropy: background full-dataset reconciliation for cold keys.
- Merkle trees compare hashes top-down, recursing only into differing subtrees → traffic ∝ divergence, not data size.
- Use both: read repair for hot keys, anti-entropy to catch everything else.

---

### 29. Hinted handoff and sloppy quorums

**Frequency:** Medium

**Question:** What are hinted handoff and sloppy quorums, and what availability–consistency trade-off do they make?

**Answer:** These are Dynamo-style techniques that keep writes available when the "home" replicas for a key are temporarily down. With a **sloppy quorum**, if some of the N preferred nodes are unreachable, the coordinator still accepts the write by storing it on the next healthy nodes in the ring (outside the normal preference list) so it can reach W acknowledgments and not reject the client. **Hinted handoff** is the companion: the fallback node stores the data with a *hint* recording which node it really belongs to, and once that home node recovers, the hint is replayed and the data is handed back, restoring proper placement. The benefit is very high write availability — writes succeed through transient failures. The cost is weaker consistency: during the window, a strict W+R>N read of the intended replicas may miss the hinted copy (it lives elsewhere), so you can read stale data, and if the fallback node dies before handoff the write can be lost. It boosts availability at the expense of the quorum overlap guarantee.

**Key points:**
- Sloppy quorum: accept writes on fallback nodes when preferred replicas are down, to still reach W.
- Hinted handoff: fallback stores a hint and replays the data to the home node on recovery.
- Maximizes write availability during transient failures.
- Trade-off: breaks strict quorum overlap → possible stale reads or lost writes if the hint holder fails first.

---

### 30. CRDTs — conflict-free replicated data types

**Frequency:** Medium

**Question:** What are CRDTs, how do state-based and operation-based variants differ, and why do they converge without coordination?

**Answer:** CRDTs are data structures designed so that replicas can be updated independently and always **merge to the same state** without consensus or locking — ideal for multi-master, offline-first, and collaborative editing. They come in two flavors:

- **State-based (CvRDT)**: replicas exchange their full state and merge with a function that is commutative, associative, and idempotent (a join over a semilattice), so merges converge regardless of order or duplication — robust over lossy/gossip channels but heavier to ship.
- **Operation-based (CmRDT)**: replicas broadcast operations that must commute; lighter payloads but require reliable, exactly-once (or causal) delivery.

Common types include G-Counter and PN-Counter (grow-only / increment-decrement counters), G-Set and OR-Set (add-only / add-remove sets that track unique tags to resolve add/remove races), LWW-Register, and sequence CRDTs (RGA, Logoot) for text editing. The mathematical guarantee — merges form a semilattice — is what lets them achieve **strong eventual consistency**: replicas that have seen the same updates are in the same state, with no rollback. The cost is metadata overhead (tombstones, tags) and limited expressiveness.

**Key points:**
- CRDTs converge without coordination — replicas merge deterministically to one state.
- State-based: merge full state via commutative/associative/idempotent join; op-based: broadcast commuting ops, needs reliable causal delivery.
- Types: G/PN-Counter, G-Set/OR-Set, LWW-Register, sequence CRDTs for text.
- Semilattice merge → strong eventual consistency; cost is metadata/tombstone overhead.

---

### 31. Conflict resolution: LWW vs version vectors vs application merge

**Frequency:** High

**Question:** When concurrent writes conflict, how do last-write-wins, version vectors, and application-level merge differ, and when do you pick each?

**Answer:** When multiple replicas accept writes, you need a rule to reconcile divergent versions. **Last-write-wins (LWW)** attaches a timestamp and keeps the highest one, discarding the rest. It is trivial and stateless but **silently loses data** on concurrent writes and depends on clock synchronization — clock skew can drop the "real" latest write; acceptable for caches or where loss is tolerable. **Version vectors** (a per-replica counter map) let the system *detect* whether two versions are causally ordered or truly concurrent: if one dominates, take it; if concurrent, you cannot auto-pick correctly without more information, so the system surfaces **siblings**. **Application-level merge** then resolves those siblings using domain semantics — e.g., the union of a shopping cart (Dynamo's classic example), or a CRDT merge — never losing writes but pushing complexity onto the app. The rule of thumb: use LWW only when losing concurrent updates is fine; use version vectors to detect conflicts and application merge (or CRDTs) when correctness matters and every write must survive.

**Key points:**
- LWW: keep highest timestamp — simple, stateless, but silently drops concurrent writes and trusts clocks.
- Version vectors: detect causal vs concurrent updates; expose siblings instead of guessing.
- Application merge: reconcile siblings by domain logic (e.g., cart union) — no lost writes, more app complexity.
- Choose by cost of data loss: LWW for tolerant cases, version vectors + merge/CRDT when writes must survive.

---

### 32. Chain replication

**Frequency:** Medium

**Question:** How does chain replication provide strong consistency while achieving high read throughput?

**Answer:** Chain replication arranges the N replicas in an ordered chain: a **head**, zero or more middle nodes, and a **tail**. All **writes** go to the head and propagate strictly down the chain node by node; the update is considered committed only when it reaches the **tail**, which then sends the acknowledgment back to the client. All **reads** are served exclusively by the tail. Because the tail only ever holds updates that every predecessor has already applied, and it is the single node answering reads, the system is **linearizable** — reads always reflect all acknowledged writes, with no quorum voting on the read path. This design gives strong consistency more cheaply than majority quorums and, crucially, **spreads load**: writes stream through the pipeline (each node does modest work) while the tail alone handles reads. Variants like CRAQ (Chain Replication with Apportioned Queries) let *every* node serve reads by tracking clean/dirty versions and only consulting the tail when dirty, dramatically boosting read throughput while preserving linearizability. Failure handling requires a separate configuration master to reconfigure the chain when head/middle/tail nodes fail.

**Key points:**
- Writes enter at the head, flow down the chain, commit at the tail; reads served by the tail.
- Tail sees only fully-propagated writes → linearizable reads without quorum voting.
- Separates write pipeline from read node → high throughput; CRAQ lets all nodes serve reads.
- Needs a config master to reconfigure the chain on node failure.

---

### 33. Resharding without downtime

**Frequency:** High

**Question:** How do you reshard or rebalance a partitioned dataset while it stays online and serving traffic?

**Answer:** Resharding moves data between partitions as a cluster grows, shrinks, or develops skew, and the goal is to do it without downtime or a big data-movement storm. Key principles:

- **Don't use hash-mod-N** — adding a node remaps almost everything. Use **consistent hashing** or, better, a **fixed large number of logical partitions** (e.g., 4096) mapped onto physical nodes; rebalancing then just reassigns whole partitions, moving a bounded fraction of data.
- **Move partitions incrementally**: copy a partition's data to its new owner in the background while the old owner keeps serving; when caught up, do a brief cutover of ownership (often via double-writes during the copy, then flip reads).
- **Keep a routing/lookup layer** (a coordination service or directory) so clients always find the current owner during the migration; requests to a moved-but-not-flipped partition are forwarded.
- **Throttle** the copy to protect live traffic and verify with checksums before cutover.

The result is a gradual, reversible migration where each key is unavailable for at most a tiny cutover window, not the whole dataset.

**Key points:**
- Avoid hash-mod-N; use consistent hashing or a fixed pool of logical partitions reassigned to nodes.
- Copy partitions in the background, then do a brief ownership cutover (double-write / then flip reads).
- A routing/directory layer keeps clients pointed at the current owner and forwards in-flight requests.
- Throttle and checksum-verify; only a tiny per-partition window is affected, not the whole system.

---

### 34. Hotspot / celebrity-key mitigation

**Frequency:** High

**Question:** A single hot key (a celebrity account, a viral item) overloads one shard. How do you mitigate the hotspot?

**Answer:** Even with perfectly even key distribution, one *key* can concentrate load on a single shard because all requests for it hash to the same place — the classic celebrity or trending-item problem. Mitigations depend on the access pattern:

- **Read-heavy hot keys**: cache aggressively (CDN, local/replica caches, request coalescing) and add **read replicas** so reads fan out across copies; most celebrity load is reads.
- **Key splitting / salting**: append a random suffix (e.g., `key#0..key#K`) so one logical key spreads across K shards; writes go to a random split and reads gather all splits and merge — great for counters and append-heavy keys.
- **Write batching / aggregation**: buffer and coalesce writes (e.g., increment counts in memory, flush periodically) to cut per-request pressure.
- **Detection + isolation**: track per-key load and dynamically give a hot key its own dedicated shard/node or move it, rather than resharding everything.

The theme: because you can't rehash a single key onto more machines, you either replicate it (reads) or artificially fan it out (writes), and detect hotspots early so mitigation is targeted.

**Key points:**
- One key can overload a shard regardless of overall balance (celebrity/viral effect).
- Reads: cache + request coalescing + read replicas to spread the load.
- Writes: salt/split the key across K shards (scatter-gather on read) and batch/aggregate writes.
- Detect hot keys dynamically and isolate them onto dedicated capacity instead of resharding everything.

---

### 35. Transactional outbox pattern

**Frequency:** High

**Question:** How does the transactional outbox pattern reliably publish events alongside a database write, and what problem does it solve?

**Answer:** The core problem is the **dual-write**: a service that updates its database *and* publishes an event to a broker has two independent systems, and there's no atomic way to do both — a crash between them leaves the DB updated but the event lost (or vice versa), and wrapping a broker call in a DB transaction doesn't help because the broker can't join it. The **outbox** collapses this into a single local transaction: within the same DB transaction as the business change, you insert the event into an `outbox` table. Because it's one ACID commit, the event is persisted iff the state change is. A separate **relay/publisher** then reads unsent rows and pushes them to the broker, marking them sent. Two relay styles exist:

- **Polling publisher** — periodically query `outbox` for new rows; simple but adds latency/load.
- **Log tailing (CDC)** — tail the DB commit log (e.g., Debezium) so no polling and no app changes.

Publishing is at-least-once (a crash after send but before marking sent causes redelivery), so consumers must be idempotent.

**Key points:**
- Solves the dual-write problem: DB change + event in one atomic local transaction.
- Event row is committed with the business data, then a relay forwards it to the broker.
- Relay via polling or CDC/log-tailing (Debezium); CDC avoids polling latency.
- Delivery is at-least-once → downstream consumers must dedupe / be idempotent.

---

### 36. Event sourcing

**Frequency:** Medium

**Question:** What is event sourcing, and what do you gain and give up compared with storing current state?

**Answer:** Event sourcing persists state as an **append-only, ordered log of immutable events** ("OrderPlaced", "ItemShipped") rather than mutating a row in place. Current state is a **left fold** over the event stream — you rebuild an entity by replaying its events. The append-only log is the single source of truth, giving you a complete audit trail, the ability to reconstruct historical state ("time travel"), and freedom to derive new read models or fix bugs by replaying with corrected logic. The costs are real: querying current state requires replay, so you add **snapshots** (periodic materialized state so replay starts from the latest snapshot, not event zero); **schema/versioning** of events is hard because old events are immutable and must stay readable forever (event upcasting); eventual consistency and a steeper mental model complicate things. It pairs naturally with CQRS, where events feed separate read projections. Use it where auditability, temporal queries, or rich domain history genuinely matter — not for simple CRUD.

**Key points:**
- Store the sequence of state-changing events, not just current state; log is source of truth.
- Current state = replaying (folding) events; snapshots bound replay cost.
- Strong audit trail, time-travel, and replayable/rebuildable read models.
- Costs: event versioning/upcasting, replay complexity, eventual consistency; overkill for plain CRUD.

---

### 37. CQRS and its trade-offs

**Frequency:** Medium

**Question:** What is CQRS, when is it worth the added complexity, and what are its downsides?

**Answer:** CQRS (Command Query Responsibility Segregation) splits the model that **changes** state (commands, the write side) from the model that **reads** it (queries, the read side), instead of using one model for both. At its simplest this is two code paths against one database; at its fullest the write and read sides use **separate data stores** with different schemas, kept in sync by publishing events from the write side into denormalized read models (projections) optimized per query. The payoff:

- **Independent scaling/optimization** — read-heavy workloads scale reads separately; each side uses the ideal storage/shape.
- **Simpler models** — no single schema forced to serve both writes and complex reads.
- Natural fit with **event sourcing** and complex domains.

The cost is significant complexity: two models to maintain, and the read side becomes **eventually consistent** (a client may not immediately see its own write), which the UX must handle. It's overkill for simple CRUD; reserve it for domains with asymmetric read/write loads or divergent read and write shapes.

**Key points:**
- Separate write model (commands) from read model (queries); optionally separate stores.
- Enables independent scaling and per-side optimized schemas; pairs with event sourcing.
- Read side is a projection updated via events → eventual consistency (read-your-writes issues).
- Adds complexity; only justified for asymmetric loads or complex domains, not basic CRUD.

---

### 38. Message queue vs commit log

**Frequency:** High

**Question:** What's the fundamental difference between a message queue (RabbitMQ-style) and a commit log (Kafka-style), and when would you pick each?

**Answer:** A **message queue** (RabbitMQ, SQS, classic AMQP) treats messages as transient work items: the broker tracks per-message state, delivers a message to *one* competing consumer, and **deletes it on acknowledgment**. It excels at task distribution, complex routing (exchanges, topic/fanout bindings), per-message TTL, priorities, and smart broker-side dispatch. A **commit log** (Kafka, Pulsar) is a durable, append-only, partitioned log: messages are **retained** (by time/size) regardless of consumption, and each consumer tracks its own **offset**. This makes it a dumb-broker/smart-consumer design where multiple independent consumer groups replay the same stream, you can rewind to reprocess history, and throughput is very high via sequential IO and partition parallelism.

- **Choose a queue** for task/job dispatch, RPC-style work, rich routing, low-latency per-message handling.
- **Choose a log** for event streaming, high throughput, multiple consumers of one stream, replay/reprocessing, and event sourcing.

**Key points:**
- Queue: broker tracks state, delete-on-ack, competing consumers, rich routing (smart broker).
- Log: retained append-only partitions, consumer-managed offsets, replay, multiple consumer groups (smart consumer).
- Queue fits work distribution and complex routing; log fits streaming, replay, high throughput.
- Log retains history for reprocessing; queue discards once acknowledged.

---

### 39. Ordering guarantees and partitioning

**Frequency:** High

**Question:** What ordering guarantees do messaging systems provide, and how does partitioning affect them?

**Answer:** Global total ordering across a whole topic is expensive and rarely offered, because it forces a single serialized path and kills horizontal scalability. Most systems instead give **per-partition (or per-queue) ordering**: messages within one partition are delivered in the order they were appended, but there is **no ordering guarantee across partitions**. Since partitioning is how you scale throughput, you trade ordering breadth for parallelism. The practical technique is to choose a **partition key** so that all messages that must stay ordered land in the same partition — e.g., key by `orderId` or `userId`, so every event for one entity is sequential while unrelated entities process in parallel. Consequences: a hot key can create a skewed, bottlenecked partition; **changing partition count** rehashes keys and breaks ordering for in-flight data; and consumer-side concurrency can reorder within a partition unless you process a partition single-threaded. At-least-once redelivery can also surface duplicates out of order, so consumers still need idempotency.

**Key points:**
- Ordering is typically guaranteed only within a partition/queue, not globally.
- Partition by a key (orderId/userId) so related messages stay ordered while others parallelize.
- Trade-off: more partitions = more parallelism but weaker cross-partition ordering; hot keys skew.
- Repartitioning breaks ordering; parallel consumers can reorder unless per-partition serialized.

---

### 40. Dead-letter queues and poison messages

**Frequency:** Medium

**Question:** What is a dead-letter queue, and how does it help you handle poison messages?

**Answer:** A **poison message** is one a consumer can never successfully process — malformed payload, a bug, or a referenced resource that will never exist. Without a safeguard, at-least-once redelivery retries it forever, blocking the partition/queue behind it and burning resources in an infinite loop. A **dead-letter queue (DLQ)** is a separate destination where such messages are diverted after they exceed a **retry/max-delivery threshold** (or expire, or exceed size limits). This unblocks the main flow so healthy messages keep moving, while preserving the failed message plus metadata (failure reason, original queue, delivery count) for later inspection, alerting, manual fix, or **replay** once the bug is fixed. Good practice: use **retries with exponential backoff** for transient failures first, and only dead-letter after they're exhausted; distinguish transient (retryable) from permanent errors; monitor/alert on DLQ depth since a filling DLQ signals a real problem; and beware that naive redelivery of a poison message can also stall consumers if not capped.

**Key points:**
- Poison message = permanently unprocessable; naive retry loops forever and blocks the queue.
- DLQ diverts messages after a max-retry/delivery threshold, unblocking the main flow.
- Preserves payload + failure metadata for inspection, alerting, and later replay.
- Combine bounded retries with backoff; monitor DLQ depth as a health signal.

---

### 41. Backpressure and flow control

**Frequency:** Medium

**Question:** What is backpressure in a distributed message pipeline, and what mechanisms control flow to prevent overload?

**Answer:** Backpressure is the feedback that arises when a downstream stage **can't keep up** with the rate it's being fed: without control the queue grows unbounded, memory/latency blow up, and the system eventually crashes or drops data. Flow control is how a pipeline signals "slow down" upstream and keeps consumption matched to capacity. Common mechanisms:

- **Pull/consumer-driven** (Kafka) — consumers fetch at their own pace, so a slow consumer just lags behind rather than being flooded; the log's retention absorbs the buffer.
- **Bounded buffers + blocking** — a full buffer blocks or slows the producer (the essence of reactive-streams request(n) demand signaling).
- **Prefetch/credit limits** (RabbitMQ QoS `prefetch`) — cap unacknowledged in-flight messages per consumer.
- **Rate limiting / throttling** and **load shedding** — cap input rate or drop/sample low-priority messages when overwhelmed.

The design choice is whether to **buffer, block, shed, or scale out** consumers; each trades latency, throughput, and data loss differently. The goal is a stable system that degrades gracefully instead of collapsing.

**Key points:**
- Backpressure = downstream signaling it can't keep up; unbounded queues otherwise cause OOM/latency collapse.
- Pull-based consumers (Kafka) self-pace; the durable log absorbs bursts.
- Bounded buffers/blocking, prefetch/credit limits (RabbitMQ QoS), rate limiting enforce flow control.
- Options are buffer vs block vs shed vs scale out — each trades latency, throughput, and loss.

---

### 42. End-to-end exactly-once effect

**Frequency:** High

**Question:** Given that true exactly-once *delivery* is generally impossible, how do you achieve an exactly-once *effect* end-to-end?

**Answer:** Because networks and brokers realistically give **at-least-once** delivery (a lost ack triggers redelivery), the achievable goal is not one physical delivery but that each message's **effect on state happens exactly once** despite duplicates — you make the pipeline tolerate the duplicates rather than eliminate them. This combines two collaborating pieces. First, **deduplication**: producers stamp each message with a stable **unique/business ID** (or the broker assigns a sequence, as with Kafka's idempotent producer), and consumers keep a store of processed IDs so a re-seen ID is skipped. Second, **idempotent consumers**: the processing operation is designed so applying it twice equals applying it once — using upserts, conditional writes (`INSERT ... ON CONFLICT`, compare-and-set on a version), or naturally idempotent operations. The strongest guarantee comes when the **dedup check and the state change commit atomically in the same transaction** (e.g., write the processed-ID row and the business update together), closing the crash window between "processed" and "recorded as processed." Kafka's transactions/EOS give this within its ecosystem; across heterogeneous systems you assemble it yourself from unique IDs, an idempotency store, and transactional writes.

**Key points:**
- Delivery is at-least-once; aim for exactly-once *effect* — tolerate duplicates, don't prevent them.
- Dedup: stable unique/business message IDs + a store of processed IDs to skip repeats.
- Idempotent consumers: upserts / conditional (CAS) writes so re-applying is a no-op.
- Commit the dedup record and the state change in one transaction to close the crash gap; Kafka EOS does this in-ecosystem.

---

### 43. Rate-limiting algorithms

**Frequency:** High

**Question:** Compare token bucket, leaky bucket, and fixed- vs sliding-window rate limiting, and when you'd pick each.

**Answer:** All four cap request rate but differ in how they treat bursts and boundaries. **Token bucket** refills tokens at a steady rate up to a capacity; a request spends a token, so it allows short bursts (up to the bucket size) while enforcing a long-run average — the most common choice for APIs. **Leaky bucket** models a fixed-size queue drained at a constant rate, so it *smooths* output to a steady stream and clips bursts; good for protecting a downstream that needs even pacing. **Fixed window** counts requests per calendar interval (e.g., per minute) — trivial and cheap, but suffers a **boundary burst**: a client can send 2× the limit across the window edge. **Sliding-window log** keeps timestamps for exact accuracy at higher memory cost; **sliding-window counter** approximates by weighting the previous window, a good accuracy/cost balance. Consider:

- Token bucket: bursty-friendly, average-rate control.
- Leaky bucket: constant output, smooths spikes.
- Fixed window: cheap but edge bursts; sliding window fixes that.

**Key points:**
- Token bucket allows controlled bursts; leaky bucket enforces a smooth constant rate.
- Fixed window is cheapest but permits 2× bursts at window boundaries.
- Sliding-window log is exact but memory-heavy; sliding-window counter approximates cheaply.
- In distributed setups, back the counter with a shared store (Redis) and use atomic ops/Lua to avoid races.

---

### 44. Load-balancing algorithms

**Frequency:** High

**Question:** Compare round-robin, least-connections, consistent-hash, and power-of-two-choices / EWMA load balancing.

**Answer:** The algorithm decides which backend gets each request, trading simplicity for accuracy under heterogeneity. **Round-robin** (optionally weighted) cycles through servers — simple and fair only when requests and servers are uniform; it ignores actual load. **Least-connections** routes to the backend with the fewest in-flight requests, adapting to varying request costs and slow servers, but requires tracking live counts. **Consistent hashing** maps a key (user, session, cache key) to a server so the same key lands on the same node, minimizing remapping when the pool changes — essential for cache affinity and sticky routing. **Power-of-two-choices (P2C)** samples two random backends and picks the less loaded; it gets most of the benefit of "least-loaded" while avoiding the herd effect where everyone piles onto the single momentarily-idle server. Pairing P2C with an **EWMA** of latency (an exponentially weighted moving average) as the load signal lets the balancer favor genuinely fast backends and route around slow/degrading ones without global coordination.

**Key points:**
- Round-robin: simple, load-blind; least-connections adapts to in-flight load and slow nodes.
- Consistent hashing gives key/session affinity with minimal remap on membership change.
- P2C samples two, picks the lighter — near-optimal without the global-least-loaded herd effect.
- EWMA latency as the P2C signal routes around slow/degraded backends locally.

---

### 45. Hedged requests, deadlines, and timeout budgets

**Frequency:** High

**Question:** How do hedged requests, request deadlines, and a timeout budget propagated across a call chain improve tail latency and reliability?

**Answer:** These tackle the *tail* rather than the average. A **hedged request** sends a second (or backup) copy of a request after a short delay — typically the p95 latency — and takes whichever response returns first, cancelling the loser; this cheaply collapses the long tail caused by an occasional slow replica, at the cost of a few percent extra load (tie the trigger to a percentile so you only hedge the slow fraction). A **request deadline** is an absolute "must finish by" timestamp attached to the request, not a per-hop relative timeout. Propagating it downstream forms a **timeout budget**: each service subtracts elapsed time and passes the remaining budget on, so a call that has already spent most of its time won't start a downstream operation that cannot possibly finish in time — avoiding wasted work and cascading retries. Contrast with naive per-hop timeouts, which can sum to far more than the client is willing to wait and let doomed work continue. Together they bound end-to-end latency and stop retry storms.

**Key points:**
- Hedged requests fire a backup after ~p95, take the first response — collapses tail latency for a small load premium.
- Trigger hedging on a percentile so only the slow fraction is duplicated; cancel the loser.
- A deadline is an absolute finish-by time; propagate it so each hop knows the remaining budget.
- Budgets prevent doomed downstream work and per-hop timeouts summing beyond the client's patience.

---

### 46. Distributed caching patterns

**Frequency:** High

**Question:** Compare cache-aside, read-through, write-through, and write-behind caching patterns and their trade-offs.

**Answer:** These describe *who* populates the cache and *when* writes reach the store. **Cache-aside (lazy loading)**: the application checks the cache, on a miss reads the DB, then populates the cache — the cache stays out of the write path, so it is simple and resilient (a cache outage just means more DB reads), but the first request per key is slow and stale data is possible until TTL/invalidation. **Read-through**: the cache library itself loads from the backing store on a miss, centralizing that logic behind the cache API. **Write-through**: writes go to the cache and synchronously to the store, keeping them consistent and warm, but each write pays both latencies. **Write-behind (write-back)**: writes hit the cache and are flushed to the store asynchronously (often batched/coalesced), giving very low write latency and absorbing spikes, but risking data loss if the cache dies before flush and adding complexity. In practice cache-aside dominates reads; write-through/behind appear where write consistency or absorption matters.

- Read paths: cache-aside (app-managed) vs read-through (cache-managed).
- Write paths: write-through (sync, consistent) vs write-behind (async, fast, lossy).

**Key points:**
- Cache-aside is simplest and outage-tolerant but allows cold-start misses and staleness.
- Read-through moves miss-loading into the cache layer for cleaner app code.
- Write-through keeps cache and store consistent at the cost of write latency.
- Write-behind minimizes write latency and batches load but risks loss on crash before flush.

---

### 47. Cache stampede / thundering herd

**Frequency:** High

**Question:** What is a cache stampede (thundering herd), and how do you mitigate it?

**Answer:** A **cache stampede** happens when a hot key expires (or is cold) and many concurrent requests miss simultaneously, all hitting the backing store at once — the sudden load can overwhelm the DB and cascade into an outage, and if they all recompute and write back, the work is duplicated. Mitigations combine several ideas. **Request coalescing / single-flight**: only the first miss recomputes while concurrent callers for the same key wait for and share that result. **Locks / mutexes** (often a short-lived distributed lock in Redis) let exactly one worker rebuild the value while others serve stale data or briefly wait. **TTL jitter**: add randomness to expirations so keys that were populated together don't all expire in the same instant, spreading regeneration. **Early / probabilistic recompute**: refresh a value slightly *before* it expires (e.g., XFetch-style probabilistic early expiration based on recompute cost and remaining TTL) so it's renewed by one request while the old value is still served. Serving stale-while-revalidate is the common thread.

**Key points:**
- Stampede: simultaneous misses on a hot/expired key flood the backing store.
- Single-flight / request coalescing: one recompute, others share the result.
- Distributed lock: one rebuilder; others serve stale or wait briefly.
- TTL jitter desynchronizes expirations; probabilistic early recompute refreshes before expiry (stale-while-revalidate).

---

### 48. Cache consistency and invalidation

**Frequency:** Medium

**Question:** How do you keep a distributed cache consistent with the source of truth, and what are the main invalidation strategies?

**Answer:** Distributed caches are eventually consistent by nature, so the goal is to bound and control staleness. The baseline is **TTL expiration** — simple, self-healing, and bounding staleness to the TTL, but always serving data up to that stale. **Explicit invalidation** deletes or updates the key on write; deleting (invalidate-on-write) is usually safer than updating in place because concurrent writers can otherwise leave a stale value (a classic race where a slow reader repopulates an old value after a delete). **Write-through/write-behind** keep the cache authoritative on the write path. For cross-node or cross-service coherence, **event/CDC-driven invalidation** (publishing change events or tailing the DB change log) fans out invalidations reliably. **Versioning / key namespacing** sidesteps invalidation entirely by embedding a version or generation in the key so new writes produce new keys and old ones age out. Beware the delete-then-repopulate race — techniques like delayed double-delete or versioned writes address it. Choose based on how much staleness the domain tolerates.

**Key points:**
- TTL bounds staleness cheaply and self-heals but always serves up-to-TTL-stale data.
- Prefer invalidate-on-write (delete) over update-in-place to avoid stale-repopulation races.
- CDC/event-driven invalidation propagates changes across nodes and services reliably.
- Version/generation in the key avoids invalidation; watch the delete-then-repopulate race (double-delete/versioning).

---

### 49. API gateway vs service mesh / sidecar

**Frequency:** High

**Question:** What does an API gateway do, and how does that differ from a service mesh / sidecar like Envoy?

**Answer:** They operate on different traffic planes. An **API gateway** sits at the edge (north-south traffic) as the single entry point for external clients: it does TLS termination, authentication/authorization, rate limiting, request routing and aggregation, API versioning, and protocol translation (e.g., REST↔gRPC) — a centralized, client-facing policy and security layer. A **service mesh** governs internal service-to-service traffic (east-west) by deploying a **sidecar proxy** (commonly **Envoy**) next to each service instance; the app talks to its local sidecar and the mesh of sidecars (the **data plane**) transparently handles mTLS between services, retries, timeouts, circuit breaking, load balancing, and fine-grained traffic shaping (canary, mirroring), while a **control plane** (e.g., Istio) pushes configuration. The distinction: the gateway is one edge component for external traffic and coarse policy; the mesh is a distributed layer that offloads reliability, security, and observability from every internal service into infrastructure. They are complementary and often used together.

- Gateway: edge, north-south, external clients, centralized.
- Mesh/sidecar: internal, east-west, per-instance proxy, distributed.

**Key points:**
- API gateway = edge entry point: TLS, authN/Z, rate limiting, routing/aggregation, protocol translation.
- Service mesh = sidecar (Envoy) per instance handling east-west mTLS, retries, timeouts, LB, traffic shaping.
- Data plane (sidecars) enforces; control plane (e.g., Istio) distributes config.
- Complementary: gateway for external/coarse policy, mesh to offload cross-cutting concerns from services.

---

### 50. Chaos engineering

**Frequency:** Medium

**Question:** What is chaos engineering, and how do principles like blast radius and game days make it safe and useful?

**Answer:** Chaos engineering is the disciplined practice of **injecting controlled failures** into a system to build confidence that it withstands real-world turbulence — validating resilience empirically instead of assuming it. The method is scientific: define the system's **steady-state** behavior with metrics (latency, error rate, throughput), form a **hypothesis** that steady state holds during a fault, then inject a realistic failure (instance kill, added latency, dependency outage, resource exhaustion, network partition) and compare. The central safety control is **blast radius** — start small (one instance, a fraction of traffic, staging) and expand only as confidence grows, always with an abort/rollback so an experiment can't cascade into a real outage. **Game days** are scheduled exercises where teams run these experiments together (sometimes on production, ideally during business hours with people watching) to surface both technical weaknesses and gaps in monitoring, runbooks, and human response. The goal is not to break things randomly but to find weaknesses before they cause an incident.

**Key points:**
- Inject controlled, realistic failures to empirically verify resilience, not assume it.
- Scientific loop: define steady state, hypothesize, inject fault, compare against control.
- Blast radius: start small (one instance/fraction of traffic) with an abort switch; expand as confidence grows.
- Game days rehearse failures with the team to test tech, monitoring, runbooks, and human response.
