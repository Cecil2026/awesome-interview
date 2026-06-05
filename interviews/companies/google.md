# Google

```yaml
company: Google (Alphabet)
typical_rounds: 1 recruiter chat + 1 phone screen + 4-5 onsite (3 coding, 1 system design at L5+, 1 Googleyness/Leadership)
focus_areas: algorithms, data structures, system design at scale, Googleyness
languages_allowed: any major language; Python/Java/C++/Go most common
duration: 45 min coding rounds, 45-60 min system design
notable_quirks:
  - Code is written in a shared doc (no auto-complete, no compiler)
  - Hiring committee reviews packets; your interviewers do not decide
  - "Googleyness" round probes ambiguity-handling, collaboration, intellectual humility
  - Expect deep follow-ups: "now what if the input is 10TB?" / "now make it concurrent"
sources: Glassdoor, LeetCode Discuss (google tag), Blind, levels.fyi
```

## Overview

Google's loop is heavy on classical algorithms (graphs, DP, data structure design) and on scaling/extending an initial solution. Interviewers strongly value clean code, correct edge cases, and clear reasoning under follow-up pressure. System design at L5+ leans on Google-flavored infra (GFS, Bigtable, Spanner, MapReduce) — not because you need to name-drop, but because the trade-offs (consistency vs availability, batch vs stream) come up constantly.

## Questions

### 1. Word Ladder

**Difficulty:** Medium
**Topics:** graph, bfs, strings, hashmap
**Position:** SWE
**Years:** L3-L4

**Question:** Given two words `beginWord` and `endWord`, and a dictionary `wordList`, return the length of the shortest transformation sequence from `beginWord` to `endWord`, where each transformation changes exactly one letter and every intermediate word must be in `wordList`. Return 0 if no such sequence exists.

**Approach:** BFS on a graph where nodes are words and edges connect words differing by one letter. Pre-build an index of `*at -> [bat, cat, hat]` patterns to find neighbors in O(L) instead of comparing against every word. Bidirectional BFS halves the search space. Time O(N * L^2), space O(N * L).

**Tags:** #algorithm

---

### 2. Number of Islands

**Difficulty:** Medium
**Topics:** graph, dfs, bfs, union-find, matrix
**Position:** SWE
**Years:** L3-L4

**Question:** Given an `m x n` 2D binary grid where `'1'` is land and `'0'` is water, return the number of islands (an island is a maximal group of horizontally/vertically adjacent land cells).

**Approach:** Iterate cells; on each unvisited `'1'`, DFS/BFS to mark the whole island, increment count. Mark visited in-place (flip to `'0'`) to save space. O(m*n) time, O(m*n) worst-case recursion stack. Follow-up Google loves: "now the grid streams in row by row — design it" → union-find with row-by-row merging.

**Tags:** #algorithm

---

### 3. Longest Substring Without Repeating Characters

**Difficulty:** Medium
**Topics:** strings, sliding-window, hashmap
**Position:** SWE
**Years:** L3-L4

**Question:** Given a string `s`, find the length of the longest substring without repeating characters.

**Approach:** Sliding window with a hashmap of `char -> last_index`. When a duplicate is seen inside the window, move `left` to `max(left, last_index + 1)`. O(n) time, O(min(n, alphabet)) space. Edge cases: empty string, all unique, Unicode.

**Tags:** #algorithm

---

### 4. Meeting Rooms II

**Difficulty:** Medium
**Topics:** heap, sorting, sweep-line, intervals
**Position:** SWE
**Years:** L3-L4

**Question:** Given an array of meeting time intervals `[start, end]`, return the minimum number of conference rooms required.

**Approach:** Sort by start; use a min-heap of end times. For each meeting, if the earliest-ending room ends `<= start`, reuse it (pop+push); else push (allocate new room). Heap size at end is the answer. Alternative: sweep-line with separate start/end arrays. O(n log n).

**Tags:** #algorithm

---

### 5. Decode String

**Difficulty:** Medium
**Topics:** stack, strings, recursion
**Position:** SWE
**Years:** L3-L4

**Question:** Given an encoded string like `"3[a2[c]]"`, decode it to `"accaccacc"`. The encoding rule is `k[encoded_string]`, repeating `encoded_string` `k` times. `k` is always a positive integer.

**Approach:** Two stacks — one for counts, one for partial strings. On `[`, push current count and current string and reset both. On `]`, pop and combine. Alternative: recursive descent parser. Watch multi-digit counts. O(n * max_k).

**Tags:** #algorithm

---

### 6. Find Median from Data Stream

**Difficulty:** Hard
**Topics:** heap, design, streaming
**Position:** SWE
**Years:** L5

**Question:** Design a data structure that supports `addNum(int num)` and `findMedian()`. Numbers arrive one at a time; `findMedian` must run in O(log n) or better.

**Approach:** Two heaps — max-heap `lo` holds the smaller half, min-heap `hi` holds the larger half. Maintain `len(lo) == len(hi)` or `len(lo) == len(hi)+1`. Add: push to lo, move top of lo to hi, rebalance. Median is `lo.top()` or `(lo.top() + hi.top())/2`. O(log n) add, O(1) median.

**Tags:** #algorithm

---

### 7. Longest Increasing Path in a Matrix

**Difficulty:** Hard
**Topics:** dp, dfs, memoization, graph
**Position:** SWE
**Years:** L5

**Question:** Given an `m x n` matrix of integers, return the length of the longest strictly increasing path. You may move 4-directionally.

**Approach:** DFS with memoization — `dp[i][j]` = longest increasing path starting at `(i,j)`. Recurse into neighbors with larger values; cache result. No visited set needed because strict increase prevents cycles. O(m*n) time/space.

**Tags:** #algorithm

---

### 8. Maximum Profit in Job Scheduling

**Difficulty:** Hard
**Topics:** dp, binary-search, sorting, intervals
**Position:** SWE
**Years:** L5

**Question:** Given `n` jobs with `startTime[i]`, `endTime[i]`, `profit[i]`, return the maximum profit such that no two chosen jobs overlap in time.

**Approach:** Sort jobs by end time. `dp[i]` = max profit using first `i` jobs. For job `i`, either skip (`dp[i-1]`) or take (`profit[i] + dp[j]` where `j` is the last job ending `<= start[i]`, found via binary search). O(n log n).

**Tags:** #algorithm

---

### 9. Design Google Docs (collaborative editor)

**Difficulty:** Hard
**Topics:** system-design, crdt, operational-transform, websockets, consistency
**Position:** Senior SWE
**Years:** L5

**Question:** Design a real-time collaborative document editor like Google Docs supporting multiple concurrent editors.

**Approach:** Core problem is concurrent edits with eventual consistency. Two main techniques: Operational Transformation (OT — what Google Docs actually uses) or CRDTs. Client sends operations to a per-document server (sticky session via consistent hashing on doc ID). Server serializes ops, broadcasts via WebSocket to all collaborators. Persist op log + periodic snapshots in a distributed store (Bigtable/Spanner). Trade-offs: OT needs a central server but compact ops; CRDTs are peer-to-peer-friendly but metadata-heavy. Discuss cursor presence, offline editing, undo.

**Tags:** #system-design

---

### 10. Design Google Search Autocomplete

**Difficulty:** Hard
**Topics:** system-design, trie, caching, ranking, sharding
**Position:** Senior SWE
**Years:** L5

**Question:** Design the typeahead suggestion service that powers Google Search's search box for billions of users.

**Approach:** Trie of prefixes with top-k completions cached at each node (precomputed offline from query logs). Shard by prefix range across many servers. CDN/edge cache for popular prefixes (Zipfian). Fresh queries flow into a streaming pipeline (Dataflow) that updates trie weights hourly. Discuss latency budget (<100ms), personalization (re-rank top-k with user signals), spell correction, profanity filter, and how to update without rebuilding the whole trie.

**Tags:** #system-design

---

### 11. Design YouTube

**Difficulty:** Hard
**Topics:** system-design, cdn, video-encoding, sharding, recommendation
**Position:** Senior SWE
**Years:** L5

**Question:** Design YouTube end-to-end: upload, encoding, storage, playback, recommendations.

**Approach:** Upload to blob storage (GCS), enqueue encoding job into pub/sub. Encoders transcode to multiple resolutions/codecs (H.264, VP9, AV1) and chunked HLS/DASH segments. Store metadata in a sharded RDBMS, view counts in a Bigtable-style store with eventual consistency. Playback served from CDN with origin pull. Recommendations: offline candidate generation (matrix factorization, two-tower) + online ranking. Discuss cold start, thumbnail selection, copyright detection (Content ID), and the read/write fan-out for view counts.

**Tags:** #system-design

---

### 12. Design a Distributed Key-Value Store

**Difficulty:** Hard
**Topics:** system-design, consistent-hashing, replication, consensus, sharding
**Position:** Senior SWE
**Years:** L5

**Question:** Design a distributed KV store (think DynamoDB or Bigtable). Cover sharding, replication, consistency, failure handling.

**Approach:** Consistent hashing for shard placement; virtual nodes to smooth load. Replication factor N (typically 3) across racks/zones. Quorum reads/writes (R + W > N for strong consistency). Use Raft or Paxos for per-shard leader election; or Dynamo-style leaderless with vector clocks + read repair. Hinted handoff and Merkle-tree anti-entropy for eventual consistency. Discuss CAP trade-offs explicitly: "I'd choose AP for a shopping cart, CP for inventory."

**Tags:** #system-design

---

### 13. Design Google Drive

**Difficulty:** Hard
**Topics:** system-design, blob-storage, sync, conflict-resolution, chunking
**Position:** Senior SWE
**Years:** L5

**Question:** Design Google Drive: file storage with multi-device sync and sharing.

**Approach:** Chunk files into 4MB blocks, content-addressed by SHA-256 (dedup across users). Store blocks in blob storage; per-user metadata (file tree, ACLs, versions) in a sharded RDBMS. Sync client computes local hashes, diffs against server manifest, uploads only changed chunks (rsync-style). Conflict resolution: keep both versions on concurrent edits. Notifications via long-poll/WebSocket. Discuss sharing model (ACL inheritance), large file uploads (resumable), and end-to-end encryption trade-offs.

**Tags:** #system-design

---

### 14. Design Google Calendar

**Difficulty:** Medium
**Topics:** system-design, scheduling, timezones, recurrence, notifications
**Position:** Senior SWE
**Years:** L5

**Question:** Design Google Calendar with event creation, recurring events, reminders, and free-busy lookup.

**Approach:** Store events as `(owner, start, end, recurrence_rule)` using iCalendar RRULE format — don't materialize every occurrence. Per-user calendar sharded by user_id. Free-busy is range query on event index; for cross-user "find a time" use union of free-busy ranges. Reminders: time-bucketed queue (Chubby/ZK-coordinated) that fires events into a notification service. Time zones are the hard part — store events in UTC + IANA tz id, render in local. Discuss invite RSVP, recurring exceptions, and dial-in integrations.

**Tags:** #system-design

---

### 15. Tell me about a time you disagreed with a teammate

**Difficulty:** Medium
**Topics:** behavioral, conflict, collaboration
**Position:** SWE
**Years:** L3-L4

**Question:** Tell me about a time you strongly disagreed with a teammate or manager. How did you handle it and what was the outcome?

**Approach:** STAR. Pick a *technical* disagreement (Google likes data-driven debate). Show: (1) you understood their position before pushing yours, (2) you proposed concrete data/experiment to resolve, (3) you accepted the outcome gracefully even if you "lost." Avoid stories where you were right and they were wrong all along — Google probes for intellectual humility.

**Tags:** #behavioral

---

### 16. Most challenging project you've worked on

**Difficulty:** Medium
**Topics:** behavioral, ownership, technical-depth
**Position:** SWE
**Years:** L3-L4

**Question:** Walk me through the most technically challenging project you've worked on. What made it hard?

**Approach:** STAR with heavy emphasis on the T (task) and A (action). Be ready for 5-10 minutes of follow-up: "why that algorithm?" / "how did you measure success?" / "what would you do differently?" Pick a project where you can show ownership end-to-end, not just one piece. Quantify impact.

**Tags:** #behavioral

---

### 17. Time you handled ambiguous requirements

**Difficulty:** Medium
**Topics:** behavioral, ambiguity, googleyness
**Position:** Senior SWE
**Years:** L5

**Question:** Tell me about a time you had to work on a project with unclear or shifting requirements.

**Approach:** This is Google's "Googleyness" hallmark. Show: (1) you didn't wait — you proposed a v0 to force clarity, (2) you partnered with PM/stakeholders rather than complaining, (3) you de-risked by shipping iteratively. Land the impact: "we shipped X 2 quarters early because we didn't wait for full spec."

**Tags:** #behavioral

---

### 18. Time you failed

**Difficulty:** Medium
**Topics:** behavioral, failure, growth-mindset
**Position:** SWE
**Years:** L3-L4

**Question:** Tell me about a significant failure. What happened and what did you learn?

**Approach:** Pick a real failure (not "I worked too hard"). Show: (1) you owned it without blaming others, (2) you understood the *systemic* root cause (process gap, missing test, bad assumption), (3) the lesson changed how you work going forward with a concrete example. Bonus: mention the fix benefited the team beyond just you.

**Tags:** #behavioral

---

### 19. Design a rate limiter for the Google API gateway

**Difficulty:** Hard
**Topics:** system-design, rate-limiting, distributed-systems, redis
**Position:** Senior SWE
**Years:** L5

**Question:** Design a rate limiter that enforces per-user / per-API-key quotas across a globally distributed API gateway serving millions of QPS.

**Approach:** Algorithm choice: token bucket (smooth bursts) or sliding window log (accurate). Storage: Redis cluster sharded by user_id with Lua scripts for atomic decrement-and-check. For global limits across regions, use a centralized authority for hard limits or eventual-consistency for soft limits with overshoot tolerance. Discuss tier: per-second (in-process LRU) → per-minute (regional Redis) → per-day (global DB). Failure mode: open vs closed when the limiter is down.

**Tags:** #domain-knowledge

---

### 20. Optimize a slow query in a distributed SQL system

**Difficulty:** Hard
**Topics:** databases, distributed-systems, query-optimization, indexing
**Position:** Senior SWE
**Years:** L5

**Question:** A query on Spanner (or any distributed SQL) is taking 30s when it should take 200ms. Walk me through how you'd debug and fix it.

**Approach:** Start with `EXPLAIN ANALYZE` — look for full table scans, cross-shard joins, hot shards. Check whether the query touches one shard (good) or fans out (bad — likely needs an interleaved table or schema redesign). Look for missing secondary indexes; consider covering indexes to avoid back-lookups. If shard distribution is skewed (one tenant = 50% of data), discuss re-sharding or per-tenant isolation. Mention metrics you'd watch (p99 latency, scan rows, CPU per shard) and discuss whether to denormalize.

**Tags:** #domain-knowledge

---

## Tips specific to Google

- **Talk while you code.** Silent coding in a Google Doc with no autocomplete reads as "stuck." Narrate your thought process even when you're confident.
- **Always discuss edge cases explicitly** before you start: empty input, single element, duplicates, overflow, negative numbers. Interviewers often grade an extra point just for this.
- **Expect at least one follow-up that breaks your initial solution.** "What if the input doesn't fit in memory?" / "What if 1000 threads call this?" Have a plan for streaming and concurrency.
- **For system design, draw boxes early.** Don't talk for 10 minutes before writing anything. A messy diagram beats a clean monologue.
- **Googleyness is real.** Two strong technical rounds + one weak behavioral round = no offer. Prep 6-8 STAR stories.

## Resources

- LeetCode "Google" company tag (curated public list)
- Cracking the Coding Interview, ch. 11 (Google-style design)
- "System Design Interview" by Alex Xu — volumes 1 and 2
- Google's own SRE book (free online) — useful for SRE/infra rounds
