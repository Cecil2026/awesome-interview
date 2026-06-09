# 后端工程师面试路线图（8 周计划）

## 适合人群

3-5 年经验的中级后端工程师，目标是 FAANG 级别或高门槛创业公司中 L5 等同的 SWE 岗位。熟练掌握一门后端语言（Go、Java、Python、C++、Rust），已经上线过生产服务，但在大规模系统设计和顶级公司要求的算法门槛上历来偏弱。你在生产中用过数据库，但也许从未在面试里解释过一份 EXPLAIN 执行计划。

## 时间投入

- 工作日：1.5-2 小时
- 周末：5-7 小时
- 合计：8 周约 100-120 小时

## 前置条件

- 至少熟练掌握一门后端语言（不查文档就能写出哈希表、递归函数以及一个 goroutine/线程）
- 你部署过与数据库通信的服务，并扛住过生产流量
- 你能读懂 SQL，并独立写出一个 JOIN
- 你在请求/响应层面理解 HTTP — 状态码、方法、头部
- 你能从命令行使用 git

## 学习计划

### 第 1 周：算法基础 — 数组、字符串、哈希

**重点：** 重建对那些出现在 60% 电话面试中的题型的熟练度。

**算法（目标：25 题）**
- [ ] 数组 — 10 题简单/中等混合（Two Sum、Best Time to Buy and Sell Stock、Product of Array Except Self、Maximum Subarray、Merge Intervals、Rotate Image）
- [ ] 字符串 — 8 题简单/中等混合（Valid Anagram、Group Anagrams、Longest Palindromic Substring、Encode and Decode Strings）
- [ ] 哈希表与集合 — 7 题中等（Top K Frequent Elements、Longest Consecutive Sequence、Subarray Sum Equals K）

**理论**
- [ ] 阅读：《Introduction to Algorithms》(CLRS) — 哈希章节
- [ ] 重新推导：哈希表操作的平均与最坏时间复杂度，以及背后的原因
- [ ] 观看：任何知名的 Big-O 复习视频 — 重点关注摊还分析

**系统设计 / 领域**
- [ ] 写一页总结：何时选数组、链表、哈希表或有序结构，并附带示例场景

**行为面试准备**
- [ ] 写好你的"自我介绍"（60-90 秒，三个要点）
- [ ] 列出过去 3-4 年里 10 个候选的 STAR 故事

**里程碑（周末）**
- 边讲边解 3 道随机中等题，每题 25 分钟。用 90 秒解释哈希表冲突解决方案。

### 第 2 周：树、图与遍历模式

**重点：** 后端技术筛选的核心内容。

**算法（目标：25 题）**
- [ ] 二叉树 — 8 题中等（Binary Tree Level Order Traversal、Validate BST、Lowest Common Ancestor、Construct Tree from Preorder/Inorder、Serialize and Deserialize Binary Tree）
- [ ] 字典树 — 3 题中等（Implement Trie、Word Search II、Add and Search Word）
- [ ] 图（BFS/DFS）— 8 题中等（Number of Islands、Clone Graph、Pacific Atlantic Water Flow、Word Ladder）
- [ ] 拓扑排序 — 3 题中等（Course Schedule I 和 II、Alien Dictionary）
- [ ] 并查集 — 3 题中等（Number of Connected Components、Graph Valid Tree、Accounts Merge）

**理论**
- [ ] 阅读：CLRS 中关于树和图的章节（或任意等价的算法教材章节）
- [ ] 用你的面试语言从零实现：BFS、DFS（迭代和递归）、Dijkstra、拓扑排序、带路径压缩的并查集

**系统设计 / 领域**
- [ ] 画出邻接表与邻接矩阵的差异图，并标注内存与运行时权衡

**行为面试准备**
- [ ] 打磨 4 个 STAR 故事 — 技术深度、跨团队协作、冲突、失败

**里程碑（周末）**
- 用你的面试语言凭记忆实现 BFS、DFS 和 Dijkstra。在 30 分钟内冷启动解出 "Course Schedule II"。

### 第 3 周：动态规划与回溯

**重点：** 在编码轮中区分"扎实"和"出色"的题型。

**算法（目标：20 题）**
- [ ] 一维 DP — 8 题中等（Climbing Stairs、House Robber I 和 II、Coin Change、Longest Increasing Subsequence、Word Break、Decode Ways）
- [ ] 二维 DP — 7 题中等/困难（Unique Paths、Longest Common Subsequence、Edit Distance、Best Time to Buy and Sell Stock with Cooldown、Interleaving String）
- [ ] 回溯 — 5 题中等（Subsets、Permutations、Combination Sum、Word Search、N-Queens）

**理论**
- [ ] 阅读：一份结构化的 DP 指南（LeetCode DP 学习计划，或任何知名的系统性 DP 教程）
- [ ] 练习：状态定义训练 — 对每道题，先写出状态、转移、初始条件和计算顺序，再动手写代码

**数据库（从这里开始）**
- [ ] 阅读：《Designing Data-Intensive Applications》(DDIA) by Martin Kleppmann — 第 1、2 章（数据系统基础、数据模型）

**系统设计 / 领域**
- [ ] 写一页笔记，解释 DP 何时适用（最优子结构 + 重叠子问题）以及如何识别

**行为面试准备**
- [ ] 再打磨 3 个 STAR 故事 — 领导/带新人、处理模糊性、成功交付的项目

**里程碑（周末）**
- 不看笔记冷启动解出 "Edit Distance" 和 "Word Break"。对一道从未见过的题，在 5 分钟内说清 DP 状态。

### 第 4 周：数据库 — 内核、索引、事务

**重点：** 成为那个不靠猜就能回答"为什么这个查询慢"的候选人。

**算法（目标：15 题）**
- [ ] 堆 / 优先队列 — 5 题中等（Kth Largest Element、Top K Frequent Elements、Merge K Sorted Lists、Find Median from Data Stream）
- [ ] 二分查找 — 5 题中等（Search in Rotated Sorted Array、Find Minimum in Rotated Sorted Array、Search a 2D Matrix、Koko Eating Bananas）
- [ ] 滑动窗口 — 5 题中等（Longest Repeating Character Replacement、Permutation in String、Minimum Window Substring）

**理论**
- [ ] 阅读：DDIA 第 3 章（存储与检索）和第 7 章（事务），从头到尾
- [ ] 阅读：Markus Winand 的《Use the Index, Luke》— B 树索引与复合索引章节
- [ ] 学习：B 树与 LSM 树的对比，各自使用场景，读写放大权衡
- [ ] 学习：隔离级别 — read uncommitted、read committed、repeatable read、serializable — 以及各自防止哪些异常

**实操**
- [ ] 本地启动 PostgreSQL。建表插入 100 万行。对 5 个查询执行 EXPLAIN ANALYZE。加索引后再跑一遍。观察差异。
- [ ] 用两个并发的 psql 会话复现一次幻读或不可重复读

**系统设计 / 领域**
- [ ] 写一页笔记：何时用单列索引 vs 复合索引、为什么索引顺序重要、何时索引会拖慢性能

**行为面试准备**
- [ ] 把所有 STAR 故事大声练一遍并计时 — 每个落在 90-120 秒

**里程碑（周末）**
- 看懂一份 EXPLAIN ANALYZE 的输出并指出慢操作。用具体例子解释 READ COMMITTED 与 REPEATABLE READ 的差异。

### 第 5 周：分布式系统

**重点：** 词汇与权衡。你不会在面试中实现 Raft，但你必须能用它的语言交流。

**算法（目标：12 题）**
- [ ] 综合复习 — 从你迄今最薄弱的 2 个类别里挑 12 题。每题限时 25 分钟。

**理论**
- [ ] 阅读：DDIA 第 5 章（复制）、第 6 章（分区）、第 8 章（分布式系统的麻烦）、第 9 章（一致性与共识）
- [ ] 观看或阅读：一份清晰的 Raft 共识算法讲解（Raft 原论文相当易读，或者"Raft 可视化"交互式演示）
- [ ] 学习：CAP 定理 — 它真正说了什么 vs 它常被误引的样子；以及 PACELC 扩展
- [ ] 学习：最终一致性、因果一致性、线性一致性、可串行化 — 各自的保证与代价

**需要每题能在 2 分钟内讲清的主题**
- [ ] 主节点选举及其难点
- [ ] 法定人数读写（W + R > N）
- [ ] 两阶段提交以及它为何会阻塞
- [ ] 向量时钟 vs Lamport 时间戳
- [ ] 分片策略：范围、哈希、一致性哈希
- [ ] 复制：主从、多主、无主
- [ ] 冲突解决：last-write-wins、CRDT

**行为面试准备**
- [ ] 与同伴进行 1 次行为面试模拟（30 分钟）

**里程碑（周末）**
- 用 3 句话准确解释 CAP 定理，并各给出一个 CP 系统和 AP 系统的真实例子。不看笔记用 5 分钟讲清 Raft 主节点选举。

### 第 6 周：系统设计 — 经典五题

**重点：** 把五个标志性设计反复练习到形成反射。

**算法（目标：10 题）**
- [ ] 综合限时复习 — 10 题中等/困难，每题 30 分钟，边讲边写

**理论**
- [ ] 阅读：Alex Xu 的《System Design Interview》Vol. 1 — 选读对应下面 5 个设计的章节
- [ ] 阅读：任何知名的系统设计入门读物（"System Design Primer" 仓库是规范的免费参考）— 略读容量估算部分

**五个设计（每天一个，每个约 3 小时）**
- [ ] 设计一个 URL 短链服务 — 需求、API、base62 编码、哈希冲突、扩展到每天 1 亿 URL、缓存策略、统计分析
- [ ] 设计一个类似 WhatsApp 的聊天系统 — 1:1 与群聊、消息顺序、送达回执、在线状态、推送通知、端到端加密的权衡
- [ ] 设计一个类似 Twitter/Facebook 的信息流 — 写时扇出 vs 读时扇出、名人问题、缓存、排序、分页
- [ ] 设计一个类似 Google Search 的搜索系统 — 爬取、索引（倒排索引）、排序、查询服务、自动补全
- [ ] 设计一个限流器 — 令牌桶 vs 漏桶 vs 固定窗口 vs 滑动窗口、分布式限流、在哪里执行（网关 vs 服务）

**每个设计需要产出**
- [ ] 一张白板风格的架构图
- [ ] 一页书面方案：需求 → 估算 → API → 数据模型 → 整体架构 → 1-2 个组件的深入剖析 → 瓶颈与缓解

**行为面试准备**
- [ ] 为每类面试官（同级工程师、招聘经理、跨级）各准备 5 个深思熟虑的问题

**里程碑（周末）**
- 在 45 分钟内端到端白板出 URL 短链服务，包括容量估算。解释信息流设计中的名人问题，并给出两种处理方式。

### 第 7 周：并发、语言深入、行为面试

**重点：** 当算法门槛已经达到后，把强候选人与普通候选人区分开来的话题。

**算法（目标：8 题）**
- [ ] 8 道困难题，覆盖你练过的题型。每题限时 40 分钟。

**理论 — 并发**
- [ ] 学习：互斥锁 vs 信号量 vs 读写锁 vs 自旋锁 — 各自适用场景
- [ ] 学习：死锁 — 四个条件，如何预防或检测
- [ ] 学习：竞态条件、内存序、原子操作
- [ ] 学习：actor 模型（Erlang/Akka）vs CSP（Go channels）vs 共享内存线程

**理论 — 语言深入（选你面试用的那门）**
- [ ] Go：goroutine 调度器内部、channel 底层实现、GC 行为、逃逸分析、常见陷阱（循环变量捕获、nil channel 读取）
- [ ] Java：JMM（Java 内存模型）、volatile vs synchronized、ConcurrentHashMap 内部、GC 算法（G1、ZGC）、JIT
- [ ] Python：GIL — 它到底做了什么、何时会带来痛点、何时不会；asyncio 事件循环；CPython 对象模型
- [ ] C++：移动语义、RAII、智能指针、内存模型（acquire/release）、模板基础
- [ ] Rust：所有权与借用、Send/Sync、async/await 运行时模型、常见生命周期错误

**系统设计 / 领域**
- [ ] 从你没用过的题池里再做 1 道系统设计：设计 Uber 派单匹配、设计一个类似 Redis 的分布式缓存、设计一个类似 Kafka 的队列、设计 Dropbox 文件同步

**行为面试准备**
- [ ] 与同伴进行 1 次完整行为面试模拟（30-45 分钟）
- [ ] 对 STAR 故事进行最后一遍打磨 — 应当听起来轻松且简洁

**里程碑（周末）**
- 用 5 分钟解释你所选语言的并发模型，并给出你修过的 2 个真实 bug。在 45 分钟内白板出一个新的系统设计。

### 第 8 周：模拟面试与薄弱点复习

**重点：** 模拟真实面试流程。找出漏洞，补上。

**算法（目标：限时练习）**
- [ ] 5 天，每天 1 道随机中等题，限时 25 分钟，边讲边写
- [ ] 2 天，每天 1 道困难题，限时 45 分钟，边讲边写

**理论**
- [ ] 不学新材料。把第 1-7 周的笔记重读一遍。

**系统设计 / 领域**
- [ ] 与同伴进行 3 次系统设计模拟（每次 45 分钟）— 使用你没见过的题目
- [ ] 每次后写一页自评：你漏掉了什么、需要加深什么

**行为面试准备**
- [ ] 与同伴或付费服务进行 1 次完整流程模拟 — 编码 + 系统设计 + 行为面试端到端
- [ ] STAR 故事的最后审阅

**里程碑（周末）**
- 完成 1 次完整模拟流程并给自己在每一轮上评为通过。若任一轮失败，在真实面试前额外花 2 天专攻那个具体薄弱点。

## 最后一周清单

- [ ] 编码模拟（45 分钟，未见过的题，边讲边写）
- [ ] 系统设计模拟（45 分钟，未见过的题）
- [ ] 行为模拟（30 分钟，5 个 STAR 问题）
- [ ] 与招聘联系人确认面试形式（轮次、时长、工具、允许语言）
- [ ] 把 DDIA 笔记再读最后一遍
- [ ] 把你最好的 5 个 STAR 故事再读一遍
- [ ] 为每类面试官准备 5 个问题
- [ ] 测试硬件：摄像头、麦克风、屏幕共享、编码工具（CoderPad、Codility、HackerRank）
- [ ] 前一晚睡足 8 小时 — 不容商量

## 如果时间更少

**压缩 4 周版本：**

- 第 1 周 = 原计划第 1+2 周浓缩。30 题覆盖数组、字符串、哈希、树、图。跳过并查集，跳过拓扑排序。
- 第 2 周 = 原计划第 3+4 周浓缩。15 题 DP/回溯 + DDIA 第 1-3、7 章。跳过 Postgres 实操实验。
- 第 3 周 = 原计划第 5+6 周浓缩。DDIA 第 5、6、9 章 + 五个经典设计中的 3 个（URL 短链、聊天、限流器）。
- 第 4 周 = 原计划第 7+8 周浓缩。1 次完整流程模拟。死磕最薄弱的算法类别。最终敲定 STAR 故事。

**压缩 2 周版本（应急）：**

- 第 1 周：40 道 LeetCode 中等题，覆盖所有主要题型。只读 DDIA 第 1、5、9 章。1 个系统设计练习（URL 短链）。
- 第 2 周：再做 2 个系统设计（聊天、限流器）。1 次模拟面试。敲定 5 个 STAR 故事。硬件检查。

## 如果时间更多

- 把 DDIA 通读一遍，而不只是指定章节。它是后端面试杠杆率最高的一本书。
- 学一门第二语言。如果你用 Python 面试，再学足够的 Go（反之亦然）以便对比运行时模型。面试官欣赏广度。
- 实现一个玩具分布式系统：一个带复制和简单共识机制（Raft，或者哪怕是主备）的键值存储。一次实现胜过读 10 篇论文。
- 给开源后端项目（数据库、队列、服务网格）提交一个非琐碎的 PR。一个真实 PR 比任何副业项目更有说服力。
- 阅读 5 篇你想加入的团队公开发布的工程博客。记下他们讨论的架构决策和权衡。在面试中引用它们。
- 每周研究一份生产事故复盘（Cloudflare、GitHub、AWS、Google 都发过详细的）。学习真实大规模系统中会出什么问题。
