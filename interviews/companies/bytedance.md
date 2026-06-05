# ByteDance (TikTok / Douyin / Lark)

```yaml
company: ByteDance (TikTok, Douyin, Lark/Feishu, CapCut)
typical_rounds: 1 HR screen + 3-5 technical rounds (heavy coding) + 1 cross-team / leadership round + HR final
focus_areas: DP, graphs, math-heavy algorithms, video/recommendation system design
languages_allowed: any major language; Go/Java/C++/Python common
duration: 60 min per round, often with 2 problems
notable_quirks:
  - Coding bar is reputedly the highest of any company — Hard-tagged DP/graph problems are common
  - Many rounds back-to-back; sometimes same day
  - Engineering culture is "speed and ownership" — behavioral leans on stories of fast iteration
  - International candidates often interviewed by mainland China teams in English (sometimes Mandarin if applicable)
  - For TikTok roles, recommendation systems come up constantly
sources: LeetCode Discuss (bytedance/tiktok tag), 1point3acres, Blind, Glassdoor
```

## Overview

ByteDance has a reputation for being one of the toughest coding interviews in the industry. Expect Hard-tagged dynamic programming, graph problems, and clever math/bit-manipulation. System design rounds for TikTok roles inevitably touch video streaming, feed ranking, and recommendation systems. Behavioral is lighter than US companies but probes "speed of iteration" and "ownership of ambiguity." For mainland-China-based teams, working hours expectations (the 996-adjacent culture, though shifted) may come up.

## Questions

### 1. Longest Increasing Subsequence

**Difficulty:** Medium
**Topics:** dp, binary-search, arrays
**Position:** SWE
**Years:** 2-2

**Question:** Given an integer array `nums`, return the length of the longest strictly increasing subsequence.

**Approach:** Patience sort / binary search variant: maintain `tails[]` where `tails[i]` = smallest tail of any increasing subsequence of length `i+1`. For each num, binary search to replace or append. O(n log n). The classic O(n²) DP also accepted but ByteDance follow-ups push for the O(n log n) version.

**Tags:** #algorithm

---

### 2. Edit Distance

**Difficulty:** Hard
**Topics:** dp, strings
**Position:** SWE
**Years:** 2-2

**Question:** Given two strings `word1` and `word2`, return the minimum number of operations (insert, delete, replace) to convert `word1` to `word2`.

**Approach:** 2D DP. `dp[i][j]` = edit distance of `word1[:i]` and `word2[:j]`. Base cases: `dp[0][j] = j`, `dp[i][0] = i`. Transition: if chars equal, `dp[i][j] = dp[i-1][j-1]`; else `1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])`. O(m*n) time/space, reducible to O(min(m,n)) space with rolling rows.

**Tags:** #algorithm

---

### 3. Maximum Sum Rectangle in 2D Matrix

**Difficulty:** Hard
**Topics:** dp, matrix, kadane
**Position:** SWE
**Years:** 3-5

**Question:** Given a 2D matrix, find the rectangle with the maximum sum of elements.

**Approach:** Fix top row `t` and bottom row `b`; collapse rows `[t..b]` into a 1D array (column sums), run Kadane's on it for max subarray. Iterate all `(t, b)` pairs. O(rows² * cols). Maximum subarray (1D Kadane) is the core building block. Watch all-negative case.

**Tags:** #algorithm

---

### 4. Burst Balloons

**Difficulty:** Hard
**Topics:** dp, interval-dp
**Position:** SWE
**Years:** 3-5

**Question:** Given `n` balloons with values `nums[i]`, bursting balloon `i` gives `nums[i-1] * nums[i] * nums[i+1]` coins (treat out-of-bounds as 1). Find max coins.

**Approach:** Interval DP — think *last balloon to burst* in range `(l, r)` instead of first. `dp[l][r] = max over k in (l, r) of (dp[l][k] + nums[l]*nums[k]*nums[r] + dp[k][r])`. Pad with 1s on both ends. O(n³).

**Tags:** #algorithm

---

### 5. Sliding Window Maximum

**Difficulty:** Hard
**Topics:** sliding-window, deque, monotonic-queue
**Position:** SWE
**Years:** 2-2

**Question:** Given an array `nums` and integer `k`, return the max of each window of size `k`.

**Approach:** Monotonic deque storing indices in decreasing value order. Push: pop back while `nums[back] <= nums[i]`, append i. Pop front if out of window (`front <= i - k`). Front of deque is current max. O(n).

**Tags:** #algorithm

---

### 6. Word Ladder II

**Difficulty:** Hard
**Topics:** graph, bfs, backtracking
**Position:** SWE
**Years:** 3-5

**Question:** Like Word Ladder, but return ALL shortest transformation sequences from `beginWord` to `endWord`.

**Approach:** BFS to build a `parent` graph (each node points to predecessors at the previous BFS layer); stop at the layer containing `endWord`. Then DFS/backtrack from `endWord` through the parent graph to enumerate all paths. Critical: don't enumerate during BFS — too slow. O(N * L^2 + paths).

**Tags:** #algorithm

---

### 7. Regular Expression Matching

**Difficulty:** Hard
**Topics:** dp, strings, recursion
**Position:** SWE
**Years:** 3-5

**Question:** Implement regex matching with `.` (any char) and `*` (zero or more of preceding element).

**Approach:** 2D DP. `dp[i][j]` = `s[:i]` matches `p[:j]`. If `p[j-1] == '*'`: `dp[i][j] = dp[i][j-2]` (zero copies) OR (matches preceding && `dp[i-1][j]`). If normal char/`.`: matches && `dp[i-1][j-1]`. Tricky edge: `*` requires p[j-2] to exist. O(m*n).

**Tags:** #algorithm

---

### 8. Number of Connected Components in Undirected Graph

**Difficulty:** Medium
**Topics:** union-find, graph, dfs
**Position:** SWE
**Years:** 2-2

**Question:** Given `n` nodes labeled 0 to n-1 and a list of undirected edges, return the number of connected components.

**Approach:** Union-Find with path compression and union by rank. Initialize n components; for each edge, union endpoints (decrement count if a real merge). O(E * α(N)). DFS/BFS alternative is also accepted.

**Tags:** #algorithm

---

### 9. Design TikTok Feed / Recommendation

**Difficulty:** Hard
**Topics:** system-design, recommendation, ranking, real-time
**Position:** Senior SWE
**Years:** 5+

**Question:** Design the For You Page (FYP) feed for TikTok. How does the system pick the next video for each user in <200ms?

**Approach:** Two-stage ranker: (1) **Candidate generation** — pull a few hundred candidates from multiple sources: collaborative filtering embeddings (user vector lookup → ANN search via FAISS/HNSW), recent uploads from followed creators, trending in your geo/language, "exploration" cold-start items. (2) **Ranking** — multi-task DNN scoring P(like), P(watch_to_completion), P(share), P(comment) given user features + video features + context. Combine with a weighted objective. Diversity rerank (don't show 5 cooking videos in a row). Online learning loop: every interaction streamed to Flink → updates user state in real-time (Kafka → user embedding store). Discuss cold start, cache layers, A/B framework, and inference latency budget.

**Tags:** #system-design

---

### 10. Design TikTok Video Upload + Encoding

**Difficulty:** Hard
**Topics:** system-design, video, blob-storage, encoding
**Position:** Senior SWE
**Years:** 5+

**Question:** Design the upload + encoding pipeline for TikTok. A user records a 60s vertical video and posts it; how does it become playable globally in seconds?

**Approach:** Client uploads to nearest edge (regional ingest) via resumable multipart. Original stored in cold blob; transcoding job enqueued. Transcoder fleet (autoscaled, GPU for some codecs) generates multiple bitrates (HLS chunks). Thumbnails extracted. ML moderation runs in parallel (NSFW classifier, copyrighted audio detection). Metadata + URLs written to a sharded DB. CDN preheat for high-engagement creators (push to PoPs in target geos). Discuss: parallel chunked encoding to keep latency low, fallback on encoding failure, and how the post enters the recommendation candidate pool only after moderation passes.

**Tags:** #system-design

---

### 11. Design a Real-Time Comment / Danmaku System

**Difficulty:** Hard
**Topics:** system-design, websockets, pub-sub, fanout
**Position:** Senior SWE
**Years:** 5+

**Question:** Design the live "danmaku" (bullet comments scrolling across video) system used in Douyin live streams.

**Approach:** Viewers WebSocket-connect to edge gateways (sharded by stream_id). Comments published → per-stream Kafka topic → gateways subscribe and fan out to connected viewers. At scale (1M+ concurrent on a single stream), sample/throttle: don't show every comment, render a representative sample. Apply spam filter (sync ML scorer + rate limit per user). Persist to async store for replay. Discuss back-pressure when one stream is hot (autoscale gateway pool), client-side rendering performance (limit visible comments to ~30/sec), and the user's own comment guaranteed-shown rule.

**Tags:** #system-design

---

### 12. Design a Distributed ID Generator (Snowflake-style)

**Difficulty:** Medium
**Topics:** system-design, distributed, id-generation
**Position:** SWE
**Years:** 2-3

**Question:** Design a service that generates unique, roughly time-ordered 64-bit IDs at extreme scale.

**Approach:** Snowflake format: 41-bit timestamp (ms since epoch) + 10-bit machine ID + 12-bit sequence (per ms). 4M IDs/sec per machine, ~69 years before timestamp overflow. Machine ID assigned via ZooKeeper or static config. Handle clock drift: refuse to issue if clock goes backwards (or wait until clock catches up). Discuss why monotonic-ish ordering matters for B-tree indexes (avoid hot-spot inserts at end vs scattered random IDs).

**Tags:** #system-design

---

### 13. Design Lark / Feishu Document Search

**Difficulty:** Hard
**Topics:** system-design, search, indexing, permissions
**Position:** Senior SWE
**Years:** 5+

**Question:** Design the search functionality across all documents a user has access to in Lark/Feishu (millions of docs per enterprise).

**Approach:** Inverted index in Elasticsearch sharded by tenant_id (enterprise). On doc edit, queue indexing job (eventual consistency OK). Permission filter: ACL check at query time (post-filter scored results, or precompute "viewable_by_users" terms in the index — trade-off between query speed and write amplification). Multilingual analyzer (Chinese tokenization via jieba or HanLP, English/others standard). Ranking: BM25 + recency + your engagement signals. Discuss: large doc handling (chunk + aggregate), real-time vs near-real-time indexing, and how to scale a single tenant with 10M docs (multi-shard within tenant).

**Tags:** #system-design

---

### 14. Design a Live Streaming Platform

**Difficulty:** Hard
**Topics:** system-design, rtmp, hls, cdn, low-latency
**Position:** Senior SWE
**Years:** 5+

**Question:** Design a live streaming platform supporting 100K concurrent broadcasters, each with up to 1M viewers, with sub-3-second end-to-end latency.

**Approach:** Streamer pushes RTMP/SRT/WebRTC to nearest ingest. Transcoder generates ABR ladder (240p → 1080p) as low-latency HLS or LL-DASH chunks (0.5-1s). Distribute via CDN with origin shielding. For sub-3s latency, prefer WebRTC for the last mile (more complex) or LL-HLS with partial segments. Discuss: chat/danmaku as separate pipeline (see Q11), interactive features (gifts, co-host), regional licensing for content, and abuse moderation (real-time ASR + frame sampling to classifier).

**Tags:** #system-design

---

### 15. Tell me about a time you delivered something faster than expected

**Difficulty:** Medium
**Topics:** behavioral, speed, ownership
**Position:** SWE
**Years:** 2-3

**Question:** Tell me about a project where you shipped much faster than originally estimated. How did you do it?

**Approach:** ByteDance's "速度" (speed) culture is core. Show: (1) you cut scope ruthlessly to v0, (2) you parallelized work or pulled in help proactively, (3) you accepted some technical debt explicitly with a plan to repay, (4) quantified impact and time-to-market wins. Avoid "I worked weekends" — they want smart scoping, not just hours.

**Tags:** #behavioral

---

### 16. Time you owned an end-to-end project

**Difficulty:** Medium
**Topics:** behavioral, ownership, scope
**Position:** Senior SWE
**Years:** 5+

**Question:** Describe a project where you owned the full lifecycle — design, implementation, launch, monitoring.

**Approach:** Show: (1) you set the technical direction (not just executed someone else's), (2) you partnered with PM/ops/design without being prompted, (3) you stayed engaged post-launch — measured success, ran a retro, planned v2. Bonus: you handed off to others later with clean docs and on-call playbooks. ByteDance promotes generalists who can own breadth.

**Tags:** #behavioral

---

### 17. Time you handled fast-changing requirements

**Difficulty:** Medium
**Topics:** behavioral, ambiguity, adaptability
**Position:** SWE
**Years:** 2-3

**Question:** Tell me about a time the requirements changed multiple times during a project. How did you handle it?

**Approach:** ByteDance moves fast — pivots are constant. Show: (1) you didn't push back defensively each time, (2) you built abstractions that made pivoting cheap (modular code, feature flags), (3) you helped the PM/leadership understand the cost of each change with data. Avoid stories where you complained about thrash — they want adaptability.

**Tags:** #behavioral

---

### 18. Why do you want to work at ByteDance / TikTok

**Difficulty:** Easy
**Topics:** behavioral, motivation, fit
**Position:** SWE
**Years:** 2-3

**Question:** Why ByteDance? What attracts you to TikTok specifically?

**Approach:** Don't say "I use TikTok a lot" alone. Better: (1) impressed by the speed of product iteration (cite a specific feature shipped recently), (2) interested in the recommendation system at scale (the algorithm is famous), (3) global product reach. Mention something technical you've read — a paper, a blog post on Monolith (their recommendation framework). Avoid politics.

**Tags:** #behavioral

---

### 19. Recommendation systems: collaborative filtering vs deep learning

**Difficulty:** Hard
**Topics:** recommendation, ml, ranking
**Position:** Senior SWE
**Years:** 5+

**Question:** Compare matrix factorization, two-tower models, and ranking DNNs for a feed recommendation system. When would you use each?

**Approach:** **Matrix factorization** — simple, interpretable, good baseline. Works for explicit feedback (ratings). Doesn't handle cold start well. **Two-tower** — user tower + item tower trained on positive pairs (clicked/watched), ANN serving. Great for retrieval/candidate generation at scale (millions of items). Limited feature interaction. **Ranking DNN** — heavy feature crosses (DCN, DeepFM), multi-task heads (CTR, watch time, share). Used post-retrieval on hundreds of candidates. Higher latency, hard to scale across full corpus. Modern stack: two-tower retrieval → DNN ranker → diversity rerank. Discuss cold start (content-based features in towers) and online learning.

**Tags:** #domain-knowledge

---

### 20. Video encoding trade-offs: H.264 vs H.265 vs AV1

**Difficulty:** Medium
**Topics:** video, encoding, codecs
**Position:** Senior SWE
**Years:** 5+

**Question:** TikTok needs to choose codecs for global video delivery. Walk through the trade-offs between H.264, H.265 (HEVC), VP9, and AV1.

**Approach:** **H.264** — universal device support, mature encoders, moderate compression. Default for broad reach. **H.265** — ~30-50% better compression than H.264, but patent royalty mess, weaker Android <8 support. **VP9** — Google's royalty-free alternative, similar to H.265, supported in Chrome/Android. **AV1** — best compression (~30% better than VP9), royalty-free, but encoding is CPU-expensive (newer chips have hardware decode but few have hardware encode). Strategy: ladder encode multiple codecs, serve the best one the client supports. Pre-encode popular content in AV1 to save egress; live-encode tail content in H.264 only. Discuss bandwidth savings ROI vs encoding cost.

**Tags:** #domain-knowledge

---

## Tips specific to ByteDance

- **The coding bar is no joke.** Practice Hard-tagged DP, graph (Dijkstra/Bellman-Ford/topo sort), and bit manipulation. They expect optimal O() on the first try.
- **Be ready for back-to-back rounds.** Energy management matters; the marathon format is the unspoken challenge.
- **For TikTok roles, have an opinion on the algorithm.** Read about Monolith (ByteDance's open-source recommendation framework) and have a take on real-time learning.
- **Mandarin is a plus** but not required for US/global roles. If you speak it, mention it — some rounds may flex to Mandarin if both sides prefer.
- **Don't underestimate the HR rounds.** They probe cultural fit and "speed of iteration" hard. Have crisp examples.

## Resources

- LeetCode "ByteDance" and "TikTok" company tags (high overlap with the LC Hard tag)
- ByteDance's open-source: Monolith (recommendation), CloudWeGo (Go RPC)
- "Recommender Systems Handbook" — Ricci et al.
- 1point3acres.com forum for Chinese-language interview reports
