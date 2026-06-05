# Tencent

```yaml
company: Tencent (WeChat/Weixin, QQ, Tencent Games, Tencent Cloud, Tencent Video)
typical_rounds: 1 HR screen + 3-5 technical (often interviewer tier: T2.2 → T3.x → T4) + cross-team + HR final
focus_areas: C++/distributed systems, networking, gaming backend, social/messaging at scale
languages_allowed: C++ strongly preferred for game/infra teams; Java/Go for cloud; Python/Node for some web roles
duration: 45-60 min per round
notable_quirks:
  - Networking deep-dives common (TCP internals, UDP-based protocols, kernel networking)
  - Game backend roles probe game loop design, lockstep/state sync, anti-cheat
  - WeChat-scale messaging design comes up for senior roles
  - Behavioral lighter than US companies; focus on collaboration and getting along across BGs (business groups)
  - Multiple business groups (WXG, IEG, CSIG, TEG, PCG) — each has its own culture
sources: 1point3acres, NowCoder (牛客网), LeetCode-cn, niuke.com
```

## Overview

Tencent's interview leans C++ for infrastructure and gaming roles (Tencent runs huge C++ shops behind WeChat, QQ, Honor of Kings, PUBG Mobile, League of Legends backends). Networking knowledge — TCP windowing, NAT traversal, custom UDP protocols, packet loss handling — is expected for game/IM roles. System design centers on social/messaging at WeChat scale (1B+ MAU) and gaming backends (lockstep, state sync, matchmaking). Behavioral is lighter than US firms; they probe collaboration across business groups (BGs) since cross-BG work is structurally hard at Tencent.

## Questions

### 1. Add Two Numbers (Linked List)

**Difficulty:** Medium
**Topics:** linked-list, math
**Position:** SWE
**Years:** T2-T3

**Question:** Two non-negative integers stored as reverse-order linked lists (one digit per node). Return their sum as the same kind of list.

**Approach:** Walk both lists together, carry digit forward. Dummy head, advance result pointer. Watch: lists of different length, final carry → extra node. O(max(n, m)).

**Tags:** #algorithm

---

### 2. Add Strings

**Difficulty:** Easy
**Topics:** strings, math
**Position:** SWE
**Years:** T2-T3

**Question:** Given two non-negative integers as strings, return their sum as a string (no using built-in BigInt).

**Approach:** Two pointers from end, carry, append digit. Reverse result. O(max(n, m)). Common Tencent warm-up to check basic correctness coding.

**Tags:** #algorithm

---

### 3. Linked List Cycle II

**Difficulty:** Medium
**Topics:** linked-list, two-pointer, floyd
**Position:** SWE
**Years:** T2-T3

**Question:** Given a linked list, return the node where the cycle begins, or null if no cycle.

**Approach:** Floyd's tortoise and hare. Slow + fast pointers — if they meet, reset slow to head, advance both by 1; they meet at cycle start. O(n) time, O(1) space. The math (2k = k + nL → k - μ = nL - μ) trips people up — be ready to explain.

**Tags:** #algorithm

---

### 4. Permutations

**Difficulty:** Medium
**Topics:** backtracking, recursion
**Position:** SWE
**Years:** T2-T3

**Question:** Given a distinct integer array, return all possible permutations.

**Approach:** Backtracking — swap current index with each subsequent index, recurse, swap back. Or use a `used[]` boolean array. O(n * n!). Follow-up: with duplicates — sort and skip when `used[i-1]` is false and `nums[i] == nums[i-1]`.

**Tags:** #algorithm

---

### 5. Maximum Subarray (Kadane)

**Difficulty:** Easy
**Topics:** dp, arrays, greedy
**Position:** SWE
**Years:** T2-T3

**Question:** Given an integer array, find the contiguous subarray with the largest sum.

**Approach:** Kadane's: track `current = max(num, current + num)`, `best = max(best, current)`. O(n) time, O(1) space. Handle all-negative case (return single max element). Follow-up: also return start/end indices.

**Tags:** #algorithm

---

### 6. Reverse a String In-Place

**Difficulty:** Easy
**Topics:** strings, two-pointer
**Position:** SWE
**Years:** T2

**Question:** Reverse a `char[]` in-place. Then: reverse word order in a sentence in-place (`"the sky is blue"` → `"blue is sky the"`).

**Approach:** Part 1: two pointers swap. Part 2: reverse whole string, then reverse each word. O(n) time, O(1) extra. Tencent C++ classic — interviewers also ask about `std::string` SSO and copy-on-write semantics in pre-C++11.

**Tags:** #coding

---

### 7. Lowest Common Ancestor of BST

**Difficulty:** Easy
**Topics:** tree, bst, recursion
**Position:** SWE
**Years:** T2-T3

**Question:** Given a BST and two nodes `p` and `q`, find their LCA.

**Approach:** BST property: if both p and q < root, recurse left; if both >, recurse right; else current is LCA. O(h) time, O(1) iterative. Don't over-engineer for general binary tree.

**Tags:** #algorithm

---

### 8. Min Stack

**Difficulty:** Easy
**Topics:** stack, design
**Position:** SWE
**Years:** T2-T3

**Question:** Design a stack supporting `push`, `pop`, `top`, and `getMin`, all in O(1).

**Approach:** Two stacks: main stack + min stack (push min to min stack only when new value ≤ current min; pop in sync). Or single stack of `(value, current_min)` pairs. O(1) all ops.

**Tags:** #coding

---

### 9. Design WeChat Messaging Backend

**Difficulty:** Hard
**Topics:** system-design, im, websockets, presence, scale
**Position:** Senior SWE
**Years:** T3-T4

**Question:** Design WeChat's messaging backend supporting 1B+ MAU, 1:1 chat, group chat (up to 500 members), and global presence.

**Approach:** Persistent TCP/MQTT connection from each client to nearest access gateway (sharded by user_id). Messages flow gateway → routing service (looks up recipient's gateway via online registry) → recipient gateway → device. Offline messages persisted to KV store; pushed on reconnect. Group chat: fan-out at the per-group routing service; for 500 members, that's tractable. Presence: in-memory store per region, gossip globally with TTL'd entries (eventual consistency OK). Persist messages 7 days in hot store + 90 days cold. Discuss: end-to-end encryption (Tencent historically not E2E for compliance with Chinese law — call this out honestly), message ordering within a chat (sequence numbers per chat), multi-device sync, and very large group support (broadcast groups have different design).

**Tags:** #system-design

---

### 10. Design WeChat Moments (朋友圈)

**Difficulty:** Hard
**Topics:** system-design, feed, privacy, fanout
**Position:** Senior SWE
**Years:** T3-T4

**Question:** Design WeChat Moments — friends-only feed where posts are visible only to mutual friends, with strict privacy controls.

**Approach:** Closed-graph feed (unlike Twitter/Weibo) — only mutual friends see posts. Hybrid push/pull as in News Feed. Critical privacy property: comments and likes on a post are visible only to mutual friends of the *poster*. So when displaying a post, server filters comments to those by people the viewer is also friends with — done at read time via friend-graph intersection (cache the intersection result). Photos in CDN with signed short-lived URLs (no public discoverable URL). Discuss: "三天可见" (visible-for-3-days) implemented as a per-post TTL flag, message-style notification on comment/like (via the IM system from Q9), and how to handle a viral post (rare in closed graph, but possible — cache aggressively).

**Tags:** #system-design

---

### 11. Design a Multiplayer Game Server (Honor of Kings-style)

**Difficulty:** Hard
**Topics:** system-design, gaming, low-latency, state-sync
**Position:** Senior SWE
**Years:** T3-T4

**Question:** Design the backend for a real-time 5v5 MOBA game like Honor of Kings. Latency budget: <100ms perceived.

**Approach:** Matchmaking service (skill + region + party-aware) → game server allocator (Kubernetes pool of dedicated game servers across regions). Game server runs authoritative simulation. **Frame sync (lockstep)**: clients send inputs only (small packets), all clients run identical deterministic simulation in lockstep, advance frame when all inputs received. Tencent's choice for MOBAs — bandwidth tiny, anti-cheat via input-only model. Tradeoff: 1 slow client = everyone waits. **State sync**: server simulates, sends state diffs — used by FPS. Network: custom UDP protocol (with reliability layer); TCP unacceptable for game traffic. Discuss: clock sync (NTP-ish), packet loss tolerance (resend inputs, predict for state-sync), reconnect (replay inputs from last frame), and cheat detection (server-side replay for sample matches).

**Tags:** #system-design

---

### 12. Design QQ / WeChat Voice & Video Call

**Difficulty:** Hard
**Topics:** system-design, webrtc, sfu, nat-traversal, codecs
**Position:** Senior SWE
**Years:** T3-T4

**Question:** Design the voice/video call infrastructure for WeChat (1:1 and multi-party up to 9).

**Approach:** Signaling over the IM channel (SDP offer/answer through messaging). Media: WebRTC-style with ICE for NAT traversal (STUN/TURN servers). For 1:1, P2P preferred (lower latency, less server cost). For multi-party, SFU (Selective Forwarding Unit) — each client uploads one stream, server forwards to N-1 others without transcoding (low latency, scales reasonably). Codecs: Opus audio, H.264/H.265 video, adaptive bitrate. Echo cancellation, noise suppression, jitter buffer on client. Discuss: TURN relay cost (many users behind symmetric NAT), regional media servers, and bandwidth adaptation under network degradation.

**Tags:** #system-design

---

### 13. Design Tencent Cloud Object Storage (COS)

**Difficulty:** Hard
**Topics:** system-design, blob-storage, replication, consistency
**Position:** Senior SWE
**Years:** T3-T4

**Question:** Design Tencent COS — object storage API-compatible with S3.

**Approach:** Front-end S3-compatible API → metadata service (sharded by bucket+key) → storage layer with erasure coding (Reed-Solomon 10+4) across many nodes/racks/AZs. Strong consistency within a region via metadata coordinator (Paxos). Multi-region async replication for DR. Discuss: erasure coding vs 3x replication trade-offs (~50% storage savings, more CPU/network on read), large object multipart upload, lifecycle to cold storage (Archive Storage equivalent), and how to handle a hot key (CDN + replica fan-out for popular reads).

**Tags:** #system-design

---

### 14. Design a Live Streaming Gift / Bullet-Comment System

**Difficulty:** Hard
**Topics:** system-design, real-time, fanout, monetization
**Position:** Senior SWE
**Years:** T3-T4

**Question:** Design the gift-sending and bullet-comment system for Tencent Video / NOW Live where viewers can send virtual gifts (with payment) and chat in real-time during a live broadcast.

**Approach:** Gift purchase: transactional flow (debit user wallet → record gift event → broadcast). Wallet write is the consistency-critical step; rest can be eventual. Comment/gift event → per-stream Kafka topic → fan out to viewer WebSocket gateways. On very hot streams (1M+ concurrent), throttle and sample for display; persist all to DB. Big-spender effects (special animations) prioritized in the broadcast queue. Discuss: anti-fraud on gifts (sudden spike from one user = potential card fraud), tax/compliance for streamer revenue share, and graceful degradation when the stream becomes too hot (drop low-value comments first).

**Tags:** #system-design

---

### 15. Tell me about a time you collaborated across teams

**Difficulty:** Medium
**Topics:** behavioral, collaboration, cross-bg
**Position:** SWE
**Years:** T2-T3

**Question:** Tell me about a time you had to work with another team or BG to deliver a project. What was hard about it?

**Approach:** Tencent's BG structure makes cross-team work culturally hard — they probe whether you can navigate it. Show: (1) you built the relationship early (didn't just escalate when blocked), (2) you understood their priorities (different OKRs, different leadership), (3) you proposed a win-win framing, (4) you delivered together. Mentioning specific friction (resource allocation, schedule misalignment) and how you resolved it lands well.

**Tags:** #behavioral

---

### 16. Time you proactively fixed something not in your scope

**Difficulty:** Medium
**Topics:** behavioral, ownership, initiative
**Position:** SWE
**Years:** T2-T3

**Question:** Tell me about a time you noticed a problem and fixed it without being asked.

**Approach:** Tencent values "主动" (proactive) engineers. Show: (1) the specific problem (production bug, tech debt, missing tool), (2) you didn't wait for prioritization — you spent personal time or off-cycle, (3) you made sure your fix was reviewed and adopted (didn't just commit cowboy-style), (4) impact: it helped the team measurably. Don't pick a story where the fix was actually your direct responsibility.

**Tags:** #behavioral

---

### 17. Time you handled a production incident

**Difficulty:** Medium
**Topics:** behavioral, incident-response, ownership
**Position:** Senior SWE
**Years:** T3-T4

**Question:** Walk me through a production incident you led. What happened, how did you respond, and what changed afterward?

**Approach:** Pick a real incident (not a "near miss"). Show: (1) you triaged with cool head — mitigation first, RCA later, (2) you communicated to stakeholders during (status updates every 15-30 min), (3) you ran a blameless retro that produced concrete action items, (4) you followed up on the action items not just filed them. Quantify the impact (downtime minutes, users affected) and the post-fix improvement (MTTR cut by X).

**Tags:** #behavioral

---

### 18. Why Tencent

**Difficulty:** Easy
**Topics:** behavioral, motivation, fit
**Position:** SWE
**Years:** T2-T3

**Question:** Why do you want to join Tencent specifically, and which BG/team?

**Approach:** Show specificity. Don't say "big company" or "stock." Pick: (1) a specific product (WeChat ecosystem, a game you love and want to work on), (2) a technical area Tencent is strong in (game tech, IM, cloud), (3) the BG culture (IEG for games, WXG for WeChat — quite different). Mentioning open-source contributions Tencent has made (TARS, ncnn for ML inference) shows you've done homework.

**Tags:** #behavioral

---

### 19. TCP deep dive: why does TCP throughput drop on a high-RTT link?

**Difficulty:** Hard
**Topics:** networking, tcp, performance
**Position:** Senior SWE
**Years:** T3-T4

**Question:** A service running cross-region (Shanghai → US-East, 200ms RTT) shows TCP throughput much lower than the available bandwidth. Why? How would you fix it?

**Approach:** Bandwidth-Delay Product (BDP): on a high-RTT link, throughput = window_size / RTT. Default TCP send/recv buffers may be too small — calculate: 1 Gbps × 0.2s = 200 Mbits = 25 MB BDP, but default Linux send buffer is ~4MB. Fixes: (1) increase `net.ipv4.tcp_rmem` / `tcp_wmem`, (2) enable TCP window scaling (RFC 7323 — usually on by default but check), (3) switch congestion control algorithm to BBR (better on high-BDP than CUBIC), (4) use parallel connections to multiply effective throughput, (5) for true bulk transfer, consider QUIC or UDP-based protocols. Mention measurement: `tc`, `ss -i`, `iperf3` to baseline. Tencent has built custom transport protocols precisely for this reason (e.g., for cross-region game traffic).

**Tags:** #domain-knowledge

---

### 20. Anti-cheat in a real-time multiplayer game

**Difficulty:** Hard
**Topics:** gaming, security, anti-cheat
**Position:** Senior SWE
**Years:** T3-T4

**Question:** A new PUBG Mobile cheating tool is widespread (aimbot + wallhack). Walk through how you'd architect anti-cheat to detect and respond.

**Approach:** Multi-layered: (1) **Server authority** — never trust client-reported damage/position; server runs hit detection. Wallhack requires the *client* to render data it shouldn't have — fix by not sending data about enemies the player can't see (visibility culling). Trade-off: more server CPU. (2) **Behavioral detection** — server-side ML on aim trajectories, headshot ratios, reaction times; flag outliers for review/shadowban. (3) **Client integrity** — anti-tampering (code obfuscation, native checksums, kernel-mode anti-cheat for PC). Detect known cheat signatures. (4) **Reporting + replay** — player reports trigger server-side replay review, sometimes by ML. (5) **Soft penalties** — shadowban (matchmake cheaters together) before hardban (gives cheat-makers less signal to iterate). Discuss false-positive cost (banning honest players is catastrophic for retention) and the perpetual cat-and-mouse nature.

**Tags:** #domain-knowledge

---

## Tips specific to Tencent

- **C++ is a real plus.** Many infra/game teams hire C++ first. Know C++11/14/17 idioms (move semantics, smart pointers, lambdas), the STL, and memory model basics.
- **Networking depth.** TCP internals, kernel networking, custom UDP protocols — common interview material for game/IM teams.
- **Know which BG you're applying to.** IEG (games), WXG (WeChat), CSIG (cloud + B2B), TEG (infra), PCG (content) — very different cultures and tech stacks.
- **Open source involvement helps.** Tencent-led: TARS (microservice framework), ncnn (mobile neural network inference), Hippy (cross-platform framework). Mention concretely.
- **Behavioral is lighter than US.** They probe cooperation and proactiveness. Don't over-rehearse STAR — feel natural.

## Resources

- Tencent Cloud documentation (esp. game and IM services)
- 牛客网 (NowCoder) Tencent interview thread
- "TCP/IP Illustrated" — Stevens (essential for networking-heavy rounds)
- Open-source: github.com/Tencent/TarsCpp, github.com/Tencent/ncnn, github.com/Tencent/Hippy
- "Game Engine Architecture" — Gregory (for game backend roles)
