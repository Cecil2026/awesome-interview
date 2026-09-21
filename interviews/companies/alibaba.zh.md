# 阿里巴巴

```yaml
company: 阿里巴巴集团（淘宝、天猫、支付宝/蚂蚁集团、阿里云、菜鸟、钉钉）
typical_rounds: 1 轮 HR 初筛 + 3-5 轮技术面（通常按面试官级别分层：P7 → P8 → P9）+ 1 轮交叉面 + HR 终面
focus_areas: Java 中间件（Spring、Dubbo、MyBatis）、分布式系统、JVM 内部原理、电商/支付系统设计
languages_allowed: 强烈偏好 Java；Go 可接受；部分团队使用 C++
duration: 每轮 45-60 分钟
notable_quirks:
  - JVM 调优、GC 算法以及 Java 并发（synchronized、AQS、CAS）是深挖话题
  - 行为面试对应阿里六脉神剑：客户第一、团队合作、拥抱变化、诚信、激情、敬业
  - 架构面试常常涉及阿里自研的系统（Dubbo、RocketMQ、Sentinel、Nacos、Seata）
  - 高级别面试官（P9+）会问"如果让你从零设计淘宝你会怎么做"这种偏哲学的问题
  - 即便候选人面试用英文，如果团队在内地，部分轮次仍会用普通话进行
sources: 一亩三分地、牛客网、LeetCode-cn、Glassdoor
```

## 概述

阿里巴巴的面试在 Java 后端深度上下了重手——JVM 内部原理、并发原语、Spring 框架内部机制，以及阿里自己贡献的开源中间件（Dubbo 做 RPC、RocketMQ 做消息、Nacos 做配置/服务发现、Sentinel 做流控、Seata 做分布式事务）。系统设计围绕电商和支付场景：秒杀、淘宝 + 支付宝间的分布式事务、库存一致性。行为面试对应六脉神剑，尤其是客户第一和拥抱变化。

## 链表

### 1. K 个一组翻转链表

**难度：** 困难
**主题：** linked-list, recursion
**岗位：** SWE
**级别：** P5-P6

**问题：** 给定一个链表，每 k 个连续节点翻转一次。如果剩余节点不足 k 个，保持原样。

**思路：** 先往前数 k 个节点；若不足，直接返回头。用迭代（三指针）翻转这 k 个节点，递归处理剩余部分再拼接。O(n)。边界：k=1（不操作）、k=n（整段翻转）。注意计数的 off-by-one。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 翻转前先数够 k 个节点，否则尾部处理会出错。
- 递归栈深度为 O(n/k)；若 k 小、n 大可改成迭代。
- 原头节点会成为该段翻转后的新尾。

**常见追问：**
- 用哑头的迭代版——O(1) 额外空间。
- 也翻转 *最后不足 k* 的那一组。
- 按 k 位旋转链表（相关但不同的指针调度）。
- 隔组翻转——偶数组翻转，奇数组保持。

**常见坑：**
- 把不足 k 的尾部也翻转了——题意是保持原状。
- 忘了将 `head.next` 接到递归结果上——链表提前终止。

**标签：** #algorithm

---

### 2. LFU 缓存

**难度：** 困难
**主题：** ood, hashmap, linked-list, design
**岗位：** SWE
**级别：** P6-P7

**问题：** 设计一个 LFU（最不经常使用）缓存，`get` 和 `put` 均为 O(1)。淘汰时丢弃使用频率最低的；频率相同则按最久未使用淘汰。

**思路：** 两个哈希表 + 多条双向链表。`key -> node`、`freq -> 该频率节点的 DLL`。访问时把节点从当前频率链表移除，插入 (freq+1) 链表头。维护 `min_freq`。淘汰时移除 `min_freq` 链表的尾节点。当某节点频率自增导致其原链表为空时更新 `min_freq`。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 每个频率桶用有序映射，相同频率下 LRU 仍是 O(1)。
- `min_freq` 只会随访问递增，或在新插入时重置为 1。
- 容量为 0 时必须特判，否则 `put` 触发淘汰会崩。

**常见追问：**
- LRU 缓存——同类结构，不变量更简单。
- LFU + 每项 TTL。
- 分布式 LFU——多副本间频率如何同步？
- 老化：频率随时间衰减，避免老热点永久钉住。

**常见坑：**
- 不删空频率桶——遍历无限增长。
- `get` 时提升 `min_freq`但被提升的键并非 `min_freq` 上唯一。

**标签：** #algorithm

---

### 3. 排序链表

**难度：** 中等
**主题：** linked-list, merge-sort, two-pointers
**岗位：** SWE（中间件方向）
**级别：** P6-P7

**问题：** 在 O(n log n) 时间、常数级额外空间下对链表进行升序排序。

**思路：** 链表不能像数组那样随机访问，快排分区代价高，归并排序最合适。用快慢指针找中点，断开成两半，分别递归排序后合并两个有序链表。时间 O(n log n)，递归栈 O(log n)；若要严格 O(1) 空间可改为自底向上的迭代归并。中间件里合并多路有序日志/流也是同一思想。

**Python：**
```python
class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val, self.next = val, next

def sort_list(head: ListNode | None) -> ListNode | None:
    if head is None or head.next is None:
        return head
    slow, fast = head, head.next
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
    mid = slow.next
    slow.next = None
    left, right = sort_list(head), sort_list(mid)
    dummy = tail = ListNode()
    while left and right:
        if left.val <= right.val:
            tail.next, left = left, left.next
        else:
            tail.next, right = right, right.next
        tail = tail.next
    tail.next = left or right
    return dummy.next
```

**TypeScript：**
```typescript
class ListNode {
  val: number; next: ListNode | null;
  constructor(v = 0, n: ListNode | null = null) { this.val = v; this.next = n; }
}

function sortList(head: ListNode | null): ListNode | null {
  if (!head || !head.next) return head;
  let slow = head, fast: ListNode | null = head.next;
  while (fast && fast.next) { slow = slow.next!; fast = fast.next.next; }
  const mid = slow.next;
  slow.next = null;
  let left = sortList(head), right = sortList(mid);
  const dummy = new ListNode();
  let tail = dummy;
  while (left && right) {
    if (left.val <= right.val) { tail.next = left; left = left.next; }
    else { tail.next = right; right = right.next; }
    tail = tail.next;
  }
  tail.next = left ?? right;
  return dummy.next;
}
```

**Java：**
```java
class ListNode { int val; ListNode next; ListNode(int v) { val = v; } }

ListNode sortList(ListNode head) {
    if (head == null || head.next == null) return head;
    ListNode slow = head, fast = head.next;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    ListNode mid = slow.next;
    slow.next = null;
    ListNode left = sortList(head), right = sortList(mid);
    ListNode dummy = new ListNode(0), tail = dummy;
    while (left != null && right != null) {
        if (left.val <= right.val) { tail.next = left; left = left.next; }
        else { tail.next = right; right = right.next; }
        tail = tail.next;
    }
    tail.next = left != null ? left : right;
    return dummy.next;
}
```

**要点：**
- 快慢指针把 `fast` 初始化在 `head.next`，保证偶数长度时前半段不多于后半段，避免死递归。
- 找中点后必须 `slow.next = None` 断链，否则合并会成环。
- 归并保证稳定排序（`<=` 而非 `<`）。

**常见追问：**
- 改成自底向上迭代归并，实现严格 O(1) 额外空间。
- 若要求降序，如何最小改动？

**常见坑：**
- 忘记断开中点导致无限递归或环。
- 直接套用快排，最坏 O(n²) 且链表分区难写。

**标签：** #algorithm

---

### 4. 复制带随机指针的链表

**难度：** 中等
**主题：** linked-list, hashmap, interweaving
**岗位：** SWE（电商方向）
**级别：** P6-P7

**问题：** 链表每个节点除 `next` 外还有一个 `random` 指针，指向链表中任意节点或空。返回该链表的深拷贝。

**思路：** 难点在于复制 `random` 时目标新节点可能还没创建。方法一用哈希表 `原节点 -> 新节点`，两趟解决，O(n) 时间 O(n) 空间。方法二（原地交织）把每个复制节点插到原节点后面，`cur.next.random = cur.random.next` 设置随机指针，再拆分两条链，O(n) 时间 O(1) 额外空间。下面给交织法。

**Python：**
```python
class Node:
    def __init__(self, val: int, next: "Node | None" = None, random: "Node | None" = None) -> None:
        self.val, self.next, self.random = val, next, random

def copy_random_list(head: Node | None) -> Node | None:
    if head is None:
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
    cur, new_head = head, head.next
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
  constructor(v: number, n: Node | null = null, r: Node | null = null) {
    this.val = v; this.next = n; this.random = r;
  }
}

function copyRandomList(head: Node | null): Node | null {
  if (!head) return null;
  let cur: Node | null = head;
  while (cur) { cur.next = new Node(cur.val, cur.next); cur = cur.next.next; }
  cur = head;
  while (cur) { if (cur.random) cur.next!.random = cur.random.next; cur = cur.next!.next; }
  cur = head;
  const newHead = head.next;
  while (cur) {
    const copy = cur.next!;
    cur.next = copy.next;
    copy.next = copy.next ? copy.next.next : null;
    cur = cur.next;
  }
  return newHead;
}
```

**Java：**
```java
class Node { int val; Node next; Node random; Node(int v) { val = v; } }

Node copyRandomList(Node head) {
    if (head == null) return null;
    for (Node cur = head; cur != null; ) {
        Node copy = new Node(cur.val);
        copy.next = cur.next;
        cur.next = copy;
        cur = copy.next;
    }
    for (Node cur = head; cur != null; cur = cur.next.next) {
        if (cur.random != null) cur.next.random = cur.random.next;
    }
    Node newHead = head.next;
    for (Node cur = head; cur != null; ) {
        Node copy = cur.next;
        cur.next = copy.next;
        copy.next = copy.next != null ? copy.next.next : null;
        cur = cur.next;
    }
    return newHead;
}
```

**要点：**
- 交织法把复制节点紧跟在原节点之后，因此 `cur.random.next` 恰好是随机目标的复制。
- 设置随机指针必须在拆分之前完成，两步不能合并。
- 拆分时要同时还原原链表的 `next`，做到无损。

**常见追问：**
- 用哈希表版本对比，讨论空间/可读性权衡。
- 若存在环，两种方法是否仍成立？

**常见坑：**
- `cur.random` 为空时直接访问 `cur.random.next` 会空指针。
- 拆分时漏掉尾节点的空判断，`copy.next.next` 越界。

**标签：** #algorithm

---

### 5. 环形链表 II

**难度：** 中等
**主题：** linked-list, two-pointers, floyd-cycle
**岗位：** SWE（中间件方向）
**级别：** P6-P7

**问题：** 给定链表，若存在环则返回环的入口节点，否则返回空。要求 O(1) 额外空间。

**思路：** Floyd 判圈：快指针每次走两步、慢指针一步，若相遇则有环。设头到环入口距离 a，入口到相遇点距离 b，环长 c，则 a = (k-1)c + (c - b)，即从头和从相遇点各派一指针每次走一步，会在入口相遇。O(n) 时间 O(1) 空间。这类判环思想也用于检测调用链/依赖图中的循环引用。

**Python：**
```python
class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val, self.next = val, next

def detect_cycle(head: ListNode | None) -> ListNode | None:
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
        if slow is fast:
            ptr = head
            while ptr is not slow:
                ptr, slow = ptr.next, slow.next
            return ptr
    return None
```

**TypeScript：**
```typescript
class ListNode {
  val: number; next: ListNode | null;
  constructor(v = 0, n: ListNode | null = null) { this.val = v; this.next = n; }
}

function detectCycle(head: ListNode | null): ListNode | null {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow!.next;
    fast = fast.next.next;
    if (slow === fast) {
      let ptr = head;
      while (ptr !== slow) { ptr = ptr!.next; slow = slow!.next; }
      return ptr;
    }
  }
  return null;
}
```

**Java：**
```java
class ListNode { int val; ListNode next; ListNode(int v) { val = v; } }

ListNode detectCycle(ListNode head) {
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
- 相遇后一指针留在相遇点、另一指针从头出发，同速前进必在入口相遇（数学可证）。
- 循环条件用 `fast && fast.next`，保证 `fast.next.next` 安全。
- 用比较节点引用而非值，值可能重复。

**常见追问：**
- 如何进一步求出环的长度？（从相遇点绕一圈计数）
- 与哈希表标记法对比空间复杂度。

**常见坑：**
- 判断入口时误用节点值相等，应比较引用身份。
- 无环时忘记返回空，或循环条件漏判 `fast.next` 导致空指针。

**标签：** #algorithm

---

## 树

### 6. 不同的二叉搜索树

**难度：** 中等
**主题：** dp, catalan, tree
**岗位：** P5
**级别：** P5-P6

**问题：** 给定 `n`，返回存储 1...n 的结构不同的 BST 总数。

**思路：** 卡特兰数。`G(n) = sum(G(i-1) * G(n-i))`，i 从 1 到 n（i 作为根）。闭式 `C(2n,n)/(n+1)`。DP O(n^2) 或公式 O(n)。

**Python：**
```python
def num_trees(n: int) -> int:
    g = [0] * (n + 1)
    g[0] = g[1] = 1
    for i in range(2, n + 1):
        for j in range(1, i + 1):
            g[i] += g[j - 1] * g[i - j]
    return g[n]
```

**TypeScript：**
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

**Java：**
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

**要点：**
- 每个值作为根将左右子树独立分开。
- `g[i] = sum(g[j-1] * g[i-j])` 即卡特兰数递推。
- 用乘法公式计算卡特兰可达 O(n)。

**标签：** #algorithm

---

### 7. 区域和检索 - 数组可修改（线段树）

**难度：** 中等
**主题：** segment-tree, fenwick-tree, design
**岗位：** P6
**级别：** P6-P7

**问题：** 设计支持 `update(index, val)` 和 `sumRange(l, r)` 的整数数组数据结构。

**思路：** 线段树（数组实现，4n 大小）或树状数组（BIT/Fenwick）。两者均 O(log n) 更新和查询。BIT 代码更短，适合求和；线段树更通用，支持 min/max/懒标记。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- BIT 内部 1 索引，通过 `index + 1` 转换。
- `update` 用差值实现"赋值"语义。
- 区间和 = `prefix(right+1) - prefix(left)`。

**标签：** #algorithm

---

### 8. 我的日程安排表 II

**难度：** 中等
**主题：** design, sweep-line, segment-tree
**岗位：** P6
**级别：** P6-P7

**问题：** 与 I 相同，但允许最多 2 个事件重叠（不允许三重预订）。

**思路：** 维护单预订列表和双重预订区间列表。对新 [s, e)：若与任何双重预订重叠 → 拒绝；否则检查与单预订的重叠并把交集加入双重列表。每次预订 O(n)。备选：差分计数的扫描线。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 三重预订 = 与已有的双重预订有重叠。
- 新双重区间来自新预订与每条已有单预订的交集。
- 大 n 场景可用扫描线 + 差分计数。

**标签：** #algorithm

---

### 9. 掉落的方块

**难度：** 困难
**主题：** segment-tree, coordinate-compression
**岗位：** P7
**级别：** P7

**问题：** 在数轴上逐个掉落方块。每次掉落后报告至今最高堆叠高度。

**思路：** x 坐标做离散化。带懒标记的线段树，支持区间最大查询和区间赋值。每个方块：查询 [l, r) 内最大值，新高 = 查询值 + 边长，区间赋值高度到 [l, r)，更新全局最大。O(n log n)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 新方块落在所有重叠区间的最高处。
- n ≤ 1000 时 O(n^2) 足够；线段树可降至 O(n log n)。
- 维护运行最大值，避免每次重算。

**标签：** #algorithm

---

### 10. 天际线问题

**难度：** 困难
**主题：** sweep-line, heap, segment-tree
**岗位：** P7
**级别：** P7

**问题：** 给定一组建筑 `[left, right, height]`，输出天际线作为关键点序列。

**思路：** 扫描线：在每个建筑左端（加入高度）和右端（移除高度）触发事件。活跃高度用多重集合 / 大顶堆。当前最大高度发生变化时输出关键点。O(n log n)。堆里用懒删除。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 用负高度把最小堆变成大顶堆。
- 懒删除：堆顶若已结束则直接弹出。
- 跳过重复高度，保持输出最简。

**标签：** #algorithm

---

### 11. 二叉树的最近公共祖先

**难度：** 中等
**主题：** tree, recursion, dfs
**岗位：** SWE（后端/中间件/电商/支付方向）
**级别：** P6-P7

**问题：** 给定一棵二叉树以及其中两个节点 `p`、`q`，返回它们的最近公共祖先（节点可以是自身的祖先）。

**思路：** 后序 DFS 自底向上。若当前节点为空或等于 `p`/`q`，直接返回该节点；否则递归左右子树，若左右各返回一个非空结果，则当前节点即 LCA，否则返回非空的一侧。时间 O(n)，空间 O(h)（递归栈，h 为树高）。阿里组织架构树、类目树的祖先归属查询是同类问题。

**Python：**
```python
class TreeNode:
    def __init__(self, val: int = 0, left: "TreeNode | None" = None, right: "TreeNode | None" = None) -> None:
        self.val = val
        self.left = left
        self.right = right

def lowest_common_ancestor(root: TreeNode | None, p: TreeNode, q: TreeNode) -> TreeNode | None:
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
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
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
    int val;
    TreeNode left, right;
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
- 后序遍历天然实现自底向上汇报，一次遍历即可。
- 命中 `p` 或 `q` 时立即返回，无需继续向下找另一个节点。
- 若是二叉搜索树，可利用有序性做 O(h) 的迭代，无需遍历整棵树。

**常见追问：**
- 如果节点带 `parent` 指针，如何在 O(h) 空间甚至 O(1) 空间求 LCA？
- 如何求 K 个节点的最近公共祖先？

**常见坑：**
- 未处理 `p`/`q` 不一定都存在于树中的情况（本解法假设都存在，否则需额外校验命中数）。
- 用 `left or right` 时要确保节点值不会与 falsy 冲突，应按引用而非按值判断。

**标签：** #algorithm

---

### 12. 二叉树的序列化与反序列化

**难度：** 困难
**主题：** tree, dfs, design
**岗位：** SWE（后端/中间件/电商/支付方向）
**级别：** P7

**问题：** 设计算法将一棵二叉树序列化为字符串，并能从该字符串反序列化还原出原树。

**思路：** 前序遍历配合空节点占位符（如 `#`）。序列化时按前序把节点值和空标记依次写入；反序列化时按同样的前序顺序消费 token，遇到 `#` 返回空，否则建节点并递归构造左右子树。因为空节点也被显式记录，前序序列即可唯一还原结构。时间/空间均为 O(n)。RPC 跨服务传输、树形配置持久化（如 Nacos 配置树）都需要这类编解码。

**Python：**
```python
from collections import deque

class Codec:
    def serialize(self, root: "TreeNode | None") -> str:
        out: list[str] = []
        def dfs(node: "TreeNode | None") -> None:
            if node is None:
                out.append("#")
                return
            out.append(str(node.val))
            dfs(node.left)
            dfs(node.right)
        dfs(root)
        return ",".join(out)

    def deserialize(self, data: str) -> "TreeNode | None":
        vals = deque(data.split(","))
        def build() -> "TreeNode | None":
            v = vals.popleft()
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
  const dfs = (node: TreeNode | null): void => {
    if (node === null) { out.push("#"); return; }
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
public class Codec {
    public String serialize(TreeNode root) {
        StringBuilder sb = new StringBuilder();
        dfs(root, sb);
        return sb.toString();
    }
    private void dfs(TreeNode node, StringBuilder sb) {
        if (node == null) { sb.append("#,"); return; }
        sb.append(node.val).append(',');
        dfs(node.left, sb);
        dfs(node.right, sb);
    }
    public TreeNode deserialize(String data) {
        Deque<String> vals = new ArrayDeque<>(Arrays.asList(data.split(",")));
        return build(vals);
    }
    private TreeNode build(Deque<String> vals) {
        String v = vals.poll();
        if ("#".equals(v)) return null;
        TreeNode node = new TreeNode(Integer.parseInt(v));
        node.left = build(vals);
        node.right = build(vals);
        return node;
    }
}
```

**要点：**
- 显式记录空节点是前序方案能唯一还原结构的关键。
- 序列化与反序列化必须遵循完全一致的遍历顺序。
- 用队列/游标顺序消费 token，天然匹配递归的前序建树顺序。

**常见追问：**
- 如何用 BFS（层序）实现同样功能？两种方案的取舍是什么？
- 若节点值本身可能包含分隔符或为负数，如何设计编码格式避免歧义？

**常见坑：**
- 忘记序列化空节点，导致结构无法唯一还原。
- 反序列化时用 `split` 后未处理末尾空串，或分隔符选择与数据冲突。

**标签：** #algorithm

---

### 13. 二叉树中的最大路径和

**难度：** 困难
**主题：** tree, dfs, recursion
**岗位：** SWE（后端/中间件/电商/支付方向）
**级别：** P7-P8

**问题：** 路径定义为从任意节点出发、沿父子边到达任意节点的序列（至少一个节点，不必经过根）。求所有路径中节点值之和的最大值。

**思路：** 后序 DFS。定义 `gain(node)` 为「以 node 为端点、向下延伸的一条链」的最大贡献，负贡献用 0 截断。在每个节点处，用 `node.val + left + right` 更新全局答案（表示以该节点为拐点、左右都下探的路径），但向上只能返回 `node.val + max(left, right)`（一条链无法分叉）。时间 O(n)，空间 O(h)。

**Python：**
```python
def max_path_sum(root: TreeNode | None) -> int:
    best = float("-inf")
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

**TypeScript：**
```typescript
function maxPathSum(root: TreeNode | null): number {
  let best = -Infinity;
  const gain = (node: TreeNode | null): number => {
    if (node === null) return 0;
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
private int best = Integer.MIN_VALUE;

int maxPathSum(TreeNode root) {
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
```

**要点：**
- 关键在于区分「更新答案的路径」（可分叉）与「向上返回的链」（不可分叉）。
- 用 `max(gain, 0)` 剪掉负贡献子树。
- 全局答案初值必须是负无穷，因为所有节点值可能都为负。

**常见追问：**
- 如果还要返回具体的最大路径节点序列，如何记录？
- 如果是带权边而非节点权值，递推如何调整？

**常见坑：**
- 把向上返回值也写成 `node.val + left + right`，导致路径出现分叉，结果偏大。
- 全局答案初值设为 0，在全负树上会得到错误的 0。

**标签：** #algorithm

---

### 14. 从前序与中序遍历序列构造二叉树

**难度：** 中等
**主题：** tree, recursion, hashmap
**岗位：** SWE（后端/中间件/电商/支付方向）
**级别：** P6-P7

**问题：** 给定二叉树的前序遍历 `preorder` 和中序遍历 `inorder`（元素互不相同），构造并返回这棵二叉树。

**思路：** 前序的第一个元素必为根；在中序中定位该根，其左侧为左子树、右侧为右子树。用哈希表把中序值映射到下标以 O(1) 定位；用一个全局游标按前序顺序依次取根，递归构造左子树再右子树。时间 O(n)，空间 O(n)（哈希表 + 递归栈）。

**Python：**
```python
def build_tree(preorder: list[int], inorder: list[int]) -> TreeNode | None:
    idx = {v: i for i, v in enumerate(inorder)}
    pre = iter(preorder)
    def build(lo: int, hi: int) -> TreeNode | None:
        if lo > hi:
            return None
        val = next(pre)
        node = TreeNode(val)
        mid = idx[val]
        node.left = build(lo, mid - 1)
        node.right = build(mid + 1, hi)
        return node
    return build(0, len(inorder) - 1)
```

**TypeScript：**
```typescript
function buildTree(preorder: number[], inorder: number[]): TreeNode | null {
  const idx = new Map<number, number>();
  inorder.forEach((v, i) => idx.set(v, i));
  let pre = 0;
  const build = (lo: number, hi: number): TreeNode | null => {
    if (lo > hi) return null;
    const val = preorder[pre++];
    const node = new TreeNode(val);
    const mid = idx.get(val)!;
    node.left = build(lo, mid - 1);
    node.right = build(mid + 1, hi);
    return node;
  };
  return build(0, inorder.length - 1);
}
```

**Java：**
```java
private int pre = 0;
private Map<Integer, Integer> idx = new HashMap<>();

TreeNode buildTree(int[] preorder, int[] inorder) {
    for (int i = 0; i < inorder.length; i++) idx.put(inorder[i], i);
    return build(preorder, 0, inorder.length - 1);
}

private TreeNode build(int[] preorder, int lo, int hi) {
    if (lo > hi) return null;
    int val = preorder[pre++];
    TreeNode node = new TreeNode(val);
    int mid = idx.get(val);
    node.left = build(preorder, lo, mid - 1);
    node.right = build(preorder, mid + 1, hi);
    return node;
}
```

**要点：**
- 前序定根、中序分左右是分治的核心。
- 哈希表预存中序下标，把每次定位从 O(n) 降到 O(1)，整体 O(n)。
- 前序游标必须按「根 → 左 → 右」顺序全局单向推进，与递归顺序严格一致。

**常见追问：**
- 用中序 + 后序如何构造？为什么前序 + 后序一般无法唯一确定？
- 能否不用哈希表、纯用索引区间参数完成？

**常见坑：**
- 递归时先建右子树后建左子树，会与前序游标顺序错位。
- 边界用错，把 `mid` 本身划进左或右子区间，导致重复或死循环。

**标签：** #algorithm

---

## 图

### 15. 课程表 II

**难度：** 中等
**主题：** graph, topological-sort, bfs
**岗位：** SWE
**级别：** P5-P6

**问题：** 给定 `numCourses` 和先修课程对，返回一个合法的修课顺序。若不可能则返回空。

**思路：** Kahn 算法（BFS 拓扑排序）：建立邻接表 + 入度，把入度为 0 的节点入队，弹出后递减邻居入度。若输出长度 < numCourses，说明存在环 → 返回空。O(V + E)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 输出长度小于 `numCourses` 即存在环。
- 备选：三色（白/灰/黑）DFS 检测环。
- 合法顺序可能不唯一；任一即可。

**常见追问：**
- Course Schedule I——仅返是否可行。
- 返 *所有* 合法拓扑顺序。
- Alien Dictionary——从有序串推导顺序约束后拓扑排序。
- 检测环并返回环上一个节点用于报错。

**常见坑：**
- DFS 不用三色标记——递归内重访检不出。
- 遇环返部分顺序——题要求返空数组。

**标签：** #algorithm

---

### 16. 网络延迟时间

**难度：** 中等
**主题：** graph, dijkstra, shortest-path
**岗位：** P5
**级别：** P5-P6

**问题：** 给定 `n` 个节点和有向带权边，求从节点 `k` 发送的信号到达所有节点的时间。

**思路：** 从 `k` 出发用最小堆的 Dijkstra。维护 `dist[]`。返回所有 dist 的最大值；若有节点不可达返回 -1。O((V+E) log V)。若有负权用 Bellman-Ford，O(V*E)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 弹出时比对 `dist[u]` 跳过过期项。
- 答案为所有最短路距离的最大值。
- 负权图改用 Bellman-Ford 或 SPFA，Dijkstra 不适用。

**标签：** #algorithm

---

### 17. K 站中转内最便宜的航班

**难度：** 中等
**主题：** graph, dp, bellman-ford
**岗位：** P6
**级别：** P6-P7

**问题：** 给定航班 `[from, to, price]`，求从 `src` 到 `dst` 最多经过 `k` 个中转的最便宜路径。

**思路：** Bellman-Ford 风格：迭代 k+1 次，每次基于上一轮的距离做松弛（使用快照确保边数限制）。O(k*E)。改造 Dijkstra 携带 (cost, node, stops) 也可，但要小心重复访问。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 用快照确保每轮只多走一条新边。
- k 次中转 = k+1 条边，循环 k+1 次。
- 堆方案允许节点按不同中转数被重复访问。

**标签：** #algorithm

---

### 18. 最小体力消耗路径

**难度：** 中等
**主题：** graph, dijkstra, binary-search, union-find
**岗位：** P6
**级别：** P6-P7

**问题：** 给定二维高度网格，从左上到右下找一条路径，最小化相邻格高度差的最大值。

**思路：** 改造 Dijkstra：距离取路径上的最大边（minimax）。优先队列按目前最大消耗排序。O(mn log(mn))。备选：二分答案 + BFS/DFS，或按边权排序的并查集（Kruskal 风格）。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 路径代价是边的 `max` 而非 `sum`，松弛公式要相应改写。
- Dijkstra 中目标节点首次出堆即可返回。
- 二分答案 + BFS 也是清爽的解法。

**标签：** #algorithm

---

### 19. 使网格图至少有一条有效路径的最小代价

**难度：** 困难
**主题：** graph, 0-1-bfs, dijkstra
**岗位：** P7
**级别：** P7

**问题：** 网格每格带方向标志。按方向走代价 0，否则需要改方向代价 1。求 (0,0) 到 (m-1,n-1) 的最小代价。

**思路：** 用双端队列做 0-1 BFS。0 代价移动从前端入队，1 代价从后端入队。O(m*n)。等价于边权 ∈ {0,1} 图上的 Dijkstra。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 0-1 BFS 用双端队列维持距离非递减序。
- 方向编号 (1..4) 与 `dirs` 顺序必须一致。
- 等价于 {0,1} 权 Dijkstra，但队列更轻量。

**标签：** #algorithm

---

### 20. 阈值距离内邻居最少的城市

**难度：** 中等
**主题：** graph, floyd-warshall, shortest-path
**岗位：** P6
**级别：** P6

**问题：** 给定 `n` 个城市和带权边，找出在 `distanceThreshold` 内可达城市数最少的城市。并列取索引最大者。

**思路：** Floyd-Warshall 全源最短路 O(n^3)。对每个城市统计 `dist <= threshold` 的邻居数。返回最少的、并列取较大索引。稀疏图可改为 n 次 Dijkstra：O(n*(V+E)logV)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- Floyd-Warshall 必须把 `k` 放最外层才正确。
- `<=` 自然实现"并列取较大索引"（覆盖写入）。
- 稀疏图更推荐 n 次 Dijkstra。

**标签：** #algorithm

---

### 21. 重新安排行程

**难度：** 困难
**主题：** graph, euler-path, dfs, hierholzer
**岗位：** P6
**级别：** P6-P7

**问题：** 给定机票 `[from, to]`，重建从 JFK 出发、使用所有机票恰好一次的行程。返回字典序最小的方案。

**思路：** Hierholzer 算法求欧拉路径。每个起点的目的地排序（用小顶堆）。DFS，后序把节点加入结果；最后反转。O(E log E)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 后序入栈后反转即可得到正确顺序。
- 每次取字典序最小的边。
- Hierholzer 在欧拉路径存在时一定能构造出来。

**标签：** #algorithm

---

### 22. 单词接龙 II

**难度：** 困难
**主题：** graph, bfs, backtracking
**岗位：** P7
**级别：** P7

**问题：** 给定起始词、结束词和词典，找出所有从起始到结束的最短转换序列，相邻词仅差一个字母。

**思路：** 两阶段：(1) 按层 BFS 建立父图，到达包含终点的层时停止。(2) 沿父图从终点回溯到起点 DFS 枚举所有路径。用单词模式（如 `h*t`）做桶来高效找邻居。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- BFS 求最短长度，DFS 沿父图枚举所有路径。
- 每层结束后再统一移除访问过的词，保持平行分支。
- 一旦某层含终点，立即停止 BFS。

**复杂度：** BFS 为 O(N · L²)，N 个长为 L 的词、每次邻居探测 O(L)；随后回溯按输出的最短路径数量增加耗时。

**标签：** #algorithm

---

### 23. 被围绕的区域

**难度：** 中等
**主题：** graph, dfs, bfs, union-find
**岗位：** P5
**级别：** P5-P6

**问题：** 给定二维 'X' 和 'O' 的棋盘，捕获所有被 'X' 四面围绕的 'O' 区域（翻成 'X'）。

**思路：** 优先处理边界：从边界上每个 'O' 做 DFS/BFS，把连通的 'O' 标记为安全（如 '#'）。然后扫描：剩余 'O' → 'X'，'#' → 'O'。O(m*n)。带虚拟边界节点的并查集也行。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 只有与边界连通的 'O' 才安全。
- DFS 时先打哨兵 '#'，最后统一替换。
- 用迭代栈避免大网格爆栈。

**标签：** #algorithm

---

### 24. 岛屿数量 II

**难度：** 困难
**主题：** union-find, graph
**岗位：** P6
**级别：** P6-P7

**问题：** 给定初始全为水的 `m x n` 网格，处理一系列加陆地操作。每次操作后返回当前岛屿数。

**思路：** 路径压缩 + 按秩合并的并查集。每次加陆地时计数 +1；对每个相邻陆地合并并在新合并时计数 -1。k 次操作 O(k * alpha(mn))。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 父数组初始化 -1，便于区分水和陆地。
- 加陆地先 +1，合并成功才 -1。
- 路径压缩使 `find` 均摊近 O(1)。

**标签：** #algorithm

---

### 25. 账户合并

**难度：** 中等
**主题：** union-find, graph, dfs
**岗位：** P6
**级别：** P6-P7

**问题：** 给定账户列表（姓名 + 邮箱），合并共享任一邮箱的账户。每个账户输出排序后的邮箱。

**思路：** 在邮箱字符串上做并查集：映射 email → index，同账户内全部合并。按根分组，每组排序，加上姓名前缀。O(n*k*alpha(n*k)) 加排序成本。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 邮箱字符串本身就可以作为并查集节点。
- owner 表按邮箱建即可（同邮箱必同人）。
- 按根分组，每组邮箱排序后输出。

**标签：** #algorithm

---

### 26. 移除最多的同行或同列石头

**难度：** 中等
**主题：** union-find, graph
**岗位：** P6
**级别：** P6

**问题：** 二维平面上的石头。若一块石头与另一块同行或同列，则可移除。求最多可移除数量。

**思路：** 并查集：把同行或同列的石头合并（或把行 r 编码为 `~r` 与列分开命名空间）。答案 = n - 连通分量数。O(n*alpha(n))。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 每个连通分量最终留下一颗石头。
- `~c`（按位取反）把列 id 与行 id 隔离。
- 统计分量时用行即可，列已通过并查集触达。

**标签：** #algorithm

---

### 27. 冗余连接

**难度：** 中等
**主题：** union-find, graph
**岗位：** P5
**级别：** P5-P6

**问题：** 一棵 n 节点的树被加了一条多余边。找出可以删除使其重回树的那条边。若多个答案，返回最后一条。

**思路：** 并查集：按顺序遍历边；若两端已同属一个连通分量，那就是冗余边。O(n*alpha(n))。

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

**要点：**
- 第一条形成环的边就是答案（题目保证只多一条边）。
- 路径压缩使 `find` 接近 O(1)。
- 提前返回避免无意义合并。

**标签：** #algorithm

---

### 28. 网络中的关键连接

**难度：** 困难
**主题：** graph, tarjan, bridges, dfs
**岗位：** SWE（中间件方向）
**级别：** P7 或 P7-P8

**问题：** 给定 `n` 台服务器和无向 `connections`，返回所有关键连接（桥），即删除后会使网络部分断开的边。

**思路：** Tarjan 求桥。DFS 为每个节点记录发现时间 `disc[u]` 与 `low[u]`（`u` 子树经至多一条回边能到达的最小发现时间）。当 `low[v] > disc[u]` 时边 `(u, v)` 是桥，说明 `v` 的子树没有指向 `u` 之上的回边。需跳过一次直接父边。时间 O(V+E)，空间 O(V+E)。在分布式基础设施中，这能定位断掉后会分裂集群的单点链路。

**Python：**
```python
def critical_connections(n: int, connections: list[list[int]]) -> list[list[int]]:
    adj: list[list[int]] = [[] for _ in range(n)]
    for u, v in connections:
        adj[u].append(v)
        adj[v].append(u)
    disc = [-1] * n
    low = [0] * n
    res: list[list[int]] = []
    timer = 0

    def dfs(u: int, parent: int) -> None:
        nonlocal timer
        disc[u] = low[u] = timer
        timer += 1
        for v in adj[u]:
            if disc[v] == -1:
                dfs(v, u)
                low[u] = min(low[u], low[v])
                if low[v] > disc[u]:
                    res.append([u, v])
            elif v != parent:
                low[u] = min(low[u], disc[v])

    for i in range(n):
        if disc[i] == -1:
            dfs(i, -1)
    return res
```

**TypeScript：**
```typescript
function criticalConnections(n: number, connections: number[][]): number[][] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of connections) { adj[u].push(v); adj[v].push(u); }
  const disc = new Array(n).fill(-1);
  const low = new Array(n).fill(0);
  const res: number[][] = [];
  let timer = 0;

  const dfs = (u: number, parent: number): void => {
    disc[u] = low[u] = timer++;
    for (const v of adj[u]) {
      if (disc[v] === -1) {
        dfs(v, u);
        low[u] = Math.min(low[u], low[v]);
        if (low[v] > disc[u]) res.push([u, v]);
      } else if (v !== parent) {
        low[u] = Math.min(low[u], disc[v]);
      }
    }
  };

  for (let i = 0; i < n; i++) if (disc[i] === -1) dfs(i, -1);
  return res;
}
```

**Java：**
```java
List<List<Integer>> criticalConnections(int n, List<List<Integer>> connections) {
    List<List<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
    for (List<Integer> c : connections) {
        adj.get(c.get(0)).add(c.get(1));
        adj.get(c.get(1)).add(c.get(0));
    }
    int[] disc = new int[n], low = new int[n];
    Arrays.fill(disc, -1);
    List<List<Integer>> res = new ArrayList<>();
    int[] timer = {0};
    for (int i = 0; i < n; i++)
        if (disc[i] == -1) dfs(i, -1, adj, disc, low, timer, res);
    return res;
}

void dfs(int u, int parent, List<List<Integer>> adj, int[] disc, int[] low, int[] timer, List<List<Integer>> res) {
    disc[u] = low[u] = timer[0]++;
    for (int v : adj.get(u)) {
        if (disc[v] == -1) {
            dfs(v, u, adj, disc, low, timer, res);
            low[u] = Math.min(low[u], low[v]);
            if (low[v] > disc[u]) res.add(Arrays.asList(u, v));
        } else if (v != parent) {
            low[u] = Math.min(low[u], disc[v]);
        }
    }
}
```

**要点：**
- 桥恰好是满足 `low[v] > disc[u]` 的边；任何回边都会使 `low[v] <= disc[u]`。
- 回边更新 `low` 时用 `disc[v]`（而非 `low[v]`）以保证不变式正确。
- 遍历所有节点以处理非连通图。

**常见追问：**
- 如何改为求割点（关节点）而非桥？
- 如何处理同一对节点间的重边（重复边永远不是桥）？

**常见坑：**
- 用节点编号跳过父节点在有重边时会出错；应按边编号或计数跳过。
- 大图递归深度可能溢出，可改用显式栈。

**标签：** #algorithm

---

### 29. 火星词典

**难度：** 困难
**主题：** graph, topological-sort, bfs, dfs
**岗位：** SWE（后端方向）
**级别：** P7

**问题：** 给定按某未知字母表字典序排列的单词列表 `words`，推导出任意一个合法的字符顺序；若顺序矛盾则返回 `""`。

**思路：** 对相邻单词对，从第一个不同的字符建一条有向边，构造图。对不同字符做拓扑排序（Kahn BFS）。若存在环则无合法顺序（返回 `""`）。关键边界：若 `w1` 是 `w2` 的前缀但更长（如 `"abc"` 排在 `"ab"` 前），输入非法。时间 O(C)，C 为字符总数。这与用有向无环图推导模块/服务启动顺序是同一套依赖推理。

**Python：**
```python
from collections import deque

def alien_order(words: list[str]) -> str:
    adj: dict[str, set[str]] = {c: set() for w in words for c in w}
    indeg: dict[str, int] = {c: 0 for c in adj}
    for a, b in zip(words, words[1:]):
        for x, y in zip(a, b):
            if x != y:
                if y not in adj[x]:
                    adj[x].add(y)
                    indeg[y] += 1
                break
        else:
            if len(a) > len(b):
                return ""
    q = deque([c for c in indeg if indeg[c] == 0])
    out: list[str] = []
    while q:
        c = q.popleft()
        out.append(c)
        for nxt in adj[c]:
            indeg[nxt] -= 1
            if indeg[nxt] == 0:
                q.append(nxt)
    return "".join(out) if len(out) == len(indeg) else ""
```

**TypeScript：**
```typescript
function alienOrder(words: string[]): string {
  const adj = new Map<string, Set<string>>();
  const indeg = new Map<string, number>();
  for (const w of words) for (const c of w) {
    if (!adj.has(c)) { adj.set(c, new Set()); indeg.set(c, 0); }
  }
  for (let i = 0; i + 1 < words.length; i++) {
    const a = words[i], b = words[i + 1];
    const n = Math.min(a.length, b.length);
    let j = 0;
    for (; j < n; j++) {
      if (a[j] !== b[j]) {
        if (!adj.get(a[j])!.has(b[j])) {
          adj.get(a[j])!.add(b[j]);
          indeg.set(b[j], indeg.get(b[j])! + 1);
        }
        break;
      }
    }
    if (j === n && a.length > b.length) return "";
  }
  const q: string[] = [];
  for (const [c, d] of indeg) if (d === 0) q.push(c);
  const out: string[] = [];
  while (q.length) {
    const c = q.shift()!;
    out.push(c);
    for (const nxt of adj.get(c)!) {
      indeg.set(nxt, indeg.get(nxt)! - 1);
      if (indeg.get(nxt) === 0) q.push(nxt);
    }
  }
  return out.length === indeg.size ? out.join("") : "";
}
```

**Java：**
```java
String alienOrder(String[] words) {
    Map<Character, Set<Character>> adj = new HashMap<>();
    Map<Character, Integer> indeg = new HashMap<>();
    for (String w : words) for (char c : w.toCharArray()) {
        adj.putIfAbsent(c, new HashSet<>());
        indeg.putIfAbsent(c, 0);
    }
    for (int i = 0; i + 1 < words.length; i++) {
        String a = words[i], b = words[i + 1];
        int n = Math.min(a.length(), b.length()), j = 0;
        for (; j < n; j++) {
            char x = a.charAt(j), y = b.charAt(j);
            if (x != y) {
                if (adj.get(x).add(y)) indeg.merge(y, 1, Integer::sum);
                break;
            }
        }
        if (j == n && a.length() > b.length()) return "";
    }
    Deque<Character> q = new ArrayDeque<>();
    for (var e : indeg.entrySet()) if (e.getValue() == 0) q.offer(e.getKey());
    StringBuilder sb = new StringBuilder();
    while (!q.isEmpty()) {
        char c = q.poll();
        sb.append(c);
        for (char nxt : adj.get(c)) {
            indeg.merge(nxt, -1, Integer::sum);
            if (indeg.get(nxt) == 0) q.offer(nxt);
        }
    }
    return sb.length() == indeg.size() ? sb.toString() : "";
}
```

**要点：**
- 每对相邻单词至多贡献一条边，取自第一个不同的字符。
- 输出长度小于字符集大小说明有环，即非法。
- 前缀情形（`"abc"` 排在 `"ab"` 前）必须显式返回 `""`。

**常见追问：**
- 如何返回所有合法顺序而非任意一个（对入度为 0 的选择做回溯）？
- 如何检测并报告矛盾发生的位置？

**常见坑：**
- 重复加边会虚增入度，破坏拓扑排序。
- 遗漏前缀非法判定会得到错误的非空答案。

**标签：** #algorithm

---

### 30. 除法求值

**难度：** 中等
**主题：** graph, union-find, dfs, weighted-edges
**岗位：** SWE（后端方向）
**级别：** P6-P7

**问题：** 给定形如 `a / b = 2.0` 的等式，回答如 `a / c = ?` 的查询；无法确定时返回 `-1.0`。

**思路：** 把变量建成节点，每个等式建两条有向带权边（`a->b = 2.0`、`b->a = 0.5`）。查询时沿路径 DFS/BFS 累乘边权即可。更优雅的做法是带权并查集：每个节点存到父节点的比值，`find` 在路径压缩的同时累乘比值，两个变量可比当且仅当同根。DFS 复杂度 O(Q * (V+E))，并查集近似摊还 O(Q)。这种比值传播与电商系统里的汇率/价格换算图同源。

**Python：**
```python
def calc_equation(equations: list[list[str]], values: list[float],
                  queries: list[list[str]]) -> list[float]:
    parent: dict[str, str] = {}
    ratio: dict[str, float] = {}

    def find(x: str) -> str:
        if x not in parent:
            parent[x], ratio[x] = x, 1.0
        if parent[x] != x:
            root = find(parent[x])
            ratio[x] *= ratio[parent[x]]
            parent[x] = root
        return parent[x]

    def union(a: str, b: str, val: float) -> None:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb
            ratio[ra] = val * ratio[b] / ratio[a]

    for (a, b), v in zip(equations, values):
        union(a, b, v)

    res: list[float] = []
    for a, b in queries:
        if a not in parent or b not in parent or find(a) != find(b):
            res.append(-1.0)
        else:
            res.append(ratio[a] / ratio[b])
    return res
```

**TypeScript：**
```typescript
function calcEquation(equations: string[][], values: number[], queries: string[][]): number[] {
  const parent = new Map<string, string>();
  const ratio = new Map<string, number>();

  const find = (x: string): string => {
    if (!parent.has(x)) { parent.set(x, x); ratio.set(x, 1); }
    if (parent.get(x) !== x) {
      const root = find(parent.get(x)!);
      ratio.set(x, ratio.get(x)! * ratio.get(parent.get(x)!)!);
      parent.set(x, root);
    }
    return parent.get(x)!;
  };

  const union = (a: string, b: string, val: number): void => {
    const ra = find(a), rb = find(b);
    if (ra !== rb) {
      parent.set(ra, rb);
      ratio.set(ra, (val * ratio.get(b)!) / ratio.get(a)!);
    }
  };

  for (let i = 0; i < equations.length; i++) union(equations[i][0], equations[i][1], values[i]);

  return queries.map(([a, b]) => {
    if (!parent.has(a) || !parent.has(b) || find(a) !== find(b)) return -1;
    return ratio.get(a)! / ratio.get(b)!;
  });
}
```

**Java：**
```java
double[] calcEquation(List<List<String>> equations, double[] values, List<List<String>> queries) {
    Map<String, String> parent = new HashMap<>();
    Map<String, Double> ratio = new HashMap<>();
    for (int i = 0; i < equations.size(); i++) {
        String a = equations.get(i).get(0), b = equations.get(i).get(1);
        String ra = find(a, parent, ratio), rb = find(b, parent, ratio);
        if (!ra.equals(rb)) {
            parent.put(ra, rb);
            ratio.put(ra, values[i] * ratio.get(b) / ratio.get(a));
        }
    }
    double[] res = new double[queries.size()];
    for (int i = 0; i < queries.size(); i++) {
        String a = queries.get(i).get(0), b = queries.get(i).get(1);
        if (!parent.containsKey(a) || !parent.containsKey(b)
                || !find(a, parent, ratio).equals(find(b, parent, ratio)))
            res[i] = -1.0;
        else res[i] = ratio.get(a) / ratio.get(b);
    }
    return res;
}

String find(String x, Map<String, String> parent, Map<String, Double> ratio) {
    parent.putIfAbsent(x, x);
    ratio.putIfAbsent(x, 1.0);
    if (!parent.get(x).equals(x)) {
        String root = find(parent.get(x), parent, ratio);
        ratio.put(x, ratio.get(x) * ratio.get(parent.get(x)));
        parent.put(x, root);
    }
    return parent.get(x);
}
```

**要点：**
- 存储到父节点的比值，`find` 在路径压缩时累乘该比值。
- 两个变量可比当且仅当归并到同一个根。
- 等式中从未出现的变量，其查询一律返回 `-1.0`。

**常见追问：**
- 如何检测矛盾的等式集合（如先 `a/b=2` 后 `a/b=3`）？
- 在查询密集场景下比较 DFS 与并查集的优劣。

**常见坑：**
- 在读取 `ratio[parent[x]]` 之前就压缩路径会破坏乘积；应先读后改。
- 对未知变量的自查询 `x/x` 应为 `-1.0` 而非 `1.0`。

**标签：** #algorithm

---

## 堆 / 优先队列

### 31. 数据流的中位数

**难度：** 困难
**主题：** heap, design, streaming
**岗位：** SWE
**级别：** P6-P7

**问题：** 对一个整数流，实现 `addNum(int)` 和 `findMedian()`。

**思路：** 用大顶堆维护下半部分，小顶堆维护上半部分。再平衡使两堆大小差不超过 1。中位数 = 较大堆的堆顶，或两堆顶的平均。添加 O(log n)，查询 O(1)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 两个堆把数据流二分，规模守恒使中位数始终在堆顶。
- 没有原生大顶堆时取负即可模拟。
- 查询 O(1)，添加均摊 O(log n)。

**常见追问：**
- 滑动窗口中位数——增加删除/过期支持。
- 数据流中 99 分位——t-digest 或 HDR 直方图。
- 跨分片分布式中位数——在候选值上二分。
- 内存受限的流式中位数（近似）——蒓藕池采样。

**常见坑：**
- 堆大小偏差超过 1——中位数走偏。
- 首次 offer 后未做平衡——首个中位数错。

**标签：** #algorithm

---

### 32. 设计推特

**难度：** 中等
**主题：** design, heap, hashmap, ood
**岗位：** P6
**级别：** P6-P7

**问题：** 设计一个简化版推特，支持 `postTweet`、`getNewsFeed`（取本人 + 关注者的 top 10）、`follow`、`unfollow`。

**思路：** `userId -> (时间戳, tweetId) 列表`、`userId -> 关注者集合`。生成 feed 时做 k 路归并：把每个关注者（含自己）的最新推文按时间戳推入大顶堆，弹出 10 次，每弹出再推同一来源的下一条。O((关注者数 + 10) log 关注者数)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 每条推文带单调时间戳，保证全局有序。
- 堆做 k 路归并最优；n 小时直接排序也行。
- 取 feed 时记得把自己的推文也加进来。

**标签：** #algorithm

---

### 33. 数据流中的 Top-K 高频元素

**难度：** 困难
**主题：** design, heap, streaming, hashmap
**岗位：** P7
**级别：** P7-P8

**问题：** 为无界数据流设计数据结构，支持 `add(item)`，并提供 `getTopK()` 返回至今频率最高的 K 个元素。

**思路：** HashMap<item, count> + 大小为 K 的最小堆（按 count 排序）。`add` 时计数 +1；若 item 已在堆中，重新堆化（用带索引的堆）；否则若 count > 堆顶最小值，弹出最小值、压入新 item。每次 add O(log K)。海量流场景：用 Count-Min Sketch（近似）或 Misra-Gries heavy hitters 以亚线性内存处理。讨论精度/内存权衡。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 大小 K 的最小堆即可维持 top-K，整体 O(n log K)。
- 真·无界数据流用 Count-Min Sketch 或 Misra-Gries，亚线性内存。
- 堆顶即 top-K 中最小者，便于做阈值判断。

**标签：** #algorithm

---

### 34. 最接近原点的 K 个点

**难度：** 中等
**主题：** heap, sorting, geometry
**岗位：** SWE（后端/中间件/电商/支付方向）
**级别：** P6-P7

**问题：** 给定平面上的点集 `points` 和整数 `k`，返回距离原点最近的 `k` 个点（欧氏距离，顺序不限）。

**思路：** 维护一个大小为 `k` 的大顶堆（按距离），遍历时若堆未满直接入堆，否则当前点比堆顶（当前最远）更近就替换堆顶。距离比较用平方和避免开方。时间 O(n log k)，空间 O(k)，优于整体排序 O(n log n)——在高德/飞猪按位置召回 Top-K POI 时更省内存。

**Python：**
```python
import heapq

def kClosest(points: list[list[int]], k: int) -> list[list[int]]:
    heap: list[tuple[int, list[int]]] = []  # max-heap by negated distance
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
  const dist = (p: number[]) => p[0] * p[0] + p[1] * p[1];
  const heap: number[][] = [];  // max-heap by distance
  const up = (i: number) => { while (i > 0) { const p = (i - 1) >> 1; if (dist(heap[p]) >= dist(heap[i])) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const down = (i: number) => { const n = heap.length; for (;;) { const l = 2 * i + 1, r = 2 * i + 2; let m = i; if (l < n && dist(heap[l]) > dist(heap[m])) m = l; if (r < n && dist(heap[r]) > dist(heap[m])) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } };
  for (const pt of points) {
    if (heap.length < k) { heap.push(pt); up(heap.length - 1); }
    else if (dist(pt) < dist(heap[0])) { heap[0] = pt; down(0); }
  }
  return heap;
}
```

**Java：**
```java
public int[][] kClosest(int[][] points, int k) {
    // max-heap by distance so the farthest sits on top
    PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) ->
        (b[0] * b[0] + b[1] * b[1]) - (a[0] * a[0] + a[1] * a[1]));
    for (int[] p : points) {
        heap.offer(p);
        if (heap.size() > k) heap.poll();
    }
    return heap.toArray(new int[0][]);
}
```

**要点：**
- 求「最近 K 个」用大顶堆而非小顶堆，堆里保留当前最优的 k 个，堆顶是待淘汰者。
- 比较距离用平方和，避免浮点开方带来的精度与性能损耗。
- n 远大于 k 时 O(n log k) 明显优于全排序；k 接近 n 时可考虑快速选择 O(n)。

**常见追问：**
- 数据量超内存、分布在多分片——各分片先出局部 Top-K 再归并。
- 要求严格最优平均复杂度——用快速选择（Quickselect）到第 k 位分界。

**常见坑：**
- 用小顶堆保留 k 个会得到最远的 k 个，方向反了。
- 距离先开方再比较，既慢又可能因浮点误差导致排序不稳定。

**标签：** #algorithm

---

### 35. 会议室 II

**难度：** 中等
**主题：** heap, sorting, intervals, greedy
**岗位：** SWE（后端/中间件/电商/支付方向）
**级别：** P6-P7

**问题：** 给定若干会议时间区间 `[start, end)`，返回同时进行所需的最少会议室数量。

**思路：** 按开始时间排序，用小顶堆保存各会议室的最早结束时间。处理新会议时，若堆顶（最早结束）不晚于当前开始，说明可复用该会议室，替换堆顶；否则新开一间。堆的最大规模即答案。时间 O(n log n)，空间 O(n)——等价于飞猪/钉钉日程排布中的资源峰值占用问题。

**Python：**
```python
import heapq

def minMeetingRooms(intervals: list[list[int]]) -> int:
    intervals.sort(key=lambda x: x[0])
    ends: list[int] = []  # min-heap of end times
    for start, end in intervals:
        if ends and ends[0] <= start:
            heapq.heapreplace(ends, end)  # reuse the earliest-freed room
        else:
            heapq.heappush(ends, end)
    return len(ends)
```

**TypeScript：**
```typescript
function minMeetingRooms(intervals: number[][]): number {
  intervals.sort((a, b) => a[0] - b[0]);
  const ends: number[] = [];  // min-heap of end times
  const up = (i: number) => { while (i > 0) { const p = (i - 1) >> 1; if (ends[p] <= ends[i]) break; [ends[p], ends[i]] = [ends[i], ends[p]]; i = p; } };
  const down = (i: number) => { const n = ends.length; for (;;) { const l = 2 * i + 1, r = 2 * i + 2; let m = i; if (l < n && ends[l] < ends[m]) m = l; if (r < n && ends[r] < ends[m]) m = r; if (m === i) break; [ends[m], ends[i]] = [ends[i], ends[m]]; i = m; } };
  for (const [s, e] of intervals) {
    if (ends.length && ends[0] <= s) { ends[0] = e; down(0); }
    else { ends.push(e); up(ends.length - 1); }
  }
  return ends.length;
}
```

**Java：**
```java
public int minMeetingRooms(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
    PriorityQueue<Integer> ends = new PriorityQueue<>(); // min-heap of end times
    for (int[] iv : intervals) {
        if (!ends.isEmpty() && ends.peek() <= iv[0]) ends.poll(); // reuse a room
        ends.offer(iv[1]);
    }
    return ends.size();
}
```

**要点：**
- 按开始排序保证时间轴向前推进，堆顶总是最早空出的会议室。
- 半开区间语义下 `end <= start` 才算可复用；边界重叠视需求而定。
- 也可用「开始/结束事件排序 + 计数扫描」的差分做法，同样 O(n log n)。

**常见追问：**
- 不仅要数量还要具体分配方案——堆里存 (结束时间, 房间号)。
- 会议动态到来的在线场景——用 TreeMap 维护并发计数增量。

**常见坑：**
- 忘记先按开始时间排序，堆逻辑直接失效。
- 把 `<=` 写成 `<`（或反之），在边界紧挨的会议上多算/少算一间。

**标签：** #algorithm

---

## 栈 / 队列

### 36. 每日温度

**难度：** 中等
**主题：** stack, monotonic-stack, array
**岗位：** SWE（后端/中间件/电商/支付方向）
**级别：** P6-P7

**问题：** 给定每天温度数组 `temps`，返回数组 `res`，其中 `res[i]` 表示要等多少天才会遇到更高温度；若之后不再升高则为 0。

**思路：** 单调栈经典题。栈中保存「尚未找到更高温度」的下标，保持对应温度单调递减。遍历到 `temps[i]` 时，只要它高于栈顶下标的温度，就弹栈并用 `i - j` 填答案。每个下标至多入栈、出栈各一次，时间 O(n)，空间 O(n)。这种「找下一个更大元素」的模式在监控告警、价格趋势等场景很常用。

**Python：**
```python
def dailyTemperatures(temps: list[int]) -> list[int]:
    res = [0] * len(temps)
    stack: list[int] = []  # indices with strictly decreasing temperatures
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
  const stack: number[] = [];  // indices with strictly decreasing temperatures
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
public int[] dailyTemperatures(int[] temps) {
    int[] res = new int[temps.length];
    Deque<Integer> stack = new ArrayDeque<>(); // indices, decreasing temperatures
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
- 栈里存下标而非温度值，才能算出天数差。
- 每个元素进出栈各一次，均摊 O(1)，整体线性。
- 遍历结束仍留在栈中的下标天然保持默认值 0，无需额外处理。

**常见追问：**
- 求「下一个更小元素」——把比较符号取反即可。
- 循环数组版本——遍历两遍或对下标取模。

**常见坑：**
- 用 `<=` 而非 `<` 会在相等温度上错误弹栈，得到 0 而非正确天数。
- 栈存温度值导致无法回推下标、算不出间隔。

**标签：** #algorithm

---

### 37. 滑动窗口最大值

**难度：** 困难
**主题：** queue, monotonic-deque, sliding-window
**岗位：** SWE（后端/中间件/电商/支付方向）
**级别：** P7

**问题：** 给定数组 `nums` 和窗口大小 `k`，窗口从左向右每次滑动一位，返回每个窗口内的最大值。

**思路：** 单调递减双端队列。队列存下标，对应值从队首到队尾单调递减。新元素入队前，把队尾所有不大于它的下标弹出（它们不可能再成为最大值）；再从队首移除滑出窗口的过期下标；当窗口成形时，队首下标对应当前窗口最大值。每个下标进出队各一次，时间 O(n)，空间 O(k)——比堆做法（O(n log k) 且删除麻烦）更适合实时监控/限流的滑动统计。

**Python：**
```python
from collections import deque

def maxSlidingWindow(nums: list[int], k: int) -> list[int]:
    dq: deque[int] = deque()  # indices, values decreasing front -> back
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
  const dq: number[] = [];  // indices, values decreasing front -> back
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
public int[] maxSlidingWindow(int[] nums, int k) {
    Deque<Integer> dq = new ArrayDeque<>(); // indices, values decreasing front -> back
    int[] res = new int[nums.length - k + 1];
    for (int i = 0; i < nums.length; i++) {
        while (!dq.isEmpty() && nums[dq.peekLast()] <= nums[i]) dq.pollLast();
        dq.offerLast(i);
        if (dq.peekFirst() <= i - k) dq.pollFirst();
        if (i >= k - 1) res[i - k + 1] = nums[dq.peekFirst()];
    }
    return res;
}
```

**要点：**
- 队列存下标，才能判断队首是否已滑出窗口。
- 队尾弹出不大于新值的元素，保证队列单调递减、队首恒为窗口最大值。
- 每个下标进出队各一次，整体 O(n)，优于堆的 O(n log k)。

**常见追问：**
- 改求窗口最小值——把单调方向反过来即可。
- 求窗口内第 K 大——改用两个堆或有序结构（复杂度上升）。

**常见坑：**
- 用 `<` 而非 `<=` 弹队尾，遇到相等值会残留冗余下标（结果仍对但队列变长）。
- 忘记按 `dq[0] <= i - k` 移除过期下标，会读到窗口外的旧最大值。

**标签：** #algorithm

---

## 哈希表

### 38. 至多包含 K 个不同字符的最长子串

**难度：** 中等
**主题：** sliding-window, hashmap, strings
**岗位：** SWE
**级别：** P5-P6

**问题：** 给定字符串 `s` 和整数 `k`，返回至多包含 `k` 个不同字符的最长子串长度。

**思路：** 滑动窗口 + `char -> count` 哈希表。右指针扩张；当 map size > k 时，左指针收缩，递减/删除字符。维护最大窗口长度。O(n)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 每个字符进出窗口各一次，均摊 O(n)。
- 计数归零时要删除键，`len(cnt)` 才准确。
- `k == 0` 为特殊情况，直接返回 0。

**常见追问：**
- *恰好* K 个不同字符的最长子串。
- 至多 2 个不同（特例）。
- 包含 `t` 所有字符的最小窗（Minimum Window Substring）。
- 返回实际子串而不仅是长度。

**常见坑：**
- 不删零计数键——`cnt.size()` 夸大了不同数。
- 收缩条件用 `cnt.size() >= k` 而不是 `> k`——off-by-one。

**标签：** #algorithm

---

### 39. O(1) 时间插入、删除和获取随机元素

**难度：** 中等
**主题：** design, hashmap, array
**岗位：** P5
**级别：** P5-P6

**问题：** 设计一个集合，支持平均 O(1) 的 `insert`、`delete`、`getRandom`。

**思路：** 数组 + 哈希表（`val -> 数组下标`）。插入：追加到数组并记录下标。删除：与末尾元素交换、弹出末尾、更新哈希表。GetRandom：在数组范围内随机一个下标。全部 O(1)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 与末尾交换保持数组紧凑，便于随机下标。
- 删除时既要删原值，也要更新被换上来的元素下标。
- 所有操作均摊 O(1)。

**标签：** #algorithm

---

### 40. 一致性哈希环模拟

**难度：** 困难
**主题：** design, hashing, distributed, tree-map
**岗位：** P7
**级别：** P7

**问题：** 实现带虚拟节点的一致性哈希，支持 `addNode(id)`、`removeNode(id)`、`getNode(key)`。节点变化时最小化 key 迁移。

**思路：** TreeMap<hash 值, nodeId>。每个物理节点对应 V 个虚拟节点（V ~ 100-200），各自哈希到环上。`getNode(key)`：哈希 key，找 map 中的 ceiling 项（无则环回首项）。增删节点 = 增删 V 个 map 项。查询 O(log n)，增删 O(V log n)。讨论：负载均衡方差、加权节点（不同节点不同 V）、哈希函数（Murmur/SHA1）。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 虚拟节点抹平负载倾斜，每物理节点 100-200 个常见。
- 排序数组上二分，查询 O(log n)。
- 节点变更只迁移约 `1/N` 的 key，这是一致性哈希的核心。

**标签：** #algorithm

---

### 41. 字母异位词分组

**难度：** 中等
**主题：** hashmap, strings, sorting
**岗位：** SWE（后端/电商方向）
**级别：** P6-P7

**问题：** 给定字符串数组 `strs`，将互为字母异位词的字符串分为一组，返回分组结果（顺序任意）。

**思路：** 两个字符串互为异位词，当且仅当它们排序后（或字符计数）相同。用这个规范化形式作为哈希表的键，把每个词追加到对应桶。排序作键：O(n·k log k)；用长度 26 的计数数组作键可降到 O(n·k)，k 为最长词长。这是阿里订单/商品打标、类目归桶场景的热身筛选题。

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
- 规范化键对同组所有异位词必须完全一致——排序字符或定长计数向量。
- 基于计数的键（`#a#b#...`）可省去长词的 `log k` 排序开销。
- 组内、组间顺序都不影响正确性，只看归属。

**常见追问：**
- 用长度 26 的计数数组拼成键，论证复杂度收益。
- 处理 Unicode / 多字节字符（按码点而非字节排序）。
- 按组大小或字典序返回分组。

**常见坑：**
- 用原始字符串作键——只有完全相同才归组，而非异位词。
- 构造计数键不加分隔符（不同计数的 `"110"` 会碰撞）。

**标签：** #algorithm

---

### 42. 最长连续序列

**难度：** 中等
**主题：** hashset, arrays, union-find
**岗位：** SWE（后端方向）
**级别：** P6-P7

**问题：** 给定未排序数组 `nums`，返回最长连续整数序列的长度，要求 O(n) 时间。

**思路：** 把所有数放入哈希集合。只从「前驱 `x - 1` 不存在」的值 `x`（真正的序列起点）开始计数，再沿 `x+1, x+2, ...` 只要存在就走。每个元素最多被内层循环访问一次，因此总体 O(n) 时间、O(n) 空间——这正是「为什么是 O(n) 而非 O(n·len)」的经典面试陷阱。

**Python：**
```python
def longest_consecutive(nums: list[int]) -> int:
    s = set(nums)
    best = 0
    for x in s:
        if x - 1 not in s:            # 只从序列头开始
            y = x
            while y + 1 in s:
                y += 1
            best = max(best, y - x + 1)
    return best
```

**TypeScript：**
```typescript
function longestConsecutive(nums: number[]): number {
  const s = new Set(nums);
  let best = 0;
  for (const x of s) {
    if (!s.has(x - 1)) {
      let y = x;
      while (s.has(y + 1)) y++;
      best = Math.max(best, y - x + 1);
    }
  }
  return best;
}
```

**Java：**
```java
int longestConsecutive(int[] nums) {
    Set<Integer> s = new HashSet<>();
    for (int n : nums) s.add(n);
    int best = 0;
    for (int x : s) {
        if (!s.contains(x - 1)) {
            int y = x;
            while (s.contains(y + 1)) y++;
            best = Math.max(best, y - x + 1);
        }
    }
    return best;
}
```

**要点：**
- `x - 1 not in s` 判断保证每段序列只被扩展一次。
- 用集合去重顺带处理了重复值。
- 排序解法是 O(n log n)——本题考点正是哈希集合的 O(n) 解。

**常见追问：**
- 返回实际最长序列而不仅是长度。
- 用并查集实现，把 `x` 与 `x-1`/`x+1` 合并。
- 流式版本：数字陆续到达时维护最长连续段。

**常见坑：**
- 从每个元素都启动内层 while——退化为 O(n·len)。
- 忘记去重，导致重复计数或段长测错。

**标签：** #algorithm

---

## 二分查找

### 43. 搜索旋转排序数组

**难度：** 中等
**主题：** binary-search, arrays
**岗位：** SWE（后端方向）
**级别：** P6-P7

**问题：** 一个由不同整数构成的升序数组在未知点被旋转。给定 `nums` 与 `target`，用 O(log n) 返回其下标，不存在返回 `-1`。

**思路：** 标准二分，但每次在 `mid` 处通过比较 `nums[lo]` 与 `nums[mid]` 判断哪半是有序的。若左半有序且 `target` 落在 `[nums[lo], nums[mid])`，向左；否则向右。右半有序时逻辑对称。任意时刻恰有一半有序，每步折半：O(log n)。

**Python：**
```python
def search(nums: list[int], target: int) -> int:
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[lo] <= nums[mid]:                # 左半有序
            if nums[lo] <= target < nums[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:                                    # 右半有序
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
- 用 `nums[lo] <= nums[mid]`（而非 `<`），使单元素区间也被视为有序。
- 边界判断必须对着有序那半的端点做。
- 假定元素互异；有重复会破坏 O(log n) 保证。

**常见追问：**
- 允许重复（LeetCode 81）——最坏退化到 O(n)。
- 先找旋转点/最小值下标，再对两侧分别二分。
- 目标不存在时返回应插入位置。

**常见坑：**
- `[lo, mid)` 与 `(mid, hi]` 边界测试的 off-by-one。
- 在 `nums[lo] <= nums[mid]` 处误用 `<`，处理双元素窗口时出错。

**标签：** #algorithm

---

### 44. 寻找两个正序数组的中位数

**难度：** 困难
**主题：** binary-search, arrays, divide-and-conquer
**岗位：** SWE（后端方向）
**级别：** P7-P8

**问题：** 给定两个正序数组 `a` 与 `b`，用 O(log(min(m, n))) 返回二者合并后的中位数。

**思路：** 在较短数组上二分一个分割点。从 `a` 取 `i` 个、从 `b` 取 `j = half - i` 个，使左半共有 `(m+n+1)/2` 个元素。当 `a[i-1] <= b[j]` 且 `b[j-1] <= a[i]` 时分割正确；越界端用 ±无穷哨兵。若 `a[i-1] > b[j]` 则 `i` 左移，否则右移。总数为奇则中位数是 `max(左半)`，为偶则是 `(max(左半)+min(右半))/2`。O(log(min(m,n)))。

**Python：**
```python
def find_median_sorted_arrays(a: list[int], b: list[int]) -> float:
    if len(a) > len(b):
        a, b = b, a
    m, n = len(a), len(b)
    lo, hi, half = 0, m, (m + n + 1) // 2
    while lo <= hi:
        i = (lo + hi) // 2
        j = half - i
        al = a[i - 1] if i > 0 else float("-inf")
        ar = a[i] if i < m else float("inf")
        bl = b[j - 1] if j > 0 else float("-inf")
        br = b[j] if j < n else float("inf")
        if al <= br and bl <= ar:
            if (m + n) % 2:
                return max(al, bl)
            return (max(al, bl) + min(ar, br)) / 2
        elif al > br:
            hi = i - 1
        else:
            lo = i + 1
    return 0.0
```

**TypeScript：**
```typescript
function findMedianSortedArrays(a: number[], b: number[]): number {
  if (a.length > b.length) [a, b] = [b, a];
  const m = a.length, n = b.length, half = (m + n + 1) >> 1;
  let lo = 0, hi = m;
  while (lo <= hi) {
    const i = (lo + hi) >> 1, j = half - i;
    const al = i > 0 ? a[i - 1] : -Infinity;
    const ar = i < m ? a[i] : Infinity;
    const bl = j > 0 ? b[j - 1] : -Infinity;
    const br = j < n ? b[j] : Infinity;
    if (al <= br && bl <= ar) {
      if ((m + n) % 2 === 1) return Math.max(al, bl);
      return (Math.max(al, bl) + Math.min(ar, br)) / 2;
    } else if (al > br) hi = i - 1;
    else lo = i + 1;
  }
  return 0;
}
```

**Java：**
```java
double findMedianSortedArrays(int[] a, int[] b) {
    if (a.length > b.length) { int[] t = a; a = b; b = t; }
    int m = a.length, n = b.length, half = (m + n + 1) / 2;
    int lo = 0, hi = m;
    while (lo <= hi) {
        int i = (lo + hi) / 2, j = half - i;
        int al = i > 0 ? a[i - 1] : Integer.MIN_VALUE;
        int ar = i < m ? a[i] : Integer.MAX_VALUE;
        int bl = j > 0 ? b[j - 1] : Integer.MIN_VALUE;
        int br = j < n ? b[j] : Integer.MAX_VALUE;
        if (al <= br && bl <= ar) {
            if (((m + n) & 1) == 1) return Math.max(al, bl);
            return (Math.max(al, bl) + Math.min(ar, br)) / 2.0;
        } else if (al > br) hi = i - 1;
        else lo = i + 1;
    }
    return 0.0;
}
```

**要点：**
- 始终在较短数组上二分，保证 `j = half - i` 不越界。
- `half` 取 `(m+n+1)/2`，使奇偶两种情况共用同一套代码。
- ±无穷哨兵消除数组两端的边界分支。

**常见追问：**
- 推广为求两数组合并后的第 k 小。
- 扩展到 K 个有序数组的中位数。
- 解释为何在较短数组上二分决定了复杂度上界。

**常见坑：**
- 不交换到较短数组——`j` 变负或越界。
- 偶数情况求平均用了整数除法——必须除以 `2.0`。

**标签：** #algorithm

---

### 45. 在 D 天内送达包裹的能力

**难度：** 中等
**主题：** binary-search, greedy, arrays
**岗位：** SWE（中间件/物流方向）
**级别：** P6-P7

**问题：** 权重为 `weights` 的包裹须按顺序在传送带上于 `days` 天内发出。返回能让所有包裹在 `days` 天内送达的最小运力。

**思路：** 对答案二分。运力具有单调性：任何 `>=` 答案的运力可行，更小的不可行，故在 `[max(weights), sum(weights)]` 上搜索。贪心 `need(cap)` 按顺序遍历权重，当前载重会超过 `cap` 时开新的一天，返回所需天数。求满足 `need(cap) <= days` 的最小 `cap`。O(n log(sum))。这正是双 11 期间菜鸟调度运力规划的抽象模型。

**Python：**
```python
def ship_within_days(weights: list[int], days: int) -> int:
    def need(cap: int) -> int:
        d, cur = 1, 0
        for w in weights:
            if cur + w > cap:
                d += 1
                cur = 0
            cur += w
        return d
    lo, hi = max(weights), sum(weights)
    while lo < hi:
        mid = (lo + hi) // 2
        if need(mid) <= days:
            hi = mid
        else:
            lo = mid + 1
    return lo
```

**TypeScript：**
```typescript
function shipWithinDays(weights: number[], days: number): number {
  const need = (cap: number): number => {
    let d = 1, cur = 0;
    for (const w of weights) {
      if (cur + w > cap) { d++; cur = 0; }
      cur += w;
    }
    return d;
  };
  let lo = Math.max(...weights);
  let hi = weights.reduce((a, b) => a + b, 0);
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (need(mid) <= days) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}
```

**Java：**
```java
int shipWithinDays(int[] weights, int days) {
    int lo = 0, hi = 0;
    for (int w : weights) { lo = Math.max(lo, w); hi += w; }
    while (lo < hi) {
        int mid = (lo + hi) >>> 1;
        if (need(weights, mid) <= days) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}

int need(int[] weights, int cap) {
    int d = 1, cur = 0;
    for (int w : weights) {
        if (cur + w > cap) { d++; cur = 0; }
        cur += w;
    }
    return d;
}
```

**要点：**
- 搜索下界是 `max(weights)`——运力至少要装得下最重的单个包裹。
- 可行性判定单调，才能对答案二分。
- `lo < hi` 配合 `hi = mid` 收敛到最小可行运力，避免 off-by-one。

**常见追问：**
- 分割数组的最大值（LeetCode 410）是同一套模板。
- 爱吃香蕉的珂珂——对进食速度二分。
- 返回实际的天到包裹分配方案，而不仅是运力。

**常见坑：**
- 把 `lo` 设为 `0` 或 `1`——比 `cap` 还重的包裹永远发不出去。
- `lo <= hi` 搭配 `hi = mid`——死循环；`hi = mid` 须配 `lo < hi`。

**标签：** #algorithm

---

## 动态规划

### 46. 编辑距离

**难度：** 困难
**主题：** dp, strings
**岗位：** P6
**级别：** P5-P6

**问题：** 给定两个字符串 `word1` 和 `word2`，返回将 `word1` 转换为 `word2` 所需的最少操作数（插入、删除、替换）。

**思路：** 二维 DP。`dp[i][j]` 表示将 `word1[:i]` 转为 `word2[:j]` 的最少操作数。字符相等：`dp[i-1][j-1]`；否则 `1 + min(插入, 删除, 替换)`。时空 O(m*n)；可用两行压缩到 O(min(m,n))。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 初始化首行/首列代表从/到空串的代价。
- 三种转移对应删除、插入、替换。
- 滚动两行可把空间压到 O(min(m, n))。

**标签：** #algorithm

---

### 47. 最长公共子序列

**难度：** 中等
**主题：** dp, strings
**岗位：** P5
**级别：** P5-P6

**问题：** 给定两个字符串，返回它们最长公共子序列的长度。

**思路：** 经典二维 DP。字符相同：`dp[i][j] = dp[i-1][j-1] + 1`，否则 `max(dp[i-1][j], dp[i][j-1])`。O(m*n)。滚动数组可降到 O(min(m,n))。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- LCS 衡量相似度，不要求连续。
- 字符相等延展对角；不等则取上/左较大值。
- 滚动两行（或一行配一个对角临时变量）即可 O(min(m, n)) 空间。

**标签：** #algorithm

---

### 48. 不同的子序列

**难度：** 困难
**主题：** dp, strings
**岗位：** P6
**级别：** P6-P7

**问题：** 给定字符串 `s` 和 `t`，统计 `s` 的子序列中等于 `t` 的个数。

**思路：** DP。`dp[i][j]` 表示用 `s[:i]` 形成 `t[:j]` 的方案数。若 `s[i-1]==t[j-1]`：`dp[i-1][j-1] + dp[i-1][j]`（用或跳过），否则 `dp[i-1][j]`。O(m*n)，可按列压缩。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 空串 `t` 恰好有 1 个子序列匹配。
- 字符匹配时累加"用"与"跳过"两种方案。
- 一维滚动写法需从右向左遍历 `j`。

**标签：** #algorithm

---

### 49. 交错字符串

**难度：** 中等
**主题：** dp, strings
**岗位：** P6
**级别：** P5-P6

**问题：** 给定字符串 `s1`、`s2`、`s3`，判断 `s3` 是否由 `s1` 和 `s2` 交错组成。

**思路：** 二维 DP。`dp[i][j]` 表示 `s3[:i+j]` 是否为 `s1[:i]` 和 `s2[:j]` 的交错。转移：`(dp[i-1][j] && s1[i-1]==s3[i+j-1]) || (dp[i][j-1] && s2[j-1]==s3[i+j-1])`。O(m*n)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 长度不匹配直接返回 False。
- 每个状态检查上一字符来自 `s1` 还是 `s2`。
- 可压缩为大小 `n+1` 的一维数组。

**标签：** #algorithm

---

### 50. 通配符匹配

**难度：** 困难
**主题：** dp, strings, greedy
**岗位：** P6
**级别：** P6-P7

**问题：** 给定字符串 `s` 和模式 `p`，`?` 匹配任意单字符，`*` 匹配任意序列。判断模式是否匹配整个字符串。

**思路：** DP `dp[i][j]`：前缀匹配。`*` 匹配空（`dp[i][j-1]`）或扩展（`dp[i-1][j]`）。另一种：双指针贪心 + 在最近 `*` 处回溯——最坏 O(m*n)，典型情况 O(m+n)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 前导 `*` 段对空串也应能匹配，需提前初始化。
- `*` 可匹配空（`j-1`）也可继续延展（`i-1`）。
- 贪心双指针 + `*` 回溯实践中往往更快。

**标签：** #algorithm

---

### 51. 扰乱字符串

**难度：** 困难
**主题：** dp, recursion, memoization
**岗位：** P7
**级别：** P7

**问题：** 给定长度相同的两个字符串 `s1` 和 `s2`，判断 `s2` 是否是 `s1` 的扰乱字符串（递归定义为按某点切分并可选交换两半）。

**思路：** 递归 + 记忆化 `(s1, s2)`。对每个切分点 `i`：检查 `(scramble(s1[:i], s2[:i]) && scramble(s1[i:], s2[i:]))` 或 `(scramble(s1[:i], s2[-i:]) && scramble(s1[i:], s2[:-i]))`。用 anagram 校验剪枝。记忆化后 O(n^4)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- anagram 校验（或字母计数比对）能极大剪枝。
- 对 `(s1, s2)` 记忆化避免指数级递归。
- 每个切分点都要尝试"对应"与"交换"两种切法。

**标签：** #algorithm

---

### 52. 俄罗斯套娃信封问题

**难度：** 困难
**主题：** dp, binary-search, sorting
**岗位：** P6
**级别：** P6-P7

**问题：** 给定一组信封 `(w, h)`，找出最多能套多少个（宽和高都严格递增）。

**思路：** 按 `w` 升序排序，相同 `w` 按 `h` 降序（避免同宽信封被互相计入）。然后对 `h` 数组跑 LIS（耐心排序 + 二分）。O(n log n)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- `h` 降序破同 `w` 平局，防止同宽信封凑成"递增"。
- 耐心排序的 LIS 为 O(n log n)。
- `tails[i]` 是长度为 `i+1` 的所有 LIS 中最小尾值。

**标签：** #algorithm

---

### 53. 最长递增子序列

**难度：** 中等
**主题：** dp, binary-search
**岗位：** P5
**级别：** P5-P6

**问题：** 给定整数数组，返回最长严格递增子序列的长度。

**思路：** 耐心排序：维护 `tails[]`，`tails[k]` 为长度 k+1 的 LIS 的最小尾部。每个数二分查找插入位置。长度 = len(tails)。O(n log n)。

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

**Java：**
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

**要点：**
- `tails` 数组本身不是 LIS，只用于度量长度。
- 严格递增用 `bisect_left`，非递减用 `bisect_right`。
- n 较小时 O(n^2) DP 也够用。

**标签：** #algorithm

---

### 54. 最长递增子序列的个数

**难度：** 中等
**主题：** dp
**岗位：** P6
**级别：** P6-P7

**问题：** 给定整数数组，返回最长严格递增子序列的个数。

**思路：** 两个 DP 数组：`len[i]` 表示以 i 结尾的 LIS 长度，`count[i]` 表示这种 LIS 的个数。对 `j < i` 且 `nums[j] < nums[i]`：若 `len[j]+1 > len[i]` 重置，相等则累加。O(n^2)。把 `len[i] == maxLen` 的 count 相加。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 出现更长链时重置个数。
- 长度相等则累加个数。
- 线段树可做到 O(n log n)，但通常无需。

**标签：** #algorithm

---

### 55. 最长数对链

**难度：** 中等
**主题：** greedy, dp, sorting
**岗位：** P5
**级别：** P5-P6

**问题：** 给定 `[a, b]` 数对（`a < b`），若 `b < c`，则 `(c, d)` 可接在 `(a, b)` 之后。找最长链。

**思路：** 贪心：按第二个元素升序排序。遍历选下一个起点 > 当前终点的数对。O(n log n)。等价于区间调度问题。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 按结束排序，优先选最早结束的选项。
- 等价于经典活动选择贪心。
- 严格 `>` 对应题目要求 `b < c`。

**标签：** #algorithm

---

### 56. 买卖股票的最佳时机 IV

**难度：** 困难
**主题：** dp, state-machine
**岗位：** P6
**级别：** P6-P7

**问题：** 给定价格数组和整数 `k`，求最多 `k` 笔交易的最大利润。

**思路：** 若 `k >= n/2`，等价于无限次交易（累加正差值）。否则 DP：`buy[i][j]` 和 `sell[i][j]` 表示第 i 天做完 j 次交易的状态。`buy[i][j] = max(buy[i-1][j], sell[i-1][j-1] - price)`；`sell[i][j] = max(sell[i-1][j], buy[i-1][j] + price)`。O(n*k)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- k 足够大时退化为贪心累加正差。
- 由于依赖顺序，状态数组可降为一维（`j` 从小到大）。
- 一次交易 = 一买一卖；计数口径要统一。

**标签：** #algorithm

---

### 57. 最大子数组和

**难度：** 中等
**主题：** dp, divide-and-conquer
**岗位：** P5
**级别：** P5

**问题：** 给定整数数组，找出和最大的连续子数组。

**思路：** Kadane 算法：`cur = max(num, cur + num)`，维护全局最大。O(n) 时间，O(1) 空间。分治备选：O(n log n)，拆分并合并跨中点的和。

**Python：**
```python
def max_subarray(nums: list[int]) -> int:
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
- `cur` 表示以当前下标结尾的最优子数组和。
- 当 `cur + x < x` 时重置，舍弃负收益前缀。
- 用 `nums[0]` 初始化即可处理全负数组。

**标签：** #algorithm

---

### 58. 环形子数组的最大和

**难度：** 中等
**主题：** dp, kadane
**岗位：** P6
**级别：** P6

**问题：** 给定环形整数数组，找出非空子数组的最大和。

**思路：** 两种情况：(1) 非环情况——标准 Kadane。(2) 环情况——总和 - 最小子数组和。取两者较大。边界：若全为负数，返回最大元素。O(n)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 环形最大 = 总和 - 最小子数组和。
- 全负数情况要返回最大元素，不能返回 0。
- 一次遍历同时跑两次 Kadane。

**标签：** #algorithm

---

### 59. 解码方法

**难度：** 中等
**主题：** dp, strings
**岗位：** P5
**级别：** P5-P6

**问题：** 一串数字按 `1=A, 2=B, ..., 26=Z` 映射为字母。求解码方式总数。

**思路：** 一维 DP。`dp[i] = dp[i-1]（若 s[i-1] != '0'）+ dp[i-2]（若 "10" <= s[i-2..i-1] <= "26"）`。注意前导零以及不能以 '0' 起编码。O(n) 时间，O(1) 空间。

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

**Java：**
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

**要点：**
- 前导 '0' 直接判为无解。
- 两位编码必须在 [10, 26]；'06' 非法。
- 滚动两个变量即可 O(1) 空间。

**标签：** #algorithm

---

### 60. 正则表达式匹配

**难度：** 困难
**主题：** dp, strings, recursion
**岗位：** P6
**级别：** P6-P7

**问题：** 实现支持 `.`（任意字符）和 `*`（前面元素零个或多个）的正则匹配。

**思路：** DP `dp[i][j]`。若 `p[j-1] == '*'`：`dp[i][j-2]`（零个）或 `dp[i-1][j] && (p[j-2]==s[i-1] || p[j-2]=='.')`（一个或多个）。否则单字符匹配 + `dp[i-1][j-1]`。O(m*n)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- `*` 修饰前一字符，不能独立出现。
- 优先检查"零次"分支 `dp[i][j-2]`。
- '.' 匹配任意单字符，但不消耗零字符。

**标签：** #algorithm

---

### 61. 分割回文串 II

**难度：** 困难
**主题：** dp, strings
**岗位：** P6
**级别：** P6-P7

**问题：** 给定字符串，返回分割成回文子串所需的最少切割次数。

**思路：** 先用二维 DP 预计算 `isPal[i][j]`（O(n^2)）。然后 `cuts[i]` 表示 `s[:i+1]` 的最少切割：若 `s[j..i]` 是回文，`cuts[i] = min(cuts[i], cuts[j-1]+1)`。O(n^2)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 自底向上预处理回文表，保证内层依赖先就绪。
- `cuts[i] = i` 初始为最坏：每字符切一刀。
- 整段已是回文则无需切。

**标签：** #algorithm

---

### 62. 戳气球

**难度：** 困难
**主题：** dp, interval-dp
**岗位：** P7
**级别：** P7

**问题：** 给定带数字的气球数组，全部戳破以最大化金币。戳破第 i 个得 `nums[i-1] * nums[i] * nums[i+1]`；缺失视为 1。

**思路：** 区间 DP。两端加哨兵 [1,...,1]。`dp[l][r]` 表示戳破 l 和 r 之间所有气球的最大金币。枚举最后戳破的气球 `k`：`dp[l][r] = max(dp[l][k] + dp[k][r] + nums[l]*nums[k]*nums[r])`。O(n^3)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 反向思考：`k` 是开区间 `(l, r)` 中最后戳破的气球。
- 加哨兵避免端点特判。
- 标准 O(n^3)，按区间长度逐步扩张。

**标签：** #algorithm

---

### 63. 移除盒子

**难度：** 困难
**主题：** dp, memoization
**岗位：** P7
**级别：** P7-P8

**问题：** 给定一行彩色盒子，每次移除 `k` 个连续同色盒子获得 `k*k` 分。求最大总分。

**思路：** 三维 DP `dp[l][r][k]`，k 是左侧与 `boxes[l]` 同色并已附着的盒子数。两种选择：现在移除：`(k+1)^2 + dp[l+1][r][0]`；或与后面同色合并：找到 `boxes[m]==boxes[l]` 的位置 `m`，`dp[l+1][m-1][0] + dp[m][r][k+1]`。记忆化后 O(n^4)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 多出的 `k` 维度记录左侧已附着的同色盒数。
- 先合并连续同色可缩小状态空间。
- 此题用记忆化（自顶向下）比自底向上更直观。

**标签：** #algorithm

---

### 64. 石子游戏

**难度：** 中等
**主题：** dp, game-theory, minimax
**岗位：** P6
**级别：** P6

**问题：** 两人轮流从一行石堆两端取石子，各自想最大化自己分数。判断玩家 1 是否赢。

**思路：** DP `dp[i][j]` 表示该子区间下当前玩家与对手的最大分差。`dp[i][j] = max(piles[i] - dp[i+1][j], piles[j] - dp[i][j-1])`。答案：`dp[0][n-1] > 0`。O(n^2)。小技巧：偶数 n 且总和相等时玩家 1 必胜。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- `dp[i][j]` 存的是分差，不是绝对分数。
- 按区间长度递增填表，保证子问题先就绪。
- LeetCode 原题答案恒为 `true`，但应付变体仍需 DP。

**标签：** #algorithm

---

### 65. 预测赢家

**难度：** 中等
**主题：** dp, minimax, recursion
**岗位：** P6
**级别：** P6

**问题：** 与石子游戏类似但数值任意；判断玩家 1 能否赢或平局。

**思路：** Minimax DP。`score(i, j) = max(nums[i] - score(i+1, j), nums[j] - score(i, j-1))`。返回 `score(0, n-1) >= 0`。记忆化。O(n^2)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 只需追踪分差，不必维护双方总分。
- 平局也算赢，故 `>= 0`。
- 沿对角线遍历可把 2D DP 压成滚动一维。

**标签：** #algorithm

---

### 66. 零钱兑换

**难度：** 中等
**主题：** dp, unbounded-knapsack, bfs
**岗位：** SWE（后端/支付方向）
**级别：** P6-P7

**问题：** 给定硬币面额和总金额 `amount`，返回凑出该金额所需的最少硬币数，无法凑出返回 -1。

**思路：** 完全背包。`dp[a]` 表示凑出金额 `a` 的最少硬币数，`dp[a] = min(dp[a - c] + 1)`，其中 `c <= a`。时间 O(amount * coins)，空间 O(amount)。常见于支付宝退款/找零拆分场景。

**Python：**
```python
def coin_change(coins: list[int], amount: int) -> int:
    dp = [0] + [float('inf')] * amount
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a:
                dp[a] = min(dp[a], dp[a - c] + 1)
    return dp[amount] if dp[amount] != float('inf') else -1
```

**TypeScript：**
```typescript
function coinChange(coins: number[], amount: number): number {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) {
      if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}
```

**Java：**
```java
int coinChange(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, amount + 1);
    dp[0] = 0;
    for (int a = 1; a <= amount; a++) {
        for (int c : coins) {
            if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
        }
    }
    return dp[amount] > amount ? -1 : dp[amount];
}
```

**要点：**
- 硬币可重复使用，因此金额维度向外递推（完全背包）。
- 初始化 `dp[0] = 0`，不可达状态设为无穷。
- 任意面额下贪心不成立，DP 才能保证最优。

**常见追问：**
- 零钱兑换 II：改为求凑出金额的组合总数。
- 记录每个状态选用的硬币以还原方案。

**常见坑：**
- Java 用 `amount + 1` 作哨兵时最终需判断 `> amount`，不能用 `== amount + 1`。
- 漏掉 `c <= a` 判断会导致负下标越界。

**标签：** #algorithm

---

### 67. 单词拆分

**难度：** 中等
**主题：** dp, string, hash-set
**岗位：** SWE（后端/电商方向）
**级别：** P6-P7

**问题：** 给定字符串 `s` 和一个单词字典，判断 `s` 能否被拆分为若干个字典中单词的序列。

**思路：** `dp[i]` 表示 `s[:i]` 是否可拆分；若存在 `j < i` 使 `dp[j]` 为真且 `s[j:i]` 在字典中，则 `dp[i]` 为真。子串哈希下时间 O(n^2)，空间 O(n)。类似淘宝搜索的查询分词。

**Python：**
```python
def word_break(s: str, word_dict: list[str]) -> bool:
    words = set(word_dict)
    n = len(s)
    dp = [True] + [False] * n
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
  const dp = new Array(n + 1).fill(false);
  dp[0] = true;
  for (let i = 1; i <= n; i++) {
    for (let j = 0; j < i; j++) {
      if (dp[j] && words.has(s.slice(j, i))) { dp[i] = true; break; }
    }
  }
  return dp[n];
}
```

**Java：**
```java
boolean wordBreak(String s, List<String> wordDict) {
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
```

**要点：**
- `dp[0] = true` 表示空前缀作为合法基态。
- `dp[i]` 一旦为真即可提前跳出内层循环。
- 字典放入哈希集合，成员判断 O(1)。

**常见追问：**
- 单词拆分 II：返回所有合法的拆分句子（回溯 + 记忆化）。
- 用最长单词长度限制内层扫描范围以加速。

**常见坑：**
- `j` 遍历方向搞反会用到尚未计算的 `dp[j]`。
- 频繁子串切片开销大，长输入可用字典树优化。

**标签：** #algorithm

---

### 68. 分割等和子集

**难度：** 中等
**主题：** dp, 0-1-knapsack, subset-sum
**岗位：** SWE（后端/中间件方向）
**级别：** P6-P7

**问题：** 给定一个非空正整数数组，判断能否将其分割为两个和相等的子集。

**思路：** 若总和为奇数直接返回 false；否则转化为 0/1 背包，判断是否存在子集和为 `total/2`。用一维布尔 `dp`，对每个数逆序更新。时间 O(n * target)，空间 O(target)。

**Python：**
```python
def can_partition(nums: list[int]) -> bool:
    total = sum(nums)
    if total % 2:
        return False
    target = total // 2
    dp = [True] + [False] * target
    for x in nums:
        for a in range(target, x - 1, -1):
            dp[a] = dp[a] or dp[a - x]
    return dp[target]
```

**TypeScript：**
```typescript
function canPartition(nums: number[]): boolean {
  const total = nums.reduce((a, b) => a + b, 0);
  if (total % 2) return false;
  const target = total / 2;
  const dp = new Array(target + 1).fill(false);
  dp[0] = true;
  for (const x of nums) {
    for (let a = target; a >= x; a--) dp[a] = dp[a] || dp[a - x];
  }
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
    for (int x : nums) {
        for (int a = target; a >= x; a--) dp[a] = dp[a] || dp[a - x];
    }
    return dp[target];
}
```

**要点：**
- 总和为奇数必不可能均分，可立即短路返回。
- 容量维度逆序遍历，保证每个元素至多用一次（0/1）。
- `dp[0] = true`，因为和为 0 总能达成。

**常见追问：**
- 求两子集和之差的最小值（最后一块石头的重量 II）。
- 统计能凑出目标和的子集数量。

**常见坑：**
- 容量正序遍历会退化为完全背包（元素可重复使用）。
- 定长整型语言中大数据求和可能溢出。

**标签：** #algorithm

---

### 69. 最大正方形

**难度：** 中等
**主题：** dp, matrix, grid
**岗位：** SWE（后端方向）
**级别：** P6-P7

**问题：** 给定一个由 '0' 和 '1' 组成的二维矩阵，找出只含 '1' 的最大正方形，返回其面积。

**思路：** `dp[i][j]` 表示以 `(i, j)` 为右下角的全 1 正方形的最大边长；若该格为 '1'，则 `dp[i][j] = min(上, 左, 左上) + 1`。记录最大边长，答案为边长的平方。时间 O(m*n)，空间 O(m*n)。

**Python：**
```python
def maximal_square(matrix: list[list[str]]) -> int:
    if not matrix:
        return 0
    m, n = len(matrix), len(matrix[0])
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    best = 0
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if matrix[i - 1][j - 1] == '1':
                dp[i][j] = min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1
                best = max(best, dp[i][j])
    return best * best
```

**TypeScript：**
```typescript
function maximalSquare(matrix: string[][]): number {
  const m = matrix.length, n = matrix[0].length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  let best = 0;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (matrix[i - 1][j - 1] === '1') {
        dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
        best = Math.max(best, dp[i][j]);
      }
    }
  }
  return best * best;
}
```

**Java：**
```java
int maximalSquare(char[][] matrix) {
    int m = matrix.length, n = matrix[0].length;
    int[][] dp = new int[m + 1][n + 1];
    int best = 0;
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (matrix[i - 1][j - 1] == '1') {
                dp[i][j] = Math.min(Math.min(dp[i - 1][j], dp[i][j - 1]), dp[i - 1][j - 1]) + 1;
                best = Math.max(best, dp[i][j]);
            }
        }
    }
    return best * best;
}
```

**要点：**
- 上、左、左上三个邻居共同限制正方形能扩展的边长。
- DP 网格多补一行一列可省去边界判断。
- 答案是边长的平方（面积），不是边长本身。

**常见追问：**
- 最大矩形：推广到非正方形，用柱状图 + 单调栈求解。
- 将 DP 压缩为一行加一个左上角变量，空间降到 O(n)。

**常见坑：**
- 误返回最大边长而非 side*side（面积）。
- 把字符与整数 1 比较，而不是与字符 '1' 比较。

**标签：** #algorithm

---

## 回溯

### 70. 组合总和

**难度：** 中等
**主题：** backtracking, dfs, pruning
**岗位：** SWE（后端方向）
**级别：** P6-P7

**问题：** 给定无重复候选数组和目标 target，返回所有和为 target 的不重复组合，每个数可无限次使用。

**思路：** DFS 携带起始下标，使组合保持非递减（避免排列重复）；递归传入相同下标以允许重复使用。先排序，当候选值超过剩余目标即可剪枝。时间随组合数指数增长。

**Python：**
```python
def combination_sum(candidates: list[int], target: int) -> list[list[int]]:
    res: list[list[int]] = []
    candidates.sort()
    def dfs(start: int, remain: int, path: list[int]) -> None:
        if remain == 0:
            res.append(path[:])
            return
        for i in range(start, len(candidates)):
            if candidates[i] > remain:
                break
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
  candidates.sort((a, b) => a - b);
  const dfs = (start: number, remain: number, path: number[]): void => {
    if (remain === 0) { res.push([...path]); return; }
    for (let i = start; i < candidates.length; i++) {
      if (candidates[i] > remain) break;
      path.push(candidates[i]);
      dfs(i, remain - candidates[i], path);
      path.pop();
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
    Arrays.sort(candidates);
    dfs(candidates, 0, target, new ArrayList<>(), res);
    return res;
}
void dfs(int[] c, int start, int remain, List<Integer> path, List<List<Integer>> res) {
    if (remain == 0) { res.add(new ArrayList<>(path)); return; }
    for (int i = start; i < c.length; i++) {
        if (c[i] > remain) break;
        path.add(c[i]);
        dfs(c, i, remain - c[i], path, res);
        path.remove(path.size() - 1);
    }
}
```

**要点：**
- 递归传入 `i`（而非 `i + 1`）使同一候选可被重复使用。
- 排序后 `> remain` 剪枝能裁剪搜索树。
- 记录结果时需复制 `path`，共享列表会持续变化。

**常见追问：**
- 组合总和 II：每个数只用一次，候选含重复时需同层去重。
- 组合总和 III：从 1..9 中取固定个数的数字。

**常见坑：**
- 递归起点用 `start = 0` 会产生同一集合的重复排列。
- 直接按引用存 `path` 而非拷贝，会污染所有结果。

**标签：** #algorithm

---

### 71. N 皇后

**难度：** 困难
**主题：** backtracking, dfs, bitmask
**岗位：** SWE（后端方向）
**级别：** P7-P8

**问题：** 在 `n x n` 棋盘上放置 `n` 个皇后使其两两不能互相攻击，返回不同解的数量。

**思路：** 逐行 DFS。用集合记录已占用的列、主对角线（`行 - 列`）和副对角线（`行 + 列`）；放满整盘时计入一个解。剪枝后时间 O(n!)，空间 O(n)。

**Python：**
```python
def total_n_queens(n: int) -> int:
    cols: set[int] = set()
    diag: set[int] = set()
    anti: set[int] = set()
    def dfs(r: int) -> int:
        if r == n:
            return 1
        count = 0
        for c in range(n):
            if c in cols or (r - c) in diag or (r + c) in anti:
                continue
            cols.add(c); diag.add(r - c); anti.add(r + c)
            count += dfs(r + 1)
            cols.remove(c); diag.remove(r - c); anti.remove(r + c)
        return count
    return dfs(0)
```

**TypeScript：**
```typescript
function totalNQueens(n: number): number {
  const cols = new Set<number>(), diag = new Set<number>(), anti = new Set<number>();
  const dfs = (r: number): number => {
    if (r === n) return 1;
    let count = 0;
    for (let c = 0; c < n; c++) {
      if (cols.has(c) || diag.has(r - c) || anti.has(r + c)) continue;
      cols.add(c); diag.add(r - c); anti.add(r + c);
      count += dfs(r + 1);
      cols.delete(c); diag.delete(r - c); anti.delete(r + c);
    }
    return count;
  };
  return dfs(0);
}
```

**Java：**
```java
int totalNQueens(int n) {
    return dfs(0, n, new HashSet<>(), new HashSet<>(), new HashSet<>());
}
int dfs(int r, int n, Set<Integer> cols, Set<Integer> diag, Set<Integer> anti) {
    if (r == n) return 1;
    int count = 0;
    for (int c = 0; c < n; c++) {
        if (cols.contains(c) || diag.contains(r - c) || anti.contains(r + c)) continue;
        cols.add(c); diag.add(r - c); anti.add(r + c);
        count += dfs(r + 1, n, cols, diag, anti);
        cols.remove(c); diag.remove(r - c); anti.remove(r + c);
    }
    return count;
}
```

**要点：**
- 每行只放一个皇后，天然消除行冲突。
- `行 - 列` 与 `行 + 列` 唯一标识两个方向的对角线。
- 回溯时撤销三个集合的插入以恢复状态。

**常见追问：**
- 返回实际棋盘布局而非仅返回解的数量。
- 用位掩码替代集合，可获得显著的常数级加速。

**常见坑：**
- 用同一个对角线集合表示两个方向会混淆不同约束。
- 回溯时忘记从全部三个集合中移除。

**标签：** #algorithm

---

## 双指针 / 滑动窗口

### 72. 无重复字符的最长子串

**难度：** 中等
**主题：** sliding-window, two-pointers, hash-map
**岗位：** SWE（后端方向）
**级别：** P6-P7

**问题：** 给定一个字符串，求不含重复字符的最长子串的长度。

**思路：** 滑动窗口，用哈希表记录每个字符最后出现的下标。当窗口内出现重复时，将 `left` 跳到上次出现位置的下一格。每步更新最优长度。时间 O(n)，空间 O(字符集)。

**Python：**
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

**TypeScript：**
```typescript
function lengthOfLongestSubstring(s: string): number {
  const last = new Map<string, number>();
  let left = 0, best = 0;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    if (last.has(ch) && last.get(ch)! >= left) left = last.get(ch)! + 1;
    last.set(ch, right);
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
        char ch = s.charAt(right);
        if (last.containsKey(ch) && last.get(ch) >= left) left = last.get(ch) + 1;
        last.put(ch, right);
        best = Math.max(best, right - left + 1);
    }
    return best;
}
```

**要点：**
- 记录最后出现下标可让 `left` 直接跳转而非逐格移动。
- `last[ch] >= left` 判断可忽略窗口外的陈旧下标。
- 窗口长度为 `right - left + 1`。

**常见追问：**
- 返回子串本身而非仅返回长度。
- 推广到最多含 K 个不同字符（另一种滑动窗口变体）。

**常见坑：**
- 无条件把 `left` 设为 `last[ch] + 1`，遇到陈旧下标会导致 `left` 回退。
- 窗口长度计算的边界差一错误。

**标签：** #algorithm

---

### 73. 最小覆盖子串

**难度：** 困难
**主题：** sliding-window, two-pointers, hash-map
**岗位：** SWE（后端方向）
**级别：** P7

**问题：** 给定字符串 `s` 和 `t`，返回 `s` 中涵盖 `t` 所有字符（含重数）的最小子串，若不存在返回空串。

**思路：** 右指针扩张并对需求计数表做自减，用 `missing` 记录仍缺的字符数。当 `missing` 归零时从左收缩以最小化，同时记录最优窗口。时间 O(|s| + |t|)，空间 O(字符集)。

**Python：**
```python
from collections import Counter

def min_window(s: str, t: str) -> str:
    need = Counter(t)
    missing = len(t)
    left = 0
    start, end = 0, 0
    for right, ch in enumerate(s, 1):
        if need[ch] > 0:
            missing -= 1
        need[ch] -= 1
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
  const need = new Map<string, number>();
  for (const ch of t) need.set(ch, (need.get(ch) ?? 0) + 1);
  let missing = t.length, left = 0, start = 0, end = 0;
  for (let right = 1; right <= s.length; right++) {
    const ch = s[right - 1];
    if ((need.get(ch) ?? 0) > 0) missing--;
    need.set(ch, (need.get(ch) ?? 0) - 1);
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
    int[] need = new int[128];
    for (char c : t.toCharArray()) need[c]++;
    int missing = t.length(), left = 0, start = 0, end = 0;
    for (int right = 1; right <= s.length(); right++) {
        char ch = s.charAt(right - 1);
        if (need[ch]-- > 0) missing--;
        while (missing == 0) {
            if (end == 0 || right - left < end - start) { start = left; end = right; }
            char lc = s.charAt(left++);
            if (++need[lc] > 0) missing++;
        }
    }
    return s.substring(start, end);
}
```

**要点：**
- `missing` 统计仍欠缺的字符数，避免每步做整表比较。
- 只有 `t` 中的字符才会把需求计数推到正数。
- `right` 视为开区间右端，窗口即 `s[left:right]`。

**常见追问：**
- 返回所有最小窗口，或统计合法窗口的数量。
- 字符集很大或为 Unicode 时改用哈希表而非定长数组。

**常见坑：**
- 自减与比较的先后顺序搞反会破坏 `missing` 记账。
- 未区分“未找到（空串）”与“长度为零的窗口”。

**标签：** #algorithm

---

### 74. 接雨水

**难度：** 困难
**主题：** two-pointers, array, greedy
**岗位：** SWE（后端方向）
**级别：** P7

**问题：** 给定每根柱子宽度为 1 的高度图，计算下雨后能接住多少雨水。

**思路：** 双指针从两端向中间，维护 `leftMax`/`rightMax`。较矮的一侧决定该指针处的水位，故移动较低的一侧并累加 `max - height`。时间 O(n)，空间 O(1)。

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
- 某柱上方水量等于 `min(leftMax, rightMax) - height`。
- 移动较低一侧是安全的，因为较高一侧已保证了水位边界。
- 双指针写法省去 O(n) 的前缀/后缀最大值数组。

**常见追问：**
- 接雨水 II：二维网格，从边界用最小堆求解。
- 改用单调栈按层计算接水量。

**常见坑：**
- 用全局最大值而非各侧的运行最大值来比较。
- 高度相等时移动的指针要保持一致（移哪侧都可，但需固定）。

**标签：** #algorithm

---

## 数组 / 字符串

### 75. 翻转对

**难度：** 困难
**主题：** merge-sort, bit, divide-and-conquer
**岗位：** SWE
**级别：** P7

**问题：** 给定数组，统计满足 `i < j` 且 `nums[i] > 2 * nums[j]` 的下标对 `(i, j)` 数量。

**思路：** 改造归并排序。归并时，对左半每个 `i`，用双指针统计右半中满足 `left[i] > 2 * right[j]` 的 `j`（在合并前计数）。O(n log n)。备选方案：坐标压缩 + BIT/Fenwick 树。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 合并前计数，确保两半各自有序。
- `2 * nums[j]` 在底层语言中要注意溢出。
- 树状数组配合离散化也能 O(n log n)，常数更小。

**常见追问：**
- Count Smaller Numbers After Self——同类合并排序技巧。
- Count of Range Sum——前缀和 + 合并排序或 BIT。
- 链表求逆序对——同算法，访问不便。
- 用 Fenwick 树配合值压缩。

**常见坑：**
- 合并 *之后* 才计数——丢失顺序不变量。
- `2 * nums[j]` 整数溢出——转 long。

**标签：** #algorithm

---

### 76. 最长回文子串

**难度：** 中等
**主题：** strings, dp, expand-around-center
**岗位：** SWE（后端/中间件/电商方向）
**级别：** P6-P7

**问题：** 给定字符串 `s`，返回其中最长的回文子串。

**思路：** 中心扩展——对每个下标 i，分别尝试奇数长度（中心=i）和偶数长度（中心在 i 与 i+1 之间）两种回文，向两侧扩张并记录最长区间。O(n²) 时间，O(1) 空间。Manacher 可做到 O(n)，但常数大、代码复杂，面试很少要求。

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

**要点：**
- 奇偶两种中心统一覆盖全部回文形态。
- 用长度差比较记录最优区间，最后一次性切片，避免重复构造子串。
- 只需保存 `[bl, br]` 边界，空间 O(1)。

**常见追问：**
- 统计所有回文子串的个数，而非只求最长。
- 若要求严格 O(n)，如何用 Manacher 实现。

**常见坑：**
- 计算长度时漏掉 `+ 1`，导致比较出错。
- 忘记偶数中心扩展，漏掉 "abba" 这类偶长回文。

**标签：** #algorithm

---

### 77. 除自身以外数组的乘积

**难度：** 中等
**主题：** array, prefix-product, math
**岗位：** SWE（电商方向）
**级别：** P6-P7

**问题：** 给定整数数组 `nums`，返回数组 `answer`，其中 `answer[i]` 等于 `nums` 中除 `nums[i]` 之外所有元素的乘积。要求 O(n) 且不用除法。

**思路：** 两趟扫描。第一趟把 `res[i]` 填成 `i` 左侧所有元素的乘积；第二趟乘上 `i` 右侧所有元素的运行乘积。禁止除法（且存在 0 时除法不安全），所以前缀/后缀乘积是标准技巧。时间 O(n)，除输出数组外额外空间 O(1)。

**Python：**
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

**TypeScript：**
```typescript
function productExceptSelf(nums: number[]): number[] {
  const n = nums.length;
  const res = new Array<number>(n).fill(1);
  let prefix = 1;
  for (let i = 0; i < n; i++) {
    res[i] = prefix;
    prefix *= nums[i];
  }
  let suffix = 1;
  for (let i = n - 1; i >= 0; i--) {
    res[i] *= suffix;
    suffix *= nums[i];
  }
  return res;
}
```

**Java：**
```java
int[] productExceptSelf(int[] nums) {
    int n = nums.length;
    int[] res = new int[n];
    int prefix = 1;
    for (int i = 0; i < n; i++) {
        res[i] = prefix;
        prefix *= nums[i];
    }
    int suffix = 1;
    for (int i = n - 1; i >= 0; i--) {
        res[i] *= suffix;
        suffix *= nums[i];
    }
    return res;
}
```

**要点：**
- 复用输出数组做前缀扫描，额外空间保持 O(1)。
- 不用除法，天然规避了元素为 0 的边界情况。
- 两趟线性扫描，无需嵌套循环。

**常见追问：**
- 输入很大时用 `long`/`BigInteger` 处理溢出。
- 如果允许用除法怎么办？讨论 0 的个数处理。
- 支持对单个元素的在线更新。

**常见坑：**
- 使用除法，在存在元素为 0 时崩溃或算错。
- 后缀扫描时覆盖 `res[i]` 而不是乘进去。

**标签：** #algorithm

---

### 78. 字符串相乘

**难度：** 中等
**主题：** strings, math, simulation
**岗位：** SWE（后端/中间件/电商方向）
**级别：** P6-P7

**问题：** 给定两个以字符串表示的非负整数 `num1` 和 `num2`，返回它们乘积的字符串形式，不得使用大整数库或直接把输入转成整数。

**思路：** 竖式模拟。长度分别为 m、n 的两数乘积至多 m+n 位。用长度 m+n 的数组存各位，`num1[i] * num2[j]` 落在结果下标 `i+j`（进位）和 `i+j+1`（当前位）。逐位累加并处理进位，最后去掉前导零。O(m·n) 时间，O(m+n) 空间。

**Python：**
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
    digits = "".join(map(str, res)).lstrip("0")
    return digits or "0"
```

**TypeScript：**
```typescript
function multiply(num1: string, num2: string): string {
  if (num1 === "0" || num2 === "0") return "0";
  const m = num1.length, n = num2.length;
  const res = new Array<number>(m + n).fill(0);
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

**Java：**
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

**要点：**
- 关键定位：`num1[i] * num2[j]` 的进位落在 `i+j`，当前位落在 `i+j+1`。
- 先把当前位加到 `res[i+j+1]` 再统一取模进位，逻辑最清晰。
- 结果数组去前导零后若为空，返回 "0"。

**常见追问：**
- 支持负数或小数如何扩展。
- 用 FFT/Karatsuba 把大数乘法降到亚 O(m·n)。

**常见坑：**
- 任一因子为 "0" 时未特判，输出带前导零的 "00...0"。
- 下标 `i+j` 与 `i+j+1` 搞反，进位与当前位错位。

**标签：** #algorithm

---

## 其他算法

### 79. 用 Java 实现分布式锁

**难度：** 中等
**主题：** concurrency, redis, distributed-systems
**岗位：** SWE
**级别：** P6-P7

**问题：** 用 Java + Redis 实现一个分布式锁。讨论正确性和边界场景。

**思路：** `SET key uuid NX PX 30000`（原子）。锁主以 UUID 标识，确保只有持有者能释放。释放走 Lua 脚本：GET → 比对 UUID → DEL 原子完成。讨论点：时钟漂移（基于租约）、客户端 GC 停顿（Kleppmann 的 fencing token 论证）、Redlock 争议。备选：Zookeeper 临时顺序节点 + 监听前驱（正确性更干净，延迟更高）。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- UUID token 防止 TTL 过期后误释放他人持有的锁。
- Lua 脚本在服务端将 GET-比对-DEL 原子化。
- TTL 必须大于临界区的最坏耗时，否则要加看门狗续约。

**复杂度：** `acquire` 与 `release` 各是一次 O(1) Redis 往返；Lua 解锁在服务端原子执行 GET-比对-DEL。

**常见追问：**
- Redlock（多主）——与单实例的权衡。
- 看门狗/续约模式——Redisson 风格。
- 公平锁（FIFO）——加队列而不仅一个标志。
- 可重入锁——token 包含线程/调用栈身份，Lua 里计数。
- ZooKeeper / etcd 临时节点作为备选——何时选哪个？

**常见坑：**
- 释放时不检查 token——TTL 后一个客户能解另一个的锁。
- TTL 设得比临界区还短——还在里面锁就自动过期。

**标签：** #coding

---

### 80. 用 BlockingQueue 实现生产者-消费者

**难度：** 中等
**主题：** concurrency, java, threads
**岗位：** SWE
**级别：** P5-P6

**问题：** 用 Java 实现生产者-消费者模式。比较 `synchronized` + `wait/notify`、`ReentrantLock` + `Condition`、`BlockingQueue` 三种方案。

**思路：** 三种全部展示。(1) `synchronized` 块 + `wait()`（释放锁）/ `notifyAll()` —— 容易出错，条件判断必须用 `while` 而非 `if`。(2) `ReentrantLock` + 两个 `Condition`（`notFull`、`notEmpty`）—— 控制更细，可公平可非公平。(3) `ArrayBlockingQueue` —— 生产可用，全自动。讨论何时该自己写：很少；高吞吐场景优先 `LinkedBlockingQueue` 或 `Disruptor`。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 条件判断必须用 `while` 循环——`notify` 不保证就绪。
- 用两个独立的 Condition，避免错误唤醒另一方。
- 真实生产环境优先用现成 `ArrayBlockingQueue`（Java）/`asyncio.Queue`（Python）。

**复杂度：** `put` 与 `take` 各 O(1)；阻塞线程在 condition 上等待而非自旋，满/空时不烧 CPU。

**常见追问：**
- 多生产者 + 多消费者——变不变？
- 带超时的 `offer`/`poll`（返 false vs 抛异常）。
- 无锁 MPSC 环形缓冲区（Disruptor 模式）。
- 反压：消费者跟不上时让生产者减速。

**常见坑：**
- `await` 外面用 `if` 而不是 `while`——虚假唤醒 bug。
- 生产者与消费者用同一 condition——唤醒错人。

**标签：** #coding

---

### 81. 我的日程安排表 I

**难度：** 中等
**主题：** design, tree-map, balanced-bst
**岗位：** P5
**级别：** P5-P6

**问题：** 实现 `book(start, end)`，若 [start, end) 不与已有预订冲突则返回 true，否则 false。

**思路：** 以起点为键的 TreeMap（或 Java TreeSet / C++ std::set）。对新 [s, e)：找 floor 项，检查其 end > s；找 ceiling 项，检查其 start < e。每次预订 O(log n)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 检查前驱的 end 与后继的 start。
- 按 `start` 二分保持有序插入。
- 半开区间 `[s, e)` 让 `==` 边界天然安全。

**标签：** #algorithm

---

## 系统设计

### 82. 设计淘宝秒杀系统

**难度：** 困难
**主题：** system-design, caching, queue, rate-limiting, consistency
**岗位：** 高级 SWE
**级别：** P7

**问题：** 设计淘宝秒杀的后端：10 万件商品在 10:00:00.000 开售，数百万用户在同一毫秒点"购买"。库存不能超卖。

**思路：** 分层防御：(1) 客户端节流 + 热门页面加 CAPTCHA。(2) CDN 缓存商品页；"购买"按钮由客户端计时器启用（不可信）。(3) API 网关用 Sentinel 做全局限流。(4) Redis 持有库存计数器；`DECR` 原子，返回 -1 视为超卖 → 拒绝。(5) 锁定成功的请求推到 RocketMQ 异步创单（避免 DB 热行竞争；UI 降级为"订单处理中"）。(6) 订单服务写分库 MySQL（按 user_id 分片），与已锁定的库存核对。讨论：幂等令牌（用户重试不能重复下单）、缓存预热（开售前把库存加载到 Redis）、优雅降级（售罄 → 静态页）。

**常见追问：**
- Redis 中途挂了——单点故障？
- T=0 冷缓存瞬间——骚动群保护。
- 反作弊：怎么防机器人抓走 90% 库存？
- 人均限购（1 件/ID、1 件/手机号、1 件/设备）——在哪里执行？
- 运维实时库存仪表盘——怎么读不冲突？

**常见坑：**
- 在热路径上直接 MySQL 减库存——行锁竞争压垮吞吐。
- 信任客户端计时门控"购买"——攻击者提前发请求。

**标签：** #system-design

---

### 83. 设计支付宝支付流程

**难度：** 困难
**主题：** system-design, distributed-transactions, idempotency, payments
**岗位：** 高级 SWE
**级别：** P7-P8

**问题：** 设计用户在淘宝下单后用支付宝付款的支付流程。覆盖失败场景。

**思路：** 跨服务 Saga 模式：订单 → 支付账户 → 银行/银行卡。每一步是幂等的本地事务；失败时执行补偿动作。幂等令牌（out_trade_no）防止重试时重复扣款。使用 Seata 或自研 TCC（Try-Confirm-Cancel）框架：Try 预占资金，Confirm 真正扣款，Cancel 释放。银行异步回调更新最终状态。讨论：对账（每日批处理比对自家记录和银行记录）、最终一致性窗口（用户看到"处理中"而非"已支付"）、风控信号、PCI 合规边界。

**常见追问：**
- TCC vs Saga vs 2PC——各适合什么场景？
- 补偿事务本身也失败怎么办？
- 银行回调重复 / 乱序——幂等设计。
- 跨境支付——FX 风险与清算窗口。
- 退款流程——部分退款、数天后、原交易已归档。

**常见坑：**
- 把银行调用当同步——超时后订单状态未定。
- 没有幂等令牌——用户重试重复扣款。

**标签：** #system-design

---

### 84. 设计 RocketMQ 风格的消息队列

**难度：** 困难
**主题：** system-design, message-queue, replication, ordering
**岗位：** 高级 SWE
**级别：** P7-P8

**问题：** 设计一个分布式消息队列，类似 RocketMQ，支持顺序消息、事务消息和高吞吐。

**思路：** Broker 维护 commit log + 每个队列的 offset。生产者写入某个分区（一致性哈希或轮询）；消费者按自己维护的 offset 拉取。复制：主从（同步或异步）。顺序消息：生产者按 key 固定到某个分区。事务消息：两阶段——发送"half"消息 → Broker 暂存 → 生产者提交/回滚 → Broker 投递或丢弃（带回查机制处理生产者崩溃）。讨论：零拷贝（mmap + sendfile）提升吞吐、成员变更时消费组再平衡、消息积压的处理。

**标签：** #system-design

---

### 85. 设计分布式配置中心（类 Nacos）

**难度：** 中等
**主题：** system-design, distributed, watch, consistency
**岗位：** 高级 SWE
**级别：** P7

**问题：** 设计一个被数千个服务使用的配置中心，用于管理运行时配置和服务发现。

**思路：** 3-5 台服务器组成集群，用 Raft 保证写强一致。客户端用长轮询（或 SSE / WebSocket）订阅变更通知。客户端本地缓存 + 服务器不可达时回退到磁盘。服务发现部分，注册表存储 `(service, instance, healthy)`，靠心跳做健康检查。配置版本化，支持回滚。讨论：优雅降级（服务端宕机时客户端跑缓存配置）、命名空间/租户隔离、配置推送如何避免惊群（服务端错峰通知）。

**标签：** #system-design

---

### 86. 设计菜鸟物流追踪

**难度：** 困难
**主题：** system-design, time-series, geospatial, ingestion
**岗位：** 高级 SWE
**级别：** P7

**问题：** 设计菜鸟的包裹追踪系统——每个包裹会发出状态事件（揽收、运输中、已派送），用户实时查询状态。

**思路：** 事件从网关入 → Kafka → 消费管道。每个包裹的最新状态存 HBase 或 Cassandra（key = tracking_number，列按时间戳排序）。聚合视图（送达 ETA、枢纽瓶颈统计）用 Flink 计算。地理空间：每次扫描发出 `(parcel_id, hub_id, lat/lng, ts)`；地图视图通过 geo 索引（Elasticsearch 或 H3 网格）按 bounding box 查询。讨论读放大（数百万用户查同一个包裹）、通知触发、长期已完成包裹的历史查询（迁到冷存储）。

**标签：** #system-design

---

### 87. 设计电商优惠券/促销系统

**难度：** 困难
**主题：** system-design, rules-engine, caching, anti-abuse
**岗位：** 高级 SWE
**级别：** P7

**问题：** 设计结算时计算优惠券和促销的系统——支持叠加规则、时效、用户资格、防滥用。

**思路：** 规则引擎（Drools 风格或自研 DSL）将购物车与所有适用促销做匹配。优惠券存 Redis（按用户持有、按活动发放计数）。资格校验：用户限额（原子递减）、时间窗、商品/类目匹配。防滥用：设备指纹、IP 限流、ML 风险打分。叠加时计算顺序很关键——定义明确优先级：店铺券 → 类目券 → 平台券。异步发券审计日志用于反欺诈调查。讨论：规则变更时的缓存失效、A/B 测试不同促销逻辑、活动出问题时如何中途回滚。

**标签：** #system-design

---

### 88. 设计支付宝对账系统

**难度：** 困难
**主题：** system-design, reconciliation, batch, consistency
**岗位：** 高级 SWE（支付方向）
**级别：** P7-P8

**问题：** 设计支付宝的每日对账系统，用于核对内部账本与外部渠道（银行、卡组织）的记录。每天数百万笔交易必须完成匹配，任何差异都要被发现并进入处理流程。

**思路：** 对账是离线批处理，而非实时。(1) 每个渠道产出对账文件（银行流水）；支付宝导出同一时间窗的自身账本。把两侧归一化成以业务号（out_trade_no + 金额 + 渠道）为键的标准结构。(2) 对两侧做归并排序或哈希连接——上千万行时用 Spark/Flink 或 MapReduce 按键分区。(3) 分类结果：匹配成功、仅我方有（渠道丢失/延迟）、仅渠道有（我方丢失）、金额不一致、状态不一致。(4) 把不匹配行送入差异处理流程：待处理的自动重试（渠道回调可能迟到），已知时间差自动调平，其余按 SLA 升级到运维工单。(5) 幂等与恰好一次匹配：按业务号去重；一笔交易最多匹配一次。(6) 多级对账：先做 T+1 交易对账，再做账户/余额对账以发现系统性偏差。讨论：截止时间边界（临近零点的交易可能跨两份文件）、迟到文件、不可篡改的审计流水，以及对账作为 TCC/Saga 支付链路背后的终极兜底。

**标签：** #system-design

---

### 89. 设计钉钉即时通讯系统

**难度：** 困难
**主题：** system-design, im, push, fan-out
**岗位：** 高级 SWE
**级别：** P7

**问题：** 设计钉钉的 IM 后端，支持单聊、超大企业群（数万人）、在线/离线投递、多端同步和已读回执。

**思路：** (1) 长连接：客户端与接入/网关层维持持久 WebSocket/TCP；路由表（放 Redis）把 用户+设备 映射到持有其连接的网关节点。(2) 消息流转：发送方 → 网关 → 逻辑服务分配单会话内单调递增的 seq id（对排序和缺口检测至关重要）→ 落库消息存储（按 conversation_id 分片）→ 推送给在线接收方，为离线方写离线收件箱。(3) 扩散策略：单聊和小群用写扩散（推到每个成员收件箱）；超大群用读扩散（只存一份，成员按 seq id 拉取），避免写放大。(4) 多端同步：每台设备维护单会话的 `last_read_seq` 和 `last_sync_seq`；重连时拉取增量。(5) 已读回执（钉钉标志性功能）：为每条消息存已读集合；大群按计数聚合（已读 X / 共 N）而非逐人标记，以限制存储。(6) 可靠性：客户端 ACK + 服务端重传直到确认；按客户端生成的 msg id 去重（幂等）。讨论离线推送走 APNs/厂商通道、消息撤回/编辑、热点会话分片。

**标签：** #system-design

---

### 90. 设计防超卖的库存扣减服务

**难度：** 困难
**主题：** system-design, inventory, concurrency, idempotency
**岗位：** 高级 SWE（电商方向）
**级别：** P7

**问题：** 设计淘宝/天猫订单背后的库存扣减服务。在高并发（含双11）下，库存绝不能变负，必须与权威数据库保持一致，且在重试时不重复扣减。

**思路：** 把热点计数器与权威数据源分离。(1) Redis 持有快速的原子库存计数器；扣减用原子 Lua 脚本先判 `stock >= qty` 再 `DECRBY`，不足则返回失败——消除先查后改的竞态。(2) 扣减成功时用幂等令牌（order_no）记录，客户端重试时读取先前结果而非再次扣减；把 令牌→结果 存入 Redis 并设 TTL。(3) 通过 RocketMQ 异步落库分库 MySQL；DB 用乐观更新 `UPDATE stock SET n = n - qty WHERE sku = ? AND n >= qty` 作为第二道兜底——受影响行数告诉你是否成功。(4) 预占 vs 提交：下单时预占（冻结）库存；支付成功时提交；支付超时时释放回补（延迟消息触发回滚）。(5) 对账任务定期以及缓存预热时比对 Redis 与 MySQL，因为 Redis 是加速器、MySQL 才是权威。讨论：开售前把库存预热进 Redis、Redis 高可用（单节点故障不能丢计数器）、非原子的先取后设导致的超卖，以及人均限购与扣减一起原子执行。

**标签：** #system-design

---

## 行为面试

### 91. 客户第一：讲一次你在内部压力下仍把客户放在首位的经历

**难度：** 中等
**主题：** behavioral, customer-first, six-values
**岗位：** SWE
**级别：** P5-P7

**问题：** 讲一次你顶住内部干系人的压力，做出对客户最有利决策的经历。

**思路：** 对应客户第一。展示：(1) 内部压力是具体的（截止日期、高管要求、成本），(2) 你用数据指出了具体的客户损害，(3) 在可能时你提出了两边都能照顾的替代方案，(4) 你向上沟通而不是简单拒绝。结果：客户侧指标提升，内部关系保留。

**标签：** #behavioral

---

### 92. 拥抱变化：讲一次你的项目方向发生重大调整

**难度：** 中等
**主题：** behavioral, embrace-change, six-values
**岗位：** SWE
**级别：** P5-P7

**问题：** 讲一次你所在项目的方向发生重大变化的经历。你是怎么适应的？

**思路：** 对应拥抱变化。阿里组织调整很频繁——他们希望招能跟上变化的人。展示：(1) 你在转向中找到了机会（学新技术、进新领域），(2) 你帮助了被变化困住的同事，(3) 你在新方向上带着热情而非怨气交付。避免那种暗里抱怨领导层的故事。

**标签：** #behavioral

---

### 93. 团队合作：讲一次你帮助同事获得成功的经历

**难度：** 中等
**主题：** behavioral, team-work, six-values
**岗位：** SWE
**级别：** P6-P7

**问题：** 讲一次你为帮助同事成功而额外付出、即便对自己没有直接好处的经历。

**思路：** 对应团队合作。展示：(1) 具体的同事 + 情境（晋升答辩遇挫、某事被卡住），(2) 你具体做了什么（结对编程、替对方扛 on-call、代写设计文档），(3) 对方的结果——上线了、晋升了、能力提升。不要把功劳揽过来；同事是主角。

**标签：** #behavioral

---

### 94. 你解决过的最难技术问题

**难度：** 中等
**主题：** behavioral, technical-depth, dive-deep
**岗位：** 高级 SWE
**级别：** P7

**问题：** 带我走一遍你亲自解决过的最难的技术问题。要详细。

**思路：** 高级别（P8+）面试官在这道题上打分很重。挑选一个具备以下要素的问题：(1) 真实复杂度（不能只是"我学了个新框架"），(2) 可量化的影响，(3) 你有意识做出的权衡，(4) 现在回头你会怎么改进。要准备好被追问 20 分钟以上。加分项：如果能把它和 JVM 内部或分布式系统理论关联起来，P9 面试官会眼前一亮。

**标签：** #behavioral

---

### 95. 激情与敬业：讲一次你在大促中保障系统稳定的经历

**难度：** 中等
**主题：** behavioral, six-values, stability, results-oriented
**岗位：** SWE
**级别：** P6-P7

**问题：** 讲一次你负责在高峰事件（如双11 / 一次大型上线）中保障系统稳定的经历。事前、事中、事后你分别做了什么？

**思路：** 对应激情/敬业，兼含结果导向。阿里的成败极大依赖大促稳定性，所以按完整生命周期组织回答：(1) 事前——依据预估流量做容量规划、全链路压测、识别单点故障、准备优雅降级预案（用 Sentinel 限流、降级开关、Plan B 兜底页）。(2) 事中——你在作战室值守、盯核心指标，并做出具体决策（如翻转降级开关摘掉非核心功能以保下单链路）。(3) 事后——量化结果（零 P1 故障、扛住峰值 X% QPS、延迟压在 Y ms 以内）并推动复盘，让系统在下次更稳。展现压力下的担当、用数据冷静决策、以及优先保护面向客户关键链路的倾向。避免空泛的英雄叙事——说清指标和具体决策。

**标签：** #behavioral

---

### 96. 诚信：讲一次你在压力下做出诚实抉择的经历

**难度：** 中等
**主题：** behavioral, integrity, six-values
**岗位：** SWE
**级别：** P5-P7

**问题：** 讲一次你发现了一个本可以更容易隐瞒的错误、数据问题或风险，而你选择把它暴露出来的经历。后来怎样了？

**思路：** 对应诚信，这是阿里六脉神剑中不可妥协的一条——一个诚信红线就可能让整轮面试挂掉。选一个真正有分量的故事：你发现了自己上线引入的 bug、被过于乐观上报的指标、或安全/数据风险。展现：(1) 那个诱人的省事路径（保持沉默、按时上线、放任过去）是真实存在的，(2) 你主动上报——向主管、受影响团队或客户——带着事实和修复方案，而不仅是拉响警报，(3) 你承担责任而非甩锅，(4) 结果：信任得以保全、问题被控制住，并常常推动流程改进以杜绝复发。面试官在探查当诚信对你个人有代价时你是否守住了。不要选无关痛痒或没有受害方的例子。

**标签：** #behavioral

---

## 领域知识

### 97. JVM 调优：排查 Java 服务的频繁 Full GC

**难度：** 困难
**主题：** java, jvm, gc, performance
**岗位：** SWE
**级别：** P6-P7

**问题：** 一个 Java 服务每隔几分钟就出现长时间 Full GC 停顿，导致延迟尖刺。讲讲你是怎么诊断和修复的。

**思路：** (1) 打开 GC 日志（JDK 9+ 用 `-Xlog:gc*`），收集堆 dump（`jmap` 或 OOM 自动 dump）。(2) 用 GCViewer/JClarity 分析——找出停顿原因（分配速率太高？老年代填满太快？metaspace？）。(3) 常见元凶：大对象分配（缓存没限上限）、内存泄漏（静态集合在增长）、收集器选错（低延迟场景用 Parallel GC = 错 → 换 G1/ZGC/Shenandoah）。(4) 调堆大小——Eden 过小 = 频繁 young GC，老年代过大 = Full GC 时间过长。(5) 代码层修复：热路径对象池化、堆外缓存、懒加载。提一句生产环境永远开 `-XX:+HeapDumpOnOutOfMemoryError`。

**标签：** #domain-knowledge

---

### 98. 分布式事务：2PC vs TCC vs Saga vs Seata

**难度：** 困难
**主题：** distributed-systems, transactions, seata, payments
**岗位：** 高级 SWE
**级别：** P7-P8

**问题：** 一笔支付跨三个服务（订单、钱包、优惠券）。比较 2PC、TCC、Saga、Seata AT 模式四种方案的原子性。在阿里这种体量下你会选哪个？

**思路：** **2PC** —— 同步阻塞；协调者宕机时参与者悬空。规模上不适用。**TCC（Try-Confirm-Cancel）** —— 应用自定义；Try 预占资源，Confirm 真正提交，Cancel 释放。强一致，代码量大。**Saga** —— 一串本地事务 + 补偿动作；最终一致，步骤间无隔离（用户可能看到脏读）。**Seata AT 模式** —— 通过 undo log 自动补偿；比 TCC 少写代码但需要 DB 配合，且会引入行级"全局锁"。在阿里量级：支付走 TCC（正确性关键，愿意写代码），非财务流程走 Saga（如订单 → 发货 → 通知），AT 模式适合新建的内部服务。讨论幂等、重试策略、对账作为兜底。

**标签：** #domain-knowledge

---

### 99. Redis 缓存一致性：穿透、击穿与雪崩

**难度：** 困难
**主题：** redis, caching, consistency, high-concurrency
**岗位：** SWE（后端方向）
**级别：** P6-P7

**问题：** 一个读多写少的服务把 MySQL 行缓存在 Redis 里。解释缓存穿透、击穿、雪崩，各自如何防御，以及写操作时如何保持缓存与数据库一致。

**思路：** **穿透** —— 查询不存在的键绕过缓存直击 DB。防御：缓存空结果（短 TTL）和/或用布隆过滤器在前端拒绝不存在的键。**击穿** —— 单个热点键过期，成千上万并发请求同时压垮 DB。防御：用互斥锁/分布式锁只让一个线程重建缓存，其余等待或读旧值；或逻辑过期（热点键不物理过期，异步刷新）。**雪崩** —— 大量键同时过期（或 Redis 宕机），流量涌向 DB。防御：TTL 加随机抖动、多级缓存、熔断+限流（Sentinel）、Redis 高可用（集群+副本）。**写一致性** —— 常用旁路缓存配合写时删除：先更新 DB，再删除缓存键（而非更新它，以避免写覆盖竞态）。这仍是最终一致；经典竞态（读线程在 DB 写与缓存删除之间回填了旧值）用延迟双删或 binlog 驱动失效（Canal 订阅 MySQL binlog 删键）来缓解。若有强需求，讨论为什么跨缓存与 DB 的 2PC 不实际，最终一致加 TTL 才是务实之选。

**标签：** #domain-knowledge

---

### 100. MySQL 索引与分库分表：从查询调优到水平扩展

**难度：** 困难
**主题：** mysql, indexing, sharding, performance
**岗位：** SWE（后端方向）
**级别：** P7

**问题：** MySQL 上的订单表已经涨到数亿行，查询在变慢。先讲索引调优，再讲你会在何时、如何做分库分表。

**思路：** **先做索引。** (1) 用 `EXPLAIN` 看查询是否命中索引、连接类型、扫描行数；目标是避免全表扫描。(2) 按最左前缀原则设计联合索引，按选择性排列列，并尽量做覆盖索引，使查询直接从索引返回、无需回表。(3) 要知道 InnoDB 用主键做聚簇索引（主键保持单调，如自增，以避免页分裂），二级索引里存的是主键。避免使索引失效的写法：在列上加函数、前导通配符、隐式类型转换、跨未索引列的 `OR`。**再做扩展。** 当单表/单实例即便有好索引也扛不住（写吞吐、表体量、单机上限）时分片：(1) 垂直拆分（冷热字段分离或按业务拆到不同库），再 (2) 水平分片——选分片键（如订单用 user_id，让同一用户订单落在一起）和策略（哈希均匀分布，或范围便于按时间归档）。(3) 要讨论的后果：跨分片查询和 join 变成应用侧的分散-聚合，全局唯一 ID 需要生成器（Snowflake / 号段模式），分布式事务出现（Seata/TCC），重新分片时的再平衡很痛苦——所以要提前预分足够多的分片。工具：ShardingSphere / TDDL。也提一句在分片之前/同时用读副本做读扩展。

**标签：** #domain-knowledge

---

## 阿里巴巴特有的建议

- **深入掌握 Java 中间件。** Spring 生命周期、AOP、Dubbo RPC、MyBatis 拦截器——面试官会深挖到源码。
- **JVM 内部原理是必修课。** GC 算法（CMS、G1、ZGC）、内存模型（JMM）、`volatile`/`synchronized`/`final` 语义。了解 `AQS` 内部原理。
- **开源贡献加分明显。** 尤其是阿里主导的项目（Dubbo、RocketMQ、Nacos、Sentinel、Seata、Alink）。要具体提及。
- **六脉神剑要准备到位。** 每个价值观备一个故事。客户第一和拥抱变化的故事最常被复用。
- **高级别面试官会问"设计淘宝"。** 他们要的是架构叙事，不是画框框。练习能就权衡点连续讲 20 分钟以上。

## 参考资料

- 阿里技术博客（中文：alibaba-cloud.medium.com；部分有英文镜像）
- 牛客网阿里面经——丰富的中文数据库
- 《Designing Data-Intensive Applications》—— Kleppmann
- 开源：github.com/apache/dubbo、github.com/apache/rocketmq、github.com/alibaba/Sentinel、github.com/seata/seata
