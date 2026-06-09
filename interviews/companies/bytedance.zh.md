# 字节跳动（TikTok / 抖音 / 飞书）

```yaml
company: 字节跳动（TikTok、抖音、Lark/飞书、CapCut/剪映）
typical_rounds: 1 轮 HR 初筛 + 3-5 轮技术面（编码重）+ 1 轮交叉/领导面 + HR 终面
focus_areas: DP、图、偏数学的算法、视频/推荐系统设计
languages_allowed: 任意主流语言；Go/Java/C++/Python 常见
duration: 每轮 60 分钟，常一轮两题
notable_quirks:
  - 编码门槛号称全行业最高——Hard 级 DP/图题很常见
  - 多轮背靠背；有时同一天打完
  - 工程文化是"速度和担当"——行为面试偏向快速迭代的故事
  - 国际候选人常被大陆团队用英语面（双方都懂时也可能切换普通话）
  - TikTok 岗位推荐系统的题反复出现
sources: LeetCode Discuss（bytedance/tiktok 标签）、一亩三分地、Blind、Glassdoor
```

## 概述

字节跳动以业界最难的编码面试之一闻名。要准备 Hard 级动态规划、图算法和巧妙的数学/位运算。TikTok 系统设计轮一定会涉及视频流、信息流排序和推荐系统。行为面试比美国公司更轻，但会探查"迭代速度"和"处理模糊性的担当"。对于大陆团队，工作时长预期（接近 996，虽已调整）可能会被问到。

## 题目

### 1. 最长递增子序列

**难度：** 中等
**主题：** dp, binary-search, arrays
**岗位：** SWE
**级别：** 2-2

**问题：** 给定整数数组 `nums`，返回最长严格递增子序列的长度。

**思路：** 耐心排序/二分变体：维护 `tails[]`，其中 `tails[i]` = 所有长度为 `i+1` 的递增子序列中最小的尾元素。对每个 num 二分查找位置替换或追加。O(n log n)。经典 O(n²) DP 也可接受，但字节追问会逼到 O(n log n)。

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
import java.util.*;

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
- `tails` 并非真正的 LIS，但其长度正确。
- 二分把复杂度从 O(n^2) DP 降到 O(n log n)。
- 非严格递增时改用 `bisect_right`。

**标签：** #algorithm

---

### 2. 编辑距离

**难度：** 困难
**主题：** dp, strings
**岗位：** SWE
**级别：** 2-2

**问题：** 给定两个字符串 `word1` 和 `word2`，返回将 `word1` 转换为 `word2` 所需的最少操作数（插入、删除、替换）。

**思路：** 二维 DP。`dp[i][j]` = `word1[:i]` 和 `word2[:j]` 的编辑距离。边界：`dp[0][j] = j`、`dp[i][0] = i`。转移：字符相等时 `dp[i][j] = dp[i-1][j-1]`；否则 `1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])`。时间/空间 O(m*n)，用滚动行可降到 O(min(m,n)) 空间。

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
      dp[i][j] = word1[i - 1] === word2[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
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
            if (word1.charAt(i - 1) == word2.charAt(j - 1)) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], Math.min(dp[i - 1][j], dp[i][j - 1]));
            }
        }
    }
    return dp[m][n];
}
```

**要点：**
- 三种转移分别对应删除、插入、替换。
- 第一行/列初始化为身份代价。
- 滚动数组可降至 O(min(m, n)) 空间。

**标签：** #algorithm

---

### 3. 二维矩阵中的最大子矩阵和

**难度：** 困难
**主题：** dp, matrix, kadane
**岗位：** SWE
**级别：** 3-5

**问题：** 给定 2D 矩阵，找出元素和最大的子矩阵。

**思路：** 固定顶行 `t` 和底行 `b`；将 `[t..b]` 行压成 1D 数组（列和），对其跑 Kadane 求最大子数组。遍历所有 `(t, b)` 对。O(rows² * cols)。最大子数组（1D Kadane）是核心积木。注意全负情况。

**Python：**
```python
def max_sum_rectangle(matrix: list[list[int]]) -> int:
    rows, cols = len(matrix), len(matrix[0])
    best = float("-inf")
    for t in range(rows):
        col_sum = [0] * cols
        for b in range(t, rows):
            for c in range(cols):
                col_sum[c] += matrix[b][c]
            cur = best_row = col_sum[0]
            for x in col_sum[1:]:
                cur = max(x, cur + x)
                best_row = max(best_row, cur)
            best = max(best, best_row)
    return int(best)
```

**TypeScript：**
```typescript
function maxSumRectangle(matrix: number[][]): number {
  const rows = matrix.length, cols = matrix[0].length;
  let best = -Infinity;
  for (let t = 0; t < rows; t++) {
    const colSum = new Array(cols).fill(0);
    for (let b = t; b < rows; b++) {
      for (let c = 0; c < cols; c++) colSum[c] += matrix[b][c];
      let cur = colSum[0], bestRow = colSum[0];
      for (let i = 1; i < cols; i++) {
        cur = Math.max(colSum[i], cur + colSum[i]);
        bestRow = Math.max(bestRow, cur);
      }
      best = Math.max(best, bestRow);
    }
  }
  return best;
}
```

**Java：**
```java
int maxSumRectangle(int[][] matrix) {
    int rows = matrix.length, cols = matrix[0].length;
    int best = Integer.MIN_VALUE;
    for (int t = 0; t < rows; t++) {
        int[] colSum = new int[cols];
        for (int b = t; b < rows; b++) {
            for (int c = 0; c < cols; c++) colSum[c] += matrix[b][c];
            int cur = colSum[0], bestRow = colSum[0];
            for (int i = 1; i < cols; i++) {
                cur = Math.max(colSum[i], cur + colSum[i]);
                bestRow = Math.max(bestRow, cur);
            }
            best = Math.max(best, bestRow);
        }
    }
    return best;
}
```

**要点：**
- 将 2D 问题降为多次 1D Kadane。
- 外层 O(rows^2) 遍历行对，内层 Kadane O(cols)，合计 O(rows^2 * cols)。
- 全负矩阵返回最大的单个元素。

**标签：** #algorithm

---

### 4. 戳气球

**难度：** 困难
**主题：** dp, interval-dp
**岗位：** SWE
**级别：** 3-5

**问题：** 给定 `n` 个值为 `nums[i]` 的气球，戳爆气球 `i` 得到 `nums[i-1] * nums[i] * nums[i+1]` 个金币（越界视为 1）。求最大金币数。

**思路：** 区间 DP——考虑区间 `(l, r)` 中*最后戳爆*的气球（不是第一个）。`dp[l][r] = max（k 在 (l, r) 区间）of (dp[l][k] + nums[l]*nums[k]*nums[r] + dp[k][r])`。两端补 1。O(n³)。

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
                dp[l][r] = max(dp[l][r], dp[l][k] + a[l] * a[k] * a[r] + dp[k][r])
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
        dp[l][r] = Math.max(dp[l][r], dp[l][k] + a[l] * a[k] * a[r] + dp[k][r]);
      }
    }
  }
  return dp[0][n - 1];
}
```

**Java：**
```java
int maxCoins(int[] nums) {
    int n = nums.length + 2;
    int[] a = new int[n];
    a[0] = a[n - 1] = 1;
    for (int i = 0; i < nums.length; i++) a[i + 1] = nums[i];
    int[][] dp = new int[n][n];
    for (int len = 2; len < n; len++) {
        for (int l = 0; l + len < n; l++) {
            int r = l + len;
            for (int k = l + 1; k < r; k++) {
                dp[l][r] = Math.max(dp[l][r], dp[l][k] + a[l] * a[k] * a[r] + dp[k][r]);
            }
        }
    }
    return dp[0][n - 1];
}
```

**要点：**
- 反向思考：枚举"最后"戳爆的气球，而不是第一个。
- 两端补 1 避免边界判断。
- 时间 O(n^3)，空间 O(n^2)。

**标签：** #algorithm

---

### 5. 滑动窗口最大值

**难度：** 困难
**主题：** sliding-window, deque, monotonic-queue
**岗位：** SWE
**级别：** 2-2

**问题：** 给定数组 `nums` 和整数 `k`，返回每个大小为 `k` 的窗口的最大值。

**思路：** 按值递减顺序存索引的单调双端队列。入队：当 `nums[back] <= nums[i]` 时弹尾，追加 i。若队首已出窗口（`front <= i - k`）则弹首。队首即当前最大。O(n)。

**Python：**
```python
from collections import deque

def max_sliding_window(nums: list[int], k: int) -> list[int]:
    dq: deque[int] = deque()
    out: list[int] = []
    for i, x in enumerate(nums):
        while dq and dq[0] <= i - k:
            dq.popleft()
        while dq and nums[dq[-1]] <= x:
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
    while (dq.length && nums[dq[dq.length - 1]] <= nums[i]) dq.pop();
    dq.push(i);
    if (i >= k - 1) out.push(nums[dq[0]]);
  }
  return out;
}
```

**Java：**
```java
import java.util.*;

int[] maxSlidingWindow(int[] nums, int k) {
    Deque<Integer> dq = new ArrayDeque<>();
    int[] out = new int[nums.length - k + 1];
    for (int i = 0; i < nums.length; i++) {
        while (!dq.isEmpty() && dq.peekFirst() <= i - k) dq.pollFirst();
        while (!dq.isEmpty() && nums[dq.peekLast()] <= nums[i]) dq.pollLast();
        dq.offerLast(i);
        if (i >= k - 1) out[i - k + 1] = nums[dq.peekFirst()];
    }
    return out;
}
```

**要点：**
- 双端队列存的是索引而非值，过期判断 O(1)。
- 每个索引最多入队和出队一次，均摊 O(n)。
- 队首始终是当前窗口的最大值。

**标签：** #algorithm

---

### 6. 单词接龙 II

**难度：** 困难
**主题：** graph, bfs, backtracking
**岗位：** SWE
**级别：** 3-5

**问题：** 类似单词接龙，但返回从 `beginWord` 到 `endWord` 的所有最短转换序列。

**思路：** BFS 建立 `parent` 图（每个节点指向上一层 BFS 的前驱）；在包含 `endWord` 的那层停止。然后从 `endWord` 反向 DFS/回溯 parent 图，枚举所有路径。关键：BFS 期间别枚举——太慢。O(N * L^2 + paths)。

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
                for c in "abcdefghijklmnopqrstuvwxyz":
                    nw = w[:i] + c + w[i + 1:]
                    if nw in words:
                        next_layer.add(nw)
                        parents[nw].append(w)
                        if nw == end:
                            found = True
        layer = next_layer
    res: list[list[str]] = []
    def back(w: str, path: list[str]) -> None:
        if w == begin:
            res.append([begin] + path[::-1])
            return
        for p in parents[w]:
            back(p, path + [w])
    if found:
        back(end, [])
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
    for (const w of layer) words.delete(w);
    const next = new Set<string>();
    for (const w of layer) {
      for (let i = 0; i < w.length; i++) {
        for (let c = 97; c < 123; c++) {
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
  const back = (w: string, path: string[]): void => {
    if (w === begin) { res.push([begin, ...path.slice().reverse()]); return; }
    for (const p of parents.get(w) ?? []) back(p, [...path, w]);
  };
  if (found) back(end, []);
  return res;
}
```

**Java：**
```java
import java.util.*;

List<List<String>> findLadders(String begin, String end, List<String> wordList) {
    Set<String> words = new HashSet<>(wordList);
    List<List<String>> res = new ArrayList<>();
    if (!words.contains(end)) return res;
    Map<String, List<String>> parents = new HashMap<>();
    Set<String> layer = new HashSet<>(List.of(begin));
    boolean found = false;
    while (!layer.isEmpty() && !found) {
        words.removeAll(layer);
        Set<String> next = new HashSet<>();
        for (String w : layer) {
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
    if (found) backtrack(end, begin, parents, new ArrayDeque<>(), res);
    return res;
}

void backtrack(String w, String begin, Map<String, List<String>> parents, Deque<String> path, List<List<String>> res) {
    path.push(w);
    if (w.equals(begin)) {
        res.add(new ArrayList<>(path));
    } else {
        for (String p : parents.getOrDefault(w, List.of())) backtrack(p, begin, parents, path, res);
    }
    path.pop();
}
```

**要点：**
- BFS 找最短深度，回溯枚举所有路径。
- 把整层从 `words` 中移除，防止同层或后续层重复访问。
- 在 `end` 首次出现的那一层停止 BFS。

**标签：** #algorithm

---

### 7. 正则表达式匹配

**难度：** 困难
**主题：** dp, strings, recursion
**岗位：** SWE
**级别：** 3-5

**问题：** 实现支持 `.`（任意字符）和 `*`（前一字符的零次或多次）的正则匹配。

**思路：** 二维 DP。`dp[i][j]` = `s[:i]` 是否匹配 `p[:j]`。若 `p[j-1] == '*'`：`dp[i][j] = dp[i][j-2]`（零次）或（匹配前导字符 && `dp[i-1][j]`）。普通字符/`.` 时：匹配 && `dp[i-1][j-1]`。坑：`*` 要求 p[j-2] 存在。O(m*n)。

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
  for (let j = 1; j <= n; j++) if (p[j - 1] === "*") dp[0][j] = dp[0][j - 2];
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
    for (int j = 1; j <= n; j++) if (p.charAt(j - 1) == '*') dp[0][j] = dp[0][j - 2];
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            char pc = p.charAt(j - 1);
            if (pc == '*') {
                dp[i][j] = dp[i][j - 2];
                char pp = p.charAt(j - 2);
                if (pp == '.' || pp == s.charAt(i - 1)) dp[i][j] = dp[i][j] || dp[i - 1][j];
            } else if (pc == '.' || pc == s.charAt(i - 1)) {
                dp[i][j] = dp[i - 1][j - 1];
            }
        }
    }
    return dp[m][n];
}
```

**要点：**
- `*` 表示前一个字符出现零次或多次。
- 空串可匹配 `a*b*c*` 之类模式（由第 0 行初始化处理）。
- 处理 `*` 时要分两支：零次 vs 多用一次。

**标签：** #algorithm

---

### 8. 无向图中连通分量数

**难度：** 中等
**主题：** union-find, graph, dfs
**岗位：** SWE
**级别：** 2-2

**问题：** 给定 `n` 个节点（0 到 n-1）和无向边列表，返回连通分量数。

**思路：** 路径压缩 + 按秩合并的 Union-Find。初始化 n 个分量；对每条边合并两端（真正合并时计数减一）。O(E * α(N))。DFS/BFS 也可。

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
    count = n
    for a, b in edges:
        ra, rb = find(a), find(b)
        if ra == rb:
            continue
        if rank[ra] < rank[rb]:
            ra, rb = rb, ra
        parent[rb] = ra
        if rank[ra] == rank[rb]:
            rank[ra] += 1
        count -= 1
    return count
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
  let count = n;
  for (const [a, b] of edges) {
    let ra = find(a), rb = find(b);
    if (ra === rb) continue;
    if (rank[ra] < rank[rb]) [ra, rb] = [rb, ra];
    parent[rb] = ra;
    if (rank[ra] === rank[rb]) rank[ra]++;
    count--;
  }
  return count;
}
```

**Java：**
```java
int countComponents(int n, int[][] edges) {
    int[] parent = new int[n], rank = new int[n];
    for (int i = 0; i < n; i++) parent[i] = i;
    int count = n;
    for (int[] e : edges) {
        int ra = find(parent, e[0]), rb = find(parent, e[1]);
        if (ra == rb) continue;
        if (rank[ra] < rank[rb]) { int t = ra; ra = rb; rb = t; }
        parent[rb] = ra;
        if (rank[ra] == rank[rb]) rank[ra]++;
        count--;
    }
    return count;
}

int find(int[] parent, int x) {
    while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
}
```

**要点：**
- 路径压缩让后续 find 接近常数时间。
- 只有真正合并才计数减一。
- 反阿克曼因子使其近似 O(E)。

**标签：** #algorithm

---

### 9. 设计 TikTok 信息流 / 推荐

**难度：** 困难
**主题：** system-design, recommendation, ranking, real-time
**岗位：** 高级 SWE
**级别：** 5+

**问题：** 设计 TikTok 的 For You Page（FYP）信息流。系统如何在 <200ms 内为每个用户挑出下一个视频？

**思路：** 两阶段排序：(1) **候选生成**——从多个源拉数百个候选：协同过滤 embedding（用户向量查询 → FAISS/HNSW 近邻搜索）、关注创作者的近期上传、本地/语言下的热门、"探索性"冷启动项。(2) **排序**——多任务 DNN 用用户特征 + 视频特征 + 上下文打分 P(like)、P(看完)、P(分享)、P(评论)。用加权目标合成。多样性重排（别连续推 5 个做菜视频）。在线学习闭环：每次交互流入 Flink → 实时更新用户状态（Kafka → 用户 embedding 存储）。讨论冷启动、缓存层级、A/B 框架、推理延迟预算。

**标签：** #system-design

---

### 10. 设计 TikTok 视频上传 + 编码

**难度：** 困难
**主题：** system-design, video, blob-storage, encoding
**岗位：** 高级 SWE
**级别：** 5+

**问题：** 设计 TikTok 的上传 + 编码管道。用户录了一段 60s 竖屏视频并发布；它如何能在数秒内全球可播放？

**思路：** 客户端通过可断点续传的分片上传到最近的边缘（区域 ingest）。原文件存冷 blob；转码任务入队。转码集群（自动扩缩，部分编解码上 GPU）生成多码率（HLS 分片）。提取缩略图。并行做 ML 审核（NSFW 分类器、版权音频识别）。元数据 + URL 写入分片 DB。对高互动创作者预热 CDN（推到目标地区 PoP）。讨论：分片并行编码降低延迟、编码失败的兜底、视频只有审核通过后才进入推荐候选池。

**标签：** #system-design

---

### 11. 设计实时评论 / 弹幕系统

**难度：** 困难
**主题：** system-design, websockets, pub-sub, fanout
**岗位：** 高级 SWE
**级别：** 5+

**问题：** 设计抖音直播中用的弹幕（在视频上滚动的实时评论）系统。

**思路：** 观众通过 WebSocket 连到边缘网关（按 stream_id 分片）。评论发布 → 单直播 Kafka topic → 网关订阅并扇出给连接的观众。在大规模下（单流 1M+ 同时在线），采样/限速：不展示每一条，按代表性样本渲染。加垃圾过滤（同步 ML 评分 + 用户级限流）。异步持久化以便回放。讨论：单流热度激增时的背压（自动扩容网关）、客户端渲染性能（可见弹幕限制在每秒约 30 条）、用户自己的弹幕"保证可见"规则。

**标签：** #system-design

---

### 12. 设计分布式 ID 生成器（Snowflake 风格）

**难度：** 中等
**主题：** system-design, distributed, id-generation
**岗位：** SWE
**级别：** 2-3

**问题：** 设计一个超大规模下生成唯一、近似时间有序的 64-bit ID 的服务。

**思路：** Snowflake 格式：41 位时间戳（自 epoch 毫秒）+ 10 位机器 ID + 12 位序列号（每毫秒）。每机器每秒 4M ID，约 69 年后时间戳溢出。机器 ID 通过 ZooKeeper 或静态配置分配。时钟回拨处理：拒绝发号（或等到时钟追上）。讨论为什么近似单调对 B-tree 索引重要（避免末端热点插入 vs 随机散落的 ID）。

**标签：** #system-design

---

### 13. 设计飞书文档搜索

**难度：** 困难
**主题：** system-design, search, indexing, permissions
**岗位：** 高级 SWE
**级别：** 5+

**问题：** 设计飞书中跨用户有权访问的所有文档的搜索（每个企业可达数百万文档）。

**思路：** 倒排索引在 Elasticsearch 中按 tenant_id（企业）分片。文档编辑时入索引任务队列（最终一致 OK）。权限过滤：查询时做 ACL 检查（对打分结果后过滤，或在索引里预存"viewable_by_users" terms——查询速度与写放大间的权衡）。多语言分析器（中文用 jieba 或 HanLP，英文等用标准）。排序：BM25 + 新鲜度 + 用户互动信号。讨论：大文档处理（chunk + 聚合）、实时与近实时索引、单租户千万级文档的扩容（租户内多 shard）。

**标签：** #system-design

---

### 14. 设计直播平台

**难度：** 困难
**主题：** system-design, rtmp, hls, cdn, low-latency
**岗位：** 高级 SWE
**级别：** 5+

**问题：** 设计支持 10 万主播同时直播、单主播百万观众、端到端延迟 <3 秒的直播平台。

**思路：** 主播用 RTMP/SRT/WebRTC 推到最近的 ingest。转码生成 ABR 阶梯（240p → 1080p），用低延迟 HLS 或 LL-DASH 分片（0.5-1s）。通过 CDN + 源站防护分发。要做到 <3s 延迟，最后一公里优先 WebRTC（更复杂）或带部分分片的 LL-HLS。讨论：聊天/弹幕作为独立管道（见第 11 题）、互动功能（礼物、连麦）、内容的区域版权、滥用审核（实时 ASR + 帧采样分类器）。

**标签：** #system-design

---

### 15. 讲一次你比预期更快交付的经历

**难度：** 中等
**主题：** behavioral, speed, ownership
**岗位：** SWE
**级别：** 2-3

**问题：** 讲一次你上线比原估时间快得多的项目。你是怎么做到的？

**思路：** 字节的"速度"文化是核心。展示：(1) 你狠砍 v0 范围，(2) 你并行了工作或主动找帮助，(3) 你明确接受了部分技术债并有偿还计划，(4) 量化了影响和上市速度收益。避免"我加了周末班"——他们要的是聪明地框定范围，而不是堆时间。

**标签：** #behavioral

---

### 16. 端到端 own 项目的经历

**难度：** 中等
**主题：** behavioral, ownership, scope
**岗位：** 高级 SWE
**级别：** 5+

**问题：** 描述一个你 own 全生命周期——设计、实现、上线、监控——的项目。

**思路：** 展示：(1) 你定了技术方向（不是执行别人的），(2) 你主动与 PM/运维/设计协作，(3) 你上线后仍持续跟进——衡量成功、做复盘、规划 v2。加分：你后续以干净的文档和 on-call playbook 移交给他人。字节提拔能跨度 own 的多面手。

**标签：** #behavioral

---

### 17. 应对快速变化需求的经历

**难度：** 中等
**主题：** behavioral, ambiguity, adaptability
**岗位：** SWE
**级别：** 2-3

**问题：** 讲一次项目期间需求多次变更的经历。你怎么应对？

**思路：** 字节节奏快——pivot 是常态。展示：(1) 你没有每次都防御性地推回，(2) 你建立了让 pivot 成本低的抽象（模块化代码、feature flag），(3) 你用数据帮助 PM/领导理解每次变更的成本。避免抱怨内耗的故事——他们要适应力。

**标签：** #behavioral

---

### 18. 你为什么想加入字节 / TikTok

**难度：** 简单
**主题：** behavioral, motivation, fit
**岗位：** SWE
**级别：** 2-3

**问题：** 为什么字节？TikTok 哪点特别吸引你？

**思路：** 别只说"我常用 TikTok"。更好：(1) 被产品迭代速度震撼（举一个最近发布的具体功能），(2) 对大规模推荐系统感兴趣（算法很有名），(3) 全球化产品触达。提一句你读过的技术内容——一篇论文、关于 Monolith（他们的推荐框架）的博客。避谈政治。

**标签：** #behavioral

---

### 19. 推荐系统：协同过滤 vs 深度学习

**难度：** 困难
**主题：** recommendation, ml, ranking
**岗位：** 高级 SWE
**级别：** 5+

**问题：** 比较矩阵分解、双塔模型和排序 DNN 在信息流推荐系统中的使用。何时各用哪个？

**思路：** **矩阵分解**——简单、可解释、好基线。适合显式反馈（评分）。冷启动差。**双塔**——用户塔 + 物品塔基于正样本对（点击/观看）训练，ANN 服务。大规模检索/候选生成（百万级物品）的利器。特征交互有限。**排序 DNN**——重特征交叉（DCN、DeepFM）、多任务头（CTR、观看时长、分享）。在检索后的几百个候选上用。延迟高，难全量打分。现代栈：双塔检索 → DNN 排序 → 多样性重排。讨论冷启动（塔里加内容特征）和在线学习。

**标签：** #domain-knowledge

---

### 20. 视频编码权衡：H.264 vs H.265 vs AV1

**难度：** 中等
**主题：** video, encoding, codecs
**岗位：** 高级 SWE
**级别：** 5+

**问题：** TikTok 需要为全球视频分发选编码。讲讲 H.264、H.265 (HEVC)、VP9、AV1 之间的权衡。

**思路：** **H.264**——设备通用支持、编码器成熟、压缩中等。广覆盖默认选项。**H.265**——比 H.264 压缩好 30-50%，但专利费用混乱，Android <8 支持弱。**VP9**——Google 的免版税替代，类似 H.265，Chrome/Android 支持。**AV1**——压缩最优（比 VP9 好约 30%）、免版税，但编码 CPU 重（新芯片有硬解码但少有硬编码）。策略：阶梯编码多种 codec，根据客户端支持给最优。热门内容预编 AV1 省出网带宽；长尾只编 H.264 实时。讨论带宽节省 ROI vs 编码成本。

**标签：** #domain-knowledge

---

### 21. 最长连续序列

**难度：** 中等
**主题：** hash-set, arrays, union-find
**岗位：** SWE
**级别：** 2-1

**问题：** 给定一个未排序的整数数组 `nums`，O(n) 时间内返回数字连续的最长序列的长度。

**思路：** 把所有数放进 HashSet。对每个 num，只有当 `num - 1` 不在集合中（即它是连续段的起点）才开始计数；然后向 `num+1, num+2, ...` 走直到不在集合中。每个元素最多访问两次 → O(n)。Union-Find 变体也可。

**Python：**
```python
def longest_consecutive(nums: list[int]) -> int:
    s = set(nums)
    best = 0
    for x in s:
        if x - 1 in s:
            continue
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
    if (s.has(x - 1)) continue;
    let y = x;
    while (s.has(y + 1)) y++;
    best = Math.max(best, y - x + 1);
  }
  return best;
}
```

**Java：**
```java
import java.util.*;

int longestConsecutive(int[] nums) {
    Set<Integer> s = new HashSet<>();
    for (int x : nums) s.add(x);
    int best = 0;
    for (int x : s) {
        if (s.contains(x - 1)) continue;
        int y = x;
        while (s.contains(y + 1)) y++;
        best = Math.max(best, y - x + 1);
    }
    return best;
}
```

**要点：**
- 只从段的最小元素开始扩，整体保持 O(n) 工作量。
- 集合查找平均 O(1)。
- 集合天然去重。

**标签：** #algorithm

---

### 22. 两数之和

**难度：** 简单
**主题：** hash-map, arrays
**岗位：** SWE
**级别：** 2-1

**问题：** 给定一个整数数组 `nums` 和一个整数 `target`，返回和为 `target` 的两个数的下标。

**思路：** 一次遍历 HashMap，键是值，值是索引。对每个 `nums[i]`，查 `target - nums[i]` 是否在 map 中；在则返回两下标；否则插入 `nums[i] → i`。O(n) 时间/空间。字节追问：处理重复 / 返回所有对 / k-Sum 推广。

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
import java.util.*;

int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        int need = target - nums[i];
        if (seen.containsKey(need)) return new int[]{seen.get(need), i};
        seen.put(nums[i], i);
    }
    return new int[0];
}
```

**要点：**
- 哈希表把内层搜索从 O(n) 降到 O(1)。
- 先查后插，避免索引与自身配对。
- 适用于负数和重复值。

**标签：** #algorithm

---

### 23. 两数相加

**难度：** 中等
**主题：** linked-list, math
**岗位：** SWE
**级别：** 2-1

**问题：** 两个非空链表表示两个非负整数，数位以逆序存储。把两数相加，结果以链表返回。

**思路：** 同时遍历两个链表，维护 `carry`。每步新数位 = `(a + b + carry) % 10`，`carry = (a + b + carry) / 10`。用哑头。当任一链表非空或 `carry != 0` 时继续。O(max(m,n))。

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
        s = carry + (l1.val if l1 else 0) + (l2.val if l2 else 0)
        carry, d = divmod(s, 10)
        tail.next = ListNode(d)
        tail = tail.next
        if l1: l1 = l1.next
        if l2: l2 = l2.next
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
  let tail = dummy, carry = 0;
  while (l1 || l2 || carry) {
    const s = carry + (l1?.val ?? 0) + (l2?.val ?? 0);
    carry = Math.floor(s / 10);
    tail.next = new ListNode(s % 10);
    tail = tail.next;
    l1 = l1?.next ?? null;
    l2 = l2?.next ?? null;
  }
  return dummy.next;
}
```

**Java：**
```java
class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

ListNode addTwoNumbers(ListNode l1, ListNode l2) {
    ListNode dummy = new ListNode(), tail = dummy;
    int carry = 0;
    while (l1 != null || l2 != null || carry != 0) {
        int s = carry + (l1 != null ? l1.val : 0) + (l2 != null ? l2.val : 0);
        carry = s / 10;
        tail.next = new ListNode(s % 10);
        tail = tail.next;
        if (l1 != null) l1 = l1.next;
        if (l2 != null) l2 = l2.next;
    }
    return dummy.next;
}
```

**要点：**
- 循环条件必须包括 `carry` 以处理最后的进位位。
- 某一链表先结束时把缺失的位当 0。
- 输出同样是逆序数位。

**标签：** #algorithm

---

### 24. 无重复字符的最长子串

**难度：** 中等
**主题：** sliding-window, hash-map, strings
**岗位：** SWE
**级别：** 2-1

**问题：** 给定字符串 `s`，找出不含重复字符的最长子串的长度。

**思路：** 用 `char → 最近索引` 的 HashMap 做滑动窗口。右指针前移；若 `s[right]` 曾出现且其索引 >= `left`，则跳 `left = lastIndex + 1`。更新 map 与最大长度。O(n) 时间，O(min(n, alphabet)) 空间。

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
import java.util.*;

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
- 左指针只前进，绝不回退。
- map 存每个字符最近一次出现的索引。
- 窗口不变量：`s[l..r]` 全部字符不重复。

**标签：** #algorithm

---

### 25. 寻找两个正序数组的中位数

**难度：** 困难
**主题：** binary-search, arrays, divide-and-conquer
**岗位：** SWE
**级别：** 3-1

**问题：** 给定两个分别为 m、n 的有序数组 `nums1`、`nums2`，O(log(min(m,n))) 返回中位数。

**思路：** 在较短数组上二分一个切分位置，使 `max(leftA, leftB) <= min(rightA, rightB)`。根据比较调整位置。中位数 = 两中值的平均（总长偶）或左半的最大值（总长奇）。注意用 ±∞ 哨兵处理边界。

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
        a_left = a[i - 1] if i > 0 else float("-inf")
        a_right = a[i] if i < m else float("inf")
        b_left = b[j - 1] if j > 0 else float("-inf")
        b_right = b[j] if j < n else float("inf")
        if a_left <= b_right and b_left <= a_right:
            if (m + n) % 2:
                return float(max(a_left, b_left))
            return (max(a_left, b_left) + min(a_right, b_right)) / 2
        elif a_left > b_right:
            hi = i - 1
        else:
            lo = i + 1
    return 0.0
```

**TypeScript：**
```typescript
function findMedianSortedArrays(a: number[], b: number[]): number {
  if (a.length > b.length) [a, b] = [b, a];
  const m = a.length, n = b.length;
  const half = (m + n + 1) >> 1;
  let lo = 0, hi = m;
  while (lo <= hi) {
    const i = (lo + hi) >> 1;
    const j = half - i;
    const aL = i > 0 ? a[i - 1] : -Infinity;
    const aR = i < m ? a[i] : Infinity;
    const bL = j > 0 ? b[j - 1] : -Infinity;
    const bR = j < n ? b[j] : Infinity;
    if (aL <= bR && bL <= aR) {
      if ((m + n) % 2) return Math.max(aL, bL);
      return (Math.max(aL, bL) + Math.min(aR, bR)) / 2;
    } else if (aL > bR) hi = i - 1;
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
        int aL = i > 0 ? a[i - 1] : Integer.MIN_VALUE;
        int aR = i < m ? a[i] : Integer.MAX_VALUE;
        int bL = j > 0 ? b[j - 1] : Integer.MIN_VALUE;
        int bR = j < n ? b[j] : Integer.MAX_VALUE;
        if (aL <= bR && bL <= aR) {
            if (((m + n) & 1) == 1) return Math.max(aL, bL);
            return (Math.max(aL, bL) + Math.min(aR, bR)) / 2.0;
        } else if (aL > bR) hi = i - 1;
        else lo = i + 1;
    }
    return 0.0;
}
```

**要点：**
- 始终在较短数组上二分，把复杂度控制在 O(log(min(m, n)))。
- 用 `±Infinity` 哨兵避免边界特判。
- 总长奇偶决定是否取两中值的平均。

**标签：** #algorithm

---

### 26. 最长回文子串

**难度：** 中等
**主题：** dp, strings, two-pointers
**岗位：** SWE
**级别：** 2-1

**问题：** 给定字符串 `s`，返回最长的回文子串。

**思路：** 中心扩展：每个下标既作为奇数长中心，也把 i 与 i+1 作为偶数长中心；只要字符匹配就扩展，记录最大。O(n²) 时间、O(1) 空间。Manacher 给出 O(n) 作为追问。

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
String longestPalindrome(String s) {
    int bl = 0, br = 0;
    for (int i = 0; i < s.length(); i++) {
        int[] a = grow(s, i, i), b = grow(s, i, i + 1);
        if (a[1] - a[0] > br - bl) { bl = a[0]; br = a[1]; }
        if (b[1] - b[0] > br - bl) { bl = b[0]; br = b[1]; }
    }
    return s.substring(bl, br + 1);
}

int[] grow(String s, int l, int r) {
    while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) { l--; r++; }
    return new int[]{l + 1, r - 1};
}
```

**要点：**
- 每个下标都要尝试奇数和偶数两种中心。
- 用长度差比较，避免反复切片。
- Manacher 可得 O(n)，但面试中很少强求。

**标签：** #algorithm

---

### 27. 盛最多水的容器

**难度：** 中等
**主题：** two-pointers, greedy, arrays
**岗位：** SWE
**级别：** 2-1

**问题：** 给定 `n` 个非负整数 `height[i]`，找出与 x 轴构成容器、能装最多水的两条线。

**思路：** 首尾双指针。面积 = `min(h[l], h[r]) * (r - l)`。把较矮的那侧向中间移动（移较高侧宽度变小、面积不可能更大）。O(n)。

**Python：**
```python
def max_area(height: list[int]) -> int:
    l, r = 0, len(height) - 1
    best = 0
    while l < r:
        best = max(best, (r - l) * min(height[l], height[r]))
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
    const h = Math.min(height[l], height[r]);
    best = Math.max(best, (r - l) * h);
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
        int h = Math.min(height[l], height[r]);
        best = Math.max(best, (r - l) * h);
        if (height[l] < height[r]) l++; else r--;
    }
    return best;
}
```

**要点：**
- 移动较高侧绝不会让面积变大。
- 宽度每步都减少，所以只有更高才有机会更优。
- 相等时移哪一侧都可以。

**标签：** #algorithm

---

### 28. 三数之和

**难度：** 中等
**主题：** two-pointers, sorting, arrays
**岗位：** SWE
**级别：** 2-1

**问题：** 给定整数数组 `nums`，返回所有满足 `a + b + c == 0` 的不重复三元组 `[a, b, c]`。

**思路：** 排序。固定 `i`，在剩余部分用双指针（`l = i+1`、`r = n-1`）。对 `i`、`l`、`r` 都跳过重复以避免重复结果。O(n²) 时间、O(1) 额外空间。字节经典开场题。

**Python：**
```python
def three_sum(nums: list[int]) -> list[list[int]]:
    nums.sort()
    out: list[list[int]] = []
    for i in range(len(nums) - 2):
        if i and nums[i] == nums[i - 1]:
            continue
        l, r = i + 1, len(nums) - 1
        while l < r:
            s = nums[i] + nums[l] + nums[r]
            if s < 0:
                l += 1
            elif s > 0:
                r -= 1
            else:
                out.append([nums[i], nums[l], nums[r]])
                l += 1
                r -= 1
                while l < r and nums[l] == nums[l - 1]:
                    l += 1
                while l < r and nums[r] == nums[r + 1]:
                    r -= 1
    return out
```

**TypeScript：**
```typescript
function threeSum(nums: number[]): number[][] {
  nums.sort((a, b) => a - b);
  const out: number[][] = [];
  for (let i = 0; i < nums.length - 2; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue;
    let l = i + 1, r = nums.length - 1;
    while (l < r) {
      const s = nums[i] + nums[l] + nums[r];
      if (s < 0) l++;
      else if (s > 0) r--;
      else {
        out.push([nums[i], nums[l], nums[r]]);
        l++; r--;
        while (l < r && nums[l] === nums[l - 1]) l++;
        while (l < r && nums[r] === nums[r + 1]) r--;
      }
    }
  }
  return out;
}
```

**Java：**
```java
import java.util.*;

List<List<Integer>> threeSum(int[] nums) {
    Arrays.sort(nums);
    List<List<Integer>> out = new ArrayList<>();
    for (int i = 0; i < nums.length - 2; i++) {
        if (i > 0 && nums[i] == nums[i - 1]) continue;
        int l = i + 1, r = nums.length - 1;
        while (l < r) {
            int s = nums[i] + nums[l] + nums[r];
            if (s < 0) l++;
            else if (s > 0) r--;
            else {
                out.add(List.of(nums[i], nums[l], nums[r]));
                l++; r--;
                while (l < r && nums[l] == nums[l - 1]) l++;
                while (l < r && nums[r] == nums[r + 1]) r--;
            }
        }
    }
    return out;
}
```

**要点：**
- 排序同时让双指针和去重成为可能。
- 在固定 i 处和每次命中后都要跳过重复。
- `nums[i] > 0` 时可提前 break 进一步加速。

**标签：** #algorithm

---

### 29. 电话号码的字母组合

**难度：** 中等
**主题：** backtracking, recursion, strings
**岗位：** SWE
**级别：** 2-1

**问题：** 给定 2-9 的数字字符串，返回所有可能的字母组合（电话键盘映射）。

**思路：** 回溯，映射 `'2' → "abc"` 等。逐位递归，追加一个字符，递归，回退。最坏 O(4^n · n)。也可用 BFS 在结果列表上迭代。

**Python：**
```python
def letter_combinations(digits: str) -> list[str]:
    if not digits:
        return []
    table = {"2": "abc", "3": "def", "4": "ghi", "5": "jkl",
             "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz"}
    out: list[str] = []
    buf: list[str] = []
    def back(i: int) -> None:
        if i == len(digits):
            out.append("".join(buf))
            return
        for c in table[digits[i]]:
            buf.append(c)
            back(i + 1)
            buf.pop()
    back(0)
    return out
```

**TypeScript：**
```typescript
function letterCombinations(digits: string): string[] {
  if (!digits) return [];
  const table: Record<string, string> = {
    "2": "abc", "3": "def", "4": "ghi", "5": "jkl",
    "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz",
  };
  const out: string[] = [];
  const buf: string[] = [];
  const back = (i: number): void => {
    if (i === digits.length) { out.push(buf.join("")); return; }
    for (const c of table[digits[i]]) {
      buf.push(c);
      back(i + 1);
      buf.pop();
    }
  };
  back(0);
  return out;
}
```

**Java：**
```java
import java.util.*;

List<String> letterCombinations(String digits) {
    List<String> out = new ArrayList<>();
    if (digits.isEmpty()) return out;
    String[] table = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};
    back(digits, 0, new StringBuilder(), table, out);
    return out;
}

void back(String digits, int i, StringBuilder buf, String[] table, List<String> out) {
    if (i == digits.length()) { out.add(buf.toString()); return; }
    for (char c : table[digits.charAt(i) - '0'].toCharArray()) {
        buf.append(c);
        back(digits, i + 1, buf, table, out);
        buf.deleteCharAt(buf.length() - 1);
    }
}
```

**要点：**
- 输出规模为各位映射长度之积，最多 4^n。
- 可变缓冲 + pop 比反复构造字符串更干净。
- 空输入返回空列表，而非 `[""]`。

**标签：** #algorithm

---

### 30. 括号生成

**难度：** 中等
**主题：** backtracking, recursion, strings
**岗位：** SWE
**级别：** 2-1

**问题：** 给定 `n` 对括号，生成所有合法括号组合。

**思路：** 用计数 `open`、`close` 回溯。`open < n` 时可加 `(`；`close < open` 时可加 `)`。长度到 2n 时停。结果数为卡特兰数 C(n)。

**Python：**
```python
def generate_parenthesis(n: int) -> list[str]:
    out: list[str] = []
    def back(buf: str, op: int, cl: int) -> None:
        if len(buf) == 2 * n:
            out.append(buf)
            return
        if op < n:
            back(buf + "(", op + 1, cl)
        if cl < op:
            back(buf + ")", op, cl + 1)
    back("", 0, 0)
    return out
```

**TypeScript：**
```typescript
function generateParenthesis(n: number): string[] {
  const out: string[] = [];
  const back = (buf: string, op: number, cl: number): void => {
    if (buf.length === 2 * n) { out.push(buf); return; }
    if (op < n) back(buf + "(", op + 1, cl);
    if (cl < op) back(buf + ")", op, cl + 1);
  };
  back("", 0, 0);
  return out;
}
```

**Java：**
```java
import java.util.*;

List<String> generateParenthesis(int n) {
    List<String> out = new ArrayList<>();
    back(new StringBuilder(), 0, 0, n, out);
    return out;
}

void back(StringBuilder buf, int op, int cl, int n, List<String> out) {
    if (buf.length() == 2 * n) { out.add(buf.toString()); return; }
    if (op < n) { buf.append('('); back(buf, op + 1, cl, n, out); buf.deleteCharAt(buf.length() - 1); }
    if (cl < op) { buf.append(')'); back(buf, op, cl + 1, n, out); buf.deleteCharAt(buf.length() - 1); }
}
```

**要点：**
- `op < n` 与 `cl < op` 两个剪枝保证合法。
- 输出规模为第 n 个卡特兰数。
- 每条路径独立，字符串拼接无副作用。

**标签：** #algorithm

---

### 31. 合并 K 个升序链表

**难度：** 困难
**主题：** heap, linked-list, divide-and-conquer
**岗位：** SWE
**级别：** 2-2

**问题：** 给定 `k` 个升序链表的数组，合并为一个升序链表。

**思路：** 大小为 k 的最小堆，保存每个链表当前头。弹最小、追加到结果、把它的 `next` 入堆。O(N log k)。或者分治两两合并——同复杂度，实践常更快。

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
  const mergeTwo = (a: ListNode | null, b: ListNode | null): ListNode | null => {
    const d = new ListNode(); let t = d;
    while (a && b) {
      if (a.val <= b.val) { t.next = a; a = a.next; }
      else { t.next = b; b = b.next; }
      t = t.next!;
    }
    t.next = a ?? b;
    return d.next;
  };
  if (lists.length === 0) return null;
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
import java.util.*;

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
- 元组中的索引作为 tiebreaker，避免堆比较节点本身。
- 分治两两合并同样达到 O(N log k)，无需堆。
- 堆中元素数始终不超过 k。

**标签：** #algorithm

---

### 32. 接雨水

**难度：** 困难
**主题：** two-pointers, dp, monotonic-stack
**岗位：** SWE
**级别：** 2-2

**问题：** 给定 `n` 个非负整数表示高度图，求下雨后能接的雨水量。

**思路：** 双指针 `l, r`，维护 `leftMax, rightMax`。较小的一侧是瓶颈：该位置积水 = `sideMax - height`，将指针向中间移。O(n) 时间、O(1) 空间。单调栈解法亦为经典。

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
int trap(int[] height) {
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
- 较低一侧的运行最大值必然封顶水位。
- 永远移动较低柱所在的那个指针。
- O(1) 额外空间，无需前后缀数组。

**标签：** #algorithm

---

### 33. 全排列

**难度：** 中等
**主题：** backtracking, recursion, arrays
**岗位：** SWE
**级别：** 2-1

**问题：** 给定一个无重复整数数组 `nums`，返回所有可能的排列。

**思路：** 回溯 + `used[]` 布尔数组（或原地交换）。挑一个未用元素、递归、解除标记。O(n · n!)。追问：全排列 II 含重复——排序后跳过 `nums[i] == nums[i-1] && !used[i-1]`。

**Python：**
```python
def permute(nums: list[int]) -> list[list[int]]:
    out: list[list[int]] = []
    used = [False] * len(nums)
    cur: list[int] = []
    def back() -> None:
        if len(cur) == len(nums):
            out.append(cur[:])
            return
        for i, x in enumerate(nums):
            if used[i]:
                continue
            used[i] = True
            cur.append(x)
            back()
            cur.pop()
            used[i] = False
    back()
    return out
```

**TypeScript：**
```typescript
function permute(nums: number[]): number[][] {
  const out: number[][] = [];
  const used = new Array(nums.length).fill(false);
  const cur: number[] = [];
  const back = (): void => {
    if (cur.length === nums.length) { out.push([...cur]); return; }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      cur.push(nums[i]);
      back();
      cur.pop();
      used[i] = false;
    }
  };
  back();
  return out;
}
```

**Java：**
```java
import java.util.*;

List<List<Integer>> permute(int[] nums) {
    List<List<Integer>> out = new ArrayList<>();
    back(nums, new boolean[nums.length], new ArrayList<>(), out);
    return out;
}

void back(int[] nums, boolean[] used, List<Integer> cur, List<List<Integer>> out) {
    if (cur.size() == nums.length) { out.add(new ArrayList<>(cur)); return; }
    for (int i = 0; i < nums.length; i++) {
        if (used[i]) continue;
        used[i] = true;
        cur.add(nums[i]);
        back(nums, used, cur, out);
        cur.remove(cur.size() - 1);
        used[i] = false;
    }
}
```

**要点：**
- 总工作量 O(n · n!)，因为复制每个排列要 n。
- 用 `used` 数组避免 O(n) 的存在性检查。
- 原地交换版本可省去 `used`。

**标签：** #algorithm

---

### 34. 旋转图像

**难度：** 中等
**主题：** matrix, math, in-place
**岗位：** SWE
**级别：** 2-1

**问题：** 原地将 n×n 矩阵顺时针旋转 90 度。

**思路：** 先转置（对 `j > i` 交换 `m[i][j]` 与 `m[j][i]`），再每行反转。等价于在同心方环上四角同时旋转。O(n²)、O(1) 额外空间。

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
void rotate(int[][] matrix) {
    int n = matrix.length;
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            int tmp = matrix[i][j];
            matrix[i][j] = matrix[j][i];
            matrix[j][i] = tmp;
        }
    }
    for (int[] row : matrix) {
        for (int l = 0, r = n - 1; l < r; l++, r--) {
            int t = row[l]; row[l] = row[r]; row[r] = t;
        }
    }
}
```

**要点：**
- 转置 + 水平翻转等价于顺时针旋转 90 度。
- 转置时只遍历上三角避免重复交换。
- O(1) 额外空间，全程原地。

**标签：** #algorithm

---

### 35. 字母异位词分组

**难度：** 中等
**主题：** hash-map, strings, sorting
**岗位：** SWE
**级别：** 2-1

**问题：** 给定字符串数组，把字母异位词分组。

**思路：** HashMap 以"排序后的字符串"（或长度 26 的计数元组）为键。对每个词计算规范键并加入对应桶。排序键 O(N · K log K)；计数键 O(N · K)。

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
import java.util.*;

List<List<String>> groupAnagrams(String[] strs) {
    Map<String, List<String>> groups = new HashMap<>();
    for (String s : strs) {
        char[] a = s.toCharArray();
        Arrays.sort(a);
        groups.computeIfAbsent(new String(a), k -> new ArrayList<>()).add(s);
    }
    return new ArrayList<>(groups.values());
}
```

**要点：**
- 排序后的字符串是最简单的规范形式。
- 长度 26 的计数向量为键可省掉排序。
- 输出分组顺序不强制。

**标签：** #algorithm

---

### 36. Pow(x, n)

**难度：** 中等
**主题：** math, recursion, binary-exponentiation
**岗位：** SWE
**级别：** 2-1

**问题：** 不使用内置幂函数实现 `pow(x, n)`（x^n）。

**思路：** 快速幂：若 n 负，则 x 取倒数、n 取反（小心 `INT_MIN`）。递归 `half = pow(x, n/2)`；结果 = `half*half`（n 为奇数再 `*x`）。O(log n)。

**Python：**
```python
def my_pow(x: float, n: int) -> float:
    if n < 0:
        x = 1 / x
        n = -n
    result = 1.0
    base = x
    while n > 0:
        if n & 1:
            result *= base
        base *= base
        n >>= 1
    return result
```

**TypeScript：**
```typescript
function myPow(x: number, n: number): number {
  if (n < 0) { x = 1 / x; n = -n; }
  let result = 1, base = x;
  while (n > 0) {
    if (n & 1) result *= base;
    base *= base;
    n = Math.floor(n / 2);
  }
  return result;
}
```

**Java：**
```java
double myPow(double x, int n) {
    long m = n;
    if (m < 0) { x = 1 / x; m = -m; }
    double result = 1.0, base = x;
    while (m > 0) {
        if ((m & 1) == 1) result *= base;
        base *= base;
        m >>= 1;
    }
    return result;
}
```

**要点：**
- 迭代版二进制快速幂避免递归栈。
- 在最开始一次性处理负 n。
- 每次迭代把 n 减半，乘法次数 O(log |n|)。

**标签：** #algorithm

---

### 37. N 皇后

**难度：** 困难
**主题：** backtracking, recursion
**岗位：** SWE
**级别：** 2-2

**问题：** 在 n×n 棋盘上放 `n` 个皇后，使彼此不互相攻击。返回所有不同解。

**思路：** 按行回溯。维护三个集合：已占列、"/"对角线（`row + col`）、"\"对角线（`row - col`）。当前行枚举无冲突的列、递归、回退。O(n!)。

**Python：**
```python
def solve_n_queens(n: int) -> list[list[str]]:
    out: list[list[str]] = []
    cols: set[int] = set()
    diag1: set[int] = set()
    diag2: set[int] = set()
    placement: list[int] = []
    def back(r: int) -> None:
        if r == n:
            out.append(["." * c + "Q" + "." * (n - c - 1) for c in placement])
            return
        for c in range(n):
            if c in cols or (r + c) in diag1 or (r - c) in diag2:
                continue
            cols.add(c); diag1.add(r + c); diag2.add(r - c)
            placement.append(c)
            back(r + 1)
            placement.pop()
            cols.remove(c); diag1.remove(r + c); diag2.remove(r - c)
    back(0)
    return out
```

**TypeScript：**
```typescript
function solveNQueens(n: number): string[][] {
  const out: string[][] = [];
  const cols = new Set<number>();
  const d1 = new Set<number>();
  const d2 = new Set<number>();
  const placement: number[] = [];
  const back = (r: number): void => {
    if (r === n) {
      out.push(placement.map(c => ".".repeat(c) + "Q" + ".".repeat(n - c - 1)));
      return;
    }
    for (let c = 0; c < n; c++) {
      if (cols.has(c) || d1.has(r + c) || d2.has(r - c)) continue;
      cols.add(c); d1.add(r + c); d2.add(r - c);
      placement.push(c);
      back(r + 1);
      placement.pop();
      cols.delete(c); d1.delete(r + c); d2.delete(r - c);
    }
  };
  back(0);
  return out;
}
```

**Java：**
```java
import java.util.*;

List<List<String>> solveNQueens(int n) {
    List<List<String>> out = new ArrayList<>();
    Set<Integer> cols = new HashSet<>(), d1 = new HashSet<>(), d2 = new HashSet<>();
    List<Integer> placement = new ArrayList<>();
    back(0, n, cols, d1, d2, placement, out);
    return out;
}

void back(int r, int n, Set<Integer> cols, Set<Integer> d1, Set<Integer> d2, List<Integer> placement, List<List<String>> out) {
    if (r == n) {
        List<String> board = new ArrayList<>();
        for (int c : placement) board.add(".".repeat(c) + "Q" + ".".repeat(n - c - 1));
        out.add(board);
        return;
    }
    for (int c = 0; c < n; c++) {
        if (cols.contains(c) || d1.contains(r + c) || d2.contains(r - c)) continue;
        cols.add(c); d1.add(r + c); d2.add(r - c);
        placement.add(c);
        back(r + 1, n, cols, d1, d2, placement, out);
        placement.remove(placement.size() - 1);
        cols.remove(c); d1.remove(r + c); d2.remove(r - c);
    }
}
```

**要点：**
- `r + c` 与 `r - c` 唯一标识两族对角线。
- 递归深度天然保证每行恰放一个皇后。
- 集合查重 O(1)。

**标签：** #algorithm

---

### 38. 螺旋矩阵

**难度：** 中等
**主题：** matrix, simulation
**岗位：** SWE
**级别：** 2-1

**问题：** 给定 m×n 矩阵，按螺旋顺序返回所有元素。

**思路：** 维护四个边界 `top, bottom, left, right`。顶行 L→R（top++），右列 T→B（right--），若 top<=bottom 走底行 R→L（bottom--），若 left<=right 走左列 B→T（left++）。边界有效时循环。O(m·n)。

**Python：**
```python
def spiral_order(matrix: list[list[int]]) -> list[int]:
    out: list[int] = []
    top, bottom = 0, len(matrix) - 1
    left, right = 0, len(matrix[0]) - 1
    while top <= bottom and left <= right:
        for c in range(left, right + 1):
            out.append(matrix[top][c])
        top += 1
        for r in range(top, bottom + 1):
            out.append(matrix[r][right])
        right -= 1
        if top <= bottom:
            for c in range(right, left - 1, -1):
                out.append(matrix[bottom][c])
            bottom -= 1
        if left <= right:
            for r in range(bottom, top - 1, -1):
                out.append(matrix[r][left])
            left += 1
    return out
```

**TypeScript：**
```typescript
function spiralOrder(matrix: number[][]): number[] {
  const out: number[] = [];
  let top = 0, bottom = matrix.length - 1;
  let left = 0, right = matrix[0].length - 1;
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) out.push(matrix[top][c]);
    top++;
    for (let r = top; r <= bottom; r++) out.push(matrix[r][right]);
    right--;
    if (top <= bottom) {
      for (let c = right; c >= left; c--) out.push(matrix[bottom][c]);
      bottom--;
    }
    if (left <= right) {
      for (let r = bottom; r >= top; r--) out.push(matrix[r][left]);
      left++;
    }
  }
  return out;
}
```

**Java：**
```java
import java.util.*;

List<Integer> spiralOrder(int[][] matrix) {
    List<Integer> out = new ArrayList<>();
    int top = 0, bottom = matrix.length - 1;
    int left = 0, right = matrix[0].length - 1;
    while (top <= bottom && left <= right) {
        for (int c = left; c <= right; c++) out.add(matrix[top][c]);
        top++;
        for (int r = top; r <= bottom; r++) out.add(matrix[r][right]);
        right--;
        if (top <= bottom) {
            for (int c = right; c >= left; c--) out.add(matrix[bottom][c]);
            bottom--;
        }
        if (left <= right) {
            for (int r = bottom; r >= top; r--) out.add(matrix[r][left]);
            left++;
        }
    }
    return out;
}
```

**要点：**
- 走底行和左列前重新检查边界，处理单行/单列情况。
- 每个单元格恰被访问一次。
- 四边界法适用于任意矩形。

**标签：** #algorithm

---

### 39. 合并区间

**难度：** 中等
**主题：** sorting, intervals, arrays
**岗位：** SWE
**级别：** 2-1

**问题：** 给定区间数组 `[start, end]`，合并所有重叠区间。

**思路：** 按起点排序。遍历；若当前与上一个已合并的有重叠（`cur.start <= last.end`），则 `last.end = max(last.end, cur.end)`；否则追加。O(n log n)。

**Python：**
```python
def merge(intervals: list[list[int]]) -> list[list[int]]:
    intervals.sort(key=lambda x: x[0])
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
import java.util.*;

int[][] merge(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
    List<int[]> out = new ArrayList<>();
    for (int[] cur : intervals) {
        if (!out.isEmpty() && cur[0] <= out.get(out.size() - 1)[1]) {
            out.get(out.size() - 1)[1] = Math.max(out.get(out.size() - 1)[1], cur[1]);
        } else {
            out.add(new int[]{cur[0], cur[1]});
        }
    }
    return out.toArray(new int[0][]);
}
```

**要点：**
- 主导复杂度是 O(n log n) 的排序。
- 比较时用最后一个已追加段的末端，而非原始末端。
- 这里把首尾相接（`s == last.end`）也视为重叠。

**标签：** #algorithm

---

### 40. 最小覆盖子串

**难度：** 困难
**主题：** sliding-window, hash-map, strings
**岗位：** SWE
**级别：** 2-2

**问题：** 给定字符串 `s` 和 `t`，返回 `s` 中包含 `t` 所有字符（含重数）的最小子串。

**思路：** 滑窗 + `need[]` 计数 + `matched` 计数器。右扩；当所有字符满足时，左缩到刚好满足的临界，跟踪最小。O(|s| + |t|)。

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
    formed = 0
    l = 0
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
import java.util.*;

String minWindow(String s, String t) {
    if (t.isEmpty() || s.length() < t.length()) return "";
    Map<Character, Integer> need = new HashMap<>(), have = new HashMap<>();
    for (char c : t.toCharArray()) need.merge(c, 1, Integer::sum);
    int required = need.size(), formed = 0, l = 0;
    int bestLen = -1, bl = 0, br = 0;
    for (int r = 0; r < s.length(); r++) {
        char c = s.charAt(r);
        have.merge(c, 1, Integer::sum);
        if (need.containsKey(c) && have.get(c).equals(need.get(c))) formed++;
        while (formed == required) {
            if (bestLen == -1 || r - l + 1 < bestLen) { bestLen = r - l + 1; bl = l; br = r; }
            char lc = s.charAt(l);
            have.merge(lc, -1, Integer::sum);
            if (need.containsKey(lc) && have.get(lc) < need.get(lc)) formed--;
            l++;
        }
    }
    return bestLen == -1 ? "" : s.substring(bl, br + 1);
}
```

**要点：**
- `formed` 统计已满足所需数量的字符种类数。
- 一旦窗口合法就尝试收缩，找更小的解。
- 严格相等的判定避免重复增减。

**标签：** #algorithm

---

### 41. 柱状图中最大的矩形

**难度：** 困难
**主题：** monotonic-stack, arrays
**岗位：** SWE
**级别：** 2-2

**问题：** 给定柱状图各柱高度，求最大的矩形面积。

**思路：** 单调递增索引栈。`heights[i] >= heights[栈顶]` 则入栈；否则弹栈，对每个弹出柱计算面积 `h * (i - 新栈顶 - 1)`。末尾追加哨兵 0 以清空栈。O(n)。

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
      const width = stack.length === 0 ? i : i - stack[stack.length - 1] - 1;
      best = Math.max(best, h[top] * width);
    }
    stack.push(i);
  }
  return best;
}
```

**Java：**
```java
import java.util.*;

int largestRectangleArea(int[] heights) {
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
- 末尾哨兵 0 把残留栈元素清空。
- 宽度受限于左边的前一个更小元素和右边的当前 i。
- 每个索引最多入栈出栈一次，O(n)。

**标签：** #algorithm

---

### 42. 最大矩形

**难度：** 困难
**主题：** dp, monotonic-stack, matrix
**岗位：** SWE
**级别：** 3-1

**问题：** 给定由 '0' 和 '1' 组成的二维二值矩阵，找只含 1 的最大矩形。

**思路：** 对每行构造"以该行结尾的连续 1 的列高"直方图。对每行高度跑"柱状图中最大矩形"。取所有行的最大。O(m·n)。

**Python：**
```python
def maximal_rectangle(matrix: list[list[str]]) -> int:
    if not matrix or not matrix[0]:
        return 0
    cols = len(matrix[0])
    heights = [0] * cols
    best = 0
    for row in matrix:
        for j in range(cols):
            heights[j] = heights[j] + 1 if row[j] == "1" else 0
        best = max(best, largest_rectangle_area(heights))
    return best
```

**TypeScript：**
```typescript
function maximalRectangle(matrix: string[][]): number {
  if (matrix.length === 0 || matrix[0].length === 0) return 0;
  const cols = matrix[0].length;
  const heights = new Array(cols).fill(0);
  let best = 0;
  for (const row of matrix) {
    for (let j = 0; j < cols; j++) {
      heights[j] = row[j] === "1" ? heights[j] + 1 : 0;
    }
    best = Math.max(best, largestRectangleArea(heights));
  }
  return best;
}
```

**Java：**
```java
int maximalRectangle(char[][] matrix) {
    if (matrix.length == 0 || matrix[0].length == 0) return 0;
    int cols = matrix[0].length;
    int[] heights = new int[cols];
    int best = 0;
    for (char[] row : matrix) {
        for (int j = 0; j < cols; j++) {
            heights[j] = row[j] == '1' ? heights[j] + 1 : 0;
        }
        best = Math.max(best, largestRectangleArea(heights));
    }
    return best;
}
```

**要点：**
- 每行调用一次"柱状图最大矩形"复用解法。
- 高度记录截止当前行的连续 1 数量。
- 总开销 O(m * n)，内层调用 O(cols)。

**标签：** #algorithm

---

### 43. 单词拆分

**难度：** 中等
**主题：** dp, strings, hash-set
**岗位：** SWE
**级别：** 2-1

**问题：** 给定字符串 `s` 和词典 `wordDict`，判断 `s` 能否被切成空格分隔的词典单词序列。

**思路：** 一维 DP。`dp[i]` = `s[:i]` 能否被切。`dp[0] = true`。`dp[i] = any(dp[j] && s[j:i] 在词典中)`，`j < i`。哈希查表 O(n² · L)；Trie 可加速子串检查。

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
  const dp = new Array(n + 1).fill(false);
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
import java.util.*;

boolean wordBreak(String s, List<String> wordDict) {
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
- DP 状态表示"前 i 个字符可被切分"。
- 内层 break 在首个可行切分处短路。
- 用 Trie 或按最大词长限制 j 可进一步加速。

**标签：** #algorithm

---

### 44. 单词拆分 II

**难度：** 困难
**主题：** dp, backtracking, strings, memoization
**岗位：** SWE
**级别：** 3-1

**问题：** 类似单词拆分，但返回 `s` 的所有可能切分句子。

**思路：** 记忆化 DFS：`solve(i)` 返回 `s[i:]` 的句子列表。对从 `i` 开始且在词典中的每个单词，递归 `solve(i + len(word))` 并把单词前置。按下标缓存。最坏输出指数级；记忆化避免重复计算。

**Python：**
```python
from functools import lru_cache

def word_break_ii(s: str, word_dict: list[str]) -> list[str]:
    words = set(word_dict)
    @lru_cache(maxsize=None)
    def solve(i: int) -> list[str]:
        if i == len(s):
            return [""]
        out: list[str] = []
        for j in range(i + 1, len(s) + 1):
            piece = s[i:j]
            if piece in words:
                for suf in solve(j):
                    out.append(piece if not suf else piece + " " + suf)
        return out
    return solve(0)
```

**TypeScript：**
```typescript
function wordBreakII(s: string, wordDict: string[]): string[] {
  const words = new Set(wordDict);
  const memo = new Map<number, string[]>();
  const solve = (i: number): string[] => {
    if (i === s.length) return [""];
    if (memo.has(i)) return memo.get(i)!;
    const out: string[] = [];
    for (let j = i + 1; j <= s.length; j++) {
      const piece = s.slice(i, j);
      if (words.has(piece)) {
        for (const suf of solve(j)) {
          out.push(suf === "" ? piece : piece + " " + suf);
        }
      }
    }
    memo.set(i, out);
    return out;
  };
  return solve(0);
}
```

**Java：**
```java
import java.util.*;

List<String> wordBreakII(String s, List<String> wordDict) {
    Set<String> words = new HashSet<>(wordDict);
    Map<Integer, List<String>> memo = new HashMap<>();
    return solve(s, 0, words, memo);
}

List<String> solve(String s, int i, Set<String> words, Map<Integer, List<String>> memo) {
    if (memo.containsKey(i)) return memo.get(i);
    List<String> out = new ArrayList<>();
    if (i == s.length()) { out.add(""); return out; }
    for (int j = i + 1; j <= s.length(); j++) {
        String piece = s.substring(i, j);
        if (words.contains(piece)) {
            for (String suf : solve(s, j, words, memo)) {
                out.add(suf.isEmpty() ? piece : piece + " " + suf);
            }
        }
    }
    memo.put(i, out);
    return out;
}
```

**要点：**
- 按起始下标做记忆化，每个后缀只解一次。
- 基础情形返回 `[""]`，前置单词后即只含该词。
- 输出仍可指数级，记忆化只能复用共享子后缀。

**标签：** #algorithm

---

### 45. 环形链表 II

**难度：** 中等
**主题：** linked-list, two-pointers, floyd
**岗位：** SWE
**级别：** 2-1

**问题：** 给定链表，返回环开始的节点；若无环返回 null。

**思路：** Floyd 快慢指针。先以快慢相遇定位环内一点。再把一个指针放回 head，两指针每次走一步——它们在环入口相遇。O(n) 时间、O(1) 空间。

**Python：**
```python
def detect_cycle(head: ListNode | None) -> ListNode | None:
    slow = fast = head
    while fast and fast.next:
        slow = slow.next  # type: ignore
        fast = fast.next.next
        if slow is fast:
            p = head
            while p is not slow:
                p = p.next  # type: ignore
                slow = slow.next  # type: ignore
            return p
    return None
```

**TypeScript：**
```typescript
function detectCycle(head: ListNode | null): ListNode | null {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow!.next;
    fast = fast.next.next;
    if (slow === fast) {
      let p = head;
      while (p !== slow) { p = p!.next; slow = slow!.next; }
      return p;
    }
  }
  return null;
}
```

**Java：**
```java
ListNode detectCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) {
            ListNode p = head;
            while (p != slow) { p = p.next; slow = slow.next; }
            return p;
        }
    }
    return null;
}
```

**要点：**
- 数学：head 到环入口的距离 == 相遇点到环入口的距离（模环长）。
- 即使入口就是 head 也能正确处理。
- 第二段追赶至多一遍。

**标签：** #algorithm

---

### 46. 排序链表

**难度：** 中等
**主题：** linked-list, merge-sort, divide-and-conquer
**岗位：** SWE
**级别：** 2-2

**问题：** O(n log n) 时间、O(1) 额外空间（理想情况下）对链表排序。

**思路：** 链表归并排序。快慢指针找中点切分、两半递归、合并两个有序链表。O(n log n) 时间，O(log n) 栈。自底向上迭代归并可实现 O(1) 额外空间。

**Python：**
```python
def sort_list(head: ListNode | None) -> ListNode | None:
    if not head or not head.next:
        return head
    slow, fast = head, head.next
    while fast and fast.next:
        slow = slow.next  # type: ignore
        fast = fast.next.next
    mid = slow.next
    slow.next = None  # type: ignore
    left = sort_list(head)
    right = sort_list(mid)
    dummy = ListNode()
    tail = dummy
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
    tail = tail.next!;
  }
  tail.next = left ?? right;
  return dummy.next;
}
```

**Java：**
```java
ListNode sortList(ListNode head) {
    if (head == null || head.next == null) return head;
    ListNode slow = head, fast = head.next;
    while (fast != null && fast.next != null) { slow = slow.next; fast = fast.next.next; }
    ListNode mid = slow.next;
    slow.next = null;
    ListNode left = sortList(head), right = sortList(mid);
    ListNode dummy = new ListNode(), tail = dummy;
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
- 用 `slow, fast = head, head.next` 切分可避免长度为 2 时无限递归。
- 合并稳定，复杂度 O(n + m)。
- 自底向上迭代归并可实现 O(1) 额外空间。

**标签：** #algorithm

---

### 47. 乘积最大子数组

**难度：** 中等
**主题：** dp, arrays
**岗位：** SWE
**级别：** 2-1

**问题：** 给定整数数组 `nums`，找乘积最大的连续子数组。

**思路：** 同时维护 `maxProd` 和 `minProd`（负 × 负会互换）。对每个 num，`candidates = (num, num*maxProd, num*minProd)`；更新两者。再更新全局最优。O(n)。

**Python：**
```python
def max_product(nums: list[int]) -> int:
    hi = lo = best = nums[0]
    for x in nums[1:]:
        if x < 0:
            hi, lo = lo, hi
        hi = max(x, hi * x)
        lo = min(x, lo * x)
        best = max(best, hi)
    return best
```

**TypeScript：**
```typescript
function maxProduct(nums: number[]): number {
  let hi = nums[0], lo = nums[0], best = nums[0];
  for (let i = 1; i < nums.length; i++) {
    const x = nums[i];
    if (x < 0) { [hi, lo] = [lo, hi]; }
    hi = Math.max(x, hi * x);
    lo = Math.min(x, lo * x);
    best = Math.max(best, hi);
  }
  return best;
}
```

**Java：**
```java
int maxProduct(int[] nums) {
    int hi = nums[0], lo = nums[0], best = nums[0];
    for (int i = 1; i < nums.length; i++) {
        int x = nums[i];
        if (x < 0) { int t = hi; hi = lo; lo = t; }
        hi = Math.max(x, hi * x);
        lo = Math.min(x, lo * x);
        best = Math.max(best, hi);
    }
    return best;
}
```

**要点：**
- 遇到负数先交换 hi 和 lo 再更新。
- 0 会让 hi 和 lo 都重置为当前元素。
- 只跟踪 hi 会漏掉负负得正的情况。

**标签：** #algorithm

---

### 48. 最小栈

**难度：** 中等
**主题：** stack, design
**岗位：** SWE
**级别：** 2-1

**问题：** 设计一个支持 push、pop、top 和 O(1) 取最小值的栈。

**思路：** 双栈：主栈 + "最小"栈。push 时把 `min(val, minStack.top())` 也压入最小栈。pop 时同时弹两栈。最小栈栈顶即当前最小。每操作 O(1)。

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

    def get_min(self) -> int:
        return self.mins[-1]
```

**TypeScript：**
```typescript
class MinStack {
  private stack: number[] = [];
  private mins: number[] = [];
  push(val: number): void {
    this.stack.push(val);
    this.mins.push(this.mins.length === 0 ? val : Math.min(val, this.mins[this.mins.length - 1]));
  }
  pop(): void { this.stack.pop(); this.mins.pop(); }
  top(): number { return this.stack[this.stack.length - 1]; }
  getMin(): number { return this.mins[this.mins.length - 1]; }
}
```

**Java：**
```java
import java.util.*;

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
- 最小栈与主栈同长，更新 O(1)。
- 节省空间的变体只在严格更小时入最小栈。
- 四种操作均 O(1)。

**标签：** #algorithm

---

### 49. 寻找峰值

**难度：** 中等
**主题：** binary-search, arrays
**岗位：** SWE
**级别：** 2-1

**问题：** 峰值元素严格大于其邻居。给定相邻不等的数组 `nums`，O(log n) 找出任一峰值下标。

**思路：** 二分。在 `mid` 比较 `nums[mid]` 与 `nums[mid+1]`：若 `nums[mid] < nums[mid+1]`，峰值在右（`lo = mid + 1`）；否则在左或在 mid（`hi = mid`）。收敛到一个峰值。O(log n)。

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
- 相邻不等保证总有"上坡"方向。
- 循环结束时 `lo == hi`，即为峰值。
- 数组外可视为 `-inf` 哨兵。

**标签：** #algorithm

---

### 50. 打家劫舍 II

**难度：** 中等
**主题：** dp, arrays
**岗位：** SWE
**级别：** 2-1

**问题：** 房屋围成一圈（首末相邻）。求不相邻打劫的最大金额。

**思路：** 化归为打家劫舍 I 两次：一次在 `nums[0..n-2]`（去尾），一次在 `nums[1..n-1]`（去首）。取较大。O(n)。

**Python：**
```python
def rob(nums: list[int]) -> int:
    def line(arr: list[int]) -> int:
        prev = cur = 0
        for x in arr:
            prev, cur = cur, max(cur, prev + x)
        return cur
    if len(nums) == 1:
        return nums[0]
    return max(line(nums[:-1]), line(nums[1:]))
```

**TypeScript：**
```typescript
function rob(nums: number[]): number {
  const line = (arr: number[]): number => {
    let prev = 0, cur = 0;
    for (const x of arr) {
      const nxt = Math.max(cur, prev + x);
      prev = cur;
      cur = nxt;
    }
    return cur;
  };
  if (nums.length === 1) return nums[0];
  return Math.max(line(nums.slice(0, -1)), line(nums.slice(1)));
}
```

**Java：**
```java
int rob(int[] nums) {
    if (nums.length == 1) return nums[0];
    return Math.max(line(nums, 0, nums.length - 2), line(nums, 1, nums.length - 1));
}

int line(int[] nums, int lo, int hi) {
    int prev = 0, cur = 0;
    for (int i = lo; i <= hi; i++) {
        int nxt = Math.max(cur, prev + nums[i]);
        prev = cur;
        cur = nxt;
    }
    return cur;
}
```

**要点：**
- 用两次线性版本处理环形约束。
- 必须短路处理单户的边界。
- 时间 O(n)，每次运行额外空间 O(1)。

**标签：** #algorithm

---

### 51. 课程表

**难度：** 中等
**主题：** graph, topological-sort, bfs, dfs
**岗位：** SWE
**级别：** 2-1

**问题：** 给定 `numCourses` 与 `prerequisites[i] = [a, b]`（学 a 前必须学 b），判断能否修完所有课。

**思路：** 检测有向图中是否有环。Kahn BFS 拓扑排序：算入度、入度为 0 入队、出队时减邻居入度；若处理数 == numCourses 则无环。O(V+E)。三色标记 DFS 也可。

**Python：**
```python
from collections import deque, defaultdict

def can_finish(num_courses: int, prerequisites: list[list[int]]) -> bool:
    graph: dict[int, list[int]] = defaultdict(list)
    in_deg = [0] * num_courses
    for a, b in prerequisites:
        graph[b].append(a)
        in_deg[a] += 1
    q: deque[int] = deque(i for i in range(num_courses) if in_deg[i] == 0)
    taken = 0
    while q:
        u = q.popleft()
        taken += 1
        for v in graph[u]:
            in_deg[v] -= 1
            if in_deg[v] == 0:
                q.append(v)
    return taken == num_courses
```

**TypeScript：**
```typescript
function canFinish(numCourses: number, prerequisites: number[][]): boolean {
  const graph: number[][] = Array.from({ length: numCourses }, () => []);
  const inDeg = new Array(numCourses).fill(0);
  for (const [a, b] of prerequisites) {
    graph[b].push(a);
    inDeg[a]++;
  }
  const q: number[] = [];
  for (let i = 0; i < numCourses; i++) if (inDeg[i] === 0) q.push(i);
  let taken = 0;
  while (q.length) {
    const u = q.shift()!;
    taken++;
    for (const v of graph[u]) {
      if (--inDeg[v] === 0) q.push(v);
    }
  }
  return taken === numCourses;
}
```

**Java：**
```java
import java.util.*;

boolean canFinish(int numCourses, int[][] prerequisites) {
    List<List<Integer>> graph = new ArrayList<>();
    for (int i = 0; i < numCourses; i++) graph.add(new ArrayList<>());
    int[] inDeg = new int[numCourses];
    for (int[] e : prerequisites) { graph.get(e[1]).add(e[0]); inDeg[e[0]]++; }
    Deque<Integer> q = new ArrayDeque<>();
    for (int i = 0; i < numCourses; i++) if (inDeg[i] == 0) q.offer(i);
    int taken = 0;
    while (!q.isEmpty()) {
        int u = q.poll();
        taken++;
        for (int v : graph.get(u)) if (--inDeg[v] == 0) q.offer(v);
    }
    return taken == numCourses;
}
```

**要点：**
- DAG 无环时存在拓扑序。
- Kahn BFS 自然统计处理过的节点数。
- 时间 O(V + E)，与输入规模线性。

**标签：** #algorithm

---

### 52. 实现 Trie（前缀树）

**难度：** 中等
**主题：** trie, design, strings
**岗位：** SWE
**级别：** 2-1

**问题：** 实现 Trie，支持 `insert(word)`、`search(word)`、`startsWith(prefix)`。

**思路：** 节点包含 26 长子节点数组（或 HashMap）和 `isEnd` 标志。insert：按字符走/建节点、终点标记。search：走完且需 `isEnd`。startsWith：走完即可。每操作 O(L)。

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

    def _walk(self, prefix: str) -> "Trie | None":
        node: Trie | None = self
        for c in prefix:
            if node is None or c not in node.children:
                return None
            node = node.children[c]
        return node

    def search(self, word: str) -> bool:
        node = self._walk(word)
        return node is not None and node.end

    def starts_with(self, prefix: str) -> bool:
        return self._walk(prefix) is not None
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
  private walk(prefix: string): Trie | null {
    let node: Trie | null = this;
    for (const c of prefix) {
      if (!node || !node.children.has(c)) return null;
      node = node.children.get(c)!;
    }
    return node;
  }
  search(word: string): boolean {
    const n = this.walk(word);
    return n !== null && n.end;
  }
  startsWith(prefix: string): boolean {
    return this.walk(prefix) !== null;
  }
}
```

**Java：**
```java
import java.util.*;

class Trie {
    private final Map<Character, Trie> children = new HashMap<>();
    private boolean end = false;

    public void insert(String word) {
        Trie node = this;
        for (char c : word.toCharArray()) node = node.children.computeIfAbsent(c, k -> new Trie());
        node.end = true;
    }

    private Trie walk(String prefix) {
        Trie node = this;
        for (char c : prefix.toCharArray()) {
            node = node.children.get(c);
            if (node == null) return null;
        }
        return node;
    }

    public boolean search(String word) {
        Trie n = walk(word);
        return n != null && n.end;
    }

    public boolean startsWith(String prefix) { return walk(prefix) != null; }
}
```

**要点：**
- 每个操作 O(L)，L 为单词/前缀长度。
- `end` 标志区分完整单词与仅前缀。
- 用 Map 存子节点可适配任意字母表，仅比固定数组略慢。

**标签：** #algorithm

---

### 53. 前 K 个高频元素

**难度：** 中等
**主题：** heap, hash-map, bucket-sort
**岗位：** SWE
**级别：** 2-1

**问题：** 给定整数数组和整数 k，返回最高频的 k 个元素。

**思路：** HashMap 频次计数。要么 (a) 大小为 k 的最小堆 → O(N log k)，要么 (b) 按频次索引的桶排序 → O(N)。字节追问偏好 O(N) 的桶法。

**Python：**
```python
from collections import Counter

def top_k_frequent(nums: list[int], k: int) -> list[int]:
    cnt = Counter(nums)
    buckets: list[list[int]] = [[] for _ in range(len(nums) + 1)]
    for val, freq in cnt.items():
        buckets[freq].append(val)
    out: list[int] = []
    for freq in range(len(buckets) - 1, 0, -1):
        for v in buckets[freq]:
            out.append(v)
            if len(out) == k:
                return out
    return out
```

**TypeScript：**
```typescript
function topKFrequent(nums: number[], k: number): number[] {
  const cnt = new Map<number, number>();
  for (const x of nums) cnt.set(x, (cnt.get(x) ?? 0) + 1);
  const buckets: number[][] = Array.from({ length: nums.length + 1 }, () => []);
  for (const [v, f] of cnt) buckets[f].push(v);
  const out: number[] = [];
  for (let f = buckets.length - 1; f > 0 && out.length < k; f--) {
    for (const v of buckets[f]) {
      out.push(v);
      if (out.length === k) return out;
    }
  }
  return out;
}
```

**Java：**
```java
import java.util.*;

int[] topKFrequent(int[] nums, int k) {
    Map<Integer, Integer> cnt = new HashMap<>();
    for (int x : nums) cnt.merge(x, 1, Integer::sum);
    List<List<Integer>> buckets = new ArrayList<>();
    for (int i = 0; i <= nums.length; i++) buckets.add(new ArrayList<>());
    for (var e : cnt.entrySet()) buckets.get(e.getValue()).add(e.getKey());
    int[] out = new int[k];
    int idx = 0;
    for (int f = buckets.size() - 1; f > 0 && idx < k; f--) {
        for (int v : buckets.get(f)) {
            out[idx++] = v;
            if (idx == k) return out;
        }
    }
    return out;
}
```

**要点：**
- 频次上界为 n，可做 O(n) 桶排序。
- 最小堆版本 O(n log k)，更省内存。
- 同频元素的顺序未指定。

**标签：** #algorithm

---

### 54. 数组中的第 K 个最大元素

**难度：** 中等
**主题：** heap, quickselect, arrays
**岗位：** SWE
**级别：** 2-1

**问题：** 在无序数组中找第 k 大的元素。

**思路：** 快速选择：取基准、划分；只递归包含第 k 名的那一侧。平均 O(n)、最坏 O(n²)（随机基准或中位数的中位数缓解）。大小为 k 的最小堆 O(N log k) 是更简单的回退方案。

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
  const partition = (lo: number, hi: number): number => {
    const pivot = nums[hi];
    let i = lo;
    for (let j = lo; j < hi; j++) {
      if (nums[j] < pivot) {
        [nums[i], nums[j]] = [nums[j], nums[i]];
        i++;
      }
    }
    [nums[i], nums[hi]] = [nums[hi], nums[i]];
    return i;
  };
  const target = nums.length - k;
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    const p = partition(lo, hi);
    if (p === target) return nums[p];
    if (p < target) lo = p + 1; else hi = p - 1;
  }
  return nums[lo];
}
```

**Java：**
```java
import java.util.*;

int findKthLargest(int[] nums, int k) {
    PriorityQueue<Integer> heap = new PriorityQueue<>();
    for (int x : nums) {
        if (heap.size() < k) heap.offer(x);
        else if (x > heap.peek()) { heap.poll(); heap.offer(x); }
    }
    return heap.peek();
}
```

**要点：**
- 堆：O(n log k)，简单稳定。
- 快速选择：只在一侧分区上递归，平均 O(n)。
- 随机基准避免最坏情况退化。

**标签：** #algorithm

---

### 55. LFU 缓存

**难度：** 困难
**主题：** design, hash-map, linked-list
**岗位：** 高级 SWE
**级别：** 3-1

**问题：** 设计并实现一个 O(1) get/put 的最不经常使用（LFU）缓存。

**思路：** 两个 HashMap + 桶：`key→node`、`freq→双向链表`（同频次内按新近顺序）。维护 `minFreq`。访问时把节点从 `freq` 链表移到 `freq+1` 链表（不存在则建）；若 `freq` 链表空且等于 minFreq，则更新 minFreq。淘汰：删 `minFreq` 链表的尾部。

**Python：**
```python
from collections import OrderedDict, defaultdict

class LFUCache:
    def __init__(self, capacity: int) -> None:
        self.cap = capacity
        self.key_to_val: dict[int, int] = {}
        self.key_to_freq: dict[int, int] = {}
        self.freq_to_keys: dict[int, OrderedDict[int, None]] = defaultdict(OrderedDict)
        self.min_freq = 0

    def _bump(self, key: int) -> None:
        f = self.key_to_freq[key]
        del self.freq_to_keys[f][key]
        if not self.freq_to_keys[f]:
            del self.freq_to_keys[f]
            if self.min_freq == f:
                self.min_freq += 1
        self.key_to_freq[key] = f + 1
        self.freq_to_keys[f + 1][key] = None

    def get(self, key: int) -> int:
        if key not in self.key_to_val:
            return -1
        self._bump(key)
        return self.key_to_val[key]

    def put(self, key: int, value: int) -> None:
        if self.cap == 0:
            return
        if key in self.key_to_val:
            self.key_to_val[key] = value
            self._bump(key)
            return
        if len(self.key_to_val) >= self.cap:
            evict, _ = self.freq_to_keys[self.min_freq].popitem(last=False)
            del self.key_to_val[evict]
            del self.key_to_freq[evict]
        self.key_to_val[key] = value
        self.key_to_freq[key] = 1
        self.freq_to_keys[1][key] = None
        self.min_freq = 1
```

**TypeScript：**
```typescript
class LFUCache {
  private cap: number;
  private kv = new Map<number, number>();
  private kf = new Map<number, number>();
  private fk = new Map<number, Map<number, true>>();
  private minFreq = 0;
  constructor(capacity: number) { this.cap = capacity; }
  private bump(key: number): void {
    const f = this.kf.get(key)!;
    this.fk.get(f)!.delete(key);
    if (this.fk.get(f)!.size === 0) {
      this.fk.delete(f);
      if (this.minFreq === f) this.minFreq++;
    }
    this.kf.set(key, f + 1);
    if (!this.fk.has(f + 1)) this.fk.set(f + 1, new Map());
    this.fk.get(f + 1)!.set(key, true);
  }
  get(key: number): number {
    if (!this.kv.has(key)) return -1;
    this.bump(key);
    return this.kv.get(key)!;
  }
  put(key: number, value: number): void {
    if (this.cap === 0) return;
    if (this.kv.has(key)) { this.kv.set(key, value); this.bump(key); return; }
    if (this.kv.size >= this.cap) {
      const evict = this.fk.get(this.minFreq)!.keys().next().value as number;
      this.fk.get(this.minFreq)!.delete(evict);
      this.kv.delete(evict);
      this.kf.delete(evict);
    }
    this.kv.set(key, value);
    this.kf.set(key, 1);
    if (!this.fk.has(1)) this.fk.set(1, new Map());
    this.fk.get(1)!.set(key, true);
    this.minFreq = 1;
  }
}
```

**Java：**
```java
import java.util.*;

class LFUCache {
    private final int cap;
    private final Map<Integer, Integer> kv = new HashMap<>();
    private final Map<Integer, Integer> kf = new HashMap<>();
    private final Map<Integer, LinkedHashSet<Integer>> fk = new HashMap<>();
    private int minFreq = 0;

    public LFUCache(int capacity) { this.cap = capacity; }

    private void bump(int key) {
        int f = kf.get(key);
        fk.get(f).remove(key);
        if (fk.get(f).isEmpty()) {
            fk.remove(f);
            if (minFreq == f) minFreq++;
        }
        kf.put(key, f + 1);
        fk.computeIfAbsent(f + 1, k -> new LinkedHashSet<>()).add(key);
    }

    public int get(int key) {
        if (!kv.containsKey(key)) return -1;
        bump(key);
        return kv.get(key);
    }

    public void put(int key, int value) {
        if (cap == 0) return;
        if (kv.containsKey(key)) { kv.put(key, value); bump(key); return; }
        if (kv.size() >= cap) {
            int evict = fk.get(minFreq).iterator().next();
            fk.get(minFreq).remove(evict);
            kv.remove(evict);
            kf.remove(evict);
        }
        kv.put(key, value);
        kf.put(key, 1);
        fk.computeIfAbsent(1, k -> new LinkedHashSet<>()).add(key);
        minFreq = 1;
    }
}
```

**要点：**
- 每个频次内用有序 Map 维护同频键的 LRU 顺序。
- 每次新插入都把 `minFreq` 重置为 1。
- 所有操作均摊 O(1)。

**标签：** #algorithm

---

### 56. 二叉树的序列化与反序列化

**难度：** 困难
**主题：** tree, bfs, dfs, design
**岗位：** SWE
**级别：** 2-2

**问题：** 设计算法把二叉树序列化为字符串，并能反序列化还原。

**思路：** 前序 DFS 带空标记（"#"）。序列化：递归追加 "val," 或 "#,"。反序列化：按 "," 切，按索引消费 token，递归构建。O(n)。

**Python：**
```python
class TreeNode:
    def __init__(self, val: int = 0, left: "TreeNode | None" = None, right: "TreeNode | None" = None) -> None:
        self.val = val
        self.left = left
        self.right = right

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
    tokens = iter(data.split(","))
    def go() -> TreeNode | None:
        tok = next(tokens)
        if tok == "#":
            return None
        node = TreeNode(int(tok))
        node.left = go()
        node.right = go()
        return node
    return go()
```

**TypeScript：**
```typescript
class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(v = 0, l: TreeNode | null = null, r: TreeNode | null = null) { this.val = v; this.left = l; this.right = r; }
}

function serialize(root: TreeNode | null): string {
  const parts: string[] = [];
  const go = (n: TreeNode | null): void => {
    if (!n) { parts.push("#"); return; }
    parts.push(String(n.val));
    go(n.left);
    go(n.right);
  };
  go(root);
  return parts.join(",");
}

function deserialize(data: string): TreeNode | null {
  const tokens = data.split(",");
  let i = 0;
  const go = (): TreeNode | null => {
    const t = tokens[i++];
    if (t === "#") return null;
    const node = new TreeNode(Number(t));
    node.left = go();
    node.right = go();
    return node;
  };
  return go();
}
```

**Java：**
```java
import java.util.*;

class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int v) { this.val = v; }
}

String serialize(TreeNode root) {
    StringBuilder sb = new StringBuilder();
    serializeHelper(root, sb);
    return sb.toString();
}

void serializeHelper(TreeNode n, StringBuilder sb) {
    if (n == null) { sb.append("#,"); return; }
    sb.append(n.val).append(',');
    serializeHelper(n.left, sb);
    serializeHelper(n.right, sb);
}

TreeNode deserialize(String data) {
    Deque<String> tokens = new ArrayDeque<>(Arrays.asList(data.split(",")));
    return deserializeHelper(tokens);
}

TreeNode deserializeHelper(Deque<String> tokens) {
    String t = tokens.poll();
    if (t == null || t.equals("#")) return null;
    TreeNode node = new TreeNode(Integer.parseInt(t));
    node.left = deserializeHelper(tokens);
    node.right = deserializeHelper(tokens);
    return node;
}
```

**要点：**
- 带空标记的前序遍历可唯一重建树。
- 共享的迭代器/索引让反序列化保持线性。
- 适用于负值和退化树。

**标签：** #algorithm

---

### 57. 二叉树中的最大路径和

**难度：** 困难
**主题：** tree, dfs, recursion
**岗位：** SWE
**级别：** 2-2

**问题：** 给定非空二叉树，求最大路径和（路径可从任意节点开始、结束；需经过父子边）。

**思路：** 后序 DFS。对每个节点，候选路径 = `node.val + max(0,left) + max(0,right)`，更新全局最大；返回给父节点的增益 = `node.val + max(0, max(left, right))`。

**Python：**
```python
def max_path_sum(root: TreeNode | None) -> int:
    best = float("-inf")
    def gain(node: TreeNode | None) -> int:
        nonlocal best
        if node is None:
            return 0
        l = max(0, gain(node.left))
        r = max(0, gain(node.right))
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
    const l = Math.max(0, gain(n.left));
    const r = Math.max(0, gain(n.right));
    best = Math.max(best, n.val + l + r);
    return n.val + Math.max(l, r);
  };
  gain(root);
  return best;
}
```

**Java：**
```java
int best;

int maxPathSum(TreeNode root) {
    best = Integer.MIN_VALUE;
    gain(root);
    return best;
}

int gain(TreeNode n) {
    if (n == null) return 0;
    int l = Math.max(0, gain(n.left));
    int r = Math.max(0, gain(n.right));
    best = Math.max(best, n.val + l + r);
    return n.val + Math.max(l, r);
}
```

**要点：**
- 负的子树贡献被裁剪为 0。
- 经过当前节点的候选路径用左右"两侧"；返回给父节点的只用"一侧"。
- 在每个节点后序更新全局最优。

**标签：** #algorithm

---

### 58. LRU 缓存

**难度：** 中等
**主题：** design, hash-map, doubly-linked-list
**岗位：** SWE
**级别：** 2-1

**问题：** 设计一个 O(1) get/put 的最近最少使用（LRU）缓存。

**思路：** HashMap `key → node` + 双向链表（头 = MRU，尾 = LRU）。get/put 时把节点挪到头。超容时淘汰尾节点。所有操作 O(1)。

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
import java.util.*;

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
- JS Map 与 Python OrderedDict 都保留插入顺序。
- 访问时重新插入，将其标记为最近使用。
- 超容时淘汰最旧条目。

**标签：** #algorithm

---

### 59. 解码方法

**难度：** 中等
**主题：** dp, strings
**岗位：** SWE
**级别：** 2-1

**问题：** 数字字符串可被解码为字母（A=1...Z=26）。返回 `s` 的解码方法数。

**思路：** 一维 DP。`dp[i]` = `s[:i]` 的解码方法数。`dp[0] = 1`。若 `s[i-1] != '0'`，`dp[i] += dp[i-1]`。若 `s[i-2..i]` 在 [10,26]，`dp[i] += dp[i-2]`。注意前导零。O(n)。

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
        two = int(s[i - 1:i + 1])
        if 10 <= two <= 26:
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
- '0' 只能作为 10 或 20 的第二位被解码。
- 两个滚动变量即可，无需完整 DP 数组。
- 以 '0' 开头直接返回 0。

**标签：** #algorithm

---

### 60. 零钱兑换

**难度：** 中等
**主题：** dp, arrays
**岗位：** SWE
**级别：** 2-1

**问题：** 给定不同面额硬币和总金额，返回凑齐金额所需的最少硬币数；不可能则返回 -1。

**思路：** 完全背包 DP。`dp[a] = min(dp[a - c] + 1)`，遍历所有硬币 c。`dp[0] = 0`，其余 = ∞。O(amount · #coins)。在金额上做 BFS 也可。

**Python：**
```python
def coin_change(coins: list[int], amount: int) -> int:
    INF = amount + 1
    dp = [0] + [INF] * amount
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a:
                dp[a] = min(dp[a], dp[a - c] + 1)
    return -1 if dp[amount] == INF else dp[amount]
```

**TypeScript：**
```typescript
function coinChange(coins: number[], amount: number): number {
  const INF = amount + 1;
  const dp = new Array(amount + 1).fill(INF);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) {
      if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
    }
  }
  return dp[amount] === INF ? -1 : dp[amount];
}
```

**Java：**
```java
import java.util.*;

int coinChange(int[] coins, int amount) {
    int INF = amount + 1;
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, INF);
    dp[0] = 0;
    for (int a = 1; a <= amount; a++) {
        for (int c : coins) {
            if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
        }
    }
    return dp[amount] == INF ? -1 : dp[amount];
}
```

**要点：**
- 用 `amount + 1` 作为安全的"无穷"上界（最多需要 amount 枚 1 元）。
- 自底向上保证子问题先被解。
- 完全背包：硬币可重复使用。

**标签：** #algorithm

---

### 61. 岛屿数量

**难度：** 中等
**主题：** dfs, bfs, union-find, matrix
**岗位：** SWE
**级别：** 2-1

**问题：** 给定由 '1'（陆地）和 '0'（水）组成的二维网格，统计岛屿数（4 向相连的陆地为一岛）。

**思路：** 扫描网格；每遇到未访问的 '1'，DFS/BFS 标记所有可达陆地为已访问，计数 +1。O(m·n)。也可用并查集。追问：流式"岛屿数量 II"用并查集。

**Python：**
```python
def num_islands(grid: list[list[str]]) -> int:
    if not grid:
        return 0
    m, n = len(grid), len(grid[0])
    def dfs(r: int, c: int) -> None:
        if r < 0 or c < 0 or r >= m or c >= n or grid[r][c] != "1":
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
  if (grid.length === 0) return 0;
  const m = grid.length, n = grid[0].length;
  const dfs = (r: number, c: number): void => {
    if (r < 0 || c < 0 || r >= m || c >= n || grid[r][c] !== "1") return;
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
int numIslands(char[][] grid) {
    if (grid.length == 0) return 0;
    int m = grid.length, n = grid[0].length, count = 0;
    for (int r = 0; r < m; r++) {
        for (int c = 0; c < n; c++) {
            if (grid[r][c] == '1') { dfs(grid, r, c, m, n); count++; }
        }
    }
    return count;
}

void dfs(char[][] grid, int r, int c, int m, int n) {
    if (r < 0 || c < 0 || r >= m || c >= n || grid[r][c] != '1') return;
    grid[r][c] = '0';
    dfs(grid, r + 1, c, m, n); dfs(grid, r - 1, c, m, n);
    dfs(grid, r, c + 1, m, n); dfs(grid, r, c - 1, m, n);
}
```

**要点：**
- 原地标记已访问（置为 '0'）省去额外内存。
- 每个格子访问 O(1) 次 → 总计 O(m * n)。
- 巨大网格上 BFS 可避免深递归爆栈。

**标签：** #algorithm

---

### 62. 设计推特 / 短视频信息流

**难度：** 困难
**主题：** design, heap, hash-map
**岗位：** SWE
**级别：** 2-2

**问题：** 设计简化版短视频/推文信息流：postTweet、getNewsFeed（自己和关注者的最近 10 条）、follow、unfollow。

**思路：** 每用户存 (时间戳, tweetId) 列表。关注图为 `userId → set<followeeId>`。getNewsFeed：用最大堆按时间戳对自己 + 关注者的最近推文做 k 路归并（每个列表先压头，弹顶后再压它的前驱）。每次取流 O(F log F)，F = 关注数。全局自增时间戳保证全序。

**Python：**
```python
import heapq
from collections import defaultdict

class Twitter:
    def __init__(self) -> None:
        self.time = 0
        self.tweets: dict[int, list[tuple[int, int]]] = defaultdict(list)
        self.follows: dict[int, set[int]] = defaultdict(set)

    def post_tweet(self, user_id: int, tweet_id: int) -> None:
        self.tweets[user_id].append((self.time, tweet_id))
        self.time += 1

    def get_news_feed(self, user_id: int) -> list[int]:
        users = self.follows[user_id] | {user_id}
        heap: list[tuple[int, int, int, int]] = []
        for u in users:
            if self.tweets[u]:
                idx = len(self.tweets[u]) - 1
                t, tid = self.tweets[u][idx]
                heapq.heappush(heap, (-t, tid, u, idx))
        out: list[int] = []
        while heap and len(out) < 10:
            _, tid, u, idx = heapq.heappop(heap)
            out.append(tid)
            if idx > 0:
                nt, ntid = self.tweets[u][idx - 1]
                heapq.heappush(heap, (-nt, ntid, u, idx - 1))
        return out

    def follow(self, follower: int, followee: int) -> None:
        if follower != followee:
            self.follows[follower].add(followee)

    def unfollow(self, follower: int, followee: int) -> None:
        self.follows[follower].discard(followee)
```

**TypeScript：**
```typescript
class Twitter {
  private time = 0;
  private tweets = new Map<number, Array<[number, number]>>();
  private follows = new Map<number, Set<number>>();
  postTweet(userId: number, tweetId: number): void {
    if (!this.tweets.has(userId)) this.tweets.set(userId, []);
    this.tweets.get(userId)!.push([this.time++, tweetId]);
  }
  getNewsFeed(userId: number): number[] {
    const users = new Set(this.follows.get(userId) ?? []);
    users.add(userId);
    const candidates: Array<[number, number]> = [];
    for (const u of users) for (const t of this.tweets.get(u) ?? []) candidates.push(t);
    candidates.sort((a, b) => b[0] - a[0]);
    return candidates.slice(0, 10).map(([, tid]) => tid);
  }
  follow(follower: number, followee: number): void {
    if (follower === followee) return;
    if (!this.follows.has(follower)) this.follows.set(follower, new Set());
    this.follows.get(follower)!.add(followee);
  }
  unfollow(follower: number, followee: number): void {
    this.follows.get(follower)?.delete(followee);
  }
}
```

**Java：**
```java
import java.util.*;

class Twitter {
    private int time = 0;
    private final Map<Integer, List<int[]>> tweets = new HashMap<>();
    private final Map<Integer, Set<Integer>> follows = new HashMap<>();

    public void postTweet(int userId, int tweetId) {
        tweets.computeIfAbsent(userId, k -> new ArrayList<>()).add(new int[]{time++, tweetId});
    }

    public List<Integer> getNewsFeed(int userId) {
        Set<Integer> users = new HashSet<>(follows.getOrDefault(userId, Set.of()));
        users.add(userId);
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> b[0] - a[0]);
        for (int u : users) {
            List<int[]> ts = tweets.get(u);
            if (ts != null && !ts.isEmpty()) {
                int i = ts.size() - 1;
                heap.offer(new int[]{ts.get(i)[0], ts.get(i)[1], u, i});
            }
        }
        List<Integer> out = new ArrayList<>();
        while (!heap.isEmpty() && out.size() < 10) {
            int[] top = heap.poll();
            out.add(top[1]);
            int u = top[2], i = top[3];
            if (i > 0) {
                int[] prev = tweets.get(u).get(i - 1);
                heap.offer(new int[]{prev[0], prev[1], u, i - 1});
            }
        }
        return out;
    }

    public void follow(int follower, int followee) {
        if (follower != followee) follows.computeIfAbsent(follower, k -> new HashSet<>()).add(followee);
    }

    public void unfollow(int follower, int followee) {
        Set<Integer> s = follows.get(follower);
        if (s != null) s.remove(followee);
    }
}
```

**要点：**
- 全局时间戳为所有用户的推文建立全序。
- 基于堆的 k 路归并避免扫描每条推文。
- 用户在 feed 查询时隐式包含自身。

**标签：** #algorithm

---

## 字节跳动特有的建议

- **编码门槛不开玩笑。** 练 Hard 级 DP、图（Dijkstra/Bellman-Ford/拓扑）、位运算。期望首发就最优 O()。
- **准备好背靠背的车轮战。** 体力管理很重要；马拉松式安排是隐性挑战。
- **TikTok 岗位要对算法有观点。** 读 Monolith（字节开源的推荐框架），对实时学习有自己的看法。
- **会普通话加分**但美区/全球岗不强制。如果会，可以提一句——若双方都更自在，部分轮次会切换到普通话。
- **别低估 HR 轮。** 他们对文化匹配和"迭代速度"挖得很深。准备好干净利落的例子。

## 参考资料

- LeetCode "ByteDance" 和 "TikTok" 公司标签（与 LC Hard 标签重合度高）
- 字节开源：Monolith（推荐）、CloudWeGo（Go RPC）
- 《Recommender Systems Handbook》—— Ricci 等
- 1point3acres.com 论坛的中文面经
