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

**Python:**
```python
def is_alien_sorted(words: list[str], order: str) -> bool:
    rank: dict[str, int] = {c: i for i, c in enumerate(order)}
    for a, b in zip(words, words[1:]):
        for ca, cb in zip(a, b):
            if rank[ca] != rank[cb]:
                if rank[ca] > rank[cb]:
                    return False
                break
        else:
            if len(a) > len(b):
                return False
    return True
```

**TypeScript:**
```typescript
function isAlienSorted(words: string[], order: string): boolean {
  const rank = new Map<string, number>();
  for (let i = 0; i < order.length; i++) rank.set(order[i], i);
  const cmp = (a: string, b: string): boolean => {
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) {
      if (a[i] !== b[i]) return rank.get(a[i])! <= rank.get(b[i])!;
    }
    return a.length <= b.length;
  };
  for (let i = 1; i < words.length; i++) if (!cmp(words[i - 1], words[i])) return false;
  return true;
}
```

**Java:**
```java
boolean isAlienSorted(String[] words, String order) {
    int[] rank = new int[26];
    for (int i = 0; i < order.length(); i++) rank[order.charAt(i) - 'a'] = i;
    for (int i = 1; i < words.length; i++) {
        String a = words[i - 1], b = words[i];
        int n = Math.min(a.length(), b.length()), j = 0;
        while (j < n && a.charAt(j) == b.charAt(j)) j++;
        if (j == n) { if (a.length() > b.length()) return false; }
        else if (rank[a.charAt(j) - 'a'] > rank[b.charAt(j) - 'a']) return false;
    }
    return true;
}
```

**Key points:**
- Precompute char-to-rank once for O(1) comparisons.
- Prefix rule: shorter word must come first when one is a prefix of the other.
- O(total chars) time, O(alphabet) space.

**Follow-ups:**
- Build the alien alphabet itself from a list of sorted words (topological sort).
- Online lookups: words arrive in a stream and each must be classified.
- Multi-character "letters" (digraphs) — generalize the comparison loop.
- Case-insensitive or accented characters — discuss normalization.

**Common Pitfalls:**
- Missing the prefix rule: equal-prefix words must be ordered by length.
- Re-building the rank map inside the comparison loop instead of once up front.

**Tags:** #algorithm

---

### 2. Valid Palindrome II

**Difficulty:** Easy
**Topics:** strings, two-pointer, greedy
**Position:** SWE
**Years:** L3-L4

**Question:** Given a string `s`, return `true` if `s` can become a palindrome after deleting at most one character.

**Approach:** Two pointers from ends. When chars differ, try skipping either left or right and check if the remainder is a palindrome. O(n) time, O(1) space. Be careful: only one skip allowed, not one per side.

**Python:**
```python
def valid_palindrome(s: str) -> bool:
    def is_pal(l: int, r: int) -> bool:
        while l < r:
            if s[l] != s[r]:
                return False
            l += 1
            r -= 1
        return True
    l, r = 0, len(s) - 1
    while l < r:
        if s[l] != s[r]:
            return is_pal(l + 1, r) or is_pal(l, r - 1)
        l += 1
        r -= 1
    return True
```

**TypeScript:**
```typescript
function validPalindrome(s: string): boolean {
  const isPal = (l: number, r: number): boolean => {
    while (l < r) {
      if (s[l] !== s[r]) return false;
      l++; r--;
    }
    return true;
  };
  let l = 0, r = s.length - 1;
  while (l < r) {
    if (s[l] !== s[r]) return isPal(l + 1, r) || isPal(l, r - 1);
    l++; r--;
  }
  return true;
}
```

**Java:**
```java
boolean validPalindrome(String s) {
    int l = 0, r = s.length() - 1;
    while (l < r) {
        if (s.charAt(l) != s.charAt(r)) return isPal(s, l + 1, r) || isPal(s, l, r - 1);
        l++; r--;
    }
    return true;
}
private boolean isPal(String s, int l, int r) {
    while (l < r) {
        if (s.charAt(l) != s.charAt(r)) return false;
        l++; r--;
    }
    return true;
}
```

**Key points:**
- One skip budget total, exercised at first mismatch.
- O(n) time, O(1) space — palindrome check is single-pass.
- Edge case: empty/single-char string trivially valid.

**Follow-ups:**
- Allow up to k deletions instead of just 1.
- Return the actual palindrome string you produced after the deletion.
- Ignore case and punctuation — layer in Valid Palindrome I logic.
- Streaming characters — decide as the input arrives.

**Common Pitfalls:**
- Skipping once per side (two total) instead of one skip overall.
- Re-scanning the entire string after a skip instead of the remaining slice.

**Tags:** #algorithm

---

### 3. Subarray Sum Equals K

**Difficulty:** Medium
**Topics:** arrays, hashmap, prefix-sum
**Position:** SWE
**Years:** L3-L4

**Question:** Given an integer array `nums` and an integer `k`, return the total number of subarrays whose sum equals `k`.

**Approach:** Prefix sum + hashmap. For each index, the number of subarrays ending here with sum `k` equals the count of `prefix - k` seen before. Initialize map with `{0: 1}`. O(n) time, O(n) space. Negative numbers ruin sliding window — that's the trick.

**Python:**
```python
def subarray_sum(nums: list[int], k: int) -> int:
    counts: dict[int, int] = {0: 1}
    prefix = ans = 0
    for x in nums:
        prefix += x
        ans += counts.get(prefix - k, 0)
        counts[prefix] = counts.get(prefix, 0) + 1
    return ans
```

**TypeScript:**
```typescript
function subarraySum(nums: number[], k: number): number {
  const counts = new Map<number, number>([[0, 1]]);
  let prefix = 0, ans = 0;
  for (const x of nums) {
    prefix += x;
    ans += counts.get(prefix - k) ?? 0;
    counts.set(prefix, (counts.get(prefix) ?? 0) + 1);
  }
  return ans;
}
```

**Java:**
```java
int subarraySum(int[] nums, int k) {
    Map<Integer, Integer> counts = new HashMap<>();
    counts.put(0, 1);
    int prefix = 0, ans = 0;
    for (int x : nums) {
        prefix += x;
        ans += counts.getOrDefault(prefix - k, 0);
        counts.merge(prefix, 1, Integer::sum);
    }
    return ans;
}
```

**Key points:**
- Seed `{0: 1}` to count subarrays starting at index 0.
- Update count AFTER adding to answer to avoid double-counting.
- O(n) time, O(n) space; works with negatives unlike sliding window.

**Follow-ups:**
- Return one (or all) qualifying subarrays, not just the count.
- 2D version: count submatrices with sum equal to k.
- Streaming nums — but deletion becomes the hard part.
- Count subarrays whose sum is divisible by k (different transform).

**Common Pitfalls:**
- Forgetting the `{0: 1}` seed entry — misses subarrays starting at index 0.
- Updating prefix count before adding to ans — double-counts zero-sum subarrays.

**Tags:** #algorithm

---

### 4. Binary Tree Right Side View

**Difficulty:** Medium
**Topics:** tree, bfs, dfs
**Position:** SWE
**Years:** L3-L4

**Question:** Given a binary tree, return the values visible from the right side (top to bottom).

**Approach:** BFS level-by-level, take the last node at each level. Or DFS right-first, recording the first node seen at each depth. O(n) time. Edge case: nodes only on the left side still count if no right sibling exists at that level.

**Python:**
```python
from collections import deque

def right_side_view(root: TreeNode | None) -> list[int]:
    if not root:
        return []
    out: list[int] = []
    q: deque[TreeNode] = deque([root])
    while q:
        for i in range(len(q)):
            node = q.popleft()
            if i == len(q):  # last in level after popping
                out.append(node.val)
            if node.left: q.append(node.left)
            if node.right: q.append(node.right)
    return out
```

**TypeScript:**
```typescript
function rightSideView(root: TreeNode | null): number[] {
  if (!root) return [];
  const out: number[] = [];
  let q: TreeNode[] = [root];
  while (q.length) {
    const next: TreeNode[] = [];
    for (let i = 0; i < q.length; i++) {
      const n = q[i];
      if (i === q.length - 1) out.push(n.val);
      if (n.left) next.push(n.left);
      if (n.right) next.push(n.right);
    }
    q = next;
  }
  return out;
}
```

**Java:**
```java
List<Integer> rightSideView(TreeNode root) {
    List<Integer> out = new ArrayList<>();
    if (root == null) return out;
    Deque<TreeNode> q = new ArrayDeque<>();
    q.offer(root);
    while (!q.isEmpty()) {
        int size = q.size();
        for (int i = 0; i < size; i++) {
            TreeNode n = q.poll();
            if (i == size - 1) out.add(n.val);
            if (n.left != null) q.offer(n.left);
            if (n.right != null) q.offer(n.right);
        }
    }
    return out;
}
```

**Key points:**
- Last node visited per BFS level is the right-side view.
- DFS right-first also works: record first node at each depth.
- O(n) time, O(width) queue space.

**Follow-ups:**
- Left-side view — mirror direction, same approach.
- Top view / bottom view — needs column-indexed BFS with horizontal distance.
- Boundary view (left edge + leaves + right edge in order).
- Generalize to N-ary trees.

**Common Pitfalls:**
- Using `i == len(q)` after popping in Python; capture `size = len(q)` up front instead.
- DFS left-first then overwriting per depth — traversal order must be right-first.

**Tags:** #algorithm

---

### 5. K Closest Points to Origin

**Difficulty:** Medium
**Topics:** heap, quickselect, sorting
**Position:** SWE
**Years:** L3-L4

**Question:** Given an array of points in 2D, return the `k` closest to the origin (0,0).

**Approach:** Max-heap of size k by distance² — push each point, pop if size > k. O(n log k). For better average, use Quickselect (Hoare partition) on distance² for O(n) average / O(n²) worst. Skip the sqrt; squared distance preserves ordering.

**Python:**
```python
import heapq

def k_closest(points: list[list[int]], k: int) -> list[list[int]]:
    heap: list[tuple[int, list[int]]] = []
    for p in points:
        d = -(p[0] * p[0] + p[1] * p[1])  # negate for max-heap
        if len(heap) < k:
            heapq.heappush(heap, (d, p))
        elif d > heap[0][0]:
            heapq.heapreplace(heap, (d, p))
    return [p for _, p in heap]
```

**TypeScript:**
```typescript
function kClosest(points: number[][], k: number): number[][] {
  // sort-based O(n log n) — simple and fast in practice for moderate n
  return [...points]
    .sort((a, b) => a[0] * a[0] + a[1] * a[1] - (b[0] * b[0] + b[1] * b[1]))
    .slice(0, k);
}
```

**Java:**
```java
int[][] kClosest(int[][] points, int k) {
    PriorityQueue<int[]> heap = new PriorityQueue<>(
        (a, b) -> (b[0] * b[0] + b[1] * b[1]) - (a[0] * a[0] + a[1] * a[1]));
    for (int[] p : points) {
        heap.offer(p);
        if (heap.size() > k) heap.poll();
    }
    return heap.toArray(new int[0][]);
}
```

**Key points:**
- Compare squared distance to skip sqrt.
- Heap variant gives O(n log k); Quickselect averages O(n).
- Negate for max-heap when using Python's min-heap.

**Follow-ups:**
- Streaming points — maintain top-k online with a bounded heap.
- Distance metric changes (Manhattan, Chebyshev) — swap the comparator.
- 3D points or weighted points — generalize distance function.
- K farthest points instead of closest — invert the heap.

**Common Pitfalls:**
- Calling `sqrt` — slower with no effect on ordering.
- Using a min-heap and popping smallest, ending up with the k *farthest* points.

**Tags:** #algorithm

---

### 6. Random Pick with Weight

**Difficulty:** Medium
**Topics:** binary-search, prefix-sum, randomization
**Position:** SWE
**Years:** L3-L4

**Question:** Given an array `w` of positive integer weights, implement `pickIndex()` that returns index `i` with probability `w[i] / sum(w)`.

**Approach:** Precompute prefix sums. On `pickIndex`, pick a uniform random in `[1, total]`, binary search the prefix-sum array for the lower bound. O(n) construct, O(log n) pick. Edge: weight of 0 still possible; handle gracefully.

**Python:**
```python
import random
from bisect import bisect_left

class WeightedRandom:
    def __init__(self, w: list[int]) -> None:
        self.prefix: list[int] = []
        s = 0
        for x in w:
            s += x
            self.prefix.append(s)
        self.total = s

    def pick_index(self) -> int:
        target = random.randint(1, self.total)
        return bisect_left(self.prefix, target)
```

**TypeScript:**
```typescript
class WeightedRandom {
  private prefix: number[] = [];
  private total = 0;
  constructor(w: number[]) {
    let s = 0;
    for (const x of w) { s += x; this.prefix.push(s); }
    this.total = s;
  }
  pickIndex(): number {
    const target = Math.floor(Math.random() * this.total) + 1;
    let lo = 0, hi = this.prefix.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.prefix[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }
}
```

**Java:**
```java
class WeightedRandom {
    private final int[] prefix;
    private final int total;
    private final Random rng = new Random();
    WeightedRandom(int[] w) {
        prefix = new int[w.length];
        int s = 0;
        for (int i = 0; i < w.length; i++) { s += w[i]; prefix[i] = s; }
        total = s;
    }
    int pickIndex() {
        int target = rng.nextInt(total) + 1;
        int lo = 0, hi = prefix.length - 1;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (prefix[mid] < target) lo = mid + 1; else hi = mid;
        }
        return lo;
    }
}
```

**Key points:**
- Prefix sums let one uniform sample map to a weighted index.
- Use lower-bound search to land in the correct bucket.
- O(n) build, O(log n) per pick.

**Follow-ups:**
- Weights change at runtime — use a Fenwick tree for O(log n) updates instead of rebuilding.
- Floating-point weights — what precision issues arise?
- Sample k items without replacement.
- Billions of buckets — alias method for O(1) draws after O(n) build.

**Common Pitfalls:**
- `randint(0, total)` instead of `randint(1, total)` biases the first index.
- Upper-bound search instead of lower-bound — picks the wrong bucket on the boundary.

**Tags:** #algorithm

---

### 7. Merge Intervals

**Difficulty:** Medium
**Topics:** arrays, sorting, intervals
**Position:** SWE
**Years:** L3-L4

**Question:** Given a list of intervals, merge all overlapping intervals and return the result.

**Approach:** Sort by start. Iterate; if next.start <= current.end, extend current.end = max(current.end, next.end), else push current and start new. O(n log n). Variants: insert into already-sorted, count free time across employees.

**Python:**
```python
def merge_intervals(intervals: list[list[int]]) -> list[list[int]]:
    intervals.sort(key=lambda x: x[0])
    out: list[list[int]] = []
    for iv in intervals:
        if out and iv[0] <= out[-1][1]:
            out[-1][1] = max(out[-1][1], iv[1])
        else:
            out.append(iv[:])
    return out
```

**TypeScript:**
```typescript
function mergeIntervals(intervals: number[][]): number[][] {
  intervals.sort((a, b) => a[0] - b[0]);
  const out: number[][] = [];
  for (const iv of intervals) {
    if (out.length && iv[0] <= out[out.length - 1][1]) {
      out[out.length - 1][1] = Math.max(out[out.length - 1][1], iv[1]);
    } else {
      out.push([...iv]);
    }
  }
  return out;
}
```

**Java:**
```java
int[][] mergeIntervals(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
    List<int[]> out = new ArrayList<>();
    for (int[] iv : intervals) {
        if (!out.isEmpty() && iv[0] <= out.get(out.size() - 1)[1]) {
            out.get(out.size() - 1)[1] = Math.max(out.get(out.size() - 1)[1], iv[1]);
        } else {
            out.add(iv.clone());
        }
    }
    return out.toArray(new int[0][]);
}
```

**Key points:**
- Sorting by start makes overlap a single comparison.
- Extend end with max in case of nested intervals.
- O(n log n) time, O(n) output.

**Follow-ups:**
- Insert a single interval into an already-sorted list (Insert Interval).
- Compute common free time across multiple employee calendars.
- Streaming intervals — maintain the merged set online with a balanced BST.
- Intervals carry a payload — define merge semantics for the payload.

**Common Pitfalls:**
- Sorting by end instead of start — the overlap test no longer works.
- Reusing input interval references instead of cloning — mutates the caller's data.

**Tags:** #algorithm

---

### 8. Lowest Common Ancestor of a Binary Tree

**Difficulty:** Medium
**Topics:** tree, dfs, recursion
**Position:** SWE
**Years:** L3-L4

**Question:** Given a binary tree and two nodes `p` and `q`, find their lowest common ancestor. Nodes are not BST; parent pointers are not given.

**Approach:** Recursive DFS — return `p` or `q` if found, else recurse left/right. If both sides return non-null, current node is LCA. Otherwise return whichever side is non-null. O(n). Follow-ups: parent pointers given (two-pointer like cycle detection), `p` may not exist (return null), distance between `p` and `q`.

**Python:**
```python
def lowest_common_ancestor(root: TreeNode | None, p: TreeNode, q: TreeNode) -> TreeNode | None:
    if root is None or root is p or root is q:
        return root
    l = lowest_common_ancestor(root.left, p, q)
    r = lowest_common_ancestor(root.right, p, q)
    if l and r:
        return root
    return l or r
```

**TypeScript:**
```typescript
function lowestCommonAncestor(root: TreeNode | null, p: TreeNode, q: TreeNode): TreeNode | null {
  if (!root || root === p || root === q) return root;
  const l = lowestCommonAncestor(root.left, p, q);
  const r = lowestCommonAncestor(root.right, p, q);
  if (l && r) return root;
  return l ?? r;
}
```

**Java:**
```java
TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    if (root == null || root == p || root == q) return root;
    TreeNode l = lowestCommonAncestor(root.left, p, q);
    TreeNode r = lowestCommonAncestor(root.right, p, q);
    if (l != null && r != null) return root;
    return l != null ? l : r;
}
```

**Key points:**
- A node that equals p or q can be its own LCA.
- Both sides non-null means current node splits p and q.
- O(n) time, O(h) recursion stack.

**Follow-ups:**
- Parent pointers are available — use the two-pointer / cycle-detection trick.
- `p` may not exist in the tree — detect and return null.
- LCA of a set of k nodes, not just two.
- BST variant — use ordering to prune in O(h).

**Common Pitfalls:**
- Returning early on the first found side without checking the other.
- Confusing reference identity with value equality on TreeNode (`is` vs `==`).

**Tags:** #algorithm

---

### 9. Design News Feed

**Difficulty:** Hard
**Topics:** system-design, feed-ranking, fanout, caching
**Position:** Senior SWE
**Years:** L5

**Question:** Design Facebook's News Feed. Cover ranking, posting, and serving.

**Approach:** Two models: **push (fanout-on-write)** — when X posts, write to all X's followers' inboxes; great read latency, breaks for celebrities. **Pull (fanout-on-read)** — on feed load, pull recent posts from each followee, merge, rank; expensive for active users. **Hybrid** — push for normal users, pull for celebrities, merge at read. Ranking: candidate generation (recent + relevant) → ML ranker (engagement signals). Cache top-N per user in Redis with TTL. Discuss write amplification, cold cache, and ranking model freshness.

**Follow-ups:**
- Cold-start users with no follows — recommendation-driven feed.
- Real-time signals (just-now likes) influencing rank — where do they flow?
- Feed personalization on low-end devices and poor networks.
- Ad insertion budget per feed and pacing across sessions.
- "Why am I seeing this?" transparency — what gets logged at ranking time.

**Common Pitfalls:**
- Pure fanout-on-write — write amplification destroys storage cost for celebrity accounts.
- Caching ranked feeds for too long — misses fresh viral content and feels stale.

**Tags:** #system-design

---

### 10. Design Instagram

**Difficulty:** Hard
**Topics:** system-design, blob-storage, cdn, sharding, feed
**Position:** Senior SWE
**Years:** L5

**Question:** Design Instagram: photo upload, profile, feed, search by hashtag.

**Approach:** Photos → blob storage (S3-like) + CDN. Metadata sharded by user_id in a relational store. Feed: hybrid push/pull (same as News Feed). Hashtag search: inverted index from hashtag → recent post ids in a search-optimized store (Elasticsearch). Likes/comments: counters with write-back cache (eventual consistency OK). Discuss: image resizing pipeline (async on upload, generate thumbnails), CDN cache invalidation on deletion, and how to handle viral posts (CDN edge cache + read-only replica).

**Follow-ups:**
- Stories (24h expiry) — TTL-based store and ephemeral feed.
- Direct messages on the same infra — pivots toward a messaging design.
- Reels / video ingestion — transcoding pipeline + adaptive bitrate streaming.
- Profile privacy and shadow-banning — where do filters get applied?
- Compliance: copyright take-downs and global CDN invalidation.

**Common Pitfalls:**
- Storing image bytes and metadata in the same row — they grow at very different rates.
- Synchronous resize on upload — makes the write path slow and brittle.

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

### 21. Insert Interval

**Difficulty:** Medium
**Topics:** arrays, intervals, sorting
**Position:** SWE
**Years:** E3-E5

**Question:** Given a list of non-overlapping intervals sorted by start time and a new interval, insert the new interval and merge if necessary; return the resulting list.

**Approach:** Single pass: append all intervals ending before new.start, merge all intervals overlapping new (extend new.start/end), then append the rest. O(n) time, O(n) output. No sort needed — input is already sorted.

**Python:**
```python
def insert(intervals: list[list[int]], new: list[int]) -> list[list[int]]:
    out: list[list[int]] = []
    i, n = 0, len(intervals)
    while i < n and intervals[i][1] < new[0]:
        out.append(intervals[i]); i += 1
    while i < n and intervals[i][0] <= new[1]:
        new = [min(new[0], intervals[i][0]), max(new[1], intervals[i][1])]
        i += 1
    out.append(new)
    out.extend(intervals[i:])
    return out
```

**TypeScript:**
```typescript
function insertInterval(intervals: number[][], newIv: number[]): number[][] {
  const out: number[][] = [];
  let i = 0;
  const n = intervals.length;
  while (i < n && intervals[i][1] < newIv[0]) out.push(intervals[i++]);
  while (i < n && intervals[i][0] <= newIv[1]) {
    newIv = [Math.min(newIv[0], intervals[i][0]), Math.max(newIv[1], intervals[i][1])];
    i++;
  }
  out.push(newIv);
  while (i < n) out.push(intervals[i++]);
  return out;
}
```

**Java:**
```java
int[][] insertInterval(int[][] intervals, int[] newIv) {
    List<int[]> out = new ArrayList<>();
    int i = 0, n = intervals.length;
    while (i < n && intervals[i][1] < newIv[0]) out.add(intervals[i++]);
    while (i < n && intervals[i][0] <= newIv[1]) {
        newIv = new int[]{Math.min(newIv[0], intervals[i][0]), Math.max(newIv[1], intervals[i][1])};
        i++;
    }
    out.add(newIv);
    while (i < n) out.add(intervals[i++]);
    return out.toArray(new int[0][]);
}
```

**Key points:**
- Three phases: before, overlapping, after.
- Mutate `new` only during overlap to extend bounds.
- O(n) since input is already sorted.

**Tags:** #algorithm

---

### 22. Move Zeroes

**Difficulty:** Medium
**Topics:** arrays, two pointers
**Position:** SWE
**Years:** E3-E5

**Question:** Given an integer array `nums`, move all `0`s to the end while maintaining the relative order of non-zero elements. Do it in place.

**Approach:** Two pointers: `write` tracks next non-zero slot. Iterate `read`; when `nums[read] != 0`, swap with `nums[write++]`. O(n) time, O(1) space. Common warm-up; interviewer will push on minimizing writes.

**Python:**
```python
def move_zeroes(nums: list[int]) -> None:
    write = 0
    for read in range(len(nums)):
        if nums[read] != 0:
            nums[write], nums[read] = nums[read], nums[write]
            write += 1
```

**TypeScript:**
```typescript
function moveZeroes(nums: number[]): void {
  let write = 0;
  for (let read = 0; read < nums.length; read++) {
    if (nums[read] !== 0) {
      [nums[write], nums[read]] = [nums[read], nums[write]];
      write++;
    }
  }
}
```

**Java:**
```java
void moveZeroes(int[] nums) {
    int write = 0;
    for (int read = 0; read < nums.length; read++) {
        if (nums[read] != 0) {
            int tmp = nums[write];
            nums[write] = nums[read];
            nums[read] = tmp;
            write++;
        }
    }
}
```

**Key points:**
- Two pointers preserve relative order of non-zeros.
- Swap minimises writes vs. fill-then-zero.
- O(n) time, O(1) extra space.

**Tags:** #algorithm

---

### 23. Minimum Remove to Make Valid Parentheses

**Difficulty:** Medium
**Topics:** strings, stack, greedy
**Position:** SWE
**Years:** E3-E5

**Question:** Given a string of letters and parentheses, remove the minimum number of parentheses so that the result is valid. Return any valid result.

**Approach:** Pass 1: stack indices of unmatched `(`; if `)` encountered with empty stack, mark for removal. After scan, indices left on stack are unmatched `(`. Pass 2: build output skipping flagged indices. O(n) time/space.

**Python:**
```python
def min_remove_to_make_valid(s: str) -> str:
    chars = list(s)
    stack: list[int] = []
    for i, c in enumerate(chars):
        if c == "(":
            stack.append(i)
        elif c == ")":
            if stack:
                stack.pop()
            else:
                chars[i] = ""
    for i in stack:
        chars[i] = ""
    return "".join(chars)
```

**TypeScript:**
```typescript
function minRemoveToMakeValid(s: string): string {
  const chars = s.split("");
  const stack: number[] = [];
  for (let i = 0; i < chars.length; i++) {
    if (chars[i] === "(") stack.push(i);
    else if (chars[i] === ")") {
      if (stack.length) stack.pop();
      else chars[i] = "";
    }
  }
  for (const i of stack) chars[i] = "";
  return chars.join("");
}
```

**Java:**
```java
String minRemoveToMakeValid(String s) {
    StringBuilder sb = new StringBuilder(s);
    Deque<Integer> stack = new ArrayDeque<>();
    for (int i = 0; i < sb.length(); i++) {
        char c = sb.charAt(i);
        if (c == '(') stack.push(i);
        else if (c == ')') {
            if (!stack.isEmpty()) stack.pop();
            else sb.setCharAt(i, '*');
        }
    }
    while (!stack.isEmpty()) sb.setCharAt(stack.pop(), '*');
    return sb.toString().replace("*", "");
}
```

**Key points:**
- Stack tracks indices of unmatched opens.
- Empty out invalid positions before joining.
- O(n) time and space.

**Tags:** #algorithm

---

### 24. Binary Tree Vertical Order Traversal

**Difficulty:** Medium
**Topics:** tree, bfs, hashmap
**Position:** SWE
**Years:** E3-E5

**Question:** Given a binary tree, return the vertical order traversal of its node values. Order top-to-bottom, and within the same row, left-to-right.

**Approach:** BFS while tracking column index (root=0, left=col-1, right=col+1). Bucket nodes by column in a hashmap; track min/max column. Emit columns in [min..max] order. BFS (not DFS) preserves top-down/left-right tie-breaks naturally. O(n).

**Python:**
```python
from collections import defaultdict, deque

def vertical_order(root: TreeNode | None) -> list[list[int]]:
    if not root:
        return []
    cols: dict[int, list[int]] = defaultdict(list)
    q: deque[tuple[TreeNode, int]] = deque([(root, 0)])
    lo = hi = 0
    while q:
        node, c = q.popleft()
        cols[c].append(node.val)
        lo, hi = min(lo, c), max(hi, c)
        if node.left: q.append((node.left, c - 1))
        if node.right: q.append((node.right, c + 1))
    return [cols[c] for c in range(lo, hi + 1)]
```

**TypeScript:**
```typescript
function verticalOrder(root: TreeNode | null): number[][] {
  if (!root) return [];
  const cols = new Map<number, number[]>();
  const q: [TreeNode, number][] = [[root, 0]];
  let lo = 0, hi = 0;
  while (q.length) {
    const [node, c] = q.shift()!;
    if (!cols.has(c)) cols.set(c, []);
    cols.get(c)!.push(node.val);
    lo = Math.min(lo, c); hi = Math.max(hi, c);
    if (node.left) q.push([node.left, c - 1]);
    if (node.right) q.push([node.right, c + 1]);
  }
  const out: number[][] = [];
  for (let c = lo; c <= hi; c++) out.push(cols.get(c) ?? []);
  return out;
}
```

**Java:**
```java
List<List<Integer>> verticalOrder(TreeNode root) {
    List<List<Integer>> out = new ArrayList<>();
    if (root == null) return out;
    Map<Integer, List<Integer>> cols = new HashMap<>();
    Deque<int[]> q = new ArrayDeque<>();
    Deque<TreeNode> nq = new ArrayDeque<>();
    q.offer(new int[]{0}); nq.offer(root);
    int lo = 0, hi = 0;
    while (!q.isEmpty()) {
        int c = q.poll()[0];
        TreeNode n = nq.poll();
        cols.computeIfAbsent(c, k -> new ArrayList<>()).add(n.val);
        lo = Math.min(lo, c); hi = Math.max(hi, c);
        if (n.left != null) { q.offer(new int[]{c - 1}); nq.offer(n.left); }
        if (n.right != null) { q.offer(new int[]{c + 1}); nq.offer(n.right); }
    }
    for (int c = lo; c <= hi; c++) out.add(cols.getOrDefault(c, new ArrayList<>()));
    return out;
}
```

**Key points:**
- Column index: left = parent-1, right = parent+1.
- BFS preserves top-down then left-right tiebreaks for free.
- O(n) time and space.

**Tags:** #algorithm

---

### 25. Diameter of Binary Tree

**Difficulty:** Medium
**Topics:** tree, dfs, recursion
**Position:** SWE
**Years:** E3-E5

**Question:** Given a binary tree, return the length (in edges) of the longest path between any two nodes. The path may or may not pass through the root.

**Approach:** Post-order DFS returning height. At each node, candidate diameter = leftHeight + rightHeight; update global max. Return 1 + max(left, right) as the node's height. O(n) time, O(h) recursion stack.

**Python:**
```python
def diameter_of_binary_tree(root: TreeNode | None) -> int:
    best = 0
    def depth(node: TreeNode | None) -> int:
        nonlocal best
        if node is None:
            return 0
        l = depth(node.left)
        r = depth(node.right)
        best = max(best, l + r)
        return 1 + max(l, r)
    depth(root)
    return best
```

**TypeScript:**
```typescript
function diameterOfBinaryTree(root: TreeNode | null): number {
  let best = 0;
  const depth = (n: TreeNode | null): number => {
    if (!n) return 0;
    const l = depth(n.left);
    const r = depth(n.right);
    best = Math.max(best, l + r);
    return 1 + Math.max(l, r);
  };
  depth(root);
  return best;
}
```

**Java:**
```java
private int best = 0;
int diameterOfBinaryTree(TreeNode root) {
    best = 0;
    depth(root);
    return best;
}
private int depth(TreeNode n) {
    if (n == null) return 0;
    int l = depth(n.left), r = depth(n.right);
    best = Math.max(best, l + r);
    return 1 + Math.max(l, r);
}
```

**Key points:**
- Diameter counts edges, so sum the two child heights.
- Track global best while returning height upward.
- O(n) time, O(h) recursion stack.

**Tags:** #algorithm

---

### 26. Lowest Common Ancestor of a Binary Tree III

**Difficulty:** Medium
**Topics:** tree, two pointers, hashmap
**Position:** SWE
**Years:** E3-E5

**Question:** Given two nodes `p` and `q` in a binary tree where each node has a `parent` pointer (root is not given), return their lowest common ancestor.

**Approach:** Two-pointer like cycle-meet. Walk both p and q upward; when one hits null, restart it from the other's start. They meet at LCA after at most 2*(depth) steps. O(h) time, O(1) space. Alternative: hashset of ancestors of p, walk q up until hit.

**Python:**
```python
class PNode:
    val: int
    parent: "PNode | None"

def lowest_common_ancestor_iii(p: PNode, q: PNode) -> PNode:
    a: PNode | None = p
    b: PNode | None = q
    while a is not b:
        a = a.parent if a else q
        b = b.parent if b else p
    return a  # type: ignore[return-value]
```

**TypeScript:**
```typescript
interface PNode { val: number; parent: PNode | null; }

function lowestCommonAncestorIII(p: PNode, q: PNode): PNode {
  let a: PNode | null = p, b: PNode | null = q;
  while (a !== b) {
    a = a ? a.parent : q;
    b = b ? b.parent : p;
  }
  return a!;
}
```

**Java:**
```java
class PNode { int val; PNode parent; }

PNode lowestCommonAncestorIII(PNode p, PNode q) {
    PNode a = p, b = q;
    while (a != b) {
        a = a == null ? q : a.parent;
        b = b == null ? p : b.parent;
    }
    return a;
}
```

**Key points:**
- Switching pointers equalizes total path length.
- Both walk at most 2 * depth steps before meeting.
- O(h) time, O(1) space; no hashset needed.

**Tags:** #algorithm

---

### 27. Pow(x, n)

**Difficulty:** Medium
**Topics:** math, recursion, binary
**Position:** SWE
**Years:** E3-E5

**Question:** Implement `pow(x, n)` for `double x` and `int n` (n may be negative, very large).

**Approach:** Fast exponentiation by squaring. If n<0, x=1/x, n=-n (watch INT_MIN overflow — use long). Iterative: while n>0, if n&1 then result*=x; x*=x; n>>=1. O(log n) time, O(1) space.

**Python:**
```python
def my_pow(x: float, n: int) -> float:
    if n < 0:
        x, n = 1 / x, -n
    result = 1.0
    while n > 0:
        if n & 1:
            result *= x
        x *= x
        n >>= 1
    return result
```

**TypeScript:**
```typescript
function myPow(x: number, n: number): number {
  let N = n;
  if (N < 0) { x = 1 / x; N = -N; }
  let result = 1.0;
  while (N > 0) {
    if (N & 1) result *= x;
    x *= x;
    N = Math.floor(N / 2);
  }
  return result;
}
```

**Java:**
```java
double myPow(double x, int n) {
    long N = n;
    if (N < 0) { x = 1 / x; N = -N; }
    double result = 1.0;
    while (N > 0) {
        if ((N & 1) == 1) result *= x;
        x *= x;
        N >>= 1;
    }
    return result;
}
```

**Key points:**
- Square the base while halving the exponent.
- Handle negative exponent by inverting base.
- O(log |n|) time, O(1) space.

**Tags:** #algorithm

---

### 28. Range Sum of BST

**Difficulty:** Medium
**Topics:** tree, dfs, bst
**Position:** SWE
**Years:** E3-E5

**Question:** Given the root of a BST and integers `low` and `high`, return the sum of all node values with `low <= value <= high`.

**Approach:** DFS with pruning. If `node.val < low`, only recurse right. If `node.val > high`, only recurse left. Otherwise add value and recurse both. O(n) worst, O(log n) avg balanced. The pruning is what the interviewer scores.

**Python:**
```python
def range_sum_bst(root: TreeNode | None, low: int, high: int) -> int:
    if root is None:
        return 0
    if root.val < low:
        return range_sum_bst(root.right, low, high)
    if root.val > high:
        return range_sum_bst(root.left, low, high)
    return root.val + range_sum_bst(root.left, low, high) + range_sum_bst(root.right, low, high)
```

**TypeScript:**
```typescript
function rangeSumBST(root: TreeNode | null, low: number, high: number): number {
  if (!root) return 0;
  if (root.val < low) return rangeSumBST(root.right, low, high);
  if (root.val > high) return rangeSumBST(root.left, low, high);
  return root.val + rangeSumBST(root.left, low, high) + rangeSumBST(root.right, low, high);
}
```

**Java:**
```java
int rangeSumBST(TreeNode root, int low, int high) {
    if (root == null) return 0;
    if (root.val < low) return rangeSumBST(root.right, low, high);
    if (root.val > high) return rangeSumBST(root.left, low, high);
    return root.val + rangeSumBST(root.left, low, high) + rangeSumBST(root.right, low, high);
}
```

**Key points:**
- Prune subtrees that cannot contain in-range values.
- Average O(log n) on balanced BST; worst O(n).
- The pruning is the differentiator vs. naive traversal.

**Tags:** #algorithm

---

### 29. Convert Binary Search Tree to Sorted Doubly Linked List

**Difficulty:** Medium
**Topics:** tree, dfs, linked list
**Position:** SWE
**Years:** E3-E5

**Question:** Convert a BST in place into a sorted circular doubly linked list. The left pointer becomes prev, right pointer becomes next.

**Approach:** In-order DFS with a `prev` pointer (and a `head` for the smallest). On visit: if prev, link prev.right=node, node.left=prev; else head=node. prev=node. After traversal, close the circle: head.left=prev, prev.right=head. O(n) time, O(h) stack.

**Python:**
```python
def tree_to_doubly_list(root: TreeNode | None) -> TreeNode | None:
    if not root:
        return None
    head: TreeNode | None = None
    prev: TreeNode | None = None
    def inorder(node: TreeNode) -> None:
        nonlocal head, prev
        if node.left: inorder(node.left)
        if prev:
            prev.right = node
            node.left = prev
        else:
            head = node
        prev = node
        if node.right: inorder(node.right)
    inorder(root)
    head.left = prev  # type: ignore[union-attr]
    prev.right = head  # type: ignore[union-attr]
    return head
```

**TypeScript:**
```typescript
function treeToDoublyList(root: TreeNode | null): TreeNode | null {
  if (!root) return null;
  let head: TreeNode | null = null, prev: TreeNode | null = null;
  const inorder = (n: TreeNode): void => {
    if (n.left) inorder(n.left);
    if (prev) { prev.right = n; n.left = prev; } else { head = n; }
    prev = n;
    if (n.right) inorder(n.right);
  };
  inorder(root);
  head!.left = prev; prev!.right = head;
  return head;
}
```

**Java:**
```java
private TreeNode head, prev;
TreeNode treeToDoublyList(TreeNode root) {
    if (root == null) return null;
    head = null; prev = null;
    inorder(root);
    head.left = prev; prev.right = head;
    return head;
}
private void inorder(TreeNode n) {
    if (n == null) return;
    inorder(n.left);
    if (prev != null) { prev.right = n; n.left = prev; } else { head = n; }
    prev = n;
    inorder(n.right);
}
```

**Key points:**
- In-order on a BST visits values in ascending order.
- Wire prev <-> current as you traverse.
- Close the circle at the very end.

**Tags:** #algorithm

---

### 30. Buildings With an Ocean View

**Difficulty:** Medium
**Topics:** arrays, stack, monotonic
**Position:** SWE
**Years:** E3-E5

**Question:** Given heights of buildings in a row (ocean to the right), return indices of buildings that can see the ocean (no taller building to the right).

**Approach:** Right-to-left scan tracking max height seen so far. If current > max, it has a view; record index; update max. Reverse the indices at end. O(n) time, O(1) extra (besides output).

**Python:**
```python
def find_buildings(heights: list[int]) -> list[int]:
    out: list[int] = []
    max_h = 0
    for i in range(len(heights) - 1, -1, -1):
        if heights[i] > max_h:
            out.append(i)
            max_h = heights[i]
    out.reverse()
    return out
```

**TypeScript:**
```typescript
function findBuildings(heights: number[]): number[] {
  const out: number[] = [];
  let maxH = 0;
  for (let i = heights.length - 1; i >= 0; i--) {
    if (heights[i] > maxH) {
      out.push(i);
      maxH = heights[i];
    }
  }
  return out.reverse();
}
```

**Java:**
```java
int[] findBuildings(int[] heights) {
    List<Integer> out = new ArrayList<>();
    int maxH = 0;
    for (int i = heights.length - 1; i >= 0; i--) {
        if (heights[i] > maxH) {
            out.add(i);
            maxH = heights[i];
        }
    }
    Collections.reverse(out);
    return out.stream().mapToInt(Integer::intValue).toArray();
}
```

**Key points:**
- Scan right-to-left; only buildings taller than running max have a view.
- Reverse at the end to restore ascending indices.
- O(n) time, O(1) extra space besides output.

**Tags:** #algorithm

---

### 31. Continuous Subarray Sum

**Difficulty:** Medium
**Topics:** arrays, prefix sum, hashmap, math
**Position:** SWE
**Years:** E3-E5

**Question:** Given an integer array `nums` and integer `k`, return true if there is a contiguous subarray of length at least 2 whose sum is a multiple of `k`.

**Approach:** Prefix sum mod k stored in hashmap with earliest index. If same remainder repeats at index `j > i+1`, then sum(i+1..j) % k == 0. Init map with `{0: -1}` to handle prefix that itself is divisible. O(n).

**Python:**
```python
def check_subarray_sum(nums: list[int], k: int) -> bool:
    seen: dict[int, int] = {0: -1}
    prefix = 0
    for i, x in enumerate(nums):
        prefix = (prefix + x) % k
        if prefix in seen:
            if i - seen[prefix] >= 2:
                return True
        else:
            seen[prefix] = i
    return False
```

**TypeScript:**
```typescript
function checkSubarraySum(nums: number[], k: number): boolean {
  const seen = new Map<number, number>([[0, -1]]);
  let prefix = 0;
  for (let i = 0; i < nums.length; i++) {
    prefix = (prefix + nums[i]) % k;
    if (seen.has(prefix)) {
      if (i - seen.get(prefix)! >= 2) return true;
    } else {
      seen.set(prefix, i);
    }
  }
  return false;
}
```

**Java:**
```java
boolean checkSubarraySum(int[] nums, int k) {
    Map<Integer, Integer> seen = new HashMap<>();
    seen.put(0, -1);
    int prefix = 0;
    for (int i = 0; i < nums.length; i++) {
        prefix = (prefix + nums[i]) % k;
        if (seen.containsKey(prefix)) {
            if (i - seen.get(prefix) >= 2) return true;
        } else {
            seen.put(prefix, i);
        }
    }
    return false;
}
```

**Key points:**
- Equal remainders => sum of in-between is divisible by k.
- Store earliest index per remainder to maximize length.
- Seed `{0: -1}` so a length-≥2 prefix divisible by k counts.

**Tags:** #algorithm

---

### 32. Valid Word Abbreviation

**Difficulty:** Medium
**Topics:** strings, two pointers
**Position:** SWE
**Years:** E3-E5

**Question:** Given a word and an abbreviation (e.g. "internationalization" / "i12iz4n"), validate that the abbreviation correctly expands to the word.

**Approach:** Two pointers. When abbr has a digit, parse the full integer (reject leading zeros), advance word pointer by that count. Else chars must match. Final check: both pointers reach end. O(n).

**Python:**
```python
def valid_word_abbreviation(word: str, abbr: str) -> bool:
    i = j = 0
    while i < len(word) and j < len(abbr):
        if abbr[j].isdigit():
            if abbr[j] == "0":
                return False
            n = 0
            while j < len(abbr) and abbr[j].isdigit():
                n = n * 10 + int(abbr[j])
                j += 1
            i += n
        else:
            if word[i] != abbr[j]:
                return False
            i += 1
            j += 1
    return i == len(word) and j == len(abbr)
```

**TypeScript:**
```typescript
function validWordAbbreviation(word: string, abbr: string): boolean {
  let i = 0, j = 0;
  while (i < word.length && j < abbr.length) {
    const c = abbr[j];
    if (c >= "0" && c <= "9") {
      if (c === "0") return false;
      let n = 0;
      while (j < abbr.length && abbr[j] >= "0" && abbr[j] <= "9") {
        n = n * 10 + (abbr.charCodeAt(j) - 48);
        j++;
      }
      i += n;
    } else {
      if (word[i] !== abbr[j]) return false;
      i++; j++;
    }
  }
  return i === word.length && j === abbr.length;
}
```

**Java:**
```java
boolean validWordAbbreviation(String word, String abbr) {
    int i = 0, j = 0;
    while (i < word.length() && j < abbr.length()) {
        char c = abbr.charAt(j);
        if (Character.isDigit(c)) {
            if (c == '0') return false;
            int n = 0;
            while (j < abbr.length() && Character.isDigit(abbr.charAt(j))) {
                n = n * 10 + (abbr.charAt(j) - '0');
                j++;
            }
            i += n;
        } else {
            if (word.charAt(i) != c) return false;
            i++; j++;
        }
    }
    return i == word.length() && j == abbr.length();
}
```

**Key points:**
- Reject leading zeros in counts.
- Both pointers must reach end together.
- O(n) time, O(1) space.

**Tags:** #algorithm

---

### 33. Add Strings

**Difficulty:** Medium
**Topics:** strings, math, simulation
**Position:** SWE
**Years:** E3-E5

**Question:** Given two non-negative numbers as strings, return their sum as a string. Do not convert to integers directly.

**Approach:** Two pointers from the right. Add digit by digit with carry. Append `(d1+d2+carry)%10` and update carry. Continue while either pointer valid or carry. Reverse result. O(max(m,n)).

**Python:**
```python
def add_strings(num1: str, num2: str) -> str:
    i, j = len(num1) - 1, len(num2) - 1
    carry = 0
    out: list[str] = []
    while i >= 0 or j >= 0 or carry:
        a = int(num1[i]) if i >= 0 else 0
        b = int(num2[j]) if j >= 0 else 0
        s = a + b + carry
        out.append(str(s % 10))
        carry = s // 10
        i -= 1
        j -= 1
    return "".join(reversed(out))
```

**TypeScript:**
```typescript
function addStrings(num1: string, num2: string): string {
  let i = num1.length - 1, j = num2.length - 1, carry = 0;
  const out: string[] = [];
  while (i >= 0 || j >= 0 || carry) {
    const a = i >= 0 ? num1.charCodeAt(i) - 48 : 0;
    const b = j >= 0 ? num2.charCodeAt(j) - 48 : 0;
    const s = a + b + carry;
    out.push(String(s % 10));
    carry = Math.floor(s / 10);
    i--; j--;
  }
  return out.reverse().join("");
}
```

**Java:**
```java
String addStrings(String num1, String num2) {
    int i = num1.length() - 1, j = num2.length() - 1, carry = 0;
    StringBuilder sb = new StringBuilder();
    while (i >= 0 || j >= 0 || carry > 0) {
        int a = i >= 0 ? num1.charAt(i) - '0' : 0;
        int b = j >= 0 ? num2.charAt(j) - '0' : 0;
        int s = a + b + carry;
        sb.append(s % 10);
        carry = s / 10;
        i--; j--;
    }
    return sb.reverse().toString();
}
```

**Key points:**
- Loop includes carry to capture final digit.
- Treat missing digits as 0.
- O(max(m, n)) time, O(max(m, n)) output.

**Tags:** #algorithm

---

### 34. Find Peak Element

**Difficulty:** Medium
**Topics:** binary search, arrays
**Position:** SWE
**Years:** E3-E5

**Question:** Given an integer array `nums` with `nums[i] != nums[i+1]`, find any peak element (greater than its neighbors). Implicit `nums[-1] = nums[n] = -inf`. Solve in O(log n).

**Approach:** Binary search. Compare mid with mid+1; if `nums[mid] < nums[mid+1]`, a peak lies to the right (slope up), so `lo = mid + 1`; else `hi = mid`. Loop until lo==hi. O(log n).

**Python:**
```python
def find_peak_element(nums: list[int]) -> int:
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] < nums[mid + 1]:
            lo = mid + 1
        else:
            hi = mid
    return lo
```

**TypeScript:**
```typescript
function findPeakElement(nums: number[]): number {
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] < nums[mid + 1]) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
```

**Java:**
```java
int findPeakElement(int[] nums) {
    int lo = 0, hi = nums.length - 1;
    while (lo < hi) {
        int mid = (lo + hi) >>> 1;
        if (nums[mid] < nums[mid + 1]) lo = mid + 1;
        else hi = mid;
    }
    return lo;
}
```

**Key points:**
- Walk uphill; ascent guarantees a peak exists ahead.
- Implicit -inf at boundaries ensures a peak always exists.
- O(log n) time, O(1) space.

**Tags:** #algorithm

---

### 35. Kth Largest Element in an Array

**Difficulty:** Medium
**Topics:** arrays, heap, quickselect
**Position:** SWE
**Years:** E3-E5

**Question:** Return the kth largest element in an unsorted array (kth distinct rank is not required — duplicates count).

**Approach:** Min-heap of size k: push each element, pop when size>k, return top. O(n log k). Better: Quickselect on the (n-k)th smallest, average O(n), worst O(n²); randomize pivot to avoid worst case.

**Python:**
```python
import heapq

def find_kth_largest(nums: list[int], k: int) -> int:
    heap: list[int] = []
    for x in nums:
        if len(heap) < k:
            heapq.heappush(heap, x)
        elif x > heap[0]:
            heapq.heapreplace(heap, x)
    return heap[0]
```

**TypeScript:**
```typescript
function findKthLargest(nums: number[], k: number): number {
  // O(n log n) sort — simple and effective for moderate n
  return [...nums].sort((a, b) => b - a)[k - 1];
}
```

**Java:**
```java
int findKthLargest(int[] nums, int k) {
    PriorityQueue<Integer> heap = new PriorityQueue<>();
    for (int x : nums) {
        heap.offer(x);
        if (heap.size() > k) heap.poll();
    }
    return heap.peek();
}
```

**Key points:**
- Min-heap of size k keeps the k largest; root is the kth largest.
- Quickselect gives O(n) average with randomized pivot.
- Heap is O(n log k) and tolerates streaming input.

**Tags:** #algorithm

---

### 36. Group Shifted Strings

**Difficulty:** Medium
**Topics:** strings, hashmap
**Position:** SWE
**Years:** E3-E5

**Question:** Given a list of strings, group those that can be shifted (each char rotated cyclically by the same amount) into the same sequence. E.g. "abc","bcd","xyz" all in one group.

**Approach:** Normalize each string by subtracting first char from each, mod 26 (e.g. "abc" -> "0,1,2"). Use that normalized key in a hashmap of lists. O(total chars).

**Python:**
```python
def group_strings(strings: list[str]) -> list[list[str]]:
    groups: dict[tuple[int, ...], list[str]] = {}
    for s in strings:
        base = ord(s[0])
        key = tuple((ord(c) - base) % 26 for c in s)
        groups.setdefault(key, []).append(s)
    return list(groups.values())
```

**TypeScript:**
```typescript
function groupStrings(strings: string[]): string[][] {
  const groups = new Map<string, string[]>();
  for (const s of strings) {
    const base = s.charCodeAt(0);
    const key = Array.from(s, c => ((c.charCodeAt(0) - base) % 26 + 26) % 26).join(",");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }
  return Array.from(groups.values());
}
```

**Java:**
```java
List<List<String>> groupStrings(String[] strings) {
    Map<String, List<String>> groups = new HashMap<>();
    for (String s : strings) {
        int base = s.charAt(0);
        StringBuilder key = new StringBuilder();
        for (char c : s.toCharArray()) {
            key.append(((c - base) % 26 + 26) % 26).append(',');
        }
        groups.computeIfAbsent(key.toString(), k -> new ArrayList<>()).add(s);
    }
    return new ArrayList<>(groups.values());
}
```

**Key points:**
- Normalize by anchoring to the first char (mod 26).
- Tuple/string key enables hashmap grouping.
- O(total chars) time and space.

**Tags:** #algorithm

---

### 37. Clone Graph

**Difficulty:** Medium
**Topics:** graph, dfs, bfs, hashmap
**Position:** SWE
**Years:** E3-E5

**Question:** Given a reference to a node in a connected undirected graph, return a deep copy.

**Approach:** DFS/BFS with `old -> new` hashmap to dedupe. Visit a node: if seen return clone; else create clone, store in map, recurse to clone its neighbors. O(V+E).

**Python:**
```python
class GNode:
    def __init__(self, val: int = 0, neighbors: "list[GNode] | None" = None) -> None:
        self.val = val
        self.neighbors = neighbors or []

def clone_graph(node: GNode | None) -> GNode | None:
    if not node:
        return None
    seen: dict[GNode, GNode] = {}
    def dfs(n: GNode) -> GNode:
        if n in seen:
            return seen[n]
        copy = GNode(n.val)
        seen[n] = copy
        copy.neighbors = [dfs(nb) for nb in n.neighbors]
        return copy
    return dfs(node)
```

**TypeScript:**
```typescript
class GNode {
  val: number;
  neighbors: GNode[];
  constructor(val = 0, neighbors: GNode[] = []) { this.val = val; this.neighbors = neighbors; }
}

function cloneGraph(node: GNode | null): GNode | null {
  if (!node) return null;
  const seen = new Map<GNode, GNode>();
  const dfs = (n: GNode): GNode => {
    if (seen.has(n)) return seen.get(n)!;
    const copy = new GNode(n.val);
    seen.set(n, copy);
    copy.neighbors = n.neighbors.map(dfs);
    return copy;
  };
  return dfs(node);
}
```

**Java:**
```java
class GNode { int val; List<GNode> neighbors = new ArrayList<>(); GNode(int v) { val = v; } }

GNode cloneGraph(GNode node) {
    if (node == null) return null;
    Map<GNode, GNode> seen = new HashMap<>();
    return dfs(node, seen);
}
private GNode dfs(GNode n, Map<GNode, GNode> seen) {
    if (seen.containsKey(n)) return seen.get(n);
    GNode copy = new GNode(n.val);
    seen.put(n, copy);
    for (GNode nb : n.neighbors) copy.neighbors.add(dfs(nb, seen));
    return copy;
}
```

**Key points:**
- Map original to clone before recursing to avoid cycles.
- Works for both directed and undirected graphs.
- O(V + E) time and space.

**Tags:** #algorithm

---

### 38. Number of Islands

**Difficulty:** Medium
**Topics:** graph, dfs, bfs, union find
**Position:** SWE
**Years:** E3-E5

**Question:** Given a 2D grid of '1' (land) and '0' (water), count the number of islands (4-directional connectivity).

**Approach:** Scan grid; on each unvisited '1', DFS/BFS marking all connected land as visited; increment counter. O(m*n). Variants: islands with diagonal connectivity, count after streaming '1's (union-find).

**Python:**
```python
def num_islands(grid: list[list[str]]) -> int:
    if not grid:
        return 0
    m, n = len(grid), len(grid[0])
    def dfs(r: int, c: int) -> None:
        if r < 0 or r >= m or c < 0 or c >= n or grid[r][c] != "1":
            return
        grid[r][c] = "0"
        dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1)
    count = 0
    for r in range(m):
        for c in range(n):
            if grid[r][c] == "1":
                count += 1
                dfs(r, c)
    return count
```

**TypeScript:**
```typescript
function numIslands(grid: string[][]): number {
  const m = grid.length, n = m ? grid[0].length : 0;
  const dfs = (r: number, c: number): void => {
    if (r < 0 || r >= m || c < 0 || c >= n || grid[r][c] !== "1") return;
    grid[r][c] = "0";
    dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1);
  };
  let count = 0;
  for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) {
    if (grid[r][c] === "1") { count++; dfs(r, c); }
  }
  return count;
}
```

**Java:**
```java
int numIslands(char[][] grid) {
    int m = grid.length, n = m == 0 ? 0 : grid[0].length, count = 0;
    for (int r = 0; r < m; r++) for (int c = 0; c < n; c++) {
        if (grid[r][c] == '1') { count++; dfs(grid, r, c, m, n); }
    }
    return count;
}
private void dfs(char[][] g, int r, int c, int m, int n) {
    if (r < 0 || r >= m || c < 0 || c >= n || g[r][c] != '1') return;
    g[r][c] = '0';
    dfs(g, r + 1, c, m, n); dfs(g, r - 1, c, m, n);
    dfs(g, r, c + 1, m, n); dfs(g, r, c - 1, m, n);
}
```

**Key points:**
- Sink each visited land to avoid revisits.
- BFS is preferable when stack depth is a concern.
- O(m * n) time and space.

**Tags:** #algorithm

---

### 39. Word Break

**Difficulty:** Medium
**Topics:** dp, strings, trie
**Position:** SWE
**Years:** E3-E5

**Question:** Given a string `s` and a dictionary of words, determine if `s` can be segmented into a space-separated sequence of dictionary words.

**Approach:** DP: `dp[i]` = can split s[0..i]. `dp[i] = any(dp[j] and s[j..i] in dict)` for j<i. Convert dict to hashset for O(1) lookup. O(n²) time (or O(n*maxWordLen) by capping j). Trie variant cuts constants.

**Python:**
```python
def word_break(s: str, word_dict: list[str]) -> bool:
    words = set(word_dict)
    max_len = max((len(w) for w in words), default=0)
    n = len(s)
    dp = [False] * (n + 1)
    dp[0] = True
    for i in range(1, n + 1):
        for j in range(max(0, i - max_len), i):
            if dp[j] and s[j:i] in words:
                dp[i] = True
                break
    return dp[n]
```

**TypeScript:**
```typescript
function wordBreak(s: string, wordDict: string[]): boolean {
  const words = new Set(wordDict);
  const maxLen = wordDict.reduce((m, w) => Math.max(m, w.length), 0);
  const n = s.length;
  const dp = new Array(n + 1).fill(false);
  dp[0] = true;
  for (let i = 1; i <= n; i++) {
    for (let j = Math.max(0, i - maxLen); j < i; j++) {
      if (dp[j] && words.has(s.slice(j, i))) {
        dp[i] = true;
        break;
      }
    }
  }
  return dp[n];
}
```

**Java:**
```java
boolean wordBreak(String s, List<String> wordDict) {
    Set<String> words = new HashSet<>(wordDict);
    int maxLen = words.stream().mapToInt(String::length).max().orElse(0);
    int n = s.length();
    boolean[] dp = new boolean[n + 1];
    dp[0] = true;
    for (int i = 1; i <= n; i++) {
        for (int j = Math.max(0, i - maxLen); j < i; j++) {
            if (dp[j] && words.contains(s.substring(j, i))) {
                dp[i] = true;
                break;
            }
        }
    }
    return dp[n];
}
```

**Key points:**
- dp[i] depends on a prior split point j with s[j..i] in dict.
- Cap j range by max word length to reduce work.
- O(n * maxLen) time, O(n) space.

**Tags:** #algorithm

---

### 40. Longest Substring Without Repeating Characters

**Difficulty:** Medium
**Topics:** strings, sliding window, hashmap
**Position:** SWE
**Years:** E3-E5

**Question:** Given a string `s`, find the length of the longest substring without repeating characters.

**Approach:** Sliding window with hashmap of `char -> latest index`. Move right pointer; if char seen and its index >= left, jump left to old_index + 1. Update max. O(n) time, O(min(n, alphabet)) space.

**Python:**
```python
def length_of_longest_substring(s: str) -> int:
    last: dict[str, int] = {}
    l = best = 0
    for r, c in enumerate(s):
        if c in last and last[c] >= l:
            l = last[c] + 1
        last[c] = r
        best = max(best, r - l + 1)
    return best
```

**TypeScript:**
```typescript
function lengthOfLongestSubstring(s: string): number {
  const last = new Map<string, number>();
  let l = 0, best = 0;
  for (let r = 0; r < s.length; r++) {
    const c = s[r];
    if (last.has(c) && last.get(c)! >= l) l = last.get(c)! + 1;
    last.set(c, r);
    best = Math.max(best, r - l + 1);
  }
  return best;
}
```

**Java:**
```java
int lengthOfLongestSubstring(String s) {
    Map<Character, Integer> last = new HashMap<>();
    int l = 0, best = 0;
    for (int r = 0; r < s.length(); r++) {
        char c = s.charAt(r);
        if (last.containsKey(c) && last.get(c) >= l) l = last.get(c) + 1;
        last.put(c, r);
        best = Math.max(best, r - l + 1);
    }
    return best;
}
```

**Key points:**
- Only jump `l` forward, never backward.
- Map stores the most recent index of each char.
- O(n) time, O(min(n, alphabet)) space.

**Tags:** #algorithm

---

### 41. Read N Characters Given Read4 II - Call Multiple Times

**Difficulty:** Hard
**Topics:** strings, buffer, design
**Position:** SWE
**Years:** E3-E5

**Question:** Given the API `read4(buf4)` that reads up to 4 chars into buf4, implement `read(buf, n)` that may be called multiple times.

**Approach:** Maintain a class-level internal buf4 with `bufPtr` and `bufCnt`. On each `read`, first drain leftover from previous call, then keep calling read4 until n satisfied or read4 returns 0. Tricky: the leftover state across calls is the trap.

**Python:**
```python
from typing import Callable

class Reader:
    def __init__(self, read4: Callable[[list[str]], int]) -> None:
        self.read4 = read4
        self.buf4: list[str] = [""] * 4
        self.ptr = 0
        self.cnt = 0

    def read(self, buf: list[str], n: int) -> int:
        i = 0
        while i < n:
            if self.ptr == self.cnt:
                self.cnt = self.read4(self.buf4)
                self.ptr = 0
                if self.cnt == 0:
                    break
            buf.append(self.buf4[self.ptr])
            self.ptr += 1
            i += 1
        return i
```

**TypeScript:**
```typescript
class Reader {
  private buf4: string[] = new Array(4).fill("");
  private ptr = 0;
  private cnt = 0;
  constructor(private read4: (buf4: string[]) => number) {}
  read(buf: string[], n: number): number {
    let i = 0;
    while (i < n) {
      if (this.ptr === this.cnt) {
        this.cnt = this.read4(this.buf4);
        this.ptr = 0;
        if (this.cnt === 0) break;
      }
      buf.push(this.buf4[this.ptr++]);
      i++;
    }
    return i;
  }
}
```

**Java:**
```java
class Reader {
    private final char[] buf4 = new char[4];
    private int ptr = 0, cnt = 0;
    int read(char[] buf, int n) {
        int i = 0;
        while (i < n) {
            if (ptr == cnt) {
                cnt = read4(buf4);
                ptr = 0;
                if (cnt == 0) break;
            }
            buf[i++] = buf4[ptr++];
        }
        return i;
    }
    private int read4(char[] b) { return 0; } // provided externally
}
```

**Key points:**
- Keep buf4 + ptr + cnt as instance state to preserve leftovers.
- Refill via read4 only when buffer is drained.
- Break when read4 returns 0 (EOF).

**Complexity:** O(n) per `read(buf, n)` call; O(1) extra state (the 4-char buffer plus two indices) is carried across calls.

**Tags:** #algorithm

---

### 42. Trapping Rain Water

**Difficulty:** Hard
**Topics:** arrays, two pointers, stack, dp
**Position:** SWE
**Years:** E3-E5

**Question:** Given `n` non-negative integers representing elevation heights of bars of width 1, compute how much water it can trap after raining.

**Approach:** Two pointers. Maintain leftMax, rightMax. Move pointer with smaller height inward; water at that bar = max(0, sideMax - height). O(n) time, O(1) space. Alternative: monotonic decreasing stack of indices, sum trapped on each pop.

**Python:**
```python
def trap(height: list[int]) -> int:
    l, r = 0, len(height) - 1
    lmax = rmax = total = 0
    while l < r:
        if height[l] < height[r]:
            lmax = max(lmax, height[l])
            total += lmax - height[l]
            l += 1
        else:
            rmax = max(rmax, height[r])
            total += rmax - height[r]
            r -= 1
    return total
```

**TypeScript:**
```typescript
function trap(height: number[]): number {
  let l = 0, r = height.length - 1, lmax = 0, rmax = 0, total = 0;
  while (l < r) {
    if (height[l] < height[r]) {
      lmax = Math.max(lmax, height[l]);
      total += lmax - height[l];
      l++;
    } else {
      rmax = Math.max(rmax, height[r]);
      total += rmax - height[r];
      r--;
    }
  }
  return total;
}
```

**Java:**
```java
int trap(int[] height) {
    int l = 0, r = height.length - 1, lmax = 0, rmax = 0, total = 0;
    while (l < r) {
        if (height[l] < height[r]) {
            lmax = Math.max(lmax, height[l]);
            total += lmax - height[l];
            l++;
        } else {
            rmax = Math.max(rmax, height[r]);
            total += rmax - height[r];
            r--;
        }
    }
    return total;
}
```

**Key points:**
- Lower side's max bounds the water on that bar.
- Move inward from the shorter side.
- O(n) time, O(1) space.

**Tags:** #algorithm

---

### 43. Word Ladder

**Difficulty:** Hard
**Topics:** graph, bfs, strings
**Position:** SWE
**Years:** E3-E5

**Question:** Given `beginWord`, `endWord`, and a dictionary, return the length of the shortest transformation sequence where each step changes one letter and the intermediate word must be in the dictionary.

**Approach:** BFS where neighbors are dict words differing by 1 char. Use wildcard buckets (e.g. "h*t" -> ["hot","hat"]) precomputed for O(L) neighbor lookup instead of O(N*L) pairwise. Bidirectional BFS halves search depth. O(N*L²).

**Python:**
```python
from collections import defaultdict, deque

def ladder_length(begin_word: str, end_word: str, word_list: list[str]) -> int:
    words = set(word_list)
    if end_word not in words:
        return 0
    buckets: dict[str, list[str]] = defaultdict(list)
    for w in words:
        for i in range(len(w)):
            buckets[w[:i] + "*" + w[i + 1:]].append(w)
    q: deque[tuple[str, int]] = deque([(begin_word, 1)])
    seen = {begin_word}
    while q:
        w, d = q.popleft()
        if w == end_word:
            return d
        for i in range(len(w)):
            for nb in buckets[w[:i] + "*" + w[i + 1:]]:
                if nb not in seen:
                    seen.add(nb)
                    q.append((nb, d + 1))
    return 0
```

**TypeScript:**
```typescript
function ladderLength(beginWord: string, endWord: string, wordList: string[]): number {
  const words = new Set(wordList);
  if (!words.has(endWord)) return 0;
  const buckets = new Map<string, string[]>();
  for (const w of words) {
    for (let i = 0; i < w.length; i++) {
      const key = w.slice(0, i) + "*" + w.slice(i + 1);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(w);
    }
  }
  const q: [string, number][] = [[beginWord, 1]];
  const seen = new Set([beginWord]);
  while (q.length) {
    const [w, d] = q.shift()!;
    if (w === endWord) return d;
    for (let i = 0; i < w.length; i++) {
      const key = w.slice(0, i) + "*" + w.slice(i + 1);
      for (const nb of buckets.get(key) ?? []) {
        if (!seen.has(nb)) { seen.add(nb); q.push([nb, d + 1]); }
      }
    }
  }
  return 0;
}
```

**Java:**
```java
int ladderLength(String beginWord, String endWord, List<String> wordList) {
    Set<String> words = new HashSet<>(wordList);
    if (!words.contains(endWord)) return 0;
    Map<String, List<String>> buckets = new HashMap<>();
    for (String w : words) {
        for (int i = 0; i < w.length(); i++) {
            String key = w.substring(0, i) + "*" + w.substring(i + 1);
            buckets.computeIfAbsent(key, k -> new ArrayList<>()).add(w);
        }
    }
    Deque<String> q = new ArrayDeque<>();
    Map<String, Integer> dist = new HashMap<>();
    q.offer(beginWord); dist.put(beginWord, 1);
    while (!q.isEmpty()) {
        String w = q.poll();
        if (w.equals(endWord)) return dist.get(w);
        for (int i = 0; i < w.length(); i++) {
            String key = w.substring(0, i) + "*" + w.substring(i + 1);
            for (String nb : buckets.getOrDefault(key, List.of())) {
                if (!dist.containsKey(nb)) { dist.put(nb, dist.get(w) + 1); q.offer(nb); }
            }
        }
    }
    return 0;
}
```

**Key points:**
- Wildcard buckets give O(L) neighbor enumeration.
- BFS first reaches endWord with the shortest path.
- O(N * L^2) time, O(N * L) space.

**Tags:** #algorithm

---

### 44. Word Search II

**Difficulty:** Hard
**Topics:** trie, backtracking, dfs
**Position:** SWE
**Years:** E3-E5

**Question:** Given a 2D board of characters and a list of words, find all words that appear on the board (adjacent cells horizontally/vertically, no reuse within a single word).

**Approach:** Build a trie of all words. DFS each cell, walking trie in parallel — prune branches not present in trie. Mark visited via in-place sentinel and restore on backtrack. Remove found words from trie to avoid duplicates and accelerate. O(M*N*4^L).

**Python:**
```python
def find_words(board: list[list[str]], words: list[str]) -> list[str]:
    trie: dict = {}
    for w in words:
        node = trie
        for c in w:
            node = node.setdefault(c, {})
        node["$"] = w
    m, n = len(board), len(board[0])
    found: list[str] = []
    def dfs(r: int, c: int, node: dict) -> None:
        ch = board[r][c]
        nxt = node.get(ch)
        if not nxt:
            return
        if "$" in nxt:
            found.append(nxt.pop("$"))
        board[r][c] = "#"
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < m and 0 <= nc < n and board[nr][nc] != "#":
                dfs(nr, nc, nxt)
        board[r][c] = ch
    for r in range(m):
        for c in range(n):
            dfs(r, c, trie)
    return found
```

**TypeScript:**
```typescript
function findWords(board: string[][], words: string[]): string[] {
  type Node = { [k: string]: Node | string };
  const trie: Node = {};
  for (const w of words) {
    let node = trie;
    for (const c of w) {
      if (!node[c]) node[c] = {};
      node = node[c] as Node;
    }
    node["$"] = w;
  }
  const m = board.length, n = board[0].length;
  const found: string[] = [];
  const dfs = (r: number, c: number, node: Node): void => {
    const ch = board[r][c];
    const nxt = node[ch] as Node | undefined;
    if (!nxt) return;
    if (typeof nxt["$"] === "string") { found.push(nxt["$"] as string); delete nxt["$"]; }
    board[r][c] = "#";
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < m && nc >= 0 && nc < n && board[nr][nc] !== "#") dfs(nr, nc, nxt);
    }
    board[r][c] = ch;
  };
  for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) dfs(r, c, trie);
  return found;
}
```

**Java:**
```java
static class TrieNode { Map<Character, TrieNode> kids = new HashMap<>(); String word; }

List<String> findWords(char[][] board, String[] words) {
    TrieNode root = new TrieNode();
    for (String w : words) {
        TrieNode node = root;
        for (char c : w.toCharArray()) node = node.kids.computeIfAbsent(c, k -> new TrieNode());
        node.word = w;
    }
    List<String> found = new ArrayList<>();
    int m = board.length, n = board[0].length;
    for (int r = 0; r < m; r++) for (int c = 0; c < n; c++) dfs(board, r, c, root, found);
    return found;
}
private void dfs(char[][] b, int r, int c, TrieNode node, List<String> found) {
    char ch = b[r][c];
    TrieNode nxt = node.kids.get(ch);
    if (nxt == null) return;
    if (nxt.word != null) { found.add(nxt.word); nxt.word = null; }
    b[r][c] = '#';
    int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
    for (int[] d : dirs) {
        int nr = r + d[0], nc = c + d[1];
        if (nr >= 0 && nr < b.length && nc >= 0 && nc < b[0].length && b[nr][nc] != '#') dfs(b, nr, nc, nxt, found);
    }
    b[r][c] = ch;
}
```

**Key points:**
- Trie lets one DFS find all words at once.
- In-place sentinel marks visited cells; restore on backtrack.
- Remove found terminals to dedupe and prune.

**Tags:** #algorithm

---

### 45. Median of Two Sorted Arrays

**Difficulty:** Hard
**Topics:** binary search, arrays
**Position:** SWE
**Years:** E3-E5

**Question:** Given two sorted arrays of sizes m and n, find their median in O(log(min(m,n))).

**Approach:** Binary search on the smaller array's partition point. Partition both arrays so left halves total (m+n+1)/2 elements; ensure maxLeftA <= minRightB and maxLeftB <= minRightA. Median from boundary values. Tricky edge cases: empty side -> use ±inf sentinels.

**Python:**
```python
def find_median_sorted_arrays(a: list[int], b: list[int]) -> float:
    if len(a) > len(b):
        a, b = b, a
    m, n = len(a), len(b)
    half = (m + n + 1) // 2
    lo, hi = 0, m
    while lo <= hi:
        i = (lo + hi) // 2
        j = half - i
        a_l = a[i - 1] if i else float("-inf")
        a_r = a[i] if i < m else float("inf")
        b_l = b[j - 1] if j else float("-inf")
        b_r = b[j] if j < n else float("inf")
        if a_l <= b_r and b_l <= a_r:
            if (m + n) % 2:
                return float(max(a_l, b_l))
            return (max(a_l, b_l) + min(a_r, b_r)) / 2
        if a_l > b_r:
            hi = i - 1
        else:
            lo = i + 1
    return 0.0
```

**TypeScript:**
```typescript
function findMedianSortedArrays(a: number[], b: number[]): number {
  if (a.length > b.length) [a, b] = [b, a];
  const m = a.length, n = b.length, half = (m + n + 1) >> 1;
  let lo = 0, hi = m;
  while (lo <= hi) {
    const i = (lo + hi) >> 1, j = half - i;
    const aL = i ? a[i - 1] : -Infinity;
    const aR = i < m ? a[i] : Infinity;
    const bL = j ? b[j - 1] : -Infinity;
    const bR = j < n ? b[j] : Infinity;
    if (aL <= bR && bL <= aR) {
      if ((m + n) % 2) return Math.max(aL, bL);
      return (Math.max(aL, bL) + Math.min(aR, bR)) / 2;
    }
    if (aL > bR) hi = i - 1; else lo = i + 1;
  }
  return 0;
}
```

**Java:**
```java
double findMedianSortedArrays(int[] a, int[] b) {
    if (a.length > b.length) { int[] t = a; a = b; b = t; }
    int m = a.length, n = b.length, half = (m + n + 1) / 2;
    int lo = 0, hi = m;
    while (lo <= hi) {
        int i = (lo + hi) >>> 1, j = half - i;
        int aL = i == 0 ? Integer.MIN_VALUE : a[i - 1];
        int aR = i == m ? Integer.MAX_VALUE : a[i];
        int bL = j == 0 ? Integer.MIN_VALUE : b[j - 1];
        int bR = j == n ? Integer.MAX_VALUE : b[j];
        if (aL <= bR && bL <= aR) {
            if (((m + n) & 1) == 1) return Math.max(aL, bL);
            return (Math.max(aL, bL) + Math.min(aR, bR)) / 2.0;
        }
        if (aL > bR) hi = i - 1; else lo = i + 1;
    }
    return 0.0;
}
```

**Key points:**
- Binary search on the smaller array keeps O(log(min(m, n))).
- Use ±inf sentinels for empty partitions.
- Partition so left side has (m+n+1)/2 elements.

**Tags:** #algorithm

---

### 46. Regular Expression Matching

**Difficulty:** Hard
**Topics:** dp, strings, recursion
**Position:** SWE
**Years:** E3-E5

**Question:** Implement regex matching with `.` (any single char) and `*` (zero or more of preceding element) covering the entire input string.

**Approach:** DP: `dp[i][j]` = s[0..i] matches p[0..j]. If `p[j-1]=='*'`: dp[i][j] = dp[i][j-2] (zero use) or (match(s[i-1], p[j-2]) and dp[i-1][j]). Else: match(s[i-1], p[j-1]) and dp[i-1][j-1]. O(m*n).

**Python:**
```python
def is_match(s: str, p: str) -> bool:
    m, n = len(s), len(p)
    dp = [[False] * (n + 1) for _ in range(m + 1)]
    dp[0][0] = True
    for j in range(1, n + 1):
        if p[j - 1] == "*":
            dp[0][j] = dp[0][j - 2]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if p[j - 1] == "*":
                dp[i][j] = dp[i][j - 2]
                if p[j - 2] in (s[i - 1], "."):
                    dp[i][j] = dp[i][j] or dp[i - 1][j]
            else:
                if p[j - 1] in (s[i - 1], "."):
                    dp[i][j] = dp[i - 1][j - 1]
    return dp[m][n]
```

**TypeScript:**
```typescript
function isMatch(s: string, p: string): boolean {
  const m = s.length, n = p.length;
  const dp: boolean[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(false));
  dp[0][0] = true;
  for (let j = 1; j <= n; j++) if (p[j - 1] === "*") dp[0][j] = dp[0][j - 2];
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (p[j - 1] === "*") {
        dp[i][j] = dp[i][j - 2];
        if (p[j - 2] === s[i - 1] || p[j - 2] === ".") dp[i][j] = dp[i][j] || dp[i - 1][j];
      } else if (p[j - 1] === s[i - 1] || p[j - 1] === ".") {
        dp[i][j] = dp[i - 1][j - 1];
      }
    }
  }
  return dp[m][n];
}
```

**Java:**
```java
boolean isMatch(String s, String p) {
    int m = s.length(), n = p.length();
    boolean[][] dp = new boolean[m + 1][n + 1];
    dp[0][0] = true;
    for (int j = 1; j <= n; j++) if (p.charAt(j - 1) == '*') dp[0][j] = dp[0][j - 2];
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            char pc = p.charAt(j - 1), sc = s.charAt(i - 1);
            if (pc == '*') {
                dp[i][j] = dp[i][j - 2];
                char prev = p.charAt(j - 2);
                if (prev == sc || prev == '.') dp[i][j] = dp[i][j] || dp[i - 1][j];
            } else if (pc == sc || pc == '.') {
                dp[i][j] = dp[i - 1][j - 1];
            }
        }
    }
    return dp[m][n];
}
```

**Key points:**
- `*` covers zero (j-2) or one-more (i-1 with match).
- Seed dp[0][j] for patterns like "a*b*" matching empty.
- O(m * n) time and space.

**Tags:** #algorithm

---

### 47. Minimum Window Substring

**Difficulty:** Hard
**Topics:** strings, sliding window, hashmap
**Position:** SWE
**Years:** E3-E5

**Question:** Given strings `s` and `t`, return the smallest substring of `s` that contains every char of `t` (including duplicates).

**Approach:** Sliding window. Count required chars from t. Expand right; track `formed` = number of distinct chars meeting their required count. When formed == required, shrink left while still valid, updating answer. O(|s| + |t|).

**Python:**
```python
def min_window(s: str, t: str) -> str:
    if not t or len(s) < len(t):
        return ""
    need: dict[str, int] = {}
    for c in t:
        need[c] = need.get(c, 0) + 1
    have: dict[str, int] = {}
    required = len(need)
    formed = l = 0
    best = (-1, 0, 0)
    for r, c in enumerate(s):
        have[c] = have.get(c, 0) + 1
        if c in need and have[c] == need[c]:
            formed += 1
        while formed == required:
            if best[0] == -1 or r - l + 1 < best[0]:
                best = (r - l + 1, l, r)
            have[s[l]] -= 1
            if s[l] in need and have[s[l]] < need[s[l]]:
                formed -= 1
            l += 1
    return "" if best[0] == -1 else s[best[1]:best[2] + 1]
```

**TypeScript:**
```typescript
function minWindow(s: string, t: string): string {
  if (!t || s.length < t.length) return "";
  const need = new Map<string, number>();
  for (const c of t) need.set(c, (need.get(c) ?? 0) + 1);
  const have = new Map<string, number>();
  const required = need.size;
  let formed = 0, l = 0;
  let best: [number, number, number] = [-1, 0, 0];
  for (let r = 0; r < s.length; r++) {
    const c = s[r];
    have.set(c, (have.get(c) ?? 0) + 1);
    if (need.has(c) && have.get(c) === need.get(c)) formed++;
    while (formed === required) {
      if (best[0] === -1 || r - l + 1 < best[0]) best = [r - l + 1, l, r];
      const lc = s[l];
      have.set(lc, have.get(lc)! - 1);
      if (need.has(lc) && have.get(lc)! < need.get(lc)!) formed--;
      l++;
    }
  }
  return best[0] === -1 ? "" : s.slice(best[1], best[2] + 1);
}
```

**Java:**
```java
String minWindow(String s, String t) {
    if (t.isEmpty() || s.length() < t.length()) return "";
    Map<Character, Integer> need = new HashMap<>();
    for (char c : t.toCharArray()) need.merge(c, 1, Integer::sum);
    Map<Character, Integer> have = new HashMap<>();
    int required = need.size(), formed = 0, l = 0;
    int[] best = {-1, 0, 0};
    for (int r = 0; r < s.length(); r++) {
        char c = s.charAt(r);
        have.merge(c, 1, Integer::sum);
        if (need.containsKey(c) && have.get(c).equals(need.get(c))) formed++;
        while (formed == required) {
            if (best[0] == -1 || r - l + 1 < best[0]) best = new int[]{r - l + 1, l, r};
            char lc = s.charAt(l);
            have.merge(lc, -1, Integer::sum);
            if (need.containsKey(lc) && have.get(lc) < need.get(lc)) formed--;
            l++;
        }
    }
    return best[0] == -1 ? "" : s.substring(best[1], best[2] + 1);
}
```

**Key points:**
- `formed` counts distinct chars whose counts are satisfied.
- Shrink the window whenever still valid to find smaller answer.
- O(|s| + |t|) time, O(alphabet) space.

**Tags:** #algorithm

---

### 48. Merge K Sorted Lists

**Difficulty:** Hard
**Topics:** linked list, heap, divide and conquer
**Position:** SWE
**Years:** E3-E5

**Question:** Merge `k` sorted linked lists into one sorted linked list and return it.

**Approach:** Min-heap of size k holding the front of each list; pop smallest, push its next. O(N log k). Alternative: pairwise merge halving lists each round — also O(N log k), no heap needed.

**Python:**
```python
import heapq

class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val = val
        self.next = next

def merge_k_lists(lists: list[ListNode | None]) -> ListNode | None:
    heap: list[tuple[int, int, ListNode]] = []
    for i, node in enumerate(lists):
        if node:
            heapq.heappush(heap, (node.val, i, node))
    dummy = ListNode()
    tail = dummy
    while heap:
        _, i, node = heapq.heappop(heap)
        tail.next = node
        tail = node
        if node.next:
            heapq.heappush(heap, (node.next.val, i, node.next))
    return dummy.next
```

**TypeScript:**
```typescript
class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) { this.val = val; this.next = next; }
}

function mergeKLists(lists: Array<ListNode | null>): ListNode | null {
  if (lists.length === 0) return null;
  let step = 1;
  const merge2 = (a: ListNode | null, b: ListNode | null): ListNode | null => {
    const dummy = new ListNode();
    let tail = dummy;
    while (a && b) {
      if (a.val <= b.val) { tail.next = a; a = a.next; }
      else { tail.next = b; b = b.next; }
      tail = tail.next!;
    }
    tail.next = a ?? b;
    return dummy.next;
  };
  while (step < lists.length) {
    for (let i = 0; i + step < lists.length; i += step * 2) {
      lists[i] = merge2(lists[i], lists[i + step]);
    }
    step *= 2;
  }
  return lists[0];
}
```

**Java:**
```java
ListNode mergeKLists(ListNode[] lists) {
    PriorityQueue<ListNode> heap = new PriorityQueue<>((a, b) -> a.val - b.val);
    for (ListNode n : lists) if (n != null) heap.offer(n);
    ListNode dummy = new ListNode(), tail = dummy;
    while (!heap.isEmpty()) {
        ListNode n = heap.poll();
        tail.next = n;
        tail = n;
        if (n.next != null) heap.offer(n.next);
    }
    return dummy.next;
}
```

**Key points:**
- Index tiebreaker in heap tuple avoids comparing nodes.
- Pairwise merge avoids heap entirely with same O(N log k) cost.
- O(N log k) time, O(k) space.

**Tags:** #algorithm

---

### 49. Serialize and Deserialize Binary Tree

**Difficulty:** Hard
**Topics:** tree, dfs, bfs, design
**Position:** SWE
**Years:** E3-E5

**Question:** Design `serialize(root)` and `deserialize(data)` for a binary tree.

**Approach:** Pre-order DFS with `null` markers. Serialize: "1,2,#,#,3,4,#,#,5,#,#". Deserialize: queue of tokens; recursive helper reads next token, returns null on '#', else creates node and recurses left/right. O(n) both directions.

**Python:**
```python
from collections import deque

def serialize(root: TreeNode | None) -> str:
    parts: list[str] = []
    def go(node: TreeNode | None) -> None:
        if node is None:
            parts.append("#")
            return
        parts.append(str(node.val))
        go(node.left)
        go(node.right)
    go(root)
    return ",".join(parts)

def deserialize(data: str) -> TreeNode | None:
    tokens = deque(data.split(","))
    def build() -> TreeNode | None:
        t = tokens.popleft()
        if t == "#":
            return None
        node = TreeNode(int(t))
        node.left = build()
        node.right = build()
        return node
    return build()
```

**TypeScript:**
```typescript
function serialize(root: TreeNode | null): string {
  const parts: string[] = [];
  const go = (n: TreeNode | null): void => {
    if (!n) { parts.push("#"); return; }
    parts.push(String(n.val));
    go(n.left); go(n.right);
  };
  go(root);
  return parts.join(",");
}

function deserialize(data: string): TreeNode | null {
  const tokens = data.split(",");
  let i = 0;
  const build = (): TreeNode | null => {
    const t = tokens[i++];
    if (t === "#") return null;
    const node = new TreeNode(Number(t));
    node.left = build();
    node.right = build();
    return node;
  };
  return build();
}
```

**Java:**
```java
String serialize(TreeNode root) {
    StringBuilder sb = new StringBuilder();
    ser(root, sb);
    return sb.toString();
}
private void ser(TreeNode n, StringBuilder sb) {
    if (n == null) { sb.append("#,"); return; }
    sb.append(n.val).append(',');
    ser(n.left, sb); ser(n.right, sb);
}
TreeNode deserialize(String data) {
    return build(new ArrayDeque<>(Arrays.asList(data.split(","))));
}
private TreeNode build(Deque<String> tokens) {
    String t = tokens.poll();
    if (t == null || t.equals("#")) return null;
    TreeNode n = new TreeNode(Integer.parseInt(t));
    n.left = build(tokens);
    n.right = build(tokens);
    return n;
}
```

**Key points:**
- Preorder with null markers uniquely encodes a binary tree.
- Recursive deserialize reads tokens in the same order.
- O(n) time and space both ways.

**Tags:** #algorithm

---

### 50. Binary Tree Maximum Path Sum

**Difficulty:** Hard
**Topics:** tree, dfs, recursion
**Position:** SWE
**Years:** E3-E5

**Question:** Given a non-empty binary tree, find the maximum path sum where a path is any sequence of nodes connected by parent-child edges (need not pass through root).

**Approach:** Post-order DFS returning "best downward path through this node" = node.val + max(0, max(leftGain, rightGain)). Update global max with node.val + max(0, leftGain) + max(0, rightGain). Clip negatives to 0. O(n).

**Python:**
```python
def max_path_sum(root: TreeNode | None) -> int:
    best = float("-inf")
    def gain(node: TreeNode | None) -> int:
        nonlocal best
        if node is None:
            return 0
        l = max(gain(node.left), 0)
        r = max(gain(node.right), 0)
        best = max(best, node.val + l + r)
        return node.val + max(l, r)
    gain(root)
    return int(best)
```

**TypeScript:**
```typescript
function maxPathSum(root: TreeNode | null): number {
  let best = -Infinity;
  const gain = (n: TreeNode | null): number => {
    if (!n) return 0;
    const l = Math.max(gain(n.left), 0);
    const r = Math.max(gain(n.right), 0);
    best = Math.max(best, n.val + l + r);
    return n.val + Math.max(l, r);
  };
  gain(root);
  return best;
}
```

**Java:**
```java
private int bestSum;
int maxPathSum(TreeNode root) {
    bestSum = Integer.MIN_VALUE;
    gain(root);
    return bestSum;
}
private int gain(TreeNode n) {
    if (n == null) return 0;
    int l = Math.max(gain(n.left), 0);
    int r = Math.max(gain(n.right), 0);
    bestSum = Math.max(bestSum, n.val + l + r);
    return n.val + Math.max(l, r);
}
```

**Key points:**
- Clip negative child gains to 0 — drop those branches.
- Returned value is one-sided path; bend allowed only at the global update.
- O(n) time, O(h) stack.

**Tags:** #algorithm

---

### 51. Alien Dictionary

**Difficulty:** Hard
**Topics:** graph, topological sort, bfs
**Position:** SWE
**Years:** E3-E5

**Question:** Given a sorted list of words from an alien language, derive a valid ordering of its alphabet, or return "" if impossible.

**Approach:** Build DAG: for each adjacent pair of words, find first differing char to add edge. Topological sort (Kahn's BFS or DFS with cycle detection). Return "" on cycle or invalid prefix ("abc" before "ab"). O(total chars + V + E).

**Python:**
```python
from collections import defaultdict, deque

def alien_order(words: list[str]) -> str:
    graph: dict[str, set[str]] = defaultdict(set)
    indeg: dict[str, int] = {c: 0 for w in words for c in w}
    for a, b in zip(words, words[1:]):
        for ca, cb in zip(a, b):
            if ca != cb:
                if cb not in graph[ca]:
                    graph[ca].add(cb)
                    indeg[cb] += 1
                break
        else:
            if len(a) > len(b):
                return ""
    q: deque[str] = deque(c for c, d in indeg.items() if d == 0)
    out: list[str] = []
    while q:
        c = q.popleft()
        out.append(c)
        for nb in graph[c]:
            indeg[nb] -= 1
            if indeg[nb] == 0:
                q.append(nb)
    return "".join(out) if len(out) == len(indeg) else ""
```

**TypeScript:**
```typescript
function alienOrder(words: string[]): string {
  const graph = new Map<string, Set<string>>();
  const indeg = new Map<string, number>();
  for (const w of words) for (const c of w) {
    if (!graph.has(c)) graph.set(c, new Set());
    if (!indeg.has(c)) indeg.set(c, 0);
  }
  for (let i = 1; i < words.length; i++) {
    const a = words[i - 1], b = words[i];
    let differ = false;
    for (let j = 0; j < Math.min(a.length, b.length); j++) {
      if (a[j] !== b[j]) {
        if (!graph.get(a[j])!.has(b[j])) {
          graph.get(a[j])!.add(b[j]);
          indeg.set(b[j], indeg.get(b[j])! + 1);
        }
        differ = true;
        break;
      }
    }
    if (!differ && a.length > b.length) return "";
  }
  const q: string[] = [];
  for (const [c, d] of indeg) if (d === 0) q.push(c);
  const out: string[] = [];
  while (q.length) {
    const c = q.shift()!;
    out.push(c);
    for (const nb of graph.get(c)!) {
      indeg.set(nb, indeg.get(nb)! - 1);
      if (indeg.get(nb) === 0) q.push(nb);
    }
  }
  return out.length === indeg.size ? out.join("") : "";
}
```

**Java:**
```java
String alienOrder(String[] words) {
    Map<Character, Set<Character>> graph = new HashMap<>();
    Map<Character, Integer> indeg = new HashMap<>();
    for (String w : words) for (char c : w.toCharArray()) {
        graph.putIfAbsent(c, new HashSet<>());
        indeg.putIfAbsent(c, 0);
    }
    for (int i = 1; i < words.length; i++) {
        String a = words[i - 1], b = words[i];
        boolean differ = false;
        for (int j = 0; j < Math.min(a.length(), b.length()); j++) {
            if (a.charAt(j) != b.charAt(j)) {
                if (graph.get(a.charAt(j)).add(b.charAt(j))) indeg.merge(b.charAt(j), 1, Integer::sum);
                differ = true;
                break;
            }
        }
        if (!differ && a.length() > b.length()) return "";
    }
    Deque<Character> q = new ArrayDeque<>();
    for (var e : indeg.entrySet()) if (e.getValue() == 0) q.offer(e.getKey());
    StringBuilder out = new StringBuilder();
    while (!q.isEmpty()) {
        char c = q.poll();
        out.append(c);
        for (char nb : graph.get(c)) if (indeg.merge(nb, -1, Integer::sum) == 0) q.offer(nb);
    }
    return out.length() == indeg.size() ? out.toString() : "";
}
```

**Key points:**
- Edges come from the first differing character of adjacent words.
- Invalid prefix ("abc" before "ab") returns "".
- Cycle detection: topological sort short by missing nodes.

**Tags:** #algorithm

---

### 52. Find First and Last Position of Element in Sorted Array

**Difficulty:** Medium
**Topics:** binary search, arrays
**Position:** SWE
**Years:** E3-E5

**Question:** Given a sorted array of integers and a target, find the first and last index of the target. Return [-1, -1] if missing. O(log n).

**Approach:** Two binary searches: leftmost (when nums[mid] >= target, hi=mid) and rightmost (when nums[mid] <= target, lo=mid+1, then return lo-1). Validate hits target. O(log n).

**Python:**
```python
from bisect import bisect_left, bisect_right

def search_range(nums: list[int], target: int) -> list[int]:
    l = bisect_left(nums, target)
    if l == len(nums) or nums[l] != target:
        return [-1, -1]
    r = bisect_right(nums, target) - 1
    return [l, r]
```

**TypeScript:**
```typescript
function searchRange(nums: number[], target: number): number[] {
  const lower = (t: number): number => {
    let lo = 0, hi = nums.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (nums[mid] < t) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
  const l = lower(target);
  if (l === nums.length || nums[l] !== target) return [-1, -1];
  return [l, lower(target + 1) - 1];
}
```

**Java:**
```java
int[] searchRange(int[] nums, int target) {
    int l = lower(nums, target);
    if (l == nums.length || nums[l] != target) return new int[]{-1, -1};
    return new int[]{l, lower(nums, target + 1) - 1};
}
private int lower(int[] nums, int t) {
    int lo = 0, hi = nums.length;
    while (lo < hi) {
        int mid = (lo + hi) >>> 1;
        if (nums[mid] < t) lo = mid + 1; else hi = mid;
    }
    return lo;
}
```

**Key points:**
- One leftmost search + a sister `lower(target+1)` gives both bounds.
- Validate the left index actually hits target.
- O(log n) time, O(1) space.

**Tags:** #algorithm

---

### 53. Next Permutation

**Difficulty:** Medium
**Topics:** arrays, two pointers
**Position:** SWE
**Years:** E3-E5

**Question:** Rearrange numbers into the lexicographically next greater permutation in place. If none, sort ascending.

**Approach:** Find largest i with `nums[i] < nums[i+1]` (rightmost ascending pair). If none, reverse all. Else find largest j>i with `nums[j] > nums[i]`, swap, then reverse suffix after i. O(n) time, O(1) space.

**Python:**
```python
def next_permutation(nums: list[int]) -> None:
    n = len(nums)
    i = n - 2
    while i >= 0 and nums[i] >= nums[i + 1]:
        i -= 1
    if i >= 0:
        j = n - 1
        while nums[j] <= nums[i]:
            j -= 1
        nums[i], nums[j] = nums[j], nums[i]
    nums[i + 1:] = reversed(nums[i + 1:])
```

**TypeScript:**
```typescript
function nextPermutation(nums: number[]): void {
  const n = nums.length;
  let i = n - 2;
  while (i >= 0 && nums[i] >= nums[i + 1]) i--;
  if (i >= 0) {
    let j = n - 1;
    while (nums[j] <= nums[i]) j--;
    [nums[i], nums[j] ] = [nums[j], nums[i]];
  }
  for (let l = i + 1, r = n - 1; l < r; l++, r--) {
    [nums[l], nums[r]] = [nums[r], nums[l]];
  }
}
```

**Java:**
```java
void nextPermutation(int[] nums) {
    int n = nums.length, i = n - 2;
    while (i >= 0 && nums[i] >= nums[i + 1]) i--;
    if (i >= 0) {
        int j = n - 1;
        while (nums[j] <= nums[i]) j--;
        int t = nums[i]; nums[i] = nums[j]; nums[j] = t;
    }
    for (int l = i + 1, r = n - 1; l < r; l++, r--) {
        int t = nums[l]; nums[l] = nums[r]; nums[r] = t;
    }
}
```

**Key points:**
- Find the rightmost ascending pivot, swap with next larger, reverse suffix.
- Reverses fully when array is in descending order (last permutation).
- O(n) time, O(1) space.

**Tags:** #algorithm

---

### 54. Longest Increasing Subsequence

**Difficulty:** Medium
**Topics:** dp, binary search
**Position:** SWE
**Years:** E3-E5

**Question:** Given an integer array, return the length of the longest strictly increasing subsequence.

**Approach:** Patience sorting variant. Maintain `tails[]` where tails[i] = smallest tail of any increasing subsequence of length i+1. For each x, binary search the leftmost tail >= x; replace it (or append). Length of tails is answer. O(n log n).

**Python:**
```python
from bisect import bisect_left

def length_of_lis(nums: list[int]) -> int:
    tails: list[int] = []
    for x in nums:
        i = bisect_left(tails, x)
        if i == len(tails):
            tails.append(x)
        else:
            tails[i] = x
    return len(tails)
```

**TypeScript:**
```typescript
function lengthOfLIS(nums: number[]): number {
  const tails: number[] = [];
  for (const x of nums) {
    let lo = 0, hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid] < x) lo = mid + 1;
      else hi = mid;
    }
    if (lo === tails.length) tails.push(x);
    else tails[lo] = x;
  }
  return tails.length;
}
```

**Java:**
```java
int lengthOfLIS(int[] nums) {
    int[] tails = new int[nums.length];
    int size = 0;
    for (int x : nums) {
        int lo = 0, hi = size;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (tails[mid] < x) lo = mid + 1; else hi = mid;
        }
        tails[lo] = x;
        if (lo == size) size++;
    }
    return size;
}
```

**Key points:**
- `tails` is not a valid LIS, but its length is.
- Replace first tail >= x to keep options minimal.
- O(n log n) time, O(n) space.

**Tags:** #algorithm

---

### 55. Course Schedule II

**Difficulty:** Medium
**Topics:** graph, topological sort, bfs, dfs
**Position:** SWE
**Years:** E3-E5

**Question:** There are `n` courses with prerequisites as pairs `[a, b]` (b before a). Return a valid ordering, or empty array if impossible.

**Approach:** Kahn's algorithm: compute in-degrees, push all zero-degree to queue. Pop, append to order, decrement neighbors; push any new zero-degree. If output length < n, there's a cycle → return []. O(V+E).

**Python:**
```python
from collections import defaultdict, deque

def find_order(num_courses: int, prerequisites: list[list[int]]) -> list[int]:
    graph: dict[int, list[int]] = defaultdict(list)
    indeg = [0] * num_courses
    for a, b in prerequisites:
        graph[b].append(a)
        indeg[a] += 1
    q: deque[int] = deque(i for i in range(num_courses) if indeg[i] == 0)
    order: list[int] = []
    while q:
        c = q.popleft()
        order.append(c)
        for nb in graph[c]:
            indeg[nb] -= 1
            if indeg[nb] == 0:
                q.append(nb)
    return order if len(order) == num_courses else []
```

**TypeScript:**
```typescript
function findOrder(numCourses: number, prerequisites: number[][]): number[] {
  const graph: number[][] = Array.from({ length: numCourses }, () => []);
  const indeg = new Array(numCourses).fill(0);
  for (const [a, b] of prerequisites) {
    graph[b].push(a);
    indeg[a]++;
  }
  const q: number[] = [];
  for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) q.push(i);
  const order: number[] = [];
  while (q.length) {
    const c = q.shift()!;
    order.push(c);
    for (const nb of graph[c]) {
      if (--indeg[nb] === 0) q.push(nb);
    }
  }
  return order.length === numCourses ? order : [];
}
```

**Java:**
```java
int[] findOrder(int numCourses, int[][] prerequisites) {
    List<List<Integer>> graph = new ArrayList<>();
    for (int i = 0; i < numCourses; i++) graph.add(new ArrayList<>());
    int[] indeg = new int[numCourses];
    for (int[] p : prerequisites) { graph.get(p[1]).add(p[0]); indeg[p[0]]++; }
    Deque<Integer> q = new ArrayDeque<>();
    for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) q.offer(i);
    int[] order = new int[numCourses];
    int idx = 0;
    while (!q.isEmpty()) {
        int c = q.poll();
        order[idx++] = c;
        for (int nb : graph.get(c)) if (--indeg[nb] == 0) q.offer(nb);
    }
    return idx == numCourses ? order : new int[0];
}
```

**Key points:**
- Kahn's BFS produces a topological order if no cycle exists.
- Short output length signals a cycle.
- O(V + E) time and space.

**Tags:** #algorithm

---

### 56. Accounts Merge

**Difficulty:** Medium
**Topics:** union find, graph, dfs
**Position:** SWE
**Years:** E3-E5

**Question:** Given accounts where each is `[name, email1, email2, ...]`, merge accounts sharing any email. Return merged accounts with sorted emails.

**Approach:** Union-Find on emails. Map email -> account index. Union all emails of the same account; also union by shared email across accounts. Group emails by root, sort each group, attach name. O(N * α(N) * sort).

**Python:**
```python
from collections import defaultdict

def accounts_merge(accounts: list[list[str]]) -> list[list[str]]:
    parent: dict[str, str] = {}
    owner: dict[str, str] = {}
    def find(x: str) -> str:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    for acc in accounts:
        name = acc[0]
        for email in acc[1:]:
            parent.setdefault(email, email)
            owner[email] = name
            parent[find(email)] = find(acc[1])
    groups: dict[str, list[str]] = defaultdict(list)
    for email in parent:
        groups[find(email)].append(email)
    return [[owner[root]] + sorted(emails) for root, emails in groups.items()]
```

**TypeScript:**
```typescript
function accountsMerge(accounts: string[][]): string[][] {
  const parent = new Map<string, string>();
  const owner = new Map<string, string>();
  const find = (x: string): string => {
    while (parent.get(x) !== x) {
      parent.set(x, parent.get(parent.get(x)!)!);
      x = parent.get(x)!;
    }
    return x;
  };
  for (const acc of accounts) {
    const name = acc[0];
    for (let i = 1; i < acc.length; i++) {
      const e = acc[i];
      if (!parent.has(e)) parent.set(e, e);
      owner.set(e, name);
      parent.set(find(e), find(acc[1]));
    }
  }
  const groups = new Map<string, string[]>();
  for (const e of parent.keys()) {
    const r = find(e);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r)!.push(e);
  }
  const out: string[][] = [];
  for (const [r, emails] of groups) out.push([owner.get(r)!, ...emails.sort()]);
  return out;
}
```

**Java:**
```java
private Map<String, String> parent;
List<List<String>> accountsMerge(List<List<String>> accounts) {
    parent = new HashMap<>();
    Map<String, String> owner = new HashMap<>();
    for (List<String> acc : accounts) {
        String name = acc.get(0);
        for (int i = 1; i < acc.size(); i++) {
            String e = acc.get(i);
            parent.putIfAbsent(e, e);
            owner.put(e, name);
            parent.put(find(e), find(acc.get(1)));
        }
    }
    Map<String, List<String>> groups = new HashMap<>();
    for (String e : parent.keySet()) groups.computeIfAbsent(find(e), k -> new ArrayList<>()).add(e);
    List<List<String>> out = new ArrayList<>();
    for (var e : groups.entrySet()) {
        Collections.sort(e.getValue());
        List<String> row = new ArrayList<>();
        row.add(owner.get(e.getKey()));
        row.addAll(e.getValue());
        out.add(row);
    }
    return out;
}
private String find(String x) {
    while (!parent.get(x).equals(x)) { parent.put(x, parent.get(parent.get(x))); x = parent.get(x); }
    return x;
}
```

**Key points:**
- Union all emails of a single account together.
- Path compression keeps find amortized near O(1).
- Sorting per group satisfies output format.

**Tags:** #algorithm

---

### 57. Maximum Swap

**Difficulty:** Medium
**Topics:** arrays, greedy, math
**Position:** SWE
**Years:** E3-E5

**Question:** Given a non-negative integer, swap two digits at most once to produce the maximum possible number.

**Approach:** For each digit position, record the last (rightmost) index of each digit 0-9. Iterate left to right; for each digit, if some larger digit exists later (check 9 down to digit+1), swap with the rightmost occurrence and return. O(n).

**Python:**
```python
def maximum_swap(num: int) -> int:
    digits = list(str(num))
    last = {int(d): i for i, d in enumerate(digits)}
    for i, d in enumerate(digits):
        for big in range(9, int(d), -1):
            if last.get(big, -1) > i:
                digits[i], digits[last[big]] = digits[last[big]], digits[i]
                return int("".join(digits))
    return num
```

**TypeScript:**
```typescript
function maximumSwap(num: number): number {
  const digits = String(num).split("");
  const last = new Map<number, number>();
  digits.forEach((d, i) => last.set(Number(d), i));
  for (let i = 0; i < digits.length; i++) {
    for (let big = 9; big > Number(digits[i]); big--) {
      const j = last.get(big);
      if (j !== undefined && j > i) {
        [digits[i], digits[j]] = [digits[j], digits[i]];
        return Number(digits.join(""));
      }
    }
  }
  return num;
}
```

**Java:**
```java
int maximumSwap(int num) {
    char[] digits = String.valueOf(num).toCharArray();
    int[] last = new int[10];
    for (int i = 0; i < digits.length; i++) last[digits[i] - '0'] = i;
    for (int i = 0; i < digits.length; i++) {
        for (int big = 9; big > digits[i] - '0'; big--) {
            if (last[big] > i) {
                char t = digits[i]; digits[i] = digits[last[big]]; digits[last[big]] = t;
                return Integer.parseInt(new String(digits));
            }
        }
    }
    return num;
}
```

**Key points:**
- Greedy: swap leftmost digit with a strictly larger later one.
- Pick the rightmost occurrence of the larger digit.
- O(n) time, O(10) space.

**Tags:** #algorithm

---

### 58. Exclusive Time of Functions

**Difficulty:** Medium
**Topics:** stack, simulation
**Position:** SWE
**Years:** E3-E5

**Question:** Given function call logs `["id:start:ts", "id:end:ts", ...]`, return the exclusive runtime of each function (excluding nested calls).

**Approach:** Stack of currently running function ids with a `prevTime`. On "start": if stack non-empty, add `ts - prevTime` to top's runtime; push new; prevTime = ts. On "end": add `ts - prevTime + 1` to top's runtime; pop; prevTime = ts + 1. O(n).

**Python:**
```python
def exclusive_time(n: int, logs: list[str]) -> list[int]:
    result = [0] * n
    stack: list[int] = []
    prev = 0
    for log in logs:
        fid, kind, ts_str = log.split(":")
        i, ts = int(fid), int(ts_str)
        if kind == "start":
            if stack:
                result[stack[-1]] += ts - prev
            stack.append(i)
            prev = ts
        else:
            result[stack.pop()] += ts - prev + 1
            prev = ts + 1
    return result
```

**TypeScript:**
```typescript
function exclusiveTime(n: number, logs: string[]): number[] {
  const result = new Array(n).fill(0);
  const stack: number[] = [];
  let prev = 0;
  for (const log of logs) {
    const [fid, kind, tsStr] = log.split(":");
    const i = Number(fid), ts = Number(tsStr);
    if (kind === "start") {
      if (stack.length) result[stack[stack.length - 1]] += ts - prev;
      stack.push(i);
      prev = ts;
    } else {
      result[stack.pop()!] += ts - prev + 1;
      prev = ts + 1;
    }
  }
  return result;
}
```

**Java:**
```java
int[] exclusiveTime(int n, List<String> logs) {
    int[] result = new int[n];
    Deque<Integer> stack = new ArrayDeque<>();
    int prev = 0;
    for (String log : logs) {
        String[] parts = log.split(":");
        int i = Integer.parseInt(parts[0]), ts = Integer.parseInt(parts[2]);
        if (parts[1].equals("start")) {
            if (!stack.isEmpty()) result[stack.peek()] += ts - prev;
            stack.push(i);
            prev = ts;
        } else {
            result[stack.pop()] += ts - prev + 1;
            prev = ts + 1;
        }
    }
    return result;
}
```

**Key points:**
- Stack mirrors function call nesting.
- "end" ts is inclusive — add 1.
- Update prev to current ts (or ts+1 for end) consistently.

**Tags:** #algorithm

---

### 59. Stickers to Spell Word

**Difficulty:** Hard
**Topics:** dp, bitmask, bfs
**Position:** Senior SWE
**Years:** E5+

**Question:** Given a list of sticker words and a target string, return the minimum number of stickers needed to spell out the target (you can cut and reuse stickers any number of times). Return -1 if impossible.

**Approach:** Bitmask DP over subsets of target's characters (target ≤ 15 chars). `dp[mask]` = min stickers to cover chars represented by mask. For each mask, try each sticker, see what chars it adds; recurse. Memoize. O(2^n * stickers * |target|).

**Python:**
```python
from collections import Counter
from functools import lru_cache

def min_stickers(stickers: list[str], target: str) -> int:
    n = len(target)
    counts = [Counter(s) for s in stickers]
    @lru_cache(maxsize=None)
    def dp(mask: int) -> int:
        if mask == (1 << n) - 1:
            return 0
        best = float("inf")
        first = next(i for i in range(n) if not (mask >> i) & 1)
        for c in counts:
            if target[first] not in c:
                continue
            new_mask = mask
            remain = Counter(c)
            for i in range(n):
                if not (mask >> i) & 1 and remain[target[i]] > 0:
                    remain[target[i]] -= 1
                    new_mask |= 1 << i
            sub = dp(new_mask)
            if sub != float("inf"):
                best = min(best, 1 + sub)
        return best  # type: ignore[return-value]
    ans = dp(0)
    return -1 if ans == float("inf") else int(ans)
```

**TypeScript:**
```typescript
function minStickers(stickers: string[], target: string): number {
  const n = target.length;
  const memo = new Map<number, number>();
  const counts = stickers.map(s => {
    const m: Record<string, number> = {};
    for (const c of s) m[c] = (m[c] ?? 0) + 1;
    return m;
  });
  const dp = (mask: number): number => {
    if (mask === (1 << n) - 1) return 0;
    if (memo.has(mask)) return memo.get(mask)!;
    let first = 0;
    while ((mask >> first) & 1) first++;
    let best = Infinity;
    for (const c of counts) {
      if (!c[target[first]]) continue;
      let newMask = mask;
      const remain = { ...c };
      for (let i = 0; i < n; i++) {
        if (!((mask >> i) & 1) && (remain[target[i]] ?? 0) > 0) {
          remain[target[i]]--;
          newMask |= 1 << i;
        }
      }
      const sub = dp(newMask);
      if (sub !== Infinity) best = Math.min(best, 1 + sub);
    }
    memo.set(mask, best);
    return best;
  };
  const ans = dp(0);
  return ans === Infinity ? -1 : ans;
}
```

**Java:**
```java
int minStickers(String[] stickers, String target) {
    int n = target.length(), full = (1 << n) - 1;
    int[] memo = new int[1 << n];
    Arrays.fill(memo, -1);
    int[][] counts = new int[stickers.length][26];
    for (int i = 0; i < stickers.length; i++)
        for (char c : stickers[i].toCharArray()) counts[i][c - 'a']++;
    int ans = dp(0, full, target, counts, memo);
    return ans >= Integer.MAX_VALUE / 2 ? -1 : ans;
}
private int dp(int mask, int full, String target, int[][] counts, int[] memo) {
    if (mask == full) return 0;
    if (memo[mask] != -1) return memo[mask];
    int first = Integer.numberOfTrailingZeros(~mask & full);
    int best = Integer.MAX_VALUE / 2;
    for (int[] c : counts) {
        if (c[target.charAt(first) - 'a'] == 0) continue;
        int newMask = mask;
        int[] remain = c.clone();
        for (int i = 0; i < target.length(); i++) {
            if (((mask >> i) & 1) == 0 && remain[target.charAt(i) - 'a'] > 0) {
                remain[target.charAt(i) - 'a']--;
                newMask |= 1 << i;
            }
        }
        best = Math.min(best, 1 + dp(newMask, full, target, counts, memo));
    }
    return memo[mask] = best;
}
```

**Key points:**
- Bitmask DP over target chars (length ≤ 15).
- Anchor each sticker on the first uncovered char to prune.
- Memoize on mask; worst O(2^n * stickers * |target|).

**Tags:** #algorithm

---

### 60. Robot Room Cleaner

**Difficulty:** Hard
**Topics:** backtracking, dfs
**Position:** Senior SWE
**Years:** E5+

**Question:** Given a robot with `move()`, `turnLeft()`, `turnRight()`, `clean()` on an unknown grid, clean the entire room.

**Approach:** DFS with relative coordinates. Maintain visited set keyed by (x, y). Try 4 directions: move, recurse, then back-out by turning 180°, moving, and turning 180° back to restore facing. Use a direction vector array and rotate it on turns. O(N - M) for N cells, M obstacles.

**Python:**
```python
class Robot:
    def move(self) -> bool: ...
    def turnLeft(self) -> None: ...
    def turnRight(self) -> None: ...
    def clean(self) -> None: ...

def clean_room(robot: Robot) -> None:
    dirs = [(-1, 0), (0, 1), (1, 0), (0, -1)]
    visited: set[tuple[int, int]] = set()
    def back() -> None:
        robot.turnRight(); robot.turnRight()
        robot.move()
        robot.turnRight(); robot.turnRight()
    def dfs(x: int, y: int, d: int) -> None:
        robot.clean()
        visited.add((x, y))
        for k in range(4):
            nd = (d + k) % 4
            nx, ny = x + dirs[nd][0], y + dirs[nd][1]
            if (nx, ny) not in visited and robot.move():
                dfs(nx, ny, nd)
                back()
            robot.turnRight()
    dfs(0, 0, 0)
```

**TypeScript:**
```typescript
interface Robot {
  move(): boolean;
  turnLeft(): void;
  turnRight(): void;
  clean(): void;
}

function cleanRoom(robot: Robot): void {
  const dirs: [number, number][] = [[-1, 0], [0, 1], [1, 0], [0, -1]];
  const visited = new Set<string>();
  const back = (): void => {
    robot.turnRight(); robot.turnRight();
    robot.move();
    robot.turnRight(); robot.turnRight();
  };
  const dfs = (x: number, y: number, d: number): void => {
    robot.clean();
    visited.add(`${x},${y}`);
    for (let k = 0; k < 4; k++) {
      const nd = (d + k) % 4;
      const nx = x + dirs[nd][0], ny = y + dirs[nd][1];
      if (!visited.has(`${nx},${ny}`) && robot.move()) {
        dfs(nx, ny, nd);
        back();
      }
      robot.turnRight();
    }
  };
  dfs(0, 0, 0);
}
```

**Java:**
```java
interface Robot { boolean move(); void turnLeft(); void turnRight(); void clean(); }

private static final int[][] DIRS = {{-1,0},{0,1},{1,0},{0,-1}};

void cleanRoom(Robot robot) {
    dfs(robot, 0, 0, 0, new HashSet<>());
}
private void dfs(Robot robot, int x, int y, int d, Set<String> visited) {
    robot.clean();
    visited.add(x + "," + y);
    for (int k = 0; k < 4; k++) {
        int nd = (d + k) % 4;
        int nx = x + DIRS[nd][0], ny = y + DIRS[nd][1];
        if (!visited.contains(nx + "," + ny) && robot.move()) {
            dfs(robot, nx, ny, nd, visited);
            robot.turnRight(); robot.turnRight();
            robot.move();
            robot.turnRight(); robot.turnRight();
        }
        robot.turnRight();
    }
}
```

**Key points:**
- Use relative coordinates rooted at start.
- Rotate direction index instead of mutating vector array.
- Backtrack by turning 180°, moving, then 180° again.

**Tags:** #algorithm

---

### 61. Shortest Path in a Grid with Obstacles Elimination

**Difficulty:** Hard
**Topics:** bfs, graph
**Position:** Senior SWE
**Years:** E5+

**Question:** Given an m×n grid with 0 (empty) and 1 (obstacle), find the shortest path from (0,0) to (m-1, n-1) where you may eliminate up to `k` obstacles. Return -1 if impossible.

**Approach:** BFS in 3D state space (row, col, k_remaining). Visited tracks best k_remaining seen at each cell; skip if current k_remaining <= seen. O(m*n*k). Trick: a cell may be revisited with more remaining eliminations to find shorter route.

**Python:**
```python
from collections import deque

def shortest_path(grid: list[list[int]], k: int) -> int:
    m, n = len(grid), len(grid[0])
    if m == 1 and n == 1:
        return 0
    k = min(k, m + n - 3)
    seen = {(0, 0, k)}
    q: deque[tuple[int, int, int, int]] = deque([(0, 0, k, 0)])
    while q:
        r, c, rk, d = q.popleft()
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < m and 0 <= nc < n:
                nk = rk - grid[nr][nc]
                if nk >= 0 and (nr, nc, nk) not in seen:
                    if nr == m - 1 and nc == n - 1:
                        return d + 1
                    seen.add((nr, nc, nk))
                    q.append((nr, nc, nk, d + 1))
    return -1
```

**TypeScript:**
```typescript
function shortestPath(grid: number[][], k: number): number {
  const m = grid.length, n = grid[0].length;
  if (m === 1 && n === 1) return 0;
  k = Math.min(k, m + n - 3);
  const seen = new Set<string>([`0,0,${k}`]);
  const q: [number, number, number, number][] = [[0, 0, k, 0]];
  while (q.length) {
    const [r, c, rk, d] = q.shift()!;
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
      const nk = rk - grid[nr][nc];
      const key = `${nr},${nc},${nk}`;
      if (nk >= 0 && !seen.has(key)) {
        if (nr === m - 1 && nc === n - 1) return d + 1;
        seen.add(key);
        q.push([nr, nc, nk, d + 1]);
      }
    }
  }
  return -1;
}
```

**Java:**
```java
int shortestPath(int[][] grid, int k) {
    int m = grid.length, n = grid[0].length;
    if (m == 1 && n == 1) return 0;
    k = Math.min(k, m + n - 3);
    Set<String> seen = new HashSet<>();
    seen.add("0,0," + k);
    Deque<int[]> q = new ArrayDeque<>();
    q.offer(new int[]{0, 0, k, 0});
    int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
    while (!q.isEmpty()) {
        int[] cur = q.poll();
        for (int[] d : dirs) {
            int nr = cur[0] + d[0], nc = cur[1] + d[1];
            if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
            int nk = cur[2] - grid[nr][nc];
            String key = nr + "," + nc + "," + nk;
            if (nk >= 0 && !seen.contains(key)) {
                if (nr == m - 1 && nc == n - 1) return cur[3] + 1;
                seen.add(key);
                q.offer(new int[]{nr, nc, nk, cur[3] + 1});
            }
        }
    }
    return -1;
}
```

**Key points:**
- State includes remaining eliminations k.
- Cap k at m+n-3 since longer detour never helps.
- BFS guarantees shortest steps; O(m*n*k) time.

**Tags:** #algorithm

---

### 62. Basic Calculator II

**Difficulty:** Medium
**Topics:** stack, strings, parsing
**Position:** SWE
**Years:** E3-E5

**Question:** Implement a basic calculator to evaluate a string expression with non-negative integers and `+`, `-`, `*`, `/` operators (integer division truncates toward zero). No parentheses.

**Approach:** Single pass with a stack of pending addends. Track `prevOp` (initially '+') and current number. On operator or end: if prevOp is '+' push num, '-' push -num, '*' push pop*num, '/' push pop/num. Sum stack at end. O(n).

**Python:**
```python
def calculate(s: str) -> int:
    stack: list[int] = []
    num = 0
    op = "+"
    for i, c in enumerate(s):
        if c.isdigit():
            num = num * 10 + int(c)
        if (not c.isdigit() and c != " ") or i == len(s) - 1:
            if op == "+":
                stack.append(num)
            elif op == "-":
                stack.append(-num)
            elif op == "*":
                stack.append(stack.pop() * num)
            else:
                # truncate toward zero
                stack.append(int(stack.pop() / num))
            op = c
            num = 0
    return sum(stack)
```

**TypeScript:**
```typescript
function calculate(s: string): number {
  const stack: number[] = [];
  let num = 0, op = "+";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c >= "0" && c <= "9") num = num * 10 + (c.charCodeAt(0) - 48);
    if ((c !== " " && (c < "0" || c > "9")) || i === s.length - 1) {
      if (op === "+") stack.push(num);
      else if (op === "-") stack.push(-num);
      else if (op === "*") stack.push(stack.pop()! * num);
      else stack.push(Math.trunc(stack.pop()! / num));
      op = c;
      num = 0;
    }
  }
  return stack.reduce((a, b) => a + b, 0);
}
```

**Java:**
```java
int calculate(String s) {
    Deque<Integer> stack = new ArrayDeque<>();
    int num = 0;
    char op = '+';
    for (int i = 0; i < s.length(); i++) {
        char c = s.charAt(i);
        if (Character.isDigit(c)) num = num * 10 + (c - '0');
        if ((c != ' ' && !Character.isDigit(c)) || i == s.length() - 1) {
            if (op == '+') stack.push(num);
            else if (op == '-') stack.push(-num);
            else if (op == '*') stack.push(stack.pop() * num);
            else stack.push(stack.pop() / num);
            op = c;
            num = 0;
        }
    }
    int sum = 0;
    for (int v : stack) sum += v;
    return sum;
}
```

**Key points:**
- Apply the previous operator when the next operator (or EOF) is seen.
- `*` and `/` resolve immediately against the stack top.
- Integer division truncates toward zero.

**Tags:** #algorithm

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
