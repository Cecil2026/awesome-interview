# Backend Engineer Interview Roadmap (8-week plan)

## Who this is for

Mid-level backend engineer with 3-5 years of experience targeting L5-equivalent SWE roles at FAANG-tier or high-bar startups. Comfortable with one backend language (Go, Java, Python, C++, Rust), has shipped production services, but historically weaker on system design at scale and on the algorithm bar that top companies enforce. You've used a database in production but maybe never explained an EXPLAIN plan in an interview.

## Time commitment

- Weekday: 1.5-2 hours
- Weekend: 5-7 hours
- Total: ~100-120 hours over 8 weeks

## Prerequisites

- Fluent in at least one backend language (you can write a hash map, a recursive function, and a goroutine/thread without docs)
- You've deployed a service that talks to a database and survived production traffic
- You can read SQL and write a JOIN without help
- You understand HTTP at the request/response level — status codes, methods, headers
- You can use git from the command line

## The plan

### Week 1: Algorithm foundation — arrays, strings, hashing

**Focus:** rebuild fluency on the patterns that show up in 60% of phone screens.

**Algorithms (target: 25 problems)**
- [ ] Arrays — 10 problems mixed easy/medium (Two Sum, Best Time to Buy and Sell Stock, Product of Array Except Self, Maximum Subarray, Merge Intervals, Rotate Image)
- [ ] Strings — 8 problems mixed easy/medium (Valid Anagram, Group Anagrams, Longest Palindromic Substring, Encode and Decode Strings)
- [ ] Hashmaps and sets — 7 medium problems (Top K Frequent Elements, Longest Consecutive Sequence, Subarray Sum Equals K)

**Theory**
- [ ] Read: "Introduction to Algorithms" (CLRS) — chapter on hashing
- [ ] Re-derive: average and worst-case time complexity for hash table operations, and why
- [ ] Watch: any well-known refresher on Big-O — focus on amortized analysis

**System design / domain**
- [ ] Write a one-page summary of when to choose an array vs linked list vs hashmap vs sorted structure, with example workloads

**Behavioral prep**
- [ ] Write your "tell me about yourself" (60-90 seconds, three beats)
- [ ] List 10 candidate STAR stories from your last 3-4 years

**Milestone (end of week)**
- Solve 3 random medium problems in 25 minutes each, narrating out loud. Explain hash table collision resolution in 90 seconds.

### Week 2: Trees, graphs, and traversal patterns

**Focus:** the bread-and-butter of backend technical screens.

**Algorithms (target: 25 problems)**
- [ ] Binary Trees — 8 medium (Binary Tree Level Order Traversal, Validate BST, Lowest Common Ancestor, Construct Tree from Preorder/Inorder, Serialize and Deserialize Binary Tree)
- [ ] Tries — 3 medium (Implement Trie, Word Search II, Add and Search Word)
- [ ] Graphs (BFS/DFS) — 8 medium (Number of Islands, Clone Graph, Pacific Atlantic Water Flow, Word Ladder)
- [ ] Topological sort — 3 medium (Course Schedule I and II, Alien Dictionary)
- [ ] Union-Find — 3 medium (Number of Connected Components, Graph Valid Tree, Accounts Merge)

**Theory**
- [ ] Read: CLRS chapters on trees and graphs (or any equivalent algorithms textbook chapter)
- [ ] Implement from scratch in your interview language: BFS, DFS (iterative and recursive), Dijkstra, topological sort, Union-Find with path compression

**System design / domain**
- [ ] Diagram the difference between adjacency list and adjacency matrix, with memory and runtime tradeoffs

**Behavioral prep**
- [ ] Refine 4 STAR stories — technical depth, cross-team collaboration, conflict, failure

**Milestone (end of week)**
- Implement BFS, DFS, and Dijkstra from memory in your interview language. Solve "Course Schedule II" cold in 30 minutes.

### Week 3: Dynamic programming and backtracking

**Focus:** the patterns that separate "solid" from "strong" in coding rounds.

**Algorithms (target: 20 problems)**
- [ ] DP 1D — 8 medium (Climbing Stairs, House Robber I and II, Coin Change, Longest Increasing Subsequence, Word Break, Decode Ways)
- [ ] DP 2D — 7 medium/hard (Unique Paths, Longest Common Subsequence, Edit Distance, Best Time to Buy and Sell Stock with Cooldown, Interleaving String)
- [ ] Backtracking — 5 medium (Subsets, Permutations, Combination Sum, Word Search, N-Queens)

**Theory**
- [ ] Read: a structured DP guide (the LeetCode DP study plan, or any well-known systematic DP tutorial)
- [ ] Practice: state-definition exercises — for each problem, write the state, the transition, the base case, and the order of computation before writing any code

**Databases (start here)**
- [ ] Read: "Designing Data-Intensive Applications" (DDIA) by Martin Kleppmann — chapters 1 and 2 (foundations of data systems, data models)

**System design / domain**
- [ ] Write a 1-page note explaining when DP applies (optimal substructure + overlapping subproblems) and how to spot it

**Behavioral prep**
- [ ] Refine 3 more STAR stories — leadership/mentoring, handling ambiguity, a successful project shipped

**Milestone (end of week)**
- Solve "Edit Distance" and "Word Break" cold without notes. Articulate the DP state for a problem you've never seen in under 5 minutes.

### Week 4: Databases — internals, indexes, transactions

**Focus:** be the candidate who can answer "why is this query slow" without guessing.

**Algorithms (target: 15 problems)**
- [ ] Heap/Priority Queue — 5 medium (Kth Largest Element, Top K Frequent Elements, Merge K Sorted Lists, Find Median from Data Stream)
- [ ] Binary Search — 5 medium (Search in Rotated Sorted Array, Find Minimum in Rotated Sorted Array, Search a 2D Matrix, Koko Eating Bananas)
- [ ] Sliding Window — 5 medium (Longest Repeating Character Replacement, Permutation in String, Minimum Window Substring)

**Theory**
- [ ] Read: DDIA chapters 3 (storage and retrieval) and 7 (transactions) end to end
- [ ] Read: "Use the Index, Luke" by Markus Winand — sections on B-tree indexes and composite indexes
- [ ] Study: B-tree vs LSM-tree, when each is used, write/read amplification tradeoffs
- [ ] Study: isolation levels — read uncommitted, read committed, repeatable read, serializable — and which anomalies each prevents

**Hands-on**
- [ ] Spin up Postgres locally. Create a table with 1M rows. Run EXPLAIN ANALYZE on 5 queries. Add an index. Re-run. Observe.
- [ ] Reproduce a phantom read or a non-repeatable read with two concurrent psql sessions

**System design / domain**
- [ ] Write a 1-page note on: when to use a single-column index vs composite, why index order matters, when an index hurts performance

**Behavioral prep**
- [ ] Practice all STAR stories out loud, time them — each should land in 90-120 seconds

**Milestone (end of week)**
- Read an EXPLAIN ANALYZE output and identify the slow operation. Explain the difference between READ COMMITTED and REPEATABLE READ with a concrete example.

### Week 5: Distributed systems

**Focus:** the vocabulary and the tradeoffs. You will not implement Raft in an interview, but you must speak its language.

**Algorithms (target: 12 problems)**
- [ ] Mixed review — 12 problems from your weakest 2 categories so far. Time-box each to 25 minutes.

**Theory**
- [ ] Read: DDIA chapters 5 (replication), 6 (partitioning), 8 (the trouble with distributed systems), 9 (consistency and consensus)
- [ ] Watch or read: a clear explainer on the Raft consensus algorithm (the original Raft paper is readable, or the "Raft visualization" interactive walkthrough)
- [ ] Study: CAP theorem — what it actually says vs how it's misquoted; PACELC extension
- [ ] Study: eventual consistency, causal consistency, linearizability, serializability — what each guarantees and what it costs

**Topics to be able to explain in 2 minutes each**
- [ ] Leader election and why it's hard
- [ ] Quorum reads and writes (W + R > N)
- [ ] Two-phase commit and why it blocks
- [ ] Vector clocks vs Lamport timestamps
- [ ] Sharding strategies: range, hash, consistent hashing
- [ ] Replication: leader-follower, multi-leader, leaderless
- [ ] Conflict resolution: last-write-wins, CRDTs

**Behavioral prep**
- [ ] 1 mock behavioral interview with a peer (30 min)

**Milestone (end of week)**
- Explain CAP theorem accurately in 3 sentences and give a real-world example of a CP system and an AP system. Describe Raft leader election in 5 minutes without notes.

### Week 6: System design — the classic five

**Focus:** rehearse the five canonical designs until they are reflex.

**Algorithms (target: 10 problems)**
- [ ] Mixed timed review — 10 medium/hard problems, 30 min each, narrate out loud

**Theory**
- [ ] Read: "System Design Interview" Vol. 1 by Alex Xu — selected chapters matching the five designs below
- [ ] Read: any well-known system design primer (the "System Design Primer" repo is the canonical free reference) — skim the section on capacity estimation

**The five designs (one per day, ~3 hours each)**
- [ ] Design a URL shortener — requirements, API, base62 encoding, hash collisions, scale to 100M URLs/day, caching strategy, analytics
- [ ] Design a chat system like WhatsApp — 1:1 and group chat, message ordering, delivery receipts, online presence, push notifications, end-to-end encryption tradeoffs
- [ ] Design a news feed like Twitter/Facebook — fan-out on write vs fan-out on read, celebrity problem, caching, ranking, pagination
- [ ] Design a search system like Google Search — crawling, indexing (inverted index), ranking, query serving, autocomplete
- [ ] Design a rate limiter — token bucket vs leaky bucket vs fixed window vs sliding window, distributed rate limiting, where to enforce (gateway vs service)

**For each design, produce**
- [ ] A whiteboard-style diagram
- [ ] A 1-page write-up: requirements → estimates → API → data model → high-level architecture → deep dive on 1-2 components → bottlenecks and mitigations

**Behavioral prep**
- [ ] Prepare 5 thoughtful questions to ask each interviewer type (peer engineer, hiring manager, skip-level)

**Milestone (end of week)**
- Whiteboard a URL shortener end to end in 45 minutes including capacity estimation. Explain the celebrity problem in news feed design and two ways to handle it.

### Week 7: Concurrency, language deep-dive, behavioral

**Focus:** the topics that separate strong candidates from average ones once the algorithm bar is met.

**Algorithms (target: 8 problems)**
- [ ] 8 hard problems across the patterns you've practiced. Time-box to 40 min each.

**Theory — concurrency**
- [ ] Study: mutex vs semaphore vs read-write lock vs spinlock — when to use each
- [ ] Study: deadlock — the four conditions, how to prevent or detect
- [ ] Study: race conditions, memory ordering, atomic operations
- [ ] Study: the actor model (Erlang/Akka) vs CSP (Go channels) vs shared-memory threads

**Theory — language deep-dive (pick one for your interview language)**
- [ ] Go: goroutine scheduler internals, channels under the hood, GC behavior, escape analysis, common pitfalls (loop variable capture, nil channel reads)
- [ ] Java: JMM (Java Memory Model), volatile vs synchronized, ConcurrentHashMap internals, GC algorithms (G1, ZGC), JIT
- [ ] Python: GIL — what it actually does, when it hurts, when it doesn't; asyncio event loop; CPython object model
- [ ] C++: move semantics, RAII, smart pointers, memory model (acquire/release), template basics
- [ ] Rust: ownership and borrowing, Send/Sync, async/await runtime model, common lifetime errors

**System design / domain**
- [ ] 1 additional system design exercise from a pool you haven't used: design Uber's ride matching, design a distributed cache like Redis, design a queue like Kafka, design Dropbox file sync

**Behavioral prep**
- [ ] 1 full mock behavioral interview (30-45 min) with a peer
- [ ] Final pass on STAR stories — they should sound effortless and concise

**Milestone (end of week)**
- Explain your language's concurrency model in 5 minutes and give two real bugs you've fixed in it. Whiteboard one new system design in 45 minutes.

### Week 8: Mock interviews and weak-area review

**Focus:** simulate the loop. Find leaks. Plug them.

**Algorithms (target: timed practice)**
- [ ] 5 days of 1 random medium problem each, 25 min timed, out loud
- [ ] 2 days of 1 hard problem each, 45 min timed, out loud

**Theory**
- [ ] No new material. Re-read your own notes from weeks 1-7.

**System design / domain**
- [ ] 3 mock system design interviews with peers (45 min each) — use prompts you have not seen before
- [ ] After each, write a 1-page self-assessment: what you missed, what to deepen

**Behavioral prep**
- [ ] 1 full mock loop with a peer or paid service — coding + system design + behavioral end to end
- [ ] Final review of STAR stories

**Milestone (end of week)**
- Complete one full mock loop and rate yourself a passing grade on each round. If any round fails, spend 2 extra days drilling that specific weakness before the real interview.

## Final week checklist

- [ ] Mock coding (45 min, unseen problem, narrated)
- [ ] Mock system design (45 min, unseen prompt)
- [ ] Mock behavioral (30 min, 5 STAR questions)
- [ ] Confirm interview format with recruiter (rounds, length, tools, language allowed)
- [ ] Re-read your DDIA notes one final time
- [ ] Re-read your top 5 STAR stories
- [ ] Prepare 5 questions per interviewer type
- [ ] Test hardware: camera, mic, screen share, coding tool (CoderPad, Codility, HackerRank)
- [ ] Sleep 8 hours the night before — non-negotiable

## If you have less time

**Compressed 4-week version:**

- Week 1 = Weeks 1+2 condensed. 30 problems across arrays, strings, hashing, trees, graphs. Skip Union-Find, skip topological sort.
- Week 2 = Weeks 3+4 condensed. 15 DP/backtracking problems + DDIA chapters 1-3 + 7. Skip hands-on Postgres lab.
- Week 3 = Weeks 5+6 condensed. DDIA chapters 5, 6, 9 + 3 of the 5 classic designs (URL shortener, chat, rate limiter).
- Week 4 = Weeks 7+8 condensed. 1 mock loop. Drill weakest algorithm category. Finalize STAR stories.

**Compressed 2-week version (emergency):**

- Week 1: 40 medium LeetCode problems across all major patterns. Read DDIA chapters 1, 5, 9 only. 1 system design exercise (URL shortener).
- Week 2: 2 more system designs (chat, rate limiter). 1 mock interview. Finalize 5 STAR stories. Hardware check.

## If you have more time

- Read DDIA cover to cover, not just the assigned chapters. It is the single highest-leverage book for backend interviews.
- Pick a second language. If you interview in Python, learn enough Go (or vice versa) to compare runtime models. Interviewers respect breadth.
- Implement a toy distributed system: a key-value store with replication and a simple consensus mechanism (Raft, or even just primary-backup). One implementation teaches more than 10 papers.
- Contribute a non-trivial PR to an open source backend project (a database, a queue, a service mesh). One real PR demonstrates more than any side project.
- Read 5 published engineering blog posts from teams you'd like to join. Take notes on the architecture decisions and the tradeoffs they discuss. Reference them in your interviews.
- Study one production incident postmortem per week (Cloudflare, GitHub, AWS, and Google all publish detailed ones). Learn what fails in real systems at scale.
