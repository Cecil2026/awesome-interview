# 后端面试题

100 道高频后端题，覆盖 API 设计、数据库（SQL/NoSQL）、缓存、消息、并发、安全、语言（Python/Go/Java/Node）和运维。

---

### 1. REST vs RPC vs GraphQL vs gRPC

**答案：** REST 用统一的 HTTP 动词对资源建模，非常适合公开、可缓存、面向资源的 API。RPC（JSON-RPC、gRPC）以动作/过程建模，适合内部服务对服务调用，强类型与低延迟更重要。GraphQL 暴露单一端点 + 类型化 schema，让客户端按需查询字段——非常适合移动端/聚合 BFF 层，但带来 N+1 与缓存难题。gRPC 用 HTTP/2 + protobuf 做二进制、流式、多路复用调用，是内部微服务的默认选项。

**要点：**
- REST：通过 HTTP 可缓存、弱类型、载荷冗长。
- gRPC：流式、代码生成、浏览器支持差（需要 gRPC-Web）。
- GraphQL：查询灵活、有 schema、鉴权与限流复杂。
- 按受众选：公开/第三方 = REST；内部高吞吐 = gRPC；移动端聚合 = GraphQL。

---

### 2. 幂等性：方法与 key

**答案：** 一个操作如果重复执行产生相同的可观察结果，就是幂等的。GET/PUT/DELETE 按 HTTP 契约是幂等的；POST 不是。对支付这类不安全操作，客户端发送 `Idempotency-Key` 请求头；服务器按其存储首次响应一段 TTL，并在重试时返回缓存响应。这能防御网络重试、双击和至少一次消息投递。

**要点：**
- 存储 `(key, request hash, response)`；同一 key 不同 body 时拒绝。
- TTL 通常 24 小时；持久化到 Redis 或专用表。
- 幂等 ≠ 安全：PUT 改变状态但是幂等的。
- 对 webhook、支付和队列消费者至关重要。

---

### 3. PUT vs PATCH

**答案：** PUT 替换整个资源表示；缺失字段通常被清空。PATCH 应用部分更新（JSON Merge Patch RFC 7396 或 JSON Patch RFC 6902）。当客户端发整个文档、且你想要可预期的替换语义时用 PUT。稀疏更新用 PATCH，特别是并发写者更新不相交字段时。

**要点：**
- PUT 幂等；PATCH 只有当 patch 本身幂等时才幂等。
- JSON Merge Patch：简单，无法表达数组操作或 null vs 缺失。
- JSON Patch：操作列表，更具表达力，写起来更难。
- 始终配合 ETag/If-Match 防止丢失更新。

---

### 4. API 版本化（URL/header/内容协商）

**答案：** URL 版本化（`/v1/...`）最易发现、对缓存最友好，是多数公开 API 的选择。Header 版本化（`API-Version: 2`）保持 URL 干净，但在日志中不可见、浏览器测试更难。内容协商（`Accept: application/vnd.acme.v2+json`）最 REST 但冗长。无论选哪种，错误契约和 webhook 也要版本化。

**要点：**
- 偏好加法式、向后兼容的变更；只有破坏性变更才升大版本。
- 最多维护 2 个大版本以约束支持成本。
- 公布弃用时间表并发出 `Sunset` / `Deprecation` 头。
- GraphQL 通过字段弃用避免版本号。

---

### 5. 分页：offset vs cursor

**答案：** Offset 分页（`LIMIT N OFFSET M`）简单，但大 offset 时很慢，且在并发插入下不稳定（条目在页之间漂移）。Cursor（keyset）分页用最后看到的排序键（`WHERE (created_at, id) < (?, ?) ORDER BY ... LIMIT N`），有索引时是 O(log n)，对插入也稳定。大或增长中的集合一定用 cursor 分页；小管理表用 offset 没问题。

**要点：**
- Cursor 必须编码完整排序元组以保稳定。
- 不透明的 base64 cursor 隐藏实现、便于演进。
- Offset 在无限滚动 UX 下崩溃。
- 返回 `next_cursor` 与 `has_more`；大表上避免总数统计。

---

### 6. 过滤/排序/稀疏字段集

**答案：** 把过滤语法标准化（`?status=active&created_at[gte]=...`），并文档化允许的字段与操作符——永远不要让任意 SQL 渗出。把排序字段限制在有索引的列上，防止昂贵扫描。稀疏字段集（`?fields=id,name`）减小载荷，让客户端跳过昂贵的子资源；GraphQL 天然具备。

**要点：**
- 白名单过滤/排序字段；未知字段高调拒绝。
- 上限页大小与复杂度防止滥用。
- 文档化操作符语义：等值、范围、IN、全文。
- 用预编译语句；永远不要插入过滤值。

---

### 7. 限流算法（token/leaky/sliding）

**答案：** 令牌桶允许爆发到桶大小、以稳定速率补充——最佳通用选择。漏桶以固定速率平滑输出，丢弃或排队超额。固定窗口便宜但窗口边缘允许 2 倍爆发。滑窗日志精确但耗内存；滑窗计数器以低成本近似。集中实现（Redis）做分布式执行。

**要点：**
- 返回 `429` 加 `Retry-After` 和 `X-RateLimit-*` 头。
- 按 API key、按 IP、按路由组合限制。
- Redis `INCR` + EXPIRE 或 Lua 脚本保证原子。
- 与并发限制组合以保护下游服务。

---

### 8. 认证 vs 授权；OAuth 2.0 流程

**答案：** 认证证明身份（"你是谁"）；授权决定权限（"能做什么"）。OAuth 2.0 是颁发 access token 的授权框架。Authorization Code + PKCE 是 Web 与移动应用的默认。Client Credentials 用于机对机。Device Code 用于电视/CLI。Resource Owner Password 已弃用。OIDC 在 OAuth 之上叠加身份（ID token、userinfo）。

**要点：**
- 不再使用 Implicit 流——PKCE 取代之。
- Access token 短命；refresh token 长命且可轮换。
- 每个请求都校验 `aud`、`iss`、`exp` 与签名。
- Scope 做粗权限，claim 做属性，策略引擎做细粒度。

---

### 9. JWT vs session cookie

**答案：** Session cookie 持有不透明 ID；状态在服务端，所以撤销简单。JWT 是自包含的签名声明，任何服务无需查找即可校验——对分布式系统好但过期前难撤销。第一方 Web 应用，带 Secure HttpOnly cookie 的会话更简单更安全。API 与微服务里常用短命 JWT + refresh token。

**要点：**
- JWT 缺点：体积、没黑名单难撤销、易误用 `alg=none`。
- 会话 cookie 永远设 `HttpOnly`、`Secure`、`SameSite=Lax/Strict`。
- JWT 保持短（5-15 分钟）；通过轮换的 refresh token 刷新。
- 多服务下用非对称密钥（RS256/EdDSA）验签，而非共享密钥。

---

### 10. API 网关职责

**答案：** 网关是客户端的统一入口。它处理 TLS 终止、认证（JWT/API key 校验）、限流、请求/响应变换、路由到后端服务、带断路器的重试，以及可观测性（日志/指标/追踪）。它应当薄——业务逻辑留在服务里。例子：Kong、Envoy、AWS API Gateway、Apigee。

**要点：**
- 把横切关注点从服务卸载。
- 别把领域逻辑放进网关——会成为瓶颈。
- 用服务网格（Istio/Linkerd）处理东西向；网关处理南北向。
- 配合 WAF 处理 L7 攻击。

---

### 11. HATEOAS——何时值得

**答案：** HATEOAS 在响应中嵌入下一步操作的链接，让客户端动态发现能力。实际上很少客户端消费超媒体——它们针对固定 URL 硬编码——所以开销很少划算。它在生命周期长、客户端多样的公开 API（如 PayPal），以及允许的状态转换变化多的状态机资源上有效。

**要点：**
- 当客户端/服务端独立演进且客户端通用时使用。
- 内部服务或单团队 API 跳过。
- HAL 与 JSON:API 标准化链接格式。
- 别把"REST"与"HATEOAS"混为一谈——Roy Fielding 会，业界多数不会。

---

### 12. 长任务：202+轮询 vs webhooks vs SSE

**答案：** 返回 `202 Accepted` 加任务 URL，让客户端轮询 `/jobs/{id}`——最简单也对防火墙友好。Webhooks 把结果推送到客户端注册的 URL——请求更少但要求客户端托管端点且你处理重试/签名。SSE 或 WebSocket 流式推送进度——浏览器最佳 UX。双向用 WebSocket，仅服务端到客户端用 SSE。

**要点：**
- 永远同步返回任务 ID；不要在长任务上阻塞。
- 可行时同时提供轮询与 webhooks。
- 持久化任务状态，让重试返回同样结果。
- 给出合理轮询建议（`Retry-After`）以避免猛击。

---

### 13. Webhook 设计：重试、签名、回放

**答案：** 用 HMAC-SHA256 对原始 body 加时间戳签名，作为头发送（`X-Signature`、`X-Timestamp`）。接收方校验签名，拒绝过旧时间戳（>5 分钟）防回放，并快速响应 `2xx`。非 2xx 时按指数退避重试数小时/数天，然后入 DLQ。永远带事件 ID 做幂等。

**要点：**
- 对原始 body 签名——JSON 重新序列化会破坏签名。
- 提供回放工具与密钥轮换机制（两个活跃 key）。
- 文档化投递 SLA、最大重试窗口与 IP 段。
- 让接收方用 202 + 处理队列异步确认。

---

### 14. 向后兼容

**答案：** 加法式变更是安全的：新可选字段、新端点、新枚举值（若客户端能容忍未知）。破坏性变更：删除/重命名字段、收紧校验、改类型、改默认行为、改错误码。少用 Postel 法则——对输入过宽容会在以后埋雷。带时间线和告警公布弃用策略（`Sunset` 头）。

**要点：**
- 永远不要复用字段含义——加新字段。
- 类型化 schema 用 protobuf 字段号 / GraphQL `@deprecated`。
- 在消费者与生产者之间跑契约测试（Pact）。
- 用特性开关推出，并对新旧客户端做指标对比。

---

### 15. 错误模型（HTTP 状态码 + RFC 7807）

**答案：** 正确使用 HTTP 状态码（`4xx` 客户端、`5xx` 服务端）和一致的 JSON body。RFC 7807 Problem Details 定义 `type`、`title`、`status`、`detail`、`instance` 加扩展。包含稳定的机器可读 `code` 和关联 ID。不要泄露堆栈或内部 SQL 给客户端。

**要点：**
- `400` 校验、`401` 无/坏凭证、`403` 无权限、`404` 不存在、`409` 冲突、`422` 语义。
- 始终包含 `code` 和 `request_id` 便于支持排查。
- 所有端点统一错误格式——别有雪花。
- 面向用户的 API 本地化 `title`/`detail`。

---

### 16. ACID

**答案：** 原子性：事务的写入要么全提交要么全不。一致性：事务把数据库从一个合法状态搬到另一个（约束保持）。隔离性：并发事务在某种程度上表现得像串行。持久性：已提交数据在崩溃后仍存在（通常通过 WAL fsync）。Postgres 这类 RDBMS 四样都提供；NoSQL 常为规模放宽一项或多项。

**要点：**
- "C"最模糊——讲的是应用级不变量，不仅是数据库的。
- 持久性取决于 `fsync` 与存储；云盘可能撒谎。
- 隔离级别（下一题）决定你看到的异常。
- WAL 是 A 与 D 背后的机制。

---

### 17. 隔离级别与异常

**答案：** Read Uncommitted：能看到脏读。Read Committed（Postgres 默认）：无脏读，但可能不可重复读和幻读。Repeatable Read（MySQL 默认）：无不可重复读；Postgres 的 RR 也通过快照防止幻读。Serializable：表现得完全串行——Postgres 用 SSI，会中止冲突事务。隔离越高 = 中止/重试越多。

**要点：**
- 异常：脏读、不可重复读、幻读、写偏斜、丢失更新。
- Postgres SSI 抓住 Repeatable Read 漏掉的写偏斜。
- 在应用代码中始终处理序列化失败重试。
- 热行用显式 `SELECT ... FOR UPDATE`，而不是抬高隔离。

---

### 18. 索引：B-tree vs hash；覆盖

**答案：** B-tree 是主力——有序、支持等值、范围、前缀和 ORDER BY。Hash 索引只支持等值，很少值得（Postgres 有，但 10 之后才崩溃安全）。覆盖索引包含查询所需的全部列（通过 INCLUDE 或复合），引擎只读索引、跳过堆。复合索引顺序重要：最左前缀规则。

**要点：**
- 索引选择性：低基数列很少受益。
- 部分索引用于过滤子集（`WHERE deleted_at IS NULL`）。
- 全文/数组/JSON/地理用 GIN/GiST。
- 每个索引都让写变慢——加之前要度量。

---

### 19. EXPLAIN

**答案：** `EXPLAIN` 显示规划器选择的计划；`EXPLAIN ANALYZE` 实际执行并报告时间和行数。从里向外读：先叶节点。注意大表上的 Seq Scan、高行数的 Nested Loop、估算与实际行数的大差异（统计陈旧），以及 `Rows Removed by Filter`。用索引、重写或 `ANALYZE` 修复。

**要点：**
- `BUFFERS` 揭示缓存命中 vs 磁盘读。
- 批量加载后用 `ANALYZE` 更新统计。
- 当心 `LIMIT` 计划看起来便宜但选错索引。
- 用 auto_explain / pg_stat_statements 抓生产回归。

---

### 20. N+1 查询问题

**答案：** 取 N 个父记录列表然后发 N 个子查询——朴素 ORM 和懒加载常见。症状：吞吐随列表大小骤降。修复：预加载（`JOIN` 或带批量的 `IN (...)`)、GraphQL 中的 DataLoader 风格批量、显式预取（Django 的 `select_related`/`prefetch_related`、EF 的 `Include`）。在开发期观察 ORM 生成的 SQL。

**要点：**
- 在测试中始终记录 SQL，并对热路径断言查询计数。
- 1:1 或小扇出用 `JOIN`；大扇出用 `IN` 批量。
- GraphQL resolver 几乎总是需要 DataLoader。
- N+1 是 ORM 重栈中慢 API 的最常见原因。

---

### 21. Join；何时反规范化

**答案：** 规范化 schema 保持数据一致、写便宜。Join 没问题，直到它有问题——当读延迟占主导、join 跨越分区/分片，或某个热读模式重复执行 5 路 join 时反规范化。物化视图与计算列是中间地带。NoSQL 默认反规范化，并按查询设计。

**要点：**
- 内连 vs 左连 vs 全外连——按语义选，不要凭性能直觉。
- 反规范化需要同步策略（触发器、CDC、双写）。
- 读多 → 反规范化；写多 → 规范化。
- 周期刷新的物化视图常是最佳折中。

---

### 22. 范式 1NF-BCNF

**答案：** 1NF：列原子、无重复组。2NF：1NF + 无对复合键的部分依赖。3NF：2NF + 无传递依赖（非键 → 非键）。BCNF：每个决定因素都是候选键——比 3NF 更严。实际应用瞄准 3NF，按性能选择性反规范化。

**要点：**
- 规范化最小化更新异常和存储重复。
- 过度规范化导致过多 join。
- 分析中的星型/雪花 schema 故意反规范化。
- JSON 列是稀疏属性的实用逃生口。

---

### 23. 分片（范围/哈希/地理）

**答案：** 范围分片按 key 区间拆分——范围扫描容易但单调 key 有热点风险。哈希分片均匀分布——无范围扫描、再平衡更难。地理分片按区域路由获得延迟和合规。选择分片 key 兼顾均匀分布和查询本地性；跨片 join/事务贵。

**要点：**
- 分片 key 难改——按未来 3-5 年设计。
- 一致性哈希在节点变化时最小化再平衡。
- 范围方案预拆分避免初始热点。
- 避免分布式事务；可能时按租户路由。

---

### 24. 只读副本与复制延迟

**答案：** 副本服务读流量；主处理写。异步复制是常态——副本落后毫秒到秒级。从副本读自己的写返回陈旧数据，所以把关键读路由到主，或用"读自己写"token（LSN/GTID）等副本追上。重写或副本上的长查询会让延迟暴涨。

**要点：**
- 监控延迟（`pg_stat_replication`、Seconds_Behind_Master）。
- 同步复制以延迟换故障切换零数据丢失。
- 注意序列/identity 在故障切换中的行为。
- 逻辑复制支持选择性表复制和版本升级。

---

### 25. 连接池

**答案：** 数据库连接昂贵（每后端的内存、TCP+TLS 握手）。池复用一个固定小集合。规模：每应用实例从 `核数 * 2` 起步；总连接数不能超数据库的 max_connections。Postgres 标准是 PgBouncer 事务池模式。当心：事务池破坏会话特性（预编译语句、`SET`)。

**要点：**
- 应用池 ≠ 代理池；分层。
- 太多连接 = 上下文切换风暴和数据库 OOM。
- 空闲超时防止泄漏占住宝贵槽位。
- Serverless 函数需要代理（RDS Proxy、PgBouncer）合并连接。

---

### 26. 死锁

**答案：** 两个事务持有对方需要的锁，形成环。数据库检测并中止其中一个（`deadlock_detected`）。通过始终以一致顺序获取锁、保持事务短、安全时用低隔离、给外键加索引（让子插入不取更宽锁）避免。应用代码中始终对死锁错误重试。

**要点：**
- Postgres 同时记录两个查询——仔细读日志。
- 热行争用常伪装成死锁。
- `SELECT ... FOR UPDATE SKIP LOCKED` 非常适合队列式模式。
- 重排操作或按排序键批量打破环。

---

### 27. CTE 与递归查询

**答案：** Common Table Expression 给子查询命名以复用与可读。Postgres 12 之前 CTE 是优化栏栅；从 12 起默认内联，除非 `MATERIALIZED`。递归 CTE 走树/图（如组织层级、评论线程）。当心无限循环——用深度限制。

**要点：**
- 递归 CTE：`WITH RECURSIVE t AS (base UNION ALL recursive ref)`。
- 多次复用重子查询时用 `MATERIALIZED`。
- 窗口函数常更高效地替代 CTE。
- 不要在巨图上深递归——用图数据库。

---

### 28. 窗口函数

**答案：** 窗口函数在一帧行上计算而不折叠它们（不像 GROUP BY）。`ROW_NUMBER()`、`RANK()`、`LAG/LEAD`、`SUM() OVER (PARTITION BY ...)` 覆盖大多数需求——运行总计、组内 top-N、同期对比。它们替代痛苦的自连接和相关子查询。

**要点：**
- `PARTITION BY` 分组；`ORDER BY` 排序；`ROWS/RANGE` 设帧。
- 组内 top-N：`ROW_NUMBER() OVER (PARTITION BY g ORDER BY x)` + 过滤。
- 在 WHERE/GROUP BY 之后但在 ORDER BY/LIMIT 之前计算。
- 通常比子查询更对索引友好。

---

### 29. Postgres 的 JSON 列

**答案：** `jsonb` 存储带索引（GIN）和操作符（`->`、`->>`、`@>`）的二进制 JSON。用于稀疏、schema 灵活的属性（标签、设置、审计载荷）。别用作主建模工具——会失去约束和 join 效率。`json`（文本）很少更优；`jsonb` 去重 key 并支持更多操作符。

**要点：**
- 包含查询用 `jsonb_path_ops` 上的 GIN 索引。
- 抽取字段的表达式索引用于等值查找。
- `jsonb_set`、`||` 做部分更新——整个值会被重写。
- 用 `CHECK (jsonb_typeof(col->'x') = 'number')` 验证形状。

---

### 30. 分区

**答案：** 按范围（日期）、列表（地区）或哈希把逻辑表拆为物理块。好处：通过分区裁剪加速查询、便宜的大批删除（`DROP PARTITION` vs `DELETE`）、按分区 vacuum/analyze。代价：规划开销，难以容易地跨分区有全局唯一约束。

**要点：**
- 时序日志/事件是经典用例。
- Postgres 声明式分区（10+）取代继承技巧。
- 选与多数查询 WHERE 子句匹配的分区键。
- 自动化分区创建（pg_partman）——手动易出错。

---

### 31. 在线 schema 迁移

**答案：** 长 DDL（加带默认的列、加索引、改类型）可能锁表并阻塞写。用在线工具（pg_repack、pt-online-schema-change、gh-ost）或拆成安全步骤：加可空列 → 分批回填 → 加 NOT NULL → 删旧。Postgres 支持 `CREATE INDEX CONCURRENTLY`，从 11 起 `ADD COLUMN ... DEFAULT` 是元数据操作。

**要点：**
- 永远不要在生产忙表上盲跑 `ALTER TABLE`。
- 回填要分批 + 限速。
- 扩展/收缩模式：在迁移前部署能处理两种形态的代码。
- 让迁移与上一应用版本前向兼容。

---

### 32. 数据库约束 vs 应用校验

**答案：** 两个都用。数据库约束（NOT NULL、FK、UNIQUE、CHECK）是最后防线，能防御任何接触数据库的应用中的 bug。应用校验给出友好错误信息、校验数据库做不了的业务规则（如跨资源不变量），并避免往返。永远不要只靠应用校验——数据库不信任你，也不应该信任你。

**要点：**
- 即便 ORM 出错，FK 约束也防止孤儿行。
- UNIQUE 抓住应用级检查漏掉的竞态。
- 把校验逻辑放在模型层附近；端点共享。
- 约束违反应映射到清晰的 API 错误码。

---

### 33. 软删除 vs 硬删除

**答案：** 软删除设 `deleted_at` 而非移除；硬删除真正移除。软删除保留审计与撤销，但污染查询（处处 `WHERE deleted_at IS NULL`）、破坏唯一约束（email 唯一但软删用户存在），并让表增长。硬删更简单但失历史——若需要历史，配合审计日志。

**要点：**
- 部分唯一索引绕开软删唯一问题。
- GDPR 删除权通常强制硬删或匿名化。
- 默认视图/作用域隐藏已删行防泄漏。
- 后台作业在保留窗口后清理软删行。

---

### 34. 乐观 vs 悲观锁

**答案：** 乐观：读时带版本/etag，写时 `WHERE version = ?`；若 0 行更新则冲突，重试。最适合低争用工作负载。悲观：`SELECT ... FOR UPDATE` 锁住行直到提交。最适合高争用或重试昂贵时。乐观扩展更好；悲观在争用下延迟更可预测。

**要点：**
- 乐观永远带整数/UUID 版本列。
- HTTP If-Match/ETag 是 API 层的乐观锁。
- 悲观锁跨用户思考时间持有 = 灾难。
- `SKIP LOCKED` 启用无争用的工作队列模式。

---

### 35. UUID vs 自增主键

**答案：** 自增整型紧凑、有序、对缓存友好——插入和 join 最快。UUID 全局唯一、可客户端生成、不泄露计数，但随机 UUID 造成 B-tree 碎片和索引膨胀。UUIDv7（时间有序）以插入本地性获得 UUID 多数好处。分布式系统与公开 API 用 UUID；内部用整型没问题。

**要点：**
- 永远不要在 URL 中暴露顺序 ID（枚举攻击）。
- UUIDv4 随机 ≠ 插入有序 → 写放大。
- UUIDv7 / ULID 是现代默认。
- Postgres `uuid` 类型 16 字节 vs `text` 36——始终用原生类型。

---

### 36. CAP 与 PACELC

**答案：** CAP 说在网络分区下必须以一致性换可用性。PACELC 扩展：即便没分区，也要以延迟换一致性（PA/EL vs PC/EC）。多数分布式数据库是 AP（Dynamo、Cassandra）或 CP（Spanner、etcd、ZooKeeper）。真实系统可调：Cassandra 让你按查询挑一致性。

**要点：**
- CAP 讲分区期间行为，不是稳态。
- CAP 的"一致性"= 线性化，强于 SQL 的"C"。
- 延迟 vs 一致性折衷（PACELC 的 LC）是日常那个。
- 不要只凭 CAP 选数据库——可运维性更重要。

---

### 37. 文档存储：嵌入 vs 引用

**答案：** 当子数据有界、随父访问、一起变化（如订单中的订单行）时嵌入。当子被共享、无界或有独立生命周期（如帖子引用的用户）时引用。嵌入优化读但让文档膨胀；引用需要 join/查找。

**要点：**
- MongoDB 16MB 文档限制强制无界增长用引用。
- 嵌入子文档避免 join 但更新时重复。
- 混合：嵌入摘要 + 详情用引用。
- 按主导查询模式设计。

---

### 38. 宽列分区键

**答案：** Cassandra/DynamoDB 中，分区键决定哪个节点拥有数据并限制一起扫描的行。选高基数（均匀分布）且匹配查询模式的 key。聚簇/排序键在分区内排序行以做范围扫描。热分区杀性能——避免顺序或低基数 key。

**要点：**
- "查询第一，建模第二"——按访问模式设计表。
- 复合分区键分散负载（`(tenant_id, day)`）。
- 分区大小上限（Cassandra ~100MB，DDB 项目集合 10GB）。
- 次要索引昂贵，常被反规范化掉。

---

### 39. 键值存储（Redis、DynamoDB）

**答案：** KV 存储以查询灵活性换原始速度和水平扩展。Redis 是内存型、每分片单线程，带丰富数据类型（字符串、哈希、列表、集合、有序集合、流）。DynamoDB 是托管、多 AZ、任何规模下个位数毫秒，查询模型有限（PK 或 PK+SK）。两者都惩罚临时查询——围绕访问模式建模。

**要点：**
- Redis 用于缓存、会话、排行榜、限流、队列。
- DynamoDB 用于想要零运维 + 可预测延迟的 serverless 应用。
- 注意 DDB 热 key 与 GSI 传播延迟。
- Redis 集群模式分片 key；多 key 操作需要 hash tag。

---

### 40. 搜索引擎作为非主数据库

**答案：** Elasticsearch/OpenSearch 等擅长全文、faceted、分析查询——而不是作真相源。它们最终一致、更易丢数据、无事务。把它们作为由 CDC 或队列从你主数据库喂养的次级索引。

**要点：**
- 永远别把 ES 作写入的唯一副本。
- 重建索引策略：通过别名切换做零停机映射变更。
- 按语言调 analyzer；默认词干粗糙。
- 注意分片规模（10-50GB/分片）；分片太多杀集群性能。

---

### 41. 时序数据库（InfluxDB/Timescale）

**答案：** 时序工作负载有追加密集写、按时间有序读、保留策略和降采样。专用存储（InfluxDB、Timescale、Prometheus）压缩时间戳和游程编码值以巨幅节省空间，并提供连续聚合。Timescale 是 Postgres 扩展——想要 SQL 时很好。

**要点：**
- 高写吞吐 + 便宜的按时间范围扫描。
- 连续聚合 / 降采样降存储。
- 内置 TTL/保留策略。
- 数百万点 Postgres 单独就够；数十亿点用专用。

---

### 42. 图数据库（Neo4j）

**答案：** 图数据库把节点和边作为一等公民——遍历是 O(邻居数) 而非 join 重的 O(表大小)。用于欺诈检测、推荐、社交图、知识图和依赖分析。Cypher / Gremlin / SPARQL 是查询语言。

**要点：**
- 关系主导查询时（深度 > 3 跳）最好。
- 简单查找别用——关系型更快更简单。
- 原生图存储对遍历速度重要。
- AWS Neptune、JanusGraph、ArangoDB、Memgraph 是替代。

---

### 43. 最终一致性模式

**答案：** 副本在写停止后"最终"收敛。让它可用的模式：读自己写（路由到主或会话亲和）、单调读（粘性副本）、有界陈旧（副本在 X 秒内）、因果一致（矢量时钟）。重要时在 UI 暴露陈旧。

**要点：**
- 钱/库存避免使用，除非协调。
- 补偿动作处理无法防止的冲突。
- 最后写入获胜简单但丢数据；CRDT 或合并函数更安全。
- 在 staging 故意延迟副本测试。

---

### 44. cache-aside vs read-through vs write-through vs write-behind

**答案：** Cache-aside：应用读缓存，miss 时从数据库加载并填充——最常见。Read-through：缓存在 miss 时自行从数据库加载。Write-through：写同步到缓存再到数据库——一致但慢。Write-behind：缓存快速 ack，异步持久到数据库——快但崩溃有数据丢失风险。无理由就选 cache-aside。

**要点：**
- Cache-aside 把失效负担放到应用。
- Write-through 以写成本消除缓存/数据库偏差。
- Write-behind 需要耐久队列才能安全。
- 即便有显式失效也总要设 TTL。

---

### 45. 缓存失效策略

**答案：** Phil Karlton 说：两件难事之一。选项：TTL（简单，允许陈旧）、写时显式失效（正确，管道重）、key 中的 version/etag（部署 bump 版本）、pub-sub 扇出（Redis keyspace 通知）。安全起见 TTL + 显式失效组合。

**要点：**
- miss 时雪崩保护（锁、single-flight）。
- 负缓存——短暂记住"未找到"。
- 按查询形状的 key：`user:42:posts:page:1`。
- 软 TTL + 后台刷新让热 key 保持温。

---

### 46. Redis 数据类型与用例

**答案：** 字符串：计数器、JSON blob、简单缓存。哈希：带部分更新的对象字段。列表：队列、最近 N 项 feed。集合：标签、去重。有序集合：排行榜、时间范围查询、限流器。流：带消费者组的追加日志（Kafka-lite）。HyperLogLog：基数估算。Bitmap：存在/活动。

**要点：**
- 生产避免 `KEYS *`——用 `SCAN`。
- 流水线和 Lua 脚本做原子多操作批量。
- 每 key TTL；淘汰策略（`allkeys-lru` 是合理默认）。
- RedisJSON/Search 模块加文档和全文功能。

---

### 47. Redis 持久化：RDB vs AOF

**答案：** RDB 周期快照——紧凑、重启快，但丢上次快照后的写。AOF 记录每条命令——按 fsync 间隔耐久（默认每秒），重启慢、文件更大（后台重写压缩）。生产通常都跑：AOF 做耐久，RDB 做快速恢复与备份。

**要点：**
- `appendfsync everysec` 是默认甜点。
- 快照 fork 进程——内存写时复制飙升。
- 纯缓存完全禁用持久化。
- 副本 + AOF + RDB 是耐久三剑客。

---

### 48. 缓存雪崩缓解

**答案：** 热 key 过期时数百请求同时 miss、扑向数据库。缓解：single-flight（只一个请求取，其他等）、概率早过期（TTL 前以上升概率刷新）、临过期的后台刷新、缓存层请求合并、重建上短 TTL 的锁。

**要点：**
- 别让大扇出 key 在同一瞬间同步过期。
- TTL 加抖动避免同步过期。
- "Stale-while-revalidate"模式在重建时服务陈旧。
- 事件中同时监控缓存命中率与源压力。

---

### 49. CDN 缓存 API 响应

**答案：** CDN 在用户附近缓存 GET 响应——对公开、可缓存数据（汇率、目录、配置）巨大收益。用 `Cache-Control: public, max-age=N`、`s-maxage` 给共享缓存、`Vary` 给内容协商。用 surrogate key / 缓存标签做定向清除。无 per-user key 时不要缓存用户特定响应。

**要点：**
- ETag + `If-None-Match` 廉价返回 304 做重验证。
- Stale-while-revalidate / stale-if-error 提升韧性。
- 写时清除（事件驱动）加 TTL 上限。
- 没合适分段时避免 CDN 缓存敏感个性化数据。

---

### 50. 缓存中的 Bloom 过滤器

**答案：** Bloom 过滤器是概率集合：以小位图告诉你"肯定不在集合中"或"可能在集合中"，假阳性率可调。非常适合跳过已知不在的 key 的缓存/数据库查找（如"这用户名占了吗？"、"这 URL 爬过吗？"）。假阳性浪费一次查找；假阴性从不发生。

**要点：**
- 空间高效——每元素几位，不存完整 key。
- 不能删除（用计数 Bloom 或 cuckoo 过滤器）。
- Cassandra/RocksDB 内部用 Bloom 做 SSTable 查找。
- 按预期 n 和可接受假阳性 p 设大小。

---

### 51. 线程 vs 进程 vs 协程 vs 异步

**答案：** 线程在一个进程内共享内存、由内核切换——细粒度但有开销和同步陷阱。进程隔离、更安全、更贵。协程（goroutine、虚拟线程、asyncio 任务）是用户态、便宜（KB 级栈），协作调度或跑在小线程池上。异步是事件循环驱动、对 I/O 密集闪光；线程/进程做 CPU 密集并行。

**要点：**
- CPU 密集 → 进程（Python）或线程（Go/Java）。
- I/O 密集 → 异步/协程做最大并发。
- 异步混阻塞调用 = 静默停顿。
- 选与工作负载匹配的运行时。

---

### 52. Python GIL

**答案：** 全局解释器锁确保任意时刻只有一个线程执行 Python 字节码，简化 CPython 内存管理但阻止线程级 CPU 并行。I/O 释放 GIL，所以线程仍助 I/O 密集代码。CPU 密集用 `multiprocessing`、原生扩展（NumPy、Cython 释放 GIL）或 PEP 703 无 GIL Python（3.13+）。

**要点：**
- 异步 + 线程 + 进程是互补工具。
- C 扩展可在数值计算中释放 GIL。
- PEP 703（无 GIL）是 opt-in 且实验性。
- GIL 不防止应用逻辑中的竞态。

---

### 53. Goroutine 与 M:N 调度器

**答案：** Goroutine 是 Go 运行时管理的用户态任务，M:N 多路复用到 OS 线程（M=机器，N=goroutine）。它们以 2KB 栈起步，动态增长。调度器是带抢占的工作窃取。一个程序可廉价生成百万 goroutine。Channel 与 `select` 提供 CSP 风格协调。

**要点：**
- `go func()` 是任何主流语言中最便宜的并发原语。
- 别共享内存；通过 channel 通信（惯用法）。
- `GOMAXPROCS` 默认 `runtime.NumCPU()`。
- 遗忘的 goroutine = 泄漏；总要有退出路径（context）。

---

### 54. 异步 I/O 事件循环陷阱

**答案：** 阻塞循环（CPU 工作、同步 I/O、sleep）让所有任务停顿。症状：尾延迟上升、健康检查超时。在异步路径禁阻塞调用，或推到线程/进程池。避免无界 `gather`——用信号量。取消需小心：任务可能持有资源。

**要点：**
- 用事件循环监控做剖析（如 `aiodebug`、`uvloop` 统计）。
- 用 `asyncio.to_thread` / `run_in_executor` 包装同步库。
- 始终对 await 设超时。
- 测试取消路径——它们常有 bug。

---

### 55. 竞态 vs 死锁 vs 活锁

**答案：** 竞态：结果取决于并发访问时序（如对共享状态的 check-then-act）。死锁：线程在环中互相阻塞，无前进。活锁：线程不断响应彼此变状态但无前进。饥饿：线程被持久剥夺资源。用锁/原子、锁顺序、带抖动退避。

**要点：**
- 竞态常在生产负载下才可见。
- 检测：`-race`（Go）、TSan（C++）、`pytest-asyncio` 严格模式。
- 用压力 + 模糊测试并发路径。
- 优先不可变 / 消息传递而非共享可变状态。

---

### 56. 互斥锁 vs 信号量 vs 条件变量

**答案：** 互斥锁：互斥，同时只一个持有者。信号量：计数许可，允许 N 个并发持有者——用于资源池或限流。条件变量：让线程等待一个谓词为真，与互斥锁配对（始终在循环中检查谓词——伪唤醒）。RWMutex 分离读写做读多路径。

**要点：**
- 始终释放互斥锁（defer/finally）——异常安全。
- 实时系统当心优先级反转。
- 自旋锁仅用于多核上极短临界区。
- Go 中 channel 常更干净地替代显式锁。

---

### 57. 无锁 / CAS

**答案：** Compare-and-swap 在值匹配预期时原子更新——无锁数据结构的基础。避免锁争用但极难正确写（ABA 问题、内存序）。用库提供的原子（`atomic.Int64`、`AtomicReference`）或证明过的结构（并发 map）；极端谨慎下才自滚。

**要点：**
- 无锁 ≠ 无等待；某些线程仍可停顿。
- 弱架构上内存模型规则（acquire/release/seq_cst）重要。
- 高争用下 CAS 可能比锁慢（重试）。
- 优化前剖析——锁通常没问题。

---

### 58. 背压

**答案：** 背压是接收方向发送方发"慢点"信号——防止队列堆积和 OOM 必备。机制：阻塞/丢的有界队列、HTTP 429/503、反应式流（Request(n)）、TCP 窗口、带 `await` 的异步迭代。无背压时，快生产者引起级联失败。

**要点：**
- 永远给队列上界——无界队列是伪装的 bug。
- 过载时丢弃、限速或泄洪。
- 端到端传播背压（网关 → 服务 → 数据库）。
- 度量队列深度并在负载下早拒。

---

### 59. Kafka vs RabbitMQ vs SQS

**答案：** Kafka：耐久日志、可回放、高吞吐、分区有序、消费者组——做流式与事件溯源。RabbitMQ：带丰富路由（交换机、队列）的经典 broker、按消息 ack、吞吐较低、对工作队列与 RPC 更易。SQS：托管、简单、至少一次、默认无序（有 FIFO 队列），完美适合 AWS 原生 worker。

**要点：**
- Kafka = 日志；Rabbit/SQS = 队列。心智模型不同。
- Kafka 按时间/大小保留；Rabbit/SQS ack 时丢。
- 吞吐：Kafka >> Rabbit > SQS 标准。
- 运维：SQS 零，Rabbit 中，Kafka 重（或通过 MSK/Confluent 托管）。

---

### 60. Exactly-once vs at-least-once vs at-most-once

**答案：** 至多一次：发完不管；消息可能丢。至少一次：重试到 ack；可能重复。Exactly-once：每个效果发生一次——只能通过幂等消费者或事务写入端到端实现（Kafka 内 EOS）。实际上至少一次 + 幂等消费者是现实目标。

**要点：**
- "Exactly-once 投递"多是营销；"exactly-once 处理"是真实的。
- 幂等键 + 去重表是你构建 exactly-once 的方式。
- Kafka 事务覆盖 Kafka 到 Kafka；桥接外部系统需要 outbox/2PC 模式。
- 始终设计消费者处理重复。

---

### 61. Kafka 分区/消费者组/offset

**答案：** Topic 有 N 个分区，每个是有序日志。生产者按 key 路由（同 key → 同分区 → 有序）。消费者组成员分担分区——每分区最多一个消费者。Offset 跟踪每分区读位置，提交回 Kafka。通过加分区扩展消费者。

**要点：**
- 分区数限制每组消费者并行度。
- 再平衡暂停消费——协作式再平衡最小化干扰。
- 在处理后提交 offset，不是之前（至少一次）。
- key 选择 = 排序边界 AND 负载分布。

---

### 62. Outbox 模式

**答案：** 避免数据库与消息 broker 之间的双写不一致。在更新业务状态的同一事务中插入 `outbox` 表。一个独立中继（轮询器或 Debezium 这类 CDC）把 outbox 行发布到 broker 并标记已发送。保证与数据库提交对齐的至少一次投递。

**要点：**
- 消除"数据库提交但消息丢"/"消息发了但数据库回滚"。
- 与幂等消费者配对（重复是预期的）。
- 基于 CDC 的中继比轮询扩展更好。
- 加 `processed_at` 或归档保持 outbox 小。

---

### 63. Saga 模式

**答案：** 在不用分布式事务的情况下协调跨服务的长业务事务。每步是局部事务；失败触发补偿事务回退之前步骤。编舞：服务对彼此事件反应。编排：中心协调器驱动步骤。编排更易推理与监控。

**要点：**
- 补偿必须提前设计且幂等。
- 用于跨服务流如订机票 + 订酒店 + 扣卡。
- 用状态机可视化状态。
- Temporal、Camunda、AWS Step Functions 是常见编排器。

---

### 64. 2PC——为什么被避免

**答案：** 两阶段提交：协调器问所有参与者准备，然后按投票提交或中止。提供原子分布式事务但若协调器在协议中失败会无限阻塞、不扩展、耦合服务可用性。现代系统偏好 saga + outbox 做跨服务一致性。

**要点：**
- 3PC 减阻塞但加复杂度并假设同步。
- 跨异构数据库/broker，2PC 支持很差。
- 可能时单数据库事务仍是正确答案。
- Saga 以 ACID 换可用的最终一致性。

---

### 65. 幂等消费者

**答案：** 消费者必须无论处理一次还是多次都产生相同效果。通过以下实现：按消息 ID 去重（存已见 ID 带 TTL）、幂等操作（UPSERT、条件更新），或事务性 outbox + 已处理 ID 表。关键因为至少一次投递意味着重复是常态。

**要点：**
- 始终包含来自生产者的稳定消息 ID。
- 去重窗口必须覆盖最大重试时限。
- 副作用（邮件、支付）要额外小心——用幂等键。
- 用故意重放测试消费者。

---

### 66. 死信队列

**答案：** 反复失败的消息进 DLQ 待检查而非永远阻塞主队列。设最大接收次数（SQS）或最大重试次数（Rabbit）后路由到 DLQ。对 DLQ 深度告警；构建工具检查、修复并回放消息。永远别静默丢。

**要点：**
- 带指标和仪表板的默认 DLQ 是基本要求。
- 没 DLQ 时毒消息可让分区停滞。
- 转移时包含原始头与失败原因。
- 周期清理 DLQ 防无界增长。

---

### 67. 事件溯源 & CQRS

**答案：** 事件溯源把状态持久化为不可变事件序列；当前状态通过回放推导。给出审计、时间旅行和投影。CQRS 分离写模型（命令 → 事件）与读模型（反规范化投影）。强大但复杂——schema 演化、回放性能、投影重建都是真成本。

**要点：**
- 快照加速长历史聚合的回放。
- 事件是你 API 的一部分——小心版本化。
- 用于强审计/合规需求的领域。
- 不要事件溯源一切——挑定向聚合。

---

### 68. Paxos/Raft 基础

**答案：** 共识算法在故障下保证集群对值达成一致。Raft 更易理解：多数选出领导者，所有写过领导者，复制到 follower，多数 ack 时提交。用于 etcd、Consul、CockroachDB、TiKV、Kafka KRaft。N 个节点容忍 `(N-1)/2` 失败。

**要点：**
- 始终用奇数集群（3、5、7）以干净多数。
- 法定人数读/写保证线性化。
- 写的领导者瓶颈；分片分担负载。
- Paxos 更老、形式化证明、更难实现。

---

### 69. 矢量时钟与 CRDT

**答案：** 矢量时钟跟踪因果序：每节点一个计数器，包含在每个消息中；接收方按 max 合并。检测并发 vs 因果更新，实现冲突感知合并。CRDT（Conflict-free Replicated Data Types）——计数器、集合、map——无协调确定性合并，用于协作编辑（Figma、Riak）。

**要点：**
- 矢量时钟随集群规模增长——版本矢量 / 点版本矢量裁剪。
- CRDT 分基于状态（CvRDT）与基于操作（CmRDT）。
- 无协调开销的最终一致性。
- 非常适合离线优先应用与多主设置。

---

### 70. 时钟偏差、NTP、逻辑时钟

**答案：** 物理时钟漂移；NTP 把它们维持在毫秒内但不完美。别用墙时钟给分布式事件排序——用逻辑时钟（Lamport 时间戳全序、矢量时钟因果序）。跨区域绝对排序，Google 的 TrueTime 用 GPS+原子钟带有界不确定度（Spanner 等待不确定度过去）。

**要点：**
- 闰秒破坏朴素时间戳逻辑。
- 混合逻辑时钟结合墙 + 逻辑做"够好"排序。
- 服务器始终跑 NTP/chrony。
- 别跨节点比较时间戳做关键正确性决策。

---

### 71. Python：GIL/asyncio/multiprocessing

**答案：** GIL 串行化 Python 字节码执行。`asyncio` 给 I/O 密集工作单线程协作并发——百万 awaitable 任务。`threading` 帮 I/O 密集代码因为 I/O 释放 GIL。`multiprocessing` 为 CPU 密集生进程，各自解释器，通过 pickle IPC 通信。按工作负载选。

**要点：**
- 别不带 `to_thread` 把 asyncio 与同步库混。
- `concurrent.futures` 提供线程/进程的统一 API。
- 子解释器（3.12+）和 free-threading（3.13+）重塑格局。
- pickle 约束折磨 `multiprocessing` 用户。

---

### 72. Python：类型提示，mypy

**答案：** PEP 484 加可选静态类型；`mypy` / `pyright` 检查它们。类型记录意图、抓 bug，启用零运行时成本的 IDE 智能。现代 Python（3.10+）有 `X | None`、结构类型（Protocol）、带 `[T]` 的泛型、`TypeAlias`、`Self`、`TypedDict`。增量采用，按模块用 `# type: ignore` 和 `disallow_untyped_defs`。

**要点：**
- `pyright`（Pylance）比 `mypy` 更快更严。
- 运行时校验需要 Pydantic/attrs——类型不强制。
- `Protocol` 启用带静态检查的鸭子类型。
- 用 `from __future__ import annotations` 做前向引用。

---

### 73. Python：pip vs poetry vs uv；锁文件

**答案：** `pip` 从 PyPI 安装；`pip-tools` 加锁文件（钉死的 `requirements.txt`）。Poetry 加依赖解析、锁文件、虚拟环境和打包。`uv`（Astral）是基于 Rust 的 pip/poetry 替代，快 10-100 倍，带 `uv.lock` 和 `pyproject.toml`。现代默认：`uv` 求速度，Poetry 求成熟生态。

**要点：**
- 始终提交锁文件以可复现。
- `pyproject.toml`（PEP 621）是标准项目元数据。
- CI 中避免不带约束文件的 `pip install`。
- `uv` 在 2026 年迅速成为事实选择。

---

### 74. Python：WSGI vs ASGI；gunicorn vs uvicorn

**答案：** WSGI 是同步接口（Flask、Django 3 前）——每 worker 一个请求。ASGI 是异步（FastAPI、Starlette、Django 3+）——支持 WebSocket 和每 worker 并发请求。Gunicorn 是带预 fork worker 的 WSGI 服务器；uvicorn 是 ASGI 服务器（libuv 支撑）。生产：gunicorn 监督 uvicorn worker（`-k uvicorn.workers.UvicornWorker`）。

**要点：**
- WebSocket/SSE/HTTP/2 需要 ASGI。
- 规模：同步 `workers = 2*cores+1`；异步少些。
- Hypercorn 支持 HTTP/2 和 HTTP/3。
- 别在生产跑开发服务器（`flask run`、`uvicorn --reload`）。

---

### 75. Go：channel vs 互斥锁

**答案：** Go 的口号："不通过共享内存通信；通过通信共享内存。"Channel 协调 goroutine 并传递数据所有权，鼓励更清晰设计。互斥锁也没问题——而且常更简单——用于保护少量共享状态（计数器、缓存）。Channel 做交接/协调，互斥锁做共享结构的不变量。

**要点：**
- 缓冲 channel 加容量但过大会掩盖设计缺陷。
- `sync.RWMutex` 用于读多状态。
- `sync.Once` 做懒初始；`sync/atomic` 做计数器。
- 关闭 channel 信号完成；接收方用 `, ok` 检测。

---

### 76. Go：context 取消

**答案：** `context.Context` 通过调用链携带截止日期、取消信号和请求级值。把它作为每个做 I/O 或生 goroutine 的函数的第一参数传。通过 `WithCancel`/`WithTimeout`/`WithDeadline` 取消；子 context 在父取消时取消。在长循环中检查 `ctx.Done()` 并在数据库/HTTP 库中尊重它。

**要点：**
- 永远别把 context 存在结构体里——通过函数传。
- 用于请求生命周期，不用于通用 DI。
- 始终 `defer cancel()` 释放资源。
- 多数标准库接受 context；用那些重载。

---

### 77. Go：错误处理

**答案：** 错误是与结果一起返回的值——显式 `if err != nil` 检查。用 `fmt.Errorf("doing X: %w", err)` 包装，用 `errors.Is/As` 解包。哨兵错误（`io.EOF`）用于已知条件，类型化错误用于结构化信息。无异常；`panic` 保留给不可恢复 bug。

**要点：**
- 在每层包装一次，不是每行。
- `errors.Join` 做多错误聚合（1.20+）。
- 别忽略错误——即便 `_ = ...` 也要刻意。
- 自定义错误类型实现 `Error() string` + 行为接口。

---

### 78. Java GC（G1、ZGC、Shenandoah）

**答案：** G1（JDK 9 起默认）基于区域、多并发、低暂停，堆到 ~32GB。ZGC 与 Shenandoah 亚毫秒、扩展到 TB——带读/加载屏障的并发压缩。Parallel GC 为批工作最大化吞吐。选择取决于延迟 vs 吞吐目标与堆大小。

**要点：**
- ZGC 分代（JDK 21+）更快回收年轻对象。
- 用 `-Xms = -Xmx` 调堆大小避免缩放。
- GC 日志（`-Xlog:gc*`）对诊断必备。
- 避免过早调优——默认对多数应用合理。

---

### 79. Java 虚拟线程（Loom）

**答案：** JDK 21 GA。虚拟线程轻量（KB 级），由 JVM 调度到少量 carrier 线程上。写阻塞代码（`Thread.sleep`、阻塞 I/O），JVM 卸载虚拟线程而非阻塞 OS 线程。让 servlet/Spring 风格代码扩展到百万并发请求而无需异步重写。

**要点：**
- `Thread.ofVirtual().start(...)` 或 `Executors.newVirtualThreadPerTaskExecutor()`。
- `synchronized` 块钉住 carrier——热路径优先 `ReentrantLock`（钉住正在修复）。
- 别池化虚拟线程——它们便宜，按任务创建。
- "线程对应请求"服务器的游戏改变者。

---

### 80. JVM 调优基础

**答案：** 把 `-Xms = -Xmx` 设到合工作负载的值，给原生/堆外留余地。按目标选 GC（G1 默认、ZGC 低暂停）。启用 GC 日志和 OOM 时堆转储（`-XX:+HeapDumpOnOutOfMemoryError`）。容器中用 `-XX:+UseContainerSupport`（8u191 起默认）让 JVM 看到 cgroup 限制。

**要点：**
- 调前度量；默认很好。
- JFR + Mission Control / async-profiler 做真诊断。
- 看堆外（DirectByteBuffer、metaspace）找"我 RAM 去哪了"。
- 容器内存必须超过 `-Xmx` + 原生 + 余地（~25%）。

---

### 81. Node.js 事件循环、libuv、worker

**答案：** Node 在单线程上用事件循环（libuv）跑 JS 做异步 I/O。阶段：timers → pending callbacks → idle/prepare → poll → check → close。微任务（promise、`queueMicrotask`）在阶段间跑。CPU 工作阻塞循环——卸到 `worker_threads` 做并行或 `child_process` 做隔离。

**要点：**
- 别用大载荷 `JSON.parse`、同步 crypto 等阻塞循环。
- `setImmediate` vs `setTimeout(0)` vs `process.nextTick`——不同阶段。
- 原生模块可通过 libuv 线程池做循环外工作（`UV_THREADPOOL_SIZE`）。
- 用 `clinic.js`、`--inspect`、`--prof` 剖析。

---

### 82. Node.js 流与背压

**答案：** 流增量处理数据——可读、可写、双工、变换。`pipe()` 和 `pipeline()` 传播背压：当可写的内部缓冲超过 `highWaterMark`，`write()` 返回 false，读者暂停。用 `pipeline()`（带错误清理）而非手动 `pipe()`。

**要点：**
- 异步迭代器（`for await`）是现代流消费者。
- Web Streams API 镜像 WHATWG 做跨运行时代码。
- 别在内存里缓冲整个文件——流式处理。
- 对象模式流传对象，不传字节。

---

### 83. Spring Boot vs Quarkus vs Micronaut

**答案：** Spring Boot 是现任——巨大生态、通过反射做运行时 DI/AOP、启动较慢、内存较重。Quarkus 与 Micronaut 做编译时 DI/AOP，狂砍启动与内存——非常适合 serverless 和容器。两者都支持 GraalVM native image 实现毫秒启动。Spring Boot 3 + AOT 也带来 native 支持。

**要点：**
- 选 Spring 求生态成熟，选 Quarkus/Micronaut 求云原生。
- Native image：极小内存、慢构建、反射注意事项。
- 三者都支持反应式（Mutiny、Reactor、RxJava）。
- 在它们间迁移非平凡。

---

### 84. Django vs Flask vs FastAPI

**答案：** Django：电池全包（ORM、admin、auth、迁移）——CRUD 应用和内容站最快。Flask：微框架，啥都你选——灵活、更多样板。FastAPI：异步、基于 Pydantic 的类型、自动 OpenAPI 文档——新 API 的现代默认。Django + DRF 仍主导全栈应用。

**要点：**
- 高并发 JSON API 用 FastAPI。
- 需要 admin 和 ORM 开箱用 Django。
- "我要完全控制"用 Flask。
- Django 异步支持（3.0+）很扎实，但 ORM 异步滞后。

---

### 85. Express vs Fastify vs NestJS

**答案：** Express：极简、无处不在、中间件生态成熟、较慢。Fastify：基于 schema、比 Express 快约 2 倍、JSON-Schema 校验、插件模型。NestJS：有主张、Angular 风格模块/装饰器/DI、跑在 Express 或 Fastify 上——最适合想要结构的大团队代码库。按团队和规模选。

**要点：**
- Fastify 赢基准；Express 赢熟悉度。
- NestJS 加结构但学习曲线更重。
- 三者都支持 async/await 与中间件/钩子。
- Hono 是更新的跨运行时替代（Workers、Bun、Deno、Node）。

---

### 86. SQL 注入——参数化查询

**答案：** 永远别把用户输入拼到 SQL。用参数化查询 / 预编译语句——驱动分别发 SQL 与值，所以输入永不能被解析成代码。ORM 默认就这样；通过 `db.query("... WHERE id = $1", id)` 的原生查询是安全的。字符串转义是回退，不是主防御。

**要点：**
- 把所有输入当敌意——包括来自上游服务的。
- 存储过程有助但非银弹。
- 用最小权限数据库用户（应用角色无 DDL）。
- 静态分析（semgrep、CodeQL）抓拼接式查询。

---

### 87. 密码存储（bcrypt/argon2、加盐、加胡椒）

**答案：** 永远别明文或快哈希（MD5/SHA1）存密码。用慢 KDF——Argon2id（首选）、scrypt 或 bcrypt——加每用户盐（库处理）。胡椒（pepper）是应用端密钥，在哈希前加入，与数据库分开存（防御单独数据库泄漏）。调成本让一次哈希在生产硬件上约 100-250ms。

**要点：**
- Argon2id 抗 GPU 与侧信道攻击。
- bcrypt 72 字节限制是脚枪——先 SHA-256 预哈希。
- 成本参数提高时登录时重哈希。
- 限流认证尝试拖慢暴力破解。

---

### 88. TLS 握手与证书钉

**答案：** TLS 1.3 握手：ClientHello（cipher、key share）→ ServerHello（选定 cipher、key share、证书）→ Finished——1 RTT，恢复 0-RTT。通过到受信 CA 的证书链验证服务端身份。证书钉把应用绑到特定证书/公钥——防御流氓 CA 但轮换时有变砖风险。多用于移动应用；后端少见。

**要点：**
- TLS 1.3 丢 RSA 密钥交换，要求 PFS。
- 用现代 cipher 套件；弃用 TLS 1.0/1.1。
- 自动证书续期（Let's Encrypt、ACM）；过期引发故障。
- 钉公钥 SPKI 而非证书，更安全轮换。

---

### 89. mTLS

**答案：** 双向 TLS——客户端与服务端都提供证书，互相校验。用于零信任网络中的服务对服务认证，替代或增强 API key。服务网格（Istio、Linkerd）通过 SPIFFE/SPIRE 自动化证书签发与轮换。比 bearer token 更强因为持有绑定到主机私钥。

**要点：**
- 证书生命周期（签发、轮换、撤销）是难点——自动化。
- 短命证书（小时）限制爆炸半径。
- 配对 SPIFFE ID 做稳定工作负载身份。
- TLS 终止器（Envoy）处理 mTLS 让应用不必。

---

### 90. 密钥管理（Vault、KMS）

**答案：** 别在代码、仓库或提交到任何地方的 env 文件中存密钥。用支持版本化、轮换、审计和动态密钥（短命数据库凭证）的密钥管理器（Vault、AWS Secrets Manager、GCP Secret Manager）。KMS 处理加密密钥——信封加密：KMS 给的数据 key 加密数据，KMS 加密数据 key。

**要点：**
- 按时间表和人员变动轮换密钥。
- 审计每次访问。
- 运行时注入（sidecar、init container），不烤进镜像。
- 尽可能 IAM 角色 > 长命 API key。

---

### 91. OWASP Top 10

**答案：** OWASP Top 10 排名最关键的 Web 安全风险：访问控制失效、加密失效、注入、不安全设计、安全配置错误、易受攻击组件、识别/认证失效、软件/数据完整性失效、安全日志/监控失效、SSRF。当基线检查清单用，不是极限。

**要点：**
- 访问控制失效是 #1——IDOR 和缺检查到处都是。
- 打依赖补丁（Dependabot/Renovate）——易受攻击组件常见。
- SSRF 防御：拒绝元数据 IP、限出站、校验 URL。
- 纵深防御：WAF + 框架默认 + 代码评审 + 扫描。

---

### 92. API vs 表单的 CSRF

**答案：** CSRF 诱使已认证用户的浏览器做意外请求。基于 cookie 的会话认证需要 CSRF token（同步器模式）或 `SameSite=Lax/Strict` cookie。Bearer token API（Authorization 头）不易受 CSRF 因为浏览器不自动附加该头。混合认证（cookie + bearer）仍需保护。

**要点：**
- `SameSite=Lax` 是现代默认，阻止大多数 CSRF。
- 无状态 CSRF 保护用双提交 cookie 模式。
- 别接受通过 GET 的状态变更请求。
- CORS 防止读响应，不防止发请求——不是单独的 CSRF 防御。

---

### 93. 限流与滥用检测

**答案：** 分层限制：边缘（网关）按 IP、应用按 API key、昂贵端点按路由、敏感操作按用户（登录、改密码）。通过异常检测滥用：新 IP 飙升、失败登录激增、异常 user agent。适当时配对 CAPTCHA、指数退避和账户锁定。

**要点：**
- 区分"速率"（每秒）与"并发"（在途）。
- 始终在错误响应里包含限制（`X-RateLimit-*`）。
- 记录被拒请求做取证。
- 考虑合法爆发流量并提供配额提升路径。

---

### 94. 结构化日志与关联 ID

**答案：** 用一致字段以 JSON（或 logfmt）发日志：timestamp、level、service、trace_id、span_id、user_id、request_id。在边缘生成并通过所有下游调用传播的关联 ID 让你跨服务拼起单用户请求。可能时用 OTel trace_id 做关联 ID。

**要点：**
- 每个重要事件一行日志；避免非结构 `printf`。
- 别记密钥/PII；源头清洗。
- 诚实用等级：`error` 应当 page 谁。
- 集中（ELK、Loki、Datadog）并按合适成本折衷保留。

---

### 95. 链路追踪：OTel span 与采样

**答案：** trace 是 span 树，每个代表带开始/结束时间戳和属性的操作。OpenTelemetry 是供应商中立的埋点标准。采样控制成本：基于头（在根决定）便宜但盲；基于尾（看完整 trace 后决定）保留错误和慢 trace。1-5% 头采样 + 错误总在是典型。

**要点：**
- W3C `traceparent` 头跨服务传播上下文。
- 自动埋点覆盖 HTTP、数据库、队列；在热路径补充自定义 span。
- Span 属性：保持低基数避免后端爆炸。
- 配对追踪与日志（共享 trace_id）和指标（exemplar）。

---

### 96. 指标：RED vs USE

**答案：** RED 用于请求驱动服务：Rate（req/s）、Errors（err/s 或 %）、Duration（延迟分布）。USE 用于资源：Utilization、Saturation、Errors。API 用 RED，CPU/盘/队列用 USE。始终跟踪直方图/百分位，不只平均——p99 揭示意味着捕火的尾延迟。

**要点：**
- 直方图启用下游百分位查询（Prometheus `histogram_quantile`）。
- 高基数 label（用户 ID）炸基数——避免。
- 对 SLO 燃烧率告警，不是原始阈值。
- 每服务仪表板：黄金信号（RED + 饱和度）。

---

### 97. 健康检查：liveness/readiness/startup

**答案：** Liveness："进程活着吗？"——假就重启。Readiness："应接收流量吗？"——假就从 LB 移除（如数据库不可达、暖机中）。Startup："初始化完成了吗？"——慢启动期间限制 liveness/readiness。Liveness 保持浅（进程响应）；readiness 检查真依赖（带断路器，不是全扇出）。

**要点：**
- Liveness 失败引起重启——保持笨避免级联。
- Readiness 在数据库/队列故障时翻转让流量排空。
- 别把 liveness 绑到下游——故障期会重启循环。
- Startup 探针防慢启动应用过早被杀。

---

### 98. 优雅关停

**答案：** 收 SIGTERM 时：停接受新连接、完成在途请求、排空队列、关数据库池，然后退出。K8s 发 SIGTERM、等 `terminationGracePeriodSeconds`、然后 SIGKILL。与 readiness 协调：先翻 ready=false 让 LB 停路由，短睡让在途 LB 注意到，然后排空。

**要点：**
- HTTP 服务器：停监听、等 wait group、超时回退。
- Worker：停拉新作业、完成当前、提交 offset/ack。
- 始终设最大排空超时——挂起的关停伤部署。
- 在 staging 发 SIGTERM 测试干净退出。

---

### 99. CI/CD 中的数据库迁移

**答案：** 迁移必须与上一应用版本向后兼容（扩展/收缩）。在 CI 中部署前跑迁移，或作为预部署作业。工具：Flyway、Liquibase、Alembic、Django 迁移、golang-migrate、Atlas。始终可评审、版本化、幂等式、用 prod 数据形状副本测试。

**要点：**
- 永远别在部署需要旧形状代码的同一版本里破坏性。
- 长迁移需要在线工具（pt-osc、gh-ost、pg_repack）。
- 向前滚——回滚迁移很痛苦。
- 迁移作业与应用 pod 分开跑避免竞态。

---

### 100. 特性开关与暗发布

**答案：** 特性开关把部署与发布解耦：发布暗代码，按用户/段/百分比启用。启用 canary、A/B 测试、kill switch 和渐进推出。暗发布把真实流量发给新代码路径但丢弃结果——在用户暴露前验证性能与正确性。LaunchDarkly、Unleash、ConfigCat 或自研。

**要点：**
- 分级开关：发布（短命）、实验、运维（kill switch）、权限。
- 清理陈旧开关——开关债真实。
- 默认状态应安全（关 / 旧行为）。
- 与指标组合：每个开关一个爆炸半径检测仪表板。

---
