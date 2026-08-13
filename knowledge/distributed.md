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

---

### 51. Linearizability vs serializability vs strict serializability

**Frequency:** High

**Question:** Precisely distinguish linearizability, serializability, and strict serializability.

**Answer:** These are two orthogonal guarantees that people conflate. **Linearizability** is a *single-object*, real-time guarantee: each operation appears to take effect atomically at some point between its invocation and response, and that order respects real time — if op A completes before op B begins, A is ordered first. It says nothing about multi-operation transactions. **Serializability** is a *multi-object transaction* guarantee: the outcome equals *some* serial execution of the transactions, but that serial order need not match real time — a transaction can be ordered "in the past," so stale reads are legal. **Strict serializability** is the combination: transactions are serializable *and* the equivalent serial order respects real-time (non-overlapping) ordering. In short, linearizability = single-object + real-time; serializability = multi-object + any order; strict serializability = multi-object + real-time. Spanner targets strict serializability; classic snapshot databases offer neither in full.

**Key points:**
- Linearizability: single-object, atomic, real-time order (recency guarantee).
- Serializability: transactions equal some serial order, but order can ignore real time.
- Strict serializability = serializability + linearizability's real-time constraint.
- The two axes are orthogonal: recency vs transaction isolation.

---

### 52. Snapshot isolation and the write-skew anomaly

**Frequency:** High

**Question:** What guarantees does snapshot isolation provide, and why does write skew still occur?

**Answer:** Under **snapshot isolation (SI)**, each transaction reads from a consistent snapshot taken at its start time, so it never sees others' concurrent writes and never blocks on reads. At commit, an SI implementation applies the **first-committer-wins** rule: two concurrent transactions that write the *same* item conflict, and one aborts. This prevents dirty reads, non-repeatable reads, and lost updates, but SI is **not serializable**. The gap is **write skew**: two transactions read an overlapping set, each checks an invariant that currently holds, then each writes a *different* item based on that read. Because they touch disjoint items, first-committer-wins never fires, both commit, and the invariant is violated. Classic example: two doctors each checking "at least one doctor is on call" and both going off call. Fixes include **serializable snapshot isolation (SSI)**, which detects dangerous read-write dependency cycles and aborts, or explicit `SELECT ... FOR UPDATE` / materializing the conflict.

**Key points:**
- SI: consistent start-time snapshot, no read locks, first-committer-wins on same-item writes.
- Prevents dirty/non-repeatable reads and lost updates, but not serializable.
- Write skew: disjoint writes based on an overlapping read break an invariant.
- Remedies: SSI (detect rw-dependency cycles), explicit locking, or materialized conflicts.

---

### 53. MVCC in distributed databases

**Frequency:** High

**Question:** How does multi-version concurrency control work, and what changes when it goes distributed?

**Answer:** **MVCC** keeps multiple timestamped versions of each row instead of overwriting in place. A write creates a new version tagged with a commit timestamp; a read at snapshot time *t* returns the latest version with a timestamp ≤ *t*. This lets readers and writers proceed without blocking each other — readers never wait for writers and vice versa — which is what enables snapshot isolation. In a distributed store, versions are keyed by a global timestamp so a consistent snapshot can be read across shards: the challenge is generating monotonic, comparable timestamps cluster-wide. Systems use a **timestamp oracle** (Percolator's TSO), **hybrid logical clocks** (CockroachDB), or **TrueTime** (Spanner) to order versions. Old versions must be reclaimed by **garbage collection / compaction** once no active snapshot can still read them, tracked via a low-water mark. Distributed MVCC must also handle clock uncertainty (commit-wait) and cross-shard snapshot selection so reads see a transactionally consistent cut.

**Key points:**
- Multiple timestamped versions; reads pick latest version ≤ snapshot time.
- Readers and writers never block each other — foundation of snapshot isolation.
- Distributed: needs a global timestamp source (TSO, HLC, TrueTime) to order versions.
- GC/compaction reclaims versions below the oldest live snapshot's low-water mark.

---

### 54. Deterministic transactions: Percolator vs Calvin

**Frequency:** Medium

**Question:** Contrast Percolator-style and Calvin-style approaches to distributed transactions.

**Answer:** **Percolator** (Google, built over Bigtable) implements distributed transactions with **optimistic, client-driven two-phase commit** using MVCC and a timestamp oracle. It designates one written key as the **primary lock**; prewrite places locks and tentative versions on all keys, then committing the primary atomically makes the whole transaction visible, with secondaries lazily cleaned up (and crash recovery driven off the primary's state). It scales without a central coordinator but incurs lock/commit round-trips and read latency from the TSO. **Calvin** takes the opposite tack: a **deterministic** approach where a replicated log first fixes a global *total order* of transactions via consensus, then every replica executes that same sequence deterministically. Because the order is agreed up front, there is no distributed commit voting and no coordinator failures to resolve — replicas independently reach identical states. The cost is that transactions' read/write sets must be known in advance (reconnaissance queries if not) and long-running interactive transactions fit poorly.

**Key points:**
- Percolator: optimistic 2PC over MVCC, primary-lock protocol, TSO timestamps, no central coordinator.
- Calvin: order transactions first via consensus log, then execute deterministically everywhere.
- Determinism removes distributed commit voting and coordinator recovery.
- Calvin needs known read/write sets; Percolator adds lock and TSO round-trip latency.

---

### 55. Google Spanner architecture

**Frequency:** High

**Question:** Describe Spanner's architecture and how TrueTime enables its transactions.

**Answer:** Spanner shards data into **splits** (tablets); each split is replicated across zones/regions and each replica group runs **Paxos** to keep a consistent log, with one replica the Paxos **leader**. Reads/writes within a split go through its Paxos leader, which holds long-lived leader **leases**. Cross-split transactions use **two-phase commit layered on top of Paxos groups**: the participant leaders are the 2PC participants, so each phase is itself durably replicated — this removes 2PC's classic blocking-coordinator weakness because every participant is a fault-tolerant Paxos group. The keystone is **TrueTime**, an API returning an interval `[earliest, latest]` bounding real time using GPS/atomic clocks. At commit, Spanner picks a timestamp and performs **commit-wait** — it waits out the uncertainty ε before releasing locks — guaranteeing that a transaction's timestamp is in the past everywhere. This yields **external / strict serializability** and lets any replica serve consistent snapshot reads at a timestamp without locks.

**Key points:**
- Data in splits; each split replicated via a Paxos group with a leased leader.
- Cross-split writes: 2PC where each participant is itself a Paxos group (no single fragile coordinator).
- TrueTime returns a bounded interval; commit-wait sleeps out uncertainty ε.
- Result: externally (strictly) serializable transactions and lock-free snapshot reads.

---

### 56. Multi-Raft / multi-Paxos and sharded consensus

**Frequency:** High

**Question:** Why do scalable systems run many consensus groups, and what challenges does that create?

**Answer:** A single Raft/Paxos group has a hard ceiling: one leader orders every write, so throughput and data size are bounded by one machine. **Multi-Raft (or multi-Paxos)** partitions the keyspace into many ranges/shards, each its own independent consensus group with its own leader and replicated log (TiKV, CockroachDB, YugabyteDB). This scales linearly and spreads leadership across nodes. The trade-offs: (1) **heartbeat/message amplification** — thousands of groups each sending per-tick heartbeats, solved by batching or a shared "store"-level heartbeat; (2) **leader balancing** — a scheduler must distribute leaders evenly to avoid hotspots; (3) **split/merge** — ranges must dynamically split when large and merge when small, a delicate consensus-configuration change; (4) **cross-shard transactions** — anything spanning groups needs 2PC or a higher-level protocol since each group only guarantees order within itself. A placement driver / balancer coordinates membership, rebalancing, and split decisions across the fleet.

**Key points:**
- One consensus group is single-leader-bound; shard into many independent groups to scale.
- Each range = its own Raft/Paxos log and leader; leadership spread across nodes.
- Challenges: heartbeat amplification (batching), leader balancing, range split/merge.
- Cross-shard operations still require 2PC; a placement driver manages rebalancing.

---

### 57. Read-your-writes and monotonic reads across replicas

**Frequency:** High

**Question:** How are read-your-writes and monotonic-reads session guarantees implemented over replicas?

**Answer:** These are **session guarantees** that hide eventual-consistency anomalies from a single client without full linearizability. **Read-your-writes (RYW)** ensures a client always sees its own prior writes; **monotonic reads** ensures reads never go backward in time — once you've seen a value, later reads never return an older one. The common mechanism is a **version token** (a logical timestamp / write version / vector) the client carries: after a write, the client remembers the returned version; each subsequent read either targets a replica whose applied position is ≥ that version, or the replica **waits/blocks** until it has caught up, or the request is routed to the primary. Monotonic reads work the same way but the token records the highest version *read* so far, preventing a jump to a lagging replica. Sticky routing (pin a session to one replica) is a cheaper approximation but breaks on failover, so token-based tracking is more robust. These guarantees compose to give a coherent per-session view.

**Key points:**
- Session guarantees: per-client coherence without global linearizability.
- RYW: see your own writes; monotonic reads: never observe an older value than before.
- Mechanism: client carries a version token; replica must be caught up or it waits/reroutes.
- Sticky routing is a cheap approximation; token tracking survives failover.

---

### 58. Bounded staleness and tunable consistency

**Frequency:** Medium

**Question:** What is bounded staleness, and how do tunable consistency levels expose the latency/consistency trade-off?

**Answer:** **Bounded staleness** is a consistency level that lets reads lag the latest write, but only within an explicit bound — a time window (e.g., "at most 5 seconds stale") or a version count (e.g., "at most K versions behind"). It sits between strong and eventual consistency, giving low-latency, often local, reads while capping how wrong they can be, which is ideal for read-heavy workloads that tolerate slight lag. **Tunable consistency** exposes this as a knob. Dynamo-style stores let you set R and W such that **R + W > N** yields strong-ish quorum consistency, while smaller values trade consistency for latency/availability. Cassandra offers per-query levels (ONE, QUORUM, LOCAL_QUORUM, ALL); Cosmos DB offers five named levels including bounded staleness; Spanner offers exact-staleness and bounded-staleness snapshot reads that can be served locally without contacting the leader. The point is that consistency is a per-operation decision, not a fixed system property.

**Key points:**
- Bounded staleness: reads may lag but only within a time or version bound.
- Middle ground between strong and eventual; enables fast (often local) reads.
- Quorum tuning: R + W > N for strong reads; relax for lower latency/higher availability.
- Per-query/per-operation levels (Cassandra, Cosmos, Spanner stale snapshot reads).

---

### 59. Causal+ consistency and COPS

**Frequency:** Medium

**Question:** What does causal+ consistency add over causal consistency, and how does COPS track dependencies?

**Answer:** **Causal consistency** guarantees that operations related by potential causality (Lamport's happens-before) are seen in that order by all replicas, while concurrent operations may be ordered differently at different sites. Pure causal consistency permits replicas to *diverge* on concurrent conflicting writes indefinitely, so **causal+** adds **convergent conflict handling** (e.g., last-writer-wins or a merge function): all replicas eventually agree on the same value for conflicting writes *and* respect causal order — the strongest model achievable while staying **available** and partition-tolerant. **COPS** (Clusters of Order-Preserving Servers) realizes this across geo-replicated datacenters. Clients track **explicit dependencies**: each write records the versions of the values the client read before it (its causal history). When a write is replicated to a remote datacenter, that datacenter applies it only after all its listed dependencies are present locally (dependency checks). COPS keeps dependency lists compact by tracking only the nearest ("one-hop") dependencies, since transitivity covers the rest.

**Key points:**
- Causal+ = causal ordering + convergent conflict resolution (no permanent divergence).
- Strongest consistency compatible with availability under partitions (ALPS goals).
- COPS: clients attach explicit dependencies (versions read) to each write.
- Remote replicas apply a write only after its dependencies arrive; nearest-dependency compaction keeps metadata small.

---

### 60. Total-order (atomic) broadcast and consensus

**Frequency:** High

**Question:** What is total-order broadcast, and why is it equivalent to consensus?

**Answer:** **Total-order broadcast** (a.k.a. atomic broadcast) is a communication primitive delivering messages to all correct nodes in the **same total order**: every node delivers the same set of messages, and delivers them in an identical sequence (plus validity and integrity — nothing delivered was not sent, and no duplicates). This is exactly what you need to build a **replicated state machine**: feed each replica the same ordered command stream and, being deterministic, they end in identical states. Total-order broadcast is **equivalent to consensus** — each reduces to the other. To build broadcast from consensus, run one consensus instance per sequence slot, agreeing on the next message to deliver; to build consensus from broadcast, everyone broadcasts its proposal and each node decides the *first* delivered value (all see the same first message, so all decide identically). Consequently total-order broadcast is subject to the same **FLP** impossibility (no deterministic solution under pure asynchrony with one crash) and needs the same partial-synchrony/failure-detector assumptions. Raft's and ZAB's replicated logs are total-order broadcast implementations.

**Key points:**
- Atomic broadcast: all correct nodes deliver the same messages in the same order.
- It is the primitive behind replicated state machines (same ordered log → same state).
- Provably equivalent to consensus — each is reducible to the other.
- Inherits FLP limits; Raft/ZAB logs are concrete total-order broadcast systems.

---

### 61. Range vs hash vs directory partitioning

**Frequency:** High

**Question:** Compare range, hash, and directory (lookup) partitioning for a database at scale, and when each fits.

**Answer:** **Range partitioning** assigns contiguous key ranges to shards (e.g., `a–f`, `g–m`). It makes range scans and ordered queries cheap and rebalancing simple (split a hot range), but sequential keys (timestamps, auto-increment IDs) create **hotspots** as all recent writes land on one shard. **Hash partitioning** applies a hash to the key and maps it to a shard (often via consistent hashing or a fixed number of buckets), spreading load evenly and killing write hotspots — but it destroys locality, so range queries become **scatter-gather** across all shards. A common hybrid is a **compound key**: hash a prefix (tenant_id) for spread, range within it for locality. **Directory partitioning** keeps an explicit lookup table mapping keys/ranges to shards, giving maximum flexibility (arbitrary placement, easy migration) at the cost of an extra lookup and a table that must itself be highly available and cached.

**Key points:**
- Range: cheap ordered scans and easy splits, but sequential keys hotspot.
- Hash: even load, no write hotspots, but no locality — range queries fan out.
- Directory/lookup: explicit map, most flexible placement, extra hop + must be HA.
- Hybrid compound keys (hash prefix + range suffix) balance spread and locality.

---

### 62. Request routing to the right shard

**Frequency:** High

**Question:** How do clients or coordinators find which shard holds a given key in a partitioned system?

**Answer:** Three architectural approaches exist. **(1) Routing-aware clients**: the client library holds the partition map (or computes the hash) and connects directly to the owning node — one hop, but every client must track topology and map changes. **(2) A routing tier / coordinator nodes**: a stateless proxy layer (Vitess `vtgate`, a MongoDB `mongos`, a Redis Cluster proxy) receives any request, looks up the shard, and forwards it — clients stay dumb, and the tier centralizes rebalancing/failover awareness, at the cost of an extra network hop. **(3) Any-node forwarding**: a request hits any node, which redirects or forwards to the owner (Cassandra's coordinator node, Redis Cluster `MOVED`/`ASK` redirects). The shared problem is keeping the **routing metadata** fresh: it is typically stored in a strongly-consistent store (ZooKeeper/etcd) or gossiped, and clients cache it with invalidation so a stale map only costs a redirect, not incorrect results.

**Key points:**
- Client-side routing: fewest hops but every client tracks topology.
- Routing tier (vtgate/mongos): dumb clients, centralized rebalancing, one extra hop.
- Any-node forwarding: coordinator node or MOVED/ASK redirects.
- Routing metadata lives in etcd/ZooKeeper or gossip; clients cache with invalidation.

---

### 63. Distributed query execution (scatter-gather)

**Frequency:** High

**Question:** How does a query that spans partitions execute, and what makes scatter-gather expensive?

**Answer:** When a query isn't confined to a single shard (no partition key in the predicate, or an aggregate over all data), the coordinator does **scatter-gather** (fan-out): it sends the sub-query to every relevant shard in parallel, each executes locally, and the coordinator **merges** the partial results. Merging is cheap for unions but requires real work for `ORDER BY` (a k-way merge of pre-sorted streams), `LIMIT` (each shard must return up to N, then the coordinator trims), `GROUP BY`/aggregates (partial aggregates combined — `COUNT` sums, `AVG` needs sum+count, and exact `DISTINCT`/percentiles may need approximations like HyperLogLog). The dominant cost is **tail latency**: the query is as slow as the slowest shard, so p99 degrades as fan-out width grows, and one slow node stalls everything. Mitigations include limiting fan-out via good partition keys, hedged/backup requests, per-shard timeouts with partial results, and pushing filtering/aggregation down to each shard to shrink the data merged centrally.

**Key points:**
- Scatter-gather = fan-out sub-queries in parallel, then merge partials centrally.
- ORDER BY/LIMIT/GROUP BY need k-way merge, over-fetch, and combinable aggregates.
- Latency bounded by slowest shard; wider fan-out worsens tail (p99).
- Mitigate with good partition keys, hedged requests, timeouts, pushdown.

---

### 64. Cross-shard transactions without 2PC

**Frequency:** High

**Question:** How do large systems handle transactions spanning shards while avoiding classic distributed 2PC?

**Answer:** Distributed 2PC blocks on coordinator failure and holds locks across the network, so scale-out systems prefer alternatives. The first principle is **avoidance**: co-locate related data via a shared partition key (entity groups) so most transactions stay single-shard and use ordinary local ACID. When cross-shard is unavoidable, options include: **sagas** — a chain of local transactions with compensations, giving eventual atomicity without locks; **the outbox/transactional-messaging pattern** — commit the state change and an event atomically in one shard, then propagate asynchronously with idempotent consumers; and **deterministic / newer protocols** — Calvin-style deterministic ordering (FaunaDB) or Percolator-style optimistic snapshot transactions (TiDB) that use a timestamp oracle and MVCC to reduce lock duration. Google **Spanner** does keep a 2PC-over-Paxos but hides its cost with TrueTime and by making each participant a fault-tolerant group, so a "coordinator" crash doesn't block. The recurring theme: push atomicity into one shard, or trade strict isolation for availability via async compensation.

**Key points:**
- Prefer avoidance: co-locate with entity-group keys so txns stay single-shard.
- Sagas: local txns + compensations → eventual atomicity, no cross-net locks.
- Outbox/transactional messaging: atomic state+event, async idempotent delivery.
- Percolator/Calvin/Spanner: MVCC, deterministic order, or Paxos-group 2PC to dodge blocking.

---

### 65. Global vs local secondary indexes

**Frequency:** High

**Question:** In a partitioned database, contrast global and local secondary indexes and their trade-offs.

**Answer:** A secondary index lets you query by a non-partition attribute. A **local (document-partitioned) index** is stored alongside the data on each shard, indexing only that shard's rows. Writes are cheap and consistent (index update is local to the same shard as the row), but a query on the indexed attribute must **scatter-gather** across all shards because matching rows can live anywhere — good write path, expensive reads. A **global (term-partitioned) index** is itself partitioned by the indexed term, so all entries for a value live together; a lookup reads only the one or few shards owning those terms — fast, targeted reads. The cost is writes: inserting one row may touch a different shard than the base row, so keeping the index in sync needs a **distributed write** (often made asynchronous, so the global index is eventually consistent). DynamoDB's LSI vs GSI is the canonical example: LSI shares the partition and is consistent; GSI is separately partitioned and eventually consistent.

**Key points:**
- Local (document-partitioned): index co-located with data; cheap consistent writes, reads scatter-gather.
- Global (term-partitioned): index partitioned by term; targeted fast reads, cross-shard writes.
- Global indexes are usually updated asynchronously → eventual consistency.
- DynamoDB LSI (consistent, same partition) vs GSI (async, separate partition) illustrates it.

---

### 66. Auto-sharding and rebalancing

**Frequency:** Medium

**Question:** How do systems like Vitess and the MongoDB balancer automate sharding and rebalance data without downtime?

**Answer:** Automated sharding tooling manages the full lifecycle: splitting data into movable units, detecting imbalance, and migrating units live. Data is divided into **chunks/shards/tablets** — MongoDB splits collections into chunks by shard-key range; Vitess groups rows into keyspaces/shards addressed by a keyspace ID. A **balancer** monitors distribution (chunk counts, storage, or load) and, when a threshold is crossed, schedules **migrations**: the destination copies the chunk's data, catches up on changes streamed since the copy started, then a brief cutover flips ownership atomically in the metadata store and updates routing so future requests go to the new owner. Vitess `VReplication` and MongoDB's `moveChunk` both do copy-then-tail-then-cutover to keep the source serving throughout. Key concerns: choosing a **shard key** that avoids monotonic hotspots, moving small enough units to minimize cutover pause, throttling migrations so they don't starve live traffic, and updating the routing map atomically so no request is misrouted mid-move.

**Key points:**
- Data split into movable units (MongoDB chunks, Vitess shards/tablets).
- Balancer watches skew (count/storage/load) and schedules migrations on thresholds.
- Live migration: copy → tail incremental changes → atomic cutover + routing update.
- Shard-key choice, throttling, and small units keep rebalancing hotspot- and pause-free.

---

### 67. Multi-region and geo-distributed placement

**Frequency:** High

**Question:** How do you place data across regions, and what is the latency-versus-consistency trade-off?

**Answer:** Geo-distribution serves users near them and survives regional failure, but the speed of light makes cross-region round trips tens to hundreds of milliseconds — so placement is a latency/consistency negotiation. **Pinning (data residency / partition by region)**: put each record's home in the region that owns it (e.g., by user locale), giving fast local reads and writes plus GDPR-style residency, but cross-region access is slow and a region outage strands its data unless replicated. **Synchronous multi-region replication** (a quorum spanning regions, as in Spanner) keeps strong consistency and survives region loss, but every write pays cross-region latency. **Asynchronous replication** (single-leader with far followers, or multi-leader per region) makes writes fast and local but yields stale reads and, for multi-leader, write conflicts needing resolution (LWW/CRDTs). Practical designs mix these: partition data so most access is same-region, replicate synchronously only within a low-latency group of nearby regions, and keep a distant async replica for disaster recovery.

**Key points:**
- Cross-region RTT (tens–hundreds of ms) forces a latency vs consistency choice.
- Region-pinning: fast local + residency, but slow remote access and outage exposure.
- Sync multi-region (Spanner): strong + survives region loss, but every write pays RTT.
- Async / multi-leader: fast local writes, stale reads or conflicts; mix strategies per data.

---

### 68. Follower reads and read replicas

**Frequency:** High

**Question:** How do read replicas and follower reads scale read throughput, and what staleness issues arise?

**Answer:** Routing reads to **followers/replicas** offloads the leader and scales read-heavy workloads horizontally, but with asynchronous replication a follower may lag, so reads can return **stale** data — and worse, a user can violate **read-your-writes** (write to the leader, then read an older value from a lagging follower) or see values **go backwards** (monotonic-read violation) when hopping between replicas of different lag. Fixes target session guarantees: route a user's reads to the **leader for a short window** after their write; pin a session to one replica (monotonic reads); or use **bounded-staleness / consistent follower reads** where the client passes the timestamp/log position it needs and the follower waits until it has caught up to that point before answering (CockroachDB/Spanner follower reads read at a safe timestamp; MySQL uses GTID-based wait). The general trade-off: the more staleness you tolerate, the more read scale and lower latency you get; the tighter the freshness guarantee, the closer you drift back toward hitting the leader.

**Key points:**
- Follower reads scale read throughput but async lag causes stale reads.
- Risks: read-your-writes violations and non-monotonic (backwards) reads across replicas.
- Fixes: read-from-leader window, session pinning, bounded-staleness/timestamped waits.
- Freshness vs scale trade-off: tighter guarantees push reads back toward the leader.

---

### 69. Fan-out on write vs fan-out on read

**Frequency:** High

**Question:** For a timeline/feed, compare fan-out on write and fan-out on read, and when to use each.

**Answer:** A social feed must combine posts from everyone a user follows. **Fan-out on write (push)**: when a user posts, the system writes that post into each follower's precomputed timeline (an inbox per user). Reads are then trivial — one sequential read of your materialized timeline — so it favors read-heavy workloads with fast feed loads. The cost is write amplification: a post by someone with millions of followers triggers millions of inserts (the **celebrity/hot-key problem**) and wastes work on inactive users. **Fan-out on read (pull)**: nothing is precomputed; at read time you fetch recent posts from everyone you follow and merge them. Writes are cheap and there's no amplification, but reads are expensive scatter-gather that get slower as follow-counts grow. Large systems (Twitter/X-style) use a **hybrid**: push for ordinary users into follower inboxes, but pull for high-fan-out celebrities, merging their posts in at read time — bounding both write amplification and read cost.

**Key points:**
- Fan-out on write (push): precompute per-user timelines; cheap reads, write amplification.
- Celebrity/hot-key problem: millions of followers make push writes explode.
- Fan-out on read (pull): cheap writes, expensive merge-at-read that grows with follows.
- Hybrid: push for normal users, pull for celebrities merged in at read time.

---

### 70. Admission control and load shedding

**Frequency:** Medium

**Question:** What are admission control and load shedding, and how do they keep a system alive under overload?

**Answer:** Beyond capacity, throughput doesn't plateau — it collapses (congestion collapse): queues grow, latency explodes, requests time out and retry, and the added load worsens the spiral. **Admission control** decides *at the edge* whether to accept a request before it consumes scarce resources, while **load shedding** proactively rejects or degrades a fraction of traffic to keep the accepted fraction healthy — it's better to serve 90% well than 100% badly. Techniques: **rate limiting / concurrency limits** (token bucket, or adaptive limits that shrink when latency rises — Netflix concurrency-limits, TCP-Vegas-style); **priority-based shedding** — drop low-priority/ret, or non-critical work first and protect critical paths and paying users (Google's criticality levels); **queue management** — bounded queues with fast rejection (fail fast, don't let work sit past its deadline; LIFO or controlled-delay/CoDD dropping); and coordinating with clients via **backpressure and retry budgets with jitter** so rejected clients back off instead of hammering. Health checks and circuit breakers then stop routing to overwhelmed instances.

**Key points:**
- Past capacity, systems suffer congestion collapse; retries amplify the spiral.
- Admission control accepts/rejects at the edge; shedding drops a fraction to protect the rest.
- Adaptive concurrency limits, priority/criticality shedding, bounded fast-fail queues.
- Retry budgets + jitter and circuit breakers stop clients from hammering an overloaded system.

---

### 71. Graceful degradation and load shedding under overload

**Frequency:** High

**Question:** When a distributed service is overloaded, why is load shedding better than accepting all traffic, and how do you degrade gracefully?

**Answer:** Under overload, accepting every request drives queues, latency, and memory up until the whole service collapses and *everyone* gets errors — a worse outcome than serving most requests well. **Load shedding** deliberately rejects a fraction of traffic early (fast 429/503) so the accepted portion stays within capacity. Effective shedding is **prioritized**: drop low-value work first (e.g., background refresh, non-critical widgets) and protect critical paths (checkout, auth), often via request classes or per-tenant quotas. Signals that trigger it include queue depth, latency SLO breach, or concurrency limits (adaptive schemes like Netflix's concurrency-limits/TCP-Vegas-style probing). **Graceful degradation** complements this: serve cached/stale data, disable expensive features, return partial results, or fall back to a cheaper code path so the product stays usable. Shed at the edge to save downstream capacity, and always reject *before* doing expensive work.

**Key points:**
- Rejecting some traffic early beats collapsing and failing everything.
- Prioritize: shed low-value/background work, protect critical paths.
- Trigger on queue depth, latency SLO, or adaptive concurrency limits.
- Degrade with cache/stale data, feature toggles, partial results; shed at the edge, before expensive work.

---

### 72. Retry storms, exponential backoff with jitter, and thundering herd on recovery

**Frequency:** High

**Question:** How do naive retries amplify failures, and how do backoff, jitter, and retry budgets prevent retry storms?

**Answer:** When a dependency slows or fails, naive clients retry immediately and in lockstep, multiplying load exactly when the system is weakest — a **retry storm** that turns a blip into an outage, and synchronized retries create a **thundering herd** the moment the service recovers. Fixes work in layers. **Exponential backoff** spaces attempts (1s, 2s, 4s…) to reduce pressure; **jitter** (randomizing each delay, e.g., full jitter `random(0, base*2^n)`) de-synchronizes clients so they don't all hammer at the same instant. **Retry budgets / circuit breakers** cap retries as a percentage of live traffic (e.g., ≤10%) so aggregate retry load can't explode. Additional guards: only retry **idempotent** or safe operations, retry only on retryable errors (timeouts, 503 — not 400), bound total attempts, and avoid retry amplification across nested service tiers (retries at layer N × layer N-1). On recovery, ramp traffic gradually rather than all at once.

**Key points:**
- Naive lockstep retries amplify load and cause thundering herd on recovery.
- Exponential backoff spaces attempts; jitter de-synchronizes clients.
- Retry budgets/circuit breakers cap retries as a share of traffic.
- Retry only idempotent ops on retryable errors; bound attempts; avoid multi-tier amplification.

---

### 73. Cell-based architecture and shuffle sharding (blast-radius isolation)

**Frequency:** Medium

**Question:** How do cell-based architecture and shuffle sharding limit blast radius beyond a generic bulkhead?

**Answer:** A **cell** is a complete, independent copy of the stack (compute, cache, sometimes storage) serving a partition of customers; requests are routed to one cell and never span cells. A failure — bad deploy, poison request, hot tenant — is contained to that cell, so only a fraction of users are affected, and you can deploy/canary cell-by-cell. The limit of plain sharding is that a single bad tenant still takes down *its whole shard*. **Shuffle sharding** fixes this by assigning each customer a *random subset* of nodes (a virtual shard) rather than one fixed shard. With N nodes chosen k-at-a-time, the number of distinct combinations is huge, so two customers rarely share the *exact same* set of nodes; a tenant that poisons its nodes overlaps only partially with others, and clients retrying across their subset route around the damaged nodes. Combined, cells cap the blast radius and shuffle sharding makes per-tenant faults statistically isolated.

**Key points:**
- Cells are independent full-stack copies; failures and deploys are contained per cell.
- Plain sharding still lets one bad tenant sink its whole shard.
- Shuffle sharding gives each tenant a random node subset, so overlap between tenants is small.
- Together they shrink blast radius and statistically isolate noisy/poison tenants.

---

### 74. Health checks: readiness vs liveness, and preventing cascading failures

**Frequency:** High

**Question:** What is the difference between readiness and liveness probes, and how can bad health checks cause cascading failures?

**Answer:** **Liveness** answers "is this process broken and needs a restart?" — if it fails, the orchestrator kills and restarts the instance. **Readiness** answers "can this instance serve traffic right now?" — if it fails, the load balancer stops routing to it but does *not* restart it. Conflating them is dangerous: making liveness depend on a downstream (DB, cache) means that when the dependency blips, healthy pods get killed en masse, and the restart storm plus lost capacity turns a small problem into a **cascading failure**. Best practice: liveness should be shallow and self-contained (event loop responsive, no deadlock); readiness may check dependencies but should **fail open** or degrade rather than mark the whole fleet unready simultaneously. Use separate probes, sensible thresholds/timeouts to avoid flapping, and startup probes for slow-booting apps. Load balancers should also do **outlier detection** so a few sick instances are ejected without taking the pool down.

**Key points:**
- Liveness → restart the process; readiness → stop routing traffic (no restart).
- Don't tie liveness to downstreams — a blip triggers mass restarts and cascades.
- Keep liveness shallow/self-contained; readiness may check deps but fail open.
- Tune thresholds to avoid flapping; use startup probes and outlier detection.

---

### 75. Blue-green and canary deployments for distributed services

**Frequency:** High

**Question:** Compare blue-green and canary deployments and explain when each is appropriate for distributed services.

**Answer:** Both reduce deploy risk but differently. **Blue-green** runs two full environments: "blue" (current) serves traffic while "green" (new) is deployed and validated, then you flip the router to green — instant cutover with instant rollback (flip back). It's simple and gives a clean rollback, but doubles infrastructure briefly and exposes 100% of users at once if validation missed something. **Canary** releases the new version to a small slice of traffic (1% → 5% → 25% → 100%), watching key metrics (error rate, latency, saturation, business KPIs) and auto-rolling-back on regression — so a bad build harms few users. Canary needs good observability and automated analysis; it also must handle **mixed-version** running simultaneously, which demands backward/forward-compatible APIs and schemas (expand-contract migrations). Blue-green suits stateless, hard-to-canary changes; canary suits high-traffic services where gradual, metric-gated exposure matters. Both benefit from feature flags to decouple deploy from release.

**Key points:**
- Blue-green: two full envs, instant cutover and rollback; brief double cost, all-at-once exposure.
- Canary: gradual traffic shift with metric gating and auto-rollback; limits blast radius.
- Canary needs strong observability and backward/forward-compatible schemas (mixed versions).
- Blue-green for stateless/hard-to-canary changes; canary for high-traffic; feature flags decouple deploy from release.

---

### 76. Distributed rate limiting (global counters, token synchronization across nodes)

**Frequency:** High

**Question:** How do you enforce a global rate limit across many nodes without letting local per-node limits blow past the budget?

**Answer:** With N stateless nodes, a naive per-node limit lets total throughput reach N × the intended cap, so you need shared state or coordination. The common approach is a **centralized store** (Redis/Memcached) holding the counter/token bucket, updated atomically (e.g., a Lua script or `INCR`+TTL) so all nodes see one global count; the trade-off is a network hop and a dependency on that store's availability. To cut latency and load, use **local token buckets synced periodically**: each node holds a slice of the budget and reconciles with the central authority every interval, tolerating slight overshoot for much lower coordination cost. Alternatives include **sticky routing** so a key's requests hit the same node (making local limits authoritative) and **approximate/sliding-window** algorithms in the shared store. Key concerns: clock skew, hot keys (shard the counter), fail-open vs fail-closed when the store is unreachable, and choosing acceptable accuracy vs cost.

**Key points:**
- Independent per-node limits sum to N× the budget — you need shared state.
- Centralized atomic counter (Redis + Lua/INCR+TTL) is exact but adds a hop and a dependency.
- Local buckets synced periodically trade small overshoot for lower latency/coordination.
- Watch hot keys (shard), clock skew, and fail-open vs fail-closed; sticky routing can localize limits.

---

### 77. Leader failover, RTO/RPO, and minimizing recovery time

**Frequency:** High

**Question:** Define RTO and RPO, and explain what determines how fast and how lossless a leader failover can be.

**Answer:** **RTO (Recovery Time Objective)** is the maximum tolerable downtime — how long until service is restored; **RPO (Recovery Point Objective)** is the maximum tolerable data loss — how far back in time you may lose committed data. Failover speed (RTO) is dominated by **detection** (health-check/lease timeout — too aggressive causes false failovers, too lax lengthens outages), plus **election/promotion** time and the interval before clients discover the new leader (DNS TTL, connection draining, cache). RPO depends on replication mode: **synchronous** replication (leader commits only after a replica acks) gives RPO≈0 but costs write latency and can stall if the replica is down; **asynchronous** gives lower latency but loses the un-replicated tail on failover. To minimize recovery: use fast lease-based detection with sensible timeouts, pre-provisioned hot standbys, automated promotion, fencing of the old leader (see #78), and semi-sync or quorum acks to bound data loss. Always measure RTO/RPO with real failover drills, not assumptions.

**Key points:**
- RTO = max downtime; RPO = max data loss window.
- RTO driven by detection timeout + election/promotion + client re-discovery (DNS/drain).
- Sync replication → RPO≈0 but higher latency; async → faster writes but loses the tail.
- Minimize with hot standbys, automated promotion, fencing, quorum/semi-sync; validate via drills.

---

### 78. Split-brain resolution and fencing in practice (STONITH, epoch/fencing tokens)

**Frequency:** Medium

**Question:** Once a partition heals, how do you ensure the old leader can't corrupt data — what do STONITH and fencing tokens actually do?

**Answer:** Quorum prevents *two* active leaders, but a **zombie** old leader (paused by GC, on a slow network, or partitioned) may resume and issue writes believing it's still in charge. Two practical mechanisms fence it off. **STONITH** ("Shoot The Other Node In The Head") physically or logically isolates the suspect node — power off, reboot, or revoke its network/storage access via IPMI or a cloud API — before promoting the new leader, so it cannot touch shared resources. **Fencing tokens** attack the software path: each leadership grant carries a monotonically increasing **epoch/term** number; the leader stamps every request with its token, and the storage/resource **rejects any operation carrying a token older than the highest it has seen**. A revived old leader's stale token is refused, so its writes are safely dropped. Fencing must be enforced at the *resource* (DB, lock service, storage), not just trusted at the client. Systems like Pacemaker use STONITH; ZooKeeper/etcd expose epochs/`zxid` for token-based fencing.

**Key points:**
- Quorum stops two live leaders, but a paused/partitioned old leader can resume and write.
- STONITH isolates the suspect node (power/reboot/network revoke) before promoting a new leader.
- Fencing tokens = monotonic epoch stamped on requests; resource rejects stale tokens.
- Enforce fencing at the resource, not the client; Pacemaker/ZooKeeper/etcd provide these primitives.

---

### 79. Backup, restore, and point-in-time recovery in distributed databases

**Frequency:** Medium

**Question:** How do backups and point-in-time recovery work in a distributed database, and what makes restore hard at scale?

**Answer:** Durable backups combine **full snapshots** with a continuous **write-ahead log (WAL)** stream so you can restore a base image and then **replay the log up to any timestamp** — **point-in-time recovery (PITR)** — which is essential for recovering just before a bad deploy, accidental `DROP`, or logical corruption that plain replication would faithfully copy to replicas. In a distributed store, the hard part is a **consistent** snapshot across shards/nodes: independent per-shard backups may capture different moments, so you need a coordinated snapshot point (e.g., a global timestamp/LSN or a distributed snapshot barrier) so cross-shard state is consistent. Operationally: take backups from a replica to avoid loading the primary, store copies off-cluster/off-region (immutable, encrypted) to survive regional loss and ransomware, and monitor backup freshness. Critically, **the metric that matters is restore time, not backup success** — restore of terabytes is slow, so regularly *test restores* (and PITR to a chosen moment) to validate RTO and catch silent backup corruption.

**Key points:**
- Full snapshot + continuous WAL enables PITR to an arbitrary timestamp.
- Distributed backups need a coordinated/consistent snapshot point across shards (global timestamp/LSN).
- Store backups off-cluster/off-region, immutable and encrypted; take them from replicas.
- Test restores regularly — restore time (RTO), not backup success, is what counts.

---

### 80. Capacity planning and headroom for distributed systems

**Frequency:** Medium

**Question:** How do you plan capacity and headroom so a distributed system survives spikes and failures without over-provisioning?

**Answer:** Capacity planning sizes the system to meet demand at target latency/SLOs while retaining **headroom** for the unexpected. Start by finding the **per-unit capacity** via load testing to the knee of the latency curve (where latency rises sharply), not the point of collapse, then model demand from historical traffic, growth, and known events (sales, launches). Provision above peak so you keep **headroom** — commonly enough to absorb both a traffic spike *and* the loss of a failure domain (the **N+1 / N+2** rule: survive losing one/two AZs or instances while still meeting SLO). Watch the **utilization vs latency** relationship — queuing theory means latency climbs steeply past ~70–80% utilization, so that's your practical target, not 100%. Autoscaling handles elasticity but has limits: scale-up lag, cold starts, and downstream bottlenecks (a DB or connection pool that can't scale), so pre-scale for predictable spikes. Continuously validate with load tests, track saturation of the true bottleneck resource (CPU, connections, IOPS), and revisit as traffic grows.

**Key points:**
- Measure per-unit capacity by load testing to the latency knee, not collapse.
- Keep headroom to absorb spikes plus a lost failure domain (N+1/N+2).
- Target ~70–80% utilization — queuing makes latency spike near saturation.
- Autoscaling has lag/cold-start/downstream limits; pre-scale known events and track the true bottleneck.

---

### 81. gRPC/protobuf: streaming, deadlines, and schema evolution

**Frequency:** High

**Question:** What do gRPC's streaming modes, deadlines, and protobuf compatibility rules give you, and how do you evolve schemas safely?

**Answer:** gRPC runs RPCs over HTTP/2, so a single connection multiplexes many calls and supports four modes: unary, server-streaming, client-streaming, and bidirectional streaming — the streaming modes let you push incremental results or maintain a long-lived channel without repeated handshakes. Every call should carry a **deadline** (an absolute time propagated in metadata), not a local timeout: the deadline flows across hops so downstream services stop work once the caller has given up, cancellation propagates, and you avoid wasted compute. Backward-compatible protobuf evolution follows strict rules:

- Never reuse or renumber field tags; mark removed ones `reserved`.
- Add only optional fields; unknown fields are preserved on pass-through.
- Don't change a field's type or its wire semantics.

Because encoding is tag-based, new and old clients interoperate as long as tags are stable, enabling independent rolling deploys of clients and servers.

**Key points:**
- HTTP/2 multiplexing enables unary plus three streaming modes over one connection.
- Deadlines propagate across hops and trigger cancellation; prefer them over local timeouts.
- Protobuf compatibility: stable tags, reserved removals, additive optional fields only.

---

### 82. Service mesh internals: sidecar, mTLS, and traffic policy

**Frequency:** Medium

**Question:** How does a sidecar-based service mesh implement mTLS, retries, and timeouts, and what are the trade-offs of doing this at the mesh layer?

**Answer:** A mesh injects a **sidecar proxy** (e.g., Envoy) next to each app instance; all inbound/outbound traffic is transparently redirected through it via iptables/eBPF, so the application speaks plain localhost while the proxy handles the network. A **control plane** pushes config (via xDS APIs) to every data-plane proxy. **mTLS** is terminated proxy-to-proxy: the control plane issues short-lived certificates (SPIFFE identities), rotates them, and the sidecars mutually authenticate and encrypt without app changes, enabling zero-trust and identity-based authz. **Retries, timeouts, outlier detection, and circuit breaking** are enforced in the proxy, uniformly across languages, plus traffic shifting for canaries and fault injection. Trade-offs: an extra hop adds latency and each pod pays CPU/memory for its sidecar; retries configured at multiple layers can amplify load (retry storms), so budgets must be coordinated. Sidecar-less/ambient meshes push some functions to per-node proxies to cut overhead.

**Key points:**
- Sidecar intercepts traffic transparently; control plane distributes config via xDS.
- mTLS uses rotating short-lived SPIFFE identities for zero-trust, language-agnostic.
- Retries/timeouts at the mesh are uniform but risk retry amplification; sidecars add latency/cost.

---

### 83. Pub/sub vs point-to-point messaging

**Frequency:** High

**Question:** Contrast publish/subscribe with point-to-point messaging and explain when each pattern fits.

**Answer:** **Point-to-point** (queue/competing-consumers) delivers each message to exactly one consumer from a pool; it models **work distribution** — a task should be processed once, and adding consumers scales throughput while load-balancing. **Pub/sub** delivers each message to *every* interested subscriber via a topic; it models **event broadcast / fan-out**, decoupling one producer from many independent consumers who each get their own copy. The key difference is cardinality and coupling: queues couple a job to a single worker and naturally support back-pressure and retry of that one unit; topics let you add new subscribers without touching the producer, ideal for event-driven architectures and read-model updates. Many brokers blend both — Kafka consumer *groups* give pub/sub across groups but point-to-point (partition-per-consumer) within a group. Choose point-to-point for commands/tasks needing single processing; choose pub/sub for domain events that multiple bounded contexts react to independently.

**Key points:**
- Point-to-point: one message → one consumer; competing consumers scale task throughput.
- Pub/sub: one message → all subscribers; fan-out decouples producer from many consumers.
- Use queues for commands/work; topics for broadcast events; Kafka groups combine both.

---

### 84. Distributed scheduling and job coordination

**Frequency:** Medium

**Question:** How do you run cron-style jobs reliably at scale without duplicate or missed executions?

**Answer:** A naive cron on every node fires the job N times; a cron on one node is a single point of failure. Robust designs separate **scheduling** from **execution** and add coordination so exactly one trigger fires per interval. Common approaches: elect a **leader scheduler** (via a lease/consensus store) that owns firing decisions and hands work to a pool of stateless workers; or use a **distributed lock/lease** keyed by (job, time-window) so whichever node acquires it runs that occurrence while others skip. Persist scheduled state so a crash mid-run is recoverable, and make jobs **idempotent** because at-least-once firing is easier to guarantee than exactly-once. Track per-occurrence status to handle missed windows (misfire policies: skip, run-once-immediately, backfill). For horizontal scale, shard the schedule space across leaders. Systems like Kubernetes CronJobs, Quartz clustering, and Airflow follow these patterns, often with a durable store as source of truth.

**Key points:**
- Separate scheduling from execution; a leader or lock ensures one trigger per window.
- Persist occurrence state for recovery; define misfire/backfill policies.
- Make jobs idempotent since at-least-once is the realistic guarantee.

---

### 85. Coordination-avoidance and the CALM theorem

**Frequency:** Medium

**Question:** What does the CALM theorem say, and how does it guide designing systems that avoid coordination?

**Answer:** Coordination — locks, consensus, barriers — is the main enemy of availability and scalability because it forces nodes to wait on each other. The **CALM theorem** (Consistency As Logical Monotonicity) states that a program can be computed **consistently without coordination if and only if it is monotonic**: its output only grows as inputs arrive and never needs to be retracted. Monotone operations (set union, max, counting up, "has this ever been true") can run on any replica in any order and still converge — no coordination required. **Non-monotone** steps (deletion, negation, aggregation that must see all inputs, "is this the final total") introduce a point where you must wait, and that's precisely where coordination belongs. The design discipline: model state as grow-only/monotone structures (CRDTs, append-only logs), push non-monotone decisions to the edges, and add coordination *only* at those specific points rather than globally. This maximizes the coordination-free fast path.

**Key points:**
- CALM: consistency without coordination is achievable exactly for monotonic logic.
- Monotone ops (union, max, counters) converge in any order — no waiting.
- Isolate non-monotone steps (delete, negation, final aggregation) and coordinate only there.

---

### 86. SWIM protocol deep dive

**Frequency:** Medium

**Question:** How does SWIM detect failures and disseminate membership, and what does its suspicion mechanism add?

**Answer:** SWIM (Scalable Weakly-consistent Infection-style Membership) separates **failure detection** from **dissemination** to keep load flat as the cluster grows. Detection is randomized ping: each period a node pings one random member; if no ack arrives, it asks *k* other members to **ping-req** (indirect probe) that target, which routes around a single bad link or a transient drop before declaring anything. If both direct and indirect probes fail, the node is marked failed. The **suspicion mechanism** avoids false positives: instead of jumping straight to "dead," the node is marked **suspect** and this is gossiped; the suspect can **refute** it (with a higher incarnation number) if it's actually alive, and only after a timeout does suspect become confirmed dead. Membership updates (join/suspect/alive/dead) piggyback on the ping/ack messages ("infection-style" gossip), so dissemination costs no extra messages and spreads in O(log n) rounds with constant per-node load.

**Key points:**
- Randomized direct ping plus indirect ping-req (via k peers) tolerates single-path failures.
- Suspicion + incarnation numbers let live nodes refute, cutting false positives.
- Membership piggybacks on probes (infection-style), giving flat per-node load, log-n spread.

---

### 87. Anti-entropy and gossip tuning

**Frequency:** Medium

**Question:** How do fanout, rounds, and message style affect gossip convergence, and how do you tune the overhead?

**Answer:** Gossip spreads updates epidemically: each round a node contacts a random **fanout** of *b* peers. Convergence to all *n* nodes takes about **O(log n)** rounds, and increasing fanout speeds convergence only logarithmically while raising message volume linearly — so small fanout (often 2–4) already gives fast, robust spread; over-fanning wastes bandwidth. Three interaction styles trade cost differently: **push** is fast early but wastes messages once most nodes know; **pull** converges faster in the tail (nodes actively fetch missing state); **push-pull** combines both for the best convergence per round. **Anti-entropy** is the reliability backstop: periodically two nodes reconcile full state — using **Merkle trees** to compare only differing ranges — repairing anything rumor-mongering missed, which is why gossip is eventually consistent even under loss. Tuning levers: fanout, gossip interval, rumor "hot" TTL (how many rounds to keep forwarding), and anti-entropy frequency; balance faster convergence against CPU/bandwidth and redundant delivery.

**Key points:**
- Convergence ≈ O(log n) rounds; fanout speeds it logarithmically but costs linearly.
- Push vs pull vs push-pull trade early speed against tail convergence.
- Anti-entropy (Merkle-tree reconciliation) backstops lost rumors for eventual consistency.

---

### 88. Distributed configuration and feature-flag rollout

**Frequency:** Medium

**Question:** How do you propagate dynamic config and roll out feature flags safely across a fleet?

**Answer:** Dynamic config decouples behavior changes from deploys: a central store (etcd/Consul/ZooKeeper or a flag service) holds versioned config, and clients receive updates via **watch/long-poll or streaming** so changes take effect in seconds without restarts. Robust clients cache the last known value locally and **fail open** to it if the config service is unreachable, so a config-plane outage doesn't cascade. **Feature flags** add targeting: a flag can be evaluated per-user/segment with **percentage rollouts**, letting you ramp 1% → 10% → 100% and watch metrics, and instantly **kill-switch** back to 0% if something breaks — far cheaper than a rollback deploy. Best practices: version and audit every change, propagate atomically (avoid half-updated fleets by validating and staging), evaluate flags deterministically (hash user id) so a user's experience is stable, and monitor for flag-driven regressions. Treat long-lived flags as tech debt and clean them up.

**Key points:**
- Central versioned store + watch/streaming pushes changes in seconds, no redeploy.
- Clients cache and fail open so a config outage doesn't cascade.
- Percentage rollouts + deterministic targeting + kill-switch enable safe, reversible ramps.

---

### 89. Clock synchronization: NTP vs PTP and skew

**Frequency:** Medium

**Question:** How do NTP and PTP synchronize physical clocks, and how does residual skew affect ordering in distributed systems?

**Answer:** Physical clocks drift, so nodes sync to a reference. **NTP** hierarchically disciplines clocks over the general network, estimating offset and round-trip delay to a stratum server; it typically achieves millisecond accuracy over WAN and sub-millisecond on a LAN, but asymmetric/variable network delay limits precision. **PTP** (PTP/IEEE-1588) targets sub-microsecond accuracy using hardware timestamping in NICs/switches and a master-slave hierarchy, requiring supporting hardware — used in trading, telecom, and datacenters. Even after sync, **clock skew** (offset between two clocks) is never zero. This matters because you cannot safely order events across machines by comparing raw wall-clock timestamps: a "later" timestamp may come from a clock that's ahead, so last-write-wins can silently lose data, and leases/expiries can be misjudged. Systems therefore use logical/hybrid clocks for causality, and where they rely on physical time (e.g., TrueTime) they bound the uncertainty and **wait out** the error window to stay safe.

**Key points:**
- NTP: network-disciplined, ms-scale; PTP: hardware-timestamped, sub-microsecond.
- Residual skew is unavoidable; raw wall-clock timestamps can't safely order cross-node events.
- LWW/lease decisions on physical time are risky; bound uncertainty or use logical/hybrid clocks.

---

### 90. Lease-based coordination and safety under pauses

**Frequency:** High

**Question:** How do leases differ from locks, and how do lease renewal and fencing keep them safe under GC pauses?

**Answer:** A **lock** grants mutual exclusion indefinitely until released — but if the holder crashes or hangs, the lock can be held forever, so distributed locks need timeouts. A **lease** *is* a lock with a **time bound**: the grantor gives exclusive rights for a duration, and the holder must **renew** (heartbeat) before expiry to keep them; if it stops renewing, the lease lapses automatically and someone else can acquire it, so failures self-heal without a human. The danger is a **process pause** — a GC stop-the-world or VM freeze — where the holder believes it still owns a valid lease while wall-clock time has passed and the lease actually expired, letting a second holder start. Renewal alone can't prevent this. The fix is **fencing tokens**: each lease grant carries a monotonically increasing token, and the protected resource rejects any operation with a token older than the highest it has seen — so the paused old holder's writes are rejected even if it thinks it's still leader.

**Key points:**
- Lease = time-bounded lock; must renew before expiry or it lapses and self-heals.
- GC/VM pauses can make a holder act on an already-expired lease.
- Fencing tokens (monotonic) let the resource reject stale holders, ensuring safety.

---

### 91. Multi-level caching hierarchies

**Frequency:** High

**Question:** How do you design a multi-level cache hierarchy (client → CDN → edge → app → DB) and decide what belongs at each layer?

**Answer:** Cache as close to the reader as the data's volatility and personalization allow, pushing the cheapest, highest-hit-ratio traffic outward. Each layer trades freshness for latency and cost:

- **Client (browser/app):** immutable, user-private assets and API responses via `Cache-Control`/ETags — zero network cost but hardest to invalidate.
- **CDN:** static and cacheable-anonymous content served from POPs near users; use long TTLs plus content-hashed URLs for instant "invalidation."
- **Edge/reverse proxy (Varnish, edge workers):** short-TTL micro-caching of hot dynamic responses and personalization at the edge.
- **App/distributed cache (Redis/Memcached):** computed results, session/object caches, read-through for the DB.
- **DB:** buffer pool and materialized views as the last line.

Higher layers absorb the most volume with the loosest freshness; lower layers hold personalized, write-adjacent data with tighter consistency. Key discipline: define TTL and invalidation strategy per layer, avoid caching authenticated content on shared tiers, and measure per-layer hit ratio so each layer earns its keep.

**Key points:**
- Cache as far out as volatility/personalization permit; outer layers = highest volume, loosest freshness.
- Content-hashed URLs make CDN "invalidation" free; reserve shared tiers for anonymous/cacheable content.
- Lower layers hold personalized, write-adjacent data with tighter consistency.
- Set explicit TTL + invalidation per layer and track per-layer hit ratio.

---

### 92. Cache coherence across distributed caches

**Frequency:** High

**Question:** How do you keep multiple distributed cache nodes (and multi-region caches) coherent when data changes?

**Answer:** With many independent cache replicas there is no shared bus, so coherence is achieved by propagating **invalidation or new versions** rather than snooping. The common approaches: (1) **TTL-only** — accept bounded staleness, simplest and self-healing; (2) **explicit invalidation** — on write, publish a delete/update over a pub/sub channel (Redis keyspace notifications, Kafka) so every node evicts the key; (3) **write-through/write-behind** with a single authoritative tier fronting others. To avoid stale writes racing invalidations, attach a **version/generation number** (or updated-at timestamp) to each entry and reject overwrites with a lower version — this makes propagation idempotent and order-independent. Cross-region adds delay, so regions run eventually-consistent with async invalidation fan-out; critical reads bypass cache or use leases. Pitfalls: lost invalidation messages (mitigate with TTL as a backstop), the invalidate-then-repopulate race (repopulation reading stale DB), and dual-write inconsistency between DB and cache — often solved by driving invalidation from the DB change log (CDC/outbox).

**Key points:**
- No shared bus → propagate invalidations/versions via pub/sub or CDC, with TTL as a backstop.
- Version/generation numbers make updates idempotent and order-independent, preventing stale overwrites.
- Cross-region caches run eventually consistent; critical reads bypass or use leases.
- Watch invalidate-then-repopulate races and DB/cache dual-write drift; drive invalidation from the change log.

---

### 93. Consistent hashing: bounded loads and rendezvous (HRW)

**Frequency:** Medium

**Question:** Beyond basic consistent hashing, what do consistent hashing with bounded loads and rendezvous (HRW) hashing add?

**Answer:** Plain consistent hashing minimizes reshuffling when nodes join/leave, but virtual nodes still leave load imbalance, and a hot key or skewed keyspace can overload one node. **Consistent hashing with bounded loads** caps each node at a factor `c` times the average (e.g., 1.25×); if a key's primary node is at capacity, it spills to the next node on the ring. This guarantees no node exceeds the bound while keeping movement small — used by Google's Maglev/Vimeo-style balancers. **Rendezvous (Highest Random Weight) hashing** takes a different route: for a key, compute `hash(key, node)` for every node and pick the highest — no ring, no virtual nodes. It gives even distribution, and when a node is removed only its keys remap (to their next-highest node), each independently. HRW shines for small-to-medium node sets and weighted selection (scale weights into the score); the ring approach scales better to huge fleets and supports ordered successor lists for replication. Both minimize disruption; bounded loads adds fairness, HRW adds simplicity and per-key independence.

**Key points:**
- Bounded loads caps each node at `c×average` and spills overflow to the next node — fairness without heavy remapping.
- Rendezvous/HRW: pick the node with the highest `hash(key,node)`; no ring or vnodes needed.
- HRW gives even, weighted distribution and independent per-key remap; ideal for smaller fleets.
- Ring scales to huge fleets with successor lists for replicas; both minimize reshuffling on membership change.

---

### 94. Idempotency and dedup infrastructure at scale

**Frequency:** High

**Question:** How do you build shared idempotency-key and deduplication infrastructure that many services can rely on at scale?

**Answer:** The pattern is to make retries safe by remembering "have I already processed this request/message?" Clients supply an **idempotency key** (a UUID per logical operation); the service records it in a **dedup store** with the operation's result before or atomically with committing side effects. On a retry, a hit returns the stored response instead of re-executing. Building this at scale requires: a fast, sharded key-value store (Redis/DynamoDB) keyed by idempotency key with a **TTL** matching the retry window; an atomic **insert-if-absent** (conditional write / `SETNX`) to win a race between concurrent duplicates; and a **status field** (in-progress vs completed) so a second concurrent attempt waits or rejects rather than double-executing. Store the response payload for exactly-once *effect*. Scope keys per tenant/endpoint to avoid collisions. For streaming, dedup on message IDs in a windowed store (Bloom filter + backing store for space). Trade-offs: the store must be at least as durable as the side effect, TTLs bound memory but reopen the dedup window, and hot keys need the same sharding care as any KV workload.

**Key points:**
- Idempotency key per logical op + dedup store recording result → retries return cached response.
- Atomic insert-if-absent (SETNX/conditional write) plus in-progress/completed status handles concurrent duplicates.
- TTL bounds storage but must exceed the retry window; scope keys per tenant/endpoint.
- Dedup store must be as durable as the side effect; streaming dedups on message IDs (Bloom + backing store).

---

### 95. Distributed logging and log aggregation architecture

**Frequency:** Medium

**Question:** How do you architect log collection, buffering, and indexing for a large distributed system?

**Answer:** Logs are high-volume, bursty, and must survive downstream slowdowns, so the pipeline is staged. **Collection:** a lightweight agent per host/pod (Fluent Bit, Vector, Filebeat) tails files or reads stdout, adds metadata (host, service, trace ID), and forwards — apps emit **structured JSON** so fields are queryable. **Buffering:** a durable message bus (Kafka/Kinesis) decouples producers from indexers, absorbs spikes, and provides replay if the indexer falls behind or fails; agents also buffer to local disk to tolerate bus outages. **Processing:** stream processors parse, enrich, redact PII, and route by class. **Indexing/storage:** hot data goes to a search index (Elasticsearch/OpenSearch or Loki, which indexes labels not full text for cheaper storage), with tiered retention rolling old data to cheap object storage. **Query/visualization:** Kibana/Grafana. Cross-cutting concerns: correlation via trace/request IDs, backpressure so logging never blocks the app, sampling of high-volume debug logs, and cost control since indexing dominates spend. The bus-in-the-middle design is what makes it resilient at scale.

**Key points:**
- Staged pipeline: agent collection → durable bus (Kafka) buffering → stream processing → index/storage → query.
- Emit structured JSON with trace/request IDs so logs are queryable and correlatable.
- The message bus decouples producers from indexers, absorbs bursts, and enables replay; agents buffer to disk too.
- Control cost with tiered retention, sampling, and label-based indexing (Loki); never let logging block the app.

---

### 96. Metrics and monitoring at scale

**Frequency:** High

**Question:** How do metrics systems scale, and how do you handle push vs pull, high cardinality, and aggregation?

**Answer:** Metrics are cheap numeric time series (unlike logs), collected on a fixed interval. **Pull** (Prometheus scrapes targets) makes the monitor authoritative about what's up, simplifies discovery, and naturally detects a target being down; **push** (StatsD, OpenTelemetry → gateway) suits short-lived jobs, serverless, and clients that can't be scraped, at the cost of the collector needing to know expected senders. Many systems use both (push gateway for batch jobs, pull for services). The dominant scaling problem is **cardinality**: each unique combination of label values is a distinct series, so putting user IDs, request IDs, or unbounded values in labels causes a cardinality explosion that blows up memory and storage. Mitigate by keeping labels low-cardinality (status, endpoint template, region), using **histograms/summaries** for latency rather than per-request series, and aggregating early. At fleet scale you shard/federate (Thanos, Cortex, Mimir) for horizontal scale, long-term storage, and a global query view, and pre-aggregate with recording rules. Alert on symptoms (SLOs, error budgets) computed from aggregates, not raw high-cardinality data.

**Key points:**
- Pull (Prometheus) = monitor-driven discovery + up/down detection; push suits short-lived/serverless jobs — often both.
- Cardinality is the killer: never put unbounded IDs in labels; keep label sets small and bounded.
- Use histograms/summaries for latency and aggregate early instead of per-request series.
- Federate/shard (Thanos/Cortex/Mimir) for scale and long-term storage; pre-aggregate with recording rules and alert on SLOs.

---

### 97. Authentication and authorization in distributed systems

**Frequency:** High

**Question:** How do you handle authentication and authorization across many services — tokens, mTLS, and zero-trust?

**Answer:** Distributed systems separate **who you are** (authN) from **what you may do** (authZ), and must verify both at every hop without a shared session. At the edge, users authenticate (OIDC/OAuth2) and receive a short-lived, signed **JWT** carrying identity and scopes; downstream services validate the signature (via JWKS) statelessly rather than calling an auth server per request, trading instant revocation for scalability (mitigated with short TTLs + refresh, or a revocation list for high-value tokens). For **service-to-service** identity, **mTLS** gives each service a certificate so both ends authenticate cryptographically — typically automated by a service mesh (SPIFFE/SPIRE issues short-lived SVIDs). This underpins **zero-trust**: never trust the network, authenticate and authorize every request regardless of origin, and grant least privilege. AuthZ itself can be centralized as policy (OPA/Rego, RBAC/ABAC) evaluated locally per service for low latency. Pitfalls: don't put secrets or overly broad scopes in tokens, propagate the caller's identity (not just the service's) for end-user authorization, and rotate keys/certs automatically.

**Key points:**
- Separate authN (identity) from authZ (permissions); verify both at every hop, no shared session.
- Short-lived signed JWTs validated statelessly via JWKS; short TTLs (or revocation lists) offset weak revocation.
- mTLS (SPIFFE/SPIRE via a mesh) authenticates service-to-service; foundation of zero-trust least privilege.
- Externalize policy (OPA/RBAC/ABAC) evaluated locally; propagate end-user identity and auto-rotate keys/certs.

---

### 98. Long-running processes: sagas vs workflow engines

**Frequency:** High

**Question:** For long-running, multi-step processes, when do you hand-roll a saga versus adopt a workflow engine like Temporal or Cadence?

**Answer:** Both coordinate multi-step business processes that span services and time and cannot hold a distributed transaction. A **saga** is a pattern: a sequence of local transactions where each step has a **compensating action** to undo prior work on failure, coordinated either by **choreography** (services react to each other's events — decentralized, but hard to trace as it grows) or **orchestration** (a central coordinator issues commands). You can implement a saga yourself over a message bus, but you then own the hard parts: durable state, timers, retries, exactly-once step execution, and visibility. **Workflow engines** (Temporal, Cadence, AWS Step Functions) provide exactly those as infrastructure: you write the workflow as ordinary code, and the engine persists every step's state and results, transparently replaying/resuming after crashes so the workflow survives process death for days or months. It handles retries, timers, and versioning. Rule of thumb: a simple 2–3 step flow can be a hand-rolled orchestrated saga; complex, long-lived, heavily branched processes with many failure modes justify an engine, which essentially gives you durable sagas plus tooling for free.

**Key points:**
- Saga = local transactions + compensations; choreography (event-driven, decentralized) vs orchestration (central coordinator).
- Hand-rolling a saga means owning durable state, timers, retries, exactly-once, and visibility yourself.
- Workflow engines (Temporal/Cadence/Step Functions) persist and replay state so workflows survive crashes for days/months.
- Simple short flows → hand-rolled saga; complex, long-lived, branchy processes → engine (durable sagas + tooling).

---

### 99. Designing idempotent, resumable workflows

**Frequency:** Medium

**Question:** How do you design a long-running workflow to be idempotent and resumable — checkpointing, retries, and compensation?

**Answer:** A resumable workflow must survive a crash at *any* point and continue without repeating completed side effects. The core techniques: **checkpoint** durable state after each step (in a DB or the engine's event history) so a restart knows exactly where it stopped; make each step **idempotent** so re-executing after an ambiguous failure is harmless — use idempotency keys, conditional writes, or check-before-act so "did it complete?" is answerable. Retries use **exponential backoff with jitter** and a bounded budget, distinguishing retryable (transient) from terminal errors so a poison step doesn't loop forever. For steps that cannot be undone by retry, define **compensating actions** to roll back completed work when a later step fails (the saga discipline). Timers/heartbeats detect stuck steps. Workflow engines implement much of this via deterministic **replay**: they re-run the workflow code and short-circuit already-completed activities from the recorded history, which requires workflow logic to be deterministic (no direct clocks, random, or I/O — those go through the engine). The result is exactly-once *effect* despite at-least-once execution.

**Key points:**
- Checkpoint durable state per step so a restart resumes exactly where it stopped.
- Make each step idempotent (idempotency keys / conditional writes / check-before-act) for safe re-execution.
- Retry with exponential backoff + jitter and a bounded budget; separate retryable from terminal errors.
- Compensate non-retryable steps (saga); engines use deterministic replay from history — keep workflow logic deterministic.

---

### 100. Designing a large distributed system end-to-end

**Frequency:** High

**Question:** Walk through designing a large-scale distributed system end-to-end, tying together the concepts above.

**Answer:** Start from requirements: functional scope, scale (QPS, data size, growth), read/write ratio, latency SLOs, and consistency needs — these drive every trade-off. Sketch the **data model and access patterns**, then pick storage: partition (shard, often via consistent hashing) for horizontal scale and replicate for availability, choosing per-dataset where you sit on CAP/PACELC (strongly-consistent core, eventually-consistent periphery). Put a **caching hierarchy** in front of hot reads (client/CDN/edge/app) with clear TTL and invalidation, and absorb write and cross-service load through **async messaging** (a durable log) for decoupling and backpressure. Coordinate multi-step operations with **sagas or a workflow engine**, and make every mutating path **idempotent** with dedup keys for safe retries. Wrap it in resilience — timeouts, retries with jitter, circuit breakers, bulkheads, load shedding — and secure it with **zero-trust** (mTLS, short-lived tokens, least-privilege authZ). Make it observable end-to-end: structured logs, low-cardinality metrics with SLO alerting, and distributed tracing via propagated IDs. Finally, plan for scale and failure explicitly — capacity headroom, multi-AZ/region, graceful degradation, and chaos testing. State assumptions and defend trade-offs; there is no single right answer, only ones justified by the requirements.

**Key points:**
- Drive every decision from requirements: scale, read/write mix, latency SLOs, and consistency needs.
- Partition + replicate storage; place each dataset deliberately on the CAP/PACELC spectrum.
- Layer caching and async messaging for read scale, decoupling, and backpressure; coordinate with sagas/workflow engines and idempotency.
- Build in resilience, zero-trust security, and end-to-end observability; plan explicitly for failure and defend trade-offs.
