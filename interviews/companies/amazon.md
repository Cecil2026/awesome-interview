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

## Linked List

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

### 2. Merge K Sorted Lists

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

### 3. LFU Cache

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

### 4. Copy List with Random Pointer

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

### 5. Reverse Nodes in k-Group

**Difficulty:** Hard
**Topics:** linked-list, recursion, in-place
**Position:** SWE
**Years:** L5-L6

**Question:** Given a linked list, reverse the nodes `k` at a time and return the modified list; nodes left over that number fewer than `k` stay in original order.

**Approach:** Use a `dummy` before head and keep a `group_prev` pointer. Each round, walk `k` steps to find the group's `kth` node; if fewer than `k` remain, stop. Then reverse the group in place and reconnect predecessor and successor. Only pointers change: O(n) time, O(1) space. Batching fixed-size chunks of an order/logistics stream is a real-world abstraction of this.

**Python:**
```python
def reverse_k_group(head: ListNode | None, k: int) -> ListNode | None:
    dummy = ListNode(0, head)
    group_prev = dummy
    while True:
        kth = group_prev
        for _ in range(k):
            kth = kth.next
            if not kth:
                return dummy.next
        group_next = kth.next
        prev, cur = group_next, group_prev.next
        while cur is not group_next:
            cur.next, prev, cur = prev, cur, cur.next
        tmp = group_prev.next
        group_prev.next = kth
        group_prev = tmp
```

**TypeScript:**
```typescript
function reverseKGroup(head: ListNode | null, k: number): ListNode | null {
  const dummy = new ListNode(0, head);
  let groupPrev: ListNode = dummy;
  while (true) {
    let kth: ListNode | null = groupPrev;
    for (let i = 0; i < k; i++) {
      kth = kth!.next;
      if (!kth) return dummy.next;
    }
    const groupNext = kth.next;
    let prev = groupNext, cur = groupPrev.next;
    while (cur !== groupNext) {
      const nxt = cur!.next;
      cur!.next = prev;
      prev = cur;
      cur = nxt;
    }
    const tmp = groupPrev.next!;
    groupPrev.next = kth;
    groupPrev = tmp;
  }
}
```

**Java:**
```java
class Solution {
    public ListNode reverseKGroup(ListNode head, int k) {
        ListNode dummy = new ListNode(0, head), groupPrev = dummy;
        while (true) {
            ListNode kth = groupPrev;
            for (int i = 0; i < k; i++) {
                kth = kth.next;
                if (kth == null) return dummy.next;
            }
            ListNode groupNext = kth.next, prev = groupNext, cur = groupPrev.next;
            while (cur != groupNext) {
                ListNode nxt = cur.next;
                cur.next = prev;
                prev = cur;
                cur = nxt;
            }
            ListNode tmp = groupPrev.next;
            groupPrev.next = kth;
            groupPrev = tmp;
        }
    }
}
```

**Key points:**
- Probe whether the group has `k` nodes first; if not, leave it untouched and return.
- A sentinel `dummy` uniformly handles the head being reversed.
- O(n) time, pointer-only rewiring, O(1) space.

**Follow-ups:**
- How would a recursive version look, and what is its stack depth?
- If the leftover tail group must also be reversed, how does the code change?

**Common Pitfalls:**
- Forgetting to link the previous group's tail to the new group head, breaking the chain.
- Updating `group_prev` incorrectly and reconnecting to the pre-reversal old head.

**Tags:** #algorithm

---

### 6. Add Two Numbers

**Difficulty:** Medium
**Topics:** linked-list, math, simulation
**Position:** SWE
**Years:** L5

**Question:** Two non-empty linked lists represent two non-negative integers stored in reverse order, one digit per node. Add the numbers and return the sum as a linked list in the same reverse order.

**Approach:** Traverse both lists together, adding digit by digit while keeping a `carry`. A sentinel `dummy` simplifies building; each step creates a node valued `(a + b + carry) % 10` with carry `// 10`. Treat an exhausted list as 0, and keep looping while `carry` is nonzero. O(max(m, n)) time and O(max(m, n)) space for the result. Reverse storage naturally matches adding from the least significant digit.

**Python:**
```python
def add_two_numbers(l1: ListNode | None, l2: ListNode | None) -> ListNode | None:
    dummy = ListNode()
    cur = dummy
    carry = 0
    while l1 or l2 or carry:
        a = l1.val if l1 else 0
        b = l2.val if l2 else 0
        carry, digit = divmod(a + b + carry, 10)
        cur.next = ListNode(digit)
        cur = cur.next
        l1 = l1.next if l1 else None
        l2 = l2.next if l2 else None
    return dummy.next
```

**TypeScript:**
```typescript
function addTwoNumbers(l1: ListNode | null, l2: ListNode | null): ListNode | null {
  const dummy = new ListNode();
  let cur = dummy, carry = 0;
  while (l1 || l2 || carry) {
    const sum = (l1?.val ?? 0) + (l2?.val ?? 0) + carry;
    carry = Math.floor(sum / 10);
    cur.next = new ListNode(sum % 10);
    cur = cur.next;
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
        ListNode dummy = new ListNode(), cur = dummy;
        int carry = 0;
        while (l1 != null || l2 != null || carry != 0) {
            int a = l1 != null ? l1.val : 0;
            int b = l2 != null ? l2.val : 0;
            int sum = a + b + carry;
            carry = sum / 10;
            cur.next = new ListNode(sum % 10);
            cur = cur.next;
            if (l1 != null) l1 = l1.next;
            if (l2 != null) l2 = l2.next;
        }
        return dummy.next;
    }
}
```

**Key points:**
- Keep `carry` in the loop condition to emit a final carry digit (e.g., 5+5).
- The sentinel `dummy` avoids special-casing the result head.
- Pad the shorter list with zeros when lengths differ.

**Follow-ups:**
- What if digits are stored in forward order (most significant first)? (Use stacks or reverse first.)
- How could you reuse one input list in place to save memory?

**Common Pitfalls:**
- Dropping the leftover carry, producing a result short one digit.
- Continuing only while both lists are non-empty, missing the tail of the longer one.

**Tags:** #algorithm

---

### 7. Reorder List

**Difficulty:** Medium
**Topics:** linked-list, two-pointers, in-place
**Position:** SWE
**Years:** L5

**Question:** Given a linked list `L0 → L1 → … → Ln-1 → Ln`, reorder it in place to `L0 → Ln → L1 → Ln-1 → L2 → Ln-2 → …` without modifying node values.

**Approach:** Three steps: find the midpoint with slow/fast pointers and split into two halves; reverse the second half; then merge the two halves alternately. Pointer-only rewiring gives O(n) time, O(1) space. This head-tail interleaving pattern shows up in paginated display and fair queue scheduling.

**Python:**
```python
def reorder_list(head: ListNode | None) -> None:
    if not head or not head.next:
        return
    slow, fast = head, head
    while fast.next and fast.next.next:
        slow, fast = slow.next, fast.next.next
    second = slow.next
    slow.next = None
    prev = None
    while second:
        second.next, prev, second = prev, second, second.next
    first = head
    while prev:
        first.next, first = prev, first.next
        prev.next, prev = first, prev.next
```

**TypeScript:**
```typescript
function reorderList(head: ListNode | null): void {
  if (!head || !head.next) return;
  let slow = head, fast = head;
  while (fast.next && fast.next.next) { slow = slow.next!; fast = fast.next.next; }
  let second = slow.next;
  slow.next = null;
  let prev: ListNode | null = null;
  while (second) { const nxt = second.next; second.next = prev; prev = second; second = nxt; }
  let first: ListNode | null = head;
  while (prev) {
    const n1 = first!.next, n2 = prev.next;
    first!.next = prev;
    prev.next = n1;
    first = n1;
    prev = n2;
  }
}
```

**Java:**
```java
class Solution {
    public void reorderList(ListNode head) {
        if (head == null || head.next == null) return;
        ListNode slow = head, fast = head;
        while (fast.next != null && fast.next.next != null) { slow = slow.next; fast = fast.next.next; }
        ListNode second = slow.next;
        slow.next = null;
        ListNode prev = null;
        while (second != null) { ListNode nxt = second.next; second.next = prev; prev = second; second = nxt; }
        ListNode first = head;
        while (prev != null) {
            ListNode n1 = first.next, n2 = prev.next;
            first.next = prev;
            prev.next = n1;
            first = n1;
            prev = n2;
        }
    }
}
```

**Key points:**
- Find the midpoint with slow/fast pointers; for even length the first half is no shorter than the second.
- Cut at the midpoint, reverse the second half, then interleave-merge.
- O(n) time, in-place O(1) space.

**Follow-ups:**
- How would the same technique test whether a list is a palindrome?
- If reversal is disallowed (keep order), could a deque implement this, and at what cost?

**Common Pitfalls:**
- Forgetting to null the first half's tail `next` when splitting, creating a cycle.
- Not saving both sides' `next` before rewiring during merge, losing successors.

**Tags:** #algorithm

---

## Tree

### 8. Word Break

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

### 9. Concatenated Words

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

### 10. Subtree of Another Tree

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

### 11. Serialize and Deserialize Binary Tree

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

### 12. Word Search II

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

### 13. Lowest Common Ancestor of a Binary Tree

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

### 14. Validate Binary Search Tree

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

### 15. Binary Tree Level Order Traversal

**Difficulty:** Medium
**Topics:** tree, bfs, queue
**Position:** SDE
**Years:** L5

**Question:** Given a binary tree, return its node values level by level from top to bottom, left to right, as a list of lists where each inner list is one level.

**Approach:** Standard BFS: use a queue, and at each round record the current queue size, popping exactly that many nodes to form the level while enqueuing their children. Time O(n), space O(n) (the widest level can hold ~n/2 nodes). Level order is a staple when Amazon backends walk tree/DAG structures such as order dependencies or category hierarchies.

**Python:**
```python
from collections import deque

def level_order(root: TreeNode | None) -> list[list[int]]:
    if root is None:
        return []
    res: list[list[int]] = []
    q: deque[TreeNode] = deque([root])
    while q:
        level: list[int] = []
        for _ in range(len(q)):
            node = q.popleft()
            level.append(node.val)
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
        res.append(level)
    return res
```

**TypeScript:**
```typescript
function levelOrder(root: TreeNode | null): number[][] {
  if (!root) return [];
  const res: number[][] = [];
  let queue: TreeNode[] = [root];
  while (queue.length) {
    const level: number[] = [];
    const next: TreeNode[] = [];
    for (const node of queue) {
      level.push(node.val);
      if (node.left) next.push(node.left);
      if (node.right) next.push(node.right);
    }
    res.push(level);
    queue = next;
  }
  return res;
}
```

**Java:**
```java
class Solution {
    public List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> res = new ArrayList<>();
        if (root == null) return res;
        Queue<TreeNode> q = new LinkedList<>();
        q.offer(root);
        while (!q.isEmpty()) {
            int size = q.size();
            List<Integer> level = new ArrayList<>();
            for (int i = 0; i < size; i++) {
                TreeNode node = q.poll();
                level.add(node.val);
                if (node.left != null) q.offer(node.left);
                if (node.right != null) q.offer(node.right);
            }
            res.add(level);
        }
        return res;
    }
}
```

**Key points:**
- Snapshot `size` before the inner loop so nodes are partitioned into the right level.
- Time O(n), space O(n).
- Enqueue right-to-left or reverse the result to get zigzag/bottom-up variants.

**Follow-ups:**
- How would you produce a zigzag (spiral) level order traversal?
- For a heavily skewed (linked-list-like) tree, how do BFS and DFS space costs compare?

**Common Pitfalls:**
- Reading `queue length` inside the loop instead of caching it mixes newly added children into the current level.
- Forgetting the empty-root case returns the wrong structure.

**Tags:** #algorithm

---

### 16. Binary Tree Right Side View

**Difficulty:** Medium
**Topics:** tree, bfs, dfs
**Position:** SDE
**Years:** L5

**Question:** Given a binary tree, imagine standing on its right side; return the values of the nodes you can see from top to bottom (the rightmost node of each level).

**Approach:** BFS taking the last node of each level works in O(n) time, O(n) space. Alternatively, DFS in root -> right -> left order and record a node whenever the current depth equals the result length: the first node reached at each depth is the rightmost, using O(h) space. The concise DFS solution is shown.

**Python:**
```python
def right_side_view(root: TreeNode | None) -> list[int]:
    res: list[int] = []
    def dfs(node: TreeNode | None, depth: int) -> None:
        if node is None:
            return
        if depth == len(res):
            res.append(node.val)
        dfs(node.right, depth + 1)
        dfs(node.left, depth + 1)
    dfs(root, 0)
    return res
```

**TypeScript:**
```typescript
function rightSideView(root: TreeNode | null): number[] {
  const res: number[] = [];
  const dfs = (node: TreeNode | null, depth: number): void => {
    if (!node) return;
    if (depth === res.length) res.push(node.val);
    dfs(node.right, depth + 1);
    dfs(node.left, depth + 1);
  };
  dfs(root, 0);
  return res;
}
```

**Java:**
```java
class Solution {
    public List<Integer> rightSideView(TreeNode root) {
        List<Integer> res = new ArrayList<>();
        dfs(root, 0, res);
        return res;
    }
    private void dfs(TreeNode node, int depth, List<Integer> res) {
        if (node == null) return;
        if (depth == res.size()) res.add(node.val);
        dfs(node.right, depth + 1, res);
        dfs(node.left, depth + 1, res);
    }
}
```

**Key points:**
- Recurse into the right subtree first so the first node seen at each depth is the rightmost.
- `depth == len(res)` is the classic first-visit-per-depth trick.
- Time O(n), DFS space O(h).

**Follow-ups:**
- How would you get the left side view? Swap the recursion order to left before right.
- How would a BFS solution look, and how do the two differ in space?

**Common Pitfalls:**
- Assuming the view is just all right children; a left-subtree node is visible when the right subtree is missing.
- Recursing left first in DFS records the wrong first-visited node.

**Tags:** #algorithm

---

### 17. Binary Tree Maximum Path Sum

**Difficulty:** Hard
**Topics:** tree, dfs, recursion
**Position:** SDE
**Years:** L5-L6

**Question:** A path is any sequence of nodes connected by parent-child edges; it contains at least one node and need not pass through the root. Return the maximum sum of node values over all paths (values may be negative).

**Approach:** Post-order DFS. For each node compute the best single-branch gain it can hand upward = `node.val + max(0, leftGain, rightGain)` (clamp negative gains to 0). Meanwhile update the global answer with a path that peaks at this node using both branches: `node.val + max(0,left) + max(0,right)`. Time O(n), space O(h). This tree DP shows up in Amazon's harder algorithm rounds.

**Python:**
```python
def max_path_sum(root: TreeNode | None) -> int:
    best = float('-inf')
    def gain(node: TreeNode | None) -> int:
        nonlocal best
        if node is None:
            return 0
        left = max(gain(node.left), 0)
        right = max(gain(node.right), 0)
        best = max(best, node.val + left + right)
        return node.val + max(left, right)
    gain(root)
    return int(best)
```

**TypeScript:**
```typescript
function maxPathSum(root: TreeNode | null): number {
  let best = -Infinity;
  const gain = (node: TreeNode | null): number => {
    if (!node) return 0;
    const left = Math.max(gain(node.left), 0);
    const right = Math.max(gain(node.right), 0);
    best = Math.max(best, node.val + left + right);
    return node.val + Math.max(left, right);
  };
  gain(root);
  return best;
}
```

**Java:**
```java
class Solution {
    private int best = Integer.MIN_VALUE;
    public int maxPathSum(TreeNode root) {
        gain(root);
        return best;
    }
    private int gain(TreeNode node) {
        if (node == null) return 0;
        int left = Math.max(gain(node.left), 0);
        int right = Math.max(gain(node.right), 0);
        best = Math.max(best, node.val + left + right);
        return node.val + Math.max(left, right);
    }
}
```

**Key points:**
- Separate the single-branch gain returned to the parent from the global answer updated at the turning point.
- Clamp negative gains with `max(0, ...)` so they do not drag the path down.
- Initialize the global best to negative infinity to handle all-negative trees.

**Follow-ups:**
- How would you also reconstruct the actual path that yields the maximum sum?
- If the path must pass through the root, how does the solution simplify?

**Common Pitfalls:**
- Returning `left + right` as the upward gain, which is not a valid single-branch path for the parent.
- Initializing the global best to 0, which returns a wrong 0 for all-negative trees.

**Tags:** #algorithm

---

### 18. Kth Smallest Element in a BST

**Difficulty:** Medium
**Topics:** tree, bst, dfs, inorder
**Position:** SDE
**Years:** L5

**Question:** Given the root of a binary search tree (BST) and an integer `k`, return the `k`-th smallest value among all node values (1-indexed).

**Approach:** An in-order traversal of a BST visits values in ascending order, so the `k`-th visited node is the answer. Use an iterative in-order traversal with an explicit stack and return early once the count reaches `k`: time O(h + k), space O(h). Early termination beats a full traversal when `k` is small.

**Python:**
```python
def kth_smallest(root: TreeNode | None, k: int) -> int:
    stack: list[TreeNode] = []
    node = root
    while stack or node:
        while node:
            stack.append(node)
            node = node.left
        node = stack.pop()
        k -= 1
        if k == 0:
            return node.val
        node = node.right
    raise ValueError("k out of range")
```

**TypeScript:**
```typescript
function kthSmallest(root: TreeNode | null, k: number): number {
  const stack: TreeNode[] = [];
  let node = root;
  while (stack.length || node) {
    while (node) {
      stack.push(node);
      node = node.left;
    }
    node = stack.pop()!;
    if (--k === 0) return node.val;
    node = node.right;
  }
  throw new Error("k out of range");
}
```

**Java:**
```java
class Solution {
    public int kthSmallest(TreeNode root, int k) {
        Deque<TreeNode> stack = new ArrayDeque<>();
        TreeNode node = root;
        while (!stack.isEmpty() || node != null) {
            while (node != null) {
                stack.push(node);
                node = node.left;
            }
            node = stack.pop();
            if (--k == 0) return node.val;
            node = node.right;
        }
        throw new IllegalArgumentException("k out of range");
    }
}
```

**Key points:**
- Exploit the ascending in-order property of a BST; no sorting needed.
- Iterative in-order can exit early at the k-th node for O(h + k) time.
- Space O(h), the stack depth never exceeds tree height.

**Follow-ups:**
- If the tree is modified often (inserts/deletes) with many k-th queries, how would you optimize (store subtree sizes in nodes)?
- How would you adapt it to find the k-th largest?

**Common Pitfalls:**
- Forgetting to push all left children first, which breaks in-order order.
- Decrementing `k` at the wrong moment relative to the pop, causing an off-by-one.

**Tags:** #algorithm

---

## Graph

### 19. Number of Islands

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

### 20. Number of Provinces

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

### 21. Course Schedule

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

### 22. Word Ladder II

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

### 23. Critical Connections in a Network

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

### 24. The Maze II

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

### 25. Path with Maximum Probability

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

### 26. Number of Islands II

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

### 27. Optimize Water Distribution in a Village

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

### 28. Clone Graph

**Difficulty:** Medium
**Topics:** graph, dfs, bfs, hash-table
**Position:** SWE
**Years:** L5

**Question:** Given a reference to a node in a connected undirected graph, return a deep copy of the graph. Each node has a `val` and a list of `neighbors`.

**Approach:** Keep a hash map from original node to its clone and traverse via DFS or BFS. On visiting a node, create its clone and record it *before* recursing into neighbors; the map both deduplicates and breaks cycles. Time O(V+E), space O(V). At Amazon this pattern shows up when snapshotting service dependency topologies or order-fulfillment networks.

**Python:**
```python
from typing import Optional

class Node:
    def __init__(self, val: int = 0, neighbors: list['Node'] | None = None):
        self.val = val
        self.neighbors = neighbors or []

def clone_graph(node: Optional[Node]) -> Optional[Node]:
    if node is None:
        return None
    seen: dict[Node, Node] = {}
    def dfs(cur: Node) -> Node:
        if cur in seen:
            return seen[cur]
        copy = Node(cur.val)
        seen[cur] = copy
        copy.neighbors = [dfs(nb) for nb in cur.neighbors]
        return copy
    return dfs(node)
```

**TypeScript:**
```typescript
class GraphNode {
  val: number;
  neighbors: GraphNode[];
  constructor(val = 0, neighbors: GraphNode[] = []) {
    this.val = val;
    this.neighbors = neighbors;
  }
}

function cloneGraph(node: GraphNode | null): GraphNode | null {
  if (node === null) return null;
  const seen = new Map<GraphNode, GraphNode>();
  const dfs = (cur: GraphNode): GraphNode => {
    const existing = seen.get(cur);
    if (existing) return existing;
    const copy = new GraphNode(cur.val);
    seen.set(cur, copy);
    copy.neighbors = cur.neighbors.map(dfs);
    return copy;
  };
  return dfs(node);
}
```

**Java:**
```java
class Node {
    public int val;
    public List<Node> neighbors;
    public Node(int val) { this.val = val; this.neighbors = new ArrayList<>(); }
}

class Solution {
    private final Map<Node, Node> seen = new HashMap<>();
    public Node cloneGraph(Node node) {
        if (node == null) return null;
        if (seen.containsKey(node)) return seen.get(node);
        Node copy = new Node(node.val);
        seen.put(node, copy);
        for (Node nb : node.neighbors) copy.neighbors.add(cloneGraph(nb));
        return copy;
    }
}
```

**Key points:**
- Record the clone in the map before recursing so cycles terminate.
- Key the map by node identity, ensuring each node is cloned once.
- DFS or BFS both work; each is O(V+E).

**Follow-ups:**
- If `val` is not unique, can you key by `val`? (No — must key by reference/identity.)
- How would an iterative BFS version avoid stack overflow on deep graphs?

**Common Pitfalls:**
- Forgetting to insert the mapping before recursing, causing infinite recursion on cycles.
- Not handling the empty graph (null input).

**Tags:** #algorithm

---

### 29. Alien Dictionary

**Difficulty:** Hard
**Topics:** graph, topological-sort, bfs
**Position:** SWE
**Years:** L5-L6

**Question:** Given a list of `words` from an alien language sorted lexicographically by some unknown alphabet order, derive that alphabet's order. Return an empty string if the ordering is invalid, or any valid order if several exist.

**Approach:** Compare each adjacent word pair character by character; the first differing pair `a != b` yields a directed edge `a -> b`. Build the graph over all characters seen, then run Kahn's topological sort; if you cannot emit every character, there is a cycle, so return "". Watch the invalid "prefix comes after" case (e.g. `abc` before `ab`). Time O(total chars), space O(1) since the alphabet is constant. Amazon ordering/rule-inference questions favor this topological modeling.

**Python:**
```python
from collections import deque

def alien_order(words: list[str]) -> str:
    graph: dict[str, set[str]] = {c: set() for w in words for c in w}
    indeg: dict[str, int] = {c: 0 for c in graph}
    for a, b in zip(words, words[1:]):
        for x, y in zip(a, b):
            if x != y:
                if y not in graph[x]:
                    graph[x].add(y)
                    indeg[y] += 1
                break
        else:
            if len(a) > len(b):
                return ""
    q = deque([c for c in indeg if indeg[c] == 0])
    order: list[str] = []
    while q:
        c = q.popleft()
        order.append(c)
        for nxt in graph[c]:
            indeg[nxt] -= 1
            if indeg[nxt] == 0:
                q.append(nxt)
    return "".join(order) if len(order) == len(indeg) else ""
```

**TypeScript:**
```typescript
function alienOrder(words: string[]): string {
  const graph = new Map<string, Set<string>>();
  const indeg = new Map<string, number>();
  for (const w of words) for (const c of w) {
    if (!graph.has(c)) { graph.set(c, new Set()); indeg.set(c, 0); }
  }
  for (let i = 0; i + 1 < words.length; i++) {
    const a = words[i], b = words[i + 1];
    let j = 0;
    const min = Math.min(a.length, b.length);
    while (j < min && a[j] === b[j]) j++;
    if (j === min) { if (a.length > b.length) return ""; continue; }
    if (!graph.get(a[j])!.has(b[j])) {
      graph.get(a[j])!.add(b[j]);
      indeg.set(b[j], indeg.get(b[j])! + 1);
    }
  }
  const q: string[] = [];
  for (const [c, d] of indeg) if (d === 0) q.push(c);
  const order: string[] = [];
  while (q.length) {
    const c = q.shift()!;
    order.push(c);
    for (const nxt of graph.get(c)!) {
      indeg.set(nxt, indeg.get(nxt)! - 1);
      if (indeg.get(nxt) === 0) q.push(nxt);
    }
  }
  return order.length === indeg.size ? order.join("") : "";
}
```

**Java:**
```java
class Solution {
    public String alienOrder(String[] words) {
        Map<Character, Set<Character>> graph = new HashMap<>();
        Map<Character, Integer> indeg = new HashMap<>();
        for (String w : words) for (char c : w.toCharArray()) {
            graph.putIfAbsent(c, new HashSet<>());
            indeg.putIfAbsent(c, 0);
        }
        for (int i = 0; i + 1 < words.length; i++) {
            String a = words[i], b = words[i + 1];
            int min = Math.min(a.length(), b.length()), j = 0;
            while (j < min && a.charAt(j) == b.charAt(j)) j++;
            if (j == min) { if (a.length() > b.length()) return ""; continue; }
            char x = a.charAt(j), y = b.charAt(j);
            if (graph.get(x).add(y)) indeg.merge(y, 1, Integer::sum);
        }
        Deque<Character> q = new ArrayDeque<>();
        for (var e : indeg.entrySet()) if (e.getValue() == 0) q.add(e.getKey());
        StringBuilder sb = new StringBuilder();
        while (!q.isEmpty()) {
            char c = q.poll();
            sb.append(c);
            for (char nxt : graph.get(c)) if (indeg.merge(nxt, -1, Integer::sum) == 0) q.add(nxt);
        }
        return sb.length() == indeg.size() ? sb.toString() : "";
    }
}
```

**Key points:**
- Add exactly one edge from the first differing char of each adjacent pair.
- If the topological order's length differs from the char count, a cycle exists — return "".
- A longer word that is a prefix of an earlier shorter word is invalid; handle it separately.

**Follow-ups:**
- How do you detect whether the answer is unique? (More than one node in the queue at any step means non-unique.)
- How would you enumerate all valid orderings? (Backtracking over topological orders.)

**Common Pitfalls:**
- Missing the invalid prefix case like `["abc", "ab"]`.
- Adding a duplicate edge and over-counting in-degree.

**Tags:** #algorithm

---

### 30. Cheapest Flights Within K Stops

**Difficulty:** Medium
**Topics:** graph, shortest-path, bellman-ford, bfs
**Position:** SWE
**Years:** L5

**Question:** There are `n` cities and flights `flights[i] = [from, to, price]`. Find the cheapest price from `src` to `dst` using at most `k` stops; return -1 if none exists.

**Approach:** Shortest path with a hop limit, done with Bellman-Ford relaxing `k+1` rounds. Each round updates from the previous round's distance snapshot, so after round i you hold the shortest distance using at most i edges — exactly bounding the number of stops. Time O(k * E), space O(n). This "optimal path under a hop constraint" maps directly to Amazon logistics/delivery cost optimization under a bounded number of handoffs.

**Python:**
```python
def find_cheapest_price(n: int, flights: list[list[int]], src: int, dst: int, k: int) -> int:
    INF = float('inf')
    dist = [INF] * n
    dist[src] = 0
    for _ in range(k + 1):
        prev = dist[:]
        for u, v, w in flights:
            if prev[u] + w < dist[v]:
                dist[v] = prev[u] + w
    return -1 if dist[dst] == INF else dist[dst]
```

**TypeScript:**
```typescript
function findCheapestPrice(n: number, flights: number[][], src: number, dst: number, k: number): number {
  const INF = Infinity;
  let dist = new Array<number>(n).fill(INF);
  dist[src] = 0;
  for (let i = 0; i <= k; i++) {
    const prev = dist.slice();
    for (const [u, v, w] of flights) {
      if (prev[u] + w < dist[v]) dist[v] = prev[u] + w;
    }
  }
  return dist[dst] === INF ? -1 : dist[dst];
}
```

**Java:**
```java
class Solution {
    public int findCheapestPrice(int n, int[][] flights, int src, int dst, int k) {
        final int INF = Integer.MAX_VALUE;
        int[] dist = new int[n];
        Arrays.fill(dist, INF);
        dist[src] = 0;
        for (int i = 0; i <= k; i++) {
            int[] prev = dist.clone();
            for (int[] f : flights) {
                int u = f[0], v = f[1], w = f[2];
                if (prev[u] != INF && prev[u] + w < dist[v]) dist[v] = prev[u] + w;
            }
        }
        return dist[dst] == INF ? -1 : dist[dst];
    }
}
```

**Key points:**
- Exactly k+1 relaxation rounds corresponds to "at most k stops (k+1 edges)."
- Each round must relax from the previous snapshot `prev`, or multiple edges could chain within one round and blow the hop count.
- O(k * E); no heap required.

**Follow-ups:**
- How would a Dijkstra with state (city, hops used) work, and what are the trade-offs?
- What if edge weights can be negative? (Bellman-Ford handles it, but beware negative cycles.)

**Common Pitfalls:**
- Relaxing in place without a snapshot, letting more than one edge propagate per round.
- In Java, adding without checking `prev[u] != INF` causes integer overflow.

**Tags:** #algorithm

---

## Heap / Priority Queue

### 31. Top K Frequent Elements

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

### 32. Trapping Rain Water II

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

### 33. Cut Off Trees for Golf Event

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

### 34. K Closest Points to Origin

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

### 35. Meeting Rooms II

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

### 36. Find Median from Data Stream

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

### 37. Min Cost to Connect Ropes

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

### 38. Reorganize String

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

### 39. Kth Largest Element in an Array

**Difficulty:** Medium
**Topics:** heap, quickselect, sorting
**Position:** SDE
**Years:** L5

**Question:** Given an integer array `nums` and integer `k`, return the `k`th largest element in the array (kth largest by value, not the kth distinct element).

**Approach:** Maintain a min-heap of size `k`: push each element, pop when size exceeds `k`. The heap's root is the kth largest. O(n log k) time, O(k) space — ideal for streaming/large `n` like ranking top sellers. Quickselect partitions around a pivot for O(n) average, O(n^2) worst.

**Python:**
```python
import heapq

def findKthLargest(nums: list[int], k: int) -> int:
    heap: list[int] = []
    for x in nums:
        heapq.heappush(heap, x)
        if len(heap) > k:
            heapq.heappop(heap)
    return heap[0]
```

**TypeScript:**
```typescript
function findKthLargest(nums: number[], k: number): number {
  const heap: number[] = [];
  for (const x of nums) {
    heap.push(x);
    heap.sort((a, b) => a - b);
    if (heap.length > k) heap.shift();
  }
  return heap[0];
}
```

**Java:**
```java
class Solution {
    public int findKthLargest(int[] nums, int k) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        for (int x : nums) {
            heap.offer(x);
            if (heap.size() > k) heap.poll();
        }
        return heap.peek();
    }
}
```

**Key points:**
- A min-heap of size k keeps exactly the k largest seen; its root is the answer.
- O(n log k) beats a full sort's O(n log n) when k is small.
- Quickselect gives O(n) average but is harder to get right under interview pressure.

**Follow-ups:**
- How would you handle a data stream where `n` is unbounded? (The size-k heap already works online.)
- Implement the Quickselect variant and analyze its worst case.

**Common Pitfalls:**
- Using a max-heap of size n wastes memory and is O(n log n); the min-heap of size k is the tighter solution.
- Confusing kth largest by value with kth distinct value.

**Tags:** #algorithm

---

### 40. Top K Frequent Words

**Difficulty:** Medium
**Topics:** heap, hash-table, sorting
**Position:** SDE
**Years:** L5

**Question:** Given a list of `words` and integer `k`, return the `k` most frequent words, sorted by frequency descending; ties broken by lexicographical (alphabetical) order.

**Approach:** Count frequencies with a hash map, then select the top k by the composite key `(-freq, word)`. A size-k heap keeping the k best runs in O(n log k). Common Amazon framing: top search terms or trending queries. Careful tie-breaking is the crux.

**Python:**
```python
import heapq
from collections import Counter

def topKFrequent(words: list[str], k: int) -> list[str]:
    count = Counter(words)
    return heapq.nsmallest(k, count, key=lambda w: (-count[w], w))
```

**TypeScript:**
```typescript
function topKFrequent(words: string[], k: number): string[] {
  const count = new Map<string, number>();
  for (const w of words) count.set(w, (count.get(w) ?? 0) + 1);
  return [...count.keys()]
    .sort((a, b) => count.get(b)! - count.get(a)! || a.localeCompare(b))
    .slice(0, k);
}
```

**Java:**
```java
class Solution {
    public List<String> topKFrequent(String[] words, int k) {
        Map<String, Integer> count = new HashMap<>();
        for (String w : words) count.merge(w, 1, Integer::sum);
        PriorityQueue<String> heap = new PriorityQueue<>((a, b) ->
            count.get(a).equals(count.get(b)) ? b.compareTo(a) : count.get(a) - count.get(b));
        for (String w : count.keySet()) {
            heap.offer(w);
            if (heap.size() > k) heap.poll();
        }
        List<String> out = new ArrayList<>();
        while (!heap.isEmpty()) out.add(heap.poll());
        Collections.reverse(out);
        return out;
    }
}
```

**Key points:**
- Sort key `(-freq, word)` encodes frequency-desc then alphabetical-asc in one comparison.
- Size-k heap gives O(n log k); a full sort is O(n log n) but simpler to reason about.
- With a min-heap, invert the tie-break (larger word on top) so popping keeps the correct k.

**Follow-ups:**
- What if k equals the number of distinct words? (Full sort is then unavoidable.)
- How would you shard this across machines for billions of query logs?

**Common Pitfalls:**
- Getting the tie-break direction backwards when using a min-heap of size k.
- Forgetting to reverse the heap output, yielding ascending instead of descending order.

**Tags:** #algorithm

---

## Stack / Queue

### 41. Sliding Window Maximum

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

### 42. Min Stack

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

### 43. Design Hit Counter

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

### 44. Valid Parentheses

**Difficulty:** Easy
**Topics:** stack, string
**Position:** SDE
**Years:** L4

**Question:** Given a string `s` containing only `()[]{}`, determine if the input is valid — every open bracket is closed by the same type in the correct order.

**Approach:** Push the expected closing bracket for each opener onto a stack; on a closer, it must match the stack top. Valid iff every closer matches and the stack is empty at the end. O(n) time, O(n) space. A canonical warm-up for validating nested structures (e.g. JSON/config parsing).

**Python:**
```python
def isValid(s: str) -> bool:
    pairs = {')': '(', ']': '[', '}': '{'}
    stack: list[str] = []
    for c in s:
        if c in pairs:
            if not stack or stack.pop() != pairs[c]:
                return False
        else:
            stack.append(c)
    return not stack
```

**TypeScript:**
```typescript
function isValid(s: string): boolean {
  const pairs: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
  const stack: string[] = [];
  for (const c of s) {
    if (c in pairs) {
      if (stack.pop() !== pairs[c]) return false;
    } else {
      stack.push(c);
    }
  }
  return stack.length === 0;
}
```

**Java:**
```java
class Solution {
    public boolean isValid(String s) {
        Deque<Character> stack = new ArrayDeque<>();
        for (char c : s.toCharArray()) {
            if (c == '(') stack.push(')');
            else if (c == '[') stack.push(']');
            else if (c == '{') stack.push('}');
            else if (stack.isEmpty() || stack.pop() != c) return false;
        }
        return stack.isEmpty();
    }
}
```

**Key points:**
- Stack matches the LIFO nature of nested brackets.
- Must check both mismatch and a non-empty leftover stack at the end.
- Pushing the expected closer keeps the comparison a single equality check.

**Follow-ups:**
- Support wildcard `*` that can be `(`, `)`, or empty (LeetCode 678).
- Return the index of the first invalid character instead of a boolean.

**Common Pitfalls:**
- Popping from an empty stack when a closer arrives first — guard with an emptiness check.
- Returning `true` while the stack still holds unclosed openers.

**Tags:** #algorithm

---

### 45. Daily Temperatures

**Difficulty:** Medium
**Topics:** stack, monotonic-stack, array
**Position:** SDE
**Years:** L5

**Question:** Given daily `temperatures`, return an array `answer` where `answer[i]` is the number of days you must wait after day `i` for a warmer temperature, or `0` if none.

**Approach:** Keep a monotonically decreasing stack of indices. For each day, while the current temperature exceeds the temperature at the stack top, pop that index and record the gap. Each index is pushed and popped once — O(n) time, O(n) space. This "next greater element" pattern powers metrics like time-to-restock.

**Python:**
```python
def dailyTemperatures(temperatures: list[int]) -> list[int]:
    res = [0] * len(temperatures)
    stack: list[int] = []  # indices, decreasing temps
    for i, t in enumerate(temperatures):
        while stack and temperatures[stack[-1]] < t:
            j = stack.pop()
            res[j] = i - j
        stack.append(i)
    return res
```

**TypeScript:**
```typescript
function dailyTemperatures(temperatures: number[]): number[] {
  const res = new Array<number>(temperatures.length).fill(0);
  const stack: number[] = [];
  for (let i = 0; i < temperatures.length; i++) {
    while (stack.length && temperatures[stack[stack.length - 1]] < temperatures[i]) {
      const j = stack.pop()!;
      res[j] = i - j;
    }
    stack.push(i);
  }
  return res;
}
```

**Java:**
```java
class Solution {
    public int[] dailyTemperatures(int[] temperatures) {
        int n = temperatures.length;
        int[] res = new int[n];
        Deque<Integer> stack = new ArrayDeque<>();
        for (int i = 0; i < n; i++) {
            while (!stack.isEmpty() && temperatures[stack.peek()] < temperatures[i]) {
                int j = stack.pop();
                res[j] = i - j;
            }
            stack.push(i);
        }
        return res;
    }
}
```

**Key points:**
- Store indices, not values, so you can compute the day gap directly.
- The monotonic-decreasing stack guarantees each element is pushed/popped once — amortized O(n).
- Unresolved indices keep their default `0`.

**Follow-ups:**
- Return the actual warmer temperature instead of the day count.
- Handle a streaming feed where temperatures arrive one at a time.

**Common Pitfalls:**
- Pushing values instead of indices, losing the ability to compute `i - j`.
- Using `<=` instead of `<`, which mishandles equal consecutive temperatures.

**Tags:** #algorithm

---

## Hash Table

### 46. Two Sum

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

### 47. Most Common Word

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

### 48. Analyze User Website Visit Pattern

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

### 49. Group Anagrams

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

### 50. Valid Sudoku

**Difficulty:** Medium
**Topics:** hash-table, array, matrix
**Position:** SWE
**Years:** L5

**Question:** Determine whether a 9x9 Sudoku board is valid, checking only the filled cells (`.` marks empty); it need not be solvable.

**Approach:** Scan once; for each filled digit check its row, column, and 3x3 box for duplicates. Keep three groups of sets (9 rows, 9 cols, 9 boxes); the box index is `(r // 3) * 3 + c // 3`. Time O(81) = O(1), space O(1).

**Python:**
```python
def is_valid_sudoku(board: list[list[str]]) -> bool:
    rows: list[set[str]] = [set() for _ in range(9)]
    cols: list[set[str]] = [set() for _ in range(9)]
    boxes: list[set[str]] = [set() for _ in range(9)]
    for r in range(9):
        for c in range(9):
            v = board[r][c]
            if v == ".":
                continue
            b = (r // 3) * 3 + c // 3
            if v in rows[r] or v in cols[c] or v in boxes[b]:
                return False
            rows[r].add(v)
            cols[c].add(v)
            boxes[b].add(v)
    return True
```

**TypeScript:**
```typescript
function isValidSudoku(board: string[][]): boolean {
  const rows = Array.from({ length: 9 }, () => new Set<string>());
  const cols = Array.from({ length: 9 }, () => new Set<string>());
  const boxes = Array.from({ length: 9 }, () => new Set<string>());
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = board[r][c];
      if (v === ".") continue;
      const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
      if (rows[r].has(v) || cols[c].has(v) || boxes[b].has(v)) return false;
      rows[r].add(v);
      cols[c].add(v);
      boxes[b].add(v);
    }
  }
  return true;
}
```

**Java:**
```java
class Solution {
    public boolean isValidSudoku(char[][] board) {
        Set<String> seen = new HashSet<>();
        for (int r = 0; r < 9; r++) {
            for (int c = 0; c < 9; c++) {
                char v = board[r][c];
                if (v == '.') continue;
                int b = (r / 3) * 3 + c / 3;
                if (!seen.add("r" + r + v) || !seen.add("c" + c + v) || !seen.add("b" + b + v))
                    return false;
            }
        }
        return true;
    }
}
```

**Key points:**
- Only three constraints matter: row, column, and box; any duplicate makes it invalid.
- The box index `(r // 3) * 3 + c // 3` maps the 9 boxes to 0..8.
- The board is fixed 9x9, so time and space are both O(1).

**Follow-ups:**
- How would you actually solve the Sudoku (backtracking with pruning)?
- How does this generalize to an NxN board?

**Common Pitfalls:**
- Forgetting to skip `.` and validating empty cells as digits.
- Miscomputing the box index (e.g. `r // 3 + c // 3`), causing cross-box false positives.

**Tags:** #algorithm

---

### 51. Longest Consecutive Sequence

**Difficulty:** Medium
**Topics:** hash-table, union-find, array
**Position:** SDE
**Years:** L5

**Question:** Given an unsorted array `nums`, return the length of the longest run of consecutive integers. Must run in O(n) time.

**Approach:** Put all numbers in a hash set. Only start counting from a number that has no predecessor (`x - 1` absent) — that is a run's beginning. Walk `x+1, x+2, ...` while present. Each number is visited at most twice, giving O(n) total despite the nested loop. O(n) space.

**Python:**
```python
def longestConsecutive(nums: list[int]) -> int:
    s = set(nums)
    best = 0
    for x in s:
        if x - 1 not in s:  # start of a run
            length = 1
            while x + length in s:
                length += 1
            best = max(best, length)
    return best
```

**TypeScript:**
```typescript
function longestConsecutive(nums: number[]): number {
  const set = new Set(nums);
  let best = 0;
  for (const x of set) {
    if (!set.has(x - 1)) {
      let length = 1;
      while (set.has(x + length)) length++;
      best = Math.max(best, length);
    }
  }
  return best;
}
```

**Java:**
```java
class Solution {
    public int longestConsecutive(int[] nums) {
        Set<Integer> set = new HashSet<>();
        for (int x : nums) set.add(x);
        int best = 0;
        for (int x : set) {
            if (!set.contains(x - 1)) {
                int length = 1;
                while (set.contains(x + length)) length++;
                best = Math.max(best, length);
            }
        }
        return best;
    }
}
```

**Key points:**
- The `x - 1 not in set` check ensures each run is expanded exactly once.
- Total inner-loop work is bounded by n, so the algorithm stays O(n).
- A hash set gives O(1) membership, which sorting (O(n log n)) cannot beat here.

**Follow-ups:**
- Also return the actual sequence, not just its length.
- Solve with Union-Find and compare trade-offs.

**Common Pitfalls:**
- Iterating over the raw array (with duplicates) instead of the set can degrade to O(n^2).
- Starting a count from every element without the predecessor check breaks the O(n) bound.

**Tags:** #algorithm

---

## Binary Search

### 52. Find First and Last Position of Element in Sorted Array

**Difficulty:** Medium
**Topics:** binary-search, array
**Position:** SDE
**Years:** L5

**Question:** Given a sorted array `nums` and a `target`, return `[first, last]` — the starting and ending indices of `target`. Return `[-1, -1]` if absent. Must run in O(log n).

**Approach:** Two binary searches for the boundaries: the left bound (first index >= target) and the right bound (first index > target, minus one). If the left bound is out of range or does not equal target, the value is absent. O(log n) time, O(1) space.

**Python:**
```python
import bisect

def searchRange(nums: list[int], target: int) -> list[int]:
    lo = bisect.bisect_left(nums, target)
    if lo == len(nums) or nums[lo] != target:
        return [-1, -1]
    hi = bisect.bisect_right(nums, target) - 1
    return [lo, hi]
```

**TypeScript:**
```typescript
function searchRange(nums: number[], target: number): number[] {
  const bound = (isLeft: boolean): number => {
    let lo = 0, hi = nums.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (nums[mid] > target || (isLeft && nums[mid] === target)) hi = mid;
      else lo = mid + 1;
    }
    return lo;
  };
  const left = bound(true);
  if (left === nums.length || nums[left] !== target) return [-1, -1];
  return [left, bound(false) - 1];
}
```

**Java:**
```java
class Solution {
    public int[] searchRange(int[] nums, int target) {
        int left = bound(nums, target, true);
        if (left == nums.length || nums[left] != target) return new int[]{-1, -1};
        return new int[]{left, bound(nums, target, false) - 1};
    }
    private int bound(int[] nums, int target, boolean isLeft) {
        int lo = 0, hi = nums.length;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (nums[mid] > target || (isLeft && nums[mid] == target)) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
}
```

**Key points:**
- Left bound = first index >= target; right bound = first index > target.
- Validate the left bound against the array length before dereferencing.
- Both searches use the half-open `[lo, hi)` invariant, avoiding off-by-one bugs.

**Follow-ups:**
- Count occurrences of target (right bound minus left bound).
- Adapt to find the insertion point when the target is missing.

**Common Pitfalls:**
- Accessing `nums[left]` without first checking `left == nums.length`.
- Mixing closed and half-open interval conventions between the two searches.

**Tags:** #algorithm

---

### 53. Find Minimum in Rotated Sorted Array

**Difficulty:** Medium
**Topics:** binary-search, array
**Position:** SDE
**Years:** L5

**Question:** A sorted array of distinct integers is rotated at an unknown pivot. Find the minimum element in O(log n).

**Approach:** Binary search comparing `nums[mid]` to `nums[hi]`. If `nums[mid] > nums[hi]`, the minimum lies to the right (`lo = mid + 1`); otherwise it is at `mid` or to the left (`hi = mid`). Converges to the rotation point. O(log n) time, O(1) space. Comparing to `hi` (not `lo`) avoids ambiguity on a non-rotated array.

**Python:**
```python
def findMin(nums: list[int]) -> int:
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
- Compare against `nums[hi]`, not `nums[lo]`, to correctly handle the already-sorted case.
- The loop condition `lo < hi` converges to a single index without a separate found-check.
- Distinct values assumed; duplicates would degrade the worst case to O(n).

**Follow-ups:**
- Handle duplicates (LeetCode 154) and explain the O(n) worst case.
- Return the rotation count (index of the minimum).

**Common Pitfalls:**
- Comparing `nums[mid]` to `nums[lo]`, which mishandles a non-rotated array.
- Using `lo <= hi` or `hi = mid - 1`, which can skip the true minimum.

**Tags:** #algorithm

---

### 54. Koko Eating Bananas

**Difficulty:** Medium
**Topics:** binary-search, search-on-answer
**Position:** SDE
**Years:** L5

**Question:** Given `piles` of bananas and `h` hours, Koko eats at speed `k` bananas/hour (finishing at most one pile per hour). Return the minimum integer `k` such that she finishes all piles within `h` hours.

**Approach:** Binary search on the answer `k` in `[1, max(piles)]`. Hours needed at speed `k` is `sum(ceil(p / k))`, which is monotonically non-increasing in `k`. Find the smallest `k` whose total hours is `<= h`. O(n log(max pile)) time. This throughput/rate-tuning pattern is common for provisioning capacity.

**Python:**
```python
def minEatingSpeed(piles: list[int], h: int) -> int:
    def hours(speed: int) -> int:
        return sum((p + speed - 1) // speed for p in piles)
    lo, hi = 1, max(piles)
    while lo < hi:
        mid = (lo + hi) // 2
        if hours(mid) <= h:
            hi = mid
        else:
            lo = mid + 1
    return lo
```

**TypeScript:**
```typescript
function minEatingSpeed(piles: number[], h: number): number {
  const hours = (speed: number): number =>
    piles.reduce((sum, p) => sum + Math.ceil(p / speed), 0);
  let lo = 1, hi = Math.max(...piles);
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (hours(mid) <= h) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}
```

**Java:**
```java
class Solution {
    public int minEatingSpeed(int[] piles, int h) {
        int lo = 1, hi = 0;
        for (int p : piles) hi = Math.max(hi, p);
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (hours(piles, mid) <= h) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
    private long hours(int[] piles, int speed) {
        long total = 0;
        for (int p : piles) total += (p + speed - 1) / speed;
        return total;
    }
}
```

**Key points:**
- "Binary search on the answer": the feasibility predicate is monotonic in `k`.
- Ceiling division `(p + k - 1) / k` counts whole hours per pile.
- Search space upper bound is `max(piles)`, since a faster speed never helps.

**Follow-ups:**
- What if Koko could split time across piles within an hour? (Changes the hours formula.)
- Generalize to "minimum capacity to ship within D days" (LeetCode 1011).

**Common Pitfalls:**
- Starting `lo` at 0 causes a division-by-zero in the hours function.
- Accumulating hours in a 32-bit int can overflow for large piles; use a wider type.

**Tags:** #algorithm

---

## Dynamic Programming

### 55. Trapping Rain Water

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

### 56. Maximum Subarray (Kadane's)

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

### 57. Maximum Profit in Job Scheduling

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

### 58. Coin Change

**Difficulty:** Medium
**Topics:** dp, arrays, bfs
**Position:** SWE
**Years:** L5

**Question:** Given coin denominations `coins` and an amount, return the fewest number of coins needed to make up that amount, or `-1` if it cannot be made.

**Approach:** Unbounded knapsack. `dp[a]` = min coins to make amount `a`. Transition: `dp[a] = min(dp[a - c] + 1)` over all coins `c <= a`. Initialize `dp[0] = 0` and the rest to a sentinel (amount + 1). Time O(amount * coins), space O(amount). Greedy fails for arbitrary denominations, so DP is required — the same reasoning appears in pricing/checkout make-change flows.

**Python:**
```python
def coin_change(coins: list[int], amount: int) -> int:
    dp = [amount + 1] * (amount + 1)
    dp[0] = 0
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a:
                dp[a] = min(dp[a], dp[a - c] + 1)
    return dp[amount] if dp[amount] <= amount else -1
```

**TypeScript:**
```typescript
function coinChange(coins: number[], amount: number): number {
  const dp = new Array<number>(amount + 1).fill(amount + 1);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) {
      if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
    }
  }
  return dp[amount] <= amount ? dp[amount] : -1;
}
```

**Java:**
```java
class Solution {
    public int coinChange(int[] coins, int amount) {
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, amount + 1);
        dp[0] = 0;
        for (int a = 1; a <= amount; a++) {
            for (int c : coins) {
                if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
            }
        }
        return dp[amount] <= amount ? dp[amount] : -1;
    }
}
```

**Key points:**
- Sentinel `amount + 1` is safely larger than any real answer and avoids overflow.
- Bottom-up avoids recursion depth issues; each amount depends only on smaller amounts.
- Greedy (always take largest coin) is incorrect for denominations like `[1, 3, 4]` making `6`.

**Follow-ups:**
- Count the number of distinct combinations (Coin Change II) — iterate coins in the outer loop.
- Return the actual coin set, not just the count — track a parent pointer per amount.

**Common Pitfalls:**
- Using `Integer.MAX_VALUE` as the sentinel and then doing `+ 1` overflows; use `amount + 1`.
- Forgetting the `-1` case when the amount is unreachable.

**Tags:** #algorithm

---

### 59. Longest Increasing Subsequence

**Difficulty:** Medium
**Topics:** dp, binary-search, arrays
**Position:** SWE
**Years:** L5

**Question:** Given an integer array `nums`, return the length of the longest strictly increasing subsequence.

**Approach:** Patience sorting. Maintain `tails`, where `tails[i]` is the smallest possible tail of an increasing subsequence of length `i + 1`. For each number, binary-search the leftmost tail `>= num` and replace it (or append if none). The length of `tails` is the answer. Time O(n log n), space O(n). The classic O(n^2) DP (`dp[i] = 1 + max(dp[j])` for `nums[j] < nums[i]`) also works but is slower — relevant when analyzing monotonic trends in metrics/telemetry.

**Python:**
```python
import bisect

def length_of_lis(nums: list[int]) -> int:
    tails: list[int] = []
    for x in nums:
        i = bisect.bisect_left(tails, x)
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
class Solution {
    public int lengthOfLIS(int[] nums) {
        int[] tails = new int[nums.length];
        int size = 0;
        for (int x : nums) {
            int lo = 0, hi = size;
            while (lo < hi) {
                int mid = (lo + hi) >>> 1;
                if (tails[mid] < x) lo = mid + 1;
                else hi = mid;
            }
            tails[lo] = x;
            if (lo == size) size++;
        }
        return size;
    }
}
```

**Key points:**
- `tails` is always sorted, which is what makes binary search valid.
- `bisect_left` / lower-bound gives strictly increasing; use upper-bound for non-decreasing.
- `tails` is not itself a valid subsequence, only its length is meaningful.

**Follow-ups:**
- Reconstruct one actual LIS — keep predecessor indices alongside the patience piles.
- Count the number of LIS of maximum length — combine length DP with count DP.

**Common Pitfalls:**
- Using upper-bound (`bisect_right`) yields the longest non-decreasing subsequence, not strictly increasing.
- Treating `tails` as the answer sequence — its contents can be an invalid subsequence.

**Tags:** #algorithm

---

### 60. Edit Distance

**Difficulty:** Hard
**Topics:** dp, strings, two-dimensional
**Position:** SWE
**Years:** L5-L6

**Question:** Given two strings `word1` and `word2`, return the minimum number of insert, delete, or replace operations to convert `word1` into `word2`.

**Approach:** 2D DP (Levenshtein). `dp[i][j]` = edit distance between `word1[:i]` and `word2[:j]`. If characters match, `dp[i][j] = dp[i-1][j-1]`; otherwise `1 + min(delete dp[i-1][j], insert dp[i][j-1], replace dp[i-1][j-1])`. Base cases: converting to/from an empty string costs its length. Time O(m*n), space O(m*n), reducible to O(min(m, n)) with a rolling row — used in fuzzy search / spell correction for product catalogs.

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
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
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
class Solution {
    public int minDistance(String word1, String word2) {
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
}
```

**Key points:**
- The three transitions map exactly to delete, insert, and replace.
- Base row/column encode converting an empty prefix, costing one op per character.
- On a match, carry the diagonal value with no added cost.

**Follow-ups:**
- Reduce space to O(min(m, n)) using two rolling rows.
- Weight operations differently (e.g. replace costs 2) — generalize the `min` terms.

**Common Pitfalls:**
- Off-by-one between string indices (`i - 1`) and DP indices (`i`).
- Forgetting to initialize the first row and column before the main loop.

**Tags:** #algorithm

---

### 61. Decode Ways

**Difficulty:** Medium
**Topics:** dp, strings
**Position:** SWE
**Years:** L5

**Question:** A message of digits is encoded where `'A'..'Z'` map to `"1".."26"`. Given a digit string `s`, return the number of ways to decode it.

**Approach:** 1D DP. `dp[i]` = number of decodings of the prefix `s[:i]`. From position `i`, take one digit (valid if `s[i-1] != '0'`) contributing `dp[i-1]`, and take two digits (valid if `s[i-2:i]` is in `10..26`) contributing `dp[i-2]`. Base: `dp[0] = 1` (empty string). Time O(n), space O(1) with two rolling variables. Careful zero-handling is the crux — the same edge-case discipline matters in parsing serialized order/tracking payloads.

**Python:**
```python
def num_decodings(s: str) -> int:
    if not s or s[0] == '0':
        return 0
    prev, cur = 1, 1  # dp[i-2], dp[i-1]
    for i in range(1, len(s)):
        cnt = 0
        if s[i] != '0':
            cnt += cur
        if '10' <= s[i - 1:i + 1] <= '26':
            cnt += prev
        prev, cur = cur, cnt
    return cur
```

**TypeScript:**
```typescript
function numDecodings(s: string): number {
  if (s.length === 0 || s[0] === '0') return 0;
  let prev = 1, cur = 1;
  for (let i = 1; i < s.length; i++) {
    let cnt = 0;
    if (s[i] !== '0') cnt += cur;
    const two = Number(s.slice(i - 1, i + 1));
    if (two >= 10 && two <= 26) cnt += prev;
    prev = cur;
    cur = cnt;
  }
  return cur;
}
```

**Java:**
```java
class Solution {
    public int numDecodings(String s) {
        if (s.isEmpty() || s.charAt(0) == '0') return 0;
        int prev = 1, cur = 1;
        for (int i = 1; i < s.length(); i++) {
            int cnt = 0;
            if (s.charAt(i) != '0') cnt += cur;
            int two = Integer.parseInt(s.substring(i - 1, i + 1));
            if (two >= 10 && two <= 26) cnt += prev;
            prev = cur;
            cur = cnt;
        }
        return cur;
    }
}
```

**Key points:**
- A leading `'0'` (or any standalone `'0'` not preceded by 1 or 2) makes the string undecodable.
- Two-digit block is valid only in the inclusive range `10..26`.
- O(1) space suffices because each state depends on the previous two.

**Follow-ups:**
- Support `'*'` wildcards matching any digit `1..9` (Decode Ways II) — expand the transition counts.
- Return the actual decodings, not just the count — switch to backtracking.

**Common Pitfalls:**
- Treating `'0'` as a valid single-digit decode; only `1..9` decode alone.
- Missing the range check, so blocks like `27` or `06` are wrongly counted.

**Tags:** #algorithm

---

## Backtracking

### 62. Combination Sum

**Difficulty:** Medium
**Topics:** backtracking, array, recursion
**Position:** SWE
**Years:** L5

**Question:** Given an array of distinct positive integers `candidates` and a target integer `target`, return all unique combinations of `candidates` that sum to `target`. Each number may be reused an unlimited number of times.

**Approach:** Classic backtracking with an index to prevent counting the same combination in different orders. At each step either reuse the current candidate (stay on `i`) or move on (`i + 1`). Amazon uses this shape for problems like assembling fulfillment packages that hit a target weight/value from reusable item types. Time O(N^(T/M)) where M is the smallest candidate, space O(T/M) for recursion depth.

**Python:**
```python
def combination_sum(candidates: list[int], target: int) -> list[list[int]]:
    res: list[list[int]] = []
    path: list[int] = []

    def backtrack(start: int, remaining: int) -> None:
        if remaining == 0:
            res.append(path[:])
            return
        for i in range(start, len(candidates)):
            if candidates[i] > remaining:
                continue
            path.append(candidates[i])
            backtrack(i, remaining - candidates[i])
            path.pop()

    backtrack(0, target)
    return res
```

**TypeScript:**
```typescript
function combinationSum(candidates: number[], target: number): number[][] {
  const res: number[][] = [];
  const path: number[] = [];

  const backtrack = (start: number, remaining: number): void => {
    if (remaining === 0) {
      res.push([...path]);
      return;
    }
    for (let i = start; i < candidates.length; i++) {
      if (candidates[i] > remaining) continue;
      path.push(candidates[i]);
      backtrack(i, remaining - candidates[i]);
      path.pop();
    }
  };

  backtrack(0, target);
  return res;
}
```

**Java:**
```java
class Solution {
    public List<List<Integer>> combinationSum(int[] candidates, int target) {
        List<List<Integer>> res = new ArrayList<>();
        backtrack(candidates, 0, target, new ArrayList<>(), res);
        return res;
    }

    private void backtrack(int[] c, int start, int remaining,
                           List<Integer> path, List<List<Integer>> res) {
        if (remaining == 0) {
            res.add(new ArrayList<>(path));
            return;
        }
        for (int i = start; i < c.length; i++) {
            if (c[i] > remaining) continue;
            path.add(c[i]);
            backtrack(c, i, remaining - c[i], path, res);
            path.remove(path.size() - 1);
        }
    }
}
```

**Key points:**
- Passing `i` (not `i + 1`) into recursion allows reuse of the same candidate.
- Advancing the start index prevents permutation duplicates like [2,3] and [3,2].
- Sorting first lets you `break` instead of `continue` once a candidate exceeds the remainder.

**Follow-ups:**
- Combination Sum II: candidates may repeat and each may be used once — skip duplicates at the same recursion depth.
- What if you only need the count of combinations, not the lists? Switch to DP for O(N*target).

**Common Pitfalls:**
- Reusing the same start of 0 in every call produces duplicate/permuted combinations.
- Forgetting to copy `path` (appending the mutable reference) corrupts all stored results.

**Tags:** #algorithm

---

### 63. Letter Combinations of a Phone Number

**Difficulty:** Medium
**Topics:** backtracking, string, recursion
**Position:** SWE
**Years:** L5

**Question:** Given a string of digits from 2-9, return all possible letter combinations the number could represent, using the classic telephone keypad mapping. Return an empty list for an empty input.

**Approach:** Backtrack over digit positions; for each digit expand every mapped letter and recurse to the next position. This maps directly to Alexa / voice-input style disambiguation where a keypad or phoneme code expands into candidate words. With `k` letters per digit and `n` digits, time is O(k^n * n) to build each string, space O(n) for recursion.

**Python:**
```python
def letter_combinations(digits: str) -> list[str]:
    if not digits:
        return []
    mapping = {"2": "abc", "3": "def", "4": "ghi", "5": "jkl",
               "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz"}
    res: list[str] = []
    path: list[str] = []

    def backtrack(i: int) -> None:
        if i == len(digits):
            res.append("".join(path))
            return
        for ch in mapping[digits[i]]:
            path.append(ch)
            backtrack(i + 1)
            path.pop()

    backtrack(0)
    return res
```

**TypeScript:**
```typescript
function letterCombinations(digits: string): string[] {
  if (!digits) return [];
  const mapping: Record<string, string> = {
    "2": "abc", "3": "def", "4": "ghi", "5": "jkl",
    "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz",
  };
  const res: string[] = [];
  const path: string[] = [];

  const backtrack = (i: number): void => {
    if (i === digits.length) {
      res.push(path.join(""));
      return;
    }
    for (const ch of mapping[digits[i]]) {
      path.push(ch);
      backtrack(i + 1);
      path.pop();
    }
  };

  backtrack(0);
  return res;
}
```

**Java:**
```java
class Solution {
    private static final String[] MAP = {
        "", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"
    };

    public List<String> letterCombinations(String digits) {
        List<String> res = new ArrayList<>();
        if (digits == null || digits.isEmpty()) return res;
        backtrack(digits, 0, new StringBuilder(), res);
        return res;
    }

    private void backtrack(String digits, int i, StringBuilder sb, List<String> res) {
        if (i == digits.length()) {
            res.add(sb.toString());
            return;
        }
        for (char ch : MAP[digits.charAt(i) - '0'].toCharArray()) {
            sb.append(ch);
            backtrack(digits, i + 1, sb, res);
            sb.deleteCharAt(sb.length() - 1);
        }
    }
}
```

**Key points:**
- The recursion depth equals the number of digits; the branching factor is 3 or 4 letters.
- Returning early for empty input avoids emitting a spurious empty string.
- An iterative BFS approach appends letters to a growing frontier — same complexity.

**Follow-ups:**
- Prune against a dictionary/trie so only real words survive (voice search).
- How would you rank output by likelihood? Attach a language-model score per candidate.

**Common Pitfalls:**
- Treating empty string as a valid combination and returning `[""]`.
- Off-by-one when indexing the mapping array (digits 0 and 1 have no letters).

**Tags:** #algorithm

---

## Two Pointers / Sliding Window

### 64. Longest Substring Without Repeating Characters

**Difficulty:** Medium
**Topics:** sliding-window, string, hashmap, two-pointers
**Position:** SWE
**Years:** L5

**Question:** Given a string `s`, return the length of the longest substring that contains no repeating characters.

**Approach:** Maintain a sliding window with two pointers and a hashmap of each character's last seen index. When a repeat falls inside the current window, jump the left pointer to just past its previous occurrence. This is a staple for stream/log dedup windows in Amazon's data pipelines. Time O(n), space O(min(n, charset)).

**Python:**
```python
def length_of_longest_substring(s: str) -> int:
    last: dict[str, int] = {}
    left = 0
    best = 0
    for right, ch in enumerate(s):
        if ch in last and last[ch] >= left:
            left = last[ch] + 1
        last[ch] = right
        best = max(best, right - left + 1)
    return best
```

**TypeScript:**
```typescript
function lengthOfLongestSubstring(s: string): number {
  const last = new Map<string, number>();
  let left = 0;
  let best = 0;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    const prev = last.get(ch);
    if (prev !== undefined && prev >= left) {
      left = prev + 1;
    }
    last.set(ch, right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}
```

**Java:**
```java
class Solution {
    public int lengthOfLongestSubstring(String s) {
        Map<Character, Integer> last = new HashMap<>();
        int left = 0, best = 0;
        for (int right = 0; right < s.length(); right++) {
            char ch = s.charAt(right);
            Integer prev = last.get(ch);
            if (prev != null && prev >= left) {
                left = prev + 1;
            }
            last.put(ch, right);
            best = Math.max(best, right - left + 1);
        }
        return best;
    }
}
```

**Key points:**
- Storing the last index lets `left` jump directly instead of shrinking one step at a time.
- The guard `last[ch] >= left` ignores duplicates that already fell outside the window.
- Window length is always `right - left + 1`.

**Follow-ups:**
- Return the substring itself, not just its length — track the best window bounds.
- Generalize to at most K distinct characters (a different sliding-window invariant).

**Common Pitfalls:**
- Not checking `last[ch] >= left`, which can move `left` backwards and overcount.
- Off-by-one in the window length calculation.

**Tags:** #algorithm

---

### 65. 3Sum

**Difficulty:** Medium
**Topics:** two-pointers, array, sorting
**Position:** SWE
**Years:** L5

**Question:** Given an integer array `nums`, return all unique triplets `[a, b, c]` such that `a + b + c == 0`. The solution set must not contain duplicate triplets.

**Approach:** Sort, then fix each index `i` and use two pointers converging from both ends of the remaining subarray to find pairs summing to `-nums[i]`. Skip equal values to avoid duplicate triplets. A frequent Amazon screen for reconciling offsetting transactions/refunds to zero. Time O(n^2), space O(1) beyond the output (or O(n) for the sort).

**Python:**
```python
def three_sum(nums: list[int]) -> list[list[int]]:
    nums.sort()
    res: list[list[int]] = []
    n = len(nums)
    for i in range(n - 2):
        if nums[i] > 0:
            break
        if i > 0 and nums[i] == nums[i - 1]:
            continue
        lo, hi = i + 1, n - 1
        while lo < hi:
            total = nums[i] + nums[lo] + nums[hi]
            if total < 0:
                lo += 1
            elif total > 0:
                hi -= 1
            else:
                res.append([nums[i], nums[lo], nums[hi]])
                lo += 1
                hi -= 1
                while lo < hi and nums[lo] == nums[lo - 1]:
                    lo += 1
                while lo < hi and nums[hi] == nums[hi + 1]:
                    hi -= 1
    return res
```

**TypeScript:**
```typescript
function threeSum(nums: number[]): number[][] {
  nums.sort((a, b) => a - b);
  const res: number[][] = [];
  const n = nums.length;
  for (let i = 0; i < n - 2; i++) {
    if (nums[i] > 0) break;
    if (i > 0 && nums[i] === nums[i - 1]) continue;
    let lo = i + 1, hi = n - 1;
    while (lo < hi) {
      const total = nums[i] + nums[lo] + nums[hi];
      if (total < 0) lo++;
      else if (total > 0) hi--;
      else {
        res.push([nums[i], nums[lo], nums[hi]]);
        lo++;
        hi--;
        while (lo < hi && nums[lo] === nums[lo - 1]) lo++;
        while (lo < hi && nums[hi] === nums[hi + 1]) hi--;
      }
    }
  }
  return res;
}
```

**Java:**
```java
class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> res = new ArrayList<>();
        int n = nums.length;
        for (int i = 0; i < n - 2; i++) {
            if (nums[i] > 0) break;
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            int lo = i + 1, hi = n - 1;
            while (lo < hi) {
                int total = nums[i] + nums[lo] + nums[hi];
                if (total < 0) lo++;
                else if (total > 0) hi--;
                else {
                    res.add(Arrays.asList(nums[i], nums[lo], nums[hi]));
                    lo++;
                    hi--;
                    while (lo < hi && nums[lo] == nums[lo - 1]) lo++;
                    while (lo < hi && nums[hi] == nums[hi + 1]) hi--;
                }
            }
        }
        return res;
    }
}
```

**Key points:**
- Sorting enables the two-pointer sweep and makes duplicate-skipping trivial.
- Skip duplicates at both the fixed index and after recording a match.
- Early `break` when `nums[i] > 0` since no positive triple can sum to zero.

**Follow-ups:**
- 3Sum Closest: track the triplet whose sum is nearest to a target.
- kSum generalization via recursion reducing to the two-pointer base case.

**Common Pitfalls:**
- Skipping duplicates before recording the first valid triplet, missing results.
- Using a hashset of triplets to dedup instead of pointer skips — works but wastes memory.

**Tags:** #algorithm

---

### 66. Minimum Window Substring

**Difficulty:** Hard
**Topics:** sliding-window, string, hashmap, two-pointers
**Position:** SWE
**Years:** L5-L6

**Question:** Given strings `s` and `t`, return the shortest substring of `s` that contains every character of `t` (including duplicates). If no such window exists, return the empty string.

**Approach:** Expand the right pointer to satisfy all required character counts, then contract from the left to shrink the window while still valid, tracking the best. A `formed` counter of how many required characters are fully matched avoids rescanning the whole map. Amazon uses this shape for finding the tightest log/event window containing a required set of signals. Time O(|s| + |t|), space O(charset).

**Python:**
```python
from collections import Counter

def min_window(s: str, t: str) -> str:
    if not s or not t or len(t) > len(s):
        return ""
    need = Counter(t)
    required = len(need)
    window: dict[str, int] = {}
    formed = 0
    left = 0
    best_len = float("inf")
    best_left = 0
    for right, ch in enumerate(s):
        window[ch] = window.get(ch, 0) + 1
        if ch in need and window[ch] == need[ch]:
            formed += 1
        while formed == required:
            if right - left + 1 < best_len:
                best_len = right - left + 1
                best_left = left
            lc = s[left]
            window[lc] -= 1
            if lc in need and window[lc] < need[lc]:
                formed -= 1
            left += 1
    return "" if best_len == float("inf") else s[best_left:best_left + best_len]
```

**TypeScript:**
```typescript
function minWindow(s: string, t: string): string {
  if (!s || !t || t.length > s.length) return "";
  const need = new Map<string, number>();
  for (const c of t) need.set(c, (need.get(c) ?? 0) + 1);
  const required = need.size;
  const window = new Map<string, number>();
  let formed = 0, left = 0, bestLen = Infinity, bestLeft = 0;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    window.set(ch, (window.get(ch) ?? 0) + 1);
    if (need.has(ch) && window.get(ch) === need.get(ch)) formed++;
    while (formed === required) {
      if (right - left + 1 < bestLen) {
        bestLen = right - left + 1;
        bestLeft = left;
      }
      const lc = s[left];
      window.set(lc, window.get(lc)! - 1);
      if (need.has(lc) && window.get(lc)! < need.get(lc)!) formed--;
      left++;
    }
  }
  return bestLen === Infinity ? "" : s.substring(bestLeft, bestLeft + bestLen);
}
```

**Java:**
```java
class Solution {
    public String minWindow(String s, String t) {
        if (s.length() == 0 || t.length() == 0 || t.length() > s.length()) return "";
        Map<Character, Integer> need = new HashMap<>();
        for (char c : t.toCharArray()) need.merge(c, 1, Integer::sum);
        int required = need.size();
        Map<Character, Integer> window = new HashMap<>();
        int formed = 0, left = 0, bestLen = Integer.MAX_VALUE, bestLeft = 0;
        for (int right = 0; right < s.length(); right++) {
            char ch = s.charAt(right);
            window.merge(ch, 1, Integer::sum);
            if (need.containsKey(ch) && window.get(ch).intValue() == need.get(ch).intValue()) formed++;
            while (formed == required) {
                if (right - left + 1 < bestLen) {
                    bestLen = right - left + 1;
                    bestLeft = left;
                }
                char lc = s.charAt(left);
                window.merge(lc, -1, Integer::sum);
                if (need.containsKey(lc) && window.get(lc) < need.get(lc)) formed--;
                left++;
            }
        }
        return bestLen == Integer.MAX_VALUE ? "" : s.substring(bestLeft, bestLeft + bestLen);
    }
}
```

**Key points:**
- `formed == required` means every distinct required char has met its full count.
- Contract from the left only while the window stays valid, capturing the minimum.
- Comparing counts by value (not identity) matters for boxed integers in Java.

**Follow-ups:**
- Return all minimum-length windows, not just the first.
- What changes if `t` can contain characters outside the ASCII range? Use a general map.

**Common Pitfalls:**
- Using Java `==` on `Integer` objects instead of `.intValue()`/`.equals()`.
- Updating `formed` on every count change instead of only when a threshold is crossed.

**Tags:** #algorithm

---

## Matrix

### 67. Sliding Puzzle

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

### 68. Design Tic-Tac-Toe

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

### 69. Rotting Oranges

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

### 70. Shortest Path in a Grid with Obstacles Elimination

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

## Array / String

### 71. Reorder Log Files

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

### 72. Robot Bounded in Circle

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

### 73. Prison Cells After N Days

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

### 74. Substrings of Size Three with Distinct Characters

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

### 75. Maximum Units on a Truck

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

### 76. Find the Winner of the Circular Game

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

### 77. Search in Rotated Sorted Array

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

### 78. Partition Labels

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

### 79. Multiply Strings

**Difficulty:** Medium
**Topics:** array, string, math
**Position:** SWE
**Years:** L5

**Question:** Given two non-negative integers `num1` and `num2` represented as strings, return their product as a string, without using any big-integer library or converting to an integer directly.

**Approach:** Simulate grade-school multiplication. The product of an m-digit and n-digit number has at most m+n digits; use an array of size m+n. `num1[i] * num2[j]` lands at index `i+j` (high) and `i+j+1` (low); accumulate first, then propagate carries. Strip leading zeros at the end. Time O(m·n), space O(m+n).

**Python:**
```python
def multiply(num1: str, num2: str) -> str:
    if num1 == "0" or num2 == "0":
        return "0"
    m, n = len(num1), len(num2)
    res = [0] * (m + n)
    for i in range(m - 1, -1, -1):
        for j in range(n - 1, -1, -1):
            mul = (ord(num1[i]) - 48) * (ord(num2[j]) - 48)
            total = mul + res[i + j + 1]
            res[i + j + 1] = total % 10
            res[i + j] += total // 10
    s = "".join(map(str, res)).lstrip("0")
    return s or "0"
```

**TypeScript:**
```typescript
function multiply(num1: string, num2: string): string {
  if (num1 === "0" || num2 === "0") return "0";
  const m = num1.length, n = num2.length;
  const res = new Array(m + n).fill(0);
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      const mul = (num1.charCodeAt(i) - 48) * (num2.charCodeAt(j) - 48);
      const total = mul + res[i + j + 1];
      res[i + j + 1] = total % 10;
      res[i + j] += Math.floor(total / 10);
    }
  }
  return res.join("").replace(/^0+/, "") || "0";
}
```

**Java:**
```java
class Solution {
    public String multiply(String num1, String num2) {
        if (num1.equals("0") || num2.equals("0")) return "0";
        int m = num1.length(), n = num2.length();
        int[] res = new int[m + n];
        for (int i = m - 1; i >= 0; i--) {
            for (int j = n - 1; j >= 0; j--) {
                int mul = (num1.charAt(i) - '0') * (num2.charAt(j) - '0');
                int total = mul + res[i + j + 1];
                res[i + j + 1] = total % 10;
                res[i + j] += total / 10;
            }
        }
        StringBuilder sb = new StringBuilder();
        for (int d : res) if (!(sb.length() == 0 && d == 0)) sb.append(d);
        return sb.length() == 0 ? "0" : sb.toString();
    }
}
```

**Key points:**
- `num1[i] * num2[j]` contributes exactly to result indices `i+j` and `i+j+1`.
- Accumulate all partial products first, then handle carries in one pass for clarity.
- The result has at most m+n digits; strip leading zeros.

**Follow-ups:**
- How would you support negatives or decimals?
- For huge numbers, can FFT bring this down to O(n log n)?

**Common Pitfalls:**
- Forgetting the "0" operand case, returning a string with leading zeros.
- Swapping the high/low carry indices `i+j` and `i+j+1`.

**Tags:** #algorithm

---

### 80. Product of Array Except Self

**Difficulty:** Medium
**Topics:** arrays, prefix-product
**Position:** SWE
**Years:** L5

**Question:** Given an integer array, return an array where each element is the product of all other elements, without using division and in O(n) time.

**Approach:** Two passes. First pass fills `res[i]` with the prefix product of everything before `i`; second pass multiplies in the suffix product of everything after `i`, carried in a running scalar. Division is banned (and would break on zeros anyway). O(n) time, O(1) extra space besides the output.

**Python:**
```python
def product_except_self(nums: list[int]) -> list[int]:
    n = len(nums)
    res = [1] * n
    prefix = 1
    for i in range(n):
        res[i] = prefix
        prefix *= nums[i]
    suffix = 1
    for i in range(n - 1, -1, -1):
        res[i] *= suffix
        suffix *= nums[i]
    return res
```

**TypeScript:**
```typescript
function productExceptSelf(nums: number[]): number[] {
  const n = nums.length;
  const res = new Array<number>(n).fill(1);
  let prefix = 1;
  for (let i = 0; i < n; i++) { res[i] = prefix; prefix *= nums[i]; }
  let suffix = 1;
  for (let i = n - 1; i >= 0; i--) { res[i] *= suffix; suffix *= nums[i]; }
  return res;
}
```

**Java:**
```java
class Solution {
    public int[] productExceptSelf(int[] nums) {
        int n = nums.length;
        int[] res = new int[n];
        int prefix = 1;
        for (int i = 0; i < n; i++) { res[i] = prefix; prefix *= nums[i]; }
        int suffix = 1;
        for (int i = n - 1; i >= 0; i--) { res[i] *= suffix; suffix *= nums[i]; }
        return res;
    }
}
```

**Key points:**
- Split the answer into prefix-product times suffix-product; neither includes `nums[i]`.
- The output array doubles as scratch space, so only O(1) extra memory is used.
- Avoiding division sidesteps zero-handling entirely.

**Follow-ups:**
- Handle overflow — return results modulo a large prime, or use 64-bit.
- Support live updates: recompute a single index cheaply (segment tree of products).
- What changes if division were allowed? (count zeros case-by-case.)

**Common Pitfalls:**
- Reaching for division and crashing when the array contains one or more zeros.
- Allocating separate prefix and suffix arrays and claiming O(1) space.

**Tags:** #algorithm

---

### 81. Longest Palindromic Substring

**Difficulty:** Medium
**Topics:** string, dynamic-programming, two-pointers
**Position:** SWE
**Years:** L5

**Question:** Given a string `s`, return the longest palindromic (contiguous) substring within it.

**Approach:** Expand around center. There are 2n-1 possible centers (each character and each gap between adjacent characters); expand outward from each and track the longest span. Time O(n²), space O(1). Manacher's algorithm solves it in O(n) but is more complex.

**Python:**
```python
def longest_palindrome(s: str) -> str:
    if not s:
        return ""
    start, end = 0, 0
    def expand(l: int, r: int) -> tuple[int, int]:
        while l >= 0 and r < len(s) and s[l] == s[r]:
            l -= 1
            r += 1
        return l + 1, r - 1
    for i in range(len(s)):
        l1, r1 = expand(i, i)
        l2, r2 = expand(i, i + 1)
        if r1 - l1 > end - start:
            start, end = l1, r1
        if r2 - l2 > end - start:
            start, end = l2, r2
    return s[start:end + 1]
```

**TypeScript:**
```typescript
function longestPalindrome(s: string): string {
  if (s.length === 0) return "";
  let start = 0, end = 0;
  const expand = (l: number, r: number): [number, number] => {
    while (l >= 0 && r < s.length && s[l] === s[r]) { l--; r++; }
    return [l + 1, r - 1];
  };
  for (let i = 0; i < s.length; i++) {
    const [l1, r1] = expand(i, i);
    const [l2, r2] = expand(i, i + 1);
    if (r1 - l1 > end - start) { start = l1; end = r1; }
    if (r2 - l2 > end - start) { start = l2; end = r2; }
  }
  return s.slice(start, end + 1);
}
```

**Java:**
```java
class Solution {
    public String longestPalindrome(String s) {
        if (s.isEmpty()) return "";
        int start = 0, end = 0;
        for (int i = 0; i < s.length(); i++) {
            int[] a = expand(s, i, i);
            int[] b = expand(s, i, i + 1);
            if (a[1] - a[0] > end - start) { start = a[0]; end = a[1]; }
            if (b[1] - b[0] > end - start) { start = b[0]; end = b[1]; }
        }
        return s.substring(start, end + 1);
    }
    private int[] expand(String s, int l, int r) {
        while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) { l--; r++; }
        return new int[]{l + 1, r - 1};
    }
}
```

**Key points:**
- Consider both odd (single center) and even (double center) palindromes at each position.
- Expand-around-center uses O(1) space, beating the O(n²) 2D DP table.
- Track the best span by start/end indices to avoid repeatedly copying substrings.

**Follow-ups:**
- How would you solve it in O(n) (Manacher's algorithm)?
- How would you count the total number of palindromic substrings?

**Common Pitfalls:**
- Handling only odd centers and missing even-length palindromes (e.g. "abba").
- Getting the span boundaries wrong when comparing odd vs even cases by length.

**Tags:** #algorithm

---

## Other Algorithms

### 82. Design a Parking Lot

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

## System Design

### 83. Design Amazon Prime Video

**Difficulty:** Hard
**Topics:** system-design, cdn, video-streaming, drm, recommendation, cloud
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

### 84. Design Amazon.com Product Page

**Difficulty:** Hard
**Topics:** system-design, caching, microservices, search
**Position:** Senior SWE
**Years:** L5

**Question:** Design the backend that powers an Amazon product detail page (title, price, inventory, reviews, recommendations) for millions of requests per second.

**Approach:** Page is composed from many services: product info (cached, write-through), price (real-time, may vary per user), inventory (eventually consistent counter), reviews (paginated, sharded by product_id), recommendations (precomputed). BFF (backend-for-frontend) aggregates with fan-out + timeout per service; render with available data on timeout (graceful degradation). Heavy edge cache for read-mostly fields. Discuss eventual consistency on inventory ("only 2 left!" can over-promise) and Black Friday spikes (pre-warm cache, auto-scale).

**Tags:** #system-design

---

### 85. Design Kindle Sync

**Difficulty:** Hard
**Topics:** system-design, sync, conflict-resolution, offline
**Position:** Senior SWE
**Years:** L5

**Question:** Design how Kindle syncs reading position, highlights, and notes across a user's devices, even when devices are intermittently offline.

**Approach:** Each device maintains local state + an op log. On reconnect, push ops to a per-user sync service. Server merges ops with last-write-wins for position (or "furthest read" for resilience to misclicks) and append-only for highlights/notes. Use vector clocks or HLC for ordering across devices. Store in DynamoDB sharded by user_id. Push notifications via SNS to peer devices. Discuss conflict cases (notes edited on two devices offline) and eventual convergence guarantees.

**Tags:** #system-design

---

### 86. Design Amazon S3

**Difficulty:** Hard
**Topics:** system-design, blob-storage, consistency, replication, cloud
**Position:** Senior SWE
**Years:** L5

**Question:** Design Amazon S3 — a globally available object storage service with strong read-after-write consistency.

**Approach:** Frontend API gateways → request routed by hash(bucket+key) to a shard. Each shard has a metadata service (sharded relational/KV) + erasure-coded object data across many storage nodes (e.g., Reed-Solomon 10+4). Multi-AZ replication; cross-region async replication for DR. Strong consistency via metadata coordinator (Paxos-based). Lifecycle (S3 → Glacier) via background tier-down jobs. Discuss durability math (11 nines), large object multipart upload, and how versioning is implemented (immutable object IDs + version stack in metadata).

**Tags:** #system-design

---

### 87. Design a Distributed Lock Service

**Difficulty:** Hard
**Topics:** system-design, consensus, paxos, zookeeper
**Position:** Senior SWE
**Years:** L5

**Question:** Design a distributed lock service (like Chubby or ZooKeeper) for AWS-internal use.

**Approach:** Raft/Paxos cluster of 5-7 nodes for consensus on lock state. Clients request lease-based locks (TTL) to handle client failure. Sessions/heartbeats: if client doesn't heartbeat, lock auto-releases. Discuss fencing tokens (monotonic counter passed to downstream service to reject stale lock holders — the famous Kleppmann argument). Trade-offs: strong consistency vs latency, single-region vs multi-region (don't put a lock service across regions without careful thought).

**Tags:** #system-design

---

### 88. Design Amazon Shopping Cart and Checkout

**Difficulty:** Hard
**Topics:** system-design, e-commerce, dynamodb, idempotency, consistency
**Position:** Senior SWE
**Years:** L5-L6

**Question:** Design the shopping cart and checkout flow for Amazon.com, handling hundreds of millions of users, cart persistence across devices, and correct behavior under high-concurrency sales events.

**Approach:** Cart service backed by DynamoDB keyed by `user_id` (or session id for guests), storing line items as `{product_id, qty, price_snapshot}`; merge guest cart into user cart on login. Cart writes are high-volume, read-your-writes; use DynamoDB with a write-through cache (DAX/ElastiCache). Checkout is a saga/state machine: (1) reserve inventory (conditional decrement with optimistic concurrency), (2) authorize payment, (3) create order, (4) confirm. Make each step idempotent via a client-supplied `idempotency_key` so retries do not double-charge or double-reserve. Price is re-validated at checkout (cart holds a snapshot, but the source of truth is the pricing service). Use SQS between stages for durability and back-pressure; compensating transactions release inventory / void auth on failure. Discuss eventual consistency of inventory (over-selling risk vs reservation TTL), Black Friday spikes (auto-scale, queue-based load leveling), and cross-region cart replication for latency.

**Follow-ups:**
- How do you prevent double-charge on a client retry or network timeout during payment?
- Inventory reservation TTL: what happens if a user abandons checkout after reserving?
- Cart merge conflicts when the same item exists on two devices — how to reconcile quantity?
- Flash-sale hot partition on a single popular product — how to avoid a DynamoDB hot key?

**Common Pitfalls:**
- Trusting the client-side cart price at checkout instead of re-validating server-side.
- Making checkout steps non-idempotent, so retries create duplicate orders or charges.

**Tags:** #system-design

---

### 89. Design a Distributed Message Queue like Amazon SQS

**Difficulty:** Hard
**Topics:** system-design, messaging, queue, durability, at-least-once
**Position:** Senior SWE
**Years:** L5-L6

**Question:** Design a horizontally scalable, durable message queue service like Amazon SQS supporting at-least-once delivery.

**Approach:** Front-end API layer (SendMessage / ReceiveMessage / DeleteMessage) behind a load balancer, authenticated per queue. Messages are partitioned across many storage nodes; each partition replicates writes to multiple nodes across AZs (quorum write) before acking the producer — that gives durability. Delivery is at-least-once: on receive, a message becomes invisible for a `visibility_timeout` instead of being deleted; the consumer must explicitly DeleteMessage after processing, otherwise it reappears for redelivery. This means consumers must be idempotent. Track redelivery count and route to a dead-letter queue after N attempts. Standard queues favor throughput with best-effort ordering; a FIFO variant uses a `message_group_id` for per-group ordering plus a dedup id for exactly-once-ish semantics within a window. Discuss long-polling to reduce empty receives, backlog metrics driving consumer auto-scaling, and why a strict global order across a distributed queue kills scalability.

**Follow-ups:**
- Why at-least-once and not exactly-once? What does the consumer owe in return?
- How does visibility timeout interact with a slow consumer that misses the deadline?
- Design the FIFO variant: how do you preserve ordering while still sharding?
- How do you keep a poison message from blocking a partition forever?

**Common Pitfalls:**
- Assuming exactly-once delivery and skipping idempotent consumer design.
- Promising strict global ordering, which forces a single partition and destroys throughput.

**Tags:** #system-design

---

### 90. Design Alexa Voice Assistant

**Difficulty:** Hard
**Topics:** system-design, speech, nlu, low-latency, streaming
**Position:** Senior SWE
**Years:** L5-L6

**Question:** Design the backend for Alexa: a user speaks to a device, and it responds with an action or spoken answer within a second or two.

**Approach:** Pipeline: wake-word detection runs on-device (cheap, private) to avoid streaming everything to the cloud. After the wake word, audio streams to the cloud over a persistent connection. Automatic Speech Recognition (ASR) transcribes streaming audio to text incrementally. Natural Language Understanding (NLU) maps text to an intent + slots (e.g. `PlayMusic{artist: ...}`). An orchestrator/dialog manager routes the intent to the right skill (first-party or third-party via the Skills API), which returns a response. Text-to-Speech (TTS) synthesizes the spoken reply, streamed back so playback starts before synthesis finishes. Latency is the hard constraint: stream at every stage, keep connections warm, run ASR/NLU/TTS as low-latency services, and colocate regionally. Personalization and context (device state, previous turn) live in a session store. Discuss privacy (on-device wake word, opt-out, data retention), multi-turn dialog state, and skill sandboxing/timeouts.

**Follow-ups:**
- How do you keep end-to-end latency under ~1s? Where is streaming essential?
- Multi-turn context ("play it" after "what song is this") — where does dialog state live?
- Third-party skill is slow or crashes — how do you isolate and degrade gracefully?
- Handling ambiguous intents or low ASR confidence — reprompt vs best guess?

**Common Pitfalls:**
- Streaming all audio to the cloud instead of gating with an on-device wake word (cost + privacy).
- Treating the flow as request/response batch instead of streaming, blowing the latency budget.

**Tags:** #system-design

---

## Behavioral

### 91. Tell me about a time you went above and beyond for a customer

**Difficulty:** Medium
**Topics:** behavioral, customer-obsession
**Position:** SWE
**Years:** L4

**Question:** Describe a time you went above and beyond to delight a customer.

**Approach:** STAR mapping to **Customer Obsession** (LP #1). "Customer" can be internal (another team) or external. Show: you proactively identified a need they hadn't articulated, you went outside your scope to fix it, and there was measurable customer impact. Avoid generic "I responded to a ticket quickly."

**Tags:** #behavioral

---

### 92. Tell me about a time you took on something significant outside your responsibility

**Difficulty:** Medium
**Topics:** behavioral, ownership, bias-for-action
**Position:** SWE
**Years:** L4

**Question:** Tell me about a time you took ownership of something that wasn't your job.

**Approach:** STAR mapping to **Ownership** and **Bias for Action**. Show: (1) you saw a gap and didn't wait for someone to assign it, (2) you didn't ask for permission for everything, (3) impact was real. Bonus: you stayed long-term — "I owned it for 6 months until we hired someone." Don't pick a story where you were really just doing your assigned job.

**Tags:** #behavioral

---

### 93. Tell me about a time you had to make a decision with incomplete information

**Difficulty:** Medium
**Topics:** behavioral, bias-for-action, are-right-a-lot
**Position:** Senior SWE
**Years:** L5

**Question:** Tell me about a time you had to make a quick decision without all the information you wanted.

**Approach:** STAR mapping to **Bias for Action** and **Are Right A Lot**. Show: (1) the cost of waiting was real and quantifiable, (2) you identified the smallest set of facts you needed, (3) you made the call and committed, (4) you had a rollback or course-correction plan. Decision being wrong is OK if you owned the recovery.

**Tags:** #behavioral

---

### 94. Tell me about your most challenging technical project

**Difficulty:** Medium
**Topics:** behavioral, dive-deep, deliver-results
**Position:** Senior SWE
**Years:** L5

**Question:** Walk me through your most technically complex project. What made it hard and what was your role?

**Approach:** STAR mapping to **Dive Deep** and **Deliver Results**. The bar raiser will grill you for 15-20 min on this one — be ready for "why that database?" / "what was the p99?" / "what would you redesign?" Pick a project you owned end-to-end with quantifiable outcome. If you can't speak to architecture trade-offs in detail, pick a different story.

**Tags:** #behavioral

---

### 95. Tell me about a time you invented a simpler solution to a complex problem

**Difficulty:** Medium
**Topics:** behavioral, invent-and-simplify, ownership
**Position:** Senior SWE
**Years:** L5

**Question:** Describe a time you found a significantly simpler way to solve a problem others were over-engineering.

**Approach:** STAR mapped to **Invent and Simplify** (LP #5). Interviewers want evidence you challenged the default, complex approach and found something materially simpler — fewer moving parts, less code, lower cost, or less operational burden — without cutting corners on correctness. Structure: (Situation) the complex plan on the table and why it was heavy; (Task) your role and the constraint; (Action) the insight or reframing that unlocked the simpler design, and how you got others to buy in; (Result) quantified simplification — e.g. "removed a service, cut p99 by 40%, dropped on-call pages in half." Strong answers show you invented (a non-obvious idea), not just deleted scope. Avoid stories where "simpler" just meant doing less of the actual requirement.

**Tags:** #behavioral

---

### 96. Tell me about a time you made a mistake and how you earned back trust

**Difficulty:** Medium
**Topics:** behavioral, earn-trust, ownership, dive-deep
**Position:** SWE
**Years:** L5

**Question:** Tell me about a time you made a significant mistake at work. What happened, and how did you handle it?

**Approach:** STAR mapped to **Earn Trust** and **Ownership**. Interviewers are testing self-awareness and accountability, not whether you are flawless. Structure: (Situation) a real, meaningful mistake you owned — a bad deploy, a wrong estimate, a design flaw that hit customers; (Task) the impact and who was affected; (Action) how you responded — acknowledged it promptly and transparently (no blame-shifting), contained the damage, dove deep to find root cause, and put a durable fix or process in place (e.g. a COE/postmortem, added tests, a rollback guardrail); (Result) the outcome and, crucially, how you rebuilt confidence with the team or customer over time. Strong answers show you told people before they found out, and that the same class of mistake never recurred. Avoid fake mistakes ("I work too hard") or blaming others.

**Tags:** #behavioral

---

## Domain Knowledge

### 97. Leadership Principle deep-dive: Disagree and Commit

**Difficulty:** Medium
**Topics:** behavioral, have-backbone, earn-trust
**Position:** Senior SWE
**Years:** L5

**Question:** Tell me about a time you respectfully disagreed with a decision but committed to it anyway and helped it succeed.

**Approach:** This maps to **Have Backbone; Disagree and Commit** — one of the most-asked LPs at L5+. Two-part story: (1) you raised your disagreement clearly with data, in the right forum, before the decision was final; (2) once decided against you, you actively committed — not passive acceptance but you helped make it work. Bonus: it turned out the original decision was right and you learned from it.

**Tags:** #domain-knowledge

---

### 98. Leadership Principle deep-dive: Frugality

**Difficulty:** Medium
**Topics:** behavioral, frugality, invent-and-simplify
**Position:** SWE
**Years:** L4

**Question:** Tell me about a time you accomplished something significant with limited resources.

**Approach:** Maps to **Frugality** ("accomplish more with less"). Resources can be people, time, money, or compute. Show: you didn't ask for more headcount/budget — you found a clever simplification (also touches **Invent and Simplify**). Concrete: "we needed real-time analytics but couldn't afford Snowflake — I built a Kinesis + DynamoDB streams pipeline for $200/month instead of $20k." Quantify the savings.

**Tags:** #domain-knowledge

---

### 99. How do you make a class thread-safe?

**Difficulty:** Medium
**Topics:** concurrency, thread-safety, java, synchronization
**Position:** SWE
**Years:** L5

**Question:** What does thread safety mean, and what techniques do you use to make a shared object safe under concurrent access?

**Approach:** Thread safety means concurrent access produces correct results without external synchronization — no data races, no broken invariants. Walk through the toolkit from cheapest to strongest: (1) **Immutability** — an object whose state never changes after construction is inherently thread-safe (Java `final` fields, defensive copies); prefer this. (2) **Confinement** — keep state on one thread (thread-local, or an actor/event-loop model) so it is never shared. (3) **Synchronization** — guard mutable shared state with locks (`synchronized`, `ReentrantLock`) so only one thread mutates at a time; always establish a consistent lock ordering to avoid deadlock, and keep critical sections small. (4) **Atomics / lock-free** — `AtomicInteger`, CAS loops, and concurrent collections (`ConcurrentHashMap`) for high-contention counters and maps without explicit locking. (5) **Visibility** — `volatile` ensures writes are visible across threads (fixes the double-checked-locking and stop-flag bugs) but does not provide atomicity for compound actions. Discuss the difference between a race condition (interleaving) and a visibility problem (stale cache), and why `check-then-act` (like lazy init or `containsKey` + `put`) needs a single atomic step. Amazon services are heavily concurrent, so expect a follow-up asking you to fix a broken singleton or counter.

**Tags:** #domain-knowledge

---

### 100. Idempotency and delivery semantics in distributed systems

**Difficulty:** Medium
**Topics:** distributed-systems, idempotency, reliability, messaging
**Position:** SWE
**Years:** L5

**Question:** What is idempotency, why does it matter in distributed systems, and how do you achieve exactly-once processing on top of at-least-once delivery?

**Approach:** An operation is idempotent if applying it multiple times has the same effect as applying it once. It matters because networks are unreliable: any request can time out with an unknown outcome, so clients retry — and most durable messaging (SQS, Kinesis, Kafka at-least-once) can redeliver. Without idempotency, retries double-charge, double-ship, or double-increment. Cover the delivery-semantics spectrum: at-most-once (may lose), at-least-once (may duplicate, the common durable default), exactly-once (usually an illusion built from at-least-once delivery + idempotent processing). Techniques: (1) **Idempotency keys** — the client sends a unique key per logical operation; the server records processed keys and returns the prior result on a repeat. (2) **Natural idempotency** — design writes as `SET x = v` rather than `x += 1`, or use conditional writes / upserts keyed on a deduplication id. (3) **Dedup store** — a table or cache of seen request ids with a TTL. (4) **Idempotent consumers** — combine a dedup id with an atomic "process-and-mark-done" step (transactional outbox / dedup table) so a redelivery is a no-op. Discuss the tradeoffs: dedup windows are finite (storage cost), and "exactly-once" only holds if the side effect and the dedup record commit atomically. This is core to Amazon order and payment pipelines, so expect a follow-up on preventing double-charge under retries.

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
