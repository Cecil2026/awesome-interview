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

**Python:**
```python
def three_sum(nums: list[int]) -> list[list[int]]:
    nums.sort()
    out: list[list[int]] = []
    for i in range(len(nums) - 2):
        if i and nums[i] == nums[i - 1]:
            continue
        l, r = i + 1, len(nums) - 1
        while l < r:
            s = nums[i] + nums[l] + nums[r]
            if s < 0: l += 1
            elif s > 0: r -= 1
            else:
                out.append([nums[i], nums[l], nums[r]])
                l += 1; r -= 1
                while l < r and nums[l] == nums[l - 1]: l += 1
                while l < r and nums[r] == nums[r + 1]: r -= 1
    return out
```

**TypeScript:**
```typescript
function threeSum(nums: number[]): number[][] {
  nums.sort((a, b) => a - b);
  const out: number[][] = [];
  for (let i = 0; i < nums.length - 2; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue;
    let l = i + 1, r = nums.length - 1;
    while (l < r) {
      const s = nums[i] + nums[l] + nums[r];
      if (s < 0) l++;
      else if (s > 0) r--;
      else {
        out.push([nums[i], nums[l], nums[r]]);
        l++; r--;
        while (l < r && nums[l] === nums[l - 1]) l++;
        while (l < r && nums[r] === nums[r + 1]) r--;
      }
    }
  }
  return out;
}
```

**Java:**
```java
import java.util.*;
class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> out = new ArrayList<>();
        for (int i = 0; i < nums.length - 2; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            int l = i + 1, r = nums.length - 1;
            while (l < r) {
                int s = nums[i] + nums[l] + nums[r];
                if (s < 0) l++;
                else if (s > 0) r--;
                else {
                    out.add(List.of(nums[i], nums[l], nums[r]));
                    l++; r--;
                    while (l < r && nums[l] == nums[l - 1]) l++;
                    while (l < r && nums[r] == nums[r + 1]) r--;
                }
            }
        }
        return out;
    }
}
```

**Key points:**
- Sorting enables both the two-pointer scan and duplicate skipping.
- Skip duplicates at the fixed index and after each match to avoid repeated triplets.
- Early break when `nums[i] > 0` since remaining elements cannot sum to zero.

**Follow-ups:**
- 4Sum / kSum — generalize with recursion + two-pointer base case.
- Closest triplet to a target (3SumClosest) — same scan, different tracking.
- Count triplets summing to target instead of listing them.
- Streaming nums with bounded memory — can you still answer?

**Common Pitfalls:**
- Forgetting to skip duplicates *after* a match — produces duplicate triplets.
- Returning indices instead of values, or vice versa — confirm the contract.

**Tags:** #algorithm

---

### 2. Product of Array Except Self

**Difficulty:** Medium
**Topics:** arrays, prefix-product
**Position:** SWE
**Years:** ICT3-ICT4

**Question:** Given an integer array `nums`, return an array `out` where `out[i] = product of all nums except nums[i]`. Solve without division and in O(n).

**Approach:** Two passes: first pass `out[i] = product of nums[0..i-1]` (left product). Second pass right-to-left, multiply by running right product. O(n) time, O(1) extra (output not counted). Watch zero handling — naive division fails on zeros.

**Python:**
```python
def product_except_self(nums: list[int]) -> list[int]:
    n = len(nums)
    out = [1] * n
    for i in range(1, n):
        out[i] = out[i - 1] * nums[i - 1]
    right = 1
    for i in range(n - 1, -1, -1):
        out[i] *= right
        right *= nums[i]
    return out
```

**TypeScript:**
```typescript
function productExceptSelf(nums: number[]): number[] {
  const n = nums.length;
  const out: number[] = new Array(n).fill(1);
  for (let i = 1; i < n; i++) out[i] = out[i - 1] * nums[i - 1];
  let right = 1;
  for (let i = n - 1; i >= 0; i--) {
    out[i] *= right;
    right *= nums[i];
  }
  return out;
}
```

**Java:**
```java
class Solution {
    public int[] productExceptSelf(int[] nums) {
        int n = nums.length;
        int[] out = new int[n];
        out[0] = 1;
        for (int i = 1; i < n; i++) out[i] = out[i - 1] * nums[i - 1];
        int right = 1;
        for (int i = n - 1; i >= 0; i--) {
            out[i] *= right;
            right *= nums[i];
        }
        return out;
    }
}
```

**Key points:**
- Output array doubles as the prefix-product buffer to keep extra space at O(1).
- A single running scalar holds the suffix product on the second pass.
- Zero values are handled naturally without any special branching.

**Follow-ups:**
- Modulo a large prime instead of raw product — division becomes modular inverse.
- Allow division, but handle zeros explicitly (count + position trick).
- 2D version: product of all matrix elements except the current cell.
- Streaming nums — update on insert/delete with prefix/suffix product maintenance.

**Common Pitfalls:**
- Using division and crashing on a zero element.
- Overflowing `int` on long arrays — mention `long`/BigInt for the running products.

**Tags:** #algorithm

---

### 3. Merge Two Sorted Lists

**Difficulty:** Easy
**Topics:** linked-list, recursion
**Position:** SWE
**Years:** ICT3

**Question:** Merge two sorted linked lists into one sorted list.

**Approach:** Dummy head node, two pointers, append smaller, advance, repeat. Append remainder. O(n+m), O(1). Recursive variant: `merge(a, b) = a < b ? a + merge(a.next, b) : b + merge(a, b.next)` — clean but O(n+m) stack.

**Python:**
```python
class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val = val
        self.next = next

def merge_two_lists(a: ListNode | None, b: ListNode | None) -> ListNode | None:
    dummy = ListNode()
    tail = dummy
    while a and b:
        if a.val <= b.val:
            tail.next, a = a, a.next
        else:
            tail.next, b = b, b.next
        tail = tail.next
    tail.next = a or b
    return dummy.next
```

**TypeScript:**
```typescript
class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) { this.val = val; this.next = next; }
}

function mergeTwoLists(a: ListNode | null, b: ListNode | null): ListNode | null {
  const dummy = new ListNode();
  let tail = dummy;
  while (a && b) {
    if (a.val <= b.val) { tail.next = a; a = a.next; }
    else { tail.next = b; b = b.next; }
    tail = tail.next!;
  }
  tail.next = a ?? b;
  return dummy.next;
}
```

**Java:**
```java
class ListNode {
    int val; ListNode next;
    ListNode() {}
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}
class Solution {
    public ListNode mergeTwoLists(ListNode a, ListNode b) {
        ListNode dummy = new ListNode(), tail = dummy;
        while (a != null && b != null) {
            if (a.val <= b.val) { tail.next = a; a = a.next; }
            else { tail.next = b; b = b.next; }
            tail = tail.next;
        }
        tail.next = (a != null) ? a : b;
        return dummy.next;
    }
}
```

**Key points:**
- Dummy head removes special-casing for the first node.
- Append the non-null tail in O(1) once one list is consumed.
- Stable ordering between equal values preserves list semantics.

**Follow-ups:**
- Merge K sorted lists — heap of heads, or pairwise merge in O(N log K).
- Lists too large for memory — external merge on disk.
- Lists are doubly linked — fix `prev` pointers without re-traversing.
- In-place merge without dummy node — careful first-node selection.

**Common Pitfalls:**
- Forgetting to advance `tail` after attaching — builds a self-loop.
- Not attaching the leftover tail (`tail.next = a or b`) — truncates the result.

**Tags:** #algorithm

---

### 4. Longest Palindromic Substring

**Difficulty:** Medium
**Topics:** strings, dp, expand-around-center
**Position:** SWE
**Years:** ICT3-ICT4

**Question:** Given a string `s`, return the longest palindromic substring.

**Approach:** Expand around center — for each index i, try odd-length (center=i) and even-length (center between i and i+1) expansions, track best. O(n²) time, O(1) space. Manacher's is O(n) but rarely required. Watch off-by-one for length / substring indices.

**Python:**
```python
def longest_palindrome(s: str) -> str:
    def grow(l: int, r: int) -> tuple[int, int]:
        while l >= 0 and r < len(s) and s[l] == s[r]:
            l -= 1; r += 1
        return l + 1, r - 1
    bl, br = 0, 0
    for i in range(len(s)):
        for l, r in (grow(i, i), grow(i, i + 1)):
            if r - l > br - bl:
                bl, br = l, r
    return s[bl:br + 1]
```

**TypeScript:**
```typescript
function longestPalindrome(s: string): string {
  const grow = (l: number, r: number): [number, number] => {
    while (l >= 0 && r < s.length && s[l] === s[r]) { l--; r++; }
    return [l + 1, r - 1];
  };
  let bl = 0, br = 0;
  for (let i = 0; i < s.length; i++) {
    for (const [l, r] of [grow(i, i), grow(i, i + 1)]) {
      if (r - l > br - bl) { bl = l; br = r; }
    }
  }
  return s.slice(bl, br + 1);
}
```

**Java:**
```java
class Solution {
    private int bl = 0, br = 0;
    public String longestPalindrome(String s) {
        for (int i = 0; i < s.length(); i++) { grow(s, i, i); grow(s, i, i + 1); }
        return s.substring(bl, br + 1);
    }
    private void grow(String s, int l, int r) {
        while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) { l--; r++; }
        l++; r--;
        if (r - l > br - bl) { bl = l; br = r; }
    }
}
```

**Key points:**
- Two center types cover odd and even palindromes uniformly.
- Track the best window by length difference, not by recomputing slices.
- Manacher's algorithm reaches O(n) but the constant factor and code length rarely pay off.

**Follow-ups:**
- Count *all* palindromic substrings, not just the longest.
- Palindrome partitioning — split `s` into minimum palindrome pieces.
- Longest palindromic *subsequence* (different problem, LCS-style DP).
- Apple-specific: implement Manacher's and explain why O(n) matters.

**Common Pitfalls:**
- Returning `r - l` length without the `+ 1`.
- Forgetting the even-center expansion — misses palindromes like "abba".

**Tags:** #algorithm

---

### 5. Implement strStr() / Find Substring

**Difficulty:** Easy
**Topics:** strings, sliding-window, kmp
**Position:** SWE
**Years:** ICT3

**Question:** Implement `strStr(haystack, needle)` — return the index of the first occurrence of `needle` in `haystack`, or -1.

**Approach:** Naive sliding window O(n*m). Apple often follows up with "now make it O(n+m)" → KMP with failure function, or Rabin-Karp with rolling hash. Be ready to walk through KMP failure-function construction.

**Python:**
```python
def str_str(haystack: str, needle: str) -> int:
    if not needle:
        return 0
    lps = [0] * len(needle)
    k = 0
    for i in range(1, len(needle)):
        while k and needle[k] != needle[i]:
            k = lps[k - 1]
        if needle[k] == needle[i]:
            k += 1
        lps[i] = k
    j = 0
    for i, c in enumerate(haystack):
        while j and needle[j] != c:
            j = lps[j - 1]
        if needle[j] == c:
            j += 1
        if j == len(needle):
            return i - j + 1
    return -1
```

**TypeScript:**
```typescript
function strStr(haystack: string, needle: string): number {
  if (!needle) return 0;
  const lps = new Array(needle.length).fill(0);
  let k = 0;
  for (let i = 1; i < needle.length; i++) {
    while (k && needle[k] !== needle[i]) k = lps[k - 1];
    if (needle[k] === needle[i]) k++;
    lps[i] = k;
  }
  let j = 0;
  for (let i = 0; i < haystack.length; i++) {
    while (j && needle[j] !== haystack[i]) j = lps[j - 1];
    if (needle[j] === haystack[i]) j++;
    if (j === needle.length) return i - j + 1;
  }
  return -1;
}
```

**Java:**
```java
class Solution {
    public int strStr(String haystack, String needle) {
        if (needle.isEmpty()) return 0;
        int m = needle.length();
        int[] lps = new int[m];
        for (int i = 1, k = 0; i < m; i++) {
            while (k > 0 && needle.charAt(k) != needle.charAt(i)) k = lps[k - 1];
            if (needle.charAt(k) == needle.charAt(i)) k++;
            lps[i] = k;
        }
        for (int i = 0, j = 0; i < haystack.length(); i++) {
            while (j > 0 && needle.charAt(j) != haystack.charAt(i)) j = lps[j - 1];
            if (needle.charAt(j) == haystack.charAt(i)) j++;
            if (j == m) return i - j + 1;
        }
        return -1;
    }
}
```

**Key points:**
- KMP achieves O(n + m) by avoiding re-scanning the haystack on mismatch.
- The `lps` (longest proper prefix that is also a suffix) table encodes the fallback positions.
- Empty needle returns 0 by convention; mirror C's `strstr` semantics.

**Follow-ups:**
- Return *all* occurrences, not just the first — same scan, append on match.
- Multi-pattern search across the same haystack — Aho-Corasick automaton.
- Wildcard or `?`-style fuzzy matching — different DP entirely.
- Compare KMP vs Rabin-Karp vs Boyer-Moore — when does each win?

**Common Pitfalls:**
- Off-by-one in the `lps` construction (start `i` at 1, not 0).
- Returning the *end* index instead of the *start* (`i - j + 1`, not `i`).

**Tags:** #algorithm

---

### 6. LRU Cache

**Difficulty:** Medium
**Topics:** ood, hashmap, linked-list
**Position:** SWE
**Years:** ICT3-ICT4

**Question:** Design an LRU cache with O(1) `get` and `put`.

**Approach:** Hashmap `key -> node` + doubly linked list (head=most recent, tail=oldest). On `get`, move node to head. On `put` overflow, drop tail. Apple may ask follow-up: make it thread-safe (lock per bucket, or compare-and-swap on Node).

**Python:**
```python
from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int) -> None:
        self.cap = capacity
        self.d: OrderedDict[int, int] = OrderedDict()

    def get(self, key: int) -> int:
        if key not in self.d:
            return -1
        self.d.move_to_end(key)
        return self.d[key]

    def put(self, key: int, value: int) -> None:
        if key in self.d:
            self.d.move_to_end(key)
        self.d[key] = value
        if len(self.d) > self.cap:
            self.d.popitem(last=False)
```

**TypeScript:**
```typescript
class LRUCache {
  private cap: number;
  private m: Map<number, number>;
  constructor(capacity: number) { this.cap = capacity; this.m = new Map(); }
  get(key: number): number {
    if (!this.m.has(key)) return -1;
    const v = this.m.get(key)!;
    this.m.delete(key); this.m.set(key, v);
    return v;
  }
  put(key: number, value: number): void {
    if (this.m.has(key)) this.m.delete(key);
    this.m.set(key, value);
    if (this.m.size > this.cap) {
      const oldest = this.m.keys().next().value as number;
      this.m.delete(oldest);
    }
  }
}
```

**Java:**
```java
import java.util.*;
class LRUCache extends LinkedHashMap<Integer, Integer> {
    private final int cap;
    public LRUCache(int capacity) {
        super(capacity, 0.75f, true);
        this.cap = capacity;
    }
    public int get(int key) { return getOrDefault(key, -1); }
    public void put(int key, int value) { super.put(key, value); }
    @Override
    protected boolean removeEldestEntry(Map.Entry<Integer, Integer> eldest) {
        return size() > cap;
    }
}
```

**Key points:**
- Python `OrderedDict` and JS `Map` preserve insertion order — re-insert on access marks "most recent".
- Eviction is just popping the first key in O(1).
- Production code uses a hashmap + custom doubly linked list to keep pointers stable under concurrency.

**Follow-ups:**
- Make it thread-safe — lock per bucket vs single lock; discuss contention.
- LFU (Least Frequently Used) variant — different data structures, harder eviction.
- TTL-expiring entries layered on top of LRU.
- Distributed LRU across nodes — consistent hashing + per-node local cache.

**Common Pitfalls:**
- Using a plain dict and scanning for the oldest — O(n) `put`, not O(1).
- Forgetting to move on `get`, so reads don't count as recency.

**Tags:** #algorithm

---

### 7. Binary Tree Maximum Path Sum

**Difficulty:** Hard
**Topics:** tree, dp, recursion
**Position:** SWE
**Years:** ICT4

**Question:** Given a non-empty binary tree, find the maximum path sum. A path may start and end at any nodes, not necessarily through the root.

**Approach:** DFS returning "max gain from this node going down one side" (max(0, left), max(0, right) — discard negative). At each node, candidate full path through it = `node.val + leftGain + rightGain`; update global max. Return `node.val + max(leftGain, rightGain)` for parent. O(n).

**Python:**
```python
class TreeNode:
    def __init__(self, val: int = 0, left: "TreeNode | None" = None, right: "TreeNode | None" = None) -> None:
        self.val = val; self.left = left; self.right = right

def max_path_sum(root: TreeNode | None) -> int:
    best = float("-inf")
    def gain(node: TreeNode | None) -> int:
        nonlocal best
        if node is None:
            return 0
        l = max(0, gain(node.left))
        r = max(0, gain(node.right))
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
    const l = Math.max(0, gain(n.left));
    const r = Math.max(0, gain(n.right));
    best = Math.max(best, n.val + l + r);
    return n.val + Math.max(l, r);
  };
  gain(root);
  return best;
}
```

**Java:**
```java
class TreeNode {
    int val; TreeNode left, right;
    TreeNode(int val) { this.val = val; }
}
class Solution {
    private int best = Integer.MIN_VALUE;
    public int maxPathSum(TreeNode root) { gain(root); return best; }
    private int gain(TreeNode n) {
        if (n == null) return 0;
        int l = Math.max(0, gain(n.left));
        int r = Math.max(0, gain(n.right));
        best = Math.max(best, n.val + l + r);
        return n.val + Math.max(l, r);
    }
}
```

**Key points:**
- Discard negative subtree contributions by clamping with `max(0, ...)`.
- The "best" candidate at each node uses both children; the return value uses only one.
- Initial best is `-Infinity` to handle all-negative trees correctly.

**Follow-ups:**
- Return the actual path (list of node values), not just the sum.
- Maximum path sum that *must* go through the root.
- Generalize to N-ary trees or DAGs.
- Apple iOS quirk: deeply skewed trees blow the recursion stack — propose an iterative variant.

**Common Pitfalls:**
- Initializing `best` to 0 — wrong for all-negative trees.
- Returning `node.val + l + r` to the parent instead of `node.val + max(l, r)` — produces invalid paths.

**Tags:** #algorithm

---

### 8. Coin Change

**Difficulty:** Medium
**Topics:** dp, greedy
**Position:** SWE
**Years:** ICT3-ICT4

**Question:** Given coin denominations and an amount, return the fewest coins needed to make that amount, or -1 if impossible.

**Approach:** Bottom-up DP. `dp[i]` = min coins to make `i`; `dp[0] = 0`, `dp[i] = min(dp[i - c] + 1)` for each coin c <= i. O(amount * coins). Greedy fails for arbitrary denominations (e.g., [1, 3, 4] for 6 → greedy gives 4+1+1=3, optimal is 3+3=2).

**Python:**
```python
def coin_change(coins: list[int], amount: int) -> int:
    INF = amount + 1
    dp = [0] + [INF] * amount
    for i in range(1, amount + 1):
        for c in coins:
            if c <= i and dp[i - c] + 1 < dp[i]:
                dp[i] = dp[i - c] + 1
    return -1 if dp[amount] == INF else dp[amount]
```

**TypeScript:**
```typescript
function coinChange(coins: number[], amount: number): number {
  const INF = amount + 1;
  const dp = new Array(amount + 1).fill(INF);
  dp[0] = 0;
  for (let i = 1; i <= amount; i++) {
    for (const c of coins) {
      if (c <= i && dp[i - c] + 1 < dp[i]) dp[i] = dp[i - c] + 1;
    }
  }
  return dp[amount] === INF ? -1 : dp[amount];
}
```

**Java:**
```java
import java.util.Arrays;
class Solution {
    public int coinChange(int[] coins, int amount) {
        int inf = amount + 1;
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, inf);
        dp[0] = 0;
        for (int i = 1; i <= amount; i++) {
            for (int c : coins) {
                if (c <= i && dp[i - c] + 1 < dp[i]) dp[i] = dp[i - c] + 1;
            }
        }
        return dp[amount] == inf ? -1 : dp[amount];
    }
}
```

**Key points:**
- Sentinel `amount + 1` is safe because the answer cannot exceed `amount` (using all 1-coins if available).
- Order coins inner, amount outer for the unbounded knapsack pattern.
- Greedy only works when the denomination set is canonical (e.g., USD); always validate.

**Follow-ups:**
- Count the *number of ways* to make the amount (Coin Change II) — different DP order.
- Each coin usable at most once — classic 0/1 knapsack.
- Reconstruct one optimal coin set, not just the count.
- Huge `amount` with small coin set — BFS-on-graph variant may be faster.

**Common Pitfalls:**
- Swapping the loop order produces "count of combinations" rather than "min coins".
- Returning `dp[amount]` when it's still `INF` — must remap to -1.

**Tags:** #algorithm

---

### 9. Design Apple Music (or Spotify-like)

**Difficulty:** Hard
**Topics:** system-design, cdn, drm, recommendation, offline
**Position:** Senior SWE
**Years:** ICT5

**Question:** Design Apple Music: streaming, library, recommendations, offline mode, lossless audio.

**Approach:** Audio files in blob storage + CDN, multiple bitrates (AAC 256kbps, lossless ALAC). DRM via FairPlay. Metadata sharded by track_id; user library (playlists, likes) sharded by user_id. Recommendations: offline two-tower embedding model + on-device re-ranking (Apple privacy lean). Offline downloads: client manages local cache with DRM license refresh. Discuss: cross-device sync (CloudKit), lossless streaming bandwidth, and how to preserve privacy by doing personalization on-device.

**Follow-ups:**
- Lossless streaming over a metered cellular plan — adaptive bitrate strategy.
- Personalization without sending listen history to the server — federated learning?
- Live radio / Apple Music Live — how does ingest + fanout change?
- Spatial audio metadata pipeline and decoder negotiation.
- DRM license server failure mode — how does playback degrade?

**Common Pitfalls:**
- Treating the recommendation pipeline as a single service — misses the offline/online split.
- Skipping DRM entirely — unrealistic for a music service.

**Tags:** #system-design

---

### 10. Design iMessage

**Difficulty:** Hard
**Topics:** system-design, e2e-encryption, apns, multi-device
**Position:** Senior SWE
**Years:** ICT5

**Question:** Design iMessage: end-to-end encrypted, multi-device delivery, fallback to SMS.

**Approach:** Each device has its own keypair registered with Apple Push Service. Sender encrypts message N times (once per recipient device) and posts via APNS. Server stores ciphertext briefly until delivery, then deletes. Discuss: Identity Service maps phone/email → device list (this is the trust anchor, hence the Contact Key Verification feature), large group keys (sender key model), media (S3-like blob + per-message key), and graceful SMS fallback when recipient not on iMessage.

**Follow-ups:**
- New device added to a recipient's account — how does key distribution handle it?
- Large group chats (>100) — sender keys vs pairwise; failure modes when a member rotates keys.
- Message edit / unsend semantics under E2E — server can't enforce them.
- Backup and restore — iCloud Backup contains keys, but you can opt out (Advanced Data Protection).
- Spam / abuse detection without reading plaintext — metadata-only signals.

**Common Pitfalls:**
- Storing plaintext server-side "for delivery" — breaks E2E.
- Assuming a single key per user — must handle a fan-out per device list.

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

### 21. Search in Rotated Sorted Array

**Difficulty:** Medium
**Topics:** arrays, binary-search
**Position:** ICT4
**Years:** ICT3-ICT4

**Question:** A sorted ascending array was rotated at an unknown pivot. Given a target value, return its index or -1. Must be O(log n).

**Approach:** Modified binary search. At each step, one half `[l..mid]` or `[mid..r]` is sorted — detect which by comparing `nums[l] <= nums[mid]`. Check if target lies in the sorted half; recurse there, else recurse other half. O(log n) time, O(1) space. Watch duplicates (degrades to O(n)).

**Python:**
```python
def search(nums: list[int], target: int) -> int:
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[lo] <= nums[mid]:
            if nums[lo] <= target < nums[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:
            if nums[mid] < target <= nums[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return -1
```

**TypeScript:**
```typescript
function search(nums: number[], target: number): number {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] === target) return mid;
    if (nums[lo] <= nums[mid]) {
      if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
      else lo = mid + 1;
    } else {
      if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return -1;
}
```

**Java:**
```java
class Solution {
    public int search(int[] nums, int target) {
        int lo = 0, hi = nums.length - 1;
        while (lo <= hi) {
            int mid = (lo + hi) >>> 1;
            if (nums[mid] == target) return mid;
            if (nums[lo] <= nums[mid]) {
                if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
                else lo = mid + 1;
            } else {
                if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
                else hi = mid - 1;
            }
        }
        return -1;
    }
}
```

**Key points:**
- Identify which half is sorted with a single endpoint comparison.
- Inclusive checks must match the sorted endpoints (`<= ... <` vs `< ... <=`).
- Duplicate values can force linear-time worst case; require unique elements or use the II variant.

**Tags:** #algorithm

---

### 22. Find Minimum in Rotated Sorted Array

**Difficulty:** Medium
**Topics:** arrays, binary-search
**Position:** ICT3
**Years:** ICT3

**Question:** Given a rotated sorted array with unique elements, return the minimum element in O(log n).

**Approach:** Binary search comparing `nums[mid]` with `nums[r]`. If `nums[mid] > nums[r]`, the minimum is in the right half (`l = mid+1`); else it's in the left half including mid (`r = mid`). Loop until `l == r`. O(log n), O(1).

**Python:**
```python
def find_min(nums: list[int]) -> int:
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] > nums[hi]:
            lo = mid + 1
        else:
            hi = mid
    return nums[lo]
```

**TypeScript:**
```typescript
function findMin(nums: number[]): number {
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] > nums[hi]) lo = mid + 1;
    else hi = mid;
  }
  return nums[lo];
}
```

**Java:**
```java
class Solution {
    public int findMin(int[] nums) {
        int lo = 0, hi = nums.length - 1;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (nums[mid] > nums[hi]) lo = mid + 1;
            else hi = mid;
        }
        return nums[lo];
    }
}
```

**Key points:**
- Comparing against `hi` (not `lo`) correctly handles the non-rotated case.
- The loop ends with `lo == hi` pointing at the minimum.
- Distinct elements keep the comparison strict, avoiding worst-case O(n).

**Tags:** #algorithm

---

### 23. First Bad Version

**Difficulty:** Easy
**Topics:** binary-search, api
**Position:** ICT3
**Years:** ICT3

**Question:** You have versions 1..n; one is bad and all subsequent are bad. Given `isBadVersion(v)` API, find the first bad version with minimum API calls.

**Approach:** Classical binary search for left boundary. `l = 1, r = n`; while `l < r`, `mid = l + (r-l)/2`; if bad, `r = mid`, else `l = mid+1`. Use `l + (r-l)/2` to avoid overflow. O(log n) API calls.

**Python:**
```python
def is_bad_version(v: int) -> bool: ...  # provided

def first_bad_version(n: int) -> int:
    lo, hi = 1, n
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if is_bad_version(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo
```

**TypeScript:**
```typescript
declare function isBadVersion(v: number): boolean;

function firstBadVersion(n: number): number {
  let lo = 1, hi = n;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (isBadVersion(mid)) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}
```

**Java:**
```java
public class Solution extends VersionControl {
    public int firstBadVersion(int n) {
        int lo = 1, hi = n;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (isBadVersion(mid)) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
}
```

**Key points:**
- Use `lo + (hi - lo) / 2` to avoid integer overflow in languages with bounded ints.
- The invariant `hi` is always a bad version (or `n`) keeps the boundary correct.
- Loop terminates when `lo == hi`, which is the first bad version.

**Tags:** #algorithm

---

### 24. Sqrt(x)

**Difficulty:** Easy
**Topics:** binary-search, math
**Position:** ICT3
**Years:** ICT3

**Question:** Compute the integer square root of `x` (floor) without using built-in sqrt.

**Approach:** Binary search on `[0, x]`. Invariant: find largest `k` with `k*k <= x`. Use `mid = l + (r-l)/2` and compare `mid*mid` to `x` (cast to long to avoid overflow). Alternative: Newton's method `x_{n+1} = (x_n + x/x_n)/2`, converges quadratically. O(log x).

**Python:**
```python
def my_sqrt(x: int) -> int:
    lo, hi, ans = 0, x, 0
    while lo <= hi:
        mid = (lo + hi) // 2
        if mid * mid <= x:
            ans = mid
            lo = mid + 1
        else:
            hi = mid - 1
    return ans
```

**TypeScript:**
```typescript
function mySqrt(x: number): number {
  let lo = 0, hi = x, ans = 0;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (mid * mid <= x) { ans = mid; lo = mid + 1; }
    else hi = mid - 1;
  }
  return ans;
}
```

**Java:**
```java
class Solution {
    public int mySqrt(int x) {
        long lo = 0, hi = x, ans = 0;
        while (lo <= hi) {
            long mid = lo + (hi - lo) / 2;
            if (mid * mid <= x) { ans = mid; lo = mid + 1; }
            else hi = mid - 1;
        }
        return (int) ans;
    }
}
```

**Key points:**
- Track the latest valid `mid` since the loop overshoots by one before exiting.
- In Java/C++, cast `mid * mid` to a wider type to avoid overflow.
- Newton's method converges in ~6 iterations even for huge inputs but needs careful starting point.

**Tags:** #algorithm

---

### 25. Pow(x, n)

**Difficulty:** Medium
**Topics:** math, recursion, bit-manipulation
**Position:** ICT4
**Years:** ICT3-ICT4

**Question:** Implement `pow(x, n)` for real `x` and integer `n` (possibly negative).

**Approach:** Fast exponentiation by squaring. If `n < 0`, negate and invert `x`. Iterate: while `n > 0`, if `n & 1` multiply result by `x`; square `x`; shift `n` right. Watch `INT_MIN` negation — cast to long. O(log n) time, O(1) space.

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
  if (n < 0) { x = 1 / x; n = -n; }
  let result = 1;
  while (n > 0) {
    if (n & 1) result *= x;
    x *= x;
    n = Math.floor(n / 2);
  }
  return result;
}
```

**Java:**
```java
class Solution {
    public double myPow(double x, int n) {
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
}
```

**Key points:**
- Halving the exponent each step yields O(log n) multiplications.
- Negate `n` after inverting `x` for negative exponents.
- In bounded-int languages, cast `n` to a wider type before negating `INT_MIN`.

**Tags:** #algorithm

---

### 26. Container With Most Water

**Difficulty:** Medium
**Topics:** arrays, two-pointer
**Position:** ICT3
**Years:** ICT3-ICT4

**Question:** Given heights `h[i]`, choose two indices to form a container; maximize `min(h[i], h[j]) * (j - i)`.

**Approach:** Two pointers at ends. Compute area; move the shorter side inward (moving the taller side can never increase area because width shrinks and height is bounded by min). Track max. O(n) time, O(1) space.

**Python:**
```python
def max_area(height: list[int]) -> int:
    l, r = 0, len(height) - 1
    best = 0
    while l < r:
        best = max(best, (r - l) * min(height[l], height[r]))
        if height[l] < height[r]:
            l += 1
        else:
            r -= 1
    return best
```

**TypeScript:**
```typescript
function maxArea(height: number[]): number {
  let l = 0, r = height.length - 1, best = 0;
  while (l < r) {
    const h = Math.min(height[l], height[r]);
    best = Math.max(best, (r - l) * h);
    if (height[l] < height[r]) l++; else r--;
  }
  return best;
}
```

**Java:**
```java
class Solution {
    public int maxArea(int[] height) {
        int l = 0, r = height.length - 1, best = 0;
        while (l < r) {
            int h = Math.min(height[l], height[r]);
            best = Math.max(best, (r - l) * h);
            if (height[l] < height[r]) l++; else r--;
        }
        return best;
    }
}
```

**Key points:**
- Width strictly decreases each step, so only height increase can grow area.
- Moving the taller side can never increase area; always move the shorter side.
- Tie-breaks on equal heights can move either pointer with the same result.

**Tags:** #algorithm

---

### 27. 4Sum

**Difficulty:** Medium
**Topics:** arrays, two-pointer, sorting
**Position:** ICT4
**Years:** ICT3-ICT4

**Question:** Given array `nums` and integer `target`, return all unique quadruplets summing to `target`.

**Approach:** Sort. Two nested loops fixing `i, j`; two pointers `l, r` for the remaining pair. Skip duplicates at all four positions. Early termination when smallest 4 already exceed target. O(n^3) time, O(1) extra.

**Python:**
```python
def four_sum(nums: list[int], target: int) -> list[list[int]]:
    nums.sort()
    n = len(nums)
    out: list[list[int]] = []
    for i in range(n - 3):
        if i and nums[i] == nums[i - 1]: continue
        for j in range(i + 1, n - 2):
            if j > i + 1 and nums[j] == nums[j - 1]: continue
            l, r, t = j + 1, n - 1, target - nums[i] - nums[j]
            while l < r:
                s = nums[l] + nums[r]
                if s < t: l += 1
                elif s > t: r -= 1
                else:
                    out.append([nums[i], nums[j], nums[l], nums[r]])
                    l += 1; r -= 1
                    while l < r and nums[l] == nums[l - 1]: l += 1
                    while l < r and nums[r] == nums[r + 1]: r -= 1
    return out
```

**TypeScript:**
```typescript
function fourSum(nums: number[], target: number): number[][] {
  nums.sort((a, b) => a - b);
  const n = nums.length, out: number[][] = [];
  for (let i = 0; i < n - 3; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue;
    for (let j = i + 1; j < n - 2; j++) {
      if (j > i + 1 && nums[j] === nums[j - 1]) continue;
      let l = j + 1, r = n - 1, t = target - nums[i] - nums[j];
      while (l < r) {
        const s = nums[l] + nums[r];
        if (s < t) l++;
        else if (s > t) r--;
        else {
          out.push([nums[i], nums[j], nums[l], nums[r]]);
          l++; r--;
          while (l < r && nums[l] === nums[l - 1]) l++;
          while (l < r && nums[r] === nums[r + 1]) r--;
        }
      }
    }
  }
  return out;
}
```

**Java:**
```java
import java.util.*;
class Solution {
    public List<List<Integer>> fourSum(int[] nums, int target) {
        Arrays.sort(nums);
        List<List<Integer>> out = new ArrayList<>();
        int n = nums.length;
        for (int i = 0; i < n - 3; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            for (int j = i + 1; j < n - 2; j++) {
                if (j > i + 1 && nums[j] == nums[j - 1]) continue;
                int l = j + 1, r = n - 1;
                long t = (long) target - nums[i] - nums[j];
                while (l < r) {
                    long s = (long) nums[l] + nums[r];
                    if (s < t) l++;
                    else if (s > t) r--;
                    else {
                        out.add(List.of(nums[i], nums[j], nums[l], nums[r]));
                        l++; r--;
                        while (l < r && nums[l] == nums[l - 1]) l++;
                        while (l < r && nums[r] == nums[r + 1]) r--;
                    }
                }
            }
        }
        return out;
    }
}
```

**Key points:**
- Skip duplicates at all four index positions to keep results unique.
- The two-pointer scan reduces inner pair search from O(n^2) to O(n).
- Early-break when `nums[i] * 4 > target` or smallest possible sum exceeds `target`.

**Tags:** #algorithm

---

### 28. Remove Duplicates from Sorted Array

**Difficulty:** Easy
**Topics:** arrays, two-pointer
**Position:** ICT3
**Years:** ICT3

**Question:** Given a sorted array, remove duplicates in-place so each element appears once; return the new length.

**Approach:** Two pointers `write, read`. Iterate `read`; if `nums[read] != nums[write-1]`, copy to `nums[write]` and advance write. Return `write`. O(n) time, O(1) space.

**Python:**
```python
def remove_duplicates(nums: list[int]) -> int:
    if not nums:
        return 0
    write = 1
    for read in range(1, len(nums)):
        if nums[read] != nums[write - 1]:
            nums[write] = nums[read]
            write += 1
    return write
```

**TypeScript:**
```typescript
function removeDuplicates(nums: number[]): number {
  if (nums.length === 0) return 0;
  let write = 1;
  for (let read = 1; read < nums.length; read++) {
    if (nums[read] !== nums[write - 1]) {
      nums[write] = nums[read];
      write++;
    }
  }
  return write;
}
```

**Java:**
```java
class Solution {
    public int removeDuplicates(int[] nums) {
        if (nums.length == 0) return 0;
        int write = 1;
        for (int read = 1; read < nums.length; read++) {
            if (nums[read] != nums[write - 1]) nums[write++] = nums[read];
        }
        return write;
    }
}
```

**Key points:**
- Sorted input means duplicates are always adjacent.
- The write pointer lags read so we overwrite only when needed.
- Returns the count of unique elements; values past index `write` are leftovers.

**Tags:** #algorithm

---

### 29. Remove Nth Node from End of List

**Difficulty:** Medium
**Topics:** linked-list, two-pointer
**Position:** ICT3
**Years:** ICT3

**Question:** Remove the n-th node from the end of a singly linked list in one pass.

**Approach:** Dummy head. Advance `fast` n+1 steps. Move `fast` and `slow` together until `fast` is null. `slow.next` is the node to remove; `slow.next = slow.next.next`. O(L) time, O(1) space.

**Python:**
```python
def remove_nth_from_end(head: ListNode | None, n: int) -> ListNode | None:
    dummy = ListNode(0, head)
    fast: ListNode | None = dummy
    slow: ListNode | None = dummy
    for _ in range(n + 1):
        fast = fast.next  # type: ignore
    while fast:
        fast = fast.next
        slow = slow.next  # type: ignore
    slow.next = slow.next.next  # type: ignore
    return dummy.next
```

**TypeScript:**
```typescript
function removeNthFromEnd(head: ListNode | null, n: number): ListNode | null {
  const dummy = new ListNode(0, head);
  let fast: ListNode | null = dummy, slow: ListNode | null = dummy;
  for (let i = 0; i < n + 1; i++) fast = fast!.next;
  while (fast) { fast = fast.next; slow = slow!.next; }
  slow!.next = slow!.next!.next;
  return dummy.next;
}
```

**Java:**
```java
class Solution {
    public ListNode removeNthFromEnd(ListNode head, int n) {
        ListNode dummy = new ListNode(0, head);
        ListNode fast = dummy, slow = dummy;
        for (int i = 0; i < n + 1; i++) fast = fast.next;
        while (fast != null) { fast = fast.next; slow = slow.next; }
        slow.next = slow.next.next;
        return dummy.next;
    }
}
```

**Key points:**
- Dummy head simplifies removal when the target is the original head.
- Gap of `n + 1` lands `slow` on the node before the one to remove.
- Single pass — no length precomputation needed.

**Tags:** #algorithm

---

### 30. Add Two Numbers (Linked List)

**Difficulty:** Medium
**Topics:** linked-list, math
**Position:** ICT3
**Years:** ICT3-ICT4

**Question:** Two numbers stored as linked lists in reverse order (each node holds one digit). Return their sum as a linked list.

**Approach:** Walk both lists with a carry. At each step, `sum = a + b + carry`; new node has `sum % 10`; carry = `sum / 10`. Continue until both lists exhausted and carry is 0. Use dummy head. O(max(n, m)) time.

**Python:**
```python
def add_two_numbers(l1: ListNode | None, l2: ListNode | None) -> ListNode | None:
    dummy = ListNode()
    tail = dummy
    carry = 0
    while l1 or l2 or carry:
        s = carry + (l1.val if l1 else 0) + (l2.val if l2 else 0)
        carry, digit = divmod(s, 10)
        tail.next = ListNode(digit)
        tail = tail.next
        if l1: l1 = l1.next
        if l2: l2 = l2.next
    return dummy.next
```

**TypeScript:**
```typescript
function addTwoNumbers(l1: ListNode | null, l2: ListNode | null): ListNode | null {
  const dummy = new ListNode();
  let tail = dummy, carry = 0;
  while (l1 || l2 || carry) {
    const s = carry + (l1?.val ?? 0) + (l2?.val ?? 0);
    carry = Math.floor(s / 10);
    tail.next = new ListNode(s % 10);
    tail = tail.next;
    l1 = l1?.next ?? null;
    l2 = l2?.next ?? null;
  }
  return dummy.next;
}
```

**Java:**
```java
class Solution {
    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
        ListNode dummy = new ListNode(), tail = dummy;
        int carry = 0;
        while (l1 != null || l2 != null || carry > 0) {
            int s = carry + (l1 != null ? l1.val : 0) + (l2 != null ? l2.val : 0);
            carry = s / 10;
            tail.next = new ListNode(s % 10, null);
            tail = tail.next;
            if (l1 != null) l1 = l1.next;
            if (l2 != null) l2 = l2.next;
        }
        return dummy.next;
    }
}
```

**Key points:**
- Loop condition must include `carry` for the trailing digit (e.g., 5 + 5 = 10).
- Treat missing nodes as zero so unequal lengths fall out naturally.
- Output is in the same reverse-digit order as input.

**Tags:** #algorithm

---

### 31. Copy List with Random Pointer

**Difficulty:** Medium
**Topics:** linked-list, hashmap
**Position:** ICT4
**Years:** ICT4

**Question:** Deep copy a linked list where each node has `next` and a `random` pointer to any node.

**Approach:** Two passes with hashmap `old -> new`: first pass creates clones, second pass wires `next` and `random`. O(n) time, O(n) space. O(1) extra space variant: interleave clones inline (A->A'->B->B'->...), set randoms, then split.

**Python:**
```python
class RandomNode:
    def __init__(self, val: int, next: "RandomNode | None" = None, random: "RandomNode | None" = None) -> None:
        self.val = val; self.next = next; self.random = random

def copy_random_list(head: RandomNode | None) -> RandomNode | None:
    if not head:
        return None
    m: dict[RandomNode, RandomNode] = {}
    cur = head
    while cur:
        m[cur] = RandomNode(cur.val)
        cur = cur.next
    cur = head
    while cur:
        m[cur].next = m.get(cur.next) if cur.next else None
        m[cur].random = m.get(cur.random) if cur.random else None
        cur = cur.next
    return m[head]
```

**TypeScript:**
```typescript
class RandomNode {
  val: number;
  next: RandomNode | null;
  random: RandomNode | null;
  constructor(v: number, n: RandomNode | null = null, r: RandomNode | null = null) { this.val = v; this.next = n; this.random = r; }
}

function copyRandomList(head: RandomNode | null): RandomNode | null {
  if (!head) return null;
  const m = new Map<RandomNode, RandomNode>();
  let cur: RandomNode | null = head;
  while (cur) { m.set(cur, new RandomNode(cur.val)); cur = cur.next; }
  cur = head;
  while (cur) {
    m.get(cur)!.next = cur.next ? m.get(cur.next)! : null;
    m.get(cur)!.random = cur.random ? m.get(cur.random)! : null;
    cur = cur.next;
  }
  return m.get(head)!;
}
```

**Java:**
```java
import java.util.*;
class Node {
    int val; Node next, random;
    Node(int val) { this.val = val; }
}
class Solution {
    public Node copyRandomList(Node head) {
        if (head == null) return null;
        Map<Node, Node> m = new HashMap<>();
        for (Node cur = head; cur != null; cur = cur.next) m.put(cur, new Node(cur.val));
        for (Node cur = head; cur != null; cur = cur.next) {
            m.get(cur).next = m.get(cur.next);
            m.get(cur).random = m.get(cur.random);
        }
        return m.get(head);
    }
}
```

**Key points:**
- First pass creates the clones; second pass wires pointers via the map.
- Handles null `next` and `random` without special cases.
- An O(1)-space variant interleaves clones into the original list, then splits.

**Tags:** #algorithm

---

### 32. Linked List Cycle

**Difficulty:** Easy
**Topics:** linked-list, two-pointer
**Position:** ICT3
**Years:** ICT3

**Question:** Determine whether a linked list has a cycle. Bonus: return the cycle's start node.

**Approach:** Floyd's tortoise and hare. `slow` advances 1, `fast` advances 2. If they meet, cycle exists. To find start, reset one pointer to head and advance both by 1 until they meet. O(n) time, O(1) space.

**Python:**
```python
def detect_cycle(head: ListNode | None) -> ListNode | None:
    slow = fast = head
    while fast and fast.next:
        slow = slow.next  # type: ignore
        fast = fast.next.next
        if slow is fast:
            p = head
            while p is not slow:
                p = p.next  # type: ignore
                slow = slow.next  # type: ignore
            return p
    return None
```

**TypeScript:**
```typescript
function detectCycle(head: ListNode | null): ListNode | null {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow!.next;
    fast = fast.next.next;
    if (slow === fast) {
      let p = head;
      while (p !== slow) { p = p!.next; slow = slow!.next; }
      return p;
    }
  }
  return null;
}
```

**Java:**
```java
class Solution {
    public ListNode detectCycle(ListNode head) {
        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) {
                ListNode p = head;
                while (p != slow) { p = p.next; slow = slow.next; }
                return p;
            }
        }
        return null;
    }
}
```

**Key points:**
- The fast pointer doubles up the slow pointer until they meet inside the cycle.
- The distance from head to cycle start equals the distance from meeting point to cycle start (mod cycle length).
- Using a hash set is O(n) extra space; Floyd's is O(1).

**Tags:** #algorithm

---

### 33. Intersection of Two Linked Lists

**Difficulty:** Easy
**Topics:** linked-list, two-pointer
**Position:** ICT3
**Years:** ICT3

**Question:** Given two singly linked lists that may merge at some node, return the intersection node, or null.

**Approach:** Two pointers `a, b` start at heads. When `a` hits end, redirect to `headB`; same for `b`. They traverse `lenA + lenB` and meet at intersection (or null). O(n+m) time, O(1) space.

**Python:**
```python
def get_intersection_node(headA: ListNode | None, headB: ListNode | None) -> ListNode | None:
    if not headA or not headB:
        return None
    a, b = headA, headB
    while a is not b:
        a = a.next if a else headB
        b = b.next if b else headA
    return a
```

**TypeScript:**
```typescript
function getIntersectionNode(headA: ListNode | null, headB: ListNode | null): ListNode | null {
  if (!headA || !headB) return null;
  let a: ListNode | null = headA, b: ListNode | null = headB;
  while (a !== b) {
    a = a ? a.next : headB;
    b = b ? b.next : headA;
  }
  return a;
}
```

**Java:**
```java
class Solution {
    public ListNode getIntersectionNode(ListNode headA, ListNode headB) {
        if (headA == null || headB == null) return null;
        ListNode a = headA, b = headB;
        while (a != b) {
            a = (a == null) ? headB : a.next;
            b = (b == null) ? headA : b.next;
        }
        return a;
    }
}
```

**Key points:**
- Swapping heads on null equalizes the total walk to `lenA + lenB`.
- The pointers meet at the intersection node, or both at `null` if disjoint.
- Compare node identity, not values — duplicate values are allowed.

**Tags:** #algorithm

---

### 34. Reorder List

**Difficulty:** Medium
**Topics:** linked-list, two-pointer
**Position:** ICT4
**Years:** ICT3-ICT4

**Question:** Given list L0 -> L1 -> ... -> Ln-1 -> Ln, reorder it in-place to L0 -> Ln -> L1 -> Ln-1 -> ...

**Approach:** Three steps: (1) find middle with slow/fast pointers, (2) reverse second half, (3) merge two halves alternately. O(n) time, O(1) space. Watch null termination of merged list.

**Python:**
```python
def reorder_list(head: ListNode | None) -> None:
    if not head or not head.next:
        return
    slow, fast = head, head
    while fast and fast.next:
        slow = slow.next  # type: ignore
        fast = fast.next.next
    prev, cur = None, slow.next  # type: ignore
    slow.next = None  # type: ignore
    while cur:
        nxt = cur.next; cur.next = prev; prev = cur; cur = nxt
    a, b = head, prev
    while b:
        an, bn = a.next, b.next  # type: ignore
        a.next = b; b.next = an  # type: ignore
        a, b = an, bn
```

**TypeScript:**
```typescript
function reorderList(head: ListNode | null): void {
  if (!head || !head.next) return;
  let slow = head, fast: ListNode | null = head;
  while (fast && fast.next) { slow = slow.next!; fast = fast.next.next; }
  let prev: ListNode | null = null, cur: ListNode | null = slow.next;
  slow.next = null;
  while (cur) { const nx: ListNode | null = cur.next; cur.next = prev; prev = cur; cur = nx; }
  let a: ListNode | null = head, b = prev;
  while (b) {
    const an: ListNode | null = a!.next, bn: ListNode | null = b.next;
    a!.next = b; b.next = an;
    a = an; b = bn;
  }
}
```

**Java:**
```java
class Solution {
    public void reorderList(ListNode head) {
        if (head == null || head.next == null) return;
        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) { slow = slow.next; fast = fast.next.next; }
        ListNode prev = null, cur = slow.next;
        slow.next = null;
        while (cur != null) { ListNode nx = cur.next; cur.next = prev; prev = cur; cur = nx; }
        ListNode a = head, b = prev;
        while (b != null) {
            ListNode an = a.next, bn = b.next;
            a.next = b; b.next = an;
            a = an; b = bn;
        }
    }
}
```

**Key points:**
- Cut the list at the middle before reversing the right half.
- The right half is shorter or equal, so the merge naturally terminates.
- All work is in-place — no extra allocations beyond a few pointers.

**Tags:** #algorithm

---

### 35. Binary Tree Level Order Traversal

**Difficulty:** Medium
**Topics:** tree, bfs, queue
**Position:** ICT3
**Years:** ICT3

**Question:** Return the level-order traversal of a binary tree as a list of lists (one per level).

**Approach:** BFS with queue. At each level, record current queue size `k`, pop `k` nodes into a level list, push their children. O(n) time, O(w) space where w is max width.

**Python:**
```python
from collections import deque

class TreeNode:
    def __init__(self, val: int = 0, left: "TreeNode | None" = None, right: "TreeNode | None" = None) -> None:
        self.val = val; self.left = left; self.right = right

def level_order(root: TreeNode | None) -> list[list[int]]:
    if not root:
        return []
    out: list[list[int]] = []
    q: deque[TreeNode] = deque([root])
    while q:
        level = []
        for _ in range(len(q)):
            node = q.popleft()
            level.append(node.val)
            if node.left: q.append(node.left)
            if node.right: q.append(node.right)
        out.append(level)
    return out
```

**TypeScript:**
```typescript
function levelOrder(root: TreeNode | null): number[][] {
  if (!root) return [];
  const out: number[][] = [];
  let q: TreeNode[] = [root];
  while (q.length) {
    const level: number[] = [];
    const next: TreeNode[] = [];
    for (const n of q) {
      level.push(n.val);
      if (n.left) next.push(n.left);
      if (n.right) next.push(n.right);
    }
    out.push(level);
    q = next;
  }
  return out;
}
```

**Java:**
```java
import java.util.*;
class Solution {
    public List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> out = new ArrayList<>();
        if (root == null) return out;
        Deque<TreeNode> q = new ArrayDeque<>();
        q.offer(root);
        while (!q.isEmpty()) {
            int sz = q.size();
            List<Integer> level = new ArrayList<>(sz);
            for (int i = 0; i < sz; i++) {
                TreeNode n = q.poll();
                level.add(n.val);
                if (n.left != null) q.offer(n.left);
                if (n.right != null) q.offer(n.right);
            }
            out.add(level);
        }
        return out;
    }
}
```

**Key points:**
- Capture queue size at the start of each level to delimit it.
- Empty tree returns an empty list.
- Pattern generalizes to N-ary trees with one tweak.

**Tags:** #algorithm

---

### 36. Binary Tree Zigzag Level Order Traversal

**Difficulty:** Medium
**Topics:** tree, bfs, deque
**Position:** ICT4
**Years:** ICT3-ICT4

**Question:** Return level order but alternate L->R and R->L per level.

**Approach:** Standard BFS but toggle a `reverse` flag per level — either reverse the level list before appending, or use a deque and append to front/back accordingly. O(n) time, O(w) space.

**Python:**
```python
from collections import deque

def zigzag_level_order(root: TreeNode | None) -> list[list[int]]:
    if not root:
        return []
    out: list[list[int]] = []
    q: deque[TreeNode] = deque([root])
    ltr = True
    while q:
        level = deque()
        for _ in range(len(q)):
            node = q.popleft()
            if ltr: level.append(node.val)
            else: level.appendleft(node.val)
            if node.left: q.append(node.left)
            if node.right: q.append(node.right)
        out.append(list(level))
        ltr = not ltr
    return out
```

**TypeScript:**
```typescript
function zigzagLevelOrder(root: TreeNode | null): number[][] {
  if (!root) return [];
  const out: number[][] = [];
  let q: TreeNode[] = [root];
  let ltr = true;
  while (q.length) {
    const level: number[] = [];
    const next: TreeNode[] = [];
    for (const n of q) {
      if (ltr) level.push(n.val); else level.unshift(n.val);
      if (n.left) next.push(n.left);
      if (n.right) next.push(n.right);
    }
    out.push(level);
    q = next;
    ltr = !ltr;
  }
  return out;
}
```

**Java:**
```java
import java.util.*;
class Solution {
    public List<List<Integer>> zigzagLevelOrder(TreeNode root) {
        List<List<Integer>> out = new ArrayList<>();
        if (root == null) return out;
        Deque<TreeNode> q = new ArrayDeque<>();
        q.offer(root);
        boolean ltr = true;
        while (!q.isEmpty()) {
            int sz = q.size();
            LinkedList<Integer> level = new LinkedList<>();
            for (int i = 0; i < sz; i++) {
                TreeNode n = q.poll();
                if (ltr) level.addLast(n.val); else level.addFirst(n.val);
                if (n.left != null) q.offer(n.left);
                if (n.right != null) q.offer(n.right);
            }
            out.add(level);
            ltr = !ltr;
        }
        return out;
    }
}
```

**Key points:**
- Toggling a direction flag is cleaner than reversing after the fact.
- Use a deque (or `unshift`) for O(1) prepend on right-to-left levels.
- Children always pushed left-to-right; direction only affects output ordering.

**Tags:** #algorithm

---

### 37. Binary Tree Right Side View

**Difficulty:** Medium
**Topics:** tree, bfs, dfs
**Position:** ICT4
**Years:** ICT3-ICT4

**Question:** Return the values of nodes visible from the right side of a binary tree, top to bottom.

**Approach:** BFS recording the last node of each level. Or DFS in (root, right, left) order, appending node when depth == result.length. O(n) time, O(h) space.

**Python:**
```python
def right_side_view(root: TreeNode | None) -> list[int]:
    out: list[int] = []
    def dfs(node: TreeNode | None, depth: int) -> None:
        if node is None:
            return
        if depth == len(out):
            out.append(node.val)
        dfs(node.right, depth + 1)
        dfs(node.left, depth + 1)
    dfs(root, 0)
    return out
```

**TypeScript:**
```typescript
function rightSideView(root: TreeNode | null): number[] {
  const out: number[] = [];
  const dfs = (n: TreeNode | null, depth: number): void => {
    if (!n) return;
    if (depth === out.length) out.push(n.val);
    dfs(n.right, depth + 1);
    dfs(n.left, depth + 1);
  };
  dfs(root, 0);
  return out;
}
```

**Java:**
```java
import java.util.*;
class Solution {
    private final List<Integer> out = new ArrayList<>();
    public List<Integer> rightSideView(TreeNode root) { dfs(root, 0); return out; }
    private void dfs(TreeNode n, int depth) {
        if (n == null) return;
        if (depth == out.size()) out.add(n.val);
        dfs(n.right, depth + 1);
        dfs(n.left, depth + 1);
    }
}
```

**Key points:**
- Visiting right child first ensures the first node seen at each depth is the rightmost.
- Append only when depth equals current result length to avoid duplicates per level.
- BFS variant works too; pick whichever feels cleaner.

**Tags:** #algorithm

---

### 38. Populating Next Right Pointers in Each Node

**Difficulty:** Medium
**Topics:** tree, bfs, linked-list
**Position:** ICT4
**Years:** ICT4

**Question:** Given a perfect binary tree, set each node's `next` to its right sibling at the same level (or null).

**Approach:** Level-by-level traversal using established `next` pointers: at level L use them to walk; set `node.left.next = node.right` and `node.right.next = node.next ? node.next.left : null`. O(n) time, O(1) extra space.

**Python:**
```python
class PerfectNode:
    def __init__(self, val: int = 0, left: "PerfectNode | None" = None,
                 right: "PerfectNode | None" = None, next: "PerfectNode | None" = None) -> None:
        self.val = val; self.left = left; self.right = right; self.next = next

def connect(root: PerfectNode | None) -> PerfectNode | None:
    leftmost = root
    while leftmost and leftmost.left:
        node: PerfectNode | None = leftmost
        while node:
            node.left.next = node.right  # type: ignore
            node.right.next = node.next.left if node.next else None  # type: ignore
            node = node.next
        leftmost = leftmost.left
    return root
```

**TypeScript:**
```typescript
class PerfectNode {
  val: number;
  left: PerfectNode | null;
  right: PerfectNode | null;
  next: PerfectNode | null;
  constructor(v = 0, l: PerfectNode | null = null, r: PerfectNode | null = null, n: PerfectNode | null = null) {
    this.val = v; this.left = l; this.right = r; this.next = n;
  }
}

function connect(root: PerfectNode | null): PerfectNode | null {
  let leftmost = root;
  while (leftmost && leftmost.left) {
    let node: PerfectNode | null = leftmost;
    while (node) {
      node.left!.next = node.right;
      node.right!.next = node.next ? node.next.left : null;
      node = node.next;
    }
    leftmost = leftmost.left;
  }
  return root;
}
```

**Java:**
```java
class Node {
    int val; Node left, right, next;
    Node(int val) { this.val = val; }
}
class Solution {
    public Node connect(Node root) {
        Node leftmost = root;
        while (leftmost != null && leftmost.left != null) {
            for (Node node = leftmost; node != null; node = node.next) {
                node.left.next = node.right;
                node.right.next = (node.next != null) ? node.next.left : null;
            }
            leftmost = leftmost.left;
        }
        return root;
    }
}
```

**Key points:**
- Reuse already-set `next` pointers as the traversal mechanism — no queue needed.
- Two wiring rules cover both child links.
- O(1) extra space; only works because the tree is perfect.

**Tags:** #algorithm

---

### 39. Recover Binary Search Tree

**Difficulty:** Hard
**Topics:** tree, bst, inorder
**Position:** ICT5
**Years:** ICT4-ICT5

**Question:** Two nodes of a BST have been swapped by mistake. Recover the tree without changing its structure.

**Approach:** Inorder traversal yields sorted sequence; find two out-of-order positions: first dip's left and last dip's right. Swap their values. Morris traversal achieves O(1) extra space, otherwise O(h) recursion stack. O(n) time.

**Python:**
```python
def recover_tree(root: TreeNode | None) -> None:
    first: TreeNode | None = None
    second: TreeNode | None = None
    prev: TreeNode | None = None
    def inorder(node: TreeNode | None) -> None:
        nonlocal first, second, prev
        if node is None:
            return
        inorder(node.left)
        if prev and prev.val > node.val:
            if first is None:
                first = prev
            second = node
        prev = node
        inorder(node.right)
    inorder(root)
    if first and second:
        first.val, second.val = second.val, first.val
```

**TypeScript:**
```typescript
function recoverTree(root: TreeNode | null): void {
  let first: TreeNode | null = null, second: TreeNode | null = null, prev: TreeNode | null = null;
  const inorder = (n: TreeNode | null): void => {
    if (!n) return;
    inorder(n.left);
    if (prev && prev.val > n.val) {
      if (!first) first = prev;
      second = n;
    }
    prev = n;
    inorder(n.right);
  };
  inorder(root);
  if (first && second) {
    const t = (first as TreeNode).val;
    (first as TreeNode).val = (second as TreeNode).val;
    (second as TreeNode).val = t;
  }
}
```

**Java:**
```java
class Solution {
    private TreeNode first, second, prev;
    public void recoverTree(TreeNode root) {
        inorder(root);
        int t = first.val; first.val = second.val; second.val = t;
    }
    private void inorder(TreeNode n) {
        if (n == null) return;
        inorder(n.left);
        if (prev != null && prev.val > n.val) {
            if (first == null) first = prev;
            second = n;
        }
        prev = n;
        inorder(n.right);
    }
}
```

**Key points:**
- Two swapped nodes create either one or two "dips" in the inorder sequence.
- `first` is set on the earlier dip; `second` keeps updating to capture the latter swap.
- Morris traversal removes the O(h) recursion stack for true O(1) extra space.

**Tags:** #algorithm

---

### 40. Kth Smallest Element in a BST

**Difficulty:** Medium
**Topics:** tree, bst, inorder
**Position:** ICT4
**Years:** ICT3-ICT4

**Question:** Return the k-th smallest element of a BST.

**Approach:** Iterative inorder using a stack: push left spine, pop, decrement k; if k == 0 return node.val; go right. O(h + k) time, O(h) space. Follow-up: with frequent inserts/deletes, augment nodes with subtree count for O(h) lookup.

**Python:**
```python
def kth_smallest(root: TreeNode | None, k: int) -> int:
    stack: list[TreeNode] = []
    cur = root
    while cur or stack:
        while cur:
            stack.append(cur)
            cur = cur.left
        cur = stack.pop()
        k -= 1
        if k == 0:
            return cur.val
        cur = cur.right
    return -1
```

**TypeScript:**
```typescript
function kthSmallest(root: TreeNode | null, k: number): number {
  const stack: TreeNode[] = [];
  let cur = root;
  while (cur || stack.length) {
    while (cur) { stack.push(cur); cur = cur.left; }
    cur = stack.pop()!;
    if (--k === 0) return cur.val;
    cur = cur.right;
  }
  return -1;
}
```

**Java:**
```java
import java.util.*;
class Solution {
    public int kthSmallest(TreeNode root, int k) {
        Deque<TreeNode> stack = new ArrayDeque<>();
        TreeNode cur = root;
        while (cur != null || !stack.isEmpty()) {
            while (cur != null) { stack.push(cur); cur = cur.left; }
            cur = stack.pop();
            if (--k == 0) return cur.val;
            cur = cur.right;
        }
        return -1;
    }
}
```

**Key points:**
- Inorder traversal on a BST yields keys in sorted order.
- Iterative form avoids recursion stack overflow on skewed trees.
- For dynamic trees, augment each node with subtree size for true O(h) lookup.

**Tags:** #algorithm

---

### 41. Inorder Successor in BST

**Difficulty:** Medium
**Topics:** tree, bst
**Position:** ICT4
**Years:** ICT3-ICT4

**Question:** Given a BST node `p`, return its inorder successor (smallest node larger than p).

**Approach:** If `p.right` exists, successor is leftmost of `p.right`. Else, walk from root: track the last node where we went left. O(h) time, O(1) space.

**Python:**
```python
def inorder_successor(root: TreeNode | None, p: TreeNode) -> TreeNode | None:
    if p.right:
        cur = p.right
        while cur.left:
            cur = cur.left
        return cur
    succ: TreeNode | None = None
    cur = root
    while cur:
        if p.val < cur.val:
            succ = cur
            cur = cur.left
        else:
            cur = cur.right
    return succ
```

**TypeScript:**
```typescript
function inorderSuccessor(root: TreeNode | null, p: TreeNode): TreeNode | null {
  if (p.right) {
    let cur = p.right;
    while (cur.left) cur = cur.left;
    return cur;
  }
  let succ: TreeNode | null = null, cur = root;
  while (cur) {
    if (p.val < cur.val) { succ = cur; cur = cur.left; }
    else cur = cur.right;
  }
  return succ;
}
```

**Java:**
```java
class Solution {
    public TreeNode inorderSuccessor(TreeNode root, TreeNode p) {
        if (p.right != null) {
            TreeNode cur = p.right;
            while (cur.left != null) cur = cur.left;
            return cur;
        }
        TreeNode succ = null, cur = root;
        while (cur != null) {
            if (p.val < cur.val) { succ = cur; cur = cur.left; }
            else cur = cur.right;
        }
        return succ;
    }
}
```

**Key points:**
- The two cases (has right child vs not) cover all BST shapes.
- The "last left turn" rule captures the smallest ancestor greater than `p`.
- O(h) without parent pointers; O(1) with them.

**Tags:** #algorithm

---

### 42. Same Tree

**Difficulty:** Easy
**Topics:** tree, dfs, recursion
**Position:** ICT3
**Years:** ICT3

**Question:** Determine whether two binary trees are structurally identical with equal values.

**Approach:** Recursion: both null -> true; one null -> false; values differ -> false; else recurse on left and right children. O(min(n, m)) time, O(h) stack.

**Python:**
```python
def is_same_tree(p: TreeNode | None, q: TreeNode | None) -> bool:
    if p is None and q is None:
        return True
    if p is None or q is None or p.val != q.val:
        return False
    return is_same_tree(p.left, q.left) and is_same_tree(p.right, q.right)
```

**TypeScript:**
```typescript
function isSameTree(p: TreeNode | null, q: TreeNode | null): boolean {
  if (!p && !q) return true;
  if (!p || !q || p.val !== q.val) return false;
  return isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
}
```

**Java:**
```java
class Solution {
    public boolean isSameTree(TreeNode p, TreeNode q) {
        if (p == null && q == null) return true;
        if (p == null || q == null || p.val != q.val) return false;
        return isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
    }
}
```

**Key points:**
- Both null is the success base case; one null implies structural mismatch.
- Value mismatch short-circuits before recursing further.
- Iterative lockstep BFS is an equivalent alternative without stack growth.

**Tags:** #algorithm

---

### 43. Sum Root to Leaf Numbers

**Difficulty:** Medium
**Topics:** tree, dfs, recursion
**Position:** ICT3
**Years:** ICT3-ICT4

**Question:** Each root-to-leaf path represents a number (digits along path). Return the sum of all root-to-leaf numbers.

**Approach:** DFS carrying current accumulated number `cur = cur*10 + node.val`. At leaf, add `cur` to total. O(n) time, O(h) space.

**Python:**
```python
def sum_numbers(root: TreeNode | None) -> int:
    def dfs(node: TreeNode | None, cur: int) -> int:
        if node is None:
            return 0
        cur = cur * 10 + node.val
        if not node.left and not node.right:
            return cur
        return dfs(node.left, cur) + dfs(node.right, cur)
    return dfs(root, 0)
```

**TypeScript:**
```typescript
function sumNumbers(root: TreeNode | null): number {
  const dfs = (n: TreeNode | null, cur: number): number => {
    if (!n) return 0;
    cur = cur * 10 + n.val;
    if (!n.left && !n.right) return cur;
    return dfs(n.left, cur) + dfs(n.right, cur);
  };
  return dfs(root, 0);
}
```

**Java:**
```java
class Solution {
    public int sumNumbers(TreeNode root) { return dfs(root, 0); }
    private int dfs(TreeNode n, int cur) {
        if (n == null) return 0;
        cur = cur * 10 + n.val;
        if (n.left == null && n.right == null) return cur;
        return dfs(n.left, cur) + dfs(n.right, cur);
    }
}
```

**Key points:**
- Carry the running number down the call stack rather than mutating shared state.
- Add to total only at leaves to avoid double-counting partial paths.
- An empty tree contributes 0 by base case.

**Tags:** #algorithm

---

### 44. Path Sum

**Difficulty:** Easy
**Topics:** tree, dfs, recursion
**Position:** ICT3
**Years:** ICT3

**Question:** Given a binary tree and `targetSum`, determine if there is a root-to-leaf path summing to `targetSum`.

**Approach:** DFS subtracting `node.val` from remaining; at leaf, check if remaining equals 0. Be careful with null vs leaf: null is not a leaf. O(n) time, O(h) space.

**Python:**
```python
def has_path_sum(root: TreeNode | None, target_sum: int) -> bool:
    if root is None:
        return False
    if not root.left and not root.right:
        return target_sum == root.val
    remaining = target_sum - root.val
    return has_path_sum(root.left, remaining) or has_path_sum(root.right, remaining)
```

**TypeScript:**
```typescript
function hasPathSum(root: TreeNode | null, targetSum: number): boolean {
  if (!root) return false;
  if (!root.left && !root.right) return targetSum === root.val;
  const remaining = targetSum - root.val;
  return hasPathSum(root.left, remaining) || hasPathSum(root.right, remaining);
}
```

**Java:**
```java
class Solution {
    public boolean hasPathSum(TreeNode root, int targetSum) {
        if (root == null) return false;
        if (root.left == null && root.right == null) return targetSum == root.val;
        int remaining = targetSum - root.val;
        return hasPathSum(root.left, remaining) || hasPathSum(root.right, remaining);
    }
}
```

**Key points:**
- The path must end at a leaf — null children alone don't satisfy the constraint.
- Subtract on the way down, compare at the leaf.
- Short-circuiting `or` cuts off unnecessary subtree traversals.

**Tags:** #algorithm

---

### 45. Convert Sorted Array to Binary Search Tree

**Difficulty:** Easy
**Topics:** tree, bst, recursion, divide-and-conquer
**Position:** ICT3
**Years:** ICT3

**Question:** Given a sorted ascending array, build a height-balanced BST.

**Approach:** Recursion: pick `mid = (l+r)/2` as root, recurse on left half and right half. O(n) time, O(log n) stack. Choosing left-mid vs right-mid gives different valid trees.

**Python:**
```python
def sorted_array_to_bst(nums: list[int]) -> TreeNode | None:
    def build(l: int, r: int) -> TreeNode | None:
        if l > r:
            return None
        mid = (l + r) // 2
        node = TreeNode(nums[mid])
        node.left = build(l, mid - 1)
        node.right = build(mid + 1, r)
        return node
    return build(0, len(nums) - 1)
```

**TypeScript:**
```typescript
function sortedArrayToBST(nums: number[]): TreeNode | null {
  const build = (l: number, r: number): TreeNode | null => {
    if (l > r) return null;
    const mid = (l + r) >> 1;
    const node = new TreeNode(nums[mid]);
    node.left = build(l, mid - 1);
    node.right = build(mid + 1, r);
    return node;
  };
  return build(0, nums.length - 1);
}
```

**Java:**
```java
class Solution {
    public TreeNode sortedArrayToBST(int[] nums) { return build(nums, 0, nums.length - 1); }
    private TreeNode build(int[] nums, int l, int r) {
        if (l > r) return null;
        int mid = (l + r) >>> 1;
        TreeNode node = new TreeNode(nums[mid]);
        node.left = build(nums, l, mid - 1);
        node.right = build(nums, mid + 1, r);
        return node;
    }
}
```

**Key points:**
- Picking the middle as root keeps subtree sizes balanced within one.
- Sorted input guarantees BST property automatically.
- Either floor or ceiling middle yields a valid height-balanced result.

**Tags:** #algorithm

---

### 46. Number of 1 Bits

**Difficulty:** Easy
**Topics:** bit-manipulation
**Position:** ICT3
**Years:** ICT3

**Question:** Return the number of set bits in an unsigned 32-bit integer.

**Approach:** Brian Kernighan: `while (n) { n &= n-1; count++; }` — strips lowest set bit each iteration. O(popcount) time, O(1) space. Built-in `popcount` is the production answer.

**Python:**
```python
def hamming_weight(n: int) -> int:
    count = 0
    while n:
        n &= n - 1
        count += 1
    return count
```

**TypeScript:**
```typescript
function hammingWeight(n: number): number {
  let count = 0;
  while (n !== 0) {
    n &= n - 1;
    count++;
  }
  return count;
}
```

**Java:**
```java
class Solution {
    public int hammingWeight(int n) {
        int count = 0;
        while (n != 0) { n &= n - 1; count++; }
        return count;
    }
}
```

**Key points:**
- `n & (n - 1)` clears the lowest set bit in one operation.
- Loop runs once per set bit — O(popcount), not O(bit-width).
- Python has `int.bit_count()`; most compiled languages expose `popcount`/`POPCNT`.

**Tags:** #algorithm

---

### 47. Counting Bits

**Difficulty:** Easy
**Topics:** bit-manipulation, dp
**Position:** ICT3
**Years:** ICT3-ICT4

**Question:** Given n, return an array `ans[i]` = number of 1-bits in `i` for 0 <= i <= n.

**Approach:** DP using `ans[i] = ans[i >> 1] + (i & 1)`, or `ans[i] = ans[i & (i-1)] + 1`. O(n) time, O(n) space (output).

**Python:**
```python
def count_bits(n: int) -> list[int]:
    ans = [0] * (n + 1)
    for i in range(1, n + 1):
        ans[i] = ans[i >> 1] + (i & 1)
    return ans
```

**TypeScript:**
```typescript
function countBits(n: number): number[] {
  const ans = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    ans[i] = ans[i >> 1] + (i & 1);
  }
  return ans;
}
```

**Java:**
```java
class Solution {
    public int[] countBits(int n) {
        int[] ans = new int[n + 1];
        for (int i = 1; i <= n; i++) ans[i] = ans[i >> 1] + (i & 1);
        return ans;
    }
}
```

**Key points:**
- `i >> 1` removes the lowest bit, so `bits(i) = bits(i/2) + low_bit(i)`.
- Building from `ans[0] = 0` upward yields each entry in O(1).
- Alternative `ans[i] = ans[i & (i-1)] + 1` uses Kernighan's trick.

**Tags:** #algorithm

---

### 48. Single Number

**Difficulty:** Easy
**Topics:** bit-manipulation, xor
**Position:** ICT3
**Years:** ICT3

**Question:** Every element appears twice except one. Find that single element in O(n) time and O(1) space.

**Approach:** XOR all elements. Pairs cancel (a ^ a = 0); the single survives. O(n) time, O(1) space. Follow-up "every element appears three times except one" → bit counts mod 3, or two-variable XOR state machine.

**Python:**
```python
def single_number(nums: list[int]) -> int:
    result = 0
    for n in nums:
        result ^= n
    return result
```

**TypeScript:**
```typescript
function singleNumber(nums: number[]): number {
  let result = 0;
  for (const n of nums) result ^= n;
  return result;
}
```

**Java:**
```java
class Solution {
    public int singleNumber(int[] nums) {
        int result = 0;
        for (int n : nums) result ^= n;
        return result;
    }
}
```

**Key points:**
- XOR is commutative and associative, so order does not matter.
- `a ^ a = 0` and `a ^ 0 = a` make pairs cancel cleanly.
- Constant space; no hash set or sorting required.

**Tags:** #algorithm

---

### 49. Missing Number

**Difficulty:** Easy
**Topics:** bit-manipulation, math
**Position:** ICT3
**Years:** ICT3

**Question:** Given array with n distinct numbers in [0..n], find the missing one.

**Approach:** XOR all indices [0..n] with all elements; pairs cancel and the missing one remains. Or use sum formula `n*(n+1)/2 - sum(nums)`. XOR avoids overflow. O(n) time, O(1) space.

**Python:**
```python
def missing_number(nums: list[int]) -> int:
    result = len(nums)
    for i, v in enumerate(nums):
        result ^= i ^ v
    return result
```

**TypeScript:**
```typescript
function missingNumber(nums: number[]): number {
  let result = nums.length;
  for (let i = 0; i < nums.length; i++) {
    result ^= i ^ nums[i];
  }
  return result;
}
```

**Java:**
```java
class Solution {
    public int missingNumber(int[] nums) {
        int result = nums.length;
        for (int i = 0; i < nums.length; i++) result ^= i ^ nums[i];
        return result;
    }
}
```

**Key points:**
- Initialize with `n` to include the missing top index without an extra loop.
- XOR avoids overflow that the sum-formula version risks for large `n`.
- Each present number cancels with its index; the missing one survives.

**Tags:** #algorithm

---

### 50. Find All Numbers Disappeared in an Array

**Difficulty:** Easy
**Topics:** arrays, in-place
**Position:** ICT3
**Years:** ICT3

**Question:** Given `nums` of length n with values in [1..n], return all numbers in [1..n] not present in `nums`. O(n) time, O(1) extra.

**Approach:** Use the array itself as a hash. For each `v = abs(nums[i])`, mark `nums[v-1]` negative. Indices with positive values are the missing numbers (i+1). O(n) time, O(1) extra.

**Python:**
```python
def find_disappeared_numbers(nums: list[int]) -> list[int]:
    for v in nums:
        idx = abs(v) - 1
        if nums[idx] > 0:
            nums[idx] = -nums[idx]
    return [i + 1 for i, v in enumerate(nums) if v > 0]
```

**TypeScript:**
```typescript
function findDisappearedNumbers(nums: number[]): number[] {
  for (const v of nums) {
    const idx = Math.abs(v) - 1;
    if (nums[idx] > 0) nums[idx] = -nums[idx];
  }
  const out: number[] = [];
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] > 0) out.push(i + 1);
  }
  return out;
}
```

**Java:**
```java
import java.util.*;
class Solution {
    public List<Integer> findDisappearedNumbers(int[] nums) {
        for (int v : nums) {
            int idx = Math.abs(v) - 1;
            if (nums[idx] > 0) nums[idx] = -nums[idx];
        }
        List<Integer> out = new ArrayList<>();
        for (int i = 0; i < nums.length; i++) {
            if (nums[i] > 0) out.add(i + 1);
        }
        return out;
    }
}
```

**Key points:**
- Encode "seen" as the sign bit of the value at the seen index.
- Take `abs(v)` since prior marks may have flipped the sign already.
- Mutates input; if disallowed, restore signs after collecting the result.

**Tags:** #algorithm

---

### 51. Majority Element

**Difficulty:** Easy
**Topics:** arrays, voting
**Position:** ICT3
**Years:** ICT3

**Question:** Find the element appearing more than n/2 times in an array (guaranteed to exist).

**Approach:** Boyer-Moore voting: candidate and count; on match increment, else decrement; reset candidate when count hits 0. O(n) time, O(1) space. Elegant invariant: surviving candidate is the majority if one exists.

**Python:**
```python
def majority_element(nums: list[int]) -> int:
    candidate = 0
    count = 0
    for n in nums:
        if count == 0:
            candidate = n
        count += 1 if n == candidate else -1
    return candidate
```

**TypeScript:**
```typescript
function majorityElement(nums: number[]): number {
  let candidate = 0, count = 0;
  for (const n of nums) {
    if (count === 0) candidate = n;
    count += n === candidate ? 1 : -1;
  }
  return candidate;
}
```

**Java:**
```java
class Solution {
    public int majorityElement(int[] nums) {
        int candidate = 0, count = 0;
        for (int n : nums) {
            if (count == 0) candidate = n;
            count += (n == candidate) ? 1 : -1;
        }
        return candidate;
    }
}
```

**Key points:**
- Pairing each majority vote with one non-majority leaves the majority surviving.
- Works only when a majority is guaranteed; otherwise verify with a second pass.
- O(1) extra space beats the O(n) hash map approach.

**Tags:** #algorithm

---

### 52. Maximum Product Subarray

**Difficulty:** Medium
**Topics:** arrays, dp
**Position:** ICT4
**Years:** ICT3-ICT4

**Question:** Find the contiguous subarray with the largest product.

**Approach:** Track running `maxProd` and `minProd` (negative * negative can become big). At each step, candidates are `nums[i]`, `maxProd * nums[i]`, `minProd * nums[i]`. Update both. Track global max. O(n) time, O(1) space.

**Python:**
```python
def max_product(nums: list[int]) -> int:
    hi = lo = best = nums[0]
    for x in nums[1:]:
        if x < 0:
            hi, lo = lo, hi
        hi = max(x, hi * x)
        lo = min(x, lo * x)
        best = max(best, hi)
    return best
```

**TypeScript:**
```typescript
function maxProduct(nums: number[]): number {
  let hi = nums[0], lo = nums[0], best = nums[0];
  for (let i = 1; i < nums.length; i++) {
    const x = nums[i];
    if (x < 0) { [hi, lo] = [lo, hi]; }
    hi = Math.max(x, hi * x);
    lo = Math.min(x, lo * x);
    best = Math.max(best, hi);
  }
  return best;
}
```

**Java:**
```java
class Solution {
    public int maxProduct(int[] nums) {
        int hi = nums[0], lo = nums[0], best = nums[0];
        for (int i = 1; i < nums.length; i++) {
            int x = nums[i];
            if (x < 0) { int t = hi; hi = lo; lo = t; }
            hi = Math.max(x, hi * x);
            lo = Math.min(x, lo * x);
            best = Math.max(best, hi);
        }
        return best;
    }
}
```

**Key points:**
- Swap hi/lo on a negative element so multiplication propagates correctly.
- Tracking only the max would miss negative-negative product opportunities.
- Encountering a zero resets both hi and lo to the current element.

**Tags:** #algorithm

---

### 53. Jump Game

**Difficulty:** Medium
**Topics:** arrays, greedy
**Position:** ICT3
**Years:** ICT3-ICT4

**Question:** Each element of `nums` is max jump length from that position. Determine if you can reach the last index.

**Approach:** Greedy: track furthest reachable index. Iterate i; if `i > maxReach`, return false; else `maxReach = max(maxReach, i + nums[i])`. If `maxReach >= n-1` return true. O(n) time, O(1) space.

**Python:**
```python
def can_jump(nums: list[int]) -> bool:
    max_reach = 0
    for i, jump in enumerate(nums):
        if i > max_reach:
            return False
        max_reach = max(max_reach, i + jump)
    return True
```

**TypeScript:**
```typescript
function canJump(nums: number[]): boolean {
  let maxReach = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i > maxReach) return false;
    maxReach = Math.max(maxReach, i + nums[i]);
  }
  return true;
}
```

**Java:**
```java
class Solution {
    public boolean canJump(int[] nums) {
        int maxReach = 0;
        for (int i = 0; i < nums.length; i++) {
            if (i > maxReach) return false;
            maxReach = Math.max(maxReach, i + nums[i]);
        }
        return true;
    }
}
```

**Key points:**
- Greedy works because any reachable index extends reach to that point's max.
- Bail as soon as an unreachable index is encountered.
- O(1) space — no DP table required.

**Tags:** #algorithm

---

### 54. Jump Game II

**Difficulty:** Medium
**Topics:** arrays, greedy, bfs
**Position:** ICT4
**Years:** ICT4

**Question:** Same setup but return the minimum number of jumps to reach the last index.

**Approach:** BFS by jump count, tracked greedily. Maintain `currentEnd` (end of current jump) and `farthest` (max reachable next). When i reaches `currentEnd`, increment jumps and set `currentEnd = farthest`. O(n) time, O(1) space.

**Python:**
```python
def jump(nums: list[int]) -> int:
    jumps = current_end = farthest = 0
    for i in range(len(nums) - 1):
        farthest = max(farthest, i + nums[i])
        if i == current_end:
            jumps += 1
            current_end = farthest
    return jumps
```

**TypeScript:**
```typescript
function jump(nums: number[]): number {
  let jumps = 0, currentEnd = 0, farthest = 0;
  for (let i = 0; i < nums.length - 1; i++) {
    farthest = Math.max(farthest, i + nums[i]);
    if (i === currentEnd) {
      jumps++;
      currentEnd = farthest;
    }
  }
  return jumps;
}
```

**Java:**
```java
class Solution {
    public int jump(int[] nums) {
        int jumps = 0, currentEnd = 0, farthest = 0;
        for (int i = 0; i < nums.length - 1; i++) {
            farthest = Math.max(farthest, i + nums[i]);
            if (i == currentEnd) {
                jumps++;
                currentEnd = farthest;
            }
        }
        return jumps;
    }
}
```

**Key points:**
- Each "level" of BFS represents one jump's worth of reachable indices.
- Iterate up to `len - 2`; once we've decided to jump from the last range, we are done.
- The greedy choice (always jump to farthest reachable) is optimal here.

**Tags:** #algorithm

---

### 55. Unique Paths

**Difficulty:** Medium
**Topics:** dp, combinatorics
**Position:** ICT3
**Years:** ICT3

**Question:** In an m x n grid, a robot moves only right or down from top-left to bottom-right. How many unique paths?

**Approach:** DP `dp[i][j] = dp[i-1][j] + dp[i][j-1]`, base `dp[0][*] = dp[*][0] = 1`. Roll to 1D for O(n) space. Closed form: C(m+n-2, m-1) for math fans. O(mn) time.

**Python:**
```python
def unique_paths(m: int, n: int) -> int:
    row = [1] * n
    for _ in range(1, m):
        for j in range(1, n):
            row[j] += row[j - 1]
    return row[-1]
```

**TypeScript:**
```typescript
function uniquePaths(m: number, n: number): number {
  const row = new Array(n).fill(1);
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      row[j] += row[j - 1];
    }
  }
  return row[n - 1];
}
```

**Java:**
```java
class Solution {
    public int uniquePaths(int m, int n) {
        int[] row = new int[n];
        java.util.Arrays.fill(row, 1);
        for (int i = 1; i < m; i++) {
            for (int j = 1; j < n; j++) row[j] += row[j - 1];
        }
        return row[n - 1];
    }
}
```

**Key points:**
- Rolling array reduces memory from O(mn) to O(n).
- Each cell depends only on the row above (now `row[j]`) and the left neighbor (`row[j-1]`).
- The closed-form C(m+n-2, m-1) is O(min(m, n)) if precision permits.

**Tags:** #algorithm

---

### 56. Minimum Path Sum

**Difficulty:** Medium
**Topics:** dp, grid
**Position:** ICT3
**Years:** ICT3-ICT4

**Question:** Given an m x n grid of non-negative numbers, find a path from top-left to bottom-right minimizing the sum (moves: down or right).

**Approach:** DP `dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1])`. In-place modification of `grid` gives O(1) extra. O(mn) time.

**Python:**
```python
def min_path_sum(grid: list[list[int]]) -> int:
    m, n = len(grid), len(grid[0])
    for i in range(m):
        for j in range(n):
            if i == 0 and j == 0: continue
            up = grid[i - 1][j] if i > 0 else float("inf")
            left = grid[i][j - 1] if j > 0 else float("inf")
            grid[i][j] += min(up, left)
    return grid[m - 1][n - 1]
```

**TypeScript:**
```typescript
function minPathSum(grid: number[][]): number {
  const m = grid.length, n = grid[0].length;
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (i === 0 && j === 0) continue;
      const up = i > 0 ? grid[i - 1][j] : Infinity;
      const left = j > 0 ? grid[i][j - 1] : Infinity;
      grid[i][j] += Math.min(up, left);
    }
  }
  return grid[m - 1][n - 1];
}
```

**Java:**
```java
class Solution {
    public int minPathSum(int[][] grid) {
        int m = grid.length, n = grid[0].length;
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                if (i == 0 && j == 0) continue;
                int up = i > 0 ? grid[i - 1][j] : Integer.MAX_VALUE;
                int left = j > 0 ? grid[i][j - 1] : Integer.MAX_VALUE;
                grid[i][j] += Math.min(up, left);
            }
        }
        return grid[m - 1][n - 1];
    }
}
```

**Key points:**
- Update grid in place to achieve O(1) extra space.
- Use `Infinity` sentinels for out-of-bounds neighbors so `min` works without branches.
- O(mn) time is asymptotically optimal — every cell must be visited.

**Tags:** #algorithm

---

### 57. Triangle

**Difficulty:** Medium
**Topics:** dp, bottom-up
**Position:** ICT4
**Years:** ICT3-ICT4

**Question:** Given a triangle of numbers, find the minimum path sum from top to bottom; at each step you may move to adjacent indices on the row below.

**Approach:** Bottom-up DP. Start from the last row; for each level above, `dp[j] = triangle[i][j] + min(dp[j], dp[j+1])`. Result is `dp[0]`. O(n^2) time, O(n) space.

**Python:**
```python
def minimum_total(triangle: list[list[int]]) -> int:
    dp = triangle[-1][:]
    for i in range(len(triangle) - 2, -1, -1):
        for j in range(len(triangle[i])):
            dp[j] = triangle[i][j] + min(dp[j], dp[j + 1])
    return dp[0]
```

**TypeScript:**
```typescript
function minimumTotal(triangle: number[][]): number {
  const dp = [...triangle[triangle.length - 1]];
  for (let i = triangle.length - 2; i >= 0; i--) {
    for (let j = 0; j < triangle[i].length; j++) {
      dp[j] = triangle[i][j] + Math.min(dp[j], dp[j + 1]);
    }
  }
  return dp[0];
}
```

**Java:**
```java
import java.util.*;
class Solution {
    public int minimumTotal(List<List<Integer>> triangle) {
        int n = triangle.size();
        int[] dp = new int[n + 1];
        for (int i = n - 1; i >= 0; i--) {
            List<Integer> row = triangle.get(i);
            for (int j = 0; j < row.size(); j++) {
                dp[j] = row.get(j) + Math.min(dp[j], dp[j + 1]);
            }
        }
        return dp[0];
    }
}
```

**Key points:**
- Going bottom-up avoids needing to handle row-width edge cases on the way down.
- A 1D dp array suffices because each cell depends on only two below.
- Final answer accumulates into `dp[0]` after the loop.

**Tags:** #algorithm

---

### 58. Word Pattern

**Difficulty:** Easy
**Topics:** strings, hashmap
**Position:** ICT3
**Years:** ICT3

**Question:** Given a `pattern` and a string `s`, determine if `s` follows the pattern (bijection between letters and space-separated words).

**Approach:** Two maps: char->word and word->char. Walk pairs in lockstep; reject on any mapping conflict. Reject if lengths differ. O(n) time, O(k) space.

**Python:**
```python
def word_pattern(pattern: str, s: str) -> bool:
    words = s.split()
    if len(pattern) != len(words):
        return False
    c2w: dict[str, str] = {}
    w2c: dict[str, str] = {}
    for c, w in zip(pattern, words):
        if c in c2w and c2w[c] != w: return False
        if w in w2c and w2c[w] != c: return False
        c2w[c] = w
        w2c[w] = c
    return True
```

**TypeScript:**
```typescript
function wordPattern(pattern: string, s: string): boolean {
  const words = s.split(" ");
  if (pattern.length !== words.length) return false;
  const c2w = new Map<string, string>();
  const w2c = new Map<string, string>();
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i], w = words[i];
    if (c2w.has(c) && c2w.get(c) !== w) return false;
    if (w2c.has(w) && w2c.get(w) !== c) return false;
    c2w.set(c, w);
    w2c.set(w, c);
  }
  return true;
}
```

**Java:**
```java
import java.util.*;
class Solution {
    public boolean wordPattern(String pattern, String s) {
        String[] words = s.split(" ");
        if (pattern.length() != words.length) return false;
        Map<Character, String> c2w = new HashMap<>();
        Map<String, Character> w2c = new HashMap<>();
        for (int i = 0; i < pattern.length(); i++) {
            char c = pattern.charAt(i);
            String w = words[i];
            if (c2w.containsKey(c) && !c2w.get(c).equals(w)) return false;
            if (w2c.containsKey(w) && w2c.get(w) != c) return false;
            c2w.put(c, w);
            w2c.put(w, c);
        }
        return true;
    }
}
```

**Key points:**
- Two-direction mapping enforces the bijection requirement.
- Length mismatch is the cheapest early reject.
- O(n) time over the longer of the two inputs.

**Tags:** #algorithm

---

### 59. Isomorphic Strings

**Difficulty:** Easy
**Topics:** strings, hashmap
**Position:** ICT3
**Years:** ICT3

**Question:** Given `s` and `t`, determine if characters of `s` can be replaced to get `t` preserving order (bijection).

**Approach:** Two arrays/maps for last-seen index of each char in s and in t. At each i, the indices must match (both -1 or both equal). Update. O(n) time, O(1) space (fixed alphabet).

**Python:**
```python
def is_isomorphic(s: str, t: str) -> bool:
    if len(s) != len(t):
        return False
    s2t: dict[str, str] = {}
    t2s: dict[str, str] = {}
    for a, b in zip(s, t):
        if s2t.get(a, b) != b or t2s.get(b, a) != a:
            return False
        s2t[a] = b
        t2s[b] = a
    return True
```

**TypeScript:**
```typescript
function isIsomorphic(s: string, t: string): boolean {
  if (s.length !== t.length) return false;
  const s2t = new Map<string, string>();
  const t2s = new Map<string, string>();
  for (let i = 0; i < s.length; i++) {
    const a = s[i], b = t[i];
    if ((s2t.has(a) && s2t.get(a) !== b) || (t2s.has(b) && t2s.get(b) !== a)) return false;
    s2t.set(a, b);
    t2s.set(b, a);
  }
  return true;
}
```

**Java:**
```java
import java.util.*;
class Solution {
    public boolean isIsomorphic(String s, String t) {
        if (s.length() != t.length()) return false;
        Map<Character, Character> s2t = new HashMap<>();
        Map<Character, Character> t2s = new HashMap<>();
        for (int i = 0; i < s.length(); i++) {
            char a = s.charAt(i), b = t.charAt(i);
            if (s2t.containsKey(a) && s2t.get(a) != b) return false;
            if (t2s.containsKey(b) && t2s.get(b) != a) return false;
            s2t.put(a, b);
            t2s.put(b, a);
        }
        return true;
    }
}
```

**Key points:**
- Both directions must hold; otherwise two `s` chars could map to one `t` char.
- Use `get(...)` with default to combine "missing" and "matching" checks succinctly.
- Length check first prevents partial-string false positives.

**Tags:** #algorithm

---

### 60. Valid Anagram

**Difficulty:** Easy
**Topics:** strings, hashmap, sorting
**Position:** ICT3
**Years:** ICT3

**Question:** Given `s` and `t`, determine if `t` is an anagram of `s`.

**Approach:** Count frequencies (array of 26 for lowercase ASCII). Increment for s, decrement for t; check all zero. O(n) time, O(1) space. Sort-and-compare is O(n log n). For Unicode, use a hashmap.

**Python:**
```python
def is_anagram(s: str, t: str) -> bool:
    if len(s) != len(t):
        return False
    cnt = [0] * 26
    for a, b in zip(s, t):
        cnt[ord(a) - 97] += 1
        cnt[ord(b) - 97] -= 1
    return all(c == 0 for c in cnt)
```

**TypeScript:**
```typescript
function isAnagram(s: string, t: string): boolean {
  if (s.length !== t.length) return false;
  const cnt = new Array(26).fill(0);
  for (let i = 0; i < s.length; i++) {
    cnt[s.charCodeAt(i) - 97]++;
    cnt[t.charCodeAt(i) - 97]--;
  }
  return cnt.every(c => c === 0);
}
```

**Java:**
```java
class Solution {
    public boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) return false;
        int[] cnt = new int[26];
        for (int i = 0; i < s.length(); i++) {
            cnt[s.charAt(i) - 'a']++;
            cnt[t.charAt(i) - 'a']--;
        }
        for (int c : cnt) if (c != 0) return false;
        return true;
    }
}
```

**Key points:**
- Combined increment/decrement avoids a second pass.
- Length mismatch is an early O(1) reject.
- For Unicode, switch to a hashmap keyed by code point.

**Tags:** #algorithm

---

### 61. Lock-Free Bounded Single-Producer Single-Consumer Queue

**Difficulty:** Hard
**Topics:** concurrency, lock-free, ring-buffer, memory-ordering
**Position:** ICT5
**Years:** ICT5

**Question:** Implement a fixed-capacity SPSC queue with no locks, suitable for an audio thread feeding samples to a real-time consumer.

**Approach:** Ring buffer of size N (power of 2), `head` (writer) and `tail` (reader) as atomic indices. Producer checks `head - tail < N` then writes slot and increments head with release ordering. Consumer checks `head - tail > 0` then reads slot and increments tail with release ordering; loads use acquire. Pad indices to separate cache lines (false-sharing avoidance). Wraparound via `idx & (N-1)`.

**Python:**
```python
import threading
from typing import TypeVar, Generic

T = TypeVar("T")

class SPSCQueue(Generic[T]):
    def __init__(self, capacity: int) -> None:
        assert capacity & (capacity - 1) == 0, "capacity must be a power of 2"
        self.buf: list[T | None] = [None] * capacity
        self.mask = capacity - 1
        self.head = 0  # producer-only
        self.tail = 0  # consumer-only
        self.lock = threading.Lock()  # Python GIL is not enough across native code

    def push(self, item: T) -> bool:
        with self.lock:
            if self.head - self.tail >= len(self.buf):
                return False
            self.buf[self.head & self.mask] = item
            self.head += 1
            return True

    def pop(self) -> T | None:
        with self.lock:
            if self.head == self.tail:
                return None
            item = self.buf[self.tail & self.mask]
            self.tail += 1
            return item
```

**TypeScript:**
```typescript
class SPSCQueue<T> {
  private buf: (T | undefined)[];
  private mask: number;
  private head = 0;
  private tail = 0;
  constructor(capacity: number) {
    if ((capacity & (capacity - 1)) !== 0) throw new Error("capacity must be a power of 2");
    this.buf = new Array(capacity);
    this.mask = capacity - 1;
  }
  push(item: T): boolean {
    if (this.head - this.tail >= this.buf.length) return false;
    this.buf[this.head & this.mask] = item;
    this.head++;
    return true;
  }
  pop(): T | undefined {
    if (this.head === this.tail) return undefined;
    const item = this.buf[this.tail & this.mask];
    this.tail++;
    return item;
  }
}
```

**Java:**
```java
import java.util.concurrent.atomic.AtomicLong;
class SPSCQueue<T> {
    private final Object[] buf;
    private final int mask;
    private final AtomicLong head = new AtomicLong(0);
    private final AtomicLong tail = new AtomicLong(0);
    public SPSCQueue(int capacity) {
        if ((capacity & (capacity - 1)) != 0) throw new IllegalArgumentException("power of 2");
        this.buf = new Object[capacity];
        this.mask = capacity - 1;
    }
    public boolean push(T item) {
        long h = head.get();
        if (h - tail.get() >= buf.length) return false;
        buf[(int) (h & mask)] = item;
        head.lazySet(h + 1);
        return true;
    }
    @SuppressWarnings("unchecked")
    public T pop() {
        long t = tail.get();
        if (head.get() == t) return null;
        T item = (T) buf[(int) (t & mask)];
        tail.lazySet(t + 1);
        return item;
    }
}
```

**Key points:**
- Power-of-two capacity lets `idx & (N-1)` replace expensive modulo.
- Real lock-free SPSC requires C++ `std::atomic` with acquire/release ordering; Python/JS lack such primitives in pure code.
- Cache-line pad `head` and `tail` separately to eliminate false sharing.

**Complexity:** `push` and `pop` are O(1) and lock-free; a single producer and single consumer coordinate through two atomic indices with no mutex.

**Tags:** #algorithm

---

### 62. Cache-Friendly Matrix Transpose

**Difficulty:** Medium
**Topics:** arrays, cache, memory-layout
**Position:** ICT4
**Years:** ICT4-ICT5

**Question:** Transpose a large N x N matrix in-place (or out-of-place) minimizing cache misses.

**Approach:** Naive double loop suffers because writes (or reads) stride by N, blowing the cache. Use blocking/tiling: transpose B x B blocks at a time (B sized so 2 * B * B * sizeof(elem) fits in L1). For each block, do the inner transpose in registers; for diagonal blocks, swap in place. Trade some arithmetic for locality; gains 3-10x in practice.

**Python:**
```python
def transpose_blocked(a: list[list[float]], block: int = 32) -> None:
    n = len(a)
    for ii in range(0, n, block):
        for jj in range(ii, n, block):
            i_max = min(ii + block, n)
            j_max = min(jj + block, n)
            if ii == jj:
                for i in range(ii, i_max):
                    for j in range(i + 1, j_max):
                        a[i][j], a[j][i] = a[j][i], a[i][j]
            else:
                for i in range(ii, i_max):
                    for j in range(jj, j_max):
                        a[i][j], a[j][i] = a[j][i], a[i][j]
```

**TypeScript:**
```typescript
function transposeBlocked(a: number[][], block = 32): void {
  const n = a.length;
  for (let ii = 0; ii < n; ii += block) {
    for (let jj = ii; jj < n; jj += block) {
      const iMax = Math.min(ii + block, n);
      const jMax = Math.min(jj + block, n);
      if (ii === jj) {
        for (let i = ii; i < iMax; i++) {
          for (let j = i + 1; j < jMax; j++) {
            [a[i][j], a[j][i]] = [a[j][i], a[i][j]];
          }
        }
      } else {
        for (let i = ii; i < iMax; i++) {
          for (let j = jj; j < jMax; j++) {
            [a[i][j], a[j][i]] = [a[j][i], a[i][j]];
          }
        }
      }
    }
  }
}
```

**Java:**
```java
class Solution {
    public void transposeBlocked(double[][] a, int block) {
        int n = a.length;
        for (int ii = 0; ii < n; ii += block) {
            for (int jj = ii; jj < n; jj += block) {
                int iMax = Math.min(ii + block, n);
                int jMax = Math.min(jj + block, n);
                if (ii == jj) {
                    for (int i = ii; i < iMax; i++) {
                        for (int j = i + 1; j < jMax; j++) {
                            double t = a[i][j]; a[i][j] = a[j][i]; a[j][i] = t;
                        }
                    }
                } else {
                    for (int i = ii; i < iMax; i++) {
                        for (int j = jj; j < jMax; j++) {
                            double t = a[i][j]; a[i][j] = a[j][i]; a[j][i] = t;
                        }
                    }
                }
            }
        }
    }
}
```

**Key points:**
- Process B x B tiles so both rows and columns of each tile fit in L1 cache.
- Iterate only over `jj >= ii` to avoid double-swapping symmetric off-diagonal tiles.
- Diagonal tiles need an in-tile swap; off-diagonal tiles swap with their mirror tile.

**Complexity:** O(n²) work — every element is touched once, same as the naive transpose; tiling only improves the constant factor via cache locality. O(1) extra space.

**Tags:** #algorithm

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
