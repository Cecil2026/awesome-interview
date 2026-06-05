# Amazon

```yaml
company: Amazon (AWS, Retail, Devices)
typical_rounds: 1 OA (online assessment) + 1 phone screen + 4-6 onsite "loop" (1 bar raiser, 2 coding, 1-2 system design, 1 hiring manager) — every round is part-behavioral
focus_areas: OOD, data structures, system design, Leadership Principles (LPs)
languages_allowed: any major language; Java/Python/C++ common
duration: 60 min per loop round (split into ~25 behavioral + ~30 technical)
notable_quirks:
  - EVERY behavioral answer must explicitly tie to one (or more) of the 16 Leadership Principles
  - "Bar raiser" is a trained interviewer from a different team who has veto power
  - Two LP questions per round, asked at the start
  - OA includes work-style assessment + 2 coding problems + work simulation
sources: Glassdoor, LeetCode Discuss (amazon tag), Blind, leetcode.com/discuss/interview-experience
```

## Overview

Amazon is unique in how heavily Leadership Principles are weighted — even the best technical performance can be vetoed by a weak LP showing. The 16 LPs (Customer Obsession, Ownership, Invent and Simplify, Are Right A Lot, Learn and Be Curious, Hire and Develop the Best, Insist on the Highest Standards, Think Big, Bias for Action, Frugality, Earn Trust, Dive Deep, Have Backbone, Deliver Results, Strive to be Earth's Best Employer, Success and Scale Bring Responsibility) need at least 2 stories each. Technical bar leans toward OOD (LRU, parking lot), graphs, and AWS-flavored system design.

## Questions

### 1. LRU Cache

**Difficulty:** Medium
**Topics:** ood, hashmap, linked-list, design
**Position:** SWE
**Years:** L4

**Question:** Design a data structure for Least Recently Used (LRU) cache with `get(key)` and `put(key, value)` in O(1) each. Capacity bounded; on overflow, evict the least recently used.

**Approach:** Hashmap `key -> node` + doubly linked list. On `get`, move node to head. On `put`, insert at head; if size > cap, drop tail and remove from map. Doubly linked is required for O(1) removal. Edge cases: update existing key, capacity 0. Follow-up: thread-safe (segment locks like ConcurrentHashMap), LFU instead.

**Tags:** #algorithm

---

### 2. Number of Islands

**Difficulty:** Medium
**Topics:** graph, dfs, bfs, matrix
**Position:** SWE
**Years:** L4

**Question:** Given a 2D grid of '1's (land) and '0's (water), count the number of islands.

**Approach:** Iterate cells; on each unvisited '1', DFS to flood-fill the island, increment count. Mark visited in-place. O(m*n) time and space (stack). Common Amazon follow-up: "now imagine the grid is so big it's distributed across machines" → discuss row partitioning + boundary merging via union-find.

**Tags:** #algorithm

---

### 3. Two Sum

**Difficulty:** Easy
**Topics:** arrays, hashmap
**Position:** SWE
**Years:** L4

**Question:** Given an array of integers and a target, return indices of the two numbers that add up to target. Assume exactly one solution.

**Approach:** One pass + hashmap `value -> index`. For each `num`, check if `target - num` is in map; else insert. O(n) time, O(n) space. Amazon OA staple.

**Tags:** #algorithm

---

### 4. Merge K Sorted Lists

**Difficulty:** Hard
**Topics:** linked-list, heap, divide-and-conquer
**Position:** SWE
**Years:** L4

**Question:** Merge `k` sorted linked lists into one sorted list.

**Approach:** Min-heap of `(value, list_index, node)` size k; pop smallest, advance, push next from same list. O(N log k) where N = total nodes. Alternative: divide-and-conquer pairwise merge, same complexity, slightly better constant. Mind heap tie-breaks (don't compare nodes directly).

**Tags:** #algorithm

---

### 5. Word Break

**Difficulty:** Medium
**Topics:** dp, strings, trie
**Position:** SWE
**Years:** L4

**Question:** Given a string `s` and a dictionary of words, return true if `s` can be segmented into a sequence of dictionary words.

**Approach:** DP — `dp[i]` = true if `s[0..i)` can be segmented. Transition: `dp[i] = any dp[j] && s[j..i) in dict`. O(n² * L) with hashset lookup. Trie speeds up the inner check. Follow-up: return all segmentations (memoized recursion).

**Tags:** #algorithm

---

### 6. Trapping Rain Water

**Difficulty:** Hard
**Topics:** arrays, two-pointer, dp
**Position:** SWE
**Years:** L5

**Question:** Given `n` non-negative integers representing an elevation map, compute how much water it can trap.

**Approach:** Two pointers from each end. Maintain `left_max`, `right_max`. Move whichever side is shorter; water at that index = `side_max - height[i]`. O(n) time, O(1) space. Alternative: precompute `left_max[]` and `right_max[]` arrays — clearer but O(n) space.

**Tags:** #algorithm

---

### 7. Top K Frequent Elements

**Difficulty:** Medium
**Topics:** hashmap, heap, bucket-sort
**Position:** SWE
**Years:** L4

**Question:** Given a non-empty array of integers, return the k most frequent elements.

**Approach:** Count frequencies in hashmap, then either (a) min-heap of size k by frequency → O(n log k), or (b) bucket sort by frequency (buckets[freq] = list) → O(n). Amazon often pairs with follow-up "what if data is streaming?" → Count-Min Sketch + heap.

**Tags:** #algorithm

---

### 8. Reorder Log Files

**Difficulty:** Easy
**Topics:** strings, sorting, comparator
**Position:** SWE
**Years:** L3-L4

**Question:** Reorder a list of log files so letter-logs come first (lexicographically by content, then by identifier as tiebreaker), then digit-logs in original order.

**Approach:** Custom comparator: partition into letter-logs and digit-logs; sort letter-logs by `(content, identifier)`; concatenate. Test classifier on first char of post-identifier token. Amazon-classic OA question.

**Tags:** #coding

---

### 9. Design a Parking Lot

**Difficulty:** Medium
**Topics:** ood, design
**Position:** SWE
**Years:** L4

**Question:** Design the classes for a multi-level parking lot supporting motorcycles, cars, and trucks with different spot sizes.

**Approach:** Classes: `ParkingLot` → `Level[]` → `ParkingSpot[]`. Spot has `size` enum (compact/large/motorcycle). `Vehicle` abstract → `Car/Truck/Motorcycle`, each declares which spot sizes they fit. `park()` finds first compatible spot; `leave()` frees. Show good encapsulation, polymorphism, and discuss extension (electric charging, monthly passes). Don't over-engineer — interviewers want clear class diagrams, not 50 classes.

**Tags:** #coding

---

### 10. Design Amazon Prime Video

**Difficulty:** Hard
**Topics:** system-design, cdn, video-streaming, drm, recommendation
**Position:** Senior SWE
**Years:** L5

**Question:** Design a video streaming service like Prime Video.

**Approach:** Upload → encoding pipeline (multiple bitrates, codecs, DRM-wrapped HLS/DASH chunks) → blob storage (S3) + CDN (CloudFront). Playback client requests manifest, adapts bitrate (ABR). Metadata in DynamoDB; recommendations from offline training (matrix factorization + content embeddings). Discuss DRM (Widevine/FairPlay/PlayReady), regional licensing, offline downloads, and CDN cost optimization (cache hit ratio). Mention Amazon's open-sourced bitmovin/encoding patterns where relevant.

**Tags:** #system-design

---

### 11. Design Amazon.com Product Page

**Difficulty:** Hard
**Topics:** system-design, caching, microservices, search
**Position:** Senior SWE
**Years:** L5

**Question:** Design the backend that powers an Amazon product detail page (title, price, inventory, reviews, recommendations) for millions of requests per second.

**Approach:** Page is composed from many services: product info (cached, write-through), price (real-time, may vary per user), inventory (eventually consistent counter), reviews (paginated, sharded by product_id), recommendations (precomputed). BFF (backend-for-frontend) aggregates with fan-out + timeout per service; render with available data on timeout (graceful degradation). Heavy edge cache for read-mostly fields. Discuss eventual consistency on inventory ("only 2 left!" can over-promise) and Black Friday spikes (pre-warm cache, auto-scale).

**Tags:** #system-design

---

### 12. Design Kindle Sync

**Difficulty:** Hard
**Topics:** system-design, sync, conflict-resolution, offline
**Position:** Senior SWE
**Years:** L5

**Question:** Design how Kindle syncs reading position, highlights, and notes across a user's devices, even when devices are intermittently offline.

**Approach:** Each device maintains local state + an op log. On reconnect, push ops to a per-user sync service. Server merges ops with last-write-wins for position (or "furthest read" for resilience to misclicks) and append-only for highlights/notes. Use vector clocks or HLC for ordering across devices. Store in DynamoDB sharded by user_id. Push notifications via SNS to peer devices. Discuss conflict cases (notes edited on two devices offline) and eventual convergence guarantees.

**Tags:** #system-design

---

### 13. Design Amazon S3

**Difficulty:** Hard
**Topics:** system-design, blob-storage, consistency, replication
**Position:** Senior SWE
**Years:** L5

**Question:** Design Amazon S3 — a globally available object storage service with strong read-after-write consistency.

**Approach:** Frontend API gateways → request routed by hash(bucket+key) to a shard. Each shard has a metadata service (sharded relational/KV) + erasure-coded object data across many storage nodes (e.g., Reed-Solomon 10+4). Multi-AZ replication; cross-region async replication for DR. Strong consistency via metadata coordinator (Paxos-based). Lifecycle (S3 → Glacier) via background tier-down jobs. Discuss durability math (11 nines), large object multipart upload, and how versioning is implemented (immutable object IDs + version stack in metadata).

**Tags:** #system-design

---

### 14. Design a Distributed Lock Service

**Difficulty:** Hard
**Topics:** system-design, consensus, paxos, zookeeper
**Position:** Senior SWE
**Years:** L5

**Question:** Design a distributed lock service (like Chubby or ZooKeeper) for AWS-internal use.

**Approach:** Raft/Paxos cluster of 5-7 nodes for consensus on lock state. Clients request lease-based locks (TTL) to handle client failure. Sessions/heartbeats: if client doesn't heartbeat, lock auto-releases. Discuss fencing tokens (monotonic counter passed to downstream service to reject stale lock holders — the famous Kleppmann argument). Trade-offs: strong consistency vs latency, single-region vs multi-region (don't put a lock service across regions without careful thought).

**Tags:** #system-design

---

### 15. Tell me about a time you went above and beyond for a customer

**Difficulty:** Medium
**Topics:** behavioral, customer-obsession
**Position:** SWE
**Years:** L4

**Question:** Describe a time you went above and beyond to delight a customer.

**Approach:** STAR mapping to **Customer Obsession** (LP #1). "Customer" can be internal (another team) or external. Show: you proactively identified a need they hadn't articulated, you went outside your scope to fix it, and there was measurable customer impact. Avoid generic "I responded to a ticket quickly."

**Tags:** #behavioral

---

### 16. Tell me about a time you took on something significant outside your responsibility

**Difficulty:** Medium
**Topics:** behavioral, ownership, bias-for-action
**Position:** SWE
**Years:** L4

**Question:** Tell me about a time you took ownership of something that wasn't your job.

**Approach:** STAR mapping to **Ownership** and **Bias for Action**. Show: (1) you saw a gap and didn't wait for someone to assign it, (2) you didn't ask for permission for everything, (3) impact was real. Bonus: you stayed long-term — "I owned it for 6 months until we hired someone." Don't pick a story where you were really just doing your assigned job.

**Tags:** #behavioral

---

### 17. Tell me about a time you had to make a decision with incomplete information

**Difficulty:** Medium
**Topics:** behavioral, bias-for-action, are-right-a-lot
**Position:** Senior SWE
**Years:** L5

**Question:** Tell me about a time you had to make a quick decision without all the information you wanted.

**Approach:** STAR mapping to **Bias for Action** and **Are Right A Lot**. Show: (1) the cost of waiting was real and quantifiable, (2) you identified the smallest set of facts you needed, (3) you made the call and committed, (4) you had a rollback or course-correction plan. Decision being wrong is OK if you owned the recovery.

**Tags:** #behavioral

---

### 18. Tell me about your most challenging technical project

**Difficulty:** Medium
**Topics:** behavioral, dive-deep, deliver-results
**Position:** Senior SWE
**Years:** L5

**Question:** Walk me through your most technically complex project. What made it hard and what was your role?

**Approach:** STAR mapping to **Dive Deep** and **Deliver Results**. The bar raiser will grill you for 15-20 min on this one — be ready for "why that database?" / "what was the p99?" / "what would you redesign?" Pick a project you owned end-to-end with quantifiable outcome. If you can't speak to architecture trade-offs in detail, pick a different story.

**Tags:** #behavioral

---

### 19. Leadership Principle deep-dive: Disagree and Commit

**Difficulty:** Medium
**Topics:** behavioral, have-backbone, earn-trust
**Position:** Senior SWE
**Years:** L5

**Question:** Tell me about a time you respectfully disagreed with a decision but committed to it anyway and helped it succeed.

**Approach:** This maps to **Have Backbone; Disagree and Commit** — one of the most-asked LPs at L5+. Two-part story: (1) you raised your disagreement clearly with data, in the right forum, before the decision was final; (2) once decided against you, you actively committed — not passive acceptance but you helped make it work. Bonus: it turned out the original decision was right and you learned from it.

**Tags:** #domain-knowledge

---

### 20. Leadership Principle deep-dive: Frugality

**Difficulty:** Medium
**Topics:** behavioral, frugality, invent-and-simplify
**Position:** SWE
**Years:** L4

**Question:** Tell me about a time you accomplished something significant with limited resources.

**Approach:** Maps to **Frugality** ("accomplish more with less"). Resources can be people, time, money, or compute. Show: you didn't ask for more headcount/budget — you found a clever simplification (also touches **Invent and Simplify**). Concrete: "we needed real-time analytics but couldn't afford Snowflake — I built a Kinesis + DynamoDB streams pipeline for $200/month instead of $20k." Quantify the savings.

**Tags:** #domain-knowledge

---

## Tips specific to Amazon

- **Memorize the 16 LPs.** You will be asked which LP a story demonstrates. Practice tagging your stories to LPs in advance.
- **Have 2-3 stories per LP** — they'll cross-reference and detect re-use. Don't pull the same project for every question.
- **The bar raiser is unfamiliar with your team.** Explain context concisely. They look for STAR rigor and LP fit, not technical depth on your domain.
- **Behavioral comes FIRST in each round.** A weak behavioral can poison the technical eval. Don't rush through "Customer Obsession" to get to the algorithm.
- **OOD shows up often.** Practice 3-4: parking lot, elevator, LRU/LFU cache, deck of cards, vending machine.

## Resources

- Amazon's published Leadership Principles page (memorize wording, not just headers)
- LeetCode "Amazon" company tag — focus on the OOD problems
- "Working Backwards" — Amazon's product development book; useful context
- amazon.jobs interview prep page (official)
