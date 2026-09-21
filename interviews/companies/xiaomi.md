# Xiaomi (小米)

```yaml
company: Xiaomi (小米) — MIUI/HyperOS, Mi Home IoT, Mi.com e-commerce, smartphones, AIoT
typical_rounds: 2-3 technical rounds + 1 HR round (algorithm + Android/embedded domain depth depending on role)
focus_areas: algorithms, Android framework internals, embedded C/IoT, high-concurrency backend (flash-sale), system design
languages_allowed: Java/Kotlin (Android), C/C++ (embedded/IoT), Python; algorithm round in any major language
duration: 45-60 min per round
notable_quirks:
  - Strong Android-framework depth probed for client roles (Activity lifecycle, Binder IPC, Handler/Looper)
  - Embedded/IoT C and RTOS basics probed for device/firmware roles
  - Flash-sale / high-concurrency (抢购/秒杀) system design common for backend roles
  - Cost-and-efficiency product mindset (性价比 / cost-performance) probed in behavioral
  - Fast hardware+software release cadence — values pragmatic, ship-fast engineers
  - "为发烧而生" (born for fans) and "感动人心、价格厚道" culture comes up
sources: LeetCode Discuss (xiaomi tag), 牛客网 (NowCoder), 1point3acres, Glassdoor
```

## Overview

Xiaomi's loop blends a standard algorithm bar with deep role-specific domain probing: client interviews drill Android framework internals (lifecycle, Binder, Handler/Looper, JVM/ART), device roles drill embedded C and RTOS, and backend roles drill high-concurrency design centered on Mi.com flash sales (秒杀/抢购) and the Mi Home AIoT platform connecting hundreds of millions of devices. Candidates are often surprised by how much the loop values pragmatic, cost-efficient, ship-fast engineering ("性价比" thinking) rather than purely theoretical depth. Over-prepare on Android internals (client), embedded/RTOS (device), and flash-sale + IoT telemetry system design (backend); under-prepare on exotic algorithms — the algorithm bar is solid-LeetCode-medium, not contest-hard.

## Linked List

### 1. Merge Two Sorted Lists

**Difficulty:** Easy
**Topics:** linked-list, two-pointer
**Position:** Backend SWE
**Years:** L8-L9

**Question:** Merge two sorted linked lists into one sorted list by splicing nodes together.

**Approach:** Dummy head, walk both lists picking the smaller node each step, then attach the remaining tail. Time O(n + m), space O(1).

**Python:**
```python
class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val, self.next = val, next

def merge_two_lists(a: ListNode | None, b: ListNode | None) -> ListNode | None:
    dummy = tail = ListNode()
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
class ListNode { int val; ListNode next; ListNode(int v) { val = v; } }

ListNode mergeTwoLists(ListNode a, ListNode b) {
  ListNode dummy = new ListNode(0), tail = dummy;
  while (a != null && b != null) {
    if (a.val <= b.val) { tail.next = a; a = a.next; }
    else { tail.next = b; b = b.next; }
    tail = tail.next;
  }
  tail.next = (a != null) ? a : b;
  return dummy.next;
}
```

**Key points:**
- Dummy head removes special-casing the first node; O(n + m) time, O(1) extra space.
- Attach the non-empty remainder in one step at the end.

**Follow-ups:**
- Merge k sorted lists — min-heap or divide and conquer.
- Merge in descending order — flip the comparison.
- Lists are doubly linked — also fix `prev` pointers.

**Tags:** #algorithm

---

### 2. Reverse Linked List

**Difficulty:** Easy
**Topics:** linked-list
**Position:** Embedded Engineer
**Years:** L8-L9

**Question:** Reverse a singly linked list and return the new head.

**Approach:** Iterate flipping each `next` pointer, keeping a `prev` that becomes the new head. Time O(n), space O(1).

**Python:**
```python
class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val, self.next = val, next

def reverse_list(head: ListNode | None) -> ListNode | None:
    prev = None
    while head:
        head.next, prev, head = prev, head, head.next
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
    const next = head.next;
    head.next = prev;
    prev = head;
    head = next;
  }
  return prev;
}
```

**Java:**
```java
class ListNode { int val; ListNode next; ListNode(int v) { val = v; } }

ListNode reverseList(ListNode head) {
  ListNode prev = null;
  while (head != null) {
    ListNode next = head.next;
    head.next = prev;
    prev = head;
    head = next;
  }
  return prev;
}
```

**Key points:**
- Iterative reversal is O(n) time and O(1) space.
- Save `next` before overwriting the pointer to avoid losing the rest.

**Tags:** #algorithm

---

### 3. Linked List Cycle

**Difficulty:** Easy
**Topics:** linked-list, two-pointer, floyd
**Position:** Backend SWE
**Years:** L8-L9

**Question:** Determine whether a singly linked list contains a cycle.

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
- Floyd's two-pointer cycle detection is O(n) time and O(1) space.
- A null `fast`/`fast.next` proves the list terminates (no cycle).

**Tags:** #algorithm

---

### 4. Remove Nth Node From End of List

**Difficulty:** Medium
**Topics:** linked-list, two-pointer
**Position:** Backend SWE
**Years:** L8-L9

**Question:** Remove the n-th node from the end of a singly linked list and return the head.

**Approach:** Two pointers from a dummy head; advance `fast` by n+1, then move both until `fast` is null. `slow` lands just before the target. One pass, O(n) time, O(1) space.

**Python:**
```python
class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val, self.next = val, next

def remove_nth_from_end(head: ListNode | None, n: int) -> ListNode | None:
    dummy = ListNode(0, head)
    fast = slow = dummy
    for _ in range(n + 1):
        fast = fast.next
    while fast:
        fast, slow = fast.next, slow.next
    slow.next = slow.next.next
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
ListNode removeNthFromEnd(ListNode head, int n) {
  ListNode dummy = new ListNode(0);
  dummy.next = head;
  ListNode fast = dummy, slow = dummy;
  for (int i = 0; i < n + 1; i++) fast = fast.next;
  while (fast != null) { fast = fast.next; slow = slow.next; }
  slow.next = slow.next.next;
  return dummy.next;
}
```

**Key points:**
- Single pass with a fixed gap of n+1 gives O(n) time, O(1) space.
- Dummy head cleanly handles removing the actual first node.

**Tags:** #algorithm

---

### 5. Merge k Sorted Lists

**Difficulty:** Hard
**Topics:** linked-list, heap, divide-and-conquer
**Position:** Senior SWE
**Years:** L10-L11

**Question:** Merge `k` sorted linked lists into one sorted list.

**Approach:** Push each list's head into a min-heap keyed by value; repeatedly pop the smallest and push its successor. With N total nodes, time O(N log k), space O(k).

**Python:**
```python
import heapq

class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val, self.next = val, next

def merge_k_lists(lists: list[ListNode | None]) -> ListNode | None:
    heap = [(node.val, i, node) for i, node in enumerate(lists) if node]
    heapq.heapify(heap)
    dummy = tail = ListNode()
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
  const nodes: ListNode[] = [];
  for (const l of lists) { let n = l; while (n) { nodes.push(n); n = n.next; } }
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
ListNode mergeKLists(ListNode[] lists) {
  PriorityQueue<ListNode> pq = new PriorityQueue<>((a, b) -> a.val - b.val);
  for (ListNode l : lists) if (l != null) pq.offer(l);
  ListNode dummy = new ListNode(0), tail = dummy;
  while (!pq.isEmpty()) {
    ListNode node = pq.poll();
    tail.next = node;
    tail = node;
    if (node.next != null) pq.offer(node.next);
  }
  return dummy.next;
}
```

**Key points:**
- Heap of size k yields O(N log k) time, O(k) space.
- Divide-and-conquer pairwise merging gives the same O(N log k) bound.

**Tags:** #algorithm

---

### 6. Add Two Numbers

**Difficulty:** Medium
**Topics:** linked-list, math
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Two non-empty linked lists represent two non-negative integers with digits stored in reverse order. Add them and return the sum as a linked list.

**Approach:** Walk both lists together, adding digit pairs plus a carry into a new node. Continue while either list has nodes or a carry remains. A dummy head keeps the append logic clean. Time O(max(m, n)), space O(max(m, n)).

**Python:**
```python
class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val, self.next = val, next

def add_two_numbers(l1: ListNode | None, l2: ListNode | None) -> ListNode | None:
    dummy = tail = ListNode()
    carry = 0
    while l1 or l2 or carry:
        s = carry + (l1.val if l1 else 0) + (l2.val if l2 else 0)
        carry, digit = divmod(s, 10)
        tail.next = tail = ListNode(digit)
        l1 = l1.next if l1 else None
        l2 = l2.next if l2 else None
    return dummy.next
```

**TypeScript:**
```typescript
class ListNode {
  val: number; next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) { this.val = val; this.next = next; }
}

function addTwoNumbers(l1: ListNode | null, l2: ListNode | null): ListNode | null {
  const dummy = new ListNode();
  let tail = dummy, carry = 0;
  while (l1 || l2 || carry) {
    const sum = carry + (l1?.val ?? 0) + (l2?.val ?? 0);
    carry = Math.floor(sum / 10);
    tail.next = new ListNode(sum % 10);
    tail = tail.next;
    l1 = l1?.next ?? null;
    l2 = l2?.next ?? null;
  }
  return dummy.next;
}
```

**Java:**
```java
class ListNode { int val; ListNode next; ListNode(int v) { val = v; } }

ListNode addTwoNumbers(ListNode l1, ListNode l2) {
  ListNode dummy = new ListNode(0), tail = dummy;
  int carry = 0;
  while (l1 != null || l2 != null || carry != 0) {
    int sum = carry + (l1 != null ? l1.val : 0) + (l2 != null ? l2.val : 0);
    carry = sum / 10;
    tail.next = new ListNode(sum % 10);
    tail = tail.next;
    if (l1 != null) l1 = l1.next;
    if (l2 != null) l2 = l2.next;
  }
  return dummy.next;
}
```

**Key points:**
- Reverse-order storage means you process from least significant digit first, so no pre-reversal is needed.
- The loop condition must include `carry` to emit a final leading digit (e.g. 5 + 5 = 10).
- A dummy head avoids special-casing the first node.

**Follow-ups:**
- What if the digits are stored in forward (most-significant-first) order? Reverse both lists or use two stacks.
- Can you add without allocating new nodes? Reuse the longer list in place.

**Tags:** #algorithm

---

### 7. Copy List with Random Pointer

**Difficulty:** Medium
**Topics:** linked-list, hash-table
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Each node in a linked list has a `next` pointer and a `random` pointer that can point to any node or null. Return a deep copy of the list.

**Approach:** Interleave each copy directly after its original (A -> A' -> B -> B' ...). Then set each copy's `random` from `orig.random.next`, and finally unweave the two lists. This gives O(n) time and O(1) extra space beyond the copies. A simpler alternative uses a hash map from original to copy.

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
  const map = new Map<Node, Node>();
  let cur: Node | null = head;
  while (cur) { map.set(cur, new Node(cur.val)); cur = cur.next; }
  cur = head;
  while (cur) {
    const copy = map.get(cur)!;
    copy.next = cur.next ? map.get(cur.next)! : null;
    copy.random = cur.random ? map.get(cur.random)! : null;
    cur = cur.next;
  }
  return map.get(head)!;
}
```

**Java:**
```java
class Node { int val; Node next, random; Node(int v) { val = v; } }

Node copyRandomList(Node head) {
  if (head == null) return null;
  Map<Node, Node> map = new HashMap<>();
  for (Node cur = head; cur != null; cur = cur.next)
    map.put(cur, new Node(cur.val));
  for (Node cur = head; cur != null; cur = cur.next) {
    map.get(cur).next = map.get(cur.next);
    map.get(cur).random = map.get(cur.random);
  }
  return map.get(head);
}
```

**Key points:**
- The hash-map approach maps original -> copy, then wires `next` and `random` in a second pass; O(n) time and O(n) space.
- The interleaving trick achieves O(1) extra space by embedding copies inside the original list.
- Always guard `random` and `next` against null before dereferencing.

**Follow-ups:**
- Reduce space to O(1) — use the interleaving weave/unweave method.
- How would you deep-copy an arbitrary graph instead of a list? BFS/DFS with a visited map.

**Tags:** #algorithm

---

### 8. Reorder List

**Difficulty:** Medium
**Topics:** linked-list, two-pointers
**Position:** Android Engineer
**Years:** L10-L11

**Question:** Given a singly linked list L0 -> L1 -> ... -> Ln-1 -> Ln, reorder it in place to L0 -> Ln -> L1 -> Ln-1 -> L2 -> Ln-2 -> ... without altering node values.

**Approach:** Three classic steps: (1) find the middle with slow/fast pointers, (2) reverse the second half, (3) merge the two halves alternately. All in place. Time O(n), space O(1).

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
    second, slow.next = slow.next, None
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
class ListNode {
  val: number; next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) { this.val = val; this.next = next; }
}

function reorderList(head: ListNode | null): void {
  if (!head || !head.next) return;
  let slow = head, fast: ListNode | null = head;
  while (fast.next && fast.next.next) { slow = slow.next!; fast = fast.next.next; }
  let second = slow.next;
  slow.next = null;
  let prev: ListNode | null = null;
  while (second) { const nxt = second.next; second.next = prev; prev = second; second = nxt; }
  let first: ListNode | null = head;
  while (prev) {
    const f = first!.next, p = prev.next;
    first!.next = prev;
    prev.next = f;
    first = f;
    prev = p;
  }
}
```

**Java:**
```java
class ListNode { int val; ListNode next; ListNode(int v) { val = v; } }

void reorderList(ListNode head) {
  if (head == null || head.next == null) return;
  ListNode slow = head, fast = head;
  while (fast.next != null && fast.next.next != null) { slow = slow.next; fast = fast.next.next; }
  ListNode second = slow.next, prev = null;
  slow.next = null;
  while (second != null) { ListNode nxt = second.next; second.next = prev; prev = second; second = nxt; }
  ListNode first = head;
  while (prev != null) {
    ListNode f = first.next, p = prev.next;
    first.next = prev;
    prev.next = f;
    first = f;
    prev = p;
  }
}
```

**Key points:**
- Slow/fast pointers land `slow` at the end of the first half so `slow.next` starts the half to reverse.
- Sever the list at the midpoint (`slow.next = null`) before reversing to avoid a cycle.
- Merge stops naturally when the reversed (shorter-or-equal) half is exhausted.

**Follow-ups:**
- How do you detect and preserve the exact midpoint for odd vs even lengths? The `fast.next && fast.next.next` condition handles both.
- Could you do it with O(n) space instead? Store nodes in an array and index from both ends.

**Tags:** #algorithm

---

## Tree

### 9. Invert Binary Tree

**Difficulty:** Easy
**Topics:** tree, recursion, dfs
**Position:** Android Engineer
**Years:** L8-L9

**Question:** Invert a binary tree (swap every node's left and right children).

**Approach:** Recurse, swapping children at each node. Time O(n), space O(h) for the recursion stack.

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
  if (!root) return null;
  [root.left, root.right] = [invertTree(root.right), invertTree(root.left)];
  return root;
}
```

**Java:**
```java
class TreeNode { int val; TreeNode left, right; TreeNode(int v) { val = v; } }

TreeNode invertTree(TreeNode root) {
  if (root == null) return null;
  TreeNode left = invertTree(root.left);
  root.left = invertTree(root.right);
  root.right = left;
  return root;
}
```

**Key points:**
- Visits each node once → O(n) time.
- Recursion depth is O(h), the tree height.

**Tags:** #algorithm

---

### 10. Maximum Depth of Binary Tree

**Difficulty:** Easy
**Topics:** tree, recursion, dfs
**Position:** Android Engineer
**Years:** L8-L9

**Question:** Return the maximum depth (number of nodes along the longest root-to-leaf path) of a binary tree.

**Approach:** Depth = 1 + max(depth(left), depth(right)); empty tree is 0. Time O(n), space O(h).

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
function maxDepth(root: TreeNode | null): number {
  if (!root) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```

**Java:**
```java
int maxDepth(TreeNode root) {
  if (root == null) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```

**Key points:**
- O(n) time, O(h) space from recursion.
- Trivial base case at null keeps the recurrence clean.

**Tags:** #algorithm

---

### 11. Binary Tree Level Order Traversal

**Difficulty:** Medium
**Topics:** tree, bfs, queue
**Position:** Android Engineer
**Years:** L8-L9

**Question:** Return the node values level by level (top to bottom, left to right) as a list of lists.

**Approach:** BFS with a queue; process one full level per outer iteration by snapshotting the queue size. Time O(n), space O(n).

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
  let q: TreeNode[] = [root];
  while (q.length) {
    const level: number[] = [], next: TreeNode[] = [];
    for (const node of q) {
      level.push(node.val);
      if (node.left) next.push(node.left);
      if (node.right) next.push(node.right);
    }
    res.push(level);
    q = next;
  }
  return res;
}
```

**Java:**
```java
List<List<Integer>> levelOrder(TreeNode root) {
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
```

**Key points:**
- BFS visits each node once → O(n) time, O(n) queue space.
- Snapshot the level size before the inner loop to separate levels.

**Tags:** #algorithm

---

### 12. Validate Binary Search Tree

**Difficulty:** Medium
**Topics:** tree, dfs, bst
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Determine whether a binary tree is a valid BST (left subtree strictly less, right strictly greater, recursively).

**Approach:** DFS carrying an open `(low, high)` range; each node must lie strictly inside, and children narrow the range. Time O(n), space O(h).

**Python:**
```python
class TreeNode:
    def __init__(self, val: int = 0, left=None, right=None) -> None:
        self.val, self.left, self.right = val, left, right

def is_valid_bst(root: TreeNode | None) -> bool:
    def dfs(node, low, high) -> bool:
        if not node:
            return True
        if not (low < node.val < high):
            return False
        return dfs(node.left, low, node.val) and dfs(node.right, node.val, high)
    return dfs(root, float("-inf"), float("inf"))
```

**TypeScript:**
```typescript
function isValidBST(root: TreeNode | null): boolean {
  const dfs = (node: TreeNode | null, low: number, high: number): boolean => {
    if (!node) return true;
    if (node.val <= low || node.val >= high) return false;
    return dfs(node.left, low, node.val) && dfs(node.right, node.val, high);
  };
  return dfs(root, -Infinity, Infinity);
}
```

**Java:**
```java
boolean isValidBST(TreeNode root) {
  return dfs(root, Long.MIN_VALUE, Long.MAX_VALUE);
}

boolean dfs(TreeNode node, long low, long high) {
  if (node == null) return true;
  if (node.val <= low || node.val >= high) return false;
  return dfs(node.left, low, node.val) && dfs(node.right, node.val, high);
}
```

**Key points:**
- Range-passing DFS is O(n) time, O(h) space.
- Use strict bounds and a wide initial range to handle extreme values.

**Tags:** #algorithm

---

### 13. Lowest Common Ancestor of a Binary Tree

**Difficulty:** Medium
**Topics:** tree, dfs, recursion
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Given a binary tree and two nodes `p` and `q`, return their lowest common ancestor.

**Approach:** DFS returning a node if it equals p/q or is found in a subtree. The first node whose left and right both return non-null is the LCA. Time O(n), space O(h).

**Python:**
```python
class TreeNode:
    def __init__(self, val: int = 0, left=None, right=None) -> None:
        self.val, self.left, self.right = val, left, right

def lca(root, p, q):
    if root is None or root is p or root is q:
        return root
    left = lca(root.left, p, q)
    right = lca(root.right, p, q)
    if left and right:
        return root
    return left or right
```

**TypeScript:**
```typescript
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
TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
  if (root == null || root == p || root == q) return root;
  TreeNode left = lowestCommonAncestor(root.left, p, q);
  TreeNode right = lowestCommonAncestor(root.right, p, q);
  if (left != null && right != null) return root;
  return left != null ? left : right;
}
```

**Key points:**
- One DFS pass → O(n) time, O(h) recursion space.
- Both sides non-null means p and q split here → this node is the LCA.

**Tags:** #algorithm

---

### 14. Serialize and Deserialize Binary Tree

**Difficulty:** Hard
**Topics:** tree, dfs, design
**Position:** Senior SWE
**Years:** L10-L11

**Question:** Design `serialize` and `deserialize` for a binary tree so the structure can be reconstructed exactly.

**Approach:** Preorder DFS writing `#` for nulls; deserialize consumes the same stream recursively. Both directions are O(n) time and O(n) space.

**Python:**
```python
class TreeNode:
    def __init__(self, val: int = 0, left=None, right=None) -> None:
        self.val, self.left, self.right = val, left, right

def serialize(root: TreeNode | None) -> str:
    out: list[str] = []
    def dfs(node):
        if not node:
            out.append("#")
            return
        out.append(str(node.val))
        dfs(node.left)
        dfs(node.right)
    dfs(root)
    return ",".join(out)

def deserialize(data: str) -> TreeNode | None:
    vals = iter(data.split(","))
    def build():
        v = next(vals)
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
function serialize(root: TreeNode | null): string {
  const out: string[] = [];
  const dfs = (node: TreeNode | null) => {
    if (!node) { out.push("#"); return; }
    out.push(String(node.val));
    dfs(node.left);
    dfs(node.right);
  };
  dfs(root);
  return out.join(",");
}

function deserialize(data: string): TreeNode | null {
  const vals = data.split(",");
  let i = 0;
  const build = (): TreeNode | null => {
    const v = vals[i++];
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

private int idx;
TreeNode deserialize(String data) {
  idx = 0;
  return build(data.split(","));
}

TreeNode build(String[] vals) {
  String v = vals[idx++];
  if (v.equals("#")) return null;
  TreeNode node = new TreeNode(Integer.parseInt(v));
  node.left = build(vals);
  node.right = build(vals);
  return node;
}
```

**Key points:**
- Preorder with null markers is O(n) time and O(n) space both ways.
- Consuming the stream in the same preorder rebuilds structure unambiguously.

**Tags:** #algorithm

---

### 15. Implement Trie (Prefix Tree)

**Difficulty:** Medium
**Topics:** trie, design, string
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Implement a trie supporting `insert(word)`, `search(word)`, and `startsWith(prefix)`.

**Approach:** Each node holds child links and an end-of-word flag; traverse/create per character. Each op is O(L) for word length L; space O(total characters inserted).

**Python:**
```python
class Trie:
    def __init__(self) -> None:
        self.children: dict[str, "Trie"] = {}
        self.is_end = False

    def insert(self, word: str) -> None:
        node = self
        for c in word:
            node = node.children.setdefault(c, Trie())
        node.is_end = True

    def search(self, word: str) -> bool:
        node = self._find(word)
        return node is not None and node.is_end

    def starts_with(self, prefix: str) -> bool:
        return self._find(prefix) is not None

    def _find(self, s: str) -> "Trie | None":
        node = self
        for c in s:
            if c not in node.children:
                return None
            node = node.children[c]
        return node
```

**TypeScript:**
```typescript
class Trie {
  private children: Record<string, Trie> = {};
  private isEnd = false;

  insert(word: string): void {
    let node: Trie = this;
    for (const c of word) {
      if (!node.children[c]) node.children[c] = new Trie();
      node = node.children[c];
    }
    node.isEnd = true;
  }

  search(word: string): boolean {
    const node = this.find(word);
    return node !== null && node.isEnd;
  }

  startsWith(prefix: string): boolean {
    return this.find(prefix) !== null;
  }

  private find(s: string): Trie | null {
    let node: Trie = this;
    for (const c of s) {
      if (!node.children[c]) return null;
      node = node.children[c];
    }
    return node;
  }
}
```

**Java:**
```java
class Trie {
  private final Trie[] children = new Trie[26];
  private boolean isEnd;

  public void insert(String word) {
    Trie node = this;
    for (char c : word.toCharArray()) {
      int i = c - 'a';
      if (node.children[i] == null) node.children[i] = new Trie();
      node = node.children[i];
    }
    node.isEnd = true;
  }

  public boolean search(String word) {
    Trie node = find(word);
    return node != null && node.isEnd;
  }

  public boolean startsWith(String prefix) {
    return find(prefix) != null;
  }

  private Trie find(String s) {
    Trie node = this;
    for (char c : s.toCharArray()) {
      int i = c - 'a';
      if (node.children[i] == null) return null;
      node = node.children[i];
    }
    return node;
  }
}
```

**Key points:**
- Each operation is O(L) in the key length, independent of dictionary size.
- Space is O(sum of inserted word lengths) in the worst case.

**Tags:** #algorithm

---

### 16. Diameter of Binary Tree

**Difficulty:** Easy
**Topics:** tree, dfs, recursion
**Position:** Android Engineer
**Years:** L8-L9

**Question:** Return the length of the longest path between any two nodes in a binary tree, measured in the number of edges. The path may or may not pass through the root.

**Approach:** For each node, the longest path passing through it equals height(left) + height(right). Compute heights bottom-up with a single DFS and track the global maximum of that sum. Time O(n), space O(h) for the recursion stack.

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
function diameterOfBinaryTree(root: TreeNode | null): number {
  let best = 0;
  const height = (node: TreeNode | null): number => {
    if (!node) return 0;
    const l = height(node.left);
    const r = height(node.right);
    best = Math.max(best, l + r);
    return 1 + Math.max(l, r);
  };
  height(root);
  return best;
}
```

**Java:**
```java
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
- The diameter is a sum of two subtree heights, so a height-returning DFS solves it in one pass.
- Count edges (l + r), not nodes; the answer is not necessarily rooted at the tree root.

**Follow-ups:**
- What changes if edges carry weights? Track weighted height and use max weighted path through each node.
- How would you return the actual path, not just its length?

**Tags:** #algorithm

---

### 17. Balanced Binary Tree

**Difficulty:** Easy
**Topics:** tree, dfs, recursion
**Position:** Android Engineer
**Years:** L8-L9

**Question:** Determine whether a binary tree is height-balanced, i.e. for every node the heights of its two subtrees differ by at most one.

**Approach:** A naive check recomputes height at every node in O(n^2). Instead do a single post-order DFS that returns the height of a balanced subtree or a sentinel (-1) once imbalance is detected, short-circuiting upward. Time O(n), space O(h).

**Python:**
```python
class TreeNode:
    def __init__(self, val: int = 0, left=None, right=None) -> None:
        self.val, self.left, self.right = val, left, right

def is_balanced(root: TreeNode | None) -> bool:
    def height(node: TreeNode | None) -> int:
        if not node:
            return 0
        l = height(node.left)
        if l == -1:
            return -1
        r = height(node.right)
        if r == -1 or abs(l - r) > 1:
            return -1
        return 1 + max(l, r)
    return height(root) != -1
```

**TypeScript:**
```typescript
function isBalanced(root: TreeNode | null): boolean {
  const height = (node: TreeNode | null): number => {
    if (!node) return 0;
    const l = height(node.left);
    if (l === -1) return -1;
    const r = height(node.right);
    if (r === -1 || Math.abs(l - r) > 1) return -1;
    return 1 + Math.max(l, r);
  };
  return height(root) !== -1;
}
```

**Java:**
```java
boolean isBalanced(TreeNode root) {
  return height(root) != -1;
}

int height(TreeNode node) {
  if (node == null) return 0;
  int l = height(node.left);
  if (l == -1) return -1;
  int r = height(node.right);
  if (r == -1 || Math.abs(l - r) > 1) return -1;
  return 1 + Math.max(l, r);
}
```

**Key points:**
- Encoding "unbalanced" as -1 lets one post-order pass both measure height and validate balance.
- Short-circuiting on -1 avoids redundant work and keeps it O(n).

**Follow-ups:**
- How does this relate to self-balancing trees (AVL, red-black) used in map implementations?
- Can you make it iterative to avoid stack overflow on skewed trees?

**Tags:** #algorithm

---

### 18. Binary Tree Right Side View

**Difficulty:** Medium
**Topics:** tree, bfs, dfs
**Position:** Android Engineer
**Years:** L10-L11

**Question:** Imagine standing on the right side of a binary tree; return the values of the nodes you can see, ordered top to bottom.

**Approach:** The rightmost node of each level is visible. Run BFS and take the last node of every level; or run a DFS that visits right before left and records the first node reached at each new depth. Both are O(n) time, O(n)/O(h) space.

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
function rightSideView(root: TreeNode | null): number[] {
  if (!root) return [];
  const view: number[] = [];
  let q: TreeNode[] = [root];
  while (q.length) {
    const next: TreeNode[] = [];
    view.push(q[q.length - 1].val);
    for (const node of q) {
      if (node.left) next.push(node.left);
      if (node.right) next.push(node.right);
    }
    q = next;
  }
  return view;
}
```

**Java:**
```java
List<Integer> rightSideView(TreeNode root) {
  List<Integer> view = new ArrayList<>();
  if (root == null) return view;
  Deque<TreeNode> q = new ArrayDeque<>();
  q.add(root);
  while (!q.isEmpty()) {
    int n = q.size();
    for (int i = 0; i < n; i++) {
      TreeNode node = q.poll();
      if (i == n - 1) view.add(node.val);
      if (node.left != null) q.add(node.left);
      if (node.right != null) q.add(node.right);
    }
  }
  return view;
}
```

**Key points:**
- The visible node per level is the last one dequeued in BFS.
- A right-first DFS keyed on depth is an equivalent O(h)-space alternative.

**Follow-ups:**
- How would you produce the left side view instead?
- What if you also needed the count of nodes hidden behind each visible one?

**Tags:** #algorithm

---

### 19. Binary Tree Maximum Path Sum

**Difficulty:** Hard
**Topics:** tree, dfs, recursion
**Position:** Backend SWE
**Years:** L12+

**Question:** A path is any sequence of nodes connected by parent-child edges, appearing at most once each; it need not pass through the root. Return the maximum sum of node values along any such path.

**Approach:** Post-order DFS. For each node compute the best downward gain it can contribute upward: node.val + max(0, gain(left), gain(right)) — negative branches are clamped to 0. Separately, the best path that turns at this node is node.val + max(0, left) + max(0, right); update a global maximum with it. Time O(n), space O(h).

**Python:**
```python
class TreeNode:
    def __init__(self, val: int = 0, left=None, right=None) -> None:
        self.val, self.left, self.right = val, left, right

def max_path_sum(root: TreeNode | None) -> int:
    best = float('-inf')
    def gain(node: TreeNode | None) -> int:
        nonlocal best
        if not node:
            return 0
        l = max(gain(node.left), 0)
        r = max(gain(node.right), 0)
        best = max(best, node.val + l + r)
        return node.val + max(l, r)
    gain(root)
    return best
```

**TypeScript:**
```typescript
function maxPathSum(root: TreeNode | null): number {
  let best = -Infinity;
  const gain = (node: TreeNode | null): number => {
    if (!node) return 0;
    const l = Math.max(gain(node.left), 0);
    const r = Math.max(gain(node.right), 0);
    best = Math.max(best, node.val + l + r);
    return node.val + Math.max(l, r);
  };
  gain(root);
  return best;
}
```

**Java:**
```java
int best = Integer.MIN_VALUE;

int maxPathSum(TreeNode root) {
  gain(root);
  return best;
}

int gain(TreeNode node) {
  if (node == null) return 0;
  int l = Math.max(gain(node.left), 0);
  int r = Math.max(gain(node.right), 0);
  best = Math.max(best, node.val + l + r);
  return node.val + Math.max(l, r);
}
```

**Key points:**
- Distinguish the value returned upward (a straight path, at most one child) from the value used to update the answer (a path turning at the node, both children).
- Clamp negative subtree gains to 0 so harmful branches are dropped.
- Initialize the global best to negative infinity to handle all-negative trees.

**Follow-ups:**
- How would you reconstruct the actual nodes on the maximum path?
- What if only root-to-leaf paths are allowed?

**Tags:** #algorithm

---

## Graph

### 20. Number of Islands

**Difficulty:** Medium
**Topics:** graph, dfs, bfs, matrix
**Position:** Backend SWE
**Years:** L8-L9

**Question:** Count connected groups of `'1'` (land) in a 2D grid of `'1'`/`'0'`, using 4-directional adjacency.

**Approach:** Scan the grid; on each unvisited land cell, flood-fill (DFS/BFS) to sink the whole island, incrementing the count. Time O(rows*cols), space O(rows*cols) worst case.

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
  const sink = (r: number, c: number) => {
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

void sink(char[][] grid, int r, int c) {
  if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length || grid[r][c] != '1') return;
  grid[r][c] = '0';
  sink(grid, r + 1, c); sink(grid, r - 1, c); sink(grid, r, c + 1); sink(grid, r, c - 1);
}
```

**Key points:**
- Each cell visited once → O(rows*cols) time.
- Recursion/queue depth is O(rows*cols) worst case (one giant island).

**Tags:** #algorithm

---

### 21. Clone Graph

**Difficulty:** Medium
**Topics:** graph, dfs, bfs, hash-table
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Deep-copy a connected undirected graph given a node reference; each node has a value and a list of neighbors.

**Approach:** DFS/BFS with a map from original node → clone to avoid re-cloning and handle cycles. Time O(V + E), space O(V).

**Python:**
```python
class Node:
    def __init__(self, val: int = 0, neighbors=None) -> None:
        self.val = val
        self.neighbors = neighbors or []

def clone_graph(node: "Node | None") -> "Node | None":
    if not node:
        return None
    clones: dict[Node, Node] = {}
    def dfs(n: Node) -> Node:
        if n in clones:
            return clones[n]
        copy = Node(n.val)
        clones[n] = copy
        copy.neighbors = [dfs(nb) for nb in n.neighbors]
        return copy
    return dfs(node)
```

**TypeScript:**
```typescript
class GNode {
  val: number; neighbors: GNode[];
  constructor(val = 0, neighbors: GNode[] = []) { this.val = val; this.neighbors = neighbors; }
}

function cloneGraph(node: GNode | null): GNode | null {
  if (!node) return null;
  const clones = new Map<GNode, GNode>();
  const dfs = (n: GNode): GNode => {
    if (clones.has(n)) return clones.get(n)!;
    const copy = new GNode(n.val);
    clones.set(n, copy);
    copy.neighbors = n.neighbors.map(dfs);
    return copy;
  };
  return dfs(node);
}
```

**Java:**
```java
class Node { int val; List<Node> neighbors = new ArrayList<>(); Node(int v) { val = v; } }

Node cloneGraph(Node node) {
  if (node == null) return null;
  Map<Node, Node> clones = new HashMap<>();
  return dfs(node, clones);
}

Node dfs(Node n, Map<Node, Node> clones) {
  if (clones.containsKey(n)) return clones.get(n);
  Node copy = new Node(n.val);
  clones.put(n, copy);
  for (Node nb : n.neighbors) copy.neighbors.add(dfs(nb, clones));
  return copy;
}
```

**Key points:**
- Visiting every node and edge once gives O(V + E) time.
- The visited map (O(V) space) prevents infinite loops on cycles.

**Tags:** #algorithm

---

### 22. Course Schedule

**Difficulty:** Medium
**Topics:** graph, topological-sort, bfs
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Given `numCourses` and prerequisite pairs `[a, b]` (b before a), determine whether all courses can be finished (i.e., the graph is acyclic).

**Approach:** Kahn's algorithm — build in-degrees, queue zero-in-degree nodes, repeatedly remove them. If all nodes are removed there is no cycle. Time O(V + E), space O(V + E).

**Python:**
```python
from collections import deque

def can_finish(num_courses: int, prerequisites: list[list[int]]) -> bool:
    graph = [[] for _ in range(num_courses)]
    indeg = [0] * num_courses
    for a, b in prerequisites:
        graph[b].append(a)
        indeg[a] += 1
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
  for (const [a, b] of prerequisites) { graph[b].push(a); indeg[a]++; }
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
  for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) q.offer(i);
  int seen = 0;
  while (!q.isEmpty()) {
    int node = q.poll();
    seen++;
    for (int nxt : graph.get(node)) if (--indeg[nxt] == 0) q.offer(nxt);
  }
  return seen == numCourses;
}
```

**Key points:**
- Kahn's topological sort is O(V + E) time and space.
- A cycle leaves nodes with positive in-degree, so `seen < numCourses`.

**Tags:** #algorithm

---

### 23. Number of Connected Components in an Undirected Graph

**Difficulty:** Medium
**Topics:** union-find, graph, dsu
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Given `n` nodes labeled `0..n-1` and an edge list, return the number of connected components.

**Approach:** Union-Find with path compression and union by rank; start with `n` components and decrement on each successful union. Near-linear time O((n + e) α(n)), space O(n).

**Python:**
```python
def count_components(n: int, edges: list[list[int]]) -> int:
    parent = list(range(n))
    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    count = n
    for a, b in edges:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb
            count -= 1
    return count
```

**TypeScript:**
```typescript
function countComponents(n: number, edges: number[][]): number {
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  };
  let count = n;
  for (const [a, b] of edges) {
    const ra = find(a), rb = find(b);
    if (ra !== rb) { parent[ra] = rb; count--; }
  }
  return count;
}
```

**Java:**
```java
int countComponents(int n, int[][] edges) {
  int[] parent = new int[n];
  for (int i = 0; i < n; i++) parent[i] = i;
  int count = n;
  for (int[] e : edges) {
    int ra = find(parent, e[0]), rb = find(parent, e[1]);
    if (ra != rb) { parent[ra] = rb; count--; }
  }
  return count;
}

int find(int[] parent, int x) {
  while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
  return x;
}
```

**Key points:**
- Path compression makes finds near O(α(n)) → overall O((n + e) α(n)) time.
- Components start at n and drop by one per merge of distinct roots.

**Tags:** #algorithm

---

### 24. MIUI App Launch Ordering (Topological Sort)

**Difficulty:** Medium
**Topics:** graph, topological-sort, bfs
**Position:** Android Engineer
**Years:** L10-L11

**Question:** During MIUI/HyperOS boot, system services have start-up dependencies (`[a, b]` means b must start before a). Return any valid launch order, or an empty list if a dependency cycle makes booting impossible.

**Approach:** Kahn's topological sort — compute in-degrees, queue zero-in-degree services, emit them while decrementing successors. If the emitted count is less than n, a cycle exists. Time O(V + E), space O(V + E).

**Python:**
```python
from collections import deque

def launch_order(n: int, deps: list[list[int]]) -> list[int]:
    graph = [[] for _ in range(n)]
    indeg = [0] * n
    for a, b in deps:
        graph[b].append(a)
        indeg[a] += 1
    q = deque(i for i in range(n) if indeg[i] == 0)
    order: list[int] = []
    while q:
        node = q.popleft()
        order.append(node)
        for nxt in graph[node]:
            indeg[nxt] -= 1
            if indeg[nxt] == 0:
                q.append(nxt)
    return order if len(order) == n else []
```

**TypeScript:**
```typescript
function launchOrder(n: number, deps: number[][]): number[] {
  const graph: number[][] = Array.from({ length: n }, () => []);
  const indeg = new Array(n).fill(0);
  for (const [a, b] of deps) { graph[b].push(a); indeg[a]++; }
  const q: number[] = [];
  for (let i = 0; i < n; i++) if (indeg[i] === 0) q.push(i);
  const order: number[] = [];
  while (q.length) {
    const node = q.shift()!;
    order.push(node);
    for (const nxt of graph[node]) if (--indeg[nxt] === 0) q.push(nxt);
  }
  return order.length === n ? order : [];
}
```

**Java:**
```java
int[] launchOrder(int n, int[][] deps) {
  List<List<Integer>> graph = new ArrayList<>();
  for (int i = 0; i < n; i++) graph.add(new ArrayList<>());
  int[] indeg = new int[n];
  for (int[] d : deps) { graph.get(d[1]).add(d[0]); indeg[d[0]]++; }
  Queue<Integer> q = new LinkedList<>();
  for (int i = 0; i < n; i++) if (indeg[i] == 0) q.offer(i);
  int[] order = new int[n];
  int idx = 0;
  while (!q.isEmpty()) {
    int node = q.poll();
    order[idx++] = node;
    for (int nxt : graph.get(node)) if (--indeg[nxt] == 0) q.offer(nxt);
  }
  return idx == n ? order : new int[0];
}
```

**Key points:**
- Kahn's algorithm runs in O(V + E) time and space.
- A dependency cycle prevents draining the queue → fewer than n emitted.

**Tags:** #algorithm

---

### 25. Rotting Oranges

**Difficulty:** Medium
**Topics:** graph, bfs, matrix
**Position:** Backend SWE
**Years:** L10-L11

**Question:** In a grid where `0` is empty, `1` is a fresh orange, and `2` is rotten, each minute every fresh orange 4-directionally adjacent to a rotten one rots. Return the minutes until none remain fresh, or `-1` if impossible.

**Approach:** Multi-source BFS from all initially rotten cells at once, expanding one "minute" per level; count remaining fresh oranges to detect the unreachable case. Mirrors how a device-state or firmware flag propagates level-by-level across a mesh of nodes. Time O(rows*cols), space O(rows*cols).

**Python:**
```python
from collections import deque

def oranges_rotting(grid: list[list[int]]) -> int:
    rows, cols = len(grid), len(grid[0])
    q: deque[tuple[int, int]] = deque()
    fresh = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 2:
                q.append((r, c))
            elif grid[r][c] == 1:
                fresh += 1
    dirs = ((1, 0), (-1, 0), (0, 1), (0, -1))
    minutes = 0
    while q and fresh:
        for _ in range(len(q)):
            r, c = q.popleft()
            for dr, dc in dirs:
                nr, nc = r + dr, c + dc
                if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1:
                    grid[nr][nc] = 2
                    fresh -= 1
                    q.append((nr, nc))
        minutes += 1
    return -1 if fresh else minutes
```

**TypeScript:**
```typescript
function orangesRotting(grid: number[][]): number {
  const rows = grid.length, cols = grid[0].length;
  let queue: [number, number][] = [];
  let fresh = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (grid[r][c] === 2) queue.push([r, c]);
      else if (grid[r][c] === 1) fresh++;
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let minutes = 0;
  while (queue.length && fresh) {
    const next: [number, number][] = [];
    for (const [r, c] of queue)
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nc >= 0 && nr < rows && nc < cols && grid[nr][nc] === 1) {
          grid[nr][nc] = 2; fresh--; next.push([nr, nc]);
        }
      }
    queue = next;
    minutes++;
  }
  return fresh ? -1 : minutes;
}
```

**Java:**
```java
int orangesRotting(int[][] grid) {
  int rows = grid.length, cols = grid[0].length, fresh = 0, minutes = 0;
  Queue<int[]> queue = new ArrayDeque<>();
  for (int r = 0; r < rows; r++)
    for (int c = 0; c < cols; c++)
      if (grid[r][c] == 2) queue.add(new int[]{r, c});
      else if (grid[r][c] == 1) fresh++;
  int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
  while (!queue.isEmpty() && fresh > 0) {
    for (int n = queue.size(); n > 0; n--) {
      int[] cell = queue.poll();
      for (int[] d : dirs) {
        int nr = cell[0] + d[0], nc = cell[1] + d[1];
        if (nr >= 0 && nc >= 0 && nr < rows && nc < cols && grid[nr][nc] == 1) {
          grid[nr][nc] = 2; fresh--; queue.add(new int[]{nr, nc});
        }
      }
    }
    minutes++;
  }
  return fresh > 0 ? -1 : minutes;
}
```

**Key points:**
- Seed the queue with every rotten cell so all sources advance in lockstep; one level equals one minute.
- Track the fresh count instead of rescanning the grid, so `-1` (isolated fresh oranges) is O(1) to detect.

**Follow-ups:**
- What changes if oranges also rot diagonally, or if some cells block spread entirely?
- How would you report which orange rots last and its coordinate?

**Tags:** #algorithm

---

### 26. Network Delay Time

**Difficulty:** Medium
**Topics:** graph, dijkstra, shortest-path, heap
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Given `times[i] = [u, v, w]` (a signal from node `u` to `v` takes `w`), `n` nodes labeled `1..n`, and a source `k`, return the minimum time for all nodes to receive the signal, or `-1` if some node is unreachable.

**Approach:** Single-source shortest path with Dijkstra: pop the closest unsettled node from a min-heap, settle it, and relax its outgoing edges. The answer is the max settled distance if every node is reached. Directly models signal latency spreading through an IoT device mesh. Time O(E log V), space O(V + E).

**Python:**
```python
import heapq
from collections import defaultdict

def network_delay_time(times: list[list[int]], n: int, k: int) -> int:
    graph: dict[int, list[tuple[int, int]]] = defaultdict(list)
    for u, v, w in times:
        graph[u].append((v, w))
    dist: dict[int, int] = {}
    heap: list[tuple[int, int]] = [(0, k)]
    while heap:
        d, node = heapq.heappop(heap)
        if node in dist:
            continue
        dist[node] = d
        for nb, w in graph[node]:
            if nb not in dist:
                heapq.heappush(heap, (d + w, nb))
    return max(dist.values()) if len(dist) == n else -1
```

**TypeScript:**
```typescript
function networkDelayTime(times: number[][], n: number, k: number): number {
  const graph = new Map<number, [number, number][]>();
  for (const [u, v, w] of times) {
    if (!graph.has(u)) graph.set(u, []);
    graph.get(u)!.push([v, w]);
  }
  const dist = new Map<number, number>();
  const heap: [number, number][] = [[0, k]]; // [dist, node]
  const push = (item: [number, number]) => {
    heap.push(item);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p][0] <= heap[i][0]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]]; i = p;
    }
  };
  const pop = (): [number, number] => {
    const top = heap[0], last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = 2 * i + 2; let s = i;
        if (l < heap.length && heap[l][0] < heap[s][0]) s = l;
        if (r < heap.length && heap[r][0] < heap[s][0]) s = r;
        if (s === i) break;
        [heap[s], heap[i]] = [heap[i], heap[s]]; i = s;
      }
    }
    return top;
  };
  while (heap.length) {
    const [d, node] = pop();
    if (dist.has(node)) continue;
    dist.set(node, d);
    for (const [nb, w] of graph.get(node) ?? [])
      if (!dist.has(nb)) push([d + w, nb]);
  }
  return dist.size === n ? Math.max(...dist.values()) : -1;
}
```

**Java:**
```java
int networkDelayTime(int[][] times, int n, int k) {
  Map<Integer, List<int[]>> graph = new HashMap<>();
  for (int[] t : times)
    graph.computeIfAbsent(t[0], x -> new ArrayList<>()).add(new int[]{t[1], t[2]});
  Map<Integer, Integer> dist = new HashMap<>();
  PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
  pq.add(new int[]{0, k});
  while (!pq.isEmpty()) {
    int[] cur = pq.poll();
    int d = cur[0], node = cur[1];
    if (dist.containsKey(node)) continue;
    dist.put(node, d);
    for (int[] e : graph.getOrDefault(node, List.of()))
      if (!dist.containsKey(e[0])) pq.add(new int[]{d + e[1], e[0]});
  }
  if (dist.size() != n) return -1;
  int ans = 0;
  for (int d : dist.values()) ans = Math.max(ans, d);
  return ans;
}
```

**Key points:**
- The first time a node is popped it is settled with its shortest distance; skip later stale pops.
- All edge weights are non-negative, which is exactly what Dijkstra requires; use Bellman-Ford if negatives appear.

**Follow-ups:**
- How would you also reconstruct the actual path to the slowest node?
- If the graph has millions of edges, how do you tune the heap or switch to a different shortest-path algorithm?

**Tags:** #algorithm

---

### 27. Redundant Connection

**Difficulty:** Medium
**Topics:** graph, union-find, cycle-detection
**Position:** Backend SWE
**Years:** L10-L11

**Question:** A tree of `n` nodes had one extra edge added, forming exactly one cycle. Given the edge list, return the edge that can be removed so the result is a tree; if several qualify, return the one appearing last.

**Approach:** Union-Find (disjoint set union). Process edges in order and union their endpoints; the first edge whose endpoints already share a root closes the cycle and is the answer. Because edges are scanned in input order, that edge is inherently the last-added redundant one. Useful for detecting loops when merging smart-home device groups. Time O(n * alpha(n)) ~ O(n), space O(n).

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
int[] findRedundantConnection(int[][] edges) {
  int[] parent = new int[edges.length + 1];
  for (int i = 0; i < parent.length; i++) parent[i] = i;
  for (int[] e : edges) {
    int ru = find(parent, e[0]), rv = find(parent, e[1]);
    if (ru == rv) return e;
    parent[ru] = rv;
  }
  return new int[0];
}

int find(int[] parent, int x) {
  while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
  return x;
}
```

**Key points:**
- Two endpoints already in the same set means the edge forms a cycle; that is precisely the redundant edge.
- Path compression (`parent[x] = parent[parent[x]]`) keeps find near-constant amortized time.

**Follow-ups:**
- How does the problem change for a directed graph (Redundant Connection II)?
- How would you also report every node lying on the cycle, not just the closing edge?

**Tags:** #algorithm

---

## Heap / Priority Queue

### 28. Kth Largest Element in an Array

**Difficulty:** Medium
**Topics:** heap, quickselect, sorting
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Return the k-th largest element in an unsorted array.

**Approach:** Maintain a size-k min-heap of the largest seen; the heap root is the answer. Time O(n log k), space O(k). (Quickselect gives average O(n).)

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
  // Simple, correct: sort descending and index. O(n log n).
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
- Size-k min-heap gives O(n log k) time and O(k) space.
- Quickselect averages O(n) but is O(n^2) worst case without random pivots.

**Tags:** #algorithm

---

### 29. Top K Frequent Elements

**Difficulty:** Medium
**Topics:** heap, hash-table, bucket-sort
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Return the `k` most frequent elements in `nums`.

**Approach:** Count frequencies, then bucket by frequency (index = count) and collect from the high end. Counting + bucketing is O(n) time and O(n) space.

**Python:**
```python
from collections import Counter

def top_k_frequent(nums: list[int], k: int) -> list[int]:
    freq = Counter(nums)
    buckets: list[list[int]] = [[] for _ in range(len(nums) + 1)]
    for val, c in freq.items():
        buckets[c].append(val)
    res: list[int] = []
    for c in range(len(buckets) - 1, 0, -1):
        for val in buckets[c]:
            res.append(val)
            if len(res) == k:
                return res
    return res
```

**TypeScript:**
```typescript
function topKFrequent(nums: number[], k: number): number[] {
  const freq = new Map<number, number>();
  for (const x of nums) freq.set(x, (freq.get(x) ?? 0) + 1);
  const buckets: number[][] = Array.from({ length: nums.length + 1 }, () => []);
  for (const [val, c] of freq) buckets[c].push(val);
  const res: number[] = [];
  for (let c = buckets.length - 1; c > 0 && res.length < k; c--)
    for (const val of buckets[c]) { res.push(val); if (res.length === k) return res; }
  return res;
}
```

**Java:**
```java
int[] topKFrequent(int[] nums, int k) {
  Map<Integer, Integer> freq = new HashMap<>();
  for (int x : nums) freq.merge(x, 1, Integer::sum);
  List<Integer>[] buckets = new List[nums.length + 1];
  for (var e : freq.entrySet()) {
    int c = e.getValue();
    if (buckets[c] == null) buckets[c] = new ArrayList<>();
    buckets[c].add(e.getKey());
  }
  int[] res = new int[k];
  int idx = 0;
  for (int c = buckets.length - 1; c > 0 && idx < k; c--)
    if (buckets[c] != null)
      for (int val : buckets[c]) { res[idx++] = val; if (idx == k) return res; }
  return res;
}
```

**Key points:**
- Bucket sort by frequency achieves O(n) time and O(n) space.
- A size-k heap is the alternative at O(n log k).

**Tags:** #algorithm

---

### 30. Smart-Home IoT Event Scheduling (Mi Home)

**Difficulty:** Medium
**Topics:** heap, intervals, greedy
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Mi Home schedules automation events as `[start, end]` time windows on a pool of execution workers. Given all event windows for a day, find the minimum number of workers so that overlapping events never share a worker (the classic "meeting rooms II" in IoT clothing).

**Approach:** Sort events by start; use a min-heap of end times. For each event, if the earliest-ending worker is free (`heap[0] <= start`), reuse it (pop); always push the current end. The heap size peak is the answer. Time O(n log n), space O(n).

**Python:**
```python
import heapq

def min_workers(events: list[list[int]]) -> int:
    events.sort()
    heap: list[int] = []
    for start, end in events:
        if heap and heap[0] <= start:
            heapq.heapreplace(heap, end)
        else:
            heapq.heappush(heap, end)
    return len(heap)
```

**TypeScript:**
```typescript
function minWorkers(events: number[][]): number {
  events.sort((a, b) => a[0] - b[0]);
  const heap: number[] = []; // min-heap via re-sort for clarity
  for (const [start, end] of events) {
    if (heap.length && heap[0] <= start) heap.shift();
    heap.push(end);
    heap.sort((a, b) => a - b);
  }
  return heap.length;
}
```

**Java:**
```java
int minWorkers(int[][] events) {
  Arrays.sort(events, (a, b) -> Integer.compare(a[0], b[0]));
  PriorityQueue<Integer> heap = new PriorityQueue<>();
  for (int[] e : events) {
    if (!heap.isEmpty() && heap.peek() <= e[0]) heap.poll();
    heap.offer(e[1]);
  }
  return heap.size();
}
```

**Key points:**
- Sort + min-heap of end times gives O(n log n) time, O(n) space.
- Peak concurrent overlap equals the minimum workers (rooms) needed.

**Tags:** #algorithm

---

### 31. Find Median from Data Stream

**Difficulty:** Hard
**Topics:** heap, design, two-heaps
**Position:** Backend SWE
**Years:** L12+

**Question:** Support adding numbers from a stream and querying the running median at any time.

**Approach:** Keep a max-heap for the lower half and a min-heap for the upper half, rebalancing so their sizes differ by at most one. The median is the top of the larger heap, or the average of both tops. Add is O(log n); query is O(1). Useful for Xiaomi device-telemetry pipelines that report p50 latency online.

**Python:**
```python
import heapq

class MedianFinder:
    def __init__(self) -> None:
        self.small: list[int] = []  # max-heap via negation
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
  private nums: number[] = []; // kept sorted

  addNum(num: number): void {
    let lo = 0, hi = this.nums.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.nums[mid] < num) lo = mid + 1;
      else hi = mid;
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

  void addNum(int num) {
    small.offer(num);
    large.offer(small.poll());
    if (large.size() > small.size()) small.offer(large.poll());
  }

  double findMedian() {
    if (small.size() > large.size()) return small.peek();
    return (small.peek() + large.peek()) / 2.0;
  }
}
```

**Key points:**
- Two balanced heaps give O(log n) inserts and O(1) median lookups.
- The invariant is small.size == large.size or small.size == large.size + 1.

**Follow-ups:**
- How would you support a sliding window over the last k readings?
- How do you approximate the median under memory limits (e.g. t-digest)?

**Tags:** #algorithm

---

### 32. K Closest Points to Origin

**Difficulty:** Medium
**Topics:** heap, sorting, geometry
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Given a list of points on a plane, return the `k` points closest to the origin (Euclidean distance).

**Approach:** Maintain a size-k max-heap keyed by squared distance; the root is the farthest of the current best k, so evict it whenever a closer point arrives. Time O(n log k), space O(k). Compares distances without a sqrt. Handy for finding the k nearest Mi Home devices or service nodes to a user.

**Python:**
```python
import heapq

def k_closest(points: list[list[int]], k: int) -> list[list[int]]:
    heap: list[tuple[int, list[int]]] = []
    for x, y in points:
        d = -(x * x + y * y)
        if len(heap) < k:
            heapq.heappush(heap, (d, [x, y]))
        elif d > heap[0][0]:
            heapq.heapreplace(heap, (d, [x, y]))
    return [p for _, p in heap]
```

**TypeScript:**
```typescript
function kClosest(points: number[][], k: number): number[][] {
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
- Compare squared distances to avoid floating-point sqrt.
- Size-k max-heap gives O(n log k); quickselect averages O(n).

**Follow-ups:**
- How would you adapt this to a stream of incoming points?
- What changes for k nearest neighbors in high dimensions?

**Tags:** #algorithm

---

## Stack / Queue

### 33. Valid Parentheses

**Difficulty:** Easy
**Topics:** stack, string
**Position:** Backend SWE
**Years:** L8-L9

**Question:** Given a string containing `()[]{}`, determine whether brackets are correctly opened and closed in order.

**Approach:** Push opening brackets; on a closing bracket, the stack top must be its matching opener. Stack empty at the end means balanced. Time O(n), space O(n).

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
  Deque<Character> stack = new ArrayDeque<>();
  Map<Character, Character> pairs = Map.of(')', '(', ']', '[', '}', '{');
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
- Stack gives O(n) time and O(n) space.
- Check for an empty stack before popping on a closing bracket.

**Follow-ups:**
- Return the minimum insertions/deletions to make it valid.
- Support nested generic open/close tokens or HTML-like tags.
- Find the length of the longest valid parentheses substring (DP/stack).

**Tags:** #algorithm

---

### 34. Sensor Data Sliding-Window Maximum

**Difficulty:** Hard
**Topics:** sliding-window, deque, monotonic-queue
**Position:** Embedded Engineer
**Years:** L10-L11

**Question:** A Xiaomi sensor streams readings; for a window of size `k` sliding across the stream, report the maximum reading in each window (used for spike detection).

**Approach:** Monotonic decreasing deque of indices — pop smaller tail values before pushing, pop the front when it slides out of the window. The front is always the window max. Time O(n), space O(k).

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
        if dq[0] == i - k:
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
    if (dq[0] === i - k) dq.shift();
    if (i >= k - 1) out.push(nums[dq[0]]);
  }
  return out;
}
```

**Java:**
```java
int[] maxSlidingWindow(int[] nums, int k) {
  Deque<Integer> dq = new ArrayDeque<>();
  int[] out = new int[nums.length - k + 1];
  int idx = 0;
  for (int i = 0; i < nums.length; i++) {
    while (!dq.isEmpty() && nums[dq.peekLast()] <= nums[i]) dq.pollLast();
    dq.offerLast(i);
    if (dq.peekFirst() == i - k) dq.pollFirst();
    if (i >= k - 1) out[idx++] = nums[dq.peekFirst()];
  }
  return out;
}
```

**Key points:**
- Each index is pushed and popped at most once → O(n) time, O(k) space.
- The deque stays monotonically decreasing so its front is the window max.

**Tags:** #algorithm

---

### 35. Min Stack

**Difficulty:** Medium
**Topics:** stack, design
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Design a stack supporting push, pop, top, and retrieving the minimum element, all in O(1).

**Approach:** Store each element together with the minimum seen up to and including it. The top pair's second field is always the current minimum, so every operation is O(1) time and O(n) space.

**Python:**
```python
class MinStack:
    def __init__(self) -> None:
        self.stack: list[tuple[int, int]] = []  # (value, min-so-far)

    def push(self, val: int) -> None:
        cur_min = val if not self.stack else min(val, self.stack[-1][1])
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

  pop(): void {
    this.stack.pop();
  }

  top(): number {
    return this.stack[this.stack.length - 1][0];
  }

  getMin(): number {
    return this.stack[this.stack.length - 1][1];
  }
}
```

**Java:**
```java
class MinStack {
  private final Deque<int[]> stack = new ArrayDeque<>();

  void push(int val) {
    int min = stack.isEmpty() ? val : Math.min(val, stack.peek()[1]);
    stack.push(new int[]{val, min});
  }

  void pop() { stack.pop(); }

  int top() { return stack.peek()[0]; }

  int getMin() { return stack.peek()[1]; }
}
```

**Key points:**
- Pairing each value with the running minimum keeps every op O(1).
- Alternative: a second stack that only tracks minimums.

**Follow-ups:**
- How would you also support O(1) getMax?
- How can you reduce the extra space when values rarely change the min?

**Tags:** #algorithm

---

### 36. Daily Temperatures

**Difficulty:** Medium
**Topics:** stack, monotonic-stack, array
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Given daily temperatures, return for each day how many days until a warmer temperature; 0 if none.

**Approach:** Keep a monotonic decreasing stack of indices. When the current temperature exceeds the temperature at the stack top, that earlier day's answer is the index gap, so pop and fill it. Each index is pushed and popped once, giving O(n) time and O(n) space. The same monotonic-stack pattern fits sensor-threshold waiting-time queries.

**Python:**
```python
def daily_temperatures(temps: list[int]) -> list[int]:
    res = [0] * len(temps)
    stack: list[int] = []  # indices, decreasing temps
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
  const res = new Array(temps.length).fill(0);
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
- A monotonic decreasing stack resolves each day's next-greater in O(n) total.
- Every index is pushed and popped at most once.

**Follow-ups:**
- How would you return the next cooler day instead?
- Can you stream the input and answer as data arrives?

**Tags:** #algorithm

---

## Hash Table

### 37. Two Sum

**Difficulty:** Easy
**Topics:** array, hash-table
**Position:** Backend SWE
**Years:** L8-L9

**Question:** Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`. Exactly one solution exists; you may not use the same element twice.

**Approach:** Single pass with a hash map from value → index. For each element, check whether `target - x` was already seen; if so return both indices, otherwise store the current value. Time O(n), space O(n) — strictly better than the O(n^2) brute force.

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
    if (seen.containsKey(need)) return new int[] {seen.get(need), i};
    seen.put(nums[i], i);
  }
  return new int[] {};
}
```

**Key points:**
- Hash map turns the inner lookup into O(1), giving overall O(n) time and O(n) space.
- Store the value after checking so you never pair an element with itself.

**Follow-ups:**
- Return all unique pairs (not just one) — sort + two pointers.
- Array is sorted — solve in O(1) extra space with two pointers.
- Numbers can repeat and you need counts — use a frequency map.

**Tags:** #algorithm

---

### 38. Valid Anagram

**Difficulty:** Easy
**Topics:** string, hash-table, counting
**Position:** Backend SWE
**Years:** L8-L9

**Question:** Given two strings `s` and `t`, return whether `t` is an anagram of `s` (same characters with the same frequencies).

**Approach:** Count character frequencies in `s`, then decrement for `t`; all counts must end at zero (and lengths must match). Time O(n), space O(1) for a fixed alphabet (O(k) in general).

**Python:**
```python
from collections import Counter

def is_anagram(s: str, t: str) -> bool:
    return len(s) == len(t) and Counter(s) == Counter(t)
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
- O(n) time; O(1) space for a fixed 26-letter alphabet.
- Length check first short-circuits unequal inputs.

**Follow-ups:**
- Unicode input — use a hash map instead of a fixed array.
- Group all anagrams in a list — key by sorted string or count signature.
- Case-insensitive / ignore spaces — normalize first.

**Tags:** #algorithm

---

### 39. Longest Substring Without Repeating Characters

**Difficulty:** Medium
**Topics:** string, sliding-window, hash-table
**Position:** Backend SWE
**Years:** L8-L9

**Question:** Return the length of the longest substring of `s` that contains no repeated characters.

**Approach:** Sliding window with a map of last-seen index. When a repeat falls inside the window, jump the left edge past it. Time O(n), space O(min(n, alphabet)).

**Python:**
```python
def length_of_longest_substring(s: str) -> int:
    last: dict[str, int] = {}
    left = best = 0
    for right, c in enumerate(s):
        if c in last and last[c] >= left:
            left = last[c] + 1
        last[c] = right
        best = max(best, right - left + 1)
    return best
```

**TypeScript:**
```typescript
function lengthOfLongestSubstring(s: string): number {
  const last = new Map<string, number>();
  let left = 0, best = 0;
  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    if (last.has(c) && last.get(c)! >= left) left = last.get(c)! + 1;
    last.set(c, right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}
```

**Java:**
```java
int lengthOfLongestSubstring(String s) {
  Map<Character, Integer> last = new HashMap<>();
  int left = 0, best = 0;
  for (int right = 0; right < s.length(); right++) {
    char c = s.charAt(right);
    if (last.containsKey(c) && last.get(c) >= left) left = last.get(c) + 1;
    last.put(c, right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}
```

**Key points:**
- Each index enters/leaves the window once → O(n) time.
- Space is O(min(n, alphabet)) for the last-seen map.

**Tags:** #algorithm

---

### 40. Minimum Window Substring

**Difficulty:** Hard
**Topics:** string, sliding-window, hash-table
**Position:** Senior SWE
**Years:** L10-L11

**Question:** Given strings `s` and `t`, return the smallest substring of `s` containing all characters of `t` (with multiplicity), or "" if none.

**Approach:** Expand the right edge counting needed characters; once the window is valid, shrink from the left while still valid, recording the best. Time O(n + m), space O(alphabet).

**Python:**
```python
from collections import Counter

def min_window(s: str, t: str) -> str:
    if not t or not s:
        return ""
    need = Counter(t)
    missing = len(t)
    left = start = 0
    end = float("inf")
    for right, c in enumerate(s):
        if need[c] > 0:
            missing -= 1
        need[c] -= 1
        while missing == 0:
            if right - left < end - start:
                start, end = left, right
            need[s[left]] += 1
            if need[s[left]] > 0:
                missing += 1
            left += 1
    return "" if end == float("inf") else s[start:end + 1]
```

**TypeScript:**
```typescript
function minWindow(s: string, t: string): string {
  if (!s || !t) return "";
  const need = new Map<string, number>();
  for (const c of t) need.set(c, (need.get(c) ?? 0) + 1);
  let missing = t.length, left = 0, start = 0, end = Infinity;
  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    if ((need.get(c) ?? 0) > 0) missing--;
    need.set(c, (need.get(c) ?? 0) - 1);
    while (missing === 0) {
      if (right - left < end - start) { start = left; end = right; }
      const lc = s[left];
      need.set(lc, (need.get(lc) ?? 0) + 1);
      if ((need.get(lc) ?? 0) > 0) missing++;
      left++;
    }
  }
  return end === Infinity ? "" : s.slice(start, end + 1);
}
```

**Java:**
```java
String minWindow(String s, String t) {
  if (s.isEmpty() || t.isEmpty()) return "";
  int[] need = new int[128];
  for (char c : t.toCharArray()) need[c]++;
  int missing = t.length(), left = 0, start = 0, end = -1, best = Integer.MAX_VALUE;
  for (int right = 0; right < s.length(); right++) {
    if (need[s.charAt(right)]-- > 0) missing--;
    while (missing == 0) {
      if (right - left + 1 < best) { best = right - left + 1; start = left; end = right; }
      if (++need[s.charAt(left)] > 0) missing++;
      left++;
    }
  }
  return end == -1 ? "" : s.substring(start, end + 1);
}
```

**Key points:**
- Each character is added and removed at most once → O(n + m) time.
- `missing` counter avoids rescanning the need map to check validity.

**Tags:** #algorithm

---

### 41. Word Break

**Difficulty:** Medium
**Topics:** dynamic-programming, string, hash-table
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Given a string `s` and a dictionary `wordDict`, return whether `s` can be segmented into a space-separated sequence of dictionary words.

**Approach:** DP where `dp[i]` is true if `s[:i]` is segmentable; for each i, check a split j with `dp[j]` true and `s[j:i]` in the set. Time O(n^2) (times word length for lookups), space O(n).

**Python:**
```python
def word_break(s: str, word_dict: list[str]) -> bool:
    words = set(word_dict)
    dp = [True] + [False] * len(s)
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
  for (let i = 1; i <= s.length; i++) {
    for (let j = 0; j < i; j++) {
      if (dp[j] && words.has(s.slice(j, i))) { dp[i] = true; break; }
    }
  }
  return dp[s.length];
}
```

**Java:**
```java
boolean wordBreak(String s, List<String> wordDict) {
  Set<String> words = new HashSet<>(wordDict);
  boolean[] dp = new boolean[s.length() + 1];
  dp[0] = true;
  for (int i = 1; i <= s.length(); i++) {
    for (int j = 0; j < i; j++) {
      if (dp[j] && words.contains(s.substring(j, i))) { dp[i] = true; break; }
    }
  }
  return dp[s.length()];
}
```

**Key points:**
- O(n^2) substring checks (set lookups average O(L)), O(n) space.
- `dp[0] = true` seeds the empty prefix as segmentable.

**Tags:** #algorithm

---

### 42. Group Anagrams

**Difficulty:** Medium
**Topics:** hash-table, string, sorting
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Group a list of strings so that anagrams of each other are in the same group.

**Approach:** Use the sorted characters of each word as a canonical hash key; all anagrams collapse to the same key. Time O(n * k log k) for n words of length up to k, space O(n * k). A counting-based key gives O(n * k).

**Python:**
```python
from collections import defaultdict

def group_anagrams(strs: list[str]) -> list[list[str]]:
    groups: dict[str, list[str]] = defaultdict(list)
    for s in strs:
        key = "".join(sorted(s))
        groups[key].append(s)
    return list(groups.values())
```

**TypeScript:**
```typescript
function groupAnagrams(strs: string[]): string[][] {
  const groups = new Map<string, string[]>();
  for (const s of strs) {
    const key = [...s].sort().join("");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }
  return [...groups.values()];
}
```

**Java:**
```java
List<List<String>> groupAnagrams(String[] strs) {
  Map<String, List<String>> groups = new HashMap<>();
  for (String s : strs) {
    char[] c = s.toCharArray();
    Arrays.sort(c);
    groups.computeIfAbsent(new String(c), k -> new ArrayList<>()).add(s);
  }
  return new ArrayList<>(groups.values());
}
```

**Key points:**
- Sorted characters form a canonical key shared by all anagrams.
- A 26-length count array is a faster O(k) key for lowercase input.

**Follow-ups:**
- Which key is better when words are long but the alphabet is small?
- How would you group across a stream that cannot fit in memory?

**Tags:** #algorithm

---

### 43. Longest Consecutive Sequence

**Difficulty:** Medium
**Topics:** hash-table, array, union-find
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Given an unsorted array, return the length of the longest run of consecutive integers.

**Approach:** Put all numbers in a hash set. Only start counting a run at a number whose predecessor is absent, then walk upward while successors exist. Each number is visited at most twice, giving O(n) time and O(n) space without sorting.

**Python:**
```python
def longest_consecutive(nums: list[int]) -> int:
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
  const s = new Set(nums);
  let best = 0;
  for (const x of s) {
    if (!s.has(x - 1)) {
      let length = 1;
      while (s.has(x + length)) length++;
      best = Math.max(best, length);
    }
  }
  return best;
}
```

**Java:**
```java
int longestConsecutive(int[] nums) {
  Set<Integer> s = new HashSet<>();
  for (int x : nums) s.add(x);
  int best = 0;
  for (int x : s) {
    if (!s.contains(x - 1)) {
      int length = 1;
      while (s.contains(x + length)) length++;
      best = Math.max(best, length);
    }
  }
  return best;
}
```

**Key points:**
- Starting runs only at sequence heads keeps the total work O(n).
- A hash set avoids the O(n log n) cost of sorting.

**Follow-ups:**
- How would you also return the sequence itself, not just its length?
- What if the array has billions of entries across shards?

**Tags:** #algorithm

---

## Binary Search

### 44. Find Minimum in Rotated Sorted Array

**Difficulty:** Medium
**Topics:** binary-search, array
**Position:** Backend SWE
**Years:** L10-L11

**Question:** A sorted array of distinct values was rotated at some pivot. Return its minimum element in O(log n).

**Approach:** Binary search comparing the mid element with the right boundary. If mid is greater than the rightmost element, the minimum lies strictly to the right; otherwise it is at mid or to its left. Converge until lo == hi. Time O(log n), space O(1).

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
int findMin(int[] nums) {
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
- Comparing mid to the right boundary avoids ambiguity from the left side.
- Half-open convergence (lo < hi, hi = mid) prevents infinite loops.

**Follow-ups:**
- How does the logic change when duplicates are allowed?
- How would you also return the rotation pivot index?

**Tags:** #algorithm

---

### 45. Search a 2D Matrix

**Difficulty:** Medium
**Topics:** binary-search, matrix
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Search a target in an m x n matrix where each row is sorted and each row's first value is greater than the previous row's last value.

**Approach:** Treat the matrix as one sorted array of length m*n and binary search over the flat index, mapping index i to row i/cols and column i%cols. Time O(log(m*n)), space O(1).

**Python:**
```python
def search_matrix(matrix: list[list[int]], target: int) -> bool:
    if not matrix or not matrix[0]:
        return False
    cols = len(matrix[0])
    lo, hi = 0, len(matrix) * cols - 1
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
    if (val < target) lo = mid + 1;
    else hi = mid - 1;
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
    if (val < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return false;
}
```

**Key points:**
- The whole matrix behaves as one sorted sequence, enabling a single binary search.
- Index-to-(row, col) mapping uses i / cols and i % cols.

**Follow-ups:**
- What if only rows and columns are sorted independently (staircase search)?
- How would you return the position instead of a boolean?

**Tags:** #algorithm

---

### 46. Koko Eating Bananas

**Difficulty:** Medium
**Topics:** binary-search, search-on-answer
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Given banana piles and h hours, find the minimum integer eating speed such that all piles are finished within h hours (each hour Koko eats from one pile).

**Approach:** Binary search on the answer over speeds in [1, max(piles)]. The hours needed decreases monotonically as speed rises, so search for the smallest speed whose required hours is at most h. Time O(n log(max)), space O(1). The same rate-tuning pattern models throttling OTA download bandwidth to finish within a window.

**Python:**
```python
import math

def min_eating_speed(piles: list[int], h: int) -> int:
    def hours(speed: int) -> int:
        return sum(math.ceil(p / speed) for p in piles)

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
int minEatingSpeed(int[] piles, int h) {
  int lo = 1, hi = 0;
  for (int p : piles) hi = Math.max(hi, p);
  while (lo < hi) {
    int mid = (lo + hi) >>> 1;
    long hours = 0;
    for (int p : piles) hours += (p + mid - 1) / mid;
    if (hours <= h) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}
```

**Key points:**
- Binary search on the answer works because feasibility is monotonic in speed.
- The search bounds are [1, max(piles)]; ceil division counts hours per pile.

**Follow-ups:**
- What if Koko may eat across multiple piles per hour?
- How would you extend this to minimize speed under a total energy budget?

**Tags:** #algorithm

---

## Dynamic Programming

### 47. Best Time to Buy and Sell Stock

**Difficulty:** Easy
**Topics:** array, dynamic-programming
**Position:** Backend SWE
**Years:** L8-L9

**Question:** Given an array `prices` where `prices[i]` is the price on day `i`, maximize profit from a single buy followed by a later sell. Return 0 if no profit is possible.

**Approach:** Track the minimum price seen so far and the best profit if we sold today. One pass, O(n) time and O(1) space. The min-so-far acts as the optimal buy day for any later sell.

**Python:**
```python
def max_profit(prices: list[int]) -> int:
    min_price, best = float("inf"), 0
    for p in prices:
        min_price = min(min_price, p)
        best = max(best, p - min_price)
    return best
```

**TypeScript:**
```typescript
function maxProfit(prices: number[]): number {
  let minPrice = Infinity, best = 0;
  for (const p of prices) {
    minPrice = Math.min(minPrice, p);
    best = Math.max(best, p - minPrice);
  }
  return best;
}
```

**Java:**
```java
int maxProfit(int[] prices) {
  int minPrice = Integer.MAX_VALUE, best = 0;
  for (int p : prices) {
    minPrice = Math.min(minPrice, p);
    best = Math.max(best, p - minPrice);
  }
  return best;
}
```

**Key points:**
- One pass, O(n) time and O(1) space — no need for a nested loop.
- Maintain min-so-far as the implicit best buy day.

**Follow-ups:**
- Allow unlimited transactions (Best Time II) — sum all positive deltas.
- At most k transactions — DP over (day, transactions).
- Add a transaction fee or cooldown day — state-machine DP.

**Tags:** #algorithm

---

### 48. Maximum Subarray

**Difficulty:** Medium
**Topics:** array, dynamic-programming, kadane
**Position:** Backend SWE
**Years:** L8-L9

**Question:** Find the contiguous subarray with the largest sum and return that sum.

**Approach:** Kadane's algorithm — keep a running best-ending-here sum; reset it when it drops below the current element. Track the global max. Time O(n), space O(1).

**Python:**
```python
def max_sub_array(nums: list[int]) -> int:
    best = cur = nums[0]
    for x in nums[1:]:
        cur = max(x, cur + x)
        best = max(best, cur)
    return best
```

**TypeScript:**
```typescript
function maxSubArray(nums: number[]): number {
  let best = nums[0], cur = nums[0];
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
  int best = nums[0], cur = nums[0];
  for (int i = 1; i < nums.length; i++) {
    cur = Math.max(nums[i], cur + nums[i]);
    best = Math.max(best, cur);
  }
  return best;
}
```

**Key points:**
- Kadane runs in O(n) time and O(1) space.
- Handles all-negative arrays because we seed with the first element.

**Follow-ups:**
- Return the subarray indices, not just the sum.
- Maximum product subarray — track min and max (signs flip).
- Circular array variant — combine normal Kadane with total - min subarray.

**Tags:** #algorithm

---

### 49. Climbing Stairs

**Difficulty:** Easy
**Topics:** dynamic-programming, fibonacci
**Position:** Embedded Engineer
**Years:** L8-L9

**Question:** You can climb 1 or 2 steps at a time. How many distinct ways to reach the top of `n` steps?

**Approach:** Fibonacci recurrence `f(n) = f(n-1) + f(n-2)` with two rolling variables. Time O(n), space O(1).

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
  for (int i = 0; i < n; i++) { int t = a + b; a = b; b = t; }
  return a;
}
```

**Key points:**
- Rolling variables make it O(n) time and O(1) space.
- It is the Fibonacci sequence in disguise.

**Tags:** #algorithm

---

### 50. Coin Change

**Difficulty:** Medium
**Topics:** dynamic-programming, unbounded-knapsack
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Given coin denominations and an `amount`, return the fewest coins to make the amount, or -1 if impossible.

**Approach:** Bottom-up DP where `dp[x]` is the min coins for amount `x`; relax over each coin. Time O(amount * coins), space O(amount).

**Python:**
```python
def coin_change(coins: list[int], amount: int) -> int:
    dp = [0] + [float("inf")] * amount
    for x in range(1, amount + 1):
        for c in coins:
            if c <= x:
                dp[x] = min(dp[x], dp[x - c] + 1)
    return -1 if dp[amount] == float("inf") else dp[amount]
```

**TypeScript:**
```typescript
function coinChange(coins: number[], amount: number): number {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let x = 1; x <= amount; x++)
    for (const c of coins)
      if (c <= x) dp[x] = Math.min(dp[x], dp[x - c] + 1);
  return dp[amount] === Infinity ? -1 : dp[amount];
}
```

**Java:**
```java
int coinChange(int[] coins, int amount) {
  int[] dp = new int[amount + 1];
  Arrays.fill(dp, amount + 1);
  dp[0] = 0;
  for (int x = 1; x <= amount; x++)
    for (int c : coins)
      if (c <= x) dp[x] = Math.min(dp[x], dp[x - c] + 1);
  return dp[amount] > amount ? -1 : dp[amount];
}
```

**Key points:**
- O(amount * number_of_coins) time and O(amount) space.
- Unbounded knapsack: coins may be reused, so iterate amounts outward.

**Tags:** #algorithm

---

### 51. Longest Increasing Subsequence

**Difficulty:** Medium
**Topics:** dynamic-programming, binary-search
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Return the length of the longest strictly increasing subsequence of `nums`.

**Approach:** Patience sorting — maintain `tails`, where `tails[i]` is the smallest tail of an increasing subsequence of length i+1; binary-search the insertion point for each value. Time O(n log n), space O(n).

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
    if (lo === tails.length) tails.push(x); else tails[lo] = x;
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
- Binary-searched tails array gives O(n log n) time, O(n) space.
- The O(n^2) DP is simpler but slower; mention both.

**Tags:** #algorithm

---

### 52. House Robber

**Difficulty:** Medium
**Topics:** dynamic-programming
**Position:** Backend SWE
**Years:** L8-L9

**Question:** Given non-negative house values, maximize the total robbed without taking two adjacent houses.

**Approach:** DP `rob(i) = max(skip i, value[i] + rob(i-2))` with two rolling variables. Time O(n), space O(1).

**Python:**
```python
def rob(nums: list[int]) -> int:
    prev = cur = 0
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
- Two rolling values yield O(n) time and O(1) space.
- Each house is either robbed (with i-2) or skipped (keep i-1).

**Tags:** #algorithm

---

### 53. Edit Distance

**Difficulty:** Hard
**Topics:** dynamic-programming, string
**Position:** Senior SWE
**Years:** L10-L11

**Question:** Return the minimum number of insert/delete/replace operations to convert `word1` into `word2`.

**Approach:** 2D DP where `dp[i][j]` is the edit distance of prefixes; match → diagonal, else 1 + min(insert, delete, replace). Time O(n*m), space O(n*m) (reducible to O(min(n,m))).

**Python:**
```python
def min_distance(word1: str, word2: str) -> int:
    n, m = len(word1), len(word2)
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        dp[i][0] = i
    for j in range(m + 1):
        dp[0][j] = j
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            if word1[i - 1] == word2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    return dp[n][m]
```

**TypeScript:**
```typescript
function minDistance(word1: string, word2: string): number {
  const n = word1.length, m = word2.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (word1[i - 1] === word2[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[n][m];
}
```

**Java:**
```java
int minDistance(String word1, String word2) {
  int n = word1.length(), m = word2.length();
  int[][] dp = new int[n + 1][m + 1];
  for (int i = 0; i <= n; i++) dp[i][0] = i;
  for (int j = 0; j <= m; j++) dp[0][j] = j;
  for (int i = 1; i <= n; i++) {
    for (int j = 1; j <= m; j++) {
      if (word1.charAt(i - 1) == word2.charAt(j - 1)) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], Math.min(dp[i - 1][j], dp[i][j - 1]));
    }
  }
  return dp[n][m];
}
```

**Key points:**
- Classic O(n*m) time, O(n*m) space DP (rolling rows cut space to O(min(n,m))).
- Three transitions correspond to delete, insert, and replace.

**Tags:** #algorithm

---

### 54. Battery Power Optimization (DP)

**Difficulty:** Medium
**Topics:** dynamic-programming
**Position:** Embedded Engineer
**Years:** L10-L11

**Question:** A Xiaomi device can run background tasks, each with a power cost and a utility value, but two adjacent tasks in the schedule cannot both run (they contend for the same hardware block). Given the ordered task values, maximize total utility under the no-adjacent constraint.

**Approach:** This is House Robber in disguise: `best(i) = max(skip i, value[i] + best(i-2))`, computed with two rolling variables. Time O(n), space O(1).

**Python:**
```python
def max_utility(values: list[int]) -> int:
    prev = cur = 0
    for v in values:
        prev, cur = cur, max(cur, prev + v)
    return cur
```

**TypeScript:**
```typescript
function maxUtility(values: number[]): number {
  let prev = 0, cur = 0;
  for (const v of values) { const t = Math.max(cur, prev + v); prev = cur; cur = t; }
  return cur;
}
```

**Java:**
```java
int maxUtility(int[] values) {
  int prev = 0, cur = 0;
  for (int v : values) { int t = Math.max(cur, prev + v); prev = cur; cur = t; }
  return cur;
}
```

**Key points:**
- Linear DP with two rolling variables → O(n) time, O(1) space.
- The no-adjacent constraint maps exactly to the House Robber recurrence.

**Tags:** #algorithm

---

### 55. Unique Paths

**Difficulty:** Medium
**Topics:** dynamic-programming, combinatorics
**Position:** Backend SWE
**Years:** L10-L11

**Question:** A robot on an `m x n` grid starts at the top-left and may move only right or down; count the number of distinct paths to the bottom-right corner.

**Approach:** Each cell's path count is the sum of the cell above and the cell to the left. A single rolling row suffices since we only need the previous row. Time O(m*n), space O(n) — the same grid-traversal counting that shows up in Xiaomi warehouse/robot routing problems.

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
- 1D rolling array reduces space from O(m*n) to O(n).
- Closed form is the binomial coefficient C(m+n-2, m-1).

**Follow-ups:**
- How would you handle obstacles in some cells (Unique Paths II)?
- What if diagonal moves were also allowed?

**Tags:** #algorithm

---

### 56. Longest Common Subsequence

**Difficulty:** Medium
**Topics:** dynamic-programming, strings
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Given two strings, return the length of their longest common subsequence (characters need not be contiguous but must keep order).

**Approach:** 2D DP where `dp[i][j]` is the LCS of the first `i` chars of `a` and first `j` chars of `b`. On a match extend the diagonal; otherwise take the best of dropping one character from either side. Time O(m*n), space O(m*n) — the backbone of OTA delta-diffing and config-file comparison at Xiaomi.

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
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
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
- Match extends the diagonal; mismatch takes the max of two neighbors.
- Space can be reduced to O(min(m, n)) with two rolling rows.

**Follow-ups:**
- How would you reconstruct the actual subsequence, not just its length?
- How does this relate to edit distance and to `diff`?

**Tags:** #algorithm

---

### 57. Maximum Product Subarray

**Difficulty:** Medium
**Topics:** dynamic-programming, arrays
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Given an integer array, find the contiguous subarray with the largest product and return that product.

**Approach:** Unlike max-sum, a negative number flips the ranking, so track both the running max and running min product. On a negative value swap them, then extend each with the current element. Time O(n), space O(1) — handy for streaming gain/scaling factors in Xiaomi sensor pipelines.

**Python:**
```python
def max_product(nums: list[int]) -> int:
    res = cur_max = cur_min = nums[0]
    for x in nums[1:]:
        if x < 0:
            cur_max, cur_min = cur_min, cur_max
        cur_max = max(x, cur_max * x)
        cur_min = min(x, cur_min * x)
        res = max(res, cur_max)
    return res
```

**TypeScript:**
```typescript
function maxProduct(nums: number[]): number {
  let res = nums[0], curMax = nums[0], curMin = nums[0];
  for (let i = 1; i < nums.length; i++) {
    const x = nums[i];
    if (x < 0) [curMax, curMin] = [curMin, curMax];
    curMax = Math.max(x, curMax * x);
    curMin = Math.min(x, curMin * x);
    res = Math.max(res, curMax);
  }
  return res;
}
```

**Java:**
```java
int maxProduct(int[] nums) {
  int res = nums[0], curMax = nums[0], curMin = nums[0];
  for (int i = 1; i < nums.length; i++) {
    int x = nums[i];
    if (x < 0) { int t = curMax; curMax = curMin; curMin = t; }
    curMax = Math.max(x, curMax * x);
    curMin = Math.min(x, curMin * x);
    res = Math.max(res, curMax);
  }
  return res;
}
```

**Key points:**
- Keep both max and min because a negative multiplier swaps their roles.
- Zeros naturally reset the window since `max(x, ...)` picks `x`.

**Follow-ups:**
- How would you also return the subarray's indices?
- Why does the O(1) state (max/min) work whereas a single variable fails?

**Tags:** #algorithm

---

### 58. Decode Ways

**Difficulty:** Medium
**Topics:** dynamic-programming, strings
**Position:** Backend SWE
**Years:** L10-L11

**Question:** A message of digits is encoded with `'A'->"1" ... 'Z'->"26"`. Given the digit string, count how many ways it can be decoded.

**Approach:** Fibonacci-style DP: at each index add ways from the previous index if the single digit is valid (1-9), plus ways from two indices back if the two-digit number is 10-26. Rolling two variables gives Time O(n), space O(1) — the kind of prefix ambiguity that appears in Xiaomi barcode/serial-number parsing.

**Python:**
```python
def num_decodings(s: str) -> int:
    if not s or s[0] == "0":
        return 0
    prev, cur = 1, 1
    for i in range(1, len(s)):
        nxt = 0
        if s[i] != "0":
            nxt += cur
        if 10 <= int(s[i - 1:i + 1]) <= 26:
            nxt += prev
        prev, cur = cur, nxt
    return cur
```

**TypeScript:**
```typescript
function numDecodings(s: string): number {
  if (!s || s[0] === "0") return 0;
  let prev = 1, cur = 1;
  for (let i = 1; i < s.length; i++) {
    let nxt = 0;
    if (s[i] !== "0") nxt += cur;
    const two = Number(s.slice(i - 1, i + 1));
    if (two >= 10 && two <= 26) nxt += prev;
    prev = cur;
    cur = nxt;
  }
  return cur;
}
```

**Java:**
```java
int numDecodings(String s) {
  if (s.isEmpty() || s.charAt(0) == '0') return 0;
  int prev = 1, cur = 1;
  for (int i = 1; i < s.length(); i++) {
    int nxt = 0;
    if (s.charAt(i) != '0') nxt += cur;
    int two = Integer.parseInt(s.substring(i - 1, i + 1));
    if (two >= 10 && two <= 26) nxt += prev;
    prev = cur;
    cur = nxt;
  }
  return cur;
}
```

**Key points:**
- A leading '0' or an isolated '0' with no valid two-digit pair yields 0 ways.
- Only the two-digit range 10-26 (never 27-99 or 00-09) contributes the extra path.

**Follow-ups:**
- How would you handle the '*' wildcard variant (Decode Ways II)?
- How would you reconstruct one valid decoding string?

**Tags:** #algorithm

---

## Backtracking

### 59. Word Search

**Difficulty:** Medium
**Topics:** backtracking, dfs, matrix
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Given a grid of letters and a `word`, return whether the word can be formed via adjacent (4-directional) cells without reusing a cell.

**Approach:** DFS backtracking from each cell, marking visited cells temporarily and restoring on return. Time O(rows*cols*4^L), space O(L) recursion for word length L.

**Python:**
```python
def exist(board: list[list[str]], word: str) -> bool:
    rows, cols = len(board), len(board[0])
    def dfs(r, c, i) -> bool:
        if i == len(word):
            return True
        if r < 0 or c < 0 or r >= rows or c >= cols or board[r][c] != word[i]:
            return False
        board[r][c] = "#"
        found = (dfs(r + 1, c, i + 1) or dfs(r - 1, c, i + 1) or
                 dfs(r, c + 1, i + 1) or dfs(r, c - 1, i + 1))
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

boolean dfs(char[][] board, String word, int r, int c, int i) {
  if (i == word.length()) return true;
  if (r < 0 || c < 0 || r >= board.length || c >= board[0].length || board[r][c] != word.charAt(i))
    return false;
  char tmp = board[r][c];
  board[r][c] = '#';
  boolean found = dfs(board, word, r + 1, c, i + 1) || dfs(board, word, r - 1, c, i + 1)
               || dfs(board, word, r, c + 1, i + 1) || dfs(board, word, r, c - 1, i + 1);
  board[r][c] = tmp;
  return found;
}
```

**Key points:**
- Worst case O(rows*cols*4^L) time; recursion depth O(L).
- Temporarily marking the cell prevents reuse within one path.

**Tags:** #algorithm

---

### 60. Subsets

**Difficulty:** Medium
**Topics:** backtracking, bit-manipulation
**Position:** Backend SWE
**Years:** L8-L9

**Question:** Return all subsets (the power set) of a list of distinct integers.

**Approach:** Backtracking — at each index choose to include or skip, recording the running subset. Time O(n * 2^n), space O(n) recursion plus output.

**Python:**
```python
def subsets(nums: list[int]) -> list[list[int]]:
    res: list[list[int]] = []
    def backtrack(start: int, path: list[int]) -> None:
        res.append(path[:])
        for i in range(start, len(nums)):
            path.append(nums[i])
            backtrack(i + 1, path)
            path.pop()
    backtrack(0, [])
    return res
```

**TypeScript:**
```typescript
function subsets(nums: number[]): number[][] {
  const res: number[][] = [];
  const backtrack = (start: number, path: number[]) => {
    res.push([...path]);
    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]);
      backtrack(i + 1, path);
      path.pop();
    }
  };
  backtrack(0, []);
  return res;
}
```

**Java:**
```java
List<List<Integer>> subsets(int[] nums) {
  List<List<Integer>> res = new ArrayList<>();
  backtrack(nums, 0, new ArrayList<>(), res);
  return res;
}

void backtrack(int[] nums, int start, List<Integer> path, List<List<Integer>> res) {
  res.add(new ArrayList<>(path));
  for (int i = start; i < nums.length; i++) {
    path.add(nums[i]);
    backtrack(nums, i + 1, path, res);
    path.remove(path.size() - 1);
  }
}
```

**Key points:**
- 2^n subsets, each up to length n → O(n * 2^n) time.
- A bitmask over 0..2^n-1 is an equivalent iterative formulation.

**Tags:** #algorithm

---

### 61. Permutations

**Difficulty:** Medium
**Topics:** backtracking
**Position:** Backend SWE
**Years:** L8-L9

**Question:** Return all permutations of a list of distinct integers.

**Approach:** Backtracking with a `used` marker (or in-place swaps); fix one element per depth level. Time O(n * n!), space O(n) recursion plus output.

**Python:**
```python
def permute(nums: list[int]) -> list[list[int]]:
    res: list[list[int]] = []
    used = [False] * len(nums)
    def backtrack(path: list[int]) -> None:
        if len(path) == len(nums):
            res.append(path[:])
            return
        for i, x in enumerate(nums):
            if used[i]:
                continue
            used[i] = True
            path.append(x)
            backtrack(path)
            path.pop()
            used[i] = False
    backtrack([])
    return res
```

**TypeScript:**
```typescript
function permute(nums: number[]): number[][] {
  const res: number[][] = [];
  const used = new Array(nums.length).fill(false);
  const backtrack = (path: number[]) => {
    if (path.length === nums.length) { res.push([...path]); return; }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      path.push(nums[i]);
      backtrack(path);
      path.pop();
      used[i] = false;
    }
  };
  backtrack([]);
  return res;
}
```

**Java:**
```java
List<List<Integer>> permute(int[] nums) {
  List<List<Integer>> res = new ArrayList<>();
  backtrack(nums, new boolean[nums.length], new ArrayList<>(), res);
  return res;
}

void backtrack(int[] nums, boolean[] used, List<Integer> path, List<List<Integer>> res) {
  if (path.size() == nums.length) { res.add(new ArrayList<>(path)); return; }
  for (int i = 0; i < nums.length; i++) {
    if (used[i]) continue;
    used[i] = true;
    path.add(nums[i]);
    backtrack(nums, used, path, res);
    path.remove(path.size() - 1);
    used[i] = false;
  }
}
```

**Key points:**
- n! permutations, each O(n) to build → O(n * n!) time.
- The `used` array enforces each element appears once per permutation.

**Tags:** #algorithm

---

### 62. Combination Sum

**Difficulty:** Medium
**Topics:** backtracking, dfs
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Given distinct positive `candidates` and a `target`, return all unique combinations summing to target; each candidate may be reused unlimited times.

**Approach:** Backtracking with a start index to avoid permuted duplicates; reuse the same index since repeats are allowed; prune when the remaining target goes negative. Time O(2^t) worst case, space O(t) recursion.

**Python:**
```python
def combination_sum(candidates: list[int], target: int) -> list[list[int]]:
    res: list[list[int]] = []
    def backtrack(start: int, remain: int, path: list[int]) -> None:
        if remain == 0:
            res.append(path[:])
            return
        for i in range(start, len(candidates)):
            if candidates[i] <= remain:
                path.append(candidates[i])
                backtrack(i, remain - candidates[i], path)
                path.pop()
    backtrack(0, target, [])
    return res
```

**TypeScript:**
```typescript
function combinationSum(candidates: number[], target: number): number[][] {
  const res: number[][] = [];
  const backtrack = (start: number, remain: number, path: number[]) => {
    if (remain === 0) { res.push([...path]); return; }
    for (let i = start; i < candidates.length; i++) {
      if (candidates[i] <= remain) {
        path.push(candidates[i]);
        backtrack(i, remain - candidates[i], path);
        path.pop();
      }
    }
  };
  backtrack(0, target, []);
  return res;
}
```

**Java:**
```java
List<List<Integer>> combinationSum(int[] candidates, int target) {
  List<List<Integer>> res = new ArrayList<>();
  backtrack(candidates, 0, target, new ArrayList<>(), res);
  return res;
}

void backtrack(int[] cand, int start, int remain, List<Integer> path, List<List<Integer>> res) {
  if (remain == 0) { res.add(new ArrayList<>(path)); return; }
  for (int i = start; i < cand.length; i++) {
    if (cand[i] <= remain) {
      path.add(cand[i]);
      backtrack(cand, i, remain - cand[i], path, res);
      path.remove(path.size() - 1);
    }
  }
}
```

**Key points:**
- Exponential O(2^target) worst case; O(target) recursion depth.
- Passing `i` (not `i+1`) allows reusing a candidate; the start index blocks duplicate sets.

**Tags:** #algorithm

---

### 63. Generate Parentheses

**Difficulty:** Medium
**Topics:** backtracking, recursion
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Given `n` pairs of parentheses, generate all combinations of well-formed parentheses.

**Approach:** Backtrack while tracking the count of open and close brackets placed. Add `(` while open < n; add `)` only while close < open, which guarantees validity without a separate check. There are Catalan(n) results, so Time O(4^n / sqrt(n)), space O(n) recursion depth.

**Python:**
```python
def generate_parenthesis(n: int) -> list[str]:
    res: list[str] = []
    def backtrack(path: list[str], open_n: int, close_n: int) -> None:
        if len(path) == 2 * n:
            res.append("".join(path))
            return
        if open_n < n:
            path.append("(")
            backtrack(path, open_n + 1, close_n)
            path.pop()
        if close_n < open_n:
            path.append(")")
            backtrack(path, open_n, close_n + 1)
            path.pop()
    backtrack([], 0, 0)
    return res
```

**TypeScript:**
```typescript
function generateParenthesis(n: number): string[] {
  const res: string[] = [];
  const backtrack = (path: string, open: number, close: number) => {
    if (path.length === 2 * n) { res.push(path); return; }
    if (open < n) backtrack(path + "(", open + 1, close);
    if (close < open) backtrack(path + ")", open, close + 1);
  };
  backtrack("", 0, 0);
  return res;
}
```

**Java:**
```java
List<String> generateParenthesis(int n) {
  List<String> res = new ArrayList<>();
  backtrack(res, new StringBuilder(), 0, 0, n);
  return res;
}

void backtrack(List<String> res, StringBuilder path, int open, int close, int n) {
  if (path.length() == 2 * n) { res.add(path.toString()); return; }
  if (open < n) { path.append('('); backtrack(res, path, open + 1, close, n); path.deleteCharAt(path.length() - 1); }
  if (close < open) { path.append(')'); backtrack(res, path, open, close + 1, n); path.deleteCharAt(path.length() - 1); }
}
```

**Key points:**
- The invariant `close < open` prunes every invalid prefix at generation time.
- Result count is the nth Catalan number.

**Follow-ups:**
- How would you count the combinations without generating them?
- How does this generalize to multiple bracket types?

**Tags:** #algorithm

---

### 64. Letter Combinations of a Phone Number

**Difficulty:** Medium
**Topics:** backtracking, recursion
**Position:** Android Engineer
**Years:** L10-L11

**Question:** Given a string of digits 2-9, return all letter combinations the number could spell on a phone keypad.

**Approach:** Map each digit to its letters and backtrack one digit at a time, appending each candidate letter before recursing to the next digit. With `n` digits and up to 4 letters each, Time O(4^n * n), space O(n) recursion — the classic T9-style expansion familiar from MIUI dialer/contact search.

**Python:**
```python
def letter_combinations(digits: str) -> list[str]:
    if not digits:
        return []
    mapping = {"2": "abc", "3": "def", "4": "ghi", "5": "jkl",
               "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz"}
    res: list[str] = []
    def backtrack(i: int, path: list[str]) -> None:
        if i == len(digits):
            res.append("".join(path))
            return
        for ch in mapping[digits[i]]:
            path.append(ch)
            backtrack(i + 1, path)
            path.pop()
    backtrack(0, [])
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
  const backtrack = (i: number, path: string) => {
    if (i === digits.length) { res.push(path); return; }
    for (const ch of mapping[digits[i]]) backtrack(i + 1, path + ch);
  };
  backtrack(0, "");
  return res;
}
```

**Java:**
```java
List<String> letterCombinations(String digits) {
  List<String> res = new ArrayList<>();
  if (digits.isEmpty()) return res;
  String[] map = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};
  backtrack(digits, 0, new StringBuilder(), map, res);
  return res;
}

void backtrack(String digits, int i, StringBuilder path, String[] map, List<String> res) {
  if (i == digits.length()) { res.add(path.toString()); return; }
  for (char ch : map[digits.charAt(i) - '0'].toCharArray()) {
    path.append(ch);
    backtrack(digits, i + 1, path, map, res);
    path.deleteCharAt(path.length() - 1);
  }
}
```

**Key points:**
- Empty input must return an empty list, not a list with one empty string.
- Depth equals the number of digits; branching factor is 3 or 4 per digit.

**Follow-ups:**
- How would you produce the combinations lazily as an iterator/generator?
- How would you rank outputs against a real dictionary for predictive text?

**Tags:** #algorithm

---

## Two Pointers / Sliding Window

### 65. Valid Palindrome

**Difficulty:** Easy
**Topics:** two-pointers, strings
**Position:** Android Engineer
**Years:** L8-L9

**Question:** Given a string, determine whether it is a palindrome considering only alphanumeric characters and ignoring case.

**Approach:** Two pointers from both ends move inward, skipping non-alphanumeric characters and comparing lowercased letters. Time O(n), space O(1) — a lightweight in-place check suited to memory-constrained Xiaomi embedded/Android code paths.

**Python:**
```python
def is_palindrome(s: str) -> bool:
    i, j = 0, len(s) - 1
    while i < j:
        if not s[i].isalnum():
            i += 1
        elif not s[j].isalnum():
            j -= 1
        elif s[i].lower() != s[j].lower():
            return False
        else:
            i += 1
            j -= 1
    return True
```

**TypeScript:**
```typescript
function isPalindrome(s: string): boolean {
  const isAlnum = (c: string) => /[a-z0-9]/i.test(c);
  let i = 0, j = s.length - 1;
  while (i < j) {
    if (!isAlnum(s[i])) i++;
    else if (!isAlnum(s[j])) j--;
    else if (s[i].toLowerCase() !== s[j].toLowerCase()) return false;
    else { i++; j--; }
  }
  return true;
}
```

**Java:**
```java
boolean isPalindrome(String s) {
  int i = 0, j = s.length() - 1;
  while (i < j) {
    if (!Character.isLetterOrDigit(s.charAt(i))) i++;
    else if (!Character.isLetterOrDigit(s.charAt(j))) j--;
    else if (Character.toLowerCase(s.charAt(i)) != Character.toLowerCase(s.charAt(j))) return false;
    else { i++; j--; }
  }
  return true;
}
```

**Key points:**
- Skipping in-place avoids building a filtered copy, keeping space O(1).
- Normalize case only when comparing, not by mutating the string.

**Follow-ups:**
- How would you allow at most one character deletion (Valid Palindrome II)?
- How would Unicode/locale-aware casing change the comparison?

**Tags:** #algorithm

---

### 66. Trapping Rain Water

**Difficulty:** Hard
**Topics:** two-pointers, arrays
**Position:** Backend SWE
**Years:** L12+

**Question:** Given an array of non-negative bar heights, compute how much rain water can be trapped between the bars after raining.

**Approach:** Two pointers from both ends with running `leftMax`/`rightMax`. Always advance the side with the smaller current height, because that side's water is bounded by its own max. Time O(n), space O(1) — a one-pass technique valued when profiling tight Xiaomi device loops.

**Python:**
```python
def trap(height: list[int]) -> int:
    i, j = 0, len(height) - 1
    left_max = right_max = res = 0
    while i < j:
        if height[i] < height[j]:
            left_max = max(left_max, height[i])
            res += left_max - height[i]
            i += 1
        else:
            right_max = max(right_max, height[j])
            res += right_max - height[j]
            j -= 1
    return res
```

**TypeScript:**
```typescript
function trap(height: number[]): number {
  let i = 0, j = height.length - 1;
  let leftMax = 0, rightMax = 0, res = 0;
  while (i < j) {
    if (height[i] < height[j]) {
      leftMax = Math.max(leftMax, height[i]);
      res += leftMax - height[i];
      i++;
    } else {
      rightMax = Math.max(rightMax, height[j]);
      res += rightMax - height[j];
      j--;
    }
  }
  return res;
}
```

**Java:**
```java
int trap(int[] height) {
  int i = 0, j = height.length - 1;
  int leftMax = 0, rightMax = 0, res = 0;
  while (i < j) {
    if (height[i] < height[j]) {
      leftMax = Math.max(leftMax, height[i]);
      res += leftMax - height[i];
      i++;
    } else {
      rightMax = Math.max(rightMax, height[j]);
      res += rightMax - height[j];
      j--;
    }
  }
  return res;
}
```

**Key points:**
- Water above a bar equals min(leftMax, rightMax) - height; the smaller side's max is already final.
- Two pointers beat the O(n)-space prefix/suffix-max arrays.

**Follow-ups:**
- How would you extend this to the 2D version (Trapping Rain Water II)?
- Can you also return the water profile per column?

**Tags:** #algorithm

---

### 67. Minimum Size Subarray Sum

**Difficulty:** Medium
**Topics:** sliding-window, two-pointers
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Given an array of positive integers and a `target`, return the minimal length of a contiguous subarray whose sum is >= target, or 0 if none exists.

**Approach:** A variable-size sliding window: expand the right edge to grow the sum, then shrink from the left while the sum still meets the target, recording the smallest width. Each index enters and leaves the window once. Time O(n), space O(1) — a rate/throughput-window pattern common in Xiaomi telemetry ingestion.

**Python:**
```python
def min_sub_array_len(target: int, nums: list[int]) -> int:
    left = 0
    total = 0
    res = float("inf")
    for right, x in enumerate(nums):
        total += x
        while total >= target:
            res = min(res, right - left + 1)
            total -= nums[left]
            left += 1
    return 0 if res == float("inf") else res
```

**TypeScript:**
```typescript
function minSubArrayLen(target: number, nums: number[]): number {
  let left = 0, total = 0, res = Infinity;
  for (let right = 0; right < nums.length; right++) {
    total += nums[right];
    while (total >= target) {
      res = Math.min(res, right - left + 1);
      total -= nums[left++];
    }
  }
  return res === Infinity ? 0 : res;
}
```

**Java:**
```java
int minSubArrayLen(int target, int[] nums) {
  int left = 0, total = 0, res = Integer.MAX_VALUE;
  for (int right = 0; right < nums.length; right++) {
    total += nums[right];
    while (total >= target) {
      res = Math.min(res, right - left + 1);
      total -= nums[left++];
    }
  }
  return res == Integer.MAX_VALUE ? 0 : res;
}
```

**Key points:**
- Shrinking inside a `while` (not `if`) finds the tightest window at each right edge.
- The window works only because all values are positive, keeping the sum monotone.

**Follow-ups:**
- How would you solve it in O(n log n) with prefix sums and binary search?
- What breaks if the array can contain negative numbers?

**Tags:** #algorithm

---

## Array / String

### 68. Container With Most Water

**Difficulty:** Medium
**Topics:** array, two-pointer, greedy
**Position:** Backend SWE
**Years:** L8-L9

**Question:** Given heights `height[i]`, pick two lines that with the x-axis form a container holding the most water. Return the maximum area.

**Approach:** Two pointers at both ends; area is `min(h[l], h[r]) * (r - l)`. Move the shorter side inward since it caps the height. Time O(n), space O(1).

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
- Two-pointer sweep is O(n) time, O(1) space versus the O(n^2) brute force.
- Always move the shorter wall — the taller one can never increase area while paired with a shorter one.

**Follow-ups:**
- Trapping Rain Water — sum trapped water across all bars.
- Return the indices of the chosen lines.
- 3D version (Trapping Rain Water II) — min-heap from the border.

**Tags:** #algorithm

---

### 69. 3Sum

**Difficulty:** Medium
**Topics:** array, two-pointer, sorting
**Position:** Backend SWE
**Years:** L8-L9

**Question:** Return all unique triplets `[a, b, c]` in `nums` that sum to zero.

**Approach:** Sort, fix each `i`, then two-pointer the rest for `-nums[i]`. Skip duplicates at all three positions. Sorting is O(n log n); the scan is O(n^2), so overall O(n^2) time, O(1) extra space (besides output).

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
- Sorting enables the two-pointer scan, giving O(n^2) total time.
- Skip duplicate values at i, l, and r to keep triplets unique.

**Follow-ups:**
- 3Sum Closest — track the closest sum to target.
- 4Sum — add an outer loop, O(n^3).
- Count triplets with sum < target instead of equal.

**Tags:** #algorithm

---

### 70. Binary Search

**Difficulty:** Easy
**Topics:** binary-search, array
**Position:** Embedded Engineer
**Years:** L8-L9

**Question:** Given a sorted ascending array `nums` and a `target`, return its index or -1 if absent.

**Approach:** Maintain `[lo, hi]`; compare the midpoint and discard half each step. Use `lo + (hi - lo) // 2` to avoid overflow. Time O(log n), space O(1).

**Python:**
```python
def search(nums: list[int], target: int) -> int:
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
function search(nums: number[], target: number): number {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1; else hi = mid - 1;
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
    if (nums[mid] < target) lo = mid + 1; else hi = mid - 1;
  }
  return -1;
}
```

**Key points:**
- O(log n) time, O(1) space — halve the search space each iteration.
- `lo + (hi - lo) / 2` avoids integer overflow on large bounds.

**Follow-ups:**
- Return the leftmost/rightmost insertion index (lower/upper bound).
- Search a rotated sorted array.
- Binary search on a monotonic answer space (e.g., min capacity).

**Tags:** #algorithm

---

### 71. Search in Rotated Sorted Array

**Difficulty:** Medium
**Topics:** binary-search, array
**Position:** Backend SWE
**Years:** L10-L11

**Question:** A sorted array was rotated at an unknown pivot (distinct values). Find `target`'s index or -1.

**Approach:** Modified binary search: at each step one half is sorted. Detect which half is sorted via `nums[lo] <= nums[mid]`, then decide whether target lies in it. Time O(log n), space O(1).

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
int search(int[] nums, int target) {
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
```

**Key points:**
- Still O(log n) time and O(1) space despite the rotation.
- Identify the sorted half first, then test whether target falls inside it.

**Follow-ups:**
- Allow duplicates (Search in Rotated Sorted Array II) — worst case degrades to O(n).
- Find the minimum / rotation pivot index.
- Find any peak element with binary search.

**Tags:** #algorithm

---

### 72. Product of Array Except Self

**Difficulty:** Medium
**Topics:** array, prefix-product
**Position:** Backend SWE
**Years:** L8-L9

**Question:** Return an array where each element is the product of all other elements, without using division and in O(n).

**Approach:** Two passes — prefix products left-to-right into the output, then multiply by suffix products right-to-left using a running variable. Time O(n), space O(1) excluding the output.

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
  const n = nums.length, out = new Array(n).fill(1);
  for (let i = 1; i < n; i++) out[i] = out[i - 1] * nums[i - 1];
  let right = 1;
  for (let i = n - 1; i >= 0; i--) { out[i] *= right; right *= nums[i]; }
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
  int right = 1;
  for (int i = n - 1; i >= 0; i--) { out[i] *= right; right *= nums[i]; }
  return out;
}
```

**Key points:**
- Two linear passes give O(n) time and O(1) extra space (output excluded).
- Prefix in the array, suffix in a scalar — no division needed.

**Tags:** #algorithm

---

### 73. Merge Intervals

**Difficulty:** Medium
**Topics:** intervals, sorting
**Position:** Backend SWE
**Years:** L8-L9

**Question:** Given intervals `[start, end]`, merge all overlapping intervals.

**Approach:** Sort by start, then sweep — extend the last merged interval when the next overlaps, else append. Time O(n log n) (sort dominates), space O(n).

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
    if (out.length && s <= out[out.length - 1][1]) {
      out[out.length - 1][1] = Math.max(out[out.length - 1][1], e);
    } else {
      out.push([s, e]);
    }
  }
  return out;
}
```

**Java:**
```java
int[][] merge(int[][] intervals) {
  Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
  List<int[]> out = new ArrayList<>();
  for (int[] iv : intervals) {
    if (!out.isEmpty() && iv[0] <= out.get(out.size() - 1)[1]) {
      out.get(out.size() - 1)[1] = Math.max(out.get(out.size() - 1)[1], iv[1]);
    } else {
      out.add(iv);
    }
  }
  return out.toArray(new int[0][]);
}
```

**Key points:**
- Sorting dominates → O(n log n) time, O(n) output space.
- After sorting, a single linear sweep suffices to merge overlaps.

**Tags:** #algorithm

---

### 74. Move Zeroes

**Difficulty:** Easy
**Topics:** array, two-pointers, in-place
**Position:** Backend SWE
**Years:** L8-L9

**Question:** Given an integer array `nums`, move all `0`s to the end while keeping the relative order of the non-zero elements. Do it in place without a copy.

**Approach:** Two pointers: a write index `j` marks where the next non-zero goes. Scan with `i`; whenever `nums[i]` is non-zero, swap it into `nums[j]` and advance `j`. Everything before `j` stays compacted and ordered, and the zeros bubble to the tail. Time O(n), space O(1) — the kind of tight in-place scan you want on memory-limited device code.

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
      int tmp = nums[j];
      nums[j] = nums[i];
      nums[i] = tmp;
      j++;
    }
  }
}
```

**Key points:**
- Single pass, O(1) extra space; swapping preserves the order of non-zero values.
- The write pointer `j` counts how many non-zeros have been placed so far.

**Follow-ups:**
- Minimize writes when zeros are rare — only swap when `i != j`.
- Move zeros to the front instead — scan from the right.

**Tags:** #algorithm

---

### 75. Longest Palindromic Substring

**Difficulty:** Medium
**Topics:** string, two-pointers, dynamic-programming
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Given a string s, return the longest palindromic substring in s.

**Approach:** Expand around center. A palindrome is symmetric about its center, which is either a single character (odd length) or the gap between two characters (even length) — 2n-1 centers total. For each center, expand outward while both sides match and track the longest span. O(n^2) time, O(1) space. Manacher's algorithm reaches O(n), but expand-around-center is sufficient in interviews and easier to get right.

**Python:**
```python
def longest_palindrome(s: str) -> str:
    if not s:
        return ""

    def expand(left: int, right: int) -> tuple[int, int]:
        while left >= 0 and right < len(s) and s[left] == s[right]:
            left -= 1
            right += 1
        return left + 1, right - 1

    start, end = 0, 0
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

  const expand = (left: number, right: number): [number, number] => {
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      left--;
      right++;
    }
    return [left + 1, right - 1];
  };

  let start = 0, end = 0;
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
static String longestPalindrome(String s) {
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

static int[] expand(String s, int left, int right) {
    while (left >= 0 && right < s.length() && s.charAt(left) == s.charAt(right)) {
        left--;
        right++;
    }
    return new int[]{left + 1, right - 1};
}
```

**Key points:**
- Try both an odd center (i, i) and an even center (i, i+1) at each position.
- Compare lengths with start/end indices rather than slicing to avoid repeated substring copies.
- After expansion stops, step back one on each side to get the valid palindrome bounds.

**Follow-ups:**
- How would you achieve O(n) with Manacher's algorithm?
- How to adapt if asked to return all longest palindromes or count total palindromic substrings?

**Tags:** #algorithm

---

### 76. Sort Colors

**Difficulty:** Medium
**Topics:** array, two-pointers, sorting
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Given an array containing only 0, 1, and 2, sort it in place so that objects of the same color are adjacent in the order red(0), white(1), blue(2). Do not use a library sort; solve it in a single pass.

**Approach:** Dutch national flag with three pointers. low marks the next slot of the settled 0-region, high the slot before the settled 2-region, mid the current scan position. At mid: a 0 swaps with low and both advance; a 1 only advances mid; a 2 swaps with high and high steps back (mid stays, since the swapped-in value is unchecked). O(n) time, O(1) space, one pass.

**Python:**
```python
def sort_colors(nums: list[int]) -> None:
    low, mid, high = 0, 0, len(nums) - 1
    while mid <= high:
        if nums[mid] == 0:
            nums[low], nums[mid] = nums[mid], nums[low]
            low += 1
            mid += 1
        elif nums[mid] == 1:
            mid += 1
        else:
            nums[mid], nums[high] = nums[high], nums[mid]
            high -= 1
```

**TypeScript:**
```typescript
function sortColors(nums: number[]): void {
  let low = 0, mid = 0, high = nums.length - 1;
  while (mid <= high) {
    if (nums[mid] === 0) {
      [nums[low], nums[mid]] = [nums[mid], nums[low]];
      low++;
      mid++;
    } else if (nums[mid] === 1) {
      mid++;
    } else {
      [nums[mid], nums[high]] = [nums[high], nums[mid]];
      high--;
    }
  }
}
```

**Java:**
```java
static void sortColors(int[] nums) {
    int low = 0, mid = 0, high = nums.length - 1;
    while (mid <= high) {
        if (nums[mid] == 0) {
            int t = nums[low]; nums[low] = nums[mid]; nums[mid] = t;
            low++;
            mid++;
        } else if (nums[mid] == 1) {
            mid++;
        } else {
            int t = nums[mid]; nums[mid] = nums[high]; nums[high] = t;
            high--;
        }
    }
}
```

**Key points:**
- Do not advance mid after swapping a 2, since the value pulled from high is unchecked.
- The loop runs while mid <= high; everything past high is already 2.
- Invariant: [0,low) are 0, [low,mid) are 1, (high,end) are 2.

**Follow-ups:**
- How does it generalize to k colors instead of 3? (counting sort)
- If only swaps are allowed and you must minimize the swap count, how do you analyze it?

**Tags:** #algorithm

---

## Other Algorithms

### 77. Single Number

**Difficulty:** Easy
**Topics:** bit-manipulation, xor
**Position:** Embedded Engineer
**Years:** L8-L9

**Question:** Every element appears twice except one. Find the single element in O(n) time and O(1) space.

**Approach:** XOR all elements; pairs cancel to 0 and the unique value remains. Time O(n), space O(1).

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
- XOR is associative/commutative, so duplicates cancel → O(n) time, O(1) space.
- `x ^ x = 0` and `x ^ 0 = x` are the key identities.

**Tags:** #algorithm

---

## System Design

### 78. Design the Mi Home Smart-Home IoT Platform

**Difficulty:** Hard
**Topics:** system-design, iot, mqtt, scale
**Position:** Senior SWE
**Years:** L12+

**Question:** Design the backend for Mi Home connecting hundreds of millions of smart devices (lights, plugs, cameras, sensors) to phones and cloud automations.

**Approach:** Devices hold long-lived connections to an edge gateway tier over MQTT (lightweight, pub/sub, QoS levels) or a custom TCP protocol; gateways are stateless and horizontally scaled behind a connection-aware load balancer (consistent hashing by device ID). A device registry/shadow service stores last-known and desired state (like AWS IoT device shadow) so the app can read/write state even when a device is offline. Commands flow app → cloud → device topic; telemetry flows device → topic → stream (Kafka) → storage + rules engine. The automation/rules engine evaluates triggers ("if motion then turn on light") with low latency, ideally pushed to the local hub for offline operation. Trade-offs: MQTT vs WebSocket (battery, NAT), per-device connection cost at 100M+ scale (keepalive tuning, connection sharding), eventual vs strong consistency on shadow state, and regional data residency (China vs global). Security: per-device certs/keys, TLS, and topic-level ACLs so one compromised device can't subscribe to others.

**Tags:** #system-design

---

### 79. Design an OTA Firmware Update System

**Difficulty:** Hard
**Topics:** system-design, ota, cdn, rollout, cloud, ops
**Position:** Senior SWE
**Years:** L12+

**Question:** Design over-the-air (OTA) firmware updates for tens of millions of Xiaomi IoT devices with limited memory and intermittent connectivity.

**Approach:** Build server: signed firmware artifacts stored in object storage and distributed via CDN; metadata service tracks device model, current version, and target version. Devices poll (or get pushed) an update manifest, download in resumable chunks (range requests; checksum per chunk), and apply with an A/B (dual-bank) partition scheme so a failed flash rolls back to the known-good bank. Critical: staged/canary rollout — release to 1% → monitor crash/brick rate → ramp; with kill-switch to halt. Delta updates (bsdiff) to save bandwidth on constrained devices. Trade-offs: download stampede control (jittered scheduling, CDN offload), verifying signatures on memory-limited MCUs, handling power loss mid-flash (atomic bank switch), and version fragmentation across old hardware. Telemetry on update success/failure feeds the rollout controller.

**Tags:** #system-design

---

### 80. Design the MIUI Push Notification Service

**Difficulty:** Hard
**Topics:** system-design, push, fanout, websocket
**Position:** Senior SWE
**Years:** L12+

**Question:** Design a push-notification system (MIPush) delivering messages to hundreds of millions of Android devices reliably and with low latency.

**Approach:** Devices maintain a persistent connection (long-lived TCP/MQTT) to a connection-gateway tier; a routing service maps device token → which gateway instance currently holds the connection (stored in a fast registry like Redis). Publishers (apps) call an API → message queue → router → gateway → device. For offline devices, store-and-forward with TTL; deliver on reconnect. Dedup with message IDs; at-least-once delivery with client ack. Scale concerns: tens of millions of concurrent sockets means connection sharding, heartbeat/keepalive tuning to balance battery vs liveness detection, and thundering-herd on mass reconnect (jittered backoff). Priority lanes (IM messages vs marketing) and rate limiting per app. Trade-offs: own channel vs FCM (in China FCM is unavailable, so a self-hosted channel is mandatory), exactly-once is expensive — prefer at-least-once + idempotent client.

**Tags:** #system-design

---

### 81. Design the Mi.com Flash-Sale / Seckill System (秒杀/抢购)

**Difficulty:** Hard
**Topics:** system-design, high-concurrency, cache, consistency
**Position:** Senior SWE
**Years:** L12+

**Question:** Design Mi.com's flash sale where a limited stock (e.g., 10,000 phones) is bought by millions of users in seconds without overselling.

**Approach:** The defining problem is extreme read/write spikes on a tiny inventory. Layered defense: (1) CDN + static page caching for the product page; (2) front-end throttling (button disable, captcha, queue token); (3) request admission — only let through roughly enough traffic to cover stock; (4) decrement inventory atomically in Redis (`DECR` with a Lua script to check-and-decrement) so oversell is impossible; (5) asynchronously create the actual order via a message queue (Kafka/RocketMQ) — Redis gates stock, DB writes happen behind the queue to smooth the spike. Idempotent order creation keyed by user+sale to stop double-buy. Anti-bot: rate limits, device fingerprinting, risk scoring. Trade-offs: strong consistency on the Redis counter vs DB durability (reconcile async), graceful degradation ("sold out" fast path), and pre-warming caches before the sale starts. Mention sharding stock across Redis keys if a single key is a hotspot.

**Tags:** #system-design

---

### 82. Design an App Store / Short-Video Recommendation Feed

**Difficulty:** Hard
**Topics:** system-design, recommendation, ranking, feed
**Position:** Senior SWE
**Years:** L12+

**Question:** Design the recommendation feed for the Xiaomi app store (or a short-video surface), serving personalized ranked items at scale.

**Approach:** Two-stage architecture: (1) candidate generation — retrieve a few hundred candidates from a large catalog via collaborative filtering, embedding nearest-neighbor (ANN index), and recent-popularity sources; (2) ranking — a learned model scores candidates using user features, item features, and context (time, device). Serve via a feature store (online for low-latency lookups, offline for training). Feed assembly applies business rules: diversity (don't show 10 of the same category), freshness, and de-dup of already-seen items. Logging closes the loop: impressions/clicks → training data → periodic model retrain. Trade-offs: latency budget (~tens of ms) forces ANN + cached features; cold-start for new users/items (fall back to popularity/content-based); exploration vs exploitation (some random injection to gather signal). Mention online A/B testing for model rollout.

**Tags:** #system-design

---

### 83. Design Device-to-Cloud Telemetry Ingestion

**Difficulty:** Hard
**Topics:** system-design, streaming, time-series, kafka, cloud, big-data
**Position:** Senior SWE
**Years:** L12+

**Question:** Design the pipeline ingesting high-volume telemetry (sensor readings, device health) from millions of Xiaomi IoT devices for monitoring and analytics.

**Approach:** Edge gateways receive device messages and publish to a partitioned log (Kafka) keyed by device ID for ordering per device. A stream processor (Flink/Kafka Streams) does validation, enrichment, and windowed aggregation (e.g., 1-min rollups). Hot path → time-series DB (e.g., for dashboards/alerts); cold path → object storage / data lake for batch analytics and ML training. Back-pressure handling and batching at the edge reduce connection overhead. Trade-offs: per-device ordering (partition by device) vs throughput, exactly-once vs at-least-once (idempotent sinks), downsampling/retention tiers (raw for 7 days, rollups for a year), and schema evolution as new device types ship. Alerting on anomalies feeds back to the rules engine. At 100M devices, mention sampling and edge pre-aggregation to control cost.

**Tags:** #system-design

---

### 84. Design a Distributed Cache

**Difficulty:** Hard
**Topics:** system-design, cache, consistent-hashing, replication
**Position:** Senior SWE
**Years:** L12+

**Question:** Design a distributed in-memory cache (Redis/Memcached-like) used across Xiaomi backend services.

**Approach:** Partition keys across nodes with consistent hashing (virtual nodes for balance and minimal reshuffle on membership change). Replication: each shard has a primary + replicas for read scaling and failover (async replication trades durability for latency). Eviction policy (LRU/LFU) with TTLs. Client-side or proxy-based routing (e.g., a smart client or a proxy like Twemproxy/Redis Cluster). Consistency: cache-aside is most common (app reads cache, on miss loads DB and populates); discuss write-through vs write-back and cache invalidation (the hard problem). Handle hot keys (replicate/lokal cache), thundering herd on expiry (request coalescing / mutex / stale-while-revalidate), and cache penetration (bloom filter or null-caching for missing keys). Trade-offs: strong vs eventual consistency, memory vs hit-rate, and failure modes (a cache outage must not cascade — add circuit breakers and rate limits to the DB).

**Tags:** #system-design

---

### 85. Design a Real-Time Order System

**Difficulty:** Hard
**Topics:** system-design, transactions, idempotency, queue
**Position:** Senior SWE
**Years:** L12+

**Question:** Design the order-processing system for Mi.com handling order creation, payment, inventory, and fulfillment reliably.

**Approach:** Order service writes an order in a "pending" state (idempotency key = user + cart token to prevent duplicate submits). Inventory reservation happens atomically (reserve, not yet deduct). Payment is an external async call; on success, an event drives state transitions (pending → paid → fulfilling → shipped). Use a message queue between stages for decoupling and retries; the order state machine is the source of truth. For cross-service consistency without distributed locks, use the Saga pattern with compensating actions (release inventory if payment fails/times out). Trade-offs: exactly-once is impractical across services — design idempotent handlers + dedup; eventual consistency between order, inventory, and payment with reconciliation jobs; and timeouts (auto-cancel unpaid orders to release reserved stock). Mention outbox pattern to publish events transactionally with the DB write.

**Tags:** #system-design

---

### 86. Design a Smart-Home Automation Rule Engine

**Difficulty:** Hard
**Topics:** system-design, iot, rules-engine, event-driven
**Position:** Backend SWE
**Years:** L12+

**Question:** Design the automation/rules engine behind Mi Home — user rules like "if motion is detected after sunset, turn on the hallway light and start the camera" — running across hundreds of millions of homes.

**Approach:** Model rules as event-condition-action (ECA): a trigger (device event, time, geofence), optional conditions (state predicates, time window), and one or more actions (device commands, notifications). Rules compile to a lightweight representation and are indexed by trigger type/device so an incoming telemetry event fans out only to the rules that subscribe to it (avoid scanning all rules). Split execution: latency-critical, offline-capable rules run on the local hub (LAN, works without cloud); cross-device or cloud-dependent rules run in a cloud stream processor (events → Kafka → evaluator). Handle chained rules and loops with a max-depth/cycle guard, and debounce chatty sensors. Actions are dispatched idempotently with retries; timers/schedules use a durable delay queue. Trade-offs: local vs cloud execution (latency and offline resilience vs richer conditions), rule conflicts (two rules driving the same device — resolve by priority/last-write), consistency of the state used in conditions (device shadow may be stale), and safe evaluation of user-authored logic (sandbox, no unbounded loops). At scale, shard evaluators by home/device and cache hot device state near the evaluator.

**Tags:** #system-design

---

### 87. Design the Xiaomi EV Connected-Car Telematics Platform

**Difficulty:** Hard
**Topics:** system-design, telematics, iot, streaming, safety
**Position:** Backend SWE
**Years:** L12+

**Question:** Design the cloud platform for Xiaomi cars (e.g. SU7): ingest vehicle telemetry, support remote control from the app (lock, climate, find-my-car), and deliver OTA updates — safely and at fleet scale.

**Approach:** Each vehicle holds a secure long-lived connection (MQTT/TLS with per-vehicle certs) to a gateway tier, buffering locally when in tunnels/dead zones and resuming with backpressure. Telemetry (speed, battery/BMS, GPS, DTC fault codes) flows to a partitioned log (Kafka, keyed by VIN for per-vehicle ordering) → stream processing → time-series store (hot: dashboards/alerts) and data lake (cold: analytics, ML for range/charging). Remote commands go app → cloud → vehicle over a low-latency command channel, requiring strong auth, replay protection, and command acknowledgment; safety-critical actions gate on vehicle state (won't unlock while moving). OTA reuses the staged/canary rollout and A/B partitions pattern, but with stricter gating: updates only when parked, sufficient battery, and with signed, verified images. Trade-offs: connectivity gaps (edge buffering, store-and-forward), regional data residency and privacy (location is sensitive PII), exactly-once vs at-least-once for commands (idempotent + ack over exactly-once), and hard safety/security boundaries — a compromised cloud path must never move the car unsafely. Emphasize defense-in-depth, audit logging, and separation between the infotainment domain and the vehicle-control (CAN) domain.

**Tags:** #system-design

---

### 88. Design HyperOS Cross-Device Continuity

**Difficulty:** Hard
**Topics:** system-design, distributed, discovery, handoff
**Position:** Backend SWE
**Years:** L12+

**Question:** Design the cross-device continuity layer of HyperOS: discover nearby Xiaomi devices (phone, tablet, TV, car, watch), share capabilities, and hand off tasks (a call, a video, a document) seamlessly between them.

**Approach:** Two planes. Discovery/connection plane: devices in the same account/home advertise and discover each other over LAN (mDNS/BLE) with a cloud-assisted rendezvous fallback for cross-network cases; establish an authenticated, encrypted P2P channel (device identity bound to the Mi account, pairing via proximity + key exchange). Capability plane: each device publishes a capability manifest (camera, display, speaker, sensors) to a distributed soft-bus; a task can then invoke a remote capability as if local (RPC over the P2P link). Handoff: the source serializes session state (playback position, document + cursor, call session) to a compact continuity token, which the target resumes; media itself streams directly device-to-device to avoid a cloud round-trip. Prefer local transport for latency/privacy, fall back to cloud relay when devices aren't co-located. Trade-offs: LAN P2P latency vs cloud reliability, security of an ambient device mesh (mutual auth, per-session keys, revocation when a device leaves the account), state-transfer consistency (idempotent resume, last-writer-wins on shared state), discovery noise/battery on always-listening devices, and graceful degradation when the target lacks a capability. Emphasize a trust model rooted in the Mi account and a soft-bus abstraction so apps target logical capabilities, not specific hardware.

**Tags:** #system-design

---

## Behavioral

### 89. Why Xiaomi? (为发烧而生)

**Difficulty:** Easy
**Topics:** behavioral, motivation, fit
**Position:** Backend SWE
**Years:** L8-L9

**Question:** Why do you want to join Xiaomi specifically, and which product/team excites you?

**Approach:** Show genuine alignment with Xiaomi's identity: "为发烧而生" (born for fans/enthusiasts) and the AIoT + smartphone + ecosystem strategy. Be specific — name a product (HyperOS, Mi Home ecosystem, a Xiaomi phone or wearable you actually use) and a technical area Xiaomi is strong in (AIoT at massive scale, MIUI/Android depth, high-concurrency e-commerce). Tie it to your skills: e.g., "I've built embedded firmware and want to work on devices that ship to millions." Avoid generic "big company / good comp" answers — Xiaomi values engineers who are users and enthusiasts of the products.

**Tags:** #behavioral

---

### 90. Cost-Efficiency Mindset (感动人心、价格厚道)

**Difficulty:** Medium
**Topics:** behavioral, cost, tradeoffs, ownership
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Tell me about a time you delivered strong results under tight resource or cost constraints.

**Approach:** Xiaomi's core philosophy is "感动人心、价格厚道" (amazing products at honest prices) and high 性价比 (cost-performance). They probe whether you optimize for value, not gold-plating. Use STAR: pick a story where you hit a constraint (limited compute budget, small team, cheap hardware target) and made a pragmatic trade-off that preserved the user experience while cutting cost — e.g., reduced server cost by X% via caching/batching, or shipped on cheaper hardware by optimizing the hot path. Quantify the savings and show you understood the trade-off you accepted (and what you'd revisit if budget grew). Avoid stories where you over-engineered a Cadillac solution.

**Tags:** #behavioral

---

### 91. Fast-Paced Release Cadence

**Difficulty:** Medium
**Topics:** behavioral, execution, shipping
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Describe a time you had to ship something quickly under a hardware launch or fixed deadline. How did you balance speed and quality?

**Approach:** Xiaomi ships hardware + software on tight, immovable launch dates, so they value engineers who execute fast without breaking things. Use STAR: a real deadline (a launch, a flash sale), what you cut vs protected (cut nice-to-haves, protected correctness and a rollback path), how you de-risked (feature flags, canary, monitoring), and the outcome. Show judgment: you didn't just go fast — you made the risk explicit, got buy-in, and had a backout plan. The signal is pragmatic prioritization plus a safety net, not heroics.

**Tags:** #behavioral

---

### 92. Conflict / Disagreement with a Teammate

**Difficulty:** Medium
**Topics:** behavioral, conflict, collaboration
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Tell me about a time you strongly disagreed with a teammate or manager on a technical decision. How did you handle it?

**Approach:** Use STAR. Show you (1) separated ego from the decision and sought to understand their reasoning, (2) brought data or a small prototype rather than just opinions, (3) found common ground on shared goals (user experience, cost, deadline), and (4) committed fully once a decision was made — even if it wasn't your choice ("disagree and commit"). End with the outcome and what you learned about the other person's perspective. Avoid stories where you "won" by escalating or where you were quietly resentful afterward.

**Tags:** #behavioral

---

### 93. Getting Hands Dirty (Engineer Culture)

**Difficulty:** Medium
**Topics:** behavioral, ownership, engineer-culture, debugging
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Tell me about the hardest technical problem you personally dug into end-to-end. How deep did you go, and what did it take to solve it?

**Approach:** Xiaomi prizes a hands-on engineer culture — people who go deep rather than delegate the hard parts. Use STAR. Situation: a gnarly, high-stakes problem (an intermittent crash, a data-corruption bug, a perf cliff under load, a device-firmware issue). Task: your ownership of it. Action: show the depth — you reproduced it, read logs/traces, bisected, dropped down a layer (into the kernel, the JVM, the network capture, the CAN bus, whatever) instead of guessing; you formed hypotheses and tested them methodically. Result: root cause, the fix, and what you added to prevent recurrence (a test, a metric, a runbook). The signal is intellectual honesty and persistence — you didn't stop at the symptom or hand it off. Avoid vague 'we eventually fixed it' stories; name the tools, the layer, and the exact root cause.

**Tags:** #behavioral

---

### 94. Listening to Users (Fan-Driven Product)

**Difficulty:** Medium
**Topics:** behavioral, user-focus, product-sense, iteration
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Tell me about a time user or community feedback changed what you built. How did you decide what to act on?

**Approach:** Xiaomi was built on 'sense of participation' — MIUI grew from a fan community weekly-iterating on user feedback. Interviewers want to see you treat users as partners, not an afterthought. Use STAR. Situation: real feedback (bug reports, forum/community threads, app-store reviews, telemetry showing drop-off). Task: turn noisy signals into a decision. Action: show how you triaged — separated vocal-minority requests from broad patterns, cross-checked qualitative complaints against quantitative data, prioritized by impact and effort, and shipped a change fast (Xiaomi's tight iteration loop), then measured whether it actually helped. Result: the outcome (fewer complaints, higher retention/engagement) and the follow-up loop you set up. The signal is empathy plus judgment — you don't build every request, you find the underlying need and validate the fix. Avoid stories where you either ignored users or blindly built whatever was loudest.

**Tags:** #behavioral

---

## Domain Knowledge

### 95. Android Framework: Activity Lifecycle, Binder IPC, Handler/Looper

**Difficulty:** Hard
**Topics:** domain-knowledge, android, ipc, concurrency
**Position:** Android Engineer
**Years:** L10-L11

**Question:** Explain the Android Activity lifecycle, how Binder IPC works, and the role of Handler/Looper/MessageQueue. Why can't you update the UI from a background thread?

**Approach:** **Lifecycle**: `onCreate → onStart → onResume` (foreground) → `onPause → onStop → onDestroy`; `onPause`/`onStop` are where you release resources; configuration changes (rotation) destroy and recreate the activity unless handled — explain saving state in `onSaveInstanceState`. **Binder**: Android's primary IPC; a kernel driver enables one-copy cross-process calls, with proxy/stub generated from AIDL. System services (ActivityManager, etc.) are reached via Binder; mention the per-process binder thread pool and that synchronous Binder calls block. **Handler/Looper**: each thread can have one Looper that loops a MessageQueue; the main (UI) thread has a Looper set up at app start. A Handler posts Messages/Runnables to a thread's queue. **UI thread rule**: the Android UI toolkit is not thread-safe and the framework checks the calling thread, so UI updates must be posted back to the main thread (via Handler, `runOnUiThread`, or coroutines/`LiveData`). Background work (network, disk) must be off the main thread to avoid ANRs (~5s).

**Tags:** #domain-knowledge

---

### 96. JVM Memory Model & Garbage Collection

**Difficulty:** Hard
**Topics:** domain-knowledge, jvm, gc, memory
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Describe the JVM memory regions, the generational GC model, and how you'd diagnose a memory leak or long GC pauses.

**Approach:** **Regions**: heap (young = Eden + 2 survivor spaces, old gen), plus metaspace (class metadata, off-heap since Java 8), the per-thread stacks, and the PC register. **Generational GC**: most objects die young → minor GC collects the young gen cheaply (copying survivors); objects surviving enough collections are promoted to old gen, collected by major/full GC. Mention collectors: Parallel (throughput), CMS (deprecated), G1 (region-based, balances pause vs throughput), ZGC/Shenandoah (low-pause, concurrent). **Diagnosis**: a leak shows as old gen growing across full GCs until OOM — capture a heap dump (`jmap`/`-XX:+HeapDumpOnOutOfMemoryError`) and analyze dominator tree in MAT to find retained references (e.g., a static collection, unclosed listener, ThreadLocal). For long pauses, read GC logs (`-Xlog:gc`), check allocation rate and promotion, tune heap size / switch to G1/ZGC. On Android, ART differs (ahead-of-time + JIT, different GC) — note the distinction if the role is client-side.

**Tags:** #domain-knowledge

---

### 97. Embedded C / RTOS Basics

**Difficulty:** Hard
**Topics:** domain-knowledge, embedded, rtos, c
**Position:** Embedded Engineer
**Years:** L10-L11

**Question:** For a Xiaomi IoT device on a microcontroller, explain the difference between a bare-metal super-loop and an RTOS, what `volatile` means, and how you'd handle data shared between an ISR and the main loop.

**Approach:** **Super-loop vs RTOS**: bare-metal runs a single `while(1)` polling/handling work; simple but hard to meet timing as features grow. An RTOS (FreeRTOS, etc.) provides tasks with priorities, a scheduler (preemptive, priority-based), and primitives (semaphores, queues, mutexes) so time-critical work preempts background work. Mention stack-per-task and limited RAM constraints. **`volatile`**: tells the compiler a variable may change outside normal program flow (hardware register, ISR-modified flag), so it must not cache it in a register or optimize away reads — required for correctness but does NOT provide atomicity. **ISR ↔ main sharing**: keep ISRs short; use a `volatile` flag or, better, a lock-free ring buffer / RTOS queue to pass data out of the ISR. For multi-byte shared data, disable interrupts briefly or use atomic access to avoid tearing. Discuss priority inversion (use priority inheritance mutexes) and avoiding blocking calls in ISRs. Power: sleep modes between events to save battery (key for IoT).

**Tags:** #domain-knowledge

---

### 98. Computer Networking: HTTP & TCP

**Difficulty:** Medium
**Topics:** domain-knowledge, networking, tcp, http
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Walk through what happens (network-wise) when a Xiaomi app requests `https://api.mi.com/...`, covering DNS, the TCP handshake, TLS, and the difference between HTTP/1.1, HTTP/2, and HTTP/3.

**Approach:** **DNS**: resolve `api.mi.com` to an IP (recursive resolver, caching, possibly GeoDNS to the nearest region). **TCP handshake**: SYN → SYN-ACK → ACK establishes the connection; explain the three-way handshake and that TCP provides reliable, ordered, congestion-controlled delivery (sequence numbers, ACKs, retransmission, sliding window). **TLS**: handshake negotiates cipher and keys (TLS 1.3 does it in 1-RTT, with 0-RTT resumption) so the HTTP payload is encrypted. **HTTP versions**: HTTP/1.1 = one request at a time per connection (head-of-line blocking, mitigated by multiple connections + keep-alive); HTTP/2 = multiplexed streams over one TCP connection + header compression (HPACK), but still suffers TCP-level head-of-line blocking on packet loss; HTTP/3 = runs over QUIC (UDP-based) with per-stream delivery so loss on one stream doesn't block others, plus faster connection setup — valuable on lossy mobile networks. Tie back: for mobile IoT/app traffic, HTTP/3 / QUIC and connection reuse matter for latency and battery.

**Tags:** #domain-knowledge

---

### 99. Linux Systems Programming: Processes, I/O Multiplexing, Signals

**Difficulty:** Hard
**Topics:** domain-knowledge, linux, systems, concurrency
**Position:** Backend SWE
**Years:** L10-L11

**Question:** Explain how `fork`/`exec` create processes, the difference between processes and threads, how `epoll` lets one thread serve many connections, and how signals work. Why is `epoll` preferred over `select` for a high-connection Xiaomi backend?

**Approach:** **Processes vs threads:** `fork` clones the calling process (copy-on-write address space, separate memory); `exec*` replaces the image to run a new program — the classic shell/server pattern is fork-then-exec, with `wait`/`waitpid` reaping children to avoid zombies. Threads share one address space (cheaper context switch, shared memory needs synchronization); processes give isolation at higher cost. **I/O multiplexing:** a single thread can watch many file descriptors for readiness. `select`/`poll` are O(n) per call — they rescan the whole fd set each time; `epoll` is O(1) amortized via a kernel-maintained interest list and a ready list, so it scales to tens of thousands of connections (essential for push/IoT gateways). Mention edge- vs level-triggered (`EPOLLET` requires draining until `EAGAIN`) and pairing epoll with non-blocking sockets — the reactor pattern behind Netty/nginx. **Signals:** asynchronous notifications (`SIGTERM`, `SIGINT`, `SIGCHLD`, `SIGPIPE`); handlers must be async-signal-safe (only call safe functions), so a common pattern is the self-pipe / `signalfd` trick to fold signals into the event loop. Note graceful shutdown on `SIGTERM` and ignoring/handling `SIGPIPE` on broken sockets.

**Tags:** #domain-knowledge

---

### 100. C Memory Management and Undefined Behavior

**Difficulty:** Hard
**Topics:** domain-knowledge, c, memory, embedded
**Position:** Embedded Engineer
**Years:** L10-L11

**Question:** In C on a Xiaomi device, explain stack vs heap allocation, what goes wrong with `malloc`/`free` (leaks, double-free, use-after-free), and give examples of undefined behavior. How do you catch these bugs?

**Approach:** **Stack vs heap:** locals live on the stack — automatic lifetime, fast, but limited size (returning a pointer to a local is a classic use-after-return bug); the heap (`malloc`/`free`) has manual lifetime for dynamic/long-lived data — you own every allocation. **Common failures:** memory leak (lost the last pointer without freeing — deadly on long-running, RAM-tiny IoT firmware), double-free and use-after-free (freeing then dereferencing — corrupts the allocator, exploitable), dangling pointers (set to NULL after free), buffer overflow (writing past an array — corrupts adjacent memory/return address). **Undefined behavior:** out-of-bounds access, signed integer overflow, reading uninitialized memory, dereferencing NULL, data races, breaking strict aliasing — the compiler may assume UB never happens and optimize aggressively, so bugs appear only at high `-O` or on one toolchain. **Catching them:** compile with `-Wall -Wextra`, run AddressSanitizer/UBSan and Valgrind in test, use static analysis (clang-tidy, cppcheck, Coverity), and disciplined ownership conventions (one owner per allocation, free on every path, NULL after free). On constrained MCUs without an MMU, memory bugs silently corrupt rather than segfault, so guard with static analysis, bounds checks, and sometimes a memory-protection unit (MPU) / stack canaries.

**Tags:** #domain-knowledge

---

## Tips specific to Xiaomi

- **Know your role's domain cold.** Android client → framework internals (lifecycle, Binder, Handler/Looper, ART). Device/firmware → embedded C, RTOS, power. Backend → high-concurrency (flash sale), caching, IoT telemetry.
- **Practice the flash-sale design.** 秒杀/抢购 is a signature Xiaomi system-design question — be ready to discuss Redis atomic stock decrement, queue-backed order creation, and anti-oversell.
- **Show cost-performance (性价比) thinking.** Pragmatic, value-driven trade-offs land better than gold-plated solutions.
- **Be a real user.** Familiarity with HyperOS/MIUI and the Mi ecosystem signals culture fit ("为发烧而生").
- **Algorithm bar is solid medium.** Drill arrays, strings, trees, graphs, DP, and sliding window — not contest-hard problems.
