# 软件架构师面试路线图（8 周计划）

## 适合人群

5 年以上经验的资深工程师，目标是软件架构师、Staff/Principal 工程师或技术负责人岗位 —— 这类面试由系统设计、架构权衡和横切关注点主导，而不是算法谜题。你上线并运维过生产系统，但很少需要从头到尾为一整套系统的设计辩护、面对质疑的评审组清晰地讲清权衡，或把可靠性、安全、成本当作一等公民来推理。编码门槛真实存在但退居其次；真正决定成败的门槛是「这个人能不能扛起一个系统的架构以及背后的决策」。

## 时间投入

- 工作日：1.5-2 小时
- 周末：5-6 小时
- 合计：8 周约 90-110 小时

## 前置条件

- 5 年以上后端或全栈系统经验，至少独立设计过一个有分量的服务
- 你在生产环境运维过东西 —— on-call、故障、容量、回滚
- 你能读写 SQL，并能在高层面看懂一份 EXPLAIN 执行计划
- 你理解 HTTP、TLS 以及请求/响应生命周期
- 你对一门后端语言足够熟练，不查文档就能写出一个小算法

## 学习计划

### 第 1 周：架构基础与风格

**重点：** 建立一套架构风格的共同词汇，并能说清每种风格*何时*占优。

**理论**
- [ ] 阅读：《软件架构基础》(Richards & Ford) —— 架构风格与架构特性
- [ ] 写一页总结：对每种风格（模块化单体、微服务、事件驱动），写清哪些因素让它占优、哪些因素会让它崩掉

**里程碑（周末）**
- 对一个全新产品，用 5 分钟论证一个起步架构，并说出哪两个信号会让你后续把它拆开。

**本周对应资源（本仓库）**

| 学习目标 | 去哪里练 / 查阅 |
| --- | --- |
| 单体 / 微服务 / 模块化单体，耦合与内聚 | [knowledge/architecture.zh.md](../knowledge/architecture.zh.md) —— 第 1-9 题 |
| DDD：限界上下文、聚合、通用语言 | [knowledge/architecture.zh.md](../knowledge/architecture.zh.md) —— 第 5 题 |
| 事件驱动、CQRS、事件溯源、Saga | [knowledge/architecture.zh.md](../knowledge/architecture.zh.md) —— 第 2-6 题 |
| 保持编码手感 | [knowledge/algorithms.zh.md](../knowledge/algorithms.zh.md) —— 3-4 道简单/中等 |

### 第 2 周：数据密集型系统与存储

**重点：** 为一种负载选对数据存储，并在面对备选方案时为选择辩护。

**理论**
- [ ] 阅读：《Designing Data-Intensive Applications》(DDIA) —— 第 1-3、5-7 章
- [ ] 写一页总结：OLTP vs OLAP vs KV vs 文档 vs 图 的决策树，每个分支配一个真实示例

**里程碑（周末）**
- 为三种不同负载（高写入的遥测、事务型订单、社交图谱）各选一个存储，并在 3 分钟内为每个辩护。

**本周对应资源（本仓库）**

| 学习目标 | 去哪里练 / 查阅 |
| --- | --- |
| SQL vs NoSQL 决策矩阵 | [knowledge/architecture.zh.md](../knowledge/architecture.zh.md) —— 第 20 题 |
| 索引、事务、隔离级别、N+1 | [knowledge/backend.zh.md](../knowledge/backend.zh.md) —— 第 7-17 题 |
| 复制、分区、分片、再平衡 | [knowledge/distributed.zh.md](../knowledge/distributed.zh.md);[architecture.zh.md](../knowledge/architecture.zh.md) 第 15-16 题 |
| 批处理 / 流式 / 数仓 的权衡 | [knowledge/big-data.zh.md](../knowledge/big-data.zh.md) |
| 保持编码手感 | [knowledge/algorithms.zh.md](../knowledge/algorithms.zh.md) —— 3-4 题 |

### 第 3 周：分布式系统与一致性

**重点：** 协调的词汇与权衡。你不会实现 Raft，但你必须精确地推理故障。

**理论**
- [ ] 阅读：DDIA 第 8-9 章（分布式系统的麻烦、一致性与共识）
- [ ] 学习：法定人数读写（W + R > N）、主节点选举、复制延迟、read-your-writes

**里程碑（周末）**
- 用三句话准确解释 CAP，并各给一个 CP 与 AP 的例子;然后讲清一个 Saga 如何从部分失败中恢复。

**本周对应资源（本仓库）**

| 学习目标 | 去哪里练 / 查阅 |
| --- | --- |
| CAP & PACELC 的实战含义 | [knowledge/architecture.zh.md](../knowledge/architecture.zh.md) —— 第 11 题;[distributed.zh.md](../knowledge/distributed.zh.md) |
| 一致性模型（强 / 最终 / 因果） | [knowledge/architecture.zh.md](../knowledge/architecture.zh.md) —— 第 12-13 题;[distributed.zh.md](../knowledge/distributed.zh.md) |
| 分布式事务：2PC vs Saga | [knowledge/architecture.zh.md](../knowledge/architecture.zh.md) —— 第 14 题;[distributed.zh.md](../knowledge/distributed.zh.md) |
| 幂等、精确一次、去重 | [knowledge/backend.zh.md](../knowledge/backend.zh.md) —— 第 2 题;[distributed.zh.md](../knowledge/distributed.zh.md) |
| 保持编码手感 | [knowledge/algorithms.zh.md](../knowledge/algorithms.zh.md) —— 3-4 题 |

### 第 4 周：可扩展性、缓存与韧性

**重点：** 在高负载和部分故障下让系统保持在线与快速的那些模式。

**理论**
- [ ] 学习：cache-aside vs read-through vs write-through vs write-behind，以及各自的失效模式
- [ ] 写一页总结：故障隔离工具箱（超时、带抖动的重试、熔断、舱壁隔离、过载丢弃）

**里程碑（周末）**
- 拿一个在 10 倍流量下会崩的设计，按顺序说出你会做的四个改动，以及每个改动换来了什么。

**本周对应资源（本仓库）**

| 学习目标 | 去哪里练 / 查阅 |
| --- | --- |
| 负载均衡、无状态 vs 有状态、水平扩展 | [knowledge/architecture.zh.md](../knowledge/architecture.zh.md) —— 第 8-10 题 |
| 缓存层与失效 | [knowledge/architecture.zh.md](../knowledge/architecture.zh.md) —— 第 17 题;[backend.zh.md](../knowledge/backend.zh.md) 第 16-17 题 |
| 熔断、超时、重试、退避、抖动 | [knowledge/architecture.zh.md](../knowledge/architecture.zh.md) —— 第 18-19 题 |
| 限流与背压 | [knowledge/backend.zh.md](../knowledge/backend.zh.md) —— 第 4 题;[system-design.zh.md](../knowledge/system-design.zh.md) |
| 保持编码手感 | [knowledge/algorithms.zh.md](../knowledge/algorithms.zh.md) —— 3-4 题 |

### 第 5 周：经典系统设计

**重点：** 把标志性设计反复端到端练到结构成反射。

**五个设计（每次一个，各约 3 小时）**
- [ ] URL 短链 —— 需求、API、编码、扩展、缓存、统计
- [ ] 聊天系统 —— 顺序、送达回执、在线状态、推送、扇出
- [ ] 信息流 —— 读时扇出 vs 写时扇出、名人问题、排序
- [ ] 限流器 —— 算法、分布式执行、在哪里执行
- [ ] 一个数据密集型设计（自选：指标管道、搜索或特征存储）

**每个设计需要产出**
- [ ] 一张白板风格的架构图
- [ ] 一页书面方案：需求 → 估算 → API → 数据模型 → 架构 → 1-2 个深入剖析 → 瓶颈

**里程碑（周末）**
- 在 45 分钟内端到端白板出一个设计（含容量估算），再对照评分标准给自己打分。

**本周对应资源（本仓库）**

| 学习目标 | 去哪里练 / 查阅 |
| --- | --- |
| 实战设计范例 | [mock-interviews/](../mock-interviews/) —— 短链、聊天、限流器、RAG 问答 |
| 场景题库 | [knowledge/system-design.zh.md](../knowledge/system-design.zh.md) |
| 像面试官一样给自己打分 | [system-design-rubric](../mock-interviews/system-design-rubric.zh.md) |
| 保持编码手感 | [knowledge/algorithms.zh.md](../knowledge/algorithms.zh.md) —— 3-4 题 |

### 第 6 周：横切关注点 —— 安全、可观测性、交付、成本

**重点：** 把架构师和优秀资深工程师区分开的那些关注点 —— 永远塞不进 happy path 的那些。

**理论**
- [ ] 学习：一次错误预算（error budget）对话 —— SLO 如何驱动发布决策
- [ ] 写一页总结：你会对任何新服务套用的安全架构清单（身份、密钥、网络、静态/传输数据、审计）

**里程碑（周末）**
- 为上周某个设计加上运维层：SLO、发布策略、最重要的三个故障告警，以及一个粗略的月度成本大头。

**本周对应资源（本仓库）**

| 学习目标 | 去哪里练 / 查阅 |
| --- | --- |
| 认证 vs 授权、OAuth 2.0 / OIDC 架构 | [knowledge/architecture.zh.md](../knowledge/architecture.zh.md) —— 第 21-22 题;[backend.zh.md](../knowledge/backend.zh.md) 第 5-6 题 |
| 可观测性：日志 vs 指标 vs 链路、SLI/SLO/SLA | [knowledge/architecture.zh.md](../knowledge/architecture.zh.md) —— 第 24-25 题;[devops.zh.md](../knowledge/devops.zh.md) |
| 部署：蓝绿、金丝雀、滚动 | [knowledge/architecture.zh.md](../knowledge/architecture.zh.md) —— 第 23 题;[devops.zh.md](../knowledge/devops.zh.md) |
| 成本、容量与多租户权衡 | [knowledge/system-design.zh.md](../knowledge/system-design.zh.md);[devops.zh.md](../knowledge/devops.zh.md) |
| 保持编码手感 | [knowledge/algorithms.zh.md](../knowledge/algorithms.zh.md) —— 3-4 题 |

### 第 7 周：架构沟通与决策

**重点：** 那些软性但决定性的能力 —— 讲清权衡、把决策写下来、推动迁移、对齐干系人。

**理论**
- [ ] 学习：ADR（架构决策记录）、用于画图的 C4 模型、以及 RFC 驱动的决策方式
- [ ] 学习：迁移策略 —— 绞杀者模式（strangler fig）、branch-by-abstraction、双写与回填
- [ ] 用「背景 / 决策 / 后果」格式，为你做过的两个真实决策各写一份 ADR

**里程碑（周末）**
- 用 5 分钟把一个过去的架构决策讲成一份 ADR：备选方案、权衡、以及你会怎么迁移。做一次「无授权的影响力」主题的行为面模拟。

**本周对应资源（本仓库）**

| 学习目标 | 去哪里练 / 查阅 |
| --- | --- |
| 权衡表达与模式回忆 | [knowledge/architecture.zh.md](../knowledge/architecture.zh.md) —— 全量题库，限时 |
| STAR 故事：影响力、冲突、模糊性、失败 | [behavioral/star-questions.zh.md](../behavioral/star-questions.zh.md) |
| 领导力风格行为面 | [behavioral/amazon-leadership-principles.zh.md](../behavioral/amazon-leadership-principles.zh.md);[模拟：领导力冲突](../mock-interviews/behavioral-leadership-conflict.zh.md) |
| 保持编码手感 | [knowledge/algorithms.zh.md](../knowledge/algorithms.zh.md) —— 2-3 题 |

### 第 8 周：模拟面试与薄弱点复习

**重点：** 模拟真实流程。找出漏洞，补齐。

**里程碑（周末）**
- 完成一次完整模拟流程（设计 + 深入剖析 + 行为面），并给每一轮都评为通过。哪一轮失败，就在真实面试前额外花两天专攻那个具体漏洞。

**本周对应资源（本仓库）**

| 学习目标 | 去哪里练 / 查阅 |
| --- | --- |
| 完整架构 / 系统设计模拟 | [mock-interviews/](../mock-interviews/) + [评分标准](../mock-interviews/system-design-rubric.zh.md) |
| 未见过的场景练习 | [knowledge/system-design.zh.md](../knowledge/system-design.zh.md);[architecture.zh.md](../knowledge/architecture.zh.md) |
| 编码回炉（门槛更轻但真实） | [knowledge/algorithms.zh.md](../knowledge/algorithms.zh.md) —— 每天 1 道限时题 |
| 行为面模拟 | [behavioral/star-questions.zh.md](../behavioral/star-questions.zh.md) + [amazon-leadership-principles.zh.md](../behavioral/amazon-leadership-principles.zh.md) |
| 目标公司题库 | [interviews/companies/](../interviews/companies/) |
| 就绪清单 | [checklist.md](checklist.zh.md) |

## 最后一周清单

- [ ] 架构设计模拟（45 分钟，未见过的题，边讲边写）
- [ ] 针对某个组件的深入剖析模拟（数据模型、故障模式、扩展）
- [ ] 行为面模拟（30 分钟，影响力 / 冲突 / 失败）
- [ ] 与招聘联系人确认形式（轮次、时长、是否含编码）
- [ ] 把 DDIA 与架构笔记最后再读一遍
- [ ] 把你最好的 5 个 STAR 故事和两份 ADR 再读一遍
- [ ] 为每类面试官准备 5 个深思熟虑的问题
- [ ] 测试硬件：摄像头、麦克风、屏幕共享、白板/画图工具
- [ ] 前一晚睡足 8 小时 —— 不容商量

## 如果时间更少

**压缩 4 周版本：**

- 第 1 周 = 原计划第 1+2 周浓缩。架构风格 + DDIA 第 1-3、5-7 章。
- 第 2 周 = 原计划第 3+4 周浓缩。一致性、事务、缓存、韧性。
- 第 3 周 = 原计划第 5+6 周浓缩。三个经典设计 + 横切关注点。
- 第 4 周 = 原计划第 7+8 周浓缩。ADR、一次完整模拟流程、定稿 STAR 故事。

## 如果时间更多

- 通读《软件架构基础》与《软件架构：困难的部分》。
- 为你当前公司设计并写一份你会真正推动的迁移方案 —— 包括 ADR、发布计划和回滚计划。
- 研究三份公开的故障复盘（Cloudflare、GitHub、AWS 都发过详细的），提炼出每一份所指向的架构决策。
- 读你想加入的团队发布的 5 篇工程博客;记下他们做的权衡，并准备好在面试中引用。
- 搭一个小型参考架构（带 outbox 的事件驱动服务、幂等消费者、可观测性），让你的例子出自你自己的手，而非书本。
