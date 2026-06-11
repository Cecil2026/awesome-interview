# Alibaba

```yaml
company: Alibaba Group (Taobao, Tmall, Alipay/Ant Group, AliCloud, Cainiao, DingTalk)
typical_rounds: 1 HR screen + 3-5 technical (often tiered by interviewer level: P7 → P8 → P9) + 1 cross-team + HR final
focus_areas: Java middleware (Spring, Dubbo, MyBatis), distributed systems, JVM internals, e-commerce/payment system design
languages_allowed: Java strongly preferred; Go acceptable; some teams use C++
duration: 45-60 min per round
notable_quirks:
  - JVM tuning, GC algorithms, and Java concurrency (synchronized, AQS, CAS) are deep-dive topics
  - Behavioral mapped to 阿里六脉神剑 (Six Values): 客户第一, 团队合作, 拥抱变化, 诚信, 激情, 敬业
  - Architecture rounds often reference Alibaba-built systems (Dubbo, RocketMQ, Sentinel, Nacos, Seata)
  - Higher-level interviewers (P9+) ask philosophical "how would you design Taobao from scratch" questions
  - Some rounds in Mandarin even for English-speaking candidates if the team is mainland-based
sources: 1point3acres, NowCoder (牛客网), LeetCode-cn, Glassdoor
```

## Overview

Alibaba interviews lean heavily on Java backend depth — JVM internals, concurrency primitives, Spring framework internals, and the open-source middleware Alibaba itself contributes (Dubbo for RPC, RocketMQ for messaging, Nacos for config/discovery, Sentinel for flow control, Seata for distributed transactions). System design centers on e-commerce and payment scenarios: flash sales (秒杀), distributed transactions across Taobao + Alipay, and inventory consistency. Behavioral is mapped to the Six Values, particularly Customer First and Embracing Change.

## Questions

### 1. Reverse Nodes in K-Group

**Difficulty:** Hard
**Topics:** linked-list, recursion
**Position:** SWE
**Years:** P5-P6

**Question:** Given a linked list, reverse every k consecutive nodes. If remaining nodes are fewer than k, leave as-is.

**Approach:** Count k nodes ahead; if fewer, return head. Reverse the k nodes iteratively (3-pointer), recurse on the rest, attach. O(n). Edge: k=1 (no-op), k=n (full reverse). Watch off-by-one in the count.

**Python:**
```python
class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val, self.next = val, next

def reverse_k_group(head: ListNode | None, k: int) -> ListNode | None:
    cur = head
    for _ in range(k):
        if cur is None:
            return head
        cur = cur.next
    prev, cur = None, head
    for _ in range(k):
        nxt = cur.next
        cur.next = prev
        prev, cur = cur, nxt
    head.next = reverse_k_group(cur, k)
    return prev
```

**TypeScript:**
```typescript
class ListNode {
  val: number; next: ListNode | null;
  constructor(v = 0, n: ListNode | null = null) { this.val = v; this.next = n; }
}

function reverseKGroup(head: ListNode | null, k: number): ListNode | null {
  let cur: ListNode | null = head;
  for (let i = 0; i < k; i++) { if (!cur) return head; cur = cur.next; }
  let prev: ListNode | null = null;
  cur = head;
  for (let i = 0; i < k; i++) {
    const nxt: ListNode | null = cur!.next;
    cur!.next = prev; prev = cur; cur = nxt;
  }
  head!.next = reverseKGroup(cur, k);
  return prev;
}
```

**Java:**
```java
class ListNode { int val; ListNode next; ListNode(int v) { val = v; } }

ListNode reverseKGroup(ListNode head, int k) {
    ListNode cur = head;
    for (int i = 0; i < k; i++) {
        if (cur == null) return head;
        cur = cur.next;
    }
    ListNode prev = null;
    cur = head;
    for (int i = 0; i < k; i++) {
        ListNode nxt = cur.next;
        cur.next = prev;
        prev = cur;
        cur = nxt;
    }
    head.next = reverseKGroup(cur, k);
    return prev;
}
```

**Key points:**
- Pre-check k nodes ahead before reversing to handle the tail correctly.
- Recursion stack depth is O(n/k); convert to iterative if k is small and n large.
- The old head becomes the new tail of the reversed block.

**Follow-ups:**
- Iterative version with a dummy head — O(1) extra space.
- Reverse the *last* incomplete group instead of leaving it as-is.
- Rotate the list by k positions (different but related pointer choreography).
- Reverse alternate groups of k — even groups reversed, odd left alone.

**Common Pitfalls:**
- Reversing the tail group of fewer than k nodes — the problem says leave it.
- Forgetting to wire `head.next` to the recursive result — list ends prematurely.

**Tags:** #algorithm

---

### 2. Course Schedule II

**Difficulty:** Medium
**Topics:** graph, topological-sort, bfs
**Position:** SWE
**Years:** P5-P6

**Question:** Given `numCourses` and prerequisite pairs, return an order of courses you should take. Empty if impossible.

**Approach:** Kahn's algorithm (BFS topo sort): build adjacency + in-degrees, queue nodes with in-degree 0, pop and decrement neighbors. If output length < numCourses, cycle exists → return empty. O(V + E).

**Python:**
```python
from collections import deque

def find_order(num_courses: int, prerequisites: list[list[int]]) -> list[int]:
    adj: list[list[int]] = [[] for _ in range(num_courses)]
    indeg = [0] * num_courses
    for a, b in prerequisites:
        adj[b].append(a)
        indeg[a] += 1
    q = deque(i for i, d in enumerate(indeg) if d == 0)
    out: list[int] = []
    while q:
        u = q.popleft()
        out.append(u)
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    return out if len(out) == num_courses else []
```

**TypeScript:**
```typescript
function findOrder(numCourses: number, prerequisites: number[][]): number[] {
  const adj: number[][] = Array.from({ length: numCourses }, () => []);
  const indeg = new Array(numCourses).fill(0);
  for (const [a, b] of prerequisites) { adj[b].push(a); indeg[a]++; }
  const q: number[] = [];
  for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) q.push(i);
  const out: number[] = [];
  while (q.length) {
    const u = q.shift()!;
    out.push(u);
    for (const v of adj[u]) if (--indeg[v] === 0) q.push(v);
  }
  return out.length === numCourses ? out : [];
}
```

**Java:**
```java
int[] findOrder(int numCourses, int[][] prerequisites) {
    List<List<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < numCourses; i++) adj.add(new ArrayList<>());
    int[] indeg = new int[numCourses];
    for (var p : prerequisites) { adj.get(p[1]).add(p[0]); indeg[p[0]]++; }
    Deque<Integer> q = new ArrayDeque<>();
    for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) q.offer(i);
    int[] out = new int[numCourses];
    int k = 0;
    while (!q.isEmpty()) {
        int u = q.poll();
        out[k++] = u;
        for (int v : adj.get(u)) if (--indeg[v] == 0) q.offer(v);
    }
    return k == numCourses ? out : new int[0];
}
```

**Key points:**
- A cycle is detected when the output length is less than `numCourses`.
- DFS with three colors (white/gray/black) is an alternative.
- Multiple valid orders exist; any one is accepted.

**Follow-ups:**
- Course Schedule I — only return whether it's possible.
- Return *all* valid topological orders.
- Alien Dictionary — derive ordering constraints from sorted strings, then topo-sort.
- Detect the cycle and return one of its nodes for the error message.

**Common Pitfalls:**
- Using DFS without three-color marking — fails to detect self-revisits within the recursion.
- Returning a partial order on cycle — the problem wants an empty array.

**Tags:** #algorithm

---

### 3. Longest Substring with At Most K Distinct Characters

**Difficulty:** Medium
**Topics:** sliding-window, hashmap, strings
**Position:** SWE
**Years:** P5-P6

**Question:** Given a string `s` and integer `k`, return the length of the longest substring containing at most `k` distinct characters.

**Approach:** Sliding window with `char -> count` map. Expand right; while map size > k, shrink left, decrementing/removing chars. Track max window length. O(n).

**Python:**
```python
def longest_substring_k_distinct(s: str, k: int) -> int:
    if k == 0:
        return 0
    cnt: dict[str, int] = {}
    l = best = 0
    for r, c in enumerate(s):
        cnt[c] = cnt.get(c, 0) + 1
        while len(cnt) > k:
            cnt[s[l]] -= 1
            if cnt[s[l]] == 0:
                del cnt[s[l]]
            l += 1
        best = max(best, r - l + 1)
    return best
```

**TypeScript:**
```typescript
function longestSubstringKDistinct(s: string, k: number): number {
  if (k === 0) return 0;
  const cnt = new Map<string, number>();
  let l = 0, best = 0;
  for (let r = 0; r < s.length; r++) {
    cnt.set(s[r], (cnt.get(s[r]) ?? 0) + 1);
    while (cnt.size > k) {
      const lc = s[l];
      cnt.set(lc, cnt.get(lc)! - 1);
      if (cnt.get(lc) === 0) cnt.delete(lc);
      l++;
    }
    best = Math.max(best, r - l + 1);
  }
  return best;
}
```

**Java:**
```java
int longestSubstringKDistinct(String s, int k) {
    if (k == 0) return 0;
    Map<Character, Integer> cnt = new HashMap<>();
    int l = 0, best = 0;
    for (int r = 0; r < s.length(); r++) {
        cnt.merge(s.charAt(r), 1, Integer::sum);
        while (cnt.size() > k) {
            char lc = s.charAt(l++);
            if (cnt.merge(lc, -1, Integer::sum) == 0) cnt.remove(lc);
        }
        best = Math.max(best, r - l + 1);
    }
    return best;
}
```

**Key points:**
- Each character is added and removed at most once → amortized O(n).
- Delete zero-count keys to keep `len(cnt)` accurate.
- `k == 0` is a special case returning 0.

**Follow-ups:**
- Longest substring with *exactly* K distinct characters.
- Longest substring with at most 2 distinct (special case).
- Smallest substring containing all of `t` (Minimum Window Substring).
- Return the actual substring, not just its length.

**Common Pitfalls:**
- Not deleting zero-count keys — `cnt.size()` overstates distinct count.
- Shrinking on `cnt.size() >= k` instead of `> k` — off-by-one.

**Tags:** #algorithm

---

### 4. LFU Cache

**Difficulty:** Hard
**Topics:** ood, hashmap, linked-list, design
**Position:** SWE
**Years:** P6-P7

**Question:** Design an LFU (Least Frequently Used) cache with O(1) `get` and `put`. On evict, drop the least frequently used; tie-break by least recently used.

**Approach:** Two hashmaps + many doubly-linked lists. `key -> node`, `freq -> DLL of nodes with that freq`. On access, remove from current freq list, insert at head of (freq+1) list. Track `min_freq`. On evict, remove tail of `min_freq` list. Update `min_freq` when its list empties on increment.

**Python:**
```python
from collections import OrderedDict, defaultdict

class LFUCache:
    def __init__(self, capacity: int) -> None:
        self.cap = capacity
        self.kv: dict[int, tuple[int, int]] = {}  # key -> (val, freq)
        self.buckets: dict[int, OrderedDict[int, None]] = defaultdict(OrderedDict)
        self.min_freq = 0

    def _bump(self, key: int) -> None:
        val, f = self.kv[key]
        del self.buckets[f][key]
        if not self.buckets[f] and f == self.min_freq:
            self.min_freq += 1
        self.buckets[f + 1][key] = None
        self.kv[key] = (val, f + 1)

    def get(self, key: int) -> int:
        if key not in self.kv:
            return -1
        self._bump(key)
        return self.kv[key][0]

    def put(self, key: int, value: int) -> None:
        if self.cap == 0:
            return
        if key in self.kv:
            self.kv[key] = (value, self.kv[key][1])
            self._bump(key)
            return
        if len(self.kv) >= self.cap:
            evict, _ = self.buckets[self.min_freq].popitem(last=False)
            del self.kv[evict]
        self.kv[key] = (value, 1)
        self.buckets[1][key] = None
        self.min_freq = 1
```

**TypeScript:**
```typescript
class LFUCache {
  private cap: number;
  private kv = new Map<number, { val: number; freq: number }>();
  private buckets = new Map<number, Map<number, true>>();
  private minFreq = 0;
  constructor(capacity: number) { this.cap = capacity; }
  private bump(key: number): void {
    const e = this.kv.get(key)!;
    this.buckets.get(e.freq)!.delete(key);
    if (this.buckets.get(e.freq)!.size === 0 && e.freq === this.minFreq) this.minFreq++;
    e.freq++;
    if (!this.buckets.has(e.freq)) this.buckets.set(e.freq, new Map());
    this.buckets.get(e.freq)!.set(key, true);
  }
  get(key: number): number {
    if (!this.kv.has(key)) return -1;
    this.bump(key);
    return this.kv.get(key)!.val;
  }
  put(key: number, value: number): void {
    if (this.cap === 0) return;
    if (this.kv.has(key)) { this.kv.get(key)!.val = value; this.bump(key); return; }
    if (this.kv.size >= this.cap) {
      const b = this.buckets.get(this.minFreq)!;
      const oldest = b.keys().next().value as number;
      b.delete(oldest); this.kv.delete(oldest);
    }
    this.kv.set(key, { val: value, freq: 1 });
    if (!this.buckets.has(1)) this.buckets.set(1, new Map());
    this.buckets.get(1)!.set(key, true);
    this.minFreq = 1;
  }
}
```

**Java:**
```java
class LFUCache {
    private final int cap;
    private int minFreq = 0;
    private final Map<Integer, int[]> kv = new HashMap<>();           // key -> {val, freq}
    private final Map<Integer, LinkedHashSet<Integer>> buckets = new HashMap<>();

    public LFUCache(int capacity) { this.cap = capacity; }

    private void bump(int key) {
        int[] e = kv.get(key);
        buckets.get(e[1]).remove(key);
        if (buckets.get(e[1]).isEmpty() && e[1] == minFreq) minFreq++;
        e[1]++;
        buckets.computeIfAbsent(e[1], f -> new LinkedHashSet<>()).add(key);
    }

    public int get(int key) {
        if (!kv.containsKey(key)) return -1;
        bump(key);
        return kv.get(key)[0];
    }

    public void put(int key, int value) {
        if (cap == 0) return;
        if (kv.containsKey(key)) { kv.get(key)[0] = value; bump(key); return; }
        if (kv.size() >= cap) {
            var b = buckets.get(minFreq);
            int evict = b.iterator().next();
            b.remove(evict);
            kv.remove(evict);
        }
        kv.put(key, new int[]{value, 1});
        buckets.computeIfAbsent(1, f -> new LinkedHashSet<>()).add(key);
        minFreq = 1;
    }
}
```

**Key points:**
- Each frequency bucket is an ordered map → O(1) LRU among ties.
- `min_freq` only grows or resets to 1 on a fresh insert.
- Capacity 0 must be handled or `put` crashes on evict.

**Follow-ups:**
- LRU cache — same data structure family, simpler invariant.
- LFU with TTL on each entry.
- Distributed LFU — how do you sync frequencies across replicas?
- Aging: decay freq over time so old hot items don't pin forever.

**Common Pitfalls:**
- Not removing the empty frequency bucket — the iteration grows unbounded.
- Bumping `min_freq` on `get` even when the bumped key wasn't the only one at `min_freq`.

**Tags:** #algorithm

---

### 5. Find Median from Data Stream

**Difficulty:** Hard
**Topics:** heap, design, streaming
**Position:** SWE
**Years:** P6-P7

**Question:** Implement `addNum(int)` and `findMedian()` for a stream of integers.

**Approach:** Max-heap for lower half, min-heap for upper half. Rebalance to keep sizes within 1. Median = top of larger heap, or average of tops. O(log n) add, O(1) find.

**Python:**
```python
import heapq

class MedianFinder:
    def __init__(self) -> None:
        self.lo: list[int] = []  # max-heap (negated)
        self.hi: list[int] = []  # min-heap

    def addNum(self, num: int) -> None:
        heapq.heappush(self.lo, -heapq.heappushpop(self.hi, num))
        if len(self.lo) > len(self.hi) + 1:
            heapq.heappush(self.hi, -heapq.heappop(self.lo))

    def findMedian(self) -> float:
        if len(self.lo) > len(self.hi):
            return -self.lo[0]
        return (-self.lo[0] + self.hi[0]) / 2
```

**TypeScript:**
```typescript
class MinHeap {
  h: number[] = [];
  push(x: number): void { this.h.push(x); this.up(this.h.length - 1); }
  pop(): number { const t = this.h[0]; const l = this.h.pop()!; if (this.h.length) { this.h[0] = l; this.down(0); } return t; }
  top(): number { return this.h[0]; }
  size(): number { return this.h.length; }
  private up(i: number): void { while (i > 0) { const p = (i - 1) >> 1; if (this.h[p] <= this.h[i]) break; [this.h[p], this.h[i]] = [this.h[i], this.h[p]]; i = p; } }
  private down(i: number): void { const n = this.h.length; for (;;) { const l = 2 * i + 1, r = 2 * i + 2; let m = i; if (l < n && this.h[l] < this.h[m]) m = l; if (r < n && this.h[r] < this.h[m]) m = r; if (m === i) break; [this.h[m], this.h[i]] = [this.h[i], this.h[m]]; i = m; } }
}

class MedianFinder {
  private lo = new MinHeap();  // stores negatives → behaves like max-heap
  private hi = new MinHeap();
  addNum(num: number): void {
    this.hi.push(num);
    this.lo.push(-this.hi.pop());
    if (this.lo.size() > this.hi.size() + 1) this.hi.push(-this.lo.pop());
  }
  findMedian(): number {
    if (this.lo.size() > this.hi.size()) return -this.lo.top();
    return (-this.lo.top() + this.hi.top()) / 2;
  }
}
```

**Java:**
```java
class MedianFinder {
    private final PriorityQueue<Integer> lo = new PriorityQueue<>(Comparator.reverseOrder()); // max-heap
    private final PriorityQueue<Integer> hi = new PriorityQueue<>();                          // min-heap

    public void addNum(int num) {
        hi.offer(num);
        lo.offer(hi.poll());
        if (lo.size() > hi.size() + 1) hi.offer(lo.poll());
    }

    public double findMedian() {
        if (lo.size() > hi.size()) return lo.peek();
        return (lo.peek() + hi.peek()) / 2.0;
    }
}
```

**Key points:**
- Two heaps split the stream; size invariant keeps median at heap tops.
- Use negation to simulate a max-heap when only min-heap is built-in.
- Find is O(1); add is O(log n) amortized.

**Follow-ups:**
- Sliding-window median — add removal/expiration support.
- 99th percentile in a stream — t-digest or HDR histogram.
- Distributed median across shards — binary search on candidate values.
- Memory-bounded stream median (approximate) — reservoir sampling.

**Common Pitfalls:**
- Letting heap sizes drift by more than 1 — median wanders off.
- Forgetting to balance after the initial offer — the first median is wrong.

**Tags:** #algorithm

---

### 6. Reverse Pairs

**Difficulty:** Hard
**Topics:** merge-sort, bit, divide-and-conquer
**Position:** SWE
**Years:** P7

**Question:** Given an array, count pairs `(i, j)` with `i < j` and `nums[i] > 2 * nums[j]`.

**Approach:** Modified merge sort. During merge, for each `i` in left half, count `j` in right half such that `left[i] > 2 * right[j]` (two-pointer counting before merging). O(n log n). Alternative: BIT/Fenwick tree with coordinate compression.

**Python:**
```python
def reverse_pairs(nums: list[int]) -> int:
    def sort(l: int, r: int) -> int:
        if l >= r:
            return 0
        m = (l + r) // 2
        c = sort(l, m) + sort(m + 1, r)
        j = m + 1
        for i in range(l, m + 1):
            while j <= r and nums[i] > 2 * nums[j]:
                j += 1
            c += j - (m + 1)
        nums[l:r + 1] = sorted(nums[l:r + 1])
        return c
    return sort(0, len(nums) - 1)
```

**TypeScript:**
```typescript
function reversePairs(nums: number[]): number {
  const sort = (l: number, r: number): number => {
    if (l >= r) return 0;
    const m = (l + r) >> 1;
    let c = sort(l, m) + sort(m + 1, r);
    let j = m + 1;
    for (let i = l; i <= m; i++) {
      while (j <= r && nums[i] > 2 * nums[j]) j++;
      c += j - (m + 1);
    }
    const merged = nums.slice(l, r + 1).sort((a, b) => a - b);
    for (let k = 0; k < merged.length; k++) nums[l + k] = merged[k];
    return c;
  };
  return sort(0, nums.length - 1);
}
```

**Java:**
```java
int reversePairs(int[] nums) {
    return sort(nums, 0, nums.length - 1);
}

private int sort(int[] nums, int l, int r) {
    if (l >= r) return 0;
    int m = (l + r) >>> 1;
    int c = sort(nums, l, m) + sort(nums, m + 1, r);
    int j = m + 1;
    for (int i = l; i <= m; i++) {
        while (j <= r && (long) nums[i] > 2L * nums[j]) j++;
        c += j - (m + 1);
    }
    int[] tmp = Arrays.copyOfRange(nums, l, r + 1);
    Arrays.sort(tmp);
    System.arraycopy(tmp, 0, nums, l, tmp.length);
    return c;
}
```

**Key points:**
- Count before merging so both halves are still individually sorted.
- Use `2 * nums[j]` carefully — beware integer overflow in lower-level languages.
- BIT with compression gives the same O(n log n) with smaller constant for sums.

**Follow-ups:**
- Count Smaller Numbers After Self — same merge-sort trick.
- Count of Range Sum — prefix sums + merge sort or BIT.
- Count inversions in linked list — same algorithm, awkward access.
- Use a Fenwick tree with value compression instead.

**Common Pitfalls:**
- Counting *after* merging — lose the ordering invariant.
- Integer overflow on `2 * nums[j]` — cast to long.

**Tags:** #algorithm

---

### 7. Implement a Distributed Lock (in Java)

**Difficulty:** Medium
**Topics:** concurrency, redis, distributed-systems
**Position:** SWE
**Years:** P6-P7

**Question:** Implement a distributed lock in Java using Redis. Discuss correctness and edge cases.

**Approach:** `SET key uuid NX PX 30000` (atomic). Owner stored as UUID so only owner can release. Release via Lua script: GET → compare UUID → DEL atomically. Discuss: clock drift (lease-based), client GC pause (Kleppmann's fencing token argument), Redlock controversy. Alternative: Zookeeper ephemeral sequential node + watch on predecessor (cleaner correctness, higher latency).

**Python:**
```python
import uuid
from typing import Protocol

class Redis(Protocol):
    def set(self, key: str, value: str, nx: bool = ..., px: int = ...) -> bool | None: ...
    def eval(self, script: str, numkeys: int, *keys_and_args: str) -> int: ...

UNLOCK_LUA = """
if redis.call('get', KEYS[1]) == ARGV[1] then
  return redis.call('del', KEYS[1])
else
  return 0
end
"""

class RedisLock:
    def __init__(self, r: Redis, key: str, ttl_ms: int = 30000) -> None:
        self.r, self.key, self.ttl = r, key, ttl_ms
        self.token = str(uuid.uuid4())

    def acquire(self) -> bool:
        return bool(self.r.set(self.key, self.token, nx=True, px=self.ttl))

    def release(self) -> bool:
        return self.r.eval(UNLOCK_LUA, 1, self.key, self.token) == 1
```

**TypeScript:**
```typescript
import { randomUUID } from "crypto";

interface RedisClient {
  set(key: string, value: string, mode: "NX", expire: "PX", ms: number): Promise<"OK" | null>;
  eval(script: string, numKeys: number, ...keysAndArgs: string[]): Promise<number>;
}

const UNLOCK_LUA = `
if redis.call('get', KEYS[1]) == ARGV[1] then
  return redis.call('del', KEYS[1])
else
  return 0
end`;

class RedisLock {
  private token = randomUUID();
  constructor(private r: RedisClient, private key: string, private ttlMs = 30_000) {}
  async acquire(): Promise<boolean> {
    return (await this.r.set(this.key, this.token, "NX", "PX", this.ttlMs)) === "OK";
  }
  async release(): Promise<boolean> {
    return (await this.r.eval(UNLOCK_LUA, 1, this.key, this.token)) === 1;
  }
}
```

**Java:**
```java
class RedisLock {
    private static final String UNLOCK_LUA =
        "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";
    private final RedisCommands redis;        // any Redis client wrapper
    private final String key;
    private final long ttlMs;
    private final String token = UUID.randomUUID().toString();

    public RedisLock(RedisCommands redis, String key, long ttlMs) {
        this.redis = redis; this.key = key; this.ttlMs = ttlMs;
    }

    public boolean acquire() {
        return "OK".equals(redis.set(key, token, "NX", "PX", ttlMs));
    }

    public boolean release() {
        Object r = redis.eval(UNLOCK_LUA, List.of(key), List.of(token));
        return r instanceof Long l && l == 1L;
    }
}
```

**Key points:**
- UUID token prevents accidentally releasing someone else's lock after TTL expiry.
- Lua script makes GET-compare-DEL atomic on the server side.
- TTL must exceed worst-case critical section, or add a watchdog renewal.

**Complexity:** `acquire` and `release` are each a single O(1) Redis round-trip; the Lua unlock runs GET-compare-DEL atomically server-side.

**Follow-ups:**
- Redlock (multi-master) — trade-offs vs single-instance.
- Watchdog/renewal pattern — Redisson-style.
- Fair lock (FIFO) — add a queue, not just a flag.
- Reentrant lock — token includes thread/call-stack identity, refcount in Lua.
- ZooKeeper / etcd ephemeral nodes as an alternative — when do you choose each?

**Common Pitfalls:**
- Releasing without checking the token — one client can unlock another's lock after TTL.
- Setting TTL shorter than the critical section — lock auto-expires while you're still inside.

**Tags:** #coding

---

### 8. Producer-Consumer with BlockingQueue

**Difficulty:** Medium
**Topics:** concurrency, java, threads
**Position:** SWE
**Years:** P5-P6

**Question:** Implement a producer-consumer pattern in Java. Compare `synchronized` + `wait/notify` vs `ReentrantLock` + `Condition` vs `BlockingQueue`.

**Approach:** Show all three. (1) `synchronized` block + `wait()` (release lock) / `notifyAll()` — error-prone, must use `while` not `if` on condition. (2) `ReentrantLock` with two `Condition`s (`notFull`, `notEmpty`) — finer control, can be unfair/fair. (3) `ArrayBlockingQueue` — production-grade, handles everything. Discuss when you'd write your own: rarely; prefer `LinkedBlockingQueue` or `Disruptor` for high-throughput.

**Python:**
```python
import threading
from collections import deque

class BoundedQueue:
    def __init__(self, capacity: int) -> None:
        self.cap = capacity
        self.q: deque[int] = deque()
        self.lock = threading.Lock()
        self.not_full = threading.Condition(self.lock)
        self.not_empty = threading.Condition(self.lock)

    def put(self, item: int) -> None:
        with self.not_full:
            while len(self.q) == self.cap:
                self.not_full.wait()
            self.q.append(item)
            self.not_empty.notify()

    def take(self) -> int:
        with self.not_empty:
            while not self.q:
                self.not_empty.wait()
            item = self.q.popleft()
            self.not_full.notify()
            return item
```

**TypeScript:**
```typescript
class BoundedQueue<T> {
  private q: T[] = [];
  private waitingPut: Array<() => void> = [];
  private waitingTake: Array<(v: T) => void> = [];
  constructor(private cap: number) {}
  async put(item: T): Promise<void> {
    if (this.q.length >= this.cap) {
      await new Promise<void>(res => this.waitingPut.push(res));
    }
    const take = this.waitingTake.shift();
    if (take) take(item); else this.q.push(item);
  }
  async take(): Promise<T> {
    if (this.q.length === 0) {
      return new Promise<T>(res => this.waitingTake.push(res));
    }
    const item = this.q.shift()!;
    const put = this.waitingPut.shift();
    if (put) put();
    return item;
  }
}
```

**Java:**
```java
class BoundedQueue<T> {
    private final Deque<T> q = new ArrayDeque<>();
    private final int cap;
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition notFull = lock.newCondition();
    private final Condition notEmpty = lock.newCondition();

    public BoundedQueue(int cap) { this.cap = cap; }

    public void put(T item) throws InterruptedException {
        lock.lock();
        try {
            while (q.size() == cap) notFull.await();
            q.addLast(item);
            notEmpty.signal();
        } finally { lock.unlock(); }
    }

    public T take() throws InterruptedException {
        lock.lock();
        try {
            while (q.isEmpty()) notEmpty.await();
            T item = q.removeFirst();
            notFull.signal();
            return item;
        } finally { lock.unlock(); }
    }
}
```

**Key points:**
- Always re-check the predicate in a `while` loop — `notify` is not a guarantee.
- Use two distinct conditions to avoid spurious wake-ups of the wrong party.
- Built-in `ArrayBlockingQueue` (Java) / `asyncio.Queue` (Python) is preferred in real code.

**Complexity:** `put` and `take` are O(1) each; blocked threads wait on a condition variable instead of spinning, so no CPU is burned while full/empty.

**Follow-ups:**
- Multiple producers + multiple consumers — does anything change?
- Bounded queue with timed `offer`/`poll` (return false vs throw).
- Lock-free MPSC ring buffer (Disruptor pattern).
- Backpressure: producers slow down when consumers fall behind.

**Common Pitfalls:**
- Using `if` instead of `while` around `await` — spurious wakeup bug.
- Signaling the *same* condition for both producers and consumers — wakes the wrong side.

**Tags:** #coding

---

### 9. Design Taobao Flash Sale (秒杀)

**Difficulty:** Hard
**Topics:** system-design, caching, queue, rate-limiting, consistency
**Position:** Senior SWE
**Years:** P7

**Question:** Design the backend for a Taobao 秒杀 (flash sale): 100K items go on sale at 10:00:00.000, millions of users hit "buy" at the same millisecond. Inventory must not over-sell.

**Approach:** Layered defense: (1) Client throttle + CAPTCHA on hot pages. (2) CDN caches the product page; the "buy" button is enabled by client-side timer (don't trust). (3) API gateway with Sentinel for global rate limiting. (4) Redis holds inventory counter; `DECR` is atomic, return -1 if oversold → reject. (5) Successful "lock" pushed to RocketMQ for async order creation (this prevents DB hot-row contention; downgrade to "order pending" UI). (6) Order service writes to sharded MySQL (shard by user_id), reconciles with the locked inventory. Discuss: idempotency tokens (user retries shouldn't double-order), cache warming (load inventory into Redis before sale), and graceful degradation (sell out → static page).

**Follow-ups:**
- What if Redis goes down mid-sale — single point of failure?
- Cold-cache moment at T=0 — thundering herd protection.
- Anti-cheating: how do you stop bots from grabbing 90% of inventory?
- Per-user limit (1 per ID, 1 per phone, 1 per device) — where do you enforce?
- Real-time inventory dashboard for ops — how do you read without contention?

**Common Pitfalls:**
- Decrementing inventory in MySQL on the hot path — row-lock contention kills throughput.
- Trusting the client timer to gate "buy" — attackers send requests early.

**Tags:** #system-design

---

### 10. Design Alipay Payment Flow

**Difficulty:** Hard
**Topics:** system-design, distributed-transactions, idempotency, payments
**Position:** Senior SWE
**Years:** P7-P8

**Question:** Design the payment flow when a user pays for an order on Taobao via Alipay. Cover failure cases.

**Approach:** Saga pattern across services: Order → Payment Account → Bank/Card. Each step is an idempotent local transaction; on failure, run compensating actions. Idempotency token (out_trade_no) prevents double-charges on retry. Use Seata or self-built TCC (Try-Confirm-Cancel) framework: Try reserves funds, Confirm captures, Cancel releases. Asynchronous bank callback updates final state. Discuss: reconciliation (daily batch matches our records vs bank's), eventual consistency window (user sees "processing" not "paid"), fraud signals, and PCI scope.

**Follow-ups:**
- TCC vs Saga vs 2PC — when does each fit?
- Compensating transaction that itself fails — how do you recover?
- Bank callback arrives twice / out-of-order — idempotency design.
- Cross-border payments — FX risk and settlement windows.
- Refund flow — partial refund, days later, original transaction archived.

**Common Pitfalls:**
- Treating the bank call as synchronous — timeouts make the order status undefined.
- No idempotency token — user retries double-charge.

**Tags:** #system-design

---

### 11. Design RocketMQ-style Message Queue

**Difficulty:** Hard
**Topics:** system-design, message-queue, replication, ordering
**Position:** Senior SWE
**Years:** P7-P8

**Question:** Design a distributed message queue like RocketMQ supporting ordered messages, transactional messages, and high throughput.

**Approach:** Broker holds commit log + per-queue offsets. Producers write to a partition (consistent-hash or RR); consumers pull from offsets they manage. Replication: master-slave (sync or async). Ordered messages: producer pins to a partition by key. Transactional messages: 2-phase — send "half" message → broker holds → producer commits/rolls back → broker delivers or discards (with callback recovery for crashed producers). Discuss: zero-copy (mmap + sendfile) for throughput, consumer group rebalance on member change, and message backlog handling.

**Tags:** #system-design

---

### 12. Design a Distributed Configuration Center (Nacos-like)

**Difficulty:** Medium
**Topics:** system-design, distributed, watch, consistency
**Position:** Senior SWE
**Years:** P7

**Question:** Design a configuration center used by thousands of services to manage runtime config and service discovery.

**Approach:** Cluster of 3-5 servers using Raft for strong consistency on writes. Clients long-poll (or use SSE / WebSocket) for change notifications. Local client cache + fallback to disk if server unreachable. For service discovery, registry stores `(service, instance, healthy)` with heartbeat-based health check. Configs versioned; rollback supported. Discuss: graceful degradation (clients run on cached config if server is down), namespace/tenant isolation, and how config push avoids thundering herd (server staggers notifications).

**Tags:** #system-design

---

### 13. Design Cainiao Logistics Tracking

**Difficulty:** Hard
**Topics:** system-design, time-series, geospatial, ingestion, big-data
**Position:** Senior SWE
**Years:** P7

**Question:** Design the parcel tracking system for Cainiao — every package emits status events (picked up, in transit, delivered) and users query status in real time.

**Approach:** Events ingested via gateway → Kafka → consumer pipeline. Latest status per parcel kept in HBase or Cassandra (key = tracking_number, sorted columns by timestamp). Aggregated views (delivery ETAs, hub bottleneck stats) computed via Flink. Geospatial: each scan emits `(parcel_id, hub_id, lat/lng, ts)`; map view queries by bounding box on a geo-index (Elasticsearch or H3 cells). Discuss read fan-out (millions of users check the same package), notification triggers, and historical query of long-completed parcels (move to cold storage).

**Tags:** #system-design

---

### 14. Design an E-commerce Coupon / Promotion System

**Difficulty:** Hard
**Topics:** system-design, rules-engine, caching, anti-abuse
**Position:** Senior SWE
**Years:** P7

**Question:** Design the system that evaluates coupons and promotions at checkout — supports stacking rules, time-bound, user-eligibility, anti-abuse.

**Approach:** Rules engine (Drools-style or custom DSL) evaluates a cart against all applicable promotions. Coupons stored in Redis (per-user owned, per-campaign issued counters). Eligibility check: per-user limit (atomic decrement), time window, product/category match. Anti-abuse: device fingerprint, IP rate limit, ML risk score. Calculation order matters when stacking — define explicit priority: shop-coupon → category-coupon → platform-coupon. Async issue audit log for fraud investigation. Discuss: cache invalidation on rule change, A/B different promo logic, and how to roll back a bad campaign mid-flight.

**Tags:** #system-design

---

### 15. 客户第一: Tell me about a time you prioritized the customer over internal pressure

**Difficulty:** Medium
**Topics:** behavioral, customer-first, six-values
**Position:** SWE
**Years:** P5-P7

**Question:** Tell me about a time you pushed back on internal stakeholders to do what was right for the customer.

**Approach:** Maps to 客户第一 (Customer First). Show: (1) the internal pressure was concrete (deadline, exec ask, cost), (2) you identified specific customer harm with data, (3) you proposed an alternative that served both when possible, (4) you communicated up-chain not just refused. Result: customer-impact metric improved, internal relationship preserved.

**Tags:** #behavioral

---

### 16. 拥抱变化: Tell me about a time your project pivoted

**Difficulty:** Medium
**Topics:** behavioral, embrace-change, six-values
**Position:** SWE
**Years:** P5-P7

**Question:** Tell me about a time the direction of your project changed significantly. How did you adapt?

**Approach:** Maps to 拥抱变化 (Embrace Change). Alibaba reorganizes frequently — they want people who roll with it. Show: (1) you found the *opportunity* in the pivot (new tech to learn, new domain), (2) you helped teammates who were struggling with the change, (3) you delivered in the new direction with energy, not resentment. Avoid stories that secretly complain about leadership.

**Tags:** #behavioral

---

### 17. 团队合作: Time you helped a colleague succeed

**Difficulty:** Medium
**Topics:** behavioral, team-work, six-values
**Position:** SWE
**Years:** P6-P7

**Question:** Tell me about a time you went out of your way to help a teammate succeed, even when it didn't directly benefit you.

**Approach:** Maps to 团队合作 (Teamwork). Show: (1) specific colleague + situation (struggling promo case, blocked on something), (2) what you specifically did (pair programming, took on their on-call, ghost-wrote their design doc), (3) outcome for them — they shipped, got promoted, leveled up. Don't oversell your role; the teammate is the protagonist.

**Tags:** #behavioral

---

### 18. Toughest technical problem you've solved

**Difficulty:** Medium
**Topics:** behavioral, technical-depth, dive-deep
**Position:** Senior SWE
**Years:** P7

**Question:** Walk me through the hardest technical problem you've personally solved. Be detailed.

**Approach:** Higher-level (P8+) interviewers grade this heavily. Pick a problem with: (1) real complexity (not just "I learned a new framework"), (2) measurable impact, (3) trade-offs you made consciously, (4) what would do differently. Be ready for 20+ min of follow-up grilling. Bonus: if you can tie it to JVM internals or distributed-systems theory, P9 interviewers light up.

**Tags:** #behavioral

---

### 19. JVM tuning: troubleshoot full GC storms in a Java service

**Difficulty:** Hard
**Topics:** java, jvm, gc, performance
**Position:** SWE
**Years:** P6-P7

**Question:** A Java service shows long Full GC pauses every few minutes, causing latency spikes. Walk through how you'd diagnose and fix it.

**Approach:** (1) Enable GC logs (`-Xlog:gc*` for JDK 9+) and collect a heap dump (`jmap` or auto-on-OOM). (2) Analyze with GCViewer/JClarity — identify pause cause (allocation rate too high? old gen filling fast? metaspace?). (3) Common culprits: large object allocation (caches not bounded), memory leak (static collection growing), wrong collector (Parallel GC for low-latency = bad → switch to G1/ZGC/Shenandoah). (4) Tune heap sizing — too small Eden = frequent young GC, too large old gen = long Full GC. (5) Code fix: object pooling for hot paths, off-heap caching, lazy init. Mention `-XX:+HeapDumpOnOutOfMemoryError` always on in production.

**Tags:** #domain-knowledge

---

### 20. Distributed transaction: 2PC vs TCC vs Saga vs Seata

**Difficulty:** Hard
**Topics:** distributed-systems, transactions, seata, payments
**Position:** Senior SWE
**Years:** P7-P8

**Question:** A payment crosses three services (Order, Wallet, Coupon). Compare 2PC, TCC, Saga, and Seata AT mode for ensuring atomicity. Which would you pick at Alibaba scale?

**Approach:** **2PC** — synchronous, blocking; coordinator failure leaves participants in limbo. Not used at scale. **TCC (Try-Confirm-Cancel)** — application-defined; reserves resources in Try, captures in Confirm, releases in Cancel. Strong consistency, more code. **Saga** — chain of local transactions with compensating actions; eventual consistency, no isolation between steps (dirty reads possible by user). **Seata AT mode** — automatic compensation via undo logs; less code than TCC but requires DB integration and adds row-level "global locks." At Alibaba scale: TCC for payments (correctness critical, willing to code), Saga for non-financial flows (e.g., order → ship → notify), AT mode for green-field internal services. Discuss idempotency, retry policies, and reconciliation as safety nets.

**Tags:** #domain-knowledge

---

### 21. Edit Distance

**Difficulty:** Hard
**Topics:** dp, strings
**Position:** P6
**Years:** P5-P6

**Question:** Given two strings `word1` and `word2`, return the minimum number of operations (insert, delete, replace) required to convert `word1` to `word2`.

**Approach:** 2D DP. `dp[i][j]` = min ops to convert `word1[:i]` to `word2[:j]`. If chars match: `dp[i-1][j-1]`; else `1 + min(insert, delete, replace)`. O(m*n) time and space; can compress to O(min(m,n)) using two rows.

**Python:**
```python
def min_distance(word1: str, word2: str) -> int:
    m, n = len(word1), len(word2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if word1[i - 1] == word2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    return dp[m][n]
```

**TypeScript:**
```typescript
function minDistance(word1: string, word2: string): number {
  const m = word1.length, n = word2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (word1[i - 1] === word2[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}
```

**Java:**
```java
int minDistance(String word1, String word2) {
    int m = word1.length(), n = word2.length();
    int[][] dp = new int[m + 1][n + 1];
    for (int i = 0; i <= m; i++) dp[i][0] = i;
    for (int j = 0; j <= n; j++) dp[0][j] = j;
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (word1.charAt(i - 1) == word2.charAt(j - 1)) dp[i][j] = dp[i - 1][j - 1];
            else dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], Math.min(dp[i - 1][j], dp[i][j - 1]));
        }
    }
    return dp[m][n];
}
```

**Key points:**
- Initialize the first row/column to represent converting from/to empty string.
- Three transitions correspond to delete, insert, replace.
- Roll over two rows to reduce space to O(min(m, n)).

**Tags:** #algorithm

---

### 22. Longest Common Subsequence

**Difficulty:** Medium
**Topics:** dp, strings
**Position:** P5
**Years:** P5-P6

**Question:** Given two strings, return the length of their longest common subsequence.

**Approach:** Classic 2D DP. `dp[i][j] = dp[i-1][j-1] + 1` if chars match else `max(dp[i-1][j], dp[i][j-1])`. O(m*n). Rolling array reduces space to O(min(m,n)).

**Python:**
```python
def longest_common_subsequence(text1: str, text2: str) -> int:
    m, n = len(text1), len(text2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if text1[i - 1] == text2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    return dp[m][n]
```

**TypeScript:**
```typescript
function longestCommonSubsequence(text1: string, text2: string): number {
  const m = text1.length, n = text2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}
```

**Java:**
```java
int longestCommonSubsequence(String text1, String text2) {
    int m = text1.length(), n = text2.length();
    int[][] dp = new int[m + 1][n + 1];
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (text1.charAt(i - 1) == text2.charAt(j - 1)) dp[i][j] = dp[i - 1][j - 1] + 1;
            else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
    }
    return dp[m][n];
}
```

**Key points:**
- LCS measures similarity without requiring contiguity.
- Match extends the diagonal; mismatch inherits the best of upper/left.
- Roll over to two rows (or one with a diag temp) for O(min(m, n)) space.

**Tags:** #algorithm

---

### 23. Distinct Subsequences

**Difficulty:** Hard
**Topics:** dp, strings
**Position:** P6
**Years:** P6-P7

**Question:** Given strings `s` and `t`, count the number of distinct subsequences of `s` which equal `t`.

**Approach:** DP. `dp[i][j]` = ways to form `t[:j]` from `s[:i]`. If `s[i-1]==t[j-1]`: `dp[i-1][j-1] + dp[i-1][j]` (use it or skip), else `dp[i-1][j]`. O(m*n) time, can compress columns.

**Python:**
```python
def num_distinct(s: str, t: str) -> int:
    m, n = len(s), len(t)
    if n > m:
        return 0
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1):
        dp[i][0] = 1
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            dp[i][j] = dp[i - 1][j]
            if s[i - 1] == t[j - 1]:
                dp[i][j] += dp[i - 1][j - 1]
    return dp[m][n]
```

**TypeScript:**
```typescript
function numDistinct(s: string, t: string): number {
  const m = s.length, n = t.length;
  if (n > m) return 0;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = 1;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = dp[i - 1][j];
      if (s[i - 1] === t[j - 1]) dp[i][j] += dp[i - 1][j - 1];
    }
  }
  return dp[m][n];
}
```

**Java:**
```java
int numDistinct(String s, String t) {
    int m = s.length(), n = t.length();
    if (n > m) return 0;
    long[][] dp = new long[m + 1][n + 1];
    for (int i = 0; i <= m; i++) dp[i][0] = 1;
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            dp[i][j] = dp[i - 1][j];
            if (s.charAt(i - 1) == t.charAt(j - 1)) dp[i][j] += dp[i - 1][j - 1];
        }
    }
    return (int) dp[m][n];
}
```

**Key points:**
- Empty `t` has exactly one subsequence (the empty one).
- When chars match, sum "use it" and "skip" paths.
- Iterate `j` right-to-left for the 1D rolling variant.

**Tags:** #algorithm

---

### 24. Interleaving String

**Difficulty:** Medium
**Topics:** dp, strings
**Position:** P6
**Years:** P5-P6

**Question:** Given strings `s1`, `s2`, `s3`, determine whether `s3` is formed by an interleaving of `s1` and `s2`.

**Approach:** 2D DP. `dp[i][j]` = true if `s3[:i+j]` is interleaving of `s1[:i]` and `s2[:j]`. Transition: `(dp[i-1][j] && s1[i-1]==s3[i+j-1]) || (dp[i][j-1] && s2[j-1]==s3[i+j-1])`. O(m*n).

**Python:**
```python
def is_interleave(s1: str, s2: str, s3: str) -> bool:
    m, n = len(s1), len(s2)
    if m + n != len(s3):
        return False
    dp = [[False] * (n + 1) for _ in range(m + 1)]
    dp[0][0] = True
    for i in range(m + 1):
        for j in range(n + 1):
            if i and s1[i - 1] == s3[i + j - 1]:
                dp[i][j] = dp[i][j] or dp[i - 1][j]
            if j and s2[j - 1] == s3[i + j - 1]:
                dp[i][j] = dp[i][j] or dp[i][j - 1]
    return dp[m][n]
```

**TypeScript:**
```typescript
function isInterleave(s1: string, s2: string, s3: string): boolean {
  const m = s1.length, n = s2.length;
  if (m + n !== s3.length) return false;
  const dp: boolean[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(false));
  dp[0][0] = true;
  for (let i = 0; i <= m; i++) {
    for (let j = 0; j <= n; j++) {
      if (i > 0 && s1[i - 1] === s3[i + j - 1]) dp[i][j] = dp[i][j] || dp[i - 1][j];
      if (j > 0 && s2[j - 1] === s3[i + j - 1]) dp[i][j] = dp[i][j] || dp[i][j - 1];
    }
  }
  return dp[m][n];
}
```

**Java:**
```java
boolean isInterleave(String s1, String s2, String s3) {
    int m = s1.length(), n = s2.length();
    if (m + n != s3.length()) return false;
    boolean[][] dp = new boolean[m + 1][n + 1];
    dp[0][0] = true;
    for (int i = 0; i <= m; i++) {
        for (int j = 0; j <= n; j++) {
            if (i > 0 && s1.charAt(i - 1) == s3.charAt(i + j - 1)) dp[i][j] |= dp[i - 1][j];
            if (j > 0 && s2.charAt(j - 1) == s3.charAt(i + j - 1)) dp[i][j] |= dp[i][j - 1];
        }
    }
    return dp[m][n];
}
```

**Key points:**
- Reject early when lengths don't sum up.
- Each state checks whether the last char came from `s1` or `s2`.
- Can compress to 1D row of size `n+1`.

**Tags:** #algorithm

---

### 25. Wildcard Matching

**Difficulty:** Hard
**Topics:** dp, strings, greedy
**Position:** P6
**Years:** P6-P7

**Question:** Given input string `s` and pattern `p` with `?` (any single char) and `*` (any sequence), determine if pattern matches the entire input.

**Approach:** DP `dp[i][j]`: prefix match. `*` matches empty (`dp[i][j-1]`) or extends (`dp[i-1][j]`). Alternative: greedy two-pointer with backtracking on last `*` position — O(m*n) worst case but O(m+n) typical.

**Python:**
```python
def is_match(s: str, p: str) -> bool:
    m, n = len(s), len(p)
    dp = [[False] * (n + 1) for _ in range(m + 1)]
    dp[0][0] = True
    for j in range(1, n + 1):
        if p[j - 1] == "*":
            dp[0][j] = dp[0][j - 1]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if p[j - 1] == "*":
                dp[i][j] = dp[i][j - 1] or dp[i - 1][j]
            elif p[j - 1] == "?" or p[j - 1] == s[i - 1]:
                dp[i][j] = dp[i - 1][j - 1]
    return dp[m][n]
```

**TypeScript:**
```typescript
function isMatch(s: string, p: string): boolean {
  const m = s.length, n = p.length;
  const dp: boolean[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(false));
  dp[0][0] = true;
  for (let j = 1; j <= n; j++) if (p[j - 1] === "*") dp[0][j] = dp[0][j - 1];
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (p[j - 1] === "*") dp[i][j] = dp[i][j - 1] || dp[i - 1][j];
      else if (p[j - 1] === "?" || p[j - 1] === s[i - 1]) dp[i][j] = dp[i - 1][j - 1];
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
    for (int j = 1; j <= n; j++) if (p.charAt(j - 1) == '*') dp[0][j] = dp[0][j - 1];
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            char pc = p.charAt(j - 1);
            if (pc == '*') dp[i][j] = dp[i][j - 1] || dp[i - 1][j];
            else if (pc == '?' || pc == s.charAt(i - 1)) dp[i][j] = dp[i - 1][j - 1];
        }
    }
    return dp[m][n];
}
```

**Key points:**
- Initialize leading `*` runs as matchable for an empty string.
- `*` can match nothing (`j-1`) or extend an existing match (`i-1`).
- Greedy two-pointer with star backtracking is faster in practice.

**Tags:** #algorithm

---

### 26. Scramble String

**Difficulty:** Hard
**Topics:** dp, recursion, memoization
**Position:** P7
**Years:** P7

**Question:** Given two strings `s1` and `s2` of the same length, determine if `s2` is a scrambled string of `s1` (defined recursively by splitting and optionally swapping halves).

**Approach:** Recursion + memoization on `(s1, s2)`. For each split point `i`: check `(scramble(s1[:i], s2[:i]) && scramble(s1[i:], s2[i:]))` OR `(scramble(s1[:i], s2[-i:]) && scramble(s1[i:], s2[:-i]))`. Prune with anagram check. O(n^4) with memo.

**Python:**
```python
from functools import lru_cache

def is_scramble(s1: str, s2: str) -> bool:
    @lru_cache(maxsize=None)
    def go(a: str, b: str) -> bool:
        if a == b:
            return True
        if sorted(a) != sorted(b):
            return False
        n = len(a)
        for i in range(1, n):
            if go(a[:i], b[:i]) and go(a[i:], b[i:]):
                return True
            if go(a[:i], b[-i:]) and go(a[i:], b[:-i]):
                return True
        return False
    return go(s1, s2)
```

**TypeScript:**
```typescript
function isScramble(s1: string, s2: string): boolean {
  const memo = new Map<string, boolean>();
  const go = (a: string, b: string): boolean => {
    if (a === b) return true;
    const key = a + "#" + b;
    if (memo.has(key)) return memo.get(key)!;
    if ([...a].sort().join("") !== [...b].sort().join("")) { memo.set(key, false); return false; }
    const n = a.length;
    for (let i = 1; i < n; i++) {
      if (go(a.slice(0, i), b.slice(0, i)) && go(a.slice(i), b.slice(i))) { memo.set(key, true); return true; }
      if (go(a.slice(0, i), b.slice(n - i)) && go(a.slice(i), b.slice(0, n - i))) { memo.set(key, true); return true; }
    }
    memo.set(key, false);
    return false;
  };
  return go(s1, s2);
}
```

**Java:**
```java
private final Map<String, Boolean> memo = new HashMap<>();

boolean isScramble(String s1, String s2) {
    if (s1.equals(s2)) return true;
    String key = s1 + "#" + s2;
    Boolean cached = memo.get(key);
    if (cached != null) return cached;
    char[] a = s1.toCharArray(), b = s2.toCharArray();
    Arrays.sort(a); Arrays.sort(b);
    if (!Arrays.equals(a, b)) { memo.put(key, false); return false; }
    int n = s1.length();
    for (int i = 1; i < n; i++) {
        if (isScramble(s1.substring(0, i), s2.substring(0, i))
            && isScramble(s1.substring(i), s2.substring(i))) { memo.put(key, true); return true; }
        if (isScramble(s1.substring(0, i), s2.substring(n - i))
            && isScramble(s1.substring(i), s2.substring(0, n - i))) { memo.put(key, true); return true; }
    }
    memo.put(key, false);
    return false;
}
```

**Key points:**
- Anagram check (or counter compare) prunes huge branches early.
- Memoize on `(s1, s2)` pair to avoid exponential blow-up.
- Each split allows either matched or swapped halves.

**Tags:** #algorithm

---

### 27. Russian Doll Envelopes

**Difficulty:** Hard
**Topics:** dp, binary-search, sorting
**Position:** P6
**Years:** P6-P7

**Question:** Given pairs `(w, h)` of envelopes, find the maximum number you can nest (strictly increasing both dimensions).

**Approach:** Sort by `w` ascending; on tie by `h` descending (prevents same-w envelopes counting). Then run LIS on `h` array via patience sort + binary search. O(n log n).

**Python:**
```python
from bisect import bisect_left

def max_envelopes(envelopes: list[list[int]]) -> int:
    envelopes.sort(key=lambda e: (e[0], -e[1]))
    tails: list[int] = []
    for _, h in envelopes:
        i = bisect_left(tails, h)
        if i == len(tails):
            tails.append(h)
        else:
            tails[i] = h
    return len(tails)
```

**TypeScript:**
```typescript
function maxEnvelopes(envelopes: number[][]): number {
  envelopes.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  const tails: number[] = [];
  for (const [, h] of envelopes) {
    let l = 0, r = tails.length;
    while (l < r) {
      const m = (l + r) >> 1;
      if (tails[m] < h) l = m + 1; else r = m;
    }
    if (l === tails.length) tails.push(h);
    else tails[l] = h;
  }
  return tails.length;
}
```

**Java:**
```java
int maxEnvelopes(int[][] envelopes) {
    Arrays.sort(envelopes, (a, b) -> a[0] != b[0] ? a[0] - b[0] : b[1] - a[1]);
    List<Integer> tails = new ArrayList<>();
    for (int[] e : envelopes) {
        int h = e[1];
        int lo = 0, hi = tails.size();
        while (lo < hi) {
            int m = (lo + hi) >>> 1;
            if (tails.get(m) < h) lo = m + 1; else hi = m;
        }
        if (lo == tails.size()) tails.add(h); else tails.set(lo, h);
    }
    return tails.size();
}
```

**Key points:**
- Descending tiebreak on `h` prevents two same-`w` envelopes from forming an "increasing" pair.
- LIS via patience sort runs in O(n log n).
- `tails[i]` is the smallest tail across all LIS of length `i+1`.

**Tags:** #algorithm

---

### 28. Longest Increasing Subsequence

**Difficulty:** Medium
**Topics:** dp, binary-search
**Position:** P5
**Years:** P5-P6

**Question:** Given an integer array, return the length of the longest strictly increasing subsequence.

**Approach:** Patience sorting: maintain `tails[]` where `tails[k]` is the smallest tail of an LIS of length `k+1`. For each num, binary search insert position. Length = len(tails). O(n log n).

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
    let l = 0, r = tails.length;
    while (l < r) {
      const m = (l + r) >> 1;
      if (tails[m] < x) l = m + 1; else r = m;
    }
    if (l === tails.length) tails.push(x);
    else tails[l] = x;
  }
  return tails.length;
}
```

**Java:**
```java
int lengthOfLIS(int[] nums) {
    List<Integer> tails = new ArrayList<>();
    for (int x : nums) {
        int lo = 0, hi = tails.size();
        while (lo < hi) {
            int m = (lo + hi) >>> 1;
            if (tails.get(m) < x) lo = m + 1; else hi = m;
        }
        if (lo == tails.size()) tails.add(x); else tails.set(lo, x);
    }
    return tails.size();
}
```

**Key points:**
- `tails` is not the LIS itself — just useful for measuring length.
- Use `bisect_left` for strictly increasing; `bisect_right` for non-decreasing.
- O(n^2) DP is acceptable when n is small.

**Tags:** #algorithm

---

### 29. Number of Longest Increasing Subsequence

**Difficulty:** Medium
**Topics:** dp
**Position:** P6
**Years:** P6-P7

**Question:** Given an integer array, return the number of longest strictly increasing subsequences.

**Approach:** Two DP arrays: `len[i]` = LIS length ending at i, `count[i]` = number of such LIS. For each `j < i` with `nums[j] < nums[i]`: if `len[j]+1 > len[i]` reset, if equal accumulate. O(n^2). Sum counts where `len[i] == maxLen`.

**Python:**
```python
def find_number_of_lis(nums: list[int]) -> int:
    n = len(nums)
    lens = [1] * n
    cnt = [1] * n
    for i in range(n):
        for j in range(i):
            if nums[j] < nums[i]:
                if lens[j] + 1 > lens[i]:
                    lens[i] = lens[j] + 1
                    cnt[i] = cnt[j]
                elif lens[j] + 1 == lens[i]:
                    cnt[i] += cnt[j]
    max_len = max(lens)
    return sum(c for l, c in zip(lens, cnt) if l == max_len)
```

**TypeScript:**
```typescript
function findNumberOfLIS(nums: number[]): number {
  const n = nums.length;
  const lens = new Array(n).fill(1);
  const cnt = new Array(n).fill(1);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) {
        if (lens[j] + 1 > lens[i]) { lens[i] = lens[j] + 1; cnt[i] = cnt[j]; }
        else if (lens[j] + 1 === lens[i]) cnt[i] += cnt[j];
      }
    }
  }
  const maxLen = Math.max(...lens);
  let total = 0;
  for (let i = 0; i < n; i++) if (lens[i] === maxLen) total += cnt[i];
  return total;
}
```

**Java:**
```java
int findNumberOfLIS(int[] nums) {
    int n = nums.length;
    int[] lens = new int[n], cnt = new int[n];
    Arrays.fill(lens, 1); Arrays.fill(cnt, 1);
    int maxLen = 1;
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < i; j++) {
            if (nums[j] < nums[i]) {
                if (lens[j] + 1 > lens[i]) { lens[i] = lens[j] + 1; cnt[i] = cnt[j]; }
                else if (lens[j] + 1 == lens[i]) cnt[i] += cnt[j];
            }
        }
        maxLen = Math.max(maxLen, lens[i]);
    }
    int total = 0;
    for (int i = 0; i < n; i++) if (lens[i] == maxLen) total += cnt[i];
    return total;
}
```

**Key points:**
- Reset count when a strictly longer chain is found.
- Accumulate counts when the chain length ties.
- O(n log n) using segment tree is possible but rarely needed.

**Tags:** #algorithm

---

### 30. Maximum Length of Pair Chain

**Difficulty:** Medium
**Topics:** greedy, dp, sorting
**Position:** P5
**Years:** P5-P6

**Question:** Given pairs `[a, b]` where `a < b`, a chain `(c, d)` follows `(a, b)` if `b < c`. Find the longest chain.

**Approach:** Greedy: sort by second element ascending. Iterate, picking next pair whose start > current end. O(n log n). Equivalent to interval scheduling.

**Python:**
```python
def find_longest_chain(pairs: list[list[int]]) -> int:
    pairs.sort(key=lambda p: p[1])
    end = float("-inf")
    count = 0
    for a, b in pairs:
        if a > end:
            count += 1
            end = b
    return count
```

**TypeScript:**
```typescript
function findLongestChain(pairs: number[][]): number {
  pairs.sort((p, q) => p[1] - q[1]);
  let end = -Infinity, count = 0;
  for (const [a, b] of pairs) {
    if (a > end) { count++; end = b; }
  }
  return count;
}
```

**Java:**
```java
int findLongestChain(int[][] pairs) {
    Arrays.sort(pairs, Comparator.comparingInt(p -> p[1]));
    int end = Integer.MIN_VALUE, count = 0;
    for (int[] p : pairs) {
        if (p[0] > end) { count++; end = p[1]; }
    }
    return count;
}
```

**Key points:**
- Sort by end picks the earliest-finishing options first.
- Equivalent to the classic activity-selection greedy.
- Strict `>` follows the problem's requirement that `b < c`.

**Tags:** #algorithm

---

### 31. Best Time to Buy and Sell Stock IV

**Difficulty:** Hard
**Topics:** dp, state-machine
**Position:** P6
**Years:** P6-P7

**Question:** Given prices and integer `k`, find max profit with at most `k` transactions.

**Approach:** If `k >= n/2`, reduces to unlimited transactions (sum positive deltas). Else DP: `buy[i][j]` and `sell[i][j]` for state after i days with j transactions. `buy[i][j] = max(buy[i-1][j], sell[i-1][j-1] - price)`; `sell[i][j] = max(sell[i-1][j], buy[i-1][j] + price)`. O(n*k).

**Python:**
```python
def max_profit(k: int, prices: list[int]) -> int:
    n = len(prices)
    if n < 2 or k == 0:
        return 0
    if k >= n // 2:
        return sum(max(0, prices[i] - prices[i - 1]) for i in range(1, n))
    buy = [float("-inf")] * (k + 1)
    sell = [0] * (k + 1)
    for p in prices:
        for j in range(1, k + 1):
            buy[j] = max(buy[j], sell[j - 1] - p)
            sell[j] = max(sell[j], buy[j] + p)
    return sell[k]
```

**TypeScript:**
```typescript
function maxProfit(k: number, prices: number[]): number {
  const n = prices.length;
  if (n < 2 || k === 0) return 0;
  if (k >= n >> 1) {
    let total = 0;
    for (let i = 1; i < n; i++) if (prices[i] > prices[i - 1]) total += prices[i] - prices[i - 1];
    return total;
  }
  const buy = new Array(k + 1).fill(-Infinity);
  const sell = new Array(k + 1).fill(0);
  for (const p of prices) {
    for (let j = 1; j <= k; j++) {
      buy[j] = Math.max(buy[j], sell[j - 1] - p);
      sell[j] = Math.max(sell[j], buy[j] + p);
    }
  }
  return sell[k];
}
```

**Java:**
```java
int maxProfit(int k, int[] prices) {
    int n = prices.length;
    if (n < 2 || k == 0) return 0;
    if (k >= n / 2) {
        int total = 0;
        for (int i = 1; i < n; i++) if (prices[i] > prices[i - 1]) total += prices[i] - prices[i - 1];
        return total;
    }
    int[] buy = new int[k + 1], sell = new int[k + 1];
    Arrays.fill(buy, Integer.MIN_VALUE);
    for (int p : prices) {
        for (int j = 1; j <= k; j++) {
            buy[j] = Math.max(buy[j], sell[j - 1] - p);
            sell[j] = Math.max(sell[j], buy[j] + p);
        }
    }
    return sell[k];
}
```

**Key points:**
- Large k collapses to greedy positive-delta sum.
- State arrays are 1D thanks to dependency ordering (process `j` low to high).
- A transaction = one buy + one sell; counted at buy or sell consistently.

**Tags:** #algorithm

---

### 32. Maximum Subarray

**Difficulty:** Medium
**Topics:** dp, divide-and-conquer
**Position:** P5
**Years:** P5

**Question:** Given an integer array, find the contiguous subarray with the largest sum.

**Approach:** Kadane's: `cur = max(num, cur + num)`, track global max. O(n) time, O(1) space. Divide-and-conquer alt: O(n log n) splitting and combining cross-midpoint sums.

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
int maxSubArray(int[] nums) {
    int cur = nums[0], best = nums[0];
    for (int i = 1; i < nums.length; i++) {
        cur = Math.max(nums[i], cur + nums[i]);
        best = Math.max(best, cur);
    }
    return best;
}
```

**Key points:**
- `cur` represents the best subarray ending at the current index.
- Resetting when `cur + x < x` discards a non-profitable prefix.
- Handles all-negative arrays by initializing with `nums[0]`.

**Tags:** #algorithm

---

### 33. Maximum Sum Circular Subarray

**Difficulty:** Medium
**Topics:** dp, kadane
**Position:** P6
**Years:** P6

**Question:** Given a circular integer array, find the maximum possible sum of a non-empty subarray.

**Approach:** Two cases: (1) max subarray is non-circular — standard Kadane. (2) circular — total - min subarray. Answer = max of both, with edge case: if all numbers negative, return max element. O(n).

**Python:**
```python
def max_subarray_sum_circular(nums: list[int]) -> int:
    total = 0
    cur_max = best_max = nums[0]
    cur_min = best_min = nums[0]
    for i, x in enumerate(nums):
        total += x
        if i == 0:
            continue
        cur_max = max(x, cur_max + x)
        best_max = max(best_max, cur_max)
        cur_min = min(x, cur_min + x)
        best_min = min(best_min, cur_min)
    if best_max < 0:
        return best_max
    return max(best_max, total - best_min)
```

**TypeScript:**
```typescript
function maxSubarraySumCircular(nums: number[]): number {
  let total = 0;
  let curMax = nums[0], bestMax = nums[0];
  let curMin = nums[0], bestMin = nums[0];
  for (let i = 0; i < nums.length; i++) {
    total += nums[i];
    if (i === 0) continue;
    curMax = Math.max(nums[i], curMax + nums[i]);
    bestMax = Math.max(bestMax, curMax);
    curMin = Math.min(nums[i], curMin + nums[i]);
    bestMin = Math.min(bestMin, curMin);
  }
  return bestMax < 0 ? bestMax : Math.max(bestMax, total - bestMin);
}
```

**Java:**
```java
int maxSubarraySumCircular(int[] nums) {
    int total = 0, curMax = nums[0], bestMax = nums[0], curMin = nums[0], bestMin = nums[0];
    for (int i = 0; i < nums.length; i++) {
        total += nums[i];
        if (i == 0) continue;
        curMax = Math.max(nums[i], curMax + nums[i]);
        bestMax = Math.max(bestMax, curMax);
        curMin = Math.min(nums[i], curMin + nums[i]);
        bestMin = Math.min(bestMin, curMin);
    }
    return bestMax < 0 ? bestMax : Math.max(bestMax, total - bestMin);
}
```

**Key points:**
- Circular maximum equals total minus the minimum subarray.
- All-negative input must return the single max element, not 0.
- Combines two Kadane passes in a single loop.

**Tags:** #algorithm

---

### 34. Decode Ways

**Difficulty:** Medium
**Topics:** dp, strings
**Position:** P5
**Years:** P5-P6

**Question:** A string of digits maps to letters via `1=A, 2=B, ..., 26=Z`. Count the number of ways to decode it.

**Approach:** 1D DP. `dp[i] = dp[i-1] (if s[i-1] != '0') + dp[i-2] (if "10" <= s[i-2..i-1] <= "26")`. Beware leading zeros and '0' that can't start a code. O(n) time, O(1) space.

**Python:**
```python
def num_decodings(s: str) -> int:
    if not s or s[0] == "0":
        return 0
    prev2, prev1 = 1, 1
    for i in range(1, len(s)):
        cur = 0
        if s[i] != "0":
            cur += prev1
        two = int(s[i - 1:i + 1])
        if 10 <= two <= 26:
            cur += prev2
        prev2, prev1 = prev1, cur
    return prev1
```

**TypeScript:**
```typescript
function numDecodings(s: string): number {
  if (!s || s[0] === "0") return 0;
  let prev2 = 1, prev1 = 1;
  for (let i = 1; i < s.length; i++) {
    let cur = 0;
    if (s[i] !== "0") cur += prev1;
    const two = parseInt(s.slice(i - 1, i + 1), 10);
    if (two >= 10 && two <= 26) cur += prev2;
    prev2 = prev1;
    prev1 = cur;
  }
  return prev1;
}
```

**Java:**
```java
int numDecodings(String s) {
    if (s.isEmpty() || s.charAt(0) == '0') return 0;
    int prev2 = 1, prev1 = 1;
    for (int i = 1; i < s.length(); i++) {
        int cur = 0;
        if (s.charAt(i) != '0') cur += prev1;
        int two = Integer.parseInt(s.substring(i - 1, i + 1));
        if (two >= 10 && two <= 26) cur += prev2;
        prev2 = prev1;
        prev1 = cur;
    }
    return prev1;
}
```

**Key points:**
- A leading '0' makes the whole string invalid.
- Two-digit codes must lie in [10, 26]; '06' is not valid.
- Rolling two variables yields O(1) space.

**Tags:** #algorithm

---

### 35. Unique Binary Search Trees

**Difficulty:** Medium
**Topics:** dp, catalan, tree
**Position:** P5
**Years:** P5-P6

**Question:** Given `n`, return the number of structurally unique BSTs storing values 1...n.

**Approach:** Catalan number. `G(n) = sum(G(i-1) * G(n-i))` for i in 1..n (each i as root). Closed form `C(2n,n)/(n+1)`. DP O(n^2) or formula O(n).

**Python:**
```python
def num_trees(n: int) -> int:
    g = [0] * (n + 1)
    g[0] = g[1] = 1
    for i in range(2, n + 1):
        for j in range(1, i + 1):
            g[i] += g[j - 1] * g[i - j]
    return g[n]
```

**TypeScript:**
```typescript
function numTrees(n: number): number {
  const g = new Array(n + 1).fill(0);
  g[0] = 1; if (n >= 1) g[1] = 1;
  for (let i = 2; i <= n; i++) {
    for (let j = 1; j <= i; j++) g[i] += g[j - 1] * g[i - j];
  }
  return g[n];
}
```

**Java:**
```java
int numTrees(int n) {
    int[] g = new int[n + 1];
    g[0] = 1;
    if (n >= 1) g[1] = 1;
    for (int i = 2; i <= n; i++) {
        for (int j = 1; j <= i; j++) g[i] += g[j - 1] * g[i - j];
    }
    return g[n];
}
```

**Key points:**
- Each value picked as the root splits into independent left/right subtrees.
- `g[i] = sum(g[j-1] * g[i-j])` is the Catalan recurrence.
- The closed-form Catalan number gives O(n) using multiplicative formula.

**Tags:** #algorithm

---

### 36. Regular Expression Matching

**Difficulty:** Hard
**Topics:** dp, strings, recursion
**Position:** P6
**Years:** P6-P7

**Question:** Implement regex matching for `.` (any char) and `*` (zero or more of preceding element).

**Approach:** DP `dp[i][j]`. If `p[j-1] == '*'`: `dp[i][j-2]` (zero) OR `dp[i-1][j] && (p[j-2]==s[i-1] || p[j-2]=='.')` (one or more). Else single-char match + `dp[i-1][j-1]`. O(m*n).

**Python:**
```python
def is_match(s: str, p: str) -> bool:
    m, n = len(s), len(p)
    dp = [[False] * (n + 1) for _ in range(m + 1)]
    dp[0][0] = True
    for j in range(2, n + 1):
        if p[j - 1] == "*":
            dp[0][j] = dp[0][j - 2]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if p[j - 1] == "*":
                dp[i][j] = dp[i][j - 2]
                if p[j - 2] == "." or p[j - 2] == s[i - 1]:
                    dp[i][j] = dp[i][j] or dp[i - 1][j]
            elif p[j - 1] == "." or p[j - 1] == s[i - 1]:
                dp[i][j] = dp[i - 1][j - 1]
    return dp[m][n]
```

**TypeScript:**
```typescript
function isMatch(s: string, p: string): boolean {
  const m = s.length, n = p.length;
  const dp: boolean[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(false));
  dp[0][0] = true;
  for (let j = 2; j <= n; j++) if (p[j - 1] === "*") dp[0][j] = dp[0][j - 2];
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (p[j - 1] === "*") {
        dp[i][j] = dp[i][j - 2];
        if (p[j - 2] === "." || p[j - 2] === s[i - 1]) dp[i][j] = dp[i][j] || dp[i - 1][j];
      } else if (p[j - 1] === "." || p[j - 1] === s[i - 1]) {
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
    for (int j = 2; j <= n; j++) if (p.charAt(j - 1) == '*') dp[0][j] = dp[0][j - 2];
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            char pc = p.charAt(j - 1);
            if (pc == '*') {
                dp[i][j] = dp[i][j - 2];
                char prev = p.charAt(j - 2);
                if (prev == '.' || prev == s.charAt(i - 1)) dp[i][j] |= dp[i - 1][j];
            } else if (pc == '.' || pc == s.charAt(i - 1)) {
                dp[i][j] = dp[i - 1][j - 1];
            }
        }
    }
    return dp[m][n];
}
```

**Key points:**
- `*` applies to the preceding element, not standalone.
- Zero-count branch (`dp[i][j-2]`) is checked first.
- '.' matches any single character but never consumes zero.

**Tags:** #algorithm

---

### 37. Palindrome Partitioning II

**Difficulty:** Hard
**Topics:** dp, strings
**Position:** P6
**Years:** P6-P7

**Question:** Given a string, return the minimum cuts needed for a palindrome partitioning.

**Approach:** Precompute `isPal[i][j]` via 2D DP (O(n^2)). Then `cuts[i]` = min cuts for `s[:i+1]`: if `s[j..i]` is palindrome, `cuts[i] = min(cuts[i], cuts[j-1]+1)`. O(n^2).

**Python:**
```python
def min_cut(s: str) -> int:
    n = len(s)
    is_pal = [[False] * n for _ in range(n)]
    for i in range(n - 1, -1, -1):
        for j in range(i, n):
            if s[i] == s[j] and (j - i < 2 or is_pal[i + 1][j - 1]):
                is_pal[i][j] = True
    cuts = list(range(n))
    for i in range(n):
        if is_pal[0][i]:
            cuts[i] = 0
            continue
        for j in range(1, i + 1):
            if is_pal[j][i]:
                cuts[i] = min(cuts[i], cuts[j - 1] + 1)
    return cuts[n - 1]
```

**TypeScript:**
```typescript
function minCut(s: string): number {
  const n = s.length;
  const isPal: boolean[][] = Array.from({ length: n }, () => new Array(n).fill(false));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = i; j < n; j++) {
      if (s[i] === s[j] && (j - i < 2 || isPal[i + 1][j - 1])) isPal[i][j] = true;
    }
  }
  const cuts = Array.from({ length: n }, (_, i) => i);
  for (let i = 0; i < n; i++) {
    if (isPal[0][i]) { cuts[i] = 0; continue; }
    for (let j = 1; j <= i; j++) {
      if (isPal[j][i]) cuts[i] = Math.min(cuts[i], cuts[j - 1] + 1);
    }
  }
  return cuts[n - 1];
}
```

**Java:**
```java
int minCut(String s) {
    int n = s.length();
    boolean[][] isPal = new boolean[n][n];
    for (int i = n - 1; i >= 0; i--) {
        for (int j = i; j < n; j++) {
            if (s.charAt(i) == s.charAt(j) && (j - i < 2 || isPal[i + 1][j - 1])) isPal[i][j] = true;
        }
    }
    int[] cuts = new int[n];
    for (int i = 0; i < n; i++) cuts[i] = i;
    for (int i = 0; i < n; i++) {
        if (isPal[0][i]) { cuts[i] = 0; continue; }
        for (int j = 1; j <= i; j++) {
            if (isPal[j][i]) cuts[i] = Math.min(cuts[i], cuts[j - 1] + 1);
        }
    }
    return cuts[n - 1];
}
```

**Key points:**
- Compute palindrome table bottom-up so inner dependency exists first.
- `cuts[i] = i` initially (worst case: cut every char).
- If the whole prefix is a palindrome, no cuts are needed.

**Tags:** #algorithm

---

### 38. Burst Balloons

**Difficulty:** Hard
**Topics:** dp, interval-dp
**Position:** P7
**Years:** P7

**Question:** Given an array of balloons with values, burst all to maximize coins. Bursting balloon i yields `nums[i-1] * nums[i] * nums[i+1]`; missing balloons treated as 1.

**Approach:** Interval DP. Add sentinels [1,...,1]. `dp[l][r]` = max coins from bursting balloons strictly between l and r. Iterate over last balloon `k` to burst: `dp[l][r] = max(dp[l][k] + dp[k][r] + nums[l]*nums[k]*nums[r])`. O(n^3).

**Python:**
```python
def max_coins(nums: list[int]) -> int:
    a = [1] + nums + [1]
    n = len(a)
    dp = [[0] * n for _ in range(n)]
    for length in range(2, n):
        for l in range(n - length):
            r = l + length
            for k in range(l + 1, r):
                cand = dp[l][k] + dp[k][r] + a[l] * a[k] * a[r]
                if cand > dp[l][r]:
                    dp[l][r] = cand
    return dp[0][n - 1]
```

**TypeScript:**
```typescript
function maxCoins(nums: number[]): number {
  const a = [1, ...nums, 1];
  const n = a.length;
  const dp: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let len = 2; len < n; len++) {
    for (let l = 0; l + len < n; l++) {
      const r = l + len;
      for (let k = l + 1; k < r; k++) {
        const cand = dp[l][k] + dp[k][r] + a[l] * a[k] * a[r];
        if (cand > dp[l][r]) dp[l][r] = cand;
      }
    }
  }
  return dp[0][n - 1];
}
```

**Java:**
```java
int maxCoins(int[] nums) {
    int n = nums.length;
    int[] a = new int[n + 2];
    a[0] = a[n + 1] = 1;
    System.arraycopy(nums, 0, a, 1, n);
    int N = n + 2;
    int[][] dp = new int[N][N];
    for (int len = 2; len < N; len++) {
        for (int l = 0; l + len < N; l++) {
            int r = l + len;
            for (int k = l + 1; k < r; k++) {
                int cand = dp[l][k] + dp[k][r] + a[l] * a[k] * a[r];
                if (cand > dp[l][r]) dp[l][r] = cand;
            }
        }
    }
    return dp[0][N - 1];
}
```

**Key points:**
- Think backwards: `k` is the LAST balloon to burst in the open interval `(l, r)`.
- Sentinels remove special-case handling at the ends.
- O(n^3) is standard; iterate by interval length.

**Tags:** #algorithm

---

### 39. Remove Boxes

**Difficulty:** Hard
**Topics:** dp, memoization
**Position:** P7
**Years:** P7-P8

**Question:** Given an array of colored boxes, each removal of `k` continuous same-color boxes gives `k*k` points. Maximize total.

**Approach:** 3D DP `dp[l][r][k]` where k is count of boxes equal to `boxes[l]` attached to the left. Either remove now: `(k+1)^2 + dp[l+1][r][0]`, or merge with later same-color: find `m` with `boxes[m]==boxes[l]`, `dp[l+1][m-1][0] + dp[m][r][k+1]`. O(n^4) with memo.

**Python:**
```python
from functools import lru_cache

def remove_boxes(boxes: list[int]) -> int:
    @lru_cache(maxsize=None)
    def go(l: int, r: int, k: int) -> int:
        if l > r:
            return 0
        ll, kk = l, k
        while ll + 1 <= r and boxes[ll + 1] == boxes[l]:
            ll += 1
            kk += 1
        best = (kk + 1) ** 2 + go(ll + 1, r, 0)
        for m in range(ll + 2, r + 1):
            if boxes[m] == boxes[l]:
                best = max(best, go(ll + 1, m - 1, 0) + go(m, r, kk + 1))
        return best
    return go(0, len(boxes) - 1, 0)
```

**TypeScript:**
```typescript
function removeBoxes(boxes: number[]): number {
  const n = boxes.length;
  const memo = new Map<string, number>();
  const go = (l: number, r: number, k: number): number => {
    if (l > r) return 0;
    let ll = l, kk = k;
    while (ll + 1 <= r && boxes[ll + 1] === boxes[l]) { ll++; kk++; }
    const key = `${ll},${r},${kk}`;
    if (memo.has(key)) return memo.get(key)!;
    let best = (kk + 1) * (kk + 1) + go(ll + 1, r, 0);
    for (let m = ll + 2; m <= r; m++) {
      if (boxes[m] === boxes[l]) {
        best = Math.max(best, go(ll + 1, m - 1, 0) + go(m, r, kk + 1));
      }
    }
    memo.set(key, best);
    return best;
  };
  return go(0, n - 1, 0);
}
```

**Java:**
```java
private int[] boxes;
private Map<Long, Integer> memo = new HashMap<>();

public int removeBoxes(int[] boxes) {
    this.boxes = boxes;
    return go(0, boxes.length - 1, 0);
}

private int go(int l, int r, int k) {
    if (l > r) return 0;
    int ll = l, kk = k;
    while (ll + 1 <= r && boxes[ll + 1] == boxes[l]) { ll++; kk++; }
    long key = ((long) ll * 200 + r) * 200 + kk;
    Integer cached = memo.get(key);
    if (cached != null) return cached;
    int best = (kk + 1) * (kk + 1) + go(ll + 1, r, 0);
    for (int m = ll + 2; m <= r; m++) {
        if (boxes[m] == boxes[l]) {
            best = Math.max(best, go(ll + 1, m - 1, 0) + go(m, r, kk + 1));
        }
    }
    memo.put(key, best);
    return best;
}
```

**Key points:**
- The extra `k` dimension tracks left-attached same-color count.
- Squeeze consecutive same-color boxes first to shrink the state space.
- Top-down memoization is simpler than bottom-up here.

**Tags:** #algorithm

---

### 40. Stone Game

**Difficulty:** Medium
**Topics:** dp, game-theory, minimax
**Position:** P6
**Years:** P6

**Question:** Two players alternately pick stones from either end of a row. Each wants to maximize their score. Return whether player 1 wins.

**Approach:** DP `dp[i][j]` = max score difference (current - opponent) for subarray. `dp[i][j] = max(piles[i] - dp[i+1][j], piles[j] - dp[i][j-1])`. Answer: `dp[0][n-1] > 0`. O(n^2). Trick: for even n with equal sum, player 1 always wins.

**Python:**
```python
def stone_game(piles: list[int]) -> bool:
    n = len(piles)
    dp = [row[:] for row in [[0] * n] * n]
    for i in range(n):
        dp[i][i] = piles[i]
    for length in range(2, n + 1):
        for i in range(n - length + 1):
            j = i + length - 1
            dp[i][j] = max(piles[i] - dp[i + 1][j], piles[j] - dp[i][j - 1])
    return dp[0][n - 1] > 0
```

**TypeScript:**
```typescript
function stoneGame(piles: number[]): boolean {
  const n = piles.length;
  const dp: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) dp[i][i] = piles[i];
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      dp[i][j] = Math.max(piles[i] - dp[i + 1][j], piles[j] - dp[i][j - 1]);
    }
  }
  return dp[0][n - 1] > 0;
}
```

**Java:**
```java
boolean stoneGame(int[] piles) {
    int n = piles.length;
    int[][] dp = new int[n][n];
    for (int i = 0; i < n; i++) dp[i][i] = piles[i];
    for (int len = 2; len <= n; len++) {
        for (int i = 0; i + len - 1 < n; i++) {
            int j = i + len - 1;
            dp[i][j] = Math.max(piles[i] - dp[i + 1][j], piles[j] - dp[i][j - 1]);
        }
    }
    return dp[0][n - 1] > 0;
}
```

**Key points:**
- `dp[i][j]` stores the score difference, not absolute totals.
- Fill by increasing interval length so smaller subproblems are ready.
- For LeetCode's exact variant the answer is always `true` — still implement the DP for variants.

**Tags:** #algorithm

---

### 41. Predict the Winner

**Difficulty:** Medium
**Topics:** dp, minimax, recursion
**Position:** P6
**Years:** P6

**Question:** Same as Stone Game but values can be anything; determine if player 1 can win or tie.

**Approach:** Minimax DP. `score(i, j) = max(nums[i] - score(i+1, j), nums[j] - score(i, j-1))`. Return `score(0, n-1) >= 0`. Memoize. O(n^2).

**Python:**
```python
def predict_the_winner(nums: list[int]) -> bool:
    n = len(nums)
    dp = [num for num in nums]
    for length in range(2, n + 1):
        new_dp = [0] * n
        for i in range(n - length + 1):
            j = i + length - 1
            new_dp[i] = max(nums[i] - dp[i + 1], nums[j] - dp[i])
        dp = new_dp  # type: ignore
    return dp[0] >= 0
```

**TypeScript:**
```typescript
function predictTheWinner(nums: number[]): boolean {
  const n = nums.length;
  let dp = nums.slice();
  for (let len = 2; len <= n; len++) {
    const next = new Array(n).fill(0);
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      next[i] = Math.max(nums[i] - dp[i + 1], nums[j] - dp[i]);
    }
    dp = next;
  }
  return dp[0] >= 0;
}
```

**Java:**
```java
boolean predictTheWinner(int[] nums) {
    int n = nums.length;
    int[] dp = Arrays.copyOf(nums, n);
    for (int len = 2; len <= n; len++) {
        int[] next = new int[n];
        for (int i = 0; i + len - 1 < n; i++) {
            int j = i + len - 1;
            next[i] = Math.max(nums[i] - dp[i + 1], nums[j] - dp[i]);
        }
        dp = next;
    }
    return dp[0] >= 0;
}
```

**Key points:**
- Score difference suffices — never track both players' totals.
- Tie counts as winning, so `>= 0`.
- Diagonal traversal compresses 2D DP to a rolling 1D array.

**Tags:** #algorithm

---

### 42. Network Delay Time

**Difficulty:** Medium
**Topics:** graph, dijkstra, shortest-path
**Position:** P5
**Years:** P5-P6

**Question:** Given a network of `n` nodes and directed weighted edges, find the time for a signal sent from node `k` to reach all nodes.

**Approach:** Dijkstra from `k` using min-heap. Track `dist[]`. Return max of all dists; if any unreachable, return -1. O((V+E) log V). Bellman-Ford alternative if negative weights, O(V*E).

**Python:**
```python
import heapq

def network_delay_time(times: list[list[int]], n: int, k: int) -> int:
    adj: list[list[tuple[int, int]]] = [[] for _ in range(n + 1)]
    for u, v, w in times:
        adj[u].append((v, w))
    dist = [float("inf")] * (n + 1)
    dist[k] = 0
    pq: list[tuple[int, int]] = [(0, k)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        for v, w in adj[u]:
            if d + w < dist[v]:
                dist[v] = d + w
                heapq.heappush(pq, (d + w, v))
    ans = max(dist[1:])
    return -1 if ans == float("inf") else int(ans)
```

**TypeScript:**
```typescript
function networkDelayTime(times: number[][], n: number, k: number): number {
  const adj: Array<Array<[number, number]>> = Array.from({ length: n + 1 }, () => []);
  for (const [u, v, w] of times) adj[u].push([v, w]);
  const dist = new Array(n + 1).fill(Infinity);
  dist[k] = 0;
  const pq: Array<[number, number]> = [[0, k]];
  while (pq.length) {
    pq.sort((a, b) => b[0] - a[0]);
    const [d, u] = pq.pop()!;
    if (d > dist[u]) continue;
    for (const [v, w] of adj[u]) {
      if (d + w < dist[v]) { dist[v] = d + w; pq.push([d + w, v]); }
    }
  }
  let ans = 0;
  for (let i = 1; i <= n; i++) ans = Math.max(ans, dist[i]);
  return ans === Infinity ? -1 : ans;
}
```

**Java:**
```java
int networkDelayTime(int[][] times, int n, int k) {
    List<List<int[]>> adj = new ArrayList<>();
    for (int i = 0; i <= n; i++) adj.add(new ArrayList<>());
    for (int[] t : times) adj.get(t[0]).add(new int[]{t[1], t[2]});
    int[] dist = new int[n + 1];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[k] = 0;
    PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a[0]));
    pq.offer(new int[]{0, k});
    while (!pq.isEmpty()) {
        int[] cur = pq.poll();
        int d = cur[0], u = cur[1];
        if (d > dist[u]) continue;
        for (int[] e : adj.get(u)) {
            int nd = d + e[1];
            if (nd < dist[e[0]]) { dist[e[0]] = nd; pq.offer(new int[]{nd, e[0]}); }
        }
    }
    int ans = 0;
    for (int i = 1; i <= n; i++) {
        if (dist[i] == Integer.MAX_VALUE) return -1;
        ans = Math.max(ans, dist[i]);
    }
    return ans;
}
```

**Key points:**
- Skip stale entries by comparing popped distance with `dist[u]`.
- Final answer is the maximum of all shortest-path distances.
- For negative weights use Bellman-Ford or SPFA, not Dijkstra.

**Tags:** #algorithm

---

### 43. Cheapest Flights Within K Stops

**Difficulty:** Medium
**Topics:** graph, dp, bellman-ford
**Position:** P6
**Years:** P6-P7

**Question:** Given flights `[from, to, price]`, find the cheapest path from `src` to `dst` with at most `k` stops.

**Approach:** Bellman-Ford style: iterate k+1 times, relax using prev iteration's distances (use snapshot to enforce edge count). O(k*E). Modified Dijkstra with (cost, node, stops) also works but trickier with revisits.

**Python:**
```python
def find_cheapest_price(n: int, flights: list[list[int]], src: int, dst: int, k: int) -> int:
    dist = [float("inf")] * n
    dist[src] = 0
    for _ in range(k + 1):
        snap = dist[:]
        for u, v, w in flights:
            if snap[u] + w < dist[v]:
                dist[v] = snap[u] + w
    return -1 if dist[dst] == float("inf") else int(dist[dst])
```

**TypeScript:**
```typescript
function findCheapestPrice(n: number, flights: number[][], src: number, dst: number, k: number): number {
  let dist = new Array(n).fill(Infinity);
  dist[src] = 0;
  for (let i = 0; i <= k; i++) {
    const snap = dist.slice();
    for (const [u, v, w] of flights) {
      if (snap[u] + w < dist[v]) dist[v] = snap[u] + w;
    }
  }
  return dist[dst] === Infinity ? -1 : dist[dst];
}
```

**Java:**
```java
int findCheapestPrice(int n, int[][] flights, int src, int dst, int k) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;
    for (int i = 0; i <= k; i++) {
        int[] snap = dist.clone();
        for (int[] f : flights) {
            if (snap[f[0]] == Integer.MAX_VALUE) continue;
            int nd = snap[f[0]] + f[2];
            if (nd < dist[f[1]]) dist[f[1]] = nd;
        }
    }
    return dist[dst] == Integer.MAX_VALUE ? -1 : dist[dst];
}
```

**Key points:**
- Snapshot prevents using more than one new edge per iteration.
- k stops = k+1 edges, so loop k+1 times.
- Heap-based variants can revisit nodes with different stop counts.

**Tags:** #algorithm

---

### 44. Path with Minimum Effort

**Difficulty:** Medium
**Topics:** graph, dijkstra, binary-search, union-find
**Position:** P6
**Years:** P6-P7

**Question:** Given a 2D height grid, find a path from top-left to bottom-right minimizing the maximum absolute height difference between consecutive cells.

**Approach:** Modified Dijkstra: distance is max edge on path (minimax). Priority queue on max-effort-so-far. O(mn log(mn)). Alternative: binary search on effort threshold + BFS/DFS, or Union-Find sorted by edge weight (Kruskal-like).

**Python:**
```python
import heapq

def minimum_effort_path(heights: list[list[int]]) -> int:
    m, n = len(heights), len(heights[0])
    effort = [[float("inf")] * n for _ in range(m)]
    effort[0][0] = 0
    pq: list[tuple[int, int, int]] = [(0, 0, 0)]
    dirs = [(-1, 0), (1, 0), (0, -1), (0, 1)]
    while pq:
        e, r, c = heapq.heappop(pq)
        if r == m - 1 and c == n - 1:
            return e
        if e > effort[r][c]:
            continue
        for dr, dc in dirs:
            nr, nc = r + dr, c + dc
            if 0 <= nr < m and 0 <= nc < n:
                ne = max(e, abs(heights[nr][nc] - heights[r][c]))
                if ne < effort[nr][nc]:
                    effort[nr][nc] = ne
                    heapq.heappush(pq, (ne, nr, nc))
    return 0
```

**TypeScript:**
```typescript
function minimumEffortPath(heights: number[][]): number {
  const m = heights.length, n = heights[0].length;
  const effort: number[][] = Array.from({ length: m }, () => new Array(n).fill(Infinity));
  effort[0][0] = 0;
  const pq: Array<[number, number, number]> = [[0, 0, 0]];
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  while (pq.length) {
    pq.sort((a, b) => b[0] - a[0]);
    const [e, r, c] = pq.pop()!;
    if (r === m - 1 && c === n - 1) return e;
    if (e > effort[r][c]) continue;
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= m || nc >= n) continue;
      const ne = Math.max(e, Math.abs(heights[nr][nc] - heights[r][c]));
      if (ne < effort[nr][nc]) { effort[nr][nc] = ne; pq.push([ne, nr, nc]); }
    }
  }
  return 0;
}
```

**Java:**
```java
int minimumEffortPath(int[][] heights) {
    int m = heights.length, n = heights[0].length;
    int[][] effort = new int[m][n];
    for (int[] row : effort) Arrays.fill(row, Integer.MAX_VALUE);
    effort[0][0] = 0;
    int[][] dirs = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};
    PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a[0]));
    pq.offer(new int[]{0, 0, 0});
    while (!pq.isEmpty()) {
        int[] cur = pq.poll();
        int e = cur[0], r = cur[1], c = cur[2];
        if (r == m - 1 && c == n - 1) return e;
        if (e > effort[r][c]) continue;
        for (int[] d : dirs) {
            int nr = r + d[0], nc = c + d[1];
            if (nr < 0 || nc < 0 || nr >= m || nc >= n) continue;
            int ne = Math.max(e, Math.abs(heights[nr][nc] - heights[r][c]));
            if (ne < effort[nr][nc]) { effort[nr][nc] = ne; pq.offer(new int[]{ne, nr, nc}); }
        }
    }
    return 0;
}
```

**Key points:**
- Path cost is `max` of edges, not `sum` — keep that in the relaxation.
- Early return when popping the target node is correct in Dijkstra.
- Binary search + BFS is another clean approach.

**Tags:** #algorithm

---

### 45. Minimum Cost to Make at Least One Valid Path in a Grid

**Difficulty:** Hard
**Topics:** graph, 0-1-bfs, dijkstra
**Position:** P7
**Years:** P7

**Question:** Grid cells have directional signs. Moving in the sign's direction costs 0; otherwise costs 1 to change. Find min cost from (0,0) to (m-1,n-1).

**Approach:** 0-1 BFS using deque. Push 0-cost moves to front, 1-cost moves to back. O(m*n). Equivalent to Dijkstra on a graph with edge weights in {0,1}.

**Python:**
```python
from collections import deque

def min_cost(grid: list[list[int]]) -> int:
    m, n = len(grid), len(grid[0])
    dirs = [(0, 1), (0, -1), (1, 0), (-1, 0)]  # 1,2,3,4 -> right,left,down,up
    INF = float("inf")
    dist = [[INF] * n for _ in range(m)]
    dist[0][0] = 0
    dq: deque[tuple[int, int]] = deque([(0, 0)])
    while dq:
        r, c = dq.popleft()
        for i, (dr, dc) in enumerate(dirs, start=1):
            nr, nc = r + dr, c + dc
            if 0 <= nr < m and 0 <= nc < n:
                w = 0 if grid[r][c] == i else 1
                if dist[r][c] + w < dist[nr][nc]:
                    dist[nr][nc] = dist[r][c] + w
                    if w == 0:
                        dq.appendleft((nr, nc))
                    else:
                        dq.append((nr, nc))
    return int(dist[m - 1][n - 1])
```

**TypeScript:**
```typescript
function minCost(grid: number[][]): number {
  const m = grid.length, n = grid[0].length;
  const dirs: Array<[number, number]> = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  const dist: number[][] = Array.from({ length: m }, () => new Array(n).fill(Infinity));
  dist[0][0] = 0;
  const dq: Array<[number, number]> = [[0, 0]];
  while (dq.length) {
    const [r, c] = dq.shift()!;
    for (let i = 0; i < 4; i++) {
      const [dr, dc] = dirs[i];
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= m || nc >= n) continue;
      const w = grid[r][c] === i + 1 ? 0 : 1;
      if (dist[r][c] + w < dist[nr][nc]) {
        dist[nr][nc] = dist[r][c] + w;
        if (w === 0) dq.unshift([nr, nc]); else dq.push([nr, nc]);
      }
    }
  }
  return dist[m - 1][n - 1];
}
```

**Java:**
```java
int minCost(int[][] grid) {
    int m = grid.length, n = grid[0].length;
    int[][] dirs = {{0, 1}, {0, -1}, {1, 0}, {-1, 0}};
    int[][] dist = new int[m][n];
    for (int[] row : dist) Arrays.fill(row, Integer.MAX_VALUE);
    dist[0][0] = 0;
    Deque<int[]> dq = new ArrayDeque<>();
    dq.offer(new int[]{0, 0});
    while (!dq.isEmpty()) {
        int[] cur = dq.poll();
        int r = cur[0], c = cur[1];
        for (int i = 0; i < 4; i++) {
            int nr = r + dirs[i][0], nc = c + dirs[i][1];
            if (nr < 0 || nc < 0 || nr >= m || nc >= n) continue;
            int w = grid[r][c] == i + 1 ? 0 : 1;
            if (dist[r][c] + w < dist[nr][nc]) {
                dist[nr][nc] = dist[r][c] + w;
                if (w == 0) dq.offerFirst(new int[]{nr, nc}); else dq.offerLast(new int[]{nr, nc});
            }
        }
    }
    return dist[m - 1][n - 1];
}
```

**Key points:**
- 0-1 BFS uses a deque to keep nodes in non-decreasing distance order.
- Direction encoding (1..4) must match `dirs` order exactly.
- Equivalent to Dijkstra restricted to {0, 1} edge weights with simpler queue.

**Tags:** #algorithm

---

### 46. Find the City With the Smallest Number of Neighbors at a Threshold Distance

**Difficulty:** Medium
**Topics:** graph, floyd-warshall, shortest-path
**Position:** P6
**Years:** P6

**Question:** Given `n` cities and weighted edges, find the city with fewest reachable cities within `distanceThreshold`. Tie-break by highest index.

**Approach:** Floyd-Warshall all-pairs shortest paths O(n^3). For each city count neighbors with `dist <= threshold`. Return city with min count, prefer larger index. For sparse graphs, n times Dijkstra is O(n*(V+E)logV).

**Python:**
```python
def find_the_city(n: int, edges: list[list[int]], distance_threshold: int) -> int:
    INF = float("inf")
    dist = [[INF] * n for _ in range(n)]
    for i in range(n):
        dist[i][i] = 0
    for u, v, w in edges:
        dist[u][v] = dist[v][u] = w
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if dist[i][k] + dist[k][j] < dist[i][j]:
                    dist[i][j] = dist[i][k] + dist[k][j]
    best_city, best_cnt = -1, n + 1
    for i in range(n):
        cnt = sum(1 for j in range(n) if i != j and dist[i][j] <= distance_threshold)
        if cnt <= best_cnt:
            best_cnt, best_city = cnt, i
    return best_city
```

**TypeScript:**
```typescript
function findTheCity(n: number, edges: number[][], distanceThreshold: number): number {
  const INF = Number.POSITIVE_INFINITY;
  const dist: number[][] = Array.from({ length: n }, () => new Array(n).fill(INF));
  for (let i = 0; i < n; i++) dist[i][i] = 0;
  for (const [u, v, w] of edges) { dist[u][v] = w; dist[v][u] = w; }
  for (let k = 0; k < n; k++)
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++)
        if (dist[i][k] + dist[k][j] < dist[i][j]) dist[i][j] = dist[i][k] + dist[k][j];
  let bestCity = -1, bestCnt = n + 1;
  for (let i = 0; i < n; i++) {
    let cnt = 0;
    for (let j = 0; j < n; j++) if (i !== j && dist[i][j] <= distanceThreshold) cnt++;
    if (cnt <= bestCnt) { bestCnt = cnt; bestCity = i; }
  }
  return bestCity;
}
```

**Java:**
```java
int findTheCity(int n, int[][] edges, int distanceThreshold) {
    final int INF = 1_000_000_000;
    int[][] dist = new int[n][n];
    for (int[] row : dist) Arrays.fill(row, INF);
    for (int i = 0; i < n; i++) dist[i][i] = 0;
    for (int[] e : edges) { dist[e[0]][e[1]] = e[2]; dist[e[1]][e[0]] = e[2]; }
    for (int k = 0; k < n; k++)
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                if (dist[i][k] + dist[k][j] < dist[i][j]) dist[i][j] = dist[i][k] + dist[k][j];
    int bestCity = -1, bestCnt = n + 1;
    for (int i = 0; i < n; i++) {
        int cnt = 0;
        for (int j = 0; j < n; j++) if (i != j && dist[i][j] <= distanceThreshold) cnt++;
        if (cnt <= bestCnt) { bestCnt = cnt; bestCity = i; }
    }
    return bestCity;
}
```

**Key points:**
- Floyd-Warshall iterates `k` outermost for correctness.
- `<=` in tie-break picks the largest index naturally (last write wins).
- Sparse graphs prefer n Dijkstras for better asymptotics.

**Tags:** #algorithm

---

### 47. Reconstruct Itinerary

**Difficulty:** Hard
**Topics:** graph, euler-path, dfs, hierholzer
**Position:** P6
**Years:** P6-P7

**Question:** Given airline tickets `[from, to]`, reconstruct the itinerary starting from JFK that uses all tickets exactly once. Return lexicographically smallest.

**Approach:** Hierholzer's algorithm for Eulerian path. Sort destinations per source (use min-heap). DFS, post-order append node to result; reverse at end. O(E log E).

**Python:**
```python
import heapq
from collections import defaultdict

def find_itinerary(tickets: list[list[str]]) -> list[str]:
    adj: dict[str, list[str]] = defaultdict(list)
    for a, b in tickets:
        heapq.heappush(adj[a], b)
    route: list[str] = []
    def dfs(u: str) -> None:
        while adj[u]:
            dfs(heapq.heappop(adj[u]))
        route.append(u)
    dfs("JFK")
    return route[::-1]
```

**TypeScript:**
```typescript
function findItinerary(tickets: string[][]): string[] {
  const adj = new Map<string, string[]>();
  for (const [a, b] of tickets) {
    if (!adj.has(a)) adj.set(a, []);
    adj.get(a)!.push(b);
  }
  for (const arr of adj.values()) arr.sort().reverse();  // pop = smallest
  const route: string[] = [];
  const dfs = (u: string): void => {
    const stack = adj.get(u);
    while (stack && stack.length) dfs(stack.pop()!);
    route.push(u);
  };
  dfs("JFK");
  return route.reverse();
}
```

**Java:**
```java
List<String> findItinerary(List<List<String>> tickets) {
    Map<String, PriorityQueue<String>> adj = new HashMap<>();
    for (var t : tickets) adj.computeIfAbsent(t.get(0), k -> new PriorityQueue<>()).offer(t.get(1));
    LinkedList<String> route = new LinkedList<>();
    Deque<String> stack = new ArrayDeque<>();
    stack.push("JFK");
    while (!stack.isEmpty()) {
        String u = stack.peek();
        PriorityQueue<String> nexts = adj.get(u);
        if (nexts != null && !nexts.isEmpty()) stack.push(nexts.poll());
        else route.addFirst(stack.pop());
    }
    return route;
}
```

**Key points:**
- Post-order append builds the route in reverse for free.
- Always consume the lexicographically smallest edge first.
- Hierholzer guarantees a valid Eulerian path when one exists.

**Tags:** #algorithm

---

### 48. Word Ladder II

**Difficulty:** Hard
**Topics:** graph, bfs, backtracking
**Position:** P7
**Years:** P7

**Question:** Given begin word, end word, and word list, find all shortest transformation sequences from begin to end where each adjacent pair differs by one letter.

**Approach:** Two-phase: (1) BFS layer-by-layer to build parent graph, stop at first layer containing end word. (2) DFS backtrack from end to begin via parents to enumerate paths. Use word patterns (e.g., `h*t`) bucket to find neighbors efficiently.

**Python:**
```python
from collections import defaultdict, deque

def find_ladders(begin: str, end: str, word_list: list[str]) -> list[list[str]]:
    words = set(word_list)
    if end not in words:
        return []
    parents: dict[str, list[str]] = defaultdict(list)
    layer = {begin}
    found = False
    while layer and not found:
        next_layer: set[str] = set()
        for w in layer:
            for i in range(len(w)):
                for c in "abcdefghijklmnopqrstuvwxyz":
                    nxt = w[:i] + c + w[i + 1:]
                    if nxt in words and nxt not in layer:
                        if nxt == end:
                            found = True
                        next_layer.add(nxt)
                        parents[nxt].append(w)
        words -= next_layer
        layer = next_layer
    res: list[list[str]] = []
    def backtrack(w: str, path: list[str]) -> None:
        if w == begin:
            res.append([begin] + path[::-1])
            return
        for p in parents[w]:
            backtrack(p, path + [w])
    if found:
        backtrack(end, [])
    return res
```

**TypeScript:**
```typescript
function findLadders(begin: string, end: string, wordList: string[]): string[][] {
  const words = new Set(wordList);
  if (!words.has(end)) return [];
  const parents = new Map<string, string[]>();
  let layer = new Set([begin]);
  let found = false;
  while (layer.size && !found) {
    const next = new Set<string>();
    for (const w of layer) {
      for (let i = 0; i < w.length; i++) {
        for (let c = 97; c < 123; c++) {
          const nxt = w.slice(0, i) + String.fromCharCode(c) + w.slice(i + 1);
          if (words.has(nxt) && !layer.has(nxt)) {
            if (nxt === end) found = true;
            next.add(nxt);
            if (!parents.has(nxt)) parents.set(nxt, []);
            parents.get(nxt)!.push(w);
          }
        }
      }
    }
    for (const w of next) words.delete(w);
    layer = next;
  }
  const res: string[][] = [];
  const backtrack = (w: string, path: string[]): void => {
    if (w === begin) { res.push([begin, ...path.slice().reverse()]); return; }
    for (const p of parents.get(w) ?? []) backtrack(p, [...path, w]);
  };
  if (found) backtrack(end, []);
  return res;
}
```

**Java:**
```java
List<List<String>> findLadders(String begin, String end, List<String> wordList) {
    Set<String> words = new HashSet<>(wordList);
    List<List<String>> res = new ArrayList<>();
    if (!words.contains(end)) return res;
    Map<String, List<String>> parents = new HashMap<>();
    Set<String> layer = new HashSet<>(Set.of(begin));
    boolean found = false;
    while (!layer.isEmpty() && !found) {
        Set<String> next = new HashSet<>();
        for (String w : layer) {
            char[] ch = w.toCharArray();
            for (int i = 0; i < ch.length; i++) {
                char orig = ch[i];
                for (char c = 'a'; c <= 'z'; c++) {
                    ch[i] = c;
                    String nxt = new String(ch);
                    if (words.contains(nxt) && !layer.contains(nxt)) {
                        if (nxt.equals(end)) found = true;
                        next.add(nxt);
                        parents.computeIfAbsent(nxt, k -> new ArrayList<>()).add(w);
                    }
                }
                ch[i] = orig;
            }
        }
        words.removeAll(next);
        layer = next;
    }
    if (found) backtrack(end, begin, parents, new LinkedList<>(), res);
    return res;
}

private void backtrack(String w, String begin, Map<String, List<String>> parents,
                       LinkedList<String> path, List<List<String>> res) {
    path.addFirst(w);
    if (w.equals(begin)) { res.add(new ArrayList<>(path)); }
    else for (String p : parents.getOrDefault(w, List.of())) backtrack(p, begin, parents, path, res);
    path.removeFirst();
}
```

**Key points:**
- BFS finds shortest length; DFS enumerates all paths via the parent graph.
- Remove visited words layer-by-layer, not word-by-word, to keep parallel branches alive.
- Stop BFS as soon as `end` is found in a layer.

**Complexity:** O(N · L²) for BFS over N words of length L (each neighbor probe costs O(L)); backtracking then adds time proportional to the number of shortest paths emitted.

**Tags:** #algorithm

---

### 49. Surrounded Regions

**Difficulty:** Medium
**Topics:** graph, dfs, bfs, union-find
**Position:** P5
**Years:** P5-P6

**Question:** Given a 2D board of 'X' and 'O', capture all regions of 'O' that are 4-directionally surrounded by 'X' (flip them to 'X').

**Approach:** Border-first: DFS/BFS from every 'O' on the border, mark connected 'O's as safe (e.g., '#'). Then sweep: remaining 'O' → 'X', '#' → 'O'. O(m*n). Union-Find with virtual border node also works.

**Python:**
```python
def solve(board: list[list[str]]) -> None:
    if not board or not board[0]:
        return
    m, n = len(board), len(board[0])
    stack: list[tuple[int, int]] = []
    for i in range(m):
        for j in (0, n - 1):
            if board[i][j] == "O":
                stack.append((i, j))
    for j in range(n):
        for i in (0, m - 1):
            if board[i][j] == "O":
                stack.append((i, j))
    while stack:
        r, c = stack.pop()
        if 0 <= r < m and 0 <= c < n and board[r][c] == "O":
            board[r][c] = "#"
            stack.extend([(r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)])
    for i in range(m):
        for j in range(n):
            board[i][j] = "O" if board[i][j] == "#" else "X"
```

**TypeScript:**
```typescript
function solve(board: string[][]): void {
  if (!board.length || !board[0].length) return;
  const m = board.length, n = board[0].length;
  const stack: Array<[number, number]> = [];
  for (let i = 0; i < m; i++) {
    if (board[i][0] === "O") stack.push([i, 0]);
    if (board[i][n - 1] === "O") stack.push([i, n - 1]);
  }
  for (let j = 0; j < n; j++) {
    if (board[0][j] === "O") stack.push([0, j]);
    if (board[m - 1][j] === "O") stack.push([m - 1, j]);
  }
  while (stack.length) {
    const [r, c] = stack.pop()!;
    if (r < 0 || c < 0 || r >= m || c >= n || board[r][c] !== "O") continue;
    board[r][c] = "#";
    stack.push([r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]);
  }
  for (let i = 0; i < m; i++)
    for (let j = 0; j < n; j++)
      board[i][j] = board[i][j] === "#" ? "O" : "X";
}
```

**Java:**
```java
void solve(char[][] board) {
    if (board.length == 0 || board[0].length == 0) return;
    int m = board.length, n = board[0].length;
    Deque<int[]> stack = new ArrayDeque<>();
    for (int i = 0; i < m; i++) {
        if (board[i][0] == 'O') stack.push(new int[]{i, 0});
        if (board[i][n - 1] == 'O') stack.push(new int[]{i, n - 1});
    }
    for (int j = 0; j < n; j++) {
        if (board[0][j] == 'O') stack.push(new int[]{0, j});
        if (board[m - 1][j] == 'O') stack.push(new int[]{m - 1, j});
    }
    while (!stack.isEmpty()) {
        int[] cur = stack.pop();
        int r = cur[0], c = cur[1];
        if (r < 0 || c < 0 || r >= m || c >= n || board[r][c] != 'O') continue;
        board[r][c] = '#';
        stack.push(new int[]{r + 1, c}); stack.push(new int[]{r - 1, c});
        stack.push(new int[]{r, c + 1}); stack.push(new int[]{r, c - 1});
    }
    for (int i = 0; i < m; i++)
        for (int j = 0; j < n; j++)
            board[i][j] = board[i][j] == '#' ? 'O' : 'X';
}
```

**Key points:**
- Only border-connected 'O's survive.
- Use a sentinel char during DFS to mark safety, then swap at the end.
- Iterative stack avoids deep recursion on large grids.

**Tags:** #algorithm

---

### 50. Number of Islands II

**Difficulty:** Hard
**Topics:** union-find, graph
**Position:** P6
**Years:** P6-P7

**Question:** Given an `m x n` grid initially all water, process a list of land additions. After each, return current island count.

**Approach:** Union-Find with path compression + union by rank. On each addition, increment count; for each neighboring land, union and decrement count if a new merge occurs. O(k * alpha(mn)) for k operations.

**Python:**
```python
def num_islands2(m: int, n: int, positions: list[list[int]]) -> list[int]:
    parent = [-1] * (m * n)
    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    res: list[int] = []
    count = 0
    for r, c in positions:
        idx = r * n + c
        if parent[idx] != -1:
            res.append(count)
            continue
        parent[idx] = idx
        count += 1
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            ni = nr * n + nc
            if 0 <= nr < m and 0 <= nc < n and parent[ni] != -1:
                a, b = find(idx), find(ni)
                if a != b:
                    parent[a] = b
                    count -= 1
        res.append(count)
    return res
```

**TypeScript:**
```typescript
function numIslands2(m: number, n: number, positions: number[][]): number[] {
  const parent = new Array(m * n).fill(-1);
  const find = (x: number): number => {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  };
  const res: number[] = [];
  let count = 0;
  for (const [r, c] of positions) {
    const idx = r * n + c;
    if (parent[idx] !== -1) { res.push(count); continue; }
    parent[idx] = idx;
    count++;
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr, nc = c + dc, ni = nr * n + nc;
      if (nr < 0 || nc < 0 || nr >= m || nc >= n || parent[ni] === -1) continue;
      const a = find(idx), b = find(ni);
      if (a !== b) { parent[a] = b; count--; }
    }
    res.push(count);
  }
  return res;
}
```

**Java:**
```java
int[] parent;

private int find(int x) {
    while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
}

public List<Integer> numIslands2(int m, int n, int[][] positions) {
    parent = new int[m * n];
    Arrays.fill(parent, -1);
    int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    List<Integer> res = new ArrayList<>();
    int count = 0;
    for (int[] pos : positions) {
        int r = pos[0], c = pos[1], idx = r * n + c;
        if (parent[idx] != -1) { res.add(count); continue; }
        parent[idx] = idx;
        count++;
        for (int[] d : dirs) {
            int nr = r + d[0], nc = c + d[1], ni = nr * n + nc;
            if (nr < 0 || nc < 0 || nr >= m || nc >= n || parent[ni] == -1) continue;
            int a = find(idx), b = find(ni);
            if (a != b) { parent[a] = b; count--; }
        }
        res.add(count);
    }
    return res;
}
```

**Key points:**
- Initialize parent to -1 so we can distinguish water from land.
- Increment count when adding new land; decrement only on successful merge.
- Path compression makes `find` near-O(1) amortized.

**Tags:** #algorithm

---

### 51. Accounts Merge

**Difficulty:** Medium
**Topics:** union-find, graph, dfs
**Position:** P6
**Years:** P6-P7

**Question:** Given a list of accounts (name + emails), merge those sharing any email. Output sorted emails per account.

**Approach:** Union-Find on email strings: map email → index, union all emails within same account. Group by root, sort each group, prepend name. O(n*k*alpha(n*k)) plus sort cost.

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
    while (parent.get(x) !== x) { parent.set(x, parent.get(parent.get(x)!)!); x = parent.get(x)!; }
    return x;
  };
  for (const acc of accounts) {
    const name = acc[0];
    for (let i = 1; i < acc.length; i++) {
      if (!parent.has(acc[i])) parent.set(acc[i], acc[i]);
      owner.set(acc[i], name);
      parent.set(find(acc[i]), find(acc[1]));
    }
  }
  const groups = new Map<string, string[]>();
  for (const email of parent.keys()) {
    const root = find(email);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(email);
  }
  return Array.from(groups.entries()).map(([root, emails]) => [owner.get(root)!, ...emails.sort()]);
}
```

**Java:**
```java
Map<String, String> parent = new HashMap<>();
Map<String, String> owner = new HashMap<>();

private String find(String x) {
    while (!parent.get(x).equals(x)) { parent.put(x, parent.get(parent.get(x))); x = parent.get(x); }
    return x;
}

public List<List<String>> accountsMerge(List<List<String>> accounts) {
    for (var acc : accounts) {
        String name = acc.get(0);
        for (int i = 1; i < acc.size(); i++) {
            parent.putIfAbsent(acc.get(i), acc.get(i));
            owner.put(acc.get(i), name);
            parent.put(find(acc.get(i)), find(acc.get(1)));
        }
    }
    Map<String, List<String>> groups = new HashMap<>();
    for (String email : parent.keySet()) groups.computeIfAbsent(find(email), k -> new ArrayList<>()).add(email);
    List<List<String>> res = new ArrayList<>();
    for (var entry : groups.entrySet()) {
        List<String> emails = entry.getValue();
        Collections.sort(emails);
        emails.add(0, owner.get(entry.getKey()));
        res.add(emails);
    }
    return res;
}
```

**Key points:**
- Treat emails (strings) as union-find nodes directly.
- Owner map is keyed by email since the same email implies the same person.
- Group by root, then sort each group's emails before output.

**Tags:** #algorithm

---

### 52. Most Stones Removed with Same Row or Column

**Difficulty:** Medium
**Topics:** union-find, graph
**Position:** P6
**Years:** P6

**Question:** Stones on a 2D plane. A stone can be removed if it shares row or column with another. Return max removable.

**Approach:** Union-Find: union stones sharing row or column (or treat row r as `~r` to namespace rows vs columns). Answer = n - number of connected components. O(n*alpha(n)).

**Python:**
```python
def remove_stones(stones: list[list[int]]) -> int:
    parent: dict[int, int] = {}
    def find(x: int) -> int:
        parent.setdefault(x, x)
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    def union(a: int, b: int) -> None:
        parent[find(a)] = find(b)
    for r, c in stones:
        union(r, ~c)  # ~c namespaces columns away from rows
    roots = {find(r) for r, _ in stones}
    return len(stones) - len(roots)
```

**TypeScript:**
```typescript
function removeStones(stones: number[][]): number {
  const parent = new Map<number, number>();
  const find = (x: number): number => {
    if (!parent.has(x)) parent.set(x, x);
    while (parent.get(x) !== x) { parent.set(x, parent.get(parent.get(x)!)!); x = parent.get(x)!; }
    return x;
  };
  const union = (a: number, b: number): void => { parent.set(find(a), find(b)); };
  for (const [r, c] of stones) union(r, ~c);
  const roots = new Set<number>();
  for (const [r] of stones) roots.add(find(r));
  return stones.length - roots.size;
}
```

**Java:**
```java
Map<Integer, Integer> parent = new HashMap<>();

private int find(int x) {
    parent.putIfAbsent(x, x);
    while (parent.get(x) != x) { parent.put(x, parent.get(parent.get(x))); x = parent.get(x); }
    return x;
}

public int removeStones(int[][] stones) {
    for (int[] s : stones) parent.put(find(s[0]), find(~s[1]));
    Set<Integer> roots = new HashSet<>();
    for (int[] s : stones) roots.add(find(s[0]));
    return stones.length - roots.size();
}
```

**Key points:**
- Each connected component leaves exactly one stone behind.
- `~c` (bitwise NOT) keeps column ids disjoint from row ids.
- Use only rows when counting components — column-only stones are still touched.

**Tags:** #algorithm

---

### 53. Redundant Connection

**Difficulty:** Medium
**Topics:** union-find, graph
**Position:** P5
**Years:** P5-P6

**Question:** A tree with n nodes had one extra edge added. Find the edge that can be removed so the result is a tree. If multiple answers, return last one.

**Approach:** Union-Find: iterate edges in order; for each, if both endpoints already in same component, that's the redundant edge. O(n*alpha(n)).

**Python:**
```python
def find_redundant_connection(edges: list[list[int]]) -> list[int]:
    parent = list(range(len(edges) + 1))
    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    for u, v in edges:
        ru, rv = find(u), find(v)
        if ru == rv:
            return [u, v]
        parent[ru] = rv
    return []
```

**TypeScript:**
```typescript
function findRedundantConnection(edges: number[][]): number[] {
  const parent = Array.from({ length: edges.length + 1 }, (_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  };
  for (const [u, v] of edges) {
    const ru = find(u), rv = find(v);
    if (ru === rv) return [u, v];
    parent[ru] = rv;
  }
  return [];
}
```

**Java:**
```java
int[] parent;

private int find(int x) {
    while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
}

public int[] findRedundantConnection(int[][] edges) {
    parent = new int[edges.length + 1];
    for (int i = 0; i < parent.length; i++) parent[i] = i;
    for (int[] e : edges) {
        int ru = find(e[0]), rv = find(e[1]);
        if (ru == rv) return e;
        parent[ru] = rv;
    }
    return new int[0];
}
```

**Key points:**
- The first edge to close a cycle is the answer (problem guarantees a single extra edge).
- Path compression keeps `find` near-O(1).
- Returning early avoids unnecessary unions.

**Tags:** #algorithm

---

### 54. Range Sum Query - Mutable (Segment Tree)

**Difficulty:** Medium
**Topics:** segment-tree, fenwick-tree, design
**Position:** P6
**Years:** P6-P7

**Question:** Design a data structure supporting `update(index, val)` and `sumRange(l, r)` on an integer array.

**Approach:** Segment tree (array-based, 4n size) or Binary Indexed Tree (BIT/Fenwick). Both give O(log n) update and query. BIT is shorter code, simpler for sum; segment tree generalizes to min/max/lazy propagation.

**Python:**
```python
class NumArray:
    def __init__(self, nums: list[int]) -> None:
        self.n = len(nums)
        self.bit = [0] * (self.n + 1)
        self.arr = [0] * self.n
        for i, v in enumerate(nums):
            self.update(i, v)

    def update(self, index: int, val: int) -> None:
        delta = val - self.arr[index]
        self.arr[index] = val
        i = index + 1
        while i <= self.n:
            self.bit[i] += delta
            i += i & -i

    def _prefix(self, i: int) -> int:
        s = 0
        while i > 0:
            s += self.bit[i]
            i -= i & -i
        return s

    def sumRange(self, left: int, right: int) -> int:
        return self._prefix(right + 1) - self._prefix(left)
```

**TypeScript:**
```typescript
class NumArray {
  private n: number;
  private bit: number[];
  private arr: number[];
  constructor(nums: number[]) {
    this.n = nums.length;
    this.bit = new Array(this.n + 1).fill(0);
    this.arr = new Array(this.n).fill(0);
    for (let i = 0; i < this.n; i++) this.update(i, nums[i]);
  }
  update(index: number, val: number): void {
    const delta = val - this.arr[index];
    this.arr[index] = val;
    for (let i = index + 1; i <= this.n; i += i & -i) this.bit[i] += delta;
  }
  private prefix(i: number): number {
    let s = 0;
    for (; i > 0; i -= i & -i) s += this.bit[i];
    return s;
  }
  sumRange(left: number, right: number): number {
    return this.prefix(right + 1) - this.prefix(left);
  }
}
```

**Java:**
```java
class NumArray {
    private final int n;
    private final int[] bit;
    private final int[] arr;

    public NumArray(int[] nums) {
        n = nums.length;
        bit = new int[n + 1];
        arr = new int[n];
        for (int i = 0; i < n; i++) update(i, nums[i]);
    }

    public void update(int index, int val) {
        int delta = val - arr[index];
        arr[index] = val;
        for (int i = index + 1; i <= n; i += i & -i) bit[i] += delta;
    }

    private int prefix(int i) {
        int s = 0;
        for (; i > 0; i -= i & -i) s += bit[i];
        return s;
    }

    public int sumRange(int left, int right) {
        return prefix(right + 1) - prefix(left);
    }
}
```

**Key points:**
- BIT uses 1-indexed internal storage; convert via `index + 1`.
- `update` stores a delta so values can be replaced (not just incremented).
- Range sum = `prefix(right+1) - prefix(left)`.

**Tags:** #algorithm

---

### 55. My Calendar I

**Difficulty:** Medium
**Topics:** design, tree-map, balanced-bst
**Position:** P5
**Years:** P5-P6

**Question:** Implement `book(start, end)` that returns true if booking [start, end) doesn't overlap any prior; otherwise false.

**Approach:** TreeMap (or Java TreeSet / C++ std::set) keyed by start. For new [s, e), find floor entry; check its end > s, and ceiling entry's start < e. O(log n) per booking.

**Python:**
```python
from sortedcontainers import SortedList

class MyCalendar:
    def __init__(self) -> None:
        self.intervals: SortedList = SortedList()  # list of (start, end)

    def book(self, start: int, end: int) -> bool:
        i = self.intervals.bisect_right((start, float("inf")))
        if i > 0 and self.intervals[i - 1][1] > start:
            return False
        if i < len(self.intervals) and self.intervals[i][0] < end:
            return False
        self.intervals.add((start, end))
        return True
```

**TypeScript:**
```typescript
class MyCalendar {
  private intervals: Array<[number, number]> = [];  // sorted by start
  book(start: number, end: number): boolean {
    let lo = 0, hi = this.intervals.length;
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      if (this.intervals[m][0] <= start) lo = m + 1; else hi = m;
    }
    if (lo > 0 && this.intervals[lo - 1][1] > start) return false;
    if (lo < this.intervals.length && this.intervals[lo][0] < end) return false;
    this.intervals.splice(lo, 0, [start, end]);
    return true;
  }
}
```

**Java:**
```java
class MyCalendar {
    private final TreeMap<Integer, Integer> intervals = new TreeMap<>(); // start -> end

    public boolean book(int start, int end) {
        Map.Entry<Integer, Integer> prev = intervals.floorEntry(start);
        if (prev != null && prev.getValue() > start) return false;
        Map.Entry<Integer, Integer> next = intervals.ceilingEntry(start);
        if (next != null && next.getKey() < end) return false;
        intervals.put(start, end);
        return true;
    }
}
```

**Key points:**
- Check the predecessor's end and the successor's start.
- Bisect by `start` keeps insertion sorted.
- Half-open intervals (`[s, e)`) make `==` boundaries safe.

**Tags:** #algorithm

---

### 56. My Calendar II

**Difficulty:** Medium
**Topics:** design, sweep-line, segment-tree
**Position:** P6
**Years:** P6-P7

**Question:** Same as My Calendar I, but allow at most 2 overlapping events (no triple booking).

**Approach:** Maintain a list of single bookings and a list of double-booked intervals. On new [s, e), if it overlaps any double-booked → reject; else check single bookings for overlaps and add those intersections to the double list. O(n) per booking. Alt: sweep line with delta counts.

**Python:**
```python
class MyCalendarTwo:
    def __init__(self) -> None:
        self.single: list[tuple[int, int]] = []
        self.double: list[tuple[int, int]] = []

    def book(self, start: int, end: int) -> bool:
        for s, e in self.double:
            if start < e and s < end:
                return False
        for s, e in self.single:
            if start < e and s < end:
                self.double.append((max(start, s), min(end, e)))
        self.single.append((start, end))
        return True
```

**TypeScript:**
```typescript
class MyCalendarTwo {
  private single: Array<[number, number]> = [];
  private double: Array<[number, number]> = [];
  book(start: number, end: number): boolean {
    for (const [s, e] of this.double) if (start < e && s < end) return false;
    for (const [s, e] of this.single) {
      if (start < e && s < end) this.double.push([Math.max(start, s), Math.min(end, e)]);
    }
    this.single.push([start, end]);
    return true;
  }
}
```

**Java:**
```java
class MyCalendarTwo {
    private final List<int[]> single = new ArrayList<>();
    private final List<int[]> dbl = new ArrayList<>();

    public boolean book(int start, int end) {
        for (int[] d : dbl) if (start < d[1] && d[0] < end) return false;
        for (int[] s : single) {
            if (start < s[1] && s[0] < end) dbl.add(new int[]{Math.max(start, s[0]), Math.min(end, s[1])});
        }
        single.add(new int[]{start, end});
        return true;
    }
}
```

**Key points:**
- Triple-book = overlap with any existing double-book.
- New double intervals come from intersecting the new booking with each prior single.
- Sweep-line + delta counts is the alternative for very large n.

**Tags:** #algorithm

---

### 57. Falling Squares

**Difficulty:** Hard
**Topics:** segment-tree, coordinate-compression
**Position:** P7
**Years:** P7

**Question:** Drop squares onto a number line one by one. After each drop, report the tallest stack so far.

**Approach:** Coordinate compress x-values. Segment tree with lazy propagation supporting range max query and range assign. For each square: query max in [l, r), height = query+side, range-assign height to [l, r), update global max. O(n log n).

**Python:**
```python
def falling_squares(positions: list[list[int]]) -> list[int]:
    # O(n^2) intervals approach; clear and matches problem constraints.
    heights: list[tuple[int, int, int]] = []  # (l, r, h)
    res: list[int] = []
    best = 0
    for left, side in positions:
        r = left + side
        base = 0
        for l2, r2, h in heights:
            if left < r2 and l2 < r:
                base = max(base, h)
        new_h = base + side
        heights.append((left, r, new_h))
        best = max(best, new_h)
        res.append(best)
    return res
```

**TypeScript:**
```typescript
function fallingSquares(positions: number[][]): number[] {
  const heights: Array<[number, number, number]> = [];
  const res: number[] = [];
  let best = 0;
  for (const [left, side] of positions) {
    const r = left + side;
    let base = 0;
    for (const [l2, r2, h] of heights) {
      if (left < r2 && l2 < r) base = Math.max(base, h);
    }
    const newH = base + side;
    heights.push([left, r, newH]);
    best = Math.max(best, newH);
    res.push(best);
  }
  return res;
}
```

**Java:**
```java
List<Integer> fallingSquares(int[][] positions) {
    List<int[]> heights = new ArrayList<>(); // {l, r, h}
    List<Integer> res = new ArrayList<>();
    int best = 0;
    for (int[] p : positions) {
        int left = p[0], side = p[1], r = left + side, base = 0;
        for (int[] h : heights) {
            if (left < h[1] && h[0] < r) base = Math.max(base, h[2]);
        }
        int newH = base + side;
        heights.add(new int[]{left, r, newH});
        best = Math.max(best, newH);
        res.add(best);
    }
    return res;
}
```

**Key points:**
- Each new square sits on top of the tallest segment it overlaps.
- O(n^2) brute force is sufficient for n ≤ 1000; segment tree gives O(n log n).
- Track a running max for the answer to avoid recomputing.

**Tags:** #algorithm

---

### 58. The Skyline Problem

**Difficulty:** Hard
**Topics:** sweep-line, heap, segment-tree
**Position:** P7
**Years:** P7

**Question:** Given a list of buildings as `[left, right, height]`, output the skyline as a sequence of key points.

**Approach:** Sweep line: events at each building's left (add height) and right (remove height). Multiset / max-heap of active heights. When current max changes, emit a key point. O(n log n). Use lazy deletion in heap.

**Python:**
```python
import heapq

def get_skyline(buildings: list[list[int]]) -> list[list[int]]:
    events: list[tuple[int, int, int]] = []
    for l, r, h in buildings:
        events.append((l, -h, r))
        events.append((r, 0, 0))
    events.sort()
    res: list[list[int]] = []
    heap: list[tuple[int, int]] = [(0, float("inf"))]  # (-h, end)
    for x, neg_h, end in events:
        if neg_h != 0:
            heapq.heappush(heap, (neg_h, end))
        while heap[0][1] <= x:
            heapq.heappop(heap)
        cur = -heap[0][0]
        if not res or res[-1][1] != cur:
            res.append([x, cur])
    return res
```

**TypeScript:**
```typescript
function getSkyline(buildings: number[][]): number[][] {
  const events: Array<[number, number, number]> = [];
  for (const [l, r, h] of buildings) {
    events.push([l, -h, r]);
    events.push([r, 0, 0]);
  }
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const heap: Array<[number, number]> = [[0, Infinity]];  // (-h, end)
  const res: number[][] = [];
  const push = (item: [number, number]): void => {
    heap.push(item);
    let i = heap.length - 1;
    while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; }
  };
  const pop = (): void => {
    const last = heap.pop()!;
    if (heap.length) { heap[0] = last; let i = 0; const n = heap.length;
      for (;;) { const l = 2 * i + 1, r = 2 * i + 2; let m = i;
        if (l < n && heap[l][0] < heap[m][0]) m = l;
        if (r < n && heap[r][0] < heap[m][0]) m = r;
        if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } }
  };
  for (const [x, negH, end] of events) {
    if (negH !== 0) push([negH, end]);
    while (heap[0][1] <= x) pop();
    const cur = -heap[0][0];
    if (!res.length || res[res.length - 1][1] !== cur) res.push([x, cur]);
  }
  return res;
}
```

**Java:**
```java
List<List<Integer>> getSkyline(int[][] buildings) {
    List<int[]> events = new ArrayList<>();
    for (int[] b : buildings) {
        events.add(new int[]{b[0], -b[2], b[1]});
        events.add(new int[]{b[1], 0, 0});
    }
    events.sort((a, b) -> a[0] != b[0] ? a[0] - b[0] : a[1] - b[1]);
    PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> a[0] - b[0]); // (-h, end)
    heap.offer(new int[]{0, Integer.MAX_VALUE});
    List<List<Integer>> res = new ArrayList<>();
    for (int[] e : events) {
        int x = e[0], negH = e[1], end = e[2];
        if (negH != 0) heap.offer(new int[]{negH, end});
        while (heap.peek()[1] <= x) heap.poll();
        int cur = -heap.peek()[0];
        if (res.isEmpty() || res.get(res.size() - 1).get(1) != cur) res.add(List.of(x, cur));
    }
    return res;
}
```

**Key points:**
- Use negative heights to turn min-heap into a max-heap.
- Lazy deletion: pop when the heap top's end has passed.
- Skip emitting duplicate heights to keep the output minimal.

**Tags:** #algorithm

---

### 59. Insert Delete GetRandom O(1)

**Difficulty:** Medium
**Topics:** design, hashmap, array
**Position:** P5
**Years:** P5-P6

**Question:** Design a set supporting `insert`, `delete`, and `getRandom` all in O(1) average.

**Approach:** Array + hashmap (`val -> index in array`). Insert: append to array, record index. Delete: swap with last element, pop array, update map. GetRandom: pick random index in array. All O(1).

**Python:**
```python
import random

class RandomizedSet:
    def __init__(self) -> None:
        self.arr: list[int] = []
        self.idx: dict[int, int] = {}

    def insert(self, val: int) -> bool:
        if val in self.idx:
            return False
        self.idx[val] = len(self.arr)
        self.arr.append(val)
        return True

    def remove(self, val: int) -> bool:
        if val not in self.idx:
            return False
        i, last = self.idx[val], self.arr[-1]
        self.arr[i] = last
        self.idx[last] = i
        self.arr.pop()
        del self.idx[val]
        return True

    def getRandom(self) -> int:
        return random.choice(self.arr)
```

**TypeScript:**
```typescript
class RandomizedSet {
  private arr: number[] = [];
  private idx = new Map<number, number>();
  insert(val: number): boolean {
    if (this.idx.has(val)) return false;
    this.idx.set(val, this.arr.length);
    this.arr.push(val);
    return true;
  }
  remove(val: number): boolean {
    if (!this.idx.has(val)) return false;
    const i = this.idx.get(val)!;
    const last = this.arr[this.arr.length - 1];
    this.arr[i] = last;
    this.idx.set(last, i);
    this.arr.pop();
    this.idx.delete(val);
    return true;
  }
  getRandom(): number {
    return this.arr[Math.floor(Math.random() * this.arr.length)];
  }
}
```

**Java:**
```java
class RandomizedSet {
    private final List<Integer> arr = new ArrayList<>();
    private final Map<Integer, Integer> idx = new HashMap<>();
    private final Random rng = new Random();

    public boolean insert(int val) {
        if (idx.containsKey(val)) return false;
        idx.put(val, arr.size());
        arr.add(val);
        return true;
    }

    public boolean remove(int val) {
        Integer i = idx.remove(val);
        if (i == null) return false;
        int last = arr.get(arr.size() - 1);
        arr.set(i, last);
        idx.put(last, i);
        arr.remove(arr.size() - 1);
        return true;
    }

    public int getRandom() {
        return arr.get(rng.nextInt(arr.size()));
    }
}
```

**Key points:**
- Swap-with-last keeps the array dense so random index works.
- Map both the index of the removed value AND update the moved element's index.
- All operations are O(1) average.

**Tags:** #algorithm

---

### 60. Design Twitter

**Difficulty:** Medium
**Topics:** design, heap, hashmap, ood
**Position:** P6
**Years:** P6-P7

**Question:** Design a simplified Twitter supporting `postTweet`, `getNewsFeed` (top 10 from user + followees), `follow`, `unfollow`.

**Approach:** `userId -> list of (timestamp, tweetId)`, `userId -> set of followees`. On feed, k-way merge: push latest tweet of each followee (and self) into max-heap by timestamp, pop 10 times, pushing next from same source. O((followees + 10) log followees).

**Python:**
```python
import heapq
from collections import defaultdict

class Twitter:
    def __init__(self) -> None:
        self.time = 0
        self.tweets: dict[int, list[tuple[int, int]]] = defaultdict(list)
        self.followees: dict[int, set[int]] = defaultdict(set)

    def postTweet(self, user_id: int, tweet_id: int) -> None:
        self.time += 1
        self.tweets[user_id].append((self.time, tweet_id))

    def getNewsFeed(self, user_id: int) -> list[int]:
        heap: list[tuple[int, int, int]] = []
        sources = self.followees[user_id] | {user_id}
        for u in sources:
            posts = self.tweets[u]
            if posts:
                heapq.heappush(heap, (-posts[-1][0], u, len(posts) - 1))
        out: list[int] = []
        while heap and len(out) < 10:
            _, u, i = heapq.heappop(heap)
            out.append(self.tweets[u][i][1])
            if i > 0:
                heapq.heappush(heap, (-self.tweets[u][i - 1][0], u, i - 1))
        return out

    def follow(self, follower_id: int, followee_id: int) -> None:
        if follower_id != followee_id:
            self.followees[follower_id].add(followee_id)

    def unfollow(self, follower_id: int, followee_id: int) -> None:
        self.followees[follower_id].discard(followee_id)
```

**TypeScript:**
```typescript
class Twitter {
  private time = 0;
  private tweets = new Map<number, Array<[number, number]>>();
  private followees = new Map<number, Set<number>>();
  postTweet(userId: number, tweetId: number): void {
    this.time++;
    if (!this.tweets.has(userId)) this.tweets.set(userId, []);
    this.tweets.get(userId)!.push([this.time, tweetId]);
  }
  getNewsFeed(userId: number): number[] {
    const sources = new Set<number>([userId, ...(this.followees.get(userId) ?? [])]);
    const candidates: Array<[number, number]> = [];  // [time, tweetId]
    for (const u of sources) for (const t of this.tweets.get(u) ?? []) candidates.push(t);
    return candidates.sort((a, b) => b[0] - a[0]).slice(0, 10).map(t => t[1]);
  }
  follow(followerId: number, followeeId: number): void {
    if (followerId === followeeId) return;
    if (!this.followees.has(followerId)) this.followees.set(followerId, new Set());
    this.followees.get(followerId)!.add(followeeId);
  }
  unfollow(followerId: number, followeeId: number): void {
    this.followees.get(followerId)?.delete(followeeId);
  }
}
```

**Java:**
```java
class Twitter {
    private int time = 0;
    private final Map<Integer, List<int[]>> tweets = new HashMap<>();   // user -> [{time, tweetId}]
    private final Map<Integer, Set<Integer>> followees = new HashMap<>();

    public void postTweet(int userId, int tweetId) {
        tweets.computeIfAbsent(userId, k -> new ArrayList<>()).add(new int[]{++time, tweetId});
    }

    public List<Integer> getNewsFeed(int userId) {
        Set<Integer> sources = new HashSet<>(followees.getOrDefault(userId, Set.of()));
        sources.add(userId);
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> b[0] - a[0]); // {time, user, idx}
        for (int u : sources) {
            List<int[]> posts = tweets.get(u);
            if (posts != null && !posts.isEmpty()) {
                int i = posts.size() - 1;
                heap.offer(new int[]{posts.get(i)[0], u, i});
            }
        }
        List<Integer> out = new ArrayList<>();
        while (!heap.isEmpty() && out.size() < 10) {
            int[] cur = heap.poll();
            List<int[]> posts = tweets.get(cur[1]);
            out.add(posts.get(cur[2])[1]);
            if (cur[2] > 0) heap.offer(new int[]{posts.get(cur[2] - 1)[0], cur[1], cur[2] - 1});
        }
        return out;
    }

    public void follow(int followerId, int followeeId) {
        if (followerId != followeeId) followees.computeIfAbsent(followerId, k -> new HashSet<>()).add(followeeId);
    }

    public void unfollow(int followerId, int followeeId) {
        Set<Integer> f = followees.get(followerId);
        if (f != null) f.remove(followeeId);
    }
}
```

**Key points:**
- Each tweet stores a monotonic timestamp so global ordering is well-defined.
- Heap-based k-way merge gives best asymptotics; a simple sort is fine when n is small.
- Always include the user's own tweets alongside followees'.

**Tags:** #algorithm

---

### 61. Consistent Hashing Ring Simulation

**Difficulty:** Hard
**Topics:** design, hashing, distributed, tree-map
**Position:** P7
**Years:** P7

**Question:** Implement consistent hashing with virtual nodes supporting `addNode(id)`, `removeNode(id)`, `getNode(key)`. Minimize key movement on node changes.

**Approach:** TreeMap<hashValue, nodeId>. Each physical node has V virtual nodes (V ~ 100-200) hashed into the ring. `getNode(key)`: hash key, find ceiling entry in map (wrap around if none). Add/remove node = insert/delete V map entries. O(log n) lookup, O(V log n) add/remove. Discuss: load balance variance, weighted nodes (different V per node), hash function (Murmur/SHA1).

**Python:**
```python
import hashlib
from sortedcontainers import SortedDict

class ConsistentHash:
    def __init__(self, vnodes: int = 150) -> None:
        self.vnodes = vnodes
        self.ring: SortedDict[int, str] = SortedDict()  # hash -> node id

    def _hash(self, s: str) -> int:
        return int(hashlib.md5(s.encode()).hexdigest(), 16)

    def add_node(self, node_id: str) -> None:
        for i in range(self.vnodes):
            self.ring[self._hash(f"{node_id}#{i}")] = node_id

    def remove_node(self, node_id: str) -> None:
        for i in range(self.vnodes):
            self.ring.pop(self._hash(f"{node_id}#{i}"), None)

    def get_node(self, key: str) -> str | None:
        if not self.ring:
            return None
        h = self._hash(key)
        i = self.ring.bisect_left(h)
        if i == len(self.ring):
            i = 0
        return self.ring.values()[i]
```

**TypeScript:**
```typescript
import { createHash } from "crypto";

class ConsistentHash {
  private ring: number[] = [];               // sorted hash values
  private map = new Map<number, string>();   // hash -> node id
  constructor(private vnodes: number = 150) {}
  private h(s: string): number {
    const hex = createHash("md5").update(s).digest("hex").slice(0, 8);
    return parseInt(hex, 16);
  }
  addNode(nodeId: string): void {
    for (let i = 0; i < this.vnodes; i++) {
      const k = this.h(`${nodeId}#${i}`);
      if (this.map.has(k)) continue;
      this.map.set(k, nodeId);
      const idx = this.bisect(k);
      this.ring.splice(idx, 0, k);
    }
  }
  removeNode(nodeId: string): void {
    for (let i = 0; i < this.vnodes; i++) {
      const k = this.h(`${nodeId}#${i}`);
      if (!this.map.delete(k)) continue;
      const idx = this.bisect(k);
      if (this.ring[idx] === k) this.ring.splice(idx, 1);
    }
  }
  getNode(key: string): string | null {
    if (!this.ring.length) return null;
    let idx = this.bisect(this.h(key));
    if (idx === this.ring.length) idx = 0;
    return this.map.get(this.ring[idx]) ?? null;
  }
  private bisect(k: number): number {
    let lo = 0, hi = this.ring.length;
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      if (this.ring[m] < k) lo = m + 1; else hi = m;
    }
    return lo;
  }
}
```

**Java:**
```java
class ConsistentHash {
    private final int vnodes;
    private final TreeMap<Long, String> ring = new TreeMap<>();

    public ConsistentHash(int vnodes) { this.vnodes = vnodes; }

    private long hash(String s) {
        try {
            byte[] d = MessageDigest.getInstance("MD5").digest(s.getBytes(StandardCharsets.UTF_8));
            long h = 0;
            for (int i = 0; i < 8; i++) h = (h << 8) | (d[i] & 0xffL);
            return h;
        } catch (NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }

    public void addNode(String nodeId) {
        for (int i = 0; i < vnodes; i++) ring.put(hash(nodeId + "#" + i), nodeId);
    }

    public void removeNode(String nodeId) {
        for (int i = 0; i < vnodes; i++) ring.remove(hash(nodeId + "#" + i));
    }

    public String getNode(String key) {
        if (ring.isEmpty()) return null;
        Map.Entry<Long, String> e = ring.ceilingEntry(hash(key));
        return e != null ? e.getValue() : ring.firstEntry().getValue();
    }
}
```

**Key points:**
- Virtual nodes flatten load skew; 100-200 per physical node is typical.
- `getNode` is O(log n) via binary search on sorted ring keys.
- On node change only `1/N` of keys move, the core property of consistent hashing.

**Tags:** #algorithm

---

### 62. Top-K Frequent Elements in a Stream

**Difficulty:** Hard
**Topics:** design, heap, streaming, hashmap, big-data
**Position:** P7
**Years:** P7-P8

**Question:** Design a data structure for an unbounded stream of items supporting `add(item)` and `getTopK()` returning the K most frequent items so far.

**Approach:** HashMap<item, count> + min-heap of size K keyed by count. On `add`: increment count; if item in heap, re-heapify (use indexed heap); else if count > heap min, pop min, push item. O(log K) per add. For massive streams: Count-Min Sketch (approximate) or Misra-Gries heavy hitters for sublinear memory. Discuss accuracy/memory trade-offs.

**Python:**
```python
import heapq

class TopK:
    def __init__(self, k: int) -> None:
        self.k = k
        self.counts: dict[str, int] = {}

    def add(self, item: str) -> None:
        self.counts[item] = self.counts.get(item, 0) + 1

    def get_top_k(self) -> list[str]:
        # heap of size k: keep the K most frequent
        heap: list[tuple[int, str]] = []
        for item, cnt in self.counts.items():
            if len(heap) < self.k:
                heapq.heappush(heap, (cnt, item))
            elif cnt > heap[0][0]:
                heapq.heapreplace(heap, (cnt, item))
        return [item for _, item in sorted(heap, key=lambda x: -x[0])]
```

**TypeScript:**
```typescript
class TopK {
  private counts = new Map<string, number>();
  constructor(private k: number) {}
  add(item: string): void {
    this.counts.set(item, (this.counts.get(item) ?? 0) + 1);
  }
  getTopK(): string[] {
    return [...this.counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, this.k)
      .map(([item]) => item);
  }
}
```

**Java:**
```java
class TopK {
    private final int k;
    private final Map<String, Integer> counts = new HashMap<>();

    public TopK(int k) { this.k = k; }

    public void add(String item) { counts.merge(item, 1, Integer::sum); }

    public List<String> getTopK() {
        PriorityQueue<Map.Entry<String, Integer>> heap =
            new PriorityQueue<>(Comparator.comparingInt(Map.Entry::getValue));
        for (var e : counts.entrySet()) {
            if (heap.size() < k) heap.offer(e);
            else if (e.getValue() > heap.peek().getValue()) { heap.poll(); heap.offer(e); }
        }
        List<Map.Entry<String, Integer>> list = new ArrayList<>(heap);
        list.sort((a, b) -> b.getValue() - a.getValue());
        List<String> out = new ArrayList<>();
        for (var e : list) out.add(e.getKey());
        return out;
    }
}
```

**Key points:**
- A size-K min-heap maintains the top-K in O(n log K).
- For unbounded streams use Count-Min Sketch or Misra-Gries for sublinear memory.
- Heap top is the smallest of the top-K — easy threshold check.

**Tags:** #algorithm

---

## Tips specific to Alibaba

- **Know Java middleware deeply.** Spring lifecycle, AOP, Dubbo RPC, MyBatis interceptors — interviewers go deep into source code.
- **JVM internals are non-negotiable.** GC algorithms (CMS, G1, ZGC), memory model (JMM), `volatile`/`synchronized`/`final` semantics. Know `AQS` internals.
- **Open-source contributions help a lot.** Especially to Alibaba-sponsored projects (Dubbo, RocketMQ, Nacos, Sentinel, Seata, Alink). Mention them concretely.
- **Six Values prep.** Have one story per value. The 客户第一 and 拥抱变化 stories get reused most.
- **Higher-level interviewers ask "design Taobao."** They want architectural narrative, not boxes. Practice talking through trade-offs out loud for 20+ minutes.

## Resources

- Alibaba tech blog (Chinese: alibaba-cloud.medium.com; some English mirrors)
- 牛客网 (NowCoder) interview reports for Alibaba — extensive Chinese-language db
- "Designing Data-Intensive Applications" — Kleppmann
- Open-source: github.com/apache/dubbo, github.com/apache/rocketmq, github.com/alibaba/Sentinel, github.com/seata/seata
