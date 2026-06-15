# Google

```yaml
company: Google（Alphabet）
typical_rounds: 1 轮 recruiter 沟通 + 1 轮电话面 + 4-5 轮 onsite（3 轮编码、L5+ 1 轮系统设计、1 轮 Googleyness/领导力）
focus_areas: 算法、数据结构、大规模系统设计、Googleyness
languages_allowed: 任意主流语言；Python/Java/C++/Go 最常见
duration: 编码轮 45 分钟，系统设计 45-60 分钟
notable_quirks:
  - 代码写在共享文档里（无自动补全、无编译器）
  - 招聘委员会审材料；面试官并不直接做录用决定
  - "Googleyness" 轮考察模糊性处理、协作、智识谦逊
  - 准备好被深挖追问："如果输入是 10TB 呢？"/"现在改成并发的"
sources: Glassdoor、LeetCode Discuss（google 标签）、Blind、levels.fyi
```

## 概述

Google 的 loop 着重考察经典算法（图、DP、数据结构设计）以及在初始方案上做扩展/扩容。面试官非常看重代码整洁、边界正确、追问压力下的清晰推理。L5+ 的系统设计偏 Google 系基础设施（GFS、Bigtable、Spanner、MapReduce）——倒不是要你报菜名，而是这些权衡（一致 vs 可用、批处理 vs 流处理）会反复出现。

## 题目

### 1. 单词接龙

**难度：** 中等
**主题：** graph, bfs, strings, hashmap
**岗位：** SWE
**级别：** L3-L4

**问题：** 给定两个单词 `beginWord` 和 `endWord`，以及字典 `wordList`，返回从 `beginWord` 到 `endWord` 的最短转换序列长度，每次转换只改一个字母，且每个中间词都要在 `wordList` 中。无解则返回 0。

**思路：** 在词为节点、差一字母为边的图上 BFS。预建 `*at -> [bat, cat, hat]` 这类模式索引，可以 O(L) 找邻居，而不是逐个比对。双向 BFS 折半搜索空间。时间 O(N * L^2)，空间 O(N * L)。

**Python：**
```python
from collections import deque, defaultdict

def ladder_length(begin: str, end: str, word_list: list[str]) -> int:
    words = set(word_list)
    if end not in words:
        return 0
    patterns: dict[str, list[str]] = defaultdict(list)
    for w in words:
        for i in range(len(w)):
            patterns[w[:i] + "*" + w[i+1:]].append(w)
    seen = {begin}
    q: deque[tuple[str, int]] = deque([(begin, 1)])
    while q:
        w, d = q.popleft()
        if w == end:
            return d
        for i in range(len(w)):
            for nb in patterns[w[:i] + "*" + w[i+1:]]:
                if nb not in seen:
                    seen.add(nb)
                    q.append((nb, d + 1))
    return 0
```

**TypeScript：**
```typescript
function ladderLength(begin: string, end: string, wordList: string[]): number {
  const words = new Set(wordList);
  if (!words.has(end)) return 0;
  const patterns = new Map<string, string[]>();
  for (const w of words) {
    for (let i = 0; i < w.length; i++) {
      const k = w.slice(0, i) + "*" + w.slice(i + 1);
      if (!patterns.has(k)) patterns.set(k, []);
      patterns.get(k)!.push(w);
    }
  }
  const seen = new Set<string>([begin]);
  const q: [string, number][] = [[begin, 1]];
  while (q.length) {
    const [w, d] = q.shift()!;
    if (w === end) return d;
    for (let i = 0; i < w.length; i++) {
      const k = w.slice(0, i) + "*" + w.slice(i + 1);
      for (const nb of patterns.get(k) ?? []) {
        if (!seen.has(nb)) { seen.add(nb); q.push([nb, d + 1]); }
      }
    }
  }
  return 0;
}
```

**Java：**
```java
public int ladderLength(String begin, String end, List<String> wordList) {
    Set<String> words = new HashSet<>(wordList);
    if (!words.contains(end)) return 0;
    Map<String, List<String>> patterns = new HashMap<>();
    for (var w : words)
        for (int i = 0; i < w.length(); i++)
            patterns.computeIfAbsent(w.substring(0, i) + "*" + w.substring(i + 1), k -> new ArrayList<>()).add(w);
    Set<String> seen = new HashSet<>(); seen.add(begin);
    Deque<Object[]> q = new ArrayDeque<>(); q.offer(new Object[]{begin, 1});
    while (!q.isEmpty()) {
        var cur = q.poll(); String w = (String) cur[0]; int d = (int) cur[1];
        if (w.equals(end)) return d;
        for (int i = 0; i < w.length(); i++)
            for (var nb : patterns.getOrDefault(w.substring(0, i) + "*" + w.substring(i + 1), List.of()))
                if (seen.add(nb)) q.offer(new Object[]{nb, d + 1});
    }
    return 0;
}
```

**要点：**
- 通配符模式索引把找邻居从 O(N*L) 降到 O(L)。
- BFS 保证最短路径；入队时打标记避免重复扩展。
- 双向 BFS 从两端同时搜，指数级减小前沿规模。

**常见追问：**
- 双端 BFS——big-O 上能快多少？
- Word Ladder II——返回一个或所有最短序列。
- 查询间字典在线更新——增量维护模式索引。
- 对比 BFS 与带启发式（到 end 的距离）的 A*。

**常见坑：**
- 在 BFS 循环内反复重建模式索引，而不是一次性预构建。
- 出队时才标记 visited，会导致指数级重复扩展。

**标签：** #algorithm

---

### 2. 岛屿数量

**难度：** 中等
**主题：** graph, dfs, bfs, union-find, matrix
**岗位：** SWE
**级别：** L3-L4

**问题：** 给定 `m x n` 的二进制网格，`'1'` 为陆地，`'0'` 为水，返回岛屿数量（岛屿是水平/竖直相邻陆地的最大连通块）。

**思路：** 遍历每个格子；遇到未访问的 `'1'` 就 DFS/BFS 标记整座岛屿，计数加一。原地标记（翻成 `'0'`）省空间。O(m*n) 时间，O(m*n) 最坏递归栈。Google 爱追问："如果网格按行流式进来呢——设计一下"→ 按行合并的并查集。

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
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r][c] === "1") { dfs(r, c); count++; }
    }
  }
  return count;
}
```

**Java：**
```java
public int numIslands(char[][] grid) {
    if (grid.length == 0) return 0;
    int m = grid.length, n = grid[0].length, count = 0;
    for (int r = 0; r < m; r++)
        for (int c = 0; c < n; c++)
            if (grid[r][c] == '1') { dfs(grid, r, c, m, n); count++; }
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
- 原地标记避免 O(m*n) 的 visited 矩阵。
- 每个格子最多访问一次，整体 O(m*n)。
- 大岛上 BFS 版本可避免深递归栈。

**常见追问：**
- 流式：行逐行到达——切换到按行合并的并查集。
- 求最大岛屿面积、总周长、或完全被水包围的岛屿数。
- 把对角相邻视为连通——扩展邻居集合。
- 网格在多机分片——按全局坐标用并查集合并边界。

**常见坑：**
- 递归前没有翻转格子，导致死递归。
- 巨型网格上 DFS 递归过深超栈——改用显式 BFS 队列。

**标签：** #algorithm

---

### 3. 无重复字符的最长子串

**难度：** 中等
**主题：** strings, sliding-window, hashmap
**岗位：** SWE
**级别：** L3-L4

**问题：** 给定字符串 `s`，找出不含重复字符的最长子串长度。

**思路：** 滑动窗口 + `char -> last_index` 哈希表。窗口内遇到重复时，把 `left` 移到 `max(left, last_index + 1)`。O(n) 时间，O(min(n, alphabet)) 空间。边界：空串、全唯一、Unicode。

**Python：**
```python
def length_of_longest_substring(s: str) -> int:
    last: dict[str, int] = {}
    left = best = 0
    for r, c in enumerate(s):
        if c in last and last[c] >= left:
            left = last[c] + 1
        last[c] = r
        best = max(best, r - left + 1)
    return best
```

**TypeScript：**
```typescript
function lengthOfLongestSubstring(s: string): number {
  const last = new Map<string, number>();
  let left = 0, best = 0;
  for (let r = 0; r < s.length; r++) {
    const c = s[r];
    if (last.has(c) && last.get(c)! >= left) left = last.get(c)! + 1;
    last.set(c, r);
    best = Math.max(best, r - left + 1);
  }
  return best;
}
```

**Java：**
```java
public int lengthOfLongestSubstring(String s) {
    Map<Character, Integer> last = new HashMap<>();
    int left = 0, best = 0;
    for (int r = 0; r < s.length(); r++) {
        char c = s.charAt(r);
        if (last.containsKey(c) && last.get(c) >= left) left = last.get(c) + 1;
        last.put(c, r);
        best = Math.max(best, r - left + 1);
    }
    return best;
}
```

**要点：**
- `left` 只前进不回退。
- 哈希表保存每个字符最近出现的位置。
- O(n) 时间，O(min(n, alphabet)) 空间。

**常见追问：**
- 返回子串本身，不只是长度。
- 推广为“至多 k 个重复字符的最长子串”。
- 流式字符输入——在线维护答案。
- 对比哈希表（任意字符）与定长数组（ASCII / a-z）版本。

**常见坑：**
- 重复字符已在窗口外时也设 `left = last[c] + 1`。
- 用 `r - l` 而不是 `r - l + 1`，长度差 1。

**标签：** #algorithm

---

### 4. 会议室 II

**难度：** 中等
**主题：** heap, sorting, sweep-line, intervals
**岗位：** SWE
**级别：** L3-L4

**问题：** 给定会议时间区间数组 `[start, end]`，返回所需最少会议室数量。

**思路：** 按 start 排序；用结束时间的小顶堆。对每个会议，若最早结束的房间 `<= start`，复用（pop+push）；否则 push（开新房间）。最终堆大小即答案。备选：分别处理 start/end 数组的扫描线。O(n log n)。

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
  const push = (v: number) => { heap.push(v); heap.sort((a, b) => a - b); };
  for (const [s, e] of intervals) {
    if (heap.length && heap[0] <= s) heap.shift();
    push(e);
  }
  return heap.length;
}
```

**Java：**
```java
public int minMeetingRooms(int[][] intervals) {
    if (intervals.length == 0) return 0;
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
    PriorityQueue<Integer> heap = new PriorityQueue<>();
    for (var iv : intervals) {
        if (!heap.isEmpty() && heap.peek() <= iv[0]) heap.poll();
        heap.offer(iv[1]);
    }
    return heap.size();
}
```

**要点：**
- 堆顶 = 最早结束的会议，是唯一可复用的候选。
- 按 start 排序确保按时间顺序考虑会议。
- 排序与堆操作主导，总体 O(n log n)。

**常见追问：**
- 需要给每个会议分配具体房间号，而非只算房间数量。
- 跨日调度；房间有容量与设备约束。
- 会议被排入和取消的流式场景。
- 变体：会议可向前后偏移 ±Δ 分钟时所需最少房间。

**常见坑：**
- 只按结束时间排序，会丢失按时序复用房间的逻辑。
- 把 end == start 当作重叠；题目通常允许背靠背。

**标签：** #algorithm

---

### 5. 字符串解码

**难度：** 中等
**主题：** stack, strings, recursion
**岗位：** SWE
**级别：** L3-L4

**问题：** 给定编码字符串如 `"3[a2[c]]"`，解码为 `"accaccacc"`。编码规则 `k[encoded_string]` 表示重复 `encoded_string` `k` 次。`k` 总是正整数。

**思路：** 两个栈——一个存计数，一个存部分字符串。遇 `[` 时压入当前计数和当前串并重置。遇 `]` 时弹出合并。备选：递归下降解析器。注意多位数字。O(n * max_k)。

**Python：**
```python
def decode_string(s: str) -> str:
    count_stack: list[int] = []
    str_stack: list[str] = []
    cur = ""
    k = 0
    for c in s:
        if c.isdigit():
            k = k * 10 + int(c)
        elif c == "[":
            count_stack.append(k)
            str_stack.append(cur)
            k = 0
            cur = ""
        elif c == "]":
            cur = str_stack.pop() + cur * count_stack.pop()
        else:
            cur += c
    return cur
```

**TypeScript：**
```typescript
function decodeString(s: string): string {
  const countStack: number[] = [];
  const strStack: string[] = [];
  let cur = "", k = 0;
  for (const c of s) {
    if (c >= "0" && c <= "9") {
      k = k * 10 + (c.charCodeAt(0) - 48);
    } else if (c === "[") {
      countStack.push(k);
      strStack.push(cur);
      k = 0; cur = "";
    } else if (c === "]") {
      cur = strStack.pop()! + cur.repeat(countStack.pop()!);
    } else {
      cur += c;
    }
  }
  return cur;
}
```

**Java：**
```java
public String decodeString(String s) {
    Deque<Integer> countStack = new ArrayDeque<>();
    Deque<StringBuilder> strStack = new ArrayDeque<>();
    StringBuilder cur = new StringBuilder();
    int k = 0;
    for (char c : s.toCharArray()) {
        if (Character.isDigit(c)) k = k * 10 + (c - '0');
        else if (c == '[') { countStack.push(k); strStack.push(cur); k = 0; cur = new StringBuilder(); }
        else if (c == ']') {
            StringBuilder prev = strStack.pop();
            int times = countStack.pop();
            for (int i = 0; i < times; i++) prev.append(cur);
            cur = prev;
        } else cur.append(c);
    }
    return cur.toString();
}
```

**要点：**
- 两个栈把计数追踪与字符串构造解耦。
- 多位数字通过 `k = k*10 + digit` 累积。
- 遇 `]` 时，当前串是内部展开重复 `k` 次后接在保存的外层串后。

**常见追问：**
- 任意深度嵌套——压测实现是否健壮。
- 计数溢出 32 位整型——讨论 BigInt 或截断。
- 流式输入——边解析边输出。
- 反问：用最短长度编码任意字符串。

**常见坑：**
- 只处理单数字 `k`；多位数必须累积。
- 没有把 prev string 和 count 一起入栈，嵌套关闭时配对错位。

**标签：** #algorithm

---

### 6. 数据流的中位数

**难度：** 困难
**主题：** heap, design, streaming
**岗位：** SWE
**级别：** L5

**问题：** 设计支持 `addNum(int num)` 和 `findMedian()` 的数据结构。数字逐个到来；`findMedian` 必须 O(log n) 或更优。

**思路：** 两个堆——大顶堆 `lo` 装较小的一半，小顶堆 `hi` 装较大的一半。维护 `len(lo) == len(hi)` 或 `len(lo) == len(hi)+1`。添加：push 到 lo，再把 lo 顶移到 hi，再平衡。中位数为 `lo.top()` 或 `(lo.top() + hi.top())/2`。添加 O(log n)，查询 O(1)。

**Python：**
```python
import heapq

class MedianFinder:
    def __init__(self) -> None:
        self.lo: list[int] = []  # max-heap via negation
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
  private lo: number[] = []; // max-heap
  private hi: number[] = []; // min-heap
  private push(h: number[], v: number, max: boolean): void {
    h.push(v); h.sort((a, b) => max ? b - a : a - b);
  }
  addNum(num: number): void {
    this.push(this.lo, num, true);
    this.push(this.hi, this.lo.shift()!, false);
    if (this.hi.length > this.lo.length) this.push(this.lo, this.hi.shift()!, true);
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
    private final PriorityQueue<Integer> lo = new PriorityQueue<>(Comparator.reverseOrder()); // max-heap
    private final PriorityQueue<Integer> hi = new PriorityQueue<>(); // min-heap
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
- 两个堆把数据流一分为二，堆顶即边界候选。
- 不变式 `len(lo) >= len(hi)` 让 `lo` 顶 O(1) 得中位数。
- 跨堆 push 再再平衡，保证两种新元素分配都正确。

**常见追问：**
- 大小为 k 的滑动窗口中位数（属于不同问题类）。
- O(log n) 内的 99 分位或任意分位。
- 超大流——用蓄水池采样或 t-digest 限制内存。
- 并发写入——两个堆如何保持一致？

**常见坑：**
- Python 大顶堆模拟时忘记取负。
- 先加到 `hi`，首次调用平衡逻辑不同时会让 `lo` 为空。

**标签：** #algorithm

---

### 7. 矩阵中的最长递增路径

**难度：** 困难
**主题：** dp, dfs, memoization, graph
**岗位：** SWE
**级别：** L5

**问题：** 给定 `m x n` 整数矩阵，返回最长严格递增路径的长度。可以四方向移动。

**思路：** 带 memo 的 DFS——`dp[i][j]` = 从 `(i,j)` 出发的最长递增路径。递归到比当前大的邻居；缓存结果。严格递增本身就防环，不需要 visited 集。O(m*n) 时间/空间。

**Python：**
```python
from functools import lru_cache

def longest_increasing_path(matrix: list[list[int]]) -> int:
    if not matrix:
        return 0
    m, n = len(matrix), len(matrix[0])
    @lru_cache(maxsize=None)
    def dfs(r: int, c: int) -> int:
        best = 1
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < m and 0 <= nc < n and matrix[nr][nc] > matrix[r][c]:
                best = max(best, 1 + dfs(nr, nc))
        return best
    return max(dfs(r, c) for r in range(m) for c in range(n))
```

**TypeScript：**
```typescript
function longestIncreasingPath(matrix: number[][]): number {
  if (!matrix.length) return 0;
  const m = matrix.length, n = matrix[0].length;
  const memo: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
  const dirs: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const dfs = (r: number, c: number): number => {
    if (memo[r][c]) return memo[r][c];
    let best = 1;
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < m && nc >= 0 && nc < n && matrix[nr][nc] > matrix[r][c]) {
        best = Math.max(best, 1 + dfs(nr, nc));
      }
    }
    return memo[r][c] = best;
  };
  let ans = 0;
  for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) ans = Math.max(ans, dfs(r, c));
  return ans;
}
```

**Java：**
```java
public int longestIncreasingPath(int[][] matrix) {
    if (matrix.length == 0) return 0;
    int m = matrix.length, n = matrix[0].length, ans = 0;
    int[][] memo = new int[m][n];
    for (int r = 0; r < m; r++) for (int c = 0; c < n; c++) ans = Math.max(ans, dfs(matrix, r, c, m, n, memo));
    return ans;
}
private static final int[][] DIRS = {{1,0},{-1,0},{0,1},{0,-1}};
private int dfs(int[][] g, int r, int c, int m, int n, int[][] memo) {
    if (memo[r][c] != 0) return memo[r][c];
    int best = 1;
    for (var d : DIRS) {
        int nr = r + d[0], nc = c + d[1];
        if (nr >= 0 && nr < m && nc >= 0 && nc < n && g[nr][nc] > g[r][c])
            best = Math.max(best, 1 + dfs(g, nr, nc, m, n, memo));
    }
    return memo[r][c] = best;
}
```

**要点：**
- 严格递增约束形成 DAG，无需 visited 集。
- 记忆化让整体 O(m*n)——每格只解一次。
- 每格最多探 4 个邻居，常数级。

**常见追问：**
- 返回路径本身，而非长度——memo 存前驱。
- 允许对角移动——扩展邻居集。
- 严格递增放宽为非递减——必须做环检测。
- 超大矩阵——按 DAG 做拓扑序，而非递归 DFS。

**常见坑：**
- 当作通用图加 visited 追踪，性能崩盘。
- 不校验严格递增不变式就递归，相等格容易死递归。

**标签：** #algorithm

---

### 8. 规划任务最大收益

**难度：** 困难
**主题：** dp, binary-search, sorting, intervals
**岗位：** SWE
**级别：** L5

**问题：** 给定 `n` 个任务，包含 `startTime[i]`、`endTime[i]`、`profit[i]`，返回时间不重叠的任务子集的最大总收益。

**思路：** 按结束时间排序。`dp[i]` = 使用前 `i` 个任务的最大收益。对任务 `i`，要么跳过（`dp[i-1]`），要么选取（`profit[i] + dp[j]`，其中 `j` 是结束时间 `<= start[i]` 的最后一个任务，二分查找）。O(n log n)。

**Python：**
```python
from bisect import bisect_right

def job_scheduling(start: list[int], end: list[int], profit: list[int]) -> int:
    jobs = sorted(zip(end, start, profit))
    ends = [e for e, _, _ in jobs]
    dp = [0] * (len(jobs) + 1)
    for i, (e, s, p) in enumerate(jobs, 1):
        j = bisect_right(ends, s, hi=i - 1)
        dp[i] = max(dp[i - 1], dp[j] + p)
    return dp[-1]
```

**TypeScript：**
```typescript
function jobScheduling(start: number[], end: number[], profit: number[]): number {
  const n = start.length;
  const jobs = Array.from({ length: n }, (_, i) => [end[i], start[i], profit[i]]);
  jobs.sort((a, b) => a[0] - b[0]);
  const ends = jobs.map(j => j[0]);
  const dp = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    const [, s, p] = jobs[i - 1];
    // binary search for largest index < i whose end <= s
    let lo = 0, hi = i - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (ends[mid] <= s) lo = mid + 1; else hi = mid;
    }
    dp[i] = Math.max(dp[i - 1], dp[lo] + p);
  }
  return dp[n];
}
```

**Java：**
```java
public int jobScheduling(int[] start, int[] end, int[] profit) {
    int n = start.length;
    int[][] jobs = new int[n][3];
    for (int i = 0; i < n; i++) jobs[i] = new int[]{end[i], start[i], profit[i]};
    Arrays.sort(jobs, (a, b) -> a[0] - b[0]);
    int[] dp = new int[n + 1];
    for (int i = 1; i <= n; i++) {
        int s = jobs[i - 1][1], p = jobs[i - 1][2];
        int lo = 0, hi = i - 1;
        while (lo < hi) { int mid = (lo + hi) >>> 1; if (jobs[mid][0] <= s) lo = mid + 1; else hi = mid; }
        dp[i] = Math.max(dp[i - 1], dp[lo] + p);
    }
    return dp[n];
}
```

**要点：**
- 按结束时间排序，便于二分查找最近的兼容任务。
- `dp[i]` 决策是二元的：选或不选任务 `i`。
- 排序 + n 次二分共计 O(n log n)。

**常见追问：**
- 允许至多 k 个任务重叠——推广到多机调度。
- 任务间需要 setup 时间。
- 最大化任务数而非收益——经典活动选择。
- 流式任务到达——动态维护最优收益。

**常见坑：**
- 按 start 排序而不是 end，二分目标对不上。
- 把 `start[j]` 与 `start[i]` 二分，而不是 `end[j]`。

**标签：** #algorithm

---

### 9. 设计 Google Docs（协作编辑器）

**难度：** 困难
**主题：** system-design, crdt, operational-transform, websockets, consistency
**岗位：** 高级 SWE
**级别：** L5

**问题：** 设计像 Google Docs 那样支持多人并发编辑的实时协作文档编辑器。

**思路：** 核心是并发编辑下的最终一致。两种主流技术：Operational Transformation（OT，Google Docs 实际所用）或 CRDT。客户端把操作发到单文档的服务器（基于 doc ID 的一致性哈希做粘性会话）。服务端序列化操作，通过 WebSocket 广播给所有协作者。操作日志 + 定期快照持久化到分布式存储（Bigtable/Spanner）。权衡：OT 需要中心服务器但 op 紧凑；CRDT 适合 P2P 但元数据重。讨论光标在场、离线编辑、撤销。

**常见追问：**
- OT vs CRDT——什么时候选哪个，权衡如何？
- 移动端离线编辑——如何调和分叉历史？
- 实时在场（光标、选区）——独立通道还是搭车？
- 多人场景下的 undo/redo——语义 undo vs 顺序 undo。
- 编辑期间权限/访问控制变化的处理。

**常见坑：**
- 字符级 last-write-wins，冲突下文本会被毁。
- 跳过持久化 op 日志；重启会丢失正在传输的并发编辑。

**标签：** #system-design

---

### 10. 设计 Google 搜索自动补全

**难度：** 困难
**主题：** system-design, trie, caching, ranking, sharding
**岗位：** 高级 SWE
**级别：** L5

**问题：** 设计为数十亿用户的 Google 搜索框提供 typeahead 建议的服务。

**思路：** 前缀字典树，每个节点缓存 top-k 补全（离线根据查询日志预计算）。按前缀范围在多台服务器上分片。热门前缀走 CDN/边缘缓存（Zipfian 分布）。新查询流入流式管道（Dataflow），按小时更新 trie 权重。讨论延迟预算（<100ms）、个性化（top-k 用用户信号重排）、拼写纠正、敏感词过滤、以及如何在不重建整棵 trie 的前提下增量更新。

**常见追问：**
- 基于登录用户历史的个性化——在哪里执行？
- 多语言/IME 输入——建议在哪些时机才有效？
- 1 小时以内出现的新热点——流式管道如何变？
- 拼写纠正/容错——做进 trie 还是独立服务？
- 敏感词/安全过滤在边缘还是源站做。

**常见坑：**
- 当作单一全局 trie；忽视分片与缓存局部性。
- 每次查询重新计算 top-k 补全，而不是在 trie 节点预计算。

**标签：** #system-design

---

### 11. 设计 YouTube

**难度：** 困难
**主题：** system-design, cdn, video-encoding, sharding, recommendation
**岗位：** 高级 SWE
**级别：** L5

**问题：** 端到端设计 YouTube：上传、编码、存储、播放、推荐。

**思路：** 上传到对象存储（GCS），编码任务入 pub/sub 队列。编码器转码到多分辨率/编解码器（H.264、VP9、AV1）和切片 HLS/DASH。元数据存分片 RDBMS，观看数存类 Bigtable 系统（最终一致）。播放经 CDN 提供，源站按需回源。推荐：离线候选生成（矩阵分解、双塔）+ 在线排序。讨论冷启动、缩略图选择、版权检测（Content ID）、观看数的读写扇出。

**标签：** #system-design

---

### 12. 设计分布式键值存储

**难度：** 困难
**主题：** system-design, consistent-hashing, replication, consensus, sharding
**岗位：** 高级 SWE
**级别：** L5

**问题：** 设计分布式 KV 存储（类似 DynamoDB 或 Bigtable）。覆盖分片、复制、一致性、故障处理。

**思路：** 一致性哈希做分片放置；虚拟节点均衡负载。副本数 N（通常 3）跨机架/可用区。Quorum 读写（R + W > N 强一致）。每分片用 Raft 或 Paxos 做 leader 选举；或 Dynamo 风格的无 leader + 向量时钟 + 读修复。Hinted handoff 和 Merkle 树反熵保证最终一致。明确讨论 CAP 权衡："购物车选 AP，库存选 CP。"

**标签：** #system-design

---

### 13. 设计 Google Drive

**难度：** 困难
**主题：** system-design, blob-storage, sync, conflict-resolution, chunking
**岗位：** 高级 SWE
**级别：** L5

**问题：** 设计 Google Drive：文件存储，支持多设备同步和分享。

**思路：** 文件切成 4MB 块，按 SHA-256 内容寻址（跨用户去重）。块存对象存储；每用户元数据（文件树、ACL、版本）存分片 RDBMS。同步客户端计算本地哈希，与服务端 manifest 比对差异，只上传变更块（rsync 风格）。冲突解决：并发编辑时双方版本保留。通过长轮询/WebSocket 通知。讨论分享模型（ACL 继承）、大文件上传（断点续传）、端到端加密的取舍。

**标签：** #system-design

---

### 14. 设计 Google 日历

**难度：** 中等
**主题：** system-design, scheduling, timezones, recurrence, notifications
**岗位：** 高级 SWE
**级别：** L5

**问题：** 设计 Google 日历：事件创建、重复事件、提醒、忙闲查询。

**思路：** 事件存为 `(owner, start, end, recurrence_rule)`，用 iCalendar RRULE 格式——不要展开每个实例。每用户日历按 user_id 分片。忙闲是事件索引上的区间查询；跨用户"找时间"用忙闲区间的并集。提醒：时间分桶队列（Chubby/ZK 协调）触发到通知服务。时区是难点——事件存 UTC + IANA tz id，本地渲染。讨论邀请 RSVP、重复事件的例外、电话拨入集成。

**标签：** #system-design

---

### 15. 讲一次你和同事意见不一致的经历

**难度：** 中等
**主题：** behavioral, conflict, collaboration
**岗位：** SWE
**级别：** L3-L4

**问题：** 讲一次你与队友或经理意见强烈分歧的经历。你是怎么处理的？结果如何？

**思路：** STAR。挑*技术*分歧（Google 喜欢数据驱动的辩论）。展示：(1) 你在表达自己观点前先理解了对方，(2) 你提出了用具体数据/实验来解决，(3) 哪怕"输了"你也优雅接受。避免那种自始至终你对他错的故事——Google 会探查智识谦逊。

**标签：** #behavioral

---

### 16. 你做过的最有挑战的项目

**难度：** 中等
**主题：** behavioral, ownership, technical-depth
**岗位：** SWE
**级别：** L3-L4

**问题：** 带我走一遍你做过的技术上最有挑战的项目。难在哪？

**思路：** STAR，重点放在 T（任务）和 A（行动）。准备 5-10 分钟追问："为什么选这个算法？"/"你怎么衡量成功？"/"重做会怎么改？"。挑你能端到端 own 而不是只做某一部分的项目。量化影响。

**标签：** #behavioral

---

### 17. 应对模糊需求的经历

**难度：** 中等
**主题：** behavioral, ambiguity, googleyness
**岗位：** 高级 SWE
**级别：** L5

**问题：** 讲一次你在需求不明或变动的项目里工作的经历。

**思路：** 这是 Google "Googleyness" 的招牌题。展示：(1) 你没等——主动提出 v0 倒逼明确，(2) 你与 PM/干系人结伴而不是抱怨，(3) 你通过迭代发布降低风险。落在影响："因为我们没等完整需求，X 提早了 2 个季度上线。"

**标签：** #behavioral

---

### 18. 你失败的经历

**难度：** 中等
**主题：** behavioral, failure, growth-mindset
**岗位：** SWE
**级别：** L3-L4

**问题：** 讲一次重大失败。发生了什么？你学到了什么？

**思路：** 挑一次真实失败（不是"我太拼了"）。展示：(1) 你不甩锅、独自扛起，(2) 你理解到*系统性*根因（流程缺口、缺失测试、错误假设），(3) 教训改变了你之后的工作方式，并有具体例子。加分：修复让团队整体受益，不止你自己。

**标签：** #behavioral

---

### 19. 为 Google API 网关设计限流

**难度：** 困难
**主题：** system-design, rate-limiting, distributed-systems, redis
**岗位：** 高级 SWE
**级别：** L5

**问题：** 为全球分布、每秒百万 QPS 的 API 网关设计按用户 / 按 API key 的配额限流。

**思路：** 算法：令牌桶（平滑突发）或滑动窗口日志（精确）。存储：按 user_id 分片的 Redis 集群 + Lua 脚本保证原子递减+判断。跨区域全局限额：硬限走中心化权威，软限可最终一致 + 允许超量。讨论分层：每秒（进程内 LRU）→ 每分钟（区域 Redis）→ 每天（全局 DB）。限流器宕机时的失败模式：开/关。

**标签：** #domain-knowledge

---

### 20. 优化分布式 SQL 系统的慢查询

**难度：** 困难
**主题：** databases, distributed-systems, query-optimization, indexing
**岗位：** 高级 SWE
**级别：** L5

**问题：** Spanner（或任意分布式 SQL）上的一条查询应该 200ms 但跑了 30s。讲讲你是怎么排查和修复的。

**思路：** 从 `EXPLAIN ANALYZE` 入手——找全表扫描、跨分片 join、热分片。看查询是落在一个分片（好）还是扇出（差——可能要交叉表或重构表结构）。检查缺失的二级索引；考虑覆盖索引避免回查。如果分片分布倾斜（一个租户 = 50% 数据），讨论重分片或按租户隔离。提一下要关注的指标（p99 延迟、扫描行数、每分片 CPU），并讨论是否需要反范式化。

**标签：** #domain-knowledge

---

### 21. 接雨水

**难度：** 困难
**主题：** 数组, 双指针, 动态规划, 栈
**岗位：** SWE
**级别：** L3-L5

**问题：** 给定 `n` 个非负整数表示宽度为 1 的柱状高度图，计算下雨后能接住多少水。

**思路：** 双指针扫描，维护 `left_max` 和 `right_max`。每一步较小的一侧决定该列水量，移动较小侧、更新其最大值、累加 `max - height[i]`。O(n) 时间、O(1) 空间。备选：单调栈逐个弹出"凹槽"。

**Python：**
```python
def trap(height: list[int]) -> int:
    l, r = 0, len(height) - 1
    lmax = rmax = water = 0
    while l < r:
        if height[l] < height[r]:
            lmax = max(lmax, height[l])
            water += lmax - height[l]
            l += 1
        else:
            rmax = max(rmax, height[r])
            water += rmax - height[r]
            r -= 1
    return water
```

**TypeScript：**
```typescript
function trap(height: number[]): number {
  let l = 0, r = height.length - 1;
  let lmax = 0, rmax = 0, water = 0;
  while (l < r) {
    if (height[l] < height[r]) {
      lmax = Math.max(lmax, height[l]);
      water += lmax - height[l];
      l++;
    } else {
      rmax = Math.max(rmax, height[r]);
      water += rmax - height[r];
      r--;
    }
  }
  return water;
}
```

**Java：**
```java
public int trap(int[] height) {
    int l = 0, r = height.length - 1, lmax = 0, rmax = 0, water = 0;
    while (l < r) {
        if (height[l] < height[r]) {
            lmax = Math.max(lmax, height[l]);
            water += lmax - height[l];
            l++;
        } else {
            rmax = Math.max(rmax, height[r]);
            water += rmax - height[r];
            r--;
        }
    }
    return water;
}
```

**要点：**
- 较小侧的运行最大值决定该列水量。
- 单次扫描，O(1) 额外空间。
- 两端（l=0, r=n-1）永远存不了水。

**标签：** #algorithm

---

### 22. 二叉树的序列化与反序列化

**难度：** 困难
**主题：** 树, dfs, bfs, 设计, 字符串
**岗位：** SWE
**级别：** L3-L5

**问题：** 设计算法将二叉树序列化为字符串，并能反序列化还原。树可能含重复值；必须精确保留结构。

**思路：** 前序 DFS 显式记 null（如 `1,2,#,#,3,#,#`）。反序列化按 token 递归消费。O(n) 时间和空间。备选：BFS 层序加 null——对稀疏树略紧凑但解析更繁琐。

**Python：**
```python
class TreeNode:
    def __init__(self, val: int = 0, left: "TreeNode | None" = None, right: "TreeNode | None" = None) -> None:
        self.val = val; self.left = left; self.right = right

def serialize(root: TreeNode | None) -> str:
    parts: list[str] = []
    def go(n: TreeNode | None) -> None:
        if n is None:
            parts.append("#"); return
        parts.append(str(n.val))
        go(n.left); go(n.right)
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
class TreeNode {
  val: number; left: TreeNode | null; right: TreeNode | null;
  constructor(v = 0, l: TreeNode | null = null, r: TreeNode | null = null) { this.val = v; this.left = l; this.right = r; }
}

function serialize(root: TreeNode | null): string {
  const out: string[] = [];
  const go = (n: TreeNode | null): void => {
    if (!n) { out.push("#"); return; }
    out.push(String(n.val)); go(n.left); go(n.right);
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
    const n = new TreeNode(parseInt(v, 10));
    n.left = go(); n.right = go();
    return n;
  };
  return go();
}
```

**Java：**
```java
static class TreeNode { int val; TreeNode left, right; TreeNode(int v) { val = v; } }

public String serialize(TreeNode root) {
    StringBuilder sb = new StringBuilder();
    ser(root, sb);
    return sb.toString();
}
private void ser(TreeNode n, StringBuilder sb) {
    if (n == null) { sb.append("#,"); return; }
    sb.append(n.val).append(','); ser(n.left, sb); ser(n.right, sb);
}
public TreeNode deserialize(String data) {
    return de(new ArrayDeque<>(Arrays.asList(data.split(","))));
}
private TreeNode de(Deque<String> tokens) {
    String v = tokens.poll();
    if (v == null || v.equals("#")) return null;
    TreeNode n = new TreeNode(Integer.parseInt(v));
    n.left = de(tokens); n.right = de(tokens);
    return n;
}
```

**要点：**
- 前序 + null 标记让结构无歧义。
- 共享 iterator/索引驱动反序列化，单次线性扫描。
- 由位置而非值定义结构，因此天然处理重复值。

**标签：** #algorithm

---

### 23. 火星词典

**难度：** 困难
**主题：** 图, 拓扑排序, bfs, dfs, 字符串
**岗位：** SWE
**级别：** L5+

**问题：** 给定一份按外星语言字母序排好的小写单词列表，推导该语言的字母顺序。返回任意合法序，若无解（环或像 `["abc","ab"]` 这种前缀冲突）返回空串。

**思路：** 由相邻单词对建有向图：首个不同字符给出边 `a -> b`。Kahn 算法（零入度 BFS）或带环检测的 DFS 做拓扑排序。注意前缀冲突的边界情况。O(C)，C 为总字符数。

**Python：**
```python
from collections import defaultdict, deque

def alien_order(words: list[str]) -> str:
    graph: dict[str, set[str]] = defaultdict(set)
    in_deg: dict[str, int] = {c: 0 for w in words for c in w}
    for a, b in zip(words, words[1:]):
        for x, y in zip(a, b):
            if x != y:
                if y not in graph[x]:
                    graph[x].add(y)
                    in_deg[y] += 1
                break
        else:
            if len(a) > len(b):
                return ""
    q: deque[str] = deque([c for c, d in in_deg.items() if d == 0])
    out: list[str] = []
    while q:
        c = q.popleft()
        out.append(c)
        for nb in graph[c]:
            in_deg[nb] -= 1
            if in_deg[nb] == 0:
                q.append(nb)
    return "".join(out) if len(out) == len(in_deg) else ""
```

**TypeScript：**
```typescript
function alienOrder(words: string[]): string {
  const graph = new Map<string, Set<string>>();
  const inDeg = new Map<string, number>();
  for (const w of words) for (const c of w) {
    if (!graph.has(c)) graph.set(c, new Set());
    if (!inDeg.has(c)) inDeg.set(c, 0);
  }
  for (let i = 0; i + 1 < words.length; i++) {
    const a = words[i], b = words[i + 1];
    let found = false;
    for (let k = 0; k < Math.min(a.length, b.length); k++) {
      if (a[k] !== b[k]) {
        if (!graph.get(a[k])!.has(b[k])) {
          graph.get(a[k])!.add(b[k]);
          inDeg.set(b[k], inDeg.get(b[k])! + 1);
        }
        found = true; break;
      }
    }
    if (!found && a.length > b.length) return "";
  }
  const q: string[] = [];
  for (const [c, d] of inDeg) if (d === 0) q.push(c);
  const out: string[] = [];
  while (q.length) {
    const c = q.shift()!;
    out.push(c);
    for (const nb of graph.get(c)!) {
      inDeg.set(nb, inDeg.get(nb)! - 1);
      if (inDeg.get(nb) === 0) q.push(nb);
    }
  }
  return out.length === inDeg.size ? out.join("") : "";
}
```

**Java：**
```java
public String alienOrder(String[] words) {
    Map<Character, Set<Character>> graph = new HashMap<>();
    Map<Character, Integer> inDeg = new HashMap<>();
    for (var w : words) for (char c : w.toCharArray()) { graph.putIfAbsent(c, new HashSet<>()); inDeg.putIfAbsent(c, 0); }
    for (int i = 0; i + 1 < words.length; i++) {
        String a = words[i], b = words[i + 1];
        boolean found = false;
        for (int k = 0; k < Math.min(a.length(), b.length()); k++)
            if (a.charAt(k) != b.charAt(k)) {
                if (graph.get(a.charAt(k)).add(b.charAt(k))) inDeg.merge(b.charAt(k), 1, Integer::sum);
                found = true; break;
            }
        if (!found && a.length() > b.length()) return "";
    }
    Deque<Character> q = new ArrayDeque<>();
    inDeg.forEach((c, d) -> { if (d == 0) q.offer(c); });
    StringBuilder out = new StringBuilder();
    while (!q.isEmpty()) {
        char c = q.poll(); out.append(c);
        for (char nb : graph.get(c)) if (inDeg.merge(nb, -1, Integer::sum) == 0) q.offer(nb);
    }
    return out.length() == inDeg.size() ? out.toString() : "";
}
```

**要点：**
- 相邻单词的首个不同字符提供唯一一条排序边。
- 前缀冲突（`["abc","ab"]`）无效，返回 ""。
- Kahn BFS 通过遗留非零入度检测环。

**标签：** #algorithm

---

### 24. 单词拆分 II

**难度：** 困难
**主题：** 动态规划, 回溯, 字符串, 字典树, memoization
**岗位：** SWE
**级别：** L5+

**问题：** 给定字符串 `s` 与字典 `wordDict`，返回所有能将 `s` 切分为字典词的句子（用空格分隔）。每个词可重复使用。

**思路：** 记忆化递归——`solve(i)` 返回 `s[i:]` 的所有句子。对每个使得 `s[i:j]` 在字典中的 `j`，把该词拼到 `solve(j)` 的每个句子前。字典树加速前缀查询。最坏输出指数级，但 memo 让每个后缀只算一次。

**Python：**
```python
def word_break(s: str, word_dict: list[str]) -> list[str]:
    words = set(word_dict)
    memo: dict[int, list[str]] = {}
    def solve(i: int) -> list[str]:
        if i in memo:
            return memo[i]
        if i == len(s):
            return [""]
        res: list[str] = []
        for j in range(i + 1, len(s) + 1):
            w = s[i:j]
            if w in words:
                for tail in solve(j):
                    res.append(w if tail == "" else w + " " + tail)
        memo[i] = res
        return res
    return solve(0)
```

**TypeScript：**
```typescript
function wordBreak(s: string, wordDict: string[]): string[] {
  const words = new Set(wordDict);
  const memo = new Map<number, string[]>();
  const solve = (i: number): string[] => {
    if (memo.has(i)) return memo.get(i)!;
    if (i === s.length) return [""];
    const res: string[] = [];
    for (let j = i + 1; j <= s.length; j++) {
      const w = s.slice(i, j);
      if (words.has(w)) {
        for (const tail of solve(j)) {
          res.push(tail === "" ? w : w + " " + tail);
        }
      }
    }
    memo.set(i, res);
    return res;
  };
  return solve(0);
}
```

**Java：**
```java
public List<String> wordBreak(String s, List<String> wordDict) {
    Set<String> words = new HashSet<>(wordDict);
    Map<Integer, List<String>> memo = new HashMap<>();
    return solve(s, 0, words, memo);
}
private List<String> solve(String s, int i, Set<String> words, Map<Integer, List<String>> memo) {
    if (memo.containsKey(i)) return memo.get(i);
    List<String> res = new ArrayList<>();
    if (i == s.length()) { res.add(""); return res; }
    for (int j = i + 1; j <= s.length(); j++) {
        String w = s.substring(i, j);
        if (words.contains(w))
            for (var tail : solve(s, j, words, memo))
                res.add(tail.isEmpty() ? w : w + " " + tail);
    }
    memo.put(i, res);
    return res;
}
```

**要点：**
- 按后缀起点记忆化避免指数级重算。
- 基础情形 `i == len(s)` 返回一个空句子作组合种子。
- 输出本身可能指数级——这是问题固有的。

**标签：** #algorithm

---

### 25. 正则表达式匹配

**难度：** 困难
**主题：** 动态规划, 字符串, 递归
**岗位：** SWE
**级别：** L5+

**问题：** 实现支持 `.`（任意单字符）和 `*`（前一元素的零次或多次）的正则匹配。必须完整匹配整串，不是部分匹配。

**思路：** 2D DP——`dp[i][j]` = `s[:i]` 是否匹配 `p[:j]`。若 `p[j-1] == '*'`，要么零次使用（`dp[i][j-2]`），要么扩展（若末字符匹配则 `dp[i-1][j]`）。否则要求字符匹配且 `dp[i-1][j-1]`。O(m*n)。

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
                if p[j - 2] == s[i - 1] or p[j - 2] == ".":
                    dp[i][j] = dp[i][j] or dp[i - 1][j]
            else:
                if p[j - 1] == s[i - 1] or p[j - 1] == ".":
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
public boolean isMatch(String s, String p) {
    int m = s.length(), n = p.length();
    boolean[][] dp = new boolean[m + 1][n + 1];
    dp[0][0] = true;
    for (int j = 1; j <= n; j++) if (p.charAt(j - 1) == '*') dp[0][j] = dp[0][j - 2];
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (p.charAt(j - 1) == '*') {
                dp[i][j] = dp[i][j - 2];
                if (p.charAt(j - 2) == s.charAt(i - 1) || p.charAt(j - 2) == '.')
                    dp[i][j] = dp[i][j] || dp[i - 1][j];
            } else if (p.charAt(j - 1) == s.charAt(i - 1) || p.charAt(j - 1) == '.') {
                dp[i][j] = dp[i - 1][j - 1];
            }
        }
    }
    return dp[m][n];
}
```

**要点：**
- `*` 表示前一元素零次（`dp[i][j-2]`）或多一次（`dp[i-1][j]`）。
- 初始化首行处理 `a*b*c*` 匹配空串这类模式。
- 必须完整匹配（看 `dp[m][n]`，不是任何前缀）。

**标签：** #algorithm

---

### 26. 课程表 II

**难度：** 中等
**主题：** 图, 拓扑排序, bfs, dfs
**岗位：** SWE
**级别：** L3-L5

**问题：** 有 `numCourses` 门课，编号 `0..n-1`。给定 `prerequisites[i] = [a, b]` 表示选 `a` 前要先选 `b`，返回任意一种可完成的课程序列，若不可行返回空列表。

**思路：** Kahn 算法——算入度，所有零入度入队，循环出队并递减邻居入度。若输出长度 < n 则有环。O(V + E)。

**Python：**
```python
from collections import deque, defaultdict

def find_order(num_courses: int, prerequisites: list[list[int]]) -> list[int]:
    graph: dict[int, list[int]] = defaultdict(list)
    in_deg = [0] * num_courses
    for a, b in prerequisites:
        graph[b].append(a)
        in_deg[a] += 1
    q: deque[int] = deque(i for i in range(num_courses) if in_deg[i] == 0)
    out: list[int] = []
    while q:
        c = q.popleft()
        out.append(c)
        for nb in graph[c]:
            in_deg[nb] -= 1
            if in_deg[nb] == 0:
                q.append(nb)
    return out if len(out) == num_courses else []
```

**TypeScript：**
```typescript
function findOrder(numCourses: number, prerequisites: number[][]): number[] {
  const graph: number[][] = Array.from({ length: numCourses }, () => []);
  const inDeg = new Array(numCourses).fill(0);
  for (const [a, b] of prerequisites) { graph[b].push(a); inDeg[a]++; }
  const q: number[] = [];
  for (let i = 0; i < numCourses; i++) if (inDeg[i] === 0) q.push(i);
  const out: number[] = [];
  while (q.length) {
    const c = q.shift()!;
    out.push(c);
    for (const nb of graph[c]) if (--inDeg[nb] === 0) q.push(nb);
  }
  return out.length === numCourses ? out : [];
}
```

**Java：**
```java
public int[] findOrder(int numCourses, int[][] prerequisites) {
    List<List<Integer>> graph = new ArrayList<>();
    for (int i = 0; i < numCourses; i++) graph.add(new ArrayList<>());
    int[] inDeg = new int[numCourses];
    for (var p : prerequisites) { graph.get(p[1]).add(p[0]); inDeg[p[0]]++; }
    Deque<Integer> q = new ArrayDeque<>();
    for (int i = 0; i < numCourses; i++) if (inDeg[i] == 0) q.offer(i);
    int[] out = new int[numCourses];
    int idx = 0;
    while (!q.isEmpty()) {
        int c = q.poll();
        out[idx++] = c;
        for (int nb : graph.get(c)) if (--inDeg[nb] == 0) q.offer(nb);
    }
    return idx == numCourses ? out : new int[0];
}
```

**要点：**
- 从所有零入度节点 BFS，按层处理课程。
- 输出节点少于 `n` 即检测到环。
- O(V + E)——每条边只让某个入度递减一次。

**标签：** #algorithm

---

### 27. 寻找两个正序数组的中位数

**难度：** 困难
**主题：** 二分查找, 数组, 分治
**岗位：** SWE
**级别：** L5+

**问题：** 给定两个有序数组 `nums1`、`nums2`，长度分别为 `m`、`n`，在 O(log(m+n)) 时间内求合并后中位数。

**思路：** 对较短数组的划分做二分。在 `nums1` 找 `i`，`nums2` 的 `j = (m+n+1)/2 - i`，使两侧 `max(left) <= min(right)`。O(log(min(m,n)))。注意空数组、划分全偏一侧等边界。

**Python：**
```python
def find_median_sorted_arrays(nums1: list[int], nums2: list[int]) -> float:
    if len(nums1) > len(nums2):
        nums1, nums2 = nums2, nums1
    m, n = len(nums1), len(nums2)
    lo, hi = 0, m
    while lo <= hi:
        i = (lo + hi) // 2
        j = (m + n + 1) // 2 - i
        l1 = float("-inf") if i == 0 else nums1[i - 1]
        r1 = float("inf") if i == m else nums1[i]
        l2 = float("-inf") if j == 0 else nums2[j - 1]
        r2 = float("inf") if j == n else nums2[j]
        if l1 <= r2 and l2 <= r1:
            if (m + n) % 2:
                return float(max(l1, l2))
            return (max(l1, l2) + min(r1, r2)) / 2
        if l1 > r2:
            hi = i - 1
        else:
            lo = i + 1
    return 0.0
```

**TypeScript：**
```typescript
function findMedianSortedArrays(nums1: number[], nums2: number[]): number {
  if (nums1.length > nums2.length) [nums1, nums2] = [nums2, nums1];
  const m = nums1.length, n = nums2.length;
  let lo = 0, hi = m;
  while (lo <= hi) {
    const i = (lo + hi) >> 1;
    const j = ((m + n + 1) >> 1) - i;
    const l1 = i === 0 ? -Infinity : nums1[i - 1];
    const r1 = i === m ? Infinity : nums1[i];
    const l2 = j === 0 ? -Infinity : nums2[j - 1];
    const r2 = j === n ? Infinity : nums2[j];
    if (l1 <= r2 && l2 <= r1) {
      if ((m + n) % 2) return Math.max(l1, l2);
      return (Math.max(l1, l2) + Math.min(r1, r2)) / 2;
    }
    if (l1 > r2) hi = i - 1; else lo = i + 1;
  }
  return 0;
}
```

**Java：**
```java
public double findMedianSortedArrays(int[] nums1, int[] nums2) {
    if (nums1.length > nums2.length) { var t = nums1; nums1 = nums2; nums2 = t; }
    int m = nums1.length, n = nums2.length, lo = 0, hi = m;
    while (lo <= hi) {
        int i = (lo + hi) >>> 1, j = (m + n + 1) / 2 - i;
        int l1 = i == 0 ? Integer.MIN_VALUE : nums1[i - 1];
        int r1 = i == m ? Integer.MAX_VALUE : nums1[i];
        int l2 = j == 0 ? Integer.MIN_VALUE : nums2[j - 1];
        int r2 = j == n ? Integer.MAX_VALUE : nums2[j];
        if (l1 <= r2 && l2 <= r1) {
            if (((m + n) & 1) == 1) return Math.max(l1, l2);
            return (Math.max(l1, l2) + Math.min(r1, r2)) / 2.0;
        }
        if (l1 > r2) hi = i - 1; else lo = i + 1;
    }
    return 0;
}
```

**要点：**
- 在较短数组的划分位置上做二分。
- 哨兵无穷大优雅处理边界划分。
- O(log(min(m,n)))——严格优于合并的 O(log(m+n))。

**标签：** #algorithm

---

### 28. LRU 缓存

**难度：** 中等
**主题：** 设计, 哈希, 链表
**岗位：** SWE
**级别：** L3-L5

**问题：** 设计一个最近最少使用（LRU）缓存的数据结构，支持 `get(key)` 与 `put(key, value)` 平均 O(1)，容量固定，溢出时淘汰最久未用的键。

**思路：** key 到双向链表节点的哈希表。访问时把节点移到表头（最新使用）。put 超容量时丢弃表尾。每个操作 O(1)。哨兵 head/tail 节点避免空判。

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
    public int get(int key) { return getOrDefault(key, -1); }
    public void put(int key, int value) { super.put(key, value); }
    @Override
    protected boolean removeEldestEntry(Map.Entry<Integer, Integer> eldest) {
        return size() > cap;
    }
}
```

**要点：**
- `OrderedDict` / `Map` 保留插入顺序，天然实现 O(1) LRU 语义。
- 访问时重新插入即标记为最近使用。
- 容量超限时从最旧端淘汰。

**标签：** #algorithm

---

### 29. 天际线问题

**难度：** 困难
**主题：** 堆, 扫描线, 排序, 区间
**岗位：** SWE
**级别：** L5+

**问题：** 给定 `n` 栋矩形建筑 `[left, right, height]`，输出天际线为关键点列表 `[x, y]`，表示轮廓变化处。

**思路：** 沿建筑边界做扫描线。用按右边界排序的大顶堆（或 multiset）维护活动高度。每个事件加入新高度或移除过期项；若当前最大高度与上一次不同，输出关键点。O(n log n)。处理打破并列（start 在 end 前，高者优先）要小心。

**Python：**
```python
import heapq

def get_skyline(buildings: list[list[int]]) -> list[list[int]]:
    events: list[tuple[int, int, int]] = []
    for l, r, h in buildings:
        events.append((l, -h, r))  # start: negative for max-heap by abs height
        events.append((r, 0, 0))   # end marker
    events.sort()
    res: list[list[int]] = []
    heap: list[tuple[int, int]] = [(0, float("inf"))]  # (-height, end)
    for x, neg_h, r in events:
        if neg_h != 0:
            heapq.heappush(heap, (neg_h, r))
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
  const events: [number, number, number][] = [];
  for (const [l, r, h] of buildings) { events.push([l, -h, r]); events.push([r, 0, 0]); }
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const heap: [number, number][] = [[0, Infinity]];
  const push = (e: [number, number]) => { heap.push(e); heap.sort((a, b) => a[0] - b[0]); };
  const res: number[][] = [];
  for (const [x, negH, r] of events) {
    if (negH !== 0) push([negH, r]);
    while (heap[0][1] <= x) heap.shift();
    const cur = -heap[0][0];
    if (!res.length || res[res.length - 1][1] !== cur) res.push([x, cur]);
  }
  return res;
}
```

**Java：**
```java
public List<List<Integer>> getSkyline(int[][] buildings) {
    List<int[]> events = new ArrayList<>();
    for (var b : buildings) { events.add(new int[]{b[0], -b[2], b[1]}); events.add(new int[]{b[1], 0, 0}); }
    events.sort((a, b) -> a[0] != b[0] ? a[0] - b[0] : a[1] - b[1]);
    PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> a[0] - b[0]); // (-height, end)
    heap.offer(new int[]{0, Integer.MAX_VALUE});
    List<List<Integer>> res = new ArrayList<>();
    for (var e : events) {
        int x = e[0], negH = e[1], r = e[2];
        if (negH != 0) heap.offer(new int[]{negH, r});
        while (heap.peek()[1] <= x) heap.poll();
        int cur = -heap.peek()[0];
        if (res.isEmpty() || res.get(res.size() - 1).get(1) != cur) res.add(List.of(x, cur));
    }
    return res;
}
```

**要点：**
- 扫描线按 x 排序事件；大顶堆追踪当前活动高度。
- 惰性删除：跳过已过期（end <= x）的项。
- 仅当运行最大值变化时输出关键点。

**标签：** #algorithm

---

### 30. 滑动窗口最大值

**难度：** 困难
**主题：** 滑动窗口, 双端队列, 单调, 数组
**岗位：** SWE
**级别：** L3-L5

**问题：** 给定整数数组 `nums` 与窗口大小 `k`，返回大小为 `k` 的滑动窗口自左向右每个位置上的最大值。

**思路：** 单调递减双端队列存索引。压入新索引；若队尾比当前小则弹出，若队首在窗口外则弹出。队首即当前最大值。每个索引最多入队/出队一次，整体 O(n)。

**Python：**
```python
from collections import deque

def max_sliding_window(nums: list[int], k: int) -> list[int]:
    dq: deque[int] = deque()
    out: list[int] = []
    for i, x in enumerate(nums):
        while dq and nums[dq[-1]] < x:
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
    while (dq.length && nums[dq[dq.length - 1]] < nums[i]) dq.pop();
    dq.push(i);
    if (dq[0] <= i - k) dq.shift();
    if (i >= k - 1) out.push(nums[dq[0]]);
  }
  return out;
}
```

**Java：**
```java
public int[] maxSlidingWindow(int[] nums, int k) {
    Deque<Integer> dq = new ArrayDeque<>();
    int[] out = new int[nums.length - k + 1];
    int idx = 0;
    for (int i = 0; i < nums.length; i++) {
        while (!dq.isEmpty() && nums[dq.peekLast()] < nums[i]) dq.pollLast();
        dq.offerLast(i);
        if (dq.peekFirst() <= i - k) dq.pollFirst();
        if (i >= k - 1) out[idx++] = nums[dq.peekFirst()];
    }
    return out;
}
```

**要点：**
- 双端队列以严格递减值顺序存索引。
- 队首始终是窗口最大值；越界时弹出。
- 每个索引最多入/出队一次，整体 O(n)。

**标签：** #algorithm

---

### 31. 编辑距离

**难度：** 困难
**主题：** 动态规划, 字符串
**岗位：** SWE
**级别：** L3-L5

**问题：** 给定字符串 `word1` 与 `word2`，返回将 `word1` 转为 `word2` 所需的最少单字符编辑次数（插入、删除、替换）。

**思路：** 2D DP——`dp[i][j]` = `word1[:i]` 转 `word2[:j]` 的编辑数。字符相同时 `dp[i][j] = dp[i-1][j-1]`；否则 `1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])`。O(m*n) 时间；滚动行压到 O(min(m,n)) 空间。

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
public int minDistance(String word1, String word2) {
    int m = word1.length(), n = word2.length();
    int[][] dp = new int[m + 1][n + 1];
    for (int i = 0; i <= m; i++) dp[i][0] = i;
    for (int j = 0; j <= n; j++) dp[0][j] = j;
    for (int i = 1; i <= m; i++)
        for (int j = 1; j <= n; j++)
            if (word1.charAt(i - 1) == word2.charAt(j - 1)) dp[i][j] = dp[i - 1][j - 1];
            else dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], Math.min(dp[i - 1][j], dp[i][j - 1]));
    return dp[m][n];
}
```

**要点：**
- 三种操作对应三个前驱：删除、插入、替换。
- 基础情形：从/到空串的编辑数等于另一串长度。
- 用滚动行可降到 O(min(m,n)) 空间。

**标签：** #algorithm

---

### 32. 最长回文子串

**难度：** 中等
**主题：** 字符串, 动态规划, 双指针
**岗位：** SWE
**级别：** L3-L5

**问题：** 给定字符串 `s`，返回 `s` 的最长回文子串。

**思路：** 以每个位置为中心向两边扩展（奇偶共 2n-1 个中心），记录最长长度。O(n^2) 时间、O(1) 空间。要 O(n) 可用 Manacher 算法——面试一般不需要。

**Python：**
```python
def longest_palindrome(s: str) -> str:
    def grow(l: int, r: int) -> tuple[int, int]:
        while l >= 0 and r < len(s) and s[l] == s[r]:
            l -= 1
            r += 1
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
public String longestPalindrome(String s) {
    int bl = 0, br = 0;
    for (int i = 0; i < s.length(); i++) {
        int[] a = grow(s, i, i), b = grow(s, i, i + 1);
        if (a[1] - a[0] > br - bl) { bl = a[0]; br = a[1]; }
        if (b[1] - b[0] > br - bl) { bl = b[0]; br = b[1]; }
    }
    return s.substring(bl, br + 1);
}
private int[] grow(String s, int l, int r) {
    while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) { l--; r++; }
    return new int[]{l + 1, r - 1};
}
```

**要点：**
- 两种中心（奇/偶）覆盖所有回文。
- O(n^2) 时间，O(1) 额外空间。
- Manacher 可做到 O(n) 但面试中很少要求。

**标签：** #algorithm

---

### 33. 戳气球

**难度：** 困难
**主题：** 动态规划, 区间动态规划, 数组
**岗位：** SWE
**级别：** L5+

**问题：** 给定 `n` 个气球，戳破气球 `i` 得分 `nums[left] * nums[i] * nums[right]`，`left/right` 为当前仍存活的邻居。两端补虚拟 1。求最大得分。

**思路：** 区间 DP——`dp[l][r]` = 戳光 `(l, r)` 之间所有气球的最大得分。枚举区间内*最后*戳的气球 `k`：`dp[l][r] = max(nums[l]*nums[k]*nums[r] + dp[l][k] + dp[k][r])`。O(n^3)。

**Python：**
```python
def max_coins(nums: list[int]) -> int:
    a = [1] + nums + [1]
    n = len(a)
    dp = [[0] * n for _ in range(n)]
    for length in range(2, n):
        for l in range(n - length):
            r = l + length
            best = 0
            for k in range(l + 1, r):
                v = a[l] * a[k] * a[r] + dp[l][k] + dp[k][r]
                if v > best:
                    best = v
            dp[l][r] = best
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
      let best = 0;
      for (let k = l + 1; k < r; k++) {
        const v = a[l] * a[k] * a[r] + dp[l][k] + dp[k][r];
        if (v > best) best = v;
      }
      dp[l][r] = best;
    }
  }
  return dp[0][n - 1];
}
```

**Java：**
```java
public int maxCoins(int[] nums) {
    int n = nums.length + 2;
    int[] a = new int[n];
    a[0] = a[n - 1] = 1;
    for (int i = 0; i < nums.length; i++) a[i + 1] = nums[i];
    int[][] dp = new int[n][n];
    for (int len = 2; len < n; len++)
        for (int l = 0; l + len < n; l++) {
            int r = l + len, best = 0;
            for (int k = l + 1; k < r; k++) {
                int v = a[l] * a[k] * a[r] + dp[l][k] + dp[k][r];
                if (v > best) best = v;
            }
            dp[l][r] = best;
        }
    return dp[0][n - 1];
}
```

**要点：**
- 选"最后"戳的气球可让其邻居固定为 `a[l]` 和 `a[r]`。
- 两端补虚拟 1 避免边界特殊化。
- O(n^3) 时间，O(n^2) 空间。

**标签：** #algorithm

---

### 34. 摘樱桃

**难度：** 困难
**主题：** 动态规划, 矩阵, 多维 dp
**岗位：** SWE
**级别：** L5+

**问题：** `n x n` 网格，1 为樱桃，0 为空，-1 为荆棘。从 `(0,0)` 只能向右/下走到 `(n-1,n-1)`，再向左/上返回，沿途摘樱桃（每格只摘一次）。求最多樱桃数；若不能往返返回 0。

**思路：** 等价于同时走两条 `(0,0)` 到 `(n-1,n-1)` 都向右/下的路径。状态 `dp[r1][c1][r2]`（c2 = r1+c1-r2）。两路落同一格时只算一次樱桃。O(n^3)。

**Python：**
```python
from functools import lru_cache

def cherry_pickup(grid: list[list[int]]) -> int:
    n = len(grid)
    NEG = float("-inf")
    @lru_cache(maxsize=None)
    def dp(r1: int, c1: int, r2: int) -> float:
        c2 = r1 + c1 - r2
        if r1 >= n or c1 >= n or r2 >= n or c2 >= n or grid[r1][c1] == -1 or grid[r2][c2] == -1:
            return NEG
        if r1 == n - 1 and c1 == n - 1:
            return grid[r1][c1]
        cherries = grid[r1][c1] + (grid[r2][c2] if (r1, c1) != (r2, c2) else 0)
        best = max(dp(r1 + 1, c1, r2 + 1), dp(r1 + 1, c1, r2),
                   dp(r1, c1 + 1, r2 + 1), dp(r1, c1 + 1, r2))
        return cherries + best
    return max(0, int(dp(0, 0, 0)))
```

**TypeScript：**
```typescript
function cherryPickup(grid: number[][]): number {
  const n = grid.length;
  const NEG = -Infinity;
  const memo = new Map<string, number>();
  const dp = (r1: number, c1: number, r2: number): number => {
    const c2 = r1 + c1 - r2;
    if (r1 >= n || c1 >= n || r2 >= n || c2 >= n || grid[r1][c1] === -1 || grid[r2][c2] === -1) return NEG;
    if (r1 === n - 1 && c1 === n - 1) return grid[r1][c1];
    const key = `${r1},${c1},${r2}`;
    if (memo.has(key)) return memo.get(key)!;
    const cherries = grid[r1][c1] + (r1 === r2 && c1 === c2 ? 0 : grid[r2][c2]);
    const best = Math.max(dp(r1 + 1, c1, r2 + 1), dp(r1 + 1, c1, r2), dp(r1, c1 + 1, r2 + 1), dp(r1, c1 + 1, r2));
    const v = cherries + best;
    memo.set(key, v);
    return v;
  };
  return Math.max(0, dp(0, 0, 0));
}
```

**Java：**
```java
public int cherryPickup(int[][] grid) {
    int n = grid.length;
    Integer[][][] memo = new Integer[n][n][n];
    return Math.max(0, dp(grid, 0, 0, 0, n, memo));
}
private int dp(int[][] g, int r1, int c1, int r2, int n, Integer[][][] memo) {
    int c2 = r1 + c1 - r2;
    if (r1 >= n || c1 >= n || r2 >= n || c2 >= n || g[r1][c1] == -1 || g[r2][c2] == -1) return Integer.MIN_VALUE;
    if (r1 == n - 1 && c1 == n - 1) return g[r1][c1];
    if (memo[r1][c1][r2] != null) return memo[r1][c1][r2];
    int cherries = g[r1][c1] + (r1 == r2 && c1 == c2 ? 0 : g[r2][c2]);
    int best = Math.max(Math.max(dp(g, r1 + 1, c1, r2 + 1, n, memo), dp(g, r1 + 1, c1, r2, n, memo)),
                        Math.max(dp(g, r1, c1 + 1, r2 + 1, n, memo), dp(g, r1, c1 + 1, r2, n, memo)));
    return memo[r1][c1][r2] = cherries + best;
}
```

**要点：**
- 用两条同时走的路径建模往返；同格重叠时樱桃只算一次。
- 状态 `(r1, c1, r2)`，因为 `c2 = r1 + c1 - r2` 已被确定。
- O(n^3) 状态，每状态四种转移。

**标签：** #algorithm

---

### 35. 俄罗斯套娃信封问题

**难度：** 困难
**主题：** 动态规划, 二分查找, 排序, lis
**岗位：** SWE
**级别：** L5+

**问题：** 给定信封数组 `[width, height]`，求最多能套多少层（每个严格大于前者的宽和高）。

**思路：** 按宽升序；宽相同时按高*降*序（避免同宽两个同时入选）。然后在 height 上用 patience 排序 / 二分查找跑 LIS。O(n log n)。

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
    let lo = 0, hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid] < h) lo = mid + 1; else hi = mid;
    }
    if (lo === tails.length) tails.push(h);
    else tails[lo] = h;
  }
  return tails.length;
}
```

**Java：**
```java
public int maxEnvelopes(int[][] envelopes) {
    Arrays.sort(envelopes, (a, b) -> a[0] != b[0] ? a[0] - b[0] : b[1] - a[1]);
    List<Integer> tails = new ArrayList<>();
    for (var e : envelopes) {
        int h = e[1], lo = 0, hi = tails.size();
        while (lo < hi) { int mid = (lo + hi) >>> 1; if (tails.get(mid) < h) lo = mid + 1; else hi = mid; }
        if (lo == tails.size()) tails.add(h); else tails.set(lo, h);
    }
    return tails.size();
}
```

**要点：**
- 同宽时按高降序，避免同宽两个同时入选。
- 退化为 height 上的 1D LIS，patience sort + 二分 O(n log n)。
- `bisect_left` 实现严格递增，与"严格大于"的要求一致。

**标签：** #algorithm

---

### 36. 合并 K 个升序链表

**难度：** 困难
**主题：** 堆, 链表, 分治
**岗位：** SWE
**级别：** L3-L5

**问题：** 把 `k` 个有序链表合并成一个有序链表并返回。

**思路：** 把每个链表当前头放入小顶堆。弹出最小者接到结果上，推入它的 `next`。O(N log k)，N = 总节点数。备选：两两归并分治——复杂度相同，无堆。

**Python：**
```python
import heapq

class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val = val; self.next = next

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
  const mergeTwo = (a: ListNode | null, b: ListNode | null): ListNode | null => {
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
  if (!lists.length) return null;
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
static class ListNode { int val; ListNode next; ListNode(int v) { val = v; } }

public ListNode mergeKLists(ListNode[] lists) {
    PriorityQueue<ListNode> heap = new PriorityQueue<>((a, b) -> a.val - b.val);
    for (var n : lists) if (n != null) heap.offer(n);
    ListNode dummy = new ListNode(0), tail = dummy;
    while (!heap.isEmpty()) {
        ListNode n = heap.poll();
        tail.next = n; tail = n;
        if (n.next != null) heap.offer(n.next);
    }
    return dummy.next;
}
```

**要点：**
- 堆最多 k 个节点，弹出+压入每次 O(log k)。
- 元组的索引项打破并列，避免堆比较节点对象。
- 分治两两归并同样达到 O(N log k)。

**标签：** #algorithm

---

### 37. 单词搜索 II

**难度：** 困难
**主题：** 字典树, 回溯, dfs, 矩阵, 字符串
**岗位：** SWE
**级别：** L5+

**问题：** 给定 `m x n` 字母网格与单词列表，返回所有能由四方向相邻格连成、每格在一次拼词内只用一次的单词。

**思路：** 把所有单词建字典树。从每个格 DFS，同时在 trie 上走——前缀不在 trie 立刻剪枝。临时标记已访问格（回溯还原）。匹配过的单词从 trie 删除以避免重复输出。最坏 O(M * 4^L)。

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
        if not nxt:
            return
        if "$" in nxt:
            out.append(nxt.pop("$"))
        board[r][c] = "#"
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < m and 0 <= nc < n and board[nr][nc] != "#":
                dfs(nr, nc, nxt)
        board[r][c] = ch
    for r in range(m):
        for c in range(n):
            dfs(r, c, trie)
    return out
```

**TypeScript：**
```typescript
function findWords(board: string[][], words: string[]): string[] {
  type Node = { [k: string]: any };
  const trie: Node = {};
  for (const w of words) {
    let node = trie;
    for (const c of w) node = (node[c] ??= {});
    node["$"] = w;
  }
  const m = board.length, n = board[0].length;
  const out: string[] = [];
  const dfs = (r: number, c: number, node: Node): void => {
    const ch = board[r][c];
    const nxt = node[ch];
    if (!nxt) return;
    if (nxt["$"]) { out.push(nxt["$"]); delete nxt["$"]; }
    board[r][c] = "#";
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < m && nc >= 0 && nc < n && board[nr][nc] !== "#") dfs(nr, nc, nxt);
    }
    board[r][c] = ch;
  };
  for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) dfs(r, c, trie);
  return out;
}
```

**Java：**
```java
static class Node { Map<Character, Node> ch = new HashMap<>(); String word; }

public List<String> findWords(char[][] board, String[] words) {
    Node root = new Node();
    for (var w : words) {
        Node n = root;
        for (char c : w.toCharArray()) n = n.ch.computeIfAbsent(c, k -> new Node());
        n.word = w;
    }
    List<String> out = new ArrayList<>();
    for (int r = 0; r < board.length; r++)
        for (int c = 0; c < board[0].length; c++) dfs(board, r, c, root, out);
    return out;
}
private void dfs(char[][] b, int r, int c, Node node, List<String> out) {
    if (r < 0 || r >= b.length || c < 0 || c >= b[0].length) return;
    char ch = b[r][c];
    Node nxt = ch == '#' ? null : node.ch.get(ch);
    if (nxt == null) return;
    if (nxt.word != null) { out.add(nxt.word); nxt.word = null; }
    b[r][c] = '#';
    dfs(b, r + 1, c, nxt, out); dfs(b, r - 1, c, nxt, out);
    dfs(b, r, c + 1, nxt, out); dfs(b, r, c - 1, nxt, out);
    b[r][c] = ch;
}
```

**要点：**
- 字典树让所有单词同时享受前缀剪枝。
- 修改并恢复 board 实现 O(1) 空间的访问标记。
- 匹配后从字典树删除该单词，避免重复输出。

**标签：** #algorithm

---

### 38. 有序矩阵中第 K 小的元素

**难度：** 中等
**主题：** 二分查找, 堆, 矩阵
**岗位：** SWE
**级别：** L3-L5

**问题：** 给定 `n x n` 矩阵，每行每列升序，返回第 `k` 小的元素。

**思路：** 在值域 `[matrix[0][0], matrix[n-1][n-1]]` 上二分。每个 mid 从左下角走 O(n) 统计 `<= mid` 的元素数，调整边界。O(n log(max-min))。备选：(val, r, c) 小顶堆弹 k 次——O(k log n)。

**Python：**
```python
def kth_smallest(matrix: list[list[int]], k: int) -> int:
    n = len(matrix)
    lo, hi = matrix[0][0], matrix[n - 1][n - 1]
    def count_le(x: int) -> int:
        r, c, cnt = n - 1, 0, 0
        while r >= 0 and c < n:
            if matrix[r][c] <= x:
                cnt += r + 1
                c += 1
            else:
                r -= 1
        return cnt
    while lo < hi:
        mid = (lo + hi) // 2
        if count_le(mid) < k:
            lo = mid + 1
        else:
            hi = mid
    return lo
```

**TypeScript：**
```typescript
function kthSmallest(matrix: number[][], k: number): number {
  const n = matrix.length;
  let lo = matrix[0][0], hi = matrix[n - 1][n - 1];
  const countLe = (x: number): number => {
    let r = n - 1, c = 0, cnt = 0;
    while (r >= 0 && c < n) {
      if (matrix[r][c] <= x) { cnt += r + 1; c++; }
      else r--;
    }
    return cnt;
  };
  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (countLe(mid) < k) lo = mid + 1; else hi = mid;
  }
  return lo;
}
```

**Java：**
```java
public int kthSmallest(int[][] matrix, int k) {
    int n = matrix.length, lo = matrix[0][0], hi = matrix[n - 1][n - 1];
    while (lo < hi) {
        int mid = lo + ((hi - lo) >>> 1);
        if (countLe(matrix, mid, n) < k) lo = mid + 1; else hi = mid;
    }
    return lo;
}
private int countLe(int[][] m, int x, int n) {
    int r = n - 1, c = 0, cnt = 0;
    while (r >= 0 && c < n) {
        if (m[r][c] <= x) { cnt += r + 1; c++; } else r--;
    }
    return cnt;
}
```

**要点：**
- 在值空间而非下标空间二分。
- 从左下角阶梯走，O(n) 统计 `<= x` 的元素数。
- 收敛到矩阵中的某个值，因为 count 在值边界严格变化。

**标签：** #algorithm

---

### 39. 分割数组的最大值

**难度：** 困难
**主题：** 二分查找, 动态规划, 贪心, 数组
**岗位：** SWE
**级别：** L5+

**问题：** 给定非负整数数组 `nums` 与整数 `k`，将数组分为 `k` 个非空连续子数组，使得各子数组和的最大值最小化，返回该最小值。

**思路：** 在答案 `[max(nums), sum(nums)]` 上二分。每个候选 `mid` 用贪心数：每段和 `<= mid` 至少要分几段。若段数 `<= k` 收紧上界，否则放宽。O(n log(sum))。

**Python：**
```python
def split_array(nums: list[int], k: int) -> int:
    def needed(cap: int) -> int:
        parts, cur = 1, 0
        for x in nums:
            if cur + x > cap:
                parts += 1
                cur = x
            else:
                cur += x
        return parts
    lo, hi = max(nums), sum(nums)
    while lo < hi:
        mid = (lo + hi) // 2
        if needed(mid) <= k:
            hi = mid
        else:
            lo = mid + 1
    return lo
```

**TypeScript：**
```typescript
function splitArray(nums: number[], k: number): number {
  const needed = (cap: number): number => {
    let parts = 1, cur = 0;
    for (const x of nums) {
      if (cur + x > cap) { parts++; cur = x; }
      else cur += x;
    }
    return parts;
  };
  let lo = Math.max(...nums), hi = nums.reduce((a, b) => a + b, 0);
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (needed(mid) <= k) hi = mid; else lo = mid + 1;
  }
  return lo;
}
```

**Java：**
```java
public int splitArray(int[] nums, int k) {
    int lo = 0, hi = 0;
    for (int x : nums) { lo = Math.max(lo, x); hi += x; }
    while (lo < hi) {
        int mid = lo + ((hi - lo) >>> 1);
        if (needed(nums, mid) <= k) hi = mid; else lo = mid + 1;
    }
    return lo;
}
private int needed(int[] nums, int cap) {
    int parts = 1, cur = 0;
    for (int x : nums) {
        if (cur + x > cap) { parts++; cur = x; } else cur += x;
    }
    return parts;
}
```

**要点：**
- 在答案上二分；判定（所需段数）对容量单调。
- 下界 `max(nums)`：至少要装下最大单元素。
- 上界 `sum(nums)`：单段装下全部。

**标签：** #algorithm

---

### 40. 最小覆盖子串

**难度：** 困难
**主题：** 滑动窗口, 哈希, 字符串
**岗位：** SWE
**级别：** L3-L5

**问题：** 给定字符串 `s` 和 `t`，返回 `s` 中包含 `t` 所有字符（含重数）的最短子串。无解返回 `""`。

**思路：** 滑动窗口 + need 计数表 + `missing` 计数器。右指针扩张直到 `missing == 0`，左指针在仍满足的前提下收缩，记录最优窗口。O(|s| + |t|)。

**Python：**
```python
from collections import Counter

def min_window(s: str, t: str) -> str:
    if not t or len(s) < len(t):
        return ""
    need = Counter(t)
    missing = len(t)
    l = best_l = 0
    best = -1
    for r, c in enumerate(s):
        if need[c] > 0:
            missing -= 1
        need[c] -= 1
        while missing == 0:
            if best == -1 or r - l + 1 < best:
                best, best_l = r - l + 1, l
            need[s[l]] += 1
            if need[s[l]] > 0:
                missing += 1
            l += 1
    return "" if best == -1 else s[best_l:best_l + best]
```

**TypeScript：**
```typescript
function minWindow(s: string, t: string): string {
  if (!t || s.length < t.length) return "";
  const need = new Map<string, number>();
  for (const c of t) need.set(c, (need.get(c) ?? 0) + 1);
  let missing = t.length, l = 0, bestL = 0, best = -1;
  for (let r = 0; r < s.length; r++) {
    const c = s[r];
    if ((need.get(c) ?? 0) > 0) missing--;
    need.set(c, (need.get(c) ?? 0) - 1);
    while (missing === 0) {
      if (best === -1 || r - l + 1 < best) { best = r - l + 1; bestL = l; }
      const lc = s[l];
      need.set(lc, need.get(lc)! + 1);
      if (need.get(lc)! > 0) missing++;
      l++;
    }
  }
  return best === -1 ? "" : s.slice(bestL, bestL + best);
}
```

**Java：**
```java
public String minWindow(String s, String t) {
    if (t.isEmpty() || s.length() < t.length()) return "";
    Map<Character, Integer> need = new HashMap<>();
    for (char c : t.toCharArray()) need.merge(c, 1, Integer::sum);
    int missing = t.length(), l = 0, bestL = 0, best = -1;
    for (int r = 0; r < s.length(); r++) {
        char c = s.charAt(r);
        if (need.getOrDefault(c, 0) > 0) missing--;
        need.merge(c, -1, Integer::sum);
        while (missing == 0) {
            if (best == -1 || r - l + 1 < best) { best = r - l + 1; bestL = l; }
            char lc = s.charAt(l);
            need.merge(lc, 1, Integer::sum);
            if (need.get(lc) > 0) missing++;
            l++;
        }
    }
    return best == -1 ? "" : s.substring(bestL, bestL + best);
}
```

**要点：**
- 计数可为负——只有正值代表尚未满足的需求。
- `missing` 跟踪还需的字符总数（含重数），不是种类数。
- 每个指针最多移动 n 步，O(|s| + |t|)。

**标签：** #algorithm

---

### 41. 图中连通分量的数目

**难度：** 中等
**主题：** 图, 并查集, dfs, bfs
**岗位：** SWE
**级别：** L3-L5

**问题：** 给定 `n` 个节点 `0..n-1` 与无向边列表，返回连通分量的数目。

**思路：** 路径压缩 + 按秩合并的并查集。初值 `n` 个分量；每次成功合并减一。O(α(n) * E)。备选：对每个未访问节点 BFS/DFS——O(V + E)。

**Python：**
```python
def count_components(n: int, edges: list[list[int]]) -> int:
    parent = list(range(n))
    rank = [0] * n
    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    components = n
    for a, b in edges:
        ra, rb = find(a), find(b)
        if ra == rb:
            continue
        if rank[ra] < rank[rb]:
            ra, rb = rb, ra
        parent[rb] = ra
        if rank[ra] == rank[rb]:
            rank[ra] += 1
        components -= 1
    return components
```

**TypeScript：**
```typescript
function countComponents(n: number, edges: number[][]): number {
  const parent = Array.from({ length: n }, (_, i) => i);
  const rank = new Array(n).fill(0);
  const find = (x: number): number => {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  };
  let components = n;
  for (const [a, b] of edges) {
    let ra = find(a), rb = find(b);
    if (ra === rb) continue;
    if (rank[ra] < rank[rb]) [ra, rb] = [rb, ra];
    parent[rb] = ra;
    if (rank[ra] === rank[rb]) rank[ra]++;
    components--;
  }
  return components;
}
```

**Java：**
```java
public int countComponents(int n, int[][] edges) {
    int[] parent = new int[n], rank = new int[n];
    for (int i = 0; i < n; i++) parent[i] = i;
    int components = n;
    for (var e : edges) {
        int ra = find(parent, e[0]), rb = find(parent, e[1]);
        if (ra == rb) continue;
        if (rank[ra] < rank[rb]) { int t = ra; ra = rb; rb = t; }
        parent[rb] = ra;
        if (rank[ra] == rank[rb]) rank[ra]++;
        components--;
    }
    return components;
}
private int find(int[] parent, int x) {
    while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
}
```

**要点：**
- 每次成功合并把两个分量合一，计数减一。
- 路径压缩 + 按秩合并，摊还近常数。
- 总开销 O(E α(n))，几乎线性。

**标签：** #algorithm

---

### 42. 二维区域和检索 - 可变

**难度：** 困难
**主题：** 树状数组, 线段树, 设计, 矩阵
**岗位：** SWE
**级别：** L5+

**问题：** 设计支持 `update(row, col, val)` 与 `sumRegion(row1, col1, row2, col2)` 的数据结构（`m x n` 整数矩阵）。

**思路：** 2D 树状数组（Fenwick）。`update` O(log m * log n)；`sumRegion` 用四个前缀和的容斥，亦 O(log m * log n)。备选：2D 线段树（更通用但常数更大）。

**Python：**
```python
class NumMatrix:
    def __init__(self, matrix: list[list[int]]) -> None:
        self.m, self.n = len(matrix), len(matrix[0])
        self.bit = [[0] * (self.n + 1) for _ in range(self.m + 1)]
        self.vals = [[0] * self.n for _ in range(self.m)]
        for r in range(self.m):
            for c in range(self.n):
                self.update(r, c, matrix[r][c])

    def update(self, r: int, c: int, val: int) -> None:
        delta = val - self.vals[r][c]
        self.vals[r][c] = val
        i = r + 1
        while i <= self.m:
            j = c + 1
            while j <= self.n:
                self.bit[i][j] += delta
                j += j & -j
            i += i & -i

    def _prefix(self, r: int, c: int) -> int:
        s = 0; i = r + 1
        while i > 0:
            j = c + 1
            while j > 0:
                s += self.bit[i][j]
                j -= j & -j
            i -= i & -i
        return s

    def sumRegion(self, r1: int, c1: int, r2: int, c2: int) -> int:
        return self._prefix(r2, c2) - self._prefix(r1 - 1, c2) - self._prefix(r2, c1 - 1) + self._prefix(r1 - 1, c1 - 1)
```

**TypeScript：**
```typescript
class NumMatrix {
  private m: number; private n: number;
  private bit: number[][]; private vals: number[][];
  constructor(matrix: number[][]) {
    this.m = matrix.length; this.n = matrix[0].length;
    this.bit = Array.from({ length: this.m + 1 }, () => new Array(this.n + 1).fill(0));
    this.vals = Array.from({ length: this.m }, () => new Array(this.n).fill(0));
    for (let r = 0; r < this.m; r++) for (let c = 0; c < this.n; c++) this.update(r, c, matrix[r][c]);
  }
  update(r: number, c: number, val: number): void {
    const delta = val - this.vals[r][c];
    this.vals[r][c] = val;
    for (let i = r + 1; i <= this.m; i += i & -i)
      for (let j = c + 1; j <= this.n; j += j & -j)
        this.bit[i][j] += delta;
  }
  private prefix(r: number, c: number): number {
    let s = 0;
    for (let i = r + 1; i > 0; i -= i & -i)
      for (let j = c + 1; j > 0; j -= j & -j)
        s += this.bit[i][j];
    return s;
  }
  sumRegion(r1: number, c1: number, r2: number, c2: number): number {
    return this.prefix(r2, c2) - this.prefix(r1 - 1, c2) - this.prefix(r2, c1 - 1) + this.prefix(r1 - 1, c1 - 1);
  }
}
```

**Java：**
```java
class NumMatrix {
    private final int m, n;
    private final int[][] bit, vals;
    public NumMatrix(int[][] matrix) {
        m = matrix.length; n = matrix[0].length;
        bit = new int[m + 1][n + 1];
        vals = new int[m][n];
        for (int r = 0; r < m; r++) for (int c = 0; c < n; c++) update(r, c, matrix[r][c]);
    }
    public void update(int r, int c, int val) {
        int delta = val - vals[r][c];
        vals[r][c] = val;
        for (int i = r + 1; i <= m; i += i & -i)
            for (int j = c + 1; j <= n; j += j & -j)
                bit[i][j] += delta;
    }
    private int prefix(int r, int c) {
        int s = 0;
        for (int i = r + 1; i > 0; i -= i & -i)
            for (int j = c + 1; j > 0; j -= j & -j)
                s += bit[i][j];
        return s;
    }
    public int sumRegion(int r1, int c1, int r2, int c2) {
        return prefix(r2, c2) - prefix(r1 - 1, c2) - prefix(r2, c1 - 1) + prefix(r1 - 1, c1 - 1);
    }
}
```

**要点：**
- 2D Fenwick：嵌套循环按 lowbit 跳跃。
- 区域和用四个前缀和的容斥。
- 两个操作都是 O(log m * log n)。

**标签：** #algorithm

---

### 43. 查找集群内的关键连接

**难度：** 困难
**主题：** 图, dfs, tarjan, 桥
**岗位：** SWE
**级别：** L5+

**问题：** 给定 `n` 台服务器的无向网络与连接，返回所有"关键"连接——删除后会使图不连通的边。

**思路：** Tarjan 求桥。DFS 维护 `disc[u]`（发现时间）和 `low[u]`（可达最小 disc）。边 `(u,v)` 是桥当且仅当 `low[v] > disc[u]`。O(V + E)。

**Python：**
```python
from collections import defaultdict

def critical_connections(n: int, connections: list[list[int]]) -> list[list[int]]:
    graph: dict[int, list[int]] = defaultdict(list)
    for a, b in connections:
        graph[a].append(b)
        graph[b].append(a)
    disc = [-1] * n
    low = [0] * n
    bridges: list[list[int]] = []
    timer = 0
    def dfs(u: int, parent: int) -> None:
        nonlocal timer
        disc[u] = low[u] = timer
        timer += 1
        for v in graph[u]:
            if v == parent:
                continue
            if disc[v] == -1:
                dfs(v, u)
                low[u] = min(low[u], low[v])
                if low[v] > disc[u]:
                    bridges.append([u, v])
            else:
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
  const disc = new Array(n).fill(-1);
  const low = new Array(n).fill(0);
  const bridges: number[][] = [];
  let timer = 0;
  const dfs = (u: number, parent: number): void => {
    disc[u] = low[u] = timer++;
    for (const v of graph[u]) {
      if (v === parent) continue;
      if (disc[v] === -1) {
        dfs(v, u);
        low[u] = Math.min(low[u], low[v]);
        if (low[v] > disc[u]) bridges.push([u, v]);
      } else {
        low[u] = Math.min(low[u], disc[v]);
      }
    }
  };
  for (let i = 0; i < n; i++) if (disc[i] === -1) dfs(i, -1);
  return bridges;
}
```

**Java：**
```java
private int timer = 0;
public List<List<Integer>> criticalConnections(int n, List<List<Integer>> connections) {
    List<List<Integer>> graph = new ArrayList<>();
    for (int i = 0; i < n; i++) graph.add(new ArrayList<>());
    for (var e : connections) { graph.get(e.get(0)).add(e.get(1)); graph.get(e.get(1)).add(e.get(0)); }
    int[] disc = new int[n], low = new int[n];
    Arrays.fill(disc, -1);
    List<List<Integer>> bridges = new ArrayList<>();
    for (int i = 0; i < n; i++) if (disc[i] == -1) dfs(i, -1, graph, disc, low, bridges);
    return bridges;
}
private void dfs(int u, int parent, List<List<Integer>> g, int[] disc, int[] low, List<List<Integer>> bridges) {
    disc[u] = low[u] = timer++;
    for (int v : g.get(u)) {
        if (v == parent) continue;
        if (disc[v] == -1) {
            dfs(v, u, g, disc, low, bridges);
            low[u] = Math.min(low[u], low[v]);
            if (low[v] > disc[u]) bridges.add(List.of(u, v));
        } else low[u] = Math.min(low[u], disc[v]);
    }
}
```

**要点：**
- `low[u]` = u 子树通过至多一条回边可达的最小 disc。
- 递归返回后若 `low[v] > disc[u]`，则 `(u,v)` 是桥。
- O(V + E)——单次 DFS。

**标签：** #algorithm

---

### 44. 柱状图中最大的矩形

**难度：** 困难
**主题：** 栈, 单调, 数组
**岗位：** SWE
**级别：** L5+

**问题：** 给定 `n` 个非负整数表示宽 1 的柱状图高度，求最大矩形面积。

**思路：** 单调递增索引栈。当前柱低于栈顶时弹出并以弹出柱为最矮算面积：`height * (i - stack.top() - 1)`。末尾加哨兵 0 清空栈。O(n)。

**Python：**
```python
def largest_rectangle_area(heights: list[int]) -> int:
    stack: list[int] = []
    best = 0
    h = heights + [0]
    for i, x in enumerate(h):
        while stack and h[stack[-1]] > x:
            top = stack.pop()
            width = i if not stack else i - stack[-1] - 1
            best = max(best, h[top] * width)
        stack.append(i)
    return best
```

**TypeScript：**
```typescript
function largestRectangleArea(heights: number[]): number {
  const h = [...heights, 0];
  const stack: number[] = [];
  let best = 0;
  for (let i = 0; i < h.length; i++) {
    while (stack.length && h[stack[stack.length - 1]] > h[i]) {
      const top = stack.pop()!;
      const width = stack.length ? i - stack[stack.length - 1] - 1 : i;
      best = Math.max(best, h[top] * width);
    }
    stack.push(i);
  }
  return best;
}
```

**Java：**
```java
public int largestRectangleArea(int[] heights) {
    int n = heights.length;
    int[] h = Arrays.copyOf(heights, n + 1);
    Deque<Integer> stack = new ArrayDeque<>();
    int best = 0;
    for (int i = 0; i <= n; i++) {
        while (!stack.isEmpty() && h[stack.peek()] > h[i]) {
            int top = stack.pop();
            int width = stack.isEmpty() ? i : i - stack.peek() - 1;
            best = Math.max(best, h[top] * width);
        }
        stack.push(i);
    }
    return best;
}
```

**要点：**
- 栈中存递增高度索引；弹出时锁定一个矩形。
- 宽度从前一个更矮柱跨到当前柱。
- 末尾哨兵 0 强制最后一次清空。

**标签：** #algorithm

---

### 45. 最大矩形

**难度：** 困难
**主题：** 动态规划, 栈, 矩阵
**岗位：** SWE
**级别：** L5+

**问题：** 给定 `m x n` 二进制矩阵，找出仅由 1 组成的最大矩形并返回面积。

**思路：** 按行把列的累计高度当作直方图，复用"柱状图最大矩形"。`height[j] = height[j]+1` 若该格为 1，否则置 0。O(m*n)。

**Python：**
```python
def maximal_rectangle(matrix: list[list[str]]) -> int:
    if not matrix:
        return 0
    n = len(matrix[0])
    heights = [0] * n
    def largest(h: list[int]) -> int:
        stack: list[int] = []
        best = 0
        a = h + [0]
        for i, x in enumerate(a):
            while stack and a[stack[-1]] > x:
                top = stack.pop()
                width = i if not stack else i - stack[-1] - 1
                best = max(best, a[top] * width)
            stack.append(i)
        return best
    best = 0
    for row in matrix:
        for j, c in enumerate(row):
            heights[j] = heights[j] + 1 if c == "1" else 0
        best = max(best, largest(heights))
    return best
```

**TypeScript：**
```typescript
function maximalRectangle(matrix: string[][]): number {
  if (!matrix.length) return 0;
  const n = matrix[0].length;
  const heights = new Array(n).fill(0);
  const largest = (h: number[]): number => {
    const a = [...h, 0];
    const stack: number[] = [];
    let best = 0;
    for (let i = 0; i < a.length; i++) {
      while (stack.length && a[stack[stack.length - 1]] > a[i]) {
        const top = stack.pop()!;
        const width = stack.length ? i - stack[stack.length - 1] - 1 : i;
        best = Math.max(best, a[top] * width);
      }
      stack.push(i);
    }
    return best;
  };
  let best = 0;
  for (const row of matrix) {
    for (let j = 0; j < n; j++) heights[j] = row[j] === "1" ? heights[j] + 1 : 0;
    best = Math.max(best, largest(heights));
  }
  return best;
}
```

**Java：**
```java
public int maximalRectangle(char[][] matrix) {
    if (matrix.length == 0) return 0;
    int n = matrix[0].length, best = 0;
    int[] heights = new int[n];
    for (var row : matrix) {
        for (int j = 0; j < n; j++) heights[j] = row[j] == '1' ? heights[j] + 1 : 0;
        best = Math.max(best, largest(heights));
    }
    return best;
}
private int largest(int[] heights) {
    int n = heights.length, best = 0;
    int[] h = Arrays.copyOf(heights, n + 1);
    Deque<Integer> stack = new ArrayDeque<>();
    for (int i = 0; i <= n; i++) {
        while (!stack.isEmpty() && h[stack.peek()] > h[i]) {
            int top = stack.pop();
            int width = stack.isEmpty() ? i : i - stack.peek() - 1;
            best = Math.max(best, h[top] * width);
        }
        stack.push(i);
    }
    return best;
}
```

**要点：**
- 把 2D 问题降为反复的 1D 直方图问题。
- heights 数组按行复用，O(n) 空间。
- 整体 O(m*n)——每格摊还常数的直方图工作。

**标签：** #algorithm

---

### 46. 重新安排行程

**难度：** 困难
**主题：** 图, 欧拉路径, dfs, hierholzer
**岗位：** SWE
**级别：** L5+

**问题：** 给定单程机票列表 `[from, to]`，从 `"JFK"` 出发重建行程。若存在多个合法行程，返回字典序最小者。每张机票必须用且仅用一次。

**思路：** Hierholzer 欧拉路径算法。每个邻接表按字典序排序作为栈（或小顶堆）使用。DFS 在后序加入结果，最后反转。O(E log E)。

**Python：**
```python
import heapq
from collections import defaultdict

def find_itinerary(tickets: list[list[str]]) -> list[str]:
    graph: dict[str, list[str]] = defaultdict(list)
    for a, b in tickets:
        heapq.heappush(graph[a], b)
    route: list[str] = []
    def dfs(u: str) -> None:
        while graph[u]:
            dfs(heapq.heappop(graph[u]))
        route.append(u)
    dfs("JFK")
    return route[::-1]
```

**TypeScript：**
```typescript
function findItinerary(tickets: string[][]): string[] {
  const graph = new Map<string, string[]>();
  for (const [a, b] of tickets) {
    if (!graph.has(a)) graph.set(a, []);
    graph.get(a)!.push(b);
  }
  for (const arr of graph.values()) arr.sort((x, y) => y.localeCompare(x)); // pop from end
  const route: string[] = [];
  const dfs = (u: string): void => {
    const nbrs = graph.get(u) ?? [];
    while (nbrs.length) dfs(nbrs.pop()!);
    route.push(u);
  };
  dfs("JFK");
  return route.reverse();
}
```

**Java：**
```java
public List<String> findItinerary(List<List<String>> tickets) {
    Map<String, PriorityQueue<String>> graph = new HashMap<>();
    for (var t : tickets) graph.computeIfAbsent(t.get(0), k -> new PriorityQueue<>()).offer(t.get(1));
    LinkedList<String> route = new LinkedList<>();
    dfs("JFK", graph, route);
    return route;
}
private void dfs(String u, Map<String, PriorityQueue<String>> g, LinkedList<String> route) {
    PriorityQueue<String> nbrs = g.get(u);
    while (nbrs != null && !nbrs.isEmpty()) dfs(nbrs.poll(), g, route);
    route.addFirst(u);
}
```

**要点：**
- 后序加入 + 最终反转得到有效的欧拉路径。
- 先取字典序最小邻居（小顶堆或按降序排序后从尾弹）。
- 每条边只消耗一次，整体 O(E log E)。

**标签：** #algorithm

---

### 47. 零钱兑换

**难度：** 中等
**主题：** 动态规划, bfs
**岗位：** SWE
**级别：** L3-L5

**问题：** 给定硬币面额 `coins` 与金额 `amount`，返回凑成该金额所需的最少硬币数；无解返回 `-1`。硬币数量不限。

**思路：** 1D DP——`dp[x]` = 凑金额 `x` 的最少硬币数，初始 `inf`（或 `amount+1`）。对每个 `x` 从 1 到 amount，对每枚 `c <= x` 取 `dp[x] = min(dp[x], dp[x-c] + 1)`。O(amount * len(coins))。备选：在状态图上做 BFS。

**Python：**
```python
def coin_change(coins: list[int], amount: int) -> int:
    INF = amount + 1
    dp = [0] + [INF] * amount
    for x in range(1, amount + 1):
        for c in coins:
            if c <= x and dp[x - c] + 1 < dp[x]:
                dp[x] = dp[x - c] + 1
    return -1 if dp[amount] == INF else dp[amount]
```

**TypeScript：**
```typescript
function coinChange(coins: number[], amount: number): number {
  const INF = amount + 1;
  const dp = new Array(amount + 1).fill(INF);
  dp[0] = 0;
  for (let x = 1; x <= amount; x++) {
    for (const c of coins) {
      if (c <= x && dp[x - c] + 1 < dp[x]) dp[x] = dp[x - c] + 1;
    }
  }
  return dp[amount] === INF ? -1 : dp[amount];
}
```

**Java：**
```java
public int coinChange(int[] coins, int amount) {
    int INF = amount + 1;
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, INF);
    dp[0] = 0;
    for (int x = 1; x <= amount; x++)
        for (int c : coins)
            if (c <= x && dp[x - c] + 1 < dp[x]) dp[x] = dp[x - c] + 1;
    return dp[amount] == INF ? -1 : dp[amount];
}
```

**要点：**
- 完全背包：金额自外向内迭代，硬币可复用。
- 哨兵 `amount + 1` 安全地大于任何有效答案。
- O(amount * coins) 时间，O(amount) 空间。

**标签：** #algorithm

---

### 48. 解码方法

**难度：** 中等
**主题：** 动态规划, 字符串
**岗位：** SWE
**级别：** L3-L5

**问题：** `'A'..'Z'` 编码为 `'1'..'26'`。给定数字串 `s`，返回解码方式数（如 `"226"` → `"BZ"`、`"VF"`、`"BBF"` 共 3 种）。

**思路：** 1D DP——`dp[i]` = 解码 `s[:i]` 的方式数。若 `s[i-1] != '0'`，加 `dp[i-1]`；若 `s[i-2:i]` 在 `"10".."26"` 之间，加 `dp[i-2]`。O(n) 时间；用两个标量做 O(1) 空间。

**Python：**
```python
def num_decodings(s: str) -> int:
    if not s or s[0] == "0":
        return 0
    prev, cur = 1, 1
    for i in range(1, len(s)):
        ways = 0
        if s[i] != "0":
            ways += cur
        two = int(s[i - 1:i + 1])
        if 10 <= two <= 26:
            ways += prev
        prev, cur = cur, ways
    return cur
```

**TypeScript：**
```typescript
function numDecodings(s: string): number {
  if (!s.length || s[0] === "0") return 0;
  let prev = 1, cur = 1;
  for (let i = 1; i < s.length; i++) {
    let ways = 0;
    if (s[i] !== "0") ways += cur;
    const two = parseInt(s.slice(i - 1, i + 1), 10);
    if (two >= 10 && two <= 26) ways += prev;
    prev = cur; cur = ways;
  }
  return cur;
}
```

**Java：**
```java
public int numDecodings(String s) {
    if (s.isEmpty() || s.charAt(0) == '0') return 0;
    int prev = 1, cur = 1;
    for (int i = 1; i < s.length(); i++) {
        int ways = 0;
        if (s.charAt(i) != '0') ways += cur;
        int two = Integer.parseInt(s.substring(i - 1, i + 1));
        if (two >= 10 && two <= 26) ways += prev;
        prev = cur; cur = ways;
    }
    return cur;
}
```

**要点：**
- 两种转移：取一位（非 0）或取两位（在 [10,26] 内）。
- `'0'` 单独无效，必须成对。
- 两个滚动标量实现 O(n) 时间、O(1) 空间。

**标签：** #algorithm

---

### 49. 找到字符串中所有字母异位词

**难度：** 中等
**主题：** 滑动窗口, 哈希, 字符串
**岗位：** SWE
**级别：** L3-L5

**问题：** 给定字符串 `s` 与 `p`，返回 `s` 中所有起点 `i`，使得 `s[i:i+|p|]` 是 `p` 的字母异位词。

**思路：** 大小为 `|p|` 的滑动窗口。维护 26 长频次数组，每步 O(26) 与 `p` 的频次比较。或维护 `matches` 计数器，仅在字符频次跨过零点时更新。O(|s|)。

**Python：**
```python
def find_anagrams(s: str, p: str) -> list[int]:
    if len(s) < len(p):
        return []
    need = [0] * 26
    have = [0] * 26
    for c in p:
        need[ord(c) - 97] += 1
    out: list[int] = []
    for i, c in enumerate(s):
        have[ord(c) - 97] += 1
        if i >= len(p):
            have[ord(s[i - len(p)]) - 97] -= 1
        if have == need:
            out.append(i - len(p) + 1)
    return out
```

**TypeScript：**
```typescript
function findAnagrams(s: string, p: string): number[] {
  if (s.length < p.length) return [];
  const need = new Array(26).fill(0);
  const have = new Array(26).fill(0);
  for (const c of p) need[c.charCodeAt(0) - 97]++;
  const eq = (a: number[], b: number[]) => a.every((v, i) => v === b[i]);
  const out: number[] = [];
  for (let i = 0; i < s.length; i++) {
    have[s.charCodeAt(i) - 97]++;
    if (i >= p.length) have[s.charCodeAt(i - p.length) - 97]--;
    if (i >= p.length - 1 && eq(have, need)) out.push(i - p.length + 1);
  }
  return out;
}
```

**Java：**
```java
public List<Integer> findAnagrams(String s, String p) {
    List<Integer> out = new ArrayList<>();
    if (s.length() < p.length()) return out;
    int[] need = new int[26], have = new int[26];
    for (char c : p.toCharArray()) need[c - 'a']++;
    for (int i = 0; i < s.length(); i++) {
        have[s.charAt(i) - 'a']++;
        if (i >= p.length()) have[s.charAt(i - p.length()) - 'a']--;
        if (i >= p.length() - 1 && Arrays.equals(have, need)) out.add(i - p.length() + 1);
    }
    return out;
}
```

**要点：**
- 定长窗口每步滑一格。
- 26 长频次比较是常数时间。
- 整体 O(|s|)——每字符进出各一次。

**标签：** #algorithm

---

### 50. 最长连续序列

**难度：** 中等
**主题：** 哈希, 数组, 并查集
**岗位：** SWE
**级别：** L3-L5

**问题：** 给定未排序整数数组，O(n) 时间求最长连续元素序列的长度。

**思路：** 全部入哈希集。对每个 `x` 只有 `x-1` 不在集中才开始扩链（保证每条链仅被走一次）。沿 `x, x+1, x+2, ...` 推进并记录最大值。摊还 O(n)。

**Python：**
```python
def longest_consecutive(nums: list[int]) -> int:
    s = set(nums)
    best = 0
    for x in s:
        if x - 1 not in s:
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
public int longestConsecutive(int[] nums) {
    Set<Integer> s = new HashSet<>();
    for (int x : nums) s.add(x);
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
- 跳过非链起点，保证每条链只走一次。
- 哈希集支持 O(1) 成员判断。
- 摊还 O(n)——内层循环总工作受 `n` 限制。

**标签：** #algorithm

---

### 51. 不同的岛屿数量

**难度：** 中等
**主题：** dfs, 哈希, 矩阵
**岗位：** SWE
**级别：** L3-L5

**问题：** 给定二进制网格，若一座岛能通过*平移*（不旋转）与另一座匹配则视为相同。返回不同岛屿的数量。

**思路：** 对每座岛 DFS 并记录"路径签名"为方向串（含回溯标记，如 `"DRUO"`）。坐标以岛首个格为锚点，让平移无关。把签名放入集合。O(m*n)。

**Python：**
```python
def num_distinct_islands(grid: list[list[int]]) -> int:
    m, n = len(grid), len(grid[0])
    shapes: set[tuple[tuple[int, int], ...]] = set()
    def dfs(r: int, c: int, r0: int, c0: int, path: list[tuple[int, int]]) -> None:
        if r < 0 or r >= m or c < 0 or c >= n or grid[r][c] != 1:
            return
        grid[r][c] = 0
        path.append((r - r0, c - c0))
        dfs(r + 1, c, r0, c0, path)
        dfs(r - 1, c, r0, c0, path)
        dfs(r, c + 1, r0, c0, path)
        dfs(r, c - 1, r0, c0, path)
    for r in range(m):
        for c in range(n):
            if grid[r][c] == 1:
                path: list[tuple[int, int]] = []
                dfs(r, c, r, c, path)
                shapes.add(tuple(path))
    return len(shapes)
```

**TypeScript：**
```typescript
function numDistinctIslands(grid: number[][]): number {
  const m = grid.length, n = grid[0].length;
  const shapes = new Set<string>();
  const dfs = (r: number, c: number, r0: number, c0: number, path: number[][]): void => {
    if (r < 0 || r >= m || c < 0 || c >= n || grid[r][c] !== 1) return;
    grid[r][c] = 0;
    path.push([r - r0, c - c0]);
    dfs(r + 1, c, r0, c0, path);
    dfs(r - 1, c, r0, c0, path);
    dfs(r, c + 1, r0, c0, path);
    dfs(r, c - 1, r0, c0, path);
  };
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r][c] === 1) {
        const path: number[][] = [];
        dfs(r, c, r, c, path);
        shapes.add(JSON.stringify(path));
      }
    }
  }
  return shapes.size;
}
```

**Java：**
```java
public int numDistinctIslands(int[][] grid) {
    int m = grid.length, n = grid[0].length;
    Set<String> shapes = new HashSet<>();
    for (int r = 0; r < m; r++)
        for (int c = 0; c < n; c++)
            if (grid[r][c] == 1) {
                StringBuilder path = new StringBuilder();
                dfs(grid, r, c, r, c, m, n, path);
                shapes.add(path.toString());
            }
    return shapes.size();
}
private void dfs(int[][] g, int r, int c, int r0, int c0, int m, int n, StringBuilder path) {
    if (r < 0 || r >= m || c < 0 || c >= n || g[r][c] != 1) return;
    g[r][c] = 0;
    path.append(r - r0).append(',').append(c - c0).append(';');
    dfs(g, r + 1, c, r0, c0, m, n, path);
    dfs(g, r - 1, c, r0, c0, m, n, path);
    dfs(g, r, c + 1, r0, c0, m, n, path);
    dfs(g, r, c - 1, r0, c0, m, n, path);
}
```

**要点：**
- 用首格偏移做锚，使形状对平移不变。
- 固定 DFS 顺序下，访问序列元组唯一标识形状。
- O(m*n)——每格只访问一次。

**标签：** #algorithm

---

### 52. 二进制矩阵中的最短路径

**难度：** 中等
**主题：** bfs, 图, 矩阵
**岗位：** SWE
**级别：** L3-L5

**问题：** 给定 `n x n` 二进制矩阵，返回从 `(0,0)` 到 `(n-1,n-1)` 仅穿越 `0` 的八方向最短路径长度；无解返回 `-1`。

**思路：** 从源点 BFS 扩展 8 个邻居，原地标记已访问。目标出队时返回深度。O(n^2)。大网格可用双向 BFS 或 A*（Chebyshev 启发）加速。

**Python：**
```python
from collections import deque

def shortest_path_binary_matrix(grid: list[list[int]]) -> int:
    n = len(grid)
    if grid[0][0] or grid[n - 1][n - 1]:
        return -1
    q: deque[tuple[int, int, int]] = deque([(0, 0, 1)])
    grid[0][0] = 1  # mark visited
    while q:
        r, c, d = q.popleft()
        if r == n - 1 and c == n - 1:
            return d
        for dr in (-1, 0, 1):
            for dc in (-1, 0, 1):
                if dr == 0 and dc == 0:
                    continue
                nr, nc = r + dr, c + dc
                if 0 <= nr < n and 0 <= nc < n and grid[nr][nc] == 0:
                    grid[nr][nc] = 1
                    q.append((nr, nc, d + 1))
    return -1
```

**TypeScript：**
```typescript
function shortestPathBinaryMatrix(grid: number[][]): number {
  const n = grid.length;
  if (grid[0][0] || grid[n - 1][n - 1]) return -1;
  const q: [number, number, number][] = [[0, 0, 1]];
  grid[0][0] = 1;
  while (q.length) {
    const [r, c, d] = q.shift()!;
    if (r === n - 1 && c === n - 1) return d;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < n && nc >= 0 && nc < n && grid[nr][nc] === 0) {
          grid[nr][nc] = 1;
          q.push([nr, nc, d + 1]);
        }
      }
    }
  }
  return -1;
}
```

**Java：**
```java
public int shortestPathBinaryMatrix(int[][] grid) {
    int n = grid.length;
    if (grid[0][0] != 0 || grid[n - 1][n - 1] != 0) return -1;
    Deque<int[]> q = new ArrayDeque<>();
    q.offer(new int[]{0, 0, 1});
    grid[0][0] = 1;
    while (!q.isEmpty()) {
        int[] cur = q.poll();
        int r = cur[0], c = cur[1], d = cur[2];
        if (r == n - 1 && c == n - 1) return d;
        for (int dr = -1; dr <= 1; dr++)
            for (int dc = -1; dc <= 1; dc++) {
                if (dr == 0 && dc == 0) continue;
                int nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < n && nc >= 0 && nc < n && grid[nr][nc] == 0) {
                    grid[nr][nc] = 1;
                    q.offer(new int[]{nr, nc, d + 1});
                }
            }
    }
    return -1;
}
```

**要点：**
- 8 方向 BFS 保证无权图最短路径。
- 入队时（而非出队时）标记，避免重复处理。
- 起点或终点被堵则立即返回 -1。

**标签：** #algorithm

---

### 53. 单词接龙 II

**难度：** 困难
**主题：** bfs, 图, 回溯, 字符串
**岗位：** SWE
**级别：** L5+

**问题：** 与单词接龙同设定，但返回从 `beginWord` 到 `endWord` 的*所有*最短转换序列，每条以词列表表示。

**思路：** 两段：(1) 按层 BFS，只对最短路径上的词构造 `child -> [parents]` 父节点映射；找到 `endWord` 那层停止。(2) 用父映射从 `endWord` 反向 DFS 到 `beginWord` 枚举所有路径。O(N * L^2 + answer)。

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
        words -= layer
        next_layer: set[str] = set()
        for w in layer:
            for i in range(len(w)):
                for ch in "abcdefghijklmnopqrstuvwxyz":
                    nw = w[:i] + ch + w[i + 1:]
                    if nw in words:
                        next_layer.add(nw)
                        parents[nw].append(w)
                        if nw == end:
                            found = True
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
  let layer = new Set<string>([begin]);
  let found = false;
  while (layer.size && !found) {
    for (const w of layer) words.delete(w);
    const next = new Set<string>();
    for (const w of layer) {
      for (let i = 0; i < w.length; i++) {
        for (let c = 97; c <= 122; c++) {
          const nw = w.slice(0, i) + String.fromCharCode(c) + w.slice(i + 1);
          if (words.has(nw)) {
            next.add(nw);
            if (!parents.has(nw)) parents.set(nw, []);
            parents.get(nw)!.push(w);
            if (nw === end) found = true;
          }
        }
      }
    }
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
public List<List<String>> findLadders(String begin, String end, List<String> wordList) {
    Set<String> words = new HashSet<>(wordList);
    List<List<String>> res = new ArrayList<>();
    if (!words.contains(end)) return res;
    Map<String, List<String>> parents = new HashMap<>();
    Set<String> layer = new HashSet<>(Set.of(begin));
    boolean found = false;
    while (!layer.isEmpty() && !found) {
        words.removeAll(layer);
        Set<String> next = new HashSet<>();
        for (var w : layer) {
            char[] arr = w.toCharArray();
            for (int i = 0; i < arr.length; i++) {
                char orig = arr[i];
                for (char c = 'a'; c <= 'z'; c++) {
                    arr[i] = c;
                    String nw = new String(arr);
                    if (words.contains(nw)) {
                        next.add(nw);
                        parents.computeIfAbsent(nw, k -> new ArrayList<>()).add(w);
                        if (nw.equals(end)) found = true;
                    }
                }
                arr[i] = orig;
            }
        }
        layer = next;
    }
    if (found) backtrack(end, begin, new ArrayList<>(), parents, res);
    return res;
}
private void backtrack(String w, String begin, List<String> path, Map<String, List<String>> parents, List<List<String>> res) {
    if (w.equals(begin)) {
        List<String> r = new ArrayList<>(); r.add(begin);
        for (int i = path.size() - 1; i >= 0; i--) r.add(path.get(i));
        res.add(r); return;
    }
    path.add(w);
    for (var p : parents.getOrDefault(w, List.of())) backtrack(p, begin, path, parents, res);
    path.remove(path.size() - 1);
}
```

**要点：**
- 按层 BFS，把本层词从字典移除，禁止下层回头。
- BFS 期间记录父链，再用 DFS 反向枚举所有最短路径。
- 在第一次包含 `endWord` 的层就停。

**标签：** #algorithm

---

### 54. O(1) 时间插入、删除和获取随机元素

**难度：** 中等
**主题：** 设计, 哈希, 数组
**岗位：** SWE
**级别：** L3-L5

**问题：** 设计数据结构支持 `insert(val)`、`remove(val)`、`getRandom()` 平均 O(1)。值互不相同。

**思路：** 数组存值 + 哈希表存值到数组下标。删除时把目标与末尾交换、更新被换元素的映射、弹出末尾。`getRandom` 用均匀随机下标。

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
        i = self.idx[val]
        last = self.arr[-1]
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
        if (i < arr.size() - 1) idx.put(last, i);
        arr.remove(arr.size() - 1);
        return true;
    }
    public int getRandom() { return arr.get(rng.nextInt(arr.size())); }
}
```

**要点：**
- 数组给 O(1) 随机访问；哈希表给 O(1) 查找。
- 与末尾交换让删除保持 O(1)。
- 别忘了更新被换元素在哈希表中的下标。

**标签：** #algorithm

---

### 55. 最佳买卖股票时机含冷冻期

**难度：** 中等
**主题：** 动态规划, 数组
**岗位：** SWE
**级别：** L3-L5

**问题：** 给定每日股价，求最大利润。可无限次交易，但卖出次日不能买入（1 天冷冻期）。任意时刻最多持有 1 股。

**思路：** 状态机 DP——每天 `held`、`sold`、`rest` 三态。转移：`held = max(held, rest - price)`、`sold = held + price`、`rest = max(rest, sold_prev)`。O(n) 时间、O(1) 空间。

**Python：**
```python
def max_profit(prices: list[int]) -> int:
    held = float("-inf")
    sold = 0
    rest = 0
    for p in prices:
        prev_sold = sold
        sold = held + p
        held = max(held, rest - p)
        rest = max(rest, prev_sold)
    return max(sold, rest)
```

**TypeScript：**
```typescript
function maxProfit(prices: number[]): number {
  let held = -Infinity, sold = 0, rest = 0;
  for (const p of prices) {
    const prevSold = sold;
    sold = held + p;
    held = Math.max(held, rest - p);
    rest = Math.max(rest, prevSold);
  }
  return Math.max(sold, rest);
}
```

**Java：**
```java
public int maxProfit(int[] prices) {
    int held = Integer.MIN_VALUE, sold = 0, rest = 0;
    for (int p : prices) {
        int prevSold = sold;
        sold = held + p;
        held = Math.max(held, rest - p);
        rest = Math.max(rest, prevSold);
    }
    return Math.max(sold, rest);
}
```

**要点：**
- 三态建模冷冻期：持有、刚卖、休息。
- 买入从 `rest` 而非 `sold` 转入，强制冷冻一天。
- O(n) 时间、O(1) 空间，三个滚动标量。

**标签：** #algorithm

---

### 56. 青蛙过河

**难度：** 困难
**主题：** 动态规划, 哈希
**岗位：** SWE
**级别：** L5+

**问题：** 青蛙在第 0 块石头上。给定升序石头位置数组，首跳为 1 单位。若上跳跨度为 `k`，下一跳必须为 `k-1`、`k` 或 `k+1`。青蛙能否仅踩石头到达最后一块？

**思路：** 在 `(stone_index, last_jump)` 上做记忆化 DFS，或 DP `dp[stone] = 可达 last-jump 集合`。对 `dp[stone]` 中每个 `k`，尝试 `k-1, k, k+1` 并传播到对应石头（位置→下标哈希）。O(n^2)。

**Python：**
```python
def can_cross(stones: list[int]) -> bool:
    if stones[1] - stones[0] != 1:
        return False
    pos: dict[int, set[int]] = {s: set() for s in stones}
    pos[stones[1]].add(1)
    for s in stones[:-1]:
        for k in pos[s]:
            for nk in (k - 1, k, k + 1):
                if nk > 0 and s + nk in pos:
                    pos[s + nk].add(nk)
    return bool(pos[stones[-1]])
```

**TypeScript：**
```typescript
function canCross(stones: number[]): boolean {
  if (stones[1] - stones[0] !== 1) return false;
  const pos = new Map<number, Set<number>>();
  for (const s of stones) pos.set(s, new Set());
  pos.get(stones[1])!.add(1);
  for (let i = 0; i < stones.length - 1; i++) {
    const s = stones[i];
    for (const k of pos.get(s)!) {
      for (const nk of [k - 1, k, k + 1]) {
        if (nk > 0 && pos.has(s + nk)) pos.get(s + nk)!.add(nk);
      }
    }
  }
  return pos.get(stones[stones.length - 1])!.size > 0;
}
```

**Java：**
```java
public boolean canCross(int[] stones) {
    if (stones[1] - stones[0] != 1) return false;
    Map<Integer, Set<Integer>> pos = new HashMap<>();
    for (int s : stones) pos.put(s, new HashSet<>());
    pos.get(stones[1]).add(1);
    for (int i = 0; i < stones.length - 1; i++) {
        int s = stones[i];
        for (int k : pos.get(s))
            for (int nk = k - 1; nk <= k + 1; nk++)
                if (nk > 0 && pos.containsKey(s + nk)) pos.get(s + nk).add(nk);
    }
    return !pos.get(stones[stones.length - 1]).isEmpty();
}
```

**要点：**
- DP 状态：每块石头上可达的跳跃幅度集合。
- 第一跳被强制为 1。
- 最后一块可达当且仅当其集合非空。

**标签：** #algorithm

---

### 57. 扫地机器人

**难度：** 困难
**主题：** dfs, 回溯, 设计
**岗位：** SWE
**级别：** L5+

**问题：** 未知网格中的机器人可执行 `move()`、`turnLeft()`、`turnRight()`、`clean()`，只能通过尝试 `move()` 来感知墙。清扫整个可达房间。

**思路：** 螺旋回溯 DFS。维护已清扫 `(x,y)` 集合及当前朝向。每步先清扫，再按固定旋转尝试 4 方向；若下一格未访问且 `move()` 成功则递归。递归后通过转 180°、`move`、再转 180° "原路返回"。O(格数)。

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
    def go_back() -> None:
        robot.turnRight(); robot.turnRight()
        robot.move()
        robot.turnRight(); robot.turnRight()
    def dfs(r: int, c: int, d: int) -> None:
        robot.clean()
        visited.add((r, c))
        for i in range(4):
            nd = (d + i) % 4
            nr, nc = r + dirs[nd][0], c + dirs[nd][1]
            if (nr, nc) not in visited and robot.move():
                dfs(nr, nc, nd)
                go_back()
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
  const goBack = (): void => {
    robot.turnRight(); robot.turnRight();
    robot.move();
    robot.turnRight(); robot.turnRight();
  };
  const dfs = (r: number, c: number, d: number): void => {
    robot.clean();
    visited.add(`${r},${c}`);
    for (let i = 0; i < 4; i++) {
      const nd = (d + i) % 4;
      const nr = r + dirs[nd][0], nc = c + dirs[nd][1];
      if (!visited.has(`${nr},${nc}`) && robot.move()) {
        dfs(nr, nc, nd);
        goBack();
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

private static final int[][] DIRS_ROBOT = {{-1, 0}, {0, 1}, {1, 0}, {0, -1}};

public void cleanRoom(Robot robot) {
    Set<String> visited = new HashSet<>();
    dfsRobot(robot, 0, 0, 0, visited);
}
private void dfsRobot(Robot robot, int r, int c, int d, Set<String> visited) {
    robot.clean();
    visited.add(r + "," + c);
    for (int i = 0; i < 4; i++) {
        int nd = (d + i) % 4;
        int nr = r + DIRS_ROBOT[nd][0], nc = c + DIRS_ROBOT[nd][1];
        if (!visited.contains(nr + "," + nc) && robot.move()) {
            dfsRobot(robot, nr, nc, nd, visited);
            robot.turnRight(); robot.turnRight();
            robot.move();
            robot.turnRight(); robot.turnRight();
        }
        robot.turnRight();
    }
}
```

**要点：**
- 用方向 + 相对移动组合得到绝对坐标。
- `goBack`（转 180、移、再转 180）在递归后恢复位置与朝向。
- 每格只入一次；总移动数 O(格数)。

**标签：** #algorithm

---

### 58. 连接词

**难度：** 困难
**主题：** 动态规划, 字典树, 字符串, dfs
**岗位：** SWE
**级别：** L5+

**问题：** 给定互异单词列表，返回所有"由列表中其他词（至少两个）拼接而成"的词。

**思路：** 按长度排序使较短词先入字典。处理每个词时只用比它短的词做单词拆分。`dp[i]` = `s[:i]` 可拆。哈希集合 O(sum(L^2))；用字典树更快。

**Python：**
```python
def find_all_concatenated_words(words: list[str]) -> list[str]:
    words.sort(key=len)
    seen: set[str] = set()
    out: list[str] = []
    def is_concat(w: str) -> bool:
        if not seen:
            return False
        n = len(w)
        dp = [False] * (n + 1)
        dp[0] = True
        for i in range(1, n + 1):
            for j in range(i):
                if dp[j] and w[j:i] in seen:
                    dp[i] = True
                    break
        return dp[n]
    for w in words:
        if is_concat(w):
            out.append(w)
        seen.add(w)
    return out
```

**TypeScript：**
```typescript
function findAllConcatenatedWordsInADict(words: string[]): string[] {
  words.sort((a, b) => a.length - b.length);
  const seen = new Set<string>();
  const out: string[] = [];
  const isConcat = (w: string): boolean => {
    if (!seen.size) return false;
    const n = w.length;
    const dp = new Array(n + 1).fill(false);
    dp[0] = true;
    for (let i = 1; i <= n; i++) {
      for (let j = 0; j < i; j++) {
        if (dp[j] && seen.has(w.slice(j, i))) { dp[i] = true; break; }
      }
    }
    return dp[n];
  };
  for (const w of words) {
    if (isConcat(w)) out.push(w);
    seen.add(w);
  }
  return out;
}
```

**Java：**
```java
public List<String> findAllConcatenatedWordsInADict(String[] words) {
    Arrays.sort(words, (a, b) -> a.length() - b.length());
    Set<String> seen = new HashSet<>();
    List<String> out = new ArrayList<>();
    for (var w : words) {
        if (isConcat(w, seen)) out.add(w);
        seen.add(w);
    }
    return out;
}
private boolean isConcat(String w, Set<String> seen) {
    if (seen.isEmpty()) return false;
    int n = w.length();
    boolean[] dp = new boolean[n + 1];
    dp[0] = true;
    for (int i = 1; i <= n; i++)
        for (int j = 0; j < i; j++)
            if (dp[j] && seen.contains(w.substring(j, i))) { dp[i] = true; break; }
    return dp[n];
}
```

**要点：**
- 按长度排序，确保拆分时所有候选都已入集。
- 对每个候选复用单词拆分 DP。
- 空 `seen` 短路——最短词不可能是连接词。

**标签：** #algorithm

---

### 59. 最大数

**难度：** 中等
**主题：** 排序, 贪心, 字符串
**岗位：** SWE
**级别：** L3-L5

**问题：** 给定非负整数列表，重排后拼成最大整数并以字符串返回（例如 `[3,30,34,5,9]` → `"9534330"`）。

**思路：** 自定义比较器：`a` 排 `b` 前当且仅当 `a+b > b+a`（字符串拼接）。排序后拼接，再去除前导零（`"00"` → `"0"`）。O(n log n * L)。

**Python：**
```python
from functools import cmp_to_key

def largest_number(nums: list[int]) -> str:
    strs = [str(x) for x in nums]
    strs.sort(key=cmp_to_key(lambda a, b: -1 if a + b > b + a else (1 if a + b < b + a else 0)))
    out = "".join(strs)
    return "0" if out[0] == "0" else out
```

**TypeScript：**
```typescript
function largestNumber(nums: number[]): string {
  const strs = nums.map(String);
  strs.sort((a, b) => (b + a).localeCompare(a + b));
  const out = strs.join("");
  return out[0] === "0" ? "0" : out;
}
```

**Java：**
```java
public String largestNumber(int[] nums) {
    String[] strs = Arrays.stream(nums).mapToObj(String::valueOf).toArray(String[]::new);
    Arrays.sort(strs, (a, b) -> (b + a).compareTo(a + b));
    String out = String.join("", strs);
    return out.charAt(0) == '0' ? "0" : out;
}
```

**要点：**
- 两两比较 `a+b vs b+a` 定义最大拼接的全序。
- 仅当结果全是零（如全零输入）才剥成 "0"。
- O(n log n) 次比较；每次比较是 O(L) 字符串拼接。

**标签：** #algorithm

---

### 60. 基本计算器 II

**难度：** 中等
**主题：** 栈, 字符串, 递归, 解析
**岗位：** SWE
**级别：** L3-L5

**问题：** 实现一个表达式计算器，输入含非负整数、`+`、`-`、`*`、`/`（整除向零截断）和空格；无括号。

**思路：** 单次扫描 + 栈。记 `prev_op`（初值 `+`）和正在构造的数字。遇运算符或结尾按 `prev_op` 推入/变换：`+num`、`-num`、`top*=num`、`top//=num`。栈求和即结果。O(n)。

**Python：**
```python
def calculate(s: str) -> int:
    stack: list[int] = []
    num = 0
    prev_op = "+"
    for i, c in enumerate(s):
        if c.isdigit():
            num = num * 10 + int(c)
        if (not c.isdigit() and c != " ") or i == len(s) - 1:
            if prev_op == "+":
                stack.append(num)
            elif prev_op == "-":
                stack.append(-num)
            elif prev_op == "*":
                stack.append(stack.pop() * num)
            else:
                top = stack.pop()
                stack.append(int(top / num))  # truncate toward zero
            prev_op = c
            num = 0
    return sum(stack)
```

**TypeScript：**
```typescript
function calculate(s: string): number {
  const stack: number[] = [];
  let num = 0;
  let prevOp = "+";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c >= "0" && c <= "9") num = num * 10 + (c.charCodeAt(0) - 48);
    if ((c !== " " && (c < "0" || c > "9")) || i === s.length - 1) {
      if (prevOp === "+") stack.push(num);
      else if (prevOp === "-") stack.push(-num);
      else if (prevOp === "*") stack.push(stack.pop()! * num);
      else stack.push(Math.trunc(stack.pop()! / num));
      prevOp = c;
      num = 0;
    }
  }
  return stack.reduce((a, b) => a + b, 0);
}
```

**Java：**
```java
public int calculate(String s) {
    Deque<Integer> stack = new ArrayDeque<>();
    int num = 0;
    char prevOp = '+';
    for (int i = 0; i < s.length(); i++) {
        char c = s.charAt(i);
        if (Character.isDigit(c)) num = num * 10 + (c - '0');
        if ((c != ' ' && !Character.isDigit(c)) || i == s.length() - 1) {
            if (prevOp == '+') stack.push(num);
            else if (prevOp == '-') stack.push(-num);
            else if (prevOp == '*') stack.push(stack.pop() * num);
            else stack.push(stack.pop() / num);
            prevOp = c;
            num = 0;
        }
    }
    int sum = 0;
    for (int v : stack) sum += v;
    return sum;
}
```

**要点：**
- `prev_op` 滞后于当前运算符，决定刚构造好的数怎么并入。
- `*`/`/` 折入栈顶以遵守优先级。
- 整除必须向零截断（Python 中负数情况用 `int(a/b)` 而非 `a // b`）。

**标签：** #algorithm

---

### 61. 最长有效括号

**难度：** 困难
**主题：** 栈, 动态规划, 字符串
**岗位：** SWE
**级别：** L5+

**问题：** 给定仅含 `'('` 和 `')'` 的字符串，返回最长有效（合法）括号子串的长度。

**思路：** 索引栈，初始压入哨兵 `-1`。`(` 压入索引；`)` 弹出。若栈空，把当前索引作为新基准压入；否则用 `i - stack.top()` 更新最大值。O(n)。备选：左右两次扫描计数法，O(1) 额外空间。

**Python：**
```python
def longest_valid_parentheses(s: str) -> int:
    stack: list[int] = [-1]
    best = 0
    for i, c in enumerate(s):
        if c == "(":
            stack.append(i)
        else:
            stack.pop()
            if not stack:
                stack.append(i)
            else:
                best = max(best, i - stack[-1])
    return best
```

**TypeScript：**
```typescript
function longestValidParentheses(s: string): number {
  const stack: number[] = [-1];
  let best = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "(") stack.push(i);
    else {
      stack.pop();
      if (!stack.length) stack.push(i);
      else best = Math.max(best, i - stack[stack.length - 1]);
    }
  }
  return best;
}
```

**Java：**
```java
public int longestValidParentheses(String s) {
    Deque<Integer> stack = new ArrayDeque<>();
    stack.push(-1);
    int best = 0;
    for (int i = 0; i < s.length(); i++) {
        if (s.charAt(i) == '(') stack.push(i);
        else {
            stack.pop();
            if (stack.isEmpty()) stack.push(i);
            else best = Math.max(best, i - stack.peek());
        }
    }
    return best;
}
```

**要点：**
- 栈底保存当前有效段之前的索引基准。
- 遇到无匹配 `)` 时把它的索引压为新基准。
- O(n) 时间，O(n) 最坏空间。

**标签：** #algorithm

---

### 62. 三个无重叠子数组的最大和

**难度：** 困难
**主题：** 动态规划, 滑动窗口, 数组
**岗位：** SWE
**级别：** L5+

**问题：** 给定整数数组 `nums` 和整数 `k`，找出三个不重叠、长度均为 `k` 的子数组，使其总和最大。返回起始索引（同分时取字典序最小元组）。

**思路：** 预计算长度 `k` 的窗口和。构造 `left[i]` = `[0..i]` 内最优窗口起点、`right[i]` = `[i..n-k]` 内最优起点（同分取小索引）。枚举中间窗口起点 `j`，组合 `left[j-k]`、`j`、`right[j+k]`。O(n)。

**Python：**
```python
def max_sum_of_three_subarrays(nums: list[int], k: int) -> list[int]:
    n = len(nums)
    # window sums of length k
    s = sum(nums[:k])
    sums = [s]
    for i in range(k, n):
        s += nums[i] - nums[i - k]
        sums.append(s)
    m = len(sums)
    left = [0] * m
    best = 0
    for i in range(m):
        if sums[i] > sums[best]:
            best = i
        left[i] = best
    right = [0] * m
    best = m - 1
    for i in range(m - 1, -1, -1):
        if sums[i] >= sums[best]:
            best = i
        right[i] = best
    ans = [0, 0, 0]
    best_sum = -1
    for j in range(k, m - k):
        l, r = left[j - k], right[j + k]
        total = sums[l] + sums[j] + sums[r]
        if total > best_sum:
            best_sum = total
            ans = [l, j, r]
    return ans
```

**TypeScript：**
```typescript
function maxSumOfThreeSubarrays(nums: number[], k: number): number[] {
  const n = nums.length;
  let s = 0;
  for (let i = 0; i < k; i++) s += nums[i];
  const sums = [s];
  for (let i = k; i < n; i++) { s += nums[i] - nums[i - k]; sums.push(s); }
  const m = sums.length;
  const left = new Array(m).fill(0);
  let best = 0;
  for (let i = 0; i < m; i++) { if (sums[i] > sums[best]) best = i; left[i] = best; }
  const right = new Array(m).fill(0);
  best = m - 1;
  for (let i = m - 1; i >= 0; i--) { if (sums[i] >= sums[best]) best = i; right[i] = best; }
  let ans = [0, 0, 0];
  let bestSum = -1;
  for (let j = k; j <= m - k - 1; j++) {
    const l = left[j - k], r = right[j + k];
    const total = sums[l] + sums[j] + sums[r];
    if (total > bestSum) { bestSum = total; ans = [l, j, r]; }
  }
  return ans;
}
```

**Java：**
```java
public int[] maxSumOfThreeSubarrays(int[] nums, int k) {
    int n = nums.length, s = 0;
    for (int i = 0; i < k; i++) s += nums[i];
    int[] sums = new int[n - k + 1];
    sums[0] = s;
    for (int i = k; i < n; i++) { s += nums[i] - nums[i - k]; sums[i - k + 1] = s; }
    int m = sums.length;
    int[] left = new int[m], right = new int[m];
    int best = 0;
    for (int i = 0; i < m; i++) { if (sums[i] > sums[best]) best = i; left[i] = best; }
    best = m - 1;
    for (int i = m - 1; i >= 0; i--) { if (sums[i] >= sums[best]) best = i; right[i] = best; }
    int[] ans = new int[3];
    int bestSum = -1;
    for (int j = k; j <= m - k - 1; j++) {
        int l = left[j - k], r = right[j + k];
        int total = sums[l] + sums[j] + sums[r];
        if (total > bestSum) { bestSum = total; ans = new int[]{l, j, r}; }
    }
    return ans;
}
```

**要点：**
- 预计算定长窗口和，O(n)。
- `left` 用 `>`、`right` 用 `>=`，以在并列时优先小下标。
- 枚举中间窗口；按固定偏移取最优左右。

**标签：** #algorithm

---

## Google 特有的建议

- **边写边讲。** 在没有自动补全的 Google Doc 里默写代码会被解读为"卡住了"。哪怕自信也要叙述你的思路。
- **开写前明确讨论边界**：空输入、单元素、重复值、溢出、负数。面试官常常仅凭这点就多给一分。
- **预期至少一个会推翻你初始方案的追问。** "输入装不下内存呢？"/"1000 线程同时调呢？"准备好流式和并发的方案。
- **系统设计时尽早画框。** 别说 10 分钟才动笔。乱画的图也强过干净的独白。
- **Googleyness 是认真的。** 两轮技术好 + 一轮行为弱 = 没 offer。准备 6-8 个 STAR 故事。

## 参考资料

- LeetCode "Google" 公司标签（公开整理列表）
- 《Cracking the Coding Interview》第 11 章（Google 风格设计）
- 《System Design Interview》by Alex Xu —— 卷 1 和 2
- Google 的 SRE 书（在线免费）——适合 SRE/基础设施轮
