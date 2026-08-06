# Backend Interview Questions

100 high-frequency backend questions covering API design, databases (SQL/NoSQL), caching, messaging, concurrency, security, languages (Python/Go/Java/Node), and operations.

---

### 1. REST vs RPC vs GraphQL vs gRPC

**Frequency:** High

**Question:** Compare REST, RPC (including JSON-RPC and gRPC), GraphQL, and gRPC as API styles: (1) explain how each models the interface (resources with uniform HTTP verbs vs actions/procedures vs a single typed-schema endpoint vs HTTP/2 + protobuf), (2) discuss their tradeoffs around caching, typing, payload verbosity, streaming, browser support, and issues like N+1 and complex auth/rate-limiting, and (3) describe which audience each fits best (public/third-party, internal high-throughput, mobile aggregation).

**Answer:** REST models resources with uniform HTTP verbs and is great for public, cacheable, resource-oriented APIs. RPC (JSON-RPC, gRPC) models actions/procedures and fits internal service-to-service calls where strong typing and low latency matter. GraphQL exposes a single endpoint with a typed schema and lets clients query exactly the fields they need — ideal for mobile/aggregation BFF layers but adds N+1 and caching headaches. gRPC uses HTTP/2 + protobuf for binary, streaming, multiplexed calls and is the default for internal microservices.

**Key points:**
- REST: cacheable via HTTP, weak typing, verbose payloads.
- gRPC: streaming, codegen, poor browser support (needs gRPC-Web).
- GraphQL: flexible queries, schema, complex auth and rate-limit story.
- Pick per audience: public/3rd-party = REST; internal high-throughput = gRPC; mobile aggregation = GraphQL.

---

### 2. Idempotency: methods & keys

**Frequency:** High

**Question:** Explain idempotency in the context of HTTP APIs: (1) define what makes an operation idempotent and state which HTTP methods are idempotent by contract and which are not, (2) describe how a client and server use an Idempotency-Key header to safely handle retries, including storing the first response keyed by it with a TTL, what to store (key, request hash, response), and how to handle a key reused with a different body, and (3) explain why this matters for network retries, double-clicks, webhooks, payments, and at-least-once queue consumers, and clarify why idempotency is not the same as safety.

**Answer:** An operation is idempotent if repeating it produces the same observable result. GET/PUT/DELETE are idempotent by HTTP contract; POST is not. For unsafe operations like payments, clients send an `Idempotency-Key` header; the server stores the first response keyed by it for some TTL and returns the cached response on retries. This protects against network retries, double-clicks, and at-least-once message delivery.

**Key points:**
- Store `(key, request hash, response)`; reject if key reused with different body.
- TTL 24h is typical; persist in Redis or a dedicated table.
- Idempotency != safety: PUT changes state but is idempotent.
- Critical for webhooks, payments, and queue consumers.

---

### 3. Pagination: offset vs cursor

**Frequency:** High

**Question:** Compare offset pagination and cursor (keyset) pagination: (1) explain how each works at the SQL level (LIMIT/OFFSET vs a WHERE clause on the last seen sort tuple), (2) discuss their performance and stability characteristics under large collections and concurrent inserts, and (3) describe best practices such as encoding the full sort tuple in an opaque base64 cursor, returning next_cursor and has_more, avoiding total counts on huge tables, and when offset is still acceptable.

**Answer:** Offset pagination (`LIMIT N OFFSET M`) is simple but slow on large offsets and unstable under concurrent inserts (items shift between pages). Cursor (keyset) pagination uses the last seen sort key (`WHERE (created_at, id) < (?, ?) ORDER BY ... LIMIT N`) and is O(log n) with an index, plus stable under inserts. Always cursor-paginate large or growing collections; offset is fine for small admin tables.

**Key points:**
- Cursors must encode the full sort tuple to be stable.
- Opaque base64 cursors hide implementation and let you evolve.
- Offset breaks for infinite scroll UX.
- Return `next_cursor` and `has_more`; avoid total counts on huge tables.

---

### 4. Rate limiting algorithms (token/leaky/sliding)

**Frequency:** High

**Question:** Compare the main rate limiting algorithms: (1) token bucket, (2) leaky bucket, (3) fixed window, and (4) sliding window (log and counter), explaining how each handles bursts, smoothing, edge effects, accuracy, and memory cost. Also cover implementation and response concerns: enforcing centrally in Redis (INCR + EXPIRE or a Lua script for atomicity), returning 429 with Retry-After and X-RateLimit-* headers, composing limits per API key/IP/route, and combining with concurrency limits to protect downstream services.

**Answer:** Token bucket allows bursts up to bucket size and refills at a steady rate — best general-purpose choice. Leaky bucket smooths output at a fixed rate, dropping or queueing excess. Fixed window is cheap but allows 2x burst at window edges. Sliding window log is accurate but memory-heavy; sliding window counter approximates it cheaply. Implement centrally (Redis) for distributed enforcement.

**Key points:**
- Return `429` with `Retry-After` and `X-RateLimit-*` headers.
- Limit per API key, per IP, and per route — composed.
- Redis `INCR` + EXPIRE or Lua script for atomicity.
- Combine with concurrency limits to protect downstream services.

---

### 5. AuthN vs AuthZ; OAuth 2.0 flows

**Frequency:** High

**Question:** Explain authentication versus authorization and the major OAuth 2.0 flows: (1) distinguish AuthN (who) from AuthZ (what) and describe OAuth 2.0 as an authorization framework issuing access tokens, (2) describe when to use Authorization Code + PKCE, Client Credentials, Device Code, and why Resource Owner Password and Implicit are deprecated, and (3) explain how OIDC layers identity on top, plus token best practices like short-lived access tokens with rotatable refresh tokens, validating aud/iss/exp/signature on every request, and using scopes, claims, and a policy engine for fine-grained control.

**Answer:** Authentication proves identity ("who"); authorization decides permissions ("what"). OAuth 2.0 is an authorization framework that issues access tokens. Authorization Code + PKCE is the default for web and mobile apps. Client Credentials is for machine-to-machine. Device Code is for TVs/CLIs. Resource Owner Password is deprecated. OIDC layers identity (ID token, userinfo) on top of OAuth.

**Key points:**
- Never use Implicit flow anymore — PKCE replaces it.
- Access tokens short-lived; refresh tokens long-lived and rotatable.
- Validate `aud`, `iss`, `exp`, signature on every request.
- Scopes for coarse perms, claims for attributes, policy engine for fine-grained.

---

### 6. JWT vs session cookies

**Frequency:** High

**Question:** Compare JWTs and server-side session cookies for authentication: (1) explain how each stores state and the implications for verification without a lookup versus trivial revocation, (2) discuss the cons of JWTs (size, difficulty revoking before expiry, alg=none misuse) and cookie security attributes (HttpOnly, Secure, SameSite), and (3) describe when each fits best (first-party web apps vs APIs and microservices), including keeping JWTs short-lived with rotating refresh tokens and verifying signatures with asymmetric keys in multi-service setups.

**Answer:** Session cookies hold an opaque ID; state lives server-side, so revocation is trivial. JWTs are self-contained signed claims, so any service can verify without a lookup — great for distributed systems but painful to revoke before expiry. For first-party web apps, sessions with secure HttpOnly cookies are simpler and safer. For APIs and microservices, short-lived JWTs + refresh tokens are common.

**Key points:**
- JWT cons: size, can't revoke without a blacklist, easy to misuse `alg=none`.
- Always set `HttpOnly`, `Secure`, `SameSite=Lax/Strict` on session cookies.
- Keep JWTs short (5-15 min); refresh via rotating refresh token.
- Verify signature with asymmetric keys (RS256/EdDSA), not shared secrets, in multi-service setups.

---

### 7. ACID

**Frequency:** High

**Question:** Explain the ACID properties of database transactions: (1) define Atomicity, Consistency, Isolation, and Durability, (2) discuss the subtleties, such as C being about app-level invariants rather than just the DB, durability depending on fsync and possibly-lying storage, and isolation level determining which anomalies appear, and (3) describe the WAL (write-ahead log) as the mechanism behind atomicity and durability, and how RDBMSs provide all four while NoSQL stores may relax some for scale.

**Answer:** Atomicity: a transaction's writes commit all-or-nothing. Consistency: a transaction moves the DB from one valid state to another (constraints hold). Isolation: concurrent transactions appear serial to some degree. Durability: committed data survives crashes (typically via WAL fsync). RDBMS like Postgres provide all four; NoSQL stores often relax one or more for scale.

**Key points:**
- "C" is the squishiest — it's about app-level invariants, not just the DB.
- Durability depends on `fsync` and storage; cloud disks can lie.
- Isolation level (next question) determines what anomalies you see.
- WAL (write-ahead log) is the mechanism behind A and D.

---

### 8. Isolation levels & anomalies

**Frequency:** High

**Question:** Explain SQL transaction isolation levels and the anomalies they permit: (1) describe Read Uncommitted, Read Committed, Repeatable Read, and Serializable and which anomalies each allows or prevents (dirty read, non-repeatable read, phantom, write skew, lost update), noting Postgres and MySQL defaults, (2) explain how Postgres Serializable uses SSI to catch write skew that Repeatable Read misses and the cost of more aborts at higher isolation, and (3) cover practical handling such as retrying serialization failures in app code and using SELECT ... FOR UPDATE for hot rows instead of bumping isolation.

**Answer:** Read Uncommitted: sees dirty reads. Read Committed (Postgres default): no dirty reads, but non-repeatable reads and phantoms possible. Repeatable Read (MySQL default): no non-repeatable reads; Postgres's RR also prevents phantoms via snapshot. Serializable: appears fully serial — Postgres uses SSI, which aborts conflicting txns. Higher isolation = more aborts/retries.

**Key points:**
- Anomalies: dirty read, non-repeatable read, phantom, write skew, lost update.
- Postgres SSI catches write-skew that Repeatable Read misses.
- Always handle serialization-failure retries in app code.
- Use explicit `SELECT ... FOR UPDATE` for hot rows instead of bumping isolation.

---

### 9. Indexes: B-tree vs hash; covering

**Frequency:** High

**Question:** Compare database index types and the concept of covering indexes: (1) explain B-tree indexes and the equality/range/prefix/ORDER BY operations they support versus hash indexes limited to equality, (2) define a covering index (via INCLUDE or composite columns) that lets the engine read only the index and skip the heap, and the leftmost-prefix rule for composite index order, and (3) discuss related considerations like index selectivity on low-cardinality columns, partial indexes for filtered subsets, GIN/GiST for full-text/arrays/JSON/geo, and the write cost of every added index.

**Answer:** B-tree is the workhorse — ordered, supports equality, range, prefix, and ORDER BY. Hash indexes only support equality and are rarely worth it (Postgres has them but they're crash-safe only since 10). A covering index includes all columns the query needs (via INCLUDE or composite) so the engine reads only the index, skipping the heap. Composite index order matters: leftmost-prefix rule.

**Key points:**
- Index selectivity: low-cardinality columns rarely benefit.
- Partial indexes for filtered subsets (`WHERE deleted_at IS NULL`).
- GIN/GiST for full-text, arrays, JSON, geo.
- Every index slows writes — measure before adding.

---

### 10. N+1 query problem

**Frequency:** High

**Question:** Explain the N+1 query problem: (1) describe how it arises when fetching N parents then issuing N child queries, common with naive ORMs and lazy loading, and its symptom of throughput collapsing as list size grows, (2) describe the fixes such as eager-loading via JOIN or IN(...) batching, DataLoader-style batching in GraphQL, and explicit prefetch (select_related/prefetch_related, Include), and (3) cover detection and guidance like logging SQL in tests and asserting query counts, choosing JOIN for small fan-out and IN batches for large fan-out, and why GraphQL resolvers almost always need DataLoader.

**Answer:** Fetching a list of N parents then issuing N child queries — common with naive ORMs and lazy loading. Symptoms: throughput tanks as list size grows. Fix by eager-loading (`JOIN` or `IN (...)` with batching), DataLoader-style batching in GraphQL, or explicit prefetch (`select_related`/`prefetch_related` in Django, `Include` in EF). Watch ORM-generated SQL in dev.

**Key points:**
- Always log SQL in tests and assert query counts on hot paths.
- `JOIN` for 1:1 or small fan-out; `IN` batches for large fan-out.
- GraphQL resolvers need DataLoader almost universally.
- N+1 is the most common cause of slow APIs in ORM-heavy stacks.

---

### 11. Joins; when to denormalize

**Frequency:** High

**Question:** Discuss database joins and when to denormalize: (1) explain the benefits of normalized schemas (consistency, cheap writes) and when joins stop being fine, such as read latency dominating, joins crossing partitions/shards, or a hot repeated multi-way join, (2) describe middle-ground options like materialized views and computed columns and the NoSQL default of denormalizing and designing for the query, and (3) cover related considerations such as choosing join type semantically, the sync strategy denormalization requires (triggers, CDC, dual-write), and the read-heavy versus write-heavy tradeoff.

**Answer:** Normalized schemas keep data consistent and writes cheap. Joins are fine until they're not — denormalize when read latency dominates and the join crosses partitions/shards, or when a hot read pattern repeats a 5-way join. Materialized views and computed columns are middle grounds. In NoSQL, denormalize by default and design for query.

**Key points:**
- Inner vs left vs full outer — pick semantically, not by performance gut.
- Denormalization needs a sync strategy (triggers, CDC, dual-write).
- Read-heavy → denormalize; write-heavy → normalize.
- Materialized views with periodic refresh are often the best compromise.

---

### 12. Normalization 1NF-BCNF

**Frequency:** High

**Question:** Explain database normalization from 1NF through BCNF: (1) define 1NF, 2NF, 3NF, and BCNF in terms of atomic columns, partial dependencies, transitive dependencies, and every determinant being a candidate key, (2) explain why practical apps target 3NF and selectively denormalize, and (3) discuss the tradeoffs such as normalization minimizing update anomalies and duplication, over-normalization causing excessive joins, deliberate denormalization in star/snowflake analytics schemas, and JSON columns as a pragmatic escape hatch for sparse attributes.

**Answer:** 1NF: atomic columns, no repeating groups. 2NF: 1NF + no partial dependencies on a composite key. 3NF: 2NF + no transitive dependencies (non-key → non-key). BCNF: every determinant is a candidate key — stricter than 3NF. Practical apps target 3NF and selectively denormalize for performance.

**Key points:**
- Normalization minimizes update anomalies and storage duplication.
- Over-normalization causes excessive joins.
- Star/snowflake schemas in analytics deliberately denormalize.
- JSON columns are a pragmatic escape hatch for sparse attributes.

---

### 13. Sharding (range/hash/geo)

**Frequency:** High

**Question:** Compare database sharding strategies: (1) range, (2) hash, and (3) geo sharding, explaining how each distributes data and their tradeoffs around range scans, hotspots on monotonic keys, rebalancing difficulty, and latency/compliance. Also cover choosing a shard key for even distribution and query locality, why the shard key is hard to change, using consistent hashing to minimize rebalancing, pre-splitting to avoid initial hotspots, and avoiding distributed transactions by routing per tenant.

**Answer:** Range sharding splits by key range — easy range scans but hotspot risk on monotonic keys. Hash sharding distributes evenly — no range scans, harder rebalancing. Geo sharding routes by region for latency and compliance. Choose shard key for even distribution AND query locality; cross-shard joins/transactions are expensive.

**Key points:**
- Shard key is hard to change — design for the next 3-5 years.
- Consistent hashing minimizes rebalancing on node changes.
- Pre-split to avoid initial hotspots in range schemes.
- Avoid distributed transactions; route by tenant when possible.

---

### 14. Optimistic vs pessimistic locking

**Frequency:** High

**Question:** Compare optimistic and pessimistic locking: (1) explain how optimistic locking works (read a version/etag, write with WHERE version = ?, retry on zero rows updated) and how pessimistic locking works (SELECT ... FOR UPDATE holds a row lock until commit), (2) which fits low-contention versus high-contention or retry-expensive workloads and their scaling/latency tradeoffs, and (3) practical points such as always including a version column, HTTP If-Match/ETag as API-layer optimistic locking, the danger of holding pessimistic locks across user think-time, and SKIP LOCKED for work-queue patterns.

**Answer:** Optimistic: read with a version/etag, write with `WHERE version = ?`; if 0 rows updated, conflict, retry. Best for low-contention workloads. Pessimistic: `SELECT ... FOR UPDATE` locks the row until commit. Best for high-contention or when retries are expensive. Optimistic scales better; pessimistic gives predictable latency under contention.

**Key points:**
- Always include an integer/UUID version column for optimistic.
- HTTP If-Match/ETag is optimistic locking at the API layer.
- Pessimistic locks held across user think-time = disaster.
- `SKIP LOCKED` enables work-queue patterns without contention.

---

### 15. CAP & PACELC

**Frequency:** High

**Question:** Explain the CAP theorem and PACELC: (1) state what CAP says you must trade under a network partition and clarify that CAP consistency means linearizability and describes behavior during a partition rather than steady state, (2) how PACELC extends CAP to say that even without a partition you trade Latency for Consistency (PA/EL vs PC/EC) and that this is the everyday tradeoff, and (3) how real distributed DBs fall into AP or CP categories, are often tunable per query, and why you shouldn't pick a DB on CAP alone since operability matters more.

**Answer:** CAP says under a network partition you must trade Consistency for Availability. PACELC extends: even without a partition, you trade Latency for Consistency (PA/EL vs PC/EC). Most distributed DBs are AP (Dynamo, Cassandra) or CP (Spanner, etcd, ZooKeeper). Real systems are tunable: Cassandra lets you pick consistency per query.

**Key points:**
- CAP is about behavior during partition, not steady state.
- "Consistency" in CAP = linearizability, stronger than SQL's "C".
- Latency vs consistency tradeoff (the LC in PACELC) is the everyday one.
- Don't pick a DB on CAP alone — operability matters more.

---

### 16. Cache aside vs read-through vs write-through vs write-behind

**Frequency:** High

**Question:** Compare the caching strategies cache-aside, read-through, write-through, and write-behind: (1) explain how each works, including cache-aside (app reads cache, loads DB on miss and populates), read-through (cache loads DB itself), write-through (write to cache then DB synchronously), and write-behind (cache acks fast, persists async), (2) their tradeoffs around consistency, latency, and data-loss risk, and (3) guidance such as cache-aside being the default choice, its invalidation burden on the app, write-behind needing durable queues, and always setting TTLs even with explicit invalidation.

**Answer:** Cache-aside: app reads cache, on miss loads from DB and populates — most common. Read-through: cache loads from DB itself on miss. Write-through: writes go to cache then DB synchronously — consistent but slow. Write-behind: cache acks fast, persists to DB async — fast but risks data loss on crash. Pick cache-aside unless you have a reason.

**Key points:**
- Cache-aside puts invalidation burden on the app.
- Write-through eliminates cache/DB skew at write cost.
- Write-behind needs durable queues to be safe.
- Always set TTLs even with explicit invalidation.

---

### 17. Cache invalidation strategies

**Frequency:** High

**Question:** Explain cache invalidation strategies: (1) the main options TTL, explicit invalidation on write, version/etag in the key, and pub-sub fanout (e.g., Redis keyspace notifications) and their tradeoffs around staleness, correctness, and plumbing, (2) why combining TTL with explicit invalidation gives safety, and (3) supporting techniques such as stampede protection with locks or single-flight, negative caching of not-found results, structuring keys per query shape, and soft TTL with background refresh to keep hot keys warm.

**Answer:** Phil Karlton: one of the two hard things. Options: TTL (simple, allows staleness), explicit invalidation on write (correct, plumbing-heavy), version/etag in key (deploy bumps version), pub-sub fanout (Redis keyspace notifications). Combine TTL + explicit invalidation for safety.

**Key points:**
- Stampede protection (locks, single-flight) on miss.
- Negative caching — remember "not found" briefly.
- Key per query shape: `user:42:posts:page:1`.
- Soft TTL + background refresh keeps hot keys warm.

---

### 18. Threads vs processes vs coroutines vs async

**Frequency:** High

**Question:** Compare the main units of concurrency and parallelism: (1) threads that share memory within a process, (2) isolated processes, (3) coroutines such as goroutines, virtual threads, or asyncio tasks, and (4) async event-loop execution. Explain the cost, isolation, and scheduling differences between them, and walk through how you would choose between them for CPU-bound versus I/O-bound workloads, including the danger of mixing blocking calls into an async path.

**Answer:** Threads share memory in a process, switched by the kernel — fine-grained but with overhead and synchronization hazards. Processes are isolated, safer, costlier. Coroutines (goroutines, virtual threads, asyncio tasks) are user-space, cheap (KBs of stack), scheduled cooperatively or on a tiny thread pool. Async is event-loop driven and shines for I/O-bound work; threads/processes for CPU-bound parallelism.

**Key points:**
- CPU-bound → processes (Python) or threads (Go/Java).
- I/O-bound → async/coroutines for max concurrency.
- Mixing async with blocking calls = silent stalls.
- Pick the runtime that matches the workload.

---

### 19. Python GIL

**Frequency:** High

**Question:** Explain what Python's Global Interpreter Lock (GIL) is and why CPython has it. Describe how it affects thread-level CPU parallelism versus I/O-bound code (given that I/O releases the GIL), and lay out the options for doing CPU-bound work: multiprocessing, native extensions that release the GIL, and the free-threaded PEP 703 build. Also clarify whether the GIL protects your application logic from race conditions.

**Answer:** The Global Interpreter Lock ensures only one thread executes Python bytecode at a time, simplifying CPython's memory management but preventing thread-level CPU parallelism. I/O releases the GIL, so threads still help I/O-bound code. For CPU-bound work use `multiprocessing`, native extensions (NumPy, Cython releasing the GIL), or PEP 703 free-threaded Python (3.13+).

**Key points:**
- Async + threads + processes are complementary tools.
- C extensions can release the GIL during number crunching.
- PEP 703 (no-GIL) is opt-in and experimental.
- GIL doesn't prevent race conditions in app logic.

---

### 20. Race conditions vs deadlocks vs livelocks

**Frequency:** High

**Question:** Distinguish between (1) race conditions, (2) deadlocks, (3) livelocks, and (4) starvation, giving the defining characteristic of each. Explain why race conditions often stay hidden until production load, what tools detect these problems (such as Go's -race, TSan, or strict async modes), and which mitigation techniques help, including locks/atomics, consistent lock ordering, backoff with jitter, and preferring immutability or message-passing over shared mutable state.

**Answer:** Race condition: outcome depends on timing of concurrent accesses (e.g., check-then-act on shared state). Deadlock: threads block each other in a cycle, nothing progresses. Livelock: threads keep changing state in response to each other but make no progress. Starvation: a thread is perpetually denied resources. Use locks/atomics, lock ordering, backoff with jitter.

**Key points:**
- Race conditions are often invisible until prod load.
- Detection: `-race` (Go), TSan (C++), `pytest-asyncio` strict mode.
- Test concurrent paths with stress + fuzzing.
- Prefer immutability / message-passing over shared mutable state.

---

### 21. Mutex vs semaphore vs condition var

**Frequency:** High

**Question:** Compare (1) a mutex, (2) a semaphore, and (3) a condition variable, including what each is for and how many holders each permits. Explain how a condition variable pairs with a mutex and why you must re-check the predicate in a loop (spurious wakeups), where an RWMutex fits for read-heavy paths, and best practices such as always releasing mutexes, avoiding priority inversion, and when spinlocks are appropriate.

**Answer:** Mutex: mutual exclusion, only one holder at a time. Semaphore: counts permits, allows N concurrent holders — used for resource pools or rate limits. Condition variable: lets threads wait for a predicate to become true, paired with a mutex (always check predicate in a loop — spurious wakeups). RWMutex separates readers and writers for read-heavy paths.

**Key points:**
- Always release mutexes (defer/finally) — exception safety.
- Beware priority inversion in real-time systems.
- Spinlocks only for very short critical sections on multicore.
- Channels in Go often replace explicit locks more cleanly.

---

### 22. Kafka vs RabbitMQ vs SQS

**Frequency:** High

**Question:** Compare Kafka, RabbitMQ, and SQS as messaging systems. Explain Kafka's durable, replayable, partition-ordered log model with consumer groups; RabbitMQ's broker model with rich exchange/queue routing and per-message acks; and SQS's managed, at-least-once, largely unordered model with FIFO as an option. Contrast their retention semantics, relative throughput, and operational burden, and explain when you would pick each.

**Answer:** Kafka: durable log, replayable, high throughput, partition-ordered, consumer groups — for streaming and event sourcing. RabbitMQ: classic broker with rich routing (exchanges, queues), per-message ack, lower throughput, easier for work queues and RPC. SQS: managed, simple, at-least-once, no ordering by default (FIFO queues exist), perfect for AWS-native workers.

**Key points:**
- Kafka = log; Rabbit/SQS = queue. Different mental models.
- Kafka retention by time/size; Rabbit/SQS drop on ack.
- Throughput: Kafka >> Rabbit > SQS standard.
- Ops: SQS zero, Rabbit medium, Kafka heavy (or managed via MSK/Confluent).

---

### 23. Exactly-once vs at-least-once vs at-most-once

**Frequency:** High

**Question:** Explain the three message delivery/processing guarantees: (1) at-most-once, (2) at-least-once, and (3) exactly-once. Describe what each means for message loss and duplication, why true exactly-once is only achievable end-to-end via idempotent consumers or transactional writes, the distinction between exactly-once delivery and exactly-once processing, how Kafka transactions and outbox/2PC patterns fit in, and why at-least-once plus idempotent consumers is the realistic target.

**Answer:** At-most-once: fire and forget; messages may be lost. At-least-once: retry until ack; duplicates possible. Exactly-once: each effect happens once — only achievable end-to-end via idempotent consumers or transactional writes (Kafka EOS within Kafka). In practice, at-least-once + idempotent consumers is the realistic target.

**Key points:**
- "Exactly-once delivery" is mostly marketing; "exactly-once processing" is real.
- Idempotency keys + dedup tables are how you build exactly-once.
- Kafka transactions cover Kafka-to-Kafka; bridging to external systems requires outbox/2PC patterns.
- Always design consumers to handle dupes.

---

### 24. Kafka partitions/consumer groups/offsets

**Frequency:** High

**Question:** Explain Kafka's core concepts of partitions, consumer groups, and offsets. Cover how a topic's partitions are ordered logs, how producer key routing maps keys to partitions and preserves ordering, how members of a consumer group split partitions with at most one consumer per partition, and how offsets track and commit read position. Also address how partition count caps consumer parallelism, the impact of rebalances, when to commit offsets, and how key choice affects both ordering and load distribution.

**Answer:** A topic has N partitions, each an ordered log. Producers route by key (same key → same partition → ordered). A consumer group's members split partitions — one consumer per partition max. Offsets track per-partition read position, committed back to Kafka. Scale consumers by adding partitions.

**Key points:**
- Partition count caps consumer parallelism per group.
- Rebalances pause consumption — cooperative rebalancing minimizes disruption.
- Commit offsets after processing, not before (at-least-once).
- Key choice = ordering boundary AND load distribution.

---

### 25. SQL injection — parameterized queries

**Frequency:** High

**Question:** Explain how to prevent SQL injection. Describe why you must never concatenate user input into SQL and how parameterized queries / prepared statements defend by sending SQL and values separately so input can never be parsed as code, how ORMs do this by default, and why string escaping is only a fallback. Also cover treating all input as hostile including from upstream services, that stored procedures are not a silver bullet, using least-privilege DB users, and static analyzers that catch concatenated queries.

**Answer:** Never concatenate user input into SQL. Use parameterized queries / prepared statements — the driver sends SQL and values separately, so input can never be parsed as code. ORMs do this by default; raw queries via `db.query("... WHERE id = $1", id)` are safe. String escaping is a fallback, not a primary defense.

**Key points:**
- Treat all input as hostile — including from upstream services.
- Stored procs help but aren't a silver bullet.
- Use least-privilege DB users (no DDL for the app role).
- Static analyzers (semgrep, CodeQL) catch concat-style queries.

---

### 26. Password storage (bcrypt/argon2, salting, peppering)

**Frequency:** High

**Question:** Explain secure password storage. Cover why plaintext and fast hashes like MD5/SHA1 are unacceptable, the use of a slow KDF such as Argon2id (preferred), scrypt, or bcrypt with a per-user salt, and what peppering adds as an app-side secret stored separately from the DB. Explain tuning the cost so a hash takes roughly 100-250ms, and address Argon2id's GPU/side-channel resistance, bcrypt's 72-byte limit and pre-hashing with SHA-256, rehashing on login when cost increases, and rate-limiting auth attempts.

**Answer:** Never store plaintext or fast-hash (MD5/SHA1) passwords. Use a slow KDF — Argon2id (preferred), scrypt, or bcrypt — with per-user salt (handled by the library). Pepper is an app-side secret added before hashing, stored separately from the DB (defense if the DB leaks alone). Tune cost so a hash takes ~100-250ms on production hardware.

**Key points:**
- Argon2id resists GPU and side-channel attacks.
- bcrypt's 72-byte limit is a footgun — pre-hash with SHA-256 first.
- Rehash on login if cost parameters increase.
- Rate-limit auth attempts to slow brute force.

---

### 27. PUT vs PATCH

**Frequency:** Medium

**Question:** Compare PUT and PATCH for updating a resource: (1) explain the semantic difference between full replacement and partial update, including what happens to missing fields, (2) describe the two PATCH formats JSON Merge Patch (RFC 7396) and JSON Patch (RFC 6902) and their expressiveness tradeoffs, (3) discuss when to choose each method including concurrent writers on disjoint fields and idempotency of each, and (4) explain how ETag/If-Match combine with them to prevent lost updates.

**Answer:** PUT replaces the entire resource representation; missing fields are typically cleared. PATCH applies a partial update (JSON Merge Patch RFC 7396 or JSON Patch RFC 6902). Use PUT when clients send the whole document and you want predictable replace semantics. Use PATCH for sparse updates, especially when concurrent writers update disjoint fields.

**Key points:**
- PUT is idempotent; PATCH is idempotent only if the patch is.
- JSON Merge Patch: simple, can't express array ops or null-vs-missing.
- JSON Patch: operation list, more expressive, harder to author.
- Always combine with ETag/If-Match to prevent lost updates.

---

### 28. API versioning (URL/header/content-negotiation)

**Frequency:** Medium

**Question:** Discuss the main approaches to API versioning: (1) URL versioning (/v1/...), (2) header versioning (API-Version: 2), and (3) content negotiation (Accept: application/vnd.acme.v2+json), covering the discoverability, cache-friendliness, cleanliness, and testability tradeoffs of each. Also address a versioning policy: preferring additive backward-compatible changes and bumping major only on breaking changes, bounding support cost by maintaining few major versions, documenting deprecation with Sunset/Deprecation headers, and how GraphQL avoids versions via field deprecation.

**Answer:** URL versioning (`/v1/...`) is the most discoverable and cache-friendly and is what most public APIs use. Header versioning (`API-Version: 2`) keeps URLs clean but is invisible in logs and harder to test in browsers. Content negotiation (`Accept: application/vnd.acme.v2+json`) is the most RESTful but verbose. Whichever you choose, also version your error contract and webhooks.

**Key points:**
- Prefer additive, backward-compatible changes; bump major only on breaking changes.
- Maintain at most 2 major versions to bound support cost.
- Document deprecation timelines and emit `Sunset` / `Deprecation` headers.
- GraphQL avoids versions via field deprecation.

---

### 29. API gateway responsibilities

**Frequency:** Medium

**Question:** Describe the responsibilities of an API gateway as the single ingress for clients: (1) enumerate the cross-cutting concerns it handles such as TLS termination, authentication (JWT/API key validation), rate limiting, request/response transformation, routing, retries with circuit breakers, and observability, (2) explain why it should stay thin with business logic remaining in services, and (3) discuss how it relates to a service mesh (north-south vs east-west) and pairing with a WAF, naming example gateways.

**Answer:** A gateway is the single ingress for clients. It handles TLS termination, authn (JWT/API key validation), rate limiting, request/response transformation, routing to backend services, retries with circuit breakers, and observability (logs/metrics/traces). It should be thin — business logic stays in services. Examples: Kong, Envoy, AWS API Gateway, Apigee.

**Key points:**
- Offload cross-cutting concerns from services.
- Avoid putting domain logic in the gateway — it becomes a bottleneck.
- Use service mesh (Istio/Linkerd) for east-west; gateway for north-south.
- Pair with WAF for L7 attacks.

---

### 30. Long-running ops: 202+poll vs webhooks vs SSE

**Frequency:** Medium

**Question:** Compare the approaches for handling long-running operations in an API: (1) returning 202 Accepted with a job URL for the client to poll, (2) webhooks that push results to a client-registered URL, and (3) SSE or WebSockets that stream progress, covering the tradeoffs around simplicity, firewall-friendliness, request volume, hosting/retry/signing burden, browser UX, and when to use WebSockets versus SSE. Also cover practices like always returning a job ID synchronously, persisting job state so retries return the same result, and giving polling guidance via Retry-After.

**Answer:** Return `202 Accepted` with a job URL and let clients poll `/jobs/{id}` — simplest and firewall-friendly. Webhooks push results to a client-registered URL — fewer requests but require client to host an endpoint and you to handle retries/signing. SSE or WebSockets stream progress — best UX for browsers. WebSockets when bidirectional, SSE when server-to-client only.

**Key points:**
- Always return a job ID synchronously; never block on long work.
- Provide both polling and webhooks where feasible.
- Persist job state so retries return the same result.
- Set sensible polling guidance (`Retry-After`) to avoid hammering.

---

### 31. Webhook design: retries, signing, replay

**Frequency:** Medium

**Question:** Explain how to design a robust webhook delivery system: (1) how to sign payloads with HMAC-SHA256 over the raw body plus a timestamp sent in headers, and how receivers verify and reject stale timestamps to prevent replay, (2) the retry strategy with exponential backoff and eventual routing to a DLQ, and (3) supporting operations such as including an event ID for idempotency, signing the raw body, providing a replay tool and secret rotation with two active keys, documenting a delivery SLA and IP ranges, and letting receivers acknowledge async with a 202.

**Answer:** Sign payloads with HMAC-SHA256 over the raw body plus a timestamp, sent as a header (`X-Signature`, `X-Timestamp`). Receivers verify the signature, reject stale timestamps (>5 min) to prevent replay, and respond `2xx` quickly. Retry on non-2xx with exponential backoff for hours/days, then push to a DLQ. Always include an event ID for idempotency.

**Key points:**
- Sign the raw body — JSON re-serialization breaks signatures.
- Provide a replay tool and a secret rotation mechanism (two active keys).
- Document a delivery SLA, max retry window, and IP ranges.
- Let receivers acknowledge async with a 202 + processing queue.

---

### 32. Backward compatibility

**Frequency:** Medium

**Question:** Explain how to maintain backward compatibility as an API evolves: (1) which changes are safe/additive (new optional fields, new endpoints, new enum values when clients tolerate unknowns) versus which are breaking (removing/renaming fields, tightening validation, changing types, default behavior, or error codes), (2) the caution around Postel's law and never repurposing a field's meaning, and (3) tooling and rollout practices such as protobuf field numbers or GraphQL @deprecated, contract tests like Pact, deprecation policies with Sunset headers, and feature flags with metrics comparing old versus new clients.

**Answer:** Additive changes are safe: new optional fields, new endpoints, new enum values (if clients tolerate unknowns). Breaking changes: removing/renaming fields, tightening validation, changing types, changing default behavior, changing error codes. Use Postel's law sparingly — being too lenient on input traps you later. Document a deprecation policy with timelines and warnings (`Sunset` header).

**Key points:**
- Never repurpose a field's meaning — add a new one.
- Use protobuf field numbers / GraphQL `@deprecated` for typed schemas.
- Run contract tests (Pact) between consumers and producers.
- Roll out behind feature flags with metrics on old vs new clients.

---

### 33. Error model (HTTP status + RFC 7807)

**Frequency:** Medium

**Question:** Describe how to design a consistent API error model: (1) using HTTP status codes correctly (4xx client, 5xx server) and mapping common cases like 400, 401, 403, 404, 409, and 422, (2) adopting RFC 7807 Problem Details with its fields (type, title, status, detail, instance) plus extensions, and (3) operational practices such as including a stable machine-readable code and a correlation/request ID, using one error format across all endpoints, not leaking stack traces or internal SQL, and localizing title/detail for user-facing APIs.

**Answer:** Use HTTP status codes correctly (`4xx` client, `5xx` server) and a consistent JSON body. RFC 7807 Problem Details defines `type`, `title`, `status`, `detail`, `instance`, plus extensions. Include a stable machine-readable `code` and a correlation ID. Don't leak stack traces or internal SQL to clients.

**Key points:**
- `400` validation, `401` no/bad creds, `403` no permission, `404` missing, `409` conflict, `422` semantic.
- Always include `code` and `request_id` for support triage.
- One error format across all endpoints — no snowflakes.
- Localize `title`/`detail` if the API is user-facing.

---

### 34. EXPLAIN

**Frequency:** Medium

**Question:** Explain how to use EXPLAIN to diagnose query performance: (1) the difference between EXPLAIN and EXPLAIN ANALYZE, and how to read a plan inside-out from leaf nodes, (2) the warning signs to watch for such as Seq Scan on big tables, Nested Loop with high row counts, big mismatches between estimated and actual rows from stale stats, and Rows Removed by Filter, and (3) supporting techniques like BUFFERS for cache vs disk reads, running ANALYZE after bulk loads, watching misleading LIMIT plans, and using auto_explain / pg_stat_statements to catch regressions in production.

**Answer:** `EXPLAIN` shows the planner's chosen plan; `EXPLAIN ANALYZE` actually executes and reports timings and rows. Read it inside-out: leaf nodes first. Watch for Seq Scan on big tables, Nested Loop with high row counts, big mismatch between estimated and actual rows (stale stats), and `Rows Removed by Filter`. Fix with indexes, rewriting, or `ANALYZE`.

**Key points:**
- `BUFFERS` reveals cache hits vs disk reads.
- Update stats with `ANALYZE` after bulk loads.
- Beware `LIMIT` plans that look cheap but pick the wrong index.
- Use auto_explain / pg_stat_statements to catch regressions in prod.

---

### 35. Read replicas & replication lag

**Frequency:** Medium

**Question:** Explain read replicas and replication lag: (1) how replicas serve reads while the primary handles writes, and why async replication is the norm so replicas trail by ms to seconds, (2) the read-your-writes staleness problem and mitigations like routing critical reads to the primary or using LSN/GTID tokens to wait for catchup, and what makes lag balloon, and (3) operational concerns such as monitoring lag, the latency/data-loss tradeoff of synchronous replication, sequence/identity behavior across failover, and logical replication for selective tables and version upgrades.

**Answer:** Replicas serve read traffic; the primary handles writes. Async replication is the norm — replicas trail by ms to seconds. Reading your own writes from a replica returns stale data, so route critical reads to the primary, or use "read your writes" tokens (LSN/GTID) to wait for replica catchup. Lag balloons under heavy writes or long-running queries on the replica.

**Key points:**
- Monitor lag (`pg_stat_replication`, Seconds_Behind_Master).
- Synchronous replication trades latency for zero data loss on failover.
- Be careful with sequence/identity behavior across failover.
- Logical replication enables selective table replication and version upgrades.

---

### 36. Connection pooling

**Frequency:** Medium

**Question:** Explain database connection pooling: (1) why DB connections are expensive and how a pool reuses a small fixed set, (2) how to size pools (starting around cores * 2 per instance while keeping total under the DB's max_connections) and the role of PgBouncer in transaction-pooling mode plus the session features it breaks (prepared statements, SET), and (3) related concerns such as layering application and proxy pools, the risks of too many connections (context-switch storm, OOM), idle timeouts to prevent leaks, and why serverless functions need a proxy like RDS Proxy or PgBouncer.

**Answer:** DB connections are expensive (memory per backend, TCP+TLS handshake). A pool reuses a small fixed set. Sizing: start with `cores * 2` per app instance; total connections must not exceed DB's max_connections. PgBouncer in transaction-pooling mode is standard for Postgres. Beware: transaction-pooling breaks session features (prepared statements, `SET`).

**Key points:**
- Application pool ≠ proxy pool; layer them.
- Too many connections = context-switch storm and OOM on the DB.
- Idle timeouts prevent leaks holding precious slots.
- Serverless functions need a proxy (RDS Proxy, PgBouncer) to coalesce.

---

### 37. Deadlocks

**Frequency:** Medium

**Question:** Explain database deadlocks: (1) how two transactions holding locks the other needs form a cycle and how the DB detects and aborts one, (2) strategies to avoid them such as acquiring locks in a consistent order, keeping transactions short, using lower isolation when safe, and indexing foreign keys, and (3) practical handling like always retrying on deadlock errors, reading the logged queries, recognizing hot-row contention masquerading as deadlocks, using SELECT ... FOR UPDATE SKIP LOCKED for queue-like patterns, and reordering or batching by sorted key to break cycles.

**Answer:** Two transactions hold locks the other needs, forming a cycle. The DB detects and aborts one (`deadlock_detected`). Avoid by always acquiring locks in a consistent order, keeping transactions short, using lower isolation when safe, and indexing FKs (so child inserts don't take wider locks). Always retry on deadlock errors in app code.

**Key points:**
- Postgres logs both queries — read the log carefully.
- Hot-row contention often masquerades as deadlocks.
- `SELECT ... FOR UPDATE SKIP LOCKED` is great for queue-like patterns.
- Reorder operations or batch by sorted key to break cycles.

---

### 38. Window functions

**Frequency:** Medium

**Question:** Explain SQL window functions: (1) how they compute across a frame of rows without collapsing them, unlike GROUP BY, and the common functions ROW_NUMBER(), RANK(), LAG/LEAD, and SUM() OVER (PARTITION BY ...) for running totals, top-N per group, and period-over-period, (2) the clauses PARTITION BY, ORDER BY, and ROWS/RANGE for defining groups, sequencing, and the frame, and (3) details such as the top-N-per-group pattern, where in query evaluation they run (after WHERE/GROUP BY but before ORDER BY/LIMIT), and why they are often more index-friendly than subqueries.

**Answer:** Window functions compute across a frame of rows without collapsing them (unlike GROUP BY). `ROW_NUMBER()`, `RANK()`, `LAG/LEAD`, `SUM() OVER (PARTITION BY ...)` cover most needs — running totals, top-N per group, period-over-period. They replace painful self-joins and correlated subqueries.

**Key points:**
- `PARTITION BY` for groups; `ORDER BY` for sequencing; `ROWS/RANGE` for frame.
- Top-N per group: `ROW_NUMBER() OVER (PARTITION BY g ORDER BY x)` + filter.
- Computed after WHERE/GROUP BY but before ORDER BY/LIMIT.
- Often more index-friendly than subqueries.

---

### 39. Partitioning

**Frequency:** Medium

**Question:** Explain table partitioning: (1) how a logical table is split into physical chunks by range, list, or hash, (2) the benefits such as partition pruning, cheap bulk drops (DROP PARTITION vs DELETE), and per-partition vacuum/analyze, versus the costs like planning overhead and difficulty with global unique constraints, and (3) practical guidance including time-series as the canonical use case, Postgres declarative partitioning replacing inheritance tricks, choosing a partition key matching most queries' WHERE clauses, and automating partition creation with tools like pg_partman.

**Answer:** Splits a logical table into physical chunks by range (dates), list (regions), or hash. Benefits: faster queries via partition pruning, cheap bulk drops (`DROP PARTITION` vs `DELETE`), per-partition vacuum/analyze. Costs: planning overhead, can't have global unique constraints across partitions easily.

**Key points:**
- Time-series logs/events are the canonical use case.
- Postgres declarative partitioning (10+) replaces inheritance tricks.
- Choose partition key matching most queries' WHERE clauses.
- Automate partition creation (pg_partman) — manual is error-prone.

---

### 40. Online schema migrations

**Frequency:** Medium

**Question:** Explain how to perform online schema migrations safely: (1) why long DDL (adding columns with defaults, adding indexes, changing types) can lock tables and block writes, (2) the tools (pg_repack, pt-online-schema-change, gh-ost) and safe step-by-step approach such as add nullable column, backfill in batches, add NOT NULL, drop old, plus Postgres features like CREATE INDEX CONCURRENTLY and metadata-only ADD COLUMN ... DEFAULT since 11, and (3) practices like never running ALTER TABLE blindly on busy tables, throttled batched backfills, the expand/contract pattern, and keeping migrations forward-compatible with the previous app version.

**Answer:** Long DDL (adding columns with default, adding indexes, changing types) can lock tables and block writes. Use online tools (pg_repack, pt-online-schema-change, gh-ost) or break changes into safe steps: add nullable column → backfill in batches → add NOT NULL → drop old. Postgres supports `CREATE INDEX CONCURRENTLY` and `ADD COLUMN ... DEFAULT` is metadata-only since 11.

**Key points:**
- Never run `ALTER TABLE` blindly on a busy table in prod.
- Backfills should be batched with throttling.
- Expand/contract pattern: deploy code that handles both shapes before migrating.
- Keep migrations forward-compatible with the previous app version.

---

### 41. DB constraints vs app validation

**Frequency:** Medium

**Question:** Compare database constraints and application-level validation: (1) explain why you should use both, with DB constraints (NOT NULL, FK, UNIQUE, CHECK) as the last line of defense across any app touching the DB, and app validation for nice error messages, business rules the DB cannot express, and avoiding round-trips, (2) why you must never rely on app validation alone, and (3) supporting points such as FK constraints preventing orphaned rows despite ORM bugs, UNIQUE catching race conditions, keeping validation near the model layer, and mapping constraint violations to clear API error codes.

**Answer:** Use both. DB constraints (NOT NULL, FK, UNIQUE, CHECK) are the last line of defense and protect against bugs in any app touching the DB. App validation gives nice error messages, validates business rules the DB can't (e.g., cross-resource invariants), and avoids round-trips. Never rely on app validation alone — the DB doesn't trust you and shouldn't.

**Key points:**
- FK constraints prevent orphaned rows even when ORMs misbehave.
- UNIQUE catches race conditions app-level checks miss.
- Keep validation logic close to the model layer; share it across endpoints.
- Constraint violations should map to clear API error codes.

---

### 42. Soft vs hard delete

**Frequency:** Medium

**Question:** Compare soft delete and hard delete: (1) explain how each works (setting deleted_at versus actually removing rows), (2) the benefits of soft delete (audit trail, undo) versus its problems (polluting queries with WHERE deleted_at IS NULL, breaking unique constraints, table growth) and the simplicity but history loss of hard delete, and (3) mitigations and considerations such as partial unique indexes, GDPR right-to-erasure mandating hard delete or anonymization, default views/scopes that hide deleted rows, and background purge jobs after a retention window.

**Answer:** Soft delete sets `deleted_at` instead of removing; hard delete actually removes. Soft delete preserves audit trail and undo, but pollutes queries (`WHERE deleted_at IS NULL` everywhere), breaks unique constraints (unique on email but soft-deleted user exists), and grows tables. Hard delete is simpler but loses history — pair with an audit log if you need it.

**Key points:**
- Partial unique indexes work around soft-delete uniqueness issues.
- GDPR right-to-erasure usually mandates hard delete or anonymization.
- Default views/scopes that hide deleted rows prevent leaks.
- Background jobs can purge soft-deleted rows after a retention window.

---

### 43. UUID vs auto-increment PKs

**Frequency:** Medium

**Question:** Compare UUID and auto-increment integer primary keys: (1) explain the strengths of auto-increment ints (compact, sorted, cache-friendly, fast inserts/joins) versus UUIDs (globally unique, client-side generatable, don't leak counts) and the downside of random UUIDs causing B-tree fragmentation and index bloat, (2) how UUIDv7 (time-ordered) restores insert locality, and (3) guidance such as never exposing sequential IDs in URLs due to enumeration attacks, preferring UUIDv7/ULID as the modern default, using UUIDs in distributed systems and public APIs, and using Postgres's native 16-byte uuid type.

**Answer:** Auto-increment ints are compact, sorted, and cache-friendly — fastest for inserts and joins. UUIDs are globally unique, generatable client-side, and don't leak counts, but random UUIDs cause B-tree fragmentation and bloat indexes. UUIDv7 (time-ordered) gives most of UUID's benefits with insert locality. Use UUIDs in distributed systems and public APIs; ints internally are fine.

**Key points:**
- Never expose sequential IDs in URLs (enumeration attacks).
- UUIDv4 random ≠ insert-ordered → write amplification.
- UUIDv7 / ULID are the modern default.
- Postgres `uuid` type is 16 bytes vs `text` 36 — always use the native type.

---

### 44. Document stores: embed vs reference

**Frequency:** Medium

**Question:** Explain the embed-versus-reference decision in document stores: (1) when to embed child data (bounded, accessed with the parent, changes together) versus when to reference it (shared, unbounded, or independent lifecycle), (2) the tradeoffs where embedding optimizes reads but bloats documents while references require joins/lookups, and (3) considerations such as MongoDB's 16MB document limit forcing references for unbounded growth, embedded subdocs duplicating on update, hybrid approaches (embed a summary plus reference for details), and designing for the dominant query pattern.

**Answer:** Embed when child data is bounded, accessed with the parent, and changes together (e.g., order line items in an order). Reference when child is shared, unbounded, or has independent lifecycle (e.g., users referenced by posts). Embedding optimizes reads but bloats documents; references require joins/lookups.

**Key points:**
- MongoDB 16MB document limit forces references for unbounded growth.
- Embedded subdocs avoid joins but duplicate on update.
- Hybrid: embed a summary + reference for details.
- Design for the dominant query pattern.

---

### 45. Key-value stores (Redis, DynamoDB)

**Frequency:** Medium

**Question:** Compare key-value stores Redis and DynamoDB: (1) explain the general tradeoff of query flexibility for speed and horizontal scale, (2) characterize Redis (in-memory, single-threaded per shard, rich data types) versus DynamoDB (managed, multi-AZ, single-digit ms at scale, limited PK or PK+SK query model), and (3) their respective use cases (Redis for caching, sessions, leaderboards, rate limiting, queues; DynamoDB for serverless with zero ops and predictable latency) plus operational cautions like DDB hot keys and GSI propagation lag and Redis cluster sharding requiring hash tags for multi-key ops.

**Answer:** KV stores trade query flexibility for raw speed and horizontal scale. Redis is in-memory, single-threaded per shard, with rich data types (strings, hashes, lists, sets, sorted sets, streams). DynamoDB is managed, multi-AZ, single-digit ms at any scale, with limited query model (PK or PK+SK). Both punish ad-hoc queries — model around access patterns.

**Key points:**
- Redis for caching, sessions, leaderboards, rate limiting, queues.
- DynamoDB for serverless apps wanting zero ops + predictable latency.
- Watch DDB hot keys and GSI propagation lag.
- Redis cluster mode shards keys; multi-key ops require hash tags.

---

### 46. Eventual consistency patterns

**Frequency:** Medium

**Question:** Explain eventual consistency and the patterns that make it usable: (1) what it means for replicas to converge eventually after writes stop, (2) the patterns read-your-writes, monotonic reads, bounded staleness, and causal consistency (and their mechanisms like primary routing, session affinity, sticky replicas, and vector clocks), plus surfacing staleness in the UI, and (3) cautions and safeguards such as avoiding it for money/inventory unless reconciled, using compensating actions for conflicts, preferring CRDTs or merge functions over last-write-wins, and testing with deliberate replica lag in staging.

**Answer:** Replicas converge "eventually" after writes stop. Patterns to make it usable: read-your-writes (route to primary or session affinity), monotonic reads (sticky replica), bounded staleness (replica within X seconds), causal consistency (vector clocks). Surface staleness in the UI when it matters.

**Key points:**
- Avoid for money/inventory unless reconciled.
- Compensating actions handle conflicts you can't prevent.
- Last-write-wins is simple but loses data; CRDTs or merge functions are safer.
- Test with deliberate replica lag in staging.

---

### 47. Redis data types & use cases

**Frequency:** Medium

**Question:** Explain Redis data types and their use cases: (1) enumerate strings, hashes, lists, sets, sorted sets, streams, HyperLogLog, and bitmaps and the workloads each fits (counters/cache, object fields, queues/feeds, tags/dedup, leaderboards/rate limiters, append-only logs with consumer groups, cardinality estimation, presence/activity), and (2) operational best practices such as avoiding KEYS * in favor of SCAN, using pipelining and Lua scripts for atomic multi-op batches, setting per-key TTLs with a sane eviction policy like allkeys-lru, and using RedisJSON/Search modules for document and full-text features.

**Answer:** Strings: counters, JSON blobs, simple cache. Hashes: object fields with partial update. Lists: queues, recent-N feeds. Sets: tags, deduplication. Sorted sets: leaderboards, time-range queries, rate limiters. Streams: append-only logs with consumer groups (Kafka-lite). HyperLogLog: cardinality estimation. Bitmaps: presence/activity.

**Key points:**
- Avoid `KEYS *` in prod — use `SCAN`.
- Pipelining and Lua scripts for atomic multi-op batches.
- TTL per key; eviction policy (`allkeys-lru` is sane default).
- RedisJSON/Search modules add document and full-text features.

---

### 48. Cache stampede mitigations

**Frequency:** Medium

**Question:** Explain cache stampede and how to mitigate it: (1) describe how a hot key expiring causes hundreds of simultaneous misses that pile onto the DB, (2) the mitigations single-flight, probabilistic early expiration, background refresh on near-expiry, request coalescing at the cache layer, and locking with a short TTL on rebuild, and (3) supporting practices such as not synchronously expiring huge fan-out keys at the same instant, adding jitter to TTLs, using stale-while-revalidate to serve stale during rebuild, and monitoring both cache hit ratio and origin pressure during incidents.

**Answer:** When a hot key expires, hundreds of requests miss simultaneously and pile onto the DB. Mitigations: single-flight (only one request fetches, others wait), probabilistic early expiration (refresh before TTL with rising probability), background refresh on near-expiry, request coalescing at the cache layer, lock with short TTL on rebuild.

**Key points:**
- Don't sync-expire huge fan-out keys at the same instant.
- Add jitter to TTLs to avoid synchronized expiry.
- "Stale-while-revalidate" pattern serves stale during rebuild.
- Monitor cache hit ratio AND origin pressure during incidents.

---

### 49. CDN for API responses

**Frequency:** Medium

**Question:** Explain using a CDN for API responses: (1) how CDNs cache GET responses near users for public, cacheable data and the headers involved (Cache-Control: public, max-age=N, s-maxage, Vary), (2) targeted invalidation via surrogate keys/cache tags and the caution against caching user-specific responses without a per-user key, and (3) supporting techniques such as ETag + If-None-Match returning 304 for cheap revalidation, stale-while-revalidate and stale-if-error for resilience, event-driven purge on write plus a TTL ceiling, and avoiding the CDN for sensitive personalized data unless properly segmented.

**Answer:** CDNs cache GET responses near users — huge win for public, cacheable data (rates, catalogs, configs). Use `Cache-Control: public, max-age=N`, `s-maxage` for shared caches, and `Vary` for content negotiation. Use surrogate keys / cache tags for targeted purges. Don't cache user-specific responses without a per-user key.

**Key points:**
- ETag + `If-None-Match` returns 304 cheaply for revalidation.
- Stale-while-revalidate / stale-if-error improve resilience.
- Purge on write (event-driven) plus TTL ceiling.
- Avoid CDN for sensitive personalized data unless segmented properly.

---

### 50. Goroutines & M:N scheduler

**Frequency:** Medium

**Question:** Describe how goroutines work and how Go's M:N scheduler multiplexes them onto OS threads. Cover their small dynamically growing stacks, the work-stealing and preemptive scheduling, how cheaply you can spawn them, and how channels and select coordinate them. Also touch on GOMAXPROCS, the 'communicate, don't share memory' idiom, and how goroutine leaks happen and how context provides an exit path.

**Answer:** Goroutines are user-space tasks managed by Go's runtime, multiplexed M:N onto OS threads (M=machines, N=goroutines). They start at 2KB stack, grow dynamically. The scheduler is work-stealing with preemption. A program can spawn millions cheaply. Channels and `select` provide CSP-style coordination.

**Key points:**
- `go func()` is the cheapest concurrency primitive in any mainstream language.
- Don't share memory; communicate via channels (idiomatically).
- `GOMAXPROCS` defaults to `runtime.NumCPU()`.
- Forgotten goroutines = leaks; always have an exit path (context).

---

### 51. Async I/O event loop pitfalls

**Frequency:** Medium

**Question:** Walk through the main pitfalls of programming against an async I/O event loop. Explain what happens when you block the loop with CPU work, synchronous I/O, or sleeps and the symptoms it produces, how to offload blocking calls to a thread or process pool, why unbounded gather is dangerous and how semaphores help, the importance of timeouts on awaits, and why cancellation paths need careful handling.

**Answer:** Blocking the loop (CPU work, sync I/O, sleep) stalls all tasks. Symptoms: rising tail latency, healthcheck timeouts. Forbid blocking calls in async paths or push them to a thread/process pool. Avoid unbounded `gather` — use semaphores. Cancellation requires care: tasks may hold resources.

**Key points:**
- Profile with event-loop monitoring (e.g., `aiodebug`, `uvloop` stats).
- Wrap sync libs with `asyncio.to_thread` / `run_in_executor`.
- Always set timeouts on awaits.
- Test cancellation paths — they're routinely buggy.

---

### 52. Backpressure

**Frequency:** Medium

**Question:** Explain what backpressure is and why it matters for preventing queue buildup and out-of-memory failures. Describe the mechanisms available to signal or apply it, such as bounded queues that block or drop, HTTP 429/503, reactive-streams Request(n), the TCP window, and async iteration with await. Also cover why unbounded queues are a bug, the options of dropping, throttling, or shedding load, and the need to propagate backpressure end-to-end.

**Answer:** Backpressure is the receiver signaling "slow down" to the sender — essential to prevent queue buildup and OOMs. Mechanisms: bounded queues that block/drop, HTTP 429/503, reactive streams (Request(n)), TCP window, async iteration with `await`. Without backpressure, fast producers cause cascading failures.

**Key points:**
- Always bound queues — unbounded queues are bugs in disguise.
- Drop, throttle, or shed load when overwhelmed.
- Propagate backpressure end-to-end (gateway → service → DB).
- Measure queue depth and reject early under load.

---

### 53. Saga pattern

**Frequency:** Medium

**Question:** Explain the saga pattern for coordinating a long-running business transaction across services without distributed transactions. Describe how each step is a local transaction and how failures trigger compensating transactions to undo prior steps, then contrast (1) choreography, where services react to each other's events, with (2) orchestration, where a central coordinator drives the steps. Cover why compensations must be designed up front and be idempotent, and mention typical orchestrators.

**Answer:** Coordinates a long-running business transaction across services without distributed transactions. Each step is a local transaction; failures trigger compensating transactions to undo prior steps. Choreography: services react to each other's events. Orchestration: a central coordinator drives the steps. Orchestration is easier to reason about and monitor.

**Key points:**
- Compensations must be designed up-front and idempotent.
- Use for cross-service flows like book-flight + book-hotel + charge-card.
- Visualize state with a state machine.
- Temporal, Camunda, AWS Step Functions are common orchestrators.

---

### 54. Idempotent consumers

**Frequency:** Medium

**Question:** Explain what makes a message consumer idempotent and why this is critical under at-least-once delivery. Describe the techniques for achieving it: deduplicating on a message ID with a TTL, using inherently idempotent operations like UPSERT or conditional updates, and a transactional outbox plus a processed-IDs table. Cover the need for a stable producer-supplied message ID, sizing the dedup window to cover the retry horizon, and the extra care required for side effects like emails or payments.

**Answer:** Consumers must produce the same effect whether they process a message once or many times. Achieve via: dedup on message ID (store seen IDs with TTL), idempotent operations (UPSERT, conditional update), or transactional outbox + processed-IDs table. Critical because at-least-once delivery means dupes are normal.

**Key points:**
- Always include a stable message ID from the producer.
- Dedup window must cover max retry horizon.
- Side effects (emails, payments) need extra care — use idempotency keys.
- Test consumer with deliberate replays.

---

### 55. Dead letter queues

**Frequency:** Medium

**Question:** Explain the purpose of a dead letter queue (DLQ) and how messages that fail repeatedly get routed there instead of blocking the main queue, using mechanisms like a max receive count or max retries. Cover why you should alert on DLQ depth and build tooling to inspect, fix, and replay messages, how poison messages can stall a partition without a DLQ, what metadata to include on transfer, and why periodic cleanup matters.

**Answer:** Messages that fail repeatedly go to a DLQ for inspection instead of blocking the main queue forever. Set max receive count (SQS) or max retries (Rabbit) before routing to DLQ. Alert on DLQ depth; build tooling to inspect, fix, and replay messages. Never silently drop.

**Key points:**
- Default DLQ with metrics and dashboards is table stakes.
- Poison messages can stall a partition without a DLQ.
- Include original headers and failure reason on transfer.
- Periodic DLQ cleanup so it doesn't grow unbounded.

---

### 56. Event sourcing & CQRS

**Frequency:** Medium

**Question:** Explain event sourcing and CQRS. Describe how event sourcing persists state as a sequence of immutable events with current state derived by replay, and the benefits it brings such as audit trail, time travel, and projections. Then explain how CQRS separates the write model (commands producing events) from denormalized read models. Cover the real costs, including schema/event evolution, replay performance, and projection rebuilds, how snapshots help, and why you should apply it only to targeted aggregates.

**Answer:** Event sourcing persists state as a sequence of immutable events; current state is derived by replay. Gives audit trail, time travel, and projections. CQRS separates write model (commands → events) from read models (denormalized projections). Powerful but complex — schema evolution, replay performance, projection rebuilds are real costs.

**Key points:**
- Snapshots speed up replay for aggregates with long histories.
- Events are part of your API — version them carefully.
- Use for domains with strong audit/regulatory needs.
- Don't event-source everything — pick targeted aggregates.

---

### 57. Python: GIL/asyncio/multiprocessing

**Frequency:** Medium

**Question:** Explain how to choose among Python's concurrency tools for a given workload: (1) asyncio for single-threaded cooperative concurrency on I/O-bound work, (2) threading, which helps I/O-bound code because I/O releases the GIL, and (3) multiprocessing for CPU-bound work with separate interpreters communicating via pickled IPC, all in the context of the GIL serializing bytecode. Also cover mixing asyncio with sync libraries via to_thread, the concurrent.futures API, subinterpreters and free-threading, and picklability constraints.

**Answer:** The GIL serializes Python bytecode execution. `asyncio` gives single-threaded cooperative concurrency for I/O-bound work — millions of awaitable tasks. `threading` helps I/O-bound code because I/O releases the GIL. `multiprocessing` spawns processes for CPU-bound work, each with its own interpreter, communicating via pickled IPC. Pick by workload.

**Key points:**
- Don't mix asyncio with sync libraries without `to_thread`.
- `concurrent.futures` gives a uniform API over threads/processes.
- Subinterpreters (3.12+) and free-threading (3.13+) reshape the landscape.
- Picklability constraints bite `multiprocessing` users.

---

### 58. Python: type hints, mypy

**Frequency:** Medium

**Question:** Explain Python's optional static typing introduced by PEP 484 and how checkers like mypy and pyright use it. Cover the benefits (documenting intent, catching bugs, IDE intelligence, zero runtime cost) and modern features such as X | None, Protocol for structural typing, generics, TypeAlias, Self, and TypedDict. Also address incremental adoption with type: ignore and per-module strictness, that types are not enforced at runtime (needing Pydantic/attrs), and using from __future__ import annotations.

**Answer:** PEP 484 added optional static types; `mypy` / `pyright` check them. Types document intent, catch bugs, and enable IDE intelligence with zero runtime cost. Modern Python (3.10+) has `X | None`, structural typing (Protocol), generics with `[T]`, `TypeAlias`, `Self`, `TypedDict`. Adopt incrementally with `# type: ignore` and `disallow_untyped_defs` per module.

**Key points:**
- `pyright` (Pylance) is faster and stricter than `mypy`.
- Runtime validation needs Pydantic/attrs — types aren't enforced.
- `Protocol` enables duck typing with static checks.
- Use `from __future__ import annotations` for forward refs.

---

### 59. Go: channels vs mutexes

**Frequency:** Medium

**Question:** Explain Go's guidance to 'share memory by communicating' and when to use channels versus mutexes. Describe how channels coordinate goroutines and pass ownership of data, and when a mutex (often simpler) is the right choice for protecting small shared state like counters or caches. Cover the risks of oversized buffered channels, sync.RWMutex for read-heavy state, sync.Once for lazy init, sync/atomic for counters, and how closing a channel signals completion detected via the comma-ok form.

**Answer:** Go's mantra: "Don't communicate by sharing memory; share memory by communicating." Channels coordinate goroutines and pass ownership of data, encouraging clearer designs. Mutexes are fine — and often simpler — for protecting small bits of shared state (counters, caches). Use channels for handoff/coordination, mutexes for invariants on shared structures.

**Key points:**
- Buffered channels add capacity but hide design flaws if oversized.
- `sync.RWMutex` for read-heavy state.
- `sync.Once` for lazy init; `sync/atomic` for counters.
- Closing a channel signals completion; receivers detect with `, ok`.

---

### 60. Go: context cancellation

**Frequency:** Medium

**Question:** Explain Go's context.Context and how it carries deadlines, cancellation signals, and request-scoped values through a call chain. Describe passing it as the first parameter to any function that does I/O or spawns goroutines, creating child contexts with WithCancel/WithTimeout/WithDeadline and how they cancel with their parents, and checking ctx.Done() in long loops. Also cover best practices: never storing context in structs, using it for request lifetime rather than general DI, always deferring cancel(), and preferring stdlib context-aware overloads.

**Answer:** `context.Context` carries deadlines, cancellation signals, and request-scoped values through call chains. Pass it as the first parameter to every function that does I/O or spawns goroutines. Cancel via `WithCancel`/`WithTimeout`/`WithDeadline`; child contexts cancel when parents do. Check `ctx.Done()` in long loops and respect it in DB/HTTP libraries.

**Key points:**
- Never store context in structs — pass through functions.
- Use it for request lifetime, not for general DI.
- Always `defer cancel()` to release resources.
- Most stdlib libraries accept context; use those overloads.

---

### 61. Go: error handling

**Frequency:** Medium

**Question:** Explain Go's approach to error handling. Cover errors as values returned alongside results with explicit if err != nil checks, wrapping with fmt.Errorf and %w and unwrapping with errors.Is/As, the use of sentinel errors like io.EOF and typed errors for structured info, and that Go has no exceptions with panic reserved for unrecoverable bugs. Also address wrapping once per layer rather than every line, errors.Join for aggregation, not ignoring errors, and custom error types implementing Error() plus behavioral interfaces.

**Answer:** Errors are values returned alongside results — explicit `if err != nil` checks. Wrap with `fmt.Errorf("doing X: %w", err)` and unwrap with `errors.Is/As`. Sentinel errors (`io.EOF`) for known conditions, typed errors for structured info. No exceptions; `panic` is reserved for unrecoverable bugs.

**Key points:**
- Wrap once at each layer, not every line.
- `errors.Join` for multi-error aggregation (1.20+).
- Don't ignore errors — even `_ = ...` should be deliberate.
- Custom error types implement `Error() string` + behavioral interfaces.

---

### 62. Java GC (G1, ZGC, Shenandoah)

**Frequency:** Medium

**Question:** Compare the major JVM garbage collectors: (1) G1, the region-based, mostly-concurrent, low-pause default; (2) ZGC and Shenandoah, the sub-millisecond collectors that scale to terabytes via concurrent compaction with barriers; and (3) Parallel GC for throughput-oriented batch work. Explain how you would choose based on latency versus throughput goals and heap size, and touch on generational ZGC, setting -Xms equal to -Xmx, using GC logs for diagnosis, and avoiding premature tuning.

**Answer:** G1 (default since JDK 9) is region-based, mostly-concurrent, low-pause for heaps up to ~32GB. ZGC and Shenandoah are sub-millisecond, scalable to TBs — concurrent compaction with read/load barriers. Parallel GC maximizes throughput for batch work. Choice depends on latency vs throughput goals and heap size.

**Key points:**
- ZGC generational (JDK 21+) reclaims young objects faster.
- Tune heap size with `-Xms = -Xmx` to avoid resizing.
- GC logs (`-Xlog:gc*`) are essential for diagnosis.
- Avoid premature tuning — defaults are sane for most apps.

---

### 63. Node.js event loop & libuv & workers

**Frequency:** Medium

**Question:** Explain how Node.js's event loop works, including that JS runs on a single thread with libuv driving async I/O, and walk through the loop phases (timers, pending callbacks, idle/prepare, poll, check, close) and where microtasks like promises and queueMicrotask run. Cover why CPU work blocks the loop and how to offload it to worker_threads or child_process, the distinctions between setImmediate, setTimeout(0), and process.nextTick, libuv's thread pool and UV_THREADPOOL_SIZE, and profiling tools.

**Answer:** Node runs JS on a single thread with an event loop (libuv) for async I/O. Phases: timers → pending callbacks → idle/prepare → poll → check → close. Microtasks (promises, `queueMicrotask`) run between phases. CPU work blocks the loop — offload to `worker_threads` for parallelism or `child_process` for isolation.

**Key points:**
- Don't block the loop with `JSON.parse` of huge payloads, sync crypto, etc.
- `setImmediate` vs `setTimeout(0)` vs `process.nextTick` — distinct phases.
- Native modules can do work off-loop via libuv's thread pool (`UV_THREADPOOL_SIZE`).
- Profile with `clinic.js`, `--inspect`, `--prof`.

---

### 64. Django vs Flask vs FastAPI

**Frequency:** Medium

**Question:** Compare Django, Flask, and FastAPI. Explain Django as the batteries-included framework (ORM, admin, auth, migrations) best for CRUD apps and content sites, Flask as the flexible micro-framework where you pick everything at the cost of boilerplate, and FastAPI as the async, Pydantic-typed framework with automatic OpenAPI docs that is the modern default for new APIs. Cover when to choose each, the continued dominance of Django plus DRF, and the state of Django's async support.

**Answer:** Django: batteries-included (ORM, admin, auth, migrations) — fastest for CRUD apps and content sites. Flask: micro-framework, you pick everything — flexible, more boilerplate. FastAPI: async, Pydantic-based typing, automatic OpenAPI docs — modern default for new APIs. Django + DRF still dominant for full-stack apps.

**Key points:**
- FastAPI for high-concurrency JSON APIs.
- Django when you need admin and ORM out of the box.
- Flask is the "I want full control" choice.
- Async support in Django (3.0+) is solid but ORM async lags.

---

### 65. TLS handshake & cert pinning

**Frequency:** Medium

**Question:** Explain the TLS 1.3 handshake, walking through ClientHello, ServerHello, and Finished, the 1-RTT (and 0-RTT resumption) flow, and how the server's identity is verified via a certificate chain to a trusted CA. Then explain certificate pinning: binding an app to a specific cert or public key to defend against rogue CAs, its risk of bricking on rotation, and why it is mostly used in mobile apps. Also cover TLS 1.3 dropping RSA key exchange and requiring PFS, deprecating old TLS versions, automating cert renewal, and pinning the SPKI rather than the cert.

**Answer:** TLS 1.3 handshake: ClientHello (ciphers, key share) → ServerHello (chosen cipher, key share, cert) → Finished — 1 RTT, 0-RTT for resumption. Verifies server identity via certificate chain to a trusted CA. Cert pinning binds an app to specific cert/public key — defends against rogue CAs but risks bricking on rotation. Mostly for mobile apps; less common on backend.

**Key points:**
- TLS 1.3 drops RSA key exchange, requires PFS.
- Use modern cipher suites; deprecate TLS 1.0/1.1.
- Automate cert renewal (Let's Encrypt, ACM); expirations cause outages.
- Pin public-key SPKI, not the cert, for safer rotation.

---

### 66. Secrets management (Vault, KMS)

**Frequency:** Medium

**Question:** Explain how to manage secrets properly. Cover why secrets must not live in code, repos, or committed env files, and the role of a secrets manager (Vault, AWS Secrets Manager, GCP Secret Manager) providing versioning, rotation, audit, and dynamic short-lived credentials. Explain how KMS handles encryption keys via envelope encryption, where a KMS-managed data key encrypts data and KMS encrypts the data key. Also address rotating secrets on schedule and on personnel changes, auditing every access, injecting secrets at runtime rather than baking into images, and preferring IAM roles over long-lived keys.

**Answer:** Don't store secrets in code, repos, or env files committed anywhere. Use a secrets manager (Vault, AWS Secrets Manager, GCP Secret Manager) that supports versioning, rotation, audit, and dynamic secrets (short-lived DB creds). KMS handles encryption keys — envelope encryption: data key from KMS encrypts data, KMS encrypts the data key.

**Key points:**
- Rotate secrets on a schedule and on personnel changes.
- Audit log every access.
- Inject at runtime (sidecar, init container), not bake into images.
- IAM roles > long-lived API keys whenever possible.

---

### 67. OWASP Top 10

**Frequency:** Medium

**Question:** Describe the OWASP Top 10 and how you would use it. List the categories it ranks (Broken Access Control, Cryptographic Failures, Injection, Insecure Design, Security Misconfiguration, Vulnerable and Outdated Components, Identification and Authentication Failures, Software and Data Integrity Failures, Security Logging and Monitoring Failures, and SSRF) and explain that it is a baseline checklist, not a limit. Highlight why Broken Access Control (IDOR and missing checks) is #1, patching vulnerable dependencies, SSRF defenses, and defense in depth.

**Answer:** The OWASP Top 10 ranks the most critical web security risks: Broken Access Control, Cryptographic Failures, Injection, Insecure Design, Security Misconfiguration, Vulnerable Components, Identification/Authentication Failures, Software/Data Integrity Failures, Security Logging/Monitoring Failures, SSRF. Use it as a baseline checklist, not the limit.

**Key points:**
- Broken Access Control is #1 — IDOR and missing checks are everywhere.
- Patch dependencies (Dependabot/Renovate) — vulnerable components are common.
- SSRF defense: deny-list metadata IPs, restrict outbound, validate URLs.
- Defense in depth: WAF + framework defaults + code review + scans.

---

### 68. CSRF on APIs vs forms

**Frequency:** Medium

**Question:** Explain CSRF and how it differs between cookie-based and token-based APIs. Describe how CSRF tricks an authenticated user's browser into unwanted requests, why cookie-based session auth needs CSRF tokens (synchronizer pattern) or SameSite=Lax/Strict cookies, and why bearer-token APIs using the Authorization header are not CSRF-vulnerable because browsers do not auto-attach the header, while mixed auth still needs protection. Also cover the double-submit cookie pattern, not accepting state-changing GETs, and why CORS alone is not a CSRF defense.

**Answer:** CSRF tricks an authenticated user's browser into making an unwanted request. Cookie-based session auth needs CSRF tokens (synchronizer pattern) or `SameSite=Lax/Strict` cookies. Bearer-token APIs (Authorization header) aren't CSRF-vulnerable because browsers don't auto-attach the header. Mixed auth (cookies + bearer) still needs protection.

**Key points:**
- `SameSite=Lax` is the modern default and stops most CSRF.
- Double-submit cookie pattern for stateless CSRF protection.
- Don't accept state-changing requests via GET.
- CORS prevents reading responses, not making requests — not a CSRF defense alone.

---

### 69. Rate limiting & abuse detection

**Frequency:** Medium

**Question:** Explain how to design layered rate limiting and abuse detection. Describe applying limits at multiple layers (per-IP at the edge/gateway, per-API-key at the app, per-route for expensive endpoints, and per-user for sensitive operations like login and password reset) and detecting abuse via anomalies such as spikes from new IPs, failed-login surges, and unusual user agents, paired with CAPTCHA, exponential backoff, and account lockouts. Also cover distinguishing rate from concurrency, returning X-RateLimit-* headers, logging denied requests, and providing a quota-uplift path for legitimate bursts.

**Answer:** Layer limits: per-IP at the edge (gateway), per-API-key at the app, per-route for expensive endpoints, per-user for sensitive ops (login, password reset). Detect abuse via anomalies: spikes from new IPs, failed-login surges, unusual user agents. Pair with CAPTCHA, exponential backoff, and account lockouts where appropriate.

**Key points:**
- Distinguish "rate" (per second) from "concurrency" (in-flight).
- Always include limits in error responses (`X-RateLimit-*`).
- Log denied requests for forensics.
- Account for legitimate burst traffic and provide a quota uplift path.

---

### 70. Structured logging & correlation IDs

**Frequency:** Medium

**Question:** Explain structured logging and correlation IDs. Cover emitting logs as JSON or logfmt with consistent fields (timestamp, level, service, trace_id, span_id, user_id, request_id), and how a correlation ID generated at the edge and propagated through downstream calls lets you stitch a single request across services, ideally reusing the OpenTelemetry trace_id. Also address one log line per important event, not logging secrets or PII, using log levels honestly (error should page), and centralizing logs with an appropriate retention cost tradeoff.

**Answer:** Emit logs as JSON (or logfmt) with consistent fields: timestamp, level, service, trace_id, span_id, user_id, request_id. A correlation ID generated at the edge and propagated through all downstream calls lets you stitch a single user request across services. Use the OTel trace_id as the correlation ID where possible.

**Key points:**
- One log line per important event; avoid unstructured `printf`.
- Don't log secrets/PII; scrub at the source.
- Use levels honestly: `error` should page someone.
- Centralize (ELK, Loki, Datadog) and retain at the right cost tradeoff.

---

### 71. Tracing: OTel spans & sampling

**Frequency:** Medium

**Question:** Explain distributed tracing with OpenTelemetry. Describe a trace as a tree of spans, each an operation with start/end timestamps and attributes, and OTel as the vendor-neutral instrumentation standard. Explain the sampling strategies for controlling cost: head-based (decide at the root, cheap but blind) versus tail-based (decide after the full trace, keeping errors and slow traces), and typical 1-5% head sampling plus always-on-error. Also cover the W3C traceparent header, auto- versus custom instrumentation, keeping span attributes low-cardinality, and correlating traces with logs and metrics.

**Answer:** A trace is a tree of spans, each representing an operation with start/end timestamps and attributes. OpenTelemetry is the vendor-neutral standard for instrumentation. Sampling controls cost: head-based (decide at root) is cheap but blind; tail-based (decide after seeing the full trace) keeps errors and slow traces. 1-5% head sampling + always-on-error is typical.

**Key points:**
- W3C `traceparent` header propagates context across services.
- Auto-instrumentation covers HTTP, DB, queues; supplement with custom spans on hot paths.
- Span attributes: keep low cardinality to avoid backend explosion.
- Pair traces with logs (shared trace_id) and metrics (exemplars).

---

### 72. Health checks: liveness/readiness/startup

**Frequency:** Medium

**Question:** Explain the three types of Kubernetes health checks: (1) liveness ('is the process alive?', restart if false), (2) readiness ('should I receive traffic?', remove from the load balancer if false, e.g. DB unreachable or still warming up), and (3) startup ('has init finished?', gating liveness/readiness during slow boots). Explain why liveness should stay shallow while readiness checks real dependencies (with circuit breakers rather than full fan-out), and why tying liveness to downstream causes restart loops during outages.

**Answer:** Liveness: "is the process alive?" — restart if false. Readiness: "should I receive traffic?" — remove from LB if false (e.g., DB unreachable, warming up). Startup: "has init finished?" — gates liveness/readiness during slow boots. Keep liveness shallow (process responds); readiness checks real dependencies (with circuit breakers, not full fan-out).

**Key points:**
- Liveness failures cause restarts — keep them dumb to avoid cascades.
- Readiness flips on DB/queue outages so traffic drains.
- Don't tie liveness to downstream — you'll restart-loop during outages.
- Startup probes prevent premature kills of slow-booting apps.

---

### 73. Graceful shutdown

**Frequency:** Medium

**Question:** Explain how to implement graceful shutdown. Walk through handling SIGTERM by stopping acceptance of new connections, finishing in-flight requests, draining queues, closing DB pools, and then exiting, and how this fits Kubernetes sending SIGTERM, waiting terminationGracePeriodSeconds, then SIGKILL. Explain coordinating with readiness by flipping ready=false first so the LB stops routing and sleeping briefly before draining. Also cover HTTP servers waiting on a wait group with a timeout, workers stopping new jobs and committing offsets/acks, always setting a max drain timeout, and testing with SIGTERM in staging.

**Answer:** On SIGTERM: stop accepting new connections, finish in-flight requests, drain queues, close DB pools, then exit. K8s sends SIGTERM, waits `terminationGracePeriodSeconds`, then SIGKILL. Coordinate with readiness: flip ready=false first so the LB stops routing, sleep briefly for in-flight LBs to notice, then drain.

**Key points:**
- HTTP servers: stop listener, wait on a wait group, timeout fallback.
- Workers: stop pulling new jobs, finish current, commit offsets/acks.
- Always set a max drain timeout — hanging shutdowns hurt deploys.
- Test by sending SIGTERM in staging and verifying clean exit.

---

### 74. DB migrations in CI/CD

**Frequency:** Medium

**Question:** Explain how to run database migrations safely in CI/CD. Cover why migrations must be backward-compatible with the previous app version (the expand/contract pattern), running them in CI before deploy or as a pre-deploy job, and common tools (Flyway, Liquibase, Alembic, Django migrations, golang-migrate, Atlas), keeping them reviewable, versioned, and tested against a prod-shaped dataset. Also address never being destructive in the same release that deploys code needing the old shape, using online tooling for long migrations, preferring roll-forward over rollback, and running migration jobs separately from app pods to avoid races.

**Answer:** Migrations must be backward-compatible with the previous app version (expand/contract). Run migrations in CI before deploy, or as a pre-deploy job. Tools: Flyway, Liquibase, Alembic, Django migrations, golang-migrate, Atlas. Always reviewable, versioned, idempotent-ish, and tested against a copy of prod data shape.

**Key points:**
- Never destructive in the same release that deploys code requiring the old shape.
- Long migrations need online tooling (pt-osc, gh-ost, pg_repack).
- Roll forward — rolling back migrations is painful.
- Run migration jobs separately from app pods to avoid races.

---

### 75. Feature flags & dark launches

**Frequency:** Medium

**Question:** Explain feature flags and dark launches. Describe how feature flags decouple deploy from release by shipping code dark and enabling it per user, segment, or percentage, enabling canaries, A/B tests, kill switches, and gradual rollouts, and how dark launches send real traffic to new code paths while discarding results to verify performance and correctness before user exposure. Cover tiering flags (release, experiment, ops/kill switch, permission), cleaning up stale flag debt, defaulting to a safe state, and pairing every flag with a metrics dashboard for blast-radius detection.

**Answer:** Feature flags decouple deploy from release: ship code dark, enable per user/segment/percentage. Enables canaries, A/B tests, kill switches, and gradual rollouts. Dark launches send real traffic to new code paths but discard results — verify performance and correctness before user exposure. LaunchDarkly, Unleash, ConfigCat, or homegrown.

**Key points:**
- Tier flags: release (short-lived), experiment, ops (kill switch), permission.
- Clean up stale flags — flag debt is real.
- Default state should be safe (off / old behavior).
- Combine with metrics: every flag has a dashboard for blast-radius detection.

---

### 76. Filtering/sorting/sparse fieldsets

**Frequency:** Low

**Question:** Explain how to design filtering, sorting, and sparse fieldsets for an API: (1) how to standardize and document a filter syntax with allowed fields and operators (equality, ranges, IN, full-text) without leaking arbitrary SQL, (2) how to restrict sort fields to indexed columns and cap page size/complexity to prevent expensive scans and abuse, and (3) how sparse fieldsets (?fields=id,name) reduce payloads, plus safety practices like whitelisting fields, rejecting unknown ones loudly, and using prepared statements instead of interpolating values.

**Answer:** Standardize a filter syntax (`?status=active&created_at[gte]=...`) and document allowed fields and operators — never let arbitrary SQL leak through. Restrict sort fields to indexed columns to prevent expensive scans. Sparse fieldsets (`?fields=id,name`) reduce payload and let clients opt out of expensive subresources; GraphQL gets this for free.

**Key points:**
- Whitelist filter/sort fields; reject unknown ones loudly.
- Cap page size and complexity to prevent abuse.
- Document operator semantics: equality, ranges, IN, full-text.
- Use prepared statements; never interpolate filter values.

---

### 77. HATEOAS — when worth it

**Frequency:** Low

**Question:** Explain HATEOAS and when it is worth adopting: (1) describe what it means to embed links to next actions so clients discover capabilities dynamically, (2) discuss why it rarely pays off in practice since most clients are hand-coded against fixed URLs, and where it does shine (long-lived public APIs with diverse or generic clients, and state-machine resources with varying transitions), and (3) mention standardizing link formats with HAL or JSON:API and the distinction between REST and HATEOAS.

**Answer:** HATEOAS embeds links to next actions in responses so clients discover capabilities dynamically. In practice few clients consume hypermedia — they're hand-coded against fixed URLs — so the overhead rarely pays off. It shines for long-lived public APIs with diverse clients (e.g., PayPal) and for state-machine resources where allowed transitions vary.

**Key points:**
- Use it when client/server evolve independently and clients are generic.
- Skip it for internal services or single-team APIs.
- HAL and JSON:API standardize link formats.
- Don't confuse "REST" with "HATEOAS" — Roy Fielding does, the industry mostly doesn't.

---

### 78. CTEs & recursive queries

**Frequency:** Low

**Question:** Explain Common Table Expressions (CTEs) and recursive queries: (1) what a CTE is and how it aids reuse and readability, (2) the Postgres optimization-fence behavior before version 12 versus inlining by default from 12 unless MATERIALIZED, and (3) how recursive CTEs walk trees/graphs using WITH RECURSIVE (base UNION ALL recursive ref), the risk of infinite loops and using depth limits, when to use MATERIALIZED, how window functions can replace CTEs more efficiently, and when to reach for a graph DB instead.

**Answer:** A Common Table Expression names a subquery for reuse and readability. In Postgres pre-12, CTEs were optimization fences; from 12 they inline by default unless `MATERIALIZED`. Recursive CTEs walk trees/graphs (e.g., org hierarchies, comment threads). Watch for infinite loops — use depth limits.

**Key points:**
- Recursive CTE: `WITH RECURSIVE t AS (base UNION ALL recursive ref)`.
- Use `MATERIALIZED` when reusing a heavy subquery multiple times.
- Window functions often replace CTEs more efficiently.
- Don't recurse deeply on huge graphs — use a graph DB.

---

### 79. JSON columns in Postgres

**Frequency:** Low

**Question:** Explain using JSON columns in Postgres: (1) what jsonb offers (binary storage, GIN indexing, operators like ->, ->>, @>) and good use cases such as sparse, schema-flexible attributes, (2) why it should not be your primary modeling tool given the loss of constraints and join efficiency, and how jsonb compares to json, and (3) practical techniques like GIN indexes with jsonb_path_ops for containment, expression indexes on extracted fields, partial updates with jsonb_set and || (which rewrite the whole value), and validating shape with CHECK constraints.

**Answer:** `jsonb` stores binary JSON with indexing (GIN) and operators (`->`, `->>`, `@>`). Use for sparse, schema-flexible attributes (tags, settings, audit payloads). Don't use as a primary modeling tool — you lose constraints and join efficiency. `json` (text) is rarely preferred; `jsonb` deduplicates keys and supports more operators.

**Key points:**
- GIN index on `jsonb_path_ops` for containment queries.
- Expression indexes on extracted fields for equality lookups.
- `jsonb_set`, `||` for partial updates — entire value is rewritten.
- Validate shape with `CHECK (jsonb_typeof(col->'x') = 'number')`.

---

### 80. Wide-column partition keys

**Frequency:** Low

**Question:** Explain partition key design in wide-column stores like Cassandra and DynamoDB: (1) how the partition key determines which node owns the data and bounds the rows scanned together, and how to pick one with high cardinality and matching query patterns, (2) the role of clustering/sort keys for ordering rows within a partition for range scans, and the danger of hot partitions from sequential or low-cardinality keys, and (3) modeling guidance such as query-first design per access pattern, composite partition keys to spread load, partition size caps, and why secondary indexes are expensive and often denormalized away.

**Answer:** In Cassandra/DynamoDB the partition key determines which node owns the data and bounds the rows scanned together. Pick a key with high cardinality (even distribution) and matching your query patterns. Clustering/sort keys order rows within a partition for range scans. Hot partitions kill performance — avoid sequential or low-cardinality keys.

**Key points:**
- "Query first, model second" — design tables per access pattern.
- Composite partition keys spread load (`(tenant_id, day)`).
- Partition size cap (~100MB in Cassandra, 10GB item collection in DDB).
- Secondary indexes are expensive and often denormalized away.

---

### 81. Search engines as non-primary DB

**Frequency:** Low

**Question:** Explain using a search engine like Elasticsearch/OpenSearch as a non-primary database: (1) what they excel at (full-text, faceted, and analytics queries) and why they should not be a source of truth given eventual consistency, easier data loss, and no transactions, (2) the pattern of using them as a secondary index fed by CDC or a queue from the primary DB, and (3) operational practices such as never making ES the only copy of writes, zero-downtime reindexing via alias swap, tuning analyzers per language, and watching shard sizing.

**Answer:** Elasticsearch/OpenSearch and similar excel at full-text, faceted, and analytics queries — not at being a source of truth. They're eventually consistent, lose data more easily, and have no transactions. Use them as a secondary index fed by CDC or a queue from your primary DB.

**Key points:**
- Never make ES the only copy of writes.
- Reindex strategies: alias swap for zero-downtime mapping changes.
- Tune analyzers per language; default stemmers are crude.
- Watch shard sizing (10-50GB/shard); too many shards kills cluster perf.

---

### 82. Time-series DBs (InfluxDB/Timescale)

**Frequency:** Low

**Question:** Explain time-series databases like InfluxDB and Timescale: (1) the characteristics of time-series workloads (append-heavy writes, time-ordered reads, retention policies, downsampling), (2) how specialized stores compress timestamps and run-length encode values for space savings and offer continuous aggregates, with Timescale being a Postgres extension for SQL users, and (3) considerations such as high write throughput with cheap time-range scans, continuous aggregates/downsampling reducing storage, built-in TTL/retention, and when plain Postgres suffices versus when specialized stores are needed at billions of points.

**Answer:** Time-series workloads have append-heavy writes, time-ordered reads, retention policies, and downsampling. Specialized stores (InfluxDB, Timescale, Prometheus) compress timestamps and run-length encode values for huge space savings, plus offer continuous aggregates. Timescale is a Postgres extension — great when you want SQL.

**Key points:**
- High write throughput + cheap range scans by time.
- Continuous aggregates / downsampling reduce storage.
- TTL/retention policies built-in.
- Postgres alone is fine for low millions of points; specialized at billions.

---

### 83. Graph DBs (Neo4j)

**Frequency:** Low

**Question:** Explain graph databases like Neo4j: (1) how they store nodes and edges as first-class citizens so traversals are O(neighbors) instead of join-heavy O(table size), (2) the use cases where they shine (fraud detection, recommendations, social graphs, knowledge graphs, dependency analysis, and relationships dominating queries beyond ~3 hops) and their query languages (Cypher, Gremlin, SPARQL), and (3) when not to use them (simple lookups where relational is faster), why native graph storage matters for traversal speed, and naming alternatives like Neptune, JanusGraph, ArangoDB, and Memgraph.

**Answer:** Graph DBs store nodes and edges as first-class citizens — traversals are O(neighbors) instead of join-heavy O(table size). Use for fraud detection, recommendations, social graphs, knowledge graphs, and dependency analysis. Cypher / Gremlin / SPARQL are the query languages.

**Key points:**
- Best when relationships dominate queries (depth > 3 hops).
- Don't use for simple lookups — relational is faster and simpler.
- Native graph storage matters for traversal speed.
- AWS Neptune, JanusGraph, ArangoDB, Memgraph are alternatives.

---

### 84. Redis persistence: RDB vs AOF

**Frequency:** Low

**Question:** Compare Redis persistence options RDB and AOF: (1) explain how RDB periodic snapshots work (compact, fast restart, but lose writes since the last snapshot) versus AOF command logging (durable to the fsync interval, slower restart, larger files compacted by background rewrites), (2) why production often runs both, and (3) tuning and operational points such as appendfsync everysec being the default sweet spot, snapshot forking causing copy-on-write memory spikes, disabling persistence for pure caches, and the replicas + AOF + RDB durable triple.

**Answer:** RDB takes periodic snapshots — compact, fast restart, but loses writes since last snapshot. AOF logs every command — durable down to fsync interval (every second by default), slower restart, larger files (background rewrites compact). Production usually runs both: AOF for durability, RDB for fast restore and backups.

**Key points:**
- `appendfsync everysec` is the default sweet spot.
- Snapshots fork the process — memory copy-on-write spikes.
- For pure cache, disable persistence entirely.
- Replicas + AOF + RDB is the durable triple.

---

### 85. Bloom filters in caching

**Frequency:** Low

**Question:** Explain Bloom filters in the context of caching: (1) what a Bloom filter is as a probabilistic set that answers definitely-not-in-set or probably-in-set with a tunable false-positive rate using a tiny bitmap, (2) good use cases such as skipping cache/DB lookups for keys known to be absent (e.g., is this username taken, have we crawled this URL), noting that false positives merely waste a lookup while false negatives never happen, and (3) properties and caveats such as space efficiency (bits per element), the inability to delete without counting Bloom or cuckoo filters, their internal use in Cassandra/RocksDB for SSTable lookups, and sizing for expected n and acceptable false-positive p.

**Answer:** A Bloom filter is a probabilistic set: tells you "definitely not in set" or "probably in set" with tunable false-positive rate, using a tiny bitmap. Great for skipping cache/DB lookups for keys known absent (e.g., "is this username taken?", "do we have this URL crawled?"). False positives waste a lookup; false negatives never happen.

**Key points:**
- Space-efficient — bits per element, not full keys.
- Can't delete (use counting Bloom or cuckoo filter).
- Cassandra/RocksDB use Bloom filters internally for SSTable lookups.
- Size for expected n + acceptable false-positive p.

---

### 86. Lock-free / CAS

**Frequency:** Low

**Question:** Explain compare-and-swap (CAS) and how it underpins lock-free data structures. Cover the benefits over lock contention, the reasons lock-free code is hard to get right (the ABA problem and memory ordering), the distinction between lock-free and wait-free, why high contention can make CAS slower than locks, and why you should generally rely on library-provided atomics or proven structures rather than rolling your own.

**Answer:** Compare-and-swap atomically updates a value if it matches the expected one — the basis of lock-free data structures. Avoids lock contention but is fiendishly hard to write correctly (ABA problem, memory ordering). Use library-provided atomics (`atomic.Int64`, `AtomicReference`) or proven structures (concurrent maps); roll your own only with extreme care.

**Key points:**
- Lock-free ≠ wait-free; some threads can still stall.
- Memory model rules (acquire/release/seq_cst) matter on weak architectures.
- High contention can make CAS slower than locks (retries).
- Profile before optimizing — locks are usually fine.

---

### 87. Outbox pattern

**Frequency:** Low

**Question:** Explain the outbox pattern and the dual-write inconsistency problem it solves between a database and a message broker. Walk through inserting into an outbox table within the same transaction that updates business state, and how a separate relay (a poller or CDC tool like Debezium) publishes those rows and marks them sent. Cover why this yields at-least-once delivery aligned with DB commits, why consumers must still be idempotent, and how to keep the outbox table small.

**Answer:** Avoids dual-write inconsistency between DB and message broker. In the same transaction that updates business state, insert into an `outbox` table. A separate relay (poller or CDC like Debezium) publishes outbox rows to the broker and marks them sent. Guarantees at-least-once delivery aligned with DB commits.

**Key points:**
- Eliminates "DB committed but message lost" / "message sent but DB rolled back".
- Pair with idempotent consumers (dupes are expected).
- CDC-based relay scales better than polling.
- Add a `processed_at` or move-to-archive to keep outbox small.

---

### 88. 2PC — why avoided

**Frequency:** Low

**Question:** Explain how two-phase commit (2PC) works, with a coordinator asking participants to prepare and then committing or aborting based on votes. Then explain why it is generally avoided: indefinite blocking if the coordinator fails mid-protocol, poor scalability, and tight coupling of service availability. Discuss how 3PC attempts to reduce blocking, why 2PC support across heterogeneous DBs and brokers is poor, and why sagas plus outbox are usually preferred for cross-service consistency.

**Answer:** Two-phase commit: a coordinator asks all participants to prepare, then commits or aborts based on votes. Provides atomic distributed transactions but blocks indefinitely if the coordinator fails mid-protocol, doesn't scale, and couples service availability. Modern systems prefer sagas + outbox for cross-service consistency.

**Key points:**
- 3PC reduces blocking but adds complexity and assumes synchrony.
- Across heterogeneous DBs/brokers, 2PC support is poor.
- Single-DB transactions are still the right answer when possible.
- Sagas trade ACID for available eventual consistency.

---

### 89. Paxos/Raft basics

**Frequency:** Low

**Question:** Explain the basics of consensus algorithms like Paxos and Raft and what problem they solve. Focus on Raft as the more understandable one: leader election by majority, all writes flowing through the leader and replicating to followers, and commit on majority acknowledgment. Cover the fault tolerance of (N-1)/2 failures, why odd cluster sizes are used, how quorum reads/writes give linearizability, the leader write bottleneck, and where these algorithms are used, plus how Paxos differs.

**Answer:** Consensus algorithms ensuring a cluster agrees on a value despite failures. Raft is the more understandable: a leader is elected by majority, all writes go through the leader, replicated to followers, committed when majority acks. Used in etcd, Consul, CockroachDB, TiKV, Kafka KRaft. Tolerates `(N-1)/2` failures with N nodes.

**Key points:**
- Always odd cluster sizes (3, 5, 7) for clean majorities.
- Quorum reads/writes ensure linearizability.
- Leader bottleneck for writes; sharding spreads load.
- Paxos is older, formally proven, harder to implement.

---

### 90. Vector clocks & CRDTs

**Frequency:** Low

**Question:** Explain vector clocks and CRDTs. Describe how vector clocks track causal ordering with per-node counters merged max-wise to distinguish concurrent from causal updates, and how they grow with cluster size (and how version vectors prune them). Then explain how CRDTs (Conflict-free Replicated Data Types) such as counters, sets, and maps merge deterministically without coordination, the state-based versus operation-based split, and why they suit offline-first and multi-master setups.

**Answer:** Vector clocks track causal ordering: each node has a counter, included in every message; recipients merge max-wise. Detect concurrent vs causal updates, enabling conflict-aware merges. CRDTs (Conflict-free Replicated Data Types) — counters, sets, maps — merge deterministically without coordination, used in collaborative editing (Figma, Riak).

**Key points:**
- Vector clocks grow with cluster size — version vectors / dotted version vectors prune.
- CRDTs split into state-based (CvRDT) and operation-based (CmRDT).
- Eventual consistency without coordination overhead.
- Great for offline-first apps and multi-master setups.

---

### 91. Clock skew, NTP, logical clocks

**Frequency:** Low

**Question:** Explain the challenges of time in distributed systems: physical clock drift, what NTP does and its limits, and why you should not use wall-clock time to order distributed events. Contrast logical clocks (Lamport timestamps for total order, vector clocks for causal order) and describe how Google's TrueTime uses GPS and atomic clocks with bounded uncertainty that Spanner waits out. Also touch on leap seconds, hybrid logical clocks, and running NTP/chrony on servers.

**Answer:** Physical clocks drift; NTP keeps them within ms but not perfect. Don't use wall-clock for ordering distributed events — use logical clocks (Lamport timestamps for total order, vector clocks for causal). For absolute ordering across regions, Google's TrueTime uses GPS+atomic clocks with bounded uncertainty (Spanner waits out the uncertainty).

**Key points:**
- Leap seconds break naive timestamp logic.
- Hybrid logical clocks combine wall + logical for "good enough" ordering.
- Always run NTP/chrony on servers.
- Don't compare timestamps across nodes for correctness-critical decisions.

---

### 92. Python: pip vs poetry vs uv; lock files

**Frequency:** Low

**Question:** Compare Python packaging and dependency tools: (1) pip (with pip-tools for lock files), (2) Poetry with dependency resolution, lock file, virtual env, and packaging, and (3) uv, the Rust-based faster replacement with uv.lock and pyproject.toml. Explain why committing a lock file matters for reproducibility, the role of pyproject.toml (PEP 621), why you should avoid bare pip install without a constraints file in CI, and how you would choose a tool today.

**Answer:** `pip` installs from PyPI; `pip-tools` adds lock files (`requirements.txt` pinned). Poetry adds dependency resolution, lock file, virtual env, and packaging. `uv` (Astral) is a Rust-based pip/poetry replacement, 10-100x faster, with `uv.lock` and `pyproject.toml`. Modern default: `uv` for speed, Poetry for mature ecosystems.

**Key points:**
- Always commit a lock file for reproducibility.
- `pyproject.toml` (PEP 621) is the standard project metadata.
- Avoid `pip install` without a constraints file in CI.
- `uv` is rapidly becoming the de facto choice in 2026.

---

### 93. Python: WSGI vs ASGI; gunicorn vs uvicorn

**Frequency:** Low

**Question:** Explain the difference between WSGI and ASGI in Python and how it maps to server choices. Cover WSGI as the synchronous, one-request-per-worker interface (Flask, older Django) versus ASGI as the async interface (FastAPI, Starlette, Django 3+) supporting websockets and concurrent requests, and contrast gunicorn (pre-forked WSGI workers) with uvicorn (an ASGI server), including the common production setup of gunicorn supervising uvicorn workers. Also touch on worker sizing, HTTP/2 and HTTP/3 via Hypercorn, and not running dev servers in production.

**Answer:** WSGI is the sync interface (Flask, Django pre-3) — one request per worker. ASGI is async (FastAPI, Starlette, Django 3+) — supports websockets and concurrent requests per worker. Gunicorn is a WSGI server with pre-forked workers; uvicorn is an ASGI server (libuv-backed). Production: gunicorn supervising uvicorn workers (`-k uvicorn.workers.UvicornWorker`).

**Key points:**
- ASGI is required for websockets/SSE/HTTP/2.
- Sizing: `workers = 2*cores+1` for sync; fewer for async.
- Hypercorn supports HTTP/2 and HTTP/3.
- Don't run dev servers (`flask run`, `uvicorn --reload`) in prod.

---

### 94. Java virtual threads (Loom)

**Frequency:** Low

**Question:** Explain Java virtual threads (Project Loom, GA in JDK 21). Describe how they are lightweight and scheduled by the JVM onto a small pool of carrier threads, so you can write ordinary blocking code (Thread.sleep, blocking I/O) and the JVM unmounts the virtual thread rather than blocking an OS thread, letting thread-per-request servlet or Spring-style code scale to millions of concurrent requests. Cover how to create them, the pinning issue with synchronized versus ReentrantLock, and why you should not pool them.

**Answer:** JDK 21 GA. Virtual threads are lightweight (KBs), scheduled by the JVM onto a small pool of carrier threads. Write blocking code (`Thread.sleep`, blocking I/O) and the JVM unmounts the virtual thread instead of blocking the OS thread. Lets servlet/Spring-style code scale to millions of concurrent requests without async rewrites.

**Key points:**
- `Thread.ofVirtual().start(...)` or `Executors.newVirtualThreadPerTaskExecutor()`.
- `synchronized` blocks pin the carrier — prefer `ReentrantLock` in hot paths (pinning is being fixed).
- Don't pool virtual threads — they're cheap, create per-task.
- Game-changer for "thread per request" servers.

---

### 95. JVM tuning basics

**Frequency:** Low

**Question:** Walk through the basics of JVM tuning. Cover setting -Xms equal to -Xmx with headroom for native/off-heap memory, picking a GC by goal (G1 default, ZGC for low pause), enabling GC logs and heap dump on OOM, and using -XX:+UseContainerSupport so the JVM respects cgroup limits. Also address measuring before tuning, using JFR/Mission Control or async-profiler for real diagnosis, watching off-heap memory like DirectByteBuffers and metaspace, and sizing container memory above -Xmx plus native plus headroom.

**Answer:** Set `-Xms = -Xmx` to a value that fits the workload, leaving headroom for native/off-heap. Pick GC by goal (G1 default, ZGC for low pause). Enable GC logs and a heap dump on OOM (`-XX:+HeapDumpOnOutOfMemoryError`). Use `-XX:+UseContainerSupport` in containers (default since 8u191) so the JVM sees cgroup limits.

**Key points:**
- Measure before tuning; defaults are good.
- JFR + Mission Control / async-profiler for real diagnosis.
- Watch off-heap (DirectByteBuffers, metaspace) for "where did my RAM go".
- Container memory must exceed `-Xmx` + native + headroom (~25%).

---

### 96. Node.js streams & backpressure

**Frequency:** Low

**Question:** Explain how Node.js streams work and how they handle backpressure. Cover the readable, writable, duplex, and transform stream types, how pipe() and pipeline() propagate backpressure when a writable's buffer exceeds highWaterMark (write() returning false and the reader pausing), and why pipeline() is preferred over manual pipe() for error cleanup. Also address async iterators as the modern consumer, the Web Streams API for cross-runtime code, streaming files rather than buffering, and object-mode streams.

**Answer:** Streams process data incrementally — readable, writable, duplex, transform. `pipe()` and `pipeline()` propagate backpressure: when a writable's internal buffer exceeds `highWaterMark`, `write()` returns false and the reader pauses. Use `pipeline()` (with cleanup on error) over manual `pipe()`.

**Key points:**
- Async iterators (`for await`) are the modern stream consumer.
- Web Streams API mirrors WHATWG for cross-runtime code.
- Don't buffer entire files in memory — stream them.
- Object-mode streams pass objects, not bytes.

---

### 97. Spring Boot vs Quarkus vs Micronaut

**Frequency:** Low

**Question:** Compare Spring Boot, Quarkus, and Micronaut as Java frameworks. Explain Spring Boot as the incumbent with a vast ecosystem but runtime reflection-based DI/AOP, slower startup, and heavier memory, versus Quarkus and Micronaut doing compile-time DI/AOP for fast startup and low memory suited to serverless and containers, all with GraalVM native-image support (including Spring Boot 3 AOT). Cover how you would choose, the tradeoffs of native images, reactive support, and migration difficulty.

**Answer:** Spring Boot is the incumbent — vast ecosystem, runtime DI/AOP via reflection, slower startup, heavier memory. Quarkus and Micronaut do compile-time DI/AOP, slashing startup and memory — great for serverless and containers. Both support GraalVM native images for ms startup. Spring Boot 3 + AOT brings native support too.

**Key points:**
- Pick Spring for ecosystem maturity, Quarkus/Micronaut for cloud-native.
- Native images: tiny memory, slow build, reflection caveats.
- All three support reactive (Mutiny, Reactor, RxJava).
- Migration between them is non-trivial.

---

### 98. Express vs Fastify vs NestJS

**Frequency:** Low

**Question:** Compare Express, Fastify, and NestJS for Node.js. Explain Express as minimal, ubiquitous, and mature but slower; Fastify as schema-based, roughly twice as fast, with JSON-Schema validation and a plugin model; and NestJS as opinionated with Angular-style modules, decorators, and DI running atop Express or Fastify, best for large structured team codebases. Cover how you would choose by team and scale, the shared support for async/await and middleware/hooks, and newer cross-runtime alternatives like Hono.

**Answer:** Express: minimal, ubiquitous, mature middleware ecosystem, slower. Fastify: schema-based, ~2x faster than Express, JSON-Schema validation, plugin model. NestJS: opinionated, Angular-style modules/decorators/DI, runs on Express or Fastify — best for large team codebases that want structure. Pick by team and scale.

**Key points:**
- Fastify wins benchmarks; Express wins familiarity.
- NestJS adds structure but heavier learning curve.
- All three support async/await and middleware/hooks.
- Hono is a newer cross-runtime alternative (Workers, Bun, Deno, Node).

---

### 99. mTLS

**Frequency:** Low

**Question:** Explain mutual TLS (mTLS): both client and server presenting and verifying certificates. Describe its use for service-to-service authentication in zero-trust networks, replacing or augmenting API keys, and how service meshes like Istio and Linkerd automate cert issuance and rotation via SPIFFE/SPIRE. Explain why it is stronger than bearer tokens (possession bound to a private key), and cover the hard part of cert lifecycle automation, short-lived certs, SPIFFE IDs for workload identity, and offloading mTLS to TLS terminators like Envoy.

**Answer:** Mutual TLS — both client and server present certificates, each verifies the other. Used for service-to-service auth in zero-trust networks, replacing or augmenting API keys. Service meshes (Istio, Linkerd) automate cert issuance and rotation via SPIFFE/SPIRE. Stronger than bearer tokens because possession is bound to a private key on the host.

**Key points:**
- Cert lifecycle (issue, rotate, revoke) is the hard part — automate.
- Short-lived certs (hours) limit blast radius.
- Pair with SPIFFE IDs for stable workload identity.
- TLS terminators (Envoy) handle mTLS so apps don't have to.

---

### 100. Metrics: RED vs USE

**Frequency:** Low

**Question:** Compare the RED and USE methods for metrics and when to apply each. Explain RED for request-driven services (Rate, Errors, Duration) and USE for resources (Utilization, Saturation, Errors), and why you should track histograms and percentiles rather than just averages so that p99 tail latency is visible. Also cover using Prometheus histogram_quantile for percentile queries, avoiding high-cardinality labels like user IDs, alerting on SLO burn rate rather than raw thresholds, and building golden-signal dashboards per service.

**Answer:** RED for request-driven services: Rate (req/s), Errors (err/s or %), Duration (latency distribution). USE for resources: Utilization, Saturation, Errors. Use RED for APIs, USE for CPUs/disks/queues. Always track histograms/percentiles, not just averages — p99 reveals tail latency that means catch fires.

**Key points:**
- Histograms enable percentile queries downstream (Prometheus `histogram_quantile`).
- High-cardinality labels (user IDs) blow up cardinality — avoid.
- Alert on SLO burn rate, not raw thresholds.
- Dashboards per service: golden signals (RED + saturation).
