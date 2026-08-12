# Architecture & System Design Questions

100 high-frequency questions on software architecture, distributed-systems patterns, scalability, reliability, data modeling, and classic system-design exercises.

---

### 1. Monolith vs microservices vs modular monolith

**Frequency:** High

**Question:** Compare the monolith, microservices, and modular monolith. What signals justify moving to microservices?

**Answer:** A **monolith** ships as one deployable: one codebase, one process, one database. It's the **simplest** thing to develop, deploy, test end-to-end, and reason about — a single stack trace spans the whole request. Its weakness is that it **couples team velocity and scaling**: every team deploys the same artifact (release trains, merge queues), and you scale the whole app even if only one endpoint is hot.

**Microservices** decompose the system by **bounded context** into independently deployable services. This buys **independent deploys** (teams ship on their own cadence), **polyglot** stacks, **fault isolation**, and **per-service scaling** (scale the image-processing service without scaling checkout). The cost is a large **operational tax**: network calls fail partially, you need **distributed tracing** (OpenTelemetry + correlation IDs) to follow a request, **data consistency** goes eventual (sagas, outbox), and every service multiplies your deploy pipelines, dashboards, and on-call surface. A naive split often produces a **distributed monolith** — services so chatty and co-deployed that you pay the distribution tax without the independence benefit.

**The modular monolith** is the pragmatic middle: **one deployable**, but internally partitioned into modules with **enforced boundaries** (separate packages/assemblies, explicit interfaces, no reaching into another module's tables). You get refactor safety and clear seams **without** the network, partial-failure, and eventual-consistency taxes — and the module boundaries become your future service boundaries if you ever extract.

**Default to the modular monolith.** **Conway's law** dominates — your architecture will mirror your org chart — so a small team should not run 20 services. Extraction cost is high, so **prove the seam** first. Concrete signals that justify extracting a service: **team count** outgrows what one codebase can coordinate (multiple teams blocked on one deploy), a service has a **wildly different scaling profile** (GPU inference vs CRUD), **deploy cadence** conflicts (one part needs hourly ships, another is regulated and slow), or **compliance** demands hard isolation (PCI, PII). Extract along those seams, not speculatively.

**Key points:**
- Conway's law dominates: architecture mirrors org structure.
- Microservices add latency, partial failure, eventual consistency.
- Modular monolith captures most modularity benefits with one deploy.
- Extraction cost is high; prove the seam before splitting.

---

### 2. Event-driven architecture

**Frequency:** High

**Question:** What is event-driven architecture, and when should you choose it over synchronous request/response?

**Answer:** In **event-driven architecture (EDA)**, services communicate by **publishing immutable events** ("OrderPlaced", "PaymentCaptured") to a broker (Kafka, SNS/SQS, RabbitMQ) rather than calling each other synchronously. The producer **doesn't know who consumes** the event — it just states that a fact happened. This inversion is the whole point: it gives **loose coupling** (add a new consumer without touching the producer), **temporal decoupling** (consumers process at their own pace, absorb spikes via the queue), and easy **fan-out** — the same "OrderPlaced" fact drives inventory, email, analytics, and fraud checks independently.

The distinction between **events and commands** matters: an **event** is a fact about the past ("UserSignedUp"), broadcast to whoever cares; a **command** is an intent directed at one handler ("SendWelcomeEmail"). Mixing them (publishing "events" that are really disguised RPC commands to one known consumer) recreates tight coupling.

The tradeoffs are real. End-to-end flows become **hard to reason about** — there's no single call stack, so you need **correlation IDs** and distributed tracing to reconstruct "what happened to order 123". You inherit **eventual consistency**: the read model lags the write. Consumers must be **idempotent** (brokers deliver at-least-once, so the same event can arrive twice — dedupe on an event ID). You need operational tooling: **dead-letter queues** for poison messages, **replay** for reprocessing, and **schema evolution** discipline (Avro/Protobuf + a schema registry with compatibility rules so a producer change doesn't break consumers).

**Choose EDA** when workflows are inherently async, when many downstream systems must react to the same fact, or when you want to decouple write paths from read models (it's the backbone of **CQRS** and event sourcing). **Avoid it** for simple request/response where the caller needs an **immediate, strongly-consistent answer** ("did this transfer succeed? show me the balance now") — there, synchronous RPC is simpler and correct.

**Key points:**
- Events are facts; commands are intents.
- Requires schema registry, DLQ, idempotency keys.
- Enables CQRS, event sourcing, audit by default.
- Tracing across hops needs correlation IDs and OpenTelemetry.

---

### 3. CQRS

**Frequency:** High

**Question:** What is CQRS, and when is it worth the extra complexity?

**Answer:** **Command Query Responsibility Segregation** splits the **write model** from the **read model**. Commands (CreateOrder, CancelOrder) mutate state and are validated against **business invariants**; they hit a normalized, transactionally-consistent store. Queries never touch that model — instead, **events or change data capture (CDC)** project one or more **denormalized read models**, each shaped for a specific view: a search index for full-text, a Redis cache for a hot dashboard, a materialized SQL view for reporting.

The core benefit is **independent optimization and scaling** of the two sides. Reads usually outnumber writes 100:1, so you scale read replicas (or edge caches) without touching the write path. Read code becomes trivial — no joins, no aggregation at query time, just "select the pre-computed shape". And you can **add or evolve read models freely**: need a new view? Build a new projection from the same event stream without migrating the write store.

The costs are **eventual consistency** between the two sides (the read model lags the write by the projection latency), **more moving parts** (projectors, message plumbing, multiple stores to operate), and **projection rebuild logic** — you must be able to replay events to reconstruct a read model after a bug or schema change. A classic UX pitfall is **read-your-writes**: a user submits a form, is redirected to a list, and doesn't see their own change yet. Mitigate by reading from the write model for that one request, or by optimistically rendering the change client-side.

**Apply CQRS** when read/write asymmetry is large, when you have many **distinct query shapes** over the same data, or when you're already doing event sourcing (they pair naturally, though CQRS doesn't require it). **Don't apply it** to simple CRUD with one query shape — there it's pure overhead: two models, two stores, and a consistency gap you didn't need.

**Key points:**
- Two models, often two databases.
- Reads are eventually consistent vs writes.
- Pairs naturally with event sourcing but doesn't require it.
- Watch out for read-your-writes UX issues.

---

### 4. Event sourcing

**Frequency:** High

**Question:** What is event sourcing, and where does it fit versus where should you avoid it?

**Answer:** Instead of storing current state and overwriting it, **event sourcing persists an append-only log of domain events** — "AccountOpened", "MoneyDeposited(100)", "MoneyWithdrawn(30)" — and derives current state by **folding** (replaying) those events. The event log is the source of truth; the current balance (70) is a computed projection.

This gives you three things you can't easily get otherwise. A **perfect audit trail** — you don't reconstruct history, you *are* the history, which is gold for finance, ledgers, and regulated domains. **Time travel** — reconstruct the exact state at any past instant for debugging or "as-of" reporting. And the ability to **add new projections retroactively** — a new business question ("how many accounts went negative last year?") is answered by replaying the existing log into a new read model, no data loss.

Aggregates are **rehydrated by replaying their stream**; for long-lived aggregates you periodically write a **snapshot** so you replay only events since the last snapshot rather than thousands from the beginning.

The challenges are serious. You **version event schemas forever** — a five-year-old event must still deserialize, so you need upcasters and additive changes. **GDPR/right-to-erasure** clashes with an immutable log: you can't delete an event, so you **crypto-shred** (store PII encrypted, throw away the key) or use tombstones. Queries are awkward — you almost always add **CQRS read models** on top, because "list all active accounts" over a raw event log is impractical. And the **learning curve** is steep; teams routinely over-apply it.

**Best fit:** domains where history is a first-class business concern — finance, accounting, order/inventory ledgers, anything audited — or where many consumers need the same authoritative facts. **Avoid** it for simple CRUD, for teams lacking the operational maturity to run projections and replays, or where the domain has no real need to remember *how* it reached the current state. Because raw event stores are poor at queries, event sourcing is **almost always paired with CQRS**.

**Key points:**
- Events are immutable and append-only.
- Snapshots speed up aggregate rebuilds.
- GDPR needs crypto-shredding or tombstones.
- Almost always combined with CQRS.

---

### 5. DDD: bounded contexts, aggregates, ubiquitous language

**Frequency:** High

**Question:** Explain DDD's core building blocks — ubiquitous language, bounded contexts, and aggregates. What separates DDD done well from DDD as ceremony?

**Answer:** **Domain-Driven Design** tackles complexity by modeling software around the **business**, not around technical layers. Four building blocks carry most of the value.

**Ubiquitous language:** the code, tests, and conversations all use the **same business vocabulary**. If domain experts say "policy" and "premium", the classes are `Policy` and `Premium` — not `InsuranceRecord` and `Amount2`. This removes the translation layer where bugs and misunderstandings breed; a stakeholder should be able to read a method name and recognize the business rule.

**Bounded context:** an explicit **boundary within which a model is consistent** and the ubiquitous language has one meaning. The word "Customer" means something different to Sales (a lead with a pipeline stage) than to Billing (an account with a payment method) than to Support (a ticket history). Rather than forcing one bloated "Customer" god-model, you keep **separate models per context**, connected at the edges. **Context maps** document those relationships — shared kernel, customer/supplier, and especially the **anti-corruption layer (ACL)** that translates another context's (or a legacy system's) model into yours so its concepts don't leak in and rot your model.

**Aggregates:** a **transactional consistency boundary** — a root entity plus the child objects whose invariants must hold together, mutated only through the root, in a single transaction. Example: an `Order` aggregate enforces "total must equal sum of line items" atomically. Anything *across* aggregates is made consistent **eventually**, via **domain events** ("OrderPlaced" → inventory reserves stock in its own transaction). Keeping aggregates small is a key design skill; a huge aggregate serializes writes and kills throughput.

Bounded contexts frequently **map to service boundaries**, which is why DDD and microservices are often discussed together. **Done well**, DDD aligns code with the business conversation and makes the model a shared asset. **Done as ceremony**, it degenerates into anemic models (data bags with no behavior) surrounded by pointless `Repository`/`Factory`/`Service` classes — the vocabulary without the modeling, which just adds indirection.

**Key points:**
- Ubiquitous language: code matches business vocabulary.
- Aggregates = transactional/consistency boundary.
- Bounded context often = service boundary.
- Context map captures inter-context relationships.

---

### 6. Saga (orchestration vs choreography)

**Frequency:** High

**Question:** Explain the saga pattern and contrast orchestration versus choreography. Which fits complex branching flows?

**Answer:** A **saga** replaces a distributed ACID transaction (two-phase commit, which doesn't scale and blocks) with a **sequence of local transactions**, one per service, plus a **compensating action** for each step to undo it if a later step fails. Booking a trip: reserve flight → charge card → reserve hotel. If the hotel reservation fails, you run compensations in reverse — refund the card, release the flight seat. There's no global rollback; you get **eventual consistency** by explicitly designing the "undo" for every "do".

**Orchestration** uses a **central coordinator** (Temporal, Camunda, AWS Step Functions, or your own state machine) that explicitly invokes each step and, on failure, invokes the compensations. The workflow lives in **one place**, so it's **visible and debuggable** — you can see exactly where a stuck saga is and why. The downside: the orchestrator is a coupling point and another component to run, and services must expose commands it can call.

**Choreography** has **no central brain** — each service **listens for events and emits new ones**. "FlightReserved" triggers the payment service, whose "PaymentCaptured" triggers the hotel service. This stays **loosely coupled**, but the end-to-end flow is **implicit** — it exists only as an emergent chain across services, which becomes very hard to trace, debug, or modify once you have branching, retries, and timeouts.

**Rule of thumb:** **choreography for simple, linear fan-outs** (few steps, no branching), **orchestration for complex flows** with conditional branches, parallel steps, timeouts, and human approvals — the central view is worth the coupling. In **both** styles, every step needs an **idempotent compensating action**, because at-least-once delivery and retries mean a compensation can fire twice and must not double-refund.

**Key points:**
- Replace 2PC with compensations.
- Orchestration: central brain, easier to debug.
- Choreography: events only, looser but opaque.
- Every step needs an idempotent reverse.

---

### 7. Serverless vs containers vs VMs

**Frequency:** High

**Question:** Compare serverless, containers, and VMs. Which workloads fit each, and where's the cost crossover?

**Answer:** These three deployment models trade **isolation, startup latency, ops overhead, packing density, and cost** differently.

**VMs** virtualize hardware, giving each workload a **full guest OS**. That's the **strongest isolation** (separate kernels) and the most **predictable performance**, but the **longest cold starts** (boot an OS, tens of seconds) and the **highest ops overhead** (patch and manage every OS). Fit: legacy apps, GPU/specialized hardware, and **regulated workloads** needing hard isolation.

**Containers** package the app plus its dependencies but **share the host kernel**. Startup is **fast** (seconds), packing is **dense** (many containers per node), and you get full control over the runtime. This is the **default for always-on, stateful, or steady-state services** where you care about **unit cost** and want portability (Kubernetes, ECS). Isolation is weaker than VMs (shared kernel = larger attack surface), mitigated by namespaces, cgroups, seccomp, and gVisor/Firecracker for stronger boundaries.

**Serverless/FaaS** (Lambda, Cloud Functions) — and container-serverless (Cloud Run, Fargate) — **abstract servers entirely**. You deploy code; the platform scales it, including **scale-to-zero**, and you **pay per invocation/GB-second**. The cost: **cold starts** (a new instance must spin up on a request spike), **runtime limits** (execution time, memory, package size), and **vendor lock-in** via proprietary triggers. Fit: **spiky, event-driven, or low-traffic** workloads where idle time dominates and ops savings win — cron jobs, webhooks, glue between services, unpredictable bursts.

**Cost crossover:** serverless is cheapest when **utilization is low** because you pay nothing at idle; containers win once a service is **busy enough to keep nodes warm**. The rough break-even is around **~30–50% sustained utilization** — below that, serverless' pay-per-use plus zero-ops usually wins; above it, always-on containers have a lower unit cost and you're paying for a reserved box anyway.

**Key points:**
- Serverless: pay per use, cold starts, scale-to-zero.
- Containers: best density and control.
- VMs: strongest isolation, highest overhead.
- Cost crossover happens at ~30-50% utilization.

---

### 8. Horizontal vs vertical scaling

**Frequency:** High

**Question:** Compare horizontal and vertical scaling. Why are databases the hardest tier to scale out?

**Answer:** **Vertical scaling (scale-up)** means giving a **single node** more resources — more CPU, RAM, faster disk. It's **dead simple**: no application changes, no distributed-systems problems, just a bigger box. But it has a hard **ceiling** (the largest instance money can buy), the cost curve is **super-linear** at the top end, and that one node is a **single failure domain** — when it dies, everything dies.

**Horizontal scaling (scale-out)** means adding **more nodes behind a load balancer**. It's **theoretically unlimited** and **fault tolerant** (lose one node, the rest carry on). The catch is that it demands **statelessness** — any node must serve any request — or you must **externalize shared state** (to a DB, cache, or object store) and pay **coordination overhead** (service discovery, leader election, cache coherence). Most modern app tiers are designed **stateless from day one** precisely so that scaling out is trivial: just add replicas.

**Databases are the hard part** because they *are* the shared state, and they must preserve **consistency** across nodes. You can't just add read/write nodes and hope — you have to decide how to **partition (shard)** the data, how to **route** a query to the right shard, how to handle **cross-shard joins and transactions** (which become expensive or impossible), and how to keep replicas **consistent** under concurrent writes (consensus, quorums). This is why databases historically scaled **vertically** and why horizontal DB scaling required purpose-built systems — **Cassandra** (consistent hashing + tunable quorums), **Spanner** (TrueTime + Paxos), **CockroachDB** (Raft ranges) — that bake sharding and replication into the engine.

**In practice it's a hybrid:** scale the stateless app tier **out** freely, scale the database **up** until you hit cost or instance limits, then **shard** it — because sharding introduces real complexity you want to defer as long as possible.

**Key points:**
- Vertical: simple, ceiling-bound, single failure domain.
- Horizontal: needs stateless or external state.
- DBs hardest to scale horizontally—sharding required.
- Combine: bigger nodes plus more nodes.

---

### 9. Stateless vs stateful

**Frequency:** High

**Question:** Why do stateless services scale so easily, and what does it take to run stateful ones well?

**Answer:** A **stateless service holds no client-specific state locally** — no in-memory session, no local files that matter across requests. Any instance can serve any request because everything durable lives **elsewhere**: session in Redis, data in the DB, uploads in object storage. This is what makes the three hardest operational problems **trivial**. **Horizontal scaling**: just add replicas behind the load balancer, no rebalancing. **Rolling deploys**: kill and replace any instance freely — no one is pinned to it. **Failure recovery**: an instance dies, the LB routes around it and nothing is lost. This is why the standard pattern is a **stateless app tier** with all state **pushed to managed stores**.

A **stateful service keeps state in memory or on local disk** that *is* the value it provides — Kafka brokers own partition logs, Elasticsearch nodes own shards, game servers own match state, and WebSocket/gRPC-stream servers own live connections. Here every "easy" thing becomes hard:

- **Routing** must be **sticky** — a client with an open WebSocket must keep reaching the same node, so you need consistent-hash or session-affinity routing, not round-robin.
- **Scaling events trigger rebalancing** — adding or removing a node means **moving data/partitions** (Kafka reassigns partitions, Elasticsearch relocates shards), which consumes bandwidth and can degrade performance during the move.
- **Recovery is slower** — a dead node's state must be **reconstructed** from replicas or replayed logs before it's back in service, so you need replication and a rebuild path.

**The recommended shape** is to keep your application tier stateless and delegate state to **purpose-built managed stateful systems** (RDS, Kafka, Elasticsearch) whose teams have already solved replication and rebalancing. **When you must own state yourself**, the tools are **consistent hashing** (minimize how much moves when membership changes), **persistent volumes** (survive pod restarts without a full rebuild), and **pre-stop drain hooks** (finish in-flight work and hand off connections gracefully before shutdown).

**Key points:**
- Stateless = trivial horizontal scaling.
- Stateful needs sticky routing and rebalancing.
- Push state to managed stores when possible.
- Sticky sessions are an anti-pattern for HTTP.

---

### 10. Load balancing (RR, least-conn, hash, weighted)

**Frequency:** High

**Question:** Walk through the common load-balancing algorithms and how to pick one by traffic shape.

**Answer:** A load balancer distributes requests across backends; the algorithm choice matters most under **non-uniform** load.

**Round-robin (RR)** hands requests to backends in rotation. It's **cheap and stateless** and works well when requests are **short and uniform** (every request costs about the same). Its blind spot: it ignores how busy each backend actually is, so one slow request stuck on a node still gets fed new work.

**Least-connections** routes to the backend with the **fewest active connections**, which approximates "least busy". This handles **long-lived or variable-duration** requests far better — streaming, uploads, or endpoints whose cost varies 100×. It needs the LB to track connection counts, but it naturally drains work away from a struggling node.

**Consistent hashing** routes by a **key** (user ID, tenant, cache key) so the **same key always lands on the same backend**. This is essential for **cache affinity** (maximize hit rate — the same user's data is cached on one node) and **stateful affinity** (a session or shard lives on a specific node). Its key property is that adding/removing a backend **reshuffles only ~1/N of keys** instead of all of them, so topology changes don't blow away every cache.

**Weighted** variants (weighted RR / weighted least-conn) send proportionally more traffic to bigger instances, or **shift a controlled percentage** to a new version — the mechanism behind **canary** and blue-green traffic ramps.

One subtlety: **power-of-two-choices** — pick two backends at random and send to the less-loaded of the two — often **beats plain RR for tail latency** at scale, because it avoids the "herd" problem where a global "least loaded" view goes stale and everyone piles onto the same node. **Picking by traffic shape:** uniform + short → RR; variable duration → least-connections; cache/stateful affinity → consistent hashing; heterogeneous fleet or canary → weighted.

**Key points:**
- RR: simple, assumes uniform requests.
- Least-conn: handles variable durations.
- Consistent hash: cache and stateful affinity.
- Power-of-two-choices reduces tail latency.

---

### 11. CAP & PACELC in practice

**Frequency:** High

**Question:** Explain CAP and its PACELC extension. Why is the choice really per-operation, not per-system?

**Answer:** **CAP** states that during a **network partition** (P) — when nodes can't talk to each other — a distributed system must choose between **Consistency** (C: every read sees the latest write) and **Availability** (A: every request gets a non-error response). You cannot have both *while partitioned*, because a node that can't reach its peers must either **refuse to serve** (stay consistent, sacrifice availability = **CP**) or **serve possibly-stale data** (stay available, sacrifice consistency = **AP**). The common misreading is treating C/A/P as "pick two always" — CAP only forces the tradeoff **during a partition**, which is rare.

**PACELC** completes the picture: **if Partitioned, choose A or C; Else (normal operation), choose Latency or Consistency**. This is the more useful lens day-to-day, because partitions are rare but **every** request pays the latency-vs-consistency tax. A strongly consistent write must reach a **quorum** across replicas (maybe cross-region) before acknowledging — that's real latency you pay on the happy path. Relax consistency and you can ack from the nearest replica and go faster.

The key insight is that the choice is **per operation**, not per system. In one product, a **bank transfer / balance check** wants **CP** — better to reject during a partition than double-spend — while the **social feed** on the same platform wants **AP** — a slightly stale timeline is fine, downtime isn't. Real systems mix both.

Classifying examples: **Spanner** is effectively **CP / PC-EL** — it chooses consistency, using TrueTime and Paxos to stay linearizable, accepting higher latency and refusing writes it can't quorum. **DynamoDB/Cassandra** are **AP / PA-EL** — always available and low-latency, converging eventually (with tunable quorums to dial toward consistency when needed). **Use CAP/PACELC as a framing tool** to reason about each workload's tolerance — not a checkbox that labels your whole database "CP" or "AP".

**Key points:**
- CAP only applies during partition.
- PACELC adds normal-case latency vs consistency.
- Choice is per-operation, not per-system.
- Spanner ~ CP; Dynamo ~ AP.

---

### 12. Eventual consistency patterns

**Frequency:** High

**Question:** What patterns make eventual consistency tolerable for users and correct for data?

**Answer:** Eventual consistency means replicas **converge if writes stop**, but in the meantime reads can be stale or out of order. The engineering task is to **mask the lag** for users while keeping the data **correct**. A toolbox of consistency guarantees, each layered on plain eventual consistency:

**Read-your-writes:** a user must always see their *own* changes. Achieve it by **routing that user's reads to the primary** (or the replica that's caught up) for a short window after their write, or by attaching a **write token/version** the read path waits for. Without this, a user edits their profile, refreshes, and sees the old value — a classic "is it broken?" bug.

**Monotonic reads:** a user must never see time go **backwards** (read a new value, then an older one because a request hit a laggy replica). Pin the user to a **single replica** via session affinity so their reads only move forward.

**Causal consistency:** if event A caused event B, everyone sees A before B. Track **happens-before** with vector clocks or session tokens. Essential for **chat and comments** — you must never see a reply before the message it replies to, even if total ordering across the whole system is relaxed.

**Bounded staleness:** give a **measurable SLA** — "reads are at most N seconds or M operations behind" (Cosmos DB offers this as a tier). This turns "eventually" into a number you can reason about and alert on.

For **UX**, **optimistic UI** hides lag entirely: apply the change **locally and immediately**, then reconcile when the server confirms (and roll back on the rare failure) — the like button turns blue instantly. For **data correctness**, make writes **idempotent** (safe to retry under at-least-once delivery) and use **CRDTs** (conflict-free replicated data types) for data that's edited concurrently in many places, so merges are **automatic and conflict-free** instead of last-write-wins clobbering.

Finally, **document the consistency contract per endpoint** — "this read is eventually consistent, up to ~2s stale" — so consumers don't silently assume strong semantics and build racy logic on top.

**Key points:**
- Read-your-writes via primary routing or tokens.
- Bounded staleness gives a measurable SLA.
- Optimistic UI hides lag from users.
- Document consistency contract per API.

---

### 13. Strong vs eventual vs causal consistency

**Frequency:** High

**Question:** Compare strong, eventual, and causal consistency, and give an example of choosing per operation.

**Answer:** These sit on a spectrum from "always correct, always expensive" to "cheap, sometimes stale".

**Strong (linearizable) consistency:** every read returns the **latest committed write**, and the system behaves as if there were a single copy of the data with operations in one global order. This is the most intuitive model, but it's **expensive**: it requires **consensus** (Raft/Paxos) or synchronous replication, which adds latency and **limits availability** — during a partition a strongly consistent system must refuse writes it can't quorum. Use it where correctness is non-negotiable: **account balances, inventory counts, unique-username claims**.

**Eventual consistency:** replicas are allowed to diverge and only **converge once writes stop**. It's the **cheapest and most available** — writes ack from the nearest replica, the system stays up under partitions — but reads may be **stale or reordered**. Perfect where a little staleness is invisible or harmless: **social timelines, view counts, product catalogs, DNS**.

**Causal consistency:** the sweet spot in the middle. It **preserves happens-before**: if A caused B (a message and its reply), **every observer sees A before B** — but it does *not* impose a total order on unrelated events. This is exactly what **collaborative apps and chat** need: cheaper and more available than strong consistency, yet it never shows you a reply before its message or a comment before the post. **Sequential consistency** sits just above causal — a single global order that respects each client's program order, but not necessarily real-time order.

The practical lesson: **choose per operation, not per system**. In one messaging app the **account/billing** read is **strong**, the **"who's online" list** is **eventual**, and **messages within a thread** are **causal**. Matching each operation's consistency to its actual business tolerance is what lets you buy availability and latency where you can afford to, and spend on consistency only where you must.

**Key points:**
- Strong: linearizable, expensive.
- Eventual: cheap, may be stale or reordered.
- Causal: preserves cause-effect ordering.
- Choose per operation, not per system.

---

### 14. Distributed transactions: 2PC vs sagas

**Frequency:** High

**Question:** Compare 2PC and sagas for distributed transactions. When would you use each?

**Answer:** Both solve "make several services agree on an all-or-nothing outcome", but very differently.

**Two-phase commit (2PC)** uses a **coordinator** and two rounds. **Phase 1 (prepare):** the coordinator asks every participant "can you commit?"; each does the work, locks resources, and votes yes/no. **Phase 2 (commit/abort):** if all voted yes, the coordinator tells everyone to commit; otherwise everyone aborts. This gives **true atomicity**, but the flaws are fatal at scale: participants **hold locks** between the two phases, so throughput craters; if the **coordinator crashes** after prepare, participants are **blocked** holding locks indefinitely (the classic blocking problem); and it **couples services tightly** and doesn't tolerate the partial failures normal in a microservice mesh. So 2PC is used **inside a single database cluster or across XA-aware resources** (a DB + a message broker), **not** across independent microservices.

**Sagas** drop global atomicity in favor of **eventual atomicity**. The transaction is a **sequence of local transactions**, each committing independently, and each paired with a **compensating action** that semantically undoes it. If step 3 fails, you run the compensations for steps 2 and 1 in reverse. No locks are held across services, so it **scales** and tolerates partial failure. The hard part is that compensations must be **idempotent** (retries can fire them twice) and **semantically meaningful** — you can't literally "un-charge" a card, so the compensation is a **real refund**, and "un-send" an email is impossible so you send a correction. There's also a **visibility window**: between a step and its compensation, other readers may see intermediate state, so you sometimes need semantic locks or "pending" states.

**Choose 2PC** only within one DB cluster or XA infrastructure where strong atomicity is required and the participants are tightly controlled. **Choose sagas across service boundaries** — and prefer **orchestrated** sagas (a central coordinator drives the steps) over **choreographed** ones (services react to each other's events) because the orchestrated flow is **visible and far easier to debug** when a saga gets stuck mid-way.

**Key points:**
- 2PC: blocking, doesn't scale across services.
- Sagas: local txns plus compensations.
- Compensations must be idempotent and meaningful.
- Orchestrated sagas easier to debug than choreographed.

---

### 15. Read replicas & replication lag

**Frequency:** High

**Question:** How do read replicas work, and how do you manage replication lag? Why don't they scale writes?

**Answer:** A **read replica** is a copy of the primary database that receives a stream of the primary's changes and serves **read-only** queries. By pointing analytics, dashboards, and non-critical reads at N replicas, you **offload the primary** so it can focus on writes — the standard first move for read-heavy workloads.

The catch is **replication lag** — replicas are always a little behind. The lag depends on the replication mode:

- **Asynchronous replication:** the primary commits and acks the client **immediately**, then ships changes to replicas in the background. It's **fast** (writes don't wait for replicas) but reads can be **stale**, and lag **spikes** during heavy write bursts, network hiccups, or when a replica restarts and must catch up. If the primary dies before shipping recent commits, those writes are **lost**.
- **Semi-synchronous replication:** the primary waits for **at least one replica to acknowledge** receipt before it commits. This bounds data loss on failover (a promoted replica has the latest committed data) at the cost of **slightly slower writes**. A common production setup: one semi-sync replica for safe failover plus several async replicas for read scale.

**Operationally you must measure lag** in **both seconds behind primary** (how stale, for UX) and **bytes/LSN behind** (how much backlog, for capacity) and **alert** past a threshold (e.g., >5s), because a lagging replica silently serves increasingly wrong data. For **read-your-writes** correctness, route **critical post-write reads to the primary** (or to a replica confirmed caught-up via a write token) — e.g., right after a user updates their profile, read their profile from the primary.

The crucial limitation: **read replicas do nothing for write throughput.** Every write still executes on the primary *and* is replayed on every replica, so adding replicas adds read capacity but leaves the write ceiling unchanged (and each extra replica adds replication load). Once the **primary's write rate** is the bottleneck, replicas can't help — you must **shard** (partition the data across multiple primaries) to scale writes horizontally.

**Key points:**
- Async = fast but stale; semi-sync = safer.
- Monitor lag in seconds and bytes.
- Route post-write reads to primary.
- Replicas don't help write scaling—shard then.

---

### 16. Sharding strategies & rebalancing

**Frequency:** High

**Question:** Compare the main sharding strategies. Why is rebalancing the hard part?

**Answer:** Sharding partitions data across multiple database nodes so writes (and storage) scale horizontally. The strategy determines how a key maps to a shard — and each has a distinct tradeoff.

**Hash sharding:** `shard = hash(key) mod N`. It spreads keys **evenly** and avoids hot spots, but you **lose range queries** (adjacent keys land on different shards) and — critically — the naive `mod N` **reshuffles almost everything** when N changes (add a node, nearly every key moves). The fix is **consistent hashing** (or **virtual nodes**), where changing membership only moves ~1/N of keys.

**Range sharding:** each shard owns a **contiguous key range** (e.g., users A–F, G–M...). This makes **range scans and ordered queries efficient**, but it's **prone to hot spots** — sequential keys like timestamps or auto-increment IDs all pile onto the newest shard (the "hot last shard" problem). Mitigate by choosing a well-distributed shard key or salting.

**Directory/lookup sharding:** an explicit **shard map** ("customer 42 → shard 7") gives maximum flexibility — you can place any key anywhere and move keys individually. The cost: the map is an extra hop and a potential **bottleneck and single point of failure**, so it must be cached and highly available.

**Geo sharding:** partition **by region** so data lives near its users (EU users on EU shards). Great for **latency and data-residency/compliance**, but cross-region queries are expensive and load can skew by geography.

**Rebalancing is the genuinely hard part.** When you add capacity or a shard gets hot, you must **move live data without downtime**, which means **dual-writing** to old and new shards, **backfilling** historical rows, verifying, then **cutting over** reads — all while the system serves traffic. Getting this wrong drops or duplicates data. This is why teams either use systems that **rebalance natively** (Cassandra, Vitess, CockroachDB move ranges/tokens automatically) or **plan for resharding before launch** — most importantly, pick a **high virtual-shard count up front** (e.g., 1024 logical shards mapped onto a few physical nodes) so future growth just remaps virtual shards to new nodes instead of re-hashing every key.

**Key points:**
- Hash: even but no range queries.
- Range: range scans, hot-spot risk.
- Consistent hashing minimizes reshuffles.
- Use many virtual shards to ease rebalancing.

---

### 17. Caching layers & invalidation

**Frequency:** High

**Question:** Walk through caching layers and write strategies. Why is invalidation the hard problem?

**Answer:** Caching exists at **many layers**, and a request may hit several: the **browser cache** (local, per-user), the **CDN** (static assets, edge-cached globally), an **edge/reverse-proxy cache**, the **API gateway cache** (whole responses), the **in-process application cache** (a local map or Caffeine — fastest, but per-instance and not shared), a **shared cache** like Redis/Memcached (shared across instances, one network hop), and finally the **database buffer pool**. The rule is **measure each layer** — a low CDN hit ratio and a low Redis hit ratio need very different fixes.

**Write/read strategies** decide how the cache and the database stay in step:

- **Cache-aside (lazy):** the app checks the cache, and on a miss reads the DB and populates the cache itself. Simple, resilient (a cache outage just means slower reads), and the **usual default** — but the first request after a miss is slow, and stale entries linger until invalidated.
- **Read-through:** the cache library fetches from the DB on a miss transparently; cleaner app code but couples you to the cache provider.
- **Write-through:** every write goes to cache **and** DB synchronously — the cache is always fresh, at the cost of write latency and caching data that may never be read.
- **Write-behind (write-back):** write to cache, flush to DB asynchronously — fastest writes, but you **risk data loss** if the cache dies before flushing.

**Invalidation** is famously the hard problem ("there are only two hard things..."). The options trade staleness against coupling: **TTL** is simplest but accepts bounded staleness; **explicit invalidation on write** is consistent but couples the writer to every cache; **event-driven** invalidation (via **CDC**/change streams) fires invalidations automatically when the DB changes, decoupling writers from caches. Getting it wrong means users see stale data or, worse, inconsistent data across layers.

Finally, guard against **cache stampedes** — when a hot key expires and thousands of requests hit the DB at once. Mitigate with **request coalescing** (only one request recomputes, others wait), **jittered TTLs** (so keys don't all expire together), and **stale-while-revalidate** (serve the stale value while one worker refreshes in the background). The metrics that matter are **hit ratio** (per layer) and **tail latency** (p99), not averages.

**Key points:**
- Many layers—measure each one.
- Cache-aside is the default.
- TTL + jitter prevents stampedes.
- Invalidation is the hard problem.

---

### 18. Circuit breaker

**Frequency:** High

**Question:** Explain the circuit breaker pattern, its three states, and how it prevents cascading failure.

**Answer:** A **circuit breaker** wraps calls to a remote dependency and **tracks the failure rate**, so that when the dependency is clearly broken it **stops calling it** instead of piling on. It borrows the electrical metaphor and has **three states**:

- **Closed** (normal): calls pass through; the breaker counts failures. If the failure rate crosses a threshold, it **trips open**.
- **Open** (tripped): calls **fail fast immediately** without touching the dependency. This is the key move — it stops hammering a service that's already down, giving it room to recover, and it frees the caller's resources. After a **cool-down**, it moves to half-open.
- **Half-open** (probing): a **limited number of trial requests** are allowed through. If they succeed, the dependency has recovered and the breaker **closes**; if they fail, it **re-opens** and waits again.

The reason this matters is **cascading failure**. Without a breaker, when a downstream service slows or dies, callers pile up in **retry loops and blocked threads**, exhausting their own thread pools/connections — so the caller falls over too, and its callers after that, until the whole system is down from one bad dependency. The breaker **contains the blast radius** and **releases resources** that would otherwise be stuck waiting.

The tuning knobs: the **error threshold** (e.g., trip when >50% of the last 100 requests fail — rate-based, not a raw count, so low traffic doesn't false-trip), the **open duration** (how long to wait before probing, e.g., 10s), and the **half-open probe count**. Just as important is the **fallback** when the circuit is open: serve a **stale cache** value, a **default/empty response**, or **queue the work for later** — degrade gracefully rather than error out.

A breaker **complements but does not replace timeouts** — always set aggressive timeouts first (an infinite wait is what fills the thread pool), and the breaker sits on top to stop retrying a known-bad dependency. In practice you get it from a **library** (Resilience4j, Polly, Hystrix's successors) or from a **service mesh** (Istio/Envoy) rather than hand-rolling it. Tracking breaker state transitions is also a valuable early **health signal**.

**Key points:**
- States: closed, open, half-open.
- Prevents cascade and saves resources.
- Pair with timeouts and fallbacks.
- Library or mesh-provided.

---

### 19. Timeouts, retries, exponential backoff, jitter

**Frequency:** High

**Question:** Explain the discipline of timeouts, retries, exponential backoff, and jitter for remote calls.

**Answer:** These four together turn fragile remote calls into resilient ones — but only if applied with discipline.

**Timeouts:** every remote call **must** have one, because an **infinite wait cascades into an outage** — a hung downstream call ties up a thread/connection, and enough of them exhaust the pool and take the caller down. Crucially, set each timeout **shorter than the caller's timeout** — this is **budget propagation**: if the user-facing request has a 3s budget, a downstream call it makes should time out well under 3s, or the caller times out first and the work is wasted. Deadlines should flow down the call chain.

**Retries — only for idempotent operations.** Retrying a `GET` or an idempotent `PUT` is safe; blindly retrying a `POST` that charges a card can **double-charge**. So retry only operations that are idempotent (or made idempotent with an idempotency key), and **cap the attempts** — 3 is usually enough; unbounded retries just amplify load. Also retry only the **right failures**: **5xx and network/timeout errors** are worth retrying (transient); **4xx client errors** are not — the request is malformed or unauthorized, and retrying it will fail identically forever.

**Exponential backoff:** wait longer between each attempt (e.g., 100ms, 200ms, 400ms) instead of retrying immediately. Immediate retries during an outage create a **thundering herd** that keeps the struggling service down.

**Jitter:** add randomness to the backoff (**full jitter** = pick a random delay in `[0, backoff]`). Without jitter, all clients that failed at the same instant **re-synchronize** and retry in lockstep, producing repeated coordinated spikes. Jitter spreads them out and smooths the load.

Finally, retries must be **combined with a circuit breaker** — retrying while the dependency is already broken just makes it worse, so once the breaker is **open you skip retries entirely** and fail fast. And **track your retry rate** as a first-class metric: a sudden spike in retries is often the **earliest signal** that a dependency is degrading, well before it shows up as user-facing errors.

**Key points:**
- Timeouts everywhere; shorter than parent.
- Retry only idempotent ops, capped.
- Full jitter > no jitter to break herds.
- Skip retries when circuit is open.

---

### 20. SQL vs NoSQL decision matrix

**Frequency:** High

**Question:** How do you choose between SQL and the NoSQL families? Why not reach for NoSQL "for scale" first?

**Answer:** The honest default is **relational SQL** (Postgres, MySQL): it gives you **rich ad-hoc queries, ACID transactions, joins, constraints, a mature ecosystem**, and a strict schema that catches bugs at write time. You should pick it **unless something concrete rules it out**, because most applications fit comfortably in a single Postgres instance for years, and a well-tuned Postgres handles far more load than people assume.

The NoSQL families each optimize a **specific access pattern**, and you choose based on how you actually query, not on hype:

- **Document stores (MongoDB, DynamoDB):** store JSON-like documents with **flexible/variable schemas** and **single-document atomicity**. Good when each record is a self-contained aggregate with variable shape and you want **high write throughput** without rigid migrations. Weak at cross-document joins and multi-document transactions.
- **Wide-column (Cassandra, ScyllaDB):** built for **massive write throughput** and **linear horizontal scale** with **tunable consistency**. Excellent for **time-series, event logs, and write-heavy** workloads — but you must **design tables around your queries up front** (query-first modeling), because ad-hoc queries aren't supported.
- **Key-value (Redis, DynamoDB):** dead-simple `get`/`put` by key with **sub-millisecond latency**. Ideal for caches, sessions, counters, leaderboards, rate limiters — anywhere the access pattern is a direct key lookup.
- **Graph (Neo4j):** first-class **relationships and traversals**. When the core queries are "friends-of-friends", fraud rings, or recommendation paths — multi-hop relationship queries that would be painful self-joins in SQL — a graph DB shines.

**Decide by four axes:** the **access pattern** (known-in-advance queries favor purpose-built NoSQL modeling; unpredictable queries favor SQL's flexibility), **consistency needs**, **scale**, and **operational maturity** (can your team actually run a Cassandra cluster?). The anti-pattern is choosing **"NoSQL for scale"** prematurely: you trade away joins, transactions, and query flexibility — real, daily costs — to solve a scaling problem you don't yet have. **Prove SQL is inadequate first**; polyglot persistence (SQL for core data, Redis for cache, a search engine for full-text) is usually better than betting everything on one non-relational store.

**Key points:**
- SQL is the default until proven wrong.
- NoSQL choice depends on access pattern.
- Wide-column for write-heavy at scale.
- Graph DBs for true relationship queries.

---

### 21. AuthN vs AuthZ architecture

**Frequency:** High

**Question:** Contrast authentication and authorization. Why separate them architecturally?

**Answer:** **Authentication (AuthN)** answers **"who are you?"** — verifying identity via login, sessions, MFA, passwordless/passkeys, social login. **Authorization (AuthZ)** answers **"what are you allowed to do?"** — evaluating whether *this* identity may perform *this* action on *this* resource via RBAC (role-based), ABAC (attribute-based), or ReBAC (relationship-based) rules. They're different problems, and **conflating them is a classic source of bugs** — checking that someone is logged in but not that they own the record they're editing (broken object-level authorization, OWASP's #1 API risk).

**Separating them architecturally** pays off because they scale and evolve independently:

- **Centralize AuthN in an identity provider** (Auth0, Okta, Cognito, or an internal IdP). One place owns credentials, MFA, session lifecycle, and lockout policy — you don't want every service reimplementing login. It issues tokens (OIDC/JWT) that downstream services trust.
- **AuthZ can be central or distributed.** A **central policy engine** — **OPA/Rego, AWS Cedar, or AuthZed/SpiceDB** (Google Zanzibar-style ReBAC) — lets you write, version, and audit policy in one place and query it from any service. Alternatively, services evaluate policy locally via a **shared library** for lower latency. The trend is externalizing AuthZ from application code so permission logic isn't scattered across `if user.role == "admin"` checks.

A key division of labor: **tokens (JWT/OIDC) carry identity and maybe coarse roles**, but **fine-grained, resource-level decisions ("can Alice edit document 42?") should be evaluated at request time by the policy engine**, not baked into a token — because permissions change faster than a token's lifetime, and stuffing every permission into a JWT bloats it and makes revocation impossible.

Finally, **audit every authorization decision** with the full context — **subject, action, resource, decision (allow/deny), and reason/policy** — so you can answer "who accessed this and why was it allowed?" during a security review or incident. That audit trail is often a compliance requirement and is invaluable for debugging "why can't this user do X?".

**Key points:**
- AuthN = identity; AuthZ = permissions.
- Central IdP for authN; engine for authZ.
- JWT carries identity, not fine-grained perms.
- Audit decisions with full context.

---

### 22. OAuth 2.0 / OIDC flows

**Frequency:** High

**Question:** Walk through OAuth 2.0 and OIDC — the main flows, token types, and security practices.

**Answer:** **OAuth 2.0** is a **delegated authorization** framework: it lets an app obtain an **access token** to call APIs *on a user's behalf* without ever seeing their password. **OIDC (OpenID Connect)** layers **authentication** on top of OAuth by adding an **ID token** that carries verified identity claims — so OAuth answers "can this app access this API?" and OIDC also answers "who is the user?".

**The flows, and when to use each:**

- **Authorization Code + PKCE** — the **modern default** for web apps, mobile apps, and SPAs. The user authenticates at the IdP, which returns a short-lived **authorization code** via redirect; the app exchanges that code (plus a **PKCE** verifier) for tokens. **PKCE** (Proof Key for Code Exchange) binds the code to the client that started the flow, so an intercepted code is useless — essential for **public clients** (mobile/SPA) that can't keep a secret.
- **Client Credentials** — **machine-to-machine**, no user involved. A backend service authenticates with its own client ID/secret to get an access token for another API.
- **Device Code** — for **input-constrained devices** like TVs and CLIs: the device shows a code, the user enters it on their phone/laptop, and the device polls for the token.

**Deprecated flows:** the **Implicit** flow (returned tokens directly in the URL fragment — leaky, no PKCE) and **Resource Owner Password** (the app handles the raw password — defeats the whole point of delegation). Don't use them in new systems.

**Token types:** the **access token** is **short-lived** (minutes) and sent to APIs as a bearer credential; the **refresh token** is **long-lived** and used to silently obtain new access tokens — it must be stored securely and **rotated on each use** (rotation detects theft: a replayed old refresh token signals compromise). The **ID token** (OIDC, a JWT) carries identity claims (`sub`, `email`, `name`) for the client to establish a session.

**Security practices:** always use **PKCE for public clients**; require **HTTPS** everywhere; **validate `iss`** (issuer), **`aud`** (audience — the token is for *your* API), **`exp`** (not expired), and **`nonce`** (ties the ID token to your request, blocking replay). Store refresh tokens in **HTTP-only, Secure cookies** or platform secure storage — never in `localStorage` where XSS can steal them — and **rotate on use**.

**Key points:**
- Authorization Code + PKCE is the default.
- Access token short, refresh token rotated.
- OIDC adds ID token on top of OAuth.
- Always validate iss/aud/exp/nonce.

---

### 23. Blue/green vs canary vs rolling

**Frequency:** High

**Question:** Compare blue/green, canary, and rolling deployments. How would you mix them by risk level?

**Answer:** All three ship a new version to production; they differ in **how much extra capacity they need** and **how fast and safe rollback is**.

**Rolling:** replace instances **N at a time** — kill a few v1 pods, bring up v2 pods, repeat until the fleet is upgraded. It's **cheap** (no extra capacity — you reuse the same nodes) and it's the Kubernetes default. The downsides: **rollback is slow** (you have to roll the fleet back N at a time), during the rollout **both versions serve traffic** so they must be compatible, and a **bad version reaches real users immediately** (just a fraction at first, but with no automated gate).

**Blue/green:** stand up the **entire v2 fleet ("green") alongside the running v1 ("blue")**, test green privately, then **switch all traffic atomically** (flip the load balancer / DNS / router). **Rollback is instant** — flip back to blue, which is still running. The cost is **~2x capacity** during the cutover, and because the switch is all-or-nothing, a bad v2 hits **100% of users** the moment you flip (mitigated by smoke tests before the switch). It's clean and great for **stateful or DB-coupled upgrades** where you want one decisive cutover.

**Canary:** route a **small percentage** of traffic to v2 (say 1% → 5% → 25% → 100%), **watch the SLOs** (error rate, latency, business metrics) at each step, and **automatically ramp or roll back** based on that analysis (Flagger, Argo Rollouts, Spinnaker). This gives the **smallest blast radius** — a bad version is caught while only 1% of users are affected — but it **requires strong observability** and automated metric analysis to be safe, and it's slower to fully roll out.

**Mixing by risk** is the mature approach: use **canary for risky changes** (new algorithms, big refactors, anything user-facing and uncertain) so you catch regressions early; use **rolling for routine, low-risk deploys** (config tweaks, minor fixes) where the overhead of canary analysis isn't worth it; and use **blue/green for stateful or database-coupled upgrades** where a clean, reversible, all-at-once cutover is safer than having two versions interleaved on the same data. Match the ceremony to the blast radius of the change.

**Key points:**
- Rolling: cheap, slow rollback.
- Blue/green: instant rollback, 2x capacity.
- Canary: gradual, observability-driven.
- Mix per risk level.

---

### 24. Logs vs metrics vs traces

**Frequency:** High

**Question:** Compare the three pillars of observability — logs, metrics, and traces. How do they work together?

**Answer:** Logs, metrics, and traces answer different questions, and mature observability uses all three together rather than picking one.

**Logs** are **discrete, timestamped events with rich context** — "user 42 failed payment: card declined, code XYZ". They're the best tool for **debugging a specific incident** because they carry the detail. But they're **expensive to store at scale** (high volume, full-text indexing) and **hard to aggregate** — answering "what's my p99 latency?" by scanning logs is slow and costly. Best practice is **structured logging** (JSON with fields) so logs are at least queryable.

**Metrics** are **numeric time-series with labels** — `http_requests_total{status="500", route="/checkout"}`. They're **cheap** (just numbers over time), **aggregatable**, and perfect for **dashboards, SLOs, and alerting** ("page me when error rate > 1% for 5 minutes"). Their hard constraint is **cardinality**: each unique label combination is a separate series, so putting a **high-cardinality field like user ID or request ID in a label explodes the series count** and can take down your metrics backend. Keep labels **low-cardinality** (status, route, region) — that's the metrics killer to watch for.

**Traces** follow a **single request across services**, breaking it into **spans** with per-span timing. A trace shows that a slow checkout spent 20ms in the API, 400ms waiting on the payment service, and 30ms in the DB — invaluable for **latency analysis** and building **service-dependency graphs** in a distributed system where no single log or metric shows the end-to-end path. Because tracing every request is expensive, you **sample** traces (keep a percentage) — **but you never sample away errors**: always keep 100% of traces for failed/slow requests, since those are exactly the ones you need to debug.

**Used together:** **metrics** tell you *something is wrong* and fire the alert; **traces** tell you *where* in the distributed call graph the time or error is; **logs** tell you *why* at that specific span. **OpenTelemetry** unifies the instrumentation surface — one SDK and wire format for all three, with **correlation IDs** linking a trace to its logs — so you can pivot from an alert to the trace to the exact log line, while staying free to choose the backend (Datadog, Honeycomb, Grafana/Loki/Tempo/Prometheus).

**Key points:**
- Metrics for alerts, logs for debug, traces for flow.
- OpenTelemetry standardizes instrumentation.
- Cardinality is the metrics killer.
- Sample traces; never sample errors.

---

### 25. SLI / SLO / SLA & error budgets

**Frequency:** High

**Question:** Define SLI, SLO, SLA, and error budget, and explain how they connect to govern deploy risk.

**Answer:** These four terms form the vocabulary of reliability engineering, and they connect in a chain from measurement to contract to decision-making.

- **SLI (Service Level Indicator):** a **measurable signal of user-visible health** — the fraction of requests that succeed, or the p99 latency, or "requests served in under 300ms". It's the raw number you actually measure.
- **SLO (Service Level Objective):** an **internal target** on that SLI — "99.9% of requests succeed over a rolling 30 days". It's the line you hold yourselves to.
- **SLA (Service Level Agreement):** an **external contract** with a customer that carries **penalties** (refunds, credits) if breached — "99.5% uptime or we credit your bill". SLAs are deliberately set **looser than SLOs** (you want to catch problems internally, via the SLO, well before you breach the customer contract).
- **Error budget = 1 − SLO.** A 99.9% SLO permits **0.1% failures** — over 30 days that's ~43 minutes of downtime you're *allowed* to spend.

The **error budget is the pivotal idea** because it turns "reliability vs. velocity" from an argument into a **quantitative policy**. When you're **comfortably meeting the SLO**, you have budget to *spend* — ship risky changes, run experiments, deploy faster, because you can afford some failures. When the budget is **exhausted** (you've used up your 43 minutes), you **freeze risky deploys** and redirect effort to reliability until the budget recovers. This aligns dev and ops on one number instead of dev pushing for speed and ops pushing for stability in the abstract.

Two important refinements. **SLIs must be user-centric** — measure "did the user's request succeed and return quickly?", **not** infrastructure proxies like CPU or memory. High CPU with happy users is fine; low CPU while users get errors is not — infra metrics are for debugging, not for defining reliability. And **alerting uses multi-window, multi-burn-rate** logic: a **fast burn** (you'll exhaust the whole month's budget in an hour) pages immediately, while a **slow burn** (gradually trending over days) opens a ticket. Combining a short and a long window prevents both **alert fatigue from brief blips** and **missing a slow, steady degradation** — you page on things that genuinely threaten the budget.

**Key points:**
- SLI measures, SLO targets, SLA contracts.
- Error budget governs deploy risk.
- User-centric SLIs over infra ones.
- Multi-window burn-rate alerts.

---

### 26. URL shortener (bit.ly)

**Frequency:** High

**Question:** Design a URL shortener like bit.ly. Cover code generation, storage, and the 301-vs-302 tradeoff.

**Answer:** **Requirements:** shorten a long URL to a short code, redirect on `GET /:code`, track clicks, and handle scale — say **100B+ links** and **~100K read QPS** at roughly **10:1 read:write** (redirects vastly outnumber creations). This is a **read-heavy, write-light** system, which shapes every decision.

**Components:** an **API service** (`POST /shorten` to create, `GET /:code` to redirect), a **code generator**, a **KV store** for the code→URL mapping, and an **analytics pipeline** for clicks.

**Code generation.** The clean approach is to take a **globally unique 64-bit ID** and **base62-encode** it (`[a-zA-Z0-9]`, so 7 chars ≈ 3.5 trillion codes). Get the ID from a **sharded/segmented counter** (each app server grabs a range of IDs to avoid coordinating per request) or a **Snowflake-style** generator (timestamp + machine + sequence). The alternative — **hashing the URL** (e.g., MD5, take a prefix) — needs **collision handling** (retry with a salt) and lets identical URLs dedupe, but risks collisions as you fill the space.

**Storage layers, tuned for reads.** Put a **CDN / edge cache** in front so hot redirects never touch your origin; a **Redis cache** for the hottest codes; and a **durable, horizontally scalable KV store** (Cassandra or DynamoDB, sharded by `short_code` hash) as the source of truth. Because a code→URL mapping is **immutable**, it caches beautifully.

**Data model:** `{ short_code (PK), long_url, owner, created_at, expires_at, click_count }`.

**The 301-vs-302 tradeoff is the classic gotcha.** A **301 (permanent)** redirect is cached by browsers and CDNs forever — great for offloading traffic (subsequent hits never reach you) but it **kills analytics** (you never see the repeat clicks) and makes **revocation/expiry hard** (the cached redirect persists). A **302 (temporary)** redirect means **every click comes back to your service**, so you can **count clicks** and **revoke/expire** links — at the cost of higher load. **Choose 302 when analytics or revocation matter**, 301 when raw redirect throughput matters most.

**Scaling & security:** shard the KV by code hash, cache the hottest codes locally on each edge, and stream clicks async (`click → Kafka → ClickHouse`) so analytics never slows the redirect path. Note that **counter-based codes are sequential and guessable** — fine for public links, but a **security/enumeration risk for private ones**, where you should use **random or hashed** codes so people can't walk the ID space.

**Key points:**
- Base62 from sharded counter or Snowflake.
- CDN + Redis + durable KV.
- 302 if you need click analytics.
- Cache hot codes locally to absorb peaks.

---

### 27. Twitter timeline (fan-out on read vs write)

**Frequency:** High

**Question:** Design a Twitter home timeline. Compare fan-out on write vs on read, and describe the hybrid.

**Answer:** **Requirements:** users post tweets and see a **home timeline** of the people they follow, in chronological or ranked order. Scale is the whole challenge — **~500M users**, a heavy **read:write skew** (people scroll far more than they post), and **celebrities with 100M+ followers**. The core question is *when* you assemble each user's timeline.

**Fan-out on write (push):** when a user tweets, **immediately push that tweet into every follower's precomputed timeline** — a per-user **Redis list ("inbox")**. Reads are then trivially fast: a timeline read is just "return my inbox list", O(1). The cost is **write amplification**: a normal user's tweet fans out to a few hundred inboxes (fine), but a **celebrity with 100M followers triggers 100M inbox writes per tweet** — a massive, spiky write storm that can't keep up.

**Fan-out on read (pull):** store tweets once, and **at read time query the recent tweets of everyone you follow and merge them**. Writes are cheap (one insert), but **reads are expensive** — assembling a timeline means fanning out to hundreds of followees and merge-sorting their tweets on every scroll, which is slow at 500M users.

**The hybrid is the real answer:** **fan-out on write for normal users** (cheap, gives fast reads for the 99%), but for **celebrities, don't fan out** — keep their tweets in a separate store and **merge them in at read time**. So a user's timeline = their precomputed inbox (from normal followees) **∪** a live pull of the handful of celebrities they follow, merged and ranked. This caps write amplification (no 100M-write storms) while keeping reads fast for almost everyone.

**Components:** a **Tweet service** (durable store — Manhattan/Cassandra), a **Timeline service** (Redis inboxes), a **fan-out worker** driven by **Kafka** (decouples posting from the expensive fan-out so a tweet returns instantly while distribution happens async), a **ranking service** (an ML model that reorders the merged timeline by predicted engagement rather than strict chronology), and a **media service** (S3 + CDN). The key tradeoffs: the hybrid **balances write amplification against read latency**, Kafka **absorbs fan-out spikes**, and **ranking eventually replaces pure chronological ordering** — which itself adds latency and complexity you apply on top of the merge.

**Key points:**
- Hybrid fan-out: write for normal, read for celebs.
- Redis lists per user as inbox.
- Kafka decouples post from fan-out.
- Ranking model on top of timeline merge.

---

### 28. WhatsApp / chat

**Frequency:** High

**Question:** Design WhatsApp/a chat system. Cover connections, message routing, presence, and E2E encryption.

**Answer:** **Requirements:** 1:1 and group chat, **online presence**, **delivery and read receipts**, **end-to-end encryption**, **offline message queueing** (deliver when a recipient reconnects), at massive scale — say **100B messages/day**. Chat is fundamentally about **maintaining millions of live connections** and routing small messages between them reliably.

**Components:**
- **Connection service:** holds **long-lived WebSocket** connections — potentially **millions per node** using an event-driven/actor runtime (WhatsApp famously used Erlang, whose lightweight processes excel at massive concurrency). Each connected user is **pinned to a specific connection node**.
- **Message service:** persists a **per-conversation append-only log** (Cassandra or a custom store) so messages survive and can be re-delivered.
- **Presence service:** tracks online/offline and "last seen" using **Redis keys with short TTLs** — a heartbeat refreshes the key; expiry means offline. Presence is high-churn, so it's kept separate and ephemeral.
- **Push service:** when a recipient is offline, hand off to **APNs/FCM** so their phone wakes and pulls the queued messages.
- **Media service:** large attachments go to **S3 + CDN** as (E2E-encrypted) blobs, not through the message path.

**Routing:** each user maps to their connection node via **consistent hashing** (a registry of user→node). To deliver a message, the sender's node **looks up the recipient's node and forwards** the message there over the mesh; that node pushes it down the recipient's WebSocket. If the recipient is offline, the message is **queued** in the message log and a **push notification** is sent; on reconnect the client pulls anything it missed. **Delivery/read receipts** are just small control messages flowing back the same way (sent → delivered → read).

**End-to-end encryption:** use the **Signal Protocol** — **X3DH** for the initial key agreement and the **Double Ratchet** for per-message forward-secret keys. Crucially, the **server only ever stores and forwards ciphertext**; it cannot read messages. Keys live on devices, which is why "this message is encrypted" and why a new device must re-establish sessions.

**Scaling:** **shard by user**, **geo-route** each user to the nearest point of presence to cut latency, and for **group chat fan out asynchronously** (deliver to N members via the message service rather than blocking the sender) — a group message is the same routing problem repeated per member, so it's decoupled through a queue.

**Key points:**
- WebSockets per user; consistent hash to nodes.
- Signal protocol for E2E (X3DH + Double Ratchet).
- Per-conversation log in Cassandra.
- APNs/FCM for offline delivery.

---

### 29. Uber / ride-hailing dispatch

**Frequency:** High

**Question:** Design Uber-style ride-hailing dispatch. Cover geo-indexing, matching, and the scaling model.

**Answer:** **Requirements:** match a rider to a **nearby available driver within seconds**, track **real-time location** for millions of drivers, compute **pricing/surge and ETAs**, at scale — say **10M+ active drivers**. The heart of the system is a **geospatial matching** problem under a constant firehose of location updates.

**Components:**
- **Location service:** every driver **pings their GPS every few seconds**. You can't scan all drivers per query, so you index them in a **geospatial structure** — **Google S2 cells** or **Uber's H3 hexagons** — which map the globe into hierarchical cells. "Find drivers near this rider" becomes "look up the rider's cell and its neighbors", turning a global search into a **local cell lookup**.
- **Dispatch service:** maintains a **per-cell index of available drivers** and runs the **matching algorithm** — typically **minimize pickup ETA** (accounting for road network and traffic, not just straight-line distance) while adding **fairness** (spread rides across drivers) and avoiding thrashing.
- **Pricing/surge service:** computes **surge per cell** from the real-time **supply/demand ratio** — few drivers + many requests in a cell → raise the multiplier to pull in supply and ration demand.
- **Trip service:** a **state machine** — `requested → matched → en_route → in_progress → completed` — that guarantees each trip advances correctly and exactly once, plus **payment** and **notification** services hanging off the transitions.

**Scaling:** **geo-shard by city/region** — since **almost every ride is local**, a rider in Chicago never needs a driver in Tokyo, so independent **dispatch services per region** scale out cleanly. The **location update stream** is enormous (10M drivers × a ping every few seconds), so it flows through **Kafka** as a firehose into an **in-memory geo index** rather than hammering a database on every ping.

**Key tradeoff — greedy vs. global matching:** the simple approach matches each request to its **nearest available driver** immediately (fast, simple, locally optimal). **Global/batch optimization** waits a moment to match a *batch* of riders and drivers together, minimizing total wait across everyone — better system-wide outcomes, but higher latency and much harder to build. Surge pricing is the other tradeoff: it effectively **balances supply and demand** and is economically sound, but it's **politically fraught** (users hate seeing prices spike during emergencies), so it needs caps and careful UX.

**Key points:**
- Geo-index with S2/H3 cells.
- Per-region dispatch shards.
- Trip state machine for correctness.
- Location stream firehose via Kafka.

---

### 30. Google Drive / Dropbox (file sync)

**Frequency:** High

**Question:** Design Dropbox/Google Drive file sync. Cover chunking, dedup, conflict resolution, and the dedup-vs-encryption tradeoff.

**Answer:** **Requirements:** sync files across a user's devices, resolve **conflicts**, support **sharing**, **versioning**, and **offline edits**, at **petabyte** scale. The defining insight is to **never sync whole files** — sync the **minimum set of changed blocks**.

**Components:**
- **Block storage:** split each file into **chunks** (say ~4MB), **content-address** each chunk by its **hash**, and store chunks in an object store (S3). Content addressing gives **automatic deduplication** — two users (or two versions) with the same chunk store it **once**, and syncing an edited file only uploads the **chunks that changed**.
- **Metadata service:** the **consistency point** — it holds the file tree, each file's ordered **list of chunk hashes**, **version history**, and **ACLs**, sharded by user/team. A file is essentially *metadata (a recipe of chunk hashes) + the chunks it references*.
- **Sync client:** watches the local filesystem, **computes deltas** (which chunks changed, rsync-style), uploads **only new chunks**, then commits the new chunk-list to the metadata service. Downloads work in reverse — fetch the new metadata, pull only chunks you don't already have.
- **Notification service:** pushes **remote-change events** (long-poll or WebSocket) so other devices know to sync promptly instead of polling.
- **Sharing service:** ACLs plus **shareable link tokens** with scopes (view/edit, expiry).

**Sync flow:** client detects a change → hashes chunks → uploads only the new ones to block storage → **atomically updates the file's metadata** (new version = new chunk list). Because metadata updates are **atomic per file**, a reader always sees a consistent version, never a half-written file.

**Conflict resolution:** when two devices edit offline and both sync, the common strategy is **last-writer-wins plus keep-both** — the system keeps one as the file and saves the other as a **"conflicted copy"** so no edit is silently lost. For **real-time collaborative editing** (Google Docs), that's not enough — you use **operational transformation (OT)** or **CRDTs** to merge concurrent character-level edits automatically.

**The dedup-vs-encryption tradeoff:** cross-user dedup requires the server to recognize that two users uploaded the **same chunk** — which means the chunk isn't encrypted with a **per-user key** (or dedup breaks, since identical plaintext would produce different ciphertext). **Convergent encryption** (key derived from the content hash) partially bridges this but leaks "someone else has this exact file". So you choose: **maximum dedup** (server-side keys, less privacy) or **true per-user E2E encryption** (privacy, but you lose cross-user dedup and much of the storage savings).

**Key points:**
- Content-addressed chunks for dedup.
- Metadata service is the consistency point.
- Client computes deltas; uploads only new chunks.
- Conflict resolution: LWW + keep both, or OT.

---

### 31. Distributed rate limiter

**Frequency:** High

**Question:** Design a distributed rate limiter. Compare the algorithms and the accuracy-vs-latency tradeoff across edge nodes.

**Answer:** **Requirements:** enforce **per-user/per-key request limits** (e.g., 100 req/s) across **N globally distributed edge nodes**, with **low overhead** on every request, tolerating **slight over-limit during partitions** (correctness here is "roughly right and fast", not "exact and slow").

**The algorithms:**
- **Token bucket:** a bucket holds up to B tokens and **refills at R tokens/sec**; each request consumes one, and an empty bucket rejects. It **allows bursts** up to B (good — real traffic is bursty) while enforcing the average rate R. This is the **practical default** for API rate limiting.
- **Sliding window log:** store the **timestamp of every request** and count how many fall in the last window. **Precise** (no boundary artifacts) but **memory-heavy** — you keep every timestamp per key, which doesn't scale to millions of keys.
- **Sliding window counter:** keep a counter per fixed window and **interpolate** across the boundary using the previous window's count. **Approximate** but **cheap** (two integers per key), and it smooths the "double-burst at the boundary" flaw of a naive fixed-window counter.

**Implementation:** the simplest correct version is **centralized Redis** — `INCR` the key with an `EXPIRE`, reject when it exceeds the limit. To make check-and-decrement **atomic** (avoid races between concurrent requests), run it as a **Lua script** on Redis so the read-modify-write happens server-side in one step. The catch is that a central Redis on every request adds a **network round-trip** of latency and is a bottleneck/SPOF.

**The distributed challenge and the hierarchical answer:** with N edge nodes, calling central Redis on every request is too slow. The standard pattern is **hierarchical**: each node enforces a **local soft cap in-memory** (fast, no round-trip) and **periodically syncs** counts to a central store that enforces the **global hard cap**. This keeps the hot path local and only occasionally reconciles globally.

**The core tradeoff is precision vs. latency.** Perfectly accurate global limits require coordinating on every request (slow); fast local limits can **overshoot** slightly because nodes don't see each other's counts in real time. Since a few extra requests rarely matter, you **deliberately allow small overage** to avoid the round-trip. For eventually-consistent **cross-region** counting, **CRDT PN-counters** let each region increment locally and merge without conflicts — accepting temporary over-count in exchange for availability and low latency.

**Key points:**
- Token bucket is the practical default.
- Redis + Lua for atomic check-and-decrement.
- Local soft + global hard for low latency.
- Allow small overage to save round trips.

---

### 32. Typeahead / autocomplete

**Frequency:** High

**Question:** Design a typeahead/autocomplete system. How do you serve sub-100ms suggestions and blend popularity with personalization?

**Answer:** **Requirements:** return suggestions in **sub-100ms** on every keystroke, blend **popular** queries with **personalized** ones, support **multiple languages**, at **billions of queries**. The dominant constraint is the latency budget — you fire a request per keystroke, so each must be extremely cheap.

**The index — built offline, served from memory.** You don't compute suggestions live from raw logs. Instead, an **offline job mines query logs** to produce the top queries with **scores** (frequency, recency), and builds a **Trie** or, more compactly, an **FST (finite-state transducer)** that maps prefixes to their top completions. This structure is **refreshed hourly/daily** and held **entirely in memory** on the suggestion nodes — a prefix lookup then walks a few nodes and returns precomputed top-K, which is what makes it fast.

**The query service:** each keystroke sends a lightweight request; the node walks to the prefix and returns the **top-K completions ranked by frequency + recency + personalization**. Keeping K small and the ranking precomputed keeps per-request work tiny.

**Personalization:** blend the **global suggestions** with the **user's own history** — recent searches, clicked results — either merged server-side from a small per-user index or applied client-side from browser-cached history. A user who always searches "react hooks" should see it ranked above the global "react native".

**Scaling:** **shard the index by prefix** (all "ap..." on one node) or simply **replicate the read-only index** across many nodes (it's small and rebuilt centrally, so replication is cheap). **CDN-cache** results for the most common short prefixes (single/double letters), and **debounce on the client** (~200ms) so you don't fire a request for every rapid keystroke — batching cuts backend load dramatically.

**Tradeoffs:** **freshness vs. build cost** — rebuilding the index more often surfaces trending queries sooner but costs more compute; and **popularity bias** — ranking purely by historical frequency **buries new/long-tail queries** and creates a rich-get-richer loop, so you **mix in fresh queries from a real-time stream** to let new terms break through before they've accumulated history.

**Key points:**
- Trie/FST built offline from logs.
- Shard or replicate read-only index.
- Debounce + client-side cache.
- Mix popular + fresh + personalized.

---

### 33. Web crawler

**Frequency:** High

**Question:** Design a web crawler. Cover the URL frontier, politeness, dedup, and freshness tradeoffs.

**Answer:** **Requirements:** crawl **billions of pages**, **respect robots.txt**, **dedupe URLs**, **prioritize fresh/popular content**, and be **polite** (don't hammer any single domain). Politeness and dedup at scale are what make this hard.

**Components:**
- **URL frontier:** the queue of URLs to crawl, implemented as a **priority queue sharded by domain**. Sharding by domain is what enables **politeness** — all URLs for `example.com` go to one queue that enforces a per-domain rate, so you never overwhelm a site even while crawling millions of others in parallel. Priority reflects popularity/freshness (crawl high-value pages first).
- **Fetcher pool:** many HTTP workers pulling from the frontier, each applying **per-domain throttling** (respect crawl-delay, cap RPS per host).
- **Robots cache:** fetch and cache each domain's `robots.txt` so you honor disallow rules without re-fetching it constantly.
- **Parser:** extract **links** (feed new URLs back into the frontier) and **content**.
- **Dedup store:** a **Bloom filter** for "have I seen this URL?" — space-efficient at billions of URLs, accepting a tiny false-positive rate (occasionally skip a new URL) in exchange for massive memory savings — plus **content hashing** (e.g., SimHash) to detect **near-duplicate pages** (the same article on ten mirror sites) so you don't store them all.
- **Storage:** **raw HTML in object storage (S3)**, **structured/extracted data in a DB** or search index.
- **Scheduler:** a **revisit policy** — pages that change often (news homepage) are re-crawled frequently; static pages rarely — to keep the index fresh without wasting crawl budget.

**Scaling:** **shard the frontier by domain hash** so each shard owns a set of domains and enforces their politeness independently; run **many fetchers per shard** but **cap per-domain RPS**. The Bloom filter is either **distributed** or **sharded by URL hash** to fit billions of entries.

**Tradeoffs:** the central tension is **freshness vs. politeness vs. coverage** — you can't crawl everything, often, *and* gently, so you allocate crawl budget by page value and change rate. **Sitemaps** help prioritize and discover URLs cheaply. And **JS-heavy pages** need a **headless browser** to render before the content appears — but that's **10–100× more expensive** than a plain HTTP fetch, so you **reserve it for high-value sites** and use cheap fetching everywhere else.

**Key points:**
- Per-domain politeness via sharded frontier.
- Bloom filter for seen-URL dedup.
- Sitemap + revisit policy for freshness.
- Headless browser only for JS-heavy sites.

---

### 34. Payment system (idempotency, ledger, reconciliation)

**Frequency:** High

**Question:** Design a payment system focused on correctness. Why is the idempotency key the single most important element?

**Answer:** **Requirements:** process payments **correctly under retries and partial failures**, **never double-charge**, keep **exact accounting** with a full **audit trail**, and meet **PCI compliance**. Unlike most systems where a lost or duplicated request is annoying, here it's **money** — so correctness dominates every decision.

**Components:**
- **Payment API:** every mutating request carries a client-generated **idempotency key**. The server stores the key **with its result**; if the same key arrives again (a retry after a timeout, a double-click, a network blip), it **returns the stored response instead of charging again**. This is the crux of the whole design (see below).
- **Ledger service:** **double-entry bookkeeping** — every transaction records **equal debits and credits** across accounts, and entries are **append-only/immutable** (you never edit; you post a correcting entry). This makes the books always balance and gives a perfect audit trail.
- **Provider adapters:** integrations with Stripe/Adyen/etc., wrapped in **circuit breakers and retries** so a flaky provider doesn't cascade.
- **Reconciliation jobs:** **daily compare your ledger against the provider's statements** and flag any discrepancy — the safety net that catches money that "went missing" between systems.
- **Webhook handler:** providers notify you of async events (payment settled, disputed); handlers must be **idempotent** (webhooks are re-delivered) and **signature-verified** (so an attacker can't forge a "payment succeeded").
- Plus **KYC/AML** checks and **settlement**.

**Data model:** **accounts + entries** — each transaction is a set of debit/credit entries referencing accounts, immutable once posted.

**Scaling:** **shard the ledger by account**; because entries are immutable, sharding is easy (no cross-shard updates to a mutable balance — you sum entries).

**Sync vs. async tradeoff:** **synchronous confirmation** (hold the request until the charge completes) is simpler but slower and ties up connections; **asynchronous** (accept, return a pending status, confirm via webhook/polling) scales better and tolerates slow providers, at the cost of more complex client handling.

**Why the idempotency key is paramount:** payment requests **will** be retried — clients time out, users double-click, networks drop the response after the charge succeeded. Without idempotency, each retry is a **fresh charge** → the customer is billed twice. The idempotency key makes a retry **provably safe**: the operation executes **exactly once** regardless of how many times it's sent. Everything else (ledger, reconciliation, webhooks) protects correctness, but the idempotency key is what prevents the single worst failure — **double-charging** — so it's the first thing you design and the one you never compromise.

**Key points:**
- Idempotency key on every mutating request.
- Double-entry ledger, append-only.
- Reconciliation jobs catch drift.
- Webhooks idempotent and signed.

---

### 35. SOA vs microservices

**Frequency:** Medium

**Question:** How do SOA and microservices differ, given both build on the "service" abstraction?

**Answer:** Both organize a system as **services**, but they come from different eras and invert several key defaults — and the real distinction is **cultural** (who owns data, where logic lives), not the label.

**SOA** emerged in the **2000s** around **enterprise integration**. Its hallmarks were a heavy **Enterprise Service Bus (ESB)** that centralized routing, transformation, and orchestration; **canonical XML schemas** and **WS-*** contracts (WSDL, SOAP, WS-Security) shared across the organization; and often **shared databases** between services. The ESB was "smart" — business logic and integration flows lived *in the bus*.

**Microservices** borrow the service abstraction but flip the defaults:
- **Smart endpoints, dumb pipes:** logic lives **in the services**, and the transport (HTTP, a message broker) is a simple pipe — the **opposite** of the smart-ESB model. No central orchestration bus.
- **Decentralized data ownership:** each service **owns its own database**; no shared schema, no reaching into another service's tables. This is the biggest practical difference — SOA commonly **shared data**, microservices **forbid it**.
- **Lightweight contracts:** **HTTP/JSON or gRPC** instead of WS-*/canonical XML, evolved per service rather than governed centrally.
- **Continuous delivery + container orchestration:** microservices **assume** independent, automated deploys (CI/CD, Kubernetes) — that operational model is baked into the style.

**What each optimizes for:** SOA optimizes for **enterprise-wide reuse and governance** (one canonical customer model, central control); microservices optimize for **team autonomy and deploy velocity** (each team ships independently).

**Where the line blurs:** add a **service mesh** (Istio) or **API gateway** to a microservices system and you've reintroduced some centralized routing/policy that looks ESB-ish; conversely, a lightweight SOA can resemble microservices. So the label matters less than the **coupling**: if services **share a database or a canonical schema and can't deploy independently**, you have SOA-style coupling regardless of what you call it; if they **own their data and deploy on their own cadence**, you have microservices' autonomy. Focus on coupling, not the marketing term.

**Key points:**
- ESB vs dumb pipes is the architectural fork.
- SOA shares data; microservices own data per service.
- Microservices assume CD and container orchestration.
- Both can be done well or poorly; labels matter less than coupling.

---

### 36. Hexagonal / ports-and-adapters

**Frequency:** Medium

**Question:** Explain hexagonal (ports-and-adapters) architecture. When is it worth it versus overkill?

**Answer:** In **hexagonal architecture** (aka **ports and adapters**), the **application core** — your domain logic — sits in the center and defines **ports**: interfaces for everything it needs from the outside world (a `UserRepository` port, a `PaymentGateway` port, an `EventPublisher` port). **Adapters** live on the outside and **implement** those ports for a specific technology (a Postgres adapter for the repository, a Stripe adapter for payments, a Kafka adapter for events). The crucial rule: **dependencies point inward** — the core knows nothing about frameworks, HTTP, or SQL; it only knows its ports.

There are two kinds of adapters. **Driver (primary) adapters** *call into* the core — an HTTP controller, a CLI command, a queue consumer — they drive the application. **Driven (secondary) adapters** are *called by* the core through ports — the database, message bus, external APIs. The same core can be driven by an HTTP request, a CLI invocation, or a queue message **without changing a line of domain logic**, because all three are just driver adapters plugged into the same use cases.

The big payoff is **testability and swappability**. Because the core depends only on interfaces, you unit-test it with **in-memory adapters** (a fake in-memory repository) — **no database, no HTTP, no framework**, so tests are fast and deterministic. And you can **swap technologies** (Postgres → DynamoDB, REST → gRPC) by writing a new adapter, leaving the core untouched.

**The tradeoffs:** it adds **boilerplate** (an interface + at least one implementation for every external dependency) and **indirection** (you follow a port to find the real code), and it's easy to **over-abstract** — inventing ports for things that will only ever have one implementation, adding ceremony for no benefit.

**When it's worth it:** systems with **rich, long-lived domain logic** (complex business rules that deserve isolated, fast tests) or that genuinely need **multiple delivery channels** (the same logic exposed via HTTP *and* a queue consumer *and* a CLI). **When it's overkill:** **thin CRUD services** that are basically "validate → save → return" — there the ports and adapters just wrap the framework in extra layers that buy nothing, so use the framework's defaults and skip the ceremony.

**Key points:**
- Domain core is framework-agnostic.
- Drivers (HTTP, CLI) and driven (DB, broker) adapters.
- Enables fast tests with in-memory adapters.
- Easy to over-engineer; apply where domain warrants.

---

### 37. Clean architecture (Uncle Bob)

**Frequency:** Medium

**Question:** Explain Clean Architecture's layers and dependency rule. How does it compare to hexagonal, and where does it get heavy?

**Answer:** **Clean Architecture** (Robert C. Martin) arranges code in **concentric layers**, from most stable/abstract at the center to most volatile/concrete at the edge:

- **Entities** (innermost): **enterprise-wide business rules** — the core domain objects and invariants that would exist even without this application.
- **Use cases** (application rules): **orchestrate entities** to fulfill a specific application action ("place order" = load cart entity, validate, create order, request payment). They contain application-specific logic but no framework details.
- **Interface adapters:** **controllers, presenters, gateways** that **translate** between the use cases' shape and the outside world's shape (HTTP request → use-case input; entity → view model).
- **Frameworks & drivers** (outermost): the web framework, database, UI, external services — the replaceable details.

**The dependency rule** is the whole point: **source-code dependencies point only inward.** An outer layer may depend on an inner one, **never the reverse** — entities know nothing about use cases, use cases know nothing about controllers or the database. This is achieved via **Dependency Inversion**: inner layers define **interfaces**, and outer layers implement them, so the database "plugs into" the use case rather than the use case depending on the database.

**Versus hexagonal:** they share the same spirit (isolate domain logic, invert dependencies toward interfaces), but Clean Architecture is **more prescriptive about layering** — it names four concentric rings and a strict flow, where hexagonal just says "core + ports + adapters" without mandating internal layers. In practice hexagonal is often "Clean Architecture, less ceremony".

**Strengths:** business rules are **isolated and fast to test** (no framework needed), and **swapping or upgrading a framework/DB doesn't ripple inward** — you rewrite an outer adapter, not the domain. **Weaknesses:** the strict layering breeds **DTOs and mappers everywhere** — the same data gets re-represented and copied at each boundary (entity → use-case DTO → view model), which is real boilerplate, and **small services get bloated** by four layers of indirection around what's essentially CRUD.

**Apply it selectively:** keep the **dependency rule** (it's almost always good — depend on abstractions, point toward the domain), but **drop the strict four-layer template** when the domain is thin and the layers add noise rather than protecting real complexity.

**Key points:**
- Dependency rule: inward-only.
- Use cases orchestrate entities; adapters translate.
- DTOs and mappers proliferate—watch the cost.
- Best for complex, long-lived domain logic.

---

### 38. Strangler fig migration

**Frequency:** Medium

**Question:** Explain the strangler fig migration pattern. How do you support it and track progress?

**Answer:** The **strangler fig** pattern (named after the vine that grows around a tree and gradually replaces it) is a strategy for **incrementally replacing a legacy system** instead of doing a risky "big-bang rewrite". You place a **facade or proxy** — typically an **API gateway or reverse proxy** — in front of the legacy system, and it decides **per request** whether to route to the **old system** or to a **new service** that has taken over that slice of functionality. Over time you migrate one capability at a time; when every slice has moved, the legacy is fully "strangled" and you **delete it**.

**Why it wins:** you **ship value continuously** (each migrated slice goes live independently), you **dramatically reduce risk** (a big-bang rewrite is a single enormous cutover that either works or takes down the business; strangler is dozens of small, reversible cutovers), and you get **per-slice rollback** — if the new "checkout" service misbehaves, flip that route back to legacy without touching anything else.

**The hard parts:** **prolonged dual-running** — you operate both systems for months or years, paying double the maintenance and cognitive load, so it's essential to actually finish. **Data synchronization** — while both systems are live, they may share data, so you need the old and new stores to stay consistent (via **dual writes**, done carefully, or better, **CDC/change data capture** streaming changes one way). And **business-rule drift** — subtle behaviors encoded in the legacy get missed in the rewrite, so the new slice behaves *almost* like the old one but not quite.

**How to support it:** use **feature flags** to control routing and enable instant rollback; use **CDC or dual writes** to keep data consistent across the migration boundary; set **explicit sunset milestones** per module (with a hard date to decommission the legacy piece, so dual-running doesn't drag on forever); and track a **"% strangled" metric** — the fraction of traffic/functionality served by the new system — as the **leading indicator** of migration progress that keeps the effort visible and on schedule.

**Key points:**
- Proxy routes traffic incrementally.
- Avoids big-bang rewrite risk.
- Requires data sync strategy (dual write or CDC).
- Set explicit sunset milestones.

---

### 39. BFF pattern

**Frequency:** Medium

**Question:** Explain the Backend-for-Frontend (BFF) pattern, its benefits, and its tradeoffs. When can GraphQL replace it?

**Answer:** A **Backend-for-Frontend (BFF)** is a **dedicated API tier per client type** — one BFF for the web app, one for iOS, one for Android, one for partners. Each BFF sits between its client and the downstream microservices, and its job is to **aggregate** several service calls into one, **shape the payload** exactly to what that client needs, and handle **client-specific concerns** (auth flows, response formats, versioning tied to that client's release cadence).

The problem it solves is the **"one API to rule them all"** compromise. A single shared API can't be optimal for every client: mobile wants **small, aggregated payloads** (minimize bytes and round-trips over flaky cellular networks), while the web dashboard wants **rich, detailed** responses. A shared API ends up either over-fetching for mobile or under-serving the web, and every client change forces coordination on one contract. A BFF lets each client get a **tailored** backend.

**Ownership:** ideally the **same team that owns the client owns its BFF** — then UI needs and their backing API evolve together, without cross-team coordination. The BFF becomes part of the frontend team's stack.

**Benefits:** **less over-fetching** (return exactly the fields this client renders), **fewer round-trips** (one BFF call fans out to N services server-side, close to the data, instead of the mobile client making N slow calls), and **decoupled release cycles** (change the iOS BFF without touching the web BFF).

**Tradeoffs:** **more services to operate** (now you run and monitor several BFFs instead of one API), **logic duplication** — the same aggregation or auth logic gets copied across BFFs, so you must **extract shared libraries/services** to avoid drift — and **tighter coupling to client release cycles**, which is the point but also means the BFF is another thing the client team must ship and version.

**GraphQL as an alternative:** because GraphQL lets **each client project exactly the fields it needs** from a single schema, it can **replace the "shape the payload per client" job** of a BFF with one flexible endpoint — no per-client backend needed for field selection. It's a strong fit when the main reason for a BFF was over-fetching. But BFFs still win when clients need **genuinely different orchestration, auth, or protocol handling** (not just different field sets), which a shared GraphQL layer doesn't cleanly provide.

**Key points:**
- One backend per client experience.
- Reduces over-fetching and round trips.
- Owned by the client team.
- GraphQL is an alternative for some use cases.

---

### 40. Sidecar pattern

**Frequency:** Medium

**Question:** Explain the sidecar pattern, its common uses, and its costs. When does the need belong in the app instead?

**Answer:** A **sidecar** is a **helper process deployed alongside the main application** in the same unit — the same Kubernetes pod or host — where it **shares the app's lifecycle and network namespace** (they start/stop together and see the same `localhost`). The idea is to move **cross-cutting infrastructure concerns** out of the application and into a co-located companion, so the app can stay focused purely on **business logic**.

**Common uses:**
- **Service-mesh proxies** (Envoy, linkerd-proxy): the sidecar intercepts all the app's inbound/outbound traffic to add mTLS, retries, and telemetry — the canonical example.
- **Log shippers** (Fluent Bit): tail the app's logs and forward them to a central store.
- **Config reloaders:** watch for config changes and signal the app to reload.
- **Secret fetchers** (Vault agent): retrieve and refresh secrets, exposing them to the app locally.

**The big win** is that these concerns are **language-agnostic and independently upgradable**: you can roll out a new mTLS policy or log format by updating the sidecar across the fleet **without touching or redeploying any application code**, and the same sidecar works for a Java service and a Go service alike.

**The costs:** **per-pod resource overhead** — every pod now runs an extra container consuming CPU/memory, which multiplied across thousands of pods is significant; **deploy complexity** — two containers to version, configure, and keep in sync; and **debugging ambiguity** — when a request behaves oddly, you must determine whether the **app or the sidecar** handled it, since the proxy sits invisibly in the path.

**When it's worthwhile vs. belongs in the app:** use a sidecar when the helper is **reusable across many services** and owned by an **infrastructure/platform team** (mesh proxy, log shipping, secrets) — the overhead is justified by fleet-wide consistency and independent upgrades. **Avoid** it for a **one-off need specific to a single service** — there, a library or a bit of code **inside the app** is simpler than the operational cost of running and debugging a separate process.

**Key points:**
- Co-located helper process.
- Shares network/storage with main container.
- Powers service meshes, log shipping, secrets.
- Adds per-pod overhead—measure.

---

### 41. Service mesh (Istio/Linkerd)

**Frequency:** Medium

**Question:** What is a service mesh and how does it work? When should you adopt one versus library-based resilience?

**Answer:** A **service mesh** (Istio, Linkerd) is an **infrastructure layer that manages service-to-service communication** transparently, so that resilience, security, and observability are handled by the platform rather than coded into each service. It has two parts:

- **Data plane:** **sidecar proxies** (Envoy for Istio, a Rust micro-proxy for Linkerd) injected next to every service instance. **All traffic in and out of a service flows through its proxy**, which is where the actual work (mTLS, retries, routing) happens.
- **Control plane:** a central component that **configures all the proxies** — you declare policy ("canary 5% to v2", "mTLS everywhere", "retry 3× with 100ms timeout") once, and the control plane pushes it to every sidecar.

**What it gives you with zero application code changes:** **mTLS** (automatic mutual-TLS encryption and identity between all services), **traffic shifting** (percentage-based routing for canary/blue-green), **retries, timeouts, and circuit breaking** at the proxy, **fine-grained authorization** (service A may call B's `/read` but not `/admin`), and **rich, uniform telemetry** (every hop's latency, error rate, and traffic, since all calls pass through instrumented proxies). The appeal is that this works **identically across languages** — a Python and a Java service get the same mTLS and retry behavior without either implementing it.

**Tradeoffs:** **significant operational complexity** (the mesh is a distributed system you now must run, upgrade, and debug), **per-hop latency overhead** (~1–5ms added by each proxy), **per-pod resource cost** (a sidecar on every pod), and **another layer to debug** when something breaks ("is it the app, the proxy, or the control plane?").

**Istio vs. Linkerd:** **Istio** is **feature-rich but heavy and complex** (Envoy-based, many knobs, steep learning curve); **Linkerd** is **leaner, simpler, and Rust-based**, prioritizing low overhead and ease of operation over breadth of features.

**When to adopt:** the mesh pays off when you have **many services, multiple languages, and a dedicated platform team** to operate it — the fleet-wide consistency and free mTLS/telemetry justify the cost. **When to skip it:** with a **handful of services** or one language, **library-based resilience** (gRPC's built-in retries/deadlines, Resilience4j/Polly for circuit breaking, an OpenTelemetry SDK for tracing) gives you most of the benefits **without** running a whole mesh — don't take on that operational burden until service count and polyglot needs genuinely demand it.

**Key points:**
- Data plane (sidecars) + control plane.
- Provides mTLS, traffic policy, telemetry.
- Linkerd lighter; Istio more featureful.
- Justify with service count and team capacity.

---

### 42. Outbox pattern

**Frequency:** Medium

**Question:** Explain the outbox pattern and the dual-write problem it solves. What are its guarantees and tradeoffs?

**Answer:** **The dual-write problem:** a service often needs to do **two things atomically** — update its database *and* publish an event to a message broker (e.g., save an order **and** emit "OrderPlaced"). But the DB and the broker are **separate systems with no shared transaction**. If you write to the DB, then publish, and the publish fails (or the process crashes in between), you've committed the state change but **lost the event** — downstream systems never hear about the order. Publish-first has the mirror problem: the event fires but the DB write fails, so consumers react to something that didn't happen. You **cannot** make two independent systems atomic without a distributed transaction (2PC), which you're trying to avoid.

**The outbox pattern solves this** by turning the two writes into **one local transaction**. The service writes the **business change** and a row representing the **outgoing event** into an **"outbox" table in the same database**, in a **single ACID transaction**. Either both commit or neither does — no partial state. The event is now durably captured alongside the data.

A separate **relay** then delivers those events to the broker. It reads unsent outbox rows and publishes them, marking each **sent** afterward. The relay is either a **polling worker** (periodically `SELECT` unsent rows — simple, slight latency) or a **CDC stream** (Debezium tailing the DB's transaction log — lower latency, no polling load, and it captures the outbox insert the instant it commits).

**Guarantees:** you get **at-least-once publishing without a distributed transaction** — the event is never lost because it's committed atomically with the data, and the relay retries until the broker acks. The DB and broker become **eventually consistent** (the event lands shortly after the commit).

**Tradeoffs:** there's a **small commit-to-publish latency** (the relay's polling interval or CDC lag); the **outbox table grows** and needs **archival/cleanup** of sent rows; and because delivery is **at-least-once**, the relay can publish the same event twice (a crash after publishing but before marking sent), so **consumers must be idempotent** (dedupe on the event ID). The pattern **pairs naturally with event-driven and saga architectures**, where reliably emitting events from a service's own transaction is exactly what you need.

**Key points:**
- Atomic write of state + event to DB.
- Relay (polling or CDC) publishes downstream.
- At-least-once delivery; consumers must dedupe.
- Avoids unreliable dual-write to broker.

---

### 43. L4 vs L7 LBs

**Frequency:** Medium

**Question:** Compare L4 and L7 load balancers. Why do stacks often put L4 in front of L7?

**Answer:** The difference is **which layer of the network stack** the balancer operates at, which determines how much it understands about the traffic.

**L4 (transport-layer) load balancing** works at **TCP/UDP**. It routes based on **IP addresses and ports** and simply **forwards packets/connections** without looking inside them. Because it does **no payload inspection** — it doesn't parse HTTP, doesn't terminate TLS — it's **extremely fast, low-latency, and protocol-agnostic** (it balances anything: HTTP, a database protocol, a game's UDP stream). Examples: **AWS NLB, HAProxy in TCP mode**. The limitation is that it's "blind" — it can't route by URL path or header, can't retry a failed HTTP request, can't add HTTP-level observability.

**L7 (application-layer) load balancing** understands the **application protocol (HTTP, gRPC)**. Because it parses the request, it can do far more: **route by host/path/header** (`/api` to one fleet, `/images` to another), **terminate TLS** (decrypt at the LB), perform **retries**, apply **sticky cookies**, enforce **rate limiting**, and emit **rich HTTP-level telemetry** (per-route latency, status codes). Examples: **Envoy, NGINX, AWS ALB**. The cost is **higher latency and CPU** (it decrypts and parses every request) and it's **protocol-specific**.

**The tradeoff:** L4 is **cheaper and faster** but **inflexible**; L7 is **richer** but **heavier**, and it's where most modern API traffic lives because routing, TLS, and retries are essential there. You match the layer to the workload — **L4 for raw TCP/UDP** (databases, gaming, anything non-HTTP), **L7 for HTTP/gRPC APIs**.

**Why L4 fronts L7:** a common high-scale stack puts an **L4 balancer at the edge** to absorb raw connection volume and **DDoS-scale traffic** cheaply (L4 can handle enormous packet rates without the expense of parsing), then **distributes to a fleet of L7 balancers** that do the smart HTTP routing. The L4 tier gives you **massive, cheap horizontal scale and resilience** at the front door; the L7 tier gives you **application-aware routing** behind it. Relatedly, a **service mesh is essentially a distributed L7 load balancer** — every sidecar proxy is doing L7 balancing for its service's traffic.

**Key points:**
- L4: TCP/UDP, fastest, protocol-blind.
- L7: HTTP-aware, rich routing/policy.
- L7 terminates TLS and does retries.
- Often L4 fronts L7 for scale.

---

### 44. Sticky sessions

**Frequency:** Medium

**Question:** Explain sticky sessions — why they solve the stateless gap cheaply but cause problems, and what to use instead.

**Answer:** **Sticky sessions (session affinity)** make the load balancer **pin a given client to one specific backend** — via a **cookie** the LB sets, or by **hashing the client IP** — so that every request from that client lands on the **same instance**. The point is to make **in-memory session state work** without externalizing it: the instance holds the user's session in RAM, and stickiness guarantees the user keeps hitting that instance so the state is there.

It's a **cheap fix** — no external session store, no code changes — but it **undermines the very benefits of load balancing**:

- **Uneven load:** traffic is pinned by client, not by capacity, so some instances get hot while others idle. A few heavy users on one node can overload it while peers sit empty.
- **Broken rolling deploys:** when you kill an instance to deploy, **its sessions vanish** — pinned users get logged out or lose state — unless you carefully **drain** connections first, which complicates every rollout.
- **Hotspots and poor failover:** a popular node stays overloaded, and if it dies, all its users lose their session at once.

**Better alternatives** all boil down to **making the app stateless** so any instance can serve any request:
- **Externalize session state** to **Redis/Memcached** — the session lives in a shared store, instances are interchangeable, and you keep clean load balancing and rollouts.
- **Signed JWTs** — the session is a **self-contained signed token** the client carries; any instance can **verify** it locally without a lookup, so there's nothing to pin.
- **SPA + token auth** — the client holds the token and sends it with each call; the backend is fully stateless.

**Narrow legitimate uses remain.** **WebSocket (and other long-lived) connections are inherently sticky** — the TCP socket itself is bound to one server for the connection's life, so "stickiness" there is just physics, not a design smell. Some **legacy apps** genuinely can't externalize state. And note that **consistent-hash routing for cache affinity is different from stickiness** — it routes by *key* to maximize cache hit rate (and gracefully reshuffles on topology change), not by *client* to preserve per-session memory; conflating the two is a common mistake.

**Key points:**
- Pin client to backend via cookie/IP.
- Breaks even load and clean rollouts.
- Prefer externalized session or JWT.
- WebSockets are inherently sticky.

---

### 45. Auto-scaling triggers

**Frequency:** Medium

**Question:** Explain auto-scaling triggers and best practices. Why prefer work-based signals over CPU, and scale out fast but in slow?

**Answer:** Auto-scaling adjusts the number of instances to match load; the art is **choosing the right trigger** and **tuning the dynamics** so it's responsive without thrashing or overspending.

**Reactive scaling** responds to a **current metric** — CPU, memory, request rate, **queue depth**, or **p95 latency** — crossing a threshold. It's simple and needs no forecasting, but it **lags spikes by minutes**: by the time CPU climbs, the alarm fires, a new instance boots, and it warms up, the traffic surge may already have hurt users. **Predictive scaling** scales **ahead of demand** — on a **schedule** (spin up before the 9am peak) or via an **ML forecast** of the load curve. It handles **known patterns** gracefully but **misses surprises** (an unexpected viral spike isn't in the forecast). **Best practice is to combine them**: predictive/scheduled scaling to pre-provision for known peaks, plus reactive scaling as the safety net for the unexpected.

**Prefer work-based signals over CPU.** CPU is a **poor proxy for load on I/O-bound workloads** — a service waiting on a database or an external API can be **maxed out (all its request slots busy) at 20% CPU**, so CPU-based scaling never triggers even as latency explodes. **Work-based signals** measure actual demand: **RPS per replica** ("each instance handles ~200 req/s, so scale to keep it there") or **queue depth** ("messages are piling up, add consumers"). These directly reflect whether you have enough capacity, regardless of where the time goes.

**Scale out fast, scale in slow.** **Scale out aggressively** to absorb spikes — being a little over-provisioned briefly is cheap insurance against dropping traffic. **Scale in conservatively** with a **cooldown/stabilization window**, because tearing down instances the moment load dips causes **thrashing** (flapping) — a small dip removes an instance, load returns, you scramble to add it back, repeating. Asymmetric speeds keep you responsive without oscillating.

Finally, **cap the maximum** to **bound cost** — a bug or a feedback loop (or a retry storm) can otherwise drive runaway scaling and a huge bill — and **validate scaling with realistic ramp load tests** against your **SLOs**. Steady-state tests don't prove the system scales *fast enough*; you need to confirm that under a realistic surge, autoscaling keeps latency/error SLOs intact, not just that it eventually reaches enough capacity.

**Key points:**
- Prefer work-based signals (RPS, queue depth) over CPU.
- Scale out fast, scale in slow (cooldown).
- Combine reactive with scheduled predictive.
- Cap max to bound cost.

---

### 46. Leader election (Raft basics, etcd/ZK)

**Frequency:** Medium

**Question:** Explain leader election and the role of etcd/ZooKeeper. How does Raft work, and what should these systems not be used for?

**Answer:** Many distributed systems need **exactly one node in charge** of some responsibility — holding the authoritative config, granting a distributed lock, assigning a monotonic sequence, or coordinating who does what. Without a single leader you get split-brain (two nodes both think they're in charge, corrupting state). **Leader election** is the protocol for **safely agreeing on one leader** and **re-electing** when it fails.

**Raft** makes this understandable. Each node is a follower, candidate, or leader. **Election:** every follower waits a **randomized timeout**; if it hears no heartbeat from a leader, it becomes a **candidate** and requests votes. A node becomes leader once it wins a **majority of votes**. The randomized timeouts make it unlikely two candidates tie, so elections resolve quickly. **Log replication:** the leader accepts writes, appends them to its **log**, and replicates to followers; an entry is **committed once a majority acknowledges** it. This majority (**quorum**) requirement is why these systems need an **odd number of nodes** (3 or 5) and tolerate `(N-1)/2` failures.

**etcd and Consul use Raft; ZooKeeper uses ZAB** (Zab — a similar leader-based atomic-broadcast protocol with comparable guarantees). All provide a small, strongly-consistent, highly-available store for coordination.

**Read/write routing:** **writes go to the leader** (only it can commit). **Reads** can be served two ways — from **followers with bounded staleness** (fast, may be slightly behind) or **linearizably via the leader** (guaranteed latest, at the cost of a leader round-trip). You choose per read based on whether you can tolerate staleness.

**Failover** takes roughly **a few hundred milliseconds to a couple of seconds** — the time to detect the dead leader (missed heartbeats) and run an election — during which writes pause.

**What to use them for vs. not:** these are **coordination stores** — perfect for **service discovery, leader election, distributed locks, and configuration**. They are **not general-purpose databases**: every write goes through consensus (slow), the whole dataset must fit comfortably in memory, and throughput is low by DB standards. Storing application data or high-volume state in etcd/ZooKeeper is a classic misuse that will fall over — keep them for small, critical **coordination metadata** only.

**Key points:**
- Raft = leader + log replication + majority commit.
- etcd, Consul use Raft; ZK uses ZAB.
- Used for locks, discovery, config—not data.
- Failover in seconds; quorum needed.

---

### 47. Quorums & replication factors

**Frequency:** Medium

**Question:** Explain quorums and replication factors. Why does W + R > N give strong consistency, and how do you tune W/R per workload?

**Answer:** In a replicated store with **N replicas** per key, a **write** is acknowledged after **W** replicas confirm it, and a **read** queries **R** replicas and returns the newest value seen. Tuning W and R lets you trade consistency, latency, and durability.

**Why W + R > N gives strong consistency:** if the write set (W replicas) and the read set (R replicas) **must overlap**, then any read is guaranteed to touch **at least one replica that has the latest write** — so it can't miss it. Overlap is guaranteed exactly when `W + R > N` (pigeonhole: two subsets of an N-set totaling more than N must share an element). If `W + R ≤ N`, a read set can entirely miss the write set and return stale data.

**RF=3, W=2, R=2 is the Dynamo-classic sweet spot.** With N=3: `2 + 2 = 4 > 3`, so reads are **strongly consistent**, and the system **tolerates one replica failure** — you can still get 2 acks for both reads and writes with one node down. It balances consistency, availability, and latency, which is why it's the common default.

**Lowering W or R trades consistency for speed:**
- **W = 1** (fast writes): a write returns after **one** ack — low latency, but if that replica dies before the value propagates, the write is **lost**, and reads may not see it. High availability for writes, weaker durability/consistency.
- **R = 1** (fast reads): a read returns from **one** replica — low latency, but it may hit a stale replica and **miss recent writes**.

**Async repair keeps things converging.** **Hinted handoff** — when a target replica is temporarily down, another node stores a "hint" and delivers the write once it recovers — prevents lost writes during transient outages. **Read-repair** — when a read detects that replicas disagree, it **writes the newest value back** to the stale ones — heals inconsistency lazily on the read path. These let you run with lower W/R while still converging.

**Higher RF** improves **durability and read availability** (more copies survive failures) but costs **more storage** and **higher write latency** (more replicas to reach).

**Tuning per workload:** for **write-heavy** systems, **lower W** (even W=1) for fast ingestion and lean on **hinted handoff + read-repair** to reconcile; for **read-heavy** systems, **lower R** (R=1) for fast reads and push consistency onto the write side (higher W). The knobs are per-operation in systems like Cassandra, so you can even choose strong consistency for a critical read and eventual for a cheap one.

**Key points:**
- W + R > N for strong consistency.
- RF=3 with W=R=2 is a sweet spot.
- Hinted handoff fixes temporary outages.
- Higher RF = more durability, more cost.

---

### 48. Hot-key problem

**Frequency:** Medium

**Question:** Explain the hot-key problem and how to fix it for both reads and writes.

**Answer:** The **hot-key problem** is when a **single key** attracts **disproportionate traffic** — a celebrity's account, a trending product, a viral tweet, a Black-Friday flash-sale item. Because that key lives on **one shard** (and maps to **one cache entry**), all its load lands on a **single node**, which **saturates** while the rest of the cluster sits idle. Sharding spread your data evenly, but traffic is now skewed to one key, so even distribution of *data* doesn't give even distribution of *load*.

**Detection first:** you need **per-key metrics** or **sampled request tracing** to actually see which key is hot — otherwise you just observe "one node is on fire" without knowing why. Good systems continuously track top-N keys by request rate.

**Fixing hot reads:**
- **Request coalescing / singleflight:** when many concurrent requests ask for the same key and it's a cache miss, let **one** request fetch it and have the others **wait for that result** instead of all stampeding the backend.
- **Local cache with short TTL:** cache the hot value **in each app instance's memory** for a few seconds — even a 1-second TTL turns thousands of backend hits into one per instance per second.
- **Key splitting / fan-out:** replicate the hot key under **N suffixed variants** (`key#1`...`key#N`) spread across shards; reads pick one at random and you **aggregate**. This spreads one key's read load across N nodes.
- **Dedicated hot-key cache tier or read replicas** for that key specifically.

**Fixing hot writes** (harder, since writes must be durable and can't just be cached):
- **Batching and async aggregation:** don't write every increment synchronously to one row. The classic technique is a **sharded counter** — write each increment to **one of N replica rows** (chosen randomly), and **sum across all N on read**. This spreads write contention across N rows instead of serializing on one, at the cost of a fan-out read.

**The meta-lesson:** **plan for hot keys before you go viral, not after.** By the time a hot key is paging on-call, you're firefighting a saturated shard in production. Building in per-key monitoring, coalescing, and a counter-sharding strategy up front means the system degrades gracefully when something inevitably trends.

**Key points:**
- Detect via per-key metrics, sampled traces.
- Singleflight and local TTL caches absorb reads.
- Key fan-out (sharded counter) for writes.
- Plan before going viral, not after.

---

### 49. Backpressure & edge rate limiting

**Frequency:** Medium

**Question:** Explain backpressure and edge rate limiting, and distinguish them. Why do you need both?

**Answer:** Both protect a system from being overwhelmed, but they defend against **different threats** and operate at **different points**.

**Backpressure** is about **not accepting more work than you can handle** — propagating "slow down" from an overloaded component back to its producers. **Without it**, a slow consumer causes **queues to grow unbounded**: memory fills, **latency spikes** (requests wait in ever-longer queues), and eventually the process **OOM-crashes** — the classic cascading collapse under load. The fix is to put **bounds at every boundary**:
- **Bounded channels/queues** that **block or drop** when full, instead of growing forever. A full queue signals the producer to slow down (block) or sheds load (drop) rather than consuming infinite memory.
- **Max-in-flight semaphores** — cap the number of requests being processed concurrently; new work waits or is rejected past the limit.
- **Per-backend concurrency limits** — never send a downstream dependency more concurrent calls than it can absorb, so you don't push *it* into overload.

**Edge rate limiting** is about **capping how much each client/tenant may send**, applied at the **edge** (gateway/LB). It uses **token-bucket limits per client or tenant**, and when a client exceeds its quota it gets a **429 Too Many Requests** with a **`Retry-After`** header (and clients should back off with **jitter**). This protects against **abuse and noisy neighbors** — one misbehaving client can't consume all capacity and starve everyone else.

**Adaptive concurrency limiters** blur the line usefully: instead of a static concurrency cap, they **tune the limit dynamically to observed latency** (AIMD-style, like TCP congestion control — Netflix's concurrency-limits). As latency rises, they lower the allowed concurrency automatically, so the system self-regulates to its actual current capacity rather than a guessed constant.

**The key distinction:** **rate limiting protects you from abuse** (external, per-client quotas — "you're sending too much"), while **backpressure protects you from overload** (internal, capacity-based — "*I* can't keep up right now, regardless of who's asking"). They're complementary and you **combine both** — rate limiting at the edge to fairly ration access, backpressure throughout the internals so no single slow component can blow up memory and take the whole system down.

**Key points:**
- Bounded queues everywhere; never unbounded.
- Token bucket per tenant at edge.
- 429 + Retry-After + jitter.
- Adaptive concurrency limits beat static.

---

### 50. Bulkhead

**Frequency:** Medium

**Question:** Explain the bulkhead pattern, its forms at different levels, and its tradeoff.

**Answer:** The **bulkhead pattern** is named after a ship's watertight compartments: if one compartment floods, the bulkheads **contain the water** so the whole ship doesn't sink. Applied to software, you **partition resources** so that a failure or overload in one part **can't consume shared resources and take down everything else**.

The canonical failure it prevents: your service calls several dependencies through a **single shared thread pool (or connection pool)**. One dependency — say a **slow third-party API** — starts hanging. Its calls **pile up and hold all the threads** in the shared pool. Now requests to your *healthy* endpoints can't get a thread either, so the **entire service goes down** because of one slow dependency. That's exactly the cascade a bulkhead stops.

**Forms at different levels:**
- **Per-dependency pools (most common):** give **each downstream dependency its own thread pool or connection pool**. If the slow third-party API exhausts *its* pool, calls to it fail/queue, but your database calls and other endpoints keep their own threads and stay healthy. The failure is **contained to the one dependency**.
- **Service level:** **per-tenant isolation pools** (one noisy tenant can't starve others) or **per-priority queues** (critical traffic gets a reserved lane separate from best-effort work).
- **Infrastructure level:** **separate clusters per critical workload**, so a runaway batch job can't steal capacity from the customer-facing API.

**The tradeoff** is **lower maximum utilization**: because slices **can't share** their reserved capacity, you keep some idle headroom in each partition that a single shared pool could have used. You trade a bit of efficiency for **blast-radius reduction**. It's clearly worth it in any system with **diverse latency profiles** (fast and slow dependencies mixed) or a **critical-vs-best-effort** traffic split, where letting one slow/greedy component monopolize shared resources would be catastrophic.

Bulkheads **combine naturally with circuit breakers**: the **bulkhead contains** the damage (isolates the pool so the failure can't spread), while the **circuit breaker stops** hammering the failing dependency (fails fast once it's clearly down). Together they both **limit** the blast radius and **speed recovery**.

**Key points:**
- Per-dependency pool/thread isolation.
- Limits blast radius of one failure.
- Lower utilization, higher resilience.
- Combine with circuit breakers.

---

### 51. Polyglot persistence

**Frequency:** Medium

**Question:** Explain polyglot persistence — its benefits, its costs, and how to adopt it sensibly.

**Answer:** **Polyglot persistence** means using **different storage technologies for different needs within one system**, matching each workload to its best-fit store instead of forcing everything into one database. A typical setup: **Postgres** for transactional core data, **Redis** for caching and queues, **Elasticsearch** for full-text search, **S3** for blobs/media, **ClickHouse** (or another columnar store) for analytics, **Neo4j** for graph/relationship queries.

**The benefit** is straightforward: each workload gets the tool it's actually good at. Full-text search in Postgres `LIKE` queries is slow and weak; Elasticsearch does it natively. Analytical aggregations over billions of rows crush a row-store OLTP database but fly on a columnar store. Serving large files from a relational DB is wasteful; object storage is built for it. Right-tool-per-access-pattern gives you far better performance and developer ergonomics per workload.

**The costs are real and often underestimated:**
- **Operational burden multiplies per store** — each one needs its own **backups, upgrades, monitoring, security hardening, and capacity planning**. Five stores is five times the ops surface.
- **Data synchronization** — the same data now lives in multiple places (the order in Postgres, indexed in Elasticsearch, cached in Redis), and keeping them consistent requires **CDC or dual writes**, which add complexity and eventual-consistency lag.
- **Team expertise spreads thin** — nobody can be an expert in operating Postgres *and* Cassandra *and* Elasticsearch *and* ClickHouse; each store has its own failure modes and tuning.
- **Cross-store transactions are hard/impossible** — you can't do an ACID transaction spanning Postgres and Elasticsearch, so you fall back to sagas and eventual consistency.

**The sensible adoption path:** **start single-store** — a well-tuned Postgres handles transactions, JSON, full-text, and even basic analytics far longer than people expect. **Add a new store only when a clear, painful access pattern justifies it** (search is genuinely slow, analytics genuinely overloads the OLTP DB). And crucially, **treat every secondary store as a projection of the system of record** — designate one store as the **source of truth** and derive the others from it (via CDC/events), so you can always **rebuild** a search index or cache from the authoritative data. This keeps the mental model clean and makes inconsistencies recoverable rather than catastrophic. Resist the temptation to over-fragment early — each store you add is a permanent operational tax.

**Key points:**
- Right tool per access pattern.
- Each store adds ops burden.
- Sync via CDC/events from system of record.
- Resist over-fragmenting early.

---

### 52. CDC & downstream fan-out

**Frequency:** Medium

**Question:** Explain Change Data Capture (CDC) and downstream fan-out. When would you prefer CDC over the outbox pattern?

**Answer:** **Change Data Capture** taps the database's **replication log** — Postgres's **WAL**, MySQL's **binlog** — and **emits every row-level change** (insert/update/delete) as an event onto a stream. Tools like **Debezium** read the log and publish into **Kafka**, and downstream **consumers project those changes** into **search indexes, caches, data lakes, analytics warehouses, or other services** — all **without modifying application code**. The app just writes to its database as normal; CDC observes those writes from the log and fans them out.

**The pros:**
- **The application stays simple** — it doesn't need to publish events explicitly; it just does normal database writes. CDC is invisible to it.
- **Capture is reliable and misses nothing.** Because it reads the **committed log**, it captures every change even if the app **crashes right after committing** — there's no "wrote to DB but forgot to publish" gap, because the log *is* the record of what committed.
- **You get a replayable log** — reset a consumer's offset and rebuild its projection (e.g., re-index everything into a new Elasticsearch cluster) from history.

**The cons:**
- **Events expose the physical schema.** CDC emits **raw table/row changes**, so consumers are **coupled to your database's internal columns and layout** — not a clean domain contract. A column rename or table refactor can **break every downstream consumer**.
- **Ordering and exactly-once need care** — you must preserve per-key ordering (partition by primary key) and handle at-least-once delivery with idempotent consumers.
- **Schema changes are fragile** — DDL changes ripple to consumers who were reading physical columns.

**CDC vs. the outbox pattern:** they solve overlapping problems differently. The **outbox** pattern has the **application deliberately write semantic domain events** ("OrderShipped") into an outbox table within its transaction — the events are **clean, intentional business facts** decoupled from the physical schema. **CDC** captures **low-level physical row changes** with no app involvement.

**Choose CDC** when you want **low-level data synchronization/replication** — keeping a search index, cache, or data lake in sync with a table — and you don't want to touch the app. **Choose the outbox** when you want **semantic domain events** that other bounded contexts consume as a **stable contract**, insulated from your internal schema. A common hybrid: use CDC *on the outbox table* — the app writes clean domain events to the outbox, and CDC reliably ships them, giving you both semantic events and log-based reliability.

**Key points:**
- Reads WAL/binlog; no app changes.
- Reliable: misses nothing on app crash.
- Couples consumers to physical schema.
- Use CDC for data sync, outbox for domain events.

---

### 53. Broker choice: Kafka vs RabbitMQ vs SQS vs Pulsar

**Frequency:** Medium

**Question:** Compare Kafka, RabbitMQ, SQS, and Pulsar. How do you choose based on replay, routing, and ops appetite?

**Answer:** These four are all "messaging" but sit in different categories — **log** vs. **broker** vs. **managed queue** vs. **hybrid** — and the right choice depends on whether you need replay, complex routing, or minimal ops.

**Kafka** is a **durable, partitioned, append-only log**. Messages aren't deleted on consumption; they're **retained** and consumers track their own **offsets**, so you can **replay** history (reprocess a week of events, add a new consumer that reads from the beginning). It delivers **very high throughput** by partitioning topics across brokers. Best for **event streaming, CDC pipelines, analytics, and event sourcing** — anywhere the log-as-source-of-truth and replay matter. The cost: it's operationally heavy to self-run (though managed options exist), and it's overkill for a simple task queue.

**RabbitMQ** is a **classic message broker** with **rich routing** — exchanges, topic/direct/fanout bindings, headers — so you can express complex "route this message to these consumers based on these rules" logic. Messages are typically **deleted once acked** (queue semantics, not a retained log — no replay). Throughput is **lower than Kafka's**. Best for **task queues and workflows with complex routing** where per-message delivery and flexible topology matter more than raw throughput or replay.

**SQS** is a **fully managed** AWS queue: **effectively infinite scale, dead simple, no servers to run**. Standard SQS gives **at-least-once, no ordering**; the **FIFO variant** adds ordering and exactly-once but with **throughput caps**. Best for **cloud-native task queues** where you want zero operational burden and don't need replay or ordering. The tradeoff: fewer features (no rich routing, limited retention) and AWS lock-in.

**Pulsar** is a **log + queue hybrid**: it supports both streaming (like Kafka) and queueing semantics, with **built-in multi-tenancy, geo-replication, and tiered storage** (offload cold segments to object storage) — arguably a **better operational model than Kafka** for large multi-tenant deployments. The catch is a **smaller ecosystem and community** than Kafka's, so less tooling and fewer people who know it.

**Choosing:**
- Need **replay / event streaming / high throughput** → **Kafka** (or **Pulsar** if you also want multi-tenancy and geo-replication built in).
- Need **complex routing / classic task queue** → **RabbitMQ**.
- Want **managed simplicity, no ops, on AWS** → **SQS**.
- The decisive axes are **replay needs** (Kafka/Pulsar retain; Rabbit/SQS consume-and-delete), **routing complexity** (Rabbit wins), and **operational appetite** (SQS = none; Kafka/Pulsar = a real platform investment unless managed).

**Key points:**
- Kafka: log, replay, high throughput.
- Rabbit: routing-rich task queue.
- SQS: managed, simple, no ops.
- Pulsar: log + queue, multi-tenant.

---

### 54. Exactly-once semantics

**Frequency:** Medium

**Question:** Explain exactly-once semantics in messaging. Why is "effectively-once" the practical answer?

**Answer:** True **exactly-once delivery** — every message processed once and only once, end to end — is famously hard in distributed systems, because the network can always drop the acknowledgment *after* work was done, forcing a choice: retry (risk a duplicate → **at-least-once**) or don't (risk a loss → **at-most-once**). You can't have a message and its ack both be perfectly atomic across an unreliable network.

So **"exactly once" in practice usually means "effectively-once"**: **at-least-once delivery plus idempotent processing.** You accept that a message may be **delivered more than once** (broker redelivery, producer retry, network duplicate) and instead make the **processing** so that handling a duplicate has **no additional effect**. The observable result is "as if processed exactly once", achieved by making duplicates harmless rather than impossible.

**True end-to-end exactly-once** *is* achievable within specific systems, but only when the **producer, broker, and consumer all cooperate** in a transaction. **Kafka** offers it via an **idempotent producer** (dedupes producer retries with a sequence number) plus **transactions** that atomically commit both the output messages **and** the consumer offsets — so "read → process → write → commit offset" is one atomic unit. **Flink** achieves it with **two-phase-commit sinks** that align checkpoints with external commits. These work, but only inside their closed ecosystem and at a real throughput/complexity cost.

**The practical, portable approach is to make consumers idempotent**, which handles broker redeliveries, app retries, and network duplicates **uniformly**, regardless of broker:
- **Dedupe by event ID** — attach a unique ID to each event; store processed IDs and **reject replays** (keep them in a **TTL window** so the dedupe store doesn't grow unbounded, sized to cover the max possible redelivery delay).
- **Upsert by primary key** — write with "insert or update on conflict" so reprocessing the same event just re-writes the same row (naturally idempotent).
- **Idempotency keys in HTTP** — the same key returns the stored response instead of re-executing.

This is **cheaper and more robust** than chasing true exactly-once: it doesn't require a special broker or transactional sink, it works across heterogeneous systems, and it degrades gracefully. The mantra is: **assume duplicates will happen, and design processing so they don't matter.**

**Key points:**
- True exactly-once is rare and expensive.
- Effectively-once = at-least-once + idempotent.
- Dedupe by event ID or upsert by PK.
- Idempotency keys at every entry point.

---

### 55. Materialized views & read models

**Frequency:** Medium

**Question:** Explain materialized views and read models. Why must you design them to be rebuildable?

**Answer:** A **materialized view** (or **read model**) is a **precomputed, denormalized query result** stored so that reads are **fast and cheap** — instead of running an expensive join/aggregation on every request, you compute it once and serve the stored answer. It trades **write-time work and storage** for **read-time speed**, which is a great deal for read-heavy workloads.

The same idea shows up in two mechanics:
- **In SQL databases** (Postgres, Snowflake, Oracle), a **materialized view** is a first-class object refreshed **on a schedule** (`REFRESH MATERIALIZED VIEW` nightly) or **incrementally on commit** (some engines maintain it as base tables change). You write a query once and the engine caches its result.
- **In event-driven systems**, **projections** consume a stream of **events** and write **denormalized read models tailored per query** — one projection builds a "user dashboard" table, another builds a "search index", both fed by the same events. Different mechanics, identical goal: precompute the read shape.

**The tradeoffs:**
- **Write amplification** — every source change must update every view/projection that depends on it, so writes do more work and there are more things to keep in sync.
- **Eventual consistency vs. the source** — the view **lags** the underlying data by the refresh interval or projection latency, so reads can be slightly stale.
- **Rebuild cost** — recomputing a large materialized view or replaying millions of events to rebuild a projection is expensive and slow.

**Why rebuildability is non-negotiable:** projections and views **will** need rebuilding — a bug corrupts a projection, you change the read schema, you add a new field, or you spin up a new view over historical data. If you **can't rebuild**, a projection bug becomes **permanent data corruption** with no recovery. So you must design for it up front:
- **Make projections replayable** — reconstructable **from raw events or from the system-of-record database**, never holding state that exists *only* in the projection.
- **Version the projection schema** so you can evolve the read shape.
- **Retain events (or source data) long enough to rebuild** — if you prune the log too aggressively, you lose the ability to reconstruct.
- **Run the new projection alongside the old during cutover** — build v2 in parallel, verify it matches, then switch reads over, so a rebuild is a **zero-downtime, reversible** operation rather than a risky big-bang. Treating read models as **derived, disposable, and rebuildable** — never as the source of truth — is what keeps this pattern safe.

**Key points:**
- Precomputed, denormalized read shapes.
- Eventually consistent vs source.
- Rebuildable from events is non-negotiable.
- Version projections for schema changes.

---

### 56. Full-text search (Elasticsearch as projection)

**Frequency:** Medium

**Question:** How do you architect full-text search with a search engine as a projection? When does Postgres FTS suffice?

**Answer:** Dedicated **search engines** — **Elasticsearch, OpenSearch, Solr, Meilisearch** — provide capabilities a SQL `LIKE '%term%'` can't touch: an **inverted index** (map each term to the documents containing it, for fast lookups over millions of docs), **tokenization and analyzers** (stemming so "running" matches "run", lowercasing, stop-word removal, language-specific handling, synonyms), **relevance scoring** (BM25/TF-IDF ranking so the best matches come first), **faceting** (counts per category for filter UIs), and **aggregations**. `LIKE` scans row by row with none of this; it can't rank, stem, or facet.

**The key architectural principle: treat search as a projection, not a source of truth.** Your **system of record** is your primary database (Postgres, etc.); the search index is a **derived copy** kept updated via **events or CDC**. The reason is that **search engines are not designed for strong consistency or durability under all failure modes** — Elasticsearch can lose recently-indexed documents in certain failure scenarios and doesn't offer transactional guarantees. If it's a projection, that's fine: you can always **rebuild** it from the authoritative database. If it were your primary store, a failure would mean permanent data loss.

**What you must plan for:**
- **A reindex pipeline** — this is **mandatory**, not optional. Analyzer changes, schema changes, or mapping updates in Elasticsearch often **can't be applied in place**; you must **build a new index and swap an alias** to it. Design the rebuild path from day one, driven from the system of record.
- **Ingest backpressure** — a flood of updates (a bulk import, a CDC catch-up) can overwhelm indexing; you need bounded queues and throttling so indexing doesn't fall over or starve search queries.
- **Resource isolation** — **search and indexing compete** for the same cluster's CPU/IO. Heavy indexing can degrade query latency, so isolate them (separate nodes/tiers, rate-limit indexing) to protect the read path.

**When Postgres full-text search suffices:** for **small-to-medium scale**, Postgres's built-in **`tsvector`/`tsquery`** FTS (with GIN indexes) handles stemming, ranking, and phrase search **without adding a second datastore** — and you keep transactional consistency for free (the search index updates in the same transaction as the data). Adding **pgvector** even gives you semantic/vector search in the same database. **Reach for a dedicated engine** only when you outgrow Postgres FTS — very large corpora, demanding relevance tuning, heavy faceting/aggregations, or latency needs that a general-purpose DB can't meet. Avoid the operational cost of a separate search cluster until the requirements clearly justify it.

**Key points:**
- Inverted index, analyzers, faceting.
- Treat as projection, not source of truth.
- Reindex pipeline is mandatory.
- Postgres FTS fits small/medium scale.

---

### 57. Vector DBs & RAG

**Frequency:** Medium

**Question:** How do vector databases and a RAG pipeline work? When would you use pgvector versus a specialized vector DB?

**Answer:** **Vector databases** (Pinecone, Weaviate, Qdrant, Milvus, and **pgvector** inside Postgres) store **high-dimensional embeddings** — vectors, often 768–3072 dimensions, that capture the *semantic meaning* of text/images — and answer **approximate-nearest-neighbor (ANN)** queries: "find the vectors closest to this one". Exact nearest-neighbor over millions of high-dim vectors is too slow, so they use **ANN indexes** — **HNSW** (a navigable small-world graph; the common default, great recall/latency) or **IVF** (cluster the space, search only the nearest clusters) — trading a little recall for a huge speedup.

**RAG (Retrieval-Augmented Generation)** uses this to ground an LLM in your own data. **Offline:** **chunk** documents into passages, **embed** each chunk, and **store** the vectors. **At query time:** **embed the user's question**, retrieve the **top-K most similar chunks** via ANN, and **stuff them into the LLM's prompt** as context so it answers from *your* documents instead of hallucinating from its training data.

**The architecture concerns that make or break a RAG system:**
- **Chunking strategy** — chunk too big and retrieval is imprecise (irrelevant text dilutes the match); too small and you lose context. Overlap and semantic boundaries matter a lot.
- **Embedding model versioning** — the query and stored chunks **must use the same embedding model**; if you change models, you must **re-embed the entire corpus**, so version and plan migrations.
- **Hybrid search** — combine **vector similarity with keyword BM25**. Pure vectors miss exact terms (product codes, names, acronyms); BM25 catches them. Fusing both (e.g., reciprocal rank fusion) consistently **beats pure vector search**.
- **Reranking** — retrieve a larger candidate set, then **rerank with a cross-encoder** (which reads query+chunk together for a precise relevance score) to put the truly best chunks first before they hit the prompt.
- **Freshness** — **re-embed on document update** so the index reflects current content, or stale answers result.
- **Access-control filtering** — filter retrieval by the **user's permissions** so RAG never surfaces a chunk the user isn't allowed to see (a real data-leak risk if ignored).

**pgvector vs. specialized:** for **most applications**, **pgvector inside Postgres** is the pragmatic choice — it avoids adding a whole new datastore, keeps vectors **transactionally consistent** alongside your relational data (and its ACLs), and handles millions of vectors fine. **Reach for a specialized vector DB** (Pinecone/Qdrant/Milvus) only at **very high scale** (hundreds of millions/billions of vectors), when you need **very low latency** at that scale, or want advanced features (distributed sharding, metadata filtering at scale, managed ops). Start with pgvector; graduate to a dedicated store when you actually outgrow it.

**Key points:**
- ANN indexes: HNSW common.
- RAG = retrieve top-K + LLM prompt.
- Hybrid (vector + BM25) beats pure vector.
- pgvector fine for small/medium scale.

---

### 58. Multi-tenant isolation strategies

**Frequency:** Medium

**Question:** Describe the silo, pool, and bridge multi-tenant isolation strategies, and how a tiered model uses them. What keeps noisy neighbors in check?

**Answer:** Multi-tenancy means serving many customers from shared infrastructure; the isolation strategy decides **how much** they share, trading **cost against isolation and compliance**.

- **Silo (one database or cluster per tenant):** each tenant gets **dedicated infrastructure**. This is **maximum isolation** — no chance of one tenant's data leaking to another, blast radius contained per tenant, and it's the **easiest to satisfy compliance** (a regulated enterprise can point to *their own* database). The cost is **maximum expense and operational overhead** — you now run, back up, patch, and monitor N databases, and provisioning a new tenant is heavyweight.
- **Pool (one shared database, `tenant_id` on every row):** all tenants live in the **same tables**, distinguished by a **`tenant_id` column**. This is the **cheapest and most scalable** (one database, trivial to add a tenant — just a new ID), but the **hardest to isolate**: a single missing `WHERE tenant_id = ?` leaks one tenant's data to another (a catastrophic bug), and tenants share resources so there's **noisy-neighbor risk** (one heavy tenant degrades everyone).
- **Bridge (shared infrastructure, per-tenant schema):** a middle ground — one database instance, but a **separate schema (namespace) per tenant** (natural in Postgres). Better isolation than pool (schema-level separation, easier per-tenant backup/export) at lower cost than silo, though schema sprawl becomes unwieldy past hundreds of tenants.

**The tiered model** maps strategy to customer value: **pool** for **free/self-serve/SMB** tenants (cheap, high density, acceptable isolation with quotas), **bridge** for **paid** tenants (stronger separation), and **silo** for **enterprise** tenants (who often *contractually demand* dedicated infrastructure and compliance guarantees, and will pay for it). One system runs all three tiers, choosing per tenant based on size and compliance needs.

**Keeping noisy neighbors in check** (essential in pool/bridge where resources are shared):
- **`tenant_id` on every query, enforced structurally** — never rely on developers remembering it. Enforce via **middleware** that injects the filter, an ORM scope, or database **Row-Level Security (RLS)** so the database itself rejects cross-tenant access. This is the single most important safeguard.
- **Per-tenant rate limits and quotas** — cap each tenant's request rate, storage, and compute so one tenant can't monopolize shared capacity and starve the rest.
- **Per-tenant observability** — track metrics and cost **per tenant** so you can spot a noisy or abusive tenant, attribute cost, and enforce limits before they hurt neighbors.

**Key points:**
- Silo, pool, bridge: cost vs isolation.
- Tier model: pool for self-serve, silo for enterprise.
- tenant_id on every row + middleware enforcement.
- Per-tenant quotas prevent noisy neighbors.

---

### 59. Geo-distributed data

**Frequency:** Medium

**Question:** How would you architect geo-distributed data for low latency and data-residency compliance? Where would you start?

**Answer:** Geo-distribution serves two goals: **latency** (put data near users so a request in Tokyo doesn't cross the Pacific) and **data residency** (laws like GDPR require EU citizens' data to physically stay in the EU). The hard part is that **replicating data across regions reintroduces the consistency-vs-latency tradeoff** globally.

**The patterns, from simplest to hardest:**
- **Read-local / write-global:** data has a **home region** where all **writes** go, but **reads** are served from **local replicas** in every region. Reads are fast everywhere; the catch is a **write-latency penalty** — a user far from the home region pays a cross-region round-trip on every write. Simple and consistent, good when reads dominate and writes tolerate latency.
- **Home-region (per-user pinning):** each **user is pinned to one region** that owns their data (an EU user's data lives in the EU), with **replication to another region for disaster recovery**. Since a user mostly interacts with their own data, both their reads and writes are **local and fast**, and residency is satisfied by construction. This is the **common default** because most workloads partition cleanly by user/tenant.
- **Active-active multi-master:** every region **accepts writes** for the same data, and you reconcile concurrent writes with **CRDTs or conflict resolution**. This gives the **lowest latency and highest availability** (write anywhere) but is the **hardest** — you must handle write conflicts, and strong consistency across masters is either impossible or very expensive.

**How the databases differ:** **Spanner** uses **TrueTime** (GPS/atomic-clock-synchronized time with bounded uncertainty) to provide **globally strong, externally-consistent** transactions — at the cost of commit latency tied to the clock uncertainty window. **CockroachDB** offers similar global SQL via Raft ranges. **Cosmos DB** exposes **tunable consistency levels** (strong → bounded-staleness → session → eventual), letting you dial the tradeoff per workload. **Cassandra** gives eventually-consistent active-active with tunable quorums.

**The core tradeoffs** are always **consistency vs. write latency vs. complexity**, weighed against the locality/residency benefits. Global strong consistency (Spanner) costs write latency; active-active low latency costs consistency and complexity.

**Where to start:** begin with **home-region per user** — it delivers most of the latency win and satisfies residency for the common case, without the conflict-resolution nightmare of active-active. **Add complexity only as latency or compliance demands** push you toward global strong consistency (adopt Spanner/CockroachDB) or write-anywhere availability (adopt active-active with CRDTs). Don't reach for multi-master until a concrete requirement forces it.

**Key points:**
- Home-region per user is the common default.
- Spanner/CockroachDB for global SQL.
- Cassandra/Cosmos for tunable AP.
- Residency rules pin data to jurisdictions.

---

### 60. Tokens: opaque vs JWT; revocation

**Frequency:** Medium

**Question:** Compare opaque tokens and JWTs, especially around revocation. When would you choose each, and what's a hybrid?

**Answer:** Both are bearer tokens a client presents to prove authorization; they differ in **where the state lives** and therefore how validation and revocation work.

**Opaque tokens** are **random, meaningless strings** — the token itself carries no information. All the state (which user, what scopes, expiry) lives **server-side** at the issuer. To validate one, an API must **introspect** it — call the issuer (or a shared store) to look up "is this token valid, and what does it grant?". The upside: **instant revocation** — delete the server-side record and the token is immediately dead everywhere. The downside: **every API call requires a lookup/round-trip** to the issuer (or a cache), adding latency and coupling.

**JWTs** are **self-contained signed claims** — the token *is* the data (user ID, scopes, expiry) plus a signature. Any service can **validate it locally** by checking the signature with the issuer's public key — **no round-trip, fully stateless**. That's fast and scales beautifully. The downside is the mirror of opaque's strength: **you can't easily revoke a JWT before it expires** — since validation is local and offline, there's no central "is this still valid?" check, so a stolen or should-be-revoked JWT remains valid until its `exp`.

**Mitigations for JWT revocation:**
- **Short TTLs (5–15 min) + refresh tokens** — the access JWT expires quickly (bounding the damage window), while a longer-lived, revocable refresh token mints new ones. Revoke the refresh token and access dies within minutes.
- **A `jti` denylist** — for **forced/emergency revocation**, keep a small list of revoked token IDs (`jti`) that services check. This reintroduces a lookup, but only for the rare revoked case.
- **Key rotation** — rotating signing keys invalidates all tokens signed with the old key (a blunt, global revocation).
- **Audience scoping (`aud`)** — limit each token to specific services so a leaked token has a smaller blast radius.

**Choosing:** for **B2B/internal** APIs with modest traffic, **opaque + caching** is often simpler and safer (instant revocation, and the introspection cost is manageable/cacheable). For **high-traffic public APIs and microservice meshes**, **JWTs** win on performance — stateless local validation avoids a lookup on every one of millions of calls. **The hybrid** is common and pragmatic: use a **JWT for the fast path** (local validation on most requests) but **add a denylist/introspection check for sensitive operations** (money transfers, permission changes) — you get JWT speed for the bulk of traffic and instant-revocation safety exactly where it matters.

**Key points:**
- JWT: stateless, fast, hard to revoke.
- Opaque: stateful, easy revoke, requires lookup.
- Short TTL + refresh mitigates JWT revocation.
- Denylist for emergency revoke.

---

### 61. Secrets management at scale

**Frequency:** Medium

**Question:** How would you manage secrets at scale, and how do you avoid the bootstrap-secret problem?

**Answer:** The core rule: **secrets (DB passwords, API keys, private keys) must never be baked into code, container images, or env vars committed to a repo** — anything in git history or an image layer is effectively public to anyone with access, forever, and can't be truly rotated.

**Centralize in a secrets manager** — **HashiCorp Vault, AWS Secrets Manager, or GCP Secret Manager**. Applications **fetch secrets at startup or runtime** from the store rather than embedding them; the store handles **automatic rotation** (change a DB password and clients pick up the new one) and **audited access** (every secret read is logged — who got what, when — critical for compliance and breach investigation).

**The bootstrap problem — "turtles all the way down":** if an app needs a secret to *authenticate to the secrets manager*, where does *that* secret live? You can't store it in the manager (chicken-and-egg), and putting it in the image reintroduces the original problem. The solution is **workload identity**: the app proves *what it is* using an identity the platform vouches for, with **no pre-shared secret**:
- **Cloud IAM roles** — an AWS EC2 instance / EKS pod assumes an **IAM role**; AWS itself attests the identity and grants Secrets Manager access. No stored credential.
- **SPIFFE/SPIRE** — issues cryptographic **workload identities** attested from platform properties.
- **Vault auth methods** — Kubernetes, IAM, or cloud-native auth let a pod authenticate to Vault via its service-account token / instance identity.

This breaks the recursion: the *first* secret comes from the **platform's attestation**, not another stored secret.

**Delivery and hardening:**
- **Sidecar or CSI-driver injection** — a **Vault Agent sidecar** or the **Secrets Store CSI driver** fetches secrets and mounts them into the pod (as files or env), so the app doesn't even implement fetch logic and secrets never touch the image.
- **Short-lived dynamic secrets over static ones** — instead of one long-lived DB password shared forever, Vault can **generate per-session database credentials** that **auto-expire** (e.g., valid 1 hour). A leaked credential is useless minutes later, and rotation is automatic.
- **CI scanning for leaks** — run secret scanners (gitleaks, truffleHog) on **repos and images** in CI to catch accidentally committed keys *before* they merge/ship.

**Key points:**
- Central store, no secrets in code.
- Workload identity beats bootstrap secrets.
- Dynamic short-lived secrets where possible.
- CI scanning for accidental leaks.

---

### 62. Defense in depth

**Frequency:** Medium

**Question:** Explain defense in depth: what are the layers, and what makes them effective rather than merely present?

**Answer:** **Defense in depth** means never relying on any **single security control**, because any one control *will* eventually fail (a firewall is misconfigured, a credential leaks, a dependency has a CVE). Instead you stack **independent layers** so that when one is breached, the others still contain the attacker. Each layer **assumes the others may have already failed** (this is also the "assume breach" mindset).

**The layers and what belongs in each:**
- **Network** — **firewalls, network segmentation** (so a compromised web server can't reach the database subnet), and **mTLS** between services (encrypt and mutually authenticate internal traffic). Limits lateral movement.
- **Identity** — **MFA** (a stolen password alone isn't enough), **SSO** (central control), and **least privilege** (every identity gets the minimum access it needs). Contains what a compromised account can do.
- **Application** — **input validation, output encoding** (stop XSS), **parameterized queries** (stop SQL injection), and **dependency scanning** (catch vulnerable libraries). Stops the app from being the entry point.
- **Data** — **encryption at rest and in transit**, **tokenization** (replace sensitive values like card numbers with tokens), and **key management**. Even if data is exfiltrated, it's unreadable.
- **Monitoring** — **audit logs, anomaly detection, SIEM**. You can't respond to what you can't see; this layer detects a breach in progress and provides forensics.
- **Process** — **code review, threat modeling (STRIDE — Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege), and incident response**. The human/organizational layer that catches design-level flaws before code ships and coordinates the reaction when something goes wrong.

**What makes layers *effective* rather than just present** is the operational discipline around them: **patch promptly** (an unpatched layer is a hole), **scan continuously** (drift and new CVEs appear daily), **threat-model new features** with STRIDE (find weaknesses at design time, and **assume insider threat**, not just external attackers), and **rehearse incident response** (a runbook nobody has practiced fails under pressure). A control that exists on paper but is stale, unmonitored, or never tested provides false confidence — the layers must be **maintained and exercised**, not merely deployed.

**Key points:**
- Assume any single control fails.
- Layer network, identity, app, data, monitoring.
- Threat-model new features.
- Practice incident response; don't just write runbooks.

---

### 63. Rate limiting & abuse detection arch

**Frequency:** Medium

**Question:** Design the architecture for rate limiting and abuse detection. What does each tier enforce, and how does abuse detection fit in?

**Answer:** Rate limiting isn't one thing in one place — it's a **layered defense**, with each tier catching a different class of problem at the cheapest possible point.

**The tiers:**
- **Edge (CDN / WAF):** the outermost layer enforces **crude IP-based limits and absorbs DDoS/volumetric attacks** (Cloudflare, AWS Shield/WAF). It's blunt (IP granularity, no app context) but it stops floods **before they ever reach your infrastructure**, which is the only place that can economically absorb a massive attack.
- **API gateway:** enforces **per-API-key / per-user request rates** using a **token bucket** (allows bursts up to a bucket size, refills at a steady rate — good for bursty legit traffic) or **sliding window** (smoother, more accurate rate over a moving time window). This is where *identity-aware* limits live.
- **Per-service:** fine-grained limits close to the resource, backed by **Redis distributed counters** so the limit is enforced **across all instances** of a horizontally-scaled service (an in-process counter only works for a single instance and lets a user exceed limits by hitting different pods).

**Differentiated limits:** apply **distinct limits by user class** (anonymous < free < paid — paying customers get more headroom) and **by endpoint** (a cheap read gets a high limit; an expensive `login` or search endpoint gets a tight one, since those are the abuse targets).

**Abuse detection** goes beyond static limits. Feed **anomaly signals** — sudden **RPS spikes**, bursts of **login failures**, **credential-stuffing** patterns (many usernames, one IP; or one username, many IPs) — into a **behavioral system** that responds proportionally: issue a **challenge (CAPTCHA)**, require **step-up auth**, or **temporarily block**. This catches attackers who stay *under* the raw rate limit but behave abnormally.

**Always respond with `429 Too Many Requests` plus a `Retry-After` header** so well-behaved clients know exactly when to retry (instead of hammering), and **document your limits** so integrators design around them.

**Key points:**
- Layered: edge, gateway, service.
- Token bucket or sliding window on Redis.
- Tier limits by user class and endpoint.
- Pair with anomaly detection and challenges.

---

### 64. RBAC vs ABAC

**Frequency:** Medium

**Question:** Compare RBAC, ABAC, and ReBAC. When do you use each, and how do real systems blend them?

**Answer:** These are three models for answering "can this subject perform this action on this resource?" — they differ in **what they reason over**.

**RBAC (Role-Based Access Control):** assign **users to roles**, and **roles grant permissions** on resource *types* (`editor` can update articles, `admin` can delete users). It's **simple, intuitive, and easy to audit** — you can list who has a role and what it grants. Its weakness: it **explodes when permissions vary per individual resource**. If access depends on *which* document or tenant, you can't express that with types alone, so you spawn thousands of hyper-specific roles (`editor-of-doc-123`) — the "role explosion" antipattern.

**ABAC (Attribute-Based Access Control):** decisions are made by **evaluating policies over attributes** of the **subject, resource, action, and environment** — e.g., `subject.department == 'engineering' AND resource.owner == subject.id AND env.time in business_hours`. This is **fine-grained and flexible**, scaling to per-resource and contextual rules without role explosion. The cost: policies are **harder to reason about and audit** — "who can access X?" becomes a query over attribute combinations rather than a role list, and complex policies can have surprising interactions.

**ReBAC (Relationship-Based Access Control):** access is derived from a **graph of relationships** between subjects and resources (`user is member of group; group is editor of folder; folder contains doc → user can edit doc`). This is the **Zanzibar model** (Google's system, implemented by **SpiceDB**), and it handles **"shared with me" scenarios elegantly** — exactly the per-object, transitively-shared permissions (Google Docs sharing, GitHub repo access) that break RBAC.

**How real systems blend:** use **RBAC for coarse, organizational access** (is this user an admin, an editor, a viewer?) and layer **ABAC for resource scoping and context** (…*and* they own this record, *and* it's within their tenant). Adopt **ReBAC (SpiceDB/Zanzibar)** when the product is fundamentally about **sharing objects between users**. Modern policy engines — **OPA, AWS Cedar, SpiceDB** — support these models so you externalize authorization from application code.

**Key points:**
- RBAC: roles, simple, scales poorly with granularity.
- ABAC: policy on attributes, flexible, complex.
- ReBAC (Zanzibar) for relationship sharing.
- Most systems combine RBAC + ABAC.

---

### 65. Twelve-factor app

**Frequency:** Medium

**Question:** What is the twelve-factor app methodology, why is it the cloud-native baseline, and how have some factors evolved?

**Answer:** The **twelve-factor app** is a set of principles (from Heroku) for building apps that run cleanly on **containers and PaaS** — portable, disposable, and horizontally scalable. It's the **baseline** because following it is what makes an app "just work" under Kubernetes, autoscaling, and rolling deploys.

**The twelve factors:**
1. **Codebase** — one codebase per app in version control, many deploys from it.
2. **Dependencies** — declare them **explicitly** (lockfiles), never rely on system-wide packages.
3. **Config** — store config **in the environment** (env vars), not in code, so the same build runs in dev/staging/prod.
4. **Backing services** — treat databases, queues, caches as **attached resources** swappable by URL, so you can repoint from a local DB to a managed one with zero code change.
5. **Build, release, run** — keep these **strictly separate** stages (build an immutable artifact, combine with config into a release, run it) for reproducibility and easy rollback.
6. **Processes** — run the app as **stateless processes**; any state goes to a backing service, so any instance can handle any request and instances are disposable.
7. **Port binding** — the app **exports itself via a port**, self-contained, rather than depending on an injected web server.
8. **Concurrency** — **scale out via the process model** (run more identical processes), not by making one process bigger.
9. **Disposability** — **fast startup and graceful shutdown** so instances can be created/killed freely (critical for autoscaling and rolling deploys).
10. **Dev/prod parity** — keep environments **as similar as possible** to eliminate "works on my machine".
11. **Logs** — treat logs as **event streams written to stdout**; the platform handles routing/aggregation.
12. **Admin processes** — run one-off admin/management tasks (migrations, scripts) as **one-off processes** in the same environment.

**How some have evolved:** **config** is now env vars **plus a secrets manager** (raw env vars aren't safe for secrets — see Q61); **logs** are often **shipped via a sidecar/agent** (Fluent Bit) rather than the app knowing about the log pipeline. But the **core ideas — statelessness, explicit config/deps, disposability, build/release/run separation — still hold** and underpin every cloud-native platform.

**Key points:**
- Config in env, secrets via managers.
- Stateless processes, scale by count.
- Logs to stdout; collector handles routing.
- Build/release/run strictly separated.

---

### 66. Feature flags decoupling deploy from release

**Frequency:** Medium

**Question:** How do feature flags decouple deployment from release, what do they unlock, and what discipline do they demand? Why aren't they a config substitute?

**Answer:** **Deployment** (getting code onto production servers) and **release** (turning a feature on for users) are traditionally the same event — which makes every deploy risky. **Feature flags** split them: you **ship "dark" code** (deployed but wrapped in `if (flag.enabled)`) and **enable it later** for specific users or cohorts via a **runtime flag** you flip without redeploying (**LaunchDarkly, Unleash, Flagsmith**, or in-house). Deployment becomes **frequent and low-risk**; release becomes a **business decision** made independently.

**What this unlocks:**
- **Segment-based canary releases** — enable a feature for 1% → 10% → 100% of users, or just internal staff, and watch metrics before widening.
- **A/B testing** — serve variant A to one cohort, B to another, and measure.
- **Incident kill switches** — instantly **turn off a misbehaving feature** without a rollback deploy (seconds, not minutes).
- **Trunk-based development** — merge incomplete work behind a disabled flag, avoiding long-lived feature branches and painful merges.

**The costs and required discipline:**
- **Flag debt** — old flags that outlived their purpose accumulate; you **must clean them up** or they rot.
- **Conditional-logic explosion** — flags nested in flags create tangled branches.
- **Untestable combinations** — N flags mean 2^N states; you **can't test every combination**, so bugs hide in rare combos.
- The rule: **every flag gets an owner, an expiry date, and a removal task** so temporary flags actually get removed.

**Why not a config substitute:** flags are for **in-flight features and operational toggles** — things that are meant to be **temporary** and eventually resolve to "always on" (then get deleted) or "always off". **Permanent, structural settings** (timeouts, connection strings, tier limits) belong in **config management** — treating them as flags means permanent conditional branches and permanent flag debt.

**Key points:**
- Decouples deploy from release.
- Enables targeted canary, A/B, kill switch.
- Flag debt is real—expire and remove.
- Not a substitute for config management.

---

### 67. DB migrations in CD

**Frequency:** Medium

**Question:** How do you run database migrations safely under continuous delivery with rolling deploys? Walk through expand-migrate-contract.

**Answer:** During a **rolling deploy**, old and new app versions **run simultaneously** for a period (as pods are replaced one by one). That means every schema change **must be backward compatible** — the old code must keep working against the new schema, or the still-running old instances break. You **cannot** do a breaking change (rename/drop a column) in one step. The safe technique is **expand-migrate-contract**, spread across multiple deploys:

1. **Expand** — make **additive-only** changes: add the new column/table, add nullable columns, add new indexes. Both old and new code work because nothing they depend on was removed. (Renaming `name` → `full_name` becomes: *add* `full_name`.)
2. **Migrate** — deploy app code that **uses the new schema**. If both old and new columns must stay in sync during the transition, have the app **dual-write** (write to both `name` and `full_name`), and **backfill** existing rows to populate the new column. After this deploy completes, all instances use the new schema and the old column is no longer read.
3. **Contract** — in a **later** deploy, once you're certain **no running instance references the old column/table**, **remove** it. This is safe now because nothing depends on it.

**Operational essentials:**
- **Avoid blocking DDL on big tables** — a naive `ALTER TABLE` can take a lock that stalls all traffic for minutes on a large table. Use **online schema-change tools** — **pt-online-schema-change** or **gh-ost** (MySQL), or the database's **native online DDL** — which apply the change on a shadow copy without long locks.
- **Run migrations as a separate CI/CD step *before* the app deploy**, never **at app startup** — startup migrations cause race conditions when multiple instances boot at once and try to migrate concurrently.
- **Rehearse in staging with prod-shaped data** (realistic size and distribution) so you catch slow migrations and locking surprises **before** they hit production.

**Key points:**
- Expand-migrate-contract for backward compat.
- Use online schema change tools at scale.
- Run as separate CI step, not app startup.
- Rehearse with realistic data volumes.

---

### 68. Liveness/readiness/startup probes

**Frequency:** Medium

**Question:** Explain the three Kubernetes probes and how to configure each correctly. Why is probe misconfiguration a top cause of avoidable outages?

**Answer:** Kubernetes uses three probes to manage pod health, and they answer **different questions** with **different consequences** — conflating them is exactly what causes outages.

- **Liveness probe — "is the process alive / unstuck?"** Failure **restarts the pod**. Because the penalty is a restart, keep it **cheap and self-contained** (a simple process/heartbeat check). The critical rule: **never fail liveness on a downstream dependency** (DB, another service). If the DB has a hiccup and every pod's liveness checks the DB, Kubernetes will **restart every pod simultaneously** — turning a transient blip into a full **cascading outage**. Liveness answers "is *this process* broken and worth restarting?", nothing more.
- **Readiness probe — "can this pod serve traffic right now?"** Failure **removes the pod from the load balancer** (but does **not** restart it). This is where you **do check the dependencies that block requests** — DB connection established, cache warmed, downstreams reachable. A pod that can't serve is pulled from rotation and put back when it recovers, no restart needed.
- **Startup probe — "has this slow app finished booting?"** It **gates the liveness probe** for apps that take a long time to start (JVM warmup, large caches). Without it, liveness would fire during the slow boot and **kill the app before it ever comes up**, restart-looping forever. Once the startup probe passes, liveness takes over.

**Why misconfiguration causes outages:** the two classic failure modes are (1) **liveness that checks dependencies** → a downstream blip restarts every pod at once (cascading failure), and (2) **readiness/liveness too strict or too fast** → healthy pods get pulled or restart-looped under normal load spikes. Probes are deceptively simple but control the entire lifecycle, so getting the *semantics* wrong reliably manufactures self-inflicted outages.

**Key points:**
- Liveness: process alive; cheap; don't cascade.
- Readiness: ready to serve; checks deps.
- Startup: protects slow boots.
- Probe misconfig causes outages.

---

### 69. Graceful shutdown & connection draining

**Frequency:** Medium

**Question:** How do you implement graceful shutdown and connection draining? What should happen on SIGTERM, and what breaks without it?

**Answer:** When an instance is told to stop (a deploy, a scale-down, a node drain), it's usually **mid-flight** on real requests. **Graceful shutdown** ensures it finishes cleanly instead of dropping those requests. The sequence on **SIGTERM**:

1. **Mark the instance unready** — fail the readiness probe so the **load balancer stops routing new requests** to it. This must happen *first*; otherwise new work keeps arriving while you're trying to shut down.
2. **Drain in-flight requests** — let the requests already in progress **complete within a grace period**, rather than cutting them off.
3. **Close idle connections** — tear down keep-alive/pool connections that have no active request.
4. **Flush buffers** — push out any buffered **logs, metrics, and events** so you don't lose observability data or emitted events.
5. **Exit** cleanly.

**How Kubernetes drives this:** it sends **SIGTERM**, then waits up to **`terminationGracePeriodSeconds` (default 30s)** before sending **SIGKILL** (forceful, no cleanup). Tune this to your longest reasonable request. There's a subtle race: endpoint removal (LB update) and SIGTERM happen roughly together, so the LB may still send a few requests just as you begin shutting down. The fix is a **`preStop` hook** with a short **sleep (5–10s)** *before* the process starts shutting down — giving the LB/endpoint controller time to actually notice the pod is gone before it stops accepting traffic.

**Stateful services need more:** before exiting they must **reassign partitions/leadership** (hand off Kafka partitions, step down as Raft leader, transfer shard ownership) so the cluster isn't left without an owner for that data.

**Without graceful shutdown:** every deploy (which replaces every pod) **drops a small percentage of in-flight requests**, showing up as a **spike in error rate during every rollout** — a self-inflicted, recurring reliability problem that graceful shutdown eliminates entirely.

**Key points:**
- SIGTERM, drain, then exit before SIGKILL.
- Pre-stop hook gives LB time to react.
- Tune terminationGracePeriod per workload.
- Stateful services must reassign leadership.

---

### 70. DR: RTO vs RPO

**Frequency:** Medium

**Question:** Explain RTO and RPO and how they drive disaster-recovery architecture and cost. Why is untested DR effectively no DR?

**Answer:** **RTO (Recovery Time Objective)** is your **downtime budget** — how long the service can be *down* after a disaster before it's unacceptable. **RPO (Recovery Point Objective)** is your **data-loss budget** — how much recent data you can afford to *lose* (measured in time: "up to 15 minutes of writes"). These two numbers are the **primary levers** that dictate DR architecture and, directly, its cost — tighter targets require more expensive, always-warm infrastructure.

**How targets map to architectures (from expensive to cheap):**
- **RTO = minutes, RPO = zero** → **active-active multi-region with synchronous replication**. Every write is committed in multiple regions before acknowledging, so no data is lost and another region takes over almost instantly. Maximum cost (double infrastructure, cross-region write latency).
- **RTO = hours, RPO = 15 min** → **pilot-light or warm-standby with async replication**. A minimal (pilot-light) or scaled-down (warm) copy runs in the DR region, replicating asynchronously. On disaster you scale it up and repoint traffic — cheaper, but you accept some downtime (scale-up + failover) and a small window of unreplicated data.
- Looser still → **backup-and-restore** (cold): just restore from backups, cheapest but slowest.

**Tier per service:** don't apply one target org-wide — a **payment system** needs tight RTO/RPO (active-active), while an **analytics dashboard** tolerates hours down and a day of data loss (warm standby or backups). Matching tier to business criticality **avoids massively over-spending** on services that don't need it.

**Why untested DR = no DR:** a DR plan that has never been *executed* is a hypothesis, not a capability. Backups silently corrupt, restore procedures have missing steps, failover automation has stale config, and runbooks assume a person who left. Teams routinely discover — *during a real disaster* — that the backup won't restore or the failover doesn't fail over. You must **exercise the full path (backups, runbooks, failover automation) at least quarterly** with realistic data, or you don't actually have DR — you have the *belief* that you do, which is worse.

**Key points:**
- RTO = downtime budget; RPO = data loss budget.
- Drives replication and cost.
- Per-service tiering avoids over-spending.
- Untested DR = no DR.

---

### 71. Backup & restore

**Frequency:** Medium

**Question:** Describe a robust backup and restore strategy. Why are backups useless without tested restores?

**Answer:** The guiding principle: **you don't have backups, you have *restores*** — an untested backup is a guess. Everything below serves the goal of a **provably recoverable** system.

**The backup mix (for point-in-time recovery):**
- **Periodic full backups** (e.g., weekly) — a complete snapshot, the restore baseline.
- **Incrementals** between fulls — only what changed, keeping storage and backup windows small.
- **Continuously archived WAL/binlog** — the database's write-ahead log / binary log streamed continuously, enabling **point-in-time recovery**: restore the last full + incrementals, then **replay the log up to an exact moment** (e.g., the second *before* a bad `DELETE`), rather than only being able to restore to last night.

**Storage and protection:**
- **Off-site, in another region** — so a disaster that destroys the primary region doesn't also destroy its backups.
- **Encrypted** — backups contain all your data; protect them at least as well as production.
- **Immutable / write-once** with strict access controls — this is the key **ransomware defense**: attackers (or a compromised admin) **cannot delete or encrypt immutable backups**, so you can always recover.

**Testing and correctness:**
- **Test restores quarterly with realistic data sizes** — this validates **integrity** (the backup actually restores) *and* **measures RTO** (a full restore of 5 TB may take hours you didn't budget for). This is the step teams skip and regret.
- **Retention per regulatory needs** — e.g., financial records commonly require **7 years**; align retention with compliance, not convenience.
- **Application-consistent backups** for databases — quiesce/snapshot so the backup is a coherent transactional state, **not crash-consistent** (which can capture torn, mid-write data that restores into corruption).
- **Capture backup metadata** — record the **schema version and app version** with each backup, so you restore into a **compatible runtime** (restoring an old schema under new code, or vice versa, can fail or corrupt).

**Key points:**
- Full + incremental + continuous WAL.
- Off-site, encrypted, immutable.
- Test restore quarterly.
- App-consistent for databases.

---

### 72. On-call, runbooks, blameless postmortems

**Frequency:** Medium

**Question:** How would you run on-call, runbooks, and blameless postmortems effectively?

**Answer:** These three practices turn incidents from recurring firefights into a **learning system** that steadily improves reliability.

**On-call:** **rotate** the on-call duty across the team. Rotation **spreads operational knowledge** (everyone learns how the system fails, not just one hero) and **prevents burnout** (no single person is permanently tethered). Critically, **cap the number of pages per shift** — if on-call is paged constantly, **alert fatigue** sets in: engineers start ignoring or reflexively silencing alerts, and the *real* one gets missed. A noisy pager is a reliability risk, so tune alerts to be actionable and rare.

**Runbooks:** **every alert must have a runbook** — a concrete document listing **diagnostic steps** (what to check, which dashboards, which queries) and **remediation steps** (how to fix or mitigate). This lets even a less-experienced on-call responder act quickly at 3 a.m. without deep tribal knowledge. Better still, **automate** the runbook where possible (auto-remediation, one-click scripts) so the response is fast and consistent. An alert with no runbook is an alert nobody knows how to handle.

**Blameless postmortems:** after an incident, write a postmortem that is **blameless** — it focuses on **system and process failures, not individuals**. This is essential: if people fear blame, they hide information, and you lose the ability to learn. Document the **timeline**, the **root cause(s)**, **contributing factors**, and **action items with named owners and deadlines**. The single most-skipped step is **tracking action items to completion** — if they're never done, **the same incident recurs**. **Share postmortems widely** so the whole org learns from one team's incident.

**Incident command:** for serious incidents, **practice defined roles** — one **Incident Commander (IC)** who coordinates and makes decisions, a **communications lead** who keeps stakeholders informed, and a **scribe** who records the timeline. Practicing these roles (game days) means that during a real, high-pressure incident, coordination is **automatic** instead of chaotic.

**Key points:**
- Runbook per alert; automate when possible.
- Cap pages to avoid fatigue.
- Postmortems blameless and action-tracked.
- Practice incident command roles.

---

### 73. Multi-region active-active vs active-passive

**Frequency:** Medium

**Question:** Compare multi-region active-active and active-passive deployments, and the home-region hybrid. When would you pick each, and why must failover be tested?

**Answer:** Both run in multiple regions, but differ in **whether the second region serves live traffic**, which drives everything else.

**Active-passive:** **one region serves all traffic**; the other is a **warm standby** kept ready (replicated data, scaled-down or idle compute) purely for **failover**. It's **simpler**: since only one region takes writes, there are **no write conflicts** and consistency is straightforward. The downsides: **failover takes minutes** (detect the outage, promote the standby, repoint DNS/traffic), and the **passive region's capacity sits unused** — you pay for a second region that serves nothing until disaster strikes.

**Active-active:** **both regions serve traffic** simultaneously. This gives **lower latency** (users hit their nearest region) and **full capacity utilization** (you're paying for both regions *and using* both). The hard part is **writes**: with two regions accepting writes to the same data, concurrent conflicting writes must be **reconciled** — via **CRDTs** (conflict-free merge), **last-write-wins** (simple but can lose data), or **region affinity** (route each record's writes to one owning region). **Consistency is genuinely trickier**, and getting conflict resolution wrong causes silent data corruption.

**The hybrid — home-region routing — is usually the sweet spot:** each **user is pinned to a home region for writes** (so their writes never conflict — only one region owns them), while **reads are served locally in every region** from replicas. You get most of active-active's latency and utilization benefits **without** the general multi-master conflict problem, because writes are partitioned by user.

**When to pick each:** choose **active-active (or home-region hybrid)** for **truly global applications** where users worldwide need low latency and you want to use all your capacity. Choose **active-passive** for **compliance-driven DR** where failover is **infrequent**, the workload is regional, and simplicity/consistency matter more than utilization.

**Why test failover:** in active-passive especially, **failover is exercised only during a real disaster** — exactly when you can least afford it to fail. Untested failover automation routinely breaks (stale config, missing IAM permissions, DNS TTLs too long, the standby's data lagging). If you don't **regularly rehearse the failover**, you'll discover it's broken at the worst possible moment.

**Key points:**
- Active-passive: simple, warm capacity wasted.
- Active-active: full utilization, write conflicts.
- Home-region routing is the common sweet spot.
- Failover automation must be tested.

---

### 74. Pastebin

**Frequency:** Medium

**Question:** Design a Pastebin (arbitrary text up to ~10MB, short URLs, expiry, visibility, ~10K writes/day, 10x reads). Why offload content to S3 rather than the DB?

**Answer:** **Requirements:** store arbitrary text up to **~10MB**, generate a **short URL**, support **expiry** and **private/unlisted/public** visibility, **syntax highlighting**, and roughly **10K writes/day with ~10x reads** (modest scale, read-heavy).

**Components:**
- **API + web tier** — `POST /paste` (create) and `GET /:id` (fetch). Generates the short ID (base62 of a counter, or a random 7–8 char slug).
- **Object store (S3) for paste content** — S3 is cheap, highly durable (11 nines), and supports **range reads** so a 10MB paste can be streamed/partially fetched without loading it all into app memory.
- **Metadata DB (Postgres)** — a small row per paste: `{id, owner, visibility, expiry, mime/language, size, s3_key, created_at}`.
- **Search index (Elasticsearch)** — only for **public** pastes, so they're discoverable; private/unlisted are never indexed.

**Data model — the key split:** a **small metadata row** in Postgres (indexed, queryable, cheap) points via `s3_key` to the **large content blob in S3**. The DB stores *facts about* the paste; S3 stores the *bytes*.

**Scaling:** put a **CDN in front of public pastes** — since content is immutable per ID, public reads cache beautifully at the edge and never touch your origin. Add a **KV cache (Redis)** for hot pastes' metadata. Given the read-heavy profile, caching absorbs almost all traffic.

**Expiry:** the cleanest approach is an **S3 lifecycle policy** — tag objects with their expiry and let S3 delete them automatically — or a **scheduled cleanup job** that sweeps expired rows and their objects. Do syntax highlighting **client-side** to save server CPU.

**Why S3 instead of inline in the DB:** storing 10MB blobs **inline in Postgres** works for a demo but **degrades badly at scale** — it bloats table size, slows backups/vacuum, wastes buffer cache on blobs, and makes replication heavy. **Offloading content to S3 from day one** keeps the DB small and fast (metadata only), gives you cheap durable storage with CDN/range-read support, and cleanly separates the queryable metadata from the bulk bytes.

**Key points:**
- Metadata in SQL, content in S3.
- CDN for public reads.
- Lifecycle policy handles expiry.
- Syntax highlight client-side to save server.

---

### 75. Instagram

**Frequency:** Medium

**Question:** Design Instagram (photo upload, followee feed, explore, stories, ~2B users). Cover components, feed fan-out, and key tradeoffs.

**Answer:** **Requirements:** **photo upload**, a **feed of followees' posts**, **explore/discovery**, **stories** (ephemeral), at **~2B users** — massively read-heavy and photo-dominated.

**Components:**
- **Upload service** — on upload, **resize/transcode to multiple sizes** (thumbnail, feed, full) and store in **S3 behind a CDN**. Pre-generating sizes means clients fetch exactly what they need without on-the-fly work.
- **Metadata DB (Cassandra, sharded by `user_id`)** — post metadata is **write-heavy and huge**, so a wide-column store that scales writes horizontally fits better than a single SQL box. Post row: `{id, user_id, media_urls, caption, created_at}`.
- **Feed service** — a **hybrid fan-out** exactly like Twitter's timeline (Q27): **fan-out-on-write** (push each post into followers' feeds) for normal users, but **fan-out-on-read** (pull at query time) for **celebrities** with millions of followers, to avoid writing one post into 100M feeds.
- **Search/Explore** — **Elasticsearch** for search plus **ML ranking** for the explore grid (personalized recommendations).
- **Stories** — a separate store with a **24-hour TTL** so stories auto-expire.

**Scaling:** the **CDN absorbs photo reads** — the dominant cost by far — so origin/S3 is rarely hit. **Pre-generate thumbnail sizes** and **geo-distribute storage** so users fetch photos from a nearby region.

**Tradeoffs:**
- **ML-ranked feed displaces chronological** — better engagement, but you give up the simple "newest first" guarantee and add ranking infrastructure.
- **Sharded counters for likes** — a viral post's like count is a **hot key** that would overwhelm a single row; **shard the counter** across N sub-counters and sum them, accepting **eventual consistency** on the displayed count in exchange for write scalability.

**Key points:**
- Image transcoding pipeline + CDN.
- Cassandra for write-heavy post metadata.
- Hybrid timeline fan-out.
- Sharded counters for likes.

---

### 76. Notification system

**Frequency:** Medium

**Question:** Design a notification system (email/SMS/push/in-app, templating, user preferences, throttling, scheduling, billions/day). Cover components and dedup.

**Answer:** **Requirements:** send **email, SMS, push, and in-app** notifications; support **templating**, **per-user preferences**, **throttling**, and **scheduling**, at **billions/day**. The system is a **fan-out router** to many external providers.

**Components:**
- **API** — `POST /notify` with `{recipient, template, data}`. Callers describe *what* to send, not *how*.
- **Template service** — renders the message from a template + data (localized, per-channel formatting).
- **Preference service** — stores each user's **channel opt-in per notification type** (e.g., "marketing: email only; security alerts: all channels"). This **gates delivery** — respect opt-outs or you violate user trust and anti-spam law.
- **Routing service** — decides **which channels** to use based on preferences and the notification's class/urgency.
- **Provider gateways** — adapters to **SendGrid** (email), **Twilio** (SMS), **APNs/FCM** (push), and an in-house WebSocket service (in-app). Each abstracts one provider's API.
- **Per-channel queues (Kafka/SQS)** — decouple ingestion from delivery and provide **backpressure**: if a provider slows down, messages buffer in the queue instead of overwhelming it or being lost.
- **Dedup store (Redis)** — holds a **notification key with a TTL** to prevent duplicate sends.
- **Tracking/analytics** — records deliveries, opens, clicks, bounces.

**Scaling:** **shard queues per provider**, **retry with exponential backoff** on provider failures, and **rate-limit to each provider's quota** (e.g., SendGrid's per-second cap) so you don't get throttled or blocked.

**Tradeoffs:**
- **Idempotency keys prevent duplicate sends** — a retry or a redelivered queue message must not send the same notification twice; the dedup store keyed on an idempotency key makes delivery **at-least-once but effectively once-seen**.
- **Per-user digests to avoid notification fatigue** — batch many low-priority notifications into a single periodic digest rather than blasting the user, which reduces opt-outs and improves engagement.

**Key points:**
- Channel gateways behind queues.
- Preferences engine gates delivery.
- Idempotency keys for dedup.
- Per-user digest avoids fatigue.

---

### 77. YouTube

**Frequency:** Medium

**Question:** Design YouTube (upload, transcode to multiple resolutions/codecs, global adaptive-bitrate streaming, comments, recommendations). Cover components and key tradeoffs.

**Answer:** **Requirements:** **upload** video, **transcode** to multiple resolutions/codecs, **stream globally with adaptive bitrate (HLS/DASH)**, **comments**, **recommendations**, at **billions of hours watched**. The system is dominated by **video storage and delivery cost**.

**Components:**
- **Upload service** — **resumable, chunked** uploads, so a dropped connection on a large file resumes instead of restarting.
- **Transcoding pipeline** — **queue-driven parallel workers** produce a **resolution/bitrate ladder** (240p→4K) across codecs (**AV1/VP9/H.264**) so every device/network gets a compatible, efficiently-sized stream. Video is split into chunks and transcoded in parallel for speed.
- **Storage** — an **object store** with a **cold tier**: popular content stays hot; the **long tail** (most videos, rarely watched) moves to cheaper cold storage.
- **CDN** — a **multi-tier CDN with edge caching** delivers the actual video segments; this is where the bandwidth (and cost) lives.
- **Metadata DB (Vitess/Spanner)** — scalable store for video metadata, view counts, etc.
- **Recommendation service** — ML over watch history to drive the next-video and home feed.
- **Comments** — a **separate write-heavy store** (comments have very different access patterns from video).

**Adaptive bitrate:** the client fetches an **HLS/DASH manifest** listing the ladder and **switches bitrate dynamically** based on measured bandwidth — smooth playback that degrades gracefully instead of buffering.

**Scaling:** **pre-position popular content near the edge** (push trending videos to edge caches proactively); serve the **long tail** from fewer regional caches or origin, since caching every rarely-watched video everywhere is uneconomical.

**Tradeoffs:**
- **Storage cost vs. CDN cost** — storing more encodes/tiers costs storage but improves cache/delivery efficiency; you balance the two.
- **Transcoding cost vs. encode quality** — expensive **per-shot / per-title encoding** (optimizing bitrate scene-by-scene) is worth it **only for popular content** that will be viewed millions of times to amortize the cost; the long tail gets cheaper generic encodes.

**Key points:**
- Resumable upload + queue-driven transcoding.
- Adaptive bitrate (HLS/DASH).
- Multi-tier CDN; hot/cold storage tiers.
- Per-shot encoding for popular videos.

---

### 78. Netflix

**Frequency:** Medium

**Question:** Design Netflix's streaming architecture (pre-encoded catalog, millions of concurrent viewers, personalization, global rights). What makes Open Connect and per-title encoding key?

**Answer:** **Requirements:** stream **pre-encoded** movies/shows to **millions of concurrent viewers**, with **personalization**, **multi-CDN** delivery, and **global rights management**. Unlike YouTube, content is a **fixed, curated catalog** encoded *ahead of time* — which enables much heavier per-title optimization.

**Components:**
- **Catalog service** — titles, metadata, availability per region (rights differ by country).
- **DRM/license service** — issues a **decryption license per playback session** so only authorized, paying users can decode the stream.
- **Encoding pipeline** — does **per-title and per-shot optimized encodes** across many **codec × resolution** combinations. Because the catalog is finite and each title is watched enormously, Netflix invests heavily up front to squeeze every title's bitrate optimally.
- **Open Connect** — Netflix's **own CDN appliances physically embedded inside ISP networks**. Instead of renting third-party CDN capacity, Netflix ships hardware into ISPs, so the stream travels the shortest possible path to the viewer.
- **Playback service** — serves **manifests**, drives **adaptive bitrate (ABR)**, and tracks session state.
- **Recommendation** — offline + online ML with a heavy **A/B testing platform** (Netflix A/B-tests almost everything, including artwork).
- **Billing.**

**Scaling via Open Connect:** Netflix **pre-positions the catalog at ISP-embedded appliances based on predicted demand** — during off-peak hours it pushes the shows an ISP's users are likely to watch onto the local appliance, so peak-time streaming is served **from inside the ISP**, minimizing transit and buffering. Clients probe and pick the best edge. Resilience is validated with **chaos engineering** (Chaos Monkey).

**Key tradeoffs:**
- **Huge upfront encoding cost, amortized over views** — **per-title/per-shot encoding** is expensive to compute but pays off because each title is streamed millions of times; the bandwidth savings from optimal bitrate dwarf the one-time encode cost. (Contrast YouTube, where most content is long-tail and can't justify this.)
- **ISP-embedded CDN saves transit cost and improves quality** but adds **physical logistics** (shipping, installing, maintaining hardware in thousands of ISP locations) — a tradeoff only worth it at Netflix's scale.

**Key points:**
- Open Connect CDN inside ISPs.
- Per-title/per-shot encoding ladder.
- Pre-position catalog by predicted demand.
- DRM + license service per session.

---

### 79. DoorDash / food delivery

**Frequency:** Medium

**Question:** Design a DoorDash-style food-delivery system (customers, restaurants, dashers — a three-sided marketplace with cook+drive ETAs). Cover components and the batching tradeoff.

**Answer:** **Requirements:** customers **order from restaurants**, the system **dispatches a dasher** for **pickup and delivery**, forming a **three-sided marketplace** (customer, restaurant, dasher). ETAs are hard because they span **two phases — cooking + driving** — that must be coordinated so the dasher arrives right as food is ready.

**Components:**
- **Catalog service** — restaurant **menus and real-time availability** (items sell out; restaurants go offline).
- **Order service — a state machine:** `placed → confirmed → cooking → ready → picked up → delivered`. Every transition drives notifications and dispatch decisions.
- **Dispatch service** — like Uber's matching (Q29) but harder: it optimizes the **pickup window** (arrive when food is ready, not before — idle dasher — or after — cold food), factoring **cook time + driving time**, and **batches multiple orders per dasher** when they're going the same way.
- **Restaurant integration** — via **POS APIs** where available, with a **tablet fallback** (many restaurants have no API, so DoorDash gives them a tablet). This is the **messiest part** — integration quality varies wildly.
- **Payment** and **notifications** (all three sides get status updates).
- **ETA prediction (ML)** — predicts **cook time and drive time separately** and combines them; cook time especially is noisy and restaurant-specific.

**Scaling:** **geo-shard by metro** (delivery is inherently local — a dasher in Chicago never serves Miami), use **Kafka** for events between services, and run **real-time ML** for ETAs that update as conditions change.

**Key tradeoff — batching vs. cold food:** batching multiple orders onto one dasher **boosts dasher earnings and platform efficiency**, but each extra stop **delays the other orders**, risking **cold food** and unhappy customers. The dispatch algorithm must balance efficiency against food quality — the central tension of the business.

**Key points:**
- Order state machine across three sides.
- Dispatch optimizes cook + drive + batching.
- ML for ETA across two phases.
- Restaurant integration is the messy part.

---

### 80. Google Maps

**Frequency:** Medium

**Question:** Design Google Maps (tiles, search/POI, routing with real-time traffic, navigation). Cover components and the freshness-vs-precompute tradeoff.

**Answer:** **Requirements:** **render map tiles**, **search/POI** lookup, **routing** for driving/transit/walking **with traffic**, turn-by-turn **navigation**, at **billions of users**. The workload splits into cheap cacheable reads (tiles) and expensive computation (routing).

**Components:**
- **Tile service** — serves **pre-rendered raster and vector tiles** at multiple **zoom levels** via **CDN**. Tiles are static per area/zoom, so they achieve **90%+ CDN cache hit** — the bulk of traffic never touches origin.
- **Search / geocoding** — Elasticsearch-style index with **address normalization** ("1600 Amphitheatre Pkwy" → coordinates) and **ML ranking** of results.
- **Routing service** — the hard part. Model the road network as a **graph of weighted segments** (weight = travel time). Naive Dijkstra over a continental graph is far too slow, so use **hierarchical algorithms — Contraction Hierarchies (CH) or Customizable Route Planning (CRP)** — that **precompute shortcuts** so a query touches a tiny fraction of the graph and returns in milliseconds. **Real-time traffic adjusts edge weights** so routes reflect current conditions.
- **Traffic ingest** — **anonymized GPS pings** from millions of devices flow into a **stream processor** that estimates current speed per segment — crowdsourced traffic.
- **POI database** — places, hours, reviews.
- **Imagery pipeline** — satellite/Street View processing.

**Scaling:** **tiles are CDN-friendly** and offload almost entirely to the edge; **routing is CPU-heavy** and **partitioned by region** so each routing cluster handles a geographic area.

**The freshness-vs-precompute tradeoff:** the fastest routing comes from **heavy precomputation** (CH shortcuts), but precomputed structures **don't reflect live traffic** — if you fully precompute routes, they go stale. Conversely, **recomputing everything in real time** with fresh traffic is **too slow** at query time without the hierarchical shortcuts. The resolution is **CRP-style**: precompute the *structure* once, then **cheaply re-apply live traffic weights** on top — getting both speed *and* freshness.

**Key points:**
- Pre-rendered tiles + CDN.
- Contraction Hierarchies for fast routing.
- Real-time traffic via crowdsourced GPS.
- Region-partitioned routing services.

---

### 81. Distributed cache (Redis-like)

**Frequency:** Medium

**Question:** Design a Redis-like distributed cache (low-latency KV, horizontal scale, replication, eviction, billions of ops/sec). Cover sharding, HA, and key tradeoffs.

**Answer:** **Requirements:** a **low-latency in-memory KV store**, **horizontally scalable**, with optional **replication**, **eviction policies**, at **billions of ops/sec**. In-memory means every design choice bends toward keeping operations O(1) and network hops minimal.

**Components:**
- **Sharding** — partition the keyspace across nodes via **consistent hashing** or **fixed partitioned slots**. **Redis Cluster uses 16384 hash slots**: each key maps (via CRC16 mod 16384) to a slot, and slots are assigned to nodes. Fixed slots make **rebalancing** clean — you move whole slots between nodes rather than rehashing everything.
- **Replication** — each shard has a **primary + one or more replicas**, replicated **async** (fast, small data-loss window) or **semi-sync** (safer, slower). Replicas serve reads and stand ready for promotion.
- **Client** — **slot-aware** (knows which node owns each slot, routing directly) and **pipelining** (batches many commands per round-trip — essential for throughput, since latency is dominated by network round-trips).
- **Eviction** — when memory fills, evict by policy: **LRU** (least recently used), **LFU** (least frequently used), **allkeys-random**, or **TTL-based** expiry. Pick per workload (LFU for skewed hot sets, LRU for recency-driven).

**Failure handling:** nodes run a **gossip protocol** to detect dead peers; when a primary dies, a **replica is automatically promoted**. For durability, persist via **AOF** (append-only log of writes) or **RDB** (point-in-time snapshots).

**Online scaling:** **add shards live** — slots migrate to the new node, and clients that hit the old node get a **MOVED/ASK redirect** pointing to the new owner, so no downtime.

**Tradeoffs:** **async replication can lose the last few writes on failover** (accept it for a cache; use semi-sync if you can't); **large keys create hot shards** (a giant value or a hot key overwhelms one node — split the key or shard client-side); and **pipelining + connection pooling are mandatory** to actually reach billions of ops/sec.

**Key points:**
- Consistent hashing or fixed slot count.
- Async replication; small data loss possible.
- Gossip + auto-promotion for HA.
- Eviction policy per workload.

---

### 82. Metrics/monitoring (Prometheus-like)

**Frequency:** Medium

**Question:** Design a Prometheus-like metrics/monitoring system (scrape thousands of services, label queries, alerting, tiered retention). Cover components and the pull-vs-push tradeoff.

**Answer:** **Requirements:** **collect metrics** from thousands of services, **query by labels**, **alert on conditions**, and **retain high-resolution short-term + low-resolution long-term** data. The defining challenge is **cardinality** (the number of unique label combinations), which dominates cost.

**Components:**
- **Scrapers** — Prometheus **pulls** each service's `/metrics` HTTP endpoint on an interval. For **short-lived jobs** (batch tasks that die before a scrape) it accepts **push via a Pushgateway**.
- **TSDB (time-series database)** — **columnar and time-partitioned**, with a **label index** (an inverted index mapping label→series) so `http_requests{status="500", service="api"}` resolves fast. Columnar layout compresses timestamp/value runs extremely well.
- **Query engine (PromQL)** — a label-aware query language for slicing, aggregating, and computing rates over series.
- **Alert manager** — **evaluates alerting rules**, **dedupes** (many pods firing the same alert → one notification), groups, and **routes to PagerDuty/Slack** with silencing/inhibition.
- **Long-term storage (Thanos, Cortex, Mimir)** — adds **HA, multi-tenancy, and cheap object-store-backed history** (downsampled old data on S3), since a single Prometheus can't retain years of high-res data.

**Scaling:** **federate** scrapers per region (regional Prometheus feeding a global view via remote-write), **downsample** old data (keep 1s resolution for a day, 5m for a year), and **control cardinality** — **drop or relabel high-cardinality labels at ingest** (never put user IDs or request IDs in labels; that's the fastest way to blow up the TSDB).

**Pull vs. push tradeoff:** **pull** (Prometheus) makes **service discovery and health simple** — the scraper knows exactly which targets exist and a failed scrape *is* a health signal — but **struggles with short-lived jobs** and targets behind NAT/firewalls (needs a Pushgateway). **Push** (StatsD, OTLP) handles ephemeral jobs naturally but requires **gateways and loses the built-in liveness signal**. Regardless of model, **cardinality is the #1 killer** — uncontrolled label explosion OOMs the system.

**Key points:**
- Pull (Prom) vs push (StatsD/OTLP) tradeoff.
- TSDB columnar + label index.
- Federate + remote-write for global view.
- Cardinality control at ingest is mandatory.

---

### 83. Anti-corruption layer

**Frequency:** Low

**Question:** What is an anti-corruption layer, when is it critical, and how do you decide if it's justified per integration?

**Answer:** An **anti-corruption layer (ACL)** is a **translation layer between your bounded context and an external or legacy model**, whose job is to **prevent the foreign model from leaking into your domain**. Without it, a messy third-party API's concepts, naming, and quirks seep into your core code, gradually **corrupting your clean domain model** until your business logic is tangled up with someone else's data structures.

**How it's built:** as a set of **adapters and translators** that sit at the boundary and **map external concepts into your ubiquitous language** (and back). Your domain code only ever sees *your* clean models; the ACL absorbs the impedance mismatch. For example, a payment provider's `txn_status: "S"` gets translated into your domain's `PaymentStatus.Succeeded` at the boundary, so nothing downstream knows or cares about the provider's cryptic encoding.

**When it's critical:**
- Integrating with **legacy systems** whose model is dated or awkward.
- Consuming **third-party APIs** you don't control (and that may change).
- Talking to a **bounded context owned by another team** with different conventions.
- At the **edge of a strangler-fig migration** (Q38) — the ACL shields the new system from the old one's model while you incrementally replace it.

**Its costs:** **extra mapping code** to write and maintain, some **performance overhead** (translation on every call), and **maintenance burden when the external model changes** (you update the ACL, but *only* the ACL — which is the point).

**Deciding per integration:** weigh the **messiness/instability/foreignness** of the external model against the mapping cost. **Skip the ACL** for a small, stable, well-designed integration (the translation overhead isn't worth it). **Apply it** when the external model is **messy, frequently changing, or culturally different** from yours — there, the ACL pays for itself by containing the chaos at one well-defined boundary instead of letting it spread.

**Key points:**
- Protects domain purity from foreign models.
- Implemented via adapters and translators.
- Essential during legacy migrations.
- Costs maintenance—justify per integration.

---

### 84. Ambassador pattern

**Frequency:** Low

**Question:** What is the ambassador pattern, how does it differ from a general sidecar, and what are its tradeoffs?

**Answer:** The **ambassador pattern** is a **proxy co-located with a client** (typically as a **sidecar** container) that handles **outbound network concerns** on the app's behalf: **service discovery, retries, circuit breaking, TLS, and observability**. The application simply **talks to `localhost`**, and the ambassador handles the messy network reality — finding the target service, retrying on failure, breaking the circuit when it's down, encrypting the connection, and emitting metrics/traces.

**Why it's useful:** it **decouples networking behavior from application code**. You can **upgrade retry logic, add mTLS, or change discovery** by updating the ambassador — **without touching or redeploying the app**. It's especially valuable for **legacy clients that can't be modified** (an old app that only knows how to call `localhost` suddenly gets modern resilience and security for free), and for **polyglot fleets** (implement the networking logic once in the ambassador instead of in every language's client library).

**vs. the general sidecar:** a **sidecar** is the broad pattern of *any* helper container co-located with the main app (log shipper, config reloader, proxy, etc.). The **ambassador is a specific *kind* of sidecar** — specifically a **network proxy for outbound calls**. So every ambassador is a sidecar, but not every sidecar is an ambassador. **Service mesh data planes** (Envoy in Istio/Linkerd) **generalize the ambassador** — they're essentially ambassadors deployed fleet-wide and managed by a central control plane.

**Tradeoffs:** an **extra network hop** (app → ambassador → target) adds a little latency; **debugging is harder** because failures can now originate in the proxy, not just the app; and it **requires platform investment** (deploying, configuring, and maintaining sidecars everywhere). Worth it when you have many services needing consistent networking behavior; overkill for a single simple service.

**Key points:**
- Outbound proxy co-located with client.
- Handles retries, TLS, discovery.
- Decouples networking from app code.
- Service meshes generalize it.

---

### 85. CRDTs for collaborative state

**Frequency:** Low

**Question:** What are CRDTs, how do state-based and op-based variants differ, where are they used, and what are the tradeoffs?

**Answer:** **CRDTs (Conflict-free Replicated Data Types)** are **data structures designed so that concurrent updates from multiple replicas merge deterministically — with no coordination** — always converging to the same result. This gives **strong eventual consistency**: replicas can accept writes independently (offline, in different regions) and, once they exchange updates, are **guaranteed to reach the same state** without a central authority or locks. The convergence is **mathematically guaranteed** by the merge operation's properties (commutative, associative, idempotent).

**Examples:** **G-Counter** (grow-only counter — each replica increments its own slot, merge takes the max per slot), **PN-Counter** (increment *and* decrement via two G-Counters), **OR-Set** (add/remove set that handles concurrent add+remove correctly via unique tags), **LWW-Register** (last-write-wins by timestamp), and **RGA / Yjs / Automerge** for **collaborative text** (ordering characters so concurrent inserts merge sensibly).

**State-based vs. operation-based:**
- **State-based (CvRDT):** replicas **ship their full state**, and a **join/merge function** combines two states (e.g., element-wise max for a G-Counter). Robust to network issues (merges are idempotent, so duplicate/reordered messages are fine) but **shipping full state is expensive** as data grows.
- **Operation-based (CmRDT):** replicas **ship individual operations** over a **reliable causal-broadcast** channel (each op delivered once, in causal order). Much smaller messages, but **requires stronger delivery guarantees** from the transport.

**Where used:** **collaborative editors** (Figma, Linear, Notion's local-first sync), **offline-first apps** (edit offline, merge on reconnect), and **multi-region databases** (Riak, Redis Enterprise) needing conflict-free active-active writes.

**Tradeoffs:** **metadata overhead grows** (tombstones for removed elements, per-replica counters — an OR-Set that churns can accumulate a lot of bookkeeping); **merges follow math, not intent**, so the deterministic result can be **surprising to humans** (two people editing the same word may merge into something neither wanted); and **not every problem maps to a CRDT** — constraints like "balance must never go negative" fundamentally need coordination and can't be expressed conflict-free.

**Key points:**
- Mathematically guaranteed convergence.
- No coordination, no central authority needed.
- Yjs/Automerge popular for collaborative text.
- Metadata overhead can be significant.

---

### 86. Lambda vs Kappa architecture

**Frequency:** Low

**Question:** Compare Lambda and Kappa data architectures. When would you default to Kappa versus keeping Lambda?

**Answer:** Both address the same problem — serving both **real-time** and **accurate/complete** views of streaming data — but differ in **how many pipelines** you run.

**Lambda architecture** runs **two parallel pipelines**:
- A **batch layer** — **slow but accurate**, periodically **recomputing results from the full raw dataset**. It's the source of truth, handles late-arriving data, and can reprocess everything.
- A **speed layer** — **fast but approximate**, processing the live stream for **near-real-time** results that fill the gap until the next batch run.
- A **serving layer** merges both so queries see real-time data now and accurate data once batch catches up.

**Pro:** cleanly **handles late data and full recomputation** (just rerun the batch layer). **Con:** you maintain **two codebases and two systems** implementing the *same logic* twice — which inevitably **drift out of sync** (a bug fixed in batch but not speed produces divergent results), and it's operationally heavy.

**Kappa architecture** eliminates the batch layer: **a single streaming pipeline** over a **durable, replayable log** (like **Kafka** with long retention). There's only **one codebase**. When you need to recompute (a bug fix, a new derived view), you **replay the log from the beginning** through a new instance of the stream job — the log *is* your reprocessing mechanism, so you get batch's recomputation ability without a separate batch system. **Modern stream engines (Flink, Spark Structured Streaming)** handle event-time, windowing, and late data well enough that streaming alone covers most cases that used to require batch — **blurring the Lambda/Kappa line**.

**When to choose:** **default to Kappa** when your **broker can durably retain and replay history** (Kafka with sufficient retention) — one codebase, no sync drift, simpler ops. **Keep Lambda** only when **batch tooling is significantly cheaper for large cold recomputes** (e.g., reprocessing petabytes where a Spark batch job on cheap storage vastly outperforms replaying a stream), or when regulatory/precision requirements demand a separate authoritative batch recomputation.

**Key points:**
- Lambda: batch + speed layers, duplicated logic.
- Kappa: stream-only, replay from log.
- Kappa needs a durable, replayable log (Kafka).
- Modern engines reduce the dichotomy.

---

### 87. Pipes-and-filters vs orchestrated workflows

**Frequency:** Low

**Question:** Compare pipes-and-filters with orchestrated workflows. How do you choose, and how can they coexist?

**Answer:** Both compose a larger process from smaller steps, but they differ in **who holds the control flow and state**.

**Pipes-and-filters:** **independent, often stateless stages** (filters) connected by **streams or queues** (pipes). Each filter **reads input, transforms it, and writes output** to the next pipe, knowing nothing about the stages around it. Control flows implicitly — data moving through the pipeline *is* the coordination. It **excels at high-throughput data transformation**: **ETL, media/transcoding pipelines, log processing**. Its strengths: **stages scale independently** (add more instances of the slow filter), and you can **insert/remove/reorder filters** without touching the others.

**Orchestrated workflows:** a **central workflow engine** (**Temporal, Airflow, AWS Step Functions**) explicitly defines the process as **steps with retries, branches, timers, and human-in-the-loop** waits, and **holds the state** of each in-flight execution. It **excels at stateful, long-running business processes** that need **correctness and visibility** — e.g., an order-fulfillment flow that charges a card, waits for warehouse confirmation (possibly hours), branches on inventory, retries failed steps, and can wait days for a human approval. The orchestrator gives you a **durable record of where every execution is** and guarantees each step's completion.

**How to choose — by latency, state, and visibility:**
- **High-throughput, stateless, streaming transformation** → **pipes-and-filters** (low latency, simple, independently scalable).
- **Stateful, branching, long-running coordination needing auditability** → **orchestrated workflow** (correctness and visibility over raw throughput).

**Coexistence:** the two compose naturally — an **orchestrated workflow's individual step can itself be a pipes-and-filters pipeline** (e.g., the workflow's "process uploaded video" step kicks off a transcoding pipeline), or a pipeline stage can invoke a workflow. You use the orchestrator for the **business-level, stateful skeleton** and pipes-and-filters for the **data-crunching muscle** inside.

**Key points:**
- Pipes: streaming, stateless stages.
- Orchestrators: stateful, branching, long-running.
- Both can coexist in one system.
- Choose by latency, state, and visibility needs.

---

### 88. Outbox vs CDC for events

**Frequency:** Low

**Question:** Compare the outbox pattern and CDC as ways to produce events. When would you use each?

**Answer:** Both solve the **dual-write problem** — how to reliably publish an event whenever you change database state, without the two getting out of sync — but they produce **very different kinds of events**.

**Outbox pattern:** you write a **semantically meaningful, app-defined domain event** (e.g., `OrderPlaced` with the fields consumers care about) into an **outbox table in the *same database transaction*** as the state change. Because both writes are in one transaction, they **atomically succeed or fail together** — no dual-write inconsistency. A separate **relay** then reads the outbox and **publishes the events** to the broker. The events are **app-authored, stable, and decoupled from your physical schema** — consumers get clean business events (`OrderPlaced`), and you can refactor your tables without breaking them.

**CDC (Change Data Capture):** a tool like **Debezium** tails the database's **transaction log (WAL/binlog)** and **emits low-level row changes** (`UPDATE orders SET status='paid' WHERE id=42`). **No application code and no extra table** — it works purely at the database level, even on systems you can't modify. The catch: consumers see the **raw physical schema** (column names, row diffs) and must **reconstruct business intent** from it ("status went to 'paid' — that means the order was paid"). And a schema change (renamed column) **breaks every consumer**, because they're coupled to your table structure.

**When to use each:**
- **Outbox** — when you **control the producer** and want **stable, meaningful domain events** decoupled from your schema. Best for **inter-service integration** where you're intentionally publishing a business contract.
- **CDC** — when you **can't change the producer** (a legacy app or a database owned by another team), or when you specifically want **data-level replication/sync** rather than semantic events — e.g., streaming table changes into a **search index, data lake, or cache**.

**Both are at-least-once**, so a relay retry or CDC redelivery can emit an event twice — **consumers must be idempotent / dedupe** on an event ID.

**Key points:**
- Outbox: domain events, schema-stable.
- CDC: row-level, no app changes.
- Outbox needs a relay; CDC needs Debezium.
- Both at-least-once; consumers must dedupe.

---

### 89. Stream processing (Flink, Kafka Streams, Spark)

**Frequency:** Low

**Question:** Compare Flink, Kafka Streams, and Spark Structured Streaming for stream processing. How do you choose, and what do event-time, watermarks, and checkpointing mean?

**Answer:** All three process **unbounded event streams** with **windowing, joins, aggregations, and stateful operators**, but differ in architecture, latency, and operational model.

- **Apache Flink** — **true event-at-a-time streaming** with the **lowest latency** (milliseconds) and the **most sophisticated event-time semantics**. It provides **checkpoint-based exactly-once** state and is the **best choice for complex, stateful pipelines** (large keyed state, intricate windowing, CEP). The cost is operational complexity — it's a full distributed system to run.
- **Kafka Streams** — not a cluster but a **library embedded directly in your application**. It has **much simpler ops** (no separate processing cluster — it's just your app, deployed like any service), **scales with Kafka partitions** (add instances, partitions rebalance), and gives exactly-once with Kafka transactions. The tradeoff: it's **tightly tied to Kafka** (in and out) and best for **embedded, per-service stream logic** rather than giant centralized pipelines.
- **Spark Structured Streaming** — **micro-batch** under a streaming API (processes small batches every few hundred ms), so **higher latency** than Flink, but it's **excellent for teams already on Spark** — unified batch+stream code, mature ecosystem, great for **ETL**.

**How to choose:** by **latency** (need ms and heavy state → **Flink**), **team familiarity** (already a Spark/ETL shop → **Spark Structured Streaming**), and **complexity/deployment** (want stream logic embedded in a microservice with minimal ops → **Kafka Streams**).

**Key concepts they all grapple with:**
- **Event-time vs. processing-time** — **event-time** is when the event *actually happened* (embedded timestamp); **processing-time** is when your system *saw* it. Correct analytics (e.g., "clicks per hour") must use **event-time**, because events arrive late and out of order.
- **Watermarks** — a heuristic that says "I've probably seen all events up to time T"; they let the engine **decide when to close a window** and how long to wait for **late data** (and what to do with stragglers that arrive after the watermark).
- **Checkpointing** — periodically snapshotting operator state so that on failure the job **restores state and resumes**, underpinning **exactly-once** processing (state isn't double-counted or lost across restarts).

**Key points:**
- Event-time vs processing-time matters.
- Watermarks handle late data.
- Checkpointing for exactly-once state.
- Flink for hardest stateful workloads.

---

### 90. Time-series storage

**Frequency:** Low

**Question:** What is time-series storage optimized for, what are the key features and options, and why is cardinality the silent killer?

**Answer:** **Time-series databases** are purpose-built for the distinctive shape of time-stamped data: **append-only writes ordered by timestamp** (you almost never update old points), **aggregations over time windows** (avg CPU per 5-minute bucket), and **retention/downsampling** (keep raw data briefly, summaries for a long time). Using them for metrics, monitoring, IoT sensors, and financial ticks.

**Representative options:** **InfluxDB** (purpose-built TSDB), **TimescaleDB** (a Postgres extension — SQL familiarity + time-series optimizations), **Prometheus** (pull-based, monitoring-focused, ephemeral local storage), **VictoriaMetrics** (high-performance, Prometheus-compatible), and **ClickHouse** (a general columnar OLAP store that's also excellent for time-series and ad-hoc analytics).

**Key features that make them fast:**
- **Columnar storage** — timestamps and values stored in columns compress extremely well (long runs of similar values) and enable fast scans of just the columns you need.
- **Time-partitioned chunks** — data split into time-bounded chunks, so a query for "last hour" touches one small chunk and old chunks can be dropped wholesale.
- **Automatic downsampling / rollups** — pre-aggregate raw points into coarser summaries (1s → 1m → 1h) so long-range queries read compact rollups.
- **TTL-based retention** — automatically expire old data per policy.
- **Fast range scans** over the time dimension.

**Why a row-store SQL DB is a bad fit at scale:** a general row store isn't built for billions of timestamped rows — its **indexes balloon** (a B-tree over billions of rows is huge and slow to maintain), writes contend, and **range/aggregation queries slow to a crawl**. The columnar, time-partitioned design of a TSDB is what makes these workloads tractable.

**Cardinality — the silent killer:** in metrics systems, **cardinality is the number of unique series** = the product of all label-value combinations (`metric × service × instance × endpoint × …`). Each unique combination is a separate series with its own index entry and memory footprint. Adding a **high-cardinality label** (a **user ID, request ID, or email** — millions of distinct values) **multiplies series into the millions or billions**, exhausting memory and grinding queries to a halt. You must **budget cardinality explicitly** and **reject/relabel high-cardinality labels at ingest** — never put unbounded identifiers in labels. This is the #1 cause of TSDB outages.

**Key points:**
- Columnar + time-partitioned chunks.
- Downsampling and retention built in.
- Cardinality is the failure mode.
- ClickHouse great for ad-hoc analytics.

---

### 91. Tenant partitioning

**Frequency:** Low

**Question:** In a pooled multi-tenant system, how do you partition tenants across shards so noisy neighbors don't cascade, and how do you migrate a tenant?

**Answer:** In a **pooled** system (shared infra, `tenant_id` on rows — Q58), you still spread tenants across **multiple shards** so that one heavy tenant's load hits **only its shard**, not the whole fleet — containing the **noisy-neighbor blast radius**.

**Routing strategies (tenant → shard):**
- **Hash of `tenant_id`** — `shard = hash(tenant_id) % N`. Simple and gives **even distribution**, but it's **rigid**: you can't move a specific big tenant off a hot shard, and resharding is disruptive.
- **Lookup table** — an explicit `tenant_id → shard` mapping. Maximally **flexible**: you can **relocate any tenant** (move a whale to its own shard) by updating one row. The cost is maintaining and consulting the mapping.
- **Hybrid (the common answer)** — **hash most tenants** (cheap, even) but **pin the top-N largest tenants to dedicated shards** via the lookup table. This handles the reality that tenant sizes are **highly skewed** (a few giants, a long tail of small ones) — giants get isolation, the masses get simple hashing.

**Migrating a tenant** (moving one between shards) must be **zero-downtime**:
1. **Bulk-export** the tenant's data to the target shard (initial copy).
2. **Dual-write window** — write new changes to **both** old and new shards while the copy catches up, so nothing is lost.
3. **Cutover** — flip the routing (update the lookup table) to the new shard, verify, then stop writing to the old one and clean up.

**Additional defenses:** **per-shard capacity caps** (no single tenant may fill a shard — trigger a migration before it does), **per-tenant, per-shard observability** (spot a hot tenant *and which shard it's on* early), plus **per-tenant rate limits and circuit breakers**. Partitioning is the **primary structural defense** against multi-tenant overload; the rate limits/breakers are the tactical backstop.

**Key points:**
- Hash, lookup, or hybrid shard routing.
- Pin big tenants to dedicated shards.
- Plan tenant migration up front.
- Per-tenant observability is mandatory.

---

### 92. GDPR / data residency

**Frequency:** Low

**Question:** How do GDPR and data-residency requirements shape system architecture? Why don't tombstones satisfy erasure in event-sourced systems?

**Answer:** **GDPR** grants individuals rights that your architecture must actively support: a **lawful basis** for processing, and the rights to **access** (export all their data), **rectify** (correct it), **erase** ("right to be forgotten" — delete it), and **portability** (get it in a machine-readable form). **Data-residency** laws (in the **EU, China, Russia, India**, and others) additionally require certain data to **physically remain within the country/region**.

**How these shape design:**
1. **Per-region storage or pseudonymization** — to satisfy residency, run **separate storage/environments per residency zone** so EU data stays in the EU, China data in China, etc. (see geo-distribution, Q59). Where feasible, **pseudonymize** so identifiable data is minimized.
2. **Encryption at rest with per-tenant (or per-user) keys → crypto-shredding** — this is the elegant mechanism for **erasure**: encrypt each subject's data under a **dedicated key**, and to "delete" them, simply **destroy the key**. The ciphertext instantly becomes **unrecoverable garbage** without having to physically hunt down and delete every copy (backups, replicas, archives) — hugely valuable when data is spread across many stores.
3. **Event-sourced systems need special handling — tombstones don't satisfy erasure.** In event sourcing (Q4), the event log is **immutable and append-only** — that's the whole point. Appending a **tombstone** ("user X deleted") does **not** remove the earlier events that still contain the user's PII, so the data is **still there** and GDPR is **not** satisfied. You must either **rewrite/compact the log to physically remove the PII-bearing events**, or (better) **crypto-shred**: store PII encrypted per-user in the events and delete the key, rendering those historical events unreadable while keeping the log's structure intact.
4. **PII classification, lineage, catalogs, and DPIA** — you can't protect what you can't find, so **classify PII at ingest**, maintain **data lineage** (track where each piece of PII flows), keep a **data catalog**, and run **DPIA (Data Protection Impact Assessment)** workflows for new features. These governance practices are **non-negotiable** for demonstrating compliance to regulators.

**Key points:**
- Per-region storage for residency.
- Crypto-shredding for event-sourced erasure.
- Per-tenant keys enable selective deletion.
- PII classification and lineage are mandatory.

---

### 93. Zero-trust networking

**Frequency:** Low

**Question:** Explain the zero-trust networking model. What are its building blocks, and what's the cost/benefit versus VPNs?

**Answer:** **Zero trust** replaces the old "castle-and-moat" model — where anything *inside* the network perimeter was implicitly trusted — with **"never trust, always verify."** There is **no implicit trust based on network location**: being on the corporate LAN or inside the cluster grants you **nothing**. **Every single request — including east-west (service-to-service) traffic — is authenticated, authorized, and encrypted**, exactly as if it came from the open internet. The premise is that the perimeter *will* be breached, so an attacker who gets inside should find **no soft interior** to move through.

**Building blocks:**
1. **Service identity (SPIFFE/SVID, workload identity)** — every workload has a **cryptographic identity** it proves, not just an IP address (IPs are spoofable and reassigned).
2. **mTLS between services** — mutual TLS so **both ends authenticate** and all internal traffic is **encrypted** (see Q94).
3. **Identity-aware proxies for users (Google's BeyondCorp)** — user access is gated per-request by **identity + device posture**, not by "are you on the VPN?".
4. **Short-lived credentials (Vault, IAM roles)** — no long-lived static secrets; credentials expire fast, shrinking the window a leaked one is useful.
5. **Per-request policy (OPA, service-mesh policy)** — an authorization decision on **every** request ("may service A call endpoint X on service B?"), evaluated centrally and consistently.

**Versus VPNs:** it **replaces the VPN model** — a VPN grants broad network access once you're "in," which is exactly the flat-trust problem zero trust rejects; BeyondCorp lets users reach specific apps from anywhere without a VPN, gated per-request.

**Cost/benefit:** the **cost** is **significant platform investment and complexity** (identity infra, mesh, policy engine) plus **latency from the extra per-request checks**. The **benefit** is large: a **breach's blast radius shrinks dramatically** — a compromised service can't freely roam because every hop is re-verified — and **insider threats and lateral movement become far harder**. For a mature org with many services, the security win justifies the investment.

**Key points:**
- No implicit network trust.
- mTLS + service identity + per-request policy.
- Replaces VPNs (BeyondCorp model).
- Heavy platform investment, large security win.

---

### 94. mTLS in mesh

**Frequency:** Low

**Question:** How does mutual TLS (mTLS) work in a service mesh, why does it matter, and what are the costs?

**Answer:** **Regular TLS** authenticates only the **server** (the client verifies it's really talking to `bank.com`); the server has no cryptographic proof of *who the client is*. **Mutual TLS (mTLS)** adds the reverse: **both client and server present certificates and verify each other**, so **every service-to-service call cryptographically proves the identity of both parties**. Combined with encryption, this means a service knows *exactly* which service is calling it (not just "some IP"), and all traffic between them is confidential and tamper-proof.

**Why a service mesh makes it practical:** implementing mTLS by hand — issuing, distributing, rotating, and validating certs in every service, in every language — is painful and error-prone. A **mesh (Istio, Linkerd)** **automates it entirely** via the **sidecar proxy**: an **internal Certificate Authority (CA)** issues **short-lived certificates** (rotated every 24 hours or less), and the sidecars **handle the mTLS handshake transparently** on behalf of the app. The application code contains **no TLS logic at all** — it makes a plain call to `localhost`, and the sidecar upgrades it to authenticated, encrypted mTLS.

**Why it matters:** mTLS is the **foundation of zero-trust *inside* the cluster** (Q93). It **encrypts all east-west traffic** (so a network sniffer sees nothing) and provides **strong, verifiable service identity** — which is exactly what **authorization** policies need to decide "may service A call service B?". Without trustworthy identity, in-cluster authZ is meaningless.

**Costs:**
- **CA management** — you now run an internal CA and must protect its root key (a compromised CA undermines everything). The mesh handles most of this, but it's real infrastructure.
- **Per-handshake latency** — the mutual handshake adds a little latency, **mitigated by session resumption/keep-alive** so it's paid rarely, not per request.
- **Debugging denied requests** — "why was this call rejected?" (cert expired? identity mismatch? policy denied?) requires **good policy/observability tooling** in the mesh, or it becomes opaque.

For a mature platform with many services, mTLS is essentially **table stakes** — the baseline for secure internal communication.

**Key points:**
- Both sides authenticate with certs.
- Sidecars handle rotation transparently.
- Foundation for zero-trust + authZ.
- Internal CA is the critical piece.

---

### 95. WAF placement

**Frequency:** Low

**Question:** What is a Web Application Firewall, where should it sit, and why isn't it a substitute for secure coding?

**Answer:** A **Web Application Firewall (WAF)** inspects **incoming HTTP traffic** and blocks requests matching known **attack patterns** — the **OWASP-style** classics: **SQL injection (SQLi), cross-site scripting (XSS), remote code execution (RCE), path traversal**, and known exploit signatures. It sits at **layer 7**, understanding HTTP semantics (headers, params, body), unlike a network firewall.

**Placement — at the edge:** deploy it as far out as possible — **Cloudflare, AWS WAF, Akamai** — so it **inspects and drops malicious traffic before it ever reaches your infrastructure**. This absorbs **bots and known exploit scans cheaply** at the edge (where you have massive capacity), keeping the junk off your origin servers and application. The edge is also where you get the scale to handle attack volume.

**Tradeoffs:**
- **False positives** — an overly aggressive rule can **block legitimate traffic** (a valid request that happens to look like an injection), so the WAF **must be tuned per application** — start in monitor/log mode, then enforce.
- **Per-app tuning** — generic rules don't fit every app; each needs its own tuning to balance protection vs. false positives.
- **Managed rules lag novel exploits** — signature-based rules only catch **known** attacks; a **zero-day** or a novel exploit passes right through until a rule is written.

**Why it's necessary but not sufficient:** a WAF is one **layer** in defense-in-depth (Q62), not the whole defense. **Pair it with rate limiting, bot management, and RASP (Runtime Application Self-Protection)**. Crucially, it is **not a substitute for secure coding and dependency hygiene** — the WAF is a **filter in front of** your app, but the **real defense is code that isn't vulnerable in the first place**: parameterized queries (not relying on the WAF to catch SQLi), output encoding, input validation, and keeping dependencies patched. Treating the WAF as your primary defense is a false sense of security — it buys time and blocks the obvious, but a determined attacker finds what it misses.

**Key points:**
- Sits at the edge (CDN/WAF service).
- Blocks OWASP-style attacks.
- Tune to avoid false positives.
- Not a substitute for secure code.

---

### 96. Chaos engineering

**Frequency:** Low

**Question:** What is chaos engineering, what's the maturity progression, and why does culture matter more than tooling?

**Answer:** **Chaos engineering** is the practice of **deliberately injecting failures** — **killing pods, partitioning the network, slowing disk, exhausting CPU/memory, adding latency** — into production-like or **production** environments, to **discover weaknesses before a real incident does**. The logic is that distributed systems fail in ways you can't fully predict, so instead of *hoping* your redundancy and failover work, you **prove it empirically** under controlled conditions. Each experiment is **hypothesis-driven**: "we believe killing this pod won't affect users — let's verify," and a *surprise* is a bug found on your terms.

**The maturity progression** (crawl → walk → run):
1. **Game days in staging** — start small: scheduled, manual failure-injection exercises in a **non-prod** environment, with the team watching. Low risk, builds confidence and observability.
2. **Controlled prod experiments with limited blast radius** — graduate to **production** but **contain the damage**: target a small canary slice, run during business hours with engineers ready, and be able to abort instantly. Prod is where the *real* weaknesses live.
3. **Continuous chaos (Chaos Monkey style)** — the mature end: **automated, continuous** random failure injection in production, so resilience is verified constantly, not just during scheduled events.

**Prerequisites (don't skip these):** **solid observability** (you must *see* the impact to learn anything), **SLO/error budgets** (know how much disruption is acceptable), and **automated rollback** (abort the experiment the moment it exceeds the blast radius). Running chaos without these is just causing outages.

**Tooling:** **Chaos Mesh, LitmusChaos, Gremlin, Pumba** (and the original Netflix Chaos Monkey).

**Why culture matters more than tools:** the tools are the easy part. Chaos engineering only works in a **blameless, learning-oriented culture** — where a discovered weakness is a **win to be fixed**, not someone to blame; where experiments are **hypothesis-driven** (you learn whether the system behaves as believed); and where **postmortems are read as learning, not punishment**. In a blame culture, no one dares inject failure, findings get hidden, and the practice dies. The mindset shift — embracing failure as a teacher — is what makes it succeed.

**Key points:**
- Inject failures to discover weaknesses.
- Start staging, graduate to prod gradually.
- Observability and rollback are prereqs.
- Culture matters more than tools.

---

### 97. Cost observability & unit economics

**Frequency:** Low

**Question:** What is cost observability and unit economics for a cloud system, and why treat cost as a first-class non-functional requirement?

**Answer:** **Cost observability** means **measuring where your cloud spend actually goes** — **per feature, per tenant, per request** — rather than staring at a single monthly bill. Teams that don't measure this get **blindsided**: a bill jumps 40% and no one can say *why*, or a "free" feature is quietly costing more than it earns. **Unit economics** brings this down to actionable ratios: **$ per user, $ per request, $ per GB stored** — so you know the marginal cost of growth and whether a feature/tenant is profitable.

**How to get the visibility:** **tag everything** (service, team, environment, feature) so every resource's cost is **attributable**; use **cost-allocation reports** to slice spend by those tags; and compute **unit costs** as tracked **KPIs**, watched over time like any other metric.

**FinOps practices:**
- **Showback / chargeback** — show each team what *they* spend (showback), or actually bill it to their budget (chargeback), which drives ownership.
- **Regular cost reviews** — treat cost like a recurring engineering concern, not an annual finance surprise.
- **Spend-anomaly alerts** — alert on **daily** spend spikes so a runaway job or misconfiguration is caught in hours, not at month-end.
- **Automated rightsizing** — recommendations to downsize over-provisioned instances/volumes.

**Architecture choices have a "cost shape":**
- **Serverless vs. containers** — serverless (Lambda) is **cheap at low/spiky traffic** (pay per invocation) but often **more expensive at steady high volume**, where always-on containers are cheaper. The crossover point matters.
- **Multi-AZ / cross-region data transfer** — **egress and inter-AZ transfer fees add up** silently and can dwarf compute cost for chatty systems.
- **Logs — the silent budget killer** — verbose logging at scale (ingest + storage + indexing) frequently balloons into one of the largest line items unnoticed.

**Why first-class:** cost is a **real constraint on the business**, exactly like latency or availability. If you only optimize for performance and ignore cost, you build systems that work but **aren't economically viable**. Making cost a **first-class non-functional requirement** — designed for, measured, and reviewed — keeps the system sustainable as it scales, and surfaces the tradeoffs (spend more for lower latency? cheaper storage for slower queries?) as **explicit engineering decisions** rather than accidents.

**Key points:**
- Tag everything; per-team/feature visibility.
- Unit cost ($ per user/request) as KPI.
- Anomaly alerts on daily spend.
- Logs and egress are silent killers.

---

### 98. Edge computing (Workers, Lambda@Edge)

**Frequency:** Low

**Question:** What is edge computing (Cloudflare Workers, Lambda@Edge), what are its constraints, and what's the edge-plus-origin pattern?

**Answer:** **Edge computing** runs your code **at CDN points-of-presence (PoPs)** — the hundreds of locations physically close to users — instead of at a centralized origin. Platforms: **Cloudflare Workers, Lambda@Edge, Fastly Compute, Deno Deploy**. The payoff is **ultra-low latency**: code runs **10–50ms** from the user versus **100–300ms** to a distant origin, because the compute is a few network hops away.

**Use cases** (things worth doing right at the edge):
- **A/B routing** — decide which variant a user gets before the request travels far.
- **Edge auth** — validate a token/JWT and reject unauthorized requests without a round-trip to origin.
- **Personalization and geo-routing** — tailor or route based on the user's location, instantly.
- **Image transformation** — resize/optimize images at the edge.
- **API caching with custom logic** — cache with rules more sophisticated than a plain CDN.

**Constraints (the edge is a restricted environment):**
- **Tiny runtimes** — **V8 isolates or WebAssembly**, not full containers, so startup is instant but the environment is limited.
- **Short CPU budgets** — typically **~50–500ms** of CPU per request; no long-running or heavy computation.
- **Limited libraries** — restricted APIs, not a full Node/OS environment.
- **Storage is eventually-consistent KV** — edge KV stores are **highly read-replicated but low write-throughput and eventually consistent**; there's no strong-consistency database at the edge.

**The architecture pattern:** **edge handles thin logic + cache; origin handles heavy logic + writes.** Push the **latency-sensitive, lightweight, read-mostly** work (auth checks, routing, cache serving, small transforms) to the edge, and keep the **heavy computation, transactional writes, and strongly-consistent data** at the origin. This gives global users **snappy responses** for the common path while keeping the complex/consistent work centralized. It shines for **read-mostly workloads with a geographically distributed audience**.

**Key points:**
- Code at CDN PoPs; sub-50ms latency.
- V8 isolates/Wasm; short CPU budget.
- Storage is eventually consistent KV.
- Edge for thin logic; origin for heavy.

---

### 99. Log aggregation (Splunk/ELK-like)

**Frequency:** Low

**Question:** Design an ELK/Splunk-like log aggregation system (TB/day ingest, fast recent search, long-term archive, alerting). Contrast Loki vs Elasticsearch and cover scaling.

**Answer:** **Requirements:** ingest **TB/day** of **structured and unstructured** logs from many services, provide **fast search over recent data**, keep a **long-term archive**, and **alert on patterns**. Log volume is enormous and spiky, so the design is about **buffering, cheap storage tiers, and controlling volume**.

**Components (the pipeline):**
1. **Collectors** — lightweight agents (**Fluent Bit, Vector, OpenTelemetry sidecars**) run alongside services, **ship logs** out, and can parse/enrich/sample at the source.
2. **Buffer (Kafka)** — sits between collectors and the indexer to **absorb spikes**. Log volume is bursty (an incident produces a flood); Kafka decouples ingestion from indexing so a surge buffers instead of overwhelming or dropping.
3. **Indexer** — **Elasticsearch/OpenSearch, Loki, or ClickHouse** builds the **searchable index**. This is where the cost/capability tradeoff lives (below).
4. **Object storage (S3)** — holds **raw logs and cold archive** cheaply for long retention/compliance, separate from the hot searchable index.
5. **Query UI** — **Kibana** (for ES) or **Grafana** (for Loki) for search, dashboards, and alerting.

**Loki vs. Elasticsearch — the key choice:**
- **Elasticsearch** **indexes everything** (full-text on all fields) → **rich, fast arbitrary queries**, but **expensive** at scale (the full index is large and resource-hungry).
- **Loki** **indexes only labels** (service, level, etc.) and stores the log *bodies* as compressed chunks in object storage → **much cheaper**, but **full-text search is slower** (it filters by label, then greps the chunks). Choose **ES** when you need powerful ad-hoc search and can pay; choose **Loki** when you mostly filter by labels and want low cost.

**Scaling:**
- **Time-sharded indices** — one index per time window (per day), so old indices can be closed/dropped wholesale and queries for "last hour" touch one small index.
- **Hot / warm / cold tiers** — recent data on fast (expensive) storage, older data on cheaper/slower nodes, oldest as raw archive in S3. This tiering is the main cost lever.
- **Sample and structure at the source** — the biggest win: **enforce structured logging**, **drop debug logs in prod**, and **sample noisy services** at the **collector** before they ever hit the pipeline. Since log volume is the cost driver, cutting it upstream beats scaling the backend.

**Key points:**
- Kafka buffers spikes between collectors and indexer.
- ES = rich queries, expensive; Loki = labels only, cheap.
- Hot/warm/cold tiers cut cost.
- Sample and structure at the source.

---

### 100. Multiplayer game server (matchmaking, state sync)

**Frequency:** Low

**Question:** Design a multiplayer game server (60Hz real-time, skill/region matchmaking, anti-cheat, millions concurrent). Cover components and the server-authoritative tradeoffs.

**Answer:** **Requirements:** **real-time gameplay** at a **60Hz tick** (the server simulates 60 game steps/sec), **matchmaking by skill/region/latency**, **anti-cheat**, **persistent progression**, at **millions concurrent**. The defining constraints are **low latency** and **preventing cheating**, which pull the design toward server-authoritative simulation on regional clusters.

**Components:**
- **Matchmaker** \u2014 maintains **queues per region and game mode**, and does **skill-based bucketing (MMR)** to pair players of similar rating. The core tension: **fairness vs. queue time** \u2014 a perfectly balanced match may take too long to fill, so the matcher **widens the skill/latency window over time** to trade a little fairness for a shorter wait.
- **Session servers** \u2014 **dedicated per-match processes** that run the **authoritative game simulation**. They're **spun up on demand** by an orchestrator like **Agones** (a Kubernetes-based game-server fleet manager) and torn down when the match ends.
- **State sync** \u2014 **server-authoritative** (the server is the single source of truth \u2014 essential for anti-cheat) combined with **client prediction + reconciliation** (the client predicts locally for responsiveness, then corrects when the server's authoritative state arrives). State is sent as **deltas over UDP** (UDP because dropping a stale packet beats waiting for a retransmit at 60Hz), plus **lag compensation** for hit detection (the server rewinds to what the shooter saw when they fired).
- **Persistent storage** \u2014 **player profile and inventory in SQL** (transactional, needs consistency), **match history in an OLAP store** (analytics over billions of matches).
- **Voice/chat** \u2014 a separate real-time service.
- **Anti-cheat** \u2014 **server-side validation** (reject impossible moves \u2014 the reason state is authoritative) plus **client-side detection** (spot tampered clients).

**Scaling:** **regional clusters** put session servers physically near players (latency is everything), and matches are **bin-packed** onto session servers to use capacity efficiently, with **graceful drain at match end** so a shutting-down node doesn't kill an active game.

**Tradeoffs:**
- **Server-authoritative beats cheating but costs CPU** \u2014 the server simulates every match, so you pay real compute; the alternative (trusting clients) is cheaper but **wide open to cheating**, so it's non-negotiable for competitive games.
- **Netcode differs by genre** \u2014 **rollback netcode** (fighting games: predict + roll back on misprediction, great for precise 1v1) vs. **client prediction/interpolation** (FPS/large lobbies). No single model fits all.
- **Lag compensation favors the shooter** \u2014 rewinding to the shooter's view makes shooting feel fair but can produce "I got shot behind cover" moments for the target \u2014 an inherent, deliberate tradeoff.

**Key points:**
- Authoritative server + client prediction.
- UDP deltas at fixed tick rate.
- Matchmaker balances MMR vs queue time.
- Agones-style orchestration for dedicated session servers.
