# Backend Interview Questions

100 high-frequency backend questions covering API design, databases (SQL/NoSQL), caching, messaging, concurrency, security, languages (Python/Go/Java/Node), and operations.

---

### 1. REST vs RPC vs GraphQL vs gRPC

**Answer:** REST models resources with uniform HTTP verbs and is great for public, cacheable, resource-oriented APIs. RPC (JSON-RPC, gRPC) models actions/procedures and fits internal service-to-service calls where strong typing and low latency matter. GraphQL exposes a single endpoint with a typed schema and lets clients query exactly the fields they need — ideal for mobile/aggregation BFF layers but adds N+1 and caching headaches. gRPC uses HTTP/2 + protobuf for binary, streaming, multiplexed calls and is the default for internal microservices.

**Key points:**
- REST: cacheable via HTTP, weak typing, verbose payloads.
- gRPC: streaming, codegen, poor browser support (needs gRPC-Web).
- GraphQL: flexible queries, schema, complex auth and rate-limit story.
- Pick per audience: public/3rd-party = REST; internal high-throughput = gRPC; mobile aggregation = GraphQL.

---

### 2. Idempotency: methods & keys

**Answer:** An operation is idempotent if repeating it produces the same observable result. GET/PUT/DELETE are idempotent by HTTP contract; POST is not. For unsafe operations like payments, clients send an `Idempotency-Key` header; the server stores the first response keyed by it for some TTL and returns the cached response on retries. This protects against network retries, double-clicks, and at-least-once message delivery.

**Key points:**
- Store `(key, request hash, response)`; reject if key reused with different body.
- TTL 24h is typical; persist in Redis or a dedicated table.
- Idempotency != safety: PUT changes state but is idempotent.
- Critical for webhooks, payments, and queue consumers.

---

### 3. PUT vs PATCH

**Answer:** PUT replaces the entire resource representation; missing fields are typically cleared. PATCH applies a partial update (JSON Merge Patch RFC 7396 or JSON Patch RFC 6902). Use PUT when clients send the whole document and you want predictable replace semantics. Use PATCH for sparse updates, especially when concurrent writers update disjoint fields.

**Key points:**
- PUT is idempotent; PATCH is idempotent only if the patch is.
- JSON Merge Patch: simple, can't express array ops or null-vs-missing.
- JSON Patch: operation list, more expressive, harder to author.
- Always combine with ETag/If-Match to prevent lost updates.

---

### 4. API versioning (URL/header/content-negotiation)

**Answer:** URL versioning (`/v1/...`) is the most discoverable and cache-friendly and is what most public APIs use. Header versioning (`API-Version: 2`) keeps URLs clean but is invisible in logs and harder to test in browsers. Content negotiation (`Accept: application/vnd.acme.v2+json`) is the most RESTful but verbose. Whichever you choose, also version your error contract and webhooks.

**Key points:**
- Prefer additive, backward-compatible changes; bump major only on breaking changes.
- Maintain at most 2 major versions to bound support cost.
- Document deprecation timelines and emit `Sunset` / `Deprecation` headers.
- GraphQL avoids versions via field deprecation.

---

### 5. Pagination: offset vs cursor

**Answer:** Offset pagination (`LIMIT N OFFSET M`) is simple but slow on large offsets and unstable under concurrent inserts (items shift between pages). Cursor (keyset) pagination uses the last seen sort key (`WHERE (created_at, id) < (?, ?) ORDER BY ... LIMIT N`) and is O(log n) with an index, plus stable under inserts. Always cursor-paginate large or growing collections; offset is fine for small admin tables.

**Key points:**
- Cursors must encode the full sort tuple to be stable.
- Opaque base64 cursors hide implementation and let you evolve.
- Offset breaks for infinite scroll UX.
- Return `next_cursor` and `has_more`; avoid total counts on huge tables.

---

### 6. Filtering/sorting/sparse fieldsets

**Answer:** Standardize a filter syntax (`?status=active&created_at[gte]=...`) and document allowed fields and operators — never let arbitrary SQL leak through. Restrict sort fields to indexed columns to prevent expensive scans. Sparse fieldsets (`?fields=id,name`) reduce payload and let clients opt out of expensive subresources; GraphQL gets this for free.

**Key points:**
- Whitelist filter/sort fields; reject unknown ones loudly.
- Cap page size and complexity to prevent abuse.
- Document operator semantics: equality, ranges, IN, full-text.
- Use prepared statements; never interpolate filter values.

---

### 7. Rate limiting algorithms (token/leaky/sliding)

**Answer:** Token bucket allows bursts up to bucket size and refills at a steady rate — best general-purpose choice. Leaky bucket smooths output at a fixed rate, dropping or queueing excess. Fixed window is cheap but allows 2x burst at window edges. Sliding window log is accurate but memory-heavy; sliding window counter approximates it cheaply. Implement centrally (Redis) for distributed enforcement.

**Key points:**
- Return `429` with `Retry-After` and `X-RateLimit-*` headers.
- Limit per API key, per IP, and per route — composed.
- Redis `INCR` + EXPIRE or Lua script for atomicity.
- Combine with concurrency limits to protect downstream services.

---

### 8. AuthN vs AuthZ; OAuth 2.0 flows

**Answer:** Authentication proves identity ("who"); authorization decides permissions ("what"). OAuth 2.0 is an authorization framework that issues access tokens. Authorization Code + PKCE is the default for web and mobile apps. Client Credentials is for machine-to-machine. Device Code is for TVs/CLIs. Resource Owner Password is deprecated. OIDC layers identity (ID token, userinfo) on top of OAuth.

**Key points:**
- Never use Implicit flow anymore — PKCE replaces it.
- Access tokens short-lived; refresh tokens long-lived and rotatable.
- Validate `aud`, `iss`, `exp`, signature on every request.
- Scopes for coarse perms, claims for attributes, policy engine for fine-grained.

---

### 9. JWT vs session cookies

**Answer:** Session cookies hold an opaque ID; state lives server-side, so revocation is trivial. JWTs are self-contained signed claims, so any service can verify without a lookup — great for distributed systems but painful to revoke before expiry. For first-party web apps, sessions with secure HttpOnly cookies are simpler and safer. For APIs and microservices, short-lived JWTs + refresh tokens are common.

**Key points:**
- JWT cons: size, can't revoke without a blacklist, easy to misuse `alg=none`.
- Always set `HttpOnly`, `Secure`, `SameSite=Lax/Strict` on session cookies.
- Keep JWTs short (5-15 min); refresh via rotating refresh token.
- Verify signature with asymmetric keys (RS256/EdDSA), not shared secrets, in multi-service setups.

---

### 10. API gateway responsibilities

**Answer:** A gateway is the single ingress for clients. It handles TLS termination, authn (JWT/API key validation), rate limiting, request/response transformation, routing to backend services, retries with circuit breakers, and observability (logs/metrics/traces). It should be thin — business logic stays in services. Examples: Kong, Envoy, AWS API Gateway, Apigee.

**Key points:**
- Offload cross-cutting concerns from services.
- Avoid putting domain logic in the gateway — it becomes a bottleneck.
- Use service mesh (Istio/Linkerd) for east-west; gateway for north-south.
- Pair with WAF for L7 attacks.

---

### 11. HATEOAS — when worth it

**Answer:** HATEOAS embeds links to next actions in responses so clients discover capabilities dynamically. In practice few clients consume hypermedia — they're hand-coded against fixed URLs — so the overhead rarely pays off. It shines for long-lived public APIs with diverse clients (e.g., PayPal) and for state-machine resources where allowed transitions vary.

**Key points:**
- Use it when client/server evolve independently and clients are generic.
- Skip it for internal services or single-team APIs.
- HAL and JSON:API standardize link formats.
- Don't confuse "REST" with "HATEOAS" — Roy Fielding does, the industry mostly doesn't.

---

### 12. Long-running ops: 202+poll vs webhooks vs SSE

**Answer:** Return `202 Accepted` with a job URL and let clients poll `/jobs/{id}` — simplest and firewall-friendly. Webhooks push results to a client-registered URL — fewer requests but require client to host an endpoint and you to handle retries/signing. SSE or WebSockets stream progress — best UX for browsers. WebSockets when bidirectional, SSE when server-to-client only.

**Key points:**
- Always return a job ID synchronously; never block on long work.
- Provide both polling and webhooks where feasible.
- Persist job state so retries return the same result.
- Set sensible polling guidance (`Retry-After`) to avoid hammering.

---

### 13. Webhook design: retries, signing, replay

**Answer:** Sign payloads with HMAC-SHA256 over the raw body plus a timestamp, sent as a header (`X-Signature`, `X-Timestamp`). Receivers verify the signature, reject stale timestamps (>5 min) to prevent replay, and respond `2xx` quickly. Retry on non-2xx with exponential backoff for hours/days, then push to a DLQ. Always include an event ID for idempotency.

**Key points:**
- Sign the raw body — JSON re-serialization breaks signatures.
- Provide a replay tool and a secret rotation mechanism (two active keys).
- Document a delivery SLA, max retry window, and IP ranges.
- Let receivers acknowledge async with a 202 + processing queue.

---

### 14. Backward compatibility

**Answer:** Additive changes are safe: new optional fields, new endpoints, new enum values (if clients tolerate unknowns). Breaking changes: removing/renaming fields, tightening validation, changing types, changing default behavior, changing error codes. Use Postel's law sparingly — being too lenient on input traps you later. Document a deprecation policy with timelines and warnings (`Sunset` header).

**Key points:**
- Never repurpose a field's meaning — add a new one.
- Use protobuf field numbers / GraphQL `@deprecated` for typed schemas.
- Run contract tests (Pact) between consumers and producers.
- Roll out behind feature flags with metrics on old vs new clients.

---

### 15. Error model (HTTP status + RFC 7807)

**Answer:** Use HTTP status codes correctly (`4xx` client, `5xx` server) and a consistent JSON body. RFC 7807 Problem Details defines `type`, `title`, `status`, `detail`, `instance`, plus extensions. Include a stable machine-readable `code` and a correlation ID. Don't leak stack traces or internal SQL to clients.

**Key points:**
- `400` validation, `401` no/bad creds, `403` no permission, `404` missing, `409` conflict, `422` semantic.
- Always include `code` and `request_id` for support triage.
- One error format across all endpoints — no snowflakes.
- Localize `title`/`detail` if the API is user-facing.

---

### 16. ACID

**Answer:** Atomicity: a transaction's writes commit all-or-nothing. Consistency: a transaction moves the DB from one valid state to another (constraints hold). Isolation: concurrent transactions appear serial to some degree. Durability: committed data survives crashes (typically via WAL fsync). RDBMS like Postgres provide all four; NoSQL stores often relax one or more for scale.

**Key points:**
- "C" is the squishiest — it's about app-level invariants, not just the DB.
- Durability depends on `fsync` and storage; cloud disks can lie.
- Isolation level (next question) determines what anomalies you see.
- WAL (write-ahead log) is the mechanism behind A and D.

---

### 17. Isolation levels & anomalies

**Answer:** Read Uncommitted: sees dirty reads. Read Committed (Postgres default): no dirty reads, but non-repeatable reads and phantoms possible. Repeatable Read (MySQL default): no non-repeatable reads; Postgres's RR also prevents phantoms via snapshot. Serializable: appears fully serial — Postgres uses SSI, which aborts conflicting txns. Higher isolation = more aborts/retries.

**Key points:**
- Anomalies: dirty read, non-repeatable read, phantom, write skew, lost update.
- Postgres SSI catches write-skew that Repeatable Read misses.
- Always handle serialization-failure retries in app code.
- Use explicit `SELECT ... FOR UPDATE` for hot rows instead of bumping isolation.

---

### 18. Indexes: B-tree vs hash; covering

**Answer:** B-tree is the workhorse — ordered, supports equality, range, prefix, and ORDER BY. Hash indexes only support equality and are rarely worth it (Postgres has them but they're crash-safe only since 10). A covering index includes all columns the query needs (via INCLUDE or composite) so the engine reads only the index, skipping the heap. Composite index order matters: leftmost-prefix rule.

**Key points:**
- Index selectivity: low-cardinality columns rarely benefit.
- Partial indexes for filtered subsets (`WHERE deleted_at IS NULL`).
- GIN/GiST for full-text, arrays, JSON, geo.
- Every index slows writes — measure before adding.

---

### 19. EXPLAIN

**Answer:** `EXPLAIN` shows the planner's chosen plan; `EXPLAIN ANALYZE` actually executes and reports timings and rows. Read it inside-out: leaf nodes first. Watch for Seq Scan on big tables, Nested Loop with high row counts, big mismatch between estimated and actual rows (stale stats), and `Rows Removed by Filter`. Fix with indexes, rewriting, or `ANALYZE`.

**Key points:**
- `BUFFERS` reveals cache hits vs disk reads.
- Update stats with `ANALYZE` after bulk loads.
- Beware `LIMIT` plans that look cheap but pick the wrong index.
- Use auto_explain / pg_stat_statements to catch regressions in prod.

---

### 20. N+1 query problem

**Answer:** Fetching a list of N parents then issuing N child queries — common with naive ORMs and lazy loading. Symptoms: throughput tanks as list size grows. Fix by eager-loading (`JOIN` or `IN (...)` with batching), DataLoader-style batching in GraphQL, or explicit prefetch (`select_related`/`prefetch_related` in Django, `Include` in EF). Watch ORM-generated SQL in dev.

**Key points:**
- Always log SQL in tests and assert query counts on hot paths.
- `JOIN` for 1:1 or small fan-out; `IN` batches for large fan-out.
- GraphQL resolvers need DataLoader almost universally.
- N+1 is the most common cause of slow APIs in ORM-heavy stacks.

---

### 21. Joins; when to denormalize

**Answer:** Normalized schemas keep data consistent and writes cheap. Joins are fine until they're not — denormalize when read latency dominates and the join crosses partitions/shards, or when a hot read pattern repeats a 5-way join. Materialized views and computed columns are middle grounds. In NoSQL, denormalize by default and design for query.

**Key points:**
- Inner vs left vs full outer — pick semantically, not by performance gut.
- Denormalization needs a sync strategy (triggers, CDC, dual-write).
- Read-heavy → denormalize; write-heavy → normalize.
- Materialized views with periodic refresh are often the best compromise.

---

### 22. Normalization 1NF-BCNF

**Answer:** 1NF: atomic columns, no repeating groups. 2NF: 1NF + no partial dependencies on a composite key. 3NF: 2NF + no transitive dependencies (non-key → non-key). BCNF: every determinant is a candidate key — stricter than 3NF. Practical apps target 3NF and selectively denormalize for performance.

**Key points:**
- Normalization minimizes update anomalies and storage duplication.
- Over-normalization causes excessive joins.
- Star/snowflake schemas in analytics deliberately denormalize.
- JSON columns are a pragmatic escape hatch for sparse attributes.

---

### 23. Sharding (range/hash/geo)

**Answer:** Range sharding splits by key range — easy range scans but hotspot risk on monotonic keys. Hash sharding distributes evenly — no range scans, harder rebalancing. Geo sharding routes by region for latency and compliance. Choose shard key for even distribution AND query locality; cross-shard joins/transactions are expensive.

**Key points:**
- Shard key is hard to change — design for the next 3-5 years.
- Consistent hashing minimizes rebalancing on node changes.
- Pre-split to avoid initial hotspots in range schemes.
- Avoid distributed transactions; route by tenant when possible.

---

### 24. Read replicas & replication lag

**Answer:** Replicas serve read traffic; the primary handles writes. Async replication is the norm — replicas trail by ms to seconds. Reading your own writes from a replica returns stale data, so route critical reads to the primary, or use "read your writes" tokens (LSN/GTID) to wait for replica catchup. Lag balloons under heavy writes or long-running queries on the replica.

**Key points:**
- Monitor lag (`pg_stat_replication`, Seconds_Behind_Master).
- Synchronous replication trades latency for zero data loss on failover.
- Be careful with sequence/identity behavior across failover.
- Logical replication enables selective table replication and version upgrades.

---

### 25. Connection pooling

**Answer:** DB connections are expensive (memory per backend, TCP+TLS handshake). A pool reuses a small fixed set. Sizing: start with `cores * 2` per app instance; total connections must not exceed DB's max_connections. PgBouncer in transaction-pooling mode is standard for Postgres. Beware: transaction-pooling breaks session features (prepared statements, `SET`).

**Key points:**
- Application pool ≠ proxy pool; layer them.
- Too many connections = context-switch storm and OOM on the DB.
- Idle timeouts prevent leaks holding precious slots.
- Serverless functions need a proxy (RDS Proxy, PgBouncer) to coalesce.

---

### 26. Deadlocks

**Answer:** Two transactions hold locks the other needs, forming a cycle. The DB detects and aborts one (`deadlock_detected`). Avoid by always acquiring locks in a consistent order, keeping transactions short, using lower isolation when safe, and indexing FKs (so child inserts don't take wider locks). Always retry on deadlock errors in app code.

**Key points:**
- Postgres logs both queries — read the log carefully.
- Hot-row contention often masquerades as deadlocks.
- `SELECT ... FOR UPDATE SKIP LOCKED` is great for queue-like patterns.
- Reorder operations or batch by sorted key to break cycles.

---

### 27. CTEs & recursive queries

**Answer:** A Common Table Expression names a subquery for reuse and readability. In Postgres pre-12, CTEs were optimization fences; from 12 they inline by default unless `MATERIALIZED`. Recursive CTEs walk trees/graphs (e.g., org hierarchies, comment threads). Watch for infinite loops — use depth limits.

**Key points:**
- Recursive CTE: `WITH RECURSIVE t AS (base UNION ALL recursive ref)`.
- Use `MATERIALIZED` when reusing a heavy subquery multiple times.
- Window functions often replace CTEs more efficiently.
- Don't recurse deeply on huge graphs — use a graph DB.

---

### 28. Window functions

**Answer:** Window functions compute across a frame of rows without collapsing them (unlike GROUP BY). `ROW_NUMBER()`, `RANK()`, `LAG/LEAD`, `SUM() OVER (PARTITION BY ...)` cover most needs — running totals, top-N per group, period-over-period. They replace painful self-joins and correlated subqueries.

**Key points:**
- `PARTITION BY` for groups; `ORDER BY` for sequencing; `ROWS/RANGE` for frame.
- Top-N per group: `ROW_NUMBER() OVER (PARTITION BY g ORDER BY x)` + filter.
- Computed after WHERE/GROUP BY but before ORDER BY/LIMIT.
- Often more index-friendly than subqueries.

---

### 29. JSON columns in Postgres

**Answer:** `jsonb` stores binary JSON with indexing (GIN) and operators (`->`, `->>`, `@>`). Use for sparse, schema-flexible attributes (tags, settings, audit payloads). Don't use as a primary modeling tool — you lose constraints and join efficiency. `json` (text) is rarely preferred; `jsonb` deduplicates keys and supports more operators.

**Key points:**
- GIN index on `jsonb_path_ops` for containment queries.
- Expression indexes on extracted fields for equality lookups.
- `jsonb_set`, `||` for partial updates — entire value is rewritten.
- Validate shape with `CHECK (jsonb_typeof(col->'x') = 'number')`.

---

### 30. Partitioning

**Answer:** Splits a logical table into physical chunks by range (dates), list (regions), or hash. Benefits: faster queries via partition pruning, cheap bulk drops (`DROP PARTITION` vs `DELETE`), per-partition vacuum/analyze. Costs: planning overhead, can't have global unique constraints across partitions easily.

**Key points:**
- Time-series logs/events are the canonical use case.
- Postgres declarative partitioning (10+) replaces inheritance tricks.
- Choose partition key matching most queries' WHERE clauses.
- Automate partition creation (pg_partman) — manual is error-prone.

---

### 31. Online schema migrations

**Answer:** Long DDL (adding columns with default, adding indexes, changing types) can lock tables and block writes. Use online tools (pg_repack, pt-online-schema-change, gh-ost) or break changes into safe steps: add nullable column → backfill in batches → add NOT NULL → drop old. Postgres supports `CREATE INDEX CONCURRENTLY` and `ADD COLUMN ... DEFAULT` is metadata-only since 11.

**Key points:**
- Never run `ALTER TABLE` blindly on a busy table in prod.
- Backfills should be batched with throttling.
- Expand/contract pattern: deploy code that handles both shapes before migrating.
- Keep migrations forward-compatible with the previous app version.

---

### 32. DB constraints vs app validation

**Answer:** Use both. DB constraints (NOT NULL, FK, UNIQUE, CHECK) are the last line of defense and protect against bugs in any app touching the DB. App validation gives nice error messages, validates business rules the DB can't (e.g., cross-resource invariants), and avoids round-trips. Never rely on app validation alone — the DB doesn't trust you and shouldn't.

**Key points:**
- FK constraints prevent orphaned rows even when ORMs misbehave.
- UNIQUE catches race conditions app-level checks miss.
- Keep validation logic close to the model layer; share it across endpoints.
- Constraint violations should map to clear API error codes.

---

### 33. Soft vs hard delete

**Answer:** Soft delete sets `deleted_at` instead of removing; hard delete actually removes. Soft delete preserves audit trail and undo, but pollutes queries (`WHERE deleted_at IS NULL` everywhere), breaks unique constraints (unique on email but soft-deleted user exists), and grows tables. Hard delete is simpler but loses history — pair with an audit log if you need it.

**Key points:**
- Partial unique indexes work around soft-delete uniqueness issues.
- GDPR right-to-erasure usually mandates hard delete or anonymization.
- Default views/scopes that hide deleted rows prevent leaks.
- Background jobs can purge soft-deleted rows after a retention window.

---

### 34. Optimistic vs pessimistic locking

**Answer:** Optimistic: read with a version/etag, write with `WHERE version = ?`; if 0 rows updated, conflict, retry. Best for low-contention workloads. Pessimistic: `SELECT ... FOR UPDATE` locks the row until commit. Best for high-contention or when retries are expensive. Optimistic scales better; pessimistic gives predictable latency under contention.

**Key points:**
- Always include an integer/UUID version column for optimistic.
- HTTP If-Match/ETag is optimistic locking at the API layer.
- Pessimistic locks held across user think-time = disaster.
- `SKIP LOCKED` enables work-queue patterns without contention.

---

### 35. UUID vs auto-increment PKs

**Answer:** Auto-increment ints are compact, sorted, and cache-friendly — fastest for inserts and joins. UUIDs are globally unique, generatable client-side, and don't leak counts, but random UUIDs cause B-tree fragmentation and bloat indexes. UUIDv7 (time-ordered) gives most of UUID's benefits with insert locality. Use UUIDs in distributed systems and public APIs; ints internally are fine.

**Key points:**
- Never expose sequential IDs in URLs (enumeration attacks).
- UUIDv4 random ≠ insert-ordered → write amplification.
- UUIDv7 / ULID are the modern default.
- Postgres `uuid` type is 16 bytes vs `text` 36 — always use the native type.

---

### 36. CAP & PACELC

**Answer:** CAP says under a network partition you must trade Consistency for Availability. PACELC extends: even without a partition, you trade Latency for Consistency (PA/EL vs PC/EC). Most distributed DBs are AP (Dynamo, Cassandra) or CP (Spanner, etcd, ZooKeeper). Real systems are tunable: Cassandra lets you pick consistency per query.

**Key points:**
- CAP is about behavior during partition, not steady state.
- "Consistency" in CAP = linearizability, stronger than SQL's "C".
- Latency vs consistency tradeoff (the LC in PACELC) is the everyday one.
- Don't pick a DB on CAP alone — operability matters more.

---

### 37. Document stores: embed vs reference

**Answer:** Embed when child data is bounded, accessed with the parent, and changes together (e.g., order line items in an order). Reference when child is shared, unbounded, or has independent lifecycle (e.g., users referenced by posts). Embedding optimizes reads but bloats documents; references require joins/lookups.

**Key points:**
- MongoDB 16MB document limit forces references for unbounded growth.
- Embedded subdocs avoid joins but duplicate on update.
- Hybrid: embed a summary + reference for details.
- Design for the dominant query pattern.

---

### 38. Wide-column partition keys

**Answer:** In Cassandra/DynamoDB the partition key determines which node owns the data and bounds the rows scanned together. Pick a key with high cardinality (even distribution) and matching your query patterns. Clustering/sort keys order rows within a partition for range scans. Hot partitions kill performance — avoid sequential or low-cardinality keys.

**Key points:**
- "Query first, model second" — design tables per access pattern.
- Composite partition keys spread load (`(tenant_id, day)`).
- Partition size cap (~100MB in Cassandra, 10GB item collection in DDB).
- Secondary indexes are expensive and often denormalized away.

---

### 39. Key-value stores (Redis, DynamoDB)

**Answer:** KV stores trade query flexibility for raw speed and horizontal scale. Redis is in-memory, single-threaded per shard, with rich data types (strings, hashes, lists, sets, sorted sets, streams). DynamoDB is managed, multi-AZ, single-digit ms at any scale, with limited query model (PK or PK+SK). Both punish ad-hoc queries — model around access patterns.

**Key points:**
- Redis for caching, sessions, leaderboards, rate limiting, queues.
- DynamoDB for serverless apps wanting zero ops + predictable latency.
- Watch DDB hot keys and GSI propagation lag.
- Redis cluster mode shards keys; multi-key ops require hash tags.

---

### 40. Search engines as non-primary DB

**Answer:** Elasticsearch/OpenSearch and similar excel at full-text, faceted, and analytics queries — not at being a source of truth. They're eventually consistent, lose data more easily, and have no transactions. Use them as a secondary index fed by CDC or a queue from your primary DB.

**Key points:**
- Never make ES the only copy of writes.
- Reindex strategies: alias swap for zero-downtime mapping changes.
- Tune analyzers per language; default stemmers are crude.
- Watch shard sizing (10-50GB/shard); too many shards kills cluster perf.

---

### 41. Time-series DBs (InfluxDB/Timescale)

**Answer:** Time-series workloads have append-heavy writes, time-ordered reads, retention policies, and downsampling. Specialized stores (InfluxDB, Timescale, Prometheus) compress timestamps and run-length encode values for huge space savings, plus offer continuous aggregates. Timescale is a Postgres extension — great when you want SQL.

**Key points:**
- High write throughput + cheap range scans by time.
- Continuous aggregates / downsampling reduce storage.
- TTL/retention policies built-in.
- Postgres alone is fine for low millions of points; specialized at billions.

---

### 42. Graph DBs (Neo4j)

**Answer:** Graph DBs store nodes and edges as first-class citizens — traversals are O(neighbors) instead of join-heavy O(table size). Use for fraud detection, recommendations, social graphs, knowledge graphs, and dependency analysis. Cypher / Gremlin / SPARQL are the query languages.

**Key points:**
- Best when relationships dominate queries (depth > 3 hops).
- Don't use for simple lookups — relational is faster and simpler.
- Native graph storage matters for traversal speed.
- AWS Neptune, JanusGraph, ArangoDB, Memgraph are alternatives.

---

### 43. Eventual consistency patterns

**Answer:** Replicas converge "eventually" after writes stop. Patterns to make it usable: read-your-writes (route to primary or session affinity), monotonic reads (sticky replica), bounded staleness (replica within X seconds), causal consistency (vector clocks). Surface staleness in the UI when it matters.

**Key points:**
- Avoid for money/inventory unless reconciled.
- Compensating actions handle conflicts you can't prevent.
- Last-write-wins is simple but loses data; CRDTs or merge functions are safer.
- Test with deliberate replica lag in staging.

---

### 44. Cache aside vs read-through vs write-through vs write-behind

**Answer:** Cache-aside: app reads cache, on miss loads from DB and populates — most common. Read-through: cache loads from DB itself on miss. Write-through: writes go to cache then DB synchronously — consistent but slow. Write-behind: cache acks fast, persists to DB async — fast but risks data loss on crash. Pick cache-aside unless you have a reason.

**Key points:**
- Cache-aside puts invalidation burden on the app.
- Write-through eliminates cache/DB skew at write cost.
- Write-behind needs durable queues to be safe.
- Always set TTLs even with explicit invalidation.

---

### 45. Cache invalidation strategies

**Answer:** Phil Karlton: one of the two hard things. Options: TTL (simple, allows staleness), explicit invalidation on write (correct, plumbing-heavy), version/etag in key (deploy bumps version), pub-sub fanout (Redis keyspace notifications). Combine TTL + explicit invalidation for safety.

**Key points:**
- Stampede protection (locks, single-flight) on miss.
- Negative caching — remember "not found" briefly.
- Key per query shape: `user:42:posts:page:1`.
- Soft TTL + background refresh keeps hot keys warm.

---

### 46. Redis data types & use cases

**Answer:** Strings: counters, JSON blobs, simple cache. Hashes: object fields with partial update. Lists: queues, recent-N feeds. Sets: tags, deduplication. Sorted sets: leaderboards, time-range queries, rate limiters. Streams: append-only logs with consumer groups (Kafka-lite). HyperLogLog: cardinality estimation. Bitmaps: presence/activity.

**Key points:**
- Avoid `KEYS *` in prod — use `SCAN`.
- Pipelining and Lua scripts for atomic multi-op batches.
- TTL per key; eviction policy (`allkeys-lru` is sane default).
- RedisJSON/Search modules add document and full-text features.

---

### 47. Redis persistence: RDB vs AOF

**Answer:** RDB takes periodic snapshots — compact, fast restart, but loses writes since last snapshot. AOF logs every command — durable down to fsync interval (every second by default), slower restart, larger files (background rewrites compact). Production usually runs both: AOF for durability, RDB for fast restore and backups.

**Key points:**
- `appendfsync everysec` is the default sweet spot.
- Snapshots fork the process — memory copy-on-write spikes.
- For pure cache, disable persistence entirely.
- Replicas + AOF + RDB is the durable triple.

---

### 48. Cache stampede mitigations

**Answer:** When a hot key expires, hundreds of requests miss simultaneously and pile onto the DB. Mitigations: single-flight (only one request fetches, others wait), probabilistic early expiration (refresh before TTL with rising probability), background refresh on near-expiry, request coalescing at the cache layer, lock with short TTL on rebuild.

**Key points:**
- Don't sync-expire huge fan-out keys at the same instant.
- Add jitter to TTLs to avoid synchronized expiry.
- "Stale-while-revalidate" pattern serves stale during rebuild.
- Monitor cache hit ratio AND origin pressure during incidents.

---

### 49. CDN for API responses

**Answer:** CDNs cache GET responses near users — huge win for public, cacheable data (rates, catalogs, configs). Use `Cache-Control: public, max-age=N`, `s-maxage` for shared caches, and `Vary` for content negotiation. Use surrogate keys / cache tags for targeted purges. Don't cache user-specific responses without a per-user key.

**Key points:**
- ETag + `If-None-Match` returns 304 cheaply for revalidation.
- Stale-while-revalidate / stale-if-error improve resilience.
- Purge on write (event-driven) plus TTL ceiling.
- Avoid CDN for sensitive personalized data unless segmented properly.

---

### 50. Bloom filters in caching

**Answer:** A Bloom filter is a probabilistic set: tells you "definitely not in set" or "probably in set" with tunable false-positive rate, using a tiny bitmap. Great for skipping cache/DB lookups for keys known absent (e.g., "is this username taken?", "do we have this URL crawled?"). False positives waste a lookup; false negatives never happen.

**Key points:**
- Space-efficient — bits per element, not full keys.
- Can't delete (use counting Bloom or cuckoo filter).
- Cassandra/RocksDB use Bloom filters internally for SSTable lookups.
- Size for expected n + acceptable false-positive p.

---

### 51. Threads vs processes vs coroutines vs async

**Answer:** Threads share memory in a process, switched by the kernel — fine-grained but with overhead and synchronization hazards. Processes are isolated, safer, costlier. Coroutines (goroutines, virtual threads, asyncio tasks) are user-space, cheap (KBs of stack), scheduled cooperatively or on a tiny thread pool. Async is event-loop driven and shines for I/O-bound work; threads/processes for CPU-bound parallelism.

**Key points:**
- CPU-bound → processes (Python) or threads (Go/Java).
- I/O-bound → async/coroutines for max concurrency.
- Mixing async with blocking calls = silent stalls.
- Pick the runtime that matches the workload.

---

### 52. Python GIL

**Answer:** The Global Interpreter Lock ensures only one thread executes Python bytecode at a time, simplifying CPython's memory management but preventing thread-level CPU parallelism. I/O releases the GIL, so threads still help I/O-bound code. For CPU-bound work use `multiprocessing`, native extensions (NumPy, Cython releasing the GIL), or PEP 703 free-threaded Python (3.13+).

**Key points:**
- Async + threads + processes are complementary tools.
- C extensions can release the GIL during number crunching.
- PEP 703 (no-GIL) is opt-in and experimental.
- GIL doesn't prevent race conditions in app logic.

---

### 53. Goroutines & M:N scheduler

**Answer:** Goroutines are user-space tasks managed by Go's runtime, multiplexed M:N onto OS threads (M=machines, N=goroutines). They start at 2KB stack, grow dynamically. The scheduler is work-stealing with preemption. A program can spawn millions cheaply. Channels and `select` provide CSP-style coordination.

**Key points:**
- `go func()` is the cheapest concurrency primitive in any mainstream language.
- Don't share memory; communicate via channels (idiomatically).
- `GOMAXPROCS` defaults to `runtime.NumCPU()`.
- Forgotten goroutines = leaks; always have an exit path (context).

---

### 54. Async I/O event loop pitfalls

**Answer:** Blocking the loop (CPU work, sync I/O, sleep) stalls all tasks. Symptoms: rising tail latency, healthcheck timeouts. Forbid blocking calls in async paths or push them to a thread/process pool. Avoid unbounded `gather` — use semaphores. Cancellation requires care: tasks may hold resources.

**Key points:**
- Profile with event-loop monitoring (e.g., `aiodebug`, `uvloop` stats).
- Wrap sync libs with `asyncio.to_thread` / `run_in_executor`.
- Always set timeouts on awaits.
- Test cancellation paths — they're routinely buggy.

---

### 55. Race conditions vs deadlocks vs livelocks

**Answer:** Race condition: outcome depends on timing of concurrent accesses (e.g., check-then-act on shared state). Deadlock: threads block each other in a cycle, nothing progresses. Livelock: threads keep changing state in response to each other but make no progress. Starvation: a thread is perpetually denied resources. Use locks/atomics, lock ordering, backoff with jitter.

**Key points:**
- Race conditions are often invisible until prod load.
- Detection: `-race` (Go), TSan (C++), `pytest-asyncio` strict mode.
- Test concurrent paths with stress + fuzzing.
- Prefer immutability / message-passing over shared mutable state.

---

### 56. Mutex vs semaphore vs condition var

**Answer:** Mutex: mutual exclusion, only one holder at a time. Semaphore: counts permits, allows N concurrent holders — used for resource pools or rate limits. Condition variable: lets threads wait for a predicate to become true, paired with a mutex (always check predicate in a loop — spurious wakeups). RWMutex separates readers and writers for read-heavy paths.

**Key points:**
- Always release mutexes (defer/finally) — exception safety.
- Beware priority inversion in real-time systems.
- Spinlocks only for very short critical sections on multicore.
- Channels in Go often replace explicit locks more cleanly.

---

### 57. Lock-free / CAS

**Answer:** Compare-and-swap atomically updates a value if it matches the expected one — the basis of lock-free data structures. Avoids lock contention but is fiendishly hard to write correctly (ABA problem, memory ordering). Use library-provided atomics (`atomic.Int64`, `AtomicReference`) or proven structures (concurrent maps); roll your own only with extreme care.

**Key points:**
- Lock-free ≠ wait-free; some threads can still stall.
- Memory model rules (acquire/release/seq_cst) matter on weak architectures.
- High contention can make CAS slower than locks (retries).
- Profile before optimizing — locks are usually fine.

---

### 58. Backpressure

**Answer:** Backpressure is the receiver signaling "slow down" to the sender — essential to prevent queue buildup and OOMs. Mechanisms: bounded queues that block/drop, HTTP 429/503, reactive streams (Request(n)), TCP window, async iteration with `await`. Without backpressure, fast producers cause cascading failures.

**Key points:**
- Always bound queues — unbounded queues are bugs in disguise.
- Drop, throttle, or shed load when overwhelmed.
- Propagate backpressure end-to-end (gateway → service → DB).
- Measure queue depth and reject early under load.

---

### 59. Kafka vs RabbitMQ vs SQS

**Answer:** Kafka: durable log, replayable, high throughput, partition-ordered, consumer groups — for streaming and event sourcing. RabbitMQ: classic broker with rich routing (exchanges, queues), per-message ack, lower throughput, easier for work queues and RPC. SQS: managed, simple, at-least-once, no ordering by default (FIFO queues exist), perfect for AWS-native workers.

**Key points:**
- Kafka = log; Rabbit/SQS = queue. Different mental models.
- Kafka retention by time/size; Rabbit/SQS drop on ack.
- Throughput: Kafka >> Rabbit > SQS standard.
- Ops: SQS zero, Rabbit medium, Kafka heavy (or managed via MSK/Confluent).

---

### 60. Exactly-once vs at-least-once vs at-most-once

**Answer:** At-most-once: fire and forget; messages may be lost. At-least-once: retry until ack; duplicates possible. Exactly-once: each effect happens once — only achievable end-to-end via idempotent consumers or transactional writes (Kafka EOS within Kafka). In practice, at-least-once + idempotent consumers is the realistic target.

**Key points:**
- "Exactly-once delivery" is mostly marketing; "exactly-once processing" is real.
- Idempotency keys + dedup tables are how you build exactly-once.
- Kafka transactions cover Kafka-to-Kafka; bridging to external systems requires outbox/2PC patterns.
- Always design consumers to handle dupes.

---

### 61. Kafka partitions/consumer groups/offsets

**Answer:** A topic has N partitions, each an ordered log. Producers route by key (same key → same partition → ordered). A consumer group's members split partitions — one consumer per partition max. Offsets track per-partition read position, committed back to Kafka. Scale consumers by adding partitions.

**Key points:**
- Partition count caps consumer parallelism per group.
- Rebalances pause consumption — cooperative rebalancing minimizes disruption.
- Commit offsets after processing, not before (at-least-once).
- Key choice = ordering boundary AND load distribution.

---

### 62. Outbox pattern

**Answer:** Avoids dual-write inconsistency between DB and message broker. In the same transaction that updates business state, insert into an `outbox` table. A separate relay (poller or CDC like Debezium) publishes outbox rows to the broker and marks them sent. Guarantees at-least-once delivery aligned with DB commits.

**Key points:**
- Eliminates "DB committed but message lost" / "message sent but DB rolled back".
- Pair with idempotent consumers (dupes are expected).
- CDC-based relay scales better than polling.
- Add a `processed_at` or move-to-archive to keep outbox small.

---

### 63. Saga pattern

**Answer:** Coordinates a long-running business transaction across services without distributed transactions. Each step is a local transaction; failures trigger compensating transactions to undo prior steps. Choreography: services react to each other's events. Orchestration: a central coordinator drives the steps. Orchestration is easier to reason about and monitor.

**Key points:**
- Compensations must be designed up-front and idempotent.
- Use for cross-service flows like book-flight + book-hotel + charge-card.
- Visualize state with a state machine.
- Temporal, Camunda, AWS Step Functions are common orchestrators.

---

### 64. 2PC — why avoided

**Answer:** Two-phase commit: a coordinator asks all participants to prepare, then commits or aborts based on votes. Provides atomic distributed transactions but blocks indefinitely if the coordinator fails mid-protocol, doesn't scale, and couples service availability. Modern systems prefer sagas + outbox for cross-service consistency.

**Key points:**
- 3PC reduces blocking but adds complexity and assumes synchrony.
- Across heterogeneous DBs/brokers, 2PC support is poor.
- Single-DB transactions are still the right answer when possible.
- Sagas trade ACID for available eventual consistency.

---

### 65. Idempotent consumers

**Answer:** Consumers must produce the same effect whether they process a message once or many times. Achieve via: dedup on message ID (store seen IDs with TTL), idempotent operations (UPSERT, conditional update), or transactional outbox + processed-IDs table. Critical because at-least-once delivery means dupes are normal.

**Key points:**
- Always include a stable message ID from the producer.
- Dedup window must cover max retry horizon.
- Side effects (emails, payments) need extra care — use idempotency keys.
- Test consumer with deliberate replays.

---

### 66. Dead letter queues

**Answer:** Messages that fail repeatedly go to a DLQ for inspection instead of blocking the main queue forever. Set max receive count (SQS) or max retries (Rabbit) before routing to DLQ. Alert on DLQ depth; build tooling to inspect, fix, and replay messages. Never silently drop.

**Key points:**
- Default DLQ with metrics and dashboards is table stakes.
- Poison messages can stall a partition without a DLQ.
- Include original headers and failure reason on transfer.
- Periodic DLQ cleanup so it doesn't grow unbounded.

---

### 67. Event sourcing & CQRS

**Answer:** Event sourcing persists state as a sequence of immutable events; current state is derived by replay. Gives audit trail, time travel, and projections. CQRS separates write model (commands → events) from read models (denormalized projections). Powerful but complex — schema evolution, replay performance, projection rebuilds are real costs.

**Key points:**
- Snapshots speed up replay for aggregates with long histories.
- Events are part of your API — version them carefully.
- Use for domains with strong audit/regulatory needs.
- Don't event-source everything — pick targeted aggregates.

---

### 68. Paxos/Raft basics

**Answer:** Consensus algorithms ensuring a cluster agrees on a value despite failures. Raft is the more understandable: a leader is elected by majority, all writes go through the leader, replicated to followers, committed when majority acks. Used in etcd, Consul, CockroachDB, TiKV, Kafka KRaft. Tolerates `(N-1)/2` failures with N nodes.

**Key points:**
- Always odd cluster sizes (3, 5, 7) for clean majorities.
- Quorum reads/writes ensure linearizability.
- Leader bottleneck for writes; sharding spreads load.
- Paxos is older, formally proven, harder to implement.

---

### 69. Vector clocks & CRDTs

**Answer:** Vector clocks track causal ordering: each node has a counter, included in every message; recipients merge max-wise. Detect concurrent vs causal updates, enabling conflict-aware merges. CRDTs (Conflict-free Replicated Data Types) — counters, sets, maps — merge deterministically without coordination, used in collaborative editing (Figma, Riak).

**Key points:**
- Vector clocks grow with cluster size — version vectors / dotted version vectors prune.
- CRDTs split into state-based (CvRDT) and operation-based (CmRDT).
- Eventual consistency without coordination overhead.
- Great for offline-first apps and multi-master setups.

---

### 70. Clock skew, NTP, logical clocks

**Answer:** Physical clocks drift; NTP keeps them within ms but not perfect. Don't use wall-clock for ordering distributed events — use logical clocks (Lamport timestamps for total order, vector clocks for causal). For absolute ordering across regions, Google's TrueTime uses GPS+atomic clocks with bounded uncertainty (Spanner waits out the uncertainty).

**Key points:**
- Leap seconds break naive timestamp logic.
- Hybrid logical clocks combine wall + logical for "good enough" ordering.
- Always run NTP/chrony on servers.
- Don't compare timestamps across nodes for correctness-critical decisions.

---

### 71. Python: GIL/asyncio/multiprocessing

**Answer:** The GIL serializes Python bytecode execution. `asyncio` gives single-threaded cooperative concurrency for I/O-bound work — millions of awaitable tasks. `threading` helps I/O-bound code because I/O releases the GIL. `multiprocessing` spawns processes for CPU-bound work, each with its own interpreter, communicating via pickled IPC. Pick by workload.

**Key points:**
- Don't mix asyncio with sync libraries without `to_thread`.
- `concurrent.futures` gives a uniform API over threads/processes.
- Subinterpreters (3.12+) and free-threading (3.13+) reshape the landscape.
- Picklability constraints bite `multiprocessing` users.

---

### 72. Python: type hints, mypy

**Answer:** PEP 484 added optional static types; `mypy` / `pyright` check them. Types document intent, catch bugs, and enable IDE intelligence with zero runtime cost. Modern Python (3.10+) has `X | None`, structural typing (Protocol), generics with `[T]`, `TypeAlias`, `Self`, `TypedDict`. Adopt incrementally with `# type: ignore` and `disallow_untyped_defs` per module.

**Key points:**
- `pyright` (Pylance) is faster and stricter than `mypy`.
- Runtime validation needs Pydantic/attrs — types aren't enforced.
- `Protocol` enables duck typing with static checks.
- Use `from __future__ import annotations` for forward refs.

---

### 73. Python: pip vs poetry vs uv; lock files

**Answer:** `pip` installs from PyPI; `pip-tools` adds lock files (`requirements.txt` pinned). Poetry adds dependency resolution, lock file, virtual env, and packaging. `uv` (Astral) is a Rust-based pip/poetry replacement, 10-100x faster, with `uv.lock` and `pyproject.toml`. Modern default: `uv` for speed, Poetry for mature ecosystems.

**Key points:**
- Always commit a lock file for reproducibility.
- `pyproject.toml` (PEP 621) is the standard project metadata.
- Avoid `pip install` without a constraints file in CI.
- `uv` is rapidly becoming the de facto choice in 2026.

---

### 74. Python: WSGI vs ASGI; gunicorn vs uvicorn

**Answer:** WSGI is the sync interface (Flask, Django pre-3) — one request per worker. ASGI is async (FastAPI, Starlette, Django 3+) — supports websockets and concurrent requests per worker. Gunicorn is a WSGI server with pre-forked workers; uvicorn is an ASGI server (libuv-backed). Production: gunicorn supervising uvicorn workers (`-k uvicorn.workers.UvicornWorker`).

**Key points:**
- ASGI is required for websockets/SSE/HTTP/2.
- Sizing: `workers = 2*cores+1` for sync; fewer for async.
- Hypercorn supports HTTP/2 and HTTP/3.
- Don't run dev servers (`flask run`, `uvicorn --reload`) in prod.

---

### 75. Go: channels vs mutexes

**Answer:** Go's mantra: "Don't communicate by sharing memory; share memory by communicating." Channels coordinate goroutines and pass ownership of data, encouraging clearer designs. Mutexes are fine — and often simpler — for protecting small bits of shared state (counters, caches). Use channels for handoff/coordination, mutexes for invariants on shared structures.

**Key points:**
- Buffered channels add capacity but hide design flaws if oversized.
- `sync.RWMutex` for read-heavy state.
- `sync.Once` for lazy init; `sync/atomic` for counters.
- Closing a channel signals completion; receivers detect with `, ok`.

---

### 76. Go: context cancellation

**Answer:** `context.Context` carries deadlines, cancellation signals, and request-scoped values through call chains. Pass it as the first parameter to every function that does I/O or spawns goroutines. Cancel via `WithCancel`/`WithTimeout`/`WithDeadline`; child contexts cancel when parents do. Check `ctx.Done()` in long loops and respect it in DB/HTTP libraries.

**Key points:**
- Never store context in structs — pass through functions.
- Use it for request lifetime, not for general DI.
- Always `defer cancel()` to release resources.
- Most stdlib libraries accept context; use those overloads.

---

### 77. Go: error handling

**Answer:** Errors are values returned alongside results — explicit `if err != nil` checks. Wrap with `fmt.Errorf("doing X: %w", err)` and unwrap with `errors.Is/As`. Sentinel errors (`io.EOF`) for known conditions, typed errors for structured info. No exceptions; `panic` is reserved for unrecoverable bugs.

**Key points:**
- Wrap once at each layer, not every line.
- `errors.Join` for multi-error aggregation (1.20+).
- Don't ignore errors — even `_ = ...` should be deliberate.
- Custom error types implement `Error() string` + behavioral interfaces.

---

### 78. Java GC (G1, ZGC, Shenandoah)

**Answer:** G1 (default since JDK 9) is region-based, mostly-concurrent, low-pause for heaps up to ~32GB. ZGC and Shenandoah are sub-millisecond, scalable to TBs — concurrent compaction with read/load barriers. Parallel GC maximizes throughput for batch work. Choice depends on latency vs throughput goals and heap size.

**Key points:**
- ZGC generational (JDK 21+) reclaims young objects faster.
- Tune heap size with `-Xms = -Xmx` to avoid resizing.
- GC logs (`-Xlog:gc*`) are essential for diagnosis.
- Avoid premature tuning — defaults are sane for most apps.

---

### 79. Java virtual threads (Loom)

**Answer:** JDK 21 GA. Virtual threads are lightweight (KBs), scheduled by the JVM onto a small pool of carrier threads. Write blocking code (`Thread.sleep`, blocking I/O) and the JVM unmounts the virtual thread instead of blocking the OS thread. Lets servlet/Spring-style code scale to millions of concurrent requests without async rewrites.

**Key points:**
- `Thread.ofVirtual().start(...)` or `Executors.newVirtualThreadPerTaskExecutor()`.
- `synchronized` blocks pin the carrier — prefer `ReentrantLock` in hot paths (pinning is being fixed).
- Don't pool virtual threads — they're cheap, create per-task.
- Game-changer for "thread per request" servers.

---

### 80. JVM tuning basics

**Answer:** Set `-Xms = -Xmx` to a value that fits the workload, leaving headroom for native/off-heap. Pick GC by goal (G1 default, ZGC for low pause). Enable GC logs and a heap dump on OOM (`-XX:+HeapDumpOnOutOfMemoryError`). Use `-XX:+UseContainerSupport` in containers (default since 8u191) so the JVM sees cgroup limits.

**Key points:**
- Measure before tuning; defaults are good.
- JFR + Mission Control / async-profiler for real diagnosis.
- Watch off-heap (DirectByteBuffers, metaspace) for "where did my RAM go".
- Container memory must exceed `-Xmx` + native + headroom (~25%).

---

### 81. Node.js event loop & libuv & workers

**Answer:** Node runs JS on a single thread with an event loop (libuv) for async I/O. Phases: timers → pending callbacks → idle/prepare → poll → check → close. Microtasks (promises, `queueMicrotask`) run between phases. CPU work blocks the loop — offload to `worker_threads` for parallelism or `child_process` for isolation.

**Key points:**
- Don't block the loop with `JSON.parse` of huge payloads, sync crypto, etc.
- `setImmediate` vs `setTimeout(0)` vs `process.nextTick` — distinct phases.
- Native modules can do work off-loop via libuv's thread pool (`UV_THREADPOOL_SIZE`).
- Profile with `clinic.js`, `--inspect`, `--prof`.

---

### 82. Node.js streams & backpressure

**Answer:** Streams process data incrementally — readable, writable, duplex, transform. `pipe()` and `pipeline()` propagate backpressure: when a writable's internal buffer exceeds `highWaterMark`, `write()` returns false and the reader pauses. Use `pipeline()` (with cleanup on error) over manual `pipe()`.

**Key points:**
- Async iterators (`for await`) are the modern stream consumer.
- Web Streams API mirrors WHATWG for cross-runtime code.
- Don't buffer entire files in memory — stream them.
- Object-mode streams pass objects, not bytes.

---

### 83. Spring Boot vs Quarkus vs Micronaut

**Answer:** Spring Boot is the incumbent — vast ecosystem, runtime DI/AOP via reflection, slower startup, heavier memory. Quarkus and Micronaut do compile-time DI/AOP, slashing startup and memory — great for serverless and containers. Both support GraalVM native images for ms startup. Spring Boot 3 + AOT brings native support too.

**Key points:**
- Pick Spring for ecosystem maturity, Quarkus/Micronaut for cloud-native.
- Native images: tiny memory, slow build, reflection caveats.
- All three support reactive (Mutiny, Reactor, RxJava).
- Migration between them is non-trivial.

---

### 84. Django vs Flask vs FastAPI

**Answer:** Django: batteries-included (ORM, admin, auth, migrations) — fastest for CRUD apps and content sites. Flask: micro-framework, you pick everything — flexible, more boilerplate. FastAPI: async, Pydantic-based typing, automatic OpenAPI docs — modern default for new APIs. Django + DRF still dominant for full-stack apps.

**Key points:**
- FastAPI for high-concurrency JSON APIs.
- Django when you need admin and ORM out of the box.
- Flask is the "I want full control" choice.
- Async support in Django (3.0+) is solid but ORM async lags.

---

### 85. Express vs Fastify vs NestJS

**Answer:** Express: minimal, ubiquitous, mature middleware ecosystem, slower. Fastify: schema-based, ~2x faster than Express, JSON-Schema validation, plugin model. NestJS: opinionated, Angular-style modules/decorators/DI, runs on Express or Fastify — best for large team codebases that want structure. Pick by team and scale.

**Key points:**
- Fastify wins benchmarks; Express wins familiarity.
- NestJS adds structure but heavier learning curve.
- All three support async/await and middleware/hooks.
- Hono is a newer cross-runtime alternative (Workers, Bun, Deno, Node).

---

### 86. SQL injection — parameterized queries

**Answer:** Never concatenate user input into SQL. Use parameterized queries / prepared statements — the driver sends SQL and values separately, so input can never be parsed as code. ORMs do this by default; raw queries via `db.query("... WHERE id = $1", id)` are safe. String escaping is a fallback, not a primary defense.

**Key points:**
- Treat all input as hostile — including from upstream services.
- Stored procs help but aren't a silver bullet.
- Use least-privilege DB users (no DDL for the app role).
- Static analyzers (semgrep, CodeQL) catch concat-style queries.

---

### 87. Password storage (bcrypt/argon2, salting, peppering)

**Answer:** Never store plaintext or fast-hash (MD5/SHA1) passwords. Use a slow KDF — Argon2id (preferred), scrypt, or bcrypt — with per-user salt (handled by the library). Pepper is an app-side secret added before hashing, stored separately from the DB (defense if the DB leaks alone). Tune cost so a hash takes ~100-250ms on production hardware.

**Key points:**
- Argon2id resists GPU and side-channel attacks.
- bcrypt's 72-byte limit is a footgun — pre-hash with SHA-256 first.
- Rehash on login if cost parameters increase.
- Rate-limit auth attempts to slow brute force.

---

### 88. TLS handshake & cert pinning

**Answer:** TLS 1.3 handshake: ClientHello (ciphers, key share) → ServerHello (chosen cipher, key share, cert) → Finished — 1 RTT, 0-RTT for resumption. Verifies server identity via certificate chain to a trusted CA. Cert pinning binds an app to specific cert/public key — defends against rogue CAs but risks bricking on rotation. Mostly for mobile apps; less common on backend.

**Key points:**
- TLS 1.3 drops RSA key exchange, requires PFS.
- Use modern cipher suites; deprecate TLS 1.0/1.1.
- Automate cert renewal (Let's Encrypt, ACM); expirations cause outages.
- Pin public-key SPKI, not the cert, for safer rotation.

---

### 89. mTLS

**Answer:** Mutual TLS — both client and server present certificates, each verifies the other. Used for service-to-service auth in zero-trust networks, replacing or augmenting API keys. Service meshes (Istio, Linkerd) automate cert issuance and rotation via SPIFFE/SPIRE. Stronger than bearer tokens because possession is bound to a private key on the host.

**Key points:**
- Cert lifecycle (issue, rotate, revoke) is the hard part — automate.
- Short-lived certs (hours) limit blast radius.
- Pair with SPIFFE IDs for stable workload identity.
- TLS terminators (Envoy) handle mTLS so apps don't have to.

---

### 90. Secrets management (Vault, KMS)

**Answer:** Don't store secrets in code, repos, or env files committed anywhere. Use a secrets manager (Vault, AWS Secrets Manager, GCP Secret Manager) that supports versioning, rotation, audit, and dynamic secrets (short-lived DB creds). KMS handles encryption keys — envelope encryption: data key from KMS encrypts data, KMS encrypts the data key.

**Key points:**
- Rotate secrets on a schedule and on personnel changes.
- Audit log every access.
- Inject at runtime (sidecar, init container), not bake into images.
- IAM roles > long-lived API keys whenever possible.

---

### 91. OWASP Top 10

**Answer:** The OWASP Top 10 ranks the most critical web security risks: Broken Access Control, Cryptographic Failures, Injection, Insecure Design, Security Misconfiguration, Vulnerable Components, Identification/Authentication Failures, Software/Data Integrity Failures, Security Logging/Monitoring Failures, SSRF. Use it as a baseline checklist, not the limit.

**Key points:**
- Broken Access Control is #1 — IDOR and missing checks are everywhere.
- Patch dependencies (Dependabot/Renovate) — vulnerable components are common.
- SSRF defense: deny-list metadata IPs, restrict outbound, validate URLs.
- Defense in depth: WAF + framework defaults + code review + scans.

---

### 92. CSRF on APIs vs forms

**Answer:** CSRF tricks an authenticated user's browser into making an unwanted request. Cookie-based session auth needs CSRF tokens (synchronizer pattern) or `SameSite=Lax/Strict` cookies. Bearer-token APIs (Authorization header) aren't CSRF-vulnerable because browsers don't auto-attach the header. Mixed auth (cookies + bearer) still needs protection.

**Key points:**
- `SameSite=Lax` is the modern default and stops most CSRF.
- Double-submit cookie pattern for stateless CSRF protection.
- Don't accept state-changing requests via GET.
- CORS prevents reading responses, not making requests — not a CSRF defense alone.

---

### 93. Rate limiting & abuse detection

**Answer:** Layer limits: per-IP at the edge (gateway), per-API-key at the app, per-route for expensive endpoints, per-user for sensitive ops (login, password reset). Detect abuse via anomalies: spikes from new IPs, failed-login surges, unusual user agents. Pair with CAPTCHA, exponential backoff, and account lockouts where appropriate.

**Key points:**
- Distinguish "rate" (per second) from "concurrency" (in-flight).
- Always include limits in error responses (`X-RateLimit-*`).
- Log denied requests for forensics.
- Account for legitimate burst traffic and provide a quota uplift path.

---

### 94. Structured logging & correlation IDs

**Answer:** Emit logs as JSON (or logfmt) with consistent fields: timestamp, level, service, trace_id, span_id, user_id, request_id. A correlation ID generated at the edge and propagated through all downstream calls lets you stitch a single user request across services. Use the OTel trace_id as the correlation ID where possible.

**Key points:**
- One log line per important event; avoid unstructured `printf`.
- Don't log secrets/PII; scrub at the source.
- Use levels honestly: `error` should page someone.
- Centralize (ELK, Loki, Datadog) and retain at the right cost tradeoff.

---

### 95. Tracing: OTel spans & sampling

**Answer:** A trace is a tree of spans, each representing an operation with start/end timestamps and attributes. OpenTelemetry is the vendor-neutral standard for instrumentation. Sampling controls cost: head-based (decide at root) is cheap but blind; tail-based (decide after seeing the full trace) keeps errors and slow traces. 1-5% head sampling + always-on-error is typical.

**Key points:**
- W3C `traceparent` header propagates context across services.
- Auto-instrumentation covers HTTP, DB, queues; supplement with custom spans on hot paths.
- Span attributes: keep low cardinality to avoid backend explosion.
- Pair traces with logs (shared trace_id) and metrics (exemplars).

---

### 96. Metrics: RED vs USE

**Answer:** RED for request-driven services: Rate (req/s), Errors (err/s or %), Duration (latency distribution). USE for resources: Utilization, Saturation, Errors. Use RED for APIs, USE for CPUs/disks/queues. Always track histograms/percentiles, not just averages — p99 reveals tail latency that means catch fires.

**Key points:**
- Histograms enable percentile queries downstream (Prometheus `histogram_quantile`).
- High-cardinality labels (user IDs) blow up cardinality — avoid.
- Alert on SLO burn rate, not raw thresholds.
- Dashboards per service: golden signals (RED + saturation).

---

### 97. Health checks: liveness/readiness/startup

**Answer:** Liveness: "is the process alive?" — restart if false. Readiness: "should I receive traffic?" — remove from LB if false (e.g., DB unreachable, warming up). Startup: "has init finished?" — gates liveness/readiness during slow boots. Keep liveness shallow (process responds); readiness checks real dependencies (with circuit breakers, not full fan-out).

**Key points:**
- Liveness failures cause restarts — keep them dumb to avoid cascades.
- Readiness flips on DB/queue outages so traffic drains.
- Don't tie liveness to downstream — you'll restart-loop during outages.
- Startup probes prevent premature kills of slow-booting apps.

---

### 98. Graceful shutdown

**Answer:** On SIGTERM: stop accepting new connections, finish in-flight requests, drain queues, close DB pools, then exit. K8s sends SIGTERM, waits `terminationGracePeriodSeconds`, then SIGKILL. Coordinate with readiness: flip ready=false first so the LB stops routing, sleep briefly for in-flight LBs to notice, then drain.

**Key points:**
- HTTP servers: stop listener, wait on a wait group, timeout fallback.
- Workers: stop pulling new jobs, finish current, commit offsets/acks.
- Always set a max drain timeout — hanging shutdowns hurt deploys.
- Test by sending SIGTERM in staging and verifying clean exit.

---

### 99. DB migrations in CI/CD

**Answer:** Migrations must be backward-compatible with the previous app version (expand/contract). Run migrations in CI before deploy, or as a pre-deploy job. Tools: Flyway, Liquibase, Alembic, Django migrations, golang-migrate, Atlas. Always reviewable, versioned, idempotent-ish, and tested against a copy of prod data shape.

**Key points:**
- Never destructive in the same release that deploys code requiring the old shape.
- Long migrations need online tooling (pt-osc, gh-ost, pg_repack).
- Roll forward — rolling back migrations is painful.
- Run migration jobs separately from app pods to avoid races.

---

### 100. Feature flags & dark launches

**Answer:** Feature flags decouple deploy from release: ship code dark, enable per user/segment/percentage. Enables canaries, A/B tests, kill switches, and gradual rollouts. Dark launches send real traffic to new code paths but discard results — verify performance and correctness before user exposure. LaunchDarkly, Unleash, ConfigCat, or homegrown.

**Key points:**
- Tier flags: release (short-lived), experiment, ops (kill switch), permission.
- Clean up stale flags — flag debt is real.
- Default state should be safe (off / old behavior).
- Combine with metrics: every flag has a dashboard for blast-radius detection.

---
