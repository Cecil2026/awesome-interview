# Frontend Interview Questions

100 high-frequency frontend questions covering HTML/CSS, JavaScript/TypeScript, frameworks (React/Angular/Vue), performance, testing, accessibility, networking, and build tooling.

---

### 1. Box model & `box-sizing: border-box`

**Frequency:** High

**Question:** Walk me through the CSS box model, and how does `box-sizing: border-box` change sizing?

**Solution:**

1. **Four nested boxes**: The CSS box model wraps every element in four nested boxes: **content** (the text/image), **padding** (space inside the border), **border**, and **margin** (space outside, separating it from neighbors). Every element is a rectangle composed of these layers, and understanding which layer a given property targets is the key to predictable layout.
2. **Default `content-box`**: Makes `width`/`height` apply **only to the content area**, so padding and border are *added on top*. A `width: 200px; padding: 20px; border: 5px` element actually renders **250px** wide (200 + 20×2 + 5×2) — a constant source of "why is my box too big?" bugs.
3. **`border-box` behavior**: Instead makes `width`/`height` *include* padding and border, so that same element renders exactly **200px** and the content area shrinks to absorb the padding/border. This is far more predictable, especially in **grid/flex layouts** where you set percentage or `flex-basis` widths and don't want padding blowing out the track.
4. **Global reset**: That's why nearly every modern reset applies it globally:
```css
*, *::before, *::after { box-sizing: border-box; }
```
5. **Two gotchas**: **Margins are outside the box** and don't count toward `width`, and **adjacent vertical margins collapse** (a 20px bottom margin next to a 30px top margin yields 30px total, not 50px).
6. **Inheritance & debugging**: `box-sizing` is **not inherited by default** — the universal-selector reset is what propagates it — and DevTools' computed-styles **box diagram** is the fastest way to see exactly where a stray pixel is coming from.

**Evolution:**

1. **Spec default to practical default**: `content-box` is the spec default, but the industry converged on `border-box` as the practical default via universal-selector resets once percentage-based and component layouts became common.
2. **Layout engines raise the stakes**: As grid/flex replaced float layouts, predictable sizing (`border-box`) became essential because padding on percentage/`flex-basis` tracks would otherwise overflow.
3. **Design-system tokens**: Modern systems standardize spacing tokens and rely on `border-box` so component padding never changes an element's declared width.

**Follow-ups:**

1. **Margin collapsing edge cases**: When does vertical margin collapsing *not* happen (e.g. flex/grid items, elements with padding/border between them, BFC roots)?
2. **Per-component override**: Is it safe to set `border-box` globally, or do third-party widgets expecting `content-box` break?
3. **Debugging a stray pixel**: How would you find an element 1px too wide inside a flex row — what DevTools panel and which layer do you inspect first?

**Key points:**

1. **Practical default**: `content-box` is the spec default; `border-box` is the practical default.
2. **Margins external & collapsing**: Margins are outside the box and collapse vertically between block elements.
3. **Explicit inheritance only**: `box-sizing` is inherited only when explicitly declared with `inherit`.
4. **DevTools diagram**: Use DevTools' computed-styles box diagram to debug sizing surprises.

---

### 2. Block vs inline vs inline-block

**Frequency:** High

**Question:** Compare `block`, `inline`, and `inline-block` display types.

**Solution:**

1. **Three distinguishing axes**: These three `display` values differ along three axes: **whether they start on a new line**, **whether they take full width**, and **whether they honor `width`/`height`/vertical margins**.
2. **`block`**: (`div`, `p`, `section`, `h1`) — starts on a **new line**, stretches to the **full available width** of its container, and **fully honors** `width`, `height`, and all four margins/paddings. This is the workhorse for structural layout.
3. **`inline`**: (`span`, `a`, `em`, `strong`) — **flows within text** on the same line, is only as wide as its content, and **ignores `width`/`height` and vertical margins**. Horizontal padding/margin apply visually but don't push sibling lines apart. Because inline boxes sit on the text baseline, they respect **`line-height`**, and the whitespace between inline tags in your HTML **renders as a real space gap** (the classic "mysterious 4px gap" between inline-blocks).
4. **`inline-block`**: The hybrid: it **sits inline** next to surrounding text but **accepts box dimensions** (`width`, `height`, vertical margins). Before flexbox, this was the go-to for horizontal button rows, chips, and nav items.
5. **Replaced inline elements**: **Replaced inline elements** like `<img>`, `<input>`, and `<video>` accept `width`/`height` *despite* being inline, because they wrap external content with intrinsic dimensions.
6. **Flex/grid override**: When a parent becomes `display: flex` or `grid`, its children stop obeying their own block/inline nature and become **flex/grid items** instead. In modern code you'd reach for **flex or grid** rather than inline-block hacks — they give you gap control, alignment, and no whitespace-gap surprises.

**Evolution:**

1. **From inline-block to flex**: Before flexbox, inline-block was the standard way to lay out horizontal rows; modern layouts prefer flex/grid which eliminate whitespace gaps and add `gap`/alignment control.
2. **Whitespace-gap workarounds retired**: Old tricks (negative margins, zeroing `font-size` on the parent) to kill the 4px inline-block gap are no longer needed once you switch to flex.
3. **Context-driven display**: Parents opting into `flex`/`grid` reparent children's layout behavior, shifting the design unit from the element's intrinsic display type to the container's layout mode.

**Follow-ups:**

1. **Kill the 4px gap**: What are the ways to remove the whitespace gap between inline-block elements, and why does each work?
2. **Vertical alignment**: How does `vertical-align` interact with inline/inline-block, and when do you need it?
3. **When inline-block still wins**: Are there cases where inline-block is still preferable to flex (e.g. text flow with wrappable badges)?

**Key points:**

1. **Line-height & gaps**: Inline elements respect `line-height` and create whitespace gaps between tags.
2. **Parent flex/grid**: `display: flex/grid` on a parent makes children behave like block-level participants.
3. **Replaced elements**: Replaced inline elements (`img`, `input`) accept width/height despite being inline.
4. **Prefer flex/grid**: Modern layouts prefer flex/grid over inline-block tricks.

---

### 3. Flexbox axes & flex-grow/shrink/basis

**Frequency:** High

**Question:** How do flexbox axes work, and what do `flex-grow`/`shrink`/`basis` actually control?

**Solution:**

1. **Two axes**: A flex container defines two axes: the **main axis** (horizontal when `flex-direction: row`, the default) and the perpendicular **cross axis**.
2. **Alignment mapping**: Alignment properties map onto these axes — **`justify-content`** distributes items along the **main** axis (start/center/space-between/etc.), while **`align-items`** (on the container) and **`align-self`** (per item) align along the **cross** axis. Mixing them up is the #1 flex confusion; the trick is to remember `justify` follows the direction items flow.
3. **The `flex` shorthand**: `flex: <grow> <shrink> <basis>` governs how free space is distributed:
   - **`flex-grow`** — a unitless weight for dividing **leftover space**. If three items are `grow: 1` they split extra space equally; a `grow: 2` item gets twice the share.
   - **`flex-shrink`** — a weight for absorbing **overflow** when items don't fit. `shrink: 0` means "never shrink me below my basis."
   - **`flex-basis`** — the **hypothetical starting size** before grow/shrink runs (like `width` but along the main axis). `auto` uses the item's content/`width`.
4. **Common shorthands**: **`flex: 1`** expands to `1 1 0%` — grow and shrink freely from a zero basis, giving equal-width columns. **`flex: auto`** is `1 1 auto` (grow from content size), and **`flex: none`** is `0 0 auto` (rigid).
5. **Direction & wrapping**: **`flex-direction: row-reverse`/`column`** swaps the main axis (and thus what `justify`/`align` mean); **`flex-wrap: wrap`** lets items break onto multiple lines, at which point **`align-content`** controls spacing *between* the lines; **`gap`** now works in flex containers, replacing old negative-margin hacks.
6. **The `min-width: 0` fix**: Setting **`min-width: 0`** on a flex child is the fix for the notorious bug where long text or a wide child refuses to shrink (flex items default to `min-width: auto`, which won't go below content size).

**Evolution:**

1. **From floats to flex**: Flexbox replaced float/clearfix and inline-block layouts for one-dimensional rows and columns, giving declarative alignment and distribution.
2. **`gap` adoption**: Native `gap` in flex containers (modern browsers) retired the negative-margin spacing hacks that were standard before.
3. **Flex vs grid division of labor**: As grid matured, teams reserve flex for one-dimensional content-driven layouts and grid for two-dimensional structured layouts.

**Follow-ups:**

1. **Flex vs grid**: When do you choose flexbox over CSS grid for a given layout?
2. **Equal columns pitfalls**: Why do `flex: 1` columns sometimes become unequal (differing content/basis), and how do you force equal widths?
3. **Overflow debugging**: A long unbreakable string blows out a flex row — walk through diagnosing and fixing it with `min-width: 0`/`overflow`.

**Key points:**

1. **Direction swaps axis**: `flex-direction: row-reverse/column` swaps the main axis.
2. **Wrap & align-content**: `flex-wrap: wrap` lets rows break; combine with `align-content` for multi-line cross alignment.
3. **Native gap**: `gap` works in flex (modern browsers) and avoids negative-margin hacks.
4. **min-width: 0**: `min-width: 0` on flex children prevents text-overflow from blowing out the layout.

---

### 4. Positioning: static/relative/absolute/fixed/sticky

**Frequency:** High

**Question:** Compare the five CSS `position` values and their common gotchas.

**Solution:**

1. **What `position` controls**: The `position` property controls how an element is placed and what `top`/`right`/`bottom`/`left` (the "inset" offsets) do.
2. **`static`**: The default. The element sits in normal flow and **ignores the inset properties** entirely.
3. **`relative`**: Stays in flow (**its original space is preserved**) but you can **visually shift** it with insets. Crucially, it establishes a **positioning context**: absolutely-positioned descendants now anchor to it.
4. **`absolute`**: **Removed from normal flow** (siblings close up as if it's gone) and positioned against the **nearest positioned ancestor** (the nearest ancestor with a non-`static` position), falling back to the initial containing block. Without an explicit width it **collapses to its content width**.
5. **`fixed` & `sticky`**: **`fixed`** — removed from flow and positioned relative to the **viewport**, so it stays put during scroll (sticky headers, chat widgets). **`sticky`** — a hybrid that behaves as `relative` **until** a scroll threshold (defined by an inset like `top: 0`) is crossed, then "sticks" like `fixed` within its scroll container.
6. **The gotchas**: A **`transform`, `filter`, or `will-change` on an ancestor** creates a new containing block, which **traps `fixed` elements** inside it (they scroll away instead of staying fixed) — a very common "why won't my modal stay fixed?" bug. **`sticky` silently does nothing** unless it has a **scrollable ancestor** and a **defined offset**; a parent with `overflow: hidden` also breaks it. And any positioned element with a **`z-index`** creates a **stacking context**, which can unexpectedly isolate its children's z-ordering from the rest of the page.

**Evolution:**

1. **`sticky` as a native primitive**: `position: sticky` replaced JavaScript scroll-listener hacks for sticky headers/table columns.
2. **Containing-block awareness**: As `transform`/`filter`/`will-change` became common for animation performance, developers had to learn that these create containing blocks that trap `fixed` descendants.
3. **Stacking-context discipline**: Growing use of `z-index` and `isolation: isolate` pushed teams toward explicit stacking-context management rather than ever-escalating z-index values.

**Follow-ups:**

1. **Modal stays fixed**: A modal breaks out of a transformed ancestor — how do you restructure the DOM or styles so `fixed` works?
2. **Sticky not sticking**: Given a non-working `sticky` element, list the checklist of required conditions.
3. **z-index wars**: How does establishing stacking contexts cause "my element won't go on top despite z-index: 9999", and how do you fix it?

**Key points:**

1. **Containing-block traps**: A `transform`, `filter`, or `will-change` ancestor traps `fixed` elements.
2. **Sticky requirements**: `sticky` requires a scrollable ancestor and a defined `top`/`bottom`.
3. **Absolute sizing**: Absolute elements collapse to content width unless sized.
4. **Stacking contexts**: Positioned elements with `z-index` create stacking contexts.

---

### 5. Specificity rules & `!important`

**Frequency:** High

**Question:** How is CSS specificity calculated, and how do `!important` and `@layer` fit in?

**Solution:**

1. **Four-part tuple**: Specificity decides which competing rule wins, and it's computed as a **four-part tuple `(a, b, c, d)`**:
   - **a** — inline `style=""` attributes
   - **b** — **ID** selectors (`#header`)
   - **c** — **classes, attributes, and pseudo-classes** (`.btn`, `[type=text]`, `:hover`)
   - **d** — **elements and pseudo-elements** (`div`, `::before`)
2. **Comparison & tie-break**: Compare left-to-right: a rule with one ID `(0,1,0,0)` beats any number of classes `(0,0,5,0)`. When two rules have **identical specificity, the one declared later wins** (source order). Note the tuple **doesn't carry** — 11 classes are still `(0,0,11,0)`, not an ID.
3. **`!important` band**: **`!important`** escapes this ordering by jumping into a separate, higher-priority band. The full origin cascade, low to high, is: user-agent → user → **author normal** → author `!important` → user `!important` → user-agent `!important`. So an author `!important` overrides all normal author styles regardless of specificity — which is why `!important` wars escalate.
4. **`@layer` cascade layers**: **`@layer` (cascade layers)** is the modern fix: you declare named layers in a defined order (`@layer reset, base, components, utilities;`) and **later layers beat earlier ones regardless of specificity**. This lets you organize styles by role instead of fighting selector-specificity arms races, and it largely obsoletes `!important`.
5. **Zero-specificity & functional selectors**: The **universal selector `*` and `:where()`** contribute **zero** specificity (great for low-priority defaults), while **`:is()` and `:not()`** take the **highest specificity of their arguments**. Reserve `!important` for utility frameworks or overriding stubborn third-party styles.

**Evolution:**

1. **From `!important` wars to layers**: Teams historically escalated `!important` to override stubborn styles; `@layer` replaced that arms race with role-based ordering.
2. **Functional pseudo-classes**: `:where()` (zero specificity) and `:is()`/`:not()` gave authors fine control over specificity, enabling low-priority resets and defaults.
3. **Scoped styling**: CSS Modules, scoped attributes, and later `@scope` reduced reliance on raw specificity by isolating component styles.

**Follow-ups:**

1. **Override a third-party widget**: Its styles use `!important` — how do you win without adding more `!important`?
2. **Layer ordering design**: How would you structure cascade layers for a design system with reset/base/components/utilities and third-party CSS?
3. **:where() use case**: Give a concrete case where `:where()`'s zero specificity solves a real override problem.

**Key points:**

1. **Zero specificity**: The universal selector `*` and `:where()` contribute zero specificity.
2. **Functional selectors**: `:is()` and `:not()` take the highest specificity of their arguments.
3. **Prefer layers**: Prefer cascade layers over specificity arms-races.
4. **Limit `!important`**: Avoid `!important` outside utility frameworks or third-party overrides.

---

### 6. Responsive: media queries, `clamp()`, container queries

**Frequency:** High

**Question:** What tools drive responsive design — media queries, `clamp()`, and container queries?

**Solution:**

1. **Three complementary layers**: Responsive design has three complementary layers of tooling: media queries, `clamp()`, and container queries.
2. **Media queries**: Adapt styles to the **viewport or device features**. Beyond the classic `@media (min-width: 768px)`, they read user/environment preferences like `(prefers-color-scheme: dark)` for theming and `(prefers-reduced-motion: reduce)` for accessibility. The convention is **mobile-first**: write base styles for small screens, then layer enhancements with **`min-width`** queries (desktop-first uses `max-width` and tends to accumulate overrides). Example:
```css
.card { padding: 1rem; }
@media (min-width: 768px) { .card { padding: 2rem; } }
```
3. **`clamp(min, preferred, max)`**: Produces **fluid values without breakpoints** — it returns the `preferred` value but never below `min` or above `max`. Pairing it with viewport units gives smoothly scaling typography and spacing: `font-size: clamp(1rem, 2vw + 0.5rem, 1.5rem)` grows with the viewport but stays readable at both extremes, replacing a stack of media-query font overrides.
4. **Container queries (`@container`)**: The biggest recent advance: instead of responding to the *viewport*, a component responds to **its own container's size**, so the same card looks right in a wide main column or a narrow sidebar. You opt a parent in with **`container-type: inline-size`**, then query it:
```css
.sidebar { container-type: inline-size; }
@container (min-width: 400px) { .card { display: grid; } }
```
5. **Component-level responsiveness**: This enables **true component-level responsiveness** — reusable components that adapt to context rather than to the page. Always pair motion with `prefers-reduced-motion` to avoid triggering vestibular issues.

**Evolution:**

1. **Viewport to container**: Responsiveness shifted from page/viewport-centric media queries to component-centric container queries, matching modern component-based architecture.
2. **Breakpoints to fluid**: `clamp()` and viewport units replaced stacks of media-query font/spacing overrides with smooth fluid scaling.
3. **Preference-aware design**: Media queries grew to read user preferences (`prefers-color-scheme`, `prefers-reduced-motion`), making theming and accessibility first-class.

**Follow-ups:**

1. **Choosing the right tool**: When do you use a container query vs a media query for a given component?
2. **Fluid type safeguards**: How do you ensure `clamp()`-based typography remains accessible when users zoom or set large default font sizes?
3. **Container query support**: What fallback strategy do you use for browsers lacking container-query support?

**Key points:**

1. **Mobile-first**: Mobile-first uses `min-width` queries; desktop-first uses `max-width`.
2. **Container setup**: Define a container with `container-type: inline-size`.
3. **clamp + units**: `clamp()` pairs well with viewport units: `clamp(1rem, 2vw, 1.5rem)`.
4. **Reduced motion**: Respect `prefers-reduced-motion` for accessibility.

---

### 7. Semantic HTML for SEO/a11y

**Frequency:** High

**Question:** Why does semantic HTML matter for SEO and accessibility?

**Solution:**

1. **What semantic HTML is**: Semantic HTML means using elements that **describe their meaning** — `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<footer>`, `<figure>`, `<time>` — rather than a soup of `<div>`s. That meaning is consumed by three audiences at once: browsers, assistive technology, and search crawlers.
2. **Accessibility landmarks**: For **accessibility**, these elements expose **landmarks** that screen-reader users navigate by — a user can jump directly to `main`, cycle through `nav` regions, or list all headings to understand page structure. A page built from `<div class="header">` gives them nothing to navigate.
3. **Heading hierarchy**: The **heading hierarchy** matters just as much: use **one `<h1>`** for the page's primary topic and **don't skip levels** (`h2` → `h4`), because screen readers build an outline from headings and skipped levels imply missing structure.
4. **SEO benefit**: For **SEO**, semantic markup gives crawlers a **richer document outline**, helping them identify the main content versus navigation/boilerplate and weight it appropriately. You then layer **microdata or JSON-LD structured data** on top to earn rich results (ratings, breadcrumbs, events).
5. **Real controls**: Use **`<button>` for actions and `<a href>` for navigation** (never a clickable `<div>`) — real controls come with keyboard focus, Enter/Space activation, and correct ARIA roles for free. **Avoid `<div role="button">`**; you'd have to reimplement focusability and keyboard handling that a native `<button>` gives you.
6. **Form labeling & ARIA**: **Label every form input** with `<label for>` (or a wrapping label) so its purpose is announced. Semantics is the foundation; ARIA only patches gaps where no native element fits.

**Evolution:**

1. **Div soup to semantics**: The HTML5 semantic elements replaced generic `<div class="header">`-style markup, giving native landmarks for free.
2. **Structured data layering**: SEO advanced from plain semantics to microdata/JSON-LD structured data to earn rich results.
3. **ARIA as a patch**: As the native element set grew, best practice shifted to "use the native element first, ARIA only to fill gaps" rather than ARIA-everywhere.

**Follow-ups:**

1. **When ARIA is needed**: Give an example where no native element fits and ARIA roles/attributes are genuinely required.
2. **Section vs article vs div**: How do you decide between `<section>`, `<article>`, and a plain `<div>`?
3. **Testing a11y**: What tools (screen reader, axe, Lighthouse) would you use to verify landmark and heading structure?

**Key points:**

1. **Buttons vs links**: Buttons for actions, links for navigation.
2. **Label inputs**: `<label for>` or wrapped labels for every form input.
3. **Real buttons**: Avoid `<div role="button">` — use real `<button>`.
4. **Structured data**: Microdata/JSON-LD adds structured data on top of semantics.

---

### 8. `var` vs `let` vs `const`; hoisting & TDZ

**Frequency:** High

**Question:** Compare `var`, `let`, and `const`, and explain hoisting and the Temporal Dead Zone.

**Solution:**

1. **Three dimensions**: The three differ along **scope, hoisting behavior, and reassignability**.
2. **`var`**: **Function-scoped** (it ignores block boundaries like `if`/`for`), is **hoisted** to the top of its function, and is **initialized to `undefined`** — so reading it before its assignment line gives `undefined` rather than an error. It also **creates a property on the global object** (`window`) at top level, which pollutes global scope.
3. **`let`/`const` & TDZ**: **`let`** and **`const`** are **block-scoped** and, although they're *also* hoisted, they are **not initialized**. From the top of the block until the declaration line they sit in the **Temporal Dead Zone (TDZ)** — touching them there throws a `ReferenceError`. This is deliberate: it catches use-before-declaration bugs that `var` silently hid. Neither creates a global-object property.
```js
console.log(a); // undefined  (var hoisted + initialized)
console.log(b); // ReferenceError (let in TDZ)
var a = 1; let b = 2;
```
4. **`const` semantics**: **`const`** additionally forbids **rebinding** the variable — but *not* mutation of what it points to. `const arr = []; arr.push(1)` is fine; `arr = []` throws. For genuine shallow immutability use **`Object.freeze`** (note it's shallow — nested objects stay mutable).
5. **Function hoisting**: **Function declarations are fully hoisted** (callable before their line), whereas **function expressions** assigned to a `var`/`let` are not.
6. **Rule of thumb**: The modern rule of thumb is **`const` by default, `let` only when you must reassign, and `var` never** in new code.

**Evolution:**

1. **ES6 block scoping**: `let`/`const` arrived with ES6 to fix `var`'s function-scoping and silent hoisting hazards, with TDZ turning use-before-declaration into an explicit error.
2. **Deep immutability patterns**: Because `Object.freeze` is shallow, teams moved to deep-freeze utilities or immutable libraries (Immer, Immutable.js) for genuinely immutable state.
3. **Lint-enforced defaults**: Linters now enforce `const`-by-default and ban `var`, standardizing the modern rule of thumb across codebases.

**Follow-ups:**

1. **Loop variable capture**: How does `let` vs `var` behave in a `for` loop with closures (ties into the classic loop bug)?
2. **Deep freeze**: How would you implement a recursive deep-freeze, and what are its costs?
3. **TDZ in practice**: Show a real bug the TDZ catches that `var` would have hidden.

**Key points:**

1. **Global properties**: `var` creates properties on the global object; `let`/`const` do not.
2. **Hoisting difference**: Function declarations are fully hoisted; function expressions are not.
3. **TDZ span**: TDZ exists from block start to declaration line.
4. **const is not immutable**: `const` arrays/objects can still be mutated — use `Object.freeze` for shallow immutability.

---

### 9. Closures + classic loop bug

**Frequency:** High

**Question:** What is a closure, and why does the classic `var` loop print `3 3 3`?

**Solution:**

1. **Definition**: A **closure** is a function bundled together with the **lexical environment** it was created in — it "remembers" and keeps access to the variables of its enclosing scope even after that outer function has returned. This is how inner functions read and mutate outer variables.
2. **The classic bug**:
```js
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i)); // 3 3 3
```
It prints `3 3 3` because **`var` is function-scoped**, so all three arrow callbacks **close over the same single `i`**. By the time the timers fire (after the loop finishes), that shared `i` has reached `3`. The callbacks don't capture the *value* at each iteration — they capture the *variable*.
3. **The `let` fix**:
```js
for (let i = 0; i < 3; i++) setTimeout(() => console.log(i)); // 0 1 2
```
**`let` creates a fresh `i` per iteration**, so each closure captures a distinct value.
4. **The IIFE fix**: The pre-ES6 equivalent was an **IIFE** that copied `i` into a parameter: `(j => setTimeout(() => console.log(j)))(i)`.
5. **Real-world patterns**: Closures power a lot of real patterns — the **module pattern** (private state via captured variables), **partial application/currying**, and **React hooks** (`useState`'s setter closes over the current render's state).
6. **The hazards**: The flip side is two hazards: **stale closures** in `useEffect`, where a missing dependency captures an old value and the effect sees outdated state, and **memory leaks**, where a long-lived closure keeps a large outer scope (DOM nodes, buffers) alive because it can't be garbage-collected. ES modules give explicit scoping that has largely replaced the closure-as-namespace idiom.

**Evolution:**

1. **IIFE to `let`**: The pre-ES6 IIFE workaround for per-iteration bindings was obsoleted by `let`'s fresh binding per loop iteration.
2. **Closures to ES modules**: The closure-as-namespace/module pattern was largely replaced by native ES modules with explicit scoping.
3. **Hooks era hazards**: React hooks made stale-closure bugs a daily concern, driving dependency-array linting (`exhaustive-deps`) and `useRef`/`useCallback` patterns.

**Follow-ups:**

1. **Fix a stale closure**: Given a `useEffect` reading an outdated value, how do you fix it (deps, ref, functional updater)?
2. **Memory leak diagnosis**: How would you detect and fix a closure retaining large DOM nodes?
3. **Private state today**: Would you use a closure or a class private field (`#x`) for encapsulation, and why?

**Key points:**

1. **Patterns powered**: Closures power module patterns, partial application, and React hooks.
2. **Stale closures**: Stale closures in `useEffect` are caused by missing deps.
3. **Memory leaks**: Closures retain references to outer scope.
4. **ES modules**: ES modules give explicit scoping that reduces closure-as-namespace patterns.

---

### 10. `this` binding rules

**Frequency:** High

**Question:** What are the rules that determine `this` in JavaScript, and why do arrow functions differ?

**Solution:**

1. **Determined at call time**: `this` is determined at **call time** (not where the function is defined), by four rules in **precedence order**.
2. **The four rules**:
   1. **`new` binding** — calling `new Fn()` creates a fresh object and binds `this` to it.
   2. **Explicit binding** — `fn.call(obj)`, `fn.apply(obj)`, or a `fn.bind(obj)` copy force `this = obj`.
   3. **Implicit/method binding** — `obj.fn()` binds `this` to `obj` (the object *left of the dot*). Losing the dot loses the binding: `const f = obj.fn; f()` no longer sees `obj`.
   4. **Default binding** — a plain `fn()` call falls back to the **global object** (`window`), or **`undefined` in strict mode / ES modules**, which is why strict mode helps catch accidental global writes.
3. **Arrow functions have no `this`**: They **lexically inherit** `this` from the enclosing scope at definition time, and none of the four rules above can change it (even `.call` won't).
4. **Why arrows suit callbacks**: That's exactly what makes them ideal for **callbacks** — an arrow passed to `setTimeout` or `.map` keeps the surrounding method's `this` instead of getting reset to `undefined`.
5. **Class method pitfall**: **Class methods are not auto-bound**, so passing `this.handleClick` to an event handler loses `this` — fix with an arrow class field (`handleClick = () => {}`) or `.bind` in the constructor.
6. **`thisArg` and permanent `bind`**: Array iterators like `forEach`/`map` accept a **`thisArg`** second argument. And **`bind` is permanent** — re-binding an already-bound function has no effect (only the first `bind` wins).

**Evolution:**

1. **Arrow functions**: ES6 arrow functions removed the need for `var self = this` / `.bind(this)` boilerplate in callbacks by lexically inheriting `this`.
2. **Class fields**: Class-field arrow methods (`handleClick = () => {}`) replaced constructor `.bind(this)` as the standard auto-binding pattern in React components.
3. **Strict-mode default**: ES modules run in strict mode by default, so default binding yields `undefined` rather than the global object, surfacing accidental global writes earlier.

**Follow-ups:**

1. **Lost `this` in handlers**: Given a React/DOM handler that loses `this`, show every valid fix and their tradeoffs.
2. **Arrow vs method**: When should a class member be a regular method vs an arrow field (performance, inheritance, `super`)?
3. **call/apply/bind differences**: Explain the differences and a case where `apply` is clearly preferable.

**Key points:**

1. **No auto-bind**: Class methods are not auto-bound; use arrow fields or `.bind`.
2. **thisArg**: `forEach`/`map` accept a `thisArg` second argument.
3. **Strict mode**: Strict mode prevents accidental global pollution.
4. **bind is permanent**: `bind` returns a new function; calling `bind` repeatedly only honors the first.

---

### 11. Prototypes & prototype chain

**Frequency:** High

**Question:** How do JavaScript prototypes and the prototype chain work, and how does `class` relate to them?

**Solution:**

1. **`[[Prototype]]` link**: Every JavaScript object has an internal **`[[Prototype]]`** link (readable via `Object.getPrototypeOf(obj)`, historically the `__proto__` accessor) pointing to another object.
2. **Chain walk**: When you access a property, the engine **walks this chain** — checking the object, then its prototype, then *its* prototype — until it finds the property or reaches **`null`** at the top (`Object.prototype`'s prototype). This is how inheritance works: shared behavior lives on a prototype that many instances link to.
3. **`Object.create(proto)`**: Makes a new object with `proto` as its `[[Prototype]]` directly.
4. **`class` is sugar**: `class` syntax is sugar over this prototype machinery, not a separate system: methods you define in a class body actually live on `Class.prototype`, `extends` **wires one prototype to another** to build the chain, and `super` calls up to the parent constructor/method. So `class Dog extends Animal` just sets `Dog.prototype`'s prototype to `Animal.prototype`.
5. **`instanceof`**: Works by walking the chain, checking whether a constructor's **`.prototype`** appears anywhere in it.
6. **`hasOwnProperty`**: (or the newer `Object.hasOwn`) distinguishes an object's *own* properties from inherited ones — essential when iterating.
7. **Shared vs per-object**: **Prototype methods are shared** across all instances (one copy in memory), whereas **instance fields are per-object**. Defining methods on the prototype (as classes do) is more memory-efficient than closures-per-instance. **Mutating built-in prototypes** like `Array.prototype` is a notorious anti-pattern — it leaks into every array on the page and can collide with future language features or other libraries.

**Evolution:**

1. **Constructor functions → `class`**: Pre-ES6 code wired prototypes manually via constructor functions and `Obj.prototype.method = ...`; ES6 `class`/`extends`/`super` standardized the same machinery into readable syntax.
2. **`Object.create` for flat inheritance**: For simple delegation without constructors, `Object.create(proto)` scales to pure prototypal patterns and avoids `new`.
3. **Safe augmentation**: As codebases grow, teams replace `Array.prototype` mutation with utility modules or `Symbol`-keyed methods to avoid cross-library collisions.

**Follow-ups:**

1. **`__proto__` vs `prototype`**: `__proto__` is the instance's link; `prototype` is a property on constructor functions — mixing them up is a common tradeoff/confusion point.
2. **Performance of deep chains**: Long prototype chains slow property lookups; flatten when hot.
3. **`Object.create(null)`**: Creating dictionaries with no prototype avoids inherited-key collisions (e.g. `toString`) at the cost of losing `Object` helpers.

**Key points:**

1. **`instanceof`**: `instanceof` walks the prototype chain checking `.prototype`.
2. **`hasOwnProperty`**: `hasOwnProperty` (or `Object.hasOwn`) skips inherited props.
3. **Anti-pattern**: Modifying `Array.prototype` is a notorious anti-pattern.
4. **Shared vs per-object**: Prototype methods are shared; instance fields are per-object.

---

### 12. Event loop: macrotasks vs microtasks

**Frequency:** High

**Question:** How does the JavaScript event loop work, and what's the difference between macrotasks and microtasks?

**Solution:**

1. **Single thread + loop**: JavaScript runs on a **single thread** with an **event loop** that coordinates two queues. Each iteration ("tick") does: **run one macrotask → drain the entire microtask queue → optionally render → repeat**.
2. **Macrotasks**: The coarse units of work: the initial script, `setTimeout`/`setInterval` callbacks, I/O, and UI events. The loop takes **exactly one** per tick.
3. **Microtasks**: Higher-priority follow-ups: **Promise `.then`/`.catch`/`.finally` callbacks**, `queueMicrotask`, and `MutationObserver`. After each macrotask, the loop **drains the microtask queue completely** — including any microtasks those microtasks schedule — *before* moving on or rendering.
4. **Classic puzzle**: This ordering explains the classic puzzle:
```js
setTimeout(() => console.log('timeout'), 0);
Promise.resolve().then(() => console.log('promise'));
// prints: promise, then timeout
```
The promise callback is a **microtask** and runs before the next macrotask (`setTimeout`), even with a `0`ms delay.
5. **Hazards**: Because microtasks drain fully before rendering, a microtask that **keeps re-enqueueing itself can starve rendering** and freeze the UI. Likewise, **long synchronous work** in any single task blocks the entire thread — no rendering, no input.
6. **Mitigations**: **`requestAnimationFrame`** runs right *before* paint (ideal for visual updates), **`scheduler.postTask` or `requestIdleCallback`** schedule low-priority work without blocking, and **Web Workers** move CPU-bound computation off the main thread entirely so the UI stays responsive.

**Evolution:**

1. **Callbacks → microtask-based Promises**: Early async relied on macrotask callbacks (`setTimeout`); Promises introduced the microtask queue for higher-priority, deterministic follow-ups.
2. **Cooperative scheduling**: As apps grew interactive, `requestIdleCallback` and later `scheduler.postTask` added priority-aware scheduling to keep the main thread responsive.
3. **Offloading work**: CPU-bound workloads scale by moving to **Web Workers**, taking them off the event loop entirely.

**Follow-ups:**

1. **Node vs browser loop**: Node's loop has phases (timers, I/O, `setImmediate`, `process.nextTick`) that differ from the browser model — a common tradeoff/gotcha.
2. **Microtask starvation**: How do you detect and fix a self-re-enqueuing microtask that freezes the UI?
3. **rAF timing**: Why `requestAnimationFrame` is preferred over `setTimeout` for animations (aligns with paint, avoids jank).

**Key points:**

1. **Ordering**: `Promise.resolve().then()` runs before `setTimeout(..., 0)`.
2. **`requestAnimationFrame`**: Runs before paint, after microtasks.
3. **Low-priority work**: Use `scheduler.postTask` or `requestIdleCallback` for low-priority work.
4. **Web Workers**: Offload CPU-bound work off the main thread.

---

### 13. Promises vs async/await; error handling

**Frequency:** High

**Question:** How do Promises and `async/await` relate, and how should you handle errors?

**Solution:**

1. **Sugar over Promises**: **`async/await` is syntactic sugar over Promises** that lets asynchronous code **read top-to-bottom like synchronous code**. Under the hood there's still a Promise for everything: an **`async` function always returns a Promise**, `await` just pauses that function until a Promise settles and unwraps it.
2. **`throw` → rejection**: A **`throw` inside an async function becomes a rejected Promise** — the caller sees a rejection, not a synchronous exception.
3. **`await` unwraps or re-throws**: **`await` unwraps a fulfilled value or re-throws on rejection** — so `await somePromise` that rejects throws *at the await point*, where a surrounding `try/catch` can catch it.
```js
async function load() {
  try {
    const res = await fetch(url);      // rejection re-thrown here
    return await res.json();
  } catch (e) {
    // catches both fetch rejection and any throw above
  }
}
```
4. **Always handle rejections**: Always either wrap awaits in **`try/catch`** or attach **`.catch`** to the returned Promise. An **unhandled rejection crashes Node ≥15 by default** and surfaces as an error in browser DevTools — both are signs of a missing handler.
5. **`await` pauses function, not thread**: **`await` pauses the function, not the thread** — the event loop keeps running other work while you wait, so awaiting doesn't block the page.
6. **Parallelize independent awaits**: **Sequential awaits are a common performance mistake**: `await a(); await b();` runs them one after another. If they're independent, **parallelize with `Promise.all`**: `const [x, y] = await Promise.all([a(), b()])` runs both concurrently and waits for both.

**Evolution:**

1. **Callbacks → Promises → async/await**: Nested callbacks ("callback hell") gave way to chainable Promises, then to `async/await` for linear-reading code.
2. **Sequential → concurrent**: As call counts grow, independent awaits are hoisted into `Promise.all`/`allSettled` to cut latency.
3. **Hardened error handling**: Modern runtimes (Node ≥15) treat unhandled rejections as fatal, pushing teams toward explicit `try/catch`/`.catch` everywhere.

**Follow-ups:**

1. **Top-level await**: ES modules allow top-level `await` — what are its loading/ordering tradeoffs?
2. **Error aggregation**: When parallelizing, do you want fail-fast (`Promise.all`) or collect-all (`Promise.allSettled`)?
3. **Cancellation**: `await` can't be cancelled directly — pair with `AbortController` to abort the underlying operation.

**Key points:**

1. **Return type**: `async` functions always return a Promise.
2. **Pause semantics**: `await` pauses the function, not the thread.
3. **Parallelize**: Parallelize independent awaits with `Promise.all`.
4. **`try/catch`**: `try/catch` around `await` catches both sync throws and rejections.

---

### 14. `Promise.all` vs `allSettled` vs `race` vs `any`

**Frequency:** High

**Question:** Compare `Promise.all`, `allSettled`, `race`, and `any`.

**Solution:**

1. **Common shape**: All four take an iterable of promises but differ in **when they settle** and **how they treat failures**.
2. **`Promise.all`**: Resolves with an **array of all results** once **every** promise fulfills, but is **fail-fast**: the moment *any* promise rejects, `all` rejects immediately with that reason (the others keep running but their results are discarded). Use when you need *all* results and any failure should abort — e.g. loading data that a page can't render without.
3. **`Promise.allSettled`**: **Waits for every** promise regardless of outcome and resolves with an array of **`{status: 'fulfilled', value}`** or **`{status: 'rejected', reason}`** objects. It **never rejects**. Ideal for **partial-failure-tolerant** batch work — firing 10 independent API calls and showing whatever succeeded.
4. **`Promise.race`**: Settles with the **first promise to settle**, whether it fulfills *or* rejects. The classic use is a **timeout**: `Promise.race([fetch(url), timeout(5000)])` rejects if the fetch is too slow.
5. **`Promise.any`**: Resolves with the **first fulfillment**, ignoring rejections; it only rejects (with an **`AggregateError`**) if **all** promises reject. Great for **fetching from multiple mirrors** and taking the fastest success.
```js
await Promise.allSettled([a(), b(), c()]); // [{status,...}, ...]
```
6. **No cancellation caveat**: **None cancel the still-pending promises.** `race` resolving doesn't stop the loser's network request. To actually abort in-flight work, wire up an **`AbortController`** and pass its signal to `fetch`.

**Evolution:**

1. **`all` → `allSettled`**: `Promise.all` (ES2015) came first; `allSettled` (ES2020) was added once partial-failure batch workloads became common.
2. **`race` → `any`**: `any` (ES2021) complements `race` by ignoring rejections, scaling to redundant-mirror fetch strategies.
3. **Add real cancellation**: As these combinators don't cancel, production code layers `AbortController` on top to reclaim resources from losers/rejects.

**Follow-ups:**

1. **`race` vs `any` for timeouts**: When would a reject-on-first `race` be wrong and `any` better?
2. **`AggregateError` handling**: How do you surface which mirror failed from `any`'s aggregate error?
3. **Resource leaks**: What happens to the losing fetch's socket/memory if you don't abort it?

**Key points:**

1. **Timeout**: Combine `Promise.race` with a timeout promise for cancellation.
2. **`allSettled`**: Ideal for parallel API calls where partial failure is OK.
3. **`any`**: Great for fetching from multiple mirrors.
4. **No cancellation**: None of these cancel pending promises — use `AbortController` for that.

---

### 15. Debounce vs throttle (write both)

**Frequency:** High

**Question:** What's the difference between debounce and throttle, and how do you implement each?

**Solution:**

1. **Both rate-limit**: Both **rate-limit** how often a function runs, but they answer different questions.
2. **Debounce**: "Wait until the activity *stops*." It delays execution until **N ms have passed since the last call**, collapsing a burst into a single trailing call. Perfect for **search-as-you-type** (fire the query only after the user pauses), input validation, and resize-settled recalculations.
3. **Throttle**: "Run at a steady *rate*." It executes **at most once per N ms** no matter how many calls arrive, giving regular updates during continuous activity. Perfect for **scroll/resize/mousemove** handlers where you want periodic updates, not one-at-the-end.
4. **Not interchangeable**: Debounce during continuous scrolling would *never* fire (the events never stop long enough), while throttle on a search box would fire mid-typing.
5. **Minimal implementations**:
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
6. **Refinements**: **Leading vs trailing edge** changes the feel — a leading-edge debounce fires immediately then ignores the burst; trailing fires at the end. Pair a debounced fetch with an **`AbortController`** to cancel the previous in-flight request. **`requestAnimationFrame`** is a natural throttle for paint-bound work (caps at the display's refresh rate). In production, prefer **lodash's `debounce`/`throttle`** — they handle leading/trailing options, `maxWait`, and cancellation edge cases correctly.

**Evolution:**

1. **Naive → edge-aware**: Minimal closures grow leading/trailing-edge options and `maxWait` guarantees as UX requirements sharpen.
2. **Timer-based → rAF-based**: For paint-bound work, throttling migrates from `setTimeout` to `requestAnimationFrame` to align with the refresh rate.
3. **Hand-rolled → library**: Production teams adopt lodash/underscore to cover cancellation and edge cases correctly.

**Follow-ups:**

1. **Cancel pending stale fetches**: How do you combine debounce with `AbortController` so only the latest query's response is used?
2. **Leading vs trailing UX**: Which edge fits a "submit" button vs a search field?
3. **Testing timers**: How do you unit-test debounce/throttle with fake timers?

**Key points:**

1. **Edge**: Leading vs trailing edge changes UX feel.
2. **Cancellation**: `AbortController` can cancel pending debounced fetches.
3. **`requestAnimationFrame`**: A natural throttle for paint-bound work.
4. **Library**: Use lodash/underscore implementations in production for edge cases.

---

### 16. Equality: `==` vs `===` vs `Object.is`; NaN

**Frequency:** High

**Question:** How do `==`, `===`, and `Object.is` differ, and what's special about `NaN`?

**Solution:**

1. **Three checks**: These are three equality checks with progressively stricter/more-precise semantics.
2. **`===` (strict equality)**: No coercion; values must have the **same type and value**. This is what you want almost always.
3. **`==` (loose equality)**: Applies **type coercion** with famously surprising rules: `[] == false` is `true`, `'' == 0` is `true`, `'0' == false` is `true`. The coercion algorithm is non-obvious, so `==` is a bug magnet.
4. **`Object.is`**: Like `===` **except** two edge cases: it treats **`NaN` as equal to itself** (`Object.is(NaN, NaN) === true`) and **distinguishes `+0` from `-0`** (`Object.is(+0, -0) === false`, whereas `+0 === -0` is `true`).
5. **`NaN`**: Uniquely **not equal to itself** — `NaN === NaN` is `false` — which is why you can't test for it with equality. Use **`Number.isNaN(x)`**, and prefer it over the **global `isNaN`**, which first coerces its argument (`isNaN('foo')` is `true`, misleadingly) whereas `Number.isNaN` only returns `true` for the actual `NaN` value.
6. **Practical guidance**: **Always use `===`** unless you have a specific reason to coerce. The one commonly-accepted `==` use is **`x == null`**, which is `true` for both `null` and `undefined` (a concise nullish check). Worth knowing for framework work: **React's `useState` and `useMemo` bail-out comparisons use `Object.is`**, which is why mutating state in place (same reference) skips re-renders.

**Evolution:**

1. **`==` → `===` default**: Community practice and linters (ESLint `eqeqeq`) moved teams from coercion-prone `==` to strict `===` by default.
2. **`Object.is` (ES2015)**: Added to express same-value semantics (`NaN`, `±0`) that `===` can't, now underpinning framework reconciliation.
3. **Safe NaN testing**: `Number.isNaN`/`Number.isFinite` (ES2015) replaced the coercing global `isNaN`/`isFinite`.

**Follow-ups:**

1. **`==` abstract algorithm**: Can you walk through the coercion steps that make `[] == false` true?
2. **`Object.is` in React**: Why does mutating state in place skip re-renders?
3. **Deep equality**: When none of these suffice, how do you compare nested objects (structural equality)?

**Key points:**

1. **Default**: Always use `===` unless intentionally coercing.
2. **Nullish**: `null == undefined` is true; both `=== null` is false.
3. **React**: React's `useState` and `Object.is` use the same equality check.
4. **NaN test**: `Number.isNaN` is safer than the global `isNaN` (which coerces).

---

### 17. TS: `interface` vs `type`

**Frequency:** High

**Question:** In TypeScript, when should you use `interface` versus `type`?

**Solution:**

1. **Nearly interchangeable for shapes**: Both can **describe the shape of an object**, and for that common case they're nearly interchangeable. The differences are about **capability and extensibility**.
2. **`interface` declaration merging**: `interface` supports **declaration merging** — declaring the same interface twice merges the members. That's why it's idiomatic for **public API surfaces and library type augmentation**: consumers can reopen your interface to add fields (e.g. augmenting `Window` or an Express `Request`). Interfaces extend each other with `extends`, which is also **slightly faster for the type-checker** to resolve in large hierarchies because the relationship is cached.
3. **`type` expressiveness**: `type` aliases are **strictly more expressive**. Only a `type` can name a **union** (`type Status = 'on' | 'off'`), an **intersection**, a **primitive or tuple** alias, a **mapped type**, or a **conditional / self-referential type**. But a `type` **cannot be merged** — declaring it twice is a duplicate-identifier error.
```ts
interface User { id: string }        // mergeable, extendable
type Result = Success | Failure;     // union — interface can't do this
type Pair = [number, number];        // tuple — interface can't do this
```
4. **Comparable, capability-driven choice**: Both support **generics** and both can model most object contracts, so **performance is comparable** and the real decision is *capability needed*, not dogma.
5. **Pragmatic convention**: **`interface` for object shapes you expect others to extend or that form a public API, `type` for unions, tuples, function signatures, and anything computed.** Many teams simply default to `type` and reach for `interface` only when they need merging.

**Evolution:**

1. **Shapes → advanced types**: Early TS codebases used mostly interfaces; as type-level programming grew, `type` with unions/mapped/conditional types became essential.
2. **Library augmentation**: Ecosystem growth made `interface` declaration merging the standard mechanism for ambient/module augmentation.
3. **Checker performance at scale**: In large hierarchies teams favor `interface extends` for cached, faster type resolution.

**Follow-ups:**

1. **Augmenting third-party types**: How do you add a field to `Express.Request` or `Window` — and why must it be an `interface`?
2. **Union of objects**: When modeling discriminated unions, why is `type` required?
3. **Error messages**: How do `interface` vs `type` differ in hover/error readability?

**Key points:**

1. **Checker speed**: `interface` extension can be faster to type-check in large unions.
2. **Self-reference**: `type` aliases can be self-referential via conditional types.
3. **Generics**: Both support generics.
4. **Merging**: Declaration merging is essential for augmenting libraries.

---

### 18. React VDOM & reconciliation

**Frequency:** High

**Question:** How do React's virtual DOM and reconciliation work, and what did Fiber change?

**Solution:**

1. **Virtual DOM**: React describes your UI as a tree of lightweight **element objects** (the virtual DOM). When state changes, React **re-renders** the component to produce a *new* element tree, then **reconciles** it against the previous tree — computing the minimal set of real-DOM mutations and committing only those. This is why you write declarative "what the UI should look like" code instead of manual DOM surgery.
2. **O(n) via heuristics**: A naive tree diff is O(n³). React gets it to **O(n)** with three heuristics:
   1. **Different element types → replace the whole subtree.** `<div>` becoming `<span>` (or `ComponentA` becoming `ComponentB`) tears down the old subtree and its state and builds fresh — React doesn't try to match across types.
   2. **Same type → keep the node, update changed props.** It reuses the DOM element and just patches attributes/children.
   3. **Keyed lists → match children by `key`.** Keys let React identify which items moved, were inserted, or removed across renders, instead of diffing positionally.
3. **Index-as-key bug**: The classic bug is **using array index as a key** for a reorderable/filterable list: because the key is tied to position rather than identity, React mismatches items and **state "sticks" to the wrong row** (e.g. an input's value jumps to a different item). Use a stable unique id.
4. **Fiber**: Fiber (React 16+) rewrote reconciliation to be **interruptible**. Instead of one recursive, unstoppable pass, work is split into units React can pause, resume, and prioritize — enabling **concurrent rendering** (React 18): urgent updates like typing preempt low-priority renders. A consequence is that **in-progress render work can be thrown away** and restarted, which is why render functions must stay pure (no side effects).
5. **React 19 compiler**: **React 19's compiler** adds automatic, compile-time memoization, reducing the need for manual `useMemo`/`useCallback`/`React.memo`.

**Evolution:**

1. **Stack reconciler → Fiber**: React 16 replaced the recursive stack reconciler with Fiber's interruptible unit-of-work model.
2. **Sync → concurrent rendering**: React 18 built on Fiber to prioritize urgent updates and preempt low-priority renders.
3. **Manual → compiler memoization**: React 19's compiler automates memoization, shrinking manual `useMemo`/`useCallback`/`React.memo` usage.

**Follow-ups:**

1. **Keys deep-dive**: Why does index-as-key break stateful list items, and when is index acceptable?
2. **Purity requirement**: What breaks if a render function has side effects under concurrent rendering?
3. **Memoization tradeoffs**: When does manual memoization still pay off despite the React 19 compiler?

**Key points:**

1. **O(n)**: Reconciliation is O(n) thanks to heuristics, not full tree-diff.
2. **Keys**: Wrong keys cause subtle state bugs in lists.
3. **Concurrency**: Concurrent rendering can throw away in-progress work.
4. **Compiler**: React 19 adds compiler-driven memoization.

---

### 19. `useState` vs `useReducer`

**Frequency:** High

**Question:** When should you use `useState` versus `useReducer`?

**Solution:**

1. **Choice is about complexity**: Both manage component state; the choice is about **how complex the state transitions are**.
2. **Reach for `useState`**: When you have **independent primitives or a small piece of object state** — a toggle, an input value, a counter. Each concern gets its own `useState` and updates directly.
3. **Reach for `useReducer` when**:
   - **The next state depends on the previous state** in non-trivial ways (multi-step logic).
   - **Several sub-values change together** — e.g. an async flow that must set `loading`, `data`, and `error` consistently. A reducer keeps those transitions atomic and prevents impossible combinations.
   - **Transitions follow a state-machine pattern** (`idle → loading → success | error`).
4. **Reducer is a pure function**: The reducer is a **pure function `(state, action) => newState`**, which makes it **trivial to unit-test** in isolation (no React needed) and keeps all transition logic in one readable place instead of scattered across handlers. Crucially, **`dispatch` has a stable identity** across renders, so it's safe to omit from (or include harmlessly in) `useEffect`/`useCallback` dependency arrays — unlike inline setters that can churn.
5. **Useful techniques for both**: **Lazy initialization** `useState(() => expensive())` (or `useReducer(reducer, initialArg, init)`) runs the expensive setup only on mount; **functional updates** `setX(prev => prev + 1)` read the latest value and avoid **stale-closure** bugs. For app-wide state, **pair a reducer with Context**; when logic outgrows a reducer (guards, side effects, nested states), escalate to a dedicated tool like **XState** (formal state machines) or **Zustand/Redux Toolkit** (external stores).

**Evolution:**

1. **`useState` → `useReducer`**: As transitions gain interdependent sub-values and state-machine shape, scattered `useState` setters consolidate into one reducer.
2. **Reducer + Context**: For app-wide sharing, a reducer pairs with Context before reaching for external stores.
3. **→ dedicated tools**: When guards/side-effects/nesting outgrow a plain reducer, teams escalate to XState or Zustand/Redux Toolkit.

**Follow-ups:**

1. **Stable `dispatch`**: Why is `dispatch` safe to omit from dependency arrays but inline setters aren't?
2. **Impossible states**: How does a reducer prevent `loading && error` combinations that scattered `useState` allows?
3. **When to leave React state**: What signals it's time to move to an external store?

**Key points:**

1. **Lazy init**: Lazy initialization: `useState(() => expensive())`.
2. **Functional updates**: `setX(prev => prev + 1)` avoid stale closures.
3. **Context**: Reducers pair well with Context for app-wide state.
4. **Escalation**: XState or Zustand for more complex needs.

---

### 20. `useEffect` deps & stale closures

**Frequency:** High

**Question:** Why does `useEffect` suffer from stale closures, and how do you fix them?

**Solution:**

1. **Closure per render**: An effect's callback is a **closure created during a specific render**, so it captures the values of props and state **from that render**. If a value it uses isn't in the **dependency array**, the effect doesn't re-run when that value changes — it keeps running the *old* closure and reads the **outdated value**.
2. **Canonical bug**: The interval-counter bug is canonical:
```js
useEffect(() => {
  const id = setInterval(() => setCount(count + 1), 1000); // count frozen at 0
  return () => clearInterval(id);
}, []); // missing `count`
```
The interval always sees `count === 0`, so it sets `1` forever.
3. **Lint rule**: The **`react-hooks/exhaustive-deps`** lint rule flags exactly this.
4. **Two correct fixes**:
   1. **Include every reactive value** the effect references in the deps array. The effect then re-subscribes with fresh values when they change (here, re-creating the interval each time `count` changes).
   2. **Read the latest value without re-subscribing** — use a **functional update** (`setCount(c => c + 1)`, which needs no dependency) or a **ref** (`countRef.current`) when you want a *stable* subscription that still sees current data. Refs are the standard escape hatch for "I need the newest value but don't want to tear down and recreate the effect."
5. **Supporting facts**: An **empty deps array `[]`** means "run once on mount, clean up on unmount"; **cleanup runs before the next effect execution and on unmount** (used to unsubscribe/clear timers). **React 18 Strict Mode intentionally mounts → unmounts → remounts in dev**, running effects twice to surface missing cleanup. **React 19's compiler** reduces manual dependency juggling by memoizing automatically.

**Evolution:**

1. **Manual deps → lint-enforced**: `react-hooks/exhaustive-deps` made missing-dependency bugs visible, standardizing correct deps arrays.
2. **Re-subscribe → ref/functional-update**: For stable subscriptions, patterns shifted from re-running effects to refs and functional updates that read fresh values.
3. **→ compiler automation**: React 19's compiler auto-memoizes, reducing the manual dependency juggling that caused stale closures.

**Follow-ups:**

1. **Ref vs dep**: When should you use a ref to read fresh state vs listing it as a dependency?
2. **Strict Mode double-run**: What class of bugs does the dev double-invoke surface, and how do you make effects idempotent?
3. **Cleanup ordering**: Why must cleanup run before the next effect, and what leaks if it doesn't?

**Key points:**

1. **Empty deps**: Empty deps `[]` = run once on mount (and cleanup on unmount).
2. **Cleanup**: Cleanup runs before next effect and on unmount.
3. **Strict Mode**: React 18 Strict Mode runs effects twice in dev to surface bugs.
4. **Compiler**: React 19's compiler reduces manual dep management.

---

### 21. `useMemo` vs `useCallback`

**Frequency:** High

**Question:** What's the difference between `useMemo` and `useCallback`, and when are they worth it?

**Solution:**

1. **What each memoizes**: They memoize different things across renders. **`useMemo(fn, deps)`** runs `fn` and **caches its return value**, recomputing only when a dependency changes — it memoizes a **computed value**. **`useCallback(fn, deps)`** caches the **function itself** (a stable reference); it's literally **sugar for `useMemo(() => fn, deps)`** — it memoizes a *function* rather than a value.
2. **Skip expensive recomputation**: The first legitimate reason — memoizing a genuinely costly calculation (sorting/filtering a large list, heavy transforms) so it doesn't rerun every render.
3. **Preserve referential identity**: The second legitimate reason — a new object/array/function is created on every render, which **breaks `React.memo` children** (they see a "changed" prop and re-render) and **retriggers `useEffect`** deps. Wrapping the value/callback keeps the same reference across renders so those bail-outs actually work. This is the *more common* real reason — `useCallback` almost always exists to feed a stable prop to a memoized child or an effect.
4. **Memoization isn't free**: It costs memory plus a deps comparison every render, so wrapping trivial values (a cheap string concat, a number) is **net-negative**.
5. **Wrong deps reintroduce stale closures**: Just like `useEffect`. And `useCallback` is **pointless without a memoized consumer** — if the child isn't `React.memo`'d and the fn isn't an effect dep, you're paying overhead for nothing.
6. **Profile first**: Rule of thumb — use React DevTools Profiler, add memoization to fix a *measured* problem, not preemptively. Note **React 19's compiler auto-memoizes**, making most manual `useMemo`/`useCallback` obsolete.

**Evolution:**

1. **Manual → compiler**: Hand-written `useMemo`/`useCallback` were the norm; **React 19's compiler auto-memoizes**, obsoleting most manual wrapping.
2. **Value vs function split**: `useCallback` emerged as sugar over `useMemo(() => fn, deps)` to express the common "stable function reference" case directly.
3. **Measure-driven adoption**: As apps scaled, the practice shifted from preemptive memoization to profiling-first (DevTools Profiler) targeting of measured hotspots.

**Follow-ups:**

1. **Over-memoization cost**: When does adding `useMemo`/`useCallback` make performance *worse*? (trivial values: memory + deps-comparison overhead exceeds savings.)
2. **Stale closure debugging**: How do wrong deps produce stale values, and how do you catch them? (exhaustive-deps lint rule.)
3. **Memoized child pairing**: Why is `useCallback` useless unless the consumer is `React.memo`'d or an effect dep?
4. **Compiler tradeoff**: Should you still write manual memoization with the React 19 compiler enabled?

**Key points:**

1. **Overhead**: Memoization has overhead — don't memoize trivial values.
2. **Stale closures**: Stale closure risk if deps are wrong.
3. **Pair with `React.memo`**: Pair with `React.memo` for child re-render skipping.
4. **Profile first**: Profile before adding memoization.

---

### 22. Keys in lists; index-key anti-pattern

**Frequency:** High

**Question:** What role do keys play in React lists, and why is using the array index an anti-pattern?

**Solution:**

1. **What a key is**: A **key** is React's identity tag for a list item — it lets reconciliation **match elements across renders**. When a list re-renders, React uses keys to decide which items were *added*, *removed*, or *moved*, so it can reuse existing DOM nodes and their component state instead of rebuilding.
2. **When index keys are acceptable**: Using the **array index** as the key is fine **only for static, append-only lists** that never reorder, insert-in-the-middle, or delete.
3. **Why index keys break on mutation**: The moment the list mutates, index keys break: because the key describes a *position* rather than the *item*, React thinks the item at index 2 is "the same" before and after a reorder — so **local state, focus, and DOM state follow the index, not the data**. The classic symptom: you delete the first row, and the *text typed into that row's input* appears to jump to the row that shifted up, because React reused the input DOM node by position.
4. **Correct vs incorrect code**: The fix is a **stable, unique id** derived from the data itself.
```jsx
{items.map((item, i) => <Row key={item.id} />)} // ✅ stable identity
{items.map((item, i) => <Row key={i} />)}       // ❌ breaks on reorder/insert/delete
```
5. **Scope and random-key pitfall**: Keys need only be **unique among siblings**, not globally. **Never generate keys randomly in render** (`key={Math.random()}`) — a new key every render forces React to destroy and recreate the node each time, killing performance and resetting state.
6. **Dev warnings and side effects**: React **warns in dev** when keys are missing. And because keys govern node identity, they also affect **CSS transitions/animations** (a changed key remounts, replaying enter animations) and **form/input state**.

**Evolution:**

1. **Static → dynamic lists**: Index keys suffice for append-only lists; as lists gain reorder/insert/delete, stable data-derived ids become mandatory.
2. **Identity as a tool**: Developers learned to *deliberately* change keys to force remounts (replay animations, reset child state), turning keys from a correctness constraint into a feature.
3. **Tooling pressure**: React's dev warnings and lint rules pushed the ecosystem toward always supplying explicit stable keys.

**Follow-ups:**

1. **Forcing a remount**: How can changing a key intentionally reset a component's state or replay its enter animation?
2. **Sibling-only uniqueness**: Why don't keys need to be globally unique, and what breaks if you assume they do?
3. **Random-key cost**: What exactly happens to performance and state when `key={Math.random()}` is used?
4. **Reorder animations**: How do keys interact with list reordering animations (e.g. FLIP)?

**Key points:**

1. **Sibling uniqueness**: Keys must be unique among siblings only.
2. **No random keys**: Don't generate keys randomly inside render.
3. **Dev warnings**: React warns in dev when keys are missing.
4. **Animation/form impact**: Keys also affect CSS animations and form state.

---

### 23. Controlled vs uncontrolled inputs

**Frequency:** High

**Question:** What's the difference between controlled and uncontrolled inputs in React, and when do you use each?

**Solution:**

1. **Core distinction**: The distinction is **where the input's value lives** — in React state or in the DOM.
2. **Controlled input**: Derives its `value` from React state and updates it via `onChange`. State is the **single source of truth**: React drives what's displayed. This makes **live validation, formatting, conditional disabling, and cross-field logic** easy (you can transform/reject each keystroke). The cost is a **re-render on every keystroke**, which for huge forms can matter.
```jsx
<input value={name} onChange={e => setName(e.target.value)} />
```
3. **Uncontrolled input**: Keeps its own value in the **DOM**, and you read it imperatively via a **ref**, initializing with `defaultValue`/`defaultChecked`. It's **simpler and faster** (no re-render per keystroke) — ideal for plain forms where you only need values at submit time.
```jsx
<input defaultValue="jane" ref={inputRef} />
// read on submit: inputRef.current.value
```
4. **When to use which**: **Controlled** when you must *react* to input as the user types (validation, masks, dependent fields); **uncontrolled** for simple/large forms where per-keystroke reactivity isn't needed. This is exactly why **`react-hook-form` uses uncontrolled inputs** under the hood — it registers refs and avoids re-rendering the whole form on every keystroke, which is its main performance advantage.
5. **Gotchas**: **File inputs are always effectively uncontrolled** (you can't set their value programmatically for security). And **never switch a single input between controlled and uncontrolled** across renders (e.g. `value={x}` where `x` starts `undefined` then becomes a string) — React warns, and the input behaves erratically. Keep `value` always-defined (`value={x ?? ''}`) to stay controlled.

**Evolution:**

1. **Controlled-first → library offload**: Early React favored fully-controlled forms; performance on large forms drove libraries like `react-hook-form` to adopt uncontrolled inputs with refs.
2. **Scaling forms**: As forms grow, per-keystroke re-renders become the bottleneck, pushing teams from controlled to uncontrolled (or hybrid) strategies.
3. **Stable-value discipline**: Teams standardized on `value={x ?? ''}` to prevent the controlled/uncontrolled switch warning at scale.

**Follow-ups:**

1. **Hybrid forms**: How do you keep live validation while avoiding full-form re-renders? (uncontrolled + subscribe, as `react-hook-form` does.)
2. **File input constraint**: Why can't file inputs be controlled, and how do you handle their value?
3. **Switch warning**: What causes the "changing a controlled input to be uncontrolled" warning and how do you fix it?
4. **Large-form performance**: At what size does the controlled re-render cost actually matter?

**Key points:**

1. **react-hook-form**: React-hook-form leverages uncontrolled inputs for performance.
2. **File inputs**: File inputs are always effectively uncontrolled.
3. **Initialization**: `defaultValue`/`defaultChecked` initialize uncontrolled.
4. **No switching**: Don't switch a single input between controlled/uncontrolled.

---

### 24. SSR vs SSG vs CSR vs ISR

**Frequency:** High

**Question:** Compare CSR, SSR, SSG, and ISR rendering strategies.

**Solution:**

1. **Framing**: These describe **where and when HTML is generated**, trading off first-paint speed, server cost, and freshness.
2. **CSR (Client-Side Rendering)**: The server ships a near-empty **HTML shell + JS bundle**; the browser downloads, executes, fetches data, and renders. **Slow first paint** (blank until JS runs) and **weaker SEO**, but **fast subsequent navigation** (no full page loads) and cheap static hosting. Good for auth-gated dashboards/SPAs.
3. **SSR (Server-Side Rendering)**: The server renders **full HTML per request**. **Fast, SEO-friendly first paint** and supports **personalized/per-request content**, at the cost of **server compute on every request** and TTFB tied to your backend. Good for personalized, frequently-changing pages.
4. **SSG (Static Site Generation)**: Pages are **pre-rendered at build/deploy time** to static HTML served from a CDN. **Fastest possible serve** and trivially scalable, but content is **frozen until the next rebuild** and only works for content **known at build time**. Good for blogs, docs, marketing.
5. **ISR (Incremental Static Regeneration, Next.js)**: Serve the **cached static page**, then **regenerate it in the background on a revalidation interval** (or on-demand). Combines SSG's speed with near-SSR freshness — the best default for large mostly-static sites (e-commerce catalogs).
6. **Orthogonal refinements**: **React Server Components** add an orthogonal axis — **per-component** server rendering, letting you keep data-fetching/heavy deps on the server (zero client JS) while islands stay interactive. Related: **streaming SSR** flushes HTML chunks as data resolves (faster perceived load via Suspense), **edge SSR** runs rendering close to users for low latency, and **ISR revalidation needs care** — naive expiry can trigger a **cache stampede** where many requests regenerate simultaneously.

**Evolution:**

1. **CSR → SSR → SSG → ISR**: The field moved from client-only SPAs to per-request SSR, then build-time SSG, then ISR to blend SSG speed with SSR freshness.
2. **Page-level → component-level**: React Server Components shifted rendering from a whole-page strategy to a per-component axis (server vs client islands).
3. **Streaming and edge**: Streaming SSR and edge SSR evolved to cut perceived load time and latency beyond the base strategies.

**Follow-ups:**

1. **Cache stampede**: How do you prevent many simultaneous ISR regenerations on expiry?
2. **Strategy per page**: How do you mix strategies within one app (static marketing + SSR dashboard + ISR catalog)?
3. **RSC boundaries**: How do you decide which components stay server-only vs become client islands?
4. **SEO vs cost**: When is SSR's per-request compute justified over SSG/ISR?

**Key points:**

1. **Streaming SSR**: Streaming SSR ships HTML chunks as data resolves.
2. **Edge SSR**: Edge SSR runs near users for lower latency.
3. **SSG constraint**: SSG works only for content known at build time.
4. **ISR care**: ISR's revalidation strategy needs care to avoid cache stampedes.

---

### 25. Critical rendering path

**Frequency:** High

**Question:** Walk through the browser's critical rendering path and how to optimize it.

**Solution:**

1. **The CRP sequence**: The **critical rendering path (CRP)** is the sequence the browser follows to turn bytes into pixels: (1) **Parse HTML → DOM** — build the Document Object Model tree. (2) **Parse CSS → CSSOM** — build the CSS Object Model; **CSS is render-blocking** (the browser won't paint until the CSSOM is ready, because it can't style anything without it). (3) **DOM + CSSOM → Render Tree** — combine into a tree of *visible* nodes with computed styles. (4) **Layout (reflow)** — compute each node's **geometry** (position/size). (5) **Paint** — fill in **pixels** (text, colors, images, borders). (6) **Composite** — assemble painted **layers** in order (GPU) to the screen.
2. **Two blocking behaviors**: **CSS blocks rendering** (above), and **synchronous `<script>` blocks the HTML parser** — the parser stops, downloads, and executes the script before continuing, delaying DOM construction.
3. **Minimize critical resources**: Fewer/smaller render-blocking CSS and JS files.
4. **Inline critical CSS**: Inline above-the-fold styles and lazy-load the rest so first paint isn't gated on the full stylesheet.
5. **Defer non-critical JS / preload / preconnect**: **Defer non-critical JS** with **`async`/`defer`** so scripts don't block parsing. **`preload`** truly critical resources (hero image, key font); **`preconnect`** to third-party origins to warm up DNS/TLS early.
6. **`async` vs `defer`**: **`defer`** downloads in parallel but **executes after parsing completes, in document order, just before `DOMContentLoaded`** — ideal for app scripts that need the DOM. **`async`** executes **as soon as it downloads, out of order**, potentially mid-parse — fine for independent scripts like analytics. Use the **DevTools Performance panel** to visualize and find bottlenecks in the path.

**Evolution:**

1. **Blocking → non-blocking loading**: Script loading evolved from parser-blocking synchronous tags to `async`/`defer` and resource hints (`preload`/`preconnect`).
2. **Full stylesheet → critical CSS**: Optimization matured from shipping one blocking stylesheet to inlining critical CSS and deferring the rest.
3. **Guess → measure**: The DevTools Performance panel shifted CRP tuning from intuition to profiling actual bottlenecks.

**Follow-ups:**

1. **async vs defer choice**: Which do you pick for an app bundle vs analytics, and why?
2. **Reflow cost**: What triggers layout thrashing and how do you avoid forced synchronous reflows?
3. **Compositing**: Which CSS properties stay on the compositor (GPU) and skip layout/paint?
4. **Critical CSS automation**: How do you extract above-the-fold CSS at build time?

**Key points:**

1. **`defer` timing**: `defer` runs after parse, before `DOMContentLoaded`.
2. **`async` timing**: `async` runs whenever it arrives (out of order).
3. **Resource hints**: Preload critical resources, preconnect to third-party origins.
4. **DevTools**: DevTools Performance panel visualizes the path.

---

### 26. Core Web Vitals (LCP, INP, CLS)

**Frequency:** High

**Question:** What are the three Core Web Vitals, their targets, and what hurts each?

**Solution:**

1. **Framing**: Core Web Vitals are Google's field-measured UX metrics, each capturing a different dimension and used as a **search ranking signal**.
2. **LCP — Largest Contentful Paint (loading), target < 2.5s**: Time until the **largest visible element** (usually the hero image or headline) renders — a proxy for "when does the page *feel* loaded." **Killers:** render-blocking CSS/JS, oversized/unoptimized images, slow server TTFB, client-side data waterfalls. **Fixes:** optimize/preload the LCP image, inline critical CSS, faster/edge server, `fetchpriority="high"`.
3. **INP — Interaction to Next Paint (responsiveness), target < 200ms**: **Replaced FID in March 2024.** Unlike FID (only measured the *first* interaction's input delay), INP measures the **latency of *all* interactions** across the page's life — from click/tap/keypress to the next visual update — and reports a high percentile. **Killers:** long JS tasks blocking the main thread, heavy event handlers, synchronous layout (layout thrashing). **Fixes:** break up long tasks (`scheduler.yield`), memoize, move work to Web Workers, avoid forced reflows.
4. **CLS — Cumulative Layout Shift (visual stability), target < 0.1**: Sums how much visible content **unexpectedly jumps** during load. **Killers:** images/videos without width/height (or `aspect-ratio`), late-injected ads/banners/embeds, web fonts causing reflow (FOUT), dynamically inserted content above existing content. **Fixes:** always set dimensions, reserve space for dynamic slots, use `font-display: optional/swap` carefully.
5. **Lab vs field measurement**: Measure both in the lab (Lighthouse) and, more importantly, in the **field** with the **`web-vitals`** library reporting real-user data — lab numbers often hide the tail that real devices/networks expose.

**Evolution:**

1. **FID → INP**: Responsiveness metric evolved from first-input-only FID to all-interactions INP in March 2024, raising the bar for main-thread work.
2. **Lab → field (RUM)**: Measurement shifted from lab-only Lighthouse to field data via the `web-vitals` library, exposing real-device tail latency.
3. **Metric-driven ranking**: As CWV became a ranking signal, optimizing LCP/INP/CLS moved from nice-to-have to SEO-critical.

**Follow-ups:**

1. **INP vs FID**: Why is INP harder to pass than FID was, and what main-thread strategies help?
2. **CLS sources**: How do you track down which element is causing layout shift in production?
3. **LCP element identification**: How do you confirm which element is the LCP and prioritize it?
4. **Lab/field divergence**: Why can lab scores look good while field scores fail?

**Key points:**

1. **LCP killers**: LCP killers: render-blocking CSS, large images, slow servers.
2. **INP killers**: INP killers: long tasks, heavy event handlers, sync layout.
3. **CLS killers**: CLS killers: missing image dimensions, late-injected ads/banners.
4. **web-vitals library**: `web-vitals` library reports field data.

---

### 27. Code splitting & lazy loading

**Frequency:** High

**Question:** What are code splitting and lazy loading, and how do you apply them effectively?

**Solution:**

1. **Definitions**: **Code splitting** breaks one giant JS bundle into smaller **chunks** loaded on demand, so users download only the code the current view needs instead of the whole app upfront. **Lazy loading** is the act of deferring a chunk until it's actually required. Together they shrink the initial bundle, improving TTI/LCP.
2. **The underlying primitive**: The **dynamic `import()`** — an async, Promise-returning import that bundlers (webpack/Vite/Rollup) turn into a separate chunk fetched at runtime.
```js
const mod = await import('./Chart.js'); // fetched only when this line runs
```
3. **Framework wrappers**: **`React.lazy(() => import('./X'))`** (rendered inside a **`<Suspense>`** boundary for the loading fallback), **Next.js `dynamic()`**, and **Angular's `loadComponent`/`loadChildren`**.
4. **Where to split, in priority order**: (1) **Per-route** is the **highest-impact starting point** — each page becomes its own chunk, so landing on `/home` doesn't download `/admin`. (2) **Per-feature/component** for heavy, rarely-used widgets (a rich text editor, a charting lib, a modal).
5. **The loading waterfall hazard**: Navigating to a route, *then* discovering it needs another chunk, fetching sequentially and stalling the user. Mitigate by **prefetching likely-next chunks during idle** — `<link rel="prefetch">` or framework hints (Next.js prefetches links in the viewport).
6. **Don't over-split**: Too many tiny chunks add HTTP request overhead and hurt compression, often netting slower loads. Use a **bundle analyzer** (`webpack-bundle-analyzer`, `rollup-plugin-visualizer`) to see what's actually big and split deliberately rather than guessing.

**Evolution:**

1. **Monolith → dynamic import**: Bundles went from one monolithic file to on-demand chunks via dynamic `import()`, wrapped ergonomically by `React.lazy`/`dynamic()`.
2. **Reactive → prefetched**: Lazy loading matured from fetch-on-navigate (waterfalls) to idle-time prefetching of likely-next chunks.
3. **Guess → analyze**: Splitting decisions moved from intuition to bundle-analyzer-driven targeting of the actually-large modules.

**Follow-ups:**

1. **Waterfall mitigation**: How does prefetching prevent sequential chunk fetches, and when does it backfire?
2. **Over-splitting cost**: Why can too many small chunks be slower than fewer larger ones?
3. **Suspense fallback UX**: How do you avoid layout shift / flashing when a lazy chunk loads?
4. **Split granularity**: How do you decide route-level vs component-level splitting?

**Key points:**

1. **Per-route first**: Per-route splitting is the highest-impact starting point.
2. **Prefetch**: Prefetch with `<link rel="prefetch">` or framework hints.
3. **Don't over-split**: Don't over-split — too many small chunks hurt HTTP overhead.
4. **Analyzers**: Bundle analyzers (webpack-bundle-analyzer, rollup-plugin-visualizer) guide decisions.

---

### 28. HTTP caching: Cache-Control, ETag, Last-Modified

**Frequency:** High

**Question:** How does HTTP caching work with `Cache-Control`, `ETag`, and `Last-Modified`?

**Solution:**

1. **Two phases**: HTTP caching has **two phases**: *freshness* (can I reuse without asking?) and *revalidation* (is my stale copy still good?).
2. **Freshness via `Cache-Control`**: **`max-age=N`** — seconds the browser may reuse the response without contacting the server; **`s-maxage`** overrides it for *shared* caches (CDNs). **`public`** (any cache may store) vs **`private`** (browser only, e.g. per-user data). **`immutable`** — promises the content never changes, so the browser skips revalidation even on reload. **`no-store`** — never cache (sensitive data); **`no-cache`** — cache but *always revalidate* before use. **`stale-while-revalidate=N`** — serve the stale copy instantly while refreshing in the background.
3. **Revalidation via conditional requests**: Kicks in after expiry so the server can skip resending the body. **`ETag`** (a content hash/version) → browser sends **`If-None-Match: <etag>`**; if unchanged the server replies **`304 Not Modified`** with no body. **`Last-Modified`** → browser sends **`If-Modified-Since`**; same `304` outcome. ETag is more precise (survives content that's rewritten with identical bytes or sub-second changes).
4. **Standard asset strategy**: **Hash-named static assets** (`app.9f3a.js`) get **`Cache-Control: public, max-age=31536000, immutable`** — cache forever, because a content change produces a new filename.
5. **HTML strategy**: **HTML should be `no-cache`** (revalidate every time) so a new deploy — which points to new hashed asset URLs — **propagates immediately** rather than serving a stale shell.
6. **CDN and `Vary`**: **CDNs honor `s-maxage` independently** of the browser's `max-age`, and the **`Vary`** header tells caches which request headers (e.g. `Accept-Encoding`, `Accept-Language`) produce different responses, preventing a cache from serving the wrong variant.

**Evolution:**

1. **Last-Modified → ETag**: Revalidation moved from timestamp-based `Last-Modified` to precise content-hash `ETag` for sub-second and identical-byte cases.
2. **Expiry → stale-while-revalidate**: Freshness evolved from hard expiry to `stale-while-revalidate` for instant serves with background refresh.
3. **Browser → multi-tier caching**: `s-maxage` and `Vary` emerged to coordinate CDN/shared caches independently of the browser, scaling to multi-tier delivery.

**Follow-ups:**

1. **Cache-busting deploys**: Why must HTML be `no-cache` while assets are `immutable` for safe deploys?
2. **ETag vs Last-Modified**: When does ETag give correctness that Last-Modified can't?
3. **Vary pitfalls**: How can a missing or overly-broad `Vary` header poison a cache?
4. **CDN coordination**: How do `max-age` and `s-maxage` interact across browser and CDN?

**Key points:**

1. **stale-while-revalidate**: `stale-while-revalidate` serves stale while refreshing in background.
2. **HTML no-cache**: HTML should be `no-cache` (revalidate every time) so deploys propagate.
3. **CDN s-maxage**: CDNs respect `s-maxage` separately from browser `max-age`.
4. **Vary header**: `Vary` header tells caches which request headers differentiate responses.

---

### 29. CORS preflight & credentials

**Frequency:** High

**Question:** How do CORS preflight requests and credentialed cross-origin requests work?

**Solution:**

1. **What CORS is**: **CORS (Cross-Origin Resource Sharing)** is a browser security mechanism that lets a server opt into being called from *other* origins, relaxing the same-origin policy. The browser (not the server) enforces it.
2. **Simple requests**: `GET`/`POST`/`HEAD` with only "safe" headers and a body content-type of `application/x-www-form-urlencoded`, `multipart/form-data`, or `text/plain`. These go straight through; the browser just checks the response's `Access-Control-Allow-Origin` before exposing it.
3. **Non-simple requests (preflight)**: Anything with a **custom header** (e.g. `Authorization`, `X-Requested-With`), a **method** other than GET/POST/HEAD (PUT/DELETE/PATCH), or a **JSON body** (`Content-Type: application/json`). These trigger a **preflight**: the browser first sends an **`OPTIONS`** request asking permission.
4. **Required server response headers**: The server must answer the preflight (and the actual request) with: **`Access-Control-Allow-Origin`** — the allowed origin (or `*`). **`Access-Control-Allow-Methods`** and **`Access-Control-Allow-Headers`** — what the actual request may use. **`Access-Control-Max-Age`** — how long the browser may **cache the preflight** result, avoiding an OPTIONS on every call.
5. **Credentialed requests**: For sending cookies or HTTP auth, the client sets **`credentials: 'include'`** on `fetch`, and the server must return **`Access-Control-Allow-Credentials: true`** *and* a **specific origin — not `*`**. The most common mistake is exactly that: returning `Access-Control-Allow-Origin: *` *with* credentials, which browsers **reject** for security.
6. **SameSite still applies**: **`SameSite` cookie rules still apply on top of CORS** — CORS allowing the request doesn't override a `SameSite=Strict/Lax` cookie being withheld cross-site.

**Evolution:**

1. **Same-origin → opt-in CORS**: The web relaxed strict same-origin policy via server-declared CORS headers for controlled cross-origin access.
2. **Per-call → cached preflight**: `Access-Control-Max-Age` evolved to cache OPTIONS results, cutting the preflight tax on repeated calls.
3. **Wildcard → scoped credentials**: Credentialed CORS tightened the rules — `*` is disallowed with credentials, forcing specific origins plus `SameSite` interplay.

**Follow-ups:**

1. **Wildcard + credentials**: Why do browsers reject `Access-Control-Allow-Origin: *` with credentials, and what's the fix?
2. **Preflight reduction**: How do you avoid triggering preflights, or cache them effectively?
3. **SameSite vs CORS**: How can a request pass CORS yet still have its cookie withheld?
4. **Server vs browser enforcement**: Why does CORS not protect the server itself from non-browser clients?

**Key points:**

1. **Simple skips preflight**: Simple requests skip preflight (form-encoded POST, GET).
2. **Max-Age caching**: `Access-Control-Max-Age` caches preflight result.
3. **SameSite on top**: `SameSite` cookies still apply on top of CORS.
4. **Wildcard mistake**: Mistake: returning `*` with credentials — browsers reject.

---

### 30. XSS, CSRF, clickjacking mitigations

**Frequency:** High

**Question:** How do you mitigate XSS, CSRF, and clickjacking?

**Solution:**

1. **Framing**: Three distinct browser attacks, each with layered defenses.
2. **XSS (Cross-Site Scripting)**: Attacker injects script that runs in your users' page, stealing tokens/data or acting as them. Defenses: **Never write untrusted input to `innerHTML`** (or `dangerouslySetInnerHTML`, `v-html`) — the #1 sink; **escape/encode on render** so data is treated as text, not markup (**React/Vue/Angular escape by default**, so injection usually means someone opted out). If you *must* render user HTML (rich text), **sanitize with DOMPurify** to strip scripts/handlers. Deploy a **Content Security Policy (CSP)** to disallow inline scripts and restrict script origins — strong defense-in-depth even if injection slips through; the **Trusted Types API** goes further, enforcing that only vetted values reach dangerous DOM sinks.
3. **Stored vs reflected XSS**: **Stored XSS** (payload persisted in your DB, served to every viewer) is **worse than reflected** (payload in a URL, one victim at a time) because it auto-propagates.
4. **CSRF (Cross-Site Request Forgery)**: A malicious site tricks the browser into sending a **state-changing request** to your site using the victim's **automatically-attached credentials** (cookies). It only works against browser-sent credentials, not `Authorization` headers you add manually. Defenses: **`SameSite=Lax` (or `Strict`) cookies** so cookies aren't sent on cross-site requests — the modern baseline; **CSRF tokens** — a per-session/per-request secret the server issues and validates on mutating requests (the **double-submit cookie** pattern compares a cookie value against a matching request header).
5. **Clickjacking**: Attacker embeds your site in an invisible `<iframe>` overlaid on their page, tricking users into clicking your buttons. Defense: **forbid framing** with **`X-Frame-Options: DENY`** or the modern **CSP `frame-ancestors 'none'`** (or an allowlist of trusted parents).

**Evolution:**

1. **Manual escaping → framework defaults**: XSS defense moved from hand-escaping to frameworks escaping by default, with CSP and Trusted Types as added layers.
2. **Tokens → SameSite**: CSRF defense evolved from token-only schemes to `SameSite` cookies as the modern baseline, with tokens layered on.
3. **X-Frame-Options → CSP frame-ancestors**: Anti-framing migrated from the `X-Frame-Options` header to the more flexible CSP `frame-ancestors` directive.

**Follow-ups:**

1. **Rich-text XSS**: How do you safely render user-supplied HTML? (DOMPurify + CSP.)
2. **Token vs SameSite**: When do you still need CSRF tokens if you have `SameSite` cookies?
3. **CSP rollout**: How do you deploy a strict CSP without breaking legitimate inline scripts?
4. **Header vs Authorization**: Why does CSRF not affect manually-added `Authorization` headers?

**Key points:**

1. **Stored worse than reflected**: Stored XSS is worse than reflected.
2. **Trusted Types**: Trusted Types API helps enforce safe DOM sinks.
3. **CSRF scope**: CSRF only affects browser-sent credentials (cookies, basic auth).
4. **Framework escaping**: React/Vue/Angular escape by default — `dangerouslySetInnerHTML` is opt-in.

---

### 31. CSS Grid: template-areas, implicit vs explicit

**Frequency:** Medium

**Question:** How does CSS Grid work, and what's the difference between the explicit and implicit grid?

**Solution:**

1. **Two-dimensional**: CSS Grid is a **two-dimensional** layout system (rows *and* columns at once, unlike Flexbox's single axis). You define a grid on a container and place children into cells.
2. **Explicit grid**: What you declare directly with **`grid-template-rows`** and **`grid-template-columns`** — the tracks you name up front:
```css
.container { display: grid; grid-template-columns: 200px 1fr; }
```
3. **Implicit grid**: What the browser **auto-creates** when content overflows the explicit tracks — e.g. more items than defined cells, or an item placed at row 5 when you only defined 3. **`grid-auto-rows`/`grid-auto-columns`** size these auto-generated tracks, and **`grid-auto-flow`** (`row`/`column`/`dense`) controls the direction items flow to fill them. So explicit = the grid you drew; implicit = the overflow grid the browser manufactures.
4. **`grid-template-areas`**: Lets you lay out **named regions** visually, like ASCII art, then assign each child with **`grid-area`**:
```css
.container { grid-template-areas: "nav main" "nav aside"; }
.nav { grid-area: nav; }  /* spans both rows automatically */
```
This is extremely readable for page layouts and trivially re-arrangeable in media queries.
5. **Key tools**: **`repeat(auto-fit, minmax(200px, 1fr))`** builds a **responsive grid with no media queries** — columns automatically wrap and stretch to fill the row (`auto-fill` leaves empty tracks, `auto-fit` collapses them). The **`fr`** unit distributes **leftover space** after fixed tracks are allocated. **`place-items`** is shorthand for `align-items`/`justify-items` (cross- and inline-axis alignment inside cells). And **`subgrid`** (now widely shipped) lets a nested grid **inherit its parent's track sizing**, so nested content lines up with the outer grid.

**Evolution:**

1. **Media-query layouts → `auto-fit`/`minmax`**: Hand-written breakpoints give way to intrinsically responsive grids with `repeat(auto-fit, minmax(200px, 1fr))` that need no media queries.
2. **Flat grids → `subgrid`**: Nested components once couldn't align with an outer grid; `subgrid` lets them inherit parent track sizing so content lines up across levels.
3. **Positional placement → named areas**: Scaling complex page layouts moves from index-based `grid-column`/`grid-row` to `grid-template-areas`, which stay readable and re-arrangeable per breakpoint.

**Follow-ups:**

1. **Grid vs Flexbox**: Grid is two-dimensional (rows and columns together); Flexbox is single-axis — choose Grid for page/section layout, Flexbox for content flow in one direction.
2. **`auto-fit` vs `auto-fill`**: `auto-fill` keeps empty tracks reserved; `auto-fit` collapses them so existing items stretch — a tradeoff between consistent slot widths and filling the row.
3. **`dense` packing caveat**: `grid-auto-flow: dense` backfills gaps but can reorder items visually away from DOM order, affecting accessibility/tab order.

**Key points:**

1. **Responsive without media queries**: `repeat(auto-fit, minmax(200px, 1fr))` builds responsive grids without media queries.
2. **`fr` unit**: `fr` distributes leftover space after fixed tracks.
3. **`place-items`**: `place-items` is shorthand for align/justify-items.
4. **Subgrid**: Subgrid (now widely shipped) lets nested grids inherit parent tracks.

---

### 32. CSS cascade & inheritance

**Frequency:** Medium

**Question:** How does the CSS cascade decide which declaration wins, and how does that differ from inheritance?

**Solution:**

1. **Cascade algorithm**: The **cascade** is the algorithm that resolves conflicts when multiple rules target the same element/property. It compares declarations in a **priority order** (each tier only breaks ties from the one above).
2. **Origin & importance**: Who wrote the rule and whether it's `!important`. The precedence band runs: user-agent → user → author → **author `!important`** → user `!important` → UA `!important` (note `!important` *flips* the order). **Browser user-agent stylesheets are the lowest** normal-priority origin.
3. **Cascade layers (`@layer`)**: A newer tier that sits **above specificity**: a declaration in a later-declared layer beats one in an earlier layer *regardless of specificity*, giving you predictable override control. Then come **Specificity** — the `(inline, IDs, classes/attrs/pseudo-classes, elements)` tuple — and finally **Source order**: if everything above ties, the **last declaration wins**.
4. **Inheritance is separate**: **Inheritance is a completely separate mechanism** and only matters when *no* rule targets an element for a given property. Some properties **inherit by default** — mostly typography/text: `color`, `font-*`, `line-height`, `visibility`. Most **layout/box properties do not** inherit: `margin`, `padding`, `border`, `width`, `background`. When they don't inherit, the element uses the property's *initial* value.
5. **CSS-wide keywords**: You can override inheritance explicitly with **`inherit`** (force the parent's computed value), **`initial`** (the property's spec default), **`unset`** (inherit if the property normally inherits, else initial), and **`revert`** (roll back to the previous cascade origin, e.g. the UA stylesheet). Handy details: **`all: unset`** resets every property on an element — great for a clean component reset; and **custom properties (`--foo`) always inherit** unless overridden, which is what makes CSS variables cascade naturally down the tree.

**Evolution:**

1. **Specificity wars → `@layer`**: Teams once fought specificity with `!important` and ID selectors; cascade layers add a predictable tier above specificity for deterministic overrides.
2. **Hard-coded values → custom properties**: Since `--foo` always inherits, design tokens cascade down the tree naturally, replacing scattered literal values as apps scale.
3. **Ad-hoc resets → `all: unset`**: Component isolation improves by resetting every property in one declaration instead of enumerating overrides.

**Follow-ups:**

1. **`unset` vs `revert`**: `unset` resolves to inherit-or-initial per property; `revert` rolls back to the prior cascade origin (e.g. UA stylesheet) — different starting points.
2. **`!important` escape hatch**: Because `!important` flips origin order, overusing it in author code creates a parallel cascade that is hard to reason about.
3. **Layer ordering risk**: A later-declared layer always wins regardless of specificity, so mis-ordering `@layer` declarations can silently defeat intended styles.

**Key points:**

1. **`all: unset`**: `all: unset` is useful for resetting a single component.
2. **Custom properties inherit**: Custom properties (`--foo`) always inherit unless overridden.
3. **Layers above specificity**: Cascade layers introduce a tier above specificity.
4. **UA lowest priority**: Browser user-agent stylesheets are the lowest-priority origin.

---

### 33. Pseudo-classes vs pseudo-elements

**Frequency:** Medium

**Question:** What's the difference between pseudo-classes and pseudo-elements?

**Solution:**

1. **Pseudo-class**: Selects an **existing element that's in a particular state or position** — it doesn't create anything, it just conditionally matches. Examples: **`:hover`/`:focus`/`:active`** (interaction state), **`:focus-visible`** (focus from keyboard vs mouse), **`:nth-child()`/`:first-of-type`** (structural position), **`:checked`/`:disabled`/`:invalid`** (form state), and **`:has()`** (matches based on descendants). Syntax: a **single colon** `:`.
2. **Pseudo-element**: Styles or **creates a sub-part of an element** that isn't a real DOM node — a piece the browser lets you target. Examples: **`::before`/`::after`** (generated content boxes), **`::marker`** (list bullet), **`::selection`** (highlighted text), **`::placeholder`** and **`::file-selector-button`** (form internals), **`::first-line`/`::first-letter`**. Syntax: **double colon** `::` (a single colon still works for the four legacy ones for back-compat).
3. **`content` gotcha**: **`::before`/`::after` won't render without a `content` property** — even `content: ""` is required to make the generated box appear.
4. **Syntax examples**:
```css
button:focus-visible { outline: 2px solid blue; }   /* pseudo-class: state */
.card::after { content: ""; display: block; }        /* pseudo-element: sub-part */
```
5. **Worth knowing**: **`:focus-visible`** shows focus rings only for keyboard users (not mouse clicks), fixing the old "remove the ugly outline" accessibility mistake; **`:has()`** is the long-awaited **parent selector** (`.card:has(img)`), now broadly supported; and each element has **only one `::before` and one `::after`** — you can't stack multiples.

**Evolution:**

1. **Blanket outline removal → `:focus-visible`**: Instead of deleting focus rings and harming keyboard users, `:focus-visible` scopes rings to keyboard focus only.
2. **JS parent-matching → `:has()`**: Selecting a parent based on its descendants once required JavaScript; `:has()` now does it declaratively in CSS.
3. **More sub-parts targetable**: Styling form internals expanded via pseudo-elements like `::placeholder` and `::file-selector-button` that were previously unstylable.

**Follow-ups:**

1. **Single vs double colon**: Why do the four legacy pseudo-elements accept a single colon? For CSS2 back-compat — new ones require `::`.
2. **`:has()` performance**: Broad `:has()` selectors can be expensive to evaluate; scope them to avoid matching across large subtrees.
3. **Can you animate generated content?**: `::before`/`::after` boxes can be transitioned/animated like real boxes, but still require `content` to exist.

**Key points:**

1. **`:focus-visible`**: `:focus-visible` shows focus rings only for keyboard users.
2. **`:has()` parent selector**: `:has()` is a parent selector now broadly supported.
3. **Form internals**: `::placeholder`, `::file-selector-button` style form internals.
4. **One each**: Only one `::before` and one `::after` per element.

---

### 34. Stacking context & `z-index` traps

**Frequency:** Medium

**Question:** What is a stacking context, and why can a child's huge `z-index` fail to bring it to the front?

**Solution:**

1. **Definition**: A **stacking context** is a self-contained group of elements that the browser paints together as one unit along the z-axis. The critical rule: **`z-index` only competes *within* the same stacking context.** Once an element forms its own context, all of its descendants are painted **within** that context and are stacked *as a group* relative to siblings of the context — they can't punch out of it.
2. **Why `z-index: 9999` fails**: A child with **`z-index: 9999` can't escape its parent**: if the parent established a stacking context that sits *below* some other element, the child's giant z-index only wins the battle *inside* the parent — the whole parent group still renders beneath the sibling. The child's 9999 is compared against its siblings, not against elements outside the parent's context.
3. **What triggers a new context**: A new stacking context is triggered by many things, and the surprising ones cause most bugs:
   - **`position` (relative/absolute/fixed/sticky) + a `z-index` other than `auto`**
   - **`opacity` less than 1**
   - **`transform`, `filter`, `perspective`, `clip-path`, `mask`** (any non-`none` value)
   - **`will-change`** naming one of the above
   - **`isolation: isolate`** (created *specifically* to make a context with no other side effects)
   - flex/grid children with `z-index`, and the root `<html>` element.
4. **Practical traps**: An ancestor's **`transform` or `filter`** (say, a CSS animation) silently creates a context that **traps a `position: fixed` modal or tooltip**, so it no longer positions relative to the viewport and can't layer above other content.
5. **Fixes & debugging**: Two fixes: use **`isolation: isolate`** to *intentionally* scope z-index on a wrapper, or **portal modals/tooltips into `document.body`** so they escape the trapping ancestor entirely. The **DevTools Layers panel** visualizes the actual compositing layers to debug these.

**Evolution:**

1. **z-index arms race → `isolation: isolate`**: Escalating `z-index: 9999` values give way to intentionally scoped contexts with a side-effect-free `isolation` wrapper.
2. **Inline modals → body portals**: As apps nest deeply, modals/tooltips get portaled into `document.body` to escape ancestor transform/filter traps.
3. **Guesswork → Layers panel**: Debugging scales from trial-and-error z-index tweaks to inspecting actual compositing layers in DevTools.

**Follow-ups:**

1. **Which properties surprise most?**: `transform`, `filter`, and `opacity < 1` create contexts without any `z-index`, trapping fixed-position descendants unexpectedly.
2. **Portal tradeoffs**: Portaling into `body` escapes traps but detaches DOM locality — event bubbling, theming, and `overflow` clipping need care.
3. **Does `isolation` affect layout?**: No — `isolation: isolate` only creates a stacking context with no other visual/layout side effects.

**Key points:**

1. **Scope z-index**: Use `isolation: isolate` to scope z-index intentionally.
2. **Auto-promoted layers**: Auto-promoted layers (transforms) frequently surprise modal/tooltip layouts.
3. **Portal modals**: Portal modals into `document.body` to avoid context traps.
4. **Layers panel**: DevTools' Layers panel visualizes the stacking tree.

---

### 35. CSS-in-JS vs utility-first vs CSS modules

**Frequency:** Medium

**Question:** Compare CSS-in-JS, utility-first CSS, and CSS modules as styling approaches.

**Solution:**

1. **Three families**: Three families that solve CSS's global-scope and maintainability problems differently.
2. **CSS-in-JS**: (styled-components, Emotion) — write styles **inside JS components**, co-located with the markup they style, with **scoped class names generated automatically** and full access to props/state for **dynamic theming** (`color: ${p => p.theme.primary}`). The tradeoff is **runtime cost**: many libraries generate and inject styles *during render*, adding CPU work and **SSR complexity** (you must extract critical CSS and hydrate correctly). This is why **runtime CSS-in-JS is discouraged in React Server Components** — RSCs don't run client JS, so runtime style injection breaks. The modern answer is **zero-runtime CSS-in-JS** (vanilla-extract, Panda, Linaria) that extracts styles to static `.css` at build time.
3. **Utility-first**: (Tailwind) — compose UIs from tiny **atomic classes** (`flex px-4 text-sm`) directly in markup. Benefits: a **small, cap-sized stylesheet** (utilities are shared and deduped, so CSS size plateaus as the app grows), no naming bikeshedding, and no dead CSS. The tradeoff is **verbose, harder-to-read markup** and a learning curve. **Tailwind v4** ships a **native (Rust/Lightning CSS) engine** for much faster builds and CSS-first config.
4. **CSS Modules**: Plain `.module.css` files where the bundler **locally scopes class names** (`.button` → `.Button_button_a1b2`). Benefits: **zero runtime**, familiar CSS syntax, and clean composition with **PostCSS** pipelines. The tradeoff: **no built-in dynamic theming** (you fall back to CSS variables for that).
5. **How to choose**: Prioritize **SSR/RSC compatibility and runtime cost** (favor Tailwind or zero-runtime approaches for server-heavy apps), then **team familiarity** and whether you need prop-driven dynamic styling.

**Evolution:**

1. **Runtime → zero-runtime CSS-in-JS**: As SSR/RSC adoption grows, runtime style injection (styled-components/Emotion) gives way to build-time extraction (vanilla-extract, Panda, Linaria).
2. **Growing stylesheets → capped utilities**: Hand-authored CSS grows unbounded; Tailwind's shared/deduped atomic classes plateau the stylesheet size as the app scales.
3. **JS-engine → native engine**: Tailwind v4 moves to a native Rust/Lightning CSS engine for much faster builds and CSS-first config.

**Follow-ups:**

1. **Why does runtime CSS-in-JS break in RSC?**: Server Components don't run client JS, so any render-time style injection can't execute — hence zero-runtime extraction.
2. **Dynamic theming in CSS Modules**: Since Modules lack built-in theming, you fall back to CSS custom properties for runtime theme switching.
3. **Markup readability tradeoff**: Utility-first trades readable markup for small, dead-code-free CSS — mitigated by component extraction and editor tooling.

**Key points:**

1. **RSC discouragement**: Runtime CSS-in-JS is discouraged in React Server Components.
2. **Tailwind v4 engine**: Tailwind v4 uses native CSS engine for faster builds.
3. **PostCSS composition**: CSS modules compose with PostCSS pipelines.
4. **Choosing**: Choose based on team familiarity and SSR/RSC requirements.

---

### 36. `<picture>`, `srcset`, responsive images

**Frequency:** Medium

**Question:** How do you serve responsive images with `<picture>`, `srcset`, and `sizes`?

**Solution:**

1. **Two mechanisms**: Responsive images let the browser download the **right image for each device** instead of shipping one huge file to everyone. There are two mechanisms for two different problems.
2. **`srcset` + `sizes` (resolution switching)**: Give the browser several versions of the *same* image at different widths and let it pick based on the device's **DPR** (retina vs standard) and the image's **rendered layout width**:
```html
<img src="photo-800.jpg"
     srcset="photo-400.jpg 400w, photo-800.jpg 800w, photo-1600.jpg 1600w"
     sizes="(max-width: 600px) 100vw, 50vw" alt="...">
```
A key subtlety: **`sizes` describes the *layout* width the image will occupy** (e.g. "50vw on desktop"), *not* the file's pixel width — the browser combines `sizes` + DPR to choose the best `srcset` candidate.
3. **`<picture>` (art direction + format negotiation)**: Supply *different* sources and let the browser pick the **first supported one**, ideal for serving next-gen formats with fallbacks, or a differently-cropped image per breakpoint:
```html
<picture>
  <source type="image/avif" srcset="hero.avif">
  <source type="image/webp" srcset="hero.webp">
  <img src="hero.jpg" alt="..." width="1200" height="600">
</picture>
```
Browsers try **AVIF → WebP → JPEG**, falling back gracefully.
4. **Supporting attributes**: **`loading="lazy"`** defers offscreen images until near the viewport; **`decoding="async"`** decodes off the main thread so it doesn't block paint; **`fetchpriority="high"`** boosts a critical image's priority.
5. **Non-negotiables**: **always set `width`/`height` (or `aspect-ratio`)** so the browser reserves space and avoids **CLS**; and **never lazy-load the above-the-fold LCP image** — that delays your most important paint. Use a **CDN with on-the-fly resizing** to generate the `srcset` variants automatically.

**Evolution:**

1. **One file for all → resolution switching**: Shipping a single large image gives way to `srcset`/`sizes` so each device downloads an appropriately sized variant.
2. **Manual variants → CDN resizing**: As image counts grow, on-the-fly CDN resizing auto-generates `srcset` candidates instead of hand-exporting each size.
3. **JPEG-only → negotiated formats**: `<picture>` enables AVIF → WebP → JPEG fallback chains to shrink payloads while staying compatible.

**Follow-ups:**

1. **`sizes` accuracy**: A wrong `sizes` value makes the browser pick a too-large or too-small candidate — it must reflect actual layout width.
2. **LCP vs lazy-loading**: Lazy-loading the above-the-fold LCP image hurts Largest Contentful Paint; mark it `fetchpriority="high"` instead.
3. **CLS prevention**: Omitting `width`/`height`/`aspect-ratio` causes layout shift as images load — always reserve space.

**Key points:**

1. **Prevent CLS**: Always set `width`/`height` (or aspect-ratio) to prevent CLS.
2. **`sizes` meaning**: `sizes` describes layout width, not image width.
3. **CDN resizing**: Use a CDN with on-the-fly resizing for variants.
4. **LCP priority**: Mark above-the-fold images with `fetchpriority="high"`, not lazy.

---

### 37. WAI-ARIA roles & when NOT to use them

**Frequency:** Medium

**Question:** What is WAI-ARIA for, and when should you NOT use it?

**Solution:**

1. **Purpose**: **WAI-ARIA** is a set of `role`, `state`, and `property` attributes that add **accessibility semantics** the browser exposes to screen readers and other assistive tech. It exists to describe **rich, custom widgets that native HTML can't express** — things like **tabs, comboboxes, tree views, and live regions** — so a screen-reader user understands what a `<div>`-built control *is* and *does*.
2. **First rule of ARIA**: The governing principle is the **first rule of ARIA: "don't use ARIA."** If a **native element** does the job — `<button>`, `<a>`, `<nav>`, `<input type="checkbox">` — use it, because native elements come with **built-in keyboard behavior, focus, and semantics for free**. ARIA only *describes*; it changes **nothing** about behavior. Slapping `role="button"` on a `<div>` tells the screen reader "this is a button" but gives you **no click-on-Enter/Space, no focusability, no disabled handling** — you must add all of that yourself, which is why re-implementing natives with ARIA is an anti-pattern.
3. **Common mistakes**:
   - **Redundant roles** — `<button role="button">`, `<nav role="navigation">` add noise (the semantics are already there).
   - **Missing keyboard handlers** — adding a role without wiring up Enter/Space/arrow keys, leaving the widget unusable by keyboard.
   - **`aria-hidden` on a focusable element** — hides it from screen readers while it remains in the tab order, so keyboard users focus an "invisible" control.
4. **Useful ARIA when native falls short**: **`aria-live`** regions announce dynamic updates (toasts, validation, async results) without moving focus; **`aria-expanded`/`aria-controls`** describe disclosure widgets (accordions, menus); **`aria-label`/`aria-labelledby`** name controls that lack visible text (an icon-only button) — note `aria-label` *overrides* visible text for AT, so use carefully.
5. **Testing**: Always **test with real tools** — **axe-core** for automated checks plus manual passes with **VoiceOver/NVDA** — since linters can't catch experiential problems.

**Evolution:**

1. **ARIA-everything → native-first**: Teams move from decorating `<div>`s with roles toward using semantic HTML that supplies behavior and semantics for free.
2. **Static UIs → live regions**: As apps become more dynamic, `aria-live` and `aria-expanded`/`aria-controls` describe async updates and disclosure widgets natives can't express.
3. **Linter-only → real AT testing**: Accessibility maturity adds axe-core automation plus manual VoiceOver/NVDA passes to catch experiential issues.

**Follow-ups:**

1. **Why is `role="button"` on a div risky?**: It adds the semantic but none of the behavior — you must manually add focusability, Enter/Space activation, and disabled handling.
2. **`aria-hidden` pitfall**: Hiding a still-focusable element from AT leaves keyboard users focusing an invisible control — remove it from the tab order too.
3. **`aria-label` caution**: Because it overrides visible text for assistive tech, a mismatched label confuses users relying on both speech and sight.

**Key points:**

1. **`aria-live`**: `aria-live` regions announce dynamic updates.
2. **Disclosure widgets**: `aria-expanded`, `aria-controls` describe disclosure widgets.
3. **`aria-label` override**: `aria-label` overrides visible text for screen readers.
4. **Real testing**: Run axe-core and test with VoiceOver/NVDA, not just linters.

---

### 38. Keyboard nav & focus management

**Frequency:** Medium

**Question:** How do you make an interface fully keyboard-navigable and manage focus correctly?

**Solution:**

1. **Goal**: Keyboard accessibility means **every interactive element is reachable and operable without a mouse** — essential for screen-reader users, motor-impaired users, and power users.
2. **Tab order & focusability**:
   - Rely on **natural DOM order** for tab sequence and **avoid positive `tabindex`** (`tabindex="5"`) — it creates a brittle, confusing order that's hard to maintain. Use `tabindex="0"` to add a custom element to the natural order.
   - **`tabindex="-1"`** makes an element **programmatically focusable** (via `.focus()`) but keeps it *out* of the tab sequence — used for focus targets like modal containers or error summaries.
3. **Focus management (modals/dialogs)**: This is the hard part:
   1. On open, **move focus into the modal** (usually the first focusable element or the dialog itself).
   2. **Trap focus** inside while open — Tab from the last element wraps to the first, and Shift+Tab from the first wraps to the last, so focus can't leak to the page behind.
   3. On close, **restore focus** to the element that triggered it (e.g. the button that opened the modal), so the user isn't dumped at the top of the page.
4. **`:focus-visible`**: Use **`:focus-visible`** for focus rings so they appear for **keyboard users but not mouse clicks**, giving clear indication without the "ugly outline on click" complaint that leads people to (wrongly) remove outlines entirely.
5. **Supporting patterns**: **skip-to-content links** let keyboard users bypass long nav; **roving tabindex** manages composite widgets (tabs, menus, grids) where the *group* is one tab stop and **arrow keys** move within it (only the active item has `tabindex="0"`, the rest `-1`). Never **remove outlines without a visible alternative**. The simplest test: **unplug your mouse** and try to use the whole app.

**Evolution:**

1. **Positive tabindex → natural order**: Brittle hand-numbered tab orders give way to DOM-driven order plus `tabindex="0"`/`-1` for precise control.
2. **Leaky modals → focus trap + restore**: Dialog accessibility matures to trapping focus while open and restoring it to the trigger on close.
3. **Flat nav → skip links & roving tabindex**: As UIs grow, skip-to-content links and roving tabindex scale keyboard navigation across long nav and composite widgets.

**Follow-ups:**

1. **Why avoid positive `tabindex`?**: It overrides natural order globally, creating a confusing sequence that breaks as the DOM changes.
2. **Roving tabindex vs many tab stops**: Composite widgets use one tab stop with arrow-key movement so users don't tab through dozens of items.
3. **Outline removal**: Removing focus outlines without a visible alternative fails keyboard users — use `:focus-visible` instead.

**Key points:**

1. **Skip links**: Skip-to-content links help keyboard users bypass nav.
2. **Roving tabindex**: Roving tabindex for composite widgets (tabs, menus, grids).
3. **Keep outlines**: Never remove outlines without providing an alternative.
4. **Mouse-unplug test**: Test by unplugging the mouse.

---

### 39. Color contrast (WCAG AA/AAA)

**Frequency:** Medium

**Question:** What are the WCAG color-contrast requirements, and how is contrast measured?

**Solution:**

1. **What WCAG defines**: **WCAG** defines minimum contrast ratios between text/UI and its background so low-vision users can read content. The ratio ranges from **1:1** (identical) to **21:1** (pure black on white).
2. **Level AA**: (the common legal/practical baseline):
   - **4.5:1** for **normal text**
   - **3:1** for **large text** (≥ 18pt, or ≥ 14pt bold) and for **UI components / graphical objects** (button borders, icons, form outlines)
3. **Level AAA**: (stricter):
   - **7:1** for normal text
   - **4.5:1** for large text
4. **How contrast is measured**: Contrast is computed from **relative luminance** — a formula on the sRGB channel values — **not perceived brightness**, which is why some pairs that *look* fine still fail (and vice versa). This is a known weakness: the current formula poorly models human perception, especially for dark themes. **APCA** (Accessible Perceptual Contrast Algorithm), the candidate for **WCAG 3**, models perception far better and is **asymmetric** — it scores **dark-text-on-light** differently from **light-text-on-dark** (the same two colors have different readability depending on which is foreground), which the current ratio treats identically.
5. **Practical guidance**: **test every state** — hover, focus, disabled, and especially **placeholder text** (a frequent failure since it's deliberately dim). **Never rely on color alone** to convey meaning (error = red) — pair it with an **icon or text label** for color-blind users. Tools: **axe, Lighthouse, Stark, and Chrome DevTools' contrast picker** (which shows AA/AAA pass/fail live). Finally, **Windows High Contrast / `forced-colors` mode** overrides your palette entirely and needs **separate testing** — don't assume passing contrast means it works there.

**Evolution:**

1. **AA baseline → AAA where needed**: Projects start at the AA 4.5:1 / 3:1 baseline and tighten to AAA (7:1 / 4.5:1) for critical or high-legibility content.
2. **Luminance ratio → APCA (WCAG 3)**: Contrast measurement is evolving from the perception-poor luminance formula toward the asymmetric, perception-aware APCA.
3. **Default palette → forced-colors support**: As accessibility coverage grows, teams add separate testing for Windows High Contrast / `forced-colors` mode.

**Follow-ups:**

1. **Why do some passing pairs look wrong?**: The luminance formula ignores perceived brightness, so it mis-scores certain pairs — especially in dark themes.
2. **Why is APCA asymmetric?**: Readability differs by foreground/background direction; APCA scores dark-on-light vs light-on-dark differently, unlike the symmetric ratio.
3. **States often missed**: Placeholder, disabled, hover, and focus states frequently fail contrast even when default text passes.

**Key points:**

1. **Test all states**: Test all states (hover, disabled, placeholder).
2. **Not color alone**: Don't rely on color alone — pair with icons or text.
3. **Tools**: Tools: axe, Lighthouse, Stark, Chrome's contrast picker.
4. **Forced-colors**: High-contrast mode (forced-colors) needs separate testing.

---

### 40. SVG vs PNG vs WebP vs AVIF

**Frequency:** Medium

**Question:** How do SVG, PNG, WebP, and AVIF compare, and when do you use each?

**Solution:**

1. **Two categories**: Two are **vector/lossless** and two are **modern lossy raster** formats — pick by content type.
2. **SVG (vector)**: XML-described shapes that are **resolution-independent** (crisp at any size/DPR) and **scriptable/styleable** with CSS. Ideal for **icons, logos, illustrations, and charts**. Tiny for simple graphics, but a poor fit for photos (complex imagery balloons the file). Prefer **inline or sprite SVG over icon fonts** (better accessibility, no FOUT, individually colorable). Compress with **SVGO** to strip editor cruft.
3. **PNG (lossless raster)**: Pixel-perfect with **alpha transparency**. Best for **screenshots, diagrams, and images needing sharp edges/transparency** where lossy artifacts are unacceptable. Downside: **large files** for photographic content.
4. **WebP & AVIF**: **WebP** — modern format **~25–35% smaller than JPEG** at similar quality, with **transparency and animation** support. A great general-purpose default with broad browser support. **AVIF** — newest format, **~50% smaller than JPEG** with better quality (especially gradients/low-light) and HDR/wide-gamut support. Tradeoff: **slower to encode** and slightly less universal support, so serve it **first with a WebP/JPEG fallback**.
5. **Delivery pattern**: Use **`<picture>`** to negotiate formats with graceful fallback:
```html
<picture>
  <source type="image/avif" srcset="img.avif">
  <source type="image/webp" srcset="img.webp">
  <img src="img.jpg" alt="..." width="800" height="600">
</picture>
```
Other guidance: use **`<img>` for content images** (they're semantic and accessible via `alt`) and **CSS `background-image` for purely decorative** visuals. AVIF/WebP **always need a fallback** for older browsers.

**Evolution:**

1. **JPEG/PNG → WebP → AVIF**: Raster delivery evolves toward newer codecs (~25-35% then ~50% smaller than JPEG) with transparency, animation, and HDR support.
2. **Icon fonts → sprite/inline SVG**: Icon delivery moves from fonts (FOUT, poor a11y) to inline/sprite SVG that is individually colorable and accessible.
3. **Single format → `<picture>` negotiation**: Scaling to diverse browsers adds AVIF → WebP → JPEG fallback chains instead of one universal file.

**Follow-ups:**

1. **Why not SVG for photos?**: Complex photographic imagery balloons SVG file size — raster formats compress it far better.
2. **AVIF encode cost**: AVIF's slower encoding and narrower support mean serving it first with WebP/JPEG fallback rather than alone.
3. **`<img>` vs CSS `background`**: Content images use `<img>` for semantics and `alt`; purely decorative visuals use CSS `background-image`.

**Key points:**

1. **SVG icons**: Sprite/inline SVG for icons; avoid icon fonts.
2. **Fallbacks**: AVIF/WebP need explicit fallback for older browsers.
3. **Content vs decoration**: Use `<img>` for content images, CSS `background` for decoration.
4. **SVGO**: Compress SVGs with SVGO.

---

### 41. CSS variables vs SASS variables

**Frequency:** Medium

**Question:** How do CSS custom properties differ from SASS variables, and when do you need each?

**Solution:**

1. **Resolution timing**: The fundamental difference is **when they resolve**.

2. **SASS variables (`$color`)**: They're **preprocessor/build-time**. They're substituted into static CSS during compilation and **don't exist in the shipped stylesheet** — the browser never sees `$color`, only the final `red`. Because they're resolved before runtime, they **can't cascade, can't inherit, and can't change based on the DOM, media queries, or JS**. They're just build-time text substitution.

3. **CSS custom properties (`--color: red`)**: They're **runtime, live values** in the actual CSSOM. They **cascade and inherit** down the DOM like real CSS (a `--color` set on `:root` flows everywhere; overriding it on a subtree re-themes just that subtree); they **respond to media queries** — redefine `--gap` inside `@media` and everything using `var(--gap)` updates; and they can be **read and written by JS** at runtime: `el.style.setProperty('--x', value)` / `getComputedStyle(el).getPropertyValue('--x')`.

4. **Theming requires CSS variables**: This runtime nature is why **theming (light/dark, brand swaps, per-component color) *requires* CSS variables** — you flip a value on `:root` or a wrapper and the whole tree re-themes with no rebuild. SASS simply can't do that.

5. **Complementary, not competing**: SASS still earns its place for **build-time power** — **mixins, functions, `@each`/`@for` loops, nesting, partials, and modular file structure** — things CSS variables don't address. A common modern stack uses SASS for authoring ergonomics *and* CSS variables for runtime theming.

6. **Details worth knowing**: Custom properties can be **scoped to any selector** for component-level theming; **`var(--x, fallback)`** supplies a default when undefined; they work inside **`calc()`** (`calc(var(--gap) * 2)`); but note a raw custom property **doesn't `transition`/animate smoothly** unless registered via **`@property`** with a type, because otherwise the browser treats it as an untyped string.

**Evolution:**

1. **Static preprocessing**: Early CSS scaling relied purely on SASS/LESS build-time variables and mixins to stay DRY, compiling to static output the browser consumed as-is.

2. **Runtime theming**: Native CSS custom properties added live cascading values, enabling instant theme switches on `:root` without recompilation — the basis of modern light/dark toggles.

3. **Hybrid stacks**: Modern pipelines combine SASS authoring ergonomics with CSS variables for runtime behavior, plus `@property` to make custom properties typed and animatable.

**Follow-ups:**

1. **Animating variables**: A plain custom property won't transition smoothly; register it with `@property` and a syntax type so the browser interpolates it.

2. **Fallback strategy**: Use `var(--x, fallback)` to guard against undefined variables and provide graceful defaults.

3. **Scope vs global**: Decide whether a variable belongs on `:root` (global theme) or a component selector (local override) to control how far it cascades.

**Key points:**

1. **Scoping**: CSS variables can be scoped to a selector for component theming.

2. **Fallback**: `var(--x, fallback)` provides a default.

3. **JS access**: JS read/write via `element.style.setProperty('--x', value)`.

4. **calc and transitions**: CSS variables work in `calc()`, transitions don't animate them well.

---

### 42. Animations: `transition` vs `@keyframes`; compositor-friendly properties

**Frequency:** Medium

**Question:** What's the difference between CSS `transition` and `@keyframes`, and which properties are compositor-friendly?

**Solution:**

1. **`transition`**: It interpolates a property **between two states** — a start value and an end value, triggered by a change (class toggle, `:hover`, `:focus`). It's declarative and perfect for simple A→B effects (a button growing on hover, a menu fading in).

2. **`@keyframes`**: Driven by the **`animation`** property, it defines **multi-step** animations with intermediate stops (`0% { } 50% { } 100% { }`), supports **looping, delays, direction, and fill modes**, and can run on load without a state change. Use it for complex, repeating, or multi-stage motion (a spinner, a bouncing indicator).

3. **Rendering pipeline**: The browser's rendering pipeline is **layout → paint → composite**, and **only `transform` and `opacity` can be animated on the compositor thread**, skipping layout and paint entirely. Animating them is cheap and can stay at 60fps even under main-thread load. In contrast, animating **`width`, `height`, `top`/`left`, `margin`** forces **layout (reflow) every frame**, and animating **`box-shadow`, `background`, `color`** forces **paint** every frame — both expensive and janky. So the golden rule: **prefer `transform: translate()` over `top`/`left`, and `transform: scale()` over `width`/`height`.**

4. **`will-change`**: It hints the browser to promote an element to its own layer ahead of time — but use it **sparingly**: over-promotion wastes GPU memory and can *hurt* performance. Add it just before animating, remove it after.

5. **Final considerations**: The frame budget for **60fps is ~16ms per frame** (120Hz displays get ~8ms) — blow past it and you drop frames. Always honor **`prefers-reduced-motion`** to disable/reduce non-essential animation for users with vestibular sensitivity. And the newer **View Transitions API** animates **between two DOM states** (even across full page/route changes) declaratively, handling the crossfade/morph for you.

**Evolution:**

1. **Simple state transitions**: Started with `transition` for basic hover/focus interpolation between two states.

2. **Multi-step motion**: `@keyframes` added looping, delays, and intermediate stops for complex, self-running animations.

3. **GPU compositing**: Shifting to `transform`/`opacity` moved animation off the main thread onto the compositor for 60fps stability.

4. **Declarative page transitions**: The View Transitions API now animates between full DOM/route states without manual crossfade code.

**Follow-ups:**

1. **Diagnosing jank**: Profile for layout/paint thrash and swap `top`/`left`/`width` for `transform` to hit the ~16ms budget.

2. **Accessibility**: Gate non-essential motion behind `prefers-reduced-motion` for vestibular-sensitive users.

3. **will-change overuse**: Avoid leaving `will-change` on many elements — it wastes GPU memory and can regress performance.

**Key points:**

1. **Frame budget**: 60fps means each frame has ~16ms to render.

2. **Transform over position**: Prefer `transform: translate` over `top/left`.

3. **Reduced motion**: `prefers-reduced-motion` should disable non-essential animations.

4. **View Transitions**: View Transitions API enables cross-state animations declaratively.

---

### 43. Iterators & generators

**Frequency:** Medium

**Question:** What are iterators and generators in JavaScript, and what do they enable?

**Solution:**

1. **Iterator protocol**: An object with a **`next()`** method that returns **`{ value, done }`** — `value` is the current item, `done` becomes `true` when exhausted.

2. **Iterable protocol**: An object with a **`[Symbol.iterator]()`** method that returns an iterator. Anything iterable (arrays, strings, `Map`, `Set`) implements this, which is why `for...of`, spread, and destructuring all work on them.

3. **Generators (`function*`)**: The ergonomic way to *produce* iterators. The **`yield`** keyword **pauses execution** and hands a value out; the function resumes exactly where it left off on the next `next()` call, keeping all local state. This makes them ideal for:
```js
function* range(n) { for (let i = 0; i < n; i++) yield i; }
for (const x of range(3)) console.log(x); // 0 1 2
```

4. **What generators enable**: **Lazy/infinite sequences** — values are computed on demand, so you can model an infinite stream (`function* naturals()`) and take only what you need without ever materializing it. **Custom iteration** — define how your own data structure (a tree, a linked list) is traversed by `for...of`. **Coroutine-style async** — historically (pre-`async/await`), libraries like `co` used generators to pause on Promises; `async/await` is essentially a specialized generator.

5. **Distinctions and extras**: **`for...of` consumes iterables** (the *values*), whereas **`for...in` enumerates enumerable keys** (including inherited ones) — a common mix-up. Generators also support **`.return()`** (finish early, run `finally` cleanup) and **`.throw()`** (inject an error at the yield point). **Async generators** (`async function*`) yield Promises and pair with **`for await...of`** for streaming async data (paginated APIs, readable streams). And **spread/destructuring work on *any* iterable**, not just arrays.

**Evolution:**

1. **Manual iteration**: Pre-ES6, sequences were walked with index loops and ad-hoc callbacks with no shared protocol.

2. **Standard protocols**: ES6 formalized iterator/iterable protocols so `for...of`, spread, and destructuring work uniformly across built-ins.

3. **Generators for laziness**: `function*`/`yield` enabled on-demand, infinite, and custom traversals without materializing data.

4. **Async streaming**: `async function*` with `for await...of` extended the model to paginated APIs and readable streams.

**Follow-ups:**

1. **of vs in**: Clarify `for...of` (values of iterables) versus `for...in` (enumerable keys including inherited).

2. **Early termination**: Use `.return()` to run `finally` cleanup and `.throw()` to inject errors at the yield point.

3. **Backpressure**: With async generators, consider how `for await...of` naturally paces consumption of streamed data.

**Key points:**

1. **Consumption vs enumeration**: `for...of` consumes iterables; `for...in` enumerates keys.

2. **Generator control**: Generators support `.return()` for cleanup and `.throw()`.

3. **Async generators**: Async generators (`async function*`) pair with `for await...of`.

4. **Iterable spread**: Spread/destructuring work on any iterable.

---

### 44. ESM vs CommonJS; dynamic `import()`

**Frequency:** Medium

**Question:** How do ES modules differ from CommonJS, and what is dynamic `import()`?

**Solution:**

1. **CommonJS (CJS)**: Node's original system using **`require()`** and **`module.exports`**. It's **synchronous** (`require` blocks until the module loads) and **dynamic** — you can `require()` conditionally inside an `if`, build the path at runtime, etc. Because exports are resolved at runtime, CJS **can't be reliably tree-shaken** (bundlers can't statically know what's used).

2. **ES Modules (ESM)**: The **web standard** using **`import`/`export`**. Imports are **static** (declarations at the top level, analyzable before execution), which enables **tree-shaking** (dead-code elimination) and **async-capable** loading. This static structure is the key advantage for bundlers and the browser.

3. **Dynamic `import()`**: It bridges the gap: it's a **function-like form that returns a Promise**, so you can load a module **on demand** (`const m = await import('./x.js')`) inside conditionals or event handlers. It works in **both the browser and Node ESM** and is the primitive behind **code splitting** and **conditional/lazy loading**.

4. **Interoperability**: **ESM can `import` a CommonJS module** (Node wraps it), but **CommonJS cannot `require()` an ESM module** — it must use dynamic `import()` (since ESM is async and `require` is sync). This mismatch causes much of the "dual package" friction in the ecosystem.

5. **Key specifics**: ESM imports are **hoisted and live-bound** (you get a live *reference* to the export, so if the exporter reassigns it, importers see the new value — unlike CJS's copied snapshot). **`package.json` `"type": "module"`** flips Node's default so `.js` is treated as ESM. The **`"exports"` field** controls which subpaths consumers may import and maps them to files. And **top-level `await`** (awaiting at module scope) is **ESM-only**.

**Evolution:**

1. **Runtime require**: CommonJS gave Node a synchronous, dynamic module system, but one opaque to static analysis.

2. **Static ESM**: The ES module standard introduced statically analyzable imports enabling tree-shaking and browser-native loading.

3. **On-demand loading**: Dynamic `import()` layered lazy/conditional loading and code splitting on top of static ESM.

4. **Interop conventions**: `"type": "module"`, the `"exports"` field, and dual-package patterns emerged to bridge CJS and ESM.

**Follow-ups:**

1. **Dual-package hazard**: Discuss shipping both CJS and ESM builds and avoiding duplicate module instances.

2. **Tree-shaking limits**: Explain why side-effectful modules or CJS interop can block dead-code elimination.

3. **Top-level await cost**: Note that top-level `await` can delay dependents' evaluation in the module graph.

**Key points:**

1. **Live bindings**: ESM imports are hoisted and live-bound.

2. **Module flag**: `package.json` `"type": "module"` flips Node default.

3. **Exports field**: `exports` field controls subpath resolution.

4. **Top-level await**: Top-level await works in ESM only.

---

### 45. Deep clone (`structuredClone`, JSON, recursive)

**Frequency:** Medium

**Question:** What are the ways to deep clone an object in JavaScript, and their tradeoffs?

**Solution:**

1. **Definition**: "Deep clone" means copying an object *and all nested objects* so the copy shares no references with the original. Three approaches follow, in order of preference.

2. **`structuredClone(obj)`**: The modern built-in and the right default. It handles **circular references, `Map`, `Set`, `Date`, `RegExp`, `ArrayBuffer`/typed arrays, and Blobs**. What it **can't** clone: **functions, DOM nodes, and symbols** — it throws (a `DataCloneError`) on those. It uses the same **structured clone algorithm** the browser uses for **`postMessage`** to Web Workers and `history.state`.

3. **`JSON.parse(JSON.stringify(obj))`**: The old one-liner. Fast for plain JSON-shaped data, but it **silently mangles or drops** a lot: **functions and `undefined` vanish, symbols are dropped, `Date` becomes an ISO *string*, `Map`/`Set` become `{}`, `NaN`/`Infinity` become `null`**, and it **throws on circular references**. Only safe for data you *know* is pure JSON.

4. **Hand-written recursive clone**: Full control (you decide how to handle functions, custom classes, etc.), but **verbose, slow, and error-prone**. If you must, use a **`WeakMap` to memoize** already-cloned objects so you handle **cycles** correctly and don't infinite-loop.

5. **Context interviewers probe**: **Shallow cloning** (`{...obj}` or `Object.assign({}, obj)`) copies only **one level** — nested objects are still shared references, which surprises people who expect it to be deep. For immutable state updates, **structural-sharing libraries like Immer** avoid full deep clones entirely — they reuse unchanged subtrees and only copy the paths that changed, which is far more efficient than cloning the whole tree on every update.

**Evolution:**

1. **JSON hack**: `JSON.parse(JSON.stringify())` was the original go-to despite dropping functions, dates, and cycles.

2. **Native structured clone**: `structuredClone` standardized deep copying with cycle and rich-type support built in.

3. **Structural sharing**: Immutability libraries like Immer replaced full clones with copy-on-write sharing for efficient state updates.

**Follow-ups:**

1. **Unsupported types**: Handle functions, DOM nodes, and symbols that `structuredClone` rejects by custom serialization or exclusion.

2. **Shallow vs deep**: Clarify when a shallow spread suffices versus needing a true deep copy.

3. **Performance**: For hot update paths, prefer structural sharing over cloning the whole tree each change.

**Key points:**

1. **Shallow clone**: `{...obj}` or `Object.assign({}, obj)` (one level only).

2. **Immutability libs**: Immer produces structurally-shared clones.

3. **postMessage link**: `structuredClone` is also used by `postMessage`.

4. **Cycle handling**: WeakMap memoization handles cycles in custom recursive clones.

---

### 46. WeakMap / WeakSet

**Frequency:** Medium

**Question:** What are `WeakMap` and `WeakSet`, and when do you use them?

**Solution:**

1. **Weak references**: They're collections whose references to their keys (WeakMap) or values (WeakSet) are **weak** — meaning they **don't prevent garbage collection**. If the only remaining reference to an object is inside a `WeakMap`/`WeakSet`, the GC is free to reclaim it, and the entry silently disappears.

2. **Primary use — side data without owning lifetime**: The canonical use is **attaching metadata to DOM nodes or class instances**: `const meta = new WeakMap(); meta.set(domNode, {...})`. When the DOM node is removed and otherwise unreferenced, the WeakMap entry is collected automatically — **no memory leak**. A regular `Map` would keep the node alive forever (a classic leak), because the Map's strong reference pins it.

3. **The tradeoff**: Because entries can **vanish at any time**, `WeakMap`/`WeakSet` are **not iterable** and expose **no `size`** — there's no `.keys()`, `.forEach()`, or `.clear()`. You can only `get`/`set`/`has`/`delete` by a specific object reference. (If entries could be enumerated, GC timing would become observable, which the spec forbids.)

4. **Rules and uses**: **Keys must be objects** (or non-registered symbols) — you can't use primitives, since primitives aren't garbage-collected. They were the standard way to implement **private fields** before `#private` class-field syntax existed (store per-instance private data in a module-scoped WeakMap). Great for **caches/memoization keyed by ephemeral objects** — the cache entry lives exactly as long as the key does.

5. **Advanced weak tools**: For finer control, **`WeakRef`** holds a weak reference to a *single* object (with `.deref()`), and **`FinalizationRegistry`** lets you register a cleanup callback to run *after* an object is collected — both advanced, use-sparingly tools.

**Evolution:**

1. **Leaky side tables**: Associating data with objects via a plain `Map` pinned them in memory, causing leaks.

2. **Weak collections**: `WeakMap`/`WeakSet` tied entry lifetime to key reachability, eliminating that leak class.

3. **Fine-grained control**: `WeakRef` and `FinalizationRegistry` added single-object weak refs and post-collection cleanup callbacks.

**Follow-ups:**

1. **Why not iterable**: Explain that enumeration would make GC timing observable, which the spec forbids.

2. **Private data**: Contrast module-scoped WeakMap privacy with modern `#private` class fields.

3. **Finalizer caveats**: Warn that `FinalizationRegistry` callbacks run unpredictably and shouldn't hold critical logic.

**Key points:**

1. **Object keys**: Keys must be objects (or non-registered symbols).

2. **Private fields**: Perfect for private fields pre-class-fields syntax.

3. **Ephemeral caches**: Use for caches keyed by ephemeral objects.

4. **Advanced refs**: `WeakRef` and `FinalizationRegistry` give finer-grained weak references.

---

### 47. Map vs object as dictionary

**Frequency:** Medium

**Question:** When should you use a `Map` versus a plain object as a dictionary?

**Solution:**

1. **Shared purpose**: Both store key→value pairs, but they have different guarantees and hazards.

2. **`Map` advantages**: **Any key type** — objects, functions, numbers, even `NaN` work as keys. Object keys use *reference* identity. Plain objects **coerce all keys to strings** (or symbols), so `obj[1]` and `obj['1']` collide. **Guaranteed insertion-order** iteration, and a clean iteration API (`for...of`, `.keys()`, `.values()`, `.entries()`). A **real `.size`** property (objects need `Object.keys(o).length`). **Better performance for frequent add/delete** of entries — Maps are optimized for churn. **No prototype** — no accidental collisions with inherited members.

3. **Plain object advantages**: **JSON-friendly** — `JSON.stringify` works directly; `Map` doesn't serialize natively. **Ergonomic literal syntax** and property access for fixed-shape records. First-class **TypeScript support** via `Record<K, V>` and interfaces.

4. **Prototype pollution gotcha**: Keys like **`__proto__`, `constructor`, `hasOwnProperty`** clash with inherited properties, so user-controlled keys on a plain object are a **security and correctness risk** (`obj['__proto__']` can corrupt the prototype). Maps are immune. If you must use an object as a dictionary with untrusted keys, create it with **`Object.create(null)`** — a prototype-less object with no inherited keys to collide with.

5. **Rule of thumb**: Use a **`Map` for dynamic keyed collections** (unknown/arbitrary keys, frequent add/remove, non-string keys, ordering matters); use a **plain object (or `Record<K,V>`) for fixed-shape records** you'll serialize to JSON. To convert a `Map` to JSON, use **`Object.fromEntries(map)`** (loses non-string keys) and `new Map(Object.entries(obj))` to go back.

**Evolution:**

1. **Objects as maps**: Plain objects were the default dictionary, despite string-coerced keys and prototype collisions.

2. **Dedicated Map**: ES6 `Map` added arbitrary keys, insertion order, `.size`, and churn-optimized performance.

3. **Safe objects & typing**: `Object.create(null)` and TypeScript's `Record<K,V>` hardened and typed object dictionaries for their remaining use cases.

**Follow-ups:**

1. **Serialization**: Convert via `Object.fromEntries(map)` / `new Map(Object.entries(obj))`, accepting non-string-key loss.

2. **Untrusted keys**: Use `Map` or `Object.create(null)` to avoid prototype pollution from user input.

3. **Performance profile**: Choose `Map` when entries churn frequently; objects when the shape is fixed.

**Key points:**

1. **Null-prototype object**: `Object.create(null)` gives a prototype-less dictionary.

2. **Iteration**: `Map` iteration is faster and more predictable.

3. **JSON conversion**: JSON doesn't natively serialize `Map` — convert via `Object.fromEntries`.

4. **Typing**: TypeScript's `Record<K, V>` is for object dictionaries.

---

### 48. TS: `unknown` vs `any` vs `never`

**Frequency:** Medium

**Question:** In TypeScript, how do `unknown`, `any`, and `never` differ?

**Solution:**

1. **Overview**: These are the three "special" types at the extremes of TypeScript's type system, and mixing them up is a common mistake.

2. **`any`**: The **escape hatch that turns type-checking off**. A value typed `any` can be assigned to/from anything, have any property accessed, and be called — with **zero compile-time safety**. Worse, it's **viral/infectious**: it propagates through return types and expressions, silently disabling checking wherever it flows (`const x: any = ...; const y = x.foo.bar()` — all unchecked). Treat `any` as a code smell.

3. **`unknown`**: The **type-safe counterpart to `any`**. It's the **top type**: anything is assignable *to* `unknown`, but you **can't do anything with an `unknown` value until you narrow it** to a specific type. This forces a safety check at the boundary:
```ts
function handle(x: unknown) {
  // x.foo  // ❌ compile error
  if (typeof x === 'string') x.toUpperCase(); // ✅ narrowed
}
```
Use **`unknown` for external/untrusted input** (`JSON.parse`, `fetch` responses, `catch` clause errors) so the compiler forces you to validate before use.

4. **`never`**: The **bottom type**: a value that *can never exist*. It's what a function returns if it **always throws or loops forever** (`function fail(): never`), and it's the type of a variable in an **unreachable branch**. Its killer use is **exhaustiveness checking**: in a `switch` over a union, an `assertNever(x: never)` in the `default` produces a **compile error the day someone adds a new union member** and forgets to handle it — turning a runtime bug into a build failure:
```ts
function assertNever(x: never): never { throw new Error(`Unexpected: ${x}`); }
```

5. **Gotchas**: **Empty arrays are inferred as `never[]`** without context (`const a = []` then pushing needs annotation); and enabling **`strict`/`noImplicitAny`** is what forces `unknown`/explicit types instead of silent `any` creeping in.

**Evolution:**

1. **Loose any**: Early/untyped code leaned on `any`, which disables checking and spreads through expressions.

2. **Safe top type**: `unknown` arrived as the type-safe boundary type requiring narrowing before use.

3. **Strictness enforcement**: `strict`/`noImplicitAny` plus `never`-based exhaustiveness turned silent runtime gaps into compile errors.

**Follow-ups:**

1. **Validating input**: Pair `unknown` with runtime schema validation (e.g. for `JSON.parse`/`fetch`) before narrowing.

2. **Exhaustiveness**: Use an `assertNever` default to catch unhandled union members at build time.

3. **Taming any**: Discuss migrating `any`-heavy code toward `unknown` and explicit types under `strict`.

**Key points:**

1. **Narrowing required**: `unknown` requires `typeof`/`instanceof`/predicate narrowing.

2. **Infection**: `any` infects through return types.

3. **Empty array inference**: Empty arrays are inferred as `never[]` without context.

4. **Compiler flags**: Use `noImplicitAny` and `strict` to catch slip-ups.

---

### 49. TS: generics, constraints, defaults

**Frequency:** Medium

**Question:** How do TypeScript generics work — constraints, defaults, and conditional types?

**Solution:**

1. **Generics parameterize types**: They let one definition work over many types while **preserving the relationship** between inputs and outputs. The identity function is the canonical example:
```ts
function id<T>(x: T): T { return x; } // id('a') is string, id(1) is number
```
Here `T` links the argument type to the return type — something `any` would lose. This is the litmus test: **use a generic only when a type parameter genuinely relates two positions** (arg↔return, key↔value). A generic that appears in just one spot is usually a disguised `any` and should just be that concrete type or `unknown`.

2. **Constraints (`T extends U`)**: They bound a type parameter to guarantee it has certain members:
```ts
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b; // safe: T is known to have .length
}
```
The **`extends keyof T`** pattern is especially common for type-safe property access:
```ts
function get<T, K extends keyof T>(obj: T, key: K): T[K] { return obj[key]; }
```

3. **Defaults (`<T = string>`)**: They provide a fallback when the caller doesn't specify or the compiler can't infer `T`, keeping generic APIs ergonomic.

4. **Conditional types (`T extends U ? X : Y`)**: They enable **type-level computation** — branching on types — and combined with **`infer`** (which *extracts* a type from within another) power the standard library:
```ts
type ElementType<T> = T extends (infer E)[] ? E : T; // unwrap array element type
```
This is exactly how built-ins like **`ReturnType`, `Parameters`, `Pick`, `Record`, and `Awaited`** are implemented under the hood — generic constraints plus conditional/mapped types.

5. **`NoInfer<T>` (TS 5.4+)**: One modern refinement blocks the compiler from inferring `T` from a *particular* argument position, so inference is driven by the position you intend (e.g. inferring from a config's allowed values, not from a default argument).

**Evolution:**

1. **Basic parameterization**: Generics began as a way to relate argument and return types without losing safety to `any`.

2. **Constraints and defaults**: `extends` bounds and `= default` parameters made generic APIs both safe and ergonomic.

3. **Type-level computation**: Conditional types with `infer` enabled a standard library of derived types (`ReturnType`, `Pick`, etc.).

4. **Inference control**: `NoInfer<T>` added precise control over which position drives inference.

**Follow-ups:**

1. **Over-genericizing**: Recognize when a lone type parameter is really `any`/`unknown` in disguise.

2. **Keyed access**: Use `K extends keyof T` and `T[K]` for type-safe property getters.

3. **Writing utility types**: Combine conditional types and `infer` to build custom mapped/derived types.

**Key points:**

1. **Relate two positions**: Avoid generics that aren't actually relating two positions.

2. **Property-name generics**: Use `extends keyof T` for property-name generics.

3. **Inference blocking**: `NoInfer<T>` (TS 5.4+) prevents inference from one position.

4. **Powering utilities**: Generic constraints power `Pick`, `Record`, etc.

---

### 50. TS: discriminated unions & exhaustiveness

**Frequency:** Medium

**Question:** What is a discriminated union in TypeScript, and how do you enforce exhaustiveness?

**Solution:**

1. **Definition**: A **discriminated (or "tagged") union** is a union of object types that all share a **common literal field** — the **discriminant** (conventionally `kind`, `type`, or `tag`). Because that field has a *distinct literal value* in each variant, TypeScript can **narrow** the whole object to a single variant just by checking it:
```ts
type Shape =
  | { kind: 'circle'; r: number }
  | { kind: 'square'; s: number };

function area(x: Shape): number {
  switch (x.kind) {
    case 'circle': return Math.PI * x.r ** 2;  // x narrowed: has .r
    case 'square': return x.s ** 2;            // x narrowed: has .s
    default: return assertNever(x);            // exhaustiveness guard
  }
}
```
Inside each `case`, TS knows exactly which variant `x` is, so accessing `x.r` (circle-only) is type-checked — no unsafe casts.

2. **Exhaustiveness**: It's the killer feature. By adding `default: return assertNever(x)` (where `assertNever(x: never): never`), you make the compiler **fail the build if a new variant is added but not handled**. When you add `{ kind: 'triangle'; ... }` to `Shape`, the un-handled `x` in `default` is no longer `never`, so `assertNever(x)` errors — turning "I forgot to update this switch" from a silent runtime bug into a compile error you *can't* miss.

3. **Discriminators must be literal types**: `'circle'`, not `string`, for narrowing to work — which is why you often pair union construction with **`as const`** so string fields are inferred as literals rather than widened to `string`.

4. **Where this pattern appears**: This pattern is everywhere: **Redux/Zustand action objects are textbook discriminated unions** (`{ type: 'increment' }`), as are state machines and API result types (`{ status: 'success' } | { status: 'error' }`).

5. **`satisfies` operator**: It helps here too — it validates a value against a type **without widening** it, preserving the narrow literal inference the discriminant needs.

**Evolution:**

1. **Loose unions**: Plain object unions without a shared tag couldn't be narrowed safely, forcing casts.

2. **Tagged narrowing**: Adding a literal discriminant let the compiler narrow variants in `switch`/`if`.

3. **Build-time exhaustiveness**: `assertNever` on a `never` default turned missing-case bugs into compile errors.

4. **Literal preservation**: `as const` and `satisfies` kept discriminant fields as literals so narrowing stays reliable.

**Follow-ups:**

1. **Adding variants**: Show how exhaustiveness guards flag every unhandled switch when a new variant lands.

2. **Literal widening**: Use `as const`/`satisfies` to stop string fields widening to `string` and breaking narrowing.

3. **Real-world modeling**: Apply the pattern to Redux actions, state machines, and `success`/`error` result types.

**Key points:**

1. **Literal discriminators**: Discriminators must be literal types.

2. **Redux/Zustand**: Redux/Zustand actions are classic discriminated unions.

3. **satisfies**: `satisfies` operator helps preserve narrow inference.

4. **as const**: Pair with `as const` for inferred literals.

---

### 51. TS: utility types (Partial/Pick/Omit/Record/ReturnType)

**Frequency:** Medium

**Question:** What are TypeScript's built-in utility types, and how do you compose them?

**Solution:**

1. **Purpose**: Utility types are **generic type transformers** in the standard library that derive new types from existing ones — so you define a shape once and mechanically produce variants, keeping types **DRY** and in sync.
2. **Partial/Required**: **`Partial<T>`** makes every property optional — ideal for **update/patch** payloads and form drafts: `function update(id, changes: Partial<User>)`. **`Required<T>`** is the inverse; makes all optional props required.
3. **Pick/Omit**: **`Pick<T, K>`** selects a subset of keys — `Pick<User, 'id' | 'name'>` builds a lightweight DTO. **`Omit<T, K>`** removes keys — `Omit<User, 'password'>` for a safe API response.
4. **Record & function extractors**: **`Record<K, V>`** builds a dictionary type: `Record<string, number>`, `Record<UserId, User>`. **`ReturnType<F>`** extracts a function's return type; **`Parameters<F>`** extracts its argument tuple — great for inferring types from existing functions instead of re-declaring them. **`Awaited<T>`** unwraps a `Promise` (recursively): `Awaited<Promise<string>>` is `string`.
5. **Composition**: They **compose**, which is where the power is — you chain them to model real API/DTO contracts:
```ts
type UserForm = Partial<Omit<User, 'id' | 'createdAt'>>;
type UserResponse = Omit<User, 'passwordHash'>;
type Handlers = Record<EventName, (e: Event) => void>;
```
6. **Others worth knowing**: **`Readonly<T>`** for immutable shapes (all props `readonly`); **`NonNullable<T>`** strips `null | undefined` from a type; and **`Exclude<U, X>` / `Extract<U, X>`** filter *union members* (`Exclude<'a'|'b'|'c', 'a'>` is `'b'|'c'`).
7. **Rolling your own**: When the built-ins fall short, you **roll your own** with **mapped types** (`{ [K in keyof T]: ... }`) plus **conditional types** — which is exactly how these utilities are implemented internally.

**Evolution:**

1. **Hand-written variants → utility types**: Teams start by manually declaring `UserUpdate`, `UserDto`, etc., then collapse them into `Partial`/`Pick`/`Omit` compositions so one source shape stays authoritative.
2. **Built-ins → custom mapped/conditional types**: As requirements outgrow the standard library, derive bespoke transformers with `{ [K in keyof T]: ... }` and conditional types — the same mechanism the built-ins use.
3. **Inference over declaration**: Shift from re-declaring types to extracting them (`ReturnType`/`Parameters`/`Awaited`) so types follow the implementation automatically.

**Follow-ups:**

1. **Pick vs Omit tradeoff**: `Pick` is additive (safe when new sensitive fields appear); `Omit` is subtractive (a new field leaks by default) — which do you default to for API responses?
2. **Deep vs shallow**: `Partial`/`Readonly` are shallow — how do you build a recursive `DeepPartial<T>` with a mapped + conditional type?
3. **Union filtering**: When do you reach for `Exclude`/`Extract` (union members) versus `Omit`/`Pick` (object keys)?

**Key points:**

1. **Readonly**: `Readonly<T>` for immutable shapes.
2. **NonNullable**: `NonNullable<T>` strips `null | undefined`.
3. **Exclude/Extract**: filter union members.
4. **Custom**: Roll your own with mapped + conditional types when built-ins fall short.

---

### 52. Currying & partial application

**Frequency:** Medium

**Question:** What are currying and partial application, and how do they differ?

**Solution:**

1. **Shared idea**: Both **transform a multi-argument function into one you apply in stages**, but they're not the same thing.
2. **Currying**: converts a function of N arguments into **N nested unary (one-argument) functions**: `f(a, b, c)` becomes `f(a)(b)(c)`. Each call takes exactly one argument and returns another function until the last one, which finally computes the result.
```js
const add = a => b => a + b;
add(1)(2); // 3
```
3. **Partial application**: is looser — it **fixes *some* arguments now** and returns a function expecting **the rest** — not necessarily one at a time.
```js
const add3 = (a, b, c) => a + b + c;
const add10 = add3.bind(null, 10);   // fixes a; expects (b, c)
add10(20, 30); // 60
```
4. **The distinction**: currying always produces a chain of *unary* functions; partial application just **pre-fills any number** of arguments and leaves a function of the remaining arity. Currying is one specific way to *enable* partial application.
5. **Why they matter**: Both power the same functional patterns — **specializing a general function into a reusable one** (`const inc = add(1)`), **point-free composition** (piping data through pre-configured functions without naming intermediate variables), and **dependency-injection-style configuration** (bake in a logger/config once, call with data later).
6. **Practical notes**: **`Function.prototype.bind`** is built-in partial application (its first arg sets `this`, the rest pre-fill parameters). Libraries like **Ramda and lodash/fp** ship **auto-curried** functions (call with fewer args → get back a function; all args → get the result), and put the **data argument last** specifically so currying composes cleanly (`map(addOne)` yields a list transformer). Watch out for **`this` binding and variadic/optional-argument functions** — they **don't curry cleanly** because the fixed arity currying assumes doesn't hold.

**Evolution:**

1. **Manual nesting → auto-curry helpers**: Teams begin with hand-written `a => b => ...` chains, then adopt Ramda/lodash-fp auto-curried functions that curry to any depth automatically.
2. **Positional args → data-last design**: As composition grows, APIs move the data argument last so `pipe`/`compose` of pre-configured functions reads cleanly.
3. **Ad-hoc binding → point-free pipelines**: `bind`-based partials evolve into declarative point-free pipelines where intermediate variables disappear.

**Follow-ups:**

1. **Variadic functions**: Why can't `(...args) => ...` or optional-argument functions curry cleanly, and how do fixed-arity wrappers fix it?
2. **`this` trap**: What breaks when you curry a method that depends on `this`, and how does `bind` interact?
3. **Readability cost**: When does deep currying/point-free style hurt debuggability versus a plain multi-arg call?

**Key points:**

1. **bind**: `Function.prototype.bind` does partial application.
2. **Libraries**: Ramda/lodash-fp ship auto-curried versions.
3. **Caveats**: Beware of `this` and arity (variadic functions don't curry cleanly).
4. **Use case**: Useful for HOFs like `map(addOne, list)`.

---

### 53. HOFs & composition

**Frequency:** Medium

**Question:** What are higher-order functions and function composition?

**Solution:**

1. **HOF definition**: A **higher-order function (HOF)** is a function that **takes a function as an argument, returns a function, or both** — functions treated as ordinary values. The array methods you use daily are HOFs: **`map`, `filter`, `reduce`** all accept a callback. So do combinators like **`compose`** and **`pipe`**. HOFs let you **abstract over behavior**, not just data.
2. **Composition**: chains small **unary (single-argument)** functions so the output of one feeds the next. `pipe` runs **left-to-right**, `compose` **right-to-left**:
```js
const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);
pipe(f, g, h)(x); // === h(g(f(x)))

const compose = (...fns) => x => fns.reduceRight((v, f) => f(v), x);
compose(h, g, f)(x); // === h(g(f(x)))
```
3. **reduce is universal**: Notice `pipe` is itself implemented with **`reduce`** — which is the point: **`reduce` is the universal HOF** from which `map`, `filter`, and the others can all be derived (they're just reduces with specific accumulators).
4. **Why it matters**: composition encourages **small, single-purpose, independently testable functions** that you assemble into **declarative data pipelines** — you read `pipe(parse, validate, normalize, save)` as a sentence, with no intermediate variables or imperative plumbing (**point-free style**).
5. **Caveats**: a very **long composition chain** can add call-stack depth and overhead, and naive `pipe` over arrays creates a **new intermediate array at every step** (`.map().filter().map()`). **Transducers** solve the latter by composing the *transformations* and doing a **single pass with no intermediate collections**.
6. **Directional convention**: `compose` is math-style right-to-left (`compose(h,g,f)`), `pipe` is reading-order left-to-right (`pipe(f,g,h)`) — same result, opposite argument order.

**Evolution:**

1. **Imperative loops → declarative pipelines**: Code migrates from manual for-loops with temp variables to `pipe(parse, validate, normalize, save)` chains of small functions.
2. **Chained array methods → transducers**: When `.map().filter().map()` allocates too many intermediate arrays, switch to transducers that compose the transformations into a single pass.
3. **Many combinators → reduce**: Recognizing `reduce` as the universal HOF lets teams derive or replace specialized combinators with one primitive.

**Follow-ups:**

1. **pipe vs compose**: Why keep both when they produce the same result — is the only difference argument order/readability?
2. **Performance**: At what chain length does call-stack depth or intermediate allocation actually matter, and when are transducers worth the complexity?
3. **Debuggability**: How do you debug a point-free pipeline with no named intermediate values?

**Key points:**

1. **Universal HOF**: `reduce` is the universal HOF — all others can be derived.
2. **Chain cost**: Watch for chain length impact on stack/perf.
3. **Transducers**: Transducers compose without intermediate arrays.
4. **Direction**: Compose right-to-left, pipe left-to-right by convention.

---

### 54. Memoization & pitfalls

**Frequency:** Medium

**Question:** What is memoization, and what are its pitfalls?

**Solution:**

1. **Definition**: **Memoization** caches a function's **return value keyed by its arguments**, so repeat calls with the same inputs return the cached result instead of recomputing. It's a classic **time-for-space** trade:
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
2. **When it's valid**: It only works correctly for **pure, deterministic functions** — same input must always produce the same output with no side effects (memoizing something that reads a clock or DB gives stale results). It pays off when the function is **expensive** and inputs **repeat** and are **hashable**.
3. **Unbounded growth**: **Unbounded cache growth = memory leak.** A `Map`-backed cache keeps every result forever. For long-lived or high-cardinality inputs, use an **LRU cache** to bound size, or a **`WeakMap`** when keying by objects (entries are GC'd when the key object dies).
4. **Reference keys**: **Reference-based keys miss hits.** Keying by object identity means two structurally-equal-but-different objects (`{a:1}` vs `{a:1}`) are treated as different — cache misses. Serializing keys (`JSON.stringify`) fixes equality but is slow and breaks on functions/cycles/order.
5. **Async races**: **Async race conditions.** Memoizing a `Promise`-returning function must cache the **in-flight Promise** (not just the resolved value), or concurrent callers before the first resolves each fire their own request. Also decide whether to **evict on rejection** so a transient failure isn't cached forever.
6. **Don't memoize cheap work**: if the cache lookup (hashing the key, Map access) costs more than just recomputing, you've made it slower.
7. **React scoping**: In React, **`useMemo`/`useCallback` are memoization scoped to a component's renders**, keyed by the dependency array — same principle, plus the goal of preserving **referential identity** across renders.

**Evolution:**

1. **Map cache → LRU/WeakMap**: Start with a `Map`, then bound memory with an LRU cache (high-cardinality inputs) or `WeakMap` (object keys that should be GC-able).
2. **Sync values → in-flight Promises**: Extend memoization to async by caching the pending Promise and deciding an eviction-on-rejection policy.
3. **Manual memo → framework/compiler memo**: React's `useMemo`/`useCallback`, and React 19's auto-memoizing compiler, scope memoization to render cycles automatically.

**Follow-ups:**

1. **Key strategy**: `JSON.stringify` keys vs structural hashing vs reference identity — what breaks (cycles, key order, functions) and how do you choose?
2. **Eviction**: How do you size an LRU and decide TTL for memoized network results?
3. **When not to**: How do you measure whether lookup cost exceeds recomputation for cheap functions?

**Key points:**

1. **React hooks**: React's `useMemo`/`useCallback` are memoization with referential identity.
2. **Map keys**: `Map`-backed memo handles object keys but leaks.
3. **LRU**: LRU caches bound memory.
4. **Cheap ops**: Don't memoize cheap operations — the cache lookup costs more.

---

### 55. Iterating large lists without blocking main thread

**Frequency:** Medium

**Question:** How do you process a large list without blocking the main thread?

**Solution:**

1. **The problem**: The browser's main thread handles **JS, layout, paint, and input**, so a single long synchronous loop **freezes the whole page** — no scrolling, no clicks, no rendering. Any task over **~50ms is a "long task"** that hurts **INP** and feels janky.
2. **Chunk the work and yield**: split the list into batches, process one batch, then **hand control back to the event loop** so the browser can render and respond, then continue. Yielding primitives, best to worst:
   - **`scheduler.yield()`** — the modern, purpose-built yield (resumes with high priority so your task isn't starved).
   - **`scheduler.postTask({ priority })`** — the Prioritized Task Scheduling API, lets you schedule chunks at `user-blocking`/`user-visible`/`background` priority.
   - **`requestIdleCallback`** — runs chunks only during idle time (good for truly low-priority work).
   - **`MessageChannel`** or **`setTimeout(0)`** — older fallbacks (`setTimeout` has a ~4ms clamp).
```js
async function processInChunks(items, fn, size = 500) {
  for (let i = 0; i < items.length; i += size) {
    items.slice(i, i + size).forEach(fn);
    await scheduler.yield(); // let the browser breathe
  }
}
```
   **Async generators** pair naturally with this chunked model.
3. **Offload pure CPU work to a Web Worker**: if the processing is heavy computation with no DOM needs (parsing, crunching numbers, image processing), move it to a **background thread** entirely so the main thread stays free. Communicate via `postMessage` (or `Comlink` for RPC ergonomics).
4. **Virtualize rendering**: if the cost is *rendering* thousands of rows (not computing them), don't. Use **windowing/virtualization** (`react-window`, `TanStack Virtual`) so only the **visible rows are mounted** to the DOM, with spacers faking the scroll height — constant DOM size regardless of list length.
5. **React priority**: In React, **`startTransition`** (React 18) additionally marks a state update as **low-priority**, letting urgent updates (typing) interrupt an expensive re-render.

**Evolution:**

1. **setTimeout(0) → scheduler API**: Older yield fallbacks (`setTimeout`/`MessageChannel`) give way to `scheduler.yield()` and `scheduler.postTask({ priority })` with real priority control.
2. **Main-thread chunking → Web Workers**: As CPU work grows and needs no DOM, move it entirely off-thread with workers (and `Comlink` for ergonomics).
3. **Render everything → virtualize**: When the bottleneck shifts from computing to rendering rows, adopt windowing so DOM size stays constant.

**Follow-ups:**

1. **Which strategy**: How do you decide between chunk-and-yield, a Web Worker, and virtualization for a given workload?
2. **Measuring**: How do you confirm you've eliminated long tasks (>50ms) and improved INP?
3. **Worker cost**: When does `postMessage` serialization overhead outweigh the benefit of off-threading, and when do `Transferable` objects help?

**Key points:**

1. **Modern primitive**: `scheduler.postTask({ priority })` (Prioritized Task Scheduling API) is the modern primitive.
2. **Generators**: Async generators pair well with chunked processing.
3. **Long tasks**: Long tasks (>50ms) hurt INP.
4. **React**: React 18's `startTransition` defers low-priority renders.

---

### 56. Web Workers vs Service Workers vs Shared Workers

**Frequency:** Medium

**Question:** Compare Web Workers, Service Workers, Shared Workers, and Worklets.

**Solution:**

1. **Common traits**: All run JavaScript **off the main thread** and **have no DOM access**, but they serve very different purposes.
2. **Web Worker (Dedicated Worker)**: a background thread for **CPU-bound work** (parsing, encryption, image/data processing) so the UI stays responsive. It's **owned by one page**, communicates via **`postMessage`**, and dies with its page. This is the go-to for "my computation freezes the UI."
3. **Service Worker**: not a compute thread but a **programmable network proxy** sitting between the page and the network. It intercepts **`fetch`** events, enabling **offline support (caching strategies), push notifications, and background sync**. Its defining trait is a **lifecycle independent of any page** (`install → activate → fetch`) — it keeps running/waking after tabs close, which is what makes PWAs work. It **requires HTTPS** (except `localhost`) because a network-intercepting script is a serious security surface.
4. **Shared Worker**: a single worker instance that **multiple same-origin tabs/windows share** (connected via ports). Useful for coordinating state or a single WebSocket across tabs. Caveat: **not supported on Safari (including iOS)**, limiting its practicality — many use a Service Worker or `BroadcastChannel` instead.
5. **Worklets**: lightweight, highly-specialized workers for **rendering-pipeline extension points**: Paint Worklet (`paint()` in CSS), Audio Worklet (real-time audio processing), Animation Worklet, Layout Worklet. They run tiny, tightly-scoped code, not general logic.
6. **Communication details**: messages are copied via the **structured clone algorithm** by default, but you can pass **`Transferable` objects** (`ArrayBuffer`, `MessagePort`, `OffscreenCanvas`) to **transfer ownership zero-copy** — essential for moving large buffers without cloning cost. **Comlink** wraps `postMessage` in a **Promise-based RPC** so calling a worker feels like calling a local async function.

**Evolution:**

1. **Clone → transfer**: Start with default structured-clone `postMessage`, then move large buffers with `Transferable` objects for zero-copy performance.
2. **Raw postMessage → RPC**: Wrap the message protocol with Comlink so workers are called like local async functions.
3. **Per-tab → cross-tab coordination**: When state must be shared across tabs, graduate from a dedicated Web Worker to a Shared Worker, Service Worker, or `BroadcastChannel` (given Safari's Shared Worker gap).

**Follow-ups:**

1. **Picking a worker**: For offline caching vs heavy computation vs cross-tab state, which worker type fits and why?
2. **Service Worker lifecycle**: How do `install`/`activate`/`fetch` and the "waiting" state cause stale-cache bugs on deploy?
3. **Shared Worker fallback**: Given no Safari support, how do you coordinate a single WebSocket across tabs?

**Key points:**

1. **Transfer**: Workers communicate via structured cloning or `Transferable` objects (zero-copy).
2. **HTTPS**: Service Workers require HTTPS (except localhost).
3. **Comlink**: Comlink wraps `postMessage` as RPC.
4. **Safari**: Shared Workers are not supported in Safari mobile.

---

### 57. `React.memo`

**Frequency:** Medium

**Question:** What does `React.memo` do, and when does it actually help?

**Solution:**

1. **What it does**: **`React.memo(Component)`** wraps a **function component** so that, when its parent re-renders, React **skips re-rendering the child if its props are shallowly equal** to the previous render. It's the component-level equivalent of `useMemo` — memoizing the *rendered output* by props.
2. **When it helps**: it only helps under specific conditions — the component must **render often** (a frequently-updating parent) *and* receive **usually-stable props**. If the parent rarely renders, or the props change every time anyway, `memo` just adds a props-comparison cost for no benefit. Memoizing indiscriminately is net-negative.
3. **The #1 gotcha**: **inline object/function/array props defeat it**. Since `{}`, `[]`, and `() => {}` create a **new reference every render**, the shallow comparison always sees "changed" and re-renders anyway:
```jsx
<Child data={{ id }} onClick={() => go()} /> // new refs each render → memo useless
```
   The fix is to **stabilize those props with `useMemo`/`useCallback`** so their identity persists across renders. This is exactly why `memo` and `useCallback` are usually deployed together — one without the other often does nothing.
4. **Custom comparator**: You can pass a **custom comparator** as the second argument for deep equality, but it's **rarely worth it** — a deep compare on every render can cost more than the re-render it prevents.
5. **Guidance**: often it's simpler to **wrap an expensive child's *computation* in `useMemo`** than to plumb `memo` + stable props everywhere. Always **confirm the win with the React DevTools Profiler** rather than sprinkling `memo` preemptively.
6. **React 19**: **React 19's compiler auto-memoizes** components and values, making most manual `React.memo` usage unnecessary.

**Evolution:**

1. **Manual memo → stable props**: Wrapping with `memo` alone does nothing until props are stabilized with `useMemo`/`useCallback`, so the two are adopted together.
2. **Component memo → computation memo**: Teams shift from plumbing `memo` + stable props everywhere to simply wrapping the expensive computation in `useMemo`.
3. **Manual → compiler memoization**: React 19's compiler auto-memoizes components and values, retiring most hand-written `React.memo`.

**Follow-ups:**

1. **Net cost**: When does `memo`'s props comparison cost more than the re-render it prevents?
2. **Comparator risk**: What are the dangers of a custom deep-equality comparator (cost, stale closures)?
3. **Compiler era**: In React 19, when is manual `memo` still justified?

**Key points:**

1. **Inline props**: Inline object/function props defeat memo — wrap with `useMemo`/`useCallback`.
2. **React 19**: React 19 compiler auto-memoizes, reducing manual `memo` usage.
3. **useMemo**: Use `useMemo` for expensive children rather than memo + props plumbing.
4. **Profiler**: Test with Profiler to confirm the win.

---

### 58. Context — propagation cost & splitting

**Frequency:** Medium

**Question:** What is the re-render cost of React Context, and how do you mitigate it?

**Solution:**

1. **Propagation cost**: When a Context Provider's **`value` changes, *every* consumer of that context re-renders** — unconditionally, no matter how deep in the tree or whether it actually uses the part that changed. Context has **no built-in selector**: consuming the context subscribes you to the *whole* value.
2. **Where it bites**: This becomes a performance problem when you put **frequently-changing state** in a single, widely-consumed provider. If one big `AppContext` holds theme + user + cart + live data, then every cart tick or data update re-renders **all** consumers of theme and user too — potentially the entire app.
3. **Inline value trap**: a second, subtler trap — **an inline `value` object re-creates a new reference every render**, so even if nothing meaningfully changed, consumers re-render:
```jsx
<Ctx.Provider value={{ user, setUser }}> // new object each render → all consumers re-render
```
   Fix by **wrapping the value in `useMemo`** so its identity is stable when the underlying data hasn't changed.
4. **Split by update frequency**: the main structural mitigation is **splitting contexts by update frequency** — separate providers for `ThemeContext` (rarely changes), `UserContext` (occasionally), and `CartContext` (often). Now a cart update only re-renders cart consumers, leaving theme/user consumers untouched. The guiding principle: **treat Context as dependency injection for relatively-stable values**, not as a high-frequency state store.
5. **Dedicated stores**: When you genuinely need **fine-grained subscriptions to fast-changing global state**, reach for a dedicated store — **Zustand, Jotai, or Redux** — which support **selector-based subscriptions** so a component only re-renders when the *specific slice it selects* changes. (`use-context-selector` is a third-party library that retrofits selectors onto Context.)
6. **React 19 `use`**: Note **React 19's `use(Context)`** hook can read context **conditionally** (unlike `useContext`, which can't be called after an early return), adding flexibility but not changing the propagation cost.

**Evolution:**

1. **One mega-context → split contexts**: Break a single `AppContext` into theme/user/cart providers segmented by update frequency so updates re-render only relevant consumers.
2. **Inline value → memoized value**: Stabilize the provider `value` with `useMemo` to stop spurious re-renders from new object identity.
3. **Context → selector store**: For fast-changing global state, graduate to Zustand/Jotai/Redux (or `use-context-selector`) with selector-based subscriptions.

**Follow-ups:**

1. **Context vs store**: At what update frequency should you abandon Context for a selector-based store?
2. **Selector retrofit**: How does `use-context-selector` achieve fine-grained subscriptions that native Context can't?
3. **`use(Context)`**: What does React 19's conditional `use(Context)` enable, and why doesn't it reduce propagation cost?

**Key points:**

1. **Selector**: `useContextSelector` (third-party) enables fine-grained subscription.
2. **Memoize value**: Wrap provider value in `useMemo` to keep identity stable.
3. **DI role**: Context is for dependency injection, not high-frequency state.
4. **React 19**: React 19's `use(Context)` reads context conditionally.

---

### 59. Refs & forwardRef

**Frequency:** Medium

**Question:** What are refs in React, and what does `forwardRef` do (and how has React 19 changed it)?

**Solution:**

1. **Definition**: A **ref** is a **mutable container that persists across renders but does *not* trigger a re-render when you change it** — the opposite of state. `useRef(initial)` returns an object whose **`.current`** you read and write freely:
```js
const count = useRef(0);
count.current++; // no re-render
```
2. **Two main uses**:
   1. **DOM access** — attach `ref` to a JSX element and `.current` becomes the DOM node, enabling **imperative operations** the declarative model can't express: `.focus()`, `.scrollIntoView()`, measuring size/position (`getBoundingClientRect`), integrating non-React libraries (charts, maps, video players).
   2. **Instance-like mutable values** — holding a timer id, the previous value of a prop, a WebSocket, or any "I need to remember this but rendering doesn't depend on it" value.
3. **forwardRef**: **`forwardRef`** solved a limitation — normally a parent's `ref` can't reach a **child component's** DOM node (function components don't receive `ref` as a regular prop). `forwardRef` **forwards** the parent's ref down to an element inside the child, so `<FancyInput ref={r} />` can focus the real `<input>`.
4. **React 19 change**: **React 19 makes `ref` an ordinary prop** — you can just destructure `ref` from props directly — which **deprecates `forwardRef`** (the wrapper is no longer needed).
5. **Best practices**: **don't read/write refs during render** (it's a side effect; the DOM ref isn't even attached yet on first render) — use them in effects or event handlers. **`useImperativeHandle`** lets a component **curate a limited API** it exposes through a ref (e.g. expose only `{ focus, reset }` instead of the raw DOM node). **Callback refs** (`ref={node => ...}`) run on **mount (node) and unmount (null)**, useful for measuring or attaching on attach.
6. **Escape hatch mindset**: Overall, refs are **escape hatches** — prefer declarative state/props and reach for refs only when the DOM genuinely requires imperative control.

**Evolution:**

1. **forwardRef wrapper → ref as prop**: React 19 passes `ref` as an ordinary prop, deprecating the `forwardRef` wrapper boilerplate.
2. **Raw DOM node → curated handle**: Replace exposing the full DOM node with `useImperativeHandle` to publish a minimal `{ focus, reset }` API.
3. **Object ref → callback ref**: When you need mount/unmount hooks (measuring, attaching), move from object refs to callback refs.

**Follow-ups:**

1. **Ref vs state**: When does a value belong in a ref (no re-render) versus state (triggers re-render)?
2. **Imperative API design**: How do you decide what minimal surface to expose via `useImperativeHandle`?
3. **Migration**: How do you migrate a `forwardRef` component library to React 19's ref-as-prop without breaking consumers?

**Key points:**

1. **No render reads**: Don't read refs during render (except for cached values).
2. **Curate API**: `useImperativeHandle` curates what `forwardRef` exposes.
3. **Callback refs**: Callback refs (`ref={node => ...}`) run on mount/unmount.
4. **Escape hatch**: Refs are escape hatches — prefer declarative patterns.

---

### 60. Error boundaries

**Frequency:** Medium

**Question:** What are React error boundaries, and what do they *not* catch?

**Solution:**

1. **Definition**: An **error boundary** is a component that **catches JavaScript errors thrown by its descendants during rendering**, and shows a **fallback UI** instead of letting the whole app crash to a blank screen (React unmounts the entire tree on an uncaught render error).
2. **Must be a class with**: They must be **class components** implementing one or both of:
   - **`static getDerivedStateFromError(error)`** — runs during render to set fallback state (return the new state, e.g. `{ hasError: true }`).
   - **`componentDidCatch(error, info)`** — runs after, for **side effects like logging** to Sentry/Datadog with the component stack.
3. **What they catch**: error boundaries only catch errors in the **render phase, lifecycle methods, and constructors** of the tree below them.
4. **What they do NOT catch**:
   - **Event handlers** — an error in an `onClick` isn't a render error; wrap it in **`try/catch`** and set error state manually.
   - **Asynchronous code** — `setTimeout`, Promises, `async`/`await`, `fetch` callbacks run outside React's render; handle with `try/catch` / `.catch`.
   - **Server-side rendering** errors.
   - **Errors thrown in the boundary itself** (it can only catch *below* it).
5. **Why the exclusions**: error boundaries hook into React's *rendering* pipeline, and event handlers/async code execute outside it.
6. **Practical usage**: **wrap routes and independent features** in boundaries so one broken widget degrades gracefully instead of taking down the page. The **`react-error-boundary`** library gives an ergonomic wrapper with a `FallbackComponent`, an **`onError`** logging hook, and a **`resetErrorBoundary()`** to recover — you can also **reset by changing the boundary's `key`** (remounting it) when navigation or new data should clear the error.
7. **React 19**: Note **React 19 still requires class components** for boundaries — there's no Hook equivalent yet (`react-error-boundary` just wraps a class for you).

**Evolution:**

1. **App-wide crash → scoped boundaries**: Move from a single top-level boundary to wrapping routes and independent features so one widget fails in isolation.
2. **Raw class → react-error-boundary**: Adopt the library's `FallbackComponent`, `onError`, and `resetErrorBoundary()` for ergonomic recovery.
3. **Render-only → full coverage**: Pair boundaries with `try/catch` in event handlers and `.catch` on async code to cover what boundaries can't.

**Follow-ups:**

1. **Async gap**: Since boundaries miss async/event-handler errors, how do you funnel those into the same fallback/logging path?
2. **Reset strategy**: When do you reset via `key` remount versus `resetErrorBoundary()`, and how do you avoid an error loop?
3. **Granularity**: How finely should you wrap features — per route, per widget — to balance resilience against fallback sprawl?

**Key points:**

1. **Library**: React-error-boundary library provides a hook-friendly wrapper.
2. **Logging**: Log to Sentry/Datadog inside `componentDidCatch`.
3. **Reset**: Reset state by changing the boundary's `key` or via `resetErrorBoundary`.
4. **Class-only**: React 19 still requires class boundaries — no hook equivalent yet.

---

### 61. Suspense & concurrent features

**Frequency:** Medium

**Question:** What are Suspense and React's concurrent features?

**Solution:**

1. **Suspense boundary**: **`Suspense`** is a boundary component that shows a **fallback** (spinner, skeleton) while a descendant is **"suspending"** — the mechanism being that a component **throws a Promise** to signal "I'm not ready; re-render me when this resolves." React catches it, renders the nearest `<Suspense fallback={...}>`, and retries when the Promise settles.

2. **Two main uses**: **Lazy code loading** — `const X = lazy(() => import('./X'))` suspends until the chunk downloads. **Data fetching** — Suspense-enabled data layers (React Query, Relay, RSC, the `use()` hook) suspend until data arrives, letting you write components as if data were synchronous and declare loading UI **declaratively** at a boundary rather than threading `isLoading` everywhere.

3. **Nested boundaries**: You can **nest boundaries** for **granular loading states** — an outer skeleton for the page, inner ones per widget, so fast parts show immediately while slow parts spin.

4. **Concurrent features**: (React 18) let React **interrupt and prioritize rendering** so the UI stays responsive under load. **`startTransition` / `useTransition`** — mark a state update as **low-priority ("transition")**, so urgent updates (typing in a filter box) can **interrupt** the expensive re-render (the filtered list). `useTransition` returns **`[isPending, startTransition]`** so you can show a subtle pending indicator. **`useDeferredValue`** — render with a **lagging copy** of a fast-changing value, letting the input stay snappy while the expensive derived UI catches up.

5. **Streaming SSR foundation**: These build on the same foundation as **Server Components and streaming SSR**: the server **flushes HTML in chunks as data resolves**, sending Suspense fallbacks first and streaming in the real content as each boundary's data becomes ready — dramatically improving perceived load. The old "throw a Promise" convention is now **formalized via the `use()` hook**, which unwraps a Promise (or context) and integrates cleanly with Suspense.

**Evolution:**

1. **Class error boundaries → Suspense**: Loading states moved from manual `isLoading` flags threaded through props to declarative boundaries that catch thrown Promises.

2. **Sync → concurrent rendering**: React 18 added interruptible rendering (`startTransition`, `useDeferredValue`) so expensive updates no longer block urgent user input.

3. **Convention → `use()` hook**: The informal "throw a Promise" protocol was formalized into the `use()` hook, enabling first-class data/context unwrapping integrated with streaming SSR and RSC.

**Follow-ups:**

1. **Fallback flicker**: Rapidly resolving data can flash a fallback; `startTransition` keeps the old UI visible during a transition to avoid jarring spinners.

2. **Error handling**: Suspense handles loading, but errors still need an **error boundary** — pair the two for complete UX.

3. **Over-nesting cost**: Too many boundaries fragment the UI into independent spinners; balance granularity against a coherent loading experience.

**Key points:**

1. **Lazy integration**: `lazy(() => import(...))` integrates with Suspense.

2. **useTransition signature**: `useTransition` returns `[isPending, startTransition]`.

3. **Nesting**: Boundaries can be nested for granular loading states.

4. **Formalized hook**: Throwing Promises from arbitrary hooks is now formalized via `use()`.

---

### 62. Server Components vs client components

**Frequency:** Medium

**Question:** How do React Server Components differ from client components?

**Solution:**

1. **Core distinction**: **React Server Components (RSC)** render **only on the server** and their code is **never shipped to the browser** — the client receives their *output*, not their JavaScript. **Client components** (marked with the **`'use client'`** directive) are the traditional interactive components that ship JS and hydrate in the browser.

2. **Direct server access**: Because RSC run on the server, they can **directly access server resources** — query a database, read the filesystem, use secrets/API keys — with **no API layer** and no risk of leaking credentials to the client:
```jsx
// Server Component — runs on server, zero client JS
async function ProductList() {
  const products = await db.query('SELECT ...'); // direct DB access
  return products.map(p => <Product key={p.id} {...p} />);
}
```
They render to a **serialized format** (the RSC payload) that the client uses to construct the tree, **hydrating client components as interactive "islands"** around the static server-rendered parts.

3. **Tradeoffs**: RSC **shrink the client bundle** (heavy deps like markdown parsers, date libraries stay on the server) and **centralize data fetching** (fetch right where you render, no prop-drilling or effect waterfalls). The cost is that **interactivity is confined to client islands** — you compose server components for structure/data and drop into `'use client'` where you need interaction.

4. **Constraints**: The constraints follow from "there's no browser and no re-render": Server Components **can't use state, effects, or event handlers** (`useState`, `useEffect`, `onClick`) or **browser APIs** (`window`, `localStorage`) — those only exist client-side. **Props passed from a server component to a client component must be serializable** (no functions, class instances, Dates cross the boundary as-is) — because they're serialized in the RSC payload.

5. **Mutations and adopters**: **Mutations** are handled by **Server Actions** (`'use server'` async functions callable from the client, e.g. from a form), giving type-safe server mutations without hand-writing API routes. Primary adopters are **Next.js (App Router)** and emerging support in other frameworks.

**Evolution:**

1. **CSR → SSR → RSC**: Rendering moved from client-only, to server-rendered-then-hydrated, to a split model where most of the tree ships zero JS and only islands hydrate.

2. **API routes → Server Actions**: Mutations evolved from hand-written REST/API endpoints to `'use server'` functions callable directly, removing boilerplate and improving type safety.

3. **Framework adoption**: RSC started Next.js App Router-specific and is spreading to other frameworks as the React team stabilizes the protocol.

**Follow-ups:**

1. **Serialization limits**: What happens if you pass a function as a prop across the server/client boundary? It errors — only serializable data crosses.

2. **When to use `'use client'`**: Interactivity, state, effects, and browser APIs force a client boundary; push it as deep in the tree as possible to minimize shipped JS.

3. **Data waterfalls**: RSC can still waterfall if sequential awaits aren't parallelized — use `Promise.all` or Suspense to overlap fetches.

**Key points:**

1. **No client hooks**: Server Components can't use state, effects, or browser APIs.

2. **Serializable props**: Props passed from server to client must be serializable.

3. **Server Actions**: Server Actions handle mutations.

4. **Adopters**: Next.js App Router and Remix v3 are primary adopters.

---

### 63. State mgmt: Redux vs Zustand vs Jotai vs Context

**Frequency:** Medium

**Question:** How do Redux, Zustand, Jotai, and Context compare, and when do you choose each?

**Solution:**

1. **The spectrum**: They sit on a spectrum from **heavyweight/structured** to **minimal/atomic**, and the first real question is whether you even need global *client* state.

2. **Redux (via Redux Toolkit)**: a single centralized store with a **strict unidirectional flow** (action → reducer → new state). Verbose but **predictable and debuggable at scale**: excellent **DevTools with time-travel**, a rich **middleware** ecosystem (sagas, thunks, logging), and enforced conventions that keep large teams consistent. RTK cut most of the old boilerplate. Choose it for **large apps** that benefit from strict structure, middleware, and auditability.

3. **Zustand**: a **tiny hook-based store**. You create a store and read it via a hook with a **selector** (`useStore(s => s.count)`), so components only re-render when their selected slice changes. **Minimal boilerplate**, no providers required, no actions/reducers ceremony. Great default for most apps that need shared client state without Redux's overhead.

4. **Jotai**: **atomic** state: state is composed of small **atoms** that you read/write individually, and **derived atoms** compute from others with **fine-grained reactivity** (only components using a given atom re-render). Feels like `useState` that lives outside the tree; excellent for **granular, interdependent** state that would be awkward as one big object.

5. **Context**: **not really a state manager** but **dependency injection**. Best for **rarely-changing** values (theme, current user, locale). As covered earlier, it re-renders *all* consumers on change and has no selectors, so it's a poor fit for high-frequency state.

6. **The cross-cutting rule**: The most important cross-cutting rule: **separate *server* state from *client* state.** Data fetched from an API (caching, revalidation, loading/error, dedup) belongs in **React Query / SWR / RTK Query**, *not* Redux/Zustand hand-rolled — conflating them is the most common architecture mistake. Also **avoid global state for component-local concerns** (keep it in `useState`), and note **Zustand/Jotai are designed to work cleanly with React 18 concurrent rendering** (via `useSyncExternalStore`).

**Evolution:**

1. **Redux → Redux Toolkit**: RTK eliminated most Redux boilerplate (action creators, immutable updates via Immer) and bundled RTK Query for data fetching.

2. **Monolithic store → atomic/hook stores**: Zustand and Jotai emerged to offer selector-based and atom-based reactivity, avoiding the all-consumers re-render problem and provider ceremony.

3. **Client state / server state split**: The ecosystem converged on dedicated server-state libraries (React Query, SWR), shrinking what global client-state managers actually need to hold.

**Follow-ups:**

1. **Context re-render fix**: How do you stop Context from re-rendering all consumers? Split contexts, memoize values, or move to a selector-based store.

2. **Concurrent safety**: Why do Zustand/Jotai use `useSyncExternalStore`? To avoid tearing under React 18 concurrent rendering.

3. **Choosing**: Start with `useState`/Context; add Zustand/Jotai when sharing grows; reach for Redux only when strict structure, middleware, and auditability pay off.

**Key points:**

1. **Server vs client**: Server state (React Query, SWR) is separate from client state.

2. **Scope**: Avoid global state for component-local concerns.

3. **Concurrent rendering**: Zustand/Jotai work great with React 18 concurrent rendering.

4. **RTK Query**: Redux Toolkit Query covers data fetching too.

---

### 64. Routing: client- vs server-side

**Frequency:** Medium

**Question:** How do client-side and server-side routing differ, and how do frameworks blend them?

**Solution:**

1. **Server-side routing**: the traditional model: each URL request returns a **full HTML document** from the server. It's **simple, SEO-friendly** (every URL is a complete crawlable page), and **works with zero JavaScript**. The downside is that every navigation is a **full page reload** — a white flash, re-download of shared shell/CSS/JS, and lost client state.

2. **Client-side routing (SPA)**: **intercepts navigation** in the browser: clicking a link doesn't hit the server for a new document — JS **prevents the default**, fetches just the needed **data (JSON)**, and **swaps the view in place**. This gives **fast, app-like transitions** and preserves state, but **requires JavaScript**, adds complexity (you must manage scroll restoration, focus, titles, loading states), and needs care for SEO (the initial HTML may be empty).

3. **Hybrid / isomorphic routing**: Modern frameworks use **hybrid / isomorphic routing** to get both: the **server renders (SSR/SSG) the initial page** so first paint and SEO are strong and it works without JS, then the client **hydrates and takes over** subsequent navigations as a SPA — fast transitions after the first load. Next.js, Remix, SvelteKit, and Nuxt all work this way.

4. **History API**: The **History API** (**`pushState`/`replaceState`** + the `popstate` event) is what lets client routers change the URL and handle back/forward **without a reload**.

5. **Progressive enhancement & code-splitting**: For **progressive enhancement**, keep real **`<a href>`** links so navigation still works if JS fails or hasn't loaded — the router enhances them rather than replacing them with `onClick` divs. **Code-split by route** (`lazy(() => import())`) so each route's JS loads on demand, keeping the **initial bundle small**. The **View Transitions API** enables smooth animated crossfades/morphs between client routes declaratively.

**Evolution:**

1. **MPA → SPA → hybrid**: Routing moved from full page reloads, to client-only SPA swaps, to isomorphic frameworks that SSR the first paint then hydrate into a SPA.

2. **Manual History wiring → framework routers**: Hand-managed `pushState` gave way to declarative route config in Next.js/Remix/SvelteKit with built-in data loading and scroll/focus handling.

3. **Instant crossfades**: The View Transitions API is adding native animated transitions between routes without hand-rolled animation libraries.

**Follow-ups:**

1. **SEO for SPAs**: How do you make a client-routed app crawlable? SSR/SSG the initial HTML or use prerendering.

2. **Scroll & focus**: Client routing loses browser defaults — restore scroll position and move focus for accessibility on each navigation.

3. **Hydration cost**: Shipping SSR HTML plus hydration JS can be heavy; partial/progressive hydration and islands reduce it.

**Key points:**

1. **History API**: History API (`pushState`/`replaceState`) powers client routing.

2. **Graceful `<a>`**: `<a>` should still work without JS (progressive enhancement).

3. **Route code-splitting**: Code-split routes for smaller initial bundles.

4. **View Transitions**: View Transitions API enables smooth client-route animations.

---

### 65. Container/presentational vs hooks-driven

**Frequency:** Medium

**Question:** How does the container/presentational pattern compare with a hooks-driven architecture?

**Solution:**

1. **Shared goal**: Both are ways to **separate "how a component gets its data" from "how it looks"** — they just do it with different tools.

2. **Container/presentational split**: The classic split (Dan Abramov's 2015 pattern) used **two components**: a **container** that handled data fetching, state, and logic (often a class connected to Redux), and a **presentational** component that received everything via **props** and only rendered UI. This was valuable **before hooks** because there was no clean way to reuse stateful logic — so you isolated it in containers and kept the view dumb and testable.

3. **Hooks-driven approach**: The hooks-driven approach makes the container mostly unnecessary. A **custom hook** (`useUser()`, `useCart()`) **encapsulates the data/logic** and a component calls it directly, **co-locating data needs with the component** that uses them. This **eliminates prop-drilling** (a deep component fetches what it needs itself instead of receiving it through five layers) and makes logic reusable across unrelated components. So: **custom hooks are the modern "container"** — and they're independently **unit-testable** (test the hook with `renderHook`, separate from any UI).

4. **Server Components push further**: **Server Components** push this further still — the data layer **disappears from client code** entirely: an async server component `await`s its data inline, and no fetching logic ships to the browser at all.

5. **What remains useful**: **Presentational ("dumb") components stay valuable for design systems** — a `<Button>`/`<Card>` that takes only props, has no data dependencies, and is trivial to test and showcase in Storybook. Related composition patterns like **compound components** (`<Tabs><Tab/></Tabs>` sharing implicit state via context) express relationships more cleanly than prop-heavy configuration. The overarching caution: **avoid premature abstraction** — extract a custom hook or shared component when a pattern *actually* repeats, not speculatively.

**Evolution:**

1. **Classes/HOCs → hooks**: Reusable stateful logic moved from container classes and higher-order components to custom hooks, co-locating data with the consumer.

2. **Client fetching → Server Components**: The data layer is being pushed out of client code entirely, with async server components awaiting data inline.

3. **Config props → composition**: Compound components and composition patterns replaced prop-heavy configuration for expressing related UI relationships.

**Follow-ups:**

1. **Testing hooks**: How do you test logic extracted into a hook? Use `renderHook` to test it in isolation from any UI.

2. **When to extract**: Avoid premature abstraction — extract a hook/component only when a pattern genuinely repeats.

3. **Design-system role**: Presentational components still matter for Storybook-showcased, data-free UI primitives.

**Key points:**

1. **Hooks as container**: Custom hooks are the modern "container" — testable in isolation.

2. **Presentational value**: Presentational components remain valuable for design systems.

3. **Compound components**: Compound components pattern groups related UI (Tabs/Tab).

4. **No premature abstraction**: Avoid premature abstraction — extract when patterns emerge.

---

### 66. Tree shaking — what blocks it

**Frequency:** Medium

**Question:** What is tree shaking, and what blocks it?

**Solution:**

1. **Definition**: **Tree shaking** is **dead-code elimination for bundles** — the bundler statically analyzes your import/export graph and **drops exports that are never used**, so importing one function from a library doesn't ship the whole thing. "Shaking the tree" so the dead leaves fall.

2. **Three requirements**: **ESM (`import`/`export`)** — because ES module bindings are **static** (analyzable without running the code), the bundler can *prove* what's used. CommonJS `require` is dynamic and can't be reliably analyzed. **Side-effect-free modules** — the bundler must know that removing an unused export won't skip an important side effect. Declare this with **`"sideEffects": false`** in `package.json` (or list the files that *do* have side effects, like CSS imports). **Pure top-level code** — no meaningful work happening merely by importing a module.

3. **Common blockers**: **CommonJS modules / dynamic `require`** — not statically analyzable, so nothing gets shaken. **Top-level side effects** — code that runs on import (registering a global, mutating a prototype, `console.log`) forces the bundler to keep the module. **Barrel files** (`index.js` re-exporting everything) — re-exporting a whole namespace can defeat elimination and pull in far more than you use; they also hurt build performance. **Transpiling ESM to CJS too early** — e.g. Babel/TS configured to emit CommonJS *before* the bundler sees it destroys the static structure. Keep modules as ESM and let the bundler handle output.

4. **Named imports**: Use **named imports** (`import { debounce } from 'lodash-es'`), **not `import * as`** (which can retain everything) and **not default-importing the whole library**. This is exactly why **`lodash-es` tree-shakes but CommonJS `lodash` does not** — same functions, but only the ESM build is analyzable.

5. **Annotations & verification**: **`/*#__PURE__*/`** annotations tell the minifier a function *call* has no side effects so its result can be dropped if unused. Always **verify with a bundle analyzer** (`webpack-bundle-analyzer`, `rollup-plugin-visualizer`) rather than assuming shaking worked.

**Evolution:**

1. **CJS → ESM**: The move to static ES modules is what made reliable tree shaking possible in the first place.

2. **Whole-library imports → granular ESM builds**: Libraries shipped ESM builds (e.g. `lodash-es`) specifically so bundlers can drop unused exports.

3. **Manual trust → analyzer-driven**: Teams now verify bundle contents with analyzers and `sideEffects` config rather than assuming elimination happened.

**Follow-ups:**

1. **Why lodash fails**: Why does `lodash` not shake but `lodash-es` does? CJS isn't statically analyzable; the ESM build is.

2. **Barrel-file cost**: How do barrel files hurt? They re-export whole namespaces, defeating elimination and slowing builds.

3. **Marking purity**: When do you need `/*#__PURE__*/`? To tell the minifier a call is side-effect-free so an unused result can be dropped.

**Key points:**

1. **PURE annotation**: `/*#__PURE__*/` annotations mark calls as side-effect-free.

2. **Lodash-es vs lodash**: Lodash-es tree-shakes; lodash (CJS) does not.

3. **Avoid namespace import**: Avoid `import * as` — name imports.

4. **Verify**: Verify with bundle analyzer.

---

### 67. CDN & edge caching

**Frequency:** Medium

**Question:** How do CDN and edge caching work, and what strategies matter?

**Solution:**

1. **What a CDN is**: A **CDN (Content Delivery Network)** is a globally-distributed network of **PoPs (Points of Presence)** that **cache your content close to users**. Instead of every request traveling to your single origin server, a user in Tokyo is served from a nearby PoP — **cutting latency** (fewer network hops, shorter RTT) and **offloading the origin** (cached hits never touch it). Ideal for static assets (JS/CSS/images/fonts).

2. **Edge compute**: Modern CDNs (**Cloudflare, Fastly, Vercel, CloudFront**) go beyond static caching to run **edge functions/workers** — your code executes *at the PoP*, enabling **edge SSR and personalization** with very low **TTFB** because rendering happens near the user rather than in one distant region.

3. **Cache key**: what identifies a cached object. It's primarily the **URL**, but can include **headers/cookies/query params**, controlled via the **`Vary`** header (e.g. `Vary: Accept-Encoding` caches gzip and brotli separately). Careless inclusion of cookies in the key **shreds hit rates** (every user gets a unique key).

4. **Purge/invalidation**: removing stale content. **Purge-by-tag** (surrogate keys) enables **fine-grained invalidation**: tag related objects and purge them all at once (e.g. purge everything tagged `product-123` when it changes) instead of by exact URL.

5. **Origin shield & tiering**: **Origin shield** — a designated intermediate cache layer that all PoPs consult before the origin, so a cache miss in many regions results in **one** origin fetch, not dozens — reducing origin load and cache-miss cost. **Tiered caching** — hierarchical PoP layers that improve hit ratios. **Signed URLs** — time-limited, tamper-proof links for access-controlled assets.

6. **HTTP/2 push note**: A historical note: **HTTP/2 Server Push is largely abandoned** (removed from Chrome) because it often wasted bandwidth pushing already-cached resources — the modern replacement is **`103 Early Hints`** and **`<link rel=preload>`** to hint critical resources without the guesswork.

**Evolution:**

1. **Single origin → distributed PoPs**: Serving moved from one origin to globally cached edge locations to cut latency and offload origin.

2. **Static caching → edge compute**: CDNs added edge functions/workers enabling SSR and personalization at the PoP, not just static file caching.

3. **Server Push → Early Hints**: HTTP/2 push was abandoned in favor of `103 Early Hints` and `<link rel=preload>` for resource hinting.

**Follow-ups:**

1. **Hit-rate killers**: Why do cookies in the cache key hurt? They make every user's key unique, shredding hit rates.

2. **Targeted invalidation**: How do you invalidate related content efficiently? Purge by tag/surrogate key instead of per-URL.

3. **Origin load spikes**: How do you avoid thundering-herd origin fetches on a global miss? Use origin shield / tiered caching so one fetch backfills all PoPs.

**Key points:**

1. **Cache key control**: Cache key includes URL, sometimes headers/cookies — control via `Vary`.

2. **Tag purge**: Purge by tag for fine-grained invalidation.

3. **No HTTP/2 push**: HTTP/2 push is largely abandoned; use early hints / preload.

4. **Origin shield**: Origin shield reduces cache misses to the origin.

---

### 68. Cookies: SameSite/Secure/HttpOnly

**Frequency:** Medium

**Question:** What do the cookie security attributes `HttpOnly`, `Secure`, `SameSite`, and `Partitioned` do?

**Solution:**

1. **Purpose**: Cookie attributes harden cookies against theft and cross-site abuse.

2. **`HttpOnly`**: makes the cookie **invisible to JavaScript** (`document.cookie` can't read it). This is the primary **XSS mitigation** for session cookies: even if an attacker injects script, they **can't exfiltrate the token**. The cost is JS can't read it either — which is fine for auth cookies the browser sends automatically.

3. **`Secure`**: the cookie is **only sent over HTTPS**, preventing interception on plaintext connections.

4. **`SameSite`**: controls whether the cookie is sent on **cross-site** requests, the core **CSRF** defense. **`Strict`** — never sent on any cross-site request, *including* top-level navigations. Maximum safety, but following a link from another site to your app won't include the cookie (user appears logged out until they navigate internally). **`Lax`** (the modern **default**) — sent on **top-level navigation GETs** (clicking a link to your site) but **not** on cross-site subrequests or unsafe methods (POST from another origin). A good balance for most auth cookies. **`None`** — sent on all cross-site requests, but **must** be paired with **`Secure`**. Required for legitimate third-party contexts (embedded widgets, SSO iframes).

5. **`Partitioned` (CHIPS)**: opts a cross-site cookie into **partitioned storage keyed by the top-level site**, so an embedded widget gets a *separate* cookie jar per embedding site rather than one shared cross-site identifier. This is the path forward for legitimate embeds as **third-party cookies are phased out**.

6. **Guidance**: auth tokens should be **`HttpOnly; Secure; SameSite=Lax`**; an **embedded cross-site widget** needs **`SameSite=None; Secure; Partitioned`**. Mind the **~4KB size limit** (and that cookies ride on *every* request to the domain — header bloat). Use the **`__Host-` prefix** for the strictest guarantee: the browser only accepts such a cookie if it's `Secure`, has no `Domain` (host-only), and `Path=/` — preventing subdomain injection.

**Evolution:**

1. **Bare cookies → hardened defaults**: Browsers shifted `SameSite` to default `Lax`, closing a large class of CSRF by default.

2. **Shared third-party cookies → CHIPS partitioning**: As third-party cookies are phased out, `Partitioned` gives legitimate embeds per-site cookie jars.

3. **Ad-hoc naming → `__Host-`/`__Secure-` prefixes**: Enforced prefixes added browser-level guarantees about `Secure`, `Domain`, and `Path`.

**Follow-ups:**

1. **Strict UX cost**: Why not always use `SameSite=Strict`? It drops the cookie on inbound cross-site links, making users appear logged out.

2. **Widgets across sites**: What combo does an embedded cross-site widget need? `SameSite=None; Secure; Partitioned`.

3. **Header bloat**: Why keep cookies small? They ride on every request to the domain, inflating request headers.

**Key points:**

1. **Auth default**: Auth tokens should be `HttpOnly; Secure; SameSite=Lax`.

2. **Widget combo**: Embedded widgets need `SameSite=None; Secure; Partitioned`.

3. **Size limit**: Cookie size limit ~4KB; consider header bloat.

4. **Host prefix**: Use `__Host-` prefix for strictest security guarantees.

---

### 69. Frontend auth: JWT in localStorage vs httpOnly cookie

**Frequency:** Medium

**Question:** Should a JWT live in `localStorage` or an `httpOnly` cookie? Compare the tradeoffs.

**Solution:**

1. **The core tradeoff**: The two options trade **XSS exposure against CSRF exposure**.

2. **`localStorage`**: **readable by any JavaScript** on the page. Convenient (easy to attach as an `Authorization: Bearer` header, works cleanly for pure-API SPAs and cross-origin backends), but it means **any XSS vulnerability = instant token theft**. A single injected script does `localStorage.getItem('token')` and the attacker has the user's credentials. Same problem with **`sessionStorage`** — also JS-accessible, so no safer.

3. **`httpOnly` cookie**: **invisible to JavaScript**, so XSS **cannot read the token**. The browser sends it automatically. The tradeoff is exposure to **CSRF** (the browser attaches it to cross-site requests too), which you mitigate with **`SameSite=Lax/Strict`** plus **CSRF tokens** for state-changing requests. Combined with `Secure`, this is the **recommended default for browser-based auth** — XSS (arbitrary code execution) is generally the scarier, harder-to-fully-prevent threat, and `httpOnly` neutralizes token theft from it, while CSRF has well-understood, robust mitigations.

4. **Recommendation**: **prefer `httpOnly; Secure; SameSite` cookies** for browser auth. `localStorage` is **acceptable only** for short-lived tokens in a pure-API SPA with a strong CSP and no cross-site cookie needs — and you accept the XSS risk.

5. **Harden the whole flow**: **Refresh-token rotation** — issue **short-lived access tokens** + a rotating refresh token; each refresh invalidates the prior one, so a stolen token has a small window and reuse is detectable. This limits **blast radius**. **BFF (Backend-for-Frontend)** — the strongest pattern: keep **tokens entirely off the client**. The browser holds only an opaque `httpOnly` **session cookie**; a lightweight backend stores the real tokens and proxies API calls, attaching them server-side. Nothing sensitive is ever reachable by client JS. **OAuth with PKCE** — required for **public clients** (SPAs/mobile) to secure the authorization-code exchange against interception.

**Evolution:**

1. **localStorage tokens → httpOnly cookies**: Best practice shifted toward `httpOnly; Secure; SameSite` cookies to neutralize XSS token theft.

2. **Long-lived tokens → rotating refresh**: Short-lived access tokens with rotating refresh tokens reduce blast radius and make reuse detectable.

3. **Client-held tokens → BFF**: The strongest pattern moves tokens entirely server-side, leaving the browser only an opaque session cookie.

**Follow-ups:**

1. **sessionStorage safer?**: Is `sessionStorage` safer than `localStorage`? No — still JS-accessible, same XSS exposure.

2. **CSRF with cookies**: If you use `httpOnly` cookies, how do you stop CSRF? `SameSite` plus CSRF tokens for state-changing requests.

3. **SPA/mobile auth code**: Why PKCE for public clients? It secures the authorization-code exchange against interception.

**Key points:**

1. **Rotation**: Refresh-token rotation reduces blast radius.

2. **sessionStorage**: Avoid storing tokens in `sessionStorage` either (still JS-accessible).

3. **BFF**: BFF (Backend-for-Frontend) pattern keeps tokens off the client entirely.

4. **PKCE**: OAuth PKCE is required for public clients.

---

### 70. WebSocket vs SSE vs long-polling

**Frequency:** Medium

**Question:** Compare WebSocket, Server-Sent Events (SSE), and long-polling.

**Solution:**

1. **Overview**: Three ways to push server data to the client, differing in **directionality, transport, and complexity**.

2. **WebSocket**: a **full-duplex, bidirectional** connection over a single long-lived TCP socket (upgraded from HTTP). Both sides send messages anytime with **very low latency** and support for **binary** frames. Ideal for **chat, multiplayer games, and collaborative editing** — anything needing fast two-way traffic. Costs: it's a **separate protocol** (`ws://`/`wss://`) requiring **server support** and its own infra (load balancers, sticky sessions), no built-in reconnect, and it needs **heartbeats/pings** to survive proxy/idle timeouts that would otherwise silently drop the connection.

3. **SSE (Server-Sent Events)**: **one-way, server→client** streaming over a **plain HTTP** connection (`EventSource`). Much **simpler**: it's just HTTP, so it **works through most proxies/firewalls**, and the browser gives you **automatic reconnection** (with `Last-Event-ID` resume) for free. Limits: **text-only** (UTF-8; binary must be encoded), and under **HTTP/1.1 a strict ~6-connection-per-origin cap** (HTTP/2 multiplexing lifts this). Perfect for **notifications, live feeds/dashboards, and streaming LLM/AI token output** — exactly the one-directional push cases where a full WebSocket is overkill.

4. **Long-polling**: the **fallback** that emulates push without either: the client makes a request the server **holds open until it has data** (or a timeout), responds, and the client immediately reconnects. Works **everywhere** (just HTTP) but has **higher latency and overhead** (constant reconnection, header churn). Use only when WebSocket/SSE aren't available.

5. **Decision guide & successor**: **bidirectional/low-latency → WebSocket**; **one-way server push → SSE** (simpler, auto-reconnect, proxy-friendly); **legacy fallback → long-polling**. The emerging successor is **WebTransport (over HTTP/3/QUIC)**, offering low-latency bidirectional streams and datagrams without WebSocket's head-of-line-blocking limitations.

**Evolution:**

1. **Long-polling → SSE/WebSocket**: Real push replaced the reconnect-churn of long-polling, which now survives only as a fallback.

2. **HTTP/1.1 caps → HTTP/2 multiplexing**: SSE's ~6-connection-per-origin limit under HTTP/1.1 is lifted by HTTP/2 multiplexing.

3. **WebSocket → WebTransport**: WebTransport over HTTP/3/QUIC is emerging for low-latency bidirectional streams and datagrams without head-of-line blocking.

**Follow-ups:**

1. **Idle drops**: Why do WebSockets need heartbeats? To survive proxy/idle timeouts that silently drop the connection.

2. **One-way choice**: For AI token streaming or live dashboards, why prefer SSE? Auto-reconnect, proxy-friendly, and a full WebSocket is overkill.

3. **Scaling WebSockets**: What infra do WebSockets demand? Sticky sessions and load balancers that support long-lived upgraded connections.

**Key points:**

1. **SSE use cases**: SSE works great for notifications, live feeds, AI streaming.

2. **Heartbeats**: WebSocket needs heartbeats to survive idle timeouts.

3. **WebTransport**: WebTransport (HTTP/3) is the emerging successor for low-latency bidirectional.

4. **SSE connection cap**: Server-Sent Events have per-origin connection limits in HTTP/1.1.

---

### 71. Image optimization checklist

**Frequency:** Medium

**Question:** Walk through an image optimization checklist for the web.

**Solution:**

1. **Right format**: Images are usually the **heaviest bytes on a page**, so optimizing them is the highest-leverage performance work. Serve **AVIF** (smallest) or **WebP** with a JPEG/PNG **fallback**; use **SVG for icons/logos/illustrations** (vector, tiny, crisp at any size).

2. **Right dimensions per device**: Use **`<picture>` / `srcset` + `sizes`** so the browser downloads an appropriately-sized variant instead of a desktop-sized image on a phone. Pair with a **CDN that resizes on the fly** (`?w=400`) so you don't hand-generate every size.
   ```html
   <img src="p-800.jpg" srcset="p-400.jpg 400w, p-800.jpg 800w, p-1600.jpg 1600w"
        sizes="(max-width:600px) 100vw, 50vw" width="800" height="600"
        loading="lazy" decoding="async" alt="...">
   ```

3. **Reserve space to prevent CLS**: **Always set `width`/`height`** (or the CSS **`aspect-ratio`**) so the browser lays out the slot before the image loads, avoiding layout shift.

4. **Prioritize correctly**: **Lazy-load below-the-fold** images with **`loading="lazy"`** so offscreen images don't compete for bandwidth. **Never lazy-load the LCP image** — that delays your most important paint. Instead mark it **`fetchpriority="high"`** (and optionally `preload` it) to fetch it ASAP. **`decoding="async"`** decodes off the main thread so it doesn't block rendering.

5. **Shrink the bytes**: **Compress aggressively** (tune quality; most photos look fine at 70–80%), and **strip metadata** (EXIF/GPS/color-profile cruft) that bloats files.

6. **Perceived performance**: Show a **LQIP (Low-Quality Image Placeholder)** or **BlurHash** — a tiny blurred preview that renders instantly and swaps to the full image on load, so users perceive faster loading even when bytes are still arriving.

**Evolution:**

1. **Static → responsive**: Start with a single hand-sized image, then move to `srcset`/`sizes` so each device fetches its own variant instead of one oversized file.

2. **Manual → CDN pipeline**: Replace hand-generated sizes with a **CDN that resizes on the fly** (`?w=400`), serving modern formats (AVIF/WebP) via content negotiation.

3. **Bytes → perceived speed**: Once byte-size and dimensions are tuned, add **LQIP/BlurHash placeholders** and correct prioritization (`fetchpriority`, lazy-loading) to improve perceived and real Core Web Vitals.

**Follow-ups:**

1. **Why never lazy-load the LCP image?** Lazy-loading defers the fetch until the image is near the viewport, delaying the Largest Contentful Paint; mark it `fetchpriority="high"` and preload instead.

2. **AVIF vs WebP tradeoff?** AVIF compresses smaller but has slower encode and narrower (though growing) support, so pair it with a WebP/JPEG fallback via `<picture>`.

3. **How do placeholders affect CLS?** A placeholder occupying the reserved `width`/`height` (or `aspect-ratio`) slot avoids layout shift when the full image swaps in.

**Key points:**

1. **LCP**: LCP image should NOT be lazy.

2. **Decoding**: `decoding="async"` avoids blocking the main thread.

3. **CLS**: Use `aspect-ratio` CSS to avoid CLS.

4. **Placeholders**: Blurhash/LQIP placeholders improve perceived performance.

---

### 72. Font loading (`font-display: swap`, preconnect, subsetting)

**Frequency:** Medium

**Question:** How do you optimize web font loading?

**Solution:**

1. **Avoid invisible text with `font-display`**: Web fonts are **render-blocking-ish** — mishandled, they either hide text or shift the layout. By default, browsers **FOIT** (Flash Of Invisible Text) — hiding text for up to 3s while the font loads. **`font-display: swap`** instead renders a **fallback font immediately**, then **swaps** to the web font when ready (**FOUT** — Flash Of *Unstyled* Text). Text is always visible, which is almost always the right tradeoff. For strict CLS budgets, **`font-display: optional`** uses the web font only if it loads almost instantly, otherwise sticks with the fallback — **no swap, no shift**.

2. **Cut the latency to the font**: **`preconnect`** to the font origin (`<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`) warms up DNS/TLS early, saving a round trip. **`preload`** critical fonts (`<link rel="preload" as="font" type="font/woff2" crossorigin>`) so the browser fetches them before it discovers them in CSS. Note **`crossorigin` is required** even for same-origin fonts (fonts are always fetched in CORS mode). **Self-hosting** removes a third-party origin entirely (one fewer connection, better privacy, full cache control).

3. **Cut the bytes**: **Subsetting** strips unused glyphs — a Latin-only subset can be a fraction of a full multi-script font. **WOFF2** is the **only format you need** in modern browsers (best compression); don't ship legacy `.ttf`/`.eot`/`.woff`. **Variable fonts** pack many weights/styles into **one file** with a continuous axis, replacing separate regular/bold/italic downloads.

4. **Minimize the swap shift**: The **`size-adjust`** (plus `ascent-override`/`descent-override`) descriptor on an `@font-face` **fallback** tunes the fallback's metrics to match the web font, so when the swap happens the text barely moves — near-zero CLS.

**Evolution:**

1. **Default FOIT → controlled display**: Move from the browser default (hidden text) to `font-display: swap` for visibility, or `optional` where CLS must be minimized.

2. **Third-party → self-hosted**: Start with a hosted font service plus `preconnect`, then self-host WOFF2 to drop an origin and gain full cache control.

3. **Full font → optimized payload**: Subset glyphs, ship WOFF2 only, and consolidate weights into a variable font to shrink bytes, then add `size-adjust` fallbacks to erase swap shift.

**Follow-ups:**

1. **Why is `crossorigin` required for same-origin fonts?** Fonts are always fetched in CORS mode, so omitting `crossorigin` on the preload causes a duplicate (non-matching) fetch.

2. **swap vs optional tradeoff?** `swap` guarantees visible text but can cause a late swap shift; `optional` avoids the shift by abandoning the web font if it's slow.

3. **When do variable fonts not pay off?** If you only use one weight/style, a subset static WOFF2 may be smaller than a full variable font's axis data.

**Key points:**

1. **Variable fonts**: Variable fonts replace multiple weight files.

2. **Format**: WOFF2 is the only modern format you need.

3. **Shift**: `size-adjust` CSS minimizes layout shift between fallback and web font.

4. **Preload**: Preload critical fonts: `<link rel="preload" as="font" crossorigin>`.

---

### 73. Bundlers: Webpack vs Vite vs esbuild vs Rollup

**Frequency:** Medium

**Question:** How do Webpack, Vite, esbuild, and Rollup compare as bundlers?

**Solution:**

1. **Webpack**: The **mature, ubiquitous workhorse** with the richest plugin/loader ecosystem; it can bundle literally anything. The tradeoff is **speed**: it bundles the whole app even in dev, so large projects have slow cold starts and HMR. Still dominant in **enterprise/legacy** codebases.

2. **Vite**: The **modern default for new apps**. In **dev**, it serves source over **native ESM with no bundling** — the browser requests modules on demand, so startup is near-instant and **HMR stays fast regardless of app size**. For **production** it bundles with **Rollup** (proven tree-shaking, optimized output). Excellent DX; it's what most new React/Vue/Svelte projects use.

3. **esbuild**: A **Go-based** bundler/transpiler that's **extremely fast** (10–100× typical JS tooling) by leveraging parallelism and native code. Vite uses it internally for **transforms** (TS/JSX → JS, dependency pre-bundling). Its own bundler is fast but its **plugin API is limited** compared to Rollup, so it's often a building block rather than the whole toolchain.

4. **Rollup**: The **library bundler** of choice: cleanest **ESM output**, best-in-class **tree-shaking**, and precise control over output formats (ESM/CJS/UMD). Ideal when you're shipping a *package* rather than an app. **Library authors typically pick Rollup or tsup** (an esbuild-based wrapper).

5. **Emerging Rust-based generation**: **Rspack** (Webpack-API-compatible, drop-in but much faster) and **Turbopack** (Vercel's successor to Webpack, used in Next.js) — both chasing esbuild/Vite speed while keeping Webpack's flexibility. Rule of thumb: **Vite for apps, Rollup/tsup for libraries, Webpack when you're already on it or need its ecosystem.**

**Evolution:**

1. **Bundle-everything → native ESM dev**: Webpack bundles the whole app even in dev; Vite shifted to serving unbundled native ESM so startup and HMR stay fast as the app grows.

2. **JS tooling → native-code speed**: esbuild (Go) and the Rust generation (Rspack, Turbopack) move the hot path into native code for 10–100× speedups.

3. **Compatibility vs greenfield**: Rspack keeps the Webpack API for drop-in migration, while Vite/Turbopack optimize for new projects — pick based on whether you must preserve an existing config.

**Follow-ups:**

1. **Why does Vite still use Rollup for production?** Rollup's proven tree-shaking and optimized output beat esbuild's bundler for shippable apps, while esbuild handles fast dev transforms.

2. **App vs library choice?** Apps favor Vite (dev speed, code-splitting); libraries favor Rollup/tsup for clean multi-format ESM/CJS/UMD output.

3. **Why not just use esbuild for everything?** Its plugin API is limited compared to Rollup, so complex toolchains still lean on Rollup/Vite.

**Key points:**

1. **Apps**: Vite is the default for new frontend apps.

2. **Enterprise**: Webpack still dominant for enterprise/legacy.

3. **Plugins**: esbuild's plugin API is limited compared to Rollup.

4. **Libraries**: Library authors typically pick Rollup or tsup (esbuild-based).

---

### 74. Testing pyramid

**Frequency:** Medium

**Question:** What is the testing pyramid, and how does the "testing trophy" revise it?

**Solution:**

1. **Base — many unit tests**: Fast (milliseconds), isolated, test a single function/module. Cheap to write and run, pinpoint failures precisely.

2. **Middle — fewer integration tests**: Verify that multiple units work together (a component + its hooks + a mocked API).

3. **Top — few E2E tests**: Slow, run the whole app in a real browser, test complete user journeys. High confidence but brittle and expensive, so you keep them few. The shape encodes a principle: **push most testing down to the fast, cheap layers** and reserve slow E2E for the few flows that truly matter.

4. **The "testing trophy" revision**: The modern **"testing trophy"** (Kent C. Dodds) **shifts weight toward integration tests**, arguing they hit the **best ROI** — they catch **real bugs** (components actually rendering and wiring together) **without the brittleness** of E2E or the triviality of over-mocked unit tests. With **React Testing Library**, you test components the way a user experiences them (query by role/text, click, assert visible output) rather than testing internals. E2E (Playwright/Cypress) is then reserved for **critical journeys only** — login, checkout, signup.

5. **Cross-cutting rules both models share**: **Don't test implementation details** (internal state, private methods, exact call counts) — those tests break on every refactor even when behavior is unchanged. **Test observable behavior.** Also: aim for **millisecond feedback** at the unit layer; use **contract tests (Pact)** to replace some cross-service integration tests (verify each side honors the shared API contract independently); and treat **code coverage as a sanity check, not a target** — 100% coverage of trivial getters proves nothing, and gaming the number encourages bad tests.

**Evolution:**

1. **Pyramid → trophy**: The classic unit-heavy pyramid gives way to an integration-heavy trophy as tools (RTL, MSW) make integration tests cheap and realistic.

2. **Unit sprawl → targeted E2E**: Reserve slow E2E for critical journeys only (login, checkout, signup) rather than duplicating coverage across layers.

3. **Monolith → services**: As systems split into services, add contract tests (Pact) so each side verifies the shared API independently instead of spinning up fragile cross-service integration tests.

**Follow-ups:**

1. **Why avoid testing implementation details?** They break on refactors even when behavior is unchanged, raising maintenance cost without catching real bugs.

2. **Is 100% coverage a good goal?** No — coverage is a sanity check; gaming the number encourages trivial tests that prove nothing.

3. **When do contract tests beat integration tests?** When cross-service integration is slow/flaky, contract tests let each side validate the shared API independently.

**Key points:**

1. **Implementation**: Avoid testing implementation details.

2. **Feedback**: Aim for fast feedback — unit tests in milliseconds.

3. **Contracts**: Contract tests (Pact) replace some integration tests across services.

4. **Coverage**: Coverage is a sanity check, not a target.

---

### 75. Jest vs Vitest vs Playwright vs Cypress

**Frequency:** Medium

**Question:** Compare Jest, Vitest, Playwright, and Cypress.

**Solution:**

1. **Jest (unit/integration runner)**: The long-standing **unit/integration test runner** for React/Node. Batteries-included (assertions, mocking, snapshots, coverage), huge ecosystem, and the de facto standard for years. Its weak spot is **ESM and speed**: it grew up in the CommonJS era and needs transform config (Babel/ts-jest) that adds friction and slowness in modern ESM/Vite projects.

2. **Vitest (Vite-native runner)**: The **Vite-native** alternative with a **Jest-compatible API** (near drop-in: `describe`/`it`/`expect`, same matchers). It's **faster**, **ESM-first**, and **reuses your Vite config/transform pipeline**, so there's no separate build setup. It's the **new default for Vite/SvelteKit/Astro/Nuxt** projects.

3. **Playwright (multi-browser E2E)**: A **multi-browser E2E framework** driving **Chromium, Firefox, and WebKit** with one API. Strengths: excellent **auto-waiting** (fewer flaky tests), strong **parallelization**, and rich debugging via **traces** (a recorded timeline with DOM snapshots). It's **gaining ground over Cypress** largely because of true cross-browser (including WebKit/Safari) support.

4. **Cypress (developer-friendly E2E)**: A **developer-friendly E2E runner** famous for its interactive **time-travel debugging** UI (step through commands, see the app state at each). It runs **inside the browser** alongside your app, which enables that DX but historically limited it to **one browser per run** and made some cross-origin/tab scenarios awkward.

5. **Overlaps and tooling**: **Both Playwright and Cypress also do component testing** (render a component in a real browser), blurring the unit/E2E line. And **MSW (Mock Service Worker)** is the modern way to **mock APIs at the network layer** in *both* unit tests and E2E — intercepting `fetch`/XHR so you mock realistic responses without stubbing your own code. Typical modern stack: **Vitest + React Testing Library** for units/integration, **Playwright** for E2E, **MSW** for API mocking across both.

**Evolution:**

1. **Jest → Vitest**: As projects moved to ESM/Vite, Vitest replaced Jest by reusing the Vite pipeline and offering a near drop-in API with better speed.

2. **Single-browser → cross-browser E2E**: Playwright's one-API control of Chromium/Firefox/WebKit (plus auto-waiting and traces) is displacing Cypress's single-browser-per-run model.

3. **Stubbing → network mocking**: Teams moved from stubbing their own code to MSW, which mocks at the network layer so the same mocks serve unit and E2E tests.

**Follow-ups:**

1. **Why pick Vitest over Jest on a Vite project?** It reuses the Vite config/transform pipeline (ESM-first, faster) with no separate build setup and a compatible API.

2. **Playwright vs Cypress tradeoff?** Playwright offers true cross-browser (incl. WebKit) and traces; Cypress offers in-browser time-travel DX but historically one browser per run.

3. **Why MSW over manual mocks?** Intercepting at the network layer gives realistic responses without stubbing your own code, and works across unit and E2E.

**Key points:**

1. **Default**: Vitest is the new default for Vite/SvelteKit/Astro projects.

2. **Cross-browser**: Playwright is gaining ground over Cypress for cross-browser.

3. **Component testing**: Both Playwright and Cypress support component testing too.

4. **Mocking**: Use MSW for API mocking in both unit and E2E.

---

### 76. A11y testing (axe-core, lighthouse, screen readers)

**Frequency:** Medium

**Question:** How do you test accessibility — automated and manual?

**Solution:**

1. **Both layers are required**: Accessibility testing needs **both automated and manual** layers because tools alone are far from sufficient.

2. **Automated tools**: **axe-core** (via `jest-axe` in unit tests, or the `@axe-core/playwright` integration in E2E) and **Lighthouse** catch only roughly **30–50% of issues**: the *machine-detectable* ones like **missing form labels/alt text, insufficient color contrast, invalid ARIA, and duplicate ids**. They're great for **CI regression guards** (fail the build on new violations) and cheap to run, but they **cannot judge experience** — whether focus order makes sense, whether an ARIA widget is *actually* operable, or whether an announcement is meaningful.

3. **Manual testing fills the other half**: **Keyboard-only navigation** — unplug the mouse and verify everything is reachable, operable, and has a visible focus indicator, with a logical tab order and working focus traps in modals. **Screen readers** — test with **real AT**: **NVDA** (Windows/Firefox), **JAWS** (Windows), **VoiceOver** (macOS/iOS). Emulation isn't enough — actual screen readers behave differently, and this is the only way to catch confusing or missing announcements. **Zoom to 200%** (and reflow at 320px) to ensure content doesn't clip or overlap. **`prefers-reduced-motion`** to confirm non-essential animation is disabled.

4. **Process integration**: Run **axe in CI** to prevent regressions, add the **Storybook `addon-a11y`** so axe runs **per story** during component development (catching issues at authoring time), and treat the **Lighthouse a11y score as a starting point, not a finish line** — a perfect score still needs manual verification. When possible, **include users with disabilities** in testing — the highest-signal feedback there is.

**Evolution:**

1. **CI gate → authoring-time checks**: Move axe from a late CI gate to the Storybook `addon-a11y` so issues surface per story during component development.

2. **Automated → manual coverage**: Since tools catch only 30–50%, layer in keyboard-only, screen-reader, zoom, and reduced-motion checks for the rest.

3. **Emulation → real users**: Progress from emulated AT to real screen readers (NVDA/JAWS/VoiceOver), and ultimately to testing with users with disabilities for the highest-signal feedback.

**Follow-ups:**

1. **Why aren't automated tools enough?** They detect only machine-checkable issues (~30–50%) and can't judge focus order, operability, or announcement meaning.

2. **Which screen readers to test?** NVDA (Windows/Firefox), JAWS (Windows), and VoiceOver (macOS/iOS) — emulation behaves differently from real AT.

3. **Is a perfect Lighthouse score sufficient?** No — it's a starting point; manual verification of keyboard, AT, and zoom is still required.

**Key points:**

1. **Storybook**: Storybook addon-a11y runs axe per story.

2. **Lighthouse**: Lighthouse a11y score is a starting point, not a finish line.

3. **Real AT**: Test with real assistive tech, not just emulation.

4. **Users**: Include users with disabilities in testing when possible.

---

### 77. PWA: SW lifecycle, offline strategy, install prompt

**Frequency:** Medium

**Question:** How do you build a PWA — Service Worker lifecycle, offline strategies, and install prompt?

**Solution:**

1. **Foundation**: A **Progressive Web App** uses a **Service Worker** (the network-proxy worker) plus a **manifest** to deliver offline support and installability.

2. **Service Worker lifecycle (three phases)**: **`install`** — fires once when the SW is first registered/updated; here you **pre-cache the app shell** (HTML/CSS/JS/offline page) so the app can boot offline. **`activate`** — fires when the new SW takes control; here you **clean up old caches** from previous versions. **`fetch`** — fires on **every network request** the page makes; you intercept it and decide how to respond (cache, network, or a mix).

3. **Offline/caching strategies (chosen per resource type)**: **Cache-first** — serve from cache, fall back to network. Best for **static, versioned assets** (hashed JS/CSS, fonts) that rarely change — instant and offline-capable. **Network-first** — try the network, fall back to cache. Best for **API data** you want fresh, with cached data as an offline fallback. **Stale-while-revalidate** — serve cached immediately *and* fetch an update in the background for next time. Best **UX/freshness balance** for things like avatars or content that can be slightly stale.

4. **Install prompt**: The browser fires **`beforeinstallprompt`**; you **`preventDefault()`** to stop the default mini-infobar, stash the event, and **call `.prompt()` at a user-chosen moment** (e.g. after they click your "Install" button) for a non-intrusive install experience.

5. **Supporting facts**: An app is **installable** when it has a **valid manifest** (name, icons, `start_url`, `display`), is served over **HTTPS**, registers a **Service Worker**, and works offline. The **update flow** matters — when a new SW installs, it waits; prompt the user to **reload** to activate it (or `skipWaiting` carefully). **Background Sync** queues failed mutations (a message sent while offline) and **retries when connectivity returns**. **Workbox** abstracts all of this (routing, caching strategies, precaching) so you rarely hand-write SW logic. Finally, **iOS/Safari PWA support is limited and quirky** (storage eviction, no push until recently, no `beforeinstallprompt`) — **test on real devices**.

**Evolution:**

1. **Hand-written SW → Workbox**: Start by hand-coding install/activate/fetch handlers, then adopt Workbox to abstract routing, caching strategies, and precaching.

2. **One strategy → per-resource strategies**: Move from a single cache approach to cache-first for static assets, network-first for fresh API data, and stale-while-revalidate for the UX/freshness balance.

3. **Online-only → resilient**: Add Background Sync to queue failed mutations and retry on reconnect, plus an update flow that prompts reload when a new SW activates.

**Follow-ups:**

1. **Why not cache-first for API data?** It can serve stale responses indefinitely; network-first keeps data fresh while still offering an offline fallback.

2. **How do you handle SW updates safely?** A new SW waits; prompt the user to reload to activate, or use `skipWaiting` carefully to avoid breaking in-flight pages.

3. **What breaks on iOS?** Storage eviction, limited/late push, and no `beforeinstallprompt` — so test install and offline on real devices.

**Key points:**

1. **Installable**: Manifest + HTTPS + SW + offline page = installable PWA.

2. **Update flow**: Update flow: prompt user to reload when a new SW activates.

3. **Background Sync**: Background Sync queues failed mutations for retry.

4. **iOS**: iOS has limited PWA support; test on real devices.

---

### 78. Critical CSS & FOUC

**Frequency:** Low

**Question:** What is critical CSS, and what causes FOUC?

**Solution:**

1. **Critical CSS**: The **minimal subset of styles needed to render the above-the-fold content** — what's visible without scrolling. Because **CSS is render-blocking** (the browser won't paint until it has the CSSOM), a large external stylesheet delays first paint. **Inlining the critical CSS directly in the `<head>`** removes that round-trip for the initial view, so the page paints immediately — improving **FCP and LCP** — while the full stylesheet loads afterward.

2. **FOUC (Flash Of Unstyled Content)**: The opposite failure: the **HTML renders before its CSS arrives**, so the user briefly sees unstyled (or wrongly-styled) content that then "snaps" into place. It's commonly caused by loading CSS **asynchronously/late**, injecting styles via JS after paint, or font swaps. The fix is to ensure critical styles are present **before** first paint (inlined), while safely deferring the rest.

3. **The standard pattern**: **Inline critical CSS**, then load the full stylesheet **non-blocking** via the `media` trick:
   ```html
   <style>/* inlined critical CSS */</style>
   <link rel="stylesheet" href="full.css" media="print" onload="this.media='all'">
   ```
   The `media="print"` makes the browser fetch it **without blocking render** (it's "not for screen"), then `onload` flips it to `all` to apply it. Tools like **Critters/Beasties** (and **Next.js**) **extract and inline critical CSS automatically** at build time, so you don't hand-maintain it.

4. **Related guidance**: **`preload`** key fonts/CSS with `<link rel="preload">` to fetch them early; prefer **FOUT over FOIT** for fonts (visible fallback text beats invisible text); and **avoid `@import` inside CSS** — it **serializes downloads** (the browser must fetch and parse the parent stylesheet before it even discovers the import), adding round-trips. Use `<link>` tags or a bundler instead.

**Evolution:**

1. **Blocking stylesheet → inlined critical CSS**: Move from one big render-blocking stylesheet to inlined above-the-fold CSS plus a deferred full sheet.

2. **Manual → build-time extraction**: Replace hand-maintained critical CSS with tools like Critters/Beasties (or Next.js) that extract and inline it automatically.

3. **Serial → parallel loading**: Drop `@import` serialization in favor of `<link>`/bundler loading and `preload` for key assets.

**Follow-ups:**

1. **Why does `media="print"` defer the stylesheet?** The browser fetches it without blocking render (it's "not for screen"), then `onload` flips it to `all` to apply.

2. **What's the risk of inlining too much?** It bloats the HTML and defeats caching; inline only the above-the-fold subset.

3. **Why avoid `@import` in CSS?** It serializes downloads — the parent sheet must be fetched and parsed before the import is even discovered.

**Key points:**

1. **Pattern**: Inline critical CSS, then load full stylesheet with `media="print" onload="this.media='all'"`.

2. **Preload**: Preload key fonts/CSS with `<link rel="preload">`.

3. **FOUT vs FOIT**: FOUT (text) is usually preferred over FOIT (invisible text).

4. **@import**: Avoid `@import` in CSS — it serializes downloads.

---

### 79. Garbage collection (mark-and-sweep)

**Frequency:** Low

**Question:** How does JavaScript garbage collection work, and how do you avoid leaks?

**Solution:**

1. **Mark-and-sweep**: JS engines reclaim memory automatically using **mark-and-sweep**: starting from **roots** (global object, the current call stack, active closures), the collector **marks** every object **reachable** by following references, then **sweeps** (frees) everything unmarked. The core definition of a "live" object is thus **reachability** — not whether you'll actually use it again.

2. **Generational heap (V8)**: Modern engines (V8) are **generational**, exploiting the "most objects die young" observation by splitting the heap. **Young generation** — collected frequently by the fast **Scavenger** (copying collector). Most short-lived objects die here cheaply. **Old generation** — objects that survive several young-gen collections get **promoted** here, collected less often by **Mark-Compact** (which also **compacts** to reduce fragmentation).

3. **Avoiding memory leaks**: You **can't force GC** from JS (there's no reliable API), so avoiding **memory leaks** — objects that stay *reachable* but are logically dead — is the developer's job. **Detach event listeners** you added (`removeEventListener`) — a listener keeps its target and closure alive. **Clear timers/intervals** (`clearInterval`) — a live interval retains its callback's scope forever. **Null out or bound long-lived caches** — an ever-growing `Map` cache is a classic leak; use an LRU or **`WeakMap`** (whose keys don't prevent collection). Beware **closures retaining their entire scope chain** — a closure that captures a large object keeps it alive as long as the closure lives.

4. **Why not reference counting**: Why mark-and-sweep and not **reference counting** (old IE): reference counting **can't collect cycles** — two objects referencing each other keep each other's count above zero even when nothing else references them, leaking forever. Reachability-based GC handles cycles naturally.

5. **Debugging**: The **DevTools Memory profiler** (heap snapshots) finds leaks — e.g. **detached DOM nodes** still referenced by JS (removed from the page but held by a variable). **`FinalizationRegistry`** can run a cleanup callback *after* an object is collected, but its timing is non-deterministic — use sparingly, never for critical logic.

**Evolution:**

1. **Reference counting → reachability**: Engines moved past refcounting (which leaks on cycles) to mark-and-sweep based on reachability from roots.

2. **Single heap → generational**: V8 split the heap into young (Scavenger) and old (Mark-Compact with compaction) generations to exploit "most objects die young."

3. **Manual cleanup → weak references**: Beyond detaching listeners/timers, use `WeakMap`/`WeakRef` and `FinalizationRegistry` so long-lived structures don't pin memory.

**Follow-ups:**

1. **Why did reference counting fail?** It can't collect reference cycles — mutually referencing objects keep each other's count above zero forever.

2. **How do you find a leak?** Use DevTools heap snapshots to spot detached DOM nodes and growing retained sizes across snapshots.

3. **When is `WeakMap` the right cache?** When keys are objects and you want entries to disappear once the key is otherwise unreachable, avoiding an ever-growing cache.

**Key points:**

1. **Cycles**: Reference counting (old IE) failed on cycles.

2. **Profiler**: DevTools Memory profiler finds detached DOM nodes.

3. **Closures**: Closures retain their entire scope chain.

4. **FinalizationRegistry**: `FinalizationRegistry` runs cleanup when objects are GC'd (use sparingly).

---

### 80. Symbols; `Symbol.iterator`

**Frequency:** Low

**Question:** What are Symbols in JavaScript, and what is `Symbol.iterator`?

**Solution:**

1. **Unique primitive**: A **Symbol** is a **unique, immutable primitive** — every `Symbol('desc')` call returns a brand-new value that is **never equal to any other**, even one with the same description (the string is just a debug label). This uniqueness makes them ideal as **non-colliding property keys**: a library can add a symbol-keyed property to an object with **zero risk** of clashing with the user's own keys or another library's.

2. **Well-known protocol hooks**: Their second, bigger role is as **well-known protocol hooks** — built-in symbols the language itself looks for to customize object behavior. **`Symbol.iterator`** — define this method and your object becomes **iterable**, working with `for...of`, spread `[...obj]`, and destructuring. It must return an iterator (an object with a `next()` returning `{ value, done }`):
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
   **`Symbol.asyncIterator`** — the async equivalent, powering `for await...of`. **`Symbol.toPrimitive`** — customize how an object is **coerced** to a number/string.

3. **`Symbol.for(key)` global registry**: **`Symbol.for(key)`** is different from `Symbol()` — it looks up (or creates) a symbol in a **global registry** shared across the whole realm, so `Symbol.for('x') === Symbol.for('x')`. Use it when you need the *same* symbol from different modules/realms.

4. **Hidden from enumeration**: Key behaviors that follow from being symbols: they're **hidden from ordinary enumeration** — they don't show up in `for...in` or `Object.keys()` (only `Object.getOwnPropertySymbols()`/`Reflect.ownKeys()` reveal them), and **`JSON.stringify` skips them entirely**. That makes them perfect for **library extension points / metadata** you don't want leaking into serialization or iteration. TypeScript supports **`unique symbol`** typing so a specific symbol constant can serve as a distinct type-level key.

**Evolution:**

1. **String keys → symbol keys**: Move from string property keys (collision-prone) to symbol keys for safe, non-colliding library metadata.

2. **Local → global symbols**: Use `Symbol()` for per-module uniqueness, then `Symbol.for(key)` when the same symbol must be shared across modules/realms.

3. **Custom iteration → async**: Implement `Symbol.iterator` for `for...of`/spread, then `Symbol.asyncIterator` for `for await...of` over async sources.

**Follow-ups:**

1. **`Symbol()` vs `Symbol.for()`?** `Symbol()` is always unique; `Symbol.for('x')` returns the same registered symbol across the realm.

2. **Why are symbols good extension points?** They don't appear in `for...in`/`Object.keys` and are skipped by `JSON.stringify`, so metadata won't leak into enumeration or serialization.

3. **How do you make an object iterable?** Define a `[Symbol.iterator]()` method returning an iterator whose `next()` yields `{ value, done }`.

**Key points:**

1. **Enumeration**: Symbol-keyed properties don't appear in `for...in` or `Object.keys`.

2. **Serialization**: `JSON.stringify` skips symbol keys.

3. **TypeScript**: TypeScript supports unique-symbol typing.

4. **Extension points**: Use for library extension points to avoid name clashes.

---

### 81. Proxies & Reflect

**Frequency:** Low

**Question:** What are `Proxy` and `Reflect`, and how do they power reactivity?

**Solution:**

1. **Proxy & traps**: A **`Proxy`** wraps a **target object** and intercepts fundamental operations on it via **traps** — handler functions named after the operation: `get` (property read), `set` (write), `has` (`in` operator), `deleteProperty`, `apply` (function call), `construct` (`new`), and more. Whenever code touches the proxy, the corresponding trap runs instead of the default behavior, letting you observe, validate, transform, or block the operation transparently — the consumer can't tell it's not a plain object.
2. **Powers reactivity**: This is exactly what **modern reactivity** is built on. **Vue 3** wraps your state in a Proxy: the **`get` trap tracks** which effect is reading which property (dependency collection), and the **`set` trap triggers** re-runs of the effects that depend on it. **MobX** and various validation/observation libraries work the same way. Compared to the old `Object.defineProperty` approach (Vue 2), proxies can intercept **property additions/deletions and array index changes** without special-casing.
3. **Reflect companion**: **`Reflect`** is the companion: a namespace of **static methods that mirror every proxy trap** (`Reflect.get`, `Reflect.set`, `Reflect.has`, `Reflect.deleteProperty`, `Reflect.apply`…). Inside a trap you call the matching `Reflect` method to **forward the operation to the target with correct default semantics** — crucially preserving the correct `receiver` so getters/setters up the prototype chain bind `this` properly:
```js
const p = new Proxy(target, {
  get(t, key, receiver) {
    track(t, key);
    return Reflect.get(t, key, receiver); // correct default behavior
  }
});
```
4. **Caveats**: proxies **can't intercept internal slots** — things like a `Map`'s backing data, a `Date`'s timestamp, or a private `#field` live in internal slots the traps never see, so proxying those built-ins breaks unless you special-case. There's **non-trivial per-operation overhead**, so avoid proxies in hot paths. **`Proxy.revocable`** creates a proxy you can later **disable** (all traps throw afterward) — useful for handing out revocable capabilities. Overall, proxies are the **foundation of modern fine-grained reactivity**.

**Evolution:**

1. **From `defineProperty` to Proxy**: Vue 2 used `Object.defineProperty` and had to special-case array mutations and added/deleted keys; Vue 3's Proxy intercepts those natively, removing the old workarounds.
2. **Fine-grained reactivity**: As state trees grow, proxy-based dependency tracking scales to large, nested stores without wiring getters/setters manually per property.
3. **Revocable capabilities**: `Proxy.revocable` lets systems hand out sandboxed references that can be invalidated later, scaling to plugin/security use cases.

**Follow-ups:**

1. **Hot-path cost**: When is the per-operation overhead unacceptable, and how do you avoid proxying objects accessed in tight loops?
2. **Built-ins**: How do reactivity libraries handle `Map`/`Set`/`Date` given internal slots can't be trapped?
3. **receiver correctness**: Why must you forward `receiver` through `Reflect.get`/`set` rather than reading the target directly?

**Key points:**

1. **Internal slots**: Proxies can't intercept internal slots (Map's data, Date's timestamp).
2. **Overhead**: Performance overhead is non-trivial; avoid in hot paths.
3. **Revocable**: Can be revocable via `Proxy.revocable`.
4. **Foundation**: Foundation of modern reactivity systems.

---

### 82. TS: declaration merging

**Frequency:** Low

**Question:** What is declaration merging in TypeScript, and when do you use module augmentation?

**Solution:**

1. **What it is**: **Declaration merging** is TypeScript combining **multiple declarations with the same name** into a single definition. The most common case: two `interface Foo` declarations in scope merge their members into one interface — additive by design. `namespace`s also merge (with each other, and with classes/functions/enums of the same name to attach static members).
2. **Module augmentation**: The practical superpower is **module augmentation** — using `declare module 'foo'` to **reach into a third-party package's types and add to them** without forking it:
```ts
// add a custom Jest matcher
declare module 'expect' {
  interface Matchers<R> { toBeWithinRange(min: number, max: number): R; }
}
// add a field to Express's Request
declare module 'express-serve-static-core' {
  interface Request { user?: { id: string }; }
}
```
Because the library declared those as `interface`s, your declaration **merges** into them, and now `req.user` is typed everywhere. This is how you type Jest custom matchers, attach auth data to `Request`, register module-federation remotes, etc.
3. **Global augmentation**: **`declare global { }`** does the same for the **global scope** — e.g. adding a property to `Window`, or typing a theme: `styled-components` exposes an **empty `DefaultTheme` interface** *specifically so you can merge your theme shape into it* and get typed `props.theme` everywhere.
4. **Constraints**: **only `interface` and `namespace` merge** — two `type` aliases with the same name are a **duplicate-identifier error** (types are meant to be closed). So library authors expose extension points as `interface`s precisely to enable this. Caveat: augmentation is **global/ambient** — merging types across unrelated modules is confusing and surprising to readers, so keep augmentations narrow and well-documented.

**Evolution:**

1. **From forking to augmenting**: Instead of patching `@types` packages or forking libraries, augmentation lets you extend their types in your own code, scaling with dependency upgrades.
2. **Library extension points**: Mature libraries intentionally expose empty `interface`s (e.g. `DefaultTheme`) so consumers can grow the types as their app grows.
3. **Narrow scoping discipline**: As a codebase scales, keeping augmentations narrow and documented prevents ambient types leaking confusion across unrelated modules.

**Follow-ups:**

1. **type vs interface**: Why do `type` aliases conflict while `interface`s merge, and how does that affect public API design?
2. **Discoverability**: How do you keep ambient augmentations discoverable so readers aren't surprised by magic `req.user` typing?
3. **Global vs module**: When should you reach for `declare global` versus `declare module`?

**Key points:**

1. **Only interface/namespace**: Only `interface` and `namespace` merge; `type` aliases conflict.
2. **Global augmentation**: Global augmentation via `declare global { }`.
3. **Theme typing**: Useful for theme typing (`styled-components`'s `DefaultTheme`).
4. **Keep narrow**: Avoid merging across unrelated modules — confusing to readers.

---

### 83. TS: `as const` & literal types

**Frequency:** Low

**Question:** What does `as const` do, and why is it useful?

**Solution:**

1. **What it does**: **`as const`** is a **const assertion** that tells TypeScript to infer the **narrowest, most literal, deeply-`readonly`** type for a value instead of its usual **widened** type. Without it, `const x = 'home'` in an object property widens to `string` and arrays become mutable `string[]`; with it, everything is frozen to exact literals.
2. **Three effects**: Concretely it does three things:
   - **Literals stay literal**: `'foo'` is typed `'foo'`, not `string`; `42` is `42`, not `number`.
   - **Arrays become `readonly` tuples**: `['/home', '/about'] as const` is `readonly ['/home', '/about']`, not `string[]`.
   - **Object properties become `readonly`** and their values literal, recursively (nested shapes are locked too).
3. **Deriving types from values**: Why it matters: it lets you **derive types from values** so you write data once and get the types for free. The canonical pattern is turning an array into a **string-literal union**:
```ts
const ROUTES = ['/home', '/about', '/contact'] as const;
type Route = typeof ROUTES[number]; // '/home' | '/about' | '/contact'
```
Now `ROUTES` is your single source of truth for both the runtime list *and* the type. This is essential for **Redux action creators** (so `type` is a literal that discriminates), **route/config definitions**, enum-like objects, and anything feeding inference.
4. **Pairs with `satisfies`**: It pairs beautifully with **`satisfies`** (TS 4.9+): `satisfies` **validates** the value against a type **without widening** it, so you get both the check *and* the narrow literal inference — `const cfg = {…} as const satisfies Config`. Bottom line: reach for `as const` whenever you want a value's *exact shape* to flow into the type system rather than being generalized away.

**Evolution:**

1. **From enums to const unions**: Teams move from TS `enum`s to `as const` arrays/objects that derive unions, avoiding enum runtime quirks while staying a single source of truth.
2. **`satisfies` arrival (4.9+)**: Pairing `as const satisfies Config` added validation without sacrificing narrow inference, scaling to large typed config files.
3. **Single source of truth**: As configs/routes grow, deriving types from values keeps runtime data and types from drifting apart.

**Follow-ups:**

1. **as const vs satisfies**: When do you need both together versus just one?
2. **readonly friction**: How do deeply-`readonly` tuples interact with code that mutates arrays?
3. **Union explosion**: Can deriving unions from large arrays hurt compile performance or error readability?

**Key points:**

1. **Validate without widening**: Pairs with `satisfies` to validate without widening.
2. **Literal unions**: Enables string-literal unions from arrays.
3. **No widening**: Prevents `'foo'` widening to `string`.
4. **Nested lock**: Works on object literals to lock down nested shapes.

---

### 84. Error subclassing, `cause`, async stack traces

**Frequency:** Low

**Question:** How do you model errors well — subclassing, `cause`, and async stack traces?

**Solution:**

1. **Subclass `Error`**: Subclass `Error` for domain-specific types so callers can branch on them with `instanceof`. Critically, **set `this.name`** in the constructor — otherwise the class name is lost after minification and the message prefix stays `Error`:
```ts
class NotFoundError extends Error {
  constructor(public id: string) {
    super(`Missing ${id}`);
    this.name = 'NotFoundError';
  }
}
```
This lets middleware map a `NotFoundError` → HTTP 404 cleanly instead of string-matching messages.
2. **Preserve the chain with `cause`**: (ES2022): `new Error('Failed to load user', { cause: originalError })`. When you catch a low-level error and rethrow a higher-level one, `cause` **keeps the original attached** so the root cause isn't lost. This is the standard **wrap-and-rethrow** pattern — add context at each layer without discarding what actually broke; loggers and `console` print the full chain.
3. **Async stack traces**: modern V8 **stitches stacks across `await` boundaries**, so an error thrown deep in an async call chain shows the logical `await` path, not just the microtask that happened to run it — dramatically better debugging than the old "async trampoline" noise.
4. **Always throw `Error` objects**: never strings/objects: `throw 'oops'` gives you **no stack trace**, and `catch` receives a bare string. `Error` instances carry `.stack`, `.message`, `.cause`, and work with `instanceof`.
5. **Supporting details**: in Node, **`Error.captureStackTrace(this, MyError)`** in a custom error factory trims the constructor frames from the trace. **Never swallow errors** with an empty `catch {}` — at minimum log or rethrow. And in TS (4.4+ default `useUnknownInCatchVariables`), the **`catch` variable is typed `unknown`**, forcing you to narrow (`if (e instanceof Error)`) before using it — which prevents unsafe assumptions about what was thrown.

**Evolution:**

1. **From string errors to typed hierarchies**: Codebases move from `throw 'msg'` to subclassed `Error` types so middleware can branch cleanly on `instanceof`.
2. **`cause` standardization (ES2022)**: Error chaining went from ad-hoc `.originalError` fields to the standard `{ cause }` option, letting loggers print full chains at scale.
3. **Safer catch typing (TS 4.4+)**: `useUnknownInCatchVariables` pushed teams to narrow before use, reducing unsafe assumptions as error paths multiply.

**Follow-ups:**

1. **Minification**: Why does `this.name` matter after bundling, and what else breaks `instanceof` across bundles/realms?
2. **Serialization**: How do you serialize an error chain (with `cause`) across a network boundary?
3. **Observability**: How do structured loggers surface `cause` chains and async stacks in production?

**Key points:**

1. **captureStackTrace**: Use `Error.captureStackTrace` in custom error factories (Node).
2. **cause pattern**: `cause` is the standard wrap-and-rethrow pattern.
3. **Don't swallow**: Avoid swallowing errors with empty `catch`.
4. **unknown catch**: Type errors as `unknown` in `catch` clauses (TS 4.4+ default).

---

### 85. Hydration mismatches

**Frequency:** Low

**Question:** What causes React hydration mismatches, and how do you fix them?

**Solution:**

1. **What hydration is**: **Hydration** is the process where React takes **server-rendered HTML** and **attaches event listeners / reconstructs its internal tree** on the client, making the static markup interactive — *without* re-creating the DOM. It assumes the **client's first render produces exactly the same output as the server did**. A **mismatch** happens when it doesn't, and React finds DOM that disagrees with what it expected.
2. **Common causes**: anything **non-deterministic or environment-dependent** in render:
   - **Random values** — `Math.random()`, `Date.now()`, or randomly-generated IDs produce different output on server vs client.
   - **Locale/timezone formatting** — the server formats a date/number in one locale/timezone, the browser in another. A *very* frequent culprit.
   - **Browser-only conditionals** — reading `window`, `localStorage`, `matchMedia`, or user-agent during render, which exist only on the client.
3. **React 18 recovery**: React 18 handles a mismatch by **discarding the server HTML for that subtree and client-rendering it fresh** (recovering visually), while emitting a **dev warning**. That recovery isn't free — it costs a re-render and can cause a flash — so mismatches should be fixed, not ignored.
4. **Fixes**:
   - **`useId()`** — generates IDs that are **stable and identical across server and client**, solving the random-ID case (essential for `aria-*`/label associations).
   - **`suppressHydrationWarning`** — for a *known, unavoidable* divergence (e.g. a timestamp), set this on the element to silence the warning for that node only.
   - **Defer browser-only content** — render the server-safe version first, then update in **`useEffect`** (which runs only on the client, after hydration), or read external/browser state via **`useSyncExternalStore`** with a proper server snapshot. This guarantees the first client render matches the server.
5. **Notes**: **React 19** improves the diagnostics (clearer mismatch messages, less silent corruption). And **streaming SSR** can *mask* mismatches by hydrating progressively — so test with **JS disabled** and watch the console to catch them early.

**Evolution:**

1. **Hard crash → graceful recovery**: Earlier React threw/corrupted on mismatch; React 18 recovers by client-rendering the subtree, improving resilience as SSR adoption grew.
2. **Primitives for determinism**: `useId` and `useSyncExternalStore` were added so apps can deterministically bridge server/client state at scale instead of ad-hoc guards.
3. **Better diagnostics (React 19)**: As apps scale, clearer mismatch messages reduce silent corruption and debugging time.

**Follow-ups:**

1. **Streaming masking**: How do you reliably detect mismatches when streaming SSR hides them?
2. **Third-party widgets**: How do you hydrate components that depend on browser-only libraries?
3. **suppress tradeoffs**: When is `suppressHydrationWarning` acceptable versus hiding a real bug?

**Key points:**

1. **Non-determinism**: `Date.now()`/`Math.random()` in render cause mismatches.
2. **Locale/timezone**: Locale/timezone differences are frequent culprits.
3. **React 19**: React 19 improves error messages and reduces silent corruption.
4. **Test with JS off**: Streaming SSR can mask issues — test with JS disabled.

---

### 86. Angular change detection (Zone.js, OnPush, signals)

**Frequency:** Low

**Question:** How does Angular change detection work — Zone.js, OnPush, and signals?

**Solution:**

1. **Zone.js (classic default)**: Angular ships **Zone.js**, which **monkey-patches all async APIs** (`setTimeout`, `addEventListener`, `Promise.then`, XHR/`fetch`). After any async task finishes, Zone notifies Angular, which runs **change detection over the entire component tree** (top-down), re-evaluating bindings to update the DOM. It's automatic and "just works," but checking *everything* on *every* async event is wasteful in large apps.
2. **`OnPush` strategy**: setting `changeDetection: ChangeDetectionStrategy.OnPush` tells Angular to **skip a component's subtree unless** one of: (1) an **`@Input` reference changes** (new object identity — hence favor immutable updates), (2) an **event fires from within** the component, or (3) an **`async` pipe** in its template emits. This prunes huge portions of the CD tree and **dramatically improves performance** in large apps — the standard optimization.
3. **Signals (Angular 17+)**: `signal()`, `computed()`, and `effect()` are **fine-grained reactive primitives**. Reading a signal in a template registers a precise dependency, so a change updates **only the exact bindings that use it**, bypassing tree-walking CD entirely. Signals **don't need Zone.js**, which is why Angular v18+ offers **`provideExperimentalZonelessChangeDetection`** — dropping Zone.js shrinks the bundle and removes the monkey-patch overhead.
4. **Additional facts**: signals **replace many `BehaviorSubject`/manual-CD patterns** with simpler, synchronous reactive state; `computed()` memoizes derived values; and a component **detached** via `ChangeDetectorRef.detach()` runs CD **only** when you explicitly call `detectChanges()` — an escape hatch for extreme performance tuning (e.g. high-frequency data grids).

**Evolution:**

1. **Zone → OnPush → signals**: CD moved from whole-tree checks (Zone.js) to pruned subtrees (OnPush) to fine-grained per-binding updates (signals), each step scaling better to large apps.
2. **Zoneless (v18+)**: `provideExperimentalZonelessChangeDetection` lets apps drop Zone.js entirely, shrinking bundles and removing monkey-patch overhead.
3. **Signals replace RxJS boilerplate**: `signal`/`computed`/`effect` supplant many `BehaviorSubject` + manual-CD patterns as state complexity grows.

**Follow-ups:**

1. **OnPush pitfalls**: What breaks when you mutate inputs in place instead of replacing references under OnPush?
2. **Migration**: How do you incrementally adopt signals in a Zone.js app?
3. **Detach cost**: When is `detach()` + manual `detectChanges()` worth the maintenance burden?

**Key points:**

1. **OnPush perf**: OnPush dramatically improves performance in large apps.
2. **Signals replace Subjects**: Signals (`signal()`, `computed()`, `effect()`) replace many `BehaviorSubject` patterns.
3. **Zoneless v18**: `provideExperimentalZonelessChangeDetection` in v18.
4. **Detached CD**: Detached components run CD only via `ChangeDetectorRef.detectChanges()`.

---

### 87. Angular DI hierarchy

**Frequency:** Low

**Question:** How does Angular's dependency-injection hierarchy resolve providers?

**Solution:**

1. **Two injector trees**: Angular DI resolves a dependency by **walking up two injector trees**. When a component requests a token, Angular searches the **element injector tree** — starting at that component's own injector and climbing through its DOM ancestors — and if not found there, continues into the **environment/module injector tree** (root and any lazy-loaded scopes). The **first** provider found wins, so a provider declared lower down **shadows** one higher up.
2. **Scoping control**: This hierarchy gives you scoping control:
   - **`providedIn: 'root'`** on an `@Injectable` registers a **tree-shakeable application singleton** — one instance shared everywhere, and if never injected it's **dropped from the bundle** (unlike eager `NgModule.providers`).
   - **Component-level `providers: […]`** creates a **new instance per component instance**, scoped to that component and its children — perfect for **state scoped to a feature** (e.g. a wizard-local service each wizard instance gets its own of).
   - **`inject()`** (v14+) is the modern functional way to obtain a dependency — usable in field initializers, factory functions, guards, and `computed`s — replacing constructor injection in many contexts and enabling composable helper functions.
3. **Provider configuration**: Provider configuration options control *how* the value is produced: **`useClass`** (instantiate a class, possibly a substitute), **`useValue`** (a constant/config object), **`useFactory`** (compute it, with `deps`), and **`useExisting`** (alias one token to another). **`multi: true`** makes several providers for the same token **collect into an array** rather than override — the mechanism behind `HTTP_INTERCEPTORS`, validators, etc.
4. **Resolution modifiers**: resolution modifiers on the injection site tune the search: **`@Optional`** (return `null` instead of throwing if absent), **`@Self`** (only this injector), **`@SkipSelf`** (start at the parent), and **`@Host`** (stop at the host element). **Standalone components** participate with their own injector hierarchy just like `NgModule`-based ones.

**Evolution:**

1. **From NgModule providers to `providedIn: 'root'`**: Tree-shakeable singletons replaced eager module providers, dropping unused services from bundles as apps grow.
2. **Constructor injection → `inject()` (v14+)**: Functional injection enabled composable helpers and use outside constructors.
3. **Standalone injector hierarchy**: Standalone components brought DI scoping without NgModules, simplifying large-app composition.

**Follow-ups:**

1. **Shadowing surprises**: How do you debug a wrong instance being injected because a lower provider shadows the root one?
2. **multi tokens**: How does `multi: true` enable interceptor/validator chains, and what are ordering concerns?
3. **Feature scoping**: When do you want per-component `providers` versus a root singleton?

**Key points:**

1. **Provider configs**: `useClass`/`useFactory`/`useValue`/`useExisting` configure providers.
2. **Multi-providers**: Multi-providers (`multi: true`) collect arrays of values.
3. **Standalone injectors**: Standalone components have their own injector hierarchy.
4. **Modifiers**: `@Optional`, `@Self`, `@SkipSelf`, `@Host` control resolution.

---

### 88. RxJS: switchMap vs mergeMap vs concatMap vs exhaustMap

**Frequency:** Low

**Question:** In RxJS, how do `switchMap`, `mergeMap`, `concatMap`, and `exhaustMap` differ?

**Solution:**

1. **Shared mechanism**: All four are **higher-order mapping operators**: for each value from a source Observable they create an **inner Observable** (typically an HTTP request) and **flatten** its emissions into the output. They differ purely in **how they handle a new source value while a previous inner Observable is still active** — the concurrency policy.
2. **`switchMap` — cancel the previous**: When a new value arrives, it **unsubscribes from the in-flight inner** and switches to the new one. Only the latest matters. Perfect for **type-ahead search**: as the user keeps typing, stale requests are cancelled so a slow earlier response can't overwrite a newer one. This makes it the **right default for HTTP triggered by user input**.
3. **`mergeMap` — run all in parallel**: Every source value spins up an inner Observable and they **all run concurrently**, emitting as they resolve (order not guaranteed). Great for **independent operations** (e.g. fire N logging calls). Danger: it can **swamp the server** with unbounded concurrency — cap it with the concurrency argument `mergeMap(fn, n)`.
4. **`concatMap` — queue sequentially**: It waits for each inner Observable to **complete before starting the next**, **preserving order**. Use when order/serialization matters (e.g. sequential writes that must not interleave). Cost: **latency** — everything runs one-at-a-time.
5. **`exhaustMap` — ignore new while busy**: While an inner Observable is in-flight, **new source values are dropped** until it completes. Perfect for a **submit button / login**: rapid double-clicks are ignored, **preventing double-submission**, until the current request finishes.
6. **Mnemonic**: **switch** = latest wins (cancel old), **merge** = all at once, **concat** = one after another in order, **exhaust** = first wins (ignore the rest).

**Evolution:**

1. **Match operator to intent**: Teams learn to pick the concurrency policy (cancel/parallel/queue/ignore) per use case rather than defaulting to one operator everywhere.
2. **Bounded concurrency**: As traffic scales, `mergeMap(fn, n)` caps in-flight requests to protect backends from unbounded fan-out.
3. **Cancellation hygiene**: `switchMap` becomes the standard for user-driven HTTP because it cancels stale work automatically as input rates rise.

**Follow-ups:**

1. **Wrong default**: What bugs appear if you use `mergeMap` for type-ahead instead of `switchMap`?
2. **Ordering vs latency**: How do you balance `concatMap` ordering guarantees against its serialized latency?
3. **Inner errors**: How does an inner Observable error affect the outer stream across these operators?

**Key points:**

1. **switchMap default**: `switchMap` is the right default for HTTP triggered by user input.
2. **mergeMap concurrency**: `mergeMap` can swamp the server — limit concurrency with `mergeMap(fn, n)`.
3. **concatMap order**: `concatMap` preserves order at the cost of latency.
4. **exhaustMap dedupe**: `exhaustMap` prevents double-submission.

---

### 89. Angular standalone vs NgModules

**Frequency:** Low

**Question:** How do Angular standalone components compare to NgModules?

**Solution:**

1. **What standalone is**: **Standalone components** (stable in v14+, the **default in v17+**) let a component **declare its own dependencies directly** via `standalone: true` and an `imports: […]` array — pulling in the other components, directives, and pipes it uses, plus its own providers. They **no longer need to be declared in an `NgModule`**, eliminating the historical boilerplate where every component had to be registered in some module's `declarations`.
2. **Benefits**: a **simpler mental model** (a component is self-contained — what it needs is right there), **better tree-shaking** (the compiler sees exactly what each component imports, so unused code is dropped more reliably than with broad `NgModule` imports), and **faster builds**. **NgModules still work** — they remain for grouping related declarations and interoperating with older/library code — but they're no longer the required unit of composition. Guidance: **new apps should be 100% standalone**, and libraries are actively migrating.
3. **Functional configuration**: The standalone world replaces module machinery with functional configuration:
   - **`bootstrapApplication(AppComponent, { providers: […] })`** replaces the old `NgModule`-based `platformBrowserDynamic().bootstrapModule(AppModule)` — the app boots from a single root component.
   - **Route-level lazy loading** uses **`loadComponent: () => import('./page').then(m => m.Page)`** to lazy-load a *component* directly (no lazy module needed); `loadChildren` can point at a routes array.
   - Features are wired up with **`provide*` functions** — `provideRouter(routes)`, `provideHttpClient()`, `provideAnimations()` — passed to `bootstrapApplication`, replacing `RouterModule.forRoot()`, `HttpClientModule`, etc.
4. **Incremental adoption**: Existing apps can adopt it incrementally via the **migration schematic** `ng generate @angular/core:standalone`, which converts declarations automatically.

**Evolution:**

1. **NgModule → standalone default (v17)**: Composition moved from required `NgModule` declarations to self-contained components, cutting boilerplate.
2. **Module bootstrap → `bootstrapApplication`**: App startup and feature wiring moved to functional `provide*` APIs.
3. **Incremental migration**: The migration schematic lets large existing apps convert gradually rather than rewriting all at once.

**Follow-ups:**

1. **Interop**: How do standalone components and NgModule-based code interoperate during migration?
2. **Tree-shaking gains**: Why does explicit per-component `imports` tree-shake better than broad module imports?
3. **Lazy loading**: How does `loadComponent` change route-splitting compared to lazy modules?

**Key points:**

1. **bootstrapApplication**: `bootstrapApplication(AppComponent, { providers: [...] })` replaces `NgModule` bootstrap.
2. **loadComponent**: Route-level lazy loading: `loadComponent: () => import(...)`.
3. **provide functions**: `provideRouter`, `provideHttpClient` configure features functionally.
4. **Migration schematic**: Migration schematic: `ng generate @angular/core:standalone`.

---

### 90. Vue composition vs options API

**Frequency:** Low

**Question:** Options API vs Composition API in Vue — when do you use each?

**Solution:**

1. **Same component, two styles**: They're two ways to author the *same* Vue 3 component; the difference is **how you organize logic**.
2. **Options API**: The Options API structures a component as an object of **named options** — `data`, `methods`, `computed`, `watch`, and lifecycle hooks (`mounted`, etc.). Vue collects each concern into its bucket. It's **easy to learn** and very approachable for small components, but it has a scaling problem: the logic for **one feature gets scattered** across multiple options — a search feature's state lives in `data`, its handler in `methods`, its derived value in `computed`, its cleanup in `unmounted`. In a large component you scroll back and forth to follow a single feature.
3. **Composition API**: The Composition API (`setup()`, or the ergonomic **`<script setup>`**) instead lets you **group code by logical concern**. All of a feature's reactive state, computeds, watchers, and lifecycle logic sit **together**, and you can **extract it into a composable** — a reusable `useSomething()` function — to share across components. This is far better for **TypeScript** (plain variables and functions infer cleanly, unlike `this`-based options) and for **large components**. Composables **replace mixins**, avoiding mixins' name-collision and unclear-source problems since everything is explicit imports and returns.
4. **Guidance & primitives**: Both ship in Vue 3 and the **Options API has no planned deprecation** — pick per team/complexity — but the **Composition API is recommended for new code**, especially anything non-trivial or TS-heavy. Under the hood both use the same **reactivity primitives**: **`ref`** (reactive wrapper for primitives, accessed via `.value`), **`reactive`** (for objects), **`computed`** (cached derived state), and **`watch`** (side effects on change). `<script setup>` is the recommended syntax — it's more concise (top-level bindings are auto-exposed to the template) and better-optimized at compile time.

**Evolution:**

1. **Options → Composition for scale**: As components grow, Composition API groups feature logic together instead of scattering it across option buckets.
2. **Mixins → composables**: Reuse moved from implicit, collision-prone mixins to explicit `useFoo()` composables.
3. **`<script setup>` ergonomics**: The compile-time `<script setup>` syntax reduced boilerplate and improved optimization for new code.

**Follow-ups:**

1. **Migration**: Can you mix Options and Composition in the same app, and how do you migrate incrementally?
2. **TS story**: Why does Composition API infer types better than `this`-based Options?
3. **ref vs reactive**: When do you choose `ref` over `reactive`, and what are the `.value` gotchas?

**Key points:**

1. **script setup**: `<script setup>` is the ergonomic syntax.
2. **Composables**: Composables (`useFoo`) replace mixins.
3. **No deprecation**: Options API still works, no deprecation planned.
4. **Primitives**: Reactivity primitives (`ref`, `reactive`, `computed`, `watch`) are the building blocks.

---

### 91. Vue Proxy reactivity

**Frequency:** Low

**Question:** How does Vue 3's Proxy-based reactivity work, and why does destructuring break it?

**Solution:**

1. **Proxy engine**: Vue 3 makes state reactive by wrapping objects in a **`Proxy`** (replacing Vue 2's `Object.defineProperty`). During a component's render, every property the template *reads* is **tracked** (the `get` trap records "this render depends on this property"); when a tracked property is later *written* (the `set` trap fires), Vue **re-runs the renders that depend on it**. This dependency-tracking + trigger cycle is the whole engine.

2. **reactive vs ref**: Two entry points wrap different things: **`reactive(obj)`** returns a Proxy of an **object** — access properties normally (`state.count`). **`ref(value)`** wraps a **primitive** (or object) in an object with a **`.value`** property; you read/write `count.value`. The `.value` indirection is necessary because a raw primitive can't be proxied — there's no object to intercept. (In templates, refs are auto-unwrapped so you write `count`.)

3. **computed**: **`computed`** creates a **cached** derived value: it re-evaluates **only when its reactive dependencies change**, otherwise returning the memoized result — cheap to read repeatedly.

4. **Why destructuring loses reactivity**: reactivity lives in the **Proxy wrapper**, not the values inside. `const { count } = reactive({ count: 0 })` **copies the primitive out** of the proxy — `count` is now a detached plain number with no connection to the trap, so changing it (or changing the source) triggers nothing. The fix is **`toRefs`/`toRef`**, which convert each property into a **`ref` that stays linked** to the original reactive object: `const { count } = toRefs(state)` gives you a real ref you can destructure and pass around while preserving reactivity.

5. **v2 vs v3 limitations**: Vue 2's `Object.defineProperty` **couldn't detect newly-added properties or array-index/length changes** (hence the old `Vue.set` workaround) — the Proxy approach in v3 **handles adds/deletes natively**.

6. **Performance escape hatches**: for large/deep structures, **`shallowRef`/`shallowReactive`** track only the top level (skip deep conversion), and **`readonly`** produces an immutable proxy view (writes warn and are ignored) for safely sharing state you don't want mutated.

**Evolution:**

1. **From defineProperty to Proxy**: Vue 2's property-by-property interception missed array/length and newly-added keys; Vue 3's whole-object `Proxy` closes those gaps natively, removing the need for `Vue.set`/`Vue.delete`.

2. **Scaling to large state**: as reactive graphs grow, deep conversion becomes a cost — move to `shallowRef`/`shallowReactive` to track only the top level, and `markRaw` to opt objects out of reactivity entirely.

3. **Safe sharing**: once state is shared across many components, wrap exported state in `readonly` so consumers can read but not mutate, keeping writes centralized.

**Follow-ups:**

1. **Why not just use `reactive` everywhere?** Primitives can't be proxied, so `ref` is required for standalone primitive state; many teams standardize on `ref` for consistency.

2. **What breaks reactivity besides destructuring?** Replacing a reactive variable wholesale (`state = newObj`), spreading (`{...state}`), or passing `.value` into a non-reactive context all detach from the proxy.

3. **Tradeoff of `shallowReactive`**: nested mutations won't trigger updates, so you must replace the whole top-level reference or manually `triggerRef`.

**Key points:**

1. **toRefs/toRef**: `toRefs`/`toRef` preserve reactivity when destructuring.

2. **v2 limitation**: Vue 2 used `Object.defineProperty`, which missed new properties — fixed in v3.

3. **shallow APIs**: `shallowRef`/`shallowReactive` for performance with large objects.

4. **readonly**: `readonly` creates immutable views.

---

### 92. Form libs (react-hook-form vs Formik)

**Frequency:** Low

**Question:** react-hook-form vs Formik — which do you pick and why?

**Solution:**

1. **Core distinction**: The core difference is **controlled vs uncontrolled inputs**, which drives their performance profiles.

2. **Formik (controlled)**: **Formik** uses **controlled inputs** — every keystroke updates React state, which **re-renders the form** (and often the whole form tree) on each character. That's a **simple, familiar mental model** and perfectly fine for **small forms**, but it doesn't scale: large forms with many fields get noticeably janky because typing in one field re-renders everything.

3. **react-hook-form (uncontrolled)**: **react-hook-form (RHF)** uses **uncontrolled inputs with refs** — it registers each input and reads values from the DOM via refs rather than mirroring them in React state, so **typing doesn't re-render** the component. This gives **excellent performance** (isolated field updates), a **smaller bundle**, and it subscribes components only to the specific fields/errors they use. It integrates cleanly with **schema validation** and is the **modern default for complex forms** — multi-step wizards, dynamic/repeating fields, and async validation.

4. **Schema validation**: via **Zod / Yup / Valibot** using a resolver — define the shape once, get both runtime validation and (with Zod) inferred TypeScript types for the form values.

5. **Dynamic lists & SSR**: **`useFieldArray`** handles **dynamic lists** (add/remove rows) efficiently without re-rendering unaffected rows. Even with client libraries, **server-rendered forms should keep progressive enhancement** — native `<form>` submission and server-side validation so the form works before/without JS. **TanStack Form** is an emerging **framework-agnostic** alternative (React/Vue/Solid/Svelte) with strong type-safety, worth watching.

6. **Bottom line**: **RHF for anything non-trivial** (performance + validation + dynamic fields); Formik only if you're maintaining an existing codebase already on it.

**Evolution:**

1. **From controlled to uncontrolled**: the industry shifted from Formik's controlled model to RHF's ref-based uncontrolled model specifically to kill per-keystroke re-renders in large forms.

2. **From manual to schema validation**: validation moved from hand-written validate functions to declarative schemas (Zod/Yup/Valibot) via resolvers, unifying runtime checks and TypeScript types.

3. **Toward framework-agnostic**: TanStack Form generalizes the type-safe form pattern across React/Vue/Solid/Svelte, decoupling form logic from a single framework.

**Follow-ups:**

1. **How do you validate on the server too?** Reuse the same Zod schema server-side so the API enforces the same contract as the client resolver.

2. **When would controlled still win?** Tiny forms or ones needing live cross-field derived rendering on every keystroke, where the mental simplicity outweighs re-render cost.

3. **How to handle a multi-step wizard?** RHF's shared form context plus `useFieldArray` lets each step register fields while preserving values across steps.

**Key points:**

1. **Schema validation**: Zod/Yup/Valibot for schema validation.

2. **Dynamic lists**: `useFieldArray` for dynamic lists.

3. **Progressive enhancement**: Server-rendered forms still benefit from progressive enhancement.

4. **TanStack Form**: an emerging framework-agnostic alternative.

---

### 93. Micro-frontends: module federation vs iframes vs single-spa

**Frequency:** Low

**Question:** Compare micro-frontend approaches: Module Federation, iframes, and single-spa.

**Solution:**

1. **Shared premise**: All three let **independently-built/deployed apps** compose into one page; they trade off **isolation vs integration quality vs team autonomy**.

2. **Module Federation**: (Webpack 5, Rspack, Vite plugins) lets separately-built apps **share modules at runtime** — a "host" dynamically loads "remote" bundles and they **share dependencies** (one copy of React) and compose as **native components**, with no iframe boundary. This gives the **best UX and integration** (shared routing, shared state, one DOM) and true team autonomy (each team builds/deploys its remote independently). The cost is **careful version alignment of shared deps** — mismatched React versions across remotes cause subtle runtime breakage — so you must manage the shared-singleton config deliberately. **Angular's Native Federation** is a framework-flavored take on the same idea.

3. **iframes**: give the **strongest isolation** — a fully separate JS context and CSS sandbox per app, so one team truly can't break another's styles or globals. But the **UX is poor**: cross-frame **auth/cookie sharing**, **navigation/deep-linking**, **height auto-sizing**, and communication (postMessage) are all awkward. Best reserved for **legacy or untrusted third-party** integrations where hard isolation is the actual requirement.

4. **single-spa**: is an **orchestrator**: it registers multiple apps — potentially in **different frameworks** (React + Angular + Vue on one page) — and manages their **lifecycle** (bootstrap/mount/unmount) via a contract, mounting/unmounting them as routes change. Great when you must **incrementally migrate** between frameworks or run a mixed-framework estate.

5. **Framing the decision**: Frame the decision as **team autonomy vs UX coherence**: more independence generally costs integration polish and adds operational complexity. And the honest caveat — **micro-frontends are a big tax**; for many teams a **monorepo with a single deploy** delivers most of the autonomy (separate folders/ownership, shared tooling) **without** the runtime-integration and versioning pain. Reach for MFEs only when independent deploy cadence across teams is a hard requirement.

**Evolution:**

1. **From iframes to runtime modules**: early MFEs used iframes for isolation but suffered UX; Module Federation replaced that with runtime module sharing and native composition.

2. **Scaling shared deps**: as remotes multiply, naive sharing breaks on version skew — teams move to explicit singleton/shared config and `strict-dynamic` version pinning.

3. **Mixed-framework migration**: single-spa emerged to incrementally migrate legacy estates across frameworks, then teams often consolidate back to one framework + Federation once migration finishes.

**Follow-ups:**

1. **How do remotes share auth?** Via a shared host-level auth provider (Federation) or postMessage/token passing (iframes); getting this right is a common failure point.

2. **When is a monorepo better?** When teams don't actually need independent deploy cadence — the monorepo gives ownership separation without runtime integration cost.

3. **What breaks with version skew in Federation?** Two copies of React or mismatched singletons cause hook errors and duplicated context — mitigated by shared-singleton config.

**Key points:**

1. **Version alignment**: Federation requires careful version alignment of shared deps.

2. **iframes niche**: iframes work for legacy/third-party integration.

3. **Native Federation**: (Angular) is an Angular-flavored take.

4. **Monorepo alternative**: Monorepo single-deploy often beats MFE complexity.

---

### 94. CSP rollout

**Frequency:** Low

**Question:** How do you roll out a Content Security Policy safely?

**Solution:**

1. **What a CSP is**: A **CSP** is an HTTP header that **allowlists the sources** the browser may load each resource type from — `script-src`, `style-src`, `img-src`, `connect-src`, etc. — so injected/inline scripts from an XSS are **blocked from executing**. It's a strong second line of defense, but a strict policy will **break legitimate resources** if you deploy it blindly, so you roll it out in stages.

2. **Stage 1 — report-only**: Ship **`Content-Security-Policy-Report-Only`** first. This **enforces nothing** but **logs every violation** (via a `report-uri`/`report-to` endpoint that receives JSON describing the blocked resource). You collect real-world violations from production traffic, discover every legitimate source you forgot, and tune the policy **without breaking users**.

3. **Stage 2 — tighten, then enforce**: Once report-only is clean, switch to the enforcing `Content-Security-Policy` header and iteratively remove the dangerous escape hatches: Drop **`'unsafe-inline'`** for scripts — instead allow specific inline scripts via a **per-request nonce** (`script-src 'nonce-<random>'` with a matching `nonce` attribute, regenerated every response) or a **hash** of the script content. Drop **`'unsafe-eval'`** — forbids `eval`/`new Function` (some older libs need refactoring). Add **`'strict-dynamic'`** so a trusted (nonced) script can load its own further scripts without you allowlisting every CDN — the **SPA-friendly** modern approach that avoids brittle host lists.

4. **The inline-script hard part**: The hard part is inline scripts: they need that **per-request nonce** wired through your server-side rendering so each response's header and inline `<script nonce>` match.

5. **Related directives**: worth setting: **`frame-ancestors`** controls who may frame your page — it **replaces the older `X-Frame-Options`** for clickjacking protection and is more flexible. **`upgrade-insecure-requests`** automatically **rewrites `http://` subresource URLs to `https://`**, easing HTTPS migration without hunting down every mixed-content reference.

**Evolution:**

1. **From allowlists to nonces**: early CSPs relied on long host allowlists that were brittle and leaky; modern policies use per-request nonces + `'strict-dynamic'` so you trust scripts transitively instead of listing every CDN.

2. **Report-only to enforcing**: the standard rollout path is observe-then-enforce — ship report-only, mine violation JSON, tighten, then flip to enforcement.

3. **Consolidating headers**: `frame-ancestors` supersedes `X-Frame-Options` and `upgrade-insecure-requests` folds mixed-content fixes into the CSP, reducing header sprawl.

**Follow-ups:**

1. **How do you wire nonces in a CDN/cached setup?** Nonces must be unique per response, so fully cached HTML conflicts with nonces — use hashes for static inline scripts or edge-compute to inject per-request nonces.

2. **What if a third-party widget needs `unsafe-inline`?** Isolate it, request a hash/nonce from the vendor, or sandbox it in an iframe rather than weakening the whole policy.

3. **How do you monitor ongoing violations?** Keep a `report-to` endpoint live in production to catch regressions after new deploys add resources.

**Key points:**

1. **Nonce per request**: Inline scripts need a nonce per request.

2. **Report endpoint**: Report endpoint receives violation JSON.

3. **frame-ancestors**: `frame-ancestors` replaces `X-Frame-Options`.

4. **upgrade-insecure-requests**: `upgrade-insecure-requests` rewrites HTTP to HTTPS.

---

### 95. Source maps in production

**Frequency:** Low

**Question:** How should you handle source maps in production?

**Solution:**

1. **What a source map is**: A **source map** (`.map` file) records how **minified/bundled code maps back to your original source** — file, line, and column. Without it, a production error's stack trace points at `main.a1b2.js:1:48213`, which is useless; **with** it, your error tracker (Sentry, Datadog, Bugsnag) and browser devtools show the **real file/function/line**. So you almost always want to **generate** source maps in production builds — the question is who gets to *see* them.

2. **The security concern**: publicly-served source maps effectively **publish your original, unminified source** (and sometimes comments/logic you'd rather not expose). The best practice is **generate them but don't expose them publicly**.

3. **Upload privately**: **Upload maps to your error-tracking service** during CI/deploy (Sentry CLI, Datadog) so symbolication happens server-side, then either **don't deploy the `.map` files to the web server at all**, or serve them **behind auth / IP allowlist** (e.g. office VPN only).

4. **hidden-source-map**: Use Webpack's **`hidden-source-map`**: it **produces the maps but omits the `//# sourceMappingURL=` comment**, so browsers (and the public) **won't auto-fetch** them, while your uploaded copy still lets the error tracker symbolicate. Alternatively `sourceMappingURL` can point at a **private host** that only your tooling can reach.

5. **Operational details**: **keep maps versioned with each deploy** — a map only symbolicates the exact build it came from, so store them per release/commit. And know the devtool tradeoff: **`eval-source-map` is dev-only** (fast rebuilds, inlined via `eval`, not suitable/safe for prod), whereas **production uses external `.map` files** (`source-map` or `hidden-source-map`) for accurate, separable maps.

**Evolution:**

1. **From public to private maps**: teams first shipped maps publicly for devtools convenience, then moved to upload-and-hide once source exposure became a concern.

2. **From inline to external**: dev uses inlined `eval-source-map` for rebuild speed; production graduates to external `.map` files for accuracy and separability.

3. **Versioned per release**: as deploy frequency rises, maps must be stored per release/commit so each build symbolicates against its own map.

**Follow-ups:**

1. **What if you must serve maps on the web server?** Gate them behind auth or an IP allowlist so only internal tooling can fetch them.

2. **How do you symbolicate without shipping maps at all?** Upload them to the error tracker in CI so symbolication happens server-side, then omit the `.map` from the deploy.

3. **Why not `eval-source-map` in prod?** It inlines via `eval` (CSP-hostile, inaccurate for prod) and is designed for fast dev rebuilds, not accurate production stacks.

**Key points:**

1. **Readability**: Without source maps, stack traces are unreadable.

2. **Private host**: `sourceMappingURL` can point to a private host.

3. **Versioning**: Keep maps versioned with deploys.

4. **Dev vs prod devtool**: `eval-source-map` is dev-only; production uses external `.map` files.

---

### 96. Monorepo (Nx, Turborepo) vs polyrepo

**Frequency:** Low

**Question:** Monorepo (Nx, Turborepo) vs polyrepo — how do you choose?

**Solution:**

1. **Core tradeoff**: A **monorepo** keeps **many packages/apps in one repository**; a **polyrepo** gives each its **own repository**. The tradeoff is **cross-package ergonomics vs isolation**.

2. **Monorepo advantages**: **atomic cross-package changes** (one commit/PR updates a shared library *and* every consumer, so you never have a broken intermediate state or version-bump dance), **simplified refactoring** (find-and-replace across the whole codebase, types checked end-to-end), and **shared tooling/config** (one ESLint/TS/CI setup). The cost is scale — naive setups rebuild/test everything on every change.

3. **The tools**: **Nx** — a full build system: a **project graph** (understands package dependencies), **task orchestration** (only build/test what a change actually affects — "affected" commands), **code generators/scaffolding**, and enforced module boundaries. Best for **large, structured** monorepos. **Turborepo** — lighter, focused on **fast pipelines**: **task caching** and **parallelism** across packages, minimal config. Great when you mainly want speed without Nx's full framework. **pnpm workspaces** — the **lightweight starting point** (dependency hoisting + linking) you can layer Turborepo/Nx on top of later.

4. **Remote caching (killer feature)**: The **killer feature** of both Nx and Turborepo is **remote caching** (**Nx Cloud**, **Turborepo Remote Cache**): build/test outputs are cached and **shared across CI runs and teammates**, so if someone already built a package with the same inputs, everyone else **restores the result instantly** instead of rebuilding. This is what keeps large monorepo CI fast.

5. **Polyrepo advantages & rule of thumb**: **strict isolation** and **independent deploy cadence/versioning** per team — but cross-cutting changes now span many repos and version bumps, which is painful. To scale a monorepo, use **CODEOWNERS** and **per-package/affected CI**; at very large scale (Google/Meta), teams reach for **Bazel/Pants**. And **polyrepo + Changesets** is the natural fit for **OSS package families** published independently to npm. Rule of thumb: **monorepo for one product/org with tightly-coupled packages; polyrepo when independence outweighs coordination cost.**

**Evolution:**

1. **From workspaces to build systems**: teams start with plain pnpm workspaces, then add Turborepo for caching/parallelism, then Nx for full project-graph orchestration as the repo grows.

2. **Scaling CI with caching**: naive monorepos rebuild everything; "affected" commands plus remote caching (Nx Cloud / Turborepo Remote Cache) keep CI time flat as the repo grows.

3. **Very large scale**: at Google/Meta scale, hermetic build systems like Bazel/Pants replace JS-ecosystem tools for correctness and distributed caching.

**Follow-ups:**

1. **How do you stop a monorepo rebuilding everything?** Use affected/project-graph commands plus input-hashed caching so only changed packages and their dependents run.

2. **How do you enforce ownership in a monorepo?** CODEOWNERS plus module-boundary rules (Nx) keep teams from reaching into each other's packages.

3. **When is polyrepo clearly right?** Independently versioned OSS packages published to npm, where Changesets manages per-package releases.

**Key points:**

1. **Remote caching**: Remote caching (Nx Cloud, Turborepo Remote Cache) is the killer feature.

2. **Scaling**: Use code owners and per-package CI to scale.

3. **Bazel/Pants**: for very large scale (Google/Meta style).

4. **Polyrepo + changesets**: Polyrepo plus changesets works for OSS package families.

---

### 97. Mocking (MSW, fetch-mock, DI)

**Frequency:** Low

**Question:** Compare mocking approaches: MSW, fetch-mock, and dependency injection.

**Solution:**

1. **Different layers**: They intercept at **different layers**, which determines how realistic and how coupled your tests are.

2. **MSW (Mock Service Worker)**: intercepts at the **network layer**: in the browser it registers a **Service Worker** that catches outgoing requests; in Node it installs a **request interceptor**. Your app code makes **completely real `fetch`/XHR calls** — nothing in the app is stubbed — and MSW responds with mock data based on **request handlers** you define. This is the modern favorite because you test the app **exactly as it runs in production** (real request code paths), and the **same handlers work in dev, tests, and Storybook**. Its power is realism and reuse.

3. **fetch-mock**: patches the **`fetch` function directly** — replacing the global with a stub that returns canned responses. It's **simpler to set up** for small cases, but it **couples your tests to the transport**: if you switch from `fetch` to Axios or a GraphQL client, the mocks break even though behavior didn't change. You're mocking the *mechanism* rather than the *network*.

4. **Dependency injection**: replaces a real implementation at a **seam** in your architecture — pass a fake `UserService`/repository into the code under test. It's the **most testable and explicit** (no global patching, clear contracts) and doesn't care about transport at all, but it **requires the code to be designed for it** (interfaces, injected dependencies) — you can't retrofit it onto code that news-up its own dependencies.

5. **Best practices across all three**: **use the same handler set for unit and E2E** (MSW makes this easy) to **reduce drift** between test layers; **don't mock what you don't own** — wrap a third-party SDK in your own adapter and mock *that* (so a library API change surfaces in one place, not scattered mocks); and **snapshot/verify the contract, not the mock** — assert on the real request/response shape you depend on rather than re-asserting your own stub. Typical modern choice: **MSW** as the default, **DI** for pure logic seams, **fetch-mock** only for quick throwaway cases.

**Evolution:**

1. **From transport-coupled to network-level**: testing moved from patching `fetch` directly (fetch-mock) to intercepting at the network boundary (MSW), decoupling tests from the HTTP client.

2. **Handler reuse across layers**: the same MSW handler set now spans dev, unit tests, E2E, and Storybook, eliminating divergent mock definitions.

3. **Toward adapter seams**: mature codebases wrap third-party SDKs in their own adapters so DI can swap them and library changes surface in one place.

**Follow-ups:**

1. **Which do you default to and why?** MSW, because tests exercise real request code paths and handlers are reusable across dev/test/Storybook.

2. **When does DI beat MSW?** For pure logic seams with no network at all, where injecting a fake is cleaner than intercepting requests.

3. **Why avoid mocking what you don't own?** A third-party API change should break one adapter mock, not dozens of scattered stubs.

**Key points:**

1. **MSW reuse**: MSW works the same in dev, tests, and Storybook.

2. **Reduce drift**: Same handler set for unit and E2E reduces drift.

3. **Wrap then mock**: Avoid mocking what you don't own — wrap then mock.

4. **Contract not mock**: Snapshot-test the contract, not the mock.

---

### 98. Visual regression (Percy/Chromatic)

**Frequency:** Low

**Question:** How does visual regression testing work, and how do you keep it stable?

**Solution:**

1. **How it works**: Visual regression testing **renders components or pages, captures a screenshot, and diffs it pixel-by-pixel against an approved baseline** image. If pixels differ, it flags the change for review — catching **unintended visual breakage** (a CSS change that shifts an unrelated layout, a broken font, a misaligned button) that functional tests, which only check behavior, would miss entirely.

2. **The main tools**: **Chromatic** — built by the Storybook team; it **snapshots each Storybook story**, giving automatic **per-component** visual coverage and a cloud reviewer UI. **Percy** — **framework-agnostic**, integrates with many E2E runners; snapshots full pages/flows. **Playwright** — has **built-in screenshot diffing** (`toHaveScreenshot`) for a self-hosted option with no external service.

3. **The central challenge — flake**: false diffs from **non-deterministic rendering**: web **fonts** loading at different times, **animations/transitions** caught mid-frame, **dates/timestamps**, random data, and even anti-aliasing differences across OSes. You stabilize by **stubbing/freezing** these: disable animations (`prefers-reduced-motion`/CSS override), **freeze time** and **seed random**, wait for fonts to load, and mask dynamic regions. Deterministic input is what makes the diff meaningful.

4. **Practical guidance**: **pair it with Storybook** so each component's states are captured in isolation (fast, focused baselines). Remember **cross-browser snapshots multiply the baseline count** (Chrome + Firefox + WebKit + mobile = 4× the images to store and review), so scope which browsers you snapshot.

5. **Approval workflow**: a **reviewer UI with human approval is essential** — tools can only say "these pixels changed," not whether the change is *intended*; a person must approve each diff to promote it to the new baseline. Treat visual tests as an **approval workflow**, not a pass/fail gate.

**Evolution:**

1. **From functional-only to visual coverage**: teams added pixel diffing once functional tests proved blind to CSS/layout regressions.

2. **Stabilizing against flake**: naive screenshot tests flaked on fonts/animations/time; mature setups freeze time, seed random, disable animations, and mask dynamic regions.

3. **Scoping cross-browser cost**: as browser matrices grow, teams scope which browsers they snapshot to control baseline count and review load.

**Follow-ups:**

1. **How do you keep diffs meaningful?** Make rendering deterministic — frozen time, seeded random, loaded fonts, disabled animations — so only real changes diff.

2. **Why is human approval unavoidable?** Tools detect pixel change but not intent; only a reviewer can promote a diff to the new baseline.

3. **How do you control storage/review cost?** Limit the browser/device matrix and scope snapshots to component states via Storybook.

**Key points:**

1. **Pair with Storybook**: Pair with Storybook for per-component coverage.

2. **Cross-browser cost**: Cross-browser snapshots multiply baseline count.

3. **Reviewer UI**: Reviewer UI is essential — diffs need human approval.

4. **Deterministic data**: Use deterministic test data (frozen time, seeded random).

---

### 99. Feature flags — client vs server eval

**Frequency:** Low

**Question:** Client-side vs server-side feature flag evaluation — what are the tradeoffs?

**Solution:**

1. **What evaluation means**: A feature flag needs to be **evaluated** — resolving a user + context into a variant (on/off, A/B/C). *Where* that evaluation happens has real consequences.

2. **Client-side evaluation**: ships the **flag configuration and rules down to the browser**, and the client SDK decides the variant locally. It's **flexible** — instant toggling, easy **A/B testing** and client-only UI experiments — but has two downsides: it **exposes flag names and rules** (anyone can open devtools and see `new-checkout-enabled`, including unreleased features), and it **adds bundle weight** plus a possible **flash** as flags resolve after load. Bad for **sensitive rollouts** and can hurt SEO (content decided after JS runs).

3. **Server-side evaluation**: keeps the **flag logic private on the server** and sends the client **only the already-resolved variant** (or renders the chosen variant directly). This is **better for sensitive/gradual rollouts** (competitors/users can't see what's coming), for **SEO** (the server renders final HTML), and it avoids client flag-resolution flicker. The tradeoff is that changing a flag may require a new request/render rather than a live client toggle.

4. **The hybrid**: the **server resolves flags on the first request** (so the initial render is correct and flicker-free) and **hydrates a client SDK** with those values, enabling **live client-side toggles** for subsequent interactions — best of both.

5. **Supporting practices**: mature vendors — **LaunchDarkly, Statsig, Unleash, Flagsmith** — handle targeting, rollout %, and analytics. **Wrap flag reads in a typed wrapper** (a single `flags.newCheckout` accessor) so flag keys are type-checked and centralized rather than stringly-typed everywhere. **Sticky bucketing** (a user consistently sees the same variant) **requires stable user identity** — hash a user ID, not a per-session random. And crucially, **clean up flags after a rollout completes** — stale flags and their dead branches accumulate as **tech debt**; treat flag removal as part of finishing the feature.

**Evolution:**

1. **From client to server to hybrid**: flag eval started client-side for flexibility, moved server-side for privacy/SEO, then settled on a hybrid that resolves on first request and hydrates the client for live toggles.

2. **From DIY to platforms**: homegrown flag config gave way to vendors (LaunchDarkly, Statsig, Unleash, Flagsmith) that add targeting, rollout %, and analytics.

3. **Lifecycle discipline**: as flag counts grow, teams add typed wrappers and treat flag cleanup as part of feature completion to curb tech debt.

**Follow-ups:**

1. **How do you avoid flag flicker?** Resolve server-side on first render and hydrate the client with the resolved values.

2. **How do you keep a user on the same variant?** Sticky bucketing by hashing a stable user ID, never a per-session random.

3. **How do you prevent flag sprawl?** Wrap reads in a typed accessor and remove flags + dead branches once rollout completes.

**Key points:**

1. **Vendors**: LaunchDarkly, Statsig, Unleash, Flagsmith are common vendors.

2. **Typed wrapper**: Wrap flag reads in a typed wrapper for safety.

3. **Sticky bucketing**: Sticky bucketing requires user identity.

4. **Cleanup**: Clean up flags after rollout — tech debt accumulates.

---

### 100. Telemetry: error tracking vs RUM vs APM

**Frequency:** Low

**Question:** Error tracking vs RUM vs APM — how do these telemetry categories differ?

**Solution:**

1. **Three complementary questions**: They answer three different questions about production and are **complementary** — mature observability uses all three.

2. **Error tracking**: (Sentry, Rollbar, Bugsnag) answers **"what broke?"** It captures **unhandled exceptions and rejections** with **stack traces**, **breadcrumbs** (the trail of user actions/network calls leading up to the error), device/browser context, and groups duplicates into issues with alerting. This is your first line for catching and triaging bugs users hit.

3. **RUM (Real User Monitoring)**: answers **"how does it *feel* for real users?"** It collects **field performance data** from actual sessions — **Core Web Vitals** (LCP/INP/CLS), navigation/resource timing, and **custom events/timings** — segmented by device, geography, connection, and page. Unlike lab tools (Lighthouse), this is **real-world data** across your whole audience, revealing that, say, users on mobile in a region have terrible LCP.

4. **APM (Application Performance Monitoring)**: (Datadog, New Relic, Dynatrace) answers **"where's the latency across the stack?"** It ties the **frontend action to the backend request chain**, producing **end-to-end traces** — a slow page mapped through the API gateway, services, and database queries — so you can find *which* hop is slow, not just that the page is slow.

5. **Cross-cutting practices**: **Sample heavily on high-traffic sites** — sending every event from millions of sessions is cost-prohibitive and noisy; capture a representative fraction (and often 100% of errors but a % of traces/RUM). **Source maps are essential** for readable stacks — without them error traces point at minified code (upload them privately, as in the source-maps question). **Distributed tracing with OpenTelemetry** — propagate a **trace ID** from the browser through every service (via headers) so frontend and backend telemetry **stitch into one trace**; OTel is the vendor-neutral standard. **Scrub PII before data leaves the client** — strip emails, tokens, form values, and sensitive URL params in the SDK's `beforeSend`/hooks so you never ship personal data to a third-party monitoring vendor (privacy + compliance).

**Evolution:**

1. **From single tool to three pillars**: observability matured from just error tracking to a trio (errors + RUM + APM) answering what broke, how it feels, and where latency lives.

2. **From lab to field data**: performance insight moved from lab tools (Lighthouse) to RUM's real-user field data segmented by device/geo/connection.

3. **Toward vendor-neutral tracing**: distributed tracing standardized on OpenTelemetry so trace IDs stitch frontend and backend across vendors.

**Follow-ups:**

1. **How do you control telemetry cost at scale?** Sample heavily — often 100% of errors but a fraction of traces/RUM — to stay affordable and reduce noise.

2. **How do you connect a frontend error to a backend cause?** Propagate an OpenTelemetry trace ID via headers so frontend and backend telemetry join into one trace.

3. **How do you avoid shipping PII to vendors?** Scrub emails, tokens, and form values in the SDK's `beforeSend` before data ever leaves the client.

**Key points:**

1. **Sampling**: Sample heavily for high-traffic sites.

2. **Source maps**: Source maps are essential for readable stacks.

3. **Distributed tracing**: Distributed tracing (OpenTelemetry) propagates trace IDs across services.

4. **PII scrubbing**: PII scrubbing must run before data leaves the client.

---

