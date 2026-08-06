# 前端面试题

100 道高频前端题，覆盖 HTML/CSS、JavaScript/TypeScript、框架（React/Angular/Vue）、性能、测试、可访问性、网络和构建工具。

---

### 1. 盒模型与 `box-sizing: border-box`

**频率：** 高

**题目：** 请解释 CSS 盒模型，并说明 box-sizing 的两个取值有什么区别：(1) content-box（规范默认）下 width 只包含内容区，padding 和 border 会让渲染尺寸变大；(2) border-box 下 width/height 如何包含 padding 和 border，为什么它对 grid/flex 布局更可预期。同时谈谈为什么现代 reset 常全局应用 border-box、margin 位于盒外并会发生块元素间的垂直合并、box-sizing 只有显式声明 inherit 才会继承，以及如何用 DevTools 的盒图调试意外尺寸。

**答案：** CSS 盒模型把每个元素包裹在 content、padding、border 和 margin 盒里。默认（`content-box`）下，`width` 只设内容区，所以 padding 和 border 会让渲染尺寸变大。`border-box` 让 `width`/`height` 包含 padding 和 border，对 grid/flex 布局更可预期。多数现代 reset 全局应用 `*, *::before, *::after { box-sizing: border-box; }`。

**要点：**
- `content-box` 是规范默认；`border-box` 是实用默认
- Margin 在盒外，块元素之间垂直方向会合并
- `box-sizing` 只有显式声明 `inherit` 才会继承
- 用 DevTools 计算样式的盒图调试尺寸意外

---

### 2. 块级 vs 行内 vs 行内块

**频率：** 高

**题目：** 请对比块级、行内和行内块三种 display 类型的排版行为：(1) 块级元素如何另起一行、占满宽度并自由设置宽高与内外边距；(2) 行内元素如何随文本流动、忽略宽高、只接受水平方向的 padding/margin，并遵守 line-height、在标签间产生空白；(3) 行内块为什么能在文字间排列同时接受盒尺寸。也请说明替换型行内元素（img、input）的特殊性、父元素 display: flex/grid 对子元素的影响，以及现代布局如何用 flex/grid 取代行内块技巧。

**答案：** 块级元素（`div`、`p`、`section`）另起一行并占满可用宽度；可自由设宽高/外边距/内边距。行内元素（`span`、`a`、`em`）随文本流动，忽略宽高，只在视觉上接受水平 padding/margin。行内块在周围文字间排列但接受盒尺寸，flexbox 出现前常用于按钮或徽章。

**要点：**
- 行内元素遵守 `line-height` 并在标签间产生空白
- 父元素 `display: flex/grid` 让子元素表现为块级参与者
- 替换型行内元素（`img`、`input`）虽是行内但接受宽高
- 现代布局用 flex/grid 替代行内块技巧

---

### 3. Flexbox 轴与 flex-grow/shrink/basis

**频率：** 高

**题目：** 请讲解 Flexbox 的轴模型与 flex 简写：(1) 主轴与交叉轴的概念，justify-content、align-items/align-self 分别沿哪个轴对齐；(2) flex: <grow> <shrink> <basis> 中 grow、shrink、basis 各自的含义，以及 flex: 1 等价于什么。另外请谈谈 flex-direction 如何切换主轴、flex-wrap 配合 align-content 做多行对齐、flex 中的 gap，以及为什么给 flex 子元素设置 min-width: 0 能防止文本溢出撑爆布局。

**答案：** flex 容器有主轴（默认 row）和交叉轴。`justify-content` 沿主轴对齐；`align-items`/`align-self` 沿交叉轴。简写 `flex: <grow> <shrink> <basis>` 控制项如何分配空闲空间：`grow` 分剩余空间，`shrink` 分溢出，`basis` 是应用 grow/shrink 前的假设起始尺寸。`flex: 1` 是 `1 1 0%` 的简写。

**要点：**
- `flex-direction: row-reverse/column` 切换主轴
- `flex-wrap: wrap` 让行换行；配 `align-content` 做多行交叉对齐
- `gap` 在 flex 中可用（现代浏览器），避免负 margin 技巧
- flex 子元素 `min-width: 0` 防止文本溢出撑爆布局

---

### 4. 定位：static/relative/absolute/fixed/sticky

**频率：** 高

**题目：** 请说明 CSS 定位的五种取值：(1) static 为默认且忽略 top/left/right/bottom；(2) relative 保留原空间但视觉偏移并为绝对定位子元素创建上下文；(3) absolute 脱离文档流、相对最近已定位祖先定位；(4) fixed 相对视口定位；(5) sticky 如何按滚动阈值在 relative 与 fixed 间切换。请一并谈谈祖先的 transform/filter/will-change 会困住 fixed 元素这一坑、sticky 需要可滚动祖先和定义的 top/bottom、absolute 元素不设尺寸时会折成内容宽度，以及带 z-index 的定位元素会创建堆叠上下文。

**答案：** `static` 是默认且忽略 `top/left/right/bottom`。`relative` 保留空间但视觉偏移并为 absolute 子元素创建定位上下文。`absolute` 把元素移出流，相对最近的已定位祖先定位。`fixed` 相对视口定位（或带 transform 的祖先——常见坑）。`sticky` 按滚动阈值在 relative 和 fixed 间切换。

**要点：**
- 祖先有 `transform`、`filter` 或 `will-change` 会困住 `fixed` 元素
- `sticky` 需要可滚动祖先和定义的 `top`/`bottom`
- absolute 元素不设尺寸时折成内容宽度
- 带 `z-index` 的定位元素创建堆叠上下文

---

### 5. 优先级规则与 `!important`

**频率：** 高

**题目：** 请讲解 CSS 优先级（specificity）的计算规则：(1) 由 inline 样式、ID、类/属性/伪类、元素/伪元素组成的四部分元组如何比较、平局如何看源顺序；(2) !important 如何跳到自己的层并覆盖正常声明，以及 user-agent、user、author 各起源加上 important 与 inline 的排序。也请谈谈 * 与 :where() 优先级为零、:is() 和 :not() 取参数中最高优先级，以及为什么应优先用 @layer 级联层而非打优先级军备竞赛、除工具/第三方覆盖外避免 !important。

**答案：** 优先级是四部分元组：inline 样式、ID、类/属性/伪类、元素/伪元素。元组高者胜；平局看后定义。`!important` 跳到自己的层覆盖正常声明（user-agent < user < author < author-important < inline-important）。`@layer`（级联层）提供干净的排序机制，让多数 `!important` 用法过时。

**要点：**
- 通配选择器 `*` 与 `:where()` 优先级为零
- `:is()` 和 `:not()` 取参数中最高优先级
- 优先用级联层而非优先级军备竞赛
- 工具框架或第三方覆盖外避免 `!important`

---

### 6. 响应式：媒体查询、`clamp()`、容器查询

**频率：** 高

**题目：** 请讲解响应式设计的三种手段：(1) 媒体查询如何适应视口或设备特性（如 min-width、prefers-color-scheme、prefers-reduced-motion）；(2) clamp(min, preferred, max) 如何不靠断点产生流体值；(3) 容器查询（@container）如何让组件响应父尺寸实现组件级响应。请一并谈谈移动优先用 min-width、桌面优先用 max-width、用 container-type: inline-size 定义容器、clamp() 配合视口单位，以及为可访问性尊重 prefers-reduced-motion。

**答案：** 媒体查询适应视口或设备特性（`@media (min-width: 768px)`、`(prefers-color-scheme)`、`(prefers-reduced-motion)`）。`clamp(min, preferred, max)` 不靠断点产生流体值。容器查询（`@container`）让组件响应父尺寸，实现真正的组件级响应。

**要点：**
- 移动优先用 `min-width` 查询；桌面优先用 `max-width`
- 用 `container-type: inline-size` 定义容器
- `clamp()` 与视口单位配合：`clamp(1rem, 2vw, 1.5rem)`
- 为可访问性尊重 `prefers-reduced-motion`

---

### 7. 用于 SEO/a11y 的语义化 HTML

**频率：** 高

**题目：** 请说明语义化 HTML 对 SEO 和可访问性的价值：(1) header、nav、main、article、section、aside、footer、figure、time 等语义元素如何向浏览器、辅助技术和爬虫传达结构；(2) 它们如何改善可访问性（landmark、heading）和 SEO（更丰富的文档大纲），以及每页一个 <h1> 且 heading 不跳级。请一并谈谈动作用按钮、导航用链接，每个表单输入要 label，避免用 div role=button 而用真 button，以及微数据/JSON-LD 在语义之上加结构化数据。

**答案：** 语义化元素（`header`、`nav`、`main`、`article`、`section`、`aside`、`footer`、`figure`、`time`）向浏览器、辅助技术和爬虫传达结构。它们改善可访问性（landmark、heading）和 SEO（更丰富的文档大纲）。每页用一个 `<h1>` 并保持 heading 层级不跳级。

**要点：**
- 动作用按钮，导航用链接
- 每个表单输入要 `<label for>` 或包裹的 label
- 避免 `<div role="button">`——用真 `<button>`
- 微数据/JSON-LD 在语义之上加结构化数据

---

### 8. `var` vs `let` vs `const`；提升与 TDZ

**频率：** 高

**题目：** 请对比 var、let、const 以及提升与 TDZ：(1) var 的函数作用域、被提升并初始化为 undefined；(2) let/const 的块作用域、被提升但未初始化，在声明前访问抛 ReferenceError（暂时性死区）；(3) const 防重新绑定但不防对象内容变更，以及优先级顺序。请一并谈谈 var 在全局对象上创建属性而 let/const 不会、函数声明完全提升而函数表达式不会、TDZ 的存在范围，以及 const 数组/对象仍可变、浅不可变用 Object.freeze。

**答案：** `var` 函数作用域、被提升并初始化为 `undefined`。`let`/`const` 块作用域、被提升但未初始化——在声明前访问抛 `ReferenceError`（暂时性死区）。`const` 防重新绑定但不防对象内容变更。优先 `const`，然后 `let`；遗留代码用 `var`。

**要点：**
- `var` 在全局对象上创建属性；`let`/`const` 不会
- 函数声明完全提升；函数表达式不会
- TDZ 从块开始到声明行存在
- `const` 数组/对象仍可变——浅不可变用 `Object.freeze`

---

### 9. 闭包 + 经典循环 bug

**频率：** 高

**题目：** 请解释闭包及经典循环 bug：(1) 什么是闭包及它与词法环境的捆绑；(2) 为什么 for (var i...) 里的 setTimeout 回调会输出 3 3 3、根因是共享同一个 i，以及用 let（每次迭代新绑定）或 IIFE 如何修复。请一并谈谈闭包如何驱动模块模式、部分应用和 React hook，useEffect 中因缺 deps 造成的陈旧闭包，闭包保留外层作用域引用导致的内存泄漏，以及 ES module 如何减少把闭包当命名空间的模式。

**答案：** 闭包是与其词法环境捆绑的函数。经典 `for (var i = 0; i < 3; i++) setTimeout(() => console.log(i))` 输出 `3 3 3`，因为所有回调共享一个 `i`。把 `var` 换成 `let`（每次迭代得新绑定）或包在 IIFE 里修复。

```js
for (let i = 0; i < 3; i++) setTimeout(() => console.log(i)); // 0 1 2
```

**要点：**
- 闭包驱动模块模式、部分应用和 React hook
- `useEffect` 中陈旧闭包由缺 deps 引起
- 内存泄漏：闭包保留外层作用域引用
- ES module 给显式作用域减少把闭包当命名空间的模式

---

### 10. `this` 绑定规则

**频率：** 高

**题目：** 请讲解 this 的绑定规则及其优先级：(1) new 把 this 绑到新实例；(2) 显式 call/apply/bind 设置 this；(3) 方法调用 obj.fn() 绑到 obj；(4) 否则是全局对象（严格模式下为 undefined）；(5) 箭头函数没有自己的 this，而是从外围作用域词法继承，为何适合做回调。请一并谈谈类方法不自动绑定（用箭头字段或 .bind）、forEach/map 的 thisArg 第二参数、严格模式防意外全局污染，以及 bind 返回新函数且重复 bind 只尊重第一个。

**答案：** 优先级顺序：`new` 把 `this` 绑到新实例；显式 `call`/`apply`/`bind` 设置它；方法调用（`obj.fn()`）绑到 `obj`；否则是全局对象（严格模式下是 `undefined`）。箭头函数没自己的 `this`——从外围作用域词法继承，所以是回调的理想选择。

**要点：**
- 类方法不自动绑定；用箭头字段或 `.bind`
- `forEach`/`map` 接受 `thisArg` 第二参数
- 严格模式防意外全局污染
- `bind` 返回新函数；重复 `bind` 只尊重第一个

---

### 11. 原型与原型链

**频率：** 高

**题目：** 请解释原型与原型链：(1) 每个对象的内部 [[Prototype]]（通过 Object.getPrototypeOf 访问）如何形成以 null 结束的链、属性查找如何走链；(2) Object.create(proto) 的作用；(3) class 语法作为基于原型继承的糖，extends 如何设链、super 如何调父构造器/方法。请一并谈谈 instanceof 走原型链检查 .prototype、hasOwnProperty（或 Object.hasOwn）跳过继承属性、修改 Array.prototype 是反模式，以及原型方法共享而实例字段每对象独有。

**答案：** 每个对象有内部 `[[Prototype]]`（通过 `Object.getPrototypeOf` 访问），形成以 `null` 结束的链。属性查找走链。`Object.create(proto)` 创建有特定原型的对象。`class` 语法是基于原型继承的糖；`extends` 设链，`super` 调父构造器/方法。

**要点：**
- `instanceof` 走原型链检查 `.prototype`
- `hasOwnProperty`（或 `Object.hasOwn`）跳过继承属性
- 修改 `Array.prototype` 是臭名昭著的反模式
- 原型方法共享；实例字段每对象独有

---

### 12. 事件循环：宏任务 vs 微任务

**频率：** 高

**题目：** 请讲解事件循环中宏任务与微任务的区别：(1) JS 单线程下事件循环如何排空一个宏任务（脚本、setTimeout、I/O、UI 事件）、再跑完所有微任务（Promise、queueMicrotask、MutationObserver）、然后渲染、再重复；(2) 微任务不断入队会饿死渲染、长同步工作会阻塞一切。请一并谈谈 Promise.resolve().then() 在 setTimeout(..., 0) 之前跑、requestAnimationFrame 在绘制前微任务后跑、低优先级工作用 scheduler.postTask 或 requestIdleCallback，以及 Web Worker 把 CPU 密集工作卸载出主线程。

**答案：** JS 是单线程，事件循环排空一个宏任务（脚本、`setTimeout`、I/O、UI 事件），然后跑所有微任务（Promise、`queueMicrotask`、`MutationObserver`）直到队列空，然后渲染，然后重复。微任务若不断入队会饿死渲染；长同步工作阻塞一切。

**要点：**
- `Promise.resolve().then()` 在 `setTimeout(..., 0)` 之前跑
- `requestAnimationFrame` 在绘制前、微任务后跑
- 低优先级工作用 `scheduler.postTask` 或 `requestIdleCallback`
- Web Worker 把 CPU 密集工作从主线程卸载

---

### 13. Promise vs async/await；错误处理

**频率：** 高

**题目：** 请对比 Promise 与 async/await 并讲解错误处理：(1) async/await 作为 Promise 的语法糖如何读起来顺序、async 函数内 throw 如何变成被拒 Promise、await 如何解包已兑现值或在拒绝时重新抛；(2) 为什么应始终用 try/catch 包 await 或附加 .catch，以及未处理拒绝的后果。请一并谈谈 async 函数始终返回 Promise、await 暂停的是函数而非线程、用 Promise.all 并行化独立 await，以及 await 周围的 try/catch 同时捕获同步抛和拒绝。

**答案：** `async/await` 是 Promise 的语法糖，读起来顺序。在 async 函数内 throw 变成被拒 Promise；`await` 解包已兑现值或在拒绝时重新抛。始终用 `try/catch` 包 await 或附加 `.catch`。未处理拒绝默认在 Node ≥15 让其崩溃并在浏览器 DevTools 浮现。

**要点：**
- `async` 函数始终返回 Promise
- `await` 暂停函数，不是线程
- 用 `Promise.all` 并行化独立 await
- `await` 周围的 `try/catch` 同时捕获同步抛和拒绝

---

### 14. `Promise.all` vs `allSettled` vs `race` vs `any`

**频率：** 高

**题目：** 请对比 Promise.all、allSettled、race、any 四种组合方法：(1) all 在全部成功时以数组解决、首次失败即拒绝（fail-fast）；(2) allSettled 等每个 Promise 落定并返回 {status, value|reason} 数组；(3) race 以首个落定（兑现或拒绝）的 Promise 落定；(4) any 以首个兑现解决、仅全部失败时以 AggregateError 拒绝。请一并谈谈用 race 配超时 Promise 做取消、allSettled 适合部分失败可接受的并行调用、any 适合从多个镜像取，以及它们都不取消待定 Promise（应用 AbortController）。

**答案：** `all` 在全部成功时以数组解决，首次失败时拒绝（fail-fast）。`allSettled` 等每个 Promise 并返回 `{status, value|reason}` 数组——当你需要全部结果不论成败时用。`race` 以首个落定的 Promise（兑现或拒绝）落定。`any` 以首个兑现解决，仅全部失败时以 `AggregateError` 拒绝。

**要点：**
- 把 `Promise.race` 与超时 Promise 组合做取消
- `allSettled` 理想用于部分失败 OK 的并行 API 调用
- `any` 适合从多个镜像取
- 都不取消待定 Promise——那用 `AbortController`

---

### 15. 防抖 vs 节流（都写）

**频率：** 高

**题目：** 请对比防抖与节流并各自实现一个：(1) 防抖如何在最后一次调用后 N ms 才延迟执行（适合即输即搜）；(2) 节流如何确保每 N ms 至多执行一次（适合滚动/resize），以及为什么二者解决不同问题、不可互换。请一并谈谈前缘与尾缘对 UX 感觉的影响、用 AbortController 取消待防抖的 fetch、requestAnimationFrame 作为绘制限定工作的自然节流，以及生产中用 lodash/underscore 实现处理边缘情况。

**答案：** 防抖在最后调用后 N ms 才延迟执行（适合即输即搜）。节流确保每 N ms 至多执行一次（适合滚动/resize）。它们解决不同问题，不可互换。

```js
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const throttle = (fn, ms) => { let last = 0; return (...a) => { const n = Date.now(); if (n - last >= ms) { last = n; fn(...a); } }; };
```

**要点：**
- 前缘 vs 尾缘改变 UX 感觉
- `AbortController` 可取消待防抖 fetch
- `requestAnimationFrame` 是绘制限定工作的自然节流
- 生产用 lodash/underscore 实现处理边缘情况

---

### 16. 相等：`==` vs `===` vs `Object.is`；NaN

**频率：** 高

**题目：** 请对比 ==、=== 与 Object.is 并谈 NaN：(1) === 的严格相等（同类型同值）；(2) == 的类型强制及惊人规则（如 [] == false 为真）；(3) Object.is 与 === 的区别（把 NaN === NaN 当真、把 +0 与 -0 区分），以及 NaN 是唯一不等于自身的值、用 Number.isNaN 测试。请一并谈谈应始终用 === 除非故意强制、null == undefined 为真但两者都 === null 为假、React 的 useState 用 Object.is 做相等性检查，以及 Number.isNaN 比会强制的全局 isNaN 更安全。

**答案：** `===` 是严格相等（同类型、同值）。`==` 用有惊人规则的类型强制（`[] == false` 为真）。`Object.is` 像 `===` 但把 `NaN === NaN` 当真且 `+0 !== -0`。`NaN` 是唯一不等于自身的值；用 `Number.isNaN(x)` 测试。

**要点：**
- 始终用 `===` 除非故意强制
- `null == undefined` 为真；两者都 `=== null` 为假
- React 的 `useState` 和 `Object.is` 用同等性检查
- `Number.isNaN` 比全局 `isNaN`（会强制）更安全

---

### 17. TS：`interface` vs `type`

**频率：** 高

**题目：** 请对比 TypeScript 的 interface 与 type：(1) 两者都能描述对象形状；(2) interface 支持声明合并、是公开 API/对象契约的惯用法；(3) type 别名可描述并集、交集、原语、tuple、映射类型，更具表达力但不可合并，以及如何按所需能力选型。请一并谈谈大并集中 interface 扩展类型检查可能更快、type 别名可通过条件类型自引用、两者都支持泛型，以及声明合并对增强库至关重要。

**答案：** 两者都描述对象形状。`interface` 支持声明合并，是公开 API/对象契约的惯用法。`type` 别名可描述并集、交集、原语、tuple、映射类型——严格更具表达力但不可合并。性能可比；按所需能力选。许多团队默认全用 `type`。

**要点：**
- 大并集中 `interface` 扩展类型检查可能更快
- `type` 别名可通过条件类型自引用
- 两者支持泛型
- 声明合并对增强库至关重要

---

### 18. React VDOM 与协调

**频率：** 高

**题目：** 请解释 React 的虚拟 DOM 与协调（reconciliation）机制：状态变化时 React 如何构建新树、与前一棵树做 diff 并提交最小的 DOM 变更？请具体说明协调用到的启发式规则（1）不同元素类型如何处理（2）同类型元素如何处理 props（3）key 在列表中扮演什么角色，并谈谈 Fiber 架构为什么让协调可中断以支持并发渲染。

**答案：** React 把 UI 描述为元素树；状态变化时构建新树并对前一树 diff（协调），提交最小 DOM 变更。启发式：不同元素类型替换子树；同类型更新 props；key 标识跨渲染的列表项。Fiber（16 起）让协调可中断以支持并发渲染。

**要点：**
- 协调因启发式是 O(n)，不是完整树 diff
- 错 key 在列表中引发微妙状态 bug
- 并发渲染可丢弃在途工作
- React 19 加编译器驱动的记忆化

---

### 19. `useState` vs `useReducer`

**频率：** 高

**题目：** 在 React 中，你会如何在 useState 和 useReducer 之间做选择？请说明各自适用的场景——比如独立原语或小对象状态，以及下个状态依赖前一状态、多个子值一起变化或状态转换遵循状态机模式的情况——并解释 reducer 函数为什么是纯且可测的，以及 dispatch 身份稳定意味着什么。

**答案：** `useState` 理想用于独立原语或小对象状态。`useReducer` 在下个状态依赖前一状态、多个子值一起变，或转换遵循状态机模式时闪光。Reducer 函数是纯且可测；dispatch 身份稳定所以在 deps 中安全。

**要点：**
- 懒初始化：`useState(() => expensive())`
- 函数式更新：`setX(prev => prev + 1)` 避免陈旧闭包
- Reducer 与 Context 配对做应用级状态
- 复杂需求用 XState 或 Zustand

---

### 20. `useEffect` deps 与陈旧闭包

**频率：** 高

**题目：** 请解释 useEffect 的依赖数组与陈旧闭包（stale closure）问题：为什么 effect 会捕获创建时那次渲染的变量、缺失依赖如何导致读到过时的值、exhaustive-deps lint 规则的作用，以及你会如何修复——是把所有引用到的响应式值都放进依赖，还是用 ref 或函数式更新读取最新值。

**答案：** Effect 捕获其创建时渲染的变量。缺 deps 引起读过时值的陈旧闭包。exhaustive-deps lint 规则抓这个。修复：包含所有引用的响应值，或用 ref/函数式更新读最新而不重新订阅。

**要点：**
- 空 deps `[]` = mount 一次跑（卸载时清理）
- 清理在下个 effect 前和卸载时跑
- React 18 Strict Mode 开发跑 effect 两次浮现 bug
- React 19 编译器减少手动 dep 管理

---

### 21. `useMemo` vs `useCallback`

**频率：** 高

**题目：** 请比较 useMemo 和 useCallback：它们各自记忆化的是什么（计算值 vs 函数引用），为什么说 useCallback 是 useMemo 的语法糖，以及分别在什么场景下使用（避免昂贵重计算、为子组件的 memo 或 effect 依赖保持引用身份稳定），并谈谈 React 19 编译器对它们的影响。

**答案：** `useMemo(fn, deps)` 记忆化计算值；`useCallback(fn, deps)` 记忆化函数引用（`useMemo(() => fn, deps)` 的糖）。用于避免昂贵重计算或为子 memo/effect deps 保持引用身份稳定。React 19 编译器常让这些不必要。

**要点：**
- 记忆化有开销——别记忆化平凡值
- deps 错则陈旧闭包风险
- 与 `React.memo` 配跳过子重渲染
- 加记忆化前剖析

---

### 22. 列表 key；index-key 反模式

**频率：** 高

**题目：** 请解释 React 列表中 key 的作用以及用数组索引作 key 的反模式：key 如何帮助 React 跨渲染匹配列表项、为什么静态列表用索引没问题、以及在重排/插入/删除时用索引会导致什么样的状态错乱，正确做法又是什么。

**答案：** Key 标识跨渲染的项让 React 匹配。静态列表用数组索引可，但重排/插入/删除时坏——附在行的状态跟着索引，不跟项。用稳定项 ID。

**要点：**
- Key 仅在兄弟间唯一
- 别在 render 内随机生成 key
- React 在开发时缺 key 警告
- Key 也影响 CSS 动画和表单状态

---

### 23. 受控 vs 非受控输入

**频率：** 高

**题目：** 请比较受控输入与非受控输入：受控输入如何从 React 状态派生 value 并通过 onChange 更新（单一真相源、易校验，但每次按键都重渲染），非受控输入如何在 DOM 中自持状态并通过 ref 和 defaultValue 访问，以及你会在什么场景下分别选择哪一种。

**答案：** 受控输入从 React 状态派生 `value` 并通过 `onChange` 更新——单一真相源、易校验，但每次按键重渲染。非受控输入在 DOM 中持有自己状态，通过 ref（初始值用 `defaultValue`）访问。普通表单非受控更简单；需对按键反应时受控更好。

**要点：**
- React-hook-form 用非受控输入求性能
- 文件输入实际上始终非受控
- `defaultValue`/`defaultChecked` 初始化非受控
- 别让单个输入在受控/非受控间切换

---

### 24. SSR vs SSG vs CSR vs ISR

**频率：** 高

**题目：** 请比较 SSR、SSG、CSR 和 ISR 这几种渲染策略：（1）CSR 发壳加 JS 在客户端取数渲染的首绘与后续导航特点（2）SSR 每请求渲染 HTML 的适用场景与成本（3）SSG 部署时预建页的优劣（4）ISR 如何发缓存页并按计划重验证，并谈谈 Server Components 带来的新维度。

**答案：** CSR 发壳 + JS 在客户端取并渲染——首绘慢、后续导航快。SSR 每请求渲染 HTML——适合个性化/SEO 内容但服务器成本高。SSG 部署时预建页——发最快，但重建前陈旧。ISR（Next.js）发缓存页并按计划重验证——SSR+SSG 最佳。Server Components 加第四维：每组件服务器渲染。

**要点：**
- 流式 SSR 数据解决时发 HTML 块
- 边缘 SSR 在用户附近跑求低延迟
- SSG 只对构建时已知的内容工作
- ISR 重验证策略需小心避免缓存雪崩

---

### 25. 关键渲染路径

**频率：** 高

**题目：** 请解释关键渲染路径（Critical Rendering Path）：浏览器从 HTML 建 DOM、从 CSS 建 CSSOM、组合成渲染树、布局、绘制、合成层的完整流程，CSS 与同步 JS 分别如何阻塞，以及你会用哪些手段（最小化关键资源、延迟非关键 JS、内联关键 CSS、脚本用 async/defer）来优化。

**答案：** 浏览器从 HTML 建 DOM、从 CSS 建 CSSOM、组合成渲染树、布局（几何）、绘制（像素）、合成层。CSS 阻渲染；同步 JS 阻解析器。通过最小化关键资源、延迟非关键 JS、内联关键 CSS、脚本用 async/defer 优化。

**要点：**
- `defer` 在解析后、`DOMContentLoaded` 前跑
- `async` 到达就跑（无序）
- 预加载关键资源，预连第三方源
- DevTools 性能面板可视化路径

---

### 26. Core Web Vitals（LCP、INP、CLS）

**频率：** 高

**题目：** 请解释 Core Web Vitals 三项指标：LCP（最大内容绘制）测什么、目标值是多少，INP（交互到下次绘制）如何在 2024 年替代 FID、测量什么、目标值，以及 CLS（累计布局偏移）测什么、目标值，并说明它们为什么作为 Google 的排名信号。

**答案：** LCP（最大内容绘制）测加载速度——目标 <2.5s。INP（交互到下次绘制）2024 替代 FID，跨所有交互测响应——目标 <200ms。CLS（累计布局偏移）测视觉稳定——目标 <0.1。Google 用它们作排名信号。

**要点：**
- LCP 杀手：渲染阻塞 CSS、大图、慢服务器
- INP 杀手：长任务、重事件处理器、同步布局
- CLS 杀手：缺图尺寸、晚注入广告/横幅
- `web-vitals` 库报现场数据

---

### 27. 代码切分与懒加载

**频率：** 高

**题目：** 请解释代码切分与懒加载：如何按路由、特性或组件切分 bundle 让用户只下载所需，动态 import() 作为原语以及框架封装（React.lazy、Next.js dynamic、Angular loadComponent）如何配合 Suspense，并谈谈如何注意瀑布加载和用预取优化。

**答案：** 按路由、特性或组件切 bundle，让用户只下所需。动态 `import()` 是原语；框架包装（`React.lazy`、Next.js dynamic、Angular `loadComponent`）处理 Suspense。注意瀑布加载——空闲时预取可能的下一路由。

**要点：**
- 按路由切分是最高影响起点
- 用 `<link rel="prefetch">` 或框架提示预取
- 别过度切分——太多小块伤 HTTP 开销
- Bundle 分析器（webpack-bundle-analyzer、rollup-plugin-visualizer）指导决策

---

### 28. HTTP 缓存：Cache-Control、ETag、Last-Modified

**频率：** 高

**题目：** 请解释 HTTP 缓存机制：Cache-Control 的各类指令（max-age、s-maxage、public/private、immutable、no-store、stale-while-revalidate）如何治理新鲜度，过期后如何用 ETag 配 If-None-Match 或 Last-Modified 配 If-Modified-Since 做条件重验证并返回 304，以及哈希命名的静态资源该用什么缓存头。

**答案：** `Cache-Control` 指令治理新鲜度：`max-age`、`s-maxage`、`public`/`private`、`immutable`、`no-store`、`stale-while-revalidate`。过期后，条件重验证用 `ETag`（内容哈希）配 `If-None-Match`，或 `Last-Modified` 配 `If-Modified-Since`，返回 304 跳 body。哈希命名的静态资源用 `Cache-Control: public, max-age=31536000, immutable`。

**要点：**
- `stale-while-revalidate` 后台刷新时发陈旧
- HTML 应 `no-cache`（每次重验证）让部署传播
- CDN 与浏览器 `max-age` 分别尊重 `s-maxage`
- `Vary` 头告诉缓存哪些请求头区分响应

---

### 29. CORS 预检与凭证

**频率：** 高

**题目：** 请解释 CORS 的预检与凭证：浏览器在什么情况下会对跨源请求发预检 OPTIONS（自定义头、非 GET/POST/HEAD、JSON body），服务器必须以哪些响应头（Access-Control-Allow-Origin、-Methods、-Headers）响应，携带凭证时为什么 -Credentials: true 必须配具体源而不能用 *，以及 fetch 发 cookie 时要如何设置。

**答案：** 浏览器对"非简单"跨源请求（自定义头、非 GET/POST/HEAD、JSON body）发预检 `OPTIONS`。服务器必须以 `Access-Control-Allow-Origin`、`-Methods`、`-Headers` 响应，（凭证）则 `-Credentials: true` 配具体源（不是 `*`）。发 cookie 时 fetch 设 `credentials: 'include'`。

**要点：**
- 简单请求跳预检（form-encoded POST、GET）
- `Access-Control-Max-Age` 缓存预检结果
- `SameSite` cookie 仍在 CORS 之上应用
- 错误：返 `*` 配凭证——浏览器拒

---

### 30. XSS、CSRF、点击劫持缓解

**频率：** 高

**题目：** 请说明 XSS、CSRF 和点击劫持的缓解手段：（1）XSS 方面为什么不能用 innerHTML 渲染不信任输入、如何转义、CSP、DOMPurify 清洗与框架绑定渲染（2）CSRF 方面 SameSite cookie 加 CSRF token 及双提交 cookie 模式（3）点击劫持方面 X-Frame-Options 与 CSP frame-ancestors。

**答案：** XSS：永不 `innerHTML` 不信输入；渲染时转义；用 CSP；用 DOMPurify 清洗；优先框架绑定渲染。CSRF：SameSite cookie + 状态变更请求的 CSRF token；双提交 cookie 模式。点击劫持：`X-Frame-Options: DENY` 或 CSP `frame-ancestors 'none'`。

**要点：**
- 存储型 XSS 比反射型更糟
- Trusted Types API 助强制安全 DOM sink
- CSRF 只影响浏览器发的凭证（cookie、basic auth）
- React/Vue/Angular 默认转义——`dangerouslySetInnerHTML` 是选入

---

### 31. CSS Grid：template-areas、显式 vs 隐式

**频率：** 中

**题目：** 请解释 CSS Grid 的核心概念：(1) grid-template-rows/columns 定义的显式网格与超出部分（或用 grid-auto-rows）形成的隐式网格的区别，以及如何用 grid-auto-rows/columns 和 grid-auto-flow 控制隐式轨道；(2) grid-template-areas 配合 grid-area 如何用命名布局分配子元素。也请谈谈 repeat(auto-fit, minmax()) 如何不用媒体查询就建响应式网格、fr 单位的作用、place-items 简写，以及 subgrid 让嵌套网格继承父轨道。

**答案：** `grid-template-rows/columns` 定义显式网格；放在其外的（或通过 `grid-auto-rows`）创建隐式网格。`grid-template-areas` 让你用 ASCII 名字画布局，然后通过 `grid-area` 分配子元素。隐式轨道用 `grid-auto-rows/columns` 设尺寸、用 `grid-auto-flow` 设放置方向。

```css
.container { grid-template-areas: "nav main" "nav aside"; }
.nav { grid-area: nav; }
```

**要点：**
- `repeat(auto-fit, minmax(200px, 1fr))` 不用媒体查询就建响应式网格
- `fr` 分配固定轨道之外的剩余空间
- `place-items` 是 align/justify-items 的简写
- Subgrid（现已广泛支持）让嵌套网格继承父轨道

---

### 32. CSS 级联与继承

**频率：** 中

**题目：** 请解释 CSS 级联与继承的区别：(1) 级联如何按起源和重要性、级联层、优先级、源顺序依次决定哪条声明胜出；(2) 继承机制——哪些属性（color、font、line-height）默认继承、哪些布局属性（margin、padding、border）不继承，以及如何用 inherit、initial、unset、revert 选入特定行为。也请谈谈 all: unset 重置组件、自定义属性默认继承、级联层在优先级之上引入的一层，以及 user-agent 样式表是最低优先级起源。

**答案：** 级联按起源和重要性、然后级联层、然后优先级、然后源顺序决定哪条声明胜出。继承是另一回事：某些属性（color、font、line-height）默认继承；布局属性（margin、padding、border）不继承。用 `inherit`、`initial`、`unset` 或 `revert` 选入特定行为。

**要点：**
- `all: unset` 用于重置单个组件
- 自定义属性（`--foo`）始终继承除非覆盖
- 级联层在优先级之上引入一层
- 浏览器 user-agent 样式表是最低优先级起源

---

### 33. 伪类 vs 伪元素

**频率：** 中

**题目：** 请对比伪类与伪元素：(1) 伪类（如 :hover、:focus-visible、:nth-child、:has）如何瞄准处于特定状态的现有元素；(2) 伪元素（如 ::before、::after、::marker、::selection）如何样式或创建元素的子部分，为什么 ::before/::after 需要 content 属性才渲染，以及双冒号与遗留单冒号语法。请一并谈谈 :focus-visible 只给键盘用户显示 focus 环、:has() 作为父选择器、::placeholder 与 ::file-selector-button 样式表单内部，以及每元素只有一个 ::before 和一个 ::after。

**答案：** 伪类（`:hover`、`:focus-visible`、`:nth-child`、`:has`）瞄准处于特定状态的现有元素。伪元素（`::before`、`::after`、`::marker`、`::selection`）样式或创建元素的子部分。语法上，伪元素用 `::`（遗留的单冒号仍可用）。`::before/::after` 需要 `content` 属性才能渲染。

**要点：**
- `:focus-visible` 只给键盘用户显示 focus 环
- `:has()` 是父选择器，现已广泛支持
- `::placeholder`、`::file-selector-button` 样式表单内部
- 每元素只一个 `::before` 和一个 `::after`

---

### 34. 堆叠上下文与 `z-index` 陷阱

**频率：** 中

**题目：** 请解释堆叠上下文与 z-index 的常见陷阱：(1) 什么是堆叠上下文、为什么 z-index 只在同一上下文内竞争；(2) 哪些属性会创建新的堆叠上下文（position 加 z-index、opacity < 1、transform、filter、will-change、isolation: isolate 等），为什么 z-index: 9999 的子元素逃不出父的上下文。也请谈谈如何用 isolation: isolate 有意作用域 z-index、自动提升的层如何破坏模态/工具提示布局、把模态 portal 到 document.body 的做法，以及用 DevTools 的 Layers 面板可视化堆叠树。

**答案：** 堆叠上下文是一起绘制的元素组；`z-index` 只在同上下文内竞争。新上下文由 `position` + `z-index`、`opacity < 1`、`transform`、`filter`、`will-change`、`isolation: isolate` 等创建。带 `z-index: 9999` 的子元素逃不出其父的上下文。

**要点：**
- 用 `isolation: isolate` 有意作用域 z-index
- 自动提升的层（transform）常出乎意料破坏模态/工具提示布局
- 把模态 portal 到 `document.body` 避免上下文陷阱
- DevTools 的 Layers 面板可视化堆叠树

---

### 35. CSS-in-JS vs utility-first vs CSS modules

**频率：** 中

**题目：** 请对比三种样式方案：(1) CSS-in-JS（Emotion、styled-components）如何与组件共置并支持动态主题，但带来运行时成本和 SSR 复杂度；(2) utility-first（Tailwind）发原子样式表规模化好、权衡是标记可读性；(3) CSS modules 如何提供零运行时的作用域类名但缺动态主题。请一并谈谈为什么 React Server Components 中不鼓励运行时 CSS-in-JS、Tailwind v4 的原生 CSS 引擎、CSS modules 与 PostCSS 组合，以及如何按团队熟悉度和 SSR/RSC 需求选型。

**答案：** CSS-in-JS（Emotion、styled-components）把样式与组件共置并支持动态主题，但加运行时成本和 SSR 复杂度。Utility-first（Tailwind）发小型原子样式表，规模化好，权衡是标记可读性。CSS modules 给作用域类名零运行时，与打包器配合好但缺动态主题。现代栈偏向 Tailwind 或零运行时 CSS-in-JS（vanilla-extract、Panda、Linaria）。

**要点：**
- React Server Components 中不鼓励运行时 CSS-in-JS
- Tailwind v4 用原生 CSS 引擎实现更快构建
- CSS modules 与 PostCSS 流水线组合
- 按团队熟悉度与 SSR/RSC 需求选

---

### 36. `<picture>`、`srcset`、响应式图片

**频率：** 中

**题目：** 请讲解响应式图片方案：(1) srcset 加 sizes 如何让浏览器按 DPR 和布局宽度选最优图；(2) <picture> 如何做艺术指导和格式协商（AVIF、WebP、JPEG 回退）；(3) loading=lazy、decoding=async、fetchpriority=high 各自的作用。请一并谈谈始终设 width/height 或 aspect-ratio 防 CLS、sizes 描述的是布局宽度而非图片宽度、用支持即时变换的 CDN 出变体，以及首屏图应设 fetchpriority=high 且不要 lazy。

**答案：** `srcset` 加 `sizes` 让浏览器按 DPR 和布局宽度选最优图。`<picture>` 加艺术指导和格式协商：先 AVIF、再 WebP、再 JPEG 回退。`loading="lazy"` 延迟屏外图片；`decoding="async"` 避免阻塞绘制；`fetchpriority="high"` 提升 LCP 图。

```html
<picture>
  <source type="image/avif" srcset="hero.avif">
  <img src="hero.jpg" alt="..." loading="lazy" decoding="async">
</picture>
```

**要点：**
- 始终设 `width`/`height`（或 aspect-ratio）防 CLS
- `sizes` 描述布局宽度，不是图片宽度
- 用支持即时变换的 CDN 出变体
- 首屏图标 `fetchpriority="high"`，不要 lazy

---

### 37. WAI-ARIA 角色与什么时候不要用

**频率：** 中

**题目：** 请谈谈 WAI-ARIA 角色以及什么时候不该用它：(1) ARIA 在原生 HTML 无法表达模式（tab、组合框、live region）时如何增强语义；(2) 为什么第一条 ARIA 规则是不要用 ARIA、应优先原生元素，以及常见错误（冗余角色、缺键盘处理器、可聚焦元素上的 aria-hidden 破坏 tab 顺序）。请一并谈谈 aria-live 宣布动态更新、aria-expanded 和 aria-controls 描述展开组件、aria-label 覆盖可见文本，以及用 axe-core 加 VoiceOver/NVDA 测试而不只靠 linter。

**答案：** ARIA 在原生 HTML 无法表达模式（tab、组合框、live region）时增强语义。第一条 ARIA 规则是"不要用 ARIA"——优先原生元素。常见错误：冗余角色（`<button>` 上 `role="button"`）、缺键盘处理器、可聚焦元素上的 `aria-hidden`（破坏 tab 顺序）。

**要点：**
- `aria-live` 区域宣布动态更新
- `aria-expanded`、`aria-controls` 描述展开组件
- `aria-label` 为屏幕阅读器覆盖可见文本
- 跑 axe-core 并用 VoiceOver/NVDA 测试，不只 linter

---

### 38. 键盘导航与焦点管理

**频率：** 中

**题目：** 请讲解键盘导航与焦点管理：(1) 为什么每个交互元素必须可用键盘到达和操作、如何用自然 tab 顺序（避免正 tabindex）、tabindex=-1 的用途；(2) 打开模态后如何把焦点移入并困住、关闭时如何恢复焦点，以及用 :focus-visible 只给键盘用户显示 focus 环。请一并谈谈跳到内容链接、复合组件（tab、菜单、grid）用 roving tabindex、永不去 outline 而不提供替代，以及拔鼠标测试。

**答案：** 每个交互元素必须可通过键盘到达并操作。用自然 tab 顺序（避免正 `tabindex`）；`tabindex="-1"` 让元素可编程地聚焦。打开模态后把焦点移入并困住；关闭时恢复焦点。用 `:focus-visible` 让 focus 环只给键盘用户显示而不打扰鼠标用户。

**要点：**
- 跳到内容链接帮键盘用户绕过导航
- 复合组件（tab、菜单、grid）用 roving tabindex
- 永不去 outline 而不提供替代
- 拔鼠标测试

---

### 39. 颜色对比（WCAG AA/AAA）

**频率：** 中

**题目：** 请解释颜色对比与 WCAG 要求：(1) AA 级对普通文本、大文本（18pt 或 14pt 粗体）和 UI 组件分别要求多少对比度；(2) AAA 级的要求；(3) 对比如何由相对亮度而非感知亮度计算，以及 APCA（WCAG 3 算法）如何更好建模感知并对深浅背景做非对称处理。请一并谈谈测试所有状态（hover、disabled、placeholder）、别只靠颜色而配图标或文本、可用工具（axe、Lighthouse、Stark、Chrome 对比挑选器），以及高对比模式（forced-colors）需单独测试。

**答案：** WCAG AA 要求普通文本 4.5:1 对比和大文本（18pt 或 14pt 粗体）和 UI 组件 3:1。AAA 提到 7:1 和 4.5:1。对比由相对亮度计算，不是感知亮度。APCA（即将的 WCAG 3 算法）更好建模感知，并把深色背景上浅色与浅色背景上深色非对称处理。

**要点：**
- 测试所有状态（hover、disabled、placeholder）
- 别只靠颜色——配图标或文本
- 工具：axe、Lighthouse、Stark、Chrome 的对比挑选器
- 高对比模式（forced-colors）需单独测试

---

### 40. SVG vs PNG vs WebP vs AVIF

**频率：** 中

**题目：** 请对比 SVG、PNG、WebP、AVIF 四种图片格式：(1) SVG 作为矢量的无限缩放、可脚本化、适合图标/logo；(2) PNG 作为无损栅格适合截图和透明但体积大；(3) WebP 相比 JPEG 的体积优势与透明/动画支持；(4) AVIF 相比 JPEG 的更小体积和更好质量、但编码慢及需回退。请一并谈谈图标用精灵/内联 SVG 而避免图标字体、AVIF/WebP 在老浏览器的显式回退、内容图用 img 而装饰用 CSS background，以及用 SVGO 压缩 SVG。

**答案：** SVG 是矢量——无限缩放、可脚本化、理想用于图标/logo。PNG 是无损栅格，适合截图和透明但大。WebP 给比 JPEG 小约 25-35% 的文件，质量相近，支持透明/动画。AVIF 比 JPEG 小约 50% 且质量更好但编码慢；通过 `<picture>` 加 WebP 回退提供。

**要点：**
- 图标用精灵/内联 SVG；避免图标字体
- AVIF/WebP 老浏览器需显式回退
- 内容图用 `<img>`，装饰用 CSS `background`
- 用 SVGO 压缩 SVG

---

### 41. CSS 变量 vs SASS 变量

**频率：** 中

**题目：** 请对比 CSS 自定义属性与 SASS 变量：(1) SASS 变量在构建期解析、产出静态 CSS，快但不动态；(2) CSS 变量在运行时存在、可级联继承、可由 JS 修改、可响应媒体查询，为什么主题（明暗、品牌切换）需要它，以及 SASS 在 mixin、循环和模块化文件结构上仍有价值。请一并谈谈 CSS 变量可作用域到选择器做组件主题、var() 的 fallback、通过 element.style.setProperty 读写，以及 CSS 变量可用于 calc() 但不能很好地被 transition 动画。

**答案：** SASS 变量在构建期解析并产出静态 CSS——快且简单但不动态。CSS 自定义属性（`--color: red`）在运行时存在：它们级联、继承、可由 JS 修改、响应媒体查询。主题（明/暗、品牌切换）需要 CSS 变量。SASS 仍对 mixin、循环和模块化文件结构有价值。

**要点：**
- CSS 变量可作用域到选择器做组件主题
- `var(--x, fallback)` 提供默认
- JS 读写通过 `element.style.setProperty('--x', value)`
- CSS 变量在 `calc()` 中可用，transition 不能很好动画它们

---

### 42. 动画：`transition` vs `@keyframes`；合成器友好属性

**频率：** 中

**题目：** 请讲解 CSS 动画：(1) transition 如何在两个状态间插值（通常由 class 切换或伪类驱动）；(2) @keyframes 如何定义多步动画并由 animation 驱动；(3) 为什么只有 transform 和 opacity 是合成器友好的、而动画 width/top/box-shadow 会触发昂贵的 reflow，以及 will-change 的谨慎使用。请一并谈谈 60fps 意味着每帧约 16ms、优先 transform: translate 而非 top/left、prefers-reduced-motion 应禁非必要动画，以及 View Transitions API 声明性地启用跨状态动画。

**答案：** `transition` 在两个状态之间插值（通常由 class 切换或伪类驱动）。`@keyframes` 定义多步动画由 `animation` 驱动。只有 `transform` 和 `opacity` 在合成器上动画而不引起布局/绘制；动画 `width`、`top` 或 `box-shadow` 在每帧都触发昂贵 reflow。少用 `will-change` 暗示提升。

**要点：**
- 60fps 意味着每帧约 16ms 渲染
- 优先 `transform: translate` 而非 `top/left`
- `prefers-reduced-motion` 应禁非必要动画
- View Transitions API 声明性启用跨状态动画

---

### 43. 迭代器与生成器

**频率：** 中

**题目：** 请解释迭代器与生成器：(1) 迭代器如何实现返回 {value, done} 的 next()、可迭代如何暴露 [Symbol.iterator]()；(2) 生成器（function*）如何产出迭代器、用 yield 暂停执行，以及它们如何启用惰性序列、自定义迭代协议和协程风格异步。请一并谈谈 for...of 消费可迭代而 for...in 枚举 key、生成器的 .return() 清理和 .throw()、异步生成器（async function*）与 for await...of 配对，以及 spread/解构在任何可迭代上工作。

**答案：** 迭代器实现返回 `{value, done}` 的 `next()`。可迭代暴露 `[Symbol.iterator]()`。生成器（`function*`）产出迭代器，用 `yield` 暂停执行。它们启用惰性序列、自定义迭代协议，以及（历史上）async/await 前的协程风格异步。

```js
function* range(n) { for (let i = 0; i < n; i++) yield i; }
for (const x of range(3)) console.log(x);
```

**要点：**
- `for...of` 消费可迭代；`for...in` 枚举 key
- 生成器支持 `.return()` 做清理和 `.throw()`
- 异步生成器（`async function*`）与 `for await...of` 配对
- Spread/解构在任何可迭代上工作

---

### 44. ESM vs CommonJS；动态 `import()`

**频率：** 中

**题目：** 请对比 ESM 与 CommonJS 并讲解动态 import()：(1) CommonJS（require/module.exports）的同步、动态特性；(2) ESM（import/export）的静态、可异步、可摇树、Web 标准特性；(3) 动态 import() 返回 Promise、如何启用代码切分和条件加载，以及混合图（ESM 导入 CJS、CJS 用动态 import 导入 ESM）的棘手之处。请一并谈谈 ESM import 被提升且活绑定、package.json type: module 翻转 Node 默认、exports 字段控制子路径解析，以及顶层 await 仅在 ESM 中工作。

**答案：** CommonJS（`require`/`module.exports`）是同步、动态，Node 的遗留模块系统。ESM（`import`/`export`）是静态、可异步、可摇树、Web 标准。动态 `import()` 返回 Promise 并在浏览器和 Node ESM 都工作——启用代码切分和条件加载。混合图很 tricky：ESM 可导入 CJS，CJS 导入 ESM 需要动态 import。

**要点：**
- ESM import 被提升且活绑定
- `package.json` `"type": "module"` 翻转 Node 默认
- `exports` 字段控制子路径解析
- 顶层 await 仅在 ESM 中工作

---

### 45. 深克隆（`structuredClone`、JSON、递归）

**频率：** 中

**题目：** 请讲解深克隆的几种方式：(1) structuredClone 如何处理循环、Map、Set、Date、ArrayBuffer，但不处理函数/DOM 节点/symbol；(2) JSON.parse(JSON.stringify()) 为什么快但会丢函数、undefined、symbol、把 Date 变字符串、遇循环抛错；(3) 递归克隆的完全控制与慢易错，以及为什么应优先内置。请一并谈谈浅克隆（{...obj}、Object.assign）仅一层、不可变库（Immer）产出结构共享的克隆、structuredClone 也用于 postMessage，以及用 WeakMap 记忆化处理自定义递归克隆中的循环。

**答案：** `structuredClone(obj)` 是现代内置：处理循环、Map、Set、Date、ArrayBuffer，但不处理函数/DOM 节点/symbol。`JSON.parse(JSON.stringify(obj))` 快但丢函数、undefined、symbol，Date 变字符串，循环时抛。递归克隆给完全控制但慢易错——优先内置。

**要点：**
- 浅克隆：`{...obj}` 或 `Object.assign({}, obj)`（仅一层）
- 不可变库（Immer）产出结构共享的克隆
- `structuredClone` 也用于 `postMessage`
- WeakMap 记忆化处理自定义递归克隆中的循环

---

### 46. WeakMap / WeakSet

**频率：** 中

**题目：** 请解释 WeakMap 与 WeakSet：(1) 为什么 WeakMap 的 key 和 WeakSet 的值是弱引用、不会阻止被引用对象被 GC；(2) 它们如何适合把元数据与 DOM 节点或类实例关联而不泄漏内存；(3) 为什么它们不可迭代且不暴露 size。请一并谈谈 key 必须是对象（或未注册 symbol）、在类字段语法前完美做私有字段、用于以短暂对象为 key 的缓存，以及 WeakRef 和 FinalizationRegistry 给更细粒度的弱引用。

**答案：** `WeakMap` 的 key 和 `WeakSet` 的值是弱引用——它们不会阻止被引用对象被 GC。适合把元数据与 DOM 节点或类实例关联而不泄漏内存。它们不可迭代且不暴露 size，因为条目可能在检查之间消失。

**要点：**
- key 必须是对象（或未注册 symbol）
- 类字段语法前完美做私有字段
- 用于以短暂对象为 key 的缓存
- `WeakRef` 和 `FinalizationRegistry` 给更细粒度弱引用

---

### 47. Map vs 对象作字典

**频率：** 中

**题目：** 请对比用 Map 与普通对象做字典：(1) Map 如何保留插入顺序、接受任何 key 类型、有真正的 size、频繁增删更快；(2) 普通对象的原型污染风险、只支持字符串/symbol key，但 JSON 序列化友好，以及何时该用 Map（动态键值集合）、何时用对象（固定形状记录）。请一并谈谈 Object.create(null) 给无原型字典、Map 迭代更快更可预期、JSON 不原生序列化 Map（通过 Object.fromEntries 转），以及 TypeScript 的 Record<K, V> 用于对象字典。

**答案：** `Map` 保留插入顺序、接受任何 key 类型（对象、函数）、有真正的 `size`，频繁增删更快。普通对象有原型污染风险（`__proto__`、`constructor`）、只支持字符串/symbol key，但 JSON 序列化友好。动态键值集合用 `Map`，固定形状的记录用对象。

**要点：**
- `Object.create(null)` 给无原型字典
- `Map` 迭代更快更可预期
- JSON 不原生序列化 `Map`——通过 `Object.fromEntries` 转
- TypeScript 的 `Record<K, V>` 用于对象字典

---

### 48. TS：`unknown` vs `any` vs `never`

**频率：** 中

**题目：** 请对比 TypeScript 的 unknown、any 与 never：(1) any 如何完全退出类型检查、具病毒式和危险性；(2) unknown 作为类型安全的 any、使用前必须收窄；(3) never 作为不可达代码的底类型（穷尽 switch、永不返回的函数），以及为什么对外部输入优先 unknown、用 never 强制穷尽。请一并谈谈 unknown 需要 typeof/instanceof/谓词收窄、any 通过返回类型感染、无上下文时空数组推断为 never[]，以及用 noImplicitAny 和 strict 抓漏网。

**答案：** `any` 完全退出类型检查——病毒式且危险。`unknown` 是类型安全的 `any`：使用前必须收窄。`never` 是不可达代码的底类型（穷尽 switch、永不返回的函数）。对外部输入优先 `unknown` 于 `any`；用 `never` 强制穷尽。

```ts
function assertNever(x: never): never { throw new Error(`Unexpected: ${x}`); }
```

**要点：**
- `unknown` 需要 `typeof`/`instanceof`/谓词收窄
- `any` 通过返回类型感染
- 无上下文时空数组推断为 `never[]`
- 用 `noImplicitAny` 和 `strict` 抓漏网

---

### 49. TS：泛型、约束、默认

**频率：** 中

**题目：** 请讲解 TypeScript 泛型、约束与默认：(1) 泛型如何参数化类型（如 function id<T>(x: T): T）；(2) 约束（T extends Foo）如何限定类型参数；(3) 默认（<T = string>）如何提供回退类型；以及条件类型（T extends U ? X : Y）和 infer 如何启用类型级计算。请一并谈谈避免不实际关联两个位置的泛型、属性名泛型用 extends keyof T、NoInfer<T>（TS 5.4+）防从一个位置推断，以及泛型约束驱动 Pick、Record 等。

**答案：** 泛型参数化类型：`function id<T>(x: T): T`。约束（`T extends Foo`）限定类型参数。默认（`<T = string>`）提供回退类型。条件类型（`T extends U ? X : Y`）和 `infer` 启用强大的类型级计算。

**要点：**
- 避免不实际关联两个位置的泛型
- 属性名泛型用 `extends keyof T`
- `NoInfer<T>`（TS 5.4+）防从一个位置推断
- 泛型约束驱动 `Pick`、`Record` 等

---

### 50. TS：辨别并集与穷尽性

**频率：** 中

**题目：** 请解释 TypeScript 的辨别并集与穷尽性检查：(1) 辨别并集如何借助共享字面字段（kind/type）让 TS 收窄变体；(2) 如何在 switch 辨别器的默认分支调用 assertNever(x)，从而在新增变体时触发编译错误。请一并谈谈辨别器必须是字面类型、Redux/Zustand action 是经典辨别并集、satisfies 操作符如何助保留窄推断，以及配 as const 做字面推断。

**答案：** 辨别并集有共享字面字段（`kind`/`type`）让 TS 收窄变体。switch 辨别器并在默认调用 `assertNever(x)` 强制新增变体时编译错误。

```ts
type Shape = { kind: 'circle'; r: number } | { kind: 'square'; s: number };
function area(x: Shape) { switch (x.kind) { case 'circle': return Math.PI * x.r ** 2; case 'square': return x.s ** 2; } }
```

**要点：**
- 辨别器必须是字面类型
- Redux/Zustand action 是经典辨别并集
- `satisfies` 操作符助保留窄推断
- 配 `as const` 做字面推断

---

### 51. TS：工具类型（Partial/Pick/Omit/Record/ReturnType）

**频率：** 中

**题目：** 请讲解 TypeScript 常用工具类型：(1) Partial<T>、Required<T> 如何切换属性可选性；(2) Pick<T, K>、Omit<T, K> 如何选取或删除属性；(3) Record<K, V> 建字典、ReturnType<F> 抽函数返回、Parameters<F> 抽参数、Awaited<T> 解包 Promise，以及如何组合它们做 DTO、表单类型和 API 契约。请一并谈谈 Readonly<T> 做不可变形状、NonNullable<T> 剥 null | undefined、Exclude/Extract 过滤并集成员，以及内置不够时自滚映射加条件类型。

**答案：** 内置工具覆盖常见变换：`Partial<T>` 使所有 prop 可选，`Required<T>` 反之，`Pick<T, K>` 选，`Omit<T, K>` 删，`Record<K, V>` 建字典，`ReturnType<F>` 抽函数返回，`Parameters<F>` 抽参数，`Awaited<T>` 解包 Promise。组合做 DTO、表单类型和 API 契约。

**要点：**
- `Readonly<T>` 做不可变形状
- `NonNullable<T>` 剥 `null | undefined`
- `Exclude`/`Extract` 过滤并集成员
- 内置不够时自滚映射 + 条件类型

---

### 52. 柯里化与部分应用

**频率：** 中

**题目：** 请解释柯里化与部分应用：(1) 柯里化如何把 f(a,b,c) 变换为 f(a)(b)(c)、在所有参数到达前返回函数；(2) 部分应用如何固定一些参数并返回期待其余的函数；以及两者如何启用组合、point-free 风格和 DI 风格配置。请一并谈谈 Function.prototype.bind 做部分应用、Ramda/lodash-fp 发自动柯里化版本、当心 this 和元数（变参函数不干净柯里化），以及它对 map(addOne, list) 这种 HOF 有用。

**答案：** 柯里化把 `f(a,b,c)` 变换为 `f(a)(b)(c)`，所有参数到达前返回函数。部分应用固定一些参数并返回期待其余的函数。两者启用组合、point-free 风格和 DI 风格配置。

```js
const add = a => b => a + b;
const inc = add(1);
```

**要点：**
- `Function.prototype.bind` 做部分应用
- Ramda/lodash-fp 发自动柯里化版本
- 当心 `this` 和元数（变参函数不干净柯里化）
- 对 `map(addOne, list)` 这种 HOF 有用

---

### 53. HOF 与组合

**频率：** 中

**题目：** 请讲解高阶函数与函数组合：(1) 高阶函数如何接受或返回函数（如 map、filter、reduce、compose、pipe）；(2) 组合如何链一元函数、pipe(f, g, h)(x) 等价于什么，以及它如何鼓励小而可测的单元和声明式流水线。请一并谈谈 reduce 是通用 HOF（其他都可派生）、注意链长度对栈/性能的影响、transducer 不产中间数组组合，以及按约定 compose 右到左、pipe 左到右。

**答案：** 高阶函数接受或返回函数：`map`、`filter`、`reduce`、`compose`、`pipe`。组合链一元函数：`pipe(f, g, h)(x) === h(g(f(x)))`。鼓励小、可测单元和声明式流水线。

```js
const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);
```

**要点：**
- `reduce` 是通用 HOF——其他都可派生
- 注意链长度对栈/性能影响
- Transducer 不产中间数组组合
- 按约定 compose 右到左，pipe 左到右

---

### 54. 记忆化与陷阱

**频率：** 中

**题目：** 请解释记忆化及其陷阱：(1) 记忆化如何按参数缓存函数结果、对哪类函数（纯、贵、确定性、key 可哈希）最好；(2) 常见陷阱——无界缓存增长导致内存泄漏、基于引用的 key 漏命中、异步记忆化的竞态，以及按对象做 key 时用 WeakMap 支撑的缓存。请一并谈谈 React 的 useMemo/useCallback 是带引用身份的记忆化、Map 支撑的 memo 处理对象 key 但泄漏、LRU 缓存有限内存，以及别记忆化便宜操作。

**答案：** 记忆化按参数缓存函数结果。对纯、贵、确定性、key 可哈希的函数最好。陷阱：无界缓存增长（内存泄漏）、基于引用的 key 漏命中、异步记忆化的竞态。按对象做 key 时用 WeakMap 支撑的缓存。

**要点：**
- React 的 `useMemo`/`useCallback` 是带引用身份的记忆化
- `Map` 支撑的 memo 处理对象 key 但泄漏
- LRU 缓存有限内存
- 别记忆化便宜操作——缓存查找成本更高

---

### 55. 迭代大列表不阻塞主线程

**频率：** 中

**题目：** 请讲解如何迭代大列表而不阻塞主线程：(1) 如何把工作分块并用 setTimeout(0)、scheduler.yield()、requestIdleCallback 或 MessageChannel 让出事件循环；(2) 如何把纯 CPU 工作卸载到 Web Worker；(3) 渲染如何用虚拟化（react-window、TanStack Virtual）只挂可见行。请一并谈谈 scheduler.postTask({ priority }) 作为现代原语、异步生成器与分块处理配合、长任务（>50ms）伤 INP，以及 React 18 的 startTransition 延迟低优先级渲染。

**答案：** 把工作分块并用 `setTimeout(0)`、`scheduler.yield()`、`requestIdleCallback` 或 `MessageChannel` 让出事件循环。纯 CPU 工作卸载到 Web Worker。渲染用虚拟化（react-window、TanStack Virtual）只挂可见行。

**要点：**
- `scheduler.postTask({ priority })`（优先任务调度 API）是现代原语
- 异步生成器与分块处理配合好
- 长任务（>50ms）伤 INP
- React 18 的 `startTransition` 延迟低优先级渲染

---

### 56. Web Worker vs Service Worker vs Shared Worker

**频率：** 中

**题目：** 请对比 Web Worker、Service Worker 与 Shared Worker：(1) Web Worker 如何在后台线程跑脚本做 CPU 工作、无 DOM 访问、通过 postMessage 通信；(2) Service Worker 作为网络代理如何启用离线、推送通知和后台同步、其 install/activate/fetch 生命周期独立于页面；(3) Shared Worker 如何被多个同源 tab 访问，以及 Worklet 作为更轻量的专用 worker。请一并谈谈 Worker 通过结构化克隆或 Transferable 对象（零拷贝）通信、Service Worker 需要 HTTPS、Comlink 把 postMessage 包成 RPC，以及 Shared Worker 在 Safari 移动版不支持。

**答案：** Web Worker 在后台线程跑脚本做 CPU 工作；无 DOM 访问；通过 `postMessage` 通信。Service Worker 是网络代理，启用离线、推送通知和后台同步——生命周期（install/activate/fetch）独立于页面。Shared Worker 可被多个同源 tab 访问。Worklet（audio、paint、animation）是更轻量专用 worker。

**要点：**
- Worker 通过结构化克隆或 `Transferable` 对象（零拷贝）通信
- Service Worker 需要 HTTPS（localhost 除外）
- Comlink 把 `postMessage` 包成 RPC
- Shared Worker 在 Safari 移动版不支持

---

### 57. `React.memo`

**频率：** 中

**题目：** 请解释 React.memo 的作用：它如何在 props 浅相等时跳过组件重渲染、什么时候需要提供自定义比较器做深相等，以及在什么条件下（父组件常渲染且 props 通常稳定）使用它才有意义。

**答案：** `React.memo(Component)` 包函数组件，props 与上次渲染浅相等时跳过渲染。提供自定义比较器做深相等（很少值得）。仅当父常渲染且 props 通常稳定时有用。

**要点：**
- 内联对象/函数 props 击败 memo——用 `useMemo`/`useCallback` 包
- React 19 编译器自动记忆化，减少手动 `memo` 使用
- 昂贵子用 `useMemo` 而非 memo + props 管道
- 用 Profiler 测试确认收益

---

### 58. Context——传播成本与拆分

**频率：** 中

**题目：** 请谈谈 React Context 的传播成本与拆分策略：为什么 context 值变化会重渲染所有消费者、为什么把常变的值放进一个 provider 会引起大范围重渲染，你会如何按更新频率拆分 context，以及在什么情况下应该改用 Zustand/Jotai/Redux 这类支持基于 selector 订阅的方案。

**答案：** Context 在其值变化时重渲染每个消费者。把常变值放在一个 provider 里引起广泛重渲染。按更新频率拆分 context（主题一个、当前用户一个、购物车一个）。复杂全局状态用 Zustand/Jotai/Redux，它们支持基于 selector 的订阅。

**要点：**
- `useContextSelector`（第三方）启用细粒度订阅
- 把 provider 值用 `useMemo` 包持身份稳定
- Context 用于依赖注入，不用于高频状态
- React 19 的 `use(Context)` 条件读 context

---

### 59. Ref 与 forwardRef

**频率：** 中

**题目：** 请解释 React 中的 ref 与 forwardRef：ref 如何跨渲染持有可变值而不触发重渲染、useRef().current 的读写、对 DOM 节点的 ref 用于哪些命令式操作（聚焦、测量）、forwardRef 如何让父组件的 ref 触达子组件 DOM，以及 React 19 在这方面有什么变化。

**答案：** Ref 跨渲染持可变值不触发重渲染。`useRef(initial).current` 读写值。对 DOM 节点的 ref 给命令式访问（聚焦、测量）。`forwardRef` 让父 ref 触达子组件 DOM。React 19 把 `ref` 做成普通 prop，弃用 `forwardRef`。

**要点：**
- 渲染期间别读 ref（缓存值除外）
- `useImperativeHandle` 策展 `forwardRef` 暴露的
- 回调 ref（`ref={node => ...}`）在 mount/unmount 跑
- Ref 是逃生口——优先声明性模式

---

### 60. 错误边界

**频率：** 中

**题目：** 请解释 React 错误边界（Error Boundary）：它是什么样的组件、需要实现哪些方法（componentDidCatch 和 getDerivedStateFromError）、能捕获哪些错误、又不能捕获哪些错误（事件处理器、异步代码、SSR 错误），以及你会如何用它做优雅降级。

**答案：** 错误边界是实现 `componentDidCatch` 和 `getDerivedStateFromError` 的类组件，捕获后代 render/lifecycle/constructor 错误并显示回退 UI。它们不捕获事件处理器、异步代码或 SSR 错误——那些用 `try/catch`。把路由/特性包在边界中做优雅降级。

**要点：**
- React-error-boundary 库提供 hook 友好包装
- 在 `componentDidCatch` 中向 Sentry/Datadog 记录
- 通过改边界的 `key` 或 `resetErrorBoundary` 重置状态
- React 19 仍要求类边界——尚无 hook 等价

---

### 61. Suspense 与并发特性

**频率：** 中

**题目：** 请解释 React 的 Suspense 与并发特性：Suspense 在子组件抛出 Promise（数据取、懒导入）时如何显示回退 UI，startTransition 和 useDeferredValue 这类并发特性如何中断低优先级渲染以保持输入响应，以及 Suspense 如何支撑 Server Components 与流式 SSR。

**答案：** `Suspense` 在子抛 Promise（数据取、懒导入）时显示回退。并发特性（`startTransition`、`useDeferredValue`）让 React 中断低优先级渲染保输入响应。Server Components 和流式 SSR 建在 Suspense 上——数据解决时 HTML 块 flush。

**要点：**
- `lazy(() => import(...))` 与 Suspense 集成
- `useTransition` 返回 `[isPending, startTransition]`
- 边界可嵌套做粒度加载状态
- 从任意 hook 抛 Promise 现通过 `use()` 形式化

---

### 62. Server Components vs client components

**频率：** 中

**题目：** 请比较 React Server Components 与 client components：RSC 在服务器运行、从不发到客户端、可直接访问数据库/密钥，它们如何渲染为序列化格式并围绕客户端组件水合，'use client' 标记什么边界，以及 RSC 在减小包体积和集中数据获取上的收益与把交互限制到客户端岛的代价。

**答案：** React Server Components（RSC）在服务器跑，从不发到客户端，可直接访问数据库/密钥。它们渲染为序列化格式，客户端组件围绕水合。`'use client'` 标模块边界。RSC 减包大小并集中数据取，但把交互限到客户端岛。

**要点：**
- Server Components 不能用 state、effect 或浏览器 API
- 服务器到客户端的 props 必须可序列化
- Server Actions 处理变更
- Next.js App Router 和 Remix v3 是主要采用者

---

### 63. 状态管理：Redux vs Zustand vs Jotai vs Context

**频率：** 中

**题目：** 请对比 Redux、Zustand、Jotai 和 Context 这几种状态管理方案：（1）Redux（Toolkit）在大应用中的优势（devtools、middleware、时间旅行）与代价（2）Zustand 的 selector 订阅与最小样板（3）Jotai 的组合式原子状态（4）Context 适合做什么、不适合做什么，并说明你会如何在它们之间取舍。

**答案：** Redux（Toolkit）在需要 devtools、middleware、时间旅行调试的大应用中出色——冗长但可预测。Zustand 是带 selector 订阅的小型 hook 基础 store——最小样板。Jotai 用组合衍生的原子状态原语——细粒度响应。Context 用于很少变值的依赖注入，不用于高频状态。

**要点：**
- 服务器状态（React Query、SWR）与客户端状态分开
- 组件局部关注不要用全局状态
- Zustand/Jotai 与 React 18 并发渲染配合极好
- Redux Toolkit Query 也覆盖数据取

---

### 64. 路由：客户端 vs 服务端

**频率：** 中

**题目：** 请比较客户端路由与服务端路由：服务端路由每个 URL 返回完整 HTML 文档的特点（简单、SEO 友好、无需 JS），客户端路由如何拦截导航、取数并换视图以及它的收益与依赖，现代框架又是如何混合两者做同构/混合路由的。

**答案：** 服务端路由每 URL 返回完整 HTML 文档——简单、SEO 友好、不需 JS。客户端路由拦截导航、取数据、换视图无页面刷——转换更快但需 JS。现代框架混用：服务器渲染初始页，客户端接管后续导航（混合/同构路由）。

**要点：**
- History API（`pushState`/`replaceState`）驱动客户端路由
- `<a>` 应仍在无 JS 时工作（渐进增强）
- 路由代码切分减小初始 bundle
- View Transitions API 启用流畅客户端路由动画

---

### 65. 容器/展示 vs hook 驱动

**频率：** 中

**题目：** 请比较容器/展示组件模式与 hook 驱动的架构：经典的容器/展示分离如何隔离数据取与渲染及其在 hook 出现前的价值，hook 驱动架构如何通过自定义 hook 把数据需求与组件共置以减少 prop drilling，以及 Server Components 又把这一点推进到哪里。

**答案：** 经典容器/展示分离把数据取与渲染隔离——hook 前有用。Hook 驱动架构通过自定义 hook（`useUser`、`useCart`）把数据需求与组件共置，减少 prop drilling。Server Components 推得更远，让数据层从客户端代码消失。

**要点：**
- 自定义 hook 是现代"容器"——隔离可测
- 展示组件对设计系统仍有价值
- 复合组件模式分组相关 UI（Tabs/Tab）
- 避免过早抽象——模式出现时抽

---

### 66. 摇树——什么阻塞

**频率：** 中

**题目：** 请解释摇树（tree-shaking）：它在打包期如何消除未用的 export、需要哪些前提条件（ESM 静态分析、无副作用模块、纯顶层代码），以及哪些因素会阻塞摇树（CJS 模块、动态 require、顶层副作用、桶文件再 export、过早转译到 CJS）。

**答案：** 摇树在打包期消除未用 export。需要 ESM（静态分析）、无副作用模块（package.json `"sideEffects": false`）和纯顶层代码。阻塞：CJS 模块、动态 `require`、顶层副作用、通过桶文件再 export、过早转译到 CJS。

**要点：**
- `/*#__PURE__*/` 注解标调用为无副作用
- Lodash-es 摇树；lodash（CJS）不
- 避免 `import * as`——命名 import
- 用 bundle 分析器验证

---

### 67. CDN 与边缘缓存

**频率：** 中

**题目：** 请解释 CDN 与边缘缓存：CDN 如何在用户附近的 PoP 缓存静态资源以降延迟和源压力，现代 CDN 如何在边缘跑函数做 SSR/个性化，以及常见的缓存策略（源屏蔽、分层缓存、按标签清除、签名 URL）和边缘 SSR 的低 TTFB 优势。

**答案：** CDN 在用户附近 PoP 缓存静态资源，降延迟和源压力。现代 CDN（Cloudflare、Fastly、Vercel）也跑边缘函数做 SSR/个性化。缓存策略：源屏蔽、分层缓存、按标签清除、签名 URL。边缘 SSR 在全球 <50ms TTFB 跑你代码。

**要点：**
- 缓存 key 含 URL，有时含头/cookie——通过 `Vary` 控
- 按标签清除做细粒度失效
- HTTP/2 push 大体被弃；用 early hint / preload
- 源屏蔽减到源的缓存 miss

---

### 68. Cookie：SameSite/Secure/HttpOnly

**频率：** 中

**题目：** 请解释 Cookie 的安全属性：HttpOnly、Secure 各自的作用，SameSite 的 Strict、Lax（默认）、None 三种取值在跨站发送上的差异及 None 为什么要求 Secure，以及 Partitioned（CHIPS）随第三方 cookie 淘汰引入的每顶级站 cookie 存储机制。

**答案：** `HttpOnly` 对 JS 隐藏（缓解 XSS 盗）。`Secure` 要求 HTTPS。`SameSite=Strict` 完全阻跨站发；`Lax`（默认）允许顶级导航 GET；`None` 允许所有跨站但要求 `Secure`。`Partitioned`（CHIPS）随第三方 cookie 淘汰选入每顶级站 cookie 存储。

**要点：**
- 认证 token 应 `HttpOnly; Secure; SameSite=Lax`
- 嵌入小部件需要 `SameSite=None; Secure; Partitioned`
- Cookie 大小限 ~4KB；考虑头臃肿
- 用 `__Host-` 前缀求最严安全保证

---

### 69. 前端 auth：localStorage 中 JWT vs httpOnly cookie

**频率：** 中

**题目：** 请比较前端认证中把 JWT 存 localStorage 与用 httpOnly cookie：localStorage 面临什么风险（XSS 盗 token），httpOnly cookie 免疫 JS 访问、自动发送但易受 CSRF 及如何缓解，以及为什么说 cookie 是浏览器 auth 标准、localStorage 只在什么条件下可接受。

**答案：** `localStorage` 任何 JS 可读——XSS 盗 token。`httpOnly` cookie 对 JS 访问免疫，自动发送，但易受 CSRF（用 SameSite + CSRF token 缓解）。Cookie 是浏览器 auth 标准；localStorage 只对纯 API SPA 短命 token + 强 CSP 可接受。

**要点：**
- 刷新 token 轮换减爆炸半径
- 也别在 `sessionStorage` 存 token（仍 JS 可访问）
- BFF（Backend-for-Frontend）模式让 token 完全离客户端
- 公共客户端要求 OAuth PKCE

---

### 70. WebSocket vs SSE vs 长轮询

**频率：** 中

**题目：** 请比较 WebSocket、SSE 和长轮询三种实时通信方案：WebSocket 的双向低延迟特点及适用场景与需处理的问题，SSE 的单向、走 HTTP、自动重连、能穿代理但仅文本且有每源连接上限的特点，以及长轮询作为回退如何模拟推送。

**答案：** WebSocket 双向、低延迟，是聊天/游戏/协作编辑的理想方案——需要服务器支持并处理二进制。SSE 是单向（服务器 → 客户端）走 HTTP，更简单、自动重连、能穿过大多数代理，但仅文本且浏览器每源连接数有上限。长轮询是通过保持请求挂起来模拟推送的回退方案。

**要点：**
- SSE 适合通知、实时 feed、AI 流
- WebSocket 需心跳应对空闲超时
- WebTransport（HTTP/3）是低延迟双向的新兴继任者
- SSE 在 HTTP/1.1 下有每源连接数上限

---

### 71. 图片优化清单

**频率：** 中

**题目：** 请给出一份图片优化清单：如何选对格式（带回退的 AVIF/WebP）、通过 <picture> 配 srcset/sizes 发图、设 width/height 保位、首屏下用 loading="lazy"、LCP 图用 fetchpriority="high"、用支持即时缩放的 CDN、剥元数据与压缩，以及图标/logo 为什么用 SVG。

**答案：** 选对格式（带回退的 AVIF/WebP）、通过 `<picture>` 配 `srcset`/`sizes` 发、设 `width`/`height` 保位、首屏下 `loading="lazy"`、LCP 图 `fetchpriority="high"`、用支持即时缩放的 CDN、剥元数据、激进压缩。图标/logo 用 SVG。

**要点：**
- LCP 图不应 lazy
- `decoding="async"` 避免阻主线程
- 用 `aspect-ratio` CSS 避 CLS
- Blurhash/LQIP 占位改善感知性能

---

### 72. 字体加载（`font-display: swap`、preconnect、子集）

**频率：** 中

**题目：** 请解释字体加载优化：font-display: swap 如何先显示回退再换 web 字体（FOUT）以避免 FOIT，preconnect 到字体源如何省往返，子集化如何剥掉未用字形，以及严格 CLS 预算下为什么考虑自托管或 font-display: optional。

**答案：** `font-display: swap` 立即显示回退然后换 web 字体（FOUT）——避免不可见文本（FOIT）。`preconnect` 到字体源省往返。子集剥未用字形（仅拉丁省大量字节）。严格 CLS 预算自托管或用 `font-display: optional`。

**要点：**
- 可变字体替代多重量文件
- WOFF2 是唯一需要的现代格式
- `size-adjust` CSS 最小化回退与 web 字体间布局偏移
- 预加载关键字体：`<link rel="preload" as="font" crossorigin>`

---

### 73. 打包器：Webpack vs Vite vs esbuild vs Rollup

**频率：** 中

**题目：** 请比较 Webpack、Vite、esbuild 和 Rollup 这几款打包器：Webpack 的成熟灵活与慢，Vite 开发用原生 ESM、生产用 Rollup 的快 HMR 与好 DX，esbuild 基于 Go 的极快及在 Vite 内部的作用，以及 Rollup 在库打包上的优势，并谈谈 Rspack/Turbopack 这类新兴替代。

**答案：** Webpack 是成熟、插件重的主力——慢但灵活。Vite 开发用原生 ESM（不打包），生产用 Rollup——HMR 快、DX 好。esbuild 是 Go 基础打包/转译，极快，Vite 内部用做变换。Rollup 在库 bundle 出色（干净 ESM 输出、摇树）。Rspack（Rust）和 Turbopack（Rust）是新兴 Webpack 兼容替代。

**要点：**
- Vite 是新前端应用默认
- Webpack 仍主导企业/遗留
- 与 Rollup 相比 esbuild 插件 API 有限
- 库作者通常选 Rollup 或 tsup（esbuild 基础）

---

### 74. 测试金字塔

**频率：** 中

**题目：** 请解释测试金字塔：底层多而快的单元测试、中间的集成测试、顶层少而慢的 E2E 测试各自的定位，现代的"测试奖杯"变体为什么把更多重量放在 React Testing Library 集成测试上，以及 E2E 应只覆盖哪些关键用户旅程。

**答案：** 底层多快单元测试、中间少集成测试、顶层少慢 E2E 测试。现代变体（测试奖杯）把更多重量放在 React Testing Library 集成测试上——它们抓真 bug 而不脆。E2E 只覆盖关键用户旅程（登录、结账）。

**要点：**
- 避免测实现细节
- 求快速反馈——单元测试以毫秒计
- 契约测试（Pact）替代部分跨服务集成测试
- 覆盖率是健全检查，不是目标

---

### 75. Jest vs Vitest vs Playwright vs Cypress

**频率：** 中

**题目：** 请比较 Jest、Vitest、Playwright 和 Cypress：Jest 作为长存的单元测试 runner，Vitest 作为 Vite 原生、更快、ESM 优先的 Jest 兼容替代，Playwright 作为多浏览器 E2E 框架的并行与追踪优势，以及 Cypress 的开发者友好与时间旅行调试及其单浏览器局限。

**答案：** Jest 是长存的 React/Node 单元测试 runner。Vitest 是 Vite 原生、更快、ESM 优先的 Jest 兼容 API 替代。Playwright 是多浏览器 E2E 框架（Chromium/Firefox/WebKit）带优秀并行和追踪。Cypress 是开发者友好 E2E runner 带时间旅行调试但跑在浏览器内且每测试单浏览器。

**要点：**
- Vitest 是 Vite/SvelteKit/Astro 项目的新默认
- Playwright 在跨浏览器上追赶 Cypress
- Playwright 和 Cypress 也支持组件测试
- 两者都用 MSW 做 API 模拟

---

### 76. A11y 测试（axe-core、lighthouse、屏幕阅读器）

**频率：** 中

**题目：** 请解释可访问性测试：自动工具（jest-axe 或 Playwright 的 axe-core、Lighthouse）能抓大约多少比例的问题及哪些类型，哪些必须靠手动测试补充（仅键盘导航、屏幕阅读器 NVDA/JAWS/VoiceOver、缩放到 200%、reduced-motion），以及为什么要在 CI 里烤检查防回归。

**答案：** 自动工具（通过 jest-axe 或 Playwright 的 axe-core、Lighthouse）抓约 30-50% 问题——缺 label、对比、ARIA 误用。手动测试填其余：仅键盘导航、屏幕阅读器（NVDA、JAWS、VoiceOver）、缩放到 200%、reduced-motion。在 CI 烤检查防回归。

**要点：**
- Storybook addon-a11y 每 story 跑 axe
- Lighthouse a11y 分是起点，不是终点
- 用真辅助技术测，不只仿真
- 可能时把残障用户纳入测试

---

### 77. PWA：SW 生命周期、离线策略、安装提示

**频率：** 中

**题目：** 请解释 PWA 的三个方面：（1）Service Worker 生命周期 install（缓存壳）、activate（清旧缓存）、fetch（拦网络）（2）离线策略——缓存优先、网络优先、stale-while-revalidate 各自适用什么（3）beforeinstallprompt 事件如何让你推迟安装提示，并谈谈 Workbox 如何抽象这些常见模式。

**答案：** Service Worker 生命周期：`install`（缓存壳）、`activate`（清旧缓存）、`fetch`（拦网络）。离线策略：缓存优先（静态资源）、网络优先（带回退的 API）、stale-while-revalidate（好 UX/新鲜度平衡）。`beforeinstallprompt` 事件让你推迟安装提示到用户选时刻。Workbox 抽象常见模式。

**要点：**
- manifest + HTTPS + SW + 离线页 = 可安装 PWA
- 更新流：新 SW 激活时提示用户重载
- 后台同步排队失败变更重试
- iOS PWA 支持有限；真机测试

---

### 78. 关键 CSS 与 FOUC

**频率：** 低

**题目：** 请解释关键 CSS 与 FOUC：(1) 什么是关键 CSS、为什么把它内联到 <head> 能消除渲染阻塞并降低 LCP；(2) FOUC（无样式内容闪烁）为何出现、与异步 CSS 或字体替换的关系，以及 Critters/Beasties/Next.js 等工具如何自动抽取关键 CSS。也请谈谈内联关键 CSS 后用 media=print onload 技巧加载完整样式、用 rel=preload 预加载关键字体/CSS、FOUT 通常优于 FOIT，以及为什么应避免 CSS 中的 @import。

**答案：** 关键 CSS 是渲染首屏内容所需的最少 CSS；把它内联到 `<head>` 消除渲染阻塞并降低 LCP。FOUC（无样式内容闪烁）在 HTML 在 CSS 到达前绘制时出现——常见于异步 CSS 或字体替换。Critters、Beasties、Next.js 等工具可自动抽出关键 CSS。

**要点：**
- 内联关键 CSS，然后用 `media="print" onload="this.media='all'"` 加载完整样式
- 用 `<link rel="preload">` 预加载关键字体/CSS
- FOUT（文本）通常优于 FOIT（不可见文本）
- CSS 中避免 `@import`——它会串行下载

---

### 79. 垃圾回收（标记清除）

**频率：** 低

**题目：** 请讲解 JavaScript 的垃圾回收（标记清除）：(1) 现代引擎如何先标记根（全局、栈）、再标记可达对象、清除其余；(2) V8 如何把堆分为新生代（Scavenger）和老生代（Mark-Compact）；(3) 你不能强制 GC，但如何避免泄漏（解绑事件监听器、清定时器、把长命缓存引用置 null、以对象为 key 的缓存优先用 WeakMap/WeakRef）。请一并谈谈引用计数（老 IE）在循环上失败、用 DevTools 内存剖析器找游离 DOM 节点、闭包保留其整个作用域链，以及 FinalizationRegistry 在对象被 GC 时跑清理。

**答案：** 现代 JS 引擎用分代标记清除：先标记根（全局、栈），再标记可达对象，其余清除。V8 把堆分为新生代（Scavenger）和老生代（Mark-Compact）。你不能强制 GC，但可避免泄漏：解绑事件监听器、清定时器、把长命缓存中的引用置 null，以对象为 key 的缓存优先用 `WeakMap`/`WeakRef`。

**要点：**
- 引用计数（老 IE）在循环上失败
- DevTools 内存剖析器找游离 DOM 节点
- 闭包保留其整个作用域链
- `FinalizationRegistry` 在对象被 GC 时跑清理（慎用）

---

### 80. Symbol；`Symbol.iterator`

**频率：** 低

**题目：** 请讲解 Symbol 及 Symbol.iterator：(1) Symbol 作为唯一不可变原语，如何用作不冲突的属性 key 或知名协议钩子；(2) Symbol.iterator、Symbol.asyncIterator、Symbol.toPrimitive 各自的用途；(3) Symbol.for(key) 如何在全局注册表中查找共享 symbol。请一并谈谈 Symbol 键属性不出现在 for...in 或 Object.keys、JSON.stringify 跳过 symbol key、TypeScript 支持 unique-symbol 类型，以及它如何用于库扩展点避免名字冲突。

**答案：** Symbol 是唯一不可变原语，常用作不冲突的属性 key 或知名协议钩子。`Symbol.iterator` 让你定义自定义迭代，`Symbol.asyncIterator` 用于异步迭代，`Symbol.toPrimitive` 用于类型强制。`Symbol.for(key)` 在全局注册表中查找共享 symbol。

**要点：**
- Symbol 键属性不出现在 `for...in` 或 `Object.keys`
- `JSON.stringify` 跳过 symbol key
- TypeScript 支持 unique-symbol 类型
- 用于库扩展点避免名字冲突

---

### 81. Proxy 与 Reflect

**频率：** 低

**题目：** 请解释 Proxy 与 Reflect：(1) Proxy 如何用陷阱（get、set、has、deleteProperty、apply 等）包装对象以拦截基本操作、它如何驱动 Vue 3 响应性、MobX 和校验/观察库；(2) Reflect 如何把代理陷阱镜像为静态方法、便于把操作转发到原始目标。请一并谈谈 Proxy 不能拦截内部槽（Map 的数据、Date 的时间戳）、性能开销不轻应避免热路径、可通过 Proxy.revocable 撤销，以及它是现代响应系统的基础。

**答案：** `Proxy` 用陷阱（`get`、`set`、`has`、`deleteProperty`、`apply` 等）包装对象以拦截基本操作。驱动 Vue 3 响应性、MobX 和校验/观察库。`Reflect` 把代理陷阱镜像为静态方法，便于把操作转发到原始目标。

```js
const p = new Proxy(target, { get(t, k, r) { console.log('read', k); return Reflect.get(t, k, r); } });
```

**要点：**
- Proxy 不能拦截内部槽（Map 的数据、Date 的时间戳）
- 性能开销不轻；热路径避免
- 可通过 `Proxy.revocable` 可撤销
- 现代响应系统的基础

---

### 82. TS：声明合并

**频率：** 低

**题目：** 请解释 TypeScript 的声明合并：(1) 同名多个 interface 如何合并为一、命名空间如何与类/函数合并；(2) 模块增强（declare module 'foo'）如何扩展第三方类型（如给 Jest 加自定义匹配器、给 Express Request 加字段、注册模块联邦远程）。请一并谈谈仅 interface 和 namespace 合并而 type 别名冲突、通过 declare global 全局增强、对主题类型（styled-components 的 DefaultTheme）有用，以及避免跨不相关模块合并以免读者困惑。

**答案：** 同名多个 `interface` 声明合并为一。命名空间与类/函数合并。模块增强（`declare module 'foo'`）扩展第三方类型——如给 Jest 加自定义匹配器、给 Express `Request` 加字段、注册模块联邦远程。

**要点：**
- 仅 `interface` 和 `namespace` 合并；`type` 别名冲突
- 通过 `declare global { }` 全局增强
- 对主题类型（`styled-components` 的 `DefaultTheme`）有用
- 避免跨不相关模块合并——读者困惑

---

### 83. TS：`as const` 与字面类型

**频率：** 低

**题目：** 请讲解 TypeScript 的 as const 与字面类型：(1) as const 如何把值冻到最窄字面类型——数组变只读 tuple、对象得只读字面属性；(2) 它为什么对 action creator、路由定义和驱动类型推断的配置必备，以及如何从数组的 typeof [number] 得到字符串字面并集。请一并谈谈与 satisfies 配对校验不放宽、防 'foo' 放宽到 string，以及在对象字面上锁定嵌套形状。

**答案：** `as const` 把值冻到最窄字面类型——数组变只读 tuple，对象得只读字面属性。对 action creator、路由定义和驱动类型推断的配置必备。

```ts
const routes = ['/home', '/about'] as const; // readonly ['/home', '/about']
type Route = typeof routes[number];
```

**要点：**
- 与 `satisfies` 配对校验不放宽
- 从数组启用字符串字面并集
- 防 `'foo'` 放宽到 `string`
- 在对象字面上锁定嵌套形状

---

### 84. 错误子类、`cause`、异步堆栈

**频率：** 低

**题目：** 请讲解错误子类、cause 与异步堆栈：(1) 如何子类 Error 加领域特定错误类型并设 name 便于清晰 instanceof 检查；(2) ES2022 的 new Error(msg, { cause: original }) 如何保留错误链；(3) 现代 V8 如何跨 await 边界缝合异步堆栈，以及为什么应始终 throw new Error(...) 而从不抛字符串。请一并谈谈 Node 中用 Error.captureStackTrace、cause 作为标准包装重抛模式、别用空 catch 吞错误，以及 catch 子句中错误在 TS 4.4+ 默认打类型为 unknown。

**答案：** 子类 `Error` 加领域特定错误类型；设 `name` 便于清晰 `instanceof` 检查。ES2022 加 `new Error(msg, { cause: original })` 保留链。现代 V8 跨 `await` 边界缝合异步堆栈。始终 `throw new Error(...)`，从不抛字符串——你会丢堆栈。

```ts
class NotFoundError extends Error { constructor(id: string) { super(`Missing ${id}`); this.name = 'NotFoundError'; } }
```

**要点：**
- 自定义错误工厂中用 `Error.captureStackTrace`（Node）
- `cause` 是标准包装重抛模式
- 别用空 `catch` 吞错误
- `catch` 子句中错误打类型为 `unknown`（TS 4.4+ 默认）

---

### 85. 水合不匹配

**频率：** 低

**题目：** 请解释 React 中的水合不匹配（hydration mismatch）：水合做了什么、哪些情况会导致客户端输出与服务器不同（随机 ID、本地化日期、仅浏览器条件），React 18 如何恢复并警告，以及你会如何修复——比如用 useId、suppressHydrationWarning，或用 useEffect/useSyncExternalStore 推迟仅浏览器内容。

**答案：** 水合把事件监听器附到服务器渲染的 HTML。当客户端输出与服务器不同（随机 ID、本地化日期、仅浏览器条件）时不匹配。React 18 通过重渲染不匹配子树恢复但开发期警告。用 `useId`（跨服务器/客户端稳定）、已知差异用 `suppressHydrationWarning`，或用 `useEffect`/`useSyncExternalStore` 推迟仅浏览器内容修复。

**要点：**
- 渲染中 `Date.now()`/`Math.random()` 引起不匹配
- 本地/时区差异是常见元凶
- React 19 改善错误信息减少静默腐败
- 流式 SSR 可能掩盖问题——禁 JS 测试

---

### 86. Angular 变更检测（Zone.js、OnPush、signal）

**频率：** 低

**题目：** 请解释 Angular 的变更检测机制：传统上 Zone.js 如何 monkey-patch 异步 API 来自动触发变更检测，ChangeDetectionStrategy.OnPush 在什么条件下才检测组件，以及 Angular 17+ 引入的 signal 作为细粒度响应原语如何绕过 Zone 并支持无 Zone 应用。

**答案：** Angular 传统用 Zone.js monkey-patch 异步 API 自动触发变更检测。`ChangeDetectionStrategy.OnPush` 跳过组件除非 inputs 按引用改变、它发出事件，或 async pipe 发射。Angular 17+ 引入 signal——细粒度响应原语，完全绕过 Zone 并在 v18+ 启用无 Zone 应用。

**要点：**
- OnPush 大应用大幅改性能
- Signal（`signal()`、`computed()`、`effect()`）替代许多 `BehaviorSubject` 模式
- v18 中 `provideExperimentalZonelessChangeDetection`
- 游离组件仅通过 `ChangeDetectorRef.detectChanges()` 跑 CD

---

### 87. Angular DI 层级

**频率：** 低

**题目：** 请解释 Angular 的依赖注入层级：provider 是如何通过遍历元素 injector 树再到 module/environment injector 树解析的、providedIn: 'root' 与组件级 providers 的区别（可摇树单例 vs 每实例服务），以及 inject() 相对构造器注入的定位。

**答案：** Angular DI 通过遍历元素 injector 树、然后 module/environment injector 树解析 provider。`providedIn: 'root'` 注册可摇树单例。组件级 `providers` 创建每实例服务（适合作用域到特性的状态）。`inject()`（v14+）在许多上下文替代构造器注入。

**要点：**
- `useClass`/`useFactory`/`useValue`/`useExisting` 配置 provider
- 多 provider（`multi: true`）收集值数组
- 独立组件有自己的 injector 层级
- `@Optional`、`@Self`、`@SkipSelf`、`@Host` 控制解析

---

### 88. RxJS：switchMap vs mergeMap vs concatMap vs exhaustMap

**频率：** 低

**题目：** 请比较 RxJS 中的 switchMap、mergeMap、concatMap 和 exhaustMap 这四个高阶映射操作符：它们都把 Observable-of-Observables 摊平，但并发行为如何不同（取消前一个、全部并行、顺序排队、忽略新发射），并各举一个典型适用场景（如即输即搜、独立请求、保顺序、提交按钮）。

**答案：** 四者都把 Observable-of-Observables 摊平但并发不同。`switchMap` 在新值到达时取消前一内部 Observable——理想用于即输即搜。`mergeMap` 全部并行跑——适合独立请求。`concatMap` 顺序排队——保顺序。`exhaustMap` 在一个在途时忽略新发射——完美提交按钮。

**要点：**
- `switchMap` 是用户输入触发 HTTP 的对默认
- `mergeMap` 可淹服务器——用 `mergeMap(fn, n)` 限并发
- `concatMap` 以延迟换顺序
- `exhaustMap` 防重复提交

---

### 89. Angular standalone vs NgModule

**频率：** 低

**题目：** 请比较 Angular 的独立组件（standalone）与 NgModule：独立组件如何声明自己的 imports/providers 并跳过 NgModule 注册带来的好处（更简单心智模型、更好摇树、更快构建）、NgModule 现在还用于什么，以及新应用和库应如何选择。

**答案：** 独立组件（v14+，v17+ 默认）声明自己的 imports/providers 并跳过 NgModule 注册——更简单心智模型、更好摇树、更快构建。NgModule 仍用于分组相关声明和遗留互操作。新应用应 100% 独立；库正在迁移。

**要点：**
- `bootstrapApplication(AppComponent, { providers: [...] })` 替代 `NgModule` 引导
- 路由级懒加载：`loadComponent: () => import(...)`
- `provideRouter`、`provideHttpClient` 函数式配特性
- 迁移 schematic：`ng generate @angular/core:standalone`

---

### 90. Vue 组合式 vs 选项式 API

**频率：** 低

**题目：** 请比较 Vue 的组合式 API 与选项式 API：选项式 API 如何按 lifecycle/data/methods 组织代码及其在逻辑复用上的局限，组合式 API（setup / <script setup>）如何通过 composable 按关注点分组代码、对 TypeScript 和大组件的优势，以及 Vue 3 对两者的支持态度。

**答案：** 选项式 API 按 lifecycle/data/methods 分组代码——易学，但一个特性的逻辑散布在选项间。组合式 API（`setup`/`<script setup>`）用 composable（可复用 hook 式函数）按关注分组代码——对 TypeScript 和大组件更好。Vue 3 都发；新代码推荐组合式。

**要点：**
- `<script setup>` 是人体工程语法
- Composable（`useFoo`）替代 mixin
- 选项式 API 仍工作，无弃用计划
- 响应原语（`ref`、`reactive`、`computed`、`watch`）是构件

---

### 91. Vue Proxy 响应

**频率：** 低

**题目：** 请解释 Vue 3 基于 Proxy 的响应式系统：Vue 如何用 Proxy 包裹响应对象、在渲染期间跟踪属性访问并在被跟踪属性变化时重跑渲染，ref 与 reactive 的区别、computed 属性的缓存机制，以及为什么解构响应对象会丢失响应性、该如何避免。

**答案：** Vue 3 用 `Proxy` 包响应对象，组件渲染期间跟踪属性访问，被跟踪属性变化时重跑渲染。`ref` 包原语（`.value`），`reactive` 包对象。Computed 属性缓存到依赖变化。避免解构响应对象——你失响应。

**要点：**
- `toRefs`/`toRef` 解构时保响应
- Vue 2 用 `Object.defineProperty`，漏了新属性——v3 修复
- `shallowRef`/`shallowReactive` 大对象求性能
- `readonly` 创建不可变视图

---

### 92. 表单库（react-hook-form vs Formik）

**频率：** 低

**题目：** 请比较 react-hook-form 与 Formik 这两个表单库：react-hook-form 如何用非受控输入和 ref 最小化重渲染（性能好、bundle 小、与 Zod/Yup 集成），Formik 的受控输入模型有什么权衡，以及面对复杂表单（向导、动态字段、异步校验）时该如何选择。

**答案：** React-hook-form 用 ref 非受控输入，最小化重渲染——性能好、bundle 小、与 Zod/Yup 集成。Formik 基于受控输入，更多重渲染但小表单心智模型更简单。复杂表单（向导、动态字段、异步校验）react-hook-form 是现代默认。

**要点：**
- Zod/Yup/Valibot 做 schema 校验
- 动态列表用 `useFieldArray`
- 服务器渲染表单仍受益于渐进增强
- TanStack Form 是新兴的框架无关替代

---

### 93. 微前端：模块联邦 vs iframe vs single-spa

**频率：** 低

**题目：** 请比较微前端的三种方案——模块联邦（Module Federation）、iframe 和 single-spa：模块联邦如何在运行时跨独立构建共享模块（共享依赖、原生组合、无 iframe 隔离），iframe 的硬隔离与 UX 代价，single-spa 如何编排多框架，以及你会如何在团队自治与 UX 一致性之间权衡选择。

**答案：** 模块联邦（Webpack 5、Rspack、Vite 通过插件）运行时跨独立构建应用共享模块——共享依赖、原生组合、无 iframe 隔离。Iframe 给硬隔离（分开 JS 上下文、CSS 沙箱）但 UX 差（auth、导航、高度同步）。single-spa 通过 lifecycle 契约在一页上编排多框架。按团队自治 vs UX 一致性权衡选。

**要点：**
- 联邦需要小心对齐共享依赖版本
- iframe 适合遗留/第三方集成
- Native Federation（Angular）是 Angular 风味
- 单仓库单部署常胜 MFE 复杂

---

### 94. CSP 推出

**频率：** 低

**题目：** 请描述内容安全策略（CSP）的推出过程：CSP 如何把脚本/样式/图等来源加白名单、为什么要从 Content-Security-Policy-Report-Only 起步、如何迭代移除 unsafe-inline（用 nonce/哈希）与 unsafe-eval，以及 strict-dynamic 如何实现对 SPA 友好的脚本允许。

**答案：** Content Security Policy 把脚本/样式/图等的源加白名单。从 `Content-Security-Policy-Report-Only` 开始记违规而不破。迭代移除 `unsafe-inline`（用 nonce/哈希）和 `unsafe-eval`。配 `strict-dynamic` 做 SPA 友好脚本允许。

**要点：**
- 内联脚本每请求需 nonce
- 报告端点接收违规 JSON
- `frame-ancestors` 替代 `X-Frame-Options`
- `upgrade-insecure-requests` 把 HTTP 重写为 HTTPS

---

### 95. 生产中的 source map

**频率：** 低

**题目：** 请解释生产环境中的 source map：它如何把压缩代码映射回原始源用于调试和错误追踪、为什么生产要生成但不应公开（传给 Sentry/Datadog 或通过认证/限 IP 提供），以及 hidden-source-map 如何省去 sourceMappingURL 注释让浏览器不自动取。

**答案：** Source map 把压缩代码映射回原始源做调试和错误追踪。生产生成但别公开——传 Sentry/Datadog 或通过认证/限 IP 提供。`hidden-source-map`（Webpack）省去 `//# sourceMappingURL` 注释让浏览器不自动取。

**要点：**
- 没 source map，堆栈不可读
- `sourceMappingURL` 可指向私有主机
- map 与部署一起版本化
- `eval-source-map` 仅开发；生产用外部 `.map` 文件

---

### 96. 单仓库（Nx、Turborepo）vs 多仓库

**频率：** 低

**题目：** 请比较单仓库（monorepo，如 Nx、Turborepo）与多仓库（polyrepo）：单仓库共置多包在重构、共享工具和跨包原子变更上的好处，Nx 与 Turborepo 各自的侧重（任务编排/项目图/生成器 vs 缓存与流水线并行），多仓库的隔离与独立部署优势及其复杂化的地方。

**答案：** 单仓库共置多包，简化重构、共享工具和跨包原子变更。Nx 加任务编排、项目图和生成器；Turborepo 聚焦缓存和流水线并行。多仓库给严格隔离和独立部署但复杂化跨切变更。pnpm workspace 是轻量起点。

**要点：**
- 远程缓存（Nx Cloud、Turborepo Remote Cache）是杀手特性
- 用 code owner 和每包 CI 求规模
- 极大规模用 Bazel/Pants（Google/Meta 风格）
- 多仓库加 changeset 对 OSS 包族适用

---

### 97. 模拟（MSW、fetch-mock、DI）

**频率：** 低

**题目：** 请比较几种模拟方式：MSW（Mock Service Worker）如何在网络层拦截请求（浏览器用 service worker、Node 用请求拦截器）从而不改应用代码，fetch-mock 如何直接打 fetch 补丁及其耦合代价，以及依赖注入在接缝处替换实现的可测性与架构要求。

**答案：** MSW（Mock Service Worker）在网络层拦截请求（浏览器中 service worker、Node 中请求拦截器），所以应用代码不变。Fetch-mock 直接打 `fetch` 补丁——更简单但把测试与传输耦合。依赖注入在接缝处替换真实现——最可测但需要架构支持。

**要点：**
- MSW 在开发、测试和 Storybook 中同样工作
- 单元和 E2E 同一组 handler 减漂移
- 别模拟你不拥有的——先包再模拟
- 快照测契约，不测模拟

---

### 98. 视觉回归（Percy/Chromatic）

**频率：** 低

**题目：** 请解释视觉回归测试：Percy/Chromatic 这类工具如何快照渲染的组件/页面并对基线做 diff 以抓非故意的 UI 变化，Chromatic 与 Storybook 集成、Percy 框架无关、Playwright 内置截图 diff 各自的特点，以及字体、动画、日期等波动源该如何桩掉。

**答案：** 视觉回归工具快照渲染组件/页面并对基线 diff，抓非故意 UI 变化。Chromatic 与 Storybook 集成；Percy 框架无关；Playwright 内置截图 diff。波动来自字体、动画、日期——把它们桩掉。

**要点：**
- 配 Storybook 做每组件覆盖
- 跨浏览器快照倍增基线计数
- 评审者 UI 必备——diff 需人批准
- 用确定性测试数据（冻时间、种子随机）

---

### 99. 特性开关——客户端 vs 服务端评估

**频率：** 低

**题目：** 请比较特性开关的客户端评估与服务端评估：客户端评估把开关配置发到浏览器的灵活性（支持 A/B）与代价（暴露开关名、增大 bundle），服务端评估只发解决后变体在敏感推出和 SEO 上的优势，以及混合方案（服务器首请求解决、客户端 SDK 水合做后续切换）。

**答案：** 客户端评估把开关配置发到浏览器——灵活、支持 A/B，但暴露开关名并加 bundle 重。服务端评估保逻辑私有只发解决变体——对敏感推出和 SEO 更好。混合：服务器在首请求解决，水合客户端 SDK 做后续切换。

**要点：**
- LaunchDarkly、Statsig、Unleash、Flagsmith 是常见供应商
- 把开关读包在类型化包装中求安全
- 粘性分桶需要用户身份
- 推出后清开关——技术债积累

---

### 100. 遥测：错误追踪 vs RUM vs APM

**频率：** 低

**题目：** 请比较三类前端遥测：错误追踪（Sentry、Rollbar）如何带堆栈和面包屑捕获异常，RUM（真实用户监控）如何收集每个真实用户的现场性能（Core Web Vitals、导航时序、自定义事件），APM（Datadog、New Relic）如何把前端与后端追踪绑成端到端延迟，并说明它们如何互补。

**答案：** 错误追踪（Sentry、Rollbar）带堆栈和面包屑捕异常。RUM（真实用户监控）收现场性能——Core Web Vitals、导航时序、自定义事件——每真用户。APM（Datadog、New Relic）把前端与后端追踪绑做端到端延迟。三者互补。

**要点：**
- 高流量站重采样
- Source map 对可读堆栈必备
- 分布式追踪（OpenTelemetry）跨服务传 trace ID
- 数据离客户端前必须 PII 清洗
