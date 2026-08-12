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
