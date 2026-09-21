# Huawei (华为)

```yaml
company: Huawei (Carrier Networks, HarmonyOS / Consumer BG, Huawei Cloud, 5G/Wireless, Hardware/Embedded)
typical_rounds: 1 OD/机试 (online coding assessment) + 2-4 technical (技术面) + cross-team (交叉面) + HR/department director (主管面)
focus_areas: C/C++, algorithms (机试), operating systems, TCP/IP networking, embedded/telecom, distributed systems
languages_allowed: C/C++ most common (esp. carrier/embedded); Java/Python/Go for cloud and tooling
duration: 机试 ~150 min (3 problems); each interview round 45-60 min
notable_quirks:
  - 机试 (OD 机试) is a must-pass coding gate — typically 3 algorithm problems in ~150 min, weighted scoring
  - Distinction between OD (外包/Outsourcing Dispatch) and 正编 (regular headcount) roles — different process and treatment
  - Heavy C/C++ pointer and manual memory-management questions; segfault / leak debugging probed
  - OS and networking deep-dives (process vs thread, IPC, TCP three-way handshake, congestion control) common
  - 奋斗者协议 (dedicator agreement) and long-hours culture probed in behavioral
  - Strong telecom / 5G / HarmonyOS distributed domain context in system design
sources: LeetCode Discuss (huawei tag), 牛客网 (NowCoder), 一亩三分地 (1point3acres), Glassdoor
```

## Overview

Huawei's loop is distinctive for its heavy, must-pass 机试 (online coding assessment) — usually three algorithm problems in roughly 150 minutes, and a weak score here often ends the process before any human interview. C/C++ is the dominant language, especially for carrier-network and embedded teams, so expect manual memory management, pointer arithmetic, and segfault/leak debugging alongside standard data-structure problems. Interviewers probe operating-system and TCP/IP networking fundamentals far more than US companies do. System design is grounded in Huawei's domains: telecom billing, 5G base stations, HarmonyOS distributed soft-bus, and carrier-grade high availability. Behavioral rounds explore the 奋斗者 ("dedicator/striver") culture and willingness to work under high pressure.

## Linked List

### 1. Reverse Linked List

**Difficulty:** Easy
**Topics:** linked-list, two-pointer
**Position:** OD / SWE
**Years:** 13-14 (Junior)

**Question:** Reverse a singly linked list and return the new head.

**Approach:** Iterate with `prev`/`curr` pointers, flipping each `next` pointer in place. Time O(n), space O(1). A staple of Huawei C/C++ 机试 — interviewers may ask for the recursive variant too.

**Python:**
```python
class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val, self.next = val, next

def reverse_list(head: ListNode | None) -> ListNode | None:
    prev = None
    while head:
        nxt = head.next
        head.next = prev
        prev = head
        head = nxt
    return prev
```

**TypeScript:**
```typescript
class ListNode {
  val: number; next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) { this.val = val; this.next = next; }
}

function reverseList(head: ListNode | null): ListNode | null {
  let prev: ListNode | null = null;
  while (head) {
    const nxt = head.next;
    head.next = prev;
    prev = head;
    head = nxt;
  }
  return prev;
}
```

**Java:**
```java
class ListNode {
  int val; ListNode next;
  ListNode(int val) { this.val = val; }
}

ListNode reverseList(ListNode head) {
  ListNode prev = null;
  while (head != null) {
    ListNode nxt = head.next;
    head.next = prev;
    prev = head;
    head = nxt;
  }
  return prev;
}
```

**Key points:**
- In-place pointer flipping is O(n) time, O(1) space.
- Save `next` before overwriting it or you lose the rest of the list.

**Follow-ups:**
- Reverse only nodes between positions m and n.
- Reverse in groups of k (Reverse Nodes in k-Group).
- Do it recursively and discuss the O(n) call-stack space.
- Detect and handle a cycle before reversing.

**Tags:** #algorithm

---

### 2. Merge Two Sorted Lists

**Difficulty:** Easy
**Topics:** linked-list, two-pointer
**Position:** OD / SWE
**Years:** 13-14 (Junior)

**Question:** Merge two sorted linked lists into one sorted list and return its head.

**Approach:** Dummy head, walk both lists splicing the smaller node each step, then attach the remaining tail. Time O(n + m), space O(1).

**Python:**
```python
class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val, self.next = val, next

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
  val: number; next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) { this.val = val; this.next = next; }
}

function mergeTwoLists(a: ListNode | null, b: ListNode | null): ListNode | null {
  const dummy = new ListNode();
  let tail = dummy;
  while (a && b) {
    if (a.val <= b.val) { tail.next = a; a = a.next; }
    else { tail.next = b; b = b.next; }
    tail = tail.next;
  }
  tail.next = a ?? b;
  return dummy.next;
}
```

**Java:**
```java
class ListNode {
  int val; ListNode next;
  ListNode(int val) { this.val = val; }
}

ListNode mergeTwoLists(ListNode a, ListNode b) {
  ListNode dummy = new ListNode(0), tail = dummy;
  while (a != null && b != null) {
    if (a.val <= b.val) { tail.next = a; a = a.next; }
    else { tail.next = b; b = b.next; }
    tail = tail.next;
  }
  tail.next = a != null ? a : b;
  return dummy.next;
}
```

**Key points:**
- Dummy head avoids special-casing the first node; O(n + m) time, O(1) space.
- Attach the non-empty remainder in one step instead of looping.

**Follow-ups:**
- Merge k sorted lists with a heap in O(N log k).
- Merge in descending order.
- Merge two sorted arrays in place.
- Make the merge stable when values are equal.

**Tags:** #algorithm

---

### 3. Linked List Cycle

**Difficulty:** Easy
**Topics:** linked-list, two-pointer, floyd
**Position:** OD / SWE
**Years:** 13-14 (Junior)

**Question:** Determine whether a linked list contains a cycle.

**Approach:** Floyd's tortoise and hare — slow advances one, fast advances two; they meet iff a cycle exists. Time O(n), space O(1).

**Python:**
```python
class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val, self.next = val, next

def has_cycle(head: ListNode | None) -> bool:
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            return True
    return False
```

**TypeScript:**
```typescript
class ListNode {
  val: number; next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) { this.val = val; this.next = next; }
}

function hasCycle(head: ListNode | null): boolean {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow!.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}
```

**Java:**
```java
class ListNode {
  int val; ListNode next;
  ListNode(int val) { this.val = val; }
}

boolean hasCycle(ListNode head) {
  ListNode slow = head, fast = head;
  while (fast != null && fast.next != null) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow == fast) return true;
  }
  return false;
}
```

**Key points:**
- Two-pointer detection is O(n) time, O(1) space — no hash set needed.
- The fast pointer guards `fast` and `fast.next` to avoid null dereferences.

**Tags:** #algorithm

---

### 4. Remove Nth Node From End of List

**Difficulty:** Medium
**Topics:** linked-list, two-pointer
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Remove the nth node from the end of a singly linked list in one pass.

**Approach:** Advance a lead pointer n steps, then move lead and a trailing pointer together until lead reaches the end; the trailing pointer sits just before the target. Use a dummy head for the edge case of removing the head. Time O(n), space O(1).

**Python:**
```python
class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val, self.next = val, next

def remove_nth_from_end(head: ListNode | None, n: int) -> ListNode | None:
    dummy = ListNode(0, head)
    lead = lag = dummy
    for _ in range(n):
        lead = lead.next
    while lead.next:
        lead = lead.next
        lag = lag.next
    lag.next = lag.next.next
    return dummy.next
```

**TypeScript:**
```typescript
class ListNode {
  val: number; next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) { this.val = val; this.next = next; }
}

function removeNthFromEnd(head: ListNode | null, n: number): ListNode | null {
  const dummy = new ListNode(0, head);
  let lead: ListNode | null = dummy, lag: ListNode = dummy;
  for (let i = 0; i < n; i++) lead = lead!.next;
  while (lead!.next) { lead = lead!.next; lag = lag.next!; }
  lag.next = lag.next!.next;
  return dummy.next;
}
```

**Java:**
```java
class ListNode {
  int val; ListNode next;
  ListNode(int val) { this.val = val; }
  ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

ListNode removeNthFromEnd(ListNode head, int n) {
  ListNode dummy = new ListNode(0, head), lead = dummy, lag = dummy;
  for (int i = 0; i < n; i++) lead = lead.next;
  while (lead.next != null) { lead = lead.next; lag = lag.next; }
  lag.next = lag.next.next;
  return dummy.next;
}
```

**Key points:**
- A fixed n-gap between two pointers gives a one-pass O(n) solution, O(1) space.
- The dummy head removes the special case of deleting the original head node.

**Tags:** #algorithm

---

### 5. Merge k Sorted Lists

**Difficulty:** Hard
**Topics:** linked-list, heap, divide-and-conquer
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Merge k sorted linked lists into one sorted list.

**Approach:** Min-heap of the current heads; pop the smallest, push its successor, splice onto the result. Time O(N log k) for N total nodes, space O(k).

**Python:**
```python
import heapq

class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val, self.next = val, next

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
  val: number; next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) { this.val = val; this.next = next; }
}

function mergeKLists(lists: Array<ListNode | null>): ListNode | null {
  const nodes: ListNode[] = [];
  for (const l of lists) { let c = l; while (c) { nodes.push(c); c = c.next; } }
  nodes.sort((a, b) => a.val - b.val);
  const dummy = new ListNode();
  let tail = dummy;
  for (const n of nodes) { tail.next = n; tail = n; }
  tail.next = null;
  return dummy.next;
}
```

**Java:**
```java
class ListNode {
  int val; ListNode next;
  ListNode(int val) { this.val = val; }
}

ListNode mergeKLists(ListNode[] lists) {
  PriorityQueue<ListNode> pq = new PriorityQueue<>((a, b) -> a.val - b.val);
  for (ListNode l : lists) if (l != null) pq.add(l);
  ListNode dummy = new ListNode(0), tail = dummy;
  while (!pq.isEmpty()) {
    ListNode node = pq.poll();
    tail.next = node;
    tail = node;
    if (node.next != null) pq.add(node.next);
  }
  return dummy.next;
}
```

**Key points:**
- A k-sized heap yields O(N log k) time, O(k) space.
- The TypeScript variant collect-and-sorts in O(N log N) when no heap library is handy.

**Tags:** #algorithm

---

### 6. Add Two Numbers

**Difficulty:** Medium
**Topics:** linked-list, math, two-pointer
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Two non-empty linked lists represent two non-negative integers stored in reverse order, one digit per node. Add them and return the sum as a linked list.

**Approach:** Walk both lists together with a running carry, creating one output node per position; keep going while either list has nodes or a carry remains. Time O(max(n, m)), space O(max(n, m)) for the result. Reverse-order storage means the least significant digit comes first, so no pre-reversal is needed.

**Python:**
```python
class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val, self.next = val, next

def add_two_numbers(a: ListNode | None, b: ListNode | None) -> ListNode | None:
    dummy = ListNode()
    tail, carry = dummy, 0
    while a or b or carry:
        s = carry + (a.val if a else 0) + (b.val if b else 0)
        carry, digit = divmod(s, 10)
        tail.next = ListNode(digit)
        tail = tail.next
        a = a.next if a else None
        b = b.next if b else None
    return dummy.next
```

**TypeScript:**
```typescript
class ListNode {
  val: number; next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) { this.val = val; this.next = next; }
}

function addTwoNumbers(a: ListNode | null, b: ListNode | null): ListNode | null {
  const dummy = new ListNode();
  let tail = dummy, carry = 0;
  while (a || b || carry) {
    const s = carry + (a?.val ?? 0) + (b?.val ?? 0);
    carry = Math.floor(s / 10);
    tail.next = new ListNode(s % 10);
    tail = tail.next;
    a = a?.next ?? null;
    b = b?.next ?? null;
  }
  return dummy.next;
}
```

**Java:**
```java
class ListNode {
  int val; ListNode next;
  ListNode(int val) { this.val = val; }
}

ListNode addTwoNumbers(ListNode a, ListNode b) {
  ListNode dummy = new ListNode(0), tail = dummy;
  int carry = 0;
  while (a != null || b != null || carry != 0) {
    int s = carry + (a != null ? a.val : 0) + (b != null ? b.val : 0);
    carry = s / 10;
    tail.next = new ListNode(s % 10);
    tail = tail.next;
    if (a != null) a = a.next;
    if (b != null) b = b.next;
  }
  return dummy.next;
}
```

**Key points:**
- The loop condition must include `carry` so a final carry-out (e.g. 5+5) creates a new node.
- A dummy head avoids special-casing the first output node.
- Digits stored in reverse order let you add left-to-right without reversing.

**Tags:** #algorithm

---

### 7. Copy List with Random Pointer

**Difficulty:** Medium
**Topics:** linked-list, hash-table
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Each node has a `next` pointer and a `random` pointer that may point to any node or null. Return a deep copy of the list.

**Approach:** The O(1)-space trick interleaves cloned nodes: put each copy right after its original (A -> A' -> B -> B'), so `curr.random.next` is exactly the copy of the random target; then wire up random pointers, and finally split the two lists apart. Two passes, time O(n), space O(1) beyond the output. (A hash-map original->copy is the simpler O(n)-space alternative.)

**Python:**
```python
class Node:
    def __init__(self, val: int, next: "Node | None" = None, random: "Node | None" = None) -> None:
        self.val, self.next, self.random = val, next, random

def copy_random_list(head: Node | None) -> Node | None:
    if not head:
        return None
    cur = head
    while cur:
        cur.next = Node(cur.val, cur.next)
        cur = cur.next.next
    cur = head
    while cur:
        if cur.random:
            cur.next.random = cur.random.next
        cur = cur.next.next
    new_head = head.next
    cur = head
    while cur:
        copy = cur.next
        cur.next = copy.next
        copy.next = copy.next.next if copy.next else None
        cur = cur.next
    return new_head
```

**TypeScript:**
```typescript
class Node {
  val: number; next: Node | null; random: Node | null;
  constructor(val: number, next: Node | null = null, random: Node | null = null) {
    this.val = val; this.next = next; this.random = random;
  }
}

function copyRandomList(head: Node | null): Node | null {
  if (!head) return null;
  for (let cur: Node | null = head; cur; cur = cur.next!.next)
    cur.next = new Node(cur.val, cur.next);
  for (let cur: Node | null = head; cur; cur = cur.next!.next)
    if (cur.random) cur.next!.random = cur.random.next;
  const newHead = head.next;
  for (let cur: Node | null = head; cur; cur = cur.next) {
    const copy = cur.next!;
    cur.next = copy.next;
    copy.next = copy.next ? copy.next.next : null;
  }
  return newHead;
}
```

**Java:**
```java
class Node {
  int val; Node next, random;
  Node(int val) { this.val = val; }
}

Node copyRandomList(Node head) {
  if (head == null) return null;
  for (Node cur = head; cur != null; cur = cur.next.next) {
    Node copy = new Node(cur.val);
    copy.next = cur.next;
    cur.next = copy;
  }
  for (Node cur = head; cur != null; cur = cur.next.next)
    if (cur.random != null) cur.next.random = cur.random.next;
  Node newHead = head.next;
  for (Node cur = head; cur != null; cur = cur.next) {
    Node copy = cur.next;
    cur.next = copy.next;
    copy.next = copy.next != null ? copy.next.next : null;
  }
  return newHead;
}
```

**Key points:**
- Interleaving lets you find each random target's copy via `cur.random.next` without a map.
- Wire random pointers before splitting, otherwise the interleaved structure is destroyed.
- Restore the original list's `next` pointers during the split so the input is unmodified.

**Tags:** #algorithm

---

### 8. Reorder List

**Difficulty:** Medium
**Topics:** linked-list, two-pointer
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Given a list L0 -> L1 -> ... -> Ln-1 -> Ln, reorder it in place to L0 -> Ln -> L1 -> Ln-1 -> L2 -> ... without changing node values.

**Approach:** Three classic steps: find the middle with slow/fast pointers, reverse the second half, then merge the two halves alternately. Time O(n), space O(1). Purely pointer manipulation, a favorite for testing in-place list surgery.

**Python:**
```python
class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val, self.next = val, next

def reorder_list(head: ListNode | None) -> None:
    if not head or not head.next:
        return
    slow, fast = head, head
    while fast.next and fast.next.next:
        slow, fast = slow.next, fast.next.next
    prev, cur = None, slow.next
    slow.next = None
    while cur:
        cur.next, prev, cur = prev, cur, cur.next
    first, second = head, prev
    while second:
        first.next, second.next, first, second = second, first.next, first.next, second.next
```

**TypeScript:**
```typescript
class ListNode {
  val: number; next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) { this.val = val; this.next = next; }
}

function reorderList(head: ListNode | null): void {
  if (!head || !head.next) return;
  let slow = head, fast = head;
  while (fast.next && fast.next.next) { slow = slow.next!; fast = fast.next.next; }
  let prev: ListNode | null = null, cur = slow.next;
  slow.next = null;
  while (cur) { const nxt = cur.next; cur.next = prev; prev = cur; cur = nxt; }
  let first: ListNode | null = head, second = prev;
  while (second) {
    const f = first!.next, s = second.next;
    first!.next = second; second.next = f;
    first = f; second = s;
  }
}
```

**Java:**
```java
class ListNode {
  int val; ListNode next;
  ListNode(int val) { this.val = val; }
}

void reorderList(ListNode head) {
  if (head == null || head.next == null) return;
  ListNode slow = head, fast = head;
  while (fast.next != null && fast.next.next != null) { slow = slow.next; fast = fast.next.next; }
  ListNode prev = null, cur = slow.next;
  slow.next = null;
  while (cur != null) { ListNode nxt = cur.next; cur.next = prev; prev = cur; cur = nxt; }
  ListNode first = head, second = prev;
  while (second != null) {
    ListNode f = first.next, s = second.next;
    first.next = second; second.next = f;
    first = f; second = s;
  }
}
```

**Key points:**
- Cut the list at the middle (`slow.next = null`) so the two halves are independent before merging.
- With slow/fast the first half is >= the second half, so the merge loop can terminate on `second`.
- Everything is done in place with pointer rewiring, O(1) extra space.

**Tags:** #algorithm

---

## Tree

### 9. Invert Binary Tree

**Difficulty:** Easy
**Topics:** tree, recursion, dfs
**Position:** OD / SWE
**Years:** 13-14 (Junior)

**Question:** Invert a binary tree (mirror left and right subtrees).

**Approach:** Recursively swap children at each node. Time O(n), space O(h) for the recursion stack.

**Python:**
```python
class TreeNode:
    def __init__(self, val: int = 0, left=None, right=None) -> None:
        self.val, self.left, self.right = val, left, right

def invert_tree(root: TreeNode | None) -> TreeNode | None:
    if root:
        root.left, root.right = invert_tree(root.right), invert_tree(root.left)
    return root
```

**TypeScript:**
```typescript
class TreeNode {
  val: number; left: TreeNode | null; right: TreeNode | null;
  constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val; this.left = left; this.right = right;
  }
}

function invertTree(root: TreeNode | null): TreeNode | null {
  if (root) {
    const l = invertTree(root.left);
    root.left = invertTree(root.right);
    root.right = l;
  }
  return root;
}
```

**Java:**
```java
class TreeNode {
  int val; TreeNode left, right;
  TreeNode(int val) { this.val = val; }
}

TreeNode invertTree(TreeNode root) {
  if (root != null) {
    TreeNode l = invertTree(root.right);
    root.right = invertTree(root.left);
    root.left = l;
  }
  return root;
}
```

**Key points:**
- Visiting every node once is O(n) time; recursion depth is O(h) space.
- An explicit stack or queue gives the same result iteratively.

**Tags:** #algorithm

---

### 10. Maximum Depth of Binary Tree

**Difficulty:** Easy
**Topics:** tree, dfs, recursion
**Position:** OD / SWE
**Years:** 13-14 (Junior)

**Question:** Return the maximum depth (number of nodes on the longest root-to-leaf path) of a binary tree.

**Approach:** Depth is `1 + max(depth(left), depth(right))`. Time O(n), space O(h).

**Python:**
```python
class TreeNode:
    def __init__(self, val: int = 0, left=None, right=None) -> None:
        self.val, self.left, self.right = val, left, right

def max_depth(root: TreeNode | None) -> int:
    if not root:
        return 0
    return 1 + max(max_depth(root.left), max_depth(root.right))
```

**TypeScript:**
```typescript
class TreeNode {
  val: number; left: TreeNode | null; right: TreeNode | null;
  constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val; this.left = left; this.right = right;
  }
}

function maxDepth(root: TreeNode | null): number {
  if (!root) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```

**Java:**
```java
class TreeNode {
  int val; TreeNode left, right;
  TreeNode(int val) { this.val = val; }
}

int maxDepth(TreeNode root) {
  if (root == null) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```

**Key points:**
- Post-order recursion touches each node once: O(n) time, O(h) space.
- Worst-case skewed tree makes the stack O(n) deep.

**Tags:** #algorithm

---

### 11. Validate Binary Search Tree

**Difficulty:** Medium
**Topics:** tree, dfs, bst
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Determine whether a binary tree is a valid BST.

**Approach:** Recurse carrying an open `(low, high)` interval; each node's value must lie strictly inside, and bounds tighten as you descend. Time O(n), space O(h).

**Python:**
```python
class TreeNode:
    def __init__(self, val: int = 0, left=None, right=None) -> None:
        self.val, self.left, self.right = val, left, right

def is_valid_bst(root: TreeNode | None) -> bool:
    def check(node, lo, hi):
        if not node:
            return True
        if not (lo < node.val < hi):
            return False
        return check(node.left, lo, node.val) and check(node.right, node.val, hi)
    return check(root, float("-inf"), float("inf"))
```

**TypeScript:**
```typescript
class TreeNode {
  val: number; left: TreeNode | null; right: TreeNode | null;
  constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val; this.left = left; this.right = right;
  }
}

function isValidBST(root: TreeNode | null): boolean {
  const check = (n: TreeNode | null, lo: number, hi: number): boolean => {
    if (!n) return true;
    if (n.val <= lo || n.val >= hi) return false;
    return check(n.left, lo, n.val) && check(n.right, n.val, hi);
  };
  return check(root, -Infinity, Infinity);
}
```

**Java:**
```java
class TreeNode {
  int val; TreeNode left, right;
  TreeNode(int val) { this.val = val; }
}

boolean isValidBST(TreeNode root) {
  return check(root, Long.MIN_VALUE, Long.MAX_VALUE);
}

boolean check(TreeNode n, long lo, long hi) {
  if (n == null) return true;
  if (n.val <= lo || n.val >= hi) return false;
  return check(n.left, lo, n.val) && check(n.right, n.val, hi);
}
```

**Key points:**
- One bounded DFS pass is O(n) time, O(h) space.
- Per-node comparison alone is insufficient; bounds must propagate from ancestors.

**Tags:** #algorithm

---

### 12. Binary Tree Level Order Traversal

**Difficulty:** Medium
**Topics:** tree, bfs, queue
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Return the node values level by level, top to bottom.

**Approach:** BFS with a queue, processing one full level per outer iteration. Time O(n), space O(n).

**Python:**
```python
from collections import deque

class TreeNode:
    def __init__(self, val: int = 0, left=None, right=None) -> None:
        self.val, self.left, self.right = val, left, right

def level_order(root: TreeNode | None) -> list[list[int]]:
    if not root:
        return []
    res, q = [], deque([root])
    while q:
        level = []
        for _ in range(len(q)):
            n = q.popleft()
            level.append(n.val)
            if n.left:
                q.append(n.left)
            if n.right:
                q.append(n.right)
        res.append(level)
    return res
```

**TypeScript:**
```typescript
class TreeNode {
  val: number; left: TreeNode | null; right: TreeNode | null;
  constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val; this.left = left; this.right = right;
  }
}

function levelOrder(root: TreeNode | null): number[][] {
  if (!root) return [];
  const res: number[][] = [];
  let q: TreeNode[] = [root];
  while (q.length) {
    const level: number[] = [], next: TreeNode[] = [];
    for (const n of q) {
      level.push(n.val);
      if (n.left) next.push(n.left);
      if (n.right) next.push(n.right);
    }
    res.push(level);
    q = next;
  }
  return res;
}
```

**Java:**
```java
class TreeNode {
  int val; TreeNode left, right;
  TreeNode(int val) { this.val = val; }
}

List<List<Integer>> levelOrder(TreeNode root) {
  List<List<Integer>> res = new ArrayList<>();
  if (root == null) return res;
  Queue<TreeNode> q = new LinkedList<>();
  q.add(root);
  while (!q.isEmpty()) {
    int size = q.size();
    List<Integer> level = new ArrayList<>();
    for (int i = 0; i < size; i++) {
      TreeNode n = q.poll();
      level.add(n.val);
      if (n.left != null) q.add(n.left);
      if (n.right != null) q.add(n.right);
    }
    res.add(level);
  }
  return res;
}
```

**Key points:**
- BFS visits each node once: O(n) time, O(n) queue space.
- Snapshotting the queue size per level keeps levels separated.

**Tags:** #algorithm

---

### 13. Lowest Common Ancestor of a Binary Tree

**Difficulty:** Medium
**Topics:** tree, dfs, recursion
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Find the lowest common ancestor of two nodes in a binary tree (not necessarily a BST).

**Approach:** Post-order recursion; a node is the LCA if its two subtrees each contain one of the targets (or it is one target itself). Time O(n), space O(h).

**Python:**
```python
class TreeNode:
    def __init__(self, val: int = 0, left=None, right=None) -> None:
        self.val, self.left, self.right = val, left, right

def lowest_common_ancestor(root, p, q):
    if root is None or root is p or root is q:
        return root
    left = lowest_common_ancestor(root.left, p, q)
    right = lowest_common_ancestor(root.right, p, q)
    if left and right:
        return root
    return left or right
```

**TypeScript:**
```typescript
class TreeNode {
  val: number; left: TreeNode | null; right: TreeNode | null;
  constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val; this.left = left; this.right = right;
  }
}

function lowestCommonAncestor(root: TreeNode | null, p: TreeNode, q: TreeNode): TreeNode | null {
  if (root === null || root === p || root === q) return root;
  const left = lowestCommonAncestor(root.left, p, q);
  const right = lowestCommonAncestor(root.right, p, q);
  if (left && right) return root;
  return left ?? right;
}
```

**Java:**
```java
class TreeNode {
  int val; TreeNode left, right;
  TreeNode(int val) { this.val = val; }
}

TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
  if (root == null || root == p || root == q) return root;
  TreeNode left = lowestCommonAncestor(root.left, p, q);
  TreeNode right = lowestCommonAncestor(root.right, p, q);
  if (left != null && right != null) return root;
  return left != null ? left : right;
}
```

**Key points:**
- One post-order pass is O(n) time, O(h) space.
- Returning a non-null from both subtrees pinpoints the split node = LCA.

**Tags:** #algorithm

---

### 14. Implement Trie (Prefix Tree)

**Difficulty:** Medium
**Topics:** trie, design, string
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Implement a trie with `insert`, `search`, and `startsWith`.

**Approach:** Each node holds child links and an end-of-word flag; operations walk one node per character. Time O(L) per operation, space O(total characters).

**Python:**
```python
class Trie:
    def __init__(self) -> None:
        self.children: dict[str, "Trie"] = {}
        self.end = False

    def insert(self, word: str) -> None:
        node = self
        for c in word:
            node = node.children.setdefault(c, Trie())
        node.end = True

    def _find(self, prefix: str) -> "Trie | None":
        node = self
        for c in prefix:
            if c not in node.children:
                return None
            node = node.children[c]
        return node

    def search(self, word: str) -> bool:
        node = self._find(word)
        return node is not None and node.end

    def starts_with(self, prefix: str) -> bool:
        return self._find(prefix) is not None
```

**TypeScript:**
```typescript
class Trie {
  private children: Map<string, Trie> = new Map();
  private end = false;

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
      const next = node.children.get(c);
      if (!next) return null;
      node = next;
    }
    return node;
  }

  search(word: string): boolean {
    const node = this.find(word);
    return node !== null && node.end;
  }

  startsWith(prefix: string): boolean {
    return this.find(prefix) !== null;
  }
}
```

**Java:**
```java
class Trie {
  private final Map<Character, Trie> children = new HashMap<>();
  private boolean end = false;

  void insert(String word) {
    Trie node = this;
    for (char c : word.toCharArray())
      node = node.children.computeIfAbsent(c, k -> new Trie());
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

  boolean search(String word) {
    Trie node = find(word);
    return node != null && node.end;
  }

  boolean startsWith(String prefix) {
    return find(prefix) != null;
  }
}
```

**Key points:**
- Each operation walks L nodes, so O(L) time; space is O(total inserted characters).
- The end-of-word flag distinguishes a stored word from a mere prefix.

**Tags:** #algorithm

---

### 15. Diameter of Binary Tree

**Difficulty:** Easy
**Topics:** tree, dfs, recursion
**Position:** OD / SWE
**Years:** 13-14 (Junior)

**Question:** Given the root of a binary tree, return the length of its diameter: the number of edges on the longest path between any two nodes (the path may or may not pass through the root).

**Approach:** Post-order DFS returns each node's height while updating a global best. At each node the longest path through it is `leftHeight + rightHeight` (in edges); the returned height is `1 + max(left, right)`. One traversal, so time O(n) and space O(h).

**Python:**
```python
class TreeNode:
    def __init__(self, val: int = 0, left=None, right=None) -> None:
        self.val, self.left, self.right = val, left, right

def diameter_of_binary_tree(root: TreeNode | None) -> int:
    best = 0
    def height(node: TreeNode | None) -> int:
        nonlocal best
        if not node:
            return 0
        l, r = height(node.left), height(node.right)
        best = max(best, l + r)
        return 1 + max(l, r)
    height(root)
    return best
```

**TypeScript:**
```typescript
class TreeNode {
  val: number; left: TreeNode | null; right: TreeNode | null;
  constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val; this.left = left; this.right = right;
  }
}

function diameterOfBinaryTree(root: TreeNode | null): number {
  let best = 0;
  const height = (node: TreeNode | null): number => {
    if (!node) return 0;
    const l = height(node.left), r = height(node.right);
    best = Math.max(best, l + r);
    return 1 + Math.max(l, r);
  };
  height(root);
  return best;
}
```

**Java:**
```java
class TreeNode {
  int val; TreeNode left, right;
  TreeNode(int val) { this.val = val; }
}

int best = 0;
int diameterOfBinaryTree(TreeNode root) {
  height(root);
  return best;
}

int height(TreeNode node) {
  if (node == null) return 0;
  int l = height(node.left), r = height(node.right);
  best = Math.max(best, l + r);
  return 1 + Math.max(l, r);
}
```

**Key points:**
- The diameter counts edges, so combine child heights as `l + r`, not `l + r + 1`.
- A single post-order pass computes heights and the answer together: O(n) time, O(h) stack.

**Tags:** #algorithm

---

### 16. Binary Tree Right Side View

**Difficulty:** Medium
**Topics:** tree, bfs, dfs
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Given the root of a binary tree, return the values of the nodes you can see ordered from top to bottom when standing on the right side of the tree.

**Approach:** BFS level by level and take the last node of each level; that node is the rightmost visible one. Alternatively, DFS visiting right before left and recording the first node seen at each depth. Time O(n), space O(n) for the queue in the worst level (or O(h) for DFS).

**Python:**
```python
from collections import deque

class TreeNode:
    def __init__(self, val: int = 0, left=None, right=None) -> None:
        self.val, self.left, self.right = val, left, right

def right_side_view(root: TreeNode | None) -> list[int]:
    if not root:
        return []
    view, q = [], deque([root])
    while q:
        n = len(q)
        for i in range(n):
            node = q.popleft()
            if i == n - 1:
                view.append(node.val)
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
    return view
```

**TypeScript:**
```typescript
class TreeNode {
  val: number; left: TreeNode | null; right: TreeNode | null;
  constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val; this.left = left; this.right = right;
  }
}

function rightSideView(root: TreeNode | null): number[] {
  if (!root) return [];
  const view: number[] = [];
  let level: TreeNode[] = [root];
  while (level.length) {
    view.push(level[level.length - 1].val);
    const next: TreeNode[] = [];
    for (const node of level) {
      if (node.left) next.push(node.left);
      if (node.right) next.push(node.right);
    }
    level = next;
  }
  return view;
}
```

**Java:**
```java
import java.util.*;

class TreeNode {
  int val; TreeNode left, right;
  TreeNode(int val) { this.val = val; }
}

List<Integer> rightSideView(TreeNode root) {
  List<Integer> view = new ArrayList<>();
  if (root == null) return view;
  Queue<TreeNode> q = new LinkedList<>();
  q.offer(root);
  while (!q.isEmpty()) {
    int n = q.size();
    for (int i = 0; i < n; i++) {
      TreeNode node = q.poll();
      if (i == n - 1) view.add(node.val);
      if (node.left != null) q.offer(node.left);
      if (node.right != null) q.offer(node.right);
    }
  }
  return view;
}
```

**Key points:**
- The rightmost visible node per level is the last dequeued in BFS, not necessarily a right child.
- DFS (right subtree first) with a depth-indexed result gives the same answer in O(h) extra space.

**Tags:** #algorithm

---

### 17. Kth Smallest Element in a BST

**Difficulty:** Medium
**Topics:** tree, bst, dfs
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Given the root of a binary search tree and an integer k, return the k-th smallest value (1-indexed) among all node values.

**Approach:** An in-order traversal of a BST visits values in ascending order, so stop at the k-th one. An iterative in-order walk with an explicit stack lets us exit early. Time O(h + k), space O(h).

**Python:**
```python
class TreeNode:
    def __init__(self, val: int = 0, left=None, right=None) -> None:
        self.val, self.left, self.right = val, left, right

def kth_smallest(root: TreeNode | None, k: int) -> int:
    stack, node = [], root
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
class TreeNode {
  val: number; left: TreeNode | null; right: TreeNode | null;
  constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val; this.left = left; this.right = right;
  }
}

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
import java.util.*;

class TreeNode {
  int val; TreeNode left, right;
  TreeNode(int val) { this.val = val; }
}

int kthSmallest(TreeNode root, int k) {
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
```

**Key points:**
- In-order traversal of a BST yields sorted values, so the k-th popped node is the answer.
- The iterative stack stops as soon as k reaches zero: O(h + k) time, O(h) space.

**Tags:** #algorithm

---

### 18. Serialize and Deserialize Binary Tree

**Difficulty:** Hard
**Topics:** tree, dfs, design
**Position:** OD / SWE
**Years:** 17-18 (Expert)

**Question:** Design an algorithm to serialize a binary tree to a string and deserialize that string back to the original tree structure. Values may repeat and nodes may be null.

**Approach:** Pre-order DFS emits each value and a sentinel for null children, giving a comma-separated string. Deserialization consumes tokens in the same pre-order, rebuilding root then left then right subtree. Both directions are O(n) time and O(n) space, matching the kind of tree-to-wire encoding used when persisting configuration trees on network devices.

**Python:**
```python
class TreeNode:
    def __init__(self, val: int = 0, left=None, right=None) -> None:
        self.val, self.left, self.right = val, left, right

def serialize(root: TreeNode | None) -> str:
    out: list[str] = []
    def dfs(node: TreeNode | None) -> None:
        if not node:
            out.append("#")
            return
        out.append(str(node.val))
        dfs(node.left)
        dfs(node.right)
    dfs(root)
    return ",".join(out)

def deserialize(data: str) -> TreeNode | None:
    it = iter(data.split(","))
    def build() -> TreeNode | None:
        v = next(it)
        if v == "#":
            return None
        node = TreeNode(int(v))
        node.left = build()
        node.right = build()
        return node
    return build()
```

**TypeScript:**
```typescript
class TreeNode {
  val: number; left: TreeNode | null; right: TreeNode | null;
  constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val; this.left = left; this.right = right;
  }
}

function serialize(root: TreeNode | null): string {
  const out: string[] = [];
  const dfs = (node: TreeNode | null): void => {
    if (!node) { out.push("#"); return; }
    out.push(String(node.val));
    dfs(node.left);
    dfs(node.right);
  };
  dfs(root);
  return out.join(",");
}

function deserialize(data: string): TreeNode | null {
  const tokens = data.split(",");
  let i = 0;
  const build = (): TreeNode | null => {
    const v = tokens[i++];
    if (v === "#") return null;
    const node = new TreeNode(Number(v));
    node.left = build();
    node.right = build();
    return node;
  };
  return build();
}
```

**Java:**
```java
import java.util.*;

class TreeNode {
  int val; TreeNode left, right;
  TreeNode(int val) { this.val = val; }
}

String serialize(TreeNode root) {
  StringBuilder sb = new StringBuilder();
  dfsSer(root, sb);
  return sb.toString();
}

void dfsSer(TreeNode node, StringBuilder sb) {
  if (node == null) { sb.append("#,"); return; }
  sb.append(node.val).append(",");
  dfsSer(node.left, sb);
  dfsSer(node.right, sb);
}

TreeNode deserialize(String data) {
  Deque<String> tokens = new ArrayDeque<>(Arrays.asList(data.split(",")));
  return build(tokens);
}

TreeNode build(Deque<String> tokens) {
  String v = tokens.poll();
  if (v == null || v.equals("#")) return null;
  TreeNode node = new TreeNode(Integer.parseInt(v));
  node.left = build(tokens);
  node.right = build(tokens);
  return node;
}
```

**Key points:**
- A null sentinel makes structure unambiguous, so pre-order alone reconstructs the tree.
- Serialize and deserialize must agree on traversal order and consume tokens in that same order.

**Tags:** #algorithm

---

## Graph

### 19. Number of Islands

**Difficulty:** Medium
**Topics:** graph, dfs, bfs, grid, union-find
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Count connected groups of `'1'` (land) in a 2D grid of `'1'`/`'0'`.

**Approach:** Scan the grid; on each unvisited land cell, flood-fill (DFS/BFS) its whole island and increment the count, sinking visited land to `'0'`. Time O(rows·cols), space O(rows·cols) worst case.

**Python:**
```python
def num_islands(grid: list[list[str]]) -> int:
    if not grid:
        return 0
    rows, cols = len(grid), len(grid[0])

    def sink(r, c):
        if 0 <= r < rows and 0 <= c < cols and grid[r][c] == "1":
            grid[r][c] = "0"
            sink(r + 1, c); sink(r - 1, c); sink(r, c + 1); sink(r, c - 1)

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
  const rows = grid.length, cols = grid[0]?.length ?? 0;
  const sink = (r: number, c: number): void => {
    if (r < 0 || c < 0 || r >= rows || c >= cols || grid[r][c] !== "1") return;
    grid[r][c] = "0";
    sink(r + 1, c); sink(r - 1, c); sink(r, c + 1); sink(r, c - 1);
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
int numIslands(char[][] grid) {
  int rows = grid.length, cols = grid[0].length, count = 0;
  for (int r = 0; r < rows; r++)
    for (int c = 0; c < cols; c++)
      if (grid[r][c] == '1') { count++; sink(grid, r, c); }
  return count;
}

void sink(char[][] g, int r, int c) {
  if (r < 0 || c < 0 || r >= g.length || c >= g[0].length || g[r][c] != '1') return;
  g[r][c] = '0';
  sink(g, r + 1, c); sink(g, r - 1, c); sink(g, r, c + 1); sink(g, r, c - 1);
}
```

**Key points:**
- Each cell is visited a constant number of times: O(rows·cols) time.
- Recursion depth (or queue) can reach O(rows·cols) for one giant island.

**Tags:** #algorithm

---

### 20. Rotting Oranges

**Difficulty:** Medium
**Topics:** graph, bfs, grid
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** In a grid of empty/fresh/rotten oranges, each minute rotten oranges rot their 4-neighbors. Return minutes until none are fresh, or -1 if impossible.

**Approach:** Multi-source BFS starting from all rotten oranges simultaneously; count levels (minutes). If fresh oranges remain after BFS, return -1. Time O(rows·cols), space O(rows·cols).

**Python:**
```python
from collections import deque

def oranges_rotting(grid: list[list[int]]) -> int:
    rows, cols = len(grid), len(grid[0])
    q = deque()
    fresh = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 2:
                q.append((r, c))
            elif grid[r][c] == 1:
                fresh += 1
    minutes = 0
    while q and fresh:
        minutes += 1
        for _ in range(len(q)):
            r, c = q.popleft()
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1:
                    grid[nr][nc] = 2
                    fresh -= 1
                    q.append((nr, nc))
    return minutes if fresh == 0 else -1
```

**TypeScript:**
```typescript
function orangesRotting(grid: number[][]): number {
  const rows = grid.length, cols = grid[0].length;
  let q: [number, number][] = [], fresh = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 2) q.push([r, c]);
      else if (grid[r][c] === 1) fresh++;
    }
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let minutes = 0;
  while (q.length && fresh) {
    minutes++;
    const next: [number, number][] = [];
    for (const [r, c] of q)
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nc >= 0 && nr < rows && nc < cols && grid[nr][nc] === 1) {
          grid[nr][nc] = 2; fresh--; next.push([nr, nc]);
        }
      }
    q = next;
  }
  return fresh === 0 ? minutes : -1;
}
```

**Java:**
```java
int orangesRotting(int[][] grid) {
  int rows = grid.length, cols = grid[0].length, fresh = 0;
  Queue<int[]> q = new LinkedList<>();
  for (int r = 0; r < rows; r++)
    for (int c = 0; c < cols; c++) {
      if (grid[r][c] == 2) q.add(new int[] { r, c });
      else if (grid[r][c] == 1) fresh++;
    }
  int[][] dirs = { { 1, 0 }, { -1, 0 }, { 0, 1 }, { 0, -1 } };
  int minutes = 0;
  while (!q.isEmpty() && fresh > 0) {
    minutes++;
    for (int i = q.size(); i > 0; i--) {
      int[] cell = q.poll();
      for (int[] d : dirs) {
        int nr = cell[0] + d[0], nc = cell[1] + d[1];
        if (nr >= 0 && nc >= 0 && nr < rows && nc < cols && grid[nr][nc] == 1) {
          grid[nr][nc] = 2; fresh--; q.add(new int[] { nr, nc });
        }
      }
    }
  }
  return fresh == 0 ? minutes : -1;
}
```

**Key points:**
- Multi-source BFS processes each cell once: O(rows·cols) time and space.
- Counting fresh oranges lets you detect the unreachable case in O(1).

**Tags:** #algorithm

---

### 21. Course Schedule

**Difficulty:** Medium
**Topics:** graph, topological-sort, bfs
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Given `numCourses` and prerequisite pairs, decide whether all courses can be finished (i.e. the dependency graph is acyclic).

**Approach:** Kahn's algorithm — compute in-degrees, repeatedly remove zero in-degree nodes; if all nodes are removed there is no cycle. Time O(V + E), space O(V + E).

**Python:**
```python
from collections import deque

def can_finish(num_courses: int, prerequisites: list[list[int]]) -> bool:
    graph = [[] for _ in range(num_courses)]
    indeg = [0] * num_courses
    for course, pre in prerequisites:
        graph[pre].append(course)
        indeg[course] += 1
    q = deque(i for i in range(num_courses) if indeg[i] == 0)
    seen = 0
    while q:
        node = q.popleft()
        seen += 1
        for nxt in graph[node]:
            indeg[nxt] -= 1
            if indeg[nxt] == 0:
                q.append(nxt)
    return seen == num_courses
```

**TypeScript:**
```typescript
function canFinish(numCourses: number, prerequisites: number[][]): boolean {
  const graph: number[][] = Array.from({ length: numCourses }, () => []);
  const indeg = new Array(numCourses).fill(0);
  for (const [course, pre] of prerequisites) { graph[pre].push(course); indeg[course]++; }
  const q: number[] = [];
  for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) q.push(i);
  let seen = 0;
  while (q.length) {
    const node = q.shift()!;
    seen++;
    for (const nxt of graph[node]) if (--indeg[nxt] === 0) q.push(nxt);
  }
  return seen === numCourses;
}
```

**Java:**
```java
boolean canFinish(int numCourses, int[][] prerequisites) {
  List<List<Integer>> graph = new ArrayList<>();
  for (int i = 0; i < numCourses; i++) graph.add(new ArrayList<>());
  int[] indeg = new int[numCourses];
  for (int[] p : prerequisites) { graph.get(p[1]).add(p[0]); indeg[p[0]]++; }
  Queue<Integer> q = new LinkedList<>();
  for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) q.add(i);
  int seen = 0;
  while (!q.isEmpty()) {
    int node = q.poll();
    seen++;
    for (int nxt : graph.get(node)) if (--indeg[nxt] == 0) q.add(nxt);
  }
  return seen == numCourses;
}
```

**Key points:**
- Kahn's topological sort runs in O(V + E) time and space.
- If fewer than `numCourses` nodes are processed, a cycle exists.

**Tags:** #algorithm

---

### 22. Number of Provinces (Union-Find)

**Difficulty:** Medium
**Topics:** union-find, graph, dsu
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Given an `n x n` adjacency matrix where `isConnected[i][j] == 1` means cities i and j are directly connected, return the number of connected provinces.

**Approach:** Union-Find with path compression and union by rank; union every connected pair, then count distinct roots. Near-linear time O(n^2·α(n)), space O(n).

**Python:**
```python
def find_circle_num(is_connected: list[list[int]]) -> int:
    n = len(is_connected)
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a, b):
        parent[find(a)] = find(b)

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
  const union = (a: number, b: number): void => { parent[find(a)] = find(b); };
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      if (isConnected[i][j]) union(i, j);
  let count = 0;
  for (let i = 0; i < n; i++) if (find(i) === i) count++;
  return count;
}
```

**Java:**
```java
int findCircleNum(int[][] isConnected) {
  int n = isConnected.length;
  int[] parent = new int[n];
  for (int i = 0; i < n; i++) parent[i] = i;
  for (int i = 0; i < n; i++)
    for (int j = i + 1; j < n; j++)
      if (isConnected[i][j] == 1) parent[find(parent, i)] = find(parent, j);
  int count = 0;
  for (int i = 0; i < n; i++) if (find(parent, i) == i) count++;
  return count;
}

int find(int[] parent, int x) {
  while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
  return x;
}
```

**Key points:**
- Path compression makes each op nearly O(1) amortized (α(n)); total O(n^2·α(n)).
- Counting roots after all unions gives the province count in O(n).

**Tags:** #algorithm

---

### 23. Packet Routing Shortest Path (Dijkstra)

**Difficulty:** Medium
**Topics:** graph, dijkstra, heap, shortest-path
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** A network of `n` routers has links with positive latencies. Find the minimum total latency to route a packet from a source router to every other router; report unreachable routers as infinity.

**Approach:** Single-source shortest path with Dijkstra and a min-heap. Build an adjacency list, relax neighbors, skip stale heap entries. Time O((V + E) log V), space O(V + E).

**Python:**
```python
import heapq

def shortest_latencies(n: int, links: list[tuple[int, int, int]], src: int) -> list[float]:
    graph: list[list[tuple[int, int]]] = [[] for _ in range(n)]
    for u, v, w in links:
        graph[u].append((v, w))
        graph[v].append((u, w))
    dist = [float("inf")] * n
    dist[src] = 0
    heap = [(0, src)]
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]:
            continue
        for v, w in graph[u]:
            if d + w < dist[v]:
                dist[v] = d + w
                heapq.heappush(heap, (dist[v], v))
    return dist
```

**TypeScript:**
```typescript
function shortestLatencies(n: number, links: [number, number, number][], src: number): number[] {
  const graph: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of links) { graph[u].push([v, w]); graph[v].push([u, w]); }
  const dist = new Array(n).fill(Infinity);
  dist[src] = 0;
  // Simple array-based priority queue (fine for interview clarity).
  const heap: [number, number][] = [[0, src]];
  while (heap.length) {
    heap.sort((a, b) => a[0] - b[0]);
    const [d, u] = heap.shift()!;
    if (d > dist[u]) continue;
    for (const [v, w] of graph[u])
      if (d + w < dist[v]) { dist[v] = d + w; heap.push([dist[v], v]); }
  }
  return dist;
}
```

**Java:**
```java
int[] shortestLatencies(int n, int[][] links, int src) {
  List<int[]>[] graph = new List[n];
  for (int i = 0; i < n; i++) graph[i] = new ArrayList<>();
  for (int[] l : links) { graph[l[0]].add(new int[] { l[1], l[2] }); graph[l[1]].add(new int[] { l[0], l[2] }); }
  int[] dist = new int[n];
  Arrays.fill(dist, Integer.MAX_VALUE);
  dist[src] = 0;
  PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
  pq.add(new int[] { 0, src });
  while (!pq.isEmpty()) {
    int[] top = pq.poll();
    int d = top[0], u = top[1];
    if (d > dist[u]) continue;
    for (int[] e : graph[u])
      if (d + e[1] < dist[e[0]]) { dist[e[0]] = d + e[1]; pq.add(new int[] { dist[e[0]], e[0] }); }
  }
  return dist;
}
```

**Key points:**
- Dijkstra with a binary heap is O((V + E) log V) time, O(V + E) space.
- Positive weights are required; negative latencies would need Bellman-Ford.

**Tags:** #algorithm

---

### 24. Clone Graph

**Difficulty:** Medium
**Topics:** graph, dfs, hash-table, recursion
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Given a reference to a node in a connected undirected graph, return a deep copy (clone) of the graph. Each node holds a value and a list of neighbors.

**Approach:** DFS while memoizing original-to-clone in a hash map, so each node is cloned once and shared cycles are handled. Mirrors deep-copying a live network-topology graph in Huawei device management. Time O(V + E), space O(V).

**Python:**
```python
class Node:
    def __init__(self, val: int = 0, neighbors: list["Node"] | None = None):
        self.val = val
        self.neighbors = neighbors or []

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
class GNode {
  val: number;
  neighbors: GNode[];
  constructor(val = 0, neighbors: GNode[] = []) {
    this.val = val;
    this.neighbors = neighbors;
  }
}

function cloneGraph(node: GNode | null): GNode | null {
  if (node === null) return null;
  const clones = new Map<GNode, GNode>();
  const dfs = (cur: GNode): GNode => {
    const existing = clones.get(cur);
    if (existing) return existing;
    const copy = new GNode(cur.val);
    clones.set(cur, copy);
    for (const nb of cur.neighbors) copy.neighbors.push(dfs(nb));
    return copy;
  };
  return dfs(node);
}
```

**Java:**
```java
class Node {
  int val;
  List<Node> neighbors;
  Node(int val) { this.val = val; this.neighbors = new ArrayList<>(); }
}

Node cloneGraph(Node node) {
  if (node == null) return null;
  return dfs(node, new HashMap<>());
}

Node dfs(Node cur, Map<Node, Node> clones) {
  if (clones.containsKey(cur)) return clones.get(cur);
  Node copy = new Node(cur.val);
  clones.put(cur, copy);
  for (Node nb : cur.neighbors) copy.neighbors.add(dfs(nb, clones));
  return copy;
}
```

**Key points:**
- The hash map is what breaks cycles: register the clone before recursing into neighbors.
- BFS with a queue is an equally valid iteration order; both are O(V + E).

**Tags:** #algorithm

---

### 25. Cheapest Route Within K Hops (Cheapest Flights Within K Stops)

**Difficulty:** Medium
**Topics:** graph, bellman-ford, shortest-path, dynamic-programming
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** A network has `n` nodes and directed links `[u, v, w]` with cost `w`. Find the cheapest cost to route from `src` to `dst` using at most `k` intermediate hops; return `-1` if unreachable within the limit.

**Approach:** Bellman-Ford relaxed exactly `k + 1` times. Snapshot distances each round so relaxations from the current round do not leak into the same round, which enforces the hop cap. Fits telecom routing where a packet may cross only a bounded number of relays. Time O(k * E), space O(V).

**Python:**
```python
def cheapest_route(n: int, flights: list[tuple[int, int, int]], src: int, dst: int, k: int) -> int:
    dist = [float("inf")] * n
    dist[src] = 0
    for _ in range(k + 1):
        tmp = dist[:]
        for u, v, w in flights:
            if dist[u] + w < tmp[v]:
                tmp[v] = dist[u] + w
        dist = tmp
    return -1 if dist[dst] == float("inf") else dist[dst]
```

**TypeScript:**
```typescript
function cheapestRoute(n: number, flights: [number, number, number][], src: number, dst: number, k: number): number {
  let dist = new Array(n).fill(Infinity);
  dist[src] = 0;
  for (let i = 0; i <= k; i++) {
    const tmp = dist.slice();
    for (const [u, v, w] of flights)
      if (dist[u] + w < tmp[v]) tmp[v] = dist[u] + w;
    dist = tmp;
  }
  return dist[dst] === Infinity ? -1 : dist[dst];
}
```

**Java:**
```java
int cheapestRoute(int n, int[][] flights, int src, int dst, int k) {
  int[] dist = new int[n];
  Arrays.fill(dist, Integer.MAX_VALUE);
  dist[src] = 0;
  for (int i = 0; i <= k; i++) {
    int[] tmp = dist.clone();
    for (int[] f : flights)
      if (dist[f[0]] != Integer.MAX_VALUE && dist[f[0]] + f[2] < tmp[f[1]])
        tmp[f[1]] = dist[f[0]] + f[2];
    dist = tmp;
  }
  return dist[dst] == Integer.MAX_VALUE ? -1 : dist[dst];
}
```

**Key points:**
- Copying `dist` each round is essential; relaxing in place would allow more than `k` hops.
- Plain Dijkstra fails here because the cheapest path may use more hops than allowed.

**Tags:** #algorithm

---

### 26. Min Cost to Connect All Points

**Difficulty:** Medium
**Topics:** graph, minimum-spanning-tree, union-find, greedy
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Given `points` on a 2D plane, the cost to connect two points is their Manhattan distance. Return the minimum total cost to connect all points so that every pair is reachable.

**Approach:** This is a minimum spanning tree. Build all candidate edges, sort by cost, and use Kruskal with union-find to add the cheapest edge that joins two disjoint components until `n - 1` edges are used. Mirrors laying out a minimum-cost network backbone across Huawei sites. Time O(n^2 log n), space O(n^2).

**Python:**
```python
def min_cost_connect(points: list[list[int]]) -> int:
    n = len(points)
    parent = list(range(n))
    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    edges = []
    for i in range(n):
        for j in range(i + 1, n):
            cost = abs(points[i][0] - points[j][0]) + abs(points[i][1] - points[j][1])
            edges.append((cost, i, j))
    edges.sort()
    total = used = 0
    for cost, i, j in edges:
        ri, rj = find(i), find(j)
        if ri != rj:
            parent[ri] = rj
            total += cost
            used += 1
            if used == n - 1:
                break
    return total
```

**TypeScript:**
```typescript
function minCostConnect(points: number[][]): number {
  const n = points.length;
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  };
  const edges: [number, number, number][] = [];
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      edges.push([Math.abs(points[i][0] - points[j][0]) + Math.abs(points[i][1] - points[j][1]), i, j]);
  edges.sort((a, b) => a[0] - b[0]);
  let total = 0, used = 0;
  for (const [cost, i, j] of edges) {
    const ri = find(i), rj = find(j);
    if (ri !== rj) {
      parent[ri] = rj;
      total += cost;
      if (++used === n - 1) break;
    }
  }
  return total;
}
```

**Java:**
```java
int[] parent;

int find(int x) {
  while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
  return x;
}

int minCostConnect(int[][] points) {
  int n = points.length;
  parent = new int[n];
  for (int i = 0; i < n; i++) parent[i] = i;
  List<int[]> edges = new ArrayList<>();
  for (int i = 0; i < n; i++)
    for (int j = i + 1; j < n; j++) {
      int cost = Math.abs(points[i][0] - points[j][0]) + Math.abs(points[i][1] - points[j][1]);
      edges.add(new int[] { cost, i, j });
    }
  edges.sort((a, b) -> a[0] - b[0]);
  int total = 0, used = 0;
  for (int[] e : edges) {
    int ri = find(e[1]), rj = find(e[2]);
    if (ri != rj) {
      parent[ri] = rj;
      total += e[0];
      if (++used == n - 1) break;
    }
  }
  return total;
}
```

**Key points:**
- Union-find path compression keeps each find near O(1) amortized; sorting dominates the cost.
- Prim with a heap is an alternative and is preferable on dense graphs, running in O(n^2).

**Tags:** #algorithm

---

## Heap / Priority Queue

### 27. Top K Frequent Elements

**Difficulty:** Medium
**Topics:** heap, hash-table, bucket-sort
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Return the k most frequent elements in an array.

**Approach:** Count frequencies, then bucket-sort by frequency (index = count) and read buckets from the top. Time O(n), space O(n). A heap variant gives O(n log k).

**Python:**
```python
from collections import Counter

def top_k_frequent(nums: list[int], k: int) -> list[int]:
    counts = Counter(nums)
    buckets: list[list[int]] = [[] for _ in range(len(nums) + 1)]
    for val, freq in counts.items():
        buckets[freq].append(val)
    res: list[int] = []
    for freq in range(len(buckets) - 1, 0, -1):
        for val in buckets[freq]:
            res.append(val)
            if len(res) == k:
                return res
    return res
```

**TypeScript:**
```typescript
function topKFrequent(nums: number[], k: number): number[] {
  const counts = new Map<number, number>();
  for (const x of nums) counts.set(x, (counts.get(x) ?? 0) + 1);
  const buckets: number[][] = Array.from({ length: nums.length + 1 }, () => []);
  for (const [val, freq] of counts) buckets[freq].push(val);
  const res: number[] = [];
  for (let f = buckets.length - 1; f > 0 && res.length < k; f--)
    for (const val of buckets[f]) { res.push(val); if (res.length === k) return res; }
  return res;
}
```

**Java:**
```java
int[] topKFrequent(int[] nums, int k) {
  Map<Integer, Integer> counts = new HashMap<>();
  for (int x : nums) counts.merge(x, 1, Integer::sum);
  List<Integer>[] buckets = new List[nums.length + 1];
  for (var e : counts.entrySet()) {
    int f = e.getValue();
    if (buckets[f] == null) buckets[f] = new ArrayList<>();
    buckets[f].add(e.getKey());
  }
  int[] res = new int[k];
  int idx = 0;
  for (int f = buckets.length - 1; f > 0 && idx < k; f--)
    if (buckets[f] != null)
      for (int val : buckets[f]) { if (idx == k) break; res[idx++] = val; }
  return res;
}
```

**Key points:**
- Bucket sort by frequency achieves O(n) time, O(n) space.
- A size-k min-heap is the alternative at O(n log k) time.

**Tags:** #algorithm

---

### 28. Kth Largest Element in an Array

**Difficulty:** Medium
**Topics:** heap, quickselect, sorting
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Return the kth largest element in an unsorted array.

**Approach:** Maintain a size-k min-heap; the root is the answer after processing all elements. Time O(n log k), space O(k). Quickselect gives O(n) average.

**Python:**
```python
import heapq

def find_kth_largest(nums: list[int], k: int) -> int:
    heap = nums[:k]
    heapq.heapify(heap)
    for x in nums[k:]:
        if x > heap[0]:
            heapq.heapreplace(heap, x)
    return heap[0]
```

**TypeScript:**
```typescript
function findKthLargest(nums: number[], k: number): number {
  // O(n log n) sort fallback when no heap library is available.
  return nums.slice().sort((a, b) => b - a)[k - 1];
}
```

**Java:**
```java
int findKthLargest(int[] nums, int k) {
  PriorityQueue<Integer> heap = new PriorityQueue<>();
  for (int x : nums) {
    heap.add(x);
    if (heap.size() > k) heap.poll();
  }
  return heap.peek();
}
```

**Key points:**
- A size-k min-heap is O(n log k) time, O(k) space.
- Quickselect averages O(n) but degrades to O(n^2) on bad pivots.

**Tags:** #algorithm

---

### 29. Telecom Signal Task Scheduling (Greedy + Heap)

**Difficulty:** Medium
**Topics:** heap, greedy, intervals
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** A scheduler must run signal-processing tasks, each with a `[start, end]` window. Two tasks cannot run on the same processing unit if their windows overlap. Find the minimum number of processing units needed to run all tasks.

**Approach:** Equivalent to "meeting rooms II". Sort tasks by start; use a min-heap of end times. For each task, free a unit whose end ≤ current start, then assign; the peak heap size is the answer. Time O(n log n), space O(n).

**Python:**
```python
import heapq

def min_units(tasks: list[list[int]]) -> int:
    tasks.sort()
    ends: list[int] = []
    for start, end in tasks:
        if ends and ends[0] <= start:
            heapq.heapreplace(ends, end)
        else:
            heapq.heappush(ends, end)
    return len(ends)
```

**TypeScript:**
```typescript
function minUnits(tasks: number[][]): number {
  tasks.sort((a, b) => a[0] - b[0]);
  const ends: number[] = []; // min-heap emulated; kept sorted for clarity
  for (const [start, end] of tasks) {
    ends.sort((a, b) => a - b);
    if (ends.length && ends[0] <= start) ends[0] = end;
    else ends.push(end);
  }
  return ends.length;
}
```

**Java:**
```java
int minUnits(int[][] tasks) {
  Arrays.sort(tasks, (a, b) -> a[0] - b[0]);
  PriorityQueue<Integer> ends = new PriorityQueue<>();
  for (int[] t : tasks) {
    if (!ends.isEmpty() && ends.peek() <= t[0]) ends.poll();
    ends.add(t[1]);
  }
  return ends.size();
}
```

**Key points:**
- Sorting plus heap operations give O(n log n) time, O(n) space.
- The min-heap's peak size equals the maximum simultaneous overlap = units needed.

**Tags:** #algorithm

---

### 30. Find Median from Data Stream

**Difficulty:** Hard
**Topics:** heap, design, two-heaps
**Position:** OD / SWE
**Years:** 17-18 (Expert)

**Question:** Design a data structure that supports adding integers from a stream and returning the median of all elements at any time.

**Approach:** Keep two heaps: a max-heap `small` for the lower half and a min-heap `large` for the upper half. On insert, push then hand one element across, then rebalance so `small` has at most one more element than `large`. The median follows from the heap sizes. Insert O(log n), query O(1). Real-time percentiles over Huawei Cloud metrics and 5G network telemetry use the same idea.

**Python:**
```python
import heapq

class MedianFinder:
    def __init__(self) -> None:
        self.small: list[int] = []  # max-heap (negated)
        self.large: list[int] = []  # min-heap

    def add_num(self, num: int) -> None:
        heapq.heappush(self.small, -num)
        heapq.heappush(self.large, -heapq.heappop(self.small))
        if len(self.large) > len(self.small):
            heapq.heappush(self.small, -heapq.heappop(self.large))

    def find_median(self) -> float:
        if len(self.small) > len(self.large):
            return -self.small[0]
        return (-self.small[0] + self.large[0]) / 2
```

**TypeScript:**
```typescript
class MedianFinder {
  private nums: number[] = []; // no built-in heap: sorted array + binary insert

  addNum(num: number): void {
    let lo = 0, hi = this.nums.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.nums[mid] < num) lo = mid + 1; else hi = mid;
    }
    this.nums.splice(lo, 0, num);
  }

  findMedian(): number {
    const n = this.nums.length, m = n >> 1;
    return n % 2 ? this.nums[m] : (this.nums[m - 1] + this.nums[m]) / 2;
  }
}
```

**Java:**
```java
class MedianFinder {
  private final PriorityQueue<Integer> small = new PriorityQueue<>(Collections.reverseOrder());
  private final PriorityQueue<Integer> large = new PriorityQueue<>();

  public void addNum(int num) {
    small.add(num);
    large.add(small.poll());
    if (large.size() > small.size()) small.add(large.poll());
  }

  public double findMedian() {
    if (small.size() > large.size()) return small.peek();
    return (small.peek() + large.peek()) / 2.0;
  }
}
```

**Key points:**
- Two balanced heaps give O(log n) insert and O(1) median.
- Invariant: `small` holds the same count as `large` or exactly one more.
- Without a heap library, a sorted array with binary insert works but insert degrades to O(n).

**Tags:** #algorithm

---

### 31. K Closest Points to Origin

**Difficulty:** Medium
**Topics:** heap, sorting, geometry
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Given a list of points on a plane, return the K points closest to the origin (Euclidean distance).

**Approach:** Keep a size-K max-heap keyed by squared distance (no need for a square root). Scan all points; push while the heap is not full, otherwise replace the top when the current point is closer. Time O(n log k), space O(k). Base-station siting and nearest-access selection for IoT devices run the same Top-K-nearest query.

**Python:**
```python
import heapq

def k_closest(points: list[list[int]], k: int) -> list[list[int]]:
    heap: list[tuple[int, list[int]]] = []
    for x, y in points:
        d = -(x * x + y * y)  # negate to emulate a max-heap
        if len(heap) < k:
            heapq.heappush(heap, (d, [x, y]))
        elif d > heap[0][0]:
            heapq.heapreplace(heap, (d, [x, y]))
    return [p for _, p in heap]
```

**TypeScript:**
```typescript
function kClosest(points: number[][], k: number): number[][] {
  // O(n log n) sort fallback when no heap library is available
  return points
    .slice()
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
    heap.add(p);
    if (heap.size() > k) heap.poll();
  }
  return heap.toArray(new int[0][]);
}
```

**Key points:**
- Compare squared distances to avoid the cost and precision loss of `sqrt`.
- A size-K max-heap gives O(n log k), better than a full O(n log n) sort.
- Quickselect achieves O(n) on average.

**Tags:** #algorithm

---

## Stack / Queue

### 32. Valid Parentheses

**Difficulty:** Easy
**Topics:** string, stack
**Position:** OD / SWE
**Years:** 13-14 (Junior)

**Question:** Given a string of `()[]{}`, determine if the brackets are validly matched and nested.

**Approach:** Push opening brackets onto a stack; on a closing bracket, pop and compare. Valid only if every close matches the top and the stack is empty at the end. Time O(n), space O(n).

**Python:**
```python
def is_valid(s: str) -> bool:
    pairs = {")": "(", "]": "[", "}": "{"}
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
boolean isValid(String s) {
  Map<Character, Character> pairs = Map.of(')', '(', ']', '[', '}', '{');
  Deque<Character> stack = new ArrayDeque<>();
  for (char c : s.toCharArray()) {
    if (pairs.containsKey(c)) {
      if (stack.isEmpty() || stack.pop() != pairs.get(c)) return false;
    } else {
      stack.push(c);
    }
  }
  return stack.isEmpty();
}
```

**Key points:**
- Stack models nesting; time and space are both O(n).
- Must check the stack is empty at the end, not just per-character.

**Follow-ups:**
- Return the minimum insertions to make the string valid.
- Longest valid parentheses substring (DP / stack of indices).
- Support arbitrary bracket types defined at runtime.
- Validate with a streaming input and bounded memory.

**Tags:** #algorithm

---

### 33. Min Stack

**Difficulty:** Easy
**Topics:** stack, design
**Position:** OD / SWE
**Years:** 13-14 (Junior)

**Question:** Design a stack that supports push, pop, top, and retrieving the minimum element in O(1) time.

**Approach:** Store `(value, min-so-far)` with every element. On push, take the smaller of the new value and the previous top's minimum; pop just removes the top. All operations O(1), space O(n). Stacks that carry aggregate info show up in parsers, undo stacks, and monitoring windows.

**Python:**
```python
class MinStack:
    def __init__(self) -> None:
        self.stack: list[tuple[int, int]] = []

    def push(self, val: int) -> None:
        cur_min = min(val, self.stack[-1][1]) if self.stack else val
        self.stack.append((val, cur_min))

    def pop(self) -> None:
        self.stack.pop()

    def top(self) -> int:
        return self.stack[-1][0]

    def get_min(self) -> int:
        return self.stack[-1][1]
```

**TypeScript:**
```typescript
class MinStack {
  private stack: [number, number][] = [];

  push(val: number): void {
    const min = this.stack.length
      ? Math.min(val, this.stack[this.stack.length - 1][1])
      : val;
    this.stack.push([val, min]);
  }
  pop(): void { this.stack.pop(); }
  top(): number { return this.stack[this.stack.length - 1][0]; }
  getMin(): number { return this.stack[this.stack.length - 1][1]; }
}
```

**Java:**
```java
class MinStack {
  private final Deque<int[]> stack = new ArrayDeque<>();

  public void push(int val) {
    int min = stack.isEmpty() ? val : Math.min(val, stack.peek()[1]);
    stack.push(new int[]{val, min});
  }
  public void pop() { stack.pop(); }
  public int top() { return stack.peek()[0]; }
  public int getMin() { return stack.peek()[1]; }
}
```

**Key points:**
- Each element carries its prefix minimum so getMin is O(1).
- A two-stack variant (data stack plus min stack) is equivalent.
- All operations are amortized O(1) with O(n) extra space.

**Tags:** #algorithm

---

### 34. Daily Temperatures

**Difficulty:** Medium
**Topics:** stack, monotonic-stack, array
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Given an array of daily temperatures, return an array where the i-th entry is the number of days you must wait after day i for a warmer temperature; 0 if there is none.

**Approach:** Keep a monotonically decreasing stack of indices. While the current temperature exceeds the temperature at the stack top, pop and fill the result with `current index - popped index`. Each index enters and leaves the stack once, so time O(n), space O(n). This is the canonical "next greater element" template, widely used for alarm debouncing and metric trend analysis.

**Python:**
```python
def daily_temperatures(temps: list[int]) -> list[int]:
    res = [0] * len(temps)
    stack: list[int] = []  # indices, decreasing temperatures
    for i, t in enumerate(temps):
        while stack and temps[stack[-1]] < t:
            j = stack.pop()
            res[j] = i - j
        stack.append(i)
    return res
```

**TypeScript:**
```typescript
function dailyTemperatures(temps: number[]): number[] {
  const res = new Array<number>(temps.length).fill(0);
  const stack: number[] = [];
  for (let i = 0; i < temps.length; i++) {
    while (stack.length && temps[stack[stack.length - 1]] < temps[i]) {
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
int[] dailyTemperatures(int[] temps) {
  int[] res = new int[temps.length];
  Deque<Integer> stack = new ArrayDeque<>();
  for (int i = 0; i < temps.length; i++) {
    while (!stack.isEmpty() && temps[stack.peek()] < temps[i]) {
      int j = stack.pop();
      res[j] = i - j;
    }
    stack.push(i);
  }
  return res;
}
```

**Key points:**
- The monotonic stack holds indices, not values, so distances are easy to compute.
- Each index is pushed and popped once, giving amortized O(n).
- This is a general template for next-greater-element problems.

**Tags:** #algorithm

---

## Hash Table

### 35. Two Sum

**Difficulty:** Easy
**Topics:** array, hash-table
**Position:** OD / SWE
**Years:** 13-14 (Junior)

**Question:** Given an integer array `nums` and a target, return the indices of the two numbers that add up to the target. Exactly one solution exists; you may not use the same element twice.

**Approach:** One-pass hash map from value → index. For each element check whether `target - x` was already seen; if so return both indices. Time O(n), space O(n) — a typical 机试 warm-up.

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
int[] twoSum(int[] nums, int target) {
  Map<Integer, Integer> seen = new HashMap<>();
  for (int i = 0; i < nums.length; i++) {
    int need = target - nums[i];
    if (seen.containsKey(need)) return new int[] { seen.get(need), i };
    seen.put(nums[i], i);
  }
  return new int[0];
}
```

**Key points:**
- Single pass with a hash map gives O(n) time and O(n) space versus the O(n^2) brute force.
- Store each value only after checking, so you never pair an element with itself.

**Follow-ups:**
- Return all unique pairs that sum to target (sort + two pointers).
- Input is sorted — solve in O(1) extra space with two pointers.
- 3Sum / 4Sum generalization.
- Stream of numbers — design an `add`/`find` online structure.

**Tags:** #algorithm

---

### 36. Valid Anagram

**Difficulty:** Easy
**Topics:** string, hash-table, counting
**Position:** OD / SWE
**Years:** 13-14 (Junior)

**Question:** Given two strings, return whether one is an anagram of the other.

**Approach:** Count character frequencies in the first string, decrement with the second, and verify all counts return to zero. Time O(n), space O(1) for a fixed alphabet.

**Python:**
```python
from collections import Counter

def is_anagram(s: str, t: str) -> bool:
    if len(s) != len(t):
        return False
    return Counter(s) == Counter(t)
```

**TypeScript:**
```typescript
function isAnagram(s: string, t: string): boolean {
  if (s.length !== t.length) return false;
  const count = new Map<string, number>();
  for (const c of s) count.set(c, (count.get(c) ?? 0) + 1);
  for (const c of t) {
    const n = (count.get(c) ?? 0) - 1;
    if (n < 0) return false;
    count.set(c, n);
  }
  return true;
}
```

**Java:**
```java
boolean isAnagram(String s, String t) {
  if (s.length() != t.length()) return false;
  int[] count = new int[26];
  for (int i = 0; i < s.length(); i++) {
    count[s.charAt(i) - 'a']++;
    count[t.charAt(i) - 'a']--;
  }
  for (int c : count) if (c != 0) return false;
  return true;
}
```

**Key points:**
- Frequency counting is O(n) time; a 26-slot array is O(1) space.
- Length mismatch is an instant reject.

**Follow-ups:**
- Support full Unicode instead of lowercase a–z.
- Group all anagrams together (see next question).
- Find all anagram start indices of `p` inside `s` (sliding window).
- Compare ignoring case and whitespace.

**Tags:** #algorithm

---

### 37. Group Anagrams

**Difficulty:** Medium
**Topics:** string, hash-table, sorting
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Group a list of words so that anagrams of each other land in the same group.

**Approach:** Use a canonical key per word — sorted letters, or a 26-count signature — and bucket words in a hash map by that key. Time O(n·k log k) with the sorted key (k = word length), space O(n·k).

**Python:**
```python
from collections import defaultdict

def group_anagrams(words: list[str]) -> list[list[str]]:
    groups: dict[str, list[str]] = defaultdict(list)
    for w in words:
        groups["".join(sorted(w))].append(w)
    return list(groups.values())
```

**TypeScript:**
```typescript
function groupAnagrams(words: string[]): string[][] {
  const groups = new Map<string, string[]>();
  for (const w of words) {
    const key = [...w].sort().join("");
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(w);
  }
  return [...groups.values()];
}
```

**Java:**
```java
List<List<String>> groupAnagrams(String[] words) {
  Map<String, List<String>> groups = new HashMap<>();
  for (String w : words) {
    char[] c = w.toCharArray();
    Arrays.sort(c);
    groups.computeIfAbsent(new String(c), k -> new ArrayList<>()).add(w);
  }
  return new ArrayList<>(groups.values());
}
```

**Key points:**
- Sorted-letter key costs O(k log k) per word, O(n·k log k) overall.
- A 26-count signature key lowers per-word cost to O(k), giving O(n·k).

**Follow-ups:**
- Use the count-signature key to drop the log factor.
- Stream words and emit groups incrementally.
- Group by anagram class ignoring case and spaces.
- Return groups sorted by size.

**Tags:** #algorithm

---

### 38. Longest Substring Without Repeating Characters

**Difficulty:** Medium
**Topics:** string, sliding-window, hash-table
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Find the length of the longest substring without repeating characters.

**Approach:** Sliding window with a map from char → last index. When a repeat falls inside the window, jump the left bound past it. Time O(n), space O(min(n, alphabet)).

**Python:**
```python
def length_of_longest_substring(s: str) -> int:
    last: dict[str, int] = {}
    start = best = 0
    for i, c in enumerate(s):
        if c in last and last[c] >= start:
            start = last[c] + 1
        last[c] = i
        best = max(best, i - start + 1)
    return best
```

**TypeScript:**
```typescript
function lengthOfLongestSubstring(s: string): number {
  const last = new Map<string, number>();
  let start = 0, best = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (last.has(c) && last.get(c)! >= start) start = last.get(c)! + 1;
    last.set(c, i);
    best = Math.max(best, i - start + 1);
  }
  return best;
}
```

**Java:**
```java
int lengthOfLongestSubstring(String s) {
  Map<Character, Integer> last = new HashMap<>();
  int start = 0, best = 0;
  for (int i = 0; i < s.length(); i++) {
    char c = s.charAt(i);
    if (last.containsKey(c) && last.get(c) >= start) start = last.get(c) + 1;
    last.put(c, i);
    best = Math.max(best, i - start + 1);
  }
  return best;
}
```

**Key points:**
- Each index enters and leaves the window once, so it is O(n) time.
- Jumping `start` past the last occurrence avoids re-scanning the window.

**Tags:** #algorithm

---

### 39. Minimum Window Substring

**Difficulty:** Hard
**Topics:** string, sliding-window, hash-table
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Given strings `s` and `t`, return the smallest substring of `s` containing every character of `t` (with multiplicity), or "" if none exists.

**Approach:** Expand a window to satisfy all required counts, then contract from the left while still valid, tracking the smallest valid window. Time O(n + m), space O(alphabet).

**Python:**
```python
from collections import Counter

def min_window(s: str, t: str) -> str:
    if not t or not s:
        return ""
    need = Counter(t)
    missing = len(t)
    start = end = 0
    left = 0
    for right, c in enumerate(s, 1):
        if need[c] > 0:
            missing -= 1
        need[c] -= 1
        while missing == 0:
            if end == 0 or right - left < end - start:
                start, end = left, right
            need[s[left]] += 1
            if need[s[left]] > 0:
                missing += 1
            left += 1
    return s[start:end]
```

**TypeScript:**
```typescript
function minWindow(s: string, t: string): string {
  if (!s || !t) return "";
  const need = new Map<string, number>();
  for (const c of t) need.set(c, (need.get(c) ?? 0) + 1);
  let missing = t.length, left = 0, start = 0, end = 0;
  for (let right = 1; right <= s.length; right++) {
    const c = s[right - 1];
    if ((need.get(c) ?? 0) > 0) missing--;
    need.set(c, (need.get(c) ?? 0) - 1);
    while (missing === 0) {
      if (end === 0 || right - left < end - start) { start = left; end = right; }
      const lc = s[left];
      need.set(lc, (need.get(lc) ?? 0) + 1);
      if ((need.get(lc) ?? 0) > 0) missing++;
      left++;
    }
  }
  return s.slice(start, end);
}
```

**Java:**
```java
String minWindow(String s, String t) {
  if (s.isEmpty() || t.isEmpty()) return "";
  int[] need = new int[128];
  for (char c : t.toCharArray()) need[c]++;
  int missing = t.length(), left = 0, start = 0, end = 0;
  for (int right = 1; right <= s.length(); right++) {
    char c = s.charAt(right - 1);
    if (need[c]-- > 0) missing--;
    while (missing == 0) {
      if (end == 0 || right - left < end - start) { start = left; end = right; }
      char lc = s.charAt(left);
      if (++need[lc] > 0) missing++;
      left++;
    }
  }
  return s.substring(start, end);
}
```

**Key points:**
- Each pointer advances at most n times, giving O(n + m) time.
- `missing` lets you test window validity in O(1) instead of comparing maps.

**Tags:** #algorithm

---

### 40. Longest Consecutive Sequence

**Difficulty:** Medium
**Topics:** hash-table, array, union-find
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Given an unsorted array of integers, return the length of the longest run of consecutive integers, in O(n) time.

**Approach:** Put everything in a hash set. Count forward only from sequence starts (numbers whose `n-1` is absent). Each number is visited at most twice, so time O(n), space O(n). Compared with an O(n log n) sort, the hash approach is the standard answer when Huawei's coding test demands linear time.

**Python:**
```python
def longest_consecutive(nums: list[int]) -> int:
    num_set = set(nums)
    best = 0
    for n in num_set:
        if n - 1 not in num_set:  # only start counting at a sequence head
            length = 1
            while n + length in num_set:
                length += 1
            best = max(best, length)
    return best
```

**TypeScript:**
```typescript
function longestConsecutive(nums: number[]): number {
  const set = new Set(nums);
  let best = 0;
  for (const n of set) {
    if (!set.has(n - 1)) {
      let length = 1;
      while (set.has(n + length)) length++;
      best = Math.max(best, length);
    }
  }
  return best;
}
```

**Java:**
```java
int longestConsecutive(int[] nums) {
  Set<Integer> set = new HashSet<>();
  for (int n : nums) set.add(n);
  int best = 0;
  for (int n : set) {
    if (!set.contains(n - 1)) {
      int length = 1;
      while (set.contains(n + length)) length++;
      best = Math.max(best, length);
    }
  }
  return best;
}
```

**Key points:**
- Expanding only from sequence heads keeps it O(n), not O(n^2).
- A hash set makes membership checks O(1).
- The set deduplicates, so repeated values do not affect the result.

**Tags:** #algorithm

---

### 41. Subarray Sum Equals K

**Difficulty:** Medium
**Topics:** hash-table, prefix-sum, array
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Given an integer array and an integer K, return the number of contiguous subarrays whose sum equals K (the array may contain negatives).

**Approach:** Prefix sum plus hash map. Track the running prefix sum; the number of valid subarrays ending at the current index equals how many times `prefix - k` has occurred. Keep a map of prefix-sum counts, seeded with `{0: 1}`. Time O(n), space O(n). Sliding window fails with negatives, which is a common test point.

**Python:**
```python
from collections import defaultdict

def subarray_sum(nums: list[int], k: int) -> int:
    seen: dict[int, int] = defaultdict(int)
    seen[0] = 1
    prefix = count = 0
    for x in nums:
        prefix += x
        count += seen[prefix - k]
        seen[prefix] += 1
    return count
```

**TypeScript:**
```typescript
function subarraySum(nums: number[], k: number): number {
  const seen = new Map<number, number>([[0, 1]]);
  let prefix = 0, count = 0;
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
int subarraySum(int[] nums, int k) {
  Map<Integer, Integer> seen = new HashMap<>();
  seen.put(0, 1);
  int prefix = 0, count = 0;
  for (int x : nums) {
    prefix += x;
    count += seen.getOrDefault(prefix - k, 0);
    seen.merge(prefix, 1, Integer::sum);
  }
  return count;
}
```

**Key points:**
- A subarray sum is a difference of prefix sums; counting prefix frequencies gives O(n).
- Seeding `{0: 1}` handles subarrays starting at index 0.
- Sliding window breaks with negatives; prefix sum plus hashing is required.

**Tags:** #algorithm

---

## Binary Search

### 42. Search a 2D Matrix

**Difficulty:** Medium
**Topics:** binary-search, matrix, array
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Given an m×n matrix where each row is sorted ascending and the first element of each row exceeds the last of the previous row, determine whether a target value exists.

**Approach:** The flattened matrix is globally sorted, so binary search over a 1-D index: index `mid` maps to `matrix[mid // cols][mid % cols]`. Time O(log(m·n)), space O(1). This beats per-row binary search (O(m log n)) and is a general trick for sorted tables and index lookups.

**Python:**
```python
def search_matrix(matrix: list[list[int]], target: int) -> bool:
    if not matrix or not matrix[0]:
        return False
    rows, cols = len(matrix), len(matrix[0])
    lo, hi = 0, rows * cols - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        val = matrix[mid // cols][mid % cols]
        if val == target:
            return True
        if val < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return False
```

**TypeScript:**
```typescript
function searchMatrix(matrix: number[][], target: number): boolean {
  const rows = matrix.length, cols = matrix[0].length;
  let lo = 0, hi = rows * cols - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const val = matrix[Math.floor(mid / cols)][mid % cols];
    if (val === target) return true;
    if (val < target) lo = mid + 1; else hi = mid - 1;
  }
  return false;
}
```

**Java:**
```java
boolean searchMatrix(int[][] matrix, int target) {
  int rows = matrix.length, cols = matrix[0].length;
  int lo = 0, hi = rows * cols - 1;
  while (lo <= hi) {
    int mid = (lo + hi) >>> 1;
    int val = matrix[mid / cols][mid % cols];
    if (val == target) return true;
    if (val < target) lo = mid + 1; else hi = mid - 1;
  }
  return false;
}
```

**Key points:**
- Treat the matrix as a flattened sorted array and convert with `mid / cols` and `mid % cols`.
- Time O(log(m·n)), better than per-row binary search.
- Java's `>>>` unsigned shift avoids overflow when adding large indices.

**Tags:** #algorithm

---

### 43. Find Minimum in Rotated Sorted Array

**Difficulty:** Medium
**Topics:** binary-search, array
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** An ascending array with distinct elements is rotated at an unknown pivot; find its minimum value.

**Approach:** Compare the midpoint with the right endpoint: if `nums[mid] > nums[hi]`, the minimum lies in the right half (`lo = mid + 1`); otherwise it lies in the left half including `mid` (`hi = mid`). Loop until `lo == hi`. Time O(log n), space O(1). Comparing against the right endpoint also handles the non-rotated case correctly.

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
    if (nums[mid] > nums[hi]) lo = mid + 1; else hi = mid;
  }
  return nums[lo];
}
```

**Java:**
```java
int findMin(int[] nums) {
  int lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    int mid = (lo + hi) >>> 1;
    if (nums[mid] > nums[hi]) lo = mid + 1; else hi = mid;
  }
  return nums[lo];
}
```

**Key points:**
- Compare against the right endpoint, not the left, to pick the correct half.
- Use `lo < hi` so the loop converges to a single index without spinning.
- Time O(log n), space O(1).

**Tags:** #algorithm

---

### 44. Koko Eating Bananas

**Difficulty:** Medium
**Topics:** binary-search, search-on-answer, greedy
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** There are several piles of bananas, the i-th holding `piles[i]`. Each hour Koko picks one pile and eats k bananas from it; if the pile has fewer than k, she finishes it and stops for that hour (a pile never spans hours). Given h hours, find the smallest speed k that lets her finish within h hours.

**Approach:** Binary search on the answer. Higher speed means fewer hours, so the predicate is monotonic. Binary-search k over `[1, max(piles)]`, summing `ceil(pile / k)` hours; if it is ≤ h, try a smaller k, otherwise increase it. Time O(n·log(max)), space O(1). This "smallest rate under a deadline" pattern matches how Huawei tunes link-bandwidth and rate-limiting thresholds.

**Python:**
```python
import math

def min_eating_speed(piles: list[int], h: int) -> int:
    lo, hi = 1, max(piles)
    while lo < hi:
        mid = (lo + hi) // 2
        hours = sum(math.ceil(p / mid) for p in piles)
        if hours <= h:
            hi = mid
        else:
            lo = mid + 1
    return lo
```

**TypeScript:**
```typescript
function minEatingSpeed(piles: number[], h: number): number {
  let lo = 1, hi = Math.max(...piles);
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    let hours = 0;
    for (const p of piles) hours += Math.ceil(p / mid);
    if (hours <= h) hi = mid; else lo = mid + 1;
  }
  return lo;
}
```

**Java:**
```java
int minEatingSpeed(int[] piles, int h) {
  int lo = 1, hi = 0;
  for (int p : piles) hi = Math.max(hi, p);
  while (lo < hi) {
    int mid = (lo + hi) >>> 1;
    long hours = 0;
    for (int p : piles) hours += (p + mid - 1) / mid;  // ceiling division
    if (hours <= h) hi = mid; else lo = mid + 1;
  }
  return lo;
}
```

**Key points:**
- Binary search on the answer: feasibility is monotonic in speed.
- Upper bound is `max(piles)` (one pile per hour); lower bound is 1.
- Use `(p + k - 1) / k` for ceiling division to avoid floats; accumulate in a long in Java to prevent overflow.

**Tags:** #algorithm

---

## Dynamic Programming

### 45. Best Time to Buy and Sell Stock

**Difficulty:** Easy
**Topics:** array, dynamic-programming
**Position:** OD / SWE
**Years:** 13-14 (Junior)

**Question:** Given daily prices, find the maximum profit from one buy and one later sell. Return 0 if no profit is possible.

**Approach:** Track the minimum price so far; at each day compute profit against that minimum and keep the best. Time O(n), space O(1).

**Python:**
```python
def max_profit(prices: list[int]) -> int:
    best, lo = 0, float("inf")
    for p in prices:
        lo = min(lo, p)
        best = max(best, p - lo)
    return best
```

**TypeScript:**
```typescript
function maxProfit(prices: number[]): number {
  let best = 0, lo = Infinity;
  for (const p of prices) {
    lo = Math.min(lo, p);
    best = Math.max(best, p - lo);
  }
  return best;
}
```

**Java:**
```java
int maxProfit(int[] prices) {
  int best = 0, lo = Integer.MAX_VALUE;
  for (int p : prices) {
    lo = Math.min(lo, p);
    best = Math.max(best, p - lo);
  }
  return best;
}
```

**Key points:**
- Single pass tracking the running minimum is O(n) time, O(1) space.
- Buy must precede sell, which the running-minimum invariant guarantees.

**Follow-ups:**
- Unlimited transactions (sum every positive delta).
- At most k transactions (DP, O(nk)).
- Add a transaction fee or a cooldown day.
- Return the actual buy/sell day indices.

**Tags:** #algorithm

---

### 46. Maximum Subarray (Kadane)

**Difficulty:** Medium
**Topics:** array, dynamic-programming
**Position:** OD / SWE
**Years:** 13-14 (Junior)

**Question:** Find the contiguous subarray with the largest sum and return that sum.

**Approach:** Kadane's algorithm — keep a running sum; reset it to the current element whenever extending would lower it. Track the global best. Time O(n), space O(1).

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
- Kadane runs in O(n) time, O(1) space.
- Initialize with the first element so all-negative arrays return the largest single value.

**Follow-ups:**
- Return the subarray bounds, not just the sum.
- Maximum product subarray (track min and max).
- Maximum circular subarray sum.
- Divide-and-conquer O(n log n) variant and why Kadane wins.

**Tags:** #algorithm

---

### 47. Climbing Stairs

**Difficulty:** Easy
**Topics:** dynamic-programming
**Position:** OD / SWE
**Years:** 13-14 (Junior)

**Question:** You can climb 1 or 2 steps at a time. How many distinct ways to reach the top of `n` stairs?

**Approach:** Fibonacci recurrence `f(n) = f(n-1) + f(n-2)`. Roll two variables to avoid an array. Time O(n), space O(1).

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
  for (let i = 0; i < n; i++) { [a, b] = [b, a + b]; }
  return a;
}
```

**Java:**
```java
int climbStairs(int n) {
  int a = 1, b = 1;
  for (int i = 0; i < n; i++) {
    int t = a + b; a = b; b = t;
  }
  return a;
}
```

**Key points:**
- Rolling two variables gives O(n) time, O(1) space.
- It is Fibonacci; recognizing the recurrence is the whole insight.

**Follow-ups:**
- Steps of size 1, 2, or 3.
- Each step has a cost — minimize total cost (Min Cost Climbing Stairs).
- Count ways modulo 1e9+7 for large n.
- O(log n) via fast matrix exponentiation.

**Tags:** #algorithm

---

### 48. Coin Change

**Difficulty:** Medium
**Topics:** dynamic-programming
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Given coin denominations and an amount, return the fewest coins to make the amount, or -1 if impossible.

**Approach:** Bottom-up DP where `dp[a]` is the min coins for amount `a`; relax over each coin. Time O(amount·coins), space O(amount).

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
  const dp = new Array(amount + 1).fill(amount + 1);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++)
    for (const c of coins)
      if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
  return dp[amount] <= amount ? dp[amount] : -1;
}
```

**Java:**
```java
int coinChange(int[] coins, int amount) {
  int[] dp = new int[amount + 1];
  Arrays.fill(dp, amount + 1);
  dp[0] = 0;
  for (int a = 1; a <= amount; a++)
    for (int c : coins)
      if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
  return dp[amount] <= amount ? dp[amount] : -1;
}
```

**Key points:**
- The DP table costs O(amount·coins) time, O(amount) space.
- Initializing with `amount + 1` acts as infinity so unreachable amounts stay -1.

**Tags:** #algorithm

---

### 49. Longest Increasing Subsequence

**Difficulty:** Medium
**Topics:** dynamic-programming, binary-search
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Find the length of the longest strictly increasing subsequence.

**Approach:** Patience sorting — maintain `tails`, where `tails[i]` is the smallest possible tail of an increasing subsequence of length `i+1`; binary-search the insertion point per element. Time O(n log n), space O(n).

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
      if (tails[mid] < x) lo = mid + 1; else hi = mid;
    }
    tails[lo] = x;
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
      int mid = (lo + hi) >>> 1;
      if (tails.get(mid) < x) lo = mid + 1; else hi = mid;
    }
    if (lo == tails.size()) tails.add(x); else tails.set(lo, x);
  }
  return tails.size();
}
```

**Key points:**
- Binary search per element gives O(n log n) time, O(n) space versus O(n^2) DP.
- `tails` is not the actual subsequence but its length equals the answer.

**Tags:** #algorithm

---

### 50. House Robber

**Difficulty:** Medium
**Topics:** dynamic-programming
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Given house values in a row, maximize the loot without robbing two adjacent houses.

**Approach:** DP recurrence `rob(i) = max(rob(i-1), rob(i-2) + nums[i])`, rolled into two variables. Time O(n), space O(1).

**Python:**
```python
def rob(nums: list[int]) -> int:
    prev, cur = 0, 0
    for x in nums:
        prev, cur = cur, max(cur, prev + x)
    return cur
```

**TypeScript:**
```typescript
function rob(nums: number[]): number {
  let prev = 0, cur = 0;
  for (const x of nums) { const t = Math.max(cur, prev + x); prev = cur; cur = t; }
  return cur;
}
```

**Java:**
```java
int rob(int[] nums) {
  int prev = 0, cur = 0;
  for (int x : nums) { int t = Math.max(cur, prev + x); prev = cur; cur = t; }
  return cur;
}
```

**Key points:**
- Rolling two state variables gives O(n) time, O(1) space.
- The choice at each house is rob-and-skip-neighbor vs skip.

**Tags:** #algorithm

---

### 51. Word Break

**Difficulty:** Medium
**Topics:** dynamic-programming, string
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Given a string and a dictionary, decide whether the string can be segmented into a sequence of dictionary words.

**Approach:** DP where `dp[i]` means the prefix of length `i` is segmentable; for each `i` try every split `j` with `dp[j]` true and `s[j:i]` in the set. Time O(n^2) (plus substring cost), space O(n).

**Python:**
```python
def word_break(s: str, word_dict: list[str]) -> bool:
    words = set(word_dict)
    dp = [False] * (len(s) + 1)
    dp[0] = True
    for i in range(1, len(s) + 1):
        for j in range(i):
            if dp[j] and s[j:i] in words:
                dp[i] = True
                break
    return dp[len(s)]
```

**TypeScript:**
```typescript
function wordBreak(s: string, wordDict: string[]): boolean {
  const words = new Set(wordDict);
  const dp = new Array(s.length + 1).fill(false);
  dp[0] = true;
  for (let i = 1; i <= s.length; i++)
    for (let j = 0; j < i; j++)
      if (dp[j] && words.has(s.slice(j, i))) { dp[i] = true; break; }
  return dp[s.length];
}
```

**Java:**
```java
boolean wordBreak(String s, List<String> wordDict) {
  Set<String> words = new HashSet<>(wordDict);
  boolean[] dp = new boolean[s.length() + 1];
  dp[0] = true;
  for (int i = 1; i <= s.length(); i++)
    for (int j = 0; j < i; j++)
      if (dp[j] && words.contains(s.substring(j, i))) { dp[i] = true; break; }
  return dp[s.length()];
}
```

**Key points:**
- The nested loops give O(n^2) splits, O(n) space.
- A trie or capping inner length by the longest word trims redundant checks.

**Tags:** #algorithm

---

### 52. Edit Distance

**Difficulty:** Medium
**Topics:** dynamic-programming, string
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Given two strings, return the minimum number of insert, delete, or replace operations to convert the first into the second.

**Approach:** 2-D DP where `dp[i][j]` is the edit distance between the first `i` chars of `a` and first `j` chars of `b`; when characters match inherit the diagonal, else take 1 + min of the three neighbours. Time O(m·n), space O(m·n). Huawei uses the same recurrence for diff/patch tooling and fuzzy log matching.

**Python:**
```python
def min_distance(a: str, b: str) -> int:
    m, n = len(a), len(b)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j
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
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}
```

**Java:**
```java
int minDistance(String a, String b) {
  int m = a.length(), n = b.length();
  int[][] dp = new int[m + 1][n + 1];
  for (int i = 0; i <= m; i++) dp[i][0] = i;
  for (int j = 0; j <= n; j++) dp[0][j] = j;
  for (int i = 1; i <= m; i++)
    for (int j = 1; j <= n; j++)
      dp[i][j] = a.charAt(i - 1) == b.charAt(j - 1)
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], Math.min(dp[i - 1][j], dp[i][j - 1]));
  return dp[m][n];
}
```

**Key points:**
- Three transitions map to delete (`dp[i-1][j]`), insert (`dp[i][j-1]`), and replace (`dp[i-1][j-1]`).
- Base rows/columns encode converting to/from an empty string.
- Space drops to O(n) with a rolling row.

**Tags:** #algorithm

---

### 53. Unique Paths

**Difficulty:** Medium
**Topics:** dynamic-programming, combinatorics
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** A robot on an m x n grid starts top-left and moves only right or down; count the distinct paths to the bottom-right corner.

**Approach:** `dp[i][j]` = paths to cell (i, j) = paths from above + paths from left. Collapse to a single row updated left to right. Time O(m·n), space O(n).

**Python:**
```python
def unique_paths(m: int, n: int) -> int:
    dp = [1] * n
    for _ in range(1, m):
        for j in range(1, n):
            dp[j] += dp[j - 1]
    return dp[n - 1]
```

**TypeScript:**
```typescript
function uniquePaths(m: number, n: number): number {
  const dp = new Array(n).fill(1);
  for (let i = 1; i < m; i++)
    for (let j = 1; j < n; j++) dp[j] += dp[j - 1];
  return dp[n - 1];
}
```

**Java:**
```java
int uniquePaths(int m, int n) {
  int[] dp = new int[n];
  Arrays.fill(dp, 1);
  for (int i = 1; i < m; i++)
    for (int j = 1; j < n; j++) dp[j] += dp[j - 1];
  return dp[n - 1];
}
```

**Key points:**
- First row and column are all 1 since there is a single path along an edge.
- The rolling array reuses `dp[j-1]` (already updated, current row) and `dp[j]` (old value, row above).
- Closed form C(m+n-2, m-1) also works but risks overflow.

**Tags:** #algorithm

---

### 54. Longest Common Subsequence

**Difficulty:** Medium
**Topics:** dynamic-programming, string
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Given two strings, return the length of their longest common subsequence (characters keep relative order but need not be contiguous).

**Approach:** `dp[i][j]` = LCS of the first `i` chars of `a` and first `j` chars of `b`; if the current chars match extend the diagonal by 1, otherwise take the better of dropping either char. Time O(m·n), space O(m·n). It is the backbone of diff and version-merge algorithms.

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
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return dp[m][n];
}
```

**Java:**
```java
int longestCommonSubsequence(String a, String b) {
  int m = a.length(), n = b.length();
  int[][] dp = new int[m + 1][n + 1];
  for (int i = 1; i <= m; i++)
    for (int j = 1; j <= n; j++)
      dp[i][j] = a.charAt(i - 1) == b.charAt(j - 1)
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return dp[m][n];
}
```

**Key points:**
- Match extends the diagonal; mismatch drops one character from either string.
- Distinct from longest common substring, which requires contiguity and resets on mismatch.
- Backtracking through the table reconstructs the actual subsequence.

**Tags:** #algorithm

---

### 55. Partition Equal Subset Sum

**Difficulty:** Medium
**Topics:** dynamic-programming, knapsack
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Determine whether an array of positive integers can be split into two subsets with equal sums.

**Approach:** If the total is odd the answer is false; otherwise it reduces to a 0/1 knapsack asking whether some subset sums to `total/2`. Use a boolean DP over reachable sums, iterating each number and scanning sums high to low so every item is used once. Time O(n·target), space O(target). This subset-balancing pattern maps to load balancing across telecom line cards.

**Python:**
```python
def can_partition(nums: list[int]) -> bool:
    total = sum(nums)
    if total % 2:
        return False
    target = total // 2
    dp = [False] * (target + 1)
    dp[0] = True
    for x in nums:
        for s in range(target, x - 1, -1):
            dp[s] = dp[s] or dp[s - x]
    return dp[target]
```

**TypeScript:**
```typescript
function canPartition(nums: number[]): boolean {
  const total = nums.reduce((a, b) => a + b, 0);
  if (total % 2 !== 0) return false;
  const target = total / 2;
  const dp = new Array(target + 1).fill(false);
  dp[0] = true;
  for (const x of nums)
    for (let s = target; s >= x; s--) dp[s] = dp[s] || dp[s - x];
  return dp[target];
}
```

**Java:**
```java
boolean canPartition(int[] nums) {
  int total = 0;
  for (int x : nums) total += x;
  if (total % 2 != 0) return false;
  int target = total / 2;
  boolean[] dp = new boolean[target + 1];
  dp[0] = true;
  for (int x : nums)
    for (int s = target; s >= x; s--) dp[s] = dp[s] || dp[s - x];
  return dp[target];
}
```

**Key points:**
- Reversed inner loop prevents reusing the same element (0/1 knapsack vs unbounded).
- `dp[0] = true` seeds the empty subset.
- An odd total is an instant no-solution shortcut.

**Tags:** #algorithm

---

## Backtracking

### 56. Word Search

**Difficulty:** Medium
**Topics:** backtracking, dfs, grid
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Given a grid of letters and a word, return whether the word can be formed by adjacent cells (no cell reused).

**Approach:** DFS backtracking from each cell, marking the cell visited during recursion and restoring it on return. Time O(rows·cols·4^L) worst case, space O(L).

**Python:**
```python
def exist(board: list[list[str]], word: str) -> bool:
    rows, cols = len(board), len(board[0])

    def dfs(r, c, i):
        if i == len(word):
            return True
        if r < 0 or c < 0 or r >= rows or c >= cols or board[r][c] != word[i]:
            return False
        tmp, board[r][c] = board[r][c], "#"
        found = (dfs(r + 1, c, i + 1) or dfs(r - 1, c, i + 1) or
                 dfs(r, c + 1, i + 1) or dfs(r, c - 1, i + 1))
        board[r][c] = tmp
        return found

    return any(dfs(r, c, 0) for r in range(rows) for c in range(cols))
```

**TypeScript:**
```typescript
function exist(board: string[][], word: string): boolean {
  const rows = board.length, cols = board[0].length;
  const dfs = (r: number, c: number, i: number): boolean => {
    if (i === word.length) return true;
    if (r < 0 || c < 0 || r >= rows || c >= cols || board[r][c] !== word[i]) return false;
    const tmp = board[r][c];
    board[r][c] = "#";
    const found = dfs(r + 1, c, i + 1) || dfs(r - 1, c, i + 1) ||
                  dfs(r, c + 1, i + 1) || dfs(r, c - 1, i + 1);
    board[r][c] = tmp;
    return found;
  };
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (dfs(r, c, 0)) return true;
  return false;
}
```

**Java:**
```java
boolean exist(char[][] board, String word) {
  int rows = board.length, cols = board[0].length;
  for (int r = 0; r < rows; r++)
    for (int c = 0; c < cols; c++)
      if (dfs(board, word, r, c, 0)) return true;
  return false;
}

boolean dfs(char[][] b, String w, int r, int c, int i) {
  if (i == w.length()) return true;
  if (r < 0 || c < 0 || r >= b.length || c >= b[0].length || b[r][c] != w.charAt(i)) return false;
  char tmp = b[r][c];
  b[r][c] = '#';
  boolean found = dfs(b, w, r + 1, c, i + 1) || dfs(b, w, r - 1, c, i + 1) ||
                  dfs(b, w, r, c + 1, i + 1) || dfs(b, w, r, c - 1, i + 1);
  b[r][c] = tmp;
  return found;
}
```

**Key points:**
- Backtracking explores up to O(rows·cols·4^L) paths; recursion depth is O(L).
- Marking and restoring the cell enforces the no-reuse rule without extra memory.

**Tags:** #algorithm

---

### 57. Combination Sum

**Difficulty:** Medium
**Topics:** backtracking, recursion
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Given distinct positive candidates and a target, return all unique combinations summing to the target; each candidate may be reused.

**Approach:** DFS backtracking; at each step either reuse the current candidate or advance the start index to avoid permutation duplicates. Time O(2^t) worst case, space O(t) recursion depth.

**Python:**
```python
def combination_sum(candidates: list[int], target: int) -> list[list[int]]:
    res: list[list[int]] = []

    def dfs(start, remain, path):
        if remain == 0:
            res.append(path[:])
            return
        for i in range(start, len(candidates)):
            if candidates[i] <= remain:
                path.append(candidates[i])
                dfs(i, remain - candidates[i], path)
                path.pop()

    dfs(0, target, [])
    return res
```

**TypeScript:**
```typescript
function combinationSum(candidates: number[], target: number): number[][] {
  const res: number[][] = [];
  const dfs = (start: number, remain: number, path: number[]): void => {
    if (remain === 0) { res.push([...path]); return; }
    for (let i = start; i < candidates.length; i++) {
      if (candidates[i] <= remain) {
        path.push(candidates[i]);
        dfs(i, remain - candidates[i], path);
        path.pop();
      }
    }
  };
  dfs(0, target, []);
  return res;
}
```

**Java:**
```java
List<List<Integer>> combinationSum(int[] candidates, int target) {
  List<List<Integer>> res = new ArrayList<>();
  dfs(candidates, 0, target, new ArrayList<>(), res);
  return res;
}

void dfs(int[] cand, int start, int remain, List<Integer> path, List<List<Integer>> res) {
  if (remain == 0) { res.add(new ArrayList<>(path)); return; }
  for (int i = start; i < cand.length; i++) {
    if (cand[i] <= remain) {
      path.add(cand[i]);
      dfs(cand, i, remain - cand[i], path, res);
      path.remove(path.size() - 1);
    }
  }
}
```

**Key points:**
- Backtracking explores up to O(2^t) states; depth is O(t) for the path.
- Passing `i` (not `i+1`) allows reuse; advancing the start prevents duplicate sets.

**Tags:** #algorithm

---

### 58. Permutations

**Difficulty:** Medium
**Topics:** backtracking, recursion
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Return all permutations of a list of distinct integers.

**Approach:** Backtracking with a used-set (or in-place swaps); fix one element per level. Time O(n·n!), space O(n).

**Python:**
```python
def permute(nums: list[int]) -> list[list[int]]:
    res: list[list[int]] = []

    def dfs(path, used):
        if len(path) == len(nums):
            res.append(path[:])
            return
        for i, x in enumerate(nums):
            if not used[i]:
                used[i] = True
                path.append(x)
                dfs(path, used)
                path.pop()
                used[i] = False

    dfs([], [False] * len(nums))
    return res
```

**TypeScript:**
```typescript
function permute(nums: number[]): number[][] {
  const res: number[][] = [];
  const used = new Array(nums.length).fill(false);
  const dfs = (path: number[]): void => {
    if (path.length === nums.length) { res.push([...path]); return; }
    for (let i = 0; i < nums.length; i++) {
      if (!used[i]) {
        used[i] = true; path.push(nums[i]);
        dfs(path);
        path.pop(); used[i] = false;
      }
    }
  };
  dfs([]);
  return res;
}
```

**Java:**
```java
List<List<Integer>> permute(int[] nums) {
  List<List<Integer>> res = new ArrayList<>();
  dfs(nums, new boolean[nums.length], new ArrayList<>(), res);
  return res;
}

void dfs(int[] nums, boolean[] used, List<Integer> path, List<List<Integer>> res) {
  if (path.size() == nums.length) { res.add(new ArrayList<>(path)); return; }
  for (int i = 0; i < nums.length; i++) {
    if (!used[i]) {
      used[i] = true; path.add(nums[i]);
      dfs(nums, used, path, res);
      path.remove(path.size() - 1); used[i] = false;
    }
  }
}
```

**Key points:**
- There are n! permutations, each O(n) to copy, so O(n·n!) time, O(n) extra space.
- The `used` array prevents reusing an element within one permutation.

**Tags:** #algorithm

---

### 59. Subsets

**Difficulty:** Medium
**Topics:** backtracking, bit-manipulation
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Return all subsets (the power set) of a list of distinct integers.

**Approach:** Backtracking that records the path at every node and branches by include/exclude through increasing start indices. Time O(n·2^n), space O(n).

**Python:**
```python
def subsets(nums: list[int]) -> list[list[int]]:
    res: list[list[int]] = []

    def dfs(start, path):
        res.append(path[:])
        for i in range(start, len(nums)):
            path.append(nums[i])
            dfs(i + 1, path)
            path.pop()

    dfs(0, [])
    return res
```

**TypeScript:**
```typescript
function subsets(nums: number[]): number[][] {
  const res: number[][] = [];
  const dfs = (start: number, path: number[]): void => {
    res.push([...path]);
    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]);
      dfs(i + 1, path);
      path.pop();
    }
  };
  dfs(0, []);
  return res;
}
```

**Java:**
```java
List<List<Integer>> subsets(int[] nums) {
  List<List<Integer>> res = new ArrayList<>();
  dfs(nums, 0, new ArrayList<>(), res);
  return res;
}

void dfs(int[] nums, int start, List<Integer> path, List<List<Integer>> res) {
  res.add(new ArrayList<>(path));
  for (int i = start; i < nums.length; i++) {
    path.add(nums[i]);
    dfs(nums, i + 1, path, res);
    path.remove(path.size() - 1);
  }
}
```

**Key points:**
- There are 2^n subsets, each up to O(n) to copy: O(n·2^n) time.
- An equivalent solution maps each subset to an n-bit mask.

**Tags:** #algorithm

---

### 60. Generate Parentheses

**Difficulty:** Medium
**Topics:** backtracking, string
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Given n pairs of parentheses, generate all combinations of well-formed parentheses.

**Approach:** Backtrack while tracking the count of open and close brackets used. Add `(` while opens < n; add `)` only while closes < opens, which guarantees validity without a separate check. Time O(4^n / sqrt(n)) (the nth Catalan number), space O(n) recursion depth.

**Python:**
```python
def generate_parenthesis(n: int) -> list[str]:
    res: list[str] = []
    def backtrack(cur: str, open_: int, close: int) -> None:
        if len(cur) == 2 * n:
            res.append(cur)
            return
        if open_ < n:
            backtrack(cur + "(", open_ + 1, close)
        if close < open_:
            backtrack(cur + ")", open_, close + 1)
    backtrack("", 0, 0)
    return res
```

**TypeScript:**
```typescript
function generateParenthesis(n: number): string[] {
  const res: string[] = [];
  const backtrack = (cur: string, open: number, close: number): void => {
    if (cur.length === 2 * n) { res.push(cur); return; }
    if (open < n) backtrack(cur + "(", open + 1, close);
    if (close < open) backtrack(cur + ")", open, close + 1);
  };
  backtrack("", 0, 0);
  return res;
}
```

**Java:**
```java
List<String> generateParenthesis(int n) {
  List<String> res = new ArrayList<>();
  backtrack(res, "", 0, 0, n);
  return res;
}

void backtrack(List<String> res, String cur, int open, int close, int n) {
  if (cur.length() == 2 * n) { res.add(cur); return; }
  if (open < n) backtrack(res, cur + "(", open + 1, close, n);
  if (close < open) backtrack(res, cur + ")", open, close + 1, n);
}
```

**Key points:**
- Pruning with `close < open` keeps the search on valid prefixes only.
- The output count equals the nth Catalan number.
- String immutability naturally undoes choices; a char buffer avoids per-call copies.

**Tags:** #algorithm

---

### 61. N-Queens

**Difficulty:** Hard
**Topics:** backtracking, recursion
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Count the number of distinct ways to place n queens on an n x n board so that no two attack each other.

**Approach:** Place one queen per row and backtrack column by column. Track occupied columns and both diagonals (`row - col` and `row + col`) with hash sets so each placement check is O(1). Time O(n!), space O(n).

**Python:**
```python
def total_n_queens(n: int) -> int:
    cols: set[int] = set()
    diag1: set[int] = set()
    diag2: set[int] = set()
    def backtrack(r: int) -> int:
        if r == n:
            return 1
        count = 0
        for c in range(n):
            if c in cols or (r - c) in diag1 or (r + c) in diag2:
                continue
            cols.add(c); diag1.add(r - c); diag2.add(r + c)
            count += backtrack(r + 1)
            cols.remove(c); diag1.remove(r - c); diag2.remove(r + c)
        return count
    return backtrack(0)
```

**TypeScript:**
```typescript
function totalNQueens(n: number): number {
  const cols = new Set<number>();
  const diag1 = new Set<number>();
  const diag2 = new Set<number>();
  const backtrack = (r: number): number => {
    if (r === n) return 1;
    let count = 0;
    for (let c = 0; c < n; c++) {
      if (cols.has(c) || diag1.has(r - c) || diag2.has(r + c)) continue;
      cols.add(c); diag1.add(r - c); diag2.add(r + c);
      count += backtrack(r + 1);
      cols.delete(c); diag1.delete(r - c); diag2.delete(r + c);
    }
    return count;
  };
  return backtrack(0);
}
```

**Java:**
```java
int totalNQueens(int n) {
  return backtrack(0, n, new HashSet<>(), new HashSet<>(), new HashSet<>());
}

int backtrack(int r, int n, Set<Integer> cols, Set<Integer> d1, Set<Integer> d2) {
  if (r == n) return 1;
  int count = 0;
  for (int c = 0; c < n; c++) {
    if (cols.contains(c) || d1.contains(r - c) || d2.contains(r + c)) continue;
    cols.add(c); d1.add(r - c); d2.add(r + c);
    count += backtrack(r + 1, n, cols, d1, d2);
    cols.remove(c); d1.remove(r - c); d2.remove(r + c);
  }
  return count;
}
```

**Key points:**
- One queen per row removes an entire dimension of the search.
- `row - col` is constant on one diagonal, `row + col` on the anti-diagonal.
- Every add must be undone symmetrically after the recursive call.

**Tags:** #algorithm

---

## Two Pointers / Sliding Window

### 62. Trapping Rain Water

**Difficulty:** Hard
**Topics:** two-pointers, array
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Given an elevation map as bar heights, compute how much water it can trap after raining.

**Approach:** Two pointers from both ends with running `leftMax` and `rightMax`. The shorter side bounds the water at its pointer, so advance whichever side is lower and accumulate `max - height` there. Time O(n), space O(1).

**Python:**
```python
def trap(height: list[int]) -> int:
    left, right = 0, len(height) - 1
    left_max = right_max = 0
    water = 0
    while left < right:
        if height[left] < height[right]:
            left_max = max(left_max, height[left])
            water += left_max - height[left]
            left += 1
        else:
            right_max = max(right_max, height[right])
            water += right_max - height[right]
            right -= 1
    return water
```

**TypeScript:**
```typescript
function trap(height: number[]): number {
  let left = 0, right = height.length - 1;
  let leftMax = 0, rightMax = 0, water = 0;
  while (left < right) {
    if (height[left] < height[right]) {
      leftMax = Math.max(leftMax, height[left]);
      water += leftMax - height[left];
      left++;
    } else {
      rightMax = Math.max(rightMax, height[right]);
      water += rightMax - height[right];
      right--;
    }
  }
  return water;
}
```

**Java:**
```java
int trap(int[] height) {
  int left = 0, right = height.length - 1;
  int leftMax = 0, rightMax = 0, water = 0;
  while (left < right) {
    if (height[left] < height[right]) {
      leftMax = Math.max(leftMax, height[left]);
      water += leftMax - height[left];
      left++;
    } else {
      rightMax = Math.max(rightMax, height[right]);
      water += rightMax - height[right];
      right--;
    }
  }
  return water;
}
```

**Key points:**
- Water above a bar equals min(leftMax, rightMax) - height.
- Moving the lower side is safe because its max is the binding constraint.
- The two-pointer form drops the O(n) space of the prefix-max arrays.

**Tags:** #algorithm

---

### 63. Sliding Window Maximum

**Difficulty:** Hard
**Topics:** sliding-window, monotonic-deque
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Given an array and a window size k, return the maximum of each contiguous window as it slides from left to right.

**Approach:** Maintain a deque of indices whose values are monotonically decreasing. Before pushing, pop smaller tail values (they can never be the max while the new element lives); pop the front once it falls outside the window. The front is always the current window max. Each index is pushed and popped once, so time O(n), space O(k). Useful for rolling-peak throughput monitoring on network links.

**Python:**
```python
from collections import deque

def max_sliding_window(nums: list[int], k: int) -> list[int]:
    dq: deque[int] = deque()
    res: list[int] = []
    for i, x in enumerate(nums):
        while dq and nums[dq[-1]] <= x:
            dq.pop()
        dq.append(i)
        if dq[0] <= i - k:
            dq.popleft()
        if i >= k - 1:
            res.append(nums[dq[0]])
    return res
```

**TypeScript:**
```typescript
function maxSlidingWindow(nums: number[], k: number): number[] {
  const dq: number[] = [];
  const res: number[] = [];
  for (let i = 0; i < nums.length; i++) {
    while (dq.length && nums[dq[dq.length - 1]] <= nums[i]) dq.pop();
    dq.push(i);
    if (dq[0] <= i - k) dq.shift();
    if (i >= k - 1) res.push(nums[dq[0]]);
  }
  return res;
}
```

**Java:**
```java
int[] maxSlidingWindow(int[] nums, int k) {
  Deque<Integer> dq = new ArrayDeque<>();
  int[] res = new int[nums.length - k + 1];
  int idx = 0;
  for (int i = 0; i < nums.length; i++) {
    while (!dq.isEmpty() && nums[dq.peekLast()] <= nums[i]) dq.pollLast();
    dq.offerLast(i);
    if (dq.peekFirst() <= i - k) dq.pollFirst();
    if (i >= k - 1) res[idx++] = nums[dq.peekFirst()];
  }
  return res;
}
```

**Key points:**
- Store indices, not values, so the front-expiry check is trivial.
- The deque stays monotonically decreasing, so the front is the window max.
- Amortized O(n): each index enters and leaves the deque at most once.

**Tags:** #algorithm

---

### 64. Find All Anagrams in a String

**Difficulty:** Medium
**Topics:** sliding-window, hash-table
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Given strings s and p, return the start indices of every substring of s that is an anagram of p.

**Approach:** Fixed-size sliding window of length `len(p)` over s with two 26-length frequency arrays. Slide by adding the incoming char and removing the outgoing one; when the window frequencies equal p's, record the start index. Time O(n), space O(1) (26 counters).

**Python:**
```python
def find_anagrams(s: str, p: str) -> list[int]:
    if len(p) > len(s):
        return []
    need = [0] * 26
    window = [0] * 26
    for c in p:
        need[ord(c) - 97] += 1
    res: list[int] = []
    for i, c in enumerate(s):
        window[ord(c) - 97] += 1
        if i >= len(p):
            window[ord(s[i - len(p)]) - 97] -= 1
        if window == need:
            res.append(i - len(p) + 1)
    return res
```

**TypeScript:**
```typescript
function findAnagrams(s: string, p: string): number[] {
  if (p.length > s.length) return [];
  const need = new Array(26).fill(0);
  const win = new Array(26).fill(0);
  const a = "a".charCodeAt(0);
  for (const c of p) need[c.charCodeAt(0) - a]++;
  const res: number[] = [];
  for (let i = 0; i < s.length; i++) {
    win[s.charCodeAt(i) - a]++;
    if (i >= p.length) win[s.charCodeAt(i - p.length) - a]--;
    if (i >= p.length - 1 && need.every((v, j) => v === win[j]))
      res.push(i - p.length + 1);
  }
  return res;
}
```

**Java:**
```java
List<Integer> findAnagrams(String s, String p) {
  List<Integer> res = new ArrayList<>();
  if (p.length() > s.length()) return res;
  int[] need = new int[26], win = new int[26];
  for (char c : p.toCharArray()) need[c - 'a']++;
  for (int i = 0; i < s.length(); i++) {
    win[s.charAt(i) - 'a']++;
    if (i >= p.length()) win[s.charAt(i - p.length()) - 'a']--;
    if (i >= p.length() - 1 && Arrays.equals(need, win))
      res.add(i - p.length() + 1);
  }
  return res;
}
```

**Key points:**
- Anagram equality reduces to equal character-frequency arrays.
- A fixed window means one add and one remove per step, no re-scan.
- Comparing 26-length arrays is O(1), keeping the whole pass O(n).

**Tags:** #algorithm

---

## Array / String

### 65. Binary Search

**Difficulty:** Easy
**Topics:** binary-search, array
**Position:** OD / SWE
**Years:** 13-14 (Junior)

**Question:** Given a sorted array and a target, return its index or -1 if absent.

**Approach:** Maintain `[lo, hi]` bounds, probe the midpoint, halve the range each step. Use `lo + (hi - lo) // 2` to avoid overflow (relevant in C/C++). Time O(log n), space O(1).

**Python:**
```python
def binary_search(nums: list[int], target: int) -> int:
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = lo + (hi - lo) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
```

**TypeScript:**
```typescript
function binarySearch(nums: number[], target: number): number {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}
```

**Java:**
```java
int binarySearch(int[] nums, int target) {
  int lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    int mid = lo + (hi - lo) / 2;
    if (nums[mid] == target) return mid;
    if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}
```

**Key points:**
- Halving the range yields O(log n) time, O(1) space.
- `lo + (hi - lo) / 2` prevents integer overflow that `(lo + hi) / 2` risks in C/C++/Java.

**Follow-ups:**
- Return the leftmost / rightmost insertion point (lower/upper bound).
- Search in a rotated sorted array.
- Search a value in an infinite/unbounded sorted stream.
- Implement it recursively and discuss stack usage.

**Tags:** #algorithm

---

### 66. Container With Most Water

**Difficulty:** Medium
**Topics:** array, two-pointer, greedy
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Given heights, pick two lines that with the x-axis form a container holding the most water. Return that maximum area.

**Approach:** Two pointers at both ends; area is `min(h[l], h[r]) * (r - l)`. Move the shorter side inward since it limits the area. Time O(n), space O(1).

**Python:**
```python
def max_area(height: list[int]) -> int:
    l, r, best = 0, len(height) - 1, 0
    while l < r:
        best = max(best, min(height[l], height[r]) * (r - l))
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
    best = Math.max(best, Math.min(height[l], height[r]) * (r - l));
    if (height[l] < height[r]) l++; else r--;
  }
  return best;
}
```

**Java:**
```java
int maxArea(int[] height) {
  int l = 0, r = height.length - 1, best = 0;
  while (l < r) {
    best = Math.max(best, Math.min(height[l], height[r]) * (r - l));
    if (height[l] < height[r]) l++; else r--;
  }
  return best;
}
```

**Key points:**
- Two-pointer sweep is O(n) time, O(1) space versus O(n^2) brute force.
- Moving the taller side can never increase area, so always move the shorter one.

**Tags:** #algorithm

---

### 67. 3Sum

**Difficulty:** Medium
**Topics:** array, two-pointer, sorting
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Find all unique triplets in an array that sum to zero.

**Approach:** Sort, then fix one index and run a two-pointer scan on the remainder, skipping duplicates at every level. Time O(n^2), space O(1) excluding output.

**Python:**
```python
def three_sum(nums: list[int]) -> list[list[int]]:
    nums.sort()
    res: list[list[int]] = []
    for i in range(len(nums) - 2):
        if i > 0 and nums[i] == nums[i - 1]:
            continue
        l, r = i + 1, len(nums) - 1
        while l < r:
            s = nums[i] + nums[l] + nums[r]
            if s < 0:
                l += 1
            elif s > 0:
                r -= 1
            else:
                res.append([nums[i], nums[l], nums[r]])
                l += 1
                r -= 1
                while l < r and nums[l] == nums[l - 1]:
                    l += 1
                while l < r and nums[r] == nums[r + 1]:
                    r -= 1
    return res
```

**TypeScript:**
```typescript
function threeSum(nums: number[]): number[][] {
  nums.sort((a, b) => a - b);
  const res: number[][] = [];
  for (let i = 0; i < nums.length - 2; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue;
    let l = i + 1, r = nums.length - 1;
    while (l < r) {
      const s = nums[i] + nums[l] + nums[r];
      if (s < 0) l++;
      else if (s > 0) r--;
      else {
        res.push([nums[i], nums[l], nums[r]]);
        l++; r--;
        while (l < r && nums[l] === nums[l - 1]) l++;
        while (l < r && nums[r] === nums[r + 1]) r--;
      }
    }
  }
  return res;
}
```

**Java:**
```java
List<List<Integer>> threeSum(int[] nums) {
  Arrays.sort(nums);
  List<List<Integer>> res = new ArrayList<>();
  for (int i = 0; i < nums.length - 2; i++) {
    if (i > 0 && nums[i] == nums[i - 1]) continue;
    int l = i + 1, r = nums.length - 1;
    while (l < r) {
      int s = nums[i] + nums[l] + nums[r];
      if (s < 0) l++;
      else if (s > 0) r--;
      else {
        res.add(Arrays.asList(nums[i], nums[l], nums[r]));
        l++; r--;
        while (l < r && nums[l] == nums[l - 1]) l++;
        while (l < r && nums[r] == nums[r + 1]) r--;
      }
    }
  }
  return res;
}
```

**Key points:**
- Sorting plus two-pointer scans gives O(n^2) time, O(1) extra space.
- Skipping duplicate values at each level is what keeps triplets unique.

**Tags:** #algorithm

---

### 68. Product of Array Except Self

**Difficulty:** Medium
**Topics:** array, prefix-product
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Return an array where each element is the product of all others, without division and in O(n).

**Approach:** Two sweeps — store prefix products left-to-right, then multiply by suffix products right-to-left using a running variable. Time O(n), space O(1) extra (output excluded).

**Python:**
```python
def product_except_self(nums: list[int]) -> list[int]:
    n = len(nums)
    out = [1] * n
    for i in range(1, n):
        out[i] = out[i - 1] * nums[i - 1]
    suffix = 1
    for i in range(n - 1, -1, -1):
        out[i] *= suffix
        suffix *= nums[i]
    return out
```

**TypeScript:**
```typescript
function productExceptSelf(nums: number[]): number[] {
  const n = nums.length, out = new Array(n).fill(1);
  for (let i = 1; i < n; i++) out[i] = out[i - 1] * nums[i - 1];
  let suffix = 1;
  for (let i = n - 1; i >= 0; i--) { out[i] *= suffix; suffix *= nums[i]; }
  return out;
}
```

**Java:**
```java
int[] productExceptSelf(int[] nums) {
  int n = nums.length;
  int[] out = new int[n];
  out[0] = 1;
  for (int i = 1; i < n; i++) out[i] = out[i - 1] * nums[i - 1];
  int suffix = 1;
  for (int i = n - 1; i >= 0; i--) { out[i] *= suffix; suffix *= nums[i]; }
  return out;
}
```

**Key points:**
- Two linear sweeps give O(n) time and O(1) extra space.
- Avoiding division is what makes it robust to zeros in the input.

**Tags:** #algorithm

---

### 69. Search in Rotated Sorted Array

**Difficulty:** Medium
**Topics:** binary-search, array
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** A sorted array was rotated at an unknown pivot. Find a target's index, or -1.

**Approach:** Modified binary search — at each midpoint one half is sorted; check whether the target lies within that sorted half to pick a side. Time O(log n), space O(1).

**Python:**
```python
def search(nums: list[int], target: int) -> int:
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = lo + (hi - lo) // 2
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
    const mid = lo + ((hi - lo) >> 1);
    if (nums[mid] === target) return mid;
    if (nums[lo] <= nums[mid]) {
      if (nums[lo] <= target && target < nums[mid]) hi = mid - 1; else lo = mid + 1;
    } else {
      if (nums[mid] < target && target <= nums[hi]) lo = mid + 1; else hi = mid - 1;
    }
  }
  return -1;
}
```

**Java:**
```java
int search(int[] nums, int target) {
  int lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    int mid = lo + (hi - lo) / 2;
    if (nums[mid] == target) return mid;
    if (nums[lo] <= nums[mid]) {
      if (nums[lo] <= target && target < nums[mid]) hi = mid - 1; else lo = mid + 1;
    } else {
      if (nums[mid] < target && target <= nums[hi]) lo = mid + 1; else hi = mid - 1;
    }
  }
  return -1;
}
```

**Key points:**
- Still O(log n) time, O(1) space despite the rotation.
- Decide which half is sorted first, then test the target against that half's bounds.

**Tags:** #algorithm

---

### 70. Find First and Last Position of Element

**Difficulty:** Medium
**Topics:** binary-search, array
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** In a sorted array find the first and last index of a target, or `[-1, -1]`.

**Approach:** Two binary searches for the lower and upper bound of the target. Time O(log n), space O(1).

**Python:**
```python
import bisect

def search_range(nums: list[int], target: int) -> list[int]:
    lo = bisect.bisect_left(nums, target)
    if lo == len(nums) or nums[lo] != target:
        return [-1, -1]
    hi = bisect.bisect_right(nums, target) - 1
    return [lo, hi]
```

**TypeScript:**
```typescript
function searchRange(nums: number[], target: number): number[] {
  const bound = (left: boolean): number => {
    let lo = 0, hi = nums.length, res = -1;
    while (lo < hi) {
      const mid = lo + ((hi - lo) >> 1);
      if (nums[mid] < target || (!left && nums[mid] === target)) lo = mid + 1;
      else hi = mid;
      if (nums[mid] === target) res = mid;
    }
    return res;
  };
  return [bound(true), bound(false)];
}
```

**Java:**
```java
int[] searchRange(int[] nums, int target) {
  int first = bound(nums, target, true);
  if (first == -1) return new int[] { -1, -1 };
  return new int[] { first, bound(nums, target, false) };
}

int bound(int[] nums, int target, boolean left) {
  int lo = 0, hi = nums.length - 1, res = -1;
  while (lo <= hi) {
    int mid = lo + (hi - lo) / 2;
    if (nums[mid] == target) { res = mid; if (left) hi = mid - 1; else lo = mid + 1; }
    else if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return res;
}
```

**Key points:**
- Two bounded binary searches keep it at O(log n) time, O(1) space.
- Lower and upper bound differ only in how ties move the pointer.

**Tags:** #algorithm

---

### 71. Merge Intervals

**Difficulty:** Medium
**Topics:** intervals, sorting
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Given intervals, merge all overlapping ones.

**Approach:** Sort by start; sweep, extending the last merged interval's end when the next overlaps, else append a new one. Time O(n log n), space O(n).

**Python:**
```python
def merge(intervals: list[list[int]]) -> list[list[int]]:
    intervals.sort()
    out: list[list[int]] = []
    for s, e in intervals:
        if out and s <= out[-1][1]:
            out[-1][1] = max(out[-1][1], e)
        else:
            out.append([s, e])
    return out
```

**TypeScript:**
```typescript
function merge(intervals: number[][]): number[][] {
  intervals.sort((a, b) => a[0] - b[0]);
  const out: number[][] = [];
  for (const [s, e] of intervals) {
    const last = out[out.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else out.push([s, e]);
  }
  return out;
}
```

**Java:**
```java
int[][] merge(int[][] intervals) {
  Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
  List<int[]> out = new ArrayList<>();
  for (int[] iv : intervals) {
    if (!out.isEmpty() && iv[0] <= out.get(out.size() - 1)[1])
      out.get(out.size() - 1)[1] = Math.max(out.get(out.size() - 1)[1], iv[1]);
    else out.add(iv);
  }
  return out.toArray(new int[0][]);
}
```

**Key points:**
- Sorting dominates at O(n log n) time; output is O(n) space.
- After sorting, overlap is a simple `start <= last_end` test.

**Tags:** #algorithm

---

### 72. Single Number

**Difficulty:** Easy
**Topics:** bit-manipulation, array
**Position:** OD / SWE
**Years:** 13-14 (Junior)

**Question:** Every element appears twice except one. Find the single one in O(n) time and O(1) space.

**Approach:** XOR all elements; pairs cancel to 0, leaving the unique value. Time O(n), space O(1).

**Python:**
```python
from functools import reduce
from operator import xor

def single_number(nums: list[int]) -> int:
    return reduce(xor, nums, 0)
```

**TypeScript:**
```typescript
function singleNumber(nums: number[]): number {
  return nums.reduce((acc, x) => acc ^ x, 0);
}
```

**Java:**
```java
int singleNumber(int[] nums) {
  int acc = 0;
  for (int x : nums) acc ^= x;
  return acc;
}
```

**Key points:**
- XOR is associative and self-inverse, giving O(n) time, O(1) space.
- No hash set or sorting required — pure bit manipulation.

**Tags:** #algorithm

---

### 73. Base-Station Coverage Merge (Telecom)

**Difficulty:** Medium
**Topics:** intervals, sorting, greedy
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Each base station covers a 1D segment `[start, end]` of a highway. Given all coverage segments, merge them into the minimal set of continuous covered ranges, then report total covered length (used to detect coverage gaps).

**Approach:** This is Merge Intervals in a telecom wrapper. Sort segments by start, sweep merging overlaps, and accumulate the merged lengths. Time O(n log n), space O(n).

**Python:**
```python
def covered_ranges(segments: list[list[int]]) -> tuple[list[list[int]], int]:
    segments.sort()
    merged: list[list[int]] = []
    for s, e in segments:
        if merged and s <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], e)
        else:
            merged.append([s, e])
    total = sum(e - s for s, e in merged)
    return merged, total
```

**TypeScript:**
```typescript
function coveredRanges(segments: number[][]): { merged: number[][]; total: number } {
  segments.sort((a, b) => a[0] - b[0]);
  const merged: number[][] = [];
  for (const [s, e] of segments) {
    const last = merged[merged.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else merged.push([s, e]);
  }
  const total = merged.reduce((sum, [s, e]) => sum + (e - s), 0);
  return { merged, total };
}
```

**Java:**
```java
int coveredLength(int[][] segments) {
  Arrays.sort(segments, (a, b) -> a[0] - b[0]);
  int total = 0, curStart = 0, curEnd = -1;
  for (int[] seg : segments) {
    if (seg[0] > curEnd) {
      if (curEnd >= curStart) total += curEnd - curStart;
      curStart = seg[0]; curEnd = seg[1];
    } else {
      curEnd = Math.max(curEnd, seg[1]);
    }
  }
  if (curEnd >= curStart) total += curEnd - curStart;
  return total;
}
```

**Key points:**
- Sorting plus a linear sweep is O(n log n) time, O(n) space.
- Gaps appear as breaks between merged ranges — exactly where coverage is missing.

**Tags:** #algorithm

---

### 74. 5G Resource-Block Allocation (Interval Scheduling)

**Difficulty:** Medium
**Topics:** greedy, intervals, activity-selection
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** A 5G carrier has one resource block per time slot. Given transmission requests each as `[start, end]`, schedule the maximum number of non-overlapping transmissions on that single block.

**Approach:** Classic activity selection — sort requests by end time, greedily pick each request whose start is ≥ the last chosen end. Time O(n log n), space O(1).

**Python:**
```python
def max_transmissions(requests: list[list[int]]) -> int:
    requests.sort(key=lambda r: r[1])
    count, last_end = 0, float("-inf")
    for start, end in requests:
        if start >= last_end:
            count += 1
            last_end = end
    return count
```

**TypeScript:**
```typescript
function maxTransmissions(requests: number[][]): number {
  requests.sort((a, b) => a[1] - b[1]);
  let count = 0, lastEnd = -Infinity;
  for (const [start, end] of requests) {
    if (start >= lastEnd) { count++; lastEnd = end; }
  }
  return count;
}
```

**Java:**
```java
int maxTransmissions(int[][] requests) {
  Arrays.sort(requests, (a, b) -> a[1] - b[1]);
  int count = 0, lastEnd = Integer.MIN_VALUE;
  for (int[] r : requests) {
    if (r[0] >= lastEnd) { count++; lastEnd = r[1]; }
  }
  return count;
}
```

**Key points:**
- Sorting by end time then greedy selection is O(n log n) time, O(1) extra space.
- Choosing the earliest finishing request leaves the most room for the rest — the exchange-argument proof of optimality.

**Tags:** #algorithm

---

### 75. Move Zeroes

**Difficulty:** Easy
**Topics:** array, two-pointers, in-place
**Position:** OD / SWE
**Years:** 13-14 (Junior)

**Question:** Given an integer array `nums`, move all `0`s to the end while keeping the relative order of the non-zero elements. Do it in place without making a copy.

**Approach:** Keep a write pointer `j` for the next non-zero slot. Scan with `i`; whenever `nums[i]` is non-zero, swap it into position `j` and advance `j`. Every non-zero keeps its order and zeros bubble to the tail. Time O(n), space O(1) — a common 机试 warm-up for pointer manipulation.

**Python:**
```python
def move_zeroes(nums: list[int]) -> None:
    j = 0
    for i in range(len(nums)):
        if nums[i] != 0:
            nums[i], nums[j] = nums[j], nums[i]
            j += 1
```

**TypeScript:**
```typescript
function moveZeroes(nums: number[]): void {
  let j = 0;
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] !== 0) {
      [nums[i], nums[j]] = [nums[j], nums[i]];
      j++;
    }
  }
}
```

**Java:**
```java
void moveZeroes(int[] nums) {
  int j = 0;
  for (int i = 0; i < nums.length; i++) {
    if (nums[i] != 0) {
      int tmp = nums[j]; nums[j] = nums[i]; nums[i] = tmp;
      j++;
    }
  }
}
```

**Key points:**
- The write pointer `j` counts non-zero elements seen so far, so swaps preserve relative order.
- Single pass, O(1) extra space; swapping (not just overwriting) avoids a second pass to zero-fill the tail.

**Tags:** #algorithm

---

### 76. Sort Colors

**Difficulty:** Medium
**Topics:** array, two-pointers, sorting
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Given an array containing only 0, 1, and 2 (representing red, white, and blue), sort it in place so that equal colors are adjacent and ordered red, white, blue, without using a library sort function.

**Approach:** Dutch national flag problem, three pointers in a single pass. `low` marks where the next 0 goes, `high` marks where the next 2 goes, and `i` is the scanning pointer. On 0, swap with `low` and advance both; on 2, swap with `high` and move `high` left (keep `i` to re-check the swapped-in value); on 1, advance `i`. Time O(n), space O(1).

**Python:**
```python
from typing import List

def sort_colors(nums: List[int]) -> None:
    low, i, high = 0, 0, len(nums) - 1
    while i <= high:
        if nums[i] == 0:
            nums[low], nums[i] = nums[i], nums[low]
            low += 1
            i += 1
        elif nums[i] == 2:
            nums[high], nums[i] = nums[i], nums[high]
            high -= 1
        else:
            i += 1
```

**TypeScript:**
```typescript
function sortColors(nums: number[]): void {
  let low = 0, i = 0, high = nums.length - 1;
  while (i <= high) {
    if (nums[i] === 0) {
      [nums[low], nums[i]] = [nums[i], nums[low]];
      low++;
      i++;
    } else if (nums[i] === 2) {
      [nums[high], nums[i]] = [nums[i], nums[high]];
      high--;
    } else {
      i++;
    }
  }
}
```

**Java:**
```java
static void sortColors(int[] nums) {
    int low = 0, i = 0, high = nums.length - 1;
    while (i <= high) {
        if (nums[i] == 0) {
            int t = nums[low]; nums[low] = nums[i]; nums[i] = t;
            low++;
            i++;
        } else if (nums[i] == 2) {
            int t = nums[high]; nums[high] = nums[i]; nums[i] = t;
            high--;
        } else {
            i++;
        }
    }
}
```

**Key points:**
- When swapping in a 2, do not advance `i`; re-check the value that was swapped in.
- The loop condition `i <= high` works because elements past `high` are already placed.
- Single pass with constant space beats the two-pass counting approach.

**Tags:** #algorithm

---

### 77. Longest Palindromic Substring

**Difficulty:** Medium
**Topics:** string, two-pointers, dynamic-programming
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Given a string `s`, return the longest contiguous substring of `s` that is a palindrome.

**Approach:** Expand around center: every palindrome has a center that is either a single character (odd length) or a gap between two characters (even length). For each of the `2n-1` centers, expand outward while characters match and track the widest span. Time O(n^2), space O(1) — simpler than Manacher's O(n) and sufficient for interview inputs.

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
  return s.substring(start, end + 1);
}
```

**Java:**
```java
String longestPalindrome(String s) {
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

int[] expand(String s, int l, int r) {
  while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) { l--; r++; }
  return new int[] { l + 1, r - 1 };
}
```

**Key points:**
- Check both odd (`i, i`) and even (`i, i+1`) centers to cover all palindromes.
- After the loop `expand` overshoots by one on each side, so the valid span is `[l+1, r-1]`.

**Tags:** #algorithm

---

## System Design

### 78. Design a Telecom Billing System

**Difficulty:** Hard
**Topics:** system-design, billing, streaming, consistency, big-data
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Design a carrier-grade billing system that meters calls, SMS, and data usage for hundreds of millions of subscribers and produces accurate monthly invoices.

**Approach:** Usage events (CDRs — call detail records) stream from network elements into a high-throughput ingestion layer (Kafka). A rating engine applies tariff plans (per-second voice, per-MB data, promotions) to each event and writes priced events to a usage store partitioned by subscriber. An aggregation pipeline rolls usage into billing-cycle buckets; invoicing runs at cycle close. Critical trade-offs: exactly-once vs at-least-once with idempotent dedup on CDR id (double-charging is unacceptable); near-real-time balance for prepaid (low-latency in-memory counters with periodic reconciliation) vs batch for postpaid; auditability (immutable event log, every charge traceable). Discuss late/out-of-order CDRs, tariff versioning, and reconciliation against the network's own counters to catch revenue leakage.

**Tags:** #system-design

---

### 79. Design HarmonyOS Distributed Soft Bus / Cross-Device Data Sync

**Difficulty:** Hard
**Topics:** system-design, distributed, sync, iot
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Design HarmonyOS's distributed soft bus that lets multiple nearby devices (phone, tablet, TV, watch) discover each other and share state/data as if they were one logical device.

**Approach:** Layers: (1) device discovery over multiple transports (BLE, Wi-Fi, NFC) with a unified addressing scheme; (2) a secure session/authentication layer (device certificates, trust ring) so only the user's own devices join; (3) a transport-abstraction "soft bus" that picks the best physical link and hides handoff (e.g., BLE → Wi-Fi Direct as bandwidth needs grow); (4) a distributed data object layer offering eventually-consistent shared state with conflict resolution. Trade-offs: consistency vs availability under intermittent connectivity (favor AP, use CRDTs or last-writer-wins with vector clocks); latency vs power (BLE is low-power but slow); security (every cross-device call must be authenticated and encrypted). Discuss seamless app migration (state serialized and rehydrated on the target device) and partition healing when a device rejoins.

**Tags:** #system-design

---

### 80. Design a 5G Base-Station OTA Firmware Update System

**Difficulty:** Hard
**Topics:** system-design, ota, rollout, reliability, ops
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Design a system to push over-the-air firmware updates to millions of 5G base stations safely, without dropping live carrier traffic.

**Approach:** Central release service stores signed firmware artifacts in object storage behind a CDN; base stations pull (not push) to avoid inbound firewall issues. Staged rollout: canary → small region → progressive waves, with automated health gates (KPIs: dropped-call rate, throughput, error logs) between waves and automatic halt/rollback on regression. Each station applies updates in an A/B partition scheme — write to the inactive slot, verify checksum + signature, atomic switch, watchdog auto-reverts to slot A if the new image fails to come up. Trade-offs: bandwidth vs speed (delta/differential updates to cut payload), maintenance windows vs continuous service (drain traffic to neighbor cells before reboot), and security (signed images, anti-rollback version counters). Discuss idempotent retries for flaky links and a campaign dashboard tracking per-station state.

**Tags:** #system-design

---

### 81. Design a CDN

**Difficulty:** Hard
**Topics:** system-design, cdn, caching, dns, cloud
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Design a content delivery network that serves static assets (and video) to global users with low latency.

**Approach:** Hierarchy of edge PoPs (points of presence) backed by regional mid-tier caches and the origin. Request routing via anycast or DNS-based geo-routing sends users to the nearest healthy edge. Cache strategy: LRU/LFU eviction, TTL plus origin revalidation (ETag / If-None-Match), and cache-key normalization. Cache miss → pull from mid-tier → origin (cache-fill), with request collapsing to prevent a thundering herd on a cold popular object. Trade-offs: consistency vs freshness (TTL tuning, explicit purge/invalidation API), storage cost vs hit ratio, and handling cache stampedes. Discuss large-file/video segment caching (HLS/DASH chunks), signed URLs for access control, and origin shielding to protect the origin during traffic spikes.

**Tags:** #system-design

---

### 82. Design a Distributed Message Queue

**Difficulty:** Hard
**Topics:** system-design, messaging, replication, ordering
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Design a Kafka-like distributed message queue supporting high-throughput publish/subscribe with durability and ordering guarantees.

**Approach:** Topics split into partitions; each partition is an append-only log replicated across brokers with a leader and followers (ISR — in-sync replicas). Producers append to the leader; consumers track their own offsets and pull. Ordering is guaranteed within a partition only. Durability via replication factor and configurable acks (ack=all waits for ISR). Trade-offs: throughput vs durability (acks and fsync policy), ordering vs parallelism (more partitions = more parallelism but only per-partition order), and at-least-once vs exactly-once (idempotent producers + transactional commits). Discuss consumer groups and rebalancing, retention (time/size-based log compaction), back-pressure, and how a leader election (via a coordination service like ZooKeeper/Raft) handles broker failure.

**Tags:** #system-design

---

### 83. Design Huawei Cloud Object Storage (OBS)

**Difficulty:** Hard
**Topics:** system-design, blob-storage, erasure-coding, consistency, cloud
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Design Huawei Cloud OBS — an S3-compatible object storage service.

**Approach:** S3-compatible API front end → metadata service (sharded by bucket+key, strongly consistent within a region via a consensus group) → storage layer using erasure coding (e.g., Reed-Solomon 10+4) striped across nodes/racks/AZs for durability with ~1.4x overhead vs 3x replication. Multipart upload for large objects; lifecycle policies tier cold data to archive storage. Trade-offs: erasure coding (storage-efficient, higher CPU/network on reconstruction) vs replication (simpler, faster reads, costlier); strong vs eventual consistency for cross-region replication (async for DR). Discuss hot-key handling (CDN + read replicas), background scrubbing/repair for bit-rot, signed URLs for access control, and an 11-nines durability target via redundancy and continuous integrity checks.

**Tags:** #system-design

---

### 84. Design a Real-Time IoT Device Management Platform

**Difficulty:** Hard
**Topics:** system-design, iot, mqtt, time-series, big-data, ops
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Design a platform to connect, monitor, and control tens of millions of IoT devices (sensors, smart meters) in real time.

**Approach:** Devices connect over MQTT (lightweight, pub/sub, QoS levels) through a horizontally scaled connection gateway that maintains millions of persistent connections (epoll-based, connection state in a distributed store). Telemetry flows into a stream processor → time-series database (downsampling, retention tiers); commands flow device-bound via per-device topics. A device registry/shadow holds desired vs reported state so control works even when a device is briefly offline (reconciles on reconnect). Trade-offs: MQTT QoS 0/1/2 (delivery guarantee vs overhead), push vs poll for commands, and connection density vs per-connection cost. Discuss firmware OTA (reuse Q49 patterns), authentication (per-device certs), rate limiting against misbehaving fleets, and partitioning telemetry by device id for scale.

**Tags:** #system-design

---

### 85. Design a High-Availability Database for Carrier Networks

**Difficulty:** Hard
**Topics:** system-design, database, replication, consensus
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Design a high-availability database backing carrier subscriber data (HLR/HSS-style) that must meet five-nines (99.999%) availability.

**Approach:** Synchronous replication across nodes within a region using a consensus protocol (Raft/Paxos) so a quorum survives single-node failure with no data loss (RPO=0). Multiple replicas across AZs; automatic leader election on failure keeps writes available within seconds (low RTO). For geo-DR, asynchronous replication to a remote region. Reads scale via follower reads (accepting slight staleness) or read-your-writes routing to the leader. Trade-offs: synchronous (strong consistency, higher write latency) vs asynchronous (faster, risk of data loss), and CAP positioning — carrier data favors CP within a region. Discuss schema for subscriber lookups (sharding by IMSI/subscriber id), connection pooling for massive concurrency, online schema changes without downtime, and rigorous failover drills since five-nines allows only ~5 minutes of downtime per year.

**Tags:** #system-design

---

### 86. Design a Distributed SQL Database (GaussDB-style)

**Difficulty:** Hard
**Topics:** system-design, distributed, database, consensus, transactions
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Design a horizontally scalable distributed relational database that supports ACID transactions and standard SQL across many nodes, as needed for a cloud offering like GaussDB.

**Approach:** Separate the SQL/compute layer (parse, plan, distributed execution) from the storage layer (storage-compute separation, a cloud-native pattern). Shard data by primary key using hash or range partitioning; each shard is a replication group kept consistent and highly available via Raft/Paxos (leader handles writes, followers serve consistent reads and take over on failure). Provide snapshot isolation with MVCC and a global timestamp source (a TSO or hybrid logical clocks) so reads see a consistent snapshot without blocking writers. Cross-shard transactions use two-phase commit coordinated on top of per-shard Raft for atomicity. Key trade-offs: strong consistency vs latency (cross-region commits pay round-trips — consider follower reads and colocating related rows), range vs hash sharding (range enables range scans but risks hotspots; hash spreads load but scatters scans), and online resharding/rebalancing when a shard grows hot. Discuss failure recovery via Raft leader election, distributed deadlock detection, and how the query planner pushes predicates down to storage to cut data movement.

**Tags:** #system-design

---

### 87. Design a 5G Network Slicing Management System

**Difficulty:** Hard
**Topics:** system-design, 5g, orchestration, sla, telecom
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Design a system that creates and manages 5G network slices — logical end-to-end networks (RAN + transport + core) each with its own SLA — for different tenants and service types.

**Approach:** A slice is an isolated logical network spanning the radio access network, transport, and 5G core, tailored to a service class: eMBB (high bandwidth), URLLC (ultra-low latency, e.g. industrial control / autonomous driving), and mMTC (massive IoT). Architecture layers: a slice management function (NSMF) that translates a tenant SLA into subnet requirements handed to subnet managers (NSSMF) for RAN/transport/core; a resource orchestrator that allocates and isolates compute, spectrum, and bandwidth (via NFV/SDN); and a closed-loop automation layer that ingests per-slice telemetry, detects SLA violations, and auto-scales or reconfigures. Lifecycle: design, instantiate, activate, monitor, scale, terminate. Key trade-offs: hard isolation (dedicated resources, strong guarantees, low utilization) vs soft isolation (shared resources with QoS priority, higher utilization but risk of noisy neighbors); centralized vs distributed control (control-plane latency); and static allocation vs AI-driven dynamic reallocation. Discuss multi-tenancy and security isolation between slices, per-slice metering/billing, and how KPIs (latency, throughput, availability) feed the closed loop.

**Tags:** #system-design

---

### 88. Design a Real-Time Telemetry and Fault-Detection System for Carrier Network Devices

**Difficulty:** Hard
**Topics:** system-design, telemetry, streaming, monitoring, reliability
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Design a system that collects real-time telemetry from millions of carrier network devices (routers, switches, base stations) and detects faults fast enough to protect SLAs.

**Approach:** Prefer streaming telemetry (model-driven, gNMI/gRPC push at sub-second intervals) over legacy SNMP polling — push scales better and gives fresh data without a polling storm. Devices stream metrics into a horizontally scalable ingestion tier (Kafka), partitioned by device/region. A stream processor (Flink/Spark Streaming) computes rolling aggregates, threshold and anomaly detection (baseline plus statistical/ML models), and writes to a time-series database with tiered retention (raw for hours, downsampled roll-ups for long-term). A correlation/root-cause engine groups related alarms to fight alarm storms (one fiber cut can trigger thousands of downstream alerts) and drives a closed-loop remediation workflow. Key trade-offs: push vs pull (freshness and scale vs simplicity), cardinality explosion (per-interface/per-device tags — control label cardinality and pre-aggregate), storage cost vs resolution (downsampling), and latency vs accuracy of detection (fast thresholds for hard faults, slower ML for subtle degradation). Ensure the monitoring plane itself is HA and independent of the network it watches, so an outage does not blind the operators.

**Tags:** #system-design

---

## Behavioral

### 89. Tell me about embracing the 奋斗者 (dedicator) culture

**Difficulty:** Medium
**Topics:** behavioral, culture, dedication
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Huawei is known for its 奋斗者 ("dedicator/striver") culture. Tell me about a time you went well beyond what was expected to deliver a result.

**Approach:** Huawei probes genuine drive without sounding performative. Use STAR: pick a real situation where you took on extra scope or pushed through a hard problem (not just "I worked late"). Show (1) the concrete challenge and stakes, (2) the specific extra effort and ownership you took, (3) that you worked smart, not only hard — you prioritized and made trade-offs, (4) a measurable result and what you learned. Be honest about sustainability; strong candidates show dedication plus judgment, not burnout for its own sake.

**Tags:** #behavioral

---

### 90. Time you delivered under a high-pressure deadline

**Difficulty:** Medium
**Topics:** behavioral, pressure, delivery
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Describe a time you had to deliver a critical feature or fix under intense time pressure. How did you handle it?

**Approach:** Show composure and prioritization. STAR: (1) the deadline and why it mattered (customer commitment, launch, outage), (2) how you triaged — scoped to the must-haves, negotiated cut lines, parallelized work, (3) how you kept quality acceptable under pressure (focused testing on the risky paths, clear communication of trade-offs), (4) the outcome and a retro insight. Avoid stories where the crunch was caused by your own poor planning unless you own that lesson explicitly.

**Tags:** #behavioral

---

### 91. Cross-team collaboration in a large organization

**Difficulty:** Medium
**Topics:** behavioral, collaboration, communication
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Huawei is a very large org with many product lines. Tell me about a time you had to align multiple teams with conflicting priorities to ship something.

**Approach:** Show you can navigate scale and ambiguity. STAR: (1) the cross-team dependency and the conflict (different OKRs, ownership gaps), (2) how you built alignment early — shared goals, a clear interface/contract, regular sync, (3) how you escalated constructively when needed (with options, not just complaints), (4) the delivered result and the relationship you preserved for future work. Emphasize empathy for the other team's constraints.

**Tags:** #behavioral

---

### 92. Why Huawei

**Difficulty:** Easy
**Topics:** behavioral, motivation, fit
**Position:** OD / SWE
**Years:** 13-14 (Junior)

**Question:** Why do you want to join Huawei specifically, and which business line interests you?

**Approach:** Be specific and informed. Pick a genuine reason: (1) a technical domain Huawei leads (5G/wireless, HarmonyOS, carrier networks, Huawei Cloud, Ascend AI chips), (2) the scale and hard engineering problems (carrier-grade reliability, global deployment), (3) the chance to work close to hardware/systems. Name a concrete BG/team and tie it to your background. Avoid generic answers ("big company", "good pay"); show you understand Huawei's R&D-heavy, long-term-investment engineering culture.

**Tags:** #behavioral

---

### 93. Tell me about a time you put the customer first (customer-centricity)

**Difficulty:** Medium
**Topics:** behavioral, customer-centric, star, ownership
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Huawei's core value is customer-centricity. Tell me about a time you went beyond your defined scope to solve a real customer problem, and what the outcome was.

**Approach:** Use STAR and pick a story where the customer's actual need — not just the written ticket — drove your action. Situation: name the customer (internal or external), the pain, and the business stakes (e.g. a carrier customer facing recurring downtime that threatened SLA penalties). Task: your responsibility and why the default response was insufficient. Action: describe how you dug into the real root cause, engaged the customer directly to understand their scenario, and did the extra work — reproducing the issue in their environment, shipping a targeted fix, or pushing back on a plan that looked good internally but hurt the customer. Emphasize concrete steps and any short-term cost you absorbed for the customer's long-term benefit (long-termism). Result: quantify it — downtime reduced, SLA restored, renewed trust, follow-on business. Close with the lesson: solving the customer's underlying problem, not just closing the ticket, is what customer-centricity means in practice. Keep it honest and specific; interviewers probe for what you personally did versus the team.

**Tags:** #behavioral

---

### 94. Tell me about a failure and your self-criticism

**Difficulty:** Medium
**Topics:** behavioral, self-criticism, star, growth
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Huawei values self-criticism as a driver of improvement. Describe a significant mistake or failure you owned, how you critically examined it, and what changed afterward.

**Approach:** Use STAR and choose a real failure with genuine stakes — not a humble-brag. Situation: the context and what was at risk (e.g. you pushed a change that caused a production incident, or you underestimated a dependency and slipped a delivery). Task: your specific responsibility. Action: this is the heart of self-criticism — own your part without deflecting to others or circumstances. Explain how you led or participated in an honest post-mortem, identified the true root cause including your own decision-making gaps (skipped a review, over-optimistic estimate, poor communication), and separated blameless system fixes from personal lessons. Result: the concrete changes — a new test gate, a checklist, a habit of surfacing risks earlier — and evidence they worked (no recurrence, faster/safer delivery afterward). Close by framing self-criticism as continuous improvement, not self-punishment: the goal is a stronger process and a better version of yourself. Interviewers want maturity, ownership, and demonstrated change — avoid a fake weakness or blaming the team.

**Tags:** #behavioral

---

## Domain Knowledge

### 95. C/C++ Memory Management and Pointers

**Difficulty:** Hard
**Topics:** domain-knowledge, c-cpp, memory, pointers
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Explain how memory is managed in C/C++. What are common pointer/memory bugs and how do you prevent or debug them?

**Approach:** Cover the memory regions: stack (automatic, LIFO, fast, limited), heap (`malloc`/`free`, `new`/`delete`, manual lifetime), static/global, and code. Key bugs: (1) memory leak — heap freed never; (2) dangling pointer — use after `free`/`delete`; (3) double free; (4) buffer overflow (writing past array bounds — a classic security hole); (5) uninitialized pointer; (6) mismatched `new[]`/`delete[]`. Prevention in modern C++: RAII, smart pointers (`unique_ptr` for sole ownership, `shared_ptr` with reference counting, `weak_ptr` to break cycles), containers over raw arrays, and `const`-correctness. Debugging tools: Valgrind / AddressSanitizer (ASan) for leaks and overflows, static analyzers. Mention that `shared_ptr` cycles still leak (need `weak_ptr`), and that ASan catches use-after-free at runtime. Huawei machine tests and interviews lean heavily on this.

**Tags:** #domain-knowledge

---

### 96. TCP/IP Networking Deep Dive

**Difficulty:** Hard
**Topics:** domain-knowledge, networking, tcp, protocols
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Walk through the TCP three-way handshake and connection teardown, and explain how TCP provides reliability and flow/congestion control.

**Approach:** Handshake: SYN → SYN-ACK → ACK establishes sequence numbers and the connection (3 segments). Teardown: four-way FIN/ACK exchange, with TIME_WAIT on the initiator to absorb stray packets (2·MSL). Reliability: sequence numbers + cumulative ACKs + retransmission on timeout (RTO, computed from RTT estimates) or fast retransmit on 3 duplicate ACKs. Flow control: the receiver advertises a window (rwnd) so a fast sender can't overwhelm a slow receiver. Congestion control: sender-side cwnd with slow start (exponential), congestion avoidance (linear/AIMD), and reaction to loss (CUBIC, BBR). Contrast with UDP (connectionless, no reliability/ordering — used for real-time/VoIP). Be ready to discuss head-of-line blocking, Nagle's algorithm, and why high-RTT links hurt throughput (bandwidth-delay product, window scaling). Huawei carrier/networking roles drill this deeply.

**Tags:** #domain-knowledge

---

### 97. Linux Processes, Threads, and IPC

**Difficulty:** Hard
**Topics:** domain-knowledge, linux, concurrency, ipc
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Explain the difference between a process and a thread in Linux, and compare the main inter-process communication (IPC) mechanisms.

**Approach:** A process has its own address space (created via `fork`, which copies-on-write); threads share the process address space (created via `pthread_create` / `clone` with shared flags) so context switches and communication are cheaper but require synchronization. Threads share heap/globals/file descriptors but have private stacks and registers. IPC mechanisms and trade-offs: pipes/FIFOs (simple byte streams, related or named), message queues (structured, kernel-buffered), shared memory (fastest — no copy — but needs explicit synchronization via semaphores/mutexes), semaphores (signaling/counting), sockets (work across machines too), and signals (async notification, limited payload). Synchronization primitives: mutex, spinlock (busy-wait, good for very short critical sections), condition variable, read-write lock. Discuss race conditions, deadlock (and the four Coffman conditions), and why shared memory + semaphore is the high-performance choice carriers often use. Mention `epoll` for scalable I/O multiplexing.

**Tags:** #domain-knowledge

---

### 98. Operating System Concepts

**Difficulty:** Hard
**Topics:** domain-knowledge, operating-systems, scheduling, memory
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Explain virtual memory and paging, and describe how CPU scheduling works in a modern OS.

**Approach:** Virtual memory gives each process a private linear address space mapped to physical frames via page tables; the MMU translates addresses, and a TLB caches recent translations. A page fault triggers loading from disk (demand paging); when memory is full the OS evicts a page using a replacement policy (LRU approximations like the clock algorithm). Benefits: isolation, more apparent memory than physical, and easy sharing (shared libraries). Thrashing happens when the working set exceeds RAM. Scheduling: the scheduler multiplexes the CPU among ready threads — policies include round-robin, priority, and Linux's CFS (Completely Fair Scheduler) which uses a red-black tree keyed by virtual runtime to approximate fair sharing. Discuss preemptive vs cooperative, context-switch cost, real-time scheduling classes (SCHED_FIFO/RR for deterministic latency — relevant for telecom/embedded), and the trade-off between throughput and latency/fairness. Tie back to why embedded/carrier systems often need real-time guarantees.

**Tags:** #domain-knowledge

---

### 99. Hash Tables vs Balanced Trees

**Difficulty:** Medium
**Topics:** domain-knowledge, data-structures, hash-tables, trees
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Compare hash tables and balanced binary search trees: their internals, complexity, and when you would choose one over the other.

**Approach:** Hash table: maps keys to buckets via a hash function; average O(1) lookup/insert/delete, but O(n) worst case if many collisions. Collision handling — separate chaining (linked list / tree per bucket, e.g. Java's HashMap treeifies long buckets to O(log n)) vs open addressing (linear/quadratic probing, robin-hood — better cache locality, needs a good load factor and tombstones for deletes). Resize/rehash when load factor exceeds a threshold (amortized O(1)). No ordering; iteration order is arbitrary. Balanced BST (red-black / AVL / B-tree): keeps keys sorted, O(log n) lookup/insert/delete guaranteed (no bad worst case), supports ordered operations — range queries, successor/predecessor, in-order traversal, floor/ceil. AVL is more strictly balanced (faster reads), red-black rebalances less (faster writes); B-trees are the disk/DB variant (high fanout, few I/Os). When to choose: hash table for pure key-value lookups where order doesn't matter and you want the fastest average access (caches, dedup, equality indexes); balanced tree when you need ordering, range scans, or a hard worst-case guarantee (schedulers, database indexes, std::map vs std::unordered_map). Mention hash quality / DoS via crafted collisions and why databases use B-trees over hash indexes for range queries.

**Tags:** #domain-knowledge

---

### 100. Compilation Phases

**Difficulty:** Medium
**Topics:** domain-knowledge, compilers, parsing, code-generation
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Walk through the phases a compiler goes through to turn source code into an executable, and what each phase produces.

**Approach:** Front end: (1) Lexical analysis (scanner) turns the character stream into tokens (identifiers, keywords, literals, operators), discarding whitespace/comments; typically driven by regular expressions / finite automata. (2) Syntax analysis (parser) checks tokens against the language grammar (context-free grammar) and builds a parse tree / abstract syntax tree (AST); LL or LR parsing. (3) Semantic analysis: type checking, scope/name resolution, building the symbol table, catching errors like undeclared variables or type mismatches. Middle: (4) Intermediate representation (IR) generation — a machine-independent form (three-address code, LLVM IR) enabling portable optimization. (5) Optimization — machine-independent transforms: constant folding, dead-code elimination, common-subexpression elimination, loop-invariant hoisting, inlining. Back end: (6) Code generation lowers IR to target machine/assembly code, with instruction selection, register allocation, and instruction scheduling. (7) Machine-specific (peephole) optimization, then assembly and linking. Distinguish the front end (language-dependent) from the back end (target-dependent) — the IR is the decoupling point that lets one front end target many architectures (the LLVM model). Mention static vs dynamic (JIT) compilation and interpreters as contrast.

**Tags:** #domain-knowledge

