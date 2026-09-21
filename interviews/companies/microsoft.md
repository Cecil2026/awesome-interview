# Microsoft

```yaml
company: Microsoft (Azure, Office, Windows, Xbox, GitHub)
typical_rounds: 1 recruiter chat + 1 phone screen + 4-5 onsite (2-3 coding, 1 system design, 1 AA "as appropriate" senior leader)
focus_areas: classical algorithms, OOD, Azure/cloud-flavored system design, "growth mindset" behavioral
languages_allowed: any major language; C#/Java/Python/C++ common
duration: 45-60 min per round
notable_quirks:
  - "As Appropriate" (AA) round with a senior leader has veto-like influence
  - "Growth mindset" (Satya Nadella's framing) is the dominant cultural lens
  - Strong focus on fundamentals — linked lists, trees, recursion, memory
  - Less algorithmic exotic-ness than Google; more "can you code carefully?"
sources: Glassdoor, LeetCode Discuss (microsoft tag), Blind, careers.microsoft.com
```

## Overview

Microsoft's bar leans on solid CS fundamentals over algorithmic flashiness. You're more likely to be asked to reverse a linked list and discuss edge cases for 20 minutes than to do a Hard-tagged DP. System design rounds frequently lean on Azure primitives (Cosmos DB, Service Bus, Functions). The "growth mindset" lens dominates behavioral: they look for learners, not know-it-alls. The AA round (senior leader, often a partner-level engineer or director) is your bar-raiser equivalent.

## Linked List

### 1. Reverse a Linked List

**Difficulty:** Easy
**Topics:** linked-list, recursion, pointers
**Position:** SWE
**Years:** L60-L62

**Question:** Reverse a singly linked list. Implement both iteratively and recursively. Discuss trade-offs.

**Approach:** Iterative: 3-pointer (`prev, curr, next`); curr.next = prev, advance. O(n) time, O(1) space. Recursive: recurse to end, set `head.next.next = head; head.next = null`. O(n) time, O(n) stack. Microsoft loves discussion of why iterative is preferred for long lists (stack overflow risk).

**Python:**
```python
class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val = val
        self.next = next

def reverse_list(head: ListNode | None) -> ListNode | None:
    prev: ListNode | None = None
    cur = head
    while cur:
        nxt = cur.next
        cur.next = prev
        prev = cur
        cur = nxt
    return prev
```

**TypeScript:**
```typescript
class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) { this.val = val; this.next = next; }
}

function reverseList(head: ListNode | null): ListNode | null {
  let prev: ListNode | null = null;
  let cur = head;
  while (cur) {
    const nxt: ListNode | null = cur.next;
    cur.next = prev;
    prev = cur;
    cur = nxt;
  }
  return prev;
}
```

**Java:**
```java
class ListNode {
    int val;
    ListNode next;
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

static ListNode reverseList(ListNode head) {
    ListNode prev = null, cur = head;
    while (cur != null) {
        ListNode nxt = cur.next;
        cur.next = prev;
        prev = cur;
        cur = nxt;
    }
    return prev;
}
```

**Key points:**
- Save `next` before overwriting `cur.next` or you lose the rest of the list.
- `prev` becomes the new head when the loop ends.
- Recursive variant is elegant but O(n) stack risks overflow on long lists.

**Follow-ups:**
- Reverse a *sublist* between indices m and n in one pass.
- Reverse in groups of k (Reverse Nodes in k-Group).
- Doubly linked list — fix `prev` pointers as well.
- Detect a cycle first, then refuse to reverse — corruption avoidance.

**Common Pitfalls:**
- Forgetting to capture `next` before rewriting `cur.next` — truncates the list.
- Returning `head` (old head) instead of `prev` (new head) after the loop.

**Tags:** #algorithm

---

### 2. Copy List with Random Pointer

**Difficulty:** Medium
**Topics:** linked-list, hashmap, design
**Position:** SWE
**Years:** L60-L62

**Question:** A linked list of length n. Each node has `next` and a `random` pointer that may point to any node or null. Deep-copy the list.

**Approach:** Two-pass with hashmap `original -> copy`: first pass create all copies, second pass wire `next` and `random` via map lookup. O(n) time, O(n) space. Optimal O(1) space: interleave copies (`A -> A' -> B -> B' -> ...`), then assign `random`, then unweave.

**Python:**
```python
class RNode:
    def __init__(self, val: int, next: "RNode | None" = None, random: "RNode | None" = None) -> None:
        self.val, self.next, self.random = val, next, random

def copy_random_list(head: RNode | None) -> RNode | None:
    if not head:
        return None
    m: dict[RNode, RNode] = {}
    cur = head
    while cur:
        m[cur] = RNode(cur.val)
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
class RNode {
  val: number;
  next: RNode | null;
  random: RNode | null;
  constructor(v: number, n: RNode | null = null, r: RNode | null = null) { this.val = v; this.next = n; this.random = r; }
}

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
class RNode {
    int val;
    RNode next, random;
    RNode(int v) { val = v; }
}

static RNode copyRandomList(RNode head) {
    if (head == null) return null;
    Map<RNode, RNode> m = new HashMap<>();
    for (RNode cur = head; cur != null; cur = cur.next) m.put(cur, new RNode(cur.val));
    for (RNode cur = head; cur != null; cur = cur.next) {
        m.get(cur).next = m.get(cur.next);
        m.get(cur).random = m.get(cur.random);
    }
    return m.get(head);
}
```

**Key points:**
- Two passes avoid the chicken-and-egg of resolving `random` before all nodes exist.
- Map keys on identity, not value, since values may repeat.
- Interleave-and-split trick achieves O(1) extra space but is trickier to get right.

**Follow-ups:**
- Clone a graph with random-edge semantics — same identity-keyed map.
- Implement the O(1)-extra-space interleave variant from scratch.
- Lists with cycles — detect and preserve them.
- Persistent copy that shares structure with the original — immutable list variant.

**Common Pitfalls:**
- Using `cur.val` as the map key — wrong when values collide.
- Forgetting to null-check `cur.next` / `cur.random` before map lookup.

**Tags:** #algorithm

---

### 3. Reverse Linked List II

**Difficulty:** Medium
**Topics:** linked-list, pointers
**Position:** SWE
**Years:** L60-L62

**Question:** Reverse the nodes of a linked list from position `left` to `right` (1-indexed), in one pass and in-place.

**Approach:** Use a dummy node. Walk `prev` to position `left-1`. Then iteratively splice the next node to the front of the reversed sublist (`prev.next` insertion). O(n) time, O(1) space. Edge cases: `left == 1`, `left == right`, list shorter than `right`.

**Python:**
```python
def reverse_between(head: ListNode | None, left: int, right: int) -> ListNode | None:
    dummy = ListNode(0, head)
    prev = dummy
    for _ in range(left - 1):
        prev = prev.next  # type: ignore
    cur = prev.next
    for _ in range(right - left):
        nxt = cur.next  # type: ignore
        cur.next = nxt.next  # type: ignore
        nxt.next = prev.next
        prev.next = nxt
    return dummy.next
```

**TypeScript:**
```typescript
function reverseBetween(head: ListNode | null, left: number, right: number): ListNode | null {
  const dummy = new ListNode(0, head);
  let prev: ListNode = dummy;
  for (let i = 0; i < left - 1; i++) prev = prev.next!;
  const cur = prev.next!;
  for (let i = 0; i < right - left; i++) {
    const nxt = cur.next!;
    cur.next = nxt.next;
    nxt.next = prev.next;
    prev.next = nxt;
  }
  return dummy.next;
}
```

**Java:**
```java
static ListNode reverseBetween(ListNode head, int left, int right) {
    ListNode dummy = new ListNode(0, head);
    ListNode prev = dummy;
    for (int i = 0; i < left - 1; i++) prev = prev.next;
    ListNode cur = prev.next;
    for (int i = 0; i < right - left; i++) {
        ListNode nxt = cur.next;
        cur.next = nxt.next;
        nxt.next = prev.next;
        prev.next = nxt;
    }
    return dummy.next;
}
```

**Key points:**
- Dummy node handles `left == 1` (head moves) without branching.
- Splice-to-front avoids reversing then re-stitching.
- Each step does O(1) pointer work; `right - left` splices total.

**Tags:** #algorithm

---

### 4. Merge K Sorted Lists

**Difficulty:** Hard
**Topics:** linked-list, heap, divide-and-conquer
**Position:** SWE
**Years:** L62-L63

**Question:** Merge k sorted linked lists into one sorted linked list.

**Approach:** Min-heap of size k seeded with each list's head; pop smallest, push its `.next`. O(N log k) time, O(k) space. Alternative: pairwise merge via divide-and-conquer (same complexity, no heap). Watch for null lists in the input.

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
  if (lists.length === 0) return null;
  const mergeTwo = (a: ListNode | null, b: ListNode | null): ListNode | null => {
    const dummy = new ListNode(); let tail = dummy;
    while (a && b) {
      if (a.val <= b.val) { tail.next = a; a = a.next; } else { tail.next = b; b = b.next; }
      tail = tail.next!;
    }
    tail.next = a ?? b;
    return dummy.next;
  };
  let step = 1;
  while (step < lists.length) {
    for (let i = 0; i + step < lists.length; i += step * 2) {
      lists[i] = mergeTwo(lists[i], lists[i + step]);
    }
    step *= 2;
  }
  return lists[0];
}
```

**Java:**
```java
static ListNode mergeKLists(ListNode[] lists) {
    PriorityQueue<ListNode> heap = new PriorityQueue<>(Comparator.comparingInt(n -> n.val));
    for (ListNode n : lists) if (n != null) heap.offer(n);
    ListNode dummy = new ListNode(0), tail = dummy;
    while (!heap.isEmpty()) {
        ListNode node = heap.poll();
        tail.next = node;
        tail = node;
        if (node.next != null) heap.offer(node.next);
    }
    return dummy.next;
}
```

**Key points:**
- Index in the tuple breaks ties so heap never compares node objects.
- Pairwise divide-and-conquer matches O(N log k) without a heap.
- Skip null inputs before pushing them into the heap.

**Tags:** #algorithm

---

### 5. LRU Cache

**Difficulty:** Medium
**Topics:** design, hashmap, linked-list
**Position:** SWE
**Years:** L62-L63

**Question:** Design an LRU cache with O(1) `get` and `put`.

**Approach:** Hashmap from key to doubly-linked-list node, plus a DLL with head (most recent) and tail (least recent). On access, unlink and move to head. On `put` past capacity, evict the tail and remove from map. O(1) for both ops. Microsoft cares about clean DLL splice code.

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
  private m = new Map<number, number>();
  constructor(capacity: number) { this.cap = capacity; }
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
- JS `Map` and Python `OrderedDict` preserve insertion order.
- Re-insert on access to mark the entry as most recent.
- Evict via the first key (oldest) when over capacity.

**Tags:** #algorithm

---

### 6. Linked List Cycle II (find cycle entrance)

**Difficulty:** Medium
**Topics:** linked-list, two-pointers, floyd, cycle-detection
**Position:** SWE
**Years:** L60-L62

**Question:** Given the head of a singly linked list, return the node where the cycle begins, or null if there is no cycle. Solve in O(1) extra space and discuss why the pointer math works.

**Approach:** Floyd's tortoise-and-hare: advance `slow` by 1 and `fast` by 2; if they meet a cycle exists. Then reset one pointer to `head` and advance both by 1 — they meet at the cycle entrance (distance from head to entrance equals distance from meeting point to entrance). O(n) time, O(1) space. Microsoft probes the edge case of no cycle (`fast`/`fast.next` becoming null) and can ask you to prove the entrance equality.

**Python:**
```python
class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val = val
        self.next = next

def detect_cycle(head: ListNode | None) -> ListNode | None:
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            ptr = head
            while ptr is not slow:
                ptr = ptr.next
                slow = slow.next
            return ptr
    return None
```

**TypeScript:**
```typescript
class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) { this.val = val; this.next = next; }
}

function detectCycle(head: ListNode | null): ListNode | null {
  let slow = head;
  let fast = head;
  while (fast && fast.next) {
    slow = slow!.next;
    fast = fast.next.next;
    if (slow === fast) {
      let ptr = head;
      while (ptr !== slow) {
        ptr = ptr!.next;
        slow = slow!.next;
      }
      return ptr;
    }
  }
  return null;
}
```

**Java:**
```java
class ListNode {
    int val;
    ListNode next;
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

static ListNode detectCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) {
            ListNode ptr = head;
            while (ptr != slow) {
                ptr = ptr.next;
                slow = slow.next;
            }
            return ptr;
        }
    }
    return null;
}
```

**Key points:**
- The meeting only proves a cycle exists; the second walk from `head` locates its entrance.
- Loop guard must check both `fast` and `fast.next` before the double step to avoid a null dereference.
- O(n) time, O(1) space — no hash set needed.

**Follow-ups:**
- Return the cycle length (keep advancing `slow` after the meet until it returns).
- Use a hash set instead and compare trade-offs (O(n) space, simpler).
- Detect and then break the cycle in place.

**Common Pitfalls:**
- Comparing values (`slow.val == fast.val`) instead of node identity.
- Advancing both reset pointers by 2 in the second phase — they must move by 1.

**Tags:** #algorithm

---

### 7. Intersection of Two Linked Lists

**Difficulty:** Easy
**Topics:** linked-list, two-pointers, pointers
**Position:** SWE
**Years:** L60-L62

**Question:** Given the heads of two singly linked lists, return the node at which they intersect, or null if they never do. Intersection is by node identity, not value. Discuss the O(1)-space trick and edge cases.

**Approach:** Two pointers `a` and `b` start at the two heads. Each step advance one; when a pointer runs off the end, redirect it to the *other* list's head. After at most `lenA + lenB` steps both have walked the same total distance and meet either at the intersection node or at null simultaneously. O(n + m) time, O(1) space. Microsoft cares about the null-meet case (no intersection) terminating cleanly.

**Python:**
```python
class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val = val
        self.next = next

def get_intersection_node(head_a: ListNode | None, head_b: ListNode | None) -> ListNode | None:
    if not head_a or not head_b:
        return None
    a, b = head_a, head_b
    while a is not b:
        a = a.next if a else head_b
        b = b.next if b else head_a
    return a
```

**TypeScript:**
```typescript
class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) { this.val = val; this.next = next; }
}

function getIntersectionNode(headA: ListNode | null, headB: ListNode | null): ListNode | null {
  if (!headA || !headB) return null;
  let a: ListNode | null = headA;
  let b: ListNode | null = headB;
  while (a !== b) {
    a = a ? a.next : headB;
    b = b ? b.next : headA;
  }
  return a;
}
```

**Java:**
```java
class ListNode {
    int val;
    ListNode next;
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

static ListNode getIntersectionNode(ListNode headA, ListNode headB) {
    if (headA == null || headB == null) return null;
    ListNode a = headA, b = headB;
    while (a != b) {
        a = (a != null) ? a.next : headB;
        b = (b != null) ? b.next : headA;
    }
    return a;
}
```

**Key points:**
- Redirecting each pointer to the other head equalizes the two path lengths, guaranteeing they align.
- If there is no intersection both pointers become null on the same step, so the loop exits and returns null.
- O(n + m) time, O(1) space — no length pre-count and no hashing required.

**Follow-ups:**
- Alternative: measure both lengths, advance the longer by the difference, then walk together.
- Hash-set the nodes of one list and scan the other (O(n) space).
- What if a list has a cycle — does the invariant still hold?

**Common Pitfalls:**
- Advancing to `.next` before the null check, skipping the cross-over and looping forever.
- Comparing values instead of node identity, giving false positives on duplicate values.

**Tags:** #algorithm

---

### 8. Add Two Numbers

**Difficulty:** Medium
**Topics:** linked-list, math, pointers, carry
**Position:** SWE
**Years:** L60-L62

**Question:** Two non-empty linked lists represent two non-negative integers with digits stored in reverse order, one digit per node. Add them and return the sum as a linked list. Discuss carry handling and unequal lengths.

**Approach:** Walk both lists together with a running `carry`, using a dummy head to simplify list construction. At each step sum the two available digits plus carry, push `total % 10` as a new node, and keep `total // 10` as the next carry. O(max(n, m)) time, O(max(n, m)) space. The edge case Microsoft probes: a final carry (e.g. 5 + 5) needs one extra node after both lists are exhausted, so the loop must also run while `carry` is non-zero.

**Python:**
```python
class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val = val
        self.next = next

def add_two_numbers(l1: ListNode | None, l2: ListNode | None) -> ListNode | None:
    dummy = ListNode()
    tail = dummy
    carry = 0
    while l1 or l2 or carry:
        total = carry
        if l1:
            total += l1.val
            l1 = l1.next
        if l2:
            total += l2.val
            l2 = l2.next
        carry, digit = divmod(total, 10)
        tail.next = ListNode(digit)
        tail = tail.next
    return dummy.next
```

**TypeScript:**
```typescript
class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) { this.val = val; this.next = next; }
}

function addTwoNumbers(l1: ListNode | null, l2: ListNode | null): ListNode | null {
  const dummy = new ListNode();
  let tail = dummy;
  let carry = 0;
  while (l1 || l2 || carry) {
    let total = carry;
    if (l1) { total += l1.val; l1 = l1.next; }
    if (l2) { total += l2.val; l2 = l2.next; }
    carry = Math.floor(total / 10);
    tail.next = new ListNode(total % 10);
    tail = tail.next;
  }
  return dummy.next;
}
```

**Java:**
```java
class ListNode {
    int val;
    ListNode next;
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

static ListNode addTwoNumbers(ListNode l1, ListNode l2) {
    ListNode dummy = new ListNode(0);
    ListNode tail = dummy;
    int carry = 0;
    while (l1 != null || l2 != null || carry != 0) {
        int total = carry;
        if (l1 != null) { total += l1.val; l1 = l1.next; }
        if (l2 != null) { total += l2.val; l2 = l2.next; }
        carry = total / 10;
        tail.next = new ListNode(total % 10);
        tail = tail.next;
    }
    return dummy.next;
}
```

**Key points:**
- Reverse digit order means you add left-to-right, so carry flows naturally in traversal order.
- The `while ... or carry` guard produces the final node for an overflow like 99 + 1.
- A dummy head avoids special-casing the first node; return `dummy.next`.

**Follow-ups:**
- What if digits are stored in forward (most-significant-first) order? Reverse both, or use two stacks.
- Add the numbers without allocating a new list (mutate the longer one).
- Generalize to any base.

**Common Pitfalls:**
- Dropping the final carry, producing a wrong shorter result.
- Advancing only one pointer when the lists differ in length.

**Tags:** #algorithm

---

## Tree

### 9. Validate Binary Search Tree

**Difficulty:** Medium
**Topics:** tree, bst, recursion, dfs
**Position:** SWE
**Years:** L60-L62

**Question:** Given a binary tree, determine if it is a valid BST (every node's left subtree < node < right subtree).

**Approach:** Recursion with `(min, max)` bounds passed down. Don't just compare node to immediate children — that fails on `[5, 1, 6, null, null, 3, 7]`. Alternative: in-order traversal, check strictly increasing. Watch for integer overflow → use Long bounds or null sentinels.

**Python:**
```python
class TreeNode:
    def __init__(self, val: int = 0, left: "TreeNode | None" = None, right: "TreeNode | None" = None) -> None:
        self.val, self.left, self.right = val, left, right

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
class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(v = 0, l: TreeNode | null = null, r: TreeNode | null = null) { this.val = v; this.left = l; this.right = r; }
}

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
class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int v) { val = v; }
}

static boolean isValidBST(TreeNode root) {
    return go(root, Long.MIN_VALUE, Long.MAX_VALUE);
}

private static boolean go(TreeNode n, long lo, long hi) {
    if (n == null) return true;
    if (n.val <= lo || n.val >= hi) return false;
    return go(n.left, lo, n.val) && go(n.right, n.val, hi);
}
```

**Key points:**
- Bounds tighten as you descend; strict inequalities enforce uniqueness.
- Empty tree is trivially a valid BST.
- Naive parent-only check fails when distant ancestors are violated.

**Follow-ups:**
- Allow duplicates — redefine which side they go to and update inequalities.
- Return the largest valid BST subtree (size + root) inside a non-BST tree.
- Iterative in-order with a stack — avoids the recursion stack risk.
- Values include `Integer.MIN_VALUE` / `MAX_VALUE` — must use `Long` bounds or null sentinels.

**Common Pitfalls:**
- Using `<=` / `>=` instead of strict `<` / `>` — fails on duplicates.
- Comparing only to immediate parent — fails on `[5, 1, 6, null, null, 3, 7]`.

**Tags:** #algorithm

---

### 10. Serialize and Deserialize Binary Tree

**Difficulty:** Hard
**Topics:** tree, bfs, dfs, design
**Position:** SWE
**Years:** L62-L63

**Question:** Design an algorithm to serialize a binary tree to a string and deserialize it back.

**Approach:** Preorder DFS with null markers: `"1,2,null,null,3,4,null,null,5,null,null"`. Deserialize with a queue/iterator, consume one token, recurse. O(n) both ways. Alternative: level-order BFS. Discuss compact encoding (variable-length ints, no leading null markers if leaves use a flag).

**Python:**
```python
from collections import deque

def serialize(root: TreeNode | None) -> str:
    out: list[str] = []
    def go(n: TreeNode | None) -> None:
        if n is None:
            out.append("#")
            return
        out.append(str(n.val))
        go(n.left); go(n.right)
    go(root)
    return ",".join(out)

def deserialize(data: str) -> TreeNode | None:
    it = iter(data.split(","))
    def go() -> TreeNode | None:
        v = next(it)
        if v == "#":
            return None
        return TreeNode(int(v), go(), go())
    return go()
```

**TypeScript:**
```typescript
function serialize(root: TreeNode | null): string {
  const out: string[] = [];
  const go = (n: TreeNode | null): void => {
    if (!n) { out.push("#"); return; }
    out.push(String(n.val));
    go(n.left); go(n.right);
  };
  go(root);
  return out.join(",");
}

function deserialize(data: string): TreeNode | null {
  const tokens = data.split(",");
  let i = 0;
  const go = (): TreeNode | null => {
    const v = tokens[i++];
    if (v === "#") return null;
    return new TreeNode(parseInt(v, 10), go(), go());
  };
  return go();
}
```

**Java:**
```java
static String serialize(TreeNode root) {
    StringBuilder sb = new StringBuilder();
    ser(root, sb);
    return sb.toString();
}

private static void ser(TreeNode n, StringBuilder sb) {
    if (n == null) { sb.append("#,"); return; }
    sb.append(n.val).append(',');
    ser(n.left, sb);
    ser(n.right, sb);
}

static TreeNode deserialize(String data) {
    return des(new ArrayDeque<>(List.of(data.split(","))));
}

private static TreeNode des(Deque<String> q) {
    String v = q.poll();
    if (v == null || v.equals("#")) return null;
    TreeNode n = new TreeNode(Integer.parseInt(v));
    n.left = des(q);
    n.right = des(q);
    return n;
}
```

**Key points:**
- Preorder with null sentinels uniquely identifies a tree.
- Shared cursor/iterator keeps deserialize O(n) without index math.
- BFS variant is identical in spirit but uses a queue and produces level-order.

**Follow-ups:**
- Serialize a BST more compactly (no null markers needed if you store size).
- N-ary tree — encode child count per node.
- Streaming serialize — emit tokens as you go, no buffer.
- Cross-version compatibility — add a header/version byte.

**Common Pitfalls:**
- Splitting by `,` but having values that contain `,` — escape or use length-prefixed encoding.
- Forgetting the null marker for one of the children — deserialize gets misaligned.

**Tags:** #algorithm

---

### 11. Implement Trie (Prefix Tree)

**Difficulty:** Medium
**Topics:** trie, design, string
**Position:** SWE
**Years:** L60-L62

**Question:** Implement a Trie with `insert`, `search`, and `startsWith` operations.

**Approach:** Node has `children: Map<Char, Node>` (or 26-array for lowercase a-z) and an `isEnd` flag. Insert/search/startsWith traverse character by character. O(L) per operation, where L is word length. Discuss memory: array faster but sparse; hashmap saves space for large alphabets.

**Python:**
```python
class Trie:
    def __init__(self) -> None:
        self.children: dict[str, "Trie"] = {}
        self.end: bool = False

    def insert(self, word: str) -> None:
        node = self
        for c in word:
            node = node.children.setdefault(c, Trie())
        node.end = True

    def _find(self, prefix: str) -> "Trie | None":
        node = self
        for c in prefix:
            node = node.children.get(c)
            if node is None:
                return None
        return node

    def search(self, word: str) -> bool:
        n = self._find(word)
        return n is not None and n.end

    def starts_with(self, prefix: str) -> bool:
        return self._find(prefix) is not None
```

**TypeScript:**
```typescript
class Trie {
  children: Map<string, Trie> = new Map();
  end = false;
  insert(word: string): void {
    let node: Trie = this;
    for (const c of word) {
      if (!node.children.has(c)) node.children.set(c, new Trie());
      node = node.children.get(c)!;
    }
    node.end = true;
  }
  private find(prefix: string): Trie | null {
    let node: Trie = this;
    for (const c of prefix) {
      const nxt = node.children.get(c);
      if (!nxt) return null;
      node = nxt;
    }
    return node;
  }
  search(word: string): boolean { const n = this.find(word); return n !== null && n.end; }
  startsWith(prefix: string): boolean { return this.find(prefix) !== null; }
}
```

**Java:**
```java
class Trie {
    private final Map<Character, Trie> children = new HashMap<>();
    private boolean end;

    public void insert(String word) {
        Trie node = this;
        for (char c : word.toCharArray()) node = node.children.computeIfAbsent(c, k -> new Trie());
        node.end = true;
    }

    private Trie find(String prefix) {
        Trie node = this;
        for (char c : prefix.toCharArray()) {
            node = node.children.get(c);
            if (node == null) return null;
        }
        return node;
    }

    public boolean search(String word) { Trie n = find(word); return n != null && n.end; }
    public boolean startsWith(String prefix) { return find(prefix) != null; }
}
```

**Key points:**
- Single `find` helper backs both `search` and `startsWith`.
- `end` flag distinguishes inserted words from mere prefixes.
- Array children (length 26) is faster but wastes memory on sparse alphabets.

**Tags:** #algorithm

---

### 12. Add and Search Word - Data Structure

**Difficulty:** Medium
**Topics:** trie, dfs, design
**Position:** SWE
**Years:** L62-L63

**Question:** Design a data structure that supports `addWord(word)` and `search(word)` where the search word may contain `.` as a wildcard matching any single letter.

**Approach:** Trie + DFS for search. On `.`, recurse into all non-null children. O(L) for add; O(26^k * L) worst-case for search where k is the wildcard count. Microsoft cares you bound the recursion and handle empty trie / empty word.

**Python:**
```python
class WordDictionary:
    def __init__(self) -> None:
        self.children: dict[str, "WordDictionary"] = {}
        self.end: bool = False

    def addWord(self, word: str) -> None:
        node = self
        for c in word:
            node = node.children.setdefault(c, WordDictionary())
        node.end = True

    def search(self, word: str) -> bool:
        def dfs(node: "WordDictionary", i: int) -> bool:
            if i == len(word):
                return node.end
            c = word[i]
            if c == ".":
                return any(dfs(ch, i + 1) for ch in node.children.values())
            nxt = node.children.get(c)
            return nxt is not None and dfs(nxt, i + 1)
        return dfs(self, 0)
```

**TypeScript:**
```typescript
class WordDictionary {
  children: Map<string, WordDictionary> = new Map();
  end = false;
  addWord(word: string): void {
    let node: WordDictionary = this;
    for (const c of word) {
      if (!node.children.has(c)) node.children.set(c, new WordDictionary());
      node = node.children.get(c)!;
    }
    node.end = true;
  }
  search(word: string): boolean {
    const dfs = (node: WordDictionary, i: number): boolean => {
      if (i === word.length) return node.end;
      const c = word[i];
      if (c === ".") {
        for (const ch of node.children.values()) if (dfs(ch, i + 1)) return true;
        return false;
      }
      const nxt = node.children.get(c);
      return nxt !== undefined && dfs(nxt, i + 1);
    };
    return dfs(this, 0);
  }
}
```

**Java:**
```java
class WordDictionary {
    private final Map<Character, WordDictionary> children = new HashMap<>();
    private boolean end;

    public void addWord(String word) {
        WordDictionary node = this;
        for (char c : word.toCharArray()) node = node.children.computeIfAbsent(c, k -> new WordDictionary());
        node.end = true;
    }

    public boolean search(String word) { return dfs(word, 0); }

    private boolean dfs(String word, int i) {
        if (i == word.length()) return end;
        char c = word.charAt(i);
        if (c == '.') {
            for (WordDictionary ch : children.values()) if (ch.dfs(word, i + 1)) return true;
            return false;
        }
        WordDictionary nxt = children.get(c);
        return nxt != null && nxt.dfs(word, i + 1);
    }
}
```

**Key points:**
- DFS handles wildcards by branching across all children.
- Termination: `i == len(word)` requires `end` true to match.
- Worst-case search O(26^k * L) when many dots, but typical use is fast.

**Tags:** #algorithm

---

### 13. Word Search II

**Difficulty:** Hard
**Topics:** trie, backtracking, dfs, matrix
**Position:** Senior SWE
**Years:** L62-L63

**Question:** Given a 2D board and a list of words, return all words from the list that can be found in the board (adjacent cells, no reuse).

**Approach:** Build a trie of the word list. DFS from each cell, descending the trie in lockstep. On hitting a trie node with a word, record it and null out the marker to avoid duplicates. Prune dead trie branches as you go. O(m*n*4^Lmax) worst-case but pruning makes it very fast in practice.

**Python:**
```python
def find_words(board: list[list[str]], words: list[str]) -> list[str]:
    root: dict = {}
    for w in words:
        node = root
        for c in w:
            node = node.setdefault(c, {})
        node["$"] = w
    out: list[str] = []
    rows, cols = len(board), len(board[0])
    def dfs(r: int, c: int, node: dict) -> None:
        ch = board[r][c]
        nxt = node.get(ch)
        if nxt is None:
            return
        if "$" in nxt:
            out.append(nxt.pop("$"))
        board[r][c] = "#"
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and board[nr][nc] != "#":
                dfs(nr, nc, nxt)
        board[r][c] = ch
        if not nxt:
            node.pop(ch, None)
    for r in range(rows):
        for c in range(cols):
            dfs(r, c, root)
    return out
```

**TypeScript:**
```typescript
function findWords(board: string[][], words: string[]): string[] {
  type Node = { [k: string]: any };
  const root: Node = {};
  for (const w of words) {
    let node = root;
    for (const c of w) { node[c] ??= {}; node = node[c]; }
    node["$"] = w;
  }
  const out: string[] = [];
  const rows = board.length, cols = board[0].length;
  const dfs = (r: number, c: number, node: Node): void => {
    const ch = board[r][c];
    const nxt = node[ch];
    if (!nxt) return;
    if (nxt["$"]) { out.push(nxt["$"]); delete nxt["$"]; }
    board[r][c] = "#";
    for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc] !== "#") dfs(nr, nc, nxt);
    }
    board[r][c] = ch;
    if (Object.keys(nxt).length === 0) delete node[ch];
  };
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) dfs(r, c, root);
  return out;
}
```

**Java:**
```java
private static class TrieNode { Map<Character, TrieNode> children = new HashMap<>(); String word; }

static List<String> findWords(char[][] board, String[] words) {
    TrieNode root = new TrieNode();
    for (String w : words) {
        TrieNode node = root;
        for (char c : w.toCharArray()) node = node.children.computeIfAbsent(c, k -> new TrieNode());
        node.word = w;
    }
    List<String> out = new ArrayList<>();
    for (int r = 0; r < board.length; r++)
        for (int c = 0; c < board[0].length; c++) dfs(board, r, c, root, out);
    return out;
}

private static void dfs(char[][] b, int r, int c, TrieNode node, List<String> out) {
    char ch = b[r][c];
    TrieNode nxt = node.children.get(ch);
    if (nxt == null) return;
    if (nxt.word != null) { out.add(nxt.word); nxt.word = null; }
    b[r][c] = '#';
    int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    for (int[] d : dirs) {
        int nr = r + d[0], nc = c + d[1];
        if (nr >= 0 && nr < b.length && nc >= 0 && nc < b[0].length && b[nr][nc] != '#') dfs(b, nr, nc, nxt, out);
    }
    b[r][c] = ch;
    if (nxt.children.isEmpty()) node.children.remove(ch);
}
```

**Key points:**
- Trie shares prefix work across many candidate words.
- Deleting `$` after capture and pruning dead branches keeps the trie shrinking.
- Mutate then restore the board cell for O(1) visited tracking.

**Tags:** #algorithm

---

### 14. Path Sum II

**Difficulty:** Medium
**Topics:** tree, dfs, backtracking
**Position:** SWE
**Years:** L60-L62

**Question:** Given a binary tree and a target sum, return all root-to-leaf paths whose values sum to the target.

**Approach:** DFS with running path stack and remaining sum. On leaf, if remaining == 0, snapshot the path. Backtrack by popping after recursion. O(n) nodes visited; total output up to O(n) paths * O(h) each.

**Python:**
```python
def path_sum(root: TreeNode | None, target: int) -> list[list[int]]:
    out: list[list[int]] = []
    path: list[int] = []
    def dfs(node: TreeNode | None, remaining: int) -> None:
        if node is None:
            return
        path.append(node.val)
        if node.left is None and node.right is None and remaining == node.val:
            out.append(path.copy())
        else:
            dfs(node.left, remaining - node.val)
            dfs(node.right, remaining - node.val)
        path.pop()
    dfs(root, target)
    return out
```

**TypeScript:**
```typescript
function pathSum(root: TreeNode | null, target: number): number[][] {
  const out: number[][] = [];
  const path: number[] = [];
  const dfs = (node: TreeNode | null, remaining: number): void => {
    if (!node) return;
    path.push(node.val);
    if (!node.left && !node.right && remaining === node.val) out.push([...path]);
    else {
      dfs(node.left, remaining - node.val);
      dfs(node.right, remaining - node.val);
    }
    path.pop();
  };
  dfs(root, target);
  return out;
}
```

**Java:**
```java
static List<List<Integer>> pathSum(TreeNode root, int target) {
    List<List<Integer>> out = new ArrayList<>();
    dfs(root, target, new ArrayDeque<>(), out);
    return out;
}

private static void dfs(TreeNode n, int remaining, Deque<Integer> path, List<List<Integer>> out) {
    if (n == null) return;
    path.addLast(n.val);
    if (n.left == null && n.right == null && remaining == n.val) out.add(new ArrayList<>(path));
    else {
        dfs(n.left, remaining - n.val, path, out);
        dfs(n.right, remaining - n.val, path, out);
    }
    path.removeLast();
}
```

**Key points:**
- Snapshot `path` on match; sharing the array would mutate prior results.
- "Leaf" means both children null — not a null child.
- Pop after each recursive return to restore backtrack state.

**Tags:** #algorithm

---

### 15. Construct Binary Tree from Preorder and Inorder

**Difficulty:** Medium
**Topics:** tree, recursion, hashmap
**Position:** SWE
**Years:** L62-L63

**Question:** Given preorder and inorder traversals of a tree with unique values, reconstruct the tree.

**Approach:** Preorder's first element is the root; find it in inorder to split left/right subtrees. Recurse. Precompute `value -> inorder index` map for O(1) lookup. O(n) total. Watch index arithmetic for sub-ranges.

**Python:**
```python
def build_tree(preorder: list[int], inorder: list[int]) -> TreeNode | None:
    idx = {v: i for i, v in enumerate(inorder)}
    it = iter(preorder)
    def go(l: int, r: int) -> TreeNode | None:
        if l > r:
            return None
        v = next(it)
        m = idx[v]
        node = TreeNode(v)
        node.left = go(l, m - 1)
        node.right = go(m + 1, r)
        return node
    return go(0, len(inorder) - 1)
```

**TypeScript:**
```typescript
function buildTree(preorder: number[], inorder: number[]): TreeNode | null {
  const idx = new Map<number, number>();
  inorder.forEach((v, i) => idx.set(v, i));
  let p = 0;
  const go = (l: number, r: number): TreeNode | null => {
    if (l > r) return null;
    const v = preorder[p++];
    const node = new TreeNode(v);
    const m = idx.get(v)!;
    node.left = go(l, m - 1);
    node.right = go(m + 1, r);
    return node;
  };
  return go(0, inorder.length - 1);
}
```

**Java:**
```java
static TreeNode buildTree(int[] preorder, int[] inorder) {
    Map<Integer, Integer> idx = new HashMap<>();
    for (int i = 0; i < inorder.length; i++) idx.put(inorder[i], i);
    return build(preorder, new int[]{0}, 0, inorder.length - 1, idx);
}

private static TreeNode build(int[] pre, int[] p, int l, int r, Map<Integer, Integer> idx) {
    if (l > r) return null;
    int v = pre[p[0]++];
    TreeNode node = new TreeNode(v);
    int m = idx.get(v);
    node.left = build(pre, p, l, m - 1, idx);
    node.right = build(pre, p, m + 1, r, idx);
    return node;
}
```

**Key points:**
- Index map turns inorder search from O(n) to O(1) per node.
- Consume preorder via a shared cursor so left subtree is built first.
- Assumes unique values — duplicates break the inorder lookup.

**Tags:** #algorithm

---

### 16. Flatten Binary Tree to Linked List

**Difficulty:** Medium
**Topics:** tree, dfs, in-place
**Position:** SWE
**Years:** L62-L63

**Question:** Flatten a binary tree to a "linked list" in-place using right pointers, following preorder.

**Approach:** Reverse-preorder recursion (right, left, root) maintaining a `prev` pointer: set `node.right = prev; node.left = null; prev = node;`. O(n) time, O(h) stack. Morris-style iterative gives O(1) space: for each node, if left exists, find rightmost in left subtree, splice right subtree onto it, move left to right.

**Python:**
```python
def flatten(root: TreeNode | None) -> None:
    prev: TreeNode | None = None
    def go(node: TreeNode | None) -> None:
        nonlocal prev
        if node is None:
            return
        go(node.right)
        go(node.left)
        node.right = prev
        node.left = None
        prev = node
    go(root)
```

**TypeScript:**
```typescript
function flatten(root: TreeNode | null): void {
  let prev: TreeNode | null = null;
  const go = (node: TreeNode | null): void => {
    if (!node) return;
    go(node.right);
    go(node.left);
    node.right = prev;
    node.left = null;
    prev = node;
  };
  go(root);
}
```

**Java:**
```java
private static TreeNode flattenPrev;

static void flatten(TreeNode root) {
    flattenPrev = null;
    flattenGo(root);
}

private static void flattenGo(TreeNode n) {
    if (n == null) return;
    flattenGo(n.right);
    flattenGo(n.left);
    n.right = flattenPrev;
    n.left = null;
    flattenPrev = n;
}
```

**Key points:**
- Reverse-preorder visits the tail of the flattened list first.
- `prev` threads each visited node onto the front of the growing list.
- Morris-style iteration achieves O(1) extra space if needed.

**Tags:** #algorithm

---

### 17. Symmetric Tree

**Difficulty:** Easy
**Topics:** tree, recursion, bfs
**Position:** SWE
**Years:** L60-L62

**Question:** Determine if a binary tree is a mirror of itself (symmetric around its center).

**Approach:** Recursive helper `isMirror(a, b)`: both null = true; one null = false; values equal AND `isMirror(a.left, b.right) AND isMirror(a.right, b.left)`. O(n) time, O(h) stack. Iterative version uses a queue pushing pairs.

**Python:**
```python
def is_symmetric(root: TreeNode | None) -> bool:
    def mirror(a: TreeNode | None, b: TreeNode | None) -> bool:
        if a is None and b is None:
            return True
        if a is None or b is None or a.val != b.val:
            return False
        return mirror(a.left, b.right) and mirror(a.right, b.left)
    return root is None or mirror(root.left, root.right)
```

**TypeScript:**
```typescript
function isSymmetric(root: TreeNode | null): boolean {
  const mirror = (a: TreeNode | null, b: TreeNode | null): boolean => {
    if (!a && !b) return true;
    if (!a || !b || a.val !== b.val) return false;
    return mirror(a.left, b.right) && mirror(a.right, b.left);
  };
  return !root || mirror(root.left, root.right);
}
```

**Java:**
```java
static boolean isSymmetric(TreeNode root) {
    return root == null || mirror(root.left, root.right);
}

private static boolean mirror(TreeNode a, TreeNode b) {
    if (a == null && b == null) return true;
    if (a == null || b == null || a.val != b.val) return false;
    return mirror(a.left, b.right) && mirror(a.right, b.left);
}
```

**Key points:**
- Compare outside-with-outside and inside-with-inside subtrees.
- Both null is true; one null is false.
- BFS with pairs in a queue is the iterative equivalent.

**Tags:** #algorithm

---

### 18. Maximum Depth of Binary Tree

**Difficulty:** Easy
**Topics:** tree, dfs, bfs, recursion
**Position:** SWE
**Years:** L60-L62

**Question:** Given a binary tree, return its maximum depth (number of nodes along the longest root-to-leaf path).

**Approach:** DFS recursion: `depth(node) = node == null ? 0 : 1 + max(depth(left), depth(right))`. O(n) time, O(h) stack. BFS alternative counts levels via queue size loop. Microsoft often follows with "minimum depth" — careful: must reach a leaf, not just a null.

**Python:**
```python
def max_depth(root: TreeNode | None) -> int:
    if root is None:
        return 0
    return 1 + max(max_depth(root.left), max_depth(root.right))
```

**TypeScript:**
```typescript
function maxDepth(root: TreeNode | null): number {
  if (!root) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```

**Java:**
```java
static int maxDepth(TreeNode root) {
    if (root == null) return 0;
    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```

**Key points:**
- Base: null node contributes depth 0.
- O(n) time, O(h) stack space.
- Minimum depth is trickier — must reach a real leaf, not stop at a null child.

**Tags:** #algorithm

---

### 19. Lowest Common Ancestor of a BST

**Difficulty:** Easy
**Topics:** tree, bst, recursion
**Position:** SWE
**Years:** L60-L62

**Question:** Given a BST and two nodes p and q, find their lowest common ancestor.

**Approach:** Walk from root: if both p and q < root, go left; if both > root, go right; else root is the LCA. O(h) time, O(1) iterative. For a general binary tree, use postorder recursion returning non-null when one subtree contains either node.

**Python:**
```python
def lowest_common_ancestor(root: TreeNode, p: TreeNode, q: TreeNode) -> TreeNode:
    cur: TreeNode | None = root
    while cur:
        if p.val < cur.val and q.val < cur.val:
            cur = cur.left
        elif p.val > cur.val and q.val > cur.val:
            cur = cur.right
        else:
            return cur
    return root
```

**TypeScript:**
```typescript
function lowestCommonAncestor(root: TreeNode, p: TreeNode, q: TreeNode): TreeNode {
  let cur: TreeNode | null = root;
  while (cur) {
    if (p.val < cur.val && q.val < cur.val) cur = cur.left;
    else if (p.val > cur.val && q.val > cur.val) cur = cur.right;
    else return cur;
  }
  return root;
}
```

**Java:**
```java
static TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    TreeNode cur = root;
    while (cur != null) {
        if (p.val < cur.val && q.val < cur.val) cur = cur.left;
        else if (p.val > cur.val && q.val > cur.val) cur = cur.right;
        else return cur;
    }
    return root;
}
```

**Key points:**
- The first node where p and q split (or equals one of them) is the LCA.
- Iterative O(1) space beats recursive on tall trees.
- Generic binary-tree LCA needs a different approach (postorder bubble-up).

**Tags:** #algorithm

---

### 20. Binary Tree Zigzag Level Order Traversal

**Difficulty:** Medium
**Topics:** tree, bfs, deque
**Position:** SWE
**Years:** L62-L63

**Question:** Return the zigzag level order traversal of a binary tree (left-to-right, then right-to-left, alternating per level).

**Approach:** BFS by levels with a flag; on right-to-left levels, prepend to the level list (or reverse at end). O(n) time, O(n) space. Microsoft may probe deque-based variants for one-pass elegance.

**Python:**
```python
from collections import deque

def zigzag_level_order(root: TreeNode | None) -> list[list[int]]:
    if not root:
        return []
    out: list[list[int]] = []
    q: deque[TreeNode] = deque([root])
    left_to_right = True
    while q:
        level: deque[int] = deque()
        for _ in range(len(q)):
            node = q.popleft()
            if left_to_right:
                level.append(node.val)
            else:
                level.appendleft(node.val)
            if node.left: q.append(node.left)
            if node.right: q.append(node.right)
        out.append(list(level))
        left_to_right = not left_to_right
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
static List<List<Integer>> zigzagLevelOrder(TreeNode root) {
    List<List<Integer>> out = new ArrayList<>();
    if (root == null) return out;
    Deque<TreeNode> q = new ArrayDeque<>();
    q.offer(root);
    boolean ltr = true;
    while (!q.isEmpty()) {
        int size = q.size();
        LinkedList<Integer> level = new LinkedList<>();
        for (int i = 0; i < size; i++) {
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
```

**Key points:**
- BFS preserves level boundaries; direction is just a presentation flag.
- Using a deque (or `unshift`) for right-to-left avoids an extra reverse.
- Order of pushing children stays the same — only output direction flips.

**Tags:** #algorithm

---

### 21. Binary Tree Level Order Traversal

**Difficulty:** Medium
**Topics:** tree, bfs, queue, traversal
**Position:** SWE
**Years:** L60-L62

**Question:** Given the root of a binary tree, return its level-order traversal — a list of levels, each level being the node values from left to right. Discuss how you separate one level from the next.

**Approach:** BFS with a queue; snapshot `len(queue)` at the start of each level so you only drain the nodes present when that level began, enqueueing children as you go. Time O(n) visiting each node once, space O(n) for the queue (up to the widest level). Edge case Microsoft probes: an empty tree returns `[]`, not `[[]]`.

**Python:**
```python
from collections import deque

class TreeNode:
    def __init__(self, val: int = 0, left: "TreeNode | None" = None, right: "TreeNode | None" = None) -> None:
        self.val, self.left, self.right = val, left, right

def level_order(root: TreeNode | None) -> list[list[int]]:
    if root is None:
        return []
    result: list[list[int]] = []
    queue: deque[TreeNode] = deque([root])
    while queue:
        level: list[int] = []
        for _ in range(len(queue)):
            node = queue.popleft()
            level.append(node.val)
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        result.append(level)
    return result
```

**TypeScript:**
```typescript
class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(v = 0, l: TreeNode | null = null, r: TreeNode | null = null) { this.val = v; this.left = l; this.right = r; }
}

function levelOrder(root: TreeNode | null): number[][] {
  if (!root) return [];
  const result: number[][] = [];
  let queue: TreeNode[] = [root];
  while (queue.length > 0) {
    const level: number[] = [];
    const next: TreeNode[] = [];
    for (const node of queue) {
      level.push(node.val);
      if (node.left) next.push(node.left);
      if (node.right) next.push(node.right);
    }
    result.push(level);
    queue = next;
  }
  return result;
}
```

**Java:**
```java
class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int v) { val = v; }
}

static List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    if (root == null) return result;
    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);
    while (!queue.isEmpty()) {
        int size = queue.size();
        List<Integer> level = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            TreeNode node = queue.poll();
            level.add(node.val);
            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
        result.add(level);
    }
    return result;
}
```

**Key points:**
- Capture the level size before the inner loop so children of the current level don't leak into it.
- O(n) time, O(n) space; the queue peaks at the tree's maximum width.
- Empty tree returns an empty list, not a list containing an empty list.

**Follow-ups:**
- Zigzag order — reverse alternate levels (or push-front on odd rows).
- Bottom-up level order — build normally, then reverse the outer list.
- Return only the average of each level, or the rightmost node per level.

**Common Pitfalls:**
- Reading `queue.size()` inside the loop after enqueueing children mixes levels together.
- Forgetting the null-root guard yields `[[]]` instead of `[]`.

**Tags:** #algorithm

---

### 22. Binary Tree Right Side View

**Difficulty:** Medium
**Topics:** tree, dfs, bfs, recursion
**Position:** SWE
**Years:** L60-L62

**Question:** Given the root of a binary tree, imagine standing on its right side; return the values of the nodes you can see, ordered top to bottom. Discuss the DFS-vs-BFS trade-off.

**Approach:** DFS visiting the right child before the left; the first node reached at each depth is the visible one, so record `node.val` whenever `depth == len(view)`. Time O(n), space O(h) for the recursion stack. The edge case Microsoft probes: a node visible on the right may actually be a left child (when the right subtree is shorter), so you must still recurse left.

**Python:**
```python
class TreeNode:
    def __init__(self, val: int = 0, left: "TreeNode | None" = None, right: "TreeNode | None" = None) -> None:
        self.val, self.left, self.right = val, left, right

def right_side_view(root: TreeNode | None) -> list[int]:
    view: list[int] = []
    def go(node: TreeNode | None, depth: int) -> None:
        if node is None:
            return
        if depth == len(view):
            view.append(node.val)
        go(node.right, depth + 1)
        go(node.left, depth + 1)
    go(root, 0)
    return view
```

**TypeScript:**
```typescript
class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(v = 0, l: TreeNode | null = null, r: TreeNode | null = null) { this.val = v; this.left = l; this.right = r; }
}

function rightSideView(root: TreeNode | null): number[] {
  const view: number[] = [];
  const go = (node: TreeNode | null, depth: number): void => {
    if (!node) return;
    if (depth === view.length) view.push(node.val);
    go(node.right, depth + 1);
    go(node.left, depth + 1);
  };
  go(root, 0);
  return view;
}
```

**Java:**
```java
class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int v) { val = v; }
}

static List<Integer> rightSideView(TreeNode root) {
    List<Integer> view = new ArrayList<>();
    go(root, 0, view);
    return view;
}

private static void go(TreeNode node, int depth, List<Integer> view) {
    if (node == null) return;
    if (depth == view.size()) view.add(node.val);
    go(node.right, depth + 1, view);
    go(node.left, depth + 1, view);
}
```

**Key points:**
- Right-first DFS makes the first node seen at each depth the visible one.
- `depth == view.length` is the "first at this depth" test — no per-level bookkeeping needed.
- Still recurse left: shorter right subtrees leave left nodes exposed on deeper levels.

**Follow-ups:**
- Solve with BFS instead — take the last node of each level.
- Return the left side view — mirror the recursion order.
- Handle a right-skewed tree of 10^5 nodes — recursion depth risk, switch to iterative BFS.

**Common Pitfalls:**
- Recursing left-first records left nodes and hides the true right-side view.
- Skipping the left subtree drops nodes visible only because the right subtree ended early.

**Tags:** #algorithm

---

### 23. Binary Tree Maximum Path Sum

**Difficulty:** Hard
**Topics:** tree, dfs, recursion, dynamic-programming
**Position:** Senior SWE
**Years:** L62-L63

**Question:** Given a non-empty binary tree, return the maximum sum of any path, where a path is a sequence of connected nodes and need not pass through the root. Node values may be negative — discuss how that affects your choices.

**Approach:** Post-order DFS returns the best downward gain from a node — `node.val + max(leftGain, rightGain, 0)` — clamping negative subtree gains to 0 so a harmful branch is dropped. Separately track the best full "arch" through each node, `node.val + leftGain + rightGain`, in a running maximum. Time O(n), space O(h). The key subtlety Microsoft probes: what you return to the parent (a single branch) differs from what you use to update the answer (both branches).

**Python:**
```python
class TreeNode:
    def __init__(self, val: int = 0, left: "TreeNode | None" = None, right: "TreeNode | None" = None) -> None:
        self.val, self.left, self.right = val, left, right

def max_path_sum(root: TreeNode | None) -> int:
    if root is None:
        return 0
    best = root.val
    def gain(node: TreeNode | None) -> int:
        nonlocal best
        if node is None:
            return 0
        left = max(gain(node.left), 0)
        right = max(gain(node.right), 0)
        best = max(best, node.val + left + right)
        return node.val + max(left, right)
    gain(root)
    return best
```

**TypeScript:**
```typescript
class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(v = 0, l: TreeNode | null = null, r: TreeNode | null = null) { this.val = v; this.left = l; this.right = r; }
}

function maxPathSum(root: TreeNode | null): number {
  if (!root) return 0;
  let best = root.val;
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
class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int v) { val = v; }
}

static int maxPathSum(TreeNode root) {
    if (root == null) return 0;
    int[] best = { root.val };
    gain(root, best);
    return best[0];
}

private static int gain(TreeNode node, int[] best) {
    if (node == null) return 0;
    int left = Math.max(gain(node.left, best), 0);
    int right = Math.max(gain(node.right, best), 0);
    best[0] = Math.max(best[0], node.val + left + right);
    return node.val + Math.max(left, right);
}
```

**Key points:**
- Clamp each child's gain at 0 to discard branches that would only lower the sum.
- Return one branch to the parent, but score the answer with both branches joined at the node.
- Initialize the running max to a real node value (or -inf) so an all-negative tree returns the least-negative single node.

**Follow-ups:**
- Also return the actual path of nodes, not just the sum.
- Constrain the path to at most k nodes.
- Extend to an n-ary tree — take the top two child gains.

**Common Pitfalls:**
- Returning `node.val + left + right` to the parent — a path can't branch at the parent.
- Initializing best to 0 — breaks when every value is negative.

**Tags:** #algorithm

---

### 24. Diameter of Binary Tree

**Difficulty:** Easy
**Topics:** tree, dfs, recursion, height
**Position:** SWE
**Years:** L60-L62

**Question:** Given the root of a binary tree, return its diameter — the length of the longest path between any two nodes, measured in edges. Note the path need not pass through the root.

**Approach:** Post-order DFS returning each subtree's height; at every node the longest path through it is `leftHeight + rightHeight` edges, tracked in a running maximum. Return `1 + max(leftHeight, rightHeight)` upward. Time O(n), space O(h). The edge case Microsoft probes: diameter counts edges, not nodes, so a single node has diameter 0 and an empty tree also 0.

**Python:**
```python
class TreeNode:
    def __init__(self, val: int = 0, left: "TreeNode | None" = None, right: "TreeNode | None" = None) -> None:
        self.val, self.left, self.right = val, left, right

def diameter_of_binary_tree(root: TreeNode | None) -> int:
    best = 0
    def height(node: TreeNode | None) -> int:
        nonlocal best
        if node is None:
            return 0
        left = height(node.left)
        right = height(node.right)
        best = max(best, left + right)
        return 1 + max(left, right)
    height(root)
    return best
```

**TypeScript:**
```typescript
class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(v = 0, l: TreeNode | null = null, r: TreeNode | null = null) { this.val = v; this.left = l; this.right = r; }
}

function diameterOfBinaryTree(root: TreeNode | null): number {
  let best = 0;
  const height = (node: TreeNode | null): number => {
    if (!node) return 0;
    const left = height(node.left);
    const right = height(node.right);
    best = Math.max(best, left + right);
    return 1 + Math.max(left, right);
  };
  height(root);
  return best;
}
```

**Java:**
```java
class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int v) { val = v; }
}

static int diameterOfBinaryTree(TreeNode root) {
    int[] best = { 0 };
    height(root, best);
    return best[0];
}

private static int height(TreeNode node, int[] best) {
    if (node == null) return 0;
    int left = height(node.left, best);
    int right = height(node.right, best);
    best[0] = Math.max(best[0], left + right);
    return 1 + Math.max(left, right);
}
```

**Key points:**
- The diameter through a node equals the sum of its two subtree heights (in edges).
- One DFS computes heights and updates the max simultaneously — O(n), not O(n^2).
- Edges, not nodes: single node and empty tree both give 0.

**Follow-ups:**
- Return the two endpoint nodes of a longest path, not just the length.
- Weighted edges — carry edge weights into the height computation.
- Diameter of an n-ary tree — combine the top two child heights.

**Common Pitfalls:**
- Recomputing height in a separate pass per node — degrades to O(n^2).
- Counting nodes instead of edges — off-by-one, returns diameter + 1.

**Tags:** #algorithm

---

## Heap / Priority Queue

### 25. Find Kth Largest in Array

**Difficulty:** Medium
**Topics:** heap, quickselect, sorting
**Position:** SWE
**Years:** L60-L62

**Question:** Find the kth largest element in an unsorted array.

**Approach:** Min-heap of size k: O(n log k). Or Quickselect (Hoare partition) for O(n) average. Microsoft will probe both — implement Quickselect (random pivot to avoid worst case). Discuss when each wins.

**Python:**
```python
import heapq, random

def find_kth_largest(nums: list[int], k: int) -> int:
    def quickselect(lo: int, hi: int, target: int) -> int:
        pivot = nums[random.randint(lo, hi)]
        l, m, r = lo, lo, hi
        while m <= r:
            if nums[m] < pivot: nums[l], nums[m] = nums[m], nums[l]; l += 1; m += 1
            elif nums[m] > pivot: nums[m], nums[r] = nums[r], nums[m]; r -= 1
            else: m += 1
        if target < l: return quickselect(lo, l - 1, target)
        if target > r: return quickselect(r + 1, hi, target)
        return nums[target]
    return quickselect(0, len(nums) - 1, len(nums) - k)
```

**TypeScript:**
```typescript
function findKthLargest(nums: number[], k: number): number {
  const select = (lo: number, hi: number, target: number): number => {
    const pivot = nums[lo + Math.floor(Math.random() * (hi - lo + 1))];
    let l = lo, m = lo, r = hi;
    while (m <= r) {
      if (nums[m] < pivot) { [nums[l], nums[m]] = [nums[m], nums[l]]; l++; m++; }
      else if (nums[m] > pivot) { [nums[m], nums[r]] = [nums[r], nums[m]]; r--; }
      else m++;
    }
    if (target < l) return select(lo, l - 1, target);
    if (target > r) return select(r + 1, hi, target);
    return nums[target];
  };
  return select(0, nums.length - 1, nums.length - k);
}
```

**Java:**
```java
static int findKthLargest(int[] nums, int k) {
    return quickselect(nums, 0, nums.length - 1, nums.length - k);
}

private static int quickselect(int[] a, int lo, int hi, int target) {
    int pivot = a[lo + ThreadLocalRandom.current().nextInt(hi - lo + 1)];
    int l = lo, m = lo, r = hi;
    while (m <= r) {
        if (a[m] < pivot) { int t = a[l]; a[l++] = a[m]; a[m++] = t; }
        else if (a[m] > pivot) { int t = a[m]; a[m] = a[r]; a[r--] = t; }
        else m++;
    }
    if (target < l) return quickselect(a, lo, l - 1, target);
    if (target > r) return quickselect(a, r + 1, hi, target);
    return a[target];
}
```

**Key points:**
- Three-way (Dutch flag) partition handles duplicates cleanly.
- Random pivot makes O(n) expected, O(n^2) worst-case extremely unlikely.
- Heap variant uses O(k) memory and is preferable when input is streamed.

**Follow-ups:**
- Top-k *distinct* elements — add a set check.
- Streaming kth largest — maintain a min-heap of size k.
- kth largest *frequency* (Top-K Frequent) — bucket sort gives O(n).
- Median in a stream — two heaps pattern.

**Common Pitfalls:**
- Using a fixed pivot (first or last) — worst-case O(n^2) on sorted input.
- Off-by-one when mapping "kth largest" → index `n - k` after sorting ascending.

**Tags:** #algorithm

---

### 26. Find Median from Data Stream

**Difficulty:** Hard
**Topics:** heap, design
**Position:** Senior SWE
**Years:** L62-L63

**Question:** Design a class that supports `addNum(int)` and `findMedian()` as numbers stream in.

**Approach:** Two heaps: a max-heap for the lower half and a min-heap for the upper half. On add, push and rebalance to keep size difference <= 1. Median is top of larger heap (odd) or average of tops (even). O(log n) add, O(1) median.

**Python:**
```python
import heapq

class MedianFinder:
    def __init__(self) -> None:
        self.low: list[int] = []   # max-heap via negation
        self.high: list[int] = []  # min-heap

    def add_num(self, num: int) -> None:
        heapq.heappush(self.low, -heapq.heappushpop(self.high, num))
        if len(self.low) > len(self.high):
            heapq.heappush(self.high, -heapq.heappop(self.low))

    def find_median(self) -> float:
        if len(self.high) > len(self.low):
            return float(self.high[0])
        return (self.high[0] - self.low[0]) / 2
```

**TypeScript:**
```typescript
class MedianFinder {
  private low: number[] = [];   // max-heap (store negatives)
  private high: number[] = [];  // min-heap
  private push(h: number[], v: number): void {
    h.push(v); let i = h.length - 1;
    while (i > 0) { const p = (i - 1) >> 1; if (h[p] <= h[i]) break; [h[p], h[i]] = [h[i], h[p]]; i = p; }
  }
  private pop(h: number[]): number {
    const top = h[0], last = h.pop()!;
    if (h.length) { h[0] = last; let i = 0; for (;;) { const l = 2*i+1, r = 2*i+2; let s = i;
      if (l < h.length && h[l] < h[s]) s = l; if (r < h.length && h[r] < h[s]) s = r;
      if (s === i) break; [h[i], h[s]] = [h[s], h[i]]; i = s; } }
    return top;
  }
  addNum(num: number): void {
    this.push(this.high, num);
    this.push(this.low, -this.pop(this.high));
    if (this.low.length > this.high.length) this.push(this.high, -this.pop(this.low));
  }
  findMedian(): number {
    if (this.high.length > this.low.length) return this.high[0];
    return (this.high[0] + -this.low[0]) / 2;
  }
}
```

**Java:**
```java
class MedianFinder {
    private final PriorityQueue<Integer> low = new PriorityQueue<>(Comparator.reverseOrder());
    private final PriorityQueue<Integer> high = new PriorityQueue<>();

    public void addNum(int num) {
        high.offer(num);
        low.offer(high.poll());
        if (low.size() > high.size()) high.offer(low.poll());
    }

    public double findMedian() {
        if (high.size() > low.size()) return high.peek();
        return (high.peek() + low.peek()) / 2.0;
    }
}
```

**Key points:**
- Two heaps split the stream so both medians are at the tops.
- Funnel through one heap to keep the partition correct.
- Keep `|high| - |low|` in {0, 1} so the median is always O(1) to read.

**Tags:** #algorithm

---

### 27. Top K Frequent Elements

**Difficulty:** Medium
**Topics:** heap, hash-map, bucket-sort, counting
**Position:** SWE
**Years:** L60-L62

**Question:** Given an integer array and an integer `k`, return the `k` most frequent elements. Discuss the trade-off between a heap solution and bucket sort.

**Approach:** Count frequencies with a hash map, then keep a size-`k` min-heap of `(count, value)`; push each entry and pop when the heap exceeds `k`, so the smallest counts fall out. O(n log k) time, O(n) space. Bucket sort by frequency achieves O(n) but the heap generalizes to streaming; Microsoft likes hearing both and when each wins.

**Python:**
```python
import heapq
from collections import Counter

def top_k_frequent(nums: list[int], k: int) -> list[int]:
    counts = Counter(nums)
    heap: list[tuple[int, int]] = []  # (count, value)
    for value, count in counts.items():
        heapq.heappush(heap, (count, value))
        if len(heap) > k:
            heapq.heappop(heap)
    return [value for _, value in heap]
```

**TypeScript:**
```typescript
function topKFrequent(nums: number[], k: number): number[] {
  const counts = new Map<number, number>();
  for (const n of nums) counts.set(n, (counts.get(n) ?? 0) + 1);
  // Bucket sort by frequency: index = count, values with that count.
  const buckets: number[][] = Array.from({ length: nums.length + 1 }, () => []);
  for (const [value, count] of counts) buckets[count].push(value);
  const result: number[] = [];
  for (let c = buckets.length - 1; c >= 0 && result.length < k; c--) {
    for (const value of buckets[c]) {
      result.push(value);
      if (result.length === k) break;
    }
  }
  return result;
}
```

**Java:**
```java
static int[] topKFrequent(int[] nums, int k) {
    Map<Integer, Integer> counts = new HashMap<>();
    for (int n : nums) counts.merge(n, 1, Integer::sum);
    PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> a[0] - b[0]); // min-heap by count
    for (Map.Entry<Integer, Integer> e : counts.entrySet()) {
        heap.offer(new int[]{e.getValue(), e.getKey()});
        if (heap.size() > k) heap.poll();
    }
    int[] result = new int[k];
    for (int i = 0; i < k; i++) result[i] = heap.poll()[1];
    return result;
}
```

**Key points:**
- Count first with a hash map — O(n) and unavoidable.
- A size-`k` min-heap keeps memory at O(k) for the selection step and runs in O(n log k).
- Bucket sort by frequency is O(n) since counts are bounded by `n`; index buckets by count.
- The k largest counts are the answer; order among them is not required.

**Follow-ups:**
- k most frequent *words*, tie-broken alphabetically.
- Streaming input where the array does not fit in memory.
- Approximate top-k with count-min sketch under tight memory.

**Common Pitfalls:**
- Using a max-heap of all entries — O(n log n), worse than the size-k min-heap.
- Off-by-one in the bucket array size (must be `n + 1` to index count `n`).

**Tags:** #algorithm

---

## Stack / Queue

### 28. Design Hit Counter

**Difficulty:** Medium
**Topics:** design, queue, concurrency
**Position:** SWE
**Years:** L62-L63

**Question:** Design a hit counter that records hits and returns the number of hits in the past 5 minutes (300 seconds).

**Approach:** Circular buffer of 300 (`time[i], count[i]`); on hit, if `time[idx] != now` reset, else increment. `getHits` sums entries where `now - time[i] < 300`. O(1) hit, O(300) query. Discuss thread-safety (atomic CAS per slot) and scaling to many requests per second (bucket coarser).

**Python:**
```python
class HitCounter:
    def __init__(self) -> None:
        self.times: list[int] = [0] * 300
        self.counts: list[int] = [0] * 300

    def hit(self, timestamp: int) -> None:
        i = timestamp % 300
        if self.times[i] != timestamp:
            self.times[i] = timestamp
            self.counts[i] = 1
        else:
            self.counts[i] += 1

    def get_hits(self, timestamp: int) -> int:
        return sum(c for t, c in zip(self.times, self.counts) if timestamp - t < 300)
```

**TypeScript:**
```typescript
class HitCounter {
  private times = new Array<number>(300).fill(0);
  private counts = new Array<number>(300).fill(0);
  hit(timestamp: number): void {
    const i = timestamp % 300;
    if (this.times[i] !== timestamp) { this.times[i] = timestamp; this.counts[i] = 1; }
    else this.counts[i]++;
  }
  getHits(timestamp: number): number {
    let total = 0;
    for (let i = 0; i < 300; i++) if (timestamp - this.times[i] < 300) total += this.counts[i];
    return total;
  }
}
```

**Java:**
```java
class HitCounter {
    private final int[] times = new int[300];
    private final int[] counts = new int[300];

    public void hit(int timestamp) {
        int i = timestamp % 300;
        if (times[i] != timestamp) { times[i] = timestamp; counts[i] = 1; }
        else counts[i]++;
    }

    public int getHits(int timestamp) {
        int total = 0;
        for (int i = 0; i < 300; i++) if (timestamp - times[i] < 300) total += counts[i];
        return total;
    }
}
```

**Key points:**
- Fixed-size buffer makes memory O(1) regardless of traffic.
- Stale slots are detected by comparing stored timestamp to current.
- For very high QPS, switch to a queue of (ts, count) and pop expired entries.

**Tags:** #algorithm

---

### 29. Min Stack

**Difficulty:** Medium
**Topics:** stack, design
**Position:** SWE
**Years:** L60-L62

**Question:** Design a stack supporting push, pop, top, and `getMin` all in O(1).

**Approach:** Two stacks: data stack and min stack. On push, also push `min(x, currentMin)` to min stack. On pop, pop both. `getMin` returns top of min stack. Optimization: only push to min stack when new min is `<=` current. O(1) all ops.

**Python:**
```python
class MinStack:
    def __init__(self) -> None:
        self.stack: list[int] = []
        self.mins: list[int] = []

    def push(self, x: int) -> None:
        self.stack.append(x)
        if not self.mins or x <= self.mins[-1]:
            self.mins.append(x)

    def pop(self) -> None:
        if self.stack.pop() == self.mins[-1]:
            self.mins.pop()

    def top(self) -> int:
        return self.stack[-1]

    def get_min(self) -> int:
        return self.mins[-1]
```

**TypeScript:**
```typescript
class MinStack {
  private stack: number[] = [];
  private mins: number[] = [];
  push(x: number): void {
    this.stack.push(x);
    if (this.mins.length === 0 || x <= this.mins[this.mins.length - 1]) this.mins.push(x);
  }
  pop(): void {
    const v = this.stack.pop()!;
    if (v === this.mins[this.mins.length - 1]) this.mins.pop();
  }
  top(): number { return this.stack[this.stack.length - 1]; }
  getMin(): number { return this.mins[this.mins.length - 1]; }
}
```

**Java:**
```java
class MinStack {
    private final Deque<Integer> stack = new ArrayDeque<>();
    private final Deque<Integer> mins = new ArrayDeque<>();

    public void push(int x) {
        stack.push(x);
        if (mins.isEmpty() || x <= mins.peek()) mins.push(x);
    }

    public void pop() {
        int v = stack.pop();
        if (v == mins.peek()) mins.pop();
    }

    public int top() { return stack.peek(); }
    public int getMin() { return mins.peek(); }
}
```

**Key points:**
- Min stack only tracks "current minima"; one entry per distinct min era.
- Use `<=` so duplicates of the min are pushed (otherwise pop breaks).
- All operations are O(1) amortized and worst-case.

**Tags:** #algorithm

---

### 30. Sliding Window Maximum

**Difficulty:** Hard
**Topics:** deque, sliding-window, arrays
**Position:** Senior SWE
**Years:** L62-L63

**Question:** Given an array and window size k, return the max of each window as it slides from left to right.

**Approach:** Monotonic decreasing deque of indices. For each new element: pop tail while smaller, push current. Pop head if it exits the window. Front of deque is current window max. O(n) amortized, O(k) space.

**Python:**
```python
from collections import deque

def max_sliding_window(nums: list[int], k: int) -> list[int]:
    dq: deque[int] = deque()
    out: list[int] = []
    for i, x in enumerate(nums):
        while dq and dq[0] <= i - k:
            dq.popleft()
        while dq and nums[dq[-1]] < x:
            dq.pop()
        dq.append(i)
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
    while (dq.length && dq[0] <= i - k) dq.shift();
    while (dq.length && nums[dq[dq.length - 1]] < nums[i]) dq.pop();
    dq.push(i);
    if (i >= k - 1) out.push(nums[dq[0]]);
  }
  return out;
}
```

**Java:**
```java
static int[] maxSlidingWindow(int[] nums, int k) {
    Deque<Integer> dq = new ArrayDeque<>();
    int[] out = new int[nums.length - k + 1];
    for (int i = 0; i < nums.length; i++) {
        while (!dq.isEmpty() && dq.peekFirst() <= i - k) dq.pollFirst();
        while (!dq.isEmpty() && nums[dq.peekLast()] < nums[i]) dq.pollLast();
        dq.offerLast(i);
        if (i >= k - 1) out[i - k + 1] = nums[dq.peekFirst()];
    }
    return out;
}
```

**Key points:**
- Deque holds indices in decreasing value order; front is the running max.
- Each index is pushed and popped at most once — amortized O(n).
- Drop front when its index falls out of the window of size k.

**Tags:** #algorithm

---

### 31. Valid Parentheses

**Difficulty:** Easy
**Topics:** stack, string, matching, edge-cases
**Position:** SWE
**Years:** L60-L62

**Question:** Given a string containing only `()[]{}`, determine whether the brackets are balanced and correctly nested. Discuss the edge cases.

**Approach:** Push every opening bracket onto a stack; on a closing bracket, the top must be its matching opener, else fail. Use a hash map from closing to opening for clean matching. O(n) time, O(n) space. Microsoft probes the two classic edge cases: a closing bracket when the stack is empty, and a non-empty stack at the end (unclosed openers).

**Python:**
```python
def is_valid(s: str) -> bool:
    pairs = {")": "(", "]": "[", "}": "{"}
    stack: list[str] = []
    for ch in s:
        if ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
        else:
            stack.append(ch)
    return not stack
```

**TypeScript:**
```typescript
function isValid(s: string): boolean {
  const pairs: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
  const stack: string[] = [];
  for (const ch of s) {
    if (ch in pairs) {
      if (stack.pop() !== pairs[ch]) return false;
    } else {
      stack.push(ch);
    }
  }
  return stack.length === 0;
}
```

**Java:**
```java
static boolean isValid(String s) {
    Map<Character, Character> pairs = Map.of(')', '(', ']', '[', '}', '{');
    Deque<Character> stack = new ArrayDeque<>();
    for (char ch : s.toCharArray()) {
        if (pairs.containsKey(ch)) {
            if (stack.isEmpty() || stack.pop() != pairs.get(ch)) return false;
        } else {
            stack.push(ch);
        }
    }
    return stack.isEmpty();
}
```

**Key points:**
- A stack is the natural fit: last opened must be first closed.
- Check for an empty stack before popping on a closing bracket.
- Must also verify the stack is empty at the end — `([)]` and `(` both fail differently.
- O(n) time, O(n) space in the worst case (all openers).

**Follow-ups:**
- Support arbitrary bracket alphabets passed in as config.
- Return the index of the first mismatch instead of a boolean.
- Minimum insertions/removals to make the string valid.

**Common Pitfalls:**
- Popping without an emptiness check throws on `"]"`.
- Returning `true` while the stack still holds unclosed openers.

**Tags:** #algorithm

---

### 32. Daily Temperatures

**Difficulty:** Medium
**Topics:** stack, monotonic-stack, array, greedy
**Position:** SWE
**Years:** L60-L62

**Question:** Given an array of daily temperatures, return an array where each entry is the number of days you must wait for a warmer temperature; put 0 if there is no future warmer day. Discuss why a stack beats the brute force.

**Approach:** Keep a monotonic decreasing stack of indices whose warmer day is still unknown. For each day, while the current temperature exceeds the temperature at the stack's top index, pop and record the day gap. O(n) time — each index is pushed and popped once — and O(n) space. The discussion point: unresolved indices left on the stack correctly stay 0.

**Python:**
```python
def daily_temperatures(temperatures: list[int]) -> list[int]:
    answer = [0] * len(temperatures)
    stack: list[int] = []  # indices, decreasing temperatures
    for i, temp in enumerate(temperatures):
        while stack and temperatures[stack[-1]] < temp:
            prev = stack.pop()
            answer[prev] = i - prev
        stack.append(i)
    return answer
```

**TypeScript:**
```typescript
function dailyTemperatures(temperatures: number[]): number[] {
  const answer: number[] = new Array(temperatures.length).fill(0);
  const stack: number[] = []; // indices, decreasing temperatures
  for (let i = 0; i < temperatures.length; i++) {
    while (stack.length && temperatures[stack[stack.length - 1]] < temperatures[i]) {
      const prev = stack.pop()!;
      answer[prev] = i - prev;
    }
    stack.push(i);
  }
  return answer;
}
```

**Java:**
```java
static int[] dailyTemperatures(int[] temperatures) {
    int[] answer = new int[temperatures.length];
    Deque<Integer> stack = new ArrayDeque<>(); // indices, decreasing temperatures
    for (int i = 0; i < temperatures.length; i++) {
        while (!stack.isEmpty() && temperatures[stack.peek()] < temperatures[i]) {
            int prev = stack.pop();
            answer[prev] = i - prev;
        }
        stack.push(i);
    }
    return answer;
}
```

**Key points:**
- Store indices, not values, so the day gap `i - prev` is computable.
- Monotonic decreasing stack: each index is pushed and popped at most once → O(n).
- Indices never popped stay 0 — the default answer needs no special casing.
- Use `<` (not `<=`) so equal temperatures do not count as warmer.

**Follow-ups:**
- Return the actual warmer temperature instead of the day count.
- Next Greater Element variants (circular array, mapped queries).
- Stream the temperatures — answer each day as data arrives.

**Common Pitfalls:**
- Pushing temperatures instead of indices, losing the distance.
- Using `<=` and treating an equal-temperature day as warmer.

**Tags:** #algorithm

---

### 33. Evaluate Reverse Polish Notation

**Difficulty:** Medium
**Topics:** stack, math, parsing, division
**Position:** SWE
**Years:** L60-L62

**Question:** Evaluate an arithmetic expression given in Reverse Polish (postfix) notation. Tokens are integers and the operators `+ - * /`. Discuss how you handle division and operand order.

**Approach:** Scan tokens left to right with a stack of operands. On an operator, pop the two most recent operands, apply `left OP right` (order matters for `-` and `/`), and push the result. O(n) time, O(n) space. Microsoft's edge case: division must truncate toward zero, so use `int(a / b)` in Python rather than `//`, which floors negatives incorrectly.

**Python:**
```python
def eval_rpn(tokens: list[str]) -> int:
    stack: list[int] = []
    ops = {"+", "-", "*", "/"}
    for tok in tokens:
        if tok in ops:
            right = stack.pop()
            left = stack.pop()
            if tok == "+":
                stack.append(left + right)
            elif tok == "-":
                stack.append(left - right)
            elif tok == "*":
                stack.append(left * right)
            else:
                stack.append(int(left / right))  # truncate toward zero
        else:
            stack.append(int(tok))
    return stack[-1]
```

**TypeScript:**
```typescript
function evalRPN(tokens: string[]): number {
  const stack: number[] = [];
  const ops = new Set(["+", "-", "*", "/"]);
  for (const tok of tokens) {
    if (ops.has(tok)) {
      const right = stack.pop()!;
      const left = stack.pop()!;
      if (tok === "+") stack.push(left + right);
      else if (tok === "-") stack.push(left - right);
      else if (tok === "*") stack.push(left * right);
      else stack.push(Math.trunc(left / right)); // truncate toward zero
    } else {
      stack.push(parseInt(tok, 10));
    }
  }
  return stack[stack.length - 1];
}
```

**Java:**
```java
static int evalRPN(String[] tokens) {
    Deque<Integer> stack = new ArrayDeque<>();
    Set<String> ops = Set.of("+", "-", "*", "/");
    for (String tok : tokens) {
        if (ops.contains(tok)) {
            int right = stack.pop();
            int left = stack.pop();
            switch (tok) {
                case "+" -> stack.push(left + right);
                case "-" -> stack.push(left - right);
                case "*" -> stack.push(left * right);
                default -> stack.push(left / right); // Java int division truncates toward zero
            }
        } else {
            stack.push(Integer.parseInt(tok));
        }
    }
    return stack.peek();
}
```

**Key points:**
- Operand order matters: pop `right` first, then `left`, apply `left OP right`.
- Division truncates toward zero — `int(a/b)` in Python, `Math.trunc` in TS; Java `/` already truncates.
- Each operator consumes two operands and produces one; a valid RPN leaves exactly one on the stack.
- O(n) time, O(n) space.

**Follow-ups:**
- Validate malformed input (too few operands, leftover operands).
- Extend to infix with the shunting-yard algorithm.
- Support unary minus or floating-point operands.

**Common Pitfalls:**
- Reversing operand order, breaking `-` and `/`.
- Using Python `//`, which floors and mishandles negative division.

**Tags:** #algorithm

---

## Hash Table

### 34. Group Anagrams

**Difficulty:** Medium
**Topics:** string, hashmap, sorting
**Position:** SWE
**Years:** L60-L62

**Question:** Given a list of strings, group all anagrams together.

**Approach:** Key each string by either its sorted characters (O(k log k) per string) or a length-26 count array serialized to a string (O(k)). Bucket into a hashmap. Total O(n * k). Discuss memory tradeoffs and Unicode considerations.

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
static List<List<String>> groupAnagrams(String[] strs) {
    Map<String, List<String>> groups = new HashMap<>();
    for (String s : strs) {
        char[] chars = s.toCharArray();
        Arrays.sort(chars);
        groups.computeIfAbsent(new String(chars), k -> new ArrayList<>()).add(s);
    }
    return new ArrayList<>(groups.values());
}
```

**Key points:**
- Sorted string is the simplest canonical key.
- A 26-length count vector key avoids per-string sorting for O(n*k).
- Group order is not specified by the problem.

**Tags:** #algorithm

---

### 35. Two Sum

**Difficulty:** Easy
**Topics:** array, hashmap, two-pointer
**Position:** SWE
**Years:** L60-L62

**Question:** Given an array of integers and a target, return the indices of the two numbers that add up to the target. Assume exactly one solution; discuss what changes if duplicates or multiple pairs are allowed.

**Approach:** One pass with a hashmap from value to index. For each element check whether `target - x` was already seen; if so return the stored index and the current one, otherwise record `x`. O(n) time, O(n) space. The edge case Microsoft probes: the complement equals the current value (e.g. target 6, value 3) — inserting after the lookup avoids reusing the same index.

**Python:**
```python
def two_sum(nums: list[int], target: int) -> list[int]:
    seen: dict[int, int] = {}
    for i, x in enumerate(nums):
        need = target - x
        if need in seen:
            return [seen[need], i]
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
static int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        int need = target - nums[i];
        if (seen.containsKey(need)) return new int[]{seen.get(need), i};
        seen.put(nums[i], i);
    }
    return new int[]{};
}
```

**Key points:**
- Hashmap turns the brute-force O(n^2) scan into a single O(n) pass.
- Look up the complement before inserting the current value to avoid matching an element with itself.
- Works with negatives and duplicates because values map to their latest index.

**Follow-ups:**
- Return all distinct pairs summing to target instead of one.
- Solve when the array is sorted — use two pointers for O(1) space.
- Handle a data stream where numbers arrive one at a time.

**Common Pitfalls:**
- Inserting into the map before the lookup, which can pair an index with itself.
- Assuming values are unique when only the answer is guaranteed unique.

**Tags:** #algorithm

---

### 36. Subarray Sum Equals K

**Difficulty:** Medium
**Topics:** array, hashmap, prefix-sum
**Position:** SWE
**Years:** L60-L62

**Question:** Given an integer array and an integer k, return the total number of contiguous subarrays whose sum equals k. Note the array can contain negatives, so sliding window does not apply — discuss why.

**Approach:** Maintain a running prefix sum and a hashmap from prefix value to how many times it has occurred, seeded with `{0: 1}` for subarrays starting at index 0. At each step add `count[prefix - k]` because that many earlier prefixes make a subarray summing to k. O(n) time, O(n) space. The key discussion point: negatives break the monotonic window assumption, so prefix-sum counting is required rather than two pointers.

**Python:**
```python
def subarray_sum(nums: list[int], k: int) -> int:
    count = 0
    prefix = 0
    seen: dict[int, int] = {0: 1}
    for x in nums:
        prefix += x
        count += seen.get(prefix - k, 0)
        seen[prefix] = seen.get(prefix, 0) + 1
    return count
```

**TypeScript:**
```typescript
function subarraySum(nums: number[], k: number): number {
  let count = 0, prefix = 0;
  const seen = new Map<number, number>();
  seen.set(0, 1);
  for (const x of nums) {
    prefix += x;
    count += seen.get(prefix - k) ?? 0;
    seen.set(prefix, (seen.get(prefix) ?? 0) + 1);
  }
  return count;
}
```

**Java:**
```java
static int subarraySum(int[] nums, int k) {
    int count = 0, prefix = 0;
    Map<Integer, Integer> seen = new HashMap<>();
    seen.put(0, 1);
    for (int x : nums) {
        prefix += x;
        count += seen.getOrDefault(prefix - k, 0);
        seen.merge(prefix, 1, Integer::sum);
    }
    return count;
}
```

**Key points:**
- A subarray sums to k iff `prefix[j] - prefix[i] == k`, so count earlier prefixes equal to `prefix - k`.
- Seed the map with `{0: 1}` so subarrays that start at index 0 are counted.
- Store counts, not just presence, because the same prefix value can recur.

**Follow-ups:**
- Return the longest subarray summing to k instead of the count.
- Extend to counting subarrays with sum divisible by k using prefix mod.
- Handle a 2D matrix variant (submatrix sum equals target).

**Common Pitfalls:**
- Forgetting the `{0: 1}` seed, undercounting subarrays anchored at the start.
- Using a set instead of a frequency map, losing repeated prefixes.

**Tags:** #algorithm

---

### 37. Longest Consecutive Sequence

**Difficulty:** Medium
**Topics:** array, hashset, union-find
**Position:** SWE
**Years:** L60-L62

**Question:** Given an unsorted array of integers, return the length of the longest run of consecutive integers (order in the array does not matter). Achieve O(n) time and discuss why sorting is not required.

**Approach:** Put all values in a hash set. Only start counting from a value `x` that has no predecessor `x - 1` in the set — that guarantees each run is walked exactly once. Extend upward while `x + length` exists and track the best. O(n) time, O(n) space; the set membership test replaces sorting's O(n log n). Edge case Microsoft probes: duplicates (dedup via the set) and the empty array returning 0.

**Python:**
```python
def longest_consecutive(nums: list[int]) -> int:
    num_set = set(nums)
    best = 0
    for x in num_set:
        if x - 1 not in num_set:
            length = 1
            while x + length in num_set:
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
static int longestConsecutive(int[] nums) {
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
```

**Key points:**
- Starting only at run-heads (no `x - 1` present) makes the inner walks total O(n), not O(n^2).
- The hash set both dedups values and gives O(1) membership, avoiding the sort.
- Empty input must return 0; the loop naturally yields that.

**Follow-ups:**
- Return the actual sequence, not just its length.
- Solve with union-find, unioning each value to its neighbors.
- Handle a streaming version where numbers arrive over time.

**Common Pitfalls:**
- Extending upward from every element, degrading to O(n^2).
- Forgetting to dedup, which inflates work but not correctness here.

**Tags:** #algorithm

---

## Binary Search

### 38. Search in Rotated Sorted Array

**Difficulty:** Medium
**Topics:** binary-search, arrays, divide-and-conquer
**Position:** SWE
**Years:** L60-L62

**Question:** An ascending array with distinct values was rotated at an unknown pivot. Given the array and a target, return its index or -1 in O(log n). Discuss why a plain binary search fails and the edge cases you check.

**Approach:** One-pass binary search. At each `mid`, exactly one half is sorted: compare `nums[lo]` to `nums[mid]` to find which side is ordered, then test whether the target lies inside that sorted half to decide which way to move. O(log n) time, O(1) space. Microsoft probes the boundary comparisons (`<=` vs `<`) and the empty-array case.

**Python:**
```python
def search(nums: list[int], target: int) -> int:
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[lo] <= nums[mid]:  # left half is sorted
            if nums[lo] <= target < nums[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:  # right half is sorted
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
    if (nums[lo] <= nums[mid]) { // left half is sorted
      if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
      else lo = mid + 1;
    } else { // right half is sorted
      if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return -1;
}
```

**Java:**
```java
static int search(int[] nums, int target) {
    int lo = 0, hi = nums.length - 1;
    while (lo <= hi) {
        int mid = (lo + hi) >>> 1;
        if (nums[mid] == target) return mid;
        if (nums[lo] <= nums[mid]) { // left half is sorted
            if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
            else lo = mid + 1;
        } else { // right half is sorted
            if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
            else hi = mid - 1;
        }
    }
    return -1;
}
```

**Key points:**
- One half of `[lo..hi]` is always sorted; identify it, then check if the target falls within it.
- O(log n) time, O(1) space — a single binary search, no need to find the pivot first.
- Inclusive bounds `while lo <= hi` with `>>> 1` (Java) avoids overflow; empty array returns -1 immediately.

**Follow-ups:**
- Handle duplicates (Search in Rotated Sorted Array II) — worst case degrades to O(n).
- Find the rotation pivot index separately, then run a classic binary search on the correct segment.
- Return the insertion index if the target is absent.

**Common Pitfalls:**
- Using `<` instead of `<=` when comparing `nums[lo]` and `nums[mid]` mishandles the two-element case.
- Forgetting the target could equal `nums[lo]` or `nums[hi]` at a sorted boundary.

**Tags:** #algorithm

---

### 39. Find First and Last Position of Element in Sorted Array

**Difficulty:** Medium
**Topics:** binary-search, arrays
**Position:** SWE
**Years:** L60-L62

**Question:** Given a non-decreasing array and a target, return the first and last index of the target as `[first, last]`, or `[-1, -1]` if absent. Must run in O(log n); discuss the edge cases.

**Approach:** Run two binary searches for the left and right boundary. A shared helper keeps recording the current `mid` when `nums[mid] == target` but keeps shrinking left (for the first) or right (for the last) to hunt for the extreme index. O(log n) time, O(1) space. Microsoft checks the absent-target and all-equal-elements cases.

**Python:**
```python
def search_range(nums: list[int], target: int) -> list[int]:
    def bound(is_first: bool) -> int:
        lo, hi, res = 0, len(nums) - 1, -1
        while lo <= hi:
            mid = (lo + hi) // 2
            if nums[mid] == target:
                res = mid
                if is_first:
                    hi = mid - 1
                else:
                    lo = mid + 1
            elif nums[mid] < target:
                lo = mid + 1
            else:
                hi = mid - 1
        return res
    return [bound(True), bound(False)]
```

**TypeScript:**
```typescript
function searchRange(nums: number[], target: number): number[] {
  const bound = (isFirst: boolean): number => {
    let lo = 0, hi = nums.length - 1, res = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (nums[mid] === target) {
        res = mid;
        if (isFirst) hi = mid - 1;
        else lo = mid + 1;
      } else if (nums[mid] < target) lo = mid + 1;
      else hi = mid - 1;
    }
    return res;
  };
  return [bound(true), bound(false)];
}
```

**Java:**
```java
static int[] searchRange(int[] nums, int target) {
    return new int[]{ bound(nums, target, true), bound(nums, target, false) };
}

static int bound(int[] nums, int target, boolean isFirst) {
    int lo = 0, hi = nums.length - 1, res = -1;
    while (lo <= hi) {
        int mid = (lo + hi) >>> 1;
        if (nums[mid] == target) {
            res = mid;
            if (isFirst) hi = mid - 1;
            else lo = mid + 1;
        } else if (nums[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return res;
}
```

**Key points:**
- On a match, record the index but keep searching the appropriate side instead of returning early.
- Two independent O(log n) passes — total O(log n) time, O(1) space.
- `res` initialized to -1 naturally yields `[-1, -1]` for an absent target and an empty array.

**Follow-ups:**
- Return the total count of the target (`last - first + 1`).
- Generalize to `lower_bound` / `upper_bound` (first index `>= target` and first `> target`).
- Handle a stream where the array grows — when to rebuild the index.

**Common Pitfalls:**
- Returning on the first match gives an arbitrary occurrence, not the boundary.
- Moving the wrong pointer on a match (shrinking right for the first index) finds the wrong extreme.

**Tags:** #algorithm

---

### 40. Find Minimum in Rotated Sorted Array

**Difficulty:** Medium
**Topics:** binary-search, arrays
**Position:** SWE
**Years:** L60-L62

**Question:** An ascending array of distinct values was rotated at an unknown pivot. Return the minimum element in O(log n). Discuss the invariant and the case where the array was not actually rotated.

**Approach:** Binary search comparing `nums[mid]` to `nums[hi]`. If `nums[mid] > nums[hi]` the minimum lies strictly to the right (`lo = mid + 1`); otherwise it is at `mid` or to its left (`hi = mid`). The loop shrinks to a single index — the minimum. O(log n) time, O(1) space. Microsoft probes why comparing to `nums[hi]` (not `nums[lo]`) handles the non-rotated array cleanly.

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
static int findMin(int[] nums) {
    int lo = 0, hi = nums.length - 1;
    while (lo < hi) {
        int mid = (lo + hi) >>> 1;
        if (nums[mid] > nums[hi]) lo = mid + 1;
        else hi = mid;
    }
    return nums[lo];
}
```

**Key points:**
- Compare to `nums[hi]`, not `nums[lo]`: a fully sorted (non-rotated) array then always takes the `hi = mid` branch and converges to index 0.
- Use `while lo < hi` with `hi = mid` (never `mid - 1`) so the minimum candidate is never skipped and the loop still terminates.
- O(log n) time, O(1) space; single-element array returns that element.

**Follow-ups:**
- Handle duplicates (Find Minimum II) — on `nums[mid] == nums[hi]`, do `hi -= 1`, worst case O(n).
- Return the rotation count (the index of the minimum).
- Combine with target search: locate the pivot, then binary-search the right segment.

**Common Pitfalls:**
- Setting `hi = mid - 1` can skip over the actual minimum.
- Comparing against `nums[lo]` mishandles the already-sorted array.

**Tags:** #algorithm

---

## Dynamic Programming

### 41. Best Time to Buy and Sell Stock

**Difficulty:** Easy
**Topics:** arrays, dp, greedy
**Position:** SWE
**Years:** L60-L62

**Question:** Given daily prices, find the max profit from a single buy and sell transaction.

**Approach:** One pass, track `min_seen` and `max_profit = max(max_profit, price - min_seen)`. O(n) time, O(1) space. Follow-ups Microsoft asks: at most 2 transactions, unlimited transactions, with cooldown, with fee.

**Python:**
```python
def max_profit(prices: list[int]) -> int:
    lo = float("inf")
    best = 0
    for p in prices:
        lo = min(lo, p)
        best = max(best, p - lo)
    return best
```

**TypeScript:**
```typescript
function maxProfit(prices: number[]): number {
  let lo = Infinity, best = 0;
  for (const p of prices) {
    if (p < lo) lo = p;
    else if (p - lo > best) best = p - lo;
  }
  return best;
}
```

**Java:**
```java
static int maxProfit(int[] prices) {
    int lo = Integer.MAX_VALUE, best = 0;
    for (int p : prices) {
        if (p < lo) lo = p;
        else if (p - lo > best) best = p - lo;
    }
    return best;
}
```

**Key points:**
- Buy must precede sell, so update `lo` before computing today's profit.
- Returns 0 for monotonically decreasing prices.
- Single-pass O(n) beats brute-force O(n^2) over all pairs.

**Follow-ups:**
- At most 2 transactions — 4-state DP.
- Unlimited transactions — sum every positive day-to-day delta.
- With cooldown / transaction fee — extra state in DP.
- Return the *day indices* of the optimal buy/sell, not just the profit.

**Common Pitfalls:**
- Initializing `lo` to `prices[0]` and starting the loop at 0 — yields a transient profit of 0; fine but confusing.
- Resetting `best` whenever a new `lo` is found — must keep the running maximum.

**Tags:** #algorithm

---

### 42. Maximum Subarray

**Difficulty:** Medium
**Topics:** arrays, dp, kadane
**Position:** SWE
**Years:** L60-L62

**Question:** Given an integer array, find the contiguous subarray with the largest sum and return that sum.

**Approach:** Kadane's algorithm: `cur = max(x, cur + x); best = max(best, cur)`. O(n) time, O(1) space. Follow-up: also return the indices. Divide-and-conquer variant in O(n log n) is a good discussion if asked.

**Python:**
```python
def max_sub_array(nums: list[int]) -> int:
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
static int maxSubArray(int[] nums) {
    int cur = nums[0], best = nums[0];
    for (int i = 1; i < nums.length; i++) {
        cur = Math.max(nums[i], cur + nums[i]);
        best = Math.max(best, cur);
    }
    return best;
}
```

**Key points:**
- `cur` is the best subarray sum ending at the current index.
- All-negative arrays correctly return the single largest element.
- To recover indices, track start whenever `cur` resets to `nums[i]`.

**Tags:** #algorithm

---

### 43. Palindromic Substrings

**Difficulty:** Medium
**Topics:** string, dp, two-pointers
**Position:** SWE
**Years:** L60-L62

**Question:** Given a string, count how many substrings are palindromes.

**Approach:** Expand-around-center: for each index, expand odd-length and even-length centers, count while characters match. O(n^2) time, O(1) space. Manacher's algorithm gives O(n) — mention it but don't code unless asked.

**Python:**
```python
def count_substrings(s: str) -> int:
    def grow(l: int, r: int) -> int:
        c = 0
        while l >= 0 and r < len(s) and s[l] == s[r]:
            c += 1; l -= 1; r += 1
        return c
    return sum(grow(i, i) + grow(i, i + 1) for i in range(len(s)))
```

**TypeScript:**
```typescript
function countSubstrings(s: string): number {
  const grow = (l: number, r: number): number => {
    let c = 0;
    while (l >= 0 && r < s.length && s[l] === s[r]) { c++; l--; r++; }
    return c;
  };
  let total = 0;
  for (let i = 0; i < s.length; i++) total += grow(i, i) + grow(i, i + 1);
  return total;
}
```

**Java:**
```java
static int countSubstrings(String s) {
    int total = 0;
    for (int i = 0; i < s.length(); i++) total += grow(s, i, i) + grow(s, i, i + 1);
    return total;
}

private static int grow(String s, int l, int r) {
    int c = 0;
    while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) { c++; l--; r++; }
    return c;
}
```

**Key points:**
- Each successful expansion step is exactly one palindromic substring.
- Both odd (`i, i`) and even (`i, i+1`) centers must be considered.
- Manacher's algorithm gets O(n) but is rarely required.

**Tags:** #algorithm

---

### 44. House Robber

**Difficulty:** Medium
**Topics:** dp, arrays
**Position:** SWE
**Years:** L60-L62

**Question:** Given an array of non-negative integers representing the amount of money at each house, find the maximum you can rob without robbing two adjacent houses.

**Approach:** DP: `f(i) = max(f(i-1), f(i-2) + nums[i])`. Track only two scalars `prev2, prev1`. O(n) time, O(1) space. Follow-up: House Robber II (circular) — run twice, excluding first or last house.

**Python:**
```python
def rob(nums: list[int]) -> int:
    prev2 = prev1 = 0
    for x in nums:
        prev2, prev1 = prev1, max(prev1, prev2 + x)
    return prev1
```

**TypeScript:**
```typescript
function rob(nums: number[]): number {
  let prev2 = 0, prev1 = 0;
  for (const x of nums) {
    const cur = Math.max(prev1, prev2 + x);
    prev2 = prev1;
    prev1 = cur;
  }
  return prev1;
}
```

**Java:**
```java
static int rob(int[] nums) {
    int prev2 = 0, prev1 = 0;
    for (int x : nums) {
        int cur = Math.max(prev1, prev2 + x);
        prev2 = prev1;
        prev1 = cur;
    }
    return prev1;
}
```

**Key points:**
- Each house: take it plus best up to i-2, or skip it.
- Two rolling scalars suffice; full DP array is unnecessary.
- Empty input safely returns 0.

**Tags:** #algorithm

---

### 45. Coin Change

**Difficulty:** Medium
**Topics:** dp, arrays
**Position:** SWE
**Years:** L62-L63

**Question:** Given coin denominations and a target amount, return the fewest coins needed to make that amount, or -1 if impossible.

**Approach:** Bottom-up DP: `dp[a] = min(dp[a - c] + 1)` over all coins c <= a. Initialize `dp[0] = 0`, others `inf`. O(amount * coins) time, O(amount) space. BFS variant treats it as shortest path from 0 to amount.

**Python:**
```python
def coin_change(coins: list[int], amount: int) -> int:
    dp: list[float] = [float("inf")] * (amount + 1)
    dp[0] = 0
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a and dp[a - c] + 1 < dp[a]:
                dp[a] = dp[a - c] + 1
    return -1 if dp[amount] == float("inf") else int(dp[amount])
```

**TypeScript:**
```typescript
function coinChange(coins: number[], amount: number): number {
  const dp = new Array<number>(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) {
      if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}
```

**Java:**
```java
static int coinChange(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, amount + 1);
    dp[0] = 0;
    for (int a = 1; a <= amount; a++)
        for (int c : coins)
            if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
    return dp[amount] > amount ? -1 : dp[amount];
}
```

**Key points:**
- `dp[0] = 0` is the base case; `inf` marks unreachable amounts.
- O(amount * |coins|) time, O(amount) space.
- BFS layered by coins also works and stops as soon as `amount` is reached.

**Tags:** #algorithm

---

### 46. Decode Ways

**Difficulty:** Medium
**Topics:** dp, string
**Position:** SWE
**Years:** L62-L63

**Question:** A message containing letters A-Z is encoded as 1-26. Given a digit string, return the number of ways to decode it.

**Approach:** DP: `f(i) = (s[i-1] != '0' ? f(i-1) : 0) + (10 <= int(s[i-2..i]) <= 26 ? f(i-2) : 0)`. Edge: leading zeros, `"0"`, `"30"`. O(n) time, O(1) space with two scalars.

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
  if (s.length === 0 || s[0] === "0") return 0;
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
static int numDecodings(String s) {
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
- Two transitions: take 1 digit (if non-zero) or 2 digits (if 10–26).
- `"0"` and leading zeros decode to 0 ways.
- Two scalars give O(1) space; full DP array is unnecessary.

**Tags:** #algorithm

---

### 47. Climbing Stairs

**Difficulty:** Easy
**Topics:** dp, recursion
**Position:** SWE
**Years:** L60-L62

**Question:** You climb n stairs taking 1 or 2 steps at a time. How many distinct ways?

**Approach:** Fibonacci: `f(n) = f(n-1) + f(n-2)`. Iterate with two scalars. O(n) time, O(1) space. Discuss memoization vs tabulation; matrix exponentiation gives O(log n) if pressed.

**Python:**
```python
def climb_stairs(n: int) -> int:
    a, b = 1, 1
    for _ in range(n):
        a, b = b, a + b
    return a
```

**TypeScript:**
```typescript
function climbStairs(n: number): number {
  let a = 1, b = 1;
  for (let i = 0; i < n; i++) [a, b] = [b, a + b];
  return a;
}
```

**Java:**
```java
static int climbStairs(int n) {
    int a = 1, b = 1;
    for (int i = 0; i < n; i++) {
        int next = a + b;
        a = b;
        b = next;
    }
    return a;
}
```

**Key points:**
- Base: `f(0) = f(1) = 1`.
- O(n) time, O(1) space — two scalars rotate.
- Matrix exponentiation reduces to O(log n) but is overkill here.

**Tags:** #algorithm

---

### 48. Longest Palindromic Substring

**Difficulty:** Medium
**Topics:** string, dp, two-pointers
**Position:** SWE
**Years:** L62-L63

**Question:** Given a string, return the longest palindromic substring.

**Approach:** Expand-around-center: for each index, try odd and even centers and grow while characters match. Track best (start, length). O(n^2) time, O(1) space. Manacher's gives O(n) but is rarely required in Microsoft interviews.

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
static String longestPalindrome(String s) {
    int bl = 0, br = 0;
    for (int i = 0; i < s.length(); i++) {
        int[] a = growLP(s, i, i), b = growLP(s, i, i + 1);
        if (a[1] - a[0] > br - bl) { bl = a[0]; br = a[1]; }
        if (b[1] - b[0] > br - bl) { bl = b[0]; br = b[1]; }
    }
    return s.substring(bl, br + 1);
}

private static int[] growLP(String s, int l, int r) {
    while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) { l--; r++; }
    return new int[]{l + 1, r - 1};
}
```

**Key points:**
- Try both odd (one center) and even (two-center) palindromes per index.
- Track best by length difference, not by recomputing slices.
- O(n^2) time, O(1) space; Manacher's is O(n) but rarely required.

**Tags:** #algorithm

---

### 49. Longest Increasing Subsequence

**Difficulty:** Medium
**Topics:** dp, binary-search
**Position:** Senior SWE
**Years:** L62-L63

**Question:** Given an array of integers, return the length of the longest strictly increasing subsequence.

**Approach:** O(n^2) DP: `f(i) = 1 + max(f(j) for j < i if nums[j] < nums[i])`. O(n log n): maintain `tails[]` where `tails[k]` is the smallest tail of any increasing subsequence of length k+1; binary-search each new element. Note: `tails` is not itself a valid LIS but its length is correct.

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
      if (tails[mid] < x) lo = mid + 1; else hi = mid;
    }
    if (lo === tails.length) tails.push(x);
    else tails[lo] = x;
  }
  return tails.length;
}
```

**Java:**
```java
static int lengthOfLIS(int[] nums) {
    List<Integer> tails = new ArrayList<>();
    for (int x : nums) {
        int lo = 0, hi = tails.size();
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (tails.get(mid) < x) lo = mid + 1; else hi = mid;
        }
        if (lo == tails.size()) tails.add(x);
        else tails.set(lo, x);
    }
    return tails.size();
}
```

**Key points:**
- `tails[k]` is the smallest possible tail for an increasing subseq of length k+1.
- Binary-search replacement keeps `tails` sorted in O(log n) per insert.
- `tails` length is the correct LIS length even though `tails` itself is not a valid LIS.

**Tags:** #algorithm

---

### 50. Edit Distance

**Difficulty:** Hard
**Topics:** dp, string
**Position:** Senior SWE
**Years:** L62-L63

**Question:** Given two strings, return the minimum number of insert, delete, or replace operations to convert one to the other.

**Approach:** 2D DP: `dp[i][j] = dp[i-1][j-1]` if characters match, else `1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])`. O(m*n) time and space. Can reduce to O(min(m, n)) space by keeping two rows.

**Python:**
```python
def min_distance(a: str, b: str) -> int:
    m, n = len(a), len(b)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1): dp[i][0] = i
    for j in range(n + 1): dp[0][j] = j
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    return dp[m][n]
```

**TypeScript:**
```typescript
function minDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}
```

**Java:**
```java
static int minDistance(String a, String b) {
    int m = a.length(), n = b.length();
    int[][] dp = new int[m + 1][n + 1];
    for (int i = 0; i <= m; i++) dp[i][0] = i;
    for (int j = 0; j <= n; j++) dp[0][j] = j;
    for (int i = 1; i <= m; i++)
        for (int j = 1; j <= n; j++)
            if (a.charAt(i - 1) == b.charAt(j - 1)) dp[i][j] = dp[i - 1][j - 1];
            else dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], Math.min(dp[i - 1][j], dp[i][j - 1]));
    return dp[m][n];
}
```

**Key points:**
- Three transitions correspond to insert, delete, and replace.
- Base row/col encode cost of transforming empty prefix.
- Two rolling rows reduce space to O(min(m, n)).

**Tags:** #algorithm

---

### 51. Unique Paths

**Difficulty:** Medium
**Topics:** dp, combinatorics, arrays
**Position:** SWE
**Years:** L60-L62

**Question:** A robot starts at the top-left of an `m x n` grid and can move only right or down. Count the number of distinct paths to the bottom-right corner. Discuss the space trade-off.

**Approach:** DP where `dp[i][j] = dp[i-1][j] + dp[i][j-1]`, with the first row and column all 1. Collapse to a single rolling row so `dp[j] += dp[j-1]`, giving O(m*n) time and O(n) space. Edge case Microsoft probes: a 1-wide or 1-tall grid has exactly one path; the combinatorial closed form C(m+n-2, m-1) is a nice follow-up.

**Python:**
```python
def unique_paths(m: int, n: int) -> int:
    dp = [1] * n
    for _ in range(1, m):
        for j in range(1, n):
            dp[j] += dp[j - 1]
    return dp[-1]
```

**TypeScript:**
```typescript
function uniquePaths(m: number, n: number): number {
  const dp = new Array<number>(n).fill(1);
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      dp[j] += dp[j - 1];
    }
  }
  return dp[n - 1];
}
```

**Java:**
```java
static int uniquePaths(int m, int n) {
    int[] dp = new int[n];
    Arrays.fill(dp, 1);
    for (int i = 1; i < m; i++)
        for (int j = 1; j < n; j++)
            dp[j] += dp[j - 1];
    return dp[n - 1];
}
```

**Key points:**
- Base case: entire first row and first column are 1 (only one way to reach them).
- 1D rolling array cuts space from O(m*n) to O(n); `dp[j-1]` is already this-row, `dp[j]` is still prev-row.
- Closed form is C(m+n-2, m-1) in O(min(m,n)) time.

**Follow-ups:**
- Unique Paths II: some cells are blocked (set their `dp` to 0).
- Count paths in a grid with weights (minimum path sum instead).
- Return the paths themselves, not just the count.

**Common Pitfalls:**
- Iterating `j` from 0 instead of 1 wipes the base-case column with a self-add.
- Overflow for large grids in Java/TS — mention `long`/BigInt.

**Tags:** #algorithm

---

### 52. Longest Common Subsequence

**Difficulty:** Medium
**Topics:** dp, string, arrays
**Position:** SWE
**Years:** L62-L63

**Question:** Given two strings, return the length of their longest common subsequence (a subsequence keeps relative order but need not be contiguous). Discuss how you would reconstruct the subsequence itself.

**Approach:** 2D DP over prefixes: if `a[i-1] == b[j-1]` then `dp[i][j] = dp[i-1][j-1] + 1`, else `max(dp[i-1][j], dp[i][j-1])`. O(m*n) time and O(m*n) space, reducible to O(min(m,n)) with two rows. The pitfall Microsoft watches for is confusing subsequence with substring (contiguity).

**Python:**
```python
def longest_common_subsequence(a: str, b: str) -> int:
    m, n = len(a), len(b)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    return dp[m][n]
```

**TypeScript:**
```typescript
function longestCommonSubsequence(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}
```

**Java:**
```java
static int longestCommonSubsequence(String a, String b) {
    int m = a.length(), n = b.length();
    int[][] dp = new int[m + 1][n + 1];
    for (int i = 1; i <= m; i++)
        for (int j = 1; j <= n; j++)
            if (a.charAt(i - 1) == b.charAt(j - 1))
                dp[i][j] = dp[i - 1][j - 1] + 1;
            else
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    return dp[m][n];
}
```

**Key points:**
- The extra row/column of zeros encodes the empty-prefix base case cleanly.
- Match extends the diagonal; mismatch drops one character from either string.
- O(m*n) time; space shrinks to two rows since only `i-1` and `i` are needed.

**Follow-ups:**
- Reconstruct the actual LCS by backtracking through the table.
- Longest common substring (contiguous) — reset to 0 on mismatch, track the max.
- Edit distance / shortest common supersequence share this scaffold.

**Common Pitfalls:**
- Off-by-one between string index `i-1` and DP index `i`.
- Confusing subsequence with substring.

**Tags:** #algorithm

---

### 53. Word Break

**Difficulty:** Medium
**Topics:** dp, string, hashset
**Position:** SWE
**Years:** L62-L63

**Question:** Given a string `s` and a dictionary of words, return whether `s` can be segmented into a space-separated sequence of one or more dictionary words. Words may be reused. Discuss edge cases.

**Approach:** DP where `dp[i]` is true if `s[:i]` is segmentable; `dp[i]` is true when some `j < i` has `dp[j]` true and `s[j:i]` is in the dictionary (stored in a hash set for O(1) lookup). O(n^2) substrings times O(k) hashing. Microsoft probes the empty-string base case `dp[0] = True` and the early `break` once a split is found.

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
static boolean wordBreak(String s, List<String> wordDict) {
    Set<String> words = new HashSet<>(wordDict);
    int n = s.length();
    boolean[] dp = new boolean[n + 1];
    dp[0] = true;
    for (int i = 1; i <= n; i++) {
        for (int j = 0; j < i; j++) {
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
- `dp[0] = True` models the empty prefix, so the first real word can anchor.
- Hash set lookup keeps each substring check O(length) instead of scanning the list.
- O(n^2) substring pairs; `break` on the first valid split is a small constant win.

**Follow-ups:**
- Word Break II: return all sentences (backtracking with memoization).
- Bound the inner loop by the max word length to prune.
- Handle huge dictionaries with a Trie instead of a set.

**Common Pitfalls:**
- Forgetting `dp[0] = True` makes every answer false.
- Naive recursion without memo is exponential (e.g. "aaaa...ab").

**Tags:** #algorithm

---

## Backtracking

### 54. Word Search

**Difficulty:** Medium
**Topics:** backtracking, matrix, dfs
**Position:** SWE
**Years:** L60-L62

**Question:** Given a 2D board of letters and a word, return true if the word can be constructed from adjacent cells (horizontal/vertical, no cell reuse).

**Approach:** DFS from each cell that matches `word[0]`. Mark visited by temporarily setting to a sentinel char, restore on backtrack (saves O(mn) visited array). O(m*n*4^L) worst. Follow-up: word search II (multiple words) → trie + DFS.

**Python:**
```python
def exist(board: list[list[str]], word: str) -> bool:
    rows, cols = len(board), len(board[0])
    def dfs(r: int, c: int, i: int) -> bool:
        if i == len(word):
            return True
        if r < 0 or r >= rows or c < 0 or c >= cols or board[r][c] != word[i]:
            return False
        board[r][c] = "#"
        found = any(dfs(r + dr, c + dc, i + 1) for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)))
        board[r][c] = word[i]
        return found
    return any(dfs(r, c, 0) for r in range(rows) for c in range(cols))
```

**TypeScript:**
```typescript
function exist(board: string[][], word: string): boolean {
  const rows = board.length, cols = board[0].length;
  const dfs = (r: number, c: number, i: number): boolean => {
    if (i === word.length) return true;
    if (r < 0 || r >= rows || c < 0 || c >= cols || board[r][c] !== word[i]) return false;
    const saved = board[r][c];
    board[r][c] = "#";
    const found = dfs(r + 1, c, i + 1) || dfs(r - 1, c, i + 1) || dfs(r, c + 1, i + 1) || dfs(r, c - 1, i + 1);
    board[r][c] = saved;
    return found;
  };
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (dfs(r, c, 0)) return true;
  return false;
}
```

**Java:**
```java
static boolean exist(char[][] board, String word) {
    for (int r = 0; r < board.length; r++)
        for (int c = 0; c < board[0].length; c++)
            if (dfs(board, word, r, c, 0)) return true;
    return false;
}

private static boolean dfs(char[][] b, String w, int r, int c, int i) {
    if (i == w.length()) return true;
    if (r < 0 || r >= b.length || c < 0 || c >= b[0].length || b[r][c] != w.charAt(i)) return false;
    char saved = b[r][c];
    b[r][c] = '#';
    boolean found = dfs(b, w, r + 1, c, i + 1) || dfs(b, w, r - 1, c, i + 1)
                 || dfs(b, w, r, c + 1, i + 1) || dfs(b, w, r, c - 1, i + 1);
    b[r][c] = saved;
    return found;
}
```

**Key points:**
- Mutating the board as a visited marker saves O(m*n) memory.
- Restore the cell on backtrack so other start points stay valid.
- Worst-case O(m*n*4^L); early character mismatch prunes aggressively.

**Follow-ups:**
- Word Search II — search a dictionary of words at once with a trie.
- Allow diagonal moves — 8 directions instead of 4.
- Reuse cells allowed — different problem (infinite paths possible).
- Return *all* matching start positions, not just true/false.

**Common Pitfalls:**
- Forgetting to restore the cell on backtrack — only the first DFS works.
- Marking with a letter that could appear in the word itself — use a non-alpha sentinel.

**Tags:** #algorithm

---

### 55. Generate Parentheses

**Difficulty:** Medium
**Topics:** backtracking, recursion, string
**Position:** SWE
**Years:** L60-L62

**Question:** Given n, generate all combinations of n pairs of well-formed parentheses.

**Approach:** Backtracking with counters `open` and `close`: add '(' if `open < n`, add ')' if `close < open`. Stop when length is `2n`. O(Catalan(n)) outputs. Cleaner than filtering all 2^(2n) strings.

**Python:**
```python
def generate_parenthesis(n: int) -> list[str]:
    out: list[str] = []
    def go(buf: list[str], open_n: int, close_n: int) -> None:
        if len(buf) == 2 * n:
            out.append("".join(buf))
            return
        if open_n < n:
            buf.append("("); go(buf, open_n + 1, close_n); buf.pop()
        if close_n < open_n:
            buf.append(")"); go(buf, open_n, close_n + 1); buf.pop()
    go([], 0, 0)
    return out
```

**TypeScript:**
```typescript
function generateParenthesis(n: number): string[] {
  const out: string[] = [];
  const go = (buf: string[], openN: number, closeN: number): void => {
    if (buf.length === 2 * n) { out.push(buf.join("")); return; }
    if (openN < n) { buf.push("("); go(buf, openN + 1, closeN); buf.pop(); }
    if (closeN < openN) { buf.push(")"); go(buf, openN, closeN + 1); buf.pop(); }
  };
  go([], 0, 0);
  return out;
}
```

**Java:**
```java
static List<String> generateParenthesis(int n) {
    List<String> out = new ArrayList<>();
    go(new StringBuilder(), 0, 0, n, out);
    return out;
}

private static void go(StringBuilder buf, int openN, int closeN, int n, List<String> out) {
    if (buf.length() == 2 * n) { out.add(buf.toString()); return; }
    if (openN < n) {
        buf.append('('); go(buf, openN + 1, closeN, n, out); buf.deleteCharAt(buf.length() - 1);
    }
    if (closeN < openN) {
        buf.append(')'); go(buf, openN, closeN + 1, n, out); buf.deleteCharAt(buf.length() - 1);
    }
}
```

**Key points:**
- Only generate valid prefixes — never need to validate after.
- Each output has exactly `2n` characters.
- Output count is the n-th Catalan number.

**Tags:** #algorithm

---

### 56. Subsets

**Difficulty:** Medium
**Topics:** backtracking, bit-manipulation
**Position:** SWE
**Years:** L60-L62

**Question:** Given a set of distinct integers, return all possible subsets (the power set).

**Approach:** Two approaches. Iterative: for each new element, duplicate existing subsets and append. Backtracking: at each index choose include / exclude. Bit-mask: enumerate `0..2^n - 1`, include `nums[i]` if bit i is set. O(n * 2^n) time and space.

**Python:**
```python
def subsets(nums: list[int]) -> list[list[int]]:
    out: list[list[int]] = []
    cur: list[int] = []
    def go(start: int) -> None:
        out.append(cur.copy())
        for i in range(start, len(nums)):
            cur.append(nums[i])
            go(i + 1)
            cur.pop()
    go(0)
    return out
```

**TypeScript:**
```typescript
function subsets(nums: number[]): number[][] {
  const out: number[][] = [];
  const cur: number[] = [];
  const go = (start: number): void => {
    out.push([...cur]);
    for (let i = start; i < nums.length; i++) {
      cur.push(nums[i]);
      go(i + 1);
      cur.pop();
    }
  };
  go(0);
  return out;
}
```

**Java:**
```java
static List<List<Integer>> subsets(int[] nums) {
    List<List<Integer>> out = new ArrayList<>();
    go(nums, 0, new ArrayDeque<>(), out);
    return out;
}

private static void go(int[] nums, int start, Deque<Integer> cur, List<List<Integer>> out) {
    out.add(new ArrayList<>(cur));
    for (int i = start; i < nums.length; i++) {
        cur.addLast(nums[i]);
        go(nums, i + 1, cur, out);
        cur.removeLast();
    }
}
```

**Key points:**
- Backtracking emits each subset exactly once via `start` index.
- Total output is `2^n` subsets, time is O(n * 2^n).
- Bit-mask enumeration is an elegant alternative for small `n`.

**Tags:** #algorithm

---

### 57. Permutations

**Difficulty:** Medium
**Topics:** backtracking, recursion
**Position:** SWE
**Years:** L60-L62

**Question:** Given a list of distinct integers, return all possible permutations.

**Approach:** Backtracking with a `used[]` array (or swap-in-place). O(n! * n) time. For permutations with duplicates (Permutations II), sort first and skip `nums[i] == nums[i-1] && !used[i-1]` to avoid duplicates.

**Python:**
```python
def permute(nums: list[int]) -> list[list[int]]:
    out: list[list[int]] = []
    used = [False] * len(nums)
    cur: list[int] = []
    def go() -> None:
        if len(cur) == len(nums):
            out.append(cur.copy())
            return
        for i, x in enumerate(nums):
            if used[i]:
                continue
            used[i] = True
            cur.append(x)
            go()
            cur.pop()
            used[i] = False
    go()
    return out
```

**TypeScript:**
```typescript
function permute(nums: number[]): number[][] {
  const out: number[][] = [];
  const used = new Array<boolean>(nums.length).fill(false);
  const cur: number[] = [];
  const go = (): void => {
    if (cur.length === nums.length) { out.push([...cur]); return; }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      used[i] = true; cur.push(nums[i]);
      go();
      cur.pop(); used[i] = false;
    }
  };
  go();
  return out;
}
```

**Java:**
```java
static List<List<Integer>> permute(int[] nums) {
    List<List<Integer>> out = new ArrayList<>();
    boolean[] used = new boolean[nums.length];
    go(nums, used, new ArrayDeque<>(), out);
    return out;
}

private static void go(int[] nums, boolean[] used, Deque<Integer> cur, List<List<Integer>> out) {
    if (cur.size() == nums.length) { out.add(new ArrayList<>(cur)); return; }
    for (int i = 0; i < nums.length; i++) {
        if (used[i]) continue;
        used[i] = true; cur.addLast(nums[i]);
        go(nums, used, cur, out);
        cur.removeLast(); used[i] = false;
    }
}
```

**Key points:**
- `used[]` enforces "each element appears once" per permutation.
- O(n!) outputs, each O(n) to build — O(n! * n) total.
- For duplicates, sort and skip `nums[i] == nums[i-1] && !used[i-1]`.

**Tags:** #algorithm

---

### 58. Combination Sum

**Difficulty:** Medium
**Topics:** backtracking, recursion
**Position:** SWE
**Years:** L60-L62

**Question:** Given an array of distinct positives and a target, return all unique combinations (each candidate may be used unlimited times) that sum to the target.

**Approach:** Sort, then DFS with an index parameter (start at i not i+1 to allow reuse). Prune when `remaining < 0` or candidate exceeds remaining. Backtrack on the chosen path. Time depends on solution count.

**Python:**
```python
def combination_sum(candidates: list[int], target: int) -> list[list[int]]:
    candidates.sort()
    out: list[list[int]] = []
    cur: list[int] = []
    def go(start: int, remaining: int) -> None:
        if remaining == 0:
            out.append(cur.copy())
            return
        for i in range(start, len(candidates)):
            c = candidates[i]
            if c > remaining:
                break
            cur.append(c)
            go(i, remaining - c)
            cur.pop()
    go(0, target)
    return out
```

**TypeScript:**
```typescript
function combinationSum(candidates: number[], target: number): number[][] {
  candidates.sort((a, b) => a - b);
  const out: number[][] = [];
  const cur: number[] = [];
  const go = (start: number, remaining: number): void => {
    if (remaining === 0) { out.push([...cur]); return; }
    for (let i = start; i < candidates.length; i++) {
      const c = candidates[i];
      if (c > remaining) break;
      cur.push(c);
      go(i, remaining - c);
      cur.pop();
    }
  };
  go(0, target);
  return out;
}
```

**Java:**
```java
static List<List<Integer>> combinationSum(int[] candidates, int target) {
    Arrays.sort(candidates);
    List<List<Integer>> out = new ArrayList<>();
    go(candidates, 0, target, new ArrayDeque<>(), out);
    return out;
}

private static void go(int[] cands, int start, int remaining, Deque<Integer> cur, List<List<Integer>> out) {
    if (remaining == 0) { out.add(new ArrayList<>(cur)); return; }
    for (int i = start; i < cands.length; i++) {
        if (cands[i] > remaining) break;
        cur.addLast(cands[i]);
        go(cands, i, remaining - cands[i], cur, out);
        cur.removeLast();
    }
}
```

**Key points:**
- Pass `i` (not `i+1`) to allow reuse of the same candidate.
- Sort enables early break on `c > remaining`.
- Output count drives the complexity; pruning is essential for performance.

**Tags:** #algorithm

---

### 59. Letter Combinations of a Phone Number

**Difficulty:** Medium
**Topics:** backtracking, string, recursion
**Position:** SWE
**Years:** L60-L62

**Question:** Given a string of digits 2-9, return all letter combinations the number could spell on a classic phone keypad. Return them in any order. Handle the empty input.

**Approach:** Backtracking over digit positions: at index `i`, try every letter mapped to `digits[i]`, recurse to `i+1`, then undo. There are up to 4^n combinations of length n, so time is O(4^n * n) to build the strings and O(n) recursion depth. The edge case Microsoft insists on: empty input returns an empty list, not `[""]`.

**Python:**
```python
def letter_combinations(digits: str) -> list[str]:
    if not digits:
        return []
    mapping = {
        "2": "abc", "3": "def", "4": "ghi", "5": "jkl",
        "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz",
    }
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
  if (digits.length === 0) return [];
  const mapping: Record<string, string> = {
    "2": "abc", "3": "def", "4": "ghi", "5": "jkl",
    "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz",
  };
  const res: string[] = [];
  const path: string[] = [];

  function backtrack(i: number): void {
    if (i === digits.length) {
      res.push(path.join(""));
      return;
    }
    for (const ch of mapping[digits[i]]) {
      path.push(ch);
      backtrack(i + 1);
      path.pop();
    }
  }

  backtrack(0);
  return res;
}
```

**Java:**
```java
static List<String> letterCombinations(String digits) {
    List<String> res = new ArrayList<>();
    if (digits.isEmpty()) return res;
    String[] mapping = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};
    backtrack(digits, 0, mapping, new StringBuilder(), res);
    return res;
}

static void backtrack(String digits, int i, String[] mapping, StringBuilder path, List<String> res) {
    if (i == digits.length()) {
        res.add(path.toString());
        return;
    }
    String letters = mapping[digits.charAt(i) - '0'];
    for (int k = 0; k < letters.length(); k++) {
        path.append(letters.charAt(k));
        backtrack(digits, i + 1, mapping, path, res);
        path.deleteCharAt(path.length() - 1);
    }
}
```

**Key points:**
- One recursion level per digit; the loop fans out over that digit's letters.
- Append then pop keeps `path` a shared mutable buffer (classic backtracking).
- Up to 4^n results, so O(4^n * n) time; recursion depth is O(n).

**Follow-ups:**
- Do it iteratively with a growing list (BFS-style product).
- Handle 0 and 1 (no letters) — either skip or reject.
- Stream results via a generator instead of materializing all of them.

**Common Pitfalls:**
- Returning `[""]` for empty input instead of `[]`.
- Forgetting to pop, which leaks letters across branches.

**Tags:** #algorithm

---

### 60. Restore IP Addresses

**Difficulty:** Medium
**Topics:** backtracking, string, recursion
**Position:** SWE
**Years:** L62-L63

**Question:** Given a string of digits, return all valid IPv4 addresses that can be formed by inserting three dots. Each of the four octets must be 0-255 with no leading zeros (except "0" itself). Discuss the validity rules and edge cases.

**Approach:** Backtracking that tries segment lengths 1-3 at each position, requiring exactly four segments that consume the whole string. Each candidate segment is validated for range (<=255) and leading zeros. Length is bounded (<=12 useful digits), so the search is effectively constant-time; the discussion Microsoft wants is precise validity: reject "01" and "256", accept single "0".

**Python:**
```python
def restore_ip_addresses(s: str) -> list[str]:
    res: list[str] = []
    n = len(s)

    def valid(seg: str) -> bool:
        if len(seg) > 1 and seg[0] == "0":
            return False
        return len(seg) <= 3 and int(seg) <= 255

    def backtrack(start: int, parts: list[str]) -> None:
        if len(parts) == 4:
            if start == n:
                res.append(".".join(parts))
            return
        for length in range(1, 4):
            if start + length > n:
                break
            seg = s[start:start + length]
            if valid(seg):
                parts.append(seg)
                backtrack(start + length, parts)
                parts.pop()

    backtrack(0, [])
    return res
```

**TypeScript:**
```typescript
function restoreIpAddresses(s: string): string[] {
  const res: string[] = [];
  const n = s.length;

  function valid(seg: string): boolean {
    if (seg.length > 1 && seg[0] === "0") return false;
    return seg.length <= 3 && parseInt(seg, 10) <= 255;
  }

  function backtrack(start: number, parts: string[]): void {
    if (parts.length === 4) {
      if (start === n) res.push(parts.join("."));
      return;
    }
    for (let length = 1; length <= 3; length++) {
      if (start + length > n) break;
      const seg = s.slice(start, start + length);
      if (valid(seg)) {
        parts.push(seg);
        backtrack(start + length, parts);
        parts.pop();
      }
    }
  }

  backtrack(0, []);
  return res;
}
```

**Java:**
```java
static List<String> restoreIpAddresses(String s) {
    List<String> res = new ArrayList<>();
    backtrack(s, 0, new ArrayList<>(), res);
    return res;
}

static void backtrack(String s, int start, List<String> parts, List<String> res) {
    if (parts.size() == 4) {
        if (start == s.length()) res.add(String.join(".", parts));
        return;
    }
    for (int length = 1; length <= 3; length++) {
        if (start + length > s.length()) break;
        String seg = s.substring(start, start + length);
        if (valid(seg)) {
            parts.add(seg);
            backtrack(s, start + length, parts, res);
            parts.remove(parts.size() - 1);
        }
    }
}

static boolean valid(String seg) {
    if (seg.length() > 1 && seg.charAt(0) == '0') return false;
    return seg.length() <= 3 && Integer.parseInt(seg) <= 255;
}
```

**Key points:**
- Two conjoined constraints: exactly 4 parts AND the whole string consumed.
- Validity = no leading zero (unless the octet is exactly "0") and value <= 255.
- Segment length is capped at 3, so branching is bounded and pruning is natural.

**Follow-ups:**
- Extend to IPv6 (8 groups of hex, `::` compression).
- Just count valid restorations instead of listing them.
- Reject inputs shorter than 4 or longer than 12 digits up front.

**Common Pitfalls:**
- Accepting leading-zero octets like "01" or "00".
- Stopping at 4 parts without checking the string was fully consumed.

**Tags:** #algorithm

---

## Graph

### 61. Number of Islands

**Difficulty:** Medium
**Topics:** graph, dfs, bfs, matrix, union-find
**Position:** SWE
**Years:** L60-L62

**Question:** Given a 2D grid of '1' (land) and '0' (water), count the number of islands (land connected 4-directionally). Discuss the trade-offs between DFS, BFS, and union-find, and how you would handle a very large grid.

**Approach:** Scan every cell; when you hit unvisited land, increment the counter and flood-fill the whole island by sinking connected '1's to '0'. This visits each cell once, so time is O(m*n) and space is O(m*n) for the recursion stack in the worst case. The edge case Microsoft probes: an empty or single-row/column grid, and stack overflow on a huge all-land grid (switch to an explicit-stack or BFS flood).

**Python:**
```python
def num_islands(grid: list[list[str]]) -> int:
    if not grid or not grid[0]:
        return 0
    rows, cols = len(grid), len(grid[0])
    def sink(r: int, c: int) -> None:
        if r < 0 or r >= rows or c < 0 or c >= cols or grid[r][c] != "1":
            return
        grid[r][c] = "0"
        sink(r + 1, c)
        sink(r - 1, c)
        sink(r, c + 1)
        sink(r, c - 1)
    count = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1":
                count += 1
                sink(r, c)
    return count
```

**TypeScript:**
```typescript
function numIslands(grid: string[][]): number {
  if (grid.length === 0 || grid[0].length === 0) return 0;
  const rows = grid.length, cols = grid[0].length;
  const sink = (r: number, c: number): void => {
    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] !== "1") return;
    grid[r][c] = "0";
    sink(r + 1, c);
    sink(r - 1, c);
    sink(r, c + 1);
    sink(r, c - 1);
  };
  let count = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (grid[r][c] === "1") { count++; sink(r, c); }
  return count;
}
```

**Java:**
```java
static int numIslands(char[][] grid) {
    if (grid.length == 0 || grid[0].length == 0) return 0;
    int count = 0;
    for (int r = 0; r < grid.length; r++)
        for (int c = 0; c < grid[0].length; c++)
            if (grid[r][c] == '1') { count++; sink(grid, r, c); }
    return count;
}

private static void sink(char[][] grid, int r, int c) {
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length || grid[r][c] != '1') return;
    grid[r][c] = '0';
    sink(grid, r + 1, c);
    sink(grid, r - 1, c);
    sink(grid, r, c + 1);
    sink(grid, r, c - 1);
}
```

**Key points:**
- Flood-fill marks land as visited in place, so no separate visited set is needed.
- Each cell is touched once: O(m*n) time, O(m*n) worst-case recursion depth.
- Guard the empty-grid case before indexing `grid[0]`.

**Follow-ups:**
- Convert the recursive DFS to BFS or an explicit stack to avoid stack overflow on large inputs.
- Solve with union-find and compare complexity and code clarity.
- Count islands with diagonal (8-directional) connectivity, or count distinct island shapes.

**Common Pitfalls:**
- Mutating the grid but forgetting it destroys the input; clone it if the caller needs it preserved.
- Off-by-one bounds checks when neighbors fall outside the grid.

**Tags:** #algorithm

---

### 62. Course Schedule (topological sort)

**Difficulty:** Medium
**Topics:** graph, topological-sort, bfs, cycle-detection
**Position:** SWE
**Years:** L60-L62

**Question:** Given `numCourses` and a list of prerequisite pairs `[a, b]` meaning you must take `b` before `a`, return whether you can finish all courses. Be ready to discuss how you detect a cycle and the edge cases.

**Approach:** Model courses as a directed graph and run Kahn's algorithm: compute in-degrees, seed a queue with every zero-in-degree course, and repeatedly pop a course and decrement its successors' in-degrees, enqueuing any that reach zero. If the number of processed courses equals `numCourses`, no cycle exists and all courses are finishable; otherwise a cycle remains. Time is O(V+E), space O(V+E). The discussion point: an empty prerequisite list (trivially true) and how leftover positive in-degrees pinpoint the cycle.

**Python:**
```python
from collections import deque

def can_finish(num_courses: int, prerequisites: list[list[int]]) -> bool:
    graph: list[list[int]] = [[] for _ in range(num_courses)]
    indegree = [0] * num_courses
    for course, prereq in prerequisites:
        graph[prereq].append(course)
        indegree[course] += 1
    queue = deque(i for i in range(num_courses) if indegree[i] == 0)
    visited = 0
    while queue:
        node = queue.popleft()
        visited += 1
        for nxt in graph[node]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.append(nxt)
    return visited == num_courses
```

**TypeScript:**
```typescript
function canFinish(numCourses: number, prerequisites: number[][]): boolean {
  const graph: number[][] = Array.from({ length: numCourses }, () => []);
  const indegree = new Array(numCourses).fill(0);
  for (const [course, prereq] of prerequisites) {
    graph[prereq].push(course);
    indegree[course]++;
  }
  const queue: number[] = [];
  for (let i = 0; i < numCourses; i++) if (indegree[i] === 0) queue.push(i);
  let head = 0, visited = 0;
  while (head < queue.length) {
    const node = queue[head++];
    visited++;
    for (const nxt of graph[node]) {
      if (--indegree[nxt] === 0) queue.push(nxt);
    }
  }
  return visited === numCourses;
}
```

**Java:**
```java
static boolean canFinish(int numCourses, int[][] prerequisites) {
    List<List<Integer>> graph = new ArrayList<>();
    for (int i = 0; i < numCourses; i++) graph.add(new ArrayList<>());
    int[] indegree = new int[numCourses];
    for (int[] p : prerequisites) {
        graph.get(p[1]).add(p[0]);
        indegree[p[0]]++;
    }
    Deque<Integer> queue = new ArrayDeque<>();
    for (int i = 0; i < numCourses; i++) if (indegree[i] == 0) queue.offer(i);
    int visited = 0;
    while (!queue.isEmpty()) {
        int node = queue.poll();
        visited++;
        for (int nxt : graph.get(node)) {
            if (--indegree[nxt] == 0) queue.offer(nxt);
        }
    }
    return visited == numCourses;
}
```

**Key points:**
- Kahn's BFS both topo-sorts and detects cycles: fewer processed nodes than total means a cycle.
- Edge orientation matters: `[a, b]` adds edge b to a, and a's in-degree grows.
- O(V+E) time and space; no recursion, so no stack-overflow risk.

**Follow-ups:**
- Return an actual valid ordering (Course Schedule II) by collecting nodes as they are dequeued.
- Solve the same problem with DFS and three-color cycle detection.
- Report which courses form the cycle.

**Common Pitfalls:**
- Reversing the edge direction and computing the wrong in-degrees.
- Forgetting that courses with no prerequisites must seed the queue.

**Tags:** #algorithm

---

### 63. Clone Graph

**Difficulty:** Medium
**Topics:** graph, dfs, bfs, hash-map
**Position:** SWE
**Years:** L60-L62

**Question:** Given a reference to a node in a connected undirected graph, return a deep copy (clone) of the graph. Discuss how you avoid infinite loops on cycles and how you handle the empty graph.

**Approach:** DFS from the given node while keeping a hash map from each original node to its clone. When you first see a node, create its clone, record it in the map before recursing, then recurse on each neighbor and attach the returned clones. Recording the clone before recursion is what breaks cycles. Time and space are O(V+E). The edge cases Microsoft probes: a null input node and a single node with a self-loop.

**Python:**
```python
class Node:
    def __init__(self, val: int = 0, neighbors: list["Node"] | None = None):
        self.val = val
        self.neighbors = neighbors if neighbors is not None else []

def clone_graph(node: "Node | None") -> "Node | None":
    if node is None:
        return None
    clones: dict[Node, Node] = {}
    def dfs(cur: Node) -> Node:
        if cur in clones:
            return clones[cur]
        copy = Node(cur.val)
        clones[cur] = copy
        for nb in cur.neighbors:
            copy.neighbors.append(dfs(nb))
        return copy
    return dfs(node)
```

**TypeScript:**
```typescript
class GraphNode {
  val: number;
  neighbors: GraphNode[];
  constructor(val: number = 0, neighbors: GraphNode[] = []) {
    this.val = val;
    this.neighbors = neighbors;
  }
}

function cloneGraph(node: GraphNode | null): GraphNode | null {
  if (node === null) return null;
  const clones = new Map<GraphNode, GraphNode>();
  const dfs = (cur: GraphNode): GraphNode => {
    const existing = clones.get(cur);
    if (existing) return existing;
    const copy = new GraphNode(cur.val);
    clones.set(cur, copy);
    for (const nb of cur.neighbors) copy.neighbors.push(dfs(nb));
    return copy;
  };
  return dfs(node);
}
```

**Java:**
```java
static class Node {
    int val;
    List<Node> neighbors;
    Node(int val) { this.val = val; this.neighbors = new ArrayList<>(); }
}

static Node cloneGraph(Node node) {
    if (node == null) return null;
    Map<Node, Node> clones = new HashMap<>();
    return dfs(node, clones);
}

private static Node dfs(Node cur, Map<Node, Node> clones) {
    Node existing = clones.get(cur);
    if (existing != null) return existing;
    Node copy = new Node(cur.val);
    clones.put(cur, copy);
    for (Node nb : cur.neighbors) copy.neighbors.add(dfs(nb, clones));
    return copy;
}
```

**Key points:**
- The original-to-clone map is both the visited set and the way to wire neighbors correctly.
- Insert the clone into the map before recursing, or cycles cause infinite recursion.
- O(V+E) time and space; every node and edge is processed once.

**Follow-ups:**
- Rewrite the traversal iteratively with BFS and a queue.
- Clone a directed graph, or one with node-associated metadata/weights.
- Handle a disconnected graph given a list of all nodes.

**Common Pitfalls:**
- Creating the clone but only mapping it after recursion, reintroducing the cycle bug.
- Returning the original neighbor objects instead of their clones.

**Tags:** #algorithm

---

### 64. Word Ladder

**Difficulty:** Hard
**Topics:** graph, bfs, string, shortest-path
**Position:** Senior SWE
**Years:** L62-L63

**Question:** Given `beginWord`, `endWord`, and a `wordList`, return the length of the shortest transformation sequence from `beginWord` to `endWord`, changing one letter at a time where each intermediate word must be in the list; return 0 if impossible. Discuss the branching factor and how to speed the search up.

**Approach:** Treat each word as a node with edges to words differing by exactly one letter, then BFS from `beginWord` for the shortest path. Instead of comparing all pairs, generate each word's neighbors by trying all 26 letters at every position and checking membership in a set, removing visited words to prevent revisits. With N words of length L, time is O(N*L*26) and space O(N*L). The edge case Microsoft probes: `endWord` absent from the list (return 0), and using bidirectional BFS to cut the exponential frontier.

**Python:**
```python
from collections import deque

def ladder_length(begin_word: str, end_word: str, word_list: list[str]) -> int:
    words = set(word_list)
    if end_word not in words:
        return 0
    queue = deque([(begin_word, 1)])
    words.discard(begin_word)
    while queue:
        word, steps = queue.popleft()
        if word == end_word:
            return steps
        for i in range(len(word)):
            for c in "abcdefghijklmnopqrstuvwxyz":
                candidate = word[:i] + c + word[i + 1:]
                if candidate in words:
                    words.discard(candidate)
                    queue.append((candidate, steps + 1))
    return 0
```

**TypeScript:**
```typescript
function ladderLength(beginWord: string, endWord: string, wordList: string[]): number {
  const words = new Set(wordList);
  if (!words.has(endWord)) return 0;
  const queue: [string, number][] = [[beginWord, 1]];
  words.delete(beginWord);
  let head = 0;
  while (head < queue.length) {
    const [word, steps] = queue[head++];
    if (word === endWord) return steps;
    for (let i = 0; i < word.length; i++) {
      for (let c = 97; c < 123; c++) {
        const candidate = word.slice(0, i) + String.fromCharCode(c) + word.slice(i + 1);
        if (words.has(candidate)) {
          words.delete(candidate);
          queue.push([candidate, steps + 1]);
        }
      }
    }
  }
  return 0;
}
```

**Java:**
```java
static int ladderLength(String beginWord, String endWord, List<String> wordList) {
    Set<String> words = new HashSet<>(wordList);
    if (!words.contains(endWord)) return 0;
    Deque<String> queue = new ArrayDeque<>();
    queue.offer(beginWord);
    words.remove(beginWord);
    int steps = 1;
    while (!queue.isEmpty()) {
        int size = queue.size();
        for (int s = 0; s < size; s++) {
            String word = queue.poll();
            if (word.equals(endWord)) return steps;
            char[] chars = word.toCharArray();
            for (int i = 0; i < chars.length; i++) {
                char original = chars[i];
                for (char c = 'a'; c <= 'z'; c++) {
                    chars[i] = c;
                    String candidate = new String(chars);
                    if (words.contains(candidate)) {
                        words.remove(candidate);
                        queue.offer(candidate);
                    }
                }
                chars[i] = original;
            }
        }
        steps++;
    }
    return 0;
}
```

**Key points:**
- BFS guarantees the first time you reach `endWord` is the shortest sequence.
- Generating neighbors by 26-letter substitution beats O(N^2) pairwise comparison for long lists.
- Remove words from the set as you enqueue them to avoid revisiting and cycles.

**Follow-ups:**
- Bidirectional BFS from both ends roughly halves the explored depth.
- Word Ladder II: return all shortest transformation sequences, not just the length.
- Precompute wildcard patterns (e.g. `h*t`) as an adjacency index to speed neighbor lookup.

**Common Pitfalls:**
- Returning 0 or looping forever because `endWord` was never in the list.
- Off-by-one in the step count (the sequence length includes both endpoints).

**Tags:** #algorithm

---

## Two Pointers / Sliding Window

### 65. 3Sum

**Difficulty:** Medium
**Topics:** array, two-pointers, sorting
**Position:** SWE
**Years:** L60-L62

**Question:** Given an integer array `nums`, return all unique triplets `[a, b, c]` such that `a + b + c == 0`. Discuss how you avoid duplicate triplets and the edge cases.

**Approach:** Sort the array, then fix each index `i` and run a two-pointer scan (`lo`, `hi`) over the remainder looking for the complement `-nums[i]`. Skip duplicate anchors and duplicate pair-endpoints to keep triplets unique. O(n^2) time, O(1) extra space (ignoring the output and sort). Microsoft probes the duplicate-skipping logic and the early break once `nums[i] > 0`.

**Python:**
```python
def three_sum(nums: list[int]) -> list[list[int]]:
    nums.sort()
    res: list[list[int]] = []
    n = len(nums)
    for i in range(n - 2):
        if i > 0 and nums[i] == nums[i - 1]:
            continue
        if nums[i] > 0:
            break
        lo, hi = i + 1, n - 1
        while lo < hi:
            s = nums[i] + nums[lo] + nums[hi]
            if s < 0:
                lo += 1
            elif s > 0:
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
    if (i > 0 && nums[i] === nums[i - 1]) continue;
    if (nums[i] > 0) break;
    let lo = i + 1, hi = n - 1;
    while (lo < hi) {
      const s = nums[i] + nums[lo] + nums[hi];
      if (s < 0) lo++;
      else if (s > 0) hi--;
      else {
        res.push([nums[i], nums[lo], nums[hi]]);
        lo++; hi--;
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
static List<List<Integer>> threeSum(int[] nums) {
    Arrays.sort(nums);
    List<List<Integer>> res = new ArrayList<>();
    int n = nums.length;
    for (int i = 0; i < n - 2; i++) {
        if (i > 0 && nums[i] == nums[i - 1]) continue;
        if (nums[i] > 0) break;
        int lo = i + 1, hi = n - 1;
        while (lo < hi) {
            int s = nums[i] + nums[lo] + nums[hi];
            if (s < 0) lo++;
            else if (s > 0) hi--;
            else {
                res.add(Arrays.asList(nums[i], nums[lo], nums[hi]));
                lo++; hi--;
                while (lo < hi && nums[lo] == nums[lo - 1]) lo++;
                while (lo < hi && nums[hi] == nums[hi + 1]) hi--;
            }
        }
    }
    return res;
}
```

**Key points:**
- Sorting is what enables the two-pointer move and makes duplicate-skipping trivial.
- Skip duplicate anchors (`nums[i] == nums[i-1]`) and duplicate endpoints after a hit.
- O(n^2) time dominated by the inner scan; sort is O(n log n).
- Break early once `nums[i] > 0` since no positive anchor can sum to zero with larger values.

**Follow-ups:**
- Generalize to kSum via recursion down to the two-pointer base case.
- Return the count of triplets instead of the triplets themselves.
- 3Sum Closest — track the sum with minimum absolute distance to target.

**Common Pitfalls:**
- Forgetting to advance both pointers after recording a hit — infinite loop.
- De-duplicating with a set of tuples instead of pointer skips — works but wastes memory.

**Tags:** #algorithm

---

### 66. Container With Most Water

**Difficulty:** Medium
**Topics:** array, two-pointers, greedy
**Position:** SWE
**Years:** L60-L62

**Question:** Given `height[]` where each element is a vertical line, find two lines that together with the x-axis hold the most water. Return the maximum area and justify why the greedy pointer move is correct.

**Approach:** Start with the widest container (`lo = 0`, `hi = n-1`) and shrink inward. Area is `(hi - lo) * min(height[lo], height[hi])`; always move the pointer at the shorter line, since moving the taller one can never increase the height and only loses width. O(n) time, O(1) space. Microsoft wants the correctness argument for discarding the shorter line.

**Python:**
```python
def max_area(height: list[int]) -> int:
    lo, hi = 0, len(height) - 1
    best = 0
    while lo < hi:
        best = max(best, (hi - lo) * min(height[lo], height[hi]))
        if height[lo] < height[hi]:
            lo += 1
        else:
            hi -= 1
    return best
```

**TypeScript:**
```typescript
function maxArea(height: number[]): number {
  let lo = 0, hi = height.length - 1, best = 0;
  while (lo < hi) {
    best = Math.max(best, (hi - lo) * Math.min(height[lo], height[hi]));
    if (height[lo] < height[hi]) lo++;
    else hi--;
  }
  return best;
}
```

**Java:**
```java
static int maxArea(int[] height) {
    int lo = 0, hi = height.length - 1, best = 0;
    while (lo < hi) {
        best = Math.max(best, (hi - lo) * Math.min(height[lo], height[hi]));
        if (height[lo] < height[hi]) lo++;
        else hi--;
    }
    return best;
}
```

**Key points:**
- Area is bounded by the shorter line, so moving it is the only move that can help.
- One linear pass beats the O(n^2) brute force over all pairs.
- O(n) time, O(1) space — no extra data structures.
- Ties (equal heights) can move either pointer; the answer is unaffected.

**Follow-ups:**
- Trapping Rain Water — related but sums water over every bar, not a single pair.
- Return the actual pair of indices, not just the area.
- Prove the greedy never skips the optimal pair.

**Common Pitfalls:**
- Multiplying by the taller line instead of the shorter one.
- Off-by-one on width — it is `hi - lo`, not `hi - lo + 1`.

**Tags:** #algorithm

---

### 67. Longest Substring Without Repeating Characters

**Difficulty:** Medium
**Topics:** string, sliding-window, hashmap
**Position:** SWE
**Years:** L60-L62

**Question:** Given a string `s`, return the length of the longest substring with no repeating characters. Discuss the sliding-window invariant and the empty-string edge case.

**Approach:** Slide a window `[start, i]` and store each character's last-seen index in a map. When the current char was seen at or after `start`, jump `start` to one past that index — never move it backward. Track the best window length. O(n) time, O(min(n, alphabet)) space. Microsoft probes why `start` uses `max`/`>= start` to avoid reopening stale duplicates.

**Python:**
```python
def length_of_longest_substring(s: str) -> int:
    last: dict[str, int] = {}
    start = 0
    best = 0
    for i, ch in enumerate(s):
        if ch in last and last[ch] >= start:
            start = last[ch] + 1
        last[ch] = i
        best = max(best, i - start + 1)
    return best
```

**TypeScript:**
```typescript
function lengthOfLongestSubstring(s: string): number {
  const last = new Map<string, number>();
  let start = 0, best = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const prev = last.get(ch);
    if (prev !== undefined && prev >= start) start = prev + 1;
    last.set(ch, i);
    best = Math.max(best, i - start + 1);
  }
  return best;
}
```

**Java:**
```java
static int lengthOfLongestSubstring(String s) {
    Map<Character, Integer> last = new HashMap<>();
    int start = 0, best = 0;
    for (int i = 0; i < s.length(); i++) {
        char ch = s.charAt(i);
        Integer prev = last.get(ch);
        if (prev != null && prev >= start) start = prev + 1;
        last.put(ch, i);
        best = Math.max(best, i - start + 1);
    }
    return best;
}
```

**Key points:**
- Store last-seen index (not just presence) so `start` can jump in O(1).
- The `prev >= start` guard prevents moving `start` backward on duplicates outside the window.
- O(n) time — each index is visited once; window never rewinds.
- Empty string returns 0 naturally since the loop never runs.

**Follow-ups:**
- Return the substring itself, not just its length.
- Longest substring with at most k distinct characters (count-map variant).
- Constrain the charset to ASCII and swap the map for a fixed-size array.

**Common Pitfalls:**
- Dropping the `>= start` check and letting `start` move backward.
- Resetting the whole window on a duplicate instead of a targeted jump — O(n^2).

**Tags:** #algorithm

---

## Matrix

### 68. Spiral Matrix

**Difficulty:** Medium
**Topics:** matrix, simulation
**Position:** SWE
**Years:** L60-L62

**Question:** Given an m x n matrix, return all elements in spiral order.

**Approach:** Track 4 boundaries `top, bottom, left, right`. Loop: traverse top row L→R, then right col T→B, then check if `top <= bottom` before bottom row R→L, then `left <= right` before left col B→T. Shrink boundaries each loop. Edge cases: single row, single column. Pure simulation — Microsoft loves clean off-by-one handling.

**Python:**
```python
def spiral_order(matrix: list[list[int]]) -> list[int]:
    if not matrix:
        return []
    top, bot, left, right = 0, len(matrix) - 1, 0, len(matrix[0]) - 1
    out: list[int] = []
    while top <= bot and left <= right:
        for c in range(left, right + 1): out.append(matrix[top][c])
        for r in range(top + 1, bot + 1): out.append(matrix[r][right])
        if top < bot and left < right:
            for c in range(right - 1, left - 1, -1): out.append(matrix[bot][c])
            for r in range(bot - 1, top, -1): out.append(matrix[r][left])
        top += 1; bot -= 1; left += 1; right -= 1
    return out
```

**TypeScript:**
```typescript
function spiralOrder(matrix: number[][]): number[] {
  if (matrix.length === 0) return [];
  let top = 0, bot = matrix.length - 1, left = 0, right = matrix[0].length - 1;
  const out: number[] = [];
  while (top <= bot && left <= right) {
    for (let c = left; c <= right; c++) out.push(matrix[top][c]);
    for (let r = top + 1; r <= bot; r++) out.push(matrix[r][right]);
    if (top < bot && left < right) {
      for (let c = right - 1; c >= left; c--) out.push(matrix[bot][c]);
      for (let r = bot - 1; r > top; r--) out.push(matrix[r][left]);
    }
    top++; bot--; left++; right--;
  }
  return out;
}
```

**Java:**
```java
static List<Integer> spiralOrder(int[][] matrix) {
    List<Integer> out = new ArrayList<>();
    if (matrix.length == 0) return out;
    int top = 0, bot = matrix.length - 1, left = 0, right = matrix[0].length - 1;
    while (top <= bot && left <= right) {
        for (int c = left; c <= right; c++) out.add(matrix[top][c]);
        for (int r = top + 1; r <= bot; r++) out.add(matrix[r][right]);
        if (top < bot && left < right) {
            for (int c = right - 1; c >= left; c--) out.add(matrix[bot][c]);
            for (int r = bot - 1; r > top; r--) out.add(matrix[r][left]);
        }
        top++; bot--; left++; right--;
    }
    return out;
}
```

**Key points:**
- Guard the bottom row and left column to avoid duplicates on single-row/col layers.
- Shrink all four boundaries by 1 after each ring.
- O(m*n) time, O(1) extra space besides output.

**Follow-ups:**
- Generate the spiral matrix from 1..n^2 (Spiral Matrix II).
- Spiral with arbitrary starting cell or direction.
- Diagonal traversal order instead of spiral.
- Spiral on a non-rectangular grid (jagged 2D array).

**Common Pitfalls:**
- Skipping the `top < bot && left < right` guards — duplicates on the last ring.
- Incrementing boundaries before the row/col scans — misses cells.

**Tags:** #algorithm

---

### 69. Set Matrix Zeroes

**Difficulty:** Medium
**Topics:** matrix, in-place
**Position:** SWE
**Years:** L60-L62

**Question:** Given an m x n matrix, if an element is 0, set its entire row and column to 0. Do it in-place.

**Approach:** Use the first row and first column as marker arrays. Track separately whether row 0 and col 0 themselves need zeroing. Two passes: mark, then apply. Finally zero row 0 / col 0 if flagged. O(mn) time, O(1) extra space.

**Python:**
```python
def set_zeroes(matrix: list[list[int]]) -> None:
    m, n = len(matrix), len(matrix[0])
    first_row = any(matrix[0][c] == 0 for c in range(n))
    first_col = any(matrix[r][0] == 0 for r in range(m))
    for r in range(1, m):
        for c in range(1, n):
            if matrix[r][c] == 0:
                matrix[r][0] = matrix[0][c] = 0
    for r in range(1, m):
        for c in range(1, n):
            if matrix[r][0] == 0 or matrix[0][c] == 0:
                matrix[r][c] = 0
    if first_row:
        for c in range(n): matrix[0][c] = 0
    if first_col:
        for r in range(m): matrix[r][0] = 0
```

**TypeScript:**
```typescript
function setZeroes(matrix: number[][]): void {
  const m = matrix.length, n = matrix[0].length;
  let firstRow = false, firstCol = false;
  for (let c = 0; c < n; c++) if (matrix[0][c] === 0) firstRow = true;
  for (let r = 0; r < m; r++) if (matrix[r][0] === 0) firstCol = true;
  for (let r = 1; r < m; r++) for (let c = 1; c < n; c++)
    if (matrix[r][c] === 0) { matrix[r][0] = 0; matrix[0][c] = 0; }
  for (let r = 1; r < m; r++) for (let c = 1; c < n; c++)
    if (matrix[r][0] === 0 || matrix[0][c] === 0) matrix[r][c] = 0;
  if (firstRow) for (let c = 0; c < n; c++) matrix[0][c] = 0;
  if (firstCol) for (let r = 0; r < m; r++) matrix[r][0] = 0;
}
```

**Java:**
```java
static void setZeroes(int[][] matrix) {
    int m = matrix.length, n = matrix[0].length;
    boolean firstRow = false, firstCol = false;
    for (int c = 0; c < n; c++) if (matrix[0][c] == 0) firstRow = true;
    for (int r = 0; r < m; r++) if (matrix[r][0] == 0) firstCol = true;
    for (int r = 1; r < m; r++)
        for (int c = 1; c < n; c++)
            if (matrix[r][c] == 0) { matrix[r][0] = 0; matrix[0][c] = 0; }
    for (int r = 1; r < m; r++)
        for (int c = 1; c < n; c++)
            if (matrix[r][0] == 0 || matrix[0][c] == 0) matrix[r][c] = 0;
    if (firstRow) for (int c = 0; c < n; c++) matrix[0][c] = 0;
    if (firstCol) for (int r = 0; r < m; r++) matrix[r][0] = 0;
}
```

**Key points:**
- First row/col double as marker arrays for O(1) extra space.
- Two booleans preserve original zero info for row 0 and col 0.
- Apply zeros to inner cells before clearing the marker row/column.

**Tags:** #algorithm

---

### 70. Rotate Image

**Difficulty:** Medium
**Topics:** matrix, in-place
**Position:** SWE
**Years:** L60-L62

**Question:** Rotate an n x n 2D matrix 90 degrees clockwise in-place.

**Approach:** Transpose (swap `M[i][j]` with `M[j][i]` for `i<j`), then reverse each row. O(n^2) time, O(1) space. Discuss: counter-clockwise = transpose + reverse columns; 180 = reverse rows + reverse columns.

**Python:**
```python
def rotate(matrix: list[list[int]]) -> None:
    n = len(matrix)
    for i in range(n):
        for j in range(i + 1, n):
            matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
    for row in matrix:
        row.reverse()
```

**TypeScript:**
```typescript
function rotate(matrix: number[][]): void {
  const n = matrix.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];
    }
  }
  for (const row of matrix) row.reverse();
}
```

**Java:**
```java
static void rotate(int[][] matrix) {
    int n = matrix.length;
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++) {
            int t = matrix[i][j];
            matrix[i][j] = matrix[j][i];
            matrix[j][i] = t;
        }
    for (int[] row : matrix)
        for (int i = 0, j = n - 1; i < j; i++, j--) {
            int t = row[i]; row[i] = row[j]; row[j] = t;
        }
}
```

**Key points:**
- Transpose + row reverse equals 90 degrees clockwise.
- Inner loop starts at `i+1` to avoid double-swapping.
- O(n^2) time, O(1) extra space; in-place satisfies the problem constraint.

**Tags:** #algorithm

---

### 71. Design Tic-Tac-Toe

**Difficulty:** Medium
**Topics:** design, matrix
**Position:** SWE
**Years:** L62-L63

**Question:** Design a Tic-Tac-Toe game on an n x n board that returns the winner (or 0 for no winner) after each move in O(1).

**Approach:** Keep `rows[n]`, `cols[n]`, `diag`, `antiDiag` counters; for player 1 add +1, for player 2 add -1. After a move at `(r, c)`, check if any of `rows[r], cols[c], diag` (if r==c), `antiDiag` (if r+c==n-1) hits +n or -n. O(1) per move, O(n) memory.

**Python:**
```python
class TicTacToe:
    def __init__(self, n: int) -> None:
        self.n = n
        self.rows = [0] * n
        self.cols = [0] * n
        self.diag = 0
        self.anti = 0

    def move(self, row: int, col: int, player: int) -> int:
        delta = 1 if player == 1 else -1
        self.rows[row] += delta
        self.cols[col] += delta
        if row == col:
            self.diag += delta
        if row + col == self.n - 1:
            self.anti += delta
        if abs(self.rows[row]) == self.n or abs(self.cols[col]) == self.n \
                or abs(self.diag) == self.n or abs(self.anti) == self.n:
            return player
        return 0
```

**TypeScript:**
```typescript
class TicTacToe {
  private n: number;
  private rows: number[];
  private cols: number[];
  private diag = 0;
  private anti = 0;
  constructor(n: number) { this.n = n; this.rows = new Array(n).fill(0); this.cols = new Array(n).fill(0); }
  move(row: number, col: number, player: number): number {
    const d = player === 1 ? 1 : -1;
    this.rows[row] += d;
    this.cols[col] += d;
    if (row === col) this.diag += d;
    if (row + col === this.n - 1) this.anti += d;
    if (Math.abs(this.rows[row]) === this.n || Math.abs(this.cols[col]) === this.n
        || Math.abs(this.diag) === this.n || Math.abs(this.anti) === this.n) return player;
    return 0;
  }
}
```

**Java:**
```java
class TicTacToe {
    private final int n;
    private final int[] rows, cols;
    private int diag, anti;

    public TicTacToe(int n) {
        this.n = n;
        this.rows = new int[n];
        this.cols = new int[n];
    }

    public int move(int row, int col, int player) {
        int d = player == 1 ? 1 : -1;
        rows[row] += d;
        cols[col] += d;
        if (row == col) diag += d;
        if (row + col == n - 1) anti += d;
        if (Math.abs(rows[row]) == n || Math.abs(cols[col]) == n
                || Math.abs(diag) == n || Math.abs(anti) == n) return player;
        return 0;
    }
}
```

**Key points:**
- Signed counters (+1/-1) let one variable per line cover both players.
- Only the row/col/diag touched by the move can change; check those four.
- O(1) per move, O(n) memory regardless of game length.

**Tags:** #algorithm

---

### 72. Search a 2D Matrix II

**Difficulty:** Medium
**Topics:** matrix, binary-search, two-pointer
**Position:** SWE
**Years:** L60-L62

**Question:** Given an m x n matrix where each row is sorted left-to-right and each column is sorted top-to-bottom, determine whether a target value exists. Discuss the trade-off versus row-by-row binary search.

**Approach:** Start at the top-right corner. If the value equals the target return true; if it is larger the whole column below is too large so move left; if it is smaller the whole row to the left is too small so move down. Each step eliminates a row or column, giving O(m + n) time and O(1) space. Edge case Microsoft probes: empty matrix or empty first row must be guarded before indexing.

**Python:**
```python
def search_matrix(matrix: list[list[int]], target: int) -> bool:
    if not matrix or not matrix[0]:
        return False
    r, c = 0, len(matrix[0]) - 1
    while r < len(matrix) and c >= 0:
        if matrix[r][c] == target:
            return True
        if matrix[r][c] > target:
            c -= 1
        else:
            r += 1
    return False
```

**TypeScript:**
```typescript
function searchMatrix(matrix: number[][], target: number): boolean {
  if (matrix.length === 0 || matrix[0].length === 0) return false;
  let r = 0, c = matrix[0].length - 1;
  while (r < matrix.length && c >= 0) {
    if (matrix[r][c] === target) return true;
    if (matrix[r][c] > target) c--;
    else r++;
  }
  return false;
}
```

**Java:**
```java
static boolean searchMatrix(int[][] matrix, int target) {
    if (matrix.length == 0 || matrix[0].length == 0) return false;
    int r = 0, c = matrix[0].length - 1;
    while (r < matrix.length && c >= 0) {
        if (matrix[r][c] == target) return true;
        if (matrix[r][c] > target) c--;
        else r++;
    }
    return false;
}
```

**Key points:**
- The top-right (or bottom-left) corner is the pivot where one direction increases and the other decreases.
- Each comparison discards an entire row or column, so O(m + n) beats m separate binary searches O(m log n).
- Guard empty matrix and empty rows before indexing `matrix[0]`.

**Follow-ups:**
- Return the coordinates of the target rather than a boolean.
- Count how many cells are less than the target.
- Compare with binary search when the matrix is fully row-major sorted (Search a 2D Matrix I).

**Common Pitfalls:**
- Starting at the top-left or bottom-right corner, where both directions move the same way and the elimination logic fails.
- Off-by-one on the column index when initializing `c = n - 1`.

**Tags:** #algorithm

---

## Array / String

### 73. Excel Sheet Column Title

**Difficulty:** Easy
**Topics:** math, string
**Position:** SWE
**Years:** L60-L62

**Question:** Given an integer column number, return its corresponding Excel column title (1 -> A, 28 -> AB, 701 -> ZY).

**Approach:** Modified base-26 with 1-indexing (no zero digit). Loop: `n--; c = 'A' + n % 26; n /= 26;` prepend `c`. O(log n) time. Classic Microsoft "off-by-one" probe — they want you to derive the `n--` trick.

**Python:**
```python
def convert_to_title(n: int) -> str:
    out: list[str] = []
    while n > 0:
        n -= 1
        out.append(chr(ord("A") + n % 26))
        n //= 26
    return "".join(reversed(out))
```

**TypeScript:**
```typescript
function convertToTitle(n: number): string {
  let out = "";
  while (n > 0) {
    n--;
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26);
  }
  return out;
}
```

**Java:**
```java
static String convertToTitle(int n) {
    StringBuilder sb = new StringBuilder();
    while (n > 0) {
        n--;
        sb.append((char) ('A' + n % 26));
        n /= 26;
    }
    return sb.reverse().toString();
}
```

**Key points:**
- `n--` shifts the 1-indexed system into a 0-indexed base-26 digit.
- Build digits least-significant-first, then reverse (or prepend).
- O(log_26 n) iterations; works for arbitrarily large inputs.

**Tags:** #algorithm

---

### 74. Find Peak Element

**Difficulty:** Medium
**Topics:** binary-search, arrays
**Position:** SWE
**Years:** L60-L62

**Question:** A peak element is strictly greater than its neighbors. Given an array where `nums[i] != nums[i+1]`, return the index of any peak in O(log n).

**Approach:** Binary search: compare `mid` with `mid+1`. If `nums[mid] < nums[mid+1]`, peak is to the right (`lo = mid+1`); else left (`hi = mid`). Loop until `lo == hi`. O(log n) time. Boundary `nums[-1] = nums[n] = -inf` guarantees a peak exists.

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
static int findPeakElement(int[] nums) {
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
- Uphill slope guarantees a peak exists on that side.
- Loop ends when `lo == hi`, pointing at a peak.
- Virtual `-inf` boundaries guarantee any array has at least one peak.

**Tags:** #algorithm

---

### 75. Single Number III

**Difficulty:** Medium
**Topics:** bit-manipulation, arrays
**Position:** SWE
**Years:** L62-L63

**Question:** Given an array where exactly two elements appear once and all others appear twice, find the two unique elements in O(n) time and O(1) space.

**Approach:** XOR all = `a ^ b`. Pick any set bit (e.g., `xor & -xor`) — that bit differs between a and b. Partition the array by that bit; XOR each partition independently to isolate a and b. O(n) time, O(1) space.

**Python:**
```python
from functools import reduce
from operator import xor

def single_number(nums: list[int]) -> list[int]:
    x = reduce(xor, nums)
    bit = x & -x
    a = 0
    for n in nums:
        if n & bit:
            a ^= n
    return [a, x ^ a]
```

**TypeScript:**
```typescript
function singleNumber(nums: number[]): number[] {
  let x = 0;
  for (const n of nums) x ^= n;
  const bit = x & -x;
  let a = 0;
  for (const n of nums) if (n & bit) a ^= n;
  return [a, x ^ a];
}
```

**Java:**
```java
static int[] singleNumber(int[] nums) {
    int x = 0;
    for (int n : nums) x ^= n;
    int bit = x & -x;
    int a = 0;
    for (int n : nums) if ((n & bit) != 0) a ^= n;
    return new int[]{a, x ^ a};
}
```

**Key points:**
- XOR cancels paired elements; only `a ^ b` survives.
- `x & -x` isolates the lowest set bit — any differing bit works.
- Second pass partitions and XORs to recover both uniques.

**Tags:** #algorithm

---

### 76. Sum of Two Integers (no + operator)

**Difficulty:** Medium
**Topics:** bit-manipulation, math
**Position:** SWE
**Years:** L62-L63

**Question:** Compute the sum of two integers a and b without using the `+` or `-` operators.

**Approach:** Loop: `sum = a ^ b; carry = (a & b) << 1; a = sum; b = carry;` until `b == 0`. In languages without arbitrary-precision ints (Java/C++), use unsigned semantics or 32-bit masks. Discuss negative numbers via two's complement.

**Python:**
```python
def get_sum(a: int, b: int) -> int:
    mask = 0xFFFFFFFF
    while b & mask:
        a, b = (a ^ b) & mask, ((a & b) << 1) & mask
    return a if a <= 0x7FFFFFFF else ~(a ^ mask)
```

**TypeScript:**
```typescript
function getSum(a: number, b: number): number {
  while (b !== 0) {
    const sum = (a ^ b) | 0;
    const carry = ((a & b) << 1) | 0;
    a = sum;
    b = carry;
  }
  return a;
}
```

**Java:**
```java
static int getSum(int a, int b) {
    while (b != 0) {
        int carry = (a & b) << 1;
        a = a ^ b;
        b = carry;
    }
    return a;
}
```

**Key points:**
- XOR yields sum without carry; AND-shift yields the carry.
- Iterate until carry is zero (max 32 rounds for 32-bit ints).
- Python needs a 32-bit mask to emulate fixed-width overflow.

**Complexity:** O(1) — at most 32 carry-propagation rounds for a 32-bit integer; O(1) space.

**Tags:** #algorithm

---

### 77. Power of Two

**Difficulty:** Easy
**Topics:** bit-manipulation, math
**Position:** SWE
**Years:** L60-L62

**Question:** Given an integer n, return true if it is a power of two.

**Approach:** `n > 0 && (n & (n - 1)) == 0`. Why: a power of two has exactly one bit set; subtracting 1 flips that bit and sets all lower bits, so AND is zero. O(1). Discuss edge: zero and negatives are not powers of two.

**Python:**
```python
def is_power_of_two(n: int) -> bool:
    return n > 0 and (n & (n - 1)) == 0
```

**TypeScript:**
```typescript
function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}
```

**Java:**
```java
static boolean isPowerOfTwo(int n) {
    return n > 0 && (n & (n - 1)) == 0;
}
```

**Key points:**
- A power of two has exactly one set bit.
- `n - 1` flips that bit and lights up all below it, so AND is 0.
- Guard `n > 0` because `0` and negatives satisfy the bit test in two's complement.

**Tags:** #algorithm

---

### 78. KMP Pattern Matching

**Difficulty:** Hard
**Topics:** string, kmp
**Position:** Senior SWE
**Years:** L62-L63

**Question:** Implement KMP to find all occurrences of a pattern in a text in O(n + m).

**Approach:** Build the failure (LPS) array: longest proper prefix that's also a suffix for each pattern prefix. Scan text once, on mismatch fall back via the failure table without re-comparing matched chars. O(n + m) time, O(m) space. Microsoft prefers you can derive LPS construction live.

**Python:**
```python
def kmp_search(text: str, pattern: str) -> list[int]:
    if not pattern:
        return []
    lps = [0] * len(pattern)
    k = 0
    for i in range(1, len(pattern)):
        while k and pattern[k] != pattern[i]:
            k = lps[k - 1]
        if pattern[k] == pattern[i]:
            k += 1
        lps[i] = k
    out: list[int] = []
    j = 0
    for i, c in enumerate(text):
        while j and pattern[j] != c:
            j = lps[j - 1]
        if pattern[j] == c:
            j += 1
        if j == len(pattern):
            out.append(i - j + 1)
            j = lps[j - 1]
    return out
```

**TypeScript:**
```typescript
function kmpSearch(text: string, pattern: string): number[] {
  if (pattern.length === 0) return [];
  const lps = new Array<number>(pattern.length).fill(0);
  let k = 0;
  for (let i = 1; i < pattern.length; i++) {
    while (k > 0 && pattern[k] !== pattern[i]) k = lps[k - 1];
    if (pattern[k] === pattern[i]) k++;
    lps[i] = k;
  }
  const out: number[] = [];
  let j = 0;
  for (let i = 0; i < text.length; i++) {
    while (j > 0 && pattern[j] !== text[i]) j = lps[j - 1];
    if (pattern[j] === text[i]) j++;
    if (j === pattern.length) { out.push(i - j + 1); j = lps[j - 1]; }
  }
  return out;
}
```

**Java:**
```java
static List<Integer> kmpSearch(String text, String pattern) {
    List<Integer> out = new ArrayList<>();
    if (pattern.isEmpty()) return out;
    int[] lps = new int[pattern.length()];
    for (int i = 1, k = 0; i < pattern.length(); i++) {
        while (k > 0 && pattern.charAt(k) != pattern.charAt(i)) k = lps[k - 1];
        if (pattern.charAt(k) == pattern.charAt(i)) k++;
        lps[i] = k;
    }
    for (int i = 0, j = 0; i < text.length(); i++) {
        while (j > 0 && pattern.charAt(j) != text.charAt(i)) j = lps[j - 1];
        if (pattern.charAt(j) == text.charAt(i)) j++;
        if (j == pattern.length()) { out.add(i - j + 1); j = lps[j - 1]; }
    }
    return out;
}
```

**Key points:**
- `lps[i]` = length of longest proper prefix of `pattern[..i]` that is also a suffix.
- On mismatch, fall back to `lps[j-1]` instead of restarting.
- Total work is O(n + m) since `j` increases at most n times and decreases monotonically.

**Tags:** #algorithm

---

### 79. Merge Intervals

**Difficulty:** Medium
**Topics:** array, sorting, intervals
**Position:** SWE
**Years:** L60-L62

**Question:** Given a list of intervals `[start, end]`, merge all overlapping intervals and return the non-overlapping result. Clarify whether touching intervals like `[1,4]` and `[4,5]` count as overlapping.

**Approach:** Sort by start, then sweep: keep a running last-merged interval and, for each next interval, extend its end if it starts at or before the last end, otherwise push a new interval. O(n log n) time from the sort, O(n) output space (O(1) extra beyond output). Microsoft probes the `start <= last_end` boundary (touching intervals merge) and the empty-input case.

**Python:**
```python
def merge(intervals: list[list[int]]) -> list[list[int]]:
    if not intervals:
        return []
    intervals.sort(key=lambda x: x[0])
    merged: list[list[int]] = [intervals[0][:]]
    for start, end in intervals[1:]:
        if start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged
```

**TypeScript:**
```typescript
function merge(intervals: number[][]): number[][] {
  if (intervals.length === 0) return [];
  intervals.sort((a, b) => a[0] - b[0]);
  const merged: number[][] = [[...intervals[0]]];
  for (let i = 1; i < intervals.length; i++) {
    const [start, end] = intervals[i];
    const last = merged[merged.length - 1];
    if (start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  return merged;
}
```

**Java:**
```java
static int[][] merge(int[][] intervals) {
    if (intervals.length == 0) return new int[0][];
    Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
    List<int[]> merged = new ArrayList<>();
    merged.add(new int[]{intervals[0][0], intervals[0][1]});
    for (int i = 1; i < intervals.length; i++) {
        int start = intervals[i][0], end = intervals[i][1];
        int[] last = merged.get(merged.size() - 1);
        if (start <= last[1]) last[1] = Math.max(last[1], end);
        else merged.add(new int[]{start, end});
    }
    return merged.toArray(new int[merged.size()][]);
}
```

**Key points:**
- Sorting by start guarantees any overlap is with the most recent merged interval.
- Use `max` on the end — a later interval may be fully contained (shorter end).
- `start <= last_end` merges touching intervals; use `<` if touching should stay separate.
- O(n log n) time is dominated by the sort; the sweep is linear.

**Follow-ups:**
- Insert Interval into an already-sorted, non-overlapping list in O(n).
- Return the total covered length or count of gaps.
- Handle a stream of intervals — maintain a balanced tree / interval set.

**Common Pitfalls:**
- Setting `last_end = end` instead of `max(last_end, end)` — shrinks a contained interval.
- Mutating input aliases; copy the first interval before pushing it.

**Tags:** #algorithm

---

### 80. String to Integer (atoi)

**Difficulty:** Medium
**Topics:** string, parsing, edge-cases
**Position:** SWE
**Years:** L60-L62

**Question:** Implement `atoi`: skip leading spaces, read an optional sign, consume digits until a non-digit, and clamp the result to the signed 32-bit range `[-2^31, 2^31-1]`. Walk through the tricky inputs.

**Approach:** A single left-to-right scan with an explicit index: trim spaces, capture sign, accumulate `num = num*10 + digit`, and stop at the first non-digit. Clamp to INT_MIN/INT_MAX. O(n) time, O(1) space. Microsoft cares most about the edge cases — lone `+`/`-`, embedded letters, and overflow, which the code guards against (Java clamps mid-loop with a `long`; Python/TS clamp at the end).

**Python:**
```python
def my_atoi(s: str) -> int:
    INT_MIN, INT_MAX = -2**31, 2**31 - 1
    i, n = 0, len(s)
    while i < n and s[i] == ' ':
        i += 1
    sign = 1
    if i < n and s[i] in '+-':
        if s[i] == '-':
            sign = -1
        i += 1
    num = 0
    while i < n and s[i].isdigit():
        num = num * 10 + int(s[i])
        i += 1
    num *= sign
    if num < INT_MIN:
        return INT_MIN
    if num > INT_MAX:
        return INT_MAX
    return num
```

**TypeScript:**
```typescript
function myAtoi(s: string): number {
  const INT_MIN = -(2 ** 31), INT_MAX = 2 ** 31 - 1;
  const n = s.length;
  let i = 0;
  while (i < n && s[i] === ' ') i++;
  let sign = 1;
  if (i < n && (s[i] === '+' || s[i] === '-')) {
    if (s[i] === '-') sign = -1;
    i++;
  }
  let num = 0;
  while (i < n && s[i] >= '0' && s[i] <= '9') {
    num = num * 10 + (s.charCodeAt(i) - 48);
    i++;
  }
  num *= sign;
  if (num < INT_MIN) return INT_MIN;
  if (num > INT_MAX) return INT_MAX;
  return num;
}
```

**Java:**
```java
static int myAtoi(String s) {
    int i = 0, n = s.length();
    while (i < n && s.charAt(i) == ' ') i++;
    int sign = 1;
    if (i < n && (s.charAt(i) == '+' || s.charAt(i) == '-')) {
        if (s.charAt(i) == '-') sign = -1;
        i++;
    }
    long num = 0;
    while (i < n && Character.isDigit(s.charAt(i))) {
        num = num * 10 + (s.charAt(i) - '0');
        if (sign == 1 && num > Integer.MAX_VALUE) return Integer.MAX_VALUE;
        if (sign == -1 && -num < Integer.MIN_VALUE) return Integer.MIN_VALUE;
        i++;
    }
    return (int) (sign * num);
}
```

**Key points:**
- Process phases in order: spaces, then at most one sign, then digits, then stop.
- Clamp to `[-2^31, 2^31-1]`; overflow must saturate, not wrap.
- Non-digit or empty after the sign yields 0 — the digit loop simply never runs.
- O(n) single pass with O(1) extra state; only the index and accumulator move.

**Follow-ups:**
- Support an explicit base or hex prefix like `0x`.
- Reject a lone `+`/`-` or trailing garbage more strictly (strtol-style errno).
- Parse without a wider type — detect overflow via comparison before multiplying.

**Common Pitfalls:**
- Skipping whitespace anywhere instead of only leading spaces.
- Accumulating into a 32-bit int and overflowing before the clamp check.

**Tags:** #algorithm

---

## Other Algorithms

### 81. Reverse Bits

**Difficulty:** Easy
**Topics:** bit-manipulation
**Position:** SWE
**Years:** L60-L62

**Question:** Reverse the bits of a given 32-bit unsigned integer.

**Approach:** Loop 32 times: shift result left, OR in `n & 1`, shift n right. O(32). Optimized: divide-and-conquer with masks (`0xFFFF0000`, `0x00FF00FF`, ...) swaps halves in O(log 32). Microsoft loves the divide-and-conquer version for senior candidates.

**Python:**
```python
def reverse_bits(n: int) -> int:
    result = 0
    for _ in range(32):
        result = (result << 1) | (n & 1)
        n >>= 1
    return result
```

**TypeScript:**
```typescript
function reverseBits(n: number): number {
  let result = 0;
  for (let i = 0; i < 32; i++) {
    result = (result << 1) | (n & 1);
    n >>>= 1;
  }
  return result >>> 0;
}
```

**Java:**
```java
static int reverseBits(int n) {
    int result = 0;
    for (int i = 0; i < 32; i++) {
        result = (result << 1) | (n & 1);
        n >>>= 1;
    }
    return result;
}
```

**Key points:**
- Build result LSB-first by shifting it left each iteration.
- Use unsigned right shift (`>>>`) in JS/TS to avoid sign extension.
- Divide-and-conquer swaps (16↔16, 8↔8, ...) reduce to O(log 32) ops.

**Tags:** #algorithm

---

### 82. Number of 1 Bits (Hamming Weight)

**Difficulty:** Easy
**Topics:** bit-manipulation
**Position:** SWE
**Years:** L60-L62

**Question:** Return the number of 1 bits in a 32-bit unsigned integer.

**Approach:** Kernighan's trick: `while (n) { n &= n - 1; count++; }` — runs once per set bit. O(k) where k = popcount. Builtin `Integer.bitCount` / `__builtin_popcount` is fine to mention.

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
static int hammingWeight(int n) {
    int count = 0;
    while (n != 0) {
        n &= n - 1;
        count++;
    }
    return count;
}
```

**Key points:**
- `n & (n - 1)` clears the lowest set bit, so loop runs exactly popcount times.
- Beats the naive bit-by-bit scan that runs 32 times regardless.
- Builtin popcount (`Integer.bitCount`, `__builtin_popcount`) is preferred in production.

**Tags:** #algorithm

---

### 83. Missing Number

**Difficulty:** Easy
**Topics:** math, bit-manipulation, array, xor
**Position:** SWE
**Years:** L60-L62

**Question:** Given an array containing `n` distinct numbers taken from the range `[0, n]`, find the single missing number. Discuss an O(1) extra-space approach and its overflow trade-off.

**Approach:** The XOR trick: XOR all indices `0..n` together with every array value; equal numbers cancel, leaving the missing one. O(n) time, O(1) space, and no overflow risk. The Gauss-sum alternative (`n*(n+1)/2 - sum`) is equally simple but can overflow for large `n` — the trade-off Microsoft wants you to name.

**Python:**
```python
def missing_number(nums: list[int]) -> int:
    result = len(nums)
    for i, num in enumerate(nums):
        result ^= i ^ num
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
static int missingNumber(int[] nums) {
    int result = nums.length;
    for (int i = 0; i < nums.length; i++) {
        result ^= i ^ nums[i];
    }
    return result;
}
```

**Key points:**
- XOR of a value with itself is 0, so present numbers cancel and the gap survives.
- Seed with `n` (the array length) to cover the full index range `0..n`.
- O(n) time, O(1) space, and unlike the sum approach it never overflows.
- Works regardless of input order — no sorting needed.

**Follow-ups:**
- Two numbers missing — partition by a differing bit, then XOR each group.
- Find a duplicate instead (Floyd's cycle detection).
- The array is sorted — binary search for the first index-value mismatch in O(log n).

**Common Pitfalls:**
- Forgetting to fold in the final index `n` (seed the accumulator with it).
- Choosing the sum formula and overflowing for large `n` without widening the type.

**Tags:** #algorithm

---

## System Design

### 84. Design Microsoft Teams Chat

**Difficulty:** Hard
**Topics:** system-design, websockets, pub-sub, presence
**Position:** Senior SWE
**Years:** L63-L65

**Question:** Design the messaging backend for Microsoft Teams (1:1, group chat, channels with thousands of members, presence).

**Approach:** WebSocket gateways (sticky per user) → message bus (Service Bus / Kafka). Per-channel topic for fanout. Storage: messages in Cosmos DB sharded by `channel_id`. Presence: in-memory store (Redis) per region with TTL'd entries; aggregate cross-region with eventual consistency. Discuss read receipts, typing indicators (throttle to 1/sec), and how large channels avoid fanout storms (lazy fetch on scroll). Bonus: mention compliance/eDiscovery requirements (Office 365 immutable archive).

**Follow-ups:**
- Channel with 10K+ members — fanout-on-write vs lazy pull on open.
- Federation with external tenants — trust boundary, key exchange.
- Compliance: retention, legal hold, eDiscovery search across years of messages.
- Mobile push to a sleeping device — APNs/FCM bridge and dedup.
- Read receipts at scale — batched, lossy, or strict per-recipient?

**Common Pitfalls:**
- Treating presence as strongly consistent — wastes a lot of write throughput.
- Naive fanout-on-write for every channel — large channels collapse the system.

**Tags:** #system-design

---

### 85. Design Azure Blob Storage

**Difficulty:** Hard
**Topics:** system-design, blob-storage, replication, erasure-coding, cloud
**Position:** Senior SWE
**Years:** L63-L65

**Question:** Design Azure Blob Storage. Cover sharding, replication, durability, and the read/write path.

**Approach:** Front-end layer (load-balanced) → partition layer (mapping blob name to storage server, sharded by account+container+blob) → stream layer (append-only, erasure-coded chunks distributed across nodes/racks/AZs). Partition layer uses a master (Paxos) for table assignment. Multi-AZ for durability, async geo-replication for DR. Discuss strong consistency within a region (partition has a single primary), large blob upload (block blobs with commit), and tiering (hot → cool → archive).

**Follow-ups:**
- Replication factor choice — 3-replica vs erasure code, when does each win?
- Hot partition recovery — a single tenant saturates one storage node.
- Append-only at the stream layer — how does delete / overwrite actually work?
- Cross-region async geo-replication — RPO/RTO targets and conflict resolution.
- Tier transition pipeline — when does hot → cool → archive run and how is read latency tagged?

**Common Pitfalls:**
- Assuming blob = single contiguous file — misses the block/append structure.
- Mixing the partition and stream layers; their failure domains and consistency stories differ.

**Tags:** #system-design

---

### 86. Design Office 365 Document Co-Authoring

**Difficulty:** Hard
**Topics:** system-design, ot, crdt, sync
**Position:** Senior SWE
**Years:** L63-L65

**Question:** Design how Word/Excel/PowerPoint Online support multiple users editing the same document concurrently.

**Approach:** Operational Transformation or CRDT on a per-document basis. Per-doc service (sharded by doc_id) acts as central serializer; WebSocket-connect clients send ops, server transforms+broadcasts. Persist op log to durable store (Cosmos DB) + periodic snapshots to blob. Discuss offline editing (queue ops locally, replay on reconnect), large document scale (paragraph-level granularity), and rich content (embedded objects, comments). Mention how Excel is harder than Word (cell references can shift formulas).

**Tags:** #system-design

---

### 87. Design a Job Scheduler (Azure Functions backend)

**Difficulty:** Medium
**Topics:** system-design, queue, scheduling, distributed-systems, cloud, ops
**Position:** Senior SWE
**Years:** L63-L65

**Question:** Design a distributed job scheduler that supports one-off, recurring (cron), and delayed jobs at high scale.

**Approach:** Persistent job store (Cosmos DB) with `next_run_time` index. Scheduler workers (leader-elected via ZK/etcd) scan due jobs every second, push to a queue (Service Bus). Worker pool pulls from queue, executes, reports status. For recurring jobs, on completion re-schedule with next cron time. Discuss exactly-once vs at-least-once (most schedulers commit to at-least-once + idempotent handlers), backfill on outage, and time zone handling for cron.

**Tags:** #system-design

---

### 88. Design an API Rate Limiter

**Difficulty:** Medium
**Topics:** system-design, rate-limiting, redis, distributed
**Position:** SWE
**Years:** L62-L63

**Question:** Design a rate limiter for an API supporting per-user and per-IP limits.

**Approach:** Token bucket or sliding window log. Storage in Redis cluster sharded by user_id. Atomic Lua script to decrement-and-check. Local first-line in-process cache for very-hot keys (refresh every 100ms). For distributed limiting, prefer regional limits (eventual consistency tolerated) over global synchronous. Discuss fail-open vs fail-closed.

**Tags:** #system-design

---

### 89. Design Xbox Live Matchmaking

**Difficulty:** Hard
**Topics:** system-design, gaming, latency, ranking
**Position:** Senior SWE
**Years:** L63-L65

**Question:** Design the matchmaking system for Xbox Live (or any multiplayer game) that pairs players by skill and latency.

**Approach:** Players enter a queue keyed by `(game_mode, region, skill_bucket)`. TrueSkill/Glicko-2 for skill; expand bucket window over time (skill ± N grows with wait). Region picked by ping test to candidate data centers. Match finder runs every few seconds per bucket. On match: allocate game server (Kubernetes pool) in the lowest-latency DC. Discuss anti-smurf, party matchmaking (group of 4 vs solos), and fairness vs queue time trade-off.

**Tags:** #system-design

---

### 90. Design Bing search autocomplete

**Difficulty:** Hard
**Topics:** system-design, trie, ranking, caching, low-latency
**Position:** Senior SWE
**Years:** L63-L65

**Question:** Design the autocomplete (type-ahead) service behind the Bing search box: as a user types each character, return the top ~10 ranked query suggestions in single-digit milliseconds, at web scale and across languages.

**Approach:** Offline pipeline aggregates the query log (billions/day) into a prefix→top-K table: map-reduce over historical queries, weight by frequency with time decay (recent trends matter — see "Common Pitfalls"), plus personalization and geo/language signals. Serve from an in-memory structure — a trie whose every node caches its precomputed top-K completions, or a simpler sharded hash of `prefix → top-K` blob. Shard by prefix hash across a fleet of read replicas fronted by a low-latency gateway; keep the hottest short prefixes replicated everywhere. The two scored decisions: (1) precompute-at-node vs compute-at-query — storing top-K at each trie node trades memory for O(prefix length) lookups and no per-request heap scan, which is the right call given the read/write ratio; (2) freshness — the batch table is hours stale, so layer a fast path that ingests recent queries via Event Hubs / Service Bus into a streaming aggregator (Azure Functions) and merges a small "trending" delta over the batch table at serve time. Store the batch snapshots in Blob Storage, hot-load into memory on deploy; use Redis/Cosmos DB for personalization state keyed by user. Cache per-prefix results at the edge with short TTLs; debounce on the client and cancel in-flight requests on the next keystroke.

**Follow-ups:**
- Spelling correction / fuzzy prefixes — edit-distance tolerance, phonetic matching, or a separate correction model in front of the trie.
- Trending spikes (breaking news) — how fast can a brand-new query surface, and how do you avoid a stampede from bots gaming frequency?
- Personalization vs privacy — per-user history, GDPR deletion, and keeping the hot path fast when you must join user state.
- Multi-language / CJK input where a "prefix" is pinyin or partial IME composition.
- Ranking beyond raw frequency — CTR, dwell time, demotion of adult/unsafe suggestions.

**Common Pitfalls:**
- Ranking purely by all-time frequency — kills freshness; trending and time-decay must be first-class, not an afterthought.
- Rebuilding or locking the whole trie on every update — use immutable snapshots swapped atomically, or copy-on-write, so reads never block on writes.

**Tags:** #system-design

---

### 91. Design OneDrive file sync

**Difficulty:** Hard
**Topics:** system-design, file-sync, blob-storage, conflict-resolution, delta-sync
**Position:** Senior SWE
**Years:** L63-L65

**Question:** Design the OneDrive (or Dropbox-style) file sync system: a desktop/mobile client keeps a local folder in sync with the cloud and across a user's devices, handling large files, offline edits, and conflicts.

**Approach:** Split responsibilities into a metadata service and a block/content store. Files are chunked (content-defined or fixed ~4MB blocks) and each block is content-addressed by hash; blocks live in Blob Storage, deduplicated across users where policy allows. Metadata — the file tree, versions, and per-file block manifest — lives in Cosmos DB sharded by `user_id` (a user's namespace stays co-located for fast tree listing). The client keeps a local watcher + database, computes changed blocks, and does delta sync: upload only new block hashes, then commit a new manifest (this is the first scored decision — chunk-level delta plus dedup is what makes syncing a 1GB file after a 1-line edit cheap). Change propagation: on commit the metadata service bumps a monotonic per-namespace cursor and notifies the user's other online devices via a long-poll / WebSocket notification channel backed by Service Bus; devices pull the delta since their last cursor. The second scored decision is conflict handling — sync is not a merge system, so use per-file version vectors: if two devices commit from the same base version, keep both and materialize a "conflicted copy" (e.g. `file (Device-2's conflicted copy)`) rather than silently losing an edit; last-writer-wins is only acceptable when one side is a strict descendant. Discuss upload resumability (block-level commit means a dropped connection resumes mid-file), large-tree moves/renames handled as metadata ops (no re-upload), and bandwidth throttling / LAN sync.

**Follow-ups:**
- Millions of files in one folder / a huge tree — how does the client sync without scanning everything on every start?
- Selective sync and files-on-demand (placeholder files hydrated on open).
- Sharing a folder across users — permission model, and how a shared namespace's cursor fans out.
- Cross-region users and moving a namespace closer to the user; RPO on the metadata store.
- End-to-end encryption vs server-side dedup — why they conflict and what you'd trade.

**Common Pitfalls:**
- Resolving conflicts with last-writer-wins by default — silently destroys user data; version vectors + conflicted copies are expected.
- Syncing whole files instead of blocks — makes large-file edits and resumable upload impractical.

**Tags:** #system-design

---

## Behavioral

### 92. Tell me about a time you learned something new quickly

**Difficulty:** Medium
**Topics:** behavioral, growth-mindset, learning
**Position:** SWE
**Years:** L60-L62

**Question:** Tell me about a time you had to learn a new technology or domain quickly to deliver. How did you approach it?

**Approach:** Direct hit on **growth mindset** — Satya's #1 cultural lens. Show: (1) you didn't pretend to know, (2) you had a structured learning approach (docs → small POC → expert review), (3) you delivered with the new skill, (4) you taught others afterward. Bonus: you actively sought feedback that would have been ego-bruising.

**Tags:** #behavioral

---

### 93. Tell me about a time you got harsh feedback

**Difficulty:** Medium
**Topics:** behavioral, growth-mindset, self-awareness
**Position:** SWE
**Years:** L60-L62

**Question:** Tell me about a time you received tough feedback. What did you do with it?

**Approach:** Microsoft really probes this — the "fixed vs growth mindset" tell. Show: (1) you didn't get defensive, (2) you sought to understand the underlying signal, (3) you made a concrete behavior change with evidence (not just intent), (4) the feedback giver acknowledged the change. Avoid stories where you "secretly disagreed" — that's fixed mindset signal.

**Tags:** #behavioral

---

### 94. Tell me about a project that didn't go well

**Difficulty:** Medium
**Topics:** behavioral, failure, growth-mindset
**Position:** Senior SWE
**Years:** L63-L65

**Question:** Walk me through a project that failed or didn't deliver what you hoped. What happened and what did you learn?

**Approach:** Pick a real failure. Show: (1) you owned the failure without blame-shifting, (2) you ran a real retro (process, not just "we should've tested more"), (3) the lessons changed your behavior in a future project — give the specific example. Microsoft likes when you describe the system/process gap, not the person.

**Tags:** #behavioral

---

### 95. Tell me about a time you led without authority

**Difficulty:** Medium
**Topics:** behavioral, leadership, influence
**Position:** Senior SWE
**Years:** L63-L65

**Question:** Tell me about a time you drove a cross-team initiative without having direct authority over the people involved.

**Approach:** Senior+ signal. Show: (1) you built a coalition with explicit "what's in it for them" framing, (2) you used data/customer impact (not org politics), (3) you celebrated others' contributions publicly, (4) outcome was measurable. Microsoft cares about collaboration across orgs — they have many.

**Tags:** #behavioral

---

### 96. Tell me about a technical disagreement with a coworker and how you resolved it

**Difficulty:** Medium
**Topics:** behavioral, conflict, collaboration, growth-mindset
**Position:** SWE
**Years:** L60-L62

**Question:** Tell me about a time you strongly disagreed with a coworker on a technical decision. How did you handle it and what was the outcome?

**Approach:** The interviewer is testing whether you can hold a strong opinion loosely — Microsoft's **growth mindset** lens explicitly wants "learn-it-all, not know-it-all." They're watching for: do you attack the problem or the person, do you seek to understand the other view, and can you commit and support a decision that didn't go your way. STAR structure: Situation (the technical fork — e.g. sync vs async design, which datastore); Task (what had to be decided and the stakes); Action — this is the graded part: describe how you separated ego from the idea, sought the *data* to resolve it (prototype, benchmark, pull in a customer/perf signal or a neutral third opinion) rather than escalating to seniority or volume, and genuinely steelmanned their position; Result — the decision and, crucially, what you *learned* (ideally a moment where their view turned out partly right, or where you changed your mind on evidence). Land the growth-mindset note: if the team went the other way, show you disagreed-and-committed and helped make it succeed. Avoid "I was right all along" endings and any story where you won by pulling rank — both read as fixed mindset.

**Tags:** #behavioral

---

## Domain Knowledge

### 97. Azure cost optimization on a service

**Difficulty:** Medium
**Topics:** cloud, cost-optimization, azure, ops
**Position:** SRE
**Years:** L63

**Question:** A service running on Azure has a $200K/month bill. Walk me through how you'd cut it in half.

**Approach:** Profile costs first: compute (VMs/AKS), storage (Blob/disks), egress, managed services. Common wins: (1) right-size VMs (CPU/mem utilization < 30% = over-provisioned), (2) reserved instances or spot for batch, (3) Cosmos DB → tune RU/s and partitioning, (4) move cold blobs to cool/archive tier, (5) cache aggressively to cut egress, (6) audit dev/test resources auto-shutdown after hours. Don't optimize without measuring impact on SLOs. Show you'd build a cost dashboard before making cuts.

**Tags:** #domain-knowledge

---

### 98. Debug a high-CPU .NET service

**Difficulty:** Medium
**Topics:** dotnet, profiling, debugging
**Position:** SWE
**Years:** L62

**Question:** A C#/.NET service is showing 100% CPU on production VMs intermittently. How would you debug it?

**Approach:** Step 1: collect a dump (`dotnet-dump collect`) or use a profiler (`dotnet-trace`, PerfView). Look at top stacks. Common causes: (1) GC pressure → check Gen2 collections, large object heap, (2) regex with catastrophic backtracking, (3) JSON serialization of huge objects, (4) busy-wait in a Task scheduler, (5) lock contention. Use `dotnet-counters` for live metrics. Mention you'd correlate with deploy diffs and recent traffic patterns. If irreproducible, add structured logging + sampling profiler in prod (always-on profiling).

**Tags:** #domain-knowledge

---

### 99. .NET garbage collection & memory management

**Difficulty:** Medium
**Topics:** dotnet, gc, memory, csharp, performance
**Position:** Backend
**Years:** L62-L63

**Question:** Explain how the .NET garbage collector works and how you manage memory in a high-throughput .NET service.

**Approach:** .NET uses a tracing, generational, mark-and-sweep-and-compact GC. The managed heap is split into generations: Gen0 (short-lived, collected most often and cheaply), Gen1 (a buffer between short- and long-lived), and Gen2 (long-lived objects); survivors get promoted up a generation. Large objects (>=85KB) go on the Large Object Heap (LOH), which historically was not compacted (so it fragments) — you can force `GCSettings.LargeObjectHeapCompactionMode` but it's expensive. A collection roots from stacks, statics, and GC handles, marks reachable objects, then sweeps and compacts (updating references), which is why managed pointers can move. The generational assumption — most objects die young — is what makes Gen0 collections fast. Two GC flavors: Workstation vs Server GC (Server GC uses per-CPU heaps and background threads, the default for throughput services); Background GC lets Gen2 collection run mostly concurrently to reduce pauses. Deterministic cleanup of unmanaged resources is *not* the GC's job — that's `IDisposable`/`using` and finalizers (finalizers add a second GC cycle to reclaim, so prefer Dispose and the finalizer only as a safety net, ideally via SafeHandle). For a hot service: minimize allocations to keep Gen0 churn and promotions down — use `Span<T>`/`Memory<T>`, `ArrayPool<T>`, `struct` and `stackalloc` where appropriate, and object pooling; watch for accidental boxing and LOH allocations. Diagnose with `dotnet-counters` (alloc rate, Gen2/LOH size, % time in GC) and `dotnet-gcdump`/PerfView.

**Follow-ups:**
- What actually triggers a Gen2 collection, and why is a high Gen2 rate a red flag?
- Workstation vs Server GC — how do you choose, and what does Server GC cost in memory?
- What is the LOH, why does it fragment, and how do you avoid large-array churn?
- Do finalizers guarantee cleanup, and why can a finalizer keep an object alive longer?
- How can a static event handler or a captured closure cause a "managed memory leak" even with a GC?

**Common Pitfalls:**
- Believing the GC handles unmanaged resources (file handles, sockets, native memory) — it doesn't; you still need Dispose.
- Calling `GC.Collect()` in production to "fix" memory — it usually hurts by forcing promotions and full collections.

**Tags:** #domain-knowledge

---

### 100. C# async/await & the concurrency model

**Difficulty:** Medium
**Topics:** csharp, async, concurrency, dotnet, tasks
**Position:** Backend
**Years:** L62-L63

**Question:** Explain how `async`/`await` works in C#, and how it relates to threads and the .NET concurrency model.

**Approach:** `async`/`await` is compiler-generated cooperative asynchrony, not a thread. The compiler rewrites an async method into a state machine: at each `await` of an incomplete `Task`, the method registers a continuation and *returns to its caller*, freeing the current thread; when the awaited operation completes, the continuation is scheduled to resume from where it left off. The key insight is async != parallel — for true I/O (a socket, disk, DB) there is no thread blocked waiting; the OS completes the operation and only then is a thread borrowed to run the continuation. This is why async scales servers: a handful of threads serve thousands of in-flight I/O-bound requests instead of one-thread-per-request. `Task` represents a future result; `await` unwraps it and re-throws captured exceptions. The SynchronizationContext / TaskScheduler decides *where* the continuation runs — in UI apps it marshals back to the UI thread; in ASP.NET Core there's no such context, so continuations run on thread-pool threads. `ConfigureAwait(false)` says "I don't need the original context back," which avoids a needless hop and, critically, avoids the classic sync-over-async deadlock (blocking on `.Result`/`.Wait()` while the one context thread is stuck waiting for the continuation that needs that same thread). Rules of thumb: async all the way down, never block on async code, return `Task`/`Task<T>` (not `async void` except for event handlers), use `CancellationToken`, and use `Task.WhenAll` for concurrent independent awaits. CPU-bound work is different — that's real parallelism via `Task.Run`/the thread pool/`Parallel`, not what async I/O is for.

**Follow-ups:**
- Why does `async` scale an I/O-bound web server when it doesn't add threads?
- Walk through the classic `.Result` deadlock and how `ConfigureAwait(false)` or async-all-the-way avoids it.
- When is `async void` acceptable, and why is it dangerous elsewhere?
- `Task.WhenAll` vs a loop of sequential awaits — throughput and exception aggregation differences.
- What is a `ValueTask`, and when would you use it over `Task`?

**Common Pitfalls:**
- Thinking `await` starts a new thread or makes code parallel — it's cooperative continuation; I/O awaits use no thread while waiting.
- Blocking on async with `.Result`/`.Wait()` — deadlocks under a captured SynchronizationContext and starves the thread pool.

**Tags:** #domain-knowledge

---

## Tips specific to Microsoft

- **Fundamentals over flash.** Microsoft tends to grade for correctness, edge cases, and code clarity over algorithmic insight. Slow down, handle nulls, comment briefly.
- **Growth mindset is the cultural code.** Stories should show learning, especially from mistakes or feedback. Fixed mindset signals (defensive, blamey, "I was right all along") tank rounds.
- **Know one Azure service deeply** if the role is cloud-adjacent. You don't need to know all 200 — pick Cosmos DB, Service Bus, or AKS and have an opinion.
- **AA round is for fit + level calibration.** Less coding, more architecture and behavioral. Treat it like you'd treat a skip-level interview.
- **OOD shows up.** Practice 2-3 classic ones (parking lot, vending machine, library system).

## Resources

- LeetCode "Microsoft" company tag
- "Hit Refresh" by Satya Nadella — gives you the cultural framing
- Microsoft Learn (Azure certifications) — free, useful for cloud rounds
- Cracking the Coding Interview — solid for Microsoft's classical bar
