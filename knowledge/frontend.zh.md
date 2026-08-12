# 前端面试题

100 道高频前端题，覆盖 HTML/CSS、JavaScript/TypeScript、框架（React/Angular/Vue）、性能、测试、可访问性、网络和构建工具。

---

### 1. 盒模型与 `box-sizing: border-box`

**频率：** 高

**题目：** 请讲解 CSS 盒模型，以及 `box-sizing: border-box` 如何改变尺寸计算？

**答案：** CSS 盒模型把每个元素包裹在四层嵌套盒子里：**content**（文字/图片）、**padding**（边框内的空间）、**border**、**margin**（盒外空间，把它和邻居隔开）。每个元素都是由这些层组成的矩形，搞清楚某个属性作用于哪一层，是可预期布局的关键。

**默认的 `content-box`** 让 `width`/`height` **只作用于内容区**，因此 padding 和 border 是*额外叠加*的。一个 `width: 200px; padding: 20px; border: 5px` 的元素实际渲染为 **250px** 宽（200 + 20×2 + 5×2）——这是「我的盒子怎么变大了？」这类 bug 的常见根源。**`border-box`** 则让 `width`/`height` *包含* padding 和 border，于是同样的元素恰好渲染为 **200px**，内容区自动缩小去吸收 padding/border。这更可预期，尤其在**grid/flex 布局**里——你设置百分比或 `flex-basis` 宽度时，不希望 padding 撑爆轨道。这就是为什么几乎所有现代 reset 都全局应用它：
```css
*, *::before, *::after { box-sizing: border-box; }
```

两个值得记住的坑：**margin 在盒子之外**，不计入 `width`；而**相邻的垂直 margin 会合并**（20px 下 margin 挨着 30px 上 margin，合计是 30px 而非 50px）。`box-sizing` **默认不继承**——是通配选择器的 reset 让它扩散开的——而 DevTools 计算样式里的**盒图**是查明某个多余像素来自哪里的最快方式。

**要点：**
- `content-box` 是规范默认；`border-box` 是实用默认
- Margin 在盒外，块元素之间垂直方向会合并
- `box-sizing` 只有显式声明 `inherit` 才会继承
- 用 DevTools 计算样式的盒图调试尺寸意外

---

### 2. 块级 vs 行内 vs 行内块

**频率：** 高

**题目：** 请对比 `block`、`inline`、`inline-block` 三种 display 类型。

**答案：** 这三个 `display` 值在三个维度上不同：**是否另起一行**、**是否占满宽度**、**是否遵守 `width`/`height`/垂直 margin**。

- **`block`**（`div`、`p`、`section`、`h1`）——**另起一行**，撑满容器的**全部可用宽度**，并**完全遵守** `width`、`height` 和四个方向的 margin/padding。这是结构布局的主力。
- **`inline`**（`span`、`a`、`em`、`strong`）——**随文本流动**在同一行，宽度只与内容相同，且**忽略 `width`/`height` 和垂直 margin**。水平 padding/margin 在视觉上生效但不会把相邻行推开。由于行内盒坐落在文字基线上，它们遵守 **`line-height`**，而 HTML 里行内标签之间的空白**会渲染成真实的空格间隙**（inline-block 间那个经典的「神秘 4px 间隙」）。
- **`inline-block`**——混合体：它**行内排列**在周围文字旁，但**接受盒尺寸**（`width`、`height`、垂直 margin）。在 flexbox 之前，这是水平按钮行、徽章、导航项的首选。

两个重要细节：**替换型行内元素**如 `<img>`、`<input>`、`<video>` *尽管*是行内却接受 `width`/`height`，因为它们包裹带固有尺寸的外部内容。而当父元素变成 `display: flex` 或 `grid` 时，其子元素不再遵从自己的 block/inline 特性，而是变成 **flex/grid 项**。现代代码里你会用 **flex 或 grid** 而非 inline-block 技巧——它们提供 gap 控制、对齐，且没有空白间隙的意外。

**要点：**
- 行内元素遵守 `line-height` 并在标签间产生空白
- 父元素 `display: flex/grid` 让子元素表现为块级参与者
- 替换型行内元素（`img`、`input`）虽是行内但接受宽高
- 现代布局用 flex/grid 替代行内块技巧

---

### 3. Flexbox 轴与 flex-grow/shrink/basis

**频率：** 高

**题目：** Flexbox 的轴是怎么工作的，`flex-grow`/`shrink`/`basis` 到底控制什么？

**答案：** flex 容器定义两条轴：**主轴**（`flex-direction: row` 默认时为水平）和与之垂直的**交叉轴**。对齐属性映射到这两条轴上——**`justify-content`** 沿**主轴**分布项（start/center/space-between 等），而 **`align-items`**（在容器上）和 **`align-self`**（每项）沿**交叉轴**对齐。混淆两者是 flex 的头号困惑；诀窍是记住 `justify` 跟随项流动的方向。

**`flex` 简写**是 `flex: <grow> <shrink> <basis>`，控制空闲空间如何分配：
- **`flex-grow`**——分配**剩余空间**的无单位权重。三个 `grow: 1` 的项平分多余空间；`grow: 2` 的项拿到两倍份额。
- **`flex-shrink`**——当项放不下时吸收**溢出**的权重。`shrink: 0` 表示「永不把我缩到 basis 以下」。
- **`flex-basis`**——grow/shrink 运行前的**假设起始尺寸**（类似 `width` 但沿主轴）。`auto` 使用项的内容/`width`。

所以 **`flex: 1`** 展开为 `1 1 0%`——从零 basis 自由 grow 和 shrink，得到等宽列。**`flex: auto`** 是 `1 1 auto`（从内容尺寸 grow），**`flex: none`** 是 `0 0 auto`（刚性）。

实用提示：**`flex-direction: row-reverse`/`column`** 切换主轴（进而改变 `justify`/`align` 的含义）；**`flex-wrap: wrap`** 让项换到多行，此时 **`align-content`** 控制*行之间*的间距；**`gap`** 现在在 flex 容器里可用，取代旧的负 margin 技巧；给 flex 子元素设 **`min-width: 0`** 是修复那个著名 bug（长文本或宽子元素拒绝缩小）的办法——flex 项默认 `min-width: auto`，不会缩到内容尺寸以下。

**要点：**
- `flex-direction: row-reverse/column` 切换主轴
- `flex-wrap: wrap` 让行换行；配 `align-content` 做多行交叉对齐
- `gap` 在 flex 中可用（现代浏览器），避免负 margin 技巧
- flex 子元素 `min-width: 0` 防止文本溢出撑爆布局

---

### 4. 定位：static/relative/absolute/fixed/sticky

**频率：** 高

**题目：** 请对比五种 CSS `position` 取值及其常见坑。

**答案：** `position` 属性控制元素如何被摆放，以及 `top`/`right`/`bottom`/`left`（即 inset 偏移）起什么作用：

- **`static`**——默认值。元素处于正常流中，并**完全忽略 inset 属性**。
- **`relative`**——留在流中（**原空间被保留**），但你可以用 inset **在视觉上偏移**它。关键是它建立了**定位上下文**：绝对定位的后代现在以它为锚点。
- **`absolute`**——**移出正常流**（兄弟元素像它消失一样闭合），相对**最近的已定位祖先**（最近的非 `static` 定位祖先）定位，找不到则回退到初始包含块。不设显式宽度时会**折成内容宽度**。
- **`fixed`**——移出流并相对**视口**定位，因此滚动时保持不动（粘性头部、聊天挂件）。
- **`sticky`**——混合体，在越过滚动阈值（由 `top: 0` 之类的 inset 定义）**之前**表现为 `relative`，之后在其滚动容器内像 `fixed` 一样「粘住」。

绊倒人的坑：**祖先上的 `transform`、`filter` 或 `will-change`** 会创建新的包含块，从而把 **`fixed` 元素困在**其中（它们会随滚动移走而非固定）——这是「我的模态框为什么固定不住？」的常见 bug。**`sticky` 会静默失效**，除非它有**可滚动祖先**和**定义的偏移**；父元素上的 `overflow: hidden` 也会破坏它。而任何带 **`z-index`** 的定位元素都会创建**堆叠上下文**，可能出人意料地把其子元素的 z 顺序与页面其余部分隔离开。

**要点：**
- 祖先有 `transform`、`filter` 或 `will-change` 会困住 `fixed` 元素
- `sticky` 需要可滚动祖先和定义的 `top`/`bottom`
- absolute 元素不设尺寸时折成内容宽度
- 带 `z-index` 的定位元素创建堆叠上下文

---

### 5. 优先级规则与 `!important`

**频率：** 高

**题目：** CSS 优先级是怎么计算的，`!important` 和 `@layer` 又如何定位？

**答案：** 优先级决定哪条相互竞争的规则胜出，按**四部分元组 `(a, b, c, d)`** 计算：
- **a**——inline `style=""` 属性
- **b**——**ID** 选择器（`#header`）
- **c**——**类、属性、伪类**（`.btn`、`[type=text]`、`:hover`）
- **d**——**元素和伪元素**（`div`、`::before`）

从左到右比较：一个 ID `(0,1,0,0)` 胜过任意多个类 `(0,0,5,0)`。当两条规则**优先级相同时，后声明的胜出**（源顺序）。注意元组**不进位**——十一个类仍是 `(0,0,11,0)`，不是一个 ID。

**`!important`** 跳出这个排序，进入一个单独的、更高优先级的层。完整的起源级联从低到高：user-agent → user → **author normal** → author `!important` → user `!important` → user-agent `!important`。所以 author `!important` 不论优先级多高都能覆盖所有正常 author 样式——这就是 `!important` 大战升级的原因。

**`@layer`（级联层）** 是现代解法：你按定义好的顺序声明命名层（`@layer reset, base, components, utilities;`），**后面的层不论优先级都胜过前面的层**。这让你按角色组织样式而非打优先级军备竞赛，也大幅减少了 `!important` 的使用。另外有用：**通配选择器 `*` 和 `:where()`** 优先级为**零**（适合低优先级默认值），而 **`:is()` 和 `:not()`** 取其参数中**最高的优先级**。把 `!important` 留给工具框架或覆盖顽固的第三方样式。

**要点：**
- 通配选择器 `*` 与 `:where()` 优先级为零
- `:is()` 和 `:not()` 取参数中最高优先级
- 优先用级联层而非优先级军备竞赛
- 工具框架或第三方覆盖外避免 `!important`

---

### 6. 响应式：媒体查询、`clamp()`、容器查询

**频率：** 高

**题目：** 哪些工具驱动响应式设计——媒体查询、`clamp()` 和容器查询？

**答案：** 响应式设计有三个互补的工具层：

**媒体查询**根据**视口或设备特性**适配样式。除了经典的 `@media (min-width: 768px)`，它们还读取用户/环境偏好，如用于主题的 `(prefers-color-scheme: dark)` 和用于可访问性的 `(prefers-reduced-motion: reduce)`。惯例是**移动优先**：先为小屏写基础样式，再用 **`min-width`** 查询叠加增强（桌面优先用 `max-width`，往往积累覆盖）。例：
```css
.card { padding: 1rem; }
@media (min-width: 768px) { .card { padding: 2rem; } }
```

**`clamp(min, preferred, max)`** 不靠断点产生**流体值**——它返回 `preferred` 值但永不低于 `min` 或高于 `max`。配合视口单位能得到平滑缩放的字号和间距：`font-size: clamp(1rem, 2vw + 0.5rem, 1.5rem)` 随视口增长但在两端都保持可读，取代一堆媒体查询字号覆盖。

**容器查询（`@container`）** 是最新的重大进步：组件不再响应*视口*，而是响应**自己容器的尺寸**，于是同一个卡片在宽主栏或窄侧边栏里都显得得体。你用 **`container-type: inline-size`** 让父元素参与，然后查询它：
```css
.sidebar { container-type: inline-size; }
@container (min-width: 400px) { .card { display: grid; } }
```
这实现了**真正的组件级响应**——可复用组件适应上下文而非页面。始终用 `prefers-reduced-motion` 配合动画，避免触发前庭不适。

**要点：**
- 移动优先用 `min-width` 查询；桌面优先用 `max-width`
- 用 `container-type: inline-size` 定义容器
- `clamp()` 与视口单位配合：`clamp(1rem, 2vw, 1.5rem)`
- 为可访问性尊重 `prefers-reduced-motion`

---

### 7. 用于 SEO/a11y 的语义化 HTML

**频率：** 高

**题目：** 语义化 HTML 对 SEO 和可访问性为什么重要？

**答案：** 语义化 HTML 指使用**描述自身含义**的元素——`<header>`、`<nav>`、`<main>`、`<article>`、`<section>`、`<aside>`、`<footer>`、`<figure>`、`<time>`——而非一堆 `<div>`。那个含义同时被三类受众消费：浏览器、辅助技术和搜索爬虫。

对**可访问性**而言，这些元素暴露出屏幕阅读器用户用来导航的 **landmark**——用户可以直接跳到 `main`、循环遍历 `nav` 区域、或列出所有标题来理解页面结构。用 `<div class="header">` 搭的页面则没有任何可导航的东西。**标题层级**同样重要：用**一个 `<h1>`** 表示页面主题，且**不要跳级**（`h2` → `h4`），因为屏幕阅读器从标题构建大纲，跳级意味着结构缺失。

对 **SEO** 而言，语义化标记给爬虫更**丰富的文档大纲**，帮它们区分主内容与导航/样板并适当加权。你再在上面叠加 **微数据或 JSON-LD 结构化数据** 以获得丰富结果（评分、面包屑、活动）。

由此得出的实用规则：**动作用 `<button>`、导航用 `<a href>`**（绝不用可点击的 `<div>`）——真控件自带键盘焦点、Enter/Space 激活和正确的 ARIA role。**避免 `<div role="button">`**；你得重新实现原生 `<button>` 免费提供的可聚焦性和键盘处理。并且给**每个表单输入都加 label**（`<label for>` 或包裹的 label），让其用途被报读。语义是基础；ARIA 只在没有合适原生元素时补漏。

**要点：**
- 动作用按钮，导航用链接
- 每个表单输入要 `<label for>` 或包裹的 label
- 避免 `<div role="button">`——用真 `<button>`
- 微数据/JSON-LD 在语义之上加结构化数据

---

### 8. `var` vs `let` vs `const`；提升与 TDZ

**频率：** 高

**题目：** 请对比 `var`、`let`、`const`，并解释提升与暂时性死区（TDZ）。

**答案：** 三者在**作用域、提升行为、可重新赋值性**上不同。

**`var`** 是**函数作用域**（忽略 `if`/`for` 等块边界），被**提升**到函数顶部，并**初始化为 `undefined`**——所以在赋值行之前读到的是 `undefined` 而非报错。它还在顶层**在全局对象（`window`）上创建属性**，污染全局作用域。

**`let`** 和 **`const`** 是**块作用域**，虽然*也*被提升，但**不被初始化**。从块顶部到声明行之间它们处于**暂时性死区（TDZ）**——在那里访问会抛 `ReferenceError`。这是故意的：它捕获 `var` 静默掩盖的先用后声明 bug。两者都不创建全局对象属性。
```js
console.log(a); // undefined（var 提升 + 初始化）
console.log(b); // ReferenceError（let 在 TDZ）
var a = 1; let b = 2;
```

**`const`** 额外禁止**重新绑定**变量——但*不*禁止对其指向内容的变更。`const arr = []; arr.push(1)` 没问题；`arr = []` 报错。需要真正的浅不可变时用 **`Object.freeze`**（注意它是浅的——嵌套对象仍可变）。

还有一个区别：**函数声明完全提升**（在它的行之前就可调用），而赋给 `var`/`let` 的**函数表达式**不行。现代经验法则是：新代码里**默认 `const`，需要重新赋值时才用 `let`，永不用 `var`**。

**要点：**
- `var` 在全局对象上创建属性；`let`/`const` 不会
- 函数声明完全提升；函数表达式不会
- TDZ 从块开始到声明行存在
- `const` 数组/对象仍可变——浅不可变用 `Object.freeze`

---

### 9. 闭包 + 经典循环 bug

**频率：** 高

**题目：** 什么是闭包，为什么经典的 `var` 循环会输出 `3 3 3`？

**答案：** **闭包**是一个函数与它创建时所处的**词法环境**捆绑在一起——它「记住」并在外层函数返回后仍保留对外围作用域变量的访问。这就是内层函数能读写外层变量的原因。

经典 bug：
```js
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i)); // 3 3 3
```
输出 `3 3 3`，因为 **`var` 是函数作用域**，所以三个箭头回调**闭包于同一个 `i`**。等定时器触发时（循环已结束），那个共享的 `i` 已达到 `3`。回调捕获的不是每次迭代的*值*——而是*变量*本身。

两个修复都给每次迭代**自己的绑定**：
```js
for (let i = 0; i < 3; i++) setTimeout(() => console.log(i)); // 0 1 2
```
**`let` 每次迭代创建一个新的 `i`**，所以每个闭包捕获不同的值。ES6 之前的等价做法是用 **IIFE** 把 `i` 拷贝进参数：`(j => setTimeout(() => console.log(j)))(i)`。

闭包驱动很多真实模式——**模块模式**（通过捕获的变量实现私有状态）、**部分应用/柯里化**、以及 **React hooks**（`useState` 的 setter 闭包于当前渲染的 state）。反面是两个隐患：`useEffect` 中的**陈旧闭包**，缺少依赖导致捕获旧值、effect 看到过时 state；以及**内存泄漏**，长生命闭包保留大型外层作用域（DOM 节点、缓冲区）使其无法被回收。ES 模块提供显式作用域，已大幅取代把闭包当命名空间的惯用法。

**要点：**
- 闭包驱动模块模式、部分应用和 React hook
- `useEffect` 中陈旧闭包由缺 deps 引起
- 内存泄漏：闭包保留外层作用域引用
- ES module 给显式作用域减少把闭包当命名空间的模式

---

### 10. `this` 绑定规则

**频率：** 高

**题目：** JavaScript 中决定 `this` 的规则有哪些，为什么箭头函数不同？

**答案：** `this` 在**调用时**（而非定义处）确定，按**优先级顺序**的四条规则：
1. **`new` 绑定**——调用 `new Fn()` 创建一个新对象并把 `this` 绑到它。
2. **显式绑定**——`fn.call(obj)`、`fn.apply(obj)` 或 `fn.bind(obj)` 副本强制 `this = obj`。
3. **隐式/方法绑定**——`obj.fn()` 把 `this` 绑到 `obj`（*点左边*的对象）。丢掉点就丢掉绑定：`const f = obj.fn; f()` 不再看到 `obj`。
4. **默认绑定**——普通的 `fn()` 调用回退到**全局对象**（`window`），或在**严格模式 / ES 模块中为 `undefined`**——这就是严格模式能帮你捕获意外全局写入的原因。

**箭头函数没有自己的 `this`。** 它们在定义时从外围作用域**词法继承** `this`，上面四条规则都无法改变它（连 `.call` 也不行）。这正是它们适合做**回调**的原因——传给 `setTimeout` 或 `.map` 的箭头函数保持外围方法的 `this`，而不会被重置为 `undefined`。

常见坑：**类方法不会自动绑定**，所以把 `this.handleClick` 传给事件处理器会丢掉 `this`——用箭头类字段（`handleClick = () => {}`）或在构造器里 `.bind` 修复。`forEach`/`map` 等数组迭代器接受一个 **`thisArg`** 第二参数。而 **`bind` 是永久的**——对已绑定的函数再绑定无效（只有第一次 `bind` 生效）。

**要点：**
- 类方法不自动绑定；用箭头字段或 `.bind`
- `forEach`/`map` 接受 `thisArg` 第二参数
- 严格模式防意外全局污染
- `bind` 返回新函数；重复 `bind` 只尊重第一个

---

### 11. 原型与原型链

**频率：** 高

**题目：** JavaScript 原型与原型链如何工作，`class` 与它们有何关系？

**答案：** 每个 JavaScript 对象都有一个内部 **`[[Prototype]]`** 链接（可通过 `Object.getPrototypeOf(obj)` 读取，历史上是 `__proto__` 访问器）指向另一个对象。当你访问一个属性时，引擎**沿这条链行走**——先查对象，再查其原型，再查*其*原型——直到找到属性或到达顶部的 **`null`**（`Object.prototype` 的原型）。这就是继承的工作方式：共享行为住在一个许多实例都链接的原型上。

**`Object.create(proto)`** 直接创建一个以 `proto` 为 `[[Prototype]]` 的新对象。而 **`class` 语法是这套原型机制的语法糖**，不是另一套体系：你在类体里定义的方法实际住在 `Class.prototype` 上，`extends` **把一个原型接到另一个**构建链，`super` 向上调用父构造器/方法。所以 `class Dog extends Animal` 只是把 `Dog.prototype` 的原型设为 `Animal.prototype`。

关键后果：
- **`instanceof`** 通过走链工作，检查某个构造器的 **`.prototype`** 是否出现在链中。
- **`hasOwnProperty`（或更新的 `Object.hasOwn`）** 区分对象*自身*的属性与继承的属性——迭代时必不可少。
- **原型方法在所有实例间共享**（内存中只一份），而**实例字段是每对象独有**。把方法定义在原型上（类就是这么做的）比每实例一个闭包更省内存。
- **修改内置原型**如 `Array.prototype` 是臭名昭著的反模式——它泄入页面上每个数组，可能与未来语言特性或其他库冲突。

**要点：**
- `instanceof` 走原型链检查 `.prototype`
- `hasOwnProperty`（或 `Object.hasOwn`）跳过继承属性
- 修改 `Array.prototype` 是臭名昭著的反模式
- 原型方法共享；实例字段每对象独有

---

### 12. 事件循环：宏任务 vs 微任务

**频率：** 高

**题目：** JavaScript 事件循环如何工作，宏任务与微任务有何区别？

**答案：** JavaScript 跑在**单线程**上，用一个协调两个队列的**事件循环**。每次迭代（“tick”）做：**跑一个宏任务 → 排空整个微任务队列 → 可选渲染 → 重复**。

- **宏任务**是粗粒度的工作单位：初始脚本、`setTimeout`/`setInterval` 回调、I/O、UI 事件。循环每 tick **恰好取一个**。
- **微任务**是更高优先级的后续：**Promise 的 `.then`/`.catch`/`.finally` 回调**、`queueMicrotask`、`MutationObserver`。每个宏任务后，循环**完全排空微任务队列**——包括那些微任务又调度的微任务——*才*继续前进或渲染。

这个顺序解释了经典难题：
```js
setTimeout(() => console.log('timeout'), 0);
Promise.resolve().then(() => console.log('promise'));
// 输出：promise，然后 timeout
```
Promise 回调是**微任务**，即使延迟 `0`ms 也在下一个宏任务（`setTimeout`）之前跑。

实用隐患：因为微任务在渲染前完全排空，一个**不断重新入队自己的微任务会饿死渲染**并冻住 UI。同样，任何单个任务中的**长同步工作**会阻塞整个线程——无渲染、无输入。缓解：**`requestAnimationFrame`** 在绘制*之前*跑（适合视觉更新），**`scheduler.postTask` 或 `requestIdleCallback`** 调度低优先级工作而不阻塞，**Web Worker** 把 CPU 密集计算完全移出主线程使 UI 保持响应。

**要点：**
- `Promise.resolve().then()` 在 `setTimeout(..., 0)` 之前跑
- `requestAnimationFrame` 在绘制前、微任务后跑
- 低优先级工作用 `scheduler.postTask` 或 `requestIdleCallback`
- Web Worker 把 CPU 密集工作从主线程卸载

---

### 13. Promise vs async/await；错误处理

**频率：** 高

**题目：** Promise 与 `async/await` 如何关联，应如何处理错误？

**答案：** **`async/await` 是 Promise 上的语法糖**，让异步代码**像同步代码一样从上到下阅读**。底层仍然一切都是 Promise：**`async` 函数总是返回一个 Promise**，`await` 只是暂停该函数直到 Promise 落定并解包它。

错误处理因两条规则干净地映射到 `try/catch`：
- async 函数内的 **`throw` 变成一个被拒 Promise**——调用方看到的是拒绝而非同步异常。
- **`await` 解包已兑现值或在拒绝时重新抛出**——所以被拒的 `await somePromise` 会*在 await 处*抛出，周围的 `try/catch` 能捕获。
```js
async function load() {
  try {
    const res = await fetch(url);      // 拒绝在此重新抛出
    return await res.json();
  } catch (e) {
    // 同时捕获 fetch 拒绝和上面任何 throw
  }
}
```
始终要么用 **`try/catch`** 包 await，要么给返回的 Promise 附 **`.catch`**。**未处理拒绝默认让 Node ≥ 15 崩溃**并在浏览器 DevTools 中以错误浮现——都是缺少处理器的信号。

两个面试官常探的细节：**`await` 暂停的是函数，不是线程**——你等待时事件循环继续跑其他工作，所以 await 不会阻塞页面。而**顺序 await 是常见的性能错误**：`await a(); await b();` 一个接一个跑。若它们独立，**用 `Promise.all` 并行化**：`const [x, y] = await Promise.all([a(), b()])` 并发跑两者并等两者。

**要点：**
- `async` 函数始终返回 Promise
- `await` 暂停函数，不是线程
- 用 `Promise.all` 并行化独立 await
- `await` 周围的 `try/catch` 同时捕获同步抛和拒绝

---

### 14. `Promise.all` vs `allSettled` vs `race` vs `any`

**频率：** 高

**题目：** 请对比 `Promise.all`、`allSettled`、`race`、`any`。

**答案：** 四者都接受一个 Promise 可迭代对象，但在**何时落定**和**如何对待失败**上不同：

- **`Promise.all`**——在**每个** Promise 都兑现后以**所有结果的数组**解决，但**快速失败**：只要*任一* Promise 拒绝，`all` 立即以该原因拒绝（其余继续跑但结果被丢弃）。当你需要*全部*结果且任何失败都应中止时用——如加载页面没它就无法渲染的数据。
- **`Promise.allSettled`**——**等每个** Promise（不论结果）并以 **`{status: 'fulfilled', value}`** 或 **`{status: 'rejected', reason}`** 对象数组解决。它**从不拒绝**。适合**容忍部分失败**的批量工作——发 10 个独立 API 调用并展示任何成功的。
- **`Promise.race`**——以**首个落定的** Promise 落定，无论兑现*或*拒绝。经典用途是**超时**：`Promise.race([fetch(url), timeout(5000)])` 在 fetch 太慢时拒绝。
- **`Promise.any`**——以**首个兑现**解决，忽略拒绝；仅当**全部** Promise 拒绝时才以 **`AggregateError`** 拒绝。适合**从多个镜像取**并拿最快的成功。

```js
await Promise.allSettled([a(), b(), c()]); // [{status,...}, ...]
```

对它们全都适用的关键注意事项：**都不取消仍待定的 Promise。** `race` 解决不会停掉输家的网络请求。要真正中止进行中的工作，要接一个 **`AbortController`** 并把它的 signal 传给 `fetch`。

**要点：**
- 把 `Promise.race` 与超时 Promise 组合做取消
- `allSettled` 理想用于部分失败 OK 的并行 API 调用
- `any` 适合从多个镜像取
- 都不取消待定 Promise——那用 `AbortController`

---

### 15. 防抖 vs 节流（都写）

**频率：** 高

**题目：** 防抖与节流有何区别，各自如何实现？

**答案：** 两者都**限制**函数运行的频率，但回答不同的问题：

- **防抖（Debounce）**——“等活动*停止*”。它把执行延迟到**距最后一次调用过了 N ms**，把一串爆发合并成一次尾部调用。适合**即输即搜**（用户暂停后才发查询）、输入校验、resize 稳定后重算。
- **节流（Throttle）**——“按稳定的*速率*运行”。无论来多少调用，它**每 N ms 至多执行一次**，在持续活动中给出规律更新。适合**滚动/resize/mousemove** 处理器——你要周期性更新而非只在最后一次。

它们**不可互换**：持续滚动时用防抖会*永不*触发（事件从不停够久），而在搜索框上用节流会在打字中途触发。最小实现：
```js
const debounce = (fn, ms) => {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
};
const throttle = (fn, ms) => {
  let last = 0;
  return (...a) => {
    const now = Date.now();
    if (now - last >= ms) { last = now; fn(...a); }
  };
};
```

值得一提的精化：**前缘 vs 尾缘**改变手感——前缘防抖立即触发然后忽略爆发；尾缘在最后触发。把防抖 fetch 配 **`AbortController`** 以取消上一个进行中的请求。**`requestAnimationFrame`** 是绘制相关工作的天然节流（上限为显示器刷新率）。生产中优先用 **lodash 的 `debounce`/`throttle`**——它们正确处理前缘/尾缘选项、`maxWait` 和取消边缘情况。

**要点：**
- 前缘 vs 尾缘改变 UX 感觉
- `AbortController` 可取消待防抖 fetch
- `requestAnimationFrame` 是绘制限定工作的自然节流
- 生产用 lodash/underscore 实现处理边缘情况

---

### 16. 相等：`==` vs `===` vs `Object.is`；NaN

**频率：** 高

**题目：** `==`、`===` 与 `Object.is` 有何不同，`NaN` 有何特殊之处？

**答案：** 这是三种语义逐渐更严格/更精确的相等检查：

- **`===`（严格相等）**——无强制转换；值必须**同类型同值**。几乎所有时候你都要用它。
- **`==`（宽松相等）**——应用**类型强制**，规则出了名地惊人：`[] == false` 为 `true`，`'' == 0` 为 `true`，`'0' == false` 为 `true`。强制算法不直观，所以 `==` 是 bug 磁铁。
- **`Object.is`**——像 `===`，**除了**两个边缘情况：它把 **`NaN` 视为等于自身**（`Object.is(NaN, NaN) === true`）并**区分 `+0` 与 `-0`**（`Object.is(+0, -0) === false`，而 `+0 === -0` 为 `true`）。

**`NaN`** 独特地**不等于自身**——`NaN === NaN` 为 `false`——所以你不能用相等测试它。用 **`Number.isNaN(x)`**，并优先于**全局 `isNaN`**，后者会先强制其参数（`isNaN('foo')` 误导地为 `true`），而 `Number.isNaN` 只对真正的 `NaN` 值返回 `true`。

实用指引：**始终用 `===`**，除非你有具体理由要强制。唯一被广泛接受的 `==` 用法是 **`x == null`**，它对 `null` 和 `undefined` 都为 `true`（简洁的空值检查）。做框架时值得知道：**React 的 `useState` 和 `useMemo` 的跳过比较用 `Object.is`**，这就是原地修改 state（同引用）会跳过重渲染的原因。

**要点：**
- 始终用 `===` 除非故意强制
- `null == undefined` 为真；两者都 `=== null` 为假
- React 的 `useState` 和 `Object.is` 用同等性检查
- `Number.isNaN` 比全局 `isNaN`（会强制）更安全

---

### 17. TS：`interface` vs `type`

**频率：** 高

**题目：** 在 TypeScript 中，何时该用 `interface`，何时该用 `type`？

**答案：** 两者都能**描述对象的形状**，对这个常见场景它们几乎可以互换。差异在于**能力与可扩展性**：

**`interface`** 支持**声明合并**——把同一个 interface 声明两次会合并其成员。这就是为什么它是**公开 API 表面和库类型增强**的惯用法：使用者可以重新打开你的 interface 来添加字段（如增强 `Window` 或 Express 的 `Request`）。interface 之间用 `extends` 扩展，这在大型层级中对**类型检查器解析也略快**，因为关系会被缓存。

**`type`** 别名**严格更具表达力**。只有 `type` 能命名**并集**（`type Status = 'on' | 'off'`）、**交集**、**原语或 tuple** 别名、**映射类型**、或**条件/自引用类型**。但 `type` **不可合并**——声明两次是重复标识符错误。

```ts
interface User { id: string }        // 可合并、可扩展
type Result = Success | Failure;     // 并集——interface 做不到
type Pair = [number, number];        // tuple——interface 做不到
```

两者都支持**泛型**，也都能建模多数对象契约，所以**性能可比**，真正的决定是*所需能力*而非教条。一个务实的约定：**对象形状、你希望别人扩展的、或构成公开 API 的用 `interface`；并集、tuple、函数签名和任何计算出的类型用 `type`。** 许多团队干脆默认用 `type`，只在需要合并时才用 `interface`。

**要点：**
- 大并集中 `interface` 扩展类型检查可能更快
- `type` 别名可通过条件类型自引用
- 两者支持泛型
- 声明合并对增强库至关重要

---

### 18. React VDOM 与协调

**频率：** 高

**题目：** 请解释 React 的虚拟 DOM 与协调（reconciliation）机制：状态变化时 React 如何构建新树、与前一棵树做 diff 并提交最小的 DOM 变更？请具体说明协调用到的启发式规则（1）不同元素类型如何处理（2）同类型元素如何处理 props（3）key 在列表中扮演什么角色，并谈谈 Fiber 架构为什么让协调可中断以支持并发渲染。

**答案：** React 把 UI 描述为一棵轻量**元素对象**树（虚拟 DOM）。状态变化时，React **重渲染**组件产出一棵*新*元素树，再对前一棵树**协调（reconcile）**——算出对真实 DOM 的最小变更集合并只提交那些。这就是为什么你写声明式的“UI 应该长什么样”的代码，而非手动做 DOM 手术。

朴素树 diff 是 O(n³)。React 用三条启发式把它降到 **O(n)**：
1. **不同元素类型 → 替换整棵子树。** `<div>` 变 `<span>`（或 `组件A` 变 `组件B`）会拆掉旧子树及其状态并从头构建——React 不跨类型匹配。
2. **同类型 → 保留节点，更新变化的 props。** 复用该 DOM 元素，只打补丁属性/子节点。
3. **带 key 的列表 → 按 `key` 匹配子节点。** key 让 React 识别哪些项跨渲染移动、插入或删除，而非按位置 diff。

经典 bug 是**对可重排/可过滤的列表用数组索引当 key**：因为 key 绑到位置而非身份，React 匹配错项，**状态“粘”到错误的行**（如输入框的值跳到别的项）。要用稳定唯一的 id。

**Fiber**（React 16+）把协调重写成**可中断**。工作不再是一次递归、不可停的遍历，而是拆成可暂停、恢复、排优先级的单元——支持**并发渲染**（React 18）：打字这类紧急更新能抢占低优先级渲染。一个后果是**在途的渲染工作可能被丢弃**并重启，所以 render 函数必须保持纯（无副作用）。**React 19 的编译器**加入自动的编译期记忆化，减少对手写 `useMemo`/`useCallback`/`React.memo` 的需求。

**要点：**
- 协调因启发式是 O(n)，不是完整树 diff
- 错 key 在列表中引发微妙状态 bug
- 并发渲染可丢弃在途工作
- React 19 加编译器驱动的记忆化

---

### 19. `useState` vs `useReducer`

**频率：** 高

**题目：** 在 React 中，你会如何在 `useState` 和 `useReducer` 之间做选择？

**答案：** 两者都管理组件状态；选择取决于**状态转换有多复杂**。

当你有**独立的原语或一小块对象状态**时用 **`useState`**——一个开关、一个输入值、一个计数器。每个关注点用自己的 `useState` 直接更新。

在以下情况用 **`useReducer`**：
- **下个状态以非平凡方式依赖前一状态**（多步逻辑）。
- **多个子值一起变化**——如一个异步流程必须一致地设置 `loading`、`data`、`error`。reducer 让这些转换保持原子，防止出现不可能的组合。
- **转换遵循状态机模式**（`idle → loading → success | error`）。

reducer 是**纯函数 `(state, action) => newState`**，这让它**极易独立单元测试**（无需 React），并把所有转换逻辑集中在一处可读的地方，而非散落在各个处理器里。关键是**`dispatch` 跨渲染身份稳定**，所以把它从 `useEffect`/`useCallback` 依赖数组中省略（或无害地包含）都安全——不像内联 setter 会引起抖动。

对两者都有用的技巧：**懒初始化** `useState(() => expensive())`（或 `useReducer(reducer, initialArg, init)`）只在挂载时跑一次昂贵的初始化；**函数式更新** `setX(prev => prev + 1)` 读到最新值、避免**陈旧闭包** bug。应用级状态可**把 reducer 与 Context 配对**；当逻辑超出 reducer 能力（守卫、副作用、嵌套状态）时，升级到专门工具如 **XState**（形式化状态机）或 **Zustand/Redux Toolkit**（外部 store）。

**要点：**
- 懒初始化：`useState(() => expensive())`
- 函数式更新：`setX(prev => prev + 1)` 避免陈旧闭包
- Reducer 与 Context 配对做应用级状态
- 复杂需求用 XState 或 Zustand

---

### 20. `useEffect` deps 与陈旧闭包

**频率：** 高

**题目：** `useEffect` 为什么会遭遇陈旧闭包，你如何修复？

**答案：** effect 的回调是**在某一次具体渲染中创建的闭包**，因此它捕获**那次渲染时**的 props 和 state 值。如果它用到的某个值不在**依赖数组**里，该值变化时 effect 不会重跑——它继续跑*旧*闭包、读到**过时的值**。定时器计数 bug 是典型：
```js
useEffect(() => {
  const id = setInterval(() => setCount(count + 1), 1000); // count 冻结在 0
  return () => clearInterval(id);
}, []); // 缺 `count`
```
这个定时器永远看到 `count === 0`，所以永远把值设成 `1`。

**`react-hooks/exhaustive-deps`** lint 规则正是抓这个。有两种正确修法：
1. **把 effect 引用的每个响应式值都放进依赖数组。** 值变化时 effect 会用新值重新订阅（这里每次 `count` 变就重建定时器）。
2. **不重新订阅地读到最新值**——用**函数式更新**（`setCount(c => c + 1)`，不需要依赖）或**ref**（`countRef.current`），当你想要一个*稳定*的订阅但仍看到当前数据时。ref 是“我要最新值但不想拆掉并重建 effect”的标准逃生舱。

辅助事实：**空依赖数组 `[]`** 意为“挂载时跑一次，卸载时清理”；**清理在下一次 effect 执行前和卸载时运行**（用于退订/清定时器）。**React 18 的 Strict Mode 在开发中刻意 挂载 → 卸载 → 重挂载**，把 effect 跑两次以暴露缺失的清理。**React 19 的编译器**通过自动记忆化减少手动的依赖管理。

**要点：**
- 空 deps `[]` = mount 一次跑（卸载时清理）
- 清理在下个 effect 前和卸载时跑
- React 18 Strict Mode 开发跑 effect 两次浮现 bug
- React 19 编译器减少手动 dep 管理

---

### 21. `useMemo` vs `useCallback`

**频率：** 高

**题目：** `useMemo` 与 `useCallback` 有何区别，什么时候值得用？

**答案：** 它们跨渲染记忆化的是不同东西：
- **`useMemo(fn, deps)`** 运行 `fn` 并**缓存它的返回值**，只在依赖变化时重算。它记忆化一个**计算值**。
- **`useCallback(fn, deps)`** 缓存**函数本身**（一个稳定引用）。它字面上就是 **`useMemo(() => fn, deps)` 的语法糖**——它记忆化一个*函数*而非一个值。

用其中任一恰好有**两个正当理由**：
1. **跳过昂贵重算**——记忆化一个真正代价高的计算（排序/过滤大列表、繁重转换），使它不在每次渲染重跑。
2. **保持引用身份**——每次渲染都新建的对象/数组/函数会**破坏 `React.memo` 子组件**（它们看到“变了”的 prop 就重渲染）并**重触发 `useEffect`** 依赖。包一层让值/回调跨渲染保持同一引用，那些提前退出才真正生效。这是*更常见*的真实理由——`useCallback` 几乎总是为了给记忆化子组件或 effect 喂一个稳定 prop 而存在。

面试官想听的坑：**记忆化不免费**——它花内存外加每次渲染一次依赖比较，所以包平凡值（廉价字符串拼接、一个数字）是**净负收益**。**依赖写错会重新引入陈旧闭包**，和 `useEffect` 一样。而 `useCallback` **没有记忆化的消费者就毫无意义**——若子组件没被 `React.memo` 包、函数也不是 effect 依赖，你白付开销。经验法则：**先剖析**（React DevTools Profiler），为*测量到的*问题加记忆化，而非预防性地加。注意 **React 19 的编译器自动记忆化**，使多数手写 `useMemo`/`useCallback` 过时。

**要点：**
- 记忆化有开销——别记忆化平凡值
- deps 错则陈旧闭包风险
- 与 `React.memo` 配跳过子重渲染
- 加记忆化前剖析

---

### 22. 列表 key；index-key 反模式

**频率：** 高

**题目：** key 在 React 列表中起什么作用，为什么用数组索引是反模式？

**答案：** **key** 是 React 给列表项的身份标签——它让协调**跨渲染匹配元素**。列表重渲染时，React 用 key 判断哪些项被*添加*、*删除*或*移动*，从而复用已有 DOM 节点及其组件状态而非重建。

用**数组索引**当 key 只对**静态、仅追加、从不重排/中间插入/删除的列表**才可以。列表一旦变动，索引 key 就坏：因为 key 描述的是*位置*而非*项本身*，React 认为重排前后索引 2 处的项“是同一个”——于是**局部状态、焦点、DOM 状态跟着索引走，而非跟着数据**。经典症状：你删掉第一行，*刚在那行输入框里打的文字*看起来跳到了上移的那一行，因为 React 按位置复用了输入框 DOM 节点。
```jsx
{items.map((item, i) => <Row key={item.id} />)} // ✅ 稳定身份
{items.map((item, i) => <Row key={i} />)}       // ❌ 重排/插入/删除即坏
```
修法是从数据本身派生的**稳定唯一 id**。

辅助细节：key 只需**在兄弟节点间唯一**，不必全局唯一。**绝不要在 render 内随机生成 key**（`key={Math.random()}`）——每次渲染新 key 会逼 React 每次销毁并重建节点，毁掉性能并重置状态。React **在开发时警告**缺失的 key。而因为 key 决定节点身份，它们也影响 **CSS 过渡/动画**（key 变则重挂载，重放进入动画）和**表单/输入状态**。

**要点：**
- Key 仅在兄弟间唯一
- 别在 render 内随机生成 key
- React 在开发时缺 key 警告
- Key 也影响 CSS 动画和表单状态

---

### 23. 受控 vs 非受控输入

**频率：** 高

**题目：** React 中受控输入与非受控输入有何区别，各自何时用？

**答案：** 区别在于**输入的值存在哪里**——在 React 状态里还是在 DOM 里。

**受控输入**从 React 状态派生 `value` 并通过 `onChange` 更新：
```jsx
<input value={name} onChange={e => setName(e.target.value)} />
```
状态是**单一真相源**：React 驱动显示内容。这让**实时校验、格式化、条件禁用、跨字段逻辑**变得容易（你可以转换/拒绝每一次按键）。代价是**每次按键都重渲染**，对超大表单可能有影响。

**非受控输入**把自己的值保存在 **DOM** 里，你通过 **ref** 命令式读取，用 `defaultValue`/`defaultChecked` 初始化：
```jsx
<input defaultValue="jane" ref={inputRef} />
// 提交时读取：inputRef.current.value
```
它**更简单更快**（每次按键不重渲染）——适合只在提交时才需要值的普通表单。

何时用哪种：需要在用户打字时*作出反应*（校验、掩码、依赖字段）用**受控**；不需要逐键反应的简单/大型表单用**非受控**。这正是 **`react-hook-form` 底层用非受控输入**的原因——它注册 ref、避免每次按键重渲染整个表单，这是它主要的性能优势。

坑：**文件输入实际上始终非受控**（出于安全你无法用代码设它的值）。而**绝不要让单个输入跨渲染在受控与非受控间切换**（如 `value={x}` 而 `x` 起初 `undefined` 后变字符串）——React 会警告且输入行为异常。让 `value` 始终有定义（`value={x ?? ''}`）以保持受控。

**要点：**
- React-hook-form 用非受控输入求性能
- 文件输入实际上始终非受控
- `defaultValue`/`defaultChecked` 初始化非受控
- 别让单个输入在受控/非受控间切换

---

### 24. SSR vs SSG vs CSR vs ISR

**频率：** 高

**题目：** 请比较 CSR、SSR、SSG 和 ISR 这几种渲染策略。

**答案：** 这些描述的是 **HTML 在哪里、何时生成**，在首绘速度、服务器成本和内容新鲜度之间做权衡：

- **CSR（客户端渲染）**——服务器发一个近乎空的 **HTML 壳 + JS 包**；浏览器下载、执行、取数、渲染。**首绘慢**（JS 跑起来前空白）、**SEO 较弱**，但**后续导航快**（无整页加载）且静态托管便宜。适合登录后的仪表盘/SPA。
- **SSR（服务端渲染）**——服务器**每个请求渲染完整 HTML**。**首绘快、对 SEO 友好**，支持**个性化/按请求内容**，代价是**每个请求都有服务器计算**、TTFB 绑在后端上。适合个性化、频繁变化的页面。
- **SSG（静态站点生成）**——页面在**构建/部署时预渲染**成静态 HTML，从 CDN 提供。**尽可能最快的分发**、易扩展，但内容**在下次重建前冻结**，且只对**构建时已知的内容**有效。适合博客、文档、营销页。
- **ISR（增量静态再生，Next.js）**——先发**缓存的静态页**，再**按重验证间隔（或按需）在后台重新生成**。结合 SSG 的速度与近乎 SSR 的新鲜度——大型多为静态的站点（电商目录）的最佳默认。

**React Server Components** 加了一个正交维度：**按组件**的服务器渲染，让你把取数/重依赖留在服务器（零客户端 JS），而交互岛屿保持可交互。相关精化：**流式 SSR** 在数据解决时逐块冲刷 HTML（借 Suspense 更快的感知加载），**边缘 SSR** 在离用户近处运行渲染以求低延迟，而**ISR 重验证需小心**——朴素的过期可能触发**缓存雪崩**，即大量请求同时重新生成。

**要点：**
- 流式 SSR 数据解决时发 HTML 块
- 边缘 SSR 在用户附近跑求低延迟
- SSG 只对构建时已知的内容工作
- ISR 重验证策略需小心避免缓存雪崩

---

### 25. 关键渲染路径

**频率：** 高

**题目：** 请走一遍浏览器的关键渲染路径，以及如何优化它。

**答案：** **关键渲染路径（CRP）**是浏览器把字节变成像素所遵循的序列：
1. **解析 HTML → DOM**——构建文档对象模型树。
2. **解析 CSS → CSSOM**——构建 CSS 对象模型。**CSS 阻塞渲染**：CSSOM 就绪前浏览器不绘制，因为没它就无法给任何东西设样式。
3. **DOM + CSSOM → 渲染树**——组合成一棵带计算样式的*可见*节点树。
4. **布局（reflow）**——计算每个节点的**几何**（位置/尺寸）。
5. **绘制（paint）**——填充**像素**（文本、颜色、图片、边框）。
6. **合成（composite）**——按序把绘制好的**图层**（GPU）拼到屏幕。

两种阻塞行为主导：**CSS 阻塞渲染**（如上），以及**同步 `<script>` 阻塞 HTML 解析器**——解析器停下、下载并执行脚本后才继续，延迟 DOM 构建。

优化：
- **最小化关键资源**——更少/更小的渲染阻塞 CSS 和 JS 文件。
- **内联关键 CSS**（首屏样式）并懒加载其余，使首绘不被完整样式表卡住。
- **用 `async`/`defer` 延迟非关键 JS**，使脚本不阻塞解析。
- **`preload`** 真正关键的资源（主视觉图、关键字体）；**`preconnect`** 到第三方源以提前预热 DNS/TLS。

关键的 `async` vs `defer` 区别：**`defer`** 并行下载但**在解析完成后、按文档顺序、就在 `DOMContentLoaded` 前执行**——适合需要 DOM 的应用脚本。**`async`** **一下载完就执行、无序**，可能在解析中途——适合分析脚本这类独立脚本。用 **DevTools 性能面板**可视化并找出路径瓶颈。

**要点：**
- `defer` 在解析后、`DOMContentLoaded` 前跑
- `async` 到达就跑（无序）
- 预加载关键资源，预连第三方源
- DevTools 性能面板可视化路径

---

### 26. Core Web Vitals（LCP、INP、CLS）

**频率：** 高

**题目：** 三项 Core Web Vitals 是什么，各自目标值和伤害因素？

**答案：** Core Web Vitals 是 Google 现场测量的 UX 指标，各捕捉一个不同维度，并用作**搜索排名信号**：

- **LCP —— 最大内容绘制（加载），目标 < 2.5s。** 到**最大可见元素**（通常是主视觉图或大标题）渲染完成的时间。它是“页面何时*感觉*加载好了”的代理。**杀手：** 渲染阻塞的 CSS/JS、过大/未优化的图片、慢的服务器 TTFB、客户端数据瀑布。**修法：** 优化/预加载 LCP 图、内联关键 CSS、更快/边缘服务器、`fetchpriority="high"`。
- **INP —— 交互到下次绘制（响应性），目标 < 200ms。** **2024 年 3 月替代 FID。** 与 FID（只测*首次*交互的输入延迟）不同，INP 测量页面生命周期内**所有*交互的延迟**——从点击/触摸/按键到下一次视觉更新——并报一个高分位数。**杀手：** 阻塞主线程的长 JS 任务、重事件处理器、同步布局（布局抖动）。**修法：** 拆分长任务（`scheduler.yield`）、记忆化、把工作移到 Web Worker、避免强制 reflow。
- **CLS —— 累计布局偏移（视觉稳定性），目标 < 0.1。** 累加加载期间可见内容**意外跳动**的量。**杀手：** 没有 width/height（或 `aspect-ratio`）的图片/视频、晚注入的广告/横幅/嵌入、导致 reflow 的 web 字体（FOUT）、在已有内容上方动态插入的内容。**修法：** 始终设尺寸、为动态槽预留空间、谨慎用 `font-display: optional/swap`。

两者都要测——在实验室（Lighthouse）里，更重要的是在**现场**用 **`web-vitals`** 库报真实用户数据——实验室数字常掩盖真实设备/网络才暴露的长尾。

**要点：**
- LCP 杀手：渲染阻塞 CSS、大图、慢服务器
- INP 杀手：长任务、重事件处理器、同步布局
- CLS 杀手：缺图尺寸、晚注入广告/横幅
- `web-vitals` 库报现场数据

---

### 27. 代码切分与懒加载

**频率：** 高

**题目：** 什么是代码切分与懒加载，如何有效应用？

**答案：** **代码切分**把一个巨大的 JS 包拆成按需加载的更小**块（chunk）**，让用户只下载当前视图需要的代码，而非一开始就下整个应用。**懒加载**是把某个块推迟到真正需要时才加载的动作。两者一起缩小初始包，改善 TTI/LCP。

底层原语是**动态 `import()`**——一个异步、返回 Promise 的导入，打包器（webpack/Vite/Rollup）会把它变成运行时拉取的独立块：
```js
const mod = await import('./Chart.js'); // 只在这行运行时才拉取
```
框架把它做了符合人体工学的封装：**`React.lazy(() => import('./X'))`**（渲染在 **`<Suspense>`** 边界内提供加载兜底）、**Next.js 的 `dynamic()`**、以及 **Angular 的 `loadComponent`/`loadChildren`**。

在哪里切，按优先级：
1. **按路由**是**影响最高的起点**——每个页面成为自己的块，落到 `/home` 不会下载 `/admin`。
2. **按特性/组件**切繁重、少用的部件（富文本编辑器、图表库、模态框）。

主要风险是**加载瀑布**：导航到某路由，*然后*才发现它需要另一个块，顺序拉取、卡住用户。缓解办法是**空闲时预取可能的下一个块**——`<link rel="prefetch">` 或框架提示（Next.js 预取视口内的链接）。但**别过度切分**：太多小块增加 HTTP 请求开销、伤害压缩，常反而更慢。用**包分析器**（`webpack-bundle-analyzer`、`rollup-plugin-visualizer`）看清什么真的大、有意识地切分而非瞎猜。

**要点：**
- 按路由切分是最高影响起点
- 用 `<link rel="prefetch">` 或框架提示预取
- 别过度切分——太多小块伤 HTTP 开销
- Bundle 分析器（webpack-bundle-analyzer、rollup-plugin-visualizer）指导决策

---

### 28. HTTP 缓存：Cache-Control、ETag、Last-Modified

**频率：** 高

**题目：** HTTP 缓存如何配合 `Cache-Control`、`ETag`、`Last-Modified` 工作？

**答案：** HTTP 缓存有**两个阶段**：*新鲜度*（我能不问就复用吗？）和*重验证*（我的陈旧副本还好用吗？）。

**新鲜度**由 **`Cache-Control`** 指令治理：
- **`max-age=N`**——浏览器不联系服务器就可复用响应的秒数；**`s-maxage`** 为*共享*缓存（CDN）覆盖它。
- **`public`**（任何缓存都可存）vs **`private`**（仅浏览器，如按用户数据）。
- **`immutable`**——承诺内容永不变，浏览器即使重载也跳过重验证。
- **`no-store`**——从不缓存（敏感数据）；**`no-cache`**——缓存但用前*总是重验证*。
- **`stale-while-revalidate=N`**——立即发陈旧副本、同时后台刷新。

**重验证**在过期后启动，用**条件请求**让服务器可跳过重发 body：
- **`ETag`**（内容哈希/版本）→ 浏览器发 **`If-None-Match: <etag>`**；未变则服务器回 **`304 Not Modified`** 无 body。
- **`Last-Modified`** → 浏览器发 **`If-Modified-Since`**；同样 `304` 结果。ETag 更精确（能应对内容被重写成相同字节或亚秒级变化）。

标准策略：**哈希命名的静态资源**（`app.9f3a.js`）用 **`Cache-Control: public, max-age=31536000, immutable`**——永久缓存，因为内容变化会产生新文件名。同时 **HTML 应 `no-cache`**（每次重验证），使一次新部署——它指向新的哈希资源 URL——**立即传播**，而非提供陈旧的壳。记住 **CDN 独立于浏览器的 `max-age` 尊重 `s-maxage`**，而 **`Vary`** 头告诉缓存哪些请求头（如 `Accept-Encoding`、`Accept-Language`）产生不同响应，防止缓存提供错误的变体。

**要点：**
- `stale-while-revalidate` 后台刷新时发陈旧
- HTML 应 `no-cache`（每次重验证）让部署传播
- CDN 与浏览器 `max-age` 分别尊重 `s-maxage`
- `Vary` 头告诉缓存哪些请求头区分响应

---

### 29. CORS 预检与凭证

**频率：** 高

**题目：** CORS 预检请求与带凭证的跨源请求是如何工作的？

**答案：** **CORS（跨源资源共享）**是一种浏览器安全机制，让服务器选择性地允许被*其他*源调用，放宽同源策略。执行者是浏览器（而非服务器）。

请求分两类：
- **简单请求**——`GET`/`POST`/`HEAD`，只带“安全”头，且 body content-type 为 `application/x-www-form-urlencoded`、`multipart/form-data` 或 `text/plain`。这些直接放行；浏览器只在暴露响应前检查其 `Access-Control-Allow-Origin`。
- **非简单请求**——任何带**自定义头**（如 `Authorization`、`X-Requested-With`）、GET/POST/HEAD 以外**方法**（PUT/DELETE/PATCH）、或 **JSON body**（`Content-Type: application/json`）的请求。这些触发**预检**：浏览器先发一个 **`OPTIONS`** 请求征求许可。

服务器必须以正确的头回应预检（和实际请求）：
- **`Access-Control-Allow-Origin`**——允许的源（或 `*`）。
- **`Access-Control-Allow-Methods`** 和 **`Access-Control-Allow-Headers`**——实际请求可用什么。
- **`Access-Control-Max-Age`**——浏览器可**缓存预检**结果多久，避免每次调用都 OPTIONS。

对于**带凭证的请求**（发 cookie 或 HTTP auth），客户端在 `fetch` 上设 **`credentials: 'include'`**，而服务器必须返回 **`Access-Control-Allow-Credentials: true`** *且*一个**具体的源——不能是 `*`**。最常见的错误正是：带凭证却返回 `Access-Control-Allow-Origin: *`，浏览器出于安全会**拒绝**。另注意 **`SameSite` cookie 规则叠加在 CORS 之上仍生效**——CORS 允许了请求并不能覆盖一个 `SameSite=Strict/Lax` 的 cookie 在跨站时被扣留。

**要点：**
- 简单请求跳预检（form-encoded POST、GET）
- `Access-Control-Max-Age` 缓存预检结果
- `SameSite` cookie 仍在 CORS 之上应用
- 错误：返 `*` 配凭证——浏览器拒

---

### 30. XSS、CSRF、点击劫持缓解

**频率：** 高

**题目：** 你如何缓解 XSS、CSRF 和点击劫持？

**答案：** 三种不同的浏览器攻击，各有分层防御。

**XSS（跨站脚本）**——攻击者注入在你用户页面里运行的脚本，窃取 token/数据或冒充他们行事。防御：
- **绝不把不可信输入写入 `innerHTML`**（或 `dangerouslySetInnerHTML`、`v-html`）——头号 sink。**渲染时转义/编码**，使数据被当作文本而非标记。现代框架（**React/Vue/Angular 默认转义**），所以注入通常意味着有人主动退出了转义。
- 若你*必须*渲染用户 HTML（富文本），**用 DOMPurify 清洗**以剥离脚本/处理器。
- 部署**内容安全策略（CSP）**以禁止内联脚本并限制脚本源——即使注入漏过也是强有力的纵深防御。**Trusted Types API** 更进一步，强制只有经审查的值才能到达危险的 DOM sink。
- **存储型 XSS**（载荷持久化在你的 DB、发给每个查看者）比**反射型**（载荷在 URL 里、一次一个受害者）**更糟**，因为它自动传播。

**CSRF（跨站请求伪造）**——恶意站点诱使浏览器用受害者**自动附带的凭证**（cookie）向你的站点发**改变状态的请求**。它只对浏览器发送的凭证生效，不影响你手动添加的 `Authorization` 头。防御：
- **`SameSite=Lax`（或 `Strict`）cookie**，使 cookie 不在跨站请求上发送——现代基线。
- **CSRF token**：服务器为每会话/每请求签发并在改变请求时校验的密钥；**双提交 cookie**模式把 cookie 值与匹配的请求头比对。

**点击劫持**——攻击者把你的站点嵌入一个覆盖在他们页面上的不可见 `<iframe>`，诱使用户点击你的按钮。防御：**用 `X-Frame-Options: DENY`** 或现代的 **CSP `frame-ancestors 'none'`**（或可信父页的白名单）**禁止被框入**。

**要点：**
- 存储型 XSS 比反射型更糟
- Trusted Types API 助强制安全 DOM sink
- CSRF 只影响浏览器发的凭证（cookie、basic auth）
- React/Vue/Angular 默认转义——`dangerouslySetInnerHTML` 是选入

---

### 31. CSS Grid：template-areas、显式 vs 隐式

**频率：** 中

**题目：** CSS Grid 如何工作，显式网格与隐式网格有何区别？

**答案：** CSS Grid 是**二维**布局系统（同时管行*和*列，不像 Flexbox 的单轴）。你在容器上定义网格并把子元素放进单元格。

**显式网格**是你用 **`grid-template-rows`** 和 **`grid-template-columns`** 直接声明的——你预先命名的轨道：
```css
.container { display: grid; grid-template-columns: 200px 1fr; }
```
**隐式网格**是内容溢出显式轨道时浏览器**自动创建**的——如项比定义的单元格多，或某项放在第 5 行而你只定义了 3 行。**`grid-auto-rows`/`grid-auto-columns`** 给这些自动生成的轨道设尺寸，而 **`grid-auto-flow`**（`row`/`column`/`dense`）控制项填充它们的方向。所以显式 = 你画的网格；隐式 = 浏览器制造的溢出网格。

**`grid-template-areas`** 让你像 ASCII 艺术那样直观布局**命名区域**，然后用 **`grid-area`** 分配每个子元素：
```css
.container { grid-template-areas: "nav main" "nav aside"; }
.nav { grid-area: nav; }  /* 自动跨两行 */
```
这对页面布局极易读，也能在媒体查询里轻松重排。

关键工具：**`repeat(auto-fit, minmax(200px, 1fr))`** 构建一个**无需媒体查询的响应式网格**——列自动换行并拉伸填满行（`auto-fill` 留空轨道，`auto-fit` 折叠它们）。**`fr`** 单位在固定轨道分配后分派**剩余空间**。**`place-items`** 是 `align-items`/`justify-items` 的简写（单元格内交叉轴与行内轴对齐）。而 **`subgrid`**（现已广泛支持）让嵌套网格**继承父级的轨道尺寸**，使嵌套内容与外层网格对齐。

**要点：**
- `repeat(auto-fit, minmax(200px, 1fr))` 不用媒体查询就建响应式网格
- `fr` 分配固定轨道之外的剩余空间
- `place-items` 是 align/justify-items 的简写
- Subgrid（现已广泛支持）让嵌套网格继承父轨道

---

### 32. CSS 级联与继承

**频率：** 中

**题目：** CSS 级联如何决定哪条声明胜出，这与继承有何不同？

**答案：** **级联**是当多条规则命中同一元素/属性时解决冲突的算法。它按这个**优先级顺序**比较声明（每层只用来打破上一层的平局）：
1. **起源与重要性**——谁写的规则、是否 `!important`。优先级带为：user-agent → user → author → **author `!important`** → user `!important` → UA `!important`（注意 `!important` *翻转*了顺序）。**浏览器 user-agent 样式表是最低**的常规优先级起源。
2. **级联层（`@layer`）**——一个较新的层级，位于**优先级之上**：后声明的层里的声明*无视优先级*击败先声明层里的，给你可预测的覆盖控制。
3. **优先级（specificity）**——`(内联, ID, 类/属性/伪类, 元素)` 元组。
4. **源顺序**——若以上全部打平，**最后声明的胜出**。

**继承是完全独立的机制**，只在某属性*没有*任何规则命中元素时才起作用。某些属性**默认继承**——多为排版/文本类：`color`、`font-*`、`line-height`、`visibility`。多数**布局/盒模型属性不**继承：`margin`、`padding`、`border`、`width`、`background`。不继承时，元素使用该属性的*初始*值。

你可以用 CSS 全局关键字显式覆盖继承：**`inherit`**（强制取父级计算值）、**`initial`**（属性的规范默认值）、**`unset`**（若属性通常继承则继承、否则 initial）、**`revert`**（回滚到上一个级联起源，如 UA 样式表）。实用细节：**`all: unset`** 重置元素上的每个属性——适合干净的组件重置；而**自定义属性（`--foo`）总是继承**除非被覆盖，这正是 CSS 变量能自然沿树级联的原因。

**要点：**
- `all: unset` 用于重置单个组件
- 自定义属性（`--foo`）始终继承除非覆盖
- 级联层在优先级之上引入一层
- 浏览器 user-agent 样式表是最低优先级起源

---

### 33. 伪类 vs 伪元素

**频率：** 中

**题目：** 伪类与伪元素有何区别？

**答案：** 名字听着像，但它们做相反的事：

- **伪类**选择一个**处于特定状态或位置的现有元素**——它不创建任何东西，只是有条件地匹配。例：**`:hover`/`:focus`/`:active`**（交互状态）、**`:focus-visible`**（键盘 vs 鼠标聚焦）、**`:nth-child()`/`:first-of-type`**（结构位置）、**`:checked`/`:disabled`/`:invalid`**（表单状态）、以及 **`:has()`**（基于后代匹配）。语法：**单冒号** `:`。
- **伪元素**样式化或**创建元素的一个子部分**，那不是真实的 DOM 节点——是浏览器允许你瞄准的一块。例：**`::before`/`::after`**（生成内容盒）、**`::marker`**（列表符号）、**`::selection`**（高亮文本）、**`::placeholder`** 和 **`::file-selector-button`**（表单内部）、**`::first-line`/`::first-letter`**。语法：**双冒号** `::`（那四个遗留的仍可用单冒号以向后兼容）。

一个关键的坑：**`::before`/`::after` 没有 `content` 属性就不渲染**——连 `content: ""` 都是让生成盒出现所必需的。

```css
button:focus-visible { outline: 2px solid blue; }   /* 伪类：状态 */
.card::after { content: ""; display: block; }        /* 伪元素：子部分 */
```

值得知道：**`:focus-visible`** 只给键盘用户显示 focus 环（不给鼠标点击），修正了旧的“去掉难看的 outline”的可访问性错误；**`:has()`** 是期盼已久的**父选择器**（`.card:has(img)`），现已广泛支持；而每个元素**只有一个 `::before` 和一个 `::after`**——不能叠多个。

**要点：**
- `:focus-visible` 只给键盘用户显示 focus 环
- `:has()` 是父选择器，现已广泛支持
- `::placeholder`、`::file-selector-button` 样式表单内部
- 每元素只一个 `::before` 和一个 `::after`

---

### 34. 堆叠上下文与 `z-index` 陷阱

**频率：** 中

**题目：** 什么是堆叠上下文，为什么子元素巨大的 `z-index` 有时无法把它带到最前？

**答案：** **堆叠上下文**是浏览器沿 z 轴作为一个单元一起绘制的自包含元素组。关键规则：**`z-index` 只在*同一*堆叠上下文*内*竞争。** 一旦某元素形成自己的上下文，它的所有后代都在那个上下文**内**绘制，并作为*一个整体*相对上下文的兄弟节点堆叠——它们冲不出去。

这就是为什么带 **`z-index: 9999` 的子元素逃不出其父**：如果父元素建立了一个位于某其他元素*之下*的堆叠上下文，子元素的巨大 z-index 只赢得父*内部*的战斗——整个父组仍渲染在那个兄弟之下。子元素的 9999 是与它的兄弟比，而非与父上下文之外的元素比。

新堆叠上下文由许多东西触发，出乎意料的那些制造了大多数 bug：
- **`position`（relative/absolute/fixed/sticky）+ 非 `auto` 的 `z-index`**
- **`opacity` 小于 1**
- **`transform`、`filter`、`perspective`、`clip-path`、`mask`**（任何非 `none` 值）
- **`will-change`** 指名上述之一
- **`isolation: isolate`**（*专门*为制造一个无其他副作用的上下文而设）
- 带 `z-index` 的 flex/grid 子元素，以及根 `<html>` 元素。

实际陷阱：某祖先的 **`transform` 或 `filter`**（如一个 CSS 动画）悄悄创建一个上下文，**困住 `position: fixed` 的模态或工具提示**，使它不再相对视口定位、无法层叠在其他内容之上。两种修法：用 **`isolation: isolate`** 在包裹层上*有意*作用域 z-index，或**把模态/工具提示 portal 到 `document.body`**，让它们彻底逃离困住它的祖先。**DevTools 的 Layers 面板**可视化实际的合成层来调试这些。

**要点：**
- 用 `isolation: isolate` 有意作用域 z-index
- 自动提升的层（transform）常出乎意料破坏模态/工具提示布局
- 把模态 portal 到 `document.body` 避免上下文陷阱
- DevTools 的 Layers 面板可视化堆叠树

---

### 35. CSS-in-JS vs utility-first vs CSS modules

**频率：** 中

**题目：** 请对比 CSS-in-JS、utility-first CSS 与 CSS modules 三种样式方案。

**答案：** 三大家族以不同方式解决 CSS 的全局作用域与可维护性问题：

**CSS-in-JS**（styled-components、Emotion）——在 **JS 组件内**写样式，与它样式化的标记共置，**自动生成作用域类名**，并可完全访问 props/state 做**动态主题**（`color: ${p => p.theme.primary}`）。权衡是**运行时成本**：许多库在*渲染期间*生成并注入样式，增加 CPU 工作和 **SSR 复杂度**（你必须提取关键 CSS 并正确 hydrate）。这就是为什么 **React Server Components 中不鼓励运行时 CSS-in-JS**——RSC 不跑客户端 JS，所以运行时样式注入会坏。现代答案是**零运行时 CSS-in-JS**（vanilla-extract、Panda、Linaria），在构建时把样式提取成静态 `.css`。

**Utility-first**（Tailwind）——直接在标记里用微小的**原子类**（`flex px-4 text-sm`）组合 UI。好处：**小型、有上限的样式表**（工具类共享去重，所以应用增长时 CSS 体积趋于平稳）、无命名纠结、无死 CSS。权衡是**冗长、更难读的标记**和学习曲线。**Tailwind v4** 提供**原生（Rust/Lightning CSS）引擎**，构建快得多，配置以 CSS 优先。

**CSS Modules**——普通 `.module.css` 文件，打包器**在本地作用域化类名**（`.button` → `.Button_button_a1b2`）。好处：**零运行时**、熟悉的 CSS 语法、与 **PostCSS** 流水线干净组合。权衡：**无内置动态主题**（那要退回用 CSS 变量）。

如何选：优先考虑 **SSR/RSC 兼容性和运行时成本**（服务器重的应用偏向 Tailwind 或零运行时方案），然后是**团队熟悉度**和是否需要 prop 驱动的动态样式。

**要点：**
- React Server Components 中不鼓励运行时 CSS-in-JS
- Tailwind v4 用原生 CSS 引擎实现更快构建
- CSS modules 与 PostCSS 流水线组合
- 按团队熟悉度与 SSR/RSC 需求选

---

### 36. `<picture>`、`srcset`、响应式图片

**频率：** 中

**题目：** 你如何用 `<picture>`、`srcset` 和 `sizes` 提供响应式图片？

**答案：** 响应式图片让浏览器为**每个设备下载合适的图**，而非把一个巨大文件发给所有人。针对两个不同问题有两种机制：

**`srcset` + `sizes`（分辨率切换）**——给浏览器*同一*图的多个不同宽度版本，让它按设备的 **DPR**（视网膜 vs 标准）和图的**渲染布局宽度**挑选：
```html
<img src="photo-800.jpg"
     srcset="photo-400.jpg 400w, photo-800.jpg 800w, photo-1600.jpg 1600w"
     sizes="(max-width: 600px) 100vw, 50vw" alt="...">
```
一个关键微妙点：**`sizes` 描述的是图片将占据的*布局*宽度**（如“桌面上 50vw”），*而非*文件的像素宽度——浏览器组合 `sizes` + DPR 来选最佳的 `srcset` 候选。

**`<picture>`（艺术指导 + 格式协商）**——提供*不同*来源，让浏览器挑**第一个支持的**，适合发下一代格式带回退，或每断点用不同裁剪的图：
```html
<picture>
  <source type="image/avif" srcset="hero.avif">
  <source type="image/webp" srcset="hero.webp">
  <img src="hero.jpg" alt="..." width="1200" height="600">
</picture>
```
浏览器尝试 **AVIF → WebP → JPEG**，优雅回退。

辅助属性：**`loading="lazy"`** 把屏外图片推迟到接近视口；**`decoding="async"`** 在主线程外解码使它不阻塞绘制；**`fetchpriority="high"`** 提升关键图的优先级。两条不可妥协：**始终设 `width`/`height`（或 `aspect-ratio`）**使浏览器预留空间、避免 **CLS**；以及**绝不懒加载首屏的 LCP 图**——那会延迟你最重要的绘制。用**支持即时缩放的 CDN** 自动生成 `srcset` 变体。

**要点：**
- 始终设 `width`/`height`（或 aspect-ratio）防 CLS
- `sizes` 描述布局宽度，不是图片宽度
- 用支持即时变换的 CDN 出变体
- 首屏图标 `fetchpriority="high"`，不要 lazy

---

### 37. WAI-ARIA 角色与什么时候不要用

**频率：** 中

**题目：** WAI-ARIA 是做什么的，什么时候你*不*该用它？

**答案：** **WAI-ARIA** 是一组 `role`、`state`、`property` 属性，添加浏览器暴露给屏幕阅读器等辅助技术的**可访问性语义**。它的存在是为了描述**原生 HTML 无法表达的丰富自定义部件**——如 **tab、组合框、树视图、live region**——使屏幕阅读器用户理解一个用 `<div>` 搭的控件*是*什么、*做*什么。

统领原则是 **ARIA 第一条规则：“不要用 ARIA。”** 若**原生元素**能胜任——`<button>`、`<a>`、`<nav>`、`<input type="checkbox">`——就用它，因为原生元素**自带键盘行为、焦点和语义**。ARIA 只*描述*；它对**行为不改变任何东西**。给 `<div>` 拍上 `role="button"` 告诉屏幕阅读器“这是个按钮”，但你**得不到 Enter/Space 点击、可聚焦性、disabled 处理**——你必须自己全部加上，这正是用 ARIA 重造原生控件是反模式的原因。

常见错误：
- **冗余角色**——`<button role="button">`、`<nav role="navigation">` 添加噪音（语义已经在那了）。
- **缺键盘处理器**——加了角色却不接 Enter/Space/方向键，使部件对键盘不可用。
- **在可聚焦元素上 `aria-hidden`**——把它对屏幕阅读器隐藏、同时它仍在 tab 顺序里，于是键盘用户聚焦到一个“看不见”的控件。

原生不够时有用的 ARIA：**`aria-live`** 区域宣布动态更新（toast、校验、异步结果）而不移动焦点；**`aria-expanded`/`aria-controls`** 描述展开部件（手风琴、菜单）；**`aria-label`/`aria-labelledby`** 命名缺可见文本的控件（仅图标按钮）——注意 `aria-label` 对辅助技术*覆盖*可见文本，要谨慎用。始终**用真实工具测试**——**axe-core** 做自动检查加上用 **VoiceOver/NVDA** 手动过一遍——因为 linter 抓不到体验类问题。

**要点：**
- `aria-live` 区域宣布动态更新
- `aria-expanded`、`aria-controls` 描述展开组件
- `aria-label` 为屏幕阅读器覆盖可见文本
- 跑 axe-core 并用 VoiceOver/NVDA 测试，不只 linter

---

### 38. 键盘导航与焦点管理

**频率：** 中

**题目：** 你如何让界面完全可键盘导航并正确管理焦点？

**答案：** 键盘可访问性意味着**每个交互元素都能不用鼠标到达和操作**——对屏幕阅读器用户、运动障碍用户和高级用户至关重要。

**Tab 顺序与可聚焦性：**
- tab 序列依靠**自然 DOM 顺序**，**避免正 `tabindex`**（`tabindex="5"`）——它造成脆弱、混乱、难维护的顺序。用 `tabindex="0"` 把自定义元素加入自然顺序。
- **`tabindex="-1"`** 使元素**可编程地聚焦**（通过 `.focus()`）但把它留在 tab 序列*之外*——用于模态容器或错误摘要这类焦点目标。

**焦点管理**是难点，尤其对模态/对话框：
1. 打开时，**把焦点移入模态**（通常是第一个可聚焦元素或对话框本身）。
2. 打开时**困住焦点**——从最后一个元素 Tab 绕回第一个，从第一个 Shift+Tab 绕到最后一个，使焦点不能泄到背后的页面。
3. 关闭时，**把焦点恢复**到触发它的元素（如打开模态的那个按钮），使用户不被拖到页顶。

用 **`:focus-visible`** 做 focus 环，使它对**键盘用户显示而不对鼠标点击**，给出清晰指示又不引发“点击时难看的 outline”那种导致人们（错误地）彻底去掉 outline 的抱怨。

辅助模式：**跳到内容链接**让键盘用户绕过长导航；**roving tabindex** 管理复合部件（tab、菜单、grid）——*组*是一个 tab 停点，**方向键**在其内移动（只有活动项 `tabindex="0"`，其余 `-1`）。绝不**去 outline 而不提供可见替代**。最简单的测试：**拔掉鼠标**试着用整个应用。

**要点：**
- 跳到内容链接帮键盘用户绕过导航
- 复合组件（tab、菜单、grid）用 roving tabindex
- 永不去 outline 而不提供替代
- 拔鼠标测试

---

### 39. 颜色对比（WCAG AA/AAA）

**频率：** 中

**题目：** WCAG 的颜色对比要求是什么，对比度如何测量？

**答案：** **WCAG** 定义文本/UI 与其背景之间的最小对比度，使低视力用户能读内容。比值从 **1:1**（完全相同）到 **21:1**（纯黑在纯白上）。

**AA 级**（常见的法律/实际基线）：
- **普通文本** **4.5:1**
- **大文本**（≥ 18pt，或 ≥ 14pt 粗体）和 **UI 组件/图形对象**（按钮边框、图标、表单轮廓）**3:1**

**AAA 级**（更严）：
- 普通文本 **7:1**
- 大文本 **4.5:1**

对比度由**相对亮度**计算——一个作用于 sRGB 通道值的公式——**而非感知亮度**，这就是为什么某些*看着*没问题的搭配仍会失败（反之亦然）。这是已知弱点：当前公式对人类感知建模很差，尤其对深色主题。**APCA**（可访问感知对比算法）——**WCAG 3** 的候选——对感知建模好得多且是**非对称的**——它给**浅底深字**与**深底浅字**打不同分（同两种颜色因哪个作前景而可读性不同），而当前比值对它们一视同仁。

实用指导：**测试每个状态**——hover、focus、disabled，尤其是 **placeholder 文本**（常见失败点，因为它故意暗）。**绝不只靠颜色**传达意义（错误=红）——为色盲用户配上**图标或文本标签**。工具：**axe、Lighthouse、Stark、Chrome DevTools 的对比选择器**（实时显示 AA/AAA 通过/失败）。最后，**Windows 高对比 / `forced-colors` 模式**完全覆盖你的调色板，需**单独测试**——别以为对比通过就在那里有效。

**要点：**
- 测试所有状态（hover、disabled、placeholder）
- 别只靠颜色——配图标或文本
- 工具：axe、Lighthouse、Stark、Chrome 的对比挑选器
- 高对比模式（forced-colors）需单独测试

---

### 40. SVG vs PNG vs WebP vs AVIF

**频率：** 中

**题目：** SVG、PNG、WebP、AVIF 如何对比，各自何时用？

**答案：** 两个是**矢量/无损**，两个是**现代有损栅格**格式——按内容类型选：

- **SVG（矢量）**——XML 描述的形状，**分辨率无关**（任何尺寸/DPR 下都清晰）且可用 CSS **脚本化/样式化**。理想用于**图标、logo、插图、图表**。简单图形体积极小，但不适合照片（复杂图像使文件膨胀）。**优先内联或精灵 SVG 而非图标字体**（更好的可访问性、无 FOUT、可单独上色）。用 **SVGO** 压缩去掉编辑器冗余。
- **PNG（无损栅格）**——像素精确、带 **alpha 透明**。最适合**截图、图表、需锐利边缘/透明的图**，那里有损伪影不可接受。缺点：照片内容的**文件大**。
- **WebP**——现代格式，同等质量下**比 JPEG 小约 25–35%**，支持**透明和动画**。广泛支持、好用的通用默认。
- **AVIF**——最新格式，**比 JPEG 小约 50%**且质量更好（尤其渐变/弱光），支持 HDR/宽色域。权衡：**编码更慢**、支持略少，所以**先发它、配 WebP/JPEG 回退**。

交付模式——用 **`<picture>`** 协商格式并优雅回退：
```html
<picture>
  <source type="image/avif" srcset="img.avif">
  <source type="image/webp" srcset="img.webp">
  <img src="img.jpg" alt="..." width="800" height="600">
</picture>
```
其他指导：**内容图用 `<img>`**（它们有语义且通过 `alt` 可访问），**纯装饰视觉用 CSS `background-image`**。AVIF/WebP 对老浏览器**总需回退**。

**要点：**
- 图标用精灵/内联 SVG；避免图标字体
- AVIF/WebP 老浏览器需显式回退
- 内容图用 `<img>`，装饰用 CSS `background`
- 用 SVGO 压缩 SVG

---

### 41. CSS 变量 vs SASS 变量

**频率：** 中

**题目：** CSS 自定义属性与 SASS 变量有何不同，各自何时需要？

**答案：** 根本区别在于**它们何时解析**：

**SASS 变量（`$color`）**是**预处理器/构建时**的。它们在编译时被替换进静态 CSS，**在交付的样式表里不存在**——浏览器永远看不到 `$color`，只看到最终的 `red`。因为它们在运行时前就解析，所以**不能级联、不能继承、不能基于 DOM、媒体查询或 JS 变化**。它们只是构建时的文本替换。

**CSS 自定义属性（`--color: red`）**是实际 CSSOM 里的**运行时活值**。它们：
- 像真正的 CSS 一样沿 DOM **级联和继承**（在 `:root` 上设的 `--color` 流到各处；在子树上覆盖它只给那棵子树重设主题）。
- **响应媒体查询**——在 `@media` 内重定义 `--gap`，所有用 `var(--gap)` 的都更新。
- 运行时可被 JS **读写**：`el.style.setProperty('--x', value)` / `getComputedStyle(el).getPropertyValue('--x')`。

这种运行时特性正是**主题（明/暗、品牌切换、按组件颜色）*需要* CSS 变量**的原因——你在 `:root` 或包裹层上翻一个值，整棵树无需重建就重设主题。SASS 根本做不到。

它们是**互补而非竞争**：SASS 仍因**构建时能力**而有一席之地——**mixin、函数、`@each`/`@for` 循环、嵌套、partial、模块化文件结构**——这些 CSS 变量不涉及。常见的现代栈用 SASS 求编写人体工学*加上* CSS 变量做运行时主题。

值得知道的细节：自定义属性可**作用域到任意选择器**做组件级主题；**`var(--x, fallback)`** 在未定义时提供默认；它们在 **`calc()`** 内有效（`calc(var(--gap) * 2)`）；但注意裸自定义属性**不能平滑 `transition`/动画**，除非通过带类型的 **`@property`** 注册，否则浏览器把它当无类型字符串。

**要点：**
- CSS 变量可作用域到选择器做组件主题
- `var(--x, fallback)` 提供默认
- JS 读写通过 `element.style.setProperty('--x', value)`
- CSS 变量在 `calc()` 中可用，transition 不能很好动画它们

---

### 42. 动画：`transition` vs `@keyframes`；合成器友好属性

**频率：** 中

**题目：** CSS `transition` 与 `@keyframes` 有何区别，哪些属性是合成器友好的？

**答案：** 两者都动画 CSS，但适合不同需求：
- **`transition`** 在**两个状态之间**插值一个属性——起始值和结束值，由变化触发（class 切换、`:hover`、`:focus`）。它是声明式的，完美适合简单的 A→B 效果（悬停时按钮变大、菜单淡入）。
- **`@keyframes`**（由 **`animation`** 属性驱动）定义带中间停点（`0% { } 50% { } 100% { }`）的**多步**动画，支持**循环、延迟、方向和填充模式**，可在加载时无需状态变化就运行。用于复杂、重复或多阶段运动（旋转器、弹跳指示器）。

性能故事是关键部分：浏览器的渲染管线是**布局 → 绘制 → 合成**，而**只有 `transform` 和 `opacity` 能在合成线程上动画**，完全跳过布局和绘制。动画它们很廉价，即使主线程有负载也能保持 60fps。相反，动画 **`width`、`height`、`top`/`left`、`margin`** 强制**每帧布局（reflow）**，而动画 **`box-shadow`、`background`、`color`** 强制**每帧绘制**——两者都昂贵且卡顿。所以黄金法则：**优先 `transform: translate()` 而非 `top`/`left`，`transform: scale()` 而非 `width`/`height`。**

**`will-change`** 提示浏览器提前把元素提升到自己的层——但要**少用**：过度提升浪费 GPU 内存、可能*伤*性能。就在动画前加、动画后移除。

最后的考量：**60fps 的帧预算是每帧约 16ms**（120Hz 显示器约 8ms）——超过就掉帧。始终尊重 **`prefers-reduced-motion`**，为前庭敏感用户禁用/减少非必要动画。而较新的 **View Transitions API** 声明式地在**两个 DOM 状态之间**动画（甚至跨整页/路由变化），替你处理交叉淡入/形变。

**要点：**
- 60fps 意味着每帧约 16ms 渲染
- 优先 `transform: translate` 而非 `top/left`
- `prefers-reduced-motion` 应禁非必要动画
- View Transitions API 声明性启用跨状态动画

---

### 43. 迭代器与生成器

**频率：** 中

**题目：** JavaScript 中的迭代器和生成器是什么，它们启用了什么？

**答案：** 它们是“遍历一个序列”背后的机制，建立在两个协议上：
- **迭代器协议**：一个带 **`next()`** 方法的对象，返回 **`{ value, done }`**——`value` 是当前项，`done` 在耗尽时变 `true`。
- **可迭代协议**：一个带 **`[Symbol.iterator]()`** 方法的对象，返回一个迭代器。任何可迭代的东西（数组、字符串、`Map`、`Set`）都实现它，这就是 `for...of`、展开和解构都能作用于它们的原因。

**生成器**（`function*`）是*产出*迭代器符合人体工学的方式。**`yield`** 关键字**暂停执行**并交出一个值；函数在下次 `next()` 调用时精确地从它停下的地方恢复，保留所有局部状态。这使它们理想用于：
```js
function* range(n) { for (let i = 0; i < n; i++) yield i; }
for (const x of range(3)) console.log(x); // 0 1 2
```
- **惰性/无限序列**——值按需计算，所以你能建模一个无限流（`function* naturals()`）并只取你需要的，永不物化它。
- **自定义迭代**——定义你自己的数据结构（树、链表）如何被 `for...of` 遍历。
- **协程式异步**——历史上（`async/await` 前），`co` 这类库用生成器在 Promise 上暂停；`async/await` 本质上是一种特化的生成器。

区分与额外内容：**`for...of` 消费可迭代**（*值*），而 **`for...in` 枚举可枚举的键**（含继承的）——常见混淆。生成器还支持 **`.return()`**（提前结束、跑 `finally` 清理）和 **`.throw()`**（在 yield 点注入一个错误）。**异步生成器**（`async function*`）产出 Promise，与 **`for await...of`** 配对做流式异步数据（分页 API、可读流）。而**展开/解构作用于*任何*可迭代**，不只是数组。

**要点：**
- `for...of` 消费可迭代；`for...in` 枚举 key
- 生成器支持 `.return()` 做清理和 `.throw()`
- 异步生成器（`async function*`）与 `for await...of` 配对
- Spread/解构在任何可迭代上工作

---

### 44. ESM vs CommonJS；动态 `import()`

**频率：** 中

**题目：** ES 模块与 CommonJS 有何不同，什么是动态 `import()`？

**答案：** 它们是 JavaScript 的两套模块系统，加载模型根本不同：

**CommonJS（CJS）**——Node 最初的系统，用 **`require()`** 和 **`module.exports`**。它是**同步的**（`require` 阻塞到模块加载完）且**动态的**——你可以在 `if` 里条件性 `require()`、在运行时构建路径等。因为导出在运行时解析，CJS **不能被可靠地摇树**（打包器无法静态知道什么被用到）。

**ES 模块（ESM）**——用 **`import`/`export`** 的**Web 标准**。导入是**静态的**（顶层声明，执行前可分析），这启用了**摇树**（死代码消除）和**可异步**加载。这种静态结构是对打包器和浏览器的关键优势。

**动态 `import()`** 弥合了差距：它是一种**类函数、返回 Promise 的形式**，所以你能在条件或事件处理器里**按需**加载模块（`const m = await import('./x.js')`）。它在**浏览器和 Node ESM 都工作**，是**代码切分**和**条件/懒加载**背后的原语。

互操作是痛点：**ESM 能 `import` 一个 CommonJS 模块**（Node 包装它），但 **CommonJS 不能 `require()` 一个 ESM 模块**——它必须用动态 `import()`（因为 ESM 异步而 `require` 同步）。这种不匹配造成了生态里许多“双包”摩擦。

关键细节：ESM 导入是**被提升且活绑定的**（你拿到导出的活*引用*，所以导出方重新赋值时导入方看到新值——不像 CJS 拷贝的快照）。**`package.json` `"type": "module"`** 翻转 Node 默认，使 `.js` 被当作 ESM。**`"exports"` 字段**控制使用者可导入哪些子路径并把它们映射到文件。而**顶层 `await`**（在模块作用域 await）**仅限 ESM**。

**要点：**
- ESM import 被提升且活绑定
- `package.json` `"type": "module"` 翻转 Node 默认
- `exports` 字段控制子路径解析
- 顶层 await 仅在 ESM 中工作

---

### 45. 深克隆（`structuredClone`、JSON、递归）

**频率：** 中

**题目：** JavaScript 中深克隆对象有哪些方式，各自的权衡是什么？

**答案：** “深克隆”意为拷贝一个对象*及其所有嵌套对象*，使副本与原对象不共享任何引用。三种方式，按偏好排序：

**1. `structuredClone(obj)`**——现代内置、正确的默认。它处理**循环引用、`Map`、`Set`、`Date`、`RegExp`、`ArrayBuffer`/类型化数组、Blob**。它**不能**克隆的：**函数、DOM 节点、symbol**——遇到这些会抛（`DataCloneError`）。它用浏览器给 Web Worker 的 **`postMessage`** 和 `history.state` 所用的同一**结构化克隆算法**。

**2. `JSON.parse(JSON.stringify(obj))`**——老的一行式。对纯 JSON 形状的数据很快，但它**静默地弄乱或丢弃**很多：**函数和 `undefined` 消失、symbol 被丢、`Date` 变 ISO *字符串*、`Map`/`Set` 变 `{}`、`NaN`/`Infinity` 变 `null`**，且**遇循环引用抛错**。只对你*确知*是纯 JSON 的数据安全。

**3. 手写递归克隆**——完全控制（你决定如何处理函数、自定义类等），但**冗长、慢、易错**。若必须，用 **`WeakMap` 记忆化**已克隆的对象，以正确处理**循环**、不无限循环。

面试官探查的背景：**浅克隆**（`{...obj}` 或 `Object.assign({}, obj)`）只拷贝**一层**——嵌套对象仍是共享引用，这让期待它是深的人吃惊。对不可变状态更新，**像 Immer 这样的结构共享库**完全避免完整深克隆——它们复用未变的子树、只拷贝变化的路径，比每次更新克隆整棵树高效得多。

**要点：**
- 浅克隆：`{...obj}` 或 `Object.assign({}, obj)`（仅一层）
- 不可变库（Immer）产出结构共享的克隆
- `structuredClone` 也用于 `postMessage`
- WeakMap 记忆化处理自定义递归克隆中的循环

---

### 46. WeakMap / WeakSet

**频率：** 中

**题目：** `WeakMap` 和 `WeakSet` 是什么，什么时候用它们？

**答案：** 它们是这样的集合：它们对键（WeakMap）或值（WeakSet）的引用是**弱的**——意味着它们**不阻止垃圾回收**。如果对某对象唯一剩余的引用是在 `WeakMap`/`WeakSet` 内，GC 可自由回收它，条目静默消失。

这个特性使它们理想用于**把附带数据与对象关联而不拥有其生命周期**。经典用途是**给 DOM 节点或类实例附加元数据**：`const meta = new WeakMap(); meta.set(domNode, {...})`。当 DOM 节点被移除且再无其他引用时，WeakMap 条目被自动回收——**无内存泄漏**。普通 `Map` 会永远保活该节点（经典泄漏），因为 Map 的强引用把它钉住。

权衡：因为条目可能**随时消失**，`WeakMap`/`WeakSet` **不可迭代**且**不暴露 `size`**——没有 `.keys()`、`.forEach()` 或 `.clear()`。你只能按具体对象引用 `get`/`set`/`has`/`delete`。（若条目可枚举，GC 时机就会变得可观测，规范禁止这点。）

规则与用途：
- **键必须是对象**（或非注册 symbol）——不能用原语，因为原语不被垃圾回收。
- 在 `#private` 类字段语法存在前，它们是实现**私有字段**的标准方式（把每实例私有数据存在模块作用域的 WeakMap 里）。
- 适合**以短暂对象为键的缓存/记忆化**——缓存条目恰好活得和键一样久。
- 更细控制：**`WeakRef`** 对*单个*对象持弱引用（带 `.deref()`），**`FinalizationRegistry`** 让你注册一个在对象被回收*后*运行的清理回调——都是高级、少用的工具。

**要点：**
- key 必须是对象（或未注册 symbol）
- 类字段语法前完美做私有字段
- 用于以短暂对象为 key 的缓存
- `WeakRef` 和 `FinalizationRegistry` 给更细粒度弱引用

---

### 47. Map vs 对象作字典

**频率：** 中

**题目：** 什么时候该用 `Map` 而非普通对象做字典？

**答案：** 两者都存键→值对，但保证和风险不同。

**`Map` 的优势：**
- **任意键类型**——对象、函数、数字，甚至 `NaN` 都能作键。对象键用*引用*身份。普通对象把**所有键强制成字符串**（或 symbol），所以 `obj[1]` 和 `obj['1']` 冲突。
- **保证插入顺序**迭代，以及干净的迭代 API（`for...of`、`.keys()`、`.values()`、`.entries()`）。
- **真正的 `.size`** 属性（对象需要 `Object.keys(o).length`）。
- **频繁增删条目性能更好**——Map 为高频变动优化。

**普通对象的风险与优势：** 对象继承自 `Object.prototype`，所以键如 `__proto__`、`constructor`、`toString` 会与继承成员**冲突**（原型污染隐患）——用 **`Object.create(null)`** 造一个无原型的干净字典。但对象**JSON 序列化友好**（`JSON.stringify` 原生工作），而 **JSON 不原生序列化 `Map`**——你需要 `Object.fromEntries(map)` 先转成对象。

何时用哪个：**键值集合动态变化**（增删频繁、键非字符串）用 **`Map`**；**固定形状的记录/实体**（一个 user 对象、config）用**普通对象**——它们更轻、字面量语法方便、直接序列化。在 TypeScript 里，**`Record<K, V>`** 类型化对象字典，而 `Map<K, V>` 类型化 Map。

**要点：**
- `Object.create(null)` 给无原型字典
- `Map` 迭代更快更可预期
- JSON 不原生序列化 `Map`——通过 `Object.fromEntries` 转
- TypeScript 的 `Record<K, V>` 用于对象字典

---

### 48. TS：`unknown` vs `any` vs `never`

**频率：** 中

**题目：** 在 TypeScript 中，`unknown`、`any`、`never` 有何不同？

**答案：** 这是 TypeScript 类型系统两个极端的三个“特殊”类型，混淆它们是常见错误。

**`any`**——**关掉类型检查的逃生舱**。类型为 `any` 的值可与任何东西互相赋值、访问任何属性、被调用——**零编译期安全**。更糟的是它**具病毒性/传染性**：它通过返回类型和表达式传播，在它流经之处静默关掉检查（`const x: any = ...; const y = x.foo.bar()`——全不检查）。把 `any` 当作代码坏味。

**`unknown`**——**`any` 的类型安全对应物**。它是**顶类型**：任何东西都可赋给 `unknown`，但你**在把 `unknown` 值收窄到具体类型前不能对它做任何事**。这强制在边界做一次安全检查：
```ts
function handle(x: unknown) {
  // x.foo  // ❌ 编译错误
  if (typeof x === 'string') x.toUpperCase(); // ✅ 已收窄
}
```
**对外部/不可信输入用 `unknown`**（`JSON.parse`、`fetch` 响应、`catch` 子句错误），使编译器强迫你在使用前验证。

**`never`**——**底类型**：一个*永不可能存在*的值。它是函数在**总是抛出或永远循环**时的返回类型（`function fail(): never`），也是**不可达分支**里变量的类型。它的杀手用途是**穷尽性检查**：在对一个并集的 `switch` 中，`default` 里的 `assertNever(x: never)` 会在**有人新增一个并集成员**却忘了处理的当天产生**编译错误**——把运行时 bug 变成构建失败：
```ts
function assertNever(x: never): never { throw new Error(`Unexpected: ${x}`); }
```

坑：**空数组在无上下文时被推断为 `never[]`**（`const a = []` 后 push 需要注解）；而启用 **`strict`/`noImplicitAny`** 才会强制用 `unknown`/显式类型，而非让静默的 `any` 悄悄潜入。

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

**题目：** TypeScript 泛型如何工作——约束、默认和条件类型？

**答案：** **泛型参数化类型**，让一个定义作用于多种类型，同时**保留**输入与输出之间的关系。恒等函数是经典例子：
```ts
function id<T>(x: T): T { return x; } // id('a') 是 string, id(1) 是 number
```
这里 `T` 把参数类型与返回类型联系起来——`any` 会丢掉这一点。这是试金石：**只在类型参数真正关联两个位置时才用泛型**（参数↔返回、键↔值）。只出现在一处的泛型通常是伪装的 `any`，应该直接用那个具体类型或 `unknown`。

**约束（`T extends U`）**给类型参数设界，保证它有某些成员：
```ts
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b; // 安全：已知 T 有 .length
}
```
**`extends keyof T`** 模式对类型安全的属性访问尤其常见：
```ts
function get<T, K extends keyof T>(obj: T, key: K): T[K] { return obj[key]; }
```

**默认（`<T = string>`）**在调用方不指定或编译器无法推断 `T` 时提供回退，保持泛型 API 符合人体工学。

**条件类型（`T extends U ? X : Y`）**启用**类型级计算**——在类型上分支——并与 **`infer`**（从另一个类型内*提取*一个类型）结合驱动标准库：
```ts
type ElementType<T> = T extends (infer E)[] ? E : T; // 解包数组元素类型
```
这正是 **`ReturnType`、`Parameters`、`Pick`、`Record`、`Awaited`** 等内置在底层的实现方式——泛型约束加条件/映射类型。一个现代精化：**`NoInfer<T>`（TS 5.4+）**阻止编译器从*特定*参数位置推断 `T`，使推断由你意图的位置驱动（如从 config 的允许值推断，而非从默认参数）。

**要点：**
- 避免不实际关联两个位置的泛型
- 属性名泛型用 `extends keyof T`
- `NoInfer<T>`（TS 5.4+）防从一个位置推断
- 泛型约束驱动 `Pick`、`Record` 等

---

### 50. TS：辨别并集与穷尽性

**频率：** 中

**题目：** TypeScript 中的辨别并集是什么，你如何强制穷尽性？

**答案：** **辨别（或“带标签”）并集**是一组对象类型的并集，它们共享一个**共同的字面字段**——**辨别器**（惯例是 `kind`、`type` 或 `tag`）。因为该字段在每个变体里有*不同的字面值*，TypeScript 只需检查它就能把整个对象**收窄**到单个变体：
```ts
type Shape =
  | { kind: 'circle'; r: number }
  | { kind: 'square'; s: number };

function area(x: Shape): number {
  switch (x.kind) {
    case 'circle': return Math.PI * x.r ** 2;  // x 收窄：有 .r
    case 'square': return x.s ** 2;            // x 收窄：有 .s
    default: return assertNever(x);            // 穷尽性守卫
  }
}
```
在每个 `case` 内，TS 确切知道 `x` 是哪个变体，所以访问 `x.r`（仅 circle）是类型检查过的——无不安全的强转。

**穷尽性**是杀手特性。通过加 `default: return assertNever(x)`（其中 `assertNever(x: never): never`），你让编译器在**新增变体却未处理时构建失败**。当你给 `Shape` 加 `{ kind: 'triangle'; ... }` 时，`default` 里未处理的 `x` 不再是 `never`，所以 `assertNever(x)` 报错——把“我忘了更新这个 switch”从静默运行时 bug 变成你*无法*错过的编译错误。

辅助点：**辨别器必须是字面类型**（`'circle'`，而非 `string`）收窄才生效——这就是为什么你常把并集构造配 **`as const`**，使字符串字段被推断为字面而非被拓宽成 `string`。这个模式无处不在：**Redux/Zustand 的 action 对象是教科书式辨别并集**（`{ type: 'increment' }`），状态机和 API 结果类型（`{ status: 'success' } | { status: 'error' }`）也是。**`satisfies`** 操作符在这也有用——它对一个值按类型校验但**不拓宽**它，保留辨别器所需的窄字面推断。

**要点：**
- 辨别器必须是字面类型
- Redux/Zustand action 是经典辨别并集
- `satisfies` 操作符助保留窄推断
- 配 `as const` 做字面推断

---

### 51. TS：工具类型（Partial/Pick/Omit/Record/ReturnType）

**频率：** 中

**题目：** TypeScript 的内置工具类型有哪些，你如何组合它们？

**答案：** 工具类型是标准库里的**泛型类型转换器**，从已有类型派生新类型——你只定义一次形状就机械地产出变体，保持类型 **DRY** 且同步。主力：

- **`Partial<T>`**——使每个属性可选。理想用于**更新/补丁**载荷和表单草稿：`function update(id, changes: Partial<User>)`。
- **`Required<T>`**——相反；使所有可选属性变必需。
- **`Pick<T, K>`**——选取键的子集。`Pick<User, 'id' | 'name'>` 构建轻量 DTO。
- **`Omit<T, K>`**——删除键。`Omit<User, 'password'>` 做安全的 API 响应。
- **`Record<K, V>`**——构建字典类型：`Record<string, number>`、`Record<UserId, User>`。
- **`ReturnType<F>`**——提取函数返回类型；**`Parameters<F>`** 提取其参数元组。适合从已有函数推断类型而非重新声明。
- **`Awaited<T>`**——解包 `Promise`（递归）：`Awaited<Promise<string>>` 是 `string`。

它们**可组合**，这正是威力所在——你链接它们来建模真实的 API/DTO 契约：
```ts
type UserForm = Partial<Omit<User, 'id' | 'createdAt'>>;
type UserResponse = Omit<User, 'passwordHash'>;
type Handlers = Record<EventName, (e: Event) => void>;
```

其他值得知道的：**`Readonly<T>`** 做不可变形状（所有属性 `readonly`）；**`NonNullable<T>`** 从类型剥去 `null | undefined`；**`Exclude<U, X>` / `Extract<U, X>`** 过滤*并集成员*（`Exclude<'a'|'b'|'c', 'a'>` 是 `'b'|'c'`）。当内置不够时，你用**映射类型**（`{ [K in keyof T]: ... }`）加**条件类型****自己滚**——这正是这些工具内部的实现方式。

**要点：**
- `Readonly<T>` 做不可变形状
- `NonNullable<T>` 剥 `null | undefined`
- `Exclude`/`Extract` 过滤并集成员
- 内置不够时自滚映射 + 条件类型

---

### 52. 柯里化与部分应用

**频率：** 中

**题目：** 柯里化和部分应用是什么，它们有何不同？

**答案：** 两者都**把多参数函数变换成分阶段应用的函数**，但不是一回事。

**柯里化**把 N 个参数的函数转成 **N 个嵌套的一元（单参数）函数**：`f(a, b, c)` 变成 `f(a)(b)(c)`。每次调用恰好取一个参数并返回另一个函数，直到最后一个才最终算出结果。
```js
const add = a => b => a + b;
add(1)(2); // 3
```

**部分应用**更宽松：它**现在固定*某些*参数**并返回一个期待**其余**的函数——不一定一次一个。
```js
const add3 = (a, b, c) => a + b + c;
const add10 = add3.bind(null, 10);   // 固定 a；期待 (b, c)
add10(20, 30); // 60
```
所以：柯里化总是产出一串*一元*函数；部分应用只是**预填任意数量**参数、留下一个剩余元数的函数。柯里化是*启用*部分应用的一种具体方式。

两者驱动相同的函数式模式：**把通用函数特化成可复用的**（`const inc = add(1)`）、**point-free 组合**（把数据管过预配置函数而不命名中间变量）、**依赖注入式配置**（一次烘焙进 logger/config，稍后用数据调用）。

实用注意：**`Function.prototype.bind`** 是内置的部分应用（第一个参数设 `this`，其余预填参数）。像 **Ramda 和 lodash/fp** 这样的库提供**自动柯里化**的函数（参数少于全部 → 拿回一个函数；全部参数 → 拿到结果），并把**数据参数放最后**，正是为了让柯里化干净地组合（`map(addOne)` 产出一个列表转换器）。当心 **`this` 绑定和变参/可选参数函数**——它们**不干净柯里化**，因为柯里化假设的固定元数不成立。

**要点：**
- `Function.prototype.bind` 做部分应用
- Ramda/lodash-fp 发自动柯里化版本
- 当心 `this` 和元数（变参函数不干净柯里化）
- 对 `map(addOne, list)` 这种 HOF 有用

---

### 53. HOF 与组合

**频率：** 中

**题目：** 什么是高阶函数和函数组合？

**答案：** **高阶函数（HOF）**是**接受函数作为参数、返回函数、或两者兼有**的函数——函数被当作普通值。你每天用的数组方法都是 HOF：**`map`、`filter`、`reduce`** 都接受一个回调。**`compose`** 和 **`pipe`** 这类组合子也是。HOF 让你**在行为上抽象**，而不只是数据。

**函数组合**链接小的**一元（单参数）**函数，使一个的输出喂给下一个。`pipe` **从左到右**跑，`compose` **从右到左**：
```js
const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);
pipe(f, g, h)(x); // === h(g(f(x)))

const compose = (...fns) => x => fns.reduceRight((v, f) => f(v), x);
compose(h, g, f)(x); // === h(g(f(x)))
```
注意 `pipe` 本身就是用 **`reduce`** 实现的——这正是重点：**`reduce` 是通用 HOF**，`map`、`filter` 等都可从它派生（它们只是带特定累加器的 reduce）。

为什么重要：组合鼓励**小的、单一目的、可独立测试的函数**，你把它们组装成**声明式数据流水线**——你把 `pipe(parse, validate, normalize, save)` 读成一个句子，没有中间变量或命令式管道（**point-free 风格**）。

注意事项：非常**长的组合链**会增加调用栈深度和开销，而朴素的 `pipe` 作用于数组会在**每步都创建一个新中间数组**（`.map().filter().map()`）。**Transducer** 解决后者——它组合*转换*本身、**单遍无中间集合**地做。最后，记住**方向约定**：`compose` 是数学式的从右到左（`compose(h,g,f)`），`pipe` 是阅读顺序从左到右（`pipe(f,g,h)`）——同样结果，相反的参数顺序。

**要点：**
- `reduce` 是通用 HOF——其他都可派生
- 注意链长度对栈/性能影响
- Transducer 不产中间数组组合
- 按约定 compose 右到左，pipe 左到右

---

### 54. 记忆化与陷阱

**频率：** 中

**题目：** 什么是记忆化，它有哪些陷阱？

**答案：** **记忆化**把函数的**返回值按其参数为键**缓存，使相同输入的重复调用返回缓存结果而非重算。它是经典的**以空间换时间**：
```js
function memoize(fn) {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}
```

它只对**纯、确定性函数**正确工作——同输入必须总产同输出且无副作用（记忆化读时钟或 DB 的东西会给出陈旧结果）。当函数**昂贵**、输入**重复**且**可哈希**时才划算。

面试官探查的陷阱：
- **无界缓存增长 = 内存泄漏。** `Map` 支撑的缓存永远保留每个结果。对长寿命或高基数输入，用 **LRU 缓存**限界，或按对象为键时用 **`WeakMap`**（键对象消亡时条目被 GC）。
- **基于引用的键漏命中。** 按对象身份为键意味着两个结构相等但不同的对象（`{a:1}` vs `{a:1}`）被当作不同——缓存未命中。序列化键（`JSON.stringify`）修复相等性但慢且在函数/循环/顺序上失效。
- **异步竞态。** 记忆化一个返回 `Promise` 的函数必须缓存**进行中的 Promise**（而非只是解决的值），否则第一个解决前的并发调用者各自发自己的请求。还要决定是否**在拒绝时驱逐**，使短暂失败不被永久缓存。
- **别记忆化便宜的工作**——若缓存查找（哈希键、Map 访问）比直接重算还贵，你反而让它更慢了。

在 React 里，**`useMemo`/`useCallback` 是作用域到组件渲染的记忆化**，按依赖数组为键——同样原理，外加保留跨渲染**引用身份**的目标。

**要点：**
- React 的 `useMemo`/`useCallback` 是带引用身份的记忆化
- `Map` 支撑的 memo 处理对象 key 但泄漏
- LRU 缓存有限内存
- 别记忆化便宜操作——缓存查找成本更高

---

### 55. 迭代大列表不阻塞主线程

**频率：** 中

**题目：** 你如何处理一个大列表而不阻塞主线程？

**答案：** 浏览器主线程处理 **JS、布局、绘制和输入**，所以单个长同步循环会**冻结整个页面**——不能滚动、不能点击、不能渲染。任何超过 **~50ms 的任务都是“长任务”**，伤 **INP** 且感觉卡顿。按工作类型有三种策略：

**1. 分块并让出**——把列表拆成批，处理一批，然后**把控制权交回事件循环**让浏览器渲染和响应，再继续。让出原语，从好到差：
- **`scheduler.yield()`**——现代、专门设计的让出（以高优先级恢复，使你的任务不被饿死）。
- **`scheduler.postTask({ priority })`**——优先任务调度 API，让你以 `user-blocking`/`user-visible`/`background` 优先级调度块。
- **`requestIdleCallback`**——只在空闲时间跑块（适合真正低优先级的工作）。
- **`MessageChannel`** 或 **`setTimeout(0)`**——较老的回退（`setTimeout` 有约 4ms 钳制）。
```js
async function processInChunks(items, fn, size = 500) {
  for (let i = 0; i < items.length; i += size) {
    items.slice(i, i + size).forEach(fn);
    await scheduler.yield(); // 让浏览器喘口气
  }
}
```
**异步生成器**与这种分块模型天然配对。

**2. 把纯 CPU 工作卸载到 Web Worker**——若处理是无 DOM 需求的繁重计算（解析、算数字、图像处理），把它整个移到**后台线程**，使主线程保持空闲。通过 `postMessage`（或用 `Comlink` 求 RPC 人体工学）通信。

**3. 虚拟化渲染**——若成本是*渲染*几千行（而非计算它们），就别渲染。用**窗口化/虚拟化**（`react-window`、`TanStack Virtual`），只有**可见行被挂载**到 DOM，用占位撑起滚动高度——不论列表多长 DOM 尺寸恒定。

在 React 里，**`startTransition`**（React 18）额外把一次状态更新标记为**低优先级**，让紧急更新（打字）打断昂贵的重渲染。

**要点：**
- `scheduler.postTask({ priority })`（优先任务调度 API）是现代原语
- 异步生成器与分块处理配合好
- 长任务（>50ms）伤 INP
- React 18 的 `startTransition` 延迟低优先级渲染

---

### 56. Web Worker vs Service Worker vs Shared Worker

**频率：** 中

**题目：** 请对比 Web Worker、Service Worker、Shared Worker 和 Worklet。

**答案：** 它们都在**主线程外**跑 JavaScript 且**无 DOM 访问**，但用途大不相同：

**Web Worker（专用 Worker）**——为 **CPU 密集工作**（解析、加密、图像/数据处理）而设的后台线程，使 UI 保持响应。它**由一个页面拥有**，通过 **`postMessage`** 通信，随其页面消亡。这是“我的计算冻结了 UI”的首选。

**Service Worker**——不是计算线程，而是坐在页面与网络之间的**可编程网络代理**。它拦截 **`fetch`** 事件，启用**离线支持（缓存策略）、推送通知和后台同步**。它的决定性特征是**独立于任何页面的生命周期**（`install → activate → fetch`）——它在标签关闭后仍继续运行/唤醒，这正是 PWA 能工作的原因。它**需要 HTTPS**（`localhost` 除外），因为一个拦截网络的脚本是严重的安全面。

**Shared Worker**——一个**被多个同源标签/窗口共享**的单一 worker 实例（通过端口连接）。适合跨标签协调状态或单个 WebSocket。注意：**Safari（含 iOS）不支持**，限制了它的实用性——许多人改用 Service Worker 或 `BroadcastChannel`。

**Worklet**——为**渲染管线扩展点**而设的轻量、高度专用 worker：Paint Worklet（CSS 里的 `paint()`）、Audio Worklet（实时音频处理）、Animation Worklet、Layout Worklet。它们跑微小、紧作用域的代码，而非通用逻辑。

通信细节：消息默认通过**结构化克隆算法**拷贝，但你可以传 **`Transferable` 对象**（`ArrayBuffer`、`MessagePort`、`OffscreenCanvas`）来**零拷贝转移所有权**——对移动大缓冲区而不付克隆成本至关重要。**Comlink** 把 `postMessage` 包成**基于 Promise 的 RPC**，使调用 worker 像调用本地异步函数。

**要点：**
- Worker 通过结构化克隆或 `Transferable` 对象（零拷贝）通信
- Service Worker 需要 HTTPS（localhost 除外）
- Comlink 把 `postMessage` 包成 RPC
- Shared Worker 在 Safari 移动版不支持

---

### 57. `React.memo`

**频率：** 中

**题目：** `React.memo` 做什么，它什么时候真正有帮助？

**答案：** **`React.memo(Component)`** 包一个**函数组件**，使父组件重渲染时，React **在其 props 与上次渲染浅相等时跳过重渲染子组件**。它是 `useMemo` 的组件级等价物——按 props 记忆化*渲染输出*。

关键是它只在特定条件下有帮助：组件必须**频繁渲染**（一个频繁更新的父组件）*且*接收**通常稳定的 props**。若父组件很少渲染，或 props 反正每次都变，`memo` 只是加了一次 props 比较成本却没好处。不加区分地记忆化是净负收益。

头号坑是**内联对象/函数/数组 props 会击败它**。因为 `{}`、`[]`、`() => {}` 每次渲染都创建**新引用**，浅比较总是看到“变了”、照样重渲染：
```jsx
<Child data={{ id }} onClick={() => go()} /> // 每次渲染新引用 → memo 无用
```
修法是**用 `useMemo`/`useCallback` 稳定那些 props**，使它们身份跨渲染保持。这正是 `memo` 和 `useCallback` 通常一起部署的原因——没有另一个，单用一个往往什么都不做。

你也可以传**自定义比较器**做深相等（`React.memo(C, (prev, next) => ...)`），但很少值得——深比较本身有成本。始终**用 Profiler 测试**确认收益。注意 **React 19 的编译器自动记忆化**，减少手动 `memo` 的需求。

**要点：**
- 内联对象/函数 props 击败 memo——用 `useMemo`/`useCallback` 包
- React 19 编译器自动记忆化，减少手动 `memo` 使用
- 昂贵子用 `useMemo` 而非 memo + props 管道
- 用 Profiler 测试确认收益

---

### 58. Context——传播成本与拆分

**频率：** 中

**题目：** 为什么 React Context 会造成性能问题，你如何缓解？

**答案：** 当一个 Context Provider 的 **`value` 变化时，那个 context 的*每个*消费者都重渲染**——无条件、不论它在树里多深、也不论它是否真的用到变化的那部分。Context **没有内置 selector**：消费 context 就订阅了*整个*值。

当你把**频繁变化的状态**放进一个被广泛消费的 provider 时，这成了性能问题。若一个大 `AppContext` 装着主题 + 用户 + 购物车 + 实时数据，那么每次购物车跳动或数据更新都会重渲染主题和用户的**所有**消费者——可能是整个应用。

第二个更隐蔽的陷阱：**内联的 `value` 对象每次渲染重建一个新引用**，所以即使没什么有意义的变化，消费者也重渲染：
```jsx
<Ctx.Provider value={{ user, setUser }}> // 每次渲染新对象 → 所有消费者重渲染
```
修法是**把 value 用 `useMemo` 包**，使底层数据没变时其身份稳定。

主要的结构性缓解是**按更新频率拆分 context**：`ThemeContext`（很少变）、`UserContext`（偶尔）、`CartContext`（经常）各自独立 provider。现在购物车更新只重渲染购物车消费者，让主题/用户消费者不受影响。指导原则：**把 Context 当作相对稳定值的依赖注入**，而非高频状态存储。

当你真的需要**对快变全局状态做细粒度订阅**时，取用专用存储——**Zustand、Jotai 或 Redux**——它们支持**基于 selector 的订阅**，使组件只在它*选择的那片*变化时重渲染。（`use-context-selector` 是把 selector 加装到 Context 上的第三方库。）注意 **React 19 的 `use(Context)`** hook 可以**有条件地**读 context（不像 `useContext` 不能在提前返回后调用），增加灵活性但不改变传播成本。

**要点：**
- `useContextSelector`（第三方）启用细粒度订阅
- 把 provider 值用 `useMemo` 包持身份稳定
- Context 用于依赖注入，不用于高频状态
- React 19 的 `use(Context)` 条件读 context

---

### 59. Ref 与 forwardRef

**频率：** 中

**题目：** React 中的 ref 是什么，`forwardRef` 做什么（React 19 又怎么改变了它）？

**答案：** **ref** 是一个**跨渲染持续存在、但改变时*不*触发重渲染的可变容器**——正好与 state 相反。`useRef(initial)` 返回一个对象，你自由读写它的 **`.current`**：
```js
const count = useRef(0);
count.current++; // 不重渲染
```
Ref 有两个主要用途：
1. **DOM 访问**——把 `ref` 附到 JSX 元素上，`.current` 就成了 DOM 节点，启用声明式模型表达不了的**命令式操作**：`.focus()`、`.scrollIntoView()`、测量尺寸/位置（`getBoundingClientRect`）、集成非 React 库（图表、地图、视频播放器）。
2. **类似实例的可变值**——持有定时器 id、某 prop 的上一个值、一个 WebSocket，或任何“我要记住这个但渲染不依赖它”的值。

**`forwardRef`** 解决了一个限制：正常情况父组件的 `ref` 触达不了**子组件的** DOM 节点（函数组件不把 `ref` 当普通 prop 收）。`forwardRef` 把父的 ref 向下**转发**到子组件内部的一个元素，使 `<FancyInput ref={r} />` 能聚焦真正的 `<input>`。**React 19 把 `ref` 做成普通 prop**——你可以直接从 props 里解构 `ref`——这**弃用了 `forwardRef`**（不再需要包装器）。

最佳实践：**别在渲染期间读写 ref**（那是副作用；首次渲染时 DOM ref 甚至还没附上）——在 effect 或事件处理里用它们。**`useImperativeHandle`** 让组件**策展它通过 ref 暴露的有限 API**（例如只暴露 `{ focus, reset }` 而非原始 DOM 节点）。**回调 ref**（`ref={node => ...}`）在**挂载（node）和卸载（null）**时跑，适合测量或在附上时挂接。总的来说，ref 是**逃生口**——优先声明式的 state/props，只在 DOM 真的需要命令式控制时才取用 ref。

**要点：**
- 渲染期间别读 ref（缓存值除外）
- `useImperativeHandle` 策展 `forwardRef` 暴露的
- 回调 ref（`ref={node => ...}`）在 mount/unmount 跑
- Ref 是逃生口——优先声明性模式

---

### 60. 错误边界

**频率：** 中

**题目：** React 错误边界是什么，它*不*捕获什么？

**答案：** **错误边界**是一个**捕获其后代在渲染期间抛出的 JavaScript 错误**的组件，并显示**回退 UI**，而非让整个应用崩成白屏（React 在未捕获的渲染错误上会卸载整棵树）。它们必须是**类组件**，实现下列之一或两者：
- **`static getDerivedStateFromError(error)`**——在渲染期间跑以设置回退状态（返回新状态，如 `{ hasError: true }`）。
- **`componentDidCatch(error, info)`**——之后跑，用于**记录日志等副作用**，把组件栈发给 Sentry/Datadog。

关键是错误边界只捕获其下方树的**渲染阶段、生命周期方法和构造函数**里的错误。它们**不捕获**：
- **事件处理器**——`onClick` 里的错误不是渲染错误；用 **`try/catch`** 包并手动设错误状态。
- **异步代码**——`setTimeout`、Promise、`async`/`await`、`fetch` 回调在 React 渲染之外跑；用 `try/catch` / `.catch` 处理。
- **服务端渲染**错误。
- **边界自身抛出的错误**（它只能捕获*下方*的）。

这些排除的原因：错误边界挂接进 React 的*渲染*管线，而事件处理器/异步代码在它之外执行。

实用用法：**把路由和独立特性包进边界**，使一个坏掉的小部件优雅降级而非拖垮整页。**`react-error-boundary`** 库给出人体工学的包装器，带 `FallbackComponent`、**`onError`** 日志钩子和用来恢复的 **`resetErrorBoundary()`**——你也可以在导航或新数据应清除错误时**通过改边界的 `key`（重挂载它）重置**。注意 **React 19 仍要求类组件**做边界——尚无 Hook 等价（`react-error-boundary` 只是替你包了一个类）。

**要点：**
- React-error-boundary 库提供 hook 友好包装
- 在 `componentDidCatch` 中向 Sentry/Datadog 记录
- 通过改边界的 `key` 或 `resetErrorBoundary` 重置状态
- React 19 仍要求类边界——尚无 hook 等价

---

### 61. Suspense 与并发特性

**频率：** 中

**题目：** 什么是 Suspense 和 React 的并发特性？

**答案：** **`Suspense`** 是一个边界组件，在后代**“挂起”**时显示**回退**（spinner、骨架屏）——其机制是组件**抛出一个 Promise** 来示意“我还没准备好；解决时重渲染我”。React 捕获它，渲染最近的 `<Suspense fallback={...}>`，并在 Promise 落定时重试。两个主要用途：
- **懒加载代码**——`const X = lazy(() => import('./X'))` 挂起直到代码块下载完。
- **数据获取**——支持 Suspense 的数据层（React Query、Relay、RSC、`use()` hook）挂起直到数据到达，让你像数据同步一样写组件，并在边界处**声明式**地声明加载 UI，而非到处传 `isLoading`。

你可以**嵌套边界**做**粒度加载状态**——页面的外层骨架屏，各小部件的内层，使快的部分立即显示、慢的部分转圈。

**并发特性**（React 18）让 React **中断并给渲染排优先级**，使 UI 在负载下保持响应：
- **`startTransition` / `useTransition`**——把状态更新标记为**低优先级（“过渡”）**，使紧急更新（在过滤框里打字）能**中断**昂贵的重渲染（被过滤的列表）。`useTransition` 返回 **`[isPending, startTransition]`**，让你显示一个微妙的 pending 指示。
- **`useDeferredValue`**——用快变值的**滞后副本**渲染，使输入保持灵敏而昂贵的派生 UI 追赶上来。

Server Components 和流式 SSR 也建在 Suspense 上——数据解决时 HTML 块被 flush 到浏览器。

**要点：**
- `lazy(() => import(...))` 与 Suspense 集成
- `useTransition` 返回 `[isPending, startTransition]`
- 边界可嵌套做粒度加载状态
- 从任意 hook 抛 Promise 现通过 `use()` 形式化

---

### 62. Server Components vs client components

**频率：** 中

**题目：** 请比较 React Server Components 与客户端组件，各自的收益与代价是什么？

**答案：** **Server Components（RSC）**在服务器上跑、**从不发到客户端**，所以它们能**直接访问服务器资源**——查数据库、读文件系统、用密钥/API key——**无需 API 层**、也不会把凭据泄给客户端：
```jsx
// Server Component——在服务器跑，零客户端 JS
async function ProductList() {
  const products = await db.query('SELECT ...'); // 直连数据库
  return products.map(p => <Product key={p.id} {...p} />);
}
```
它们渲染为一种**序列化格式**（RSC payload），客户端用它构造树，**把客户端组件当作可交互的“岛”水合**在静态的服务器渲染部分周围。

权衡：RSC **缩小客户端包**（markdown 解析器、日期库等重依赖留在服务器）并**集中数据获取**（就在渲染处取数据，无 prop 钻取或 effect 瀑布）。代价是**交互被限制在客户端岛**里——你用 server component 组合结构/数据，在需要交互处落进 `'use client'`。

约束都源于“没有浏览器、没有重渲染”：
- Server Components **不能用 state、effect 或事件处理器**（`useState`、`useEffect`、`onClick`）或**浏览器 API**（`window`、`localStorage`）——那些只在客户端存在。
- **从 server component 传给 client component 的 props 必须可序列化**（函数、类实例、Date 不能原样跨界）——因为它们要被序列化进 RSC payload。
- **变更**由 **Server Actions** 处理（`'use server'` 异步函数，客户端可从表单等调用），给出类型安全的服务器变更而无需手写 API 路由。

主要采用者是 **Next.js（App Router）**，其他框架也在跟进支持。

**要点：**
- Server Components 不能用 state、effect 或浏览器 API
- 服务器到客户端的 props 必须可序列化
- Server Actions 处理变更
- Next.js App Router 和 Remix v3 是主要采用者

---

### 63. 状态管理：Redux vs Zustand vs Jotai vs Context

**频率：** 中

**题目：** Redux、Zustand、Jotai 和 Context 如何比较，你何时选哪个？

**答案：** 它们坐落在从**重量级/结构化**到**极简/原子**的光谱上，而第一个真正的问题是你到底需不需要全局*客户端*状态。

**Redux（经由 Redux Toolkit）**——单一中心化 store，有**严格的单向流**（action → reducer → 新 state）。冗长但**在规模上可预测、可调试**：优秀的**带时间旅行的 DevTools**、丰富的 **middleware** 生态（saga、thunk、日志），以及强制的约定使大团队保持一致。RTK 削掉了大多数旧样板。为受益于严格结构、middleware 和可审计性的**大应用**选它。

**Zustand**——一个**微小的基于 hook 的 store**。你创建 store 并用带 **selector** 的 hook 读它（`useStore(s => s.count)`），使组件只在其选择的那片变化时重渲染。**最小样板**、不需要 provider、无 action/reducer 仪式。对多数需要共享客户端状态却不想要 Redux 开销的应用是极好的默认。

**Jotai**——**原子**状态：状态由你单独读写的小**原子**组成，**衍生原子**从其他原子计算，有**细粒度响应**（只有用到某原子的组件重渲染）。感觉像活在树外的 `useState`；对做成一个大对象会别扭的**细粒度、相互依赖**状态极好。

**Context**——**并不真是状态管理器**，而是**依赖注入**。最适合**很少变化**的值（主题、当前用户、语言）。如前所述，它在变化时重渲染*所有*消费者且无 selector，所以对高频状态不合适。

最重要的横切规则：**把*服务器*状态与*客户端*状态分开。** 从 API 取的数据（缓存、重验证、加载/错误、去重）属于 **React Query / SWR / RTK Query**，*不要*手搓进 Redux/Zustand——混淆它们是最常见的架构错误。也**别为组件局部的关注用全局状态**（留在 `useState`），并注意 **Zustand/Jotai 被设计为与 React 18 并发渲染干净配合**（经由 `useSyncExternalStore`）。

**要点：**
- 服务器状态（React Query、SWR）与客户端状态分开
- 组件局部关注不要用全局状态
- Zustand/Jotai 与 React 18 并发渲染配合极好
- Redux Toolkit Query 也覆盖数据取

---

### 64. 路由：客户端 vs 服务端

**频率：** 中

**题目：** 客户端路由与服务端路由有何不同，框架如何混合两者？

**答案：** **服务端路由**是传统模型：每个 URL 请求从服务器返回一个**完整 HTML 文档**。它**简单、SEO 友好**（每个 URL 都是可爬的完整页），且**零 JavaScript 也能工作**。缺点是每次导航都是**整页重加载**——白闪、重新下载共享外壳/CSS/JS、丢失客户端状态。

**客户端路由**（SPA）在浏览器里**拦截导航**：点链接不会去服务器取新文档——JS **阻止默认行为**、只取所需**数据（JSON）**、并**就地换视图**。这给出**快、类应用的转场**并保留状态，但**需要 JavaScript**、增加复杂度（你得管滚动恢复、焦点、标题、加载状态），并需为 SEO 花心思（初始 HTML 可能是空的）。

现代框架用**混合/同构路由**兼得两者：**服务器渲染（SSR/SSG）初始页**使首绘和 SEO 强且无 JS 也能工作，然后客户端**水合并接管**后续导航作为 SPA——首次加载后转场飞快。Next.js、Remix、SvelteKit、Nuxt 都这样工作。

支撑细节：
- **History API**（**`pushState`/`replaceState`** + `popstate` 事件）是客户端路由器能**不重加载**地改 URL 并处理前进/后退的基础。
- 为**渐进增强**，保留真正的 **`<a href>`** 链接，使 JS 失败或未加载时导航仍能工作——路由器增强它们而非用 `onClick` div 替代。
- **按路由代码切分**（`lazy(() => import())`）使每路由的 JS 按需加载，保持**初始 bundle 小**。
- **View Transitions API** 声明式地启用客户端路由间的平滑动画交叉淡入/形变。

**要点：**
- History API（`pushState`/`replaceState`）驱动客户端路由
- `<a>` 应仍在无 JS 时工作（渐进增强）
- 路由代码切分减小初始 bundle
- View Transitions API 启用流畅客户端路由动画

---

### 65. 容器/展示 vs hook 驱动

**频率：** 中

**题目：** 容器/展示组件模式与 hook 驱动的架构如何比较？

**答案：** 两者都是**把“组件如何取得数据”与“它长什么样”分离**的方式——只是用不同工具。

经典的**容器/展示分离**（Dan Abramov 2015 模式）用**两个组件**：一个**容器**处理数据获取、状态和逻辑（常是连到 Redux 的类），一个**展示**组件通过 **props** 收一切、只渲染 UI。这在 **hook 之前**很有价值，因为没有干净方式复用有状态逻辑——于是你把它隔离在容器里，保持视图哑且可测。

**hook 驱动**方法使容器大多多余。一个**自定义 hook**（`useUser()`、`useCart()`）**封装数据/逻辑**，组件直接调用它，**把数据需求与用它的组件共置**。这**消除 prop 钻取**（深层组件自己取所需而非穿五层传入）并使逻辑可跨不相关组件复用。所以：**自定义 hook 是现代的“容器”**——且可独立**单测**（用 `renderHook` 测 hook，与任何 UI 分开）。

**Server Components** 把这推得更远——数据层完全**从客户端代码消失**：一个异步 server component 内联 `await` 其数据，根本无获取逻辑发到浏览器。

旧模式里仍有用的：**展示（“哑”）组件对设计系统仍有价值**——一个只收 props、无数据依赖、易测易在 Storybook 展示的 `<Button>`/`<Card>`。相关的组合模式如**复合组件**（`<Tabs><Tab/></Tabs>` 通过 context 共享隐式状态）比 prop 繁重的配置更干净地表达关系。总体告诫：**避免过早抽象**——当模式*真的*重复时才抽自定义 hook 或共享组件，而非推测性地抽。

**要点：**
- 自定义 hook 是现代"容器"——隔离可测
- 展示组件对设计系统仍有价值
- 复合组件模式分组相关 UI（Tabs/Tab）
- 避免过早抽象——模式出现时抽

---

### 66. 摇树——什么阻塞

**频率：** 中

**题目：** 什么是摇树（tree shaking），什么会阻止它？

**答案：** **摇树**是**针对打包的死代码消除**——打包器静态分析你的 import/export 图，**丢掉从不用的 export**，使从库里导一个函数不会发整个库。“摇树”使死叶落下。

它有三个要求：
1. **ESM（`import`/`export`）**——因为 ES 模块绑定是**静态**的（不运行代码就可分析），打包器能*证明*什么被用。CommonJS 的 `require` 是动态的，不能可靠地分析。
2. **无副作用模块**——打包器必须知道移除一个未用 export 不会跳过重要副作用。在 `package.json` 里用 **`"sideEffects": false`** 声明（或列出*确*有副作用的文件，如 CSS import）。
3. **纯顶层代码**——仅导入一个模块不发生有意义的工作。

常见**阻碍**：
- **CommonJS 模块 / 动态 `require`**——不可静态分析，所以什么都摇不下。
- **顶层副作用**——导入时就跑的代码（注册全局、改原型、`console.log`）迫使打包器保留模块。
- **桶文件**（`index.js` 再导出一切）——再导出整个命名空间可能打败消除并拉进远多于你所用；它们也伤构建性能。
- **过早把 ESM 转译为 CJS**——例如 Babel/TS 配成在打包器看到*之前*就吐 CommonJS，销毁静态结构。保持模块为 ESM，让打包器处理输出。

实用指导：用**命名 import**（`import { debounce } from 'lodash-es'`），**不用 `import * as`**（可能保留一切）也**不默认导整个库**。这正是 **`lodash-es` 能摇树而 CommonJS `lodash` 不能**的原因——同样的函数，但只有 ESM 构建可分析。**`/*#__PURE__*/`** 注解告诉压缩器一个函数*调用*无副作用，如果未用可丢掉其结果。总用 **bundle 分析器**（`webpack-bundle-analyzer`、`rollup-plugin-visualizer`）**验证**而非假设摇树生效。

**要点：**
- `/*#__PURE__*/` 注解标调用为无副作用
- Lodash-es 摇树；lodash（CJS）不
- 避免 `import * as`——命名 import
- 用 bundle 分析器验证

---

### 67. CDN 与边缘缓存

**频率：** 中

**题目：** CDN 与边缘缓存如何工作，哪些策略重要？

**答案：** **CDN（内容分发网络）**是一个全球分布的 **PoP（存在点）**网络，**把你的内容缓存到离用户近处**。用户不再每次请求都跑到你唯一的源服务器，东京的用户从附近 PoP 得到服务——**削减延迟**（更少网络跳、更短 RTT）并**卸载源**（缓存命中从不碰它）。对静态资源（JS/CSS/图片/字体）理想。

现代 CDN（**Cloudflare、Fastly、Vercel、CloudFront**）超越静态缓存去跑**边缘函数/worker**——你的代码*在 PoP 上*执行，以极低 **TTFB** 启用**边缘 SSR 和个性化**，因为渲染发生在用户附近而非一个遥远区域。

关键概念和策略：
- **缓存 key**——标识一个缓存对象的东西。它主要是 **URL**，但可含**头/cookie/查询参数**，经 **`Vary`** 头控制（如 `Vary: Accept-Encoding` 分开缓存 gzip 和 brotli）。粗心地把 cookie 纳入 key **撕碎命中率**（每个用户得唯一 key）。
- **清除/失效**——移除陈旧内容。**按标签清除**（surrogate key）启用**细粒度失效**：给相关对象打标签并一次全清（如某商品变化时清除所有打 `product-123` 标签的）而非按精确 URL。
- **源屏蔽（origin shield）**——一个指定的中间缓存层，所有 PoP 在回源前先咨询它，使许多区域的缓存 miss 只导致**一次**回源，而非几十次——降低源负载和缓存 miss 成本。
- **分层缓存**——层级化 PoP 层，提升命中率。
- **签名 URL**——为访问受控资源提供限时、防篡改的链接。

一个历史注解：**HTTP/2 Server Push 大体被弃**（从 Chrome 移除），因为它常浪费带宽推送已缓存资源——现代替代是 **`103 Early Hints`** 和 **`<link rel=preload>`** 来提示关键资源而无需猜测。

**要点：**
- 缓存 key 含 URL，有时含头/cookie——通过 `Vary` 控
- 按标签清除做细粒度失效
- HTTP/2 push 大体被弃；用 early hint / preload
- 源屏蔽减到源的缓存 miss

---

### 68. Cookie：SameSite/Secure/HttpOnly

**频率：** 中

**题目：** cookie 安全属性 `HttpOnly`、`Secure`、`SameSite`、`Partitioned` 各做什么？

**答案：** cookie 属性加固 cookie 抵御盗窃和跨站滥用：

**`HttpOnly`**——使 cookie **对 JavaScript 不可见**（`document.cookie` 读不到它）。这是会话 cookie 的首要 **XSS 缓解**：即便攻击者注入脚本，也**盗不走 token**。代价是 JS 也读不到它——对浏览器自动发送的认证 cookie 这没问题。

**`Secure`**——cookie **只在 HTTPS 上发送**，防止在明文连接上被截。

**`SameSite`**——控制 cookie 是否在**跨站**请求上发送，是核心 **CSRF** 防御：
- **`Strict`**——从不在任何跨站请求上发送，*包括*顶级导航。最大安全，但从别的站点击链接到你的应用不会带 cookie（用户看似未登录，直到内部导航）。
- **`Lax`**（现代**默认**）——在**顶级导航 GET**（点链接到你的站）时发送，但**不**在跨站子请求或不安全方法（来自另一源的 POST）上发送。对多数认证 cookie 是好平衡。
- **`None`**——在所有跨站请求上发送，但**必须**配 **`Secure`**。合法第三方上下文（嵌入小部件、SSO iframe）需要它。

**`Partitioned`（CHIPS）**——把跨站 cookie 选入**按顶级站分区的存储**，使嵌入小部件在每个嵌入站得*独立*的 cookie 罐而非一个共享的跨站标识符。这是随**第三方 cookie 淘汰**后合法嵌入的前进之路。

指导：认证 token 应 **`HttpOnly; Secure; SameSite=Lax`**；**嵌入的跨站小部件**需要 **`SameSite=None; Secure; Partitioned`**。留意 **~4KB 大小限**（且 cookie 搭在到该域的*每个*请求上——头臃肿）。用 **`__Host-` 前缀**求最严保证：浏览器只在这类 cookie 为 `Secure`、无 `Domain`（host-only）、`Path=/` 时才接受——防子域注入。

**要点：**
- 认证 token 应 `HttpOnly; Secure; SameSite=Lax`
- 嵌入小部件需要 `SameSite=None; Secure; Partitioned`
- Cookie 大小限 ~4KB；考虑头臃肿
- 用 `__Host-` 前缀求最严安全保证

---

### 69. 前端 auth：localStorage 中 JWT vs httpOnly cookie

**频率：** 中

**题目：** 前端认证中把 JWT 存 localStorage 与用 httpOnly cookie 如何比较？

**答案：** 核心权衡是 **XSS 暴露 vs CSRF 暴露**——你选哪个威胁去缓解。

**localStorage 中的 JWT**——**任何在你页面跑的 JavaScript 都能读它**（`localStorage.getItem`）。所以任何 **XSS** 漏洞——你自己的代码或任一第三方依赖里的——都能**盗走 token**并发到攻击者。给 SPA 手动附带 `Authorization: Bearer` 头方便，但把认证凭据置于每个脚本可及处。`sessionStorage` 不更好（仍 JS 可访问，只是活得短些）。

**httpOnly cookie**——**JavaScript 读不到**（见上一题），所以 XSS 盗不走 token。浏览器在每个到该域的请求上**自动发送**它。代价：cookie 被自动发送使它们**易受 CSRF**——恶意站能诱使用户浏览器带上 cookie 发请求。缓解用 **`SameSite=Lax/Strict`** 加（对状态改变操作）**CSRF token**（双提交或同步器模式）。

**结论：** cookie（`HttpOnly; Secure; SameSite`）是浏览器认证的**标准与更安全默认**——它们移除了最危险的暴露（token 盗窃）。localStorage 只在**纯 API 的 SPA、短命 token 加强 CSP** 下勉强可接受。最稳健的模式是 **BFF（Backend-for-Frontend）**：服务器持有 token 于 httpOnly cookie，代理 API 调用，使 token **完全离开客户端**。

**要点：**
- 刷新 token 轮换减爆炸半径
- 也别在 `sessionStorage` 存 token（仍 JS 可访问）
- BFF（Backend-for-Frontend）模式让 token 完全离客户端
- 公共客户端要求 OAuth PKCE

---

### 70. WebSocket vs SSE vs 长轮询

**频率：** 中

**题目：** 请比较 WebSocket、Server-Sent Events（SSE）和长轮询。

**答案：** 三种把服务器数据推给客户端的方式，差在**方向性、传输和复杂度**：

**WebSocket**——单个长寿命 TCP socket（从 HTTP 升级）上的**全双工、双向**连接。两端随时以**极低延迟**发消息，支持**二进制**帧。对**聊天、多人游戏和协作编辑**——任何需要快速双向流量的——理想。代价：它是**独立协议**（`ws://`/`wss://`），需**服务器支持**及自己的基建（负载均衡、粘性会话），无内置重连，且需**心跳/ping**来熬过否则会静默掐断连接的代理/空闲超时。

**SSE（Server-Sent Events）**——**普通 HTTP** 连接（`EventSource`）上的**单向、服务器→客户端**流。简单得多：它就是 HTTP，所以**能穿过大多数代理/防火墙**，且浏览器免费给你**自动重连**（带 `Last-Event-ID` 续传）。限制：**仅文本**（UTF-8；二进制须编码），且在 **HTTP/1.1 下严格 ~6 每源连接上限**（HTTP/2 多路复用解除此限）。对**通知、实时源/仪表盘和流式 LLM/AI token 输出**完美——正是全 WebSocket 过头的单向推送场景。

**长轮询**——不用两者而模拟推送的**回退**：客户端发一个请求，服务器**保持挂开直到有数据**（或超时），响应，客户端立即重连。**到处都能用**（就是 HTTP）但**延迟和开销更高**（不断重连、头搅动）。仅在 WebSocket/SSE 不可用时用。

决策指南：**双向/低延迟 → WebSocket**；**单向服务器推 → SSE**（更简单、自动重连、代理友好）；**遗留回退 → 长轮询**。正在崛起的后继是 **WebTransport（走 HTTP/3/QUIC）**，提供低延迟双向流和数据报而无 WebSocket 的队头阻塞限制。

**要点：**
- SSE 适合通知、实时 feed、AI 流
- WebSocket 需心跳应对空闲超时
- WebTransport（HTTP/3）是低延迟双向的新兴继任者
- SSE 在 HTTP/1.1 下有每源连接数上限

---

### 71. 图片优化清单

**频率：** 中

**题目：** 请走一遍 Web 图片优化清单。

**答案：** 图片通常是**一个页面上最重的字节**，所以优化它们是杠杆最高的性能工作。一份实用清单：

**1. 选对格式**——发 **AVIF**（最小）或 **WebP**，带 JPEG/PNG **回退**；图标/logo/插图用 **SVG**（矢量、极小、任意尺寸都锐利）。

**2. 每设备选对尺寸**——用 **`<picture>` / `srcset` + `sizes`**，使浏览器下载合适尺寸的变体而非在手机上下桌面尺寸的图。配一个**即时缩放的 CDN**（`?w=400`），你就不必手工生成每个尺寸。
```html
<img src="p-800.jpg" srcset="p-400.jpg 400w, p-800.jpg 800w, p-1600.jpg 1600w"
     sizes="(max-width:600px) 100vw, 50vw" width="800" height="600"
     loading="lazy" decoding="async" alt="...">
```

**3. 预留空间防 CLS**——**总是设 `width`/`height`**（或 CSS 的 **`aspect-ratio`**），使浏览器在图加载前就布好槽位，避免布局抖动。

**4. 正确排优先级：**
- 用 **`loading="lazy"`** **懒加载首屏下**的图，使离屏图不争带宽。
- **绝不懒加载 LCP 图**——那会推迟你最重要的绘制。反而标 **`fetchpriority="high"`**（并可选 `preload`）以尽快取它。
- **`decoding="async"`** 在主线程外解码，使它不阻渲染。

**5. 缩小字节**——**激进压缩**（调质量；多数照片 70–80% 看着挺好），并**剥元数据**（EXIF/GPS/色彩配置等胀文件的杂物）。

**6. 感知性能**——显示 **LQIP（低质量图片占位）**或 **BlurHash**——一个立即渲染的微小模糊预览，加载完成时换成完整图，使用户即便字节仍在到达也感觉加载更快。

**要点：**
- LCP 图不应 lazy
- `decoding="async"` 避免阻主线程
- 用 `aspect-ratio` CSS 避 CLS
- Blurhash/LQIP 占位改善感知性能

---

### 72. 字体加载（`font-display: swap`、preconnect、子集）

**频率：** 中

**题目：** 你如何优化 web 字体加载？

**答案：** web 字体**近乎阻塞渲染**——处理不当，它们要么隐藏文本要么抖动布局。目标是快速、无抖动的文本。

**用 `font-display` 避免不可见文本。** 默认浏览器会 **FOIT**（不可见文本闪现）——在字体加载时把文本隐藏最多 3 秒。**`font-display: swap`** 改为**立即渲染回退字体**，就绪时**换**成 web 字体（**FOUT**——*无样式*文本闪现）。文本总是可见，这几乎总是对的权衡。对严格 CLS 预算，**`font-display: optional`** 只在 web 字体几乎瞬间加载时用它，否则坚持回退——**无换、无抖**。

**削减到字体的延迟：**
- **`preconnect`** 到字体源（`<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`）提前预热 DNS/TLS，省一次往返。
- **`preload`** 关键字体（`<link rel="preload" as="font" type="font/woff2" crossorigin>`），使浏览器在 CSS 里发现它们之前就取。注意即便同源字体也**必须 `crossorigin`**（字体总以 CORS 模式取）。
- **自托管**整个移除一个第三方源（少一个连接、更好隐私、完全缓存控制）。

**削减字节：**
- **子集化**剥掉未用字形——仅拉丁子集可以是完整多脚本字体的一小部分。
- **WOFF2** 是现代浏览器里**唯一需要的格式**（最佳压缩）；别发遗留 `.ttf`/`.eot`/`.woff`。
- **可变字体**把多个粗细/样式打进**一个文件**并带连续轴，替代分开的常规/粗体/斜体下载。

**最小化换字抖动：** `@font-face` **回退**上的 **`size-adjust`**（加 `ascent-override`/`descent-override`）描述符调回退度量以匹配 web 字体，使换字发生时文本几乎不动——近零 CLS。

**要点：**
- 可变字体替代多重量文件
- WOFF2 是唯一需要的现代格式
- `size-adjust` CSS 最小化回退与 web 字体间布局偏移
- 预加载关键字体：`<link rel="preload" as="font" crossorigin>`

---

### 73. 打包器：Webpack vs Vite vs esbuild vs Rollup

**频率：** 中

**题目：** Webpack、Vite、esbuild 和 Rollup 作为打包器如何比较？

**答案：** 它们主要差在**开发服务器速度、输出质量和目标用例**：

**Webpack**——**成熟、无处不在的主力**，有最丰富的插件/loader 生态；它几乎能打包任何东西。代价是**速度**：即便开发也打包整个应用，所以大项目冷启动和 HMR 慢。仍主导**企业/遗留**代码库。

**Vite**——**新应用的现代默认**。**开发**时它以**原生 ESM 无打包**方式提供源码——浏览器按需请求模块，所以启动近乎瞬时且 **HMR 不论应用大小都保持快**。**生产**用 **Rollup** 打包（久经考验的摇树、优化输出）。DX 极佳；多数新 React/Vue/Svelte 项目用它。

**esbuild**——一个 **Go 写的**打包/转译器，靠并行和原生代码**极快**（比典型 JS 工具快 10–100 倍）。Vite 内部用它做**变换**（TS/JSX → JS、依赖预打包）。它自己的打包器快但**插件 API 相比 Rollup 有限**，所以它常是构建块而非整条工具链。

**Rollup**——首选的**库打包器**：最干净的 **ESM 输出**、一流的**摇树**、对输出格式（ESM/CJS/UMD）的精确控制。当你发的是*包*而非应用时理想。**库作者通常选 Rollup 或 tsup**（一个基于 esbuild 的包装器）。

崛起的一代是 **Rust 写的**：**Rspack**（Webpack API 兼容、可直接替换但快得多）和 **Turbopack**（Vercel 对 Webpack 的后继，用于 Next.js）——都在追 esbuild/Vite 速度同时保留 Webpack 的灵活。经验法则：**应用用 Vite，库用 Rollup/tsup，已经在用 Webpack 或需要它的生态时用 Webpack。**

**要点：**
- Vite 是新前端应用默认
- Webpack 仍主导企业/遗留
- 与 Rollup 相比 esbuild 插件 API 有限
- 库作者通常选 Rollup 或 tsup（esbuild 基础）

---

### 74. 测试金字塔

**频率：** 中

**题目：** 什么是测试金字塔，“测试奖杯”又如何修正它？

**答案：** **测试金字塔**按速度和成本规定测试类型的*比例*：
- **底层——大量单元测试**：快（毫秒）、隔离、测单个函数/模块。写和跑都便宜，精确定位失败。
- **中间——较少集成测试**：验证多个单元一起工作（一个组件 + 它的 hook + 一个 mock 的 API）。
- **顶层——少量 E2E 测试**：慢、在真浏览器里跑整个应用、测完整用户旅程。高信心但脆且贵，所以保持少。

这个形状编码一个原则：**把大多数测试下推到快、便宜的层**，把慢的 E2E 留给真正重要的少数流程。

现代的**“测试奖杯”**（Kent C. Dodds）**把重量移向集成测试**，主张它们打中**最佳 ROI**——它们抓**真 bug**（组件真的渲染并连线在一起）**而无 E2E 的脆性**或过度 mock 的单元测试的琐碎。用 **React Testing Library**，你像用户体验组件那样测它（按角色/文本查询、点击、断言可见输出）而非测内部。E2E（Playwright/Cypress）则**只留给关键旅程**——登录、结账、注册。

两个模型共享的横切规则：**别测实现细节**（内部状态、私有方法、精确调用次数）——那些测试在每次重构时都坏，即便行为没变。**测可观察行为。** 还有：在单元层求**毫秒反馈**；用**契约测试（Pact）**替代部分跨服务集成测试（各方独立验证遵守共享 API 契约）；把**代码覆盖率当健全检查而非目标**——琐碎 getter 的 100% 覆盖证明不了什么，而刷数字鼓励坏测试。

**要点：**
- 避免测实现细节
- 求快速反馈——单元测试以毫秒计
- 契约测试（Pact）替代部分跨服务集成测试
- 覆盖率是健全检查，不是目标

---

### 75. Jest vs Vitest vs Playwright vs Cypress

**频率：** 中

**题目：** 请比较 Jest、Vitest、Playwright 和 Cypress。

**答案：** 两个是**单元/集成 runner**，两个是**端到端框架**：

**Jest**——为 React/Node 长存的**单元/集成测试 runner**。开箱即用（断言、mock、快照、覆盖率）、生态巨大，多年来的事实标准。它的弱点是 **ESM 和速度**：它成长于 CommonJS 时代，需要变换配置（Babel/ts-jest），在现代 ESM/Vite 项目里增加摩擦和缓慢。

**Vitest**——**Vite 原生**替代，带 **Jest 兼容 API**（近乎直接替换：`describe`/`it`/`expect`、同样的 matcher）。它**更快**、**ESM 优先**、且**复用你的 Vite 配置/变换管线**，所以没有单独的构建设置。它是 **Vite/SvelteKit/Astro/Nuxt** 项目的**新默认**。

**Playwright**——一个用一套 API 驱动 **Chromium、Firefox 和 WebKit** 的**多浏览器 E2E 框架**。优势：优秀的**自动等待**（更少不稳定测试）、强**并行**、经由**追踪**（带 DOM 快照的录制时间线）的丰富调试。它**在追赶 Cypress**，很大程度因为真正的跨浏览器（含 WebKit/Safari）支持。

**Cypress**——一个**开发者友好的 E2E runner**，以其交互式**时间旅行调试** UI（逐步走命令、看每步的应用状态）著称。它**在浏览器内**与你的应用并排跑，这带来那种 DX 但历史上把它限于**每次跑一个浏览器**并使某些跨源/标签场景别扭。

重叠与工具：**Playwright 和 Cypress 也都做组件测试**（在真浏览器里渲染组件），模糊了单元/E2E 界线。而 **MSW（Mock Service Worker）**是在*两种*测试（单元和 E2E）里**在网络层 mock API** 的现代方式——拦截 `fetch`/XHR，使你 mock 真实响应而不桩自己的代码。典型现代栈：**Vitest + React Testing Library** 做单元/集成、**Playwright** 做 E2E、**MSW** 跨两者做 API mock。

**要点：**
- Vitest 是 Vite/SvelteKit/Astro 项目的新默认
- Playwright 在跨浏览器上追赶 Cypress
- Playwright 和 Cypress 也支持组件测试
- 两者都用 MSW 做 API 模拟

---

### 76. A11y 测试（axe-core、lighthouse、屏幕阅读器）

**频率：** 中

**题目：** 你如何测试可访问性——自动和手动？

**答案：** 可访问性测试需要**自动和手动**两层，因为工具本身远远不够。

**自动**工具——**axe-core**（单元测试里经 `jest-axe`，或 E2E 里 `@axe-core/playwright` 集成）和 **Lighthouse**——只抓大约 **30–50% 的问题**：那些*机器可检测*的，如**缺表单 label/alt 文本、对比不足、无效 ARIA、重复 id**。它们做 **CI 回归防护**（新违规时让构建失败）很好且跑起来便宜，但它们**判断不了体验**——焦点顺序是否合理、一个 ARIA 组件是否*真的*可操作、一段播报是否有意义。

**手动**测试填另一半：
- **仅键盘导航**——拔掉鼠标，验证一切可达、可操作、有可见焦点指示，tab 顺序合逻辑、模态框里焦点陷阱有效。
- **屏幕阅读器**——用**真 AT** 测：**NVDA**（Windows/Firefox）、**JAWS**（Windows）、**VoiceOver**（macOS/iOS）。模拟不够——真屏幕阅读器行为不同，这是抓混乱或缺失播报的唯一途径。
- **缩放到 200%**（并在 320px 回流）确保内容不裁剪或重叠。
- **`prefers-reduced-motion`** 确认非必要动画被禁用。

流程集成：在 **CI 跑 axe** 防回归，加 **Storybook `addon-a11y`** 使 axe 在组件开发时**逐 story** 跑（在编写时抓问题），并把 **Lighthouse a11y 分数当起点而非终点**——满分仍需手动验证。可能时**让残障用户参与**测试——那里的反馈信号最高。

**要点：**
- Storybook addon-a11y 每 story 跑 axe
- Lighthouse a11y 分是起点，不是终点
- 用真辅助技术测，不只仿真
- 可能时把残障用户纳入测试

---

### 77. PWA：SW 生命周期、离线策略、安装提示

**频率：** 中

**题目：** 你如何构建一个 PWA——Service Worker 生命周期、离线策略和安装提示？

**答案：** **渐进式 Web 应用（PWA）**用一个 **Service Worker**（网络代理 worker）加一个 **manifest** 来交付离线支持和可安装性。

**Service Worker 生命周期**——三个阶段：
1. **`install`**——SW 首次注册/更新时触发一次；这里你**预缓存应用外壳**（HTML/CSS/JS/离线页）使应用能离线启动。
2. **`activate`**——新 SW 接管时触发；这里你**清理**先前版本的**旧缓存**。
3. **`fetch`**——页面发的**每个网络请求**都触发；你拦截它并决定如何响应（缓存、网络或混合）。

**离线/缓存策略**（按资源类型选）：
- **缓存优先**——从缓存发，回退到网络。最适合**静态、带版本的资源**（哈希 JS/CSS、字体），它们很少变——即时且可离线。
- **网络优先**——先试网络，回退到缓存。最适合你想要新鲜的 **API 数据**，缓存数据作离线回退。
- **stale-while-revalidate**——立即发缓存*并*在后台取更新供下次用。对头像或可稍陈旧的内容是最佳 **UX/新鲜度平衡**。

**安装提示**——浏览器触发 **`beforeinstallprompt`**；你 **`preventDefault()`** 阻止默认小信息条、暂存事件、并**在用户选择的时刻调 `.prompt()`**（如他们点你的“安装”按钮后）以获得非侵入式安装体验。

支撑事实：一个应用在有**有效 manifest**（name、icons、`start_url`、`display`）、经 **HTTPS** 提供、注册 **Service Worker** 并离线工作时**可安装**。**更新流**很重要——新 SW 安装时它等待；提示用户**重载**以激活它（或谨慎 `skipWaiting`）。**后台同步**排队失败的变更（离线时发的消息）并**在连接恢复时重试**。**Workbox** 抽象所有这些（路由、缓存策略、预缓存），使你极少手写 SW 逻辑。最后，**iOS/Safari 的 PWA 支持有限且古怪**（存储驱逐、直到最近才有推送、无 `beforeinstallprompt`）——**在真机上测**。

**要点：**
- manifest + HTTPS + SW + 离线页 = 可安装 PWA
- 更新流：新 SW 激活时提示用户重载
- 后台同步排队失败变更重试
- iOS PWA 支持有限；真机测试

---

### 78. 关键 CSS 与 FOUC

**频率：** 低

**题目：** 什么是关键 CSS，什么导致 FOUC？

**答案：** **关键 CSS** 是**渲染首屏内容所需的最小样式子集**——不滚动就可见的部分。因为 **CSS 阻塞渲染**（浏览器在有 CSSOM 前不绘制），一个大的外部样式表推迟首绘。**把关键 CSS 直接内联在 `<head>`** 里移除初始视图的那次往返，使页面立即绘制——改善 **FCP 和 LCP**——而完整样式表随后加载。

**FOUC（无样式内容闪现）**是相反的失败：**HTML 在其 CSS 到达前渲染**，所以用户短暂看到无样式（或错样式）内容然后“咔”地就位。它常由**异步/迟**加载 CSS、绘制后经 JS 注入样式或字体换字引起。修法是确保关键样式在首绘**之前**就位（内联），同时安全地延迟其余。

标准模式：**内联关键 CSS**，然后经 `media` 技巧**非阻塞**地加载完整样式表：
```html
<style>/* 内联的关键 CSS */</style>
<link rel="stylesheet" href="full.css" media="print" onload="this.media='all'">
```
`media="print"` 使浏览器**不阻塞渲染**地取它（它“不用于屏幕”），然后 `onload` 把它翻成 `all` 以应用。**Critters/Beasties**（和 **Next.js**）等工具在构建时**自动抽取并内联关键 CSS**，使你不必手工维护。

相关指导：用 `<link rel="preload">` **`preload`** 关键字体/CSS 以提前取；字体上偏好 **FOUT 而非 FOIT**（可见回退文本胜过不可见文本）；并**避免 CSS 里的 `@import`**——它**串行化下载**（浏览器必须先取并解析父样式表才发现 import），增加往返。改用 `<link>` 标签或打包器。

**要点：**
- 内联关键 CSS，然后用 `media="print" onload="this.media='all'"` 加载完整样式
- 用 `<link rel="preload">` 预加载关键字体/CSS
- FOUT（文本）通常优于 FOIT（不可见文本）
- CSS 中避免 `@import`——它会串行下载

---

### 79. 垃圾回收（标记清除）

**频率：** 低

**题目：** JavaScript 垃圾回收如何工作，你如何避免泄漏？

**答案：** JS 引擎用**标记清除**自动回收内存：从**根**（全局对象、当前调用栈、活跃闭包）出发，回收器沿引用**标记**每个**可达**对象，然后**清除**（释放）所有未标记的。“活”对象的核心定义因此是**可达性**——而非你是否真的会再用它。

现代引擎（V8）是**分代**的，利用“多数对象年轻即死”的观察把堆分割：
- **新生代**——由快速的 **Scavenger**（复制回收器）频繁回收。多数短命对象在此便宜地死掉。
- **老生代**——熬过几次新生代回收的对象被**晋升**到此，由 **Mark-Compact** 较少回收（它还**压实**以减碎片）。

你从 JS **不能强制 GC**（没有可靠 API），所以避免**内存泄漏**——保持*可达*但逻辑上已死的对象——是开发者的活：
- **解绑你加的事件监听器**（`removeEventListener`）——一个监听器保持其目标和闭包活着。
- **清定时器/间隔**（`clearInterval`）——一个活的 interval 永远保留其回调的作用域。
- **置 null 或限界长命缓存**——不断增长的 `Map` 缓存是经典泄漏；用 LRU 或 **`WeakMap`**（其键不阻止回收）。
- 当心**闭包保留其整个作用域链**——捕获大对象的闭包只要活着就保持它活着。

为什么用标记清除而非**引用计数**（老 IE）：引用计数**不能回收环**——两个互相引用的对象即便别处无引用也让彼此计数大于零，永远泄漏。基于可达性的 GC 自然处理环。

调试：**DevTools 内存剖析器**（堆快照）找泄漏——如仍被 JS 引用的**游离 DOM 节点**（从页面移除但被变量持有）。**`FinalizationRegistry`** 能在对象被回收*后*跑清理回调，但其时机不确定——少用，绝不用于关键逻辑。

**要点：**
- 引用计数（老 IE）在循环上失败
- DevTools 内存剖析器找游离 DOM 节点
- 闭包保留其整个作用域链
- `FinalizationRegistry` 在对象被 GC 时跑清理（慎用）

---

### 80. Symbol；`Symbol.iterator`

**频率：** 低

**题目：** JavaScript 中的 Symbol 是什么，`Symbol.iterator` 是什么？

**答案：** **Symbol** 是一个**唯一、不可变的原语**——每次 `Symbol('desc')` 调用返回一个全新值，**永不等于任何其他**，即便描述相同（那字符串只是调试标签）。这种唯一性使它们理想地作为**不冲突的属性键**：一个库能给对象加符号键属性，**零风险**地与用户自己的键或另一个库的冲突。

它们第二、更大的角色是**知名协议钩子**——语言本身查找以定制对象行为的内置符号：
- **`Symbol.iterator`**——定义这个方法，你的对象就变**可迭代**，与 `for...of`、展开 `[...obj]` 和解构一起工作。它必须返回一个迭代器（一个带返回 `{ value, done }` 的 `next()` 的对象）：
  ```js
  const range = {
    from: 1, to: 3,
    [Symbol.iterator]() {
      let n = this.from, last = this.to;
      return { next: () => n <= last ? { value: n++, done: false } : { value: undefined, done: true } };
    }
  };
  [...range]; // [1, 2, 3]
  ```
- **`Symbol.asyncIterator`**——异步等价物，驱动 `for await...of`。
- **`Symbol.toPrimitive`**——定制对象如何**强制**为数字/字符串。

**`Symbol.for(key)`** 不同于 `Symbol()`——它在整个 realm 共享的**全局注册表**里查找（或创建）一个符号，所以 `Symbol.for('x') === Symbol.for('x')`。当你需要从不同模块/realm 得到*同一个*符号时用它。

作为符号带来的关键行为：它们**对普通枚举隐藏**——不出现在 `for...in` 或 `Object.keys()`（只有 `Object.getOwnPropertySymbols()`/`Reflect.ownKeys()` 揭示它们），且 **`JSON.stringify` 完全跳过它们**。这使它们完美地做你不想漏进序列化或迭代的**库扩展点/元数据**。TypeScript 支持 **`unique symbol`** 类型，使一个特定符号常量能作为不同的类型级键。

**要点：**
- Symbol 键属性不出现在 `for...in` 或 `Object.keys`
- `JSON.stringify` 跳过 symbol key
- TypeScript 支持 unique-symbol 类型
- 用于库扩展点避免名字冲突

---

### 81. Proxy 与 Reflect

**频率：** 低

**题目：** `Proxy` 和 `Reflect` 是什么，它们如何驱动响应性？

**答案：** **`Proxy`** 包一个**目标对象**并经**陷阱**拦截它上的基本操作——以操作命名的处理函数：`get`（属性读）、`set`（写）、`has`（`in` 运算符）、`deleteProperty`、`apply`（函数调用）、`construct`（`new`）等。每当代码碰代理，对应陷阱代替默认行为运行，让你透明地观察、校验、变换或拦截操作——消费者分辨不出它不是普通对象。

这正是**现代响应性**所建之基。**Vue 3** 把你的状态包进 Proxy：**`get` 陷阱追踪**哪个 effect 在读哪个属性（依赖收集），**`set` 陷阱触发**依赖它的 effect 重跑。**MobX** 和各种校验/观察库同理工作。相比旧的 `Object.defineProperty` 方法（Vue 2），代理能拦截**属性增删和数组索引变化**而无需特殊处理。

**`Reflect`** 是伙伴：一个**镜像每个代理陷阱的静态方法**命名空间（`Reflect.get`、`Reflect.set`、`Reflect.has`、`Reflect.deleteProperty`、`Reflect.apply`…）。陷阱里你调匹配的 `Reflect` 方法来**以正确的默认语义把操作转发到目标**——关键是保持正确的 `receiver`，使原型链上的 getter/setter 正确绑定 `this`：
```js
const p = new Proxy(target, {
  get(t, key, receiver) {
    track(t, key);
    return Reflect.get(t, key, receiver); // 正确的默认行为
  }
});
```

注意：代理**不能拦截内部槽**——`Map` 的支撑数据、`Date` 的时间戳、私有 `#field` 之类活在陷阱永远看不到的内部槽里，所以代理这些内置对象会坏，除非特殊处理。**每操作有不轻的开销**，所以热路径避免代理。**`Proxy.revocable`** 创建一个你之后能**禁用**的代理（此后所有陷阱抛错）——适合发放可撤销的能力。总的来说，代理是**现代细粒度响应性的基础**。

**要点：**
- Proxy 不能拦截内部槽（Map 的数据、Date 的时间戳）
- 性能开销不轻；热路径避免
- 可通过 `Proxy.revocable` 可撤销
- 现代响应系统的基础

---

### 82. TS：声明合并

**频率：** 低

**题目：** TypeScript 里的声明合并是什么，你何时用模块增强？

**答案：** **声明合并**是 TypeScript 把**多个同名声明**合成一个定义。最常见的情况：作用域里两个 `interface Foo` 声明把成员合成一个接口——设计上是叠加的。`namespace` 也合并（彼此之间，以及与同名的类/函数/枚举合并以附加静态成员）。

实用的超能力是**模块增强**——用 `declare module 'foo'` 来**伸进第三方包的类型并给它们添加**而不 fork 它：
```ts
// 加一个自定义 Jest matcher
declare module 'expect' {
  interface Matchers<R> { toBeWithinRange(min: number, max: number): R; }
}
// 给 Express 的 Request 加字段
declare module 'express-serve-static-core' {
  interface Request { user?: { id: string }; }
}
```
因为库把那些声明为 `interface`，你的声明**合并**进它们，现在 `req.user` 到处都有类型。这就是你如何给 Jest 自定义 matcher 加类型、把认证数据附到 `Request`、注册模块联邦远程等。

**`declare global { }`** 对**全局作用域**做同样的事——如给 `Window` 加属性，或给主题加类型：`styled-components` 暴露一个**空的 `DefaultTheme` 接口**，*正是为了让你把你的主题形状合并进它*并到处得到有类型的 `props.theme`。

关键约束：**只有 `interface` 和 `namespace` 合并**——两个同名 `type` 别名是**重复标识符错误**（type 意在封闭）。所以库作者正是把扩展点暴露为 `interface` 以启用此。注意：增强是**全局/环境**的——跨不相关模块合并类型对读者困惑且意外，所以保持增强狭窄且有良好文档。

**要点：**
- 仅 `interface` 和 `namespace` 合并；`type` 别名冲突
- 通过 `declare global { }` 全局增强
- 对主题类型（`styled-components` 的 `DefaultTheme`）有用
- 避免跨不相关模块合并——读者困惑

---

### 83. TS：`as const` 与字面类型

**频率：** 低

**题目：** `as const` 做什么，它为什么有用？

**答案：** **`as const`** 是一个 **const 断言**，告诉 TypeScript 为一个值推断**最窄、最字面、深度 `readonly`** 的类型，而非它通常的**放宽**类型。没有它，对象属性里的 `const x = 'home'` 放宽到 `string` 且数组变可变的 `string[]`；有了它，一切被冻到精确字面。

具体它做三件事：
- **字面保持字面**：`'foo'` 类型为 `'foo'` 而非 `string`；`42` 是 `42` 而非 `number`。
- **数组变 `readonly` 元组**：`['/home', '/about'] as const` 是 `readonly ['/home', '/about']` 而非 `string[]`。
- **对象属性变 `readonly`** 且其值字面，递归地（嵌套形状也被锁）。

为什么重要：它让你**从值派生类型**，使你写一次数据就免费得到类型。经典模式是把数组变成**字符串字面并集**：
```ts
const ROUTES = ['/home', '/about', '/contact'] as const;
type Route = typeof ROUTES[number]; // '/home' | '/about' | '/contact'
```
现在 `ROUTES` 是运行时列表*和*类型的单一真相来源。这对 **Redux action creator**（使 `type` 是能判别的字面）、**路由/配置定义**、类枚举对象和任何喂推断的东西都必备。

它与 **`satisfies`**（TS 4.9+）完美配对：`satisfies` **对着类型校验**值而**不放宽**它，所以你两者兼得——校验*和*窄字面推断——`const cfg = {…} as const satisfies Config`。底线：当你想让一个值的*精确形状*流进类型系统而非被泛化掉时，就取用 `as const`。

**要点：**
- 与 `satisfies` 配对校验不放宽
- 从数组启用字符串字面并集
- 防 `'foo'` 放宽到 `string`
- 在对象字面上锁定嵌套形状

---

### 84. 错误子类、`cause`、异步堆栈

**频率：** 低

**题目：** 你如何良好地建模错误——子类化、`cause` 和异步堆栈？

**答案：** 现代 JS/TS 里好的错误处理靠几个实践：

**子类化 `Error`** 建领域特定类型，使调用者能用 `instanceof` 分支。关键是在构造器里**设 `this.name`**——否则类名在压缩后丢失、消息前缀停留在 `Error`：
```ts
class NotFoundError extends Error {
  constructor(public id: string) {
    super(`Missing ${id}`);
    this.name = 'NotFoundError';
  }
}
```
这让中间件干净地把 `NotFoundError` → HTTP 404 映射，而非字符串匹配消息。

**用 `cause` 保留链**（ES2022）：`new Error('Failed to load user', { cause: originalError })`。当你捕获低层错误并重抛高层错误时，`cause` **把原始的保持附着**，使根因不丢。这是标准的**包装重抛**模式——在每层加上下文而不丢真正坏掉的；logger 和 `console` 打印整条链。

**异步堆栈**：现代 V8 **跨 `await` 边界缝合堆栈**，所以在异步调用链深处抛的错误显示逻辑 `await` 路径，而非恰好运行它的那个微任务——比旧的“异步蹦床”噪声调试起来好得多。

**始终抛 `Error` 对象，绝不抛字符串/对象**：`throw 'oops'` 给你**无堆栈**，`catch` 收到一个裸字符串。`Error` 实例携带 `.stack`、`.message`、`.cause`，并与 `instanceof` 工作。

支撑细节：Node 里在自定义错误工厂中用 **`Error.captureStackTrace(this, MyError)`** 从堆栈裁掉构造器帧。**绝不用空 `catch {}` 吞错误**——至少 log 或重抛。且在 TS（4.4+ 默认 `useUnknownInCatchVariables`）里，**`catch` 变量类型为 `unknown`**，逼你在用前收窄（`if (e instanceof Error)`）——防止对抛了什么的不安全假设。

**要点：**
- 自定义错误工厂中用 `Error.captureStackTrace`（Node）
- `cause` 是标准包装重抛模式
- 别用空 `catch` 吞错误
- `catch` 子句中错误打类型为 `unknown`（TS 4.4+ 默认）

---

### 85. 水合不匹配

**频率：** 低

**题目：** 什么导致 React 水合不匹配，你如何修复它们？

**答案：** **水合**是 React 拿**服务器渲染的 HTML** 并在客户端**附上事件监听器/重建其内部树**、使静态标记可交互——*而不*重新创建 DOM——的过程。它假设**客户端的首次渲染产生与服务器完全相同的输出**。当它不同、React 发现 DOM 与预期不符时发生**不匹配**。

常见原因是渲染里任何**非确定或依赖环境**的东西：
- **随机值**——`Math.random()`、`Date.now()` 或随机生成的 ID 在服务器 vs 客户端产生不同输出。
- **区域/时区格式化**——服务器以一个区域/时区格式化日期/数字，浏览器以另一个。一个*非常*频繁的元凶。
- **仅浏览器条件**——渲染期间读 `window`、`localStorage`、`matchMedia` 或 user-agent，它们只在客户端存在。

**React 18** 处理不匹配的方式是**丢弃那个子树的服务器 HTML 并在客户端重新渲染它**（视觉上恢复），同时发一个**开发警告**。那种恢复不免费——它花一次重渲染且可能造成闪烁——所以不匹配应被修复而非忽略。

修法：
- **`useId()`**——生成**跨服务器和客户端稳定且相同**的 ID，解决随机 ID 情况（对 `aria-*`/label 关联必备）。
- **`suppressHydrationWarning`**——对一个*已知、不可避免*的分歧（如时间戳），在元素上设它以仅对该节点静默警告。
- **推迟仅浏览器内容**——先渲染服务器安全版本，然后在 **`useEffect`**（只在客户端、水合后运行）里更新，或经带正确服务器快照的 **`useSyncExternalStore`** 读外部/浏览器状态。这保证首次客户端渲染匹配服务器。

注意：**React 19** 改善诊断（更清晰的不匹配消息、更少静默损坏）。而**流式 SSR** 可能因渐进水合*掩盖*不匹配——所以**禁用 JS** 测试并盯着控制台以早抓它们。

**要点：**
- 渲染中 `Date.now()`/`Math.random()` 引起不匹配
- 本地/时区差异是常见元凶
- React 19 改善错误信息减少静默腐败
- 流式 SSR 可能掩盖问题——禁 JS 测试

---

### 86. Angular 变更检测（Zone.js、OnPush、signal）

**频率：** 低

**题目：** Angular 变更检测如何工作——Zone.js、OnPush 和 signal？

**答案：** Angular 的活是知道**何时**重新检查组件的模板绑定。它的故事有三个时代：

**Zone.js（经典默认）**——Angular 附带 **Zone.js**，它 **monkey-patch 所有异步 API**（`setTimeout`、`addEventListener`、`Promise.then`、XHR/`fetch`）。任何异步任务完成后，Zone 通知 Angular，Angular **对整个组件树跑变更检测**（自上而下），重新求值绑定以更新 DOM。它自动且“就是能用”，但在*每个*异步事件上检查*一切*在大应用里浪费。

**`OnPush` 策略**——设 `changeDetection: ChangeDetectionStrategy.OnPush` 告诉 Angular **跳过一个组件的子树，除非**其一：(1) 一个 **`@Input` 引用变化**（新对象身份——故偏好不可变更新），(2) 组件**内部触发一个事件**，或 (3) 其模板里一个 **`async` 管道**发射。这剪掉 CD 树的大片并在大应用里**显著改善性能**——标准优化。

**Signal（Angular 17+）**——`signal()`、`computed()` 和 `effect()` 是**细粒度响应原语**。在模板里读一个 signal 注册一个精确依赖，所以变化只更新**恰好用它的那些绑定**，完全绕过遍历树的 CD。Signal **不需要 Zone.js**，这就是为什么 Angular v18+ 提供 **`provideExperimentalZonelessChangeDetection`**——丢掉 Zone.js 缩小包体并移除 monkey-patch 开销。

额外事实：signal 用更简单、同步的响应状态**替代许多 `BehaviorSubject`/手动 CD 模式**；`computed()` 记忆化派生值；经 `ChangeDetectorRef.detach()` **游离**的组件**仅**在你显式调 `detectChanges()` 时跑 CD——极端性能调优（如高频数据网格）的逃生口。

**要点：**
- OnPush 大应用大幅改性能
- Signal（`signal()`、`computed()`、`effect()`）替代许多 `BehaviorSubject` 模式
- v18 中 `provideExperimentalZonelessChangeDetection`
- 游离组件仅通过 `ChangeDetectorRef.detectChanges()` 跑 CD

---

### 87. Angular DI 层级

**频率：** 低

**题目：** Angular 的依赖注入层级如何解析 provider？

**答案：** Angular DI 通过**向上遍历两棵 injector 树**解析依赖。当组件请求一个 token 时，Angular 搜索**元素 injector 树**——从那个组件自己的 injector 开始、爬过它的 DOM 祖先——若那里没找到，继续进**environment/module injector 树**（root 和任何懒加载作用域）。**第一个**找到的 provider 胜出，所以更低处声明的 provider **遮蔽**更高处的。

这个层级给你**作用域控制**：
- `@Injectable` 上的 **`providedIn: 'root'`** 注册一个**可摇树的应用单例**——一个实例到处共享，若从不注入则从包里**丢掉**（不像急切的 `NgModule.providers`）。
- **组件级 `providers: […]`** 每组件实例创建一个**新实例**，作用域到那个组件及其子——完美用于**作用域到特性的状态**（如每个向导实例得自己的向导本地服务）。
- **`inject()`**（v14+）是获取依赖的现代函数式方式——可用于字段初始化器、工厂函数、守卫和 `computed`——在许多上下文替代构造器注入并启用可组合的辅助函数。

Provider 配置选项控制值*如何*产生：**`useClass`**（实例化一个类，可能是替代品）、**`useValue`**（常量/配置对象）、**`useFactory`**（用 `deps` 计算它）、**`useExisting`**（把一个 token 别名到另一个）。**`multi: true`** 使同一 token 的多个 provider **收集成数组**而非覆盖——`HTTP_INTERCEPTORS`、validator 等背后的机制。

最后，注入点上的**解析修饰符**调搜索：**`@Optional`**（缺失时返回 `null` 而非抛错）、**`@Self`**（仅此 injector）、**`@SkipSelf`**（从父开始）、**`@Host`**（在宿主元素停止）。**独立组件**像基于 `NgModule` 的一样用自己的 injector 层级参与。

**要点：**
- `useClass`/`useFactory`/`useValue`/`useExisting` 配置 provider
- 多 provider（`multi: true`）收集值数组
- 独立组件有自己的 injector 层级
- `@Optional`、`@Self`、`@SkipSelf`、`@Host` 控制解析

---

### 88. RxJS：switchMap vs mergeMap vs concatMap vs exhaustMap

**频率：** 低

**题目：** RxJS 中 `switchMap`、`mergeMap`、`concatMap` 和 `exhaustMap` 有何不同？

**答案：** 四者都是**高阶映射操作符**：对源 Observable 的每个值它们创建一个**内部 Observable**（通常是 HTTP 请求）并把其发射**摊平**进输出。它们纯粹差在**当一个先前的内部 Observable 仍活跃时如何处理新的源值**——并发策略：

**`switchMap` —— 取消前一个。** 新值到达时，它**取消订阅在途的内部**并切到新的。只有最新的重要。完美用于**即输即搜**：用户不停打字时，陈旧请求被取消，使慢的较早响应不能覆盖较新的。这使它成为**用户输入触发的 HTTP 的正确默认**。

**`mergeMap` —— 全部并行跑。** 每个源值起一个内部 Observable，它们**全部并发跑**，解决时就发射（不保证顺序）。适合**独立操作**（如发 N 个日志调用）。危险：它可能以无界并发**淹没服务器**——用并发参数 `mergeMap(fn, n)` 封顶。

**`concatMap` —— 顺序排队。** 它等每个内部 Observable **完成才开始下一个**，**保留顺序**。当顺序/串行化重要时用（如不能交错的顺序写）。代价：**延迟**——一切一次一个地跑。

**`exhaustMap` —— 忙时忽略新的。** 一个内部 Observable 在途时，**新源值被丢弃**直到它完成。完美用于**提交按钮/登录**：快速双击被忽略，**防止重复提交**，直到当前请求结束。

助记：**switch** = 最新胜（取消旧）、**merge** = 一齐全上、**concat** = 一个接一个按序、**exhaust** = 第一个胜（忽略其余）。

**要点：**
- `switchMap` 是用户输入触发 HTTP 的对默认
- `mergeMap` 可淹服务器——用 `mergeMap(fn, n)` 限并发
- `concatMap` 以延迟换顺序
- `exhaustMap` 防重复提交

---

### 89. Angular standalone vs NgModule

**频率：** 低

**题目：** Angular 独立组件与 NgModule 如何比较？

**答案：** **独立组件**（v14+ 稳定，**v17+ 默认**）让组件经 `standalone: true` 和 `imports: […]` 数组**直接声明自己的依赖**——拉入它用的其他组件、指令、管道，加自己的 provider。它们**不再需要在 `NgModule` 里声明**，消除历史样板——每个组件都得注册到某模块的 `declarations` 里。

好处是**更简单的心智模型**（组件自包含——它需要的就在那里）、**更好的摇树**（编译器精确看到每个组件导入什么，所以未用代码比宽泛 `NgModule` 导入更可靠地被丢）、和**更快构建**。**NgModule 仍能用**——它们留着用于分组相关声明和与旧/库代码互操作——但它们不再是必需的组合单元。指导：**新应用应 100% 独立**，库正在积极迁移。

独立世界用**函数式配置**替代模块机制：
- **`bootstrapApplication(AppComponent, { providers: […] })`** 替代旧的基于 `NgModule` 的 `platformBrowserDynamic().bootstrapModule(AppModule)`——应用从单个根组件启动。
- **路由级懒加载**用 **`loadComponent: () => import('./page').then(m => m.Page)`** 直接懒加载一个*组件*（无需懒模块）；`loadChildren` 可指向一个路由数组。
- 特性用 **`provide*` 函数**连线——`provideRouter(routes)`、`provideHttpClient()`、`provideAnimations()`——传给 `bootstrapApplication`，替代 `RouterModule.forRoot()`、`HttpClientModule` 等。
- 现有应用可经**迁移 schematic** `ng generate @angular/core:standalone` 增量采用，它自动转换声明。

**要点：**
- `bootstrapApplication(AppComponent, { providers: [...] })` 替代 `NgModule` 引导
- 路由级懒加载：`loadComponent: () => import(...)`
- `provideRouter`、`provideHttpClient` 函数式配特性
- 迁移 schematic：`ng generate @angular/core:standalone`

---

### 90. Vue 组合式 vs 选项式 API

**频率：** 低

**题目：** Vue 的选项式 API vs 组合式 API——你何时用哪个？

**答案：** 它们是编写*同一个* Vue 3 组件的两种方式；区别在**你如何组织逻辑**。

**选项式 API** 把组件构造为一个**命名选项**对象——`data`、`methods`、`computed`、`watch` 和生命周期钩子（`mounted` 等）。Vue 把每个关注点收进它的桶。它**易学**且对小组件很平易，但有个扩展问题：**一个特性的逻辑散布**在多个选项间——搜索特性的状态在 `data`、其处理器在 `methods`、其派生值在 `computed`、其清理在 `unmounted`。在大组件里你来回滚动才能跟上单个特性。

**组合式 API**（`setup()`，或人体工学的 **`<script setup>`**）改为让你**按逻辑关注分组代码**。一个特性的所有响应状态、computed、watcher 和生命周期逻辑坐在**一起**，你能**把它抽成一个 composable**——一个可复用的 `useSomething()` 函数——跨组件共享。这对 **TypeScript**（普通变量和函数干净地推断，不像基于 `this` 的选项）和**大组件**好得多。Composable **替代 mixin**，避免 mixin 的命名冲突和来源不清问题，因为一切都是显式导入和返回。

两者都在 Vue 3 里发且**选项式 API 无弃用计划**——按团队/复杂度选——但**组合式 API 推荐给新代码**，尤其任何非平凡或 TS 重的。底层两者用同样的**响应原语**：**`ref`**（原语的响应包装，经 `.value` 访问）、**`reactive`**（对象用）、**`computed`**（缓存的派生状态）、**`watch`**（变化时副作用）。`<script setup>` 是推荐语法——更简洁（顶层绑定自动暴露给模板）且编译时更好优化。

**要点：**
- `<script setup>` 是人体工程语法
- Composable（`useFoo`）替代 mixin
- 选项式 API 仍工作，无弃用计划
- 响应原语（`ref`、`reactive`、`computed`、`watch`）是构件

---

### 91. Vue Proxy 响应

**频率：** 低

**题目：** Vue 3 基于 Proxy 的响应式如何工作，为什么解构会破坏它？

**答案：** Vue 3 通过把对象包进 **`Proxy`**（替代 Vue 2 的 `Object.defineProperty`）使状态响应。组件渲染期间，模板*读*的每个属性被**跟踪**（`get` 陷阱记录“这次渲染依赖此属性”）；被跟踪属性之后*被写*时（`set` 陷阱触发），Vue **重跑依赖它的渲染**。这个依赖跟踪 + 触发循环是整个引擎。

两个入口包不同的东西：
- **`reactive(obj)`** 返回一个**对象**的 Proxy——正常访问属性（`state.count`）。
- **`ref(value)`** 把一个**原语**（或对象）包进一个带 **`.value`** 属性的对象；你读写 `count.value`。`.value` 间接是必要的，因为裸原语不能被代理——没有对象可拦截。（模板里 ref 自动解包，所以你写 `count`。）

**`computed`** 创建一个**缓存的**派生值：它**只在其响应依赖变化时**重新求值，否则返回记忆化结果——反复读很便宜。

**为什么解构丢失响应**：响应活在 **Proxy 包装器**里，而非里面的值。`const { count } = reactive({ count: 0 })` 把原语**拷贝出**代理——`count` 现在是脱离的普通数字，与陷阱无连接，所以改它（或改源）什么都不触发。修法是 **`toRefs`/`toRef`**，它们把每个属性转成一个**保持链接**到原始响应对象的 **`ref`**：`const { count } = toRefs(state)` 给你一个可解构、可传递而保响应的真 ref。

更多事实：Vue 2 的 `Object.defineProperty` **检测不到新增属性或数组索引/长度变化**（故有旧的 `Vue.set` 变通）——v3 的 Proxy 方法**原生处理增删**。对大/深结构的性能，**`shallowRef`/`shallowReactive`** 只跟踪顶层（跳过深转换），**`readonly`** 产生一个不可变代理视图（写入警告并忽略）用于安全共享你不想被改的状态。

**要点：**
- `toRefs`/`toRef` 解构时保响应
- Vue 2 用 `Object.defineProperty`，漏了新属性——v3 修复
- `shallowRef`/`shallowReactive` 大对象求性能
- `readonly` 创建不可变视图

---

### 92. 表单库（react-hook-form vs Formik）

**频率：** 低

**题目：** react-hook-form vs Formik——你选哪个，为什么？

**答案：** 核心区别是**受控 vs 非受控输入**，它驱动它们的性能特征。

**Formik** 用**受控输入**——每次击键更新 React 状态，每个字符**重渲染表单**（且常是整棵表单树）。那是**简单、熟悉的心智模型**，对**小表单**完全没问题，但它不扩展：字段多的大表单变得明显卡顿，因为在一个字段打字重渲染一切。

**react-hook-form（RHF）**用**带 ref 的非受控输入**——它注册每个输入并经 ref 从 DOM 读值而非在 React 状态里镜像它们，所以**打字不重渲染**组件。这给出**优秀性能**（隔离的字段更新）、**更小的包**，且它只把组件订阅到它们用的具体字段/错误。它与**schema 校验**干净集成，是**复杂表单的现代默认**——多步向导、动态/重复字段和异步校验。

支撑生态点：
- 经 resolver 用 **Zod / Yup / Valibot** 做 **schema 校验**——定义一次形状，得到运行时校验和（用 Zod）为表单值推断的 TypeScript 类型。
- **`useFieldArray`** 高效处理**动态列表**（增删行）而不重渲染不受影响的行。
- 即便有客户端库，**服务器渲染的表单应保持渐进增强**——原生 `<form>` 提交和服务端校验，使表单在 JS 前/无 JS 时工作。
- **TanStack Form** 是崛起的**框架无关**替代（React/Vue/Solid/Svelte），有强类型安全，值得关注。

底线：**任何非平凡的用 RHF**（性能 + 校验 + 动态字段）；Formik 只在你维护一个已经在用它的现有代码库时用。

**要点：**
- Zod/Yup/Valibot 做 schema 校验
- 动态列表用 `useFieldArray`
- 服务器渲染表单仍受益于渐进增强
- TanStack Form 是新兴的框架无关替代

---

### 93. 微前端：模块联邦 vs iframe vs single-spa

**频率：** 低

**题目：** 请比较微前端方案：模块联邦、iframe 和 single-spa。

**答案：** 三者都让**独立构建/部署的应用**组合进一页；它们权衡**隔离 vs 集成质量 vs 团队自治**。

**模块联邦**（Webpack 5、Rspack、Vite 插件）让分开构建的应用**在运行时共享模块**——一个“host”动态加载“remote”包，它们**共享依赖**（一份 React）并作为**原生组件**组合，无 iframe 边界。这给出**最佳 UX 和集成**（共享路由、共享状态、一个 DOM）和真正的团队自治（每队独立构建/部署其 remote）。代价是**小心对齐共享依赖版本**——remote 间不匹配的 React 版本引起微妙运行时崩坏——所以你必须刻意管理共享单例配置。**Angular 的 Native Federation** 是同一想法的框架风味版。

**iframe** 给**最强隔离**——每个应用一个完全分开的 JS 上下文和 CSS 沙箱，所以一队真的不能破坏另一队的样式或全局。但 **UX 差**：跨帧的**auth/cookie 共享**、**导航/深链接**、**高度自动调整**和通信（postMessage）都别扭。最好留给**遗留或不受信第三方**集成——硬隔离是实际需求处。

**single-spa** 是一个**编排器**：它注册多个应用——可能在**不同框架**（一页上 React + Angular + Vue）——并经契约管理它们的**生命周期**（bootstrap/mount/unmount），随路由变化挂载/卸载它们。当你必须在框架间**增量迁移**或运行混合框架资产时很好。

把决策框为**团队自治 vs UX 一致性**：更多独立通常以集成打磨为代价并增加运营复杂度。诚实的告诫——**微前端是笔大税**；对许多团队，**带单一部署的 monorepo** 交付大部分自治（分开文件夹/所有权、共享工具）**而无**运行时集成和版本痛。只在跨团队独立部署节奏是硬需求时才取用 MFE。

**要点：**
- 联邦需要小心对齐共享依赖版本
- iframe 适合遗留/第三方集成
- Native Federation（Angular）是 Angular 风味
- 单仓库单部署常胜 MFE 复杂

---

### 94. CSP 推出

**频率：** 低

**题目：** 你如何安全地推出内容安全策略（CSP）？

**答案：** **CSP** 是一个 HTTP 头，**把浏览器可为每种资源类型加载来源的源加白名单**——`script-src`、`style-src`、`img-src`、`connect-src` 等——使 XSS 注入的/内联脚本**被阻止执行**。它是强的第二道防线，但严格策略若盲目部署会**破坏合法资源**，所以你分阶段推出。

**阶段 1——仅报告。** 先发 **`Content-Security-Policy-Report-Only`**。这**不强制任何东西**但**记录每个违规**（经接收描述被阻资源的 JSON 的 `report-uri`/`report-to` 端点）。你从生产流量收集真实世界违规、发现每个你忘掉的合法来源、并调策略**而不破坏用户**。

**阶段 2——收紧，再强制。** 一旦仅报告干净，切到强制的 `Content-Security-Policy` 头并迭代移除危险逃生口：
- 为脚本去掉 **`'unsafe-inline'`**——改为经**每请求 nonce**（`script-src 'nonce-<random>'` 配匹配的 `nonce` 属性，每次响应重生成）或脚本内容的**哈希**允许特定内联脚本。
- 去掉 **`'unsafe-eval'`**——禁 `eval`/`new Function`（某些旧库需重构）。
- 加 **`'strict-dynamic'`**，使一个受信（带 nonce）脚本能加载它自己的进一步脚本而无需你给每个 CDN 加白名单——避免脆弱主机列表的 **SPA 友好**现代方法。

难点是内联脚本：它们需要那个**每请求 nonce** 穿过你的服务端渲染连线，使每个响应的头和内联 `<script nonce>` 匹配。

值得设的相关指令：**`frame-ancestors`** 控制谁可框住你的页——它**替代较老的 `X-Frame-Options`** 做点击劫持保护且更灵活。**`upgrade-insecure-requests`** 自动**把 `http://` 子资源 URL 重写为 `https://`**，缓解 HTTPS 迁移而无需搜出每个混合内容引用。

**要点：**
- 内联脚本每请求需 nonce
- 报告端点接收违规 JSON
- `frame-ancestors` 替代 `X-Frame-Options`
- `upgrade-insecure-requests` 把 HTTP 重写为 HTTPS

---

### 95. 生产中的 source map

**频率：** 低

**题目：** 你应如何处理生产中的 source map？

**答案：** **source map**（`.map` 文件）记录**压缩/打包代码如何映射回你的原始源**——文件、行、列。没有它，生产错误的堆栈指向 `main.a1b2.js:1:48213`，毫无用处；**有了**它，你的错误追踪器（Sentry、Datadog、Bugsnag）和浏览器 devtools 显示**真实文件/函数/行**。所以你几乎总想在生产构建里**生成** source map——问题是谁能*看到*它们。

安全顾虑：公开提供的 source map 实际上**发布你的原始、未压缩源**（有时还有你宁愿不暴露的注释/逻辑）。最佳实践是**生成它们但不公开暴露**：
- CI/部署期间**把 map 上传到你的错误追踪服务**（Sentry CLI、Datadog），使符号化在服务端发生，然后要么**根本不把 `.map` 文件部署到 web 服务器**，要么**在认证/IP 白名单后**提供它们（如仅办公室 VPN）。
- 用 Webpack 的 **`hidden-source-map`**：它**产生 map 但省去 `//# sourceMappingURL=` 注释**，所以浏览器（和公众）**不会自动取**它们，而你上传的副本仍让错误追踪器符号化。或者 `sourceMappingURL` 可指向只有你的工具能到的**私有主机**。

运营细节：**让 map 随每次部署版本化**——一个 map 只符号化它来自的那个确切构建，所以按发布/提交存它们。并知道 devtool 权衡：**`eval-source-map` 仅开发**（快速重建、经 `eval` 内联、不适合/不安全用于生产），而**生产用外部 `.map` 文件**（`source-map` 或 `hidden-source-map`）以获得准确、可分离的 map。

**要点：**
- 没 source map，堆栈不可读
- `sourceMappingURL` 可指向私有主机
- map 与部署一起版本化
- `eval-source-map` 仅开发；生产用外部 `.map` 文件

---

### 96. 单仓库（Nx、Turborepo）vs 多仓库

**频率：** 低

**题目：** 单仓库（Nx、Turborepo）vs 多仓库——你如何选择？

**答案：** **monorepo** 把**许多包/应用放在一个仓库**里；**polyrepo** 给每个**自己的仓库**。权衡是**跨包人体工学 vs 隔离**。

**Monorepo** 优势：**原子的跨包变更**（一个 commit/PR 更新一个共享库*和*每个消费者，所以你从无坏掉的中间状态或版本升级舞蹈）、**简化重构**（跨整个代码库查找替换，类型端到端检查）、和**共享工具/配置**（一个 ESLint/TS/CI 设置）。代价是规模——朴素设置在每次变更重建/测试一切。

那正是工具解决的：
- **Nx**——一个完整构建系统：一个**项目图**（理解包依赖）、**任务编排**（只构建/测试变更实际影响的——“affected”命令）、**代码生成器/脚手架**和强制的模块边界。最适合**大型、结构化**的 monorepo。
- **Turborepo**——更轻，聚焦**快流水线**：跨包的**任务缓存**和**并行**、最小配置。当你主要想要速度而不要 Nx 的完整框架时很好。
- **pnpm workspace**——**轻量起点**（依赖提升 + 链接），你可以之后在上面叠 Turborepo/Nx。

Nx 和 Turborepo 的**杀手特性**是**远程缓存**（**Nx Cloud**、**Turborepo Remote Cache**）：构建/测试输出被缓存并**跨 CI 运行和队友共享**，所以若有人已用相同输入构建了一个包，其他人都**即时恢复结果**而非重建。这就是保持大 monorepo CI 快的东西。

**Polyrepo** 优势：**严格隔离**和每队**独立部署节奏/版本化**——但横切变更现在跨许多仓库和版本升级，很痛。要扩展 monorepo，用 **CODEOWNERS** 和**每包/affected CI**；在极大规模（Google/Meta），团队取用 **Bazel/Pants**。而 **polyrepo + Changesets** 是独立发布到 npm 的 **OSS 包族**的自然契合。经验法则：**一个产品/组织、紧耦合的包用 monorepo；当独立性胜过协调成本时用 polyrepo。**

**要点：**
- 远程缓存（Nx Cloud、Turborepo Remote Cache）是杀手特性
- 用 code owner 和每包 CI 求规模
- 极大规模用 Bazel/Pants（Google/Meta 风格）
- 多仓库加 changeset 对 OSS 包族适用

---

### 97. 模拟（MSW、fetch-mock、DI）

**频率：** 低

**题目：** 请比较模拟方式：MSW、fetch-mock 和依赖注入。

**答案：** 它们在**不同层**拦截，这决定你的测试多真实、多耦合。

**MSW（Mock Service Worker）**在**网络层**拦截：浏览器里它注册一个**Service Worker** 捕获出站请求；Node 里它安装一个**请求拦截器**。你的应用代码发**完全真实的 `fetch`/XHR 调用**——应用里没东西被桩——MSW 根据你定义的**请求处理器**用 mock 数据响应。这是现代宠儿，因为你**完全按生产运行的样子**测应用（真实请求代码路径），且**同样的处理器在开发、测试和 Storybook 里都工作**。它的力量是真实性和复用。

**fetch-mock** **直接打 `fetch` 函数补丁**——用返回预设响应的桩替换全局。它对小情况**设置更简单**，但它**把测试与传输耦合**：若你从 `fetch` 切到 Axios 或 GraphQL 客户端，即便行为没变 mock 也坏。你是在 mock *机制*而非*网络*。

**依赖注入**在你架构的一个**接缝**处替换真实现——把假的 `UserService`/仓库传入被测代码。它**最可测且最显式**（无全局补丁、清晰契约）且完全不关心传输，但它**要求代码为它设计**（接口、注入的依赖）——你不能把它加装到自己 new 出依赖的代码上。

跨三者适用的最佳实践：**单元和 E2E 用同一组处理器**（MSW 使这容易）以**减少**测试层间的**漂移**；**别 mock 你不拥有的**——把第三方 SDK 包进你自己的适配器并 mock *那个*（使库 API 变化在一处浮现，而非散落的 mock）；**快照/验证契约，而非 mock**——断言你依赖的真实请求/响应形状而非重断言你自己的桩。典型现代选择：**MSW** 作默认、**DI** 用于纯逻辑接缝、**fetch-mock** 只用于快速一次性情况。

**要点：**
- MSW 在开发、测试和 Storybook 中同样工作
- 单元和 E2E 同一组 handler 减漂移
- 别模拟你不拥有的——先包再模拟
- 快照测契约，不测模拟

---

### 98. 视觉回归（Percy/Chromatic）

**频率：** 低

**题目：** 视觉回归测试如何工作，你如何保持它稳定？

**答案：** 视觉回归测试**渲染组件或页面、捕获截图、并逐像素对着批准的基线图做 diff**。若像素不同，它标记该变化供评审——抓**非故意的视觉崩坏**（一个移动无关布局的 CSS 变化、坏字体、错位按钮），这些是只检查行为的功能测试完全会漏的。

主要工具：
- **Chromatic**——由 Storybook 团队构建；它**快照每个 Storybook story**，给出自动的**每组件**视觉覆盖和一个云评审 UI。
- **Percy**——**框架无关**，与许多 E2E runner 集成；快照整页/流程。
- **Playwright**——有**内置截图 diff**（`toHaveScreenshot`），是无外部服务的自托管选项。

核心挑战是**不稳定**——来自**非确定渲染**的假 diff：web **字体**在不同时间加载、**动画/过渡**被捕获在半帧、**日期/时间戳**、随机数据、甚至跨 OS 的抗锯齿差异。你通过**桩掉/冻结**这些来稳定：禁动画（`prefers-reduced-motion`/CSS 覆盖）、**冻时间**并**种子随机**、等字体加载、遮盖动态区域。确定性输入是使 diff 有意义的东西。

实用指导：**配 Storybook**，使每个组件的状态被隔离捕获（快、聚焦的基线）。记住**跨浏览器快照倍增基线计数**（Chrome + Firefox + WebKit + 移动 = 4 倍要存和评审的图），所以界定你快照哪些浏览器。而**带人工批准的评审 UI 必备**——工具只能说“这些像素变了”，不能说变化是否*故意*；一个人必须批准每个 diff 才把它提升为新基线。把视觉测试当**批准工作流**，而非通过/失败关卡。

**要点：**
- 配 Storybook 做每组件覆盖
- 跨浏览器快照倍增基线计数
- 评审者 UI 必备——diff 需人批准
- 用确定性测试数据（冻时间、种子随机）

---

### 99. 特性开关——客户端 vs 服务端评估

**频率：** 低

**题目：** 客户端 vs 服务端特性开关评估——权衡是什么？

**答案：** 一个特性开关需要被**评估**——把用户 + 上下文解析成一个变体（开/关、A/B/C）。评估*在哪*发生有真实后果。

**客户端评估**把**开关配置和规则发到浏览器**，客户端 SDK 本地决定变体。它**灵活**——即时切换、易于 **A/B 测试**和纯客户端 UI 实验——但有两个缺点：它**暴露开关名和规则**（任何人能打开 devtools 看到 `new-checkout-enabled`，包括未发布的特性），且它**加包重**加上加载后开关解析时可能的**闪烁**。对**敏感推出**不好且可能伤 SEO（内容在 JS 跑后才决定）。

**服务端评估**把**开关逻辑私有留在服务器**并只把**已解析的变体**发给客户端（或直接渲染选中的变体）。这对**敏感/渐进推出**（竞争对手/用户看不到将来什么）、对 **SEO**（服务器渲染最终 HTML）更好，且避免客户端开关解析闪烁。权衡是改一个开关可能需要新请求/渲染而非实时客户端切换。

常见的**混合**：**服务器在首请求解析开关**（使初始渲染正确无闪烁）并用那些值**水合一个客户端 SDK**，为后续交互启用**实时客户端切换**——两全其美。

支撑实践：成熟厂商——**LaunchDarkly、Statsig、Unleash、Flagsmith**——处理定向、推出百分比和分析。**把开关读取包进类型化包装器**（单个 `flags.newCheckout` 访问器），使开关键被类型检查且集中而非到处字符串化。**粘性分桶**（用户一致地看到同一变体）**需要稳定用户身份**——哈希一个用户 ID，而非每会话随机。而关键地，**推出完成后清理开关**——陈旧开关及其死分支累积成**技术债**；把开关移除当作完成特性的一部分。

**要点：**
- LaunchDarkly、Statsig、Unleash、Flagsmith 是常见供应商
- 把开关读包在类型化包装中求安全
- 粘性分桶需要用户身份
- 推出后清开关——技术债积累

---

### 100. 遥测：错误追踪 vs RUM vs APM

**频率：** 低

**题目：** 请比较三类前端遥测：错误追踪（Sentry、Rollbar）如何带堆栈和面包屑捕获异常，RUM（真实用户监控）如何收集每个真实用户的现场性能（Core Web Vitals、导航时序、自定义事件），APM（Datadog、New Relic）如何把前端与后端追踪绑成端到端延迟，并说明它们如何互补。

**题目：** 错误追踪 vs RUM vs APM——这些遥测类别有何不同？

**答案：** 它们回答关于生产的三个不同问题且**互补**——成熟的可观测性三者都用。

**错误追踪**（Sentry、Rollbar、Bugsnag）回答**“什么坏了？”** 它带**堆栈**、**面包屑**（导致错误的用户操作/网络调用轨迹）、设备/浏览器上下文捕获**未处理的异常和 rejection**，并把重复分组成 issue 带告警。这是你抓和分诊用户遇到的 bug 的第一道防线。

**RUM（真实用户监控）**回答**“真实用户*感觉*如何？”** 它从实际会话收**现场性能数据**——**Core Web Vitals**（LCP/INP/CLS）、导航/资源时序、和**自定义事件/时序**——按设备、地理、连接和页面分段。不像实验室工具（Lighthouse），这是跨你整个受众的**真实世界数据**，揭示比如某地区移动用户 LCP 很糟。

**APM（应用性能监控）**（Datadog、New Relic、Dynatrace）回答**“延迟在栈的哪里？”** 它把**前端操作绑到后端请求链**，产出**端到端追踪**——一个慢页经 API 网关、服务和数据库查询映射——使你能找到*哪一跳*慢，而非只知页慢。

横切实践：
- **高流量站重采样**——从数百万会话发每个事件成本高且吵；捕获有代表性的一部分（常 100% 错误但一部分追踪/RUM）。
- **Source map 对可读堆栈必备**——没它错误追踪指向压缩代码（如 source-map 题所述，私有上传）。
- **用 OpenTelemetry 做分布式追踪**——从浏览器经每个服务（经 header）传一个 **trace ID**，使前后端遥测**缝成一条追踪**；OTel 是厂商中立标准。
- **数据离客户端前清洗 PII**——在 SDK 的 `beforeSend`/钩子里剥掉 email、token、表单值和敏感 URL 参数，使你从不把个人数据发给第三方监控厂商（隐私 + 合规）。

**要点：**
- 高流量站重采样
- Source map 对可读堆栈必备
- 分布式追踪（OpenTelemetry）跨服务传 trace ID
- 数据离客户端前必须 PII 清洗
