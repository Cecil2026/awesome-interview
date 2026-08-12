# Backend Interview Questions

100 high-frequency backend questions covering API design, databases (SQL/NoSQL), caching, messaging, concurrency, security, languages (Python/Go/Java/Node), and operations.

---

### 1. REST vs RPC vs GraphQL vs gRPC

**Frequency:** High

**Question:** Compare REST, RPC/gRPC, and GraphQL as API styles. How does each model the interface, and which audience does each fit best?

**Answer:** The four styles differ mainly in how they model the interface and where they shine.

- **REST** models the domain as *resources* addressed by URLs and manipulated with uniform HTTP verbs (`GET/POST/PUT/PATCH/DELETE`). Its big wins are HTTP caching (ETags, `Cache-Control`), a huge tooling/proxy ecosystem, and discoverability — so it's the default for **public/third-party** APIs. Downsides: weak typing (JSON has no schema by default), verbose payloads, and over/under-fetching.
- **RPC (JSON-RPC)** models *actions/procedures* (`createOrder`, `refund`). It maps naturally to code but loses HTTP caching semantics.
- **gRPC** is RPC over HTTP/2 with protobuf: binary, schema-first codegen, bidirectional streaming, and multiplexing. It's the default for **internal, high-throughput** service-to-service calls, but has poor browser support (needs gRPC-Web) and opaque payloads that are harder to debug.
- **GraphQL** exposes a single typed endpoint where clients query exactly the fields they need — ideal for **mobile/BFF aggregation** that would otherwise chain many REST calls. The cost is N+1 resolver explosions (needs DataLoader batching), hard HTTP caching, and a more complex auth/rate-limiting story (cost analysis, depth limits).

**Key points:**
- REST: cacheable via HTTP, weak typing, verbose payloads.
- gRPC: streaming, codegen, poor browser support (needs gRPC-Web).
- GraphQL: flexible queries, schema, complex auth and rate-limit story.
- Pick per audience: public/3rd-party = REST; internal high-throughput = gRPC; mobile aggregation = GraphQL.

---

### 2. Idempotency: methods & keys

**Frequency:** High

**Question:** What makes an HTTP operation idempotent, and how does an `Idempotency-Key` header let a server handle retries safely?

**Answer:** An operation is **idempotent** if performing it once or many times yields the same observable server state. By HTTP contract `GET`, `PUT`, and `DELETE` are idempotent (a second `DELETE` just returns 404/204), while `POST` is not — two `POST /payments` create two charges.

To make an unsafe `POST` safe under retries, the client generates a unique `Idempotency-Key` (usually a UUID) and sends it as a header. The server, on first receipt, processes the request and stores a record `(key → request fingerprint + status + response body)` with a TTL (24h is typical, in Redis or a dedicated table). On any retry with the same key it **replays the stored response** instead of re-executing. If the same key arrives with a *different* request body, the server should reject with `409/422` to catch client bugs. This defends against network timeouts+retries, double-clicks, webhook redelivery, and at-least-once queue consumers.

Note idempotency ≠ safety: `PUT` mutates state but is idempotent; "safe" methods (`GET`, `HEAD`) mutate nothing at all.

**Key points:**
- Store `(key, request hash, response)`; reject if key reused with different body.
- TTL 24h is typical; persist in Redis or a dedicated table.
- Idempotency != safety: PUT changes state but is idempotent.
- Critical for webhooks, payments, and queue consumers.

---

### 3. Pagination: offset vs cursor

**Frequency:** High

**Question:** Compare offset and cursor (keyset) pagination. How does each perform on large, concurrently-updated collections?

**Answer:** **Offset pagination** (`ORDER BY created_at LIMIT 20 OFFSET 10000`) is trivial to implement and lets users jump to arbitrary pages, but the database must scan and discard all `OFFSET` rows — so page 500 is far slower than page 1 (O(offset)). It's also *unstable*: if a row is inserted or deleted while the user pages, rows shift and items get skipped or shown twice.

**Cursor (keyset) pagination** remembers the last row's sort tuple and continues from it: `WHERE (created_at, id) < (?, ?) ORDER BY created_at DESC, id DESC LIMIT 20`. With a matching composite index this is O(log n) regardless of depth and is stable under concurrent writes because it anchors on a value, not a position. The tradeoff: no random page access — only next/prev.

Best practices: encode the **full sort tuple** (include a tiebreaker like `id`) in an opaque base64 cursor so you can evolve the format later; return `next_cursor` and `has_more`; avoid `COUNT(*)` totals on huge tables. Offset is still fine for small, bounded admin tables where users want page numbers.

**Key points:**
- Cursors must encode the full sort tuple to be stable.
- Opaque base64 cursors hide implementation and let you evolve.
- Offset breaks for infinite scroll UX.
- Return `next_cursor` and `has_more`; avoid total counts on huge tables.

---

### 4. Rate limiting algorithms (token/leaky/sliding)

**Frequency:** High

**Question:** Compare token bucket, leaky bucket, fixed window, and sliding window rate limiting. How does each handle bursts, and how would you enforce limits across a cluster?

**Answer:**

- **Token bucket** refills tokens at a steady rate up to a capacity; each request spends one. It permits short bursts (up to bucket size) then throttles to the refill rate — the best general-purpose choice and what most API gateways use.
- **Leaky bucket** drains a queue at a fixed rate, smoothing bursty input into a constant output stream; excess is queued or dropped. Good when a downstream needs a steady feed.
- **Fixed window** counts requests per calendar window (`INCR` a `key:minute` counter). Cheap and simple, but allows a **2× burst at the boundary** — 100 requests at 00:59 and 100 at 01:00 pass in two seconds.
- **Sliding window log** stores each request timestamp for exact accuracy but is memory-heavy; **sliding window counter** weights the current and previous fixed windows to approximate it cheaply, fixing the boundary problem with tiny state.

Across a cluster you enforce centrally in **Redis** so every node shares the count — `INCR` + `EXPIRE`, or a Lua script for atomicity (avoiding a race between INCR and EXPIRE). Return `429` with `Retry-After` and `X-RateLimit-Limit/Remaining/Reset` headers, compose limits per API key + IP + route, and pair with a concurrency limit to shield slow downstreams.

**Key points:**
- Return `429` with `Retry-After` and `X-RateLimit-*` headers.
- Limit per API key, per IP, and per route — composed.
- Redis `INCR` + EXPIRE or Lua script for atomicity.
- Combine with concurrency limits to protect downstream services.

---

### 5. AuthN vs AuthZ; OAuth 2.0 flows

**Frequency:** High

**Question:** Distinguish authentication from authorization, and describe the main OAuth 2.0 flows. When would you use Authorization Code + PKCE versus Client Credentials?

**Answer:** **Authentication (AuthN)** proves *who* you are; **authorization (AuthZ)** decides *what* you may do. OAuth 2.0 is an **authorization** framework: it issues scoped access tokens so a client can act on a resource without seeing the user's password. **OIDC** layers authentication on top by adding an ID token (a signed JWT of identity claims) and a `userinfo` endpoint.

Major flows:

- **Authorization Code + PKCE** — the default for web and mobile/SPA apps with a user present. PKCE (a code verifier/challenge) prevents interception of the code, which is why it replaced the deprecated **Implicit** flow.
- **Client Credentials** — machine-to-machine, no user; the service authenticates with its own client ID/secret to get a token.
- **Device Code** — input-constrained devices (TVs, CLIs) where the user authorizes on a second device.
- **Resource Owner Password** — deprecated; it hands the password to the client and defeats the point of OAuth.

Token hygiene: keep access tokens short-lived (5–15 min) with rotatable refresh tokens; validate `aud`, `iss`, `exp`, and the signature on every request; use scopes for coarse grants and a policy engine (claims/ABAC) for fine-grained control.

**Key points:**
- Never use Implicit flow anymore — PKCE replaces it.
- Access tokens short-lived; refresh tokens long-lived and rotatable.
- Validate `aud`, `iss`, `exp`, signature on every request.
- Scopes for coarse perms, claims for attributes, policy engine for fine-grained.

---

### 6. JWT vs session cookies

**Frequency:** High

**Question:** Compare JWTs and server-side session cookies. When does each fit best, and how do you revoke access with each?

**Answer:** A **session cookie** holds an opaque random ID; all state lives server-side (in Redis/DB). Verifying a request means a lookup, but **revocation is trivial** — delete the server record and the session is dead instantly. This is the simpler, safer default for first-party web apps.

A **JWT** is a self-contained, signed set of claims (`sub`, `exp`, roles). Any service can verify it locally with the signer's public key — no shared session store — which is why it scales well across microservices. The cost: you **can't easily revoke** a JWT before it expires (you'd need a denylist, which reintroduces the lookup you were avoiding), tokens are larger than a cookie, and misconfiguration like accepting `alg=none` or confusing HS256/RS256 keys is a classic vulnerability.

Rule of thumb: **first-party web app → sessions** with secure cookies; **APIs / distributed services → short-lived JWTs (5–15 min) + rotating refresh tokens**. Whatever you store in a cookie, set `HttpOnly`, `Secure`, and `SameSite=Lax/Strict`, and verify JWT signatures with asymmetric keys (RS256/EdDSA) rather than a secret shared across every service.

**Key points:**
- JWT cons: size, can't revoke without a blacklist, easy to misuse `alg=none`.
- Always set `HttpOnly`, `Secure`, `SameSite=Lax/Strict` on session cookies.
- Keep JWTs short (5-15 min); refresh via rotating refresh token.
- Verify signature with asymmetric keys (RS256/EdDSA), not shared secrets, in multi-service setups.

---

### 7. ACID

**Frequency:** High

**Question:** Explain the ACID properties of a transaction. Which one is the "squishiest", and what mechanism gives you atomicity and durability?

**Answer:**

- **Atomicity** — a transaction's writes are all-or-nothing; a crash mid-way rolls everything back.
- **Consistency** — a committed transaction moves the DB from one valid state to another, preserving invariants (constraints, foreign keys). This is the **squishiest** property because much of "consistency" is defined by *your application's* rules, not just the database.
- **Isolation** — concurrent transactions appear (to a degree set by the isolation level) to run serially, so they don't corrupt each other's view.
- **Durability** — once committed, data survives a crash or power loss.

The mechanism behind **A** and **D** is the **write-ahead log (WAL)**: the DB appends the intended changes to a sequential log and `fsync`s it *before* acknowledging the commit. On recovery it replays committed transactions and discards incomplete ones. This is why durability ultimately depends on `fsync` actually reaching stable storage — some cloud disks or misconfigured controllers "lie" about flushing, silently weakening D. RDBMSs like Postgres provide all four; many NoSQL stores relax one or more (often isolation or immediate durability) to scale horizontally.

**Key points:**
- "C" is the squishiest — it's about app-level invariants, not just the DB.
- Durability depends on `fsync` and storage; cloud disks can lie.
- Isolation level (next question) determines what anomalies you see.
- WAL (write-ahead log) is the mechanism behind A and D.

---

### 8. Isolation levels & anomalies

**Frequency:** High

**Question:** Walk through the SQL isolation levels and the anomalies each permits. How does Postgres Serializable differ from Repeatable Read?

**Answer:** From weakest to strongest:

- **Read Uncommitted** — can see another transaction's uncommitted writes (**dirty reads**). Postgres never actually gives you this; it behaves as Read Committed.
- **Read Committed** (Postgres default) — no dirty reads, but the same query run twice can return different results (**non-repeatable reads**) and new matching rows can appear (**phantoms**).
- **Repeatable Read** — a stable snapshot for the whole transaction: no non-repeatable reads. In MySQL InnoDB (its default) gaps allow some phantoms; Postgres's snapshot-based RR also blocks phantoms but still permits **write skew** (two transactions each read a shared invariant and independently violate it).
- **Serializable** — the result is equivalent to *some* serial order, eliminating write skew too.

The key difference: Postgres **Serializable** uses **SSI (Serializable Snapshot Isolation)**, which tracks read/write dependencies and *aborts* one transaction of a dangerous cycle — catching the write skew that Repeatable Read misses — whereas MySQL Serializable falls back to taking shared locks on reads. Higher isolation trades throughput for correctness (more aborts or lock waits), so **always wrap transactions in a retry loop** for serialization failures, and reach for `SELECT ... FOR UPDATE` on specific hot rows rather than bumping the whole transaction's level.

**Key points:**
- Anomalies: dirty read, non-repeatable read, phantom, write skew, lost update.
- Postgres SSI catches write-skew that Repeatable Read misses.
- Always handle serialization-failure retries in app code.
- Use explicit `SELECT ... FOR UPDATE` for hot rows instead of bumping isolation.

---

### 9. Indexes: B-tree vs hash; covering

**Frequency:** High

**Question:** Compare B-tree, hash, and covering indexes. What is the leftmost-prefix rule, and when does a covering index help?

**Answer:** A **B-tree** is the workhorse index: it keeps keys sorted, so it serves equality (`=`), range (`<`, `BETWEEN`), prefix (`LIKE 'foo%'`), and `ORDER BY` — all in O(log n). A **hash index** supports only equality lookups and can't help range or sort; it's rarely worth choosing (in Postgres it was only crash-safe from v10 on).

For a **composite** B-tree like `(tenant_id, created_at)`, the **leftmost-prefix rule** says the index can be used for queries that filter on a left-anchored prefix of its columns — `tenant_id`, or `tenant_id + created_at`, but *not* `created_at` alone. So column order must match your query and sort patterns.

A **covering index** includes every column a query reads (via extra composite columns or Postgres's `INCLUDE (...)`), so the engine answers entirely from the index and skips the heap fetch — an "index-only scan" that can be several times faster on hot read paths. Related levers: skip indexing low-**selectivity** columns (a boolean rarely helps); use **partial indexes** (`WHERE deleted_at IS NULL`) to index just the rows you query; and use **GIN/GiST** for full-text, arrays, JSON, and geo. Remember every index adds write and storage cost, so measure before adding one.

**Key points:**
- Index selectivity: low-cardinality columns rarely benefit.
- Partial indexes for filtered subsets (`WHERE deleted_at IS NULL`).
- GIN/GiST for full-text, arrays, JSON, geo.
- Every index slows writes — measure before adding.

---

### 10. N+1 query problem

**Frequency:** High

**Question:** What is the N+1 query problem, and how do you fix and detect it?

**Answer:** N+1 happens when you fetch a list of N parent rows with one query, then lazily issue **one more query per parent** to load a relation — 1 + N round trips. It's the classic ORM footgun (Django's lazy attributes, ActiveRecord associations, GraphQL resolvers): everything looks fine on a 10-item list in dev, then throughput collapses when the list grows to thousands in production, because each query pays network + planning latency.

Fixes, by fan-out:

- **JOIN / eager load** for 1:1 or small fan-out (`select_related` in Django, `Include` in EF Core) — one query returns parents and children together.
- **`IN (...)` batching** for large fan-out (`prefetch_related`) — a second query loads all children with `WHERE parent_id IN (...)`, so it's 2 queries total regardless of N.
- **DataLoader** in GraphQL — it coalesces the per-field resolver calls within a tick into a single batched query; GraphQL APIs need this almost universally.

Detection: log SQL in dev, and in tests **assert the query count** on hot endpoints (e.g. `assertNumQueries`) so a regression that reintroduces N+1 fails CI. N+1 is the single most common cause of slow APIs in ORM-heavy stacks.

**Key points:**
- Always log SQL in tests and assert query counts on hot paths.
- `JOIN` for 1:1 or small fan-out; `IN` batches for large fan-out.
- GraphQL resolvers need DataLoader almost universally.
- N+1 is the most common cause of slow APIs in ORM-heavy stacks.

---

### 11. Joins; when to denormalize

**Frequency:** High

**Question:** When should you denormalize instead of relying on joins, and what does denormalization cost you?

**Answer:** A **normalized** schema stores each fact once, which keeps writes cheap and eliminates update anomalies — change a customer's name in one row and every query sees it. Joins let you reassemble the data on read, and for most OLTP workloads a well-indexed join is perfectly fast.

Joins stop being "free" when: read latency dominates and a hot path repeats an expensive 4–5-way join thousands of times per second; or the join would have to **cross shards/partitions**, turning a local operation into a scatter-gather. That's when you **denormalize** — duplicate the needed columns onto the row you read, or precompute the result.

The cost is that the duplicated data can drift, so denormalization *always* needs a **sync strategy**: database triggers, change-data-capture (CDC) streaming updates to the copy, or careful dual-writes. Middle grounds avoid hand-rolling that: **materialized views** (with periodic or incremental refresh) and **computed/generated columns**. Rule of thumb: read-heavy → lean toward denormalizing; write-heavy → stay normalized. In NoSQL you typically denormalize by default and model around your access patterns from the start.

**Key points:**
- Inner vs left vs full outer — pick semantically, not by performance gut.
- Denormalization needs a sync strategy (triggers, CDC, dual-write).
- Read-heavy → denormalize; write-heavy → normalize.
- Materialized views with periodic refresh are often the best compromise.

---

### 12. Normalization 1NF-BCNF

**Frequency:** High

**Question:** Define normal forms 1NF through BCNF. Why do most apps stop at 3NF?

**Answer:** Each form removes a class of redundancy by tightening the allowed functional dependencies:

- **1NF** — every column holds a single atomic value; no repeating groups or arrays crammed into one field.
- **2NF** — 1NF *plus* no **partial dependency**: with a composite key, no non-key column may depend on only part of that key.
- **3NF** — 2NF *plus* no **transitive dependency**: a non-key column must not depend on another non-key column (e.g. storing `zip` and the `city` it implies).
- **BCNF** — a stricter 3NF: **every determinant must be a candidate key**, closing edge cases 3NF allows when a table has overlapping candidate keys.

Practical apps target **3NF** because it kills virtually all update anomalies while keeping the schema queryable, and going to BCNF rarely changes anything for typical designs. Beyond that it's a deliberate tradeoff: over-normalizing forces excessive joins on every read, so analytics systems intentionally denormalize into **star/snowflake** schemas, and **JSON/JSONB columns** are a pragmatic escape hatch for sparse or fast-changing attributes you don't want to model as tables.

**Key points:**
- Normalization minimizes update anomalies and storage duplication.
- Over-normalization causes excessive joins.
- Star/snowflake schemas in analytics deliberately denormalize.
- JSON columns are a pragmatic escape hatch for sparse attributes.

---

### 13. Sharding (range/hash/geo)

**Frequency:** High

**Question:** Compare range, hash, and geo sharding. How do you choose a shard key, and why is it so hard to change later?

**Answer:**

- **Range sharding** splits rows by contiguous key ranges (e.g. `A–M`, `N–Z`, or by date). Range scans and "recent" queries stay on one shard, but a monotonically increasing key (timestamp, auto-increment id) sends every new write to the *same* shard — a hotspot.
- **Hash sharding** places rows by `hash(key) % N`, spreading load evenly and killing hotspots, at the price of losing range scans (a range now hits every shard).
- **Geo sharding** routes by region for low latency and data-residency/compliance (EU data stays in the EU).

A good **shard key** gives both even distribution *and* query locality — ideally your most common queries can be answered from a single shard, and one tenant's data lives together so you avoid cross-shard joins and distributed transactions (route per tenant when you can). The shard key is **hard to change** because it determines physical placement of every row: changing it means rehashing and moving the entire dataset while serving traffic, so design it for the next 3–5 years. Use **consistent hashing** so adding/removing a node only remaps ~1/N of keys, and **pre-split** ranges up front to avoid an initial hotspot.

**Key points:**
- Shard key is hard to change — design for the next 3-5 years.
- Consistent hashing minimizes rebalancing on node changes.
- Pre-split to avoid initial hotspots in range schemes.
- Avoid distributed transactions; route by tenant when possible.

---

### 14. Optimistic vs pessimistic locking

**Frequency:** High

**Question:** Compare optimistic and pessimistic locking. When does each fit, and how do they show up at the API layer?

**Answer:** **Optimistic locking** assumes conflicts are rare: you read a row along with a `version` (or `updated_at`/etag), then write with `UPDATE ... SET version = version + 1 WHERE id = ? AND version = ?`. If **0 rows** are updated, someone else changed it first — you detect the conflict and retry (or surface it to the user). No locks are held between read and write, so it scales well under low contention.

**Pessimistic locking** assumes conflicts are common: `SELECT ... FOR UPDATE` takes a row lock that other writers block on until you commit. This gives predictable, serialized behavior for hot rows (inventory counters, seat booking) and avoids wasted retry work, but reduces concurrency and risks deadlocks.

Choose optimistic for low-contention or when retries are cheap; pessimistic for high-contention rows or when recomputing the retry is expensive. Practical notes: always carry a dedicated **version column**; at the HTTP layer, `If-Match`/`ETag` *is* optimistic locking (the server rejects a stale write with `412 Precondition Failed`); never hold a pessimistic lock across **user think-time** (a lock held during a form edit stalls everyone); and use `SELECT ... FOR UPDATE SKIP LOCKED` to build contention-free work queues where each worker grabs a different unlocked row.

**Key points:**
- Always include an integer/UUID version column for optimistic.
- HTTP If-Match/ETag is optimistic locking at the API layer.
- Pessimistic locks held across user think-time = disaster.
- `SKIP LOCKED` enables work-queue patterns without contention.

---

### 15. CAP & PACELC

**Frequency:** High

**Question:** State the CAP theorem and how PACELC extends it. What does "consistency" mean in CAP?

**Answer:** **CAP** says that when a **network partition** happens, a distributed system must choose between **Consistency** (every read sees the latest write) and **Availability** (every request still gets a non-error response) — you cannot have both while partitioned. Crucially, CAP describes behavior *during a partition*, not steady state, and its "C" means **linearizability**, which is stronger than SQL's ACID "C".

**PACELC** completes the picture: *if* Partitioned, trade Availability vs Consistency (PA/PC); **Else** (normal operation) you still trade **Latency vs Consistency** (EL/EC). That Else-branch is the tradeoff you actually make every day — stronger consistency means coordination (quorums, consensus) and therefore more latency.

Real systems land in categories: Dynamo/Cassandra are **PA/EL** (stay available and fast, accept eventual consistency), while Spanner, etcd, and ZooKeeper are **PC/EC** (favor consistency, accept higher latency or unavailability). Many are tunable per operation — Cassandra lets you pick `ONE` vs `QUORUM` per query. Don't choose a database on CAP category alone; day-to-day **operability** (backups, failover, observability) usually matters more.

**Key points:**
- CAP is about behavior during partition, not steady state.
- "Consistency" in CAP = linearizability, stronger than SQL's "C".
- Latency vs consistency tradeoff (the LC in PACELC) is the everyday one.
- Don't pick a DB on CAP alone — operability matters more.

---

### 16. Cache aside vs read-through vs write-through vs write-behind

**Frequency:** High

**Question:** Compare cache-aside, read-through, write-through, and write-behind caching. Which is the safe default and why?

**Answer:**

- **Cache-aside (lazy loading)** — the application checks the cache; on a miss it reads the DB, populates the cache, and returns. The app owns invalidation. This is the **default** choice: simple, resilient (a cache outage just means more DB reads), and it only caches data actually requested.
- **Read-through** — the app always asks the cache, and the cache library loads from the DB on a miss. Cleaner app code, but you're coupled to a cache that understands your data source.
- **Write-through** — writes go to the cache and synchronously to the DB before returning. The cache is never stale, at the cost of higher write latency; combine with read-through so reads are warm.
- **Write-behind (write-back)** — the cache acknowledges the write immediately and flushes to the DB asynchronously. Lowest write latency and great for write bursts, but a crash before the flush **loses data**, so it needs a durable queue/log to be safe.

Pick cache-aside unless you have a specific reason. Whatever you choose, still set **TTLs** as a backstop even when you invalidate explicitly, so a missed invalidation can't serve stale data forever.

**Key points:**
- Cache-aside puts invalidation burden on the app.
- Write-through eliminates cache/DB skew at write cost.
- Write-behind needs durable queues to be safe.
- Always set TTLs even with explicit invalidation.

---

### 17. Cache invalidation strategies

**Frequency:** High

**Question:** What are the main cache invalidation strategies, and why combine TTL with explicit invalidation?

**Answer:** "There are only two hard things in computer science..." — the options trade staleness against plumbing:

- **TTL** — entries expire after a fixed time. Dead simple and self-healing, but allows bounded staleness and does nothing to push fresh data sooner.
- **Explicit invalidation on write** — delete/update the key whenever the source changes. Correct and immediate, but plumbing-heavy: every write path must know every key it affects, and a single missed path serves stale data indefinitely.
- **Version/etag in the key** — bake a version into the key (`user:42:v7`); bumping the version instantly "invalidates" everything without deleting, handy across deploys.
- **Pub/sub fanout** — broadcast invalidations (e.g. Redis keyspace notifications) so every node drops the key.

Combine **TTL + explicit invalidation** for defense in depth: explicit invalidation gives freshness on the happy path, and the TTL caps the damage when an invalidation is missed. Supporting techniques: **stampede protection** (a lock or single-flight so only one request rebuilds a hot key on miss), **negative caching** (briefly remember "not found" to stop repeated DB hits), **key-per-query-shape** naming (`user:42:posts:page:1`), and **soft-TTL + background refresh** to keep hot keys warm without a user ever paying the miss.

**Key points:**
- Stampede protection (locks, single-flight) on miss.
- Negative caching — remember "not found" briefly.
- Key per query shape: `user:42:posts:page:1`.
- Soft TTL + background refresh keeps hot keys warm.

---

### 18. Threads vs processes vs coroutines vs async

**Frequency:** High

**Question:** Compare threads, processes, coroutines, and async event loops. How do you choose for CPU-bound vs I/O-bound work?

**Answer:**

- **Threads** share the parent process's memory and are scheduled preemptively by the kernel. Communication is cheap (shared data) but that's also the hazard — you need locks, and you risk races and deadlocks. Context switches cost microseconds and each thread reserves an MB-ish stack.
- **Processes** are fully isolated (separate address spaces), so they're safer and can use all CPU cores independently, at the cost of heavier creation and IPC (pipes, shared memory, serialization).
- **Coroutines** (goroutines, Java virtual threads, `asyncio` tasks) are user-space "threads": KBs of stack, scheduled cooperatively or onto a small kernel-thread pool, so you can run hundreds of thousands concurrently.
- **Async event loop** is a single thread multiplexing many I/O operations via readiness notification (epoll/kqueue), switching tasks at `await` points.

Choose by bottleneck: **I/O-bound** (DB calls, HTTP fan-out) → async/coroutines give massive concurrency for tiny cost; **CPU-bound** → you need real parallelism, so use processes (in Python, to sidestep the GIL) or threads in runtimes with true parallel threads (Go, Java). The classic trap is mixing a **blocking call into an async path** — one synchronous DB or filesystem call stalls the whole event loop and silently tanks throughput.

**Key points:**
- CPU-bound → processes (Python) or threads (Go/Java).
- I/O-bound → async/coroutines for max concurrency.
- Mixing async with blocking calls = silent stalls.
- Pick the runtime that matches the workload.

---

### 19. Python GIL

**Frequency:** High

**Question:** What is Python's GIL, and how does it shape your choices for CPU-bound vs I/O-bound work?

**Answer:** The **Global Interpreter Lock** is a single mutex in CPython that lets only **one thread execute Python bytecode at a time**. It exists because CPython's memory management (reference counting) isn't thread-safe without it, and the GIL makes the interpreter simpler and single-threaded code faster.

The practical consequence: threads give you **no CPU parallelism** — spinning up 8 threads to crunch numbers still runs on one core. But I/O operations (socket, disk, `time.sleep`) **release the GIL** while they wait, so threads *do* help **I/O-bound** workloads, where the threads are mostly parked waiting on the network anyway.

For **CPU-bound** work you have three options: **`multiprocessing`** (separate processes, each with its own interpreter and GIL, communicating via pickling/shared memory); **native extensions** that release the GIL during heavy computation (NumPy, Cython `nogil` blocks, Rust/C extensions); or the new **free-threaded build (PEP 703, experimental in 3.13+)** that removes the GIL entirely. One caution: the GIL does **not** make your code race-free — it only guarantees one bytecode op at a time, so multi-step operations (`x += 1`) still need locks to be atomic at the application level.

**Key points:**
- Async + threads + processes are complementary tools.
- C extensions can release the GIL during number crunching.
- PEP 703 (no-GIL) is opt-in and experimental.
- GIL doesn't prevent race conditions in app logic.

---

### 20. Race conditions vs deadlocks vs livelocks

**Frequency:** High

**Question:** Distinguish race conditions, deadlocks, livelocks, and starvation. How do you detect and prevent each?

**Answer:** All four are concurrency failure modes, but with different signatures:

- **Race condition** — correctness depends on the *timing/interleaving* of concurrent accesses to shared state. The canonical shape is **check-then-act**: two threads both read `balance == 100`, both subtract 100, and you've double-spent. The insidious part is that it's non-deterministic — it may pass a million times in tests and only corrupt data under production load when the interleaving finally lines up.
- **Deadlock** — two or more threads each hold a lock the other needs, forming a cycle; none can proceed. Requires all four Coffman conditions (mutual exclusion, hold-and-wait, no preemption, circular wait) — break any one and you can't deadlock.
- **Livelock** — threads *are* running and changing state in response to each other but make no forward progress (two people stepping side-to-side in a hallway). Common when naive retry/backoff logic keeps colliding.
- **Starvation** — a thread is perpetually denied a resource because others keep winning it (e.g. writers starved by a stream of readers).

**Prevention:** guard shared state with locks or atomics/CAS; impose a **global lock ordering** so cycles can't form; add **randomized backoff with jitter** to break livelock; and use fair queues to avoid starvation. Best of all, sidestep the whole class by preferring **immutability** and **message-passing** (Go channels, actor model) over shared mutable state. **Detection:** Go's `-race`, C/C++ **ThreadSanitizer**, Java's `jcstress`, and strict async modes — plus stress/fuzz tests that hammer concurrent paths, since normal unit tests rarely surface these.

**Key points:**
- Race conditions are often invisible until prod load.
- Detection: `-race` (Go), TSan (C++), `pytest-asyncio` strict mode.
- Test concurrent paths with stress + fuzzing.
- Prefer immutability / message-passing over shared mutable state.

---

### 21. Mutex vs semaphore vs condition var

**Frequency:** High

**Question:** Compare a mutex, a semaphore, and a condition variable. Why must you re-check a condition variable's predicate in a loop?

**Answer:**

- **Mutex** — mutual exclusion with exactly **one** holder at a time. It protects a critical section so only one thread touches shared state. Ownership matters: typically only the locker may unlock.
- **Semaphore** — a counter of **N permits**; up to N threads may hold it concurrently. `acquire()` decrements (blocking at zero), `release()` increments. Use it to cap a resource pool (e.g. "at most 10 concurrent DB connections") or as a crude rate limiter. A binary semaphore (N=1) resembles a mutex but has no ownership, so any thread can release it.
- **Condition variable** — lets threads **wait for a predicate** to become true without busy-spinning. It's always paired with a mutex: you lock, check the predicate, and if false call `wait()`, which atomically releases the mutex and sleeps; a `signal()`/`notify()` from another thread wakes it to re-acquire and re-check.

You must re-check the predicate **in a `while` loop, not an `if`**, for two reasons: (1) **spurious wakeups** — the OS may wake a waiter with no signal at all; and (2) with multiple waiters, another thread may have consumed the condition between the wake and your re-acquire of the mutex. For read-heavy data an **RWMutex** (shared read lock, exclusive write lock) boosts concurrency. Best practices: always release in `defer`/`finally` for exception safety; watch for **priority inversion** in real-time systems (use priority inheritance); reserve **spinlocks** for ultra-short critical sections on multicore where sleeping costs more than spinning; and in Go, prefer channels over explicit locks where it reads more cleanly.

**Key points:**
- Always release mutexes (defer/finally) — exception safety.
- Beware priority inversion in real-time systems.
- Spinlocks only for very short critical sections on multicore.
- Channels in Go often replace explicit locks more cleanly.

---

### 22. Kafka vs RabbitMQ vs SQS

**Frequency:** High

**Question:** Compare Kafka, RabbitMQ, and SQS. When would you pick each, and how do their retention models differ?

**Answer:** These represent two different mental models — a **log** vs a **queue**.

- **Kafka** is a distributed, append-only **commit log**. Messages persist for a retention window (by time or size, e.g. 7 days) and are **replayable** — a new consumer can rewind to offset 0 and reprocess history, which is what makes it ideal for **event sourcing, stream processing, and fan-out to many independent consumers**. Ordering is per-partition; throughput is very high (millions/sec) because it's basically sequential disk writes plus zero-copy reads. The cost is operational weight (brokers, partitions, ZooKeeper/KRaft) unless you use managed MSK/Confluent.
- **RabbitMQ** is a classic **broker** with rich routing: producers publish to **exchanges** that route to queues by binding rules (direct, topic, fanout, headers). It gives per-message acks, priorities, TTLs, and dead-letter queues — excellent for **work queues, RPC, and complex routing**. Messages are typically **deleted once acked**, and throughput is lower than Kafka.
- **SQS** is a fully managed, zero-ops AWS queue: **at-least-once** delivery, no ordering by default (with an optional **FIFO** variant that adds ordering + dedup at lower throughput). Perfect for **AWS-native background workers** where you want a queue and never want to run a broker.

Rule of thumb: need replay/streaming/high fan-out → **Kafka**; need flexible routing/work queues on-prem → **RabbitMQ**; want a managed queue on AWS → **SQS**.

**Key points:**
- Kafka = log; Rabbit/SQS = queue. Different mental models.
- Kafka retention by time/size; Rabbit/SQS drop on ack.
- Throughput: Kafka >> Rabbit > SQS standard.
- Ops: SQS zero, Rabbit medium, Kafka heavy (or managed via MSK/Confluent).

---

### 23. Exactly-once vs at-least-once vs at-most-once

**Frequency:** High

**Question:** Explain at-most-once, at-least-once, and exactly-once semantics. Why is true exactly-once so hard, and what's the realistic target?

**Answer:** The three guarantees trade **loss** against **duplication**:

- **At-most-once** — fire and forget (send, don't wait for ack). No duplicates, but a crash or dropped packet **loses** the message. Fine for disposable telemetry where a lost data point doesn't matter.
- **At-least-once** — the producer retries until it gets an ack, and the consumer acks only after processing. Nothing is lost, but a retry after a slow ack or a consumer crash **after processing but before committing** yields **duplicates**.
- **Exactly-once** — every effect happens once, no loss and no dupes. This is the hard one because it requires atomicity across *two* systems (the message broker and your database), and the classic "deliver, then process, then ack" has an unavoidable crash window between steps.

The key distinction: **exactly-once *delivery*** over an unreliable network is essentially impossible (the Two Generals problem), but **exactly-once *processing*** is achievable by making the *effect* idempotent — so a duplicate delivery is harmless. You get there with an **idempotency key + dedup table**, or by writing the result and the offset in **one transaction**. Kafka's EOS (transactions + idempotent producer) delivers this **Kafka-to-Kafka**, but the moment you touch an external system (send an email, charge a card) you need the **transactional outbox** or 2PC pattern. So the realistic engineering target is **at-least-once delivery + idempotent consumers** — always design consumers to tolerate seeing the same message twice.

**Key points:**
- "Exactly-once delivery" is mostly marketing; "exactly-once processing" is real.
- Idempotency keys + dedup tables are how you build exactly-once.
- Kafka transactions cover Kafka-to-Kafka; bridging to external systems requires outbox/2PC patterns.
- Always design consumers to handle dupes.

---

### 24. Kafka partitions/consumer groups/offsets

**Frequency:** High

**Question:** Explain Kafka partitions, consumer groups, and offsets. How does partition count relate to consumer parallelism?

**Answer:** A **topic** is split into **N partitions**, each an independent, ordered, append-only log. This partitioning is what lets Kafka scale horizontally — partitions live on different brokers and are read in parallel.

- **Producer routing:** a message with a key is placed by `hash(key) % partitions`, so **all messages with the same key land on the same partition** and therefore preserve order relative to each other (keyless messages round-robin). Ordering is guaranteed *within* a partition, never across the whole topic.
- **Consumer groups:** consumers sharing a `group.id` split the partitions among themselves, with **at most one consumer per partition** in the group. So if a topic has 6 partitions, at most 6 consumers in a group do useful work — **partition count is the hard cap on consumer parallelism**. Multiple *different* groups each get the full stream independently (fan-out).
- **Offsets:** each partition tracks a per-consumer-group read position (offset), committed back to Kafka (the `__consumer_offsets` topic). On restart or rebalance, a consumer resumes from the last committed offset.

Operational implications: over-provision partitions up front because increasing them later breaks key→partition mapping (and thus ordering); **commit offsets *after* processing** to get at-least-once (commit-before-process risks losing messages on a crash); **rebalances** (a consumer joining/leaving) briefly pause consumption, so use **cooperative/incremental rebalancing** to minimize the stop-the-world effect; and choose the key carefully because it simultaneously defines your **ordering boundary** and your **load distribution** (a low-cardinality key creates hot partitions).

**Key points:**
- Partition count caps consumer parallelism per group.
- Rebalances pause consumption — cooperative rebalancing minimizes disruption.
- Commit offsets after processing, not before (at-least-once).
- Key choice = ordering boundary AND load distribution.

---

### 25. SQL injection — parameterized queries

**Frequency:** High

**Question:** How do you prevent SQL injection, and why are parameterized queries the primary defense?

**Answer:** SQL injection happens when user input is concatenated into a query string so the input can be **parsed as SQL code** — the classic `"... WHERE name = '" + input + "'"` where `input = "' OR '1'='1"` turns a lookup into a full-table dump (or `'; DROP TABLE users;--`).

The primary, near-total defense is **parameterized queries / prepared statements**: you send the SQL template and the values over **separate channels** — `db.query("SELECT * FROM users WHERE id = $1", id)`. The database compiles the query plan first, then binds the values purely as *data*, so no input can ever change the query's structure. This works regardless of what the attacker types. **ORMs** parameterize by default; the danger zone is hand-written raw SQL and dynamic query builders. Note that parameters bind *values*, not identifiers — you can't parameterize a table/column name, so validate those against an allowlist.

**String escaping** (quoting special chars) is only a fragile fallback — easy to get wrong across encodings/dialects — never your main defense. Layer additional protections (defense in depth): treat **all** input as hostile, including values coming from upstream services and message queues; remember **stored procedures aren't automatically safe** (they can still concatenate internally); run the app under a **least-privilege DB user** (no DDL/`DROP`, scoped to needed tables) so a successful injection is contained; and add static analysis (**semgrep, CodeQL**) to CI to flag concatenated queries before they merge.

**Key points:**
- Treat all input as hostile — including from upstream services.
- Stored procs help but aren't a silver bullet.
- Use least-privilege DB users (no DDL for the app role).
- Static analyzers (semgrep, CodeQL) catch concat-style queries.

---

### 26. Password storage (bcrypt/argon2, salting, peppering)

**Frequency:** High

**Question:** How do you store passwords securely, and what do salting and peppering each protect against?

**Answer:** Never store plaintext, and never use **fast** hashes (MD5, SHA-1, SHA-256) — modern GPUs compute billions of SHA-256 hashes per second, so a leaked table of fast hashes is cracked almost instantly. Instead use a deliberately **slow, memory-hard key derivation function**: **Argon2id** (today's preferred choice), **scrypt**, or **bcrypt**.

- **Salt** — a unique random value per user, stored alongside the hash (the KDF libraries generate and embed it for you). It ensures two users with the same password get different hashes, which **defeats precomputed rainbow tables** and stops an attacker from cracking many accounts at once. Salt is not secret.
- **Pepper** — a single app-wide secret mixed in *before* hashing (or the whole hash encrypted with it), stored **separately** from the database (in a secrets manager/HSM, not the users table). It adds a second line of defense: if only the **database** leaks but the pepper doesn't, the hashes are effectively uncrackable.

**Tune the work factor** (Argon2 memory/iterations, bcrypt cost) so one hash takes ~**100–250 ms** on production hardware — slow enough to cripple brute force, fast enough for login UX. Additional practices: Argon2id is chosen because it resists both **GPU** and **side-channel** attacks; bcrypt silently truncates input at **72 bytes**, so pre-hash with SHA-256 (base64-encoded) first if you allow long passwords; **rehash on successful login** whenever you raise the cost parameters (you have the plaintext momentarily); and **rate-limit / lock** auth attempts to blunt online brute force.

**Key points:**
- Argon2id resists GPU and side-channel attacks.
- bcrypt's 72-byte limit is a footgun — pre-hash with SHA-256 first.
- Rehash on login if cost parameters increase.
- Rate-limit auth attempts to slow brute force.

---

### 27. PUT vs PATCH

**Frequency:** Medium

**Question:** Compare PUT and PATCH. What happens to omitted fields, and how do you prevent lost updates?

**Answer:** **PUT replaces the entire resource** with the representation you send — it's a full overwrite, so any field you *omit* is typically treated as "set to empty/default," not "leave unchanged." **PATCH applies a partial update** — you send only the fields to change, and everything else stays put.

There are two standard PATCH body formats:

- **JSON Merge Patch (RFC 7396)** — send a partial object; present keys overwrite, and `null` means "delete this field." Simple and readable, but *because* `null` is overloaded as delete, it **can't distinguish "set to null" from "remove,"** and it can't express array element operations (you must resend the whole array).
- **JSON Patch (RFC 6902)** — an ordered list of operations (`{"op":"replace","path":"/email","value":...}`, plus `add`/`remove`/`move`/`test`). Far more expressive (targeted array edits, conditional `test` ops) but more verbose and harder to hand-author.

Choose **PUT** when the client naturally holds the whole document and you want predictable replace semantics; choose **PATCH** for sparse edits, especially when **concurrent writers touch disjoint fields** (two clients patching different fields won't clobber each other). Idempotency differs: **PUT is idempotent** (repeating it yields the same state), while **PATCH is idempotent only if the patch itself is** (a merge-patch usually is; an `add` to an array is not). In all cases, pair updates with **`ETag` + `If-Match`**: the client sends the version it read, and the server rejects the write with `412 Precondition Failed` if the resource changed underneath — preventing the lost-update problem.

**Key points:**
- PUT is idempotent; PATCH is idempotent only if the patch is.
- JSON Merge Patch: simple, can't express array ops or null-vs-missing.
- JSON Patch: operation list, more expressive, harder to author.
- Always combine with ETag/If-Match to prevent lost updates.

---

### 28. API versioning (URL/header/content-negotiation)

**Frequency:** Medium

**Question:** Compare URL, header, and content-negotiation API versioning. What versioning policy keeps support cost low?

**Answer:** The three placements trade cleanliness against operability:

- **URL versioning** (`/v1/users`) — the most **discoverable** (visible in logs, browsers, curl), trivially **cache-friendly** (distinct URLs are distinct cache keys), and easy to route at the gateway. It's what most public APIs (Stripe, GitHub) effectively use. Purists dislike that the "same" resource has multiple URLs.
- **Header versioning** (`API-Version: 2`) — keeps URLs clean and lets one URL evolve, but the version is **invisible** in access logs and browser testing, and caches must be told to `Vary` on the header.
- **Content negotiation** (`Accept: application/vnd.acme.v2+json`) — the most "RESTful" (versioning the *representation*, not the resource), but verbose and awkward to test by hand.

A sane **policy** matters more than the mechanism: prefer **additive, backward-compatible** changes (new optional fields, new endpoints, new enum values) and only bump the **major** version on a genuinely breaking change; cap yourself at **~2 concurrent major versions** so support and testing don't explode; announce removals with **`Deprecation` and `Sunset` headers** and a documented timeline; and version your **error contract and webhooks**, not just the happy-path payloads. GraphQL sidesteps versioning entirely by evolving one schema and marking fields `@deprecated` while clients migrate.

**Key points:**
- Prefer additive, backward-compatible changes; bump major only on breaking changes.
- Maintain at most 2 major versions to bound support cost.
- Document deprecation timelines and emit `Sunset` / `Deprecation` headers.
- GraphQL avoids versions via field deprecation.

---

### 29. API gateway responsibilities

**Frequency:** Medium

**Question:** What does an API gateway do, and how does it differ from a service mesh?

**Answer:** An **API gateway** is the single ingress point ("front door") that all external clients hit before traffic reaches your services. It centralizes **cross-cutting concerns** so every backend service doesn't reimplement them:

- **TLS termination** and certificate management.
- **Authentication/authorization** — validating JWTs or API keys, so services can trust an internal identity header.
- **Rate limiting and quotas** per client/key.
- **Routing** to the right backend, plus **request/response transformation** (protocol translation, header rewriting, response shaping).
- **Resilience** — retries, timeouts, and circuit breakers toward flaky backends.
- **Observability** — uniform logs, metrics, and trace propagation, and often a **WAF** integration for L7 attacks.

Crucially it should stay **thin**: it handles plumbing, while **business logic stays in the services**. Push domain logic into the gateway and it becomes a deployment bottleneck and a single point every team must coordinate on. Examples: Kong, Envoy, NGINX, AWS API Gateway, Apigee.

The gateway-vs-mesh distinction is **north-south vs east-west traffic**. The gateway governs **north-south** — traffic entering from outside the cluster. A **service mesh** (Istio, Linkerd) governs **east-west** — service-to-service calls *inside* the cluster — handling mTLS, retries, and traffic shifting via sidecar proxies. They're complementary: gateway at the edge, mesh internally.

**Key points:**
- Offload cross-cutting concerns from services.
- Avoid putting domain logic in the gateway — it becomes a bottleneck.
- Use service mesh (Istio/Linkerd) for east-west; gateway for north-south.
- Pair with WAF for L7 attacks.

---

### 30. Long-running ops: 202+poll vs webhooks vs SSE

**Frequency:** Medium

**Question:** Compare 202+polling, webhooks, and SSE/WebSockets for long-running operations. When does each fit?

**Answer:** Never block a request thread on slow work — return immediately and deliver the result out-of-band. Three patterns:

- **202 Accepted + polling** — accept the job, return `202` with a job URL, and let the client poll `GET /jobs/{id}` until it flips to done. **Simplest and firewall-friendly** (pure client-initiated HTTP, works everywhere), and the client controls pacing. Downside: extra request volume and latency between completion and the next poll — mitigate with a `Retry-After` hint.
- **Webhooks** — push the result to a client-registered callback URL when ready. **Fewer requests and near-instant**, but the client must **host a public endpoint**, and *you* now own delivery reliability (signing, retries, DLQs). Best for server-to-server integrations.
- **SSE / WebSockets** — stream progress over a live connection. **Best UX for browsers** showing a progress bar. Use **SSE** for one-way server→client streaming (simpler, auto-reconnect, rides plain HTTP); use **WebSockets** when you need **bidirectional** real-time (chat, collaborative editing).

Across all three: return a **job ID synchronously** so the client always has a handle; **persist job state** so a retried submission returns the same job rather than starting a duplicate; and where feasible offer **both** polling and webhooks so simple clients poll and advanced ones subscribe.

**Key points:**
- Always return a job ID synchronously; never block on long work.
- Provide both polling and webhooks where feasible.
- Persist job state so retries return the same result.
- Set sensible polling guidance (`Retry-After`) to avoid hammering.

---

### 31. Webhook design: retries, signing, replay

**Frequency:** Medium

**Question:** How do you design a robust webhook delivery system covering signing, retries, and replay protection?

**Answer:** A production webhook system has to survive untrusted receivers, flaky networks, and malicious replays.

**Signing (authenticity + integrity):** compute an **HMAC-SHA256** over the *raw* request body concatenated with a timestamp, using a shared secret, and send both in headers (`X-Signature`, `X-Timestamp`). The receiver recomputes the HMAC and compares with a **constant-time** equality check. Sign the **raw bytes** — if you sign a parsed-then-reserialized object, whitespace/key-order differences will break verification.

**Replay protection:** include the timestamp in the signed payload and have receivers **reject anything older than a small window (~5 min)**, so a captured request can't be resent later. Combine with an **event ID** the receiver dedupes on, since retries mean the same event may legitimately arrive more than once (at-least-once).

**Retries:** on any non-2xx or timeout, retry with **exponential backoff + jitter** over an extended window (hours to a couple of days), then park undeliverable events in a **dead-letter queue** for manual replay. Respond fast — receivers should return **`202`** and process asynchronously rather than doing heavy work inline.

**Operations:** offer a **replay/redelivery tool** and a test-event feature; support **secret rotation with two active keys** (sign with the new, still accept the old during the overlap); and **document** a delivery SLA, the max retry window, payload schema, and your **source IP ranges** so receivers can allowlist you.

**Key points:**
- Sign the raw body — JSON re-serialization breaks signatures.
- Provide a replay tool and a secret rotation mechanism (two active keys).
- Document a delivery SLA, max retry window, and IP ranges.
- Let receivers acknowledge async with a 202 + processing queue.

---

### 32. Backward compatibility

**Frequency:** Medium

**Question:** Which API changes are backward-compatible and which are breaking? How do you evolve a schema safely?

**Answer:** **Additive changes are safe** because existing clients simply ignore what they don't know about: adding a new **optional** field, a new endpoint, a new **optional** request parameter, or a new **enum value** (only safe if clients are built to tolerate unknown values — many aren't, so treat new enum values with care).

**Breaking changes** force clients to update in lockstep: removing or **renaming** a field, **tightening validation** (making an optional field required, shrinking a max length), **changing a field's type** (string → number) or its **units/meaning**, changing **default behavior**, or changing **error codes/status** clients branch on.

The cardinal rule: **never repurpose an existing field** — if the meaning changes, add a *new* field and deprecate the old one. Be cautious with **Postel's law** ("be liberal in what you accept"): overly lenient input parsing hides client bugs and boxes you in later, since behavior others depend on becomes impossible to tighten.

**Tooling and rollout:** for typed schemas, protobuf's **field numbers** (never reuse a number) and GraphQL's **`@deprecated`** directive make compatibility explicit; run **consumer-driven contract tests** (Pact) in CI so a producer change that would break a real consumer fails the build; publish a **deprecation policy** with `Sunset` headers and timelines; and roll risky changes behind **feature flags**, watching metrics that compare old-client vs new-client behavior before flipping globally.

**Key points:**
- Never repurpose a field's meaning — add a new one.
- Use protobuf field numbers / GraphQL `@deprecated` for typed schemas.
- Run contract tests (Pact) between consumers and producers.
- Roll out behind feature flags with metrics on old vs new clients.

---

### 33. Error model (HTTP status + RFC 7807)

**Frequency:** Medium

**Question:** How do you design a consistent API error model with HTTP status codes and RFC 7807?

**Answer:** Start by using **HTTP status codes correctly** — `4xx` means the *client* must change something, `5xx` means the *server* failed. The common map:

- **400** malformed/invalid request syntax; **401** missing or invalid credentials (authN); **403** authenticated but not permitted (authZ); **404** resource missing; **409** conflict (e.g. version mismatch, duplicate); **422** the request is well-formed but **semantically** invalid (validation failed).

On top of the status, return a **consistent, machine-readable body**. **RFC 7807 Problem Details** (`application/problem+json`) standardizes the shape with `type` (a URI identifying the error class), `title`, `status`, `detail` (human-readable specifics), and `instance` (which occurrence), plus your own **extension** members (e.g. a `validation_errors` array). Always include a **stable `code`** string that clients can branch on programmatically (status codes alone are too coarse) and a **`request_id`/correlation ID** so support can trace the exact failure in logs.

Guardrails: use **one error format across every endpoint** — no per-team snowflakes; **never leak stack traces, internal SQL, or hostnames** to clients (that's both confusing and a security disclosure) — log those server-side keyed by the request ID instead; and **localize** `title`/`detail` if the API is user-facing, while keeping `code` stable and locale-independent.

**Key points:**
- `400` validation, `401` no/bad creds, `403` no permission, `404` missing, `409` conflict, `422` semantic.
- Always include `code` and `request_id` for support triage.
- One error format across all endpoints — no snowflakes.
- Localize `title`/`detail` if the API is user-facing.

---

### 34. EXPLAIN

**Frequency:** Medium

**Question:** How do you use EXPLAIN to diagnose a slow query, and what warning signs do you look for?

**Answer:** **`EXPLAIN`** shows the planner's *chosen* plan and its cost/row **estimates** without running the query; **`EXPLAIN ANALYZE`** actually **executes** it and reports **actual** timings, loop counts, and row counts alongside the estimates. Always read a plan **inside-out / bottom-up**: the deepest (leaf) nodes run first and feed their parents.

Warning signs to hunt for:

- **`Seq Scan` on a large table** where you expected an index — either the index is missing, or the predicate isn't sargable (wrapped in a function, wrong type, leading wildcard).
- **`Nested Loop` with a high outer row count** — fine for a few rows, catastrophic when the outer side returns thousands (often the join should be a hash/merge join with a better index).
- **Big gap between estimated and actual rows** — the smoking gun for **stale statistics**; the planner is guessing wrong and picking bad joins. Fix with `ANALYZE`.
- **`Rows Removed by Filter`** — the engine read far more rows than it kept, signalling a missing or non-selective index.

Fix by adding/adjusting indexes, rewriting the query, or refreshing stats. Deeper techniques: add **`BUFFERS`** to see cache hits vs actual disk reads (a "fast" plan that's all disk I/O will fall over under load); run **`ANALYZE`** after bulk loads so the planner isn't working from empty-table stats; beware **`LIMIT`** plans that look cheap but chose the wrong index and get slow when the matching rows are sparse; and in production use **`auto_explain`** and **`pg_stat_statements`** to catch the queries that regressed and the ones eating the most total time.

**Key points:**
- `BUFFERS` reveals cache hits vs disk reads.
- Update stats with `ANALYZE` after bulk loads.
- Beware `LIMIT` plans that look cheap but pick the wrong index.
- Use auto_explain / pg_stat_statements to catch regressions in prod.

---

### 35. Read replicas & replication lag

**Frequency:** Medium

**Question:** How do read replicas and replication lag work, and how do you handle read-your-writes staleness?

**Answer:** In a **primary/replica** topology the **primary** takes all writes and streams its change log (WAL/binlog) to one or more **replicas** that apply it and serve **read** traffic. This scales reads horizontally and gives you a warm standby for failover. Replication is almost always **asynchronous** — the primary acks the commit without waiting for replicas — so replicas trail the primary by **milliseconds to seconds** (or more under load).

That lag creates the **read-your-writes** problem: a user updates their profile (write hits primary), the next page load reads from a replica that hasn't caught up, and they see stale data — looks like the write was lost. Mitigations:

- **Route critical reads to the primary** for a short window after a write (or per-session "sticky to primary").
- **Wait for catch-up with a token**: capture the write's **LSN/GTID** and have the replica read block until it has applied up to that position ("read your writes" consistency).

Lag balloons under heavy write bursts, a single replication stream that can't keep up, or **long-running queries on the replica** that stall WAL apply. Operational concerns: **monitor lag** (`pg_stat_replication` on Postgres, `Seconds_Behind_Master` on MySQL) and alert on it; **synchronous replication** eliminates data loss on failover but adds commit latency (the primary waits for a replica ack) — a direct latency-vs-durability tradeoff; watch **sequence/identity** and cache behavior across failover; and use **logical replication** when you need to replicate only selected tables or to bridge major-version upgrades with minimal downtime.

**Key points:**
- Monitor lag (`pg_stat_replication`, Seconds_Behind_Master).
- Synchronous replication trades latency for zero data loss on failover.
- Be careful with sequence/identity behavior across failover.
- Logical replication enables selective table replication and version upgrades.

---

### 36. Connection pooling

**Frequency:** Medium

**Question:** Why is database connection pooling necessary, and how do you size a pool?

**Answer:** A database connection is **expensive to open** — a TCP + TLS handshake, authentication, and (in Postgres) a whole **backend process** with its own memory. Opening one per request would add tens of milliseconds and exhaust the server. A **connection pool** keeps a small, fixed set of already-open connections and hands them out for the duration of a query/transaction, then returns them — amortizing that setup cost across thousands of requests.

**Sizing** is counterintuitive: more is *not* better. A good starting point is roughly **`cores * 2`** connections *per app instance*, and the **sum across all instances must stay under the database's `max_connections`**. Past the point where active queries exceed CPU/disk parallelism, extra connections just cause a **context-switch storm** and memory pressure that *slow the DB down* (this is why PgBouncer often beats a huge app pool). For Postgres, **PgBouncer** in **transaction-pooling** mode is the standard external pooler — it multiplexes many clients onto few real connections by assigning a connection only for the length of a transaction. The catch: transaction pooling **breaks session-scoped features** — server-side prepared statements, `SET`/session variables, advisory locks, `LISTEN/NOTIFY` — because consecutive statements may land on different backends.

Other considerations: you often **layer** an app-side pool and a proxy pool; set **idle timeouts** so leaked connections don't hold precious slots forever; and **serverless** functions (which scale to thousands of concurrent instances, each wanting connections) essentially *require* a proxy like **RDS Proxy** or **PgBouncer** to coalesce them, or they'll blow past `max_connections` instantly.

**Key points:**
- Application pool ≠ proxy pool; layer them.
- Too many connections = context-switch storm and OOM on the DB.
- Idle timeouts prevent leaks holding precious slots.
- Serverless functions need a proxy (RDS Proxy, PgBouncer) to coalesce.

---

### 37. Deadlocks

**Frequency:** Medium

**Question:** What causes database deadlocks, and how do you avoid and handle them?

**Answer:** A **deadlock** occurs when two transactions each hold a lock the other needs, forming a cycle: T1 locks row A then wants B, while T2 locks row B then wants A — neither can proceed. The database runs a **deadlock detector** that spots the cycle and **aborts one transaction** (the "victim") with an error (`deadlock_detected` / `ER_LOCK_DEADLOCK`), letting the other continue.

**Avoidance** strategies:

- **Consistent lock ordering** — always acquire locks in the same global order (e.g. sort the rows/keys you'll touch by ID before updating), so a cycle can never form. This is the single most effective fix.
- **Keep transactions short** — hold locks for as little time as possible; never wait on user input or an external HTTP call inside a transaction.
- **Lower isolation when safe** — higher isolation takes more/wider locks.
- **Index foreign keys** — an unindexed FK can force a child insert/update to take a wider lock on the parent, creating surprise contention.

**Handling:** deadlocks are a normal, expected condition under concurrency, so **always wrap transactions in a retry loop** (retry the victim with a little backoff). Postgres logs *both* conflicting statements — read the log to find the offending pair. Watch out for **hot-row contention** (everyone updating the same counter) masquerading as deadlocks; for **queue-like** access, `SELECT ... FOR UPDATE SKIP LOCKED` lets workers grab different rows without blocking; and reordering or **batching by sorted key** breaks the cycles at the source.

**Key points:**
- Postgres logs both queries — read the log carefully.
- Hot-row contention often masquerades as deadlocks.
- `SELECT ... FOR UPDATE SKIP LOCKED` is great for queue-like patterns.
- Reorder operations or batch by sorted key to break cycles.

---

### 38. Window functions

**Frequency:** Medium

**Question:** What are SQL window functions, and how do they differ from GROUP BY?

**Answer:** A **window function** computes a value across a **frame** of related rows *without collapsing them* — unlike `GROUP BY`, which aggregates many rows into one, a window function keeps every input row and adds the computed column alongside it. So you can show each order *and* its running total in the same result set.

The workhorses:

- **Ranking:** `ROW_NUMBER()` (unique sequential), `RANK()`/`DENSE_RANK()` (ties share a rank).
- **Offset:** `LAG()`/`LEAD()` reach to the previous/next row — perfect for **period-over-period** deltas (this month vs last).
- **Aggregates over a window:** `SUM(...) OVER (PARTITION BY ... ORDER BY ...)` for **running totals**, moving averages, cumulative counts.

The `OVER` clause has three parts: **`PARTITION BY`** splits rows into independent groups (like a per-group reset), **`ORDER BY`** sequences rows within each partition, and **`ROWS`/`RANGE`** defines the frame boundaries (e.g. `ROWS BETWEEN 6 PRECEDING AND CURRENT ROW` for a 7-row moving average).

The canonical **top-N-per-group** pattern is `ROW_NUMBER() OVER (PARTITION BY group ORDER BY score DESC)` in a subquery, then filter `WHERE rn <= N`. Two subtleties: window functions are evaluated **after** `WHERE`/`GROUP BY` but **before** the final `ORDER BY`/`LIMIT` (so you can't filter on a window result in the same query's `WHERE` — wrap it), and they're often **more index-friendly and far faster** than the correlated subqueries or self-joins they replace.

**Key points:**
- `PARTITION BY` for groups; `ORDER BY` for sequencing; `ROWS/RANGE` for frame.
- Top-N per group: `ROW_NUMBER() OVER (PARTITION BY g ORDER BY x)` + filter.
- Computed after WHERE/GROUP BY but before ORDER BY/LIMIT.
- Often more index-friendly than subqueries.

---

### 39. Partitioning

**Frequency:** Medium

**Question:** What is table partitioning, and when does it pay off? How do you choose the partition key?

**Answer:** **Partitioning** splits one logical table into many physical **child tables (partitions)** by a key, while queries still target the parent. The three schemes: **range** (by date — the most common), **list** (by discrete value like region), and **hash** (even spread when there's no natural range).

**Benefits:**

- **Partition pruning** — a query with `WHERE created_at >= '2026-01-01'` only scans the relevant partitions, skipping the rest, so effective table size per query shrinks dramatically.
- **Cheap bulk deletes** — dropping old data is `DROP PARTITION` (an instant metadata operation) instead of a massive, bloat-generating `DELETE` — ideal for rolling retention windows.
- **Per-partition maintenance** — `VACUUM`/`ANALYZE`, and index rebuilds run per partition, keeping each one small and fast.

**Costs:** extra query-planning overhead (with thousands of partitions the planner slows down), and **global uniqueness is hard** — a `UNIQUE` constraint that doesn't include the partition key can't be enforced across all partitions cheaply.

**Guidance:** the canonical use case is **time-series** (logs, events, metrics) partitioned by time. Use Postgres **declarative partitioning** (v10+), which replaced the old inheritance/trigger hacks. Critically, **choose a partition key that appears in most queries' `WHERE` clauses** — otherwise you get no pruning and pay only the costs. And **automate partition creation** (e.g. `pg_partman`) so new time ranges get partitions before data arrives; manual creation inevitably gets missed and inserts fail.

**Key points:**
- Time-series logs/events are the canonical use case.
- Postgres declarative partitioning (10+) replaces inheritance tricks.
- Choose partition key matching most queries' WHERE clauses.
- Automate partition creation (pg_partman) — manual is error-prone.

---

### 40. Online schema migrations

**Frequency:** Medium

**Question:** How do you run schema migrations online without locking a busy table? Explain the expand/contract pattern.

**Answer:** The danger is that naive DDL takes a **strong table lock** that blocks reads/writes for the duration: rewriting every row to add a `NOT NULL` column with a default, building an index (which locks against writes), or changing a column type can freeze a busy table for minutes — an outage.

The safe approach breaks one risky change into **small, non-locking steps** and never rewrites the whole table at once. To add a required column:

1. **Add a nullable column** (fast, metadata-only).
2. **Backfill in throttled batches** (e.g. 1k rows at a time with a pause), so you never hold a long transaction or spike load.
3. **Add the `NOT NULL` constraint** (validate separately/`NOT VALID` then `VALIDATE` in Postgres to avoid a full-table lock).
4. **Drop the old column** once nothing reads it.

Modern Postgres helps: **`CREATE INDEX CONCURRENTLY`** builds without blocking writes, and since v11 **`ADD COLUMN ... DEFAULT`** is a metadata-only operation (no rewrite) for constant defaults. For MySQL or heavier changes, use online-DDL tools — **`gh-ost`**, **`pt-online-schema-change`** (build a shadow table, backfill, swap), or **`pg_repack`**.

The overarching principle is the **expand/contract (parallel change)** pattern: first **expand** the schema to support *both* old and new shapes, deploy application code that writes/reads compatibly, migrate the data, then **contract** by removing the old shape — each step is independently reversible and keeps every migration **forward-compatible with the previously deployed app version**, so a rollback never breaks.

**Key points:**
- Never run `ALTER TABLE` blindly on a busy table in prod.
- Backfills should be batched with throttling.
- Expand/contract pattern: deploy code that handles both shapes before migrating.
- Keep migrations forward-compatible with the previous app version.

---

### 41. DB constraints vs app validation

**Frequency:** Medium

**Question:** Why enforce both database constraints and application validation? What does each catch that the other misses?

**Answer:** They operate at different layers and defend against different failures, so a robust system uses **both**.

**Database constraints** (`NOT NULL`, `FOREIGN KEY`, `UNIQUE`, `CHECK`) are the **last line of defense** and the only one that's *absolutely* enforced. They protect the data no matter what touches it — a buggy deploy, a second service, an ad-hoc `psql` session, a data-migration script. Two things only the DB can reliably do: a `FOREIGN KEY` prevents **orphaned rows** even when an ORM's cascade logic is wrong, and a `UNIQUE` constraint catches **race conditions** that application-level "check then insert" logic cannot — two concurrent requests can both pass an app-side "is this email taken?" check and then both insert, and only the DB's unique index stops the duplicate.

**Application validation** provides what the DB can't: **friendly, field-level error messages** for users; **business rules the DB can't express** or that span multiple resources/services (e.g. "a user on the free plan may have at most 3 projects"); and it **avoids a round-trip** by rejecting obviously bad input before hitting the database.

The rule: **never rely on app validation alone** — the database shouldn't trust the application, because someday something other than your validated code path will write to it. Keep validation logic near the model layer so it's shared across every endpoint, and **map constraint violations to clear API error codes** (a unique-violation → `409 Conflict` with a specific `code`, not a raw 500).

**Key points:**
- FK constraints prevent orphaned rows even when ORMs misbehave.
- UNIQUE catches race conditions app-level checks miss.
- Keep validation logic close to the model layer; share it across endpoints.
- Constraint violations should map to clear API error codes.

---

### 42. Soft vs hard delete

**Frequency:** Medium

**Question:** Compare soft delete and hard delete. What problems does soft delete create, and how do you mitigate them?

**Answer:** **Hard delete** physically removes the row (`DELETE FROM ...`). **Soft delete** keeps the row but marks it, typically by setting a `deleted_at` timestamp (or `is_deleted` flag), and filters it out on reads.

Soft delete buys you an **audit trail, easy undo, and referential safety** (rows that point to it don't dangle) — valuable for user-facing data where accidental deletion is costly. But it introduces real friction:

- **Query pollution** — *every* query must remember `WHERE deleted_at IS NULL`, and a single forgotten filter leaks "deleted" data.
- **Broken uniqueness** — a `UNIQUE(email)` constraint now rejects a *new* signup because a soft-deleted user still occupies that email.
- **Unbounded table growth** — dead rows accumulate forever, bloating indexes and slowing scans.

Mitigations:

- Use a **partial unique index** (`UNIQUE(email) WHERE deleted_at IS NULL`) so uniqueness applies only to live rows.
- Apply a **default scope/view** (many ORMs support a global "live rows only" scope) so developers can't forget the filter.
- Run a **background purge job** to hard-delete rows past a retention window, capping growth.

One critical caveat: **GDPR / CCPA right-to-erasure** usually can't be satisfied by soft delete — the data still exists — so those requests need a genuine **hard delete or anonymization**. A common hybrid is soft-delete for undo, then hard-delete/anonymize on the retention or legal deadline.

**Key points:**
- Partial unique indexes work around soft-delete uniqueness issues.
- GDPR right-to-erasure usually mandates hard delete or anonymization.
- Default views/scopes that hide deleted rows prevent leaks.
- Background jobs can purge soft-deleted rows after a retention window.

---

### 43. UUID vs auto-increment PKs

**Frequency:** Medium

**Question:** Compare UUID and auto-increment integer primary keys. Why do random UUIDs hurt write performance, and how does UUIDv7 help?

**Answer:** **Auto-increment integers** (`BIGSERIAL`) are compact (8 bytes), naturally **sorted**, and cache-friendly — new rows append to the "right edge" of the B-tree, so inserts are fast and the index stays dense. They're the fastest option for inserts and joins. Their downsides: they **leak business metrics** (an `id=5023` on a signup tells competitors your user count and lets attackers **enumerate** `/users/5024`), and they require a central sequence, which is awkward across distributed writers and offline clients.

**UUIDs** are 128-bit, **globally unique**, and can be **generated client-side** without coordinating with the DB — ideal for distributed systems, merge-friendly data, and public identifiers that don't leak counts. The catch is performance: a random **UUIDv4** inserts into a *random* spot in the B-tree every time, causing **page splits and fragmentation** (write amplification), a poor cache hit rate, and bloated indexes — measurably slower inserts on large tables.

**UUIDv7** (and **ULID**) fixes this by making the high bits a **timestamp**, so new IDs are **time-ordered** and insert near the right edge like an integer — you keep global uniqueness and non-leakage *and* regain insert locality. That makes **UUIDv7/ULID the modern default** for new systems.

Guidance: never expose sequential integer IDs in URLs (enumeration); use UUIDs for distributed systems and public APIs while integers remain fine for purely internal tables; and always store UUIDs in the native **`uuid`** type (16 bytes) rather than `text` (36 bytes) — the wrong type triples storage and slows every comparison.

**Key points:**
- Never expose sequential IDs in URLs (enumeration attacks).
- UUIDv4 random ≠ insert-ordered → write amplification.
- UUIDv7 / ULID are the modern default.
- Postgres `uuid` type is 16 bytes vs `text` 36 — always use the native type.

---

### 44. Document stores: embed vs reference

**Frequency:** Medium

**Question:** In a document store, when do you embed child data versus reference it? What are the tradeoffs?

**Answer:** The decision hinges on the **lifecycle and access pattern** of the child data relative to its parent.

**Embed** (nest the child inside the parent document) when the child is:

- **Bounded** — it won't grow without limit (order line items, a post's address).
- **Accessed with the parent** — you almost always read them together.
- **Owned by / changes with the parent** — it has no independent life.

Embedding makes reads a **single lookup with no join** — the whole aggregate comes back at once, which is the document model's core performance win.

**Reference** (store the child's ID and look it up separately) when the child is:

- **Shared** across many parents (a `user` referenced by thousands of `posts`).
- **Unbounded** (a chat's messages, an account's events — could grow to millions).
- **Independently mutated** — you update it on its own often.

Tradeoffs: embedding optimizes reads but **bloats the document** and **duplicates data**, so an update to embedded data must be applied everywhere it was copied. References keep data normalized but require **application-side joins** (`$lookup` or N follow-up queries). Concrete constraints push the decision: MongoDB's **16 MB document limit** forces references for anything that grows unbounded. A common **hybrid** is to embed a *summary* (author name + avatar for display) and reference the full record for details. As always in NoSQL, **design for the dominant query** — model the shape you read most.

**Key points:**
- MongoDB 16MB document limit forces references for unbounded growth.
- Embedded subdocs avoid joins but duplicate on update.
- Hybrid: embed a summary + reference for details.
- Design for the dominant query pattern.

---

### 45. Key-value stores (Redis, DynamoDB)

**Frequency:** Medium

**Question:** Compare Redis and DynamoDB as key-value stores. What are their sweet spots and operational gotchas?

**Answer:** Both are key-value stores that **trade query flexibility for raw speed and horizontal scale** — neither lets you run ad-hoc joins or filters, so you **model around your access patterns** up front.

**Redis** is an **in-memory** store (single-threaded per shard, so commands are atomic and there are no lock races) with **rich data types** — strings, hashes, lists, sets, sorted sets, streams, HyperLogLog, bitmaps. Being in-memory it's blindingly fast (sub-millisecond) but bounded by RAM, and durability is optional (RDB snapshots / AOF). Sweet spots: **caching, sessions, leaderboards (sorted sets), rate limiting, real-time counters, and lightweight queues/streams**.

**DynamoDB** is a **fully managed**, multi-AZ, disk-backed store that delivers **single-digit-millisecond** latency at essentially unlimited scale with **zero operations**. Its query model is deliberately narrow: fetch by **partition key** (or partition key + **sort key** range); anything else needs a **Global Secondary Index (GSI)**. Sweet spot: **serverless and high-scale apps** that want predictable latency and no servers to manage.

Operational gotchas: in DynamoDB, a poorly chosen partition key creates **hot partitions** (throttling), and **GSIs are eventually consistent** (propagation lag), so a read right after a write may miss it. In Redis, avoid `KEYS *` in production (it blocks the single thread — use `SCAN`); and in **cluster mode** keys are sharded across nodes, so multi-key operations (`MGET`, transactions, Lua touching several keys) require **hash tags** (`{user123}:...`) to co-locate the keys on one shard.

**Key points:**
- Redis for caching, sessions, leaderboards, rate limiting, queues.
- DynamoDB for serverless apps wanting zero ops + predictable latency.
- Watch DDB hot keys and GSI propagation lag.
- Redis cluster mode shards keys; multi-key ops require hash tags.

---

### 46. Eventual consistency patterns

**Frequency:** Medium

**Question:** What is eventual consistency, and which patterns make it usable for real applications?

**Answer:** **Eventual consistency** means that if writes stop, all replicas will *eventually* converge to the same value — but for some window after a write, different replicas can return different (stale) results. It's the price AP systems pay for staying available and fast under partitions, and it's fine for likes/view-counts but jarring for a user who doesn't see their own change.

The patterns that make it livable are **client-centric consistency guarantees**:

- **Read-your-writes** — a user always sees their own updates; achieved by routing that user's reads to the primary (or a caught-up replica) for a short window, or via session affinity.
- **Monotonic reads** — a user never sees time go backwards (a value they saw, then didn't); achieved by pinning a session to the **same replica** so it can't read from a more-lagged one.
- **Bounded staleness** — guarantee replicas are at most *X* seconds behind, so the app can reason about the worst case.
- **Causal consistency** — preserve cause-and-effect ordering (you see the reply only after the comment it answers); tracked with **vector clocks**/version vectors.

When staleness is unavoidable, **surface it in the UI** ("updating…", optimistic rendering) rather than showing a confidently wrong value.

Safeguards: **avoid eventual consistency for money and inventory** unless you add reconciliation; use **compensating actions** (sagas) to fix conflicts you can't prevent; prefer **CRDTs or explicit merge functions** over naive **last-write-wins**, which silently discards a concurrent update; and **test with deliberately injected replica lag** in staging, because these bugs are invisible on a single fast node.

**Key points:**
- Avoid for money/inventory unless reconciled.
- Compensating actions handle conflicts you can't prevent.
- Last-write-wins is simple but loses data; CRDTs or merge functions are safer.
- Test with deliberate replica lag in staging.

---

### 47. Redis data types & use cases

**Frequency:** Medium

**Question:** Walk through the main Redis data types and a use case for each. What are the key production practices?

**Answer:** Redis's power is that each data type is purpose-built, so you pick the structure that matches the workload:

- **Strings** — caches, JSON blobs, and atomic **counters** (`INCR` for page views, rate-limit tallies).
- **Hashes** — store an object's fields with **partial update** (`HSET user:42 name ...`) without re-serializing the whole object.
- **Lists** — ordered sequences for simple **queues** (`LPUSH`/`BRPOP`) and "recent N" feeds.
- **Sets** — unordered unique members for **tags, dedup, and membership** tests, plus set algebra (intersections for "mutual friends").
- **Sorted sets (ZSET)** — members ranked by score: the go-to for **leaderboards**, time-range queries, and **sliding-window rate limiters** (score = timestamp).
- **Streams** — an append-only log with **consumer groups** (a "Kafka-lite" for event pipelines with acks and replay).
- **HyperLogLog** — probabilistic **cardinality estimation** (unique visitors) in ~12 KB regardless of count.
- **Bitmaps** — compact **presence/activity** tracking (daily-active bit per user id).

Production practices: **never `KEYS *`** on a live server — it scans everything and blocks the single thread; use **`SCAN`** for cursored iteration. Batch round-trips with **pipelining**, and use **Lua scripts** (or `MULTI`) for **atomic multi-op** sequences (read-modify-write without a race). Set a **TTL per key** and a sane **eviction policy** (`allkeys-lru` is a good cache default) so memory stays bounded. And reach for modules — **RedisJSON** and **RediSearch** — when you need document access or full-text/secondary-index queries beyond the core types.

**Key points:**
- Avoid `KEYS *` in prod — use `SCAN`.
- Pipelining and Lua scripts for atomic multi-op batches.
- TTL per key; eviction policy (`allkeys-lru` is sane default).
- RedisJSON/Search modules add document and full-text features.

---

### 48. Cache stampede mitigations

**Frequency:** Medium

**Question:** What is a cache stampede, and how do you prevent one when a hot key expires?

**Answer:** A **cache stampede** (or "dogpile") happens when a popular key expires and, in the tiny window before it's repopulated, **hundreds or thousands of concurrent requests all miss at once** and stampede the origin database simultaneously. The DB — which the cache existed to protect — gets hit with its full uncached load in an instant and can fall over, which is especially dangerous during a traffic spike.

Mitigations:

- **Single-flight / request coalescing** — only the *first* missing request actually recomputes the value; concurrent callers wait for that one result instead of each hitting the DB. Often implemented with a short-lived **lock** on the rebuild key.
- **Probabilistic early expiration** — treat the value as expired *before* its real TTL with rising probability as expiry nears (the XFetch algorithm), so a single request refreshes it early while the old value is still serving everyone else — no synchronized cliff.
- **Background refresh** — a job proactively refreshes hot keys as they approach expiry, so users never hit the miss.
- **Stale-while-revalidate** — keep serving the stale value while one worker rebuilds in the background, trading a little staleness for zero origin spike.

Supporting practices: never let a huge fan-out key expire on a hard, shared instant — **add jitter to TTLs** (e.g. `300s ± random`) so keys don't all expire together; and during incidents, **monitor both cache hit ratio *and* origin pressure**, since a dropping hit ratio is the leading indicator of an impending stampede.

**Key points:**
- Don't sync-expire huge fan-out keys at the same instant.
- Add jitter to TTLs to avoid synchronized expiry.
- "Stale-while-revalidate" pattern serves stale during rebuild.
- Monitor cache hit ratio AND origin pressure during incidents.

---

### 49. CDN for API responses

**Frequency:** Medium

**Question:** How do you cache API responses at a CDN, and what must you never cache there?

**Answer:** A CDN caches your `GET` responses at edge POPs **close to users**, so repeated requests for the same public data are served in a few milliseconds without ever touching your origin — a huge latency and load win for things like exchange rates, product catalogs, and public config.

You control it with **HTTP caching headers**:

- **`Cache-Control: public, max-age=N`** — cacheable by anyone for N seconds; add **`s-maxage`** to set a different, usually longer, lifetime for *shared* caches (the CDN) than for browsers.
- **`Vary`** — tells the CDN which request headers (e.g. `Accept-Encoding`, `Accept-Language`) produce different responses, so it keys them separately. A missing or overly broad `Vary` causes wrong-variant bugs.

For **invalidation**, tag responses with **surrogate keys / cache tags** so that on a write you can purge exactly the affected objects ("purge everything tagged `product:42`") instead of the whole cache. Combine **event-driven purge on write** with a **TTL ceiling** as a backstop, so a missed purge still self-heals.

The critical rule: **never cache user-specific or sensitive responses in a shared cache** — a response marked `public` that contains user A's data can be served to user B (a serious data leak). Personalized responses must be `private` (browser-only) or keyed per user/segment. Efficiency add-ons: **`ETag` + `If-None-Match`** lets the origin return a cheap **`304 Not Modified`** on revalidation instead of resending the body; and **`stale-while-revalidate`** / **`stale-if-error`** let the edge serve slightly stale content while refreshing (or when the origin is down), improving both latency and resilience.

**Key points:**
- ETag + `If-None-Match` returns 304 cheaply for revalidation.
- Stale-while-revalidate / stale-if-error improve resilience.
- Purge on write (event-driven) plus TTL ceiling.
- Avoid CDN for sensitive personalized data unless segmented properly.

---

### 50. Goroutines & M:N scheduler

**Frequency:** Medium

**Question:** How do goroutines and Go's M:N scheduler work, and how do goroutine leaks happen?

**Answer:** A **goroutine** is a lightweight, user-space task managed by the Go runtime, not the OS. The scheduler is **M:N**: it multiplexes **N** goroutines onto **M** OS threads (roughly one thread per CPU core), so millions of goroutines can run on a handful of threads. Each goroutine starts with a tiny **~2 KB stack** that **grows and shrinks dynamically**, which is why spawning one is essentially free — `go func()` is the cheapest concurrency primitive in any mainstream language.

The scheduler is **work-stealing** (an idle thread steals runnable goroutines from a busy thread's queue for load balancing) and **preemptive** (since Go 1.14 it can interrupt a goroutine stuck in a tight loop, so one CPU-bound goroutine can't starve the others). **`GOMAXPROCS`** controls how many OS threads run Go code simultaneously and defaults to `runtime.NumCPU()`.

Goroutines coordinate via **channels** and **`select`** in the CSP style — the idiom is *"don't communicate by sharing memory; share memory by communicating,"* which sidesteps many lock bugs by passing ownership of data through channels.

**Leaks** happen when a goroutine blocks forever with no way to exit — e.g. it's waiting to send on a channel no one will ever receive from, or waiting on a receive that will never come. Because goroutines are cheap, leaked ones accumulate silently, holding memory and resources until the process OOMs. The fix is to always give a goroutine an **exit path**: thread a **`context.Context`** through and `select` on `ctx.Done()`, use timeouts, and ensure channels get closed — so the goroutine can always be told to stop.

**Key points:**
- `go func()` is the cheapest concurrency primitive in any mainstream language.
- Don't share memory; communicate via channels (idiomatically).
- `GOMAXPROCS` defaults to `runtime.NumCPU()`.
- Forgotten goroutines = leaks; always have an exit path (context).

---

### 51. Async I/O event loop pitfalls

**Frequency:** Medium

**Question:** What are the main pitfalls when programming against an async event loop, and how do you avoid them?

**Answer:** The event loop runs **one thread** that rapidly switches between tasks at `await` points. Its cardinal rule: **never block the loop**. If a task does CPU-heavy work, calls a **synchronous** I/O library, or uses a blocking `sleep`, the *entire* loop freezes — *every* concurrent request stalls, not just that one. Symptoms are insidious: overall throughput craters, **tail latency (p99) explodes**, and health-check endpoints time out even though CPU looks idle (it's parked in a blocking call).

Key pitfalls and fixes:

- **Blocking calls** — push CPU work or sync libraries off the loop with a thread/process pool (`asyncio.to_thread`, `loop.run_in_executor`), so the loop stays free to service other tasks.
- **Unbounded `gather`** — firing off `gather(*thousands_of_tasks)` opens thousands of connections at once and can exhaust the DB pool, sockets, or memory. Cap concurrency with a **semaphore** (a bounded worker pool).
- **Missing timeouts** — an `await` on a hung remote call waits forever, tying up the task and any resources it holds. Always wrap awaits in a **timeout** (`asyncio.wait_for`).
- **Cancellation** — when a task is cancelled, a `CancelledError` is raised at its current `await`; if it's mid-way through mutating state or holding a lock/connection, you can leak resources or corrupt state. Handle cleanup in `finally` and **test cancellation paths**, which are routinely buggy.

Use event-loop monitoring (e.g. `aiodebug`, `uvloop` stats) to catch a loop that's being blocked, and prefer fully-async drivers end to end so no sync call sneaks in.

**Key points:**
- Profile with event-loop monitoring (e.g., `aiodebug`, `uvloop` stats).
- Wrap sync libs with `asyncio.to_thread` / `run_in_executor`.
- Always set timeouts on awaits.
- Test cancellation paths — they're routinely buggy.

---

### 52. Backpressure

**Frequency:** Medium

**Question:** What is backpressure, and what mechanisms let a system apply it end-to-end?

**Answer:** **Backpressure** is a slow consumer signaling upstream to **"slow down"** so it isn't overwhelmed. Without it, a fast producer feeding a slow consumer causes the queue between them to grow without bound — latency climbs as the queue lengthens, memory fills, and eventually the process **OOMs and crashes**, often taking a cascade of upstream services with it. So backpressure is fundamentally about **stability under overload**: degrade gracefully instead of collapsing.

Mechanisms that carry the "slow down" signal at different layers:

- **Bounded queues** — a fixed-capacity queue that **blocks** the producer (or **drops**) when full, converting "unbounded memory growth" into "the producer waits."
- **HTTP `429 Too Many Requests` / `503 Service Unavailable`** (with `Retry-After`) — an overloaded service telling clients to back off.
- **Reactive Streams `request(n)`** — the consumer explicitly pulls only as many items as it can handle, so the producer never sends more.
- **TCP flow control** — the receive window is backpressure built into the transport: a slow reader shrinks the window and the sender throttles automatically.
- **Async iteration with `await`** — an `async for` naturally paces the producer to the consumer's speed.

The two principles: **unbounded queues are bugs in disguise** — always bound them and decide explicitly whether to **block, drop, throttle, or shed load** when full; and **propagate backpressure end-to-end** (gateway → service → queue → DB), because relieving pressure at one hop while the next stays unbounded just moves the failure. Measure **queue depth** and **reject early** under load rather than accepting work you can't complete.

**Key points:**
- Always bound queues — unbounded queues are bugs in disguise.
- Drop, throttle, or shed load when overwhelmed.
- Propagate backpressure end-to-end (gateway → service → DB).
- Measure queue depth and reject early under load.

---

### 53. Saga pattern

**Frequency:** Medium

**Question:** What is the saga pattern, and how do choreography and orchestration differ?

**Answer:** A **saga** coordinates a business transaction that spans multiple services **without a distributed (2PC) transaction** — which you avoid because locking rows across services for the duration kills availability and doesn't scale. Instead, the saga is a sequence of **local transactions**, one per service (reserve inventory, charge card, book shipment), each committing independently. If a later step fails, the saga runs **compensating transactions** that semantically **undo** the completed steps in reverse (refund the card, release the inventory). Note compensation is *semantic*, not a rollback — you can't un-send an email, so you send a cancellation.

Two coordination styles:

- **Choreography** — no central controller; each service **reacts to events** emitted by the previous one (`OrderCreated` → payment service charges → emits `PaymentCompleted` → shipping service reacts...). Decoupled and simple for short flows, but with many steps the logic is smeared across services and becomes hard to follow, debug, or visualize ("what's the overall state?").
- **Orchestration** — a central **orchestrator** explicitly drives the steps and decides what to do on failure. Easier to reason about, monitor, and change, at the cost of one more component and a risk of it becoming a god-service. Modeling it as an explicit **state machine** makes progress and compensation visible.

Critical design rules: **design compensations up front** (every forward step needs a defined undo), and make **both** forward steps and compensations **idempotent**, since at-least-once messaging means any step may be retried. Common orchestrators: **Temporal, Camunda, AWS Step Functions**.

**Key points:**
- Compensations must be designed up-front and idempotent.
- Use for cross-service flows like book-flight + book-hotel + charge-card.
- Visualize state with a state machine.
- Temporal, Camunda, AWS Step Functions are common orchestrators.

---

### 54. Idempotent consumers

**Frequency:** Medium

**Question:** What makes a message consumer idempotent, and why is this essential under at-least-once delivery?

**Answer:** An **idempotent consumer** produces the **same end state** whether it processes a given message once or five times. This is essential because virtually all durable messaging (Kafka, SQS, RabbitMQ) guarantees **at-least-once** delivery — a consumer that crashes after doing the work but before acking, or a redelivery after a slow ack, means **duplicates are normal, not exceptional**. If your consumer isn't idempotent, a duplicate double-charges a card or double-ships an order.

Techniques, roughly in order of preference:

- **Naturally idempotent operations** — design the write so repetition is harmless: an **`UPSERT`** (insert-or-update by key), a **conditional update** (`SET status='paid' WHERE status='pending'`), or setting an absolute value rather than incrementing. No bookkeeping needed.
- **Dedup on a message ID** — record each processed message's ID in a **`processed_ids` table (or Redis set) with a TTL**, and skip anything already seen. Requires a **stable, producer-supplied ID** (don't generate it on the consumer side, or retries look new).
- **Transactional outbox + processed-IDs table** — write the business change *and* the "I processed message X" record in **one local transaction**, so you can never do the work without also recording that you did.

Key details: the **dedup window must cover the maximum retry horizon** — if messages can be redelivered for 3 days, a 1-hour dedup TTL lets an old duplicate slip through. **Side effects that leave your database** (sending an email, calling a payment API) need extra care, because a local dedup table can't undo them — push idempotency into the external call itself via an **idempotency key**. Finally, **test with deliberate replays** — idempotency bugs only surface under duplication.

**Key points:**
- Always include a stable message ID from the producer.
- Dedup window must cover max retry horizon.
- Side effects (emails, payments) need extra care — use idempotency keys.
- Test consumer with deliberate replays.

---

### 55. Dead letter queues

**Frequency:** Medium

**Question:** What is a dead letter queue, and why is it critical for a healthy message pipeline?

**Answer:** A **dead letter queue (DLQ)** is a separate queue where messages that **repeatedly fail to process** are parked instead of being retried forever or silently dropped. After a message exceeds a threshold — SQS's **`maxReceiveCount`**, RabbitMQ's max-retries/rejects, Kafka's configured retry limit — the broker moves it to the DLQ so the main flow can keep moving.

Why it's critical: without a DLQ, a **poison message** (one that always throws — malformed payload, a referenced record that was deleted) gets retried endlessly. In an ordered system like a Kafka partition, that poison message sits at the head and **blocks every message behind it**, stalling the whole partition. The DLQ is the release valve that lets good traffic proceed while quarantining the bad message for investigation.

Operational must-haves:

- **Alert on DLQ depth** — a rising DLQ is a real incident signal; a DLQ no one watches is just a silent black hole.
- **Build inspect/fix/replay tooling** — you need to examine a dead message, correct the root cause (deploy a fix, patch data), and **replay** it back to the main queue.
- **Attach failure metadata on transfer** — the original headers, the exception/reason, and a timestamp, so triage doesn't require guesswork.
- **Never silently drop** — discarding failed messages loses data; the DLQ makes failures visible and recoverable.
- **Periodically clean up** the DLQ so it doesn't grow unbounded once issues are resolved.

**Key points:**
- Default DLQ with metrics and dashboards is table stakes.
- Poison messages can stall a partition without a DLQ.
- Include original headers and failure reason on transfer.
- Periodic DLQ cleanup so it doesn't grow unbounded.

---

### 56. Event sourcing & CQRS

**Frequency:** Medium

**Question:** Explain event sourcing and CQRS. What are their benefits, and what are the real costs?

**Answer:** **Event sourcing** stores state as an **append-only log of immutable events** (`OrderPlaced`, `ItemAdded`, `OrderShipped`) rather than as a mutable current-state row. The current state is derived by **replaying** the events. Because you keep every change, you get a **perfect audit trail**, **time travel** (reconstruct state as of any past moment), and the freedom to build **new projections** from history you didn't anticipate.

**CQRS (Command Query Responsibility Segregation)** separates the **write model** from the **read model**. Commands validate business rules and emit events (the write side); those events update one or more **denormalized read models (projections)** each shaped for a specific query. The two sides scale and evolve independently. CQRS is often paired with event sourcing (events are the natural bridge) but doesn't require it.

The **real costs** are why you don't apply this everywhere:

- **Event/schema evolution** — events are immutable and stored forever, so a changed event shape means versioning events and writing upcasters; events effectively become a long-lived API you must maintain.
- **Replay performance** — rebuilding an aggregate with a long history is slow; you add **snapshots** (periodic materialized state) so replay starts from the latest snapshot instead of event 0.
- **Projection rebuilds** — changing a read model means replaying history to repopulate it, which is operationally heavy at scale.
- **Eventual consistency** — read models lag the write model, so the UI must tolerate "your change is processing."

Use it for domains with **strong audit/regulatory or temporal-analysis needs** (finance, ledgers, order lifecycles), and apply it to **targeted aggregates**, not the whole system.

**Key points:**
- Snapshots speed up replay for aggregates with long histories.
- Events are part of your API — version them carefully.
- Use for domains with strong audit/regulatory needs.
- Don't event-source everything — pick targeted aggregates.

---

### 57. Python: GIL/asyncio/multiprocessing

**Frequency:** Medium

**Question:** How do you choose among asyncio, threading, and multiprocessing in Python for a given workload?

**Answer:** The choice follows directly from the **GIL**, which lets only one thread run Python bytecode at a time, and from whether your workload is **I/O-bound or CPU-bound**.

- **`asyncio`** — single-threaded **cooperative** concurrency. One thread juggles huge numbers of `await`-able tasks, switching at each `await`. Ideal for **high-concurrency I/O-bound** work (thousands of simultaneous network/DB calls) with minimal per-task overhead. No GIL contention because it's one thread, but a single blocking call freezes everything.
- **`threading`** — real OS threads, but the GIL serializes their Python execution, so they give **no CPU speedup**. They *do* help **I/O-bound** code, because blocking I/O (sockets, disk) **releases the GIL** while waiting, letting other threads run. Good when you must use a **synchronous** library and don't want to rewrite it as async.
- **`multiprocessing`** — separate **processes**, each with its own interpreter and GIL, so they achieve **true parallelism** for **CPU-bound** work (image processing, numeric crunching). The cost is heavier startup and **IPC via pickling**, so data crossing the boundary must be picklable and copies aren't free.

Practical guidance: pick by workload — I/O concurrency → asyncio; blocking-lib I/O → threads; CPU parallelism → processes. To use a **sync library inside asyncio**, offload it with **`asyncio.to_thread`** / `run_in_executor` so it doesn't block the loop. **`concurrent.futures`** (`ThreadPoolExecutor`/`ProcessPoolExecutor`) gives one uniform API over both. And note the landscape is shifting: **subinterpreters (3.12+)** and the **free-threaded (no-GIL) build (3.13+)** are starting to allow real threaded parallelism without multiprocessing's IPC overhead.

**Key points:**
- Don't mix asyncio with sync libraries without `to_thread`.
- `concurrent.futures` gives a uniform API over threads/processes.
- Subinterpreters (3.12+) and free-threading (3.13+) reshape the landscape.
- Picklability constraints bite `multiprocessing` users.

---

### 58. Python: type hints, mypy

**Frequency:** Medium

**Question:** What does Python's optional static typing give you, and how do you adopt it incrementally?

**Answer:** **PEP 484** added optional **type hints** (`def f(x: int) -> str:`) that checkers like **mypy** and **pyright/Pylance** verify **statically**, before the code runs. The payoff: hints **document intent** at the signature level, **catch a class of bugs** (passing `None` where a value is required, typo'd attributes, wrong argument types) without executing code, and power rich **IDE intelligence** (autocomplete, refactoring, go-to-definition) — all at **zero runtime cost**, since the interpreter ignores them.

Modern typing features (3.10+) make this expressive:

- **`X | None`** — concise optional/union syntax (replacing `Optional[X]`).
- **`Protocol`** — **structural** typing ("duck typing with static checks"): any object with the right methods satisfies it, no inheritance required.
- **Generics** (`class Stack[T]:` in 3.12), **`TypeAlias`**, **`Self`**, and **`TypedDict`** (typing the shape of a dict/JSON payload).

**Incremental adoption** is the key selling point — you don't have to type everything at once. Start untyped, add hints module by module, silence known gaps with **`# type: ignore`**, and ratchet strictness per module (e.g. enable `disallow_untyped_defs` on files you've cleaned up) so coverage only grows.

One crucial caveat: **hints are not enforced at runtime** — nothing stops someone passing the wrong type at a boundary. For **runtime validation** of external input (API bodies, config) you need **Pydantic** or **attrs**, which read the annotations and actually check/coerce values. Practically, **pyright** is faster and stricter than mypy, and **`from __future__ import annotations`** makes annotations lazy strings, enabling forward references and cheaper imports.

**Key points:**
- `pyright` (Pylance) is faster and stricter than `mypy`.
- Runtime validation needs Pydantic/attrs — types aren't enforced.
- `Protocol` enables duck typing with static checks.
- Use `from __future__ import annotations` for forward refs.

---

### 59. Go: channels vs mutexes

**Frequency:** Medium

**Question:** In Go, when do you use channels versus mutexes to coordinate goroutines?

**Answer:** Go's guiding mantra is *"Don't communicate by sharing memory; share memory by communicating."* The idea: instead of multiple goroutines locking and mutating the same variable, pass the data itself through a **channel**, transferring **ownership** so only one goroutine touches it at a time. This often yields clearer designs — pipelines, worker pools, fan-in/fan-out — where the flow of data *is* the synchronization.

But the mantra is guidance, not dogma. The honest split:

- **Use channels** for **handoff and coordination** — passing work between goroutines, signaling completion, fanning results in, orchestrating stages of a pipeline. Channels express *"who owns this next."*
- **Use a mutex** for **protecting small shared state** — a counter, a map cache, a config struct read by many goroutines. A `sync.Mutex` around a few lines is **simpler and faster** than routing every access through a channel and a manager goroutine. Reaching for channels here is over-engineering.

Supporting tools: **`sync.RWMutex`** when reads vastly outnumber writes (many concurrent readers, exclusive writer); **`sync.Once`** for thread-safe lazy initialization; **`sync/atomic`** for lock-free counters/flags. With channels, remember **buffered channels** add capacity but an oversized buffer often **hides a design flaw** (papering over a slow consumer instead of applying backpressure), and **closing a channel** is the idiomatic "no more values" signal — receivers detect it with the comma-ok form (`v, ok := <-ch`), where `ok == false` means closed. Always run the **race detector** (`go test -race`) regardless of approach.

**Key points:**
- Buffered channels add capacity but hide design flaws if oversized.
- `sync.RWMutex` for read-heavy state.
- `sync.Once` for lazy init; `sync/atomic` for counters.
- Closing a channel signals completion; receivers detect with `, ok`.

---

### 60. Go: context cancellation

**Frequency:** Medium

**Question:** What is Go's `context.Context` for, and what are the best practices for using it?

**Answer:** **`context.Context`** propagates three things down a call chain: a **cancellation signal**, a **deadline/timeout**, and **request-scoped values**. Its main job is to let you **cancel work that's no longer needed** — when a client disconnects or a request times out, the cancellation flows to every goroutine, DB query, and HTTP call spawned under that request, so they stop promptly instead of running to completion and wasting resources.

Mechanics: pass `ctx` as the **first parameter** to any function that does I/O or spawns goroutines. Derive child contexts with **`WithCancel`**, **`WithTimeout`**, or **`WithDeadline`**; a child is automatically cancelled when its **parent** is cancelled (or when the timeout fires), forming a tree that tears down together. In long-running loops or select statements, watch **`ctx.Done()`** (a channel that closes on cancellation) and return `ctx.Err()`; context-aware stdlib calls (`db.QueryContext`, `http.NewRequestWithContext`) already do this for you — prefer those overloads.

Best practices:

- **Never store a Context in a struct** — pass it explicitly through function calls; a stored context outlives its request and causes subtle bugs.
- **Use it for request lifetime, not general dependency injection** — `context.Value` is for request-scoped data like a trace ID or auth principal, *not* for passing services/config (that hides dependencies and is untyped).
- **Always `defer cancel()`** after creating a cancellable context, even if it finishes normally — otherwise you leak the context's resources (a timer/goroutine).
- Treat a function that ignores the context it's given as a bug — cancellation only works if every layer respects it.

**Key points:**
- Never store context in structs — pass through functions.
- Use it for request lifetime, not for general DI.
- Always `defer cancel()` to release resources.
- Most stdlib libraries accept context; use those overloads.

---

### 61. Go: error handling

**Frequency:** Medium

**Question:** How does Go handle errors, and how do you wrap and inspect them idiomatically?

**Answer:** In Go, **errors are ordinary values**, not exceptions. Any function that can fail returns an `error` as its last result, and the caller checks it explicitly with `if err != nil`. This makes every failure path visible in the code (no invisible control-flow jumps), at the cost of verbosity. Go deliberately has **no exceptions** for expected failures; **`panic`** exists only for **unrecoverable programmer bugs** (nil deref, impossible state) and is caught, if at all, with `recover` at a boundary.

**Wrapping and inspection:**

- **Wrap** with context using **`fmt.Errorf("loading user %d: %w", id, err)`** — the **`%w`** verb preserves the original error in a chain so it can be unwrapped later (plain `%v` flattens it to a string and loses that ability).
- **Inspect** with **`errors.Is(err, target)`** to test against a **sentinel** (a known package-level value like `io.EOF` or `sql.ErrNoRows`), and **`errors.As(err, &target)`** to extract a **typed** error and read its structured fields (e.g. a `*PathError`'s path).

Style and safety:

- **Wrap once per layer**, adding a bit of context as the error crosses an abstraction boundary — not on every single line, which produces noisy, redundant chains.
- Use **`errors.Join`** (Go 1.20+) to aggregate multiple errors (e.g. from a batch) into one.
- **Don't ignore errors** — even an explicit `_ = f()` should be a deliberate, justified choice, not a reflex.
- **Custom error types** implement `Error() string`, and optionally **behavioral interfaces** (e.g. a `Temporary() bool` or `Timeout() bool` method) so callers can branch on behavior rather than exact type.

**Key points:**
- Wrap once at each layer, not every line.
- `errors.Join` for multi-error aggregation (1.20+).
- Don't ignore errors — even `_ = ...` should be deliberate.
- Custom error types implement `Error() string` + behavioral interfaces.

---

### 62. Java GC (G1, ZGC, Shenandoah)

**Frequency:** Medium

**Question:** Compare the major JVM garbage collectors. How do you choose based on latency, throughput, and heap size?

**Answer:** The JVM ships several collectors tuned for different goals along the **latency vs throughput** axis:

- **G1 GC** (the **default** since JDK 9) — splits the heap into **regions** and does most work concurrently, targeting **predictable, low pauses** (a configurable goal, e.g. `-XX:MaxGCPauseMillis=200`). It's the balanced all-rounder for heaps up to ~**32 GB** and the right default for typical services.
- **ZGC** and **Shenandoah** — **ultra-low-pause** collectors with **sub-millisecond, pause times that stay flat even as the heap grows to terabytes**. They achieve this by doing **compaction concurrently** with the application, using **load/read barriers** to keep references valid while objects move. Choose these for large-heap, latency-critical services (trading, low-latency APIs) where a GC pause is unacceptable. **Generational ZGC** (JDK 21+) adds a young generation so short-lived objects are reclaimed cheaply, improving throughput.
- **Parallel GC** — maximizes **raw throughput** (total work done) by using multiple threads for stop-the-world collections, accepting longer pauses. Best for **batch/analytics** jobs where overall completion time matters more than any single pause.

**How to choose:** latency-sensitive + large heap → ZGC/Shenandoah; balanced interactive service → G1; batch throughput → Parallel. Practical tuning: set **`-Xms` equal to `-Xmx`** so the JVM doesn't spend time resizing the heap; always capture **GC logs** (`-Xlog:gc*`) — they're the primary diagnostic for pause and allocation problems; and **avoid premature tuning** — the defaults are well-chosen, so change collectors/flags only in response to measured pause or throughput problems.

**Key points:**
- ZGC generational (JDK 21+) reclaims young objects faster.
- Tune heap size with `-Xms = -Xmx` to avoid resizing.
- GC logs (`-Xlog:gc*`) are essential for diagnosis.
- Avoid premature tuning — defaults are sane for most apps.

---

### 63. Node.js event loop & libuv & workers

**Frequency:** Medium

**Question:** How does the Node.js event loop work, and how do you keep CPU-bound work from blocking it?

**Answer:** Node runs your **JavaScript on a single thread**, while **libuv** drives asynchronous I/O underneath. The **event loop** cycles through fixed **phases** each tick:

1. **timers** — due `setTimeout`/`setInterval` callbacks.
2. **pending callbacks** — deferred system callbacks.
3. **idle/prepare** — internal.
4. **poll** — retrieve new I/O events and run their callbacks (where most work happens).
5. **check** — `setImmediate` callbacks.
6. **close** — `close` events (e.g. socket teardown).

Between phases (and after each callback), Node drains the **microtask queue** — resolved **Promises**, `queueMicrotask`, and `process.nextTick` (which jumps ahead of even other microtasks) — so microtasks always run before the loop advances to the next phase.

Because JS is single-threaded, **any CPU-heavy synchronous work blocks the entire loop** — `JSON.parse` of a huge payload, synchronous crypto/compression, a tight computation — and while it runs, **no other request is served**. Offload it: use **`worker_threads`** for CPU parallelism within the process (shared memory via `SharedArrayBuffer`), or **`child_process`** for heavier isolation. Note that async I/O itself doesn't block, because libuv handles it on a **thread pool** (sized by **`UV_THREADPOOL_SIZE`**, default 4) for filesystem and some crypto/DNS work.

Details worth knowing: **`setImmediate`** fires in the check phase (after poll), **`setTimeout(fn, 0)`** in the timers phase (next tick), and **`process.nextTick`** before the loop continues at all — distinct timings that matter for ordering. Profile loop stalls with **`clinic.js`**, **`--inspect`**, or **`--prof`**.

**Key points:**
- Don't block the loop with `JSON.parse` of huge payloads, sync crypto, etc.
- `setImmediate` vs `setTimeout(0)` vs `process.nextTick` — distinct phases.
- Native modules can do work off-loop via libuv's thread pool (`UV_THREADPOOL_SIZE`).
- Profile with `clinic.js`, `--inspect`, `--prof`.

---

### 64. Django vs Flask vs FastAPI

**Frequency:** Medium

**Question:** Compare Django, Flask, and FastAPI. When would you choose each?

**Answer:** The three sit on a **batteries-included ↔ minimal** spectrum:

- **Django** — **batteries-included**: a mature ORM, auto-generated **admin** interface, built-in **auth**, migrations, forms, and security defaults all in one opinionated package. It's the fastest way to ship **CRUD apps, content sites, and full-stack products** because so much comes for free. Paired with **Django REST Framework (DRF)** it remains the dominant choice for full-featured APIs with complex models and an admin need. The tradeoff is that it's heavier and more opinionated.
- **Flask** — a **micro-framework**: it gives you routing and request handling and lets *you* choose everything else (ORM, validation, auth). Maximum flexibility and a tiny core, at the cost of **more boilerplate and wiring**, and quality depends on the extensions you assemble. Pick it when you want **full control** or a small, bespoke service.
- **FastAPI** — the **modern async, type-driven** framework: it uses **Pydantic** type hints to validate/serialize request and response bodies and **auto-generates OpenAPI docs** (Swagger UI) from those types. Built on ASGI, it excels at **high-concurrency JSON APIs**. It's the default choice for **new API services**, especially I/O-bound ones.

How to choose: need an admin + rich ORM + fast full-stack CRUD → **Django (+DRF)**; want minimalism and total control → **Flask**; building a new, high-concurrency, well-typed API → **FastAPI**. Note Django's **async support** (3.0+) is solid at the view/middleware layer, but the **ORM's async story still lags**, so heavy async DB work is smoother in FastAPI + an async driver.

**Key points:**
- FastAPI for high-concurrency JSON APIs.
- Django when you need admin and ORM out of the box.
- Flask is the "I want full control" choice.
- Async support in Django (3.0+) is solid but ORM async lags.

---

### 65. TLS handshake & cert pinning

**Frequency:** Medium

**Question:** Walk through the TLS 1.3 handshake and explain certificate pinning and its risks.

**Answer:** **TLS 1.3** streamlined the handshake to **one round trip (1-RTT)**:

1. **ClientHello** — the client sends its supported cipher suites *and* a **key share** (an ephemeral Diffie-Hellman public value) up front, guessing the server's preferred group.
2. **ServerHello** — the server picks the cipher, sends its own **key share**, and its **certificate** (plus a signature). Both sides can now derive the shared session key.
3. **Finished** — a MAC over the handshake confirms integrity, and encrypted application data flows.

The client **verifies the server's identity** by validating the certificate **chain up to a trusted root CA** (signatures, expiry, hostname match, revocation). TLS 1.3 also supports **0-RTT resumption**, where a returning client sends data on the first flight using a pre-shared key — faster, but replay-able, so it's only safe for idempotent requests.

**Certificate pinning** hardens this further by binding a client to a **specific certificate or public key** rather than trusting *any* CA-issued cert for the domain. This defends against a **rogue or compromised CA** issuing a fraudulent certificate for a man-in-the-middle attack. The serious risk: if you pin the exact cert and then **rotate** it (renewal, key change), every pinned client that hasn't updated **breaks ("bricks")** — which is why pinning is mostly used in **mobile apps** (controlled release cycle) and rarely on general backends.

Best practices: TLS 1.3 **dropped RSA key exchange** and mandates **forward secrecy (PFS)** via ephemeral DH; **deprecate TLS 1.0/1.1** and weak ciphers; **automate certificate renewal** (Let's Encrypt/ACM) because an expired cert is a classic self-inflicted outage; and if you pin, **pin the SPKI (public-key hash)** rather than the whole certificate, and keep a **backup pin**, so you can rotate the cert without rotating the key and bricking clients.

**Key points:**
- TLS 1.3 drops RSA key exchange, requires PFS.
- Use modern cipher suites; deprecate TLS 1.0/1.1.
- Automate cert renewal (Let's Encrypt, ACM); expirations cause outages.
- Pin public-key SPKI, not the cert, for safer rotation.

---

### 66. Secrets management (Vault, KMS)

**Frequency:** Medium

**Question:** How do you manage secrets properly, and what is envelope encryption?

**Answer:** The baseline rule: **secrets never live in code, git history, or committed `.env` files** — once a secret touches a repo it's effectively compromised (repos get cloned, forked, and leaked), and rotating it out of history is painful. Instead use a dedicated **secrets manager** — **HashiCorp Vault**, **AWS Secrets Manager**, **GCP Secret Manager** — which provides **versioning, rotation, access control, and an audit log** of every read. The most powerful feature is **dynamic secrets**: Vault can mint **short-lived, on-demand database credentials** that auto-expire, so there's no long-lived password to steal.

**KMS and envelope encryption** handle *encryption keys* rather than arbitrary secrets. Rather than sending all your data to KMS to encrypt (slow, size-limited), you use **envelope encryption**:

1. KMS generates a **data encryption key (DEK)** and returns it in both plaintext and a KMS-encrypted form.
2. You encrypt your actual data **locally** with the plaintext DEK (fast, any size), then **discard the plaintext DEK** and store the **KMS-encrypted DEK** alongside the ciphertext.
3. To decrypt, you ask KMS to decrypt the DEK, then use it locally.

The master key **never leaves KMS/HSM**, and you can rotate it or revoke access centrally.

Operational practices: **rotate secrets on a schedule and immediately on personnel changes** (someone leaving with a known key); **audit-log every access** so you can detect anomalous reads; **inject secrets at runtime** (sidecar, init container, mounted volume, env at launch) rather than baking them into container images (images get pushed to registries and cached); and prefer **workload identity / IAM roles** over long-lived API keys wherever possible, so services authenticate with rotating, scoped credentials instead of a static secret.

**Key points:**
- Rotate secrets on a schedule and on personnel changes.
- Audit log every access.
- Inject at runtime (sidecar, init container), not bake into images.
- IAM roles > long-lived API keys whenever possible.

---

### 67. OWASP Top 10

**Frequency:** Medium

**Question:** What is the OWASP Top 10, and how should you use it? Why is Broken Access Control #1?

**Answer:** The **OWASP Top 10** is a periodically updated, community-ranked list of the **most critical web application security risks**, meant as an **awareness baseline and checklist** — a floor for "have we thought about these?", **not a ceiling** or a complete security program. The current categories:

1. **Broken Access Control** — users acting outside their permissions.
2. **Cryptographic Failures** — weak/missing encryption, exposed sensitive data.
3. **Injection** — SQL/NoSQL/command/LDAP injection.
4. **Insecure Design** — flaws baked into the architecture, not just bugs.
5. **Security Misconfiguration** — default creds, verbose errors, open buckets.
6. **Vulnerable and Outdated Components** — known-CVE dependencies.
7. **Identification and Authentication Failures** — weak login, session issues.
8. **Software and Data Integrity Failures** — unsigned updates, insecure deserialization, supply-chain.
9. **Security Logging and Monitoring Failures** — can't detect or investigate breaches.
10. **SSRF** — server tricked into making attacker-controlled requests.

**Broken Access Control ranks #1** because it's both the **most widespread and the most damaging**: it shows up constantly as **IDOR** (Insecure Direct Object Reference — changing `/orders/123` to `/orders/124` and seeing someone else's order) and as **missing authorization checks** on endpoints that only hid the button in the UI. Enforcement must be **server-side on every request**, denying by default and checking that the authenticated user actually owns/may access the specific resource.

How to use it: treat it as a **defense-in-depth** checklist — **patch dependencies** automatically (Dependabot/Renovate) since vulnerable components are ubiquitous; defend **SSRF** by denying requests to internal/metadata IPs (`169.254.169.254`), restricting outbound egress, and validating/allowlisting URLs; and layer **WAF + secure framework defaults + code review + SAST/DAST scans** rather than relying on any single control.

**Key points:**
- Broken Access Control is #1 — IDOR and missing checks are everywhere.
- Patch dependencies (Dependabot/Renovate) — vulnerable components are common.
- SSRF defense: deny-list metadata IPs, restrict outbound, validate URLs.
- Defense in depth: WAF + framework defaults + code review + scans.

---

### 68. CSRF on APIs vs forms

**Frequency:** Medium

**Question:** What is CSRF, and why are cookie-based sessions vulnerable while bearer-token APIs generally are not?

**Answer:** **CSRF (Cross-Site Request Forgery)** tricks a logged-in user's **browser** into sending an unwanted state-changing request to a site they're authenticated with. The attacker's page (or email) triggers a request to `bank.com/transfer`, and because the request goes to `bank.com`, the browser **automatically attaches the user's `bank.com` cookies** — so the server sees a validly-authenticated request the user never intended. The key insight: CSRF exploits **credentials the browser sends automatically**.

That's exactly why the vulnerability depends on the auth mechanism:

- **Cookie-based session auth is vulnerable** because cookies are attached automatically on any request to the domain. It needs explicit defense: a **CSRF token** (synchronizer pattern — the server embeds a random token in the form/page, and validates it on submit; an attacker's cross-site page can't read it) and/or **`SameSite=Lax/Strict`** cookies, which tell the browser **not** to send the cookie on cross-site requests.
- **Bearer-token APIs are not CSRF-vulnerable** because the token lives in the **`Authorization` header**, which the browser does **not** attach automatically — the app's JS must add it deliberately, and a malicious cross-origin page can't do that. (Storing that token in `localStorage` instead trades CSRF risk for XSS risk, a separate concern.)
- **Mixed auth** (accepting both a session cookie *and* a bearer token) is still vulnerable via the cookie path, so it needs CSRF protection.

Supporting points: **`SameSite=Lax`** is the modern browser default and stops most CSRF on its own; the **double-submit cookie** pattern gives stateless protection (send the token both as a cookie and a header and compare them); **never perform state changes via `GET`** (GETs are trivially triggered by an `<img>` tag); and remember **CORS is not a CSRF defense** — it governs whether JS can *read* a cross-origin *response*, not whether the request is *sent*, and the damage is done on the server the moment the request arrives.

**Key points:**
- `SameSite=Lax` is the modern default and stops most CSRF.
- Double-submit cookie pattern for stateless CSRF protection.
- Don't accept state-changing requests via GET.
- CORS prevents reading responses, not making requests — not a CSRF defense alone.

---

### 69. Rate limiting & abuse detection

**Frequency:** Medium

**Question:** How do you design layered rate limiting and abuse detection? How does "rate" differ from "concurrency"?

**Answer:** Effective protection applies limits at **multiple layers**, each catching a different abuse pattern:

- **Per-IP at the edge/gateway** — the cheapest, coarsest layer; blunts volumetric floods before they reach your app (though IPs are shared/spoofable, so it's a filter, not the whole story).
- **Per-API-key at the app** — fair-usage enforcement per customer/tenant.
- **Per-route for expensive endpoints** — a tight limit on costly operations (search, report generation, exports) that a global limit would miss.
- **Per-user for sensitive operations** — strict limits on **login, password reset, OTP**, where the attack is credential stuffing rather than volume.

Layer on **abuse detection** via anomaly signals: a **surge of failed logins**, sudden traffic from **newly-seen IPs**, unusual **user agents** or geographies, or one account hitting many accounts' data. Respond proportionally — **CAPTCHA** on suspicion, **exponential backoff** on repeated failures, and temporary **account lockouts** for clear credential-stuffing.

A key distinction: **rate** (requests per unit time — e.g. 100/min) is different from **concurrency** (simultaneous in-flight requests — e.g. at most 5 running exports). A user can be under the rate limit yet still overwhelm a slow downstream by holding many requests open at once, so expensive endpoints often need **both** a rate limit and a concurrency limit.

Practices: always return **`X-RateLimit-Limit/Remaining/Reset`** (and `429` + `Retry-After`) so well-behaved clients can self-throttle; **log denied requests** for forensics and tuning; and provide a **quota-uplift path** so a legitimate customer with a real burst isn't permanently throttled.

**Key points:**
- Distinguish "rate" (per second) from "concurrency" (in-flight).
- Always include limits in error responses (`X-RateLimit-*`).
- Log denied requests for forensics.
- Account for legitimate burst traffic and provide a quota uplift path.

---

### 70. Structured logging & correlation IDs

**Frequency:** Medium

**Question:** What is structured logging, and how do correlation IDs let you trace a request across services?

**Answer:** **Structured logging** emits each log entry as **machine-parseable data** — JSON or logfmt with **consistent key-value fields** (`timestamp`, `level`, `service`, `trace_id`, `span_id`, `user_id`, `request_id`, plus event-specific fields) — instead of free-form `printf` strings. The payoff is that your log backend can **filter, aggregate, and alert** on fields ("show all `level=error` for `user_id=42` in the last hour"), which is impossible to do reliably by grepping prose.

A **correlation ID** (a.k.a. request ID) solves the microservices debugging problem: a single user action fans out across many services, and without a shared identifier their logs are impossible to line up. So you **generate one ID at the edge** (gateway/first service) and **propagate it through every downstream call** (HTTP header, message metadata), tagging every log line with it. Now you can pull up *one* request's complete journey across all services by filtering on that ID. Ideally you **reuse the OpenTelemetry `trace_id`** as the correlation ID, so logs, traces, and metrics all key off the same value and you can pivot between them.

Practices: emit **one structured line per meaningful event** (not scattered `printf`s); **never log secrets or PII** — scrub tokens, passwords, card numbers, emails at the source (it's both a compliance and a leak risk); use **log levels honestly** — `error` should mean "a human needs to look / this could page someone," so you don't drown real incidents in noise; and **centralize** logs (ELK, Loki, Datadog) with a **retention policy** that balances investigative value against storage cost (hot recent logs, cheaper cold archive).

**Key points:**
- One log line per important event; avoid unstructured `printf`.
- Don't log secrets/PII; scrub at the source.
- Use levels honestly: `error` should page someone.
- Centralize (ELK, Loki, Datadog) and retain at the right cost tradeoff.

---

### 71. Tracing: OTel spans & sampling

**Frequency:** Medium

**Question:** Explain distributed tracing with OpenTelemetry, and compare head-based vs tail-based sampling.

**Answer:** A **trace** represents one request's end-to-end journey as a **tree of spans**. Each **span** is a single operation (an HTTP handler, a DB query, a queue publish) with a **start/end timestamp**, a parent link, and **attributes** (status, route, rows). Together the spans show you exactly where a request spent its time and where it failed. **OpenTelemetry (OTel)** is the **vendor-neutral standard** for instrumenting code to produce traces (and metrics/logs), so you can switch backends (Jaeger, Tempo, Datadog) without re-instrumenting.

**Sampling** exists because tracing **every** request at scale is prohibitively expensive to store, so you keep a representative subset:

- **Head-based sampling** — decide **at the root span**, before you know how the request turns out, usually keeping a fixed percentage. It's **cheap and simple** (the decision propagates, so a whole trace is consistently kept or dropped), but **blind** — you might sample away the exact 1% that errored or was slow.
- **Tail-based sampling** — buffer all spans and decide **after the full trace completes**, so you can **keep every error and every slow trace** and drop boring fast successes. Far more useful for debugging, but costlier and more complex (needs a collector holding spans until the trace finishes).

A common production setup is **1–5% head sampling for baseline volume plus always-sample-on-error/high-latency** (often via tail sampling) to guarantee you capture the traces that matter.

Details: context propagates across services via the **W3C `traceparent`** header; **auto-instrumentation** covers common libraries (HTTP, DB, queues) out of the box — **supplement with custom spans** on important business logic; keep **span attributes low-cardinality** (don't put a raw user ID or full URL with IDs as an attribute key) to avoid exploding the backend's index; and **correlate** traces with logs (shared `trace_id`) and metrics (exemplars linking a spike to a specific trace).

**Key points:**
- W3C `traceparent` header propagates context across services.
- Auto-instrumentation covers HTTP, DB, queues; supplement with custom spans on hot paths.
- Span attributes: keep low cardinality to avoid backend explosion.
- Pair traces with logs (shared trace_id) and metrics (exemplars).

---

### 72. Health checks: liveness/readiness/startup

**Frequency:** Medium

**Question:** Explain Kubernetes liveness, readiness, and startup probes. Why shouldn't liveness check downstream dependencies?

**Answer:** The three probes answer **different questions**, and conflating them causes outages:

- **Liveness** — *"is the process alive/unwedged?"* If it fails, Kubernetes **restarts the container**. Use it to recover from a hung process (deadlock, stuck event loop).
- **Readiness** — *"should this pod receive traffic right now?"* If it fails, Kubernetes **removes the pod from the Service/load balancer** (but does **not** restart it). Use it for transient "not ready" states — still warming caches, a dependency temporarily unreachable.
- **Startup** — *"has slow initialization finished?"* It **gates** liveness/readiness during boot, so a slow-starting app (large cache warm-up, migrations) isn't killed by liveness before it ever comes up.

The critical design rule: **keep liveness shallow** — it should only confirm the process itself responds (a trivial `/healthz` that returns 200), while **readiness checks real dependencies** (DB, queue reachable), ideally through **circuit breakers** rather than a full fan-out to every dependency on every probe.

Why **liveness must not depend on downstream** services: if your liveness probe fails when the **database** is down, then during a DB outage Kubernetes **restarts every pod repeatedly** — a restart storm that adds load, loses in-flight work, and prevents recovery, all while fixing nothing (restarting your app doesn't fix the DB). Instead, tie the **readiness** probe to dependencies so traffic **drains** from pods that can't serve, while liveness stays green and the pods survive to recover when the dependency returns. **Startup** probes specifically prevent premature liveness kills of legitimately slow-booting apps.

**Key points:**
- Liveness failures cause restarts — keep them dumb to avoid cascades.
- Readiness flips on DB/queue outages so traffic drains.
- Don't tie liveness to downstream — you'll restart-loop during outages.
- Startup probes prevent premature kills of slow-booting apps.

---

### 73. Graceful shutdown

**Frequency:** Medium

**Question:** How do you implement graceful shutdown, and how does it coordinate with Kubernetes and the load balancer?

**Answer:** Graceful shutdown means draining work **before** the process exits, so a deploy or scale-down doesn't drop in-flight requests. The trigger is **`SIGTERM`**. Kubernetes' sequence is: send **`SIGTERM`**, wait up to **`terminationGracePeriodSeconds`**, then **`SIGKILL`** if the process hasn't exited — so your handler must finish within that window.

The correct shutdown sequence on `SIGTERM`:

1. **Flip readiness to `false` first.** This is the subtle-but-crucial step: it tells Kubernetes to remove the pod from the Service endpoints so the **load balancer stops routing new traffic**. Then **sleep briefly** (a couple seconds) — because endpoint removal propagates asynchronously, in-flight LBs may still send a few requests until they notice.
2. **Stop accepting new connections/jobs** (close the HTTP listener, stop pulling from the queue).
3. **Finish in-flight work** — let active requests complete; for workers, finish the current job and **commit offsets/ack** so nothing is lost or reprocessed.
4. **Close resources** — drain and close DB pools, flush buffers/logs.
5. **Exit** cleanly.

Implementation notes: HTTP servers typically stop the listener and **wait on a `WaitGroup`/tracked-connections with a timeout fallback** (`http.Server.Shutdown(ctx)` in Go). Always set a **max drain timeout** shorter than `terminationGracePeriodSeconds` — a shutdown that hangs waiting for one stuck request stalls the whole deploy and eventually gets `SIGKILL`ed anyway (losing the graceful part). And **test it**: send `SIGTERM` in staging and verify a clean, timely exit with no dropped requests — broken shutdown logic is invisible until a production deploy causes error spikes.

**Key points:**
- HTTP servers: stop listener, wait on a wait group, timeout fallback.
- Workers: stop pulling new jobs, finish current, commit offsets/acks.
- Always set a max drain timeout — hanging shutdowns hurt deploys.
- Test by sending SIGTERM in staging and verifying clean exit.

---

### 74. DB migrations in CI/CD

**Frequency:** Medium

**Question:** How do you run database migrations safely in CI/CD? Explain the expand/contract pattern.

**Answer:** The core problem: during a rolling deploy, **old and new app versions run simultaneously** for a period, so the schema must be compatible with **both** at once. A migration that the new code needs but the old code can't tolerate will break every request still served by old pods. The solution is the **expand/contract (parallel change) pattern**, done across **multiple releases**:\n\n1. **Expand** \u2014 make an **additive, backward-compatible** schema change (add the new nullable column/table, add an index). Old code ignores it; new code can start using it.\n2. **Migrate/backfill** \u2014 deploy code that **writes to both** old and new, and backfill existing rows.\n3. **Contract** \u2014 only **after** all app instances use the new shape and no old code remains, drop the old column/constraint in a **later** release.\n\nThe golden rule that falls out of this: **never make a destructive change (drop/rename column) in the same release that deploys the code depending on it** \u2014 rename = add-new + backfill + switch reads + drop-old, spread over releases.\n\nOperationally: run migrations as a **dedicated pre-deploy job/step**, **separate from the app pods** \u2014 if every replica ran migrations on boot they'd **race** each other. Keep migrations **versioned, reviewed in PRs, and tested against a prod-shaped dataset** (a tiny dev DB hides lock/timeout problems). For **long/locking migrations** on big tables, use **online schema-change tooling** (`pt-online-schema-change`, `gh-ost`, `pg_repack`) so you don't hold a blocking lock for minutes. Prefer **rolling forward** (write a new corrective migration) over rolling back \u2014 down-migrations are error-prone and often can't restore dropped data. Common tools: **Flyway, Liquibase, Alembic, Django migrations, golang-migrate, Atlas**.

**Key points:**
- Never destructive in the same release that deploys code requiring the old shape.
- Long migrations need online tooling (pt-osc, gh-ost, pg_repack).
- Roll forward — rolling back migrations is painful.
- Run migration jobs separately from app pods to avoid races.

---

### 75. Feature flags & dark launches

**Frequency:** Medium

**Question:** What are feature flags and dark launches, and how do they decouple deploy from release?

**Answer:** A **feature flag** is a runtime conditional that turns a code path on/off **without redeploying**. This **decouples deploy from release**: you can **ship the code "dark"** (merged and deployed but disabled), then **enable it independently** — per user, per segment, or by percentage — whenever you choose. That separation unlocks several practices from one mechanism: **canary/percentage rollouts** (1% → 10% → 100%, watching metrics), **A/B experiments**, **kill switches** (instantly disable a misbehaving feature without a rollback deploy), and **entitlement gating** (feature available only to certain plans).

A **dark launch** goes further: you route **real production traffic** to the new code path but **discard its results** (or shadow-compare them), so you can validate **performance and correctness under real load** before any user sees the output — e.g. run a new ranking service alongside the old one, log discrepancies, and only flip it live once it matches. It de-risks the launch by testing the new path with production-scale data first.

Good practices: **tier your flags** by intent — **release** (short-lived, remove after rollout), **experiment** (A/B), **ops/kill switch** (long-lived operational control), and **permission** (entitlements) — because they have different lifetimes and owners. **Clean up stale flags aggressively**: "flag debt" (dead conditionals littering the code) becomes a real maintenance and testing burden. Make the **default state safe** (off / old behavior) so a config-service outage fails closed to known-good. And **pair every flag with a metrics dashboard** so you can see the blast radius the moment you flip it. Tools: LaunchDarkly, Unleash, ConfigCat, or homegrown.

**Key points:**
- Tier flags: release (short-lived), experiment, ops (kill switch), permission.
- Clean up stale flags — flag debt is real.
- Default state should be safe (off / old behavior).
- Combine with metrics: every flag has a dashboard for blast-radius detection.

---

### 76. Filtering/sorting/sparse fieldsets

**Frequency:** Low

**Question:** How do you design filtering, sorting, and sparse fieldsets for an API without opening security or performance holes?

**Answer:** The theme across all three is **explicit allowlisting** — exposing query flexibility without exposing your database:

**Filtering** — define a **standardized, documented syntax** (e.g. `?status=active&created_at[gte]=2024-01-01&tag[in]=a,b`) with a fixed set of **allowed fields and operators** (equality, ranges, `IN`, full-text). The absolute rule: **never let arbitrary SQL leak through**. Map each API field to a column via an **allowlist**, translate operators to **parameterized/prepared statements**, and **reject unknown fields loudly** with a 400 rather than silently ignoring them (silent ignores hide bugs and can bypass intended constraints). Interpolating filter values into SQL is a direct **SQL-injection** path — always bind them.

**Sorting** — restrict `sort` to an **allowlist of indexed columns**. Sorting on an unindexed column forces an expensive full scan + filesort; letting clients sort on anything is both a performance foot-gun and an abuse vector. Also **cap page size and total query complexity** so no single request can trigger a huge scan.

**Sparse fieldsets** — let clients request only the fields they need (`?fields=id,name`) to **shrink payloads** and skip computing expensive sub-resources. This is essentially manual field selection; **GraphQL** provides it natively. Combine with an allowlist so `fields` can't be used to probe columns that shouldn't be exposed.

**Key points:**
- Whitelist filter/sort fields; reject unknown ones loudly.
- Cap page size and complexity to prevent abuse.
- Document operator semantics: equality, ranges, IN, full-text.
- Use prepared statements; never interpolate filter values.

---

### 77. HATEOAS — when worth it

**Frequency:** Low

**Question:** What is HATEOAS, and when is it actually worth adopting?

**Answer:** **HATEOAS** (Hypermedia As The Engine Of Application State) is the REST constraint where responses **embed links to the next available actions**, so a client **discovers what it can do dynamically** rather than hard-coding URLs. An order response might include `{"status":"pending", "_links":{"cancel":"/orders/5/cancel", "pay":"/orders/5/pay"}}` — and once paid, the `cancel` link disappears and a `refund` link appears. The client just follows whatever links are present.

In **practice it rarely pays off**, because most clients are **hand-coded against fixed, documented URLs** and ignore the embedded links entirely — so you incur the cost of generating hypermedia that nobody consumes, and clients still break when semantics change. For a **single-team or internal API**, it's usually over-engineering; skip it.

Where it **does earn its keep**: **long-lived public APIs with diverse, independently-evolving clients** (PayPal, some AWS APIs) where the server needs to add/relocate capabilities without breaking callers; and **state-machine resources** where the **allowed transitions genuinely vary by state**, so encoding "what's allowed now" in links (rather than every client re-implementing the state rules) reduces coupling. Standardize the link format with **HAL** or **JSON:API** rather than inventing your own. Finally, note the semantic gap: Roy Fielding considers HATEOAS **required** to call an API "RESTful," but the **industry overwhelmingly uses "REST" to mean resource-oriented JSON over HTTP** without hypermedia — don't get hung up on the purity debate.

**Key points:**
- Use it when client/server evolve independently and clients are generic.
- Skip it for internal services or single-team APIs.
- HAL and JSON:API standardize link formats.
- Don't confuse "REST" with "HATEOAS" — Roy Fielding does, the industry mostly doesn't.

---

### 78. CTEs & recursive queries

**Frequency:** Low

**Question:** What are CTEs and recursive queries, and what are the key performance caveats?

**Answer:** A **Common Table Expression (CTE)** names a subquery with `WITH` so you can **reference it by name**, improving **readability** and letting you reuse the same intermediate result within one statement instead of nesting subqueries. A crucial performance nuance in **Postgres**: **before v12, a CTE was an optimization fence** — it was always materialized separately and the planner couldn't push predicates into it (sometimes intentionally useful, often a surprise slowdown); **from v12 on, CTEs are inlined by default** (planned like a subquery) **unless** you write `WITH x AS MATERIALIZED (...)` to force the old behavior.

**Recursive CTEs** (`WITH RECURSIVE`) let SQL **walk trees and graphs** — org hierarchies, threaded comments, bill-of-materials, category trees. The shape is a **base case `UNION ALL` a recursive reference** to the CTE itself:
```sql
WITH RECURSIVE subs AS (
  SELECT id, manager_id FROM emp WHERE id = 1       -- base
  UNION ALL
  SELECT e.id, e.manager_id
  FROM emp e JOIN subs ON e.manager_id = subs.id    -- recursive
)
SELECT * FROM subs;
```
The main hazard is **infinite loops** on cyclic graphs — guard with a **depth counter / limit** (or `CYCLE` detection). Other guidance: use **`MATERIALIZED`** when a heavy subquery is reused several times (compute once); **window functions** can often replace a self-joining CTE more efficiently for running totals/rankings; and for **deep traversals over large graphs**, a recursive CTE gets slow — reach for a **graph database** instead.

**Key points:**
- Recursive CTE: `WITH RECURSIVE t AS (base UNION ALL recursive ref)`.
- Use `MATERIALIZED` when reusing a heavy subquery multiple times.
- Window functions often replace CTEs more efficiently.
- Don't recurse deeply on huge graphs — use a graph DB.

---

### 79. JSON columns in Postgres

**Frequency:** Low

**Question:** When should you use JSON columns in Postgres, and how do you index and query `jsonb`?

**Answer:** **`jsonb`** stores JSON in a **decomposed binary format** (keys deduplicated, no insignificant whitespace) that supports **indexing** and rich **operators** — `->` (get JSON), `->>` (get text), `@>` (containment), `?` (key exists), plus JSONPath. Prefer it over **`json`** (which stores raw text, preserves duplicate keys/whitespace, and supports fewer operators); `json` only wins when you need to preserve the exact original text.

**Good use cases**: **sparse, schema-flexible attributes** — per-item settings, feature-varying product attributes, tags, external API payloads, audit/event blobs — where columns would be mostly-null or the shape varies per row. The key **caution**: don't make `jsonb` your **primary modeling tool**. Data stuffed in JSON loses **foreign keys, type/NOT-NULL constraints, and efficient joins**, and queries into it are harder to optimize — anything with clear structure and relationships belongs in real columns/tables.

Indexing and query techniques:
- **GIN index** for **containment/existence** queries: `CREATE INDEX ON t USING gin (data jsonb_path_ops)` speeds up `data @> '{"status":"active"}'` (the `jsonb_path_ops` variant is smaller/faster but supports only `@>`).
- **Expression (B-tree) index** for **equality on a specific extracted field**: `CREATE INDEX ON t ((data->>'email'))`.
- **Partial updates** with `jsonb_set(data, '{a,b}', '1')` and the `||` merge operator — but note both **rewrite the entire value** (MVCC creates a new row version), so very large JSON blobs are expensive to update frequently.
- **Validate shape** at the boundary with `CHECK` constraints, e.g. `CHECK (jsonb_typeof(data->'count') = 'number')`, since the column itself won't enforce structure.

**Key points:**
- GIN index on `jsonb_path_ops` for containment queries.
- Expression indexes on extracted fields for equality lookups.
- `jsonb_set`, `||` for partial updates — entire value is rewritten.
- Validate shape with `CHECK (jsonb_typeof(col->'x') = 'number')`.

---

### 80. Wide-column partition keys

**Frequency:** Low

**Question:** How do you design partition keys in wide-column stores like Cassandra and DynamoDB, and what causes hot partitions?

**Answer:** In Cassandra/DynamoDB the **partition key** decides **which node owns the data** (via a hash) and **bounds the set of rows read together** — a single partition is the unit of storage and access. So the partition key must satisfy two things at once: **high cardinality / even distribution** (so data and load spread across nodes) **and alignment with your query patterns** (so the rows you fetch together live in the same partition). A **clustering key (Cassandra) / sort key (DynamoDB)** then **orders rows within** a partition, enabling efficient **range scans** (e.g. "messages in this chat, newest first").

**Hot partitions** are the classic failure: if the key is **sequential** (a timestamp or auto-increment) or **low-cardinality** (`status`, `country`), a disproportionate share of reads/writes lands on **one node**, which becomes a bottleneck while others idle — destroying the horizontal-scaling benefit. Avoid keys that concentrate traffic.

Modeling guidance, which is the opposite of relational thinking:
- **"Query first, model second"** — design a **table per access pattern** and **denormalize/duplicate** data across them, rather than normalizing and joining (there are no joins).
- **Composite partition keys** spread load and bound partition size, e.g. `(tenant_id, day)` so one tenant's data is split by day instead of one giant partition.
- Respect **partition size limits** — ~100 MB per partition in Cassandra; a 10 GB item-collection limit per partition key in DynamoDB — or performance degrades.
- **Secondary indexes are expensive** (global secondary indexes cost extra writes/storage; Cassandra secondary indexes scale poorly), so access patterns are usually served by **denormalized duplicate tables** instead.

**Key points:**
- "Query first, model second" — design tables per access pattern.
- Composite partition keys spread load (`(tenant_id, day)`).
- Partition size cap (~100MB in Cassandra, 10GB item collection in DDB).
- Secondary indexes are expensive and often denormalized away.

---

### 81. Search engines as non-primary DB

**Frequency:** Low

**Question:** Why use a search engine like Elasticsearch as a secondary store rather than a source of truth?

**Answer:** **Elasticsearch/OpenSearch** are built for **full-text search, faceted/aggregation, and analytics** queries — relevance-ranked text matching, filters over many fields, log analytics — workloads a relational DB handles poorly. But they make poor **systems of record**: they're **eventually consistent** (a write isn't immediately searchable — refresh interval), have **weaker durability** (easier to lose data than a WAL-backed RDBMS), and offer **no multi-document transactions**. So the standard pattern is to keep your **primary database as the source of truth** and treat ES as a **derived secondary index**, kept in sync via **change-data-capture (CDC)** or a **message queue** that streams writes from the primary into ES.

The golden rule: **never let ES be the only copy of a write** — if it's derived, you can always **rebuild** the index from the primary after corruption or a mapping change.

Operational practices:
- **Zero-downtime reindexing via alias swap**: mappings are largely immutable, so to change them you **build a new index and atomically repoint an alias** from old to new — clients query the alias and never see the switch.
- **Tune analyzers per language** — the default tokenizer/stemmer is crude; language-specific analyzers (stemming, stop-words, synonyms) dramatically improve relevance.
- **Watch shard sizing** — aim for roughly **10–50 GB per shard**; **over-sharding** (too many tiny shards) wastes heap and cluster state and hurts performance as badly as giant shards.

**Key points:**
- Never make ES the only copy of writes.
- Reindex strategies: alias swap for zero-downtime mapping changes.
- Tune analyzers per language; default stemmers are crude.
- Watch shard sizing (10-50GB/shard); too many shards kills cluster perf.

---

### 82. Time-series DBs (InfluxDB/Timescale)

**Frequency:** Low

**Question:** What are time-series databases optimized for, and when do you need one over plain Postgres?

**Answer:** **Time-series workloads** have a distinctive profile: **append-heavy writes** (metrics/events arriving continuously, rarely updated), **time-ordered reads** ("CPU over the last 6 hours"), **retention policies** (drop data older than N days), and **downsampling** (keep 1-second resolution for a day, 1-minute for a month). **Specialized stores** — InfluxDB, TimescaleDB, Prometheus — exploit this by **compressing timestamps** (delta-of-delta encoding, since intervals are regular) and **run-length/delta encoding values**, achieving **massive space savings** (often 10–20×) over row-per-point storage, plus first-class **continuous aggregates** (pre-computed rollups that update incrementally) and **built-in TTL/retention**.

**TimescaleDB** is notable as a **Postgres extension** — you get hypertables, compression, and continuous aggregates while keeping **full SQL, joins, and the Postgres ecosystem**, which is ideal when your team already knows SQL and wants relational data alongside metrics.

When you **don't** need one: for **low millions of points**, **plain Postgres** with a `timestamptz` column and a BRIN or B-tree index is perfectly fine — don't add operational complexity prematurely. You reach for a specialized store when you're ingesting **billions of points**, need aggressive **compression/retention**, or require **high sustained write throughput** with cheap time-range scans that a general-purpose DB starts choking on.

**Key points:**
- High write throughput + cheap range scans by time.
- Continuous aggregates / downsampling reduce storage.
- TTL/retention policies built-in.
- Postgres alone is fine for low millions of points; specialized at billions.

---

### 83. Graph DBs (Neo4j)

**Frequency:** Low

**Question:** When do graph databases like Neo4j outperform relational databases, and when should you avoid them?

**Answer:** Graph DBs store **nodes and edges as first-class citizens** with **direct pointers between connected records** ("index-free adjacency"). The consequence is that traversing a relationship is **O(number of neighbors)** — you hop directly from a node to its neighbors — instead of the relational approach, where each "hop" is a **JOIN whose cost scales with table size** and multi-hop queries mean stacking self-joins that blow up combinatorially. So for queries **many hops deep**, a graph DB can be orders of magnitude faster.

**Where they shine**: workloads where **relationships themselves are the query** — **fraud detection** (rings of accounts/devices), **recommendations** ("friends of friends who bought X"), **social graphs**, **knowledge graphs**, and **dependency/impact analysis**. The rule of thumb: if your queries routinely traverse **deeper than ~3 hops**, or the relationships are more important than the entities, consider a graph DB. Query languages are **Cypher** (Neo4j), **Gremlin** (Apache TinkerPop), and **SPARQL** (RDF).

**When to avoid**: for **simple lookups and shallow relationships**, a relational DB is **faster, simpler, more mature, and more widely understood** — don't adopt a graph DB (and its operational/hiring cost) just because your data "has relationships"; all data does. It's the *shape and depth of the traversal* that justifies it, and **native graph storage** (not a graph layer over an RDBMS) is what delivers the traversal speed. Alternatives to Neo4j: **AWS Neptune, JanusGraph, ArangoDB, Memgraph**.

**Key points:**
- Best when relationships dominate queries (depth > 3 hops).
- Don't use for simple lookups — relational is faster and simpler.
- Native graph storage matters for traversal speed.
- AWS Neptune, JanusGraph, ArangoDB, Memgraph are alternatives.

---

### 84. Redis persistence: RDB vs AOF

**Frequency:** Low

**Question:** Compare Redis persistence options RDB and AOF. Why do production setups often run both?

**Answer:** Redis is in-memory, so persistence is about surviving restarts/crashes, and it offers two mechanisms with opposite tradeoffs:

- **RDB (snapshotting)** — periodically dumps the **entire dataset to a compact binary file** (`.rdb`). Pros: **small files, fast restart** (load one binary), ideal for **backups**. Con: you **lose every write since the last snapshot** — if you snapshot every 5 minutes and crash at 4:59, those 5 minutes are gone. Snapshotting **forks** the process and relies on **copy-on-write**, so a write-heavy workload during a snapshot can cause a **memory spike** (pages diverge and get copied).
- **AOF (append-only file)** — logs **every write command** to a file that's replayed on restart. Durability is bounded by the **`fsync` policy**: `appendfsync everysec` (the default sweet spot) loses at most ~1 second; `always` is fully durable but slow; `no` leaves it to the OS. Cons: **larger files** and **slower restart** (replay all commands) — mitigated by periodic **background AOF rewrites** that compact the log to the minimal command set.

**Production often runs both**: **AOF for durability** (small data-loss window) plus **RDB for fast restore and backups** — combined with **replicas**, that's the durable triple (replication for availability, AOF for recent writes, RDB for snapshots). Conversely, when Redis is a **pure cache** (data is reconstructable from the source of truth), **disable persistence entirely** for maximum throughput and no fork-related latency.

**Key points:**
- `appendfsync everysec` is the default sweet spot.
- Snapshots fork the process — memory copy-on-write spikes.
- For pure cache, disable persistence entirely.
- Replicas + AOF + RDB is the durable triple.

---

### 85. Bloom filters in caching

**Frequency:** Low

**Question:** What is a Bloom filter, and how does it speed up caching and databases? Why can it have false positives but never false negatives?

**Answer:** A **Bloom filter** is a **probabilistic set** backed by a **tiny bitmap** and `k` hash functions. To add an element you set the `k` bits its hashes point to; to test membership you check whether **all** `k` bits are set. This gives two possible answers: **"definitely not in the set"** (if any of the `k` bits is 0, the element was never added) or **"probably in the set"** (all bits set — but they might have been set by *other* elements). Hence **false positives are possible** (bit collisions), while **false negatives are impossible** (adding an element always sets its bits, so a present element never reads as absent). The false-positive rate is **tunable** by sizing the bitmap and choosing `k` for your expected element count.

The caching payoff: put a Bloom filter **in front of an expensive cache/DB lookup** for existence checks. Ask the filter first — if it says "definitely not present," you **skip the lookup entirely**; only on "probably present" do you actually query. Because a false positive merely causes an **occasional wasted lookup** (never a wrong result), and false negatives can't happen, it's a safe optimization. Classic uses: **"is this username taken?"**, **"have we already crawled this URL?"**, and avoiding disk reads for absent keys.

Properties and caveats:
- **Extremely space-efficient** — a few **bits per element**, not the full keys, so billions of items fit in MBs.
- **Can't delete** from a standard Bloom filter (clearing bits would corrupt other elements) — use a **counting Bloom filter** or **cuckoo filter** if deletion is needed.
- **Cassandra and RocksDB** use Bloom filters internally to **skip SSTables** that can't contain a key.
- **Size deliberately** for the expected `n` and an acceptable false-positive probability `p` — undersizing spikes false positives.

**Key points:**
- Space-efficient — bits per element, not full keys.
- Can't delete (use counting Bloom or cuckoo filter).
- Cassandra/RocksDB use Bloom filters internally for SSTable lookups.
- Size for expected n + acceptable false-positive p.

---

### 86. Lock-free / CAS

**Frequency:** Low

**Question:** What is compare-and-swap (CAS), and why is writing correct lock-free code so hard?

**Answer:** **Compare-and-swap** is an atomic CPU primitive: `CAS(addr, expected, new)` **updates `addr` to `new` only if it currently equals `expected`**, returning whether it succeeded — all as one indivisible instruction. It's the foundation of **lock-free data structures**: instead of taking a lock, a thread reads the current value, computes the new value, and **CASes**; if another thread changed it in between (CAS fails), it **retries the loop**. The benefit is avoiding **lock contention** and the risk of a thread being descheduled while holding a lock (priority inversion, convoying).

It's **fiendishly hard to get right** for two main reasons:
- **The ABA problem** — CAS only checks that the value *equals* `expected`, not that it never changed. If a value goes A→B→A between your read and your CAS, the CAS **succeeds even though the world changed underneath you** (e.g. a node was freed and reallocated at the same address), corrupting the structure. Fixes add a **version/tag counter** (double-width CAS) or use hazard pointers/epoch reclamation.
- **Memory ordering** — on weakly-ordered architectures (ARM, POWER) you must specify **acquire/release/seq_cst** semantics correctly, or other threads see reordered writes. Reasoning about this is notoriously error-prone.

Other realities: **lock-free ≠ wait-free** — lock-free only guarantees *some* thread makes progress; an individual thread can **starve** retrying. And under **high contention**, CAS can actually be **slower than a lock** because everyone keeps failing and retrying (cache-line ping-pong). The practical takeaway: **use library-provided atomics** (`atomic.Int64`, `AtomicReference`) and **proven concurrent structures** (concurrent maps, queues); only roll your own with extreme care and heavy testing — and **profile first**, because a plain mutex is usually fast enough.

**Key points:**
- Lock-free ≠ wait-free; some threads can still stall.
- Memory model rules (acquire/release/seq_cst) matter on weak architectures.
- High contention can make CAS slower than locks (retries).
- Profile before optimizing — locks are usually fine.

---

### 87. Outbox pattern

**Frequency:** Low

**Question:** What is the outbox pattern, and which dual-write problem does it solve?

**Answer:** The **dual-write problem**: a service often needs to **update its database and publish a message** (to Kafka/RabbitMQ) for the same business event. Doing both as separate operations has no atomicity — either can fail independently, giving you **"DB committed but message lost"** (downstream never learns) or **"message published but DB rolled back"** (downstream acts on data that doesn't exist). There's no distributed transaction spanning a DB and a broker in practice.

The **outbox pattern** fixes this by turning the message publish into a **local DB write**: within the **same transaction** that updates business state, you **insert a row into an `outbox` table** describing the event. Because it's one transaction, the state change and the outbox row **commit or roll back together** — atomically. Then a **separate relay** — either a **poller** that queries unsent outbox rows, or a **CDC tool like Debezium** tailing the DB's transaction log — reads those rows, **publishes them to the broker**, and **marks them sent**. This guarantees the message is published **if and only if** the DB change committed, aligning delivery with the transaction.

Consequences and practices:
- Delivery is **at-least-once** (the relay may publish, crash before marking sent, and republish), so **consumers must be idempotent** — duplicates are expected, not exceptional.
- A **CDC-based relay scales better** than polling (no query load, lower latency) but adds infrastructure.
- Keep the outbox table **small** — set `processed_at` and periodically **archive/delete** sent rows so it doesn't grow unbounded and slow down the relay.

**Key points:**
- Eliminates "DB committed but message lost" / "message sent but DB rolled back".
- Pair with idempotent consumers (dupes are expected).
- CDC-based relay scales better than polling.
- Add a `processed_at` or move-to-archive to keep outbox small.

---

### 88. 2PC — why avoided

**Frequency:** Low

**Question:** How does two-phase commit (2PC) work, and why is it generally avoided in modern distributed systems?

**Answer:** **Two-phase commit** provides atomic transactions across multiple participants (databases/services) via a **coordinator**:
1. **Prepare phase** — the coordinator asks every participant "can you commit?" Each does the work, **locks the resources**, writes to its log, and **votes yes/no** (yes = a promise it *can* commit if told to).
2. **Commit phase** — if **all** voted yes, the coordinator tells everyone to **commit**; if any voted no (or timed out), it tells everyone to **abort**. Participants comply and release locks.

It does deliver atomicity, but it's **generally avoided** because:
- **Blocking on coordinator failure** — if the coordinator crashes **after** participants voted yes but **before** sending the commit/abort decision, participants are stuck **holding locks indefinitely**, unsure whether to commit or roll back. This is the fatal flaw: the whole system can wedge.
- **Poor scalability** — synchronous round trips plus **held locks across all participants** for the transaction's duration serialize throughput and inflate latency.
- **Availability coupling** — the transaction can only commit if **every** participant is up; overall availability is the *product* of each participant's availability, so it drops as you add services.

**3PC** adds an extra phase to reduce blocking, but it's more complex and **assumes a synchronous network** (bounded delays), which real networks violate — so it's rarely used. And practically, **2PC support across heterogeneous databases and brokers is poor**. The modern answer for **cross-service** consistency is **sagas + the outbox pattern**: trade strict ACID for **available, eventually-consistent** workflows with **compensating actions** on failure. The caveat: when your data fits in **one database**, a plain **single-DB transaction** is still the right, far simpler answer — don't reach for distributed transactions unnecessarily.

**Key points:**
- 3PC reduces blocking but adds complexity and assumes synchrony.
- Across heterogeneous DBs/brokers, 2PC support is poor.
- Single-DB transactions are still the right answer when possible.
- Sagas trade ACID for available eventual consistency.

---

### 89. Paxos/Raft basics

**Frequency:** Low

**Question:** What problem do consensus algorithms like Paxos and Raft solve, and how does Raft's leader-based approach work?

**Answer:** **Consensus algorithms** let a cluster of nodes **agree on a single value (or an ordered log of values) despite failures** — crashes, restarts, network delays — so a replicated system behaves like one consistent machine. This underpins **replicated state machines**: distributed databases, config stores, and coordination services.

**Raft** was designed to be **understandable** (vs Paxos) and works via a **strong leader**:
- **Leader election** — nodes are follower/candidate/leader. If followers hear nothing from a leader within an election timeout, a candidate requests votes; whoever gets a **majority** becomes leader for that **term**.
- **Log replication** — **all writes go through the leader**, which appends to its log and replicates entries to followers. An entry is **committed once a majority acknowledges** it, then applied to the state machine. This majority requirement is what makes it safe.
- With **N nodes it tolerates `(N-1)/2` failures** — a 5-node cluster survives 2 failures while keeping a majority.

Used in **etcd, Consul, CockroachDB, TiKV, and Kafka's KRaft mode**.

Key properties:
- **Odd cluster sizes (3, 5, 7)** are standard so a **clean majority** always exists and you avoid split votes (4 nodes tolerate the same 1 failure as 3 but cost more).
- **Quorum reads/writes** (touching a majority) provide **linearizability** — reads see the latest committed write.
- The **leader is a write bottleneck** (all writes funnel through it); scale by **sharding** into multiple Raft groups, each with its own leader.
- **Paxos** is the older, formally-proven foundation but is **notoriously hard to implement correctly**; Multi-Paxos and Raft are the practical descendants.

**Key points:**
- Always odd cluster sizes (3, 5, 7) for clean majorities.
- Quorum reads/writes ensure linearizability.
- Leader bottleneck for writes; sharding spreads load.
- Paxos is older, formally proven, harder to implement.

---

### 90. Vector clocks & CRDTs

**Frequency:** Low

**Question:** What are vector clocks and CRDTs, and how do they enable conflict handling without coordination?

**Answer:** Both tackle **ordering and conflict resolution in distributed systems without a central coordinator**.

**Vector clocks** track **causality**. Each node keeps a **vector of counters** (one entry per node); it increments its own entry on each event and **attaches the whole vector to every message**. On receipt, a node **merges element-wise by max** and bumps its own entry. Comparing two vectors tells you the relationship: one **strictly dominates** the other → a **causal (happened-before)** order; **neither dominates** → the updates were **concurrent** and genuinely conflict. This lets a system **detect conflicts** (e.g. two clients edited the same key independently) rather than silently losing a write, and then resolve them (last-writer-wins, merge, or surface to the app). The downside: vector clocks **grow with cluster size** (an entry per node ever seen), so **version vectors / dotted version vectors** are used to prune stale entries.

**CRDTs (Conflict-free Replicated Data Types)** go further — data types (**counters, sets, maps, sequences**) whose merge function is **commutative, associative, and idempotent**, so replicas that receive updates in **any order** **deterministically converge to the same state with no coordination** and no conflicts by construction. E.g. a G-Counter sums per-node counts; an OR-Set tracks add/remove tags so concurrent add+remove resolve predictably. They split into **state-based (CvRDT)** — replicas ship and merge full state — and **operation-based (CmRDT)** — replicas broadcast operations (needing reliable delivery). This makes them ideal for **offline-first apps, collaborative editing (Figma, Yjs, Automerge), and multi-master replication (Riak)**, where you want **eventual consistency without the latency of coordination**. The tradeoff is metadata overhead and that not every data structure has a natural CRDT formulation.

**Key points:**
- Vector clocks grow with cluster size — version vectors / dotted version vectors prune.
- CRDTs split into state-based (CvRDT) and operation-based (CmRDT).
- Eventual consistency without coordination overhead.
- Great for offline-first apps and multi-master setups.

---

### 91. Clock skew, NTP, logical clocks

**Frequency:** Low

**Question:** Why can't you trust wall-clock time to order events in distributed systems, and what do logical clocks and TrueTime offer instead?

**Answer:** Every machine's **physical clock drifts** (quartz oscillators vary with temperature/age), so two servers' clocks disagree by milliseconds to seconds. **NTP** disciplines them toward a reference, typically to within a few milliseconds, but **can't make them perfect or perfectly synchronized** — and it can even step a clock **backward**. So using **wall-clock timestamps to order events across nodes is unsafe**: event A on server 1 might carry a later timestamp than event B on server 2 even though B truly happened after A, and "last-writer-wins" by wall clock can silently drop the newer write.

The correct tools are **logical clocks**, which order by **causality, not time**:
- **Lamport timestamps** — a single counter incremented on each event and advanced to `max(local, received)+1` on message receipt. Gives a **total order** consistent with happened-before, but **can't tell concurrent from causal** (only a one-way implication).
- **Vector clocks** — per-node counters that capture full **causal/concurrent** relationships (at the cost of size).

For systems that genuinely need **absolute cross-region ordering**, **Google's TrueTime** (used by **Spanner**) takes the opposite tack: instead of pretending clocks are exact, it uses **GPS + atomic clocks** to expose time as an **interval `[earliest, latest]` with a bounded uncertainty**. Spanner then **"commit-waits"** — it deliberately waits out that uncertainty window before committing — so two transactions' timestamps reflect their real order, yielding externally-consistent global ordering.

Other points: **leap seconds** break naive timestamp math (a repeated/absent second) — smear them; **Hybrid Logical Clocks (HLC)** combine a wall-clock component with a logical counter for "good enough," mostly-monotonic ordering that's still human-readable; **always run NTP/chrony** on every server; and **never compare timestamps across nodes for correctness-critical decisions** — use logical clocks or a coordination service.

**Key points:**
- Leap seconds break naive timestamp logic.
- Hybrid logical clocks combine wall + logical for "good enough" ordering.
- Always run NTP/chrony on servers.
- Don't compare timestamps across nodes for correctness-critical decisions.

---

### 92. Python: pip vs poetry vs uv; lock files

**Frequency:** Low

**Question:** How do pip, Poetry, and uv differ for Python dependency management, and why does committing a lock file matter?

**Answer:** These tools sit at increasing levels of capability:

- **pip** — the baseline installer; it fetches packages from PyPI but by itself does **not** produce a lock file or resolve a full dependency graph deterministically. **`pip-tools`** adds locking by compiling a loose `requirements.in` into a **fully-pinned `requirements.txt`** (every transitive dependency at an exact version).
- **Poetry** — an all-in-one tool: **dependency resolution** (a real solver), a **`poetry.lock`** file, **virtual-env management**, and **packaging/publishing**, all driven from `pyproject.toml`. Mature and widely adopted, but historically slow to resolve.
- **uv** (from Astral, the Ruff authors) — a **Rust-based** replacement that does what pip/pip-tools/Poetry do but **10–100× faster**, with a **`uv.lock`** and `pyproject.toml`, plus fast venv creation and Python-version management. It's rapidly becoming the **de facto default**.

**Why committing a lock file matters**: the lock pins **every dependency (including transitive ones) to an exact version and hash**, so `install` reproduces the *identical* environment on every developer machine, CI runner, and production build. Without it, a fresh install may silently pull a newer patch of a sub-dependency and introduce a regression or supply-chain change — "works on my machine" bugs. The **`pyproject.toml`** file (standardized by **PEP 621**) holds your declared/abstract dependencies and project metadata, while the lock file holds the resolved/concrete pins — you commit both.

Practical guidance: **never run a bare `pip install package` in CI** without a **constraints/lock file** — it's non-reproducible. Choosing today: reach for **uv** for speed on new projects; stick with **Poetry** where the team/ecosystem is already invested in it.

**Key points:**
- Always commit a lock file for reproducibility.
- `pyproject.toml` (PEP 621) is the standard project metadata.
- Avoid `pip install` without a constraints file in CI.
- `uv` is rapidly becoming the de facto choice in 2026.

---

### 93. Python: WSGI vs ASGI; gunicorn vs uvicorn

**Frequency:** Low

**Question:** What's the difference between WSGI and ASGI in Python, and how does that map to gunicorn vs uvicorn?

**Answer:** **WSGI** and **ASGI** are the **interface contracts** between a Python web app and the server that runs it:

- **WSGI** is **synchronous** — a single callable that handles **one request per worker at a time**, blocking until it returns. It's the model behind **Flask** and **Django (pre-3)**. Simple and battle-tested, but a worker sits idle while waiting on I/O, and it **can't do websockets or streaming/SSE**.
- **ASGI** is the **asynchronous** successor — an `async` interface that lets a **single worker handle many concurrent requests** (interleaving on `await` points) and supports **websockets, Server-Sent Events, and long-lived connections**. It's the model behind **FastAPI, Starlette, and Django 3+**.

The servers map onto these:
- **gunicorn** — a **WSGI** server using a **pre-fork** model (a master supervises multiple worker processes). Rock-solid process management, but WSGI-only on its own.
- **uvicorn** — an **ASGI** server (built on `uvloop`/libuv) that runs async apps.
- The common **production setup** combines them: **gunicorn as the process supervisor running uvicorn workers** (`gunicorn -k uvicorn.workers.UvicornWorker`), getting gunicorn's robust worker management plus ASGI capabilities.

Operational notes: **worker sizing** — roughly `2×cores + 1` for sync WSGI (workers block, so oversubscribe), but **fewer** for async (each worker already multiplexes many requests, so you're bounded by CPU). **Hypercorn** is an alternative ASGI server that also speaks **HTTP/2 and HTTP/3**. And **never run the dev servers** (`flask run`, `uvicorn --reload`, Django `runserver`) in production — they're single-process, unhardened, and not built for load.

**Key points:**
- ASGI is required for websockets/SSE/HTTP/2.
- Sizing: `workers = 2*cores+1` for sync; fewer for async.
- Hypercorn supports HTTP/2 and HTTP/3.
- Don't run dev servers (`flask run`, `uvicorn --reload`) in prod.

---

### 94. Java virtual threads (Loom)

**Frequency:** Low

**Question:** What are Java virtual threads (Project Loom), and why do they let "thread-per-request" code scale to millions of connections?

**Answer:** **Virtual threads** (Project Loom, **GA in JDK 21**) are **lightweight threads managed by the JVM** rather than the OS. A platform (OS) thread costs ~1 MB of stack and is a scarce resource, so you could only have thousands. A virtual thread costs **kilobytes** and the JVM **schedules many of them onto a small pool of "carrier" (platform) threads**. The magic is in **blocking**: when a virtual thread hits a blocking call (`Thread.sleep`, blocking socket/DB I/O), the JVM **unmounts** it from its carrier thread and parks it, freeing the carrier to run another virtual thread — so blocking a virtual thread **doesn't block an OS thread**.

The payoff: you can keep writing **simple, sequential, blocking code** — the familiar **thread-per-request** style of servlets, Spring MVC, and JDBC — and have it scale to **millions of concurrent requests**, **without** rewriting everything into callback/reactive style (`CompletableFuture`, Reactor) just to avoid exhausting OS threads. You get async-like scalability with synchronous-code readability and debuggability (real stack traces).

Usage and caveats:
- Create with `Thread.ofVirtual().start(runnable)` or `Executors.newVirtualThreadPerTaskExecutor()`.
- **Pinning**: a virtual thread inside a `synchronized` block **pins** to its carrier (can't unmount), so blocking there wastes a carrier thread — prefer **`ReentrantLock`** on hot paths (this pinning limitation is being removed in later JDKs).
- **Don't pool virtual threads** — they're cheap and disposable; create **one per task**, unlike expensive platform threads. Pooling defeats the purpose.

**Key points:**
- `Thread.ofVirtual().start(...)` or `Executors.newVirtualThreadPerTaskExecutor()`.
- `synchronized` blocks pin the carrier — prefer `ReentrantLock` in hot paths (pinning is being fixed).
- Don't pool virtual threads — they're cheap, create per-task.
- Game-changer for "thread per request" servers.

---

### 95. JVM tuning basics

**Frequency:** Low

**Question:** What are the essentials of JVM tuning, and why should you measure before touching GC flags?

**Answer:** The single most important principle: **measure first — the defaults are good**. Modern HotSpot with **G1** is well-tuned for most workloads; blindly setting GC flags usually makes things worse. Profile the real bottleneck with **JFR (Java Flight Recorder) + Mission Control** or **async-profiler** before changing anything.

The handful of settings that actually matter:
- **Heap sizing** — set **`-Xms = -Xmx`** to the same value so the JVM doesn't spend startup resizing the heap, and choose a value that fits the workload **while leaving headroom for native/off-heap memory** (the heap is not the whole footprint).
- **GC choice by goal** — **G1** (default) balances throughput and pause; switch to **ZGC** (or Shenandoah) only when you need **very low, predictable pauses** (sub-millisecond) for latency-sensitive services.
- **Diagnostics always on** — enable **GC logs** and **`-XX:+HeapDumpOnOutOfMemoryError`** so that when an OOM or GC pathology happens, you have the evidence to diagnose it instead of guessing.
- **Container awareness** — **`-XX:+UseContainerSupport`** (default since 8u191) makes the JVM read **cgroup limits** so it sizes the heap and CPU counts to the container, not the host. Without it, a JVM in a 512 MB container may think it has the node's full RAM and get OOM-killed.

The most common real-world gotcha is **off-heap memory**: **DirectByteBuffers** (NIO, Netty), **Metaspace** (class metadata), thread stacks, and JIT code caches all live *outside* `-Xmx`. "Where did my RAM go?" is usually off-heap growth. Consequently, **container memory must exceed `-Xmx` + native + headroom** (budget roughly **~25% over `-Xmx`**) or the kernel OOM-kills the process even though the Java heap looks fine.

**Key points:**
- Measure before tuning; defaults are good.
- JFR + Mission Control / async-profiler for real diagnosis.
- Watch off-heap (DirectByteBuffers, metaspace) for "where did my RAM go".
- Container memory must exceed `-Xmx` + native + headroom (~25%).

---

### 96. Node.js streams & backpressure

**Frequency:** Low

**Question:** How do Node.js streams handle backpressure, and why prefer `pipeline()` over `pipe()`?

**Answer:** **Streams** process data **incrementally** instead of loading it all into memory. There are four types: **readable** (source — file read, HTTP request), **writable** (sink — file write, HTTP response), **duplex** (both, e.g. a socket), and **transform** (duplex that modifies data, e.g. gzip). This lets you handle data larger than RAM.

**Backpressure** is the mechanism that stops a fast producer from overwhelming a slow consumer. Each writable stream has an internal buffer with a **`highWaterMark`** threshold. When you `write()` and the buffer **exceeds `highWaterMark`**, `write()` returns **`false`**, signaling "I'm full, stop." A well-behaved reader then **pauses** until the writable emits a **`drain`** event, then resumes. `pipe()` and `pipeline()` wire this up **automatically** — they propagate the pause/resume so memory stays bounded, no matter how mismatched the speeds. Without backpressure handling, a slow disk with a fast source balloons memory until the process crashes.

**Prefer `pipeline()` over `pipe()`** because of **error handling and cleanup**. With manual `pipe()`, if one stream errors, the others **aren't automatically destroyed** — you leak file descriptors and sockets, and must wire up error listeners on every stream yourself. **`pipeline(src, transform, dest, cb)`** (and its promise form) propagates errors, **destroys all streams on failure**, and gives you a single completion callback — the correct, leak-free default.

Modern practices: **async iterators** (`for await (const chunk of readable)`) are the ergonomic way to consume streams; the **Web Streams API** (WHATWG `ReadableStream`/`WritableStream`) gives cross-runtime code that also works in browsers, Workers, Deno, and Bun; **stream files rather than buffering** them entirely; and **object-mode** streams pass JS objects instead of bytes/buffers.

**Key points:**
- Async iterators (`for await`) are the modern stream consumer.
- Web Streams API mirrors WHATWG for cross-runtime code.
- Don't buffer entire files in memory — stream them.
- Object-mode streams pass objects, not bytes.

---

### 97. Spring Boot vs Quarkus vs Micronaut

**Frequency:** Low

**Question:** How do Spring Boot, Quarkus, and Micronaut differ, and how would you choose between them?

**Answer:** The core distinction is **when they wire up dependency injection and AOP** — at runtime vs compile time — which cascades into startup time and memory:

- **Spring Boot** — the **incumbent** with an enormous, mature ecosystem (Spring Data, Security, Cloud, integrations for everything). It traditionally does **DI/AOP at runtime via reflection and proxies**, which means **slower startup** (classpath scanning, proxy generation) and **heavier memory** — historically a poor fit for serverless cold starts.
- **Quarkus** and **Micronaut** — newer frameworks that move **DI/AOP to compile time** (annotation processing generates the wiring at build). The result is **fast startup** (tens of ms) and **low memory**, purpose-built for **serverless functions and dense container deployments** where cold-start and per-instance footprint matter.
- All three support **GraalVM native images** for **millisecond startup** and tiny memory; **Spring Boot 3** added **AOT processing** to close much of the gap.

Choosing:
- Pick **Spring Boot** for **ecosystem maturity**, breadth of integrations, and team familiarity — the safe default for most enterprise backends.
- Pick **Quarkus/Micronaut** for **cloud-native** workloads: serverless, functions, and high-density containers where startup/memory dominate cost.
- **Native images** buy tiny memory and instant startup but cost **slow builds** and **reflection caveats** (you must register reflective access, dynamic proxies, and resources explicitly — or use framework hints).
- All three offer **reactive** stacks (Quarkus **Mutiny**, Spring **Reactor**, plus RxJava), and **migrating between them is non-trivial** — the DI/config/annotation models differ enough that it's effectively a rewrite of the wiring layer.

**Key points:**
- Pick Spring for ecosystem maturity, Quarkus/Micronaut for cloud-native.
- Native images: tiny memory, slow build, reflection caveats.
- All three support reactive (Mutiny, Reactor, RxJava).
- Migration between them is non-trivial.

---

### 98. Express vs Fastify vs NestJS

**Frequency:** Low

**Question:** How do Express, Fastify, and NestJS compare, and how would you choose among them?

**Answer:** They occupy different points on the **minimalism ↔ structure** and **speed** spectrum:

- **Express** — **minimal, ubiquitous, and mature**, with the largest middleware ecosystem in Node. It's unopinionated (you assemble your own structure) and the safe, familiar default, but it's **slower** than newer options and its callback-era design shows its age.
- **Fastify** — **schema-first and roughly 2× faster** than Express. Its headline feature is **JSON-Schema-based validation and serialization**: you declare request/response schemas, and Fastify **validates input** and **compiles fast serializers** for output. It has a well-designed **plugin/encapsulation model** and first-class async support.
- **NestJS** — **opinionated and structured**, bringing **Angular-style modules, decorators, and dependency injection** to the backend. It runs **on top of Express or Fastify** (pluggable adapter), so it's an architecture layer rather than a raw HTTP framework. Best for **large codebases and teams** that want enforced structure, testability, and consistency.

Choosing: pick by **team and scale**. **Fastify** when you want performance and schema validation; **Express** when you value familiarity, ecosystem, and simplicity; **NestJS** when a big team needs enforced architecture and DI (accepting a heavier learning curve and more boilerplate). All three support **async/await** and a **middleware/hooks** pipeline. A newer option is **Hono** — a tiny, fast, **cross-runtime** framework that runs on **Cloudflare Workers, Bun, Deno, and Node**, appealing for edge/serverless targets.

**Key points:**
- Fastify wins benchmarks; Express wins familiarity.
- NestJS adds structure but heavier learning curve.
- All three support async/await and middleware/hooks.
- Hono is a newer cross-runtime alternative (Workers, Bun, Deno, Node).

---

### 99. mTLS

**Frequency:** Low

**Question:** What is mutual TLS (mTLS), and why is it stronger than bearer tokens for service-to-service auth?

**Answer:** Ordinary TLS authenticates only the **server** to the client (the browser checks the site's cert). **mTLS** makes it **mutual**: **both sides present X.509 certificates and each verifies the other's** against a trusted CA. So the server cryptographically confirms *which client* is calling, not just that *a* client connected. This makes mTLS the backbone of **service-to-service authentication in zero-trust networks**, where you don't trust the network and every call must prove its identity — replacing or augmenting shared API keys.

It's **stronger than bearer tokens** because of **possession binding**. A bearer token (JWT/API key) is "whoever holds it, is it" — if it leaks (log, proxy, SSRF, copy-paste) anyone can replay it. An mTLS client cert is bound to a **private key that never leaves the host** and is proven via a TLS handshake challenge, so there's **nothing static to steal and replay** — intercepting the traffic doesn't give an attacker the private key.

The hard part is the **certificate lifecycle** — issuing, distributing, **rotating**, and **revoking** certs across many services. Doing this by hand doesn't scale, so:
- **Service meshes** (**Istio, Linkerd**) **automate** issuance and rotation transparently, typically via **SPIFFE/SPIRE**, so app code doesn't manage certs at all.
- **Short-lived certs** (hours, auto-rotated) **limit blast radius** — a compromised cert expires quickly, reducing the need for revocation infrastructure.
- **SPIFFE IDs** give each workload a **stable cryptographic identity** (`spiffe://cluster/ns/sa`) independent of IP/pod.
- **TLS terminators / sidecars** (**Envoy**) **handle the mTLS handshake** so applications don't have to implement cert logic themselves.

**Key points:**
- Cert lifecycle (issue, rotate, revoke) is the hard part — automate.
- Short-lived certs (hours) limit blast radius.
- Pair with SPIFFE IDs for stable workload identity.
- TLS terminators (Envoy) handle mTLS so apps don't have to.

---

### 100. Metrics: RED vs USE

**Frequency:** Low

**Question:** Compare the RED and USE methods for metrics, and why track percentiles instead of averages?

**Answer:** RED and USE are two complementary **monitoring frameworks** that tell you *what* to measure, aimed at different subjects:

- **RED** — for **request-driven services** (APIs, endpoints): **Rate** (requests/sec), **Errors** (errors/sec or error %), and **Duration** (latency distribution). It answers "is this service serving requests well?" and maps directly to user experience.
- **USE** — for **resources** (CPUs, disks, memory, queues, connection pools): **Utilization** (% busy), **Saturation** (how much work is queued/waiting), and **Errors** (device/resource errors). It answers "is this resource a bottleneck?"

Use **RED for your APIs** and **USE for the infrastructure** underneath them — together they cover both the demand side and the supply side, so when an API's RED shows rising latency you check the USE metrics of its resources to find why.

**Track histograms/percentiles, not averages**, because averages hide tail latency. If 99% of requests take 20 ms and 1% take 5 s, the **average** might look fine (~70 ms) while **1 in 100 users** has a terrible experience — and at scale that 1% is a huge number of requests, often the ones that time out and cascade. The **p99 (and p99.9)** exposes exactly that tail. Record latency as a **histogram** so you can compute any percentile after the fact.

Practices:
- **Histograms enable downstream percentile queries** — e.g. Prometheus **`histogram_quantile(0.99, ...)`** computes p99 from bucketed data.
- **Avoid high-cardinality labels** (user IDs, request IDs, full URLs) on metrics — each unique label combination is a separate time series and blows up the metrics backend's memory/storage.
- **Alert on SLO burn rate** (how fast you're consuming your error budget) rather than raw static thresholds — it's more meaningful and far less noisy.
- Build **golden-signal dashboards per service** so on-call has a consistent RED view everywhere.

**Key points:**
- Histograms enable percentile queries downstream (Prometheus `histogram_quantile`).
- High-cardinality labels (user IDs) blow up cardinality — avoid.
- Alert on SLO burn rate, not raw thresholds.
- Dashboards per service: golden signals (RED + saturation).
