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

## 题目

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

### 2. 验证二叉搜索树

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

### 3. 二叉树的序列化与反序列化

**难度：** 困难
**主题：** tree, bfs, dfs, design
**岗位：** SWE
**级别：** L62-L63

**问题：** 设计将二叉树序列化为字符串并反序列化回来的算法。

**思路：** 前序 DFS 带 null 标记：`"1,2,null,null,3,4,null,null,5,null,null"`。反序列化用队列/迭代器，每次取一个 token 递归。两端 O(n)。备选：层序 BFS。讨论紧凑编码（变长 int、用叶子标志位省去前导 null）。

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

### 4. 数组中的第 K 大元素

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

### 5. 螺旋矩阵

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

### 6. 复制带随机指针的链表

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

### 7. 买卖股票的最佳时机

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
- 返回最优买卖的 *天子下标*，而非收益。

**常见坑：**
- `lo` 初为 `prices[0]` 且从 0 开始遍历——产生一个瞬时 0 收益，本身无害但迷惑。
- 遇到新 `lo` 就重置 `best`——必须保持走动最大值。

**标签：** #algorithm

---

### 8. 单词搜索

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

### 9. 设计 Microsoft Teams 聊天

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

### 10. 设计 Azure Blob 存储

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

### 11. 设计 Office 365 文档协同编辑

**难度：** 困难
**主题：** system-design, ot, crdt, sync
**岗位：** 高级 SWE
**级别：** L63-L65

**问题：** 设计 Word/Excel/PowerPoint Online 支持多人并发编辑同一文档的方案。

**思路：** 单文档级别用 OT 或 CRDT。每文档服务（按 doc_id 分片）作为中心序列化器；WebSocket 客户端发操作，服务端 transform + 广播。操作日志持久化（Cosmos DB）+ 定期快照到 blob。讨论离线编辑（本地排队操作、重连时重放）、大文档扩展（按段落粒度）、富内容（嵌入对象、评论）。可以提一句 Excel 比 Word 难（单元引用会让公式漂移）。

**标签：** #system-design

---

### 12. 设计任务调度器（Azure Functions 后端）

**难度：** 中等
**主题：** system-design, queue, scheduling, distributed-systems
**岗位：** 高级 SWE
**级别：** L63-L65

**问题：** 设计支持一次性、周期（cron）、延时任务的大规模分布式调度器。

**思路：** 持久化任务存储（Cosmos DB）+ `next_run_time` 索引。调度 worker（通过 ZK/etcd 选主）每秒扫描到期任务，推到队列（Service Bus）。worker 池从队列拉取、执行、汇报状态。周期任务完成后按下一次 cron 时间重排。讨论 exactly-once vs at-least-once（多数调度器走 at-least-once + 幂等 handler）、宕机后回补、cron 的时区处理。

**标签：** #system-design

---

### 13. 设计 API 限流器

**难度：** 中等
**主题：** system-design, rate-limiting, redis, distributed
**岗位：** SWE
**级别：** L62-L63

**问题：** 设计支持按用户和按 IP 限流的 API rate limiter。

**思路：** 令牌桶或滑动窗口日志。存储用按 user_id 分片的 Redis 集群。原子 Lua 脚本递减+判断。超热 key 加进程内本地缓存（每 100ms 刷新）作为第一道。分布式限流优先用区域限流（容忍最终一致），少用全局同步。讨论 fail-open vs fail-closed。

**标签：** #system-design

---

### 14. 设计 Xbox Live 匹配

**难度：** 困难
**主题：** system-design, gaming, latency, ranking
**岗位：** 高级 SWE
**级别：** L63-L65

**问题：** 设计 Xbox Live（或任何多人游戏）的匹配系统，按技术和延迟撮合玩家。

**思路：** 玩家进入按 `(game_mode, region, skill_bucket)` 的队列。技术评分用 TrueSkill/Glicko-2；技能 ± N 随等待时间扩大窗口。区域用 ping 候选数据中心决定。匹配器每隔几秒按桶撮合。匹配上后：在延迟最低的 DC 分配游戏服务器（Kubernetes 池）。讨论反小号、组队匹配（4 人队 vs 单排）、公平性与排队时间的权衡。

**标签：** #system-design

---

### 15. 讲一次你快速学会新东西的经历

**难度：** 中等
**主题：** behavioral, growth-mindset, learning
**岗位：** SWE
**级别：** L60-L62

**问题：** 讲一次你为了交付不得不快速学习新技术或新领域的经历。你怎么做的？

**思路：** 直击**成长型思维**——Satya 的头号文化视角。展示：(1) 你没装懂，(2) 你有结构化学习方法（文档 → 小 POC → 专家 review），(3) 你用新技能交付了，(4) 之后你教别人。加分：你主动寻求了让你面子上挂不住的反馈。

**标签：** #behavioral

---

### 16. 你收到尖锐反馈的经历

**难度：** 中等
**主题：** behavioral, growth-mindset, self-awareness
**岗位：** SWE
**级别：** L60-L62

**问题：** 讲一次你收到严厉反馈的经历。你怎么处理的？

**思路：** 微软深挖这道题——"固定 vs 成长型思维"的试金石。展示：(1) 你没防御性反应，(2) 你试图理解背后的信号，(3) 你做了可证明的具体行为改变（不只是意图），(4) 反馈给予者认可了改变。避免"我心里其实不同意"的故事——那是固定思维信号。

**标签：** #behavioral

---

### 17. 一个不顺利的项目

**难度：** 中等
**主题：** behavioral, failure, growth-mindset
**岗位：** 高级 SWE
**级别：** L63-L65

**问题：** 介绍一个失败或未达预期的项目。发生了什么？你学到了什么？

**思路：** 挑真实失败。展示：(1) 你不甩锅、独自扛责，(2) 你做了真正的复盘（流程层面，不是"我们应该多测试"这种空话），(3) 教训在后续项目里改变了你的行为——给具体例子。微软喜欢你描述系统/流程缺口，而非个人问题。

**标签：** #behavioral

---

### 18. 你无授权领导一件事的经历

**难度：** 中等
**主题：** behavioral, leadership, influence
**岗位：** 高级 SWE
**级别：** L63-L65

**问题：** 讲一次你推动跨团队倡议，但对相关人员并无直接管理权的经历。

**思路：** Senior+ 信号。展示：(1) 你用"对他们有什么好处"的明确框架建立联盟，(2) 你用数据/客户影响（不是组织政治），(3) 你公开表扬他人贡献，(4) 结果可量化。微软非常看重跨组协作——他们组太多了。

**标签：** #behavioral

---

### 19. 优化某服务在 Azure 上的成本

**难度：** 中等
**主题：** cloud, cost-optimization, azure
**岗位：** SRE
**级别：** L63

**问题：** Azure 上某服务月账单 20 万美元。讲讲你如何砍掉一半。

**思路：** 先剖析成本：算力（VM/AKS）、存储（Blob/磁盘）、出网、托管服务。常见收益：(1) 调整 VM 规格（CPU/内存利用率 <30% 即过度配置），(2) 批处理用 reserved 或 spot 实例，(3) Cosmos DB → 调 RU/s 和分区，(4) 冷 blob 转到 cool/archive 层，(5) 重度缓存减少出网，(6) 审计 dev/test 资源下班后自动关机。别不看 SLO 影响就砍。展示你会先建成本看板再动手。

**标签：** #domain-knowledge

---

### 20. 排查 .NET 服务高 CPU

**难度：** 中等
**主题：** dotnet, profiling, debugging
**岗位：** SWE
**级别：** L62

**问题：** 一个 C#/.NET 服务在生产 VM 间歇性 100% CPU。你如何排查？

**思路：** 第 1 步：取 dump（`dotnet-dump collect`）或用 profiler（`dotnet-trace`、PerfView）。看最热的调用栈。常见原因：(1) GC 压力 → 看 Gen2 回收、大对象堆，(2) 灾难性回溯的正则，(3) 大对象的 JSON 序列化，(4) Task 调度器中的忙等，(5) 锁竞争。用 `dotnet-counters` 看实时指标。要把部署 diff 和近期流量模式关联起来分析。若无法复现，加结构化日志 + 生产采样 profiler（always-on profiling）。

**标签：** #domain-knowledge

---

### 21. 反转链表 II

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

### 22. 矩阵置零

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

### 23. 旋转图像

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

### 24. 最大子数组和

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

### 25. Excel 表列名称

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

### 26. 回文子串数

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

### 27. 字母异位词分组

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

### 28. 实现 Trie（前缀树）

**难度：** 中等
**主题：** trie, design, string
**岗位：** SWE
**级别：** L60-L62

**问题：** 实现支持 `insert`、`search` 和 `startsWith` 操作的 Trie。

**思路：** 节点含 `children: Map<Char, Node>`（或小写 a-z 用 26 位数组）和 `isEnd` 标志。三个操作均逐字符走树。每次操作 O(L)，L 为单词长度。讨论：数组快但稀疏；hashmap 节省大字母表场景的空间。

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

### 29. 添加与搜索单词

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

### 30. 设计点击计数器

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

### 31. 寻找峰值

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

### 32. 合并 K 个有序链表

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

### 33. 单词搜索 II

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

### 34. 打家劫舍

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

### 35. 零钱兑换

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

### 36. 解码方法

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

### 37. 爬楼梯

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

### 38. 路径总和 II

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

### 39. 从前序与中序遍历构造二叉树

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

### 40. 二叉树展开为链表

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

### 41. 对称二叉树

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

### 42. 二叉树的最大深度

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

### 43. 只出现一次的数字 III

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

### 44. 两整数之和（不用 + 运算符）

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

### 45. 2 的幂

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

### 46. 颠倒二进制位

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

### 47. 位 1 的个数（Hamming Weight）

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

### 48. 二叉搜索树的最近公共祖先

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

### 49. 二叉树的锯齿形层序遍历

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

### 50. 最长回文子串

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

### 51. KMP 字符串匹配

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

### 52. 括号生成

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

### 53. 子集

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

### 54. 全排列

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

### 55. 组合总和

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

### 56. 最长递增子序列

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

### 57. 编辑距离

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

### 58. LRU 缓存

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

### 59. 最小栈

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

### 60. 滑动窗口最大值

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

### 61. 数据流的中位数

**难度：** 困难
**主题：** heap, design
**岗位：** 高级 SWE
**级别：** L62-L63

**问题：** 设计一个类，随数据流入支持 `addNum(int)` 与 `findMedian()`。

**思路：** 两个堆：左半大顶堆，右半小顶堆。add 时压入并保持大小差 <= 1。中位数：奇数取较大堆栈顶；偶数取两个堆顶平均。add O(log n)，median O(1)。

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

### 62. 设计井字棋

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
