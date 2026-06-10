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
      const first = this.m.keys().next().value as number;
      this.m.delete(first);
    }
  }
}
```

**Java:**
```java
class LRUCache extends LinkedHashMap<Integer, Integer> {
    private final int cap;
    public LRUCache(int capacity) {
        super(capacity, 0.75f, true);
        this.cap = capacity;
    }
    public int get(int key) { return super.getOrDefault(key, -1); }
    public void put(int key, int value) { super.put(key, value); }
    @Override
    protected boolean removeEldestEntry(Map.Entry<Integer, Integer> eldest) {
        return size() > cap;
    }
}
```

**Key points:**
- `OrderedDict` / JS `Map` preserve insertion order — re-insert to mark MRU.
- O(1) per `get` and `put`; O(capacity) space.
- Evict from the oldest end only when strictly over capacity.

**Follow-ups:**
- Make it thread-safe — lock the whole map vs. striped locks (`ConcurrentHashMap`-style segments).
- Replace with LFU; discuss the two-hash-map + frequency list pattern (O(1) admission/eviction).
- Add TTL per entry; how do you evict lazily vs. with a background sweeper?
- Scale beyond one process — sharding strategy and consistency model for a distributed cache.

**Common Pitfalls:**
- Using a singly linked list — you can't remove in O(1) without the prev pointer.
- Forgetting to update recency on `put` when the key already exists.
- Evicting before insertion check, which breaks the invariant for `capacity == 0`.
- Using `LinkedHashMap` in Java without `accessOrder=true`, which only tracks insertion order.

**Strong Answer Points:**
- State the O(1) target up front and justify both data structures from that constraint.
- Call out the invariant clearly: "head = MRU, tail = LRU".
- Mention concurrency and eviction policy trade-offs even before being asked.
- Walk through a small trace (3-4 ops) to prove correctness.

**Bad Answer Example:** Jumping straight to a `HashMap` + array and saying "we'll just delete from the array" — loses points for ignoring the O(1) requirement and never discussing eviction order or capacity edge cases.

**References:**
- LeetCode 146 — LRU Cache (problem + top-voted solutions)
- Designing Data-Intensive Applications, Ch. 5 — caching invalidation discussion
- Java `LinkedHashMap` JDK source (`accessOrder`, `removeEldestEntry`)

**Tags:** #algorithm

---

### 2. Number of Islands

**Difficulty:** Medium
**Topics:** graph, dfs, bfs, matrix
**Position:** SWE
**Years:** L4

**Question:** Given a 2D grid of '1's (land) and '0's (water), count the number of islands.

**Approach:** Iterate cells; on each unvisited '1', DFS to flood-fill the island, increment count. Mark visited in-place. O(m*n) time and space (stack). Common Amazon follow-up: "now imagine the grid is so big it's distributed across machines" → discuss row partitioning + boundary merging via union-find.

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
                dfs(r, c)
                count += 1
    return count
```

**TypeScript:**
```typescript
function numIslands(grid: string[][]): number {
  if (!grid.length) return 0;
  const m = grid.length, n = grid[0].length;
  const dfs = (r: number, c: number): void => {
    if (r < 0 || r >= m || c < 0 || c >= n || grid[r][c] !== "1") return;
    grid[r][c] = "0";
    dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1);
  };
  let count = 0;
  for (let r = 0; r < m; r++)
    for (let c = 0; c < n; c++)
      if (grid[r][c] === "1") { dfs(r, c); count++; }
  return count;
}
```

**Java:**
```java
class Solution {
    private int m, n;
    public int numIslands(char[][] grid) {
        if (grid.length == 0) return 0;
        m = grid.length; n = grid[0].length;
        int count = 0;
        for (int r = 0; r < m; r++)
            for (int c = 0; c < n; c++)
                if (grid[r][c] == '1') { dfs(grid, r, c); count++; }
        return count;
    }
    private void dfs(char[][] g, int r, int c) {
        if (r < 0 || r >= m || c < 0 || c >= n || g[r][c] != '1') return;
        g[r][c] = '0';
        dfs(g, r + 1, c); dfs(g, r - 1, c); dfs(g, r, c + 1); dfs(g, r, c - 1);
    }
}
```

**Key points:**
- Flip cells to "0" during DFS to avoid revisits without an extra set.
- O(m*n) time and O(m*n) recursion stack worst case (one giant island).
- BFS with a queue avoids deep recursion on huge grids.

**Follow-ups:**
- Use BFS instead of DFS — when does the recursion stack blow up and how do you size the queue?
- Return the size of the largest island, not just the count.
- Streaming grid: rows arrive one at a time — maintain count incrementally.
- Distributed grid sharded by rows; merge island IDs across shards with union-find.
- Variant: count islands fully surrounded by water (no border cells).

**Common Pitfalls:**
- Recursing before bounds-checking; the stack explodes on the first invalid index.
- Mutating the grid in place when the caller still needs it — clone first if not allowed.

**Tags:** #algorithm

---

### 3. Two Sum

**Difficulty:** Easy
**Topics:** arrays, hashmap
**Position:** SWE
**Years:** L4

**Question:** Given an array of integers and a target, return indices of the two numbers that add up to target. Assume exactly one solution.

**Approach:** One pass + hashmap `value -> index`. For each `num`, check if `target - num` is in map; else insert. O(n) time, O(n) space. Amazon OA staple.

**Python:**
```python
def two_sum(nums: list[int], target: int) -> list[int]:
    seen: dict[int, int] = {}
    for i, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], i]
        seen[x] = i
    return []
```

**TypeScript:**
```typescript
function twoSum(nums: number[], target: number): number[] {
  const seen = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need)!, i];
    seen.set(nums[i], i);
  }
  return [];
}
```

**Java:**
```java
class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int need = target - nums[i];
            if (seen.containsKey(need)) return new int[]{seen.get(need), i};
            seen.put(nums[i], i);
        }
        return new int[0];
    }
}
```

**Key points:**
- Hash lookup turns the inner search from O(n) into O(1).
- Insert after the check so the same index is not reused.
- O(n) time, O(n) extra space.

**Follow-ups:**
- Input is sorted — two-pointer in O(1) extra space.
- Return all unique pairs (3Sum-style dedupe).
- Streaming integers: design `add(num)` + `find(target)` continuous-query API.
- Multiple solutions exist; return the pair with the smallest index sum.

**Common Pitfalls:**
- Inserting into the map before the check, which lets `nums[i] + nums[i] == target` reuse the same index.
- Falling back to brute force O(n^2) despite the "exactly one solution" hint — fails performance bar.

**Tags:** #algorithm

---

### 4. Merge K Sorted Lists

**Difficulty:** Hard
**Topics:** linked-list, heap, divide-and-conquer
**Position:** SWE
**Years:** L4

**Question:** Merge `k` sorted linked lists into one sorted list.

**Approach:** Min-heap of `(value, list_index, node)` size k; pop smallest, advance, push next from same list. O(N log k) where N = total nodes. Alternative: divide-and-conquer pairwise merge, same complexity, slightly better constant. Mind heap tie-breaks (don't compare nodes directly).

**Python:**
```python
import heapq

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
function mergeKLists(lists: Array<ListNode | null>): ListNode | null {
  const merge = (a: ListNode | null, b: ListNode | null): ListNode | null => {
    const d = new ListNode(); let t = d;
    while (a && b) { if (a.val <= b.val) { t.next = a; a = a.next; } else { t.next = b; b = b.next; } t = t.next!; }
    t.next = a ?? b;
    return d.next;
  };
  if (!lists.length) return null;
  let step = 1;
  while (step < lists.length) {
    for (let i = 0; i + step < lists.length; i += step * 2) lists[i] = merge(lists[i], lists[i + step]);
    step *= 2;
  }
  return lists[0];
}
```

**Java:**
```java
class Solution {
    public ListNode mergeKLists(ListNode[] lists) {
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        for (int i = 0; i < lists.length; i++)
            if (lists[i] != null) heap.offer(new int[]{lists[i].val, i});
        ListNode dummy = new ListNode(), tail = dummy;
        while (!heap.isEmpty()) {
            int[] top = heap.poll();
            int i = top[1];
            tail.next = lists[i];
            tail = tail.next;
            lists[i] = lists[i].next;
            if (lists[i] != null) heap.offer(new int[]{lists[i].val, i});
        }
        return dummy.next;
    }
}
```

**Key points:**
- Tie-break by list index so the heap never tries to compare nodes.
- O(N log k) time, O(k) extra space for the heap.
- Pairwise divide-and-conquer reaches the same bound without a heap.

**Follow-ups:**
- Lists are sharded across machines — sketch distributed k-way merge with sorted partitions.
- Merge K sorted *streams* instead of arrays — design the interface and back-pressure.
- Implement the heap manually (sift-up / sift-down) without `heapq` or `PriorityQueue`.
- Memory pressure: reuse existing nodes vs. allocate new ones for the merged list.
- Stability: equal values must keep their original list order.

**Common Pitfalls:**
- Pushing raw nodes into the heap — Python/Java try to compare nodes themselves and crash.
- Forgetting to advance the source list after popping, causing an infinite loop.

**Tags:** #algorithm

---

### 5. Word Break

**Difficulty:** Medium
**Topics:** dp, strings, trie
**Position:** SWE
**Years:** L4

**Question:** Given a string `s` and a dictionary of words, return true if `s` can be segmented into a sequence of dictionary words.

**Approach:** DP — `dp[i]` = true if `s[0..i)` can be segmented. Transition: `dp[i] = any dp[j] && s[j..i) in dict`. O(n² * L) with hashset lookup. Trie speeds up the inner check. Follow-up: return all segmentations (memoized recursion).

**Python:**
```python
def word_break(s: str, word_dict: list[str]) -> bool:
    words = set(word_dict)
    n = len(s)
    dp = [False] * (n + 1)
    dp[0] = True
    for i in range(1, n + 1):
        for j in range(i):
            if dp[j] and s[j:i] in words:
                dp[i] = True
                break
    return dp[n]
```

**TypeScript:**
```typescript
function wordBreak(s: string, wordDict: string[]): boolean {
  const words = new Set(wordDict);
  const n = s.length;
  const dp = new Array<boolean>(n + 1).fill(false);
  dp[0] = true;
  for (let i = 1; i <= n; i++) {
    for (let j = 0; j < i; j++) {
      if (dp[j] && words.has(s.slice(j, i))) { dp[i] = true; break; }
    }
  }
  return dp[n];
}
```

**Java:**
```java
class Solution {
    public boolean wordBreak(String s, List<String> wordDict) {
        Set<String> words = new HashSet<>(wordDict);
        int n = s.length();
        boolean[] dp = new boolean[n + 1];
        dp[0] = true;
        for (int i = 1; i <= n; i++) {
            for (int j = 0; j < i; j++) {
                if (dp[j] && words.contains(s.substring(j, i))) { dp[i] = true; break; }
            }
        }
        return dp[n];
    }
}
```

**Key points:**
- `dp[0] = True` represents the empty prefix.
- O(n^2) outer-inner with O(L) slice/hash; total O(n^2 * L).
- Break early once `dp[i]` becomes true to cut the inner loop.

**Follow-ups:**
- Return all valid segmentations (Word Break II) with memoization.
- Dictionary at 10^6 entries — switch to a Trie to prune impossible splits early.
- Online dictionary updates between queries; what gets invalidated?
- Unicode / multi-byte words; how does runtime scale with average word length L?

**Common Pitfalls:**
- Missing `dp[0] = True`, which makes every segmentation evaluate to false.
- Re-creating substrings on every inner iteration — use a Trie or substring index for hot dictionaries.

**Tags:** #algorithm

---

### 6. Trapping Rain Water

**Difficulty:** Hard
**Topics:** arrays, two-pointer, dp
**Position:** SWE
**Years:** L5

**Question:** Given `n` non-negative integers representing an elevation map, compute how much water it can trap.

**Approach:** Two pointers from each end. Maintain `left_max`, `right_max`. Move whichever side is shorter; water at that index = `side_max - height[i]`. O(n) time, O(1) space. Alternative: precompute `left_max[]` and `right_max[]` arrays — clearer but O(n) space.

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
class Solution {
    public int trap(int[] height) {
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
}
```

**Key points:**
- The shorter side bounds water at its index, so move it inward.
- O(n) time, O(1) extra space.
- Precomputed left/right max arrays are easier to reason about but use O(n).

**Follow-ups:**
- Trapping Rain Water II (2D matrix) — switch to a min-heap starting from the border.
- Heights arrive as a stream — can the total be updated incrementally?
- Floating-point / negative heights; what changes in the invariant?
- Print the actual water level at each index instead of only the total volume.

**Common Pitfalls:**
- Moving the taller pointer when heights tie — you overcount that index.
- Off-by-one: forgetting that the leftmost/rightmost bars never trap water.

**Tags:** #algorithm

---

### 7. Top K Frequent Elements

**Difficulty:** Medium
**Topics:** hashmap, heap, bucket-sort
**Position:** SWE
**Years:** L4

**Question:** Given a non-empty array of integers, return the k most frequent elements.

**Approach:** Count frequencies in hashmap, then either (a) min-heap of size k by frequency → O(n log k), or (b) bucket sort by frequency (buckets[freq] = list) → O(n). Amazon often pairs with follow-up "what if data is streaming?" → Count-Min Sketch + heap.

**Python:**
```python
from collections import Counter

def top_k_frequent(nums: list[int], k: int) -> list[int]:
    cnt = Counter(nums)
    buckets: list[list[int]] = [[] for _ in range(len(nums) + 1)]
    for num, freq in cnt.items():
        buckets[freq].append(num)
    out: list[int] = []
    for freq in range(len(buckets) - 1, 0, -1):
        for num in buckets[freq]:
            out.append(num)
            if len(out) == k:
                return out
    return out
```

**TypeScript:**
```typescript
function topKFrequent(nums: number[], k: number): number[] {
  const cnt = new Map<number, number>();
  for (const n of nums) cnt.set(n, (cnt.get(n) ?? 0) + 1);
  const buckets: number[][] = Array.from({ length: nums.length + 1 }, () => []);
  for (const [num, freq] of cnt) buckets[freq].push(num);
  const out: number[] = [];
  for (let f = buckets.length - 1; f > 0 && out.length < k; f--)
    for (const n of buckets[f]) { out.push(n); if (out.length === k) return out; }
  return out;
}
```

**Java:**
```java
class Solution {
    public int[] topKFrequent(int[] nums, int k) {
        Map<Integer, Integer> cnt = new HashMap<>();
        for (int n : nums) cnt.merge(n, 1, Integer::sum);
        List<List<Integer>> buckets = new ArrayList<>();
        for (int i = 0; i <= nums.length; i++) buckets.add(new ArrayList<>());
        cnt.forEach((num, f) -> buckets.get(f).add(num));
        int[] out = new int[k];
        int idx = 0;
        for (int f = buckets.size() - 1; f > 0 && idx < k; f--)
            for (int num : buckets.get(f)) if (idx < k) out[idx++] = num;
        return out;
    }
}
```

**Key points:**
- Bucket sort exploits `freq <= n` for O(n) total.
- Heap variant is O(n log k) and simpler when k is tiny vs n.
- Walk buckets from high to low to collect k items.

**Follow-ups:**
- Streaming Top-K with Count-Min Sketch + min-heap; trade accuracy for memory.
- Data does not fit in memory — external sort or MapReduce by hash partition.
- Ties on frequency — define a deterministic ordering (insertion order, value, etc.).
- k changes per query — keep a sorted bucket structure to answer all k values cheaply.

**Common Pitfalls:**
- Sorting every element O(n log n) when only top-k is needed.
- Allocating `n + 1` buckets when distinct elements are sparse — wastes memory on huge inputs.

**Tags:** #algorithm

---

### 8. Reorder Log Files

**Difficulty:** Easy
**Topics:** strings, sorting, comparator
**Position:** SWE
**Years:** L3-L4

**Question:** Reorder a list of log files so letter-logs come first (lexicographically by content, then by identifier as tiebreaker), then digit-logs in original order.

**Approach:** Custom comparator: partition into letter-logs and digit-logs; sort letter-logs by `(content, identifier)`; concatenate. Test classifier on first char of post-identifier token. Amazon-classic OA question.

**Python:**
```python
def reorder_log_files(logs: list[str]) -> list[str]:
    letters: list[str] = []
    digits: list[str] = []
    for log in logs:
        ident, rest = log.split(" ", 1)
        if rest[0].isdigit():
            digits.append(log)
        else:
            letters.append(log)
    letters.sort(key=lambda s: (s.split(" ", 1)[1], s.split(" ", 1)[0]))
    return letters + digits
```

**TypeScript:**
```typescript
function reorderLogFiles(logs: string[]): string[] {
  const letters: string[] = [], digits: string[] = [];
  for (const log of logs) {
    const sp = log.indexOf(" ");
    if (/\d/.test(log[sp + 1])) digits.push(log);
    else letters.push(log);
  }
  letters.sort((a, b) => {
    const ai = a.indexOf(" "), bi = b.indexOf(" ");
    const ac = a.slice(ai + 1), bc = b.slice(bi + 1);
    if (ac !== bc) return ac < bc ? -1 : 1;
    return a.slice(0, ai) < b.slice(0, bi) ? -1 : 1;
  });
  return [...letters, ...digits];
}
```

**Java:**
```java
class Solution {
    public String[] reorderLogFiles(String[] logs) {
        Arrays.sort(logs, (a, b) -> {
            int ai = a.indexOf(' '), bi = b.indexOf(' ');
            boolean aDig = Character.isDigit(a.charAt(ai + 1));
            boolean bDig = Character.isDigit(b.charAt(bi + 1));
            if (!aDig && !bDig) {
                int cmp = a.substring(ai + 1).compareTo(b.substring(bi + 1));
                return cmp != 0 ? cmp : a.substring(0, ai).compareTo(b.substring(0, bi));
            }
            return aDig ? (bDig ? 0 : 1) : -1;
        });
        return logs;
    }
}
```

**Key points:**
- Stable partition keeps digit-logs in original order.
- Sort key is (content, identifier) for tie-break.
- O(n * k log n) where k is average log length.

**Follow-ups:**
- 1B logs — parallelize with map-reduce, then merge-sort partitions.
- Identifier collisions across multiple log streams — namespace by stream id.
- Case sensitivity (`A` vs `a`) — normalize or document the rule explicitly.
- Logs arrive as a stream — maintain order without full re-sort on every batch.

**Common Pitfalls:**
- Using a non-stable sort — destroys the required original order of digit-logs.
- Splitting on every space instead of only the first one; mishandles logs whose content contains spaces.

**Tags:** #coding

---

### 9. Design a Parking Lot

**Difficulty:** Medium
**Topics:** ood, design
**Position:** SWE
**Years:** L4

**Question:** Design the classes for a multi-level parking lot supporting motorcycles, cars, and trucks with different spot sizes.

**Approach:** Classes: `ParkingLot` → `Level[]` → `ParkingSpot[]`. Spot has `size` enum (compact/large/motorcycle). `Vehicle` abstract → `Car/Truck/Motorcycle`, each declares which spot sizes they fit. `park()` finds first compatible spot; `leave()` frees. Show good encapsulation, polymorphism, and discuss extension (electric charging, monthly passes). Don't over-engineer — interviewers want clear class diagrams, not 50 classes.

**Python:**
```python
from enum import Enum

class Size(Enum):
    MOTO = 1; COMPACT = 2; LARGE = 3

class Vehicle:
    def __init__(self, plate: str, fits: set[Size]) -> None:
        self.plate, self.fits = plate, fits

class Spot:
    def __init__(self, size: Size) -> None:
        self.size, self.vehicle = size, None

class ParkingLot:
    def __init__(self, spots: list[Spot]) -> None:
        self.spots = spots
    def park(self, v: Vehicle) -> Spot | None:
        for s in self.spots:
            if s.vehicle is None and s.size in v.fits:
                s.vehicle = v; return s
        return None
    def leave(self, s: Spot) -> None:
        s.vehicle = None
```

**TypeScript:**
```typescript
enum Size { MOTO, COMPACT, LARGE }
class Vehicle { constructor(public plate: string, public fits: Set<Size>) {} }
class Spot { vehicle: Vehicle | null = null; constructor(public size: Size) {} }

class ParkingLot {
  constructor(private spots: Spot[]) {}
  park(v: Vehicle): Spot | null {
    for (const s of this.spots)
      if (!s.vehicle && v.fits.has(s.size)) { s.vehicle = v; return s; }
    return null;
  }
  leave(s: Spot): void { s.vehicle = null; }
}
```

**Java:**
```java
enum Size { MOTO, COMPACT, LARGE }

class Vehicle {
    String plate; Set<Size> fits;
    Vehicle(String plate, Set<Size> fits) { this.plate = plate; this.fits = fits; }
}

class Spot {
    Size size; Vehicle vehicle;
    Spot(Size size) { this.size = size; }
}

class ParkingLot {
    private final List<Spot> spots;
    public ParkingLot(List<Spot> spots) { this.spots = spots; }
    public Spot park(Vehicle v) {
        for (Spot s : spots)
            if (s.vehicle == null && v.fits.contains(s.size)) { s.vehicle = v; return s; }
        return null;
    }
    public void leave(Spot s) { s.vehicle = null; }
}
```

**Key points:**
- `Vehicle.fits` lets each type declare compatible spot sizes (open/closed principle).
- Linear scan is fine for an interview; production groups free spots by size in queues.
- Extend by adding `EVSpot extends Spot` rather than mutating enum.

**Complexity:** `park` is O(S) for a linear scan of S spots (O(1) if free spots are bucketed by size); `leave` is O(1).

**Follow-ups:**
- Multi-level lot — how do you balance utilization across levels?
- Electric charging spots with queueing and charge-time tracking.
- Pricing (hourly / daily / monthly) integrated with a payment service.
- Real-time availability board — pub/sub vs polling, eventual consistency trade-offs.
- Reservations with overbooking strategy and no-show timeout.

**Common Pitfalls:**
- Over-engineering with too many classes; the interviewer wants clear boundaries, not 50 abstractions.
- Hardcoding spot-vs-vehicle compatibility in `ParkingLot` instead of declaring it on the vehicle type.

**Tags:** #coding

---

### 10. Design Amazon Prime Video

**Difficulty:** Hard
**Topics:** system-design, cdn, video-streaming, drm, recommendation
**Position:** Senior SWE
**Years:** L5

**Question:** Design a video streaming service like Prime Video.

**Approach:** Upload → encoding pipeline (multiple bitrates, codecs, DRM-wrapped HLS/DASH chunks) → blob storage (S3) + CDN (CloudFront). Playback client requests manifest, adapts bitrate (ABR). Metadata in DynamoDB; recommendations from offline training (matrix factorization + content embeddings). Discuss DRM (Widevine/FairPlay/PlayReady), regional licensing, offline downloads, and CDN cost optimization (cache hit ratio). Mention Amazon's open-sourced bitmovin/encoding patterns where relevant.

**Follow-ups:**
- DRM key rotation and license expiry; how do clients refresh mid-playback?
- Resume playback at exact timestamp across devices (continue watching).
- Geo-blocking and regional licensing windows — enforce at manifest or CDN edge?
- Live event streaming vs on-demand — what changes in encoding and CDN strategy?
- Recommendation cold-start for new users or new titles.

**Common Pitfalls:**
- Treating it like generic file storage and missing the encoding pipeline + ABR layer.
- Ignoring CDN egress cost — typically the largest line item in real streaming systems.

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

### 21. Trapping Rain Water II

**Difficulty:** Hard
**Topics:** heap, bfs, matrix
**Position:** Senior SDE
**Years:** L5-L6

**Question:** Given an `m x n` integer matrix representing the elevation of each unit cell of a 2D map, compute how much rainwater it can trap.

**Approach:** Min-heap seeded with all boundary cells. Pop the lowest cell, visit neighbors; trapped water at neighbor = `max(0, current_height - neighbor_height)`; push neighbor with `max(current, neighbor)`. O(m*n log(m*n)) time. Key insight: water level at any cell is bounded by the lowest "wall" surrounding it, processed lowest-first.

**Python:**
```python
import heapq

def trap_rain_water(height_map: list[list[int]]) -> int:
    if not height_map or not height_map[0]:
        return 0
    m, n = len(height_map), len(height_map[0])
    visited = [[False] * n for _ in range(m)]
    heap: list[tuple[int, int, int]] = []
    for r in range(m):
        for c in range(n):
            if r in (0, m - 1) or c in (0, n - 1):
                heapq.heappush(heap, (height_map[r][c], r, c))
                visited[r][c] = True
    total = 0
    while heap:
        h, r, c = heapq.heappop(heap)
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < m and 0 <= nc < n and not visited[nr][nc]:
                visited[nr][nc] = True
                total += max(0, h - height_map[nr][nc])
                heapq.heappush(heap, (max(h, height_map[nr][nc]), nr, nc))
    return total
```

**TypeScript:**
```typescript
function trapRainWater(heightMap: number[][]): number {
  const m = heightMap.length, n = heightMap[0]?.length ?? 0;
  if (!m || !n) return 0;
  const visited: boolean[][] = Array.from({ length: m }, () => new Array(n).fill(false));
  const heap: Array<[number, number, number]> = [];
  const push = (h: number, r: number, c: number) => { heap.push([h, r, c]); heap.sort((a, b) => a[0] - b[0]); };
  for (let r = 0; r < m; r++) for (let c = 0; c < n; c++)
    if (r === 0 || r === m - 1 || c === 0 || c === n - 1) { push(heightMap[r][c], r, c); visited[r][c] = true; }
  let total = 0;
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  while (heap.length) {
    const [h, r, c] = heap.shift()!;
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < m && nc >= 0 && nc < n && !visited[nr][nc]) {
        visited[nr][nc] = true;
        total += Math.max(0, h - heightMap[nr][nc]);
        push(Math.max(h, heightMap[nr][nc]), nr, nc);
      }
    }
  }
  return total;
}
```

**Java:**
```java
class Solution {
    public int trapRainWater(int[][] heightMap) {
        int m = heightMap.length, n = heightMap[0].length;
        if (m < 3 || n < 3) return 0;
        boolean[][] visited = new boolean[m][n];
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        for (int r = 0; r < m; r++) for (int c = 0; c < n; c++)
            if (r == 0 || r == m - 1 || c == 0 || c == n - 1) {
                heap.offer(new int[]{heightMap[r][c], r, c}); visited[r][c] = true;
            }
        int total = 0;
        int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
        while (!heap.isEmpty()) {
            int[] cur = heap.poll();
            for (int[] d : dirs) {
                int nr = cur[1] + d[0], nc = cur[2] + d[1];
                if (nr < 0 || nr >= m || nc < 0 || nc >= n || visited[nr][nc]) continue;
                visited[nr][nc] = true;
                total += Math.max(0, cur[0] - heightMap[nr][nc]);
                heap.offer(new int[]{Math.max(cur[0], heightMap[nr][nc]), nr, nc});
            }
        }
        return total;
    }
}
```

**Key points:**
- Process from the lowest boundary inward so each cell's bounding wall is known.
- Push `max(current_wall, neighbor)` to model "raised" wall after flooding.
- O(m*n log(m*n)) time; production TS should use a real heap.

**Tags:** #algorithm

---

### 22. LFU Cache

**Difficulty:** Hard
**Topics:** ood, hashmap, linked-list, design
**Position:** Senior SDE
**Years:** L5

**Question:** Design a Least Frequently Used (LFU) cache supporting `get` and `put` in O(1). On overflow, evict the least frequently used key; tie-break with least recently used among that frequency.

**Approach:** Two hashmaps: `key -> (value, freq, node)` and `freq -> DoublyLinkedList of nodes`. Track `min_freq`. On access, move node from its freq list to `freq+1` list. On `put` overflow, drop tail of `min_freq` list. Edge cases: freq list becoming empty must advance `min_freq` only on insert. Strictly harder than LRU due to bookkeeping.

**Python:**
```python
from collections import defaultdict, OrderedDict

class LFUCache:
    def __init__(self, capacity: int) -> None:
        self.cap = capacity
        self.kv: dict[int, int] = {}
        self.kf: dict[int, int] = {}
        self.fk: defaultdict[int, OrderedDict[int, None]] = defaultdict(OrderedDict)
        self.min_freq = 0

    def _bump(self, key: int) -> None:
        f = self.kf[key]
        del self.fk[f][key]
        if not self.fk[f] and f == self.min_freq:
            self.min_freq += 1
        self.kf[key] = f + 1
        self.fk[f + 1][key] = None

    def get(self, key: int) -> int:
        if key not in self.kv:
            return -1
        self._bump(key)
        return self.kv[key]

    def put(self, key: int, value: int) -> None:
        if self.cap <= 0:
            return
        if key in self.kv:
            self.kv[key] = value
            self._bump(key)
            return
        if len(self.kv) >= self.cap:
            evict, _ = self.fk[self.min_freq].popitem(last=False)
            del self.kv[evict]; del self.kf[evict]
        self.kv[key] = value
        self.kf[key] = 1
        self.fk[1][key] = None
        self.min_freq = 1
```

**TypeScript:**
```typescript
class LFUCache {
  private kv = new Map<number, number>();
  private kf = new Map<number, number>();
  private fk = new Map<number, Map<number, true>>();
  private minF = 0;
  constructor(private cap: number) {}
  private bump(k: number) {
    const f = this.kf.get(k)!;
    this.fk.get(f)!.delete(k);
    if (this.fk.get(f)!.size === 0 && f === this.minF) this.minF++;
    this.kf.set(k, f + 1);
    if (!this.fk.has(f + 1)) this.fk.set(f + 1, new Map());
    this.fk.get(f + 1)!.set(k, true);
  }
  get(key: number): number {
    if (!this.kv.has(key)) return -1;
    this.bump(key);
    return this.kv.get(key)!;
  }
  put(key: number, value: number): void {
    if (this.cap <= 0) return;
    if (this.kv.has(key)) { this.kv.set(key, value); this.bump(key); return; }
    if (this.kv.size >= this.cap) {
      const evict = this.fk.get(this.minF)!.keys().next().value as number;
      this.fk.get(this.minF)!.delete(evict);
      this.kv.delete(evict); this.kf.delete(evict);
    }
    this.kv.set(key, value); this.kf.set(key, 1);
    if (!this.fk.has(1)) this.fk.set(1, new Map());
    this.fk.get(1)!.set(key, true);
    this.minF = 1;
  }
}
```

**Java:**
```java
class LFUCache {
    private final int cap;
    private int minF = 0;
    private final Map<Integer, Integer> kv = new HashMap<>();
    private final Map<Integer, Integer> kf = new HashMap<>();
    private final Map<Integer, LinkedHashSet<Integer>> fk = new HashMap<>();
    public LFUCache(int capacity) { this.cap = capacity; }
    private void bump(int k) {
        int f = kf.get(k);
        fk.get(f).remove(k);
        if (fk.get(f).isEmpty() && f == minF) minF++;
        kf.put(k, f + 1);
        fk.computeIfAbsent(f + 1, x -> new LinkedHashSet<>()).add(k);
    }
    public int get(int key) {
        if (!kv.containsKey(key)) return -1;
        bump(key);
        return kv.get(key);
    }
    public void put(int key, int value) {
        if (cap <= 0) return;
        if (kv.containsKey(key)) { kv.put(key, value); bump(key); return; }
        if (kv.size() >= cap) {
            int evict = fk.get(minF).iterator().next();
            fk.get(minF).remove(evict); kv.remove(evict); kf.remove(evict);
        }
        kv.put(key, value); kf.put(key, 1);
        fk.computeIfAbsent(1, x -> new LinkedHashSet<>()).add(key);
        minF = 1;
    }
}
```

**Key points:**
- Per-frequency ordered map preserves LRU order within a frequency bucket.
- O(1) average for both `get` and `put`.
- Reset `min_freq = 1` on every new insert; only advance it when its bucket empties via `bump`.

**Tags:** #algorithm

---

### 23. Number of Provinces

**Difficulty:** Medium
**Topics:** graph, union-find, dfs
**Position:** SDE
**Years:** L4

**Question:** Given an `n x n` adjacency matrix `isConnected[i][j] = 1` if cities `i` and `j` are directly connected, return the number of provinces (connected components).

**Approach:** Either DFS/BFS marking visited nodes (O(n^2)) or Union-Find with path compression and union-by-rank (near O(n^2 alpha(n))). Count components = unique roots after processing all edges. Cleanly extends to dynamic connectivity follow-ups.

**Python:**
```python
def find_circle_num(is_connected: list[list[int]]) -> int:
    n = len(is_connected)
    parent = list(range(n))
    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    def union(a: int, b: int) -> None:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb
    for i in range(n):
        for j in range(i + 1, n):
            if is_connected[i][j]:
                union(i, j)
    return sum(1 for i in range(n) if find(i) == i)
```

**TypeScript:**
```typescript
function findCircleNum(isConnected: number[][]): number {
  const n = isConnected.length;
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  };
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      if (isConnected[i][j]) { const ra = find(i), rb = find(j); if (ra !== rb) parent[ra] = rb; }
  let count = 0;
  for (let i = 0; i < n; i++) if (find(i) === i) count++;
  return count;
}
```

**Java:**
```java
class Solution {
    private int[] parent;
    public int findCircleNum(int[][] isConnected) {
        int n = isConnected.length;
        parent = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
        for (int i = 0; i < n; i++)
            for (int j = i + 1; j < n; j++)
                if (isConnected[i][j] == 1) {
                    int ra = find(i), rb = find(j);
                    if (ra != rb) parent[ra] = rb;
                }
        int count = 0;
        for (int i = 0; i < n; i++) if (find(i) == i) count++;
        return count;
    }
    private int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }
}
```

**Key points:**
- Union-Find with path compression is near-O(1) per op.
- Only iterate upper triangle since matrix is symmetric.
- O(n^2 * alpha(n)) time, O(n) space for parents.

**Tags:** #algorithm

---

### 24. Course Schedule

**Difficulty:** Medium
**Topics:** graph, topological-sort, dfs, bfs
**Position:** SDE
**Years:** L4

**Question:** Given `numCourses` and a list of `[a, b]` prerequisite pairs (b must be taken before a), determine if you can finish all courses.

**Approach:** Cycle detection in a directed graph. Kahn's algorithm: compute in-degrees, BFS from in-degree-0 nodes, count processed; if `< numCourses`, cycle exists. Alternative: DFS with three-color marking (white/gray/black). O(V+E). Follow-up `Course Schedule II` returns the actual order.

**Python:**
```python
from collections import defaultdict, deque

def can_finish(num_courses: int, prerequisites: list[list[int]]) -> bool:
    indeg = [0] * num_courses
    graph: defaultdict[int, list[int]] = defaultdict(list)
    for a, b in prerequisites:
        graph[b].append(a)
        indeg[a] += 1
    q = deque(i for i in range(num_courses) if indeg[i] == 0)
    taken = 0
    while q:
        u = q.popleft()
        taken += 1
        for v in graph[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    return taken == num_courses
```

**TypeScript:**
```typescript
function canFinish(numCourses: number, prerequisites: number[][]): boolean {
  const indeg = new Array(numCourses).fill(0);
  const graph: number[][] = Array.from({ length: numCourses }, () => []);
  for (const [a, b] of prerequisites) { graph[b].push(a); indeg[a]++; }
  const q: number[] = [];
  for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) q.push(i);
  let taken = 0;
  while (q.length) {
    const u = q.shift()!;
    taken++;
    for (const v of graph[u]) if (--indeg[v] === 0) q.push(v);
  }
  return taken === numCourses;
}
```

**Java:**
```java
class Solution {
    public boolean canFinish(int numCourses, int[][] prerequisites) {
        int[] indeg = new int[numCourses];
        List<List<Integer>> graph = new ArrayList<>();
        for (int i = 0; i < numCourses; i++) graph.add(new ArrayList<>());
        for (int[] p : prerequisites) { graph.get(p[1]).add(p[0]); indeg[p[0]]++; }
        Deque<Integer> q = new ArrayDeque<>();
        for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) q.offer(i);
        int taken = 0;
        while (!q.isEmpty()) {
            int u = q.poll(); taken++;
            for (int v : graph.get(u)) if (--indeg[v] == 0) q.offer(v);
        }
        return taken == numCourses;
    }
}
```

**Key points:**
- Kahn's BFS naturally produces a topological order.
- If any vertex stays with in-degree > 0, a cycle exists.
- O(V + E) time and space.

**Tags:** #algorithm

---

### 25. Word Ladder II

**Difficulty:** Hard
**Topics:** bfs, graph, backtracking, strings
**Position:** Senior SDE
**Years:** L5-L6

**Question:** Given `beginWord`, `endWord`, and a word list, return all shortest transformation sequences from `beginWord` to `endWord`, changing exactly one letter at a time, with each intermediate word in the list.

**Approach:** Two-phase. Phase 1: BFS level by level, building parent-pointer DAG (only edges from level i to level i+1). Phase 2: DFS from `endWord` back through parents to enumerate all shortest paths. Generate neighbors by wildcard buckets (`h*t`) for O(L) per neighbor lookup. Tricky: only remove a word from the frontier after the entire level is processed.

**Python:**
```python
from collections import defaultdict, deque

def find_ladders(begin_word: str, end_word: str, word_list: list[str]) -> list[list[str]]:
    words = set(word_list)
    if end_word not in words:
        return []
    parents: defaultdict[str, set[str]] = defaultdict(set)
    level = {begin_word}
    found = False
    while level and not found:
        words -= level
        next_level: set[str] = set()
        for w in level:
            for i in range(len(w)):
                for c in "abcdefghijklmnopqrstuvwxyz":
                    nw = w[:i] + c + w[i + 1:]
                    if nw in words:
                        if nw == end_word:
                            found = True
                        next_level.add(nw)
                        parents[nw].add(w)
        level = next_level
    res: list[list[str]] = []
    def dfs(node: str, path: list[str]) -> None:
        if node == begin_word:
            res.append([begin_word] + path[::-1])
            return
        for p in parents[node]:
            dfs(p, path + [node])
    if found:
        dfs(end_word, [])
    return res
```

**TypeScript:**
```typescript
function findLadders(beginWord: string, endWord: string, wordList: string[]): string[][] {
  const words = new Set(wordList);
  if (!words.has(endWord)) return [];
  const parents = new Map<string, Set<string>>();
  let level = new Set<string>([beginWord]);
  let found = false;
  while (level.size && !found) {
    for (const w of level) words.delete(w);
    const next = new Set<string>();
    for (const w of level) {
      for (let i = 0; i < w.length; i++) {
        for (let c = 97; c < 123; c++) {
          const nw = w.slice(0, i) + String.fromCharCode(c) + w.slice(i + 1);
          if (words.has(nw)) {
            if (nw === endWord) found = true;
            next.add(nw);
            if (!parents.has(nw)) parents.set(nw, new Set());
            parents.get(nw)!.add(w);
          }
        }
      }
    }
    level = next;
  }
  const res: string[][] = [];
  const dfs = (node: string, path: string[]): void => {
    if (node === beginWord) { res.push([beginWord, ...path].reverse().concat()); return; }
    for (const p of parents.get(node) ?? []) dfs(p, [node, ...path]);
  };
  if (found) dfs(endWord, []);
  return res;
}
```

**Java:**
```java
class Solution {
    public List<List<String>> findLadders(String beginWord, String endWord, List<String> wordList) {
        Set<String> words = new HashSet<>(wordList);
        List<List<String>> res = new ArrayList<>();
        if (!words.contains(endWord)) return res;
        Map<String, Set<String>> parents = new HashMap<>();
        Set<String> level = new HashSet<>(); level.add(beginWord);
        boolean found = false;
        while (!level.isEmpty() && !found) {
            words.removeAll(level);
            Set<String> next = new HashSet<>();
            for (String w : level) {
                char[] arr = w.toCharArray();
                for (int i = 0; i < arr.length; i++) {
                    char orig = arr[i];
                    for (char c = 'a'; c <= 'z'; c++) {
                        arr[i] = c;
                        String nw = new String(arr);
                        if (words.contains(nw)) {
                            if (nw.equals(endWord)) found = true;
                            next.add(nw);
                            parents.computeIfAbsent(nw, x -> new HashSet<>()).add(w);
                        }
                    }
                    arr[i] = orig;
                }
            }
            level = next;
        }
        if (found) dfs(endWord, beginWord, parents, new ArrayDeque<>(), res);
        return res;
    }
    private void dfs(String node, String begin, Map<String, Set<String>> parents,
                     Deque<String> path, List<List<String>> res) {
        path.push(node);
        if (node.equals(begin)) res.add(new ArrayList<>(path));
        else for (String p : parents.getOrDefault(node, Set.of())) dfs(p, begin, parents, path, res);
        path.pop();
    }
}
```

**Key points:**
- Remove the entire frontier from the word set only after processing the level.
- BFS finds shortest length; DFS over parents reconstructs all such paths.
- Worst case is exponential in number of paths but typically tractable.

**Tags:** #algorithm

---

### 26. Critical Connections in a Network

**Difficulty:** Hard
**Topics:** graph, dfs, tarjan, bridges
**Position:** Senior SDE
**Years:** L5-L6

**Question:** Given `n` servers and bidirectional `connections`, return all critical connections (bridges) whose removal disconnects some servers.

**Approach:** Tarjan's bridge-finding DFS. Track `disc[u]` (discovery time) and `low[u]` (min disc reachable via subtree). Edge `(u, v)` is a bridge if `low[v] > disc[u]`. O(V+E). Watch out: skip the direct parent edge (not all neighbors with smaller disc).

**Python:**
```python
from collections import defaultdict

def critical_connections(n: int, connections: list[list[int]]) -> list[list[int]]:
    graph: defaultdict[int, list[int]] = defaultdict(list)
    for a, b in connections:
        graph[a].append(b); graph[b].append(a)
    disc = [-1] * n
    low = [0] * n
    bridges: list[list[int]] = []
    timer = 0
    def dfs(u: int, parent: int) -> None:
        nonlocal timer
        disc[u] = low[u] = timer; timer += 1
        for v in graph[u]:
            if disc[v] == -1:
                dfs(v, u)
                low[u] = min(low[u], low[v])
                if low[v] > disc[u]:
                    bridges.append([u, v])
            elif v != parent:
                low[u] = min(low[u], disc[v])
    for i in range(n):
        if disc[i] == -1:
            dfs(i, -1)
    return bridges
```

**TypeScript:**
```typescript
function criticalConnections(n: number, connections: number[][]): number[][] {
  const graph: number[][] = Array.from({ length: n }, () => []);
  for (const [a, b] of connections) { graph[a].push(b); graph[b].push(a); }
  const disc = new Array(n).fill(-1), low = new Array(n).fill(0);
  const bridges: number[][] = [];
  let timer = 0;
  const dfs = (u: number, parent: number): void => {
    disc[u] = low[u] = timer++;
    for (const v of graph[u]) {
      if (disc[v] === -1) {
        dfs(v, u);
        low[u] = Math.min(low[u], low[v]);
        if (low[v] > disc[u]) bridges.push([u, v]);
      } else if (v !== parent) low[u] = Math.min(low[u], disc[v]);
    }
  };
  for (let i = 0; i < n; i++) if (disc[i] === -1) dfs(i, -1);
  return bridges;
}
```

**Java:**
```java
class Solution {
    private List<List<Integer>> graph;
    private int[] disc, low;
    private int timer = 0;
    private final List<List<Integer>> bridges = new ArrayList<>();
    public List<List<Integer>> criticalConnections(int n, List<List<Integer>> connections) {
        graph = new ArrayList<>();
        for (int i = 0; i < n; i++) graph.add(new ArrayList<>());
        for (List<Integer> e : connections) { graph.get(e.get(0)).add(e.get(1)); graph.get(e.get(1)).add(e.get(0)); }
        disc = new int[n]; low = new int[n];
        Arrays.fill(disc, -1);
        for (int i = 0; i < n; i++) if (disc[i] == -1) dfs(i, -1);
        return bridges;
    }
    private void dfs(int u, int parent) {
        disc[u] = low[u] = timer++;
        for (int v : graph.get(u)) {
            if (disc[v] == -1) {
                dfs(v, u);
                low[u] = Math.min(low[u], low[v]);
                if (low[v] > disc[u]) bridges.add(List.of(u, v));
            } else if (v != parent) low[u] = Math.min(low[u], disc[v]);
        }
    }
}
```

**Key points:**
- `low[v] > disc[u]` means there's no back-edge skipping (u, v).
- Skip only the direct parent, not any older neighbor.
- O(V + E) time; recursion depth equals DFS tree depth.

**Tags:** #algorithm

---

### 27. Cut Off Trees for Golf Event

**Difficulty:** Hard
**Topics:** bfs, heap, matrix
**Position:** Senior SDE
**Years:** L5-L6

**Question:** Given a forest as a grid where each positive value is tree height, cut all trees in ascending height order. From `(0,0)`, return min steps to cut all, or -1 if any tree unreachable.

**Approach:** Sort trees by height. For each consecutive pair, run BFS for shortest path on the grid. Sum the distances. If any BFS fails, return -1. O(T * m*n) where T = number of trees. A* with Manhattan heuristic can speed it up but BFS suffices.

**Python:**
```python
from collections import deque

def cut_off_tree(forest: list[list[int]]) -> int:
    m, n = len(forest), len(forest[0])
    trees = sorted(((forest[r][c], r, c) for r in range(m) for c in range(n) if forest[r][c] > 1))
    def bfs(sr: int, sc: int, tr: int, tc: int) -> int:
        if (sr, sc) == (tr, tc):
            return 0
        visited = {(sr, sc)}
        q: deque[tuple[int, int, int]] = deque([(sr, sc, 0)])
        while q:
            r, c, d = q.popleft()
            for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < m and 0 <= nc < n and forest[nr][nc] and (nr, nc) not in visited:
                    if (nr, nc) == (tr, tc):
                        return d + 1
                    visited.add((nr, nc))
                    q.append((nr, nc, d + 1))
        return -1
    sr = sc = 0
    total = 0
    for _, tr, tc in trees:
        d = bfs(sr, sc, tr, tc)
        if d < 0:
            return -1
        total += d
        sr, sc = tr, tc
    return total
```

**TypeScript:**
```typescript
function cutOffTree(forest: number[][]): number {
  const m = forest.length, n = forest[0].length;
  const trees: Array<[number, number, number]> = [];
  for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) if (forest[r][c] > 1) trees.push([forest[r][c], r, c]);
  trees.sort((a, b) => a[0] - b[0]);
  const bfs = (sr: number, sc: number, tr: number, tc: number): number => {
    if (sr === tr && sc === tc) return 0;
    const visited = new Set<number>([sr * n + sc]);
    const q: Array<[number, number, number]> = [[sr, sc, 0]];
    while (q.length) {
      const [r, c, d] = q.shift()!;
      for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < m && nc >= 0 && nc < n && forest[nr][nc] && !visited.has(nr * n + nc)) {
          if (nr === tr && nc === tc) return d + 1;
          visited.add(nr * n + nc);
          q.push([nr, nc, d + 1]);
        }
      }
    }
    return -1;
  };
  let sr = 0, sc = 0, total = 0;
  for (const [, tr, tc] of trees) {
    const d = bfs(sr, sc, tr, tc);
    if (d < 0) return -1;
    total += d; sr = tr; sc = tc;
  }
  return total;
}
```

**Java:**
```java
class Solution {
    private int m, n;
    public int cutOffTree(List<List<Integer>> forest) {
        m = forest.size(); n = forest.get(0).size();
        List<int[]> trees = new ArrayList<>();
        for (int r = 0; r < m; r++) for (int c = 0; c < n; c++)
            if (forest.get(r).get(c) > 1) trees.add(new int[]{forest.get(r).get(c), r, c});
        trees.sort((a, b) -> a[0] - b[0]);
        int sr = 0, sc = 0, total = 0;
        for (int[] t : trees) {
            int d = bfs(forest, sr, sc, t[1], t[2]);
            if (d < 0) return -1;
            total += d; sr = t[1]; sc = t[2];
        }
        return total;
    }
    private int bfs(List<List<Integer>> g, int sr, int sc, int tr, int tc) {
        if (sr == tr && sc == tc) return 0;
        boolean[][] seen = new boolean[m][n];
        Deque<int[]> q = new ArrayDeque<>();
        q.offer(new int[]{sr, sc, 0}); seen[sr][sc] = true;
        int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
        while (!q.isEmpty()) {
            int[] cur = q.poll();
            for (int[] d : dirs) {
                int nr = cur[0] + d[0], nc = cur[1] + d[1];
                if (nr < 0 || nr >= m || nc < 0 || nc >= n || seen[nr][nc] || g.get(nr).get(nc) == 0) continue;
                if (nr == tr && nc == tc) return cur[2] + 1;
                seen[nr][nc] = true;
                q.offer(new int[]{nr, nc, cur[2] + 1});
            }
        }
        return -1;
    }
}
```

**Key points:**
- Sort trees by height; visit them in that order.
- BFS gives unit-cost shortest path between consecutive trees.
- O(T * m * n) total; encode visited as `r*n + c` for speed.

**Tags:** #algorithm

---

### 28. The Maze II

**Difficulty:** Medium
**Topics:** bfs, dijkstra, matrix
**Position:** SDE
**Years:** L4-L5

**Question:** A ball rolls in a maze until it hits a wall, then can change direction. Given start and destination, return the shortest distance (cells traveled) or -1 if unreachable.

**Approach:** Dijkstra with min-heap of `(dist, r, c)`. From each cell, simulate rolling in each of 4 directions until a wall; that's an edge. Relax neighbors. O(m*n * max(m,n) * log) due to roll cost. BFS doesn't suffice because edge costs differ.

**Python:**
```python
import heapq

def shortest_distance(maze: list[list[int]], start: list[int], destination: list[int]) -> int:
    m, n = len(maze), len(maze[0])
    dist = [[float("inf")] * n for _ in range(m)]
    dist[start[0]][start[1]] = 0
    heap: list[tuple[int, int, int]] = [(0, start[0], start[1])]
    while heap:
        d, r, c = heapq.heappop(heap)
        if [r, c] == destination:
            return d
        if d > dist[r][c]:
            continue
        for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):
            nr, nc, steps = r, c, 0
            while 0 <= nr + dr < m and 0 <= nc + dc < n and maze[nr + dr][nc + dc] == 0:
                nr += dr; nc += dc; steps += 1
            nd = d + steps
            if nd < dist[nr][nc]:
                dist[nr][nc] = nd
                heapq.heappush(heap, (nd, nr, nc))
    return -1
```

**TypeScript:**
```typescript
function shortestDistance(maze: number[][], start: number[], destination: number[]): number {
  const m = maze.length, n = maze[0].length;
  const dist: number[][] = Array.from({ length: m }, () => new Array(n).fill(Infinity));
  dist[start[0]][start[1]] = 0;
  const heap: Array<[number, number, number]> = [[0, start[0], start[1]]];
  while (heap.length) {
    heap.sort((a, b) => a[0] - b[0]);
    const [d, r, c] = heap.shift()!;
    if (r === destination[0] && c === destination[1]) return d;
    if (d > dist[r][c]) continue;
    for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      let nr = r, nc = c, steps = 0;
      while (nr + dr >= 0 && nr + dr < m && nc + dc >= 0 && nc + dc < n && maze[nr + dr][nc + dc] === 0) {
        nr += dr; nc += dc; steps++;
      }
      const nd = d + steps;
      if (nd < dist[nr][nc]) { dist[nr][nc] = nd; heap.push([nd, nr, nc]); }
    }
  }
  return -1;
}
```

**Java:**
```java
class Solution {
    public int shortestDistance(int[][] maze, int[] start, int[] destination) {
        int m = maze.length, n = maze[0].length;
        int[][] dist = new int[m][n];
        for (int[] row : dist) Arrays.fill(row, Integer.MAX_VALUE);
        dist[start[0]][start[1]] = 0;
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        heap.offer(new int[]{0, start[0], start[1]});
        int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
        while (!heap.isEmpty()) {
            int[] cur = heap.poll();
            int d = cur[0], r = cur[1], c = cur[2];
            if (r == destination[0] && c == destination[1]) return d;
            if (d > dist[r][c]) continue;
            for (int[] dir : dirs) {
                int nr = r, nc = c, steps = 0;
                while (nr + dir[0] >= 0 && nr + dir[0] < m && nc + dir[1] >= 0 && nc + dir[1] < n
                       && maze[nr + dir[0]][nc + dir[1]] == 0) {
                    nr += dir[0]; nc += dir[1]; steps++;
                }
                int nd = d + steps;
                if (nd < dist[nr][nc]) { dist[nr][nc] = nd; heap.offer(new int[]{nd, nr, nc}); }
            }
        }
        return -1;
    }
}
```

**Key points:**
- Each "edge" is a roll until a wall, contributing variable cost.
- Dijkstra needed because cell distances differ — BFS would be wrong.
- Stale heap entries skipped via `d > dist[r][c]` check.

**Tags:** #algorithm

---

### 29. Robot Bounded in Circle

**Difficulty:** Medium
**Topics:** simulation, math
**Position:** SDE
**Years:** L4

**Question:** A robot starts at origin facing north and follows a string of instructions (`G`, `L`, `R`). Determine if the robot stays bounded after infinitely repeating instructions.

**Approach:** Simulate one pass. The robot is bounded iff after one pass it's at origin OR not facing north. Reason: facing-not-north means after at most 4 passes it returns to origin (rotation forms a cycle of period 4). O(n).

**Python:**
```python
def is_robot_bounded(instructions: str) -> bool:
    x, y, dx, dy = 0, 0, 0, 1
    for c in instructions:
        if c == "G":
            x += dx; y += dy
        elif c == "L":
            dx, dy = -dy, dx
        else:  # R
            dx, dy = dy, -dx
    return (x, y) == (0, 0) or (dx, dy) != (0, 1)
```

**TypeScript:**
```typescript
function isRobotBounded(instructions: string): boolean {
  let x = 0, y = 0, dx = 0, dy = 1;
  for (const c of instructions) {
    if (c === "G") { x += dx; y += dy; }
    else if (c === "L") { [dx, dy] = [-dy, dx]; }
    else { [dx, dy] = [dy, -dx]; }
  }
  return (x === 0 && y === 0) || dx !== 0 || dy !== 1;
}
```

**Java:**
```java
class Solution {
    public boolean isRobotBounded(String instructions) {
        int x = 0, y = 0, dx = 0, dy = 1;
        for (char c : instructions.toCharArray()) {
            if (c == 'G') { x += dx; y += dy; }
            else if (c == 'L') { int t = dx; dx = -dy; dy = t; }
            else { int t = dx; dx = dy; dy = -t; }
        }
        return (x == 0 && y == 0) || dx != 0 || dy != 1;
    }
}
```

**Key points:**
- Bounded iff at origin after one pass OR facing a non-north direction.
- Non-north facing => after at most 4 passes back to origin.
- O(n) time, O(1) space; no need to simulate multiple passes.

**Tags:** #algorithm

---

### 30. Prison Cells After N Days

**Difficulty:** Medium
**Topics:** simulation, cycle-detection, bit-manipulation
**Position:** SDE
**Years:** L4

**Question:** 8 prison cells in a row. Each day, cell becomes 1 if both neighbors were equal, else 0. Endpoints become 0. Given initial state and N, return state after N days.

**Approach:** State space has at most 256 patterns; cycle is inevitable. Simulate while caching `state -> day`. On hit, compute remaining days `% cycle_length` and finish. Encode state as an int (bitmask) for speed. O(min(N, 256)).

**Python:**
```python
def prison_after_n_days(cells: list[int], n: int) -> list[int]:
    def step(state: int) -> int:
        ns = 0
        for i in range(1, 7):
            if ((state >> (i - 1)) & 1) == ((state >> (i + 1)) & 1):
                ns |= 1 << i
        return ns
    state = 0
    for i, v in enumerate(cells):
        if v:
            state |= 1 << i
    seen: dict[int, int] = {}
    while n:
        if state in seen:
            n %= seen[state] - n
        seen[state] = n
        if n:
            n -= 1
            state = step(state)
    return [(state >> i) & 1 for i in range(8)]
```

**TypeScript:**
```typescript
function prisonAfterNDays(cells: number[], n: number): number[] {
  const step = (s: number): number => {
    let ns = 0;
    for (let i = 1; i < 7; i++)
      if (((s >> (i - 1)) & 1) === ((s >> (i + 1)) & 1)) ns |= 1 << i;
    return ns;
  };
  let state = 0;
  cells.forEach((v, i) => { if (v) state |= 1 << i; });
  const seen = new Map<number, number>();
  while (n) {
    if (seen.has(state)) n %= seen.get(state)! - n;
    seen.set(state, n);
    if (n) { n--; state = step(state); }
  }
  return Array.from({ length: 8 }, (_, i) => (state >> i) & 1);
}
```

**Java:**
```java
class Solution {
    public int[] prisonAfterNDays(int[] cells, int n) {
        int state = 0;
        for (int i = 0; i < cells.length; i++) if (cells[i] == 1) state |= 1 << i;
        Map<Integer, Integer> seen = new HashMap<>();
        while (n > 0) {
            if (seen.containsKey(state)) n %= seen.get(state) - n;
            seen.put(state, n);
            if (n > 0) { n--; state = step(state); }
        }
        int[] out = new int[8];
        for (int i = 0; i < 8; i++) out[i] = (state >> i) & 1;
        return out;
    }
    private int step(int s) {
        int ns = 0;
        for (int i = 1; i < 7; i++)
            if (((s >> (i - 1)) & 1) == ((s >> (i + 1)) & 1)) ns |= 1 << i;
        return ns;
    }
}
```

**Key points:**
- Bitmask packs 8 cells into a single int for fast equality.
- Cycle detected via `state -> remaining_days` map.
- O(min(N, 256)) — at most 256 distinct states.

**Tags:** #algorithm

---

### 31. Concatenated Words

**Difficulty:** Hard
**Topics:** dp, trie, strings
**Position:** Senior SDE
**Years:** L5

**Question:** Given a list of words (no duplicates), return all words that are entirely concatenations of at least two other words from the list.

**Approach:** Build a set of all words. For each word, run a Word-Break-style DP: `dp[i]` true if `s[0..i)` splittable using OTHER words (require at least one split). Trie speeds up prefix scans. O(sum(L_i^2)). Sort by length first so shorter words are processed first if building incrementally.

**Python:**
```python
def find_all_concatenated_words(words: list[str]) -> list[str]:
    word_set = set(words)
    def can_form(w: str) -> bool:
        if not w:
            return False
        n = len(w)
        dp = [False] * (n + 1)
        dp[0] = True
        for i in range(1, n + 1):
            for j in range(i):
                if dp[j] and w[j:i] in word_set and (j > 0 or i < n):
                    dp[i] = True
                    break
        return dp[n]
    return [w for w in words if can_form(w)]
```

**TypeScript:**
```typescript
function findAllConcatenatedWordsInADict(words: string[]): string[] {
  const set = new Set(words);
  const canForm = (w: string): boolean => {
    if (!w) return false;
    const n = w.length;
    const dp = new Array<boolean>(n + 1).fill(false);
    dp[0] = true;
    for (let i = 1; i <= n; i++) {
      for (let j = 0; j < i; j++) {
        if (dp[j] && set.has(w.slice(j, i)) && (j > 0 || i < n)) { dp[i] = true; break; }
      }
    }
    return dp[n];
  };
  return words.filter(canForm);
}
```

**Java:**
```java
class Solution {
    public List<String> findAllConcatenatedWordsInADict(String[] words) {
        Set<String> set = new HashSet<>(Arrays.asList(words));
        List<String> res = new ArrayList<>();
        for (String w : words) if (canForm(w, set)) res.add(w);
        return res;
    }
    private boolean canForm(String w, Set<String> set) {
        if (w.isEmpty()) return false;
        int n = w.length();
        boolean[] dp = new boolean[n + 1];
        dp[0] = true;
        for (int i = 1; i <= n; i++) {
            for (int j = 0; j < i; j++) {
                if (dp[j] && set.contains(w.substring(j, i)) && (j > 0 || i < n)) { dp[i] = true; break; }
            }
        }
        return dp[n];
    }
}
```

**Key points:**
- The `(j > 0 || i < n)` guard rejects the word matching itself wholly.
- O(sum L_i^2) per word; trie reduces inner cost further.
- Same shape as Word Break with a "use at least one other word" rule.

**Tags:** #algorithm

---

### 32. Substrings of Size Three with Distinct Characters

**Difficulty:** Easy
**Topics:** strings, sliding-window
**Position:** SDE
**Years:** L3-L4

**Question:** Given a string, return the number of good substrings of length 3 with all distinct characters.

**Approach:** Sliding window of size 3; for each, check three chars all differ. O(n). Common Amazon OA warm-up; usually paired with a harder second problem.

**Python:**
```python
def count_good_substrings(s: str) -> int:
    count = 0
    for i in range(len(s) - 2):
        a, b, c = s[i], s[i + 1], s[i + 2]
        if a != b and b != c and a != c:
            count += 1
    return count
```

**TypeScript:**
```typescript
function countGoodSubstrings(s: string): number {
  let count = 0;
  for (let i = 0; i < s.length - 2; i++) {
    const a = s[i], b = s[i + 1], c = s[i + 2];
    if (a !== b && b !== c && a !== c) count++;
  }
  return count;
}
```

**Java:**
```java
class Solution {
    public int countGoodSubstrings(String s) {
        int count = 0;
        for (int i = 0; i + 2 < s.length(); i++) {
            char a = s.charAt(i), b = s.charAt(i + 1), c = s.charAt(i + 2);
            if (a != b && b != c && a != c) count++;
        }
        return count;
    }
}
```

**Key points:**
- Window size is fixed, so no two-pointer bookkeeping needed.
- Three distinct chars iff all three pairwise differ.
- O(n) time, O(1) space.

**Tags:** #algorithm

---

### 33. Subtree of Another Tree

**Difficulty:** Easy
**Topics:** tree, dfs, recursion
**Position:** SDE
**Years:** L4

**Question:** Given two binary trees `root` and `subRoot`, return true if there's a subtree of `root` identical in structure and node values to `subRoot`.

**Approach:** Recursive: at each node of `root`, check if `sameTree(node, subRoot)`. `sameTree` recurses both sides. O(m*n) worst case. Faster: serialize both trees with null markers and use string `contains` (or KMP) — O(m+n).

**Python:**
```python
def is_subtree(root: TreeNode | None, sub_root: TreeNode | None) -> bool:
    def same(a: TreeNode | None, b: TreeNode | None) -> bool:
        if a is None and b is None:
            return True
        if a is None or b is None or a.val != b.val:
            return False
        return same(a.left, b.left) and same(a.right, b.right)
    if sub_root is None:
        return True
    if root is None:
        return False
    if same(root, sub_root):
        return True
    return is_subtree(root.left, sub_root) or is_subtree(root.right, sub_root)
```

**TypeScript:**
```typescript
function isSubtree(root: TreeNode | null, subRoot: TreeNode | null): boolean {
  const same = (a: TreeNode | null, b: TreeNode | null): boolean => {
    if (!a && !b) return true;
    if (!a || !b || a.val !== b.val) return false;
    return same(a.left, b.left) && same(a.right, b.right);
  };
  if (!subRoot) return true;
  if (!root) return false;
  if (same(root, subRoot)) return true;
  return isSubtree(root.left, subRoot) || isSubtree(root.right, subRoot);
}
```

**Java:**
```java
class Solution {
    public boolean isSubtree(TreeNode root, TreeNode subRoot) {
        if (subRoot == null) return true;
        if (root == null) return false;
        if (same(root, subRoot)) return true;
        return isSubtree(root.left, subRoot) || isSubtree(root.right, subRoot);
    }
    private boolean same(TreeNode a, TreeNode b) {
        if (a == null && b == null) return true;
        if (a == null || b == null || a.val != b.val) return false;
        return same(a.left, b.left) && same(a.right, b.right);
    }
}
```

**Key points:**
- Empty `subRoot` is trivially a subtree.
- Worst case O(m * n) where m, n are tree sizes.
- Serialization with null markers + KMP collapses it to O(m + n).

**Tags:** #algorithm

---

### 34. Most Common Word

**Difficulty:** Easy
**Topics:** strings, hashmap, parsing
**Position:** SDE
**Years:** L3-L4

**Question:** Given a paragraph and a list of banned words, return the most frequent non-banned word. Words are case-insensitive; punctuation should be stripped.

**Approach:** Normalize (lowercase, split on non-letters), count frequencies in a hashmap excluding banned set, return max. O(n). Watch the punctuation regex / manual char filter — most bugs live there.

**Python:**
```python
import re
from collections import Counter

def most_common_word(paragraph: str, banned: list[str]) -> str:
    banned_set = set(banned)
    words = re.findall(r"[a-zA-Z]+", paragraph.lower())
    cnt = Counter(w for w in words if w not in banned_set)
    return cnt.most_common(1)[0][0]
```

**TypeScript:**
```typescript
function mostCommonWord(paragraph: string, banned: string[]): string {
  const bannedSet = new Set(banned);
  const words = paragraph.toLowerCase().match(/[a-z]+/g) ?? [];
  const cnt = new Map<string, number>();
  let best = "", bestN = 0;
  for (const w of words) {
    if (bannedSet.has(w)) continue;
    const c = (cnt.get(w) ?? 0) + 1;
    cnt.set(w, c);
    if (c > bestN) { bestN = c; best = w; }
  }
  return best;
}
```

**Java:**
```java
class Solution {
    public String mostCommonWord(String paragraph, String[] banned) {
        Set<String> bannedSet = new HashSet<>(Arrays.asList(banned));
        String[] words = paragraph.toLowerCase().split("[^a-z]+");
        Map<String, Integer> cnt = new HashMap<>();
        String best = ""; int bestN = 0;
        for (String w : words) {
            if (w.isEmpty() || bannedSet.contains(w)) continue;
            int c = cnt.merge(w, 1, Integer::sum);
            if (c > bestN) { bestN = c; best = w; }
        }
        return best;
    }
}
```

**Key points:**
- Lowercase before splitting to make banned compare case-insensitive.
- Single regex handles punctuation, digits, whitespace at once.
- O(n) over the paragraph length.

**Tags:** #algorithm

---

### 35. Copy List with Random Pointer

**Difficulty:** Medium
**Topics:** linked-list, hashmap
**Position:** SDE
**Years:** L4

**Question:** Deep-copy a linked list where each node has `next` and a `random` pointer to any node or null.

**Approach:** Option A: hashmap `original -> copy`, two passes (build nodes, then wire `next`/`random`). O(n) time and space. Option B (O(1) extra): interleave copy nodes (`A -> A' -> B -> B' -> ...`), then `A'.random = A.random.next`, then split lists.

**Python:**
```python
def copy_random_list(head: "Node | None") -> "Node | None":
    if not head:
        return None
    m: dict[Node, Node] = {}
    cur = head
    while cur:
        m[cur] = Node(cur.val)
        cur = cur.next
    cur = head
    while cur:
        m[cur].next = m[cur.next] if cur.next else None
        m[cur].random = m[cur.random] if cur.random else None
        cur = cur.next
    return m[head]
```

**TypeScript:**
```typescript
function copyRandomList(head: RNode | null): RNode | null {
  if (!head) return null;
  const m = new Map<RNode, RNode>();
  let cur: RNode | null = head;
  while (cur) { m.set(cur, new RNode(cur.val)); cur = cur.next; }
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
- Two passes separate node creation from pointer wiring cleanly.
- Map handles `random` pointing forward, backward, or at self.
- O(n) time and O(n) space; O(1)-space interleave variant exists but is trickier.

**Tags:** #algorithm

---

### 36. Path with Maximum Probability

**Difficulty:** Medium
**Topics:** graph, dijkstra, heap
**Position:** SDE
**Years:** L4-L5

**Question:** Given an undirected weighted graph where weights are probabilities of success, return the maximum probability path from `start` to `end`.

**Approach:** Modified Dijkstra with max-heap (negate probs in languages with only min-heap). Multiply (not add) probabilities. Skip stale heap entries. O((V+E) log V). Note: log-transforming probs (`-log p`) converts to standard shortest-path; avoids underflow on long paths.

**Python:**
```python
import heapq
from collections import defaultdict

def max_probability(n: int, edges: list[list[int]], succ_prob: list[float], start: int, end: int) -> float:
    graph: defaultdict[int, list[tuple[int, float]]] = defaultdict(list)
    for (a, b), p in zip(edges, succ_prob):
        graph[a].append((b, p)); graph[b].append((a, p))
    best = [0.0] * n
    best[start] = 1.0
    heap: list[tuple[float, int]] = [(-1.0, start)]
    while heap:
        neg_p, u = heapq.heappop(heap)
        p = -neg_p
        if u == end:
            return p
        if p < best[u]:
            continue
        for v, w in graph[u]:
            np = p * w
            if np > best[v]:
                best[v] = np
                heapq.heappush(heap, (-np, v))
    return 0.0
```

**TypeScript:**
```typescript
function maxProbability(n: number, edges: number[][], succProb: number[], start: number, end: number): number {
  const graph: Array<Array<[number, number]>> = Array.from({ length: n }, () => []);
  edges.forEach(([a, b], i) => { graph[a].push([b, succProb[i]]); graph[b].push([a, succProb[i]]); });
  const best = new Array(n).fill(0);
  best[start] = 1;
  const heap: Array<[number, number]> = [[1, start]];
  while (heap.length) {
    heap.sort((a, b) => b[0] - a[0]);
    const [p, u] = heap.shift()!;
    if (u === end) return p;
    if (p < best[u]) continue;
    for (const [v, w] of graph[u]) {
      const np = p * w;
      if (np > best[v]) { best[v] = np; heap.push([np, v]); }
    }
  }
  return 0;
}
```

**Java:**
```java
class Solution {
    public double maxProbability(int n, int[][] edges, double[] succProb, int start, int end) {
        List<List<double[]>> graph = new ArrayList<>();
        for (int i = 0; i < n; i++) graph.add(new ArrayList<>());
        for (int i = 0; i < edges.length; i++) {
            graph.get(edges[i][0]).add(new double[]{edges[i][1], succProb[i]});
            graph.get(edges[i][1]).add(new double[]{edges[i][0], succProb[i]});
        }
        double[] best = new double[n];
        best[start] = 1.0;
        PriorityQueue<double[]> heap = new PriorityQueue<>((a, b) -> Double.compare(b[0], a[0]));
        heap.offer(new double[]{1.0, start});
        while (!heap.isEmpty()) {
            double[] cur = heap.poll();
            double p = cur[0]; int u = (int) cur[1];
            if (u == end) return p;
            if (p < best[u]) continue;
            for (double[] nb : graph.get(u)) {
                double np = p * nb[1];
                int v = (int) nb[0];
                if (np > best[v]) { best[v] = np; heap.offer(new double[]{np, v}); }
            }
        }
        return 0.0;
    }
}
```

**Key points:**
- Multiply probabilities along the path; use max-heap by probability.
- Negate to reuse a min-heap in Python.
- Skip stale entries when `p < best[u]`; O((V + E) log V) time.

**Tags:** #algorithm

---

### 37. Number of Islands II

**Difficulty:** Hard
**Topics:** union-find, graph
**Position:** Senior SDE
**Years:** L5-L6

**Question:** Given an `m x n` grid initially all water, process a stream of `addLand(r, c)` operations. After each op, return current island count.

**Approach:** Union-Find with path compression and union-by-rank. On each add: count++; union with each of 4 land neighbors and decrement count for each successful union. O(k * alpha(m*n)) for k ops. Encode (r,c) as `r*n + c`.

**Python:**
```python
def num_islands2(m: int, n: int, positions: list[list[int]]) -> list[int]:
    parent: dict[int, int] = {}
    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    count = 0
    res: list[int] = []
    for r, c in positions:
        idx = r * n + c
        if idx in parent:
            res.append(count); continue
        parent[idx] = idx
        count += 1
        for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):
            nr, nc = r + dr, c + dc
            ni = nr * n + nc
            if 0 <= nr < m and 0 <= nc < n and ni in parent:
                ra, rb = find(idx), find(ni)
                if ra != rb:
                    parent[ra] = rb
                    count -= 1
        res.append(count)
    return res
```

**TypeScript:**
```typescript
function numIslands2(m: number, n: number, positions: number[][]): number[] {
  const parent = new Map<number, number>();
  const find = (x: number): number => {
    while (parent.get(x)! !== x) { parent.set(x, parent.get(parent.get(x)!)!); x = parent.get(x)!; }
    return x;
  };
  let count = 0;
  const res: number[] = [];
  for (const [r, c] of positions) {
    const idx = r * n + c;
    if (parent.has(idx)) { res.push(count); continue; }
    parent.set(idx, idx); count++;
    for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nr = r + dr, nc = c + dc, ni = nr * n + nc;
      if (nr >= 0 && nr < m && nc >= 0 && nc < n && parent.has(ni)) {
        const ra = find(idx), rb = find(ni);
        if (ra !== rb) { parent.set(ra, rb); count--; }
      }
    }
    res.push(count);
  }
  return res;
}
```

**Java:**
```java
class Solution {
    private Map<Integer, Integer> parent;
    public List<Integer> numIslands2(int m, int n, int[][] positions) {
        parent = new HashMap<>();
        int count = 0;
        List<Integer> res = new ArrayList<>();
        int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
        for (int[] p : positions) {
            int idx = p[0] * n + p[1];
            if (parent.containsKey(idx)) { res.add(count); continue; }
            parent.put(idx, idx); count++;
            for (int[] d : dirs) {
                int nr = p[0] + d[0], nc = p[1] + d[1], ni = nr * n + nc;
                if (nr < 0 || nr >= m || nc < 0 || nc >= n || !parent.containsKey(ni)) continue;
                int ra = find(idx), rb = find(ni);
                if (ra != rb) { parent.put(ra, rb); count--; }
            }
            res.add(count);
        }
        return res;
    }
    private int find(int x) {
        while (parent.get(x) != x) { parent.put(x, parent.get(parent.get(x))); x = parent.get(x); }
        return x;
    }
}
```

**Key points:**
- New land starts as its own component, incrementing count.
- Each successful union with a neighbor decrements count.
- O(k * alpha(m*n)) per op with path compression.

**Tags:** #algorithm

---

### 38. Optimize Water Distribution in a Village

**Difficulty:** Hard
**Topics:** graph, mst, union-find
**Position:** Senior SDE
**Years:** L5-L6

**Question:** `n` houses; can either build a well in house `i` (cost `wells[i]`) or connect two houses with a pipe of given cost. Find minimum total cost to supply water to every house.

**Approach:** Add a virtual node 0 connected to each house `i` with edge weight `wells[i]`. Now problem = MST on `n+1` nodes. Kruskal with union-find on sorted edges. O((E + n) log(E + n)). Elegant reduction trick worth memorizing.

**Python:**
```python
def min_cost_to_supply_water(n: int, wells: list[int], pipes: list[list[int]]) -> int:
    edges: list[tuple[int, int, int]] = [(cost, 0, i + 1) for i, cost in enumerate(wells)]
    for a, b, c in pipes:
        edges.append((c, a, b))
    edges.sort()
    parent = list(range(n + 1))
    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    total = 0
    for c, a, b in edges:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb
            total += c
    return total
```

**TypeScript:**
```typescript
function minCostToSupplyWater(n: number, wells: number[], pipes: number[][]): number {
  const edges: Array<[number, number, number]> = wells.map((c, i) => [c, 0, i + 1]);
  for (const [a, b, c] of pipes) edges.push([c, a, b]);
  edges.sort((x, y) => x[0] - y[0]);
  const parent = Array.from({ length: n + 1 }, (_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  };
  let total = 0;
  for (const [c, a, b] of edges) {
    const ra = find(a), rb = find(b);
    if (ra !== rb) { parent[ra] = rb; total += c; }
  }
  return total;
}
```

**Java:**
```java
class Solution {
    private int[] parent;
    public int minCostToSupplyWater(int n, int[] wells, int[][] pipes) {
        List<int[]> edges = new ArrayList<>();
        for (int i = 0; i < wells.length; i++) edges.add(new int[]{wells[i], 0, i + 1});
        for (int[] p : pipes) edges.add(new int[]{p[2], p[0], p[1]});
        edges.sort((a, b) -> a[0] - b[0]);
        parent = new int[n + 1];
        for (int i = 0; i <= n; i++) parent[i] = i;
        int total = 0;
        for (int[] e : edges) {
            int ra = find(e[1]), rb = find(e[2]);
            if (ra != rb) { parent[ra] = rb; total += e[0]; }
        }
        return total;
    }
    private int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }
}
```

**Key points:**
- Virtual node 0 turns "build a well" into "edge to 0" — pure MST.
- Kruskal + union-find: O((E + n) log(E + n)).
- Each house ends up connected via either pipes or the well edge.

**Tags:** #algorithm

---

### 39. K Closest Points to Origin

**Difficulty:** Medium
**Topics:** heap, quickselect, sorting
**Position:** SDE
**Years:** L4

**Question:** Given an array of points in 2D plane, return the `k` closest to origin.

**Approach:** Max-heap of size k by squared distance — push, pop if size > k. O(n log k). Better: Quickselect partition around median — O(n) average, O(n^2) worst. Avoid sqrt; compare squared distances. Classic Amazon "closest delivery zones" framing.

**Python:**
```python
import heapq

def k_closest(points: list[list[int]], k: int) -> list[list[int]]:
    heap: list[tuple[int, list[int]]] = []
    for p in points:
        d = -(p[0] * p[0] + p[1] * p[1])
        if len(heap) < k:
            heapq.heappush(heap, (d, p))
        elif d > heap[0][0]:
            heapq.heapreplace(heap, (d, p))
    return [p for _, p in heap]
```

**TypeScript:**
```typescript
function kClosest(points: number[][], k: number): number[][] {
  const heap: Array<[number, number[]]> = [];
  for (const p of points) {
    const d = p[0] * p[0] + p[1] * p[1];
    heap.push([d, p]);
  }
  heap.sort((a, b) => a[0] - b[0]);
  return heap.slice(0, k).map(([, p]) => p);
}
```

**Java:**
```java
class Solution {
    public int[][] kClosest(int[][] points, int k) {
        PriorityQueue<int[]> heap = new PriorityQueue<>(
            (a, b) -> (b[0]*b[0] + b[1]*b[1]) - (a[0]*a[0] + a[1]*a[1]));
        for (int[] p : points) {
            heap.offer(p);
            if (heap.size() > k) heap.poll();
        }
        int[][] out = new int[k][2];
        for (int i = 0; i < k; i++) out[i] = heap.poll();
        return out;
    }
}
```

**Key points:**
- Compare squared distances to avoid `sqrt`.
- Heap of size k yields O(n log k); Quickselect averages O(n).
- Python uses negative distance to simulate max-heap on a min-heap.

**Tags:** #algorithm

---

### 40. Meeting Rooms II

**Difficulty:** Medium
**Topics:** heap, intervals, sorting
**Position:** SDE
**Years:** L4

**Question:** Given an array of meeting time intervals `[start, end)`, return the minimum number of conference rooms required.

**Approach:** Sort by start. Min-heap of end times. For each meeting, if `heap.top() <= start`, pop (room freed). Push current end. Heap size at any time = active rooms; answer = max size. O(n log n). Alternative: chronological sweep with +1/-1 events.

**Python:**
```python
import heapq

def min_meeting_rooms(intervals: list[list[int]]) -> int:
    if not intervals:
        return 0
    intervals.sort(key=lambda x: x[0])
    heap: list[int] = []
    for start, end in intervals:
        if heap and heap[0] <= start:
            heapq.heappop(heap)
        heapq.heappush(heap, end)
    return len(heap)
```

**TypeScript:**
```typescript
function minMeetingRooms(intervals: number[][]): number {
  if (!intervals.length) return 0;
  intervals.sort((a, b) => a[0] - b[0]);
  const heap: number[] = [];
  for (const [s, e] of intervals) {
    if (heap.length && heap[0] <= s) { heap.shift(); }
    heap.push(e);
    heap.sort((a, b) => a - b);
  }
  return heap.length;
}
```

**Java:**
```java
class Solution {
    public int minMeetingRooms(int[][] intervals) {
        if (intervals.length == 0) return 0;
        Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        for (int[] iv : intervals) {
            if (!heap.isEmpty() && heap.peek() <= iv[0]) heap.poll();
            heap.offer(iv[1]);
        }
        return heap.size();
    }
}
```

**Key points:**
- Sort by start time so meetings are processed in order.
- Heap top = earliest-ending room; reuse it if free.
- Final heap size = peak concurrent rooms; O(n log n).

**Tags:** #algorithm

---

### 41. Find Median from Data Stream

**Difficulty:** Hard
**Topics:** heap, design, streaming
**Position:** Senior SDE
**Years:** L5

**Question:** Design a class supporting `addNum(int)` and `findMedian()` returning the median of all numbers seen so far.

**Approach:** Two heaps: max-heap `lo` (lower half) and min-heap `hi` (upper half). Maintain `|lo| - |hi| in {0, 1}`. `addNum`: push to `lo`, move `lo.top()` to `hi`, rebalance. `findMedian`: if sizes equal, average tops; else `lo.top()`. O(log n) add, O(1) median.

**Python:**
```python
import heapq

class MedianFinder:
    def __init__(self) -> None:
        self.lo: list[int] = []  # max-heap (negated)
        self.hi: list[int] = []  # min-heap

    def addNum(self, num: int) -> None:
        heapq.heappush(self.lo, -num)
        heapq.heappush(self.hi, -heapq.heappop(self.lo))
        if len(self.hi) > len(self.lo):
            heapq.heappush(self.lo, -heapq.heappop(self.hi))

    def findMedian(self) -> float:
        if len(self.lo) > len(self.hi):
            return float(-self.lo[0])
        return (-self.lo[0] + self.hi[0]) / 2
```

**TypeScript:**
```typescript
class MedianFinder {
  private lo: number[] = [];  // max-heap simulated by sort desc
  private hi: number[] = [];  // min-heap simulated by sort asc
  addNum(num: number): void {
    this.lo.push(num); this.lo.sort((a, b) => b - a);
    this.hi.push(this.lo.shift()!); this.hi.sort((a, b) => a - b);
    if (this.hi.length > this.lo.length) {
      this.lo.push(this.hi.shift()!); this.lo.sort((a, b) => b - a);
    }
  }
  findMedian(): number {
    if (this.lo.length > this.hi.length) return this.lo[0];
    return (this.lo[0] + this.hi[0]) / 2;
  }
}
```

**Java:**
```java
class MedianFinder {
    private final PriorityQueue<Integer> lo = new PriorityQueue<>(Collections.reverseOrder());
    private final PriorityQueue<Integer> hi = new PriorityQueue<>();
    public void addNum(int num) {
        lo.offer(num);
        hi.offer(lo.poll());
        if (hi.size() > lo.size()) lo.offer(hi.poll());
    }
    public double findMedian() {
        if (lo.size() > hi.size()) return lo.peek();
        return (lo.peek() + hi.peek()) / 2.0;
    }
}
```

**Key points:**
- Invariant: `|lo| - |hi| in {0, 1}` with `lo`'s top <= `hi`'s top.
- O(log n) per insert; O(1) median lookup.
- Push to lo then move top to hi enforces the ordering automatically.

**Tags:** #algorithm

---

### 42. Serialize and Deserialize Binary Tree

**Difficulty:** Hard
**Topics:** tree, dfs, bfs, design
**Position:** Senior SDE
**Years:** L5

**Question:** Design an algorithm to serialize a binary tree to a string and deserialize it back.

**Approach:** Preorder DFS with null markers: `"1,2,#,#,3,#,#"`. Deserialize via queue/iterator consuming tokens recursively. O(n) both ways. Level-order (BFS) also works and is more readable for debugging. Be explicit about delimiter and null sentinel.

**Python:**
```python
def serialize(root: TreeNode | None) -> str:
    parts: list[str] = []
    def go(node: TreeNode | None) -> None:
        if node is None:
            parts.append("#"); return
        parts.append(str(node.val))
        go(node.left); go(node.right)
    go(root)
    return ",".join(parts)

def deserialize(data: str) -> TreeNode | None:
    it = iter(data.split(","))
    def go() -> TreeNode | None:
        v = next(it)
        if v == "#":
            return None
        node = TreeNode(int(v))
        node.left = go(); node.right = go()
        return node
    return go()
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
  const go = (): TreeNode | null => {
    const v = tokens[i++];
    if (v === "#") return null;
    const node = new TreeNode(parseInt(v, 10));
    node.left = go(); node.right = go();
    return node;
  };
  return go();
}
```

**Java:**
```java
public class Codec {
    public String serialize(TreeNode root) {
        StringBuilder sb = new StringBuilder();
        go(root, sb);
        return sb.toString();
    }
    private void go(TreeNode n, StringBuilder sb) {
        if (n == null) { sb.append("#,"); return; }
        sb.append(n.val).append(',');
        go(n.left, sb); go(n.right, sb);
    }
    public TreeNode deserialize(String data) {
        Deque<String> tokens = new ArrayDeque<>(Arrays.asList(data.split(",")));
        return build(tokens);
    }
    private TreeNode build(Deque<String> tokens) {
        String v = tokens.poll();
        if (v == null || v.equals("#")) return null;
        TreeNode node = new TreeNode(Integer.parseInt(v));
        node.left = build(tokens); node.right = build(tokens);
        return node;
    }
}
```

**Key points:**
- Preorder with null markers reconstructs structure unambiguously.
- O(n) tokens for serialize and deserialize.
- Use a shared cursor/iterator to consume tokens in order.

**Tags:** #algorithm

---

### 43. Word Search II

**Difficulty:** Hard
**Topics:** trie, backtracking, dfs, matrix
**Position:** Senior SDE
**Years:** L5

**Question:** Given a `m x n` board of characters and a list of words, return all words that exist in the board (adjacent cells, no reuse within a word).

**Approach:** Build a trie of all words. DFS each cell, walking the trie in lockstep with the path. On reaching a trie node marking a word, collect it and clear the marker (avoid duplicates). Prune dead trie branches after exhaustion. O(m*n * 4^L). Trie is the trick — naive per-word DFS TLEs.

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
    out: list[str] = []
    def dfs(r: int, c: int, node: dict) -> None:
        ch = board[r][c]
        nxt = node.get(ch)
        if nxt is None:
            return
        if "$" in nxt:
            out.append(nxt.pop("$"))
        board[r][c] = "#"
        for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < m and 0 <= nc < n and board[nr][nc] != "#":
                dfs(nr, nc, nxt)
        board[r][c] = ch
        if not nxt:
            node.pop(ch, None)
    for r in range(m):
        for c in range(n):
            dfs(r, c, trie)
    return out
```

**TypeScript:**
```typescript
function findWords(board: string[][], words: string[]): string[] {
  type Node = { [k: string]: Node | string };
  const trie: Node = {};
  for (const w of words) {
    let node: Node = trie;
    for (const c of w) { if (!node[c]) node[c] = {} as Node; node = node[c] as Node; }
    (node as any).$ = w;
  }
  const m = board.length, n = board[0].length;
  const out: string[] = [];
  const dfs = (r: number, c: number, node: Node): void => {
    const ch = board[r][c];
    const nxt = node[ch] as Node | undefined;
    if (!nxt) return;
    if ((nxt as any).$) { out.push((nxt as any).$); delete (nxt as any).$; }
    board[r][c] = "#";
    for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < m && nc >= 0 && nc < n && board[nr][nc] !== "#") dfs(nr, nc, nxt);
    }
    board[r][c] = ch;
    if (Object.keys(nxt).length === 0) delete node[ch];
  };
  for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) dfs(r, c, trie);
  return out;
}
```

**Java:**
```java
class Solution {
    static class Node { Map<Character, Node> kids = new HashMap<>(); String word; }
    private char[][] board; private int m, n;
    private final List<String> out = new ArrayList<>();
    public List<String> findWords(char[][] board, String[] words) {
        this.board = board; m = board.length; n = board[0].length;
        Node root = new Node();
        for (String w : words) {
            Node cur = root;
            for (char c : w.toCharArray()) cur = cur.kids.computeIfAbsent(c, k -> new Node());
            cur.word = w;
        }
        for (int r = 0; r < m; r++) for (int c = 0; c < n; c++) dfs(r, c, root);
        return out;
    }
    private void dfs(int r, int c, Node node) {
        if (r < 0 || r >= m || c < 0 || c >= n) return;
        char ch = board[r][c];
        Node nxt = ch == '#' ? null : node.kids.get(ch);
        if (nxt == null) return;
        if (nxt.word != null) { out.add(nxt.word); nxt.word = null; }
        board[r][c] = '#';
        dfs(r + 1, c, nxt); dfs(r - 1, c, nxt); dfs(r, c + 1, nxt); dfs(r, c - 1, nxt);
        board[r][c] = ch;
        if (nxt.kids.isEmpty()) node.kids.remove(ch);
    }
}
```

**Key points:**
- Walk the trie in lockstep with the DFS so dead branches prune.
- Pop `$` after collecting to avoid duplicates without an extra set.
- Backtrack by restoring the original char after visiting children.

**Tags:** #algorithm

---

### 44. Maximum Units on a Truck

**Difficulty:** Easy
**Topics:** greedy, sorting
**Position:** SDE
**Years:** L3-L4

**Question:** Given box types `[count, unitsPerBox]` and a truck capacity `truckSize` boxes, return the max number of units.

**Approach:** Sort by `unitsPerBox` descending. Greedily take as many of the highest-unit boxes as fit. O(n log n). Amazon OA staple framed around delivery trucks.

**Python:**
```python
def maximum_units(box_types: list[list[int]], truck_size: int) -> int:
    box_types.sort(key=lambda b: -b[1])
    total = 0
    for count, units in box_types:
        take = min(count, truck_size)
        total += take * units
        truck_size -= take
        if truck_size == 0:
            break
    return total
```

**TypeScript:**
```typescript
function maximumUnits(boxTypes: number[][], truckSize: number): number {
  boxTypes.sort((a, b) => b[1] - a[1]);
  let total = 0;
  for (const [count, units] of boxTypes) {
    const take = Math.min(count, truckSize);
    total += take * units;
    truckSize -= take;
    if (truckSize === 0) break;
  }
  return total;
}
```

**Java:**
```java
class Solution {
    public int maximumUnits(int[][] boxTypes, int truckSize) {
        Arrays.sort(boxTypes, (a, b) -> b[1] - a[1]);
        int total = 0;
        for (int[] b : boxTypes) {
            int take = Math.min(b[0], truckSize);
            total += take * b[1];
            truckSize -= take;
            if (truckSize == 0) break;
        }
        return total;
    }
}
```

**Key points:**
- Greedy by units-per-box descending; never beats taking high-density first.
- O(n log n) for the sort dominates.
- Break early once the truck is full.

**Tags:** #algorithm

---

### 45. Analyze User Website Visit Pattern

**Difficulty:** Medium
**Topics:** hashmap, sorting, strings
**Position:** SDE
**Years:** L4

**Question:** Given parallel arrays of users, timestamps, and websites, find the 3-sequence (ordered triple of sites) visited by the most users. Tie-break lexicographically.

**Approach:** Group visits by user, sort each user's by timestamp. For each user, enumerate all combinations of 3 distinct positions (use a set to dedupe per user). Count sequences across users. Return max with lexicographic tie-break. O(sum nCk * U). Watch the per-user dedupe carefully — otherwise one user dominates.

**Python:**
```python
from collections import defaultdict
from itertools import combinations

def most_visited_pattern(username: list[str], timestamp: list[int], website: list[str]) -> list[str]:
    by_user: defaultdict[str, list[tuple[int, str]]] = defaultdict(list)
    for u, t, w in zip(username, timestamp, website):
        by_user[u].append((t, w))
    cnt: defaultdict[tuple[str, str, str], int] = defaultdict(int)
    for visits in by_user.values():
        visits.sort()
        seen: set[tuple[str, str, str]] = set()
        for a, b, c in combinations((w for _, w in visits), 3):
            seen.add((a, b, c))
        for triple in seen:
            cnt[triple] += 1
    best = min(((-v, k) for k, v in cnt.items()))
    return list(best[1])
```

**TypeScript:**
```typescript
function mostVisitedPattern(username: string[], timestamp: number[], website: string[]): string[] {
  const byUser = new Map<string, Array<[number, string]>>();
  for (let i = 0; i < username.length; i++) {
    if (!byUser.has(username[i])) byUser.set(username[i], []);
    byUser.get(username[i])!.push([timestamp[i], website[i]]);
  }
  const cnt = new Map<string, number>();
  for (const visits of byUser.values()) {
    visits.sort((a, b) => a[0] - b[0]);
    const sites = visits.map(v => v[1]);
    const seen = new Set<string>();
    for (let i = 0; i < sites.length; i++)
      for (let j = i + 1; j < sites.length; j++)
        for (let k = j + 1; k < sites.length; k++)
          seen.add(`${sites[i]},${sites[j]},${sites[k]}`);
    for (const s of seen) cnt.set(s, (cnt.get(s) ?? 0) + 1);
  }
  let best = "", bestN = -1;
  for (const [k, v] of cnt) {
    if (v > bestN || (v === bestN && k < best)) { best = k; bestN = v; }
  }
  return best.split(",");
}
```

**Java:**
```java
class Solution {
    public List<String> mostVisitedPattern(String[] username, int[] timestamp, String[] website) {
        Map<String, List<int[]>> byUser = new HashMap<>();
        for (int i = 0; i < username.length; i++) {
            byUser.computeIfAbsent(username[i], k -> new ArrayList<>())
                  .add(new int[]{timestamp[i], i});
        }
        Map<String, Integer> cnt = new HashMap<>();
        for (List<int[]> visits : byUser.values()) {
            visits.sort((a, b) -> a[0] - b[0]);
            Set<String> seen = new HashSet<>();
            int s = visits.size();
            for (int i = 0; i < s; i++)
                for (int j = i + 1; j < s; j++)
                    for (int k = j + 1; k < s; k++)
                        seen.add(website[visits.get(i)[1]] + "," + website[visits.get(j)[1]] + "," + website[visits.get(k)[1]]);
            for (String t : seen) cnt.merge(t, 1, Integer::sum);
        }
        String best = ""; int bestN = -1;
        for (Map.Entry<String, Integer> e : cnt.entrySet()) {
            if (e.getValue() > bestN || (e.getValue() == bestN && e.getKey().compareTo(best) < 0)) {
                best = e.getKey(); bestN = e.getValue();
            }
        }
        return Arrays.asList(best.split(","));
    }
}
```

**Key points:**
- Per-user dedupe via set so a chatty user can't inflate counts.
- Sort visits by timestamp before enumerating ordered triples.
- Tie-break by lexicographic order of the joined triple.

**Tags:** #algorithm

---

### 46. Min Cost to Connect Ropes

**Difficulty:** Medium
**Topics:** heap, greedy
**Position:** SDE
**Years:** L4

**Question:** Given an array of rope lengths, the cost to connect two ropes equals their sum. Find the minimum total cost to connect all ropes into one.

**Approach:** Min-heap. Repeatedly pop two smallest, push their sum, accumulate cost. Equivalent to Huffman tree construction. O(n log n). Greedy proof: combining smallest first delays large costs from being multiplied repeatedly.

**Python:**
```python
import heapq

def min_cost_to_connect_ropes(ropes: list[int]) -> int:
    heapq.heapify(ropes)
    total = 0
    while len(ropes) > 1:
        a = heapq.heappop(ropes)
        b = heapq.heappop(ropes)
        total += a + b
        heapq.heappush(ropes, a + b)
    return total
```

**TypeScript:**
```typescript
function minCostToConnectRopes(ropes: number[]): number {
  ropes.sort((a, b) => a - b);
  let total = 0;
  while (ropes.length > 1) {
    const a = ropes.shift()!;
    const b = ropes.shift()!;
    const s = a + b;
    total += s;
    let i = 0;
    while (i < ropes.length && ropes[i] < s) i++;
    ropes.splice(i, 0, s);
  }
  return total;
}
```

**Java:**
```java
class Solution {
    public int minCostToConnectRopes(int[] ropes) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        for (int r : ropes) heap.offer(r);
        int total = 0;
        while (heap.size() > 1) {
            int s = heap.poll() + heap.poll();
            total += s;
            heap.offer(s);
        }
        return total;
    }
}
```

**Key points:**
- Greedy Huffman-style: combine the two smallest first.
- Each combined sum is added to all future operations, so delay big costs.
- O(n log n) with a proper heap; production TS should use a heap library.

**Tags:** #algorithm

---

### 47. Find the Winner of the Circular Game

**Difficulty:** Medium
**Topics:** simulation, recursion, math
**Position:** SDE
**Years:** L4

**Question:** `n` friends in a circle numbered 1..n. Starting from 1, count k friends and eliminate the kth. Continue from the next friend. Return the last remaining.

**Approach:** Josephus problem. Recursive formula `J(1) = 0; J(n) = (J(n-1) + k) % n`. Return `J(n) + 1` for 1-indexed. O(n) time, O(1) iterative. Simulation with a queue/deque is O(n*k) and easier to derive on the fly.

**Python:**
```python
def find_the_winner(n: int, k: int) -> int:
    winner = 0
    for i in range(2, n + 1):
        winner = (winner + k) % i
    return winner + 1
```

**TypeScript:**
```typescript
function findTheWinner(n: number, k: number): number {
  let winner = 0;
  for (let i = 2; i <= n; i++) winner = (winner + k) % i;
  return winner + 1;
}
```

**Java:**
```java
class Solution {
    public int findTheWinner(int n, int k) {
        int winner = 0;
        for (int i = 2; i <= n; i++) winner = (winner + k) % i;
        return winner + 1;
    }
}
```

**Key points:**
- Iterative Josephus recurrence in O(n) with O(1) space.
- Add 1 at the end to convert to 1-indexed.
- Queue simulation is O(n*k) but easier to derive under pressure.

**Tags:** #algorithm

---

### 48. Reorganize String

**Difficulty:** Medium
**Topics:** heap, greedy, strings
**Position:** SDE
**Years:** L4

**Question:** Given a string, rearrange so no two adjacent chars are equal. Return "" if impossible.

**Approach:** Count frequencies; if max > (n+1)/2, impossible. Max-heap by frequency. Pop top two each step, append both, decrement counts, repush nonzero. O(n log k) with k = unique chars. Alternative: place most-frequent char at even indices first, then fill.

**Python:**
```python
import heapq
from collections import Counter

def reorganize_string(s: str) -> str:
    cnt = Counter(s)
    if max(cnt.values()) > (len(s) + 1) // 2:
        return ""
    heap = [(-c, ch) for ch, c in cnt.items()]
    heapq.heapify(heap)
    out: list[str] = []
    while len(heap) >= 2:
        c1, ch1 = heapq.heappop(heap)
        c2, ch2 = heapq.heappop(heap)
        out.append(ch1); out.append(ch2)
        if c1 + 1 < 0: heapq.heappush(heap, (c1 + 1, ch1))
        if c2 + 1 < 0: heapq.heappush(heap, (c2 + 1, ch2))
    if heap:
        out.append(heap[0][1])
    return "".join(out)
```

**TypeScript:**
```typescript
function reorganizeString(s: string): string {
  const cnt = new Map<string, number>();
  for (const c of s) cnt.set(c, (cnt.get(c) ?? 0) + 1);
  if (Math.max(...cnt.values()) > Math.floor((s.length + 1) / 2)) return "";
  const heap: Array<[number, string]> = [...cnt].map(([k, v]) => [v, k]);
  const sort = () => heap.sort((a, b) => b[0] - a[0]);
  sort();
  const out: string[] = [];
  while (heap.length >= 2) {
    const [c1, ch1] = heap.shift()!;
    const [c2, ch2] = heap.shift()!;
    out.push(ch1, ch2);
    if (c1 - 1 > 0) heap.push([c1 - 1, ch1]);
    if (c2 - 1 > 0) heap.push([c2 - 1, ch2]);
    sort();
  }
  if (heap.length) out.push(heap[0][1]);
  return out.join("");
}
```

**Java:**
```java
class Solution {
    public String reorganizeString(String s) {
        int[] cnt = new int[26];
        for (char c : s.toCharArray()) cnt[c - 'a']++;
        int max = 0;
        for (int v : cnt) max = Math.max(max, v);
        if (max > (s.length() + 1) / 2) return "";
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> b[0] - a[0]);
        for (int i = 0; i < 26; i++) if (cnt[i] > 0) heap.offer(new int[]{cnt[i], i});
        StringBuilder sb = new StringBuilder();
        while (heap.size() >= 2) {
            int[] a = heap.poll(), b = heap.poll();
            sb.append((char) ('a' + a[1])).append((char) ('a' + b[1]));
            if (--a[0] > 0) heap.offer(a);
            if (--b[0] > 0) heap.offer(b);
        }
        if (!heap.isEmpty()) sb.append((char) ('a' + heap.poll()[1]));
        return sb.toString();
    }
}
```

**Key points:**
- Infeasible iff most frequent char exceeds `(n+1)/2`.
- Pop the two most frequent and alternate them — they cannot adjoin each other in the output.
- O(n log k) with k distinct characters.

**Tags:** #algorithm

---

### 49. Sliding Window Maximum

**Difficulty:** Hard
**Topics:** deque, sliding-window
**Position:** Senior SDE
**Years:** L5

**Question:** Given an array and window size k, return the max in each sliding window.

**Approach:** Monotonic deque holding indices, front always the max in current window. For each i: pop from back while `nums[back] <= nums[i]` (they can never be max again), push i; pop front if out of window. Output deque front once `i >= k-1`. O(n).

**Python:**
```python
from collections import deque

def max_sliding_window(nums: list[int], k: int) -> list[int]:
    dq: deque[int] = deque()
    out: list[int] = []
    for i, x in enumerate(nums):
        while dq and nums[dq[-1]] <= x:
            dq.pop()
        dq.append(i)
        if dq[0] <= i - k:
            dq.popleft()
        if i >= k - 1:
            out.append(nums[dq[0]])
    return out
```

**TypeScript:**
```typescript
function maxSlidingWindow(nums: number[], k: number): number[] {
  const dq: number[] = [];
  const out: number[] = [];
  for (let i = 0; i < nums.length; i++) {
    while (dq.length && nums[dq[dq.length - 1]] <= nums[i]) dq.pop();
    dq.push(i);
    if (dq[0] <= i - k) dq.shift();
    if (i >= k - 1) out.push(nums[dq[0]]);
  }
  return out;
}
```

**Java:**
```java
class Solution {
    public int[] maxSlidingWindow(int[] nums, int k) {
        Deque<Integer> dq = new ArrayDeque<>();
        int[] out = new int[nums.length - k + 1];
        for (int i = 0; i < nums.length; i++) {
            while (!dq.isEmpty() && nums[dq.peekLast()] <= nums[i]) dq.pollLast();
            dq.offerLast(i);
            if (dq.peekFirst() <= i - k) dq.pollFirst();
            if (i >= k - 1) out[i - k + 1] = nums[dq.peekFirst()];
        }
        return out;
    }
}
```

**Key points:**
- Monotonic decreasing deque of indices keeps the front as the current max.
- Each index is pushed and popped at most once — amortized O(n).
- Drop the front when it falls outside the window.

**Tags:** #algorithm

---

### 50. Group Anagrams

**Difficulty:** Medium
**Topics:** hashmap, strings, sorting
**Position:** SDE
**Years:** L4

**Question:** Given an array of strings, group anagrams together.

**Approach:** Hashmap from canonical key to list. Key options: (a) sorted string — O(n * k log k); (b) char count tuple `[a-z]` length-26 array — O(n * k). Latter is faster on long words. Trivial Amazon screen but common warmup.

**Python:**
```python
def group_anagrams(strs: list[str]) -> list[list[str]]:
    groups: dict[str, list[str]] = {}
    for s in strs:
        key = "".join(sorted(s))
        groups.setdefault(key, []).append(s)
    return list(groups.values())
```

**TypeScript:**
```typescript
function groupAnagrams(strs: string[]): string[][] {
  const groups = new Map<string, string[]>();
  for (const s of strs) {
    const key = s.split("").sort().join("");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }
  return Array.from(groups.values());
}
```

**Java:**
```java
class Solution {
    public List<List<String>> groupAnagrams(String[] strs) {
        Map<String, List<String>> groups = new HashMap<>();
        for (String s : strs) {
            char[] arr = s.toCharArray();
            Arrays.sort(arr);
            groups.computeIfAbsent(new String(arr), k -> new ArrayList<>()).add(s);
        }
        return new ArrayList<>(groups.values());
    }
}
```

**Key points:**
- Sorted-string key is the simplest canonical form.
- A 26-length char-count vector also works and is faster on long strings.
- O(n * k log k) where k is average word length.

**Tags:** #algorithm

---

### 51. Maximum Subarray (Kadane's)

**Difficulty:** Medium
**Topics:** dp, arrays
**Position:** SDE
**Years:** L4

**Question:** Find the contiguous subarray with the largest sum and return its sum.

**Approach:** Kadane's: `cur = max(num, cur + num); best = max(best, cur)`. O(n). Variant: return indices — track start when `cur` resets. Divide-and-conquer O(n log n) version exists but Kadane is canonical.

**Python:**
```python
def max_subarray(nums: list[int]) -> int:
    cur = best = nums[0]
    for x in nums[1:]:
        cur = max(x, cur + x)
        best = max(best, cur)
    return best
```

**TypeScript:**
```typescript
function maxSubArray(nums: number[]): number {
  let cur = nums[0], best = nums[0];
  for (let i = 1; i < nums.length; i++) {
    cur = Math.max(nums[i], cur + nums[i]);
    best = Math.max(best, cur);
  }
  return best;
}
```

**Java:**
```java
class Solution {
    public int maxSubArray(int[] nums) {
        int cur = nums[0], best = nums[0];
        for (int i = 1; i < nums.length; i++) {
            cur = Math.max(nums[i], cur + nums[i]);
            best = Math.max(best, cur);
        }
        return best;
    }
}
```

**Key points:**
- `cur` is the best sum ending at the current index.
- Reset to `x` whenever extending makes things worse.
- O(n) time, O(1) space; works on all-negative arrays.

**Tags:** #algorithm

---

### 52. Lowest Common Ancestor of a Binary Tree

**Difficulty:** Medium
**Topics:** tree, dfs, recursion
**Position:** SDE
**Years:** L4

**Question:** Given a binary tree and two nodes `p`, `q`, find their lowest common ancestor.

**Approach:** Recursive: if root is null or p or q, return root. Recurse left and right. If both non-null, root is LCA; else return whichever is non-null. O(n). Works for BST too but BST has O(log n) by comparing values.

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
class Solution {
    public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
        if (root == null || root == p || root == q) return root;
        TreeNode l = lowestCommonAncestor(root.left, p, q);
        TreeNode r = lowestCommonAncestor(root.right, p, q);
        if (l != null && r != null) return root;
        return l != null ? l : r;
    }
}
```

**Key points:**
- A node equal to p or q is its own LCA.
- If both sides return non-null, current node is the split point.
- O(n) time, O(h) recursion depth.

**Tags:** #algorithm

---

### 53. Maximum Profit in Job Scheduling

**Difficulty:** Hard
**Topics:** dp, binary-search, sorting
**Position:** Senior SDE
**Years:** L5

**Question:** Given `startTime[i]`, `endTime[i]`, `profit[i]` for n jobs, return the max profit achievable from a non-overlapping subset.

**Approach:** Sort by endTime. `dp[i]` = max profit using first i jobs. Transition: `dp[i] = max(dp[i-1], profit[i] + dp[j])` where j is the largest index with `endTime[j] <= startTime[i]` (binary search). O(n log n).

**Python:**
```python
from bisect import bisect_right

def job_scheduling(start_time: list[int], end_time: list[int], profit: list[int]) -> int:
    jobs = sorted(zip(end_time, start_time, profit))
    ends = [j[0] for j in jobs]
    n = len(jobs)
    dp = [0] * (n + 1)
    for i, (e, s, p) in enumerate(jobs, 1):
        j = bisect_right(ends, s, hi=i - 1)
        dp[i] = max(dp[i - 1], dp[j] + p)
    return dp[n]
```

**TypeScript:**
```typescript
function jobScheduling(startTime: number[], endTime: number[], profit: number[]): number {
  const jobs = startTime.map((s, i) => [endTime[i], s, profit[i]]).sort((a, b) => a[0] - b[0]);
  const n = jobs.length;
  const dp = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    const [e, s, p] = jobs[i - 1];
    let lo = 0, hi = i - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (jobs[mid][0] <= s) lo = mid + 1; else hi = mid; }
    dp[i] = Math.max(dp[i - 1], dp[lo] + p);
  }
  return dp[n];
}
```

**Java:**
```java
class Solution {
    public int jobScheduling(int[] startTime, int[] endTime, int[] profit) {
        int n = startTime.length;
        int[][] jobs = new int[n][3];
        for (int i = 0; i < n; i++) jobs[i] = new int[]{endTime[i], startTime[i], profit[i]};
        Arrays.sort(jobs, (a, b) -> a[0] - b[0]);
        int[] dp = new int[n + 1];
        for (int i = 1; i <= n; i++) {
            int s = jobs[i - 1][1];
            int lo = 0, hi = i - 1;
            while (lo < hi) {
                int mid = (lo + hi) >>> 1;
                if (jobs[mid][0] <= s) lo = mid + 1; else hi = mid;
            }
            dp[i] = Math.max(dp[i - 1], dp[lo] + jobs[i - 1][2]);
        }
        return dp[n];
    }
}
```

**Key points:**
- Sort by end time so prior jobs always end no later than current.
- Binary search finds the latest non-conflicting job.
- O(n log n) time, O(n) space.

**Tags:** #algorithm

---

### 54. Min Stack

**Difficulty:** Medium
**Topics:** stack, design
**Position:** SDE
**Years:** L4

**Question:** Design a stack supporting `push`, `pop`, `top`, and `getMin` all in O(1).

**Approach:** Auxiliary stack of running minimums, pushed in lockstep with main stack (push `min(new, prev_min)`). Alternative: store `(val, current_min)` pairs in single stack. Tricky variant: only push to min stack on `val <= current_min`; pop only when equal.

**Python:**
```python
class MinStack:
    def __init__(self) -> None:
        self.stack: list[int] = []
        self.mins: list[int] = []

    def push(self, val: int) -> None:
        self.stack.append(val)
        self.mins.append(val if not self.mins else min(val, self.mins[-1]))

    def pop(self) -> None:
        self.stack.pop()
        self.mins.pop()

    def top(self) -> int:
        return self.stack[-1]

    def getMin(self) -> int:
        return self.mins[-1]
```

**TypeScript:**
```typescript
class MinStack {
  private stack: number[] = [];
  private mins: number[] = [];
  push(val: number): void {
    this.stack.push(val);
    this.mins.push(this.mins.length ? Math.min(val, this.mins[this.mins.length - 1]) : val);
  }
  pop(): void { this.stack.pop(); this.mins.pop(); }
  top(): number { return this.stack[this.stack.length - 1]; }
  getMin(): number { return this.mins[this.mins.length - 1]; }
}
```

**Java:**
```java
class MinStack {
    private final Deque<Integer> stack = new ArrayDeque<>();
    private final Deque<Integer> mins = new ArrayDeque<>();
    public void push(int val) {
        stack.push(val);
        mins.push(mins.isEmpty() ? val : Math.min(val, mins.peek()));
    }
    public void pop() { stack.pop(); mins.pop(); }
    public int top() { return stack.peek(); }
    public int getMin() { return mins.peek(); }
}
```

**Key points:**
- Parallel min-stack stores the running minimum at every depth.
- All operations are O(1).
- Variant stores only strict-decrease entries to save space.

**Tags:** #algorithm

---

### 55. Validate Binary Search Tree

**Difficulty:** Medium
**Topics:** tree, dfs, recursion
**Position:** SDE
**Years:** L4

**Question:** Given a binary tree, determine if it's a valid BST.

**Approach:** Recursive with `(min, max)` bounds passed down. Each node must satisfy `min < node.val < max`. Tightens bounds on recursion. O(n). Alternative: inorder traversal should yield strictly increasing sequence. Watch INT bounds — use long or Optional.

**Python:**
```python
def is_valid_bst(root: TreeNode | None) -> bool:
    def go(node: TreeNode | None, lo: float, hi: float) -> bool:
        if node is None:
            return True
        if not (lo < node.val < hi):
            return False
        return go(node.left, lo, node.val) and go(node.right, node.val, hi)
    return go(root, float("-inf"), float("inf"))
```

**TypeScript:**
```typescript
function isValidBST(root: TreeNode | null): boolean {
  const go = (n: TreeNode | null, lo: number, hi: number): boolean => {
    if (!n) return true;
    if (!(lo < n.val && n.val < hi)) return false;
    return go(n.left, lo, n.val) && go(n.right, n.val, hi);
  };
  return go(root, -Infinity, Infinity);
}
```

**Java:**
```java
class Solution {
    public boolean isValidBST(TreeNode root) {
        return go(root, Long.MIN_VALUE, Long.MAX_VALUE);
    }
    private boolean go(TreeNode n, long lo, long hi) {
        if (n == null) return true;
        if (n.val <= lo || n.val >= hi) return false;
        return go(n.left, lo, n.val) && go(n.right, n.val, hi);
    }
}
```

**Key points:**
- Strict inequalities enforce uniqueness.
- Pass bounds down, not up — values get tighter, never looser.
- Inorder traversal must produce strictly increasing values.

**Tags:** #algorithm

---

### 56. Search in Rotated Sorted Array

**Difficulty:** Medium
**Topics:** binary-search, arrays
**Position:** SDE
**Years:** L4

**Question:** Given a rotated sorted array (originally ascending, then rotated at some pivot) and a target, return its index or -1. O(log n) required.

**Approach:** Modified binary search. At each step determine which half is sorted (compare `nums[lo]` and `nums[mid]`). If target lies in the sorted half's range, search there; else search the other half. O(log n). With duplicates, worst-case degrades to O(n).

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
- One half is always sorted — decide via `nums[lo] <= nums[mid]`.
- Inclusive bound check matches the sorted side's endpoints.
- O(log n) for unique values; degrades to O(n) with duplicates.

**Tags:** #algorithm

---

### 57. Design Hit Counter

**Difficulty:** Medium
**Topics:** design, queue, hashmap
**Position:** SDE
**Years:** L4

**Question:** Design a hit counter that records hits and returns the number of hits in the past 5 minutes. Hits are recorded in chronological order.

**Approach:** Queue of timestamps; on `getHits(t)`, dequeue all with `ts <= t - 300`, return queue size. Memory grows with hit rate. For scale, use two arrays of size 300: `times[i]` and `hits[i]`, indexed by `t % 300`; reset bucket on stale timestamp. O(1) amortized.

**Python:**
```python
class HitCounter:
    def __init__(self) -> None:
        self.times = [0] * 300
        self.hits = [0] * 300

    def hit(self, timestamp: int) -> None:
        i = timestamp % 300
        if self.times[i] != timestamp:
            self.times[i] = timestamp
            self.hits[i] = 1
        else:
            self.hits[i] += 1

    def getHits(self, timestamp: int) -> int:
        return sum(self.hits[i] for i in range(300) if timestamp - self.times[i] < 300)
```

**TypeScript:**
```typescript
class HitCounter {
  private times = new Array(300).fill(0);
  private hits = new Array(300).fill(0);
  hit(timestamp: number): void {
    const i = timestamp % 300;
    if (this.times[i] !== timestamp) { this.times[i] = timestamp; this.hits[i] = 1; }
    else this.hits[i]++;
  }
  getHits(timestamp: number): number {
    let sum = 0;
    for (let i = 0; i < 300; i++) if (timestamp - this.times[i] < 300) sum += this.hits[i];
    return sum;
  }
}
```

**Java:**
```java
class HitCounter {
    private final int[] times = new int[300];
    private final int[] hits = new int[300];
    public void hit(int timestamp) {
        int i = timestamp % 300;
        if (times[i] != timestamp) { times[i] = timestamp; hits[i] = 1; }
        else hits[i]++;
    }
    public int getHits(int timestamp) {
        int sum = 0;
        for (int i = 0; i < 300; i++) if (timestamp - times[i] < 300) sum += hits[i];
        return sum;
    }
}
```

**Key points:**
- Bucket per second within the 300s window; stale buckets are auto-reset on next hit.
- O(1) `hit`, O(300) `getHits` regardless of hit rate.
- Queue variant is simpler but unbounded under bursty traffic.

**Tags:** #algorithm

---

### 58. Sliding Puzzle

**Difficulty:** Hard
**Topics:** bfs, matrix, state-search
**Position:** Senior SDE
**Years:** L5-L6

**Question:** A 2x3 board has tiles 1-5 and one empty (0). Each move swaps 0 with an adjacent tile. Given start board, return min moves to reach `[[1,2,3],[4,5,0]]` or -1.

**Approach:** BFS over board states. Encode each state as a string of 6 chars. Precompute neighbor positions for each index of 0. Visited set on strings. O(6! * branching). A* with Manhattan-distance heuristic for follow-up larger boards.

**Python:**
```python
from collections import deque

def sliding_puzzle(board: list[list[int]]) -> int:
    target = "123450"
    start = "".join(str(c) for row in board for c in row)
    if start == target:
        return 0
    neighbors = {0:[1,3], 1:[0,2,4], 2:[1,5], 3:[0,4], 4:[1,3,5], 5:[2,4]}
    q: deque[tuple[str, int, int]] = deque([(start, start.index("0"), 0)])
    seen = {start}
    while q:
        state, z, d = q.popleft()
        for nb in neighbors[z]:
            arr = list(state)
            arr[z], arr[nb] = arr[nb], arr[z]
            ns = "".join(arr)
            if ns == target:
                return d + 1
            if ns not in seen:
                seen.add(ns)
                q.append((ns, nb, d + 1))
    return -1
```

**TypeScript:**
```typescript
function slidingPuzzle(board: number[][]): number {
  const target = "123450";
  const start = board.flat().join("");
  if (start === target) return 0;
  const neighbors: Record<number, number[]> = { 0:[1,3], 1:[0,2,4], 2:[1,5], 3:[0,4], 4:[1,3,5], 5:[2,4] };
  const q: Array<[string, number, number]> = [[start, start.indexOf("0"), 0]];
  const seen = new Set<string>([start]);
  while (q.length) {
    const [state, z, d] = q.shift()!;
    for (const nb of neighbors[z]) {
      const arr = state.split("");
      [arr[z], arr[nb]] = [arr[nb], arr[z]];
      const ns = arr.join("");
      if (ns === target) return d + 1;
      if (!seen.has(ns)) { seen.add(ns); q.push([ns, nb, d + 1]); }
    }
  }
  return -1;
}
```

**Java:**
```java
class Solution {
    public int slidingPuzzle(int[][] board) {
        String target = "123450";
        StringBuilder sb = new StringBuilder();
        for (int[] row : board) for (int v : row) sb.append(v);
        String start = sb.toString();
        if (start.equals(target)) return 0;
        int[][] neighbors = {{1,3},{0,2,4},{1,5},{0,4},{1,3,5},{2,4}};
        Deque<Object[]> q = new ArrayDeque<>();
        q.offer(new Object[]{start, start.indexOf('0'), 0});
        Set<String> seen = new HashSet<>();
        seen.add(start);
        while (!q.isEmpty()) {
            Object[] cur = q.poll();
            String state = (String) cur[0];
            int z = (int) cur[1], d = (int) cur[2];
            for (int nb : neighbors[z]) {
                char[] arr = state.toCharArray();
                char t = arr[z]; arr[z] = arr[nb]; arr[nb] = t;
                String ns = new String(arr);
                if (ns.equals(target)) return d + 1;
                if (seen.add(ns)) q.offer(new Object[]{ns, nb, d + 1});
            }
        }
        return -1;
    }
}
```

**Key points:**
- Encode the 2x3 board as a 6-char string for cheap hashing.
- Precomputed neighbor table avoids row/col arithmetic per move.
- O(6!) reachable states; BFS gives the shortest move count.

**Tags:** #algorithm

---

### 59. Partition Labels

**Difficulty:** Medium
**Topics:** greedy, strings, two-pointer
**Position:** SDE
**Years:** L4

**Question:** Partition a string into as many parts as possible so each letter appears in at most one part. Return the list of part sizes.

**Approach:** Precompute `last[c]` = last index of char c. Walk with two pointers `start`, `end`; extend `end = max(end, last[s[i]])`; when `i == end`, cut a partition and reset `start = i+1`. O(n).

**Python:**
```python
def partition_labels(s: str) -> list[int]:
    last = {c: i for i, c in enumerate(s)}
    out: list[int] = []
    start = end = 0
    for i, c in enumerate(s):
        end = max(end, last[c])
        if i == end:
            out.append(end - start + 1)
            start = i + 1
    return out
```

**TypeScript:**
```typescript
function partitionLabels(s: string): number[] {
  const last = new Map<string, number>();
  for (let i = 0; i < s.length; i++) last.set(s[i], i);
  const out: number[] = [];
  let start = 0, end = 0;
  for (let i = 0; i < s.length; i++) {
    end = Math.max(end, last.get(s[i])!);
    if (i === end) { out.push(end - start + 1); start = i + 1; }
  }
  return out;
}
```

**Java:**
```java
class Solution {
    public List<Integer> partitionLabels(String s) {
        int[] last = new int[26];
        for (int i = 0; i < s.length(); i++) last[s.charAt(i) - 'a'] = i;
        List<Integer> out = new ArrayList<>();
        int start = 0, end = 0;
        for (int i = 0; i < s.length(); i++) {
            end = Math.max(end, last[s.charAt(i) - 'a']);
            if (i == end) { out.add(end - start + 1); start = i + 1; }
        }
        return out;
    }
}
```

**Key points:**
- A partition closes when `i` reaches the farthest last-index seen so far.
- Two passes total; O(n) time, O(1) extra (26 entries for lowercase).
- Greedy is provably optimal: extending end is mandatory.

**Tags:** #algorithm

---

### 60. Design Tic-Tac-Toe

**Difficulty:** Medium
**Topics:** design, ood, matrix
**Position:** SDE
**Years:** L4

**Question:** Design a Tic-Tac-Toe game on an `n x n` board supporting `move(row, col, player)` returning the winning player (0 if none).

**Approach:** Track per-player counters: `rows[player][i]`, `cols[player][j]`, `diag[player]`, `anti_diag[player]`. On move, increment relevant counters; if any reaches n, player wins. O(1) per move, O(n) space. Beats the naive O(n) board scan.

**Python:**
```python
class TicTacToe:
    def __init__(self, n: int) -> None:
        self.n = n
        self.rows = [[0, 0] for _ in range(n)]
        self.cols = [[0, 0] for _ in range(n)]
        self.diag = [0, 0]
        self.anti = [0, 0]

    def move(self, row: int, col: int, player: int) -> int:
        p = player - 1
        self.rows[row][p] += 1
        self.cols[col][p] += 1
        if row == col:
            self.diag[p] += 1
        if row + col == self.n - 1:
            self.anti[p] += 1
        if (self.rows[row][p] == self.n or self.cols[col][p] == self.n or
                self.diag[p] == self.n or self.anti[p] == self.n):
            return player
        return 0
```

**TypeScript:**
```typescript
class TicTacToe {
  private rows: number[][]; private cols: number[][];
  private diag = [0, 0]; private anti = [0, 0];
  constructor(private n: number) {
    this.rows = Array.from({ length: n }, () => [0, 0]);
    this.cols = Array.from({ length: n }, () => [0, 0]);
  }
  move(row: number, col: number, player: number): number {
    const p = player - 1;
    this.rows[row][p]++; this.cols[col][p]++;
    if (row === col) this.diag[p]++;
    if (row + col === this.n - 1) this.anti[p]++;
    if (this.rows[row][p] === this.n || this.cols[col][p] === this.n ||
        this.diag[p] === this.n || this.anti[p] === this.n) return player;
    return 0;
  }
}
```

**Java:**
```java
class TicTacToe {
    private final int n;
    private final int[][] rows, cols;
    private final int[] diag = new int[2], anti = new int[2];
    public TicTacToe(int n) {
        this.n = n;
        rows = new int[n][2];
        cols = new int[n][2];
    }
    public int move(int row, int col, int player) {
        int p = player - 1;
        rows[row][p]++; cols[col][p]++;
        if (row == col) diag[p]++;
        if (row + col == n - 1) anti[p]++;
        if (rows[row][p] == n || cols[col][p] == n || diag[p] == n || anti[p] == n) return player;
        return 0;
    }
}
```

**Key points:**
- Per-player counters give O(1) move and O(1) win check.
- Diagonal: `row == col`; anti-diagonal: `row + col == n - 1`.
- O(n) space, vastly better than scanning the board on each move.

**Tags:** #algorithm

---

### 61. Rotting Oranges

**Difficulty:** Medium
**Topics:** bfs, matrix
**Position:** SDE
**Years:** L4

**Question:** Grid of 0 (empty), 1 (fresh orange), 2 (rotten). Each minute, rotten infects 4-adjacent fresh. Return min minutes until no fresh remain, or -1.

**Approach:** Multi-source BFS. Enqueue all initial rotten oranges. BFS by levels; each level = 1 minute. Track fresh count; decrement on infection. If fresh > 0 at end, return -1. O(m*n).

**Python:**
```python
from collections import deque

def oranges_rotting(grid: list[list[int]]) -> int:
    m, n = len(grid), len(grid[0])
    q: deque[tuple[int, int]] = deque()
    fresh = 0
    for r in range(m):
        for c in range(n):
            if grid[r][c] == 2:
                q.append((r, c))
            elif grid[r][c] == 1:
                fresh += 1
    minutes = 0
    while q and fresh:
        for _ in range(len(q)):
            r, c = q.popleft()
            for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < m and 0 <= nc < n and grid[nr][nc] == 1:
                    grid[nr][nc] = 2
                    fresh -= 1
                    q.append((nr, nc))
        minutes += 1
    return -1 if fresh else minutes
```

**TypeScript:**
```typescript
function orangesRotting(grid: number[][]): number {
  const m = grid.length, n = grid[0].length;
  let q: Array<[number, number]> = [];
  let fresh = 0;
  for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) {
    if (grid[r][c] === 2) q.push([r, c]);
    else if (grid[r][c] === 1) fresh++;
  }
  let minutes = 0;
  while (q.length && fresh) {
    const next: Array<[number, number]> = [];
    for (const [r, c] of q) {
      for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc] === 1) {
          grid[nr][nc] = 2; fresh--;
          next.push([nr, nc]);
        }
      }
    }
    q = next;
    minutes++;
  }
  return fresh ? -1 : minutes;
}
```

**Java:**
```java
class Solution {
    public int orangesRotting(int[][] grid) {
        int m = grid.length, n = grid[0].length, fresh = 0;
        Deque<int[]> q = new ArrayDeque<>();
        for (int r = 0; r < m; r++) for (int c = 0; c < n; c++) {
            if (grid[r][c] == 2) q.offer(new int[]{r, c});
            else if (grid[r][c] == 1) fresh++;
        }
        int minutes = 0;
        int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
        while (!q.isEmpty() && fresh > 0) {
            int sz = q.size();
            for (int i = 0; i < sz; i++) {
                int[] cur = q.poll();
                for (int[] d : dirs) {
                    int nr = cur[0] + d[0], nc = cur[1] + d[1];
                    if (nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc] == 1) {
                        grid[nr][nc] = 2; fresh--;
                        q.offer(new int[]{nr, nc});
                    }
                }
            }
            minutes++;
        }
        return fresh > 0 ? -1 : minutes;
    }
}
```

**Key points:**
- Multi-source BFS treats every initial rotten orange as level 0.
- Each BFS level corresponds to one minute.
- Return -1 if any fresh oranges remain unreachable.

**Tags:** #algorithm

---

### 62. Shortest Path in a Grid with Obstacles Elimination

**Difficulty:** Hard
**Topics:** bfs, matrix, state-search
**Position:** Senior SDE
**Years:** L5-L6

**Question:** Given a grid (0 empty, 1 obstacle) and integer k, return min steps from `(0,0)` to `(m-1,n-1)`, allowed to eliminate at most k obstacles. -1 if unreachable.

**Approach:** BFS over states `(r, c, remaining_k)`. Visited set keyed on tuple. Pruning: if `k >= m+n-2`, return Manhattan distance directly. O(m * n * k). Don't drop a state because the cell was visited with smaller remaining_k — different k values are different states.

**Python:**
```python
from collections import deque

def shortest_path(grid: list[list[int]], k: int) -> int:
    m, n = len(grid), len(grid[0])
    if k >= m + n - 2:
        return m + n - 2
    q: deque[tuple[int, int, int, int]] = deque([(0, 0, k, 0)])
    seen = {(0, 0, k)}
    while q:
        r, c, rem, d = q.popleft()
        if (r, c) == (m - 1, n - 1):
            return d
        for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < m and 0 <= nc < n:
                nk = rem - grid[nr][nc]
                if nk >= 0 and (nr, nc, nk) not in seen:
                    seen.add((nr, nc, nk))
                    q.append((nr, nc, nk, d + 1))
    return -1
```

**TypeScript:**
```typescript
function shortestPath(grid: number[][], k: number): number {
  const m = grid.length, n = grid[0].length;
  if (k >= m + n - 2) return m + n - 2;
  const q: Array<[number, number, number, number]> = [[0, 0, k, 0]];
  const seen = new Set<string>([`0,0,${k}`]);
  while (q.length) {
    const [r, c, rem, d] = q.shift()!;
    if (r === m - 1 && c === n - 1) return d;
    for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < m && nc >= 0 && nc < n) {
        const nk = rem - grid[nr][nc];
        const key = `${nr},${nc},${nk}`;
        if (nk >= 0 && !seen.has(key)) { seen.add(key); q.push([nr, nc, nk, d + 1]); }
      }
    }
  }
  return -1;
}
```

**Java:**
```java
class Solution {
    public int shortestPath(int[][] grid, int k) {
        int m = grid.length, n = grid[0].length;
        if (k >= m + n - 2) return m + n - 2;
        Deque<int[]> q = new ArrayDeque<>();
        q.offer(new int[]{0, 0, k, 0});
        Set<Long> seen = new HashSet<>();
        seen.add(encode(0, 0, k, n));
        int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
        while (!q.isEmpty()) {
            int[] cur = q.poll();
            if (cur[0] == m - 1 && cur[1] == n - 1) return cur[3];
            for (int[] d : dirs) {
                int nr = cur[0] + d[0], nc = cur[1] + d[1];
                if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
                int nk = cur[2] - grid[nr][nc];
                long key = encode(nr, nc, nk, n);
                if (nk >= 0 && seen.add(key)) q.offer(new int[]{nr, nc, nk, cur[3] + 1});
            }
        }
        return -1;
    }
    private long encode(int r, int c, int k, int n) {
        return ((long) r * n + c) * 10000L + k;
    }
}
```

**Key points:**
- State is `(row, col, remaining_eliminations)` — different `k` are different nodes.
- Shortcut: if `k >= m+n-2`, the Manhattan distance is optimal.
- O(m * n * k) time and space.

**Tags:** #algorithm

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
