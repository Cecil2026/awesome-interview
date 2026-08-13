# Big Data Interview Questions

High-frequency big-data questions covering storage (HDFS), batch compute (MapReduce/Spark), streaming (Kafka/Flink), warehousing/lakehouse, file formats, and the performance problems (skew, shuffle) interviewers actually probe. This is a starter set — a small, high-quality sample meant to grow.

---

### 1. The 4 Vs and batch vs stream

**Frequency:** High

**Question:** What makes a problem a "big data" problem, and how do you decide between batch and stream processing?

**Answer:** "Big data" is usually framed by the **4 Vs**: *Volume* (too large for one machine), *Velocity* (data arrives fast/continuously), *Variety* (structured, semi-structured, unstructured), and *Veracity* (quality/uncertainty). The practical trigger is simpler: when data no longer fits or processes on a single node, you need horizontal scale-out and a framework that handles partitioning, parallelism, and failure recovery for you.

**Batch** processes a bounded, complete dataset on a schedule — high throughput, high latency (minutes to hours), simpler correctness (you see all the data). **Stream** processes unbounded events as they arrive — low latency (ms to seconds), but you must reason about incomplete/out-of-order data (event time, watermarks, windows). Pick batch for reporting, ETL, and training data; pick streaming for fraud detection, monitoring, and real-time features. Many systems run both, which is what the Lambda/Kappa architectures address.

**Key points:**
- 4 Vs: Volume, Velocity, Variety, Veracity — the real trigger is "doesn't fit/finish on one node."
- Batch = bounded data, high throughput, high latency; stream = unbounded, low latency, harder correctness.
- Streaming forces you to handle late/out-of-order data explicitly.

---

### 2. HDFS architecture

**Frequency:** High

**Question:** Explain the HDFS architecture. What roles do the NameNode and DataNodes play, and how does replication work?

**Answer:** HDFS is a distributed file system built for large files and high throughput on commodity hardware. Files are split into large **blocks** (default 128 MB) spread across many **DataNodes**. A single **NameNode** holds all metadata in memory — the directory tree and the block→DataNode mapping — but never touches the actual data. Clients ask the NameNode where a file's blocks live, then stream data directly to/from DataNodes.

Each block is **replicated** (default factor 3) for durability and locality; the default placement puts one replica on the local rack and two on a remote rack to survive rack failure without paying cross-rack cost on every write. DataNodes send periodic **heartbeats** and block reports; if one dies, the NameNode re-replicates its blocks elsewhere. The NameNode is the historical single point of failure, solved in HA setups with an active/standby pair coordinated via ZooKeeper and a shared edit log (JournalNodes). HDFS is optimized for *large sequential reads/writes and append*, not small files or random writes — millions of small files exhaust NameNode memory (the "small files problem").

**Key points:**
- NameNode = metadata (in memory); DataNodes = actual block storage.
- Blocks default 128 MB, replication factor 3, rack-aware placement.
- Heartbeats detect dead nodes → automatic re-replication.
- Bad at small files (NameNode memory) and random writes; great at large sequential I/O.

---

### 3. The MapReduce model

**Frequency:** High

**Question:** Walk through the MapReduce execution model. What happens in map, shuffle, and reduce?

**Answer:** MapReduce expresses a computation as two user functions over key-value pairs. **Map** runs in parallel over input splits (usually one per HDFS block, for data locality) and emits intermediate `(k, v)` pairs. The framework's **shuffle** phase then groups all values by key across the cluster: map outputs are partitioned (by `hash(key) % numReducers`), sorted, and transferred over the network to the right reducer. **Reduce** receives each key with the sorted list of its values and emits the final output.

The shuffle is the expensive, network-and-disk-heavy middle stage and usually the bottleneck. A **combiner** (a local, mini-reduce on the map side) cuts shuffle volume when the reduce is associative/commutative (e.g., sums, counts). The model is simple and fault-tolerant — failed tasks just re-run because inputs are immutable — but it materializes intermediate results to disk between every stage, which is why multi-step jobs are slow and why Spark's in-memory model largely replaced it.

**Key points:**
- Map (parallel per split) → shuffle (partition + sort + network transfer by key) → reduce (aggregate per key).
- Shuffle is the bottleneck; a combiner reduces its volume for associative aggregations.
- Fault tolerance via re-running tasks on immutable inputs.
- Disk materialization between stages makes iterative jobs slow.

---

### 4. Spark vs MapReduce

**Frequency:** High

**Question:** Why is Spark faster than MapReduce, and what are RDDs and the DAG scheduler?

**Answer:** Spark keeps intermediate data **in memory** and only spills to disk when needed, whereas MapReduce writes every stage's output to HDFS. For iterative workloads (ML, graph algorithms) and multi-stage pipelines this is often 10–100× faster because it avoids repeated disk round-trips.

An **RDD** (Resilient Distributed Dataset) is Spark's core abstraction: an immutable, partitioned collection with a recorded **lineage** of the transformations that built it. Instead of replicating data for fault tolerance, Spark recomputes lost partitions from lineage. Spark builds a **DAG** of transformations and, at an action, the **DAG scheduler** splits it into **stages** at shuffle boundaries; within a stage, narrow transformations pipeline into a single pass. Higher-level APIs (DataFrame/Dataset + Catalyst optimizer + Tungsten execution) add query optimization and code generation on top of RDDs.

**Key points:**
- In-memory intermediate data vs MapReduce's disk-per-stage → big speedup for iterative/multi-stage jobs.
- RDD = immutable, partitioned, fault-tolerant via lineage (recompute, not replicate).
- DAG scheduler splits work into stages at shuffle boundaries; narrow ops pipeline.
- DataFrame API + Catalyst/Tungsten optimize beyond raw RDDs.

---

### 5. Spark transformations vs actions, narrow vs wide dependencies

**Frequency:** High

**Question:** What is the difference between transformations and actions in Spark, and between narrow and wide dependencies?

**Answer:** **Transformations** (`map`, `filter`, `join`, `groupBy`) are **lazy** — they only build up the lineage/DAG and do nothing until an **action** (`count`, `collect`, `save`) forces execution. Laziness lets Spark optimize the whole plan (pipelining, predicate pushdown) before running anything.

Dependencies describe how child partitions relate to parent partitions. A **narrow** dependency means each parent partition feeds at most one child partition (`map`, `filter`, `union`) — these pipeline within a stage with no data movement. A **wide** dependency (`groupByKey`, `join`, `reduceByKey`) requires data from many parents to be repartitioned across the network — this is a **shuffle**, and it defines a stage boundary. Minimizing wide dependencies (e.g., preferring `reduceByKey` over `groupByKey` because it combines map-side, or broadcasting a small table in a join) is the heart of Spark performance tuning.

**Key points:**
- Transformations lazy; actions trigger execution → enables whole-plan optimization.
- Narrow dep = 1 parent → 1 child, no shuffle, pipelines in a stage.
- Wide dep = shuffle, defines stage boundaries, expensive.
- Prefer `reduceByKey`/broadcast joins to cut shuffle.

---

### 6. Data skew

**Frequency:** High

**Question:** What is data skew, how do you detect it, and how do you fix it?

**Answer:** **Skew** is when data is unevenly distributed across partitions/keys, so one or a few tasks process far more data than the rest. The job's wall-clock is bounded by the slowest task, so 99% of tasks finishing while one "straggler" runs for hours is the classic symptom — visible in the Spark UI as one task with huge input/shuffle-read and long duration. Common causes: a hot key (e.g., `null`, a default value, a celebrity user), or a skewed join key.

Fixes: **salting** — append a random suffix to the hot key to spread it across N partitions, aggregate, then combine (for joins, replicate the small side across the salts). **Broadcast join** — if one side is small, broadcast it to every executor and avoid the shuffle entirely. **Separate the hot keys** — handle them in a dedicated path. Filter out garbage keys (nulls) early. Modern Spark's **AQE** (Adaptive Query Execution) can auto-detect and split skewed partitions at runtime.

**Key points:**
- Skew = uneven key distribution → straggler task dominates wall-clock.
- Detect via Spark UI: one task with outsized shuffle-read/duration.
- Fix: salting, broadcast join, isolate hot keys, drop null/garbage keys.
- Spark AQE can auto-handle skewed joins at runtime.

---

### 7. Columnar file formats

**Frequency:** High

**Question:** Why do analytics systems use columnar formats like Parquet/ORC instead of row formats like CSV/Avro?

**Answer:** Analytical queries typically scan a few columns over many rows (`SELECT avg(price) ... WHERE date = ...`). **Columnar** storage lays out all values of a column contiguously, so the engine reads only the columns the query needs (**column pruning**) and skips the rest — huge I/O savings on wide tables. Storing like-typed values together also compresses far better (run-length, dictionary, delta encoding), and formats keep **min/max statistics per row group** so the reader can skip whole chunks that can't match a predicate (**predicate pushdown / data skipping**).

**Row** formats (CSV, JSON, Avro) are better for write-heavy, whole-record access — streaming ingestion, or Kafka messages where you read the full record. A common pattern: land raw data as Avro/JSON, then compact into Parquet/ORC for the analytical layer. Parquet is the de-facto standard in the Spark/Python ecosystem; ORC is common in the Hive world.

**Key points:**
- Columnar → read only needed columns (pruning) + better compression (like values together).
- Row-group min/max stats enable predicate pushdown / data skipping.
- Row formats (Avro/JSON/CSV) suit write-heavy, full-record access.
- Parquet (Spark ecosystem) / ORC (Hive) are the analytics standards.

---

### 8. YARN resource management

**Frequency:** Medium

**Question:** What problem does YARN solve, and what are its main components?

**Answer:** YARN (Yet Another Resource Negotiator) decouples cluster resource management from the compute framework, so Spark, MapReduce, Flink, etc. can share one cluster. The **ResourceManager** is the global scheduler that arbitrates resources (memory/CPU) across applications. Each application gets an **ApplicationMaster** that negotiates **containers** from the RM and coordinates its own tasks. **NodeManagers** run on each worker, launch/monitor containers, and report resources back.

The flow: client submits an app → RM allocates a container for the AM → AM requests more containers for the actual work → NodeManagers launch them. Schedulers (Capacity, Fair) decide how competing apps/queues share resources. This separation is why the same cluster can run batch and interactive workloads with isolation and quotas.

**Key points:**
- Separates resource management from the compute engine (multi-framework cluster).
- ResourceManager (global) → ApplicationMaster (per-app) → containers on NodeManagers.
- Capacity/Fair schedulers arbitrate between queues/users.

---

### 9. Kafka architecture

**Frequency:** High

**Question:** Explain Kafka's core architecture: topics, partitions, offsets, and consumer groups.

**Answer:** Kafka is a distributed, append-only **commit log**. A **topic** is split into **partitions**, each an ordered, immutable sequence of records; ordering is guaranteed *only within a partition*, not across a topic. Each record has an **offset** (its position in the partition). Producers choose a partition (round-robin, or by key hash so all records for a key land in the same partition and stay ordered).

Each partition is replicated across brokers with one **leader** and several **followers**; producers/consumers talk to the leader, followers replicate for failover (tracked via the **ISR**, in-sync replicas). **Consumer groups** provide scalable, load-balanced consumption: each partition is consumed by exactly one consumer in a group, so parallelism is capped by partition count. Consumers track their own committed offset, which is what enables replay and different delivery semantics. Kafka retains data by time/size regardless of consumption, so multiple independent consumers can read the same log.

**Key points:**
- Topic → partitions; ordering guaranteed only within a partition; offset = position.
- Key-based partitioning keeps a key's records ordered on one partition.
- Replication with leader + ISR followers for fault tolerance.
- Consumer group: one consumer per partition → parallelism bounded by #partitions.
- Consumer-tracked offsets enable replay; retention is time/size-based, decoupled from consumption.

---

### 10. Kafka exactly-once and delivery semantics

**Frequency:** High

**Question:** What delivery guarantees does Kafka offer, and how does it achieve exactly-once?

**Answer:** By default Kafka gives **at-least-once**: a producer retries on unacknowledged sends, which can create duplicates; a consumer that processes then commits its offset can reprocess after a crash. **At-most-once** comes from committing the offset before processing (lose data on crash, never duplicate).

**Exactly-once** (EOS) is built from two pieces. The **idempotent producer** assigns each producer a PID and a per-partition sequence number, so the broker deduplicates retried sends — no duplicates from producer retries. **Transactions** let a producer write to multiple partitions and commit consumer offsets atomically (the "consume-transform-produce" loop), so downstream sees all-or-nothing. Consumers reading with `read_committed` isolation only see committed records. The crucial caveat: EOS holds *within Kafka's boundary*; end-to-end exactly-once to an external system still requires that sink to be idempotent or transactional.

**Key points:**
- Default at-least-once (retries → dups); at-most-once = commit before processing.
- Idempotent producer (PID + sequence numbers) dedups retried sends.
- Transactions = atomic multi-partition write + offset commit; `read_committed` on the consumer.
- EOS is within Kafka; true end-to-end needs an idempotent/transactional sink.

---

### 11. Stream processing: Flink vs Spark Streaming

**Frequency:** High

**Question:** Compare Flink and Spark Streaming. What is the difference between event time and processing time?

**Answer:** Classic **Spark Streaming** uses **micro-batches** — it chops the stream into small time slices and runs a batch job on each, giving high throughput but latency floored by the batch interval (Structured Streaming's continuous mode narrows this). **Flink** is a **true streaming** engine processing record-by-record with millisecond latency, first-class event-time handling, and fine-grained state management, which makes it the stronger choice for low-latency, stateful stream processing.

**Processing time** is the wall-clock when an event is handled; it's simple but gives non-deterministic results because it depends on system speed and delays. **Event time** is the timestamp of when the event actually occurred (embedded in the data); it produces correct, reproducible results regardless of arrival delays, but forces you to handle **out-of-order and late** events. That is what **watermarks** are for — a watermark asserts "no events older than time T should still arrive," letting the engine decide when a window is complete enough to emit while bounding how long it waits for stragglers.

**Key points:**
- Spark Streaming = micro-batch (throughput, latency ≈ batch interval); Flink = true per-record streaming (ms latency, rich state).
- Processing time = when handled (simple, non-deterministic); event time = when it happened (correct, reproducible).
- Event time requires handling late/out-of-order data via watermarks.
- Watermark = "no earlier events expected past T" → when to close a window.

---

### 12. Windowing in stream processing

**Frequency:** Medium

**Question:** Explain tumbling, sliding, and session windows.

**Answer:** Because streams are unbounded, aggregations happen over **windows** — finite slices of the stream. A **tumbling** window is fixed-size and non-overlapping (e.g., count per 1-minute bucket); each event belongs to exactly one window. A **sliding** window is fixed-size but advances by a smaller step, so windows overlap and an event can be in several (e.g., a 5-minute average updated every 1 minute) — good for smoothed moving metrics. A **session** window is dynamic: it groups events separated by less than a "gap" of inactivity, closing when no events arrive for the gap duration — ideal for modeling user sessions of variable length. Windows are triggered/finalized based on watermarks (event time) so late data is handled with a defined policy (drop, or allowed lateness that updates results).

**Key points:**
- Tumbling: fixed, non-overlapping, each event in one window.
- Sliding: fixed size, overlapping (step < size), events in multiple windows.
- Session: gap-based, dynamic length, models activity bursts.
- Watermarks decide when a window fires; allowed lateness handles stragglers.

---

### 13. Lambda vs Kappa architecture

**Frequency:** Medium

**Question:** Contrast the Lambda and Kappa architectures. When would you choose each?

**Answer:** **Lambda** runs two parallel paths: a **batch layer** that recomputes accurate views over all historical data (slow but correct/complete) and a **speed layer** that gives low-latency approximate results over recent data; a serving layer merges them. It delivers both low latency and eventual correctness, but the cost is maintaining **two codebases** implementing the same logic, which drift and are painful to keep consistent.

**Kappa** drops the batch layer: everything is a stream, and "reprocessing" means replaying the log (e.g., from Kafka retention) through the same streaming code with a new job, then swapping the output. One codebase, simpler operations — viable now that stream engines are powerful and logs are replayable. Choose Kappa by default for new systems; Lambda still shows up where heavy historical batch computation (complex ML training, huge backfills) genuinely differs from the real-time path.

**Key points:**
- Lambda = batch (accurate) + speed (fast) + serving merge; downside is dual codebases.
- Kappa = stream-only; reprocess by replaying the log through the same code.
- Kappa is the modern default; Lambda persists where batch and real-time logic genuinely diverge.

---

### 14. Data warehouse vs data lake vs lakehouse

**Frequency:** High

**Question:** Compare data warehouse, data lake, and lakehouse.

**Answer:** A **data warehouse** stores cleaned, structured data in a schema optimized for analytics — **schema-on-write** (you model before loading), strong governance, fast SQL (Snowflake, BigQuery, Redshift). Great for BI, but expensive and inflexible for raw/unstructured data. A **data lake** stores raw data of any type cheaply in object storage (S3/HDFS) — **schema-on-read** (structure applied at query time), flexible for ML and exploration, but without governance it degrades into a "data swamp" with no ACID, no reliable schema, and poor query performance.

A **lakehouse** puts a transactional table layer (Delta Lake, Apache Iceberg, Hudi) on top of cheap lake storage, adding **ACID transactions, schema enforcement/evolution, time travel, and upserts** while keeping open columnar formats and warehouse-like SQL performance. It aims to serve both BI and ML from one copy of the data, avoiding the warehouse/lake split.

**Key points:**
- Warehouse: structured, schema-on-write, governed, fast SQL, pricey/rigid.
- Lake: raw/any format, schema-on-read, cheap/flexible, risks becoming a swamp (no ACID).
- Lakehouse (Delta/Iceberg/Hudi): ACID + schema + time travel on open lake storage — one copy for BI and ML.

---

### 15. OLAP vs OLTP

**Frequency:** High

**Question:** What distinguishes OLAP from OLTP systems, and what makes engines like ClickHouse/Druid fast for analytics?

**Answer:** **OLTP** (Online Transaction Processing) handles many small, concurrent read/write transactions with strong consistency — the operational database behind an app (Postgres, MySQL). It's optimized for point lookups and row-level writes, typically row-oriented and heavily indexed. **OLAP** (Online Analytical Processing) handles large aggregation/scan queries over historical data for analytics — few users, huge scans, mostly read-only. It's optimized for throughput over aggregates, not per-row transactions.

Analytical engines like **ClickHouse** and **Druid** achieve speed through **columnar storage** (read only needed columns), **vectorized execution** (process batches of values per CPU instruction), aggressive **compression**, **data skipping** via per-block min/max indexes, and pre-aggregation/materialized rollups. You usually feed OLAP from OLTP via CDC/ETL rather than querying the operational DB directly, to avoid analytical scans hurting production traffic.

**Key points:**
- OLTP: many small transactions, strong consistency, row-store, point access (Postgres/MySQL).
- OLAP: big scans/aggregations, read-mostly, column-store, throughput-oriented.
- ClickHouse/Druid fast via columnar + vectorized execution + compression + data skipping + rollups.
- Move data OLTP → OLAP via CDC/ETL to protect production.

---

### 16. Dimensional modeling: star vs snowflake

**Frequency:** Medium

**Question:** Explain star and snowflake schemas and when to use each.

**Answer:** Dimensional modeling organizes a warehouse into **fact** tables (the measurable events — sales, clicks — with foreign keys and numeric measures) and **dimension** tables (the descriptive context — customer, product, date). A **star schema** keeps each dimension denormalized into a single flat table directly joined to the fact table. It's simple, requires few joins, and is fast to query — the default for BI. A **snowflake schema** normalizes dimensions into sub-tables (e.g., product → category → department), saving some storage and reducing update anomalies, at the cost of more joins and slower, more complex queries. In practice star wins for analytics because storage is cheap and query simplicity/speed matter more; snowflake is used selectively for large, frequently-changing dimensions.

**Key points:**
- Fact table (measures + FKs) surrounded by dimension tables (context).
- Star = denormalized dimensions, fewer joins, faster — the analytics default.
- Snowflake = normalized dimensions, less redundancy, more joins/slower.
- Prefer star; storage is cheap, query speed and simplicity dominate.

---

### 17. Exactly-once in stateful stream processing

**Frequency:** Medium

**Question:** How does a stream processor like Flink guarantee exactly-once state semantics?

**Answer:** The core mechanism is **checkpointing** with the **Chandy–Lamport distributed snapshot** algorithm. Flink periodically injects **barriers** into the stream; as a barrier flows through operators, each snapshots its state (offsets consumed, window contents, aggregates) to durable storage (e.g., a state backend on S3/HDFS/RocksDB). When all operators have snapshotted for a given barrier, that checkpoint is complete and consistent. On failure, Flink restores every operator from the last complete checkpoint and rewinds the source (e.g., Kafka offsets) to match — so each record affects state exactly once.

That guarantees exactly-once **for internal state**. Exactly-once *output* to an external sink additionally needs either an **idempotent** sink or a **two-phase-commit** sink that commits its writes only when the checkpoint completes. Note "exactly-once" means each event's *effect on state* happens once, not that events are physically processed once.

**Key points:**
- Checkpoints via barriers (Chandy–Lamport) snapshot consistent global state.
- On failure: restore state + rewind source offsets → each record counted once.
- Exactly-once output needs idempotent or 2PC (transactional) sinks.
- It's exactly-once *effect*, not exactly-once physical processing.

---

### 18. Partitioning and sharding for scale

**Frequency:** High

**Question:** What partitioning strategies exist for distributing large datasets, and what are their trade-offs?

**Answer:** Partitioning splits data across nodes so work parallelizes. **Hash partitioning** (`hash(key) % N`) spreads data evenly and makes point lookups direct, but breaks range queries and causes massive reshuffling when N changes — mitigated by **consistent hashing**, which moves only a fraction of keys on resize. **Range partitioning** (by key ranges, e.g., date) keeps range scans efficient and is human-readable, but risks **hotspots** if load concentrates in one range (e.g., all writes on "today"). **List/directory partitioning** assigns keys to partitions by an explicit lookup table — flexible but adds a metadata layer.

The recurring trade-off is **even distribution vs query locality**: hashing balances load but scatters related data; ranging preserves locality but risks skew. Good keys avoid hotspots (don't partition on monotonically increasing IDs or low-cardinality fields), and rebalancing/re-sharding without downtime is the operational hard part.

**Key points:**
- Hash: even spread, direct lookups, bad for ranges; consistent hashing limits resize churn.
- Range: efficient scans, readable, but hotspot-prone (e.g., time-based writes).
- List/directory: flexible via a mapping, extra metadata layer.
- Core trade-off: even distribution vs locality; pick keys that avoid hotspots.

---

### 19. Spark cluster architecture

**Frequency:** High

**Question:** Walk through Spark's runtime architecture — how do driver, executors, and the job/stage/task hierarchy fit together?

**Answer:** A Spark application runs one **driver** and many **executors**. The driver hosts the `SparkContext`, builds the logical DAG, negotiates resources with a **cluster manager** (YARN, Kubernetes, Standalone, Mesos), schedules work, and collects results — it is the coordinator and the single point of failure for the app. **Executors** are JVM processes on worker nodes that run tasks and cache data; each has a fixed number of cores and a memory budget. Work decomposes hierarchically:

- **Job** — triggered by an action (`collect`, `save`, `count`).
- **Stage** — a set of tasks split at **shuffle boundaries** (wide dependencies); narrow transformations pipeline inside one stage.
- **Task** — the smallest unit, one per partition, executed on one core.

The DAG scheduler creates stages; the task scheduler ships tasks to executors, preferring **data locality**. More partitions than cores keeps executors busy and enables straggler recovery.

**Key points:**
- Driver coordinates (DAG, scheduling, results); executors run tasks and hold cached data.
- Cluster manager (YARN/K8s/Standalone) allocates executors to the app.
- Hierarchy: action → job → stages (split at shuffles) → tasks (one per partition).
- Task count = partition count; keep it a multiple of total cores.

---

### 20. Partitions, parallelism, repartition vs coalesce

**Frequency:** High

**Question:** How do you tune parallelism in Spark, and when do you use repartition versus coalesce?

**Answer:** Parallelism is bounded by the number of **partitions** — one task per partition, so too few partitions leaves cores idle and risks OOM, while too many creates scheduling overhead and tiny tasks. A common rule of thumb is 2–4 partitions per core; shuffle output is controlled by `spark.sql.shuffle.partitions` (default 200, often too high for small data, too low for huge data). Two tools reshape partitions:

- **`repartition(n)`** — full shuffle, produces roughly equal-sized partitions; can increase *or* decrease count and re-balance skew. Use before wide operations or when writing evenly sized files.
- **`coalesce(n)`** — merges existing partitions **without a full shuffle** (narrow), only reduces count, and may leave sizes uneven. Use it to shrink partitions cheaply, e.g., before writing to avoid many small files.

Prefer `coalesce` when just reducing count post-filter; `repartition` when you need balance or more parallelism.

**Key points:**
- One task per partition; aim ~2–4 partitions per core.
- `spark.sql.shuffle.partitions` (default 200) governs post-shuffle partition count.
- `repartition` = full shuffle, rebalances, up or down; `coalesce` = no full shuffle, down only, may be uneven.
- Coalesce to cut small-file counts cheaply; repartition to fix skew or raise parallelism.

---

### 21. persist/cache and storage levels

**Frequency:** High

**Question:** What do cache and persist do in Spark, and how do the storage levels differ?

**Answer:** Because RDDs/DataFrames are lazily evaluated and recomputed from lineage on every action, reusing a dataset across multiple actions recomputes it each time. **`cache()`** and **`persist()`** mark a dataset to be stored after its first computation so later actions reuse it. `cache()` is shorthand for `persist(MEMORY_ONLY)` for RDDs and `MEMORY_AND_DISK` for DataFrames. Storage levels trade memory, CPU, and resilience:

- **MEMORY_ONLY** — deserialized in JVM heap; fastest, but partitions that don't fit are recomputed.
- **MEMORY_AND_DISK** — spills overflow partitions to disk instead of recomputing.
- **MEMORY_ONLY_SER / MEMORY_AND_DISK_SER** — serialized bytes; less memory, more CPU.
- **DISK_ONLY** — disk only, for expensive-to-recompute but memory-heavy data.
- **_2 variants** replicate each partition on two nodes for fault tolerance.

Caching is lazy (materializes on the next action); call `unpersist()` to free storage when done, and cache only datasets reused enough to justify the memory.

**Key points:**
- Cache/persist avoid recomputing reused datasets from lineage across multiple actions.
- `cache()` = MEMORY_ONLY (RDD) / MEMORY_AND_DISK (DataFrame).
- Levels trade memory vs CPU (SER) vs resilience (DISK, _2 replication).
- Caching is lazy; `unpersist()` to release; only cache what you truly reuse.

---

### 22. Broadcast variables and accumulators

**Frequency:** Medium

**Question:** What problems do broadcast variables and accumulators solve, and how do they differ?

**Answer:** Both are Spark's **shared variables**, but they move data in opposite directions. A **broadcast variable** sends a large read-only value (a lookup table, ML model, config map) to every executor **once** and caches it there, so all tasks on that executor reuse a single copy. Without it, a variable captured in a closure is serialized and shipped with *every task*, which is wasteful for large objects; broadcasting uses an efficient peer-to-peer (torrent-like) distribution. This underpins the broadcast hash join. An **accumulator** is a write-only aggregator for driver-side observability: tasks `add` to it (counters, sums) and only the driver reads the total — useful for metrics like counting bad records. The key caveat is fault tolerance: because failed or speculative tasks may re-run, accumulator updates are **only guaranteed exactly-once inside actions**, not transformations, where a re-executed task can double-count. Treat transformation accumulators as best-effort diagnostics.

- **Broadcast** — driver → executors, read-only, cached once per executor.
- **Accumulator** — executors → driver, write-only (add), read on driver.

**Key points:**
- Broadcast ships a large read-only value once per executor, not once per task.
- Broadcast uses torrent-style distribution; basis of broadcast hash joins.
- Accumulators aggregate values back to the driver (counters/metrics).
- Exactly-once only for accumulators used inside actions; transformations may double-count on re-run.

---

### 23. Spark join strategies

**Frequency:** High

**Question:** What join strategies does Spark use, and how does it choose between broadcast hash, shuffle hash, and sort-merge joins?

**Answer:** Spark's physical planner picks a join based on table sizes, join keys, and configuration:

- **Broadcast hash join** — if one side is smaller than `spark.sql.autoBroadcastJoinThreshold` (default 10 MB), Spark broadcasts it to every executor and builds a hash table locally, so the large side is joined **without a shuffle**. Fastest by far when applicable; only works for equi-joins and risks driver/executor OOM if the "small" side is misestimated.
- **Shuffle hash join** — both sides are shuffled by key; one partition's smaller side is built into a hash table probed by the other. Avoids sorting but needs the build side to fit in memory; used when a side is medium-sized and sorting is undesirable.
- **Sort-merge join** — both sides shuffled, each partition sorted by key, then merged. The default for large-to-large equi-joins; scales well and spills to disk gracefully, at the cost of sort overhead.

Non-equi joins fall back to broadcast/shuffle nested-loop joins. Accurate statistics and hints (`broadcast()`) drive good choices.

**Key points:**
- Broadcast hash join: small side broadcast, no shuffle — fastest but memory-risky (threshold default 10 MB).
- Shuffle hash join: shuffle both, hash the smaller side; no sort, build side must fit memory.
- Sort-merge join: shuffle + sort + merge; default for large-to-large, spills gracefully.
- Only equi-joins get hash/merge; non-equi uses nested loops; stats and hints guide the planner.

---

### 24. Adaptive Query Execution (AQE)

**Frequency:** High

**Question:** What is Adaptive Query Execution and which runtime optimizations does it perform?

**Answer:** Introduced in Spark 3.0 (on by default in 3.2+), **AQE** re-optimizes the physical plan **at runtime** using actual shuffle statistics rather than possibly-stale compile-time estimates. After each shuffle stage completes, Spark has exact partition sizes and re-plans the next stage. Three headline optimizations:

- **Dynamic partition coalescing** — merges many tiny post-shuffle partitions into fewer right-sized ones, curing the "too many small tasks" problem from a high `spark.sql.shuffle.partitions`.
- **Skew join handling** — detects abnormally large partitions and **splits** them into sub-partitions (replicating the matching side) so one straggler task doesn't dominate runtime.
- **Dynamic join strategy switch** — if a side turns out smaller than estimated at runtime, AQE converts a planned sort-merge join into a **broadcast hash join**, eliminating a shuffle.

AQE reduces the need for manual tuning of shuffle partitions and hand-fixing skew, and is enabled via `spark.sql.adaptive.enabled`.

**Key points:**
- Re-optimizes the plan at runtime from real shuffle statistics, per stage.
- Dynamic partition coalescing merges tiny partitions into balanced ones.
- Skew join handling splits oversized partitions to remove stragglers.
- Can downgrade sort-merge to broadcast join when a side is actually small.

---

### 25. Catalyst optimizer and Tungsten

**Frequency:** High

**Question:** How do Catalyst and Tungsten optimize and execute Spark SQL/DataFrame queries?

**Answer:** **Catalyst** is Spark SQL's rule-based and cost-based query optimizer. It transforms a query through phases: parse into an **unresolved logical plan**, resolve against the catalog, apply **logical optimizations**, generate **physical plans**, and select one by cost. Key logical rewrites include **predicate pushdown** (moving filters close to the source, so formats like Parquet skip row groups and JDBC pushes `WHERE` to the database), **projection pushdown** (reading only needed columns from columnar stores), constant folding, and join reordering. **Tungsten** is the execution engine that makes the chosen plan fast: it manages memory **off-heap** with cache-friendly binary layouts (avoiding JVM object overhead and GC pressure), and performs **whole-stage code generation**, fusing an entire chain of operators into a single tightly-looped JVM function instead of the slow iterator-per-operator (Volcano) model. Together, Catalyst decides *what* to compute efficiently and Tungsten makes the *how* CPU- and memory-efficient — which is why DataFrames usually beat hand-written RDD code.

**Key points:**
- Catalyst: unresolved → resolved → optimized logical plan → physical plans → cost-based selection.
- Predicate and projection pushdown cut I/O at the source (esp. columnar formats/JDBC).
- Tungsten uses off-heap binary memory layouts to slash GC and object overhead.
- Whole-stage codegen fuses operators into one function, beating the iterator model.

---

### 26. Checkpointing vs caching and lineage truncation

**Frequency:** Medium

**Question:** How does Spark checkpointing differ from caching, and why does it truncate lineage?

**Answer:** **Caching/persisting** stores a dataset's partitions in memory or local disk for reuse, but it **keeps the lineage** — if a cached partition is lost, Spark recomputes it from the DAG. **Checkpointing** writes the RDD/DataFrame to **reliable storage** (typically HDFS/S3) and then **truncates the lineage**, replacing it with a pointer to the checkpointed files. This matters for two reasons: very long lineages (iterative algorithms, or long-running structured streaming state) become expensive to recompute and can cause stack-overflow or huge DAGs, and a purely cached dataset offers no protection if the executor and its cached copy are both lost. By persisting to durable storage and cutting the dependency chain, checkpointing bounds recovery cost. The trade-offs: it triggers an extra job that writes data out (so it's slower and should usually be preceded by `cache()` to avoid recomputing), and the files persist beyond the job. Streaming checkpointing additionally stores offsets and operator state for exactly-once recovery.

- **Cache** — fast, in-memory/disk, keeps lineage, lost on executor failure, no I/O to reliable store.
- **Checkpoint** — durable store, truncates lineage, survives failure, costs an extra write.

**Key points:**
- Cache keeps lineage (recompute on loss); checkpoint saves to reliable storage and truncates lineage.
- Truncation bounds recovery cost for long/iterative lineages and huge DAGs.
- Checkpointing triggers an extra job — cache first to avoid recomputation.
- Streaming checkpoints persist offsets + state for exactly-once recovery.

---

### 27. Parquet internals

**Frequency:** High

**Question:** Walk through the internal layout of a Parquet file — row groups, column chunks, pages, encodings, and footer statistics.

**Answer:** A Parquet file is a hierarchy optimized for columnar scans. The file is split into **row groups** (a horizontal slice of rows, often ~128 MB), and within each row group every column is stored as a contiguous **column chunk**. Each column chunk is further divided into **pages** (typically ~1 MB), the smallest unit of encoding and compression. Values are encoded before compression: **dictionary encoding** replaces repeated values with small integer indices (great for low-cardinality columns), and **RLE/bit-packing** compresses those indices and the repetition/definition levels that encode nested and nullable structure. A **footer** at the end holds the schema plus per-column-chunk statistics — min/max, null count, distinct count — enabling readers to skip whole row groups or pages that cannot satisfy a predicate (**predicate pushdown**). Because the footer is last, readers seek to the end first, then read only the needed column chunks.

**Key points:**
- Hierarchy: file → row groups → column chunks → pages (page = unit of encode/compress).
- Dictionary encoding + RLE/bit-packing shrink low-cardinality and repeated data.
- Definition/repetition levels encode nulls and nesting without extra columns.
- Footer statistics (min/max/null counts) drive row-group and page skipping.

---

### 28. ORC vs Parquet

**Frequency:** Medium

**Question:** How do ORC and Parquet differ, and when would you choose one over the other?

**Answer:** Both are open, columnar, splittable formats with predicate pushdown, but they come from different ecosystems and differ in details. **ORC** (Optimized Row Columnar) was built for Hive: it uses **stripes** (its row groups, ~64–256 MB) with lightweight indexes, built-in **bloom filters**, and fine-grained row-level statistics that make predicate pushdown and ACID updates in Hive very effective; it often compresses slightly better. **Parquet** originated in the Impala/Dremel lineage and is the de-facto standard across Spark, Python (pandas/Arrow), and most cloud engines, with the richest tooling and broadest interoperability. Choose:

- **ORC** when your stack is Hive/Hadoop-centric, you want the best Hive ACID and bloom-filter skipping, or you need maximum compression.
- **Parquet** when you live in Spark/Arrow/Python or a multi-engine cloud lakehouse where interoperability matters most.

In practice both perform comparably; ecosystem fit usually decides.

**Key points:**
- Same idea (columnar, splittable, pushdown), different lineage: ORC = Hive, Parquet = Spark/Arrow.
- ORC: stripes, built-in bloom filters, strong Hive ACID, often slightly better compression.
- Parquet: broadest tooling/interoperability, standard in Spark/Python/cloud.
- Decision is usually ecosystem fit, not raw performance.

---

### 29. Avro and schema evolution

**Frequency:** Medium

**Question:** What is Avro, and how do a schema registry and schema evolution work with it?

**Answer:** **Avro** is a compact, row-oriented binary serialization format ideal for write-heavy, whole-record workloads like Kafka messages and raw ingestion — the opposite use case from columnar Parquet. Its key property is that data is written together with (a reference to) its **schema**, so readers can always interpret bytes. In streaming systems a **schema registry** stores schemas centrally and hands producers/consumers a small **schema ID** to embed per message instead of the full schema, saving bytes and enforcing rules. Avro supports **schema evolution** by resolving a writer's schema against a reader's schema: you can add fields (give them defaults so old readers cope), remove fields with defaults, or rename via aliases. The registry enforces a **compatibility mode** — backward (new schema reads old data), forward (old schema reads new data), or full — to prevent producers from shipping breaking changes. This decouples producer and consumer deploys.

**Key points:**
- Avro = compact row-based binary format; great for Kafka/ingestion, not analytics scans.
- Schema travels with data; a registry centralizes schemas and embeds a small ID per message.
- Evolution: add/remove fields with defaults, rename via aliases; writer/reader schemas are resolved.
- Compatibility modes (backward/forward/full) gate breaking changes and decouple deploys.

---

### 30. The small-files problem

**Frequency:** High

**Question:** What is the small-files problem in big-data systems, and how do you fix it?

**Answer:** The **small-files problem** arises when a dataset is stored as a huge number of tiny files rather than fewer large ones. On **HDFS** each file/block consumes NameNode memory, so millions of small files exhaust metadata capacity. On any engine, tiny files kill read performance: each file means separate open/seek/footer-read overhead, poor compression, tiny non-splittable tasks, and excessive scheduler and listing pressure (severe on object stores like S3 where LIST/GET latency dominates). Common causes are streaming micro-batches, over-partitioning, and one-file-per-task writes. Fixes include:

- **Compaction/bin-packing** jobs that rewrite many small files into files near the block size (e.g., 128 MB–1 GB).
- Tuning writers — `coalesce`/`repartition` in Spark, fewer output partitions, larger flush intervals in streaming.
- Table-format auto-compaction (Iceberg/Delta/Hudi `OPTIMIZE`/compaction) that also rewrites metadata.
- Avoiding excessive partition columns.

The goal is file sizes large enough to amortize overhead and stay splittable.

**Key points:**
- Many tiny files → NameNode memory pressure (HDFS) and per-file I/O/scheduling overhead everywhere.
- Especially painful on object stores (S3 LIST/GET latency) and for compression/splittability.
- Fix by compaction/bin-packing to ~128 MB–1 GB and by tuning writer parallelism.
- Modern table formats offer OPTIMIZE/auto-compaction; avoid over-partitioning.

---

### 31. Open table formats: Iceberg vs Delta vs Hudi

**Frequency:** High

**Question:** Compare Apache Iceberg, Delta Lake, and Apache Hudi. What problems do open table formats solve?

**Answer:** Open table formats add a **metadata layer** over Parquet/ORC files in a lake to provide database-like guarantees: **ACID transactions**, **time travel** (query a past snapshot), safe concurrent writes, schema evolution, and efficient **upserts/deletes**. They track which files belong to a table version via manifests/logs rather than trusting a directory listing.

- **Iceberg** uses a snapshot + manifest tree and is engine-neutral; its signature feature is **hidden partitioning** — the table stores partition transforms so users query by raw columns without knowing the physical layout, and partitioning can evolve.
- **Delta Lake** uses a JSON/Parquet **transaction log** (`_delta_log`); tightly integrated with Spark/Databricks, strong `MERGE`, `OPTIMIZE`, and Z-ordering.
- **Hudi** is built around **upserts and incremental pulls**, offering Copy-on-Write vs Merge-on-Read tables to trade read vs write cost — ideal for CDC and mutable data.

Choose by workload: Iceberg for engine-agnostic lakehouses, Delta for Spark/Databricks, Hudi for heavy streaming upserts/CDC.

**Key points:**
- All add ACID, time travel, schema evolution, and upserts/deletes over lake files via metadata.
- Iceberg: engine-neutral snapshots + hidden/evolving partitioning.
- Delta: transaction log, deep Spark/Databricks integration, MERGE/OPTIMIZE/Z-order.
- Hudi: upsert-first, Copy-on-Write vs Merge-on-Read, strong for CDC/incremental.

---

### 32. Hive partitioning vs bucketing

**Frequency:** Medium

**Question:** What is the difference between partitioning and bucketing in Hive, and what are the pitfalls of dynamic partitioning?

**Answer:** **Partitioning** splits a table into directories by column value (e.g., `/date=2026-08-12/`), so queries filtering on that column prune whole directories and read far less data. It works only for **low-cardinality** columns; partitioning on something high-cardinality (like user ID) creates a directory explosion and the small-files problem. **Bucketing** instead hashes a column into a fixed number of files (buckets) within each partition. Because rows with the same key always land in the same bucket, bucketing gives efficient **bucket map joins** (no shuffle when both sides are bucketed the same way) and better sampling — useful precisely for high-cardinality join keys. The classic **dynamic partitioning** pitfall is inserting data where partition values come from the data itself: an unbounded number of partitions can be created at once, each writing one small file per task, blowing up file counts and memory. Guardrails include limiting partition counts, clustering/sorting by the partition column before writing, and choosing sensible partition granularity.

**Key points:**
- Partitioning = directories per value → prunes I/O; only for low-cardinality columns.
- Bucketing = fixed hash buckets → shuffle-free joins and sampling on high-cardinality keys.
- They compose: partition by date, bucket by user ID within each partition.
- Dynamic partitioning can spawn too many partitions/small files; cap counts and sort before writing.

---

### 33. Z-ordering and data skipping

**Frequency:** Medium

**Question:** What is Z-ordering (data clustering), and how does it improve file/data skipping?

**Answer:** Data skipping relies on per-file min/max statistics: an engine reads a file only if its stats overlap the query predicate. Skipping is effective only when data is **physically clustered** so that each file holds a narrow value range. Sorting by a single column clusters that column perfectly but leaves others scattered, so filtering on a secondary column skips nothing. **Z-ordering** is a multi-dimensional clustering technique that interleaves the bits of several columns (a space-filling Z-curve) so that values close in multi-dimensional space are stored near each other. As a result, files have tight min/max ranges across **all** the Z-ordered columns at once, so queries filtering on any of them can skip many files. It is a rewrite/compaction operation (e.g., Delta `OPTIMIZE ... ZORDER BY`), trading write cost for much faster selective reads. It shines for tables queried on several different high-cardinality columns; for a single dominant filter, plain sorting or partitioning is simpler.

**Key points:**
- File skipping uses min/max stats — only works when data is clustered into narrow per-file ranges.
- Single-column sort helps one column; Z-order interleaves bits to cluster multiple columns at once.
- Enables skipping when filtering on any of several high-cardinality dimensions.
- A costly rewrite (OPTIMIZE/ZORDER); worth it for multi-column selective queries, overkill for one filter.

---

### 34. Compression codecs for big data

**Frequency:** Medium

**Question:** Compare snappy, zstd, gzip, and lz4 for big-data storage, and why does splittability matter?

**Answer:** The core trade-off is **compression ratio vs CPU speed**, plus **splittability** — whether a compressed file can be broken into independently readable chunks so multiple tasks process one file in parallel. A non-splittable compressed file (e.g., a raw gzip'd CSV/JSON) forces a single task to read the whole thing, killing parallelism. Roughly:

- **Snappy** — fast, moderate ratio; the long-standing default for Parquet/ORC where the format already provides block-level splittability.
- **Zstd** — near-gzip ratios at speeds close to snappy, with tunable levels; increasingly the preferred default for both storage size and speed.
- **Gzip** — high ratio but slow, and not splittable on its own — fine inside columnar formats, poor for large raw text files.
- **Lz4** — the fastest, lowest ratio; good for hot/temporary data and shuffle where CPU matters most.

Note that columnar formats compress per page/block, so even "non-splittable" codecs stay splittable at the row-group level; splittability is mainly a concern for raw text.

**Key points:**
- Trade-off: ratio vs CPU speed, plus splittability for parallel reads.
- Snappy = fast default; zstd = best all-round (great ratio + speed, tunable); gzip = high ratio but slow/non-splittable; lz4 = fastest, low ratio.
- Raw gzip/text is not splittable → one task per file; avoid for large inputs.
- Columnar formats block-compress, so codec choice mostly affects size/CPU, not splittability.

---

### 35. Kafka consumer group rebalancing and assignment strategies

**Frequency:** High

**Question:** How does consumer group rebalancing work in Kafka, and how do the range, round-robin, sticky, and cooperative assignors differ?

**Answer:** A consumer group divides a topic's partitions across its members so each partition is owned by exactly one consumer. When membership changes — a consumer joins, leaves, or is deemed dead (missed `session.timeout.ms` heartbeats or exceeded `max.poll.interval.ms`) — the group coordinator triggers a **rebalance** to reassign partitions. The assignment logic runs client-side via a pluggable `partition.assignment.strategy`:

- **Range** assigns per-topic contiguous partition ranges; simple but skews load when partition counts don't divide evenly.
- **RoundRobin** spreads all partitions evenly across members, balancing better but reshuffling ownership on every rebalance.
- **Sticky** balances evenly while trying to preserve existing assignments, minimizing churn.
- **Cooperative** (incremental) is the key evolution: instead of the old "stop-the-world" eager protocol where everyone revokes everything, it revokes only the partitions that must move, so unaffected consumers keep processing.

The trade-off is stability and availability during scaling versus assignment simplicity.

**Key points:**
- Rebalance = coordinator reassigns partitions when membership changes; assignment is computed on the client.
- Range/round-robin are eager (stop-the-world); sticky/cooperative minimize movement.
- Cooperative incremental rebalancing avoids a global pause — only moved partitions are revoked.
- Tune `session.timeout.ms`, heartbeats, and `max.poll.interval.ms` to avoid spurious rebalances.

---

### 36. Kafka durability: acks, ISR, and min.insync.replicas

**Frequency:** High

**Question:** How do acks, the ISR, and min.insync.replicas together control Kafka's durability/throughput trade-off?

**Answer:** Kafka replicates each partition to a leader plus followers; the followers that are caught up form the **in-sync replica set (ISR)**. The producer's `acks` setting decides when a write is acknowledged:

- **acks=0**: fire-and-forget — highest throughput, no durability guarantee (data lost if the leader fails before persisting).
- **acks=1**: leader-only ack — fast, but a leader crash before replication loses the last writes.
- **acks=all**: leader waits until every ISR member replicates — strongest durability.

`acks=all` alone is not enough: if the ISR has shrunk to just the leader, an ack still means one copy. **min.insync.replicas** sets the floor — with `min.insync.replicas=2` and `acks=all`, a produce fails (NotEnoughReplicas) unless at least two replicas are in sync, guaranteeing a surviving copy. The trade-off: higher durability adds replication latency and reduces availability (writes are rejected when replicas lag), so you tune per topic based on how much data loss you can tolerate.

**Key points:**
- ISR = replicas fully caught up to the leader; only ISR members can become leader (with unclean election disabled).
- acks=0/1/all trade throughput for durability; acks=all waits for the whole ISR.
- min.insync.replicas guards against a collapsed ISR — combine it with acks=all (e.g., RF=3, min.insync=2).
- Durability costs latency and availability; there is no free lunch.

---

### 37. Kafka log compaction vs retention

**Frequency:** Medium

**Question:** What is log compaction, how does it differ from time/size retention, and when would you use a compacted topic?

**Answer:** Kafka's default cleanup policy is **retention by time or size** (`retention.ms`/`retention.bytes`): whole log segments older or larger than the limit are deleted, regardless of content. **Log compaction** (`cleanup.policy=compact`) is fundamentally different — it retains *at least the latest value for each key* indefinitely, garbage-collecting only superseded records. A background cleaner rewrites segments, keeping the newest record per key; a record with a null value is a **tombstone** that deletes the key (retained for `delete.retention.ms` so consumers can observe the deletion). This turns a topic into a durable, replayable changelog: a new consumer can rebuild the full current state by reading from the beginning. Use compaction for keyed state where you care about the latest snapshot, not history — Kafka Streams state-store changelogs, `__consumer_offsets`, CDC/materialized caches, and config/lookup tables. Use time retention for event streams where every event matters (logs, metrics, clickstreams). You can also combine both (`compact,delete`).

**Key points:**
- Retention deletes by age/size; compaction keeps the latest value per key forever.
- Tombstones (null value) delete a key; retained briefly via delete.retention.ms.
- Compacted topics act as replayable changelogs for state reconstruction.
- Use compaction for keyed snapshots (Streams stores, offsets, CDC); use retention for event history.

---

### 38. Kafka Connect and CDC with Debezium

**Frequency:** Medium

**Question:** What problem does Kafka Connect solve, and how does Debezium implement Change Data Capture?

**Answer:** **Kafka Connect** is a framework for streaming data between Kafka and external systems without writing bespoke producer/consumer code. **Source** connectors pull data in, **sink** connectors push it out; connectors split work into **tasks** spread across a distributed worker cluster, and Connect handles offset tracking, restarts, scaling, and schema conversion (often via a Schema Registry). **Debezium** is a source connector suite for **Change Data Capture** — capturing every row-level insert/update/delete from a database and emitting it as an event stream. Crucially, it reads the database's **transaction log** (MySQL binlog, Postgres WAL logical replication, Mongo oplog) rather than polling tables, so it captures changes in commit order with low overhead and doesn't miss deletes. It performs an initial **snapshot** of existing data, then streams incremental changes; each event carries before/after images plus metadata. Because output goes to Kafka (often compacted) topics, CDC becomes the backbone for replication, cache invalidation, search indexing, and the outbox pattern for reliable event-driven integration.

**Key points:**
- Kafka Connect = reusable source/sink framework with tasks, offset management, and scaling built in.
- CDC captures row-level DB changes; Debezium reads the transaction log (binlog/WAL), not polling.
- Log-based CDC preserves commit order, is low-overhead, and captures deletes.
- Snapshot then stream; pairs naturally with compacted topics and the outbox pattern.

---

### 39. Backpressure in stream processing

**Frequency:** Medium

**Question:** What is backpressure in a streaming system, and how do frameworks handle it?

**Answer:** Backpressure occurs when a downstream operator cannot process records as fast as an upstream stage produces them. Without a mechanism to slow the source, buffers grow unboundedly and the job either runs out of memory or drops data. The healthy response is to propagate the slowdown upstream all the way to the source so ingestion throttles to the true sustainable rate. **Flink** achieves this naturally through bounded network buffers and credit-based flow control: a slow consumer stops granting buffer credits, which blocks the producer's writes, and the pressure cascades back to the source connector (e.g., Kafka), which simply polls less often — offsets keep advancing correctly. **Spark Structured Streaming** instead uses reactive rate limiting (`maxOffsetsPerTrigger` / adaptive backpressure) to cap intake per micro-batch. The key contrast is with a naive push system that has no flow control — it must buffer, spill, or drop. Watching backpressure metrics is the standard way to locate the bottleneck operator. Where you cannot slow the source, load shedding is the fallback.

**Key points:**
- Backpressure = downstream slower than upstream; must propagate to the source, not buffer indefinitely.
- Flink uses bounded buffers + credit-based flow control that naturally throttles the Kafka source.
- Spark caps intake per micro-batch (maxOffsetsPerTrigger / adaptive backpressure).
- Backpressure metrics pinpoint the bottleneck; load shedding is the last resort.

---

### 40. Watermarks and allowed lateness in event-time processing

**Frequency:** High

**Question:** How do watermarks, allowed lateness, and side outputs work together to handle out-of-order and late event-time data?

**Answer:** In event-time processing each record carries its own timestamp, but records arrive out of order, so the engine needs a notion of "how far along in event time we are." A **watermark** is that signal: a watermark of time T asserts that (probably) no events with timestamp ≤ T will arrive later, which lets the engine fire event-time windows and timers. Watermarks are generated with a bounded-out-of-orderness delay — larger delay tolerates more disorder but raises latency, so it is the core latency/completeness trade-off. When a watermark passes a window's end, the window fires. **Allowed lateness** keeps window state around for an extra grace period after firing: events arriving late but within it retrigger and update the (already emitted) result. Events later than watermark + allowed lateness are truly late; rather than silently dropped they can be routed to a **side output** (a separate stream) for logging, reconciliation, or a slow-path correction. This gives an explicit, tunable spectrum from low latency to full completeness.

**Key points:**
- Watermark = "event time has advanced to T"; drives window/timer firing despite out-of-order arrival.
- Bounded-out-of-orderness delay trades latency against tolerance for disorder.
- Allowed lateness retriggers a window for late events within a grace window after firing.
- Data past watermark + lateness goes to a side output instead of being silently dropped.

---

### 41. State backends and RocksDB in Flink

**Frequency:** Medium

**Question:** What are Flink's state backends, and why is RocksDB used for large keyed state with incremental checkpoints?

**Answer:** Flink operators keep **keyed state** (partitioned by key: value/list/map state, aggregations, window contents) that must survive failures. The **state backend** decides where working state lives and how checkpoints are stored. The **HashMapStateBackend** holds state as Java objects on the JVM heap — fastest access, but bounded by heap size and prone to GC pressure, so it suits small state. The **EmbeddedRocksDBStateBackend** stores state in an embedded RocksDB instance (an on-disk LSM-tree) on each task manager, so state can far exceed memory and spill to local disk; access pays serialization plus disk cost but scales to terabytes. Its decisive advantage is **incremental checkpoints**: because RocksDB is an LSM tree of immutable SST files, a checkpoint only uploads the SST files that changed since the last one instead of the entire state, dramatically cutting checkpoint size and duration for large, slowly-changing state. The trade-off is per-access serialization overhead and tuning (block cache, write buffers, compaction) versus the raw speed of on-heap state.

**Key points:**
- Keyed state is partitioned by key; the state backend controls where it lives and how it's snapshotted.
- HashMapStateBackend = on-heap objects, fastest but heap-bounded (small state).
- RocksDB backend = on-disk LSM, state can exceed memory, pays serialization cost.
- Incremental checkpoints upload only changed SST files — key reason to pick RocksDB for large state.

---

### 42. Checkpoints vs savepoints in Flink

**Frequency:** Medium

**Question:** How do checkpoints and savepoints differ in Flink, and how do savepoints enable upgrades and rescaling?

**Answer:** Both are consistent snapshots of a job's distributed state, but they serve different purposes. **Checkpoints** are automatic, periodic snapshots taken by Flink for fault tolerance: on failure the job restarts from the latest checkpoint and resumes exactly-once. They are optimized to be cheap and frequent (often incremental with RocksDB), owned by the system, and typically discarded on job termination — they are not designed for long-term portability. **Savepoints** are manually triggered, self-contained snapshots in a stable, canonical format intended to be durable and portable. Because a savepoint uses a format-stable layout with operator IDs, you can stop a job, deploy new code, and restart from the savepoint — enabling zero-data-loss **application upgrades**, Flink version migrations, and A/B changes. Savepoints also carry **max parallelism / key groups** metadata, so state can be redistributed across a different number of subtasks, enabling **rescaling** (changing parallelism). Rule of thumb: checkpoints keep a running job alive; savepoints let you intentionally evolve it. Assigning explicit UIDs to operators is essential so state maps correctly after code changes.

**Key points:**
- Checkpoints = automatic, frequent, system-owned, for recovery; often discarded on shutdown.
- Savepoints = manual, portable, stable format, for planned operations.
- Savepoints enable code upgrades, Flink version migration, and rescaling via key-group redistribution.
- Assign stable operator UIDs so state restores correctly across changes.

---

### 43. Slowly Changing Dimensions (SCD types)

**Frequency:** High

**Question:** What are Slowly Changing Dimensions and how do you implement SCD types 1, 2, 3, and 6?

**Answer:** SCDs describe how a dimension table handles attribute changes over time (e.g., a customer moves city). The type you choose decides whether history is preserved.

- **Type 1** overwrites the old value in place — no history, simplest, used when the change is a correction and past values don't matter.
- **Type 2** adds a new row per change and keeps the old one, tracked with a **surrogate key** plus `effective_date`, `end_date`, and an `is_current` flag. This is the workhorse for full history but grows the table and requires facts to join on the surrogate valid at event time.
- **Type 3** adds a column (e.g., `previous_city`) to keep only the prior value — limited history, one step back.
- **Type 6** ("1+2+3") combines them: a Type 2 row for history, plus a "current" attribute column updated everywhere (Type 1 behavior) so you can report by either the value at the time or today's value.

Implement via MERGE/upsert that expires the current row and inserts a new version.

**Key points:**
- Type 1 = overwrite, no history; Type 2 = new versioned row with effective/end dates + current flag.
- Type 3 = extra column for one prior value; Type 6 = Type 2 rows plus a maintained "current" column.
- Type 2 needs surrogate keys so facts point to the version valid at event time.
- Implement with MERGE: close the old row, insert the new; watch table growth.

---

### 44. Fact table types

**Frequency:** High

**Question:** What are transaction, periodic snapshot, and accumulating snapshot fact tables, and when do you use each?

**Answer:** The three fact-table grains model different measurement patterns. A **transaction fact** records one row per atomic event at the moment it happens (a sale, a click). It is the most granular and flexible, additive across most dimensions, but can grow enormous and can't easily answer "state at a point in time." A **periodic snapshot fact** captures measurements at regular intervals — one row per entity per day/week/month (e.g., daily account balance, inventory on hand). It answers trend questions cheaply and has predictable size, but measures are often **semi-additive** (you can't sum balances across time, only average or take end-of-period). An **accumulating snapshot fact** models a process with a defined lifecycle and multiple milestones — one row per instance (e.g., an order) that is **updated in place** as it moves through stages, with several date columns and lag measures between them. It's ideal for pipeline/latency analysis but requires updates, unlike the append-only transaction grain.

**Key points:**
- Transaction: one row per event, finest grain, additive, huge volume, no point-in-time state.
- Periodic snapshot: one row per entity per period; great for trends; measures often semi-additive.
- Accumulating snapshot: one updatable row per process instance with milestone dates and lags.
- Match the grain to the question; accumulating snapshots are updated, not append-only.

---

### 45. ETL vs ELT

**Frequency:** High

**Question:** What is the difference between ETL and ELT, and why did ELT rise with cloud warehouses?

**Answer:** **ETL** (Extract, Transform, Load) transforms data in a separate processing tier *before* loading it into the warehouse, so only cleaned, modeled data lands. **ELT** (Extract, Load, Transform) loads raw data into the warehouse first, then transforms it *in place* using the warehouse's own SQL engine. ELT surged because cloud warehouses (Snowflake, BigQuery, Redshift) provide cheap, elastic, decoupled storage and massive scalable compute, so it's efficient to push transformation to where the data already lives (push-down). Benefits:

- Raw data is retained, so you can re-transform when requirements change without re-extracting.
- Transformations become versioned SQL (e.g., dbt) that analysts can own, improving agility and testing.
- Load and transform scale independently on managed compute.

ETL still wins when you must cleanse/mask **before** landing (compliance, PII), when sources need heavy non-SQL processing, or when storing raw data is costly or forbidden.

**Key points:**
- ETL transforms before load (clean data lands); ELT loads raw, transforms in-warehouse via SQL.
- ELT rose with cheap elastic cloud storage/compute and push-down transformation.
- ELT keeps raw data, enables versioned SQL (dbt), and scales load/transform independently.
- Prefer ETL when you must mask/cleanse before landing or need non-SQL processing.

---

### 46. MPP and interactive query engines

**Frequency:** Medium

**Question:** How do Presto/Trino, Impala, and Hive-on-Tez differ architecturally, and when would you use each?

**Answer:** All three run SQL over data-lake storage, but with different execution models. **Presto/Trino** is a distributed MPP engine with a coordinator plus workers that stream data through a **fully in-memory, pipelined** execution model — very fast for interactive/ad-hoc queries and strong at **federation** across many sources (Hive, MySQL, Kafka, S3). Because it favors memory, very large batch joins can fail without careful tuning. **Impala** is also MPP and memory-oriented, with long-lived C++ daemons co-located on data nodes for low-latency BI on the Hadoop/HDFS stack; it's tightly coupled to that ecosystem. **Hive-on-Tez** compiles SQL into a DAG of tasks running on YARN — it spills to disk and is built for **large, fault-tolerant batch ETL** where throughput and reliability on huge datasets matter more than sub-second latency.

- Interactive/ad-hoc + federation → Trino.
- Low-latency BI on Hadoop → Impala.
- Heavy, resilient batch ETL → Hive-on-Tez.

**Key points:**
- Trino/Presto: in-memory pipelined MPP, great for interactive queries and cross-source federation.
- Impala: MPP C++ daemons on data nodes, low-latency BI tightly bound to Hadoop/HDFS.
- Hive-on-Tez: DAG on YARN, spills to disk, built for large fault-tolerant batch ETL.
- Choose by latency vs batch resilience and by whether you need federation.

---

### 47. Workflow orchestration with Airflow

**Frequency:** High

**Question:** How does Airflow orchestrate data pipelines, and what makes tasks safe to schedule and backfill?

**Answer:** Airflow defines pipelines as **DAGs** — directed acyclic graphs of tasks with dependencies — authored in Python and run by a scheduler against operators/executors. Each DAG run is keyed by a **logical/execution date** representing the data interval, which is the foundation for correctness. Two properties matter most. **Idempotent tasks** produce the same result if re-run (e.g., write to a deterministic partition, overwrite rather than append, use MERGE), so retries and reruns don't duplicate data. **Backfills** replay historical intervals by running the DAG for past dates; they only work cleanly if tasks are idempotent and parameterized by the execution date rather than `now()`. Common pitfalls:

- Confusing execution date with wall-clock time — a run "for" a day fires at its end.
- Non-idempotent appends that double-count on retry.
- Hidden dependencies/shared state between tasks instead of passing data through XCom or storage.
- Overlapping runs and resource contention from too much catchup/concurrency.

**Key points:**
- DAGs = Python-defined task graphs; runs keyed by logical/execution date (the data interval).
- Idempotent tasks (deterministic partitions, overwrite/MERGE) make retries and reruns safe.
- Backfills replay past intervals — only correct when tasks key off execution date, not now().
- Pitfalls: execution-vs-clock time confusion, non-idempotent appends, hidden state, catchup contention.

---

### 48. Data quality, lineage, and governance

**Frequency:** Medium

**Question:** How do data quality checks, lineage, and a data catalog work together in data governance?

**Answer:** As pipelines multiply, trust becomes the bottleneck, and three capabilities address it. **Data quality** enforces validation rules — not-null, uniqueness, ranges, referential integrity, freshness, and row-count anomalies — using tools like Great Expectations or dbt tests, ideally as gates that fail the pipeline before bad data propagates. **Lineage** tracks how data flows column-to-column across tables and jobs, so you can do **impact analysis** (what breaks if I change this column) and **root-cause analysis** (which upstream source corrupted a metric). **A data catalog** is the searchable inventory of datasets with schemas, owners, descriptions, classifications (e.g., PII), and popularity, so people can discover and understand data without tribal knowledge. Together they form governance: the catalog answers *what exists and who owns it*, lineage answers *where it came from and what depends on it*, and quality answers *whether you can trust it* — supported by policies for access, retention, and classification.

**Key points:**
- Data quality = automated validation gates (nulls, uniqueness, ranges, freshness) via GE/dbt tests.
- Lineage = column-level flow enabling impact analysis and root-cause debugging.
- Catalog = searchable inventory with schemas, owners, descriptions, and classifications.
- Governance combines all three plus access/retention/classification policies to make data trustworthy.

---

### 49. Wide-column stores: HBase and Cassandra

**Frequency:** Medium

**Question:** What is the wide-column data model in HBase and Cassandra, and when would you use one instead of a warehouse?

**Answer:** Wide-column stores organize data as a distributed, sorted map: rows keyed by a **row/partition key**, grouped into **column families**, where each row can hold different, sparse columns. They are built for **massive write throughput and low-latency lookups by key** at scale, not for ad-hoc analytics. **HBase** is CP-leaning, built on HDFS with a master and region servers, providing strong consistency and tight Hadoop integration. **Cassandra** is AP-leaning and masterless — a peer-to-peer ring with tunable consistency and no single point of failure, excellent for multi-region, always-on writes. The critical design rule is **query-driven modeling**: you shape tables (and partition keys) around the exact access patterns because there are no flexible joins or arbitrary filters. Use them for operational serving — time series, IoT, messaging, user profiles, session/feature stores. Use a **warehouse** instead when you need complex ad-hoc SQL, joins, and aggregations over historical data for analytics.

- HBase → strong consistency, Hadoop ecosystem.
- Cassandra → high availability, multi-region writes, tunable consistency.

**Key points:**
- Data model: partition key + column families with sparse, wide, per-row columns; a distributed sorted map.
- Optimized for high write throughput and low-latency key lookups, not ad-hoc analytics.
- HBase = CP on HDFS/strong consistency; Cassandra = AP masterless with tunable consistency.
- Model tables around queries (no joins); use a warehouse for complex analytical SQL.

---

### 50. Handling PII and GDPR in a data lake

**Frequency:** Medium

**Question:** How do you handle PII and GDPR requirements in a data lake?

**Answer:** A data lake keeps raw data long-term, so protecting personal data must be designed in, not bolted on. Layer several controls:

- **Encryption** at rest (e.g., KMS-managed S3/HDFS encryption) and in transit, so raw storage is never plaintext.
- **Masking/tokenization/pseudonymization** so most consumers see hashed or tokenized identifiers, with re-identification restricted to authorized roles; column-level access control and dynamic masking enforce least privilege.
- **Right to be forgotten (erasure):** immutable columnar files in object storage can't update a single row, so use lakehouse table formats (Delta/Iceberg/Hudi) that support row-level DELETE/MERGE, or **crypto-shredding** — encrypt each subject's data with a per-subject key and delete the key to render it unrecoverable.
- **Partition-by-tenant/region** to keep a tenant's or region's data physically isolated, which simplifies deletion, satisfies **data-residency** rules, and limits blast radius.

Wrap these with a catalog that **classifies** PII, lineage to trace where personal data spreads, retention policies, and audit logging of access — governance is what makes compliance provable.

**Key points:**
- Encrypt at rest and in transit; mask/tokenize so most consumers never see raw PII.
- Right-to-be-forgotten: lakehouse row-level DELETE/MERGE or crypto-shredding (delete per-subject key).
- Partition by tenant/region for isolation, data residency, and easier deletion.
- Add classification, lineage, retention, and audit logging so compliance is provable.

---

### 51. Spark SQL execution: RDD vs DataFrame vs Dataset

**Frequency:** High

**Question:** How does Spark SQL execute a query, and what are the trade-offs between the RDD, DataFrame, and Dataset APIs?

**Answer:** A Spark SQL query (SQL string or DataFrame call) is parsed into an **unresolved logical plan**, resolved against the catalog, then rewritten by the **Catalyst** optimizer (predicate/projection pushdown, constant folding, join reordering) into an optimized logical plan, and finally lowered to **physical plans** costed to pick one; **Tungsten** then generates whole-stage bytecode operating on off-heap binary rows. The API you use decides how much of this you get:

- **RDD** — arbitrary JVM objects and lambdas; maximum control but *opaque* to Catalyst, so no pushdown, no columnar/off-heap encoding, and full serialization overhead.
- **DataFrame** — `Dataset[Row]` with a schema; fully optimized by Catalyst/Tungsten and the fastest for relational work, but untyped (errors surface at runtime).
- **Dataset[T]** — typed, compile-time-safe JVM objects with encoders; safer than DataFrame but typed lambdas become black boxes that block some optimizations and add (de)serialization cost.

Prefer DataFrame/Dataset; drop to RDD only for low-level control the relational model can't express.

**Key points:**
- Pipeline: parse → resolve → Catalyst logical optimization → cost-based physical selection → Tungsten codegen.
- RDD is opaque to Catalyst — no pushdown, no columnar encoding, high serialization cost.
- DataFrame = optimized but untyped; Dataset = typed but typed lambdas can block optimizations.
- Default to DataFrame/Dataset; use RDD only when you truly need object-level control.

---

### 52. Bucketing and shuffle-free bucketed joins

**Frequency:** Medium

**Question:** What is bucketing in Spark, and how does it enable joins that avoid a shuffle?

**Answer:** Bucketing pre-partitions a table into a **fixed number of buckets** by `hash(bucketColumn) % numBuckets`, persisting each bucket as a set of files with the layout recorded in the metastore. Because rows with the same key always land in the same bucket, two tables **bucketed on the same column into the same number of buckets** can be joined by matching bucket-to-bucket locally — the exchange (shuffle) that a sort-merge join normally needs is eliminated, which is the whole point when the tables are too big to broadcast. It differs from partitioning: partitioning creates directories for coarse *pruning* by low-cardinality columns, while bucketing controls *file distribution* by a high-cardinality join/aggregation key. Caveats: bucket counts must match (or one must be a multiple, with Spark's bucket-coalescing), spark.sql.sources.bucketing must be enabled, and choosing the number is a commitment — too few buckets means large tasks, too many creates a small-files problem, and rebucketing requires a rewrite.

**Key points:**
- Buckets = deterministic `hash(key) % N` file layout recorded in the metastore.
- Same column + same bucket count → sort-merge join with no shuffle exchange.
- Partitioning prunes by low-cardinality dirs; bucketing distributes by high-cardinality keys.
- Bucket count is a fixed commitment; mismatches, small files, and rewrites are the pitfalls.

---

### 53. Window functions for analytics

**Frequency:** High

**Question:** How do SQL/Spark window functions work, and what do PARTITION BY, ORDER BY, and the frame clause each control?

**Answer:** A window function computes a value over a set of rows **related to the current row without collapsing them** — unlike GROUP BY, every input row is preserved and gets its own result. Three clauses define the window: **PARTITION BY** splits rows into independent groups (like GROUP BY, but non-aggregating); **ORDER BY** orders rows within each partition, which is required for ranking and offset functions and defines "preceding/following"; and the **frame** (`ROWS`/`RANGE BETWEEN … AND …`) bounds which ordered rows feed the aggregate for running totals or moving averages. Functions fall into ranking (`ROW_NUMBER`, `RANK`, `DENSE_RANK`, `NTILE`), offset (`LAG`, `LEAD`), and aggregate-over-window (`SUM`, `AVG`) families. A subtlety: with ORDER BY but no explicit frame, SQL defaults to `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`, and `RANGE` ties peer rows together (same value = same running sum) whereas `ROWS` counts physical rows. In Spark each distinct window spec triggers a shuffle-and-sort by the partition key, so skewed or high-cardinality partitions are the performance risk.

**Key points:**
- Windows compute per-row results over related rows without collapsing them (unlike GROUP BY).
- PARTITION BY = groups; ORDER BY = ordering for ranking/offsets; frame = which rows aggregate.
- Default frame with ORDER BY is `RANGE UNBOUNDED PRECEDING → CURRENT ROW`; ROWS vs RANGE differ on ties.
- Each window spec forces a shuffle+sort in Spark; skewed partition keys hurt performance.

---

### 54. Cost-based optimization and table statistics

**Frequency:** Medium

**Question:** How does cost-based optimization use table statistics, and why do ANALYZE and histograms matter?

**Answer:** Rule-based optimization applies fixed rewrites, but **cost-based optimization (CBO)** compares alternative plans by estimating their cost, and those estimates are only as good as the **statistics** the engine has. `ANALYZE TABLE … COMPUTE STATISTICS` collects table-level stats (row count, total size) and per-column stats (distinct count/NDV, min/max, null count, average length), and optionally **histograms** that describe value distribution within a column. CBO uses these to estimate the **selectivity** and output cardinality of each operator, which drives the big decisions: **join reordering** (join the most selective/smallest intermediates first to shrink downstream data), **join-strategy choice** (broadcast vs shuffle vs sort-merge based on estimated size), and build-side selection. Histograms matter because uniform-distribution assumptions badly misestimate skewed columns — an equi-height histogram captures that a few values dominate, fixing selectivity for range and equality filters. Stale statistics are the classic cause of catastrophic plans, so stats must be refreshed as data changes; Spark also has runtime AQE that corrects estimates using actual shuffle sizes.

**Key points:**
- CBO picks plans by estimated cost; estimates depend entirely on collected statistics.
- ANALYZE gathers table (rows/size) and column (NDV, min/max, nulls) stats, plus optional histograms.
- Stats drive join reordering, join-strategy selection, and cardinality/selectivity estimates.
- Histograms fix skewed-column misestimates; stale stats cause bad plans — AQE corrects at runtime.

---

### 55. Handling skewed joins with salting and skew hints

**Frequency:** High

**Question:** When a join is skewed by a few hot keys, how do salting and skew hints fix it?

**Answer:** In a shuffle join, all rows for a key go to one task; if a few keys hold a disproportionate share of rows, those tasks run far longer than the rest — the job's tail is dominated by a handful of straggler partitions while other cores sit idle. **Salting** breaks up the hot keys: append a random suffix `0…N-1` to the skewed side's key so one hot key becomes N sub-keys spread across N tasks, and **explode** the other side by cross-joining each matching row against all N salt values so the halves still meet. This trades extra data replication on the small side for balanced parallelism. Modern Spark automates the common case with **AQE skew join handling** (`spark.sql.adaptive.skewJoin.enabled`): it detects partitions larger than a median-based threshold at runtime and **splits** them into smaller sub-partitions automatically. A **skew hint** (`/*+ SKEW */` in engines that support it) tells the optimizer which key/column is skewed so it can apply the split proactively. Prefer AQE/hints first; hand-salt only when automation can't.

**Key points:**
- Skewed keys create straggler tasks — the slowest partition sets the job's runtime.
- Salting = randomize hot keys into N sub-keys and replicate the other side's matching rows.
- AQE skew join splits oversized partitions at runtime automatically (no code change).
- Skew hints tell the optimizer which key is hot; prefer automation, hand-salt as a fallback.

---

### 56. Materialized views and query-result caching

**Frequency:** Medium

**Question:** How do materialized views and query-result caching speed up analytical engines, and what are their trade-offs?

**Answer:** Both trade storage and freshness for speed, but at different granularities. A **materialized view (MV)** persists the *result of a query* (often a join+aggregate rollup) as a physical table; the payoff is **automatic query rewrite** — the optimizer transparently redirects matching queries (or sub-expressions) to the smaller MV, so many different queries benefit without referencing it by name. The cost is maintenance: the MV goes stale as base tables change and must be refreshed, either **full** (recompute) or **incremental** (apply only deltas), and the engine must know the MV is fresh enough to use. **Query-result caching** instead memoizes the exact output of a specific query keyed by the query text/plan (and often the underlying data version), returning instantly on an identical re-run but invalidated the moment inputs change — great for repeated dashboards, useless for parameter-varying queries. MVs are broad and reusable but need refresh policies; result cache is cheap and automatic but brittle to any change and to query-text variation.

**Key points:**
- MV persists a query result as a table; optimizer auto-rewrites matching queries to it.
- MV maintenance: full vs incremental refresh, plus staleness/freshness tracking.
- Result caching memoizes exact query output; instant on identical re-run, invalidated on any input change.
- MV = broad/reusable but needs refresh; result cache = cheap/automatic but brittle to change.

---

### 57. Approximate query algorithms: HyperLogLog and t-digest

**Frequency:** Medium

**Question:** How do algorithms like HyperLogLog and t-digest give fast approximate answers, and when should you use them?

**Answer:** Exact count-distinct and exact quantiles require holding or sorting all distinct values, which is memory-prohibitive at scale and doesn't parallelize cheaply. **HyperLogLog (HLL)** estimates cardinality in fixed, tiny memory (kilobytes for billions of distinct items) by hashing each value and tracking the maximum number of leading zeros seen per bucket — the intuition being that longer runs of leading zeros imply more distinct values — yielding a low, bounded relative error (~1–2%). Crucially HLL **sketches are mergeable**: you can union sketches from different partitions/days, which is why they suit distributed engines (`approx_count_distinct`) and pre-aggregation. **t-digest** (and GK) approximate **quantiles/percentiles** by maintaining a compact set of weighted centroids that keep more resolution at the distribution's tails, so p50/p99 stay accurate while memory stays small; it is also mergeable. Use these when an answer within a few percent is fine and you need speed, mergeability, or bounded memory — dashboards, monitoring, unique-visitor counts, latency SLOs — not for billing or reconciliation that demand exactness.

**Key points:**
- HLL estimates count-distinct in KB of memory via leading-zero counts; ~1–2% error, mergeable sketches.
- t-digest approximates quantiles/percentiles with weighted centroids, high tail resolution, mergeable.
- Mergeability is key: sketches union across partitions/time for distributed and incremental use.
- Use for speed/memory when small error is acceptable; never for exact billing/reconciliation.

---

### 58. Bloom filters in big data

**Frequency:** Medium

**Question:** How are Bloom filters used in big data for join pruning and storage-layer skipping?

**Answer:** A Bloom filter is a compact bit array with k hash functions that answers set membership with **no false negatives but possible false positives** — "definitely not present" is certain, "possibly present" is not. This one-sided guarantee makes it a cheap pre-filter. In **runtime join pruning** (Spark's runtime filters / dynamic filtering), the engine builds a Bloom filter from the smaller join side's keys and pushes it to the scan of the larger side, so rows that can't possibly match are discarded before shuffle — cutting I/O and shuffle volume, similar in spirit to a semi-join. At the **storage layer**, formats like ORC and Parquet can store Bloom filters per column chunk / row group, letting a reader **skip** entire blocks whose filter says a searched value is absent — powerful for high-cardinality equality predicates where min/max zone maps are useless (e.g., random IDs). Trade-offs: false-positive rate is tuned by bits-per-element and hash count, filters cost space and build time, and they help only equality/membership, not range predicates.

**Key points:**
- Bloom filter: no false negatives, possible false positives — "maybe present / definitely absent."
- Runtime/dynamic join filters prune the large side before shuffle, cutting I/O (semi-join effect).
- Storage-layer Bloom filters (ORC/Parquet) skip row groups for high-cardinality equality lookups.
- Only helps equality/membership, not ranges; false-positive rate trades against space.

---

### 59. UDFs vs built-in functions

**Frequency:** High

**Question:** Why are built-in functions usually faster than UDFs, and what optimization limits do UDFs impose?

**Answer:** Built-in (native) functions are **known to Catalyst**: they operate on Tungsten's off-heap binary rows, participate in whole-stage code generation, and can be pushed down and reordered by the optimizer. A **UDF is a black box** — Catalyst cannot see inside it, so it disables predicate pushdown *through* the UDF, blocks related optimizations and codegen fusion, and treats it as an opaque map. Worse is the serialization cost: a Scala/Java UDF still runs on the JVM but forces conversion out of the internal binary format into JVM objects and back; a **Python UDF** is far costlier because each row (or batch) must be serialized and shipped to a separate Python worker process and back over a pipe. **Pandas/vectorized UDFs** (Arrow-based) mitigate this by transferring columnar batches with near-zero-copy Arrow, amortizing overhead and enabling vectorized execution — much faster than row-at-a-time Python UDFs but still opaque to pushdown. Rule of thumb: express logic with built-ins whenever possible; if you must write a UDF, prefer native/SQL expressions, then vectorized Pandas UDFs, and push filters *before* the UDF.

**Key points:**
- Built-ins are transparent to Catalyst: Tungsten binary rows, codegen, pushdown, reordering.
- UDFs are black boxes — they block pushdown/codegen and add (de)serialization cost.
- Python UDFs cross a JVM↔Python process boundary per row/batch; the most expensive option.
- Pandas/Arrow vectorized UDFs amortize overhead; still push filters before any UDF.

---

### 60. Static vs dynamic partition pruning

**Frequency:** High

**Question:** What is the difference between static and dynamic partition pruning, and why does DPP matter for star-schema joins?

**Answer:** Partition pruning skips reading partitions that can't satisfy a query, dramatically cutting I/O on partitioned tables. **Static partition pruning** happens at **compile time**: when a filter is a literal on the partition column (`WHERE dt = '2026-08-12'`), the optimizer resolves the predicate against partition metadata and plans to scan only those directories — no runtime information needed. But in a **star-schema join** the filter is often on a *dimension* table (`WHERE dim.country = 'US'`) while the huge partitioned *fact* table is partitioned by a join key; the pruning value isn't a literal and isn't known until the dimension side is evaluated, so static pruning can't help and the engine would scan the whole fact table. **Dynamic partition pruning (DPP)** fixes this: at runtime Spark evaluates the filtered dimension side first, extracts the surviving join-key values (often as a broadcast/Bloom filter), and pushes them into the fact-table scan so only matching partitions are read. This turns a full-table scan into a small subset — often an order-of-magnitude win on large fact tables.

**Key points:**
- Static pruning resolves literal partition-column filters at compile time from metadata.
- Star-schema filters sit on the dimension, so the fact partition value isn't a compile-time literal.
- DPP evaluates the dimension at runtime and pushes surviving keys into the fact scan.
- DPP prunes fact-table partitions dynamically — large I/O savings; needs broadcast/AQE support.

---

### 61. Batch ingestion patterns: full vs incremental extract

**Frequency:** High

**Question:** How do you ingest data from an operational database into a lake or warehouse, and how do you choose between full and incremental extracts?

**Answer:** Batch ingestion (the Sqoop/JDBC-connector pattern) pulls data on a schedule by running parallel range-partitioned queries against a source DB and writing partitioned files to the lake. The core decision is **full vs incremental** extract:

- **Full extract** re-reads the entire table each run — simple and self-correcting, but expensive and impractical past a few million rows.
- **Incremental extract** reads only rows changed since the last watermark, using a monotonically increasing key or an `updated_at` timestamp (Sqoop's `--incremental append`/`lastmodified`), persisting the high-water mark between runs.

To avoid hammering production, isolate reads on a replica, bound parallelism (split column, number of mappers), and land into a **staging/bronze** layer for later transformation. Watch for pitfalls: incremental extracts miss hard deletes and rows updated without touching the watermark column, and clock skew or non-unique timestamps can drop boundary rows — which is why CDC is often preferred for high-fidelity capture.

**Key points:**
- Full = simple, self-healing, but O(table) cost; incremental = watermark-based, cheap, but fragile.
- Use a monotonic id or `updated_at` high-water mark, persisted across runs.
- Partition/parallelize reads against a replica to protect the source OLTP system.
- Incremental extract misses deletes and off-watermark updates; land raw into bronze/staging.

---

### 62. Streaming ingestion: micro-batch vs continuous

**Frequency:** High

**Question:** How does micro-batch ingestion differ from continuous streaming, and how do you reliably deliver a stream into the lake?

**Answer:** Streaming ingestion continuously moves events (e.g., from Kafka) into the lake, and the engine model shapes the latency/throughput trade-off. **Micro-batch** (Spark Structured Streaming's default) buffers events into small batches every trigger interval, processing each as a tiny job — higher latency (seconds) but excellent throughput, simple exactly-once via offset checkpointing, and reuse of the batch runtime. **Continuous/record-at-a-time** (Flink, or Spark's continuous mode) processes each event as it arrives — sub-second/millisecond latency at the cost of finer-grained checkpointing complexity. Delivery to the lake needs care: writers **checkpoint the source offsets together with the committed files** so a restart resumes exactly where it left off, and they must handle the **small-files problem** by batching writes and compacting. Landing into a transactional table format (Delta/Iceberg/Hudi) gives atomic commits, so readers never see half-written data, and enables downstream incremental consumption.

**Key points:**
- Micro-batch = buffered mini-jobs, higher latency, great throughput, simple offset-checkpoint exactly-once.
- Continuous = per-event, ms latency, more complex checkpointing.
- Commit source offsets atomically with output files so restarts resume correctly.
- Write to Delta/Iceberg/Hudi for atomic commits; batch/compact to avoid small files.

---

### 63. Idempotent and exactly-once sinks

**Frequency:** High

**Question:** How do you achieve exactly-once (or effectively-once) delivery at a pipeline's sink, given that retries and failures are inevitable?

**Answer:** Because processing can crash and replay, any at-least-once source will re-deliver records, so the sink must make duplicates harmless — the practical goal is **effectively-once**. Techniques:

- **Idempotent writes:** upsert on a deterministic business/natural key (MERGE/UPSERT), so replaying the same record overwrites rather than duplicates.
- **Deduplication:** carry a unique event id and drop already-seen ids using a state store or a dedup table (often within a time/watermark window).
- **Transactional/two-phase commit sinks:** write output and commit source offsets in one atomic transaction (Kafka transactions, Flink's `TwoPhaseCommitSinkFunction`, Delta/Iceberg atomic commits) so partial writes are never visible.

The anti-pattern is a blind append with auto-generated ids, which double-counts on every retry. Choose the cheapest guarantee that fits: idempotent upserts for keyed data, transactional commits when you need atomic multi-record visibility. Determinism matters too — non-deterministic transformations (e.g., `now()`, random ids) break replay-safety even with idempotent sinks.

**Key points:**
- Retries make at-least-once the default; design the sink so duplicates don't corrupt results.
- Idempotent upsert on a natural key is the simplest effectively-once mechanism.
- Dedup by unique event id via state/dedup table within a window.
- Transactional/2PC sinks commit data + offsets atomically; keep transformations deterministic.

---

### 64. Data contracts and schema-registry governance

**Frequency:** Medium

**Question:** What is a data contract, and how does a schema registry enforce compatibility between producers and consumers?

**Answer:** A **data contract** is an explicit, versioned agreement about the shape and semantics of data a producer emits — field names/types, nullability, units, semantic meaning, SLAs (freshness, volume), and ownership. It shifts responsibility left: producers can no longer silently break downstream jobs. A **schema registry** (e.g., Confluent Schema Registry with Avro/Protobuf/JSON Schema) operationalizes the structural part: each topic/subject has registered schema versions, and producers/consumers validate against them at serialization time. The registry enforces **compatibility modes** — *backward* (new schema reads old data: safe to drop fields / add optional ones), *forward* (old readers handle new data), and *full* (both) — rejecting incompatible changes at publish time rather than at 3 a.m. in production. Combined with CI checks, data contracts catch breaking changes in pull requests. Beyond structure, contracts also encode semantic and quality expectations that a registry alone can't, so teams pair the registry with data-quality tests and clear versioning/deprecation policies.

**Key points:**
- Data contract = versioned producer commitment: schema, semantics, SLAs, ownership.
- Schema registry stores versioned schemas and validates at (de)serialization time.
- Compatibility modes (backward/forward/full) reject breaking changes before they ship.
- Enforce in CI; pair with quality tests for semantics the registry can't capture.

---

### 65. Backfills and reprocessing without double-counting

**Frequency:** High

**Question:** How do you safely backfill or reprocess historical data without producing duplicates or double-counted metrics?

**Answer:** A backfill re-runs a pipeline over past intervals — to fix a bug, add a column, or seed a new table — and the danger is that a naive re-run appends on top of existing output, double-counting everything. The foundation is **idempotent, partition-scoped writes**: each run should be a pure function of its input partition (keyed by execution/logical date, not `now()`), and it must **overwrite that partition atomically** (`INSERT OVERWRITE`/dynamic partition overwrite, or delete-then-insert in a transactional table) rather than append. Practical strategies:

- **Partition replacement:** recompute a date range and atomically swap each partition.
- **Isolated backfill target:** write to a shadow table/branch, validate, then promote.
- **Bounded, parallel windows:** backfill in date chunks to control load and cost.

Orchestrators help when tasks are parameterized by logical date and support catchup, but only idempotency makes replays safe. Also freeze late-arriving data assumptions, keep transformations deterministic, and reset any stored watermarks/offsets so streaming state doesn't skip the reprocessed range.

**Key points:**
- Naive append on re-run double-counts; make writes idempotent and partition-scoped.
- Key logic on logical/execution date and atomically overwrite the target partition.
- Use partition swap, shadow tables, or bounded windows; validate before promoting.
- Reset watermarks/offsets and keep transformations deterministic for replay safety.

---

### 66. Incremental processing with MERGE INTO / CDC upserts

**Frequency:** High

**Question:** How does `MERGE INTO` power incremental upserts, and how would you merge a CDC change stream into a lakehouse table?

**Answer:** `MERGE INTO` is a single atomic statement that reconciles a target table with a source of changes: `WHEN MATCHED THEN UPDATE/DELETE ... WHEN NOT MATCHED THEN INSERT`. It's the workhorse of incremental processing on lakehouse tables (Delta/Iceberg/Hudi), turning an immutable columnar store into something you can upsert into transactionally. For **CDC**, the source is a stream of inserts/updates/deletes (from Debezium/Kafka Connect) keyed by the primary key; you merge each micro-batch so the target mirrors the OLTP source's current state. Key correctness details: **deduplicate the batch per key first** (a key may change several times per batch — keep the latest by CDC sequence/LSN, not arrival order), handle deletes with `WHEN MATCHED ... THEN DELETE`, and use an **ordering/sequence column** so an out-of-order older change never overwrites a newer one. Watch performance: MERGE rewrites touched files, so partition and Z-order/cluster on the merge keys, and compact regularly to keep write amplification down.

**Key points:**
- `MERGE INTO` = atomic matched-update/delete + not-matched-insert; enables lakehouse upserts.
- CDC merge: key on PK, apply inserts/updates/deletes to mirror source state.
- Dedup per key by CDC sequence/LSN before merging; use an ordering column to avoid stale overwrites.
- MERGE rewrites files — partition/cluster on merge keys and compact to limit write amplification.

---

### 67. Orchestration beyond Airflow: asset-based scheduling

**Frequency:** Medium

**Question:** How do Dagster and Prefect differ from Airflow, and what is data-aware (asset-based) scheduling?

**Answer:** Airflow models pipelines as **task DAGs** — you orchestrate *operations* and their ordering, but the framework doesn't inherently know what data each task produces. **Dagster** introduces **software-defined assets**: you declare the *data objects* (tables, files, ML models) and their dependencies, and Dagster derives the execution graph and can schedule on **data awareness** — rematerialize an asset when its upstreams change or become stale, rather than only on a cron. This makes lineage, freshness policies, partitioning, and data-quality checks first-class, and improves local testability and typed IO. **Prefect** focuses on a lighter, Pythonic, dynamic model: flows and tasks are ordinary functions with retries, caching, and runtime-dynamic DAGs (no rigid pre-declared graph), which suits imperative and parameter-heavy workflows. Rule of thumb: choose Airflow for mature, task-centric batch scheduling; Dagster when you want an asset/lineage-centric platform with strong data awareness; Prefect when you value dynamic, code-first flows with minimal ceremony.

**Key points:**
- Airflow = task-DAG orchestration; the engine is unaware of produced data.
- Dagster = software-defined assets; schedule by data freshness/staleness with built-in lineage.
- Prefect = dynamic, Pythonic flows with retries/caching and runtime-generated DAGs.
- Asset-based scheduling rematerializes outputs when upstream data changes, not just on cron.

---

### 68. Pipeline testing and data-quality frameworks

**Frequency:** Medium

**Question:** How do you test data pipelines, and how do frameworks like Great Expectations and dbt tests fit in?

**Answer:** Data pipelines fail in two ways — the **code** is wrong, or the **data** is wrong — so testing spans both. For code, unit-test transformation logic on small fixtures and run integration tests on sample datasets in CI. For data, you assert properties of the actual rows at runtime. **dbt tests** cover the common cases declaratively in YAML — `not_null`, `unique`, `accepted_values`, `relationships` (referential integrity) — plus custom SQL/singular tests, running as part of the build so a failing test can halt the pipeline. **Great Expectations** offers a richer, reusable suite of "expectations" (distributions, ranges, row-count deltas, regex, freshness), validation *checkpoints*, profiling to auto-suggest expectations, and human-readable **Data Docs**. Best practice is to run these as **gates** at layer boundaries (bronze→silver→gold) so bad data fails fast instead of propagating, distinguishing hard failures (block) from soft warnings (alert), and to monitor trends for anomaly detection rather than only pass/fail thresholds.

**Key points:**
- Test both code (unit/integration on fixtures) and data (runtime assertions on rows).
- dbt tests = declarative not_null/unique/accepted_values/relationships plus custom SQL tests.
- Great Expectations = rich reusable expectation suites, checkpoints, profiling, Data Docs.
- Run checks as gates between layers; separate blocking failures from warnings; track trends.

---

### 69. dbt and ELT transformation modeling

**Frequency:** High

**Question:** How does dbt structure ELT transformations, and what do models, refs, and incremental materializations give you?

**Answer:** dbt is the **T in ELT**: you load raw data into the warehouse first, then transform it in-warehouse with SQL. A **model** is a `SELECT` statement in a `.sql` file that dbt turns into a table or view; you never write DDL. Models reference each other with **`ref()`**, from which dbt builds the dependency DAG, resolves environment-correct table names, and determines run order — this is what makes lineage and incremental builds automatic. **Materializations** control how a model is persisted: *view* (cheap, always fresh), *table* (recomputed each run), *ephemeral* (inlined CTE), and **incremental** (only process new/changed rows via an `is_incremental()` filter, appending or merging with a unique key so you don't rebuild huge tables every run). dbt adds Jinja macros for reuse, `sources` and freshness checks, tests and docs, and snapshots for SCD Type 2. The result is version-controlled, testable, modular analytics engineering with layered models (staging → intermediate → marts).

**Key points:**
- dbt = ELT's transform layer: SQL `SELECT` models compiled to tables/views, no manual DDL.
- `ref()` builds the DAG, handles run order, and enables lineage across staging→marts.
- Materializations: view, table, ephemeral, and incremental (`is_incremental()` + unique key merge).
- Adds macros, sources/freshness, tests, docs, and SCD2 snapshots for testable analytics engineering.

---

### 70. Late-arriving dimensions and out-of-order handling

**Frequency:** Medium

**Question:** How do you handle late-arriving dimensions and out-of-order events in a batch pipeline?

**Answer:** In dimensional pipelines, a fact often arrives before its dimension row exists — a **late-arriving dimension** (or "early-arriving fact"). If you drop or inner-join it, you silently lose facts. The standard fix is the **inferred/placeholder dimension member**: insert a stub dimension row keyed by the natural key with a surrogate key and unknown attributes, join the fact to it immediately, then **update the stub in place when the real dimension arrives** so the surrogate key (and all facts pointing at it) stay valid. For **SCD Type 2** dimensions, late-arriving *changes* are harder: a change with an old effective date must be inserted into the correct historical slot, splitting/adjusting the validity windows of surrounding versions and restating any facts that should point at the corrected version. More broadly, out-of-order handling in batch relies on **event-time (not processing-time) partitioning**, reprocessing recent windows on a lookback so late data lands in its true partition, and idempotent overwrites so re-running those partitions doesn't double-count.

**Key points:**
- Late-arriving dimension: insert an inferred/placeholder member so facts aren't lost, then backfill attributes.
- Keep the surrogate key stable when the real dimension arrives so existing facts stay valid.
- SCD2 late changes must slot into the right historical window and restate affected facts.
- Partition by event time, reprocess a lookback window, and use idempotent overwrites for out-of-order data.

---

### 71. Spark memory management

**Frequency:** High

**Question:** How does Spark manage executor and driver memory, and how do you diagnose and prevent OutOfMemory errors?

**Answer:** Each executor JVM heap (`spark.executor.memory`) is split by the **unified memory manager** into a shared region (`spark.memory.fraction`, default 0.6) that dynamically balances **execution** memory (shuffles, joins, sorts, aggregations) against **storage** memory (cached blocks), plus a smaller **user** region for your objects. Under pressure execution can evict cached storage but not vice versa. On top of the heap, `spark.executor.memoryOverhead` covers off-heap/native needs (Netty buffers, Python workers), and off-heap execution can be enabled via `spark.memory.offHeap`. When execution memory runs out Spark **spills to disk** instead of failing, but heavy spill wrecks performance. OOMs usually come from the **driver** (large `collect()` or broadcast) or executors (huge/skewed partitions, wide aggregations, too many cores per executor). Fixes: raise partition count to shrink per-task data, increase overhead, avoid `collect`, cap broadcast size, and reduce executor cores so concurrent tasks share memory better.

**Key points:**
- Unified manager splits heap into a shared execution+storage region (0.6) plus a user region; overhead is separate off-heap.
- Execution evicts storage under pressure; spill to disk avoids failure but is slow.
- Driver OOM from collect/broadcast; executor OOM from big/skewed partitions.
- Fix via more partitions, higher overhead, fewer cores per executor, avoiding collect.

---

### 72. Shuffle internals and tuning

**Frequency:** High

**Question:** What happens during a Spark shuffle, and how do you tune it?

**Answer:** A wide transformation writes each map task's output into buckets partitioned by the target reducer, sorts and spills them to local disk as **shuffle files**, and reduce tasks then fetch their slice from every mapper over the network — an all-to-all transfer that is Spark's most expensive operation. The number of reduce partitions is `spark.sql.shuffle.partitions` (default 200); too few makes partitions large and spill-heavy, too many creates tiny tasks and scheduling overhead — AQE's coalesce helps by merging small post-shuffle partitions at runtime. The **external shuffle service** serves shuffle files from a long-lived daemon (on the NodeManager) so executors can be removed without losing their shuffle output — essential for dynamic allocation. Tuning levers: right-size partitions (~100–200 MB each), enable AQE, raise `spark.reducer.maxSizeInFlight` and shuffle buffers for big shuffles, prefer `reduceByKey`/broadcast joins to cut shuffle volume, and watch spill metrics in the UI.

**Key points:**
- Shuffle = map-side partition + sort + spill to local files, then all-to-all network fetch by reducers.
- `spark.sql.shuffle.partitions` (default 200): too few → spill, too many → overhead; AQE coalesces.
- External shuffle service decouples shuffle files from executor lifetime → enables dynamic allocation.
- Cut shuffle with reduceByKey/broadcast joins; monitor spill and fetch metrics.

---

### 73. Speculative execution and straggler mitigation

**Frequency:** Medium

**Question:** What is speculative execution in Spark, and when does it help or hurt?

**Answer:** A **straggler** is a task that runs far slower than its peers — from a slow/failing disk, a noisy neighbor, an overloaded node, or uneven data. Because a stage finishes only when its slowest task does, one straggler stretches wall-clock. **Speculative execution** (`spark.speculation`) has the driver watch task durations and, when a task runs much longer than the median of completed tasks in the stage (`spark.speculation.multiplier`, after `spark.speculation.quantile` have finished), launch a **duplicate copy** on another node; whichever finishes first wins and the other is killed. This masks *hardware/environmental* slowness at the cost of extra resources. Crucially, speculation does **not** fix **data skew** — a duplicate of a task processing a huge partition is equally slow, so you address skew with salting/AQE instead. Avoid speculation for non-idempotent tasks (e.g., writes to external systems without atomic commit), where a duplicate could double-write.

**Key points:**
- Straggler = abnormally slow task; a stage waits for its slowest task.
- Speculation launches a duplicate of slow tasks; first to finish wins, the other is killed.
- Good for hardware/environment slowness; useless for data skew (fix with salting/AQE).
- Beware non-idempotent side effects; it also costs extra cluster resources.

---

### 74. Dynamic resource allocation in Spark

**Frequency:** Medium

**Question:** How does Spark's dynamic resource allocation work, and what does it require?

**Answer:** With **dynamic allocation** (`spark.dynamicAllocation.enabled`) Spark adjusts the number of executors to the workload instead of holding a fixed set for the app's whole lifetime. When tasks queue up beyond a backlog timeout it **requests more executors** (growing exponentially), up to `maxExecutors`; when executors sit idle past `executorIdleTimeout` it **releases them** back to the cluster manager (YARN/K8s), down to `minExecutors`. This improves multi-tenant cluster utilization and cuts cost for bursty or idle-heavy jobs (e.g., a long notebook session). The catch is **shuffle data**: an executor holds shuffle files that later stages need, so removing it would force recomputation — hence dynamic allocation traditionally requires the **external shuffle service** (or, on Kubernetes, shuffle tracking / persistent volumes / graceful decommissioning to preserve or migrate shuffle blocks). Cached data on a removed executor is likewise lost, so tune `cachedExecutorIdleTimeout` to protect executors holding cache.

**Key points:**
- Scales executors up on task backlog and down on idle, between min and max.
- Improves cluster utilization and cost for bursty/interactive workloads.
- Requires external shuffle service (or K8s shuffle tracking) so removing executors doesn't lose shuffle files.
- Removed executors lose cached blocks; guard with cachedExecutorIdleTimeout.

---

### 75. Small-file compaction jobs and optimal file sizing

**Frequency:** High

**Question:** How do you design a compaction job for small files, and what target file size should you aim for?

**Answer:** Streaming ingestion and heavily-partitioned writes produce many tiny files, which inflate metadata, slow listing, and create one small task per file — killing scan throughput. A **compaction (bin-packing) job** periodically rewrites many small files into fewer large ones per partition: read the partition, `repartition`/`coalesce` to the desired file count, and rewrite. Aim for files roughly **128 MB–1 GB** — commonly ~128–256 MB to match HDFS block size and Parquet row-group behavior and keep tasks well-sized, larger (512 MB–1 GB) for pure scan workloads. Compute the target file count as `total_partition_bytes / target_size`. Lakehouse formats automate this: Delta's `OPTIMIZE` (with `ZORDER`) and auto-compaction, Iceberg's `rewrite_data_files`, Hudi clustering/compaction — all performing atomic, snapshot-isolated rewrites so readers aren't disrupted. Balance frequency against cost: compacting too often wastes I/O, too rarely leaves the small-file penalty in place.

**Key points:**
- Small files → metadata bloat, slow listing, one tiny task per file.
- Compaction bin-packs many small files into fewer large ones per partition via rewrite.
- Target ~128 MB–1 GB (often 128–256 MB); file_count = total_bytes / target_size.
- Delta OPTIMIZE/ZORDER, Iceberg rewrite_data_files, Hudi clustering do atomic compaction.

---

### 76. External caching and acceleration layers

**Frequency:** Medium

**Question:** What problem does a layer like Alluxio solve, and when would you add one to a big-data stack?

**Answer:** Separating compute from storage (Spark/Presto over S3/HDFS) means every query pays remote-read latency and, on cloud object stores, per-request and egress costs, plus throttling on hot prefixes. **Alluxio** (and similar storage caches) insert a **distributed caching tier** between compute and the underlying store: hot data is cached in the memory/SSD of the compute nodes and served at near-local latency, while Alluxio presents a **unified namespace** over heterogeneous back-ends (S3, HDFS, GCS). It shines for **repeated reads** of the same datasets — interactive BI, iterative ML, multiple jobs sharing tables — and for restoring **data locality** when compute is disaggregated. Note it caches data across the cluster, unlike Spark's in-process `persist()`, which lives only inside one application's executors; Alluxio is cross-application and survives job restarts. Trade-offs: added infrastructure, memory/SSD cost, and cache consistency/eviction management, so it earns its place only when read amplification is high.

**Key points:**
- Adds a distributed cache tier between compute and object/remote storage for near-local reads.
- Cuts remote-read latency, request/egress cost, and hot-prefix throttling; unifies namespaces.
- Best for repeated/interactive/iterative reads and disaggregated compute (locality).
- Cross-application and persistent, unlike per-app persist(); costs infra plus consistency management.

---

### 77. Cloud cost optimization

**Frequency:** High

**Question:** How do you optimize the cost of big-data workloads in the cloud?

**Answer:** The big levers are compute pricing, elasticity, and storage tiering. Run interruptible work on **spot/preemptible instances** (up to ~70–90% cheaper) — safe for **executors/worker nodes** because Spark recomputes lost tasks, but keep the **driver/master and shuffle service on on-demand** to avoid whole-job failure; mix instance types and configure a fallback to on-demand. **Autoscale** clusters (dynamic allocation, managed autoscaling) so you pay only for capacity in use, and terminate idle clusters. On storage, use **tiering/lifecycle policies** (S3 Standard → Infrequent Access → Glacier) to move cold data down automatically, compact small files to cut request counts, and use **columnar formats + compression + partition pruning** so queries scan less — in per-scan engines like BigQuery/Athena, bytes scanned *is* the bill. Also right-size instances, prefer transient job clusters over always-on ones, and monitor with cost tags and budgets to attribute spend.

**Key points:**
- Spot/preemptible for workers (Spark re-runs tasks); keep driver/master + shuffle on on-demand.
- Autoscale and auto-terminate idle clusters; right-size and use transient job clusters.
- Storage lifecycle tiering (Standard → IA → Glacier); compact small files to cut request counts.
- Columnar + compression + partition pruning reduces bytes scanned = direct savings in Athena/BigQuery.

---

### 78. Serverless big data

**Frequency:** Medium

**Question:** What are the elasticity trade-offs of serverless big-data platforms like EMR Serverless, Databricks, or BigQuery?

**Answer:** Serverless platforms remove cluster provisioning: you submit a job or query and the platform allocates capacity on demand, scales it automatically, and bills by **resource-seconds or bytes/slots consumed** rather than for idle cluster time. **EMR Serverless** and **Databricks serverless (SQL/jobs)** spin executors up and down per job; **BigQuery** runs fully managed with on-demand (bytes-scanned) pricing or reserved **slots** (capacity units) for predictable cost. The upside is zero idle cost, fast startup, and no cluster ops — ideal for spiky, unpredictable, or intermittent workloads. Trade-offs: less control over instance types/tuning, potential **cold-start** latency, harder cost predictability for heavy steady workloads (where a reserved/committed cluster or slot reservation is cheaper), noisy-neighbor variance on shared pools, and possible feature/library limits. Rule of thumb: serverless for bursty and dev/ad-hoc work; provisioned/reserved for large, continuous, predictable pipelines.

**Key points:**
- No provisioning; auto-scales and bills per resource-second / bytes / slots, not idle time.
- Zero idle cost, fast start, no ops — great for spiky, intermittent, ad-hoc work.
- Trade-offs: less tuning control, cold starts, weaker cost predictability at steady high load.
- Steady heavy pipelines are usually cheaper on reserved capacity/slots or provisioned clusters.

---

### 79. Benchmarking and profiling big-data jobs

**Frequency:** Medium

**Question:** How do you find the bottleneck in a slow Spark job?

**Answer:** Start with the **Spark UI**. The **stages/timeline** view shows which stage dominates and whether tasks are balanced; a stage where one task's duration and input/shuffle-read dwarf the median means **skew**, while uniformly slow tasks point to under-parallelism or resource limits. Check **shuffle read/write and spill** metrics (memory and disk spill = pressure — add partitions/memory), **GC time** (high = memory pressure or too little heap), and the **event timeline** to see whether time goes to compute, scheduler delay, or task deserialization. The **SQL tab** shows the physical plan, per-operator row counts, and where a scan reads too much (missing pruning) or a join isn't broadcast. Classify the bottleneck as I/O, shuffle, CPU/serialization, GC/memory, or scheduling, then act accordingly. For repeatable benchmarks, fix data and config, warm caches consistently, run multiple trials, and change one variable at a time.

**Key points:**
- Spark UI first: the stage timeline reveals the dominant stage and skew (one outsized task).
- Watch shuffle read/write, spill, GC time, and scheduler delay to localize the bottleneck class.
- SQL tab shows the physical plan, per-operator rows, missing pruning, or non-broadcast joins.
- Benchmark rigorously: fix inputs/config, run multiple trials, change one variable at a time.

---

### 80. Choosing a partitioning strategy for object storage

**Frequency:** High

**Question:** How do you choose partition columns for a dataset on object storage, and what is over-partitioning?

**Answer:** Physical partitioning writes data into directory layouts like `.../date=2026-08-12/region=us/` so engines can **prune** whole partitions from a query's predicate without scanning them. Pick columns that (a) appear frequently in query **filters** and (b) have **moderate cardinality**. **Date/time** is the canonical choice for time-series data. The trap is **over-partitioning**: choosing a high-cardinality column (user_id, timestamp to the second) or nesting many columns explodes the number of directories, each holding a few tiny files — reviving the small-file problem, bloating metadata, and making listing/planning slow. Under-partitioning leaves partitions too big to prune effectively. Aim for partitions in the ~hundreds-of-MB-to-GB range and reasonable directory counts; for high-cardinality filtering use **bucketing** or lakehouse **data-skipping/Z-ordering/clustering** (Iceberg hidden partitioning, Delta Z-order) instead of a partition column. Validate against real query patterns and watch files-per-partition.

**Key points:**
- Partition by columns common in filters with moderate cardinality; date/time is canonical.
- Partitioning enables partition pruning → less data scanned.
- Over-partitioning (high cardinality / too many columns) → tiny files, metadata bloat, slow planning.
- Use bucketing or Z-order/data-skipping/hidden partitioning for high-cardinality filters.

---

### 81. LSM-tree storage engines

**Frequency:** High

**Question:** How does an LSM-tree work, and why is it the storage model of choice for write-heavy NoSQL engines?

**Answer:** A **Log-Structured Merge-tree** turns random writes into sequential ones. Every write first appends to a **write-ahead log** (for durability) and then updates an in-memory sorted structure, the **memtable**. When the memtable fills, it is flushed as an immutable, sorted **SSTable** file on disk; writes never modify existing files, so they stay fast and sequential. Over time many SSTables accumulate, so a background **compaction** process merges them, discarding overwritten values and tombstones. Reads must check the memtable plus potentially several SSTables, so engines add **Bloom filters** (to skip SSTables that can't contain a key) and sparse block indexes. The core trade-off is **write amplification vs. read amplification**: leveled compaction gives tight read/space bounds but rewrites data more; size-tiered compaction is cheaper to write but bloats space and reads. This write-optimized design underpins Cassandra, HBase, RocksDB, and LevelDB.

**Key points:**
- WAL + in-memory memtable → flushed as immutable sorted SSTables; writes are sequential appends.
- Compaction merges SSTables, dropping overwrites and tombstones.
- Reads check memtable + SSTables; Bloom filters and block indexes cut read cost.
- Core trade-off: leveled (read/space optimized) vs. size-tiered (write optimized) compaction.

---

### 82. HBase internals: regions, splits, and hotspotting

**Frequency:** Medium

**Question:** How does HBase distribute data across regions, and how do row-key design and compaction affect performance?

**Answer:** HBase stores a table as a sorted map partitioned into **regions**, each owning a contiguous **row-key range**. Regions are served by **RegionServers**; the **HMaster** handles assignment and balancing, and metadata lives in the `hbase:meta` table (found via ZooKeeper). Because rows are physically sorted by key, a monotonically increasing key (timestamps, sequential IDs) sends every write to the **last region on one server** — the classic **hotspotting** problem. Mitigations: **salting** (prefix a hash bucket), **key hashing**, or field reversal to spread writes. When a region grows past a threshold it undergoes a **region split** into two daughter regions, which may then be rebalanced across servers. Internally each region uses an LSM engine: writes hit the WAL and MemStore, flush to **HFiles**, and a **minor compaction** merges small HFiles while a **major compaction** rewrites all files per column family, physically dropping deleted cells and expired versions. Major compactions are I/O-heavy, so they are usually scheduled off-peak.

**Key points:**
- Table = sorted rows split into range-based regions served by RegionServers; ZooKeeper + meta locate them.
- Sequential row keys cause hotspotting; fix with salting, hashing, or key reversal.
- Regions auto-split when large, then rebalance across the cluster.
- Minor compaction merges HFiles; major compaction rewrites all files and purges deletes/old versions (I/O-heavy).

---

### 83. Cassandra data modeling

**Frequency:** High

**Question:** How do you model data in Cassandra, and what is the difference between partition keys and clustering keys?

**Answer:** Cassandra modeling is **query-first**: you enumerate your read queries, then design a table per query so each read hits a single partition — there are no efficient joins or ad-hoc filters. The **primary key** has two parts. The **partition key** (first component, possibly composite) is hashed to decide which node(s) own the row; all rows sharing it live together and are the unit of distribution and single-partition reads. The **clustering keys** (remaining components) define the **sort order within a partition**, enabling efficient range scans and `ORDER BY`. This drives deliberate **denormalization**: the same data is written into multiple tables shaped for different queries. Good partition keys give **high cardinality and even distribution** while keeping partitions bounded — a too-coarse key (e.g., a single day) creates unbounded "hot" partitions, while a too-fine key prevents range queries. You avoid `ALLOW FILTERING` and cross-partition scans, accepting write-side duplication to guarantee predictable, low-latency reads.

**Key points:**
- Model per query; one query = one table = ideally one partition read (no joins).
- Partition key → placement/distribution; clustering keys → sort order and range scans within a partition.
- Denormalize deliberately: duplicate data across query-shaped tables.
- Choose partition keys for even distribution and bounded size; avoid ALLOW FILTERING and unbounded hot partitions.

---

### 84. Real-time OLAP engine internals

**Frequency:** High

**Question:** How do real-time OLAP engines like Druid, Pinot, and ClickHouse achieve sub-second analytical queries?

**Answer:** These engines are **columnar** and store data in immutable, self-contained **segments** (Druid/Pinot) or **parts** (ClickHouse) that are partitioned by time and heavily indexed. Because each column is stored separately and compressed (dictionary, run-length, delta), a query scans only the columns it touches. Druid and Pinot support **ingestion-time pre-aggregation (rollup)**, collapsing raw events into aggregated rows at defined granularities so many dashboards read pre-computed results. They add rich indexing — **bitmap/inverted indexes** on dimensions for fast filtering, plus sorted/range indexes — and a scatter-gather query layer that fans out to segment servers and merges partial aggregates. ClickHouse instead relies on the **MergeTree** family: data is sorted by a **primary/sorting key** with a sparse index and skipping indexes, and background **merges** combine parts (optionally aggregating via `AggregatingMergeTree`). All three separate **real-time ingestion** (queryable immediately from memory/fresh segments) from **historical** optimized storage, giving both freshness and speed.

**Key points:**
- Columnar, compressed, immutable time-partitioned segments/parts scanned column-by-column.
- Druid/Pinot: ingestion-time rollup pre-aggregation + bitmap/inverted indexes; scatter-gather querying.
- ClickHouse: MergeTree sorted primary key, sparse + skipping indexes, background merges.
- Separate real-time (fresh, in-memory) from historical (optimized) tiers for freshness plus speed.

---

### 85. Elasticsearch for search and analytics at scale

**Frequency:** High

**Question:** How does Elasticsearch use the inverted index and sharding to support search and aggregations at scale?

**Answer:** Elasticsearch (on Lucene) indexes documents into an **inverted index**: for each analyzed term it stores a posting list of the documents containing it, making full-text search and boolean/phrase queries fast. An index is split into **primary shards** (each a self-contained Lucene index) plus **replica shards** for HA and read throughput; shard count is largely fixed at creation, so sizing matters. Writes go to a primary then replicate; new docs land in an in-memory buffer flushed to immutable **segments** on **refresh** (near-real-time, ~1s), which is why ES is not immediately consistent. Segments are periodically merged. Search is **scatter-gather**: the coordinating node queries every shard and merges results. For **analytics**, aggregations run on **doc values** (a columnar, on-disk structure) rather than the inverted index, enabling fast group-by, histograms, and metrics. Scaling pitfalls include **deep pagination** (use `search_after`), oversharding, and high-cardinality aggregations that pressure heap.

**Key points:**
- Inverted index (term → posting list) powers full-text search; doc values (columnar) power aggregations.
- Index = primary shards (fixed count) + replicas; writes replicate, reads scatter-gather across shards.
- Near-real-time: docs visible after refresh (~1s) as immutable, later-merged segments.
- Watch oversharding, deep pagination (use search_after), and high-cardinality aggregations.

---

### 86. Large-scale graph processing

**Frequency:** Medium

**Question:** How does the Pregel/GraphX vertex-centric model process massive graphs, and how does it differ from a graph database?

**Answer:** Large-scale graph algorithms (PageRank, shortest paths, connected components) fit poorly on MapReduce because they iterate over the whole graph repeatedly. **Pregel** introduced a **vertex-centric, "think like a vertex"** model built on **Bulk Synchronous Parallel (BSP)** supersteps: in each superstep every active vertex receives messages from the previous step, updates its state, and sends messages along its edges; a global barrier synchronizes supersteps, and the job ends when all vertices **vote to halt**. This maps naturally to distributed execution — vertices are partitioned across workers and only messages cross the network. **GraphX** (Spark) expresses the same idea over its RDDs via the `Pregel` API and `aggregateMessages`, unifying graph and data-parallel processing. This differs from a **graph database** (e.g., Neo4j): databases optimize **low-latency traversals and transactional OLTP queries** over stored, indexed relationships, whereas Pregel/GraphX are **batch analytical** engines for whole-graph iterative computation.

**Key points:**
- Iterative graph algorithms need repeated full-graph passes — awkward on MapReduce.
- Pregel = vertex-centric BSP: supersteps of receive → compute → send, barrier-synced, ending when all vote to halt.
- Vertices partitioned across workers; only messages traverse the network. GraphX brings this to Spark.
- Pregel/GraphX = batch whole-graph analytics; graph DBs = low-latency transactional traversals.

---

### 87. Vector databases and ANN search

**Frequency:** High

**Question:** How do vector databases perform embedding similarity search at scale, and how do HNSW and IVF indexes work?

**Answer:** Vector databases store high-dimensional **embeddings** and answer **nearest-neighbor** queries by similarity (cosine/dot/L2). Exact search is O(N) per query and infeasible at billions of vectors, so they use **Approximate Nearest Neighbor (ANN)** indexes that trade a little recall for large speedups. **HNSW** (Hierarchical Navigable Small World) builds a multi-layer proximity graph: search starts at a sparse top layer and greedily descends, giving logarithmic-ish query time with high recall, at the cost of high memory and build time (tuned via `M` and `efConstruction/efSearch`). **IVF** (Inverted File) instead **clusters** vectors (k-means) into cells and, at query time, probes only the `nprobe` nearest cells — cheaper memory, tunable recall/speed — and is usually combined with **Product Quantization (PQ)** to compress vectors for memory-bound, billion-scale sets. Production systems add **metadata filtering** (hybrid queries), sharding, and often combine dense vector scores with keyword/BM25 scores for hybrid search.

**Key points:**
- Exact NN is O(N); ANN indexes trade recall for speed at scale.
- HNSW: layered navigable graph, high recall and speed, high memory; tune M/ef.
- IVF: cluster into cells, probe nprobe nearest; combine with PQ compression for billion-scale.
- Production adds metadata filtering, sharding, and hybrid (vector + keyword/BM25) search.

---

### 88. Choosing a NoSQL data model

**Frequency:** High

**Question:** How do you choose among key-value, wide-column, and document databases, and what are the trade-offs?

**Answer:** Match the **data model to the access pattern**. **Key-value** stores (Redis, DynamoDB in its simplest form) map an opaque key to a blob — fastest and simplest, ideal for caches, sessions, and lookups by known key, but they can't query by value. **Wide-column** stores (Cassandra, HBase) use a partition key plus sparse, sorted columns; they excel at **massive write throughput and range scans within a partition** (time series, event logs, feeds) but demand rigid query-first modeling with no joins. **Document** stores (MongoDB) hold self-describing JSON/BSON with **secondary indexes and rich queries on any field**, fitting evolving schemas and aggregate-oriented entities (catalogs, user profiles), at some cost to write throughput and cross-document consistency. Cross-cutting factors: **consistency model** (CP vs AP, tunable quorums), **query flexibility** vs raw performance, and whether relationships are better served by a **graph** DB. The honest default is often to reach for these only when a relational database's scale or flexibility limits actually bite.

**Key points:**
- Key-value: fastest, lookup-by-key only — caches, sessions.
- Wide-column: partition + sorted columns, huge write throughput and in-partition ranges; strict query-first modeling.
- Document: rich per-field queries and flexible schema; weaker cross-document consistency/throughput.
- Choose on access pattern, consistency (CP/AP), and query flexibility; don't abandon relational without a real reason.

---

### 89. Secondary indexes in distributed stores

**Frequency:** Medium

**Question:** What is the difference between local and global secondary indexes in distributed data stores, and what are their consistency and performance costs?

**Answer:** A **secondary index** lets you query by a non-primary attribute, but in a partitioned store the index must itself be distributed, and there are two strategies. A **local (partitioned) index** stores index entries alongside the data on the **same node/partition** (e.g., Cassandra secondary indexes, DynamoDB LSIs). Writes stay cheap and local, but a query on the indexed field usually has no partition key, so it must **scatter-gather across all partitions** — fine for a few nodes, expensive at scale. A **global index** is a separately partitioned structure keyed by the **indexed value** (e.g., DynamoDB GSIs, Cassandra's SASI/materialized-view patterns): a lookup goes straight to the one partition holding matches, so **reads are efficient**, but every write must **update a remote index partition**, adding write amplification, cross-partition coordination, and typically **eventual (asynchronous) consistency** between base table and index. The general rule: local = cheap writes/expensive reads; global = efficient reads/costly, often eventually-consistent writes.

**Key points:**
- Secondary index = query by non-primary attribute; must be distributed in a partitioned store.
- Local index: co-located with data, cheap writes, but reads scatter-gather all partitions.
- Global index: partitioned by indexed value, efficient targeted reads, but writes hit a remote partition.
- Global indexes add write amplification and are usually eventually consistent with the base table.

---

### 90. Read/write paths, tombstones, and compaction pitfalls

**Frequency:** Medium

**Question:** How do deletes work in LSM-based stores via tombstones, and what compaction pitfalls do they cause?

**Answer:** In an LSM store, data is immutable, so a **delete cannot remove anything in place** — it writes a **tombstone**, a marker recording that a key (or range) is deleted, which shadows all older values. Tombstones are only physically purged during **compaction**, and not immediately: they must survive at least `gc_grace_seconds` so the delete can propagate to every replica (otherwise a stale replica could resurrect the data — **zombie rows**). The read path must merge the memtable and all relevant SSTables and honor tombstones, so accumulated tombstones **slow reads dramatically**: a query scanning a partition full of tombstones (e.g., a queue-like workload of insert-then-delete) reads and discards huge amounts of data and can time out. Other pitfalls: **range tombstones** and TTL expirations bloat SSTables; **large partitions** amplify compaction I/O; and unbalanced size-tiered compaction causes **space amplification**. Mitigations include avoiding delete-heavy/queue patterns, using TTLs thoughtfully, tuning compaction strategy, and monitoring tombstone-per-read.

**Key points:**
- Deletes write tombstones (markers), not in-place removals; older values are shadowed.
- Tombstones purged only by compaction after gc_grace to avoid zombie/resurrected rows.
- Tombstone buildup (queue-like insert/delete patterns) severely slows reads and can cause timeouts.
- Watch large partitions, range/TTL tombstones, and space amplification; tune compaction and avoid delete-heavy designs.

---

### 91. Feature stores and offline/online parity

**Frequency:** High

**Question:** What problem does a feature store solve, and how do you guarantee offline/online parity and point-in-time correctness?

**Answer:** A feature store centralizes feature computation, storage, and serving so training and inference share one definition, avoiding the classic bug where a feature is engineered one way in a batch training job and subtly differently in the online request path (training/serving skew). It has two layers: an **offline store** (columnar warehouse/lake) holding full history for training, and a low-latency **online store** (Redis, DynamoDB, Cassandra) holding the latest value per entity for serving. Parity comes from defining the transformation once and materializing to both sides, or reusing the same code. **Point-in-time correctness** is the subtle part: when building a training set you must join each label to feature values *as of* the event timestamp, never leaking future data — an as-of/point-in-time join on event time. Feature stores also manage freshness, backfills, versioning, and reuse across teams.

**Key points:**
- Solves training/serving skew by sharing one feature definition across offline and online stores.
- Offline store = history for training; online store = low-latency latest values for inference.
- Point-in-time (as-of) joins prevent label leakage from future feature values.
- Adds freshness SLAs, backfills, versioning, and cross-team reuse.

---

### 92. Data versioning and reproducibility

**Frequency:** Medium

**Question:** How do you version datasets so experiments and pipelines are reproducible, and what do Delta/Iceberg time travel, lakeFS, and DVC each address?

**Answer:** Reproducibility means you can re-run a pipeline or retrain a model against the exact same data it originally saw. Three approaches operate at different layers:

- **Table-format time travel** (Delta, Iceberg, Hudi): each commit produces an immutable snapshot, so you can query `AS OF` a version or timestamp and pin training to a snapshot ID. This is table-level and native to the lakehouse.
- **lakeFS**: git-like branching, commits, and merges over the *whole* object store, giving atomic multi-table versioning and isolated branches for experiments or CI on real data.
- **DVC**: git-adjacent versioning for files/artifacts (datasets, models), storing large blobs in remote storage while git tracks lightweight pointers — good for ML repos.

Combine data versions with code (git SHA) and environment (container/lockfile) versions; only pinning all three makes a run truly reproducible.

**Key points:**
- Delta/Iceberg time travel = immutable snapshots, query AS OF version/timestamp, table-level.
- lakeFS = git-like branch/commit/merge across the entire object store, atomic multi-table.
- DVC = versions large data/model artifacts with git-tracked pointers plus remote storage.
- True reproducibility pins data + code SHA + environment together.

---

### 93. Data mesh and domain-oriented ownership

**Frequency:** Medium

**Question:** What is data mesh, and what are its core principles compared to a centralized data platform?

**Answer:** Data mesh is a socio-technical response to the bottleneck of a single central data team that owns all pipelines but understands none of the domains. It decentralizes ownership around four principles: **domain-oriented ownership** (the team that produces the data — orders, payments — owns its analytical data end to end); **data as a product** (each dataset has an owner, SLAs, documentation, discoverability, and quality guarantees, treated like an API for consumers); **self-serve data platform** (a central platform team provides paved-road infrastructure — storage, pipelines, catalog, governance tooling — so domains ship without reinventing plumbing); and **federated computational governance** (global standards for interoperability, security, and PII are defined centrally but enforced automatically/as code across domains). The trade-off: it improves scalability and domain alignment but demands organizational maturity, and done poorly it degenerates into inconsistent silos with duplicated effort.

**Key points:**
- Four principles: domain ownership, data as a product, self-serve platform, federated governance.
- Shifts pipeline ownership from a central team to the domains that know the data.
- Data products have owners, SLAs, docs, and quality — consumed like APIs.
- Powerful for scale but needs org maturity; poorly done it becomes inconsistent silos.

---

### 94. Data catalog, discovery, and metadata management

**Frequency:** Medium

**Question:** Beyond a searchable table list, what makes a modern data catalog effective, and how is metadata collected and kept current?

**Answer:** A catalog is only useful if metadata is trustworthy and automatically fresh, so effectiveness hinges on how it ingests and links metadata rather than on the search box. Modern catalogs (DataHub, Amundsen, OpenMetadata, Unity Catalog) collect three metadata types: **technical** (schemas, partitions, formats), **operational** (freshness, row counts, last-run, popularity/query logs), and **business** (owners, descriptions, glossary terms, PII/classification tags). Metadata is harvested by **crawlers and push-based emitters** wired into ingestion, orchestration, and query engines, so it updates as pipelines run instead of via manual entry that rots. Key capabilities: **column-level lineage** for impact/root-cause analysis, **automated PII classification** and tagging, ranking discovery by popularity and certification status, and exposing everything through **APIs** so governance and access policies can consume it. Adoption fails when the catalog is a manual side-project; it succeeds when metadata generation is embedded in the platform.

**Key points:**
- Collects technical + operational + business metadata, not just table names.
- Auto-harvested via crawlers/push emitters in pipelines — stays fresh, not manually curated.
- Column-level lineage, automated PII classification, popularity/certification ranking.
- API-first so policies and tools consume metadata; manual-only catalogs rot and fail adoption.

---

### 95. Encryption, column masking, and tokenization

**Frequency:** Medium

**Question:** How do encryption at rest/in transit, column-level masking, and tokenization differ, and when do you use each?

**Answer:** These are layered controls, not substitutes. **Encryption in transit** (TLS between clients, brokers, and storage) protects data on the wire; **encryption at rest** (KMS-managed keys, ideally envelope encryption with per-dataset data keys) protects stored bytes and enables **crypto-shredding** — deleting a key to render data unrecoverable for erasure requests. Both are coarse: anyone with query access still sees plaintext values, so you add finer controls. **Column/dynamic masking** applies at query time based on the caller's role — an analyst sees `****1234` while a fraud team sees the full number — leaving stored data intact and policy-driven. **Tokenization** replaces a sensitive value with a surrogate token, keeping the real value in a separate secured vault; unlike encryption it's typically irreversible without vault lookup and can preserve format, so downstream joins and analytics work on tokens without exposing PII. Use encryption everywhere as the baseline, masking for role-based read control, tokenization when raw values must never live in the analytics estate.

**Key points:**
- In-transit (TLS) + at-rest (KMS/envelope) encryption are the coarse baseline; enables crypto-shredding.
- Encryption alone leaves plaintext to anyone with query access — add finer controls.
- Column/dynamic masking = query-time, role-based redaction; stored data unchanged.
- Tokenization = surrogate tokens with values in a separate vault; format-preserving, joinable without exposing PII.

---

### 96. Multi-tenancy and data isolation

**Frequency:** Medium

**Question:** How do you provide isolation between tenants on a shared big-data platform across storage, compute, and access?

**Answer:** Multi-tenancy trades cost efficiency against blast radius, so you isolate on three axes. **Storage isolation**: separate buckets/databases/schemas per tenant (or at least partition/prefix by tenant), with bucket policies and table ACLs scoped so a tenant can never read another's paths; strong-isolation needs may demand separate accounts/keys. **Compute isolation**: prevent one tenant's heavy job from starving others via resource queues (YARN/Kubernetes namespaces, warehouse-per-tenant, or separate Spark pools), quotas, and rate limits — the "noisy neighbor" problem. **Access isolation**: a centralized authorization layer (Ranger, Lake Formation, Unity Catalog) enforcing row/column-level policies keyed to tenant identity, plus per-tenant encryption keys so even platform operators can't cross boundaries. The spectrum runs from fully shared (cheapest, weakest isolation) to fully siloed per-tenant infra (strongest, most expensive); regulated tenants often justify the siloed end. Audit logging per tenant proves isolation held.

**Key points:**
- Isolate on three axes: storage (buckets/schemas/ACLs), compute (queues/quotas), access (policy engine).
- Compute quotas prevent the noisy-neighbor problem of one tenant starving others.
- Centralized authz (Ranger/Lake Formation/Unity) with per-tenant keys and row/column policies.
- Spectrum: shared (cheap, weak) to siloed per-tenant infra (strong, costly); pick per compliance needs.

---

### 97. Disaster recovery for lakes and warehouses

**Frequency:** Medium

**Question:** How do you design disaster recovery and backup for a data lake or warehouse, and what do RPO and RTO drive?

**Answer:** **RPO** (recovery point objective) is how much data loss you tolerate; **RTO** (recovery time objective) is how long recovery may take — together they dictate cost and architecture. For object-store lakes, durability is high but you still guard against corruption and accidental/malicious deletion with **cross-region replication**, **versioning**, and immutability/object-lock (WORM) so a bad job or ransomware can't erase history. Lakehouse table formats add safety via snapshot **time travel** and retention, letting you roll a table back to a good version. Warehouses use snapshots, point-in-time restore, and cross-region replicas. Match tier to criticality: a hot standby in a second region gives low RTO at high cost; periodic snapshots to cheaper storage give higher RTO but low cost. Critically, **test restores regularly** — untested backups are not backups — and separate DR credentials/accounts so the same breach can't destroy both primary and backup.

**Key points:**
- RPO = tolerable data loss; RTO = tolerable downtime — they set cost and design.
- Lakes: cross-region replication + versioning + object-lock/WORM against corruption and deletion.
- Table-format time travel and warehouse point-in-time restore enable rollback to a good state.
- Test restores regularly; isolate DR credentials so one breach can't wipe primary and backup.

---

### 98. Data observability and SLAs

**Frequency:** Medium

**Question:** What does data observability monitor beyond pipeline job status, and how do freshness, volume, schema, and distribution checks form data SLAs?

**Answer:** Pipeline "green" (the job ran) does not mean the data is correct, so data observability monitors the data itself along several pillars: **freshness** (did the table update within its expected window — the most common failure), **volume** (row counts within normal bounds — sudden drops/spikes signal upstream breakage or duplication), **schema** (unexpected column adds/drops/type changes that silently break consumers), and **distribution** (null rates, ranges, cardinality, and value drift that indicate quality regressions or model-affecting data drift). Tools like Monte Carlo, Great Expectations, or Soda compute these and, crucially, **alert on anomalies** — often via ML-learned baselines rather than only hand-set thresholds — and tie failures to lineage for fast root-cause. Codifying expected freshness/volume/quality into **data SLAs** (with owners and error budgets, like SRE for data) turns "someone noticed the dashboard was wrong" into proactive, contract-based detection before consumers are hit.

**Key points:**
- Four pillars: freshness, volume, schema, distribution — job success alone hides bad data.
- Anomaly detection via learned baselines, not just static thresholds; alerts wired to lineage.
- Distribution monitoring catches data/quality drift that degrades models and metrics.
- Data SLAs with owners and error budgets make detection proactive and contractual.

---

### 99. Streaming joins and their challenges

**Frequency:** Medium

**Question:** How do stream-stream and stream-table joins work, and what makes them hard?

**Answer:** Joining unbounded streams is hard because you can't wait for "all" the data. A **stream-stream join** matches events from two streams — e.g., ad impressions with clicks — but a match may arrive seconds or minutes apart, so engines require a **windowed join** (join within a time bound) and must **buffer state** for the window; without a bound, state grows forever. Out-of-order and late events mean you rely on **event time and watermarks** to decide when a window can close and unmatched events emitted (or dropped). A **stream-table join** enriches each event against reference/dimension data (e.g., user profile). The subtlety is temporal correctness: the table is itself changing, so you want a **temporal/versioned join** that looks up the dimension value *as of* the event's time, not the current value, and you must keep that lookup state fresh and consistent. Both face state size, exactly-once semantics under failure, and skew as the main operational challenges.

**Key points:**
- Stream-stream needs windowed joins with buffered state; unbounded state is the core risk.
- Watermarks/event time decide when windows close and how late/out-of-order events are handled.
- Stream-table enriches events; use temporal (as-of) joins so you match the correct dimension version.
- Operational pain: state size, exactly-once under failure, and skew.

---

### 100. Design an end-to-end real-time analytics system

**Frequency:** High

**Question:** Design a real-time analytics platform (e.g., live product/user event analytics) end to end, tying together ingestion, processing, serving, and governance.

**Answer:** Start from requirements — latency target, query patterns, scale, and correctness needs — then layer the system. **Ingestion:** clients emit events to a durable log (Kafka/Kinesis) partitioned by entity key for ordering and parallelism, with a schema registry enforcing contracts. **Processing:** a stream engine (Flink/Spark Structured Streaming) does windowed aggregations, stream-table enrichment, and dedup, using event time + watermarks and checkpointing for exactly-once; write results to both an online store for low-latency serving and the lake for history. **Storage/serving:** a real-time OLAP store (Druid/Pinot/ClickHouse) serves sub-second dashboard/API queries; the lakehouse (Iceberg/Delta) holds full history for ad-hoc and ML. Rather than the dual-code Lambda architecture, prefer **Kappa** (reprocess by replaying the log) to avoid maintaining two codebases. Cross-cutting: a **feature store** feeds online ML, and governance — catalog, lineage, data-quality gates, observability SLAs (freshness/volume), encryption/masking, and multi-tenant isolation — runs across every layer. Call out trade-offs: latency vs cost, exactly-once vs throughput, and pre-aggregation vs query flexibility.

**Key points:**
- Layers: durable partitioned log → stream engine (event time, watermarks, exactly-once) → real-time OLAP + lakehouse.
- Serve low-latency from Druid/Pinot/ClickHouse; keep full history in Iceberg/Delta for ad-hoc/ML.
- Prefer Kappa (replay) over Lambda to avoid dual codebases; feature store bridges to online ML.
- Governance is cross-cutting: catalog, lineage, quality gates, observability SLAs, encryption, tenant isolation.
- Name trade-offs: latency vs cost, exactly-once vs throughput, pre-aggregation vs flexibility.
