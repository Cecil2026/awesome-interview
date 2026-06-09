# 全栈工程师面试路线图（10 周计划）

## 适合人群

3-6 年经验的中级全栈工程师，目标是创业公司或中型公司中会在前后端两侧都进行面试的产品工程岗位。你在同一迭代里既能上线前端功能也能上线后端功能。你在两层都胜任，但都没有特别深入 — 这份计划要补的正是这个差距。本计划是 10 周（比单一岗位的计划多 2 周），因为覆盖面更广，且任何一侧都无法假装出深度。

## 时间投入

- 工作日：1.5-2 小时
- 周末：5-7 小时
- 合计：10 周约 120-150 小时

## 前置条件

- 你至少端到端上线过一个生产功能（从数据库到 UI）
- 你至少熟练掌握一门后端语言和一个前端框架
- 你能写 SQL，也能写 CSS — 也许不够深，但足够胜任
- 你跨边界调过 bug（前端 bug 最后查出是后端引起，或反之）
- 你能从命令行使用 git

## 学习计划

### 第 1 周：算法基础 — 数组、字符串、哈希表

**重点：** 任何岗位的技术筛选都会出现的题型。

**算法（目标：20 题）**
- [ ] 数组 — 8 题简单/中等（Two Sum、Best Time to Buy and Sell Stock、Contains Duplicate、Product of Array Except Self、Maximum Subarray、Merge Intervals）
- [ ] 字符串 — 6 题简单/中等（Valid Anagram、Group Anagrams、Longest Palindromic Substring、Valid Palindrome）
- [ ] 哈希表与集合 — 6 题中等（Top K Frequent Elements、Longest Consecutive Sequence、Subarray Sum Equals K）

**理论**
- [ ] 复习 Big-O：时间与空间、摊还分析、常见复杂度（O(1)、O(log n)、O(n)、O(n log n)、O(n²)、O(2ⁿ)）
- [ ] 观看：任何知名的时间/空间复杂度复习视频

**系统设计 / 领域**
- [ ] 一页笔记：对典型 Web 应用场景，何时选数组 vs 哈希表 vs 有序结构

**行为面试准备**
- [ ] 写好你的"自我介绍"（60-90 秒）
- [ ] 从过去 3-4 年的工作中列出 10 个候选的 STAR 故事 — 全栈候选人需要能体现广度的故事

**里程碑（周末）**
- 边讲边解 3 道随机中等题，每题 25 分钟。用 90 秒解释哈希冲突解决策略。

### 第 2 周：算法 — 双指针、栈、链表、滑动窗口

**重点：** 第二档的题型，补全电话面试的工具箱。

**算法（目标：20 题）**
- [ ] 双指针 — 6 题中等（Container With Most Water、3Sum、Trapping Rain Water）
- [ ] 滑动窗口 — 6 题中等（Longest Substring Without Repeating Characters、Minimum Window Substring、Permutation in String）
- [ ] 栈 — 4 题中等（Valid Parentheses、Min Stack、Daily Temperatures、Largest Rectangle in Histogram）
- [ ] 链表 — 4 题简单/中等（Reverse Linked List、Merge Two Sorted Lists、Linked List Cycle、Remove Nth Node from End）

**理论**
- [ ] 用你的面试语言实现一个支持 insert/delete/find 的双向链表
- [ ] 从零实现 LRU 缓存（哈希表 + 双向链表）

**系统设计 / 领域**
- [ ] 笔记：LRU 缓存在真实系统中出现的地方（CPU 缓存、浏览器缓存、Redis、应用层缓存）

**行为面试准备**
- [ ] 打磨 3 个 STAR 故事 — 一次全栈功能交付、一次跨团队协作、一次技术失败

**里程碑（周末）**
- 凭记忆在 25 分钟内实现 LRU 缓存。冷启动解出 Minimum Window Substring。

### 第 3 周：算法 — 树、图、递归

**重点：** 每次 onsite 都会出现的题型，也是第 4 周一切内容的基础。

**算法（目标：20 题）**
- [ ] 二叉树 — 8 题中等（Level Order Traversal、Validate BST、Lowest Common Ancestor、Maximum Depth、Path Sum、Serialize and Deserialize）
- [ ] 图 BFS/DFS — 6 题中等（Number of Islands、Clone Graph、Course Schedule、Pacific Atlantic Water Flow）
- [ ] 递归 / 回溯 — 6 题中等（Subsets、Permutations、Combination Sum、Word Search）

**理论**
- [ ] 用你的面试语言从零实现：BFS、DFS（迭代和递归）、前/中/后序遍历、拓扑排序
- [ ] 阅读：CLRS 中关于图算法的章节（或任意等价的算法教材章节）

**系统设计 / 领域**
- [ ] 笔记：树与图算法在真实应用中出现的地方（DOM、文件系统、社交图、依赖求解）

**行为面试准备**
- [ ] 再打磨 4 个 STAR 故事 — 领导/带新人、冲突、处理模糊性、成功

**里程碑（周末）**
- 凭记忆实现 BFS 和 DFS。冷启动解出 "Validate BST" 和 "Course Schedule"。

### 第 4 周：前端深入 第 1 部分 — 语言与框架内部

**重点：** 选一个框架（React、Vue 或 Angular），学到能教别人的程度。

**算法（目标：10 题）**
- [ ] 一维 DP — 5 题中等（Climbing Stairs、House Robber、Coin Change、Longest Increasing Subsequence、Word Break）
- [ ] 综合复习 — 第 1-3 周中最弱类别的 5 题中等

**理论 — JavaScript 基础**
- [ ] 阅读：《You Don't Know JS Yet》— Scope & Closures、this & Object Prototypes
- [ ] 学习：事件循环（调用栈、任务队列、微任务队列），配合具体示例
- [ ] 从零实现：`Promise.all`、`debounce`、`throttle`、`deepClone`

**理论 — 框架内部（选一个）**
- [ ] React：从头到尾读官方文档 "Learn" 部分，再读 Dan Abramov 的 "A Complete Guide to useEffect"，再看任意一篇关于 React Fiber 的讲解；从零实现一个自定义的 `useState`
- [ ] Vue：从头到尾读 Vue 3 官方文档，包括 Reactivity in Depth；用 Proxy 实现一个微型响应式系统
- [ ] Angular：阅读官方文档中关于变更检测、Zone、依赖注入的内容；实现一个把两个流合并起来的 RxJS 管道

**系统设计 / 领域**
- [ ] 凭记忆在白板上画出你所选框架的组件生命周期

**行为面试准备**
- [ ] 把 5 个 STAR 故事大声练一遍，每个计时

**里程碑（周末）**
- 从零实现 `useState`（或 Vue 的 `ref`）克隆。在 3 分钟内不依赖图示地解释你的框架更新周期。

### 第 5 周：前端深入 第 2 部分 — HTML、CSS、性能

**重点：** 纯框架准备会忽略的前端面试部分。

**算法（目标：10 题）**
- [ ] 二维 DP — 5 题中等（Unique Paths、Longest Common Subsequence、Edit Distance）
- [ ] 堆 — 5 题中等（Kth Largest Element、Top K Frequent Elements、Merge K Sorted Lists、Find Median from Data Stream）

**理论 — HTML/CSS**
- [ ] 阅读：MDN 的 CSS Layout 章节（深入 flexbox 与 grid）
- [ ] 阅读：WCAG 2.1 AA 速查表（聚焦"可感知"和"可操作"原则）
- [ ] 搭建：用 CSS Grid 在 30 分钟内从零搭建一个响应式卡片网格
- [ ] 搭建：一个可访问的模态对话框（焦点陷阱、ESC 关闭、ARIA 角色、关闭时回归焦点）

**理论 — 性能**
- [ ] 阅读：web.dev 的 "Learn Core Web Vitals" 部分（LCP、INP、CLS）
- [ ] 学习：渲染策略 — CSR、SSR、SSG、ISR、流式 SSR；各自的适用场景
- [ ] 用 Lighthouse 审计一个真实网站，写一页报告列出前 5 个问题与修复方案

**系统设计 / 领域**
- [ ] 前端系统设计练习：设计一个自动补全组件（防抖、取消、缓存、键盘导航、可访问性）
- [ ] 前端系统设计练习：设计一个聊天 UI（组件、虚拟化、乐观发送、重连）

**行为面试准备**
- [ ] 大声练习所有 STAR 故事，并录音

**里程碑（周末）**
- 看一张 Twitter 卡片截图，在 30 分钟内用 HTML/CSS 复刻。解释 CLS 偏高的原因以及 4 种最常见的修复方式。

### 第 6 周：后端深入 第 1 部分 — 数据库与 API

**重点：** 成为那个不靠猜就能回答"为什么这个查询慢"的候选人。

**算法（目标：10 题）**
- [ ] 二分查找 — 5 题中等（Search in Rotated Sorted Array、Search a 2D Matrix、Koko Eating Bananas）
- [ ] 字典树 — 3 题中等（Implement Trie、Word Search II、Add and Search Word）
- [ ] 综合复习 — 2 题中等，从你最弱的类别选

**理论 — 数据库**
- [ ] 阅读：《Designing Data-Intensive Applications》(DDIA) by Martin Kleppmann — 第 1、2、3 章（数据系统、数据模型、存储）
- [ ] 阅读：DDIA 第 7 章（事务）— 隔离级别，各自防止的异常
- [ ] 阅读：Markus Winand 的《Use the Index, Luke》— B 树索引、复合索引、仅索引扫描
- [ ] 实操：本地启动 PostgreSQL，建一张 100 万行的表，对 5 个查询执行 EXPLAIN ANALYZE，加索引后再跑一遍，观察差异

**理论 — API**
- [ ] 学习：REST vs GraphQL vs gRPC — 各自适用场景、权衡
- [ ] 学习：幂等性，为什么它对重试至关重要，如何设计幂等接口
- [ ] 学习：分页策略（offset、cursor、keyset）及其权衡
- [ ] 学习：认证模式（会话 cookie、JWT、OAuth 2 + PKCE、API key）以及各自适用场景

**系统设计 / 领域**
- [ ] 笔记：阅读 3 篇知名的 API 设计工程博客（Stripe、GitHub、Shopify 都有不错的公开材料）

**行为面试准备**
- [ ] 与同伴进行 1 次行为面试模拟（30 分钟）

**里程碑（周末）**
- 看懂一份 EXPLAIN ANALYZE 的输出并指出慢操作。用具体例子解释 READ COMMITTED 与 REPEATABLE READ 的差异。阐述 offset 与 cursor 分页之间的权衡。

### 第 7 周：后端深入 第 2 部分 — 分布式系统

**重点：** 词汇与权衡。全栈候选人很少被要求设计 Paxos，但你必须能用它的语言交流。

**算法（目标：10 题）**
- [ ] 拓扑排序与并查集 — 4 题中等（Course Schedule II、Number of Connected Components、Graph Valid Tree）
- [ ] 困难题组 — 3 道困难题，覆盖你练过的题型（1 道 DP、1 道图、1 道树），每题 40 分钟
- [ ] 综合复习 — 3 题中等，从你最弱的类别选

**理论**
- [ ] 阅读：DDIA 第 5 章（复制）、第 6 章（分区）、第 9 章（一致性与共识）
- [ ] 观看或阅读：一份清晰的 Raft 共识算法讲解
- [ ] 学习：CAP 定理 — 它真正说了什么，以及 PACELC 扩展
- [ ] 学习：最终一致性、因果一致性、线性一致性 — 各自的保证与代价

**需要每题能在 2 分钟内讲清的主题**
- [ ] 主节点选举
- [ ] 法定人数读写（W + R > N）
- [ ] 分片策略：范围、哈希、一致性哈希
- [ ] 复制：主从、多主、无主
- [ ] 缓存模式：cache-aside、write-through、write-behind、read-through；缓存失效策略
- [ ] 消息队列：Kafka vs RabbitMQ vs SQS、at-least-once 与 exactly-once 投递

**系统设计 / 领域**
- [ ] 后端系统设计练习：设计 URL 短链服务（API、编码、规模、缓存、统计）
- [ ] 后端系统设计练习：设计限流器（令牌桶、滑动窗口、分布式执行）

**行为面试准备**
- [ ] 再过一遍所有 STAR 故事 — 每个落在 90-120 秒

**里程碑（周末）**
- 用 3 句话解释 CAP 定理，并给出真实世界的 CP 与 AP 例子。在 45 分钟内白板出 URL 短链服务，含容量估算。

### 第 8 周：系统设计 — 跨前后端的全栈设计

**重点：** 同时涉及前端、API、后端的设计 — 全栈面试真正会问的那一类。

**算法（目标：8 题）**
- [ ] 综合限时复习 — 8 题中等，每题 25 分钟，边讲边写。从过去解题时间偏慢的类别中选。

**理论**
- [ ] 阅读：Alex Xu 的《System Design Interview》Vol. 1 — 选读章节
- [ ] 阅读：任意知名的系统设计入门读物（"System Design Primer" 仓库是规范的免费参考）

**五个全栈设计（每天一个，每个约 3 小时）**
- [ ] 设计 Google Docs（协同编辑）— 前端富文本编辑器、冲突解决（OT 或 CRDT）、websocket 协议、持久化、在线指示
- [ ] 设计 Instagram — 信息流 UI、图片上传管线、CDN、扇出策略、搜索、通知
- [ ] 设计一个视频流产品（基础版 Netflix）— 播放器 UI、自适应码率、CDN、推荐入口、账户/资料模型
- [ ] 设计一个多人浏览器游戏大厅 — 匹配、websocket vs 轮询、服务端权威状态、重连、反作弊基础
- [ ] 设计一个电商结账流程 — 跨设备购物车状态、库存一致性、支付处理方接入、幂等下单、风控信号

**每个设计需要产出**
- [ ] 一张白板风格的架构图，展示前端、API 和后端
- [ ] 一页书面方案：需求 → 估算 → API 契约 → 数据模型 → 前端状态结构 → 后端架构 → 1-2 个组件的深入剖析 → 瓶颈

**行为面试准备**
- [ ] 为每类面试官准备 5 个深思熟虑的问题

**里程碑（周末）**
- 在 45 分钟内白板出协同编辑器设计，涵盖前端状态、同步协议、后端持久化。讲清 OT 与 CRDT 的权衡。

### 第 9 周：行为面试、岗位相关主题与薄弱点专项

**重点：** 软实力，以及目标岗位预期的任何专门主题。

**算法（目标：8 题）**
- [ ] 综合复习 — 从前 8 周里最弱的 2 个类别挑 8 题。每题限时 25 分钟。

**理论 — 岗位相关（按岗位选 1-2 项）**
- [ ] 如果应聘平台/DevOps 倾向团队：容器（Docker 基础）、编排（Kubernetes pods/services/deployments）、CI/CD 管线、可观测性（日志、指标、追踪）
- [ ] 如果应聘数据偏重的团队：ETL vs ELT、数据仓库基础（Snowflake/BigQuery 模型）、批处理 vs 流处理
- [ ] 如果应聘 ML 邻接团队：模型服务基础、特征存储、A/B 测试基础设施
- [ ] 如果应聘创业公司：练习范围澄清类问题 — "我们只有 2 周，会砍掉什么" — 并展示产品判断力

**行为面试准备**
- [ ] 与同伴或付费服务进行 1 次完整行为面试模拟（45 分钟）
- [ ] 死磕"全栈"角度的行为题：一次跨栈调试的故事、一次前后端职责权衡的故事、一次帮助栈另一侧同事的故事

**系统设计 / 领域**
- [ ] 从你没用过的新题池里再做 1 道系统设计

**里程碑（周末）**
- 不看笔记完整讲完 5 个 STAR 故事，每个不超过 2 分钟。在 5 分钟的回答里深入阐述一个岗位相关主题。

### 第 10 周：模拟面试与最终复习

**重点：** 模拟整个流程，找漏洞，补上。

**算法（目标：限时练习）**
- [ ] 5 天，每天 1 道随机中等题，限时 25 分钟，边讲边写
- [ ] 2 天，每天 1 道困难题，限时 40 分钟，边讲边写

**理论**
- [ ] 不学新材料。把第 1-9 周的笔记重读一遍。

**系统设计 / 领域**
- [ ] 与同伴进行 3 次系统设计模拟（每次 45 分钟）— 只用新题
- [ ] 每次模拟后写一页自评

**行为面试准备**
- [ ] 与同伴或付费服务进行 1 次端到端的完整流程模拟（编码 + 前端 + 后端 + 系统设计 + 行为）
- [ ] STAR 故事的最后打磨

**里程碑（周末）**
- 完成一次完整模拟流程并给自己在每一轮上评为通过。如果任一轮失败，在真实面试前额外花 2 天死磕那一点。

## 最后一周清单

- [ ] 与朋友进行编码模拟面试（45 分钟，未见过的题）
- [ ] 前端模拟轮（45 分钟 — 组件编码或框架讨论）
- [ ] 后端模拟轮（45 分钟 — API 或数据库设计）
- [ ] 系统设计模拟（45 分钟，未见过的全栈题）
- [ ] 行为模拟（30 分钟，5 个 STAR 问题）
- [ ] 与招聘联系人确认面试形式（轮次、时长、工具、允许语言）
- [ ] 把你最好的 5 个 STAR 故事最后再读一遍
- [ ] 为每类面试官准备 5 个问题
- [ ] 测试硬件：摄像头、麦克风、屏幕共享、编码工具、白板工具
- [ ] 前一晚睡足 8 小时 — 不容商量

## 如果时间更少

**压缩 5 周版本：**

- 第 1 周 = 原计划第 1+2+3 周的算法内容压缩（40 道中等题覆盖所有基础题型）
- 第 2 周 = 原计划第 4+5 周前端浓缩（框架内部 + Core Web Vitals + 1 个前端系统设计）
- 第 3 周 = 原计划第 6+7 周后端浓缩（DDIA 第 1、5、9 章 + 1 个后端系统设计）
- 第 4 周 = 原计划第 8 周减量（2 个全栈系统设计而非 5 个）
- 第 5 周 = 原计划第 9+10 周浓缩（1 次完整流程模拟，敲定 STAR 故事，专攻薄弱点）

**压缩 3 周版本（应急）：**

- 第 1 周：30 道 LeetCode 中等题，覆盖所有主要题型。框架内部刷新。3 个 STAR 故事。
- 第 2 周：阅读 DDIA 第 1、5、9 章。1 个前端系统设计 + 1 个后端系统设计。
- 第 3 周：1 次完整流程模拟。敲定 5 个 STAR 故事。硬件检查。最终复习。

## 如果时间更多

- 在栈的两侧各加一个框架。如果你会 React 和 PostgreSQL，再学足够的 Svelte 和 MongoDB 以便对比范式。全栈面试官喜欢能在选择之间解释权衡的候选人。
- 把 DDIA 通读一遍，而不只是指定章节。
- 在你平时不用的基础设施上从零做一个非琐碎的全栈副业项目（你平时用 AWS 的话就部署到 Fly.io、Render 或 Cloudflare Workers，反之亦然）。新颖的基础设施会暴露你常用栈帮你藏起来的约束。
- 给开源全栈项目（Supabase、Next.js、NestJS、Remix）提交一个非琐碎的 PR。一个真实 PR 胜过 10 份教程。
- 研究 5 篇你想加入的团队公开发布的工程博客。记下他们讨论的架构决策和权衡。在面试中引用它们。
- 练习跨栈讲述你过去的项目：数据是如何从一行数据库记录流向屏幕上的一个像素。这是全栈面试的经典叙事。
