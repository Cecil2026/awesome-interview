# Frontend Engineer Interview Roadmap (8-week plan)

## Who this is for

Mid-level frontend engineer with 2-5 years of production experience targeting product engineering roles at mid-to-large tech companies. You ship UI code daily, you've used at least one major framework (React, Vue, or Angular) in anger, and you can debug a layout bug without Googling `display: flex`. Your weaker areas are likely framework internals, performance auditing under pressure, and explaining your work in interview language.

## Time commitment

- Weekday: 1-2 hours
- Weekend: 4-6 hours
- Total: ~80-100 hours over 8 weeks

## Prerequisites

- You can write modern JavaScript without reaching for the docs every five minutes
- You've built at least one non-trivial application with React, Vue, or Angular
- You understand the difference between `let`, `const`, and `var`, and can explain why it matters
- You've used the browser devtools to debug both a JS bug and a CSS bug
- You can write a basic algorithm (binary search, BFS) without help, even if slowly

## The plan

### Week 1: JavaScript fundamentals — the language layer

**Focus:** rebuild your mental model of the JavaScript runtime so framework questions feel easy.

**Algorithms (target: 15 problems)**
- [ ] Arrays — 8 easy problems from Blind 75 (Two Sum, Best Time to Buy and Sell Stock, Contains Duplicate, Maximum Subarray, etc.)
- [ ] Strings — 5 easy problems (Valid Anagram, Valid Palindrome, Reverse String)
- [ ] Hashmaps — 2 medium problems (Group Anagrams, Top K Frequent Elements)

**Theory**
- [ ] Read: "You Don't Know JS Yet" — Scope & Closures
- [ ] Read: MDN sections on the event loop, call stack, microtasks vs macrotasks
- [ ] Watch: "What the heck is the event loop anyway?" by Philip Roberts (JSConf talk)

**System design / domain**
- [ ] Write a one-page note explaining how `this` is determined in JavaScript (4 rules: default, implicit, explicit, new)

**Behavioral prep**
- [ ] Write your "tell me about yourself" pitch (60-90 seconds, three beats: present role, relevant background, why this team)
- [ ] List 8 candidate STAR stories from your last 3 years of work

**Milestone (end of week)**
- Explain closures, the event loop, and `this` binding from memory in under 5 minutes total. Solve Two Sum in O(n) without notes.

### Week 2: Async JavaScript and prototypes

**Focus:** master promises, async/await, and the prototype chain — these come up in nearly every frontend interview.

**Algorithms (target: 15 problems)**
- [ ] Two Pointers — 5 medium problems (Container With Most Water, 3Sum, Trapping Rain Water)
- [ ] Sliding Window — 5 medium problems (Longest Substring Without Repeating Characters, Minimum Window Substring)
- [ ] Stack — 5 medium problems (Valid Parentheses, Min Stack, Daily Temperatures)

**Theory**
- [ ] Read: "You Don't Know JS Yet" — this & Object Prototypes
- [ ] Read: MDN's "Using Promises" and "Async functions" pages end to end
- [ ] Implement from scratch: `Promise.all`, `Promise.race`, a basic `debounce` and `throttle`, a `deepClone`

**System design / domain**
- [ ] Draw the prototype chain for `class Dog extends Animal` on paper without referencing anything

**Behavioral prep**
- [ ] Refine 3 STAR stories from your list (situation/task/action/result in 90 seconds each)
- [ ] One story should demonstrate technical depth, one collaboration, one a failure or mistake

**Milestone (end of week)**
- Implement `Promise.all` from scratch on a whiteboard. Explain the difference between `.then` and `await` in terms of microtasks.

### Week 3: HTML, CSS, and accessibility

**Focus:** the parts of frontend interviews that pure algorithm prep ignores.

**Algorithms (target: 10 problems)**
- [ ] Linked Lists — 5 easy/medium (Reverse Linked List, Merge Two Sorted Lists, Linked List Cycle, Remove Nth Node)
- [ ] Trees — 5 easy (Invert Binary Tree, Maximum Depth, Same Tree, Symmetric Tree)

**Theory**
- [ ] Read: MDN's CSS Layout section (flexbox and grid in depth)
- [ ] Read: "CSS for JavaScript Developers" course outline by Josh Comeau (concept list, then look up the specifics)
- [ ] Read: WCAG 2.1 AA quick reference (focus on perceivable and operable principles)

**System design / domain**
- [ ] Build a responsive card grid from scratch in 30 minutes using CSS Grid, no framework
- [ ] Build a sticky header with a hamburger menu that opens an accessible drawer (keyboard + screen reader friendly)
- [ ] List the 7 most common ARIA roles and when to use each

**Behavioral prep**
- [ ] Refine 2 more STAR stories — one about leadership/mentoring, one about handling ambiguity

**Milestone (end of week)**
- Recreate a Twitter card layout in HTML/CSS from a screenshot in under 30 minutes. Explain why `aria-label` and `<label for>` solve different problems.

### Week 4: Framework deep dive (React, Vue, or Angular)

**Focus:** pick one and learn it well enough to teach. Interviewers can smell shallow framework knowledge in 30 seconds.

**Algorithms (target: 12 problems)**
- [ ] Trees — 7 medium (Binary Tree Level Order Traversal, Validate BST, Lowest Common Ancestor, Construct Tree from Preorder/Inorder)
- [ ] Recursion warmups — 5 problems (Subsets, Permutations, Combinations)

**Theory (React track)**
- [ ] Read: official React docs "Learn" section — read every page including Escape Hatches
- [ ] Read: "A Complete Guide to useEffect" by Dan Abramov (the original blog post)
- [ ] Read: an introduction to React Fiber (any of the well-known explainer articles by Lin Clark or Andrew Clark)
- [ ] Implement: a custom `useState` and `useEffect` from scratch in plain JS

**Theory (Vue track)**
- [ ] Read: official Vue 3 docs end to end, focusing on the Reactivity in Depth section
- [ ] Implement: a tiny reactivity system using Proxy that supports `reactive`, `ref`, and `effect`

**Theory (Angular track)**
- [ ] Read: official Angular docs on change detection, zones, dependency injection
- [ ] Implement: a small RxJS pipeline that combines two streams with `combineLatest` and debounces input

**System design / domain**
- [ ] Diagram the component lifecycle for your chosen framework on a whiteboard from memory
- [ ] Explain reconciliation (React), reactivity (Vue), or change detection (Angular) in 3 minutes

**Behavioral prep**
- [ ] Practice all 5 STAR stories out loud, recording yourself

**Milestone (end of week)**
- Implement a working `useState` (or Vue `ref`) clone from scratch. Explain your framework's update cycle without diagrams in under 3 minutes.

### Week 5: Web performance and tooling

**Focus:** Core Web Vitals, bundle size, render performance. This is where senior frontend interviews differentiate.

**Algorithms (target: 10 problems)**
- [ ] Graphs — 5 medium (Number of Islands, Clone Graph, Pacific Atlantic Water Flow)
- [ ] BFS/DFS — 5 medium (Word Ladder, Course Schedule, Rotting Oranges)

**Theory**
- [ ] Read: web.dev's "Learn Core Web Vitals" section (LCP, INP, CLS in depth)
- [ ] Read: "High Performance Browser Networking" — chapters on HTTP/2, HTTP/3, and the browser's resource loading model
- [ ] Watch: any current Chrome DevTools Performance panel walkthrough from the official Chrome for Developers channel

**System design / domain**
- [ ] Audit a real production website (yours or a public one) with Lighthouse and write a 1-page report of the top 5 issues and how you'd fix each
- [ ] Take a webpack/Vite config and explain every entry — what does each plugin do, why is it there
- [ ] List the rendering strategies: CSR, SSR, SSG, ISR, streaming SSR — when to use each

**Behavioral prep**
- [ ] Prepare 3 questions to ask the interviewer (specific to team, not generic)

**Milestone (end of week)**
- Explain what causes a large CLS score and the 4 most common fixes. Take any bundle and identify the top 3 size offenders using webpack-bundle-analyzer or equivalent.

### Week 6: Frontend system design and browser internals

**Focus:** "design Twitter's feed" but the frontend half — components, state shape, data fetching, caching, virtualization.

**Algorithms (target: 8 problems)**
- [ ] Dynamic Programming — 5 medium (Climbing Stairs, House Robber, Longest Increasing Subsequence, Coin Change, Word Break)
- [ ] Backtracking — 3 medium (Generate Parentheses, Letter Combinations of a Phone Number, Word Search)

**Theory**
- [ ] Read: "How Browsers Work" by Tali Garsiel (the canonical long-form essay)
- [ ] Read: "Frontend System Design" sections of any well-known prep site (study the structure: requirements → component tree → state → API → optimizations)
- [ ] Study: the rendering pipeline (parse HTML → DOM → CSSOM → render tree → layout → paint → composite)

**System design / domain**
- [ ] Design exercise: Design a chat UI like Slack — components, message virtualization, optimistic sends, websocket reconnection, unread state, scroll restoration
- [ ] Design exercise: Design an infinite-scroll feed like Twitter — windowing strategy, pagination cursor vs offset, prefetch, cache invalidation, pull-to-refresh
- [ ] Design exercise: Design an autocomplete component — debouncing, cancellation, caching, keyboard navigation, accessibility
- [ ] Write up each design as a 1-page document with diagrams

**Behavioral prep**
- [ ] Run through all STAR stories one more time, focus on cutting filler words

**Milestone (end of week)**
- Whiteboard a chat UI design in 45 minutes that covers components, state, network, and performance. Diagram the browser rendering pipeline from URL to pixel.

### Week 7: JavaScript puzzles, behavioral, and weak-area drills

**Focus:** the "tricky" interview questions and the soft side.

**Algorithms (target: 8 problems)**
- [ ] Mixed review — pick 8 problems from your weakest 2 categories from the last 6 weeks. Re-solve them in under 25 minutes each.

**Theory**
- [ ] Drill: classic JS puzzles — event loop order with setTimeout/Promise/queueMicrotask, `this` in arrow vs regular functions, hoisting edge cases, type coercion gotchas
- [ ] Drill: implement from scratch — `Function.prototype.bind`, `Array.prototype.map`, `Array.prototype.reduce`, a simple event emitter, a curry function

**System design / domain**
- [ ] Mock design: take any prompt you haven't seen and design it solo in 45 minutes on paper. Examples: design a photo gallery with lazy loading, design a comments section with nested replies, design a rich text editor toolbar

**Behavioral prep**
- [ ] Conduct 1 mock behavioral interview with a peer — 30 minutes, they ask, you answer cold
- [ ] Write down every awkward pause, fill them with better content next attempt

**Milestone (end of week)**
- Predict the console output of 5 tricky event-loop snippets correctly without running them. Deliver all 5 STAR stories without notes.

### Week 8: Mock interviews and review

**Focus:** simulate the real thing, find leaks, plug them.

**Algorithms (target: 5 mock-style problems)**
- [ ] Solve 5 random medium problems under timed conditions (25 min each), out loud, narrating your thought process

**Theory**
- [ ] No new material. Re-read your own notes from weeks 1-7.

**System design / domain**
- [ ] 2 mock system design interviews with a peer (45 min each) — one chat UI variant, one feed variant
- [ ] After each mock, write a 1-page self-assessment

**Behavioral prep**
- [ ] 1 full mock interview loop with a peer or a paid service — coding + system design + behavioral back to back
- [ ] Final pass on STAR stories — they should sound effortless

**Milestone (end of week)**
- Complete a full mock loop and score yourself a passing grade on each round. If you can't, identify which round failed and spend 2 extra days drilling that.

## Final week checklist

- [ ] Mock coding interview with a friend (45 min, problem you've never seen)
- [ ] Mock system design with a friend (45 min, frontend prompt)
- [ ] Mock behavioral with a friend (30 min, 5 STAR questions)
- [ ] Re-read your top 5 STAR stories one final time
- [ ] Confirm interview format with recruiter (rounds, length, tools, languages allowed)
- [ ] Prepare 5 questions to ask each interviewer type (hiring manager, peer, skip-level)
- [ ] Test your hardware: camera, mic, screen share, whiteboard tool (Excalidraw, CoderPad, etc.)
- [ ] Sleep 8 hours the night before — non-negotiable

## If you have less time

**Compressed 4-week version:**

- Week 1 = Weeks 1+2 condensed. Skip prototype implementations, keep promises and event loop.
- Week 2 = Weeks 3+4 condensed. Skip HTML/CSS deep dive, focus only on framework internals for your chosen framework.
- Week 3 = Weeks 5+6 condensed. Skip browser internals deep dive, focus on Core Web Vitals and 2 system design exercises.
- Week 4 = Weeks 7+8 condensed. 1 mock interview, drill weak algorithm category, finalize STAR stories.

**Compressed 2-week version (emergency):**

- Week 1: 30 medium LeetCode problems across arrays/strings/trees/graphs, framework internals refresher, 3 STAR stories.
- Week 2: 1 frontend system design exercise, 1 mock interview, finalize 5 STAR stories, hardware check.

## If you have more time

- Add a second framework. If you know React, build something non-trivial in Vue or Svelte. Interviewers love candidates who can compare paradigms.
- Contribute a non-trivial PR to an open source UI library (Radix, shadcn, Headless UI, your framework of choice). One real PR teaches more than 10 tutorials.
- Read "Refactoring UI" by Adam Wathan and Steve Schoger end to end. Frontend interviewers increasingly ask about visual taste.
- Build a small design system: button, input, modal, dropdown, table. Document it. This is a portfolio piece and a learning project at once.
- Learn the basics of WebGL or Canvas — even shallow knowledge differentiates you for graphics-heavy products.
