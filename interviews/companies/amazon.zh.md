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

## 题目

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

### 2. 岛屿数量

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

### 3. 两数之和

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

### 4. 合并 K 个有序链表

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

### 5. 单词拆分

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

### 6. 接雨水

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

### 7. 前 K 个高频元素

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

### 8. 重新排序日志文件

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

### 9. 设计停车场

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

### 10. 设计 Amazon Prime Video

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

### 11. 设计 Amazon.com 商品页

**难度：** 困难
**主题：** system-design, caching, microservices, search
**岗位：** 高级 SWE
**级别：** L5

**问题：** 设计支撑亚马逊商品详情页（标题、价格、库存、评论、推荐）的后端，每秒数百万请求。

**思路：** 页面由多个服务拼装：商品信息（写穿透缓存）、价格（实时，可能因人而异）、库存（最终一致的计数器）、评论（按 product_id 分片分页）、推荐（预计算）。BFF（backend-for-frontend）做扇出聚合，每个服务设超时；超时时用已有数据渲染（优雅降级）。读多写少字段重度走边缘缓存。讨论库存的最终一致性（"仅剩 2 件！"可能虚标）和黑五尖刺（预热缓存、自动扩容）。

**标签：** #system-design

---

### 12. 设计 Kindle 同步

**难度：** 困难
**主题：** system-design, sync, conflict-resolution, offline
**岗位：** 高级 SWE
**级别：** L5

**问题：** 设计 Kindle 跨用户多设备同步阅读进度、高亮、笔记的方式，即使设备间歇性离线也能工作。

**思路：** 每台设备维护本地状态 + 操作日志。重连时把操作推送到按用户分片的同步服务。服务端合并操作：阅读位置用 last-write-wins（或"读到最远位置"以抵御误点击），高亮/笔记则 append-only。用 vector clock 或 HLC 跨设备排序。存 DynamoDB 按 user_id 分片。通过 SNS 向其他设备推送通知。讨论冲突场景（两台设备离线编辑同一条笔记）和最终收敛保证。

**标签：** #system-design

---

### 13. 设计 Amazon S3

**难度：** 困难
**主题：** system-design, blob-storage, consistency, replication
**岗位：** 高级 SWE
**级别：** L5

**问题：** 设计 Amazon S3——全球可用、保证写后读强一致的对象存储服务。

**思路：** 前端 API 网关 → 按 hash(bucket+key) 路由到分片。每个分片有元数据服务（分片关系型/KV）+ 跨多个存储节点的纠删码对象数据（如 Reed-Solomon 10+4）。多 AZ 副本；跨区域异步复制做灾备。元数据协调器（基于 Paxos）保证强一致。生命周期（S3 → Glacier）由后台降级任务完成。讨论持久性数学（11 个 9）、大对象的分片上传、版本控制如何实现（不可变 object ID + 元数据中的版本栈）。

**标签：** #system-design

---

### 14. 设计分布式锁服务

**难度：** 困难
**主题：** system-design, consensus, paxos, zookeeper
**岗位：** 高级 SWE
**级别：** L5

**问题：** 设计 AWS 内部使用的分布式锁服务（类 Chubby 或 ZooKeeper）。

**思路：** 5-7 节点的 Raft/Paxos 集群对锁状态达成共识。客户端申请基于租约（TTL）的锁，处理客户端故障。会话/心跳：客户端不心跳就自动释放锁。讨论 fencing token（递增计数器传给下游服务，下游可拒绝陈旧锁持有者——著名的 Kleppmann 论证）。权衡：强一致 vs 延迟，单区域 vs 多区域（跨区域部署锁服务务必慎重）。

**标签：** #system-design

---

### 15. 讲一次你为客户超出预期付出的经历

**难度：** 中等
**主题：** behavioral, customer-obsession
**岗位：** SWE
**级别：** L4

**问题：** 描述一次你为取悦客户而超出本职付出的经历。

**思路：** STAR 对应 **Customer Obsession**（LP #1）。"客户"可以是内部的（另一个团队）或外部的。展示：你主动识别了对方没说出口的需求，跳出本职去解决，并有可量化的客户影响。避免泛泛的"我快速回了工单"。

**标签：** #behavioral

---

### 16. 讲一次你担起了职责之外的重要工作

**难度：** 中等
**主题：** behavioral, ownership, bias-for-action
**岗位：** SWE
**级别：** L4

**问题：** 讲一次你扛起了原本不属于你的工作的经历。

**思路：** STAR 对应 **Ownership** 和 **Bias for Action**。展示：(1) 你看见了空白，没等别人分派，(2) 没事事请示，(3) 影响真实可见。加分：你长期扛下来——"我顶了 6 个月，直到我们招到人。"别挑那种其实只是你本职工作的故事。

**标签：** #behavioral

---

### 17. 讲一次你在信息不足时做决策的经历

**难度：** 中等
**主题：** behavioral, bias-for-action, are-right-a-lot
**岗位：** 高级 SWE
**级别：** L5

**问题：** 讲一次你在缺乏全部信息的情况下迅速做决定的经历。

**思路：** STAR 对应 **Bias for Action** 和 **Are Right A Lot**。展示：(1) 等待的成本是真实可量化的，(2) 你识别了最小必要事实集，(3) 你做了决定并承诺，(4) 你有回滚或纠偏方案。决定错了没关系，只要你为善后负责。

**标签：** #behavioral

---

### 18. 讲讲你最有挑战的技术项目

**难度：** 中等
**主题：** behavioral, dive-deep, deliver-results
**岗位：** 高级 SWE
**级别：** L5

**问题：** 介绍你技术上最复杂的项目。难点在哪？你的角色是什么？

**思路：** STAR 对应 **Dive Deep** 和 **Deliver Results**。Bar raiser 会就这道题追问 15-20 分钟——准备好回答"为什么选这个数据库？"/"p99 是多少？"/"重做你会怎么改？"。挑一个你端到端 owner 且结果可量化的项目。如果你说不清架构权衡，换个故事。

**标签：** #behavioral

---

### 19. LP 深挖：Disagree and Commit

**难度：** 中等
**主题：** behavioral, have-backbone, earn-trust
**岗位：** 高级 SWE
**级别：** L5

**问题：** 讲一次你不同意某个决定但仍然承诺并帮其成功的经历。

**思路：** 对应 **Have Backbone; Disagree and Commit**——L5+ 最常问的 LP 之一。两段式：(1) 你在决定敲定前，在合适的场合用数据清楚表达了反对；(2) 决议不利于你时，你主动 commit——不是被动接受，而是主动去促成。加分：最终结果证明原决定是对的，你从中有所学习。

**标签：** #domain-knowledge

---

### 20. LP 深挖：Frugality

**难度：** 中等
**主题：** behavioral, frugality, invent-and-simplify
**岗位：** SWE
**级别：** L4

**问题：** 讲一次你用有限资源完成重大成果的经历。

**思路：** 对应 **Frugality**（"用更少做更多"）。资源可以是人力、时间、预算或算力。展示：你没去要更多人头/预算——而是想出了巧妙的简化方案（也呼应 **Invent and Simplify**）。具体：例如"我们需要实时分析但用不起 Snowflake——我用 Kinesis + DynamoDB streams 搭了一条管道，每月 200 美元，而不是 2 万美元。"量化节省。

**标签：** #domain-knowledge

---

### 21. 接雨水 II

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

### 22. LFU 缓存

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

### 23. 省份数量

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

### 24. 课程表

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

### 25. 单词接龙 II

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

### 26. 网络中的关键连接

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

### 27. 高尔夫赛事砍树

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

### 28. 迷宫 II

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

### 29. 困于环中的机器人

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

### 30. N 天后的牢房

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

### 31. 连接词

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

### 32. 含 3 个不同字符的长度为 3 的子串

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

### 33. 另一棵树的子树

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

### 34. 最常见单词

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

### 35. 复制带随机指针的链表

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

### 36. 概率最大的路径

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

### 37. 岛屿数量 II

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

### 38. 优化村庄供水分配

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

### 39. 最接近原点的 K 个点

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

### 40. 会议室 II

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

### 41. 数据流的中位数

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

### 42. 二叉树的序列化与反序列化

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

### 43. 单词搜索 II

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

### 44. 卡车上的最大单元数

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

### 45. 分析用户网站访问模式

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

### 46. 连接绳子的最小成本

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

### 47. 找出环形游戏的获胜者

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

### 48. 重构字符串

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

### 49. 滑动窗口最大值

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

### 50. 字母异位词分组

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

### 51. 最大子数组和（Kadane）

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

### 52. 二叉树的最近公共祖先

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

### 53. 工作安排的最大利润

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

### 54. 最小栈

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

### 55. 验证二叉搜索树

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

### 56. 搜索旋转排序数组

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

### 57. 设计点击计数器

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

### 58. 滑动谜题

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

### 59. 划分字母区间

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

### 60. 设计井字棋

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

### 61. 腐烂的橘子

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

### 62. 带障碍消除的网格最短路径

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
