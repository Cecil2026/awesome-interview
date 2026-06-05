# Apple

```yaml
company: Apple
typical_rounds: 1 recruiter chat + 1 phone screen + 4-6 onsite (team-specific; can be 1 day or split across days)
focus_areas: depends heavily on team — algorithms + system design + DEEP domain expertise
languages_allowed: Swift/Objective-C for iOS, C/C++ for embedded, JS/TS for web, Python for ML
duration: 45-60 min per round
notable_quirks:
  - Loops are owned by the hiring team — questions/structure vary wildly by org
  - Heavy domain-specific deep-dive (e.g., web perf for FE, signal processing for audio, low-level for kernel)
  - Privacy and on-device computation philosophy comes up
  - "Cross-functional" round common — talk to a non-engineer about your work
  - Less open with feedback, longer process (often 4-8 weeks)
sources: Glassdoor, LeetCode Discuss (apple tag), Blind, levels.fyi
```

## Overview

Apple's interview is the most team-dependent of the FAANGs. A Safari frontend role looks nothing like a CoreAudio role looks nothing like a Siri ML role. This file leans toward a generalist SWE / frontend angle that's broadly applicable. Common threads across teams: deep domain knowledge expected (you should be expert at *something*), privacy-by-design awareness, attention to user-facing detail, and a preference for senior engineers who can own a problem end-to-end. The bar for code quality is high — polish matters.

## Questions

### 1. Three Sum

**Difficulty:** Medium
**Topics:** arrays, two-pointer, sorting
**Position:** SWE
**Years:** ICT3-ICT4

**Question:** Given an array `nums`, return all unique triplets `[a, b, c]` such that `a + b + c == 0`.

**Approach:** Sort. Iterate fixed `i`; for each, use two pointers `l, r` on the right subarray to find pairs summing to `-nums[i]`. Skip duplicates at all three positions to ensure uniqueness. O(n²) time, O(1) extra (output not counted).

**Tags:** #algorithm

---

### 2. Product of Array Except Self

**Difficulty:** Medium
**Topics:** arrays, prefix-product
**Position:** SWE
**Years:** ICT3-ICT4

**Question:** Given an integer array `nums`, return an array `out` where `out[i] = product of all nums except nums[i]`. Solve without division and in O(n).

**Approach:** Two passes: first pass `out[i] = product of nums[0..i-1]` (left product). Second pass right-to-left, multiply by running right product. O(n) time, O(1) extra (output not counted). Watch zero handling — naive division fails on zeros.

**Tags:** #algorithm

---

### 3. Merge Two Sorted Lists

**Difficulty:** Easy
**Topics:** linked-list, recursion
**Position:** SWE
**Years:** ICT3

**Question:** Merge two sorted linked lists into one sorted list.

**Approach:** Dummy head node, two pointers, append smaller, advance, repeat. Append remainder. O(n+m), O(1). Recursive variant: `merge(a, b) = a < b ? a + merge(a.next, b) : b + merge(a, b.next)` — clean but O(n+m) stack.

**Tags:** #algorithm

---

### 4. Longest Palindromic Substring

**Difficulty:** Medium
**Topics:** strings, dp, expand-around-center
**Position:** SWE
**Years:** ICT3-ICT4

**Question:** Given a string `s`, return the longest palindromic substring.

**Approach:** Expand around center — for each index i, try odd-length (center=i) and even-length (center between i and i+1) expansions, track best. O(n²) time, O(1) space. Manacher's is O(n) but rarely required. Watch off-by-one for length / substring indices.

**Tags:** #algorithm

---

### 5. Implement strStr() / Find Substring

**Difficulty:** Easy
**Topics:** strings, sliding-window, kmp
**Position:** SWE
**Years:** ICT3

**Question:** Implement `strStr(haystack, needle)` — return the index of the first occurrence of `needle` in `haystack`, or -1.

**Approach:** Naive sliding window O(n*m). Apple often follows up with "now make it O(n+m)" → KMP with failure function, or Rabin-Karp with rolling hash. Be ready to walk through KMP failure-function construction.

**Tags:** #algorithm

---

### 6. LRU Cache

**Difficulty:** Medium
**Topics:** ood, hashmap, linked-list
**Position:** SWE
**Years:** ICT3-ICT4

**Question:** Design an LRU cache with O(1) `get` and `put`.

**Approach:** Hashmap `key -> node` + doubly linked list (head=most recent, tail=oldest). On `get`, move node to head. On `put` overflow, drop tail. Apple may ask follow-up: make it thread-safe (lock per bucket, or compare-and-swap on Node).

**Tags:** #algorithm

---

### 7. Binary Tree Maximum Path Sum

**Difficulty:** Hard
**Topics:** tree, dp, recursion
**Position:** SWE
**Years:** ICT4

**Question:** Given a non-empty binary tree, find the maximum path sum. A path may start and end at any nodes, not necessarily through the root.

**Approach:** DFS returning "max gain from this node going down one side" (max(0, left), max(0, right) — discard negative). At each node, candidate full path through it = `node.val + leftGain + rightGain`; update global max. Return `node.val + max(leftGain, rightGain)` for parent. O(n).

**Tags:** #algorithm

---

### 8. Coin Change

**Difficulty:** Medium
**Topics:** dp, greedy
**Position:** SWE
**Years:** ICT3-ICT4

**Question:** Given coin denominations and an amount, return the fewest coins needed to make that amount, or -1 if impossible.

**Approach:** Bottom-up DP. `dp[i]` = min coins to make `i`; `dp[0] = 0`, `dp[i] = min(dp[i - c] + 1)` for each coin c <= i. O(amount * coins). Greedy fails for arbitrary denominations (e.g., [1, 3, 4] for 6 → greedy gives 4+1+1=3, optimal is 3+3=2).

**Tags:** #algorithm

---

### 9. Design Apple Music (or Spotify-like)

**Difficulty:** Hard
**Topics:** system-design, cdn, drm, recommendation, offline
**Position:** Senior SWE
**Years:** ICT5

**Question:** Design Apple Music: streaming, library, recommendations, offline mode, lossless audio.

**Approach:** Audio files in blob storage + CDN, multiple bitrates (AAC 256kbps, lossless ALAC). DRM via FairPlay. Metadata sharded by track_id; user library (playlists, likes) sharded by user_id. Recommendations: offline two-tower embedding model + on-device re-ranking (Apple privacy lean). Offline downloads: client manages local cache with DRM license refresh. Discuss: cross-device sync (CloudKit), lossless streaming bandwidth, and how to preserve privacy by doing personalization on-device.

**Tags:** #system-design

---

### 10. Design iMessage

**Difficulty:** Hard
**Topics:** system-design, e2e-encryption, apns, multi-device
**Position:** Senior SWE
**Years:** ICT5

**Question:** Design iMessage: end-to-end encrypted, multi-device delivery, fallback to SMS.

**Approach:** Each device has its own keypair registered with Apple Push Service. Sender encrypts message N times (once per recipient device) and posts via APNS. Server stores ciphertext briefly until delivery, then deletes. Discuss: Identity Service maps phone/email → device list (this is the trust anchor, hence the Contact Key Verification feature), large group keys (sender key model), media (S3-like blob + per-message key), and graceful SMS fallback when recipient not on iMessage.

**Tags:** #system-design

---

### 11. Design iCloud Photo Library

**Difficulty:** Hard
**Topics:** system-design, sync, dedup, ml-on-device
**Position:** Senior SWE
**Years:** ICT5

**Question:** Design iCloud Photos: sync photos across devices, dedup, search by content, edit-on-one-device-sync-everywhere.

**Approach:** Content-addressed blob storage (SHA-256 of original) for dedup across users (with privacy: hash includes per-user salt, no cross-user dedup if true E2E). Per-user CloudKit zone for metadata. Edits stored as non-destructive adjustments (small JSON) layered over the original. Content search via on-device ML (Apple's Photos uses on-device classification — embeddings stored as encrypted metadata, search runs locally). Multi-device sync via CKShare deltas. Discuss bandwidth (lazy fetch full-res, eager thumbnails) and Optimize Storage feature.

**Tags:** #system-design

---

### 12. Design a Notification Service (APNS-like)

**Difficulty:** Hard
**Topics:** system-design, push, persistent-connections, fanout
**Position:** Senior SWE
**Years:** ICT5

**Question:** Design Apple Push Notification Service — a system that maintains a persistent connection to every active iOS device worldwide and delivers push notifications.

**Approach:** Edge layer of stateful connection servers, each holding ~1M+ persistent TLS connections (tuned kernels). Devices keep-alive every ~20 min (battery-friendly). Producer apps POST notifications → gateway → routed (by device_token → connection server via consistent hashing) → delivered. Persistent queue (Kafka) for transient device offline state, with TTL drop. Discuss: TLS handshake amortization, NAT keep-alive, priority tiers, and dedup on multiple sends for the same alert.

**Tags:** #system-design

---

### 13. Design Find My (offline finding)

**Difficulty:** Hard
**Topics:** system-design, e2e-encryption, ble, privacy
**Position:** Senior SWE
**Years:** ICT5

**Question:** Design Apple's Find My network — locate a lost device even when it's offline, without Apple knowing its location.

**Approach:** Lost device emits a rotating BLE beacon derived from a public key (private key kept on owner's other Apple devices). Nearby iPhones detect, encrypt their location with the beacon's public key, and upload to Apple. Owner queries with the private key. Apple cannot decrypt — only the owner can. Trade-offs: server stores opaque ciphertext (large data volume), key rotation prevents long-term tracking, finder phones unwittingly relay. Discuss collision resistance, replay attacks, and how owner devices share the private key chain.

**Tags:** #system-design

---

### 14. Design a CDN

**Difficulty:** Hard
**Topics:** system-design, cdn, caching, dns
**Position:** Senior SWE
**Years:** ICT5

**Question:** Design a CDN like Akamai or Apple's edge cache. Cover routing, cache hierarchy, and invalidation.

**Approach:** Edge PoPs in major cities; user routed to nearest via GeoDNS or anycast BGP. Edge → regional cache → origin (tiered to amortize origin load). Cache key = URL + headers (Vary). Invalidation: purge API → propagates via pub/sub to all edges (eventual ~seconds). Origin pull for cache miss; signed URLs for private content. Discuss: cache stampede (request coalescing at edge), TLS termination at edge, and HTTP/3 / QUIC for last-mile.

**Tags:** #system-design

---

### 15. Tell me about a time you obsessed over a detail

**Difficulty:** Medium
**Topics:** behavioral, attention-to-detail, craft
**Position:** SWE
**Years:** ICT3-ICT4

**Question:** Tell me about a time you went deep into a small detail others might have overlooked.

**Approach:** Apple values craft — pick a story where the detail mattered to the user (latency shaved, animation jank fixed, accessibility bug nobody filed). STAR with emphasis on: (1) you noticed when others didn't, (2) you measured the impact (not just "it felt better"), (3) you advocated to spend the time. Avoid "I rewrote everything for purity" — that's not craft, that's vanity.

**Tags:** #behavioral

---

### 16. Time you had to balance speed and quality

**Difficulty:** Medium
**Topics:** behavioral, tradeoffs, judgment
**Position:** Senior SWE
**Years:** ICT5

**Question:** Tell me about a time you had to make a trade-off between shipping fast and shipping well. How did you decide?

**Approach:** Apple culture: ship when ready, not when scheduled. But they want pragmatism, not perfectionism. Show: (1) you defined the minimum bar explicitly (what's a P0 bug vs P2?), (2) you communicated trade-offs to PM/leadership, (3) you owned the post-ship follow-up to close the gap. Avoid "we slipped 3 months for polish" without strong user-impact justification.

**Tags:** #behavioral

---

### 17. Time you collaborated with a difficult cross-functional partner

**Difficulty:** Medium
**Topics:** behavioral, cross-functional, conflict
**Position:** Senior SWE
**Years:** ICT5

**Question:** Tell me about a time you had a difficult working relationship with a designer, PM, or another engineer. How did you make it work?

**Approach:** Apple has strong design and PM functions — engineers must collaborate effectively. Show: (1) you tried to understand their frame (design language, user research data), (2) you found a shared metric/goal, (3) you adjusted *your* communication, not just demanded they change. Bonus: the relationship turned into a productive partnership long-term.

**Tags:** #behavioral

---

### 18. Why do you want to work at Apple

**Difficulty:** Easy
**Topics:** behavioral, motivation, fit
**Position:** SWE
**Years:** ICT3-ICT5

**Question:** Why Apple specifically, over <Google/Meta/Microsoft>?

**Approach:** Don't say "stock" or "brand." Pick one of: (1) specific product you use and love (be specific about what), (2) Apple's privacy stance and how it aligns with your work values, (3) the integration of hardware+software you can't do elsewhere, (4) the team's specific mission. Have something concrete you've done that shows interest (e.g., contributed to Swift, built an iOS app, read Apple's ML research papers).

**Tags:** #behavioral

---

### 19. Frontend / web perf: optimize Largest Contentful Paint

**Difficulty:** Hard
**Topics:** web-perf, frontend, lcp
**Position:** Frontend
**Years:** ICT5

**Question:** A marketing page on apple.com has an LCP of 4.5s on 3G. How do you get it under 2.5s?

**Approach:** Identify the LCP element first (DevTools → Performance → LCP marker). Typical wins: (1) preload the LCP image with `<link rel=preload as=image>` + `fetchpriority=high`, (2) serve in AVIF/WebP with proper `srcset`, (3) eliminate render-blocking CSS — inline critical CSS, defer rest, (4) eliminate render-blocking JS — defer all non-critical, (5) use HTTP/2 push or 103 Early Hints, (6) server-side render the hero, (7) optimize TTFB (edge caching, fewer redirects). Measure with field RUM data, not just lab. Mention `loading=lazy` should *not* be on the LCP image (anti-pattern).

**Tags:** #domain-knowledge

---

### 20. On-device ML vs cloud ML trade-offs

**Difficulty:** Medium
**Topics:** ml, privacy, mobile, ood
**Position:** Senior SWE
**Years:** ICT5

**Question:** A new feature needs ML inference on user data. Should it run on-device or in the cloud? Walk through the trade-offs.

**Approach:** Apple's strong on-device bias is the cultural lens. Pros of on-device: privacy (data never leaves device), latency (no network round-trip), works offline, no server cost. Cons: model size constrained (must fit in tens of MB), can't share learning across users without federated learning, harder to update (must ship in OS). When cloud wins: model too large (LLMs), needs aggregate data, server-side personalization with explicit consent. Discuss hybrid (on-device candidate generation, cloud re-rank with hashed features) and Differential Privacy when uploading aggregate stats.

**Tags:** #domain-knowledge

---

## Tips specific to Apple

- **Know which team you're interviewing for.** Loops are owned by hiring teams; loop content varies enormously. Ask the recruiter what to expect.
- **Have depth somewhere.** Apple hires specialists. Pick a domain (low-level perf, graphics, ML, frontend, embedded, audio) and be deep. Generalists get pushed to compete with FAANG strongholds.
- **Privacy mindset.** When designing systems, default to "data minimization" and "on-device when possible" without being preachy. Even backend roles get the privacy question.
- **Don't bash other Apple products** — even gently. Loyalty to the platform is cultural.
- **Process is slow.** Onsite to offer can be 4-8 weeks. Manage other timelines accordingly.

## Resources

- LeetCode "Apple" company tag
- Apple Developer documentation (depending on team — read about Swift, Combine, Metal, or Core ML)
- Apple Machine Learning research blog
- "Creative Selection" by Ken Kocienda — internal product process at Apple
