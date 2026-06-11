# ByteDance (TikTok / Douyin / Lark)

```yaml
company: ByteDance (TikTok, Douyin, Lark/Feishu, CapCut)
typical_rounds: 1 HR screen + 3-5 technical rounds (heavy coding) + 1 cross-team / leadership round + HR final
focus_areas: DP, graphs, math-heavy algorithms, video/recommendation system design
languages_allowed: any major language; Go/Java/C++/Python common
duration: 60 min per round, often with 2 problems
notable_quirks:
  - Coding bar is reputedly the highest of any company — Hard-tagged DP/graph problems are common
  - Many rounds back-to-back; sometimes same day
  - Engineering culture is "speed and ownership" — behavioral leans on stories of fast iteration
  - International candidates often interviewed by mainland China teams in English (sometimes Mandarin if applicable)
  - For TikTok roles, recommendation systems come up constantly
sources: LeetCode Discuss (bytedance/tiktok tag), 1point3acres, Blind, Glassdoor
```

## Overview

ByteDance has a reputation for being one of the toughest coding interviews in the industry. Expect Hard-tagged dynamic programming, graph problems, and clever math/bit-manipulation. System design rounds for TikTok roles inevitably touch video streaming, feed ranking, and recommendation systems. Behavioral is lighter than US companies but probes "speed of iteration" and "ownership of ambiguity." For mainland-China-based teams, working hours expectations (the 996-adjacent culture, though shifted) may come up.

## Questions

### 1. Longest Increasing Subsequence

**Difficulty:** Medium
**Topics:** dp, binary-search, arrays
**Position:** SWE
**Years:** 2-2

**Question:** Given an integer array `nums`, return the length of the longest strictly increasing subsequence.

**Approach:** Patience sort / binary search variant: maintain `tails[]` where `tails[i]` = smallest tail of any increasing subsequence of length `i+1`. For each num, binary search to replace or append. O(n log n). The classic O(n²) DP also accepted but ByteDance follow-ups push for the O(n log n) version.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- `tails` is not the actual LIS but its length is correct.
- Binary search gives O(n log n) vs O(n^2) DP.
- For non-strict increasing, use `bisect_right` instead.

**Follow-ups:**
- Reconstruct one valid LIS, not just the length.
- Count the number of LIS (LeetCode 673).
- Longest *bitonic* subsequence — LIS forward + LIS backward.
- 2D LIS / Russian doll envelopes — sort by one axis then LIS on the other.

**Common Pitfalls:**
- Confusing the `tails` array with the actual LIS sequence — it's not.
- Using `bisect_left` for non-strict increasing — you'll undercount duplicates.

**Tags:** #algorithm

---

### 2. Edit Distance

**Difficulty:** Hard
**Topics:** dp, strings
**Position:** SWE
**Years:** 2-2

**Question:** Given two strings `word1` and `word2`, return the minimum number of operations (insert, delete, replace) to convert `word1` to `word2`.

**Approach:** 2D DP. `dp[i][j]` = edit distance of `word1[:i]` and `word2[:j]`. Base cases: `dp[0][j] = j`, `dp[i][0] = i`. Transition: if chars equal, `dp[i][j] = dp[i-1][j-1]`; else `1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])`. O(m*n) time/space, reducible to O(min(m,n)) space with rolling rows.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Three transitions correspond to delete, insert, replace.
- Initialize first row/column to identity costs.
- Rolling array reduces to O(min(m, n)) space.

**Follow-ups:**
- Different operation costs (insert vs delete vs replace each have their own weight).
- Reconstruct the actual edit script, not just the distance.
- One Edit Distance — detect if distance is exactly 1 in O(n) time.
- Word-level edit distance for diff tools.

**Common Pitfalls:**
- Forgetting the `dp[i-1][j-1]` term — only treating insert/delete and missing replace.
- Initializing the first row/column to 0 instead of `i`/`j` — silently wrong.

**Tags:** #algorithm

---

### 3. Maximum Sum Rectangle in 2D Matrix

**Difficulty:** Hard
**Topics:** dp, matrix, kadane
**Position:** SWE
**Years:** 3-5

**Question:** Given a 2D matrix, find the rectangle with the maximum sum of elements.

**Approach:** Fix top row `t` and bottom row `b`; collapse rows `[t..b]` into a 1D array (column sums), run Kadane's on it for max subarray. Iterate all `(t, b)` pairs. O(rows² * cols). Maximum subarray (1D Kadane) is the core building block. Watch all-negative case.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Reduces 2D problem to repeated 1D Kadane.
- Iterating outer rows in O(rows^2) and inner Kadane in O(cols) gives O(rows^2 * cols).
- All-negative matrices return the single largest element.

**Follow-ups:**
- Return the four corners of the optimal rectangle, not just the sum.
- Constrain rectangle to be ≤ K in sum (max sum no larger than K).
- Find the *smallest* rectangle whose sum is ≥ K.
- 3D extension: max-sum cuboid in 3D matrix.

**Common Pitfalls:**
- Choosing the outer loop on columns instead of rows when cols >> rows — picks the wrong dimension to square.
- Forgetting that all-negative inputs still must return the largest single element, not 0.

**Tags:** #algorithm

---

### 4. Burst Balloons

**Difficulty:** Hard
**Topics:** dp, interval-dp
**Position:** SWE
**Years:** 3-5

**Question:** Given `n` balloons with values `nums[i]`, bursting balloon `i` gives `nums[i-1] * nums[i] * nums[i+1]` coins (treat out-of-bounds as 1). Find max coins.

**Approach:** Interval DP — think *last balloon to burst* in range `(l, r)` instead of first. `dp[l][r] = max over k in (l, r) of (dp[l][k] + nums[l]*nums[k]*nums[r] + dp[k][r])`. Pad with 1s on both ends. O(n³).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Reverse-thinking: pick the LAST balloon to burst, not the first.
- Padding with 1s sidesteps boundary checks.
- O(n^3) time, O(n^2) space.

**Follow-ups:**
- Min cost to merge stones — same interval-DP shape.
- Matrix Chain Multiplication — classic interval DP.
- Print the optimal burst order, not just the score.
- Multi-color balloon variant with adjacency rules.

**Common Pitfalls:**
- Iterating "first" balloon to burst instead of last — the subproblem isn't well-defined.
- Forgetting the boundary 1s — off-by-one when balloon is at edge.

**Tags:** #algorithm

---

### 5. Sliding Window Maximum

**Difficulty:** Hard
**Topics:** sliding-window, deque, monotonic-queue
**Position:** SWE
**Years:** 2-2

**Question:** Given an array `nums` and integer `k`, return the max of each window of size `k`.

**Approach:** Monotonic deque storing indices in decreasing value order. Push: pop back while `nums[back] <= nums[i]`, append i. Pop front if out of window (`front <= i - k`). Front of deque is current max. O(n).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Deque holds indices, not values, so window expiration is O(1).
- Each index is pushed and popped at most once: amortized O(n).
- Front of deque is always the window's max.

**Follow-ups:**
- Sliding window *minimum* — flip the comparison.
- Sliding window median — two heaps with lazy deletion, or order statistics tree.
- Variable-size window: smallest window with sum ≥ K.
- Streaming top-K within last N events.

**Common Pitfalls:**
- Storing values instead of indices — can't tell when an entry has expired out of the window.
- Using `<` instead of `<=` when popping the back — lets stale equal values linger.

**Tags:** #algorithm

---

### 6. Word Ladder II

**Difficulty:** Hard
**Topics:** graph, bfs, backtracking
**Position:** SWE
**Years:** 3-5

**Question:** Like Word Ladder, but return ALL shortest transformation sequences from `beginWord` to `endWord`.

**Approach:** BFS to build a `parent` graph (each node points to predecessors at the previous BFS layer); stop at the layer containing `endWord`. Then DFS/backtrack from `endWord` through the parent graph to enumerate all paths. Critical: don't enumerate during BFS — too slow. O(N * L^2 + paths).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- BFS finds shortest depth; backtracking enumerates all paths.
- Remove layer from `words` to prevent revisiting at same or later depth.
- Stop BFS at the layer where `end` first appears.

**Follow-ups:**
- Bidirectional BFS — search from both ends, halve the branching exponent.
- Word Ladder I (just the length) — simpler single-pass BFS.
- Return the count of shortest paths instead of all the paths.
- Allow insertions/deletions in addition to substitutions — different neighbor function.

**Common Pitfalls:**
- Removing words *during* the current BFS layer — can miss alternative parents at the same depth.
- Not stopping at the layer where `end` first appears — explodes runtime on dense dictionaries.

**Tags:** #algorithm

---

### 7. Regular Expression Matching

**Difficulty:** Hard
**Topics:** dp, strings, recursion
**Position:** SWE
**Years:** 3-5

**Question:** Implement regex matching with `.` (any char) and `*` (zero or more of preceding element).

**Approach:** 2D DP. `dp[i][j]` = `s[:i]` matches `p[:j]`. If `p[j-1] == '*'`: `dp[i][j] = dp[i][j-2]` (zero copies) OR (matches preceding && `dp[i-1][j]`). If normal char/`.`: matches && `dp[i-1][j-1]`. Tricky edge: `*` requires p[j-2] to exist. O(m*n).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- `*` represents zero or more of the preceding character.
- Empty string can match patterns like `a*b*c*` (handled by row 0 init).
- Always evaluate the `*` case via two branches: zero copies vs one-more copy.

**Follow-ups:**
- Wildcard matching with `?` and `*` (LeetCode 44) — different semantics, no preceding-char rule.
- Compile the regex to an NFA / Thompson construction.
- Support `+` and `{n,m}` quantifiers.
- Return the matched groups, not just true/false.

**Common Pitfalls:**
- Treating `*` as wildcard for any character — it only repeats the *preceding* char.
- Off-by-one on `dp[0][j]` init for patterns like `a*b*c*`.

**Tags:** #algorithm

---

### 8. Number of Connected Components in Undirected Graph

**Difficulty:** Medium
**Topics:** union-find, graph, dfs
**Position:** SWE
**Years:** 2-2

**Question:** Given `n` nodes labeled 0 to n-1 and a list of undirected edges, return the number of connected components.

**Approach:** Union-Find with path compression and union by rank. Initialize n components; for each edge, union endpoints (decrement count if a real merge). O(E * α(N)). DFS/BFS alternative is also accepted.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Path compression flattens future finds to near-constant.
- Decrement count only on a real merge.
- Inverse Ackermann factor makes this effectively O(E).

**Follow-ups:**
- Size of each connected component, not just the count.
- Dynamic connectivity — edges are added and removed online.
- Connected components in a *directed* graph — Tarjan / Kosaraju SCC instead.
- Union-find with rollback for offline queries.

**Common Pitfalls:**
- Decrementing the count on every `union` call regardless of whether roots differ — over-counts.
- Forgetting either path compression or union by rank — risk of O(n) per find on adversarial input.

**Tags:** #algorithm

---

### 9. Design TikTok Feed / Recommendation

**Difficulty:** Hard
**Topics:** system-design, recommendation, ranking, real-time
**Position:** Senior SWE
**Years:** 5+

**Question:** Design the For You Page (FYP) feed for TikTok. How does the system pick the next video for each user in <200ms?

**Approach:** Two-stage ranker: (1) **Candidate generation** — pull a few hundred candidates from multiple sources: collaborative filtering embeddings (user vector lookup → ANN search via FAISS/HNSW), recent uploads from followed creators, trending in your geo/language, "exploration" cold-start items. (2) **Ranking** — multi-task DNN scoring P(like), P(watch_to_completion), P(share), P(comment) given user features + video features + context. Combine with a weighted objective. Diversity rerank (don't show 5 cooking videos in a row). Online learning loop: every interaction streamed to Flink → updates user state in real-time (Kafka → user embedding store). Discuss cold start, cache layers, A/B framework, and inference latency budget.

**Follow-ups:**
- Cold-start for a brand-new user with zero history.
- Filter bubble / echo chamber mitigation in the ranker.
- Real-time signal: how fast does a "like" feed back into the next recommendation?
- Model retraining cadence — hourly vs daily vs continuous online learning.
- Inference latency budget — how do you stay under 200ms with multi-task DNN scoring?

**Common Pitfalls:**
- Mixing up candidate generation and ranking — they have very different latency budgets.
- Ignoring diversity rerank — the FYP collapses into a single topic.

**Tags:** #system-design

---

### 10. Design TikTok Video Upload + Encoding

**Difficulty:** Hard
**Topics:** system-design, video, blob-storage, encoding, cloud
**Position:** Senior SWE
**Years:** 5+

**Question:** Design the upload + encoding pipeline for TikTok. A user records a 60s vertical video and posts it; how does it become playable globally in seconds?

**Approach:** Client uploads to nearest edge (regional ingest) via resumable multipart. Original stored in cold blob; transcoding job enqueued. Transcoder fleet (autoscaled, GPU for some codecs) generates multiple bitrates (HLS chunks). Thumbnails extracted. ML moderation runs in parallel (NSFW classifier, copyrighted audio detection). Metadata + URLs written to a sharded DB. CDN preheat for high-engagement creators (push to PoPs in target geos). Discuss: parallel chunked encoding to keep latency low, fallback on encoding failure, and how the post enters the recommendation candidate pool only after moderation passes.

**Follow-ups:**
- Resumable upload on flaky mobile networks — chunk size, retry, dedupe.
- DRM / watermarking pipeline — where in the flow does it sit?
- Cost: cold blob vs warm blob vs CDN — how do you tier as engagement decays?
- Live moderation appeal: what if a video is incorrectly flagged?
- Multi-region storage placement — where do you keep the master copy?

**Common Pitfalls:**
- Encoding the full video before allowing playback — hide playback behind the first chunk being ready instead.
- Letting unmoderated content into the FYP candidate pool — brand-safety disaster.

**Tags:** #system-design

---

### 11. Design a Real-Time Comment / Danmaku System

**Difficulty:** Hard
**Topics:** system-design, websockets, pub-sub, fanout
**Position:** Senior SWE
**Years:** 5+

**Question:** Design the live "danmaku" (bullet comments scrolling across video) system used in Douyin live streams.

**Approach:** Viewers WebSocket-connect to edge gateways (sharded by stream_id). Comments published → per-stream Kafka topic → gateways subscribe and fan out to connected viewers. At scale (1M+ concurrent on a single stream), sample/throttle: don't show every comment, render a representative sample. Apply spam filter (sync ML scorer + rate limit per user). Persist to async store for replay. Discuss back-pressure when one stream is hot (autoscale gateway pool), client-side rendering performance (limit visible comments to ~30/sec), and the user's own comment guaranteed-shown rule.

**Tags:** #system-design

---

### 12. Design a Distributed ID Generator (Snowflake-style)

**Difficulty:** Medium
**Topics:** system-design, distributed, id-generation
**Position:** SWE
**Years:** 2-3

**Question:** Design a service that generates unique, roughly time-ordered 64-bit IDs at extreme scale.

**Approach:** Snowflake format: 41-bit timestamp (ms since epoch) + 10-bit machine ID + 12-bit sequence (per ms). 4M IDs/sec per machine, ~69 years before timestamp overflow. Machine ID assigned via ZooKeeper or static config. Handle clock drift: refuse to issue if clock goes backwards (or wait until clock catches up). Discuss why monotonic-ish ordering matters for B-tree indexes (avoid hot-spot inserts at end vs scattered random IDs).

**Tags:** #system-design

---

### 13. Design Lark / Feishu Document Search

**Difficulty:** Hard
**Topics:** system-design, search, indexing, permissions
**Position:** Senior SWE
**Years:** 5+

**Question:** Design the search functionality across all documents a user has access to in Lark/Feishu (millions of docs per enterprise).

**Approach:** Inverted index in Elasticsearch sharded by tenant_id (enterprise). On doc edit, queue indexing job (eventual consistency OK). Permission filter: ACL check at query time (post-filter scored results, or precompute "viewable_by_users" terms in the index — trade-off between query speed and write amplification). Multilingual analyzer (Chinese tokenization via jieba or HanLP, English/others standard). Ranking: BM25 + recency + your engagement signals. Discuss: large doc handling (chunk + aggregate), real-time vs near-real-time indexing, and how to scale a single tenant with 10M docs (multi-shard within tenant).

**Tags:** #system-design

---

### 14. Design a Live Streaming Platform

**Difficulty:** Hard
**Topics:** system-design, rtmp, hls, cdn, low-latency, cloud, big-data
**Position:** Senior SWE
**Years:** 5+

**Question:** Design a live streaming platform supporting 100K concurrent broadcasters, each with up to 1M viewers, with sub-3-second end-to-end latency.

**Approach:** Streamer pushes RTMP/SRT/WebRTC to nearest ingest. Transcoder generates ABR ladder (240p → 1080p) as low-latency HLS or LL-DASH chunks (0.5-1s). Distribute via CDN with origin shielding. For sub-3s latency, prefer WebRTC for the last mile (more complex) or LL-HLS with partial segments. Discuss: chat/danmaku as separate pipeline (see Q11), interactive features (gifts, co-host), regional licensing for content, and abuse moderation (real-time ASR + frame sampling to classifier).

**Tags:** #system-design

---

### 15. Tell me about a time you delivered something faster than expected

**Difficulty:** Medium
**Topics:** behavioral, speed, ownership
**Position:** SWE
**Years:** 2-3

**Question:** Tell me about a project where you shipped much faster than originally estimated. How did you do it?

**Approach:** ByteDance's "速度" (speed) culture is core. Show: (1) you cut scope ruthlessly to v0, (2) you parallelized work or pulled in help proactively, (3) you accepted some technical debt explicitly with a plan to repay, (4) quantified impact and time-to-market wins. Avoid "I worked weekends" — they want smart scoping, not just hours.

**Tags:** #behavioral

---

### 16. Time you owned an end-to-end project

**Difficulty:** Medium
**Topics:** behavioral, ownership, scope
**Position:** Senior SWE
**Years:** 5+

**Question:** Describe a project where you owned the full lifecycle — design, implementation, launch, monitoring.

**Approach:** Show: (1) you set the technical direction (not just executed someone else's), (2) you partnered with PM/ops/design without being prompted, (3) you stayed engaged post-launch — measured success, ran a retro, planned v2. Bonus: you handed off to others later with clean docs and on-call playbooks. ByteDance promotes generalists who can own breadth.

**Tags:** #behavioral

---

### 17. Time you handled fast-changing requirements

**Difficulty:** Medium
**Topics:** behavioral, ambiguity, adaptability
**Position:** SWE
**Years:** 2-3

**Question:** Tell me about a time the requirements changed multiple times during a project. How did you handle it?

**Approach:** ByteDance moves fast — pivots are constant. Show: (1) you didn't push back defensively each time, (2) you built abstractions that made pivoting cheap (modular code, feature flags), (3) you helped the PM/leadership understand the cost of each change with data. Avoid stories where you complained about thrash — they want adaptability.

**Tags:** #behavioral

---

### 18. Why do you want to work at ByteDance / TikTok

**Difficulty:** Easy
**Topics:** behavioral, motivation, fit
**Position:** SWE
**Years:** 2-3

**Question:** Why ByteDance? What attracts you to TikTok specifically?

**Approach:** Don't say "I use TikTok a lot" alone. Better: (1) impressed by the speed of product iteration (cite a specific feature shipped recently), (2) interested in the recommendation system at scale (the algorithm is famous), (3) global product reach. Mention something technical you've read — a paper, a blog post on Monolith (their recommendation framework). Avoid politics.

**Tags:** #behavioral

---

### 19. Recommendation systems: collaborative filtering vs deep learning

**Difficulty:** Hard
**Topics:** recommendation, ml, ranking
**Position:** Senior SWE
**Years:** 5+

**Question:** Compare matrix factorization, two-tower models, and ranking DNNs for a feed recommendation system. When would you use each?

**Approach:** **Matrix factorization** — simple, interpretable, good baseline. Works for explicit feedback (ratings). Doesn't handle cold start well. **Two-tower** — user tower + item tower trained on positive pairs (clicked/watched), ANN serving. Great for retrieval/candidate generation at scale (millions of items). Limited feature interaction. **Ranking DNN** — heavy feature crosses (DCN, DeepFM), multi-task heads (CTR, watch time, share). Used post-retrieval on hundreds of candidates. Higher latency, hard to scale across full corpus. Modern stack: two-tower retrieval → DNN ranker → diversity rerank. Discuss cold start (content-based features in towers) and online learning.

**Tags:** #domain-knowledge

---

### 20. Video encoding trade-offs: H.264 vs H.265 vs AV1

**Difficulty:** Medium
**Topics:** video, encoding, codecs
**Position:** Senior SWE
**Years:** 5+

**Question:** TikTok needs to choose codecs for global video delivery. Walk through the trade-offs between H.264, H.265 (HEVC), VP9, and AV1.

**Approach:** **H.264** — universal device support, mature encoders, moderate compression. Default for broad reach. **H.265** — ~30-50% better compression than H.264, but patent royalty mess, weaker Android <8 support. **VP9** — Google's royalty-free alternative, similar to H.265, supported in Chrome/Android. **AV1** — best compression (~30% better than VP9), royalty-free, but encoding is CPU-expensive (newer chips have hardware decode but few have hardware encode). Strategy: ladder encode multiple codecs, serve the best one the client supports. Pre-encode popular content in AV1 to save egress; live-encode tail content in H.264 only. Discuss bandwidth savings ROI vs encoding cost.

**Tags:** #domain-knowledge

---

### 21. Longest Consecutive Sequence

**Difficulty:** Medium
**Topics:** hash-set, arrays, union-find
**Position:** SWE
**Years:** 2-1

**Question:** Given an unsorted array of integers `nums`, return the length of the longest consecutive elements sequence in O(n) time.

**Approach:** Insert all nums into a HashSet. For each num, only start counting if `num - 1` is NOT in the set (i.e. it is the start of a streak); then walk `num+1, num+2, ...` while present. Each element visited at most twice → O(n). Union-Find variant also accepted.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Only start a streak from its smallest element to keep total work O(n).
- Set membership is O(1) average.
- Duplicates are naturally collapsed by the set.

**Tags:** #algorithm

---

### 22. Two Sum

**Difficulty:** Easy
**Topics:** hash-map, arrays
**Position:** SWE
**Years:** 2-1

**Question:** Given an array of integers `nums` and an integer `target`, return indices of the two numbers that add up to `target`.

**Approach:** One-pass HashMap from value → index. For each `nums[i]`, check if `target - nums[i]` is in the map; if yes return both indices. Otherwise insert `nums[i] → i`. O(n) time/space. ByteDance follow-up: handle duplicates / return all pairs / k-Sum generalization.

**Python:**
```python
def two_sum(nums: list[int], target: int) -> list[int]:
    seen: dict[int, int] = {}
    for i, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], i]
        seen[x] = i
    return []
```

**TypeScript:**
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

**Java:**
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

**Key points:**
- Hash map turns inner search from O(n) to O(1).
- Store after checking to avoid pairing an index with itself.
- Works with negatives and duplicates.

**Tags:** #algorithm

---

### 23. Add Two Numbers

**Difficulty:** Medium
**Topics:** linked-list, math
**Position:** SWE
**Years:** 2-1

**Question:** Two non-empty linked lists represent two non-negative integers stored in reverse order. Add the two numbers and return the sum as a linked list.

**Approach:** Walk both lists simultaneously with a `carry`. At each step new digit = `(a + b + carry) % 10`, `carry = (a + b + carry) / 10`. Use a dummy head. Continue while either list has nodes OR `carry != 0`. O(max(m,n)).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Loop condition must include `carry` for the final overflow digit.
- Either list may end first; treat missing digits as 0.
- Output is also in reverse-digit order.

**Tags:** #algorithm

---

### 24. Longest Substring Without Repeating Characters

**Difficulty:** Medium
**Topics:** sliding-window, hash-map, strings
**Position:** SWE
**Years:** 2-1

**Question:** Given a string `s`, find the length of the longest substring without repeating characters.

**Approach:** Sliding window with HashMap of `char → last index`. Move `right`; if `s[right]` was seen and its index >= `left`, jump `left = lastIndex + 1`. Update map and best length. O(n) time, O(min(n, alphabet)) space.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Only jump `l` forward, never backward.
- Map holds the most recent index of each character.
- Window invariant: `s[l..r]` has all distinct characters.

**Tags:** #algorithm

---

### 25. Median of Two Sorted Arrays

**Difficulty:** Hard
**Topics:** binary-search, arrays, divide-and-conquer
**Position:** SWE
**Years:** 3-1

**Question:** Given two sorted arrays `nums1` and `nums2` of sizes m and n, return the median in O(log(min(m,n))).

**Approach:** Binary-search a partition of the shorter array such that `max(leftA, leftB) <= min(rightA, rightB)`. Adjust partition based on comparison. Median is the average of the two middle values (even total) or the max of left halves (odd total). Carefully handle edges with ±∞ sentinels.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Always binary-search the shorter array to bound runtime at O(log(min(m, n))).
- Sentinels (`+/-Infinity`) avoid boundary special-casing.
- Parity of total length decides whether to average two middles.

**Tags:** #algorithm

---

### 26. Longest Palindromic Substring

**Difficulty:** Medium
**Topics:** dp, strings, two-pointers
**Position:** SWE
**Years:** 2-1

**Question:** Given a string `s`, return the longest palindromic substring.

**Approach:** Expand-around-center: for each index treat it as a center (odd length) and as a gap between i and i+1 (even length); expand while chars match, track best. O(n²) time, O(1) space. Manacher gives O(n) for follow-up.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Try both odd and even centers per index.
- Compare by length difference, not recomputing substrings.
- Manacher's algorithm gives O(n) but is rarely needed in interviews.

**Tags:** #algorithm

---

### 27. Container With Most Water

**Difficulty:** Medium
**Topics:** two-pointers, greedy, arrays
**Position:** SWE
**Years:** 2-1

**Question:** Given `n` non-negative integers `height[i]`, find two lines that with the x-axis form a container holding the most water.

**Approach:** Two pointers at both ends. Area = `min(h[l], h[r]) * (r - l)`. Move the shorter side inward (moving the taller side cannot increase area since width strictly shrinks). O(n).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Moving the taller side can never increase area.
- Width strictly decreases each step, so we must improve height.
- Ties can advance either pointer.

**Tags:** #algorithm

---

### 28. 3Sum

**Difficulty:** Medium
**Topics:** two-pointers, sorting, arrays
**Position:** SWE
**Years:** 2-1

**Question:** Given an integer array `nums`, return all unique triplets `[a, b, c]` such that `a + b + c == 0`.

**Approach:** Sort. Fix `i`, two-pointer (`l = i+1`, `r = n-1`) on the remainder. Skip duplicates for `i`, `l`, `r` to avoid repeats. O(n²) time, O(1) extra. Classic ByteDance opener.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Sorting unlocks both the two-pointer scan and duplicate-skipping.
- Skip dups at the fixed `i` and after each match.
- Break early when `nums[i] > 0` for further speedup.

**Tags:** #algorithm

---

### 29. Letter Combinations of a Phone Number

**Difficulty:** Medium
**Topics:** backtracking, recursion, strings
**Position:** SWE
**Years:** 2-1

**Question:** Given a string of digits 2-9, return all possible letter combinations the number could represent (phone keypad mapping).

**Approach:** Backtracking with mapping `'2' → "abc"` etc. Recurse digit by digit, append a char, recurse, pop. O(4^n · n) worst case. Iterative BFS over the result list also works.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Output size is `prod(map[d].length)`, up to 4^n.
- Mutable buffer + pop is cleaner than rebuilding strings.
- Empty input returns empty list, not `[""]`.

**Tags:** #algorithm

---

### 30. Generate Parentheses

**Difficulty:** Medium
**Topics:** backtracking, recursion, strings
**Position:** SWE
**Years:** 2-1

**Question:** Given `n` pairs of parentheses, generate all combinations of well-formed parentheses.

**Approach:** Backtrack with counts `open`, `close`. Add `'('` if `open < n`; add `')'` if `close < open`. Stop when length == 2n. Output count is Catalan number C(n).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Pruning by `op < n` and `cl < op` guarantees validity.
- Output size = C(n), the n-th Catalan number.
- String concatenation is fine since each path is independent.

**Complexity:** O(4ⁿ / √n) — the n-th Catalan number of valid strings, each of length 2n. Recursion depth is O(n).

**Tags:** #algorithm

---

### 31. Merge K Sorted Lists

**Difficulty:** Hard
**Topics:** heap, linked-list, divide-and-conquer
**Position:** SWE
**Years:** 2-2

**Question:** You are given an array of `k` sorted linked lists. Merge them into one sorted list.

**Approach:** Min-heap of size k holding the current head of each list. Pop smallest, append to result, push its `next`. O(N log k). Alternative: divide-and-conquer pairwise merging — same complexity, often faster in practice.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Tuple's index tiebreaker prevents heap from comparing nodes.
- Divide-and-conquer also yields O(N log k) without a heap.
- Heap size stays bounded at k.

**Tags:** #algorithm

---

### 32. Trapping Rain Water

**Difficulty:** Hard
**Topics:** two-pointers, dp, monotonic-stack
**Position:** SWE
**Years:** 2-2

**Question:** Given `n` non-negative integers representing an elevation map, compute how much water it can trap after raining.

**Approach:** Two pointers `l, r` with running `leftMax, rightMax`. Whichever side is smaller is the bottleneck: water at that index = `sideMax - height`, advance the pointer inward. O(n) time, O(1) space. Monotonic-stack solution also classic.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- The smaller side's running max is guaranteed to cap the water level.
- Move whichever pointer corresponds to the smaller bar.
- O(1) extra space; no prefix/suffix arrays needed.

**Tags:** #algorithm

---

### 33. Permutations

**Difficulty:** Medium
**Topics:** backtracking, recursion, arrays
**Position:** SWE
**Years:** 2-1

**Question:** Given an array `nums` of distinct integers, return all possible permutations.

**Approach:** Backtracking with `used[]` boolean array (or swap-in-place). Pick an unused element, recurse, unmark. O(n · n!). Follow-up: Permutations II with duplicates — sort + skip `nums[i] == nums[i-1] && !used[i-1]`.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Total work is O(n * n!) because copying each permutation costs n.
- `used` array avoids `O(n)` membership checks.
- Swap-in-place variant saves the `used` array.

**Tags:** #algorithm

---

### 34. Rotate Image

**Difficulty:** Medium
**Topics:** matrix, math, in-place
**Position:** SWE
**Years:** 2-1

**Question:** Rotate an n×n 2D matrix 90 degrees clockwise in place.

**Approach:** Transpose the matrix (swap `m[i][j]` with `m[j][i]` for `j > i`), then reverse each row. Equivalent: rotate four corners at a time in concentric squares. O(n²), O(1) extra.

**Python:**
```python
def rotate(matrix: list[list[int]]) -> None:
    n = len(matrix)
    for i in range(n):
        for j in range(i + 1, n):
            matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
    for row in matrix:
        row.reverse()
```

**TypeScript:**
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

**Java:**
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

**Key points:**
- Transpose + horizontal flip equals 90 deg clockwise rotation.
- Only iterate upper triangle in transpose to avoid double-swapping.
- O(1) extra space, all in-place.

**Tags:** #algorithm

---

### 35. Group Anagrams

**Difficulty:** Medium
**Topics:** hash-map, strings, sorting
**Position:** SWE
**Years:** 2-1

**Question:** Given an array of strings, group the anagrams together.

**Approach:** HashMap keyed by sorted-string (or 26-length count tuple). For each word, compute its canonical key and append to the bucket. O(N · K log K) with sort key; O(N · K) with count key.

**Python:**
```python
def group_anagrams(strs: list[str]) -> list[list[str]]:
    groups: dict[str, list[str]] = {}
    for s in strs:
        key = "".join(sorted(s))
        groups.setdefault(key, []).append(s)
    return list(groups.values())
```

**TypeScript:**
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

**Java:**
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

**Key points:**
- Sorted string is the simplest canonical form.
- 26-length count vector key avoids sorting overhead.
- Output group order is not specified.

**Tags:** #algorithm

---

### 36. Pow(x, n)

**Difficulty:** Medium
**Topics:** math, recursion, binary-exponentiation
**Position:** SWE
**Years:** 2-1

**Question:** Implement `pow(x, n)` (x^n) without using built-in power.

**Approach:** Fast exponentiation: if n is negative, invert x and negate n (careful with `INT_MIN`). Recurse on `half = pow(x, n/2)`; result = `half*half` (`*x` if n odd). O(log n).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Iterative binary exponentiation avoids recursion stack.
- Handle negative `n` by inverting `x` once up front.
- Each iteration halves `n`, giving O(log |n|) multiplications.

**Tags:** #algorithm

---

### 37. N-Queens

**Difficulty:** Hard
**Topics:** backtracking, recursion
**Position:** SWE
**Years:** 2-2

**Question:** Place `n` queens on an n×n chessboard so no two attack each other. Return all distinct solutions.

**Approach:** Backtrack row-by-row. Track three sets: occupied columns, "/" diagonals (`row + col`), "\" diagonals (`row - col`). Try each col in current row that doesn't clash, recurse, unmark. O(n!).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- `r + c` and `r - c` uniquely identify the two diagonal families.
- Place exactly one queen per row by recursion depth.
- Sets give O(1) conflict checks.

**Tags:** #algorithm

---

### 38. Spiral Matrix

**Difficulty:** Medium
**Topics:** matrix, simulation
**Position:** SWE
**Years:** 2-1

**Question:** Given an m×n matrix, return all elements in spiral order.

**Approach:** Maintain four boundaries `top, bottom, left, right`. Walk top row L→R (top++), right col T→B (right--), bottom row R→L if top<=bottom (bottom--), left col B→T if left<=right (left++). Repeat while bounds valid. O(m·n).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Re-check bounds before bottom row and left column to handle single-row/col cases.
- Each cell is visited exactly once.
- Four-boundary tracking generalizes to arbitrary rectangles.

**Tags:** #algorithm

---

### 39. Merge Intervals

**Difficulty:** Medium
**Topics:** sorting, intervals, arrays
**Position:** SWE
**Years:** 2-1

**Question:** Given an array of intervals `[start, end]`, merge all overlapping intervals.

**Approach:** Sort by start. Iterate; for each interval, if it overlaps the last merged (`cur.start <= last.end`), extend `last.end = max(last.end, cur.end)`; else append. O(n log n).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Sorting is the dominant O(n log n) cost.
- Compare to the last appended end, not the original.
- Touching intervals (`s == last.end`) count as overlapping here.

**Tags:** #algorithm

---

### 40. Minimum Window Substring

**Difficulty:** Hard
**Topics:** sliding-window, hash-map, strings
**Position:** SWE
**Years:** 2-2

**Question:** Given strings `s` and `t`, return the minimum window substring of `s` containing all characters of `t` (with multiplicity).

**Approach:** Sliding window with `need[]` counts and a `matched` counter. Expand `right`; when all chars satisfied, shrink `left` while window remains valid, tracking smallest. O(|s| + |t|).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- `formed` tracks how many distinct chars are at-or-above required counts.
- Shrink the window whenever valid to find a smaller answer.
- Strict equality on increment/decrement avoids double counting.

**Tags:** #algorithm

---

### 41. Largest Rectangle in Histogram

**Difficulty:** Hard
**Topics:** monotonic-stack, arrays
**Position:** SWE
**Years:** 2-2

**Question:** Given histogram bar heights, find the area of the largest rectangle.

**Approach:** Monotonic increasing stack of indices. Push if `heights[i] >= heights[stack.top()]`; otherwise pop, and for each popped bar compute area `h * (i - newTop - 1)`. Append a sentinel 0 at end to flush. O(n).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Sentinel 0 at the end flushes any remaining stack entries.
- Width is bounded by previous-smaller index on the left and current i on the right.
- Each index is pushed and popped at most once: O(n).

**Tags:** #algorithm

---

### 42. Maximal Rectangle

**Difficulty:** Hard
**Topics:** dp, monotonic-stack, matrix
**Position:** SWE
**Years:** 3-1

**Question:** Given a 2D binary matrix of '0' and '1', find the largest rectangle containing only 1's.

**Approach:** For each row, build a histogram of consecutive 1's ending at that row (column-wise heights). Run "Largest Rectangle in Histogram" on each row's heights. Take the max. O(m·n).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Reuse Largest Rectangle in Histogram per row.
- Heights track consecutive 1s above and including this row.
- Total cost O(m * n) since the inner call is O(cols).

**Tags:** #algorithm

---

### 43. Word Break

**Difficulty:** Medium
**Topics:** dp, strings, hash-set
**Position:** SWE
**Years:** 2-1

**Question:** Given `s` and a dictionary `wordDict`, return true if `s` can be segmented into a space-separated sequence of dictionary words.

**Approach:** 1D DP. `dp[i]` = can `s[:i]` be segmented. `dp[0] = true`. `dp[i] = any(dp[j] && s[j:i] in dict)` for `j < i`. O(n² · L) with hash lookup; Trie speeds up substring checks.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- DP state captures "first i chars segmentable".
- Inner break short-circuits on first valid split.
- Trie or limiting `j` by max word length gives further speedup.

**Tags:** #algorithm

---

### 44. Word Break II

**Difficulty:** Hard
**Topics:** dp, backtracking, strings, memoization
**Position:** SWE
**Years:** 3-1

**Question:** Like Word Break, but return ALL possible sentence segmentations of `s`.

**Approach:** Memoized DFS: `solve(i)` returns list of sentences for `s[i:]`. For each word starting at `i` in dict, recurse on `solve(i + len(word))` and prepend the word. Cache by index. Exponential output worst case; memo prevents recomputation.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Memoization keys by start index so each suffix is solved once.
- Base case returns `[""]` so prepending a word gives just the word.
- Output may still be exponential; memo only helps shared sub-suffixes.

**Complexity:** O(n²) distinct subproblems with memoization, but the answer set can be exponential, so total time is O(n² + |output|).

**Tags:** #algorithm

---

### 45. Linked List Cycle II

**Difficulty:** Medium
**Topics:** linked-list, two-pointers, floyd
**Position:** SWE
**Years:** 2-1

**Question:** Given a linked list, return the node where the cycle begins, or null if no cycle.

**Approach:** Floyd's tortoise and hare. Detect meeting point with slow/fast. Then move one pointer back to head and walk both one step at a time — they meet at the cycle entrance. O(n) time, O(1) space.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Distance head-to-start equals distance meeting-to-start mod cycle length.
- Works even when start is head itself.
- Two pointer chase costs at most one extra pass.

**Tags:** #algorithm

---

### 46. Sort List

**Difficulty:** Medium
**Topics:** linked-list, merge-sort, divide-and-conquer
**Position:** SWE
**Years:** 2-2

**Question:** Sort a linked list in O(n log n) time and O(1) extra space (ideally).

**Approach:** Merge sort on linked list. Find mid via slow/fast, split, recursively sort each half, merge two sorted lists. O(n log n) time, O(log n) stack. Bottom-up iterative merge sort achieves O(1) extra space.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Splitting with `slow, fast = head, head.next` avoids infinite recursion at length 2.
- Merge is stable and O(n + m).
- Iterative bottom-up merge sort reaches O(1) extra space.

**Tags:** #algorithm

---

### 47. Maximum Product Subarray

**Difficulty:** Medium
**Topics:** dp, arrays
**Position:** SWE
**Years:** 2-1

**Question:** Given an integer array `nums`, find a contiguous subarray with the largest product.

**Approach:** Track running `maxProd` and `minProd` (a negative * negative can swap them). For each num, `candidates = (num, num*maxProd, num*minProd)`; update both. Update global best. O(n).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Swap hi/lo on a negative number before updating.
- Zero resets both hi and lo to the current element.
- Tracking only `hi` would miss negative-negative flips.

**Tags:** #algorithm

---

### 48. Min Stack

**Difficulty:** Medium
**Topics:** stack, design
**Position:** SWE
**Years:** 2-1

**Question:** Design a stack that supports push, pop, top, and retrieving the minimum element in O(1).

**Approach:** Two stacks: main stack and a "min" stack. On push, also push `min(val, minStack.top())` to min stack. On pop, pop both. Top of min stack is always the current minimum. O(1) per op.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Min stack mirrors main stack length for O(1) updates.
- A space-saving variant stores only strict minimums.
- All four operations are O(1).

**Tags:** #algorithm

---

### 49. Find Peak Element

**Difficulty:** Medium
**Topics:** binary-search, arrays
**Position:** SWE
**Years:** 2-1

**Question:** A peak element is strictly greater than its neighbors. Given an array `nums` where adjacent elements differ, find any peak index in O(log n).

**Approach:** Binary search. At `mid`, compare `nums[mid]` and `nums[mid+1]`: if `nums[mid] < nums[mid+1]` a peak lies to the right (`lo = mid + 1`); else to the left or at mid (`hi = mid`). Converges to a peak. O(log n).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Adjacent inequality guarantees an "uphill" direction always exists.
- Loop ends when `lo == hi`, pointing at a peak.
- Sentinel `-inf` outside the array is implicit.

**Tags:** #algorithm

---

### 50. House Robber II

**Difficulty:** Medium
**Topics:** dp, arrays
**Position:** SWE
**Years:** 2-1

**Question:** Houses are arranged in a circle (first and last are adjacent). Find the max sum you can rob with no two adjacent.

**Approach:** Reduce to House Robber I twice: once on `nums[0..n-2]` (exclude last) and once on `nums[1..n-1]` (exclude first). Return max. O(n).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Circle handled by running linear robber twice on two slices.
- Single-house edge case must short-circuit.
- O(n) time, O(1) auxiliary per run.

**Tags:** #algorithm

---

### 51. Course Schedule

**Difficulty:** Medium
**Topics:** graph, topological-sort, bfs, dfs
**Position:** SWE
**Years:** 2-1

**Question:** Given `numCourses` and `prerequisites[i] = [a, b]` (must take b before a), return true if you can finish all courses.

**Approach:** Detect a cycle in a directed graph. Kahn's BFS topological sort: compute in-degrees, enqueue zero-in-degree nodes, decrement neighbors; if processed count == numCourses, no cycle. O(V+E). DFS with 3-color marking also works.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Topological order exists iff DAG has no cycles.
- Kahn's BFS naturally counts processed nodes.
- O(V + E) time, linear in input size.

**Tags:** #algorithm

---

### 52. Implement Trie (Prefix Tree)

**Difficulty:** Medium
**Topics:** trie, design, strings
**Position:** SWE
**Years:** 2-1

**Question:** Implement a trie with `insert(word)`, `search(word)`, and `startsWith(prefix)`.

**Approach:** Node with 26-array (or HashMap) of children and `isEnd` flag. Insert: walk/create nodes per char, mark end. Search: walk, require `isEnd`. StartsWith: just walk. O(L) per op.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Each operation is O(L) where L is the word/prefix length.
- `end` flag distinguishes full words from prefixes.
- Map-based children adapt to any alphabet at slight overhead vs fixed array.

**Tags:** #algorithm

---

### 53. Top K Frequent Elements

**Difficulty:** Medium
**Topics:** heap, hash-map, bucket-sort
**Position:** SWE
**Years:** 2-1

**Question:** Given an integer array and integer k, return the k most frequent elements.

**Approach:** HashMap freq counter. Either (a) min-heap of size k → O(N log k), or (b) bucket sort indexed by frequency → O(N). ByteDance prefers the O(N) bucket approach as a follow-up.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Frequency is bounded by n, enabling O(n) bucket sort.
- Min-heap variant gives O(n log k) and uses less memory.
- Tie-breaking among equal-freq values is unspecified.

**Tags:** #algorithm

---

### 54. Kth Largest Element in an Array

**Difficulty:** Medium
**Topics:** heap, quickselect, arrays
**Position:** SWE
**Years:** 2-1

**Question:** Find the kth largest element in an unsorted array.

**Approach:** Quickselect: pick pivot, partition; recurse only on the side containing rank k. Average O(n), worst O(n²) (mitigate with random pivot or median-of-medians). Min-heap of size k → O(N log k) is the simpler fallback.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Heap: O(n log k), simple and stable.
- Quickselect: average O(n) by recursing on only one partition side.
- Random pivot avoids adversarial worst-case input.

**Tags:** #algorithm

---

### 55. LFU Cache

**Difficulty:** Hard
**Topics:** design, hash-map, linked-list
**Position:** Senior SWE
**Years:** 3-1

**Question:** Design and implement a Least Frequently Used (LFU) cache with O(1) get and put.

**Approach:** Two HashMaps + buckets: `key→node`, `freq→doubly-linked list of nodes` (in recency order within same freq). Track `minFreq`. On access, move node from `freq` list to `freq+1` list (create if missing); update minFreq if `freq` list becomes empty. Evict: remove tail of `minFreq` list.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Ordered Map per frequency preserves LRU tiebreak among same-freq keys.
- `minFreq` resets to 1 on every new insert.
- All operations remain O(1) amortized.

**Tags:** #algorithm

---

### 56. Serialize and Deserialize Binary Tree

**Difficulty:** Hard
**Topics:** tree, bfs, dfs, design
**Position:** SWE
**Years:** 2-2

**Question:** Design an algorithm to serialize a binary tree to a string and deserialize it back.

**Approach:** Preorder DFS with null markers ("#"). Serialize: recursive, append "val," or "#," for null. Deserialize: split on ",", consume tokens via index, build recursively. O(n).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Preorder traversal uniquely reconstructs the tree with null markers.
- Shared iterator/index keeps deserialization linear.
- Works for negative values and skewed trees.

**Tags:** #algorithm

---

### 57. Binary Tree Maximum Path Sum

**Difficulty:** Hard
**Topics:** tree, dfs, recursion
**Position:** SWE
**Years:** 2-2

**Question:** Given a non-empty binary tree, find the maximum path sum (path may start and end at any nodes; must go through parent-child connections).

**Approach:** Post-order DFS. For each node compute `gain = node.val + max(0, leftGain, rightGain` separately — but the candidate path through node = `node.val + max(0,left) + max(0,right)`, update global max. Return `node.val + max(0, max(left, right))` to parent.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Negative subtree contributions clamp to 0.
- Candidate path through a node uses BOTH children; return value to parent uses only ONE.
- Global `best` is updated post-order at every node.

**Complexity:** O(n) — one post-order visit per node; O(h) recursion-stack space where h is the tree height.

**Tags:** #algorithm

---

### 58. LRU Cache

**Difficulty:** Medium
**Topics:** design, hash-map, doubly-linked-list
**Position:** SWE
**Years:** 2-1

**Question:** Design a Least Recently Used (LRU) cache with O(1) get and put.

**Approach:** HashMap `key → node` + doubly linked list (head = MRU, tail = LRU). On get/put, move node to head. On overflow, evict tail. All ops O(1).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- JS Map and Python OrderedDict preserve insertion order.
- Re-insert on access to mark as most recently used.
- Evict the oldest entry when over capacity.

**Tags:** #algorithm

---

### 59. Decode Ways

**Difficulty:** Medium
**Topics:** dp, strings
**Position:** SWE
**Years:** 2-1

**Question:** A digit string can be decoded as letters (A=1...Z=26). Return the number of ways to decode `s`.

**Approach:** 1D DP. `dp[i]` = ways to decode `s[:i]`. `dp[0] = 1`. If `s[i-1] != '0'`, `dp[i] += dp[i-1]`. If `s[i-2..i]` in [10,26], `dp[i] += dp[i-2]`. Watch leading zeros. O(n).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- '0' is decodable only as the second digit of 10 or 20.
- Two rolling variables suffice; no need for full DP array.
- Leading '0' yields 0 ways immediately.

**Tags:** #algorithm

---

### 60. Coin Change

**Difficulty:** Medium
**Topics:** dp, arrays
**Position:** SWE
**Years:** 2-1

**Question:** Given coins of different denominations and an amount, return the fewest coins needed to make that amount, or -1 if impossible.

**Approach:** Unbounded knapsack DP. `dp[a] = min(dp[a - c] + 1)` over coins c. `dp[0] = 0`, rest = ∞. O(amount · #coins). BFS over amounts also works.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- `amount + 1` is a safe "infinity" since at most `amount` coins of value 1 are needed.
- Bottom-up order ensures each subproblem already solved.
- Unbounded knapsack: a coin can be reused.

**Tags:** #algorithm

---

### 61. Number of Islands

**Difficulty:** Medium
**Topics:** dfs, bfs, union-find, matrix
**Position:** SWE
**Years:** 2-1

**Question:** Given a 2D grid of '1' (land) and '0' (water), count the number of islands (4-directionally connected land).

**Approach:** Scan grid; on each unvisited '1', DFS/BFS marking all reachable land as visited and increment count. O(m·n). Union-Find alternative also accepted. Follow-up: streaming "Number of Islands II" with Union-Find.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Marking visited in place (set to '0') avoids extra memory.
- Each cell is visited O(1) times → O(m * n) total.
- BFS variant avoids deep recursion on huge grids.

**Tags:** #algorithm

---

### 62. Design Twitter / Short-Video Feed

**Difficulty:** Hard
**Topics:** design, heap, hash-map
**Position:** SWE
**Years:** 2-2

**Question:** Design a simplified short-video / tweet feed: postTweet, getNewsFeed (10 most recent from user and followees), follow, unfollow.

**Approach:** Per-user list of (timestamp, tweetId). Follow graph as `userId → set<followeeId>`. getNewsFeed: k-way merge of recent tweets from user + followees using a max-heap by timestamp (only push the head of each list, pop top, push its predecessor). O(F log F) per feed call where F = number of followees. Global incrementing timestamp ensures total order.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Global timestamp gives total order of tweets across users.
- Heap-based k-way merge avoids scanning every tweet.
- A user follows themselves implicitly via the feed query.

**Tags:** #algorithm

---

## Tips specific to ByteDance

- **The coding bar is no joke.** Practice Hard-tagged DP, graph (Dijkstra/Bellman-Ford/topo sort), and bit manipulation. They expect optimal O() on the first try.
- **Be ready for back-to-back rounds.** Energy management matters; the marathon format is the unspoken challenge.
- **For TikTok roles, have an opinion on the algorithm.** Read about Monolith (ByteDance's open-source recommendation framework) and have a take on real-time learning.
- **Mandarin is a plus** but not required for US/global roles. If you speak it, mention it — some rounds may flex to Mandarin if both sides prefer.
- **Don't underestimate the HR rounds.** They probe cultural fit and "speed of iteration" hard. Have crisp examples.

## Resources

- LeetCode "ByteDance" and "TikTok" company tags (high overlap with the LC Hard tag)
- ByteDance's open-source: Monolith (recommendation), CloudWeGo (Go RPC)
- "Recommender Systems Handbook" — Ricci et al.
- 1point3acres.com forum for Chinese-language interview reports
