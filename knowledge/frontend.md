# Frontend Interview Questions

100 high-frequency frontend questions covering HTML/CSS, JavaScript/TypeScript, frameworks (React/Angular/Vue), performance, testing, accessibility, networking, and build tooling.

---

### 1. Box model & `box-sizing: border-box`

**Answer:** The CSS box model wraps every element in content, padding, border, and margin boxes. By default (`content-box`), `width` sets only the content area, so padding and borders expand the rendered size. `border-box` makes `width`/`height` include padding and border, which is far more predictable for grid/flex layouts. Most modern resets apply `*, *::before, *::after { box-sizing: border-box; }` globally.

**Key points:**
- `content-box` is the spec default; `border-box` is the practical default
- Margins are outside the box and collapse vertically between block elements
- `box-sizing` is inherited only when explicitly declared with `inherit`
- Use DevTools' computed-styles box diagram to debug sizing surprises

---

### 2. Block vs inline vs inline-block

**Answer:** Block elements (`div`, `p`, `section`) start on a new line and take the full available width; you can set width/height/margin/padding freely. Inline elements (`span`, `a`, `em`) flow with text, ignore width/height, and only honor horizontal padding/margin visually. Inline-block sits inline with surrounding text but accepts box dimensions, making it useful for buttons or chips before flexbox existed.

**Key points:**
- Inline elements respect `line-height` and create whitespace gaps between tags
- `display: flex/grid` on a parent makes children behave like block-level participants
- Replaced inline elements (`img`, `input`) accept width/height despite being inline
- Modern layouts prefer flex/grid over inline-block tricks

---

### 3. Flexbox axes & flex-grow/shrink/basis

**Answer:** A flex container has a main axis (default row) and a cross axis. `justify-content` aligns along main; `align-items`/`align-self` along cross. The shorthand `flex: <grow> <shrink> <basis>` controls how items distribute free space: `grow` divides leftover space, `shrink` divides overflow, `basis` is the hypothetical starting size before grow/shrink applies. `flex: 1` is shorthand for `1 1 0%`.

**Key points:**
- `flex-direction: row-reverse/column` swaps the main axis
- `flex-wrap: wrap` lets rows break; combine with `align-content` for multi-line cross alignment
- `gap` works in flex (modern browsers) and avoids negative-margin hacks
- `min-width: 0` on flex children prevents text-overflow from blowing out the layout

---

### 4. CSS Grid: template-areas, implicit vs explicit

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

### 5. Positioning: static/relative/absolute/fixed/sticky

**Answer:** `static` is the default and ignores `top/left/right/bottom`. `relative` reserves space but shifts visually and creates a positioning context for absolute children. `absolute` removes the element from flow and positions it relative to the nearest positioned ancestor. `fixed` positions relative to the viewport (or a transformed ancestor — a common gotcha). `sticky` toggles between relative and fixed based on scroll threshold.

**Key points:**
- A `transform`, `filter`, or `will-change` ancestor traps `fixed` elements
- `sticky` requires a scrollable ancestor and a defined `top`/`bottom`
- Absolute elements collapse to content width unless sized
- Positioned elements with `z-index` create stacking contexts

---

### 6. Specificity rules & `!important`

**Answer:** Specificity is a four-part tuple: inline styles, IDs, classes/attributes/pseudo-classes, elements/pseudo-elements. Higher tuple wins; ties go to the later rule. `!important` jumps to its own layer that overrides normal declarations (user-agent < user < author < author-important < inline-important). `@layer` (cascade layers) provides a clean ordering mechanism that obsoletes most `!important` usage.

**Key points:**
- The universal selector `*` and `:where()` contribute zero specificity
- `:is()` and `:not()` take the highest specificity of their arguments
- Prefer cascade layers over specificity arms-races
- Avoid `!important` outside utility frameworks or third-party overrides

---

### 7. CSS cascade & inheritance

**Answer:** The cascade resolves which declaration wins by origin and importance, then cascade layer, then specificity, then source order. Inheritance is separate: some properties (color, font, line-height) inherit by default; layout properties (margin, padding, border) do not. Use `inherit`, `initial`, `unset`, or `revert` to opt into specific behaviors.

**Key points:**
- `all: unset` is useful for resetting a single component
- Custom properties (`--foo`) always inherit unless overridden
- Cascade layers introduce a tier above specificity
- Browser user-agent stylesheets are the lowest-priority origin

---

### 8. Pseudo-classes vs pseudo-elements

**Answer:** Pseudo-classes (`:hover`, `:focus-visible`, `:nth-child`, `:has`) target an existing element in a particular state. Pseudo-elements (`::before`, `::after`, `::marker`, `::selection`) style or create a sub-part of an element. Syntactically, pseudo-elements use `::` (one colon still works for legacy ones). `::before/::after` require a `content` property to render.

**Key points:**
- `:focus-visible` shows focus rings only for keyboard users
- `:has()` is a parent selector now broadly supported
- `::placeholder`, `::file-selector-button` style form internals
- Only one `::before` and one `::after` per element

---

### 9. Stacking context & `z-index` traps

**Answer:** A stacking context is a group of elements painted together; `z-index` only competes within the same context. New contexts are created by `position` + `z-index`, `opacity < 1`, `transform`, `filter`, `will-change`, `isolation: isolate`, and a few others. A child with `z-index: 9999` cannot escape its parent's context.

**Key points:**
- Use `isolation: isolate` to scope z-index intentionally
- Auto-promoted layers (transforms) frequently surprise modal/tooltip layouts
- Portal modals into `document.body` to avoid context traps
- DevTools' Layers panel visualizes the stacking tree

---

### 10. Responsive: media queries, `clamp()`, container queries

**Answer:** Media queries adapt to viewport or device features (`@media (min-width: 768px)`, `(prefers-color-scheme)`, `(prefers-reduced-motion)`). `clamp(min, preferred, max)` produces fluid values without breakpoints. Container queries (`@container`) let components respond to their parent's size, enabling true component-level responsiveness.

**Key points:**
- Mobile-first uses `min-width` queries; desktop-first uses `max-width`
- Define a container with `container-type: inline-size`
- `clamp()` pairs well with viewport units: `clamp(1rem, 2vw, 1.5rem)`
- Respect `prefers-reduced-motion` for accessibility

---

### 11. Critical CSS & FOUC

**Answer:** Critical CSS is the minimal CSS needed to render above-the-fold content; inlining it in `<head>` eliminates render-blocking and reduces LCP. FOUC (flash of unstyled content) occurs when HTML paints before CSS arrives — common with async CSS or font swaps. Tools like Critters, Beasties, or Next.js extract critical CSS automatically.

**Key points:**
- Inline critical CSS, then load full stylesheet with `media="print" onload="this.media='all'"`
- Preload key fonts/CSS with `<link rel="preload">`
- FOUT (text) is usually preferred over FOIT (invisible text)
- Avoid `@import` in CSS — it serializes downloads

---

### 12. CSS-in-JS vs utility-first vs CSS modules

**Answer:** CSS-in-JS (Emotion, styled-components) co-locates styles with components and supports dynamic theming but adds runtime cost and SSR complexity. Utility-first (Tailwind) ships a small atomic stylesheet and scales well, with tradeoffs in markup readability. CSS modules give scoped class names with zero runtime, working well with bundlers but lacking dynamic theming. Modern stacks lean toward Tailwind or zero-runtime CSS-in-JS (vanilla-extract, Panda, Linaria).

**Key points:**
- Runtime CSS-in-JS is discouraged in React Server Components
- Tailwind v4 uses native CSS engine for faster builds
- CSS modules compose with PostCSS pipelines
- Choose based on team familiarity and SSR/RSC requirements

---

### 13. Semantic HTML for SEO/a11y

**Answer:** Semantic elements (`header`, `nav`, `main`, `article`, `section`, `aside`, `footer`, `figure`, `time`) communicate structure to browsers, assistive tech, and crawlers. They improve accessibility (landmarks, headings) and SEO (richer document outline). Use one `<h1>` per page and maintain heading hierarchy without skipping levels.

**Key points:**
- Buttons for actions, links for navigation
- `<label for>` or wrapped labels for every form input
- Avoid `<div role="button">` — use real `<button>`
- Microdata/JSON-LD adds structured data on top of semantics

---

### 14. `<picture>`, `srcset`, responsive images

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

### 15. WAI-ARIA roles & when NOT to use them

**Answer:** ARIA augments semantics when native HTML can't express a pattern (tabs, comboboxes, live regions). The first rule of ARIA is "don't use ARIA" — prefer native elements. Common mistakes: redundant roles (`role="button"` on `<button>`), missing keyboard handlers, and `aria-hidden` on focusable elements (breaks tab order).

**Key points:**
- `aria-live` regions announce dynamic updates
- `aria-expanded`, `aria-controls` describe disclosure widgets
- `aria-label` overrides visible text for screen readers
- Run axe-core and test with VoiceOver/NVDA, not just linters

---

### 16. Keyboard nav & focus management

**Answer:** Every interactive element must be reachable and operable via keyboard. Use natural tab order (avoid positive `tabindex`); `tabindex="-1"` makes elements programmatically focusable. After opening a modal, move focus inside and trap it; restore focus on close. Use `:focus-visible` so focus rings show for keyboard users without distracting mouse users.

**Key points:**
- Skip-to-content links help keyboard users bypass nav
- Roving tabindex for composite widgets (tabs, menus, grids)
- Never remove outlines without providing an alternative
- Test by unplugging the mouse

---

### 17. Color contrast (WCAG AA/AAA)

**Answer:** WCAG AA requires 4.5:1 contrast for normal text and 3:1 for large text (18pt or 14pt bold) and UI components. AAA bumps to 7:1 and 4.5:1. Contrast is computed from relative luminance, not perceived brightness. APCA (the upcoming WCAG 3 algorithm) better models perception and treats dark-on-light vs light-on-dark asymmetrically.

**Key points:**
- Test all states (hover, disabled, placeholder)
- Don't rely on color alone — pair with icons or text
- Tools: axe, Lighthouse, Stark, Chrome's contrast picker
- High-contrast mode (forced-colors) needs separate testing

---

### 18. SVG vs PNG vs WebP vs AVIF

**Answer:** SVG is vector — infinitely scalable, scriptable, ideal for icons/logos. PNG is lossless raster, good for screenshots and transparency but large. WebP gives ~25-35% smaller files than JPEG with similar quality and supports transparency/animation. AVIF compresses ~50% smaller than JPEG with better quality but slower encode; serve via `<picture>` with WebP fallback.

**Key points:**
- Sprite/inline SVG for icons; avoid icon fonts
- AVIF/WebP need explicit fallback for older browsers
- Use `<img>` for content images, CSS `background` for decoration
- Compress SVGs with SVGO

---

### 19. CSS variables vs SASS variables

**Answer:** SASS variables resolve at build time and produce static CSS — fast and simple but not dynamic. CSS custom properties (`--color: red`) live at runtime: they cascade, inherit, can be changed via JS, and respond to media queries. Theming (light/dark, brand swaps) requires CSS variables. SASS still adds value for mixins, loops, and modular file structure.

**Key points:**
- CSS variables can be scoped to a selector for component theming
- `var(--x, fallback)` provides a default
- JS read/write via `element.style.setProperty('--x', value)`
- CSS variables work in `calc()`, transitions don't animate them well

---

### 20. Animations: `transition` vs `@keyframes`; compositor-friendly properties

**Answer:** `transition` interpolates between two states (typically driven by class toggles or pseudo-classes). `@keyframes` defines multi-step animations driven by `animation`. Only `transform` and `opacity` animate on the compositor without layout/paint; animating `width`, `top`, or `box-shadow` triggers expensive reflow on every frame. Use `will-change` sparingly to hint promotion.

**Key points:**
- 60fps means each frame has ~16ms to render
- Prefer `transform: translate` over `top/left`
- `prefers-reduced-motion` should disable non-essential animations
- View Transitions API enables cross-state animations declaratively

---

### 21. `var` vs `let` vs `const`; hoisting & TDZ

**Answer:** `var` is function-scoped, hoisted, and initialized to `undefined`. `let`/`const` are block-scoped and hoisted but uninitialized — accessing them before declaration throws `ReferenceError` (the Temporal Dead Zone). `const` prevents rebinding but not mutation of object contents. Always prefer `const`, then `let`; reserve `var` for legacy code.

**Key points:**
- `var` creates properties on the global object; `let`/`const` do not
- Function declarations are fully hoisted; function expressions are not
- TDZ exists from block start to declaration line
- `const` arrays/objects can still be mutated — use `Object.freeze` for shallow immutability

---

### 22. Closures + classic loop bug

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

### 23. `this` binding rules

**Answer:** In order of precedence: `new` binds `this` to the new instance; explicit `call`/`apply`/`bind` sets it; method calls (`obj.fn()`) bind to `obj`; otherwise it's the global object (or `undefined` in strict mode). Arrow functions don't have their own `this` — they lexically inherit from the enclosing scope, which is why they're ideal for callbacks.

**Key points:**
- Class methods are not auto-bound; use arrow fields or `.bind`
- `forEach`/`map` accept a `thisArg` second argument
- Strict mode prevents accidental global pollution
- `bind` returns a new function; calling `bind` repeatedly only honors the first

---

### 24. Prototypes & prototype chain

**Answer:** Every object has an internal `[[Prototype]]` (accessible via `Object.getPrototypeOf`) that forms a chain ending at `null`. Property lookups walk the chain. `Object.create(proto)` creates an object with a specific prototype. `class` syntax is sugar over prototype-based inheritance; `extends` sets up the chain and `super` calls parent constructors/methods.

**Key points:**
- `instanceof` walks the prototype chain checking `.prototype`
- `hasOwnProperty` (or `Object.hasOwn`) skips inherited props
- Modifying `Array.prototype` is a notorious anti-pattern
- Prototype methods are shared; instance fields are per-object

---

### 25. Event loop: macrotasks vs microtasks

**Answer:** JS is single-threaded with an event loop that drains one macrotask (script, `setTimeout`, I/O, UI events), then runs all microtasks (Promises, `queueMicrotask`, `MutationObserver`) until the queue is empty, then renders, then repeats. Microtasks can starve rendering if they keep enqueueing themselves; long synchronous work blocks everything.

**Key points:**
- `Promise.resolve().then()` runs before `setTimeout(..., 0)`
- `requestAnimationFrame` runs before paint, after microtasks
- Use `scheduler.postTask` or `requestIdleCallback` for low-priority work
- Web Workers offload CPU-bound work off the main thread

---

### 26. Promises vs async/await; error handling

**Answer:** `async/await` is syntactic sugar over Promises that reads sequentially. Throw inside async functions becomes a rejected Promise; `await` unwraps a fulfilled value or re-throws on rejection. Always wrap awaits in `try/catch` or attach `.catch`. Unhandled rejections crash Node ≥15 by default and surface in browser DevTools.

**Key points:**
- `async` functions always return a Promise
- `await` pauses the function, not the thread
- Parallelize independent awaits with `Promise.all`
- `try/catch` around `await` catches both sync throws and rejections

---

### 27. `Promise.all` vs `allSettled` vs `race` vs `any`

**Answer:** `all` resolves with an array when all succeed, rejects on first failure (fail-fast). `allSettled` waits for every promise and returns an array of `{status, value|reason}` — use when you need all results regardless. `race` settles with the first promise to settle (fulfill or reject). `any` resolves with the first fulfillment, rejecting with `AggregateError` only if all fail.

**Key points:**
- Combine `Promise.race` with a timeout promise for cancellation
- `allSettled` is ideal for parallel API calls where partial failure is OK
- `any` is great for fetching from multiple mirrors
- None of these cancel pending promises — use `AbortController` for that

---

### 28. Iterators & generators

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

### 29. ESM vs CommonJS; dynamic `import()`

**Answer:** CommonJS (`require`/`module.exports`) is synchronous, dynamic, Node's legacy module system. ESM (`import`/`export`) is static, async-capable, tree-shakeable, and the web standard. Dynamic `import()` returns a Promise and works in both browser and Node ESM — enables code splitting and conditional loading. Mixed graphs are tricky: ESM can import CJS, CJS importing ESM requires dynamic import.

**Key points:**
- ESM imports are hoisted and live-bound
- `package.json` `"type": "module"` flips Node default
- `exports` field controls subpath resolution
- Top-level await works in ESM only

---

### 30. Debounce vs throttle (write both)

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

### 31. Deep clone (`structuredClone`, JSON, recursive)

**Answer:** `structuredClone(obj)` is the modern built-in: handles cycles, Maps, Sets, Dates, ArrayBuffers, but not functions/DOM nodes/symbols. `JSON.parse(JSON.stringify(obj))` is fast but drops functions, undefined, symbols, Dates become strings, and throws on cycles. Recursive clones give full control but are slow and error-prone — prefer the built-in.

**Key points:**
- Shallow clone: `{...obj}` or `Object.assign({}, obj)` (one level only)
- Immutability libs (Immer) produce structurally-shared clones
- `structuredClone` is also used by `postMessage`
- WeakMap memoization handles cycles in custom recursive clones

---

### 32. Equality: `==` vs `===` vs `Object.is`; NaN

**Answer:** `===` is strict equality (same type, same value). `==` performs type coercion with surprising rules (`[] == false` is true). `Object.is` is like `===` but treats `NaN === NaN` as true and `+0 !== -0`. `NaN` is the only value not equal to itself; test with `Number.isNaN(x)`.

**Key points:**
- Always use `===` unless intentionally coercing
- `null == undefined` is true; both `=== null` is false
- React's `useState` and `Object.is` use the same equality check
- `Number.isNaN` is safer than the global `isNaN` (which coerces)

---

### 33. Garbage collection (mark-and-sweep)

**Answer:** Modern JS engines use generational mark-and-sweep: roots (globals, stack) are marked, then reachable objects, and the rest is swept. V8 splits heap into young (Scavenger) and old generation (Mark-Compact). You can't force GC, but you can avoid leaks: detach event listeners, clear timers, null out references in long-lived caches, and prefer `WeakMap`/`WeakRef` for caches keyed by objects.

**Key points:**
- Reference counting (old IE) failed on cycles
- DevTools Memory profiler finds detached DOM nodes
- Closures retain their entire scope chain
- `FinalizationRegistry` runs cleanup when objects are GC'd (use sparingly)

---

### 34. WeakMap / WeakSet

**Answer:** `WeakMap` keys and `WeakSet` values are held weakly — they don't prevent GC of the referenced object. Useful for associating metadata with DOM nodes or class instances without leaking memory. They're not iterable and don't expose size, because entries can disappear between checks.

**Key points:**
- Keys must be objects (or non-registered symbols)
- Perfect for private fields pre-class-fields syntax
- Use for caches keyed by ephemeral objects
- `WeakRef` and `FinalizationRegistry` give finer-grained weak references

---

### 35. Map vs object as dictionary

**Answer:** `Map` preserves insertion order, accepts any key type (objects, functions), has a real `size`, and is faster for frequent add/delete. Plain objects have prototype pollution risks (`__proto__`, `constructor`), string/symbol keys only, and JSON-friendly serialization. Use `Map` for dynamic keyed collections, objects for fixed-shape records.

**Key points:**
- `Object.create(null)` gives a prototype-less dictionary
- `Map` iteration is faster and more predictable
- JSON doesn't natively serialize `Map` — convert via `Object.fromEntries`
- TypeScript's `Record<K, V>` is for object dictionaries

---

### 36. Symbols; `Symbol.iterator`

**Answer:** Symbols are unique, immutable primitives often used as non-colliding property keys or as well-known protocol hooks. `Symbol.iterator` lets you define custom iteration, `Symbol.asyncIterator` for async, `Symbol.toPrimitive` for coercion. `Symbol.for(key)` looks up a shared symbol in a global registry.

**Key points:**
- Symbol-keyed properties don't appear in `for...in` or `Object.keys`
- `JSON.stringify` skips symbol keys
- TypeScript supports unique-symbol typing
- Use for library extension points to avoid name clashes

---

### 37. Proxies & Reflect

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

### 38. TS: `interface` vs `type`

**Answer:** Both describe object shapes. `interface` supports declaration merging and is idiomatic for public APIs/object contracts. `type` aliases can describe unions, intersections, primitives, tuples, and mapped types — strictly more expressive but not mergeable. Performance is comparable; pick by capability needed. Many teams default to `type` for everything.

**Key points:**
- `interface` extension can be faster to type-check in large unions
- `type` aliases can be self-referential via conditional types
- Both support generics
- Declaration merging is essential for augmenting libraries

---

### 39. TS: `unknown` vs `any` vs `never`

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

### 40. TS: generics, constraints, defaults

**Answer:** Generics parameterize types: `function id<T>(x: T): T`. Constraints (`T extends Foo`) bound the type parameter. Defaults (`<T = string>`) supply fallback types. Conditional types (`T extends U ? X : Y`) and `infer` enable powerful type-level computation.

**Key points:**
- Avoid generics that aren't actually relating two positions
- Use `extends keyof T` for property-name generics
- `NoInfer<T>` (TS 5.4+) prevents inference from one position
- Generic constraints power `Pick`, `Record`, etc.

---

### 41. TS: discriminated unions & exhaustiveness

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

### 42. TS: utility types (Partial/Pick/Omit/Record/ReturnType)

**Answer:** Built-in utilities cover common transformations: `Partial<T>` makes all props optional, `Required<T>` the inverse, `Pick<T, K>` selects, `Omit<T, K>` removes, `Record<K, V>` builds a dictionary, `ReturnType<F>` extracts a function's return, `Parameters<F>` its args, `Awaited<T>` unwraps Promises. Compose them for DTOs, form types, and API contracts.

**Key points:**
- `Readonly<T>` for immutable shapes
- `NonNullable<T>` strips `null | undefined`
- `Exclude`/`Extract` filter union members
- Roll your own with mapped + conditional types when built-ins fall short

---

### 43. TS: declaration merging

**Answer:** Multiple `interface` declarations with the same name merge into one. Namespaces merge with classes/functions. Module augmentation (`declare module 'foo'`) extends third-party types — e.g., add custom matchers to Jest, add fields to Express `Request`, register module-federation remotes.

**Key points:**
- Only `interface` and `namespace` merge; `type` aliases conflict
- Global augmentation via `declare global { }`
- Useful for theme typing (`styled-components`'s `DefaultTheme`)
- Avoid merging across unrelated modules — confusing to readers

---

### 44. TS: `as const` & literal types

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

### 45. Currying & partial application

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

### 46. HOFs & composition

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

### 47. Memoization & pitfalls

**Answer:** Memoization caches function results by arguments. Works best for pure, expensive, deterministic functions with hashable inputs. Pitfalls: unbounded cache growth (memory leak), reference-based keys missing hits, race conditions for async memoization. Use WeakMap-backed caches when keying by objects.

**Key points:**
- React's `useMemo`/`useCallback` are memoization with referential identity
- `Map`-backed memo handles object keys but leaks
- LRU caches bound memory
- Don't memoize cheap operations — the cache lookup costs more

---

### 48. Error subclassing, `cause`, async stack traces

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

### 49. Iterating large lists without blocking main thread

**Answer:** Break work into chunks and yield to the event loop with `setTimeout(0)`, `scheduler.yield()`, `requestIdleCallback`, or `MessageChannel`. For pure CPU work, offload to a Web Worker. For rendering, use virtualization (react-window, TanStack Virtual) so only visible rows mount.

**Key points:**
- `scheduler.postTask({ priority })` (Prioritized Task Scheduling API) is the modern primitive
- Async generators pair well with chunked processing
- Long tasks (>50ms) hurt INP
- React 18's `startTransition` defers low-priority renders

---

### 50. Web Workers vs Service Workers vs Shared Workers

**Answer:** Web Workers run scripts on a background thread for CPU work; no DOM access; communicate via `postMessage`. Service Workers are network proxies that enable offline, push notifications, and background sync — lifecycle (install/activate/fetch) is independent of pages. Shared Workers can be accessed by multiple same-origin tabs. Worklets (audio, paint, animation) are lighter-weight specialized workers.

**Key points:**
- Workers communicate via structured cloning or `Transferable` objects (zero-copy)
- Service Workers require HTTPS (except localhost)
- Comlink wraps `postMessage` as RPC
- Shared Workers are not supported in Safari mobile

---

### 51. React VDOM & reconciliation

**Answer:** React describes UI as a tree of elements; on state change it builds a new tree and diffs against the previous (reconciliation), committing minimal DOM mutations. Heuristics: different element types replace the subtree; same types update props; keys identify list items across renders. Fiber (since 16) makes reconciliation interruptible for concurrent rendering.

**Key points:**
- Reconciliation is O(n) thanks to heuristics, not full tree-diff
- Wrong keys cause subtle state bugs in lists
- Concurrent rendering can throw away in-progress work
- React 19 adds compiler-driven memoization

---

### 52. `useState` vs `useReducer`

**Answer:** `useState` is ideal for independent primitives or small object state. `useReducer` shines when next state depends on previous state, multiple sub-values change together, or transitions follow a state-machine pattern. Reducer functions are pure and testable; dispatch identity is stable so it's safe in deps.

**Key points:**
- Lazy initialization: `useState(() => expensive())`
- Functional updates: `setX(prev => prev + 1)` avoid stale closures
- Reducers pair well with Context for app-wide state
- XState or Zustand for more complex needs

---

### 53. `useEffect` deps & stale closures

**Answer:** Effects capture variables from the render they were created in. Missing deps cause stale closures that read outdated values. The exhaustive-deps lint rule catches this. Fix by including all referenced reactive values, or use refs/functional updates to read latest without re-subscribing.

**Key points:**
- Empty deps `[]` = run once on mount (and cleanup on unmount)
- Cleanup runs before next effect and on unmount
- React 18 Strict Mode runs effects twice in dev to surface bugs
- React 19's compiler reduces manual dep management

---

### 54. `useMemo` vs `useCallback`

**Answer:** `useMemo(fn, deps)` memoizes a computed value; `useCallback(fn, deps)` memoizes a function reference (sugar for `useMemo(() => fn, deps)`). Use to avoid expensive recomputation or to keep referential identity stable for child memo/effect deps. React 19's compiler often makes these unnecessary.

**Key points:**
- Memoization has overhead — don't memoize trivial values
- Stale closure risk if deps are wrong
- Pair with `React.memo` for child re-render skipping
- Profile before adding memoization

---

### 55. `React.memo`

**Answer:** `React.memo(Component)` wraps a function component to skip rendering when props are shallowly equal to the previous render. Provide a custom comparator for deep equality (rarely worth it). Only helps if parent renders frequently and props are usually stable.

**Key points:**
- Inline object/function props defeat memo — wrap with `useMemo`/`useCallback`
- React 19 compiler auto-memoizes, reducing manual `memo` usage
- Use `useMemo` for expensive children rather than memo + props plumbing
- Test with Profiler to confirm the win

---

### 56. Context — propagation cost & splitting

**Answer:** Context re-renders every consumer when its value changes. Putting frequently-changing values in one provider causes widespread re-renders. Split contexts by update frequency (one for theme, one for current user, one for cart). For complex global state, use Zustand/Jotai/Redux which support selector-based subscriptions.

**Key points:**
- `useContextSelector` (third-party) enables fine-grained subscription
- Wrap provider value in `useMemo` to keep identity stable
- Context is for dependency injection, not high-frequency state
- React 19's `use(Context)` reads context conditionally

---

### 57. Keys in lists; index-key anti-pattern

**Answer:** Keys identify items between renders so React can match them. Using array index is fine for static lists but breaks on reorder/insert/delete — state attached to a row follows the index, not the item. Use stable item IDs.

**Key points:**
- Keys must be unique among siblings only
- Don't generate keys randomly inside render
- React warns in dev when keys are missing
- Keys also affect CSS animations and form state

---

### 58. Controlled vs uncontrolled inputs

**Answer:** Controlled inputs derive `value` from React state and update via `onChange` — single source of truth, easy validation, but re-renders on every keystroke. Uncontrolled inputs hold their own state in the DOM, accessed via refs (`defaultValue` for initial value). Uncontrolled is simpler for plain forms; controlled is better when you need to react to keystrokes.

**Key points:**
- React-hook-form leverages uncontrolled inputs for performance
- File inputs are always effectively uncontrolled
- `defaultValue`/`defaultChecked` initialize uncontrolled
- Don't switch a single input between controlled/uncontrolled

---

### 59. Refs & forwardRef

**Answer:** Refs hold mutable values across renders without triggering re-renders. `useRef(initial).current` reads/writes the value. Refs to DOM nodes give imperative access (focus, measure). `forwardRef` lets parent refs reach into a child component's DOM. React 19 makes `ref` a regular prop, deprecating `forwardRef`.

**Key points:**
- Don't read refs during render (except for cached values)
- `useImperativeHandle` curates what `forwardRef` exposes
- Callback refs (`ref={node => ...}`) run on mount/unmount
- Refs are escape hatches — prefer declarative patterns

---

### 60. Error boundaries

**Answer:** Error boundaries are class components implementing `componentDidCatch` and `getDerivedStateFromError` that catch errors from descendant render/lifecycle/constructor and show fallback UI. They don't catch event handlers, async code, or SSR errors — handle those with `try/catch`. Wrap routes/features in boundaries for graceful degradation.

**Key points:**
- React-error-boundary library provides a hook-friendly wrapper
- Log to Sentry/Datadog inside `componentDidCatch`
- Reset state by changing the boundary's `key` or via `resetErrorBoundary`
- React 19 still requires class boundaries — no hook equivalent yet

---

### 61. Suspense & concurrent features

**Answer:** `Suspense` shows a fallback while a child throws a Promise (data fetch, lazy import). Concurrent features (`startTransition`, `useDeferredValue`) let React interrupt low-priority renders to keep input responsive. Server Components and streaming SSR are built on Suspense — chunks of HTML flush as data resolves.

**Key points:**
- `lazy(() => import(...))` integrates with Suspense
- `useTransition` returns `[isPending, startTransition]`
- Boundaries can be nested for granular loading states
- Throwing Promises from arbitrary hooks is now formalized via `use()`

---

### 62. Server Components vs client components

**Answer:** React Server Components (RSC) run on the server, never ship to the client, and can directly access databases/secrets. They render to a serialized format that client components hydrate around. `'use client'` marks a module boundary. RSC reduces bundle size and centralizes data fetching, but constrains interactivity to client islands.

**Key points:**
- Server Components can't use state, effects, or browser APIs
- Props passed from server to client must be serializable
- Server Actions handle mutations
- Next.js App Router and Remix v3 are primary adopters

---

### 63. Hydration mismatches

**Answer:** Hydration attaches event listeners to server-rendered HTML. Mismatches occur when client output differs from server (random IDs, locale-formatted dates, browser-only conditionals). React 18 recovers by re-rendering the mismatched subtree but warns in dev. Fix with `useId` (stable across server/client), `suppressHydrationWarning` for known divergences, or defer browser-only content with `useEffect`/`useSyncExternalStore`.

**Key points:**
- `Date.now()`/`Math.random()` in render cause mismatches
- Locale/timezone differences are frequent culprits
- React 19 improves error messages and reduces silent corruption
- Streaming SSR can mask issues — test with JS disabled

---

### 64. State mgmt: Redux vs Zustand vs Jotai vs Context

**Answer:** Redux (Toolkit) excels at large apps needing devtools, middleware, time-travel debugging — verbose but predictable. Zustand is a tiny hook-based store with selector subscriptions — minimal boilerplate. Jotai uses atomic state primitives composed with derivations — fine-grained reactivity. Context is for dependency injection of rarely-changing values, not high-frequency state.

**Key points:**
- Server state (React Query, SWR) is separate from client state
- Avoid global state for component-local concerns
- Zustand/Jotai work great with React 18 concurrent rendering
- Redux Toolkit Query covers data fetching too

---

### 65. Angular change detection (Zone.js, OnPush, signals)

**Answer:** Angular traditionally uses Zone.js to monkey-patch async APIs and trigger change detection automatically. `ChangeDetectionStrategy.OnPush` skips a component unless inputs change by reference, an event fires from it, or an async pipe emits. Angular 17+ introduces signals — fine-grained reactive primitives that bypass Zone entirely and enable zoneless apps in v18+.

**Key points:**
- OnPush dramatically improves performance in large apps
- Signals (`signal()`, `computed()`, `effect()`) replace many `BehaviorSubject` patterns
- `provideExperimentalZonelessChangeDetection` in v18
- Detached components run CD only via `ChangeDetectorRef.detectChanges()`

---

### 66. Angular DI hierarchy

**Answer:** Angular DI resolves providers by walking up the element injector tree, then the module/environment injector tree. `providedIn: 'root'` registers a tree-shakeable singleton. Component-level `providers` create per-instance services (great for state-scoped-to-feature). `inject()` (v14+) replaces constructor injection in many contexts.

**Key points:**
- `useClass`/`useFactory`/`useValue`/`useExisting` configure providers
- Multi-providers (`multi: true`) collect arrays of values
- Standalone components have their own injector hierarchy
- `@Optional`, `@Self`, `@SkipSelf`, `@Host` control resolution

---

### 67. RxJS: switchMap vs mergeMap vs concatMap vs exhaustMap

**Answer:** All four flatten Observable-of-Observables but handle concurrency differently. `switchMap` cancels the previous inner Observable when a new value arrives — ideal for type-ahead search. `mergeMap` runs all in parallel — good for independent requests. `concatMap` queues them sequentially — preserves order. `exhaustMap` ignores new emissions while one is in-flight — perfect for submit buttons.

**Key points:**
- `switchMap` is the right default for HTTP triggered by user input
- `mergeMap` can swamp the server — limit concurrency with `mergeMap(fn, n)`
- `concatMap` preserves order at the cost of latency
- `exhaustMap` prevents double-submission

---

### 68. Angular standalone vs NgModules

**Answer:** Standalone components (v14+, default in v17+) declare their own imports/providers and skip NgModule registration — simpler mental model, better tree-shaking, faster builds. NgModules remain for grouping related declarations and legacy interop. New apps should be 100% standalone; libraries are migrating.

**Key points:**
- `bootstrapApplication(AppComponent, { providers: [...] })` replaces `NgModule` bootstrap
- Route-level lazy loading: `loadComponent: () => import(...)`
- `provideRouter`, `provideHttpClient` configure features functionally
- Migration schematic: `ng generate @angular/core:standalone`

---

### 69. Vue composition vs options API

**Answer:** Options API groups code by lifecycle/data/methods — easy to learn, but logic for one feature scatters across options. Composition API (`setup`/`<script setup>`) groups code by concern using composables (reusable hook-like functions) — better for TypeScript and large components. Both ship in Vue 3; composition is recommended for new code.

**Key points:**
- `<script setup>` is the ergonomic syntax
- Composables (`useFoo`) replace mixins
- Options API still works, no deprecation planned
- Reactivity primitives (`ref`, `reactive`, `computed`, `watch`) are the building blocks

---

### 70. Vue Proxy reactivity

**Answer:** Vue 3 wraps reactive objects with `Proxy`, tracking property access during component render and re-running renders when tracked properties change. `ref` wraps primitives (`.value`), `reactive` wraps objects. Computed properties cache until dependencies change. Avoid destructuring reactive objects — you lose reactivity.

**Key points:**
- `toRefs`/`toRef` preserve reactivity when destructuring
- Vue 2 used `Object.defineProperty`, which missed new properties — fixed in v3
- `shallowRef`/`shallowReactive` for performance with large objects
- `readonly` creates immutable views

---

### 71. SSR vs SSG vs CSR vs ISR

**Answer:** CSR ships a shell + JS that fetches and renders on the client — slow first paint, fast subsequent nav. SSR renders HTML per request — good for personalized/SEO content but high server cost. SSG pre-builds pages at deploy — fastest serve, but stale until rebuild. ISR (Next.js) serves cached pages and revalidates on a schedule — best of SSR+SSG. Server Components add a fourth axis: per-component server rendering.

**Key points:**
- Streaming SSR ships HTML chunks as data resolves
- Edge SSR runs near users for lower latency
- SSG works only for content known at build time
- ISR's revalidation strategy needs care to avoid cache stampedes

---

### 72. Routing: client- vs server-side

**Answer:** Server-side routing returns a full HTML document per URL — simple, SEO-friendly, no JS required. Client-side routing intercepts navigation, fetches data, and swaps views without page reload — faster transitions but requires JS. Modern frameworks blend both: server renders the initial page, client takes over for subsequent navigations (hybrid/isomorphic routing).

**Key points:**
- History API (`pushState`/`replaceState`) powers client routing
- `<a>` should still work without JS (progressive enhancement)
- Code-split routes for smaller initial bundles
- View Transitions API enables smooth client-route animations

---

### 73. Form libs (react-hook-form vs Formik)

**Answer:** React-hook-form uses uncontrolled inputs with refs, minimizing re-renders — great performance, smaller bundle, integrates with Zod/Yup. Formik is controlled-input based, more re-renders but simpler mental model for small forms. For complex forms (wizards, dynamic fields, async validation), react-hook-form is the modern default.

**Key points:**
- Zod/Yup/Valibot for schema validation
- `useFieldArray` for dynamic lists
- Server-rendered forms still benefit from progressive enhancement
- TanStack Form is an emerging framework-agnostic alternative

---

### 74. Container/presentational vs hooks-driven

**Answer:** The classic container/presentational split isolated data fetching from rendering — useful pre-hooks. Hooks-driven architecture co-locates data needs with components via custom hooks (`useUser`, `useCart`), reducing prop-drilling. Server Components push this further by making the data layer disappear from client code.

**Key points:**
- Custom hooks are the modern "container" — testable in isolation
- Presentational components remain valuable for design systems
- Compound components pattern groups related UI (Tabs/Tab)
- Avoid premature abstraction — extract when patterns emerge

---

### 75. Micro-frontends: module federation vs iframes vs single-spa

**Answer:** Module Federation (Webpack 5, Rspack, Vite via plugins) shares modules across separately-built apps at runtime — shared deps, native composition, no iframe isolation. Iframes give hard isolation (separate JS context, CSS sandbox) but poor UX (auth, navigation, height sync). single-spa orchestrates multiple frameworks on one page via lifecycle contracts. Choose based on team autonomy vs UX coherence tradeoff.

**Key points:**
- Federation requires careful version alignment of shared deps
- iframes work for legacy/third-party integration
- Native Federation (Angular) is an Angular-flavored take
- Monorepo single-deploy often beats MFE complexity

---

### 76. Critical rendering path

**Answer:** Browser builds DOM from HTML, CSSOM from CSS, combines them into the render tree, lays out (geometry), paints (pixels), and composites layers. CSS blocks render; sync JS blocks parser. Optimize by minimizing critical resources, deferring non-critical JS, inlining critical CSS, and using async/defer on scripts.

**Key points:**
- `defer` runs after parse, before `DOMContentLoaded`
- `async` runs whenever it arrives (out of order)
- Preload critical resources, preconnect to third-party origins
- DevTools Performance panel visualizes the path

---

### 77. Core Web Vitals (LCP, INP, CLS)

**Answer:** LCP (Largest Contentful Paint) measures load speed — target <2.5s. INP (Interaction to Next Paint) replaced FID in 2024, measuring responsiveness across all interactions — target <200ms. CLS (Cumulative Layout Shift) measures visual stability — target <0.1. Google uses these as ranking signals.

**Key points:**
- LCP killers: render-blocking CSS, large images, slow servers
- INP killers: long tasks, heavy event handlers, sync layout
- CLS killers: missing image dimensions, late-injected ads/banners
- `web-vitals` library reports field data

---

### 78. Code splitting & lazy loading

**Answer:** Split bundles by route, feature, or component so users download only what's needed. Dynamic `import()` is the primitive; framework wrappers (`React.lazy`, Next.js dynamic, Angular `loadComponent`) handle Suspense. Watch for waterfall loading — prefetch likely-next routes during idle.

**Key points:**
- Per-route splitting is the highest-impact starting point
- Prefetch with `<link rel="prefetch">` or framework hints
- Don't over-split — too many small chunks hurt HTTP overhead
- Bundle analyzers (webpack-bundle-analyzer, rollup-plugin-visualizer) guide decisions

---

### 79. Tree shaking — what blocks it

**Answer:** Tree shaking eliminates unused exports during bundling. Requires ESM (static analysis), sideEffect-free modules (`"sideEffects": false` in package.json), and pure top-level code. Blockers: CJS modules, dynamic `require`, top-level side effects, re-exports through barrel files, transpiling to CJS too early.

**Key points:**
- `/*#__PURE__*/` annotations mark calls as side-effect-free
- Lodash-es tree-shakes; lodash (CJS) does not
- Avoid `import * as` — name imports
- Verify with bundle analyzer

---

### 80. HTTP caching: Cache-Control, ETag, Last-Modified

**Answer:** `Cache-Control` directives govern freshness: `max-age`, `s-maxage`, `public`/`private`, `immutable`, `no-store`, `stale-while-revalidate`. After expiry, conditional revalidation uses `ETag` (content hash) with `If-None-Match`, or `Last-Modified` with `If-Modified-Since`, returning 304 to skip body. Hash-named static assets get `Cache-Control: public, max-age=31536000, immutable`.

**Key points:**
- `stale-while-revalidate` serves stale while refreshing in background
- HTML should be `no-cache` (revalidate every time) so deploys propagate
- CDNs respect `s-maxage` separately from browser `max-age`
- `Vary` header tells caches which request headers differentiate responses

---

### 81. CDN & edge caching

**Answer:** CDNs cache static assets at PoPs near users, reducing latency and origin load. Modern CDNs (Cloudflare, Fastly, Vercel) also run edge functions for SSR/personalization. Cache strategies: origin shield, tiered caching, purge by tag, signed URLs. Edge SSR runs your code globally at <50ms TTFB.

**Key points:**
- Cache key includes URL, sometimes headers/cookies — control via `Vary`
- Purge by tag for fine-grained invalidation
- HTTP/2 push is largely abandoned; use early hints / preload
- Origin shield reduces cache misses to the origin

---

### 82. CORS preflight & credentials

**Answer:** Browsers send a preflight `OPTIONS` request for "non-simple" cross-origin requests (custom headers, non-GET/POST/HEAD, JSON body). Server must respond with `Access-Control-Allow-Origin`, `-Methods`, `-Headers`, and (for credentials) `-Credentials: true` with a specific origin (not `*`). To send cookies, set `credentials: 'include'` on fetch.

**Key points:**
- Simple requests skip preflight (form-encoded POST, GET)
- `Access-Control-Max-Age` caches preflight result
- `SameSite` cookies still apply on top of CORS
- Mistake: returning `*` with credentials — browsers reject

---

### 83. Cookies: SameSite/Secure/HttpOnly

**Answer:** `HttpOnly` hides from JS (mitigates XSS theft). `Secure` requires HTTPS. `SameSite=Strict` blocks cross-site sends entirely; `Lax` (default) allows top-level navigation GETs; `None` allows all cross-site but requires `Secure`. `Partitioned` (CHIPS) opts into per-top-site cookie storage as third-party cookies phase out.

**Key points:**
- Auth tokens should be `HttpOnly; Secure; SameSite=Lax`
- Embedded widgets need `SameSite=None; Secure; Partitioned`
- Cookie size limit ~4KB; consider header bloat
- Use `__Host-` prefix for strictest security guarantees

---

### 84. XSS, CSRF, clickjacking mitigations

**Answer:** XSS: never `innerHTML` untrusted input; escape on render; use CSP; sanitize with DOMPurify; prefer framework-bound rendering. CSRF: SameSite cookies + CSRF tokens for state-changing requests; double-submit cookie pattern. Clickjacking: `X-Frame-Options: DENY` or CSP `frame-ancestors 'none'`.

**Key points:**
- Stored XSS is worse than reflected
- Trusted Types API helps enforce safe DOM sinks
- CSRF only affects browser-sent credentials (cookies, basic auth)
- React/Vue/Angular escape by default — `dangerouslySetInnerHTML` is opt-in

---

### 85. CSP rollout

**Answer:** Content Security Policy whitelists sources for scripts/styles/images/etc. Start with `Content-Security-Policy-Report-Only` to log violations without breaking. Iterate to remove `unsafe-inline` (use nonces/hashes) and `unsafe-eval`. Pair with `strict-dynamic` for SPA-friendly script allowlisting.

**Key points:**
- Inline scripts need a nonce per request
- Report endpoint receives violation JSON
- `frame-ancestors` replaces `X-Frame-Options`
- `upgrade-insecure-requests` rewrites HTTP to HTTPS

---

### 86. Frontend auth: JWT in localStorage vs httpOnly cookie

**Answer:** `localStorage` is readable by any JS — XSS steals tokens. `httpOnly` cookies are immune to JS access, sent automatically, but vulnerable to CSRF (mitigate with SameSite + CSRF tokens). Cookies are the standard for browser-based auth; localStorage is acceptable only for short-lived tokens in pure-API SPAs with strong CSP.

**Key points:**
- Refresh-token rotation reduces blast radius
- Avoid storing tokens in `sessionStorage` either (still JS-accessible)
- BFF (Backend-for-Frontend) pattern keeps tokens off the client entirely
- OAuth PKCE is required for public clients

---

### 87. WebSocket vs SSE vs long-polling

**Answer:** WebSocket is bidirectional, low-latency, ideal for chat/games/collab editing — requires server support and handles binary. SSE is one-way (server → client) over HTTP, simpler, auto-reconnect, works through most proxies, but text-only and limited browser connections per origin. Long-polling is a fallback that emulates push by holding requests open.

**Key points:**
- SSE works great for notifications, live feeds, AI streaming
- WebSocket needs heartbeats to survive idle timeouts
- WebTransport (HTTP/3) is the emerging successor for low-latency bidirectional
- Server-Sent Events have per-origin connection limits in HTTP/1.1

---

### 88. Image optimization checklist

**Answer:** Pick the right format (AVIF/WebP with fallback), serve via `<picture>` with `srcset`/`sizes`, set `width`/`height` to reserve space, lazy-load below-the-fold with `loading="lazy"`, mark LCP image with `fetchpriority="high"`, use a CDN with on-the-fly resizing, strip metadata, compress aggressively. SVG for icons/logos.

**Key points:**
- LCP image should NOT be lazy
- `decoding="async"` avoids blocking the main thread
- Use `aspect-ratio` CSS to avoid CLS
- Blurhash/LQIP placeholders improve perceived performance

---

### 89. Font loading (`font-display: swap`, preconnect, subsetting)

**Answer:** `font-display: swap` shows fallback immediately then swaps to web font (FOUT) — avoids invisible text (FOIT). `preconnect` to font origin saves a round trip. Subsetting strips unused glyphs (Latin-only saves huge bytes). Self-host or use `font-display: optional` for strict CLS budgets.

**Key points:**
- Variable fonts replace multiple weight files
- WOFF2 is the only modern format you need
- `size-adjust` CSS minimizes layout shift between fallback and web font
- Preload critical fonts: `<link rel="preload" as="font" crossorigin>`

---

### 90. Bundlers: Webpack vs Vite vs esbuild vs Rollup

**Answer:** Webpack is the mature, plugin-heavy workhorse — slow but flexible. Vite uses native ESM in dev (no bundling) and Rollup for production — fast HMR, great DX. esbuild is a Go-based bundler/transpiler, extremely fast, used inside Vite for transforms. Rollup excels at library bundles (clean ESM output, tree-shaking). Rspack (Rust) and Turbopack (Rust) are emerging Webpack-compatible replacements.

**Key points:**
- Vite is the default for new frontend apps
- Webpack still dominant for enterprise/legacy
- esbuild's plugin API is limited compared to Rollup
- Library authors typically pick Rollup or tsup (esbuild-based)

---

### 91. Source maps in production

**Answer:** Source maps map minified code back to original sources for debugging and error tracking. In production, generate them but don't expose publicly — upload to Sentry/Datadog and serve via auth or restrict by IP. `hidden-source-map` (Webpack) omits the `//# sourceMappingURL` comment so browsers don't fetch them automatically.

**Key points:**
- Without source maps, stack traces are unreadable
- `sourceMappingURL` can point to a private host
- Keep maps versioned with deploys
- `eval-source-map` is dev-only; production uses external `.map` files

---

### 92. Monorepo (Nx, Turborepo) vs polyrepo

**Answer:** Monorepos co-locate multiple packages, simplifying refactors, shared tooling, and atomic cross-package changes. Nx adds task orchestration, project graph, and generators; Turborepo focuses on caching and pipeline parallelism. Polyrepo gives strict isolation and independent deploys but complicates cross-cutting changes. pnpm workspaces are a lightweight starting point.

**Key points:**
- Remote caching (Nx Cloud, Turborepo Remote Cache) is the killer feature
- Use code owners and per-package CI to scale
- Bazel/Pants for very large scale (Google/Meta style)
- Polyrepo plus changesets works for OSS package families

---

### 93. Testing pyramid

**Answer:** Many fast unit tests at the base, fewer integration tests in the middle, few slow end-to-end tests at the top. Modern variants (testing trophy) put more weight on integration tests with React Testing Library — they catch real bugs without brittleness. E2E covers critical user journeys (login, checkout) only.

**Key points:**
- Avoid testing implementation details
- Aim for fast feedback — unit tests in milliseconds
- Contract tests (Pact) replace some integration tests across services
- Coverage is a sanity check, not a target

---

### 94. Jest vs Vitest vs Playwright vs Cypress

**Answer:** Jest is the long-standing React/Node unit test runner. Vitest is the Vite-native, faster, ESM-first alternative with Jest-compatible API. Playwright is a multi-browser E2E framework (Chromium/Firefox/WebKit) with great parallelization and tracing. Cypress is the developer-friendly E2E runner with time-travel debugging but runs in-browser and is single-browser per test.

**Key points:**
- Vitest is the new default for Vite/SvelteKit/Astro projects
- Playwright is gaining ground over Cypress for cross-browser
- Both Playwright and Cypress support component testing too
- Use MSW for API mocking in both unit and E2E

---

### 95. Mocking (MSW, fetch-mock, DI)

**Answer:** MSW (Mock Service Worker) intercepts requests at the network level (service worker in browser, request interceptor in Node), so app code is unchanged. Fetch-mock patches `fetch` directly — simpler but couples tests to the transport. Dependency injection replaces real implementations at the seam — most testable but requires architecture support.

**Key points:**
- MSW works the same in dev, tests, and Storybook
- Same handler set for unit and E2E reduces drift
- Avoid mocking what you don't own — wrap then mock
- Snapshot-test the contract, not the mock

---

### 96. Visual regression (Percy/Chromatic)

**Answer:** Visual regression tools snapshot rendered components/pages and diff against baselines, catching unintended UI changes. Chromatic integrates with Storybook; Percy is framework-agnostic; Playwright has built-in screenshot diffing. Flake comes from fonts, animations, dates — stub them.

**Key points:**
- Pair with Storybook for per-component coverage
- Cross-browser snapshots multiply baseline count
- Reviewer UI is essential — diffs need human approval
- Use deterministic test data (frozen time, seeded random)

---

### 97. A11y testing (axe-core, lighthouse, screen readers)

**Answer:** Automated tools (axe-core via jest-axe or Playwright, Lighthouse) catch ~30-50% of issues — missing labels, contrast, ARIA misuse. Manual testing fills the rest: keyboard-only navigation, screen readers (NVDA, JAWS, VoiceOver), zoom to 200%, reduced-motion. Bake checks into CI to prevent regressions.

**Key points:**
- Storybook addon-a11y runs axe per story
- Lighthouse a11y score is a starting point, not a finish line
- Test with real assistive tech, not just emulation
- Include users with disabilities in testing when possible

---

### 98. Feature flags — client vs server eval

**Answer:** Client-side evaluation ships flag config to the browser — flexible, supports A/B, but exposes flag names and adds bundle weight. Server-side evaluation keeps logic private and serves only resolved variants — better for sensitive rollouts and SEO. Hybrid: server resolves on first request, hydrates client SDK for subsequent toggles.

**Key points:**
- LaunchDarkly, Statsig, Unleash, Flagsmith are common vendors
- Wrap flag reads in a typed wrapper for safety
- Sticky bucketing requires user identity
- Clean up flags after rollout — tech debt accumulates

---

### 99. Telemetry: error tracking vs RUM vs APM

**Answer:** Error tracking (Sentry, Rollbar) captures exceptions with stack traces and breadcrumbs. RUM (Real User Monitoring) collects field performance — Core Web Vitals, navigation timing, custom events — per actual user. APM (Datadog, New Relic) ties frontend to backend traces for end-to-end latency. All three are complementary.

**Key points:**
- Sample heavily for high-traffic sites
- Source maps are essential for readable stacks
- Distributed tracing (OpenTelemetry) propagates trace IDs across services
- PII scrubbing must run before data leaves the client

---

### 100. PWA: SW lifecycle, offline strategy, install prompt

**Answer:** Service Worker lifecycle: `install` (cache shell), `activate` (clean old caches), `fetch` (intercept network). Offline strategies: cache-first (static assets), network-first (API with fallback), stale-while-revalidate (good UX/freshness balance). The `beforeinstallprompt` event lets you defer the install prompt to a user-chosen moment. Workbox abstracts common patterns.

**Key points:**
- Manifest + HTTPS + SW + offline page = installable PWA
- Update flow: prompt user to reload when a new SW activates
- Background Sync queues failed mutations for retry
- iOS has limited PWA support; test on real devices

---
