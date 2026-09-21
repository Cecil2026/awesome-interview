# 华为（Huawei）

```yaml
company: 华为（运营商网络、HarmonyOS / 消费者 BG、华为云、5G/无线、硬件/嵌入式）
typical_rounds: 1 轮 OD/机试（在线编程测评）+ 2-4 轮技术面 + 交叉面 + HR/部门主管面
focus_areas: C/C++、算法（机试）、操作系统、TCP/IP 网络、嵌入式/电信、分布式系统
languages_allowed: C/C++ 最常见（尤其运营商/嵌入式）；云与工具链用 Java/Python/Go
duration: 机试约 150 分钟（3 道题）；每轮面试 45-60 分钟
notable_quirks:
  - 机试（OD 机试）是必过的编程门槛——通常 150 分钟 3 道算法题，按权重计分
  - OD（外包派遣）与正编岗位有区别——流程和待遇不同
  - 大量 C/C++ 指针与手动内存管理题；会考 segfault / 内存泄漏调试
  - 操作系统与网络深挖（进程 vs 线程、IPC、TCP 三次握手、拥塞控制）常见
  - 行为面会探查"奋斗者协议"与长工时文化
  - 系统设计带有强烈的电信 / 5G / HarmonyOS 分布式领域背景
sources: LeetCode Discuss（huawei 标签）、牛客网、一亩三分地、Glassdoor
```

## 概述

华为面试最显著的特点是分量很重、必须通过的机试（在线编程测评）——通常 150 分钟内 3 道算法题，这一关分数不佳往往会在任何真人面试之前就终止流程。C/C++ 是主导语言，尤其在运营商网络和嵌入式团队，因此除了标准数据结构题外，还要准备手动内存管理、指针运算以及 segfault/内存泄漏调试。面试官对操作系统和 TCP/IP 网络基础的深挖远超美国公司。系统设计扎根于华为的业务领域：电信计费、5G 基站、HarmonyOS 分布式软总线、运营商级高可用。行为面会探查"奋斗者"文化以及高压下工作的意愿。

## 链表

### 1. 反转链表（Reverse Linked List）

**难度：** 简单
**主题：** linked-list, two-pointer
**岗位：** OD / SWE
**级别：** 13-14（初级）

**问题：** 反转单链表并返回新的头节点。

**思路：** 用 `prev`/`curr` 指针遍历，原地翻转每个 `next`。时间 O(n)，空间 O(1)。这是华为 C/C++ 机试的常客——面试官也可能要求递归写法。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 原地翻转指针，时间 O(n)、空间 O(1)。
- 覆盖 `next` 前要先保存它，否则会丢失链表余下部分。

**追问：**
- 只反转位置 m 到 n 之间的节点。
- 每 k 个一组反转（k 个一组翻转链表）。
- 用递归实现，并讨论 O(n) 调用栈空间。
- 反转前先检测并处理是否存在环。

**标签：** #algorithm

---

### 2. 合并两个有序链表（Merge Two Sorted Lists）

**难度：** 简单
**主题：** linked-list, two-pointer
**岗位：** OD / SWE
**级别：** 13-14（初级）

**问题：** 合并两个有序链表为一个有序链表并返回头节点。

**思路：** 用哑头，遍历两链表每步拼接较小节点，最后接上剩余部分。时间 O(n + m)，空间 O(1)。

**Python：**
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

**要点：**
- 哑头免去对首节点的特判；时间 O(n + m)、空间 O(1)。
- 用一步接上非空的剩余部分，无需继续循环。

**追问：**
- 用堆合并 k 个有序链表，O(N log k)。
- 按降序合并。
- 原地合并两个有序数组。
- 值相等时保持合并稳定性。

**标签：** #algorithm

---

### 3. 环形链表（Linked List Cycle）

**难度：** 简单
**主题：** linked-list, two-pointer, floyd
**岗位：** OD / SWE
**级别：** 13-14（初级）

**问题：** 判断链表是否存在环。

**思路：** Floyd 龟兔指针——慢指针每次走一步，快指针每次两步；当且仅当有环时二者相遇。时间 O(n)，空间 O(1)。

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

**Java：**
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

**要点：**
- 双指针检测时间 O(n)、空间 O(1)，无需哈希集合。
- 快指针守住 `fast` 与 `fast.next`，避免空指针解引用。

**标签：** #algorithm

---

### 4. 删除链表的倒数第 N 个节点（Remove Nth Node From End of List）

**难度：** 中等
**主题：** linked-list, two-pointer
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 一趟遍历删除单链表的倒数第 n 个节点。

**思路：** 前导指针先走 n 步，然后前导与尾随指针同步前进，直到前导到末尾；此时尾随指针恰在目标节点前。用哑头处理删除头节点的边界。时间 O(n)，空间 O(1)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 两指针固定 n 间隔，实现一趟 O(n) 解法、O(1) 空间。
- 哑头消除了删除原头节点的特例。

**标签：** #algorithm

---

### 5. 合并 K 个有序链表（Merge k Sorted Lists）

**难度：** 困难
**主题：** linked-list, heap, divide-and-conquer
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 将 k 个有序链表合并为一个有序链表。

**思路：** 用当前各表头组成最小堆；弹出最小者，推入其后继，拼接到结果。总节点数为 N 时时间 O(N log k)，空间 O(k)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- k 大小的堆给出 O(N log k) 时间、O(k) 空间。
- 无堆库时，TypeScript 版收集后排序为 O(N log N)。

**标签：** #algorithm

---

### 6. 两数相加（Add Two Numbers）

**难度：** 中等
**主题：** linked-list, math, two-pointer
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 两个非空链表按逆序存储两个非负整数，每个节点存一位数字。将它们相加并以链表形式返回结果。

**思路：** 同时遍历两个链表并维护进位，每个位置生成一个结果节点；只要任一链表还有节点或存在进位就继续。时间 O(max(n, m))，空间 O(max(n, m))（结果链表）。逆序存储意味着最低位在最前，无需预先反转。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 循环条件必须包含 `carry`，这样最高位进位（如 5+5）才能生成新节点。
- 哑头节点避免对首个结果节点做特殊处理。
- 数字逆序存储使得可以从低位到高位相加，无需反转链表。

**标签：** #algorithm

---

### 7. 复制带随机指针的链表（Copy List with Random Pointer）

**难度：** 中等
**主题：** linked-list, hash-table
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 每个节点有一个 `next` 指针和一个 `random` 指针，`random` 可指向任意节点或为空。返回该链表的深拷贝。

**思路：** O(1) 空间的技巧是交织复制节点：把每个副本插到其原节点之后（A -> A' -> B -> B'），这样 `curr.random.next` 恰好就是随机目标的副本；随后连接随机指针，最后拆分两条链表。两趟遍历，时间 O(n)，除输出外空间 O(1)。（用哈希表 original->copy 是更简单的 O(n) 空间方案。）

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

**Java：**
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

**要点：**
- 交织复制使得可以通过 `cur.random.next` 找到随机目标的副本，无需哈希表。
- 必须先连接随机指针再拆分，否则交织结构会被破坏。
- 拆分时恢复原链表的 `next` 指针，保证输入不被修改。

**标签：** #algorithm

---

### 8. 重排链表（Reorder List）

**难度：** 中等
**主题：** linked-list, two-pointer
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 给定链表 L0 -> L1 -> ... -> Ln-1 -> Ln，原地将其重排为 L0 -> Ln -> L1 -> Ln-1 -> L2 -> ...，不得修改节点的值。

**思路：** 三个经典步骤：用快慢指针找中点，反转后半段，再将两半交替合并。时间 O(n)，空间 O(1)。纯指针操作，是考察原地链表操作能力的常见题。

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
    prev, cur = None, slow.next
    slow.next = None
    while cur:
        cur.next, prev, cur = prev, cur, cur.next
    first, second = head, prev
    while second:
        first.next, second.next, first, second = second, first.next, first.next, second.next
```

**TypeScript：**
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

**Java：**
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

**要点：**
- 在中点处断链（`slow.next = null`），使两半在合并前相互独立。
- 使用快慢指针时前半段长度 >= 后半段，因此合并循环可以以 `second` 为终止条件。
- 全部通过指针重连原地完成，额外空间 O(1)。

**标签：** #algorithm

---

## 树

### 9. 翻转二叉树（Invert Binary Tree）

**难度：** 简单
**主题：** tree, recursion, dfs
**岗位：** OD / SWE
**级别：** 13-14（初级）

**问题：** 翻转二叉树（镜像左右子树）。

**思路：** 在每个节点递归交换左右孩子。时间 O(n)，递归栈空间 O(h)。

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
  if (root) {
    const l = invertTree(root.left);
    root.left = invertTree(root.right);
    root.right = l;
  }
  return root;
}
```

**Java：**
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

**要点：**
- 每个节点访问一次，时间 O(n)；递归深度 O(h) 空间。
- 用显式栈或队列可得到相同结果的迭代写法。

**标签：** #algorithm

---

### 10. 二叉树的最大深度（Maximum Depth of Binary Tree）

**难度：** 简单
**主题：** tree, dfs, recursion
**岗位：** OD / SWE
**级别：** 13-14（初级）

**问题：** 返回二叉树的最大深度（最长根到叶路径上的节点数）。

**思路：** 深度为 `1 + max(深度(左), 深度(右))`。时间 O(n)，空间 O(h)。

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

**Java：**
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

**要点：**
- 后序递归每个节点访问一次：时间 O(n)、空间 O(h)。
- 最坏情况斜树会使栈深度达到 O(n)。

**标签：** #algorithm

---

### 11. 验证二叉搜索树（Validate Binary Search Tree）

**难度：** 中等
**主题：** tree, dfs, bst
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 判断一棵二叉树是否为合法的 BST。

**思路：** 递归时携带开区间 `(low, high)`；每个节点值须严格落在区间内，向下递归时收紧边界。时间 O(n)，空间 O(h)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 一次有界 DFS 遍历，时间 O(n)、空间 O(h)。
- 仅做逐节点比较不够，边界必须自祖先向下传播。

**标签：** #algorithm

---

### 12. 二叉树的层序遍历（Binary Tree Level Order Traversal）

**难度：** 中等
**主题：** tree, bfs, queue
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 自顶向下逐层返回节点值。

**思路：** 用队列做 BFS，每轮外循环处理完整的一层。时间 O(n)，空间 O(n)。

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
            n = q.popleft()
            level.append(n.val)
            if n.left:
                q.append(n.left)
            if n.right:
                q.append(n.right)
        res.append(level)
    return res
```

**TypeScript：**
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

**Java：**
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

**要点：**
- BFS 每个节点访问一次：时间 O(n)、队列空间 O(n)。
- 每层快照队列大小可将各层区分开。

**标签：** #algorithm

---

### 13. 二叉树的最近公共祖先（Lowest Common Ancestor of a Binary Tree）

**难度：** 中等
**主题：** tree, dfs, recursion
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 在二叉树（不一定是 BST）中找两个节点的最近公共祖先。

**思路：** 后序递归；若某节点的两个子树各自包含一个目标（或它本身就是目标），则它即为 LCA。时间 O(n)，空间 O(h)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 一次后序遍历，时间 O(n)、空间 O(h)。
- 两个子树都返回非空即定位到分叉节点 = LCA。

**标签：** #algorithm

---

### 14. 实现 Trie（前缀树）（Implement Trie）

**难度：** 中等
**主题：** trie, design, string
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 实现带 `insert`、`search`、`startsWith` 的字典树。

**思路：** 每个节点持有子链接和词尾标记；操作时每字符走一个节点。每次操作时间 O(L)，空间 O(总字符数)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 每次操作走 L 个节点，时间 O(L)；空间 O(插入的总字符数)。
- 词尾标记区分"存储的单词"与"仅是前缀"。

**标签：** #algorithm

---

### 15. 二叉树的直径（Diameter of Binary Tree）

**难度：** 简单
**主题：** tree, dfs, recursion
**岗位：** OD / SWE
**级别：** 13-14（初级）

**问题：** 给定二叉树的根节点，返回其直径：任意两节点间最长路径的边数（该路径不一定经过根节点）。

**思路：** 后序 DFS 在返回每个节点高度的同时更新全局最优值。经过某节点的最长路径为 `左高 + 右高`（以边计），而该节点返回的高度为 `1 + max(左, 右)`。仅一次遍历，时间 O(n)，空间 O(h)。

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

**Java：**
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

**要点：**
- 直径按边计数，故合并子树高度用 `l + r` 而非 `l + r + 1`。
- 一次后序遍历同时求出高度与答案：时间 O(n)，栈空间 O(h)。

**标签：** #algorithm

---

### 16. 二叉树的右视图（Binary Tree Right Side View）

**难度：** 中等
**主题：** tree, bfs, dfs
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 给定二叉树的根节点，返回从右侧观察这棵树时自上而下能看到的节点值。

**思路：** 逐层 BFS，取每层最后一个节点，即为该层最右可见节点。或采用先右后左的 DFS，记录每个深度首次遇到的节点。时间 O(n)，空间 O(n)（最宽层的队列）或 O(h)（DFS）。

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

**Java：**
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

**要点：**
- 每层最右可见节点是 BFS 中该层最后出队的节点，不一定是右孩子。
- 先右后左的 DFS 配合按深度索引的结果，可用 O(h) 额外空间得到同样答案。

**标签：** #algorithm

---

### 17. 二叉搜索树中第 K 小的元素（Kth Smallest Element in a BST）

**难度：** 中等
**主题：** tree, bst, dfs
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 给定二叉搜索树的根节点与整数 k，返回所有节点值中第 k 小（从 1 计数）的值。

**思路：** BST 的中序遍历按升序访问节点值，因此在第 k 个处停止即可。用显式栈的迭代中序遍历可提前退出。时间 O(h + k)，空间 O(h)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- BST 的中序遍历产生升序序列，故弹出的第 k 个节点即为答案。
- 迭代栈在 k 归零时立即停止：时间 O(h + k)，空间 O(h)。

**标签：** #algorithm

---

### 18. 二叉树的序列化与反序列化（Serialize and Deserialize Binary Tree）

**难度：** 困难
**主题：** tree, dfs, design
**岗位：** OD / SWE
**级别：** 17-18（专家）

**问题：** 设计算法将二叉树序列化为字符串，并能将该字符串反序列化还原为原始树结构。节点值可能重复，节点可能为空。

**思路：** 前序 DFS 输出每个值，并为空孩子输出哨兵，得到逗号分隔的字符串。反序列化按相同的前序顺序消费 token，依次重建根、左子树、右子树。双向均为时间 O(n)、空间 O(n)，与网络设备上持久化配置树时的树到线编码思路一致。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 空节点哨兵使结构无歧义，仅凭前序即可重建整棵树。
- 序列化与反序列化必须约定相同的遍历顺序，并按该顺序消费 token。

**标签：** #algorithm

---

## 图

### 19. 岛屿数量（Number of Islands）

**难度：** 中等
**主题：** graph, dfs, bfs, grid, union-find
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 统计由 `'1'`（陆地）组成的连通块数量，网格由 `'1'`/`'0'` 构成。

**思路：** 扫描网格；遇到未访问的陆地格就用洪水填充（DFS/BFS）整座岛并计数，把访问过的陆地沉为 `'0'`。时间 O(行·列)，最坏空间 O(行·列)。

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

**Java：**
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

**要点：**
- 每个格子被访问常数次：时间 O(行·列)。
- 单个超大岛时递归深度（或队列）可达 O(行·列)。

**标签：** #algorithm

---

### 20. 腐烂的橘子（Rotting Oranges）

**难度：** 中等
**主题：** graph, bfs, grid
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 网格含空/新鲜/腐烂橘子，每分钟腐烂橘子使其上下左右 4 个邻居腐烂。返回直到无新鲜橘子的分钟数，不可能则返回 -1。

**思路：** 从所有腐烂橘子同时出发做多源 BFS；统计层数（分钟）。若 BFS 后仍有新鲜橘子则返回 -1。时间 O(行·列)，空间 O(行·列)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 多源 BFS 每个格子处理一次：时间和空间均为 O(行·列)。
- 统计新鲜橘子数可 O(1) 检测不可达情形。

**标签：** #algorithm

---

### 21. 课程表（Course Schedule）

**难度：** 中等
**主题：** graph, topological-sort, bfs
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 给定 `numCourses` 及先修课对，判断能否修完所有课程（即依赖图无环）。

**思路：** Kahn 算法——计算入度，反复移除入度为 0 的节点；若全部移除则无环。时间 O(V + E)，空间 O(V + E)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- Kahn 拓扑排序时间 O(V + E)、空间 O(V + E)。
- 若处理的节点少于 `numCourses`，说明存在环。

**标签：** #algorithm

---

### 22. 省份数量（并查集）（Number of Provinces）

**难度：** 中等
**主题：** union-find, graph, dsu
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 给定 `n x n` 邻接矩阵，`isConnected[i][j] == 1` 表示城市 i 与 j 直接相连，返回连通省份的数量。

**思路：** 带路径压缩与按秩合并的并查集；对每对相连城市做合并，再统计不同的根。近线性时间 O(n^2·α(n))，空间 O(n)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 路径压缩使每次操作近 O(1) 摊还（α(n)）；总体 O(n^2·α(n))。
- 合并全部完成后统计根即得省份数，耗时 O(n)。

**标签：** #algorithm

---

### 23. 数据包路由最短路径（Dijkstra）（Packet Routing Shortest Path）

**难度：** 中等
**主题：** graph, dijkstra, heap, shortest-path
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 由 `n` 个路由器组成的网络，链路有正时延。求一个数据包从源路由器到每个其他路由器的最小总时延；不可达的路由器报告为无穷大。

**思路：** 用 Dijkstra 加最小堆做单源最短路径。建邻接表，松弛邻居，跳过过期的堆条目。时间 O((V + E) log V)，空间 O(V + E)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 带二叉堆的 Dijkstra，时间 O((V + E) log V)、空间 O(V + E)。
- 要求权重为正；存在负时延则需 Bellman-Ford。

**标签：** #algorithm

---

### 24. 克隆图（Clone Graph）

**难度：** 中等
**主题：** graph, dfs, hash-table, recursion
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 给定连通无向图中某个节点的引用，返回该图的深拷贝（克隆）。每个节点包含一个值和一个邻居列表。

**思路：** 用 DFS 并用哈希表记录「原节点→克隆节点」的映射，保证每个节点只克隆一次，且能正确处理环。这类似于在华为设备管理中对活跃网络拓扑图做深拷贝。时间 O(V + E)，空间 O(V)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 打破环的关键在哈希表：递归邻居之前先把克隆节点登记进去。
- 用队列做 BFS 也是同样有效的遍历顺序，两者都是 O(V + E)。

**标签：** #algorithm

---

### 25. 有限跳数的最低成本路由（Cheapest Flights Within K Stops）

**难度：** 中等
**主题：** graph, bellman-ford, shortest-path, dynamic-programming
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 网络有 `n` 个节点和有向链路 `[u, v, w]`（成本为 `w`）。求从 `src` 到 `dst`、最多经过 `k` 个中转跳数的最低成本；若在限制内不可达则返回 `-1`。

**思路：** 用 Bellman-Ford，恰好松弛 `k + 1` 轮。每轮先对距离数组做快照，避免本轮的松弛在同一轮内继续传播，从而严格控制跳数上限。契合电信路由中数据包只能经过有限中继的场景。时间 O(k * E)，空间 O(V)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 每轮复制 `dist` 是关键；原地松弛会允许超过 `k` 跳。
- 朴素 Dijkstra 在这里会失败，因为最便宜的路径可能用了超过限制的跳数。

**标签：** #algorithm

---

### 26. 连接所有点的最小成本（Min Cost to Connect All Points）

**难度：** 中等
**主题：** graph, minimum-spanning-tree, union-find, greedy
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 给定二维平面上的 `points`，连接两点的成本为它们的曼哈顿距离。返回把所有点连通（任意两点可达）的最小总成本。

**思路：** 这是最小生成树问题。构造所有候选边，按成本排序，用 Kruskal + 并查集，每次加入连接两个不同连通分量的最便宜边，直到用满 `n - 1` 条边。这类似于在华为各站点间铺设成本最小的网络骨干。时间 O(n^2 log n)，空间 O(n^2)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 并查集的路径压缩让每次 find 摊还接近 O(1)，排序才是主要开销。
- 用堆实现的 Prim 是另一种选择，在稠密图上更优，可达 O(n^2)。

**标签：** #algorithm

---

## 堆 / 优先队列

### 27. 前 K 个高频元素（Top K Frequent Elements）

**难度：** 中等
**主题：** heap, hash-table, bucket-sort
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 返回数组中出现频率最高的 k 个元素。

**思路：** 统计频次，再按频率桶排序（下标 = 计数），从高到低读取桶。时间 O(n)，空间 O(n)。堆解法为 O(n log k)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 按频率桶排序，时间 O(n)、空间 O(n)。
- 替代方案是大小为 k 的最小堆，时间 O(n log k)。

**标签：** #algorithm

---

### 28. 数组中的第 K 个最大元素（Kth Largest Element in an Array）

**难度：** 中等
**主题：** heap, quickselect, sorting
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 返回未排序数组中第 k 大的元素。

**思路：** 维护大小为 k 的最小堆；处理完所有元素后堆顶即为答案。时间 O(n log k)，空间 O(k)。快速选择平均 O(n)。

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
  // O(n log n) sort fallback when no heap library is available.
  return nums.slice().sort((a, b) => b - a)[k - 1];
}
```

**Java：**
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

**要点：**
- 大小为 k 的最小堆，时间 O(n log k)、空间 O(k)。
- 快速选择平均 O(n)，但坏支点会退化到 O(n^2)。

**标签：** #algorithm

---

### 29. 电信信号任务调度（贪心 + 堆）（Telecom Signal Task Scheduling）

**难度：** 中等
**主题：** heap, greedy, intervals
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 调度器需运行信号处理任务，每个任务有 `[start, end]` 时间窗。若两个任务时间窗重叠则不能在同一处理单元上运行。求运行全部任务所需的最少处理单元数。

**思路：** 等价于"会议室 II"。按起点排序任务；用结束时间的最小堆。对每个任务，释放结束时间 ≤ 当前起点的单元，再分配；堆的峰值大小即为答案。时间 O(n log n)，空间 O(n)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 排序加堆操作，时间 O(n log n)、空间 O(n)。
- 最小堆的峰值大小等于最大同时重叠数 = 所需单元数。

**标签：** #algorithm

---

### 30. 数据流的中位数（Find Median from Data Stream）

**难度：** 困难
**主题：** heap, design, two-heaps
**岗位：** OD / SWE（部分嵌入式/网络方向）
**级别：** 17-18（专家）

**问题：** 设计一个数据结构，支持不断加入整数，并能随时返回当前所有元素的中位数。

**思路：** 用两个堆维护：大顶堆 `small` 存较小的一半，小顶堆 `large` 存较大的一半。插入时先入一个堆再倒手，最后平衡两堆大小，使 `small` 至多比 `large` 多 1 个。取中位数看两堆大小。插入 O(log n)，查询 O(1)。华为云监控、5G 网络指标的实时分位数统计常用类似思路。

**Python：**
```python
import heapq

class MedianFinder:
    def __init__(self) -> None:
        self.small: list[int] = []  # 大顶堆（存负值）
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
  private nums: number[] = []; // 无内置堆时用有序数组 + 二分插入

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

**Java：**
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

**要点：**
- 双堆平衡：插入 O(log n)，取中位数 O(1)。
- 关键不变量：`small` 的大小等于或比 `large` 多 1。
- 无堆库时可用有序数组 + 二分插入，插入退化为 O(n)。

**标签：** #algorithm

---

### 31. 最接近原点的 K 个点（K Closest Points to Origin）

**难度：** 中等
**主题：** heap, sorting, geometry
**岗位：** OD / SWE（部分嵌入式/网络方向）
**级别：** 15-16（高级）

**问题：** 给定平面上的一组点，返回距离原点最近的 K 个点（欧氏距离）。

**思路：** 维护一个大小为 K 的大顶堆（按距离平方比较，无需开方）。遍历所有点，堆未满则入堆，否则当前点比堆顶更近时替换堆顶。时间 O(n log k)，空间 O(k)。基站选址、IoT 设备就近接入等场景常做「Top-K 最近」查询。

**Python：**
```python
import heapq

def k_closest(points: list[list[int]], k: int) -> list[list[int]]:
    heap: list[tuple[int, list[int]]] = []
    for x, y in points:
        d = -(x * x + y * y)  # 取负模拟大顶堆
        if len(heap) < k:
            heapq.heappush(heap, (d, [x, y]))
        elif d > heap[0][0]:
            heapq.heapreplace(heap, (d, [x, y]))
    return [p for _, p in heap]
```

**TypeScript：**
```typescript
function kClosest(points: number[][], k: number): number[][] {
  // 无堆库时用排序，O(n log n)
  return points
    .slice()
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
    heap.add(p);
    if (heap.size() > k) heap.poll();
  }
  return heap.toArray(new int[0][]);
}
```

**要点：**
- 用距离平方比较，避免开方带来的精度与性能损耗。
- 大小为 K 的大顶堆将复杂度降到 O(n log k)，优于全排序的 O(n log n)。
- Quickselect 可做到平均 O(n)。

**标签：** #algorithm

---

## 栈 / 队列

### 32. 有效的括号（Valid Parentheses）

**难度：** 简单
**主题：** string, stack
**岗位：** OD / SWE
**级别：** 13-14（初级）

**问题：** 给定只含 `()[]{}` 的字符串，判断括号是否有效匹配且正确嵌套。

**思路：** 左括号入栈；遇到右括号则弹出比较。只有当每个右括号都匹配栈顶、且最终栈为空时才有效。时间 O(n)，空间 O(n)。

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

**要点：**
- 栈刻画嵌套关系，时间和空间均为 O(n)。
- 最后必须检查栈为空，而不仅是逐字符匹配。

**追问：**
- 返回使字符串有效所需的最少插入数。
- 最长有效括号子串（DP / 下标栈）。
- 支持运行时定义的任意括号类型。
- 流式输入、内存受限下做校验。

**标签：** #algorithm

---

### 33. 最小栈（Min Stack）

**难度：** 简单
**主题：** stack, design
**岗位：** OD / SWE（部分嵌入式/网络方向）
**级别：** 13-14（初级）

**问题：** 设计一个栈，支持 push、pop、top，并能在 O(1) 时间返回当前栈内最小元素。

**思路：** 每个栈元素同时记录「入栈时的当前最小值」，即存 `(值, 到此为止的最小值)`。push 时用新值与旧栈顶的最小值取较小者，pop 直接弹出。所有操作 O(1)，空间 O(n)。这类「附带聚合信息」的栈在解析器、撤销栈、监控滑窗中很常见。

**Python：**
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
  pop(): void { this.stack.pop(); }
  top(): number { return this.stack[this.stack.length - 1][0]; }
  getMin(): number { return this.stack[this.stack.length - 1][1]; }
}
```

**Java：**
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

**要点：**
- 每个元素随身携带前缀最小值，保证 getMin 为 O(1)。
- 也可用双栈（一个数据栈、一个最小值栈）实现，思路等价。
- 全部操作均摊 O(1)，额外空间 O(n)。

**标签：** #algorithm

---

### 34. 每日温度（Daily Temperatures）

**难度：** 中等
**主题：** stack, monotonic-stack, array
**岗位：** OD / SWE（部分嵌入式/网络方向）
**级别：** 15-16（高级）

**问题：** 给定每日温度数组，返回一个数组，其中第 i 个元素表示第 i 天之后要过几天才会遇到更高的温度；若之后不再升高则为 0。

**思路：** 单调递减栈存下标。遍历时，只要当前温度高于栈顶对应的温度，就弹栈并用「当前下标 − 弹出下标」填结果。每个下标最多进出栈一次，时间 O(n)，空间 O(n)。这是「下一个更大元素」的经典模板，广泛用于告警去抖、指标趋势分析。

**Python：**
```python
def daily_temperatures(temps: list[int]) -> list[int]:
    res = [0] * len(temps)
    stack: list[int] = []  # 存下标，对应温度单调递减
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
- 单调栈存下标而非数值，便于计算距离。
- 每个下标只进出栈一次，摊还 O(n)。
- 这是「下一个更大元素」问题的通用模板。

**标签：** #algorithm

---

## 哈希表

### 35. 两数之和（Two Sum）

**难度：** 简单
**主题：** array, hash-table
**岗位：** OD / SWE
**级别：** 13-14（初级）

**问题：** 给定整数数组 `nums` 和目标值，返回相加等于目标值的两个数的下标。恰好存在一个解；同一元素不可使用两次。

**思路：** 一次遍历，维护"值 → 下标"哈希表。对每个元素检查 `target - x` 是否已出现；若出现则返回两个下标。时间 O(n)，空间 O(n)——典型的机试热身题。

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
    if (seen.containsKey(need)) return new int[] { seen.get(need), i };
    seen.put(nums[i], i);
  }
  return new int[0];
}
```

**要点：**
- 单次遍历加哈希表，时间 O(n)、空间 O(n)，优于 O(n^2) 暴力。
- 检查之后再存入当前值，避免把元素与自身配对。

**追问：**
- 返回所有相加等于目标值的不重复数对（排序 + 双指针）。
- 输入已排序——用双指针 O(1) 额外空间求解。
- 3Sum / 4Sum 的推广。
- 数字流——设计在线的 `add`/`find` 结构。

**标签：** #algorithm

---

### 36. 有效的字母异位词（Valid Anagram）

**难度：** 简单
**主题：** string, hash-table, counting
**岗位：** OD / SWE
**级别：** 13-14（初级）

**问题：** 给定两个字符串，判断其中一个是否是另一个的字母异位词。

**思路：** 统计第一个串的字符频次，用第二个串递减，验证所有计数归零。时间 O(n)，固定字母表下空间 O(1)。

**Python：**
```python
from collections import Counter

def is_anagram(s: str, t: str) -> bool:
    if len(s) != len(t):
        return False
    return Counter(s) == Counter(t)
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
- 频次统计时间 O(n)；26 槽数组空间 O(1)。
- 长度不等可立即否定。

**追问：**
- 支持完整 Unicode，而非仅小写 a–z。
- 把所有异位词分组（见下一题）。
- 在 `s` 中找出 `p` 的所有异位词起始下标（滑动窗口）。
- 忽略大小写与空白做比较。

**标签：** #algorithm

---

### 37. 字母异位词分组（Group Anagrams）

**难度：** 中等
**主题：** string, hash-table, sorting
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 将单词列表分组，使互为异位词的单词落入同一组。

**思路：** 为每个单词生成规范化键——排序后的字母，或 26 位计数签名——按该键在哈希表中分桶。用排序键时时间 O(n·k log k)（k 为词长），空间 O(n·k)。

**Python：**
```python
from collections import defaultdict

def group_anagrams(words: list[str]) -> list[list[str]]:
    groups: dict[str, list[str]] = defaultdict(list)
    for w in words:
        groups["".join(sorted(w))].append(w)
    return list(groups.values())
```

**TypeScript：**
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

**Java：**
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

**要点：**
- 排序键每词 O(k log k)，总体 O(n·k log k)。
- 用计数签名键可把每词成本降到 O(k)，总体 O(n·k)。

**追问：**
- 改用计数签名键去掉 log 因子。
- 流式处理单词并增量输出分组。
- 忽略大小写与空格按异位词类分组。
- 按组大小排序返回。

**标签：** #algorithm

---

### 38. 无重复字符的最长子串（Longest Substring Without Repeating Characters）

**难度：** 中等
**主题：** string, sliding-window, hash-table
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 求无重复字符的最长子串长度。

**思路：** 滑动窗口加"字符 → 最后下标"映射。当重复落在窗口内时，把左边界跳到其之后。时间 O(n)，空间 O(min(n, 字母表))。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 每个下标进出窗口各一次，时间 O(n)。
- 将 `start` 跳过上次出现位置，避免重新扫描窗口。

**标签：** #algorithm

---

### 39. 最小覆盖子串（Minimum Window Substring）

**难度：** 困难
**主题：** string, sliding-window, hash-table
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 给定字符串 `s` 和 `t`，返回 `s` 中包含 `t` 全部字符（含重数）的最小子串，不存在则返回 ""。

**思路：** 扩张窗口直到满足全部所需计数，再从左收缩同时保持有效，并记录最小有效窗口。时间 O(n + m)，空间 O(字母表)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 两个指针各至多前进 n 次，时间 O(n + m)。
- `missing` 让窗口有效性判断为 O(1)，无需逐一比较映射。

**标签：** #algorithm

---

### 40. 最长连续序列（Longest Consecutive Sequence）

**难度：** 中等
**主题：** hash-table, array, union-find
**岗位：** OD / SWE（部分嵌入式/网络方向）
**级别：** 15-16（高级）

**问题：** 给定一个未排序的整数数组，返回最长连续元素序列的长度，要求时间复杂度 O(n)。

**思路：** 全部放入哈希集合。只从「序列起点」（即 `n-1` 不在集合中的数）向后数连续元素，累计长度。每个数至多被访问两次，时间 O(n)，空间 O(n)。相比先排序的 O(n log n)，哈希法是华为机试追求线性复杂度时的标准解。

**Python：**
```python
def longest_consecutive(nums: list[int]) -> int:
    num_set = set(nums)
    best = 0
    for n in num_set:
        if n - 1 not in num_set:  # 仅从序列起点开始数
            length = 1
            while n + length in num_set:
                length += 1
            best = max(best, length)
    return best
```

**TypeScript：**
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

**Java：**
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

**要点：**
- 只从序列起点扩展，保证整体 O(n) 而非 O(n^2)。
- 哈希集合把「是否存在某值」降到 O(1)。
- 用集合天然去重，重复元素不影响结果。

**标签：** #algorithm

---

### 41. 和为 K 的子数组（Subarray Sum Equals K）

**难度：** 中等
**主题：** hash-table, prefix-sum, array
**岗位：** OD / SWE（部分嵌入式/网络方向）
**级别：** 15-16（高级）

**问题：** 给定整数数组和整数 K，返回和恰好为 K 的连续子数组的个数（数组可能含负数）。

**思路：** 前缀和 + 哈希表。遍历时维护当前前缀和 `prefix`，若之前出现过 `prefix - k`，则以当前位置结尾的合法子数组数量就是该前缀和出现的次数。用哈希表记录各前缀和出现次数，初始放入 `{0: 1}`。时间 O(n)，空间 O(n)。含负数时不能用滑动窗口，这是常见考点。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 前缀和之差等于子数组和，哈希表记录前缀和频次实现 O(n)。
- 初始 `{0: 1}` 用于处理从下标 0 开始的子数组。
- 数组含负数时滑动窗口失效，必须用前缀和 + 哈希。

**标签：** #algorithm

---

## 二分查找

### 42. 搜索二维矩阵（Search a 2D Matrix）

**难度：** 中等
**主题：** binary-search, matrix, array
**岗位：** OD / SWE（部分嵌入式/网络方向）
**级别：** 15-16（高级）

**问题：** 给定一个每行升序、且每行首元素大于上一行末元素的 m×n 矩阵，判断目标值是否存在。

**思路：** 由于展平后整体有序，可把二维坐标映射为一维下标做二分：下标 `mid` 对应元素 `matrix[mid // cols][mid % cols]`。时间 O(log(m·n))，空间 O(1)。相比逐行二分（O(m log n)）更优，是排序表/索引查找的通用技巧。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 把矩阵视为展平的有序数组，用 `mid / cols` 与 `mid % cols` 换算坐标。
- 时间 O(log(m·n))，优于逐行二分。
- Java 用 `>>>` 无符号右移可避免大下标相加溢出。

**标签：** #algorithm

---

### 43. 寻找旋转排序数组中的最小值（Find Minimum in Rotated Sorted Array）

**难度：** 中等
**主题：** binary-search, array
**岗位：** OD / SWE（部分嵌入式/网络方向）
**级别：** 15-16（高级）

**问题：** 一个升序数组在某个未知点被旋转（元素互不相同），找出其中的最小值。

**思路：** 二分时用中点与右端点比较：若 `nums[mid] > nums[hi]`，最小值一定在右半部分（`lo = mid + 1`）；否则最小值在左半部分含 `mid`（`hi = mid`）。循环到 `lo == hi` 即为答案。时间 O(log n)，空间 O(1)。与右端点比较可正确处理未旋转的情形。

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
    if (nums[mid] > nums[hi]) lo = mid + 1; else hi = mid;
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
    if (nums[mid] > nums[hi]) lo = mid + 1; else hi = mid;
  }
  return nums[lo];
}
```

**要点：**
- 与右端点比较，而非左端点，才能正确判断最小值所在的半区。
- 循环条件用 `lo < hi`，收敛到唯一位置，避免死循环。
- 时间 O(log n)，空间 O(1)。

**标签：** #algorithm

---

### 44. 爱吃香蕉的珂珂（Koko Eating Bananas）

**难度：** 中等
**主题：** binary-search, search-on-answer, greedy
**岗位：** OD / SWE（部分嵌入式/网络方向）
**级别：** 15-16（高级）

**问题：** 有若干堆香蕉，第 i 堆有 `piles[i]` 根。珂珂每小时选一堆，以速度 k 根/小时吃，吃不完整堆则本小时结束；一堆吃完不足一小时也占用整小时。给定总时长 h 小时，求能在 h 小时内吃完的最小速度 k。

**思路：** 「对答案二分」。速度越大耗时越少，具单调性。在 `[1, max(piles)]` 上二分速度 k，用 `ceil(pile / k)` 累计总小时数，若 ≤ h 则尝试更小的 k，否则增大 k。时间 O(n·log(max))，空间 O(1)。这类「限时选最小速率」正是华为链路带宽/限流阈值整定的典型模型。

**Python：**
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

**TypeScript：**
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

**Java：**
```java
int minEatingSpeed(int[] piles, int h) {
  int lo = 1, hi = 0;
  for (int p : piles) hi = Math.max(hi, p);
  while (lo < hi) {
    int mid = (lo + hi) >>> 1;
    long hours = 0;
    for (int p : piles) hours += (p + mid - 1) / mid;  // 向上取整
    if (hours <= h) hi = mid; else lo = mid + 1;
  }
  return lo;
}
```

**要点：**
- 对答案二分：可行速度关于时长单调，故可二分。
- 上界取 `max(piles)`（每小时一堆），下界取 1。
- 向上取整用 `(p + k - 1) / k`，避免浮点误差；Java 累加用 long 防溢出。

**标签：** #algorithm

---

## 动态规划

### 45. 买卖股票的最佳时机（Best Time to Buy and Sell Stock）

**难度：** 简单
**主题：** array, dynamic-programming
**岗位：** OD / SWE
**级别：** 13-14（初级）

**问题：** 给定每日价格，求一次买入、之后卖出的最大利润；无利润则返回 0。

**思路：** 维护至今的最低价；每天用当前价减去最低价求利润并取最优。时间 O(n)，空间 O(1)。

**Python：**
```python
def max_profit(prices: list[int]) -> int:
    best, lo = 0, float("inf")
    for p in prices:
        lo = min(lo, p)
        best = max(best, p - lo)
    return best
```

**TypeScript：**
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

**Java：**
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

**要点：**
- 单次遍历追踪运行最小值，时间 O(n)、空间 O(1)。
- 买必须在卖之前，而"运行最小值"不变式恰好保证了这一点。

**追问：**
- 无限次交易（累加所有正的差值）。
- 至多 k 次交易（DP，O(nk)）。
- 加入手续费或冷冻期。
- 返回实际的买入/卖出日下标。

**标签：** #algorithm

---

### 46. 最大子数组和（Kadane）

**难度：** 中等
**主题：** array, dynamic-programming
**岗位：** OD / SWE
**级别：** 13-14（初级）

**问题：** 找出和最大的连续子数组并返回该和。

**思路：** Kadane 算法——维护运行和；当延续会使其变小时就重置为当前元素。同时记录全局最优。时间 O(n)，空间 O(1)。

**Python：**
```python
def max_sub_array(nums: list[int]) -> int:
    cur = best = nums[0]
    for x in nums[1:]:
        cur = max(x, cur + x)
        best = max(best, cur)
    return best
```

**TypeScript：**
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

**Java：**
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

**要点：**
- Kadane 时间 O(n)、空间 O(1)。
- 用首元素初始化，使全负数组也能返回最大的单个值。

**追问：**
- 返回子数组边界，而不仅是和。
- 最大乘积子数组（同时追踪最小、最大）。
- 最大环形子数组和。
- 分治 O(n log n) 解法以及为何 Kadane 更优。

**标签：** #algorithm

---

### 47. 爬楼梯（Climbing Stairs）

**难度：** 简单
**主题：** dynamic-programming
**岗位：** OD / SWE
**级别：** 13-14（初级）

**问题：** 每次可爬 1 或 2 级台阶。爬 `n` 级有多少种不同方法？

**思路：** 斐波那契递推 `f(n) = f(n-1) + f(n-2)`。滚动两个变量避免数组。时间 O(n)，空间 O(1)。

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
  for (int i = 0; i < n; i++) {
    int t = a + b; a = b; b = t;
  }
  return a;
}
```

**要点：**
- 滚动两个变量，时间 O(n)、空间 O(1)。
- 本质是斐波那契；识别出递推即是全部要点。

**追问：**
- 每步可走 1、2 或 3 级。
- 每级有代价——最小化总代价（最小花费爬楼梯）。
- 对大 n 取模 1e9+7 计数。
- 用矩阵快速幂做到 O(log n)。

**标签：** #algorithm

---

### 48. 零钱兑换（Coin Change）

**难度：** 中等
**主题：** dynamic-programming
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 给定硬币面额和金额，返回凑出该金额的最少硬币数，不可能则返回 -1。

**思路：** 自底向上 DP，`dp[a]` 为金额 `a` 的最少硬币数；对每个硬币做松弛。时间 O(金额·硬币数)，空间 O(金额)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- DP 表时间 O(金额·硬币数)、空间 O(金额)。
- 用 `amount + 1` 初始化充当无穷大，使不可达金额保持 -1。

**标签：** #algorithm

---

### 49. 最长递增子序列（Longest Increasing Subsequence）

**难度：** 中等
**主题：** dynamic-programming, binary-search
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 求最长严格递增子序列的长度。

**思路：** 耐心排序——维护 `tails`，`tails[i]` 为长度 `i+1` 的递增子序列可能的最小尾值；对每个元素二分查找插入位置。时间 O(n log n)，空间 O(n)。

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
    tails[lo] = x;
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
- 每个元素二分查找，时间 O(n log n)、空间 O(n)，优于 O(n^2) DP。
- `tails` 并非真正的子序列，但其长度等于答案。

**标签：** #algorithm

---

### 50. 打家劫舍（House Robber）

**难度：** 中等
**主题：** dynamic-programming
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 给定一排房屋的金额，在不偷相邻两户的前提下最大化收益。

**思路：** DP 递推 `rob(i) = max(rob(i-1), rob(i-2) + nums[i])`，滚动为两个变量。时间 O(n)，空间 O(1)。

**Python：**
```python
def rob(nums: list[int]) -> int:
    prev, cur = 0, 0
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
- 滚动两个状态变量，时间 O(n)、空间 O(1)。
- 每户的选择是"偷并跳过邻居"还是"跳过"。

**标签：** #algorithm

---

### 51. 单词拆分（Word Break）

**难度：** 中等
**主题：** dynamic-programming, string
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 给定字符串和字典，判断字符串能否切分为字典中单词的序列。

**思路：** DP，`dp[i]` 表示长度为 `i` 的前缀可切分；对每个 `i` 尝试每个切点 `j`，要求 `dp[j]` 为真且 `s[j:i]` 在集合中。时间 O(n^2)（外加子串成本），空间 O(n)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 嵌套循环给出 O(n^2) 个切分、O(n) 空间。
- 用字典树或以最长单词长度限制内层，可削减冗余检查。

**标签：** #algorithm

---

### 52. 编辑距离（Edit Distance）

**难度：** 中等
**主题：** dynamic-programming, string
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 给定两个字符串，返回将第一个转换成第二个所需的最少插入、删除或替换操作数。

**思路：** 二维 DP，`dp[i][j]` 表示 `a` 前 `i` 个字符与 `b` 前 `j` 个字符的编辑距离；字符相等则继承对角线，否则取三个邻居的最小值加一。时间 O(m·n)，空间 O(m·n)。华为在 diff/补丁工具与日志模糊匹配中使用同一递推。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 三种转移分别对应删除（`dp[i-1][j]`）、插入（`dp[i][j-1]`）、替换（`dp[i-1][j-1]`）。
- 首行首列表示与空串互转的代价。
- 用滚动行可将空间降到 O(n)。

**标签：** #algorithm

---

### 53. 不同路径（Unique Paths）

**难度：** 中等
**主题：** dynamic-programming, combinatorics
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** m x n 网格上的机器人从左上角出发，只能向右或向下移动，求到达右下角的不同路径数。

**思路：** `dp[i][j]` 为到达 (i, j) 的路径数 = 上方路径数 + 左侧路径数。压缩为一行并从左到右更新。时间 O(m·n)，空间 O(n)。

**Python：**
```python
def unique_paths(m: int, n: int) -> int:
    dp = [1] * n
    for _ in range(1, m):
        for j in range(1, n):
            dp[j] += dp[j - 1]
    return dp[n - 1]
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
- 首行首列全为 1，因为沿边只有一条路径。
- 滚动数组中 `dp[j-1]` 是本行已更新值，`dp[j]` 是上一行旧值。
- 组合数公式 C(m+n-2, m-1) 也可行，但需注意溢出。

**标签：** #algorithm

---

### 54. 最长公共子序列（Longest Common Subsequence）

**难度：** 中等
**主题：** dynamic-programming, string
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 给定两个字符串，返回最长公共子序列的长度（字符保持相对顺序但不要求连续）。

**思路：** `dp[i][j]` 为 `a` 前 `i` 个字符与 `b` 前 `j` 个字符的 LCS；当前字符相等则对角线加一，否则取丢弃任一字符中的较大者。时间 O(m·n)，空间 O(m·n)。它是 diff 与版本合并算法的核心。

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
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
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
- 匹配时延伸对角线；不匹配时从任一字符串丢弃一个字符。
- 与需连续、遇不匹配即归零的最长公共子串不同。
- 沿表格回溯可还原具体子序列。

**标签：** #algorithm

---

### 55. 分割等和子集（Partition Equal Subset Sum）

**难度：** 中等
**主题：** dynamic-programming, knapsack
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 判断正整数数组能否分成两个和相等的子集。

**思路：** 总和为奇数则不可能；否则化为 0/1 背包：是否存在子集之和等于 `total/2`。用布尔 DP 记录可达和，遍历每个数并从高到低扫描以保证每个元素只用一次。时间 O(n·target)，空间 O(target)。这种子集均衡模式对应电信线卡间的负载均衡。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 内层逆序遍历避免重复使用同一元素（0/1 背包而非完全背包）。
- `dp[0] = true` 表示空子集。
- 总和为奇数可直接返回 false。

**标签：** #algorithm

---

## 回溯

### 56. 单词搜索（Word Search）

**难度：** 中等
**主题：** backtracking, dfs, grid
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 给定字母网格和一个单词，判断能否由相邻格子（不重复使用同一格）拼出该单词。

**思路：** 从每个格子做 DFS 回溯，递归期间标记格子已访问，返回时还原。最坏时间 O(行·列·4^L)，空间 O(L)。

**Python：**
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

**要点：**
- 回溯最多探索 O(行·列·4^L) 条路径；递归深度 O(L)。
- 标记并还原格子，无需额外内存即可保证不重复使用。

**标签：** #algorithm

---

### 57. 组合总和（Combination Sum）

**难度：** 中等
**主题：** backtracking, recursion
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 给定互异正整数候选和目标值，返回所有和为目标值的不重复组合；每个候选可重复使用。

**思路：** DFS 回溯；每步可重复使用当前候选，或前移起始下标以避免排列重复。最坏时间 O(2^t)，递归深度空间 O(t)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 回溯最多探索 O(2^t) 个状态；路径深度 O(t)。
- 传入 `i`（而非 `i+1`）允许重复使用；前移起始下标避免重复集合。

**标签：** #algorithm

---

### 58. 全排列（Permutations）

**难度：** 中等
**主题：** backtracking, recursion
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 返回一组互异整数的所有排列。

**思路：** 用 used 标记（或原地交换）回溯；每层固定一个元素。时间 O(n·n!)，空间 O(n)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 共有 n! 个排列，每个复制 O(n)，故时间 O(n·n!)、额外空间 O(n)。
- `used` 数组防止在一个排列内重复使用某元素。

**标签：** #algorithm

---

### 59. 子集（Subsets）

**难度：** 中等
**主题：** backtracking, bit-manipulation
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 返回一组互异整数的所有子集（幂集）。

**思路：** 回溯在每个节点记录当前路径，并通过递增起始下标在"选/不选"间分支。时间 O(n·2^n)，空间 O(n)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 共有 2^n 个子集，每个复制至多 O(n)：时间 O(n·2^n)。
- 等价做法是把每个子集映射为一个 n 位掩码。

**标签：** #algorithm

---

### 60. 括号生成（Generate Parentheses）

**难度：** 中等
**主题：** backtracking, string
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 给定 n 对括号，生成所有合法的括号组合。

**思路：** 回溯时跟踪已用的左、右括号数量。左括号数 < n 时可加 `(`；右括号数 < 左括号数时才可加 `)`，从而无需额外校验即保证合法。时间 O(4^n / sqrt(n))（第 n 个卡特兰数），空间 O(n) 递归深度。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- `close < open` 的剪枝保证只在合法前缀上继续搜索。
- 结果数量等于第 n 个卡特兰数。
- 字符串不可变天然实现回退；用字符缓冲可避免每次复制。

**标签：** #algorithm

---

### 61. N 皇后（N-Queens）

**难度：** 困难
**主题：** backtracking, recursion
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 统计在 n x n 棋盘上放置 n 个皇后且互不攻击的不同方案数。

**思路：** 每行放一个皇后，逐列回溯。用哈希集合记录已占用的列以及两条对角线（`row - col` 与 `row + col`），使每次放置判断为 O(1)。时间 O(n!)，空间 O(n)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 每行一个皇后消除了整整一维搜索空间。
- 同一主对角线上 `row - col` 恒定，副对角线上 `row + col` 恒定。
- 递归返回后必须对称地撤销每次加入。

**标签：** #algorithm

---

## 双指针 / 滑动窗口

### 62. 接雨水（Trapping Rain Water）

**难度：** 困难
**主题：** two-pointers, array
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 给定以柱高表示的高程图，计算下雨后能接住多少水。

**思路：** 双指针从两端向内，维护 `leftMax` 与 `rightMax`。较矮的一侧决定该指针处的水量，因此移动较低的一侧并在此累加 `max - height`。时间 O(n)，空间 O(1)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 某柱上方的水量等于 min(leftMax, rightMax) - height。
- 移动较低一侧是安全的，因为其最大值才是约束条件。
- 双指针写法省去了前缀最大值数组的 O(n) 空间。

**标签：** #algorithm

---

### 63. 滑动窗口最大值（Sliding Window Maximum）

**难度：** 困难
**主题：** sliding-window, monotonic-deque
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 给定数组和窗口大小 k，当窗口从左到右滑动时，返回每个窗口内的最大值。

**思路：** 维护一个索引单调递减的双端队列。入队前弹出队尾较小的值（在新元素存在期间它们不可能成为最大值）；当队首滑出窗口时弹出队首。队首始终是当前窗口最大值。每个索引入队出队各一次，时间 O(n)，空间 O(k)。可用于网络链路的滚动峰值吞吐监控。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 队列存索引而非数值，便于判断队首是否过期。
- 队列保持单调递减，因此队首即窗口最大值。
- 均摊 O(n)：每个索引最多入队、出队各一次。

**标签：** #algorithm

---

### 64. 找到字符串中所有字母异位词（Find All Anagrams in a String）

**难度：** 中等
**主题：** sliding-window, hash-table
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 给定字符串 s 和 p，返回 s 中所有为 p 的字母异位词的子串的起始索引。

**思路：** 在 s 上用长度为 `len(p)` 的定长滑动窗口，配两个长度 26 的频次数组。滑动时加入新字符、移除旧字符；当窗口频次与 p 相同即记录起始索引。时间 O(n)，空间 O(1)（26 个计数器）。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 判断异位词等价于比较字符频次数组是否相等。
- 定长窗口每步仅一次加入与一次移除，无需重新扫描。
- 比较长度 26 的数组是 O(1)，全程保持 O(n)。

**标签：** #algorithm

---

## 数组 / 字符串

### 65. 二分查找（Binary Search）

**难度：** 简单
**主题：** binary-search, array
**岗位：** OD / SWE
**级别：** 13-14（初级）

**问题：** 给定有序数组和目标值，返回其下标，不存在则返回 -1。

**思路：** 维护 `[lo, hi]` 边界，探测中点，每步将范围减半。用 `lo + (hi - lo) // 2` 避免溢出（C/C++ 中尤为重要）。时间 O(log n)，空间 O(1)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 每步减半范围，时间 O(log n)、空间 O(1)。
- `lo + (hi - lo) / 2` 可避免 `(lo + hi) / 2` 在 C/C++/Java 中的整数溢出。

**追问：**
- 返回最左/最右插入位置（下界/上界）。
- 在旋转有序数组中查找。
- 在无限/无界有序流中查找某值。
- 用递归实现并讨论栈使用。

**标签：** #algorithm

---

### 66. 盛最多水的容器（Container With Most Water）

**难度：** 中等
**主题：** array, two-pointer, greedy
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 给定高度数组，选两条线与 x 轴构成容器使盛水最多，返回最大面积。

**思路：** 双指针位于两端；面积为 `min(h[l], h[r]) * (r - l)`。每次移动较矮的一侧，因为它限制了面积。时间 O(n)，空间 O(1)。

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
- 双指针扫描时间 O(n)、空间 O(1)，优于 O(n^2) 暴力。
- 移动较高一侧绝不会增大面积，因此总是移动较矮一侧。

**标签：** #algorithm

---

### 67. 三数之和（3Sum）

**难度：** 中等
**主题：** array, two-pointer, sorting
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 找出数组中所有和为零的不重复三元组。

**思路：** 排序后固定一个下标，对其余部分做双指针扫描，并在每层跳过重复。时间 O(n^2)，除输出外空间 O(1)。

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
- 排序加双指针扫描时间 O(n^2)、额外空间 O(1)。
- 在每层跳过重复值是保证三元组不重复的关键。

**标签：** #algorithm

---

### 68. 除自身以外数组的乘积（Product of Array Except Self）

**难度：** 中等
**主题：** array, prefix-product
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 返回一个数组，其中每个元素是其余所有元素之积，不用除法且 O(n)。

**思路：** 两次遍历——先从左到右存前缀积，再从右到左用一个运行变量乘上后缀积。时间 O(n)，额外空间 O(1)（不计输出）。

**Python：**
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

**TypeScript：**
```typescript
function productExceptSelf(nums: number[]): number[] {
  const n = nums.length, out = new Array(n).fill(1);
  for (let i = 1; i < n; i++) out[i] = out[i - 1] * nums[i - 1];
  let suffix = 1;
  for (let i = n - 1; i >= 0; i--) { out[i] *= suffix; suffix *= nums[i]; }
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
  int suffix = 1;
  for (int i = n - 1; i >= 0; i--) { out[i] *= suffix; suffix *= nums[i]; }
  return out;
}
```

**要点：**
- 两次线性遍历，时间 O(n)、额外空间 O(1)。
- 不用除法，使其对输入中的零也稳健。

**标签：** #algorithm

---

### 69. 搜索旋转排序数组（Search in Rotated Sorted Array）

**难度：** 中等
**主题：** binary-search, array
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 一个有序数组在未知支点处被旋转。找目标值下标，不存在则返回 -1。

**思路：** 改进的二分查找——每个中点处必有一半是有序的；判断目标是否落在那半有序区间内来选择方向。时间 O(log n)，空间 O(1)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 尽管发生旋转，仍是 O(log n) 时间、O(1) 空间。
- 先判断哪半有序，再用该半的边界检验目标。

**标签：** #algorithm

---

### 70. 在排序数组中查找元素的首末位置（Find First and Last Position of Element）

**难度：** 中等
**主题：** binary-search, array
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 在有序数组中找目标的首、末下标，不存在则返回 `[-1, -1]`。

**思路：** 两次二分查找分别求目标的下界与上界。时间 O(log n)，空间 O(1)。

**Python：**
```python
import bisect

def search_range(nums: list[int], target: int) -> list[int]:
    lo = bisect.bisect_left(nums, target)
    if lo == len(nums) or nums[lo] != target:
        return [-1, -1]
    hi = bisect.bisect_right(nums, target) - 1
    return [lo, hi]
```

**TypeScript：**
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

**Java：**
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

**要点：**
- 两次有界二分，时间 O(log n)、空间 O(1)。
- 下界与上界仅在相等时指针移动方向不同。

**标签：** #algorithm

---

### 71. 合并区间（Merge Intervals）

**难度：** 中等
**主题：** intervals, sorting
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 给定若干区间，合并所有重叠的区间。

**思路：** 按起点排序；扫描时若下一区间与上一已合并区间重叠则扩展其终点，否则新增。时间 O(n log n)，空间 O(n)。

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
    const last = out[out.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else out.push([s, e]);
  }
  return out;
}
```

**Java：**
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

**要点：**
- 排序占主导，时间 O(n log n)；输出 O(n) 空间。
- 排序后，重叠就是简单的 `start <= last_end` 判断。

**标签：** #algorithm

---

### 72. 只出现一次的数字（Single Number）

**难度：** 简单
**主题：** bit-manipulation, array
**岗位：** OD / SWE
**级别：** 13-14（初级）

**问题：** 除一个元素外其余都出现两次。在 O(n) 时间、O(1) 空间内找出那个唯一的数。

**思路：** 对所有元素求 XOR；成对的相消为 0，留下唯一值。时间 O(n)，空间 O(1)。

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
- XOR 满足结合律且自反，时间 O(n)、空间 O(1)。
- 无需哈希集合或排序——纯位运算。

**标签：** #algorithm

---

### 73. 基站覆盖合并（电信）（Base-Station Coverage Merge）

**难度：** 中等
**主题：** intervals, sorting, greedy
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 每个基站覆盖一条公路的一维区段 `[start, end]`。给定所有覆盖区段，将其合并为最少的连续覆盖范围集合，并报告总覆盖长度（用于检测覆盖空隙）。

**思路：** 这是合并区间的电信包装。按起点排序区段，扫描合并重叠，并累加合并后的长度。时间 O(n log n)，空间 O(n)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 排序加一次线性扫描，时间 O(n log n)、空间 O(n)。
- 空隙表现为合并范围之间的断裂——正是覆盖缺失之处。

**标签：** #algorithm

---

### 74. 5G 资源块分配（区间调度）（5G Resource-Block Allocation）

**难度：** 中等
**主题：** greedy, intervals, activity-selection
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 一个 5G 载波每个时隙仅有一个资源块。给定若干传输请求，每个为 `[start, end]`，在该单一资源块上调度最多数量的互不重叠传输。

**思路：** 经典活动选择——按结束时间排序请求，贪心选取每个起点 ≥ 上一所选结束时间的请求。时间 O(n log n)，空间 O(1)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 按结束时间排序再贪心选取，时间 O(n log n)、额外空间 O(1)。
- 选最早结束的请求为其余留出最多空间——这正是其最优性的交换论证。

**标签：** #algorithm

---

### 75. 移动零（Move Zeroes）

**难度：** 简单
**主题：** array, two-pointers, in-place
**岗位：** OD / SWE
**级别：** 13-14（初级）

**问题：** 给定整数数组 `nums`，将所有 `0` 移动到末尾，同时保持非零元素的相对顺序。要求原地操作，不复制数组。

**思路：** 用写指针 `j` 指向下一个非零元素应放的位置。用 `i` 遍历；当 `nums[i]` 非零时，把它交换到位置 `j` 并前移 `j`。这样非零元素保持顺序，零自然被推到末尾。时间 O(n)，空间 O(1)——典型的机试指针操作热身题。

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
      int tmp = nums[j]; nums[j] = nums[i]; nums[i] = tmp;
      j++;
    }
  }
}
```

**要点：**
- 写指针 `j` 记录已见到的非零元素数量，交换操作保持相对顺序。
- 单次遍历、O(1) 额外空间；用交换（而非仅覆盖）避免再扫一遍补零。

**标签：** #algorithm

---

### 76. 颜色分类（Sort Colors）

**难度：** 中等
**主题：** array, two-pointers, sorting
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 给定一个只含 0、1、2 三种元素的数组（分别代表红、白、蓝），原地对其排序，使相同颜色相邻且按红、白、蓝顺序排列，不使用库排序函数。

**思路：** 荷兰国旗问题，三指针一趟扫描。`low` 指向下一个 0 应放的位置，`high` 指向下一个 2 应放的位置，`i` 为当前遍历指针。遇 0 与 `low` 交换并双双右移；遇 2 与 `high` 交换并 `high` 左移（`i` 不动，需重新检查换来的值）；遇 1 则 `i` 右移。时间 O(n)，空间 O(1)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 换来 2 时 `i` 不能右移，必须重新检查交换过来的值。
- 循环条件 `i <= high`，越过 `high` 的元素已就位。
- 一趟扫描、常数空间，优于两趟计数法。

**标签：** #algorithm

---

### 77. 最长回文子串（Longest Palindromic Substring）

**难度：** 中等
**主题：** string, two-pointers, dynamic-programming
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 给定字符串 `s`，返回 `s` 中最长的连续回文子串。

**思路：** 中心扩展：每个回文都有一个中心，或为单个字符（奇数长度），或为两字符之间的间隙（偶数长度）。对 `2n-1` 个中心逐一向外扩展，字符匹配则继续，并记录最宽的区间。时间 O(n^2)，空间 O(1)——比 Manacher 的 O(n) 简单，且足以应对面试输入规模。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 同时检查奇数中心（`i, i`）与偶数中心（`i, i+1`），覆盖所有回文。
- 循环结束时 `expand` 向两侧各多扩了一格，故有效区间为 `[l+1, r-1]`。

**标签：** #algorithm

---

## 系统设计

### 78. 设计电信计费系统

**难度：** 困难
**主题：** system-design, billing, streaming, consistency
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 为数亿用户设计一个运营商级计费系统，计量通话、短信、流量使用并生成准确的月度账单。

**思路：** 使用事件（CDR——话单详单）从网元流入高吞吐摄入层（Kafka）。计费引擎对每个事件应用资费方案（按秒语音、按 MB 流量、促销）并将已定价事件写入按用户分区的用量存储。聚合管道把用量汇总到计费周期桶；周期结束时出账。关键权衡：精确一次 vs 至少一次加上对 CDR id 的幂等去重（重复扣费不可接受）；预付费的近实时余额（低延迟内存计数器加周期性对账）vs 后付费的批处理；可审计性（不可变事件日志，每笔扣费可追溯）。讨论迟到/乱序 CDR、资费版本管理，以及与网络自身计数器对账以发现收入流失。

**标签：** #system-design

---

### 79. 设计 HarmonyOS 分布式软总线 / 跨设备数据同步

**难度：** 困难
**主题：** system-design, distributed, sync, iot
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 设计 HarmonyOS 的分布式软总线，让多台附近设备（手机、平板、电视、手表）互相发现并共享状态/数据，仿佛是同一个逻辑设备。

**思路：** 分层：(1) 多传输（BLE、Wi-Fi、NFC）的设备发现，统一寻址；(2) 安全的会话/认证层（设备证书、信任环），只有用户自己的设备能加入；(3) 传输抽象的"软总线"，自动选择最优物理链路并隐藏切换（如随带宽需求增长从 BLE → Wi-Fi Direct）；(4) 分布式数据对象层，提供最终一致的共享状态及冲突解决。权衡：间歇连接下的一致性 vs 可用性（偏 AP，用 CRDT 或带向量时钟的最后写入获胜）；延迟 vs 功耗（BLE 低功耗但慢）；安全（每次跨设备调用都须认证并加密）。讨论无缝应用迁移（状态序列化并在目标设备重建）以及设备重新加入时的分区愈合。

**标签：** #system-design

---

### 80. 设计 5G 基站 OTA 固件升级系统

**难度：** 困难
**主题：** system-design, ota, rollout, reliability
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 设计一个系统，将空中（OTA）固件升级安全地推送到数百万个 5G 基站，且不中断在网运营商流量。

**思路：** 中央发布服务把已签名固件构件存于对象存储并经 CDN 分发；基站采取拉取（而非推送）以规避入站防火墙问题。分阶段灰度：金丝雀 → 小范围区域 → 渐进波次，波次之间设自动健康门禁（KPI：掉话率、吞吐、错误日志），出现回退则自动暂停/回滚。每个基站采用 A/B 分区方案——写入非活动槽位，校验校验和+签名，原子切换，看门狗在新镜像无法启动时自动回退到 A 槽。权衡：带宽 vs 速度（差分/增量升级减小载荷）、维护窗口 vs 持续服务（重启前把流量疏导到邻区）、安全（签名镜像、防回滚版本计数器）。讨论不稳定链路的幂等重试以及跟踪各基站状态的灰度看板。

**标签：** #system-design

---

### 81. 设计 CDN

**难度：** 困难
**主题：** system-design, cdn, caching, dns
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 设计一个内容分发网络，以低延迟向全球用户提供静态资源（及视频）。

**思路：** 边缘 PoP（接入点）层级，后接区域中间层缓存和源站。请求路由通过 anycast 或基于 DNS 的地理路由，把用户引导到最近的健康边缘。缓存策略：LRU/LFU 淘汰、TTL 加源站再校验（ETag / If-None-Match）、缓存键归一化。缓存未命中 → 从中间层 → 源站拉取（回源填充），并用请求合并防止冷门热点对象引发惊群。权衡：一致性 vs 新鲜度（TTL 调优、显式清除/失效 API）、存储成本 vs 命中率、缓存踩踏处理。讨论大文件/视频分片缓存（HLS/DASH 切片）、访问控制的签名 URL，以及流量峰值时保护源站的源站护盾。

**标签：** #system-design

---

### 82. 设计分布式消息队列

**难度：** 困难
**主题：** system-design, messaging, replication, ordering
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 设计一个类 Kafka 的分布式消息队列，支持高吞吐发布/订阅，并提供持久化与顺序保证。

**思路：** 主题拆分为分区；每个分区是仅追加日志，跨 broker 复制，含一个 leader 和若干 follower（ISR——同步副本集）。生产者追加到 leader；消费者跟踪自己的偏移量并拉取。仅保证分区内顺序。持久化通过复制因子和可配置的 acks（acks=all 等待 ISR）。权衡：吞吐 vs 持久化（acks 与 fsync 策略）、顺序 vs 并行（分区越多并行越高，但仅分区内有序）、至少一次 vs 精确一次（幂等生产者 + 事务提交）。讨论消费者组与再平衡、保留策略（按时间/大小的日志压缩）、背压，以及 leader 选举（经 ZooKeeper/Raft 等协调服务）如何处理 broker 故障。

**标签：** #system-design

---

### 83. 设计华为云对象存储（OBS）

**难度：** 困难
**主题：** system-design, blob-storage, erasure-coding, consistency
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 设计华为云 OBS——一个兼容 S3 的对象存储服务。

**思路：** 兼容 S3 的 API 前端 → 元数据服务（按 bucket+key 分片，区域内经共识组强一致）→ 存储层使用纠删码（如 Reed-Solomon 10+4）跨节点/机架/可用区条带化，以约 1.4 倍开销（相对 3 倍复制）获得持久性。大对象用分段上传；生命周期策略把冷数据降级到归档存储。权衡：纠删码（省存储，重构时 CPU/网络更高）vs 复制（更简单、读更快、成本更高）；跨区域复制的强一致 vs 最终一致（容灾用异步）。讨论热点键处理（CDN + 读副本）、应对位腐的后台巡检/修复、访问控制的签名 URL，以及通过冗余与持续完整性校验达成 11 个 9 的持久性目标。

**标签：** #system-design

---

### 84. 设计实时物联网设备管理平台

**难度：** 困难
**主题：** system-design, iot, mqtt, time-series
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 设计一个平台，实时连接、监控并控制数千万台物联网设备（传感器、智能电表）。

**思路：** 设备经 MQTT（轻量、发布/订阅、QoS 等级）通过横向扩展的连接网关接入，网关维持数百万长连接（基于 epoll，连接状态存于分布式存储）。遥测数据流入流处理器 → 时序数据库（降采样、分级保留）；命令经按设备主题下行到设备。设备注册表/影子保存期望态 vs 上报态，使控制在设备短暂离线时仍可工作（重连时对账）。权衡：MQTT QoS 0/1/2（投递保证 vs 开销）、命令的推 vs 拉、连接密度 vs 单连接成本。讨论固件 OTA（复用第 49 题模式）、认证（每设备证书）、对异常设备群的限流，以及按设备 id 对遥测分区以扩展。

**标签：** #system-design

---

### 85. 设计运营商网络的高可用数据库

**难度：** 困难
**主题：** system-design, database, replication, consensus
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 设计一个支撑运营商用户数据（类 HLR/HSS）的高可用数据库，须满足五个 9（99.999%）可用性。

**思路：** 区域内用共识协议（Raft/Paxos）做同步复制，使多数派在单节点故障下存活且无数据丢失（RPO=0）。跨可用区多副本；故障时自动 leader 选举，在数秒内保持写可用（低 RTO）。异地容灾用异步复制到远端区域。读扩展通过 follower 读（接受轻微陈旧）或读己之写路由到 leader。权衡：同步（强一致、写延迟高）vs 异步（更快、有丢数据风险），以及 CAP 取舍——运营商数据在区域内偏 CP。讨论用户查询的表设计（按 IMSI/用户 id 分片）、海量并发的连接池、不停机的在线变更，以及严格的故障切换演练（五个 9 每年仅允许约 5 分钟停机）。

**标签：** #system-design

---

### 86. 设计分布式关系数据库（Distributed SQL Database，如 GaussDB）

**难度：** 困难
**主题：** system-design, distributed, database, consensus, transactions
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 设计一个可水平扩展的分布式关系数据库，在多节点上支持 ACID 事务与标准 SQL，满足如 GaussDB 这类云数据库的需求。

**思路：** 将 SQL/计算层（解析、生成计划、分布式执行）与存储层分离（存算分离，云原生模式）。按主键用哈希或范围分片；每个分片是一个复制组，通过 Raft/Paxos 保持一致与高可用（主节点处理写、从节点提供一致性读并在故障时接管）。用 MVCC 加全局时间戳源（TSO 或混合逻辑时钟 HLC）提供快照隔离，使读看到一致快照而不阻塞写。跨分片事务在各分片 Raft 之上用两阶段提交保证原子性。关键权衡：强一致 vs 延迟（跨地域提交需多轮往返——可用从节点读、把相关行就近放置）、范围分片 vs 哈希分片（范围利于区间扫描但易热点；哈希均衡负载但扫描分散）、以及分片变热时的在线再分片/负载均衡。讨论 Raft 主选举下的故障恢复、分布式死锁检测，以及查询计划器如何将谓词下推到存储层以减少数据搬移。

**标签：** #system-design

---

### 87. 设计 5G 网络切片管理系统（5G Network Slicing Management）

**难度：** 困难
**主题：** system-design, 5g, orchestration, sla, telecom
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 设计一个创建并管理 5G 网络切片的系统——每个切片是端到端的逻辑网络（RAN + 传输 + 核心网），各自拥有独立 SLA，服务于不同租户与业务类型。

**思路：** 切片是横跨无线接入网、传输网与 5G 核心网的隔离逻辑网络，面向不同业务等级定制：eMBB（大带宽）、URLLC（超低时延，如工业控制/自动驾驶）、mMTC（海量物联网）。架构分层：切片管理功能（NSMF）把租户 SLA 转换为子网需求，下发给各子网管理者（NSSMF）负责 RAN/传输/核心网；资源编排器通过 NFV/SDN 分配并隔离算力、频谱与带宽；闭环自动化层采集每切片遥测，检测 SLA 违约并自动扩缩或重配。生命周期：设计、实例化、激活、监控、扩缩、释放。关键权衡：硬隔离（专属资源、强保障、利用率低）vs 软隔离（共享资源加 QoS 优先级，利用率高但有邻居干扰风险）；集中式 vs 分布式控制（控制面时延）；静态分配 vs AI 驱动的动态再分配。讨论切片间的多租户与安全隔离、按切片计量/计费，以及时延、吞吐、可用性等 KPI 如何驱动闭环。

**标签：** #system-design

---

### 88. 设计运营商网络设备的实时遥测与故障检测系统

**难度：** 困难
**主题：** system-design, telemetry, streaming, monitoring, reliability
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 设计一个系统，从数百万台运营商网络设备（路由器、交换机、基站）采集实时遥测数据，并足够快地检测故障以保障 SLA。

**思路：** 优先采用流式遥测（模型驱动，gNMI/gRPC 以亚秒级推送），而非传统 SNMP 轮询——推送扩展性更好，数据更新鲜且不会造成轮询风暴。设备将指标流入可水平扩展的接入层（Kafka），按设备/区域分区。流处理器（Flink/Spark Streaming）计算滑动聚合、阈值与异常检测（基线加统计/机器学习模型），写入分级保留的时序数据库（原始数据保留数小时，降采样汇总用于长期）。关联/根因引擎将相关告警聚合以对抗告警风暴（一次断纤可触发数千条下游告警），并驱动闭环自愈流程。关键权衡：推送 vs 轮询（新鲜度与扩展性 vs 简单性）、基数爆炸（每接口/每设备标签——控制标签基数并预聚合）、存储成本 vs 分辨率（降采样）、检测的时延 vs 准确率（硬故障用快速阈值，细微劣化用较慢的 ML）。确保监控面本身高可用且独立于被监控网络，避免网络中断时运维同时失明。

**标签：** #system-design

---

## 行为面试

### 89. 谈谈拥抱"奋斗者"文化

**难度：** 中等
**主题：** behavioral, culture, dedication
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 华为以"奋斗者"文化著称。讲一次你远超预期去拿到结果的经历。

**思路：** 华为探查真实的内驱力，又不想听到表演式回答。用 STAR：选一个你主动承担更多范围或攻克难题的真实情形（而不只是"我加了班"）。展示：(1) 具体挑战与利害，(2) 你额外付出的努力与担当，(3) 你是聪明地干而非只是埋头苦干——你做了优先级和取舍，(4) 可量化的结果及所学。对可持续性要诚实；优秀候选人展现的是奉献加判断力，而非为加班而加班。

**标签：** #behavioral

---

### 90. 在高压期限下交付的经历

**难度：** 中等
**主题：** behavioral, pressure, delivery
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 描述一次你必须在极大时间压力下交付关键功能或修复的经历。你是怎么应对的？

**思路：** 展现镇定与优先级排序。STAR：(1) 期限及其重要性（客户承诺、发布、故障），(2) 你怎么做分诊——收敛到必做项、协商砍掉的范围、并行推进，(3) 你怎么在压力下保持可接受的质量（聚焦测试高风险路径、清晰沟通取舍），(4) 结果及复盘洞见。除非你明确反思教训，否则避免选择因自身规划不善而导致紧张的故事。

**标签：** #behavioral

---

### 91. 大型组织中的跨团队协作

**难度：** 中等
**主题：** behavioral, collaboration, communication
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 华为是有众多产品线的大型组织。讲一次你必须协调多个优先级冲突的团队来交付某事的经历。

**思路：** 展示你能驾驭规模与模糊。STAR：(1) 跨团队依赖与冲突（不同 OKR、归属不清），(2) 你怎么及早建立一致——共同目标、清晰接口/契约、定期同步，(3) 必要时如何建设性地升级（带方案而非只是抱怨），(4) 交付结果及为日后合作保留的关系。强调对对方约束的同理心。

**标签：** #behavioral

---

### 92. 为什么选择华为

**难度：** 简单
**主题：** behavioral, motivation, fit
**岗位：** OD / SWE
**级别：** 13-14（初级）

**问题：** 你为什么特别想加入华为，对哪条业务线感兴趣？

**思路：** 要具体且有备而来。选一个真实理由：(1) 华为领先的技术领域（5G/无线、HarmonyOS、运营商网络、华为云、昇腾 AI 芯片），(2) 规模与硬核工程问题（运营商级可靠性、全球部署），(3) 贴近硬件/系统工作的机会。说出具体 BG/团队并与你的背景关联。避免泛泛而谈（"大公司""薪资好"）；展现你理解华为重研发、长期投入的工程文化。

**标签：** #behavioral

---

### 93. 讲一次你以客户为中心的经历（Customer-Centricity）

**难度：** 中等
**主题：** behavioral, customer-centric, star, ownership
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 华为的核心价值观是以客户为中心。请讲一次你超越本职范围去解决客户真实问题的经历，以及最终结果如何。

**思路：** 用 STAR 结构，选一个由客户真实需求（而非仅工单文字）驱动你行动的故事。情境（Situation）：点明客户（内部或外部）、痛点与业务影响（例如某运营商客户反复宕机，面临 SLA 罚款风险）。任务（Task）：你的职责，以及为何默认处理方式不够。行动（Action）：描述你如何深挖真正根因、直接与客户沟通理解其场景，并做了额外工作——在其环境复现问题、交付针对性修复，或对一个内部看似不错却损害客户的方案提出反对。强调具体步骤，以及你为客户长期利益承担的短期成本（长期主义）。结果（Result）：量化——宕机减少、SLA 恢复、重建信任、后续订单。收尾点出体会：真正解决客户的根本问题、而非仅关闭工单，才是以客户为中心的实践含义。保持真实具体；面试官会追问你个人做了什么、而非团队。

**标签：** #behavioral

---

### 94. 讲一次失败与你的自我批判（Self-Criticism）

**难度：** 中等
**主题：** behavioral, self-criticism, star, growth
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 华为把自我批判视为改进的驱动力。请描述一次你主动承担的重大错误或失败，你如何对其进行批判性反思，以及之后带来了什么改变。

**思路：** 用 STAR 结构，选一次真正有代价的失败——不要变相自夸。情境（Situation）：背景与风险（例如你推的一次变更导致线上事故，或低估了依赖导致交付延期）。任务（Task）：你的具体职责。行动（Action）：这是自我批判的核心——坦承自己的责任，不甩锅给他人或客观条件。说明你如何主导或参与了诚实的复盘，找到真正根因（包括自己决策上的疏漏：跳过评审、估算过于乐观、沟通不足），并把无责的系统性修复与个人教训区分开。结果（Result）：具体改变——新增测试卡点、检查清单、更早暴露风险的习惯——以及有效的证据（未再复发、之后交付更快更稳）。收尾把自我批判定位为持续改进而非自我惩罚：目标是更强的流程和更好的自己。面试官看重成熟度、担当与真实改变——避免假装的缺点或指责团队。

**标签：** #behavioral

---

## 领域知识

### 95. C/C++ 内存管理与指针

**难度：** 困难
**主题：** domain-knowledge, c-cpp, memory, pointers
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 解释 C/C++ 中内存如何管理。常见的指针/内存 bug 有哪些，如何预防或调试？

**思路：** 覆盖内存区域：栈（自动、LIFO、快、有限）、堆（`malloc`/`free`、`new`/`delete`、手动生命周期）、静态/全局、代码段。关键 bug：(1) 内存泄漏——堆已分配但从不释放；(2) 悬垂指针——`free`/`delete` 后仍使用；(3) 双重释放；(4) 缓冲区溢出（越界写——经典安全漏洞）；(5) 未初始化指针；(6) `new[]`/`delete[]` 不匹配。现代 C++ 中的预防：RAII、智能指针（`unique_ptr` 独占所有权、`shared_ptr` 引用计数、`weak_ptr` 打破循环）、用容器替代裸数组、`const` 正确性。调试工具：Valgrind / AddressSanitizer (ASan) 检测泄漏与溢出、静态分析器。提及 `shared_ptr` 循环仍会泄漏（需 `weak_ptr`），以及 ASan 在运行时捕获 use-after-free。华为机试和面试在此考查很重。

**标签：** #domain-knowledge

---

### 96. TCP/IP 网络深挖

**难度：** 困难
**主题：** domain-knowledge, networking, tcp, protocols
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 讲解 TCP 三次握手与连接拆除，并解释 TCP 如何提供可靠性与流量/拥塞控制。

**思路：** 握手：SYN → SYN-ACK → ACK 建立序列号与连接（3 个报文段）。拆除：四次 FIN/ACK，发起方进入 TIME_WAIT 以吸收游离报文（2·MSL）。可靠性：序列号 + 累计 ACK + 超时重传（RTO，由 RTT 估计得出）或收到 3 个重复 ACK 时快速重传。流量控制：接收方通告窗口（rwnd），使快速发送方不会压垮慢速接收方。拥塞控制：发送侧 cwnd，含慢启动（指数）、拥塞避免（线性/AIMD）以及对丢包的反应（CUBIC、BBR）。对比 UDP（无连接、无可靠性/顺序——用于实时/VoIP）。准备讨论队头阻塞、Nagle 算法，以及高 RTT 链路为何损害吞吐（带宽时延积、窗口缩放）。华为运营商/网络岗位对此深挖。

**标签：** #domain-knowledge

---

### 97. Linux 进程、线程与 IPC

**难度：** 困难
**主题：** domain-knowledge, linux, concurrency, ipc
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 解释 Linux 中进程与线程的区别，并比较主要的进程间通信（IPC）机制。

**思路：** 进程有独立地址空间（经 `fork` 创建，写时复制）；线程共享进程地址空间（经 `pthread_create` / 带共享标志的 `clone` 创建），故上下文切换与通信更廉价但需同步。线程共享堆/全局/文件描述符，但各有私有栈与寄存器。IPC 机制及权衡：管道/FIFO（简单字节流，相关或命名）、消息队列（结构化、内核缓冲）、共享内存（最快——无拷贝——但需经信号量/互斥量显式同步）、信号量（信号/计数）、套接字（也可跨机）、信号（异步通知、载荷有限）。同步原语：互斥量、自旋锁（忙等，适合极短临界区）、条件变量、读写锁。讨论竞态、死锁（及 Coffman 四条件），以及为何共享内存 + 信号量是运营商常用的高性能选择。提及用于可扩展 I/O 多路复用的 `epoll`。

**标签：** #domain-knowledge

---

### 98. 操作系统概念

**难度：** 困难
**主题：** domain-knowledge, operating-systems, scheduling, memory
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 解释虚拟内存与分页，并描述现代操作系统中的 CPU 调度如何工作。

**思路：** 虚拟内存给每个进程一个私有线性地址空间，经页表映射到物理帧；MMU 完成地址转换，TLB 缓存近期转换。缺页触发从磁盘加载（按需分页）；内存满时 OS 用替换策略（如时钟算法等 LRU 近似）淘汰页。好处：隔离、看似多于物理的内存、易于共享（共享库）。当工作集超过 RAM 时发生抖动。调度：调度器在就绪线程间复用 CPU——策略包括轮转、优先级，以及 Linux 的 CFS（完全公平调度器），它用按虚拟运行时间为键的红黑树近似公平共享。讨论抢占式 vs 协作式、上下文切换成本、实时调度类（SCHED_FIFO/RR 用于确定性延迟——与电信/嵌入式相关），以及吞吐与延迟/公平性的权衡。回到嵌入式/运营商系统为何常需实时保证。

**标签：** #domain-knowledge

---

### 99. 哈希表与平衡树（Hash Tables vs Balanced Trees）

**难度：** 中等
**主题：** domain-knowledge, data-structures, hash-tables, trees
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 对比哈希表与平衡二叉搜索树：它们的内部实现、复杂度，以及何时选用哪一个。

**思路：** 哈希表：通过哈希函数把键映射到桶；查/增/删平均 O(1)，但冲突严重时最坏 O(n)。冲突处理——链地址法（每桶一条链表/树，如 Java HashMap 在长桶时树化为 O(log n)）vs 开放寻址（线性/二次探测、robin-hood——缓存局部性更好，但需要合适的负载因子，且删除需要墓碑标记）。当负载因子超阈值时扩容再散列（均摊 O(1)）。无序；迭代顺序任意。平衡 BST（红黑树/AVL/B 树）：保持键有序，查/增/删保证 O(log n)（无糟糕的最坏情况），支持有序操作——区间查询、前驱/后继、中序遍历、floor/ceil。AVL 更严格平衡（读更快），红黑树重平衡更少（写更快）；B 树是面向磁盘/数据库的变体（高扇出、少 I/O）。如何选择：纯键值查找、顺序无关、追求最快平均访问时用哈希表（缓存、去重、等值索引）；需要有序、区间扫描或硬性最坏保证时用平衡树（调度器、数据库索引，如 std::map vs std::unordered_map）。可提及哈希质量与构造冲突导致的 DoS，以及数据库为何在区间查询上用 B 树索引而非哈希索引。

**标签：** #domain-knowledge

---

### 100. 编译器的编译流程（Compilation Phases）

**难度：** 中等
**主题：** domain-knowledge, compilers, parsing, code-generation
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 讲解编译器把源代码变成可执行文件所经历的各个阶段，以及每个阶段产出什么。

**思路：** 前端：(1) 词法分析（扫描器）把字符流切分为记号（标识符、关键字、字面量、运算符），丢弃空白/注释；通常由正则表达式/有限自动机驱动。(2) 语法分析（解析器）按语言文法（上下文无关文法）检查记号，构建语法树/抽象语法树（AST）；采用 LL 或 LR 解析。(3) 语义分析：类型检查、作用域/名字解析、构建符号表，捕获未声明变量、类型不匹配等错误。中端：(4) 中间表示（IR）生成——与机器无关的形式（三地址码、LLVM IR），便于可移植优化。(5) 优化——机器无关变换：常量折叠、死代码消除、公共子表达式消除、循环不变量外提、内联。后端：(6) 代码生成把 IR 下降为目标机器/汇编代码，涉及指令选择、寄存器分配与指令调度。(7) 机器相关的（窥孔）优化，随后汇编与链接。区分前端（依赖语言）与后端（依赖目标）——IR 是解耦点，使一个前端可面向多种架构（LLVM 模型）。可对比静态编译 vs 动态（JIT）编译以及解释器。

**标签：** #domain-knowledge

