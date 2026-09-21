# 亚马逊

```yaml
company: 亚马逊（AWS、零售、Devices）
typical_rounds: 1 轮 OA（在线测评）+ 1 轮电话面 + 4-6 轮 onsite "loop"（1 位 bar raiser、2 轮编码、1-2 轮系统设计、1 轮 hiring manager）—— 每一轮都有行为面试部分
focus_areas: OOD、数据结构、系统设计、领导力准则（LP）
languages_allowed: 任意主流语言；Java/Python/C++ 常见
duration: 每轮 loop 60 分钟（约 25 分钟行为 + 30 分钟技术）
notable_quirks:
  - 每个行为面试回答都必须明确对应到 16 条领导力准则中的一条（或多条）
  - "Bar raiser" 是来自其他团队、经过培训的面试官，拥有一票否决权
  - 每轮开头先问 2 个 LP 问题
  - OA 包含工作风格测评 + 2 道编码题 + 工作模拟
sources: Glassdoor、LeetCode Discuss（amazon 标签）、Blind、leetcode.com/discuss/interview-experience
```

## 概述

亚马逊的独特之处在于领导力准则的权重极高——再强的技术表现，也可能因为 LP 表现弱而被一票否决。16 条 LP（Customer Obsession、Ownership、Invent and Simplify、Are Right A Lot、Learn and Be Curious、Hire and Develop the Best、Insist on the Highest Standards、Think Big、Bias for Action、Frugality、Earn Trust、Dive Deep、Have Backbone、Deliver Results、Strive to be Earth's Best Employer、Success and Scale Bring Responsibility）每条都需要至少 2 个故事。技术上侧重 OOD（LRU、停车场）、图、以及带 AWS 味道的系统设计。

## 链表

### 1. LRU 缓存

**难度：** 中等
**主题：** ood, hashmap, linked-list, design
**岗位：** SWE
**级别：** L4

**问题：** 设计一个 LRU（最近最少使用）缓存数据结构，`get(key)` 和 `put(key, value)` 各为 O(1)。容量有限；溢出时淘汰最近最少使用的。

**思路：** 哈希表 `key -> node` + 双向链表。`get` 时把节点移到头部。`put` 时插入头部；若 size > cap，删除尾节点并从 map 移除。双向链表是 O(1) 删除的关键。边界：更新已有 key、容量为 0。追问：线程安全（类似 ConcurrentHashMap 的分段锁）、改成 LFU。

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
- `OrderedDict` / JS `Map` 保持插入顺序——重新插入即标记为最近使用。
- 每次 `get`、`put` 均摊 O(1)；空间 O(capacity)。
- 严格超容量时才从最旧端淘汰。

**常见追问：**
- 使其线程安全——整体加锁 vs. 分段锁（类 `ConcurrentHashMap` 的 striped lock）。
- 改成 LFU；讨论双哈希 + 频次链表的实现（O(1) 插入/淘汰）。
- 每个条目加 TTL；懒淘汰 vs. 后台扫描怎么选？
- 扩展到多进程／多机：分片策略与分布式缓存的一致性模型。

**常见坑：**
- 用单向链表——没有 prev 指针无法 O(1) 删除。
- `put` 已存在的 key 时忘记更新访问顺序。
- 在插入前先淘汰，导致 `capacity == 0` 边界出错。
- Java 中使用 `LinkedHashMap` 但未开 `accessOrder=true`，仅以插入顺序跟踪。

**优秀回答要点：**
- 开题明确提出 O(1) 目标，并以此推导出两个数据结构的必要性。
- 明确说出不变式：“头 = MRU，尾 = LRU”。
- 主动提及并发与淘汰策略的权衡，不等面试官问。
- 走一遇小型 trace（3-4 个操作）证明正确性。

**差答案示例：** 直接吐出“用 `HashMap` + 数组，从数组里删”——忽略 O(1) 要求、也不讨论淘汰顺序和容量边界，面试官会直接扣分。

**参考资料：**
- LeetCode 146 — LRU Cache（题目 + 高赞题解）
- 《设计数据密集型应用》第 5 章——缓存失效讨论
- Java `LinkedHashMap` JDK 源码（`accessOrder`、`removeEldestEntry`）

**标签：** #algorithm

---

### 2. 合并 K 个有序链表

**难度：** 困难
**主题：** linked-list, heap, divide-and-conquer
**岗位：** SWE
**级别：** L4

**问题：** 把 `k` 个有序链表合并成一个有序链表。

**思路：** 大小为 k 的小顶堆，存 `(value, list_index, node)`；弹出最小，推进该链表，将下一个节点入堆。O(N log k)，N 为节点总数。备选：分治两两归并，同复杂度，常数稍优。注意堆的 tie-break（别直接比较节点）。

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

**Java：**
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

**要点：**
- 用链表下标做 tie-break，堆永远不会比较节点本身。
- 时间 O(N log k)，堆额外空间 O(k)。
- 两两分治归并复杂度相同，且无需堆。

**常见追问：**
- 链表分布在多机上——如何做分布式多路归并？
- 归并的是 K 个“流”而非数组——接口设计与背压。
- 不用内置堆，手写上浮/下沉实现。
- 内存压力：复用原节点还是新分配归并后的节点？
- 稳定性：相等值要保持原链表顺序。

**常见坑：**
- 把节点本身填进堆——Python/Java 会尝试比较节点而崩溃。
- 弹出后忘记推进源链表，导致死循环。

**标签：** #algorithm

---

### 3. LFU 缓存

**难度：** 困难
**主题：** ood, hashmap, linked-list, design
**岗位：** Senior SDE
**级别：** L5

**问题：** 设计一个最不经常使用（LFU）缓存，`get` 和 `put` 都是 O(1)。溢出时淘汰使用频率最低的键；同频率下淘汰最久未使用的。

**思路：** 两个哈希表：`key -> (value, freq, node)` 和 `freq -> 双向链表`。跟踪 `min_freq`。访问时，把节点从原频率链表移到 `freq+1` 链表。`put` 溢出时，删除 `min_freq` 链表的尾节点。边界：频率链表变空时，仅在插入时推进 `min_freq`。由于簿记复杂度，明显比 LRU 难。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 每个频率桶用有序 map，桶内保持 LRU 顺序。
- `get`、`put` 均摊 O(1)。
- 新插入时重置 `min_freq = 1`；只在 `bump` 把桶清空时才前进。

**标签：** #algorithm

---

### 4. 复制带随机指针的链表

**难度：** 中等
**主题：** linked-list, hashmap
**岗位：** SDE
**级别：** L4

**问题：** 深拷贝一个链表，每个节点有 `next` 和指向任意节点或 null 的 `random` 指针。

**思路：** 方案 A：哈希表 `original -> copy`，两遍（建节点，再连 `next`/`random`）。O(n) 时空。方案 B（O(1) 额外空间）：交织拷贝节点（`A -> A' -> B -> B' -> ...`），然后 `A'.random = A.random.next`，再拆分两条链。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 两遍分别处理"建节点"和"连指针"，逻辑清晰。
- map 让 `random` 任意指向都成立。
- O(n) 时间和空间；O(1) 额外空间的交织法更难写。

**标签：** #algorithm

---

### 5. K 个一组翻转链表

**难度：** 困难
**主题：** linked-list, recursion, in-place
**岗位：** SWE
**级别：** L5-L6

**问题：** 给定链表，每 `k` 个节点一组进行翻转，返回翻转后的链表；不足 `k` 个的一组保持原有顺序。

**思路：** 用一个 `dummy` 指向头，维护 `group_prev` 指针。每轮先向前走 `k` 步定位本组末尾 `kth`；若不足 `k` 个则停止。随后在组内做标准的头插式翻转，最后接回前驱与后继。全程只改指针，时间 O(n)，空间 O(1)。物流/订单流水常需按固定批量分块处理，本题是其抽象。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 先探测本组是否够 `k` 个，不够则整组不翻转直接返回。
- 用哨兵 `dummy` 统一处理头节点被翻转的情形。
- 时间 O(n)，仅指针改写，空间 O(1)。

**常见追问：**
- 递归写法如何实现？栈深度是多少？
- 若要求“不足 k 个的尾组也翻转”，代码如何改？

**常见坑：**
- 翻转后忘记把上一组末尾接到本组新头，导致链断裂。
- `group_prev` 更新错误，误接到已翻转前的旧头。

**标签：** #algorithm

---

### 6. 两数相加

**难度：** 中等
**主题：** linked-list, math, simulation
**岗位：** SWE
**级别：** L5

**问题：** 两个非空链表按逆序存储两个非负整数，每个节点存一位数字。将两数相加，以同样的逆序链表返回结果。

**思路：** 同步遍历两条链表，逐位相加并维护进位 `carry`。用哨兵 `dummy` 简化建表，每步新建节点值为 `(a + b + carry) % 10`，进位为 `// 10`。任一链表走完则按 0 处理，循环终止条件包含 `carry` 非零。时间 O(max(m, n))，空间 O(max(m, n))（结果链表）。逆序存储天然契合从低位开始相加。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 循环条件带上 `carry`，处理最高位进位（如 5+5）。
- 哨兵 `dummy` 免去对结果头节点的特判。
- 两链表长度不等时，短的按 0 补齐。

**常见追问：**
- 若数字按正序（最高位在前）存储，如何做？（用栈或先翻转）
- 如何原地复用其中一条链表以省空间？

**常见坑：**
- 忘记处理最后残留的进位，导致结果少一位。
- 只在两链表都非空时才继续，漏掉长度不等的尾部。

**标签：** #algorithm

---

### 7. 重排链表

**难度：** 中等
**主题：** linked-list, two-pointers, in-place
**岗位：** SWE
**级别：** L5

**问题：** 给定链表 `L0 → L1 → … → Ln-1 → Ln`，将其原地重排为 `L0 → Ln → L1 → Ln-1 → L2 → Ln-2 → …`，不得修改节点值。

**思路：** 三步走：快慢指针找中点将链表切成两半；翻转后半部分；再交替合并两半。全程只改指针，时间 O(n)，空间 O(1)。这类“首尾交替”的重排在页面分页展示、队列公平调度中都有类似模式。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 找中点用快慢指针，偶数长度时前半段不短于后半段。
- 切断中点后翻转后半，再交替穿插合并。
- 时间 O(n)，原地重排空间 O(1)。

**常见追问：**
- 如何用同样的技巧判断链表是否回文？
- 若不允许翻转（保序），能否用双端队列实现，代价如何？

**常见坑：**
- 切分时忘记把前半段末尾 `next` 置空，形成环。
- 合并时未提前保存两侧的 `next`，指针改写后丢失后继。

**标签：** #algorithm

---

## 树

### 8. 单词拆分

**难度：** 中等
**主题：** dp, strings, trie
**岗位：** SWE
**级别：** L4

**问题：** 给定字符串 `s` 和单词字典，返回 `s` 是否能被切分为字典里的若干单词。

**思路：** DP——`dp[i]` 表示 `s[0..i)` 是否可切分。转移：`dp[i] = 任意 dp[j] && s[j..i) 在字典中`。配 hashset 查询为 O(n² * L)。Trie 可加速内层查找。追问：返回所有切分方式（带 memo 的递归）。

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
      if (dp[j] && words.has(s.slice(j, i))) { dp[i] = true; break; }
    }
  }
  return dp[n];
}
```

**Java：**
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

**要点：**
- `dp[0] = True` 表示空前缀。
- 外层 O(n)，内层 O(n)，每次切片 O(L)，合计 O(n^2 * L)。
- `dp[i]` 一旦为真即 break，缩短内循环。

**常见追问：**
- 返回所有合法切分（Word Break II）配 memo 递归。
- 字典达到 10^6 量级——用 Trie 提前剪枝不可能的切分。
- 查询间字典在线更新，哪些 dp 必须作废？
- Unicode / 多字节单词；性能随平均词长 L 怎么变化？

**常见坑：**
- 漏掉 `dp[0] = True`，所有切分都会判定失败。
- 内循环重复创建子串 `s[j:i]`；热点字典要用 Trie 或 substring 索引。

**标签：** #algorithm

---

### 9. 连接词

**难度：** 困难
**主题：** dp, trie, strings
**岗位：** Senior SDE
**级别：** L5

**问题：** 给定无重复的单词列表，返回所有完全由列表中至少两个其他词拼接而成的单词。

**思路：** 把所有词放入集合。对每个词跑类似 Word-Break 的 DP：`dp[i]` 表示 `s[0..i)` 可用其他词切分（至少一次切分）。Trie 加速前缀扫描。O(sum(L_i^2))。先按长度排序，便于增量构建。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- `(j > 0 || i < n)` 保证不允许整词匹配自己。
- 每个词内层 O(L^2)；Trie 可进一步降低常数。
- 结构与 Word Break 相同，多了"至少用其他词一次"。

**标签：** #algorithm

---

### 10. 另一棵树的子树

**难度：** 简单
**主题：** tree, dfs, recursion
**岗位：** SDE
**级别：** L4

**问题：** 给定两棵二叉树 `root` 和 `subRoot`，判断 `root` 是否存在与 `subRoot` 结构和节点值都完全相同的子树。

**思路：** 递归：在 `root` 的每个节点上检查 `sameTree(node, subRoot)`。`sameTree` 双侧递归。最坏 O(m*n)。更快：用 null 标记序列化两棵树，再用字符串 `contains`（或 KMP）—— O(m+n)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 空 `subRoot` 平凡地是子树。
- 最坏 O(m * n)，m、n 为两树节点数。
- 用 null 标记序列化 + KMP 可降到 O(m + n)。

**标签：** #algorithm

---

### 11. 二叉树的序列化与反序列化

**难度：** 困难
**主题：** tree, dfs, bfs, design
**岗位：** Senior SDE
**级别：** L5

**问题：** 设计算法将二叉树序列化为字符串，并能反序列化回来。

**思路：** 前序 DFS + null 标记：`"1,2,#,#,3,#,#"`。反序列化通过队列/迭代器递归消费 token。两端 O(n)。层序（BFS）也行，更便于调试。明确分隔符和 null 哨兵。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 前序 + null 标记可无歧义重建结构。
- 序列化与反序列化各 O(n) token。
- 用共享游标/迭代器按序消费 token。

**标签：** #algorithm

---

### 12. 单词搜索 II

**难度：** 困难
**主题：** trie, backtracking, dfs, matrix
**岗位：** Senior SDE
**级别：** L5

**问题：** 给定 `m x n` 字符板和单词列表，返回板上存在的所有词（4 邻接，单词内不可复用格子）。

**思路：** 构建所有词的 trie。对每个格子 DFS，同步沿 trie 行走。到达 trie 中标记单词的节点时，收集并清除标记（避免重复）。耗尽后剪除死分支。O(m*n * 4^L)。Trie 是关键——朴素逐词 DFS 会超时。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- DFS 与 trie 同步行走，死分支被剪除。
- 命中后 pop `$` 标记，避免重复无需额外集合。
- 回溯时还原格子原字符。

**标签：** #algorithm

---

### 13. 二叉树的最近公共祖先

**难度：** 中等
**主题：** tree, dfs, recursion
**岗位：** SDE
**级别：** L4

**问题：** 给定二叉树和两个节点 `p`、`q`，找它们的最近公共祖先。

**思路：** 递归：若 root 为空或为 p 或 q，返回 root。左右子树递归。若两侧都非空，root 即 LCA；否则返回非空那侧。O(n)。BST 上也可用，但 BST 可比较值做 O(log n)。

**Python：**
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

**TypeScript：**
```typescript
function lowestCommonAncestor(root: TreeNode | null, p: TreeNode, q: TreeNode): TreeNode | null {
  if (!root || root === p || root === q) return root;
  const l = lowestCommonAncestor(root.left, p, q);
  const r = lowestCommonAncestor(root.right, p, q);
  if (l && r) return root;
  return l ?? r;
}
```

**Java：**
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

**要点：**
- 等于 p 或 q 的节点可作为自身的 LCA。
- 两侧都非空时当前节点即分叉点。
- O(n) 时间，O(h) 递归深度。

**标签：** #algorithm

---

### 14. 验证二叉搜索树

**难度：** 中等
**主题：** tree, dfs, recursion
**岗位：** SDE
**级别：** L4

**问题：** 给定二叉树，判断是否为有效 BST。

**思路：** 递归传递 `(min, max)` 边界。每个节点须满足 `min < node.val < max`。递归时收紧边界。O(n)。备选：中序遍历应严格递增。注意 INT 边界——用 long 或 Optional。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 严格不等号保证唯一性。
- 边界向下传递，越深越紧。
- 中序遍历应产生严格递增序列。

**标签：** #algorithm

---

### 15. 二叉树的层序遍历

**难度：** 中等
**主题：** tree, bfs, queue
**岗位：** SDE
**级别：** L5

**问题：** 给定一棵二叉树，按层从上到下、每层从左到右返回节点值，结果为二维数组，每个子数组对应一层。

**思路：** 标准 BFS：用队列，每轮先记录当前队列长度 `size`，只弹出这 `size` 个节点构成本层，同时把它们的孩子入队。时间 O(n)，空间 O(n)（队列最宽一层可达 n/2）。层序遍历是 Amazon 后端处理树/DAG 结构（如订单依赖、分类目录）的常用基础。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 每轮循环前先固定 `size`，才能把节点正确切分到各层。
- 时间 O(n)，空间 O(n)。
- 改成从右往左入队或结果反转即可得到自底向上/锯齿遍历。

**常见追问：**
- 如何实现锯齿形（Zigzag）层序遍历？
- 若树极度倾斜（链状），BFS 与 DFS 的空间开销差异如何？

**常见坑：**
- 在循环内直接用 `len(q)` 而不先缓存，会把新入队的孩子混进当前层。
- 忘记处理空根节点导致返回错误结构。

**标签：** #algorithm

---

### 16. 二叉树的右视图

**难度：** 中等
**主题：** tree, bfs, dfs
**岗位：** SDE
**级别：** L5

**问题：** 给定一棵二叉树，想象自己站在树的右侧，从上到下返回你能看到的节点值（每层最右边的那个节点）。

**思路：** BFS 每层取最后一个节点即可，时间 O(n)、空间 O(n)。也可用 DFS，按「根 → 右 → 左」顺序遍历，并用当前深度是否等于结果长度来判断该深度是否第一次被访问——第一次到达的即该层最右节点，空间 O(h)。这里给出简洁的 DFS 解法。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 先递归右子树，保证每个深度第一次被访问的是最右节点。
- `depth == len(res)` 是判断某深度首次访问的经典技巧。
- 时间 O(n)，DFS 空间 O(h)。

**常见追问：**
- 如何求左视图？把递归顺序改成先左后右即可。
- 用 BFS 如何实现，两种方案空间复杂度差异？

**常见坑：**
- 误以为右视图就是「所有右孩子」；当右子树缺失时左子树节点也可能可见。
- DFS 时先递归左子树会得到错误的首访节点。

**标签：** #algorithm

---

### 17. 二叉树中的最大路径和

**难度：** 困难
**主题：** tree, dfs, recursion
**岗位：** SDE
**级别：** L5-L6

**问题：** 路径定义为从任意节点出发、沿父子边到达任意节点的序列，路径至少含一个节点且不必经过根。求所有路径中节点值之和的最大值（节点值可为负）。

**思路：** 后序 DFS。对每个节点，计算它向下能提供的「单边最大贡献」= `node.val + max(0, 左贡献, 右贡献)`（负贡献剪成 0）。同时用「以当前节点为最高点、左右都取正贡献」的路径和 `node.val + max(0,左) + max(0,右)` 去更新全局答案。时间 O(n)，空间 O(h)。这类树上 DP 常出现在 Amazon 的高阶算法轮。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 区分「返回给父节点的单边贡献」与「以当前节点拐点更新的全局答案」。
- 负贡献用 `max(0, ...)` 剪掉，避免拖累路径。
- 全局答案初始化为负无穷，兼容全负值的树。

**常见追问：**
- 如何在求最大和的同时还原出这条路径本身？
- 若限制路径必须经过根节点，解法如何简化？

**常见坑：**
- 把返回值也算成「左+右」，导致返回给父节点的贡献不再是合法单边路径。
- 用 0 初始化全局最优，全负值树会得到错误的 0。

**标签：** #algorithm

---

### 18. 二叉搜索树中第 K 小的元素

**难度：** 中等
**主题：** tree, bst, dfs, inorder
**岗位：** SDE
**级别：** L5

**问题：** 给定一棵二叉搜索树（BST）的根节点和整数 `k`，返回树中所有节点值里第 `k` 小的值（`k` 从 1 计）。

**思路：** BST 的中序遍历是递增序列，因此第 `k` 个访问到的节点即答案。用迭代式中序遍历（显式栈）在数到第 `k` 个时即可提前返回，时间 O(h + k)，空间 O(h)。相比一次遍历全部再取，提前终止更适合 `k` 较小的场景。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 利用 BST 中序递增的性质，无需排序。
- 迭代中序可在数到第 k 个时提前退出，时间 O(h + k)。
- 空间 O(h)，即栈深不超过树高。

**常见追问：**
- 若树会频繁插入/删除并多次查询第 k 小，如何优化（在节点维护子树规模）？
- 如何改成求第 k 大？

**常见坑：**
- 忘记先一路向左压栈，导致中序顺序错误。
- 递减 `k` 的时机放在弹栈前后不当，产生 off-by-one。

**标签：** #algorithm

---

## 图

### 19. 岛屿数量

**难度：** 中等
**主题：** graph, dfs, bfs, matrix
**岗位：** SWE
**级别：** L4

**问题：** 给定由 '1'（陆地）和 '0'（水）组成的 2D 网格，统计岛屿数量。

**思路：** 遍历每个格子；遇到未访问的 '1' 就 DFS 染色整座岛屿，计数加一。原地标记已访问。时间和空间（栈）O(m*n)。亚马逊常见追问："如果网格大到必须分布在多台机器上呢？"→ 讨论按行分区 + 通过并查集合并边界。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- DFS 时把格子翻成 "0" 避免重访，不需额外集合。
- 时间 O(m*n)；最坏（一整片大岛）递归栈 O(m*n)。
- 用队列 BFS 可避免大网格上递归过深。

**常见追问：**
- 换成 BFS——什么场景下递归栈会爆？队列需要多大？
- 返回最大岛屿的面积，而不只是数量。
- 流式网格：行逐行到达，如何增量统计？
- 分布式按行分片，跨分片用并查集合并边界。
- 变体：找被水完全包围的岛屿（没有边界格）。

**常见坑：**
- 递归入口不先做边界检查，栈会被非法下标攞爆。
- 在原数组上 mutate，但调用方还要用原数据——必须先复制。

**标签：** #algorithm

---

### 20. 省份数量

**难度：** 中等
**主题：** graph, union-find, dfs
**岗位：** SDE
**级别：** L4

**问题：** 给定 `n x n` 邻接矩阵 `isConnected[i][j] = 1` 表示城市 `i` 和 `j` 直接相连，返回省份数量（连通分量数）。

**思路：** 要么 DFS/BFS 标记已访问节点（O(n^2)），要么用并查集 + 路径压缩 + 按秩合并（近似 O(n^2 alpha(n))）。处理完所有边后，唯一根的数量即分量数。便于扩展到动态连通性追问。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 并查集 + 路径压缩接近 O(1)/操作。
- 矩阵对称，只需遍历上三角。
- 时间 O(n^2 * alpha(n))，空间 O(n)。

**标签：** #algorithm

---

### 21. 课程表

**难度：** 中等
**主题：** graph, topological-sort, dfs, bfs
**岗位：** SDE
**级别：** L4

**问题：** 给定 `numCourses` 和 `[a, b]` 先修课对列表（b 必须先于 a 修），判断能否修完所有课。

**思路：** 有向图环检测。Kahn 算法：计算入度，从入度 0 的节点 BFS，统计已处理节点数；若 `< numCourses`，存在环。备选：DFS + 三色标记（白/灰/黑）。O(V+E)。追问《课程表 II》要求返回实际顺序。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- Kahn BFS 天然产生拓扑序。
- 若任意节点入度仍 > 0，则存在环。
- 时间和空间均为 O(V + E)。

**标签：** #algorithm

---

### 22. 单词接龙 II

**难度：** 困难
**主题：** bfs, graph, backtracking, strings
**岗位：** Senior SDE
**级别：** L5-L6

**问题：** 给定 `beginWord`、`endWord` 和单词列表，返回所有从 `beginWord` 到 `endWord` 的最短变换序列，每次只改一个字母，每个中间词必须在列表中。

**思路：** 两阶段。阶段 1：逐层 BFS，构建父指针 DAG（仅保留第 i 层到第 i+1 层的边）。阶段 2：从 `endWord` 沿父指针 DFS 回溯，枚举所有最短路径。生成邻居用通配桶（`h*t`），每次邻居查找 O(L)。坑：必须在整层处理完后才从前沿中移除单词。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 只在整层处理完后才从词集中移除该层。
- BFS 给出最短长度；DFS 沿父指针重建所有路径。
- 最坏路径数指数级，但实际通常可行。

**标签：** #algorithm

---

### 23. 网络中的关键连接

**难度：** 困难
**主题：** graph, dfs, tarjan, bridges
**岗位：** Senior SDE
**级别：** L5-L6

**问题：** 给定 `n` 台服务器和双向 `connections`，返回所有关键连接（桥），即删除后会导致某些服务器断开的边。

**思路：** Tarjan 桥查找 DFS。跟踪 `disc[u]`（发现时间）和 `low[u]`（子树可达的最小 disc）。边 `(u, v)` 是桥当且仅当 `low[v] > disc[u]`。O(V+E)。坑：跳过直接父边（不是所有 disc 更小的邻居）。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- `low[v] > disc[u]` 说明没有回边可以越过 (u, v)。
- 只跳过直接父节点，而非所有更早的邻居。
- 时间 O(V + E)；递归深度等于 DFS 树深度。

**标签：** #algorithm

---

### 24. 迷宫 II

**难度：** 中等
**主题：** bfs, dijkstra, matrix
**岗位：** SDE
**级别：** L4-L5

**问题：** 一个球在迷宫中滚动直到撞墙才能改变方向。给定起点和终点，返回最短距离（走过格子数）或 -1。

**思路：** Dijkstra + 小顶堆 `(dist, r, c)`。从每个格子模拟向 4 个方向滚动直到墙；这就是一条边。松弛邻居。O(m*n * max(m,n) * log)。BFS 不行，因为边权不等。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 每条"边"是一次滚到墙的过程，代价不一。
- 需要 Dijkstra；BFS 因边权不等而失效。
- 用 `d > dist[r][c]` 跳过过期堆项。

**标签：** #algorithm

---

### 25. 概率最大的路径

**难度：** 中等
**主题：** graph, dijkstra, heap
**岗位：** SDE
**级别：** L4-L5

**问题：** 给定无向带权图，权值为成功概率，返回 `start` 到 `end` 的最大概率路径。

**思路：** 改造的 Dijkstra + 大顶堆（仅有小顶堆的语言取负）。概率相乘（不是相加）。跳过堆中的过期项。O((V+E) log V)。注意：对概率取 `-log p` 可转化为标准最短路径，避免长路径下溢。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 沿路径相乘概率；用按概率的大顶堆。
- Python 通过取负在小顶堆上模拟大顶堆。
- `p < best[u]` 时跳过过期项；时间 O((V + E) log V)。

**标签：** #algorithm

---

### 26. 岛屿数量 II

**难度：** 困难
**主题：** union-find, graph
**岗位：** Senior SDE
**级别：** L5-L6

**问题：** 给定 `m x n` 初始全水的网格，处理一系列 `addLand(r, c)` 操作。每次操作后返回当前岛屿数。

**思路：** 并查集 + 路径压缩 + 按秩合并。每次添加：count++；与 4 个陆地邻居 union，每次成功合并 count--。k 次操作 O(k * alpha(m*n))。把 (r,c) 编码为 `r*n + c`。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 新增陆地自成一岛，count + 1。
- 每次成功 union 邻居，count - 1。
- 单步均摊 O(alpha(m*n))。

**标签：** #algorithm

---

### 27. 优化村庄供水分配

**难度：** 困难
**主题：** graph, mst, union-find
**岗位：** Senior SDE
**级别：** L5-L6

**问题：** `n` 户人家；要么在第 `i` 户打井（成本 `wells[i]`），要么用给定成本铺管道连接两户。求让所有家通水的最小总成本。

**思路：** 加一个虚拟节点 0，到每户 `i` 的边权为 `wells[i]`。问题转化为 `n+1` 节点上的最小生成树。Kruskal + 并查集对排序后的边处理。O((E + n) log(E + n))。值得记住的优雅归约。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 虚拟节点 0 把"打井"变成"到 0 的边"——纯 MST。
- Kruskal + 并查集：O((E + n) log(E + n))。
- 每户最终通过管道或井边连通。

**标签：** #algorithm

---

### 28. 克隆图

**难度：** 中等
**主题：** graph, dfs, bfs, hash-table
**岗位：** SWE
**级别：** L5

**问题：** 给定一个连通无向图的某个节点引用，返回该图的深拷贝。每个节点含一个 `val` 和邻居列表 `neighbors`。

**思路：** 用哈希表映射「原节点 -> 新节点」，DFS 或 BFS 遍历。访问节点时先建其克隆并入表，再递归克隆每个邻居并接上；表可去重避免环导致无限递归。时间 O(V+E)，空间 O(V)。在 Amazon 这类图复制常用于服务依赖拓扑或订单履约网络的快照。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 先入表再递归邻居，才能正确处理环。
- 哈希表键用原节点引用，保证同一节点只克隆一次。
- DFS/BFS 均可，复杂度都是 O(V+E)。

**常见追问：**
- 若节点 `val` 不唯一，能否用 `val` 作哈希键？（不能，必须用引用/身份）
- 改用 BFS 迭代实现如何避免深图爆栈？

**常见坑：**
- 忘记在克隆前就把映射入表，导致环上无限递归。
- 对空图（node 为 null）未特判。

**标签：** #algorithm

---

### 29. 火星词典

**难度：** 困难
**主题：** graph, topological-sort, bfs
**岗位：** SWE
**级别：** L5-L6

**问题：** 给定一个按某种未知字母顺序排序的外星语单词列表 `words`，推断出这套字母表的字典序。若顺序非法返回空串，若存在多个合法顺序返回其中任意一个。

**思路：** 从相邻单词对逐字符比较，第一个不同字符 `a != b` 给出一条有向边 `a -> b`。对所有出现的字符建图后做 Kahn 拓扑排序；若无法排完所有字符说明有环，返回空串。特别注意「前缀在后」的非法情形（如 `abc` 排在 `ab` 前）。时间 O(总字符数)，空间 O(1) 字符集常数级。Amazon 排序/规则推断类题常考此类拓扑建模。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 只从相邻单词对的第一个不同字符建一条边。
- 拓扑排序结果长度不等于字符总数说明有环，返回空串。
- 长单词是短单词前缀且排在前面属非法，需单独判断。

**常见追问：**
- 如何检测答案是否唯一？（队列中任一时刻元素数 > 1 则不唯一）
- 若要求输出所有合法顺序如何做？（回溯枚举拓扑序）

**常见坑：**
- 忘记处理 `["abc", "ab"]` 这种非法前缀情形。
- 重复加同一条边导致入度被多计。

**标签：** #algorithm

---

### 30. K 站中转内最便宜的航班

**难度：** 中等
**主题：** graph, shortest-path, bellman-ford, bfs
**岗位：** SWE
**级别：** L5

**问题：** 有 `n` 个城市和一组航班 `flights[i] = [from, to, price]`。求从 `src` 到 `dst` 至多经过 `k` 个中转站的最便宜价格；不存在则返回 -1。

**思路：** 带跳数限制的最短路，用 Bellman-Ford 松弛 `k+1` 轮。每轮基于上一轮的距离快照更新，保证第 i 轮得到的是「至多用 i 条边」的最短距离，从而恰好限制中转数。时间 O(k * E)，空间 O(n)。这类「限制跳数的最优路径」直接对应 Amazon 物流/配送在换手次数约束下的成本优化。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 恰好松弛 k+1 轮对应「至多 k 个中转（k+1 条边）」。
- 每轮必须基于上一轮快照 `prev`，否则一轮内可能连用多条边、跳数失控。
- 复杂度 O(k * E)，无需堆。

**常见追问：**
- 用 Dijkstra + 状态 (城市, 已用跳数) 如何实现？各有何取舍？
- 若边权可能为负如何处理？（Bellman-Ford 天然支持，但需注意负环）

**常见坑：**
- 不用快照直接在原数组上松弛，导致一轮内传播超过一条边。
- Java 中未判 `prev[u] != INF` 就相加会整型溢出。

**标签：** #algorithm

---

## 堆 / 优先队列

### 31. 前 K 个高频元素

**难度：** 中等
**主题：** hashmap, heap, bucket-sort
**岗位：** SWE
**级别：** L4

**问题：** 给定非空整数数组，返回出现频率最高的 k 个元素。

**思路：** 哈希表计频，然后两种思路：(a) 按频率维护大小为 k 的小顶堆 → O(n log k)，或 (b) 按频率桶排序（buckets[freq] = list）→ O(n)。亚马逊常追问"如果是数据流呢？"→ Count-Min Sketch + 堆。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 桶排序利用 `freq <= n`，总体 O(n)。
- 堆方案 O(n log k)，当 k 远小于 n 时更简洁。
- 从高频桶向低频桶遍历，累计 k 个即可。

**常见追问：**
- 流式 Top-K 用 Count-Min Sketch + 小顶堆；用准确度换内存。
- 数据集放不下内存——外部排序 或 MapReduce 按哈希分区。
- 频率相同时如何定义确定性顺序（插入顺序、值等）。
- k 每次查询不同——维持有序桶结构，快速响应任意 k。

**常见坑：**
- 只要前 k 却把所有元素都排序（O(n log n)）。
- 分配 n+1 个桶时 n 可能极大但 distinct 元素很少，浪费内存。

**标签：** #algorithm

---

### 32. 接雨水 II

**难度：** 困难
**主题：** heap, bfs, matrix
**岗位：** Senior SDE
**级别：** L5-L6

**问题：** 给定一个 `m x n` 整数矩阵表示 2D 地图中每个单元格的高度，计算能接多少雨水。

**思路：** 用所有边界格子初始化小顶堆。弹出最低格，访问其邻居；邻居处接水量 = `max(0, 当前高度 - 邻居高度)`；将邻居以 `max(当前, 邻居)` 入堆。时间 O(m*n log(m*n))。关键洞察：任意格子的水位被其周围最低的"墙"约束，按从低到高的顺序处理。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 从最低边界向内扩展，每格的约束墙已知。
- 入堆时用 `max(当前墙, 邻居)`，模拟灌水后被"垫高"。
- 时间 O(m*n log(m*n))；TS 生产环境应换真正的堆。

**标签：** #algorithm

---

### 33. 高尔夫赛事砍树

**难度：** 困难
**主题：** bfs, heap, matrix
**岗位：** Senior SDE
**级别：** L5-L6

**问题：** 给定一个森林网格，每个正值是树的高度，按高度升序砍掉所有树。从 `(0,0)` 出发，返回砍完所有树的最少步数，若有树不可达返回 -1。

**思路：** 按高度排序树。对每对相邻树跑网格 BFS 求最短路径。累加距离。若任何 BFS 失败返回 -1。O(T * m*n)，T 为树数。A* + Manhattan 启发可加速，但 BFS 已够用。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 按高度升序排序后依次访问。
- BFS 给出相邻两棵树之间的单位代价最短路径。
- 总复杂度 O(T * m * n)；访问集用 `r*n + c` 编码以加速。

**标签：** #algorithm

---

### 34. 最接近原点的 K 个点

**难度：** 中等
**主题：** heap, quickselect, sorting
**岗位：** SDE
**级别：** L4

**问题：** 给定平面上一组点，返回距原点最近的 `k` 个。

**思路：** 大小为 k 的大顶堆按平方距离——push，size > k 时 pop。O(n log k)。更优：Quickselect 按中位数划分——平均 O(n)，最坏 O(n^2)。避免开方；比较平方距离即可。亚马逊经典"最近配送区域"题面。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 比较平方距离，避免开方。
- 大小为 k 的堆 O(n log k)；Quickselect 均摊 O(n)。
- Python 用取负在小顶堆上模拟大顶堆。

**标签：** #algorithm

---

### 35. 会议室 II

**难度：** 中等
**主题：** heap, intervals, sorting
**岗位：** SDE
**级别：** L4

**问题：** 给定会议时间区间 `[start, end)` 数组，返回所需最少会议室数。

**思路：** 按 start 排序。结束时间小顶堆。对每个会议，若 `heap.top() <= start` 则 pop（房间释放）。将当前 end 入堆。堆大小=当前活跃房间数；答案=最大堆大小。O(n log n)。备选：按时间扫描 +1/-1 事件。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 按开始时间排序，依次处理会议。
- 堆顶为最早结束的会议室，可复用。
- 最终堆大小=最大同时使用房间数；O(n log n)。

**标签：** #algorithm

---

### 36. 数据流的中位数

**难度：** 困难
**主题：** heap, design, streaming
**岗位：** Senior SDE
**级别：** L5

**问题：** 设计一个类，支持 `addNum(int)` 和 `findMedian()`，返回当前所有数的中位数。

**思路：** 两个堆：大顶堆 `lo`（较小一半）和小顶堆 `hi`（较大一半）。维持 `|lo| - |hi| in {0, 1}`。`addNum`：先入 `lo`，把 `lo.top()` 移到 `hi`，再平衡。`findMedian`：若大小相等取两个堆顶平均，否则取 `lo.top()`。添加 O(log n)，求中位 O(1)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 不变式：`|lo| - |hi| in {0, 1}` 且 `lo` 顶 <= `hi` 顶。
- 插入 O(log n)；中位数 O(1) 查找。
- 先入 lo 再把顶移到 hi，自动维持顺序。

**标签：** #algorithm

---

### 37. 连接绳子的最小成本

**难度：** 中等
**主题：** heap, greedy
**岗位：** SDE
**级别：** L4

**问题：** 给定绳长数组，连接两根绳子的成本为它们之和。求把所有绳子连成一根的最小总成本。

**思路：** 小顶堆。反复弹出两个最小，把它们的和压回堆，累加成本。等价于 Huffman 树构造。O(n log n)。贪心证明：先合并最小推迟了大成本被反复乘的次数。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 贪心 Huffman 风格：先合并两根最短。
- 合并的和会进入后续运算，延后大代价。
- 用真正的堆 O(n log n)；TS 生产环境建议用堆库。

**标签：** #algorithm

---

### 38. 重构字符串

**难度：** 中等
**主题：** heap, greedy, strings
**岗位：** SDE
**级别：** L4

**问题：** 给定字符串，重排使相邻字符不同。若不可能返回 ""。

**思路：** 统计频率；若最大频率 > (n+1)/2，不可能。按频率大顶堆。每步弹出最高两个，追加两字符，频率减一，非零再压回。O(n log k)，k 为唯一字符数。备选：先把最高频字符放偶数位，再填其余。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 最高频字符 > `(n+1)/2` 则不可行。
- 每步弹出两个最高频字符交替输出，保证彼此不相邻。
- 时间 O(n log k)，k 为字符种类数。

**标签：** #algorithm

---

### 39. 数组中的第 K 个最大元素

**难度：** 中等
**主题：** heap, quickselect, sorting
**岗位：** SWE
**级别：** L5

**问题：** 给定整数数组 `nums` 和整数 `k`，返回数组中第 `k` 个最大的元素（按值排名，而非第 k 个不同的元素）。

**思路：** 维护一个大小为 `k` 的小顶堆：逐个入堆，当大小超过 `k` 时弹出堆顶。堆顶即第 k 大元素。时间 O(n log k)，空间 O(k)——适合流式或超大 `n` 场景，如商品热销榜排序。Quickselect 围绕枢轴划分，平均 O(n)，最坏 O(n^2)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 大小为 k 的小顶堆恰好保留见过的 k 个最大元素，堆顶即答案。
- 当 k 较小时，O(n log k) 优于整体排序的 O(n log n)。
- Quickselect 平均 O(n)，但在面试中不易一次写对。

**常见追问：**
- 若数据是无界流式怎么办？（大小为 k 的堆天然支持在线处理。）
- 实现 Quickselect 版本并分析其最坏情况。

**常见坑：**
- 用大小为 n 的大顶堆既浪费内存又是 O(n log n)，大小为 k 的小顶堆更优。
- 混淆按值第 k 大与第 k 个不同值。

**标签：** #algorithm

---

### 40. 前 K 个高频单词

**难度：** 中等
**主题：** heap, hash-table, sorting
**岗位：** SWE
**级别：** L5

**问题：** 给定单词列表 `words` 和整数 `k`，返回出现频率前 `k` 高的单词，按频率降序排列；频率相同时按字典序（字母顺序）排列。

**思路：** 用哈希表统计词频，再按复合键 `(-freq, word)` 选出前 k 个。大小为 k 的堆保留最优 k 个，时间 O(n log k)。Amazon 常见场景：热门搜索词或趋势查询。正确的平局处理是关键。

**Python：**
```python
import heapq
from collections import Counter

def topKFrequent(words: list[str], k: int) -> list[str]:
    count = Counter(words)
    return heapq.nsmallest(k, count, key=lambda w: (-count[w], w))
```

**TypeScript：**
```typescript
function topKFrequent(words: string[], k: number): string[] {
  const count = new Map<string, number>();
  for (const w of words) count.set(w, (count.get(w) ?? 0) + 1);
  return [...count.keys()]
    .sort((a, b) => count.get(b)! - count.get(a)! || a.localeCompare(b))
    .slice(0, k);
}
```

**Java：**
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

**要点：**
- 排序键 `(-freq, word)` 用一次比较同时表达频率降序与字母升序。
- 大小为 k 的堆为 O(n log k)；整体排序 O(n log n) 但更易推理。
- 用小顶堆时需反转平局方向（字典序更大者置顶），弹出后才保留正确的 k 个。

**常见追问：**
- 若 k 等于不同单词的数量怎么办？（此时整体排序不可避免。）
- 面对数十亿条查询日志，如何跨机器分片处理？

**常见坑：**
- 用大小为 k 的小顶堆时把平局比较方向搞反。
- 忘记反转堆输出，导致得到升序而非降序结果。

**标签：** #algorithm

---

## 栈 / 队列

### 41. 滑动窗口最大值

**难度：** 困难
**主题：** deque, sliding-window
**岗位：** Senior SDE
**级别：** L5

**问题：** 给定数组和窗口大小 k，返回每个滑动窗口的最大值。

**思路：** 单调双端队列存索引，队首始终为当前窗口最大。每个 i：当 `nums[尾] <= nums[i]` 时 pop_back（它们永不再是最大），push i；若队首出窗就 pop_front。当 `i >= k-1` 时输出队首。O(n)。

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
        if dq[0] <= i - k:
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
    if (dq[0] <= i - k) dq.shift();
    if (i >= k - 1) out.push(nums[dq[0]]);
  }
  return out;
}
```

**Java：**
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

**要点：**
- 单调递减双端队列存索引，队首即当前窗口最大。
- 每个索引最多入队、出队各一次——均摊 O(n)。
- 队首超出窗口范围时弹出。

**标签：** #algorithm

---

### 42. 最小栈

**难度：** 中等
**主题：** stack, design
**岗位：** SDE
**级别：** L4

**问题：** 设计一个栈，`push`、`pop`、`top`、`getMin` 都是 O(1)。

**思路：** 辅助栈记录当前最小值，与主栈同步推入（推 `min(新值, 上一最小)`）。备选：单栈中存 `(val, current_min)` 对。技巧变体：只在 `val <= current_min` 时推入最小栈；相等时才 pop。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 并行最小栈记录每层深度下的最小值。
- 所有操作 O(1)。
- 仅推入严格递减的优化变体可省空间。

**标签：** #algorithm

---

### 43. 设计点击计数器

**难度：** 中等
**主题：** design, queue, hashmap
**岗位：** SDE
**级别：** L4

**问题：** 设计一个点击计数器，记录点击并返回过去 5 分钟内的点击数。点击按时间顺序到达。

**思路：** 时间戳队列；`getHits(t)` 时弹出所有 `ts <= t - 300` 的项，返回队列大小。内存随点击率增长。为可扩展，用两个长度 300 的数组：`times[i]` 和 `hits[i]`，按 `t % 300` 索引；过期时间戳时重置桶。摊还 O(1)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 每秒一桶，过期桶在下次命中时自动重置。
- `hit` O(1)，`getHits` O(300)，与点击率无关。
- 队列方案简单但在突发流量下无界。

**标签：** #algorithm

---

### 44. 有效的括号

**难度：** 简单
**主题：** stack, string
**岗位：** SWE
**级别：** L4

**问题：** 给定仅含 `()[]{}` 的字符串 `s`，判断其是否有效——每个左括号都由相同类型的右括号按正确顺序闭合。

**思路：** 遇到左括号就把其对应的右括号压栈；遇到右括号时必须与栈顶匹配。当且仅当每个右括号都匹配且最终栈为空时有效。时间 O(n)，空间 O(n)。这是校验嵌套结构（如 JSON/配置解析）的经典入门题。

**Python：**
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

**要点：**
- 栈的 LIFO 特性天然契合嵌套括号。
- 结尾既要检查是否失配，也要检查栈是否还有残留。
- 压入「期望的右括号」使比较简化为一次相等判断。

**常见追问：**
- 支持通配符 `*`，可代表 `(`、`)` 或空（LeetCode 678）。
- 返回第一个非法字符的下标而非布尔值。

**常见坑：**
- 右括号先到时从空栈弹出——需先做空栈判断。
- 栈中仍有未闭合的左括号时却返回 `true`。

**标签：** #algorithm

---

### 45. 每日温度

**难度：** 中等
**主题：** stack, monotonic-stack, array
**岗位：** SWE
**级别：** L5

**问题：** 给定每日温度数组 `temperatures`，返回数组 `answer`，其中 `answer[i]` 表示在第 `i` 天之后需要等待多少天才会出现更高的温度；若不存在则为 `0`。

**思路：** 维护一个下标的单调递减栈。对每一天，当当前温度高于栈顶下标处的温度时，弹出该下标并记录天数差。每个下标只入栈、出栈一次——时间 O(n)，空间 O(n)。这种「下一个更大元素」模式可用于诸如补货时长等指标计算。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 栈中存下标而非数值，才能直接算出天数差。
- 单调递减栈保证每个元素只入栈/出栈一次——摊还 O(n)。
- 未被解决的下标保留默认值 `0`。

**常见追问：**
- 返回真正更高的温度值，而非天数。
- 处理逐个到达的流式温度数据。

**常见坑：**
- 存数值而非下标，导致无法计算 `i - j`。
- 用 `<=` 而非 `<`，会错误处理连续相等的温度。

**标签：** #algorithm

---

## 哈希表

### 46. 两数之和

**难度：** 简单
**主题：** arrays, hashmap
**岗位：** SWE
**级别：** L4

**问题：** 给定整数数组和目标值，返回相加等于目标值的两个数的下标。假设恰好有一个解。

**思路：** 一次遍历 + 哈希表 `value -> index`。对每个 `num`，检查 `target - num` 是否在 map；否则插入。O(n) 时间，O(n) 空间。亚马逊 OA 常驻题。

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

**要点：**
- 哈希查找把内层搜索从 O(n) 降到 O(1)。
- 先查再插，避免同一下标被复用。
- O(n) 时间，O(n) 额外空间。

**常见追问：**
- 输入已排序——双指针 O(1) 额外空间。
- 返回所有去重的解（类 3Sum 去重）。
- 流式数据：设计 `add(num)` + `find(target)` 连续查询接口。
- 多个解时要求下标和最小的一对。

**常见坑：**
- 先插入再查找，会让 `nums[i] + nums[i] == target` 复用同一下标。
- 在“恰好一个解”的提示下还跑暴力 O(n²)，性能不过关。

**标签：** #algorithm

---

### 47. 最常见单词

**难度：** 简单
**主题：** strings, hashmap, parsing
**岗位：** SDE
**级别：** L3-L4

**问题：** 给定一段话和禁用词列表，返回出现频率最高的非禁用词。词不区分大小写；需去除标点。

**思路：** 归一化（小写、按非字母分隔），用哈希表计频并排除禁用集，返回最大。O(n)。坑在标点正则 / 手工字符过滤——多数 bug 出在这。

**Python：**
```python
import re
from collections import Counter

def most_common_word(paragraph: str, banned: list[str]) -> str:
    banned_set = set(banned)
    words = re.findall(r"[a-zA-Z]+", paragraph.lower())
    cnt = Counter(w for w in words if w not in banned_set)
    return cnt.most_common(1)[0][0]
```

**TypeScript：**
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

**Java：**
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

**要点：**
- 先 lower-case 再切分，禁用比较自动忽略大小写。
- 单一正则一次处理标点、数字、空白。
- O(n)，n 为段落长度。

**标签：** #algorithm

---

### 48. 分析用户网站访问模式

**难度：** 中等
**主题：** hashmap, sorting, strings
**岗位：** SDE
**级别：** L4

**问题：** 给定用户、时间戳、网站三个平行数组，找出被最多用户访问过的 3 元序列（有序三元组）。字典序作为 tie-break。

**思路：** 按用户分组，每用户按时间戳排序。每用户枚举 3 个不同位置的所有组合（用集合按用户去重）。跨用户对序列计数。返回最大并按字典序破平。O(sum nCk * U)。逐用户去重要小心——否则一个用户能压倒结果。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 每用户去重，避免重度访问者一家独大。
- 枚举有序三元组前先按时间戳排序。
- 按拼接字符串的字典序破平。

**标签：** #algorithm

---

### 49. 字母异位词分组

**难度：** 中等
**主题：** hashmap, strings, sorting
**岗位：** SDE
**级别：** L4

**问题：** 给定字符串数组，将字母异位词分组。

**思路：** 哈希表从规范键到列表。键的方案：(a) 排序后的字符串——O(n * k log k)；(b) 长度 26 的字符计数元组 `[a-z]`——O(n * k)。长词时后者更快。简单题，常作热身。

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

**要点：**
- 排序后的字符串是最简单的规范键。
- 26 维字符计数键也可，长串更快。
- 时间 O(n * k log k)，k 为平均词长。

**标签：** #algorithm

---

### 50. 有效的数独

**难度：** 中等
**主题：** hash-table, array, matrix
**岗位：** SWE
**级别：** L5

**问题：** 判断一个 9x9 的数独棋盘是否有效（只需按已填数字校验），空格用 `.` 表示，无需保证可解。

**思路：** 遍历一次，对每个已填数字检查它所在行、列、3x3 宫是否重复。用三组集合（9 行、9 列、9 宫）记录出现过的数字，宫下标用 `(r // 3) * 3 + c // 3` 计算。时间 O(81) = O(1)，空间 O(1)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 只校验行、列、宫三个约束，任一重复即无效。
- 宫下标公式 `(r // 3) * 3 + c // 3` 把 9 个宫映射到 0..8。
- 盘面固定 9x9，时间与空间都是 O(1)。

**常见追问：**
- 如何进一步求解数独（回溯 + 剪枝）？
- 若盘面为 NxN 通用大小该如何泛化？

**常见坑：**
- 忘记跳过 `.`，把空格当数字校验。
- 宫下标算错（写成 `r // 3 + c // 3`），导致跨宫误判。

**标签：** #algorithm

---

### 51. 最长连续序列

**难度：** 中等
**主题：** hash-table, union-find, array
**岗位：** SWE
**级别：** L5

**问题：** 给定未排序数组 `nums`，返回最长连续整数序列的长度，要求时间复杂度为 O(n)。

**思路：** 将所有数放入哈希集合。只从没有前驱（`x - 1` 不存在）的数开始计数——那才是一段序列的起点，然后沿 `x+1, x+2, ...` 只要存在就延伸。每个数至多访问两次，尽管有嵌套循环，总体仍为 O(n)。空间 O(n)。

**Python：**
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

**要点：**
- `x - 1 not in set` 判断保证每段序列只被展开一次。
- 内层循环总工作量被 n 界定，因此整体保持 O(n)。
- 哈希集合提供 O(1) 查询，此处优于排序的 O(n log n)。

**常见追问：**
- 同时返回实际序列，而不仅是长度。
- 用并查集求解并比较取舍。

**常见坑：**
- 遍历原始数组（含重复）而非集合，可能退化为 O(n^2)。
- 不做前驱判断就从每个元素开始计数，会破坏 O(n) 复杂度。

**标签：** #algorithm

---

## 二分查找

### 52. 在排序数组中查找元素的第一个和最后一个位置

**难度：** 中等
**主题：** binary-search, array
**岗位：** SWE
**级别：** L5

**问题：** 给定升序数组 `nums` 和目标值 `target`，返回 `[first, last]`——`target` 的起始与结束下标。若不存在返回 `[-1, -1]`。要求时间复杂度 O(log n)。

**思路：** 用两次二分查找边界：左边界（第一个 >= target 的下标）与右边界（第一个 > target 的下标，减一）。若左边界越界或对应值不等于 target，则不存在。时间 O(log n)，空间 O(1)。

**Python：**
```python
import bisect

def searchRange(nums: list[int], target: int) -> list[int]:
    lo = bisect.bisect_left(nums, target)
    if lo == len(nums) or nums[lo] != target:
        return [-1, -1]
    hi = bisect.bisect_right(nums, target) - 1
    return [lo, hi]
```

**TypeScript：**
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

**Java：**
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

**要点：**
- 左边界 = 第一个 >= target 的下标；右边界 = 第一个 > target 的下标。
- 解引用前先用数组长度校验左边界。
- 两次查找均用半开区间 `[lo, hi)` 不变式，避免差一错误。

**常见追问：**
- 统计 target 的出现次数（右边界减左边界）。
- 改造为在 target 缺失时返回插入位置。

**常见坑：**
- 未先检查 `left == nums.length` 就访问 `nums[left]`。
- 两次查找间混用闭区间与半开区间约定。

**标签：** #algorithm

---

### 53. 寻找旋转排序数组中的最小值

**难度：** 中等
**主题：** binary-search, array
**岗位：** SWE
**级别：** L5

**问题：** 一个由不同整数组成的升序数组在未知枢轴处被旋转，请在 O(log n) 时间内找出最小元素。

**思路：** 二分查找，比较 `nums[mid]` 与 `nums[hi]`。若 `nums[mid] > nums[hi]`，最小值在右侧（`lo = mid + 1`）；否则在 `mid` 或左侧（`hi = mid`）。最终收敛到旋转点。时间 O(log n)，空间 O(1)。与 `hi`（而非 `lo`）比较可避免未旋转数组时的歧义。

**Python：**
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

**要点：**
- 与 `nums[hi]`（而非 `nums[lo]`）比较，才能正确处理已排序的情形。
- 循环条件 `lo < hi` 收敛到单一下标，无需额外的命中判断。
- 假设元素各不相同；若有重复，最坏情况会退化到 O(n)。

**常见追问：**
- 处理有重复的情形（LeetCode 154）并解释 O(n) 最坏情况。
- 返回旋转次数（即最小值的下标）。

**常见坑：**
- 与 `nums[lo]` 比较，会错误处理未旋转的数组。
- 使用 `lo <= hi` 或 `hi = mid - 1`，可能跳过真正的最小值。

**标签：** #algorithm

---

### 54. 爱吃香蕉的珂珂

**难度：** 中等
**主题：** binary-search, search-on-answer
**岗位：** SWE
**级别：** L5

**问题：** 给定香蕉堆 `piles` 和 `h` 小时，珂珂以速度 `k`（根/小时）进食（每小时最多吃完一堆）。返回能在 `h` 小时内吃完所有堆的最小整数速度 `k`。

**思路：** 在答案区间 `[1, max(piles)]` 上二分。速度 `k` 所需小时数为 `sum(ceil(p / k))`，关于 `k` 单调非增。找出使总小时数 `<= h` 的最小 `k`。时间 O(n log(最大堆))。这种吞吐/速率调优模式常见于容量预置场景。

**Python：**
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

**要点：**
- 「在答案上二分」：可行性判定关于 `k` 单调。
- 向上取整除法 `(p + k - 1) / k` 计算每堆所需的整小时数。
- 搜索上界为 `max(piles)`，因为更快的速度无益。

**常见追问：**
- 若珂珂能在一小时内跨堆分配时间怎么办？（小时数公式会改变。）
- 推广为「D 天内送达的最小运力」（LeetCode 1011）。

**常见坑：**
- `lo` 从 0 开始会导致小时数函数除零。
- 用 32 位整型累加小时数在大堆时可能溢出；应使用更宽的类型。

**标签：** #algorithm

---

## 动态规划

### 55. 接雨水

**难度：** 困难
**主题：** arrays, two-pointer, dp
**岗位：** SWE
**级别：** L5

**问题：** 给定 `n` 个非负整数表示地形高度，计算能接多少水。

**思路：** 两端双指针。维护 `left_max`、`right_max`。每次移动较短一侧；该位置接水 = `side_max - height[i]`。O(n) 时间，O(1) 空间。备选：预计算 `left_max[]` 和 `right_max[]` 数组——更清晰但 O(n) 空间。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 较短的一侧约束该位置的水位，因此移动较短侧。
- O(n) 时间，O(1) 额外空间。
- 预计算左右最大值数组思路更清晰但需要 O(n)。

**常见追问：**
- 接雨水 II（二维矩阵）——从边界出发的小顶堆。
- 高度以流式到达，能否增量更新答案？
- 负值或浮点高度，不变式有何变化？
- 输出每个位置的水位，而不仅是总量。

**常见坑：**
- 高度相等时移错了指针（移了较高侧），导致重复计数。
- 忽略边界格永远不接水的事实。

**标签：** #algorithm

---

### 56. 最大子数组和（Kadane）

**难度：** 中等
**主题：** dp, arrays
**岗位：** SDE
**级别：** L4

**问题：** 找出连续子数组中和最大的，并返回该和。

**思路：** Kadane：`cur = max(num, cur + num); best = max(best, cur)`。O(n)。变体：返回下标——`cur` 重置时记录 start。也存在 O(n log n) 的分治版，但 Kadane 是标配。

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

**要点：**
- `cur` 表示当前位置结尾的最大子数组和。
- 若延伸不利则重置为当前元素。
- O(n) 时间，O(1) 空间；全负数组也适用。

**标签：** #algorithm

---

### 57. 工作安排的最大利润

**难度：** 困难
**主题：** dp, binary-search, sorting
**岗位：** Senior SDE
**级别：** L5

**问题：** 给定 n 个工作的 `startTime[i]`、`endTime[i]`、`profit[i]`，返回不重叠子集可达到的最大利润。

**思路：** 按 endTime 排序。`dp[i]` = 用前 i 个工作的最大利润。转移：`dp[i] = max(dp[i-1], profit[i] + dp[j])`，j 是使 `endTime[j] <= startTime[i]` 的最大下标（二分查找）。O(n log n)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 按结束时间排序，保证之前的工作结束不晚于当前。
- 二分查找最近的不冲突工作。
- 时间 O(n log n)，空间 O(n)。

**标签：** #algorithm

---

### 58. 零钱兑换

**难度：** 中等
**主题：** dp, arrays, bfs
**岗位：** SWE
**级别：** L5

**问题：** 给定硬币面额 `coins` 和总金额 `amount`，返回凑出该金额所需的最少硬币数；若无法凑出返回 `-1`。

**思路：** 完全背包。`dp[a]` 表示凑出金额 `a` 的最少硬币数。转移：对所有 `c <= a` 取 `dp[a] = min(dp[a - c] + 1)`。初始化 `dp[0] = 0`，其余设为哨兵值 `amount + 1`。时间 O(amount * coins)，空间 O(amount)。任意面额下贪心不成立，必须用 DP——结账找零场景里也是同样的逻辑。

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

**Java：**
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

**要点：**
- 哨兵值 `amount + 1` 稳妥地大于任何真实答案，且不会溢出。
- 自底向上避免递归深度问题；每个金额只依赖更小的金额。
- 贪心（总取最大面额）在如 `[1, 3, 4]` 凑 `6` 时会出错。

**常见追问：**
- 统计凑法总数（零钱兑换 II）——外层遍历硬币。
- 返回具体硬币组合而非数量——为每个金额记录父指针。

**常见坑：**
- 用 `Integer.MAX_VALUE` 作哨兵再 `+ 1` 会溢出；应使用 `amount + 1`。
- 遗漏金额无法凑出时返回 `-1` 的情况。

**标签：** #algorithm

---

### 59. 最长递增子序列

**难度：** 中等
**主题：** dp, binary-search, arrays
**岗位：** SWE
**级别：** L5

**问题：** 给定整数数组 `nums`，返回其最长严格递增子序列的长度。

**思路：** 耐心排序。维护 `tails`，`tails[i]` 表示长度为 `i + 1` 的递增子序列的最小可能末尾。对每个数二分查找第一个 `>= num` 的末尾并替换（若没有则追加）。`tails` 的长度即答案。时间 O(n log n)，空间 O(n)。经典 O(n^2) DP（`dp[i] = 1 + max(dp[j])`，其中 `nums[j] < nums[i]`）也可但更慢——在分析指标/遥测数据的单调趋势时会用到。

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
      if (tails[mid] < x) lo = mid + 1;
      else hi = mid;
    }
    if (lo === tails.length) tails.push(x);
    else tails[lo] = x;
  }
  return tails.length;
}
```

**Java：**
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

**要点：**
- `tails` 始终有序，这正是二分查找成立的前提。
- `bisect_left` / lower-bound 得到严格递增；non-decreasing 用 upper-bound。
- `tails` 本身不是合法子序列，只有其长度有意义。

**常见追问：**
- 还原一个真实的 LIS——在耐心堆旁记录前驱下标。
- 统计最长长度的 LIS 个数——把长度 DP 与计数 DP 结合。

**常见坑：**
- 用 upper-bound（`bisect_right`）得到的是最长非递减子序列，而非严格递增。
- 把 `tails` 当成答案序列——其内容可能不是合法子序列。

**标签：** #algorithm

---

### 60. 编辑距离

**难度：** 困难
**主题：** dp, strings, two-dimensional
**岗位：** SWE
**级别：** L5-L6

**问题：** 给定两个字符串 `word1` 和 `word2`，返回把 `word1` 转换成 `word2` 所需的最少插入、删除、替换操作次数。

**思路：** 二维 DP（Levenshtein）。`dp[i][j]` 表示 `word1[:i]` 与 `word2[:j]` 的编辑距离。字符相同时 `dp[i][j] = dp[i-1][j-1]`；否则 `1 + min(删除 dp[i-1][j], 插入 dp[i][j-1], 替换 dp[i-1][j-1])`。边界：与空串互转的代价等于其长度。时间 O(m*n)，空间 O(m*n)，用滚动数组可降至 O(min(m, n))——商品目录的模糊搜索/拼写纠错会用到。

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

**Java：**
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

**要点：**
- 三个转移恰好对应删除、插入、替换。
- 首行/首列表示与空前缀互转，每个字符一次操作。
- 字符匹配时直接沿用对角线值，不增加代价。

**常见追问：**
- 用两行滚动数组把空间降到 O(min(m, n))。
- 为操作赋不同权重（如替换代价为 2）——推广 `min` 各项。

**常见坑：**
- 字符串下标（`i - 1`）与 DP 下标（`i`）之间的差一错误。
- 主循环前忘记初始化首行和首列。

**标签：** #algorithm

---

### 61. 解码方法

**难度：** 中等
**主题：** dp, strings
**岗位：** SWE
**级别：** L5

**问题：** 一段数字消息按 `'A'..'Z'` 对应 `"1".."26"` 编码。给定数字字符串 `s`，返回解码的方法总数。

**思路：** 一维 DP。`dp[i]` 表示前缀 `s[:i]` 的解码方法数。在位置 `i`，取一位（当 `s[i-1] != '0'` 时有效）贡献 `dp[i-1]`，取两位（当 `s[i-2:i]` 在 `10..26` 时有效）贡献 `dp[i-2]`。边界：`dp[0] = 1`（空串）。时间 O(n)，用两个滚动变量空间 O(1)。核心在于对 0 的谨慎处理——解析序列化订单/追踪载荷时同样需要这种边界纪律。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 开头的 `'0'`（或任何前面不是 1、2 的孤立 `'0'`）会使字符串无法解码。
- 两位数块只有落在闭区间 `10..26` 才有效。
- 每个状态只依赖前两个，故 O(1) 空间足够。

**常见追问：**
- 支持 `'*'` 通配匹配任意数字 `1..9`（解码方法 II）——扩展转移计数。
- 返回具体的解码结果而非数量——改用回溯。

**常见坑：**
- 把 `'0'` 当成合法的单位解码；只有 `1..9` 才能单独解码。
- 漏掉范围判断，导致 `27`、`06` 之类的块被错误计入。

**标签：** #algorithm

---

## 回溯

### 62. 组合总和

**难度：** 中等
**主题：** backtracking, array, recursion
**岗位：** SWE
**级别：** L5

**问题：** 给定一组互不相同的正整数 `candidates` 和目标值 `target`，返回所有和为 `target` 的唯一组合，每个数字可以被无限次重复使用。

**思路：** 经典回溯，用起始下标避免同一组合以不同顺序被重复统计。每一步要么复用当前候选（停在 `i`），要么前进到 `i + 1`。亚马逊常把这种结构用于「从可复用商品类型中凑出目标重量/价值的履约打包」类问题。时间 O(N^(T/M))，M 为最小候选值；空间 O(T/M) 为递归深度。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 递归传入 `i`（而非 `i + 1`）以允许重复使用同一候选。
- 起始下标向前推进可避免 [2,3] 与 [3,2] 这类排列型重复。
- 先排序后可用 `break` 替代 `continue`，候选超过剩余值即可提前终止。

**常见追问：**
- 组合总和 II：候选可重复且每个只能用一次——在同一递归层跳过重复元素。
- 若只需组合数量而非具体组合？改用 DP，复杂度 O(N*target)。

**常见坑：**
- 每次调用都从 0 开始会产生重复/排列型组合。
- 忘记拷贝 `path`（直接存入可变引用）会污染所有已保存结果。

**标签：** #algorithm

---

### 63. 电话号码的字母组合

**难度：** 中等
**主题：** backtracking, string, recursion
**岗位：** SWE
**级别：** L5

**问题：** 给定一个仅含数字 2-9 的字符串，按经典电话键盘映射返回它能表示的所有字母组合，输入为空时返回空列表。

**思路：** 按数字位置回溯；对每个数字展开其映射的每个字母并递归到下一位。这与 Alexa/语音输入类的候选消歧场景直接对应——键盘或音素编码展开成候选词。设每个数字对应 `k` 个字母、共 `n` 位，构建每个字符串的时间为 O(k^n * n)，递归空间 O(n)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 递归深度等于数字位数，分支因子为 3 或 4 个字母。
- 对空输入提前返回，避免产生多余的空字符串。
- 迭代式 BFS 方案在不断增长的前缀集合上追加字母——复杂度相同。

**常见追问：**
- 用字典/字典树剪枝，只保留真实单词（语音搜索）。
- 如何按可能性排序输出？为每个候选附加语言模型分数。

**常见坑：**
- 把空字符串当作合法组合而返回 `[""]`。
- 索引映射数组时的差一错误（数字 0 和 1 没有字母）。

**标签：** #algorithm

---

## 双指针 / 滑动窗口

### 64. 无重复字符的最长子串

**难度：** 中等
**主题：** sliding-window, string, hashmap, two-pointers
**岗位：** SWE
**级别：** L5

**问题：** 给定字符串 `s`，返回其中不含重复字符的最长子串的长度。

**思路：** 用双指针维护滑动窗口，并用哈希表记录每个字符最近出现的下标。当重复字符落在当前窗口内时，把左指针直接跳到它上次出现位置的后一位。这是亚马逊数据管道中流/日志去重窗口的常见基础题。时间 O(n)，空间 O(min(n, 字符集))。

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

**Java：**
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

**要点：**
- 记录最近下标可让 `left` 直接跳跃，而非逐步收缩。
- 判断 `last[ch] >= left` 可忽略已滑出窗口的旧重复。
- 窗口长度始终为 `right - left + 1`。

**常见追问：**
- 返回子串本身而不仅是长度——记录最优窗口的边界。
- 推广到「至多 K 个不同字符」（不同的滑窗不变量）。

**常见坑：**
- 不判断 `last[ch] >= left`，会让 `left` 回退并导致多算。
- 窗口长度计算的差一错误。

**标签：** #algorithm

---

### 65. 三数之和

**难度：** 中等
**主题：** two-pointers, array, sorting
**岗位：** SWE
**级别：** L5

**问题：** 给定整数数组 `nums`，返回所有满足 `a + b + c == 0` 的唯一三元组 `[a, b, c]`，结果集中不能包含重复的三元组。

**思路：** 先排序，再固定下标 `i`，在剩余子数组两端用双指针向中间收拢，寻找和为 `-nums[i]` 的数对；跳过相等元素以避免重复三元组。亚马逊常用它考察「对冲交易/退款相互抵消到零」的对账场景。时间 O(n^2)，除输出外空间 O(1)（排序需 O(n)）。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 排序使双指针扫描成为可能，也让去重变得简单。
- 在固定下标处以及记录一个匹配之后都要跳过重复。
- 当 `nums[i] > 0` 时提前 `break`，因为没有正数三元组能和为零。

**常见追问：**
- 最接近的三数之和：记录和最接近目标的三元组。
- kSum 泛化：递归降维到双指针基本情形。

**常见坑：**
- 在记录首个合法三元组之前就跳过重复，导致漏解。
- 用三元组哈希集合去重而非指针跳过——能用但浪费内存。

**标签：** #algorithm

---

### 66. 最小覆盖子串

**难度：** 困难
**主题：** sliding-window, string, hashmap, two-pointers
**岗位：** SWE
**级别：** L5-L6

**问题：** 给定字符串 `s` 和 `t`，返回 `s` 中包含 `t` 全部字符（含重复次数）的最短子串；若不存在则返回空字符串。

**思路：** 右指针扩张直到满足所有必需字符计数，再从左指针收缩，在保持有效的前提下缩小窗口并记录最优。用 `formed` 计数已完全匹配的必需字符个数，避免每次重扫整张表。亚马逊常用此结构寻找「包含一组必需信号的最紧凑日志/事件窗口」。时间 O(|s| + |t|)，空间 O(字符集)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- `formed == required` 表示每个不同的必需字符都已满足其全部计数。
- 仅在窗口仍有效时从左收缩，从而捕获最小窗口。
- 在 Java 中按值（而非引用）比较计数对装箱整数很关键。

**常见追问：**
- 返回所有最小长度窗口，而不仅是第一个。
- 若 `t` 可能含 ASCII 范围外的字符会有何变化？改用通用映射。

**常见坑：**
- 在 Java 中对 `Integer` 对象用 `==` 而非 `.intValue()`/`.equals()`。
- 每次计数变化都更新 `formed`，而不是仅在跨过阈值时更新。

**标签：** #algorithm

---

## 矩阵

### 67. 滑动谜题

**难度：** 困难
**主题：** bfs, matrix, state-search
**岗位：** Senior SDE
**级别：** L5-L6

**问题：** 2x3 棋盘有 1-5 五块拼图和一个空（0）。每步把 0 与相邻拼图交换。给定初始棋盘，返回到达 `[[1,2,3],[4,5,0]]` 的最少步数或 -1。

**思路：** 对棋盘状态做 BFS。状态编码为 6 字符串。预计算每个 0 位置的邻居位置。用字符串集做已访问。O(6! * 分支)。追问更大棋盘时用 Manhattan 距离启发的 A*。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 把 2x3 棋盘编码为 6 字符字符串便于哈希。
- 预计算每个位置的邻居，避免运行时计算行列。
- 总状态空间 6!；BFS 给出最少步数。

**标签：** #algorithm

---

### 68. 设计井字棋

**难度：** 中等
**主题：** design, ood, matrix
**岗位：** SDE
**级别：** L4

**问题：** 在 `n x n` 棋盘上设计井字棋，支持 `move(row, col, player)` 返回胜方（无则 0）。

**思路：** 按玩家维护计数：`rows[player][i]`、`cols[player][j]`、`diag[player]`、`anti_diag[player]`。每步增对应计数；任一达到 n 即获胜。每步 O(1)，O(n) 空间。优于朴素 O(n) 扫描整盘。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 每个玩家的计数器实现 O(1) move 和 O(1) 胜判。
- 主对角线 `row == col`；副对角线 `row + col == n - 1`。
- 空间 O(n)，远胜每次扫盘。

**标签：** #algorithm

---

### 69. 腐烂的橘子

**难度：** 中等
**主题：** bfs, matrix
**岗位：** SDE
**级别：** L4

**问题：** 网格 0（空）、1（新鲜橘子）、2（腐烂）。每分钟，腐烂会感染 4 邻接的新鲜橘子。返回直到没有新鲜橘子的最少分钟数，或 -1。

**思路：** 多源 BFS。把所有初始腐烂橘子入队。按层 BFS；每层 = 1 分钟。跟踪新鲜数；感染时递减。结束时若 fresh > 0 返回 -1。O(m*n)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 多源 BFS：所有初始腐烂橘子作为第 0 层。
- 每个 BFS 层对应一分钟。
- 若仍有新鲜橘子不可达，返回 -1。

**标签：** #algorithm

---

### 70. 带障碍消除的网格最短路径

**难度：** 困难
**主题：** bfs, matrix, state-search
**岗位：** Senior SDE
**级别：** L5-L6

**问题：** 给定网格（0 空，1 障碍）和整数 k，返回 `(0,0)` 到 `(m-1,n-1)` 的最少步数，最多可消除 k 个障碍。不可达返回 -1。

**思路：** 对状态 `(r, c, remaining_k)` 做 BFS。已访问集按元组键。剪枝：若 `k >= m+n-2`，直接返回 Manhattan 距离。O(m * n * k)。不要因为之前以更小 remaining_k 访问过该格子就跳过——不同 k 是不同状态。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 状态为 `(行, 列, 剩余消除次数)`——不同 k 是不同节点。
- 捷径：若 `k >= m+n-2`，直接返回曼哈顿距离。
- 时间和空间均为 O(m * n * k)。

**标签：** #algorithm

---

## 数组 / 字符串

### 71. 重新排序日志文件

**难度：** 简单
**主题：** strings, sorting, comparator
**岗位：** SWE
**级别：** L3-L4

**问题：** 对日志文件列表重排：字母日志在前（按内容字典序，标识符为 tie-break），然后数字日志按原顺序。

**思路：** 自定义比较器：先划分字母日志和数字日志；字母日志按 `(content, identifier)` 排序；拼接。分类器看标识符之后第一个 token 的首字符。亚马逊经典 OA 题。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 稳定划分保持数字日志原顺序。
- 排序键为 (内容, 标识符) 以保证 tie-break。
- 时间 O(n * k log n)，k 为日志平均长度。

**常见追问：**
- 10 亿条日志——MapReduce 并行排序后合并分区。
- 不同日志流的标识符冲突——按流 id 加名字空间。
- 大小写敏感性（`A` vs `a`）——归一化或明确规则。
- 流式日志——不做全量重排如何维持顺序。

**常见坑：**
- 用非稳定排序会破坏数字日志原顺序。
- 没有只按第一个空格切分；日志内容带空格时会出错。

**标签：** #coding

---

### 72. 困于环中的机器人

**难度：** 中等
**主题：** simulation, math
**岗位：** SDE
**级别：** L4

**问题：** 机器人从原点出发面朝北，执行指令串（`G`、`L`、`R`）。判断无限重复指令后机器人是否被限定在有限区域内。

**思路：** 模拟一遍。机器人被限定 当且仅当 一遍后回到原点 或 不再面朝北。理由：不朝北意味着至多 4 遍后回原点（旋转周期为 4）。O(n)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 一遍后回到原点 或 不再朝北 即有界。
- 不朝北意味着至多 4 遍回原点。
- O(n) 时间，O(1) 空间；无需模拟多遍。

**标签：** #algorithm

---

### 73. N 天后的牢房

**难度：** 中等
**主题：** simulation, cycle-detection, bit-manipulation
**岗位：** SDE
**级别：** L4

**问题：** 一排 8 间牢房。每天，若两侧邻居相等则该房变 1，否则变 0。两端变 0。给定初始状态和 N，返回 N 天后的状态。

**思路：** 状态空间最多 256 个模式；必然出现循环。模拟时缓存 `state -> day`。命中后用 `% cycle_length` 计算剩余天数。状态编码为整数（位掩码）加速。O(min(N, 256))。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 位掩码把 8 个格子打包为整数，便于哈希。
- 用 `状态 -> 剩余天数` 的 map 检测循环。
- O(min(N, 256))——状态空间至多 256 种。

**标签：** #algorithm

---

### 74. 含 3 个不同字符的长度为 3 的子串

**难度：** 简单
**主题：** strings, sliding-window
**岗位：** SDE
**级别：** L3-L4

**问题：** 给定字符串，返回所有 3 个字符均不同的长度为 3 的好子串数量。

**思路：** 长度为 3 的滑窗；逐个检查三字符两两不同。O(n)。亚马逊 OA 常见的热身题，通常配一道更难的第二题。

**Python：**
```python
def count_good_substrings(s: str) -> int:
    count = 0
    for i in range(len(s) - 2):
        a, b, c = s[i], s[i + 1], s[i + 2]
        if a != b and b != c and a != c:
            count += 1
    return count
```

**TypeScript：**
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

**Java：**
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

**要点：**
- 窗口大小固定，无需双指针记账。
- 三字符两两不同即三者皆不同。
- O(n) 时间，O(1) 空间。

**标签：** #algorithm

---

### 75. 卡车上的最大单元数

**难度：** 简单
**主题：** greedy, sorting
**岗位：** SDE
**级别：** L3-L4

**问题：** 给定箱型 `[count, unitsPerBox]` 和卡车容量 `truckSize` 箱，返回最大单元数。

**思路：** 按 `unitsPerBox` 降序排序。贪心装尽可能多的高单元箱。O(n log n)。亚马逊 OA 常驻题，背景常是配送卡车。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 按每箱单元数降序贪心，先装高密度。
- 排序 O(n log n) 决定复杂度。
- 卡车装满即可提前 break。

**标签：** #algorithm

---

### 76. 找出环形游戏的获胜者

**难度：** 中等
**主题：** simulation, recursion, math
**岗位：** SDE
**级别：** L4

**问题：** `n` 个朋友站成一圈，编号 1..n。从 1 开始数 k 个，淘汰第 k 个。从下一个继续。返回最后剩下的人。

**思路：** 约瑟夫问题。递推 `J(1) = 0; J(n) = (J(n-1) + k) % n`。1 索引下返回 `J(n) + 1`。O(n) 时间，迭代 O(1)。用队列模拟为 O(n*k)，更容易临场推出。

**Python：**
```python
def find_the_winner(n: int, k: int) -> int:
    winner = 0
    for i in range(2, n + 1):
        winner = (winner + k) % i
    return winner + 1
```

**TypeScript：**
```typescript
function findTheWinner(n: number, k: number): number {
  let winner = 0;
  for (let i = 2; i <= n; i++) winner = (winner + k) % i;
  return winner + 1;
}
```

**Java：**
```java
class Solution {
    public int findTheWinner(int n, int k) {
        int winner = 0;
        for (int i = 2; i <= n; i++) winner = (winner + k) % i;
        return winner + 1;
    }
}
```

**要点：**
- 约瑟夫递推迭代 O(n)，O(1) 空间。
- 末尾 +1 转回 1 索引。
- 队列模拟 O(n*k)，临场更易推。

**标签：** #algorithm

---

### 77. 搜索旋转排序数组

**难度：** 中等
**主题：** binary-search, arrays
**岗位：** SDE
**级别：** L4

**问题：** 给定旋转排序数组（原升序，在某枢轴处旋转）和目标值，返回下标或 -1。要求 O(log n)。

**思路：** 改造的二分。每步判断哪半边有序（比较 `nums[lo]` 和 `nums[mid]`）。若目标落在有序半边的范围内则搜该半边，否则搜另一半。O(log n)。有重复值时最坏退化为 O(n)。

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

**要点：**
- 一半总是有序的——用 `nums[lo] <= nums[mid]` 判断。
- 包含边界检查匹配有序侧端点。
- 无重复时 O(log n)，有重复退化到 O(n)。

**标签：** #algorithm

---

### 78. 划分字母区间

**难度：** 中等
**主题：** greedy, strings, two-pointer
**岗位：** SDE
**级别：** L4

**问题：** 将字符串划分为尽可能多的片段，使每个字母最多出现在一个片段中。返回各片段长度列表。

**思路：** 预处理 `last[c]` = 字符 c 的最后位置。用双指针 `start`、`end` 扫描；扩张 `end = max(end, last[s[i]])`；当 `i == end` 时切一段并 `start = i+1`。O(n)。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- 当 `i` 抵达迄今最远的 last 索引时即可切段。
- 共两次遍历；O(n) 时间，O(1) 额外空间。
- 贪心可证最优：必须延伸 `end`。

**标签：** #algorithm

---

### 79. 字符串相乘

**难度：** 中等
**主题：** array, string, math
**岗位：** SWE
**级别：** L5

**问题：** 给定两个以字符串表示的非负整数 `num1` 和 `num2`，返回它们乘积的字符串表示，不能使用大整数库或直接转成整数。

**思路：** 模拟竖式乘法。长度为 m、n 的两数乘积至多 m+n 位，用长度 m+n 的数组存每一位。`num1[i]` 与 `num2[j]` 相乘结果落在下标 `i+j`（高位）和 `i+j+1`（低位），先累加再统一进位。最后跳过前导零。时间 O(m·n)，空间 O(m+n)。

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
    s = "".join(map(str, res)).lstrip("0")
    return s or "0"
```

**TypeScript：**
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
- `num1[i] * num2[j]` 恰好贡献到结果下标 `i+j` 和 `i+j+1`。
- 先把所有乘积累加进数组，再统一处理进位，逻辑更清晰。
- 结果长度上界为 m+n，需去掉前导零。

**常见追问：**
- 如何支持负数或小数？
- 极大数相乘能否用 FFT 把复杂度降到 O(n log n)？

**常见坑：**
- 忘记处理任一操作数为 "0" 的情况，返回带前导零的结果。
- 进位下标写错（把高低位 `i+j` 与 `i+j+1` 弄反）。

**标签：** #algorithm

---

### 80. 除自身以外数组的乘积

**难度：** 中等
**主题：** arrays, prefix-product
**岗位：** SWE
**级别：** L5

**问题：** 给定整数数组，返回一个数组，其中每个元素等于其余所有元素的乘积；不得使用除法，且要求 O(n) 时间。

**思路：** 两趟遍历。第一趟把 `res[i]` 填为 `i` 之前所有元素的前缀积；第二趟用一个滚动标量累乘 `i` 之后的后缀积。禁用除法（且遇到 0 也会出错）。O(n) 时间，除输出外 O(1) 额外空间。

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
  for (let i = 0; i < n; i++) { res[i] = prefix; prefix *= nums[i]; }
  let suffix = 1;
  for (let i = n - 1; i >= 0; i--) { res[i] *= suffix; suffix *= nums[i]; }
  return res;
}
```

**Java：**
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

**要点：**
- 把答案拆成前缀积 × 后缀积，两者都不含 `nums[i]`。
- 输出数组兼作暂存空间，因此只用 O(1) 额外内存。
- 不用除法就彻底规避了 0 的处理问题。

**常见追问：**
- 处理溢出——对大质数取模，或用 64 位。
- 支持在线更新：单点低成本重算（乘积线段树）。
- 若允许除法会怎样？（按 0 的个数分情况讨论。）

**常见坑：**
- 图省事用除法，数组含一个或多个 0 时崩掉。
- 单独开前缀和后缀两个数组还声称 O(1) 空间。

**标签：** #algorithm

---

### 81. 最长回文子串

**难度：** 中等
**主题：** string, dynamic-programming, two-pointers
**岗位：** SWE
**级别：** L5

**问题：** 给定字符串 `s`，返回其中最长的回文子串（连续子串）。

**思路：** 中心扩展。回文中心有 2n-1 个（每个字符及每对相邻字符之间），从每个中心向两侧扩展，记录最长区间。时间 O(n²)，空间 O(1)。也可用 Manacher 在 O(n) 内求解，但代码更复杂。

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
  return s.slice(start, end + 1);
}
```

**Java：**
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

**要点：**
- 每个位置要考虑奇数（单中心）和偶数（双中心）两种回文。
- 中心扩展用 O(1) 空间即可，比二维 DP 更省内存。
- 用起止下标记录最长区间，避免反复拷贝子串。

**常见追问：**
- 如何在 O(n) 内求解（Manacher 算法）？
- 如何统计回文子串的总个数？

**常见坑：**
- 只处理奇数中心，漏掉偶数长度回文（如 "abba"）。
- 用长度比较时把奇偶两种情况的区间边界算错。

**标签：** #algorithm

---

## 其他算法

### 82. 设计停车场

**难度：** 中等
**主题：** ood, design
**岗位：** SWE
**级别：** L4

**问题：** 设计一个多层停车场的类，支持摩托车、汽车和卡车三种车型，对应不同的车位大小。

**思路：** 类：`ParkingLot` → `Level[]` → `ParkingSpot[]`。Spot 有 `size` 枚举（compact/large/motorcycle）。`Vehicle` 抽象类 → `Car/Truck/Motorcycle`，每个声明可停的车位尺寸。`park()` 找第一个兼容车位；`leave()` 释放。展示良好的封装、多态，并讨论扩展（电动充电、月卡）。别过度设计——面试官想要清晰的类图，不是 50 个类。

**Python：**
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

**TypeScript：**
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

**Java：**
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

**要点：**
- `Vehicle.fits` 让每种车型声明可停车位尺寸（开闭原则）。
- 面试线性扫描即可；线上系统应按尺寸把空车位放进队列。
- 扩展时新增 `EVSpot extends Spot` 而不是修改枚举。

**复杂度：** `park` 为 O(S)（线性扫描 S 个车位；按尺寸分桶后为 O(1)）；`leave` 为 O(1)。

**常见追问：**
- 多层停车场——如何均衡各层利用率？
- 电动车位，带排队与充电时长跟踪。
- 计费（按时/天/月）接入支付服务。
- 实时可用车位看板——pub/sub vs 轮询，最终一致权衡。
- 预订系统及超售策略、未到超时。

**常见坑：**
- 类太多过度设计；面试官要的是清晰边界，不是 50 个抽象。
- 把 spot 与 vehicle 的兼容关系硬编码在 `ParkingLot` 里，应在 vehicle 上声明。

**标签：** #coding

---

## 系统设计

### 83. 设计 Amazon Prime Video

**难度：** 困难
**主题：** system-design, cdn, video-streaming, drm, recommendation
**岗位：** 高级 SWE
**级别：** L5

**问题：** 设计一个类似 Prime Video 的视频流服务。

**思路：** 上传 → 编码管道（多码率、多编解码器、DRM 封装的 HLS/DASH 分片）→ 对象存储（S3）+ CDN（CloudFront）。播放客户端请求 manifest，自适应码率（ABR）。元数据存 DynamoDB；推荐由离线训练（矩阵分解 + 内容 embedding）得出。讨论 DRM（Widevine/FairPlay/PlayReady）、区域版权、离线下载、CDN 成本优化（缓存命中率）。如适用，可提亚马逊开源的 bitmovin/编码方案。

**常见追问：**
- DRM 密钥轮换与许可证过期；客户端如何在播放中刷新？
- 多设备间精确恢复播放进度（继续观看）。
- 内容的区域限制与版权窗口期——在 manifest 还是 CDN edge 执行？
- 直播 vs 点播——编码与 CDN 策略会变化。
- 推荐冷启动（新用户 / 新内容）。

**常见坑：**
- 当作通用文件存储；漏掉编码管道与 ABR 层。
- 忽视 CDN 出口流量成本——实际系统最大开销。

**标签：** #system-design

---

### 84. 设计 Amazon.com 商品页

**难度：** 困难
**主题：** system-design, caching, microservices, search
**岗位：** 高级 SWE
**级别：** L5

**问题：** 设计支撑亚马逊商品详情页（标题、价格、库存、评论、推荐）的后端，每秒数百万请求。

**思路：** 页面由多个服务拼装：商品信息（写穿透缓存）、价格（实时，可能因人而异）、库存（最终一致的计数器）、评论（按 product_id 分片分页）、推荐（预计算）。BFF（backend-for-frontend）做扇出聚合，每个服务设超时；超时时用已有数据渲染（优雅降级）。读多写少字段重度走边缘缓存。讨论库存的最终一致性（"仅剩 2 件！"可能虚标）和黑五尖刺（预热缓存、自动扩容）。

**标签：** #system-design

---

### 85. 设计 Kindle 同步

**难度：** 困难
**主题：** system-design, sync, conflict-resolution, offline
**岗位：** 高级 SWE
**级别：** L5

**问题：** 设计 Kindle 跨用户多设备同步阅读进度、高亮、笔记的方式，即使设备间歇性离线也能工作。

**思路：** 每台设备维护本地状态 + 操作日志。重连时把操作推送到按用户分片的同步服务。服务端合并操作：阅读位置用 last-write-wins（或"读到最远位置"以抵御误点击），高亮/笔记则 append-only。用 vector clock 或 HLC 跨设备排序。存 DynamoDB 按 user_id 分片。通过 SNS 向其他设备推送通知。讨论冲突场景（两台设备离线编辑同一条笔记）和最终收敛保证。

**标签：** #system-design

---

### 86. 设计 Amazon S3

**难度：** 困难
**主题：** system-design, blob-storage, consistency, replication
**岗位：** 高级 SWE
**级别：** L5

**问题：** 设计 Amazon S3——全球可用、保证写后读强一致的对象存储服务。

**思路：** 前端 API 网关 → 按 hash(bucket+key) 路由到分片。每个分片有元数据服务（分片关系型/KV）+ 跨多个存储节点的纠删码对象数据（如 Reed-Solomon 10+4）。多 AZ 副本；跨区域异步复制做灾备。元数据协调器（基于 Paxos）保证强一致。生命周期（S3 → Glacier）由后台降级任务完成。讨论持久性数学（11 个 9）、大对象的分片上传、版本控制如何实现（不可变 object ID + 元数据中的版本栈）。

**标签：** #system-design

---

### 87. 设计分布式锁服务

**难度：** 困难
**主题：** system-design, consensus, paxos, zookeeper
**岗位：** 高级 SWE
**级别：** L5

**问题：** 设计 AWS 内部使用的分布式锁服务（类 Chubby 或 ZooKeeper）。

**思路：** 5-7 节点的 Raft/Paxos 集群对锁状态达成共识。客户端申请基于租约（TTL）的锁，处理客户端故障。会话/心跳：客户端不心跳就自动释放锁。讨论 fencing token（递增计数器传给下游服务，下游可拒绝陈旧锁持有者——著名的 Kleppmann 论证）。权衡：强一致 vs 延迟，单区域 vs 多区域（跨区域部署锁服务务必慎重）。

**标签：** #system-design

---

### 88. 设计亚马逊购物车与结账

**难度：** 困难
**主题：** system-design, e-commerce, dynamodb, idempotency, consistency
**岗位：** 高级 SWE
**级别：** L5-L6

**问题：** 设计 Amazon.com 的购物车与结账流程，支撑数亿用户、跨设备的购物车持久化，以及大促高并发下的正确行为。

**思路：** 购物车服务以 DynamoDB 存储，按 `user_id`（游客用 session id）为键，每条商品记 `{product_id, qty, price_snapshot}`；登录时把游客购物车合并进用户购物车。购物车写入量大、需读己之写，用 DynamoDB + 写穿透缓存（DAX/ElastiCache）。结账是一个 saga/状态机：(1) 预留库存（乐观并发的条件递减），(2) 授权支付，(3) 创建订单，(4) 确认。每步通过客户端提供的 `idempotency_key` 做幂等，重试不会重复扣款或重复预留。价格在结账时重新校验（购物车存快照，但真源是定价服务）。各阶段间用 SQS 保证持久性与背压；失败时用补偿事务释放库存 / 撤销授权。讨论库存最终一致性（超卖风险 vs 预留 TTL）、黑五尖刺（自动扩容、基于队列的削峰）、以及为降低延迟做的跨区域购物车复制。

**常见追问：**
- 支付过程中客户端重试或网络超时，如何防止重复扣款？
- 库存预留 TTL：用户预留后放弃结账会怎样？
- 同一商品存在于两台设备时的购物车合并冲突——数量如何调和？
- 单个爆款商品的秒杀热分区——如何避免 DynamoDB 热点键？

**常见坑：**
- 结账时信任客户端购物车里的价格，而不在服务端重新校验。
- 结账各步非幂等，重试就产生重复订单或重复扣款。

**标签：** #system-design

---

### 89. 设计类 Amazon SQS 的分布式消息队列

**难度：** 困难
**主题：** system-design, messaging, queue, durability, at-least-once
**岗位：** 高级 SWE
**级别：** L5-L6

**问题：** 设计一个可水平扩展、持久、支持至少一次投递的消息队列服务，类似 Amazon SQS。

**思路：** 前端 API 层（SendMessage / ReceiveMessage / DeleteMessage）置于负载均衡之后，按队列鉴权。消息按分区分散到大量存储节点；每个分区在向生产者 ack 前，跨多个 AZ 的节点做多副本写（quorum 写）——由此保证持久性。投递语义为至少一次：接收时消息进入 `visibility_timeout` 变为不可见而非删除；消费者处理完必须显式 DeleteMessage，否则消息重新出现被重投。这要求消费者幂等。记录重投次数，超过 N 次后转入死信队列。标准队列偏重吞吐、尽力而为的顺序；FIFO 变体用 `message_group_id` 实现组内有序，再加去重 id 在一定窗口内近似恰好一次。讨论长轮询以减少空接收、由积压指标驱动的消费者自动扩缩、以及为何在分布式队列上强求全局严格有序会摧毁可扩展性。

**常见追问：**
- 为什么是至少一次而不是恰好一次？作为代价消费者需承担什么？
- 可见性超时与处理超时的慢消费者如何相互作用？
- 设计 FIFO 变体：如何在分片的同时保序？
- 如何防止一条毒消息永久阻塞某个分区？

**常见坑：**
- 假设恰好一次投递，从而省掉幂等消费者设计。
- 承诺全局严格有序，逼出单分区，吞吐彻底崩溃。

**标签：** #system-design

---

### 90. 设计 Alexa 语音助手

**难度：** 困难
**主题：** system-design, speech, nlu, low-latency, streaming
**岗位：** 高级 SWE
**级别：** L5-L6

**问题：** 设计 Alexa 的后端：用户对设备说话，它在一两秒内以动作或语音回应。

**思路：** 流水线：唤醒词检测在设备端运行（廉价、保护隐私），避免把所有音频都传到云端。识别到唤醒词后，音频通过持久连接流式上传到云。自动语音识别（ASR）增量地把流式音频转成文本。自然语言理解（NLU）把文本映射为意图 + 槽位（如 `PlayMusic{artist: ...}`）。编排/对话管理器把意图路由到正确的技能（第一方，或经 Skills API 的第三方），技能返回响应。文本转语音（TTS）合成语音回复并流式回传，让播放在合成完成前就开始。延迟是硬约束：每个阶段都流式、连接保活、ASR/NLU/TTS 都做成低延迟服务并按区域就近部署。个性化与上下文（设备状态、上一轮对话）放在会话存储。讨论隐私（设备端唤醒词、退出选项、数据留存）、多轮对话状态、以及技能沙箱与超时。

**常见追问：**
- 如何把端到端延迟控制在约 1 秒内？哪些环节必须流式？
- 多轮上下文（"播放它" 承接 "这是什么歌"）——对话状态存在哪？
- 第三方技能变慢或崩溃——如何隔离并优雅降级？
- 意图歧义或 ASR 置信度低时——重新询问还是取最佳猜测？

**常见坑：**
- 把所有音频都传到云端，而不用设备端唤醒词做门控（成本 + 隐私）。
- 把整个流程当成请求/响应式批处理而非流式，导致延迟预算爆掉。

**标签：** #system-design

---

## 行为面试

### 91. 讲一次你为客户超出预期付出的经历

**难度：** 中等
**主题：** behavioral, customer-obsession
**岗位：** SWE
**级别：** L4

**问题：** 描述一次你为取悦客户而超出本职付出的经历。

**思路：** STAR 对应 **Customer Obsession**（LP #1）。"客户"可以是内部的（另一个团队）或外部的。展示：你主动识别了对方没说出口的需求，跳出本职去解决，并有可量化的客户影响。避免泛泛的"我快速回了工单"。

**标签：** #behavioral

---

### 92. 讲一次你担起了职责之外的重要工作

**难度：** 中等
**主题：** behavioral, ownership, bias-for-action
**岗位：** SWE
**级别：** L4

**问题：** 讲一次你扛起了原本不属于你的工作的经历。

**思路：** STAR 对应 **Ownership** 和 **Bias for Action**。展示：(1) 你看见了空白，没等别人分派，(2) 没事事请示，(3) 影响真实可见。加分：你长期扛下来——"我顶了 6 个月，直到我们招到人。"别挑那种其实只是你本职工作的故事。

**标签：** #behavioral

---

### 93. 讲一次你在信息不足时做决策的经历

**难度：** 中等
**主题：** behavioral, bias-for-action, are-right-a-lot
**岗位：** 高级 SWE
**级别：** L5

**问题：** 讲一次你在缺乏全部信息的情况下迅速做决定的经历。

**思路：** STAR 对应 **Bias for Action** 和 **Are Right A Lot**。展示：(1) 等待的成本是真实可量化的，(2) 你识别了最小必要事实集，(3) 你做了决定并承诺，(4) 你有回滚或纠偏方案。决定错了没关系，只要你为善后负责。

**标签：** #behavioral

---

### 94. 讲讲你最有挑战的技术项目

**难度：** 中等
**主题：** behavioral, dive-deep, deliver-results
**岗位：** 高级 SWE
**级别：** L5

**问题：** 介绍你技术上最复杂的项目。难点在哪？你的角色是什么？

**思路：** STAR 对应 **Dive Deep** 和 **Deliver Results**。Bar raiser 会就这道题追问 15-20 分钟——准备好回答"为什么选这个数据库？"/"p99 是多少？"/"重做你会怎么改？"。挑一个你端到端 owner 且结果可量化的项目。如果你说不清架构权衡，换个故事。

**标签：** #behavioral

---

### 95. 讲一次你为复杂问题发明了更简单的方案

**难度：** 中等
**主题：** behavioral, invent-and-simplify, ownership
**岗位：** 高级 SWE
**级别：** L5

**问题：** 描述一次你在别人过度设计时，找到了明显更简单的解决方案的经历。

**思路：** STAR 对应 **Invent and Simplify**（LP #5）。面试官想看到你挑战了默认的复杂方案，并找到实质更简单的做法——更少的组件、更少的代码、更低的成本或更小的运维负担——同时不在正确性上偷工减料。结构：（Situation）当时摆在桌面上的复杂方案及其笨重之处；（Task）你的角色与约束；（Action）解锁更简单设计的洞见或重新定义问题的方式，以及你如何说服他人认同；（Result）可量化的简化——如"砍掉一个服务，p99 降低 40%，on-call 报警减半"。好的回答要体现你"发明"了非显而易见的点子，而不只是删减了范围。避免那种"更简单"其实等于少做需求本身的故事。

**标签：** #behavioral

---

### 96. 讲一次你犯了错误以及你如何重新赢得信任

**难度：** 中等
**主题：** behavioral, earn-trust, ownership, dive-deep
**岗位：** SWE
**级别：** L5

**问题：** 讲一次你在工作中犯下重大错误的经历。发生了什么，你又是如何处理的？

**思路：** STAR 对应 **Earn Trust** 与 **Ownership**。面试官考察的是自省与担当，而非你是否完美无缺。结构：（Situation）一个真实、有分量且你主动承担的错误——一次糟糕的发布、一个错误的估算、一处影响客户的设计缺陷；（Task）影响范围与受影响的人；（Action）你如何回应——及时且透明地承认（不甩锅），控制损失，深入挖掘根因，并落地一个持久修复或流程（如 COE/复盘、补测试、回滚护栏）；（Result）结果，以及最关键的——你如何随时间重建团队或客户的信任。好的回答体现你在别人发现之前主动坦白，且同类错误再未复发。避免假错误（"我工作太拼了"）或甩锅他人。

**标签：** #behavioral

---

## 领域知识

### 97. LP 深挖：Disagree and Commit

**难度：** 中等
**主题：** behavioral, have-backbone, earn-trust
**岗位：** 高级 SWE
**级别：** L5

**问题：** 讲一次你不同意某个决定但仍然承诺并帮其成功的经历。

**思路：** 对应 **Have Backbone; Disagree and Commit**——L5+ 最常问的 LP 之一。两段式：(1) 你在决定敲定前，在合适的场合用数据清楚表达了反对；(2) 决议不利于你时，你主动 commit——不是被动接受，而是主动去促成。加分：最终结果证明原决定是对的，你从中有所学习。

**标签：** #domain-knowledge

---

### 98. LP 深挖：Frugality

**难度：** 中等
**主题：** behavioral, frugality, invent-and-simplify
**岗位：** SWE
**级别：** L4

**问题：** 讲一次你用有限资源完成重大成果的经历。

**思路：** 对应 **Frugality**（"用更少做更多"）。资源可以是人力、时间、预算或算力。展示：你没去要更多人头/预算——而是想出了巧妙的简化方案（也呼应 **Invent and Simplify**）。具体：例如"我们需要实时分析但用不起 Snowflake——我用 Kinesis + DynamoDB streams 搭了一条管道，每月 200 美元，而不是 2 万美元。"量化节省。

**标签：** #domain-knowledge

---

### 99. 如何让一个类做到线程安全？

**难度：** 中等
**主题：** concurrency, thread-safety, java, synchronization
**岗位：** SWE
**级别：** L5

**问题：** 线程安全意味着什么？你会用哪些手段让共享对象在并发访问下保持安全？

**思路：** 线程安全指并发访问在无外部同步的情况下也能产生正确结果——没有数据竞争，不破坏不变式。按从廉价到强力的顺序梳理工具箱：(1) **不可变性**——构造后状态永不改变的对象天生线程安全（Java `final` 字段、防御性拷贝）；优先选它。(2) **限定/封闭**——把状态限制在单线程内（thread-local，或 actor/事件循环模型），从不共享。(3) **同步**——用锁（`synchronized`、`ReentrantLock`）守护可变共享状态，保证同一时刻只有一个线程修改；务必建立一致的加锁顺序以避免死锁，并让临界区尽量小。(4) **原子类 / 无锁**——`AtomicInteger`、CAS 循环、并发集合（`ConcurrentHashMap`）用于高竞争的计数器和映射，无需显式加锁。(5) **可见性**——`volatile` 保证写对其他线程可见（修复双检锁和停止标志的 bug），但不为复合操作提供原子性。讨论竞态条件（交错执行）与可见性问题（读到过期缓存）的区别，以及为何 `check-then-act`（如懒加载、`containsKey` + `put`）需要单个原子步骤。亚马逊的服务高度并发，预期会被追问让你修好一个坏掉的单例或计数器。

**标签：** #domain-knowledge

---

### 100. 分布式系统中的幂等性与投递语义

**难度：** 中等
**主题：** distributed-systems, idempotency, reliability, messaging
**岗位：** SWE
**级别：** L5

**问题：** 什么是幂等性？它在分布式系统中为何重要？如何在至少一次投递之上实现恰好一次处理？

**思路：** 一个操作若多次执行的效果与执行一次相同，即为幂等。它之所以重要，是因为网络不可靠：任何请求都可能超时且结果未知，于是客户端会重试——而多数持久消息系统（SQS、Kinesis、Kafka 的至少一次）都可能重投。没有幂等性，重试就会重复扣款、重复发货或重复计数。梳理投递语义谱系：至多一次（可能丢失）、至少一次（可能重复，常见的持久默认）、恰好一次（通常是一种幻觉，由至少一次投递 + 幂等处理构成）。手段：(1) **幂等键**——客户端为每个逻辑操作发送唯一键；服务端记录已处理的键，重复时返回上次结果。(2) **天然幂等**——把写设计成 `SET x = v` 而非 `x += 1`，或用基于去重 id 的条件写 / upsert。(3) **去重存储**——一张带 TTL 的已见请求 id 表或缓存。(4) **幂等消费者**——把去重 id 与一个原子的"处理并标记完成"步骤（事务性 outbox / 去重表）结合，让重投变成空操作。讨论权衡：去重窗口是有限的（存储成本），且"恰好一次"只有在副作用与去重记录原子提交时才成立。这是亚马逊订单与支付管道的核心，预期会被追问如何在重试下防止重复扣款。

**标签：** #domain-knowledge

---

## 亚马逊特有的建议

- **背熟 16 条 LP。** 面试官会问你某个故事对应哪条 LP。提前把故事和 LP 做映射演练。
- **每条 LP 备 2-3 个故事**——他们会交叉印证、识别复用。别每道题都拉同一个项目。
- **Bar raiser 对你所在团队不熟悉。** 简洁说清上下文。他们看重 STAR 严谨度和 LP 契合度，不是你所在领域的技术深度。
- **行为面试在每轮的开头。** 表现差的行为面试会毒化技术评估。别为了赶紧进算法题而草草过 "Customer Obsession"。
- **OOD 出现频率高。** 练 3-4 道：停车场、电梯、LRU/LFU 缓存、扑克牌、自动售货机。

## 参考资料

- 亚马逊官方公布的领导力准则页面（背原文措辞，不只是标题）
- LeetCode "Amazon" 公司标签——重点刷 OOD 题
- 《Working Backwards》——亚马逊产品开发书，提供有用的上下文
- amazon.jobs 面试准备页（官方）
