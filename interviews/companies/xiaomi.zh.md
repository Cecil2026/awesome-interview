# 小米（Xiaomi）

```yaml
company: 小米（Xiaomi）—— MIUI/HyperOS、米家 IoT、小米商城电商、智能手机、AIoT
typical_rounds: 2-3 轮技术面 + 1 轮 HR（算法 + 视岗位而定的 Android/嵌入式领域深挖）
focus_areas: 算法、Android 框架内部原理、嵌入式 C/IoT、高并发后端（秒杀）、系统设计
languages_allowed: Java/Kotlin（Android）、C/C++（嵌入式/IoT）、Python；算法轮可用任意主流语言
duration: 每轮 45-60 分钟
notable_quirks:
  - 客户端岗位深挖 Android 框架内部（Activity 生命周期、Binder IPC、Handler/Looper）
  - 设备/固件岗位深挖嵌入式 C 与 RTOS 基础
  - 后端岗位常考秒杀/抢购等高并发系统设计
  - 行为面试考查成本与效率的产品思维（性价比）
  - 软硬件快速发布节奏——看重务实、快速交付的工程师
  - "为发烧而生" 与 "感动人心、价格厚道" 的文化常被提及
sources: LeetCode Discuss（xiaomi 标签）、牛客网、一亩三分地、Glassdoor
```

## 概述

小米的面试在标准算法门槛之上，叠加了针对岗位的领域深挖：客户端面试深挖 Android 框架内部（生命周期、Binder、Handler/Looper、JVM/ART），设备岗位深挖嵌入式 C 与 RTOS，后端岗位深挖以小米商城秒杀/抢购和连接数亿设备的米家 AIoT 平台为核心的高并发设计。候选人常惊讶于这套流程更看重务实、低成本、快速交付的工程能力（"性价比" 思维），而非纯理论深度。客户端要多准备 Android 内部原理，设备岗要多准备嵌入式/RTOS，后端要多准备秒杀 + IoT 遥测系统设计；冷门算法可以少准备——算法门槛是扎实的 LeetCode 中等，而非竞赛级难题。

## 链表

### 1. 合并两个有序链表（Merge Two Sorted Lists）

**难度：** 简单
**主题：** linked-list, two-pointer
**岗位：** Backend SWE
**级别：** L8-L9

**问题：** 将两个有序链表通过拼接节点合并为一个有序链表。

**思路：** 哑头，遍历两链表每步取较小节点，最后接上剩余尾部。时间 O(n + m)，空间 O(1)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 哑头免除首节点特判；O(n + m) 时间、O(1) 额外空间。
- 末尾一步接上非空剩余部分。

**常见追问：**
- 合并 k 个有序链表——最小堆或分治。
- 降序合并——翻转比较方向。
- 双向链表——还需修正 `prev` 指针。

**标签：** #algorithm

---

### 2. 反转链表（Reverse Linked List）

**难度：** 简单
**主题：** linked-list
**岗位：** Embedded Engineer
**级别：** L8-L9

**问题：** 反转一个单链表并返回新头节点。

**思路：** 迭代翻转每个 `next` 指针，用 `prev` 记录最终成为新头。时间 O(n)，空间 O(1)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 迭代反转 O(n) 时间、O(1) 空间。
- 覆盖指针前先保存 `next`，以免丢失余下部分。

**标签：** #algorithm

---

### 3. 环形链表（Linked List Cycle）

**难度：** 简单
**主题：** linked-list, two-pointer, floyd
**岗位：** Backend SWE
**级别：** L8-L9

**问题：** 判断单链表是否含环。

**思路：** Floyd 龟兔——慢指针走一步、快指针走两步；当且仅当有环时相遇。时间 O(n)，空间 O(1)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- Floyd 双指针判环，O(n) 时间、O(1) 空间。
- `fast`/`fast.next` 为空说明链表终止（无环）。

**标签：** #algorithm

---

### 4. 删除链表的倒数第 N 个节点（Remove Nth Node From End of List）

**难度：** 中等
**主题：** linked-list, two-pointer
**岗位：** Backend SWE
**级别：** L8-L9

**问题：** 删除单链表倒数第 n 个节点并返回头节点。

**思路：** 从哑头出发用双指针；`fast` 先走 n+1 步，再同步移动直到 `fast` 为空。`slow` 恰好停在目标前一个。单次遍历，O(n) 时间、O(1) 空间。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 固定 n+1 间隔的单次遍历，O(n) 时间、O(1) 空间。
- 哑头干净地处理删除真正首节点的情形。

**标签：** #algorithm

---

### 5. 合并 K 个升序链表（Merge k Sorted Lists）

**难度：** 困难
**主题：** linked-list, heap, divide-and-conquer
**岗位：** Senior SWE
**级别：** L10-L11

**问题：** 把 `k` 个有序链表合并为一个有序链表。

**思路：** 把每个链表的头按值入最小堆；反复弹出最小者并压入其后继。总节点数为 N 时，时间 O(N log k)，空间 O(k)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 大小为 k 的堆带来 O(N log k) 时间、O(k) 空间。
- 分治两两合并也能达到同样的 O(N log k)。

**标签：** #algorithm

---

### 6. 两数相加（Add Two Numbers）

**难度：** 中等
**主题：** linked-list, math
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 两个非空链表逆序存储两个非负整数的各位数字，将它们相加并以链表返回结果。

**思路：** 同时遍历两个链表，将对应位与进位相加生成新节点；只要任一链表还有节点或存在进位就继续。用哑结点简化尾插。时间 O(max(m, n))，空间 O(max(m, n))。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 逆序存储使得从最低位开始处理，无需预先反转链表。
- 循环条件必须包含 `carry`，以便输出最高位进位（如 5 + 5 = 10）。
- 哑结点避免对首节点做特殊处理。

**常见追问：**
- 若数字按正序（最高位在前）存储怎么办？反转两个链表或用两个栈。
- 能否不新建节点完成相加？在较长的链表上原地复用。

**标签：** #algorithm

---

### 7. 复制带随机指针的链表（Copy List with Random Pointer）

**难度：** 中等
**主题：** linked-list, hash-table
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 链表每个节点有一个 `next` 指针和一个可指向任意节点或 null 的 `random` 指针，返回该链表的深拷贝。

**思路：** 将每个拷贝节点交织插入原节点之后（A -> A' -> B -> B' ...），再由 `orig.random.next` 设置拷贝的 `random`，最后拆分两条链表。这样除拷贝本身外仅需 O(1) 额外空间，时间 O(n)。更简单的做法是用哈希表建立原节点到拷贝节点的映射。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 哈希表法建立「原节点 -> 拷贝节点」映射，第二趟连接 `next` 与 `random`；时间 O(n)，空间 O(n)。
- 交织插入技巧将拷贝嵌入原链表，实现 O(1) 额外空间。
- 解引用前务必判空 `random` 与 `next`。

**常见追问：**
- 如何将空间降到 O(1)？采用交织插入并最终拆分的方法。
- 若要深拷贝任意图而非链表怎么办？用 BFS/DFS 配合已访问映射。

**标签：** #algorithm

---

### 8. 重排链表（Reorder List）

**难度：** 中等
**主题：** linked-list, two-pointers
**岗位：** Android Engineer
**级别：** L10-L11

**问题：** 给定单链表 L0 -> L1 -> ... -> Ln-1 -> Ln，原地将其重排为 L0 -> Ln -> L1 -> Ln-1 -> L2 -> Ln-2 -> ...，不改变节点的值。

**思路：** 三个经典步骤：(1) 用快慢指针找中点，(2) 反转后半部分，(3) 交替合并两半。全程原地完成。时间 O(n)，空间 O(1)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 快慢指针使 `slow` 停在前半部分末尾，`slow.next` 即为待反转的后半部分起点。
- 反转前先在中点处断链（`slow.next = null`），避免形成环。
- 合并在较短（或等长）的反转半部分耗尽时自然结束。

**常见追问：**
- 奇偶长度下如何准确定位并保留中点？`fast.next && fast.next.next` 条件对两种情况都成立。
- 能否用 O(n) 空间实现？将节点存入数组，从两端索引交替取用。

**标签：** #algorithm

---

## 树

### 9. 翻转二叉树（Invert Binary Tree）

**难度：** 简单
**主题：** tree, recursion, dfs
**岗位：** Android Engineer
**级别：** L8-L9

**问题：** 翻转二叉树（交换每个节点的左右孩子）。

**思路：** 递归，在每个节点交换孩子。时间 O(n)，空间 O(h)（递归栈）。

**Python：**
```python
class TreeNode:
    def __init__(self, val: int = 0, left=None, right=None) -> None:
        self.val, self.left, self.right = val, left, right

def invert_tree(root: TreeNode | None) -> TreeNode | None:
    if root:
        root.left, root.right = invert_tree(root.right), invert_tree(root.left)
    return root
```

**TypeScript：**
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

**Java：**
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

**要点：**
- 每个节点访问一次 → O(n) 时间。
- 递归深度为 O(h)，即树高。

**标签：** #algorithm

---

### 10. 二叉树的最大深度（Maximum Depth of Binary Tree）

**难度：** 简单
**主题：** tree, recursion, dfs
**岗位：** Android Engineer
**级别：** L8-L9

**问题：** 返回二叉树的最大深度（最长根到叶路径上的节点数）。

**思路：** 深度 = 1 + max(左深度, 右深度)；空树为 0。时间 O(n)，空间 O(h)。

**Python：**
```python
class TreeNode:
    def __init__(self, val: int = 0, left=None, right=None) -> None:
        self.val, self.left, self.right = val, left, right

def max_depth(root: TreeNode | None) -> int:
    if not root:
        return 0
    return 1 + max(max_depth(root.left), max_depth(root.right))
```

**TypeScript：**
```typescript
function maxDepth(root: TreeNode | null): number {
  if (!root) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```

**Java：**
```java
int maxDepth(TreeNode root) {
  if (root == null) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```

**要点：**
- O(n) 时间、递归 O(h) 空间。
- 空节点处的平凡基例让递推式简洁。

**标签：** #algorithm

---

### 11. 二叉树的层序遍历（Binary Tree Level Order Traversal）

**难度：** 中等
**主题：** tree, bfs, queue
**岗位：** Android Engineer
**级别：** L8-L9

**问题：** 按层（自顶向下、从左到右）返回节点值，结果为列表的列表。

**思路：** 用队列做 BFS；每轮外层迭代通过快照队列大小来处理一整层。时间 O(n)，空间 O(n)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- BFS 每个节点访问一次 → O(n) 时间、O(n) 队列空间。
- 内层循环前先快照层大小，以区分各层。

**标签：** #algorithm

---

### 12. 验证二叉搜索树（Validate Binary Search Tree）

**难度：** 中等
**主题：** tree, dfs, bst
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 判断二叉树是否为合法 BST（左子树严格小、右子树严格大，递归成立）。

**思路：** DFS 携带开区间 `(low, high)`；每个节点须严格落于其中，孩子据此收窄区间。时间 O(n)，空间 O(h)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 传区间的 DFS，O(n) 时间、O(h) 空间。
- 用严格边界与足够宽的初始区间处理极端值。

**标签：** #algorithm

---

### 13. 二叉树的最近公共祖先（Lowest Common Ancestor of a Binary Tree）

**难度：** 中等
**主题：** tree, dfs, recursion
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 给定二叉树和两个节点 `p`、`q`，返回它们的最近公共祖先。

**思路：** DFS：若节点等于 p/q 或在子树中找到则返回该节点。第一个左右都返回非空的节点即为 LCA。时间 O(n)，空间 O(h)。

**Python：**
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

**TypeScript：**
```typescript
function lowestCommonAncestor(root: TreeNode | null, p: TreeNode, q: TreeNode): TreeNode | null {
  if (root === null || root === p || root === q) return root;
  const left = lowestCommonAncestor(root.left, p, q);
  const right = lowestCommonAncestor(root.right, p, q);
  if (left && right) return root;
  return left ?? right;
}
```

**Java：**
```java
TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
  if (root == null || root == p || root == q) return root;
  TreeNode left = lowestCommonAncestor(root.left, p, q);
  TreeNode right = lowestCommonAncestor(root.right, p, q);
  if (left != null && right != null) return root;
  return left != null ? left : right;
}
```

**要点：**
- 单次 DFS → O(n) 时间、O(h) 递归空间。
- 左右都非空说明 p 与 q 在此分叉 → 该节点即 LCA。

**标签：** #algorithm

---

### 14. 二叉树的序列化与反序列化（Serialize and Deserialize Binary Tree）

**难度：** 困难
**主题：** tree, dfs, design
**岗位：** Senior SWE
**级别：** L10-L11

**问题：** 设计二叉树的 `serialize` 与 `deserialize`，使结构能被精确重建。

**思路：** 前序 DFS，对空节点写 `#`；反序列化按同样的流递归消费。两个方向均为 O(n) 时间、O(n) 空间。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 带空标记的前序两个方向均为 O(n) 时间、O(n) 空间。
- 以相同前序消费流可无歧义地重建结构。

**标签：** #algorithm

---

### 15. 实现前缀树（Implement Trie）

**难度：** 中等
**主题：** trie, design, string
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 实现支持 `insert(word)`、`search(word)`、`startsWith(prefix)` 的前缀树。

**思路：** 每个节点含子链接与词尾标记；按字符遍历/创建。每个操作为 O(L)（词长 L）；空间 O(已插入字符总数)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 每个操作为键长 O(L)，与字典规模无关。
- 最坏空间为 O(已插入单词长度之和)。

**标签：** #algorithm

---

### 16. 二叉树的直径（Diameter of Binary Tree）

**难度：** 简单
**主题：** tree, dfs, recursion
**岗位：** Android Engineer
**级别：** L8-L9

**问题：** 返回二叉树中任意两节点之间最长路径的长度（以边数计）。该路径不一定经过根节点。

**思路：** 对每个节点，经过它的最长路径长度等于 height(左) + height(右)。用一次自底向上的 DFS 计算高度，并维护该和的全局最大值。时间 O(n)，空间 O(h)（递归栈）。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 直径是两棵子树高度之和，因此返回高度的 DFS 一趟即可求解。
- 计的是边数（l + r）而非节点数；答案不一定以根为中点。

**常见追问：**
- 若边带权重会如何？改为跟踪加权高度，取经过每个节点的最大加权路径。
- 如何返回具体路径而不仅是长度？

**标签：** #algorithm

---

### 17. 平衡二叉树（Balanced Binary Tree）

**难度：** 简单
**主题：** tree, dfs, recursion
**岗位：** Android Engineer
**级别：** L8-L9

**问题：** 判断一棵二叉树是否高度平衡，即每个节点的左右子树高度差不超过 1。

**思路：** 朴素做法在每个节点重复计算高度，为 O(n^2)。改用一次后序 DFS，返回平衡子树的高度，或在检测到不平衡时返回哨兵值 -1 并向上短路。时间 O(n)，空间 O(h)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 用 -1 编码「不平衡」，使一次后序遍历既测高度又验平衡。
- 遇到 -1 立即短路，避免重复计算，保持 O(n)。

**常见追问：**
- 它与 map 实现中用到的自平衡树（AVL、红黑树）有何关联？
- 能否改成迭代实现，避免在极度倾斜树上栈溢出？

**标签：** #algorithm

---

### 18. 二叉树的右视图（Binary Tree Right Side View）

**难度：** 中等
**主题：** tree, bfs, dfs
**岗位：** Android Engineer
**级别：** L10-L11

**问题：** 想象站在二叉树的右侧，返回从上到下所能看到的节点值。

**思路：** 每层最右侧的节点可见。用 BFS 取每层最后一个节点；或用先右后左的 DFS，记录每个新深度首次到达的节点。两者均为 O(n) 时间，空间 O(n)/O(h)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 每层可见的节点即 BFS 中最后出队的那个。
- 以深度为键、先右后左的 DFS 是等价的 O(h) 空间替代方案。

**常见追问：**
- 如何改为求左视图？
- 若还需统计每个可见节点后面被遮挡的节点数量该怎么做？

**标签：** #algorithm

---

### 19. 二叉树中的最大路径和（Binary Tree Maximum Path Sum）

**难度：** 困难
**主题：** tree, dfs, recursion
**岗位：** Backend SWE
**级别：** L12+

**问题：** 路径是由父子边连接的节点序列，每个节点至多出现一次，且不必经过根节点。返回任意此类路径上节点值之和的最大值。

**思路：** 后序 DFS。对每个节点计算它能向上贡献的最佳向下增益：node.val + max(0, gain(左), gain(右))——负分支截断为 0。另外，在该节点「转弯」的最佳路径为 node.val + max(0, 左) + max(0, 右)，用它更新全局最大值。时间 O(n)，空间 O(h)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 区分向上返回的值（直路径，至多含一个子节点）与用于更新答案的值（在节点转弯，含两个子节点）。
- 将负的子树增益截断为 0，从而舍弃有害分支。
- 全局最大值初始化为负无穷，以处理全为负数的树。

**常见追问：**
- 如何重建最大路径上的具体节点？
- 若只允许根到叶的路径又该怎么做？

**标签：** #algorithm

---

## 图

### 20. 岛屿数量（Number of Islands）

**难度：** 中等
**主题：** graph, dfs, bfs, matrix
**岗位：** Backend SWE
**级别：** L8-L9

**问题：** 在由 `'1'`/`'0'` 构成的二维网格中，按 4 方向相邻统计 `'1'`（陆地）的连通块数量。

**思路：** 扫描网格；遇到未访问陆地就泛洪（DFS/BFS）淹没整座岛并计数加一。时间 O(行*列)，最坏空间 O(行*列)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 每个格子访问一次 → O(行*列) 时间。
- 递归/队列深度最坏为 O(行*列)（一整座大岛）。

**标签：** #algorithm

---

### 21. 克隆图（Clone Graph）

**难度：** 中等
**主题：** graph, dfs, bfs, hash-table
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 给定连通无向图的一个节点引用，深拷贝整张图；每个节点含值和邻居列表。

**思路：** DFS/BFS 配合 原节点 → 克隆 的映射，避免重复克隆并处理环。时间 O(V + E)，空间 O(V)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 每个节点与每条边各访问一次 → O(V + E) 时间。
- 已访问映射（O(V) 空间）防止在环上无限循环。

**标签：** #algorithm

---

### 22. 课程表（Course Schedule）

**难度：** 中等
**主题：** graph, topological-sort, bfs
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 给定 `numCourses` 和先修对 `[a, b]`（b 先于 a），判断能否修完所有课程（即图无环）。

**思路：** Kahn 算法——建入度，把入度为零的节点入队，反复移除。若全部移除则无环。时间 O(V + E)，空间 O(V + E)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- Kahn 拓扑排序，O(V + E) 时间与空间。
- 存在环时仍有节点入度大于零，故 `seen < numCourses`。

**标签：** #algorithm

---

### 23. 无向图中连通分量的数目（Number of Connected Components in an Undirected Graph）

**难度：** 中等
**主题：** union-find, graph, dsu
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 给定标号 `0..n-1` 的 `n` 个节点和边列表，返回连通分量数。

**思路：** 并查集，带路径压缩与按秩合并；初始为 `n` 个分量，每次成功合并减一。近线性时间 O((n + e) α(n))，空间 O(n)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 路径压缩使查找近似 O(α(n)) → 整体 O((n + e) α(n)) 时间。
- 分量从 n 开始，每合并两个不同根减一。

**标签：** #algorithm

---

### 24. MIUI 应用启动排序（拓扑排序）

**难度：** 中等
**主题：** graph, topological-sort, bfs
**岗位：** Android Engineer
**级别：** L10-L11

**问题：** MIUI/HyperOS 开机时，系统服务有启动依赖（`[a, b]` 表示 b 须先于 a 启动）。返回任一合法启动顺序，若存在依赖环导致无法启动则返回空列表。

**思路：** Kahn 拓扑排序——算入度，把入度为零的服务入队，输出时递减后继入度。若输出数小于 n，则存在环。时间 O(V + E)，空间 O(V + E)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- Kahn 算法 O(V + E) 时间与空间。
- 依赖环会使队列无法清空 → 输出少于 n。

**标签：** #algorithm

---

### 25. 腐烂的橘子（Rotting Oranges）

**难度：** 中等
**主题：** graph, bfs, matrix
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 网格中 `0` 为空、`1` 为新鲜橘子、`2` 为腐烂橘子；每分钟每个与腐烂橘子 4 方向相邻的新鲜橘子会腐烂。求所有橘子腐烂所需分钟数，若无法全部腐烂返回 `-1`。

**思路：** 以所有初始腐烂格子为源做多源 BFS，每层代表一分钟逐层扩散；统计剩余新鲜橘子以判断不可达情形。这与设备状态或固件标志在节点网状拓扑中逐层传播的过程一致。时间 O(行*列)，空间 O(行*列)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 把所有腐烂格子一次性入队，让全部源同步扩散；一层即一分钟。
- 用新鲜计数代替反复扫描网格，判断 `-1`（孤立的新鲜橘子）时 O(1)。

**常见追问：**
- 若橘子也能沿对角线腐烂，或某些格子完全阻断扩散，解法如何变化？
- 如何报告最后腐烂的那个橘子及其坐标？

**标签：** #algorithm

---

### 26. 网络延迟时间（Network Delay Time）

**难度：** 中等
**主题：** graph, dijkstra, shortest-path, heap
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 给定 `times[i] = [u, v, w]`（信号从节点 `u` 到 `v` 耗时 `w`）、标号 `1..n` 的 `n` 个节点及源点 `k`，求所有节点收到信号所需的最短时间；若存在不可达节点返回 `-1`。

**思路：** 单源最短路 Dijkstra：从小根堆中取出当前最近的未确定节点，将其确定，并松弛其出边；若所有节点都被到达，答案为最大确定距离。它直接刻画信号在小米 IoT 设备网状拓扑中的传播时延。时间 O(E log V)，空间 O(V + E)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 节点第一次被弹出即以最短距离确定，后续陈旧弹出直接跳过。
- 所有边权非负，正是 Dijkstra 的前提；若出现负权应改用 Bellman-Ford。

**常见追问：**
- 如何同时还原到最慢节点的实际路径？
- 若图有数百万条边，如何优化堆或改用其他最短路算法？

**标签：** #algorithm

---

### 27. 冗余连接（Redundant Connection）

**难度：** 中等
**主题：** graph, union-find, cycle-detection
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 一棵 `n` 个节点的树被额外加了一条边，恰好形成一个环。给定边列表，返回一条可删除、使结果仍为树的边；若有多条，返回在列表中最后出现的那条。

**思路：** 并查集（DSU）。按顺序处理每条边并合并其两端；当某条边的两端已属同一集合时，它闭合了环即为答案。由于按输入顺序扫描，该边天然是最后加入的冗余边。在合并智能家居设备分组时可用于检测成环。时间 O(n * alpha(n)) 约 O(n)，空间 O(n)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 两端已在同一集合说明该边构成环，正是冗余边。
- 路径压缩（`parent[x] = parent[parent[x]]`）让 find 保持近乎常数的均摊复杂度。

**常见追问：**
- 若图为有向图（冗余连接 II），问题如何变化？
- 如何同时报告环上的所有节点，而不仅是闭合边？

**标签：** #algorithm

---

## 堆 / 优先队列

### 28. 数组中的第 K 个最大元素（Kth Largest Element in an Array）

**难度：** 中等
**主题：** heap, quickselect, sorting
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 返回无序数组中第 k 大的元素。

**思路：** 维护大小为 k 的最小堆，存放最大的 k 个；堆顶即答案。时间 O(n log k)，空间 O(k)。（快速选择平均 O(n)。）

**Python：**
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

**TypeScript：**
```typescript
function findKthLargest(nums: number[], k: number): number {
  // Simple, correct: sort descending and index. O(n log n).
  return [...nums].sort((a, b) => b - a)[k - 1];
}
```

**Java：**
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

**要点：**
- 大小为 k 的最小堆带来 O(n log k) 时间、O(k) 空间。
- 快速选择平均 O(n)，但无随机支点时最坏 O(n^2)。

**标签：** #algorithm

---

### 29. 前 K 个高频元素（Top K Frequent Elements）

**难度：** 中等
**主题：** heap, hash-table, bucket-sort
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 返回 `nums` 中出现频率最高的 `k` 个元素。

**思路：** 统计频次，再按频次分桶（下标 = 次数）并从高端收集。计数 + 分桶为 O(n) 时间、O(n) 空间。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 按频次桶排序实现 O(n) 时间、O(n) 空间。
- 大小为 k 的堆是 O(n log k) 的替代方案。

**标签：** #algorithm

---

### 30. 智能家居 IoT 事件调度（米家）

**难度：** 中等
**主题：** heap, intervals, greedy
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 米家把自动化事件按 `[start, end]` 时间窗口调度到一组执行 worker 上。给定一天所有事件窗口，求最少 worker 数，使重叠事件不共用 worker（即 IoT 版的"会议室 II"）。

**思路：** 按起点排序；用结束时间的最小堆。对每个事件，若最早结束的 worker 已空闲（`heap[0] <= start`）则复用（弹出）；总是压入当前结束时间。堆的峰值大小即答案。时间 O(n log n)，空间 O(n)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 排序 + 结束时间最小堆，O(n log n) 时间、O(n) 空间。
- 并发重叠的峰值即所需的最少 worker（会议室）数。

**标签：** #algorithm

---

### 31. 数据流的中位数（Find Median from Data Stream）

**难度：** 困难
**主题：** heap, design, two-heaps
**岗位：** Backend SWE
**级别：** L12+

**问题：** 支持从数据流中不断添加数字，并可在任意时刻查询当前中位数。

**思路：** 用一个大顶堆存较小的一半、一个小顶堆存较大的一半，并保持两堆大小相差不超过 1。中位数为较大堆的堆顶，或两个堆顶的平均值。添加 O(log n)，查询 O(1)。适用于小米设备遥测在线计算 p50 时延的场景。

**Python：**
```python
import heapq

class MedianFinder:
    def __init__(self) -> None:
        self.small: list[int] = []  # 大顶堆（取负模拟）
        self.large: list[int] = []  # 小顶堆

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

**TypeScript：**
```typescript
class MedianFinder {
  private nums: number[] = []; // 保持有序

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

**Java：**
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

**要点：**
- 两个平衡的堆实现 O(log n) 插入、O(1) 查询中位数。
- 不变式为 small.size == large.size 或 small.size == large.size + 1。

**常见追问：**
- 如何支持对最近 k 个读数的滑动窗口中位数？
- 内存受限时如何近似中位数（如 t-digest）？

**标签：** #algorithm

---

### 32. 最接近原点的 K 个点（K Closest Points to Origin）

**难度：** 中等
**主题：** heap, sorting, geometry
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 给定平面上的一组点，返回距离原点（欧氏距离）最近的 `k` 个点。

**思路：** 维护一个大小为 k 的大顶堆，按距离平方排序；堆顶是当前最优 k 个中最远的一个，每来一个更近的点就替换堆顶。时间 O(n log k)，空间 O(k)。用距离平方比较可省去开方。可用于找出离用户最近的 k 个米家设备或服务节点。

**Python：**
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

**TypeScript：**
```typescript
function kClosest(points: number[][], k: number): number[][] {
  return [...points]
    .sort((a, b) => a[0] * a[0] + a[1] * a[1] - (b[0] * b[0] + b[1] * b[1]))
    .slice(0, k);
}
```

**Java：**
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

**要点：**
- 比较距离平方即可，避免浮点开方。
- 大小为 k 的大顶堆为 O(n log k)；快速选择平均 O(n)。

**常见追问：**
- 如何适配到源源不断到来的点流？
- 高维空间的 k 近邻会有什么变化？

**标签：** #algorithm

---

## 栈 / 队列

### 33. 有效的括号（Valid Parentheses）

**难度：** 简单
**主题：** stack, string
**岗位：** Backend SWE
**级别：** L8-L9

**问题：** 给定只含 `()[]{}` 的字符串，判断括号是否按正确顺序开合。

**思路：** 压入左括号；遇右括号时栈顶须为其匹配左括号。最终栈空即平衡。时间 O(n)，空间 O(n)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 栈带来 O(n) 时间、O(n) 空间。
- 遇右括号弹栈前先判空。

**常见追问：**
- 返回使其有效所需的最少插入/删除次数。
- 支持嵌套的通用开/闭标记或类 HTML 标签。
- 求最长有效括号子串的长度（DP/栈）。

**标签：** #algorithm

---

### 34. 传感器数据滑动窗口最大值（Sliding-Window Maximum）

**难度：** 困难
**主题：** sliding-window, deque, monotonic-queue
**岗位：** Embedded Engineer
**级别：** L10-L11

**问题：** 小米传感器流式上报读数；对滑过数据流的大小为 `k` 的窗口，报告每个窗口的最大读数（用于尖峰检测）。

**思路：** 单调递减的下标双端队列——压入前先弹出较小的队尾值，当队首滑出窗口时弹出队首。队首始终是窗口最大值。时间 O(n)，空间 O(k)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 每个下标至多入队、出队各一次 → O(n) 时间、O(k) 空间。
- 双端队列保持单调递减，故队首即窗口最大值。

**标签：** #algorithm

---

### 35. 最小栈（Min Stack）

**难度：** 中等
**主题：** stack, design
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 设计一个栈，支持 push、pop、top，并能在 O(1) 时间内获取最小元素。

**思路：** 每个元素与「到它为止的最小值」一起入栈。栈顶元素的第二个字段始终是当前最小值，因此各操作均为 O(1) 时间、O(n) 空间。

**Python：**
```python
class MinStack:
    def __init__(self) -> None:
        self.stack: list[tuple[int, int]] = []  # (值, 到此为止的最小值)

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

**TypeScript：**
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

**Java：**
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

**要点：**
- 每个值配对当前最小值，使所有操作保持 O(1)。
- 另一种做法：用第二个栈只保存最小值。

**常见追问：**
- 如何同时支持 O(1) 的 getMax？
- 当最小值很少变化时，如何减少额外空间？

**标签：** #algorithm

---

### 36. 每日温度（Daily Temperatures）

**难度：** 中等
**主题：** stack, monotonic-stack, array
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 给定每日温度，对每一天求出还需等多少天才会出现更高温度；若不存在则为 0。

**思路：** 维护一个单调递减的下标栈。当前温度高于栈顶下标对应温度时，该较早那天的答案就是下标差，弹出并填入。每个下标只入栈、出栈各一次，时间 O(n)、空间 O(n)。同样的单调栈套路适用于传感器阈值等待时间查询。

**Python：**
```python
def daily_temperatures(temps: list[int]) -> list[int]:
    res = [0] * len(temps)
    stack: list[int] = []  # 下标，温度递减
    for i, t in enumerate(temps):
        while stack and temps[stack[-1]] < t:
            j = stack.pop()
            res[j] = i - j
        stack.append(i)
    return res
```

**TypeScript：**
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

**Java：**
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

**要点：**
- 单调递减栈使每天的「下一个更大值」总体 O(n) 完成。
- 每个下标最多入栈、出栈各一次。

**常见追问：**
- 如果改为求下一个更冷的一天怎么做？
- 能否边流式读取输入边给出答案？

**标签：** #algorithm

---

## 哈希表

### 37. 两数之和（Two Sum）

**难度：** 简单
**主题：** array, hash-table
**岗位：** Backend SWE
**级别：** L8-L9

**问题：** 给定整数数组 `nums` 和整数 `target`，返回和为 `target` 的两个数的下标。恰好存在一个解，且同一元素不能使用两次。

**思路：** 单次遍历，用哈希表记录 值 → 下标。对每个元素检查 `target - x` 是否已出现；若是则返回两个下标，否则存入当前值。时间 O(n)，空间 O(n)——严格优于 O(n^2) 暴力。

**Python：**
```python
def two_sum(nums: list[int], target: int) -> list[int]:
    seen: dict[int, int] = {}
    for i, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], i]
        seen[x] = i
    return []
```

**TypeScript：**
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

**Java：**
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

**要点：**
- 哈希表把内层查找变为 O(1)，整体 O(n) 时间、O(n) 空间。
- 先检查再存入当前值，避免元素与自身配对。

**常见追问：**
- 返回所有不重复的数对（不止一个）——排序 + 双指针。
- 数组已排序——用双指针 O(1) 额外空间求解。
- 数字可重复且需要计数——用频次表。

**标签：** #algorithm

---

### 38. 有效的字母异位词（Valid Anagram）

**难度：** 简单
**主题：** string, hash-table, counting
**岗位：** Backend SWE
**级别：** L8-L9

**问题：** 给定字符串 `s` 和 `t`，判断 `t` 是否为 `s` 的字母异位词（字符及频次相同）。

**思路：** 统计 `s` 的字符频次，再用 `t` 递减；所有计数最终须为零（且长度须相等）。时间 O(n)，固定字母表下空间 O(1)（一般情形为 O(k)）。

**Python：**
```python
from collections import Counter

def is_anagram(s: str, t: str) -> bool:
    return len(s) == len(t) and Counter(s) == Counter(t)
```

**TypeScript：**
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

**Java：**
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

**要点：**
- O(n) 时间；固定 26 字母表下 O(1) 空间。
- 先比长度可快速短路不等的输入。

**常见追问：**
- Unicode 输入——用哈希表替代定长数组。
- 把所有异位词分组——以排序后字符串或计数签名为键。
- 大小写不敏感 / 忽略空格——先归一化。

**标签：** #algorithm

---

### 39. 无重复字符的最长子串（Longest Substring Without Repeating Characters）

**难度：** 中等
**主题：** string, sliding-window, hash-table
**岗位：** Backend SWE
**级别：** L8-L9

**问题：** 返回 `s` 中不含重复字符的最长子串的长度。

**思路：** 滑动窗口，用映射记录字符最后出现的下标。当重复字符落在窗口内，把左边界跳到其后。时间 O(n)，空间 O(min(n, 字母表))。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 每个下标进出窗口各一次 → O(n) 时间。
- 最后出现下标表的空间为 O(min(n, 字母表))。

**标签：** #algorithm

---

### 40. 最小覆盖子串（Minimum Window Substring）

**难度：** 困难
**主题：** string, sliding-window, hash-table
**岗位：** Senior SWE
**级别：** L10-L11

**问题：** 给定字符串 `s` 和 `t`，返回 `s` 中包含 `t` 全部字符（含重数）的最小子串，若不存在返回 ""。

**思路：** 扩张右边界并统计所需字符；窗口一旦合法，就在保持合法的前提下从左收缩并记录最优。时间 O(n + m)，空间 O(字母表)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 每个字符至多加入和移出一次 → O(n + m) 时间。
- `missing` 计数器避免重扫 need 表来判断合法性。

**标签：** #algorithm

---

### 41. 单词拆分（Word Break）

**难度：** 中等
**主题：** dynamic-programming, string, hash-table
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 给定字符串 `s` 和字典 `wordDict`，判断 `s` 能否拆分为空格分隔的字典单词序列。

**思路：** DP，`dp[i]` 为 `s[:i]` 是否可拆分；对每个 i，检查存在切分点 j 使 `dp[j]` 为真且 `s[j:i]` 在集合中。时间 O(n^2)（再乘以单词长度的查找），空间 O(n)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- O(n^2) 次子串检查（集合查找平均 O(L)），O(n) 空间。
- `dp[0] = true` 把空前缀作为可拆分的起点。

**标签：** #algorithm

---

### 42. 字母异位词分组（Group Anagrams）

**难度：** 中等
**主题：** hash-table, string, sorting
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 将一组字符串分组，使互为字母异位词的字符串归入同一组。

**思路：** 用每个单词排序后的字符作为规范化哈希键，所有异位词都会映射到相同的键。n 个长度不超过 k 的单词，时间 O(n * k log k)，空间 O(n * k)。改用计数键可达 O(n * k)。

**Python：**
```python
from collections import defaultdict

def group_anagrams(strs: list[str]) -> list[list[str]]:
    groups: dict[str, list[str]] = defaultdict(list)
    for s in strs:
        key = "".join(sorted(s))
        groups[key].append(s)
    return list(groups.values())
```

**TypeScript：**
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

**Java：**
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

**要点：**
- 排序后的字符构成所有异位词共享的规范化键。
- 对小写输入，长度 26 的计数数组是更快的 O(k) 键。

**常见追问：**
- 当单词很长但字母表很小时，哪种键更优？
- 如果数据流无法全部放入内存，如何分组？

**标签：** #algorithm

---

### 43. 最长连续序列（Longest Consecutive Sequence）

**难度：** 中等
**主题：** hash-table, array, union-find
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 给定一个无序数组，返回最长连续整数序列的长度。

**思路：** 把所有数字放入哈希集合。只从「前驱不存在」的数字开始计数一段序列，再向上依次检查后继是否存在。每个数字至多被访问两次，无需排序即可达到 O(n) 时间、O(n) 空间。

**Python：**
```python
def longest_consecutive(nums: list[int]) -> int:
    s = set(nums)
    best = 0
    for x in s:
        if x - 1 not in s:  # 序列起点
            length = 1
            while x + length in s:
                length += 1
            best = max(best, length)
    return best
```

**TypeScript：**
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

**Java：**
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

**要点：**
- 只从序列起点开始扩展，使总体工作量保持 O(n)。
- 使用哈希集合避免了排序的 O(n log n) 开销。

**常见追问：**
- 如何不仅返回长度，还返回序列本身？
- 如果数组有数十亿条且分布在多个分片上怎么办？

**标签：** #algorithm

---

## 二分查找

### 44. 寻找旋转排序数组中的最小值（Find Minimum in Rotated Sorted Array）

**难度：** 中等
**主题：** binary-search, array
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 一个由互不相同的值组成的有序数组在某个支点处发生了旋转，请在 O(log n) 内返回其最小元素。

**思路：** 二分时将中间元素与右边界比较。若 mid 大于最右元素，则最小值严格位于右侧；否则最小值在 mid 或其左侧。收敛至 lo == hi。时间 O(log n)，空间 O(1)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 与右边界比较可避免来自左侧的歧义。
- 半开区间收敛（lo < hi，hi = mid）可防止死循环。

**常见追问：**
- 允许存在重复元素时逻辑如何变化？
- 如何同时返回旋转支点的下标？

**标签：** #algorithm

---

### 45. 搜索二维矩阵（Search a 2D Matrix）

**难度：** 中等
**主题：** binary-search, matrix
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 在一个 m x n 矩阵中查找目标值，其中每行升序排列，且每行首元素大于上一行末元素。

**思路：** 把矩阵看作长度为 m*n 的一维有序数组，对扁平下标做二分，将下标 i 映射到行 i/cols、列 i%cols。时间 O(log(m*n))，空间 O(1)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 整个矩阵可视为一个有序序列，从而只需一次二分查找。
- 下标到 (行, 列) 的映射为 i / cols 与 i % cols。

**常见追问：**
- 若仅行、列各自独立有序（阶梯搜索）该怎么做？
- 如何返回位置而非布尔值？

**标签：** #algorithm

---

### 46. 爱吃香蕉的珂珂（Koko Eating Bananas）

**难度：** 中等
**主题：** binary-search, search-on-answer
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 给定若干堆香蕉和 h 小时，求能在 h 小时内吃完所有堆的最小整数吃速（每小时只吃一堆）。

**思路：** 在答案空间 [1, max(piles)] 上二分。随着吃速增大，所需小时数单调不增，因此寻找使所需小时数不超过 h 的最小吃速。时间 O(n log(max))，空间 O(1)。同样的「速率调优」套路可用于限制 OTA 下载带宽以在时间窗内完成。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 因为可行性关于吃速单调，所以可以对答案二分。
- 搜索边界为 [1, max(piles)]；用向上取整除法统计每堆所需小时。

**常见追问：**
- 如果每小时可以跨多堆吃怎么办？
- 如何扩展为在总能耗预算下最小化速率？

**标签：** #algorithm

---

## 动态规划

### 47. 买卖股票的最佳时机（Best Time to Buy and Sell Stock）

**难度：** 简单
**主题：** array, dynamic-programming
**岗位：** Backend SWE
**级别：** L8-L9

**问题：** 给定数组 `prices`，`prices[i]` 是第 `i` 天的价格，求一次买入后再卖出的最大利润；无利可图返回 0。

**思路：** 维护至今见过的最低价，以及"今天卖出"的最佳利润。单次遍历，O(n) 时间、O(1) 空间。至今最低价即任意后续卖出的最优买入日。

**Python：**
```python
def max_profit(prices: list[int]) -> int:
    min_price, best = float("inf"), 0
    for p in prices:
        min_price = min(min_price, p)
        best = max(best, p - min_price)
    return best
```

**TypeScript：**
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

**Java：**
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

**要点：**
- 单次遍历，O(n) 时间、O(1) 空间，无需嵌套循环。
- 维护至今最低价作为隐式的最优买入日。

**常见追问：**
- 允许无限次交易（买卖股票 II）——累加所有正差值。
- 最多 k 次交易——在 (天数, 交易次数) 上做 DP。
- 加入手续费或冷冻期——状态机 DP。

**标签：** #algorithm

---

### 48. 最大子数组和（Maximum Subarray）

**难度：** 中等
**主题：** array, dynamic-programming, kadane
**岗位：** Backend SWE
**级别：** L8-L9

**问题：** 求和最大的连续子数组，并返回该和。

**思路：** Kadane 算法——维护"以当前结尾的最佳和"，当其低于当前元素时重置。同时记录全局最大值。时间 O(n)，空间 O(1)。

**Python：**
```python
def max_sub_array(nums: list[int]) -> int:
    best = cur = nums[0]
    for x in nums[1:]:
        cur = max(x, cur + x)
        best = max(best, cur)
    return best
```

**TypeScript：**
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

**Java：**
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

**要点：**
- Kadane O(n) 时间、O(1) 空间。
- 以首元素初始化，可正确处理全负数组。

**常见追问：**
- 返回子数组的下标，而不只是和。
- 最大乘积子数组——同时维护最小和最大（符号会翻转）。
- 环形数组变体——普通 Kadane 与"总和 - 最小子数组"结合。

**标签：** #algorithm

---

### 49. 爬楼梯（Climbing Stairs）

**难度：** 简单
**主题：** dynamic-programming, fibonacci
**岗位：** Embedded Engineer
**级别：** L8-L9

**问题：** 每次可爬 1 或 2 级，爬 `n` 级楼梯有多少种不同方法？

**思路：** 斐波那契递推 `f(n) = f(n-1) + f(n-2)`，用两个滚动变量。时间 O(n)，空间 O(1)。

**Python：**
```python
def climb_stairs(n: int) -> int:
    a, b = 1, 1
    for _ in range(n):
        a, b = b, a + b
    return a
```

**TypeScript：**
```typescript
function climbStairs(n: number): number {
  let a = 1, b = 1;
  for (let i = 0; i < n; i++) { [a, b] = [b, a + b]; }
  return a;
}
```

**Java：**
```java
int climbStairs(int n) {
  int a = 1, b = 1;
  for (int i = 0; i < n; i++) { int t = a + b; a = b; b = t; }
  return a;
}
```

**要点：**
- 滚动变量使其 O(n) 时间、O(1) 空间。
- 本质是斐波那契数列。

**标签：** #algorithm

---

### 50. 零钱兑换（Coin Change）

**难度：** 中等
**主题：** dynamic-programming, unbounded-knapsack
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 给定硬币面额与 `amount`，返回凑成该金额所需的最少硬币数，无法凑成返回 -1。

**思路：** 自底向上 DP，`dp[x]` 为金额 `x` 的最少硬币数，对每个硬币松弛。时间 O(amount * 硬币数)，空间 O(amount)。

**Python：**
```python
def coin_change(coins: list[int], amount: int) -> int:
    dp = [0] + [float("inf")] * amount
    for x in range(1, amount + 1):
        for c in coins:
            if c <= x:
                dp[x] = min(dp[x], dp[x - c] + 1)
    return -1 if dp[amount] == float("inf") else dp[amount]
```

**TypeScript：**
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

**Java：**
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

**要点：**
- O(amount * 硬币种数) 时间、O(amount) 空间。
- 完全背包：硬币可重复使用，故金额由内向外递推。

**标签：** #algorithm

---

### 51. 最长递增子序列（Longest Increasing Subsequence）

**难度：** 中等
**主题：** dynamic-programming, binary-search
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 返回 `nums` 中最长严格递增子序列的长度。

**思路：** 耐心排序——维护 `tails`，`tails[i]` 为长度 i+1 的递增子序列的最小尾值；对每个值二分查找插入位置。时间 O(n log n)，空间 O(n)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 二分查找 tails 数组实现 O(n log n) 时间、O(n) 空间。
- O(n^2) 的 DP 更简单但更慢；两者都可提及。

**标签：** #algorithm

---

### 52. 打家劫舍（House Robber）

**难度：** 中等
**主题：** dynamic-programming
**岗位：** Backend SWE
**级别：** L8-L9

**问题：** 给定非负的房屋金额，在不偷相邻两户的前提下最大化总金额。

**思路：** DP `rob(i) = max(跳过 i, value[i] + rob(i-2))`，用两个滚动变量。时间 O(n)，空间 O(1)。

**Python：**
```python
def rob(nums: list[int]) -> int:
    prev = cur = 0
    for x in nums:
        prev, cur = cur, max(cur, prev + x)
    return cur
```

**TypeScript：**
```typescript
function rob(nums: number[]): number {
  let prev = 0, cur = 0;
  for (const x of nums) { const t = Math.max(cur, prev + x); prev = cur; cur = t; }
  return cur;
}
```

**Java：**
```java
int rob(int[] nums) {
  int prev = 0, cur = 0;
  for (int x : nums) { int t = Math.max(cur, prev + x); prev = cur; cur = t; }
  return cur;
}
```

**要点：**
- 两个滚动值实现 O(n) 时间、O(1) 空间。
- 每户要么偷（接 i-2），要么跳过（保留 i-1）。

**标签：** #algorithm

---

### 53. 编辑距离（Edit Distance）

**难度：** 困难
**主题：** dynamic-programming, string
**岗位：** Senior SWE
**级别：** L10-L11

**问题：** 返回把 `word1` 变为 `word2` 所需的最少插入/删除/替换操作数。

**思路：** 二维 DP，`dp[i][j]` 为前缀的编辑距离；字符相等取对角，否则 1 + min(插入, 删除, 替换)。时间 O(n*m)，空间 O(n*m)（可降至 O(min(n,m))）。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 经典 O(n*m) 时间、O(n*m) 空间 DP（滚动行可降至 O(min(n,m))）。
- 三个转移分别对应删除、插入、替换。

**标签：** #algorithm

---

### 54. 电池功耗优化（DP）

**难度：** 中等
**主题：** dynamic-programming
**岗位：** Embedded Engineer
**级别：** L10-L11

**问题：** 小米设备可运行后台任务，每个任务有功耗成本和效用值，但调度中相邻两个任务不能同时运行（它们争用同一硬件块）。给定按顺序排列的任务效用值，在"不相邻"约束下最大化总效用。

**思路：** 这是变形的打家劫舍：`best(i) = max(跳过 i, value[i] + best(i-2))`，用两个滚动变量计算。时间 O(n)，空间 O(1)。

**Python：**
```python
def max_utility(values: list[int]) -> int:
    prev = cur = 0
    for v in values:
        prev, cur = cur, max(cur, prev + v)
    return cur
```

**TypeScript：**
```typescript
function maxUtility(values: number[]): number {
  let prev = 0, cur = 0;
  for (const v of values) { const t = Math.max(cur, prev + v); prev = cur; cur = t; }
  return cur;
}
```

**Java：**
```java
int maxUtility(int[] values) {
  int prev = 0, cur = 0;
  for (int v : values) { int t = Math.max(cur, prev + v); prev = cur; cur = t; }
  return cur;
}
```

**要点：**
- 用两个滚动变量的线性 DP → O(n) 时间、O(1) 空间。
- "不相邻"约束恰好对应打家劫舍的递推。

**标签：** #algorithm

---

### 55. 不同路径（Unique Paths）

**难度：** 中等
**主题：** dynamic-programming, combinatorics
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 机器人位于 `m x n` 网格左上角，每次只能向右或向下移动，求到达右下角的不同路径总数。

**思路：** 每个格子的路径数等于上方格子与左方格子之和，只依赖上一行，故用一维滚动数组即可。时间 O(m*n)，空间 O(n)——与小米仓储/机器人路径规划中的网格计数同源。

**Python：**
```python
def unique_paths(m: int, n: int) -> int:
    dp = [1] * n
    for _ in range(1, m):
        for j in range(1, n):
            dp[j] += dp[j - 1]
    return dp[-1]
```

**TypeScript：**
```typescript
function uniquePaths(m: number, n: number): number {
  const dp = new Array(n).fill(1);
  for (let i = 1; i < m; i++)
    for (let j = 1; j < n; j++) dp[j] += dp[j - 1];
  return dp[n - 1];
}
```

**Java：**
```java
int uniquePaths(int m, int n) {
  int[] dp = new int[n];
  Arrays.fill(dp, 1);
  for (int i = 1; i < m; i++)
    for (int j = 1; j < n; j++) dp[j] += dp[j - 1];
  return dp[n - 1];
}
```

**要点：**
- 一维滚动数组把空间从 O(m*n) 降到 O(n)。
- 闭式解为组合数 C(m+n-2, m-1)。

**常见追问：**
- 若部分格子有障碍如何处理（Unique Paths II）？
- 若还允许对角线移动呢？

**标签：** #algorithm

---

### 56. 最长公共子序列（Longest Common Subsequence）

**难度：** 中等
**主题：** dynamic-programming, strings
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 给定两个字符串，返回它们最长公共子序列的长度（字符不必连续但需保持相对顺序）。

**思路：** 二维 DP，`dp[i][j]` 表示 `a` 前 `i` 个字符与 `b` 前 `j` 个字符的 LCS。字符相等则由对角线加一，否则取两侧删一个字符的较优解。时间 O(m*n)，空间 O(m*n)——是小米 OTA 增量差分与配置文件比对的核心。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 相等走对角线，不等取两邻较大值。
- 用两行滚动可将空间降到 O(min(m, n))。

**常见追问：**
- 如何还原出具体的子序列而不仅是长度？
- 它与编辑距离、与 `diff` 有何联系？

**标签：** #algorithm

---

### 57. 乘积最大子数组（Maximum Product Subarray）

**难度：** 中等
**主题：** dynamic-programming, arrays
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 给定整数数组，找出乘积最大的连续子数组并返回该乘积。

**思路：** 与最大和不同，负数会翻转大小关系，因此同时维护当前最大与最小乘积。遇到负数时交换二者，再各自与当前元素相乘扩展。时间 O(n)，空间 O(1)——适用于小米传感器流水线中增益/缩放因子的流式计算。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 必须同时保留最大与最小值，因为负数会交换二者的角色。
- 遇到 0 时窗口自然重置，因为 `max(x, ...)` 会选中 `x`。

**常见追问：**
- 如何同时返回子数组的下标区间？
- 为什么维护最大/最小两个状态可行，而单变量会失效？

**标签：** #algorithm

---

### 58. 解码方法（Decode Ways）

**难度：** 中等
**主题：** dynamic-programming, strings
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 消息按 `'A'->"1" ... 'Z'->"26"` 编码为数字串，给定该数字串，求共有多少种解码方式。

**思路：** 斐波那契式 DP：每个位置若单个数字有效（1-9）则加上前一位置的方案数，若两位数在 10-26 之间则再加上前两位置的方案数。用两个滚动变量即可，时间 O(n)，空间 O(1)——类似小米条码/序列号解析中的前缀歧义问题。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 前导 '0' 或无法与前一位组成有效两位数的孤立 '0' 会使方案数为 0。
- 只有两位数落在 10-26（而非 27-99 或 00-09）才贡献额外路径。

**常见追问：**
- 如何处理带 '*' 通配符的变体（Decode Ways II）？
- 如何还原出一种具体的解码字符串？

**标签：** #algorithm

---

## 回溯

### 59. 单词搜索（Word Search）

**难度：** 中等
**主题：** backtracking, dfs, matrix
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 给定字母网格和 `word`，判断能否经相邻（4 方向）格子且不重用格子拼出该词。

**思路：** 从每个格子 DFS 回溯，临时标记已访问格子并在返回时还原。时间 O(行*列*4^L)，词长 L 时递归空间 O(L)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 最坏 O(行*列*4^L) 时间；递归深度 O(L)。
- 临时标记格子防止同一路径内重用。

**标签：** #algorithm

---

### 60. 子集（Subsets）

**难度：** 中等
**主题：** backtracking, bit-manipulation
**岗位：** Backend SWE
**级别：** L8-L9

**问题：** 返回一组互异整数的所有子集（幂集）。

**思路：** 回溯——每个下标选择"包含或跳过"，记录当前子集。时间 O(n * 2^n)，递归空间 O(n) 加输出。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 2^n 个子集、每个长度至多 n → O(n * 2^n) 时间。
- 用 0..2^n-1 的位掩码是等价的迭代写法。

**标签：** #algorithm

---

### 61. 全排列（Permutations）

**难度：** 中等
**主题：** backtracking
**岗位：** Backend SWE
**级别：** L8-L9

**问题：** 返回一组互异整数的所有排列。

**思路：** 回溯，用 `used` 标记（或原地交换）；每层深度固定一个元素。时间 O(n * n!)，递归空间 O(n) 加输出。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- n! 个排列、每个 O(n) 构建 → O(n * n!) 时间。
- `used` 数组保证每个元素在一个排列中只出现一次。

**标签：** #algorithm

---

### 62. 组合总和（Combination Sum）

**难度：** 中等
**主题：** backtracking, dfs
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 给定互异正整数 `candidates` 和 `target`，返回所有和为 target 的不重复组合；每个候选可无限次复用。

**思路：** 回溯，用起始下标避免排列式重复；因允许重复，复用同一下标；当剩余 target 变负时剪枝。最坏时间 O(2^t)，递归空间 O(t)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 最坏指数级 O(2^target)；递归深度 O(target)。
- 传 `i`（而非 `i+1`）允许复用候选；起始下标阻止重复集合。

**标签：** #algorithm

---

### 63. 括号生成（Generate Parentheses）

**难度：** 中等
**主题：** backtracking, recursion
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 给定 `n` 对括号，生成所有合法（有效）的括号组合。

**思路：** 回溯时维护已放置的左、右括号数量。左括号数小于 n 时可加 `(`；右括号数小于左括号数时才可加 `)`，从而无需额外校验即保证合法。结果数为卡特兰数，时间 O(4^n / sqrt(n))，空间 O(n) 递归深度。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 不变式 `close < open` 在生成时即剪掉所有非法前缀。
- 结果数量为第 n 个卡特兰数。

**常见追问：**
- 如何只统计组合数而不生成它们？
- 如何推广到多种括号类型？

**标签：** #algorithm

---

### 64. 电话号码的字母组合（Letter Combinations of a Phone Number）

**难度：** 中等
**主题：** backtracking, recursion
**岗位：** Android Engineer
**级别：** L10-L11

**问题：** 给定仅含数字 2-9 的字符串，返回该号码在电话九宫格键盘上能表示的所有字母组合。

**思路：** 将每个数字映射到其字母集合，逐位回溯：先追加一个候选字母再递归到下一位。设 `n` 位数字、每位至多 4 个字母，时间 O(4^n * n)，空间 O(n) 递归——即 MIUI 拨号盘/联系人搜索中常见的 T9 式展开。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 空输入应返回空列表，而非含一个空串的列表。
- 递归深度等于数字个数，每位分支因子为 3 或 4。

**常见追问：**
- 如何以迭代器/生成器方式惰性产出组合？
- 如何结合真实词典对结果排序以做联想输入？

**标签：** #algorithm

---

## 双指针 / 滑动窗口

### 65. 验证回文串（Valid Palindrome）

**难度：** 简单
**主题：** two-pointers, strings
**岗位：** Android Engineer
**级别：** L8-L9

**问题：** 给定字符串，只考虑字母和数字字符并忽略大小写，判断它是否为回文串。

**思路：** 双指针从两端向中间移动，跳过非字母数字字符，并比较小写化后的字符。时间 O(n)，空间 O(1)——原地轻量校验，契合小米内存受限的嵌入式/Android 代码路径。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 原地跳过无需构造过滤后的副本，空间保持 O(1)。
- 仅在比较时归一化大小写，不修改原字符串。

**常见追问：**
- 若允许最多删除一个字符如何处理（Valid Palindrome II）？
- 若考虑 Unicode/区域相关的大小写规则会怎样影响比较？

**标签：** #algorithm

---

### 66. 接雨水（Trapping Rain Water）

**难度：** 困难
**主题：** two-pointers, arrays
**岗位：** Backend SWE
**级别：** L12+

**问题：** 给定一组非负的柱子高度，计算下雨后柱子之间能接住多少雨水。

**思路：** 双指针从两端向内，维护 `leftMax`/`rightMax`。总是移动当前高度较小的一侧，因为该侧接水量由自身最大值决定。时间 O(n)，空间 O(1)——在优化小米设备紧凑循环时颇受青睐的一次遍历技巧。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 每根柱子上方水量为 min(leftMax, rightMax) - height；较小一侧的最大值已确定。
- 双指针优于占用 O(n) 空间的前缀/后缀最大值数组。

**常见追问：**
- 如何扩展到二维版本（Trapping Rain Water II）？
- 能否同时返回每一列的积水量分布？

**标签：** #algorithm

---

### 67. 长度最小的子数组（Minimum Size Subarray Sum）

**难度：** 中等
**主题：** sliding-window, two-pointers
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 给定正整数数组和目标值 `target`，返回和 >= target 的最短连续子数组长度；若不存在返回 0。

**思路：** 变长滑动窗口：右端扩张以增大区间和，随后在仍满足目标时从左端收缩，记录最小宽度。每个下标进出窗口各一次。时间 O(n)，空间 O(1)——即小米遥测接入中常见的速率/吞吐窗口模式。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 用 `while`（而非 `if`）收缩才能在每个右端找到最紧窗口。
- 该窗口成立的前提是全为正数，从而保证区间和单调。

**常见追问：**
- 如何用前缀和 + 二分做到 O(n log n)？
- 若数组可含负数会破坏什么？

**标签：** #algorithm

---

## 数组 / 字符串

### 68. 盛最多水的容器（Container With Most Water）

**难度：** 中等
**主题：** array, two-pointer, greedy
**岗位：** Backend SWE
**级别：** L8-L9

**问题：** 给定高度 `height[i]`，选两条线与 x 轴构成容器使盛水最多，返回最大面积。

**思路：** 双指针置于两端；面积为 `min(h[l], h[r]) * (r - l)`。移动较矮一侧，因为它限制了高度。时间 O(n)，空间 O(1)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 双指针扫描 O(n) 时间、O(1) 空间，优于 O(n^2) 暴力。
- 始终移动较矮一侧——较高一侧在与较矮配对时永远无法增大面积。

**常见追问：**
- 接雨水——统计所有柱子上方蓄水量。
- 返回所选两条线的下标。
- 三维版本（接雨水 II）——从边界用最小堆。

**标签：** #algorithm

---

### 69. 三数之和（3Sum）

**难度：** 中等
**主题：** array, two-pointer, sorting
**岗位：** Backend SWE
**级别：** L8-L9

**问题：** 返回 `nums` 中所有和为零的不重复三元组 `[a, b, c]`。

**思路：** 排序后固定每个 `i`，对其余部分用双指针找 `-nums[i]`。在三个位置都跳过重复值。排序 O(n log n)，扫描 O(n^2)，整体 O(n^2) 时间、O(1) 额外空间（不含输出）。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 排序使双指针扫描成为可能，整体 O(n^2) 时间。
- 在 i、l、r 处跳过重复值以保证三元组唯一。

**常见追问：**
- 最接近的三数之和——记录最接近 target 的和。
- 四数之和——再加一层外循环，O(n^3)。
- 统计和小于 target 的三元组数量，而非等于。

**标签：** #algorithm

---

### 70. 二分查找（Binary Search）

**难度：** 简单
**主题：** binary-search, array
**岗位：** Embedded Engineer
**级别：** L8-L9

**问题：** 给定升序排序数组 `nums` 与 `target`，返回其下标，不存在返回 -1。

**思路：** 维护 `[lo, hi]`，比较中点并每步舍弃一半。用 `lo + (hi - lo) // 2` 避免溢出。时间 O(log n)，空间 O(1)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- O(log n) 时间、O(1) 空间——每次迭代折半搜索区间。
- `lo + (hi - lo) / 2` 在大边界下避免整型溢出。

**常见追问：**
- 返回最左/最右插入位置（下界/上界）。
- 在旋转有序数组中查找。
- 在单调答案空间上二分（如最小容量）。

**标签：** #algorithm

---

### 71. 搜索旋转排序数组（Search in Rotated Sorted Array）

**难度：** 中等
**主题：** binary-search, array
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 一个有序数组在未知支点处旋转（值各异）。找出 `target` 的下标，不存在返回 -1。

**思路：** 改进的二分：每步必有一半有序。用 `nums[lo] <= nums[mid]` 判断哪半有序，再决定 target 是否落于其中。时间 O(log n)，空间 O(1)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 即便发生旋转，仍是 O(log n) 时间、O(1) 空间。
- 先识别有序的那一半，再判断 target 是否落在其中。

**常见追问：**
- 允许重复（搜索旋转排序数组 II）——最坏退化为 O(n)。
- 找最小值/旋转支点下标。
- 用二分找任意峰值元素。

**标签：** #algorithm

---

### 72. 除自身以外数组的乘积（Product of Array Except Self）

**难度：** 中等
**主题：** array, prefix-product
**岗位：** Backend SWE
**级别：** L8-L9

**问题：** 返回每个元素为其余所有元素乘积的数组，不用除法且 O(n) 完成。

**思路：** 两遍扫描——先从左到右把前缀乘积写入输出，再从右到左用一个滚动变量乘以后缀乘积。时间 O(n)，不含输出空间 O(1)。

**Python：**
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

**TypeScript：**
```typescript
function productExceptSelf(nums: number[]): number[] {
  const n = nums.length, out = new Array(n).fill(1);
  for (let i = 1; i < n; i++) out[i] = out[i - 1] * nums[i - 1];
  let right = 1;
  for (let i = n - 1; i >= 0; i--) { out[i] *= right; right *= nums[i]; }
  return out;
}
```

**Java：**
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

**要点：**
- 两次线性扫描带来 O(n) 时间、O(1) 额外空间（不含输出）。
- 前缀放数组、后缀放标量——无需除法。

**标签：** #algorithm

---

### 73. 合并区间（Merge Intervals）

**难度：** 中等
**主题：** intervals, sorting
**岗位：** Backend SWE
**级别：** L8-L9

**问题：** 给定区间 `[start, end]`，合并所有重叠区间。

**思路：** 按起点排序后扫描——下一个与上一个合并区间重叠时延展，否则追加。时间 O(n log n)（排序主导），空间 O(n)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 排序主导 → O(n log n) 时间、O(n) 输出空间。
- 排序后一次线性扫描即可合并重叠。

**标签：** #algorithm

---

### 74. 移动零（Move Zeroes）

**难度：** 简单
**主题：** array, two-pointers, in-place
**岗位：** Backend SWE
**级别：** L8-L9

**问题：** 给定整数数组 `nums`，将所有 `0` 移到末尾，同时保持非零元素的相对顺序。要求原地完成、不复制数组。

**思路：** 双指针：写指针 `j` 标记下一个非零元素应放的位置。用 `i` 遍历，遇到非零就与 `nums[j]` 交换并让 `j` 前进。`j` 之前的部分始终紧凑且有序，零自然被挤到尾部。时间 O(n)，空间 O(1)——正是内存受限的设备代码所需的紧凑原地扫描。

**Python：**
```python
def move_zeroes(nums: list[int]) -> None:
    j = 0
    for i in range(len(nums)):
        if nums[i] != 0:
            nums[i], nums[j] = nums[j], nums[i]
            j += 1
```

**TypeScript：**
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

**Java：**
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

**要点：**
- 单次遍历、O(1) 额外空间；交换保持非零值的原有顺序。
- 写指针 `j` 记录已放置的非零元素个数。

**常见追问：**
- 零很少时减少写操作——仅当 `i != j` 才交换。
- 改为把零移到开头——从右向左扫描。

**标签：** #algorithm

---

### 75. 最长回文子串（Longest Palindromic Substring）

**难度：** 中等
**主题：** string, two-pointers, dynamic-programming
**岗位：** Backend SWE / Android Engineer
**级别：** L10-L11

**问题：** 给定字符串 s，返回它的最长回文子串。

**思路：** 中心扩展法。回文关于中心对称，中心可能是单个字符（奇数长度）或两个字符之间（偶数长度），共 2n-1 个中心。对每个中心向两侧扩展，记录最长区间。O(n^2) 时间，O(1) 空间。Manacher 算法可做到 O(n)，但面试中中心扩展已足够且更易写对。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 每个位置要同时试奇数中心 (i, i) 和偶数中心 (i, i+1)。
- 用起止下标而非切片来比较长度，避免反复拷贝子串。
- 扩展停止后中心两侧各退一格才是有效回文边界。

**常见追问：**
- 如何用 Manacher 算法做到 O(n)？
- 若要求返回所有最长回文子串或统计回文子串总数如何改？

**标签：** #algorithm

---

### 76. 颜色分类（Sort Colors）

**难度：** 中等
**主题：** array, two-pointers, sorting
**岗位：** Backend SWE / Android Engineer
**级别：** L10-L11

**问题：** 给定一个只含 0、1、2 的数组，原地排序使相同颜色相邻，顺序为红(0)、白(1)、蓝(2)。要求不使用库排序，一趟扫描完成。

**思路：** 荷兰国旗三指针。low 指向已确定 0 区的下一位，high 指向已确定 2 区的前一位，mid 为当前扫描位。mid 遇 0 与 low 交换并双双前进；遇 1 只前进 mid；遇 2 与 high 交换并 high 后退（不动 mid，因为换来的值未检查）。O(n) 时间、O(1) 空间，单趟完成。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 换 2 后不推进 mid，因为从 high 换来的值尚未检查。
- 循环条件是 mid <= high；越过 high 的区间已全是 2。
- 不变式：[0,low) 全 0，[low,mid) 全 1，(high,end) 全 2。

**常见追问：**
- 若有 k 种颜色（而非 3 种）如何推广？（计数排序）
- 只允许交换、且要最少交换次数时如何分析？

**标签：** #algorithm

---

## 其他算法

### 77. 只出现一次的数字（Single Number）

**难度：** 简单
**主题：** bit-manipulation, xor
**岗位：** Embedded Engineer
**级别：** L8-L9

**问题：** 每个元素出现两次，仅一个出现一次。在 O(n) 时间、O(1) 空间内找出它。

**思路：** 对所有元素做异或；成对者相消为 0，剩下唯一值。时间 O(n)，空间 O(1)。

**Python：**
```python
from functools import reduce
from operator import xor

def single_number(nums: list[int]) -> int:
    return reduce(xor, nums, 0)
```

**TypeScript：**
```typescript
function singleNumber(nums: number[]): number {
  return nums.reduce((acc, x) => acc ^ x, 0);
}
```

**Java：**
```java
int singleNumber(int[] nums) {
  int acc = 0;
  for (int x : nums) acc ^= x;
  return acc;
}
```

**要点：**
- 异或满足结合律/交换律，重复者相消 → O(n) 时间、O(1) 空间。
- 关键恒等式：`x ^ x = 0`、`x ^ 0 = x`。

**标签：** #algorithm

---

## 系统设计

### 78. 设计米家智能家居 IoT 平台

**难度：** 困难
**主题：** system-design, iot, mqtt, scale
**岗位：** Senior SWE
**级别：** L12+

**问题：** 设计米家后端，连接数亿台智能设备（灯、插座、摄像头、传感器）到手机和云端自动化。

**思路：** 设备通过 MQTT（轻量、发布/订阅、QoS 分级）或自定义 TCP 协议与边缘网关层维持长连接；网关无状态、水平扩展，置于按设备 ID 一致性哈希的连接感知负载均衡之后。设备注册表/影子服务存储"最后已知"和"期望"状态（类似 AWS IoT 设备影子），即使设备离线也能读写状态。命令流：App → 云 → 设备主题；遥测流：设备 → 主题 → 流（Kafka）→ 存储 + 规则引擎。自动化/规则引擎以低延迟评估触发器（"有人移动则开灯"），最好下推到本地中枢以支持离线运行。权衡：MQTT 与 WebSocket（电量、NAT）、亿级规模下的单设备连接成本（保活调优、连接分片）、影子状态的最终/强一致性、区域数据合规（中国与全球）。安全：每设备证书/密钥、TLS、主题级 ACL，使一台被攻陷设备无法订阅其他设备。

**标签：** #system-design

---

### 79. 设计 OTA 固件升级系统

**难度：** 困难
**主题：** system-design, ota, cdn, rollout
**岗位：** Senior SWE
**级别：** L12+

**问题：** 为数千万台内存有限、连接间歇的小米 IoT 设备设计空中（OTA）固件升级。

**思路：** 构建侧：签名的固件构件存于对象存储并经 CDN 分发；元数据服务跟踪设备型号、当前版本与目标版本。设备轮询（或被推送）升级清单，分块可续传下载（range 请求；每块校验和），并采用 A/B（双分区）方案刷写，使失败的刷写回滚到已知良好分区。关键：分级/灰度发布——先发 1% → 监控崩溃/变砖率 → 再放量；带急停开关。差分升级（bsdiff）以在受限设备上节省带宽。权衡：下载洪峰控制（抖动调度、CDN 卸载）、在内存受限 MCU 上校验签名、刷写中途断电（原子分区切换）、老硬件的版本碎片化。升级成功/失败遥测反馈给发布控制器。

**标签：** #system-design

---

### 80. 设计 MIUI 推送通知服务

**难度：** 困难
**主题：** system-design, push, fanout, websocket
**岗位：** Senior SWE
**级别：** L12+

**问题：** 设计向数亿台 Android 设备可靠、低延迟投递消息的推送系统（MIPush）。

**思路：** 设备与连接网关层维持长连接（长连 TCP/MQTT）；路由服务把 设备 token → 当前持有该连接的网关实例（存于 Redis 等快速注册表）。发布方（App）调 API → 消息队列 → 路由 → 网关 → 设备。对离线设备做存储转发并设 TTL，重连时投递。用消息 ID 去重；至少一次投递配合客户端 ack。规模问题：数千万并发 socket 意味着连接分片、心跳/保活调优（电量与存活检测的平衡）、海量重连的惊群（抖动退避）。优先级通道（IM 消息 vs 营销）与每 App 限流。权衡：自建通道 vs FCM（国内 FCM 不可用，故自建通道是必需）、精确一次代价高——优选至少一次 + 幂等客户端。

**标签：** #system-design

---

### 81. 设计小米商城秒杀/抢购系统

**难度：** 困难
**主题：** system-design, high-concurrency, cache, consistency
**岗位：** Senior SWE
**级别：** L12+

**问题：** 设计小米商城的秒杀场景：有限库存（如 10000 台手机）在数秒内被数百万用户抢购且不超卖。

**思路：** 核心难题是极小库存上的极端读写洪峰。分层防护：(1) CDN + 商品页静态缓存；(2) 前端限流（禁用按钮、验证码、排队令牌）；(3) 请求准入——只放行约等于库存量的流量；(4) 在 Redis 中原子扣减库存（用 Lua 脚本做检查并扣减），从而杜绝超卖；(5) 经消息队列（Kafka/RocketMQ）异步创建真实订单——Redis 把守库存，DB 写在队列之后以削峰。以 用户+场次 为键的幂等下单防止重复购买。反作弊：限流、设备指纹、风险评分。权衡：Redis 计数器的强一致 vs DB 持久性（异步对账）、优雅降级（快速"售罄"路径）、开抢前预热缓存。可提及若单 key 成热点则把库存分片到多个 Redis key。

**标签：** #system-design

---

### 82. 设计应用商店 / 短视频推荐流

**难度：** 困难
**主题：** system-design, recommendation, ranking, feed
**岗位：** Senior SWE
**级别：** L12+

**问题：** 为小米应用商店（或短视频界面）设计推荐流，大规模提供个性化排序内容。

**思路：** 两阶段架构：(1) 候选生成——通过协同过滤、embedding 最近邻（ANN 索引）、近期热门等来源，从海量库中检索数百候选；(2) 排序——学习模型用用户特征、物品特征与上下文（时间、设备）对候选打分。经特征存储提供服务（在线低延迟查询、离线训练）。流装配应用业务规则：多样性（不连续展示同类）、新鲜度、已看去重。日志闭环：曝光/点击 → 训练数据 → 周期性重训。权衡：延迟预算（数十毫秒）迫使用 ANN + 缓存特征；新用户/新物品冷启动（回退到热门/基于内容）；探索与利用（注入少量随机以收集信号）。可提及线上 A/B 测试做模型放量。

**标签：** #system-design

---

### 83. 设计设备到云遥测接入

**难度：** 困难
**主题：** system-design, streaming, time-series, kafka
**岗位：** Senior SWE
**级别：** L12+

**问题：** 设计从数百万台小米 IoT 设备接入高吞吐遥测（传感器读数、设备健康）用于监控与分析的管道。

**思路：** 边缘网关接收设备消息并发布到按设备 ID 分区的日志（Kafka）以保证单设备有序。流处理器（Flink/Kafka Streams）做校验、富化与窗口聚合（如 1 分钟汇总）。热路径 → 时序数据库（用于看板/告警）；冷路径 → 对象存储/数据湖用于批量分析与 ML 训练。边缘端的背压处理与批量发送降低连接开销。权衡：单设备有序（按设备分区）vs 吞吐、精确一次 vs 至少一次（幂等 sink）、降采样/保留分层（原始保留 7 天、汇总保留一年）、新设备类型上线时的 schema 演进。异常告警反馈给规则引擎。亿级设备下，可提及采样与边缘预聚合以控制成本。

**标签：** #system-design

---

### 84. 设计分布式缓存

**难度：** 困难
**主题：** system-design, cache, consistent-hashing, replication
**岗位：** Senior SWE
**级别：** L12+

**问题：** 设计供小米后端各服务使用的分布式内存缓存（类 Redis/Memcached）。

**思路：** 用一致性哈希把 key 分区到各节点（虚拟节点保证均衡并在成员变更时最小化重洗）。复制：每个分片有主 + 从用于读扩展与故障切换（异步复制以延迟换持久性）。淘汰策略（LRU/LFU）配合 TTL。客户端或代理路由（智能客户端或 Twemproxy/Redis Cluster 代理）。一致性：旁路缓存最常见（应用读缓存，未命中则读 DB 并回填）；讨论写穿 vs 写回与缓存失效（最难的问题）。处理热 key（复制/本地缓存）、过期惊群（请求合并/互斥/stale-while-revalidate）、缓存穿透（布隆过滤器或缓存空值）。权衡：强一致 vs 最终一致、内存 vs 命中率、故障模式（缓存宕机不可级联——加熔断与对 DB 的限流）。

**标签：** #system-design

---

### 85. 设计实时订单系统

**难度：** 困难
**主题：** system-design, transactions, idempotency, queue
**岗位：** Senior SWE
**级别：** L12+

**问题：** 设计小米商城的订单处理系统，可靠处理下单、支付、库存与履约。

**思路：** 订单服务以"待处理"状态写入订单（幂等键 = 用户 + 购物车令牌，防重复提交）。库存预留原子进行（预留，尚不扣减）。支付为外部异步调用；成功后由事件驱动状态流转（待处理 → 已支付 → 履约中 → 已发货）。各阶段间用消息队列解耦并重试；订单状态机为事实源。跨服务一致性不用分布式锁，而用 Saga 模式配合补偿动作（支付失败/超时则释放库存）。权衡：跨服务精确一次不现实——设计幂等处理 + 去重；订单、库存、支付间的最终一致配合对账任务；超时（自动取消未支付订单以释放预留库存）。可提及 outbox 模式，把事件与 DB 写事务性地一起发布。

**标签：** #system-design

---

### 86. 设计智能家居自动化规则引擎

**难度：** 困难
**主题：** system-design, iot, rules-engine, event-driven
**岗位：** Backend SWE
**级别：** L12+

**问题：** 设计米家背后的自动化/规则引擎——支持诸如"日落后检测到有人移动，则开走廊灯并启动摄像头"之类的用户规则，运行在数亿个家庭中。

**思路：** 将规则建模为事件-条件-动作（ECA）：触发器（设备事件、时间、地理围栏）、可选条件（状态谓词、时间窗）以及一个或多个动作（设备命令、通知）。规则编译为轻量表示，并按触发类型/设备建索引，使得到来的遥测事件只 fan-out 到订阅它的规则（避免全量扫描）。执行分层：延迟敏感、需离线可用的规则放在本地中枢运行（局域网、无云也可）；跨设备或依赖云的规则在云端流处理器运行（事件 → Kafka → 评估器）。对链式规则与循环用最大深度/环检测保护，并对抖动频繁的传感器做去抖。动作以幂等方式派发并重试；定时/日程用持久化延时队列。权衡：本地 vs 云端执行（延迟与离线韧性 vs 更丰富的条件）、规则冲突（两条规则驱动同一设备——按优先级/最后写入解决）、条件所用状态的一致性（设备影子可能陈旧）、以及安全地评估用户编写的逻辑（沙箱、禁止无界循环）。规模化时按家庭/设备对评估器分片，并在评估器近端缓存热点设备状态。

**标签：** #system-design

---

### 87. 设计小米汽车车联网遥测平台

**难度：** 困难
**主题：** system-design, telematics, iot, streaming, safety
**岗位：** Backend SWE
**级别：** L12+

**问题：** 设计小米汽车（如 SU7）的云平台：接入车辆遥测、支持 App 远程控制（上锁、空调、寻车）、并交付 OTA 升级——要求安全且可支撑车队规模。

**思路：** 每辆车与网关层维持安全的长连接（MQTT/TLS + 每车证书），进隧道/信号盲区时本地缓存，恢复后带背压续传。遥测（车速、电池/BMS、GPS、DTC 故障码）流入按 VIN 分区的日志（Kafka，保证单车有序）→ 流处理 → 时序库（热路径：看板/告警）与数据湖（冷路径：分析、续航/充电 ML）。远程命令走 App → 云 → 车辆的低延迟命令通道，要求强认证、防重放与命令确认；安全攸关的动作需按车辆状态门控（行驶中不解锁）。OTA 复用分级/灰度发布与 A/B 分区方案，但门控更严：仅在停车、电量充足且镜像已签名验证时升级。权衡：连接中断（边缘缓存、存储转发）、区域数据合规与隐私（位置是敏感 PII）、命令的精确一次 vs 至少一次（用幂等 + ack 替代精确一次）、以及严格的安全/安保边界——被攻陷的云端路径绝不能不安全地操控车辆。强调纵深防御、审计日志，以及娱乐信息域与整车控制（CAN）域之间的隔离。

**标签：** #system-design

---

### 88. 设计 HyperOS 跨设备互联接续

**难度：** 困难
**主题：** system-design, distributed, discovery, handoff
**岗位：** Backend SWE
**级别：** L12+

**问题：** 设计 HyperOS 的跨设备接续层：发现附近的小米设备（手机、平板、电视、汽车、手表），共享能力，并在设备间无缝流转任务（一通电话、一段视频、一份文档）。

**思路：** 分为两个平面。发现/连接平面：同账号/同家庭的设备通过局域网（mDNS/BLE）互相广播与发现，跨网场景用云端辅助的会合作为兜底；建立经认证的加密 P2P 通道（设备身份绑定到小米账号，靠近距离 + 密钥交换完成配对）。能力平面：每台设备把能力清单（摄像头、显示、扬声器、传感器）发布到分布式软总线；任务即可像调用本地能力一样调用远端能力（在 P2P 链路上做 RPC）。流转：源端把会话状态（播放进度、文档 + 光标、通话会话）序列化为紧凑的接续令牌，目标端据此恢复；媒体本身在设备间直连传输以避免云端往返。优先本地传输以兼顾延迟与隐私，设备不在同一网络时回退到云端中继。权衡：局域网 P2P 延迟 vs 云端可靠性、环境化设备网格的安全（双向认证、每会话密钥、设备离开账号时吊销）、状态迁移一致性（幂等恢复、共享状态最后写入者胜）、常态监听设备的发现噪声/功耗、以及目标端缺少某能力时的优雅降级。强调以小米账号为根的信任模型，以及软总线抽象——让 App 面向逻辑能力而非具体硬件。

**标签：** #system-design

---

## 行为面试

### 89. 为什么选择小米？（为发烧而生）

**难度：** 简单
**主题：** behavioral, motivation, fit
**岗位：** Backend SWE
**级别：** L8-L9

**问题：** 你为什么特别想加入小米？哪个产品/团队让你兴奋？

**思路：** 展现与小米身份认同的真实契合："为发烧而生"以及 AIoT + 手机 + 生态战略。要具体——点名一个产品（HyperOS、米家生态、你真正在用的小米手机或可穿戴设备）和一个小米强项的技术领域（超大规模 AIoT、MIUI/Android 深度、高并发电商）。结合你的能力：如"我做过嵌入式固件，想参与出货给数百万人的设备"。避免泛泛的"大公司/待遇好"——小米看重作为产品用户与发烧友的工程师。

**标签：** #behavioral

---

### 90. 成本效率思维（感动人心、价格厚道）

**难度：** 中等
**主题：** behavioral, cost, tradeoffs, ownership
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 讲一次你在紧张的资源或成本约束下交付了出色结果的经历。

**思路：** 小米的核心理念是"感动人心、价格厚道"与高性价比。他们考查你是否为价值优化、而非过度雕琢。用 STAR：选一个遇到约束（算力预算有限、小团队、廉价硬件目标）并做出务实权衡、在削减成本的同时保住用户体验的故事——如通过缓存/批处理把服务器成本降低 X%，或通过优化热路径在更便宜的硬件上交付。量化节省，并说明你接受了怎样的权衡（以及预算变大后会重新考虑什么）。避免过度工程的"豪华方案"故事。

**标签：** #behavioral

---

### 91. 快速发布节奏

**难度：** 中等
**主题：** behavioral, execution, shipping
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 描述一次你必须在硬件发布或固定截止日下快速交付的经历。你是怎么平衡速度与质量的？

**思路：** 小米在紧凑、不可变的发布日上交付软硬件，因此看重既快又不出事的工程师。用 STAR：真实的截止日（一次发布、一场秒杀）、你砍掉了什么 vs 守住了什么（砍掉锦上添花、守住正确性与回滚路径）、如何降风险（特性开关、灰度、监控）、以及结果。展现判断力：你不只是求快——你把风险讲清楚、取得共识、并备好回退方案。信号是务实的优先级排序加安全网，而非逞英雄。

**标签：** #behavioral

---

### 92. 与同事的冲突/分歧

**难度：** 中等
**主题：** behavioral, conflict, collaboration
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 讲一次你在技术决策上与同事或主管强烈分歧的经历。你是怎么处理的？

**思路：** 用 STAR。展现你：(1) 把自我与决策分离，努力理解对方理由；(2) 用数据或小原型而非空谈观点；(3) 在共同目标（用户体验、成本、截止日）上找共识；(4) 一旦决策达成就全力执行——即便不是你的方案（"求同存异、坚决执行"）。以结果和你对对方视角的领悟收尾。避免靠升级"获胜"或事后心怀不满的故事。

**标签：** #behavioral

---

### 93. 亲力亲为、深入钻研（工程师文化）

**难度：** 中等
**主题：** behavioral, ownership, engineer-culture, debugging
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 讲一个你亲自从头到尾深挖的最难的技术问题。你钻到了多深？靠什么解决的？

**思路：** 小米推崇亲力亲为的工程师文化——愿意深入而非把硬骨头甩给别人。用 STAR。情境：一个棘手、高风险的问题（偶发崩溃、数据损坏、高负载下的性能悬崖、设备固件问题）。任务：你对它的担当。行动：展现深度——你复现了它，读日志/追踪、做二分定位、下沉一层去查（钻进内核、JVM、抓包、CAN 总线等），而不是靠猜；你提出假设并系统性地逐一验证。结果：根因、修复，以及你为防复发所加的东西（一个测试、一个指标、一份应急手册）。信号是求真与坚持——你没有停在表象或转手他人。避免含糊的"后来我们修好了"，要点名工具、层次和确切根因。

**标签：** #behavioral

---

### 94. 倾听用户（粉丝驱动的产品）

**难度：** 中等
**主题：** behavioral, user-focus, product-sense, iteration
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 讲一次用户或社区反馈改变了你所做东西的经历。你是如何决定该采纳什么的？

**思路：** 小米靠"参与感"起家——MIUI 正是从粉丝社区每周根据用户反馈迭代成长起来的。面试官想看到你把用户当作伙伴，而非事后才想起。用 STAR。情境：真实反馈（缺陷报告、论坛/社区帖、应用商店评论、显示流失的遥测）。任务：把嘈杂信号转化为决策。行动：展现你如何分诊——把少数人的强烈诉求与普遍模式区分开，用定量数据交叉验证定性抱怨，按影响与成本排优先级，并快速上线改动（小米的紧凑迭代闭环），再度量是否真的有效。结果：成效（抱怨减少、留存/活跃提升）以及你建立的后续闭环。信号是同理心加判断力——你不会有求必应，而是找到背后的真实需求并验证修复。避免那种要么无视用户、要么谁声音大就盲目照做的故事。

**标签：** #behavioral

---

## 领域知识

### 95. Android 框架：Activity 生命周期、Binder IPC、Handler/Looper

**难度：** 困难
**主题：** domain-knowledge, android, ipc, concurrency
**岗位：** Android Engineer
**级别：** L10-L11

**问题：** 解释 Android Activity 生命周期、Binder IPC 的工作原理，以及 Handler/Looper/MessageQueue 的作用。为什么不能从后台线程更新 UI？

**思路：** **生命周期**：`onCreate → onStart → onResume`（前台）→ `onPause → onStop → onDestroy`；`onPause`/`onStop` 中释放资源；配置变更（旋转）会销毁并重建 Activity，除非自行处理——讲在 `onSaveInstanceState` 中保存状态。**Binder**：Android 的主要 IPC；内核驱动实现跨进程一次拷贝调用，由 AIDL 生成代理/桩。系统服务（ActivityManager 等）经 Binder 访问；提及每进程的 binder 线程池以及同步 Binder 调用会阻塞。**Handler/Looper**：每个线程可有一个 Looper 循环处理 MessageQueue；主（UI）线程在应用启动时已建好 Looper。Handler 把 Message/Runnable 投递到某线程队列。**UI 线程规则**：Android UI 工具包非线程安全且框架会检查调用线程，故 UI 更新须投递回主线程（经 Handler、`runOnUiThread` 或协程/`LiveData`）。后台工作（网络、磁盘）须放在主线程之外以避免 ANR（约 5 秒）。

**标签：** #domain-knowledge

---

### 96. JVM 内存模型与垃圾回收

**难度：** 困难
**主题：** domain-knowledge, jvm, gc, memory
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 描述 JVM 内存区域、分代 GC 模型，以及你怎么诊断内存泄漏或长 GC 停顿。

**思路：** **区域**：堆（年轻代 = Eden + 2 个 Survivor、老年代）、元空间（类元数据，Java 8 起在堆外）、每线程栈、PC 寄存器。**分代 GC**：多数对象朝生夕死 → 年轻代 minor GC 廉价回收（复制存活者）；存活足够多次的对象晋升到老年代，由 major/full GC 回收。提及回收器：Parallel（吞吐）、CMS（已弃用）、G1（分区，平衡停顿与吞吐）、ZGC/Shenandoah（低停顿、并发）。**诊断**：泄漏表现为老年代跨多次 full GC 持续增长直至 OOM——抓堆转储（`jmap`/`-XX:+HeapDumpOnOutOfMemoryError`）并在 MAT 中分析支配树找出被持有引用（如静态集合、未注销监听器、ThreadLocal）。停顿过长则读 GC 日志（`-Xlog:gc`），检查分配率与晋升，调整堆大小/切换到 G1/ZGC。Android 上 ART 不同（AOT + JIT、不同 GC）——若为客户端岗位需指出区别。

**标签：** #domain-knowledge

---

### 97. 嵌入式 C / RTOS 基础

**难度：** 困难
**主题：** domain-knowledge, embedded, rtos, c
**岗位：** Embedded Engineer
**级别：** L10-L11

**问题：** 对于跑在微控制器上的小米 IoT 设备，解释裸机大循环与 RTOS 的区别、`volatile` 的含义，以及如何处理 ISR 与主循环间的共享数据。

**思路：** **大循环 vs RTOS**：裸机用单个 `while(1)` 轮询/处理工作；简单但随功能增长难以满足时序。RTOS（FreeRTOS 等）提供带优先级的任务、调度器（抢占式、按优先级）与原语（信号量、队列、互斥锁），使时间关键工作可抢占后台工作。提及每任务独立栈与有限 RAM 的约束。**`volatile`**：告诉编译器变量可能在正常程序流之外改变（硬件寄存器、ISR 修改的标志），故不得缓存在寄存器或优化掉读取——这是正确性所需，但不提供原子性。**ISR ↔ 主循环共享**：ISR 要短；用 `volatile` 标志，或更好地用无锁环形缓冲/RTOS 队列把数据传出 ISR。对多字节共享数据，短暂关中断或用原子访问以避免撕裂。讨论优先级反转（用优先级继承互斥锁）与避免在 ISR 中阻塞调用。功耗：事件间进入睡眠模式以省电（对 IoT 关键）。

**标签：** #domain-knowledge

---

### 98. 计算机网络：HTTP 与 TCP

**难度：** 中等
**主题：** domain-knowledge, networking, tcp, http
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 讲一遍小米 App 请求 `https://api.mi.com/...` 时网络层发生的事，涵盖 DNS、TCP 握手、TLS，以及 HTTP/1.1、HTTP/2、HTTP/3 的区别。

**思路：** **DNS**：把 `api.mi.com` 解析为 IP（递归解析器、缓存，可能用 GeoDNS 指向最近区域）。**TCP 握手**：SYN → SYN-ACK → ACK 建立连接；讲三次握手以及 TCP 提供可靠、有序、带拥塞控制的传输（序号、ACK、重传、滑动窗口）。**TLS**：握手协商加密套件与密钥（TLS 1.3 一个 RTT 完成，支持 0-RTT 复用），使 HTTP 负载被加密。**HTTP 版本**：HTTP/1.1 = 每连接一次一个请求（队头阻塞，靠多连接 + keep-alive 缓解）；HTTP/2 = 单 TCP 连接上多路复用流 + 头压缩（HPACK），但在丢包时仍受 TCP 层队头阻塞；HTTP/3 = 跑在 QUIC（基于 UDP）上，按流投递使单流丢包不阻塞其他流，且连接建立更快——在易丢包的移动网络上很有价值。回到主题：对移动 IoT/App 流量，HTTP/3 / QUIC 与连接复用对延迟和电量很重要。

**标签：** #domain-knowledge

---

### 99. Linux 系统编程：进程、I/O 多路复用、信号

**难度：** 困难
**主题：** domain-knowledge, linux, systems, concurrency
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 解释 `fork`/`exec` 如何创建进程、进程与线程的区别、`epoll` 如何让单线程服务大量连接、以及信号的工作方式。对于高连接数的小米后端，为什么 `epoll` 优于 `select`？

**思路：** **进程 vs 线程**：`fork` 克隆调用进程（写时复制地址空间、内存独立）；`exec*` 替换映像以运行新程序——经典的 shell/服务器模式是先 fork 后 exec，并用 `wait`/`waitpid` 回收子进程以避免僵尸。线程共享同一地址空间（上下文切换更廉价、共享内存需同步）；进程以更高成本换取隔离。**I/O 多路复用**：单线程可同时监视多个文件描述符的就绪状态。`select`/`poll` 每次调用 O(n)——每次都重扫整个 fd 集；`epoll` 借助内核维护的兴趣列表与就绪列表做到摊还 O(1)，可扩展到数万连接（对推送/IoT 网关至关重要）。提及边缘触发 vs 水平触发（`EPOLLET` 需读到 `EAGAIN` 为止），以及 epoll 配合非阻塞 socket——即 Netty/nginx 背后的 reactor 模式。**信号**：异步通知（`SIGTERM`、`SIGINT`、`SIGCHLD`、`SIGPIPE`）；处理函数必须是异步信号安全的（只调用安全函数），因此常用自管道 / `signalfd` 技巧把信号并入事件循环。注意收到 `SIGTERM` 时优雅关闭、以及对断开 socket 的 `SIGPIPE` 做忽略/处理。

**标签：** #domain-knowledge

---

### 100. C 语言内存管理与未定义行为

**难度：** 困难
**主题：** domain-knowledge, c, memory, embedded
**岗位：** Embedded Engineer
**级别：** L10-L11

**问题：** 在小米设备的 C 代码中，解释栈分配与堆分配的区别、`malloc`/`free` 会出什么问题（泄漏、重复释放、释放后使用），并举几个未定义行为的例子。你如何捕获这些 bug？

**思路：** **栈 vs 堆**：局部变量在栈上——自动生命周期、快，但容量有限（返回指向局部变量的指针是经典的返回后使用 bug）；堆（`malloc`/`free`）为动态/长生命周期数据提供手动生命周期——每一次分配都要你自己负责。**常见错误**：内存泄漏（丢失了最后一个指针却没释放——对长期运行、RAM 极小的 IoT 固件是致命的）、重复释放与释放后使用（释放后再解引用——破坏分配器、可被利用）、悬空指针（释放后应置 NULL）、缓冲区溢出（越过数组写入——破坏相邻内存/返回地址）。**未定义行为**：越界访问、有符号整数溢出、读取未初始化内存、解引用 NULL、数据竞争、破坏严格别名——编译器可能假设 UB 永不发生并激进优化，于是 bug 只在高 `-O` 或某个工具链下才出现。**如何捕获**：用 `-Wall -Wextra` 编译，在测试中跑 AddressSanitizer/UBSan 与 Valgrind，用静态分析（clang-tidy、cppcheck、Coverity），并坚持严谨的所有权约定（每次分配单一所有者、每条路径都释放、释放后置 NULL）。在没有 MMU 的受限 MCU 上，内存 bug 往往是静默损坏而非段错误，因此要用静态分析、边界检查、有时还配合内存保护单元（MPU）/ 栈金丝雀来防护。

**标签：** #domain-knowledge

---

## 针对小米的专项建议

- **吃透你岗位的领域。** Android 客户端 → 框架内部（生命周期、Binder、Handler/Looper、ART）；设备/固件 → 嵌入式 C、RTOS、功耗；后端 → 高并发（秒杀）、缓存、IoT 遥测。
- **练好秒杀设计。** 秒杀/抢购是小米标志性的系统设计题——准备好讲 Redis 原子扣库存、队列承接下单、防超卖。
- **展现性价比思维。** 务实、重价值的权衡比镀金方案更受认可。
- **做真实用户。** 熟悉 HyperOS/MIUI 与小米生态体现文化契合（"为发烧而生"）。
- **算法门槛是扎实中等。** 多练数组、字符串、树、图、DP 与滑动窗口——而非竞赛级难题。
