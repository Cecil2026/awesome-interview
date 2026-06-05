# Fullstack Engineer Interview Roadmap (10-week plan)

## Who this is for

Mid-level fullstack engineer with 3-6 years of experience targeting product engineering roles at startups or mid-size companies that interview on both halves of the stack. You've shipped features that span frontend and backend in the same sprint. You're competent in both layers but not deeply expert in either — that gap is exactly what this plan closes. The plan is 10 weeks (2 longer than the role-specific plans) because the surface area is larger and you cannot fake depth on either side.

## Time commitment

- Weekday: 1.5-2 hours
- Weekend: 5-7 hours
- Total: ~120-150 hours over 10 weeks

## Prerequisites

- You've shipped at least one production feature end to end (database to UI)
- You're fluent in at least one backend language and at least one frontend framework
- You can write SQL and you can write CSS — not deeply, but competently
- You've debugged across the boundary (frontend bug that turned out to be a backend bug, or vice versa)
- You can use git from the command line

## The plan

### Week 1: Algorithm foundation — arrays, strings, hashmaps

**Focus:** the patterns that show up in any technical screen regardless of role.

**Algorithms (target: 20 problems)**
- [ ] Arrays — 8 easy/medium (Two Sum, Best Time to Buy and Sell Stock, Contains Duplicate, Product of Array Except Self, Maximum Subarray, Merge Intervals)
- [ ] Strings — 6 easy/medium (Valid Anagram, Group Anagrams, Longest Palindromic Substring, Valid Palindrome)
- [ ] Hashmaps and sets — 6 medium (Top K Frequent Elements, Longest Consecutive Sequence, Subarray Sum Equals K)

**Theory**
- [ ] Refresh Big-O: time and space, amortized analysis, common complexities (O(1), O(log n), O(n), O(n log n), O(n²), O(2ⁿ))
- [ ] Watch: any well-known refresher on time/space complexity

**System design / domain**
- [ ] One-page note: when to choose array vs hashmap vs sorted structure for typical web app workloads

**Behavioral prep**
- [ ] Write your "tell me about yourself" pitch (60-90 seconds)
- [ ] List 10 candidate STAR stories from your last 3-4 years — fullstack candidates need stories that demonstrate breadth

**Milestone (end of week)**
- Solve 3 random medium problems in 25 minutes each, narrating out loud. Explain hash collision strategies in 90 seconds.

### Week 2: Algorithms — two pointers, stack, linked lists, sliding window

**Focus:** the second tier of patterns that round out a phone screen toolkit.

**Algorithms (target: 20 problems)**
- [ ] Two Pointers — 6 medium (Container With Most Water, 3Sum, Trapping Rain Water)
- [ ] Sliding Window — 6 medium (Longest Substring Without Repeating Characters, Minimum Window Substring, Permutation in String)
- [ ] Stack — 4 medium (Valid Parentheses, Min Stack, Daily Temperatures, Largest Rectangle in Histogram)
- [ ] Linked Lists — 4 easy/medium (Reverse Linked List, Merge Two Sorted Lists, Linked List Cycle, Remove Nth Node from End)

**Theory**
- [ ] Implement a doubly-linked list with insert/delete/find in your interview language
- [ ] Implement an LRU cache from scratch (hashmap + doubly linked list)

**System design / domain**
- [ ] Note: where LRU caches show up in real systems (CPU caches, browser caches, Redis, application caches)

**Behavioral prep**
- [ ] Refine 3 STAR stories — one fullstack feature ship, one cross-team collaboration, one technical failure

**Milestone (end of week)**
- Implement LRU cache from memory in 25 minutes. Solve Minimum Window Substring cold.

### Week 3: Algorithms — trees, graphs, recursion

**Focus:** the patterns that appear in every onsite, and the foundation for everything in week 4.

**Algorithms (target: 20 problems)**
- [ ] Binary Trees — 8 medium (Level Order Traversal, Validate BST, Lowest Common Ancestor, Maximum Depth, Path Sum, Serialize and Deserialize)
- [ ] Graphs BFS/DFS — 6 medium (Number of Islands, Clone Graph, Course Schedule, Pacific Atlantic Water Flow)
- [ ] Recursion/Backtracking — 6 medium (Subsets, Permutations, Combination Sum, Word Search)

**Theory**
- [ ] Implement from scratch in your interview language: BFS, DFS (iterative and recursive), preorder/inorder/postorder traversal, topological sort
- [ ] Read: CLRS chapter on graph algorithms (or equivalent algorithms textbook chapter)

**System design / domain**
- [ ] Note: where tree and graph algorithms show up in real apps (DOM, file systems, social graph, dependency resolution)

**Behavioral prep**
- [ ] Refine 4 more STAR stories — leadership/mentoring, conflict, handling ambiguity, success

**Milestone (end of week)**
- Implement BFS and DFS from memory. Solve "Validate BST" and "Course Schedule" cold.

### Week 4: Frontend deep dive part 1 — language and framework internals

**Focus:** pick one framework (React, Vue, or Angular) and learn it well enough to teach.

**Algorithms (target: 10 problems)**
- [ ] DP 1D — 5 medium (Climbing Stairs, House Robber, Coin Change, Longest Increasing Subsequence, Word Break)
- [ ] Mixed review — 5 medium from your weakest category in weeks 1-3

**Theory — JavaScript foundations**
- [ ] Read: "You Don't Know JS Yet" — Scope & Closures, this & Object Prototypes
- [ ] Study: event loop (call stack, task queue, microtask queue), with concrete examples
- [ ] Implement from scratch: `Promise.all`, `debounce`, `throttle`, `deepClone`

**Theory — framework internals (pick one)**
- [ ] React: read official docs "Learn" section end to end, then "A Complete Guide to useEffect" by Dan Abramov, then any explainer on React Fiber; implement a custom `useState` from scratch
- [ ] Vue: read official Vue 3 docs end to end including Reactivity in Depth; implement a tiny reactivity system using Proxy
- [ ] Angular: read official docs on change detection, zones, dependency injection; implement an RxJS pipeline combining two streams

**System design / domain**
- [ ] Diagram your framework's component lifecycle from memory on a whiteboard

**Behavioral prep**
- [ ] Practice 5 STAR stories out loud, time each one

**Milestone (end of week)**
- Implement `useState` (or Vue `ref`) clone from scratch. Explain your framework's update cycle in under 3 minutes without diagrams.

### Week 5: Frontend deep dive part 2 — HTML, CSS, performance

**Focus:** the parts of frontend interviews that pure framework prep ignores.

**Algorithms (target: 10 problems)**
- [ ] DP 2D — 5 medium (Unique Paths, Longest Common Subsequence, Edit Distance)
- [ ] Heap — 5 medium (Kth Largest Element, Top K Frequent Elements, Merge K Sorted Lists, Find Median from Data Stream)

**Theory — HTML/CSS**
- [ ] Read: MDN's CSS Layout section in depth (flexbox and grid)
- [ ] Read: WCAG 2.1 AA quick reference (focus on perceivable and operable principles)
- [ ] Build: a responsive card grid from scratch in 30 minutes using CSS Grid
- [ ] Build: an accessible modal dialog (focus trap, ESC to close, ARIA roles, return focus on close)

**Theory — performance**
- [ ] Read: web.dev's "Learn Core Web Vitals" section (LCP, INP, CLS)
- [ ] Study: rendering strategies — CSR, SSR, SSG, ISR, streaming SSR; when each applies
- [ ] Audit a real website with Lighthouse and write a 1-page report of top 5 issues and fixes

**System design / domain**
- [ ] Frontend system design exercise: design an autocomplete component (debouncing, cancellation, caching, keyboard nav, accessibility)
- [ ] Frontend system design exercise: design a chat UI (components, virtualization, optimistic sends, reconnection)

**Behavioral prep**
- [ ] Practice all STAR stories out loud, recording yourself

**Milestone (end of week)**
- Recreate a Twitter card layout in HTML/CSS from a screenshot in 30 minutes. Explain causes of high CLS and the 4 most common fixes.

### Week 6: Backend deep dive part 1 — databases and APIs

**Focus:** be the candidate who can answer "why is this query slow" without guessing.

**Algorithms (target: 10 problems)**
- [ ] Binary Search — 5 medium (Search in Rotated Sorted Array, Search a 2D Matrix, Koko Eating Bananas)
- [ ] Tries — 3 medium (Implement Trie, Word Search II, Add and Search Word)
- [ ] Mixed review — 2 medium from your weakest category

**Theory — databases**
- [ ] Read: "Designing Data-Intensive Applications" (DDIA) by Martin Kleppmann — chapters 1, 2, 3 (data systems, data models, storage)
- [ ] Read: DDIA chapter 7 (transactions) — isolation levels, anomalies each prevents
- [ ] Read: "Use the Index, Luke" by Markus Winand — B-tree indexes, composite indexes, index-only scans
- [ ] Hands-on: spin up Postgres locally, create a 1M-row table, run EXPLAIN ANALYZE on 5 queries, add an index, re-run, observe

**Theory — APIs**
- [ ] Study: REST vs GraphQL vs gRPC — when to use each, tradeoffs
- [ ] Study: idempotency, why it matters for retries, how to design idempotent endpoints
- [ ] Study: pagination strategies (offset, cursor, keyset) and their tradeoffs
- [ ] Study: authentication patterns (session cookies, JWT, OAuth 2 + PKCE, API keys) and when each fits

**System design / domain**
- [ ] Note: read 3 well-known engineering blog posts on API design (Stripe, GitHub, Shopify all have good public material)

**Behavioral prep**
- [ ] 1 mock behavioral interview with a peer (30 min)

**Milestone (end of week)**
- Read an EXPLAIN ANALYZE output and identify the slow operation. Explain the difference between READ COMMITTED and REPEATABLE READ with a concrete example. Articulate the tradeoffs between offset and cursor pagination.

### Week 7: Backend deep dive part 2 — distributed systems

**Focus:** vocabulary and tradeoffs. Fullstack candidates rarely get asked to design Paxos, but you must speak the language.

**Algorithms (target: 10 problems)**
- [ ] Topological sort and Union-Find — 4 medium (Course Schedule II, Number of Connected Components, Graph Valid Tree)
- [ ] Hard problem set — 3 hard problems across patterns you've practiced (one DP, one graph, one tree), 40 min each
- [ ] Mixed review — 3 medium from your weakest category

**Theory**
- [ ] Read: DDIA chapters 5 (replication), 6 (partitioning), 9 (consistency and consensus)
- [ ] Watch or read: a clear explainer on the Raft consensus algorithm
- [ ] Study: CAP theorem — what it actually says, PACELC extension
- [ ] Study: eventual consistency, causal consistency, linearizability — what each guarantees and what it costs

**Topics to be able to explain in 2 minutes each**
- [ ] Leader election
- [ ] Quorum reads and writes (W + R > N)
- [ ] Sharding strategies: range, hash, consistent hashing
- [ ] Replication: leader-follower, multi-leader, leaderless
- [ ] Caching patterns: cache-aside, write-through, write-behind, read-through; cache invalidation strategies
- [ ] Message queues: Kafka vs RabbitMQ vs SQS, at-least-once vs exactly-once delivery

**System design / domain**
- [ ] Backend system design exercise: design a URL shortener (API, encoding, scale, caching, analytics)
- [ ] Backend system design exercise: design a rate limiter (token bucket, sliding window, distributed enforcement)

**Behavioral prep**
- [ ] Refine all STAR stories one more pass — each should land in 90-120 seconds

**Milestone (end of week)**
- Explain CAP theorem in 3 sentences with a real-world CP example and AP example. Whiteboard a URL shortener with capacity estimation in 45 minutes.

### Week 8: System design — fullstack designs that span both layers

**Focus:** designs that touch frontend, API, and backend together — the kind fullstack interviews actually ask.

**Algorithms (target: 8 problems)**
- [ ] Mixed timed review — 8 medium problems, 25 min each, narrated out loud. Pick from categories where your previous solve time was slow.

**Theory**
- [ ] Read: "System Design Interview" Vol. 1 by Alex Xu — selected chapters
- [ ] Read: any well-known system design primer (the "System Design Primer" repo is the canonical free reference)

**The five fullstack designs (one per day, ~3 hours each)**
- [ ] Design Google Docs (collaborative editing) — frontend rich text editor, conflict resolution (OT or CRDT), websocket protocol, persistence, presence indicators
- [ ] Design Instagram — feed UI, image upload pipeline, CDN, fan-out strategy, search, notifications
- [ ] Design a video streaming product (basic Netflix) — player UI, adaptive bitrate, CDN, recommendation surfaces, account/profile model
- [ ] Design a multiplayer browser game lobby — matchmaking, websocket vs polling, server-authoritative state, reconnection, anti-cheat basics
- [ ] Design an e-commerce checkout flow — cart state across devices, inventory consistency, payment processor integration, idempotent order creation, fraud signals

**For each design, produce**
- [ ] A whiteboard-style diagram showing frontend, API, and backend
- [ ] A 1-page write-up: requirements → estimates → API contract → data model → frontend state shape → backend architecture → deep dive on 1-2 components → bottlenecks

**Behavioral prep**
- [ ] Prepare 5 thoughtful questions to ask each interviewer type

**Milestone (end of week)**
- Whiteboard a collaborative editor design in 45 minutes covering frontend state, sync protocol, and backend persistence. Articulate OT vs CRDT tradeoffs.

### Week 9: Behavioral, role-specific topics, and weak-area drills

**Focus:** the soft side, and any specialized topic the target role expects.

**Algorithms (target: 8 problems)**
- [ ] Mixed review — 8 problems from your two weakest categories across all 8 prior weeks. Time-box to 25 min each.

**Theory — role-specific (pick 1-2 based on the role)**
- [ ] If applying to platform/DevOps-leaning teams: containers (Docker basics), orchestration (Kubernetes pods/services/deployments), CI/CD pipelines, observability (logs, metrics, traces)
- [ ] If applying to data-heavy teams: ETL vs ELT, data warehousing basics (Snowflake/BigQuery model), batch vs stream processing
- [ ] If applying to ML-adjacent teams: model serving basics, feature stores, A/B testing infrastructure
- [ ] If applying to a startup: practice scoping questions — "we have 2 weeks, what would you cut" — and demonstrating product judgment

**Behavioral prep**
- [ ] 1 full mock behavioral interview (45 min) with a peer or paid service
- [ ] Drill the "fullstack" behavioral angle: a story about debugging across the stack, a story about a tradeoff between frontend and backend ownership, a story about helping a teammate on the other side of the stack

**System design / domain**
- [ ] 1 additional system design exercise from a fresh pool you haven't used

**Milestone (end of week)**
- Deliver 5 STAR stories without notes, each under 2 minutes. Articulate one role-specific topic in depth in a 5-minute response.

### Week 10: Mock interviews and final review

**Focus:** simulate the full loop, find leaks, plug them.

**Algorithms (target: timed practice)**
- [ ] 5 days of 1 random medium problem each, 25 min timed, out loud
- [ ] 2 days of 1 hard problem each, 40 min timed, out loud

**Theory**
- [ ] No new material. Re-read your own notes from weeks 1-9.

**System design / domain**
- [ ] 3 mock system design interviews with peers (45 min each) — fresh prompts only
- [ ] After each, write a 1-page self-assessment

**Behavioral prep**
- [ ] 1 full mock loop end to end (coding + frontend + backend + system design + behavioral) with a peer or paid service
- [ ] Final pass on STAR stories

**Milestone (end of week)**
- Complete a full mock loop and rate yourself a passing grade on each round. If any round fails, spend 2 extra days on that weakness before the real interview.

## Final week checklist

- [ ] Mock coding interview with a friend (45 min, unseen problem)
- [ ] Mock frontend round (45 min — component coding or framework discussion)
- [ ] Mock backend round (45 min — API or database design)
- [ ] Mock system design (45 min, unseen fullstack prompt)
- [ ] Mock behavioral (30 min, 5 STAR questions)
- [ ] Confirm interview format with recruiter (rounds, length, tools, languages allowed)
- [ ] Re-read your top 5 STAR stories one final time
- [ ] Prepare 5 questions per interviewer type
- [ ] Test hardware: camera, mic, screen share, coding tool, whiteboard tool
- [ ] Sleep 8 hours the night before — non-negotiable

## If you have less time

**Compressed 5-week version:**

- Week 1 = Weeks 1+2+3 algorithm content compressed (40 medium problems across all foundational patterns)
- Week 2 = Weeks 4+5 frontend compressed (framework internals + Core Web Vitals + 1 frontend system design)
- Week 3 = Weeks 6+7 backend compressed (DDIA chapters 1, 5, 9 + 1 backend system design)
- Week 4 = Week 8 reduced (2 fullstack system designs instead of 5)
- Week 5 = Weeks 9+10 compressed (1 mock loop, STAR stories finalized, weak areas drilled)

**Compressed 3-week version (emergency):**

- Week 1: 30 medium LeetCode problems across all major patterns. Framework internals refresh. 3 STAR stories.
- Week 2: Read DDIA chapters 1, 5, 9. 1 frontend system design + 1 backend system design.
- Week 3: 1 mock loop. Finalize 5 STAR stories. Hardware check. Final review.

## If you have more time

- Pick a second framework on each side of the stack. If you know React and Postgres, learn enough Svelte and Mongo to compare paradigms. Fullstack interviewers love candidates who can explain tradeoffs across choices.
- Read DDIA cover to cover, not just the assigned chapters.
- Build one nontrivial fullstack side project from scratch on infrastructure you don't normally use (deploy to Fly.io, Render, or Cloudflare Workers if you usually use AWS, or vice versa). The novel infra exposes you to constraints your usual stack hides.
- Contribute a non-trivial PR to an open source fullstack project (Supabase, Next.js, NestJS, Remix). One real PR teaches more than 10 tutorials.
- Study 5 published engineering blog posts from teams you'd like to join. Take notes on the architecture decisions and the tradeoffs they discuss. Reference them in your interviews.
- Practice explaining your past projects across the stack: how the data flows from a database row to a pixel on screen. This is the canonical fullstack interview narrative.
