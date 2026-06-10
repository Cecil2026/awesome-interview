# Meta（Facebook）

```yaml
company: Meta（Facebook、Instagram、WhatsApp）
typical_rounds: 1 轮 recruiter 沟通 + 1 轮电话面（CoderPad）+ 4-5 轮 onsite（2 轮编码、1-2 轮系统设计、1-2 轮行为面试即"Jedi"）
focus_areas: 数组/字符串/树/图、系统设计、行为面试（"影响力"和"冲突"）
languages_allowed: 任意主流语言；Python/C++/Java/Hack 常见
duration: 编码 35-40 分钟（每轮两题！）、设计 45 分钟、Jedi 45 分钟
notable_quirks:
  - 编码轮一轮预期两题，35-40 分钟——节奏很重要
  - "Jedi" 轮（行为面试）必考且权重高
  - 文化匹配看重 "move fast" 和 "impact"
  - 前端/产品岗有产品 sense 轮
sources: Glassdoor、LeetCode Discuss（facebook 标签）、Blind、Meta 官方面试准备资料
```

## 概述

Meta 的编码门槛重视经典数据结构题的速度和准确度——数组、字符串、树、图、哈希表。编码轮几乎一定每轮两题，所以不能在热身题上耗太久。L5+ 系统设计围绕 Meta 自家产品（News Feed、Instagram、Messenger）。Jedi 轮考察"影响力"（你交付的东西是否推动了指标？）和"冲突"（你能否建设性地反对？）。

## 题目

### 1. 验证外星人词典

**难度：** 简单
**主题：** strings, hashmap
**岗位：** SWE
**级别：** L3-L4

**问题：** 给定一组单词和外星人字母表的字符顺序，返回这些单词按该顺序是否字典序排序。

**思路：** 用顺序字符串建 `char -> rank` 哈希表。两两比较相邻单词——找首个不同字符比 rank；若一个是另一个的前缀且更长则返回 false。O(total chars)。Meta 常用热身题。

**Python：**
```python
def is_alien_sorted(words: list[str], order: str) -> bool:
    rank: dict[str, int] = {c: i for i, c in enumerate(order)}
    for a, b in zip(words, words[1:]):
        for ca, cb in zip(a, b):
            if rank[ca] != rank[cb]:
                if rank[ca] > rank[cb]:
                    return False
                break
        else:
            if len(a) > len(b):
                return False
    return True
```

**TypeScript：**
```typescript
function isAlienSorted(words: string[], order: string): boolean {
  const rank = new Map<string, number>();
  for (let i = 0; i < order.length; i++) rank.set(order[i], i);
  const cmp = (a: string, b: string): boolean => {
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) {
      if (a[i] !== b[i]) return rank.get(a[i])! <= rank.get(b[i])!;
    }
    return a.length <= b.length;
  };
  for (let i = 1; i < words.length; i++) if (!cmp(words[i - 1], words[i])) return false;
  return true;
}
```

**Java：**
```java
boolean isAlienSorted(String[] words, String order) {
    int[] rank = new int[26];
    for (int i = 0; i < order.length(); i++) rank[order.charAt(i) - 'a'] = i;
    for (int i = 1; i < words.length; i++) {
        String a = words[i - 1], b = words[i];
        int n = Math.min(a.length(), b.length()), j = 0;
        while (j < n && a.charAt(j) == b.charAt(j)) j++;
        if (j == n) { if (a.length() > b.length()) return false; }
        else if (rank[a.charAt(j) - 'a'] > rank[b.charAt(j) - 'a']) return false;
    }
    return true;
}
```

**要点：**
- 预先建立字符到 rank 的映射，比较为 O(1)。
- 前缀规则：当一词是另一词的前缀时，短的必须在前。
- 时间 O(总字符数)，空间 O(字母表)。

**常见追问：**
- 从一组排好序的词反推字母表序（拓扑排序）。
- 在线查询：词流式到达，逐个判定。
- 多字符“字母”（digraph）——推广比较循环。
- 大小写无关或带音标字符——讨论归一化。

**常见坑：**
- 漏掉前缀规则：等长前缀下短串必须在前。
- 在比较循环里反复建 rank，而不是一次性预建。

**标签：** #algorithm

---

### 2. 验证回文字符串 II

**难度：** 简单
**主题：** strings, two-pointer, greedy
**岗位：** SWE
**级别：** L3-L4

**问题：** 给定字符串 `s`，最多删一个字符后是否能成为回文。

**思路：** 两端双指针。字符不同时，尝试跳过左或跳过右，判断剩余是否回文。O(n) 时间，O(1) 空间。注意：只能跳一次，不是每边一次。

**Python：**
```python
def valid_palindrome(s: str) -> bool:
    def is_pal(l: int, r: int) -> bool:
        while l < r:
            if s[l] != s[r]:
                return False
            l += 1
            r -= 1
        return True
    l, r = 0, len(s) - 1
    while l < r:
        if s[l] != s[r]:
            return is_pal(l + 1, r) or is_pal(l, r - 1)
        l += 1
        r -= 1
    return True
```

**TypeScript：**
```typescript
function validPalindrome(s: string): boolean {
  const isPal = (l: number, r: number): boolean => {
    while (l < r) {
      if (s[l] !== s[r]) return false;
      l++; r--;
    }
    return true;
  };
  let l = 0, r = s.length - 1;
  while (l < r) {
    if (s[l] !== s[r]) return isPal(l + 1, r) || isPal(l, r - 1);
    l++; r--;
  }
  return true;
}
```

**Java：**
```java
boolean validPalindrome(String s) {
    int l = 0, r = s.length() - 1;
    while (l < r) {
        if (s.charAt(l) != s.charAt(r)) return isPal(s, l + 1, r) || isPal(s, l, r - 1);
        l++; r--;
    }
    return true;
}
private boolean isPal(String s, int l, int r) {
    while (l < r) {
        if (s.charAt(l) != s.charAt(r)) return false;
        l++; r--;
    }
    return true;
}
```

**要点：**
- 全程只允许跳过一次，在首次不匹配时使用。
- 时间 O(n)，空间 O(1)——回文检查单遍完成。
- 边界：空串或单字符天然为回文。

**常见追问：**
- 允许最多 k 次删除而不是 1 次。
- 返回删除后实际得到的回文字符串。
- 忽略大小写与标点——叠加 Valid Palindrome I 的逻辑。
- 字符流式到来——边读边判定。

**常见坑：**
- 双侧各跳一次（共两次）而不是总共一次。
- 跳过后重新检查整串，而不是剩余子串。

**标签：** #algorithm

---

### 3. 和为 K 的子数组

**难度：** 中等
**主题：** arrays, hashmap, prefix-sum
**岗位：** SWE
**级别：** L3-L4

**问题：** 给定整数数组 `nums` 和整数 `k`，返回和等于 `k` 的子数组总数。

**思路：** 前缀和 + 哈希表。对每个下标，以此结尾且和为 `k` 的子数组数 = 之前出现过的 `prefix - k` 的次数。初始化 map `{0: 1}`。O(n) 时间，O(n) 空间。有负数时滑窗失效——这就是难点。

**Python：**
```python
def subarray_sum(nums: list[int], k: int) -> int:
    counts: dict[int, int] = {0: 1}
    prefix = ans = 0
    for x in nums:
        prefix += x
        ans += counts.get(prefix - k, 0)
        counts[prefix] = counts.get(prefix, 0) + 1
    return ans
```

**TypeScript：**
```typescript
function subarraySum(nums: number[], k: number): number {
  const counts = new Map<number, number>([[0, 1]]);
  let prefix = 0, ans = 0;
  for (const x of nums) {
    prefix += x;
    ans += counts.get(prefix - k) ?? 0;
    counts.set(prefix, (counts.get(prefix) ?? 0) + 1);
  }
  return ans;
}
```

**Java：**
```java
int subarraySum(int[] nums, int k) {
    Map<Integer, Integer> counts = new HashMap<>();
    counts.put(0, 1);
    int prefix = 0, ans = 0;
    for (int x : nums) {
        prefix += x;
        ans += counts.getOrDefault(prefix - k, 0);
        counts.merge(prefix, 1, Integer::sum);
    }
    return ans;
}
```

**要点：**
- 初始 `{0: 1}` 用以计入从下标 0 开始的子数组。
- 计数应在累加答案之后更新，避免重复计数。
- 时间 O(n)，空间 O(n)；与滑窗不同，能处理负数。

**常见追问：**
- 返回一个/所有满足条件的子数组，而不仅是计数。
- 二维版本——和为 k 的子矩阵数。
- 流式 nums——但删除元素难处理。
- 和为 k 的倍数——不同问题变体。

**常见坑：**
- 漏掉 `{0: 1}` 初值；从下标 0 起步的子数组会丢。
- 在累加答案前更新前缀计数，会把零和子数组重复计数。

**标签：** #algorithm

---

### 4. 二叉树的右视图

**难度：** 中等
**主题：** tree, bfs, dfs
**岗位：** SWE
**级别：** L3-L4

**问题：** 给定二叉树，返回从右侧（上到下）可见的节点值。

**思路：** BFS 逐层，取每层最后一个节点。或者 DFS 右优先，记录每个深度第一次见到的节点。O(n)。边界：该层没有右兄弟时，左侧节点也算可见。

**Python：**
```python
from collections import deque

def right_side_view(root: TreeNode | None) -> list[int]:
    if not root:
        return []
    out: list[int] = []
    q: deque[TreeNode] = deque([root])
    while q:
        for i in range(len(q)):
            node = q.popleft()
            if i == len(q):  # last in level after popping
                out.append(node.val)
            if node.left: q.append(node.left)
            if node.right: q.append(node.right)
    return out
```

**TypeScript：**
```typescript
function rightSideView(root: TreeNode | null): number[] {
  if (!root) return [];
  const out: number[] = [];
  let q: TreeNode[] = [root];
  while (q.length) {
    const next: TreeNode[] = [];
    for (let i = 0; i < q.length; i++) {
      const n = q[i];
      if (i === q.length - 1) out.push(n.val);
      if (n.left) next.push(n.left);
      if (n.right) next.push(n.right);
    }
    q = next;
  }
  return out;
}
```

**Java：**
```java
List<Integer> rightSideView(TreeNode root) {
    List<Integer> out = new ArrayList<>();
    if (root == null) return out;
    Deque<TreeNode> q = new ArrayDeque<>();
    q.offer(root);
    while (!q.isEmpty()) {
        int size = q.size();
        for (int i = 0; i < size; i++) {
            TreeNode n = q.poll();
            if (i == size - 1) out.add(n.val);
            if (n.left != null) q.offer(n.left);
            if (n.right != null) q.offer(n.right);
        }
    }
    return out;
}
```

**要点：**
- 每层 BFS 最后访问的节点即右视图。
- DFS 右优先亦可：记录每层首个节点。
- 时间 O(n)，队列空间 O(宽度)。

**常见追问：**
- 左视图——镜像方向，同思路。
- 顶视图/底视图——需要带列索引的 BFS。
- 边界视图（左边 + 叶子 + 右边）。
- 推广到 N 叉树。

**常见坑：**
- Python 中 pop 后用 `i == len(q)` 易出错；提前抓 `size = len(q)` 更稳。
- DFS 先左后右仍记录会被覆盖——顺序必须右优先。

**标签：** #algorithm

---

### 5. 最接近原点的 K 个点

**难度：** 中等
**主题：** heap, quickselect, sorting
**岗位：** SWE
**级别：** L3-L4

**问题：** 给定 2D 平面上的点数组，返回距离原点 (0,0) 最近的 `k` 个点。

**思路：** 按距离的平方维护大小为 k 的大顶堆——每点入堆，大小超 k 时弹出。O(n log k)。要平均更优用 Quickselect（Hoare 分区）按距离平方，平均 O(n)，最坏 O(n²)。跳过开方；距离平方保序。

**Python：**
```python
import heapq

def k_closest(points: list[list[int]], k: int) -> list[list[int]]:
    heap: list[tuple[int, list[int]]] = []
    for p in points:
        d = -(p[0] * p[0] + p[1] * p[1])  # negate for max-heap
        if len(heap) < k:
            heapq.heappush(heap, (d, p))
        elif d > heap[0][0]:
            heapq.heapreplace(heap, (d, p))
    return [p for _, p in heap]
```

**TypeScript：**
```typescript
function kClosest(points: number[][], k: number): number[][] {
  // sort-based O(n log n) — simple and fast in practice for moderate n
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
- 比较距离平方即可，省去开方。
- 堆法 O(n log k)；快速选择平均 O(n)。
- Python 用最小堆时取负值模拟最大堆。

**常见追问：**
- 点流——用有界堆在线维护 top-k。
- 距离度量换为曼哈顿或 Chebyshev——换比较器。
- 3D 点或带权点——推广距离函数。
- 最远 k 个点而非最近——翻转堆。

**常见坑：**
- 调用 sqrt——慢且对排序毫无意义。
- 用最小堆只 pop 最小，最后留下的是最远 k 个。

**标签：** #algorithm

---

### 6. 按权重随机选择

**难度：** 中等
**主题：** binary-search, prefix-sum, randomization
**岗位：** SWE
**级别：** L3-L4

**问题：** 给定正整数权重数组 `w`，实现 `pickIndex()` 以概率 `w[i] / sum(w)` 返回下标 `i`。

**思路：** 预计算前缀和。`pickIndex` 时在 `[1, total]` 随机一个数，对前缀和数组二分找下界。构建 O(n)，选取 O(log n)。边界：权重可能为 0，要优雅处理。

**Python：**
```python
import random
from bisect import bisect_left

class WeightedRandom:
    def __init__(self, w: list[int]) -> None:
        self.prefix: list[int] = []
        s = 0
        for x in w:
            s += x
            self.prefix.append(s)
        self.total = s

    def pick_index(self) -> int:
        target = random.randint(1, self.total)
        return bisect_left(self.prefix, target)
```

**TypeScript：**
```typescript
class WeightedRandom {
  private prefix: number[] = [];
  private total = 0;
  constructor(w: number[]) {
    let s = 0;
    for (const x of w) { s += x; this.prefix.push(s); }
    this.total = s;
  }
  pickIndex(): number {
    const target = Math.floor(Math.random() * this.total) + 1;
    let lo = 0, hi = this.prefix.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.prefix[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }
}
```

**Java：**
```java
class WeightedRandom {
    private final int[] prefix;
    private final int total;
    private final Random rng = new Random();
    WeightedRandom(int[] w) {
        prefix = new int[w.length];
        int s = 0;
        for (int i = 0; i < w.length; i++) { s += w[i]; prefix[i] = s; }
        total = s;
    }
    int pickIndex() {
        int target = rng.nextInt(total) + 1;
        int lo = 0, hi = prefix.length - 1;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (prefix[mid] < target) lo = mid + 1; else hi = mid;
        }
        return lo;
    }
}
```

**要点：**
- 前缀和把一次均匀采样映射为按权重的选择。
- 用下界二分定位到正确的区间。
- 构建 O(n)，每次选取 O(log n)。

**常见追问：**
- 权重运行时变化——用 Fenwick 树做 O(log n) 更新，免重建。
- 浮点权重——会遇到什么精度问题？
- 不放回采样 k 个。
- 桶数十亿级的离散分布——alias method，O(n) 预处理后 O(1) 抽取。

**常见坑：**
- `randint(0, total)` 而非 `randint(1, total)`——首下标概率有偏差。
- 用上界二分而不是下界——会选到错误桶。

**标签：** #algorithm

---

### 7. 合并区间

**难度：** 中等
**主题：** arrays, sorting, intervals
**岗位：** SWE
**级别：** L3-L4

**问题：** 给定区间列表，合并所有重叠区间并返回结果。

**思路：** 按 start 排序。遍历；若 next.start <= current.end，则把 current.end 扩为 max(current.end, next.end)，否则压入 current 并开新区间。O(n log n)。变体：插入到已有序数组、统计员工的共同空闲时间。

**Python：**
```python
def merge_intervals(intervals: list[list[int]]) -> list[list[int]]:
    intervals.sort(key=lambda x: x[0])
    out: list[list[int]] = []
    for iv in intervals:
        if out and iv[0] <= out[-1][1]:
            out[-1][1] = max(out[-1][1], iv[1])
        else:
            out.append(iv[:])
    return out
```

**TypeScript：**
```typescript
function mergeIntervals(intervals: number[][]): number[][] {
  intervals.sort((a, b) => a[0] - b[0]);
  const out: number[][] = [];
  for (const iv of intervals) {
    if (out.length && iv[0] <= out[out.length - 1][1]) {
      out[out.length - 1][1] = Math.max(out[out.length - 1][1], iv[1]);
    } else {
      out.push([...iv]);
    }
  }
  return out;
}
```

**Java：**
```java
int[][] mergeIntervals(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
    List<int[]> out = new ArrayList<>();
    for (int[] iv : intervals) {
        if (!out.isEmpty() && iv[0] <= out.get(out.size() - 1)[1]) {
            out.get(out.size() - 1)[1] = Math.max(out.get(out.size() - 1)[1], iv[1]);
        } else {
            out.add(iv.clone());
        }
    }
    return out.toArray(new int[0][]);
}
```

**要点：**
- 按起点排序后，是否重叠只需一次比较。
- 用 max 扩展终点以处理嵌套区间。
- 时间 O(n log n)，输出 O(n)。

**常见追问：**
- 把单个区间插入到已有序列表（Insert Interval）。
- 求多个员工日程的共同空闲。
- 流式区间——用平衡二叉树在线维护合并集合。
- 区间带 payload——合并时 payload 如何处理。

**常见坑：**
- 按 end 而不是 start 排序——重叠判断失效。
- 直接复用输入区间引用而不是克隆，污染输入。

**标签：** #algorithm

---

### 8. 二叉树的最近公共祖先

**难度：** 中等
**主题：** tree, dfs, recursion
**岗位：** SWE
**级别：** L3-L4

**问题：** 给定二叉树和两个节点 `p`、`q`，找它们的最近公共祖先。节点不是 BST；没有父指针。

**思路：** 递归 DFS——若当前是 `p` 或 `q` 返回当前，否则左右递归。若两侧都非空，当前节点即 LCA。否则返回非空那侧。O(n)。追问：给父指针（类似环检测的双指针）、`p` 可能不存在（返回 null）、`p` 和 `q` 之间的距离。

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
TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    if (root == null || root == p || root == q) return root;
    TreeNode l = lowestCommonAncestor(root.left, p, q);
    TreeNode r = lowestCommonAncestor(root.right, p, q);
    if (l != null && r != null) return root;
    return l != null ? l : r;
}
```

**要点：**
- 若节点本身就是 p 或 q，它可以是自身的 LCA。
- 两侧都非空说明当前节点把 p 和 q 分开了。
- 时间 O(n)，递归栈 O(h)。

**常见追问：**
- 给父指针——双指针向上爬直到相遇。
- p 可能不在树里——需检测并返回 null。
- 多节点——一组节点的 LCA。
- BST 变体——用排序性质剪枝至 O(h)。

**常见坑：**
- 只要一侧非空就返回，不等两侧都判定。
- 把节点的相等 (`==`) 与同一性 (`is`) 混淆。

**标签：** #algorithm

---

### 9. 设计 News Feed

**难度：** 困难
**主题：** system-design, feed-ranking, fanout, caching
**岗位：** 高级 SWE
**级别：** L5

**问题：** 设计 Facebook News Feed。覆盖排序、发布、读取。

**思路：** 两种模型：**push（写时扇出）**——X 发帖时写到所有 X 的 follower 收件箱；读延迟好，但对大 V 不适用。**pull（读时扇出）**——加载 feed 时拉取所有关注者的近期帖，合并，排序；对活跃用户开销大。**混合**——普通用户 push，大 V pull，读时合并。排序：候选生成（近期 + 相关）→ ML 排序（互动信号）。每用户 top-N 缓存到 Redis（带 TTL）。讨论写放大、冷缓存、排序模型新鲜度。

**常见追问：**
- 冷启动用户（无关注）——推荐驱动的 feed。
- 实时信号（刚刚的点赞）影响排序——在哪里流走？
- 弱网/低端机的 feed 个性化。
- 每屏广告插入预算与跨会话节奏。
- “为什么看到这个”透明度——排序时记什么日志。

**常见坑：**
- 纯写时扇出——对大 V 粉丝写放大严重，存储成本爆炸。
- 预排序 feed 缓存过久——错过新鲜爆款内容，体验陷于陈旧。

**标签：** #system-design

---

### 10. 设计 Instagram

**难度：** 困难
**主题：** system-design, blob-storage, cdn, sharding, feed
**岗位：** 高级 SWE
**级别：** L5

**问题：** 设计 Instagram：照片上传、个人主页、信息流、按 hashtag 搜索。

**思路：** 照片 → 对象存储（类 S3）+ CDN。元数据按 user_id 分片到关系型存储。Feed：push/pull 混合（同 News Feed）。Hashtag 搜索：hashtag → 近期帖 ID 的倒排索引，存搜索优化存储（Elasticsearch）。点赞/评论：带回写缓存的计数器（最终一致 OK）。讨论：图片缩放管道（上传时异步生成缩略图）、删除时 CDN 缓存失效、爆款帖处理（CDN 边缘 + 只读副本）。

**常见追问：**
- Story（24 小时过期）——TTL 存储 + 临时 feed。
- 在同套基建上做私信——转向消息系统设计。
- Reels / 视频接入——转码管道 + 自适应码率。
- 主页隐私与 shadow-ban——过滤在哪里生效？
- 合规：版权下架与全球 CDN 失效。

**常见坑：**
- 把图片与元数据放在同一行——两者增长速率完全不同。
- 没有异步缩放管道——上传同步执行，慢且脆弱。

**标签：** #system-design

---

### 11. 设计 Messenger / WhatsApp

**难度：** 困难
**主题：** system-design, websockets, end-to-end-encryption, pub-sub, mobile
**岗位：** 高级 SWE
**级别：** L5

**问题：** 设计支持端到端加密的实时消息系统（1:1 + 群聊）。

**思路：** 每个客户端一条持久 WebSocket（移动端为省电用 MQTT），按 user_id 分片粘到某个网关。消息流：网关 → Kafka → fanout → 接收方网关。密文存按 `(chat_id, ts)` 分片的消息存储。E2E：Signal 协议（X3DH + double ratchet）；服务端从不见明文。送达回执：客户端 ACK 给网关，网关更新状态。群聊：小群按接收方逐个加密，大群用 sender keys。讨论离线送达（push 通知）、多设备同步。

**标签：** #system-design

---

### 12. 设计 URL 短链（bit.ly）

**难度：** 中等
**主题：** system-design, hashing, sharding, base62
**岗位：** SWE
**级别：** L3-L4

**问题：** 设计类 bit.ly 的 URL 短链。总量 1000 亿，10 万/s 创建，1000 万/s 跳转。

**思路：** 生成 7 字符 base62 key（62^7 ≈ 3.5T）。两种方案：hash(long_url)[:7] 配冲突重试，或中央计数器（ZooKeeper 给每台服务器分配段，把计数器编码为 base62）。`key -> long_url` 存分片 KV（Cassandra）。重度读缓存（Redis）；热 key 的 301 走 CDN。讨论自定义别名、分析数据（异步事件流）、301 vs 302 的权衡（302 可以追踪点击）。

**标签：** #system-design

---

### 13. 设计 Facebook Live / 直播评论

**难度：** 困难
**主题：** system-design, streaming, pub-sub, fanout, websockets
**岗位：** 高级 SWE
**级别：** L5

**问题：** 设计 Facebook Live 的实时评论流，单场直播百万级观众同时评论。

**思路：** 视频：HLS 分片推到 CDN（5-10s 延迟可接受）。评论是难点——单场可能 1M+ 同时在线评论。架构：观众 WebSocket 接边缘节点；评论发布到单场视频的 pub/sub topic（Kafka）；边缘节点订阅并扇出给所连接的观众。采样/限速：极端规模下展示热评 + 随机样本，而非全部。异步持久化到 DB 以便回放。讨论垃圾过滤（同步 ML 评分）和不良评论审核。

**标签：** #system-design

---

### 14. 设计 Top K 热门 hashtag

**难度：** 困难
**主题：** system-design, streaming, count-min-sketch, heap
**岗位：** 高级 SWE
**级别：** L5

**问题：** 设计返回最近 1 小时 top 10 热门 hashtag、每分钟刷新的系统。

**思路：** 推文/帖经 Kafka → Flink/Spark Streaming 任务。每分钟用 Count-Min Sketch（近似计数、内存有界）按 hashtag 计数，维护大小为 10 的小顶堆。滚动一小时窗口 = 60 个分钟桶；查询时聚合。规模化：按 `hash(hashtag)` 分到 worker 上，再合并各 worker 的 top-K。讨论 CMS 的精度与内存权衡、倾斜流量（大 V hashtag）、"热门"可能指速度而非绝对计数。

**标签：** #system-design

---

### 15. 讲一个你影响力最大的项目

**难度：** 中等
**主题：** behavioral, impact, ownership
**岗位：** SWE
**级别：** L3-L4

**问题：** 介绍你最自豪的项目。影响是什么？

**思路：** STAR，**重点是可量化的影响**。Meta 文化崇拜指标。"X 提升了 Y%"/"每周节省 N 工程师小时"/"p99 延迟从 A 降到 B"。说不出数字故事就弱。准备好回答"重做你会怎么改？"和"最难的权衡是什么？"。

**标签：** #behavioral

---

### 16. 与经理意见分歧的经历

**难度：** 中等
**主题：** behavioral, conflict, push-back
**岗位：** SWE
**级别：** L3-L4

**问题：** 讲一次你和经理意见分歧。你怎么处理的？

**思路：** Meta 想看到你建设性地反对——默默赞成是红旗。展示：(1) 你带数据而非情绪，(2) 你在 1:1 里说而不是公开场合，(3) 决定不利于你时你也 commit（"disagree and commit"）。避免把经理描绘成无能的故事。

**标签：** #behavioral

---

### 17. 你冒过险的经历

**难度：** 中等
**主题：** behavioral, move-fast, risk-taking
**岗位：** SWE
**级别：** L3-L4

**问题：** 讲一次你在项目中冒了经过权衡的风险。结果如何？

**思路：** 对应 Meta 的 "move fast" 价值观。展示：(1) 你清楚可能出什么问题并有回滚预案，(2) 你不事事请示，(3) 你为结果负责——无论好坏。即便风险*没成*的故事也很有分量，只要你能说出学到了什么。

**标签：** #behavioral

---

### 18. 你指导他人或改进团队的经历

**难度：** 中等
**主题：** behavioral, leadership, mentorship
**岗位：** 高级 SWE
**级别：** L5

**问题：** 讲一次你帮队友成长或改进团队工作方式的经历。

**思路：** Senior+ 信号——Meta 要力放大器。展示：(1) 你改变了哪个具体的人/流程，(2) 可量化的结果（对方晋升、团队速度、on-call 负担），(3) 你是自发的而非被要求。避免泛泛的"我做 code review"——挑一个具体情境。

**标签：** #behavioral

---

### 19. Web 性能：优化 Time to Interactive

**难度：** 困难
**主题：** web-perf, frontend, react, ssr
**岗位：** 前端
**级别：** L5

**问题：** Facebook.com 在印度中端 Android 上加载慢。讲讲你如何诊断并改进 Time to Interactive。

**思路：** 先量化：用 Lighthouse / WebPageTest，在低端设备 + 3G 配置下跑。常见收益：(1) 减小 JS 包（按路由 code splitting、tree-shaking），(2) defer 非关键 JS，(3) 内联关键 CSS，(4) SSR/streaming SSR（现代 Meta 栈用 RSC）以在 hydration 前先出 paint，(5) 图片懒加载 + 响应式 `srcset`，(6) HTTP/2 push 或字体 `<link rel=preload>`。提一句 Meta 特有的 BigPipe / 部分 hydration。讨论用 RUM、Core Web Vitals 度量影响和发布策略（A/B 测试）。

**标签：** #domain-knowledge

---

### 20. 产品 sense：如何为 Instagram 新用户设计一个功能？

**难度：** 中等
**主题：** product-sense, onboarding, metrics
**岗位：** 前端
**级别：** L5

**问题：** Instagram 新用户第一周流失率高。提出一个提升 7 日留存的功能。你怎么衡量成功？

**思路：** 先诊断：为什么流失？（feed 是空的、没朋友、没发帖。）挑一个假设并提对应功能——如"onboarding 时基于兴趣推荐关注，让第一天就有 feed 内容"。定义成功指标：7 日留存作主指标，每周会话数为辅，关注数作 proxy。A/B 测试设计：留出组、1-2% 灰度、2 周时长、最小可检测效应。注意反指标（过度关注 → 垃圾举报）。Meta 喜欢清晰的指标定义。

**标签：** #domain-knowledge

---

### 21. 插入区间

**难度：** 中等
**主题：** 数组, 区间, 排序
**岗位：** SWE
**级别：** E3-E5

**问题：** 给定一组按起始时间排序、互不重叠的区间和一个新区间，将新区间插入并在必要时合并，返回结果列表。

**思路：** 单次遍历：先把所有结束在 new.start 之前的区间追加进去，再把所有与 new 重叠的区间合并（扩展 new.start/end），最后追加剩余的。O(n) 时间，O(n) 输出。无需排序——输入已有序。

**Python：**
```python
def insert(intervals: list[list[int]], new: list[int]) -> list[list[int]]:
    out: list[list[int]] = []
    i, n = 0, len(intervals)
    while i < n and intervals[i][1] < new[0]:
        out.append(intervals[i]); i += 1
    while i < n and intervals[i][0] <= new[1]:
        new = [min(new[0], intervals[i][0]), max(new[1], intervals[i][1])]
        i += 1
    out.append(new)
    out.extend(intervals[i:])
    return out
```

**TypeScript：**
```typescript
function insertInterval(intervals: number[][], newIv: number[]): number[][] {
  const out: number[][] = [];
  let i = 0;
  const n = intervals.length;
  while (i < n && intervals[i][1] < newIv[0]) out.push(intervals[i++]);
  while (i < n && intervals[i][0] <= newIv[1]) {
    newIv = [Math.min(newIv[0], intervals[i][0]), Math.max(newIv[1], intervals[i][1])];
    i++;
  }
  out.push(newIv);
  while (i < n) out.push(intervals[i++]);
  return out;
}
```

**Java：**
```java
int[][] insertInterval(int[][] intervals, int[] newIv) {
    List<int[]> out = new ArrayList<>();
    int i = 0, n = intervals.length;
    while (i < n && intervals[i][1] < newIv[0]) out.add(intervals[i++]);
    while (i < n && intervals[i][0] <= newIv[1]) {
        newIv = new int[]{Math.min(newIv[0], intervals[i][0]), Math.max(newIv[1], intervals[i][1])};
        i++;
    }
    out.add(newIv);
    while (i < n) out.add(intervals[i++]);
    return out.toArray(new int[0][]);
}
```

**要点：**
- 分三段：之前、重叠、之后。
- 仅在重叠阶段扩展 new 的边界。
- 输入已有序，整体 O(n)。

**标签：** #algorithm

---

### 22. 移动零

**难度：** 中等
**主题：** 数组, 双指针
**岗位：** SWE
**级别：** E3-E5

**问题：** 给定整数数组 `nums`，把所有 `0` 移到末尾且保持非零元素相对顺序。原地完成。

**思路：** 双指针：`write` 指向下一个非零位置。`read` 遍历，当 `nums[read] != 0` 时与 `nums[write++]` 交换。O(n) 时间，O(1) 空间。常见热身题；面试官会追问如何最小化写次数。

**Python：**
```python
def move_zeroes(nums: list[int]) -> None:
    write = 0
    for read in range(len(nums)):
        if nums[read] != 0:
            nums[write], nums[read] = nums[read], nums[write]
            write += 1
```

**TypeScript：**
```typescript
function moveZeroes(nums: number[]): void {
  let write = 0;
  for (let read = 0; read < nums.length; read++) {
    if (nums[read] !== 0) {
      [nums[write], nums[read]] = [nums[read], nums[write]];
      write++;
    }
  }
}
```

**Java：**
```java
void moveZeroes(int[] nums) {
    int write = 0;
    for (int read = 0; read < nums.length; read++) {
        if (nums[read] != 0) {
            int tmp = nums[write];
            nums[write] = nums[read];
            nums[read] = tmp;
            write++;
        }
    }
}
```

**要点：**
- 双指针保持非零元素的相对顺序。
- 交换法比先填后置零写次数更少。
- 时间 O(n)，额外空间 O(1)。

**标签：** #algorithm

---

### 23. 移除无效的括号

**难度：** 中等
**主题：** 字符串, 栈, 贪心
**岗位：** SWE
**级别：** E3-E5

**问题：** 给定包含字母和括号的字符串，删除最少数量的括号使其有效。返回任意一个有效结果。

**思路：** 第一遍：用栈记录未匹配 `(` 的下标；遇 `)` 且栈空则该位置标记删除。扫描完后栈里剩的就是未匹配的 `(`。第二遍：跳过被标记下标拼新串。O(n) 时间/空间。

**Python：**
```python
def min_remove_to_make_valid(s: str) -> str:
    chars = list(s)
    stack: list[int] = []
    for i, c in enumerate(chars):
        if c == "(":
            stack.append(i)
        elif c == ")":
            if stack:
                stack.pop()
            else:
                chars[i] = ""
    for i in stack:
        chars[i] = ""
    return "".join(chars)
```

**TypeScript：**
```typescript
function minRemoveToMakeValid(s: string): string {
  const chars = s.split("");
  const stack: number[] = [];
  for (let i = 0; i < chars.length; i++) {
    if (chars[i] === "(") stack.push(i);
    else if (chars[i] === ")") {
      if (stack.length) stack.pop();
      else chars[i] = "";
    }
  }
  for (const i of stack) chars[i] = "";
  return chars.join("");
}
```

**Java：**
```java
String minRemoveToMakeValid(String s) {
    StringBuilder sb = new StringBuilder(s);
    Deque<Integer> stack = new ArrayDeque<>();
    for (int i = 0; i < sb.length(); i++) {
        char c = sb.charAt(i);
        if (c == '(') stack.push(i);
        else if (c == ')') {
            if (!stack.isEmpty()) stack.pop();
            else sb.setCharAt(i, '*');
        }
    }
    while (!stack.isEmpty()) sb.setCharAt(stack.pop(), '*');
    return sb.toString().replace("*", "");
}
```

**要点：**
- 栈记录未匹配左括号的下标。
- 拼接前清空非法位置即可。
- 时间与空间均为 O(n)。

**标签：** #algorithm

---

### 24. 二叉树的垂直遍历

**难度：** 中等
**主题：** 树, BFS, 哈希
**岗位：** SWE
**级别：** E3-E5

**问题：** 给定一棵二叉树，返回它的垂直序遍历。从上到下，同一行从左到右。

**思路：** BFS 同时跟踪列号（根=0，左=col-1，右=col+1）。用哈希表按列号分桶；记录 min/max 列。按 [min..max] 顺序输出。BFS（而非 DFS）天然保证同列时按上下/左右排序。O(n)。

**Python：**
```python
from collections import defaultdict, deque

def vertical_order(root: TreeNode | None) -> list[list[int]]:
    if not root:
        return []
    cols: dict[int, list[int]] = defaultdict(list)
    q: deque[tuple[TreeNode, int]] = deque([(root, 0)])
    lo = hi = 0
    while q:
        node, c = q.popleft()
        cols[c].append(node.val)
        lo, hi = min(lo, c), max(hi, c)
        if node.left: q.append((node.left, c - 1))
        if node.right: q.append((node.right, c + 1))
    return [cols[c] for c in range(lo, hi + 1)]
```

**TypeScript：**
```typescript
function verticalOrder(root: TreeNode | null): number[][] {
  if (!root) return [];
  const cols = new Map<number, number[]>();
  const q: [TreeNode, number][] = [[root, 0]];
  let lo = 0, hi = 0;
  while (q.length) {
    const [node, c] = q.shift()!;
    if (!cols.has(c)) cols.set(c, []);
    cols.get(c)!.push(node.val);
    lo = Math.min(lo, c); hi = Math.max(hi, c);
    if (node.left) q.push([node.left, c - 1]);
    if (node.right) q.push([node.right, c + 1]);
  }
  const out: number[][] = [];
  for (let c = lo; c <= hi; c++) out.push(cols.get(c) ?? []);
  return out;
}
```

**Java：**
```java
List<List<Integer>> verticalOrder(TreeNode root) {
    List<List<Integer>> out = new ArrayList<>();
    if (root == null) return out;
    Map<Integer, List<Integer>> cols = new HashMap<>();
    Deque<int[]> q = new ArrayDeque<>();
    Deque<TreeNode> nq = new ArrayDeque<>();
    q.offer(new int[]{0}); nq.offer(root);
    int lo = 0, hi = 0;
    while (!q.isEmpty()) {
        int c = q.poll()[0];
        TreeNode n = nq.poll();
        cols.computeIfAbsent(c, k -> new ArrayList<>()).add(n.val);
        lo = Math.min(lo, c); hi = Math.max(hi, c);
        if (n.left != null) { q.offer(new int[]{c - 1}); nq.offer(n.left); }
        if (n.right != null) { q.offer(new int[]{c + 1}); nq.offer(n.right); }
    }
    for (int c = lo; c <= hi; c++) out.add(cols.getOrDefault(c, new ArrayList<>()));
    return out;
}
```

**要点：**
- 列号：左 = 父-1，右 = 父+1。
- BFS 天然保证上下/左右的排序。
- 时间与空间均为 O(n)。

**标签：** #algorithm

---

### 25. 二叉树的直径

**难度：** 中等
**主题：** 树, DFS, 递归
**岗位：** SWE
**级别：** E3-E5

**问题：** 给定一棵二叉树，返回任意两节点之间最长路径的长度（边数）。路径可不经过根。

**思路：** 后序 DFS 返回高度。在每个节点：候选直径 = 左高 + 右高；更新全局最大值。返回 1 + max(左, 右) 作为该节点高度。O(n) 时间，O(h) 递归栈。

**Python：**
```python
def diameter_of_binary_tree(root: TreeNode | None) -> int:
    best = 0
    def depth(node: TreeNode | None) -> int:
        nonlocal best
        if node is None:
            return 0
        l = depth(node.left)
        r = depth(node.right)
        best = max(best, l + r)
        return 1 + max(l, r)
    depth(root)
    return best
```

**TypeScript：**
```typescript
function diameterOfBinaryTree(root: TreeNode | null): number {
  let best = 0;
  const depth = (n: TreeNode | null): number => {
    if (!n) return 0;
    const l = depth(n.left);
    const r = depth(n.right);
    best = Math.max(best, l + r);
    return 1 + Math.max(l, r);
  };
  depth(root);
  return best;
}
```

**Java：**
```java
private int best = 0;
int diameterOfBinaryTree(TreeNode root) {
    best = 0;
    depth(root);
    return best;
}
private int depth(TreeNode n) {
    if (n == null) return 0;
    int l = depth(n.left), r = depth(n.right);
    best = Math.max(best, l + r);
    return 1 + Math.max(l, r);
}
```

**要点：**
- 直径以边数计，故为两侧子树高度之和。
- 在返回高度的同时更新全局最大值。
- 时间 O(n)，递归栈 O(h)。

**标签：** #algorithm

---

### 26. 二叉树的最近公共祖先 III

**难度：** 中等
**主题：** 树, 双指针, 哈希
**岗位：** SWE
**级别：** E3-E5

**问题：** 给定二叉树中两个节点 `p` 和 `q`，每个节点带 `parent` 指针（未给定根），返回它们的最近公共祖先。

**思路：** 类似环相遇的双指针。同时向上走 p 和 q；一方走到 null 时从对方起点重启。最多 2*(深度) 步在 LCA 相遇。O(h) 时间，O(1) 空间。备选：把 p 的所有祖先放入哈希集，q 向上走直到命中。

**Python：**
```python
class PNode:
    val: int
    parent: "PNode | None"

def lowest_common_ancestor_iii(p: PNode, q: PNode) -> PNode:
    a: PNode | None = p
    b: PNode | None = q
    while a is not b:
        a = a.parent if a else q
        b = b.parent if b else p
    return a  # type: ignore[return-value]
```

**TypeScript：**
```typescript
interface PNode { val: number; parent: PNode | null; }

function lowestCommonAncestorIII(p: PNode, q: PNode): PNode {
  let a: PNode | null = p, b: PNode | null = q;
  while (a !== b) {
    a = a ? a.parent : q;
    b = b ? b.parent : p;
  }
  return a!;
}
```

**Java：**
```java
class PNode { int val; PNode parent; }

PNode lowestCommonAncestorIII(PNode p, PNode q) {
    PNode a = p, b = q;
    while (a != b) {
        a = a == null ? q : a.parent;
        b = b == null ? p : b.parent;
    }
    return a;
}
```

**要点：**
- 互换起点可让两指针走过相同的总路径长度。
- 两者至多 2 * 深度 步后相遇。
- 时间 O(h)，空间 O(1)，无需哈希集合。

**标签：** #algorithm

---

### 27. Pow(x, n)

**难度：** 中等
**主题：** 数学, 递归, 二进制
**岗位：** SWE
**级别：** E3-E5

**问题：** 实现 `pow(x, n)`，其中 `x` 为 double，`n` 为 int（n 可负，可能非常大）。

**思路：** 快速幂。若 n<0，x=1/x，n=-n（注意 INT_MIN 溢出——用 long）。迭代：while n>0，若 n&1 则 result*=x；x*=x；n>>=1。O(log n) 时间，O(1) 空间。

**Python：**
```python
def my_pow(x: float, n: int) -> float:
    if n < 0:
        x, n = 1 / x, -n
    result = 1.0
    while n > 0:
        if n & 1:
            result *= x
        x *= x
        n >>= 1
    return result
```

**TypeScript：**
```typescript
function myPow(x: number, n: number): number {
  let N = n;
  if (N < 0) { x = 1 / x; N = -N; }
  let result = 1.0;
  while (N > 0) {
    if (N & 1) result *= x;
    x *= x;
    N = Math.floor(N / 2);
  }
  return result;
}
```

**Java：**
```java
double myPow(double x, int n) {
    long N = n;
    if (N < 0) { x = 1 / x; N = -N; }
    double result = 1.0;
    while (N > 0) {
        if ((N & 1) == 1) result *= x;
        x *= x;
        N >>= 1;
    }
    return result;
}
```

**要点：**
- 指数折半的同时把底数平方。
- 负指数通过取倒数转化为正指数。
- 时间 O(log |n|)，空间 O(1)。

**标签：** #algorithm

---

### 28. BST 的范围和

**难度：** 中等
**主题：** 树, DFS, BST
**岗位：** SWE
**级别：** E3-E5

**问题：** 给定 BST 的根和整数 `low`、`high`，返回所有满足 `low <= 值 <= high` 的节点之和。

**思路：** DFS 带剪枝。若 `node.val < low`，只递归右子。若 `node.val > high`，只递归左子。否则累加并左右都递归。O(n) 最坏，平衡时 O(log n)。剪枝是面试官打分点。

**Python：**
```python
def range_sum_bst(root: TreeNode | None, low: int, high: int) -> int:
    if root is None:
        return 0
    if root.val < low:
        return range_sum_bst(root.right, low, high)
    if root.val > high:
        return range_sum_bst(root.left, low, high)
    return root.val + range_sum_bst(root.left, low, high) + range_sum_bst(root.right, low, high)
```

**TypeScript：**
```typescript
function rangeSumBST(root: TreeNode | null, low: number, high: number): number {
  if (!root) return 0;
  if (root.val < low) return rangeSumBST(root.right, low, high);
  if (root.val > high) return rangeSumBST(root.left, low, high);
  return root.val + rangeSumBST(root.left, low, high) + rangeSumBST(root.right, low, high);
}
```

**Java：**
```java
int rangeSumBST(TreeNode root, int low, int high) {
    if (root == null) return 0;
    if (root.val < low) return rangeSumBST(root.right, low, high);
    if (root.val > high) return rangeSumBST(root.left, low, high);
    return root.val + rangeSumBST(root.left, low, high) + rangeSumBST(root.right, low, high);
}
```

**要点：**
- 剪掉不可能含范围内值的子树。
- 平衡 BST 平均 O(log n)，最坏 O(n)。
- 剪枝是面试官关注的差异点。

**标签：** #algorithm

---

### 29. 将 BST 转化为排序的双向链表

**难度：** 中等
**主题：** 树, DFS, 链表
**岗位：** SWE
**级别：** E3-E5

**问题：** 原地将 BST 转换为有序的循环双向链表。left 指针变成 prev，right 指针变成 next。

**思路：** 中序 DFS 用 `prev` 指针（和 `head` 记录最小值）。访问时：若 prev 存在，prev.right=node，node.left=prev；否则 head=node。prev=node。遍历完闭环：head.left=prev，prev.right=head。O(n) 时间，O(h) 栈。

**Python：**
```python
def tree_to_doubly_list(root: TreeNode | None) -> TreeNode | None:
    if not root:
        return None
    head: TreeNode | None = None
    prev: TreeNode | None = None
    def inorder(node: TreeNode) -> None:
        nonlocal head, prev
        if node.left: inorder(node.left)
        if prev:
            prev.right = node
            node.left = prev
        else:
            head = node
        prev = node
        if node.right: inorder(node.right)
    inorder(root)
    head.left = prev  # type: ignore[union-attr]
    prev.right = head  # type: ignore[union-attr]
    return head
```

**TypeScript：**
```typescript
function treeToDoublyList(root: TreeNode | null): TreeNode | null {
  if (!root) return null;
  let head: TreeNode | null = null, prev: TreeNode | null = null;
  const inorder = (n: TreeNode): void => {
    if (n.left) inorder(n.left);
    if (prev) { prev.right = n; n.left = prev; } else { head = n; }
    prev = n;
    if (n.right) inorder(n.right);
  };
  inorder(root);
  head!.left = prev; prev!.right = head;
  return head;
}
```

**Java：**
```java
private TreeNode head, prev;
TreeNode treeToDoublyList(TreeNode root) {
    if (root == null) return null;
    head = null; prev = null;
    inorder(root);
    head.left = prev; prev.right = head;
    return head;
}
private void inorder(TreeNode n) {
    if (n == null) return;
    inorder(n.left);
    if (prev != null) { prev.right = n; n.left = prev; } else { head = n; }
    prev = n;
    inorder(n.right);
}
```

**要点：**
- BST 中序即升序访问。
- 遍历时随手连接 prev 与当前节点。
- 遍历结束后再闭合首尾。

**标签：** #algorithm

---

### 30. 可看到海景的建筑

**难度：** 中等
**主题：** 数组, 栈, 单调
**岗位：** SWE
**级别：** E3-E5

**问题：** 给定一排建筑高度（海在右侧），返回能看到海的建筑下标（右侧没有更高建筑）。

**思路：** 从右往左扫描，跟踪已见的最大高度。当前 > max 时有海景；记录下标；更新 max。最后反转下标。O(n) 时间，O(1) 额外空间（除输出外）。

**Python：**
```python
def find_buildings(heights: list[int]) -> list[int]:
    out: list[int] = []
    max_h = 0
    for i in range(len(heights) - 1, -1, -1):
        if heights[i] > max_h:
            out.append(i)
            max_h = heights[i]
    out.reverse()
    return out
```

**TypeScript：**
```typescript
function findBuildings(heights: number[]): number[] {
  const out: number[] = [];
  let maxH = 0;
  for (let i = heights.length - 1; i >= 0; i--) {
    if (heights[i] > maxH) {
      out.push(i);
      maxH = heights[i];
    }
  }
  return out.reverse();
}
```

**Java：**
```java
int[] findBuildings(int[] heights) {
    List<Integer> out = new ArrayList<>();
    int maxH = 0;
    for (int i = heights.length - 1; i >= 0; i--) {
        if (heights[i] > maxH) {
            out.add(i);
            maxH = heights[i];
        }
    }
    Collections.reverse(out);
    return out.stream().mapToInt(Integer::intValue).toArray();
}
```

**要点：**
- 从右向左扫描，超过当前最大值的才能看到海。
- 末尾反转以恢复升序下标。
- 时间 O(n)，除输出外额外空间 O(1)。

**标签：** #algorithm

---

### 31. 连续的子数组和

**难度：** 中等
**主题：** 数组, 前缀和, 哈希, 数学
**岗位：** SWE
**级别：** E3-E5

**问题：** 给定整数数组 `nums` 和整数 `k`，返回是否存在长度至少为 2 的连续子数组其和是 `k` 的倍数。

**思路：** 前缀和模 k 存哈希表（保留最早下标）。若相同余数在 `j > i+1` 处再次出现，则 sum(i+1..j) % k == 0。初始化 `{0: -1}` 处理前缀本身可整除的情形。O(n)。

**Python：**
```python
def check_subarray_sum(nums: list[int], k: int) -> bool:
    seen: dict[int, int] = {0: -1}
    prefix = 0
    for i, x in enumerate(nums):
        prefix = (prefix + x) % k
        if prefix in seen:
            if i - seen[prefix] >= 2:
                return True
        else:
            seen[prefix] = i
    return False
```

**TypeScript：**
```typescript
function checkSubarraySum(nums: number[], k: number): boolean {
  const seen = new Map<number, number>([[0, -1]]);
  let prefix = 0;
  for (let i = 0; i < nums.length; i++) {
    prefix = (prefix + nums[i]) % k;
    if (seen.has(prefix)) {
      if (i - seen.get(prefix)! >= 2) return true;
    } else {
      seen.set(prefix, i);
    }
  }
  return false;
}
```

**Java：**
```java
boolean checkSubarraySum(int[] nums, int k) {
    Map<Integer, Integer> seen = new HashMap<>();
    seen.put(0, -1);
    int prefix = 0;
    for (int i = 0; i < nums.length; i++) {
        prefix = (prefix + nums[i]) % k;
        if (seen.containsKey(prefix)) {
            if (i - seen.get(prefix) >= 2) return true;
        } else {
            seen.put(prefix, i);
        }
    }
    return false;
}
```

**要点：**
- 余数相同 => 之间的子数组和可被 k 整除。
- 每个余数只保留最早下标以最大化长度。
- 初始 `{0: -1}` 使前缀本身可整除时也成立。

**标签：** #algorithm

---

### 32. 有效单词缩写

**难度：** 中等
**主题：** 字符串, 双指针
**岗位：** SWE
**级别：** E3-E5

**问题：** 给定单词和缩写（如 "internationalization" / "i12iz4n"），验证缩写是否正确扩展为该单词。

**思路：** 双指针。缩写遇到数字则解析整个整数（拒绝前导零），单词指针前进该数。否则字符必须相等。最后双方都到末尾才算通过。O(n)。

**Python：**
```python
def valid_word_abbreviation(word: str, abbr: str) -> bool:
    i = j = 0
    while i < len(word) and j < len(abbr):
        if abbr[j].isdigit():
            if abbr[j] == "0":
                return False
            n = 0
            while j < len(abbr) and abbr[j].isdigit():
                n = n * 10 + int(abbr[j])
                j += 1
            i += n
        else:
            if word[i] != abbr[j]:
                return False
            i += 1
            j += 1
    return i == len(word) and j == len(abbr)
```

**TypeScript：**
```typescript
function validWordAbbreviation(word: string, abbr: string): boolean {
  let i = 0, j = 0;
  while (i < word.length && j < abbr.length) {
    const c = abbr[j];
    if (c >= "0" && c <= "9") {
      if (c === "0") return false;
      let n = 0;
      while (j < abbr.length && abbr[j] >= "0" && abbr[j] <= "9") {
        n = n * 10 + (abbr.charCodeAt(j) - 48);
        j++;
      }
      i += n;
    } else {
      if (word[i] !== abbr[j]) return false;
      i++; j++;
    }
  }
  return i === word.length && j === abbr.length;
}
```

**Java：**
```java
boolean validWordAbbreviation(String word, String abbr) {
    int i = 0, j = 0;
    while (i < word.length() && j < abbr.length()) {
        char c = abbr.charAt(j);
        if (Character.isDigit(c)) {
            if (c == '0') return false;
            int n = 0;
            while (j < abbr.length() && Character.isDigit(abbr.charAt(j))) {
                n = n * 10 + (abbr.charAt(j) - '0');
                j++;
            }
            i += n;
        } else {
            if (word.charAt(i) != c) return false;
            i++; j++;
        }
    }
    return i == word.length() && j == abbr.length();
}
```

**要点：**
- 计数中拒绝前导零。
- 两个指针必须同时走到末尾。
- 时间 O(n)，空间 O(1)。

**标签：** #algorithm

---

### 33. 字符串相加

**难度：** 中等
**主题：** 字符串, 数学, 模拟
**岗位：** SWE
**级别：** E3-E5

**问题：** 给定两个以字符串表示的非负数，返回它们之和的字符串。不能直接转整数。

**思路：** 从右向左双指针。逐位相加带进位。追加 `(d1+d2+carry)%10`，更新进位。任一指针未到尾或仍有进位则继续。最后反转。O(max(m,n))。

**Python：**
```python
def add_strings(num1: str, num2: str) -> str:
    i, j = len(num1) - 1, len(num2) - 1
    carry = 0
    out: list[str] = []
    while i >= 0 or j >= 0 or carry:
        a = int(num1[i]) if i >= 0 else 0
        b = int(num2[j]) if j >= 0 else 0
        s = a + b + carry
        out.append(str(s % 10))
        carry = s // 10
        i -= 1
        j -= 1
    return "".join(reversed(out))
```

**TypeScript：**
```typescript
function addStrings(num1: string, num2: string): string {
  let i = num1.length - 1, j = num2.length - 1, carry = 0;
  const out: string[] = [];
  while (i >= 0 || j >= 0 || carry) {
    const a = i >= 0 ? num1.charCodeAt(i) - 48 : 0;
    const b = j >= 0 ? num2.charCodeAt(j) - 48 : 0;
    const s = a + b + carry;
    out.push(String(s % 10));
    carry = Math.floor(s / 10);
    i--; j--;
  }
  return out.reverse().join("");
}
```

**Java：**
```java
String addStrings(String num1, String num2) {
    int i = num1.length() - 1, j = num2.length() - 1, carry = 0;
    StringBuilder sb = new StringBuilder();
    while (i >= 0 || j >= 0 || carry > 0) {
        int a = i >= 0 ? num1.charAt(i) - '0' : 0;
        int b = j >= 0 ? num2.charAt(j) - '0' : 0;
        int s = a + b + carry;
        sb.append(s % 10);
        carry = s / 10;
        i--; j--;
    }
    return sb.reverse().toString();
}
```

**要点：**
- 循环条件包含 carry 以处理最高位的进位。
- 缺位时按 0 处理。
- 时间 O(max(m, n))，输出 O(max(m, n))。

**标签：** #algorithm

---

### 34. 寻找峰值

**难度：** 中等
**主题：** 二分查找, 数组
**岗位：** SWE
**级别：** E3-E5

**问题：** 给定整数数组 `nums`，`nums[i] != nums[i+1]`，找任意峰值（大于其相邻元素）。隐含 `nums[-1] = nums[n] = -inf`。O(log n)。

**思路：** 二分。比较 mid 与 mid+1；若 `nums[mid] < nums[mid+1]`，峰值在右（上升坡），lo = mid + 1；否则 hi = mid。循环至 lo==hi。O(log n)。

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
int findPeakElement(int[] nums) {
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
- 沿上升坡走，必有峰值在前。
- 边界视作 -inf，故峰值一定存在。
- 时间 O(log n)，空间 O(1)。

**标签：** #algorithm

---

### 35. 数组中的第 K 个最大元素

**难度：** 中等
**主题：** 数组, 堆, 快速选择
**岗位：** SWE
**级别：** E3-E5

**问题：** 返回未排序数组中第 k 大的元素（不要求第 k 个不同值——重复也计入）。

**思路：** 大小为 k 的小顶堆：每个元素入堆，超 k 时出堆，返回堆顶。O(n log k)。更优：快速选择第 (n-k) 小，平均 O(n)，最坏 O(n²)；随机化 pivot 避免最坏。

**Python：**
```python
import heapq

def find_kth_largest(nums: list[int], k: int) -> int:
    heap: list[int] = []
    for x in nums:
        if len(heap) < k:
            heapq.heappush(heap, x)
        elif x > heap[0]:
            heapq.heapreplace(heap, x)
    return heap[0]
```

**TypeScript：**
```typescript
function findKthLargest(nums: number[], k: number): number {
  // O(n log n) sort — simple and effective for moderate n
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
- 大小为 k 的小顶堆保留前 k 大，堆顶即第 k 大。
- 随机化 pivot 的快速选择平均为 O(n)。
- 堆解为 O(n log k)，适合流式输入。

**标签：** #algorithm

---

### 36. 移位字符串分组

**难度：** 中等
**主题：** 字符串, 哈希
**岗位：** SWE
**级别：** E3-E5

**问题：** 给定字符串列表，把可通过相同移位（每个字符循环移动相同量）得到同一序列的字符串归为一组。如 "abc","bcd","xyz" 归一组。

**思路：** 把每个字符串以首字符为基准做差并对 26 取模（如 "abc" -> "0,1,2"）做归一化。把归一化结果当作哈希表 key，值为列表。O(总字符数)。

**Python：**
```python
def group_strings(strings: list[str]) -> list[list[str]]:
    groups: dict[tuple[int, ...], list[str]] = {}
    for s in strings:
        base = ord(s[0])
        key = tuple((ord(c) - base) % 26 for c in s)
        groups.setdefault(key, []).append(s)
    return list(groups.values())
```

**TypeScript：**
```typescript
function groupStrings(strings: string[]): string[][] {
  const groups = new Map<string, string[]>();
  for (const s of strings) {
    const base = s.charCodeAt(0);
    const key = Array.from(s, c => ((c.charCodeAt(0) - base) % 26 + 26) % 26).join(",");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }
  return Array.from(groups.values());
}
```

**Java：**
```java
List<List<String>> groupStrings(String[] strings) {
    Map<String, List<String>> groups = new HashMap<>();
    for (String s : strings) {
        int base = s.charAt(0);
        StringBuilder key = new StringBuilder();
        for (char c : s.toCharArray()) {
            key.append(((c - base) % 26 + 26) % 26).append(',');
        }
        groups.computeIfAbsent(key.toString(), k -> new ArrayList<>()).add(s);
    }
    return new ArrayList<>(groups.values());
}
```

**要点：**
- 以首字符为锚点做差再对 26 取模归一化。
- 元组或字符串 key 适合哈希表分组。
- 时间与空间均为 O(总字符数)。

**标签：** #algorithm

---

### 37. 克隆图

**难度：** 中等
**主题：** 图, DFS, BFS, 哈希
**岗位：** SWE
**级别：** E3-E5

**问题：** 给定连通无向图中某节点的引用，返回深拷贝。

**思路：** DFS/BFS 配 `老 -> 新` 哈希表去重。访问节点：见过则返回克隆；否则创建克隆放入 map，再递归克隆其邻居。O(V+E)。

**Python：**
```python
class GNode:
    def __init__(self, val: int = 0, neighbors: "list[GNode] | None" = None) -> None:
        self.val = val
        self.neighbors = neighbors or []

def clone_graph(node: GNode | None) -> GNode | None:
    if not node:
        return None
    seen: dict[GNode, GNode] = {}
    def dfs(n: GNode) -> GNode:
        if n in seen:
            return seen[n]
        copy = GNode(n.val)
        seen[n] = copy
        copy.neighbors = [dfs(nb) for nb in n.neighbors]
        return copy
    return dfs(node)
```

**TypeScript：**
```typescript
class GNode {
  val: number;
  neighbors: GNode[];
  constructor(val = 0, neighbors: GNode[] = []) { this.val = val; this.neighbors = neighbors; }
}

function cloneGraph(node: GNode | null): GNode | null {
  if (!node) return null;
  const seen = new Map<GNode, GNode>();
  const dfs = (n: GNode): GNode => {
    if (seen.has(n)) return seen.get(n)!;
    const copy = new GNode(n.val);
    seen.set(n, copy);
    copy.neighbors = n.neighbors.map(dfs);
    return copy;
  };
  return dfs(node);
}
```

**Java：**
```java
class GNode { int val; List<GNode> neighbors = new ArrayList<>(); GNode(int v) { val = v; } }

GNode cloneGraph(GNode node) {
    if (node == null) return null;
    Map<GNode, GNode> seen = new HashMap<>();
    return dfs(node, seen);
}
private GNode dfs(GNode n, Map<GNode, GNode> seen) {
    if (seen.containsKey(n)) return seen.get(n);
    GNode copy = new GNode(n.val);
    seen.put(n, copy);
    for (GNode nb : n.neighbors) copy.neighbors.add(dfs(nb, seen));
    return copy;
}
```

**要点：**
- 递归前先把原 -> 克隆放入 map，避免环。
- 有向图和无向图均适用。
- 时间与空间均为 O(V + E)。

**标签：** #algorithm

---

### 38. 岛屿数量

**难度：** 中等
**主题：** 图, DFS, BFS, 并查集
**岗位：** SWE
**级别：** E3-E5

**问题：** 给定 '1'（陆地）和 '0'（水）组成的 2D 网格，统计岛屿数（4 方向连通）。

**思路：** 扫描网格；遇到未访问的 '1' 用 DFS/BFS 标记所有连通陆地为已访问，计数加 1。O(m*n)。变体：对角连通的岛屿、流式输入 '1' 时统计（并查集）。

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
                count += 1
                dfs(r, c)
    return count
```

**TypeScript：**
```typescript
function numIslands(grid: string[][]): number {
  const m = grid.length, n = m ? grid[0].length : 0;
  const dfs = (r: number, c: number): void => {
    if (r < 0 || r >= m || c < 0 || c >= n || grid[r][c] !== "1") return;
    grid[r][c] = "0";
    dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1);
  };
  let count = 0;
  for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) {
    if (grid[r][c] === "1") { count++; dfs(r, c); }
  }
  return count;
}
```

**Java：**
```java
int numIslands(char[][] grid) {
    int m = grid.length, n = m == 0 ? 0 : grid[0].length, count = 0;
    for (int r = 0; r < m; r++) for (int c = 0; c < n; c++) {
        if (grid[r][c] == '1') { count++; dfs(grid, r, c, m, n); }
    }
    return count;
}
private void dfs(char[][] g, int r, int c, int m, int n) {
    if (r < 0 || r >= m || c < 0 || c >= n || g[r][c] != '1') return;
    g[r][c] = '0';
    dfs(g, r + 1, c, m, n); dfs(g, r - 1, c, m, n);
    dfs(g, r, c + 1, m, n); dfs(g, r, c - 1, m, n);
}
```

**要点：**
- 把访问过的陆地沉为水以避免重复。
- 担心栈深可改用 BFS。
- 时间与空间均为 O(m * n)。

**标签：** #algorithm

---

### 39. 单词拆分

**难度：** 中等
**主题：** 动态规划, 字符串, 字典树
**岗位：** SWE
**级别：** E3-E5

**问题：** 给定字符串 `s` 和字典，判断 `s` 是否能拆分成由字典词组成的空格分隔序列。

**思路：** DP：`dp[i]` = s[0..i] 是否可拆。`dp[i] = 任一 j<i 满足 dp[j] and s[j..i] 在字典`。字典转哈希集合 O(1) 查。O(n²) 时间（或按 maxWordLen 限制 j 为 O(n*maxWordLen)）。字典树变体可降常数。

**Python：**
```python
def word_break(s: str, word_dict: list[str]) -> bool:
    words = set(word_dict)
    max_len = max((len(w) for w in words), default=0)
    n = len(s)
    dp = [False] * (n + 1)
    dp[0] = True
    for i in range(1, n + 1):
        for j in range(max(0, i - max_len), i):
            if dp[j] and s[j:i] in words:
                dp[i] = True
                break
    return dp[n]
```

**TypeScript：**
```typescript
function wordBreak(s: string, wordDict: string[]): boolean {
  const words = new Set(wordDict);
  const maxLen = wordDict.reduce((m, w) => Math.max(m, w.length), 0);
  const n = s.length;
  const dp = new Array(n + 1).fill(false);
  dp[0] = true;
  for (let i = 1; i <= n; i++) {
    for (let j = Math.max(0, i - maxLen); j < i; j++) {
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
boolean wordBreak(String s, List<String> wordDict) {
    Set<String> words = new HashSet<>(wordDict);
    int maxLen = words.stream().mapToInt(String::length).max().orElse(0);
    int n = s.length();
    boolean[] dp = new boolean[n + 1];
    dp[0] = true;
    for (int i = 1; i <= n; i++) {
        for (int j = Math.max(0, i - maxLen); j < i; j++) {
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
- dp[i] 取决于某个 j 满足 s[j..i] 在词典中。
- 用最长词长度限制 j 的范围以减少枚举。
- 时间 O(n * maxLen)，空间 O(n)。

**标签：** #algorithm

---

### 40. 无重复字符的最长子串

**难度：** 中等
**主题：** 字符串, 滑动窗口, 哈希
**岗位：** SWE
**级别：** E3-E5

**问题：** 给定字符串 `s`，找出不含重复字符的最长子串的长度。

**思路：** 滑动窗口配 `字符 -> 最新下标` 哈希表。右指针前进；若该字符见过且其下标 >= 左指针，则左指针跳到 旧下标 + 1。更新最大值。O(n) 时间，O(min(n, 字母表)) 空间。

**Python：**
```python
def length_of_longest_substring(s: str) -> int:
    last: dict[str, int] = {}
    l = best = 0
    for r, c in enumerate(s):
        if c in last and last[c] >= l:
            l = last[c] + 1
        last[c] = r
        best = max(best, r - l + 1)
    return best
```

**TypeScript：**
```typescript
function lengthOfLongestSubstring(s: string): number {
  const last = new Map<string, number>();
  let l = 0, best = 0;
  for (let r = 0; r < s.length; r++) {
    const c = s[r];
    if (last.has(c) && last.get(c)! >= l) l = last.get(c)! + 1;
    last.set(c, r);
    best = Math.max(best, r - l + 1);
  }
  return best;
}
```

**Java：**
```java
int lengthOfLongestSubstring(String s) {
    Map<Character, Integer> last = new HashMap<>();
    int l = 0, best = 0;
    for (int r = 0; r < s.length(); r++) {
        char c = s.charAt(r);
        if (last.containsKey(c) && last.get(c) >= l) l = last.get(c) + 1;
        last.put(c, r);
        best = Math.max(best, r - l + 1);
    }
    return best;
}
```

**要点：**
- 左指针只前移，不回退。
- 哈希表记录每个字符最近出现的下标。
- 时间 O(n)，空间 O(min(n, 字母表))。

**标签：** #algorithm

---

### 41. 用 Read4 读取 N 个字符 II - 多次调用

**难度：** 困难
**主题：** 字符串, 缓冲区, 设计
**岗位：** SWE
**级别：** E3-E5

**问题：** 给定 API `read4(buf4)`（最多读 4 字符到 buf4），实现可多次调用的 `read(buf, n)`。

**思路：** 类成员维护 buf4 及 `bufPtr`、`bufCnt`。每次 `read`：先把上次剩余消费完，再反复调 read4 直到达 n 或 read4 返 0。陷阱：跨调用的剩余状态。

**Python：**
```python
from typing import Callable

class Reader:
    def __init__(self, read4: Callable[[list[str]], int]) -> None:
        self.read4 = read4
        self.buf4: list[str] = [""] * 4
        self.ptr = 0
        self.cnt = 0

    def read(self, buf: list[str], n: int) -> int:
        i = 0
        while i < n:
            if self.ptr == self.cnt:
                self.cnt = self.read4(self.buf4)
                self.ptr = 0
                if self.cnt == 0:
                    break
            buf.append(self.buf4[self.ptr])
            self.ptr += 1
            i += 1
        return i
```

**TypeScript：**
```typescript
class Reader {
  private buf4: string[] = new Array(4).fill("");
  private ptr = 0;
  private cnt = 0;
  constructor(private read4: (buf4: string[]) => number) {}
  read(buf: string[], n: number): number {
    let i = 0;
    while (i < n) {
      if (this.ptr === this.cnt) {
        this.cnt = this.read4(this.buf4);
        this.ptr = 0;
        if (this.cnt === 0) break;
      }
      buf.push(this.buf4[this.ptr++]);
      i++;
    }
    return i;
  }
}
```

**Java：**
```java
class Reader {
    private final char[] buf4 = new char[4];
    private int ptr = 0, cnt = 0;
    int read(char[] buf, int n) {
        int i = 0;
        while (i < n) {
            if (ptr == cnt) {
                cnt = read4(buf4);
                ptr = 0;
                if (cnt == 0) break;
            }
            buf[i++] = buf4[ptr++];
        }
        return i;
    }
    private int read4(char[] b) { return 0; } // provided externally
}
```

**要点：**
- buf4、ptr、cnt 作为实例状态以保留剩余数据。
- 只在缓冲耗尽时再调用 read4 补充。
- read4 返回 0 即到达 EOF，跳出循环。

**复杂度：** 每次 `read(buf, n)` 调用 O(n)；跨调用只携带 O(1) 状态（4 字符缓冲区加两个下标）。

**标签：** #algorithm

---

### 42. 接雨水

**难度：** 困难
**主题：** 数组, 双指针, 栈, 动态规划
**岗位：** SWE
**级别：** E3-E5

**问题：** 给定 `n` 个非负整数表示宽度为 1 的柱状高度图，计算下雨后能接多少水。

**思路：** 双指针。维护 leftMax、rightMax。把较矮一侧的指针向内移；该柱储水量 = max(0, 该侧 max - 高度)。O(n) 时间，O(1) 空间。备选：单调递减下标栈，每次出栈累加储水量。

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
int trap(int[] height) {
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
```

**要点：**
- 较矮一侧的最大值决定该柱的储水量。
- 始终从较矮的一侧向内移动。
- 时间 O(n)，空间 O(1)。

**标签：** #algorithm

---

### 43. 单词接龙

**难度：** 困难
**主题：** 图, BFS, 字符串
**岗位：** SWE
**级别：** E3-E5

**问题：** 给定 `beginWord`、`endWord` 和字典，返回最短变换序列长度，每步改一个字母且中间词必须在字典中。

**思路：** BFS，邻居为字典中差 1 字符的词。用通配桶（如 "h*t" -> ["hot","hat"]）预计算，邻居查 O(L) 而非两两 O(N*L)。双向 BFS 折半搜索深度。O(N*L²)。

**Python：**
```python
from collections import defaultdict, deque

def ladder_length(begin_word: str, end_word: str, word_list: list[str]) -> int:
    words = set(word_list)
    if end_word not in words:
        return 0
    buckets: dict[str, list[str]] = defaultdict(list)
    for w in words:
        for i in range(len(w)):
            buckets[w[:i] + "*" + w[i + 1:]].append(w)
    q: deque[tuple[str, int]] = deque([(begin_word, 1)])
    seen = {begin_word}
    while q:
        w, d = q.popleft()
        if w == end_word:
            return d
        for i in range(len(w)):
            for nb in buckets[w[:i] + "*" + w[i + 1:]]:
                if nb not in seen:
                    seen.add(nb)
                    q.append((nb, d + 1))
    return 0
```

**TypeScript：**
```typescript
function ladderLength(beginWord: string, endWord: string, wordList: string[]): number {
  const words = new Set(wordList);
  if (!words.has(endWord)) return 0;
  const buckets = new Map<string, string[]>();
  for (const w of words) {
    for (let i = 0; i < w.length; i++) {
      const key = w.slice(0, i) + "*" + w.slice(i + 1);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(w);
    }
  }
  const q: [string, number][] = [[beginWord, 1]];
  const seen = new Set([beginWord]);
  while (q.length) {
    const [w, d] = q.shift()!;
    if (w === endWord) return d;
    for (let i = 0; i < w.length; i++) {
      const key = w.slice(0, i) + "*" + w.slice(i + 1);
      for (const nb of buckets.get(key) ?? []) {
        if (!seen.has(nb)) { seen.add(nb); q.push([nb, d + 1]); }
      }
    }
  }
  return 0;
}
```

**Java：**
```java
int ladderLength(String beginWord, String endWord, List<String> wordList) {
    Set<String> words = new HashSet<>(wordList);
    if (!words.contains(endWord)) return 0;
    Map<String, List<String>> buckets = new HashMap<>();
    for (String w : words) {
        for (int i = 0; i < w.length(); i++) {
            String key = w.substring(0, i) + "*" + w.substring(i + 1);
            buckets.computeIfAbsent(key, k -> new ArrayList<>()).add(w);
        }
    }
    Deque<String> q = new ArrayDeque<>();
    Map<String, Integer> dist = new HashMap<>();
    q.offer(beginWord); dist.put(beginWord, 1);
    while (!q.isEmpty()) {
        String w = q.poll();
        if (w.equals(endWord)) return dist.get(w);
        for (int i = 0; i < w.length(); i++) {
            String key = w.substring(0, i) + "*" + w.substring(i + 1);
            for (String nb : buckets.getOrDefault(key, List.of())) {
                if (!dist.containsKey(nb)) { dist.put(nb, dist.get(w) + 1); q.offer(nb); }
            }
        }
    }
    return 0;
}
```

**要点：**
- 通配桶使邻居枚举降为 O(L)。
- BFS 首次到达 endWord 即最短路径。
- 时间 O(N * L^2)，空间 O(N * L)。

**标签：** #algorithm

---

### 44. 单词搜索 II

**难度：** 困难
**主题：** 字典树, 回溯, DFS
**岗位：** SWE
**级别：** E3-E5

**问题：** 给定字符 2D 棋盘和单词列表，找出所有出现在棋盘上的单词（上下左右相邻，单词内不可重复使用同格）。

**思路：** 把所有单词建字典树。DFS 每个格子，沿字典树并行走——剪掉不在字典树的分支。原地标记访问，回溯时还原。找到的词从字典树移除以去重并加速。O(M*N*4^L)。

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
    found: list[str] = []
    def dfs(r: int, c: int, node: dict) -> None:
        ch = board[r][c]
        nxt = node.get(ch)
        if not nxt:
            return
        if "$" in nxt:
            found.append(nxt.pop("$"))
        board[r][c] = "#"
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < m and 0 <= nc < n and board[nr][nc] != "#":
                dfs(nr, nc, nxt)
        board[r][c] = ch
    for r in range(m):
        for c in range(n):
            dfs(r, c, trie)
    return found
```

**TypeScript：**
```typescript
function findWords(board: string[][], words: string[]): string[] {
  type Node = { [k: string]: Node | string };
  const trie: Node = {};
  for (const w of words) {
    let node = trie;
    for (const c of w) {
      if (!node[c]) node[c] = {};
      node = node[c] as Node;
    }
    node["$"] = w;
  }
  const m = board.length, n = board[0].length;
  const found: string[] = [];
  const dfs = (r: number, c: number, node: Node): void => {
    const ch = board[r][c];
    const nxt = node[ch] as Node | undefined;
    if (!nxt) return;
    if (typeof nxt["$"] === "string") { found.push(nxt["$"] as string); delete nxt["$"]; }
    board[r][c] = "#";
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < m && nc >= 0 && nc < n && board[nr][nc] !== "#") dfs(nr, nc, nxt);
    }
    board[r][c] = ch;
  };
  for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) dfs(r, c, trie);
  return found;
}
```

**Java：**
```java
static class TrieNode { Map<Character, TrieNode> kids = new HashMap<>(); String word; }

List<String> findWords(char[][] board, String[] words) {
    TrieNode root = new TrieNode();
    for (String w : words) {
        TrieNode node = root;
        for (char c : w.toCharArray()) node = node.kids.computeIfAbsent(c, k -> new TrieNode());
        node.word = w;
    }
    List<String> found = new ArrayList<>();
    int m = board.length, n = board[0].length;
    for (int r = 0; r < m; r++) for (int c = 0; c < n; c++) dfs(board, r, c, root, found);
    return found;
}
private void dfs(char[][] b, int r, int c, TrieNode node, List<String> found) {
    char ch = b[r][c];
    TrieNode nxt = node.kids.get(ch);
    if (nxt == null) return;
    if (nxt.word != null) { found.add(nxt.word); nxt.word = null; }
    b[r][c] = '#';
    int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
    for (int[] d : dirs) {
        int nr = r + d[0], nc = c + d[1];
        if (nr >= 0 && nr < b.length && nc >= 0 && nc < b[0].length && b[nr][nc] != '#') dfs(b, nr, nc, nxt, found);
    }
    b[r][c] = ch;
}
```

**要点：**
- 字典树让一次 DFS 同时匹配多词。
- 原地哨兵标记访问，回溯时还原。
- 找到后删除终止标记以去重并加速剪枝。

**标签：** #algorithm

---

### 45. 两个有序数组的中位数

**难度：** 困难
**主题：** 二分查找, 数组
**岗位：** SWE
**级别：** E3-E5

**问题：** 给定大小分别为 m、n 的两个有序数组，求中位数，要求 O(log(min(m,n)))。

**思路：** 在较小数组的分割点二分。将两个数组分割使左半总共 (m+n+1)/2 个元素；保证 maxLeftA <= minRightB 且 maxLeftB <= minRightA。中位数由边界值得出。边界坑：空侧用 ±inf 哨兵。

**Python：**
```python
def find_median_sorted_arrays(a: list[int], b: list[int]) -> float:
    if len(a) > len(b):
        a, b = b, a
    m, n = len(a), len(b)
    half = (m + n + 1) // 2
    lo, hi = 0, m
    while lo <= hi:
        i = (lo + hi) // 2
        j = half - i
        a_l = a[i - 1] if i else float("-inf")
        a_r = a[i] if i < m else float("inf")
        b_l = b[j - 1] if j else float("-inf")
        b_r = b[j] if j < n else float("inf")
        if a_l <= b_r and b_l <= a_r:
            if (m + n) % 2:
                return float(max(a_l, b_l))
            return (max(a_l, b_l) + min(a_r, b_r)) / 2
        if a_l > b_r:
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
    const aL = i ? a[i - 1] : -Infinity;
    const aR = i < m ? a[i] : Infinity;
    const bL = j ? b[j - 1] : -Infinity;
    const bR = j < n ? b[j] : Infinity;
    if (aL <= bR && bL <= aR) {
      if ((m + n) % 2) return Math.max(aL, bL);
      return (Math.max(aL, bL) + Math.min(aR, bR)) / 2;
    }
    if (aL > bR) hi = i - 1; else lo = i + 1;
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
        int i = (lo + hi) >>> 1, j = half - i;
        int aL = i == 0 ? Integer.MIN_VALUE : a[i - 1];
        int aR = i == m ? Integer.MAX_VALUE : a[i];
        int bL = j == 0 ? Integer.MIN_VALUE : b[j - 1];
        int bR = j == n ? Integer.MAX_VALUE : b[j];
        if (aL <= bR && bL <= aR) {
            if (((m + n) & 1) == 1) return Math.max(aL, bL);
            return (Math.max(aL, bL) + Math.min(aR, bR)) / 2.0;
        }
        if (aL > bR) hi = i - 1; else lo = i + 1;
    }
    return 0.0;
}
```

**要点：**
- 在较小数组上二分，复杂度 O(log(min(m, n)))。
- 空侧使用 ±inf 哨兵简化边界。
- 切分使左半含 (m+n+1)/2 个元素。

**标签：** #algorithm

---

### 46. 正则表达式匹配

**难度：** 困难
**主题：** 动态规划, 字符串, 递归
**岗位：** SWE
**级别：** E3-E5

**问题：** 实现支持 `.`（任意单字符）和 `*`（零或多个前一元素）的正则匹配，覆盖整个输入串。

**思路：** DP：`dp[i][j]` = s[0..i] 匹配 p[0..j]。若 `p[j-1]=='*'`：dp[i][j] = dp[i][j-2]（零次）或 (match(s[i-1], p[j-2]) and dp[i-1][j])。否则：match(s[i-1], p[j-1]) and dp[i-1][j-1]。O(m*n)。

**Python：**
```python
def is_match(s: str, p: str) -> bool:
    m, n = len(s), len(p)
    dp = [[False] * (n + 1) for _ in range(m + 1)]
    dp[0][0] = True
    for j in range(1, n + 1):
        if p[j - 1] == "*":
            dp[0][j] = dp[0][j - 2]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if p[j - 1] == "*":
                dp[i][j] = dp[i][j - 2]
                if p[j - 2] in (s[i - 1], "."):
                    dp[i][j] = dp[i][j] or dp[i - 1][j]
            else:
                if p[j - 1] in (s[i - 1], "."):
                    dp[i][j] = dp[i - 1][j - 1]
    return dp[m][n]
```

**TypeScript：**
```typescript
function isMatch(s: string, p: string): boolean {
  const m = s.length, n = p.length;
  const dp: boolean[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(false));
  dp[0][0] = true;
  for (let j = 1; j <= n; j++) if (p[j - 1] === "*") dp[0][j] = dp[0][j - 2];
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (p[j - 1] === "*") {
        dp[i][j] = dp[i][j - 2];
        if (p[j - 2] === s[i - 1] || p[j - 2] === ".") dp[i][j] = dp[i][j] || dp[i - 1][j];
      } else if (p[j - 1] === s[i - 1] || p[j - 1] === ".") {
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
    for (int j = 1; j <= n; j++) if (p.charAt(j - 1) == '*') dp[0][j] = dp[0][j - 2];
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            char pc = p.charAt(j - 1), sc = s.charAt(i - 1);
            if (pc == '*') {
                dp[i][j] = dp[i][j - 2];
                char prev = p.charAt(j - 2);
                if (prev == sc || prev == '.') dp[i][j] = dp[i][j] || dp[i - 1][j];
            } else if (pc == sc || pc == '.') {
                dp[i][j] = dp[i - 1][j - 1];
            }
        }
    }
    return dp[m][n];
}
```

**要点：**
- `*` 表示零次（j-2）或再多一次（i-1 且字符匹配）。
- 预先初始化 dp[0][j] 让 "a*b*" 能匹配空串。
- 时间与空间均为 O(m * n)。

**标签：** #algorithm

---

### 47. 最小覆盖子串

**难度：** 困难
**主题：** 字符串, 滑动窗口, 哈希
**岗位：** SWE
**级别：** E3-E5

**问题：** 给定字符串 `s` 和 `t`，返回 `s` 中包含 `t` 所有字符（含重复）的最小子串。

**思路：** 滑动窗口。先统计 t 所需字符。右扩；跟踪 `formed` = 达到所需数量的不同字符数。当 formed == required 时，左缩同时仍合法时更新答案。O(|s| + |t|)。

**Python：**
```python
def min_window(s: str, t: str) -> str:
    if not t or len(s) < len(t):
        return ""
    need: dict[str, int] = {}
    for c in t:
        need[c] = need.get(c, 0) + 1
    have: dict[str, int] = {}
    required = len(need)
    formed = l = 0
    best = (-1, 0, 0)
    for r, c in enumerate(s):
        have[c] = have.get(c, 0) + 1
        if c in need and have[c] == need[c]:
            formed += 1
        while formed == required:
            if best[0] == -1 or r - l + 1 < best[0]:
                best = (r - l + 1, l, r)
            have[s[l]] -= 1
            if s[l] in need and have[s[l]] < need[s[l]]:
                formed -= 1
            l += 1
    return "" if best[0] == -1 else s[best[1]:best[2] + 1]
```

**TypeScript：**
```typescript
function minWindow(s: string, t: string): string {
  if (!t || s.length < t.length) return "";
  const need = new Map<string, number>();
  for (const c of t) need.set(c, (need.get(c) ?? 0) + 1);
  const have = new Map<string, number>();
  const required = need.size;
  let formed = 0, l = 0;
  let best: [number, number, number] = [-1, 0, 0];
  for (let r = 0; r < s.length; r++) {
    const c = s[r];
    have.set(c, (have.get(c) ?? 0) + 1);
    if (need.has(c) && have.get(c) === need.get(c)) formed++;
    while (formed === required) {
      if (best[0] === -1 || r - l + 1 < best[0]) best = [r - l + 1, l, r];
      const lc = s[l];
      have.set(lc, have.get(lc)! - 1);
      if (need.has(lc) && have.get(lc)! < need.get(lc)!) formed--;
      l++;
    }
  }
  return best[0] === -1 ? "" : s.slice(best[1], best[2] + 1);
}
```

**Java：**
```java
String minWindow(String s, String t) {
    if (t.isEmpty() || s.length() < t.length()) return "";
    Map<Character, Integer> need = new HashMap<>();
    for (char c : t.toCharArray()) need.merge(c, 1, Integer::sum);
    Map<Character, Integer> have = new HashMap<>();
    int required = need.size(), formed = 0, l = 0;
    int[] best = {-1, 0, 0};
    for (int r = 0; r < s.length(); r++) {
        char c = s.charAt(r);
        have.merge(c, 1, Integer::sum);
        if (need.containsKey(c) && have.get(c).equals(need.get(c))) formed++;
        while (formed == required) {
            if (best[0] == -1 || r - l + 1 < best[0]) best = new int[]{r - l + 1, l, r};
            char lc = s.charAt(l);
            have.merge(lc, -1, Integer::sum);
            if (need.containsKey(lc) && have.get(lc) < need.get(lc)) formed--;
            l++;
        }
    }
    return best[0] == -1 ? "" : s.substring(best[1], best[2] + 1);
}
```

**要点：**
- `formed` 表示已达所需计数的不同字符数。
- 当窗口仍合法时不断收缩以寻找更短答案。
- 时间 O(|s| + |t|)，空间 O(字母表)。

**标签：** #algorithm

---

### 48. 合并 K 个升序链表

**难度：** 困难
**主题：** 链表, 堆, 分治
**岗位：** SWE
**级别：** E3-E5

**问题：** 合并 `k` 个升序链表为一个升序链表并返回。

**思路：** 大小为 k 的小顶堆放每个链表的头；弹出最小，把其 next 入堆。O(N log k)。备选：两两合并，每轮链表数减半——也是 O(N log k)，无需堆。

**Python：**
```python
import heapq

class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val = val
        self.next = next

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
  val: number;
  next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) { this.val = val; this.next = next; }
}

function mergeKLists(lists: Array<ListNode | null>): ListNode | null {
  if (lists.length === 0) return null;
  let step = 1;
  const merge2 = (a: ListNode | null, b: ListNode | null): ListNode | null => {
    const dummy = new ListNode();
    let tail = dummy;
    while (a && b) {
      if (a.val <= b.val) { tail.next = a; a = a.next; }
      else { tail.next = b; b = b.next; }
      tail = tail.next!;
    }
    tail.next = a ?? b;
    return dummy.next;
  };
  while (step < lists.length) {
    for (let i = 0; i + step < lists.length; i += step * 2) {
      lists[i] = merge2(lists[i], lists[i + step]);
    }
    step *= 2;
  }
  return lists[0];
}
```

**Java：**
```java
ListNode mergeKLists(ListNode[] lists) {
    PriorityQueue<ListNode> heap = new PriorityQueue<>((a, b) -> a.val - b.val);
    for (ListNode n : lists) if (n != null) heap.offer(n);
    ListNode dummy = new ListNode(), tail = dummy;
    while (!heap.isEmpty()) {
        ListNode n = heap.poll();
        tail.next = n;
        tail = n;
        if (n.next != null) heap.offer(n.next);
    }
    return dummy.next;
}
```

**要点：**
- 堆元组里加索引作为 tiebreaker 可避免直接比较节点。
- 两两合并法无需堆，同样 O(N log k)。
- 时间 O(N log k)，空间 O(k)。

**标签：** #algorithm

---

### 49. 二叉树的序列化与反序列化

**难度：** 困难
**主题：** 树, DFS, BFS, 设计
**岗位：** SWE
**级别：** E3-E5

**问题：** 设计二叉树的 `serialize(root)` 与 `deserialize(data)`。

**思路：** 前序 DFS 加 `null` 标记。serialize："1,2,#,#,3,4,#,#,5,#,#"。deserialize：tokens 入队；递归助手读下一个 token，'#' 返 null，否则建节点并左右递归。两端均 O(n)。

**Python：**
```python
from collections import deque

def serialize(root: TreeNode | None) -> str:
    parts: list[str] = []
    def go(node: TreeNode | None) -> None:
        if node is None:
            parts.append("#")
            return
        parts.append(str(node.val))
        go(node.left)
        go(node.right)
    go(root)
    return ",".join(parts)

def deserialize(data: str) -> TreeNode | None:
    tokens = deque(data.split(","))
    def build() -> TreeNode | None:
        t = tokens.popleft()
        if t == "#":
            return None
        node = TreeNode(int(t))
        node.left = build()
        node.right = build()
        return node
    return build()
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
  const build = (): TreeNode | null => {
    const t = tokens[i++];
    if (t === "#") return null;
    const node = new TreeNode(Number(t));
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
    ser(root, sb);
    return sb.toString();
}
private void ser(TreeNode n, StringBuilder sb) {
    if (n == null) { sb.append("#,"); return; }
    sb.append(n.val).append(',');
    ser(n.left, sb); ser(n.right, sb);
}
TreeNode deserialize(String data) {
    return build(new ArrayDeque<>(Arrays.asList(data.split(","))));
}
private TreeNode build(Deque<String> tokens) {
    String t = tokens.poll();
    if (t == null || t.equals("#")) return null;
    TreeNode n = new TreeNode(Integer.parseInt(t));
    n.left = build(tokens);
    n.right = build(tokens);
    return n;
}
```

**要点：**
- 前序加 null 标记能唯一编码二叉树。
- 递归反序列化按相同顺序读取 token。
- 序列化与反序列化均 O(n)。

**标签：** #algorithm

---

### 50. 二叉树中的最大路径和

**难度：** 困难
**主题：** 树, DFS, 递归
**岗位：** SWE
**级别：** E3-E5

**问题：** 给定非空二叉树，求最大路径和——路径为父子边连接的任意节点序列（不必经过根）。

**思路：** 后序 DFS 返回"经过该节点向下走的最优路径" = node.val + max(0, max(leftGain, rightGain))。全局最大 = node.val + max(0, leftGain) + max(0, rightGain)。负值截为 0。O(n)。

**Python：**
```python
def max_path_sum(root: TreeNode | None) -> int:
    best = float("-inf")
    def gain(node: TreeNode | None) -> int:
        nonlocal best
        if node is None:
            return 0
        l = max(gain(node.left), 0)
        r = max(gain(node.right), 0)
        best = max(best, node.val + l + r)
        return node.val + max(l, r)
    gain(root)
    return int(best)
```

**TypeScript：**
```typescript
function maxPathSum(root: TreeNode | null): number {
  let best = -Infinity;
  const gain = (n: TreeNode | null): number => {
    if (!n) return 0;
    const l = Math.max(gain(n.left), 0);
    const r = Math.max(gain(n.right), 0);
    best = Math.max(best, n.val + l + r);
    return n.val + Math.max(l, r);
  };
  gain(root);
  return best;
}
```

**Java：**
```java
private int bestSum;
int maxPathSum(TreeNode root) {
    bestSum = Integer.MIN_VALUE;
    gain(root);
    return bestSum;
}
private int gain(TreeNode n) {
    if (n == null) return 0;
    int l = Math.max(gain(n.left), 0);
    int r = Math.max(gain(n.right), 0);
    bestSum = Math.max(bestSum, n.val + l + r);
    return n.val + Math.max(l, r);
}
```

**要点：**
- 负的子贡献截成 0——直接舍弃那条分支。
- 返回值是单边路径；只在更新全局值时允许"拐弯"。
- 时间 O(n)，栈 O(h)。

**标签：** #algorithm

---

### 51. 火星词典

**难度：** 困难
**主题：** 图, 拓扑排序, BFS
**岗位：** SWE
**级别：** E3-E5

**问题：** 给定外星语言中按字典序排好的单词列表，推导出一个合法的字母顺序；若不可能返回 ""。

**思路：** 建 DAG：对相邻单词对，找首个不同字符加边。拓扑排序（Kahn 的 BFS 或带环检测的 DFS）。环或非法前缀（"abc" 在 "ab" 之前）则返回 ""。O(总字符数 + V + E)。

**Python：**
```python
from collections import defaultdict, deque

def alien_order(words: list[str]) -> str:
    graph: dict[str, set[str]] = defaultdict(set)
    indeg: dict[str, int] = {c: 0 for w in words for c in w}
    for a, b in zip(words, words[1:]):
        for ca, cb in zip(a, b):
            if ca != cb:
                if cb not in graph[ca]:
                    graph[ca].add(cb)
                    indeg[cb] += 1
                break
        else:
            if len(a) > len(b):
                return ""
    q: deque[str] = deque(c for c, d in indeg.items() if d == 0)
    out: list[str] = []
    while q:
        c = q.popleft()
        out.append(c)
        for nb in graph[c]:
            indeg[nb] -= 1
            if indeg[nb] == 0:
                q.append(nb)
    return "".join(out) if len(out) == len(indeg) else ""
```

**TypeScript：**
```typescript
function alienOrder(words: string[]): string {
  const graph = new Map<string, Set<string>>();
  const indeg = new Map<string, number>();
  for (const w of words) for (const c of w) {
    if (!graph.has(c)) graph.set(c, new Set());
    if (!indeg.has(c)) indeg.set(c, 0);
  }
  for (let i = 1; i < words.length; i++) {
    const a = words[i - 1], b = words[i];
    let differ = false;
    for (let j = 0; j < Math.min(a.length, b.length); j++) {
      if (a[j] !== b[j]) {
        if (!graph.get(a[j])!.has(b[j])) {
          graph.get(a[j])!.add(b[j]);
          indeg.set(b[j], indeg.get(b[j])! + 1);
        }
        differ = true;
        break;
      }
    }
    if (!differ && a.length > b.length) return "";
  }
  const q: string[] = [];
  for (const [c, d] of indeg) if (d === 0) q.push(c);
  const out: string[] = [];
  while (q.length) {
    const c = q.shift()!;
    out.push(c);
    for (const nb of graph.get(c)!) {
      indeg.set(nb, indeg.get(nb)! - 1);
      if (indeg.get(nb) === 0) q.push(nb);
    }
  }
  return out.length === indeg.size ? out.join("") : "";
}
```

**Java：**
```java
String alienOrder(String[] words) {
    Map<Character, Set<Character>> graph = new HashMap<>();
    Map<Character, Integer> indeg = new HashMap<>();
    for (String w : words) for (char c : w.toCharArray()) {
        graph.putIfAbsent(c, new HashSet<>());
        indeg.putIfAbsent(c, 0);
    }
    for (int i = 1; i < words.length; i++) {
        String a = words[i - 1], b = words[i];
        boolean differ = false;
        for (int j = 0; j < Math.min(a.length(), b.length()); j++) {
            if (a.charAt(j) != b.charAt(j)) {
                if (graph.get(a.charAt(j)).add(b.charAt(j))) indeg.merge(b.charAt(j), 1, Integer::sum);
                differ = true;
                break;
            }
        }
        if (!differ && a.length() > b.length()) return "";
    }
    Deque<Character> q = new ArrayDeque<>();
    for (var e : indeg.entrySet()) if (e.getValue() == 0) q.offer(e.getKey());
    StringBuilder out = new StringBuilder();
    while (!q.isEmpty()) {
        char c = q.poll();
        out.append(c);
        for (char nb : graph.get(c)) if (indeg.merge(nb, -1, Integer::sum) == 0) q.offer(nb);
    }
    return out.length() == indeg.size() ? out.toString() : "";
}
```

**要点：**
- 边由相邻两词的首个不同字符给出。
- 非法前缀（"abc" 在 "ab" 之前）直接返回 ""。
- 环检测：输出长度少于节点数即说明存在环。

**标签：** #algorithm

---

### 52. 在排序数组中查找元素的第一个和最后一个位置

**难度：** 中等
**主题：** 二分查找, 数组
**岗位：** SWE
**级别：** E3-E5

**问题：** 给定排序整数数组和 target，返回 target 的首末下标。缺失返 [-1, -1]。O(log n)。

**思路：** 两次二分：最左（nums[mid] >= target 时 hi=mid）和最右（nums[mid] <= target 时 lo=mid+1，最后返回 lo-1）。检查命中 target。O(log n)。

**Python：**
```python
from bisect import bisect_left, bisect_right

def search_range(nums: list[int], target: int) -> list[int]:
    l = bisect_left(nums, target)
    if l == len(nums) or nums[l] != target:
        return [-1, -1]
    r = bisect_right(nums, target) - 1
    return [l, r]
```

**TypeScript：**
```typescript
function searchRange(nums: number[], target: number): number[] {
  const lower = (t: number): number => {
    let lo = 0, hi = nums.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (nums[mid] < t) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
  const l = lower(target);
  if (l === nums.length || nums[l] !== target) return [-1, -1];
  return [l, lower(target + 1) - 1];
}
```

**Java：**
```java
int[] searchRange(int[] nums, int target) {
    int l = lower(nums, target);
    if (l == nums.length || nums[l] != target) return new int[]{-1, -1};
    return new int[]{l, lower(nums, target + 1) - 1};
}
private int lower(int[] nums, int t) {
    int lo = 0, hi = nums.length;
    while (lo < hi) {
        int mid = (lo + hi) >>> 1;
        if (nums[mid] < t) lo = mid + 1; else hi = mid;
    }
    return lo;
}
```

**要点：**
- 一次最左二分 + `lower(target+1)` 即可得到首末。
- 必须检查左端点是否真的等于 target。
- 时间 O(log n)，空间 O(1)。

**标签：** #algorithm

---

### 53. 下一个排列

**难度：** 中等
**主题：** 数组, 双指针
**岗位：** SWE
**级别：** E3-E5

**问题：** 原地把数字重排为字典序下一个更大排列。若不存在则升序排列。

**思路：** 找最大 i 满足 `nums[i] < nums[i+1]`（最右的升序对）。若无则全反转。否则找最大 j>i 满足 `nums[j] > nums[i]`，交换，再反转 i 之后的后缀。O(n) 时间，O(1) 空间。

**Python：**
```python
def next_permutation(nums: list[int]) -> None:
    n = len(nums)
    i = n - 2
    while i >= 0 and nums[i] >= nums[i + 1]:
        i -= 1
    if i >= 0:
        j = n - 1
        while nums[j] <= nums[i]:
            j -= 1
        nums[i], nums[j] = nums[j], nums[i]
    nums[i + 1:] = reversed(nums[i + 1:])
```

**TypeScript：**
```typescript
function nextPermutation(nums: number[]): void {
  const n = nums.length;
  let i = n - 2;
  while (i >= 0 && nums[i] >= nums[i + 1]) i--;
  if (i >= 0) {
    let j = n - 1;
    while (nums[j] <= nums[i]) j--;
    [nums[i], nums[j] ] = [nums[j], nums[i]];
  }
  for (let l = i + 1, r = n - 1; l < r; l++, r--) {
    [nums[l], nums[r]] = [nums[r], nums[l]];
  }
}
```

**Java：**
```java
void nextPermutation(int[] nums) {
    int n = nums.length, i = n - 2;
    while (i >= 0 && nums[i] >= nums[i + 1]) i--;
    if (i >= 0) {
        int j = n - 1;
        while (nums[j] <= nums[i]) j--;
        int t = nums[i]; nums[i] = nums[j]; nums[j] = t;
    }
    for (int l = i + 1, r = n - 1; l < r; l++, r--) {
        int t = nums[l]; nums[l] = nums[r]; nums[r] = t;
    }
}
```

**要点：**
- 找最右升序枢轴，与其后首个更大值交换，再反转后缀。
- 完全降序时整体反转（即上一个排列）。
- 时间 O(n)，空间 O(1)。

**标签：** #algorithm

---

### 54. 最长递增子序列

**难度：** 中等
**主题：** 动态规划, 二分查找
**岗位：** SWE
**级别：** E3-E5

**问题：** 给定整数数组，返回严格递增子序列的最大长度。

**思路：** 耐心排序变种。维护 `tails[]`，tails[i] = 长度为 i+1 的递增子序列中最小尾值。对每个 x，二分找首个 >= x 的尾值；替换（或追加）。tails 长度即答案。O(n log n)。

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
int lengthOfLIS(int[] nums) {
    int[] tails = new int[nums.length];
    int size = 0;
    for (int x : nums) {
        int lo = 0, hi = size;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (tails[mid] < x) lo = mid + 1; else hi = mid;
        }
        tails[lo] = x;
        if (lo == size) size++;
    }
    return size;
}
```

**要点：**
- `tails` 不一定是真实的 LIS，但其长度即答案。
- 把首个 >= x 的尾值替换为 x，使选择保持最优。
- 时间 O(n log n)，空间 O(n)。

**标签：** #algorithm

---

### 55. 课程表 II

**难度：** 中等
**主题：** 图, 拓扑排序, BFS, DFS
**岗位：** SWE
**级别：** E3-E5

**问题：** 有 `n` 门课，先修关系成对给出 `[a, b]`（b 先于 a）。返回一个合法顺序，若不可能返回空数组。

**思路：** Kahn 算法：计算入度，所有入度 0 入队。出队、追加到序列、邻居入度减一；新出现的 0 入度入队。若输出长度 < n 则有环 → 返回 []。O(V+E)。

**Python：**
```python
from collections import defaultdict, deque

def find_order(num_courses: int, prerequisites: list[list[int]]) -> list[int]:
    graph: dict[int, list[int]] = defaultdict(list)
    indeg = [0] * num_courses
    for a, b in prerequisites:
        graph[b].append(a)
        indeg[a] += 1
    q: deque[int] = deque(i for i in range(num_courses) if indeg[i] == 0)
    order: list[int] = []
    while q:
        c = q.popleft()
        order.append(c)
        for nb in graph[c]:
            indeg[nb] -= 1
            if indeg[nb] == 0:
                q.append(nb)
    return order if len(order) == num_courses else []
```

**TypeScript：**
```typescript
function findOrder(numCourses: number, prerequisites: number[][]): number[] {
  const graph: number[][] = Array.from({ length: numCourses }, () => []);
  const indeg = new Array(numCourses).fill(0);
  for (const [a, b] of prerequisites) {
    graph[b].push(a);
    indeg[a]++;
  }
  const q: number[] = [];
  for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) q.push(i);
  const order: number[] = [];
  while (q.length) {
    const c = q.shift()!;
    order.push(c);
    for (const nb of graph[c]) {
      if (--indeg[nb] === 0) q.push(nb);
    }
  }
  return order.length === numCourses ? order : [];
}
```

**Java：**
```java
int[] findOrder(int numCourses, int[][] prerequisites) {
    List<List<Integer>> graph = new ArrayList<>();
    for (int i = 0; i < numCourses; i++) graph.add(new ArrayList<>());
    int[] indeg = new int[numCourses];
    for (int[] p : prerequisites) { graph.get(p[1]).add(p[0]); indeg[p[0]]++; }
    Deque<Integer> q = new ArrayDeque<>();
    for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) q.offer(i);
    int[] order = new int[numCourses];
    int idx = 0;
    while (!q.isEmpty()) {
        int c = q.poll();
        order[idx++] = c;
        for (int nb : graph.get(c)) if (--indeg[nb] == 0) q.offer(nb);
    }
    return idx == numCourses ? order : new int[0];
}
```

**要点：**
- 若无环，Kahn BFS 能产出一个合法拓扑序。
- 输出长度不足说明存在环。
- 时间与空间均为 O(V + E)。

**标签：** #algorithm

---

### 56. 账户合并

**难度：** 中等
**主题：** 并查集, 图, DFS
**岗位：** SWE
**级别：** E3-E5

**问题：** 给定账户列表 `[name, email1, email2, ...]`，合并共享任意邮件的账户。返回合并后账户，邮件排序。

**思路：** 在邮件上做并查集。建 email -> 账户下标 映射。把同账户的所有邮件 union；不同账户共享邮件也 union。按根分组邮件，排序，拼上名字。O(N * α(N) * 排序)。

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
    while (parent.get(x) !== x) {
      parent.set(x, parent.get(parent.get(x)!)!);
      x = parent.get(x)!;
    }
    return x;
  };
  for (const acc of accounts) {
    const name = acc[0];
    for (let i = 1; i < acc.length; i++) {
      const e = acc[i];
      if (!parent.has(e)) parent.set(e, e);
      owner.set(e, name);
      parent.set(find(e), find(acc[1]));
    }
  }
  const groups = new Map<string, string[]>();
  for (const e of parent.keys()) {
    const r = find(e);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r)!.push(e);
  }
  const out: string[][] = [];
  for (const [r, emails] of groups) out.push([owner.get(r)!, ...emails.sort()]);
  return out;
}
```

**Java：**
```java
private Map<String, String> parent;
List<List<String>> accountsMerge(List<List<String>> accounts) {
    parent = new HashMap<>();
    Map<String, String> owner = new HashMap<>();
    for (List<String> acc : accounts) {
        String name = acc.get(0);
        for (int i = 1; i < acc.size(); i++) {
            String e = acc.get(i);
            parent.putIfAbsent(e, e);
            owner.put(e, name);
            parent.put(find(e), find(acc.get(1)));
        }
    }
    Map<String, List<String>> groups = new HashMap<>();
    for (String e : parent.keySet()) groups.computeIfAbsent(find(e), k -> new ArrayList<>()).add(e);
    List<List<String>> out = new ArrayList<>();
    for (var e : groups.entrySet()) {
        Collections.sort(e.getValue());
        List<String> row = new ArrayList<>();
        row.add(owner.get(e.getKey()));
        row.addAll(e.getValue());
        out.add(row);
    }
    return out;
}
private String find(String x) {
    while (!parent.get(x).equals(x)) { parent.put(x, parent.get(parent.get(x))); x = parent.get(x); }
    return x;
}
```

**要点：**
- 把同一账户的所有邮件 union 在一起。
- 路径压缩使 find 摊销近似 O(1)。
- 每组排序以满足输出格式。

**标签：** #algorithm

---

### 57. 最大交换

**难度：** 中等
**主题：** 数组, 贪心, 数学
**岗位：** SWE
**级别：** E3-E5

**问题：** 给定非负整数，至多交换两位数字一次以产生最大可能数。

**思路：** 对每位记录 0-9 各数字最后（最右）出现下标。从左向右遍历每位；若后面存在更大数字（从 9 倒查到当前+1），与最右出现处交换并返回。O(n)。

**Python：**
```python
def maximum_swap(num: int) -> int:
    digits = list(str(num))
    last = {int(d): i for i, d in enumerate(digits)}
    for i, d in enumerate(digits):
        for big in range(9, int(d), -1):
            if last.get(big, -1) > i:
                digits[i], digits[last[big]] = digits[last[big]], digits[i]
                return int("".join(digits))
    return num
```

**TypeScript：**
```typescript
function maximumSwap(num: number): number {
  const digits = String(num).split("");
  const last = new Map<number, number>();
  digits.forEach((d, i) => last.set(Number(d), i));
  for (let i = 0; i < digits.length; i++) {
    for (let big = 9; big > Number(digits[i]); big--) {
      const j = last.get(big);
      if (j !== undefined && j > i) {
        [digits[i], digits[j]] = [digits[j], digits[i]];
        return Number(digits.join(""));
      }
    }
  }
  return num;
}
```

**Java：**
```java
int maximumSwap(int num) {
    char[] digits = String.valueOf(num).toCharArray();
    int[] last = new int[10];
    for (int i = 0; i < digits.length; i++) last[digits[i] - '0'] = i;
    for (int i = 0; i < digits.length; i++) {
        for (int big = 9; big > digits[i] - '0'; big--) {
            if (last[big] > i) {
                char t = digits[i]; digits[i] = digits[last[big]]; digits[last[big]] = t;
                return Integer.parseInt(new String(digits));
            }
        }
    }
    return num;
}
```

**要点：**
- 贪心：把最左位与之后的某个更大数字交换。
- 选择该更大数字最右的出现位置。
- 时间 O(n)，空间 O(10)。

**标签：** #algorithm

---

### 58. 函数的独占时间

**难度：** 中等
**主题：** 栈, 模拟
**岗位：** SWE
**级别：** E3-E5

**问题：** 给定函数调用日志 `["id:start:ts", "id:end:ts", ...]`，返回每个函数的独占运行时间（不含嵌套调用）。

**思路：** 用栈存当前运行中的函数 id 配 `prevTime`。遇 "start"：若栈非空，给栈顶累加 `ts - prevTime`；压入新 id；prevTime = ts。遇 "end"：给栈顶累加 `ts - prevTime + 1`；弹出；prevTime = ts + 1。O(n)。

**Python：**
```python
def exclusive_time(n: int, logs: list[str]) -> list[int]:
    result = [0] * n
    stack: list[int] = []
    prev = 0
    for log in logs:
        fid, kind, ts_str = log.split(":")
        i, ts = int(fid), int(ts_str)
        if kind == "start":
            if stack:
                result[stack[-1]] += ts - prev
            stack.append(i)
            prev = ts
        else:
            result[stack.pop()] += ts - prev + 1
            prev = ts + 1
    return result
```

**TypeScript：**
```typescript
function exclusiveTime(n: number, logs: string[]): number[] {
  const result = new Array(n).fill(0);
  const stack: number[] = [];
  let prev = 0;
  for (const log of logs) {
    const [fid, kind, tsStr] = log.split(":");
    const i = Number(fid), ts = Number(tsStr);
    if (kind === "start") {
      if (stack.length) result[stack[stack.length - 1]] += ts - prev;
      stack.push(i);
      prev = ts;
    } else {
      result[stack.pop()!] += ts - prev + 1;
      prev = ts + 1;
    }
  }
  return result;
}
```

**Java：**
```java
int[] exclusiveTime(int n, List<String> logs) {
    int[] result = new int[n];
    Deque<Integer> stack = new ArrayDeque<>();
    int prev = 0;
    for (String log : logs) {
        String[] parts = log.split(":");
        int i = Integer.parseInt(parts[0]), ts = Integer.parseInt(parts[2]);
        if (parts[1].equals("start")) {
            if (!stack.isEmpty()) result[stack.peek()] += ts - prev;
            stack.push(i);
            prev = ts;
        } else {
            result[stack.pop()] += ts - prev + 1;
            prev = ts + 1;
        }
    }
    return result;
}
```

**要点：**
- 栈反映函数调用嵌套关系。
- "end" 时间戳是闭区间，需要 +1。
- start 时设 prev=ts，end 时设 prev=ts+1。

**标签：** #algorithm

---

### 59. 拼出单词的最少贴纸数

**难度：** 困难
**主题：** 动态规划, 位掩码, BFS
**岗位：** 高级 SWE
**级别：** E5+

**问题：** 给定一组贴纸单词和目标串，返回拼出 target 所需最少贴纸数（贴纸可剪裁、可任意次重复）。不能则返 -1。

**思路：** 在 target 字符的子集（target ≤ 15 字符）上做位掩码 DP。`dp[mask]` = 覆盖 mask 表示字符所需最少贴纸数。对每个 mask，尝试每张贴纸，看能补充哪些字符；递归。记忆化。O(2^n * 贴纸数 * |target|)。

**Python：**
```python
from collections import Counter
from functools import lru_cache

def min_stickers(stickers: list[str], target: str) -> int:
    n = len(target)
    counts = [Counter(s) for s in stickers]
    @lru_cache(maxsize=None)
    def dp(mask: int) -> int:
        if mask == (1 << n) - 1:
            return 0
        best = float("inf")
        first = next(i for i in range(n) if not (mask >> i) & 1)
        for c in counts:
            if target[first] not in c:
                continue
            new_mask = mask
            remain = Counter(c)
            for i in range(n):
                if not (mask >> i) & 1 and remain[target[i]] > 0:
                    remain[target[i]] -= 1
                    new_mask |= 1 << i
            sub = dp(new_mask)
            if sub != float("inf"):
                best = min(best, 1 + sub)
        return best  # type: ignore[return-value]
    ans = dp(0)
    return -1 if ans == float("inf") else int(ans)
```

**TypeScript：**
```typescript
function minStickers(stickers: string[], target: string): number {
  const n = target.length;
  const memo = new Map<number, number>();
  const counts = stickers.map(s => {
    const m: Record<string, number> = {};
    for (const c of s) m[c] = (m[c] ?? 0) + 1;
    return m;
  });
  const dp = (mask: number): number => {
    if (mask === (1 << n) - 1) return 0;
    if (memo.has(mask)) return memo.get(mask)!;
    let first = 0;
    while ((mask >> first) & 1) first++;
    let best = Infinity;
    for (const c of counts) {
      if (!c[target[first]]) continue;
      let newMask = mask;
      const remain = { ...c };
      for (let i = 0; i < n; i++) {
        if (!((mask >> i) & 1) && (remain[target[i]] ?? 0) > 0) {
          remain[target[i]]--;
          newMask |= 1 << i;
        }
      }
      const sub = dp(newMask);
      if (sub !== Infinity) best = Math.min(best, 1 + sub);
    }
    memo.set(mask, best);
    return best;
  };
  const ans = dp(0);
  return ans === Infinity ? -1 : ans;
}
```

**Java：**
```java
int minStickers(String[] stickers, String target) {
    int n = target.length(), full = (1 << n) - 1;
    int[] memo = new int[1 << n];
    Arrays.fill(memo, -1);
    int[][] counts = new int[stickers.length][26];
    for (int i = 0; i < stickers.length; i++)
        for (char c : stickers[i].toCharArray()) counts[i][c - 'a']++;
    int ans = dp(0, full, target, counts, memo);
    return ans >= Integer.MAX_VALUE / 2 ? -1 : ans;
}
private int dp(int mask, int full, String target, int[][] counts, int[] memo) {
    if (mask == full) return 0;
    if (memo[mask] != -1) return memo[mask];
    int first = Integer.numberOfTrailingZeros(~mask & full);
    int best = Integer.MAX_VALUE / 2;
    for (int[] c : counts) {
        if (c[target.charAt(first) - 'a'] == 0) continue;
        int newMask = mask;
        int[] remain = c.clone();
        for (int i = 0; i < target.length(); i++) {
            if (((mask >> i) & 1) == 0 && remain[target.charAt(i) - 'a'] > 0) {
                remain[target.charAt(i) - 'a']--;
                newMask |= 1 << i;
            }
        }
        best = Math.min(best, 1 + dp(newMask, full, target, counts, memo));
    }
    return memo[mask] = best;
}
```

**要点：**
- 用 target 字符的位掩码做 DP（长度 ≤ 15）。
- 每次以首个未覆盖字符为锚点，可剪枝。
- 在 mask 上记忆化；最坏 O(2^n * 贴纸数 * |target|)。

**标签：** #algorithm

---

### 60. 扫地机器人

**难度：** 困难
**主题：** 回溯, DFS
**岗位：** 高级 SWE
**级别：** E5+

**问题：** 给定机器人，提供 `move()`、`turnLeft()`、`turnRight()`、`clean()`，在未知网格上清扫整个房间。

**思路：** 用相对坐标做 DFS。维护以 (x, y) 为 key 的 visited。尝试 4 个方向：移动、递归，再通过转 180°、移动、转 180° 回正来回退。方向用向量数组并随转向旋转。O(N - M)，N 为格子数，M 为障碍数。

**Python：**
```python
class Robot:
    def move(self) -> bool: ...
    def turnLeft(self) -> None: ...
    def turnRight(self) -> None: ...
    def clean(self) -> None: ...

def clean_room(robot: Robot) -> None:
    dirs = [(-1, 0), (0, 1), (1, 0), (0, -1)]
    visited: set[tuple[int, int]] = set()
    def back() -> None:
        robot.turnRight(); robot.turnRight()
        robot.move()
        robot.turnRight(); robot.turnRight()
    def dfs(x: int, y: int, d: int) -> None:
        robot.clean()
        visited.add((x, y))
        for k in range(4):
            nd = (d + k) % 4
            nx, ny = x + dirs[nd][0], y + dirs[nd][1]
            if (nx, ny) not in visited and robot.move():
                dfs(nx, ny, nd)
                back()
            robot.turnRight()
    dfs(0, 0, 0)
```

**TypeScript：**
```typescript
interface Robot {
  move(): boolean;
  turnLeft(): void;
  turnRight(): void;
  clean(): void;
}

function cleanRoom(robot: Robot): void {
  const dirs: [number, number][] = [[-1, 0], [0, 1], [1, 0], [0, -1]];
  const visited = new Set<string>();
  const back = (): void => {
    robot.turnRight(); robot.turnRight();
    robot.move();
    robot.turnRight(); robot.turnRight();
  };
  const dfs = (x: number, y: number, d: number): void => {
    robot.clean();
    visited.add(`${x},${y}`);
    for (let k = 0; k < 4; k++) {
      const nd = (d + k) % 4;
      const nx = x + dirs[nd][0], ny = y + dirs[nd][1];
      if (!visited.has(`${nx},${ny}`) && robot.move()) {
        dfs(nx, ny, nd);
        back();
      }
      robot.turnRight();
    }
  };
  dfs(0, 0, 0);
}
```

**Java：**
```java
interface Robot { boolean move(); void turnLeft(); void turnRight(); void clean(); }

private static final int[][] DIRS = {{-1,0},{0,1},{1,0},{0,-1}};

void cleanRoom(Robot robot) {
    dfs(robot, 0, 0, 0, new HashSet<>());
}
private void dfs(Robot robot, int x, int y, int d, Set<String> visited) {
    robot.clean();
    visited.add(x + "," + y);
    for (int k = 0; k < 4; k++) {
        int nd = (d + k) % 4;
        int nx = x + DIRS[nd][0], ny = y + DIRS[nd][1];
        if (!visited.contains(nx + "," + ny) && robot.move()) {
            dfs(robot, nx, ny, nd, visited);
            robot.turnRight(); robot.turnRight();
            robot.move();
            robot.turnRight(); robot.turnRight();
        }
        robot.turnRight();
    }
}
```

**要点：**
- 以起点为原点用相对坐标。
- 用方向索引旋转代替改写向量数组。
- 回溯：转 180°、移动、再转 180°。

**标签：** #algorithm

---

### 61. 障碍物消除后的最短路径

**难度：** 困难
**主题：** BFS, 图
**岗位：** 高级 SWE
**级别：** E5+

**问题：** 给定 m×n 网格，0（空）和 1（障碍），从 (0,0) 到 (m-1, n-1) 最多消除 `k` 个障碍，求最短路径。不可达返 -1。

**思路：** 在 3D 状态空间 (行, 列, 剩余 k) 做 BFS。visited 记录每格见过的最大剩余 k；当前剩余 k <= 已见则跳过。O(m*n*k)。要点：同一格可被更多剩余消除次数重访以找更短路径。

**Python：**
```python
from collections import deque

def shortest_path(grid: list[list[int]], k: int) -> int:
    m, n = len(grid), len(grid[0])
    if m == 1 and n == 1:
        return 0
    k = min(k, m + n - 3)
    seen = {(0, 0, k)}
    q: deque[tuple[int, int, int, int]] = deque([(0, 0, k, 0)])
    while q:
        r, c, rk, d = q.popleft()
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < m and 0 <= nc < n:
                nk = rk - grid[nr][nc]
                if nk >= 0 and (nr, nc, nk) not in seen:
                    if nr == m - 1 and nc == n - 1:
                        return d + 1
                    seen.add((nr, nc, nk))
                    q.append((nr, nc, nk, d + 1))
    return -1
```

**TypeScript：**
```typescript
function shortestPath(grid: number[][], k: number): number {
  const m = grid.length, n = grid[0].length;
  if (m === 1 && n === 1) return 0;
  k = Math.min(k, m + n - 3);
  const seen = new Set<string>([`0,0,${k}`]);
  const q: [number, number, number, number][] = [[0, 0, k, 0]];
  while (q.length) {
    const [r, c, rk, d] = q.shift()!;
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
      const nk = rk - grid[nr][nc];
      const key = `${nr},${nc},${nk}`;
      if (nk >= 0 && !seen.has(key)) {
        if (nr === m - 1 && nc === n - 1) return d + 1;
        seen.add(key);
        q.push([nr, nc, nk, d + 1]);
      }
    }
  }
  return -1;
}
```

**Java：**
```java
int shortestPath(int[][] grid, int k) {
    int m = grid.length, n = grid[0].length;
    if (m == 1 && n == 1) return 0;
    k = Math.min(k, m + n - 3);
    Set<String> seen = new HashSet<>();
    seen.add("0,0," + k);
    Deque<int[]> q = new ArrayDeque<>();
    q.offer(new int[]{0, 0, k, 0});
    int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
    while (!q.isEmpty()) {
        int[] cur = q.poll();
        for (int[] d : dirs) {
            int nr = cur[0] + d[0], nc = cur[1] + d[1];
            if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
            int nk = cur[2] - grid[nr][nc];
            String key = nr + "," + nc + "," + nk;
            if (nk >= 0 && !seen.contains(key)) {
                if (nr == m - 1 && nc == n - 1) return cur[3] + 1;
                seen.add(key);
                q.offer(new int[]{nr, nc, nk, cur[3] + 1});
            }
        }
    }
    return -1;
}
```

**要点：**
- 状态包含剩余消除次数 k。
- 把 k 截到 m+n-3，再大的绕路不会更优。
- BFS 保证最短步数；时间 O(m*n*k)。

**标签：** #algorithm

---

### 62. 基本计算器 II

**难度：** 中等
**主题：** 栈, 字符串, 解析
**岗位：** SWE
**级别：** E3-E5

**问题：** 实现一个基本计算器，求含非负整数和 `+`、`-`、`*`、`/` 的表达式（整除向零截断）。不含括号。

**思路：** 单次遍历，用栈存累加项。跟踪 `prevOp`（初始 '+'）和当前数字。遇运算符或末尾：若 prevOp '+' 压入 num，'-' 压入 -num，'*' 压入 pop*num，'/' 压入 pop/num。最后栈求和。O(n)。

**Python：**
```python
def calculate(s: str) -> int:
    stack: list[int] = []
    num = 0
    op = "+"
    for i, c in enumerate(s):
        if c.isdigit():
            num = num * 10 + int(c)
        if (not c.isdigit() and c != " ") or i == len(s) - 1:
            if op == "+":
                stack.append(num)
            elif op == "-":
                stack.append(-num)
            elif op == "*":
                stack.append(stack.pop() * num)
            else:
                # truncate toward zero
                stack.append(int(stack.pop() / num))
            op = c
            num = 0
    return sum(stack)
```

**TypeScript：**
```typescript
function calculate(s: string): number {
  const stack: number[] = [];
  let num = 0, op = "+";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c >= "0" && c <= "9") num = num * 10 + (c.charCodeAt(0) - 48);
    if ((c !== " " && (c < "0" || c > "9")) || i === s.length - 1) {
      if (op === "+") stack.push(num);
      else if (op === "-") stack.push(-num);
      else if (op === "*") stack.push(stack.pop()! * num);
      else stack.push(Math.trunc(stack.pop()! / num));
      op = c;
      num = 0;
    }
  }
  return stack.reduce((a, b) => a + b, 0);
}
```

**Java：**
```java
int calculate(String s) {
    Deque<Integer> stack = new ArrayDeque<>();
    int num = 0;
    char op = '+';
    for (int i = 0; i < s.length(); i++) {
        char c = s.charAt(i);
        if (Character.isDigit(c)) num = num * 10 + (c - '0');
        if ((c != ' ' && !Character.isDigit(c)) || i == s.length() - 1) {
            if (op == '+') stack.push(num);
            else if (op == '-') stack.push(-num);
            else if (op == '*') stack.push(stack.pop() * num);
            else stack.push(stack.pop() / num);
            op = c;
            num = 0;
        }
    }
    int sum = 0;
    for (int v : stack) sum += v;
    return sum;
}
```

**要点：**
- 遇到下一个运算符（或末尾）时，应用上一个运算符。
- `*` 与 `/` 立即与栈顶结合。
- 整数除法向零截断。

**标签：** #algorithm

---

## Meta 特有的建议

- **编码轮控节奏。** 35-40 分钟两题 = 每题约 17 分钟（含讨论）。别卡死。
- **主动报时空复杂度。** Meta 面试官就这点打分。
- **Jedi 准备 6+ 故事。** 同一项目他们会追问多个角度。准备好细节：人、时间、技术、数字。
- **Move fast（带判断力）。** Meta 是 FAANG 中唯一把执行速度写进价值观的公司。"我两周搞定了不是等两个月"这种故事很吃香。
- **FE/PM 邻近岗位的产品 sense 很重要。** 把你最喜欢的 Meta 产品研究透，并对它哪里不好有观点。

## 参考资料

- LeetCode "Facebook" / "Meta" 公司标签（top 50）
- Meta 工程博客
- 《Designing Data-Intensive Applications》—— Kleppmann（设计轮利器）
- Meta 官方发布的面试准备指南
