# Meta (Facebook)

```yaml
company: Meta (Facebook, Instagram, WhatsApp)
typical_rounds: 1 recruiter chat + 1 phone screen (CoderPad) + 4-5 onsite (2 coding, 1-2 system design, 1-2 behavioral aka "Jedi")
focus_areas: arrays/strings/trees/graphs, system design, behavioral ("impact" and "conflict")
languages_allowed: any major language; Python/C++/Java/Hack common
duration: 35-40 min coding (two questions per round!), 45 min design, 45 min Jedi
notable_quirks:
  - Coding rounds expect TWO questions in 35-40 min — pace matters
  - "Jedi" round (behavioral) is mandatory and weighted heavily
  - Strong cultural fit on "move fast" and "impact"
  - Product sense round for Frontend / Product roles
sources: Glassdoor, LeetCode Discuss (facebook tag), Blind, Meta's published interview prep
```

## Overview

Meta's coding bar emphasizes speed and accuracy on classical data-structure problems — arrays, strings, trees, graphs, hash tables. You'll almost always be asked two questions per coding round, so you can't afford to over-think the warm-up. System design at L5+ centers on Meta's actual products (News Feed, Instagram, Messenger). The Jedi round probes "impact" (did you deliver something that moved a metric?) and "conflict" (can you push back constructively?).

## Questions

### 1. Verifying an Alien Dictionary

**Difficulty:** Easy
**Topics:** strings, hashmap
**Position:** SWE
**Years:** L3-L4

**Question:** Given a list of words and an order of characters in an alien alphabet, return `true` if the words are sorted lexicographically according to that order.

**Approach:** Build `char -> rank` hashmap from the order string. Pairwise compare adjacent words — find first differing char and compare ranks; if one word is a prefix of the other and longer, return false. O(total chars). Common Meta warm-up question.

**Tags:** #algorithm

---

### 2. Valid Palindrome II

**Difficulty:** Easy
**Topics:** strings, two-pointer, greedy
**Position:** SWE
**Years:** L3-L4

**Question:** Given a string `s`, return `true` if `s` can become a palindrome after deleting at most one character.

**Approach:** Two pointers from ends. When chars differ, try skipping either left or right and check if the remainder is a palindrome. O(n) time, O(1) space. Be careful: only one skip allowed, not one per side.

**Tags:** #algorithm

---

### 3. Subarray Sum Equals K

**Difficulty:** Medium
**Topics:** arrays, hashmap, prefix-sum
**Position:** SWE
**Years:** L3-L4

**Question:** Given an integer array `nums` and an integer `k`, return the total number of subarrays whose sum equals `k`.

**Approach:** Prefix sum + hashmap. For each index, the number of subarrays ending here with sum `k` equals the count of `prefix - k` seen before. Initialize map with `{0: 1}`. O(n) time, O(n) space. Negative numbers ruin sliding window — that's the trick.

**Tags:** #algorithm

---

### 4. Binary Tree Right Side View

**Difficulty:** Medium
**Topics:** tree, bfs, dfs
**Position:** SWE
**Years:** L3-L4

**Question:** Given a binary tree, return the values visible from the right side (top to bottom).

**Approach:** BFS level-by-level, take the last node at each level. Or DFS right-first, recording the first node seen at each depth. O(n) time. Edge case: nodes only on the left side still count if no right sibling exists at that level.

**Tags:** #algorithm

---

### 5. K Closest Points to Origin

**Difficulty:** Medium
**Topics:** heap, quickselect, sorting
**Position:** SWE
**Years:** L3-L4

**Question:** Given an array of points in 2D, return the `k` closest to the origin (0,0).

**Approach:** Max-heap of size k by distance² — push each point, pop if size > k. O(n log k). For better average, use Quickselect (Hoare partition) on distance² for O(n) average / O(n²) worst. Skip the sqrt; squared distance preserves ordering.

**Tags:** #algorithm

---

### 6. Random Pick with Weight

**Difficulty:** Medium
**Topics:** binary-search, prefix-sum, randomization
**Position:** SWE
**Years:** L3-L4

**Question:** Given an array `w` of positive integer weights, implement `pickIndex()` that returns index `i` with probability `w[i] / sum(w)`.

**Approach:** Precompute prefix sums. On `pickIndex`, pick a uniform random in `[1, total]`, binary search the prefix-sum array for the lower bound. O(n) construct, O(log n) pick. Edge: weight of 0 still possible; handle gracefully.

**Tags:** #algorithm

---

### 7. Merge Intervals

**Difficulty:** Medium
**Topics:** arrays, sorting, intervals
**Position:** SWE
**Years:** L3-L4

**Question:** Given a list of intervals, merge all overlapping intervals and return the result.

**Approach:** Sort by start. Iterate; if next.start <= current.end, extend current.end = max(current.end, next.end), else push current and start new. O(n log n). Variants: insert into already-sorted, count free time across employees.

**Tags:** #algorithm

---

### 8. Lowest Common Ancestor of a Binary Tree

**Difficulty:** Medium
**Topics:** tree, dfs, recursion
**Position:** SWE
**Years:** L3-L4

**Question:** Given a binary tree and two nodes `p` and `q`, find their lowest common ancestor. Nodes are not BST; parent pointers are not given.

**Approach:** Recursive DFS — return `p` or `q` if found, else recurse left/right. If both sides return non-null, current node is LCA. Otherwise return whichever side is non-null. O(n). Follow-ups: parent pointers given (two-pointer like cycle detection), `p` may not exist (return null), distance between `p` and `q`.

**Tags:** #algorithm

---

### 9. Design News Feed

**Difficulty:** Hard
**Topics:** system-design, feed-ranking, fanout, caching
**Position:** Senior SWE
**Years:** L5

**Question:** Design Facebook's News Feed. Cover ranking, posting, and serving.

**Approach:** Two models: **push (fanout-on-write)** — when X posts, write to all X's followers' inboxes; great read latency, breaks for celebrities. **Pull (fanout-on-read)** — on feed load, pull recent posts from each followee, merge, rank; expensive for active users. **Hybrid** — push for normal users, pull for celebrities, merge at read. Ranking: candidate generation (recent + relevant) → ML ranker (engagement signals). Cache top-N per user in Redis with TTL. Discuss write amplification, cold cache, and ranking model freshness.

**Tags:** #system-design

---

### 10. Design Instagram

**Difficulty:** Hard
**Topics:** system-design, blob-storage, cdn, sharding, feed
**Position:** Senior SWE
**Years:** L5

**Question:** Design Instagram: photo upload, profile, feed, search by hashtag.

**Approach:** Photos → blob storage (S3-like) + CDN. Metadata sharded by user_id in a relational store. Feed: hybrid push/pull (same as News Feed). Hashtag search: inverted index from hashtag → recent post ids in a search-optimized store (Elasticsearch). Likes/comments: counters with write-back cache (eventual consistency OK). Discuss: image resizing pipeline (async on upload, generate thumbnails), CDN cache invalidation on deletion, and how to handle viral posts (CDN edge cache + read-only replica).

**Tags:** #system-design

---

### 11. Design Messenger / WhatsApp

**Difficulty:** Hard
**Topics:** system-design, websockets, end-to-end-encryption, pub-sub, mobile
**Position:** Senior SWE
**Years:** L5

**Question:** Design a real-time messaging system (1:1 + group chat) supporting end-to-end encryption.

**Approach:** Persistent WebSocket (or MQTT for mobile battery) per client, sticky to a gateway sharded by user_id. Messages flow gateway → Kafka → fanout → recipient's gateway. Store ciphertext in a sharded message store keyed by `(chat_id, ts)`. E2E: Signal protocol (X3DH + double ratchet); server never sees plaintext. Delivery receipts: client ACKs to gateway, gateway updates state. Group chat: sender encrypts per recipient (small groups) or uses sender keys (large groups). Discuss offline delivery (push notifications), multi-device sync.

**Tags:** #system-design

---

### 12. Design a URL Shortener (bit.ly)

**Difficulty:** Medium
**Topics:** system-design, hashing, sharding, base62
**Position:** SWE
**Years:** L3-L4

**Question:** Design a URL shortener like bit.ly. 100B total URLs, 100K/s create, 10M/s redirect.

**Approach:** Generate 7-char base62 keys (62^7 ≈ 3.5T). Two approaches: hash(long_url)[:7] with collision retry, or central counter (ZooKeeper-allocated ranges per server, encode counter as base62). Store `key -> long_url` in a sharded KV store (Cassandra). Heavy read cache (Redis); CDN of 301s for hot keys. Discuss custom aliases, analytics (async event stream), and the 301 vs 302 trade-off (302 lets you track clicks).

**Tags:** #system-design

---

### 13. Design Facebook Live / Live Comments

**Difficulty:** Hard
**Topics:** system-design, streaming, pub-sub, fanout, websockets
**Position:** Senior SWE
**Years:** L5

**Question:** Design the live comments stream for Facebook Live where millions of viewers comment on a single broadcast.

**Approach:** Video: HLS chunks pushed to CDN (5-10s latency tolerable). Comments are the hard part — single live event can have 1M+ concurrent viewers each commenting. Architecture: viewers WebSocket-connect to edge nodes; comments published to a per-video pub/sub topic (Kafka); edge nodes subscribe and fan out to their connected viewers. Sampling/throttling: at extreme scale, show top comments + a random sample, not every one. Persist to DB asynchronously for replay. Discuss spam filtering (sync ML scorer) and abusive comment moderation.

**Tags:** #system-design

---

### 14. Design Top K Trending Hashtags

**Difficulty:** Hard
**Topics:** system-design, streaming, count-min-sketch, heap
**Position:** Senior SWE
**Years:** L5

**Question:** Design a system that returns the top 10 trending hashtags in the last hour, updated every minute.

**Approach:** Stream tweets/posts through Kafka → Flink/Spark Streaming job. Per minute, use Count-Min Sketch (approximate counts, memory-bounded) keyed by hashtag, maintain a min-heap of size 10. Rolling hour window = 60 minute-buckets; aggregate per query. For scale, partition by `hash(hashtag)` across workers, then merge top-Ks. Discuss accuracy vs memory trade-off of CMS, handling skewed traffic (celeb hashtag), and how "trending" might mean velocity, not raw count.

**Tags:** #system-design

---

### 15. Tell me about a project where you had the most impact

**Difficulty:** Medium
**Topics:** behavioral, impact, ownership
**Position:** SWE
**Years:** L3-L4

**Question:** Walk me through the project you're most proud of. What was the impact?

**Approach:** STAR with HEAVY emphasis on quantified impact. Meta culture worships metrics. "Increased X by Y%" / "saved N engineer-hours per week" / "reduced p99 latency from A to B." If you can't quantify, the story is weak. Be ready for "would you do it differently?" and "what was the hardest trade-off?"

**Tags:** #behavioral

---

### 16. Time you disagreed with your manager

**Difficulty:** Medium
**Topics:** behavioral, conflict, push-back
**Position:** SWE
**Years:** L3-L4

**Question:** Tell me about a time you disagreed with your manager. How did you handle it?

**Approach:** Meta wants to see you push back constructively — silent agreement is a red flag. Show: (1) you brought data, not just opinion, (2) you used a 1:1 not a public forum, (3) you committed to the decision even if it went against you ("disagree and commit"). Avoid stories that paint your manager as incompetent.

**Tags:** #behavioral

---

### 17. Time you took a risk

**Difficulty:** Medium
**Topics:** behavioral, move-fast, risk-taking
**Position:** SWE
**Years:** L3-L4

**Question:** Tell me about a time you took a calculated risk on a project. What was the outcome?

**Approach:** Meta's "move fast" value. Show: (1) you understood what could go wrong and had a rollback plan, (2) you didn't ask for permission for everything, (3) you owned the outcome — good or bad. Stories where the risk *didn't* pan out are actually strong if you show learning.

**Tags:** #behavioral

---

### 18. Time you mentored someone or improved a team

**Difficulty:** Medium
**Topics:** behavioral, leadership, mentorship
**Position:** Senior SWE
**Years:** L5

**Question:** Tell me about a time you helped a teammate grow or improved how the team worked.

**Approach:** Senior+ signal — Meta wants force multipliers. Show: (1) specific person/process you changed, (2) measurable outcome (their promo, team velocity, on-call burden), (3) you did it without being asked. Avoid generic "I do code reviews" — pick one specific situation.

**Tags:** #behavioral

---

### 19. Web performance: optimize Time to Interactive

**Difficulty:** Hard
**Topics:** web-perf, frontend, react, ssr
**Position:** Frontend
**Years:** L5

**Question:** Facebook.com loads slowly on a mid-tier Android in India. Walk me through how you'd diagnose and improve Time to Interactive.

**Approach:** Measure first: Lighthouse / WebPageTest from low-end device + 3G profile. Common wins: (1) reduce JS bundle (code splitting per route, tree-shaking), (2) defer non-critical JS, (3) inline critical CSS, (4) SSR/streaming SSR (RSC in modern Meta stack) to ship paint before hydration, (5) image lazy-loading + responsive `srcset`, (6) HTTP/2 push or `<link rel=preload>` for fonts. Mention Meta-specific BigPipe / partial hydration. Discuss measuring impact (RUM, Core Web Vitals) and rollout (A/B test).

**Tags:** #domain-knowledge

---

### 20. Product sense: how would you design a feature for new Instagram users?

**Difficulty:** Medium
**Topics:** product-sense, onboarding, metrics
**Position:** Frontend
**Years:** L5

**Question:** New Instagram users churn at high rates in their first week. Propose a feature to improve 7-day retention. How would you measure success?

**Approach:** Diagnose first: why do they churn? (Empty feed, no friends, no posts.) Pick one hypothesis and propose a feature targeting it — e.g., "interest-based suggested follows during onboarding to give a populated feed on day 1." Define success metric: 7-day retention as primary, sessions/week as secondary, follow count as proxy. A/B test design: holdout group, 1-2% rollout, 2-week duration, minimum detectable effect. Watch for counter-metrics (over-following → spam reports). Meta loves crisp metric definitions.

**Tags:** #domain-knowledge

---

## Tips specific to Meta

- **Pace yourself in coding rounds.** Two questions in 35-40 min = ~17 min each including discussion. Don't get stuck.
- **Always state time/space complexity** unprompted. Meta interviewers grade for it.
- **For Jedi, have 6+ stories ready.** They'll ask follow-ups across the same project. Have details: who, when, what tech, what numbers.
- **Move fast (but with judgment).** Meta is the only FAANG where speed of execution is an explicit value. Stories that emphasize "I shipped X in 2 weeks instead of waiting 2 months" land well.
- **Product sense matters for FE/PM-adjacent roles.** Know your favorite Meta product cold and have an opinion on what's broken.

## Resources

- LeetCode "Facebook" / "Meta" company tag (top 50)
- Meta Engineering blog
- "Designing Data-Intensive Applications" — Kleppmann (great for design rounds)
- Meta's own published interview prep guide
