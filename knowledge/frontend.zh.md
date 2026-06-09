# 前端面试题

100 道高频前端题，覆盖 HTML/CSS、JavaScript/TypeScript、框架（React/Angular/Vue）、性能、测试、可访问性、网络和构建工具。

---

### 1. 盒模型与 `box-sizing: border-box`

**答案：** CSS 盒模型把每个元素包裹在 content、padding、border 和 margin 盒里。默认（`content-box`）下，`width` 只设内容区，所以 padding 和 border 会让渲染尺寸变大。`border-box` 让 `width`/`height` 包含 padding 和 border，对 grid/flex 布局更可预期。多数现代 reset 全局应用 `*, *::before, *::after { box-sizing: border-box; }`。

**要点：**
- `content-box` 是规范默认；`border-box` 是实用默认
- Margin 在盒外，块元素之间垂直方向会合并
- `box-sizing` 只有显式声明 `inherit` 才会继承
- 用 DevTools 计算样式的盒图调试尺寸意外

---

### 2. 块级 vs 行内 vs 行内块

**答案：** 块级元素（`div`、`p`、`section`）另起一行并占满可用宽度；可自由设宽高/外边距/内边距。行内元素（`span`、`a`、`em`）随文本流动，忽略宽高，只在视觉上接受水平 padding/margin。行内块在周围文字间排列但接受盒尺寸，flexbox 出现前常用于按钮或徽章。

**要点：**
- 行内元素遵守 `line-height` 并在标签间产生空白
- 父元素 `display: flex/grid` 让子元素表现为块级参与者
- 替换型行内元素（`img`、`input`）虽是行内但接受宽高
- 现代布局用 flex/grid 替代行内块技巧

---

### 3. Flexbox 轴与 flex-grow/shrink/basis

**答案：** flex 容器有主轴（默认 row）和交叉轴。`justify-content` 沿主轴对齐；`align-items`/`align-self` 沿交叉轴。简写 `flex: <grow> <shrink> <basis>` 控制项如何分配空闲空间：`grow` 分剩余空间，`shrink` 分溢出，`basis` 是应用 grow/shrink 前的假设起始尺寸。`flex: 1` 是 `1 1 0%` 的简写。

**要点：**
- `flex-direction: row-reverse/column` 切换主轴
- `flex-wrap: wrap` 让行换行；配 `align-content` 做多行交叉对齐
- `gap` 在 flex 中可用（现代浏览器），避免负 margin 技巧
- flex 子元素 `min-width: 0` 防止文本溢出撑爆布局

---

### 4. CSS Grid：template-areas、显式 vs 隐式

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

### 5. 定位：static/relative/absolute/fixed/sticky

**答案：** `static` 是默认且忽略 `top/left/right/bottom`。`relative` 保留空间但视觉偏移并为 absolute 子元素创建定位上下文。`absolute` 把元素移出流，相对最近的已定位祖先定位。`fixed` 相对视口定位（或带 transform 的祖先——常见坑）。`sticky` 按滚动阈值在 relative 和 fixed 间切换。

**要点：**
- 祖先有 `transform`、`filter` 或 `will-change` 会困住 `fixed` 元素
- `sticky` 需要可滚动祖先和定义的 `top`/`bottom`
- absolute 元素不设尺寸时折成内容宽度
- 带 `z-index` 的定位元素创建堆叠上下文

---

### 6. 优先级规则与 `!important`

**答案：** 优先级是四部分元组：inline 样式、ID、类/属性/伪类、元素/伪元素。元组高者胜；平局看后定义。`!important` 跳到自己的层覆盖正常声明（user-agent < user < author < author-important < inline-important）。`@layer`（级联层）提供干净的排序机制，让多数 `!important` 用法过时。

**要点：**
- 通配选择器 `*` 与 `:where()` 优先级为零
- `:is()` 和 `:not()` 取参数中最高优先级
- 优先用级联层而非优先级军备竞赛
- 工具框架或第三方覆盖外避免 `!important`

---

### 7. CSS 级联与继承

**答案：** 级联按起源和重要性、然后级联层、然后优先级、然后源顺序决定哪条声明胜出。继承是另一回事：某些属性（color、font、line-height）默认继承；布局属性（margin、padding、border）不继承。用 `inherit`、`initial`、`unset` 或 `revert` 选入特定行为。

**要点：**
- `all: unset` 用于重置单个组件
- 自定义属性（`--foo`）始终继承除非覆盖
- 级联层在优先级之上引入一层
- 浏览器 user-agent 样式表是最低优先级起源

---

### 8. 伪类 vs 伪元素

**答案：** 伪类（`:hover`、`:focus-visible`、`:nth-child`、`:has`）瞄准处于特定状态的现有元素。伪元素（`::before`、`::after`、`::marker`、`::selection`）样式或创建元素的子部分。语法上，伪元素用 `::`（遗留的单冒号仍可用）。`::before/::after` 需要 `content` 属性才能渲染。

**要点：**
- `:focus-visible` 只给键盘用户显示 focus 环
- `:has()` 是父选择器，现已广泛支持
- `::placeholder`、`::file-selector-button` 样式表单内部
- 每元素只一个 `::before` 和一个 `::after`

---

### 9. 堆叠上下文与 `z-index` 陷阱

**答案：** 堆叠上下文是一起绘制的元素组；`z-index` 只在同上下文内竞争。新上下文由 `position` + `z-index`、`opacity < 1`、`transform`、`filter`、`will-change`、`isolation: isolate` 等创建。带 `z-index: 9999` 的子元素逃不出其父的上下文。

**要点：**
- 用 `isolation: isolate` 有意作用域 z-index
- 自动提升的层（transform）常出乎意料破坏模态/工具提示布局
- 把模态 portal 到 `document.body` 避免上下文陷阱
- DevTools 的 Layers 面板可视化堆叠树

---

### 10. 响应式：媒体查询、`clamp()`、容器查询

**答案：** 媒体查询适应视口或设备特性（`@media (min-width: 768px)`、`(prefers-color-scheme)`、`(prefers-reduced-motion)`）。`clamp(min, preferred, max)` 不靠断点产生流体值。容器查询（`@container`）让组件响应父尺寸，实现真正的组件级响应。

**要点：**
- 移动优先用 `min-width` 查询；桌面优先用 `max-width`
- 用 `container-type: inline-size` 定义容器
- `clamp()` 与视口单位配合：`clamp(1rem, 2vw, 1.5rem)`
- 为可访问性尊重 `prefers-reduced-motion`

---

### 11. 关键 CSS 与 FOUC

**答案：** 关键 CSS 是渲染首屏内容所需的最少 CSS；把它内联到 `<head>` 消除渲染阻塞并降低 LCP。FOUC（无样式内容闪烁）在 HTML 在 CSS 到达前绘制时出现——常见于异步 CSS 或字体替换。Critters、Beasties、Next.js 等工具可自动抽出关键 CSS。

**要点：**
- 内联关键 CSS，然后用 `media="print" onload="this.media='all'"` 加载完整样式
- 用 `<link rel="preload">` 预加载关键字体/CSS
- FOUT（文本）通常优于 FOIT（不可见文本）
- CSS 中避免 `@import`——它会串行下载

---

### 12. CSS-in-JS vs utility-first vs CSS modules

**答案：** CSS-in-JS（Emotion、styled-components）把样式与组件共置并支持动态主题，但加运行时成本和 SSR 复杂度。Utility-first（Tailwind）发小型原子样式表，规模化好，权衡是标记可读性。CSS modules 给作用域类名零运行时，与打包器配合好但缺动态主题。现代栈偏向 Tailwind 或零运行时 CSS-in-JS（vanilla-extract、Panda、Linaria）。

**要点：**
- React Server Components 中不鼓励运行时 CSS-in-JS
- Tailwind v4 用原生 CSS 引擎实现更快构建
- CSS modules 与 PostCSS 流水线组合
- 按团队熟悉度与 SSR/RSC 需求选

---

### 13. 用于 SEO/a11y 的语义化 HTML

**答案：** 语义化元素（`header`、`nav`、`main`、`article`、`section`、`aside`、`footer`、`figure`、`time`）向浏览器、辅助技术和爬虫传达结构。它们改善可访问性（landmark、heading）和 SEO（更丰富的文档大纲）。每页用一个 `<h1>` 并保持 heading 层级不跳级。

**要点：**
- 动作用按钮，导航用链接
- 每个表单输入要 `<label for>` 或包裹的 label
- 避免 `<div role="button">`——用真 `<button>`
- 微数据/JSON-LD 在语义之上加结构化数据

---

### 14. `<picture>`、`srcset`、响应式图片

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

### 15. WAI-ARIA 角色与什么时候不要用

**答案：** ARIA 在原生 HTML 无法表达模式（tab、组合框、live region）时增强语义。第一条 ARIA 规则是"不要用 ARIA"——优先原生元素。常见错误：冗余角色（`<button>` 上 `role="button"`）、缺键盘处理器、可聚焦元素上的 `aria-hidden`（破坏 tab 顺序）。

**要点：**
- `aria-live` 区域宣布动态更新
- `aria-expanded`、`aria-controls` 描述展开组件
- `aria-label` 为屏幕阅读器覆盖可见文本
- 跑 axe-core 并用 VoiceOver/NVDA 测试，不只 linter

---

### 16. 键盘导航与焦点管理

**答案：** 每个交互元素必须可通过键盘到达并操作。用自然 tab 顺序（避免正 `tabindex`）；`tabindex="-1"` 让元素可编程地聚焦。打开模态后把焦点移入并困住；关闭时恢复焦点。用 `:focus-visible` 让 focus 环只给键盘用户显示而不打扰鼠标用户。

**要点：**
- 跳到内容链接帮键盘用户绕过导航
- 复合组件（tab、菜单、grid）用 roving tabindex
- 永不去 outline 而不提供替代
- 拔鼠标测试

---

### 17. 颜色对比（WCAG AA/AAA）

**答案：** WCAG AA 要求普通文本 4.5:1 对比和大文本（18pt 或 14pt 粗体）和 UI 组件 3:1。AAA 提到 7:1 和 4.5:1。对比由相对亮度计算，不是感知亮度。APCA（即将的 WCAG 3 算法）更好建模感知，并把深色背景上浅色与浅色背景上深色非对称处理。

**要点：**
- 测试所有状态（hover、disabled、placeholder）
- 别只靠颜色——配图标或文本
- 工具：axe、Lighthouse、Stark、Chrome 的对比挑选器
- 高对比模式（forced-colors）需单独测试

---

### 18. SVG vs PNG vs WebP vs AVIF

**答案：** SVG 是矢量——无限缩放、可脚本化、理想用于图标/logo。PNG 是无损栅格，适合截图和透明但大。WebP 给比 JPEG 小约 25-35% 的文件，质量相近，支持透明/动画。AVIF 比 JPEG 小约 50% 且质量更好但编码慢；通过 `<picture>` 加 WebP 回退提供。

**要点：**
- 图标用精灵/内联 SVG；避免图标字体
- AVIF/WebP 老浏览器需显式回退
- 内容图用 `<img>`，装饰用 CSS `background`
- 用 SVGO 压缩 SVG

---

### 19. CSS 变量 vs SASS 变量

**答案：** SASS 变量在构建期解析并产出静态 CSS——快且简单但不动态。CSS 自定义属性（`--color: red`）在运行时存在：它们级联、继承、可由 JS 修改、响应媒体查询。主题（明/暗、品牌切换）需要 CSS 变量。SASS 仍对 mixin、循环和模块化文件结构有价值。

**要点：**
- CSS 变量可作用域到选择器做组件主题
- `var(--x, fallback)` 提供默认
- JS 读写通过 `element.style.setProperty('--x', value)`
- CSS 变量在 `calc()` 中可用，transition 不能很好动画它们

---

### 20. 动画：`transition` vs `@keyframes`；合成器友好属性

**答案：** `transition` 在两个状态之间插值（通常由 class 切换或伪类驱动）。`@keyframes` 定义多步动画由 `animation` 驱动。只有 `transform` 和 `opacity` 在合成器上动画而不引起布局/绘制；动画 `width`、`top` 或 `box-shadow` 在每帧都触发昂贵 reflow。少用 `will-change` 暗示提升。

**要点：**
- 60fps 意味着每帧约 16ms 渲染
- 优先 `transform: translate` 而非 `top/left`
- `prefers-reduced-motion` 应禁非必要动画
- View Transitions API 声明性启用跨状态动画

---

### 21. `var` vs `let` vs `const`；提升与 TDZ

**答案：** `var` 函数作用域、被提升并初始化为 `undefined`。`let`/`const` 块作用域、被提升但未初始化——在声明前访问抛 `ReferenceError`（暂时性死区）。`const` 防重新绑定但不防对象内容变更。优先 `const`，然后 `let`；遗留代码用 `var`。

**要点：**
- `var` 在全局对象上创建属性；`let`/`const` 不会
- 函数声明完全提升；函数表达式不会
- TDZ 从块开始到声明行存在
- `const` 数组/对象仍可变——浅不可变用 `Object.freeze`

---

### 22. 闭包 + 经典循环 bug

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

### 23. `this` 绑定规则

**答案：** 优先级顺序：`new` 把 `this` 绑到新实例；显式 `call`/`apply`/`bind` 设置它；方法调用（`obj.fn()`）绑到 `obj`；否则是全局对象（严格模式下是 `undefined`）。箭头函数没自己的 `this`——从外围作用域词法继承，所以是回调的理想选择。

**要点：**
- 类方法不自动绑定；用箭头字段或 `.bind`
- `forEach`/`map` 接受 `thisArg` 第二参数
- 严格模式防意外全局污染
- `bind` 返回新函数；重复 `bind` 只尊重第一个

---

### 24. 原型与原型链

**答案：** 每个对象有内部 `[[Prototype]]`（通过 `Object.getPrototypeOf` 访问），形成以 `null` 结束的链。属性查找走链。`Object.create(proto)` 创建有特定原型的对象。`class` 语法是基于原型继承的糖；`extends` 设链，`super` 调父构造器/方法。

**要点：**
- `instanceof` 走原型链检查 `.prototype`
- `hasOwnProperty`（或 `Object.hasOwn`）跳过继承属性
- 修改 `Array.prototype` 是臭名昭著的反模式
- 原型方法共享；实例字段每对象独有

---

### 25. 事件循环：宏任务 vs 微任务

**答案：** JS 是单线程，事件循环排空一个宏任务（脚本、`setTimeout`、I/O、UI 事件），然后跑所有微任务（Promise、`queueMicrotask`、`MutationObserver`）直到队列空，然后渲染，然后重复。微任务若不断入队会饿死渲染；长同步工作阻塞一切。

**要点：**
- `Promise.resolve().then()` 在 `setTimeout(..., 0)` 之前跑
- `requestAnimationFrame` 在绘制前、微任务后跑
- 低优先级工作用 `scheduler.postTask` 或 `requestIdleCallback`
- Web Worker 把 CPU 密集工作从主线程卸载

---

### 26. Promise vs async/await；错误处理

**答案：** `async/await` 是 Promise 的语法糖，读起来顺序。在 async 函数内 throw 变成被拒 Promise；`await` 解包已兑现值或在拒绝时重新抛。始终用 `try/catch` 包 await 或附加 `.catch`。未处理拒绝默认在 Node ≥15 让其崩溃并在浏览器 DevTools 浮现。

**要点：**
- `async` 函数始终返回 Promise
- `await` 暂停函数，不是线程
- 用 `Promise.all` 并行化独立 await
- `await` 周围的 `try/catch` 同时捕获同步抛和拒绝

---

### 27. `Promise.all` vs `allSettled` vs `race` vs `any`

**答案：** `all` 在全部成功时以数组解决，首次失败时拒绝（fail-fast）。`allSettled` 等每个 Promise 并返回 `{status, value|reason}` 数组——当你需要全部结果不论成败时用。`race` 以首个落定的 Promise（兑现或拒绝）落定。`any` 以首个兑现解决，仅全部失败时以 `AggregateError` 拒绝。

**要点：**
- 把 `Promise.race` 与超时 Promise 组合做取消
- `allSettled` 理想用于部分失败 OK 的并行 API 调用
- `any` 适合从多个镜像取
- 都不取消待定 Promise——那用 `AbortController`

---

### 28. 迭代器与生成器

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

### 29. ESM vs CommonJS；动态 `import()`

**答案：** CommonJS（`require`/`module.exports`）是同步、动态，Node 的遗留模块系统。ESM（`import`/`export`）是静态、可异步、可摇树、Web 标准。动态 `import()` 返回 Promise 并在浏览器和 Node ESM 都工作——启用代码切分和条件加载。混合图很 tricky：ESM 可导入 CJS，CJS 导入 ESM 需要动态 import。

**要点：**
- ESM import 被提升且活绑定
- `package.json` `"type": "module"` 翻转 Node 默认
- `exports` 字段控制子路径解析
- 顶层 await 仅在 ESM 中工作

---

### 30. 防抖 vs 节流（都写）

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

### 31. 深克隆（`structuredClone`、JSON、递归）

**答案：** `structuredClone(obj)` 是现代内置：处理循环、Map、Set、Date、ArrayBuffer，但不处理函数/DOM 节点/symbol。`JSON.parse(JSON.stringify(obj))` 快但丢函数、undefined、symbol，Date 变字符串，循环时抛。递归克隆给完全控制但慢易错——优先内置。

**要点：**
- 浅克隆：`{...obj}` 或 `Object.assign({}, obj)`（仅一层）
- 不可变库（Immer）产出结构共享的克隆
- `structuredClone` 也用于 `postMessage`
- WeakMap 记忆化处理自定义递归克隆中的循环

---

### 32. 相等：`==` vs `===` vs `Object.is`；NaN

**答案：** `===` 是严格相等（同类型、同值）。`==` 用有惊人规则的类型强制（`[] == false` 为真）。`Object.is` 像 `===` 但把 `NaN === NaN` 当真且 `+0 !== -0`。`NaN` 是唯一不等于自身的值；用 `Number.isNaN(x)` 测试。

**要点：**
- 始终用 `===` 除非故意强制
- `null == undefined` 为真；两者都 `=== null` 为假
- React 的 `useState` 和 `Object.is` 用同等性检查
- `Number.isNaN` 比全局 `isNaN`（会强制）更安全

---

### 33. 垃圾回收（标记清除）

**答案：** 现代 JS 引擎用分代标记清除：根（全局、栈）被标记，然后可达对象，其余被清。V8 把堆分新生代（Scavenger）和老生代（Mark-Compact）。你不能强制 GC，但可避免泄漏：解绑事件监听器、清定时器、把长命缓存中引用置 null，按对象做 key 的缓存优先 `WeakMap`/`WeakRef`。

**要点：**
- 引用计数（老 IE）在循环上失败
- DevTools 内存剖析器找游离 DOM 节点
- 闭包保留其整个作用域链
- `FinalizationRegistry` 在对象被 GC 时跑清理（慎用）

---

### 34. WeakMap / WeakSet

**答案：** `WeakMap` 的 key 和 `WeakSet` 的值被弱持——它们不防被引用对象的 GC。对把元数据与 DOM 节点或类实例关联而不泄漏内存有用。它们不可迭代且不暴露 size，因为条目可能在检查之间消失。

**要点：**
- key 必须是对象（或未注册 symbol）
- 类字段语法前完美做私有字段
- 用于以短暂对象为 key 的缓存
- `WeakRef` 和 `FinalizationRegistry` 给更细粒度弱引用

---

### 35. Map vs 对象作字典

**答案：** `Map` 保留插入顺序、接受任何 key 类型（对象、函数）、有真 `size`，频繁加删更快。普通对象有原型污染风险（`__proto__`、`constructor`）、仅字符串/symbol key、JSON 友好序列化。动态键值集合用 `Map`，固定形状记录用对象。

**要点：**
- `Object.create(null)` 给无原型字典
- `Map` 迭代更快更可预期
- JSON 不原生序列化 `Map`——通过 `Object.fromEntries` 转
- TypeScript 的 `Record<K, V>` 用于对象字典

---

### 36. Symbol；`Symbol.iterator`

**答案：** Symbol 是唯一不可变原语，常用作不冲突的属性 key 或著名协议钩子。`Symbol.iterator` 让你定义自定义迭代，`Symbol.asyncIterator` 用于异步，`Symbol.toPrimitive` 用于强制。`Symbol.for(key)` 在全局注册表中查找共享 symbol。

**要点：**
- Symbol 键属性不出现在 `for...in` 或 `Object.keys`
- `JSON.stringify` 跳过 symbol key
- TypeScript 支持 unique-symbol 类型
- 用于库扩展点避免名字冲突

---

### 37. Proxy 与 Reflect

**答案：** `Proxy` 用陷阱（`get`、`set`、`has`、`deleteProperty`、`apply` 等）包装对象拦截基本操作。驱动 Vue 3 响应性、MobX 和校验/观察库。`Reflect` 把代理陷阱镜像为静态方法，便于把操作转发到原始目标。

```js
const p = new Proxy(target, { get(t, k, r) { console.log('read', k); return Reflect.get(t, k, r); } });
```

**要点：**
- Proxy 不能拦截内部槽（Map 的数据、Date 的时间戳）
- 性能开销不轻；热路径避免
- 可通过 `Proxy.revocable` 可撤销
- 现代响应系统的基础

---

### 38. TS：`interface` vs `type`

**答案：** 两者都描述对象形状。`interface` 支持声明合并，是公开 API/对象契约的惯用法。`type` 别名可描述并集、交集、原语、tuple、映射类型——严格更具表达力但不可合并。性能可比；按所需能力选。许多团队默认全用 `type`。

**要点：**
- 大并集中 `interface` 扩展类型检查可能更快
- `type` 别名可通过条件类型自引用
- 两者支持泛型
- 声明合并对增强库至关重要

---

### 39. TS：`unknown` vs `any` vs `never`

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

### 40. TS：泛型、约束、默认

**答案：** 泛型参数化类型：`function id<T>(x: T): T`。约束（`T extends Foo`）限定类型参数。默认（`<T = string>`）提供回退类型。条件类型（`T extends U ? X : Y`）和 `infer` 启用强大的类型级计算。

**要点：**
- 避免不实际关联两个位置的泛型
- 属性名泛型用 `extends keyof T`
- `NoInfer<T>`（TS 5.4+）防从一个位置推断
- 泛型约束驱动 `Pick`、`Record` 等

---

### 41. TS：辨别并集与穷尽性

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

### 42. TS：工具类型（Partial/Pick/Omit/Record/ReturnType）

**答案：** 内置工具覆盖常见变换：`Partial<T>` 使所有 prop 可选，`Required<T>` 反之，`Pick<T, K>` 选，`Omit<T, K>` 删，`Record<K, V>` 建字典，`ReturnType<F>` 抽函数返回，`Parameters<F>` 抽参数，`Awaited<T>` 解包 Promise。组合做 DTO、表单类型和 API 契约。

**要点：**
- `Readonly<T>` 做不可变形状
- `NonNullable<T>` 剥 `null | undefined`
- `Exclude`/`Extract` 过滤并集成员
- 内置不够时自滚映射 + 条件类型

---

### 43. TS：声明合并

**答案：** 同名多个 `interface` 声明合并为一。命名空间与类/函数合并。模块增强（`declare module 'foo'`）扩展第三方类型——如给 Jest 加自定义匹配器、给 Express `Request` 加字段、注册模块联邦远程。

**要点：**
- 仅 `interface` 和 `namespace` 合并；`type` 别名冲突
- 通过 `declare global { }` 全局增强
- 对主题类型（`styled-components` 的 `DefaultTheme`）有用
- 避免跨不相关模块合并——读者困惑

---

### 44. TS：`as const` 与字面类型

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

### 45. 柯里化与部分应用

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

### 46. HOF 与组合

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

### 47. 记忆化与陷阱

**答案：** 记忆化按参数缓存函数结果。对纯、贵、确定性、key 可哈希的函数最好。陷阱：无界缓存增长（内存泄漏）、基于引用的 key 漏命中、异步记忆化的竞态。按对象做 key 时用 WeakMap 支撑的缓存。

**要点：**
- React 的 `useMemo`/`useCallback` 是带引用身份的记忆化
- `Map` 支撑的 memo 处理对象 key 但泄漏
- LRU 缓存有限内存
- 别记忆化便宜操作——缓存查找成本更高

---

### 48. 错误子类、`cause`、异步堆栈

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

### 49. 迭代大列表不阻塞主线程

**答案：** 把工作分块并用 `setTimeout(0)`、`scheduler.yield()`、`requestIdleCallback` 或 `MessageChannel` 让出事件循环。纯 CPU 工作卸载到 Web Worker。渲染用虚拟化（react-window、TanStack Virtual）只挂可见行。

**要点：**
- `scheduler.postTask({ priority })`（优先任务调度 API）是现代原语
- 异步生成器与分块处理配合好
- 长任务（>50ms）伤 INP
- React 18 的 `startTransition` 延迟低优先级渲染

---

### 50. Web Worker vs Service Worker vs Shared Worker

**答案：** Web Worker 在后台线程跑脚本做 CPU 工作；无 DOM 访问；通过 `postMessage` 通信。Service Worker 是网络代理，启用离线、推送通知和后台同步——生命周期（install/activate/fetch）独立于页面。Shared Worker 可被多个同源 tab 访问。Worklet（audio、paint、animation）是更轻量专用 worker。

**要点：**
- Worker 通过结构化克隆或 `Transferable` 对象（零拷贝）通信
- Service Worker 需要 HTTPS（localhost 除外）
- Comlink 把 `postMessage` 包成 RPC
- Shared Worker 在 Safari 移动版不支持

---

### 51. React VDOM 与协调

**答案：** React 把 UI 描述为元素树；状态变化时构建新树并对前一树 diff（协调），提交最小 DOM 变更。启发式：不同元素类型替换子树；同类型更新 props；key 标识跨渲染的列表项。Fiber（16 起）让协调可中断以支持并发渲染。

**要点：**
- 协调因启发式是 O(n)，不是完整树 diff
- 错 key 在列表中引发微妙状态 bug
- 并发渲染可丢弃在途工作
- React 19 加编译器驱动的记忆化

---

### 52. `useState` vs `useReducer`

**答案：** `useState` 理想用于独立原语或小对象状态。`useReducer` 在下个状态依赖前一状态、多个子值一起变，或转换遵循状态机模式时闪光。Reducer 函数是纯且可测；dispatch 身份稳定所以在 deps 中安全。

**要点：**
- 懒初始化：`useState(() => expensive())`
- 函数式更新：`setX(prev => prev + 1)` 避免陈旧闭包
- Reducer 与 Context 配对做应用级状态
- 复杂需求用 XState 或 Zustand

---

### 53. `useEffect` deps 与陈旧闭包

**答案：** Effect 捕获其创建时渲染的变量。缺 deps 引起读过时值的陈旧闭包。exhaustive-deps lint 规则抓这个。修复：包含所有引用的响应值，或用 ref/函数式更新读最新而不重新订阅。

**要点：**
- 空 deps `[]` = mount 一次跑（卸载时清理）
- 清理在下个 effect 前和卸载时跑
- React 18 Strict Mode 开发跑 effect 两次浮现 bug
- React 19 编译器减少手动 dep 管理

---

### 54. `useMemo` vs `useCallback`

**答案：** `useMemo(fn, deps)` 记忆化计算值；`useCallback(fn, deps)` 记忆化函数引用（`useMemo(() => fn, deps)` 的糖）。用于避免昂贵重计算或为子 memo/effect deps 保持引用身份稳定。React 19 编译器常让这些不必要。

**要点：**
- 记忆化有开销——别记忆化平凡值
- deps 错则陈旧闭包风险
- 与 `React.memo` 配跳过子重渲染
- 加记忆化前剖析

---

### 55. `React.memo`

**答案：** `React.memo(Component)` 包函数组件，props 与上次渲染浅相等时跳过渲染。提供自定义比较器做深相等（很少值得）。仅当父常渲染且 props 通常稳定时有用。

**要点：**
- 内联对象/函数 props 击败 memo——用 `useMemo`/`useCallback` 包
- React 19 编译器自动记忆化，减少手动 `memo` 使用
- 昂贵子用 `useMemo` 而非 memo + props 管道
- 用 Profiler 测试确认收益

---

### 56. Context——传播成本与拆分

**答案：** Context 在其值变化时重渲染每个消费者。把常变值放在一个 provider 里引起广泛重渲染。按更新频率拆分 context（主题一个、当前用户一个、购物车一个）。复杂全局状态用 Zustand/Jotai/Redux，它们支持基于 selector 的订阅。

**要点：**
- `useContextSelector`（第三方）启用细粒度订阅
- 把 provider 值用 `useMemo` 包持身份稳定
- Context 用于依赖注入，不用于高频状态
- React 19 的 `use(Context)` 条件读 context

---

### 57. 列表 key；index-key 反模式

**答案：** Key 标识跨渲染的项让 React 匹配。静态列表用数组索引可，但重排/插入/删除时坏——附在行的状态跟着索引，不跟项。用稳定项 ID。

**要点：**
- Key 仅在兄弟间唯一
- 别在 render 内随机生成 key
- React 在开发时缺 key 警告
- Key 也影响 CSS 动画和表单状态

---

### 58. 受控 vs 非受控输入

**答案：** 受控输入从 React 状态派生 `value` 并通过 `onChange` 更新——单一真相源、易校验，但每次按键重渲染。非受控输入在 DOM 中持有自己状态，通过 ref（初始值用 `defaultValue`）访问。普通表单非受控更简单；需对按键反应时受控更好。

**要点：**
- React-hook-form 用非受控输入求性能
- 文件输入实际上始终非受控
- `defaultValue`/`defaultChecked` 初始化非受控
- 别让单个输入在受控/非受控间切换

---

### 59. Ref 与 forwardRef

**答案：** Ref 跨渲染持可变值不触发重渲染。`useRef(initial).current` 读写值。对 DOM 节点的 ref 给命令式访问（聚焦、测量）。`forwardRef` 让父 ref 触达子组件 DOM。React 19 把 `ref` 做成普通 prop，弃用 `forwardRef`。

**要点：**
- 渲染期间别读 ref（缓存值除外）
- `useImperativeHandle` 策展 `forwardRef` 暴露的
- 回调 ref（`ref={node => ...}`）在 mount/unmount 跑
- Ref 是逃生口——优先声明性模式

---

### 60. 错误边界

**答案：** 错误边界是实现 `componentDidCatch` 和 `getDerivedStateFromError` 的类组件，捕获后代 render/lifecycle/constructor 错误并显示回退 UI。它们不捕获事件处理器、异步代码或 SSR 错误——那些用 `try/catch`。把路由/特性包在边界中做优雅降级。

**要点：**
- React-error-boundary 库提供 hook 友好包装
- 在 `componentDidCatch` 中向 Sentry/Datadog 记录
- 通过改边界的 `key` 或 `resetErrorBoundary` 重置状态
- React 19 仍要求类边界——尚无 hook 等价

---

### 61. Suspense 与并发特性

**答案：** `Suspense` 在子抛 Promise（数据取、懒导入）时显示回退。并发特性（`startTransition`、`useDeferredValue`）让 React 中断低优先级渲染保输入响应。Server Components 和流式 SSR 建在 Suspense 上——数据解决时 HTML 块 flush。

**要点：**
- `lazy(() => import(...))` 与 Suspense 集成
- `useTransition` 返回 `[isPending, startTransition]`
- 边界可嵌套做粒度加载状态
- 从任意 hook 抛 Promise 现通过 `use()` 形式化

---

### 62. Server Components vs client components

**答案：** React Server Components（RSC）在服务器跑，从不发到客户端，可直接访问数据库/密钥。它们渲染为序列化格式，客户端组件围绕水合。`'use client'` 标模块边界。RSC 减包大小并集中数据取，但把交互限到客户端岛。

**要点：**
- Server Components 不能用 state、effect 或浏览器 API
- 服务器到客户端的 props 必须可序列化
- Server Actions 处理变更
- Next.js App Router 和 Remix v3 是主要采用者

---

### 63. 水合不匹配

**答案：** 水合把事件监听器附到服务器渲染的 HTML。当客户端输出与服务器不同（随机 ID、本地化日期、仅浏览器条件）时不匹配。React 18 通过重渲染不匹配子树恢复但开发期警告。用 `useId`（跨服务器/客户端稳定）、已知差异用 `suppressHydrationWarning`，或用 `useEffect`/`useSyncExternalStore` 推迟仅浏览器内容修复。

**要点：**
- 渲染中 `Date.now()`/`Math.random()` 引起不匹配
- 本地/时区差异是常见元凶
- React 19 改善错误信息减少静默腐败
- 流式 SSR 可能掩盖问题——禁 JS 测试

---

### 64. 状态管理：Redux vs Zustand vs Jotai vs Context

**答案：** Redux（Toolkit）在需要 devtools、middleware、时间旅行调试的大应用中出色——冗长但可预测。Zustand 是带 selector 订阅的小型 hook 基础 store——最小样板。Jotai 用组合衍生的原子状态原语——细粒度响应。Context 用于很少变值的依赖注入，不用于高频状态。

**要点：**
- 服务器状态（React Query、SWR）与客户端状态分开
- 组件局部关注不要用全局状态
- Zustand/Jotai 与 React 18 并发渲染配合极好
- Redux Toolkit Query 也覆盖数据取

---

### 65. Angular 变更检测（Zone.js、OnPush、signal）

**答案：** Angular 传统用 Zone.js monkey-patch 异步 API 自动触发变更检测。`ChangeDetectionStrategy.OnPush` 跳过组件除非 inputs 按引用改变、它发出事件，或 async pipe 发射。Angular 17+ 引入 signal——细粒度响应原语，完全绕过 Zone 并在 v18+ 启用无 Zone 应用。

**要点：**
- OnPush 大应用大幅改性能
- Signal（`signal()`、`computed()`、`effect()`）替代许多 `BehaviorSubject` 模式
- v18 中 `provideExperimentalZonelessChangeDetection`
- 游离组件仅通过 `ChangeDetectorRef.detectChanges()` 跑 CD

---

### 66. Angular DI 层级

**答案：** Angular DI 通过遍历元素 injector 树、然后 module/environment injector 树解析 provider。`providedIn: 'root'` 注册可摇树单例。组件级 `providers` 创建每实例服务（适合作用域到特性的状态）。`inject()`（v14+）在许多上下文替代构造器注入。

**要点：**
- `useClass`/`useFactory`/`useValue`/`useExisting` 配置 provider
- 多 provider（`multi: true`）收集值数组
- 独立组件有自己的 injector 层级
- `@Optional`、`@Self`、`@SkipSelf`、`@Host` 控制解析

---

### 67. RxJS：switchMap vs mergeMap vs concatMap vs exhaustMap

**答案：** 四者都把 Observable-of-Observables 摊平但并发不同。`switchMap` 在新值到达时取消前一内部 Observable——理想用于即输即搜。`mergeMap` 全部并行跑——适合独立请求。`concatMap` 顺序排队——保顺序。`exhaustMap` 在一个在途时忽略新发射——完美提交按钮。

**要点：**
- `switchMap` 是用户输入触发 HTTP 的对默认
- `mergeMap` 可淹服务器——用 `mergeMap(fn, n)` 限并发
- `concatMap` 以延迟换顺序
- `exhaustMap` 防重复提交

---

### 68. Angular standalone vs NgModule

**答案：** 独立组件（v14+，v17+ 默认）声明自己的 imports/providers 并跳过 NgModule 注册——更简单心智模型、更好摇树、更快构建。NgModule 仍用于分组相关声明和遗留互操作。新应用应 100% 独立；库正在迁移。

**要点：**
- `bootstrapApplication(AppComponent, { providers: [...] })` 替代 `NgModule` 引导
- 路由级懒加载：`loadComponent: () => import(...)`
- `provideRouter`、`provideHttpClient` 函数式配特性
- 迁移 schematic：`ng generate @angular/core:standalone`

---

### 69. Vue 组合式 vs 选项式 API

**答案：** 选项式 API 按 lifecycle/data/methods 分组代码——易学，但一个特性的逻辑散布在选项间。组合式 API（`setup`/`<script setup>`）用 composable（可复用 hook 式函数）按关注分组代码——对 TypeScript 和大组件更好。Vue 3 都发；新代码推荐组合式。

**要点：**
- `<script setup>` 是人体工程语法
- Composable（`useFoo`）替代 mixin
- 选项式 API 仍工作，无弃用计划
- 响应原语（`ref`、`reactive`、`computed`、`watch`）是构件

---

### 70. Vue Proxy 响应

**答案：** Vue 3 用 `Proxy` 包响应对象，组件渲染期间跟踪属性访问，被跟踪属性变化时重跑渲染。`ref` 包原语（`.value`），`reactive` 包对象。Computed 属性缓存到依赖变化。避免解构响应对象——你失响应。

**要点：**
- `toRefs`/`toRef` 解构时保响应
- Vue 2 用 `Object.defineProperty`，漏了新属性——v3 修复
- `shallowRef`/`shallowReactive` 大对象求性能
- `readonly` 创建不可变视图

---

### 71. SSR vs SSG vs CSR vs ISR

**答案：** CSR 发壳 + JS 在客户端取并渲染——首绘慢、后续导航快。SSR 每请求渲染 HTML——适合个性化/SEO 内容但服务器成本高。SSG 部署时预建页——发最快，但重建前陈旧。ISR（Next.js）发缓存页并按计划重验证——SSR+SSG 最佳。Server Components 加第四维：每组件服务器渲染。

**要点：**
- 流式 SSR 数据解决时发 HTML 块
- 边缘 SSR 在用户附近跑求低延迟
- SSG 只对构建时已知的内容工作
- ISR 重验证策略需小心避免缓存雪崩

---

### 72. 路由：客户端 vs 服务端

**答案：** 服务端路由每 URL 返回完整 HTML 文档——简单、SEO 友好、不需 JS。客户端路由拦截导航、取数据、换视图无页面刷——转换更快但需 JS。现代框架混用：服务器渲染初始页，客户端接管后续导航（混合/同构路由）。

**要点：**
- History API（`pushState`/`replaceState`）驱动客户端路由
- `<a>` 应仍在无 JS 时工作（渐进增强）
- 路由代码切分减小初始 bundle
- View Transitions API 启用流畅客户端路由动画

---

### 73. 表单库（react-hook-form vs Formik）

**答案：** React-hook-form 用 ref 非受控输入，最小化重渲染——性能好、bundle 小、与 Zod/Yup 集成。Formik 基于受控输入，更多重渲染但小表单心智模型更简单。复杂表单（向导、动态字段、异步校验）react-hook-form 是现代默认。

**要点：**
- Zod/Yup/Valibot 做 schema 校验
- 动态列表用 `useFieldArray`
- 服务器渲染表单仍受益于渐进增强
- TanStack Form 是新兴的框架无关替代

---

### 74. 容器/展示 vs hook 驱动

**答案：** 经典容器/展示分离把数据取与渲染隔离——hook 前有用。Hook 驱动架构通过自定义 hook（`useUser`、`useCart`）把数据需求与组件共置，减少 prop drilling。Server Components 推得更远，让数据层从客户端代码消失。

**要点：**
- 自定义 hook 是现代"容器"——隔离可测
- 展示组件对设计系统仍有价值
- 复合组件模式分组相关 UI（Tabs/Tab）
- 避免过早抽象——模式出现时抽

---

### 75. 微前端：模块联邦 vs iframe vs single-spa

**答案：** 模块联邦（Webpack 5、Rspack、Vite 通过插件）运行时跨独立构建应用共享模块——共享依赖、原生组合、无 iframe 隔离。Iframe 给硬隔离（分开 JS 上下文、CSS 沙箱）但 UX 差（auth、导航、高度同步）。single-spa 通过 lifecycle 契约在一页上编排多框架。按团队自治 vs UX 一致性权衡选。

**要点：**
- 联邦需要小心对齐共享依赖版本
- iframe 适合遗留/第三方集成
- Native Federation（Angular）是 Angular 风味
- 单仓库单部署常胜 MFE 复杂

---

### 76. 关键渲染路径

**答案：** 浏览器从 HTML 建 DOM、从 CSS 建 CSSOM、组合成渲染树、布局（几何）、绘制（像素）、合成层。CSS 阻渲染；同步 JS 阻解析器。通过最小化关键资源、延迟非关键 JS、内联关键 CSS、脚本用 async/defer 优化。

**要点：**
- `defer` 在解析后、`DOMContentLoaded` 前跑
- `async` 到达就跑（无序）
- 预加载关键资源，预连第三方源
- DevTools 性能面板可视化路径

---

### 77. Core Web Vitals（LCP、INP、CLS）

**答案：** LCP（最大内容绘制）测加载速度——目标 <2.5s。INP（交互到下次绘制）2024 替代 FID，跨所有交互测响应——目标 <200ms。CLS（累计布局偏移）测视觉稳定——目标 <0.1。Google 用它们作排名信号。

**要点：**
- LCP 杀手：渲染阻塞 CSS、大图、慢服务器
- INP 杀手：长任务、重事件处理器、同步布局
- CLS 杀手：缺图尺寸、晚注入广告/横幅
- `web-vitals` 库报现场数据

---

### 78. 代码切分与懒加载

**答案：** 按路由、特性或组件切 bundle，让用户只下所需。动态 `import()` 是原语；框架包装（`React.lazy`、Next.js dynamic、Angular `loadComponent`）处理 Suspense。注意瀑布加载——空闲时预取可能的下一路由。

**要点：**
- 按路由切分是最高影响起点
- 用 `<link rel="prefetch">` 或框架提示预取
- 别过度切分——太多小块伤 HTTP 开销
- Bundle 分析器（webpack-bundle-analyzer、rollup-plugin-visualizer）指导决策

---

### 79. 摇树——什么阻塞

**答案：** 摇树在打包期消除未用 export。需要 ESM（静态分析）、无副作用模块（package.json `"sideEffects": false`）和纯顶层代码。阻塞：CJS 模块、动态 `require`、顶层副作用、通过桶文件再 export、过早转译到 CJS。

**要点：**
- `/*#__PURE__*/` 注解标调用为无副作用
- Lodash-es 摇树；lodash（CJS）不
- 避免 `import * as`——命名 import
- 用 bundle 分析器验证

---

### 80. HTTP 缓存：Cache-Control、ETag、Last-Modified

**答案：** `Cache-Control` 指令治理新鲜度：`max-age`、`s-maxage`、`public`/`private`、`immutable`、`no-store`、`stale-while-revalidate`。过期后，条件重验证用 `ETag`（内容哈希）配 `If-None-Match`，或 `Last-Modified` 配 `If-Modified-Since`，返回 304 跳 body。哈希命名的静态资源用 `Cache-Control: public, max-age=31536000, immutable`。

**要点：**
- `stale-while-revalidate` 后台刷新时发陈旧
- HTML 应 `no-cache`（每次重验证）让部署传播
- CDN 与浏览器 `max-age` 分别尊重 `s-maxage`
- `Vary` 头告诉缓存哪些请求头区分响应

---

### 81. CDN 与边缘缓存

**答案：** CDN 在用户附近 PoP 缓存静态资源，降延迟和源压力。现代 CDN（Cloudflare、Fastly、Vercel）也跑边缘函数做 SSR/个性化。缓存策略：源屏蔽、分层缓存、按标签清除、签名 URL。边缘 SSR 在全球 <50ms TTFB 跑你代码。

**要点：**
- 缓存 key 含 URL，有时含头/cookie——通过 `Vary` 控
- 按标签清除做细粒度失效
- HTTP/2 push 大体被弃；用 early hint / preload
- 源屏蔽减到源的缓存 miss

---

### 82. CORS 预检与凭证

**答案：** 浏览器对"非简单"跨源请求（自定义头、非 GET/POST/HEAD、JSON body）发预检 `OPTIONS`。服务器必须以 `Access-Control-Allow-Origin`、`-Methods`、`-Headers` 响应，（凭证）则 `-Credentials: true` 配具体源（不是 `*`）。发 cookie 时 fetch 设 `credentials: 'include'`。

**要点：**
- 简单请求跳预检（form-encoded POST、GET）
- `Access-Control-Max-Age` 缓存预检结果
- `SameSite` cookie 仍在 CORS 之上应用
- 错误：返 `*` 配凭证——浏览器拒

---

### 83. Cookie：SameSite/Secure/HttpOnly

**答案：** `HttpOnly` 对 JS 隐藏（缓解 XSS 盗）。`Secure` 要求 HTTPS。`SameSite=Strict` 完全阻跨站发；`Lax`（默认）允许顶级导航 GET；`None` 允许所有跨站但要求 `Secure`。`Partitioned`（CHIPS）随第三方 cookie 淘汰选入每顶级站 cookie 存储。

**要点：**
- 认证 token 应 `HttpOnly; Secure; SameSite=Lax`
- 嵌入小部件需要 `SameSite=None; Secure; Partitioned`
- Cookie 大小限 ~4KB；考虑头臃肿
- 用 `__Host-` 前缀求最严安全保证

---

### 84. XSS、CSRF、点击劫持缓解

**答案：** XSS：永不 `innerHTML` 不信输入；渲染时转义；用 CSP；用 DOMPurify 清洗；优先框架绑定渲染。CSRF：SameSite cookie + 状态变更请求的 CSRF token；双提交 cookie 模式。点击劫持：`X-Frame-Options: DENY` 或 CSP `frame-ancestors 'none'`。

**要点：**
- 存储型 XSS 比反射型更糟
- Trusted Types API 助强制安全 DOM sink
- CSRF 只影响浏览器发的凭证（cookie、basic auth）
- React/Vue/Angular 默认转义——`dangerouslySetInnerHTML` 是选入

---

### 85. CSP 推出

**答案：** Content Security Policy 把脚本/样式/图等的源加白名单。从 `Content-Security-Policy-Report-Only` 开始记违规而不破。迭代移除 `unsafe-inline`（用 nonce/哈希）和 `unsafe-eval`。配 `strict-dynamic` 做 SPA 友好脚本允许。

**要点：**
- 内联脚本每请求需 nonce
- 报告端点接收违规 JSON
- `frame-ancestors` 替代 `X-Frame-Options`
- `upgrade-insecure-requests` 把 HTTP 重写为 HTTPS

---

### 86. 前端 auth：localStorage 中 JWT vs httpOnly cookie

**答案：** `localStorage` 任何 JS 可读——XSS 盗 token。`httpOnly` cookie 对 JS 访问免疫，自动发送，但易受 CSRF（用 SameSite + CSRF token 缓解）。Cookie 是浏览器 auth 标准；localStorage 只对纯 API SPA 短命 token + 强 CSP 可接受。

**要点：**
- 刷新 token 轮换减爆炸半径
- 也别在 `sessionStorage` 存 token（仍 JS 可访问）
- BFF（Backend-for-Frontend）模式让 token 完全离客户端
- 公共客户端要求 OAuth PKCE

---

### 87. WebSocket vs SSE vs 长轮询

**答案：** WebSocket 双向、低延迟，理想用于聊天/游戏/协作编辑——需要服务器支持并处理二进制。SSE 是单向（服务器 → 客户端）HTTP 上、更简单、自动重连、通过多数代理工作，但仅文本且每源浏览器连接有限。长轮询是通过保持请求开模拟推的回退。

**要点：**
- SSE 适合通知、实时 feed、AI 流
- WebSocket 需心跳应对空闲超时
- WebTransport（HTTP/3）是低延迟双向的新兴继任者
- SSE 在 HTTP/1.1 有每源连接限制

---

### 88. 图片优化清单

**答案：** 选对格式（带回退的 AVIF/WebP）、通过 `<picture>` 配 `srcset`/`sizes` 发、设 `width`/`height` 保位、首屏下 `loading="lazy"`、LCP 图 `fetchpriority="high"`、用支持即时缩放的 CDN、剥元数据、激进压缩。图标/logo 用 SVG。

**要点：**
- LCP 图不应 lazy
- `decoding="async"` 避免阻主线程
- 用 `aspect-ratio` CSS 避 CLS
- Blurhash/LQIP 占位改善感知性能

---

### 89. 字体加载（`font-display: swap`、preconnect、子集）

**答案：** `font-display: swap` 立即显示回退然后换 web 字体（FOUT）——避免不可见文本（FOIT）。`preconnect` 到字体源省往返。子集剥未用字形（仅拉丁省大量字节）。严格 CLS 预算自托管或用 `font-display: optional`。

**要点：**
- 可变字体替代多重量文件
- WOFF2 是唯一需要的现代格式
- `size-adjust` CSS 最小化回退与 web 字体间布局偏移
- 预加载关键字体：`<link rel="preload" as="font" crossorigin>`

---

### 90. 打包器：Webpack vs Vite vs esbuild vs Rollup

**答案：** Webpack 是成熟、插件重的主力——慢但灵活。Vite 开发用原生 ESM（不打包），生产用 Rollup——HMR 快、DX 好。esbuild 是 Go 基础打包/转译，极快，Vite 内部用做变换。Rollup 在库 bundle 出色（干净 ESM 输出、摇树）。Rspack（Rust）和 Turbopack（Rust）是新兴 Webpack 兼容替代。

**要点：**
- Vite 是新前端应用默认
- Webpack 仍主导企业/遗留
- 与 Rollup 相比 esbuild 插件 API 有限
- 库作者通常选 Rollup 或 tsup（esbuild 基础）

---

### 91. 生产中的 source map

**答案：** Source map 把压缩代码映射回原始源做调试和错误追踪。生产生成但别公开——传 Sentry/Datadog 或通过认证/限 IP 提供。`hidden-source-map`（Webpack）省去 `//# sourceMappingURL` 注释让浏览器不自动取。

**要点：**
- 没 source map，堆栈不可读
- `sourceMappingURL` 可指向私有主机
- map 与部署一起版本化
- `eval-source-map` 仅开发；生产用外部 `.map` 文件

---

### 92. 单仓库（Nx、Turborepo）vs 多仓库

**答案：** 单仓库共置多包，简化重构、共享工具和跨包原子变更。Nx 加任务编排、项目图和生成器；Turborepo 聚焦缓存和流水线并行。多仓库给严格隔离和独立部署但复杂化跨切变更。pnpm workspace 是轻量起点。

**要点：**
- 远程缓存（Nx Cloud、Turborepo Remote Cache）是杀手特性
- 用 code owner 和每包 CI 求规模
- 极大规模用 Bazel/Pants（Google/Meta 风格）
- 多仓库加 changeset 对 OSS 包族适用

---

### 93. 测试金字塔

**答案：** 底层多快单元测试、中间少集成测试、顶层少慢 E2E 测试。现代变体（测试奖杯）把更多重量放在 React Testing Library 集成测试上——它们抓真 bug 而不脆。E2E 只覆盖关键用户旅程（登录、结账）。

**要点：**
- 避免测实现细节
- 求快速反馈——单元测试以毫秒计
- 契约测试（Pact）替代部分跨服务集成测试
- 覆盖率是健全检查，不是目标

---

### 94. Jest vs Vitest vs Playwright vs Cypress

**答案：** Jest 是长存的 React/Node 单元测试 runner。Vitest 是 Vite 原生、更快、ESM 优先的 Jest 兼容 API 替代。Playwright 是多浏览器 E2E 框架（Chromium/Firefox/WebKit）带优秀并行和追踪。Cypress 是开发者友好 E2E runner 带时间旅行调试但跑在浏览器内且每测试单浏览器。

**要点：**
- Vitest 是 Vite/SvelteKit/Astro 项目的新默认
- Playwright 在跨浏览器上追赶 Cypress
- Playwright 和 Cypress 也支持组件测试
- 两者都用 MSW 做 API 模拟

---

### 95. 模拟（MSW、fetch-mock、DI）

**答案：** MSW（Mock Service Worker）在网络层拦截请求（浏览器中 service worker、Node 中请求拦截器），所以应用代码不变。Fetch-mock 直接打 `fetch` 补丁——更简单但把测试与传输耦合。依赖注入在接缝处替换真实现——最可测但需要架构支持。

**要点：**
- MSW 在开发、测试和 Storybook 中同样工作
- 单元和 E2E 同一组 handler 减漂移
- 别模拟你不拥有的——先包再模拟
- 快照测契约，不测模拟

---

### 96. 视觉回归（Percy/Chromatic）

**答案：** 视觉回归工具快照渲染组件/页面并对基线 diff，抓非故意 UI 变化。Chromatic 与 Storybook 集成；Percy 框架无关；Playwright 内置截图 diff。波动来自字体、动画、日期——把它们桩掉。

**要点：**
- 配 Storybook 做每组件覆盖
- 跨浏览器快照倍增基线计数
- 评审者 UI 必备——diff 需人批准
- 用确定性测试数据（冻时间、种子随机）

---

### 97. A11y 测试（axe-core、lighthouse、屏幕阅读器）

**答案：** 自动工具（通过 jest-axe 或 Playwright 的 axe-core、Lighthouse）抓约 30-50% 问题——缺 label、对比、ARIA 误用。手动测试填其余：仅键盘导航、屏幕阅读器（NVDA、JAWS、VoiceOver）、缩放到 200%、reduced-motion。在 CI 烤检查防回归。

**要点：**
- Storybook addon-a11y 每 story 跑 axe
- Lighthouse a11y 分是起点，不是终点
- 用真辅助技术测，不只仿真
- 可能时把残障用户纳入测试

---

### 98. 特性开关——客户端 vs 服务端评估

**答案：** 客户端评估把开关配置发到浏览器——灵活、支持 A/B，但暴露开关名并加 bundle 重。服务端评估保逻辑私有只发解决变体——对敏感推出和 SEO 更好。混合：服务器在首请求解决，水合客户端 SDK 做后续切换。

**要点：**
- LaunchDarkly、Statsig、Unleash、Flagsmith 是常见供应商
- 把开关读包在类型化包装中求安全
- 粘性分桶需要用户身份
- 推出后清开关——技术债积累

---

### 99. 遥测：错误追踪 vs RUM vs APM

**答案：** 错误追踪（Sentry、Rollbar）带堆栈和面包屑捕异常。RUM（真实用户监控）收现场性能——Core Web Vitals、导航时序、自定义事件——每真用户。APM（Datadog、New Relic）把前端与后端追踪绑做端到端延迟。三者互补。

**要点：**
- 高流量站重采样
- Source map 对可读堆栈必备
- 分布式追踪（OpenTelemetry）跨服务传 trace ID
- 数据离客户端前必须 PII 清洗

---

### 100. PWA：SW 生命周期、离线策略、安装提示

**答案：** Service Worker 生命周期：`install`（缓存壳）、`activate`（清旧缓存）、`fetch`（拦网络）。离线策略：缓存优先（静态资源）、网络优先（带回退的 API）、stale-while-revalidate（好 UX/新鲜度平衡）。`beforeinstallprompt` 事件让你推迟安装提示到用户选时刻。Workbox 抽象常见模式。

**要点：**
- manifest + HTTPS + SW + 离线页 = 可安装 PWA
- 更新流：新 SW 激活时提示用户重载
- 后台同步排队失败变更重试
- iOS PWA 支持有限；真机测试

---
