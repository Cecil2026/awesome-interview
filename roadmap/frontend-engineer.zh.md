# 前端工程师面试路线图（8 周计划）

## 适合人群

2-5 年生产经验的中级前端工程师，目标是中大型科技公司的产品工程岗位。你每天都在写 UI 代码，深度使用过至少一个主流框架（React、Vue 或 Angular），并且不用 Google `display: flex` 就能调一个布局 bug。你较弱的方面可能是框架内部原理、压力下的性能审计，以及用面试语言陈述自己的工作。

## 时间投入

- 工作日：1-2 小时
- 周末：4-6 小时
- 合计：8 周约 80-100 小时

## 前置条件

- 你能写现代 JavaScript，不必每 5 分钟翻一次文档
- 你至少用 React、Vue 或 Angular 构建过一个非琐碎的应用
- 你理解 `let`、`const`、`var` 的差异，并能解释为什么重要
- 你用过浏览器 DevTools 调试过 JS bug 和 CSS bug
- 你能独立写出基本算法（二分查找、BFS），哪怕慢一点也行

## 学习计划

### 第 1 周：JavaScript 基础 — 语言层

**重点：** 重建你对 JavaScript 运行时的心智模型，让框架相关的问题感觉轻松。

**算法（目标：15 题）**
- [ ] 数组 — Blind 75 中的 8 道简单题（Two Sum、Best Time to Buy and Sell Stock、Contains Duplicate、Maximum Subarray 等）
- [ ] 字符串 — 5 题简单（Valid Anagram、Valid Palindrome、Reverse String）
- [ ] 哈希表 — 2 题中等（Group Anagrams、Top K Frequent Elements）

**理论**
- [ ] 阅读：《You Don't Know JS Yet》— Scope & Closures
- [ ] 阅读：MDN 中关于事件循环、调用栈、microtask 与 macrotask 的章节
- [ ] 观看：Philip Roberts 的 "What the heck is the event loop anyway?"（JSConf 演讲）

**系统设计 / 领域**
- [ ] 写一页笔记，解释 JavaScript 中 `this` 是如何确定的（4 条规则：默认、隐式、显式、new）

**行为面试准备**
- [ ] 写好你的"自我介绍"（60-90 秒，三个要点：当前岗位、相关背景、为什么想加入这个团队）
- [ ] 从过去 3 年的工作中列出 8 个候选的 STAR 故事

**里程碑（周末）**
- 凭记忆在 5 分钟内讲清闭包、事件循环和 `this` 绑定。不看笔记用 O(n) 解出 Two Sum。

### 第 2 周：异步 JavaScript 与原型

**重点：** 掌握 promise、async/await 以及原型链 — 这些几乎每场前端面试都会出现。

**算法（目标：15 题）**
- [ ] 双指针 — 5 题中等（Container With Most Water、3Sum、Trapping Rain Water）
- [ ] 滑动窗口 — 5 题中等（Longest Substring Without Repeating Characters、Minimum Window Substring）
- [ ] 栈 — 5 题中等（Valid Parentheses、Min Stack、Daily Temperatures）

**理论**
- [ ] 阅读：《You Don't Know JS Yet》— this & Object Prototypes
- [ ] 阅读：MDN 的 "Using Promises" 和 "Async functions" 页面，从头到尾
- [ ] 从零实现：`Promise.all`、`Promise.race`、基础的 `debounce` 和 `throttle`、一个 `deepClone`

**系统设计 / 领域**
- [ ] 不参考任何资料，在纸上画出 `class Dog extends Animal` 的原型链

**行为面试准备**
- [ ] 从清单里打磨 3 个 STAR 故事（每个 90 秒内说完情境/任务/行动/结果）
- [ ] 1 个故事应展示技术深度，1 个体现协作，1 个讲述失败或错误

**里程碑（周末）**
- 在白板上从零实现 `Promise.all`。用 microtask 的角度解释 `.then` 与 `await` 的差异。

### 第 3 周：HTML、CSS 与可访问性

**重点：** 那些纯算法准备会忽略的前端面试部分。

**算法（目标：10 题）**
- [ ] 链表 — 5 题简单/中等（Reverse Linked List、Merge Two Sorted Lists、Linked List Cycle、Remove Nth Node）
- [ ] 树 — 5 题简单（Invert Binary Tree、Maximum Depth、Same Tree、Symmetric Tree）

**理论**
- [ ] 阅读：MDN 的 CSS Layout 章节（深入 flexbox 与 grid）
- [ ] 阅读：Josh Comeau 的 "CSS for JavaScript Developers" 课程大纲（先看概念清单，再查具体细节）
- [ ] 阅读：WCAG 2.1 AA 速查表（聚焦"可感知"和"可操作"原则）

**系统设计 / 领域**
- [ ] 在 30 分钟内用 CSS Grid 从零搭建一个响应式卡片网格，不用任何框架
- [ ] 搭建一个带汉堡菜单的吸顶头部，菜单能打开一个可访问的抽屉（键盘 + 屏幕阅读器友好）
- [ ] 列出 7 个最常见的 ARIA 角色及各自的使用场景

**行为面试准备**
- [ ] 再打磨 2 个 STAR 故事 — 一个关于领导/带新人，一个关于处理模糊性

**里程碑（周末）**
- 看一张 Twitter 卡片截图，在 30 分钟内用 HTML/CSS 复刻。解释为什么 `aria-label` 和 `<label for>` 解决的是不同问题。

### 第 4 周：框架深入（React、Vue 或 Angular）

**重点：** 选一个，深入到能教别人的程度。面试官 30 秒就能闻出浮于表面的框架知识。

**算法（目标：12 题）**
- [ ] 树 — 7 题中等（Binary Tree Level Order Traversal、Validate BST、Lowest Common Ancestor、Construct Tree from Preorder/Inorder）
- [ ] 递归热身 — 5 题（Subsets、Permutations、Combinations）

**理论（React 路线）**
- [ ] 阅读：React 官方文档 "Learn" 部分 — 每一页都读，包括 Escape Hatches
- [ ] 阅读：Dan Abramov 的 "A Complete Guide to useEffect"（原始博客）
- [ ] 阅读：React Fiber 入门介绍（Lin Clark 或 Andrew Clark 那些经典讲解文章中的任意一篇）
- [ ] 实现：用纯 JS 从零写一个自定义的 `useState` 和 `useEffect`

**理论（Vue 路线）**
- [ ] 阅读：Vue 3 官方文档全篇，聚焦 Reactivity in Depth 章节
- [ ] 实现：用 Proxy 写一个极小的响应式系统，支持 `reactive`、`ref`、`effect`

**理论（Angular 路线）**
- [ ] 阅读：Angular 官方文档中关于变更检测、Zone、依赖注入的章节
- [ ] 实现：一个小的 RxJS 管道，用 `combineLatest` 合并两个流并对输入做防抖

**系统设计 / 领域**
- [ ] 凭记忆在白板上画出你所选框架的组件生命周期
- [ ] 用 3 分钟解释你选用框架的核心机制：调和（React）、响应式（Vue）或变更检测（Angular）

**行为面试准备**
- [ ] 把 5 个 STAR 故事都大声练一遍，并录音

**里程碑（周末）**
- 从零实现一个能用的 `useState`（或 Vue 的 `ref`）克隆。在 3 分钟内、不依赖图示地解释你的框架更新周期。

### 第 5 周：Web 性能与工具链

**重点：** Core Web Vitals、bundle 体积、渲染性能。这是高级前端面试拉开差距的地方。

**算法（目标：10 题）**
- [ ] 图 — 5 题中等（Number of Islands、Clone Graph、Pacific Atlantic Water Flow）
- [ ] BFS/DFS — 5 题中等（Word Ladder、Course Schedule、Rotting Oranges）

**理论**
- [ ] 阅读：web.dev 的 "Learn Core Web Vitals" 部分（深入 LCP、INP、CLS）
- [ ] 阅读：《High Performance Browser Networking》— 关于 HTTP/2、HTTP/3 以及浏览器资源加载模型的章节
- [ ] 观看：官方 Chrome for Developers 频道任意一份当前的 Chrome DevTools Performance 面板讲解

**系统设计 / 领域**
- [ ] 用 Lighthouse 审计一个真实的生产网站（你自己的或一个公开站），写一页报告列出前 5 个问题以及你的修复方案
- [ ] 拿一份 webpack/Vite 配置，解释每一项 — 每个插件做什么、为什么需要它
- [ ] 列出渲染策略：CSR、SSR、SSG、ISR、流式 SSR — 各自的适用场景

**行为面试准备**
- [ ] 准备 3 个针对面试官的问题（针对该团队，而非泛泛）

**里程碑（周末）**
- 解释什么会导致 CLS 分数偏高，以及最常见的 4 种修复方式。用 webpack-bundle-analyzer 或同类工具找出任意 bundle 中体积最大的前 3 个元凶。

### 第 6 周：前端系统设计与浏览器原理

**重点：** "设计 Twitter 信息流"，但聚焦前端那一半 — 组件、状态结构、数据获取、缓存、虚拟化。

**算法（目标：8 题）**
- [ ] 动态规划 — 5 题中等（Climbing Stairs、House Robber、Longest Increasing Subsequence、Coin Change、Word Break）
- [ ] 回溯 — 3 题中等（Generate Parentheses、Letter Combinations of a Phone Number、Word Search）

**理论**
- [ ] 阅读：Tali Garsiel 的 "How Browsers Work"（经典长文）
- [ ] 阅读：任意知名备战站点的"前端系统设计"部分（学习结构：需求 → 组件树 → 状态 → API → 优化）
- [ ] 学习：渲染管线（解析 HTML → DOM → CSSOM → 渲染树 → 布局 → 绘制 → 合成）

**系统设计 / 领域**
- [ ] 设计练习：设计一个类似 Slack 的聊天 UI — 组件、消息虚拟化、乐观发送、websocket 重连、未读状态、滚动恢复
- [ ] 设计练习：设计一个类似 Twitter 的无限滚动信息流 — 窗口化策略、分页 cursor vs offset、预取、缓存失效、下拉刷新
- [ ] 设计练习：设计一个自动补全组件 — 防抖、取消、缓存、键盘导航、可访问性
- [ ] 每个设计都写成一页带图示的文档

**行为面试准备**
- [ ] 再过一遍所有 STAR 故事，重点削减语气词与口头禅

**里程碑（周末）**
- 在 45 分钟内白板出一个聊天 UI 设计，涵盖组件、状态、网络与性能。从 URL 到像素，画出浏览器渲染管线。

### 第 7 周：JavaScript 谜题、行为面试与薄弱点专项

**重点：** "刁钻"的面试题以及软实力。

**算法（目标：8 题）**
- [ ] 综合复习 — 从过去 6 周里最薄弱的 2 个类别挑 8 题。每题 25 分钟内重做。

**理论**
- [ ] 专项训练：经典 JS 谜题 — setTimeout/Promise/queueMicrotask 的事件循环顺序、箭头函数 vs 普通函数中的 `this`、提升的边界情况、类型强制转换坑
- [ ] 专项训练：从零实现 — `Function.prototype.bind`、`Array.prototype.map`、`Array.prototype.reduce`、一个简单的事件发射器、一个 curry 函数

**系统设计 / 领域**
- [ ] 模拟设计：随机找一个你没见过的题目，独自在纸上 45 分钟设计完。例如：设计带懒加载的图片画廊、设计带嵌套回复的评论区、设计富文本编辑器工具栏

**行为面试准备**
- [ ] 与同伴进行 1 次行为面试模拟 — 30 分钟，他们问，你冷启动回答
- [ ] 把每一次尴尬的停顿都记下来，下一次用更好的内容填满它们

**里程碑（周末）**
- 不运行代码，正确预测 5 段刁钻事件循环代码的 console 输出。不看笔记完整讲完 5 个 STAR 故事。

### 第 8 周：模拟面试与复习

**重点：** 模拟真实流程，找漏洞，补上。

**算法（目标：5 题模拟）**
- [ ] 在限时（每题 25 分钟）下解 5 道随机中等题，边讲边写，叙述思路过程

**理论**
- [ ] 不学新材料。把第 1-7 周的笔记重读一遍。

**系统设计 / 领域**
- [ ] 与同伴进行 2 次系统设计模拟（各 45 分钟）— 一个聊天 UI 变体，一个信息流变体
- [ ] 每次模拟后写一页自评

**行为面试准备**
- [ ] 与同伴或付费服务进行 1 次完整流程模拟 — 编码 + 系统设计 + 行为面试连着做
- [ ] STAR 故事的最后打磨 — 应当听起来轻松自然

**里程碑（周末）**
- 完成一次完整模拟流程并在每一轮上给自己评为通过。如果做不到，找出失败的那一轮，额外花 2 天死磕它。

## 最后一周清单

- [ ] 与朋友进行编码模拟面试（45 分钟，从没见过的题）
- [ ] 与朋友进行系统设计模拟（45 分钟，前端题目）
- [ ] 与朋友进行行为模拟（30 分钟，5 个 STAR 问题）
- [ ] 把你最好的 5 个 STAR 故事最后再读一遍
- [ ] 与招聘联系人确认面试形式（轮次、时长、工具、允许语言）
- [ ] 为每类面试官（招聘经理、同级、跨级）各准备 5 个问题
- [ ] 测试硬件：摄像头、麦克风、屏幕共享、白板工具（Excalidraw、CoderPad 等）
- [ ] 前一晚睡足 8 小时 — 不容商量

## 如果时间更少

**压缩 4 周版本：**

- 第 1 周 = 原计划第 1+2 周浓缩。跳过原型实现，保留 promise 和事件循环。
- 第 2 周 = 原计划第 3+4 周浓缩。跳过 HTML/CSS 深入，只聚焦你所选框架的内部原理。
- 第 3 周 = 原计划第 5+6 周浓缩。跳过浏览器内核深入，聚焦 Core Web Vitals 与 2 个系统设计练习。
- 第 4 周 = 原计划第 7+8 周浓缩。1 次模拟面试，死磕薄弱的算法类别，敲定 STAR 故事。

**压缩 2 周版本（应急）：**

- 第 1 周：30 道 LeetCode 中等题，覆盖数组/字符串/树/图，框架内部原理复习，3 个 STAR 故事。
- 第 2 周：1 个前端系统设计练习，1 次模拟面试，敲定 5 个 STAR 故事，硬件检查。

## 如果时间更多

- 再加一个框架。如果你会 React，就用 Vue 或 Svelte 构建一些非琐碎的东西。面试官喜欢能跨范式比较的候选人。
- 给开源 UI 库（Radix、shadcn、Headless UI、你选用的框架）提交一个非琐碎的 PR。一个真实 PR 胜过 10 份教程。
- 从头到尾读完 Adam Wathan 与 Steve Schoger 的《Refactoring UI》。前端面试官越来越多地考察视觉品位。
- 搭一个小型设计系统：按钮、输入、模态框、下拉、表格。把它文档化。这既是作品集又是学习项目。
- 学习 WebGL 或 Canvas 的基础 — 哪怕是浅层认知，也能让你在图形密集型产品的面试中脱颖而出。
