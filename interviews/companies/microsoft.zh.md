# 微软

```yaml
company: 微软（Azure、Office、Windows、Xbox、GitHub）
typical_rounds: 1 轮 recruiter 沟通 + 1 轮电话面 + 4-5 轮 onsite（2-3 轮编码、1 轮系统设计、1 轮 "As Appropriate" 高管面）
focus_areas: 经典算法、OOD、Azure/云味系统设计、"成长型思维"行为面试
languages_allowed: 任意主流语言；C#/Java/Python/C++ 常见
duration: 每轮 45-60 分钟
notable_quirks:
  - "As Appropriate"（AA）轮由资深 leader 主持，有近乎一票否决的影响力
  - "成长型思维"（Satya Nadella 提出）是主导的文化视角
  - 强调基础——链表、树、递归、内存
  - 算法奇技不如 Google 多；更多是"你能不能仔细写代码？"
sources: Glassdoor、LeetCode Discuss（microsoft 标签）、Blind、careers.microsoft.com
```

## 概述

微软的门槛更看重扎实的计算机基础而非算法花活。你更可能被要求翻转链表然后讨论边界 20 分钟，而不是做 Hard 级 DP。系统设计轮常依赖 Azure 原语（Cosmos DB、Service Bus、Functions）。"成长型思维"主导行为面试：他们要的是学习者，而非全能者。AA 轮（资深 leader，常是 partner 级工程师或总监）相当于他们的 bar raiser。

## 链表

### 1. 翻转链表

**难度：** 简单
**主题：** linked-list, recursion, pointers
**岗位：** SWE
**级别：** L60-L62

**问题：** 翻转单链表。迭代和递归各实现一次。讨论权衡。

**思路：** 迭代：三指针（`prev, curr, next`）；curr.next = prev，推进。O(n) 时间，O(1) 空间。递归：递归到末尾，设 `head.next.next = head; head.next = null`。O(n) 时间，O(n) 栈深。微软喜欢讨论长链表为何首选迭代（栈溢出风险）。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 改写 `cur.next` 前先保存 `next`，否则丢失链表后半段。
- 循环结束时 `prev` 即为新头。
- 递归版优雅但 O(n) 栈深，长链表存在栈溢出风险。

**常见追问：**
- 在下标 m 到 n 之间反转子链表，单遍。
- 按 k 个一组反转（Reverse Nodes in k-Group）。
- 双向链表——还要修 `prev` 指针。
- 先检环再拒绝反转——避免指针损坏。

**常见坑：**
- 重写 `cur.next` 前没先抓 `next`——链表被截断。
- 循环结束后返 `head`（旧头）而不是 `prev`（新头）。

**标签：** #algorithm

---

### 2. 复制带随机指针的链表

**难度：** 中等
**主题：** linked-list, hashmap, design
**岗位：** SWE
**级别：** L60-L62

**问题：** 长度为 n 的链表。每个节点有 `next` 和指向任意节点或 null 的 `random` 指针。深拷贝该链表。

**思路：** 两遍法 + 哈希表 `original -> copy`：第一遍创建所有副本，第二遍通过 map 查找接上 `next` 和 `random`。O(n) 时间，O(n) 空间。O(1) 空间最优：交错副本（`A -> A' -> B -> B' -> ...`），赋 `random`，再拆开。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 两遍法避开了"还没建好就要接 random"的鸡生蛋问题。
- 用节点身份作 key，而非值（值可能重复）。
- 交错-拆分技巧能 O(1) 额外空间，但代码细节更易写错。

**常见追问：**
- 克隆带随机边的图——同样身份键 map。
- 从零实现 O(1) 额外空间的交错变体。
- 带环的链表——检测并保留环。
- 与原链共享结构的持久拷贝——不可变链表变体。

**常见坑：**
- 用 `cur.val` 作 map key——值重复时会错。
- map 查找前忘了 null 判定 `cur.next` / `cur.random`。

**标签：** #algorithm

---

### 3. 反转链表 II

**难度：** 中等
**主题：** linked-list, pointers
**岗位：** SWE
**级别：** L60-L62

**问题：** 一次遍历且原地反转链表中位置 `left` 到 `right`（1-indexed）的节点。

**思路：** 用 dummy 节点。把 `prev` 走到位置 `left-1`。然后反复把后继节点插到已反转子链表的最前面（在 `prev.next` 位置插入）。O(n) 时间，O(1) 空间。边界：`left == 1`、`left == right`、链表短于 `right`。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- dummy 节点免去 `left == 1`（头节点移动）的特殊分支。
- "把后继插到前面"省去先反转再缝合两步。
- 每步 O(1) 指针操作，共 `right - left` 次插入。

**标签：** #algorithm

---

### 4. 合并 K 个有序链表

**难度：** 困难
**主题：** linked-list, heap, divide-and-conquer
**岗位：** SWE
**级别：** L62-L63

**问题：** 合并 k 个有序链表为一个有序链表。

**思路：** 大小 k 的小顶堆，初始装入每个链表头；弹出最小，再压入它的 `.next`。O(N log k) 时间，O(k) 空间。备选：分治两两合并（复杂度相同，无需堆）。注意输入里可能有 null 链表。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 元组里的下标用于打破平局，避免堆比较节点对象。
- 两两分治合并无需堆，同样 O(N log k)。
- 入堆前过滤掉 null 链表。

**标签：** #algorithm

---

### 5. LRU 缓存

**难度：** 中等
**主题：** design, hashmap, linked-list
**岗位：** SWE
**级别：** L62-L63

**问题：** 设计一个 LRU 缓存，`get` 和 `put` 都 O(1)。

**思路：** 哈希表 key → 双向链表节点 + 一条双向链表（头=最近，尾=最久）。访问时把节点从原位置摘下并移到头部。`put` 超容时摘掉尾节点并从 map 移除。两个操作都 O(1)。微软关注你能否写出干净的 DLL 拼接代码。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- JS `Map` 和 Python `OrderedDict` 都保留插入顺序。
- 访问时重新插入以标记为最近使用。
- 超容时弹出首个 key（最久未用）即可。

**标签：** #algorithm

---

### 6. 环形链表 II（找入环节点）

**难度：** 中等
**主题：** linked-list, two-pointers, floyd, cycle-detection
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定单链表的头节点，返回环开始的节点；若无环返回 null。要求 O(1) 额外空间，并讨论指针推导为何成立。

**思路：** Floyd 快慢指针：`slow` 每次走 1 步、`fast` 每次走 2 步；相遇则有环。随后把一个指针重置到 `head`，两指针各走 1 步——它们在入环节点相遇（头到入环口的距离等于相遇点到入环口的距离）。O(n) 时间，O(1) 空间。微软会考无环的边界（`fast`/`fast.next` 变空）以及让你证明入环口相等关系。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 相遇只能证明有环；从 `head` 起的第二次同步遍历才能定位入环口。
- 循环条件必须先判 `fast` 与 `fast.next` 再走两步，避免空指针。
- O(n) 时间，O(1) 空间——无需哈希集合。

**常见追问：**
- 求环长（相遇后让 `slow` 继续走直到再回到相遇点）。
- 改用哈希集合并比较权衡（O(n) 空间，更直观）。
- 检测后原地断开环。

**常见坑：**
- 用值比较（`slow.val == fast.val`）而非节点身份。
- 第二阶段两个指针都走 2 步——必须都走 1 步。

**标签：** #algorithm

---

### 7. 相交链表

**难度：** 简单
**主题：** linked-list, two-pointers, pointers
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定两个单链表的头节点，返回它们相交的节点；若不相交返回 null。相交按节点身份判断，而非值。讨论 O(1) 空间技巧与边界。

**思路：** 两个指针 `a`、`b` 分别从两个头出发，每步各走一步；当某指针走到末尾时，重定向到另一条链表的头。至多 `lenA + lenB` 步后两者走过相同总距离，同时在相交节点或同时在 null 相遇。O(n + m) 时间，O(1) 空间。微软关注不相交时能在 null 处干净地终止。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 把各指针重定向到对方头节点可拉平两条路径长度，保证对齐。
- 若不相交，两指针在同一步同时变为 null，循环退出并返回 null。
- O(n + m) 时间，O(1) 空间——无需预先数长度，也无需哈希。

**常见追问：**
- 另一种做法：先量两条长度，长的先走差值，再一起走。
- 把一条链表的节点放进哈希集合，再扫另一条（O(n) 空间）。
- 若某条链表有环，该不变量还成立吗？

**常见坑：**
- 空判前就走 `.next`，跳过交叉切换导致死循环。
- 用值比较而非节点身份，遇重复值会误判。

**标签：** #algorithm

---

### 8. 两数相加

**难度：** 中等
**主题：** linked-list, math, pointers, carry
**岗位：** SWE
**级别：** L60-L62

**问题：** 两个非空链表表示两个非负整数，数字按逆序存储，每个节点一位。将它们相加并以链表返回和。讨论进位处理与不等长情况。

**思路：** 用一个 `carry` 同时遍历两条链表，并借助哑头节点简化构造。每步把两个可用数位与进位相加，将 `total % 10` 作为新节点接上，`total // 10` 作为下一次的进位。O(max(n, m)) 时间，O(max(n, m)) 空间。微软会考的边界：最后的进位（如 5 + 5）在两链表耗尽后仍需额外一个节点，因此循环还要在 `carry` 非零时继续。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 逆序存储意味着从左到右相加，进位自然沿遍历方向流动。
- `while ... or carry` 条件能为 99 + 1 这类溢出补出最后一个节点。
- 哑头节点免去首节点特判；返回 `dummy.next`。

**常见追问：**
- 若数字按正序（高位在前）存储怎么办？两条都反转，或用两个栈。
- 不分配新链表完成相加（原地改写较长的一条）。
- 推广到任意进制。

**常见坑：**
- 丢掉最后的进位，得到偏短的错误结果。
- 链表不等长时只推进了一个指针。

**标签：** #algorithm

---

## 树

### 9. 验证二叉搜索树

**难度：** 中等
**主题：** tree, bst, recursion, dfs
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定二叉树，判断是否为合法 BST（每个节点的左子树 < 节点 < 右子树）。

**思路：** 递归向下传 `(min, max)` 边界。别只比邻接子节点——`[5, 1, 6, null, null, 3, 7]` 会过。备选：中序遍历，检查严格递增。注意整数溢出 → 用 Long 边界或 null 哨兵。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 边界随下行收紧；严格不等式保证值唯一。
- 空树天然是合法 BST。
- 仅比较父子会漏掉远祖被破坏的情况。

**常见追问：**
- 允许重复值——重定义放哪侧并调整不等式。
- 在非 BST 树里返回最大的合法 BST 子树（大小 + 根）。
- 栈迭代中序——避免递归栈风险。
- 值包含 `Integer.MIN_VALUE` / `MAX_VALUE`——必须用 `Long` 边界或 null 哨兵。

**常见坑：**
- 用 `<=` / `>=` 而不是严格 `<` / `>`——重复值会漏。
- 只比邻接父节点——`[5, 1, 6, null, null, 3, 7]` 会误过。

**标签：** #algorithm

---

### 10. 二叉树的序列化与反序列化

**难度：** 困难
**主题：** tree, bfs, dfs, design
**岗位：** SWE
**级别：** L62-L63

**问题：** 设计将二叉树序列化为字符串并反序列化回来的算法。

**思路：** 前序 DFS 带 null 标记：`"1,2,null,null,3,4,null,null,5,null,null"`。反序列化用队列/迭代器，每次取一个 token 递归。序列化与反序列化各 O(n)。备选：层序 BFS。讨论紧凑编码（变长 int、用叶子标志位省去前导 null）。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 前序 + null 哨兵能唯一确定一棵树。
- 共享游标/迭代器让反序列化 O(n) 且无需下标运算。
- BFS 版本思路一致，用队列产生层序序列。

**常见追问：**
- BST 更紧凑的序列化（存大小后不需 null 标记）。
- N 叉树——每节点编码子节点数。
- 流式序列化——边走边输出 token。
- 跨版本兼容——加头/版本字节。

**常见坑：**
- 按 `,` 切分但值本身含 `,`——转义或改用长度前缀编码。
- 某个子节点的 null 标记漏写——反序列化错位。

**标签：** #algorithm

---

### 11. 实现 Trie（前缀树）

**难度：** 中等
**主题：** trie, design, string
**岗位：** SWE
**级别：** L60-L62

**问题：** 实现支持 `insert`、`search` 和 `startsWith` 操作的 Trie。

**思路：** 节点含 `children: Map<Char, Node>`（或小写 a-z 用长度 26 的数组）和 `isEnd` 标志。三个操作均逐字符走树。每次操作 O(L)，L 为单词长度。讨论：数组快但稀疏；hashmap 节省大字母表场景的空间。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 共用一个 `find` 辅助函数同时支撑 `search` 与 `startsWith`。
- `end` 标志区分"已插入的单词"和"只是某个前缀"。
- 26 长度的数组子节点更快，但稀疏字母表浪费内存。

**标签：** #algorithm

---

### 12. 添加与搜索单词

**难度：** 中等
**主题：** trie, dfs, design
**岗位：** SWE
**级别：** L62-L63

**问题：** 设计一个数据结构，支持 `addWord(word)` 和 `search(word)`，其中搜索词可含 `.` 通配任意单个字母。

**思路：** Trie + DFS 搜索。遇到 `.` 时递归所有非空子节点。add O(L)；search 最坏 O(26^k * L)，k 是通配符数。微软关注你能否控制好递归边界，并处理空 trie / 空串。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- DFS 在遇到通配符时分支到所有子节点。
- 终止条件 `i == len(word)` 要求 `end` 为 true 才算命中。
- 通配符多时最坏 O(26^k * L)，常规使用很快。

**标签：** #algorithm

---

### 13. 单词搜索 II

**难度：** 困难
**主题：** trie, backtracking, dfs, matrix
**岗位：** 高级 SWE
**级别：** L62-L63

**问题：** 给定 2D 字母板和一组单词，返回能在板上找到的所有单词（相邻单元，不复用）。

**思路：** 把单词列表建成 trie。从每个单元 DFS，并在 trie 上同步下行。命中一个带词的 trie 节点时记录并把标记置空避免重复。沿途剪掉已死的 trie 分支。最坏 O(m*n*4^Lmax)，但剪枝下实际很快。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- Trie 让候选单词共享前缀工作，比逐词搜索高效得多。
- 命中后删 `$` 并剪枝死分支，trie 持续缩小。
- 修改后复原 board 单元，实现 O(1) 访问标记。

**标签：** #algorithm

---

### 14. 路径总和 II

**难度：** 中等
**主题：** tree, dfs, backtracking
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定二叉树和目标和，返回所有从根到叶子且值之和等于目标的路径。

**思路：** DFS 维护当前路径栈和剩余和。到叶子时若剩余为 0，快照路径。递归结束 pop 回溯。访问 O(n) 节点；最坏输出 O(n) 条路径 * O(h) 长度。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 命中时必须快照 `path`，否则后续修改会污染已收集的结果。
- "叶子"指左右子节点都为空，而不是某个 null。
- 递归返回后 pop 以恢复回溯状态。

**标签：** #algorithm

---

### 15. 从前序与中序遍历构造二叉树

**难度：** 中等
**主题：** tree, recursion, hashmap
**岗位：** SWE
**级别：** L62-L63

**问题：** 给定值唯一的树的前序和中序遍历，重建该树。

**思路：** 前序首元素为根；在中序里定位它来切分左右子树。递归。预先建 `value -> 中序下标` 哈希表实现 O(1) 查询。总 O(n)。注意区间下标算术。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 中序下标哈希表把每节点查找从 O(n) 降到 O(1)。
- 用共享游标按顺序消费前序数组，先建左子树。
- 假设值唯一；重复值会让中序定位失效。

**标签：** #algorithm

---

### 16. 二叉树展开为链表

**难度：** 中等
**主题：** tree, dfs, in-place
**岗位：** SWE
**级别：** L62-L63

**问题：** 原地按前序把二叉树展开成只用 right 指针连成的"链表"。

**思路：** 反向前序（右、左、根）递归并维护 `prev` 指针：`node.right = prev; node.left = null; prev = node;`。O(n) 时间，O(h) 栈。Morris 风格的迭代可做 O(1) 空间：对每个节点，若左子树存在，找左子树最右节点，把右子树接到其右上，再把左子树移到右。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 反向前序首先到达展平链表的末端。
- `prev` 把已访问的节点逐个串到正在构造的链表前端。
- Morris 风格迭代可做到 O(1) 额外空间。

**标签：** #algorithm

---

### 17. 对称二叉树

**难度：** 简单
**主题：** tree, recursion, bfs
**岗位：** SWE
**级别：** L60-L62

**问题：** 判断二叉树是否关于自身中心轴对称。

**思路：** 递归 `isMirror(a, b)`：都为空 = true；其一为空 = false；值相等且 `isMirror(a.left, b.right) AND isMirror(a.right, b.left)`。O(n) 时间，O(h) 栈。迭代版用队列成对入队。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 外侧与外侧对、内侧与内侧对。
- 都空为 true；其一空为 false。
- 迭代版用队列成对入队即等价 BFS 解法。

**标签：** #algorithm

---

### 18. 二叉树的最大深度

**难度：** 简单
**主题：** tree, dfs, bfs, recursion
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定二叉树，返回其最大深度（根到叶的最长路径节点数）。

**思路：** DFS 递归：`depth(node) = node == null ? 0 : 1 + max(depth(left), depth(right))`。O(n) 时间，O(h) 栈。BFS 备选：按层计数。微软常追问"最小深度"——注意必须到叶子，不是到 null。

**Python：**
```python
def max_depth(root: TreeNode | None) -> int:
    if root is None:
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
static int maxDepth(TreeNode root) {
    if (root == null) return 0;
    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```

**要点：**
- 基态：空节点深度为 0。
- O(n) 时间，O(h) 栈空间。
- 最小深度更微妙——必须真到叶子，不能在 null 子上停。

**标签：** #algorithm

---

### 19. 二叉搜索树的最近公共祖先

**难度：** 简单
**主题：** tree, bst, recursion
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定 BST 与两个节点 p、q，找它们的最近公共祖先。

**思路：** 从根出发：若 p、q 都 < 根，往左；都 > 根，往右；否则根即 LCA。O(h) 时间，迭代版 O(1) 空间。一般二叉树则用后序递归，子树含任一目标节点时返回非空。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- p、q 第一次分叉（或某一方等于当前）处即 LCA。
- 迭代 O(1) 空间，在高树上优于递归。
- 一般二叉树 LCA 要换思路（后序冒泡返回）。

**标签：** #algorithm

---

### 20. 二叉树的锯齿形层序遍历

**难度：** 中等
**主题：** tree, bfs, deque
**岗位：** SWE
**级别：** L62-L63

**问题：** 返回二叉树的锯齿层序遍历（先左到右，再右到左，逐层交替）。

**思路：** 按层 BFS，带一个方向 flag；右到左的层把节点前插到当前层列表（或最后整层反转）。O(n) 时间，O(n) 空间。微软可能追问一遍走完的 deque 解法。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- BFS 保留层边界；方向只是输出形式。
- 用双端队列（或 `unshift`）做右到左可省额外反转。
- 子节点入队顺序不变，只翻转输出方向。

**标签：** #algorithm

---

### 21. 二叉树的层序遍历

**难度：** 中等
**主题：** tree, bfs, queue, traversal
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定二叉树的根节点，返回其层序遍历——一个由各层组成的列表，每层是从左到右的节点值。讨论如何区分相邻两层。

**思路：** 用队列做 BFS；在每层开始时快照 `len(queue)`，只处理该层开始时已在队列中的节点，同时把子节点入队。时间 O(n)，每个节点访问一次；空间 O(n)，队列在最宽一层达到峰值。微软会追问的边界：空树返回 `[]` 而不是 `[[]]`。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 在内层循环前记录本层大小，避免本层的子节点混进当前层。
- 时间 O(n)，空间 O(n)；队列在树的最大宽度处达到峰值。
- 空树返回空列表，而不是含一个空列表的列表。

**常见追问：**
- 锯齿层序——反转交替层（或奇数行头插）。
- 自底向上层序——正常构建后反转外层列表。
- 只返回每层平均值，或每层最右节点。

**常见坑：**
- 在入队子节点后于循环内读取 `queue.size()` 会把层混在一起。
- 忘记空根判断会得到 `[[]]` 而不是 `[]`。

**标签：** #algorithm

---

### 22. 二叉树的右视图

**难度：** 中等
**主题：** tree, dfs, bfs, recursion
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定二叉树的根节点，想象自己站在树的右侧，返回从上到下能看到的节点值。讨论 DFS 与 BFS 的取舍。

**思路：** DFS 先访问右子再访问左子；每个深度第一个到达的节点即为可见节点，因此当 `depth == len(view)` 时记录 `node.val`。时间 O(n)，空间 O(h) 为递归栈。微软会追问的边界：右侧可见的节点也可能是左子节点（当右子树更矮时），所以仍必须递归左子树。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 先右后左的 DFS 使每个深度第一个访问到的节点成为可见节点。
- `depth == view.length` 即"本深度首次到达"判断，无需逐层记账。
- 仍要递归左子树：较矮的右子树会让左节点在更深层暴露出来。

**常见追问：**
- 改用 BFS——取每层最后一个节点。
- 返回左视图——镜像递归顺序。
- 处理 10^5 节点的右偏树——递归深度风险，改用迭代 BFS。

**常见坑：**
- 先递归左子会记录左节点，掩盖真正的右视图。
- 跳过左子树会漏掉仅因右子树提前结束才可见的节点。

**标签：** #algorithm

---

### 23. 二叉树中的最大路径和

**难度：** 困难
**主题：** tree, dfs, recursion, dynamic-programming
**岗位：** 高级 SWE
**级别：** L62-L63

**问题：** 给定一棵非空二叉树，返回任意路径的最大和，路径是一串相连的节点、不必经过根。节点值可能为负——讨论这如何影响你的选择。

**思路：** 后序 DFS 返回从某节点向下的最佳增益——`node.val + max(leftGain, rightGain, 0)`——把负的子树增益钳为 0 以丢弃有害分支。另外用一个全局最大值追踪穿过每个节点的最佳"拱形"路径 `node.val + leftGain + rightGain`。时间 O(n)，空间 O(h)。微软会追问的关键点：返回给父节点的（单条分支）与用于更新答案的（两条分支）是不同的。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 把每个子节点的增益钳到 0，丢弃只会降低总和的分支。
- 只返回一条分支给父节点，但用在该节点汇合的两条分支来更新答案。
- 把全局最大值初始化为真实节点值（或 -inf），使全负树返回绝对值最小的单个节点。

**常见追问：**
- 同时返回实际的节点路径，而不仅是和。
- 限制路径最多 k 个节点。
- 扩展到 n 叉树——取增益最大的两个子节点。

**常见坑：**
- 把 `node.val + left + right` 返回给父节点——路径不能在父节点处分叉。
- 把 best 初始化为 0——当所有值都为负时出错。

**标签：** #algorithm

---

### 24. 二叉树的直径

**难度：** 简单
**主题：** tree, dfs, recursion, height
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定二叉树的根节点，返回其直径——任意两节点间最长路径的长度，以边数计。注意该路径不必经过根节点。

**思路：** 后序 DFS 返回每棵子树的高度；在每个节点，穿过它的最长路径为 `leftHeight + rightHeight` 条边，用全局最大值追踪。向上返回 `1 + max(leftHeight, rightHeight)`。时间 O(n)，空间 O(h)。微软会追问的边界：直径按边而非节点计，所以单个节点直径为 0，空树也为 0。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 穿过某节点的直径等于其两棵子树高度之和（以边计）。
- 一次 DFS 同时计算高度并更新最大值——O(n) 而非 O(n^2)。
- 计边不计点：单节点与空树都返回 0。

**常见追问：**
- 返回最长路径的两个端点节点，而不仅是长度。
- 带权边——把边权带入高度计算。
- n 叉树的直径——合并高度最大的两个子节点。

**常见坑：**
- 为每个节点单独再跑一遍高度计算——退化为 O(n^2)。
- 数节点而不是边——差一，返回直径 + 1。

**标签：** #algorithm

---

## 堆 / 优先队列

### 25. 数组中的第 K 大元素

**难度：** 中等
**主题：** heap, quickselect, sorting
**岗位：** SWE
**级别：** L60-L62

**问题：** 在未排序数组中找第 k 大元素。

**思路：** 大小为 k 的小顶堆：O(n log k)。或 Quickselect（Hoare 分区）平均 O(n)。微软会两个都问——实现 Quickselect（随机 pivot 避最坏）。讨论各自胜出场景。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 三路（荷兰国旗）分区天然处理重复元素。
- 随机 pivot 让期望 O(n)，O(n^2) 最坏极不可能。
- 堆解法用 O(k) 内存，更适合流式输入。

**常见追问：**
- top-k **不重复**元素——加 set 去重。
- 流式 kth largest——维护大小 k 的小顶堆。
- top-k 频次（Top-K Frequent）——桶排序可 O(n)。
- 数据流中位数——双堆模型。

**常见坑：**
- 用固定 pivot（首或尾）——有序输入上最坏 O(n^2)。
- “kth largest” 映射到升序下标 `n - k` 时 off-by-one。

**标签：** #algorithm

---

### 26. 数据流的中位数

**难度：** 困难
**主题：** heap, design
**岗位：** 高级 SWE
**级别：** L62-L63

**问题：** 设计一个类，随数据流入支持 `addNum(int)` 与 `findMedian()`。

**思路：** 两个堆：左半大顶堆，右半小顶堆。add 时压入并保持两堆大小差 <= 1。中位数：总数为奇时取元素较多那个堆的堆顶；为偶时取两个堆顶平均。add O(log n)，median O(1)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 两个堆把数据流切成左右两半，两个堆顶即中位数。
- 通过一个堆"中转"再压另一个堆，保持分割正确。
- `|high| - |low|` 维持在 {0, 1}，中位数 O(1) 即可读出。

**标签：** #algorithm

---

### 27. 前 K 个高频元素

**难度：** 中等
**主题：** heap, hash-map, bucket-sort, counting
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定整数数组和整数 `k`，返回出现频率最高的 `k` 个元素。讨论堆解法与桶排序之间的取舍。

**思路：** 先用哈希表统计频率，再维护一个大小为 `k` 的小顶堆存 `(count, value)`；逐个压入，堆超过 `k` 时弹出，使最小的计数被挤掉。时间 O(n log k)，空间 O(n)。按频率桶排序可达 O(n)，但堆可推广到流式场景；微软喜欢听到两种方案及各自适用的时机。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 先用哈希表统计——O(n)，不可避免。
- 大小为 `k` 的小顶堆把选择阶段的内存控制在 O(k)，运行时间 O(n log k)。
- 按频率桶排序是 O(n)，因为计数不超过 `n`；用计数作为桶下标。
- 计数最大的 k 个即为答案；它们之间的顺序无要求。

**常见追问：**
- 前 k 个高频*单词*，同频时按字母序打破平局。
- 数组无法放入内存的流式输入。
- 内存紧张下用 count-min sketch 近似 top-k。

**常见坑：**
- 用装下全部条目的大顶堆——O(n log n)，比大小为 k 的小顶堆更差。
- 桶数组大小差一（必须是 `n + 1` 才能索引计数 `n`）。

**标签：** #algorithm

---

## 栈 / 队列

### 28. 设计点击计数器

**难度：** 中等
**主题：** design, queue, concurrency
**岗位：** SWE
**级别：** L62-L63

**问题：** 设计一个 hit counter，能记录点击并返回过去 5 分钟（300 秒）内的点击数。

**思路：** 长度 300 的环形缓冲（`time[i], count[i]`）；hit 时若 `time[idx] != now` 重置，否则自增。`getHits` 求和 `now - time[i] < 300` 的槽。hit O(1)，query O(300)。讨论线程安全（每槽原子 CAS）和高 QPS 下的更粗粒度桶。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 固定大小缓冲让内存 O(1)，与流量无关。
- 比较当前时间戳与槽存时间戳即可识别过期槽。
- 超高 QPS 时可改为 (ts, count) 队列，过期就 pop。

**标签：** #algorithm

---

### 29. 最小栈

**难度：** 中等
**主题：** stack, design
**岗位：** SWE
**级别：** L60-L62

**问题：** 设计一个栈，支持 push、pop、top、`getMin` 都 O(1)。

**思路：** 双栈：数据栈 + 最小栈。push 时把 `min(x, currentMin)` 也压到最小栈。pop 时两栈一起 pop。`getMin` 返回最小栈栈顶。优化：仅当新值 `<=` 当前最小才压最小栈。所有操作 O(1)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 最小栈只在"最小值变化"时记录，每个最小值代表一段时期。
- 用 `<=`（含等号），允许重复最小值入栈，否则 pop 时会出错。
- 所有操作均为均摊和最坏 O(1)。

**标签：** #algorithm

---

### 30. 滑动窗口最大值

**难度：** 困难
**主题：** deque, sliding-window, arrays
**岗位：** 高级 SWE
**级别：** L62-L63

**问题：** 给定数组与窗口大小 k，返回窗口从左到右滑动时每个窗口的最大值。

**思路：** 单调递减下标双端队列。每来一个元素：尾端比它小的全部 pop，再压入当前下标。头端越出窗口时 pop。队首即当前窗口最大。摊还 O(n)，O(k) 空间。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 队列按值降序保存下标，队首即当前最大。
- 每个下标至多进队、出队各一次——摊还 O(n)。
- 当队首下标越出窗口（`dq[0] <= i - k`）时弹出。

**标签：** #algorithm

---

### 31. 有效的括号

**难度：** 简单
**主题：** stack, string, matching, edge-cases
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定一个只包含 `()[]{}` 的字符串，判断括号是否配对且正确嵌套。讨论边界情况。

**思路：** 遇到左括号入栈；遇到右括号时，栈顶必须是其对应的左括号，否则失败。用哈希表将右括号映射到左括号以便干净匹配。时间 O(n)，空间 O(n)。微软会追问两个经典边界：栈为空时遇到右括号，以及遍历结束时栈非空（有未闭合的左括号）。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 栈是天然选择：最后打开的必须最先关闭。
- 遇到右括号弹栈前先检查栈是否为空。
- 结束时还要确认栈为空——`([)]` 与 `(` 会以不同方式失败。
- 时间 O(n)，最坏空间 O(n)（全是左括号）。

**常见追问：**
- 支持通过配置传入的任意括号字符集。
- 返回第一个不匹配的下标而非布尔值。
- 使字符串有效所需的最少插入/删除次数。

**常见坑：**
- 不做空栈检查就弹栈，遇到 `"]"` 会抛异常。
- 栈中仍有未闭合左括号时却返回 `true`。

**标签：** #algorithm

---

### 32. 每日温度

**难度：** 中等
**主题：** stack, monotonic-stack, array, greedy
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定每日温度数组，返回一个数组，其中每个元素表示要等多少天才会遇到更高的温度；若之后没有更暖的一天则为 0。讨论为什么栈优于暴力解法。

**思路：** 维护一个单调递减的下标栈，栈中是尚未找到更暖一天的下标。对每一天，当当前温度高于栈顶下标处的温度时，弹栈并记录天数差。时间 O(n)——每个下标入栈出栈各一次——空间 O(n)。讨论点：结束时仍留在栈里的下标会正确保持为 0。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 存下标而非数值，才能算出天数差 `i - prev`。
- 单调递减栈：每个下标至多入栈出栈一次 → O(n)。
- 从未被弹出的下标保持为 0——默认答案无需特殊处理。
- 用 `<`（而非 `<=`），使相同温度不算更暖。

**常见追问：**
- 返回实际更暖的温度而非等待天数。
- 下一个更大元素的各种变体（循环数组、映射查询）。
- 流式处理温度——数据到达时即时回答每一天。

**常见坑：**
- 入栈的是温度而非下标，丢失了距离信息。
- 使用 `<=`，把相同温度的一天当成更暖。

**标签：** #algorithm

---

### 33. 逆波兰表达式求值

**难度：** 中等
**主题：** stack, math, parsing, division
**岗位：** SWE
**级别：** L60-L62

**问题：** 计算以逆波兰（后缀）表示法给出的算术表达式。词元是整数和运算符 `+ - * /`。讨论你如何处理除法和操作数顺序。

**思路：** 从左到右扫描词元，用栈存放操作数。遇到运算符时，弹出最近两个操作数，按 `left OP right`（`-` 和 `/` 顺序至关重要）计算并把结果压回。时间 O(n)，空间 O(n)。微软关注的边界：除法必须向零截断，所以 Python 里用 `int(a / b)` 而不是 `//`，后者对负数向下取整会出错。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 操作数顺序重要：先弹 `right`，再弹 `left`，按 `left OP right` 计算。
- 除法向零截断——Python 用 `int(a/b)`，TS 用 `Math.trunc`；Java 的 `/` 本就向零截断。
- 每个运算符消耗两个操作数、产生一个；合法 RPN 结束时栈中恰好剩一个。
- 时间 O(n)，空间 O(n)。

**常见追问：**
- 校验非法输入（操作数太少、结束时残留多个操作数）。
- 用调度场算法扩展到中缀表达式。
- 支持一元负号或浮点操作数。

**常见坑：**
- 颠倒操作数顺序，破坏 `-` 和 `/`。
- 使用 Python 的 `//`，向下取整导致负数除法错误。

**标签：** #algorithm

---

## 哈希表

### 34. 字母异位词分组

**难度：** 中等
**主题：** string, hashmap, sorting
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定字符串列表，把所有字母异位词归到同一组。

**思路：** 每个字符串的 key 用排序后的字符（每串 O(k log k)）或长度 26 的计数数组序列化为字符串（O(k)）。哈希分桶。总体 O(n * k)。讨论内存权衡及 Unicode 注意点。

**Python：**
```python
def group_anagrams(strs: list[str]) -> list[list[str]]:
    groups: dict[str, list[str]] = {}
    for s in strs:
        key = "".join(sorted(s))
        groups.setdefault(key, []).append(s)
    return list(groups.values())
```

**TypeScript：**
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

**Java：**
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

**要点：**
- 排序后字符串是最简单的规范 key。
- 用 26 长度的计数向量做 key 可避免每串排序，做到 O(n*k)。
- 题目对分组顺序无要求。

**标签：** #algorithm

---

### 35. 两数之和

**难度：** 简单
**主题：** array, hashmap, two-pointer
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定整数数组和目标值，返回相加等于目标值的两个数的下标。假设恰好有一个解；讨论若允许重复元素或多个数对时会有什么变化。

**思路：** 一次遍历，用哈希表记录「值 -> 下标」。对每个元素检查 `target - x` 是否已出现，若出现则返回已存下标与当前下标，否则记录 `x`。O(n) 时间，O(n) 空间。微软会追问的边界：补数等于当前值（如目标 6、值 3）——先查后插即可避免复用同一个下标。

**Python：**
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

**要点：**
- 哈希表把暴力 O(n^2) 扫描降为一次 O(n) 遍历。
- 先查补数再插入当前值，避免把某个元素与自身配对。
- 由于值映射到最新下标，负数与重复元素都能正确处理。

**常见追问：**
- 返回所有相加等于目标值的不同数对，而非只返回一个。
- 数组已排序时如何求解——用双指针做到 O(1) 空间。
- 处理数字逐个到达的数据流场景。

**常见坑：**
- 在查找之前就插入哈希表，可能把某个下标与自身配对。
- 在只保证答案唯一时，误以为数组元素也唯一。

**标签：** #algorithm

---

### 36. 和为 K 的子数组

**难度：** 中等
**主题：** array, hashmap, prefix-sum
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定整数数组和整数 k，返回和恰好为 k 的连续子数组的总个数。注意数组可能含负数，因此滑动窗口不适用——请讨论原因。

**思路：** 维护前缀和以及一个「前缀值 -> 出现次数」的哈希表，初始化为 `{0: 1}` 以覆盖从下标 0 开始的子数组。每一步累加 `count[prefix - k]`，因为有那么多个更早的前缀能构成和为 k 的子数组。O(n) 时间，O(n) 空间。关键讨论点：负数破坏了窗口的单调性假设，因此必须用前缀和计数而非双指针。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 子数组和为 k 当且仅当 `prefix[j] - prefix[i] == k`，故统计等于 `prefix - k` 的更早前缀数量。
- 用 `{0: 1}` 初始化，使从下标 0 开始的子数组也被计入。
- 存的是次数而非仅存在性，因为同一前缀值可能重复出现。

**常见追问：**
- 返回和为 k 的最长子数组，而非个数。
- 用前缀取模扩展为统计和能被 k 整除的子数组。
- 处理二维矩阵变体（子矩阵和等于目标值）。

**常见坑：**
- 漏掉 `{0: 1}` 初始化，导致从起点开始的子数组少计。
- 用集合而非频次表，丢失重复的前缀值。

**标签：** #algorithm

---

### 37. 最长连续序列

**难度：** 中等
**主题：** array, hashset, union-find
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定一个未排序的整数数组，返回最长连续整数序列的长度（元素在数组中的顺序无关紧要）。要求 O(n) 时间，并讨论为何不需要排序。

**思路：** 把所有值放入哈希集合。只从集合中没有前驱 `x - 1` 的值 `x` 开始计数——这保证每段连续序列只被遍历一次。当 `x + length` 存在时向上延伸，并记录最优值。O(n) 时间，O(n) 空间；集合成员判断取代了排序的 O(n log n)。微软会追问的边界：重复元素（用集合去重）与空数组返回 0。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 只从序列头部（不存在 `x - 1`）开始，使内层遍历总量为 O(n) 而非 O(n^2)。
- 哈希集合既去重又提供 O(1) 成员判断，从而免去排序。
- 空输入必须返回 0；该循环自然给出此结果。

**常见追问：**
- 返回实际的连续序列，而不只是长度。
- 用并查集求解，将每个值与其邻居合并。
- 处理数字随时间到达的流式版本。

**常见坑：**
- 从每个元素都向上延伸，退化为 O(n^2)。
- 忘记去重，此处会增加工作量但不影响正确性。

**标签：** #algorithm

---

## 二分查找

### 38. 搜索旋转排序数组

**难度：** 中等
**主题：** binary-search, arrays, divide-and-conquer
**岗位：** SWE
**级别：** L60-L62

**问题：** 一个升序且元素互不相同的数组在某个未知支点处被旋转。给定数组和目标值，在 O(log n) 时间内返回其下标，不存在则返回 -1。讨论为何普通二分会失败以及你要检查的边界情况。

**思路：** 一次二分。每次取 `mid` 时，左右两半中必有一半是有序的：比较 `nums[lo]` 与 `nums[mid]` 判断哪半有序，再判断目标是否落在该有序半区以决定移动方向。O(log n) 时间，O(1) 空间。微软会追问边界比较（`<=` 与 `<`）以及空数组情况。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- `[lo..hi]` 中总有一半是有序的；先识别它，再判断目标是否落在其中。
- O(log n) 时间，O(1) 空间——单次二分，无需先找支点。
- 闭区间 `while lo <= hi` 配合 `>>> 1`（Java）避免溢出；空数组立即返回 -1。

**常见追问：**
- 处理重复元素（搜索旋转排序数组 II）——最坏情况退化为 O(n)。
- 单独找出旋转支点下标，再在正确的区段上做经典二分。
- 目标不存在时返回应插入的位置。

**常见坑：**
- 比较 `nums[lo]` 与 `nums[mid]` 时用 `<` 而非 `<=`，会漏处理两元素情况。
- 忘记目标可能等于有序边界处的 `nums[lo]` 或 `nums[hi]`。

**标签：** #algorithm

---

### 39. 在排序数组中查找元素的第一个和最后一个位置

**难度：** 中等
**主题：** binary-search, arrays
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定一个非递减数组和目标值，返回目标的第一个和最后一个下标 `[first, last]`，不存在则返回 `[-1, -1]`。要求 O(log n)；讨论边界情况。

**思路：** 做两次二分，分别找左边界和右边界。共用一个辅助函数：当 `nums[mid] == target` 时记录当前 `mid`，但继续向左收缩（找第一个）或向右收缩（找最后一个）以逼近极端下标。O(log n) 时间，O(1) 空间。微软会考查目标不存在以及全部元素相等的情况。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 命中时记录下标，但继续向对应方向搜索，而不是立即返回。
- 两次独立的 O(log n) 二分——总计 O(log n) 时间，O(1) 空间。
- `res` 初始化为 -1，目标不存在或空数组时自然得到 `[-1, -1]`。

**常见追问：**
- 返回目标的总数（`last - first + 1`）。
- 推广为 `lower_bound` / `upper_bound`（第一个 `>= target` 与第一个 `> target`）。
- 数组不断增长的数据流场景——何时重建索引。

**常见坑：**
- 命中即返回只能得到任意一个出现位置，而非边界。
- 命中时移动了错误的指针（找第一个时收缩右侧）会得到错误的极端下标。

**标签：** #algorithm

---

### 40. 寻找旋转排序数组中的最小值

**难度：** 中等
**主题：** binary-search, arrays
**岗位：** SWE
**级别：** L60-L62

**问题：** 一个升序且元素互不相同的数组在某个未知支点处被旋转。在 O(log n) 时间内返回最小元素。讨论不变量以及数组实际未被旋转的情况。

**思路：** 二分，将 `nums[mid]` 与 `nums[hi]` 比较。若 `nums[mid] > nums[hi]`，最小值严格位于右侧（`lo = mid + 1`）；否则最小值在 `mid` 处或其左侧（`hi = mid`）。循环收缩到单个下标，即最小值。O(log n) 时间，O(1) 空间。微软会追问为何与 `nums[hi]`（而非 `nums[lo]`）比较能干净地处理未旋转数组。

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

**要点：**
- 与 `nums[hi]` 而非 `nums[lo]` 比较：完全有序（未旋转）数组会一直走 `hi = mid` 分支并收敛到下标 0。
- 使用 `while lo < hi` 配合 `hi = mid`（绝不用 `mid - 1`），既不跳过最小值候选，循环又能终止。
- O(log n) 时间，O(1) 空间；单元素数组直接返回该元素。

**常见追问：**
- 处理重复元素（寻找最小值 II）——当 `nums[mid] == nums[hi]` 时执行 `hi -= 1`，最坏 O(n)。
- 返回旋转次数（即最小值的下标）。
- 与目标搜索结合：先定位支点，再在正确区段做二分。

**常见坑：**
- 设置 `hi = mid - 1` 可能跳过真正的最小值。
- 与 `nums[lo]` 比较会错误处理已排序数组。

**标签：** #algorithm

---

## 动态规划

### 41. 买卖股票的最佳时机

**难度：** 简单
**主题：** arrays, dp, greedy
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定每日价格，找出单次买卖的最大收益。

**思路：** 一次遍历，维护 `min_seen` 和 `max_profit = max(max_profit, price - min_seen)`。O(n) 时间，O(1) 空间。微软追问：最多 2 笔、无限笔、含冷冻期、含手续费。

**Python：**
```python
def max_profit(prices: list[int]) -> int:
    lo = float("inf")
    best = 0
    for p in prices:
        lo = min(lo, p)
        best = max(best, p - lo)
    return best
```

**TypeScript：**
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

**Java：**
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

**要点：**
- 买在卖之前，所以先更新 `lo` 再算今天的收益。
- 单调下跌数组正确返回 0。
- 一次遍历 O(n)，胜过两两枚举的 O(n^2)。

**常见追问：**
- 最多 2 笔交易——四状态 DP。
- 无限笔——所有正的逐日差叠加。
- 带冷冻期 / 手续费——DP 加额外状态。
- 返回最优买卖的*日期下标*，而非收益。

**常见坑：**
- `lo` 初为 `prices[0]` 且从 0 开始遍历——产生一个瞬时 0 收益，本身无害但迷惑。
- 遇到新 `lo` 就重置 `best`——`best` 必须是贯穿全程的最大收益。

**标签：** #algorithm

---

### 42. 最大子数组和

**难度：** 中等
**主题：** arrays, dp, kadane
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定整数数组，找出和最大的连续子数组并返回该和。

**思路：** Kadane 算法：`cur = max(x, cur + x); best = max(best, cur)`。O(n) 时间，O(1) 空间。追问：同时返回下标。被问到时可讨论 O(n log n) 的分治变体。

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
static int maxSubArray(int[] nums) {
    int cur = nums[0], best = nums[0];
    for (int i = 1; i < nums.length; i++) {
        cur = Math.max(nums[i], cur + nums[i]);
        best = Math.max(best, cur);
    }
    return best;
}
```

**要点：**
- `cur` 表示以当前下标结尾的最佳子数组和。
- 全负数组正确返回最大单元素。
- 若需下标：每次 `cur` 重置为 `nums[i]` 时记录新的起点。

**标签：** #algorithm

---

### 43. 回文子串数

**难度：** 中等
**主题：** string, dp, two-pointers
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定字符串，统计有多少个子串是回文。

**思路：** 中心扩展：对每个下标，分别按奇长度、偶长度中心扩展，只要两端字符相等就计数。O(n^2) 时间，O(1) 空间。Manacher 可做到 O(n)——提一句即可，未被要求别写。

**Python：**
```python
def count_substrings(s: str) -> int:
    def grow(l: int, r: int) -> int:
        c = 0
        while l >= 0 and r < len(s) and s[l] == s[r]:
            c += 1; l -= 1; r += 1
        return c
    return sum(grow(i, i) + grow(i, i + 1) for i in range(len(s)))
```

**TypeScript：**
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

**Java：**
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

**要点：**
- 每一次成功扩张恰好对应一个回文子串。
- 必须同时枚举奇 (`i, i`) 和偶 (`i, i+1`) 两种中心。
- Manacher 算法可 O(n)，面试很少强制要求。

**标签：** #algorithm

---

### 44. 打家劫舍

**难度：** 中等
**主题：** dp, arrays
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定数组表示每户金额，求在不偷相邻两户的前提下最多能偷多少。

**思路：** DP：`f(i) = max(f(i-1), f(i-2) + nums[i])`。只保留 `prev2, prev1` 两个标量。O(n) 时间，O(1) 空间。追问：打家劫舍 II（环形）——跑两次，分别排除第一户或最后一户。

**Python：**
```python
def rob(nums: list[int]) -> int:
    prev2 = prev1 = 0
    for x in nums:
        prev2, prev1 = prev1, max(prev1, prev2 + x)
    return prev1
```

**TypeScript：**
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

**Java：**
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

**要点：**
- 每户两种选择：拿（加 i-2 的最优）或不拿。
- 两个滚动标量足够，完整 DP 数组多余。
- 空输入安全返回 0。

**标签：** #algorithm

---

### 45. 零钱兑换

**难度：** 中等
**主题：** dp, arrays
**岗位：** SWE
**级别：** L62-L63

**问题：** 给定硬币面额与目标金额，返回凑出该金额所需最少硬币数；不行返回 -1。

**思路：** 自底向上 DP：`dp[a] = min(dp[a - c] + 1)`，遍历所有 c <= a。`dp[0] = 0`，其余 `inf`。O(amount * coins) 时间，O(amount) 空间。也可看作从 0 到 amount 的 BFS 最短路。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- `dp[0] = 0` 是基态；`inf` 表示不可达。
- O(amount * |coins|) 时间，O(amount) 空间。
- 按硬币层的 BFS 同样可行，且一旦到达 amount 即可停。

**标签：** #algorithm

---

### 46. 解码方法

**难度：** 中等
**主题：** dp, string
**岗位：** SWE
**级别：** L62-L63

**问题：** A-Z 编码为 1-26 的消息。给定数字串，返回有多少种解码方式。

**思路：** DP：`f(i) = (s[i-1] != '0' ? f(i-1) : 0) + (10 <= int(s[i-2..i]) <= 26 ? f(i-2) : 0)`。边界：前导零、`"0"`、`"30"`。O(n) 时间，O(1) 空间（两个标量）。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 两条转移：单字符（非 0）或两字符（10–26）。
- `"0"` 或前导零均无法解码，返回 0 种。
- 两个标量给到 O(1) 空间；完整 DP 数组不必要。

**标签：** #algorithm

---

### 47. 爬楼梯

**难度：** 简单
**主题：** dp, recursion
**岗位：** SWE
**级别：** L60-L62

**问题：** 每次上 1 阶或 2 阶，爬 n 阶有多少种不同方法？

**思路：** 斐波那契：`f(n) = f(n-1) + f(n-2)`。两个标量迭代。O(n) 时间，O(1) 空间。讨论记忆化 vs 表格法；被追问时给矩阵快速幂 O(log n)。

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
  for (let i = 0; i < n; i++) [a, b] = [b, a + b];
  return a;
}
```

**Java：**
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

**要点：**
- 基态：`f(0) = f(1) = 1`。
- O(n) 时间，O(1) 空间——两个标量轮换。
- 矩阵快速幂可降到 O(log n)，但本题没必要。

**标签：** #algorithm

---

### 48. 最长回文子串

**难度：** 中等
**主题：** string, dp, two-pointers
**岗位：** SWE
**级别：** L62-L63

**问题：** 给定字符串，返回最长回文子串。

**思路：** 中心扩展：对每个下标分别尝试奇、偶中心，两端字符相等就扩张。记录最佳 (start, length)。O(n^2) 时间，O(1) 空间。Manacher 可 O(n)，微软面试很少强制要求。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 每个下标都要尝试奇（单中心）与偶（双中心）两种情况。
- 用长度差比较记录最佳，避免反复切片。
- O(n^2) 时间，O(1) 空间；Manacher 可 O(n)，本场鲜少要求。

**标签：** #algorithm

---

### 49. 最长递增子序列

**难度：** 中等
**主题：** dp, binary-search
**岗位：** 高级 SWE
**级别：** L62-L63

**问题：** 给定整数数组，返回最长严格递增子序列的长度。

**思路：** O(n^2) DP：`f(i) = 1 + max(f(j) for j < i if nums[j] < nums[i])`。O(n log n)：维护 `tails[]`，`tails[k]` 是所有长度为 k+1 的递增子序列的最小尾元素；新元素二分查找。注意：`tails` 本身不是一条合法 LIS，但其长度正确。

**Python：**
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
    if (lo === tails.length) tails.push(x);
    else tails[lo] = x;
  }
  return tails.length;
}
```

**Java：**
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

**要点：**
- `tails[k]` 是长度为 k+1 的递增子序列的最小尾元素。
- 二分替换保持 `tails` 有序，每次 O(log n)。
- `tails` 本身不一定是合法 LIS，但其长度即正确答案。

**标签：** #algorithm

---

### 50. 编辑距离

**难度：** 困难
**主题：** dp, string
**岗位：** 高级 SWE
**级别：** L62-L63

**问题：** 给定两个字符串，求把其一变成另一所需的最少插入、删除、替换次数。

**思路：** 二维 DP：字符相同时 `dp[i][j] = dp[i-1][j-1]`；否则 `1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])`。O(m*n) 时间和空间。保留两行可压到 O(min(m, n)) 空间。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 三种转移分别对应插入、删除、替换。
- 首行/首列编码"把空前缀变成对方"的代价。
- 双行滚动可把空间压到 O(min(m, n))。

**标签：** #algorithm

---

### 51. 不同路径

**难度：** 中等
**主题：** dp, combinatorics, arrays
**岗位：** SWE
**级别：** L60-L62

**问题：** 机器人从 `m x n` 网格左上角出发，每次只能向右或向下移动，求到达右下角的不同路径数。讨论空间上的取舍。

**思路：** DP 转移 `dp[i][j] = dp[i-1][j] + dp[i][j-1]`，首行首列全为 1。压缩成一维滚动数组即 `dp[j] += dp[j-1]`，O(m*n) 时间、O(n) 空间。微软会追问的边界：宽或高为 1 的网格恰好只有一条路径；组合数闭式 C(m+n-2, m-1) 是很好的延伸。

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
  const dp = new Array<number>(n).fill(1);
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      dp[j] += dp[j - 1];
    }
  }
  return dp[n - 1];
}
```

**Java：**
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

**要点：**
- 基态：整个首行与首列均为 1（到达它们只有一种走法）。
- 一维滚动数组把空间从 O(m*n) 降到 O(n)；`dp[j-1]` 已是本行值，`dp[j]` 仍是上一行值。
- 闭式解为 C(m+n-2, m-1)，O(min(m,n)) 时间。

**常见追问：**
- 不同路径 II：部分格子有障碍（将其 `dp` 置 0）。
- 带权网格上的路径（改为最小路径和）。
- 返回具体路径而非仅计数。

**常见坑：**
- `j` 从 0 开始遍历会用自加破坏首列基态。
- 大网格在 Java/TS 中会溢出——需提及 `long`/BigInt。

**标签：** #algorithm

---

### 52. 最长公共子序列

**难度：** 中等
**主题：** dp, string, arrays
**岗位：** SWE
**级别：** L62-L63

**问题：** 给定两个字符串，返回它们最长公共子序列的长度（子序列保持相对顺序但不要求连续）。并讨论如何还原出该子序列本身。

**思路：** 对前缀做二维 DP：若 `a[i-1] == b[j-1]` 则 `dp[i][j] = dp[i-1][j-1] + 1`，否则取 `max(dp[i-1][j], dp[i][j-1])`。O(m*n) 时间与 O(m*n) 空间，可用两行压缩到 O(min(m,n))。微软关注的坑是把子序列和子串（连续性）混淆。

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

**Java：**
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

**要点：**
- 额外一圈 0 的行列干净地编码了空前缀基态。
- 匹配时沿对角线延伸；不匹配则从任一串去掉一个字符。
- O(m*n) 时间；因为只用到 `i-1` 与 `i`，空间可压到两行。

**常见追问：**
- 通过回溯 DP 表还原真正的 LCS。
- 最长公共子串（连续）——不匹配时归 0 并记录最大值。
- 编辑距离 / 最短公共超序列共享同一套框架。

**常见坑：**
- 字符串下标 `i-1` 与 DP 下标 `i` 的错位。
- 把子序列与子串混为一谈。

**标签：** #algorithm

---

### 53. 单词拆分

**难度：** 中等
**主题：** dp, string, hashset
**岗位：** SWE
**级别：** L62-L63

**问题：** 给定字符串 `s` 与一个单词字典，判断 `s` 能否被拆分成一个或多个字典单词以空格连接的序列，单词可重复使用。讨论边界情形。

**思路：** DP 中 `dp[i]` 表示 `s[:i]` 是否可拆；当存在 `j < i` 使 `dp[j]` 为真且 `s[j:i]` 在字典（用哈希集合实现 O(1) 查找）中时 `dp[i]` 为真。O(n^2) 个子串乘以 O(k) 的哈希开销。微软会追问空串基态 `dp[0] = True` 以及找到切分后提前 `break`。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- `dp[0] = True` 表示空前缀，使第一个真实单词得以锚定。
- 哈希集合查找让每次子串检查为 O(长度)，而非扫描整个列表。
- O(n^2) 个子串对；在首个有效切分处 `break` 是小常数优化。

**常见追问：**
- 单词拆分 II：返回所有句子（带记忆化的回溯）。
- 用最大单词长度限制内层循环以剪枝。
- 面对超大字典改用 Trie 而非集合。

**常见坑：**
- 漏掉 `dp[0] = True` 会让所有答案都为假。
- 无记忆化的朴素递归是指数级（如 "aaaaa...ab"）。

**标签：** #algorithm

---

## 回溯

### 54. 单词搜索

**难度：** 中等
**主题：** backtracking, matrix, dfs
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定 2D 字母板和一个单词，返回单词能否由相邻单元格（水平/竖直、不复用单元）构造。

**思路：** 从匹配 `word[0]` 的每个单元 DFS。临时把单元设为哨兵字符标记已访问，回溯时复原（省掉 O(mn) 的 visited 数组）。最坏 O(m*n*4^L)。追问：单词搜索 II（多单词）→ trie + DFS。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 直接改写 board 作访问标记，省去 O(m*n) 的 visited。
- 回溯时复原，保证其他起点仍可用。
- 最坏 O(m*n*4^L)；字符不匹配能尽早剪枝。

**常见追问：**
- Word Search II——一次查询多个单词，trie + DFS。
- 允许对角移动——从 4 方向变 8 方向。
- 可复用单元——另一类问题（可能无限路径）。
- 返回所有匹配的起点，而非仅 true/false。

**常见坑：**
- 回溯时忘了复原——只能走首次 DFS。
- 用可能出现在词里的字母作哨兵——选非字母哨兵。

**标签：** #algorithm

---

### 55. 括号生成

**难度：** 中等
**主题：** backtracking, recursion, string
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定 n，生成所有 n 对合法括号的组合。

**思路：** 回溯，维护 `open` 与 `close` 两个计数：`open < n` 时可加 '('，`close < open` 时可加 ')'。长度到 `2n` 时停。输出数为 Catalan(n)。比枚举 2^(2n) 字符串再筛选干净得多。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 只生成合法前缀，结尾无需再做校验。
- 每条结果长度恰好 `2n`。
- 输出数为第 n 个 Catalan 数。

**标签：** #algorithm

---

### 56. 子集

**难度：** 中等
**主题：** backtracking, bit-manipulation
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定一组不重复整数，返回所有可能的子集（幂集）。

**思路：** 三种方法。迭代：每来一个新元素，把已有子集复制一份并追加该元素。回溯：每个下标选/不选。位掩码：枚举 `0..2^n - 1`，第 i 位为 1 就包含 `nums[i]`。O(n * 2^n) 时间和空间。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 回溯靠 `start` 下标保证每个子集恰好生成一次。
- 输出 `2^n` 个子集，总时间 O(n * 2^n)。
- 位掩码枚举是另一种优雅写法，适合小 n。

**标签：** #algorithm

---

### 57. 全排列

**难度：** 中等
**主题：** backtracking, recursion
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定不重复整数列表，返回所有可能的排列。

**思路：** 回溯加 `used[]` 数组（或原地交换）。O(n! * n) 时间。带重复元素的全排列 II：先排序，跳过 `nums[i] == nums[i-1] && !used[i-1]` 以去重。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- `used[]` 保证每个元素在一条排列中只出现一次。
- 共 n! 条排列，每条 O(n) 构造——总 O(n! * n)。
- 含重复时需排序并跳过 `nums[i] == nums[i-1] && !used[i-1]`。

**标签：** #algorithm

---

### 58. 组合总和

**难度：** 中等
**主题：** backtracking, recursion
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定不重复正整数数组与目标值，返回所有元素之和等于目标的组合（每个数可无限次使用）。

**思路：** 先排序，DFS 带 start 下标（仍从 i 起以允许重复使用）。`remaining < 0` 或当前候选 > remaining 时剪枝。沿路径回溯。复杂度取决于解数。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 递归传 `i`（不是 `i+1`）即可允许同一候选重复使用。
- 排序之后可在 `c > remaining` 时直接 break。
- 复杂度由解的个数主导，剪枝对性能至关重要。

**标签：** #algorithm

---

### 59. 电话号码的字母组合

**难度：** 中等
**主题：** backtracking, string, recursion
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定一个仅含数字 2-9 的字符串，返回它在经典电话键盘上能表示的所有字母组合，顺序不限。需处理空输入。

**思路：** 按数字位置回溯：在下标 `i` 处尝试映射到 `digits[i]` 的每个字母，递归到 `i+1`，再撤销。长度为 n 时最多有 4^n 种组合，故构建字符串的时间为 O(4^n * n)，递归深度 O(n)。微软坚持的边界：空输入返回空列表，而非 `[""]`。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 每个数字对应一层递归；循环在该数字的字母上展开。
- 先追加再弹出，让 `path` 作为共享可变缓冲（经典回溯手法）。
- 最多 4^n 个结果，故 O(4^n * n) 时间；递归深度 O(n)。

**常见追问：**
- 用不断扩展的列表迭代实现（BFS 式的笛卡尔积）。
- 处理 0 与 1（无字母）——跳过或拒绝。
- 用生成器流式产出结果，而非一次性全部物化。

**常见坑：**
- 空输入返回 `[""]` 而非 `[]`。
- 忘记弹出，导致字母在各分支间串味。

**标签：** #algorithm

---

### 60. 复原 IP 地址

**难度：** 中等
**主题：** backtracking, string, recursion
**岗位：** SWE
**级别：** L62-L63

**问题：** 给定一个数字字符串，返回通过插入三个点能构成的所有合法 IPv4 地址。四个段每个必须在 0-255 之间且无前导零（"0" 本身除外）。讨论合法性规则与边界情形。

**思路：** 回溯在每个位置尝试长度 1-3 的段，要求恰好四段且用尽整个字符串。每个候选段需校验取值范围（<=255）与前导零。长度有界（有效数字 <=12），故搜索实际上是常数级；微软希望讨论的是精确的合法性：拒绝 "01" 与 "256"，接受单独的 "0"。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 两个联合约束：恰好 4 段且整串被用尽。
- 合法性 = 无前导零（除非该段恰为 "0"）且数值 <= 255。
- 段长上限为 3，故分支有界、剪枝自然。

**常见追问：**
- 扩展到 IPv6（8 组十六进制、`::` 压缩）。
- 只统计合法复原数量而非列出全部。
- 提前拒绝短于 4 或长于 12 位的输入。

**常见坑：**
- 接受了 "01"、"00" 这类带前导零的段。
- 凑够 4 段就收，却没检查字符串是否被完全用尽。

**标签：** #algorithm

---

## 图

### 61. 岛屿数量

**难度：** 中等
**主题：** graph, dfs, bfs, matrix, union-find
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定一个由 '1'（陆地）和 '0'（水）组成的二维网格，统计岛屿数量（上下左右四个方向相连的陆地算一个岛）。讨论 DFS、BFS 与并查集的取舍，以及如何处理超大网格。

**思路：** 遍历每个格子，遇到未访问的陆地时计数加一，并通过淹没（把相连的 '1' 置为 '0'）填满整座岛。每个格子只访问一次，时间复杂度 O(m*n)，最坏情况下递归栈空间 O(m*n)。微软会追问的边界：空网格或单行/单列网格，以及全是陆地的巨大网格导致的栈溢出（改用显式栈或 BFS 淹没）。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 通过就地把陆地标记为已访问来做填充，无需额外的 visited 集合。
- 每个格子只处理一次：时间 O(m*n)，最坏递归深度 O(m*n)。
- 索引 `grid[0]` 前先处理空网格的情况。

**常见追问：**
- 把递归 DFS 改成 BFS 或显式栈，避免大输入下的栈溢出。
- 用并查集实现，并对比复杂度与代码可读性。
- 支持对角线（八方向）连通，或统计不同形状的岛屿数量。

**常见坑：**
- 修改网格会破坏输入；若调用方需要保留原图请先拷贝。
- 邻居越界时的边界判断出现差一错误。

**标签：** #algorithm

---

### 62. 课程表（拓扑排序）

**难度：** 中等
**主题：** graph, topological-sort, bfs, cycle-detection
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定 `numCourses` 和先修课程对列表 `[a, b]`（表示学 `a` 之前必须先学 `b`），判断能否修完所有课程。请准备好说明如何检测环以及边界情况。

**思路：** 把课程建模为有向图并运行 Kahn 算法：先计算入度，把所有入度为 0 的课程放入队列，然后不断出队一门课并把其后继的入度减一，减到 0 的入队。若处理过的课程数等于 `numCourses`，说明无环、所有课程都能修完；否则存在环。时间复杂度 O(V+E)，空间 O(V+E)。讨论点：空先修列表（显然为真），以及残留的正入度如何定位环。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- Kahn 的 BFS 既能拓扑排序又能检测环：处理过的节点少于总数即存在环。
- 边的方向很关键：`[a, b]` 添加从 b 到 a 的边，且 a 的入度增加。
- 时间与空间均为 O(V+E)；无递归，故无栈溢出风险。

**常见追问：**
- 返回一个真实的合法排序（课程表 II），在出队时依次收集节点即可。
- 用 DFS 加三色标记法检测环来解同一问题。
- 报告哪些课程构成了环。

**常见坑：**
- 把边的方向搞反，导致入度计算错误。
- 忘记把没有先修要求的课程放入初始队列。

**标签：** #algorithm

---

### 63. 克隆图

**难度：** 中等
**主题：** graph, dfs, bfs, hash-map
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定一个连通无向图中某个节点的引用，返回该图的深拷贝（克隆）。讨论如何在有环的情况下避免死循环，以及如何处理空图。

**思路：** 从给定节点开始 DFS，同时维护一个从原节点到克隆节点的哈希表。首次遇到某节点时先创建其克隆并在递归前记入哈希表，然后对每个邻居递归并把返回的克隆连接上去。在递归前先记录克隆正是打破环的关键。时间与空间均为 O(V+E)。微软会追问的边界：输入节点为 null，以及带自环的单节点。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 原节点到克隆的映射既是 visited 集合，也是正确连接邻居的手段。
- 必须在递归前把克隆放入映射，否则有环时会无限递归。
- 时间与空间均为 O(V+E)；每个节点与每条边只处理一次。

**常见追问：**
- 用 BFS 加队列改写成迭代遍历。
- 克隆有向图，或克隆带节点元数据/权重的图。
- 给定所有节点列表，处理非连通图的克隆。

**常见坑：**
- 创建了克隆但在递归后才写入映射，重新引入了环的 bug。
- 返回的是原邻居对象而不是它们的克隆。

**标签：** #algorithm

---

### 64. 单词接龙

**难度：** 困难
**主题：** graph, bfs, string, shortest-path
**岗位：** 高级 SWE
**级别：** L62-L63

**问题：** 给定 `beginWord`、`endWord` 和 `wordList`，返回从 `beginWord` 到 `endWord` 的最短转换序列长度，每次只能改变一个字母，且每个中间词都必须在词表中；无法转换则返回 0。讨论分支因子以及如何加速搜索。

**思路：** 把每个单词看作节点，与其相差恰好一个字母的单词之间连边，然后从 `beginWord` 做 BFS 求最短路径。不要两两比较，而是对每个位置尝试全部 26 个字母生成邻居并在集合中查询，同时把访问过的词移除以防重复访问。设有 N 个长度为 L 的单词，时间复杂度 O(N*L*26)，空间 O(N*L)。微软会追问的边界：`endWord` 不在词表中（返回 0），以及用双向 BFS 削减指数级的搜索前沿。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- BFS 保证第一次到达 `endWord` 时即为最短序列。
- 用 26 字母替换生成邻居，对长词表优于 O(N^2) 的两两比较。
- 入队时从集合中移除单词，避免重复访问与成环。

**常见追问：**
- 从两端同时做双向 BFS，可将搜索深度大致减半。
- 单词接龙 II：返回所有最短转换序列，而不仅是长度。
- 预计算通配模式（如 `h*t`）作为邻接索引，加速邻居查找。

**常见坑：**
- 因 `endWord` 不在词表中而返回 0 或陷入死循环。
- 步数差一（序列长度包含首尾两个端点）。

**标签：** #algorithm

---

## 双指针 / 滑动窗口

### 65. 三数之和

**难度：** 中等
**主题：** array, two-pointers, sorting
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定整数数组 `nums`，返回所有满足 `a + b + c == 0` 的不重复三元组 `[a, b, c]`。讨论如何去重以及边界情况。

**思路：** 先排序，然后固定下标 `i`，对剩余部分用双指针（`lo`、`hi`）寻找补数 `-nums[i]`。跳过重复的锚点和重复的配对端点以保证三元组唯一。O(n^2) 时间，O(1) 额外空间（不计输出与排序）。微软会追问去重逻辑以及 `nums[i] > 0` 时的提前退出。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 排序使双指针移动成为可能，并让去重变得简单。
- 跳过重复锚点（`nums[i] == nums[i-1]`）以及命中后重复的端点。
- O(n^2) 时间由内层扫描主导；排序为 O(n log n)。
- 当 `nums[i] > 0` 时提前退出，因为正锚点无法与更大的值相加为零。

**常见追问：**
- 通过递归推广到 kSum，直到双指针作为基例。
- 返回三元组的数量而非三元组本身。
- 3Sum Closest——追踪与目标绝对差最小的和。

**常见坑：**
- 命中后忘记同时推进两个指针——死循环。
- 用元组集合去重而非指针跳过——可行但浪费内存。

**标签：** #algorithm

---

### 66. 盛最多水的容器

**难度：** 中等
**主题：** array, two-pointers, greedy
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定 `height[]`，每个元素代表一条垂直线，找出两条线使其与 x 轴围成的容器盛水最多。返回最大面积并论证贪心移动为何正确。

**思路：** 从最宽的容器开始（`lo = 0`、`hi = n-1`）向内收缩。面积为 `(hi - lo) * min(height[lo], height[hi])`；总是移动较矮那条线，因为移动较高的线绝不会增加高度，只会损失宽度。O(n) 时间，O(1) 空间。微软希望听到舍弃较矮线的正确性论证。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 面积受较矮线约束，因此只有移动它才可能带来提升。
- 一次线性扫描优于遍历所有配对的 O(n^2) 暴力法。
- O(n) 时间，O(1) 空间——无需额外数据结构。
- 高度相等时移动任一指针均可，不影响结果。

**常见追问：**
- 接雨水——相关但对每根柱子累计水量，而非单一配对。
- 返回实际的下标对，而不仅是面积。
- 证明贪心不会跳过最优配对。

**常见坑：**
- 用较高线而非较矮线相乘。
- 宽度差一——应为 `hi - lo`，而非 `hi - lo + 1`。

**标签：** #algorithm

---

### 67. 无重复字符的最长子串

**难度：** 中等
**主题：** string, sliding-window, hashmap
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定字符串 `s`，返回不含重复字符的最长子串的长度。讨论滑动窗口不变量以及空串边界情况。

**思路：** 滑动窗口 `[start, i]`，用哈希表记录每个字符最后出现的下标。当当前字符曾在 `start` 或其后出现过时，把 `start` 跳到该下标之后一位——绝不回退。同时追踪最优窗口长度。O(n) 时间，O(min(n, 字符集)) 空间。微软会追问为何用 `max`/`>= start` 来避免重新纳入过期的重复字符。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 记录最后出现的下标（而不仅是是否出现），使 `start` 能 O(1) 跳转。
- `prev >= start` 判断可防止对窗口外的重复字符把 `start` 回退。
- O(n) 时间——每个下标访问一次；窗口从不回退。
- 空串自然返回 0，因为循环不执行。

**常见追问：**
- 返回子串本身而非仅其长度。
- 至多含 k 个不同字符的最长子串（计数表变体）。
- 将字符集限定为 ASCII，用固定大小数组替换哈希表。

**常见坑：**
- 去掉 `>= start` 判断，导致 `start` 回退。
- 遇到重复时重置整个窗口而非定向跳转——退化为 O(n^2)。

**标签：** #algorithm

---

## 矩阵

### 68. 螺旋矩阵

**难度：** 中等
**主题：** matrix, simulation
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定 m x n 矩阵，按螺旋顺序返回所有元素。

**思路：** 维护 4 个边界 `top, bottom, left, right`。循环：上行 L→R，右列 T→B，判断 `top <= bottom` 后下行 R→L，判断 `left <= right` 后左列 B→T。每轮收紧边界。边界：单行、单列。纯模拟——微软喜欢干净的 off-by-one 处理。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 单行/单列时跳过下行与左列扫描，避免重复元素。
- 每完成一圈，四个边界各收 1。
- O(m*n) 时间，O(1) 额外空间（不含输出）。

**常见追问：**
- 从 1..n^2 构造螺旋矩阵（Spiral Matrix II）。
- 任意起始位置或方向的螺旋。
- 改为对角线顺序遍历。
- 非矩形网格（锐齿 2D 数组）上的螺旋。

**常见坑：**
- 跳过 `top < bot && left < right` 护栏——最后一圈会重复。
- 跳过行/列扫描前先调边界——遗漏元素。

**标签：** #algorithm

---

### 69. 矩阵置零

**难度：** 中等
**主题：** matrix, in-place
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定 m x n 矩阵，若某元素为 0，则将其所在行和列全部置为 0。要求原地完成。

**思路：** 用第一行和第一列作为标记数组。单独用两个布尔变量记录第 0 行/第 0 列本身是否需要置零。两遍：标记、应用。最后按标记处理第 0 行/列。O(mn) 时间，O(1) 额外空间。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 首行/首列复用为标记数组，实现 O(1) 额外空间。
- 两个布尔变量保留首行/首列自身的原始 0 信息。
- 必须先处理内部单元，再清零首行/首列，否则会丢失标记。

**标签：** #algorithm

---

### 70. 旋转图像

**难度：** 中等
**主题：** matrix, in-place
**岗位：** SWE
**级别：** L60-L62

**问题：** 原地将 n x n 矩阵顺时针旋转 90 度。

**思路：** 先转置（对 `i<j` 交换 `M[i][j]` 和 `M[j][i]`），再逐行翻转。O(n^2) 时间，O(1) 空间。讨论：逆时针 = 转置 + 翻转列；180 度 = 翻转行 + 翻转列。

**Python：**
```python
def rotate(matrix: list[list[int]]) -> None:
    n = len(matrix)
    for i in range(n):
        for j in range(i + 1, n):
            matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
    for row in matrix:
        row.reverse()
```

**TypeScript：**
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

**Java：**
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

**要点：**
- 转置 + 行翻转 = 顺时针 90 度。
- 内层从 `i+1` 起，避免一对元素被交换两次（等于没换）。
- O(n^2) 时间、O(1) 额外空间，满足原地要求。

**标签：** #algorithm

---

### 71. 设计井字棋

**难度：** 中等
**主题：** design, matrix
**岗位：** SWE
**级别：** L62-L63

**问题：** 设计 n x n 的井字棋（Tic-Tac-Toe），每步落子后 O(1) 返回胜者（无胜者返回 0）。

**思路：** 维护 `rows[n]`、`cols[n]`、`diag`、`antiDiag` 计数；玩家 1 加 +1，玩家 2 加 -1。在 `(r, c)` 落子后检查 `rows[r]`、`cols[c]`、`diag`（若 r==c）、`antiDiag`（若 r+c==n-1）是否达到 +n 或 -n。每步 O(1)，O(n) 内存。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 用带符号计数（+1/-1）让单一变量覆盖两个玩家。
- 每步只可能影响触碰到的那一行、一列、对角线，只需检查这四处。
- 每步 O(1) 时间，O(n) 内存，与对局长度无关。

**标签：** #algorithm

---

### 72. 搜索二维矩阵 II

**难度：** 中等
**主题：** matrix, binary-search, two-pointer
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定一个 m x n 矩阵，每一行从左到右升序、每一列从上到下升序，判断目标值是否存在。讨论它与逐行二分查找的取舍。

**思路：** 从右上角开始。若当前值等于目标返回 true；若大于目标，则其下方整列都过大，向左移动；若小于目标，则其左侧整行都过小，向下移动。每一步消去一行或一列，得到 O(m + n) 时间、O(1) 空间。微软会追问的边界：空矩阵或空首行必须在索引前先判断。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 右上角（或左下角）是关键支点，一个方向递增、另一个方向递减。
- 每次比较丢弃整行或整列，故 O(m + n) 优于 m 次独立二分的 O(m log n)。
- 索引 `matrix[0]` 前先判断空矩阵与空行。

**常见追问：**
- 返回目标的坐标，而非布尔值。
- 统计有多少个单元格小于目标值。
- 与整体按行主序排序的矩阵（搜索二维矩阵 I）的二分查找作对比。

**常见坑：**
- 从左上角或右下角开始，两个方向变化一致，消去逻辑失效。
- 初始化 `c = n - 1` 时列下标出现差一错误。

**标签：** #algorithm

---

## 数组 / 字符串

### 73. Excel 表列名称

**难度：** 简单
**主题：** math, string
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定列序号，返回对应的 Excel 表列名称（1 → A，28 → AB，701 → ZY）。

**思路：** 改造的 1-indexed 26 进制（无 0 数字）。循环：`n--; c = 'A' + n % 26; n /= 26;` 前插 `c`。O(log n) 时间。微软经典 off-by-one 考点——他们想看你能推出 `n--` 这一步。

**Python：**
```python
def convert_to_title(n: int) -> str:
    out: list[str] = []
    while n > 0:
        n -= 1
        out.append(chr(ord("A") + n % 26))
        n //= 26
    return "".join(reversed(out))
```

**TypeScript：**
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

**Java：**
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

**要点：**
- `n--` 把 1-indexed 体系平移到 0-indexed 的 26 进制。
- 从低位到高位生成字符，再反转（或前插）。
- O(log_26 n) 次迭代，对任意大输入仍适用。

**标签：** #algorithm

---

### 74. 寻找峰值

**难度：** 中等
**主题：** binary-search, arrays
**岗位：** SWE
**级别：** L60-L62

**问题：** 峰值严格大于相邻元素。给定 `nums[i] != nums[i+1]` 的数组，O(log n) 返回任一峰值下标。

**思路：** 二分：比较 `mid` 与 `mid+1`。若 `nums[mid] < nums[mid+1]`，峰值在右（`lo = mid+1`）；否则在左（`hi = mid`）。直到 `lo == hi`。O(log n) 时间。`nums[-1] = nums[n] = -inf` 的边界保证一定存在峰值。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 上坡方向必有峰值。
- 循环结束时 `lo == hi`，指向一个峰值下标。
- 虚拟的 `-inf` 边界保证任意数组都存在峰值。

**标签：** #algorithm

---

### 75. 只出现一次的数字 III

**难度：** 中等
**主题：** bit-manipulation, arrays
**岗位：** SWE
**级别：** L62-L63

**问题：** 数组中恰好两个元素只出现一次，其余都出现两次。O(n) 时间、O(1) 空间找出这两个元素。

**思路：** 全部 XOR 得 `a ^ b`。任取一个置位的 bit（如 `xor & -xor`）——该位在 a 与 b 上不同。按该位把数组分两组，分别 XOR 即得 a 和 b。O(n) 时间，O(1) 空间。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- XOR 抵消成对元素，仅剩 `a ^ b`。
- `x & -x` 取最低置位 bit——任何差异 bit 都行。
- 第二遍按该 bit 分两组分别 XOR 得到两个唯一元素。

**标签：** #algorithm

---

### 76. 两整数之和（不用 + 运算符）

**难度：** 中等
**主题：** bit-manipulation, math
**岗位：** SWE
**级别：** L62-L63

**问题：** 不使用 `+` 或 `-` 运算符，计算两整数之和。

**思路：** 循环：`sum = a ^ b; carry = (a & b) << 1; a = sum; b = carry;` 直到 `b == 0`。在无任意精度整型的语言（Java/C++）中使用无符号语义或 32 位掩码。讨论负数的二进制补码处理。

**Python：**
```python
def get_sum(a: int, b: int) -> int:
    mask = 0xFFFFFFFF
    while b & mask:
        a, b = (a ^ b) & mask, ((a & b) << 1) & mask
    return a if a <= 0x7FFFFFFF else ~(a ^ mask)
```

**TypeScript：**
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

**Java：**
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

**要点：**
- XOR 得无进位和，AND 左移得进位。
- 进位为 0 时结束（32 位最多 32 轮）。
- Python 需要 32 位掩码模拟定宽溢出。

**复杂度：** O(1)——对 32 位整数最多 32 轮进位传播；O(1) 空间。

**标签：** #algorithm

---

### 77. 2 的幂

**难度：** 简单
**主题：** bit-manipulation, math
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定整数 n，判断其是否为 2 的幂。

**思路：** `n > 0 && (n & (n - 1)) == 0`。原因：2 的幂只置 1 位；减 1 把那位翻为 0 并把更低位全置 1，与之 AND 为 0。O(1)。边界：0 与负数都不是。

**Python：**
```python
def is_power_of_two(n: int) -> bool:
    return n > 0 and (n & (n - 1)) == 0
```

**TypeScript：**
```typescript
function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}
```

**Java：**
```java
static boolean isPowerOfTwo(int n) {
    return n > 0 && (n & (n - 1)) == 0;
}
```

**要点：**
- 2 的幂恰好只有一位为 1。
- `n - 1` 翻转该位并点亮所有低位，AND 为 0。
- 必须额外加 `n > 0`，因为 0 和负数在补码下也会"通过"位运算判断。

**标签：** #algorithm

---

### 78. KMP 字符串匹配

**难度：** 困难
**主题：** string, kmp
**岗位：** 高级 SWE
**级别：** L62-L63

**问题：** 实现 KMP，在 O(n + m) 内找出模式串在文本中的所有出现位置。

**思路：** 构造失配（LPS）数组：模式每个前缀的最长既是前缀又是后缀的真子串长度。文本只扫一次，失配时按 LPS 回退，已匹配字符不再比较。O(n + m) 时间，O(m) 空间。微软希望你能现场推 LPS 构造过程。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- `lps[i]` = `pattern[..i]` 的最长既是前缀又是后缀的真子串长度。
- 失配时跳回 `lps[j-1]`，不再从头开始扫。
- 总开销 O(n + m)：j 至多增加 n 次，回退单调。

**标签：** #algorithm

---

### 79. 合并区间

**难度：** 中等
**主题：** array, sorting, intervals
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定区间列表 `[start, end]`，合并所有重叠区间并返回互不重叠的结果。先澄清像 `[1,4]` 与 `[4,5]` 这样相接的区间是否算重叠。

**思路：** 按起点排序，然后扫描：维护当前最后合并的区间，对每个后续区间，若其起点不晚于上一个终点则扩展终点，否则新起一个区间。排序带来 O(n log n) 时间，O(n) 输出空间（除输出外 O(1) 额外空间）。微软会追问 `start <= last_end` 边界（相接区间是否合并）以及空输入情况。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 按起点排序保证任何重叠都发生在最近一个已合并区间上。
- 终点用 `max`——后续区间可能被完全包含（终点更小）。
- `start <= last_end` 会合并相接区间；若相接应分开则用 `<`。
- O(n log n) 时间由排序主导；扫描为线性。

**常见追问：**
- 向已排序、互不重叠的列表中 O(n) 插入一个区间。
- 返回覆盖的总长度或空隙数量。
- 处理区间流——维护平衡树 / 区间集合。

**常见坑：**
- 用 `last_end = end` 而非 `max(last_end, end)`——把被包含区间缩短了。
- 改动了输入的别名；入列前先复制第一个区间。

**标签：** #algorithm

---

### 80. 字符串转换整数 (atoi)

**难度：** 中等
**主题：** string, parsing, edge-cases
**岗位：** SWE
**级别：** L60-L62

**问题：** 实现 `atoi`：跳过前导空格，读取可选正负号，连续读入数字直到非数字为止，并将结果钳制到有符号 32 位范围 `[-2^31, 2^31-1]`。逐一走查棘手输入。

**思路：** 用显式下标从左到右单次扫描：去掉空格，捕获符号，累加 `num = num*10 + digit`，遇到第一个非数字即停止。钳制到 INT_MIN/INT_MAX。O(n) 时间，O(1) 空间。微软最看重边界情况——单独的 `+`/`-`、夹带字母以及溢出，代码对此都有防护（Java 用 `long` 在循环中途钳制；Python/TS 在末尾钳制）。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 按阶段顺序处理：空格、至多一个符号、数字，然后停止。
- 钳制到 `[-2^31, 2^31-1]`；溢出必须饱和，而非回绕。
- 符号后紧跟非数字或为空则返回 0——数字循环根本不执行。
- O(n) 单遍扫描，O(1) 额外状态；仅下标和累加器变化。

**常见追问：**
- 支持显式进制或像 `0x` 的十六进制前缀。
- 更严格地拒绝单独的 `+`/`-` 或尾部垃圾字符（类似 strtol 的 errno）。
- 不借助更宽类型解析——在相乘前用比较检测溢出。

**常见坑：**
- 在任意位置跳过空白，而非只跳过前导空格。
- 累加进 32 位 int，在钳制检查前就已溢出。

**标签：** #algorithm

---

## 其他算法

### 81. 颠倒二进制位

**难度：** 简单
**主题：** bit-manipulation
**岗位：** SWE
**级别：** L60-L62

**问题：** 颠倒一个 32 位无符号整数的二进制位。

**思路：** 循环 32 次：结果左移，OR 上 `n & 1`，n 右移。O(32)。优化：用掩码（`0xFFFF0000`、`0x00FF00FF`、……）分治交换两半，O(log 32)。微软在高级候选人那里偏爱分治版本。

**Python：**
```python
def reverse_bits(n: int) -> int:
    result = 0
    for _ in range(32):
        result = (result << 1) | (n & 1)
        n >>= 1
    return result
```

**TypeScript：**
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

**Java：**
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

**要点：**
- 每轮结果左移，从最低位起按序构造。
- JS/TS 用无符号右移 `>>>`，避免符号位扩展。
- 分治交换（16↔16、8↔8……）可降到 O(log 32) 次操作。

**标签：** #algorithm

---

### 82. 位 1 的个数（Hamming Weight）

**难度：** 简单
**主题：** bit-manipulation
**岗位：** SWE
**级别：** L60-L62

**问题：** 返回 32 位无符号整数中 1 的个数。

**思路：** Kernighan 技巧：`while (n) { n &= n - 1; count++; }`——每次干掉一个置位。O(k)，k 为置位数。可提一句内建 `Integer.bitCount` / `__builtin_popcount`。

**Python：**
```python
def hamming_weight(n: int) -> int:
    count = 0
    while n:
        n &= n - 1
        count += 1
    return count
```

**TypeScript：**
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

**Java：**
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

**要点：**
- `n & (n - 1)` 清掉最低置位，循环恰好执行 popcount 次。
- 比逐位扫的 32 轮快得多（位稀疏时）。
- 生产环境直接用内建 popcount（`Integer.bitCount`、`__builtin_popcount`）。

**标签：** #algorithm

---

### 83. 缺失数字

**难度：** 简单
**主题：** math, bit-manipulation, array, xor
**岗位：** SWE
**级别：** L60-L62

**问题：** 给定一个包含 `n` 个互不相同数字的数组，这些数取自区间 `[0, n]`，找出唯一缺失的数字。讨论一个 O(1) 额外空间的方法及其溢出取舍。

**思路：** 异或技巧：把 `0..n` 的所有下标与数组中每个值全部异或；相等的数两两抵消，留下缺失的那个。时间 O(n)，空间 O(1)，且无溢出风险。高斯求和方案（`n*(n+1)/2 - sum`）同样简单，但当 `n` 很大时可能溢出——这正是微软希望你指出的取舍。

**Python：**
```python
def missing_number(nums: list[int]) -> int:
    result = len(nums)
    for i, num in enumerate(nums):
        result ^= i ^ num
    return result
```

**TypeScript：**
```typescript
function missingNumber(nums: number[]): number {
  let result = nums.length;
  for (let i = 0; i < nums.length; i++) {
    result ^= i ^ nums[i];
  }
  return result;
}
```

**Java：**
```java
static int missingNumber(int[] nums) {
    int result = nums.length;
    for (int i = 0; i < nums.length; i++) {
        result ^= i ^ nums[i];
    }
    return result;
}
```

**要点：**
- 一个值与自身异或为 0，故出现过的数相互抵消，缺口得以保留。
- 用 `n`（数组长度）作为初值，以覆盖完整下标范围 `0..n`。
- 时间 O(n)，空间 O(1)，且与求和法不同，绝不溢出。
- 与输入顺序无关——无需排序。

**常见追问：**
- 缺失两个数字——按某个不同的位分组，再对每组分别异或。
- 改为找重复数字（Floyd 判圈算法）。
- 数组有序——二分查找第一个下标与值不匹配处，O(log n)。

**常见坑：**
- 忘记把最后的下标 `n` 折入（用它作为累加器初值）。
- 选用求和公式却在 `n` 很大时不加宽类型导致溢出。

**标签：** #algorithm

---

## 系统设计

### 84. 设计 Microsoft Teams 聊天

**难度：** 困难
**主题：** system-design, websockets, pub-sub, presence
**岗位：** 高级 SWE
**级别：** L63-L65

**问题：** 设计 Microsoft Teams 的消息后端（1:1、群聊、数千人 channel、在线状态）。

**思路：** WebSocket 网关（按用户粘性）→ 消息总线（Service Bus / Kafka）。按 channel 的 topic 做扇出。存储：Cosmos DB 按 `channel_id` 分片存消息。在线状态：每区域 Redis 带 TTL；跨区域最终一致聚合。讨论已读回执、输入提示（限流 1/秒）、大 channel 如何避免扇出风暴（滚动时懒拉取）。加分：合规/eDiscovery 要求（Office 365 不可变归档）。

**常见追问：**
- 成员超过 1 万的 channel——写时扇出 vs 打开时懒拉。
- 与外部租户联邦——信任边界、密钥交换。
- 合规：保留、法律冻结、多年消息的 eDiscovery 检索。
- 休眠设备的移动推送——APNs/FCM 桥接与去重。
- 大规模已读回执——批处理、允许丢失还是严格逐人执行？

**常见坑：**
- 把在线状态当强一致——浪费大量写吞吐。
- 所有 channel 都写时扇出——大 channel 会压垮系统。

**标签：** #system-design

---

### 85. 设计 Azure Blob 存储

**难度：** 困难
**主题：** system-design, blob-storage, replication, erasure-coding
**岗位：** 高级 SWE
**级别：** L63-L65

**问题：** 设计 Azure Blob 存储。覆盖分片、复制、持久性、读写路径。

**思路：** 前端层（负载均衡）→ 分区层（blob 名映射到存储服务器，按 account+container+blob 分片）→ stream 层（append-only、纠删码 chunk 分布在节点/机架/AZ 间）。分区层用 master（Paxos）做表分配。多 AZ 保证持久性，跨区域异步复制做灾备。讨论单区域内的强一致（分区单 primary）、大 blob 上传（block blob 提交模型）、分层（hot → cool → archive）。

**常见追问：**
- 复制因子选择——3 副本 vs 纠删码，各自什么场景胜出？
- 热分区恢复——单个租户压满一个存储节点。
- Stream 层 append-only——删除/覆写是怎么实现的？
- 跨区域异步复制——RPO/RTO 目标与冲突解决。
- 分层转换管道——hot → cool → archive 如何调度，读延迟如何标记？

**常见坑：**
- 把 blob 看作单一连续文件——遗漏了 block/append 结构。
- 混淆分区层与 stream 层；二者的故障域与一致性模型不同。

**标签：** #system-design

---

### 86. 设计 Office 365 文档协同编辑

**难度：** 困难
**主题：** system-design, ot, crdt, sync
**岗位：** 高级 SWE
**级别：** L63-L65

**问题：** 设计 Word/Excel/PowerPoint Online 支持多人并发编辑同一文档的方案。

**思路：** 单文档级别用 OT 或 CRDT。每文档服务（按 doc_id 分片）作为中心序列化器；WebSocket 客户端发操作，服务端 transform + 广播。操作日志持久化（Cosmos DB）+ 定期快照到 blob。讨论离线编辑（本地排队操作、重连时重放）、大文档扩展（按段落粒度）、富内容（嵌入对象、评论）。可以提一句 Excel 比 Word 难（单元引用会让公式漂移）。

**标签：** #system-design

---

### 87. 设计任务调度器（Azure Functions 后端）

**难度：** 中等
**主题：** system-design, queue, scheduling, distributed-systems
**岗位：** 高级 SWE
**级别：** L63-L65

**问题：** 设计支持一次性、周期（cron）、延时任务的大规模分布式调度器。

**思路：** 持久化任务存储（Cosmos DB）+ `next_run_time` 索引。调度 worker（通过 ZK/etcd 选主）每秒扫描到期任务，推到队列（Service Bus）。worker 池从队列拉取、执行、汇报状态。周期任务完成后按下一次 cron 时间重排。讨论 exactly-once vs at-least-once（多数调度器走 at-least-once + 幂等 handler）、宕机后回补、cron 的时区处理。

**标签：** #system-design

---

### 88. 设计 API 限流器

**难度：** 中等
**主题：** system-design, rate-limiting, redis, distributed
**岗位：** SWE
**级别：** L62-L63

**问题：** 设计支持按用户和按 IP 限流的 API rate limiter。

**思路：** 令牌桶或滑动窗口日志。存储用按 user_id 分片的 Redis 集群。原子 Lua 脚本递减+判断。超热 key 加进程内本地缓存（每 100ms 刷新）作为第一道。分布式限流优先用区域限流（容忍最终一致），少用全局同步。讨论 fail-open vs fail-closed。

**标签：** #system-design

---

### 89. 设计 Xbox Live 匹配

**难度：** 困难
**主题：** system-design, gaming, latency, ranking
**岗位：** 高级 SWE
**级别：** L63-L65

**问题：** 设计 Xbox Live（或任何多人游戏）的匹配系统，按技能和延迟撮合玩家。

**思路：** 玩家进入按 `(game_mode, region, skill_bucket)` 的队列。技能评分用 TrueSkill/Glicko-2；技能 ± N 随等待时间扩大窗口。区域用 ping 候选数据中心决定。匹配器每隔几秒按桶撮合。匹配上后：在延迟最低的 DC 分配游戏服务器（Kubernetes 池）。讨论反小号、组队匹配（4 人队 vs 单排）、公平性与排队时间的权衡。

**标签：** #system-design

---

### 90. 设计 Bing 搜索自动补全

**难度：** 困难
**主题：** system-design, trie, ranking, caching, low-latency
**岗位：** 高级 SWE
**级别：** L63-L65

**问题：** 设计 Bing 搜索框背后的自动补全（type-ahead）服务：用户每输入一个字符，就在个位数毫秒内返回排序后的前约 10 条查询建议，且要满足 Web 规模与多语言。

**思路：** 离线管道把查询日志（每天数十亿条）聚合成 前缀→top-K 表：对历史查询做 map-reduce，按频率加权并带时间衰减（近期热点很重要——见"常见坑"），再叠加个性化与地域/语言信号。服务端从内存结构提供：可以是每个节点都缓存了预计算 top-K 的 trie，也可以是更简单的按 `前缀 → top-K` 分片哈希。按前缀哈希分片到一组只读副本上，前面挂低延迟网关；最热的短前缀在每个节点都复制一份。两个会被打分的决策：(1) 节点预计算 vs 查询时计算——把 top-K 存在每个 trie 节点上，用内存换取 O(前缀长度) 的查找、免去每请求的堆排序，鉴于读写比这是正确取舍；(2) 新鲜度——批处理表有数小时延迟，因此叠加一条快路径，通过 Event Hubs / Service Bus 把近期查询灌入流式聚合器（Azure Functions），在服务时把一个小的"热点"增量与批处理表合并。批处理快照存 Blob Storage，部署时热加载进内存；个性化状态用 Redis/Cosmos DB 按用户键存。按前缀在边缘用短 TTL 缓存结果；客户端做防抖，并在下一次按键时取消在途请求。

**常见追问：**
- 拼写纠错 / 模糊前缀——编辑距离容忍、音近匹配，或在 trie 前放一个独立纠错模型。
- 突发热点（突发新闻）——一条全新查询多快能浮现？如何防止机器人刷频率作弊？
- 个性化 vs 隐私——每用户历史、GDPR 删除，以及必须 join 用户状态时如何保持热路径够快。
- 多语言 / CJK 输入，此时"前缀"是拼音或未完成的 IME 组合串。
- 超越纯频率的排序——CTR、停留时长、对成人/不安全建议的降权。

**常见坑：**
- 纯按全历史频率排序——扼杀新鲜度；热点与时间衰减必须是一等公民，而非事后补丁。
- 每次更新都重建或锁整棵 trie——应使用不可变快照原子切换，或写时复制，让读永不因写而阻塞。

**标签：** #system-design

---

### 91. 设计 OneDrive 文件同步

**难度：** 困难
**主题：** system-design, file-sync, blob-storage, conflict-resolution, delta-sync
**岗位：** 高级 SWE
**级别：** L63-L65

**问题：** 设计 OneDrive（或 Dropbox 式）文件同步系统：桌面/移动客户端让本地文件夹与云端、以及用户各设备之间保持同步，并处理大文件、离线编辑与冲突。

**思路：** 把职责拆成元数据服务和块/内容存储。文件被切块（内容定义分块或固定约 4MB 块），每个块按哈希做内容寻址；块存 Blob Storage，在策略允许时跨用户去重。元数据——文件树、版本、每文件的块清单（manifest）——存 Cosmos DB，按 `user_id` 分片（同一用户的命名空间同置，列目录树才快）。客户端维护本地监视器 + 数据库，计算变更的块，做增量同步：只上传新增块哈希，再提交新 manifest（这是第一个会被打分的决策——块级增量加去重，正是"改 1 行后同步 1GB 文件"仍然便宜的原因）。变更传播：提交时元数据服务递增每命名空间的单调游标，并通过基于 Service Bus 的长轮询 / WebSocket 通知通道告知该用户其他在线设备；设备按上次游标拉取增量。第二个会被打分的决策是冲突处理——同步不是合并系统，因此用每文件版本向量（version vector）：若两台设备从同一基版本提交，则两份都保留并生成"冲突副本"（如 `file (设备2 的冲突副本)`），而不是悄悄丢掉一次编辑；仅当一方严格是另一方的后代时才可用 last-writer-wins。讨论上传断点续传（块级提交意味着断线可从文件中途续传）、大树移动/改名作为元数据操作处理（无需重传）、以及带宽限速 / 局域网同步。

**常见追问：**
- 单文件夹数百万文件 / 超大树——客户端如何避免每次启动都全量扫描？
- 选择性同步与按需文件（占位文件在打开时才水合）。
- 跨用户共享文件夹——权限模型，以及共享命名空间的游标如何扇出。
- 跨区域用户、把命名空间迁到离用户更近处；元数据存储的 RPO。
- 端到端加密 vs 服务端去重——为何冲突，你会如何取舍。

**常见坑：**
- 默认用 last-writer-wins 解决冲突——会悄悄毁掉用户数据；应使用版本向量 + 冲突副本。
- 同步整文件而非块——使大文件编辑和断点续传变得不可行。

**标签：** #system-design

---

## 行为面试

### 92. 讲一次你快速学会新东西的经历

**难度：** 中等
**主题：** behavioral, growth-mindset, learning
**岗位：** SWE
**级别：** L60-L62

**问题：** 讲一次你为了交付不得不快速学习新技术或新领域的经历。你怎么做的？

**思路：** 直击**成长型思维**——Satya 的头号文化视角。展示：(1) 你没装懂，(2) 你有结构化学习方法（文档 → 小 POC → 专家 review），(3) 你用新技能交付了，(4) 之后你教别人。加分：你主动寻求了让你面子上挂不住的反馈。

**标签：** #behavioral

---

### 93. 你收到尖锐反馈的经历

**难度：** 中等
**主题：** behavioral, growth-mindset, self-awareness
**岗位：** SWE
**级别：** L60-L62

**问题：** 讲一次你收到严厉反馈的经历。你怎么处理的？

**思路：** 微软深挖这道题——"固定 vs 成长型思维"的试金石。展示：(1) 你没防御性反应，(2) 你试图理解背后的信号，(3) 你做了可证明的具体行为改变（不只是意图），(4) 反馈给予者认可了改变。避免"我心里其实不同意"的故事——那是固定思维信号。

**标签：** #behavioral

---

### 94. 一个不顺利的项目

**难度：** 中等
**主题：** behavioral, failure, growth-mindset
**岗位：** 高级 SWE
**级别：** L63-L65

**问题：** 介绍一个失败或未达预期的项目。发生了什么？你学到了什么？

**思路：** 挑真实失败。展示：(1) 你不甩锅、独自扛责，(2) 你做了真正的复盘（流程层面，不是"我们应该多测试"这种空话），(3) 教训在后续项目里改变了你的行为——给具体例子。微软喜欢你描述系统/流程缺口，而非个人问题。

**标签：** #behavioral

---

### 95. 你无授权领导一件事的经历

**难度：** 中等
**主题：** behavioral, leadership, influence
**岗位：** 高级 SWE
**级别：** L63-L65

**问题：** 讲一次你推动跨团队倡议，但对相关人员并无直接管理权的经历。

**思路：** Senior+ 信号。展示：(1) 你用"对他们有什么好处"的明确框架建立联盟，(2) 你用数据/客户影响（不是组织政治），(3) 你公开表扬他人贡献，(4) 结果可量化。微软非常看重跨组协作——他们组太多了。

**标签：** #behavioral

---

### 96. 讲一次你与同事有技术分歧、如何化解

**难度：** 中等
**主题：** behavioral, conflict, collaboration, growth-mindset
**岗位：** SWE
**级别：** L60-L62

**问题：** 讲一次你和同事在某个技术决策上强烈分歧的经历。你如何处理，结果如何？

**思路：** 面试官在考察你能否"坚定持有观点但不固执"——微软的**成长型思维**（growth mindset）明确要的是"求知者，而非全知者"。他们在看：你攻击的是问题还是人、你是否设法理解对方观点、以及当决策不如你意时你能否 commit 并支持。STAR 结构：Situation（技术分岔点——如同步 vs 异步设计、选哪个数据库）；Task（要拍板什么、利害何在）；Action——这是被打分的部分：讲你如何把自我与想法分开、如何用"数据"来解决分歧（原型、基准测试、引入客户/性能信号或中立第三方意见），而不是靠资历或嗓门升级，并真诚地为对方观点做"最强论证"（steelman）；Result——决策结果，以及关键的你"学到了什么"（最好有一刻对方观点被证明部分正确，或你因证据而改变了想法）。收在成长型思维上：若团队选了另一条路，展示你 disagree-and-commit 并帮它成功。避免"最后证明我是对的"式结尾，以及任何靠压级别取胜的故事——两者都会被读作固定型思维。

**标签：** #behavioral

---

## 领域知识

### 97. 优化某服务在 Azure 上的成本

**难度：** 中等
**主题：** cloud, cost-optimization, azure
**岗位：** SRE
**级别：** L63

**问题：** Azure 上某服务月账单 20 万美元。讲讲你是怎么砍到一半的。

**思路：** 先剖析成本：算力（VM/AKS）、存储（Blob/磁盘）、出网、托管服务。常见收益：(1) 调整 VM 规格（CPU/内存利用率 <30% 即过度配置），(2) 批处理用 reserved 或 spot 实例，(3) Cosmos DB → 调 RU/s 和分区，(4) 冷 blob 转到 cool/archive 层，(5) 重度缓存减少出网，(6) 审计 dev/test 资源下班后自动关机。别不看 SLO 影响就砍。展示你会先建成本看板再动手。

**标签：** #domain-knowledge

---

### 98. 排查 .NET 服务高 CPU

**难度：** 中等
**主题：** dotnet, profiling, debugging
**岗位：** SWE
**级别：** L62

**问题：** 一个 C#/.NET 服务在生产 VM 间歇性 100% CPU。你会怎么排查？

**思路：** 第 1 步：取 dump（`dotnet-dump collect`）或用 profiler（`dotnet-trace`、PerfView）。看最热的调用栈。常见原因：(1) GC 压力 → 看 Gen2 回收、大对象堆，(2) 灾难性回溯的正则，(3) 大对象的 JSON 序列化，(4) Task 调度器中的忙等，(5) 锁竞争。用 `dotnet-counters` 看实时指标。要把部署 diff 和近期流量模式关联起来分析。若无法复现，加结构化日志 + 生产采样 profiler（always-on profiling）。

**标签：** #domain-knowledge

---

### 99. .NET 垃圾回收与内存管理

**难度：** 中等
**主题：** dotnet, gc, memory, csharp, performance
**岗位：** 后端
**级别：** L62-L63

**问题：** 讲讲 .NET 垃圾回收器如何工作，以及你如何在高吞吐 .NET 服务里管理内存。

**思路：** .NET 使用追踪式、分代、标记-清除-压缩（mark-sweep-compact）的 GC。托管堆分代：Gen0（短命对象，回收最频繁且廉价）、Gen1（短命与长命之间的缓冲）、Gen2（长命对象）；存活者逐代晋升。大对象（>=85KB）进大对象堆（LOH），历史上不做压缩（因而会碎片化）——可用 `GCSettings.LargeObjectHeapCompactionMode` 强制压缩但代价高。一次回收从栈、静态字段、GC handle 出发做根扫描，标记可达对象，然后清除并压缩（更新引用），这也是托管指针会移动的原因。分代假设——多数对象很快死亡——正是 Gen0 回收够快的根据。两种 GC 模式：Workstation vs Server GC（Server GC 每 CPU 一个堆加后台线程，是吞吐型服务的默认）；Background GC 让 Gen2 回收大体并发进行以降低停顿。非托管资源的确定性清理"不是" GC 的职责——那是 `IDisposable`/`using` 与终结器（finalizer 需额外一轮 GC 才能回收，所以优先 Dispose，终结器只作兜底，最好经 SafeHandle）。对于热点服务：尽量减少分配以压低 Gen0 翻腾与晋升——酌情使用 `Span<T>`/`Memory<T>`、`ArrayPool<T>`、`struct` 与 `stackalloc`，以及对象池；警惕意外装箱与 LOH 分配。诊断用 `dotnet-counters`（分配速率、Gen2/LOH 大小、GC 占用时间百分比）与 `dotnet-gcdump`/PerfView。

**常见追问：**
- 到底什么触发 Gen2 回收？为何 Gen2 频率高是危险信号？
- Workstation vs Server GC——如何选，Server GC 在内存上代价几何？
- 什么是 LOH，为何碎片化，如何避免大数组翻腾？
- 终结器能保证清理吗？为何终结器反而会让对象存活更久？
- 为何一个静态事件处理器或被捕获的闭包，即便有 GC 也能造成"托管内存泄漏"？

**常见坑：**
- 以为 GC 会处理非托管资源（文件句柄、socket、原生内存）——它不会；你仍需 Dispose。
- 在生产里调 `GC.Collect()` 来"修"内存——通常适得其反，会强制晋升与完整回收。

**标签：** #domain-knowledge

---

### 100. C# async/await 与并发模型

**难度：** 中等
**主题：** csharp, async, concurrency, dotnet, tasks
**岗位：** 后端
**级别：** L62-L63

**问题：** 讲讲 C# 里 `async`/`await` 如何工作，以及它与线程、.NET 并发模型的关系。

**思路：** `async`/`await` 是编译器生成的协作式异步，不是线程。编译器把 async 方法改写成状态机：在每个 `await` 一个未完成 `Task` 处，方法注册一个 continuation 并"返回给调用者"，从而释放当前线程；被等待的操作完成时，continuation 被调度，从上次离开处恢复。关键认知是 异步 != 并行——对真正的 I/O（socket、磁盘、数据库）并没有线程在阻塞等待；操作系统完成操作后，才借一个线程来跑 continuation。这正是异步能让服务器扩展的原因：少数几个线程服务成千上万个在途的 I/O 密集请求，而非每请求一线程。`Task` 表示一个未来结果；`await` 解包它并重新抛出捕获的异常。SynchronizationContext / TaskScheduler 决定 continuation 在"哪里"跑——UI 应用会 marshal 回 UI 线程；ASP.NET Core 没有这种 context，故 continuation 在线程池线程上跑。`ConfigureAwait(false)` 表示"我不需要回到原 context"，可省去一次无谓跳转，并且关键地避免经典的 sync-over-async 死锁（在 `.Result`/`.Wait()` 上阻塞，而那唯一的 context 线程正卡着等待一个需要它自己的 continuation）。经验法则：异步一贯到底、绝不阻塞异步代码、返回 `Task`/`Task<T>`（除事件处理器外别用 `async void`）、使用 `CancellationToken`、并用 `Task.WhenAll` 并发多个独立 await。CPU 密集型工作则不同——那是经 `Task.Run`/线程池/`Parallel` 的真并行，不是异步 I/O 的用途。

**常见追问：**
- 既然 `async` 不增加线程，为何它能让 I/O 密集的 Web 服务器扩展？
- 走一遍经典的 `.Result` 死锁，以及 `ConfigureAwait(false)` 或"异步一贯到底"如何避免它。
- `async void` 什么时候可接受，为何在别处危险？
- `Task.WhenAll` vs 顺序 await 的循环——吞吐与异常聚合上的差异。
- 什么是 `ValueTask`，何时该用它替代 `Task`？

**常见坑：**
- 以为 `await` 会开新线程或让代码并行——它是协作式 continuation；I/O await 等待期间不占线程。
- 用 `.Result`/`.Wait()` 阻塞异步——在捕获了 SynchronizationContext 时会死锁，并耗尽线程池。

**标签：** #domain-knowledge

---

## 微软特有的建议

- **基础胜于花活。** 微软倾向给正确性、边界、代码清晰打分，而不是算法洞察。慢一点，处理 null，简短注释。
- **成长型思维是文化密码。** 故事要体现学习，尤其是从错误或反馈中学习。固定思维信号（防御、甩锅、"我自始至终都是对的"）会拉垮整轮。
- **若岗位贴近云，深入掌握一项 Azure 服务。** 不用全会 200 项——挑 Cosmos DB、Service Bus 或 AKS 并有自己的观点。
- **AA 轮是看 fit + 级别校准。** 编码少，架构和行为多。当成 skip-level 面试来准备。
- **OOD 会出现。** 练 2-3 道经典（停车场、自动售货机、图书馆系统）。

## 参考资料

- LeetCode "Microsoft" 公司标签
- 《Hit Refresh》by Satya Nadella —— 给你文化底色
- Microsoft Learn（Azure 认证）—— 免费，适合云相关轮
- 《Cracking the Coding Interview》——契合微软的经典风格门槛
