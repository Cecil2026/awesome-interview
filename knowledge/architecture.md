# Architecture & System Design Questions

100 high-frequency questions on software architecture, distributed-systems patterns, scalability, reliability, data modeling, and classic system-design exercises.

---

### 1. Monolith vs microservices vs modular monolith

**Answer:** A monolith ships as one deployable; simple to develop, deploy, and reason about, but couples team velocity and scaling. Microservices decompose by bounded context, allowing independent deploys, polyglot stacks, and per-service scaling at the cost of operational complexity (network failures, distributed tracing, data consistency, deploy pipelines). The modular monolith keeps a single deployment but enforces module boundaries via package/assembly structure with explicit interfaces; you get refactor safety without the distributed-system tax. Default to modular monolith until team size, deploy cadence, or scale forces extraction. Microservices pay off when team count exceeds Dunbar-ish limits, services have wildly different scaling profiles, or compliance demands isolation.

**Key points:**
- Conway's law dominates: architecture mirrors org structure.
- Microservices add latency, partial failure, eventual consistency.
- Modular monolith captures most modularity benefits with one deploy.
- Extraction cost is high; prove the seam before splitting.

---

### 2. SOA vs microservices

**Answer:** SOA emerged in the 2000s around enterprise integration: heavy ESBs, canonical XML schemas, WS-* contracts, and shared databases were common. Microservices borrow the "service" abstraction but invert several defaults: smart endpoints/dumb pipes (no ESB orchestration), decentralized data ownership (no shared schema), polyglot persistence, lightweight HTTP/gRPC contracts, and continuous delivery per service. SOA optimizes for enterprise reuse and governance; microservices optimize for team autonomy and deploy velocity. In practice the line blurs once you add a service mesh or API gateway, but the cultural defaults (who owns the schema, where business logic lives) remain the real distinction.

**Key points:**
- ESB vs dumb pipes is the architectural fork.
- SOA shares data; microservices own data per service.
- Microservices assume CD and container orchestration.
- Both can be done well or poorly; labels matter less than coupling.

---

### 3. Event-driven architecture

**Answer:** Services communicate by publishing immutable events rather than calling each other synchronously. Producers don't know consumers, enabling loose coupling, temporal decoupling (consumers process at their own pace), and easy fan-out for new use cases. Tradeoffs: harder to reason about end-to-end flows, eventual consistency, need for idempotent consumers, replay/DLQ tooling, and schema evolution discipline (Avro/Protobuf with a registry). Choose EDA when workflows are inherently async, you need multiple downstream reactions to the same fact, or you want to decouple write paths from read models (CQRS). Avoid it for simple request/response where strong consistency and immediate confirmation are required.

**Key points:**
- Events are facts; commands are intents.
- Requires schema registry, DLQ, idempotency keys.
- Enables CQRS, event sourcing, audit by default.
- Tracing across hops needs correlation IDs and OpenTelemetry.

---

### 4. CQRS

**Answer:** Command Query Responsibility Segregation splits the write model (commands that mutate state, validated against invariants) from the read model (queries optimized for specific views). Writes hit a normalized store; events or change data capture project denormalized read models tailored per query (search index, cache, materialized view). Benefits: independent scaling of read vs write, simpler read code, ability to evolve read models without touching writes. Costs: eventual consistency between sides, more moving parts, projection rebuild logic. Use CQRS where read/write asymmetry is large or you have many distinct query shapes; don't apply to simple CRUD.

**Key points:**
- Two models, often two databases.
- Reads are eventually consistent vs writes.
- Pairs naturally with event sourcing but doesn't require it.
- Watch out for read-your-writes UX issues.

---

### 5. Event sourcing

**Answer:** Persist state as an append-only log of domain events; current state is derived by folding events. Gives perfect audit, time travel, and the ability to add new projections from history. Aggregates are rehydrated by replaying their event stream (with snapshots for performance). Challenges: schema/versioning of events forever, GDPR erasure (crypto-shredding), complex queries (needs CQRS read models), and steep learning curve. Best fit: domains where history is a first-class business concern (finance, ledgers, regulatory) or where multiple consumers need the same facts. Avoid for simple CRUD or when team lacks operational maturity.

**Key points:**
- Events are immutable and append-only.
- Snapshots speed up aggregate rebuilds.
- GDPR needs crypto-shredding or tombstones.
- Almost always combined with CQRS.

---

### 6. Hexagonal / ports-and-adapters

**Answer:** Application core defines ports (interfaces) for everything it needs (DB, message bus, HTTP). Adapters implement those ports for specific tech. The core has no dependency on frameworks or I/O, making it trivially unit-testable and swappable across delivery mechanisms (HTTP, CLI, queue consumer). Tradeoff: more boilerplate and indirection, easy to over-abstract. Most valuable when the domain logic is rich and long-lived, or when you anticipate multiple delivery channels. For thin CRUD services, the ceremony is overkill—use the framework's defaults.

**Key points:**
- Domain core is framework-agnostic.
- Drivers (HTTP, CLI) and driven (DB, broker) adapters.
- Enables fast tests with in-memory adapters.
- Easy to over-engineer; apply where domain warrants.

---

### 7. Clean architecture (Uncle Bob)

**Answer:** Concentric layers where dependencies point only inward: entities (enterprise rules), use cases (application rules), interface adapters (controllers, presenters, gateways), and frameworks/drivers (web, DB, UI). Outer layers depend on inner via interfaces (Dependency Inversion). Similar in spirit to hexagonal but more prescriptive about layering. Strength: business rules are isolated and testable; framework upgrades don't ripple. Weakness: lots of mapping between layers (DTOs everywhere), and small services get bloated. Apply selectively—keep the dependency rule, drop the strict four-layer template when it adds noise.

**Key points:**
- Dependency rule: inward-only.
- Use cases orchestrate entities; adapters translate.
- DTOs and mappers proliferate—watch the cost.
- Best for complex, long-lived domain logic.

---

### 8. DDD: bounded contexts, aggregates, ubiquitous language

**Answer:** Domain-Driven Design tackles complexity by modeling around the business. A bounded context defines an explicit boundary where a model and its ubiquitous language are consistent—the same word (Customer, Order) can mean different things in different contexts. Aggregates are consistency boundaries: a root entity plus the objects whose invariants must be enforced together in a single transaction. Cross-aggregate consistency is eventual, via domain events. Bounded contexts often map to service boundaries; context maps document relationships (shared kernel, customer/supplier, anti-corruption layer). Done well, DDD aligns code and conversation; done as ceremony, it produces anemic models with extra classes.

**Key points:**
- Ubiquitous language: code matches business vocabulary.
- Aggregates = transactional/consistency boundary.
- Bounded context often = service boundary.
- Context map captures inter-context relationships.

---

### 9. Strangler fig migration

**Answer:** Incrementally replace a legacy system by routing specific functionality to new services while the old system runs alongside, until the legacy is fully strangled and removed. A facade or proxy (often the API gateway or a reverse proxy) decides per-request whether to hit old or new. Lets you ship value continuously, reduces big-bang risk, and provides rollback per slice. Risks: prolonged dual-running, data sync between old and new, drift in business rules. Pair with feature flags, dual writes (carefully) or CDC, and a clear sunset plan per module. Track the "% strangled" as a leading metric.

**Key points:**
- Proxy routes traffic incrementally.
- Avoids big-bang rewrite risk.
- Requires data sync strategy (dual write or CDC).
- Set explicit sunset milestones.

---

### 10. Anti-corruption layer

**Answer:** A translation layer between your bounded context and an external/legacy model that prevents the foreign model from leaking into your domain. Implemented as a set of adapters and translators that map external concepts to your ubiquitous language. Critical when integrating with legacy systems, third-party APIs, or contexts owned by another team. Costs: extra mapping code, performance overhead, maintenance when the external model changes. Skip for trivial integrations; apply when the external model is messy, unstable, or culturally different from yours. Often lives at the edge of a strangler fig migration.

**Key points:**
- Protects domain purity from foreign models.
- Implemented via adapters and translators.
- Essential during legacy migrations.
- Costs maintenance—justify per integration.

---

### 11. BFF pattern

**Answer:** Backend-for-Frontend places a dedicated API tier per client type (web, iOS, Android, partner). Each BFF aggregates downstream microservices, shapes payloads to the client's needs, handles client-specific auth flows, and avoids the "one API to rule them all" compromise that bloats payloads and slows mobile clients. Owned ideally by the same team that owns the client. Tradeoffs: more services to operate, potential logic duplication across BFFs (extract shared libs/services), and tighter coupling between BFF and client release cycles. GraphQL can sometimes replace BFFs by letting clients project the fields they need.

**Key points:**
- One backend per client experience.
- Reduces over-fetching and round trips.
- Owned by the client team.
- GraphQL is an alternative for some use cases.

---

### 12. Sidecar pattern

**Answer:** A helper process deployed alongside the main application in the same pod/host, sharing lifecycle and network namespace. Common uses: service mesh proxies (Envoy), log shippers, config reloaders, secret fetchers. The app stays focused on business logic; cross-cutting concerns live in the sidecar and can be upgraded independently. Costs: extra resource overhead per pod, deploy complexity, debugging "who handled this request" (app vs sidecar). Best when the helper is reusable across many services and infrastructure team owns it. Avoid for one-off needs that belong in the app.

**Key points:**
- Co-located helper process.
- Shares network/storage with main container.
- Powers service meshes, log shipping, secrets.
- Adds per-pod overhead—measure.

---

### 13. Ambassador pattern

**Answer:** A proxy that runs alongside (or as a sidecar to) a client and handles outbound concerns: service discovery, retries, circuit breaking, TLS, observability. The app talks to localhost; the ambassador handles the network. Lets you upgrade networking behavior without touching app code and supports legacy clients that can't be modified. Differs from sidecar (general co-located helper) in being specifically a network proxy for outbound calls. Service mesh data planes generalize this. Tradeoffs: extra hop, debugging complexity, requires platform investment.

**Key points:**
- Outbound proxy co-located with client.
- Handles retries, TLS, discovery.
- Decouples networking from app code.
- Service meshes generalize it.

---

### 14. Service mesh (Istio/Linkerd)

**Answer:** Infrastructure layer that handles service-to-service communication via sidecar proxies (data plane) controlled by a central control plane. Provides mTLS, traffic shifting (canary, blue/green), retries, timeouts, circuit breaking, fine-grained authZ, and rich telemetry without app code changes. Tradeoffs: significant operational complexity, latency overhead per hop (~1-5ms), resource cost per pod, and yet another component to debug. Istio is feature-rich and heavy; Linkerd is leaner and Rust-based. Adopt when you have many services, multiple languages, and a platform team to operate it. Otherwise stick to library-based resilience (e.g., gRPC retries, Resilience4j).

**Key points:**
- Data plane (sidecars) + control plane.
- Provides mTLS, traffic policy, telemetry.
- Linkerd lighter; Istio more featureful.
- Justify with service count and team capacity.

---

### 15. Saga (orchestration vs choreography)

**Answer:** A saga coordinates a long-running business transaction across services as a sequence of local transactions with compensating actions if a step fails. Orchestration: a central orchestrator (e.g., Temporal, Camunda) explicitly calls each step and triggers compensations on failure—visible flow, easier debugging, but the orchestrator is a coupling point. Choreography: each service reacts to events and emits new events—loosely coupled but flow is implicit and hard to trace at scale. Orchestration scales better for complex flows with branching; choreography fits simple, linear fan-outs. In both cases, every step needs an idempotent compensating action.

**Key points:**
- Replace 2PC with compensations.
- Orchestration: central brain, easier to debug.
- Choreography: events only, looser but opaque.
- Every step needs an idempotent reverse.

---

### 16. Outbox pattern

**Answer:** Solves dual-write between DB and message broker. The service writes the business change and the outgoing event to the same DB in one transaction (the "outbox" table). A relay (polling worker or CDC stream like Debezium) reads the outbox and publishes to the broker, marking rows as sent. Guarantees at-least-once publish without distributed transactions and keeps DB and broker eventually consistent. Tradeoffs: small latency between commit and publish, outbox table grows (needs archival), and consumers must be idempotent. Pairs well with event-driven and saga architectures.

**Key points:**
- Atomic write of state + event to DB.
- Relay (polling or CDC) publishes downstream.
- At-least-once delivery; consumers must dedupe.
- Avoids unreliable dual-write to broker.

---

### 17. CRDTs for collaborative state

**Answer:** Conflict-free Replicated Data Types are data structures where concurrent updates from multiple replicas can be merged deterministically without coordination, achieving strong eventual consistency. Examples: G-Counter, PN-Counter, OR-Set, LWW-Register, RGA/Yjs for text. State-based CRDTs ship full state and merge via a join function; operation-based ship ops over reliable causal broadcast. Used in collaborative editors (Figma, Linear, Notion local-first), offline-first apps, and multi-region databases (Riak, Redis Enterprise). Tradeoffs: metadata overhead grows, intent (vs raw merge) can produce surprising results, and not every problem maps to a CRDT.

**Key points:**
- Mathematically guaranteed convergence.
- No coordination, no central authority needed.
- Yjs/Automerge popular for collaborative text.
- Metadata overhead can be significant.

---

### 18. Lambda vs Kappa architecture

**Answer:** Lambda runs two parallel data pipelines: a batch layer (slow, accurate, recomputes from raw) and a speed layer (fast, approximate, near-real-time), with a serving layer merging both. Pro: handles late data and recomputation. Con: two codebases, two systems, sync drift. Kappa simplifies by using a single streaming pipeline replayable from a durable log (Kafka): need to recompute? Replay the log into a new stream job. Modern stream processors (Flink, Spark Structured Streaming) blur the line. Default to Kappa when your broker can replay history; keep Lambda only if batch tooling is significantly cheaper for cold compute.

**Key points:**
- Lambda: batch + speed layers, duplicated logic.
- Kappa: stream-only, replay from log.
- Kappa needs a durable, replayable log (Kafka).
- Modern engines reduce the dichotomy.

---

### 19. Pipes-and-filters vs orchestrated workflows

**Answer:** Pipes-and-filters: independent stages connected by streams or queues, each stage reads input, transforms, writes output—great for ETL, media pipelines, log processing. Easy to scale stages independently and add/remove filters. Orchestrated workflows: a workflow engine (Temporal, Airflow, Step Functions) defines steps, retries, branches, timers, and human-in-the-loop—great for business processes with state, branching, and long timers. Pipes excel at high-throughput data transformation; orchestrators excel at correctness, visibility, and long-running coordination. Many systems use both: pipes inside steps of an orchestrated workflow.

**Key points:**
- Pipes: streaming, stateless stages.
- Orchestrators: stateful, branching, long-running.
- Both can coexist in one system.
- Choose by latency, state, and visibility needs.

---

### 20. Serverless vs containers vs VMs

**Answer:** VMs give full OS isolation, predictable performance, longest cold starts, highest ops overhead. Containers package app + deps, share kernel, fast start, dense packing—the default for stateful or always-on workloads. Serverless (FaaS like Lambda or container-based like Cloud Run) abstracts servers entirely, scales to zero, pay-per-invocation, but suffers cold starts, runtime limits, and vendor lock-in. Use serverless for spiky, event-driven, or low-traffic workloads where ops savings dominate. Use containers for steady-state services where unit cost matters and you need full control. Use VMs for legacy, GPU, or regulated workloads requiring strong isolation.

**Key points:**
- Serverless: pay per use, cold starts, scale-to-zero.
- Containers: best density and control.
- VMs: strongest isolation, highest overhead.
- Cost crossover happens at ~30-50% utilization.

---

### 21. Horizontal vs vertical scaling

**Answer:** Vertical (scale-up) adds CPU/RAM to a single node—simple, no app changes, but ceiling-bound and a single point of failure. Horizontal (scale-out) adds nodes behind a load balancer—theoretically unlimited, fault tolerant, but requires statelessness or shared state externalization, plus coordination overhead. Most modern services start stateless behind an LB so horizontal is trivial. Databases historically scaled vertically; modern systems (Cassandra, Spanner, CockroachDB) scale horizontally via sharding/consensus. Hybrid is common: scale vertically until you hit cost or instance limits, then shard.

**Key points:**
- Vertical: simple, ceiling-bound, single failure domain.
- Horizontal: needs stateless or external state.
- DBs hardest to scale horizontally—sharding required.
- Combine: bigger nodes plus more nodes.

---

### 22. Stateless vs stateful

**Answer:** Stateless services hold no session/data locally; any instance can serve any request, making horizontal scaling, rolling deploys, and failure recovery trivial. State lives in DBs, caches, or object stores. Stateful services keep state in memory or local disk (Kafka brokers, Elasticsearch nodes, game servers, WebSocket connection state), requiring sticky routing, careful rebalancing on scale events, and slower recovery. Aim for stateless app tiers with state pushed to managed stateful systems. When you must be stateful, use consistent hashing, persistent volumes, and pre-stop hooks to drain gracefully.

**Key points:**
- Stateless = trivial horizontal scaling.
- Stateful needs sticky routing and rebalancing.
- Push state to managed stores when possible.
- Sticky sessions are an anti-pattern for HTTP.

---

### 23. Load balancing (RR, least-conn, hash, weighted)

**Answer:** Round-robin distributes evenly when requests are uniform; cheap and simple. Least-connections routes to the instance with fewest active connections—better for long-lived or variable-duration requests. Consistent hashing routes by key (user ID, tenant) so the same key consistently hits the same backend—essential for caches and stateful systems, minimizes reshuffles on topology change. Weighted variants account for heterogeneous instance sizes or canary traffic shifting. Random with two choices ("power of two") often beats RR for tail latency. Pick by traffic shape: uniform short=RR, varied=least-conn, cache affinity=hash.

**Key points:**
- RR: simple, assumes uniform requests.
- Least-conn: handles variable durations.
- Consistent hash: cache and stateful affinity.
- Power-of-two-choices reduces tail latency.

---

### 24. L4 vs L7 LBs

**Answer:** L4 (TCP/UDP) balances at the transport layer—fast, protocol-agnostic, no payload inspection (AWS NLB, HAProxy TCP mode). L7 (HTTP, gRPC) understands the application protocol—can route by host/path/header, terminate TLS, do retries, sticky cookies, rate limiting, and observability (Envoy, NGINX, ALB). L4 is cheaper and lower latency; L7 is more flexible and is where most modern API traffic lives. Common stack: L4 for raw TCP/UDP (gaming, DBs) and L7 for HTTP APIs, with L4 in front of L7 fleets for DDoS scale. Service meshes are essentially distributed L7 LBs.

**Key points:**
- L4: TCP/UDP, fastest, protocol-blind.
- L7: HTTP-aware, rich routing/policy.
- L7 terminates TLS and does retries.
- Often L4 fronts L7 for scale.

---

### 25. Sticky sessions

**Answer:** LB pins a client (cookie or IP hash) to a specific backend so session state in memory works. Solves the stateless gap cheaply but undermines load balancing, complicates rolling deploys (kill the instance, lose sessions unless drained), and creates hotspots. Better alternatives: externalize session state to Redis/Memcached, use signed JWTs so any instance can verify, or use SPA + token auth. Stickiness still has narrow legit uses: WebSocket connections (the TCP socket is inherently sticky), some legacy apps, and consistent-hash routing for cache affinity (different from stickiness).

**Key points:**
- Pin client to backend via cookie/IP.
- Breaks even load and clean rollouts.
- Prefer externalized session or JWT.
- WebSockets are inherently sticky.

---

### 26. Auto-scaling triggers

**Answer:** Reactive: scale on CPU, memory, request rate, queue depth, p95 latency—simple but lags spikes by minutes. Predictive: scale on schedule (peak hours) or ML forecasts—handles known patterns but misses surprises. Best practice: combine. Use queue depth or RPS per replica (work-based) over CPU when possible—CPU lies under I/O-bound workloads. Set conservative scale-in to avoid thrash, fast scale-out to absorb spikes. Cap maximums to prevent runaway cost from feedback loops. Validate with load tests that scaling actually keeps SLOs under realistic ramps, not just steady state.

**Key points:**
- Prefer work-based signals (RPS, queue depth) over CPU.
- Scale out fast, scale in slow (cooldown).
- Combine reactive with scheduled predictive.
- Cap max to bound cost.

---

### 27. CAP & PACELC in practice

**Answer:** CAP says under a network partition you must choose between consistency and availability. PACELC extends it: even when no partition (Else), you trade Latency vs Consistency. Real systems make this choice per operation: bank transfers favor CP (refuse during partition), social feeds favor AP (stale but served). Many "consistent" systems are PC/EL (strong consistency always, low latency normally) like Spanner; many "available" ones are PA/EL (always available, fast, eventually consistent) like Dynamo. Use CAP as a framing tool, not a checkbox—analyze per workload, per operation.

**Key points:**
- CAP only applies during partition.
- PACELC adds normal-case latency vs consistency.
- Choice is per-operation, not per-system.
- Spanner ~ CP; Dynamo ~ AP.

---

### 28. Eventual consistency patterns

**Answer:** Embrace staleness with tools that mask it: read-your-writes (route reads after a write to the primary or attach a write token), monotonic reads (sticky session to same replica), causal consistency (track happens-before via vector clocks or session tokens), bounded staleness (Cosmos DB style: at most N seconds or M ops behind). For UX, optimistic UI (apply locally, reconcile on confirmation) hides lag. For data correctness, idempotent writes and CRDTs eliminate merge conflicts. Document the consistency contract per endpoint so consumers don't assume strong semantics.

**Key points:**
- Read-your-writes via primary routing or tokens.
- Bounded staleness gives a measurable SLA.
- Optimistic UI hides lag from users.
- Document consistency contract per API.

---

### 29. Strong vs eventual vs causal consistency

**Answer:** Strong (linearizable): every read sees the latest committed write; expensive, requires consensus, limits availability and latency. Eventual: replicas converge if writes stop; cheapest, most available, but reads may be stale or out of order. Causal: preserves happens-before relationships (if A caused B, all observers see A before B) without total ordering—a sweet spot for collaborative apps and chat. Sequential consistency sits between strong and causal. Choose per operation: account balance read = strong; social timeline = eventual; chat messages within a thread = causal.

**Key points:**
- Strong: linearizable, expensive.
- Eventual: cheap, may be stale or reordered.
- Causal: preserves cause-effect ordering.
- Choose per operation, not per system.

---

### 30. Distributed transactions: 2PC vs sagas

**Answer:** Two-phase commit coordinates a transaction across resources via a coordinator (prepare/commit). Guarantees atomicity but blocks on coordinator failure, doesn't scale, and couples services tightly—rarely used across microservices. Sagas decompose into local transactions with compensations: if step 3 fails, run undo for 1 and 2. Provides eventual atomicity without locking, scales, but compensations must be idempotent and semantically meaningful (you can't "uncharge" a credit card without an actual refund). Use 2PC only inside one DB cluster or XA-aware infra; use sagas across services.

**Key points:**
- 2PC: blocking, doesn't scale across services.
- Sagas: local txns plus compensations.
- Compensations must be idempotent and meaningful.
- Orchestrated sagas easier to debug than choreographed.

---

### 31. Leader election (Raft basics, etcd/ZK)

**Answer:** Distributed systems often need a single leader for coordination (config, locks, sequencer). Raft elects a leader via randomized timeouts and majority votes; the leader replicates a log to followers and commits entries once a majority acknowledges. etcd and Consul use Raft; ZooKeeper uses ZAB (similar guarantees). Clients route writes to the leader; reads can be served from followers with bounded staleness or linearizably via the leader. Failover takes a few hundred ms to seconds. Use these systems for service discovery, leader election, distributed locks, and config—never as a general-purpose DB.

**Key points:**
- Raft = leader + log replication + majority commit.
- etcd, Consul use Raft; ZK uses ZAB.
- Used for locks, discovery, config—not data.
- Failover in seconds; quorum needed.

---

### 32. Quorums & replication factors

**Answer:** With N replicas, a write requires W acks and a read R replies; strong consistency requires W + R > N (overlap guarantees the latest write is seen). RF=3, W=2, R=2 is the Dynamo classic: tolerates one failure with strong reads. Lower W (=1) gets fast writes but risks losing data on failure; lower R (=1) gets fast reads but may miss recent writes. Hinted handoff and read-repair fix inconsistencies async. Higher RF improves durability but costs storage and write latency. Tune per workload: writes-heavy systems lower W and rely on read-repair; reads-heavy systems lower R.

**Key points:**
- W + R > N for strong consistency.
- RF=3 with W=R=2 is a sweet spot.
- Hinted handoff fixes temporary outages.
- Higher RF = more durability, more cost.

---

### 33. Read replicas & replication lag

**Answer:** Offload read traffic from the primary by replicating to N replicas (async or semi-sync). Async is fast but reads may be stale (lag spikes during heavy writes, network issues, or replica restarts). Semi-sync waits for at least one replica ack before commit—safer for failover, slightly slower writes. Monitor lag (seconds and bytes behind primary) and alert at thresholds (e.g., >5s). Route critical reads (account balance, post-write reads) to primary or use "read your writes" tokens. Beware: scaling reads with replicas helps until write throughput on primary becomes the bottleneck—then you need sharding.

**Key points:**
- Async = fast but stale; semi-sync = safer.
- Monitor lag in seconds and bytes.
- Route post-write reads to primary.
- Replicas don't help write scaling—shard then.

---

### 34. Sharding strategies & rebalancing

**Answer:** Hash sharding: shard = hash(key) % N; even distribution but reshuffles on N change (mitigate with consistent hashing or virtual nodes). Range sharding: contiguous ranges per shard (good for range queries, prone to hot spots). Directory/lookup: explicit shard map (flexible, but the map itself is a bottleneck/SPOF). Geo sharding: by region for locality. Rebalancing is the hard part—moving data without downtime requires dual-write, backfill, and cutover or a system that does it natively (Cassandra, Vitess, Cockroach). Always plan for resharding before launch; pick a high virtual shard count.

**Key points:**
- Hash: even but no range queries.
- Range: range scans, hot-spot risk.
- Consistent hashing minimizes reshuffles.
- Use many virtual shards to ease rebalancing.

---

### 35. Hot-key problem

**Answer:** A single key (Bieber's Twitter, a trending product) drives disproportionate load to one shard or cache entry, saturating it while the rest of the cluster idles. Fixes: client-side request coalescing (singleflight), local cache with short TTL, key splitting (suffix the key with a random fan-out and aggregate), dedicated hot-key cache tier, or read replicas for that key. For writes, batch and async aggregate (e.g., counter sharding: write to one of N replicas, sum on read). Detect via per-key metrics or sampled tracing; mitigate before it pages on-call.

**Key points:**
- Detect via per-key metrics, sampled traces.
- Singleflight and local TTL caches absorb reads.
- Key fan-out (sharded counter) for writes.
- Plan before going viral, not after.

---

### 36. Caching layers & invalidation

**Answer:** Layers: browser, CDN, edge cache, API gateway cache, application cache (in-process), shared cache (Redis/Memcached), DB buffer pool. Strategies: cache-aside (lazy, app manages), read-through (cache fetches on miss), write-through (sync write to cache + DB), write-behind (async write, risk of loss). Invalidation options: TTL (simplest, accepts staleness), explicit invalidation on write (consistent but coupling), event-driven (CDC fires invalidation). Stampedes mitigated by request coalescing, jittered TTLs, and stale-while-revalidate. Cache hit ratio and tail latency are the metrics that matter.

**Key points:**
- Many layers—measure each one.
- Cache-aside is the default.
- TTL + jitter prevents stampedes.
- Invalidation is the hard problem.

---

### 37. Backpressure & edge rate limiting

**Answer:** Without backpressure, slow consumers cause queues to grow unbounded, latency to spike, and OOM crashes. Apply at every boundary: bounded channels/queues that drop or block when full, max-in-flight semaphores, token-bucket limits per client/tenant at the edge, and concurrency limits per backend. Use 429 with Retry-After and a small jittered backoff hint. Adaptive concurrency limiters (Netflix concurrency-limits, AIMD style) tune dynamically to observed latency. Distinguish: rate limiting protects from abuse, backpressure protects from overload. Combine.

**Key points:**
- Bounded queues everywhere; never unbounded.
- Token bucket per tenant at edge.
- 429 + Retry-After + jitter.
- Adaptive concurrency limits beat static.

---

### 38. Circuit breaker

**Answer:** Wraps remote calls; tracks failure rate; opens (fails fast) when threshold tripped to stop hammering a broken dependency; half-opens after a cool-down to probe recovery; closes on success. Prevents cascading failure and frees resources held in retry loops. Configure: error threshold (e.g., 50% of last 100 requests), open duration (10s), half-open probe count. Important: tune fallback behavior—stale cache, default response, queue for later. Not a substitute for timeouts (always set those first). Implement in libraries (Resilience4j, Polly) or service mesh.

**Key points:**
- States: closed, open, half-open.
- Prevents cascade and saves resources.
- Pair with timeouts and fallbacks.
- Library or mesh-provided.

---

### 39. Bulkhead

**Answer:** Partition resources so a failure in one part can't sink the ship—named after ship compartments. Concretely: separate thread pools or connection pools per downstream dependency, so a slow third-party API doesn't exhaust your shared pool and starve other endpoints. At the service level: tenant isolation pools, per-priority queues. At the infra level: separate clusters per critical workload. Tradeoff: lower max utilization per resource since slices can't share. Worth it for blast radius reduction in any system with diverse latency profiles or critical-vs-best-effort traffic.

**Key points:**
- Per-dependency pool/thread isolation.
- Limits blast radius of one failure.
- Lower utilization, higher resilience.
- Combine with circuit breakers.

---

### 40. Timeouts, retries, exponential backoff, jitter

**Answer:** Every remote call needs a timeout—infinite waits cascade into outages. Set timeouts shorter than the caller's timeout (budget propagation). Retry only idempotent ops; cap attempts (3 is usually enough); use exponential backoff to avoid thundering herd; add full jitter so retries don't re-synchronize. Don't retry 4xx (client errors); retry 5xx and network errors only. Combine with circuit breakers: retries while the dependency is broken just make things worse. Track retry rates as a health signal—a sudden spike often precedes outages.

**Key points:**
- Timeouts everywhere; shorter than parent.
- Retry only idempotent ops, capped.
- Full jitter > no jitter to break herds.
- Skip retries when circuit is open.

---

### 41. SQL vs NoSQL decision matrix

**Answer:** SQL (Postgres, MySQL): rich queries, transactions, joins, mature tooling, strict schema—the default unless something rules it out. Document (MongoDB, DynamoDB): flexible schema, single-document atomicity, good for variable shapes and high write throughput. Wide-column (Cassandra, ScyllaDB): massive write throughput, tunable consistency, time-series. Key-value (Redis, DynamoDB): simple access patterns, sub-ms latency. Graph (Neo4j): relationship-heavy queries. Decide by access pattern (queries known up-front favor NoSQL design), consistency needs, scale (most apps fit in Postgres for a long time), and operational maturity. Don't pick NoSQL "for scale" until SQL has proven inadequate.

**Key points:**
- SQL is the default until proven wrong.
- NoSQL choice depends on access pattern.
- Wide-column for write-heavy at scale.
- Graph DBs for true relationship queries.

---

### 42. Polyglot persistence

**Answer:** Use different storage technologies for different needs within one system: Postgres for transactional, Redis for cache/queues, Elasticsearch for search, S3 for blobs, ClickHouse for analytics, Neo4j for graph. Lets each workload use its best fit. Costs: more operational burden (backups, upgrades, security per store), data sync between stores (CDC, dual writes), team expertise spread thin, and harder cross-store transactions. Start single-store; add new stores only when justified by clear access patterns. Treat secondaries as projections of the system of record.

**Key points:**
- Right tool per access pattern.
- Each store adds ops burden.
- Sync via CDC/events from system of record.
- Resist over-fragmenting early.

---

### 43. CDC & downstream fan-out

**Answer:** Change Data Capture taps the DB's replication log (WAL/binlog) and emits row-change events to a stream (Debezium → Kafka). Consumers project to search indexes, caches, data lakes, other services—without touching the application code. Pros: app stays simple, capture is reliable (no missed events if app crashes between DB and broker), and you get a replayable event log. Cons: events expose the physical schema (couples consumers), ordering and exactly-once semantics need care, and schema changes break consumers. For domain events, prefer outbox (semantic events from the app); for low-level data sync, CDC is ideal.

**Key points:**
- Reads WAL/binlog; no app changes.
- Reliable: misses nothing on app crash.
- Couples consumers to physical schema.
- Use CDC for data sync, outbox for domain events.

---

### 44. Outbox vs CDC for events

**Answer:** Outbox writes semantically meaningful domain events (OrderPlaced) inside the same transaction as the state change, then a relay publishes them. Events are app-defined, stable, and decoupled from schema. CDC emits low-level row changes (UPDATE orders SET status='paid') derived from the DB log—no app code, no extra table, but consumers see the physical schema and must reconstruct intent. Use outbox when you control the producer and want stable domain events. Use CDC when you can't change the producer (legacy DB) or you specifically want data-level sync (search index, lake).

**Key points:**
- Outbox: domain events, schema-stable.
- CDC: row-level, no app changes.
- Outbox needs a relay; CDC needs Debezium.
- Both at-least-once; consumers must dedupe.

---

### 45. Broker choice: Kafka vs RabbitMQ vs SQS vs Pulsar

**Answer:** Kafka: durable, partitioned log; high throughput; replayable; consumer-managed offsets; best for event streaming, CDC, analytics pipelines. RabbitMQ: classic broker with rich routing (exchanges, topics); good for task queues, complex routing, lower throughput; messages typically deleted on ack. SQS: managed, simple, infinite scale, no ordering (FIFO variant exists with caps); great for cloud-native task queues. Pulsar: log + queue hybrid, multi-tenant, geo-replication built in, tiered storage—Kafka competitor with better operational model but smaller ecosystem. Choose by replay needs (Kafka/Pulsar), routing complexity (Rabbit), and ops appetite (SQS).

**Key points:**
- Kafka: log, replay, high throughput.
- Rabbit: routing-rich task queue.
- SQS: managed, simple, no ops.
- Pulsar: log + queue, multi-tenant.

---

### 46. Exactly-once semantics

**Answer:** "Exactly once" usually means effectively-once: at-least-once delivery + idempotent processing. True end-to-end exactly-once requires the producer, broker, and consumer to all participate (Kafka transactions with idempotent producer and transactional consumer offsets, or Flink's two-phase commit sinks). In practice, design consumers to be idempotent: dedupe by event ID, upsert by primary key, use idempotency keys in HTTP, store processed event IDs (TTL window) to reject replays. This handles broker redeliveries, app retries, and network duplicates uniformly. Cheaper and more reliable than chasing true exactly-once.

**Key points:**
- True exactly-once is rare and expensive.
- Effectively-once = at-least-once + idempotent.
- Dedupe by event ID or upsert by PK.
- Idempotency keys at every entry point.

---

### 47. Stream processing (Flink, Kafka Streams, Spark)

**Answer:** Process unbounded event streams with windowing, joins, aggregations, and stateful operators. Flink: true streaming, low-latency, sophisticated event-time semantics, checkpoint-based exactly-once, best-in-class for complex stateful pipelines. Kafka Streams: library embedded in your app, simpler ops, scales with partitions, tightly tied to Kafka. Spark Structured Streaming: micro-batch under streaming API, great for ETL teams already on Spark, higher latency. Choose by latency (Flink for ms), team familiarity (Spark for batch shops), and complexity (Kafka Streams for embedded use cases).

**Key points:**
- Event-time vs processing-time matters.
- Watermarks handle late data.
- Checkpointing for exactly-once state.
- Flink for hardest stateful workloads.

---

### 48. Materialized views & read models

**Answer:** Precompute query results so reads are fast and cheap. In SQL DBs (Postgres, Snowflake) materialized views refresh on schedule or on commit. In event-driven systems, projections consume events and write denormalized read models tailored per query—same idea, different mechanics. Tradeoffs: write amplification, eventual consistency vs source, and the cost of rebuilds (must be replayable from raw events or DB). Always design with rebuild in mind: version the projection schema, store events long enough to rebuild, and run new projections alongside old during cutover.

**Key points:**
- Precomputed, denormalized read shapes.
- Eventually consistent vs source.
- Rebuildable from events is non-negotiable.
- Version projections for schema changes.

---

### 49. Time-series storage

**Answer:** Optimized for append-only writes by timestamp, aggregations over windows, and retention/downsampling. Options: InfluxDB, TimescaleDB (Postgres extension), Prometheus (pull, ephemeral), VictoriaMetrics, ClickHouse (general but excellent for time-series). Key features: columnar storage, time-partitioned chunks, automatic downsampling/rollups, TTL-based retention, fast range scans. Avoid using a row-store SQL DB at scale—indexes balloon and queries slow. Cardinality (unique label combinations) is the silent killer in metrics systems; budget it explicitly and reject high-cardinality labels at ingest.

**Key points:**
- Columnar + time-partitioned chunks.
- Downsampling and retention built in.
- Cardinality is the failure mode.
- ClickHouse great for ad-hoc analytics.

---

### 50. Full-text search (Elasticsearch as projection)

**Answer:** Search engines (Elasticsearch, OpenSearch, Solr, Meilisearch) provide inverted indexes, tokenization, analyzers, faceting, scoring, and aggregations—things SQL LIKE can't. Treat search as a projection: system of record is your DB; events or CDC keep the index updated. Don't make ES your primary store—not designed for strong consistency or durability under all failure modes. Plan for reindex (schema/analyzer changes), backpressure on ingest, and resource isolation (search and indexing compete). For smaller scale, Postgres full-text or pgvector + tsvector often suffices.

**Key points:**
- Inverted index, analyzers, faceting.
- Treat as projection, not source of truth.
- Reindex pipeline is mandatory.
- Postgres FTS fits small/medium scale.

---

### 51. Vector DBs & RAG

**Answer:** Vector DBs (Pinecone, Weaviate, Qdrant, pgvector, Milvus) store high-dimensional embeddings and answer approximate-nearest-neighbor queries (HNSW, IVF). Used in RAG: chunk documents, embed, store; at query time, embed the query, retrieve top-K relevant chunks, stuff into the LLM prompt. Architecture concerns: chunking strategy, embedding model versioning (re-embed on change), hybrid search (vector + keyword BM25), reranking with a cross-encoder, freshness (re-embed on doc update), and access control filtering. For most apps, pgvector inside Postgres avoids a new store; specialized DBs win at very high scale or very low latency.

**Key points:**
- ANN indexes: HNSW common.
- RAG = retrieve top-K + LLM prompt.
- Hybrid (vector + BM25) beats pure vector.
- pgvector fine for small/medium scale.

---

### 52. Multi-tenant isolation strategies

**Answer:** Three patterns: silo (one DB/cluster per tenant—max isolation, max cost, easiest compliance), pool (shared DB with tenant_id on every row—cheapest, hardest isolation, noisy-neighbor risk), bridge (shared infra with per-tenant schema—middle ground in Postgres). Choose by tenant size and compliance: enterprise tenants often demand silo; SMB/self-serve tenants live in pool with quotas. Many systems use tiers: pool for free/small, bridge for paid, silo for enterprise. Critical: tenant_id in every query (enforced by middleware or RLS), per-tenant rate limits, and per-tenant observability.

**Key points:**
- Silo, pool, bridge: cost vs isolation.
- Tier model: pool for self-serve, silo for enterprise.
- tenant_id on every row + middleware enforcement.
- Per-tenant quotas prevent noisy neighbors.

---

### 53. Tenant partitioning

**Answer:** Within pooled multi-tenancy, route tenants to shards so noisy neighbors don't cascade. Strategies: hash(tenant_id) for even distribution, lookup table for flexibility (move a big tenant to a dedicated shard), or hybrid (most tenants hashed, top-N tenants pinned). Plan for tenant moves: bulk-export, dual-write window, cutover. Per-shard capacity caps prevent any one tenant from filling a shard. Observability per-tenant per-shard reveals hot tenants early. Combined with per-tenant rate limits and circuit breakers, partitioning is the main defense against multi-tenant overload.

**Key points:**
- Hash, lookup, or hybrid shard routing.
- Pin big tenants to dedicated shards.
- Plan tenant migration up front.
- Per-tenant observability is mandatory.

---

### 54. Geo-distributed data

**Answer:** Place data near users for latency and meet residency laws. Patterns: read-local/write-global (writes go to home region, reads served locally—simple, write latency penalty), home-region (each user pinned to a region, replicated for DR), or active-active multi-master with CRDTs/conflict resolution (Cassandra, Spanner, CockroachDB)—the hardest. Spanner uses TrueTime for global strong consistency; Cosmos DB offers tunable consistency. Tradeoffs: consistency, write latency, and complexity vs locality benefits. Start with home-region and add complexity as latency or compliance demands.

**Key points:**
- Home-region per user is the common default.
- Spanner/CockroachDB for global SQL.
- Cassandra/Cosmos for tunable AP.
- Residency rules pin data to jurisdictions.

---

### 55. GDPR / data residency

**Answer:** GDPR mandates lawful basis for processing, right to access, rectify, erase (right to be forgotten), and data portability; data residency rules in EU/China/Russia/India require data to stay in-region. Architectural impact: per-region storage (or pseudonymization), separate prod environments per residency zone, fine-grained data lineage, encryption at rest with per-tenant keys (enables crypto-shredding for erasure), event-sourced systems need shredding strategies (tombstones don't satisfy GDPR—delete or crypto-shred). PII classification at ingest, data catalogs, and DPIA workflows are non-negotiable for compliance.

**Key points:**
- Per-region storage for residency.
- Crypto-shredding for event-sourced erasure.
- Per-tenant keys enable selective deletion.
- PII classification and lineage are mandatory.

---

### 56. AuthN vs AuthZ architecture

**Answer:** Authentication answers "who are you" (login, sessions, MFA, passwordless); authorization answers "what can you do" (RBAC/ABAC, policy evaluation, resource scoping). Separate them. AuthN typically centralizes in an identity provider (Auth0, Okta, Cognito, internal); AuthZ may be central (OPA, Cedar, AuthZed/SpiceDB) or distributed (per-service policy with shared library). Tokens carry identity (JWT/OIDC) and sometimes coarse roles; fine-grained AuthZ usually evaluates at the resource layer using a policy engine. Audit every authZ decision with subject, action, resource, decision, and reason.

**Key points:**
- AuthN = identity; AuthZ = permissions.
- Central IdP for authN; engine for authZ.
- JWT carries identity, not fine-grained perms.
- Audit decisions with full context.

---

### 57. OAuth 2.0 / OIDC flows

**Answer:** OAuth 2.0 delegates authorization (access tokens for APIs); OIDC adds authentication (ID tokens). Flows: Authorization Code + PKCE (web/mobile/SPAs—the modern default), Client Credentials (server-to-server), Device Code (TVs, CLIs). Implicit and Resource Owner Password are deprecated. Tokens: access token (short-lived, sent to APIs), refresh token (long-lived, rotated), ID token (identity claims). Always use PKCE for public clients; use HTTPS; validate `iss`, `aud`, `exp`, `nonce`. Store refresh tokens securely (HTTP-only cookie or secure storage), rotate on use.

**Key points:**
- Authorization Code + PKCE is the default.
- Access token short, refresh token rotated.
- OIDC adds ID token on top of OAuth.
- Always validate iss/aud/exp/nonce.

---

### 58. Tokens: opaque vs JWT; revocation

**Answer:** Opaque tokens are random strings; the issuer holds state and can revoke instantly via lookup—simple and safe but every API call requires introspection. JWTs are self-contained (signed claims), validated locally without a round trip—fast and stateless but hard to revoke before expiry. Mitigations: short TTLs (5-15 min) + refresh tokens, denylist of jti for forced revocation, key rotation, audience scoping. For B2B/internal, opaque + caching is often simpler. For high-traffic public APIs, JWT is the perf win. Hybrid: JWT for fast path + denylist check for sensitive ops.

**Key points:**
- JWT: stateless, fast, hard to revoke.
- Opaque: stateful, easy revoke, requires lookup.
- Short TTL + refresh mitigates JWT revocation.
- Denylist for emergency revoke.

---

### 59. Zero-trust networking

**Answer:** "Never trust, always verify": no implicit trust based on network location (no flat internal network). Every request—even east-west—is authenticated, authorized, and encrypted. Implemented via service identity (SPIFFE/SVID, workload identity), mTLS between services, identity-aware proxies for users (BeyondCorp), short-lived credentials (Vault, IAM roles), and per-request policy (OPA, mesh policy). Replaces VPNs for many use cases. Cost: significant platform investment, complexity, latency from extra checks. Benefits: breach blast radius shrinks dramatically; insider threats and lateral movement become much harder.

**Key points:**
- No implicit network trust.
- mTLS + service identity + per-request policy.
- Replaces VPNs (BeyondCorp model).
- Heavy platform investment, large security win.

---

### 60. mTLS in mesh

**Answer:** Mutual TLS authenticates both client and server with certificates—every service-to-service call proves identity cryptographically. Service meshes (Istio, Linkerd) automate this: sidecars rotate short-lived certs from an internal CA (every 24h or less), apps don't need TLS code. Enables zero-trust within the cluster, encrypts all east-west traffic, and provides strong identity for authZ. Costs: CA management, slight latency per handshake (mitigated by session resumption), and debugging "why was this denied" requires good policy tooling. Treat as table stakes for mature platforms with many services.

**Key points:**
- Both sides authenticate with certs.
- Sidecars handle rotation transparently.
- Foundation for zero-trust + authZ.
- Internal CA is the critical piece.

---

### 61. Secrets management at scale

**Answer:** Never bake secrets into code, images, or env vars committed to repos. Centralize in a secrets manager (Vault, AWS Secrets Manager, GCP Secret Manager); fetch at startup or runtime; rotate automatically; audit access. Use workload identity (IAM roles, SPIFFE, Vault auth methods) so apps authenticate to the secrets store without bootstrap secrets—turtles all the way down problem. Sidecars or CSI drivers inject secrets into pods. Short-lived dynamic secrets (DB creds generated per session) beat long-lived static ones. Scan repos and images for leaked secrets in CI.

**Key points:**
- Central store, no secrets in code.
- Workload identity beats bootstrap secrets.
- Dynamic short-lived secrets where possible.
- CI scanning for accidental leaks.

---

### 62. Defense in depth

**Answer:** Don't rely on any single control. Layers: network (firewalls, segmentation, mTLS), identity (MFA, SSO, least privilege), application (input validation, output encoding, parameterized queries, dependency scanning), data (encryption at rest and in transit, tokenization, key management), monitoring (audit logs, anomaly detection, SIEM), and process (code review, threat modeling, incident response). Each layer assumes others may fail. Threat-model new features (STRIDE) and assume insider threat. Patch promptly, scan continuously, and practice incident response—the layers must work, not just exist.

**Key points:**
- Assume any single control fails.
- Layer network, identity, app, data, monitoring.
- Threat-model new features.
- Practice incident response; don't just write runbooks.

---

### 63. Rate limiting & abuse detection arch

**Answer:** Multiple tiers: edge (CDN/WAF for crude IP-based limits and DDoS), API gateway (per-API-key/user RPS with token bucket or sliding window), per-service (Redis-backed counters for distributed limits, or in-process if single instance). Use distinct limits per tier of user (anonymous, free, paid) and per endpoint (login vs read-only). Detect abuse via anomaly signals (sudden RPS spike, login failures, credential stuffing patterns) feeding a behavioral system that issues challenges (CAPTCHA), step-up auth, or temporary blocks. Always respond with 429 + Retry-After and document limits.

**Key points:**
- Layered: edge, gateway, service.
- Token bucket or sliding window on Redis.
- Tier limits by user class and endpoint.
- Pair with anomaly detection and challenges.

---

### 64. WAF placement

**Answer:** Web Application Firewall inspects HTTP traffic for OWASP-style attacks (SQLi, XSS, RCE, path traversal). Place at the edge (Cloudflare, AWS WAF, Akamai) before traffic hits your infra to absorb bots and known exploit patterns cheaply. Tradeoffs: false positives can block legit traffic, must be tuned per app, and managed rules lag novel exploits. Pair with rate limiting, bot management, and runtime app protection (RASP) for defense in depth. WAF is necessary but not sufficient—secure coding and dependency hygiene remain the real defense.

**Key points:**
- Sits at the edge (CDN/WAF service).
- Blocks OWASP-style attacks.
- Tune to avoid false positives.
- Not a substitute for secure code.

---

### 65. RBAC vs ABAC

**Answer:** RBAC: assign users to roles, roles grant permissions on resource types. Simple, easy to audit, but explodes when permissions vary per resource (per-document, per-tenant)—you end up with thousands of roles. ABAC: policies evaluate attributes of subject, resource, action, and environment (department=engineering AND resource.owner=subject.id). Flexible, scales to fine-grained policies, but harder to reason about and audit. Real systems blend: roles for coarse access, attributes for resource scoping. Modern engines (OPA, Cedar, SpiceDB/Zanzibar) support both; relationship-based (ReBAC) handles "shared with me" elegantly.

**Key points:**
- RBAC: roles, simple, scales poorly with granularity.
- ABAC: policy on attributes, flexible, complex.
- ReBAC (Zanzibar) for relationship sharing.
- Most systems combine RBAC + ABAC.

---

### 66. Twelve-factor app

**Answer:** Codified principles for cloud-native apps: I codebase per app in version control, II explicit dependencies, III config in env vars, IV treat backing services as attached resources, V strict separate build/release/run, VI stateless processes, VII export services via port binding, VIII scale via process model, IX fast startup/graceful shutdown, X dev/prod parity, XI logs as event streams to stdout, XII admin tasks as one-off processes. Still the baseline for container/PaaS-friendly apps. Some factors evolved (config from env vars + secrets managers, logs via sidecars), but the core ideas hold.

**Key points:**
- Config in env, secrets via managers.
- Stateless processes, scale by count.
- Logs to stdout; collector handles routing.
- Build/release/run strictly separated.

---

### 67. Blue/green vs canary vs rolling

**Answer:** Rolling: replace pods N at a time—simple, no extra capacity needed, but rollback is slow (roll back N at a time) and bad versions reach some users immediately. Blue/green: deploy v2 alongside v1, switch traffic atomically, keep v1 for quick rollback—needs 2x capacity briefly, clean cutover. Canary: route a small % to v2, watch SLOs, ramp gradually—catches issues with minimal blast radius, requires good observability and automated analysis (Flagger, Argo Rollouts). Most teams use canary for risky changes and rolling for routine deploys. Blue/green for DB-coupled or stateful upgrades.

**Key points:**
- Rolling: cheap, slow rollback.
- Blue/green: instant rollback, 2x capacity.
- Canary: gradual, observability-driven.
- Mix per risk level.

---

### 68. Feature flags decoupling deploy from release

**Answer:** Ship dark code, enable for specific users/cohorts later via runtime flags (LaunchDarkly, Unleash, Flagsmith, in-house). Decouples deploy (low-risk, frequent) from release (business decision). Enables canary releases by user segment, A/B testing, kill switches for incidents, and trunk-based development without long-lived branches. Costs: flag debt (clean up old flags!), conditional logic explosion, testing all combinations is impossible. Discipline: every flag has an owner, expiry date, and removal task. Use flags for in-flight features and operational toggles, not for permanent config.

**Key points:**
- Decouples deploy from release.
- Enables targeted canary, A/B, kill switch.
- Flag debt is real—expire and remove.
- Not a substitute for config management.

---

### 69. DB migrations in CD

**Answer:** Schema changes must be backward compatible to allow rolling deploys. Pattern: expand-migrate-contract. Expand: add new column/table (additive, both versions work). Migrate app code to use new schema, dual-write if needed, backfill data. Contract: remove old column/table after all instances are on the new version. Avoid blocking DDL on big tables (use pt-online-schema-change, gh-ost, or native online DDL). Migrations run as a separate CI step before app deploy, never in the app at startup (race conditions, multi-instance). Always rehearse in staging with prod-shaped data.

**Key points:**
- Expand-migrate-contract for backward compat.
- Use online schema change tools at scale.
- Run as separate CI step, not app startup.
- Rehearse with realistic data volumes.

---

### 70. Liveness/readiness/startup probes

**Answer:** Kubernetes uses three probes. Liveness: is the process alive? Failed liveness restarts the pod—keep cheap (process check, simple heartbeat); don't fail on downstream issues or you'll cascade. Readiness: can the pod serve traffic? Failed readiness removes from LB—check dependencies that block requests (DB connection, warmed cache). Startup: for slow-starting apps, gates liveness until the app is up so liveness doesn't kill it during boot. Misconfigured probes are a top cause of avoidable outages—pods restart-looping or cascading failures when readiness is too strict.

**Key points:**
- Liveness: process alive; cheap; don't cascade.
- Readiness: ready to serve; checks deps.
- Startup: protects slow boots.
- Probe misconfig causes outages.

---

### 71. Graceful shutdown & connection draining

**Answer:** On SIGTERM: mark unready (LB stops sending new requests), drain in-flight requests with a grace period, close idle connections, flush buffers (logs, metrics, events), then exit. Kubernetes sends SIGTERM then waits `terminationGracePeriodSeconds` (default 30s) before SIGKILL—tune for your workload. Combine with pre-stop hooks to give LBs time to notice the unready state (5-10s sleep). For stateful services, also reassign partitions/leadership before exit. Without graceful shutdown, every deploy drops a small % of requests—visible as elevated error rate during rollouts.

**Key points:**
- SIGTERM, drain, then exit before SIGKILL.
- Pre-stop hook gives LB time to react.
- Tune terminationGracePeriod per workload.
- Stateful services must reassign leadership.

---

### 72. DR: RTO vs RPO

**Answer:** RTO (Recovery Time Objective): how long until service is restored after disaster. RPO (Recovery Point Objective): how much data loss is acceptable. Drive architecture and cost: RTO=minutes/RPO=zero requires active-active multi-region with synchronous replication (expensive). RTO=hours/RPO=15min allows pilot-light or warm-standby with async replication (cheaper). Define per service tier: payment system has tight RTO/RPO; analytics dashboard tolerates hours. Test DR regularly—untested DR plans don't work. Backups, runbooks, and failover automation must be exercised at least quarterly.

**Key points:**
- RTO = downtime budget; RPO = data loss budget.
- Drives replication and cost.
- Per-service tiering avoids over-spending.
- Untested DR = no DR.

---

### 73. Backup & restore

**Answer:** Backups are useless without tested restores. Strategy: full backups periodically (weekly), incrementals between, WAL/binlog archived continuously for point-in-time recovery. Store off-site (different region), encrypted, with access controls (immutable backups defeat ransomware). Test restore quarterly with realistic data sizes—measure RTO, validate integrity. Retention per regulatory needs (7 years for financial). Application-consistent backups (quiesce DB, snapshot) beat crash-consistent for DBs. Backup metadata (schema versions, app versions) so you can restore into a compatible runtime.

**Key points:**
- Full + incremental + continuous WAL.
- Off-site, encrypted, immutable.
- Test restore quarterly.
- App-consistent for databases.

---

### 74. Chaos engineering

**Answer:** Deliberately inject failures (kill pods, partition network, slow disk, exhaust CPU) in production-like or production environments to find weaknesses before they find you. Start small (game days in staging), expand to controlled prod experiments (canary blast radius), and graduate to continuous chaos (Chaos Monkey style). Pre-reqs: solid observability, SLO budgets, automated rollback. Tools: Chaos Mesh, Litmus, Gremlin, Pumba. Cultural shift matters more than tooling: blameless culture, hypothesis-driven experiments, and reading postmortems as learning, not punishment.

**Key points:**
- Inject failures to discover weaknesses.
- Start staging, graduate to prod gradually.
- Observability and rollback are prereqs.
- Culture matters more than tools.

---

### 75. Logs vs metrics vs traces

**Answer:** Three pillars of observability. Logs: discrete events with rich context—great for debugging specific incidents, expensive to store at scale, hard to aggregate. Metrics: numeric time-series with labels—cheap, aggregatable, perfect for dashboards/alerts, low cardinality required. Traces: request flow across services with timing per span—great for latency analysis and dependency graphs. Use all three: metrics for SLOs and alerting, logs for incident debugging, traces for understanding distributed flows. OpenTelemetry unifies the instrumentation surface; vendor backends differ (Datadog, Honeycomb, Grafana stack).

**Key points:**
- Metrics for alerts, logs for debug, traces for flow.
- OpenTelemetry standardizes instrumentation.
- Cardinality is the metrics killer.
- Sample traces; never sample errors.

---

### 76. SLI / SLO / SLA & error budgets

**Answer:** SLI: measurable indicator (request success rate, p99 latency). SLO: internal target on the SLI (99.9% success over 30d). SLA: external contract with penalties (99.5% with credits). Error budget = 1 - SLO; if you're meeting SLO, you have budget to spend on risky changes; if exhausted, freeze risky deploys until reliability recovers. Forces a quantitative conversation between dev and ops about reliability vs velocity. Pick user-centric SLIs (does the user's request succeed?) not infra metrics (CPU). Multi-window multi-burn-rate alerts catch both fast and slow burns.

**Key points:**
- SLI measures, SLO targets, SLA contracts.
- Error budget governs deploy risk.
- User-centric SLIs over infra ones.
- Multi-window burn-rate alerts.

---

### 77. On-call, runbooks, blameless postmortems

**Answer:** Rotate on-call to spread knowledge and prevent burnout; cap pages per shift (alert fatigue degrades response). Every alert must have a runbook with diagnostics and remediation steps—ideally automated. Postmortems blameless: focus on system/process, not individuals; document timeline, root cause(s), contributing factors, action items with owners and deadlines. Track action items to completion; otherwise the same incident recurs. Share postmortems widely—the org learns. Practice incident command (one IC, one comms lead, scribe) so coordination during real incidents is automatic.

**Key points:**
- Runbook per alert; automate when possible.
- Cap pages to avoid fatigue.
- Postmortems blameless and action-tracked.
- Practice incident command roles.

---

### 78. Cost observability & unit economics

**Answer:** Cloud bills surprise teams that don't measure per-feature, per-tenant, per-request cost. Tag everything (service, team, env), use cost allocation reports, and compute unit costs ($ per user, per request, per GB stored). FinOps practices: showback/chargeback by team, regular cost reviews, anomaly alerts on spend, and automated rightsizing recommendations. Architecture decisions have cost shape: serverless is great until traffic stabilizes (containers cheaper at steady state); multi-AZ data transfer adds up; logs are the silent budget killer. Make cost a first-class non-functional requirement.

**Key points:**
- Tag everything; per-team/feature visibility.
- Unit cost ($ per user/request) as KPI.
- Anomaly alerts on daily spend.
- Logs and egress are silent killers.

---

### 79. Multi-region active-active vs active-passive

**Answer:** Active-passive: one region serves, other is warm standby for failover—simpler, no write conflicts, but failover takes minutes and the passive capacity is unused. Active-active: both regions serve—lower latency for users, full capacity utilization, but writes need conflict resolution (CRDTs, last-write-wins, or region affinity for write paths) and consistency is trickier. Hybrid: home-region routing (each user pinned to a region for writes, reads served locally everywhere)—usually the sweet spot. Active-active for true global apps; active-passive for compliance-driven DR with infrequent failover.

**Key points:**
- Active-passive: simple, warm capacity wasted.
- Active-active: full utilization, write conflicts.
- Home-region routing is the common sweet spot.
- Failover automation must be tested.

---

### 80. Edge computing (Workers, Lambda@Edge)

**Answer:** Run code at CDN PoPs (Cloudflare Workers, Lambda@Edge, Fastly Compute, Deno Deploy) for ultra-low latency (10-50ms vs 100-300ms origin). Use cases: A/B testing routing, auth at the edge, personalization, geo-routing, image transformation, API caching with custom logic. Constraints: tiny runtime (V8 isolates or Wasm), short CPU budgets (50-500ms), limited libraries, eventually consistent or no persistent storage (KV stores with high read replication, low write throughput). Architecture pattern: edge handles thin logic + cache; origin handles heavy logic + writes. Great for read-mostly workloads with global users.

**Key points:**
- Code at CDN PoPs; sub-50ms latency.
- V8 isolates/Wasm; short CPU budget.
- Storage is eventually consistent KV.
- Edge for thin logic; origin for heavy.

---

### 81. URL shortener (bit.ly)

**Answer:** Requirements: shorten long URLs to short codes, redirect on GET, track clicks, handle 100B+ links and 100K QPS reads (10:1 read:write). Components: API service (POST /shorten, GET /:code), code generator (base62 of an incrementing ID from a sharded counter or Snowflake-style), KV store (Redis cache + Cassandra/DynamoDB for durability), analytics pipeline (clicks → Kafka → ClickHouse). Data model: {short_code, long_url, owner, created_at, expires_at}. Scaling: CDN caches redirects (301 vs 302—302 to keep analytics), shard KV by short_code hash, cache hottest codes locally. Tradeoffs: counter-based codes are predictable (security risk for private links—use random or hash IDs there); 301 caches forever, harder to revoke.

**Key points:**
- Base62 from sharded counter or Snowflake.
- CDN + Redis + durable KV.
- 302 if you need click analytics.
- Cache hot codes locally to absorb peaks.

---

### 82. Pastebin

**Answer:** Requirements: paste arbitrary text up to ~10MB, generate short URL, support expiry and private/unlisted/public, syntax highlight, ~10K writes/day, 10x reads. Components: API + web (POST /paste, GET /:id), object store for paste content (S3—cheap, durable, supports range reads for huge pastes), metadata DB (Postgres for {id, owner, visibility, expiry, mime, size}), search index for public pastes (Elasticsearch). Data model: small metadata row + S3 object. Scaling: CDN caches public pastes; KV cache for hot pastes. TTL via S3 lifecycle policies or scheduled cleanup. Tradeoffs: storing inline in DB simplifies up to a point but blows up at scale—offload to S3 from day one.

**Key points:**
- Metadata in SQL, content in S3.
- CDN for public reads.
- Lifecycle policy handles expiry.
- Syntax highlight client-side to save server.

---

### 83. Twitter timeline (fan-out on read vs write)

**Answer:** Requirements: post tweets, home timeline of followees in chronological + ranked order, 500M users, celebrities with 100M followers. Fan-out on write: precompute each follower's timeline by pushing new tweets to their inbox (Redis list per user). Fast reads, expensive writes for celebrities (100M inbox updates per tweet). Fan-out on read: query followees' tweets at read time and merge—cheap writes, expensive reads. Hybrid: fan-out on write for normal users; for celebrity tweets, leave them in a separate store and merge at read time. Components: Tweet service (Postgres + Manhattan/Cassandra), Timeline service (Redis inboxes), Fan-out worker (Kafka), Ranking service (ML), Media service. Tradeoffs: hybrid balances write amplification and read latency; ranking eventually replaces strict chronological.

**Key points:**
- Hybrid fan-out: write for normal, read for celebs.
- Redis lists per user as inbox.
- Kafka decouples post from fan-out.
- Ranking model on top of timeline merge.

---

### 84. Instagram

**Answer:** Requirements: photo upload, feed (followees' posts), explore, stories, ~2B users. Components: Upload service (resize + transcode to multiple sizes, store in S3 with CDN), Metadata DB (Cassandra for posts, sharded by user_id), Feed service (fan-out hybrid like Twitter), Search/Explore (Elasticsearch + ML ranking), Stories (separate store with 24h TTL). Data model: post {id, user_id, media_urls, caption, created_at}; relationships in graph or denormalized table. Scaling: CDN absorbs photo reads (the dominant cost), pre-generate thumbnail sizes, geo-distribute storage. Tradeoffs: ML-ranked feed displaces chronological; eventually consistent counters (likes) sharded to avoid hot keys.

**Key points:**
- Image transcoding pipeline + CDN.
- Cassandra for write-heavy post metadata.
- Hybrid timeline fan-out.
- Sharded counters for likes.

---

### 85. WhatsApp / chat

**Answer:** Requirements: 1:1 and group chat, online presence, delivery + read receipts, E2E encryption, offline message queueing, 100B msgs/day. Components: Connection service (long-lived WebSockets, millions per node via Erlang-style concurrency), Message service (per-conversation log in Cassandra or custom storage), Presence service (Redis with TTLs), Push notification (APNs/FCM) for offline, Media service (S3 + CDN, E2E-encrypted blobs). Routing: each user pinned to a connection node via consistent hash; recipient lookup → forward to their node. E2E: Signal Protocol (X3DH + Double Ratchet)—server stores ciphertext only. Scaling: shard by user, geo-route to nearest PoP, async fan-out for groups.

**Key points:**
- WebSockets per user; consistent hash to nodes.
- Signal protocol for E2E (X3DH + Double Ratchet).
- Per-conversation log in Cassandra.
- APNs/FCM for offline delivery.

---

### 86. Notification system

**Answer:** Requirements: send email/SMS/push/in-app notifications, support templating, user preferences, throttling, scheduling, billions/day. Components: API (POST /notify with recipient, template, data), Template service, Preference service (channel opt-in per user per notification type), Routing service (decides channels based on prefs and notification class), Provider gateways (SendGrid, Twilio, APNs/FCM, in-house WebSocket), Queue (Kafka/SQS per channel for backpressure), Dedup store (Redis with notification key TTL), Tracking/analytics (deliveries, opens, clicks). Scaling: shard queues per provider, retry with backoff on provider failures, rate-limit per provider's quota. Tradeoffs: idempotency keys prevent duplicate sends; per-user digest to avoid notification fatigue.

**Key points:**
- Channel gateways behind queues.
- Preferences engine gates delivery.
- Idempotency keys for dedup.
- Per-user digest avoids fatigue.

---

### 87. YouTube

**Answer:** Requirements: upload video, transcode to multiple resolutions/codecs, stream globally with adaptive bitrate (HLS/DASH), comments, recommendations, billions of hours watched. Components: Upload service (resumable, chunked), Transcoding pipeline (parallel workers, queue-driven, ladder of resolutions including AV1/VP9/H.264), Storage (object store with cold tier for old/long-tail content), CDN (multi-tier with edge cache), Metadata DB (Vitess/Spanner for video metadata), Recommendation service (ML on watch history), Comments (separate write-heavy store). Scaling: pre-position popular content closer to edge; long-tail served from origin or fewer regional caches. Tradeoffs: storage cost vs CDN cost; transcoding cost vs encode quality (per-shot encoding wins on popular content).

**Key points:**
- Resumable upload + queue-driven transcoding.
- Adaptive bitrate (HLS/DASH).
- Multi-tier CDN; hot/cold storage tiers.
- Per-shot encoding for popular videos.

---

### 88. Netflix

**Answer:** Requirements: stream pre-encoded movies/shows to millions of concurrent viewers, personalization, multi-CDN, global rights management. Components: Catalog service (titles, metadata), DRM/license service, Encoding pipeline (per-title and per-shot optimized encodes across many codec/resolution combos), Open Connect (Netflix's own CDN appliances embedded in ISP networks), Playback service (manifests, ABR, session tracking), Recommendation (offline + online ML, A/B testing platform), Billing. Scaling: Open Connect pre-positions catalog at ISPs based on popularity prediction; client picks edge based on probe; chaos-engineering-tested resilience (Chaos Monkey/Kong). Tradeoffs: huge upfront encoding cost amortized over views; ISP-embedded CDN saves transit but adds physical logistics.

**Key points:**
- Open Connect CDN inside ISPs.
- Per-title/per-shot encoding ladder.
- Pre-position catalog by predicted demand.
- DRM + license service per session.

---

### 89. Uber / ride-hailing dispatch

**Answer:** Requirements: match riders to nearby drivers in seconds, real-time location, pricing, surge, ETAs, 10M+ active drivers. Components: Location service (drivers ping every few seconds; stored in geo-indexed structure—Google S2 cells or H3 hexes), Dispatch service (per-cell index of available drivers; match algorithm minimizes pickup ETA + fairness), Pricing/surge (real-time demand/supply per cell), Trip service (state machine: requested → matched → in_progress → completed), Payment, Notification. Scaling: geo-shard by city/cell (most rides are local), Riak/in-memory geo index, Kafka for location stream, separate dispatch services per region. Tradeoffs: simple nearest-driver vs global optimization (better outcomes but harder); surge balances supply/demand but is politically fraught.

**Key points:**
- Geo-index with S2/H3 cells.
- Per-region dispatch shards.
- Trip state machine for correctness.
- Location stream firehose via Kafka.

---

### 90. DoorDash / food delivery

**Answer:** Requirements: customers order from restaurants, dispatch dasher for pickup + delivery, three-sided marketplace, ETAs across cooking + driving. Components: Catalog service (menus, availability), Order service (state machine: placed → confirmed → cooking → ready → picked up → delivered), Dispatch (similar to Uber but optimizing pickup window + cook time + driving time + batching multiple orders per dasher), Restaurant integration (POS APIs, tablet fallback), Payment, Notifications, ETA prediction (ML on cook time + driving). Scaling: geo-shard by metro, Kafka for events between services, real-time ML for ETAs. Tradeoffs: batching boosts dasher earnings but risks cold food; integrations vary in quality (tablet often fallback).

**Key points:**
- Order state machine across three sides.
- Dispatch optimizes cook + drive + batching.
- ML for ETA across two phases.
- Restaurant integration is the messy part.

---

### 91. Google Drive / Dropbox (file sync)

**Answer:** Requirements: sync files across devices, conflict resolution, sharing, versioning, offline edits, petabytes of storage. Components: Block storage (split files into chunks, content-addressed by hash—dedupe across users), Metadata service (file tree, versions, ACLs, sharded by user/team), Sync client (watches local FS, computes deltas, uploads changed chunks only), Notification service (long-poll or WebSocket for remote change events), Sharing service (ACL + link tokens). Data model: file = list of chunk hashes + metadata; chunks in object store. Sync: client uploads only new chunks (rsync-style), server merges metadata atomically per file. Conflict: usually last-writer-wins + keep both copies; Drive collaborates via operational transform. Tradeoffs: dedup saves storage but complicates encryption (per-user keys defeat dedup).

**Key points:**
- Content-addressed chunks for dedup.
- Metadata service is the consistency point.
- Client computes deltas; uploads only new chunks.
- Conflict resolution: LWW + keep both, or OT.

---

### 92. Google Maps

**Answer:** Requirements: render map tiles, search/POI, routing (driving, transit, walking, with traffic), navigation, billions of users. Components: Tile service (pre-rendered raster + vector tiles at zoom levels, served via CDN), Search/Geocoding (Elasticsearch-style + ML ranking, address normalization), Routing service (graph of road segments with weights; algorithms like Contraction Hierarchies / CRP for fast queries; real-time traffic adjusts weights), Traffic ingest (anonymized GPS pings from devices into stream processor), POI database (places + reviews), Imagery pipeline (Street View). Scaling: tiles are CDN-friendly (90%+ cache hit); routing queries are CPU-heavy and partitioned by region. Tradeoffs: pre-computed routes lose freshness; real-time computation is slow without hierarchical algorithms.

**Key points:**
- Pre-rendered tiles + CDN.
- Contraction Hierarchies for fast routing.
- Real-time traffic via crowdsourced GPS.
- Region-partitioned routing services.

---

### 93. Distributed rate limiter

**Answer:** Requirements: enforce per-user/per-key RPS limits across N edge nodes globally, low overhead, accept slight over-limit during partitions. Algorithms: token bucket (allows bursts up to bucket size, refills at rate), sliding window log (precise but memory-heavy), sliding window counter (approximate, cheap). Implementation: Redis with INCR + EXPIRE (centralized, simple, but adds latency); local in-memory with periodic sync (eventual, can overshoot); Lua scripts on Redis for atomicity. For global limits, use a central Redis cluster or hierarchical (local soft cap + central hard cap). Tradeoffs: precision vs latency; allow small overage to keep latency low. CRDTs (PN-counters) work for eventually consistent counts across regions.

**Key points:**
- Token bucket is the practical default.
- Redis + Lua for atomic check-and-decrement.
- Local soft + global hard for low latency.
- Allow small overage to save round trips.

---

### 94. Distributed cache (Redis-like)

**Answer:** Requirements: low-latency KV store, horizontal scale, optional replication, eviction policies, billions of ops/sec. Components: Sharding (consistent hashing or partitioned slots—Redis Cluster uses 16384 slots), Replication (primary + replicas per shard, async or semi-sync), Client (slot-aware, pipelining), Eviction (LRU, LFU, allkeys-random, TTL). Failure: gossip protocol detects dead nodes, replicas promoted automatically. For persistence: append-only file (AOF) or snapshots (RDB). Scaling: add shards online; client follows MOVED/ASK redirects. Tradeoffs: replication is async (small data loss on failover possible); large keys cause hot shards (split or use client-side sharding); pipelining + connection pooling critical for throughput.

**Key points:**
- Consistent hashing or fixed slot count.
- Async replication; small data loss possible.
- Gossip + auto-promotion for HA.
- Eviction policy per workload.

---

### 95. Typeahead / autocomplete

**Answer:** Requirements: sub-100ms suggestions as user types, personalized + popular queries, multi-language, billions of queries. Components: Trie or FST (finite-state transducer) of popular queries with scores—built offline from query logs, refreshed hourly/daily; in-memory on suggestion nodes for speed. Query service: each keystroke fires a lightweight request, returns top-K completions ranked by frequency + recency + personalization. Personalization: blend global suggestions with user history (browser-cached or per-user index). Scaling: shard suggestion index by prefix or replicate read-only; CDN-cache common prefixes; debounce client-side (200ms). Tradeoffs: freshness vs index build cost; popularity bias suppresses long-tail queries—mix in fresh queries from real-time stream.

**Key points:**
- Trie/FST built offline from logs.
- Shard or replicate read-only index.
- Debounce + client-side cache.
- Mix popular + fresh + personalized.

---

### 96. Web crawler

**Answer:** Requirements: crawl billions of pages, respect robots.txt, dedupe URLs, prioritize fresh/popular content, polite (per-domain rate limits). Components: URL frontier (priority queue, sharded by domain for politeness), Fetcher pool (HTTP clients with per-domain throttling), Robots cache, Parser (extract links + content), Dedup store (Bloom filter for "seen URLs" + content hash to dedupe near-duplicates), Storage (raw HTML in S3, structured data in DB), Scheduler (revisit policy based on change rate). Scaling: shard frontier by domain hash; many fetcher workers per shard but cap per-domain RPS; distributed Bloom filter or sharded by URL hash. Tradeoffs: freshness vs politeness vs coverage; sitemap hints help; JS-heavy pages need headless browser (expensive—reserve for high-value sites).

**Key points:**
- Per-domain politeness via sharded frontier.
- Bloom filter for seen-URL dedup.
- Sitemap + revisit policy for freshness.
- Headless browser only for JS-heavy sites.

---

### 97. Metrics/monitoring (Prometheus-like)

**Answer:** Requirements: collect metrics from thousands of services, query with labels, alert on conditions, retain at high resolution short-term and low resolution long-term. Components: Scrapers (pull /metrics endpoints over HTTP—Prometheus model—or accept push for short-lived jobs via Pushgateway), TSDB (columnar, time-partitioned, with label index), Query engine (PromQL or similar), Alert manager (evaluate rules, dedupe, route to PagerDuty/Slack), Long-term storage (Thanos, Cortex, Mimir for HA + multi-tenancy + cheap object-store-backed history). Scaling: federate scrapers per region; downsample old data; cardinality control (drop or relabel high-cardinality labels at ingest). Tradeoffs: pull simplifies discovery but struggles with short-lived jobs; push requires gateways; cardinality is the #1 killer.

**Key points:**
- Pull (Prom) vs push (StatsD/OTLP) tradeoff.
- TSDB columnar + label index.
- Federate + remote-write for global view.
- Cardinality control at ingest is mandatory.

---

### 98. Log aggregation (Splunk/ELK-like)

**Answer:** Requirements: ingest TB/day of structured + unstructured logs from many services, fast search across recent data, long-term archive, alerting on patterns. Components: Collectors (Fluent Bit, Vector, OTel sidecars) ship logs from pods to a buffer, Buffer (Kafka) absorbs spikes, Indexer (Elasticsearch/OpenSearch, Loki, ClickHouse) writes searchable index, Object store (S3) for raw + cold archive, Query UI (Kibana/Grafana). Loki indexes only labels (cheaper, slower full-text); ES indexes everything (richer queries, expensive at scale). Scaling: shard indices by time; hot/warm/cold tiers; sample noisy services or route to cheap archive only. Tradeoffs: log volume explodes; enforce structured logging, drop debug in prod, sample at the collector.

**Key points:**
- Kafka buffers spikes between collectors and indexer.
- ES = rich queries, expensive; Loki = labels only, cheap.
- Hot/warm/cold tiers cut cost.
- Sample and structure at the source.

---

### 99. Payment system (idempotency, ledger, reconciliation)

**Answer:** Requirements: process payments correctly under retries and partial failures, never double-charge, exact accounting, audit trail, compliance (PCI). Components: Payment API (every request carries an idempotency key—stored with response so retries return the same answer), Ledger service (double-entry bookkeeping: every transaction has equal debits and credits, append-only), Provider adapters (Stripe, Adyen, etc.) with circuit breakers and retries, Reconciliation jobs (compare ledger to provider statements daily, flag discrepancies), Webhook handler (provider notifications—must be idempotent), KYC/AML, Settlement. Data model: accounts + entries (debit/credit pairs). Scaling: shard ledger by account; immutable entries make sharding easy. Tradeoffs: synchronous confirmation simpler but slower; async with status polling scales better. Never let retries cause double charges—idempotency key is the single most important design element.

**Key points:**
- Idempotency key on every mutating request.
- Double-entry ledger, append-only.
- Reconciliation jobs catch drift.
- Webhooks idempotent and signed.

---

### 100. Multiplayer game server (matchmaking, state sync)

**Answer:** Requirements: real-time gameplay (60Hz tick), matchmaking by skill/region/latency, anti-cheat, persistent progression, millions concurrent. Components: Matchmaker (queue per region/mode + skill-based bucketing—MMR; balance fairness vs queue time), Session servers (dedicated per-match processes; spun up on demand via orchestrator like Agones; authoritative simulation), State sync (server-authoritative with client prediction + reconciliation; deltas over UDP; lag compensation for hit detection), Persistent storage (player profile, inventory in SQL; match history in OLAP), Voice/chat (separate service), Anti-cheat (server-side validation + client-side detection). Scaling: regional clusters for latency; bin-packing matches onto session servers; gracefully drain at match end. Tradeoffs: server-authoritative beats cheating but costs CPU; rollback netcode (fighting games) vs client prediction (FPS) differ per genre; lag compensation favors shooter but penalizes target.

**Key points:**
- Authoritative server + client prediction.
- UDP deltas at fixed tick rate.
- Matchmaker balances MMR vs queue time.
- Agones-style orchestration for dedicated session servers.

---
