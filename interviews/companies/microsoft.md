# Microsoft

```yaml
company: Microsoft (Azure, Office, Windows, Xbox, GitHub)
typical_rounds: 1 recruiter chat + 1 phone screen + 4-5 onsite (2-3 coding, 1 system design, 1 AA "as appropriate" senior leader)
focus_areas: classical algorithms, OOD, Azure/cloud-flavored system design, "growth mindset" behavioral
languages_allowed: any major language; C#/Java/Python/C++ common
duration: 45-60 min per round
notable_quirks:
  - "As Appropriate" (AA) round with a senior leader has veto-like influence
  - "Growth mindset" (Satya Nadella's framing) is the dominant cultural lens
  - Strong focus on fundamentals — linked lists, trees, recursion, memory
  - Less algorithmic exotic-ness than Google; more "can you code carefully?"
sources: Glassdoor, LeetCode Discuss (microsoft tag), Blind, careers.microsoft.com
```

## Overview

Microsoft's bar leans on solid CS fundamentals over algorithmic flashiness. You're more likely to be asked to reverse a linked list and discuss edge cases for 20 minutes than to do a Hard-tagged DP. System design rounds frequently lean on Azure primitives (Cosmos DB, Service Bus, Functions). The "growth mindset" lens dominates behavioral: they look for learners, not know-it-alls. The AA round (senior leader, often a partner-level engineer or director) is your bar-raiser equivalent.

## Questions

### 1. Reverse a Linked List

**Difficulty:** Easy
**Topics:** linked-list, recursion, pointers
**Position:** SWE
**Years:** L60-L62

**Question:** Reverse a singly linked list. Implement both iteratively and recursively. Discuss trade-offs.

**Approach:** Iterative: 3-pointer (`prev, curr, next`); curr.next = prev, advance. O(n) time, O(1) space. Recursive: recurse to end, set `head.next.next = head; head.next = null`. O(n) time, O(n) stack. Microsoft loves discussion of why iterative is preferred for long lists (stack overflow risk).

**Tags:** #algorithm

---

### 2. Validate Binary Search Tree

**Difficulty:** Medium
**Topics:** tree, bst, recursion, dfs
**Position:** SWE
**Years:** L60-L62

**Question:** Given a binary tree, determine if it is a valid BST (every node's left subtree < node < right subtree).

**Approach:** Recursion with `(min, max)` bounds passed down. Don't just compare node to immediate children — that fails on `[5, 1, 6, null, null, 3, 7]`. Alternative: in-order traversal, check strictly increasing. Watch for integer overflow → use Long bounds or null sentinels.

**Tags:** #algorithm

---

### 3. Serialize and Deserialize Binary Tree

**Difficulty:** Hard
**Topics:** tree, bfs, dfs, design
**Position:** SWE
**Years:** L62-L63

**Question:** Design an algorithm to serialize a binary tree to a string and deserialize it back.

**Approach:** Preorder DFS with null markers: `"1,2,null,null,3,4,null,null,5,null,null"`. Deserialize with a queue/iterator, consume one token, recurse. O(n) both ways. Alternative: level-order BFS. Discuss compact encoding (variable-length ints, no leading null markers if leaves use a flag).

**Tags:** #algorithm

---

### 4. Find Kth Largest in Array

**Difficulty:** Medium
**Topics:** heap, quickselect, sorting
**Position:** SWE
**Years:** L60-L62

**Question:** Find the kth largest element in an unsorted array.

**Approach:** Min-heap of size k: O(n log k). Or Quickselect (Hoare partition) for O(n) average. Microsoft will probe both — implement Quickselect (random pivot to avoid worst case). Discuss when each wins.

**Tags:** #algorithm

---

### 5. Spiral Matrix

**Difficulty:** Medium
**Topics:** matrix, simulation
**Position:** SWE
**Years:** L60-L62

**Question:** Given an m x n matrix, return all elements in spiral order.

**Approach:** Track 4 boundaries `top, bottom, left, right`. Loop: traverse top row L→R, then right col T→B, then check if `top <= bottom` before bottom row R→L, then `left <= right` before left col B→T. Shrink boundaries each loop. Edge cases: single row, single column. Pure simulation — Microsoft loves clean off-by-one handling.

**Tags:** #algorithm

---

### 6. Copy List with Random Pointer

**Difficulty:** Medium
**Topics:** linked-list, hashmap, design
**Position:** SWE
**Years:** L60-L62

**Question:** A linked list of length n. Each node has `next` and a `random` pointer that may point to any node or null. Deep-copy the list.

**Approach:** Two-pass with hashmap `original -> copy`: first pass create all copies, second pass wire `next` and `random` via map lookup. O(n) time, O(n) space. Optimal O(1) space: interleave copies (`A -> A' -> B -> B' -> ...`), then assign `random`, then unweave.

**Tags:** #algorithm

---

### 7. Best Time to Buy and Sell Stock

**Difficulty:** Easy
**Topics:** arrays, dp, greedy
**Position:** SWE
**Years:** L60-L62

**Question:** Given daily prices, find the max profit from a single buy and sell transaction.

**Approach:** One pass, track `min_seen` and `max_profit = max(max_profit, price - min_seen)`. O(n) time, O(1) space. Follow-ups Microsoft asks: at most 2 transactions, unlimited transactions, with cooldown, with fee.

**Tags:** #algorithm

---

### 8. Word Search

**Difficulty:** Medium
**Topics:** backtracking, matrix, dfs
**Position:** SWE
**Years:** L60-L62

**Question:** Given a 2D board of letters and a word, return true if the word can be constructed from adjacent cells (horizontal/vertical, no cell reuse).

**Approach:** DFS from each cell that matches `word[0]`. Mark visited by temporarily setting to a sentinel char, restore on backtrack (saves O(mn) visited array). O(m*n*4^L) worst. Follow-up: word search II (multiple words) → trie + DFS.

**Tags:** #algorithm

---

### 9. Design Microsoft Teams Chat

**Difficulty:** Hard
**Topics:** system-design, websockets, pub-sub, presence
**Position:** Senior SWE
**Years:** L63-L65

**Question:** Design the messaging backend for Microsoft Teams (1:1, group chat, channels with thousands of members, presence).

**Approach:** WebSocket gateways (sticky per user) → message bus (Service Bus / Kafka). Per-channel topic for fanout. Storage: messages in Cosmos DB sharded by `channel_id`. Presence: in-memory store (Redis) per region with TTL'd entries; aggregate cross-region with eventual consistency. Discuss read receipts, typing indicators (throttle to 1/sec), and how large channels avoid fanout storms (lazy fetch on scroll). Bonus: mention compliance/eDiscovery requirements (Office 365 immutable archive).

**Tags:** #system-design

---

### 10. Design Azure Blob Storage

**Difficulty:** Hard
**Topics:** system-design, blob-storage, replication, erasure-coding
**Position:** Senior SWE
**Years:** L63-L65

**Question:** Design Azure Blob Storage. Cover sharding, replication, durability, and the read/write path.

**Approach:** Front-end layer (load-balanced) → partition layer (mapping blob name to storage server, sharded by account+container+blob) → stream layer (append-only, erasure-coded chunks distributed across nodes/racks/AZs). Partition layer uses a master (Paxos) for table assignment. Multi-AZ for durability, async geo-replication for DR. Discuss strong consistency within a region (partition has a single primary), large blob upload (block blobs with commit), and tiering (hot → cool → archive).

**Tags:** #system-design

---

### 11. Design Office 365 Document Co-Authoring

**Difficulty:** Hard
**Topics:** system-design, ot, crdt, sync
**Position:** Senior SWE
**Years:** L63-L65

**Question:** Design how Word/Excel/PowerPoint Online support multiple users editing the same document concurrently.

**Approach:** Operational Transformation or CRDT on a per-document basis. Per-doc service (sharded by doc_id) acts as central serializer; WebSocket-connect clients send ops, server transforms+broadcasts. Persist op log to durable store (Cosmos DB) + periodic snapshots to blob. Discuss offline editing (queue ops locally, replay on reconnect), large document scale (paragraph-level granularity), and rich content (embedded objects, comments). Mention how Excel is harder than Word (cell references can shift formulas).

**Tags:** #system-design

---

### 12. Design a Job Scheduler (Azure Functions backend)

**Difficulty:** Medium
**Topics:** system-design, queue, scheduling, distributed-systems
**Position:** Senior SWE
**Years:** L63-L65

**Question:** Design a distributed job scheduler that supports one-off, recurring (cron), and delayed jobs at high scale.

**Approach:** Persistent job store (Cosmos DB) with `next_run_time` index. Scheduler workers (leader-elected via ZK/etcd) scan due jobs every second, push to a queue (Service Bus). Worker pool pulls from queue, executes, reports status. For recurring jobs, on completion re-schedule with next cron time. Discuss exactly-once vs at-least-once (most schedulers commit to at-least-once + idempotent handlers), backfill on outage, and time zone handling for cron.

**Tags:** #system-design

---

### 13. Design an API Rate Limiter

**Difficulty:** Medium
**Topics:** system-design, rate-limiting, redis, distributed
**Position:** SWE
**Years:** L62-L63

**Question:** Design a rate limiter for an API supporting per-user and per-IP limits.

**Approach:** Token bucket or sliding window log. Storage in Redis cluster sharded by user_id. Atomic Lua script to decrement-and-check. Local first-line in-process cache for very-hot keys (refresh every 100ms). For distributed limiting, prefer regional limits (eventual consistency tolerated) over global synchronous. Discuss fail-open vs fail-closed.

**Tags:** #system-design

---

### 14. Design Xbox Live Matchmaking

**Difficulty:** Hard
**Topics:** system-design, gaming, latency, ranking
**Position:** Senior SWE
**Years:** L63-L65

**Question:** Design the matchmaking system for Xbox Live (or any multiplayer game) that pairs players by skill and latency.

**Approach:** Players enter a queue keyed by `(game_mode, region, skill_bucket)`. TrueSkill/Glicko-2 for skill; expand bucket window over time (skill ± N grows with wait). Region picked by ping test to candidate data centers. Match finder runs every few seconds per bucket. On match: allocate game server (Kubernetes pool) in the lowest-latency DC. Discuss anti-smurf, party matchmaking (group of 4 vs solos), and fairness vs queue time trade-off.

**Tags:** #system-design

---

### 15. Tell me about a time you learned something new quickly

**Difficulty:** Medium
**Topics:** behavioral, growth-mindset, learning
**Position:** SWE
**Years:** L60-L62

**Question:** Tell me about a time you had to learn a new technology or domain quickly to deliver. How did you approach it?

**Approach:** Direct hit on **growth mindset** — Satya's #1 cultural lens. Show: (1) you didn't pretend to know, (2) you had a structured learning approach (docs → small POC → expert review), (3) you delivered with the new skill, (4) you taught others afterward. Bonus: you actively sought feedback that would have been ego-bruising.

**Tags:** #behavioral

---

### 16. Tell me about a time you got harsh feedback

**Difficulty:** Medium
**Topics:** behavioral, growth-mindset, self-awareness
**Position:** SWE
**Years:** L60-L62

**Question:** Tell me about a time you received tough feedback. What did you do with it?

**Approach:** Microsoft really probes this — the "fixed vs growth mindset" tell. Show: (1) you didn't get defensive, (2) you sought to understand the underlying signal, (3) you made a concrete behavior change with evidence (not just intent), (4) the feedback giver acknowledged the change. Avoid stories where you "secretly disagreed" — that's fixed mindset signal.

**Tags:** #behavioral

---

### 17. Tell me about a project that didn't go well

**Difficulty:** Medium
**Topics:** behavioral, failure, growth-mindset
**Position:** Senior SWE
**Years:** L63-L65

**Question:** Walk me through a project that failed or didn't deliver what you hoped. What happened and what did you learn?

**Approach:** Pick a real failure. Show: (1) you owned the failure without blame-shifting, (2) you ran a real retro (process, not just "we should've tested more"), (3) the lessons changed your behavior in a future project — give the specific example. Microsoft likes when you describe the system/process gap, not the person.

**Tags:** #behavioral

---

### 18. Tell me about a time you led without authority

**Difficulty:** Medium
**Topics:** behavioral, leadership, influence
**Position:** Senior SWE
**Years:** L63-L65

**Question:** Tell me about a time you drove a cross-team initiative without having direct authority over the people involved.

**Approach:** Senior+ signal. Show: (1) you built a coalition with explicit "what's in it for them" framing, (2) you used data/customer impact (not org politics), (3) you celebrated others' contributions publicly, (4) outcome was measurable. Microsoft cares about collaboration across orgs — they have many.

**Tags:** #behavioral

---

### 19. Azure cost optimization on a service

**Difficulty:** Medium
**Topics:** cloud, cost-optimization, azure
**Position:** SRE
**Years:** L63

**Question:** A service running on Azure has a $200K/month bill. Walk me through how you'd cut it in half.

**Approach:** Profile costs first: compute (VMs/AKS), storage (Blob/disks), egress, managed services. Common wins: (1) right-size VMs (CPU/mem utilization < 30% = over-provisioned), (2) reserved instances or spot for batch, (3) Cosmos DB → tune RU/s and partitioning, (4) move cold blobs to cool/archive tier, (5) cache aggressively to cut egress, (6) audit dev/test resources auto-shutdown after hours. Don't optimize without measuring impact on SLOs. Show you'd build a cost dashboard before making cuts.

**Tags:** #domain-knowledge

---

### 20. Debug a high-CPU .NET service

**Difficulty:** Medium
**Topics:** dotnet, profiling, debugging
**Position:** SWE
**Years:** L62

**Question:** A C#/.NET service is showing 100% CPU on production VMs intermittently. How would you debug it?

**Approach:** Step 1: collect a dump (`dotnet-dump collect`) or use a profiler (`dotnet-trace`, PerfView). Look at top stacks. Common causes: (1) GC pressure → check Gen2 collections, large object heap, (2) regex with catastrophic backtracking, (3) JSON serialization of huge objects, (4) busy-wait in a Task scheduler, (5) lock contention. Use `dotnet-counters` for live metrics. Mention you'd correlate with deploy diffs and recent traffic patterns. If irreproducible, add structured logging + sampling profiler in prod (always-on profiling).

**Tags:** #domain-knowledge

---

## Tips specific to Microsoft

- **Fundamentals over flash.** Microsoft tends to grade for correctness, edge cases, and code clarity over algorithmic insight. Slow down, handle nulls, comment briefly.
- **Growth mindset is the cultural code.** Stories should show learning, especially from mistakes or feedback. Fixed mindset signals (defensive, blamey, "I was right all along") tank rounds.
- **Know one Azure service deeply** if the role is cloud-adjacent. You don't need to know all 200 — pick Cosmos DB, Service Bus, or AKS and have an opinion.
- **AA round is for fit + level calibration.** Less coding, more architecture and behavioral. Treat it like you'd treat a skip-level interview.
- **OOD shows up.** Practice 2-3 classic ones (parking lot, vending machine, library system).

## Resources

- LeetCode "Microsoft" company tag
- "Hit Refresh" by Satya Nadella — gives you the cultural framing
- Microsoft Learn (Azure certifications) — free, useful for cloud rounds
- Cracking the Coding Interview — solid for Microsoft's classical bar
