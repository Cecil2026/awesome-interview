# Frontend Interview Questions

100 high-frequency frontend questions covering HTML/CSS, JavaScript/TypeScript, frameworks (React/Angular/Vue), performance, testing, accessibility, networking, and build tooling.

---

### 1. Box model & `box-sizing: border-box`

**Frequency:** High

**Question:** Walk me through the CSS box model and its four boxes (content, padding, border, and margin), then explain the difference between the default box-sizing: content-box and box-sizing: border-box. Cover why border-box is more predictable for grid/flex layouts, why most resets apply box-sizing: border-box globally, how vertical margins collapse between block elements, whether box-sizing is inherited, and how you'd use DevTools to debug sizing surprises.

**Answer:** The CSS box model wraps every element in content, padding, border, and margin boxes. By default (`content-box`), `width` sets only the content area, so padding and borders expand the rendered size. `border-box` makes `width`/`height` include padding and border, which is far more predictable for grid/flex layouts. Most modern resets apply `*, *::before, *::after { box-sizing: border-box; }` globally.

**Key points:**
- `content-box` is the spec default; `border-box` is the practical default
- Margins are outside the box and collapse vertically between block elements
- `box-sizing` is inherited only when explicitly declared with `inherit`
- Use DevTools' computed-styles box diagram to debug sizing surprises

---

### 2. Block vs inline vs inline-block

**Frequency:** High

**Question:** Compare block, inline, and inline-block elements. Explain how each behaves with respect to starting on a new line, taking full width, and honoring width/height/margin/padding, and give typical examples of each. Also address how inline elements respect line-height and create whitespace gaps, how display: flex/grid on a parent affects children, why replaced inline elements like img and input accept dimensions, and why modern layouts prefer flex/grid over inline-block tricks.

**Answer:** Block elements (`div`, `p`, `section`) start on a new line and take the full available width; you can set width/height/margin/padding freely. Inline elements (`span`, `a`, `em`) flow with text, ignore width/height, and only honor horizontal padding/margin visually. Inline-block sits inline with surrounding text but accepts box dimensions, making it useful for buttons or chips before flexbox existed.

**Key points:**
- Inline elements respect `line-height` and create whitespace gaps between tags
- `display: flex/grid` on a parent makes children behave like block-level participants
- Replaced inline elements (`img`, `input`) accept width/height despite being inline
- Modern layouts prefer flex/grid over inline-block tricks

---

### 3. Flexbox axes & flex-grow/shrink/basis

**Frequency:** High

**Question:** Explain how flexbox works: the main axis versus the cross axis, and how justify-content, align-items, and align-self map to them. Then break down the flex shorthand of grow, shrink, and basis: how grow divides leftover space, how shrink divides overflow, what basis represents, and what flex: 1 expands to. Also touch on flex-direction reversing the main axis, flex-wrap with align-content, gap in flex containers, and why min-width: 0 on flex children prevents overflow.

**Answer:** A flex container has a main axis (default row) and a cross axis. `justify-content` aligns along main; `align-items`/`align-self` along cross. The shorthand `flex: <grow> <shrink> <basis>` controls how items distribute free space: `grow` divides leftover space, `shrink` divides overflow, `basis` is the hypothetical starting size before grow/shrink applies. `flex: 1` is shorthand for `1 1 0%`.

**Key points:**
- `flex-direction: row-reverse/column` swaps the main axis
- `flex-wrap: wrap` lets rows break; combine with `align-content` for multi-line cross alignment
- `gap` works in flex (modern browsers) and avoids negative-margin hacks
- `min-width: 0` on flex children prevents text-overflow from blowing out the layout

---

### 4. Positioning: static/relative/absolute/fixed/sticky

**Frequency:** High

**Question:** Compare the five CSS position values: static, relative, absolute, fixed, and sticky. Explain what each does with top/left/right/bottom, how relative creates a positioning context, what absolute positions against, how fixed relates to the viewport, and how sticky toggles between relative and fixed. Also cover the gotcha where a transform, filter, or will-change ancestor traps fixed elements, sticky's requirement of a scrollable ancestor and a defined offset, absolute elements collapsing to content width, and how z-index creates stacking contexts.

**Answer:** `static` is the default and ignores `top/left/right/bottom`. `relative` reserves space but shifts visually and creates a positioning context for absolute children. `absolute` removes the element from flow and positions it relative to the nearest positioned ancestor. `fixed` positions relative to the viewport (or a transformed ancestor — a common gotcha). `sticky` toggles between relative and fixed based on scroll threshold.

**Key points:**
- A `transform`, `filter`, or `will-change` ancestor traps `fixed` elements
- `sticky` requires a scrollable ancestor and a defined `top`/`bottom`
- Absolute elements collapse to content width unless sized
- Positioned elements with `z-index` create stacking contexts

---

### 5. Specificity rules & `!important`

**Frequency:** High

**Question:** Explain how CSS specificity is calculated as a four-part tuple (inline, IDs, classes/attributes/pseudo-classes, elements/pseudo-elements), how ties are broken, and how !important fits into the origin/importance ordering. Then discuss how @layer (cascade layers) offers a cleaner ordering mechanism. Also address that the universal selector and :where() add zero specificity, how :is() and :not() take the highest specificity of their arguments, why to prefer cascade layers over specificity arms-races, and when !important is acceptable.

**Answer:** Specificity is a four-part tuple: inline styles, IDs, classes/attributes/pseudo-classes, elements/pseudo-elements. Higher tuple wins; ties go to the later rule. `!important` jumps to its own layer that overrides normal declarations (user-agent < user < author < author-important < inline-important). `@layer` (cascade layers) provides a clean ordering mechanism that obsoletes most `!important` usage.

**Key points:**
- The universal selector `*` and `:where()` contribute zero specificity
- `:is()` and `:not()` take the highest specificity of their arguments
- Prefer cascade layers over specificity arms-races
- Avoid `!important` outside utility frameworks or third-party overrides

---

### 6. Responsive: media queries, `clamp()`, container queries

**Frequency:** High

**Question:** Explain the tools for responsive design: media queries (viewport and device features like min-width, prefers-color-scheme, prefers-reduced-motion), clamp(min, preferred, max) for fluid values without breakpoints, and container queries (@container) for component-level responsiveness. Also address mobile-first min-width versus desktop-first max-width, defining a container with container-type: inline-size, pairing clamp() with viewport units, and respecting prefers-reduced-motion.

**Answer:** Media queries adapt to viewport or device features (`@media (min-width: 768px)`, `(prefers-color-scheme)`, `(prefers-reduced-motion)`). `clamp(min, preferred, max)` produces fluid values without breakpoints. Container queries (`@container`) let components respond to their parent's size, enabling true component-level responsiveness.

**Key points:**
- Mobile-first uses `min-width` queries; desktop-first uses `max-width`
- Define a container with `container-type: inline-size`
- `clamp()` pairs well with viewport units: `clamp(1rem, 2vw, 1.5rem)`
- Respect `prefers-reduced-motion` for accessibility

---

### 7. Semantic HTML for SEO/a11y

**Frequency:** High

**Question:** Explain the value of semantic HTML for both SEO and accessibility. Cover which semantic elements communicate structure (header, nav, main, article, section, aside, footer, figure, time), how they help assistive tech via landmarks and headings and help crawlers via a richer outline, and the rule of one h1 per page with an unbroken heading hierarchy. Also address using buttons for actions and links for navigation, labeling every form input, avoiding div role="button" in favor of real button, and layering microdata/JSON-LD on top.

**Answer:** Semantic elements (`header`, `nav`, `main`, `article`, `section`, `aside`, `footer`, `figure`, `time`) communicate structure to browsers, assistive tech, and crawlers. They improve accessibility (landmarks, headings) and SEO (richer document outline). Use one `<h1>` per page and maintain heading hierarchy without skipping levels.

**Key points:**
- Buttons for actions, links for navigation
- `<label for>` or wrapped labels for every form input
- Avoid `<div role="button">` — use real `<button>`
- Microdata/JSON-LD adds structured data on top of semantics

---

### 8. `var` vs `let` vs `const`; hoisting & TDZ

**Frequency:** High

**Question:** Compare var, let, and const, and explain hoisting and the Temporal Dead Zone. Cover that var is function-scoped, hoisted, and initialized to undefined, while let/const are block-scoped and hoisted but uninitialized (accessing them early throws ReferenceError), that const prevents rebinding but not mutation, and the preference order of const then let. Also address var creating global-object properties, function declarations being fully hoisted versus expressions, the extent of the TDZ, and using Object.freeze for shallow immutability.

**Answer:** `var` is function-scoped, hoisted, and initialized to `undefined`. `let`/`const` are block-scoped and hoisted but uninitialized — accessing them before declaration throws `ReferenceError` (the Temporal Dead Zone). `const` prevents rebinding but not mutation of object contents. Always prefer `const`, then `let`; reserve `var` for legacy code.

**Key points:**
- `var` creates properties on the global object; `let`/`const` do not
- Function declarations are fully hoisted; function expressions are not
- TDZ exists from block start to declaration line
- `const` arrays/objects can still be mutated — use `Object.freeze` for shallow immutability

---

### 9. Closures + classic loop bug

**Frequency:** High

**Question:** Explain what a closure is, then walk through the classic loop bug where for (var i = 0; i < 3; i++) setTimeout(() => console.log(i)) logs 3 3 3, why it happens, and how switching var to let or using an IIFE fixes it. Also cover how closures power module patterns, partial application, and React hooks, how stale closures in useEffect arise from missing deps, how closures can cause memory leaks by retaining outer scope, and how ES modules reduce closure-as-namespace patterns.

**Answer:** A closure is a function bundled with its lexical environment. The classic `for (var i = 0; i < 3; i++) setTimeout(() => console.log(i))` logs `3 3 3` because all callbacks share one `i`. Fix by switching `var` to `let` (each iteration gets a fresh binding) or wrapping in an IIFE.

```js
for (let i = 0; i < 3; i++) setTimeout(() => console.log(i)); // 0 1 2
```

**Key points:**
- Closures power module patterns, partial application, and React hooks
- Stale closures in `useEffect` are caused by missing deps
- Memory leaks: closures retain references to outer scope
- ES modules give explicit scoping that reduces closure-as-namespace patterns

---

### 10. `this` binding rules

**Frequency:** High

**Question:** Explain the rules that determine the value of this in JavaScript, in precedence order: new binding, explicit call/apply/bind, method invocation on an object, and the default (global object or undefined in strict mode). Then explain why arrow functions have no own this and lexically inherit it, making them ideal for callbacks. Also cover that class methods aren't auto-bound, the thisArg argument to forEach/map, how strict mode prevents global pollution, and that repeated bind only honors the first.

**Answer:** In order of precedence: `new` binds `this` to the new instance; explicit `call`/`apply`/`bind` sets it; method calls (`obj.fn()`) bind to `obj`; otherwise it's the global object (or `undefined` in strict mode). Arrow functions don't have their own `this` — they lexically inherit from the enclosing scope, which is why they're ideal for callbacks.

**Key points:**
- Class methods are not auto-bound; use arrow fields or `.bind`
- `forEach`/`map` accept a `thisArg` second argument
- Strict mode prevents accidental global pollution
- `bind` returns a new function; calling `bind` repeatedly only honors the first

---

### 11. Prototypes & prototype chain

**Frequency:** High

**Question:** Explain JavaScript prototypes and the prototype chain: how every object has an internal [[Prototype]] accessible via Object.getPrototypeOf, how property lookups walk the chain until null, what Object.create(proto) does, and how class syntax with extends and super is sugar over prototype-based inheritance. Also cover how instanceof walks the chain checking .prototype, how hasOwnProperty/Object.hasOwn skip inherited props, why modifying Array.prototype is an anti-pattern, and that prototype methods are shared while instance fields are per-object.

**Answer:** Every object has an internal `[[Prototype]]` (accessible via `Object.getPrototypeOf`) that forms a chain ending at `null`. Property lookups walk the chain. `Object.create(proto)` creates an object with a specific prototype. `class` syntax is sugar over prototype-based inheritance; `extends` sets up the chain and `super` calls parent constructors/methods.

**Key points:**
- `instanceof` walks the prototype chain checking `.prototype`
- `hasOwnProperty` (or `Object.hasOwn`) skips inherited props
- Modifying `Array.prototype` is a notorious anti-pattern
- Prototype methods are shared; instance fields are per-object

---

### 12. Event loop: macrotasks vs microtasks

**Frequency:** High

**Question:** Explain the JavaScript event loop and the difference between macrotasks and microtasks. Describe the cycle: drain one macrotask (script, setTimeout, I/O, UI events), then run all microtasks (Promises, queueMicrotask, MutationObserver) until empty, then render, then repeat, and note how microtasks can starve rendering and how long synchronous work blocks everything. Also cover why Promise.resolve().then() runs before setTimeout(..., 0), where requestAnimationFrame fits, using scheduler.postTask or requestIdleCallback for low-priority work, and offloading CPU work to Web Workers.

**Answer:** JS is single-threaded with an event loop that drains one macrotask (script, `setTimeout`, I/O, UI events), then runs all microtasks (Promises, `queueMicrotask`, `MutationObserver`) until the queue is empty, then renders, then repeats. Microtasks can starve rendering if they keep enqueueing themselves; long synchronous work blocks everything.

**Key points:**
- `Promise.resolve().then()` runs before `setTimeout(..., 0)`
- `requestAnimationFrame` runs before paint, after microtasks
- Use `scheduler.postTask` or `requestIdleCallback` for low-priority work
- Web Workers offload CPU-bound work off the main thread

---

### 13. Promises vs async/await; error handling

**Frequency:** High

**Question:** Explain the relationship between Promises and async/await and how to handle errors. Cover that async/await is sugar over Promises that reads sequentially, how a throw inside an async function becomes a rejected Promise, how await unwraps a fulfilled value or re-throws on rejection, why you should wrap awaits in try/catch or attach .catch, and what happens with unhandled rejections in Node and browsers. Also address that async functions always return a Promise, that await pauses the function not the thread, parallelizing independent awaits with Promise.all, and what try/catch around await catches.

**Answer:** `async/await` is syntactic sugar over Promises that reads sequentially. Throw inside async functions becomes a rejected Promise; `await` unwraps a fulfilled value or re-throws on rejection. Always wrap awaits in `try/catch` or attach `.catch`. Unhandled rejections crash Node ≥15 by default and surface in browser DevTools.

**Key points:**
- `async` functions always return a Promise
- `await` pauses the function, not the thread
- Parallelize independent awaits with `Promise.all`
- `try/catch` around `await` catches both sync throws and rejections

---

### 14. `Promise.all` vs `allSettled` vs `race` vs `any`

**Frequency:** High

**Question:** Compare Promise.all, Promise.allSettled, Promise.race, and Promise.any. Explain how each settles: all resolving with an array but rejecting fail-fast on first failure, allSettled waiting for every promise and returning status/value-or-reason objects, race settling with the first to settle either way, and any resolving on first fulfillment and rejecting with AggregateError only if all fail. Also cover combining race with a timeout promise, allSettled for partial-failure-tolerant parallel calls, any for fetching from mirrors, and that none of them cancel pending promises (use AbortController).

**Answer:** `all` resolves with an array when all succeed, rejects on first failure (fail-fast). `allSettled` waits for every promise and returns an array of `{status, value|reason}` — use when you need all results regardless. `race` settles with the first promise to settle (fulfill or reject). `any` resolves with the first fulfillment, rejecting with `AggregateError` only if all fail.

**Key points:**
- Combine `Promise.race` with a timeout promise for cancellation
- `allSettled` is ideal for parallel API calls where partial failure is OK
- `any` is great for fetching from multiple mirrors
- None of these cancel pending promises — use `AbortController` for that

---

### 15. Debounce vs throttle (write both)

**Frequency:** High

**Question:** Explain the difference between debounce and throttle, when to use each, and why they aren't interchangeable, then write implementations of both. Cover debounce delaying execution until N ms after the last call (search-as-you-type) versus throttle running at most once per N ms (scroll/resize). Also address how leading versus trailing edge changes the UX feel, using AbortController to cancel pending debounced fetches, requestAnimationFrame as a natural throttle for paint-bound work, and preferring library implementations in production for edge cases.

**Answer:** Debounce delays execution until N ms after the last call (good for search-as-you-type). Throttle ensures execution at most once per N ms (good for scroll/resize). They solve different problems and aren't interchangeable.

```js
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const throttle = (fn, ms) => { let last = 0; return (...a) => { const n = Date.now(); if (n - last >= ms) { last = n; fn(...a); } }; };
```

**Key points:**
- Leading vs trailing edge changes UX feel
- `AbortController` can cancel pending debounced fetches
- `requestAnimationFrame` is a natural throttle for paint-bound work
- Use lodash/underscore implementations in production for edge cases

---

### 16. Equality: `==` vs `===` vs `Object.is`; NaN

**Frequency:** High

**Question:** Explain the differences between ==, ===, and Object.is, and the special behavior of NaN. Cover that === is strict equality, == performs surprising type coercion, and Object.is is like === except it treats NaN as equal to itself and distinguishes +0 from -0, plus that NaN is the only value not equal to itself and is tested with Number.isNaN. Also address always preferring === unless intentionally coercing, that null == undefined is true, that React's useState uses Object.is, and why Number.isNaN is safer than global isNaN.

**Answer:** `===` is strict equality (same type, same value). `==` performs type coercion with surprising rules (`[] == false` is true). `Object.is` is like `===` but treats `NaN === NaN` as true and `+0 !== -0`. `NaN` is the only value not equal to itself; test with `Number.isNaN(x)`.

**Key points:**
- Always use `===` unless intentionally coercing
- `null == undefined` is true; both `=== null` is false
- React's `useState` and `Object.is` use the same equality check
- `Number.isNaN` is safer than the global `isNaN` (which coerces)

---

### 17. TS: `interface` vs `type`

**Frequency:** High

**Question:** Compare TypeScript interface and type. Explain that both describe object shapes, that interface supports declaration merging and is idiomatic for public APIs, and that type aliases are strictly more expressive (unions, intersections, primitives, tuples, mapped types) but not mergeable, with comparable performance so you pick by capability. Also cover interface extension being faster to type-check in large unions, type aliases being self-referential via conditional types, both supporting generics, and declaration merging for augmenting libraries.

**Answer:** Both describe object shapes. `interface` supports declaration merging and is idiomatic for public APIs/object contracts. `type` aliases can describe unions, intersections, primitives, tuples, and mapped types — strictly more expressive but not mergeable. Performance is comparable; pick by capability needed. Many teams default to `type` for everything.

**Key points:**
- `interface` extension can be faster to type-check in large unions
- `type` aliases can be self-referential via conditional types
- Both support generics
- Declaration merging is essential for augmenting libraries

---

### 18. React VDOM & reconciliation

**Frequency:** High

**Question:** Explain how React's virtual DOM and reconciliation work: how React builds a new element tree on state change and diffs it against the previous one to commit minimal DOM mutations. Walk through the diffing heuristics for (1) elements of different types, (2) elements of the same type, and (3) keyed list items, and describe how these heuristics make reconciliation O(n) rather than a full tree-diff. Finally, cover how Fiber (since React 16) makes reconciliation interruptible for concurrent rendering, why concurrent rendering can throw away in-progress work, and what React 19's compiler-driven memoization changes.

**Answer:** React describes UI as a tree of elements; on state change it builds a new tree and diffs against the previous (reconciliation), committing minimal DOM mutations. Heuristics: different element types replace the subtree; same types update props; keys identify list items across renders. Fiber (since 16) makes reconciliation interruptible for concurrent rendering.

**Key points:**
- Reconciliation is O(n) thanks to heuristics, not full tree-diff
- Wrong keys cause subtle state bugs in lists
- Concurrent rendering can throw away in-progress work
- React 19 adds compiler-driven memoization

---

### 19. `useState` vs `useReducer`

**Frequency:** High

**Question:** Compare useState and useReducer and explain when you would reach for each: useState for independent primitives or small object state, versus useReducer when next state depends on previous state, when multiple sub-values change together, or when transitions follow a state-machine pattern. Discuss why reducers being pure and having a stable dispatch identity matters for testing and for dependency arrays. Also touch on lazy initialization with useState(() => expensive()), functional updates like setX(prev => prev + 1) to avoid stale closures, pairing reducers with Context for app-wide state, and when you'd escalate to XState or Zustand.

**Answer:** `useState` is ideal for independent primitives or small object state. `useReducer` shines when next state depends on previous state, multiple sub-values change together, or transitions follow a state-machine pattern. Reducer functions are pure and testable; dispatch identity is stable so it's safe in deps.

**Key points:**
- Lazy initialization: `useState(() => expensive())`
- Functional updates: `setX(prev => prev + 1)` avoid stale closures
- Reducers pair well with Context for app-wide state
- XState or Zustand for more complex needs

---

### 20. `useEffect` deps & stale closures

**Frequency:** High

**Question:** Explain why useEffect can suffer from stale closures: how effects capture variables from the render in which they were created and how missing dependencies lead to reading outdated values. Describe how the exhaustive-deps lint rule catches this and the two main fixes (including all referenced reactive values, or using refs/functional updates to read the latest without re-subscribing). Also address what an empty dependency array means, when cleanup runs, why React 18 Strict Mode runs effects twice in dev, and how React 19's compiler reduces manual dependency management.

**Answer:** Effects capture variables from the render they were created in. Missing deps cause stale closures that read outdated values. The exhaustive-deps lint rule catches this. Fix by including all referenced reactive values, or use refs/functional updates to read latest without re-subscribing.

**Key points:**
- Empty deps `[]` = run once on mount (and cleanup on unmount)
- Cleanup runs before next effect and on unmount
- React 18 Strict Mode runs effects twice in dev to surface bugs
- React 19's compiler reduces manual dep management

---

### 21. `useMemo` vs `useCallback`

**Frequency:** High

**Question:** Contrast useMemo and useCallback: how useMemo(fn, deps) memoizes a computed value while useCallback(fn, deps) memoizes a function reference (and why the latter is sugar for useMemo(() => fn, deps)). Explain the two main reasons to use them, avoiding expensive recomputation and keeping referential identity stable for child memo/effect dependencies. Then discuss their pitfalls: the overhead of memoizing trivial values, stale-closure risk from wrong deps, pairing with React.memo, profiling before adding them, and how React 19's compiler often makes them unnecessary.

**Answer:** `useMemo(fn, deps)` memoizes a computed value; `useCallback(fn, deps)` memoizes a function reference (sugar for `useMemo(() => fn, deps)`). Use to avoid expensive recomputation or to keep referential identity stable for child memo/effect deps. React 19's compiler often makes these unnecessary.

**Key points:**
- Memoization has overhead — don't memoize trivial values
- Stale closure risk if deps are wrong
- Pair with `React.memo` for child re-render skipping
- Profile before adding memoization

---

### 22. Keys in lists; index-key anti-pattern

**Frequency:** High

**Question:** Explain the role of keys in React lists: how keys let React match items between renders, why using the array index is acceptable for static lists but breaks on reorder, insert, or delete, and how state attached to a row can follow the index rather than the item. Explain why stable item IDs are the fix. Also cover that keys need only be unique among siblings, why you shouldn't generate keys randomly inside render, that React warns in dev when keys are missing, and how keys also affect CSS animations and form state.

**Answer:** Keys identify items between renders so React can match them. Using array index is fine for static lists but breaks on reorder/insert/delete — state attached to a row follows the index, not the item. Use stable item IDs.

**Key points:**
- Keys must be unique among siblings only
- Don't generate keys randomly inside render
- React warns in dev when keys are missing
- Keys also affect CSS animations and form state

---

### 23. Controlled vs uncontrolled inputs

**Frequency:** High

**Question:** Compare controlled and uncontrolled inputs in React: controlled inputs deriving value from state and updating via onChange (single source of truth, easy validation, but a re-render per keystroke) versus uncontrolled inputs that keep their own state in the DOM and are accessed via refs with defaultValue. Explain when each is the better choice. Also address how react-hook-form leverages uncontrolled inputs for performance, why file inputs are always effectively uncontrolled, how defaultValue/defaultChecked initialize uncontrolled inputs, and why you shouldn't switch a single input between controlled and uncontrolled.

**Answer:** Controlled inputs derive `value` from React state and update via `onChange` — single source of truth, easy validation, but re-renders on every keystroke. Uncontrolled inputs hold their own state in the DOM, accessed via refs (`defaultValue` for initial value). Uncontrolled is simpler for plain forms; controlled is better when you need to react to keystrokes.

**Key points:**
- React-hook-form leverages uncontrolled inputs for performance
- File inputs are always effectively uncontrolled
- `defaultValue`/`defaultChecked` initialize uncontrolled
- Don't switch a single input between controlled/uncontrolled

---

### 24. SSR vs SSG vs CSR vs ISR

**Frequency:** High

**Question:** Compare CSR, SSR, SSG, and ISR rendering strategies: (1) CSR shipping a shell plus JS that fetches and renders client-side (slow first paint, fast subsequent nav), (2) SSR rendering HTML per request (good for personalized/SEO content but high server cost), (3) SSG pre-building pages at deploy (fastest serve but stale until rebuild), and (4) ISR serving cached pages and revalidating on a schedule. Note how Server Components add a per-component server-rendering axis. Also touch on streaming SSR, edge SSR, SSG requiring build-time-known content, and ISR's revalidation needing care to avoid cache stampedes.

**Answer:** CSR ships a shell + JS that fetches and renders on the client — slow first paint, fast subsequent nav. SSR renders HTML per request — good for personalized/SEO content but high server cost. SSG pre-builds pages at deploy — fastest serve, but stale until rebuild. ISR (Next.js) serves cached pages and revalidates on a schedule — best of SSR+SSG. Server Components add a fourth axis: per-component server rendering.

**Key points:**
- Streaming SSR ships HTML chunks as data resolves
- Edge SSR runs near users for lower latency
- SSG works only for content known at build time
- ISR's revalidation strategy needs care to avoid cache stampedes

---

### 25. Critical rendering path

**Frequency:** High

**Question:** Walk through the browser's critical rendering path: building the DOM from HTML, the CSSOM from CSS, combining them into the render tree, layout (geometry), paint (pixels), and compositing layers. Explain how CSS blocks rendering and synchronous JS blocks the parser, and the main optimizations, minimizing critical resources, deferring non-critical JS, inlining critical CSS, and using async/defer on scripts. Also contrast defer (runs after parse, before DOMContentLoaded) with async (runs whenever it arrives, out of order), and cover preloading critical resources, preconnecting to third-party origins, and using the DevTools Performance panel.

**Answer:** Browser builds DOM from HTML, CSSOM from CSS, combines them into the render tree, lays out (geometry), paints (pixels), and composites layers. CSS blocks render; sync JS blocks parser. Optimize by minimizing critical resources, deferring non-critical JS, inlining critical CSS, and using async/defer on scripts.

**Key points:**
- `defer` runs after parse, before `DOMContentLoaded`
- `async` runs whenever it arrives (out of order)
- Preload critical resources, preconnect to third-party origins
- DevTools Performance panel visualizes the path

---

### 26. Core Web Vitals (LCP, INP, CLS)

**Frequency:** High

**Question:** Explain the three Core Web Vitals and their targets: (1) LCP (Largest Contentful Paint) for load speed, target <2.5s, (2) INP (Interaction to Next Paint), which replaced FID in 2024, measuring responsiveness across all interactions, target <200ms, and (3) CLS (Cumulative Layout Shift) for visual stability, target <0.1, noting Google uses them as ranking signals. Also cover the common killers for each: render-blocking CSS, large images, and slow servers for LCP; long tasks, heavy event handlers, and sync layout for INP; missing image dimensions and late-injected ads/banners for CLS, plus using the web-vitals library for field data.

**Answer:** LCP (Largest Contentful Paint) measures load speed — target <2.5s. INP (Interaction to Next Paint) replaced FID in 2024, measuring responsiveness across all interactions — target <200ms. CLS (Cumulative Layout Shift) measures visual stability — target <0.1. Google uses these as ranking signals.

**Key points:**
- LCP killers: render-blocking CSS, large images, slow servers
- INP killers: long tasks, heavy event handlers, sync layout
- CLS killers: missing image dimensions, late-injected ads/banners
- `web-vitals` library reports field data

---

### 27. Code splitting & lazy loading

**Frequency:** High

**Question:** Explain code splitting and lazy loading: splitting bundles by route, feature, or component so users download only what's needed, how dynamic import() is the primitive, and how framework wrappers (React.lazy, Next.js dynamic, Angular loadComponent) handle Suspense. Discuss watching for waterfall loading and prefetching likely-next routes during idle. Also cover why per-route splitting is the highest-impact starting point, prefetching with <link rel="prefetch"> or framework hints, why over-splitting into too many small chunks hurts HTTP overhead, and using bundle analyzers to guide decisions.

**Answer:** Split bundles by route, feature, or component so users download only what's needed. Dynamic `import()` is the primitive; framework wrappers (`React.lazy`, Next.js dynamic, Angular `loadComponent`) handle Suspense. Watch for waterfall loading — prefetch likely-next routes during idle.

**Key points:**
- Per-route splitting is the highest-impact starting point
- Prefetch with `<link rel="prefetch">` or framework hints
- Don't over-split — too many small chunks hurt HTTP overhead
- Bundle analyzers (webpack-bundle-analyzer, rollup-plugin-visualizer) guide decisions

---

### 28. HTTP caching: Cache-Control, ETag, Last-Modified

**Frequency:** High

**Question:** Explain HTTP caching with Cache-Control, ETag, and Last-Modified: how Cache-Control directives govern freshness (max-age, s-maxage, public/private, immutable, no-store, stale-while-revalidate), how conditional revalidation after expiry uses ETag with If-None-Match or Last-Modified with If-Modified-Since to return 304 and skip the body, and what caching hash-named static assets should look like. Also cover how stale-while-revalidate serves stale content while refreshing in the background, why HTML should be no-cache so deploys propagate, how CDNs respect s-maxage separately from browser max-age, and what the Vary header does.

**Answer:** `Cache-Control` directives govern freshness: `max-age`, `s-maxage`, `public`/`private`, `immutable`, `no-store`, `stale-while-revalidate`. After expiry, conditional revalidation uses `ETag` (content hash) with `If-None-Match`, or `Last-Modified` with `If-Modified-Since`, returning 304 to skip body. Hash-named static assets get `Cache-Control: public, max-age=31536000, immutable`.

**Key points:**
- `stale-while-revalidate` serves stale while refreshing in background
- HTML should be `no-cache` (revalidate every time) so deploys propagate
- CDNs respect `s-maxage` separately from browser `max-age`
- `Vary` header tells caches which request headers differentiate responses

---

### 29. CORS preflight & credentials

**Frequency:** High

**Question:** Explain CORS preflight and credentials: when browsers send a preflight OPTIONS request for non-simple cross-origin requests (custom headers, methods other than GET/POST/HEAD, JSON body), what the server must respond with (Access-Control-Allow-Origin, -Methods, -Headers, and for credentials -Credentials: true with a specific origin rather than *), and how to send cookies by setting credentials: 'include' on fetch. Also cover which simple requests skip preflight, how Access-Control-Max-Age caches the preflight result, how SameSite cookies still apply on top of CORS, and the common mistake of returning * with credentials.

**Answer:** Browsers send a preflight `OPTIONS` request for "non-simple" cross-origin requests (custom headers, non-GET/POST/HEAD, JSON body). Server must respond with `Access-Control-Allow-Origin`, `-Methods`, `-Headers`, and (for credentials) `-Credentials: true` with a specific origin (not `*`). To send cookies, set `credentials: 'include'` on fetch.

**Key points:**
- Simple requests skip preflight (form-encoded POST, GET)
- `Access-Control-Max-Age` caches preflight result
- `SameSite` cookies still apply on top of CORS
- Mistake: returning `*` with credentials — browsers reject

---

### 30. XSS, CSRF, clickjacking mitigations

**Frequency:** High

**Question:** Explain how to mitigate XSS, CSRF, and clickjacking: for XSS, never using innerHTML with untrusted input, escaping on render, using CSP, sanitizing with DOMPurify, and preferring framework-bound rendering; for CSRF, SameSite cookies plus CSRF tokens for state-changing requests and the double-submit cookie pattern; and for clickjacking, X-Frame-Options: DENY or CSP frame-ancestors 'none'. Also cover why stored XSS is worse than reflected, how the Trusted Types API enforces safe DOM sinks, why CSRF only affects browser-sent credentials, and how React/Vue/Angular escape by default with dangerouslySetInnerHTML as opt-in.

**Answer:** XSS: never `innerHTML` untrusted input; escape on render; use CSP; sanitize with DOMPurify; prefer framework-bound rendering. CSRF: SameSite cookies + CSRF tokens for state-changing requests; double-submit cookie pattern. Clickjacking: `X-Frame-Options: DENY` or CSP `frame-ancestors 'none'`.

**Key points:**
- Stored XSS is worse than reflected
- Trusted Types API helps enforce safe DOM sinks
- CSRF only affects browser-sent credentials (cookies, basic auth)
- React/Vue/Angular escape by default — `dangerouslySetInnerHTML` is opt-in

---

### 31. CSS Grid: template-areas, implicit vs explicit

**Frequency:** Medium

**Question:** Explain CSS Grid, distinguishing the explicit grid from the implicit grid. Cover how grid-template-rows/columns define explicit tracks, how grid-auto-rows/columns and grid-auto-flow handle implicit tracks and placement, and how grid-template-areas plus grid-area let you lay out named regions. Also address responsive patterns with repeat(auto-fit, minmax(200px, 1fr)), how fr distributes leftover space, the place-items shorthand, and what subgrid enables.

**Answer:** `grid-template-rows/columns` defines the explicit grid; cells placed outside (or via `grid-auto-rows`) create the implicit grid. `grid-template-areas` lets you draw the layout with ASCII names, then assign children via `grid-area`. Implicit tracks use `grid-auto-rows/columns` for sizing and `grid-auto-flow` for placement direction.

```css
.container { grid-template-areas: "nav main" "nav aside"; }
.nav { grid-area: nav; }
```

**Key points:**
- `repeat(auto-fit, minmax(200px, 1fr))` builds responsive grids without media queries
- `fr` distributes leftover space after fixed tracks
- `place-items` is shorthand for align/justify-items
- Subgrid (now widely shipped) lets nested grids inherit parent tracks

---

### 32. CSS cascade & inheritance

**Frequency:** Medium

**Question:** Explain how the CSS cascade resolves which declaration wins, in order: origin and importance, then cascade layer, then specificity, then source order. Then contrast that with inheritance: which kinds of properties inherit by default versus which don't, and how inherit, initial, unset, and revert let you opt into behaviors. Also cover all: unset for resetting a component, how custom properties inherit, how cascade layers sit above specificity, and where user-agent stylesheets rank.

**Answer:** The cascade resolves which declaration wins by origin and importance, then cascade layer, then specificity, then source order. Inheritance is separate: some properties (color, font, line-height) inherit by default; layout properties (margin, padding, border) do not. Use `inherit`, `initial`, `unset`, or `revert` to opt into specific behaviors.

**Key points:**
- `all: unset` is useful for resetting a single component
- Custom properties (`--foo`) always inherit unless overridden
- Cascade layers introduce a tier above specificity
- Browser user-agent stylesheets are the lowest-priority origin

---

### 33. Pseudo-classes vs pseudo-elements

**Frequency:** Medium

**Question:** Distinguish pseudo-classes from pseudo-elements. Explain that pseudo-classes target an existing element in a particular state (with examples like :hover, :focus-visible, :nth-child, :has), while pseudo-elements style or create a sub-part of an element (like ::before, ::after, ::marker, ::selection), and note the :: versus : syntax and the content requirement for ::before/::after. Also cover :focus-visible for keyboard users, :has() as a parent selector, form-internal pseudo-elements, and the one-::before/one-::after-per-element limit.

**Answer:** Pseudo-classes (`:hover`, `:focus-visible`, `:nth-child`, `:has`) target an existing element in a particular state. Pseudo-elements (`::before`, `::after`, `::marker`, `::selection`) style or create a sub-part of an element. Syntactically, pseudo-elements use `::` (one colon still works for legacy ones). `::before/::after` require a `content` property to render.

**Key points:**
- `:focus-visible` shows focus rings only for keyboard users
- `:has()` is a parent selector now broadly supported
- `::placeholder`, `::file-selector-button` style form internals
- Only one `::before` and one `::after` per element

---

### 34. Stacking context & `z-index` traps

**Frequency:** Medium

**Question:** Explain what a stacking context is, how z-index only competes within the same context, and what triggers a new stacking context (position plus z-index, opacity below 1, transform, filter, will-change, isolation: isolate, and others). Explain why a child with a huge z-index can't escape its parent's context. Also cover using isolation: isolate to scope z-index, how auto-promoted transform layers surprise modal/tooltip layouts, portaling modals into document.body, and the DevTools Layers panel.

**Answer:** A stacking context is a group of elements painted together; `z-index` only competes within the same context. New contexts are created by `position` + `z-index`, `opacity < 1`, `transform`, `filter`, `will-change`, `isolation: isolate`, and a few others. A child with `z-index: 9999` cannot escape its parent's context.

**Key points:**
- Use `isolation: isolate` to scope z-index intentionally
- Auto-promoted layers (transforms) frequently surprise modal/tooltip layouts
- Portal modals into `document.body` to avoid context traps
- DevTools' Layers panel visualizes the stacking tree

---

### 35. CSS-in-JS vs utility-first vs CSS modules

**Frequency:** Medium

**Question:** Compare CSS-in-JS, utility-first CSS, and CSS modules as styling approaches. For each, cover its benefits and tradeoffs: CSS-in-JS (Emotion, styled-components) for co-location and dynamic theming versus runtime and SSR cost; utility-first (Tailwind) for a small atomic stylesheet and scaling versus markup readability; CSS modules for scoped names with zero runtime versus lacking dynamic theming. Also address why runtime CSS-in-JS is discouraged in React Server Components, Tailwind v4's native engine, and how to choose based on team and SSR/RSC needs.

**Answer:** CSS-in-JS (Emotion, styled-components) co-locates styles with components and supports dynamic theming but adds runtime cost and SSR complexity. Utility-first (Tailwind) ships a small atomic stylesheet and scales well, with tradeoffs in markup readability. CSS modules give scoped class names with zero runtime, working well with bundlers but lacking dynamic theming. Modern stacks lean toward Tailwind or zero-runtime CSS-in-JS (vanilla-extract, Panda, Linaria).

**Key points:**
- Runtime CSS-in-JS is discouraged in React Server Components
- Tailwind v4 uses native CSS engine for faster builds
- CSS modules compose with PostCSS pipelines
- Choose based on team familiarity and SSR/RSC requirements

---

### 36. `<picture>`, `srcset`, responsive images

**Frequency:** Medium

**Question:** Explain how to serve responsive images. Cover how srcset plus sizes lets the browser pick an image based on DPR and layout width, how <picture> adds art direction and format negotiation (AVIF, then WebP, then JPEG fallback), and the roles of loading="lazy", decoding="async", and fetchpriority="high". Also address always setting width/height (or aspect-ratio) to prevent CLS, that sizes describes layout width not image width, using a CDN for on-the-fly resizing, and never lazy-loading the above-the-fold LCP image.

**Answer:** `srcset` plus `sizes` lets the browser pick an optimal image based on DPR and layout width. `<picture>` adds art direction and format negotiation: serve AVIF, then WebP, then JPEG fallback. `loading="lazy"` defers offscreen images; `decoding="async"` avoids blocking paint; `fetchpriority="high"` boosts LCP images.

```html
<picture>
  <source type="image/avif" srcset="hero.avif">
  <img src="hero.jpg" alt="..." loading="lazy" decoding="async">
</picture>
```

**Key points:**
- Always set `width`/`height` (or aspect-ratio) to prevent CLS
- `sizes` describes layout width, not image width
- Use a CDN with on-the-fly resizing for variants
- Mark above-the-fold images with `fetchpriority="high"`, not lazy

---

### 37. WAI-ARIA roles & when NOT to use them

**Frequency:** Medium

**Question:** Explain what WAI-ARIA is for, when it adds value (patterns like tabs, comboboxes, and live regions that native HTML can't express), and the first rule of ARIA ("don't use ARIA" and prefer native elements). Cover common mistakes: redundant roles, missing keyboard handlers, and aria-hidden on focusable elements. Also discuss aria-live regions, aria-expanded and aria-controls, aria-label overriding visible text, and testing with axe-core plus VoiceOver/NVDA rather than linters alone.

**Answer:** ARIA augments semantics when native HTML can't express a pattern (tabs, comboboxes, live regions). The first rule of ARIA is "don't use ARIA" — prefer native elements. Common mistakes: redundant roles (`role="button"` on `<button>`), missing keyboard handlers, and `aria-hidden` on focusable elements (breaks tab order).

**Key points:**
- `aria-live` regions announce dynamic updates
- `aria-expanded`, `aria-controls` describe disclosure widgets
- `aria-label` overrides visible text for screen readers
- Run axe-core and test with VoiceOver/NVDA, not just linters

---

### 38. Keyboard nav & focus management

**Frequency:** Medium

**Question:** Explain how to make an interface fully keyboard-navigable and manage focus correctly. Cover ensuring every interactive element is reachable and operable, using natural tab order and avoiding positive tabindex, what tabindex="-1" does, and how to move and trap focus inside a modal then restore it on close, plus using :focus-visible. Also address skip-to-content links, roving tabindex for composite widgets, never removing outlines without an alternative, and testing by unplugging the mouse.

**Answer:** Every interactive element must be reachable and operable via keyboard. Use natural tab order (avoid positive `tabindex`); `tabindex="-1"` makes elements programmatically focusable. After opening a modal, move focus inside and trap it; restore focus on close. Use `:focus-visible` so focus rings show for keyboard users without distracting mouse users.

**Key points:**
- Skip-to-content links help keyboard users bypass nav
- Roving tabindex for composite widgets (tabs, menus, grids)
- Never remove outlines without providing an alternative
- Test by unplugging the mouse

---

### 39. Color contrast (WCAG AA/AAA)

**Frequency:** Medium

**Question:** Explain WCAG color contrast requirements: the AA thresholds of 4.5:1 for normal text and 3:1 for large text and UI components, and the AAA thresholds of 7:1 and 4.5:1. Explain that contrast is computed from relative luminance rather than perceived brightness, and how APCA (the upcoming WCAG 3 algorithm) better models perception and treats dark-on-light versus light-on-dark asymmetrically. Also cover testing all states, not relying on color alone, tooling options, and testing forced-colors/high-contrast mode separately.

**Answer:** WCAG AA requires 4.5:1 contrast for normal text and 3:1 for large text (18pt or 14pt bold) and UI components. AAA bumps to 7:1 and 4.5:1. Contrast is computed from relative luminance, not perceived brightness. APCA (the upcoming WCAG 3 algorithm) better models perception and treats dark-on-light vs light-on-dark asymmetrically.

**Key points:**
- Test all states (hover, disabled, placeholder)
- Don't rely on color alone — pair with icons or text
- Tools: axe, Lighthouse, Stark, Chrome's contrast picker
- High-contrast mode (forced-colors) needs separate testing

---

### 40. SVG vs PNG vs WebP vs AVIF

**Frequency:** Medium

**Question:** Compare SVG, PNG, WebP, and AVIF image formats. Explain the strengths and use cases of each: SVG as scalable scriptable vector for icons/logos, PNG as lossless raster for screenshots and transparency, WebP as ~25-35% smaller than JPEG with transparency/animation, and AVIF as ~50% smaller than JPEG with better quality but slower encode. Also cover sprite/inline SVG over icon fonts, providing fallbacks for AVIF/WebP, using img for content versus CSS background for decoration, and compressing SVGs with SVGO.

**Answer:** SVG is vector — infinitely scalable, scriptable, ideal for icons/logos. PNG is lossless raster, good for screenshots and transparency but large. WebP gives ~25-35% smaller files than JPEG with similar quality and supports transparency/animation. AVIF compresses ~50% smaller than JPEG with better quality but slower encode; serve via `<picture>` with WebP fallback.

**Key points:**
- Sprite/inline SVG for icons; avoid icon fonts
- AVIF/WebP need explicit fallback for older browsers
- Use `<img>` for content images, CSS `background` for decoration
- Compress SVGs with SVGO

---

### 41. CSS variables vs SASS variables

**Frequency:** Medium

**Question:** Compare CSS custom properties with SASS variables. Explain that SASS variables resolve at build time into static CSS while CSS variables live at runtime (they cascade, inherit, can be changed via JS, and respond to media queries), and why theming requires CSS variables while SASS still adds value for mixins, loops, and file structure. Also cover scoping CSS variables to a selector, the var(--x, fallback) default, reading/writing them via JS with setProperty, and how they work in calc() but don't transition well.

**Answer:** SASS variables resolve at build time and produce static CSS — fast and simple but not dynamic. CSS custom properties (`--color: red`) live at runtime: they cascade, inherit, can be changed via JS, and respond to media queries. Theming (light/dark, brand swaps) requires CSS variables. SASS still adds value for mixins, loops, and modular file structure.

**Key points:**
- CSS variables can be scoped to a selector for component theming
- `var(--x, fallback)` provides a default
- JS read/write via `element.style.setProperty('--x', value)`
- CSS variables work in `calc()`, transitions don't animate them well

---

### 42. Animations: `transition` vs `@keyframes`; compositor-friendly properties

**Frequency:** Medium

**Question:** Explain the difference between CSS transition and @keyframes animations, when each is used, and which properties are compositor-friendly. Cover that transition interpolates between two states while @keyframes defines multi-step animations, that only transform and opacity animate on the compositor without triggering layout/paint, that animating width/top/box-shadow causes reflow every frame, and using will-change sparingly. Also address the ~16ms-per-frame 60fps budget, preferring transform: translate over top/left, respecting prefers-reduced-motion, and the View Transitions API.

**Answer:** `transition` interpolates between two states (typically driven by class toggles or pseudo-classes). `@keyframes` defines multi-step animations driven by `animation`. Only `transform` and `opacity` animate on the compositor without layout/paint; animating `width`, `top`, or `box-shadow` triggers expensive reflow on every frame. Use `will-change` sparingly to hint promotion.

**Key points:**
- 60fps means each frame has ~16ms to render
- Prefer `transform: translate` over `top/left`
- `prefers-reduced-motion` should disable non-essential animations
- View Transitions API enables cross-state animations declaratively

---

### 43. Iterators & generators

**Frequency:** Medium

**Question:** Explain iterators and generators in JavaScript. Cover the iterator protocol (next() returning {value, done}), the iterable protocol ([Symbol.iterator]()), and how generator functions (function*) produce iterators with yield pausing execution, enabling lazy sequences, custom iteration, and coroutine-style async before async/await. Also address for...of consuming iterables versus for...in enumerating keys, generator .return() and .throw(), async generators paired with for await...of, and spread/destructuring working on any iterable.

**Answer:** An iterator implements `next()` returning `{value, done}`. Iterables expose `[Symbol.iterator]()`. Generators (`function*`) produce iterators with `yield` pausing execution. They enable lazy sequences, custom iteration protocols, and (historically) coroutine-style async before async/await.

```js
function* range(n) { for (let i = 0; i < n; i++) yield i; }
for (const x of range(3)) console.log(x);
```

**Key points:**
- `for...of` consumes iterables; `for...in` enumerates keys
- Generators support `.return()` for cleanup and `.throw()`
- Async generators (`async function*`) pair with `for await...of`
- Spread/destructuring work on any iterable

---

### 44. ESM vs CommonJS; dynamic `import()`

**Frequency:** Medium

**Question:** Compare ES modules with CommonJS and explain dynamic import(). Cover that CommonJS (require/module.exports) is synchronous and dynamic while ESM (import/export) is static, async-capable, tree-shakeable, and the web standard, how dynamic import() returns a Promise for code splitting and conditional loading in both browser and Node, and the difficulties of mixed graphs. Also address ESM imports being hoisted and live-bound, package.json "type": "module", the exports field for subpath resolution, and top-level await being ESM-only.

**Answer:** CommonJS (`require`/`module.exports`) is synchronous, dynamic, Node's legacy module system. ESM (`import`/`export`) is static, async-capable, tree-shakeable, and the web standard. Dynamic `import()` returns a Promise and works in both browser and Node ESM — enables code splitting and conditional loading. Mixed graphs are tricky: ESM can import CJS, CJS importing ESM requires dynamic import.

**Key points:**
- ESM imports are hoisted and live-bound
- `package.json` `"type": "module"` flips Node default
- `exports` field controls subpath resolution
- Top-level await works in ESM only

---

### 45. Deep clone (`structuredClone`, JSON, recursive)

**Frequency:** Medium

**Question:** Compare ways to deep clone an object in JavaScript: structuredClone, the JSON.parse(JSON.stringify(...)) trick, and hand-written recursive clones. Explain what structuredClone handles (cycles, Maps, Sets, Dates, ArrayBuffers) and what it can't (functions, DOM nodes, symbols), what the JSON approach drops or breaks, and why recursive clones are slow and error-prone. Also cover shallow cloning with spread or Object.assign, structural-sharing libraries like Immer, structuredClone's use in postMessage, and WeakMap memoization for cycles.

**Answer:** `structuredClone(obj)` is the modern built-in: handles cycles, Maps, Sets, Dates, ArrayBuffers, but not functions/DOM nodes/symbols. `JSON.parse(JSON.stringify(obj))` is fast but drops functions, undefined, symbols, Dates become strings, and throws on cycles. Recursive clones give full control but are slow and error-prone — prefer the built-in.

**Key points:**
- Shallow clone: `{...obj}` or `Object.assign({}, obj)` (one level only)
- Immutability libs (Immer) produce structurally-shared clones
- `structuredClone` is also used by `postMessage`
- WeakMap memoization handles cycles in custom recursive clones

---

### 46. WeakMap / WeakSet

**Frequency:** Medium

**Question:** Explain WeakMap and WeakSet: that their keys/values are held weakly so they don't prevent garbage collection, why that makes them useful for associating metadata with DOM nodes or class instances without leaking, and why they're not iterable and expose no size (entries can vanish between checks). Also cover that keys must be objects or non-registered symbols, their use for private fields before class-field syntax, their use for caches keyed by ephemeral objects, and how WeakRef and FinalizationRegistry give finer-grained weak references.

**Answer:** `WeakMap` keys and `WeakSet` values are held weakly — they don't prevent GC of the referenced object. Useful for associating metadata with DOM nodes or class instances without leaking memory. They're not iterable and don't expose size, because entries can disappear between checks.

**Key points:**
- Keys must be objects (or non-registered symbols)
- Perfect for private fields pre-class-fields syntax
- Use for caches keyed by ephemeral objects
- `WeakRef` and `FinalizationRegistry` give finer-grained weak references

---

### 47. Map vs object as dictionary

**Frequency:** Medium

**Question:** Compare using a Map versus a plain object as a dictionary. Explain Map's advantages (insertion-order preservation, any key type, a real size, faster frequent add/delete) versus objects' traits (prototype-pollution risks like __proto__ and constructor, string/symbol keys only, JSON-friendly serialization), and when to choose each. Also cover Object.create(null) for a prototype-less dictionary, Map's faster and more predictable iteration, converting Map for JSON via Object.fromEntries, and TypeScript's Record<K, V> for object dictionaries.

**Answer:** `Map` preserves insertion order, accepts any key type (objects, functions), has a real `size`, and is faster for frequent add/delete. Plain objects have prototype pollution risks (`__proto__`, `constructor`), string/symbol keys only, and JSON-friendly serialization. Use `Map` for dynamic keyed collections, objects for fixed-shape records.

**Key points:**
- `Object.create(null)` gives a prototype-less dictionary
- `Map` iteration is faster and more predictable
- JSON doesn't natively serialize `Map` — convert via `Object.fromEntries`
- TypeScript's `Record<K, V>` is for object dictionaries

---

### 48. TS: `unknown` vs `any` vs `never`

**Frequency:** Medium

**Question:** Compare the TypeScript types unknown, any, and never. Explain that any opts out of type checking entirely and is viral, that unknown is the type-safe any that must be narrowed before use, and that never is the bottom type for unreachable code like exhaustive switches or functions that throw/loop forever, plus when to prefer each. Also cover the narrowing that unknown requires, how any infects through return types, empty arrays being inferred as never[] without context, and enabling noImplicitAny and strict.

**Answer:** `any` opts out of type checking entirely — viral and dangerous. `unknown` is the type-safe `any`: you must narrow before using it. `never` is the bottom type for unreachable code (exhaustive switches, functions that throw/loop forever). Prefer `unknown` over `any` for external input; use `never` to enforce exhaustiveness.

```ts
function assertNever(x: never): never { throw new Error(`Unexpected: ${x}`); }
```

**Key points:**
- `unknown` requires `typeof`/`instanceof`/predicate narrowing
- `any` infects through return types
- Empty arrays are inferred as `never[]` without context
- Use `noImplicitAny` and `strict` to catch slip-ups

---

### 49. TS: generics, constraints, defaults

**Frequency:** Medium

**Question:** Explain generics in TypeScript: parameterizing types (function id<T>(x: T): T), constraints (T extends Foo) that bound a type parameter, defaults (<T = string>), and how conditional types (T extends U ? X : Y) with infer enable type-level computation. Also address avoiding generics that don't actually relate two positions, using extends keyof T for property-name generics, NoInfer<T> in TS 5.4+ to block inference from one position, and how generic constraints power utilities like Pick and Record.

**Answer:** Generics parameterize types: `function id<T>(x: T): T`. Constraints (`T extends Foo`) bound the type parameter. Defaults (`<T = string>`) supply fallback types. Conditional types (`T extends U ? X : Y`) and `infer` enable powerful type-level computation.

**Key points:**
- Avoid generics that aren't actually relating two positions
- Use `extends keyof T` for property-name generics
- `NoInfer<T>` (TS 5.4+) prevents inference from one position
- Generic constraints power `Pick`, `Record`, etc.

---

### 50. TS: discriminated unions & exhaustiveness

**Frequency:** Medium

**Question:** Explain discriminated unions in TypeScript and how to enforce exhaustiveness. Cover how a shared literal discriminator field (kind/type) lets TypeScript narrow the variant, how switching over the discriminator and calling assertNever(x) in the default forces a compile error when a new variant is added, and give an example. Also address that discriminators must be literal types, that Redux/Zustand actions are classic discriminated unions, how the satisfies operator preserves narrow inference, and pairing with as const for inferred literals.

**Answer:** A discriminated union has a shared literal field (`kind`/`type`) that lets TS narrow the variant. Switch over the discriminator and call `assertNever(x)` in the default to force compile errors when a new variant is added.

```ts
type Shape = { kind: 'circle'; r: number } | { kind: 'square'; s: number };
function area(x: Shape) { switch (x.kind) { case 'circle': return Math.PI * x.r ** 2; case 'square': return x.s ** 2; } }
```

**Key points:**
- Discriminators must be literal types
- Redux/Zustand actions are classic discriminated unions
- `satisfies` operator helps preserve narrow inference
- Pair with `as const` for inferred literals

---

### 51. TS: utility types (Partial/Pick/Omit/Record/ReturnType)

**Frequency:** Medium

**Question:** Explain TypeScript's built-in utility types and how to compose them. Cover what each does: Partial, Required, Pick, Omit, Record, ReturnType, Parameters, and Awaited, and how they build DTOs, form types, and API contracts. Also address Readonly for immutable shapes, NonNullable for stripping null/undefined, Exclude/Extract for filtering union members, and rolling your own with mapped plus conditional types when the built-ins fall short.

**Answer:** Built-in utilities cover common transformations: `Partial<T>` makes all props optional, `Required<T>` the inverse, `Pick<T, K>` selects, `Omit<T, K>` removes, `Record<K, V>` builds a dictionary, `ReturnType<F>` extracts a function's return, `Parameters<F>` its args, `Awaited<T>` unwraps Promises. Compose them for DTOs, form types, and API contracts.

**Key points:**
- `Readonly<T>` for immutable shapes
- `NonNullable<T>` strips `null | undefined`
- `Exclude`/`Extract` filter union members
- Roll your own with mapped + conditional types when built-ins fall short

---

### 52. Currying & partial application

**Frequency:** Medium

**Question:** Explain currying and partial application, the difference between them, and what they enable. Cover how currying transforms f(a,b,c) into f(a)(b)(c) returning a function until all args arrive, how partial application fixes some arguments and returns a function expecting the rest, and how both enable composition, point-free style, and DI-style configuration. Also address Function.prototype.bind doing partial application, auto-curried versions in Ramda/lodash-fp, cautions around this and arity with variadic functions, and their use in HOFs like map.

**Answer:** Currying transforms `f(a,b,c)` into `f(a)(b)(c)`, returning a function until all args arrive. Partial application fixes some arguments and returns a function expecting the rest. Both enable composition, point-free style, and DI-style configuration.

```js
const add = a => b => a + b;
const inc = add(1);
```

**Key points:**
- `Function.prototype.bind` does partial application
- Ramda/lodash-fp ship auto-curried versions
- Beware of `this` and arity (variadic functions don't curry cleanly)
- Useful for HOFs like `map(addOne, list)`

---

### 53. HOFs & composition

**Frequency:** Medium

**Question:** Explain higher-order functions and function composition. Cover that HOFs take or return functions (map, filter, reduce, compose, pipe), how composition chains unary functions so pipe(f, g, h)(x) equals h(g(f(x))), and how this encourages small, testable units and declarative pipelines, with an example pipe implementation. Also address reduce being the universal HOF from which others derive, watching chain length for stack/perf impact, transducers composing without intermediate arrays, and the compose-right-to-left versus pipe-left-to-right convention.

**Answer:** Higher-order functions take or return functions: `map`, `filter`, `reduce`, `compose`, `pipe`. Composition chains unary functions: `pipe(f, g, h)(x) === h(g(f(x)))`. Encourages small, testable units and declarative pipelines.

```js
const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);
```

**Key points:**
- `reduce` is the universal HOF — all others can be derived
- Watch for chain length impact on stack/perf
- Transducers compose without intermediate arrays
- Compose right-to-left, pipe left-to-right by convention

---

### 54. Memoization & pitfalls

**Frequency:** Medium

**Question:** Explain memoization: how it caches function results by arguments, when it works best (pure, expensive, deterministic functions with hashable inputs), and its pitfalls (unbounded cache growth causing leaks, reference-based keys missing hits, race conditions in async memoization), plus using WeakMap-backed caches for object keys. Also cover React's useMemo/useCallback as memoization with referential identity, Map-backed memo leaking, LRU caches bounding memory, and not memoizing cheap operations where the lookup costs more.

**Answer:** Memoization caches function results by arguments. Works best for pure, expensive, deterministic functions with hashable inputs. Pitfalls: unbounded cache growth (memory leak), reference-based keys missing hits, race conditions for async memoization. Use WeakMap-backed caches when keying by objects.

**Key points:**
- React's `useMemo`/`useCallback` are memoization with referential identity
- `Map`-backed memo handles object keys but leaks
- LRU caches bound memory
- Don't memoize cheap operations — the cache lookup costs more

---

### 55. Iterating large lists without blocking main thread

**Frequency:** Medium

**Question:** Explain how to iterate or process a large list without blocking the main thread. Cover chunking work and yielding to the event loop with setTimeout(0), scheduler.yield(), requestIdleCallback, or MessageChannel, offloading pure CPU work to a Web Worker, and using virtualization (react-window, TanStack Virtual) so only visible rows mount for rendering. Also address scheduler.postTask with priority as the modern primitive, async generators pairing with chunked processing, long tasks over 50ms hurting INP, and React 18's startTransition deferring low-priority renders.

**Answer:** Break work into chunks and yield to the event loop with `setTimeout(0)`, `scheduler.yield()`, `requestIdleCallback`, or `MessageChannel`. For pure CPU work, offload to a Web Worker. For rendering, use virtualization (react-window, TanStack Virtual) so only visible rows mount.

**Key points:**
- `scheduler.postTask({ priority })` (Prioritized Task Scheduling API) is the modern primitive
- Async generators pair well with chunked processing
- Long tasks (>50ms) hurt INP
- React 18's `startTransition` defers low-priority renders

---

### 56. Web Workers vs Service Workers vs Shared Workers

**Frequency:** Medium

**Question:** Compare Web Workers, Service Workers, and Shared Workers, plus Worklets. Explain that Web Workers run CPU work on a background thread with no DOM access and communicate via postMessage, that Service Workers are network proxies enabling offline, push, and background sync with an install/activate/fetch lifecycle independent of pages, that Shared Workers can be accessed by multiple same-origin tabs, and that Worklets are lighter specialized workers. Also cover structured cloning versus Transferable zero-copy objects, Service Workers requiring HTTPS, Comlink wrapping postMessage as RPC, and Shared Workers being unsupported on Safari mobile.

**Answer:** Web Workers run scripts on a background thread for CPU work; no DOM access; communicate via `postMessage`. Service Workers are network proxies that enable offline, push notifications, and background sync — lifecycle (install/activate/fetch) is independent of pages. Shared Workers can be accessed by multiple same-origin tabs. Worklets (audio, paint, animation) are lighter-weight specialized workers.

**Key points:**
- Workers communicate via structured cloning or `Transferable` objects (zero-copy)
- Service Workers require HTTPS (except localhost)
- Comlink wraps `postMessage` as RPC
- Shared Workers are not supported in Safari mobile

---

### 57. `React.memo`

**Frequency:** Medium

**Question:** Explain what React.memo does: how wrapping a function component skips rendering when props are shallowly equal to the previous render, and when providing a custom comparator for deep equality is (rarely) worth it. Describe the conditions under which it actually helps (a frequently-rendering parent with usually-stable props) and how inline object/function props defeat it unless wrapped with useMemo/useCallback. Also cover how React 19's compiler auto-memoizes to reduce manual memo usage, when to prefer useMemo for expensive children over memo-plus-props plumbing, and confirming the win with the Profiler.

**Answer:** `React.memo(Component)` wraps a function component to skip rendering when props are shallowly equal to the previous render. Provide a custom comparator for deep equality (rarely worth it). Only helps if parent renders frequently and props are usually stable.

**Key points:**
- Inline object/function props defeat memo — wrap with `useMemo`/`useCallback`
- React 19 compiler auto-memoizes, reducing manual `memo` usage
- Use `useMemo` for expensive children rather than memo + props plumbing
- Test with Profiler to confirm the win

---

### 58. Context — propagation cost & splitting

**Frequency:** Medium

**Question:** Explain the propagation cost of React Context: why every consumer re-renders when the provider's value changes, and why putting frequently-changing values in one provider causes widespread re-renders. Describe the mitigation of splitting contexts by update frequency (for example separate providers for theme, current user, and cart), and when to reach for Zustand/Jotai/Redux with selector-based subscriptions instead. Also touch on useContextSelector for fine-grained subscription, wrapping the provider value in useMemo for stable identity, treating Context as dependency injection rather than high-frequency state, and React 19's use(Context).

**Answer:** Context re-renders every consumer when its value changes. Putting frequently-changing values in one provider causes widespread re-renders. Split contexts by update frequency (one for theme, one for current user, one for cart). For complex global state, use Zustand/Jotai/Redux which support selector-based subscriptions.

**Key points:**
- `useContextSelector` (third-party) enables fine-grained subscription
- Wrap provider value in `useMemo` to keep identity stable
- Context is for dependency injection, not high-frequency state
- React 19's `use(Context)` reads context conditionally

---

### 59. Refs & forwardRef

**Frequency:** Medium

**Question:** Explain refs in React: how they hold mutable values across renders without triggering re-renders, how useRef(initial).current is read and written, and how refs to DOM nodes enable imperative access like focus and measurement. Describe what forwardRef does and how React 19 makes ref a regular prop, deprecating forwardRef. Also cover why you shouldn't read refs during render (except for cached values), how useImperativeHandle curates what forwardRef exposes, when callback refs run, and why refs are escape hatches to use sparingly.

**Answer:** Refs hold mutable values across renders without triggering re-renders. `useRef(initial).current` reads/writes the value. Refs to DOM nodes give imperative access (focus, measure). `forwardRef` lets parent refs reach into a child component's DOM. React 19 makes `ref` a regular prop, deprecating `forwardRef`.

**Key points:**
- Don't read refs during render (except for cached values)
- `useImperativeHandle` curates what `forwardRef` exposes
- Callback refs (`ref={node => ...}`) run on mount/unmount
- Refs are escape hatches — prefer declarative patterns

---

### 60. Error boundaries

**Frequency:** Medium

**Question:** Explain React error boundaries: how they are class components implementing componentDidCatch and getDerivedStateFromError that catch errors from descendant render, lifecycle, and constructor code and show fallback UI. Describe what they do NOT catch (event handlers, async code, SSR errors) and how you'd handle those instead. Also cover the react-error-boundary library, logging to Sentry/Datadog inside componentDidCatch, resetting state by changing the boundary's key or via resetErrorBoundary, and the fact that React 19 still requires class boundaries.

**Answer:** Error boundaries are class components implementing `componentDidCatch` and `getDerivedStateFromError` that catch errors from descendant render/lifecycle/constructor and show fallback UI. They don't catch event handlers, async code, or SSR errors — handle those with `try/catch`. Wrap routes/features in boundaries for graceful degradation.

**Key points:**
- React-error-boundary library provides a hook-friendly wrapper
- Log to Sentry/Datadog inside `componentDidCatch`
- Reset state by changing the boundary's `key` or via `resetErrorBoundary`
- React 19 still requires class boundaries — no hook equivalent yet

---

### 61. Suspense & concurrent features

**Frequency:** Medium

**Question:** Explain Suspense and React's concurrent features: how Suspense shows a fallback while a child throws a Promise (for data fetching or a lazy import), and how concurrent features like startTransition and useDeferredValue let React interrupt low-priority renders to keep input responsive. Describe how Server Components and streaming SSR are built on Suspense, flushing HTML chunks as data resolves. Also touch on lazy(() => import(...)), what useTransition returns, nesting boundaries for granular loading states, and how throwing Promises is now formalized via use().

**Answer:** `Suspense` shows a fallback while a child throws a Promise (data fetch, lazy import). Concurrent features (`startTransition`, `useDeferredValue`) let React interrupt low-priority renders to keep input responsive. Server Components and streaming SSR are built on Suspense — chunks of HTML flush as data resolves.

**Key points:**
- `lazy(() => import(...))` integrates with Suspense
- `useTransition` returns `[isPending, startTransition]`
- Boundaries can be nested for granular loading states
- Throwing Promises from arbitrary hooks is now formalized via `use()`

---

### 62. Server Components vs client components

**Frequency:** Medium

**Question:** Explain React Server Components versus client components: how RSC run on the server, never ship to the client, and can directly access databases and secrets, rendering to a serialized format that client components hydrate around, with 'use client' marking the module boundary. Discuss the tradeoffs, reduced bundle size and centralized data fetching versus interactivity constrained to client islands. Also cover why Server Components can't use state, effects, or browser APIs, why props passed server-to-client must be serializable, how Server Actions handle mutations, and which frameworks are the primary adopters.

**Answer:** React Server Components (RSC) run on the server, never ship to the client, and can directly access databases/secrets. They render to a serialized format that client components hydrate around. `'use client'` marks a module boundary. RSC reduces bundle size and centralizes data fetching, but constrains interactivity to client islands.

**Key points:**
- Server Components can't use state, effects, or browser APIs
- Props passed from server to client must be serializable
- Server Actions handle mutations
- Next.js App Router and Remix v3 are primary adopters

---

### 63. State mgmt: Redux vs Zustand vs Jotai vs Context

**Frequency:** Medium

**Question:** Compare the major state management options and when to choose each: Redux (Toolkit) for large apps needing devtools, middleware, and time-travel debugging; Zustand as a tiny hook-based store with selector subscriptions; Jotai with atomic state primitives composed via derivations for fine-grained reactivity; and Context for dependency injection of rarely-changing values rather than high-frequency state. Also address separating server state (React Query, SWR) from client state, avoiding global state for component-local concerns, how Zustand/Jotai work with React 18 concurrent rendering, and Redux Toolkit Query for data fetching.

**Answer:** Redux (Toolkit) excels at large apps needing devtools, middleware, time-travel debugging — verbose but predictable. Zustand is a tiny hook-based store with selector subscriptions — minimal boilerplate. Jotai uses atomic state primitives composed with derivations — fine-grained reactivity. Context is for dependency injection of rarely-changing values, not high-frequency state.

**Key points:**
- Server state (React Query, SWR) is separate from client state
- Avoid global state for component-local concerns
- Zustand/Jotai work great with React 18 concurrent rendering
- Redux Toolkit Query covers data fetching too

---

### 64. Routing: client- vs server-side

**Frequency:** Medium

**Question:** Compare client-side and server-side routing: how server-side routing returns a full HTML document per URL (simple, SEO-friendly, no JS required) versus client-side routing intercepting navigation to fetch data and swap views without a page reload (faster transitions but requires JS). Explain how modern frameworks blend both with hybrid/isomorphic routing where the server renders the initial page and the client takes over. Also cover how the History API powers client routing, why <a> should still work without JS as progressive enhancement, code-splitting routes for smaller initial bundles, and the View Transitions API.

**Answer:** Server-side routing returns a full HTML document per URL — simple, SEO-friendly, no JS required. Client-side routing intercepts navigation, fetches data, and swaps views without page reload — faster transitions but requires JS. Modern frameworks blend both: server renders the initial page, client takes over for subsequent navigations (hybrid/isomorphic routing).

**Key points:**
- History API (`pushState`/`replaceState`) powers client routing
- `<a>` should still work without JS (progressive enhancement)
- Code-split routes for smaller initial bundles
- View Transitions API enables smooth client-route animations

---

### 65. Container/presentational vs hooks-driven

**Frequency:** Medium

**Question:** Compare the classic container/presentational split with a hooks-driven architecture: how the container/presentational pattern isolated data fetching from rendering (useful pre-hooks) versus hooks-driven design co-locating data needs with components via custom hooks like useUser and useCart to reduce prop-drilling, and how Server Components push this further by making the data layer disappear from client code. Also address how custom hooks are the modern container and testable in isolation, why presentational components remain valuable for design systems, the compound components pattern, and avoiding premature abstraction.

**Answer:** The classic container/presentational split isolated data fetching from rendering — useful pre-hooks. Hooks-driven architecture co-locates data needs with components via custom hooks (`useUser`, `useCart`), reducing prop-drilling. Server Components push this further by making the data layer disappear from client code.

**Key points:**
- Custom hooks are the modern "container" — testable in isolation
- Presentational components remain valuable for design systems
- Compound components pattern groups related UI (Tabs/Tab)
- Avoid premature abstraction — extract when patterns emerge

---

### 66. Tree shaking — what blocks it

**Frequency:** Medium

**Question:** Explain tree shaking and what blocks it: how it eliminates unused exports during bundling, and the requirements, ESM for static analysis, side-effect-free modules ("sideEffects": false in package.json), and pure top-level code. Enumerate the common blockers: CJS modules, dynamic require, top-level side effects, re-exports through barrel files, and transpiling to CJS too early. Also cover /*#__PURE__*/ annotations, why lodash-es tree-shakes while CJS lodash does not, avoiding import * as in favor of named imports, and verifying with a bundle analyzer.

**Answer:** Tree shaking eliminates unused exports during bundling. Requires ESM (static analysis), sideEffect-free modules (`"sideEffects": false` in package.json), and pure top-level code. Blockers: CJS modules, dynamic `require`, top-level side effects, re-exports through barrel files, transpiling to CJS too early.

**Key points:**
- `/*#__PURE__*/` annotations mark calls as side-effect-free
- Lodash-es tree-shakes; lodash (CJS) does not
- Avoid `import * as` — name imports
- Verify with bundle analyzer

---

### 67. CDN & edge caching

**Frequency:** Medium

**Question:** Explain CDN and edge caching: how CDNs cache static assets at PoPs near users to reduce latency and origin load, how modern CDNs (Cloudflare, Fastly, Vercel) also run edge functions for SSR/personalization, and common cache strategies like origin shield, tiered caching, purge by tag, and signed URLs, with edge SSR running globally at low TTFB. Also cover how the cache key includes the URL and sometimes headers/cookies controlled via Vary, purge-by-tag for fine-grained invalidation, why HTTP/2 push is largely abandoned in favor of early hints/preload, and how origin shield reduces cache misses to the origin.

**Answer:** CDNs cache static assets at PoPs near users, reducing latency and origin load. Modern CDNs (Cloudflare, Fastly, Vercel) also run edge functions for SSR/personalization. Cache strategies: origin shield, tiered caching, purge by tag, signed URLs. Edge SSR runs your code globally at <50ms TTFB.

**Key points:**
- Cache key includes URL, sometimes headers/cookies — control via `Vary`
- Purge by tag for fine-grained invalidation
- HTTP/2 push is largely abandoned; use early hints / preload
- Origin shield reduces cache misses to the origin

---

### 68. Cookies: SameSite/Secure/HttpOnly

**Frequency:** Medium

**Question:** Explain cookie security attributes: (1) HttpOnly hiding cookies from JS to mitigate XSS theft, (2) Secure requiring HTTPS, (3) SameSite modes, Strict blocking all cross-site sends, Lax (the default) allowing top-level navigation GETs, and None allowing all cross-site but requiring Secure, and (4) Partitioned (CHIPS) opting into per-top-site storage as third-party cookies phase out. Also cover the recommended attributes for auth tokens, what embedded widgets need, the ~4KB size limit and header bloat, and using the __Host- prefix for the strictest guarantees.

**Answer:** `HttpOnly` hides from JS (mitigates XSS theft). `Secure` requires HTTPS. `SameSite=Strict` blocks cross-site sends entirely; `Lax` (default) allows top-level navigation GETs; `None` allows all cross-site but requires `Secure`. `Partitioned` (CHIPS) opts into per-top-site cookie storage as third-party cookies phase out.

**Key points:**
- Auth tokens should be `HttpOnly; Secure; SameSite=Lax`
- Embedded widgets need `SameSite=None; Secure; Partitioned`
- Cookie size limit ~4KB; consider header bloat
- Use `__Host-` prefix for strictest security guarantees

---

### 69. Frontend auth: JWT in localStorage vs httpOnly cookie

**Frequency:** Medium

**Question:** Compare storing a JWT in localStorage versus an httpOnly cookie for frontend auth: how localStorage is readable by any JS and thus vulnerable to XSS token theft, versus httpOnly cookies being immune to JS access and sent automatically but vulnerable to CSRF (mitigated with SameSite plus CSRF tokens). Give guidance on which is standard for browser-based auth and when localStorage is acceptable. Also cover refresh-token rotation to reduce blast radius, why sessionStorage is also JS-accessible, the BFF (Backend-for-Frontend) pattern keeping tokens off the client, and OAuth PKCE for public clients.

**Answer:** `localStorage` is readable by any JS — XSS steals tokens. `httpOnly` cookies are immune to JS access, sent automatically, but vulnerable to CSRF (mitigate with SameSite + CSRF tokens). Cookies are the standard for browser-based auth; localStorage is acceptable only for short-lived tokens in pure-API SPAs with strong CSP.

**Key points:**
- Refresh-token rotation reduces blast radius
- Avoid storing tokens in `sessionStorage` either (still JS-accessible)
- BFF (Backend-for-Frontend) pattern keeps tokens off the client entirely
- OAuth PKCE is required for public clients

---

### 70. WebSocket vs SSE vs long-polling

**Frequency:** Medium

**Question:** Compare WebSocket, SSE, and long-polling: how WebSocket is bidirectional, low-latency, and ideal for chat/games/collaborative editing (requiring server support and handling binary), how SSE is one-way server-to-client over HTTP (simpler, auto-reconnect, proxy-friendly, but text-only with limited connections per origin), and how long-polling emulates push by holding requests open as a fallback. Also cover SSE's fit for notifications, live feeds, and AI streaming, WebSocket needing heartbeats to survive idle timeouts, WebTransport (HTTP/3) as the emerging successor, and SSE's per-origin connection limits in HTTP/1.1.

**Answer:** WebSocket is bidirectional, low-latency, ideal for chat/games/collab editing — requires server support and handles binary. SSE is one-way (server → client) over HTTP, simpler, auto-reconnect, works through most proxies, but text-only and limited browser connections per origin. Long-polling is a fallback that emulates push by holding requests open.

**Key points:**
- SSE works great for notifications, live feeds, AI streaming
- WebSocket needs heartbeats to survive idle timeouts
- WebTransport (HTTP/3) is the emerging successor for low-latency bidirectional
- Server-Sent Events have per-origin connection limits in HTTP/1.1

---

### 71. Image optimization checklist

**Frequency:** Medium

**Question:** Walk through an image optimization checklist: picking the right format (AVIF/WebP with a fallback), serving via <picture> with srcset/sizes, setting width/height to reserve space, lazy-loading below-the-fold images with loading="lazy", marking the LCP image with fetchpriority="high", using a CDN with on-the-fly resizing, stripping metadata, compressing aggressively, and using SVG for icons/logos. Also cover why the LCP image should NOT be lazy, how decoding="async" avoids blocking the main thread, using the aspect-ratio CSS property to avoid CLS, and Blurhash/LQIP placeholders for perceived performance.

**Answer:** Pick the right format (AVIF/WebP with fallback), serve via `<picture>` with `srcset`/`sizes`, set `width`/`height` to reserve space, lazy-load below-the-fold with `loading="lazy"`, mark LCP image with `fetchpriority="high"`, use a CDN with on-the-fly resizing, strip metadata, compress aggressively. SVG for icons/logos.

**Key points:**
- LCP image should NOT be lazy
- `decoding="async"` avoids blocking the main thread
- Use `aspect-ratio` CSS to avoid CLS
- Blurhash/LQIP placeholders improve perceived performance

---

### 72. Font loading (`font-display: swap`, preconnect, subsetting)

**Frequency:** Medium

**Question:** Explain font loading optimization: how font-display: swap shows a fallback immediately then swaps to the web font (FOUT) to avoid invisible text (FOIT), how preconnect to the font origin saves a round trip, how subsetting strips unused glyphs to save bytes, and when to self-host or use font-display: optional for strict CLS budgets. Also cover variable fonts replacing multiple weight files, WOFF2 being the only modern format needed, the size-adjust CSS property minimizing layout shift between fallback and web font, and preloading critical fonts with <link rel="preload" as="font" crossorigin>.

**Answer:** `font-display: swap` shows fallback immediately then swaps to web font (FOUT) — avoids invisible text (FOIT). `preconnect` to font origin saves a round trip. Subsetting strips unused glyphs (Latin-only saves huge bytes). Self-host or use `font-display: optional` for strict CLS budgets.

**Key points:**
- Variable fonts replace multiple weight files
- WOFF2 is the only modern format you need
- `size-adjust` CSS minimizes layout shift between fallback and web font
- Preload critical fonts: `<link rel="preload" as="font" crossorigin>`

---

### 73. Bundlers: Webpack vs Vite vs esbuild vs Rollup

**Frequency:** Medium

**Question:** Compare the major JavaScript bundlers: Webpack as the mature, plugin-heavy but slow workhorse; Vite using native ESM in dev (no bundling) with Rollup for production for fast HMR and great DX; esbuild as an extremely fast Go-based bundler/transpiler used inside Vite for transforms; and Rollup excelling at library bundles with clean ESM output and tree-shaking. Note the emerging Rust-based Webpack-compatible replacements Rspack and Turbopack. Also cover why Vite is the default for new apps, Webpack's continued enterprise/legacy dominance, esbuild's limited plugin API versus Rollup, and library authors typically choosing Rollup or tsup.

**Answer:** Webpack is the mature, plugin-heavy workhorse — slow but flexible. Vite uses native ESM in dev (no bundling) and Rollup for production — fast HMR, great DX. esbuild is a Go-based bundler/transpiler, extremely fast, used inside Vite for transforms. Rollup excels at library bundles (clean ESM output, tree-shaking). Rspack (Rust) and Turbopack (Rust) are emerging Webpack-compatible replacements.

**Key points:**
- Vite is the default for new frontend apps
- Webpack still dominant for enterprise/legacy
- esbuild's plugin API is limited compared to Rollup
- Library authors typically pick Rollup or tsup (esbuild-based)

---

### 74. Testing pyramid

**Frequency:** Medium

**Question:** Explain the testing pyramid and its modern variants: many fast unit tests at the base, fewer integration tests in the middle, and a few slow end-to-end tests at the top, and how the testing trophy shifts weight toward integration tests with React Testing Library that catch real bugs without brittleness, reserving E2E for critical user journeys like login and checkout. Also cover avoiding testing implementation details, aiming for fast feedback with millisecond unit tests, how contract tests (Pact) replace some cross-service integration tests, and why coverage is a sanity check rather than a target.

**Answer:** Many fast unit tests at the base, fewer integration tests in the middle, few slow end-to-end tests at the top. Modern variants (testing trophy) put more weight on integration tests with React Testing Library — they catch real bugs without brittleness. E2E covers critical user journeys (login, checkout) only.

**Key points:**
- Avoid testing implementation details
- Aim for fast feedback — unit tests in milliseconds
- Contract tests (Pact) replace some integration tests across services
- Coverage is a sanity check, not a target

---

### 75. Jest vs Vitest vs Playwright vs Cypress

**Frequency:** Medium

**Question:** Compare Jest, Vitest, Playwright, and Cypress: Jest as the long-standing React/Node unit test runner; Vitest as the Vite-native, faster, ESM-first alternative with a Jest-compatible API; Playwright as a multi-browser E2E framework (Chromium/Firefox/WebKit) with strong parallelization and tracing; and Cypress as the developer-friendly E2E runner with time-travel debugging that runs in-browser and is single-browser per test. Also cover Vitest as the new default for Vite/SvelteKit/Astro projects, Playwright gaining ground over Cypress for cross-browser, both supporting component testing, and using MSW for API mocking in both unit and E2E.

**Answer:** Jest is the long-standing React/Node unit test runner. Vitest is the Vite-native, faster, ESM-first alternative with Jest-compatible API. Playwright is a multi-browser E2E framework (Chromium/Firefox/WebKit) with great parallelization and tracing. Cypress is the developer-friendly E2E runner with time-travel debugging but runs in-browser and is single-browser per test.

**Key points:**
- Vitest is the new default for Vite/SvelteKit/Astro projects
- Playwright is gaining ground over Cypress for cross-browser
- Both Playwright and Cypress support component testing too
- Use MSW for API mocking in both unit and E2E

---

### 76. A11y testing (axe-core, lighthouse, screen readers)

**Frequency:** Medium

**Question:** Explain accessibility testing: how automated tools (axe-core via jest-axe or Playwright, and Lighthouse) catch roughly 30-50% of issues like missing labels, contrast, and ARIA misuse, and how manual testing fills the rest, keyboard-only navigation, screen readers (NVDA, JAWS, VoiceOver), zoom to 200%, and reduced-motion, with checks baked into CI to prevent regressions. Also cover the Storybook addon-a11y running axe per story, treating the Lighthouse a11y score as a starting point rather than a finish line, testing with real assistive tech rather than emulation, and including users with disabilities when possible.

**Answer:** Automated tools (axe-core via jest-axe or Playwright, Lighthouse) catch ~30-50% of issues — missing labels, contrast, ARIA misuse. Manual testing fills the rest: keyboard-only navigation, screen readers (NVDA, JAWS, VoiceOver), zoom to 200%, reduced-motion. Bake checks into CI to prevent regressions.

**Key points:**
- Storybook addon-a11y runs axe per story
- Lighthouse a11y score is a starting point, not a finish line
- Test with real assistive tech, not just emulation
- Include users with disabilities in testing when possible

---

### 77. PWA: SW lifecycle, offline strategy, install prompt

**Frequency:** Medium

**Question:** Explain building a PWA: the Service Worker lifecycle of install (cache the shell), activate (clean old caches), and fetch (intercept network); the offline strategies of cache-first for static assets, network-first for APIs with a fallback, and stale-while-revalidate for a good UX/freshness balance; and how the beforeinstallprompt event lets you defer the install prompt to a user-chosen moment, with Workbox abstracting common patterns. Also cover what makes a PWA installable (manifest + HTTPS + SW + offline page), the update flow of prompting the user to reload when a new SW activates, Background Sync queuing failed mutations for retry, and iOS's limited PWA support requiring real-device testing.

**Answer:** Service Worker lifecycle: `install` (cache shell), `activate` (clean old caches), `fetch` (intercept network). Offline strategies: cache-first (static assets), network-first (API with fallback), stale-while-revalidate (good UX/freshness balance). The `beforeinstallprompt` event lets you defer the install prompt to a user-chosen moment. Workbox abstracts common patterns.

**Key points:**
- Manifest + HTTPS + SW + offline page = installable PWA
- Update flow: prompt user to reload when a new SW activates
- Background Sync queues failed mutations for retry
- iOS has limited PWA support; test on real devices

---

### 78. Critical CSS & FOUC

**Frequency:** Low

**Question:** Explain what critical CSS is, why inlining it in the head eliminates render-blocking and improves LCP, and what causes FOUC (flash of unstyled content). Mention tooling like Critters, Beasties, or Next.js that extract critical CSS. Also cover the pattern of inlining critical CSS then loading the full stylesheet asynchronously with media="print" onload, preloading key fonts/CSS, why FOUT is usually preferred over FOIT, and why to avoid @import in CSS.

**Answer:** Critical CSS is the minimal CSS needed to render above-the-fold content; inlining it in `<head>` eliminates render-blocking and reduces LCP. FOUC (flash of unstyled content) occurs when HTML paints before CSS arrives — common with async CSS or font swaps. Tools like Critters, Beasties, or Next.js extract critical CSS automatically.

**Key points:**
- Inline critical CSS, then load full stylesheet with `media="print" onload="this.media='all'"`
- Preload key fonts/CSS with `<link rel="preload">`
- FOUT (text) is usually preferred over FOIT (invisible text)
- Avoid `@import` in CSS — it serializes downloads

---

### 79. Garbage collection (mark-and-sweep)

**Frequency:** Low

**Question:** Explain how JavaScript garbage collection works via generational mark-and-sweep: marking roots (globals, stack) then reachable objects and sweeping the rest, and how V8 splits the heap into young (Scavenger) and old (Mark-Compact) generations. Explain that you can't force GC but you can avoid leaks by detaching listeners, clearing timers, nulling long-lived cache references, and preferring WeakMap/WeakRef. Also cover why reference counting failed on cycles, finding detached DOM nodes with the Memory profiler, closures retaining their scope chain, and FinalizationRegistry.

**Answer:** Modern JS engines use generational mark-and-sweep: roots (globals, stack) are marked, then reachable objects, and the rest is swept. V8 splits heap into young (Scavenger) and old generation (Mark-Compact). You can't force GC, but you can avoid leaks: detach event listeners, clear timers, null out references in long-lived caches, and prefer `WeakMap`/`WeakRef` for caches keyed by objects.

**Key points:**
- Reference counting (old IE) failed on cycles
- DevTools Memory profiler finds detached DOM nodes
- Closures retain their entire scope chain
- `FinalizationRegistry` runs cleanup when objects are GC'd (use sparingly)

---

### 80. Symbols; `Symbol.iterator`

**Frequency:** Low

**Question:** Explain what Symbols are in JavaScript (unique, immutable primitives) and their common uses as non-colliding property keys and as well-known protocol hooks. Cover Symbol.iterator for custom iteration, Symbol.asyncIterator for async, Symbol.toPrimitive for coercion, and Symbol.for(key) for the global registry. Also address that symbol-keyed properties don't appear in for...in or Object.keys, that JSON.stringify skips them, TypeScript's unique-symbol typing, and using symbols for library extension points to avoid name clashes.

**Answer:** Symbols are unique, immutable primitives often used as non-colliding property keys or as well-known protocol hooks. `Symbol.iterator` lets you define custom iteration, `Symbol.asyncIterator` for async, `Symbol.toPrimitive` for coercion. `Symbol.for(key)` looks up a shared symbol in a global registry.

**Key points:**
- Symbol-keyed properties don't appear in `for...in` or `Object.keys`
- `JSON.stringify` skips symbol keys
- TypeScript supports unique-symbol typing
- Use for library extension points to avoid name clashes

---

### 81. Proxies & Reflect

**Frequency:** Low

**Question:** Explain JavaScript Proxy and Reflect. Cover how a Proxy wraps a target with traps (get, set, has, deleteProperty, apply, and others) to intercept fundamental operations, how it powers reactivity systems like Vue 3 and MobX and validation/observation libraries, and how Reflect mirrors the traps as static methods to forward operations to the target. Also address that proxies can't intercept internal slots (Map's data, Date's timestamp), their non-trivial performance overhead, Proxy.revocable, and their role as the foundation of modern reactivity.

**Answer:** `Proxy` wraps an object with traps (`get`, `set`, `has`, `deleteProperty`, `apply`, etc.) to intercept fundamental operations. Powers Vue 3's reactivity, MobX, and validation/observation libraries. `Reflect` mirrors proxy traps as static methods, making it easy to forward operations to the original target.

```js
const p = new Proxy(target, { get(t, k, r) { console.log('read', k); return Reflect.get(t, k, r); } });
```

**Key points:**
- Proxies can't intercept internal slots (Map's data, Date's timestamp)
- Performance overhead is non-trivial; avoid in hot paths
- Can be revocable via `Proxy.revocable`
- Foundation of modern reactivity systems

---

### 82. TS: declaration merging

**Frequency:** Low

**Question:** Explain declaration merging in TypeScript. Cover how multiple interface declarations with the same name merge into one, how namespaces merge with classes/functions, and how module augmentation (declare module 'foo') extends third-party types (for example adding Jest matchers, fields to Express Request, or module-federation remotes). Also address that only interface and namespace merge while type aliases conflict, global augmentation via declare global, its use for theme typing like styled-components' DefaultTheme, and avoiding merging across unrelated modules.

**Answer:** Multiple `interface` declarations with the same name merge into one. Namespaces merge with classes/functions. Module augmentation (`declare module 'foo'`) extends third-party types — e.g., add custom matchers to Jest, add fields to Express `Request`, register module-federation remotes.

**Key points:**
- Only `interface` and `namespace` merge; `type` aliases conflict
- Global augmentation via `declare global { }`
- Useful for theme typing (`styled-components`'s `DefaultTheme`)
- Avoid merging across unrelated modules — confusing to readers

---

### 83. TS: `as const` & literal types

**Frequency:** Low

**Question:** Explain the as const assertion and literal types in TypeScript. Cover how as const freezes a value to its narrowest literal type (arrays become readonly tuples, objects get readonly literal properties), why it's essential for action creators, route definitions, and config that drives inference, and give an example that derives a string-literal union from an array. Also address pairing with satisfies to validate without widening, enabling string-literal unions from arrays, preventing 'foo' from widening to string, and locking down nested object shapes.

**Answer:** `as const` freezes a value to its narrowest literal type — arrays become readonly tuples, objects get readonly literal properties. Essential for action creators, route definitions, and config that drives type inference.

```ts
const routes = ['/home', '/about'] as const; // readonly ['/home', '/about']
type Route = typeof routes[number];
```

**Key points:**
- Pairs with `satisfies` to validate without widening
- Enables string-literal unions from arrays
- Prevents `'foo'` widening to `string`
- Works on object literals to lock down nested shapes

---

### 84. Error subclassing, `cause`, async stack traces

**Frequency:** Low

**Question:** Explain error handling patterns in modern JavaScript/TypeScript: subclassing Error for domain-specific types and setting name for clear instanceof checks, the ES2022 error cause option (new Error(msg, { cause: original })) for preserving chains, how V8 stitches async stack traces across await, and why you should always throw Error objects rather than strings. Also cover Error.captureStackTrace in Node error factories, cause as the standard wrap-and-rethrow pattern, avoiding empty catch blocks, and typing caught errors as unknown.

**Answer:** Subclass `Error` to add domain-specific error types; set `name` for clear `instanceof` checks. ES2022 added `new Error(msg, { cause: original })` to preserve chains. Modern V8 stitches async stack traces across `await` boundaries. Always `throw new Error(...)`, never throw strings — you lose the stack.

```ts
class NotFoundError extends Error { constructor(id: string) { super(`Missing ${id}`); this.name = 'NotFoundError'; } }
```

**Key points:**
- Use `Error.captureStackTrace` in custom error factories (Node)
- `cause` is the standard wrap-and-rethrow pattern
- Avoid swallowing errors with empty `catch`
- Type errors as `unknown` in `catch` clauses (TS 4.4+ default)

---

### 85. Hydration mismatches

**Frequency:** Low

**Question:** Explain hydration mismatches in React: how hydration attaches event listeners to server-rendered HTML and why mismatches occur when client output differs from the server (random IDs, locale-formatted dates, browser-only conditionals). Describe how React 18 recovers by re-rendering the mismatched subtree while warning in dev, and the fixes: useId for stable server/client IDs, suppressHydrationWarning for known divergences, and deferring browser-only content via useEffect/useSyncExternalStore. Also touch on Date.now()/Math.random() in render, locale/timezone culprits, React 19's improvements, and how streaming SSR can mask issues.

**Answer:** Hydration attaches event listeners to server-rendered HTML. Mismatches occur when client output differs from server (random IDs, locale-formatted dates, browser-only conditionals). React 18 recovers by re-rendering the mismatched subtree but warns in dev. Fix with `useId` (stable across server/client), `suppressHydrationWarning` for known divergences, or defer browser-only content with `useEffect`/`useSyncExternalStore`.

**Key points:**
- `Date.now()`/`Math.random()` in render cause mismatches
- Locale/timezone differences are frequent culprits
- React 19 improves error messages and reduces silent corruption
- Streaming SSR can mask issues — test with JS disabled

---

### 86. Angular change detection (Zone.js, OnPush, signals)

**Frequency:** Low

**Question:** Explain Angular change detection across its evolution: how Zone.js monkey-patches async APIs to trigger change detection automatically, how ChangeDetectionStrategy.OnPush skips a component unless inputs change by reference, an event fires from it, or an async pipe emits, and how Angular 17+ signals provide fine-grained reactive primitives that bypass Zone entirely to enable zoneless apps in v18+. Also cover OnPush's performance impact in large apps, how signal()/computed()/effect() replace many BehaviorSubject patterns, provideExperimentalZonelessChangeDetection, and how detached components run CD only via ChangeDetectorRef.detectChanges().

**Answer:** Angular traditionally uses Zone.js to monkey-patch async APIs and trigger change detection automatically. `ChangeDetectionStrategy.OnPush` skips a component unless inputs change by reference, an event fires from it, or an async pipe emits. Angular 17+ introduces signals — fine-grained reactive primitives that bypass Zone entirely and enable zoneless apps in v18+.

**Key points:**
- OnPush dramatically improves performance in large apps
- Signals (`signal()`, `computed()`, `effect()`) replace many `BehaviorSubject` patterns
- `provideExperimentalZonelessChangeDetection` in v18
- Detached components run CD only via `ChangeDetectorRef.detectChanges()`

---

### 87. Angular DI hierarchy

**Frequency:** Low

**Question:** Explain Angular's dependency injection hierarchy: how DI resolves providers by walking up the element injector tree and then the module/environment injector tree, what providedIn: 'root' does as a tree-shakeable singleton, and how component-level providers create per-instance services scoped to a feature. Discuss how inject() (v14+) replaces constructor injection in many contexts. Also cover the provider configuration options useClass/useFactory/useValue/useExisting, multi-providers with multi: true, standalone components' own injector hierarchy, and the resolution modifiers @Optional, @Self, @SkipSelf, and @Host.

**Answer:** Angular DI resolves providers by walking up the element injector tree, then the module/environment injector tree. `providedIn: 'root'` registers a tree-shakeable singleton. Component-level `providers` create per-instance services (great for state-scoped-to-feature). `inject()` (v14+) replaces constructor injection in many contexts.

**Key points:**
- `useClass`/`useFactory`/`useValue`/`useExisting` configure providers
- Multi-providers (`multi: true`) collect arrays of values
- Standalone components have their own injector hierarchy
- `@Optional`, `@Self`, `@SkipSelf`, `@Host` control resolution

---

### 88. RxJS: switchMap vs mergeMap vs concatMap vs exhaustMap

**Frequency:** Low

**Question:** Explain how RxJS switchMap, mergeMap, concatMap, and exhaustMap all flatten an Observable-of-Observables but differ in concurrency handling: (1) switchMap cancels the previous inner Observable on a new value (ideal for type-ahead search), (2) mergeMap runs all in parallel (good for independent requests), (3) concatMap queues them sequentially to preserve order, and (4) exhaustMap ignores new emissions while one is in-flight (perfect for submit buttons). Also address why switchMap is the right default for HTTP triggered by user input, how mergeMap can swamp the server and how to limit concurrency, concatMap's latency cost, and how exhaustMap prevents double-submission.

**Answer:** All four flatten Observable-of-Observables but handle concurrency differently. `switchMap` cancels the previous inner Observable when a new value arrives — ideal for type-ahead search. `mergeMap` runs all in parallel — good for independent requests. `concatMap` queues them sequentially — preserves order. `exhaustMap` ignores new emissions while one is in-flight — perfect for submit buttons.

**Key points:**
- `switchMap` is the right default for HTTP triggered by user input
- `mergeMap` can swamp the server — limit concurrency with `mergeMap(fn, n)`
- `concatMap` preserves order at the cost of latency
- `exhaustMap` prevents double-submission

---

### 89. Angular standalone vs NgModules

**Frequency:** Low

**Question:** Compare Angular standalone components with NgModules: how standalone components (v14+, default in v17+) declare their own imports and providers and skip NgModule registration for a simpler mental model, better tree-shaking, and faster builds, versus NgModules remaining for grouping declarations and legacy interop. Give guidance on what new apps and libraries should do. Also cover how bootstrapApplication replaces NgModule bootstrap, route-level lazy loading with loadComponent, functional feature configuration via provideRouter and provideHttpClient, and the standalone migration schematic.

**Answer:** Standalone components (v14+, default in v17+) declare their own imports/providers and skip NgModule registration — simpler mental model, better tree-shaking, faster builds. NgModules remain for grouping related declarations and legacy interop. New apps should be 100% standalone; libraries are migrating.

**Key points:**
- `bootstrapApplication(AppComponent, { providers: [...] })` replaces `NgModule` bootstrap
- Route-level lazy loading: `loadComponent: () => import(...)`
- `provideRouter`, `provideHttpClient` configure features functionally
- Migration schematic: `ng generate @angular/core:standalone`

---

### 90. Vue composition vs options API

**Frequency:** Low

**Question:** Compare Vue's Options API and Composition API: how the Options API groups code by lifecycle/data/methods (easy to learn but scattering one feature's logic across options) versus the Composition API using setup/<script setup> to group code by concern through reusable composables (better for TypeScript and large components). Note that both ship in Vue 3 and which is recommended for new code. Also cover the <script setup> ergonomic syntax, composables replacing mixins, the Options API having no planned deprecation, and the reactivity primitives ref, reactive, computed, and watch.

**Answer:** Options API groups code by lifecycle/data/methods — easy to learn, but logic for one feature scatters across options. Composition API (`setup`/`<script setup>`) groups code by concern using composables (reusable hook-like functions) — better for TypeScript and large components. Both ship in Vue 3; composition is recommended for new code.

**Key points:**
- `<script setup>` is the ergonomic syntax
- Composables (`useFoo`) replace mixins
- Options API still works, no deprecation planned
- Reactivity primitives (`ref`, `reactive`, `computed`, `watch`) are the building blocks

---

### 91. Vue Proxy reactivity

**Frequency:** Low

**Question:** Explain Vue 3's Proxy-based reactivity: how Vue wraps reactive objects with Proxy to track property access during render and re-run renders when tracked properties change, how ref wraps primitives (via .value) while reactive wraps objects, how computed properties cache until dependencies change, and why destructuring a reactive object loses reactivity. Also cover using toRefs/toRef to preserve reactivity when destructuring, why Vue 2's Object.defineProperty missed newly-added properties and how v3 fixed it, shallowRef/shallowReactive for performance with large objects, and readonly for immutable views.

**Answer:** Vue 3 wraps reactive objects with `Proxy`, tracking property access during component render and re-running renders when tracked properties change. `ref` wraps primitives (`.value`), `reactive` wraps objects. Computed properties cache until dependencies change. Avoid destructuring reactive objects — you lose reactivity.

**Key points:**
- `toRefs`/`toRef` preserve reactivity when destructuring
- Vue 2 used `Object.defineProperty`, which missed new properties — fixed in v3
- `shallowRef`/`shallowReactive` for performance with large objects
- `readonly` creates immutable views

---

### 92. Form libs (react-hook-form vs Formik)

**Frequency:** Low

**Question:** Compare react-hook-form and Formik: how react-hook-form uses uncontrolled inputs with refs to minimize re-renders (great performance, smaller bundle, Zod/Yup integration) versus Formik's controlled-input approach with more re-renders but a simpler mental model for small forms. Give guidance on which is the modern default for complex forms with wizards, dynamic fields, and async validation. Also cover schema validation with Zod/Yup/Valibot, useFieldArray for dynamic lists, progressive enhancement for server-rendered forms, and TanStack Form as an emerging framework-agnostic alternative.

**Answer:** React-hook-form uses uncontrolled inputs with refs, minimizing re-renders — great performance, smaller bundle, integrates with Zod/Yup. Formik is controlled-input based, more re-renders but simpler mental model for small forms. For complex forms (wizards, dynamic fields, async validation), react-hook-form is the modern default.

**Key points:**
- Zod/Yup/Valibot for schema validation
- `useFieldArray` for dynamic lists
- Server-rendered forms still benefit from progressive enhancement
- TanStack Form is an emerging framework-agnostic alternative

---

### 93. Micro-frontends: module federation vs iframes vs single-spa

**Frequency:** Low

**Question:** Compare the main micro-frontend approaches and their tradeoffs: (1) Module Federation (Webpack 5, Rspack, Vite plugins) sharing modules across separately-built apps at runtime with shared deps and native composition, (2) iframes giving hard isolation of JS context and CSS but poor UX around auth, navigation, and height sync, and (3) single-spa orchestrating multiple frameworks on one page via lifecycle contracts. Frame the choice as team autonomy versus UX coherence. Also cover Federation's need for careful shared-dep version alignment, iframes for legacy/third-party integration, Angular's Native Federation, and when a monorepo single-deploy beats MFE complexity.

**Answer:** Module Federation (Webpack 5, Rspack, Vite via plugins) shares modules across separately-built apps at runtime — shared deps, native composition, no iframe isolation. Iframes give hard isolation (separate JS context, CSS sandbox) but poor UX (auth, navigation, height sync). single-spa orchestrates multiple frameworks on one page via lifecycle contracts. Choose based on team autonomy vs UX coherence tradeoff.

**Key points:**
- Federation requires careful version alignment of shared deps
- iframes work for legacy/third-party integration
- Native Federation (Angular) is an Angular-flavored take
- Monorepo single-deploy often beats MFE complexity

---

### 94. CSP rollout

**Frequency:** Low

**Question:** Explain how to roll out a Content Security Policy: how CSP whitelists sources for scripts, styles, images, and other resource types, why you start with Content-Security-Policy-Report-Only to log violations without breaking, and how you iterate to remove unsafe-inline (using nonces/hashes) and unsafe-eval, pairing with strict-dynamic for SPA-friendly script allowlisting. Also cover how inline scripts need a per-request nonce, how the report endpoint receives violation JSON, how frame-ancestors replaces X-Frame-Options, and what upgrade-insecure-requests does.

**Answer:** Content Security Policy whitelists sources for scripts/styles/images/etc. Start with `Content-Security-Policy-Report-Only` to log violations without breaking. Iterate to remove `unsafe-inline` (use nonces/hashes) and `unsafe-eval`. Pair with `strict-dynamic` for SPA-friendly script allowlisting.

**Key points:**
- Inline scripts need a nonce per request
- Report endpoint receives violation JSON
- `frame-ancestors` replaces `X-Frame-Options`
- `upgrade-insecure-requests` rewrites HTTP to HTTPS

---

### 95. Source maps in production

**Frequency:** Low

**Question:** Explain how to handle source maps in production: how they map minified code back to original sources for debugging and error tracking, why you should generate them but not expose them publicly (uploading to Sentry/Datadog and serving via auth or IP restriction), and how Webpack's hidden-source-map omits the //# sourceMappingURL comment so browsers don't fetch them automatically. Also cover why stack traces are unreadable without source maps, how sourceMappingURL can point to a private host, keeping maps versioned with deploys, and why eval-source-map is dev-only while production uses external .map files.

**Answer:** Source maps map minified code back to original sources for debugging and error tracking. In production, generate them but don't expose publicly — upload to Sentry/Datadog and serve via auth or restrict by IP. `hidden-source-map` (Webpack) omits the `//# sourceMappingURL` comment so browsers don't fetch them automatically.

**Key points:**
- Without source maps, stack traces are unreadable
- `sourceMappingURL` can point to a private host
- Keep maps versioned with deploys
- `eval-source-map` is dev-only; production uses external `.map` files

---

### 96. Monorepo (Nx, Turborepo) vs polyrepo

**Frequency:** Low

**Question:** Compare monorepos and polyrepos: how monorepos co-locate multiple packages to simplify refactors, shared tooling, and atomic cross-package changes (with Nx adding task orchestration, a project graph, and generators, and Turborepo focusing on caching and pipeline parallelism), versus polyrepos giving strict isolation and independent deploys but complicating cross-cutting changes, with pnpm workspaces as a lightweight start. Also cover remote caching (Nx Cloud, Turborepo Remote Cache) as the killer feature, using code owners and per-package CI to scale, Bazel/Pants for very large scale, and polyrepo plus changesets for OSS package families.

**Answer:** Monorepos co-locate multiple packages, simplifying refactors, shared tooling, and atomic cross-package changes. Nx adds task orchestration, project graph, and generators; Turborepo focuses on caching and pipeline parallelism. Polyrepo gives strict isolation and independent deploys but complicates cross-cutting changes. pnpm workspaces are a lightweight starting point.

**Key points:**
- Remote caching (Nx Cloud, Turborepo Remote Cache) is the killer feature
- Use code owners and per-package CI to scale
- Bazel/Pants for very large scale (Google/Meta style)
- Polyrepo plus changesets works for OSS package families

---

### 97. Mocking (MSW, fetch-mock, DI)

**Frequency:** Low

**Question:** Compare mocking approaches, MSW, fetch-mock, and dependency injection: how MSW (Mock Service Worker) intercepts requests at the network level (a service worker in the browser, a request interceptor in Node) leaving app code unchanged, how fetch-mock patches fetch directly (simpler but couples tests to the transport), and how dependency injection replaces real implementations at a seam (most testable but requiring architectural support). Also cover MSW working the same in dev, tests, and Storybook, sharing one handler set across unit and E2E to reduce drift, avoiding mocking what you don't own (wrap then mock), and snapshot-testing the contract rather than the mock.

**Answer:** MSW (Mock Service Worker) intercepts requests at the network level (service worker in browser, request interceptor in Node), so app code is unchanged. Fetch-mock patches `fetch` directly — simpler but couples tests to the transport. Dependency injection replaces real implementations at the seam — most testable but requires architecture support.

**Key points:**
- MSW works the same in dev, tests, and Storybook
- Same handler set for unit and E2E reduces drift
- Avoid mocking what you don't own — wrap then mock
- Snapshot-test the contract, not the mock

---

### 98. Visual regression (Percy/Chromatic)

**Frequency:** Low

**Question:** Explain visual regression testing: how tools snapshot rendered components/pages and diff against baselines to catch unintended UI changes, how Chromatic integrates with Storybook while Percy is framework-agnostic and Playwright has built-in screenshot diffing, and how flake comes from fonts, animations, and dates that need stubbing. Also cover pairing with Storybook for per-component coverage, how cross-browser snapshots multiply the baseline count, why a reviewer UI for human approval of diffs is essential, and using deterministic test data such as frozen time and seeded random.

**Answer:** Visual regression tools snapshot rendered components/pages and diff against baselines, catching unintended UI changes. Chromatic integrates with Storybook; Percy is framework-agnostic; Playwright has built-in screenshot diffing. Flake comes from fonts, animations, dates — stub them.

**Key points:**
- Pair with Storybook for per-component coverage
- Cross-browser snapshots multiply baseline count
- Reviewer UI is essential — diffs need human approval
- Use deterministic test data (frozen time, seeded random)

---

### 99. Feature flags — client vs server eval

**Frequency:** Low

**Question:** Compare client-side and server-side feature flag evaluation: how client-side evaluation ships flag config to the browser (flexible, supports A/B, but exposes flag names and adds bundle weight) versus server-side evaluation keeping logic private and serving only resolved variants (better for sensitive rollouts and SEO), and the hybrid approach where the server resolves on first request and hydrates a client SDK for subsequent toggles. Also cover common vendors (LaunchDarkly, Statsig, Unleash, Flagsmith), wrapping flag reads in a typed wrapper for safety, sticky bucketing requiring user identity, and cleaning up flags after rollout to avoid tech debt.

**Answer:** Client-side evaluation ships flag config to the browser — flexible, supports A/B, but exposes flag names and adds bundle weight. Server-side evaluation keeps logic private and serves only resolved variants — better for sensitive rollouts and SEO. Hybrid: server resolves on first request, hydrates client SDK for subsequent toggles.

**Key points:**
- LaunchDarkly, Statsig, Unleash, Flagsmith are common vendors
- Wrap flag reads in a typed wrapper for safety
- Sticky bucketing requires user identity
- Clean up flags after rollout — tech debt accumulates

---

### 100. Telemetry: error tracking vs RUM vs APM

**Frequency:** Low

**Question:** Compare the three complementary telemetry categories: (1) error tracking (Sentry, Rollbar) capturing exceptions with stack traces and breadcrumbs, (2) RUM (Real User Monitoring) collecting field performance like Core Web Vitals, navigation timing, and custom events per actual user, and (3) APM (Datadog, New Relic) tying the frontend to backend traces for end-to-end latency. Also cover sampling heavily for high-traffic sites, why source maps are essential for readable stacks, distributed tracing with OpenTelemetry propagating trace IDs across services, and running PII scrubbing before data leaves the client.

**Answer:** Error tracking (Sentry, Rollbar) captures exceptions with stack traces and breadcrumbs. RUM (Real User Monitoring) collects field performance — Core Web Vitals, navigation timing, custom events — per actual user. APM (Datadog, New Relic) ties frontend to backend traces for end-to-end latency. All three are complementary.

**Key points:**
- Sample heavily for high-traffic sites
- Source maps are essential for readable stacks
- Distributed tracing (OpenTelemetry) propagates trace IDs across services
- PII scrubbing must run before data leaves the client
