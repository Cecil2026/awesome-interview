# Frontend Interview Questions

100 high-frequency frontend questions covering HTML/CSS, JavaScript/TypeScript, frameworks (React/Angular/Vue), performance, testing, accessibility, networking, and build tooling.

---

### 1. Box model & `box-sizing: border-box`

**Frequency:** High

**Question:** Walk me through the CSS box model, and how does `box-sizing: border-box` change sizing?

**Answer:** The CSS box model wraps every element in four nested boxes: **content** (the text/image), **padding** (space inside the border), **border**, and **margin** (space outside, separating it from neighbors). Every element is a rectangle composed of these layers, and understanding which layer a given property targets is the key to predictable layout.

The **default `content-box`** makes `width`/`height` apply **only to the content area**, so padding and border are *added on top*. A `width: 200px; padding: 20px; border: 5px` element actually renders **250px** wide (200 + 20×2 + 5×2) — a constant source of "why is my box too big?" bugs. **`border-box`** instead makes `width`/`height` *include* padding and border, so that same element renders exactly **200px** and the content area shrinks to absorb the padding/border. This is far more predictable, especially in **grid/flex layouts** where you set percentage or `flex-basis` widths and don't want padding blowing out the track. That's why nearly every modern reset applies it globally:
```css
*, *::before, *::after { box-sizing: border-box; }
```

Two gotchas worth knowing: **margins are outside the box** and don't count toward `width`, and **adjacent vertical margins collapse** (a 20px bottom margin next to a 30px top margin yields 30px total, not 50px). `box-sizing` is **not inherited by default** — the universal-selector reset is what propagates it — and DevTools' computed-styles **box diagram** is the fastest way to see exactly where a stray pixel is coming from.

**Key points:**
- `content-box` is the spec default; `border-box` is the practical default
- Margins are outside the box and collapse vertically between block elements
- `box-sizing` is inherited only when explicitly declared with `inherit`
- Use DevTools' computed-styles box diagram to debug sizing surprises

---

### 2. Block vs inline vs inline-block

**Frequency:** High

**Question:** Compare `block`, `inline`, and `inline-block` display types.

**Answer:** These three `display` values differ along three axes: **whether they start on a new line**, **whether they take full width**, and **whether they honor `width`/`height`/vertical margins**.

- **`block`** (`div`, `p`, `section`, `h1`) — starts on a **new line**, stretches to the **full available width** of its container, and **fully honors** `width`, `height`, and all four margins/paddings. This is the workhorse for structural layout.
- **`inline`** (`span`, `a`, `em`, `strong`) — **flows within text** on the same line, is only as wide as its content, and **ignores `width`/`height` and vertical margins**. Horizontal padding/margin apply visually but don't push sibling lines apart. Because inline boxes sit on the text baseline, they respect **`line-height`**, and the whitespace between inline tags in your HTML **renders as a real space gap** (the classic "mysterious 4px gap" between inline-blocks).
- **`inline-block`** — the hybrid: it **sits inline** next to surrounding text but **accepts box dimensions** (`width`, `height`, vertical margins). Before flexbox, this was the go-to for horizontal button rows, chips, and nav items.

Two important nuances: **replaced inline elements** like `<img>`, `<input>`, and `<video>` accept `width`/`height` *despite* being inline, because they wrap external content with intrinsic dimensions. And when a parent becomes `display: flex` or `grid`, its children stop obeying their own block/inline nature and become **flex/grid items** instead. In modern code you'd reach for **flex or grid** rather than inline-block hacks — they give you gap control, alignment, and no whitespace-gap surprises.

**Key points:**
- Inline elements respect `line-height` and create whitespace gaps between tags
- `display: flex/grid` on a parent makes children behave like block-level participants
- Replaced inline elements (`img`, `input`) accept width/height despite being inline
- Modern layouts prefer flex/grid over inline-block tricks

---

### 3. Flexbox axes & flex-grow/shrink/basis

**Frequency:** High

**Question:** How do flexbox axes work, and what do `flex-grow`/`shrink`/`basis` actually control?

**Answer:** A flex container defines two axes: the **main axis** (horizontal when `flex-direction: row`, the default) and the perpendicular **cross axis**. Alignment properties map onto these axes — **`justify-content`** distributes items along the **main** axis (start/center/space-between/etc.), while **`align-items`** (on the container) and **`align-self`** (per item) align along the **cross** axis. Mixing them up is the #1 flex confusion; the trick is to remember `justify` follows the direction items flow.

The **`flex` shorthand** is `flex: <grow> <shrink> <basis>` and governs how free space is distributed:
- **`flex-grow`** — a unitless weight for dividing **leftover space**. If three items are `grow: 1` they split extra space equally; a `grow: 2` item gets twice the share.
- **`flex-shrink`** — a weight for absorbing **overflow** when items don't fit. `shrink: 0` means "never shrink me below my basis."
- **`flex-basis`** — the **hypothetical starting size** before grow/shrink runs (like `width` but along the main axis). `auto` uses the item's content/`width`.

So **`flex: 1`** expands to `1 1 0%` — grow and shrink freely from a zero basis, giving equal-width columns. **`flex: auto`** is `1 1 auto` (grow from content size), and **`flex: none`** is `0 0 auto` (rigid).

Practical notes: **`flex-direction: row-reverse`/`column`** swaps the main axis (and thus what `justify`/`align` mean); **`flex-wrap: wrap`** lets items break onto multiple lines, at which point **`align-content`** controls spacing *between* the lines; **`gap`** now works in flex containers, replacing old negative-margin hacks; and setting **`min-width: 0`** on a flex child is the fix for the notorious bug where long text or a wide child refuses to shrink (flex items default to `min-width: auto`, which won't go below content size).

**Key points:**
- `flex-direction: row-reverse/column` swaps the main axis
- `flex-wrap: wrap` lets rows break; combine with `align-content` for multi-line cross alignment
- `gap` works in flex (modern browsers) and avoids negative-margin hacks
- `min-width: 0` on flex children prevents text-overflow from blowing out the layout

---

### 4. Positioning: static/relative/absolute/fixed/sticky

**Frequency:** High

**Question:** Compare the five CSS `position` values and their common gotchas.

**Answer:** The `position` property controls how an element is placed and what `top`/`right`/`bottom`/`left` (the "inset" offsets) do:

- **`static`** — the default. The element sits in normal flow and **ignores the inset properties** entirely.
- **`relative`** — stays in flow (**its original space is preserved**) but you can **visually shift** it with insets. Crucially, it establishes a **positioning context**: absolutely-positioned descendants now anchor to it.
- **`absolute`** — **removed from normal flow** (siblings close up as if it's gone) and positioned against the **nearest positioned ancestor** (the nearest ancestor with a non-`static` position), falling back to the initial containing block. Without an explicit width it **collapses to its content width**.
- **`fixed`** — removed from flow and positioned relative to the **viewport**, so it stays put during scroll (sticky headers, chat widgets).
- **`sticky`** — a hybrid that behaves as `relative` **until** a scroll threshold (defined by an inset like `top: 0`) is crossed, then "sticks" like `fixed` within its scroll container.

The gotchas that trip people up: a **`transform`, `filter`, or `will-change` on an ancestor** creates a new containing block, which **traps `fixed` elements** inside it (they scroll away instead of staying fixed) — a very common "why won't my modal stay fixed?" bug. **`sticky` silently does nothing** unless it has a **scrollable ancestor** and a **defined offset**; a parent with `overflow: hidden` also breaks it. And any positioned element with a **`z-index`** creates a **stacking context**, which can unexpectedly isolate its children's z-ordering from the rest of the page.

**Key points:**
- A `transform`, `filter`, or `will-change` ancestor traps `fixed` elements
- `sticky` requires a scrollable ancestor and a defined `top`/`bottom`
- Absolute elements collapse to content width unless sized
- Positioned elements with `z-index` create stacking contexts

---

### 5. Specificity rules & `!important`

**Frequency:** High

**Question:** How is CSS specificity calculated, and how do `!important` and `@layer` fit in?

**Answer:** Specificity decides which competing rule wins, and it's computed as a **four-part tuple `(a, b, c, d)`**:
- **a** — inline `style=""` attributes
- **b** — **ID** selectors (`#header`)
- **c** — **classes, attributes, and pseudo-classes** (`.btn`, `[type=text]`, `:hover`)
- **d** — **elements and pseudo-elements** (`div`, `::before`)

Compare left-to-right: a rule with one ID `(0,1,0,0)` beats any number of classes `(0,0,5,0)`. When two rules have **identical specificity, the one declared later wins** (source order). Note the tuple **doesn't carry** — 11 classes are still `(0,0,11,0)`, not an ID.

**`!important`** escapes this ordering by jumping into a separate, higher-priority band. The full origin cascade, low to high, is: user-agent → user → **author normal** → author `!important` → user `!important` → user-agent `!important`. So an author `!important` overrides all normal author styles regardless of specificity — which is why `!important` wars escalate.

**`@layer` (cascade layers)** is the modern fix: you declare named layers in a defined order (`@layer reset, base, components, utilities;`) and **later layers beat earlier ones regardless of specificity**. This lets you organize styles by role instead of fighting selector-specificity arms races, and it largely obsoletes `!important`. Also useful: the **universal selector `*` and `:where()`** contribute **zero** specificity (great for low-priority defaults), while **`:is()` and `:not()`** take the **highest specificity of their arguments**. Reserve `!important` for utility frameworks or overriding stubborn third-party styles.

**Key points:**
- The universal selector `*` and `:where()` contribute zero specificity
- `:is()` and `:not()` take the highest specificity of their arguments
- Prefer cascade layers over specificity arms-races
- Avoid `!important` outside utility frameworks or third-party overrides

---

### 6. Responsive: media queries, `clamp()`, container queries

**Frequency:** High

**Question:** What tools drive responsive design — media queries, `clamp()`, and container queries?

**Answer:** Responsive design has three complementary layers of tooling:

**Media queries** adapt styles to the **viewport or device features**. Beyond the classic `@media (min-width: 768px)`, they read user/environment preferences like `(prefers-color-scheme: dark)` for theming and `(prefers-reduced-motion: reduce)` for accessibility. The convention is **mobile-first**: write base styles for small screens, then layer enhancements with **`min-width`** queries (desktop-first uses `max-width` and tends to accumulate overrides). Example:
```css
.card { padding: 1rem; }
@media (min-width: 768px) { .card { padding: 2rem; } }
```

**`clamp(min, preferred, max)`** produces **fluid values without breakpoints** — it returns the `preferred` value but never below `min` or above `max`. Pairing it with viewport units gives smoothly scaling typography and spacing: `font-size: clamp(1rem, 2vw + 0.5rem, 1.5rem)` grows with the viewport but stays readable at both extremes, replacing a stack of media-query font overrides.

**Container queries (`@container`)** are the biggest recent advance: instead of responding to the *viewport*, a component responds to **its own container's size**, so the same card looks right in a wide main column or a narrow sidebar. You opt a parent in with **`container-type: inline-size`**, then query it:
```css
.sidebar { container-type: inline-size; }
@container (min-width: 400px) { .card { display: grid; } }
```
This enables **true component-level responsiveness** — reusable components that adapt to context rather than to the page. Always pair motion with `prefers-reduced-motion` to avoid triggering vestibular issues.

**Key points:**
- Mobile-first uses `min-width` queries; desktop-first uses `max-width`
- Define a container with `container-type: inline-size`
- `clamp()` pairs well with viewport units: `clamp(1rem, 2vw, 1.5rem)`
- Respect `prefers-reduced-motion` for accessibility

---

### 7. Semantic HTML for SEO/a11y

**Frequency:** High

**Question:** Why does semantic HTML matter for SEO and accessibility?

**Answer:** Semantic HTML means using elements that **describe their meaning** — `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<footer>`, `<figure>`, `<time>` — rather than a soup of `<div>`s. That meaning is consumed by three audiences at once: browsers, assistive technology, and search crawlers.

For **accessibility**, these elements expose **landmarks** that screen-reader users navigate by — a user can jump directly to `main`, cycle through `nav` regions, or list all headings to understand page structure. A page built from `<div class="header">` gives them nothing to navigate. The **heading hierarchy** matters just as much: use **one `<h1>`** for the page's primary topic and **don't skip levels** (`h2` → `h4`), because screen readers build an outline from headings and skipped levels imply missing structure.

For **SEO**, semantic markup gives crawlers a **richer document outline**, helping them identify the main content versus navigation/boilerplate and weight it appropriately. You then layer **microdata or JSON-LD structured data** on top to earn rich results (ratings, breadcrumbs, events).

The practical rules that flow from this: use **`<button>` for actions and `<a href>` for navigation** (never a clickable `<div>`) — real controls come with keyboard focus, Enter/Space activation, and correct ARIA roles for free. **Avoid `<div role="button">`**; you'd have to reimplement focusability and keyboard handling that a native `<button>` gives you. And **label every form input** with `<label for>` (or a wrapping label) so its purpose is announced. Semantics is the foundation; ARIA only patches gaps where no native element fits.

**Key points:**
- Buttons for actions, links for navigation
- `<label for>` or wrapped labels for every form input
- Avoid `<div role="button">` — use real `<button>`
- Microdata/JSON-LD adds structured data on top of semantics

---

### 8. `var` vs `let` vs `const`; hoisting & TDZ

**Frequency:** High

**Question:** Compare `var`, `let`, and `const`, and explain hoisting and the Temporal Dead Zone.

**Answer:** The three differ along **scope, hoisting behavior, and reassignability**.

**`var`** is **function-scoped** (it ignores block boundaries like `if`/`for`), is **hoisted** to the top of its function, and is **initialized to `undefined`** — so reading it before its assignment line gives `undefined` rather than an error. It also **creates a property on the global object** (`window`) at top level, which pollutes global scope.

**`let`** and **`const`** are **block-scoped** and, although they're *also* hoisted, they are **not initialized**. From the top of the block until the declaration line they sit in the **Temporal Dead Zone (TDZ)** — touching them there throws a `ReferenceError`. This is deliberate: it catches use-before-declaration bugs that `var` silently hid. Neither creates a global-object property.
```js
console.log(a); // undefined  (var hoisted + initialized)
console.log(b); // ReferenceError (let in TDZ)
var a = 1; let b = 2;
```

**`const`** additionally forbids **rebinding** the variable — but *not* mutation of what it points to. `const arr = []; arr.push(1)` is fine; `arr = []` throws. For genuine shallow immutability use **`Object.freeze`** (note it's shallow — nested objects stay mutable).

One more distinction: **function declarations are fully hoisted** (callable before their line), whereas **function expressions** assigned to a `var`/`let` are not. The modern rule of thumb is **`const` by default, `let` only when you must reassign, and `var` never** in new code.

**Key points:**
- `var` creates properties on the global object; `let`/`const` do not
- Function declarations are fully hoisted; function expressions are not
- TDZ exists from block start to declaration line
- `const` arrays/objects can still be mutated — use `Object.freeze` for shallow immutability

---

### 9. Closures + classic loop bug

**Frequency:** High

**Question:** What is a closure, and why does the classic `var` loop print `3 3 3`?

**Answer:** A **closure** is a function bundled together with the **lexical environment** it was created in — it "remembers" and keeps access to the variables of its enclosing scope even after that outer function has returned. This is how inner functions read and mutate outer variables.

The classic bug:
```js
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i)); // 3 3 3
```
prints `3 3 3` because **`var` is function-scoped**, so all three arrow callbacks **close over the same single `i`**. By the time the timers fire (after the loop finishes), that shared `i` has reached `3`. The callbacks don't capture the *value* at each iteration — they capture the *variable*.

The fixes both give each iteration its **own binding**:
```js
for (let i = 0; i < 3; i++) setTimeout(() => console.log(i)); // 0 1 2
```
**`let` creates a fresh `i` per iteration**, so each closure captures a distinct value. The pre-ES6 equivalent was an **IIFE** that copied `i` into a parameter: `(j => setTimeout(() => console.log(j)))(i)`.

Closures power a lot of real patterns — the **module pattern** (private state via captured variables), **partial application/currying**, and **React hooks** (`useState`'s setter closes over the current render's state). The flip side is two hazards: **stale closures** in `useEffect`, where a missing dependency captures an old value and the effect sees outdated state, and **memory leaks**, where a long-lived closure keeps a large outer scope (DOM nodes, buffers) alive because it can't be garbage-collected. ES modules give explicit scoping that has largely replaced the closure-as-namespace idiom.

**Key points:**
- Closures power module patterns, partial application, and React hooks
- Stale closures in `useEffect` are caused by missing deps
- Memory leaks: closures retain references to outer scope
- ES modules give explicit scoping that reduces closure-as-namespace patterns

---

### 10. `this` binding rules

**Frequency:** High

**Question:** What are the rules that determine `this` in JavaScript, and why do arrow functions differ?

**Answer:** `this` is determined at **call time** (not where the function is defined), by four rules in **precedence order**:
1. **`new` binding** — calling `new Fn()` creates a fresh object and binds `this` to it.
2. **Explicit binding** — `fn.call(obj)`, `fn.apply(obj)`, or a `fn.bind(obj)` copy force `this = obj`.
3. **Implicit/method binding** — `obj.fn()` binds `this` to `obj` (the object *left of the dot*). Losing the dot loses the binding: `const f = obj.fn; f()` no longer sees `obj`.
4. **Default binding** — a plain `fn()` call falls back to the **global object** (`window`), or **`undefined` in strict mode / ES modules**, which is why strict mode helps catch accidental global writes.

**Arrow functions have no `this` of their own.** They **lexically inherit** `this` from the enclosing scope at definition time, and none of the four rules above can change it (even `.call` won't). That's exactly what makes them ideal for **callbacks** — an arrow passed to `setTimeout` or `.map` keeps the surrounding method's `this` instead of getting reset to `undefined`.

Common pitfalls: **class methods are not auto-bound**, so passing `this.handleClick` to an event handler loses `this` — fix with an arrow class field (`handleClick = () => {}`) or `.bind` in the constructor. Array iterators like `forEach`/`map` accept a **`thisArg`** second argument. And **`bind` is permanent** — re-binding an already-bound function has no effect (only the first `bind` wins).

**Key points:**
- Class methods are not auto-bound; use arrow fields or `.bind`
- `forEach`/`map` accept a `thisArg` second argument
- Strict mode prevents accidental global pollution
- `bind` returns a new function; calling `bind` repeatedly only honors the first

---

### 11. Prototypes & prototype chain

**Frequency:** High

**Question:** How do JavaScript prototypes and the prototype chain work, and how does `class` relate to them?

**Answer:** Every JavaScript object has an internal **`[[Prototype]]`** link (readable via `Object.getPrototypeOf(obj)`, historically the `__proto__` accessor) pointing to another object. When you access a property, the engine **walks this chain** — checking the object, then its prototype, then *its* prototype — until it finds the property or reaches **`null`** at the top (`Object.prototype`'s prototype). This is how inheritance works: shared behavior lives on a prototype that many instances link to.

**`Object.create(proto)`** makes a new object with `proto` as its `[[Prototype]]` directly. And **`class` syntax is sugar** over this prototype machinery, not a separate system: methods you define in a class body actually live on `Class.prototype`, `extends` **wires one prototype to another** to build the chain, and `super` calls up to the parent constructor/method. So `class Dog extends Animal` just sets `Dog.prototype`'s prototype to `Animal.prototype`.

Key consequences:
- **`instanceof`** works by walking the chain, checking whether a constructor's **`.prototype`** appears anywhere in it.
- **`hasOwnProperty` (or the newer `Object.hasOwn`)** distinguishes an object's *own* properties from inherited ones — essential when iterating.
- **Prototype methods are shared** across all instances (one copy in memory), whereas **instance fields are per-object**. Defining methods on the prototype (as classes do) is more memory-efficient than closures-per-instance.
- **Mutating built-in prototypes** like `Array.prototype` is a notorious anti-pattern — it leaks into every array on the page and can collide with future language features or other libraries.

**Key points:**
- `instanceof` walks the prototype chain checking `.prototype`
- `hasOwnProperty` (or `Object.hasOwn`) skips inherited props
- Modifying `Array.prototype` is a notorious anti-pattern
- Prototype methods are shared; instance fields are per-object

---

### 12. Event loop: macrotasks vs microtasks

**Frequency:** High

**Question:** How does the JavaScript event loop work, and what's the difference between macrotasks and microtasks?

**Answer:** JavaScript runs on a **single thread** with an **event loop** that coordinates two queues. Each iteration ("tick") does: **run one macrotask → drain the entire microtask queue → optionally render → repeat**.

- **Macrotasks** are the coarse units of work: the initial script, `setTimeout`/`setInterval` callbacks, I/O, and UI events. The loop takes **exactly one** per tick.
- **Microtasks** are higher-priority follow-ups: **Promise `.then`/`.catch`/`.finally` callbacks**, `queueMicrotask`, and `MutationObserver`. After each macrotask, the loop **drains the microtask queue completely** — including any microtasks those microtasks schedule — *before* moving on or rendering.

This ordering explains the classic puzzle:
```js
setTimeout(() => console.log('timeout'), 0);
Promise.resolve().then(() => console.log('promise'));
// prints: promise, then timeout
```
The promise callback is a **microtask** and runs before the next macrotask (`setTimeout`), even with a `0`ms delay.

The practical hazards: because microtasks drain fully before rendering, a microtask that **keeps re-enqueueing itself can starve rendering** and freeze the UI. Likewise, **long synchronous work** in any single task blocks the entire thread — no rendering, no input. Mitigations: **`requestAnimationFrame`** runs right *before* paint (ideal for visual updates), **`scheduler.postTask` or `requestIdleCallback`** schedule low-priority work without blocking, and **Web Workers** move CPU-bound computation off the main thread entirely so the UI stays responsive.

**Key points:**
- `Promise.resolve().then()` runs before `setTimeout(..., 0)`
- `requestAnimationFrame` runs before paint, after microtasks
- Use `scheduler.postTask` or `requestIdleCallback` for low-priority work
- Web Workers offload CPU-bound work off the main thread

---

### 13. Promises vs async/await; error handling

**Frequency:** High

**Question:** How do Promises and `async/await` relate, and how should you handle errors?

**Answer:** **`async/await` is syntactic sugar over Promises** that lets asynchronous code **read top-to-bottom like synchronous code**. Under the hood there's still a Promise for everything: an **`async` function always returns a Promise**, `await` just pauses that function until a Promise settles and unwraps it.

Error handling maps cleanly onto `try/catch` because of two rules:
- A **`throw` inside an async function becomes a rejected Promise** — the caller sees a rejection, not a synchronous exception.
- **`await` unwraps a fulfilled value or re-throws on rejection** — so `await somePromise` that rejects throws *at the await point*, where a surrounding `try/catch` can catch it.
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
Always either wrap awaits in **`try/catch`** or attach **`.catch`** to the returned Promise. An **unhandled rejection crashes Node ≥15 by default** and surfaces as an error in browser DevTools — both are signs of a missing handler.

Two nuances interviewers probe: **`await` pauses the function, not the thread** — the event loop keeps running other work while you wait, so awaiting doesn't block the page. And **sequential awaits are a common performance mistake**: `await a(); await b();` runs them one after another. If they're independent, **parallelize with `Promise.all`**: `const [x, y] = await Promise.all([a(), b()])` runs both concurrently and waits for both.

**Key points:**
- `async` functions always return a Promise
- `await` pauses the function, not the thread
- Parallelize independent awaits with `Promise.all`
- `try/catch` around `await` catches both sync throws and rejections

---

### 14. `Promise.all` vs `allSettled` vs `race` vs `any`

**Frequency:** High

**Question:** Compare `Promise.all`, `allSettled`, `race`, and `any`.

**Answer:** All four take an iterable of promises but differ in **when they settle** and **how they treat failures**:

- **`Promise.all`** — resolves with an **array of all results** once **every** promise fulfills, but is **fail-fast**: the moment *any* promise rejects, `all` rejects immediately with that reason (the others keep running but their results are discarded). Use when you need *all* results and any failure should abort — e.g. loading data that a page can't render without.
- **`Promise.allSettled`** — **waits for every** promise regardless of outcome and resolves with an array of **`{status: 'fulfilled', value}`** or **`{status: 'rejected', reason}`** objects. It **never rejects**. Ideal for **partial-failure-tolerant** batch work — firing 10 independent API calls and showing whatever succeeded.
- **`Promise.race`** — settles with the **first promise to settle**, whether it fulfills *or* rejects. The classic use is a **timeout**: `Promise.race([fetch(url), timeout(5000)])` rejects if the fetch is too slow.
- **`Promise.any`** — resolves with the **first fulfillment**, ignoring rejections; it only rejects (with an **`AggregateError`**) if **all** promises reject. Great for **fetching from multiple mirrors** and taking the fastest success.

```js
await Promise.allSettled([a(), b(), c()]); // [{status,...}, ...]
```

A crucial caveat for all of them: **none cancel the still-pending promises.** `race` resolving doesn't stop the loser's network request. To actually abort in-flight work, wire up an **`AbortController`** and pass its signal to `fetch`.

**Key points:**
- Combine `Promise.race` with a timeout promise for cancellation
- `allSettled` is ideal for parallel API calls where partial failure is OK
- `any` is great for fetching from multiple mirrors
- None of these cancel pending promises — use `AbortController` for that

---

### 15. Debounce vs throttle (write both)

**Frequency:** High

**Question:** What's the difference between debounce and throttle, and how do you implement each?

**Answer:** Both **rate-limit** how often a function runs, but they answer different questions:

- **Debounce** — "wait until the activity *stops*." It delays execution until **N ms have passed since the last call**, collapsing a burst into a single trailing call. Perfect for **search-as-you-type** (fire the query only after the user pauses), input validation, and resize-settled recalculations.
- **Throttle** — "run at a steady *rate*." It executes **at most once per N ms** no matter how many calls arrive, giving regular updates during continuous activity. Perfect for **scroll/resize/mousemove** handlers where you want periodic updates, not one-at-the-end.

They're **not interchangeable**: debounce during continuous scrolling would *never* fire (the events never stop long enough), while throttle on a search box would fire mid-typing. Minimal implementations:
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

Refinements worth mentioning: **leading vs trailing edge** changes the feel — a leading-edge debounce fires immediately then ignores the burst; trailing fires at the end. Pair a debounced fetch with an **`AbortController`** to cancel the previous in-flight request. **`requestAnimationFrame`** is a natural throttle for paint-bound work (caps at the display's refresh rate). In production, prefer **lodash's `debounce`/`throttle`** — they handle leading/trailing options, `maxWait`, and cancellation edge cases correctly.

**Key points:**
- Leading vs trailing edge changes UX feel
- `AbortController` can cancel pending debounced fetches
- `requestAnimationFrame` is a natural throttle for paint-bound work
- Use lodash/underscore implementations in production for edge cases

---

### 16. Equality: `==` vs `===` vs `Object.is`; NaN

**Frequency:** High

**Question:** How do `==`, `===`, and `Object.is` differ, and what's special about `NaN`?

**Answer:** These are three equality checks with progressively stricter/more-precise semantics:

- **`===` (strict equality)** — no coercion; values must have the **same type and value**. This is what you want almost always.
- **`==` (loose equality)** — applies **type coercion** with famously surprising rules: `[] == false` is `true`, `'' == 0` is `true`, `'0' == false` is `true`. The coercion algorithm is non-obvious, so `==` is a bug magnet.
- **`Object.is`** — like `===` **except** two edge cases: it treats **`NaN` as equal to itself** (`Object.is(NaN, NaN) === true`) and **distinguishes `+0` from `-0`** (`Object.is(+0, -0) === false`, whereas `+0 === -0` is `true`).

**`NaN`** is uniquely **not equal to itself** — `NaN === NaN` is `false` — which is why you can't test for it with equality. Use **`Number.isNaN(x)`**, and prefer it over the **global `isNaN`**, which first coerces its argument (`isNaN('foo')` is `true`, misleadingly) whereas `Number.isNaN` only returns `true` for the actual `NaN` value.

Practical guidance: **always use `===`** unless you have a specific reason to coerce. The one commonly-accepted `==` use is **`x == null`**, which is `true` for both `null` and `undefined` (a concise nullish check). Worth knowing for framework work: **React's `useState` and `useMemo` bail-out comparisons use `Object.is`**, which is why mutating state in place (same reference) skips re-renders.

**Key points:**
- Always use `===` unless intentionally coercing
- `null == undefined` is true; both `=== null` is false
- React's `useState` and `Object.is` use the same equality check
- `Number.isNaN` is safer than the global `isNaN` (which coerces)

---

### 17. TS: `interface` vs `type`

**Frequency:** High

**Question:** In TypeScript, when should you use `interface` versus `type`?

**Answer:** Both can **describe the shape of an object**, and for that common case they're nearly interchangeable. The differences are about **capability and extensibility**:

**`interface`** supports **declaration merging** \u2014 declaring the same interface twice merges the members. That's why it's idiomatic for **public API surfaces and library type augmentation**: consumers can reopen your interface to add fields (e.g. augmenting `Window` or an Express `Request`). Interfaces extend each other with `extends`, which is also **slightly faster for the type-checker** to resolve in large hierarchies because the relationship is cached.

**`type`** aliases are **strictly more expressive**. Only a `type` can name a **union** (`type Status = 'on' | 'off'`), an **intersection**, a **primitive or tuple** alias, a **mapped type**, or a **conditional / self-referential type**. But a `type` **cannot be merged** \u2014 declaring it twice is a duplicate-identifier error.

```ts
interface User { id: string }        // mergeable, extendable
type Result = Success | Failure;     // union — interface can't do this
type Pair = [number, number];        // tuple — interface can't do this
```

Both support **generics** and both can model most object contracts, so **performance is comparable** and the real decision is *capability needed*, not dogma. A pragmatic convention: **`interface` for object shapes you expect others to extend or that form a public API, `type` for unions, tuples, function signatures, and anything computed.** Many teams simply default to `type` and reach for `interface` only when they need merging.

**Key points:**
- `interface` extension can be faster to type-check in large unions
- `type` aliases can be self-referential via conditional types
- Both support generics
- Declaration merging is essential for augmenting libraries

---

### 18. React VDOM & reconciliation

**Frequency:** High

**Question:** How do React's virtual DOM and reconciliation work, and what did Fiber change?

**Answer:** React describes your UI as a tree of lightweight **element objects** (the virtual DOM). When state changes, React **re-renders** the component to produce a *new* element tree, then **reconciles** it against the previous tree — computing the minimal set of real-DOM mutations and committing only those. This is why you write declarative "what the UI should look like" code instead of manual DOM surgery.

A naive tree diff is O(n³). React gets it to **O(n)** with three heuristics:
1. **Different element types → replace the whole subtree.** `<div>` becoming `<span>` (or `ComponentA` becoming `ComponentB`) tears down the old subtree and its state and builds fresh — React doesn't try to match across types.
2. **Same type → keep the node, update changed props.** It reuses the DOM element and just patches attributes/children.
3. **Keyed lists → match children by `key`.** Keys let React identify which items moved, were inserted, or removed across renders, instead of diffing positionally.

The classic bug is **using array index as a key** for a reorderable/filterable list: because the key is tied to position rather than identity, React mismatches items and **state "sticks" to the wrong row** (e.g. an input's value jumps to a different item). Use a stable unique id.

**Fiber** (React 16+) rewrote reconciliation to be **interruptible**. Instead of one recursive, unstoppable pass, work is split into units React can pause, resume, and prioritize — enabling **concurrent rendering** (React 18): urgent updates like typing preempt low-priority renders. A consequence is that **in-progress render work can be thrown away** and restarted, which is why render functions must stay pure (no side effects). **React 19's compiler** adds automatic, compile-time memoization, reducing the need for manual `useMemo`/`useCallback`/`React.memo`.

**Key points:**
- Reconciliation is O(n) thanks to heuristics, not full tree-diff
- Wrong keys cause subtle state bugs in lists
- Concurrent rendering can throw away in-progress work
- React 19 adds compiler-driven memoization

---

### 19. `useState` vs `useReducer`

**Frequency:** High

**Question:** When should you use `useState` versus `useReducer`?

**Answer:** Both manage component state; the choice is about **how complex the state transitions are**.

Reach for **`useState`** when you have **independent primitives or a small piece of object state** — a toggle, an input value, a counter. Each concern gets its own `useState` and updates directly.

Reach for **`useReducer`** when:
- **The next state depends on the previous state** in non-trivial ways (multi-step logic).
- **Several sub-values change together** — e.g. an async flow that must set `loading`, `data`, and `error` consistently. A reducer keeps those transitions atomic and prevents impossible combinations.
- **Transitions follow a state-machine pattern** (`idle → loading → success | error`).

The reducer is a **pure function `(state, action) => newState`**, which makes it **trivial to unit-test** in isolation (no React needed) and keeps all transition logic in one readable place instead of scattered across handlers. Crucially, **`dispatch` has a stable identity** across renders, so it's safe to omit from (or include harmlessly in) `useEffect`/`useCallback` dependency arrays — unlike inline setters that can churn.

Useful techniques for both: **lazy initialization** `useState(() => expensive())` (or `useReducer(reducer, initialArg, init)`) runs the expensive setup only on mount; **functional updates** `setX(prev => prev + 1)` read the latest value and avoid **stale-closure** bugs. For app-wide state, **pair a reducer with Context**; when logic outgrows a reducer (guards, side effects, nested states), escalate to a dedicated tool like **XState** (formal state machines) or **Zustand/Redux Toolkit** (external stores).

**Key points:**
- Lazy initialization: `useState(() => expensive())`
- Functional updates: `setX(prev => prev + 1)` avoid stale closures
- Reducers pair well with Context for app-wide state
- XState or Zustand for more complex needs

---

### 20. `useEffect` deps & stale closures

**Frequency:** High

**Question:** Why does `useEffect` suffer from stale closures, and how do you fix them?

**Answer:** An effect's callback is a **closure created during a specific render**, so it captures the values of props and state **from that render**. If a value it uses isn't in the **dependency array**, the effect doesn't re-run when that value changes — it keeps running the *old* closure and reads the **outdated value**. The interval-counter bug is canonical:
```js
useEffect(() => {
  const id = setInterval(() => setCount(count + 1), 1000); // count frozen at 0
  return () => clearInterval(id);
}, []); // missing `count`
```
The interval always sees `count === 0`, so it sets `1` forever.

The **`react-hooks/exhaustive-deps`** lint rule flags exactly this. There are two correct fixes:
1. **Include every reactive value** the effect references in the deps array. The effect then re-subscribes with fresh values when they change (here, re-creating the interval each time `count` changes).
2. **Read the latest value without re-subscribing** — use a **functional update** (`setCount(c => c + 1)`, which needs no dependency) or a **ref** (`countRef.current`) when you want a *stable* subscription that still sees current data. Refs are the standard escape hatch for "I need the newest value but don't want to tear down and recreate the effect."

Supporting facts: an **empty deps array `[]`** means "run once on mount, clean up on unmount"; **cleanup runs before the next effect execution and on unmount** (used to unsubscribe/clear timers). **React 18 Strict Mode intentionally mounts → unmounts → remounts in dev**, running effects twice to surface missing cleanup. **React 19's compiler** reduces manual dependency juggling by memoizing automatically.

**Key points:**
- Empty deps `[]` = run once on mount (and cleanup on unmount)
- Cleanup runs before next effect and on unmount
- React 18 Strict Mode runs effects twice in dev to surface bugs
- React 19's compiler reduces manual dep management

---

### 21. `useMemo` vs `useCallback`

**Frequency:** High

**Question:** What's the difference between `useMemo` and `useCallback`, and when are they worth it?

**Answer:** They memoize different things across renders:
- **`useMemo(fn, deps)`** runs `fn` and **caches its return value**, recomputing only when a dependency changes. It memoizes a **computed value**.
- **`useCallback(fn, deps)`** caches the **function itself** (a stable reference). It's literally **sugar for `useMemo(() => fn, deps)`** — it memoizes a *function* rather than a value.

There are exactly **two legitimate reasons** to use either:
1. **Skip expensive recomputation** — memoizing a genuinely costly calculation (sorting/filtering a large list, heavy transforms) so it doesn't rerun every render.
2. **Preserve referential identity** — a new object/array/function is created on every render, which **breaks `React.memo` children** (they see a "changed" prop and re-render) and **retriggers `useEffect`** deps. Wrapping the value/callback keeps the same reference across renders so those bail-outs actually work. This is the *more common* real reason — `useCallback` almost always exists to feed a stable prop to a memoized child or an effect.

The pitfalls interviewers want: **memoization isn't free** — it costs memory plus a deps comparison every render, so wrapping trivial values (a cheap string concat, a number) is **net-negative**. **Wrong deps reintroduce stale closures**, just like `useEffect`. And `useCallback` is **pointless without a memoized consumer** — if the child isn't `React.memo`'d and the fn isn't an effect dep, you're paying overhead for nothing. Rule of thumb: **profile first** (React DevTools Profiler), add memoization to fix a *measured* problem, not preemptively. Note **React 19's compiler auto-memoizes**, making most manual `useMemo`/`useCallback` obsolete.

**Key points:**
- Memoization has overhead — don't memoize trivial values
- Stale closure risk if deps are wrong
- Pair with `React.memo` for child re-render skipping
- Profile before adding memoization

---

### 22. Keys in lists; index-key anti-pattern

**Frequency:** High

**Question:** What role do keys play in React lists, and why is using the array index an anti-pattern?

**Answer:** A **key** is React's identity tag for a list item — it lets reconciliation **match elements across renders**. When a list re-renders, React uses keys to decide which items were *added*, *removed*, or *moved*, so it can reuse existing DOM nodes and their component state instead of rebuilding.

Using the **array index** as the key is fine **only for static, append-only lists** that never reorder, insert-in-the-middle, or delete. The moment the list mutates, index keys break: because the key describes a *position* rather than the *item*, React thinks the item at index 2 is "the same" before and after a reorder — so **local state, focus, and DOM state follow the index, not the data**. The classic symptom: you delete the first row, and the *text typed into that row's input* appears to jump to the row that shifted up, because React reused the input DOM node by position.
```jsx
{items.map((item, i) => <Row key={item.id} />)} // ✅ stable identity
{items.map((item, i) => <Row key={i} />)}       // ❌ breaks on reorder/insert/delete
```
The fix is a **stable, unique id** derived from the data itself.

Supporting details: keys need only be **unique among siblings**, not globally. **Never generate keys randomly in render** (`key={Math.random()}`) — a new key every render forces React to destroy and recreate the node each time, killing performance and resetting state. React **warns in dev** when keys are missing. And because keys govern node identity, they also affect **CSS transitions/animations** (a changed key remounts, replaying enter animations) and **form/input state**.

**Key points:**
- Keys must be unique among siblings only
- Don't generate keys randomly inside render
- React warns in dev when keys are missing
- Keys also affect CSS animations and form state

---

### 23. Controlled vs uncontrolled inputs

**Frequency:** High

**Question:** What's the difference between controlled and uncontrolled inputs in React, and when do you use each?

**Answer:** The distinction is **where the input's value lives** — in React state or in the DOM.

A **controlled input** derives its `value` from React state and updates it via `onChange`:
```jsx
<input value={name} onChange={e => setName(e.target.value)} />
```
State is the **single source of truth**: React drives what's displayed. This makes **live validation, formatting, conditional disabling, and cross-field logic** easy (you can transform/reject each keystroke). The cost is a **re-render on every keystroke**, which for huge forms can matter.

An **uncontrolled input** keeps its own value in the **DOM**, and you read it imperatively via a **ref**, initializing with `defaultValue`/`defaultChecked`:
```jsx
<input defaultValue="jane" ref={inputRef} />
// read on submit: inputRef.current.value
```
It's **simpler and faster** (no re-render per keystroke) — ideal for plain forms where you only need values at submit time.

When to use which: **controlled** when you must *react* to input as the user types (validation, masks, dependent fields); **uncontrolled** for simple/large forms where per-keystroke reactivity isn't needed. This is exactly why **`react-hook-form` uses uncontrolled inputs** under the hood — it registers refs and avoids re-rendering the whole form on every keystroke, which is its main performance advantage.

Gotchas: **file inputs are always effectively uncontrolled** (you can't set their value programmatically for security). And **never switch a single input between controlled and uncontrolled** across renders (e.g. `value={x}` where `x` starts `undefined` then becomes a string) — React warns, and the input behaves erratically. Keep `value` always-defined (`value={x ?? ''}`) to stay controlled.

**Key points:**
- React-hook-form leverages uncontrolled inputs for performance
- File inputs are always effectively uncontrolled
- `defaultValue`/`defaultChecked` initialize uncontrolled
- Don't switch a single input between controlled/uncontrolled

---

### 24. SSR vs SSG vs CSR vs ISR

**Frequency:** High

**Question:** Compare CSR, SSR, SSG, and ISR rendering strategies.

**Answer:** These describe **where and when HTML is generated**, trading off first-paint speed, server cost, and freshness:

- **CSR (Client-Side Rendering)** — the server ships a near-empty **HTML shell + JS bundle**; the browser downloads, executes, fetches data, and renders. **Slow first paint** (blank until JS runs) and **weaker SEO**, but **fast subsequent navigation** (no full page loads) and cheap static hosting. Good for auth-gated dashboards/SPAs.
- **SSR (Server-Side Rendering)** — the server renders **full HTML per request**. **Fast, SEO-friendly first paint** and supports **personalized/per-request content**, at the cost of **server compute on every request** and TTFB tied to your backend. Good for personalized, frequently-changing pages.
- **SSG (Static Site Generation)** — pages are **pre-rendered at build/deploy time** to static HTML served from a CDN. **Fastest possible serve** and trivially scalable, but content is **frozen until the next rebuild** and only works for content **known at build time**. Good for blogs, docs, marketing.
- **ISR (Incremental Static Regeneration, Next.js)** — serve the **cached static page**, then **regenerate it in the background on a revalidation interval** (or on-demand). Combines SSG's speed with near-SSR freshness — the best default for large mostly-static sites (e-commerce catalogs).

**React Server Components** add an orthogonal axis: **per-component** server rendering, letting you keep data-fetching/heavy deps on the server (zero client JS) while islands stay interactive. Related refinements: **streaming SSR** flushes HTML chunks as data resolves (faster perceived load via Suspense), **edge SSR** runs rendering close to users for low latency, and **ISR revalidation needs care** — naive expiry can trigger a **cache stampede** where many requests regenerate simultaneously.

**Key points:**
- Streaming SSR ships HTML chunks as data resolves
- Edge SSR runs near users for lower latency
- SSG works only for content known at build time
- ISR's revalidation strategy needs care to avoid cache stampedes

---

### 25. Critical rendering path

**Frequency:** High

**Question:** Walk through the browser's critical rendering path and how to optimize it.

**Answer:** The **critical rendering path (CRP)** is the sequence the browser follows to turn bytes into pixels:
1. **Parse HTML → DOM** — build the Document Object Model tree.
2. **Parse CSS → CSSOM** — build the CSS Object Model. **CSS is render-blocking**: the browser won't paint until the CSSOM is ready, because it can't style anything without it.
3. **DOM + CSSOM → Render Tree** — combine into a tree of *visible* nodes with computed styles.
4. **Layout (reflow)** — compute each node's **geometry** (position/size).
5. **Paint** — fill in **pixels** (text, colors, images, borders).
6. **Composite** — assemble painted **layers** in order (GPU) to the screen.

Two blocking behaviors dominate: **CSS blocks rendering** (above), and **synchronous `<script>` blocks the HTML parser** — the parser stops, downloads, and executes the script before continuing, delaying DOM construction.

Optimizations:
- **Minimize critical resources** — fewer/smaller render-blocking CSS and JS files.
- **Inline critical CSS** (above-the-fold styles) and lazy-load the rest so first paint isn't gated on the full stylesheet.
- **Defer non-critical JS** with **`async`/`defer`** so scripts don't block parsing.
- **`preload`** truly critical resources (hero image, key font); **`preconnect`** to third-party origins to warm up DNS/TLS early.

The key `async` vs `defer` distinction: **`defer`** downloads in parallel but **executes after parsing completes, in document order, just before `DOMContentLoaded`** — ideal for app scripts that need the DOM. **`async`** executes **as soon as it downloads, out of order**, potentially mid-parse — fine for independent scripts like analytics. Use the **DevTools Performance panel** to visualize and find bottlenecks in the path.

**Key points:**
- `defer` runs after parse, before `DOMContentLoaded`
- `async` runs whenever it arrives (out of order)
- Preload critical resources, preconnect to third-party origins
- DevTools Performance panel visualizes the path

---

### 26. Core Web Vitals (LCP, INP, CLS)

**Frequency:** High

**Question:** What are the three Core Web Vitals, their targets, and what hurts each?

**Answer:** Core Web Vitals are Google's field-measured UX metrics, each capturing a different dimension and used as a **search ranking signal**:

- **LCP — Largest Contentful Paint (loading), target < 2.5s.** Time until the **largest visible element** (usually the hero image or headline) renders. It's a proxy for "when does the page *feel* loaded." **Killers:** render-blocking CSS/JS, oversized/unoptimized images, slow server TTFB, client-side data waterfalls. **Fixes:** optimize/preload the LCP image, inline critical CSS, faster/edge server, `fetchpriority="high"`.
- **INP — Interaction to Next Paint (responsiveness), target < 200ms.** **Replaced FID in March 2024.** Unlike FID (only measured the *first* interaction's input delay), INP measures the **latency of *all* interactions** across the page's life — from click/tap/keypress to the next visual update — and reports a high percentile. **Killers:** long JS tasks blocking the main thread, heavy event handlers, synchronous layout (layout thrashing). **Fixes:** break up long tasks (`scheduler.yield`), memoize, move work to Web Workers, avoid forced reflows.
- **CLS — Cumulative Layout Shift (visual stability), target < 0.1.** Sums how much visible content **unexpectedly jumps** during load. **Killers:** images/videos without width/height (or `aspect-ratio`), late-injected ads/banners/embeds, web fonts causing reflow (FOUT), dynamically inserted content above existing content. **Fixes:** always set dimensions, reserve space for dynamic slots, use `font-display: optional/swap` carefully.

Measure both in the lab (Lighthouse) and, more importantly, in the **field** with the **`web-vitals`** library reporting real-user data — lab numbers often hide the tail that real devices/networks expose.

**Key points:**
- LCP killers: render-blocking CSS, large images, slow servers
- INP killers: long tasks, heavy event handlers, sync layout
- CLS killers: missing image dimensions, late-injected ads/banners
- `web-vitals` library reports field data

---

### 27. Code splitting & lazy loading

**Frequency:** High

**Question:** What are code splitting and lazy loading, and how do you apply them effectively?

**Answer:** **Code splitting** breaks one giant JS bundle into smaller **chunks** loaded on demand, so users download only the code the current view needs instead of the whole app upfront. **Lazy loading** is the act of deferring a chunk until it's actually required. Together they shrink the initial bundle, improving TTI/LCP.

The underlying primitive is the **dynamic `import()`** — an async, Promise-returning import that bundlers (webpack/Vite/Rollup) turn into a separate chunk fetched at runtime:
```js
const mod = await import('./Chart.js'); // fetched only when this line runs
```
Frameworks wrap it ergonomically: **`React.lazy(() => import('./X'))`** (rendered inside a **`<Suspense>`** boundary for the loading fallback), **Next.js `dynamic()`**, and **Angular's `loadComponent`/`loadChildren`**.

Where to split, in priority order:
1. **Per-route** is the **highest-impact starting point** — each page becomes its own chunk, so landing on `/home` doesn't download `/admin`.
2. **Per-feature/component** for heavy, rarely-used widgets (a rich text editor, a charting lib, a modal).

The main hazard is the **loading waterfall**: navigating to a route, *then* discovering it needs another chunk, fetching sequentially and stalling the user. Mitigate by **prefetching likely-next chunks during idle** — `<link rel="prefetch">` or framework hints (Next.js prefetches links in the viewport). But **don't over-split**: too many tiny chunks add HTTP request overhead and hurt compression, often netting slower loads. Use a **bundle analyzer** (`webpack-bundle-analyzer`, `rollup-plugin-visualizer`) to see what's actually big and split deliberately rather than guessing.

**Key points:**
- Per-route splitting is the highest-impact starting point
- Prefetch with `<link rel="prefetch">` or framework hints
- Don't over-split — too many small chunks hurt HTTP overhead
- Bundle analyzers (webpack-bundle-analyzer, rollup-plugin-visualizer) guide decisions

---

### 28. HTTP caching: Cache-Control, ETag, Last-Modified

**Frequency:** High

**Question:** How does HTTP caching work with `Cache-Control`, `ETag`, and `Last-Modified`?

**Answer:** HTTP caching has **two phases**: *freshness* (can I reuse without asking?) and *revalidation* (is my stale copy still good?).

**Freshness** is governed by **`Cache-Control`** directives:
- **`max-age=N`** — seconds the browser may reuse the response without contacting the server; **`s-maxage`** overrides it for *shared* caches (CDNs).
- **`public`** (any cache may store) vs **`private`** (browser only, e.g. per-user data).
- **`immutable`** — promises the content never changes, so the browser skips revalidation even on reload.
- **`no-store`** — never cache (sensitive data); **`no-cache`** — cache but *always revalidate* before use.
- **`stale-while-revalidate=N`** — serve the stale copy instantly while refreshing in the background.

**Revalidation** kicks in after expiry, using **conditional requests** so the server can skip resending the body:
- **`ETag`** (a content hash/version) → browser sends **`If-None-Match: <etag>`**; if unchanged the server replies **`304 Not Modified`** with no body.
- **`Last-Modified`** → browser sends **`If-Modified-Since`**; same `304` outcome. ETag is more precise (survives content that's rewritten with identical bytes or sub-second changes).

The standard strategy: **hash-named static assets** (`app.9f3a.js`) get **`Cache-Control: public, max-age=31536000, immutable`** — cache forever, because a content change produces a new filename. Meanwhile **HTML should be `no-cache`** (revalidate every time) so a new deploy — which points to new hashed asset URLs — **propagates immediately** rather than serving a stale shell. Remember **CDNs honor `s-maxage` independently** of the browser's `max-age`, and the **`Vary`** header tells caches which request headers (e.g. `Accept-Encoding`, `Accept-Language`) produce different responses, preventing a cache from serving the wrong variant.

**Key points:**
- `stale-while-revalidate` serves stale while refreshing in background
- HTML should be `no-cache` (revalidate every time) so deploys propagate
- CDNs respect `s-maxage` separately from browser `max-age`
- `Vary` header tells caches which request headers differentiate responses

---

### 29. CORS preflight & credentials

**Frequency:** High

**Question:** How do CORS preflight requests and credentialed cross-origin requests work?

**Answer:** **CORS (Cross-Origin Resource Sharing)** is a browser security mechanism that lets a server opt into being called from *other* origins, relaxing the same-origin policy. The browser (not the server) enforces it.

Requests split into two categories:
- **Simple requests** — `GET`/`POST`/`HEAD` with only "safe" headers and a body content-type of `application/x-www-form-urlencoded`, `multipart/form-data`, or `text/plain`. These go straight through; the browser just checks the response's `Access-Control-Allow-Origin` before exposing it.
- **Non-simple requests** — anything with a **custom header** (e.g. `Authorization`, `X-Requested-With`), a **method** other than GET/POST/HEAD (PUT/DELETE/PATCH), or a **JSON body** (`Content-Type: application/json`). These trigger a **preflight**: the browser first sends an **`OPTIONS`** request asking permission.

The server must answer the preflight (and the actual request) with the right headers:
- **`Access-Control-Allow-Origin`** — the allowed origin (or `*`).
- **`Access-Control-Allow-Methods`** and **`Access-Control-Allow-Headers`** — what the actual request may use.
- **`Access-Control-Max-Age`** — how long the browser may **cache the preflight** result, avoiding an OPTIONS on every call.

For **credentialed requests** (sending cookies or HTTP auth), the client sets **`credentials: 'include'`** on `fetch`, and the server must return **`Access-Control-Allow-Credentials: true`** *and* a **specific origin — not `*`**. The most common mistake is exactly that: returning `Access-Control-Allow-Origin: *` *with* credentials, which browsers **reject** for security. Also note **`SameSite` cookie rules still apply on top of CORS** — CORS allowing the request doesn't override a `SameSite=Strict/Lax` cookie being withheld cross-site.

**Key points:**
- Simple requests skip preflight (form-encoded POST, GET)
- `Access-Control-Max-Age` caches preflight result
- `SameSite` cookies still apply on top of CORS
- Mistake: returning `*` with credentials — browsers reject

---

### 30. XSS, CSRF, clickjacking mitigations

**Frequency:** High

**Question:** How do you mitigate XSS, CSRF, and clickjacking?

**Answer:** Three distinct browser attacks, each with layered defenses.

**XSS (Cross-Site Scripting)** — attacker injects script that runs in your users' page, stealing tokens/data or acting as them. Defenses:
- **Never write untrusted input to `innerHTML`** (or `dangerouslySetInnerHTML`, `v-html`) — the #1 sink. **Escape/encode on render** so data is treated as text, not markup. Modern frameworks (**React/Vue/Angular escape by default**), so injection usually means someone opted out.
- If you *must* render user HTML (rich text), **sanitize with DOMPurify** to strip scripts/handlers.
- Deploy a **Content Security Policy (CSP)** to disallow inline scripts and restrict script origins — a strong defense-in-depth even if injection slips through. The **Trusted Types API** goes further, enforcing that only vetted values reach dangerous DOM sinks.
- **Stored XSS** (payload persisted in your DB, served to every viewer) is **worse than reflected** (payload in a URL, one victim at a time) because it auto-propagates.

**CSRF (Cross-Site Request Forgery)** — a malicious site tricks the browser into sending a **state-changing request** to your site using the victim's **automatically-attached credentials** (cookies). It only works against browser-sent credentials, not `Authorization` headers you add manually. Defenses:
- **`SameSite=Lax` (or `Strict`) cookies** so cookies aren't sent on cross-site requests — the modern baseline.
- **CSRF tokens**: a per-session/per-request secret the server issues and validates on mutating requests; the **double-submit cookie** pattern compares a cookie value against a matching request header.

**Clickjacking** — attacker embeds your site in an invisible `<iframe>` overlaid on their page, tricking users into clicking your buttons. Defense: **forbid framing** with **`X-Frame-Options: DENY`** or the modern **CSP `frame-ancestors 'none'`** (or an allowlist of trusted parents).

**Key points:**
- Stored XSS is worse than reflected
- Trusted Types API helps enforce safe DOM sinks
- CSRF only affects browser-sent credentials (cookies, basic auth)
- React/Vue/Angular escape by default — `dangerouslySetInnerHTML` is opt-in

---

### 31. CSS Grid: template-areas, implicit vs explicit

**Frequency:** Medium

**Question:** How does CSS Grid work, and what's the difference between the explicit and implicit grid?

**Answer:** CSS Grid is a **two-dimensional** layout system (rows *and* columns at once, unlike Flexbox's single axis). You define a grid on a container and place children into cells.

The **explicit grid** is what you declare directly with **`grid-template-rows`** and **`grid-template-columns`** — the tracks you name up front:
```css
.container { display: grid; grid-template-columns: 200px 1fr; }
```
The **implicit grid** is what the browser **auto-creates** when content overflows the explicit tracks — e.g. more items than defined cells, or an item placed at row 5 when you only defined 3. **`grid-auto-rows`/`grid-auto-columns`** size these auto-generated tracks, and **`grid-auto-flow`** (`row`/`column`/`dense`) controls the direction items flow to fill them. So explicit = the grid you drew; implicit = the overflow grid the browser manufactures.

**`grid-template-areas`** lets you lay out **named regions** visually, like ASCII art, then assign each child with **`grid-area`**:
```css
.container { grid-template-areas: "nav main" "nav aside"; }
.nav { grid-area: nav; }  /* spans both rows automatically */
```
This is extremely readable for page layouts and trivially re-arrangeable in media queries.

Key tools: **`repeat(auto-fit, minmax(200px, 1fr))`** builds a **responsive grid with no media queries** — columns automatically wrap and stretch to fill the row (`auto-fill` leaves empty tracks, `auto-fit` collapses them). The **`fr`** unit distributes **leftover space** after fixed tracks are allocated. **`place-items`** is shorthand for `align-items`/`justify-items` (cross- and inline-axis alignment inside cells). And **`subgrid`** (now widely shipped) lets a nested grid **inherit its parent's track sizing**, so nested content lines up with the outer grid.

**Key points:**
- `repeat(auto-fit, minmax(200px, 1fr))` builds responsive grids without media queries
- `fr` distributes leftover space after fixed tracks
- `place-items` is shorthand for align/justify-items
- Subgrid (now widely shipped) lets nested grids inherit parent tracks

---

### 32. CSS cascade & inheritance

**Frequency:** Medium

**Question:** How does the CSS cascade decide which declaration wins, and how does that differ from inheritance?

**Answer:** The **cascade** is the algorithm that resolves conflicts when multiple rules target the same element/property. It compares declarations in this **priority order** (each tier only breaks ties from the one above):
1. **Origin & importance** — who wrote the rule and whether it's `!important`. The precedence band runs: user-agent → user → author → **author `!important`** → user `!important` → UA `!important` (note `!important` *flips* the order). **Browser user-agent stylesheets are the lowest** normal-priority origin.
2. **Cascade layers (`@layer`)** — a newer tier that sits **above specificity**: a declaration in a later-declared layer beats one in an earlier layer *regardless of specificity*, giving you predictable override control.
3. **Specificity** — the `(inline, IDs, classes/attrs/pseudo-classes, elements)` tuple.
4. **Source order** — if everything above ties, the **last declaration wins**.

**Inheritance is a completely separate mechanism** and only matters when *no* rule targets an element for a given property. Some properties **inherit by default** — mostly typography/text: `color`, `font-*`, `line-height`, `visibility`. Most **layout/box properties do not** inherit: `margin`, `padding`, `border`, `width`, `background`. When they don't inherit, the element uses the property's *initial* value.

You can override inheritance explicitly with the CSS-wide keywords: **`inherit`** (force the parent's computed value), **`initial`** (the property's spec default), **`unset`** (inherit if the property normally inherits, else initial), and **`revert`** (roll back to the previous cascade origin, e.g. the UA stylesheet). Handy details: **`all: unset`** resets every property on an element — great for a clean component reset; and **custom properties (`--foo`) always inherit** unless overridden, which is what makes CSS variables cascade naturally down the tree.

**Key points:**
- `all: unset` is useful for resetting a single component
- Custom properties (`--foo`) always inherit unless overridden
- Cascade layers introduce a tier above specificity
- Browser user-agent stylesheets are the lowest-priority origin

---

### 33. Pseudo-classes vs pseudo-elements

**Frequency:** Medium

**Question:** What's the difference between pseudo-classes and pseudo-elements?

**Answer:** The names sound similar but they do opposite things:

- A **pseudo-class** selects an **existing element that's in a particular state or position** — it doesn't create anything, it just conditionally matches. Examples: **`:hover`/`:focus`/`:active`** (interaction state), **`:focus-visible`** (focus from keyboard vs mouse), **`:nth-child()`/`:first-of-type`** (structural position), **`:checked`/`:disabled`/`:invalid`** (form state), and **`:has()`** (matches based on descendants). Syntax: a **single colon** `:`.
- A **pseudo-element** styles or **creates a sub-part of an element** that isn't a real DOM node — a piece the browser lets you target. Examples: **`::before`/`::after`** (generated content boxes), **`::marker`** (list bullet), **`::selection`** (highlighted text), **`::placeholder`** and **`::file-selector-button`** (form internals), **`::first-line`/`::first-letter`**. Syntax: **double colon** `::` (a single colon still works for the four legacy ones for back-compat).

A crucial gotcha: **`::before`/`::after` won't render without a `content` property** — even `content: ""` is required to make the generated box appear.

```css
button:focus-visible { outline: 2px solid blue; }   /* pseudo-class: state */
.card::after { content: ""; display: block; }        /* pseudo-element: sub-part */
```

Worth knowing: **`:focus-visible`** shows focus rings only for keyboard users (not mouse clicks), fixing the old "remove the ugly outline" accessibility mistake; **`:has()`** is the long-awaited **parent selector** (`.card:has(img)`), now broadly supported; and each element has **only one `::before` and one `::after`** — you can't stack multiples.

**Key points:**
- `:focus-visible` shows focus rings only for keyboard users
- `:has()` is a parent selector now broadly supported
- `::placeholder`, `::file-selector-button` style form internals
- Only one `::before` and one `::after` per element

---

### 34. Stacking context & `z-index` traps

**Frequency:** Medium

**Question:** What is a stacking context, and why can a child's huge `z-index` fail to bring it to the front?

**Answer:** A **stacking context** is a self-contained group of elements that the browser paints together as one unit along the z-axis. The critical rule: **`z-index` only competes *within* the same stacking context.** Once an element forms its own context, all of its descendants are painted **within** that context and are stacked *as a group* relative to siblings of the context — they can't punch out of it.

That's why a child with **`z-index: 9999` can't escape its parent**: if the parent established a stacking context that sits *below* some other element, the child's giant z-index only wins the battle *inside* the parent — the whole parent group still renders beneath the sibling. The child's 9999 is compared against its siblings, not against elements outside the parent's context.

A new stacking context is triggered by many things, and the surprising ones cause most bugs:
- **`position` (relative/absolute/fixed/sticky) + a `z-index` other than `auto`**
- **`opacity` less than 1**
- **`transform`, `filter`, `perspective`, `clip-path`, `mask`** (any non-`none` value)
- **`will-change`** naming one of the above
- **`isolation: isolate`** (created *specifically* to make a context with no other side effects)
- flex/grid children with `z-index`, and the root `<html>` element.

The practical traps: an ancestor's **`transform` or `filter`** (say, a CSS animation) silently creates a context that **traps a `position: fixed` modal or tooltip**, so it no longer positions relative to the viewport and can't layer above other content. Two fixes: use **`isolation: isolate`** to *intentionally* scope z-index on a wrapper, or **portal modals/tooltips into `document.body`** so they escape the trapping ancestor entirely. The **DevTools Layers panel** visualizes the actual compositing layers to debug these.

**Key points:**
- Use `isolation: isolate` to scope z-index intentionally
- Auto-promoted layers (transforms) frequently surprise modal/tooltip layouts
- Portal modals into `document.body` to avoid context traps
- DevTools' Layers panel visualizes the stacking tree

---

### 35. CSS-in-JS vs utility-first vs CSS modules

**Frequency:** Medium

**Question:** Compare CSS-in-JS, utility-first CSS, and CSS modules as styling approaches.

**Answer:** Three families that solve CSS's global-scope and maintainability problems differently:

**CSS-in-JS** (styled-components, Emotion) — write styles **inside JS components**, co-located with the markup they style, with **scoped class names generated automatically** and full access to props/state for **dynamic theming** (`color: ${p => p.theme.primary}`). The tradeoff is **runtime cost**: many libraries generate and inject styles *during render*, adding CPU work and **SSR complexity** (you must extract critical CSS and hydrate correctly). This is why **runtime CSS-in-JS is discouraged in React Server Components** — RSCs don't run client JS, so runtime style injection breaks. The modern answer is **zero-runtime CSS-in-JS** (vanilla-extract, Panda, Linaria) that extracts styles to static `.css` at build time.

**Utility-first** (Tailwind) — compose UIs from tiny **atomic classes** (`flex px-4 text-sm`) directly in markup. Benefits: a **small, cap-sized stylesheet** (utilities are shared and deduped, so CSS size plateaus as the app grows), no naming bikeshedding, and no dead CSS. The tradeoff is **verbose, harder-to-read markup** and a learning curve. **Tailwind v4** ships a **native (Rust/Lightning CSS) engine** for much faster builds and CSS-first config.

**CSS Modules** — plain `.module.css` files where the bundler **locally scopes class names** (`.button` → `.Button_button_a1b2`). Benefits: **zero runtime**, familiar CSS syntax, and clean composition with **PostCSS** pipelines. The tradeoff: **no built-in dynamic theming** (you fall back to CSS variables for that).

How to choose: prioritize **SSR/RSC compatibility and runtime cost** (favor Tailwind or zero-runtime approaches for server-heavy apps), then **team familiarity** and whether you need prop-driven dynamic styling.

**Key points:**
- Runtime CSS-in-JS is discouraged in React Server Components
- Tailwind v4 uses native CSS engine for faster builds
- CSS modules compose with PostCSS pipelines
- Choose based on team familiarity and SSR/RSC requirements

---

### 36. `<picture>`, `srcset`, responsive images

**Frequency:** Medium

**Question:** How do you serve responsive images with `<picture>`, `srcset`, and `sizes`?

**Answer:** Responsive images let the browser download the **right image for each device** instead of shipping one huge file to everyone. There are two mechanisms for two different problems:

**`srcset` + `sizes` (resolution switching)** — give the browser several versions of the *same* image at different widths and let it pick based on the device's **DPR** (retina vs standard) and the image's **rendered layout width**:
```html
<img src="photo-800.jpg"
     srcset="photo-400.jpg 400w, photo-800.jpg 800w, photo-1600.jpg 1600w"
     sizes="(max-width: 600px) 100vw, 50vw" alt="...">
```
A key subtlety: **`sizes` describes the *layout* width the image will occupy** (e.g. "50vw on desktop"), *not* the file's pixel width — the browser combines `sizes` + DPR to choose the best `srcset` candidate.

**`<picture>` (art direction + format negotiation)** — supply *different* sources and let the browser pick the **first supported one**, ideal for serving next-gen formats with fallbacks, or a differently-cropped image per breakpoint:
```html
<picture>
  <source type="image/avif" srcset="hero.avif">
  <source type="image/webp" srcset="hero.webp">
  <img src="hero.jpg" alt="..." width="1200" height="600">
</picture>
```
Browsers try **AVIF → WebP → JPEG**, falling back gracefully.

Supporting attributes: **`loading="lazy"`** defers offscreen images until near the viewport; **`decoding="async"`** decodes off the main thread so it doesn't block paint; **`fetchpriority="high"`** boosts a critical image's priority. Two non-negotiables: **always set `width`/`height` (or `aspect-ratio`)** so the browser reserves space and avoids **CLS**; and **never lazy-load the above-the-fold LCP image** — that delays your most important paint. Use a **CDN with on-the-fly resizing** to generate the `srcset` variants automatically.

**Key points:**
- Always set `width`/`height` (or aspect-ratio) to prevent CLS
- `sizes` describes layout width, not image width
- Use a CDN with on-the-fly resizing for variants
- Mark above-the-fold images with `fetchpriority="high"`, not lazy

---

### 37. WAI-ARIA roles & when NOT to use them

**Frequency:** Medium

**Question:** What is WAI-ARIA for, and when should you NOT use it?

**Answer:** **WAI-ARIA** is a set of `role`, `state`, and `property` attributes that add **accessibility semantics** the browser exposes to screen readers and other assistive tech. It exists to describe **rich, custom widgets that native HTML can't express** — things like **tabs, comboboxes, tree views, and live regions** — so a screen-reader user understands what a `<div>`-built control *is* and *does*.

The governing principle is the **first rule of ARIA: "don't use ARIA."** If a **native element** does the job — `<button>`, `<a>`, `<nav>`, `<input type="checkbox">` — use it, because native elements come with **built-in keyboard behavior, focus, and semantics for free**. ARIA only *describes*; it changes **nothing** about behavior. Slapping `role="button"` on a `<div>` tells the screen reader "this is a button" but gives you **no click-on-Enter/Space, no focusability, no disabled handling** — you must add all of that yourself, which is why re-implementing natives with ARIA is an anti-pattern.

Common mistakes:
- **Redundant roles** — `<button role="button">`, `<nav role="navigation">` add noise (the semantics are already there).
- **Missing keyboard handlers** — adding a role without wiring up Enter/Space/arrow keys, leaving the widget unusable by keyboard.
- **`aria-hidden` on a focusable element** — hides it from screen readers while it remains in the tab order, so keyboard users focus an "invisible" control.

Useful ARIA when native falls short: **`aria-live`** regions announce dynamic updates (toasts, validation, async results) without moving focus; **`aria-expanded`/`aria-controls`** describe disclosure widgets (accordions, menus); **`aria-label`/`aria-labelledby`** name controls that lack visible text (an icon-only button) — note `aria-label` *overrides* visible text for AT, so use carefully. Always **test with real tools** — **axe-core** for automated checks plus manual passes with **VoiceOver/NVDA** — since linters can't catch experiential problems.

**Key points:**
- `aria-live` regions announce dynamic updates
- `aria-expanded`, `aria-controls` describe disclosure widgets
- `aria-label` overrides visible text for screen readers
- Run axe-core and test with VoiceOver/NVDA, not just linters

---

### 38. Keyboard nav & focus management

**Frequency:** Medium

**Question:** How do you make an interface fully keyboard-navigable and manage focus correctly?

**Answer:** Keyboard accessibility means **every interactive element is reachable and operable without a mouse** — essential for screen-reader users, motor-impaired users, and power users.

**Tab order & focusability:**
- Rely on **natural DOM order** for tab sequence and **avoid positive `tabindex`** (`tabindex="5"`) — it creates a brittle, confusing order that's hard to maintain. Use `tabindex="0"` to add a custom element to the natural order.
- **`tabindex="-1"`** makes an element **programmatically focusable** (via `.focus()`) but keeps it *out* of the tab sequence — used for focus targets like modal containers or error summaries.

**Focus management** is the hard part, especially for modals/dialogs:
1. On open, **move focus into the modal** (usually the first focusable element or the dialog itself).
2. **Trap focus** inside while open — Tab from the last element wraps to the first, and Shift+Tab from the first wraps to the last, so focus can't leak to the page behind.
3. On close, **restore focus** to the element that triggered it (e.g. the button that opened the modal), so the user isn't dumped at the top of the page.

Use **`:focus-visible`** for focus rings so they appear for **keyboard users but not mouse clicks**, giving clear indication without the "ugly outline on click" complaint that leads people to (wrongly) remove outlines entirely.

Supporting patterns: **skip-to-content links** let keyboard users bypass long nav; **roving tabindex** manages composite widgets (tabs, menus, grids) where the *group* is one tab stop and **arrow keys** move within it (only the active item has `tabindex="0"`, the rest `-1`). Never **remove outlines without a visible alternative**. The simplest test: **unplug your mouse** and try to use the whole app.

**Key points:**
- Skip-to-content links help keyboard users bypass nav
- Roving tabindex for composite widgets (tabs, menus, grids)
- Never remove outlines without providing an alternative
- Test by unplugging the mouse

---

### 39. Color contrast (WCAG AA/AAA)

**Frequency:** Medium

**Question:** What are the WCAG color-contrast requirements, and how is contrast measured?

**Answer:** **WCAG** defines minimum contrast ratios between text/UI and its background so low-vision users can read content. The ratio ranges from **1:1** (identical) to **21:1** (pure black on white).

**Level AA** (the common legal/practical baseline):
- **4.5:1** for **normal text**
- **3:1** for **large text** (≥ 18pt, or ≥ 14pt bold) and for **UI components / graphical objects** (button borders, icons, form outlines)

**Level AAA** (stricter):
- **7:1** for normal text
- **4.5:1** for large text

Contrast is computed from **relative luminance** — a formula on the sRGB channel values — **not perceived brightness**, which is why some pairs that *look* fine still fail (and vice versa). This is a known weakness: the current formula poorly models human perception, especially for dark themes. **APCA** (Accessible Perceptual Contrast Algorithm), the candidate for **WCAG 3**, models perception far better and is **asymmetric** — it scores **dark-text-on-light** differently from **light-text-on-dark** (the same two colors have different readability depending on which is foreground), which the current ratio treats identically.

Practical guidance: **test every state** — hover, focus, disabled, and especially **placeholder text** (a frequent failure since it's deliberately dim). **Never rely on color alone** to convey meaning (error = red) — pair it with an **icon or text label** for color-blind users. Tools: **axe, Lighthouse, Stark, and Chrome DevTools' contrast picker** (which shows AA/AAA pass/fail live). Finally, **Windows High Contrast / `forced-colors` mode** overrides your palette entirely and needs **separate testing** — don't assume passing contrast means it works there.

**Key points:**
- Test all states (hover, disabled, placeholder)
- Don't rely on color alone — pair with icons or text
- Tools: axe, Lighthouse, Stark, Chrome's contrast picker
- High-contrast mode (forced-colors) needs separate testing

---

### 40. SVG vs PNG vs WebP vs AVIF

**Frequency:** Medium

**Question:** How do SVG, PNG, WebP, and AVIF compare, and when do you use each?

**Answer:** Two are **vector/lossless** and two are **modern lossy raster** formats — pick by content type:

- **SVG (vector)** — XML-described shapes that are **resolution-independent** (crisp at any size/DPR) and **scriptable/styleable** with CSS. Ideal for **icons, logos, illustrations, and charts**. Tiny for simple graphics, but a poor fit for photos (complex imagery balloons the file). Prefer **inline or sprite SVG over icon fonts** (better accessibility, no FOUT, individually colorable). Compress with **SVGO** to strip editor cruft.
- **PNG (lossless raster)** — pixel-perfect with **alpha transparency**. Best for **screenshots, diagrams, and images needing sharp edges/transparency** where lossy artifacts are unacceptable. Downside: **large files** for photographic content.
- **WebP** — modern format **~25–35% smaller than JPEG** at similar quality, with **transparency and animation** support. A great general-purpose default with broad browser support.
- **AVIF** — newest format, **~50% smaller than JPEG** with better quality (especially gradients/low-light) and HDR/wide-gamut support. Tradeoff: **slower to encode** and slightly less universal support, so serve it **first with a WebP/JPEG fallback**.

Delivery pattern — use **`<picture>`** to negotiate formats with graceful fallback:
```html
<picture>
  <source type="image/avif" srcset="img.avif">
  <source type="image/webp" srcset="img.webp">
  <img src="img.jpg" alt="..." width="800" height="600">
</picture>
```
Other guidance: use **`<img>` for content images** (they're semantic and accessible via `alt`) and **CSS `background-image` for purely decorative** visuals. AVIF/WebP **always need a fallback** for older browsers.

**Key points:**
- Sprite/inline SVG for icons; avoid icon fonts
- AVIF/WebP need explicit fallback for older browsers
- Use `<img>` for content images, CSS `background` for decoration
- Compress SVGs with SVGO

---

### 41. CSS variables vs SASS variables

**Frequency:** Medium

**Question:** How do CSS custom properties differ from SASS variables, and when do you need each?

**Answer:** The fundamental difference is **when they resolve**:

**SASS variables (`$color`)** are **preprocessor/build-time**. They're substituted into static CSS during compilation and **don't exist in the shipped stylesheet** — the browser never sees `$color`, only the final `red`. Because they're resolved before runtime, they **can't cascade, can't inherit, and can't change based on the DOM, media queries, or JS**. They're just build-time text substitution.

**CSS custom properties (`--color: red`)** are **runtime, live values** in the actual CSSOM. They:
- **Cascade and inherit** down the DOM like real CSS (a `--color` set on `:root` flows everywhere; overriding it on a subtree re-themes just that subtree).
- **Respond to media queries** — redefine `--gap` inside `@media` and everything using `var(--gap)` updates.
- Can be **read and written by JS** at runtime: `el.style.setProperty('--x', value)` / `getComputedStyle(el).getPropertyValue('--x')`.

This runtime nature is why **theming (light/dark, brand swaps, per-component color) *requires* CSS variables** — you flip a value on `:root` or a wrapper and the whole tree re-themes with no rebuild. SASS simply can't do that.

They're **complementary, not competing**: SASS still earns its place for **build-time power** — **mixins, functions, `@each`/`@for` loops, nesting, partials, and modular file structure** — things CSS variables don't address. A common modern stack uses SASS for authoring ergonomics *and* CSS variables for runtime theming.

Details worth knowing: custom properties can be **scoped to any selector** for component-level theming; **`var(--x, fallback)`** supplies a default when undefined; they work inside **`calc()`** (`calc(var(--gap) * 2)`); but note a raw custom property **doesn't `transition`/animate smoothly** unless registered via **`@property`** with a type, because otherwise the browser treats it as an untyped string.

**Key points:**
- CSS variables can be scoped to a selector for component theming
- `var(--x, fallback)` provides a default
- JS read/write via `element.style.setProperty('--x', value)`
- CSS variables work in `calc()`, transitions don't animate them well

---

### 42. Animations: `transition` vs `@keyframes`; compositor-friendly properties

**Frequency:** Medium

**Question:** What's the difference between CSS `transition` and `@keyframes`, and which properties are compositor-friendly?

**Answer:** Both animate CSS, but they suit different needs:
- **`transition`** interpolates a property **between two states** — a start value and an end value, triggered by a change (class toggle, `:hover`, `:focus`). It's declarative and perfect for simple A→B effects (a button growing on hover, a menu fading in).
- **`@keyframes`** (driven by the **`animation`** property) defines **multi-step** animations with intermediate stops (`0% { } 50% { } 100% { }`), supports **looping, delays, direction, and fill modes**, and can run on load without a state change. Use it for complex, repeating, or multi-stage motion (a spinner, a bouncing indicator).

The performance story is the key part: the browser's rendering pipeline is **layout → paint → composite**, and **only `transform` and `opacity` can be animated on the compositor thread**, skipping layout and paint entirely. Animating them is cheap and can stay at 60fps even under main-thread load. In contrast, animating **`width`, `height`, `top`/`left`, `margin`** forces **layout (reflow) every frame**, and animating **`box-shadow`, `background`, `color`** forces **paint** every frame — both expensive and janky. So the golden rule: **prefer `transform: translate()` over `top`/`left`, and `transform: scale()` over `width`/`height`.**

**`will-change`** hints the browser to promote an element to its own layer ahead of time — but use it **sparingly**: over-promotion wastes GPU memory and can *hurt* performance. Add it just before animating, remove it after.

Final considerations: the frame budget for **60fps is ~16ms per frame** (120Hz displays get ~8ms) — blow past it and you drop frames. Always honor **`prefers-reduced-motion`** to disable/reduce non-essential animation for users with vestibular sensitivity. And the newer **View Transitions API** animates **between two DOM states** (even across full page/route changes) declaratively, handling the crossfade/morph for you.

**Key points:**
- 60fps means each frame has ~16ms to render
- Prefer `transform: translate` over `top/left`
- `prefers-reduced-motion` should disable non-essential animations
- View Transitions API enables cross-state animations declaratively

---

### 43. Iterators & generators

**Frequency:** Medium

**Question:** What are iterators and generators in JavaScript, and what do they enable?

**Answer:** They're the machinery behind "looping over a sequence," built on two protocols:
- The **iterator protocol**: an object with a **`next()`** method that returns **`{ value, done }`** — `value` is the current item, `done` becomes `true` when exhausted.
- The **iterable protocol**: an object with a **`[Symbol.iterator]()`** method that returns an iterator. Anything iterable (arrays, strings, `Map`, `Set`) implements this, which is why `for...of`, spread, and destructuring all work on them.

**Generators** (`function*`) are the ergonomic way to *produce* iterators. The **`yield`** keyword **pauses execution** and hands a value out; the function resumes exactly where it left off on the next `next()` call, keeping all local state. This makes them ideal for:
```js
function* range(n) { for (let i = 0; i < n; i++) yield i; }
for (const x of range(3)) console.log(x); // 0 1 2
```
- **Lazy/infinite sequences** — values are computed on demand, so you can model an infinite stream (`function* naturals()`) and take only what you need without ever materializing it.
- **Custom iteration** — define how your own data structure (a tree, a linked list) is traversed by `for...of`.
- **Coroutine-style async** — historically (pre-`async/await`), libraries like `co` used generators to pause on Promises; `async/await` is essentially a specialized generator.

Distinctions and extras: **`for...of` consumes iterables** (the *values*), whereas **`for...in` enumerates enumerable keys** (including inherited ones) — a common mix-up. Generators also support **`.return()`** (finish early, run `finally` cleanup) and **`.throw()`** (inject an error at the yield point). **Async generators** (`async function*`) yield Promises and pair with **`for await...of`** for streaming async data (paginated APIs, readable streams). And **spread/destructuring work on *any* iterable**, not just arrays.

**Key points:**
- `for...of` consumes iterables; `for...in` enumerates keys
- Generators support `.return()` for cleanup and `.throw()`
- Async generators (`async function*`) pair with `for await...of`
- Spread/destructuring work on any iterable

---

### 44. ESM vs CommonJS; dynamic `import()`

**Frequency:** Medium

**Question:** How do ES modules differ from CommonJS, and what is dynamic `import()`?

**Answer:** They're JavaScript's two module systems with fundamentally different loading models:

**CommonJS (CJS)** — Node's original system using **`require()`** and **`module.exports`**. It's **synchronous** (`require` blocks until the module loads) and **dynamic** — you can `require()` conditionally inside an `if`, build the path at runtime, etc. Because exports are resolved at runtime, CJS **can't be reliably tree-shaken** (bundlers can't statically know what's used).

**ES Modules (ESM)** — the **web standard** using **`import`/`export`**. Imports are **static** (declarations at the top level, analyzable before execution), which enables **tree-shaking** (dead-code elimination) and **async-capable** loading. This static structure is the key advantage for bundlers and the browser.

**Dynamic `import()`** bridges the gap: it's a **function-like form that returns a Promise**, so you can load a module **on demand** (`const m = await import('./x.js')`) inside conditionals or event handlers. It works in **both the browser and Node ESM** and is the primitive behind **code splitting** and **conditional/lazy loading**.

Interoperability is the painful part: **ESM can `import` a CommonJS module** (Node wraps it), but **CommonJS cannot `require()` an ESM module** — it must use dynamic `import()` (since ESM is async and `require` is sync). This mismatch causes much of the "dual package" friction in the ecosystem.

Key specifics: ESM imports are **hoisted and live-bound** (you get a live *reference* to the export, so if the exporter reassigns it, importers see the new value — unlike CJS's copied snapshot). **`package.json` `"type": "module"`** flips Node's default so `.js` is treated as ESM. The **`"exports"` field** controls which subpaths consumers may import and maps them to files. And **top-level `await`** (awaiting at module scope) is **ESM-only**.

**Key points:**
- ESM imports are hoisted and live-bound
- `package.json` `"type": "module"` flips Node default
- `exports` field controls subpath resolution
- Top-level await works in ESM only

---

### 45. Deep clone (`structuredClone`, JSON, recursive)

**Frequency:** Medium

**Question:** What are the ways to deep clone an object in JavaScript, and their tradeoffs?

**Answer:** "Deep clone" means copying an object *and all nested objects* so the copy shares no references with the original. Three approaches, in order of preference:

**1. `structuredClone(obj)`** — the modern built-in and the right default. It handles **circular references, `Map`, `Set`, `Date`, `RegExp`, `ArrayBuffer`/typed arrays, and Blobs**. What it **can't** clone: **functions, DOM nodes, and symbols** — it throws (a `DataCloneError`) on those. It uses the same **structured clone algorithm** the browser uses for **`postMessage`** to Web Workers and `history.state`.

**2. `JSON.parse(JSON.stringify(obj))`** — the old one-liner. Fast for plain JSON-shaped data, but it **silently mangles or drops** a lot: **functions and `undefined` vanish, symbols are dropped, `Date` becomes an ISO *string*, `Map`/`Set` become `{}`, `NaN`/`Infinity` become `null`**, and it **throws on circular references**. Only safe for data you *know* is pure JSON.

**3. Hand-written recursive clone** — full control (you decide how to handle functions, custom classes, etc.), but **verbose, slow, and error-prone**. If you must, use a **`WeakMap` to memoize** already-cloned objects so you handle **cycles** correctly and don't infinite-loop.

Context that interviewers probe: **shallow cloning** (`{...obj}` or `Object.assign({}, obj)`) copies only **one level** — nested objects are still shared references, which surprises people who expect it to be deep. For immutable state updates, **structural-sharing libraries like Immer** avoid full deep clones entirely — they reuse unchanged subtrees and only copy the paths that changed, which is far more efficient than cloning the whole tree on every update.

**Key points:**
- Shallow clone: `{...obj}` or `Object.assign({}, obj)` (one level only)
- Immutability libs (Immer) produce structurally-shared clones
- `structuredClone` is also used by `postMessage`
- WeakMap memoization handles cycles in custom recursive clones

---

### 46. WeakMap / WeakSet

**Frequency:** Medium

**Question:** What are `WeakMap` and `WeakSet`, and when do you use them?

**Answer:** They're collections whose references to their keys (WeakMap) or values (WeakSet) are **weak** — meaning they **don't prevent garbage collection**. If the only remaining reference to an object is inside a `WeakMap`/`WeakSet`, the GC is free to reclaim it, and the entry silently disappears.

That property makes them ideal for **associating side data with an object without owning its lifetime**. The canonical use is **attaching metadata to DOM nodes or class instances**: `const meta = new WeakMap(); meta.set(domNode, {...})`. When the DOM node is removed and otherwise unreferenced, the WeakMap entry is collected automatically — **no memory leak**. A regular `Map` would keep the node alive forever (a classic leak), because the Map's strong reference pins it.

The tradeoff: because entries can **vanish at any time**, `WeakMap`/`WeakSet` are **not iterable** and expose **no `size`** — there's no `.keys()`, `.forEach()`, or `.clear()`. You can only `get`/`set`/`has`/`delete` by a specific object reference. (If entries could be enumerated, GC timing would become observable, which the spec forbids.)

Rules and uses:
- **Keys must be objects** (or non-registered symbols) — you can't use primitives, since primitives aren't garbage-collected.
- They were the standard way to implement **private fields** before `#private` class-field syntax existed (store per-instance private data in a module-scoped WeakMap).
- Great for **caches/memoization keyed by ephemeral objects** — the cache entry lives exactly as long as the key does.
- For finer control, **`WeakRef`** holds a weak reference to a *single* object (with `.deref()`), and **`FinalizationRegistry`** lets you register a cleanup callback to run *after* an object is collected — both advanced, use-sparingly tools.

**Key points:**
- Keys must be objects (or non-registered symbols)
- Perfect for private fields pre-class-fields syntax
- Use for caches keyed by ephemeral objects
- `WeakRef` and `FinalizationRegistry` give finer-grained weak references

---

### 47. Map vs object as dictionary

**Frequency:** Medium

**Question:** When should you use a `Map` versus a plain object as a dictionary?

**Answer:** Both store key→value pairs, but they have different guarantees and hazards.

**`Map` advantages:**
- **Any key type** — objects, functions, numbers, even `NaN` work as keys. Object keys use *reference* identity. Plain objects **coerce all keys to strings** (or symbols), so `obj[1]` and `obj['1']` collide.
- **Guaranteed insertion-order** iteration, and a clean iteration API (`for...of`, `.keys()`, `.values()`, `.entries()`).
- A **real `.size`** property (objects need `Object.keys(o).length`).
- **Better performance for frequent add/delete** of entries — Maps are optimized for churn.
- **No prototype** — no accidental collisions with inherited members.

**Plain object advantages:**
- **JSON-friendly** — `JSON.stringify` works directly; `Map` doesn't serialize natively.
- **Ergonomic literal syntax** and property access for fixed-shape records.
- First-class **TypeScript support** via `Record<K, V>` and interfaces.

The big object gotcha is **prototype pollution**: keys like **`__proto__`, `constructor`, `hasOwnProperty`** clash with inherited properties, so user-controlled keys on a plain object are a **security and correctness risk** (`obj['__proto__']` can corrupt the prototype). Maps are immune. If you must use an object as a dictionary with untrusted keys, create it with **`Object.create(null)`** — a prototype-less object with no inherited keys to collide with.

Rule of thumb: use a **`Map` for dynamic keyed collections** (unknown/arbitrary keys, frequent add/remove, non-string keys, ordering matters); use a **plain object (or `Record<K,V>`) for fixed-shape records** you'll serialize to JSON. To convert a `Map` to JSON, use **`Object.fromEntries(map)`** (loses non-string keys) and `new Map(Object.entries(obj))` to go back.

**Key points:**
- `Object.create(null)` gives a prototype-less dictionary
- `Map` iteration is faster and more predictable
- JSON doesn't natively serialize `Map` — convert via `Object.fromEntries`
- TypeScript's `Record<K, V>` is for object dictionaries

---

### 48. TS: `unknown` vs `any` vs `never`

**Frequency:** Medium

**Question:** In TypeScript, how do `unknown`, `any`, and `never` differ?

**Answer:** These are the three "special" types at the extremes of TypeScript's type system, and mixing them up is a common mistake.

**`any`** — the **escape hatch that turns type-checking off**. A value typed `any` can be assigned to/from anything, have any property accessed, and be called — with **zero compile-time safety**. Worse, it's **viral/infectious**: it propagates through return types and expressions, silently disabling checking wherever it flows (`const x: any = ...; const y = x.foo.bar()` — all unchecked). Treat `any` as a code smell.

**`unknown`** — the **type-safe counterpart to `any`**. It's the **top type**: anything is assignable *to* `unknown`, but you **can't do anything with an `unknown` value until you narrow it** to a specific type. This forces a safety check at the boundary:
```ts
function handle(x: unknown) {
  // x.foo  // ❌ compile error
  if (typeof x === 'string') x.toUpperCase(); // ✅ narrowed
}
```
Use **`unknown` for external/untrusted input** (`JSON.parse`, `fetch` responses, `catch` clause errors) so the compiler forces you to validate before use.

**`never`** — the **bottom type**: a value that *can never exist*. It's what a function returns if it **always throws or loops forever** (`function fail(): never`), and it's the type of a variable in an **unreachable branch**. Its killer use is **exhaustiveness checking**: in a `switch` over a union, an `assertNever(x: never)` in the `default` produces a **compile error the day someone adds a new union member** and forgets to handle it — turning a runtime bug into a build failure:
```ts
function assertNever(x: never): never { throw new Error(`Unexpected: ${x}`); }
```

Gotchas: **empty arrays are inferred as `never[]`** without context (`const a = []` then pushing needs annotation); and enabling **`strict`/`noImplicitAny`** is what forces `unknown`/explicit types instead of silent `any` creeping in.

**Key points:**
- `unknown` requires `typeof`/`instanceof`/predicate narrowing
- `any` infects through return types
- Empty arrays are inferred as `never[]` without context
- Use `noImplicitAny` and `strict` to catch slip-ups

---

### 49. TS: generics, constraints, defaults

**Frequency:** Medium

**Question:** How do TypeScript generics work — constraints, defaults, and conditional types?

**Answer:** **Generics parameterize types**, letting one definition work over many types while **preserving the relationship** between inputs and outputs. The identity function is the canonical example:
```ts
function id<T>(x: T): T { return x; } // id('a') is string, id(1) is number
```
Here `T` links the argument type to the return type — something `any` would lose. This is the litmus test: **use a generic only when a type parameter genuinely relates two positions** (arg↔return, key↔value). A generic that appears in just one spot is usually a disguised `any` and should just be that concrete type or `unknown`.

**Constraints (`T extends U`)** bound a type parameter to guarantee it has certain members:
```ts
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b; // safe: T is known to have .length
}
```
The **`extends keyof T`** pattern is especially common for type-safe property access:
```ts
function get<T, K extends keyof T>(obj: T, key: K): T[K] { return obj[key]; }
```

**Defaults (`<T = string>`)** provide a fallback when the caller doesn't specify or the compiler can't infer `T`, keeping generic APIs ergonomic.

**Conditional types (`T extends U ? X : Y`)** enable **type-level computation** — branching on types — and combined with **`infer`** (which *extracts* a type from within another) power the standard library:
```ts
type ElementType<T> = T extends (infer E)[] ? E : T; // unwrap array element type
```
This is exactly how built-ins like **`ReturnType`, `Parameters`, `Pick`, `Record`, and `Awaited`** are implemented under the hood — generic constraints plus conditional/mapped types. One modern refinement: **`NoInfer<T>` (TS 5.4+)** blocks the compiler from inferring `T` from a *particular* argument position, so inference is driven by the position you intend (e.g. inferring from a config's allowed values, not from a default argument).

**Key points:**
- Avoid generics that aren't actually relating two positions
- Use `extends keyof T` for property-name generics
- `NoInfer<T>` (TS 5.4+) prevents inference from one position
- Generic constraints power `Pick`, `Record`, etc.

---

### 50. TS: discriminated unions & exhaustiveness

**Frequency:** Medium

**Question:** What is a discriminated union in TypeScript, and how do you enforce exhaustiveness?

**Answer:** A **discriminated (or "tagged") union** is a union of object types that all share a **common literal field** — the **discriminant** (conventionally `kind`, `type`, or `tag`). Because that field has a *distinct literal value* in each variant, TypeScript can **narrow** the whole object to a single variant just by checking it:
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

**Exhaustiveness** is the killer feature. By adding `default: return assertNever(x)` (where `assertNever(x: never): never`), you make the compiler **fail the build if a new variant is added but not handled**. When you add `{ kind: 'triangle'; ... }` to `Shape`, the un-handled `x` in `default` is no longer `never`, so `assertNever(x)` errors — turning "I forgot to update this switch" from a silent runtime bug into a compile error you *can't* miss.

Supporting points: **discriminators must be literal types** (`'circle'`, not `string`) for narrowing to work — which is why you often pair union construction with **`as const`** so string fields are inferred as literals rather than widened to `string`. This pattern is everywhere: **Redux/Zustand action objects are textbook discriminated unions** (`{ type: 'increment' }`), as are state machines and API result types (`{ status: 'success' } | { status: 'error' }`). The **`satisfies`** operator helps here too — it validates a value against a type **without widening** it, preserving the narrow literal inference the discriminant needs.

**Key points:**
- Discriminators must be literal types
- Redux/Zustand actions are classic discriminated unions
- `satisfies` operator helps preserve narrow inference
- Pair with `as const` for inferred literals

---

### 51. TS: utility types (Partial/Pick/Omit/Record/ReturnType)

**Frequency:** Medium

**Question:** What are TypeScript's built-in utility types, and how do you compose them?

**Answer:** Utility types are **generic type transformers** in the standard library that derive new types from existing ones — so you define a shape once and mechanically produce variants, keeping types **DRY** and in sync. The workhorses:

- **`Partial<T>`** — makes every property optional. Ideal for **update/patch** payloads and form drafts: `function update(id, changes: Partial<User>)`.
- **`Required<T>`** — the inverse; makes all optional props required.
- **`Pick<T, K>`** — selects a subset of keys. `Pick<User, 'id' | 'name'>` builds a lightweight DTO.
- **`Omit<T, K>`** — removes keys. `Omit<User, 'password'>` for a safe API response.
- **`Record<K, V>`** — builds a dictionary type: `Record<string, number>`, `Record<UserId, User>`.
- **`ReturnType<F>`** — extracts a function's return type; **`Parameters<F>`** extracts its argument tuple. Great for inferring types from existing functions instead of re-declaring them.
- **`Awaited<T>`** — unwraps a `Promise` (recursively): `Awaited<Promise<string>>` is `string`.

They **compose**, which is where the power is — you chain them to model real API/DTO contracts:
```ts
type UserForm = Partial<Omit<User, 'id' | 'createdAt'>>;
type UserResponse = Omit<User, 'passwordHash'>;
type Handlers = Record<EventName, (e: Event) => void>;
```

Others worth knowing: **`Readonly<T>`** for immutable shapes (all props `readonly`); **`NonNullable<T>`** strips `null | undefined` from a type; and **`Exclude<U, X>` / `Extract<U, X>`** filter *union members* (`Exclude<'a'|'b'|'c', 'a'>` is `'b'|'c'`). When the built-ins fall short, you **roll your own** with **mapped types** (`{ [K in keyof T]: ... }`) plus **conditional types** — which is exactly how these utilities are implemented internally.

**Key points:**
- `Readonly<T>` for immutable shapes
- `NonNullable<T>` strips `null | undefined`
- `Exclude`/`Extract` filter union members
- Roll your own with mapped + conditional types when built-ins fall short

---

### 52. Currying & partial application

**Frequency:** Medium

**Question:** What are currying and partial application, and how do they differ?

**Answer:** Both **transform a multi-argument function into one you apply in stages**, but they're not the same thing.

**Currying** converts a function of N arguments into **N nested unary (one-argument) functions**: `f(a, b, c)` becomes `f(a)(b)(c)`. Each call takes exactly one argument and returns another function until the last one, which finally computes the result.
```js
const add = a => b => a + b;
add(1)(2); // 3
```

**Partial application** is looser: it **fixes *some* arguments now** and returns a function expecting **the rest** — not necessarily one at a time.
```js
const add3 = (a, b, c) => a + b + c;
const add10 = add3.bind(null, 10);   // fixes a; expects (b, c)
add10(20, 30); // 60
```
So: currying always produces a chain of *unary* functions; partial application just **pre-fills any number** of arguments and leaves a function of the remaining arity. Currying is one specific way to *enable* partial application.

Both power the same functional patterns: **specializing a general function into a reusable one** (`const inc = add(1)`), **point-free composition** (piping data through pre-configured functions without naming intermediate variables), and **dependency-injection-style configuration** (bake in a logger/config once, call with data later).

Practical notes: **`Function.prototype.bind`** is built-in partial application (its first arg sets `this`, the rest pre-fill parameters). Libraries like **Ramda and lodash/fp** ship **auto-curried** functions (call with fewer args → get back a function; all args → get the result), and put the **data argument last** specifically so currying composes cleanly (`map(addOne)` yields a list transformer). Watch out for **`this` binding and variadic/optional-argument functions** — they **don't curry cleanly** because the fixed arity currying assumes doesn't hold.

**Key points:**
- `Function.prototype.bind` does partial application
- Ramda/lodash-fp ship auto-curried versions
- Beware of `this` and arity (variadic functions don't curry cleanly)
- Useful for HOFs like `map(addOne, list)`

---

### 53. HOFs & composition

**Frequency:** Medium

**Question:** What are higher-order functions and function composition?

**Answer:** A **higher-order function (HOF)** is a function that **takes a function as an argument, returns a function, or both** — functions treated as ordinary values. The array methods you use daily are HOFs: **`map`, `filter`, `reduce`** all accept a callback. So do combinators like **`compose`** and **`pipe`**. HOFs let you **abstract over behavior**, not just data.

**Function composition** chains small **unary (single-argument)** functions so the output of one feeds the next. `pipe` runs **left-to-right**, `compose` **right-to-left**:
```js
const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);
pipe(f, g, h)(x); // === h(g(f(x)))

const compose = (...fns) => x => fns.reduceRight((v, f) => f(v), x);
compose(h, g, f)(x); // === h(g(f(x)))
```
Notice `pipe` is itself implemented with **`reduce`** — which is the point: **`reduce` is the universal HOF** from which `map`, `filter`, and the others can all be derived (they're just reduces with specific accumulators).

Why it matters: composition encourages **small, single-purpose, independently testable functions** that you assemble into **declarative data pipelines** — you read `pipe(parse, validate, normalize, save)` as a sentence, with no intermediate variables or imperative plumbing (**point-free style**).

Caveats: a very **long composition chain** can add call-stack depth and overhead, and naive `pipe` over arrays creates a **new intermediate array at every step** (`.map().filter().map()`). **Transducers** solve the latter by composing the *transformations* and doing a **single pass with no intermediate collections**. Finally, remember the **directional convention**: `compose` is math-style right-to-left (`compose(h,g,f)`), `pipe` is reading-order left-to-right (`pipe(f,g,h)`) — same result, opposite argument order.

**Key points:**
- `reduce` is the universal HOF — all others can be derived
- Watch for chain length impact on stack/perf
- Transducers compose without intermediate arrays
- Compose right-to-left, pipe left-to-right by convention

---

### 54. Memoization & pitfalls

**Frequency:** Medium

**Question:** What is memoization, and what are its pitfalls?

**Answer:** **Memoization** caches a function's **return value keyed by its arguments**, so repeat calls with the same inputs return the cached result instead of recomputing. It's a classic **time-for-space** trade:
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

It only works correctly for **pure, deterministic functions** — same input must always produce the same output with no side effects (memoizing something that reads a clock or DB gives stale results). It pays off when the function is **expensive** and inputs **repeat** and are **hashable**.

The pitfalls interviewers probe:
- **Unbounded cache growth = memory leak.** A `Map`-backed cache keeps every result forever. For long-lived or high-cardinality inputs, use an **LRU cache** to bound size, or a **`WeakMap`** when keying by objects (entries are GC'd when the key object dies).
- **Reference-based keys miss hits.** Keying by object identity means two structurally-equal-but-different objects (`{a:1}` vs `{a:1}`) are treated as different — cache misses. Serializing keys (`JSON.stringify`) fixes equality but is slow and breaks on functions/cycles/order.
- **Async race conditions.** Memoizing a `Promise`-returning function must cache the **in-flight Promise** (not just the resolved value), or concurrent callers before the first resolves each fire their own request. Also decide whether to **evict on rejection** so a transient failure isn't cached forever.
- **Don't memoize cheap work** — if the cache lookup (hashing the key, Map access) costs more than just recomputing, you've made it slower.

In React, **`useMemo`/`useCallback` are memoization scoped to a component's renders**, keyed by the dependency array — same principle, plus the goal of preserving **referential identity** across renders.

**Key points:**
- React's `useMemo`/`useCallback` are memoization with referential identity
- `Map`-backed memo handles object keys but leaks
- LRU caches bound memory
- Don't memoize cheap operations — the cache lookup costs more

---

### 55. Iterating large lists without blocking main thread

**Frequency:** Medium

**Question:** How do you process a large list without blocking the main thread?

**Answer:** The browser's main thread handles **JS, layout, paint, and input**, so a single long synchronous loop **freezes the whole page** — no scrolling, no clicks, no rendering. Any task over **~50ms is a "long task"** that hurts **INP** and feels janky. There are three strategies depending on the work:

**1. Chunk the work and yield** — split the list into batches, process one batch, then **hand control back to the event loop** so the browser can render and respond, then continue. Yielding primitives, best to worst:
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

**2. Offload pure CPU work to a Web Worker** — if the processing is heavy computation with no DOM needs (parsing, crunching numbers, image processing), move it to a **background thread** entirely so the main thread stays free. Communicate via `postMessage` (or `Comlink` for RPC ergonomics).

**3. Virtualize rendering** — if the cost is *rendering* thousands of rows (not computing them), don't. Use **windowing/virtualization** (`react-window`, `TanStack Virtual`) so only the **visible rows are mounted** to the DOM, with spacers faking the scroll height — constant DOM size regardless of list length.

In React, **`startTransition`** (React 18) additionally marks a state update as **low-priority**, letting urgent updates (typing) interrupt an expensive re-render.

**Key points:**
- `scheduler.postTask({ priority })` (Prioritized Task Scheduling API) is the modern primitive
- Async generators pair well with chunked processing
- Long tasks (>50ms) hurt INP
- React 18's `startTransition` defers low-priority renders

---

### 56. Web Workers vs Service Workers vs Shared Workers

**Frequency:** Medium

**Question:** Compare Web Workers, Service Workers, Shared Workers, and Worklets.

**Answer:** All run JavaScript **off the main thread** and **have no DOM access**, but they serve very different purposes:

**Web Worker (Dedicated Worker)** — a background thread for **CPU-bound work** (parsing, encryption, image/data processing) so the UI stays responsive. It's **owned by one page**, communicates via **`postMessage`**, and dies with its page. This is the go-to for "my computation freezes the UI."

**Service Worker** — not a compute thread but a **programmable network proxy** sitting between the page and the network. It intercepts **`fetch`** events, enabling **offline support (caching strategies), push notifications, and background sync**. Its defining trait is a **lifecycle independent of any page** (`install → activate → fetch`) — it keeps running/waking after tabs close, which is what makes PWAs work. It **requires HTTPS** (except `localhost`) because a network-intercepting script is a serious security surface.

**Shared Worker** — a single worker instance that **multiple same-origin tabs/windows share** (connected via ports). Useful for coordinating state or a single WebSocket across tabs. Caveat: **not supported on Safari (including iOS)**, limiting its practicality — many use a Service Worker or `BroadcastChannel` instead.

**Worklets** — lightweight, highly-specialized workers for **rendering-pipeline extension points**: Paint Worklet (`paint()` in CSS), Audio Worklet (real-time audio processing), Animation Worklet, Layout Worklet. They run tiny, tightly-scoped code, not general logic.

Communication details: messages are copied via the **structured clone algorithm** by default, but you can pass **`Transferable` objects** (`ArrayBuffer`, `MessagePort`, `OffscreenCanvas`) to **transfer ownership zero-copy** — essential for moving large buffers without cloning cost. **Comlink** wraps `postMessage` in a **Promise-based RPC** so calling a worker feels like calling a local async function.

**Key points:**
- Workers communicate via structured cloning or `Transferable` objects (zero-copy)
- Service Workers require HTTPS (except localhost)
- Comlink wraps `postMessage` as RPC
- Shared Workers are not supported in Safari mobile

---

### 57. `React.memo`

**Frequency:** Medium

**Question:** What does `React.memo` do, and when does it actually help?

**Answer:** **`React.memo(Component)`** wraps a **function component** so that, when its parent re-renders, React **skips re-rendering the child if its props are shallowly equal** to the previous render. It's the component-level equivalent of `useMemo` — memoizing the *rendered output* by props.

Crucially, it only helps under specific conditions: the component must **render often** (a frequently-updating parent) *and* receive **usually-stable props**. If the parent rarely renders, or the props change every time anyway, `memo` just adds a props-comparison cost for no benefit. Memoizing indiscriminately is net-negative.

The #1 gotcha is that **inline object/function/array props defeat it**. Since `{}`, `[]`, and `() => {}` create a **new reference every render**, the shallow comparison always sees "changed" and re-renders anyway:
```jsx
<Child data={{ id }} onClick={() => go()} /> // new refs each render → memo useless
```
The fix is to **stabilize those props with `useMemo`/`useCallback`** so their identity persists across renders. This is exactly why `memo` and `useCallback` are usually deployed together — one without the other often does nothing.

You can pass a **custom comparator** as the second argument for deep equality, but it's **rarely worth it** — a deep compare on every render can cost more than the re-render it prevents.

Guidance: often it's simpler to **wrap an expensive child's *computation* in `useMemo`** than to plumb `memo` + stable props everywhere. Always **confirm the win with the React DevTools Profiler** rather than sprinkling `memo` preemptively. And note **React 19's compiler auto-memoizes** components and values, making most manual `React.memo` usage unnecessary.

**Key points:**
- Inline object/function props defeat memo — wrap with `useMemo`/`useCallback`
- React 19 compiler auto-memoizes, reducing manual `memo` usage
- Use `useMemo` for expensive children rather than memo + props plumbing
- Test with Profiler to confirm the win

---

### 58. Context — propagation cost & splitting

**Frequency:** Medium

**Question:** What is the re-render cost of React Context, and how do you mitigate it?

**Answer:** When a Context Provider's **`value` changes, *every* consumer of that context re-renders** — unconditionally, no matter how deep in the tree or whether it actually uses the part that changed. Context has **no built-in selector**: consuming the context subscribes you to the *whole* value.

This becomes a performance problem when you put **frequently-changing state** in a single, widely-consumed provider. If one big `AppContext` holds theme + user + cart + live data, then every cart tick or data update re-renders **all** consumers of theme and user too — potentially the entire app.

A second, subtler trap: **an inline `value` object re-creates a new reference every render**, so even if nothing meaningfully changed, consumers re-render:
```jsx
<Ctx.Provider value={{ user, setUser }}> // new object each render → all consumers re-render
```
Fix by **wrapping the value in `useMemo`** so its identity is stable when the underlying data hasn't changed.

The main structural mitigation is **splitting contexts by update frequency**: separate providers for `ThemeContext` (rarely changes), `UserContext` (occasionally), and `CartContext` (often). Now a cart update only re-renders cart consumers, leaving theme/user consumers untouched. The guiding principle: **treat Context as dependency injection for relatively-stable values**, not as a high-frequency state store.

When you genuinely need **fine-grained subscriptions to fast-changing global state**, reach for a dedicated store — **Zustand, Jotai, or Redux** — which support **selector-based subscriptions** so a component only re-renders when the *specific slice it selects* changes. (`use-context-selector` is a third-party library that retrofits selectors onto Context.) Note **React 19's `use(Context)`** hook can read context **conditionally** (unlike `useContext`, which can't be called after an early return), adding flexibility but not changing the propagation cost.

**Key points:**
- `useContextSelector` (third-party) enables fine-grained subscription
- Wrap provider value in `useMemo` to keep identity stable
- Context is for dependency injection, not high-frequency state
- React 19's `use(Context)` reads context conditionally

---

### 59. Refs & forwardRef

**Frequency:** Medium

**Question:** What are refs in React, and what does `forwardRef` do (and how has React 19 changed it)?

**Answer:** A **ref** is a **mutable container that persists across renders but does *not* trigger a re-render when you change it** — the opposite of state. `useRef(initial)` returns an object whose **`.current`** you read and write freely:
```js
const count = useRef(0);
count.current++; // no re-render
```
Refs have two main uses:
1. **DOM access** — attach `ref` to a JSX element and `.current` becomes the DOM node, enabling **imperative operations** the declarative model can't express: `.focus()`, `.scrollIntoView()`, measuring size/position (`getBoundingClientRect`), integrating non-React libraries (charts, maps, video players).
2. **Instance-like mutable values** — holding a timer id, the previous value of a prop, a WebSocket, or any "I need to remember this but rendering doesn't depend on it" value.

**`forwardRef`** solved a limitation: normally a parent's `ref` can't reach a **child component's** DOM node (function components don't receive `ref` as a regular prop). `forwardRef` **forwards** the parent's ref down to an element inside the child, so `<FancyInput ref={r} />` can focus the real `<input>`. **React 19 makes `ref` an ordinary prop** — you can just destructure `ref` from props directly — which **deprecates `forwardRef`** (the wrapper is no longer needed).

Best practices: **don't read/write refs during render** (it's a side effect; the DOM ref isn't even attached yet on first render) — use them in effects or event handlers. **`useImperativeHandle`** lets a component **curate a limited API** it exposes through a ref (e.g. expose only `{ focus, reset }` instead of the raw DOM node). **Callback refs** (`ref={node => ...}`) run on **mount (node) and unmount (null)**, useful for measuring or attaching on attach. Overall, refs are **escape hatches** — prefer declarative state/props and reach for refs only when the DOM genuinely requires imperative control.

**Key points:**
- Don't read refs during render (except for cached values)
- `useImperativeHandle` curates what `forwardRef` exposes
- Callback refs (`ref={node => ...}`) run on mount/unmount
- Refs are escape hatches — prefer declarative patterns

---

### 60. Error boundaries

**Frequency:** Medium

**Question:** What are React error boundaries, and what do they *not* catch?

**Answer:** An **error boundary** is a component that **catches JavaScript errors thrown by its descendants during rendering**, and shows a **fallback UI** instead of letting the whole app crash to a blank screen (React unmounts the entire tree on an uncaught render error). They must be **class components** implementing one or both of:
- **`static getDerivedStateFromError(error)`** — runs during render to set fallback state (return the new state, e.g. `{ hasError: true }`).
- **`componentDidCatch(error, info)`** — runs after, for **side effects like logging** to Sentry/Datadog with the component stack.

Crucially, error boundaries only catch errors in the **render phase, lifecycle methods, and constructors** of the tree below them. They **do NOT catch**:
- **Event handlers** — an error in an `onClick` isn't a render error; wrap it in **`try/catch`** and set error state manually.
- **Asynchronous code** — `setTimeout`, Promises, `async`/`await`, `fetch` callbacks run outside React's render; handle with `try/catch` / `.catch`.
- **Server-side rendering** errors.
- **Errors thrown in the boundary itself** (it can only catch *below* it).

The reason for these exclusions: error boundaries hook into React's *rendering* pipeline, and event handlers/async code execute outside it.

Practical usage: **wrap routes and independent features** in boundaries so one broken widget degrades gracefully instead of taking down the page. The **`react-error-boundary`** library gives an ergonomic wrapper with a `FallbackComponent`, an **`onError`** logging hook, and a **`resetErrorBoundary()`** to recover — you can also **reset by changing the boundary's `key`** (remounting it) when navigation or new data should clear the error. Note **React 19 still requires class components** for boundaries — there's no Hook equivalent yet (`react-error-boundary` just wraps a class for you).

**Key points:**
- React-error-boundary library provides a hook-friendly wrapper
- Log to Sentry/Datadog inside `componentDidCatch`
- Reset state by changing the boundary's `key` or via `resetErrorBoundary`
- React 19 still requires class boundaries — no hook equivalent yet

---

### 61. Suspense & concurrent features

**Frequency:** Medium

**Question:** What are Suspense and React's concurrent features?

**Answer:** **`Suspense`** is a boundary component that shows a **fallback** (spinner, skeleton) while a descendant is **"suspending"** — the mechanism being that a component **throws a Promise** to signal "I'm not ready; re-render me when this resolves." React catches it, renders the nearest `<Suspense fallback={...}>`, and retries when the Promise settles. Two main uses:
- **Lazy code loading** — `const X = lazy(() => import('./X'))` suspends until the chunk downloads.
- **Data fetching** — Suspense-enabled data layers (React Query, Relay, RSC, the `use()` hook) suspend until data arrives, letting you write components as if data were synchronous and declare loading UI **declaratively** at a boundary rather than threading `isLoading` everywhere.

You can **nest boundaries** for **granular loading states** — an outer skeleton for the page, inner ones per widget, so fast parts show immediately while slow parts spin.

**Concurrent features** (React 18) let React **interrupt and prioritize rendering** so the UI stays responsive under load:
- **`startTransition` / `useTransition`** — mark a state update as **low-priority ("transition")**, so urgent updates (typing in a filter box) can **interrupt** the expensive re-render (the filtered list). `useTransition` returns **`[isPending, startTransition]`** so you can show a subtle pending indicator.
- **`useDeferredValue`** — render with a **lagging copy** of a fast-changing value, letting the input stay snappy while the expensive derived UI catches up.

These build on the same foundation as **Server Components and streaming SSR**: the server **flushes HTML in chunks as data resolves**, sending Suspense fallbacks first and streaming in the real content as each boundary's data becomes ready — dramatically improving perceived load. The old "throw a Promise" convention is now **formalized via the `use()` hook**, which unwraps a Promise (or context) and integrates cleanly with Suspense.

**Key points:**
- `lazy(() => import(...))` integrates with Suspense
- `useTransition` returns `[isPending, startTransition]`
- Boundaries can be nested for granular loading states
- Throwing Promises from arbitrary hooks is now formalized via `use()`

---

### 62. Server Components vs client components

**Frequency:** Medium

**Question:** How do React Server Components differ from client components?

**Answer:** **React Server Components (RSC)** render **only on the server** and their code is **never shipped to the browser** — the client receives their *output*, not their JavaScript. **Client components** (marked with the **`'use client'`** directive) are the traditional interactive components that ship JS and hydrate in the browser.

Because RSC run on the server, they can **directly access server resources** — query a database, read the filesystem, use secrets/API keys — with **no API layer** and no risk of leaking credentials to the client:
```jsx
// Server Component — runs on server, zero client JS
async function ProductList() {
  const products = await db.query('SELECT ...'); // direct DB access
  return products.map(p => <Product key={p.id} {...p} />);
}
```
They render to a **serialized format** (the RSC payload) that the client uses to construct the tree, **hydrating client components as interactive "islands"** around the static server-rendered parts.

The tradeoffs: RSC **shrink the client bundle** (heavy deps like markdown parsers, date libraries stay on the server) and **centralize data fetching** (fetch right where you render, no prop-drilling or effect waterfalls). The cost is that **interactivity is confined to client islands** — you compose server components for structure/data and drop into `'use client'` where you need interaction.

The constraints follow from "there's no browser and no re-render":
- Server Components **can't use state, effects, or event handlers** (`useState`, `useEffect`, `onClick`) or **browser APIs** (`window`, `localStorage`) — those only exist client-side.
- **Props passed from a server component to a client component must be serializable** (no functions, class instances, Dates cross the boundary as-is) — because they're serialized in the RSC payload.
- **Mutations** are handled by **Server Actions** (`'use server'` async functions callable from the client, e.g. from a form), giving type-safe server mutations without hand-writing API routes.

Primary adopters are **Next.js (App Router)** and emerging support in other frameworks.

**Key points:**
- Server Components can't use state, effects, or browser APIs
- Props passed from server to client must be serializable
- Server Actions handle mutations
- Next.js App Router and Remix v3 are primary adopters

---

### 63. State mgmt: Redux vs Zustand vs Jotai vs Context

**Frequency:** Medium

**Question:** How do Redux, Zustand, Jotai, and Context compare, and when do you choose each?

**Answer:** They sit on a spectrum from **heavyweight/structured** to **minimal/atomic**, and the first real question is whether you even need global *client* state.

**Redux (via Redux Toolkit)** — a single centralized store with a **strict unidirectional flow** (action → reducer → new state). Verbose but **predictable and debuggable at scale**: excellent **DevTools with time-travel**, a rich **middleware** ecosystem (sagas, thunks, logging), and enforced conventions that keep large teams consistent. RTK cut most of the old boilerplate. Choose it for **large apps** that benefit from strict structure, middleware, and auditability.

**Zustand** — a **tiny hook-based store**. You create a store and read it via a hook with a **selector** (`useStore(s => s.count)`), so components only re-render when their selected slice changes. **Minimal boilerplate**, no providers required, no actions/reducers ceremony. Great default for most apps that need shared client state without Redux's overhead.

**Jotai** — **atomic** state: state is composed of small **atoms** that you read/write individually, and **derived atoms** compute from others with **fine-grained reactivity** (only components using a given atom re-render). Feels like `useState` that lives outside the tree; excellent for **granular, interdependent** state that would be awkward as one big object.

**Context** — **not really a state manager** but **dependency injection**. Best for **rarely-changing** values (theme, current user, locale). As covered earlier, it re-renders *all* consumers on change and has no selectors, so it's a poor fit for high-frequency state.

The most important cross-cutting rule: **separate *server* state from *client* state.** Data fetched from an API (caching, revalidation, loading/error, dedup) belongs in **React Query / SWR / RTK Query**, *not* Redux/Zustand hand-rolled — conflating them is the most common architecture mistake. Also **avoid global state for component-local concerns** (keep it in `useState`), and note **Zustand/Jotai are designed to work cleanly with React 18 concurrent rendering** (via `useSyncExternalStore`).

**Key points:**
- Server state (React Query, SWR) is separate from client state
- Avoid global state for component-local concerns
- Zustand/Jotai work great with React 18 concurrent rendering
- Redux Toolkit Query covers data fetching too

---

### 64. Routing: client- vs server-side

**Frequency:** Medium

**Question:** How do client-side and server-side routing differ, and how do frameworks blend them?

**Answer:** **Server-side routing** is the traditional model: each URL request returns a **full HTML document** from the server. It's **simple, SEO-friendly** (every URL is a complete crawlable page), and **works with zero JavaScript**. The downside is that every navigation is a **full page reload** — a white flash, re-download of shared shell/CSS/JS, and lost client state.

**Client-side routing** (SPA) **intercepts navigation** in the browser: clicking a link doesn't hit the server for a new document — JS **prevents the default**, fetches just the needed **data (JSON)**, and **swaps the view in place**. This gives **fast, app-like transitions** and preserves state, but **requires JavaScript**, adds complexity (you must manage scroll restoration, focus, titles, loading states), and needs care for SEO (the initial HTML may be empty).

Modern frameworks use **hybrid / isomorphic routing** to get both: the **server renders (SSR/SSG) the initial page** so first paint and SEO are strong and it works without JS, then the client **hydrates and takes over** subsequent navigations as a SPA — fast transitions after the first load. Next.js, Remix, SvelteKit, and Nuxt all work this way.

Supporting details:
- The **History API** (**`pushState`/`replaceState`** + the `popstate` event) is what lets client routers change the URL and handle back/forward **without a reload**.
- For **progressive enhancement**, keep real **`<a href>`** links so navigation still works if JS fails or hasn't loaded — the router enhances them rather than replacing them with `onClick` divs.
- **Code-split by route** (`lazy(() => import())`) so each route's JS loads on demand, keeping the **initial bundle small**.
- The **View Transitions API** enables smooth animated crossfades/morphs between client routes declaratively.

**Key points:**
- History API (`pushState`/`replaceState`) powers client routing
- `<a>` should still work without JS (progressive enhancement)
- Code-split routes for smaller initial bundles
- View Transitions API enables smooth client-route animations

---

### 65. Container/presentational vs hooks-driven

**Frequency:** Medium

**Question:** How does the container/presentational pattern compare with a hooks-driven architecture?

**Answer:** Both are ways to **separate "how a component gets its data" from "how it looks"** — they just do it with different tools.

The classic **container/presentational split** (Dan Abramov's 2015 pattern) used **two components**: a **container** that handled data fetching, state, and logic (often a class connected to Redux), and a **presentational** component that received everything via **props** and only rendered UI. This was valuable **before hooks** because there was no clean way to reuse stateful logic — so you isolated it in containers and kept the view dumb and testable.

The **hooks-driven** approach makes the container mostly unnecessary. A **custom hook** (`useUser()`, `useCart()`) **encapsulates the data/logic** and a component calls it directly, **co-locating data needs with the component** that uses them. This **eliminates prop-drilling** (a deep component fetches what it needs itself instead of receiving it through five layers) and makes logic reusable across unrelated components. So: **custom hooks are the modern "container"** — and they're independently **unit-testable** (test the hook with `renderHook`, separate from any UI).

**Server Components** push this further still — the data layer **disappears from client code** entirely: an async server component `await`s its data inline, and no fetching logic ships to the browser at all.

What remains useful from the old pattern: **presentational ("dumb") components stay valuable for design systems** — a `<Button>`/`<Card>` that takes only props, has no data dependencies, and is trivial to test and showcase in Storybook. Related composition patterns like **compound components** (`<Tabs><Tab/></Tabs>` sharing implicit state via context) express relationships more cleanly than prop-heavy configuration. The overarching caution: **avoid premature abstraction** — extract a custom hook or shared component when a pattern *actually* repeats, not speculatively.

**Key points:**
- Custom hooks are the modern "container" — testable in isolation
- Presentational components remain valuable for design systems
- Compound components pattern groups related UI (Tabs/Tab)
- Avoid premature abstraction — extract when patterns emerge

---

### 66. Tree shaking — what blocks it

**Frequency:** Medium

**Question:** What is tree shaking, and what blocks it?

**Answer:** **Tree shaking** is **dead-code elimination for bundles** — the bundler statically analyzes your import/export graph and **drops exports that are never used**, so importing one function from a library doesn't ship the whole thing. "Shaking the tree" so the dead leaves fall.

It has three requirements:
1. **ESM (`import`/`export`)** — because ES module bindings are **static** (analyzable without running the code), the bundler can *prove* what's used. CommonJS `require` is dynamic and can't be reliably analyzed.
2. **Side-effect-free modules** — the bundler must know that removing an unused export won't skip an important side effect. Declare this with **`"sideEffects": false`** in `package.json` (or list the files that *do* have side effects, like CSS imports).
3. **Pure top-level code** — no meaningful work happening merely by importing a module.

The common **blockers**:
- **CommonJS modules / dynamic `require`** — not statically analyzable, so nothing gets shaken.
- **Top-level side effects** — code that runs on import (registering a global, mutating a prototype, `console.log`) forces the bundler to keep the module.
- **Barrel files** (`index.js` re-exporting everything) — re-exporting a whole namespace can defeat elimination and pull in far more than you use; they also hurt build performance.
- **Transpiling ESM to CJS too early** — e.g. Babel/TS configured to emit CommonJS *before* the bundler sees it destroys the static structure. Keep modules as ESM and let the bundler handle output.

Practical guidance: use **named imports** (`import { debounce } from 'lodash-es'`), **not `import * as`** (which can retain everything) and **not default-importing the whole library**. This is exactly why **`lodash-es` tree-shakes but CommonJS `lodash` does not** — same functions, but only the ESM build is analyzable. **`/*#__PURE__*/`** annotations tell the minifier a function *call* has no side effects so its result can be dropped if unused. Always **verify with a bundle analyzer** (`webpack-bundle-analyzer`, `rollup-plugin-visualizer`) rather than assuming shaking worked.

**Key points:**
- `/*#__PURE__*/` annotations mark calls as side-effect-free
- Lodash-es tree-shakes; lodash (CJS) does not
- Avoid `import * as` — name imports
- Verify with bundle analyzer

---

### 67. CDN & edge caching

**Frequency:** Medium

**Question:** How do CDN and edge caching work, and what strategies matter?

**Answer:** A **CDN (Content Delivery Network)** is a globally-distributed network of **PoPs (Points of Presence)** that **cache your content close to users**. Instead of every request traveling to your single origin server, a user in Tokyo is served from a nearby PoP — **cutting latency** (fewer network hops, shorter RTT) and **offloading the origin** (cached hits never touch it). Ideal for static assets (JS/CSS/images/fonts).

Modern CDNs (**Cloudflare, Fastly, Vercel, CloudFront**) go beyond static caching to run **edge functions/workers** — your code executes *at the PoP*, enabling **edge SSR and personalization** with very low **TTFB** because rendering happens near the user rather than in one distant region.

Key concepts and strategies:
- **Cache key** — what identifies a cached object. It's primarily the **URL**, but can include **headers/cookies/query params**, controlled via the **`Vary`** header (e.g. `Vary: Accept-Encoding` caches gzip and brotli separately). Careless inclusion of cookies in the key **shreds hit rates** (every user gets a unique key).
- **Purge/invalidation** — removing stale content. **Purge-by-tag** (surrogate keys) enables **fine-grained invalidation**: tag related objects and purge them all at once (e.g. purge everything tagged `product-123` when it changes) instead of by exact URL.
- **Origin shield** — a designated intermediate cache layer that all PoPs consult before the origin, so a cache miss in many regions results in **one** origin fetch, not dozens — reducing origin load and cache-miss cost.
- **Tiered caching** — hierarchical PoP layers that improve hit ratios.
- **Signed URLs** — time-limited, tamper-proof links for access-controlled assets.

A historical note: **HTTP/2 Server Push is largely abandoned** (removed from Chrome) because it often wasted bandwidth pushing already-cached resources — the modern replacement is **`103 Early Hints`** and **`<link rel=preload>`** to hint critical resources without the guesswork.

**Key points:**
- Cache key includes URL, sometimes headers/cookies — control via `Vary`
- Purge by tag for fine-grained invalidation
- HTTP/2 push is largely abandoned; use early hints / preload
- Origin shield reduces cache misses to the origin

---

### 68. Cookies: SameSite/Secure/HttpOnly

**Frequency:** Medium

**Question:** What do the cookie security attributes `HttpOnly`, `Secure`, `SameSite`, and `Partitioned` do?

**Answer:** Cookie attributes harden cookies against theft and cross-site abuse:

**`HttpOnly`** — makes the cookie **invisible to JavaScript** (`document.cookie` can't read it). This is the primary **XSS mitigation** for session cookies: even if an attacker injects script, they **can't exfiltrate the token**. The cost is JS can't read it either — which is fine for auth cookies the browser sends automatically.

**`Secure`** — the cookie is **only sent over HTTPS**, preventing interception on plaintext connections.

**`SameSite`** — controls whether the cookie is sent on **cross-site** requests, the core **CSRF** defense:
- **`Strict`** — never sent on any cross-site request, *including* top-level navigations. Maximum safety, but following a link from another site to your app won't include the cookie (user appears logged out until they navigate internally).
- **`Lax`** (the modern **default**) — sent on **top-level navigation GETs** (clicking a link to your site) but **not** on cross-site subrequests or unsafe methods (POST from another origin). A good balance for most auth cookies.
- **`None`** — sent on all cross-site requests, but **must** be paired with **`Secure`**. Required for legitimate third-party contexts (embedded widgets, SSO iframes).

**`Partitioned` (CHIPS)** — opts a cross-site cookie into **partitioned storage keyed by the top-level site**, so an embedded widget gets a *separate* cookie jar per embedding site rather than one shared cross-site identifier. This is the path forward for legitimate embeds as **third-party cookies are phased out**.

Guidance: auth tokens should be **`HttpOnly; Secure; SameSite=Lax`**; an **embedded cross-site widget** needs **`SameSite=None; Secure; Partitioned`**. Mind the **~4KB size limit** (and that cookies ride on *every* request to the domain — header bloat). Use the **`__Host-` prefix** for the strictest guarantee: the browser only accepts such a cookie if it's `Secure`, has no `Domain` (host-only), and `Path=/` — preventing subdomain injection.

**Key points:**
- Auth tokens should be `HttpOnly; Secure; SameSite=Lax`
- Embedded widgets need `SameSite=None; Secure; Partitioned`
- Cookie size limit ~4KB; consider header bloat
- Use `__Host-` prefix for strictest security guarantees

---

### 69. Frontend auth: JWT in localStorage vs httpOnly cookie

**Frequency:** Medium

**Question:** Should a JWT live in `localStorage` or an `httpOnly` cookie? Compare the tradeoffs.

**Answer:** The two options trade **XSS exposure against CSRF exposure**:

**`localStorage`** — **readable by any JavaScript** on the page. Convenient (easy to attach as an `Authorization: Bearer` header, works cleanly for pure-API SPAs and cross-origin backends), but it means **any XSS vulnerability = instant token theft**. A single injected script does `localStorage.getItem('token')` and the attacker has the user's credentials. Same problem with **`sessionStorage`** — also JS-accessible, so no safer.

**`httpOnly` cookie** — **invisible to JavaScript**, so XSS **cannot read the token**. The browser sends it automatically. The tradeoff is exposure to **CSRF** (the browser attaches it to cross-site requests too), which you mitigate with **`SameSite=Lax/Strict`** plus **CSRF tokens** for state-changing requests. Combined with `Secure`, this is the **recommended default for browser-based auth** — XSS (arbitrary code execution) is generally the scarier, harder-to-fully-prevent threat, and `httpOnly` neutralizes token theft from it, while CSRF has well-understood, robust mitigations.

So: **prefer `httpOnly; Secure; SameSite` cookies** for browser auth. `localStorage` is **acceptable only** for short-lived tokens in a pure-API SPA with a strong CSP and no cross-site cookie needs — and you accept the XSS risk.

Beyond storage, harden the whole flow:
- **Refresh-token rotation** — issue **short-lived access tokens** + a rotating refresh token; each refresh invalidates the prior one, so a stolen token has a small window and reuse is detectable. This limits **blast radius**.
- **BFF (Backend-for-Frontend)** — the strongest pattern: keep **tokens entirely off the client**. The browser holds only an opaque `httpOnly` **session cookie**; a lightweight backend stores the real tokens and proxies API calls, attaching them server-side. Nothing sensitive is ever reachable by client JS.
- **OAuth with PKCE** — required for **public clients** (SPAs/mobile) to secure the authorization-code exchange against interception.

**Key points:**
- Refresh-token rotation reduces blast radius
- Avoid storing tokens in `sessionStorage` either (still JS-accessible)
- BFF (Backend-for-Frontend) pattern keeps tokens off the client entirely
- OAuth PKCE is required for public clients

---

### 70. WebSocket vs SSE vs long-polling

**Frequency:** Medium

**Question:** Compare WebSocket, Server-Sent Events (SSE), and long-polling.

**Answer:** Three ways to push server data to the client, differing in **directionality, transport, and complexity**:

**WebSocket** — a **full-duplex, bidirectional** connection over a single long-lived TCP socket (upgraded from HTTP). Both sides send messages anytime with **very low latency** and support for **binary** frames. Ideal for **chat, multiplayer games, and collaborative editing** — anything needing fast two-way traffic. Costs: it's a **separate protocol** (`ws://`/`wss://`) requiring **server support** and its own infra (load balancers, sticky sessions), no built-in reconnect, and it needs **heartbeats/pings** to survive proxy/idle timeouts that would otherwise silently drop the connection.

**SSE (Server-Sent Events)** — **one-way, server→client** streaming over a **plain HTTP** connection (`EventSource`). Much **simpler**: it's just HTTP, so it **works through most proxies/firewalls**, and the browser gives you **automatic reconnection** (with `Last-Event-ID` resume) for free. Limits: **text-only** (UTF-8; binary must be encoded), and under **HTTP/1.1 a strict ~6-connection-per-origin cap** (HTTP/2 multiplexing lifts this). Perfect for **notifications, live feeds/dashboards, and streaming LLM/AI token output** — exactly the one-directional push cases where a full WebSocket is overkill.

**Long-polling** — the **fallback** that emulates push without either: the client makes a request the server **holds open until it has data** (or a timeout), responds, and the client immediately reconnects. Works **everywhere** (just HTTP) but has **higher latency and overhead** (constant reconnection, header churn). Use only when WebSocket/SSE aren't available.

Decision guide: **bidirectional/low-latency → WebSocket**; **one-way server push → SSE** (simpler, auto-reconnect, proxy-friendly); **legacy fallback → long-polling**. The emerging successor is **WebTransport (over HTTP/3/QUIC)**, offering low-latency bidirectional streams and datagrams without WebSocket's head-of-line-blocking limitations.

**Key points:**
- SSE works great for notifications, live feeds, AI streaming
- WebSocket needs heartbeats to survive idle timeouts
- WebTransport (HTTP/3) is the emerging successor for low-latency bidirectional
- Server-Sent Events have per-origin connection limits in HTTP/1.1

---

### 71. Image optimization checklist

**Frequency:** Medium

**Question:** Walk through an image optimization checklist for the web.

**Answer:** Images are usually the **heaviest bytes on a page**, so optimizing them is the highest-leverage performance work. A practical checklist:

**1. Right format** — serve **AVIF** (smallest) or **WebP** with a JPEG/PNG **fallback**; use **SVG for icons/logos/illustrations** (vector, tiny, crisp at any size).

**2. Right dimensions per device** — use **`<picture>` / `srcset` + `sizes`** so the browser downloads an appropriately-sized variant instead of a desktop-sized image on a phone. Pair with a **CDN that resizes on the fly** (`?w=400`) so you don't hand-generate every size.
```html
<img src="p-800.jpg" srcset="p-400.jpg 400w, p-800.jpg 800w, p-1600.jpg 1600w"
     sizes="(max-width:600px) 100vw, 50vw" width="800" height="600"
     loading="lazy" decoding="async" alt="...">
```

**3. Reserve space to prevent CLS** — **always set `width`/`height`** (or the CSS **`aspect-ratio`**) so the browser lays out the slot before the image loads, avoiding layout shift.

**4. Prioritize correctly:**
- **Lazy-load below-the-fold** images with **`loading="lazy"`** so offscreen images don't compete for bandwidth.
- **Never lazy-load the LCP image** — that delays your most important paint. Instead mark it **`fetchpriority="high"`** (and optionally `preload` it) to fetch it ASAP.
- **`decoding="async"`** decodes off the main thread so it doesn't block rendering.

**5. Shrink the bytes** — **compress aggressively** (tune quality; most photos look fine at 70–80%), and **strip metadata** (EXIF/GPS/color-profile cruft) that bloats files.

**6. Perceived performance** — show a **LQIP (Low-Quality Image Placeholder)** or **BlurHash** — a tiny blurred preview that renders instantly and swaps to the full image on load, so users perceive faster loading even when bytes are still arriving.

**Key points:**
- LCP image should NOT be lazy
- `decoding="async"` avoids blocking the main thread
- Use `aspect-ratio` CSS to avoid CLS
- Blurhash/LQIP placeholders improve perceived performance

---

### 72. Font loading (`font-display: swap`, preconnect, subsetting)

**Frequency:** Medium

**Question:** How do you optimize web font loading?

**Answer:** Web fonts are **render-blocking-ish** — mishandled, they either hide text or shift the layout. The goal is fast, shift-free text.

**Avoid invisible text with `font-display`.** By default, browsers **FOIT** (Flash Of Invisible Text) — hiding text for up to 3s while the font loads. **`font-display: swap`** instead renders a **fallback font immediately**, then **swaps** to the web font when ready (**FOUT** — Flash Of *Unstyled* Text). Text is always visible, which is almost always the right tradeoff. For strict CLS budgets, **`font-display: optional`** uses the web font only if it loads almost instantly, otherwise sticks with the fallback — **no swap, no shift**.

**Cut the latency to the font:**
- **`preconnect`** to the font origin (`<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`) warms up DNS/TLS early, saving a round trip.
- **`preload`** critical fonts (`<link rel="preload" as="font" type="font/woff2" crossorigin>`) so the browser fetches them before it discovers them in CSS. Note **`crossorigin` is required** even for same-origin fonts (fonts are always fetched in CORS mode).
- **Self-hosting** removes a third-party origin entirely (one fewer connection, better privacy, full cache control).

**Cut the bytes:**
- **Subsetting** strips unused glyphs — a Latin-only subset can be a fraction of a full multi-script font.
- **WOFF2** is the **only format you need** in modern browsers (best compression); don't ship legacy `.ttf`/`.eot`/`.woff`.
- **Variable fonts** pack many weights/styles into **one file** with a continuous axis, replacing separate regular/bold/italic downloads.

**Minimize the swap shift:** the **`size-adjust`** (plus `ascent-override`/`descent-override`) descriptor on an `@font-face` **fallback** tunes the fallback's metrics to match the web font, so when the swap happens the text barely moves — near-zero CLS.

**Key points:**
- Variable fonts replace multiple weight files
- WOFF2 is the only modern format you need
- `size-adjust` CSS minimizes layout shift between fallback and web font
- Preload critical fonts: `<link rel="preload" as="font" crossorigin>`

---

### 73. Bundlers: Webpack vs Vite vs esbuild vs Rollup

**Frequency:** Medium

**Question:** How do Webpack, Vite, esbuild, and Rollup compare as bundlers?

**Answer:** They differ mainly in **dev-server speed, output quality, and target use case**:

**Webpack** — the **mature, ubiquitous workhorse** with the richest plugin/loader ecosystem; it can bundle literally anything. The tradeoff is **speed**: it bundles the whole app even in dev, so large projects have slow cold starts and HMR. Still dominant in **enterprise/legacy** codebases.

**Vite** — the **modern default for new apps**. In **dev**, it serves source over **native ESM with no bundling** — the browser requests modules on demand, so startup is near-instant and **HMR stays fast regardless of app size**. For **production** it bundles with **Rollup** (proven tree-shaking, optimized output). Excellent DX; it's what most new React/Vue/Svelte projects use.

**esbuild** — a **Go-based** bundler/transpiler that's **extremely fast** (10–100× typical JS tooling) by leveraging parallelism and native code. Vite uses it internally for **transforms** (TS/JSX → JS, dependency pre-bundling). Its own bundler is fast but its **plugin API is limited** compared to Rollup, so it's often a building block rather than the whole toolchain.

**Rollup** — the **library bundler** of choice: cleanest **ESM output**, best-in-class **tree-shaking**, and precise control over output formats (ESM/CJS/UMD). Ideal when you're shipping a *package* rather than an app. **Library authors typically pick Rollup or tsup** (an esbuild-based wrapper).

The emerging generation is **Rust-based**: **Rspack** (Webpack-API-compatible, drop-in but much faster) and **Turbopack** (Vercel's successor to Webpack, used in Next.js) — both chasing esbuild/Vite speed while keeping Webpack's flexibility. Rule of thumb: **Vite for apps, Rollup/tsup for libraries, Webpack when you're already on it or need its ecosystem.**

**Key points:**
- Vite is the default for new frontend apps
- Webpack still dominant for enterprise/legacy
- esbuild's plugin API is limited compared to Rollup
- Library authors typically pick Rollup or tsup (esbuild-based)

---

### 74. Testing pyramid

**Frequency:** Medium

**Question:** What is the testing pyramid, and how does the "testing trophy" revise it?

**Answer:** The **testing pyramid** prescribes the *proportion* of test types by speed and cost:
- **Base — many unit tests**: fast (milliseconds), isolated, test a single function/module. Cheap to write and run, pinpoint failures precisely.
- **Middle — fewer integration tests**: verify that multiple units work together (a component + its hooks + a mocked API).
- **Top — few E2E tests**: slow, run the whole app in a real browser, test complete user journeys. High confidence but brittle and expensive, so you keep them few.

The shape encodes a principle: **push most testing down to the fast, cheap layers** and reserve slow E2E for the few flows that truly matter.

The modern **"testing trophy"** (Kent C. Dodds) **shifts weight toward integration tests**, arguing they hit the **best ROI** — they catch **real bugs** (components actually rendering and wiring together) **without the brittleness** of E2E or the triviality of over-mocked unit tests. With **React Testing Library**, you test components the way a user experiences them (query by role/text, click, assert visible output) rather than testing internals. E2E (Playwright/Cypress) is then reserved for **critical journeys only** — login, checkout, signup.

The cross-cutting rule both models share: **don't test implementation details** (internal state, private methods, exact call counts) — those tests break on every refactor even when behavior is unchanged. **Test observable behavior.** Also: aim for **millisecond feedback** at the unit layer; use **contract tests (Pact)** to replace some cross-service integration tests (verify each side honors the shared API contract independently); and treat **code coverage as a sanity check, not a target** — 100% coverage of trivial getters proves nothing, and gaming the number encourages bad tests.

**Key points:**
- Avoid testing implementation details
- Aim for fast feedback — unit tests in milliseconds
- Contract tests (Pact) replace some integration tests across services
- Coverage is a sanity check, not a target

---

### 75. Jest vs Vitest vs Playwright vs Cypress

**Frequency:** Medium

**Question:** Compare Jest, Vitest, Playwright, and Cypress.

**Answer:** Two are **unit/integration runners**, two are **end-to-end frameworks**:

**Jest** — the long-standing **unit/integration test runner** for React/Node. Batteries-included (assertions, mocking, snapshots, coverage), huge ecosystem, and the de facto standard for years. Its weak spot is **ESM and speed**: it grew up in the CommonJS era and needs transform config (Babel/ts-jest) that adds friction and slowness in modern ESM/Vite projects.

**Vitest** — the **Vite-native** alternative with a **Jest-compatible API** (near drop-in: `describe`/`it`/`expect`, same matchers). It's **faster**, **ESM-first**, and **reuses your Vite config/transform pipeline**, so there's no separate build setup. It's the **new default for Vite/SvelteKit/Astro/Nuxt** projects.

**Playwright** — a **multi-browser E2E framework** driving **Chromium, Firefox, and WebKit** with one API. Strengths: excellent **auto-waiting** (fewer flaky tests), strong **parallelization**, and rich debugging via **traces** (a recorded timeline with DOM snapshots). It's **gaining ground over Cypress** largely because of true cross-browser (including WebKit/Safari) support.

**Cypress** — a **developer-friendly E2E runner** famous for its interactive **time-travel debugging** UI (step through commands, see the app state at each). It runs **inside the browser** alongside your app, which enables that DX but historically limited it to **one browser per run** and made some cross-origin/tab scenarios awkward.

Overlaps and tooling: **both Playwright and Cypress also do component testing** (render a component in a real browser), blurring the unit/E2E line. And **MSW (Mock Service Worker)** is the modern way to **mock APIs at the network layer** in *both* unit tests and E2E — intercepting `fetch`/XHR so you mock realistic responses without stubbing your own code. Typical modern stack: **Vitest + React Testing Library** for units/integration, **Playwright** for E2E, **MSW** for API mocking across both.

**Key points:**
- Vitest is the new default for Vite/SvelteKit/Astro projects
- Playwright is gaining ground over Cypress for cross-browser
- Both Playwright and Cypress support component testing too
- Use MSW for API mocking in both unit and E2E

---

### 76. A11y testing (axe-core, lighthouse, screen readers)

**Frequency:** Medium

**Question:** How do you test accessibility — automated and manual?

**Answer:** Accessibility testing needs **both automated and manual** layers because tools alone are far from sufficient.

**Automated** tools — **axe-core** (via `jest-axe` in unit tests, or the `@axe-core/playwright` integration in E2E) and **Lighthouse** — catch only roughly **30–50% of issues**: the *machine-detectable* ones like **missing form labels/alt text, insufficient color contrast, invalid ARIA, and duplicate ids**. They're great for **CI regression guards** (fail the build on new violations) and cheap to run, but they **cannot judge experience** — whether focus order makes sense, whether an ARIA widget is *actually* operable, or whether an announcement is meaningful.

**Manual** testing fills the other half:
- **Keyboard-only navigation** — unplug the mouse and verify everything is reachable, operable, and has a visible focus indicator, with a logical tab order and working focus traps in modals.
- **Screen readers** — test with **real AT**: **NVDA** (Windows/Firefox), **JAWS** (Windows), **VoiceOver** (macOS/iOS). Emulation isn't enough — actual screen readers behave differently, and this is the only way to catch confusing or missing announcements.
- **Zoom to 200%** (and reflow at 320px) to ensure content doesn't clip or overlap.
- **`prefers-reduced-motion`** to confirm non-essential animation is disabled.

Process integration: run **axe in CI** to prevent regressions, add the **Storybook `addon-a11y`** so axe runs **per story** during component development (catching issues at authoring time), and treat the **Lighthouse a11y score as a starting point, not a finish line** — a perfect score still needs manual verification. When possible, **include users with disabilities** in testing — the highest-signal feedback there is.

**Key points:**
- Storybook addon-a11y runs axe per story
- Lighthouse a11y score is a starting point, not a finish line
- Test with real assistive tech, not just emulation
- Include users with disabilities in testing when possible

---

### 77. PWA: SW lifecycle, offline strategy, install prompt

**Frequency:** Medium

**Question:** How do you build a PWA — Service Worker lifecycle, offline strategies, and install prompt?

**Answer:** A **Progressive Web App** uses a **Service Worker** (the network-proxy worker) plus a **manifest** to deliver offline support and installability.

**Service Worker lifecycle** — three phases:
1. **`install`** — fires once when the SW is first registered/updated; here you **pre-cache the app shell** (HTML/CSS/JS/offline page) so the app can boot offline.
2. **`activate`** — fires when the new SW takes control; here you **clean up old caches** from previous versions.
3. **`fetch`** — fires on **every network request** the page makes; you intercept it and decide how to respond (cache, network, or a mix).

**Offline/caching strategies** (chosen per resource type):
- **Cache-first** — serve from cache, fall back to network. Best for **static, versioned assets** (hashed JS/CSS, fonts) that rarely change — instant and offline-capable.
- **Network-first** — try the network, fall back to cache. Best for **API data** you want fresh, with cached data as an offline fallback.
- **Stale-while-revalidate** — serve cached immediately *and* fetch an update in the background for next time. Best **UX/freshness balance** for things like avatars or content that can be slightly stale.

**Install prompt** — the browser fires **`beforeinstallprompt`**; you **`preventDefault()`** to stop the default mini-infobar, stash the event, and **call `.prompt()` at a user-chosen moment** (e.g. after they click your "Install" button) for a non-intrusive install experience.

Supporting facts: an app is **installable** when it has a **valid manifest** (name, icons, `start_url`, `display`), is served over **HTTPS**, registers a **Service Worker**, and works offline. The **update flow** matters — when a new SW installs, it waits; prompt the user to **reload** to activate it (or `skipWaiting` carefully). **Background Sync** queues failed mutations (a message sent while offline) and **retries when connectivity returns**. **Workbox** abstracts all of this (routing, caching strategies, precaching) so you rarely hand-write SW logic. Finally, **iOS/Safari PWA support is limited and quirky** (storage eviction, no push until recently, no `beforeinstallprompt`) — **test on real devices**.

**Key points:**
- Manifest + HTTPS + SW + offline page = installable PWA
- Update flow: prompt user to reload when a new SW activates
- Background Sync queues failed mutations for retry
- iOS has limited PWA support; test on real devices

---

### 78. Critical CSS & FOUC

**Frequency:** Low

**Question:** What is critical CSS, and what causes FOUC?

**Answer:** **Critical CSS** is the **minimal subset of styles needed to render the above-the-fold content** — what's visible without scrolling. Because **CSS is render-blocking** (the browser won't paint until it has the CSSOM), a large external stylesheet delays first paint. **Inlining the critical CSS directly in the `<head>`** removes that round-trip for the initial view, so the page paints immediately — improving **FCP and LCP** — while the full stylesheet loads afterward.

**FOUC (Flash Of Unstyled Content)** is the opposite failure: the **HTML renders before its CSS arrives**, so the user briefly sees unstyled (or wrongly-styled) content that then "snaps" into place. It's commonly caused by loading CSS **asynchronously/late**, injecting styles via JS after paint, or font swaps. The fix is to ensure critical styles are present **before** first paint (inlined), while safely deferring the rest.

The standard pattern: **inline critical CSS**, then load the full stylesheet **non-blocking** via the `media` trick:
```html
<style>/* inlined critical CSS */</style>
<link rel="stylesheet" href="full.css" media="print" onload="this.media='all'">
```
The `media="print"` makes the browser fetch it **without blocking render** (it's "not for screen"), then `onload` flips it to `all` to apply it. Tools like **Critters/Beasties** (and **Next.js**) **extract and inline critical CSS automatically** at build time, so you don't hand-maintain it.

Related guidance: **`preload`** key fonts/CSS with `<link rel="preload">` to fetch them early; prefer **FOUT over FOIT** for fonts (visible fallback text beats invisible text); and **avoid `@import` inside CSS** — it **serializes downloads** (the browser must fetch and parse the parent stylesheet before it even discovers the import), adding round-trips. Use `<link>` tags or a bundler instead.

**Key points:**
- Inline critical CSS, then load full stylesheet with `media="print" onload="this.media='all'"`
- Preload key fonts/CSS with `<link rel="preload">`
- FOUT (text) is usually preferred over FOIT (invisible text)
- Avoid `@import` in CSS — it serializes downloads

---

### 79. Garbage collection (mark-and-sweep)

**Frequency:** Low

**Question:** How does JavaScript garbage collection work, and how do you avoid leaks?

**Answer:** JS engines reclaim memory automatically using **mark-and-sweep**: starting from **roots** (global object, the current call stack, active closures), the collector **marks** every object **reachable** by following references, then **sweeps** (frees) everything unmarked. The core definition of a "live" object is thus **reachability** — not whether you'll actually use it again.

Modern engines (V8) are **generational**, exploiting the "most objects die young" observation by splitting the heap:
- **Young generation** — collected frequently by the fast **Scavenger** (copying collector). Most short-lived objects die here cheaply.
- **Old generation** — objects that survive several young-gen collections get **promoted** here, collected less often by **Mark-Compact** (which also **compacts** to reduce fragmentation).

You **can't force GC** from JS (there's no reliable API), so avoiding **memory leaks** — objects that stay *reachable* but are logically dead — is the developer's job:
- **Detach event listeners** you added (`removeEventListener`) — a listener keeps its target and closure alive.
- **Clear timers/intervals** (`clearInterval`) — a live interval retains its callback's scope forever.
- **Null out or bound long-lived caches** — an ever-growing `Map` cache is a classic leak; use an LRU or **`WeakMap`** (whose keys don't prevent collection).
- Beware **closures retaining their entire scope chain** — a closure that captures a large object keeps it alive as long as the closure lives.

Why mark-and-sweep and not **reference counting** (old IE): reference counting **can't collect cycles** — two objects referencing each other keep each other's count above zero even when nothing else references them, leaking forever. Reachability-based GC handles cycles naturally.

Debugging: the **DevTools Memory profiler** (heap snapshots) finds leaks — e.g. **detached DOM nodes** still referenced by JS (removed from the page but held by a variable). **`FinalizationRegistry`** can run a cleanup callback *after* an object is collected, but its timing is non-deterministic — use sparingly, never for critical logic.

**Key points:**
- Reference counting (old IE) failed on cycles
- DevTools Memory profiler finds detached DOM nodes
- Closures retain their entire scope chain
- `FinalizationRegistry` runs cleanup when objects are GC'd (use sparingly)

---

### 80. Symbols; `Symbol.iterator`

**Frequency:** Low

**Question:** What are Symbols in JavaScript, and what is `Symbol.iterator`?

**Answer:** A **Symbol** is a **unique, immutable primitive** — every `Symbol('desc')` call returns a brand-new value that is **never equal to any other**, even one with the same description (the string is just a debug label). This uniqueness makes them ideal as **non-colliding property keys**: a library can add a symbol-keyed property to an object with **zero risk** of clashing with the user's own keys or another library's.

Their second, bigger role is as **well-known protocol hooks** — built-in symbols the language itself looks for to customize object behavior:
- **`Symbol.iterator`** — define this method and your object becomes **iterable**, working with `for...of`, spread `[...obj]`, and destructuring. It must return an iterator (an object with a `next()` returning `{ value, done }`):
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
- **`Symbol.asyncIterator`** — the async equivalent, powering `for await...of`.
- **`Symbol.toPrimitive`** — customize how an object is **coerced** to a number/string.

**`Symbol.for(key)`** is different from `Symbol()` — it looks up (or creates) a symbol in a **global registry** shared across the whole realm, so `Symbol.for('x') === Symbol.for('x')`. Use it when you need the *same* symbol from different modules/realms.

Key behaviors that follow from being symbols: they're **hidden from ordinary enumeration** — they don't show up in `for...in` or `Object.keys()` (only `Object.getOwnPropertySymbols()`/`Reflect.ownKeys()` reveal them), and **`JSON.stringify` skips them entirely**. That makes them perfect for **library extension points / metadata** you don't want leaking into serialization or iteration. TypeScript supports **`unique symbol`** typing so a specific symbol constant can serve as a distinct type-level key.

**Key points:**
- Symbol-keyed properties don't appear in `for...in` or `Object.keys`
- `JSON.stringify` skips symbol keys
- TypeScript supports unique-symbol typing
- Use for library extension points to avoid name clashes

---

### 81. Proxies & Reflect

**Frequency:** Low

**Question:** What are `Proxy` and `Reflect`, and how do they power reactivity?

**Answer:** A **`Proxy`** wraps a **target object** and intercepts fundamental operations on it via **traps** — handler functions named after the operation: `get` (property read), `set` (write), `has` (`in` operator), `deleteProperty`, `apply` (function call), `construct` (`new`), and more. Whenever code touches the proxy, the corresponding trap runs instead of the default behavior, letting you observe, validate, transform, or block the operation transparently — the consumer can't tell it's not a plain object.

This is exactly what **modern reactivity** is built on. **Vue 3** wraps your state in a Proxy: the **`get` trap tracks** which effect is reading which property (dependency collection), and the **`set` trap triggers** re-runs of the effects that depend on it. **MobX** and various validation/observation libraries work the same way. Compared to the old `Object.defineProperty` approach (Vue 2), proxies can intercept **property additions/deletions and array index changes** without special-casing.

**`Reflect`** is the companion: a namespace of **static methods that mirror every proxy trap** (`Reflect.get`, `Reflect.set`, `Reflect.has`, `Reflect.deleteProperty`, `Reflect.apply`…). Inside a trap you call the matching `Reflect` method to **forward the operation to the target with correct default semantics** — crucially preserving the correct `receiver` so getters/setters up the prototype chain bind `this` properly:
```js
const p = new Proxy(target, {
  get(t, key, receiver) {
    track(t, key);
    return Reflect.get(t, key, receiver); // correct default behavior
  }
});
```

Caveats: proxies **can't intercept internal slots** — things like a `Map`'s backing data, a `Date`'s timestamp, or a private `#field` live in internal slots the traps never see, so proxying those built-ins breaks unless you special-case. There's **non-trivial per-operation overhead**, so avoid proxies in hot paths. **`Proxy.revocable`** creates a proxy you can later **disable** (all traps throw afterward) — useful for handing out revocable capabilities. Overall, proxies are the **foundation of modern fine-grained reactivity**.

**Key points:**
- Proxies can't intercept internal slots (Map's data, Date's timestamp)
- Performance overhead is non-trivial; avoid in hot paths
- Can be revocable via `Proxy.revocable`
- Foundation of modern reactivity systems

---

### 82. TS: declaration merging

**Frequency:** Low

**Question:** What is declaration merging in TypeScript, and when do you use module augmentation?

**Answer:** **Declaration merging** is TypeScript combining **multiple declarations with the same name** into a single definition. The most common case: two `interface Foo` declarations in scope merge their members into one interface — additive by design. `namespace`s also merge (with each other, and with classes/functions/enums of the same name to attach static members).

The practical superpower is **module augmentation** — using `declare module 'foo'` to **reach into a third-party package's types and add to them** without forking it:
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

**`declare global { }`** does the same for the **global scope** — e.g. adding a property to `Window`, or typing a theme: `styled-components` exposes an **empty `DefaultTheme` interface** *specifically so you can merge your theme shape into it* and get typed `props.theme` everywhere.

Key constraints: **only `interface` and `namespace` merge** — two `type` aliases with the same name are a **duplicate-identifier error** (types are meant to be closed). So library authors expose extension points as `interface`s precisely to enable this. Caveat: augmentation is **global/ambient** — merging types across unrelated modules is confusing and surprising to readers, so keep augmentations narrow and well-documented.

**Key points:**
- Only `interface` and `namespace` merge; `type` aliases conflict
- Global augmentation via `declare global { }`
- Useful for theme typing (`styled-components`'s `DefaultTheme`)
- Avoid merging across unrelated modules — confusing to readers

---

### 83. TS: `as const` & literal types

**Frequency:** Low

**Question:** What does `as const` do, and why is it useful?

**Answer:** **`as const`** is a **const assertion** that tells TypeScript to infer the **narrowest, most literal, deeply-`readonly`** type for a value instead of its usual **widened** type. Without it, `const x = 'home'` in an object property widens to `string` and arrays become mutable `string[]`; with it, everything is frozen to exact literals.

Concretely it does three things:
- **Literals stay literal**: `'foo'` is typed `'foo'`, not `string`; `42` is `42`, not `number`.
- **Arrays become `readonly` tuples**: `['/home', '/about'] as const` is `readonly ['/home', '/about']`, not `string[]`.
- **Object properties become `readonly`** and their values literal, recursively (nested shapes are locked too).

Why it matters: it lets you **derive types from values** so you write data once and get the types for free. The canonical pattern is turning an array into a **string-literal union**:
```ts
const ROUTES = ['/home', '/about', '/contact'] as const;
type Route = typeof ROUTES[number]; // '/home' | '/about' | '/contact'
```
Now `ROUTES` is your single source of truth for both the runtime list *and* the type. This is essential for **Redux action creators** (so `type` is a literal that discriminates), **route/config definitions**, enum-like objects, and anything feeding inference.

It pairs beautifully with **`satisfies`** (TS 4.9+): `satisfies` **validates** the value against a type **without widening** it, so you get both the check *and* the narrow literal inference — `const cfg = {…} as const satisfies Config`. Bottom line: reach for `as const` whenever you want a value's *exact shape* to flow into the type system rather than being generalized away.

**Key points:**
- Pairs with `satisfies` to validate without widening
- Enables string-literal unions from arrays
- Prevents `'foo'` widening to `string`
- Works on object literals to lock down nested shapes

---

### 84. Error subclassing, `cause`, async stack traces

**Frequency:** Low

**Question:** How do you model errors well — subclassing, `cause`, and async stack traces?

**Answer:** Good error handling in modern JS/TS rests on a few practices:

**Subclass `Error`** for domain-specific types so callers can branch on them with `instanceof`. Critically, **set `this.name`** in the constructor — otherwise the class name is lost after minification and the message prefix stays `Error`:
```ts
class NotFoundError extends Error {
  constructor(public id: string) {
    super(`Missing ${id}`);
    this.name = 'NotFoundError';
  }
}
```
This lets middleware map a `NotFoundError` → HTTP 404 cleanly instead of string-matching messages.

**Preserve the chain with `cause`** (ES2022): `new Error('Failed to load user', { cause: originalError })`. When you catch a low-level error and rethrow a higher-level one, `cause` **keeps the original attached** so the root cause isn't lost. This is the standard **wrap-and-rethrow** pattern — add context at each layer without discarding what actually broke; loggers and `console` print the full chain.

**Async stack traces**: modern V8 **stitches stacks across `await` boundaries**, so an error thrown deep in an async call chain shows the logical `await` path, not just the microtask that happened to run it — dramatically better debugging than the old "async trampoline" noise.

**Always throw `Error` objects, never strings/objects**: `throw 'oops'` gives you **no stack trace**, and `catch` receives a bare string. `Error` instances carry `.stack`, `.message`, `.cause`, and work with `instanceof`.

Supporting details: in Node, **`Error.captureStackTrace(this, MyError)`** in a custom error factory trims the constructor frames from the trace. **Never swallow errors** with an empty `catch {}` — at minimum log or rethrow. And in TS (4.4+ default `useUnknownInCatchVariables`), the **`catch` variable is typed `unknown`**, forcing you to narrow (`if (e instanceof Error)`) before using it — which prevents unsafe assumptions about what was thrown.

**Key points:**
- Use `Error.captureStackTrace` in custom error factories (Node)
- `cause` is the standard wrap-and-rethrow pattern
- Avoid swallowing errors with empty `catch`
- Type errors as `unknown` in `catch` clauses (TS 4.4+ default)

---

### 85. Hydration mismatches

**Frequency:** Low

**Question:** What causes React hydration mismatches, and how do you fix them?

**Answer:** **Hydration** is the process where React takes **server-rendered HTML** and **attaches event listeners / reconstructs its internal tree** on the client, making the static markup interactive — *without* re-creating the DOM. It assumes the **client's first render produces exactly the same output as the server did**. A **mismatch** happens when it doesn't, and React finds DOM that disagrees with what it expected.

Common causes are anything **non-deterministic or environment-dependent** in render:
- **Random values** — `Math.random()`, `Date.now()`, or randomly-generated IDs produce different output on server vs client.
- **Locale/timezone formatting** — the server formats a date/number in one locale/timezone, the browser in another. A *very* frequent culprit.
- **Browser-only conditionals** — reading `window`, `localStorage`, `matchMedia`, or user-agent during render, which exist only on the client.

**React 18** handles a mismatch by **discarding the server HTML for that subtree and client-rendering it fresh** (recovering visually), while emitting a **dev warning**. That recovery isn't free — it costs a re-render and can cause a flash — so mismatches should be fixed, not ignored.

Fixes:
- **`useId()`** — generates IDs that are **stable and identical across server and client**, solving the random-ID case (essential for `aria-*`/label associations).
- **`suppressHydrationWarning`** — for a *known, unavoidable* divergence (e.g. a timestamp), set this on the element to silence the warning for that node only.
- **Defer browser-only content** — render the server-safe version first, then update in **`useEffect`** (which runs only on the client, after hydration), or read external/browser state via **`useSyncExternalStore`** with a proper server snapshot. This guarantees the first client render matches the server.

Notes: **React 19** improves the diagnostics (clearer mismatch messages, less silent corruption). And **streaming SSR** can *mask* mismatches by hydrating progressively — so test with **JS disabled** and watch the console to catch them early.

**Key points:**
- `Date.now()`/`Math.random()` in render cause mismatches
- Locale/timezone differences are frequent culprits
- React 19 improves error messages and reduces silent corruption
- Streaming SSR can mask issues — test with JS disabled

---

### 86. Angular change detection (Zone.js, OnPush, signals)

**Frequency:** Low

**Question:** How does Angular change detection work — Zone.js, OnPush, and signals?

**Answer:** Angular's job is to know **when** to re-check a component's template bindings. Its story has three eras:

**Zone.js (classic default)** — Angular ships **Zone.js**, which **monkey-patches all async APIs** (`setTimeout`, `addEventListener`, `Promise.then`, XHR/`fetch`). After any async task finishes, Zone notifies Angular, which runs **change detection over the entire component tree** (top-down), re-evaluating bindings to update the DOM. It's automatic and "just works," but checking *everything* on *every* async event is wasteful in large apps.

**`OnPush` strategy** — setting `changeDetection: ChangeDetectionStrategy.OnPush` tells Angular to **skip a component's subtree unless** one of: (1) an **`@Input` reference changes** (new object identity — hence favor immutable updates), (2) an **event fires from within** the component, or (3) an **`async` pipe** in its template emits. This prunes huge portions of the CD tree and **dramatically improves performance** in large apps — the standard optimization.

**Signals (Angular 17+)** — `signal()`, `computed()`, and `effect()` are **fine-grained reactive primitives**. Reading a signal in a template registers a precise dependency, so a change updates **only the exact bindings that use it**, bypassing tree-walking CD entirely. Signals **don't need Zone.js**, which is why Angular v18+ offers **`provideExperimentalZonelessChangeDetection`** — dropping Zone.js shrinks the bundle and removes the monkey-patch overhead.

Additional facts: signals **replace many `BehaviorSubject`/manual-CD patterns** with simpler, synchronous reactive state; `computed()` memoizes derived values; and a component **detached** via `ChangeDetectorRef.detach()` runs CD **only** when you explicitly call `detectChanges()` — an escape hatch for extreme performance tuning (e.g. high-frequency data grids).

**Key points:**
- OnPush dramatically improves performance in large apps
- Signals (`signal()`, `computed()`, `effect()`) replace many `BehaviorSubject` patterns
- `provideExperimentalZonelessChangeDetection` in v18
- Detached components run CD only via `ChangeDetectorRef.detectChanges()`

---

### 87. Angular DI hierarchy

**Frequency:** Low

**Question:** How does Angular's dependency-injection hierarchy resolve providers?

**Answer:** Angular DI resolves a dependency by **walking up two injector trees**. When a component requests a token, Angular searches the **element injector tree** — starting at that component's own injector and climbing through its DOM ancestors — and if not found there, continues into the **environment/module injector tree** (root and any lazy-loaded scopes). The **first** provider found wins, so a provider declared lower down **shadows** one higher up.

This hierarchy gives you **scoping control**:
- **`providedIn: 'root'`** on an `@Injectable` registers a **tree-shakeable application singleton** — one instance shared everywhere, and if never injected it's **dropped from the bundle** (unlike eager `NgModule.providers`).
- **Component-level `providers: […]`** creates a **new instance per component instance**, scoped to that component and its children — perfect for **state scoped to a feature** (e.g. a wizard-local service each wizard instance gets its own of).
- **`inject()`** (v14+) is the modern functional way to obtain a dependency — usable in field initializers, factory functions, guards, and `computed`s — replacing constructor injection in many contexts and enabling composable helper functions.

Provider configuration options control *how* the value is produced: **`useClass`** (instantiate a class, possibly a substitute), **`useValue`** (a constant/config object), **`useFactory`** (compute it, with `deps`), and **`useExisting`** (alias one token to another). **`multi: true`** makes several providers for the same token **collect into an array** rather than override — the mechanism behind `HTTP_INTERCEPTORS`, validators, etc.

Finally, **resolution modifiers** on the injection site tune the search: **`@Optional`** (return `null` instead of throwing if absent), **`@Self`** (only this injector), **`@SkipSelf`** (start at the parent), and **`@Host`** (stop at the host element). **Standalone components** participate with their own injector hierarchy just like `NgModule`-based ones.

**Key points:**
- `useClass`/`useFactory`/`useValue`/`useExisting` configure providers
- Multi-providers (`multi: true`) collect arrays of values
- Standalone components have their own injector hierarchy
- `@Optional`, `@Self`, `@SkipSelf`, `@Host` control resolution

---

### 88. RxJS: switchMap vs mergeMap vs concatMap vs exhaustMap

**Frequency:** Low

**Question:** In RxJS, how do `switchMap`, `mergeMap`, `concatMap`, and `exhaustMap` differ?

**Answer:** All four are **higher-order mapping operators**: for each value from a source Observable they create an **inner Observable** (typically an HTTP request) and **flatten** its emissions into the output. They differ purely in **how they handle a new source value while a previous inner Observable is still active** — the concurrency policy:

**`switchMap` — cancel the previous.** When a new value arrives, it **unsubscribes from the in-flight inner** and switches to the new one. Only the latest matters. Perfect for **type-ahead search**: as the user keeps typing, stale requests are cancelled so a slow earlier response can't overwrite a newer one. This makes it the **right default for HTTP triggered by user input**.

**`mergeMap` — run all in parallel.** Every source value spins up an inner Observable and they **all run concurrently**, emitting as they resolve (order not guaranteed). Great for **independent operations** (e.g. fire N logging calls). Danger: it can **swamp the server** with unbounded concurrency — cap it with the concurrency argument `mergeMap(fn, n)`.

**`concatMap` — queue sequentially.** It waits for each inner Observable to **complete before starting the next**, **preserving order**. Use when order/serialization matters (e.g. sequential writes that must not interleave). Cost: **latency** — everything runs one-at-a-time.

**`exhaustMap` — ignore new while busy.** While an inner Observable is in-flight, **new source values are dropped** until it completes. Perfect for a **submit button / login**: rapid double-clicks are ignored, **preventing double-submission**, until the current request finishes.

Mnemonic: **switch** = latest wins (cancel old), **merge** = all at once, **concat** = one after another in order, **exhaust** = first wins (ignore the rest).

**Key points:**
- `switchMap` is the right default for HTTP triggered by user input
- `mergeMap` can swamp the server — limit concurrency with `mergeMap(fn, n)`
- `concatMap` preserves order at the cost of latency
- `exhaustMap` prevents double-submission

---

### 89. Angular standalone vs NgModules

**Frequency:** Low

**Question:** How do Angular standalone components compare to NgModules?

**Answer:** **Standalone components** (stable in v14+, the **default in v17+**) let a component **declare its own dependencies directly** via `standalone: true` and an `imports: […]` array — pulling in the other components, directives, and pipes it uses, plus its own providers. They **no longer need to be declared in an `NgModule`**, eliminating the historical boilerplate where every component had to be registered in some module's `declarations`.

The benefits are a **simpler mental model** (a component is self-contained — what it needs is right there), **better tree-shaking** (the compiler sees exactly what each component imports, so unused code is dropped more reliably than with broad `NgModule` imports), and **faster builds**. **NgModules still work** — they remain for grouping related declarations and interoperating with older/library code — but they're no longer the required unit of composition. Guidance: **new apps should be 100% standalone**, and libraries are actively migrating.

The standalone world replaces module machinery with **functional configuration**:
- **`bootstrapApplication(AppComponent, { providers: […] })`** replaces the old `NgModule`-based `platformBrowserDynamic().bootstrapModule(AppModule)` — the app boots from a single root component.
- **Route-level lazy loading** uses **`loadComponent: () => import('./page').then(m => m.Page)`** to lazy-load a *component* directly (no lazy module needed); `loadChildren` can point at a routes array.
- Features are wired up with **`provide*` functions** — `provideRouter(routes)`, `provideHttpClient()`, `provideAnimations()` — passed to `bootstrapApplication`, replacing `RouterModule.forRoot()`, `HttpClientModule`, etc.
- Existing apps can adopt it incrementally via the **migration schematic** `ng generate @angular/core:standalone`, which converts declarations automatically.

**Key points:**
- `bootstrapApplication(AppComponent, { providers: [...] })` replaces `NgModule` bootstrap
- Route-level lazy loading: `loadComponent: () => import(...)`
- `provideRouter`, `provideHttpClient` configure features functionally
- Migration schematic: `ng generate @angular/core:standalone`

---

### 90. Vue composition vs options API

**Frequency:** Low

**Question:** Options API vs Composition API in Vue — when do you use each?

**Answer:** They're two ways to author the *same* Vue 3 component; the difference is **how you organize logic**.

The **Options API** structures a component as an object of **named options** — `data`, `methods`, `computed`, `watch`, and lifecycle hooks (`mounted`, etc.). Vue collects each concern into its bucket. It's **easy to learn** and very approachable for small components, but it has a scaling problem: the logic for **one feature gets scattered** across multiple options — a search feature's state lives in `data`, its handler in `methods`, its derived value in `computed`, its cleanup in `unmounted`. In a large component you scroll back and forth to follow a single feature.

The **Composition API** (`setup()`, or the ergonomic **`<script setup>`**) instead lets you **group code by logical concern**. All of a feature's reactive state, computeds, watchers, and lifecycle logic sit **together**, and you can **extract it into a composable** — a reusable `useSomething()` function — to share across components. This is far better for **TypeScript** (plain variables and functions infer cleanly, unlike `this`-based options) and for **large components**. Composables **replace mixins**, avoiding mixins' name-collision and unclear-source problems since everything is explicit imports and returns.

Both ship in Vue 3 and the **Options API has no planned deprecation** — pick per team/complexity — but the **Composition API is recommended for new code**, especially anything non-trivial or TS-heavy. Under the hood both use the same **reactivity primitives**: **`ref`** (reactive wrapper for primitives, accessed via `.value`), **`reactive`** (for objects), **`computed`** (cached derived state), and **`watch`** (side effects on change). `<script setup>` is the recommended syntax — it's more concise (top-level bindings are auto-exposed to the template) and better-optimized at compile time.

**Key points:**
- `<script setup>` is the ergonomic syntax
- Composables (`useFoo`) replace mixins
- Options API still works, no deprecation planned
- Reactivity primitives (`ref`, `reactive`, `computed`, `watch`) are the building blocks

---

### 91. Vue Proxy reactivity

**Frequency:** Low

**Question:** How does Vue 3's Proxy-based reactivity work, and why does destructuring break it?

**Answer:** Vue 3 makes state reactive by wrapping objects in a **`Proxy`** (replacing Vue 2's `Object.defineProperty`). During a component's render, every property the template *reads* is **tracked** (the `get` trap records "this render depends on this property"); when a tracked property is later *written* (the `set` trap fires), Vue **re-runs the renders that depend on it**. This dependency-tracking + trigger cycle is the whole engine.

Two entry points wrap different things:
- **`reactive(obj)`** returns a Proxy of an **object** — access properties normally (`state.count`).
- **`ref(value)`** wraps a **primitive** (or object) in an object with a **`.value`** property; you read/write `count.value`. The `.value` indirection is necessary because a raw primitive can't be proxied — there's no object to intercept. (In templates, refs are auto-unwrapped so you write `count`.)

**`computed`** creates a **cached** derived value: it re-evaluates **only when its reactive dependencies change**, otherwise returning the memoized result — cheap to read repeatedly.

**Why destructuring loses reactivity**: reactivity lives in the **Proxy wrapper**, not the values inside. `const { count } = reactive({ count: 0 })` **copies the primitive out** of the proxy — `count` is now a detached plain number with no connection to the trap, so changing it (or changing the source) triggers nothing. The fix is **`toRefs`/`toRef`**, which convert each property into a **`ref` that stays linked** to the original reactive object: `const { count } = toRefs(state)` gives you a real ref you can destructure and pass around while preserving reactivity.

More facts: Vue 2's `Object.defineProperty` **couldn't detect newly-added properties or array-index/length changes** (hence the old `Vue.set` workaround) — the Proxy approach in v3 **handles adds/deletes natively**. For performance with large/deep structures, **`shallowRef`/`shallowReactive`** track only the top level (skip deep conversion), and **`readonly`** produces an immutable proxy view (writes warn and are ignored) for safely sharing state you don't want mutated.

**Key points:**
- `toRefs`/`toRef` preserve reactivity when destructuring
- Vue 2 used `Object.defineProperty`, which missed new properties — fixed in v3
- `shallowRef`/`shallowReactive` for performance with large objects
- `readonly` creates immutable views

---

### 92. Form libs (react-hook-form vs Formik)

**Frequency:** Low

**Question:** react-hook-form vs Formik — which do you pick and why?

**Answer:** The core difference is **controlled vs uncontrolled inputs**, which drives their performance profiles.

**Formik** uses **controlled inputs** — every keystroke updates React state, which **re-renders the form** (and often the whole form tree) on each character. That's a **simple, familiar mental model** and perfectly fine for **small forms**, but it doesn't scale: large forms with many fields get noticeably janky because typing in one field re-renders everything.

**react-hook-form (RHF)** uses **uncontrolled inputs with refs** — it registers each input and reads values from the DOM via refs rather than mirroring them in React state, so **typing doesn't re-render** the component. This gives **excellent performance** (isolated field updates), a **smaller bundle**, and it subscribes components only to the specific fields/errors they use. It integrates cleanly with **schema validation** and is the **modern default for complex forms** — multi-step wizards, dynamic/repeating fields, and async validation.

Supporting ecosystem points:
- **Schema validation** via **Zod / Yup / Valibot** using a resolver — define the shape once, get both runtime validation and (with Zod) inferred TypeScript types for the form values.
- **`useFieldArray`** handles **dynamic lists** (add/remove rows) efficiently without re-rendering unaffected rows.
- Even with client libraries, **server-rendered forms should keep progressive enhancement** — native `<form>` submission and server-side validation so the form works before/without JS.
- **TanStack Form** is an emerging **framework-agnostic** alternative (React/Vue/Solid/Svelte) with strong type-safety, worth watching.

Bottom line: **RHF for anything non-trivial** (performance + validation + dynamic fields); Formik only if you're maintaining an existing codebase already on it.

**Key points:**
- Zod/Yup/Valibot for schema validation
- `useFieldArray` for dynamic lists
- Server-rendered forms still benefit from progressive enhancement
- TanStack Form is an emerging framework-agnostic alternative

---

### 93. Micro-frontends: module federation vs iframes vs single-spa

**Frequency:** Low

**Question:** Compare micro-frontend approaches: Module Federation, iframes, and single-spa.

**Answer:** All three let **independently-built/deployed apps** compose into one page; they trade off **isolation vs integration quality vs team autonomy**.

**Module Federation** (Webpack 5, Rspack, Vite plugins) lets separately-built apps **share modules at runtime** — a "host" dynamically loads "remote" bundles and they **share dependencies** (one copy of React) and compose as **native components**, with no iframe boundary. This gives the **best UX and integration** (shared routing, shared state, one DOM) and true team autonomy (each team builds/deploys its remote independently). The cost is **careful version alignment of shared deps** — mismatched React versions across remotes cause subtle runtime breakage — so you must manage the shared-singleton config deliberately. **Angular's Native Federation** is a framework-flavored take on the same idea.

**iframes** give the **strongest isolation** — a fully separate JS context and CSS sandbox per app, so one team truly can't break another's styles or globals. But the **UX is poor**: cross-frame **auth/cookie sharing**, **navigation/deep-linking**, **height auto-sizing**, and communication (postMessage) are all awkward. Best reserved for **legacy or untrusted third-party** integrations where hard isolation is the actual requirement.

**single-spa** is an **orchestrator**: it registers multiple apps — potentially in **different frameworks** (React + Angular + Vue on one page) — and manages their **lifecycle** (bootstrap/mount/unmount) via a contract, mounting/unmounting them as routes change. Great when you must **incrementally migrate** between frameworks or run a mixed-framework estate.

Frame the decision as **team autonomy vs UX coherence**: more independence generally costs integration polish and adds operational complexity. And the honest caveat — **micro-frontends are a big tax**; for many teams a **monorepo with a single deploy** delivers most of the autonomy (separate folders/ownership, shared tooling) **without** the runtime-integration and versioning pain. Reach for MFEs only when independent deploy cadence across teams is a hard requirement.

**Key points:**
- Federation requires careful version alignment of shared deps
- iframes work for legacy/third-party integration
- Native Federation (Angular) is an Angular-flavored take
- Monorepo single-deploy often beats MFE complexity

---

### 94. CSP rollout

**Frequency:** Low

**Question:** How do you roll out a Content Security Policy safely?

**Answer:** A **CSP** is an HTTP header that **allowlists the sources** the browser may load each resource type from — `script-src`, `style-src`, `img-src`, `connect-src`, etc. — so injected/inline scripts from an XSS are **blocked from executing**. It's a strong second line of defense, but a strict policy will **break legitimate resources** if you deploy it blindly, so you roll it out in stages.

**Stage 1 — report-only.** Ship **`Content-Security-Policy-Report-Only`** first. This **enforces nothing** but **logs every violation** (via a `report-uri`/`report-to` endpoint that receives JSON describing the blocked resource). You collect real-world violations from production traffic, discover every legitimate source you forgot, and tune the policy **without breaking users**.

**Stage 2 — tighten, then enforce.** Once report-only is clean, switch to the enforcing `Content-Security-Policy` header and iteratively remove the dangerous escape hatches:
- Drop **`'unsafe-inline'`** for scripts — instead allow specific inline scripts via a **per-request nonce** (`script-src 'nonce-<random>'` with a matching `nonce` attribute, regenerated every response) or a **hash** of the script content.
- Drop **`'unsafe-eval'`** — forbids `eval`/`new Function` (some older libs need refactoring).
- Add **`'strict-dynamic'`** so a trusted (nonced) script can load its own further scripts without you allowlisting every CDN — the **SPA-friendly** modern approach that avoids brittle host lists.

The hard part is inline scripts: they need that **per-request nonce** wired through your server-side rendering so each response's header and inline `<script nonce>` match.

Related directives worth setting: **`frame-ancestors`** controls who may frame your page — it **replaces the older `X-Frame-Options`** for clickjacking protection and is more flexible. **`upgrade-insecure-requests`** automatically **rewrites `http://` subresource URLs to `https://`**, easing HTTPS migration without hunting down every mixed-content reference.

**Key points:**
- Inline scripts need a nonce per request
- Report endpoint receives violation JSON
- `frame-ancestors` replaces `X-Frame-Options`
- `upgrade-insecure-requests` rewrites HTTP to HTTPS

---

### 95. Source maps in production

**Frequency:** Low

**Question:** How should you handle source maps in production?

**Answer:** A **source map** (`.map` file) records how **minified/bundled code maps back to your original source** — file, line, and column. Without it, a production error's stack trace points at `main.a1b2.js:1:48213`, which is useless; **with** it, your error tracker (Sentry, Datadog, Bugsnag) and browser devtools show the **real file/function/line**. So you almost always want to **generate** source maps in production builds — the question is who gets to *see* them.

The security concern: publicly-served source maps effectively **publish your original, unminified source** (and sometimes comments/logic you'd rather not expose). The best practice is **generate them but don't expose them publicly**:
- **Upload maps to your error-tracking service** during CI/deploy (Sentry CLI, Datadog) so symbolication happens server-side, then either **don't deploy the `.map` files to the web server at all**, or serve them **behind auth / IP allowlist** (e.g. office VPN only).
- Use Webpack's **`hidden-source-map`**: it **produces the maps but omits the `//# sourceMappingURL=` comment**, so browsers (and the public) **won't auto-fetch** them, while your uploaded copy still lets the error tracker symbolicate. Alternatively `sourceMappingURL` can point at a **private host** that only your tooling can reach.

Operational details: **keep maps versioned with each deploy** — a map only symbolicates the exact build it came from, so store them per release/commit. And know the devtool tradeoff: **`eval-source-map` is dev-only** (fast rebuilds, inlined via `eval`, not suitable/safe for prod), whereas **production uses external `.map` files** (`source-map` or `hidden-source-map`) for accurate, separable maps.

**Key points:**
- Without source maps, stack traces are unreadable
- `sourceMappingURL` can point to a private host
- Keep maps versioned with deploys
- `eval-source-map` is dev-only; production uses external `.map` files

---

### 96. Monorepo (Nx, Turborepo) vs polyrepo

**Frequency:** Low

**Question:** Monorepo (Nx, Turborepo) vs polyrepo — how do you choose?

**Answer:** A **monorepo** keeps **many packages/apps in one repository**; a **polyrepo** gives each its **own repository**. The tradeoff is **cross-package ergonomics vs isolation**.

**Monorepo** advantages: **atomic cross-package changes** (one commit/PR updates a shared library *and* every consumer, so you never have a broken intermediate state or version-bump dance), **simplified refactoring** (find-and-replace across the whole codebase, types checked end-to-end), and **shared tooling/config** (one ESLint/TS/CI setup). The cost is scale — naive setups rebuild/test everything on every change.

That's what the tools solve:
- **Nx** — a full build system: a **project graph** (understands package dependencies), **task orchestration** (only build/test what a change actually affects — "affected" commands), **code generators/scaffolding**, and enforced module boundaries. Best for **large, structured** monorepos.
- **Turborepo** — lighter, focused on **fast pipelines**: **task caching** and **parallelism** across packages, minimal config. Great when you mainly want speed without Nx's full framework.
- **pnpm workspaces** — the **lightweight starting point** (dependency hoisting + linking) you can layer Turborepo/Nx on top of later.

The **killer feature** of both Nx and Turborepo is **remote caching** (**Nx Cloud**, **Turborepo Remote Cache**): build/test outputs are cached and **shared across CI runs and teammates**, so if someone already built a package with the same inputs, everyone else **restores the result instantly** instead of rebuilding. This is what keeps large monorepo CI fast.

**Polyrepo** advantages: **strict isolation** and **independent deploy cadence/versioning** per team — but cross-cutting changes now span many repos and version bumps, which is painful. To scale a monorepo, use **CODEOWNERS** and **per-package/affected CI**; at very large scale (Google/Meta), teams reach for **Bazel/Pants**. And **polyrepo + Changesets** is the natural fit for **OSS package families** published independently to npm. Rule of thumb: **monorepo for one product/org with tightly-coupled packages; polyrepo when independence outweighs coordination cost.**

**Key points:**
- Remote caching (Nx Cloud, Turborepo Remote Cache) is the killer feature
- Use code owners and per-package CI to scale
- Bazel/Pants for very large scale (Google/Meta style)
- Polyrepo plus changesets works for OSS package families

---

### 97. Mocking (MSW, fetch-mock, DI)

**Frequency:** Low

**Question:** Compare mocking approaches: MSW, fetch-mock, and dependency injection.

**Answer:** They intercept at **different layers**, which determines how realistic and how coupled your tests are.

**MSW (Mock Service Worker)** intercepts at the **network layer**: in the browser it registers a **Service Worker** that catches outgoing requests; in Node it installs a **request interceptor**. Your app code makes **completely real `fetch`/XHR calls** — nothing in the app is stubbed — and MSW responds with mock data based on **request handlers** you define. This is the modern favorite because you test the app **exactly as it runs in production** (real request code paths), and the **same handlers work in dev, tests, and Storybook**. Its power is realism and reuse.

**fetch-mock** patches the **`fetch` function directly** — replacing the global with a stub that returns canned responses. It's **simpler to set up** for small cases, but it **couples your tests to the transport**: if you switch from `fetch` to Axios or a GraphQL client, the mocks break even though behavior didn't change. You're mocking the *mechanism* rather than the *network*.

**Dependency injection** replaces a real implementation at a **seam** in your architecture — pass a fake `UserService`/repository into the code under test. It's the **most testable and explicit** (no global patching, clear contracts) and doesn't care about transport at all, but it **requires the code to be designed for it** (interfaces, injected dependencies) — you can't retrofit it onto code that news-up its own dependencies.

Best practices that apply across all three: **use the same handler set for unit and E2E** (MSW makes this easy) to **reduce drift** between test layers; **don't mock what you don't own** — wrap a third-party SDK in your own adapter and mock *that* (so a library API change surfaces in one place, not scattered mocks); and **snapshot/verify the contract, not the mock** — assert on the real request/response shape you depend on rather than re-asserting your own stub. Typical modern choice: **MSW** as the default, **DI** for pure logic seams, **fetch-mock** only for quick throwaway cases.

**Key points:**
- MSW works the same in dev, tests, and Storybook
- Same handler set for unit and E2E reduces drift
- Avoid mocking what you don't own — wrap then mock
- Snapshot-test the contract, not the mock

---

### 98. Visual regression (Percy/Chromatic)

**Frequency:** Low

**Question:** How does visual regression testing work, and how do you keep it stable?

**Answer:** Visual regression testing **renders components or pages, captures a screenshot, and diffs it pixel-by-pixel against an approved baseline** image. If pixels differ, it flags the change for review — catching **unintended visual breakage** (a CSS change that shifts an unrelated layout, a broken font, a misaligned button) that functional tests, which only check behavior, would miss entirely.

The main tools:
- **Chromatic** — built by the Storybook team; it **snapshots each Storybook story**, giving automatic **per-component** visual coverage and a cloud reviewer UI.
- **Percy** — **framework-agnostic**, integrates with many E2E runners; snapshots full pages/flows.
- **Playwright** — has **built-in screenshot diffing** (`toHaveScreenshot`) for a self-hosted option with no external service.

The central challenge is **flake** — false diffs from **non-deterministic rendering**: web **fonts** loading at different times, **animations/transitions** caught mid-frame, **dates/timestamps**, random data, and even anti-aliasing differences across OSes. You stabilize by **stubbing/freezing** these: disable animations (`prefers-reduced-motion`/CSS override), **freeze time** and **seed random**, wait for fonts to load, and mask dynamic regions. Deterministic input is what makes the diff meaningful.

Practical guidance: **pair it with Storybook** so each component's states are captured in isolation (fast, focused baselines). Remember **cross-browser snapshots multiply the baseline count** (Chrome + Firefox + WebKit + mobile = 4× the images to store and review), so scope which browsers you snapshot. And a **reviewer UI with human approval is essential** — tools can only say "these pixels changed," not whether the change is *intended*; a person must approve each diff to promote it to the new baseline. Treat visual tests as an **approval workflow**, not a pass/fail gate.

**Key points:**
- Pair with Storybook for per-component coverage
- Cross-browser snapshots multiply baseline count
- Reviewer UI is essential — diffs need human approval
- Use deterministic test data (frozen time, seeded random)

---

### 99. Feature flags — client vs server eval

**Frequency:** Low

**Question:** Client-side vs server-side feature flag evaluation — what are the tradeoffs?

**Answer:** A feature flag needs to be **evaluated** — resolving a user + context into a variant (on/off, A/B/C). *Where* that evaluation happens has real consequences.

**Client-side evaluation** ships the **flag configuration and rules down to the browser**, and the client SDK decides the variant locally. It's **flexible** — instant toggling, easy **A/B testing** and client-only UI experiments — but has two downsides: it **exposes flag names and rules** (anyone can open devtools and see `new-checkout-enabled`, including unreleased features), and it **adds bundle weight** plus a possible **flash** as flags resolve after load. Bad for **sensitive rollouts** and can hurt SEO (content decided after JS runs).

**Server-side evaluation** keeps the **flag logic private on the server** and sends the client **only the already-resolved variant** (or renders the chosen variant directly). This is **better for sensitive/gradual rollouts** (competitors/users can't see what's coming), for **SEO** (the server renders final HTML), and it avoids client flag-resolution flicker. The tradeoff is that changing a flag may require a new request/render rather than a live client toggle.

The common **hybrid**: the **server resolves flags on the first request** (so the initial render is correct and flicker-free) and **hydrates a client SDK** with those values, enabling **live client-side toggles** for subsequent interactions — best of both.

Supporting practices: mature vendors — **LaunchDarkly, Statsig, Unleash, Flagsmith** — handle targeting, rollout %, and analytics. **Wrap flag reads in a typed wrapper** (a single `flags.newCheckout` accessor) so flag keys are type-checked and centralized rather than stringly-typed everywhere. **Sticky bucketing** (a user consistently sees the same variant) **requires stable user identity** — hash a user ID, not a per-session random. And crucially, **clean up flags after a rollout completes** — stale flags and their dead branches accumulate as **tech debt**; treat flag removal as part of finishing the feature.

**Key points:**
- LaunchDarkly, Statsig, Unleash, Flagsmith are common vendors
- Wrap flag reads in a typed wrapper for safety
- Sticky bucketing requires user identity
- Clean up flags after rollout — tech debt accumulates

---

### 100. Telemetry: error tracking vs RUM vs APM

**Frequency:** Low

**Question:** Error tracking vs RUM vs APM — how do these telemetry categories differ?

**Answer:** They answer three different questions about production and are **complementary** — mature observability uses all three.

**Error tracking** (Sentry, Rollbar, Bugsnag) answers **"what broke?"** It captures **unhandled exceptions and rejections** with **stack traces**, **breadcrumbs** (the trail of user actions/network calls leading up to the error), device/browser context, and groups duplicates into issues with alerting. This is your first line for catching and triaging bugs users hit.

**RUM (Real User Monitoring)** answers **"how does it *feel* for real users?"** It collects **field performance data** from actual sessions — **Core Web Vitals** (LCP/INP/CLS), navigation/resource timing, and **custom events/timings** — segmented by device, geography, connection, and page. Unlike lab tools (Lighthouse), this is **real-world data** across your whole audience, revealing that, say, users on mobile in a region have terrible LCP.

**APM (Application Performance Monitoring)** (Datadog, New Relic, Dynatrace) answers **"where's the latency across the stack?"** It ties the **frontend action to the backend request chain**, producing **end-to-end traces** — a slow page mapped through the API gateway, services, and database queries — so you can find *which* hop is slow, not just that the page is slow.

Cross-cutting practices:
- **Sample heavily on high-traffic sites** — sending every event from millions of sessions is cost-prohibitive and noisy; capture a representative fraction (and often 100% of errors but a % of traces/RUM).
- **Source maps are essential** for readable stacks — without them error traces point at minified code (upload them privately, as in the source-maps question).
- **Distributed tracing with OpenTelemetry** — propagate a **trace ID** from the browser through every service (via headers) so frontend and backend telemetry **stitch into one trace**; OTel is the vendor-neutral standard.
- **Scrub PII before data leaves the client** — strip emails, tokens, form values, and sensitive URL params in the SDK's `beforeSend`/hooks so you never ship personal data to a third-party monitoring vendor (privacy + compliance).

**Key points:**
- Sample heavily for high-traffic sites
- Source maps are essential for readable stacks
- Distributed tracing (OpenTelemetry) propagates trace IDs across services
- PII scrubbing must run before data leaves the client
