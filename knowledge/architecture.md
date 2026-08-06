# Architecture & System Design Questions

100 high-frequency questions on software architecture, distributed-systems patterns, scalability, reliability, data modeling, and classic system-design exercises.

---

### 1. Monolith vs microservices vs modular monolith

**Frequency:** High

**Question:** Compare the monolith, microservices, and modular monolith as architectural styles, walking through the tradeoffs of each: what each gives you in terms of development, deployment, team velocity, and scaling, and what each costs (for example the operational complexity microservices add through network failures, distributed tracing, data consistency, and deploy pipelines). Explain how Conway's law and the high cost of extraction should inform your default choice, and describe the concrete signals (team count, deploy cadence, differing scaling profiles, compliance isolation) that would justify moving from a modular monolith toward microservices.

**Answer:** A monolith ships as one deployable; simple to develop, deploy, and reason about, but couples team velocity and scaling. Microservices decompose by bounded context, allowing independent deploys, polyglot stacks, and per-service scaling at the cost of operational complexity (network failures, distributed tracing, data consistency, deploy pipelines). The modular monolith keeps a single deployment but enforces module boundaries via package/assembly structure with explicit interfaces; you get refactor safety without the distributed-system tax. Default to modular monolith until team size, deploy cadence, or scale forces extraction. Microservices pay off when team count exceeds Dunbar-ish limits, services have wildly different scaling profiles, or compliance demands isolation.

**Key points:**
- Conway's law dominates: architecture mirrors org structure.
- Microservices add latency, partial failure, eventual consistency.
- Modular monolith captures most modularity benefits with one deploy.
- Extraction cost is high; prove the seam before splitting.

---

### 2. Event-driven architecture

**Frequency:** High

**Question:** Describe event-driven architecture, where services communicate by publishing immutable events rather than calling each other synchronously. Explain the benefits it unlocks (loose coupling, temporal decoupling, fan-out to new consumers) and the tradeoffs it forces you to handle: harder end-to-end reasoning, eventual consistency, idempotent consumers, replay/DLQ tooling, and schema evolution discipline via a registry. Distinguish events from commands, and explain when to choose EDA versus when to avoid it in favor of synchronous request/response.

**Answer:** Services communicate by publishing immutable events rather than calling each other synchronously. Producers don't know consumers, enabling loose coupling, temporal decoupling (consumers process at their own pace), and easy fan-out for new use cases. Tradeoffs: harder to reason about end-to-end flows, eventual consistency, need for idempotent consumers, replay/DLQ tooling, and schema evolution discipline (Avro/Protobuf with a registry). Choose EDA when workflows are inherently async, you need multiple downstream reactions to the same fact, or you want to decouple write paths from read models (CQRS). Avoid it for simple request/response where strong consistency and immediate confirmation are required.

**Key points:**
- Events are facts; commands are intents.
- Requires schema registry, DLQ, idempotency keys.
- Enables CQRS, event sourcing, audit by default.
- Tracing across hops needs correlation IDs and OpenTelemetry.

---

### 3. CQRS

**Frequency:** High

**Question:** Explain the CQRS pattern: how it splits the write model (commands that mutate state and enforce invariants) from the read model (queries optimized per view), and how events or change data capture project denormalized read models such as search indexes, caches, or materialized views. Cover the benefits (independent read/write scaling, simpler read code, independently evolvable read models) and the costs (eventual consistency between sides, more moving parts, projection rebuild logic, and read-your-writes UX issues). State when CQRS is worth applying versus when it is overkill for simple CRUD.

**Answer:** Command Query Responsibility Segregation splits the write model (commands that mutate state, validated against invariants) from the read model (queries optimized for specific views). Writes hit a normalized store; events or change data capture project denormalized read models tailored per query (search index, cache, materialized view). Benefits: independent scaling of read vs write, simpler read code, ability to evolve read models without touching writes. Costs: eventual consistency between sides, more moving parts, projection rebuild logic. Use CQRS where read/write asymmetry is large or you have many distinct query shapes; don't apply to simple CRUD.

**Key points:**
- Two models, often two databases.
- Reads are eventually consistent vs writes.
- Pairs naturally with event sourcing but doesn't require it.
- Watch out for read-your-writes UX issues.

---

### 4. Event sourcing

**Frequency:** High

**Question:** Explain event sourcing: persisting state as an append-only log of domain events and deriving current state by folding those events, with snapshots to speed up aggregate rehydration. Cover the benefits (perfect audit, time travel, the ability to add new projections from history) and the challenges: forever-versioning event schemas, GDPR erasure via crypto-shredding or tombstones, complex queries needing CQRS read models, and the steep learning curve. Describe which domains fit best and where you should avoid it, and note why it is almost always paired with CQRS.

**Answer:** Persist state as an append-only log of domain events; current state is derived by folding events. Gives perfect audit, time travel, and the ability to add new projections from history. Aggregates are rehydrated by replaying their event stream (with snapshots for performance). Challenges: schema/versioning of events forever, GDPR erasure (crypto-shredding), complex queries (needs CQRS read models), and steep learning curve. Best fit: domains where history is a first-class business concern (finance, ledgers, regulatory) or where multiple consumers need the same facts. Avoid for simple CRUD or when team lacks operational maturity.

**Key points:**
- Events are immutable and append-only.
- Snapshots speed up aggregate rebuilds.
- GDPR needs crypto-shredding or tombstones.
- Almost always combined with CQRS.

---

### 5. DDD: bounded contexts, aggregates, ubiquitous language

**Frequency:** High

**Question:** Explain the core building blocks of Domain-Driven Design and how they manage complexity by modeling around the business. Address (1) the ubiquitous language and how code should match the business vocabulary, (2) bounded contexts as explicit boundaries within which a model is consistent, so the same word can mean different things in different contexts, (3) aggregates as transactional/consistency boundaries with cross-aggregate consistency handled eventually via domain events, and (4) how bounded contexts often map to service boundaries and how context maps document relationships. Contrast DDD done well against DDD done as ceremony.

**Answer:** Domain-Driven Design tackles complexity by modeling around the business. A bounded context defines an explicit boundary where a model and its ubiquitous language are consistent—the same word (Customer, Order) can mean different things in different contexts. Aggregates are consistency boundaries: a root entity plus the objects whose invariants must be enforced together in a single transaction. Cross-aggregate consistency is eventual, via domain events. Bounded contexts often map to service boundaries; context maps document relationships (shared kernel, customer/supplier, anti-corruption layer). Done well, DDD aligns code and conversation; done as ceremony, it produces anemic models with extra classes.

**Key points:**
- Ubiquitous language: code matches business vocabulary.
- Aggregates = transactional/consistency boundary.
- Bounded context often = service boundary.
- Context map captures inter-context relationships.

---

### 6. Saga (orchestration vs choreography)

**Frequency:** High

**Question:** Explain the saga pattern for coordinating a long-running business transaction across services as a sequence of local transactions with compensating actions on failure. Contrast the two coordination styles: (1) orchestration, where a central orchestrator explicitly calls each step and triggers compensations, giving a visible flow that's easier to debug but a coupling point; and (2) choreography, where each service reacts to and emits events, staying loosely coupled but with an implicit, hard-to-trace flow. Explain which style fits complex branching flows versus simple linear fan-outs, and why every step needs an idempotent compensating action.

**Answer:** A saga coordinates a long-running business transaction across services as a sequence of local transactions with compensating actions if a step fails. Orchestration: a central orchestrator (e.g., Temporal, Camunda) explicitly calls each step and triggers compensations on failure—visible flow, easier debugging, but the orchestrator is a coupling point. Choreography: each service reacts to events and emits new events—loosely coupled but flow is implicit and hard to trace at scale. Orchestration scales better for complex flows with branching; choreography fits simple, linear fan-outs. In both cases, every step needs an idempotent compensating action.

**Key points:**
- Replace 2PC with compensations.
- Orchestration: central brain, easier to debug.
- Choreography: events only, looser but opaque.
- Every step needs an idempotent reverse.

---

### 7. Serverless vs containers vs VMs

**Frequency:** High

**Question:** Compare serverless, containers, and VMs as deployment models across isolation, cold start, ops overhead, packing density, and cost. Address (1) VMs (full OS isolation, predictable performance, longest cold starts, highest ops overhead), (2) containers (shared kernel, fast start, dense packing, best density and control), and (3) serverless/FaaS (abstracts servers, scales to zero, pay-per-invocation, but cold starts, runtime limits, and vendor lock-in). Explain which workloads fit each and roughly where the cost crossover between serverless and containers occurs based on utilization.

**Answer:** VMs give full OS isolation, predictable performance, longest cold starts, highest ops overhead. Containers package app + deps, share kernel, fast start, dense packing—the default for stateful or always-on workloads. Serverless (FaaS like Lambda or container-based like Cloud Run) abstracts servers entirely, scales to zero, pay-per-invocation, but suffers cold starts, runtime limits, and vendor lock-in. Use serverless for spiky, event-driven, or low-traffic workloads where ops savings dominate. Use containers for steady-state services where unit cost matters and you need full control. Use VMs for legacy, GPU, or regulated workloads requiring strong isolation.

**Key points:**
- Serverless: pay per use, cold starts, scale-to-zero.
- Containers: best density and control.
- VMs: strongest isolation, highest overhead.
- Cost crossover happens at ~30-50% utilization.

---

### 8. Horizontal vs vertical scaling

**Frequency:** High

**Question:** Compare horizontal and vertical scaling. Explain vertical (scale-up) scaling (adding CPU/RAM to a single node: simple, no app changes, but ceiling-bound and a single failure domain) and horizontal (scale-out) scaling (adding nodes behind a load balancer: theoretically unlimited and fault tolerant, but requiring statelessness or externalized shared state plus coordination overhead). Discuss why databases are the hardest to scale horizontally and require sharding, note systems that scale out via sharding/consensus (Cassandra, Spanner, CockroachDB), and describe the common hybrid approach.

**Answer:** Vertical (scale-up) adds CPU/RAM to a single node—simple, no app changes, but ceiling-bound and a single point of failure. Horizontal (scale-out) adds nodes behind a load balancer—theoretically unlimited, fault tolerant, but requires statelessness or shared state externalization, plus coordination overhead. Most modern services start stateless behind an LB so horizontal is trivial. Databases historically scaled vertically; modern systems (Cassandra, Spanner, CockroachDB) scale horizontally via sharding/consensus. Hybrid is common: scale vertically until you hit cost or instance limits, then shard.

**Key points:**
- Vertical: simple, ceiling-bound, single failure domain.
- Horizontal: needs stateless or external state.
- DBs hardest to scale horizontally—sharding required.
- Combine: bigger nodes plus more nodes.

---

### 9. Stateless vs stateful

**Frequency:** High

**Question:** Compare stateless and stateful services. Explain why stateless services (holding no session/data locally, with state pushed to DBs, caches, or object stores) make horizontal scaling, rolling deploys, and failure recovery trivial. Then explain stateful services (keeping state in memory or on local disk, e.g., Kafka brokers, Elasticsearch nodes, game servers, WebSocket connection state) and what they require: sticky routing, careful rebalancing on scale events, and slower recovery. Describe the recommended approach of stateless app tiers with state in managed stores, and the techniques (consistent hashing, persistent volumes, pre-stop drain hooks) for when you must be stateful.

**Answer:** Stateless services hold no session/data locally; any instance can serve any request, making horizontal scaling, rolling deploys, and failure recovery trivial. State lives in DBs, caches, or object stores. Stateful services keep state in memory or local disk (Kafka brokers, Elasticsearch nodes, game servers, WebSocket connection state), requiring sticky routing, careful rebalancing on scale events, and slower recovery. Aim for stateless app tiers with state pushed to managed stateful systems. When you must be stateful, use consistent hashing, persistent volumes, and pre-stop hooks to drain gracefully.

**Key points:**
- Stateless = trivial horizontal scaling.
- Stateful needs sticky routing and rebalancing.
- Push state to managed stores when possible.
- Sticky sessions are an anti-pattern for HTTP.

---

### 10. Load balancing (RR, least-conn, hash, weighted)

**Frequency:** High

**Question:** Explain the common load balancing algorithms and when to use each: (1) round-robin (cheap and simple, assumes uniform requests), (2) least-connections (routes to the instance with fewest active connections, better for long-lived or variable-duration requests), (3) consistent hashing (routes by key such as user or tenant ID so the same key hits the same backend, essential for cache and stateful affinity and minimizing reshuffles on topology change), and (4) weighted variants (for heterogeneous instances or canary shifting). Also explain why power-of-two-choices random selection often beats round-robin for tail latency, and how to pick by traffic shape.

**Answer:** Round-robin distributes evenly when requests are uniform; cheap and simple. Least-connections routes to the instance with fewest active connections—better for long-lived or variable-duration requests. Consistent hashing routes by key (user ID, tenant) so the same key consistently hits the same backend—essential for caches and stateful systems, minimizes reshuffles on topology change. Weighted variants account for heterogeneous instance sizes or canary traffic shifting. Random with two choices ("power of two") often beats RR for tail latency. Pick by traffic shape: uniform short=RR, varied=least-conn, cache affinity=hash.

**Key points:**
- RR: simple, assumes uniform requests.
- Least-conn: handles variable durations.
- Consistent hash: cache and stateful affinity.
- Power-of-two-choices reduces tail latency.

---

### 11. CAP & PACELC in practice

**Frequency:** High

**Question:** Explain the CAP theorem and its PACELC extension, and how they apply in practice. Cover (1) how CAP forces a choice between consistency and availability only during a network partition, and (2) how PACELC adds that even without a partition (Else) you trade Latency against Consistency. Explain why the choice is really made per-operation rather than per-system (e.g., bank transfers favoring CP, social feeds favoring AP), classify example systems (Spanner as roughly CP/PC-EL, Dynamo as roughly AP/PA-EL), and argue for using CAP as a framing tool rather than a checkbox.

**Answer:** CAP says under a network partition you must choose between consistency and availability. PACELC extends it: even when no partition (Else), you trade Latency vs Consistency. Real systems make this choice per operation: bank transfers favor CP (refuse during partition), social feeds favor AP (stale but served). Many "consistent" systems are PC/EL (strong consistency always, low latency normally) like Spanner; many "available" ones are PA/EL (always available, fast, eventually consistent) like Dynamo. Use CAP as a framing tool, not a checkbox—analyze per workload, per operation.

**Key points:**
- CAP only applies during partition.
- PACELC adds normal-case latency vs consistency.
- Choice is per-operation, not per-system.
- Spanner ~ CP; Dynamo ~ AP.

---

### 12. Eventual consistency patterns

**Frequency:** High

**Question:** Explain the patterns used to make eventual consistency tolerable for users and correct for data. Address (1) read-your-writes (routing reads to the primary after a write, or attaching a write token), (2) monotonic reads (sticky session to the same replica), (3) causal consistency (tracking happens-before via vector clocks or session tokens), (4) bounded staleness with a measurable SLA (Cosmos DB style), plus optimistic UI to hide lag and idempotent writes or CRDTs to eliminate merge conflicts. Emphasize documenting the consistency contract per endpoint so consumers don't assume strong semantics.

**Answer:** Embrace staleness with tools that mask it: read-your-writes (route reads after a write to the primary or attach a write token), monotonic reads (sticky session to same replica), causal consistency (track happens-before via vector clocks or session tokens), bounded staleness (Cosmos DB style: at most N seconds or M ops behind). For UX, optimistic UI (apply locally, reconcile on confirmation) hides lag. For data correctness, idempotent writes and CRDTs eliminate merge conflicts. Document the consistency contract per endpoint so consumers don't assume strong semantics.

**Key points:**
- Read-your-writes via primary routing or tokens.
- Bounded staleness gives a measurable SLA.
- Optimistic UI hides lag from users.
- Document consistency contract per API.

---

### 13. Strong vs eventual vs causal consistency

**Frequency:** High

**Question:** Compare strong, eventual, and causal consistency. Explain (1) strong/linearizable consistency (every read sees the latest committed write; expensive, requires consensus, limits availability and latency), (2) eventual consistency (replicas converge if writes stop; cheapest and most available but reads may be stale or out of order), and (3) causal consistency (preserves happens-before relationships without total ordering, a sweet spot for collaborative apps and chat). Mention where sequential consistency sits, and give examples of choosing per operation (account balance read = strong, social timeline = eventual, chat within a thread = causal).

**Answer:** Strong (linearizable): every read sees the latest committed write; expensive, requires consensus, limits availability and latency. Eventual: replicas converge if writes stop; cheapest, most available, but reads may be stale or out of order. Causal: preserves happens-before relationships (if A caused B, all observers see A before B) without total ordering—a sweet spot for collaborative apps and chat. Sequential consistency sits between strong and causal. Choose per operation: account balance read = strong; social timeline = eventual; chat messages within a thread = causal.

**Key points:**
- Strong: linearizable, expensive.
- Eventual: cheap, may be stale or reordered.
- Causal: preserves cause-effect ordering.
- Choose per operation, not per system.

---

### 14. Distributed transactions: 2PC vs sagas

**Frequency:** High

**Question:** Compare two-phase commit (2PC) and sagas for distributed transactions. Explain how 2PC coordinates a transaction across resources via a coordinator's prepare/commit phases, guaranteeing atomicity but blocking on coordinator failure, not scaling, and coupling services tightly. Then explain how sagas decompose the work into local transactions with compensating actions that undo prior steps on failure, providing eventual atomicity without locking but requiring compensations that are idempotent and semantically meaningful (e.g., a real refund rather than 'un-charging'). Explain when to use 2PC (inside one DB cluster or XA-aware infra) versus sagas (across services), and why orchestrated sagas are easier to debug than choreographed ones.

**Answer:** Two-phase commit coordinates a transaction across resources via a coordinator (prepare/commit). Guarantees atomicity but blocks on coordinator failure, doesn't scale, and couples services tightly—rarely used across microservices. Sagas decompose into local transactions with compensations: if step 3 fails, run undo for 1 and 2. Provides eventual atomicity without locking, scales, but compensations must be idempotent and semantically meaningful (you can't "uncharge" a credit card without an actual refund). Use 2PC only inside one DB cluster or XA-aware infra; use sagas across services.

**Key points:**
- 2PC: blocking, doesn't scale across services.
- Sagas: local txns plus compensations.
- Compensations must be idempotent and meaningful.
- Orchestrated sagas easier to debug than choreographed.

---

### 15. Read replicas & replication lag

**Frequency:** High

**Question:** Explain read replicas and replication lag. Describe how offloading read traffic to N replicas works, contrasting asynchronous replication (fast but reads may be stale, with lag spiking during heavy writes, network issues, or replica restarts) with semi-synchronous replication (waits for at least one replica ack before commit, safer for failover but slightly slower writes). Explain how to monitor lag in both seconds and bytes behind primary and alert at thresholds, how to route critical post-write reads to the primary or use read-your-writes tokens, and why read replicas don't help write scaling, so you must shard once primary write throughput becomes the bottleneck.

**Answer:** Offload read traffic from the primary by replicating to N replicas (async or semi-sync). Async is fast but reads may be stale (lag spikes during heavy writes, network issues, or replica restarts). Semi-sync waits for at least one replica ack before commit—safer for failover, slightly slower writes. Monitor lag (seconds and bytes behind primary) and alert at thresholds (e.g., >5s). Route critical reads (account balance, post-write reads) to primary or use "read your writes" tokens. Beware: scaling reads with replicas helps until write throughput on primary becomes the bottleneck—then you need sharding.

**Key points:**
- Async = fast but stale; semi-sync = safer.
- Monitor lag in seconds and bytes.
- Route post-write reads to primary.
- Replicas don't help write scaling—shard then.

---

### 16. Sharding strategies & rebalancing

**Frequency:** High

**Question:** Explain the main sharding strategies and the challenge of rebalancing. Cover (1) hash sharding (even distribution but reshuffles on node-count change, mitigated by consistent hashing or virtual nodes), (2) range sharding (good for range queries but prone to hot spots), (3) directory/lookup sharding (flexible via an explicit shard map, but the map is a bottleneck and SPOF), and (4) geo sharding (by region for locality). Then explain why rebalancing is the hard part, how moving data without downtime requires dual-write, backfill, and cutover (or a system that does it natively like Cassandra, Vitess, or CockroachDB), and why you should plan for resharding and pick a high virtual shard count before launch.

**Answer:** Hash sharding: shard = hash(key) % N; even distribution but reshuffles on N change (mitigate with consistent hashing or virtual nodes). Range sharding: contiguous ranges per shard (good for range queries, prone to hot spots). Directory/lookup: explicit shard map (flexible, but the map itself is a bottleneck/SPOF). Geo sharding: by region for locality. Rebalancing is the hard part—moving data without downtime requires dual-write, backfill, and cutover or a system that does it natively (Cassandra, Vitess, Cockroach). Always plan for resharding before launch; pick a high virtual shard count.

**Key points:**
- Hash: even but no range queries.
- Range: range scans, hot-spot risk.
- Consistent hashing minimizes reshuffles.
- Use many virtual shards to ease rebalancing.

---

### 17. Caching layers & invalidation

**Frequency:** High

**Question:** Explain caching layers and cache invalidation. Enumerate the layers (browser, CDN, edge cache, API gateway cache, in-process application cache, shared cache like Redis/Memcached, DB buffer pool) and the write/read strategies (cache-aside, read-through, write-through, write-behind) with their tradeoffs. Then cover the invalidation options (TTL, explicit invalidation on write, event-driven via CDC), how to mitigate cache stampedes (request coalescing, jittered TTLs, stale-while-revalidate), and which metrics matter (hit ratio, tail latency). Explain why cache-aside is the usual default and why invalidation is the hard problem.

**Answer:** Layers: browser, CDN, edge cache, API gateway cache, application cache (in-process), shared cache (Redis/Memcached), DB buffer pool. Strategies: cache-aside (lazy, app manages), read-through (cache fetches on miss), write-through (sync write to cache + DB), write-behind (async write, risk of loss). Invalidation options: TTL (simplest, accepts staleness), explicit invalidation on write (consistent but coupling), event-driven (CDC fires invalidation). Stampedes mitigated by request coalescing, jittered TTLs, and stale-while-revalidate. Cache hit ratio and tail latency are the metrics that matter.

**Key points:**
- Many layers—measure each one.
- Cache-aside is the default.
- TTL + jitter prevents stampedes.
- Invalidation is the hard problem.

---

### 18. Circuit breaker

**Frequency:** High

**Question:** Explain the circuit breaker pattern: how it wraps remote calls, tracks failure rate, and transitions through closed, open (fails fast to stop hammering a broken dependency), and half-open (probes recovery after a cool-down) states, closing again on success. Explain how it prevents cascading failure and frees resources held in retry loops, and describe the key configuration knobs (error threshold, open duration, half-open probe count) and fallback behaviors (stale cache, default response, queue for later). Emphasize that it complements rather than replaces timeouts, and note that it is provided by libraries (Resilience4j, Polly) or a service mesh.

**Answer:** Wraps remote calls; tracks failure rate; opens (fails fast) when threshold tripped to stop hammering a broken dependency; half-opens after a cool-down to probe recovery; closes on success. Prevents cascading failure and frees resources held in retry loops. Configure: error threshold (e.g., 50% of last 100 requests), open duration (10s), half-open probe count. Important: tune fallback behavior—stale cache, default response, queue for later. Not a substitute for timeouts (always set those first). Implement in libraries (Resilience4j, Polly) or service mesh.

**Key points:**
- States: closed, open, half-open.
- Prevents cascade and saves resources.
- Pair with timeouts and fallbacks.
- Library or mesh-provided.

---

### 19. Timeouts, retries, exponential backoff, jitter

**Frequency:** High

**Question:** Explain the discipline around timeouts, retries, exponential backoff, and jitter for remote calls. Cover why every remote call needs a timeout set shorter than the caller's (budget propagation), why you should retry only idempotent operations with a capped number of attempts, why exponential backoff plus full jitter avoids a thundering herd and prevents retries from re-synchronizing, and which responses to retry (5xx and network errors) versus not (4xx client errors). Explain how retries must be combined with circuit breakers so you don't hammer a broken dependency, and why tracking retry rates is a valuable early health signal.

**Answer:** Every remote call needs a timeout—infinite waits cascade into outages. Set timeouts shorter than the caller's timeout (budget propagation). Retry only idempotent ops; cap attempts (3 is usually enough); use exponential backoff to avoid thundering herd; add full jitter so retries don't re-synchronize. Don't retry 4xx (client errors); retry 5xx and network errors only. Combine with circuit breakers: retries while the dependency is broken just make things worse. Track retry rates as a health signal—a sudden spike often precedes outages.

**Key points:**
- Timeouts everywhere; shorter than parent.
- Retry only idempotent ops, capped.
- Full jitter > no jitter to break herds.
- Skip retries when circuit is open.

---

### 20. SQL vs NoSQL decision matrix

**Frequency:** High

**Question:** Walk through a decision matrix for choosing between SQL and the various NoSQL database families. Address (1) SQL (rich queries, transactions, joins, mature tooling, strict schema; the default), (2) document stores like MongoDB/DynamoDB (flexible schema, single-document atomicity, variable shapes, high write throughput), (3) wide-column stores like Cassandra/ScyllaDB (massive write throughput, tunable consistency, time-series), (4) key-value stores like Redis (simple access patterns, sub-ms latency), and (5) graph databases like Neo4j (relationship-heavy queries). Explain how to decide by access pattern, consistency needs, scale, and operational maturity, and why you shouldn't pick NoSQL 'for scale' until SQL is proven inadequate.

**Answer:** SQL (Postgres, MySQL): rich queries, transactions, joins, mature tooling, strict schema—the default unless something rules it out. Document (MongoDB, DynamoDB): flexible schema, single-document atomicity, good for variable shapes and high write throughput. Wide-column (Cassandra, ScyllaDB): massive write throughput, tunable consistency, time-series. Key-value (Redis, DynamoDB): simple access patterns, sub-ms latency. Graph (Neo4j): relationship-heavy queries. Decide by access pattern (queries known up-front favor NoSQL design), consistency needs, scale (most apps fit in Postgres for a long time), and operational maturity. Don't pick NoSQL "for scale" until SQL has proven inadequate.

**Key points:**
- SQL is the default until proven wrong.
- NoSQL choice depends on access pattern.
- Wide-column for write-heavy at scale.
- Graph DBs for true relationship queries.

---

### 21. AuthN vs AuthZ architecture

**Frequency:** High

**Question:** Contrast authentication and authorization and explain why you should separate them architecturally. Cover: (1) what AuthN handles (login, sessions, MFA, passwordless) versus what AuthZ handles (RBAC/ABAC, policy evaluation, resource scoping), (2) centralizing AuthN in an identity provider, (3) central versus distributed AuthZ using engines like OPA, Cedar, or AuthZed/SpiceDB, (4) what tokens (JWT/OIDC) should carry versus fine-grained resource-layer evaluation, and (5) auditing every authorization decision with subject, action, resource, decision, and reason.

**Answer:** Authentication answers "who are you" (login, sessions, MFA, passwordless); authorization answers "what can you do" (RBAC/ABAC, policy evaluation, resource scoping). Separate them. AuthN typically centralizes in an identity provider (Auth0, Okta, Cognito, internal); AuthZ may be central (OPA, Cedar, AuthZed/SpiceDB) or distributed (per-service policy with shared library). Tokens carry identity (JWT/OIDC) and sometimes coarse roles; fine-grained AuthZ usually evaluates at the resource layer using a policy engine. Audit every authZ decision with subject, action, resource, decision, and reason.

**Key points:**
- AuthN = identity; AuthZ = permissions.
- Central IdP for authN; engine for authZ.
- JWT carries identity, not fine-grained perms.
- Audit decisions with full context.

---

### 22. OAuth 2.0 / OIDC flows

**Frequency:** High

**Question:** Walk through OAuth 2.0 and OIDC. Explain how OAuth 2.0 delegates authorization while OIDC adds authentication, then compare the flows: (1) Authorization Code + PKCE for web/mobile/SPAs, (2) Client Credentials for server-to-server, and (3) Device Code for TVs and CLIs, noting why Implicit and Resource Owner Password are deprecated. Describe the token types (access, refresh, ID token), and the security practices: always use PKCE for public clients, use HTTPS, validate iss/aud/exp/nonce, and store and rotate refresh tokens securely.

**Answer:** OAuth 2.0 delegates authorization (access tokens for APIs); OIDC adds authentication (ID tokens). Flows: Authorization Code + PKCE (web/mobile/SPAs—the modern default), Client Credentials (server-to-server), Device Code (TVs, CLIs). Implicit and Resource Owner Password are deprecated. Tokens: access token (short-lived, sent to APIs), refresh token (long-lived, rotated), ID token (identity claims). Always use PKCE for public clients; use HTTPS; validate `iss`, `aud`, `exp`, `nonce`. Store refresh tokens securely (HTTP-only cookie or secure storage), rotate on use.

**Key points:**
- Authorization Code + PKCE is the default.
- Access token short, refresh token rotated.
- OIDC adds ID token on top of OAuth.
- Always validate iss/aud/exp/nonce.

---

### 23. Blue/green vs canary vs rolling

**Frequency:** High

**Question:** Compare blue/green, canary, and rolling deployment strategies. Explain: (1) rolling (replace pods N at a time; cheap and no extra capacity but slow rollback and bad versions reach some users), (2) blue/green (deploy v2 alongside v1 and switch traffic atomically for instant rollback at the cost of 2x capacity), and (3) canary (route a small percentage to v2, watch SLOs, and ramp gradually with tools like Flagger or Argo Rollouts). When would you mix them by risk level, using canary for risky changes, rolling for routine deploys, and blue/green for DB-coupled or stateful upgrades?

**Answer:** Rolling: replace pods N at a time—simple, no extra capacity needed, but rollback is slow (roll back N at a time) and bad versions reach some users immediately. Blue/green: deploy v2 alongside v1, switch traffic atomically, keep v1 for quick rollback—needs 2x capacity briefly, clean cutover. Canary: route a small % to v2, watch SLOs, ramp gradually—catches issues with minimal blast radius, requires good observability and automated analysis (Flagger, Argo Rollouts). Most teams use canary for risky changes and rolling for routine deploys. Blue/green for DB-coupled or stateful upgrades.

**Key points:**
- Rolling: cheap, slow rollback.
- Blue/green: instant rollback, 2x capacity.
- Canary: gradual, observability-driven.
- Mix per risk level.

---

### 24. Logs vs metrics vs traces

**Frequency:** High

**Question:** Compare the three pillars of observability: logs, metrics, and traces. Explain: (1) logs as discrete richly-contextual events, great for debugging specific incidents but expensive at scale and hard to aggregate, (2) metrics as numeric labeled time-series, cheap and aggregatable for dashboards and alerts but requiring low cardinality, and (3) traces as request flow across services with per-span timing for latency analysis and dependency graphs. Discuss using all three together, how OpenTelemetry unifies instrumentation, why cardinality is the metrics killer, and why you sample traces but never sample errors.

**Answer:** Three pillars of observability. Logs: discrete events with rich context—great for debugging specific incidents, expensive to store at scale, hard to aggregate. Metrics: numeric time-series with labels—cheap, aggregatable, perfect for dashboards/alerts, low cardinality required. Traces: request flow across services with timing per span—great for latency analysis and dependency graphs. Use all three: metrics for SLOs and alerting, logs for incident debugging, traces for understanding distributed flows. OpenTelemetry unifies the instrumentation surface; vendor backends differ (Datadog, Honeycomb, Grafana stack).

**Key points:**
- Metrics for alerts, logs for debug, traces for flow.
- OpenTelemetry standardizes instrumentation.
- Cardinality is the metrics killer.
- Sample traces; never sample errors.

---

### 25. SLI / SLO / SLA & error budgets

**Frequency:** High

**Question:** Explain SLI, SLO, SLA, and error budgets and how they connect. Define an SLI (a measurable indicator like request success rate or p99 latency), an SLO (an internal target on the SLI), and an SLA (an external contract with penalties), then explain the error budget as 1 minus the SLO and how it governs deploy risk: spend budget on risky changes when you're meeting the SLO, freeze risky deploys when it's exhausted. Why should SLIs be user-centric rather than infra metrics, and what role do multi-window multi-burn-rate alerts play?

**Answer:** SLI: measurable indicator (request success rate, p99 latency). SLO: internal target on the SLI (99.9% success over 30d). SLA: external contract with penalties (99.5% with credits). Error budget = 1 - SLO; if you're meeting SLO, you have budget to spend on risky changes; if exhausted, freeze risky deploys until reliability recovers. Forces a quantitative conversation between dev and ops about reliability vs velocity. Pick user-centric SLIs (does the user's request succeed?) not infra metrics (CPU). Multi-window multi-burn-rate alerts catch both fast and slow burns.

**Key points:**
- SLI measures, SLO targets, SLA contracts.
- Error budget governs deploy risk.
- User-centric SLIs over infra ones.
- Multi-window burn-rate alerts.

---

### 26. URL shortener (bit.ly)

**Frequency:** High

**Question:** Design a URL shortener like bit.ly. State the requirements (shorten long URLs to short codes, redirect on GET, track clicks, handle 100B+ links and 100K QPS reads at roughly 10:1 read:write), then walk through: (1) the components (API service, code generator, KV store, analytics pipeline), (2) how you'd generate codes (base62 of an incrementing sharded-counter ID or Snowflake-style), (3) the storage layers (CDN, Redis cache, durable KV like Cassandra/DynamoDB), (4) the data model, and (5) scaling and tradeoffs including 301 versus 302 for analytics and the predictability/security risk of counter-based codes.

**Answer:** Requirements: shorten long URLs to short codes, redirect on GET, track clicks, handle 100B+ links and 100K QPS reads (10:1 read:write). Components: API service (POST /shorten, GET /:code), code generator (base62 of an incrementing ID from a sharded counter or Snowflake-style), KV store (Redis cache + Cassandra/DynamoDB for durability), analytics pipeline (clicks → Kafka → ClickHouse). Data model: {short_code, long_url, owner, created_at, expires_at}. Scaling: CDN caches redirects (301 vs 302—302 to keep analytics), shard KV by short_code hash, cache hottest codes locally. Tradeoffs: counter-based codes are predictable (security risk for private links—use random or hash IDs there); 301 caches forever, harder to revoke.

**Key points:**
- Base62 from sharded counter or Snowflake.
- CDN + Redis + durable KV.
- 302 if you need click analytics.
- Cache hot codes locally to absorb peaks.

---

### 27. Twitter timeline (fan-out on read vs write)

**Frequency:** High

**Question:** Design a Twitter home timeline. State the requirements (post tweets, show a chronological and ranked home timeline of followees, 500M users, celebrities with 100M followers), then compare fan-out on write (precompute each follower's timeline into a Redis inbox: fast reads, expensive celebrity writes) versus fan-out on read (query and merge followees' tweets at read time: cheap writes, expensive reads), and explain the hybrid that fans out on write for normal users but merges celebrity tweets at read time. Cover the components (Tweet, Timeline, Fan-out worker on Kafka, Ranking, Media) and the tradeoffs.

**Answer:** Requirements: post tweets, home timeline of followees in chronological + ranked order, 500M users, celebrities with 100M followers. Fan-out on write: precompute each follower's timeline by pushing new tweets to their inbox (Redis list per user). Fast reads, expensive writes for celebrities (100M inbox updates per tweet). Fan-out on read: query followees' tweets at read time and merge—cheap writes, expensive reads. Hybrid: fan-out on write for normal users; for celebrity tweets, leave them in a separate store and merge at read time. Components: Tweet service (Postgres + Manhattan/Cassandra), Timeline service (Redis inboxes), Fan-out worker (Kafka), Ranking service (ML), Media service. Tradeoffs: hybrid balances write amplification and read latency; ranking eventually replaces strict chronological.

**Key points:**
- Hybrid fan-out: write for normal, read for celebs.
- Redis lists per user as inbox.
- Kafka decouples post from fan-out.
- Ranking model on top of timeline merge.

---

### 28. WhatsApp / chat

**Frequency:** High

**Question:** Design WhatsApp / a chat system. State the requirements (1:1 and group chat, online presence, delivery and read receipts, end-to-end encryption, offline message queueing, 100B messages/day), then cover: (1) the components (Connection service on long-lived WebSockets, Message service with a per-conversation log in Cassandra, Presence via Redis TTLs, push via APNs/FCM for offline, Media on S3+CDN), (2) routing where each user is pinned to a connection node via consistent hashing and recipient lookup forwards to their node, (3) E2E encryption with the Signal Protocol (X3DH + Double Ratchet) where the server stores only ciphertext, and (4) scaling by sharding, geo-routing, and async group fan-out.

**Answer:** Requirements: 1:1 and group chat, online presence, delivery + read receipts, E2E encryption, offline message queueing, 100B msgs/day. Components: Connection service (long-lived WebSockets, millions per node via Erlang-style concurrency), Message service (per-conversation log in Cassandra or custom storage), Presence service (Redis with TTLs), Push notification (APNs/FCM) for offline, Media service (S3 + CDN, E2E-encrypted blobs). Routing: each user pinned to a connection node via consistent hash; recipient lookup → forward to their node. E2E: Signal Protocol (X3DH + Double Ratchet)—server stores ciphertext only. Scaling: shard by user, geo-route to nearest PoP, async fan-out for groups.

**Key points:**
- WebSockets per user; consistent hash to nodes.
- Signal protocol for E2E (X3DH + Double Ratchet).
- Per-conversation log in Cassandra.
- APNs/FCM for offline delivery.

---

### 29. Uber / ride-hailing dispatch

**Frequency:** High

**Question:** Design Uber-style ride-hailing dispatch. State the requirements (match riders to nearby drivers in seconds, real-time location, pricing, surge, ETAs, 10M+ active drivers), then cover the components: (1) a Location service where drivers ping every few seconds into a geo-indexed structure (Google S2 cells or H3 hexes), (2) a Dispatch service with a per-cell index of available drivers and a matching algorithm minimizing pickup ETA plus fairness, (3) real-time pricing/surge per cell, (4) a Trip state machine (requested to matched to in_progress to completed), and payment/notification. Explain scaling by geo-sharding per city/cell with a Kafka location stream, and the tradeoff of nearest-driver versus global optimization.

**Answer:** Requirements: match riders to nearby drivers in seconds, real-time location, pricing, surge, ETAs, 10M+ active drivers. Components: Location service (drivers ping every few seconds; stored in geo-indexed structure—Google S2 cells or H3 hexes), Dispatch service (per-cell index of available drivers; match algorithm minimizes pickup ETA + fairness), Pricing/surge (real-time demand/supply per cell), Trip service (state machine: requested → matched → in_progress → completed), Payment, Notification. Scaling: geo-shard by city/cell (most rides are local), Riak/in-memory geo index, Kafka for location stream, separate dispatch services per region. Tradeoffs: simple nearest-driver vs global optimization (better outcomes but harder); surge balances supply/demand but is politically fraught.

**Key points:**
- Geo-index with S2/H3 cells.
- Per-region dispatch shards.
- Trip state machine for correctness.
- Location stream firehose via Kafka.

---

### 30. Google Drive / Dropbox (file sync)

**Frequency:** High

**Question:** Design Google Drive / Dropbox file sync. State the requirements (sync files across devices, conflict resolution, sharing, versioning, offline edits, petabytes of storage), then cover the components: (1) block storage that splits files into content-addressed chunks hashed for cross-user dedupe, (2) a metadata service (file tree, versions, ACLs, sharded by user/team) as the consistency point, (3) a sync client that watches the local filesystem and uploads only changed chunks rsync-style, (4) a notification service for remote-change events, and (5) a sharing service (ACLs + link tokens). Cover the data model, atomic per-file metadata merges, conflict resolution (LWW plus keep-both, or OT), and the dedup-versus-encryption tradeoff.

**Answer:** Requirements: sync files across devices, conflict resolution, sharing, versioning, offline edits, petabytes of storage. Components: Block storage (split files into chunks, content-addressed by hash—dedupe across users), Metadata service (file tree, versions, ACLs, sharded by user/team), Sync client (watches local FS, computes deltas, uploads changed chunks only), Notification service (long-poll or WebSocket for remote change events), Sharing service (ACL + link tokens). Data model: file = list of chunk hashes + metadata; chunks in object store. Sync: client uploads only new chunks (rsync-style), server merges metadata atomically per file. Conflict: usually last-writer-wins + keep both copies; Drive collaborates via operational transform. Tradeoffs: dedup saves storage but complicates encryption (per-user keys defeat dedup).

**Key points:**
- Content-addressed chunks for dedup.
- Metadata service is the consistency point.
- Client computes deltas; uploads only new chunks.
- Conflict resolution: LWW + keep both, or OT.

---

### 31. Distributed rate limiter

**Frequency:** High

**Question:** Design a distributed rate limiter. State the requirements (enforce per-user/per-key RPS limits across N global edge nodes, low overhead, tolerate slight over-limit during partitions), then compare the algorithms: (1) token bucket (allows bursts, refills at a rate), (2) sliding window log (precise but memory-heavy), and (3) sliding window counter (approximate, cheap). Cover implementation options (Redis INCR+EXPIRE centrally, local in-memory with periodic sync, Lua scripts for atomicity), the hierarchical local-soft-cap plus central-hard-cap approach, and tradeoffs of precision versus latency, including where CRDT PN-counters fit for cross-region counts.

**Answer:** Requirements: enforce per-user/per-key RPS limits across N edge nodes globally, low overhead, accept slight over-limit during partitions. Algorithms: token bucket (allows bursts up to bucket size, refills at rate), sliding window log (precise but memory-heavy), sliding window counter (approximate, cheap). Implementation: Redis with INCR + EXPIRE (centralized, simple, but adds latency); local in-memory with periodic sync (eventual, can overshoot); Lua scripts on Redis for atomicity. For global limits, use a central Redis cluster or hierarchical (local soft cap + central hard cap). Tradeoffs: precision vs latency; allow small overage to keep latency low. CRDTs (PN-counters) work for eventually consistent counts across regions.

**Key points:**
- Token bucket is the practical default.
- Redis + Lua for atomic check-and-decrement.
- Local soft + global hard for low latency.
- Allow small overage to save round trips.

---

### 32. Typeahead / autocomplete

**Frequency:** High

**Question:** Design a typeahead / autocomplete system. State the requirements (sub-100ms suggestions as the user types, personalized plus popular queries, multi-language, billions of queries), then cover: (1) building a Trie or FST of popular queries with scores offline from query logs, refreshed hourly/daily and held in memory on suggestion nodes, (2) a query service where each keystroke returns top-K completions ranked by frequency, recency, and personalization, (3) blending global suggestions with per-user history, and (4) scaling by sharding the index by prefix or replicating read-only, CDN-caching common prefixes, and client-side debouncing. Discuss the freshness-versus-build-cost and popularity-bias tradeoffs.

**Answer:** Requirements: sub-100ms suggestions as user types, personalized + popular queries, multi-language, billions of queries. Components: Trie or FST (finite-state transducer) of popular queries with scores—built offline from query logs, refreshed hourly/daily; in-memory on suggestion nodes for speed. Query service: each keystroke fires a lightweight request, returns top-K completions ranked by frequency + recency + personalization. Personalization: blend global suggestions with user history (browser-cached or per-user index). Scaling: shard suggestion index by prefix or replicate read-only; CDN-cache common prefixes; debounce client-side (200ms). Tradeoffs: freshness vs index build cost; popularity bias suppresses long-tail queries—mix in fresh queries from real-time stream.

**Key points:**
- Trie/FST built offline from logs.
- Shard or replicate read-only index.
- Debounce + client-side cache.
- Mix popular + fresh + personalized.

---

### 33. Web crawler

**Frequency:** High

**Question:** Design a web crawler. State the requirements (crawl billions of pages, respect robots.txt, dedupe URLs, prioritize fresh/popular content, be polite with per-domain rate limits), then cover the components: (1) a URL frontier as a priority queue sharded by domain for politeness, (2) a fetcher pool with per-domain throttling, (3) a robots cache, (4) a parser extracting links and content, (5) a dedup store (Bloom filter for seen URLs plus content hashing for near-duplicates), (6) storage (raw HTML in S3, structured data in a DB), and (7) a scheduler with a revisit policy. Cover scaling by domain-hash sharding and tradeoffs among freshness, politeness, coverage, and when to use a headless browser.

**Answer:** Requirements: crawl billions of pages, respect robots.txt, dedupe URLs, prioritize fresh/popular content, polite (per-domain rate limits). Components: URL frontier (priority queue, sharded by domain for politeness), Fetcher pool (HTTP clients with per-domain throttling), Robots cache, Parser (extract links + content), Dedup store (Bloom filter for "seen URLs" + content hash to dedupe near-duplicates), Storage (raw HTML in S3, structured data in DB), Scheduler (revisit policy based on change rate). Scaling: shard frontier by domain hash; many fetcher workers per shard but cap per-domain RPS; distributed Bloom filter or sharded by URL hash. Tradeoffs: freshness vs politeness vs coverage; sitemap hints help; JS-heavy pages need headless browser (expensive—reserve for high-value sites).

**Key points:**
- Per-domain politeness via sharded frontier.
- Bloom filter for seen-URL dedup.
- Sitemap + revisit policy for freshness.
- Headless browser only for JS-heavy sites.

---

### 34. Payment system (idempotency, ledger, reconciliation)

**Frequency:** High

**Question:** Design a payment system with a focus on correctness. State the requirements (process payments correctly under retries and partial failures, never double-charge, exact accounting, an audit trail, PCI compliance), then cover the components: (1) a payment API where every request carries an idempotency key stored with its response so retries return the same answer, (2) a double-entry, append-only ledger service where debits equal credits, (3) provider adapters (Stripe, Adyen) with circuit breakers and retries, (4) daily reconciliation jobs comparing the ledger to provider statements, (5) an idempotent webhook handler, and KYC/AML and settlement. Cover the accounts-and-entries data model, sharding the ledger by account, and the sync-versus-async confirmation tradeoff, emphasizing why the idempotency key is the single most important element.

**Answer:** Requirements: process payments correctly under retries and partial failures, never double-charge, exact accounting, audit trail, compliance (PCI). Components: Payment API (every request carries an idempotency key—stored with response so retries return the same answer), Ledger service (double-entry bookkeeping: every transaction has equal debits and credits, append-only), Provider adapters (Stripe, Adyen, etc.) with circuit breakers and retries, Reconciliation jobs (compare ledger to provider statements daily, flag discrepancies), Webhook handler (provider notifications—must be idempotent), KYC/AML, Settlement. Data model: accounts + entries (debit/credit pairs). Scaling: shard ledger by account; immutable entries make sharding easy. Tradeoffs: synchronous confirmation simpler but slower; async with status polling scales better. Never let retries cause double charges—idempotency key is the single most important design element.

**Key points:**
- Idempotency key on every mutating request.
- Double-entry ledger, append-only.
- Reconciliation jobs catch drift.
- Webhooks idempotent and signed.

---

### 35. SOA vs microservices

**Frequency:** Medium

**Question:** Explain how SOA and microservices differ, given that both build on the 'service' abstraction. Address (1) the architectural fork between heavy ESB orchestration and smart endpoints/dumb pipes, (2) data ownership (shared canonical schemas and databases versus decentralized per-service data), (3) contract and delivery assumptions (WS-*/canonical XML versus lightweight HTTP/gRPC with continuous delivery and container orchestration), and (4) what each style optimizes for. Note where a service mesh or API gateway blurs the line and why coupling matters more than the label.

**Answer:** SOA emerged in the 2000s around enterprise integration: heavy ESBs, canonical XML schemas, WS-* contracts, and shared databases were common. Microservices borrow the "service" abstraction but invert several defaults: smart endpoints/dumb pipes (no ESB orchestration), decentralized data ownership (no shared schema), polyglot persistence, lightweight HTTP/gRPC contracts, and continuous delivery per service. SOA optimizes for enterprise reuse and governance; microservices optimize for team autonomy and deploy velocity. In practice the line blurs once you add a service mesh or API gateway, but the cultural defaults (who owns the schema, where business logic lives) remain the real distinction.

**Key points:**
- ESB vs dumb pipes is the architectural fork.
- SOA shares data; microservices own data per service.
- Microservices assume CD and container orchestration.
- Both can be done well or poorly; labels matter less than coupling.

---

### 36. Hexagonal / ports-and-adapters

**Frequency:** Medium

**Question:** Explain the hexagonal (ports-and-adapters) architecture: how the application core defines ports (interfaces) for everything it needs and adapters implement those ports for specific technologies, keeping the core free of frameworks and I/O. Explain why this makes the core trivially unit-testable and swappable across delivery mechanisms (HTTP, CLI, queue consumer) using in-memory adapters, distinguishing driver adapters from driven ones. Then discuss the tradeoffs (boilerplate, indirection, over-abstraction) and when the pattern is worth it versus overkill for thin CRUD services.

**Answer:** Application core defines ports (interfaces) for everything it needs (DB, message bus, HTTP). Adapters implement those ports for specific tech. The core has no dependency on frameworks or I/O, making it trivially unit-testable and swappable across delivery mechanisms (HTTP, CLI, queue consumer). Tradeoff: more boilerplate and indirection, easy to over-abstract. Most valuable when the domain logic is rich and long-lived, or when you anticipate multiple delivery channels. For thin CRUD services, the ceremony is overkill—use the framework's defaults.

**Key points:**
- Domain core is framework-agnostic.
- Drivers (HTTP, CLI) and driven (DB, broker) adapters.
- Enables fast tests with in-memory adapters.
- Easy to over-engineer; apply where domain warrants.

---

### 37. Clean architecture (Uncle Bob)

**Frequency:** Medium

**Question:** Explain Clean Architecture (Uncle Bob): the concentric layers (entities, use cases, interface adapters, frameworks/drivers) and the dependency rule that dependencies point only inward via interfaces (Dependency Inversion). Describe how use cases orchestrate entities while adapters translate, and contrast it with hexagonal architecture as being more prescriptive about layering. Cover its strengths (isolated, testable business rules; framework upgrades don't ripple) and weaknesses (proliferation of DTOs and mappers, bloat in small services), and explain how to apply it selectively.

**Answer:** Concentric layers where dependencies point only inward: entities (enterprise rules), use cases (application rules), interface adapters (controllers, presenters, gateways), and frameworks/drivers (web, DB, UI). Outer layers depend on inner via interfaces (Dependency Inversion). Similar in spirit to hexagonal but more prescriptive about layering. Strength: business rules are isolated and testable; framework upgrades don't ripple. Weakness: lots of mapping between layers (DTOs everywhere), and small services get bloated. Apply selectively—keep the dependency rule, drop the strict four-layer template when it adds noise.

**Key points:**
- Dependency rule: inward-only.
- Use cases orchestrate entities; adapters translate.
- DTOs and mappers proliferate—watch the cost.
- Best for complex, long-lived domain logic.

---

### 38. Strangler fig migration

**Frequency:** Medium

**Question:** Explain the strangler fig migration pattern for incrementally replacing a legacy system: how a facade or proxy (often an API gateway or reverse proxy) routes specific functionality per-request to new services while the old system runs alongside, until the legacy is fully strangled and removed. Cover the benefits (continuous value delivery, reduced big-bang risk, per-slice rollback) and the risks (prolonged dual-running, data sync between old and new, business-rule drift). Describe how you'd support it with feature flags, dual writes or CDC, explicit sunset milestones, and a '% strangled' metric.

**Answer:** Incrementally replace a legacy system by routing specific functionality to new services while the old system runs alongside, until the legacy is fully strangled and removed. A facade or proxy (often the API gateway or a reverse proxy) decides per-request whether to hit old or new. Lets you ship value continuously, reduces big-bang risk, and provides rollback per slice. Risks: prolonged dual-running, data sync between old and new, drift in business rules. Pair with feature flags, dual writes (carefully) or CDC, and a clear sunset plan per module. Track the "% strangled" as a leading metric.

**Key points:**
- Proxy routes traffic incrementally.
- Avoids big-bang rewrite risk.
- Requires data sync strategy (dual write or CDC).
- Set explicit sunset milestones.

---

### 39. BFF pattern

**Frequency:** Medium

**Question:** Explain the Backend-for-Frontend (BFF) pattern: placing a dedicated API tier per client type (web, iOS, Android, partner) that aggregates downstream microservices, shapes payloads to each client's needs, and handles client-specific auth flows, avoiding the bloated 'one API to rule them all.' Cover who should own each BFF, the benefits (less over-fetching and fewer round trips), and the tradeoffs (more services to operate, logic duplication across BFFs, tighter coupling to client release cycles). Note how GraphQL can sometimes serve as an alternative.

**Answer:** Backend-for-Frontend places a dedicated API tier per client type (web, iOS, Android, partner). Each BFF aggregates downstream microservices, shapes payloads to the client's needs, handles client-specific auth flows, and avoids the "one API to rule them all" compromise that bloats payloads and slows mobile clients. Owned ideally by the same team that owns the client. Tradeoffs: more services to operate, potential logic duplication across BFFs (extract shared libs/services), and tighter coupling between BFF and client release cycles. GraphQL can sometimes replace BFFs by letting clients project the fields they need.

**Key points:**
- One backend per client experience.
- Reduces over-fetching and round trips.
- Owned by the client team.
- GraphQL is an alternative for some use cases.

---

### 40. Sidecar pattern

**Frequency:** Medium

**Question:** Explain the sidecar pattern: a helper process deployed alongside the main application in the same pod/host, sharing its lifecycle and network namespace. Give common uses (service mesh proxies like Envoy, log shippers, config reloaders, secret fetchers) and explain how it lets the app focus on business logic while cross-cutting concerns are upgraded independently. Then cover the costs (per-pod resource overhead, deploy complexity, debugging which component handled a request) and when the pattern is worthwhile versus when the need belongs in the app itself.

**Answer:** A helper process deployed alongside the main application in the same pod/host, sharing lifecycle and network namespace. Common uses: service mesh proxies (Envoy), log shippers, config reloaders, secret fetchers. The app stays focused on business logic; cross-cutting concerns live in the sidecar and can be upgraded independently. Costs: extra resource overhead per pod, deploy complexity, debugging "who handled this request" (app vs sidecar). Best when the helper is reusable across many services and infrastructure team owns it. Avoid for one-off needs that belong in the app.

**Key points:**
- Co-located helper process.
- Shares network/storage with main container.
- Powers service meshes, log shipping, secrets.
- Adds per-pod overhead—measure.

---

### 41. Service mesh (Istio/Linkerd)

**Frequency:** Medium

**Question:** Explain what a service mesh (e.g., Istio or Linkerd) is and how it works: an infrastructure layer handling service-to-service communication via sidecar proxies (data plane) controlled by a central control plane. Describe the capabilities it provides without app code changes (mTLS, traffic shifting for canary and blue/green, retries, timeouts, circuit breaking, fine-grained authorization, rich telemetry) and the tradeoffs (operational complexity, per-hop latency overhead, per-pod resource cost, another component to debug). Compare Istio and Linkerd, and explain when to adopt a mesh versus relying on library-based resilience.

**Answer:** Infrastructure layer that handles service-to-service communication via sidecar proxies (data plane) controlled by a central control plane. Provides mTLS, traffic shifting (canary, blue/green), retries, timeouts, circuit breaking, fine-grained authZ, and rich telemetry without app code changes. Tradeoffs: significant operational complexity, latency overhead per hop (~1-5ms), resource cost per pod, and yet another component to debug. Istio is feature-rich and heavy; Linkerd is leaner and Rust-based. Adopt when you have many services, multiple languages, and a platform team to operate it. Otherwise stick to library-based resilience (e.g., gRPC retries, Resilience4j).

**Key points:**
- Data plane (sidecars) + control plane.
- Provides mTLS, traffic policy, telemetry.
- Linkerd lighter; Istio more featureful.
- Justify with service count and team capacity.

---

### 42. Outbox pattern

**Frequency:** Medium

**Question:** Explain the outbox pattern and the dual-write problem it solves between a database and a message broker. Describe how the service writes the business change and the outgoing event to the same DB in one transaction (the outbox table), and how a relay (a polling worker or a CDC stream like Debezium) reads the outbox and publishes to the broker, marking rows sent. Cover the guarantees (at-least-once publish without distributed transactions, eventual consistency between DB and broker) and the tradeoffs (commit-to-publish latency, outbox table growth needing archival, consumers that must be idempotent).

**Answer:** Solves dual-write between DB and message broker. The service writes the business change and the outgoing event to the same DB in one transaction (the "outbox" table). A relay (polling worker or CDC stream like Debezium) reads the outbox and publishes to the broker, marking rows as sent. Guarantees at-least-once publish without distributed transactions and keeps DB and broker eventually consistent. Tradeoffs: small latency between commit and publish, outbox table grows (needs archival), and consumers must be idempotent. Pairs well with event-driven and saga architectures.

**Key points:**
- Atomic write of state + event to DB.
- Relay (polling or CDC) publishes downstream.
- At-least-once delivery; consumers must dedupe.
- Avoids unreliable dual-write to broker.

---

### 43. L4 vs L7 LBs

**Frequency:** Medium

**Question:** Compare L4 and L7 load balancers. Explain L4 (TCP/UDP) balancing at the transport layer (fast, protocol-agnostic, no payload inspection; e.g., AWS NLB, HAProxy TCP mode) versus L7 (HTTP, gRPC) balancing that understands the application protocol (routing by host/path/header, TLS termination, retries, sticky cookies, rate limiting, and observability; e.g., Envoy, NGINX, ALB). Discuss the tradeoffs in cost and latency versus flexibility, the common stack of L4 fronting L7 fleets for DDoS scale, and how service meshes are essentially distributed L7 load balancers.

**Answer:** L4 (TCP/UDP) balances at the transport layer—fast, protocol-agnostic, no payload inspection (AWS NLB, HAProxy TCP mode). L7 (HTTP, gRPC) understands the application protocol—can route by host/path/header, terminate TLS, do retries, sticky cookies, rate limiting, and observability (Envoy, NGINX, ALB). L4 is cheaper and lower latency; L7 is more flexible and is where most modern API traffic lives. Common stack: L4 for raw TCP/UDP (gaming, DBs) and L7 for HTTP APIs, with L4 in front of L7 fleets for DDoS scale. Service meshes are essentially distributed L7 LBs.

**Key points:**
- L4: TCP/UDP, fastest, protocol-blind.
- L7: HTTP-aware, rich routing/policy.
- L7 terminates TLS and does retries.
- Often L4 fronts L7 for scale.

---

### 44. Sticky sessions

**Frequency:** Medium

**Question:** Explain sticky sessions: how a load balancer pins a client to a specific backend (via cookie or IP hash) so in-memory session state works. Describe why this solves the stateless gap cheaply but undermines load balancing, complicates rolling deploys (killing an instance loses sessions unless drained), and creates hotspots. Then cover the better alternatives (externalizing session state to Redis/Memcached, signed JWTs, SPA plus token auth) and the narrow legitimate uses that remain, including why WebSocket connections are inherently sticky and how consistent-hash cache affinity differs from stickiness.

**Answer:** LB pins a client (cookie or IP hash) to a specific backend so session state in memory works. Solves the stateless gap cheaply but undermines load balancing, complicates rolling deploys (kill the instance, lose sessions unless drained), and creates hotspots. Better alternatives: externalize session state to Redis/Memcached, use signed JWTs so any instance can verify, or use SPA + token auth. Stickiness still has narrow legit uses: WebSocket connections (the TCP socket is inherently sticky), some legacy apps, and consistent-hash routing for cache affinity (different from stickiness).

**Key points:**
- Pin client to backend via cookie/IP.
- Breaks even load and clean rollouts.
- Prefer externalized session or JWT.
- WebSockets are inherently sticky.

---

### 45. Auto-scaling triggers

**Frequency:** Medium

**Question:** Explain auto-scaling triggers and best practices. Contrast reactive scaling (on CPU, memory, request rate, queue depth, or p95 latency, which is simple but lags spikes) with predictive scaling (scheduled or ML-forecast, which handles known patterns but misses surprises), and argue for combining them. Explain why work-based signals like RPS per replica or queue depth are usually preferable to CPU (which lies under I/O-bound workloads), why you should scale out fast but scale in slowly to avoid thrash, why you must cap maximums to bound cost, and why you should validate scaling with realistic ramp load tests against SLOs.

**Answer:** Reactive: scale on CPU, memory, request rate, queue depth, p95 latency—simple but lags spikes by minutes. Predictive: scale on schedule (peak hours) or ML forecasts—handles known patterns but misses surprises. Best practice: combine. Use queue depth or RPS per replica (work-based) over CPU when possible—CPU lies under I/O-bound workloads. Set conservative scale-in to avoid thrash, fast scale-out to absorb spikes. Cap maximums to prevent runaway cost from feedback loops. Validate with load tests that scaling actually keeps SLOs under realistic ramps, not just steady state.

**Key points:**
- Prefer work-based signals (RPS, queue depth) over CPU.
- Scale out fast, scale in slow (cooldown).
- Combine reactive with scheduled predictive.
- Cap max to bound cost.

---

### 46. Leader election (Raft basics, etcd/ZK)

**Frequency:** Medium

**Question:** Explain leader election in distributed systems and the role of tools like etcd and ZooKeeper. Cover why systems need a single leader (config, locks, sequencing), how Raft elects a leader via randomized timeouts and majority votes and then replicates a log to followers committing entries once a majority acknowledges, and how etcd and Consul use Raft while ZooKeeper uses ZAB. Explain how clients route writes to the leader while reads can come from followers with bounded staleness or linearizably via the leader, the rough failover timing and quorum requirement, and what these systems should and should not be used for.

**Answer:** Distributed systems often need a single leader for coordination (config, locks, sequencer). Raft elects a leader via randomized timeouts and majority votes; the leader replicates a log to followers and commits entries once a majority acknowledges. etcd and Consul use Raft; ZooKeeper uses ZAB (similar guarantees). Clients route writes to the leader; reads can be served from followers with bounded staleness or linearizably via the leader. Failover takes a few hundred ms to seconds. Use these systems for service discovery, leader election, distributed locks, and config—never as a general-purpose DB.

**Key points:**
- Raft = leader + log replication + majority commit.
- etcd, Consul use Raft; ZK uses ZAB.
- Used for locks, discovery, config—not data.
- Failover in seconds; quorum needed.

---

### 47. Quorums & replication factors

**Frequency:** Medium

**Question:** Explain quorums and replication factors. With N replicas where a write needs W acks and a read needs R replies, explain why W + R > N guarantees strong consistency through overlap, and why RF=3 with W=2, R=2 is the Dynamo-classic sweet spot that tolerates one failure with strong reads. Describe the effects of lowering W (fast writes but data-loss risk) or R (fast reads but potentially missing recent writes), how hinted handoff and read-repair fix inconsistencies asynchronously, and how higher RF trades storage and write latency for durability. Explain how to tune W and R for write-heavy versus read-heavy workloads.

**Answer:** With N replicas, a write requires W acks and a read R replies; strong consistency requires W + R > N (overlap guarantees the latest write is seen). RF=3, W=2, R=2 is the Dynamo classic: tolerates one failure with strong reads. Lower W (=1) gets fast writes but risks losing data on failure; lower R (=1) gets fast reads but may miss recent writes. Hinted handoff and read-repair fix inconsistencies async. Higher RF improves durability but costs storage and write latency. Tune per workload: writes-heavy systems lower W and rely on read-repair; reads-heavy systems lower R.

**Key points:**
- W + R > N for strong consistency.
- RF=3 with W=R=2 is a sweet spot.
- Hinted handoff fixes temporary outages.
- Higher RF = more durability, more cost.

---

### 48. Hot-key problem

**Frequency:** Medium

**Question:** Explain the hot-key problem: how a single key (a celebrity's account, a trending product) drives disproportionate load onto one shard or cache entry, saturating it while the rest of the cluster idles. Describe how to detect it (per-key metrics, sampled tracing) and the fixes for reads (client-side request coalescing/singleflight, local cache with short TTL, key splitting with random fan-out and aggregation, a dedicated hot-key cache tier, or read replicas) and for writes (batching and async aggregation such as sharded counters that write to one of N replicas and sum on read). Emphasize planning for this before going viral rather than after.

**Answer:** A single key (Bieber's Twitter, a trending product) drives disproportionate load to one shard or cache entry, saturating it while the rest of the cluster idles. Fixes: client-side request coalescing (singleflight), local cache with short TTL, key splitting (suffix the key with a random fan-out and aggregate), dedicated hot-key cache tier, or read replicas for that key. For writes, batch and async aggregate (e.g., counter sharding: write to one of N replicas, sum on read). Detect via per-key metrics or sampled tracing; mitigate before it pages on-call.

**Key points:**
- Detect via per-key metrics, sampled traces.
- Singleflight and local TTL caches absorb reads.
- Key fan-out (sharded counter) for writes.
- Plan before going viral, not after.

---

### 49. Backpressure & edge rate limiting

**Frequency:** Medium

**Question:** Explain backpressure and edge rate limiting, and distinguish the two. Describe what happens without backpressure (unbounded queue growth, latency spikes, OOM crashes) and how to apply it at every boundary: bounded channels/queues that drop or block when full, max-in-flight semaphores, and per-backend concurrency limits. Cover edge rate limiting with token-bucket limits per client/tenant, responding with 429 plus Retry-After and jittered backoff, and how adaptive concurrency limiters (AIMD style) tune to observed latency. Clarify that rate limiting protects from abuse while backpressure protects from overload, and that you combine both.

**Answer:** Without backpressure, slow consumers cause queues to grow unbounded, latency to spike, and OOM crashes. Apply at every boundary: bounded channels/queues that drop or block when full, max-in-flight semaphores, token-bucket limits per client/tenant at the edge, and concurrency limits per backend. Use 429 with Retry-After and a small jittered backoff hint. Adaptive concurrency limiters (Netflix concurrency-limits, AIMD style) tune dynamically to observed latency. Distinguish: rate limiting protects from abuse, backpressure protects from overload. Combine.

**Key points:**
- Bounded queues everywhere; never unbounded.
- Token bucket per tenant at edge.
- 429 + Retry-After + jitter.
- Adaptive concurrency limits beat static.

---

### 50. Bulkhead

**Frequency:** Medium

**Question:** Explain the bulkhead pattern, named after ship compartments: partitioning resources so a failure in one part can't sink the whole system. Give concrete forms at different levels: separate thread pools or connection pools per downstream dependency (so a slow third-party API doesn't exhaust a shared pool and starve other endpoints), tenant isolation pools or per-priority queues at the service level, and separate clusters per critical workload at the infra level. Explain the tradeoff of lower maximum utilization since slices can't share, when it is worth it for blast-radius reduction, and how it combines with circuit breakers.

**Answer:** Partition resources so a failure in one part can't sink the ship—named after ship compartments. Concretely: separate thread pools or connection pools per downstream dependency, so a slow third-party API doesn't exhaust your shared pool and starve other endpoints. At the service level: tenant isolation pools, per-priority queues. At the infra level: separate clusters per critical workload. Tradeoff: lower max utilization per resource since slices can't share. Worth it for blast radius reduction in any system with diverse latency profiles or critical-vs-best-effort traffic.

**Key points:**
- Per-dependency pool/thread isolation.
- Limits blast radius of one failure.
- Lower utilization, higher resilience.
- Combine with circuit breakers.

---

### 51. Polyglot persistence

**Frequency:** Medium

**Question:** Explain polyglot persistence: using different storage technologies for different needs within one system (for example Postgres for transactional data, Redis for cache and queues, Elasticsearch for search, S3 for blobs, ClickHouse for analytics, Neo4j for graph). Cover the benefit of letting each workload use its best fit, and the costs: added operational burden per store (backups, upgrades, security), data sync between stores via CDC or dual writes, spread-thin team expertise, and harder cross-store transactions. Explain the advice to start single-store, add stores only when justified by clear access patterns, and treat secondaries as projections of the system of record.

**Answer:** Use different storage technologies for different needs within one system: Postgres for transactional, Redis for cache/queues, Elasticsearch for search, S3 for blobs, ClickHouse for analytics, Neo4j for graph. Lets each workload use its best fit. Costs: more operational burden (backups, upgrades, security per store), data sync between stores (CDC, dual writes), team expertise spread thin, and harder cross-store transactions. Start single-store; add new stores only when justified by clear access patterns. Treat secondaries as projections of the system of record.

**Key points:**
- Right tool per access pattern.
- Each store adds ops burden.
- Sync via CDC/events from system of record.
- Resist over-fragmenting early.

---

### 52. CDC & downstream fan-out

**Frequency:** Medium

**Question:** Explain Change Data Capture (CDC) and downstream fan-out: how CDC taps the database's replication log (WAL/binlog) and emits row-change events to a stream (e.g., Debezium into Kafka) that consumers project into search indexes, caches, data lakes, or other services without touching application code. Cover the pros (app stays simple, capture is reliable and misses nothing even if the app crashes between DB and broker, and you get a replayable log) and the cons (events expose the physical schema and couple consumers, ordering and exactly-once need care, schema changes break consumers). Explain when to prefer CDC versus the outbox pattern.

**Answer:** Change Data Capture taps the DB's replication log (WAL/binlog) and emits row-change events to a stream (Debezium → Kafka). Consumers project to search indexes, caches, data lakes, other services—without touching the application code. Pros: app stays simple, capture is reliable (no missed events if app crashes between DB and broker), and you get a replayable event log. Cons: events expose the physical schema (couples consumers), ordering and exactly-once semantics need care, and schema changes break consumers. For domain events, prefer outbox (semantic events from the app); for low-level data sync, CDC is ideal.

**Key points:**
- Reads WAL/binlog; no app changes.
- Reliable: misses nothing on app crash.
- Couples consumers to physical schema.
- Use CDC for data sync, outbox for domain events.

---

### 53. Broker choice: Kafka vs RabbitMQ vs SQS vs Pulsar

**Frequency:** Medium

**Question:** Compare Kafka, RabbitMQ, SQS, and Pulsar as message broker choices. Describe (1) Kafka (durable partitioned log, high throughput, replayable, consumer-managed offsets; best for event streaming, CDC, analytics), (2) RabbitMQ (classic broker with rich routing via exchanges and topics, good for task queues and complex routing, lower throughput, messages deleted on ack), (3) SQS (managed, simple, effectively infinite scale, no ordering except a capped FIFO variant), and (4) Pulsar (log-plus-queue hybrid, multi-tenant, built-in geo-replication and tiered storage, smaller ecosystem). Explain how to choose based on replay needs, routing complexity, and operational appetite.

**Answer:** Kafka: durable, partitioned log; high throughput; replayable; consumer-managed offsets; best for event streaming, CDC, analytics pipelines. RabbitMQ: classic broker with rich routing (exchanges, topics); good for task queues, complex routing, lower throughput; messages typically deleted on ack. SQS: managed, simple, infinite scale, no ordering (FIFO variant exists with caps); great for cloud-native task queues. Pulsar: log + queue hybrid, multi-tenant, geo-replication built in, tiered storage—Kafka competitor with better operational model but smaller ecosystem. Choose by replay needs (Kafka/Pulsar), routing complexity (Rabbit), and ops appetite (SQS).

**Key points:**
- Kafka: log, replay, high throughput.
- Rabbit: routing-rich task queue.
- SQS: managed, simple, no ops.
- Pulsar: log + queue, multi-tenant.

---

### 54. Exactly-once semantics

**Frequency:** Medium

**Question:** Explain exactly-once semantics in messaging and stream processing. Clarify that 'exactly once' usually means effectively-once (at-least-once delivery plus idempotent processing), and that true end-to-end exactly-once requires producer, broker, and consumer to all participate (Kafka transactions with an idempotent producer and transactional offsets, or Flink's two-phase-commit sinks). Then describe the practical approach of making consumers idempotent: deduping by event ID, upserting by primary key, using idempotency keys in HTTP, and storing processed event IDs in a TTL window to reject replays, so broker redeliveries, app retries, and network duplicates are all handled uniformly.

**Answer:** "Exactly once" usually means effectively-once: at-least-once delivery + idempotent processing. True end-to-end exactly-once requires the producer, broker, and consumer to all participate (Kafka transactions with idempotent producer and transactional consumer offsets, or Flink's two-phase commit sinks). In practice, design consumers to be idempotent: dedupe by event ID, upsert by primary key, use idempotency keys in HTTP, store processed event IDs (TTL window) to reject replays. This handles broker redeliveries, app retries, and network duplicates uniformly. Cheaper and more reliable than chasing true exactly-once.

**Key points:**
- True exactly-once is rare and expensive.
- Effectively-once = at-least-once + idempotent.
- Dedupe by event ID or upsert by PK.
- Idempotency keys at every entry point.

---

### 55. Materialized views & read models

**Frequency:** Medium

**Question:** Explain materialized views and read models: precomputing query results so reads are fast and cheap. Contrast how SQL databases (Postgres, Snowflake) refresh materialized views on schedule or on commit with how event-driven systems have projections consume events to write denormalized read models tailored per query. Cover the tradeoffs (write amplification, eventual consistency versus the source, and the cost of rebuilds) and why you must design with rebuild in mind: making projections replayable from raw events or the DB, versioning the projection schema, storing events long enough to rebuild, and running new projections alongside old during cutover.

**Answer:** Precompute query results so reads are fast and cheap. In SQL DBs (Postgres, Snowflake) materialized views refresh on schedule or on commit. In event-driven systems, projections consume events and write denormalized read models tailored per query—same idea, different mechanics. Tradeoffs: write amplification, eventual consistency vs source, and the cost of rebuilds (must be replayable from raw events or DB). Always design with rebuild in mind: version the projection schema, store events long enough to rebuild, and run new projections alongside old during cutover.

**Key points:**
- Precomputed, denormalized read shapes.
- Eventually consistent vs source.
- Rebuildable from events is non-negotiable.
- Version projections for schema changes.

---

### 56. Full-text search (Elasticsearch as projection)

**Frequency:** Medium

**Question:** Explain how to architect full-text search using a search engine (Elasticsearch, OpenSearch, Solr, Meilisearch) as a projection. Cover the capabilities these engines provide that SQL LIKE can't (inverted indexes, tokenization, analyzers, faceting, scoring, aggregations), and the principle of treating search as a projection of a system-of-record database kept updated via events or CDC rather than as the primary store (since it isn't designed for strong consistency or durability under all failures). Explain what you must plan for (a reindex pipeline for schema/analyzer changes, ingest backpressure, resource isolation between search and indexing) and when Postgres full-text search suffices.

**Answer:** Search engines (Elasticsearch, OpenSearch, Solr, Meilisearch) provide inverted indexes, tokenization, analyzers, faceting, scoring, and aggregations—things SQL LIKE can't. Treat search as a projection: system of record is your DB; events or CDC keep the index updated. Don't make ES your primary store—not designed for strong consistency or durability under all failure modes. Plan for reindex (schema/analyzer changes), backpressure on ingest, and resource isolation (search and indexing compete). For smaller scale, Postgres full-text or pgvector + tsvector often suffices.

**Key points:**
- Inverted index, analyzers, faceting.
- Treat as projection, not source of truth.
- Reindex pipeline is mandatory.
- Postgres FTS fits small/medium scale.

---

### 57. Vector DBs & RAG

**Frequency:** Medium

**Question:** Explain how vector databases (Pinecone, Weaviate, Qdrant, pgvector, Milvus) store high-dimensional embeddings and serve approximate-nearest-neighbor queries with indexes like HNSW or IVF, and walk through building a RAG pipeline on top of them. Cover the key architecture concerns: (1) chunking strategy, (2) embedding model versioning and re-embedding on change, (3) hybrid search combining vectors with keyword BM25, (4) reranking with a cross-encoder, (5) freshness on document update, and (6) access-control filtering. When would you reach for pgvector inside Postgres versus a specialized vector DB?

**Answer:** Vector DBs (Pinecone, Weaviate, Qdrant, pgvector, Milvus) store high-dimensional embeddings and answer approximate-nearest-neighbor queries (HNSW, IVF). Used in RAG: chunk documents, embed, store; at query time, embed the query, retrieve top-K relevant chunks, stuff into the LLM prompt. Architecture concerns: chunking strategy, embedding model versioning (re-embed on change), hybrid search (vector + keyword BM25), reranking with a cross-encoder, freshness (re-embed on doc update), and access control filtering. For most apps, pgvector inside Postgres avoids a new store; specialized DBs win at very high scale or very low latency.

**Key points:**
- ANN indexes: HNSW common.
- RAG = retrieve top-K + LLM prompt.
- Hybrid (vector + BM25) beats pure vector.
- pgvector fine for small/medium scale.

---

### 58. Multi-tenant isolation strategies

**Frequency:** Medium

**Question:** Describe the three multi-tenant isolation strategies: (1) silo (one DB or cluster per tenant), (2) pool (shared DB with a tenant_id on every row), and (3) bridge (shared infra with per-tenant schema), and discuss how each trades off cost against isolation and compliance. How would you use a tiered model across free, paid, and enterprise tenants, and what mechanisms (tenant_id enforcement via middleware or RLS, per-tenant rate limits and quotas, per-tenant observability) keep noisy neighbors in check?

**Answer:** Three patterns: silo (one DB/cluster per tenant—max isolation, max cost, easiest compliance), pool (shared DB with tenant_id on every row—cheapest, hardest isolation, noisy-neighbor risk), bridge (shared infra with per-tenant schema—middle ground in Postgres). Choose by tenant size and compliance: enterprise tenants often demand silo; SMB/self-serve tenants live in pool with quotas. Many systems use tiers: pool for free/small, bridge for paid, silo for enterprise. Critical: tenant_id in every query (enforced by middleware or RLS), per-tenant rate limits, and per-tenant observability.

**Key points:**
- Silo, pool, bridge: cost vs isolation.
- Tier model: pool for self-serve, silo for enterprise.
- tenant_id on every row + middleware enforcement.
- Per-tenant quotas prevent noisy neighbors.

---

### 59. Geo-distributed data

**Frequency:** Medium

**Question:** How would you architect geo-distributed data to reduce latency for users and satisfy data-residency laws? Walk through the patterns: (1) read-local/write-global, (2) home-region with each user pinned to a region and replicated for DR, and (3) active-active multi-master using CRDTs or conflict resolution. Contrast systems like Spanner (TrueTime for global strong consistency) and Cosmos DB (tunable consistency), discuss the tradeoffs among consistency, write latency, and complexity, and explain where you'd start.

**Answer:** Place data near users for latency and meet residency laws. Patterns: read-local/write-global (writes go to home region, reads served locally—simple, write latency penalty), home-region (each user pinned to a region, replicated for DR), or active-active multi-master with CRDTs/conflict resolution (Cassandra, Spanner, CockroachDB)—the hardest. Spanner uses TrueTime for global strong consistency; Cosmos DB offers tunable consistency. Tradeoffs: consistency, write latency, and complexity vs locality benefits. Start with home-region and add complexity as latency or compliance demands.

**Key points:**
- Home-region per user is the common default.
- Spanner/CockroachDB for global SQL.
- Cassandra/Cosmos for tunable AP.
- Residency rules pin data to jurisdictions.

---

### 60. Tokens: opaque vs JWT; revocation

**Frequency:** Medium

**Question:** Compare opaque tokens and JWTs and explain how each handles revocation. Cover: (1) opaque tokens as stateful random strings requiring issuer introspection but revocable instantly, (2) JWTs as self-contained signed claims validated locally without a round trip but hard to revoke before expiry, and (3) the mitigations (short TTLs plus refresh tokens, a jti denylist for forced revocation, key rotation, audience scoping). When would you choose opaque plus caching versus JWT, and what does a hybrid approach look like?

**Answer:** Opaque tokens are random strings; the issuer holds state and can revoke instantly via lookup—simple and safe but every API call requires introspection. JWTs are self-contained (signed claims), validated locally without a round trip—fast and stateless but hard to revoke before expiry. Mitigations: short TTLs (5-15 min) + refresh tokens, denylist of jti for forced revocation, key rotation, audience scoping. For B2B/internal, opaque + caching is often simpler. For high-traffic public APIs, JWT is the perf win. Hybrid: JWT for fast path + denylist check for sensitive ops.

**Key points:**
- JWT: stateless, fast, hard to revoke.
- Opaque: stateful, easy revoke, requires lookup.
- Short TTL + refresh mitigates JWT revocation.
- Denylist for emergency revoke.

---

### 61. Secrets management at scale

**Frequency:** Medium

**Question:** How would you manage secrets at scale? Explain why secrets should never be baked into code, images, or committed env vars, and describe centralizing them in a secrets manager (Vault, AWS Secrets Manager, GCP Secret Manager) with fetch-at-startup or runtime, automatic rotation, and audited access. Cover: (1) workload identity (IAM roles, SPIFFE, Vault auth methods) to avoid the bootstrap-secret "turtles all the way down" problem, (2) sidecar or CSI-driver injection into pods, (3) short-lived dynamic secrets over static ones, and (4) CI scanning of repos and images for leaks.

**Answer:** Never bake secrets into code, images, or env vars committed to repos. Centralize in a secrets manager (Vault, AWS Secrets Manager, GCP Secret Manager); fetch at startup or runtime; rotate automatically; audit access. Use workload identity (IAM roles, SPIFFE, Vault auth methods) so apps authenticate to the secrets store without bootstrap secrets—turtles all the way down problem. Sidecars or CSI drivers inject secrets into pods. Short-lived dynamic secrets (DB creds generated per session) beat long-lived static ones. Scan repos and images for leaked secrets in CI.

**Key points:**
- Central store, no secrets in code.
- Workload identity beats bootstrap secrets.
- Dynamic short-lived secrets where possible.
- CI scanning for accidental leaks.

---

### 62. Defense in depth

**Frequency:** Medium

**Question:** Explain the principle of defense in depth and why you shouldn't rely on any single control. Enumerate the layers and what belongs in each: (1) network (firewalls, segmentation, mTLS), (2) identity (MFA, SSO, least privilege), (3) application (input validation, output encoding, parameterized queries, dependency scanning), (4) data (encryption at rest and in transit, tokenization, key management), (5) monitoring (audit logs, anomaly detection, SIEM), and (6) process (code review, threat modeling with STRIDE, incident response). How do practices like patching, continuous scanning, and rehearsing incident response make the layers effective rather than merely present?

**Answer:** Don't rely on any single control. Layers: network (firewalls, segmentation, mTLS), identity (MFA, SSO, least privilege), application (input validation, output encoding, parameterized queries, dependency scanning), data (encryption at rest and in transit, tokenization, key management), monitoring (audit logs, anomaly detection, SIEM), and process (code review, threat modeling, incident response). Each layer assumes others may fail. Threat-model new features (STRIDE) and assume insider threat. Patch promptly, scan continuously, and practice incident response—the layers must work, not just exist.

**Key points:**
- Assume any single control fails.
- Layer network, identity, app, data, monitoring.
- Threat-model new features.
- Practice incident response; don't just write runbooks.

---

### 63. Rate limiting & abuse detection arch

**Frequency:** Medium

**Question:** Design the architecture for rate limiting and abuse detection. Describe the tiers and what each enforces: (1) edge (CDN/WAF for crude IP-based limits and DDoS), (2) API gateway (per-API-key/user RPS via token bucket or sliding window), and (3) per-service (Redis-backed distributed counters or in-process for single instances). Explain applying distinct limits by user class (anonymous, free, paid) and endpoint, feeding anomaly signals (RPS spikes, login failures, credential stuffing) into a behavioral system that issues challenges, step-up auth, or blocks, and responding with 429 plus Retry-After.

**Answer:** Multiple tiers: edge (CDN/WAF for crude IP-based limits and DDoS), API gateway (per-API-key/user RPS with token bucket or sliding window), per-service (Redis-backed counters for distributed limits, or in-process if single instance). Use distinct limits per tier of user (anonymous, free, paid) and per endpoint (login vs read-only). Detect abuse via anomaly signals (sudden RPS spike, login failures, credential stuffing patterns) feeding a behavioral system that issues challenges (CAPTCHA), step-up auth, or temporary blocks. Always respond with 429 + Retry-After and document limits.

**Key points:**
- Layered: edge, gateway, service.
- Token bucket or sliding window on Redis.
- Tier limits by user class and endpoint.
- Pair with anomaly detection and challenges.

---

### 64. RBAC vs ABAC

**Frequency:** Medium

**Question:** Compare RBAC and ABAC. Explain: (1) how RBAC assigns users to roles that grant permissions on resource types and why it's simple and auditable but explodes when permissions vary per resource, (2) how ABAC evaluates policies over attributes of subject, resource, action, and environment for fine-grained flexibility at the cost of harder reasoning and auditing, (3) how real systems blend roles for coarse access with attributes for resource scoping, and (4) where relationship-based access control (ReBAC / Zanzibar-style engines like SpiceDB) fits for "shared with me" scenarios.

**Answer:** RBAC: assign users to roles, roles grant permissions on resource types. Simple, easy to audit, but explodes when permissions vary per resource (per-document, per-tenant)—you end up with thousands of roles. ABAC: policies evaluate attributes of subject, resource, action, and environment (department=engineering AND resource.owner=subject.id). Flexible, scales to fine-grained policies, but harder to reason about and audit. Real systems blend: roles for coarse access, attributes for resource scoping. Modern engines (OPA, Cedar, SpiceDB/Zanzibar) support both; relationship-based (ReBAC) handles "shared with me" elegantly.

**Key points:**
- RBAC: roles, simple, scales poorly with granularity.
- ABAC: policy on attributes, flexible, complex.
- ReBAC (Zanzibar) for relationship sharing.
- Most systems combine RBAC + ABAC.

---

### 65. Twelve-factor app

**Frequency:** Medium

**Question:** Walk through the twelve-factor app methodology and why it's the baseline for cloud-native, container/PaaS-friendly apps. Summarize the twelve factors (codebase, dependencies, config in env vars, backing services as attached resources, separate build/release/run, stateless processes, port binding, scale via the process model, fast startup and graceful shutdown, dev/prod parity, logs as event streams to stdout, and admin tasks as one-off processes), and note how some have evolved (config from env vars plus secrets managers, logs shipped via sidecars) while the core ideas still hold.

**Answer:** Codified principles for cloud-native apps: I codebase per app in version control, II explicit dependencies, III config in env vars, IV treat backing services as attached resources, V strict separate build/release/run, VI stateless processes, VII export services via port binding, VIII scale via process model, IX fast startup/graceful shutdown, X dev/prod parity, XI logs as event streams to stdout, XII admin tasks as one-off processes. Still the baseline for container/PaaS-friendly apps. Some factors evolved (config from env vars + secrets managers, logs via sidecars), but the core ideas hold.

**Key points:**
- Config in env, secrets via managers.
- Stateless processes, scale by count.
- Logs to stdout; collector handles routing.
- Build/release/run strictly separated.

---

### 66. Feature flags decoupling deploy from release

**Frequency:** Medium

**Question:** Explain how feature flags decouple deployment from release. Cover: (1) shipping dark code and enabling it later for specific users or cohorts via runtime flags (LaunchDarkly, Unleash, Flagsmith, or in-house), (2) the capabilities this unlocks (segment-based canary releases, A/B testing, incident kill switches, trunk-based development without long-lived branches), and (3) the costs and discipline required (flag debt cleanup, conditional-logic explosion, untestable combinations, and giving every flag an owner, expiry, and removal task). Why aren't flags a substitute for config management?

**Answer:** Ship dark code, enable for specific users/cohorts later via runtime flags (LaunchDarkly, Unleash, Flagsmith, in-house). Decouples deploy (low-risk, frequent) from release (business decision). Enables canary releases by user segment, A/B testing, kill switches for incidents, and trunk-based development without long-lived branches. Costs: flag debt (clean up old flags!), conditional logic explosion, testing all combinations is impossible. Discipline: every flag has an owner, expiry date, and removal task. Use flags for in-flight features and operational toggles, not for permanent config.

**Key points:**
- Decouples deploy from release.
- Enables targeted canary, A/B, kill switch.
- Flag debt is real—expire and remove.
- Not a substitute for config management.

---

### 67. DB migrations in CD

**Frequency:** Medium

**Question:** How do you run database migrations safely under continuous delivery with rolling deploys? Explain why schema changes must be backward compatible and walk through the expand-migrate-contract pattern: (1) expand by adding new columns/tables additively, (2) migrate app code to the new schema with dual-writes if needed and backfill data, and (3) contract by removing old columns/tables once all instances are upgraded. Also cover avoiding blocking DDL on big tables (pt-online-schema-change, gh-ost, native online DDL), running migrations as a separate CI step rather than at app startup, and rehearsing in staging with prod-shaped data.

**Answer:** Schema changes must be backward compatible to allow rolling deploys. Pattern: expand-migrate-contract. Expand: add new column/table (additive, both versions work). Migrate app code to use new schema, dual-write if needed, backfill data. Contract: remove old column/table after all instances are on the new version. Avoid blocking DDL on big tables (use pt-online-schema-change, gh-ost, or native online DDL). Migrations run as a separate CI step before app deploy, never in the app at startup (race conditions, multi-instance). Always rehearse in staging with prod-shaped data.

**Key points:**
- Expand-migrate-contract for backward compat.
- Use online schema change tools at scale.
- Run as separate CI step, not app startup.
- Rehearse with realistic data volumes.

---

### 68. Liveness/readiness/startup probes

**Frequency:** Medium

**Question:** Explain the three Kubernetes probes and how to configure each correctly. Cover: (1) liveness (is the process alive? failure restarts the pod, so keep it cheap and don't fail on downstream issues or you'll cascade), (2) readiness (can the pod serve traffic? failure removes it from the LB, so check dependencies that block requests like DB connections or a warmed cache), and (3) startup (gates liveness for slow-starting apps so liveness doesn't kill them during boot). Why is probe misconfiguration a top cause of avoidable outages?

**Answer:** Kubernetes uses three probes. Liveness: is the process alive? Failed liveness restarts the pod—keep cheap (process check, simple heartbeat); don't fail on downstream issues or you'll cascade. Readiness: can the pod serve traffic? Failed readiness removes from LB—check dependencies that block requests (DB connection, warmed cache). Startup: for slow-starting apps, gates liveness until the app is up so liveness doesn't kill it during boot. Misconfigured probes are a top cause of avoidable outages—pods restart-looping or cascading failures when readiness is too strict.

**Key points:**
- Liveness: process alive; cheap; don't cascade.
- Readiness: ready to serve; checks deps.
- Startup: protects slow boots.
- Probe misconfig causes outages.

---

### 69. Graceful shutdown & connection draining

**Frequency:** Medium

**Question:** Describe how to implement graceful shutdown and connection draining. Walk through what should happen on SIGTERM: (1) mark the instance unready so the LB stops sending new requests, (2) drain in-flight requests within a grace period, (3) close idle connections, (4) flush buffers (logs, metrics, events), then exit. Explain how Kubernetes sends SIGTERM and waits terminationGracePeriodSeconds before SIGKILL, how a pre-stop hook gives the LB time to notice the unready state, and why stateful services must also reassign partitions/leadership before exiting. What happens on deploys without graceful shutdown?

**Answer:** On SIGTERM: mark unready (LB stops sending new requests), drain in-flight requests with a grace period, close idle connections, flush buffers (logs, metrics, events), then exit. Kubernetes sends SIGTERM then waits `terminationGracePeriodSeconds` (default 30s) before SIGKILL—tune for your workload. Combine with pre-stop hooks to give LBs time to notice the unready state (5-10s sleep). For stateful services, also reassign partitions/leadership before exit. Without graceful shutdown, every deploy drops a small % of requests—visible as elevated error rate during rollouts.

**Key points:**
- SIGTERM, drain, then exit before SIGKILL.
- Pre-stop hook gives LB time to react.
- Tune terminationGracePeriod per workload.
- Stateful services must reassign leadership.

---

### 70. DR: RTO vs RPO

**Frequency:** Medium

**Question:** Explain RTO and RPO and how they drive disaster-recovery architecture and cost. Define RTO (Recovery Time Objective, the downtime budget) and RPO (Recovery Point Objective, the acceptable data loss), and describe how different targets map to architectures: RTO=minutes/RPO=zero requires active-active multi-region with synchronous replication, while RTO=hours/RPO=15min allows a cheaper pilot-light or warm-standby with async replication. Discuss defining these per service tier, and why untested DR (backups, runbooks, failover automation exercised at least quarterly) is effectively no DR.

**Answer:** RTO (Recovery Time Objective): how long until service is restored after disaster. RPO (Recovery Point Objective): how much data loss is acceptable. Drive architecture and cost: RTO=minutes/RPO=zero requires active-active multi-region with synchronous replication (expensive). RTO=hours/RPO=15min allows pilot-light or warm-standby with async replication (cheaper). Define per service tier: payment system has tight RTO/RPO; analytics dashboard tolerates hours. Test DR regularly—untested DR plans don't work. Backups, runbooks, and failover automation must be exercised at least quarterly.

**Key points:**
- RTO = downtime budget; RPO = data loss budget.
- Drives replication and cost.
- Per-service tiering avoids over-spending.
- Untested DR = no DR.

---

### 71. Backup & restore

**Frequency:** Medium

**Question:** Describe a robust backup and restore strategy, starting from the principle that backups are useless without tested restores. Cover: (1) the mix of periodic full backups, incrementals, and continuously archived WAL/binlog for point-in-time recovery, (2) storing backups off-site in another region, encrypted, and immutable to defeat ransomware, (3) testing restores quarterly with realistic data sizes to measure RTO and validate integrity, (4) retention per regulatory needs, and (5) preferring application-consistent backups for databases and capturing backup metadata (schema and app versions) for a compatible restore.

**Answer:** Backups are useless without tested restores. Strategy: full backups periodically (weekly), incrementals between, WAL/binlog archived continuously for point-in-time recovery. Store off-site (different region), encrypted, with access controls (immutable backups defeat ransomware). Test restore quarterly with realistic data sizes—measure RTO, validate integrity. Retention per regulatory needs (7 years for financial). Application-consistent backups (quiesce DB, snapshot) beat crash-consistent for DBs. Backup metadata (schema versions, app versions) so you can restore into a compatible runtime.

**Key points:**
- Full + incremental + continuous WAL.
- Off-site, encrypted, immutable.
- Test restore quarterly.
- App-consistent for databases.

---

### 72. On-call, runbooks, blameless postmortems

**Frequency:** Medium

**Question:** Describe how you would run on-call, runbooks, and blameless postmortems. Cover: (1) rotating on-call to spread knowledge and prevent burnout while capping pages per shift to avoid alert fatigue, (2) giving every alert a runbook of diagnostics and remediation steps, ideally automated, (3) running blameless postmortems that focus on system and process, documenting timeline, root causes, contributing factors, and action items with owners and deadlines, (4) tracking action items to completion and sharing postmortems widely, and (5) practicing incident-command roles (IC, comms lead, scribe).

**Answer:** Rotate on-call to spread knowledge and prevent burnout; cap pages per shift (alert fatigue degrades response). Every alert must have a runbook with diagnostics and remediation steps—ideally automated. Postmortems blameless: focus on system/process, not individuals; document timeline, root cause(s), contributing factors, action items with owners and deadlines. Track action items to completion; otherwise the same incident recurs. Share postmortems widely—the org learns. Practice incident command (one IC, one comms lead, scribe) so coordination during real incidents is automatic.

**Key points:**
- Runbook per alert; automate when possible.
- Cap pages to avoid fatigue.
- Postmortems blameless and action-tracked.
- Practice incident command roles.

---

### 73. Multi-region active-active vs active-passive

**Frequency:** Medium

**Question:** Compare multi-region active-active and active-passive deployments. Explain: (1) active-passive, where one region serves and the other is a warm standby (simpler, no write conflicts, but failover takes minutes and passive capacity is unused), (2) active-active, where both regions serve (lower latency, full capacity utilization, but writes need conflict resolution via CRDTs, last-write-wins, or region affinity and consistency is trickier), and (3) the hybrid home-region routing sweet spot. When would you pick each, and why must failover automation be tested?

**Answer:** Active-passive: one region serves, other is warm standby for failover—simpler, no write conflicts, but failover takes minutes and the passive capacity is unused. Active-active: both regions serve—lower latency for users, full capacity utilization, but writes need conflict resolution (CRDTs, last-write-wins, or region affinity for write paths) and consistency is trickier. Hybrid: home-region routing (each user pinned to a region for writes, reads served locally everywhere)—usually the sweet spot. Active-active for true global apps; active-passive for compliance-driven DR with infrequent failover.

**Key points:**
- Active-passive: simple, warm capacity wasted.
- Active-active: full utilization, write conflicts.
- Home-region routing is the common sweet spot.
- Failover automation must be tested.

---

### 74. Pastebin

**Frequency:** Medium

**Question:** Design a Pastebin. State the requirements (store arbitrary text up to ~10MB, generate a short URL, support expiry and private/unlisted/public visibility, syntax highlighting, ~10K writes/day with 10x reads), then cover: (1) the components (API and web, object store for paste content, metadata DB, search index for public pastes), (2) the data model split between a small metadata row and an S3 object, (3) scaling with a CDN for public pastes and a KV cache for hot ones, (4) handling expiry via S3 lifecycle policies or scheduled cleanup, and (5) why you offload content to S3 rather than storing inline in the DB.

**Answer:** Requirements: paste arbitrary text up to ~10MB, generate short URL, support expiry and private/unlisted/public, syntax highlight, ~10K writes/day, 10x reads. Components: API + web (POST /paste, GET /:id), object store for paste content (S3—cheap, durable, supports range reads for huge pastes), metadata DB (Postgres for {id, owner, visibility, expiry, mime, size}), search index for public pastes (Elasticsearch). Data model: small metadata row + S3 object. Scaling: CDN caches public pastes; KV cache for hot pastes. TTL via S3 lifecycle policies or scheduled cleanup. Tradeoffs: storing inline in DB simplifies up to a point but blows up at scale—offload to S3 from day one.

**Key points:**
- Metadata in SQL, content in S3.
- CDN for public reads.
- Lifecycle policy handles expiry.
- Syntax highlight client-side to save server.

---

### 75. Instagram

**Frequency:** Medium

**Question:** Design Instagram. State the requirements (photo upload, a feed of followees' posts, explore, stories, ~2B users), then walk through the components: (1) an upload service that resizes/transcodes to multiple sizes and stores in S3 behind a CDN, (2) a metadata DB (Cassandra sharded by user_id) for write-heavy post metadata, (3) a hybrid fan-out feed like Twitter's, (4) search/explore on Elasticsearch with ML ranking, and (5) stories with a 24h TTL. Cover the data model, scaling (CDN for photo reads, pre-generated thumbnails, geo-distributed storage), and tradeoffs like ML ranking and sharded counters for likes.

**Answer:** Requirements: photo upload, feed (followees' posts), explore, stories, ~2B users. Components: Upload service (resize + transcode to multiple sizes, store in S3 with CDN), Metadata DB (Cassandra for posts, sharded by user_id), Feed service (fan-out hybrid like Twitter), Search/Explore (Elasticsearch + ML ranking), Stories (separate store with 24h TTL). Data model: post {id, user_id, media_urls, caption, created_at}; relationships in graph or denormalized table. Scaling: CDN absorbs photo reads (the dominant cost), pre-generate thumbnail sizes, geo-distribute storage. Tradeoffs: ML-ranked feed displaces chronological; eventually consistent counters (likes) sharded to avoid hot keys.

**Key points:**
- Image transcoding pipeline + CDN.
- Cassandra for write-heavy post metadata.
- Hybrid timeline fan-out.
- Sharded counters for likes.

---

### 76. Notification system

**Frequency:** Medium

**Question:** Design a notification system. State the requirements (send email/SMS/push/in-app notifications, support templating, user preferences, throttling, scheduling, billions/day), then cover: (1) the components (API, Template service, Preference service for per-user per-type channel opt-in, Routing service, provider gateways like SendGrid/Twilio/APNs/FCM, per-channel queues on Kafka/SQS for backpressure, a Redis dedup store, and tracking/analytics), (2) scaling by sharding queues per provider, retrying with backoff, and rate-limiting to provider quotas, and (3) tradeoffs including idempotency keys to prevent duplicate sends and per-user digests to avoid notification fatigue.

**Answer:** Requirements: send email/SMS/push/in-app notifications, support templating, user preferences, throttling, scheduling, billions/day. Components: API (POST /notify with recipient, template, data), Template service, Preference service (channel opt-in per user per notification type), Routing service (decides channels based on prefs and notification class), Provider gateways (SendGrid, Twilio, APNs/FCM, in-house WebSocket), Queue (Kafka/SQS per channel for backpressure), Dedup store (Redis with notification key TTL), Tracking/analytics (deliveries, opens, clicks). Scaling: shard queues per provider, retry with backoff on provider failures, rate-limit per provider's quota. Tradeoffs: idempotency keys prevent duplicate sends; per-user digest to avoid notification fatigue.

**Key points:**
- Channel gateways behind queues.
- Preferences engine gates delivery.
- Idempotency keys for dedup.
- Per-user digest avoids fatigue.

---

### 77. YouTube

**Frequency:** Medium

**Question:** Design YouTube. State the requirements (upload video, transcode to multiple resolutions/codecs, stream globally with adaptive bitrate via HLS/DASH, comments, recommendations, billions of hours watched), then walk through the components: (1) a resumable chunked upload service, (2) a queue-driven parallel transcoding pipeline producing a resolution ladder (AV1/VP9/H.264), (3) object storage with a cold tier for long-tail content, (4) a multi-tier CDN with edge caching, (5) a metadata DB (Vitess/Spanner), (6) recommendations, and (7) a write-heavy comments store. Cover scaling by pre-positioning popular content near the edge and tradeoffs like storage-vs-CDN cost and per-shot encoding.

**Answer:** Requirements: upload video, transcode to multiple resolutions/codecs, stream globally with adaptive bitrate (HLS/DASH), comments, recommendations, billions of hours watched. Components: Upload service (resumable, chunked), Transcoding pipeline (parallel workers, queue-driven, ladder of resolutions including AV1/VP9/H.264), Storage (object store with cold tier for old/long-tail content), CDN (multi-tier with edge cache), Metadata DB (Vitess/Spanner for video metadata), Recommendation service (ML on watch history), Comments (separate write-heavy store). Scaling: pre-position popular content closer to edge; long-tail served from origin or fewer regional caches. Tradeoffs: storage cost vs CDN cost; transcoding cost vs encode quality (per-shot encoding wins on popular content).

**Key points:**
- Resumable upload + queue-driven transcoding.
- Adaptive bitrate (HLS/DASH).
- Multi-tier CDN; hot/cold storage tiers.
- Per-shot encoding for popular videos.

---

### 78. Netflix

**Frequency:** Medium

**Question:** Design Netflix's streaming architecture. State the requirements (stream pre-encoded movies/shows to millions of concurrent viewers, personalization, multi-CDN, global rights management), then cover the components: (1) a catalog service, (2) a DRM/license service, (3) an encoding pipeline doing per-title and per-shot optimized encodes across many codec/resolution combos, (4) Open Connect, Netflix's own CDN appliances embedded in ISP networks, (5) a playback service (manifests, ABR, session tracking), (6) recommendations with A/B testing, and (7) billing. Explain scaling via pre-positioning the catalog at ISPs by predicted demand and the tradeoffs of upfront encoding cost and ISP-embedded CDN.

**Answer:** Requirements: stream pre-encoded movies/shows to millions of concurrent viewers, personalization, multi-CDN, global rights management. Components: Catalog service (titles, metadata), DRM/license service, Encoding pipeline (per-title and per-shot optimized encodes across many codec/resolution combos), Open Connect (Netflix's own CDN appliances embedded in ISP networks), Playback service (manifests, ABR, session tracking), Recommendation (offline + online ML, A/B testing platform), Billing. Scaling: Open Connect pre-positions catalog at ISPs based on popularity prediction; client picks edge based on probe; chaos-engineering-tested resilience (Chaos Monkey/Kong). Tradeoffs: huge upfront encoding cost amortized over views; ISP-embedded CDN saves transit but adds physical logistics.

**Key points:**
- Open Connect CDN inside ISPs.
- Per-title/per-shot encoding ladder.
- Pre-position catalog by predicted demand.
- DRM + license service per session.

---

### 79. DoorDash / food delivery

**Frequency:** Medium

**Question:** Design a DoorDash-style food-delivery system. State the requirements (customers order from restaurants, dispatch a dasher for pickup and delivery, a three-sided marketplace, ETAs spanning cooking plus driving), then cover the components: (1) a catalog service for menus/availability, (2) an order state machine (placed to confirmed to cooking to ready to picked up to delivered), (3) dispatch that optimizes pickup window, cook time, driving time, and batching multiple orders per dasher, (4) restaurant integration via POS APIs with tablet fallback, (5) payment and notifications, and (6) ML ETA prediction across cook and drive phases. Cover scaling by geo-sharding per metro with Kafka, and tradeoffs like batching versus cold food.

**Answer:** Requirements: customers order from restaurants, dispatch dasher for pickup + delivery, three-sided marketplace, ETAs across cooking + driving. Components: Catalog service (menus, availability), Order service (state machine: placed → confirmed → cooking → ready → picked up → delivered), Dispatch (similar to Uber but optimizing pickup window + cook time + driving time + batching multiple orders per dasher), Restaurant integration (POS APIs, tablet fallback), Payment, Notifications, ETA prediction (ML on cook time + driving). Scaling: geo-shard by metro, Kafka for events between services, real-time ML for ETAs. Tradeoffs: batching boosts dasher earnings but risks cold food; integrations vary in quality (tablet often fallback).

**Key points:**
- Order state machine across three sides.
- Dispatch optimizes cook + drive + batching.
- ML for ETA across two phases.
- Restaurant integration is the messy part.

---

### 80. Google Maps

**Frequency:** Medium

**Question:** Design Google Maps. State the requirements (render map tiles, search/POI, routing for driving/transit/walking with traffic, navigation, billions of users), then cover the components: (1) a tile service serving pre-rendered raster and vector tiles at zoom levels via CDN, (2) search/geocoding with address normalization and ML ranking, (3) a routing service over a graph of weighted road segments using algorithms like Contraction Hierarchies or CRP with real-time traffic adjusting weights, (4) traffic ingest from anonymized GPS pings into a stream processor, (5) a POI database, and (6) an imagery pipeline. Cover scaling (CDN-friendly tiles, region-partitioned CPU-heavy routing) and the freshness-versus-precompute tradeoff.

**Answer:** Requirements: render map tiles, search/POI, routing (driving, transit, walking, with traffic), navigation, billions of users. Components: Tile service (pre-rendered raster + vector tiles at zoom levels, served via CDN), Search/Geocoding (Elasticsearch-style + ML ranking, address normalization), Routing service (graph of road segments with weights; algorithms like Contraction Hierarchies / CRP for fast queries; real-time traffic adjusts weights), Traffic ingest (anonymized GPS pings from devices into stream processor), POI database (places + reviews), Imagery pipeline (Street View). Scaling: tiles are CDN-friendly (90%+ cache hit); routing queries are CPU-heavy and partitioned by region. Tradeoffs: pre-computed routes lose freshness; real-time computation is slow without hierarchical algorithms.

**Key points:**
- Pre-rendered tiles + CDN.
- Contraction Hierarchies for fast routing.
- Real-time traffic via crowdsourced GPS.
- Region-partitioned routing services.

---

### 81. Distributed cache (Redis-like)

**Frequency:** Medium

**Question:** Design a Redis-like distributed cache. State the requirements (low-latency KV store, horizontal scale, optional replication, eviction policies, billions of ops/sec), then cover the components: (1) sharding via consistent hashing or fixed partitioned slots (Redis Cluster's 16384 slots), (2) replication with a primary and replicas per shard (async or semi-sync), (3) a slot-aware pipelining client, and (4) eviction policies (LRU, LFU, allkeys-random, TTL). Explain failure handling via a gossip protocol with automatic replica promotion, persistence via AOF or RDB, online shard addition with MOVED/ASK redirects, and tradeoffs like async replication data loss, large-key hot shards, and the need for pipelining.

**Answer:** Requirements: low-latency KV store, horizontal scale, optional replication, eviction policies, billions of ops/sec. Components: Sharding (consistent hashing or partitioned slots—Redis Cluster uses 16384 slots), Replication (primary + replicas per shard, async or semi-sync), Client (slot-aware, pipelining), Eviction (LRU, LFU, allkeys-random, TTL). Failure: gossip protocol detects dead nodes, replicas promoted automatically. For persistence: append-only file (AOF) or snapshots (RDB). Scaling: add shards online; client follows MOVED/ASK redirects. Tradeoffs: replication is async (small data loss on failover possible); large keys cause hot shards (split or use client-side sharding); pipelining + connection pooling critical for throughput.

**Key points:**
- Consistent hashing or fixed slot count.
- Async replication; small data loss possible.
- Gossip + auto-promotion for HA.
- Eviction policy per workload.

---

### 82. Metrics/monitoring (Prometheus-like)

**Frequency:** Medium

**Question:** Design a Prometheus-like metrics/monitoring system. State the requirements (collect metrics from thousands of services, query with labels, alert on conditions, retain high-resolution short-term and low-resolution long-term), then cover the components: (1) scrapers pulling /metrics endpoints (or accepting push for short-lived jobs via a Pushgateway), (2) a columnar time-partitioned TSDB with a label index, (3) a query engine like PromQL, (4) an alert manager that evaluates rules, dedupes, and routes to PagerDuty/Slack, and (5) long-term storage (Thanos, Cortex, Mimir) for HA, multi-tenancy, and cheap object-store history. Cover scaling by federation, downsampling, and cardinality control, and the pull-versus-push tradeoff.

**Answer:** Requirements: collect metrics from thousands of services, query with labels, alert on conditions, retain at high resolution short-term and low resolution long-term. Components: Scrapers (pull /metrics endpoints over HTTP—Prometheus model—or accept push for short-lived jobs via Pushgateway), TSDB (columnar, time-partitioned, with label index), Query engine (PromQL or similar), Alert manager (evaluate rules, dedupe, route to PagerDuty/Slack), Long-term storage (Thanos, Cortex, Mimir for HA + multi-tenancy + cheap object-store-backed history). Scaling: federate scrapers per region; downsample old data; cardinality control (drop or relabel high-cardinality labels at ingest). Tradeoffs: pull simplifies discovery but struggles with short-lived jobs; push requires gateways; cardinality is the #1 killer.

**Key points:**
- Pull (Prom) vs push (StatsD/OTLP) tradeoff.
- TSDB columnar + label index.
- Federate + remote-write for global view.
- Cardinality control at ingest is mandatory.

---

### 83. Anti-corruption layer

**Frequency:** Low

**Question:** Explain the anti-corruption layer: a translation layer between your bounded context and an external or legacy model that prevents the foreign model from leaking into your domain, implemented as adapters and translators that map external concepts to your ubiquitous language. Describe when it is critical (integrating with legacy systems, third-party APIs, or contexts owned by another team, and at the edge of a strangler fig migration) and its costs (extra mapping code, performance overhead, maintenance when the external model changes). Explain how to decide per-integration whether it is justified.

**Answer:** A translation layer between your bounded context and an external/legacy model that prevents the foreign model from leaking into your domain. Implemented as a set of adapters and translators that map external concepts to your ubiquitous language. Critical when integrating with legacy systems, third-party APIs, or contexts owned by another team. Costs: extra mapping code, performance overhead, maintenance when the external model changes. Skip for trivial integrations; apply when the external model is messy, unstable, or culturally different from yours. Often lives at the edge of a strangler fig migration.

**Key points:**
- Protects domain purity from foreign models.
- Implemented via adapters and translators.
- Essential during legacy migrations.
- Costs maintenance—justify per integration.

---

### 84. Ambassador pattern

**Frequency:** Low

**Question:** Explain the ambassador pattern: a proxy co-located with a client (often as a sidecar) that handles outbound concerns such as service discovery, retries, circuit breaking, TLS, and observability, so the app just talks to localhost while the ambassador handles the network. Explain how it lets you upgrade networking behavior without touching app code and support legacy clients that can't be modified. Contrast it with the more general sidecar pattern, note how service mesh data planes generalize it, and cover the tradeoffs (extra hop, debugging complexity, platform investment).

**Answer:** A proxy that runs alongside (or as a sidecar to) a client and handles outbound concerns: service discovery, retries, circuit breaking, TLS, observability. The app talks to localhost; the ambassador handles the network. Lets you upgrade networking behavior without touching app code and supports legacy clients that can't be modified. Differs from sidecar (general co-located helper) in being specifically a network proxy for outbound calls. Service mesh data planes generalize this. Tradeoffs: extra hop, debugging complexity, requires platform investment.

**Key points:**
- Outbound proxy co-located with client.
- Handles retries, TLS, discovery.
- Decouples networking from app code.
- Service meshes generalize it.

---

### 85. CRDTs for collaborative state

**Frequency:** Low

**Question:** Explain CRDTs (Conflict-free Replicated Data Types) for collaborative state: data structures where concurrent updates from multiple replicas merge deterministically without coordination, achieving strong eventual consistency. Give examples (G-Counter, PN-Counter, OR-Set, LWW-Register, RGA/Yjs for text) and distinguish state-based CRDTs (ship full state, merge via a join function) from operation-based ones (ship ops over reliable causal broadcast). Describe where they are used (collaborative editors, offline-first apps, multi-region databases) and the tradeoffs (growing metadata overhead, merges that ignore intent producing surprising results, and problems that don't map to a CRDT).

**Answer:** Conflict-free Replicated Data Types are data structures where concurrent updates from multiple replicas can be merged deterministically without coordination, achieving strong eventual consistency. Examples: G-Counter, PN-Counter, OR-Set, LWW-Register, RGA/Yjs for text. State-based CRDTs ship full state and merge via a join function; operation-based ship ops over reliable causal broadcast. Used in collaborative editors (Figma, Linear, Notion local-first), offline-first apps, and multi-region databases (Riak, Redis Enterprise). Tradeoffs: metadata overhead grows, intent (vs raw merge) can produce surprising results, and not every problem maps to a CRDT.

**Key points:**
- Mathematically guaranteed convergence.
- No coordination, no central authority needed.
- Yjs/Automerge popular for collaborative text.
- Metadata overhead can be significant.

---

### 86. Lambda vs Kappa architecture

**Frequency:** Low

**Question:** Compare the Lambda and Kappa data architectures. Explain how Lambda runs two parallel pipelines (a batch layer that is slow, accurate, and recomputes from raw, plus a speed layer that is fast, approximate, and near-real-time) with a serving layer merging both, and its pro (handles late data and recomputation) and con (two codebases and systems, sync drift). Then explain how Kappa simplifies to a single replayable streaming pipeline over a durable log like Kafka, how you recompute by replaying the log, and how modern engines (Flink, Spark Structured Streaming) blur the line. Explain when to default to Kappa versus keeping Lambda.

**Answer:** Lambda runs two parallel data pipelines: a batch layer (slow, accurate, recomputes from raw) and a speed layer (fast, approximate, near-real-time), with a serving layer merging both. Pro: handles late data and recomputation. Con: two codebases, two systems, sync drift. Kappa simplifies by using a single streaming pipeline replayable from a durable log (Kafka): need to recompute? Replay the log into a new stream job. Modern stream processors (Flink, Spark Structured Streaming) blur the line. Default to Kappa when your broker can replay history; keep Lambda only if batch tooling is significantly cheaper for cold compute.

**Key points:**
- Lambda: batch + speed layers, duplicated logic.
- Kappa: stream-only, replay from log.
- Kappa needs a durable, replayable log (Kafka).
- Modern engines reduce the dichotomy.

---

### 87. Pipes-and-filters vs orchestrated workflows

**Frequency:** Low

**Question:** Compare pipes-and-filters with orchestrated workflows. Explain pipes-and-filters (independent, often stateless stages connected by streams or queues, each reading input, transforming, and writing output) and where it excels (ETL, media pipelines, log processing, independently scalable stages). Explain orchestrated workflows (a workflow engine like Temporal, Airflow, or Step Functions defining steps, retries, branches, timers, and human-in-the-loop) and where they excel (stateful, branching, long-running business processes needing correctness and visibility). Explain how to choose based on latency, state, and visibility needs, and how the two can coexist.

**Answer:** Pipes-and-filters: independent stages connected by streams or queues, each stage reads input, transforms, writes output—great for ETL, media pipelines, log processing. Easy to scale stages independently and add/remove filters. Orchestrated workflows: a workflow engine (Temporal, Airflow, Step Functions) defines steps, retries, branches, timers, and human-in-the-loop—great for business processes with state, branching, and long timers. Pipes excel at high-throughput data transformation; orchestrators excel at correctness, visibility, and long-running coordination. Many systems use both: pipes inside steps of an orchestrated workflow.

**Key points:**
- Pipes: streaming, stateless stages.
- Orchestrators: stateful, branching, long-running.
- Both can coexist in one system.
- Choose by latency, state, and visibility needs.

---

### 88. Outbox vs CDC for events

**Frequency:** Low

**Question:** Compare the outbox pattern and CDC as ways to produce events. Explain how outbox writes semantically meaningful, app-defined domain events (e.g., OrderPlaced) inside the same transaction as the state change, then a relay publishes them, keeping events stable and decoupled from schema. Contrast that with CDC, which emits low-level row changes derived from the DB log with no app code or extra table, but exposes the physical schema and forces consumers to reconstruct intent. Explain when to use each (outbox when you control the producer and want stable domain events; CDC when you can't change a legacy producer or want data-level sync), noting both are at-least-once so consumers must dedupe.

**Answer:** Outbox writes semantically meaningful domain events (OrderPlaced) inside the same transaction as the state change, then a relay publishes them. Events are app-defined, stable, and decoupled from schema. CDC emits low-level row changes (UPDATE orders SET status='paid') derived from the DB log—no app code, no extra table, but consumers see the physical schema and must reconstruct intent. Use outbox when you control the producer and want stable domain events. Use CDC when you can't change the producer (legacy DB) or you specifically want data-level sync (search index, lake).

**Key points:**
- Outbox: domain events, schema-stable.
- CDC: row-level, no app changes.
- Outbox needs a relay; CDC needs Debezium.
- Both at-least-once; consumers must dedupe.

---

### 89. Stream processing (Flink, Kafka Streams, Spark)

**Frequency:** Low

**Question:** Compare the major stream processing frameworks for processing unbounded event streams with windowing, joins, aggregations, and stateful operators. Describe (1) Flink (true streaming, low latency, sophisticated event-time semantics, checkpoint-based exactly-once; best for complex stateful pipelines), (2) Kafka Streams (a library embedded in your app, simpler ops, scales with partitions, tightly tied to Kafka), and (3) Spark Structured Streaming (micro-batch under a streaming API, great for ETL teams already on Spark, higher latency). Explain how to choose by latency, team familiarity, and complexity, and touch on event-time versus processing-time, watermarks for late data, and checkpointing for exactly-once state.

**Answer:** Process unbounded event streams with windowing, joins, aggregations, and stateful operators. Flink: true streaming, low-latency, sophisticated event-time semantics, checkpoint-based exactly-once, best-in-class for complex stateful pipelines. Kafka Streams: library embedded in your app, simpler ops, scales with partitions, tightly tied to Kafka. Spark Structured Streaming: micro-batch under streaming API, great for ETL teams already on Spark, higher latency. Choose by latency (Flink for ms), team familiarity (Spark for batch shops), and complexity (Kafka Streams for embedded use cases).

**Key points:**
- Event-time vs processing-time matters.
- Watermarks handle late data.
- Checkpointing for exactly-once state.
- Flink for hardest stateful workloads.

---

### 90. Time-series storage

**Frequency:** Low

**Question:** Explain time-series storage: databases optimized for append-only writes by timestamp, aggregations over windows, and retention/downsampling. List representative options (InfluxDB, TimescaleDB, Prometheus, VictoriaMetrics, ClickHouse) and the key features (columnar storage, time-partitioned chunks, automatic downsampling/rollups, TTL-based retention, fast range scans). Explain why using a row-store SQL database at scale is a bad fit (indexes balloon, queries slow), and why cardinality (unique label combinations) is the silent killer in metrics systems that you must budget explicitly and reject high-cardinality labels at ingest.

**Answer:** Optimized for append-only writes by timestamp, aggregations over windows, and retention/downsampling. Options: InfluxDB, TimescaleDB (Postgres extension), Prometheus (pull, ephemeral), VictoriaMetrics, ClickHouse (general but excellent for time-series). Key features: columnar storage, time-partitioned chunks, automatic downsampling/rollups, TTL-based retention, fast range scans. Avoid using a row-store SQL DB at scale—indexes balloon and queries slow. Cardinality (unique label combinations) is the silent killer in metrics systems; budget it explicitly and reject high-cardinality labels at ingest.

**Key points:**
- Columnar + time-partitioned chunks.
- Downsampling and retention built in.
- Cardinality is the failure mode.
- ClickHouse great for ad-hoc analytics.

---

### 91. Tenant partitioning

**Frequency:** Low

**Question:** Within a pooled multi-tenant system, explain how you would partition tenants across shards so noisy neighbors don't cascade. Compare the routing strategies (hash of tenant_id, a lookup table, and a hybrid that pins the top-N tenants to dedicated shards), and describe how you would plan tenant migrations (bulk-export, dual-write window, cutover), enforce per-shard capacity caps, and use per-tenant per-shard observability alongside rate limits and circuit breakers.

**Answer:** Within pooled multi-tenancy, route tenants to shards so noisy neighbors don't cascade. Strategies: hash(tenant_id) for even distribution, lookup table for flexibility (move a big tenant to a dedicated shard), or hybrid (most tenants hashed, top-N tenants pinned). Plan for tenant moves: bulk-export, dual-write window, cutover. Per-shard capacity caps prevent any one tenant from filling a shard. Observability per-tenant per-shard reveals hot tenants early. Combined with per-tenant rate limits and circuit breakers, partitioning is the main defense against multi-tenant overload.

**Key points:**
- Hash, lookup, or hybrid shard routing.
- Pin big tenants to dedicated shards.
- Plan tenant migration up front.
- Per-tenant observability is mandatory.

---

### 92. GDPR / data residency

**Frequency:** Low

**Question:** Explain the architectural impact of GDPR and data-residency requirements on a system. Cover the GDPR obligations (lawful basis, rights to access, rectify, erase / be forgotten, and portability) and residency rules in the EU, China, Russia, and India, then discuss how they shape design: (1) per-region storage or pseudonymization, (2) encryption at rest with per-tenant keys enabling crypto-shredding for erasure, (3) why tombstones don't satisfy erasure in event-sourced systems, and (4) PII classification at ingest, data lineage, catalogs, and DPIA workflows.

**Answer:** GDPR mandates lawful basis for processing, right to access, rectify, erase (right to be forgotten), and data portability; data residency rules in EU/China/Russia/India require data to stay in-region. Architectural impact: per-region storage (or pseudonymization), separate prod environments per residency zone, fine-grained data lineage, encryption at rest with per-tenant keys (enables crypto-shredding for erasure), event-sourced systems need shredding strategies (tombstones don't satisfy GDPR—delete or crypto-shred). PII classification at ingest, data catalogs, and DPIA workflows are non-negotiable for compliance.

**Key points:**
- Per-region storage for residency.
- Crypto-shredding for event-sourced erasure.
- Per-tenant keys enable selective deletion.
- PII classification and lineage are mandatory.

---

### 93. Zero-trust networking

**Frequency:** Low

**Question:** Explain the zero-trust networking model built on "never trust, always verify." Describe why there is no implicit trust based on network location, how every request including east-west traffic is authenticated, authorized, and encrypted, and the building blocks: (1) service identity (SPIFFE/SVID, workload identity), (2) mTLS between services, (3) identity-aware proxies for users (BeyondCorp), (4) short-lived credentials (Vault, IAM roles), and (5) per-request policy (OPA, mesh policy). Discuss how it replaces VPNs and the cost/benefit tradeoff.

**Answer:** "Never trust, always verify": no implicit trust based on network location (no flat internal network). Every request—even east-west—is authenticated, authorized, and encrypted. Implemented via service identity (SPIFFE/SVID, workload identity), mTLS between services, identity-aware proxies for users (BeyondCorp), short-lived credentials (Vault, IAM roles), and per-request policy (OPA, mesh policy). Replaces VPNs for many use cases. Cost: significant platform investment, complexity, latency from extra checks. Benefits: breach blast radius shrinks dramatically; insider threats and lateral movement become much harder.

**Key points:**
- No implicit network trust.
- mTLS + service identity + per-request policy.
- Replaces VPNs (BeyondCorp model).
- Heavy platform investment, large security win.

---

### 94. mTLS in mesh

**Frequency:** Low

**Question:** Explain how mutual TLS (mTLS) works in a service mesh and why it matters. Cover: (1) how mTLS authenticates both client and server with certificates so every service-to-service call proves identity cryptographically, (2) how meshes like Istio and Linkerd automate this by having sidecars rotate short-lived certs from an internal CA without app-level TLS code, (3) how it underpins zero-trust and authorization within the cluster, and (4) the costs (CA management, per-handshake latency mitigated by session resumption, and debugging denied requests).

**Answer:** Mutual TLS authenticates both client and server with certificates—every service-to-service call proves identity cryptographically. Service meshes (Istio, Linkerd) automate this: sidecars rotate short-lived certs from an internal CA (every 24h or less), apps don't need TLS code. Enables zero-trust within the cluster, encrypts all east-west traffic, and provides strong identity for authZ. Costs: CA management, slight latency per handshake (mitigated by session resumption), and debugging "why was this denied" requires good policy tooling. Treat as table stakes for mature platforms with many services.

**Key points:**
- Both sides authenticate with certs.
- Sidecars handle rotation transparently.
- Foundation for zero-trust + authZ.
- Internal CA is the critical piece.

---

### 95. WAF placement

**Frequency:** Low

**Question:** Explain the role and placement of a Web Application Firewall (WAF). Cover: (1) what it inspects HTTP traffic for (OWASP-style attacks such as SQLi, XSS, RCE, path traversal), (2) why it belongs at the edge (Cloudflare, AWS WAF, Akamai) to absorb bots and known exploits cheaply before traffic reaches your infra, (3) the tradeoffs (false positives blocking legitimate traffic, per-app tuning, managed rules lagging novel exploits), and (4) why it must be paired with rate limiting, bot management, and RASP and is not a substitute for secure coding and dependency hygiene.

**Answer:** Web Application Firewall inspects HTTP traffic for OWASP-style attacks (SQLi, XSS, RCE, path traversal). Place at the edge (Cloudflare, AWS WAF, Akamai) before traffic hits your infra to absorb bots and known exploit patterns cheaply. Tradeoffs: false positives can block legit traffic, must be tuned per app, and managed rules lag novel exploits. Pair with rate limiting, bot management, and runtime app protection (RASP) for defense in depth. WAF is necessary but not sufficient—secure coding and dependency hygiene remain the real defense.

**Key points:**
- Sits at the edge (CDN/WAF service).
- Blocks OWASP-style attacks.
- Tune to avoid false positives.
- Not a substitute for secure code.

---

### 96. Chaos engineering

**Frequency:** Low

**Question:** Explain chaos engineering: why you would deliberately inject failures (killing pods, partitioning the network, slowing disk, exhausting CPU) into production-like or production environments. Describe the maturity progression from small game days in staging, to controlled prod experiments with limited blast radius, to continuous chaos (Chaos Monkey style). Cover the prerequisites (solid observability, SLO budgets, automated rollback), the tooling (Chaos Mesh, Litmus, Gremlin, Pumba), and why culture (blameless, hypothesis-driven, learning from postmortems) matters more than tools.

**Answer:** Deliberately inject failures (kill pods, partition network, slow disk, exhaust CPU) in production-like or production environments to find weaknesses before they find you. Start small (game days in staging), expand to controlled prod experiments (canary blast radius), and graduate to continuous chaos (Chaos Monkey style). Pre-reqs: solid observability, SLO budgets, automated rollback. Tools: Chaos Mesh, Litmus, Gremlin, Pumba. Cultural shift matters more than tooling: blameless culture, hypothesis-driven experiments, and reading postmortems as learning, not punishment.

**Key points:**
- Inject failures to discover weaknesses.
- Start staging, graduate to prod gradually.
- Observability and rollback are prereqs.
- Culture matters more than tools.

---

### 97. Cost observability & unit economics

**Frequency:** Low

**Question:** Explain cost observability and unit economics for a cloud system. Cover: (1) why teams get surprised without measuring per-feature, per-tenant, and per-request cost, and how tagging everything (service, team, env) plus cost allocation reports and unit costs ($ per user, per request, per GB stored) address this, (2) FinOps practices like showback/chargeback, regular cost reviews, spend-anomaly alerts, and automated rightsizing, and (3) how architecture choices have a cost shape (serverless versus containers at steady state, multi-AZ data transfer, logs as a silent budget killer). Why treat cost as a first-class non-functional requirement?

**Answer:** Cloud bills surprise teams that don't measure per-feature, per-tenant, per-request cost. Tag everything (service, team, env), use cost allocation reports, and compute unit costs ($ per user, per request, per GB stored). FinOps practices: showback/chargeback by team, regular cost reviews, anomaly alerts on spend, and automated rightsizing recommendations. Architecture decisions have cost shape: serverless is great until traffic stabilizes (containers cheaper at steady state); multi-AZ data transfer adds up; logs are the silent budget killer. Make cost a first-class non-functional requirement.

**Key points:**
- Tag everything; per-team/feature visibility.
- Unit cost ($ per user/request) as KPI.
- Anomaly alerts on daily spend.
- Logs and egress are silent killers.

---

### 98. Edge computing (Workers, Lambda@Edge)

**Frequency:** Low

**Question:** Explain edge computing with platforms like Cloudflare Workers, Lambda@Edge, Fastly Compute, and Deno Deploy. Cover: (1) running code at CDN PoPs for ultra-low latency (10-50ms versus 100-300ms to origin) and the use cases (A/B routing, edge auth, personalization, geo-routing, image transformation, API caching with custom logic), (2) the constraints (tiny V8-isolate or Wasm runtimes, short CPU budgets, limited libraries, eventually-consistent KV storage), and (3) the architecture pattern where edge handles thin logic plus cache and origin handles heavy logic plus writes.

**Answer:** Run code at CDN PoPs (Cloudflare Workers, Lambda@Edge, Fastly Compute, Deno Deploy) for ultra-low latency (10-50ms vs 100-300ms origin). Use cases: A/B testing routing, auth at the edge, personalization, geo-routing, image transformation, API caching with custom logic. Constraints: tiny runtime (V8 isolates or Wasm), short CPU budgets (50-500ms), limited libraries, eventually consistent or no persistent storage (KV stores with high read replication, low write throughput). Architecture pattern: edge handles thin logic + cache; origin handles heavy logic + writes. Great for read-mostly workloads with global users.

**Key points:**
- Code at CDN PoPs; sub-50ms latency.
- V8 isolates/Wasm; short CPU budget.
- Storage is eventually consistent KV.
- Edge for thin logic; origin for heavy.

---

### 99. Log aggregation (Splunk/ELK-like)

**Frequency:** Low

**Question:** Design an ELK/Splunk-like log aggregation system. State the requirements (ingest TB/day of structured and unstructured logs from many services, fast search over recent data, long-term archive, alerting on patterns), then cover the components: (1) collectors (Fluent Bit, Vector, OTel sidecars) shipping logs, (2) a Kafka buffer to absorb spikes, (3) an indexer (Elasticsearch/OpenSearch, Loki, or ClickHouse) writing a searchable index, (4) object storage for raw and cold archive, and (5) a query UI (Kibana/Grafana). Contrast Loki (labels only, cheap, slower full-text) with Elasticsearch (indexes everything, richer but expensive), and cover scaling via time-sharded indices, hot/warm/cold tiers, and sampling and structuring at the source.

**Answer:** Requirements: ingest TB/day of structured + unstructured logs from many services, fast search across recent data, long-term archive, alerting on patterns. Components: Collectors (Fluent Bit, Vector, OTel sidecars) ship logs from pods to a buffer, Buffer (Kafka) absorbs spikes, Indexer (Elasticsearch/OpenSearch, Loki, ClickHouse) writes searchable index, Object store (S3) for raw + cold archive, Query UI (Kibana/Grafana). Loki indexes only labels (cheaper, slower full-text); ES indexes everything (richer queries, expensive at scale). Scaling: shard indices by time; hot/warm/cold tiers; sample noisy services or route to cheap archive only. Tradeoffs: log volume explodes; enforce structured logging, drop debug in prod, sample at the collector.

**Key points:**
- Kafka buffers spikes between collectors and indexer.
- ES = rich queries, expensive; Loki = labels only, cheap.
- Hot/warm/cold tiers cut cost.
- Sample and structure at the source.

---

### 100. Multiplayer game server (matchmaking, state sync)

**Frequency:** Low

**Question:** Design a multiplayer game server. State the requirements (real-time gameplay at a 60Hz tick, matchmaking by skill/region/latency, anti-cheat, persistent progression, millions concurrent), then cover the components: (1) a matchmaker with per-region/mode queues and skill-based MMR bucketing balancing fairness against queue time, (2) dedicated per-match session servers spun up on demand via an orchestrator like Agones running the authoritative simulation, (3) server-authoritative state sync with client prediction and reconciliation, UDP deltas, and lag compensation for hit detection, (4) persistent storage (profile/inventory in SQL, match history in OLAP), (5) voice/chat, and (6) anti-cheat. Cover scaling via regional clusters and match bin-packing, and tradeoffs like server-authoritative CPU cost and rollback netcode versus client prediction.

**Answer:** Requirements: real-time gameplay (60Hz tick), matchmaking by skill/region/latency, anti-cheat, persistent progression, millions concurrent. Components: Matchmaker (queue per region/mode + skill-based bucketing—MMR; balance fairness vs queue time), Session servers (dedicated per-match processes; spun up on demand via orchestrator like Agones; authoritative simulation), State sync (server-authoritative with client prediction + reconciliation; deltas over UDP; lag compensation for hit detection), Persistent storage (player profile, inventory in SQL; match history in OLAP), Voice/chat (separate service), Anti-cheat (server-side validation + client-side detection). Scaling: regional clusters for latency; bin-packing matches onto session servers; gracefully drain at match end. Tradeoffs: server-authoritative beats cheating but costs CPU; rollback netcode (fighting games) vs client prediction (FPS) differ per genre; lag compensation favors shooter but penalizes target.

**Key points:**
- Authoritative server + client prediction.
- UDP deltas at fixed tick rate.
- Matchmaker balances MMR vs queue time.
- Agones-style orchestration for dedicated session servers.
