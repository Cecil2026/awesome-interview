# Google

```yaml
company: Google (Alphabet)
typical_rounds: 1 recruiter chat + 1 phone screen + 4-5 onsite (3 coding, 1 system design at L5+, 1 Googleyness/Leadership)
focus_areas: algorithms, data structures, system design at scale, Googleyness
languages_allowed: any major language; Python/Java/C++/Go most common
duration: 45 min coding rounds, 45-60 min system design
notable_quirks:
  - Code is written in a shared doc (no auto-complete, no compiler)
  - Hiring committee reviews packets; your interviewers do not decide
  - "Googleyness" round probes ambiguity-handling, collaboration, intellectual humility
  - Expect deep follow-ups: "now what if the input is 10TB?" / "now make it concurrent"
sources: Glassdoor, LeetCode Discuss (google tag), Blind, levels.fyi
```

## Overview

Google's loop is heavy on classical algorithms (graphs, DP, data structure design) and on scaling/extending an initial solution. Interviewers strongly value clean code, correct edge cases, and clear reasoning under follow-up pressure. System design at L5+ leans on Google-flavored infra (GFS, Bigtable, Spanner, MapReduce) — not because you need to name-drop, but because the trade-offs (consistency vs availability, batch vs stream) come up constantly.

## Questions

### 1. Word Ladder

**Difficulty:** Medium
**Topics:** graph, bfs, strings, hashmap
**Position:** SWE
**Years:** L3-L4

**Question:** Given two words `beginWord` and `endWord`, and a dictionary `wordList`, return the length of the shortest transformation sequence from `beginWord` to `endWord`, where each transformation changes exactly one letter and every intermediate word must be in `wordList`. Return 0 if no such sequence exists.

**Approach:** BFS on a graph where nodes are words and edges connect words differing by one letter. Pre-build an index of `*at -> [bat, cat, hat]` patterns to find neighbors in O(L) instead of comparing against every word. Bidirectional BFS halves the search space. Time O(N * L^2), space O(N * L).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Wildcard pattern index gives O(L) neighbor lookup instead of O(N*L) pairwise.
- BFS guarantees shortest path; mark visited on enqueue to avoid re-expansion.
- Bidirectional BFS from both ends cuts the explored frontier exponentially.

**Follow-ups:**
- Bidirectional BFS from both ends — quantify the speedup in big-O.
- Word Ladder II — return one (or all) shortest transformation sequences.
- Dictionary changes between queries — maintain the pattern index incrementally.
- Compare BFS to A* with a heuristic distance to the target word.

**Common Pitfalls:**
- Rebuilding the wildcard pattern index inside the BFS loop instead of once up front.
- Marking visited only at dequeue, allowing exponential re-expansion of the same node.

**Tags:** #algorithm

---

### 2. Number of Islands

**Difficulty:** Medium
**Topics:** graph, dfs, bfs, union-find, matrix
**Position:** SWE
**Years:** L3-L4

**Question:** Given an `m x n` 2D binary grid where `'1'` is land and `'0'` is water, return the number of islands (an island is a maximal group of horizontally/vertically adjacent land cells).

**Approach:** Iterate cells; on each unvisited `'1'`, DFS/BFS to mark the whole island, increment count. Mark visited in-place (flip to `'0'`) to save space. O(m*n) time, O(m*n) worst-case recursion stack. Follow-up Google loves: "now the grid streams in row by row — design it" → union-find with row-by-row merging.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- In-place marking avoids an O(m*n) visited matrix.
- Each cell is visited at most once, giving O(m*n) overall.
- BFS variant avoids deep recursion stacks on large islands.

**Follow-ups:**
- Streaming grid: rows arrive one at a time — switch to union-find with row-by-row merge.
- Compute largest island size, perimeter, or count of fully-enclosed islands.
- Diagonal adjacency counts as connected — generalize the neighbor set.
- Grid sharded across machines — union-find by global coordinates to merge boundaries.

**Common Pitfalls:**
- Not flipping the cell before recursing into neighbors — infinite recursion.
- DFS recursion depth blows the stack on giant grids — fall back to an explicit BFS queue.

**Tags:** #algorithm

---

### 3. Longest Substring Without Repeating Characters

**Difficulty:** Medium
**Topics:** strings, sliding-window, hashmap
**Position:** SWE
**Years:** L3-L4

**Question:** Given a string `s`, find the length of the longest substring without repeating characters.

**Approach:** Sliding window with a hashmap of `char -> last_index`. When a duplicate is seen inside the window, move `left` to `max(left, last_index + 1)`. O(n) time, O(min(n, alphabet)) space. Edge cases: empty string, all unique, Unicode.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Only advance `left`, never move it backward.
- Map stores most recent index of each character.
- O(n) time, O(min(n, alphabet)) space.

**Follow-ups:**
- Return the substring itself, not just its length.
- Generalize to "longest substring with at most k duplicates".
- Streaming characters — maintain the answer online.
- Compare a hashmap (any chars) version to a fixed-size array (ASCII / a-z).

**Common Pitfalls:**
- Setting `left = last[c] + 1` even when the duplicate is already outside the window.
- Using `r - l` instead of `r - l + 1` — the length is off by one.

**Tags:** #algorithm

---

### 4. Meeting Rooms II

**Difficulty:** Medium
**Topics:** heap, sorting, sweep-line, intervals
**Position:** SWE
**Years:** L3-L4

**Question:** Given an array of meeting time intervals `[start, end]`, return the minimum number of conference rooms required.

**Approach:** Sort by start; use a min-heap of end times. For each meeting, if the earliest-ending room ends `<= start`, reuse it (pop+push); else push (allocate new room). Heap size at end is the answer. Alternative: sweep-line with separate start/end arrays. O(n log n).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Heap top = earliest-finishing meeting, the only candidate for reuse.
- Sorting by start ensures we consider meetings in chronological order.
- O(n log n) dominated by sort and heap ops.

**Follow-ups:**
- Assign each meeting a concrete room id, not just the count.
- Multi-day scheduling with room capacities and equipment constraints.
- Streaming arrivals and cancellations — maintain the minimum rooms dynamically.
- Allow shifting any meeting by ±Δ minutes to minimize the room count.

**Common Pitfalls:**
- Sorting by end time only — loses the chronological reuse logic.
- Treating `end == start` as overlap; the problem normally allows back-to-back meetings.

**Tags:** #algorithm

---

### 5. Decode String

**Difficulty:** Medium
**Topics:** stack, strings, recursion
**Position:** SWE
**Years:** L3-L4

**Question:** Given an encoded string like `"3[a2[c]]"`, decode it to `"accaccacc"`. The encoding rule is `k[encoded_string]`, repeating `encoded_string` `k` times. `k` is always a positive integer.

**Approach:** Two stacks — one for counts, one for partial strings. On `[`, push current count and current string and reset both. On `]`, pop and combine. Alternative: recursive descent parser. Watch multi-digit counts. O(n * max_k).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Two stacks decouple count tracking from string building.
- Multi-digit numbers accumulate via `k = k*10 + digit`.
- On `]`, the current string is the inner expansion repeated `k` times, appended to the saved outer string.

**Follow-ups:**
- Arbitrary nesting depth — stress-test for stack-vs-recursion robustness.
- Counts overflow 32-bit ints — discuss BigInt or capping with explicit error.
- Streaming input — emit decoded characters as parsing progresses.
- Reverse direction: encode an arbitrary string with the minimum encoded length.

**Common Pitfalls:**
- Handling only single-digit `k` — must accumulate multi-digit counts.
- Pushing string and count separately so they get misaligned across nested `]`.

**Tags:** #algorithm

---

### 6. Find Median from Data Stream

**Difficulty:** Hard
**Topics:** heap, design, streaming
**Position:** SWE
**Years:** L5

**Question:** Design a data structure that supports `addNum(int num)` and `findMedian()`. Numbers arrive one at a time; `findMedian` must run in O(log n) or better.

**Approach:** Two heaps — max-heap `lo` holds the smaller half, min-heap `hi` holds the larger half. Maintain `len(lo) == len(hi)` or `len(lo) == len(hi)+1`. Add: push to lo, move top of lo to hi, rebalance. Median is `lo.top()` or `(lo.top() + hi.top())/2`. O(log n) add, O(1) median.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Two heaps split the stream so each top is the boundary candidate.
- Invariant `len(lo) >= len(hi)` keeps median in O(1) at `lo`'s top.
- Cross-push-then-rebalance handles both new elements correctly.

**Follow-ups:**
- Median over a sliding window of size k — different problem class, different data structure.
- 99th percentile (or arbitrary percentile) in O(log n) per query.
- Bounded memory for a huge stream — reservoir sampling or t-digest approximation.
- Concurrent writers — how do you keep the two heaps consistent without serializing every write?

**Common Pitfalls:**
- Forgetting to negate values when simulating a max-heap in Python `heapq`.
- Pushing to `hi` first; balance logic then leaves `lo` empty after the very first insert.

**Tags:** #algorithm

---

### 7. Longest Increasing Path in a Matrix

**Difficulty:** Hard
**Topics:** dp, dfs, memoization, graph
**Position:** SWE
**Years:** L5

**Question:** Given an `m x n` matrix of integers, return the length of the longest strictly increasing path. You may move 4-directionally.

**Approach:** DFS with memoization — `dp[i][j]` = longest increasing path starting at `(i,j)`. Recurse into neighbors with larger values; cache result. No visited set needed because strict increase prevents cycles. O(m*n) time/space.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Strict-increase constraint forms a DAG, so no visited set is needed.
- Memoization gives O(m*n) overall — each cell solved once.
- Each cell explores up to 4 neighbors, constant per cell.

**Follow-ups:**
- Return the path itself, not just its length — store a predecessor in memo.
- Diagonal moves allowed — generalize the neighbor set.
- Strict-increase relaxed to non-decreasing — now you need cycle detection.
- Very large matrix — topological order over the DAG instead of recursive DFS.

**Common Pitfalls:**
- Treating it as a generic graph and adding visited tracking, which destroys complexity.
- Recursing without the strict-greater check — equal cells cause infinite recursion.

**Tags:** #algorithm

---

### 8. Maximum Profit in Job Scheduling

**Difficulty:** Hard
**Topics:** dp, binary-search, sorting, intervals
**Position:** SWE
**Years:** L5

**Question:** Given `n` jobs with `startTime[i]`, `endTime[i]`, `profit[i]`, return the maximum profit such that no two chosen jobs overlap in time.

**Approach:** Sort jobs by end time. `dp[i]` = max profit using first `i` jobs. For job `i`, either skip (`dp[i-1]`) or take (`profit[i] + dp[j]` where `j` is the last job ending `<= start[i]`, found via binary search). O(n log n).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Sorting by end time enables binary search for the last compatible job.
- `dp[i]` decision is binary: take or skip job `i`.
- O(n log n) overall — sort + n binary searches.

**Follow-ups:**
- Allow at most k overlapping jobs — generalizes to multi-machine scheduling.
- Add setup time between consecutive jobs.
- Maximize number of jobs instead of profit — classic activity selection.
- Stream of jobs arriving — maintain best profit dynamically.

**Common Pitfalls:**
- Sorting by start time instead of end time; the binary search target then makes no sense.
- Binary searching `start[j]` instead of `end[j]` for the last compatible job.

**Tags:** #algorithm

---

### 9. Design Google Docs (collaborative editor)

**Difficulty:** Hard
**Topics:** system-design, crdt, operational-transform, websockets, consistency
**Position:** Senior SWE
**Years:** L5

**Question:** Design a real-time collaborative document editor like Google Docs supporting multiple concurrent editors.

**Approach:** Core problem is concurrent edits with eventual consistency. Two main techniques: Operational Transformation (OT — what Google Docs actually uses) or CRDTs. Client sends operations to a per-document server (sticky session via consistent hashing on doc ID). Server serializes ops, broadcasts via WebSocket to all collaborators. Persist op log + periodic snapshots in a distributed store (Bigtable/Spanner). Trade-offs: OT needs a central server but compact ops; CRDTs are peer-to-peer-friendly but metadata-heavy. Discuss cursor presence, offline editing, undo.

**Follow-ups:**
- OT vs CRDT — when do you pick each and what are the trade-offs?
- Mobile offline editing — how do you reconcile diverged histories on reconnect?
- Real-time presence (cursors, selections) — separate channel or piggy-back on the op stream?
- Undo/redo in a multi-user setting — semantic undo vs sequential undo.
- Permissions and access control changing while users are editing.

**Common Pitfalls:**
- Last-write-wins per character — produces garbled text under any concurrent edit.
- Skipping the persisted op log; a server restart loses in-flight concurrent edits.

**Tags:** #system-design

---

### 10. Design Google Search Autocomplete

**Difficulty:** Hard
**Topics:** system-design, trie, caching, ranking, sharding
**Position:** Senior SWE
**Years:** L5

**Question:** Design the typeahead suggestion service that powers Google Search's search box for billions of users.

**Approach:** Trie of prefixes with top-k completions cached at each node (precomputed offline from query logs). Shard by prefix range across many servers. CDN/edge cache for popular prefixes (Zipfian). Fresh queries flow into a streaming pipeline (Dataflow) that updates trie weights hourly. Discuss latency budget (<100ms), personalization (re-rank top-k with user signals), spell correction, profanity filter, and how to update without rebuilding the whole trie.

**Follow-ups:**
- Personalization from signed-in user history — where in the stack does it run?
- Multi-language and IME input — when are suggestions even valid?
- Fresh trends within an hour — what changes in the streaming pipeline?
- Typo tolerance / spell correction — in-trie vs separate ranking service?
- Safety and profanity filtering — at the CDN edge or origin?

**Common Pitfalls:**
- Treating it as a single global trie; ignores sharding and cache locality.
- Recomputing top-k at query time instead of precomputing at trie nodes.

**Tags:** #system-design

---

### 11. Design YouTube

**Difficulty:** Hard
**Topics:** system-design, cdn, video-encoding, sharding, recommendation
**Position:** Senior SWE
**Years:** L5

**Question:** Design YouTube end-to-end: upload, encoding, storage, playback, recommendations.

**Approach:** Upload to blob storage (GCS), enqueue encoding job into pub/sub. Encoders transcode to multiple resolutions/codecs (H.264, VP9, AV1) and chunked HLS/DASH segments. Store metadata in a sharded RDBMS, view counts in a Bigtable-style store with eventual consistency. Playback served from CDN with origin pull. Recommendations: offline candidate generation (matrix factorization, two-tower) + online ranking. Discuss cold start, thumbnail selection, copyright detection (Content ID), and the read/write fan-out for view counts.

**Tags:** #system-design

---

### 12. Design a Distributed Key-Value Store

**Difficulty:** Hard
**Topics:** system-design, consistent-hashing, replication, consensus, sharding
**Position:** Senior SWE
**Years:** L5

**Question:** Design a distributed KV store (think DynamoDB or Bigtable). Cover sharding, replication, consistency, failure handling.

**Approach:** Consistent hashing for shard placement; virtual nodes to smooth load. Replication factor N (typically 3) across racks/zones. Quorum reads/writes (R + W > N for strong consistency). Use Raft or Paxos for per-shard leader election; or Dynamo-style leaderless with vector clocks + read repair. Hinted handoff and Merkle-tree anti-entropy for eventual consistency. Discuss CAP trade-offs explicitly: "I'd choose AP for a shopping cart, CP for inventory."

**Tags:** #system-design

---

### 13. Design Google Drive

**Difficulty:** Hard
**Topics:** system-design, blob-storage, sync, conflict-resolution, chunking
**Position:** Senior SWE
**Years:** L5

**Question:** Design Google Drive: file storage with multi-device sync and sharing.

**Approach:** Chunk files into 4MB blocks, content-addressed by SHA-256 (dedup across users). Store blocks in blob storage; per-user metadata (file tree, ACLs, versions) in a sharded RDBMS. Sync client computes local hashes, diffs against server manifest, uploads only changed chunks (rsync-style). Conflict resolution: keep both versions on concurrent edits. Notifications via long-poll/WebSocket. Discuss sharing model (ACL inheritance), large file uploads (resumable), and end-to-end encryption trade-offs.

**Tags:** #system-design

---

### 14. Design Google Calendar

**Difficulty:** Medium
**Topics:** system-design, scheduling, timezones, recurrence, notifications
**Position:** Senior SWE
**Years:** L5

**Question:** Design Google Calendar with event creation, recurring events, reminders, and free-busy lookup.

**Approach:** Store events as `(owner, start, end, recurrence_rule)` using iCalendar RRULE format — don't materialize every occurrence. Per-user calendar sharded by user_id. Free-busy is range query on event index; for cross-user "find a time" use union of free-busy ranges. Reminders: time-bucketed queue (Chubby/ZK-coordinated) that fires events into a notification service. Time zones are the hard part — store events in UTC + IANA tz id, render in local. Discuss invite RSVP, recurring exceptions, and dial-in integrations.

**Tags:** #system-design

---

### 15. Tell me about a time you disagreed with a teammate

**Difficulty:** Medium
**Topics:** behavioral, conflict, collaboration
**Position:** SWE
**Years:** L3-L4

**Question:** Tell me about a time you strongly disagreed with a teammate or manager. How did you handle it and what was the outcome?

**Approach:** STAR. Pick a *technical* disagreement (Google likes data-driven debate). Show: (1) you understood their position before pushing yours, (2) you proposed concrete data/experiment to resolve, (3) you accepted the outcome gracefully even if you "lost." Avoid stories where you were right and they were wrong all along — Google probes for intellectual humility.

**Tags:** #behavioral

---

### 16. Most challenging project you've worked on

**Difficulty:** Medium
**Topics:** behavioral, ownership, technical-depth
**Position:** SWE
**Years:** L3-L4

**Question:** Walk me through the most technically challenging project you've worked on. What made it hard?

**Approach:** STAR with heavy emphasis on the T (task) and A (action). Be ready for 5-10 minutes of follow-up: "why that algorithm?" / "how did you measure success?" / "what would you do differently?" Pick a project where you can show ownership end-to-end, not just one piece. Quantify impact.

**Tags:** #behavioral

---

### 17. Time you handled ambiguous requirements

**Difficulty:** Medium
**Topics:** behavioral, ambiguity, googleyness
**Position:** Senior SWE
**Years:** L5

**Question:** Tell me about a time you had to work on a project with unclear or shifting requirements.

**Approach:** This is Google's "Googleyness" hallmark. Show: (1) you didn't wait — you proposed a v0 to force clarity, (2) you partnered with PM/stakeholders rather than complaining, (3) you de-risked by shipping iteratively. Land the impact: "we shipped X 2 quarters early because we didn't wait for full spec."

**Tags:** #behavioral

---

### 18. Time you failed

**Difficulty:** Medium
**Topics:** behavioral, failure, growth-mindset
**Position:** SWE
**Years:** L3-L4

**Question:** Tell me about a significant failure. What happened and what did you learn?

**Approach:** Pick a real failure (not "I worked too hard"). Show: (1) you owned it without blaming others, (2) you understood the *systemic* root cause (process gap, missing test, bad assumption), (3) the lesson changed how you work going forward with a concrete example. Bonus: mention the fix benefited the team beyond just you.

**Tags:** #behavioral

---

### 19. Design a rate limiter for the Google API gateway

**Difficulty:** Hard
**Topics:** system-design, rate-limiting, distributed-systems, redis
**Position:** Senior SWE
**Years:** L5

**Question:** Design a rate limiter that enforces per-user / per-API-key quotas across a globally distributed API gateway serving millions of QPS.

**Approach:** Algorithm choice: token bucket (smooth bursts) or sliding window log (accurate). Storage: Redis cluster sharded by user_id with Lua scripts for atomic decrement-and-check. For global limits across regions, use a centralized authority for hard limits or eventual-consistency for soft limits with overshoot tolerance. Discuss tier: per-second (in-process LRU) → per-minute (regional Redis) → per-day (global DB). Failure mode: open vs closed when the limiter is down.

**Tags:** #domain-knowledge

---

### 20. Optimize a slow query in a distributed SQL system

**Difficulty:** Hard
**Topics:** databases, distributed-systems, query-optimization, indexing
**Position:** Senior SWE
**Years:** L5

**Question:** A query on Spanner (or any distributed SQL) is taking 30s when it should take 200ms. Walk me through how you'd debug and fix it.

**Approach:** Start with `EXPLAIN ANALYZE` — look for full table scans, cross-shard joins, hot shards. Check whether the query touches one shard (good) or fans out (bad — likely needs an interleaved table or schema redesign). Look for missing secondary indexes; consider covering indexes to avoid back-lookups. If shard distribution is skewed (one tenant = 50% of data), discuss re-sharding or per-tenant isolation. Mention metrics you'd watch (p99 latency, scan rows, CPU per shard) and discuss whether to denormalize.

**Tags:** #domain-knowledge

---

### 21. Trapping Rain Water

**Difficulty:** Hard
**Topics:** array, two-pointers, dp, stack
**Position:** SWE
**Years:** L3-L5

**Question:** Given `n` non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.

**Approach:** Two-pointer sweep with `left_max` and `right_max`. At each step, the smaller side bounds the water at that column. Increment the smaller side, update its max, accumulate `max - height[i]`. O(n) time, O(1) space. Alternative: monotonic stack to pop "valleys."

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

**Key points:**
- Smaller side's running max bounds the water at that column.
- Single pass with O(1) extra space.
- Edges (l=0, r=n-1) can never hold water.

**Tags:** #algorithm

---

### 22. Serialize and Deserialize Binary Tree

**Difficulty:** Hard
**Topics:** tree, dfs, bfs, design, strings
**Position:** SWE
**Years:** L3-L5

**Question:** Design an algorithm to serialize a binary tree into a string and deserialize it back. The tree may contain duplicate values; structure must be preserved exactly.

**Approach:** Pre-order DFS with explicit null markers (e.g. `1,2,#,#,3,#,#`). Deserialize by consuming tokens recursively. O(n) time and space. Alternative: BFS level order with nulls — slightly more compact for sparse trees but trickier to parse.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Preorder + null markers makes structure unambiguous.
- Shared iterator/index drives deserialization in one linear pass.
- Handles duplicate values since position, not value, defines structure.

**Tags:** #algorithm

---

### 23. Alien Dictionary

**Difficulty:** Hard
**Topics:** graph, topological-sort, bfs, dfs, strings
**Position:** SWE
**Years:** L5+

**Question:** Given a sorted list of words from an alien language using lowercase letters, derive the order of letters in that language. Return any valid order, or an empty string if none exists (cyclic ordering or prefix conflict like `["abc","ab"]`).

**Approach:** Build a directed graph from adjacent word pairs: the first differing char gives an edge `a -> b`. Topological sort via Kahn's algorithm (BFS on zero in-degree) or DFS with cycle detection. Watch the prefix-conflict edge case. O(C) where C = total chars.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Only the first differing character between adjacent words gives an ordering edge.
- Prefix conflict (`["abc","ab"]`) is invalid and returns "".
- Kahn's BFS detects cycles via leftover non-zero in-degrees.

**Tags:** #algorithm

---

### 24. Word Break II

**Difficulty:** Hard
**Topics:** dp, backtracking, strings, trie, memoization
**Position:** SWE
**Years:** L5+

**Question:** Given a string `s` and a dictionary `wordDict`, return all possible sentences where `s` can be segmented into a space-separated sequence of dictionary words. Each word may be reused.

**Approach:** Memoized recursion — `solve(i)` returns all sentences for `s[i:]`. For each `j` where `s[i:j]` is in the dictionary, prepend it to every sentence in `solve(j)`. A trie speeds prefix lookup. Worst case exponential output, but memo keeps suffix work O(1) per cached call.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Memoization by suffix start index avoids exponential re-computation.
- Base case `i == len(s)` returns one empty sentence to seed combinations.
- Output size itself can be exponential — that's inherent to the problem.

**Tags:** #algorithm

---

### 25. Regular Expression Matching

**Difficulty:** Hard
**Topics:** dp, strings, recursion
**Position:** SWE
**Years:** L5+

**Question:** Implement regex matching with `.` (any single char) and `*` (zero or more of the preceding element). Match must cover the entire input string, not partial.

**Approach:** 2D DP — `dp[i][j]` = whether `s[:i]` matches `p[:j]`. If `p[j-1] == '*'`, either zero use (`dp[i][j-2]`) or extend (`dp[i-1][j]` if last char matches). Otherwise require char match and `dp[i-1][j-1]`. O(m*n).

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
                if p[j - 2] == s[i - 1] or p[j - 2] == ".":
                    dp[i][j] = dp[i][j] or dp[i - 1][j]
            else:
                if p[j - 1] == s[i - 1] or p[j - 1] == ".":
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
        if (p[j - 2] === s[i - 1] || p[j - 2] === ".") dp[i][j] = dp[i][j] || dp[i - 1][j];
      } else if (p[j - 1] === s[i - 1] || p[j - 1] === ".") {
        dp[i][j] = dp[i - 1][j - 1];
      }
    }
  }
  return dp[m][n];
}
```

**Java:**
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

**Key points:**
- `*` represents zero (`dp[i][j-2]`) or one-more (`dp[i-1][j]`) of preceding element.
- Initialize first row for patterns like `a*b*c*` matching empty string.
- Must require full match (compare `dp[m][n]`, not any prefix).

**Tags:** #algorithm

---

### 26. Course Schedule II

**Difficulty:** Medium
**Topics:** graph, topological-sort, bfs, dfs
**Position:** SWE
**Years:** L3-L5

**Question:** There are `numCourses` courses labeled `0..n-1`. Given `prerequisites[i] = [a, b]` meaning take `b` before `a`, return any valid ordering of courses to finish them all, or an empty list if impossible.

**Approach:** Kahn's algorithm — compute in-degrees, push all zero-in-degree nodes to a queue, repeatedly pop and decrement neighbors. If output size < n, cycle exists. O(V + E).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- BFS from all zero in-degree nodes processes courses layer by layer.
- Cycle is detected when fewer than `n` nodes are processed.
- O(V + E) — every edge decrements an in-degree exactly once.

**Tags:** #algorithm

---

### 27. Median of Two Sorted Arrays

**Difficulty:** Hard
**Topics:** binary-search, array, divide-and-conquer
**Position:** SWE
**Years:** L5+

**Question:** Given two sorted arrays `nums1` and `nums2` of sizes `m` and `n`, return the median of the merged sorted array in O(log(m+n)) time.

**Approach:** Binary search on the partition of the smaller array. Find `i` in `nums1` and `j = (m+n+1)/2 - i` in `nums2` such that `max(left) <= min(right)` across both halves. O(log(min(m,n))). Tricky edge cases: empty array, all-elements-on-one-side partitions.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Binary search over the partition position in the shorter array.
- Sentinel infinities cleanly handle boundary partitions.
- O(log(min(m,n))) — strictly better than O(log(m+n)) merging.

**Tags:** #algorithm

---

### 28. LRU Cache

**Difficulty:** Medium
**Topics:** design, hashmap, linked-list
**Position:** SWE
**Years:** L3-L5

**Question:** Design a data structure for a Least Recently Used (LRU) cache supporting `get(key)` and `put(key, value)` in O(1) average time, with a fixed capacity. Evict the least-recently-used key on overflow.

**Approach:** Hashmap from key to a node in a doubly-linked list. On access, move node to the head (most-recently-used). On put when over capacity, drop the tail. Every operation O(1). Sentinel head/tail nodes avoid null checks.

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

**Key points:**
- `OrderedDict` / `Map` preserve insertion order, giving O(1) LRU semantics.
- Re-insert on access marks the entry as most-recently-used.
- Evict from the oldest end when capacity is exceeded.

**Tags:** #algorithm

---

### 29. The Skyline Problem

**Difficulty:** Hard
**Topics:** heap, sweep-line, sorting, intervals
**Position:** SWE
**Years:** L5+

**Question:** Given `n` rectangular buildings as `[left, right, height]`, produce the skyline as a list of key points `[x, y]` representing changes in the outline.

**Approach:** Sweep-line over building edges. Use a max-heap (or multiset) of active heights keyed by right edge. At each event, add new heights or remove expired ones; if the current max height differs from the previous, emit a key point. O(n log n). Handle ties (start before end, taller first) carefully.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Sweep-line process events sorted by x; max-heap tracks currently active heights.
- Lazy removal: skip popped entries whose end <= x.
- Emit a key point only when the running max changes.

**Tags:** #algorithm

---

### 30. Sliding Window Maximum

**Difficulty:** Hard
**Topics:** sliding-window, deque, monotonic, array
**Position:** SWE
**Years:** L3-L5

**Question:** Given an integer array `nums` and a window size `k`, return the maximum of each sliding window of size `k` as it slides from left to right.

**Approach:** Monotonic decreasing deque storing indices. Push new index; pop back while it's smaller than current, pop front if it's outside the window. Front is the current max. O(n) total — each index pushed/popped at most once.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Deque stores indices in strictly-decreasing value order.
- Front index is always the window max; pop when it falls out of range.
- Each index is pushed and popped at most once, giving O(n) total.

**Tags:** #algorithm

---

### 31. Edit Distance

**Difficulty:** Hard
**Topics:** dp, strings
**Position:** SWE
**Years:** L3-L5

**Question:** Given two strings `word1` and `word2`, return the minimum number of single-character edits (insert, delete, replace) to convert `word1` to `word2`.

**Approach:** 2D DP — `dp[i][j]` = edits to convert `word1[:i]` to `word2[:j]`. If chars match, `dp[i][j] = dp[i-1][j-1]`. Else `1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])`. O(m*n) time; O(min(m,n)) space with rolling rows.

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
      if (word1[i - 1] === word2[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}
```

**Java:**
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

**Key points:**
- Three operations correspond to three predecessor cells: delete, insert, replace.
- Base cases: converting from/to empty string costs the other length.
- Can be reduced to O(min(m,n)) space using rolling rows.

**Tags:** #algorithm

---

### 32. Longest Palindromic Substring

**Difficulty:** Medium
**Topics:** strings, dp, two-pointers
**Position:** SWE
**Years:** L3-L5

**Question:** Given a string `s`, return the longest palindromic substring of `s`.

**Approach:** Expand around each center (2n-1 centers for odd/even). Track best length. O(n^2) time, O(1) space. For O(n), use Manacher's algorithm — usually overkill for interviews unless prompted.

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

**Key points:**
- Two center types (odd and even) cover all palindromes.
- O(n^2) time, O(1) extra space.
- Manacher's algorithm achieves O(n) but is rarely required in interviews.

**Tags:** #algorithm

---

### 33. Burst Balloons

**Difficulty:** Hard
**Topics:** dp, interval-dp, array
**Position:** SWE
**Years:** L5+

**Question:** Given `n` balloons with values, bursting balloon `i` earns `nums[left] * nums[i] * nums[right]` where `left/right` are the still-alive neighbors. Pad with virtual 1s at both ends. Return the maximum coins.

**Approach:** Interval DP — `dp[l][r]` = max coins from bursting all balloons strictly between `l` and `r`. Iterate over which balloon `k` to burst *last* in `(l, r)`; then `dp[l][r] = max(nums[l]*nums[k]*nums[r] + dp[l][k] + dp[k][r])`. O(n^3).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Choosing the LAST balloon makes its neighbors fixed at `a[l]` and `a[r]`.
- Pad with virtual 1s to avoid boundary special cases.
- O(n^3) time and O(n^2) space.

**Tags:** #algorithm

---

### 34. Cherry Pickup

**Difficulty:** Hard
**Topics:** dp, matrix, multi-dimensional-dp
**Position:** SWE
**Years:** L5+

**Question:** On an `n x n` grid with cherries (1), empty (0), thorns (-1), walk from `(0,0)` to `(n-1,n-1)` going right/down, then back going left/up, collecting cherries (each cell collected at most once). Return the max cherries; if no valid round trip, return 0.

**Approach:** Reframe as two simultaneous paths from `(0,0)` to `(n-1,n-1)`, both moving down/right. State `dp[r1][c1][r2]` (c2 = r1+c1-r2). If both land on the same cell, count cherry once. O(n^3).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Two simultaneous paths model the round trip; same-cell overlap counts cherry once.
- State `(r1, c1, r2)` because `c2 = r1 + c1 - r2` is determined.
- O(n^3) states, four transitions each.

**Tags:** #algorithm

---

### 35. Russian Doll Envelopes

**Difficulty:** Hard
**Topics:** dp, binary-search, sorting, lis
**Position:** SWE
**Years:** L5+

**Question:** Given an array of envelopes `[width, height]`, find the maximum number you can nest (each strictly larger than the previous in both dimensions).

**Approach:** Sort by width ascending; for ties in width sort by height *descending* (so same-width envelopes can't both be picked). Then run LIS on heights with patience sorting / binary search. O(n log n).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Descending height tie-break on equal widths blocks invalid nesting.
- Reduces to a 1D LIS on heights, solvable in O(n log n) with patience sort.
- `bisect_left` chooses strict increase; matches "strictly larger" requirement.

**Tags:** #algorithm

---

### 36. Merge k Sorted Lists

**Difficulty:** Hard
**Topics:** heap, linked-list, divide-and-conquer
**Position:** SWE
**Years:** L3-L5

**Question:** Merge `k` sorted linked lists into one sorted linked list and return it.

**Approach:** Min-heap of the current head of each list. Pop smallest, append to result, push its `next`. O(N log k) where N = total nodes. Alternative: pairwise merge with divide-and-conquer — same complexity, no heap.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Heap holds at most k nodes; pop+push is O(log k) per node.
- Tuple index breaks ties so heap never compares node objects.
- Divide-and-conquer pairwise merge gets the same O(N log k) bound.

**Tags:** #algorithm

---

### 37. Word Search II

**Difficulty:** Hard
**Topics:** trie, backtracking, dfs, matrix, strings
**Position:** SWE
**Years:** L5+

**Question:** Given an `m x n` board of letters and a list of words, return all words that can be formed by sequentially adjacent (4-directional) cells, with each cell used at most once per word.

**Approach:** Build a trie of all words. DFS from every cell, walking the trie in parallel — prune as soon as the current prefix is not in the trie. Mark visited cells temporarily (then restore). Remove matched words from the trie to avoid duplicate emits. O(M * 4^L) worst case.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Trie enables prefix pruning across all words simultaneously.
- Mutate then restore the board to mark visited cells in O(1) space.
- Remove word from trie once matched to avoid duplicate output.

**Tags:** #algorithm

---

### 38. Find Kth Smallest in Sorted Matrix

**Difficulty:** Medium
**Topics:** binary-search, heap, matrix
**Position:** SWE
**Years:** L3-L5

**Question:** Given an `n x n` matrix where each row and column is sorted ascending, return the `k`th smallest element.

**Approach:** Binary search on value range `[matrix[0][0], matrix[n-1][n-1]]`. For each mid, count how many cells `<= mid` by walking from the bottom-left in O(n). Adjust bounds. O(n log(max-min)). Alternative: min-heap of (val, r, c), pop k times — O(k log n).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Binary search on the value space, not the index space.
- O(n) count via staircase walk from bottom-left.
- Converges to a matrix value because count strictly increases at value boundaries.

**Tags:** #algorithm

---

### 39. Split Array Largest Sum

**Difficulty:** Hard
**Topics:** binary-search, dp, greedy, array
**Position:** SWE
**Years:** L5+

**Question:** Given an array of non-negative integers `nums` and integer `k`, split the array into `k` non-empty contiguous subarrays so that the largest subarray sum is minimized. Return that minimum.

**Approach:** Binary search on the answer in `[max(nums), sum(nums)]`. For each candidate `mid`, greedily count how many subarrays are needed if each must have sum `<= mid`. If count `<= k`, try smaller; else larger. O(n log(sum)).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Binary search on the answer; predicate (needed parts) is monotonic in cap.
- Lower bound is `max(nums)`: at minimum one element forms a subarray.
- Upper bound is `sum(nums)`: one subarray fits everything.

**Tags:** #algorithm

---

### 40. Minimum Window Substring

**Difficulty:** Hard
**Topics:** sliding-window, hashmap, strings
**Position:** SWE
**Years:** L3-L5

**Question:** Given strings `s` and `t`, return the shortest substring of `s` containing every character of `t` (with multiplicity). Return `""` if none.

**Approach:** Sliding window with a need-count map and a `missing` counter. Expand right until `missing == 0`, then shrink left while still valid, tracking the best window. O(|s| + |t|).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Counter values may go negative — only positive values represent unmet need.
- `missing` tracks total still-needed character count, not distinct chars.
- Each pointer moves at most n steps, giving O(|s| + |t|).

**Tags:** #algorithm

---

### 41. Number of Connected Components in Graph

**Difficulty:** Medium
**Topics:** graph, union-find, dfs, bfs
**Position:** SWE
**Years:** L3-L5

**Question:** Given `n` nodes labeled `0..n-1` and a list of undirected edges, return the number of connected components.

**Approach:** Union-find with path compression and union-by-rank. Start with `n` components; each successful union decrements. O(α(n) * E). Alternative: BFS/DFS from each unvisited node — O(V + E).

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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Each successful union merges two components, decrementing the count.
- Path compression + union-by-rank gives near-constant amortized op.
- Total cost O(E α(n)), effectively linear.

**Tags:** #algorithm

---

### 42. Range Sum Query 2D - Mutable

**Difficulty:** Hard
**Topics:** binary-indexed-tree, segment-tree, design, matrix
**Position:** SWE
**Years:** L5+

**Question:** Design a data structure that supports `update(row, col, val)` and `sumRegion(row1, col1, row2, col2)` on an `m x n` integer matrix.

**Approach:** 2D Binary Indexed Tree (Fenwick). `update` O(log m * log n); `sumRegion` via inclusion-exclusion of four prefix sums, also O(log m * log n). Alternative: 2D segment tree (more general but heavier constant).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- 2D Fenwick: nested loops over low-bit jumps.
- Region sum via inclusion-exclusion of four prefix sums.
- Both ops in O(log m * log n).

**Tags:** #algorithm

---

### 43. Find Critical Connections in Network

**Difficulty:** Hard
**Topics:** graph, dfs, tarjan, bridges
**Position:** SWE
**Years:** L5+

**Question:** Given an undirected network of `n` servers and connections, return all "critical" connections — edges whose removal disconnects the graph.

**Approach:** Tarjan's bridge-finding algorithm. DFS, tracking `disc[u]` (discovery time) and `low[u]` (lowest reachable disc). Edge `(u,v)` is a bridge iff `low[v] > disc[u]`. O(V + E).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- `low[u]` = lowest disc reachable from u's subtree via at most one back edge.
- Edge `(u,v)` is a bridge iff `low[v] > disc[u]` after the recursive call.
- O(V + E) — single DFS pass.

**Tags:** #algorithm

---

### 44. Maximum Rectangle in Histogram

**Difficulty:** Hard
**Topics:** stack, monotonic, array
**Position:** SWE
**Years:** L5+

**Question:** Given `n` non-negative integers representing histogram bar heights of width 1, find the area of the largest rectangle.

**Approach:** Monotonic increasing stack of indices. When current bar is shorter than stack top, pop and compute area with the popped bar as the smallest: `height * (i - stack.top() - 1)`. Sentinel 0 at the end flushes the stack. O(n).

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
      const width = stack.length ? i - stack[stack.length - 1] - 1 : i;
      best = Math.max(best, h[top] * width);
    }
    stack.push(i);
  }
  return best;
}
```

**Java:**
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

**Key points:**
- Stack stores increasing-height indices; popping locks in a rectangle.
- Width spans from the previous shorter bar to the current one.
- Sentinel 0 at the end forces a final flush.

**Tags:** #algorithm

---

### 45. Maximal Rectangle in Binary Matrix

**Difficulty:** Hard
**Topics:** dp, stack, matrix
**Position:** SWE
**Years:** L5+

**Question:** Given an `m x n` binary matrix, find the largest rectangle containing only 1s and return its area.

**Approach:** For each row, treat the running column heights as a histogram and reuse "largest rectangle in histogram." Update `height[j] = height[j]+1` if cell is 1, else 0. O(m*n).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Reduces 2D problem to repeated 1D histogram problem.
- Heights array reused across rows in O(n) space.
- O(m*n) total — each cell costs amortized constant histogram work.

**Tags:** #algorithm

---

### 46. Reconstruct Itinerary

**Difficulty:** Hard
**Topics:** graph, eulerian-path, dfs, hierholzer
**Position:** SWE
**Years:** L5+

**Question:** Given a list of airline tickets `[from, to]` representing one-way flights, reconstruct the itinerary in order starting from `"JFK"`. If multiple valid itineraries exist, return the lexicographically smallest one. You must use every ticket exactly once.

**Approach:** Hierholzer's algorithm for Eulerian path. Sort each adjacency list lexicographically and use as a stack (or min-heap). DFS, appending to result in post-order, then reverse. O(E log E).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Post-order append + final reverse yields a valid Eulerian path.
- Lex-smallest neighbor picked first (min-heap or sorted-pop-from-end).
- Each edge is consumed exactly once, giving O(E log E) overall.

**Tags:** #algorithm

---

### 47. Coin Change

**Difficulty:** Medium
**Topics:** dp, bfs
**Position:** SWE
**Years:** L3-L5

**Question:** Given coin denominations `coins` and an integer `amount`, return the fewest number of coins needed to make up that amount. Return `-1` if impossible. Unlimited coins of each denomination.

**Approach:** 1D DP — `dp[x]` = min coins for amount `x`, init `inf` (or `amount+1`). For each `x` from 1 to amount, try each coin `c <= x`: `dp[x] = min(dp[x], dp[x-c] + 1)`. O(amount * len(coins)). Alternative: BFS in the state graph.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Unbounded knapsack: iterate amounts outward, each coin can be reused.
- Sentinel `amount + 1` is safely above any valid answer.
- O(amount * coins) time, O(amount) space.

**Tags:** #algorithm

---

### 48. Decode Ways

**Difficulty:** Medium
**Topics:** dp, strings
**Position:** SWE
**Years:** L3-L5

**Question:** A message containing `'A'..'Z'` is encoded as `'1'..'26'`. Given a digit string `s`, return the number of ways to decode it (e.g. `"226"` → `"BZ"`, `"VF"`, `"BBF"` = 3).

**Approach:** 1D DP — `dp[i]` = ways to decode `s[:i]`. Add `dp[i-1]` if `s[i-1] != '0'`; add `dp[i-2]` if `s[i-2:i]` is in `"10".."26"`. O(n) time, O(1) space with two scalars.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Two transitions: take one digit (if nonzero) or take two digits (if in [10,26]).
- `'0'` alone is invalid; must be paired.
- O(n) time, O(1) space using two rolling scalars.

**Tags:** #algorithm

---

### 49. Find All Anagrams in a String

**Difficulty:** Medium
**Topics:** sliding-window, hashmap, strings
**Position:** SWE
**Years:** L3-L5

**Question:** Given strings `s` and `p`, return all start indices in `s` where a substring of length `|p|` is an anagram of `p`.

**Approach:** Sliding window of size `|p|`. Maintain a 26-int frequency array; compare to `p`'s frequency in O(26) per step. Or use a `matches` counter that updates only when a character's count crosses zero. O(|s|).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Fixed-size window slides one char per step.
- 26-int frequency compare is constant time.
- O(|s|) overall — each char enters and leaves once.

**Tags:** #algorithm

---

### 50. Longest Consecutive Sequence

**Difficulty:** Medium
**Topics:** hash, array, union-find
**Position:** SWE
**Years:** L3-L5

**Question:** Given an unsorted array of integers, return the length of the longest consecutive elements sequence in O(n) time.

**Approach:** Put all numbers in a hashset. For each `x`, only start a streak if `x-1` is not in the set (so each streak is walked exactly once). Walk `x, x+1, x+2, ...` and track max. O(n) amortized.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Skip non-streak-starts to ensure each streak is walked once.
- Hashset enables O(1) membership checks.
- Amortized O(n) — total inner-loop work is bounded by `n`.

**Tags:** #algorithm

---

### 51. Number of Distinct Islands

**Difficulty:** Medium
**Topics:** dfs, hash, matrix
**Position:** SWE
**Years:** L3-L5

**Question:** Given a binary grid, two islands are "the same" if one can be translated (not rotated) to match the other. Return the number of *distinct* islands.

**Approach:** DFS each island and record the path signature as a string of moves (e.g. `"DRUO"` including the backtrack token). Anchor coordinates to the island's first cell so translation doesn't matter. Put signatures in a set. O(m*n).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Anchoring cells to the first-cell offset makes the shape translation-invariant.
- Visit-order tuple uniquely identifies a shape under fixed DFS order.
- O(m*n) — each cell visited once.

**Tags:** #algorithm

---

### 52. Shortest Path in Binary Matrix

**Difficulty:** Medium
**Topics:** bfs, graph, matrix
**Position:** SWE
**Years:** L3-L5

**Question:** Given an `n x n` binary matrix, return the length of the shortest clear path from `(0,0)` to `(n-1,n-1)` moving 8-directionally through `0`s, or `-1` if none.

**Approach:** BFS from the source, exploring 8 neighbors. Mark visited in-place. Return depth when target dequeued. O(n^2). Bidirectional BFS or A* (with Chebyshev heuristic) speed up on large grids.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- 8-directional BFS guarantees the shortest unweighted path.
- Mark cells on enqueue (not dequeue) to avoid re-processing.
- Early exit when start or end cell is blocked.

**Tags:** #algorithm

---

### 53. Word Ladder II

**Difficulty:** Hard
**Topics:** bfs, graph, backtracking, strings
**Position:** SWE
**Years:** L5+

**Question:** Same setup as Word Ladder, but return *all* shortest transformation sequences from `beginWord` to `endWord`, each as a list of words.

**Approach:** Two-phase: (1) BFS layer by layer to build a parent map `child -> [parents]` for words on shortest paths only; stop the level you find `endWord`. (2) DFS backwards from `endWord` to `beginWord` using the parent map to enumerate paths. O(N * L^2 + answer).

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

**TypeScript:**
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

**Java:**
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

**Key points:**
- BFS by layer, removing layer from dictionary so future levels can't revisit.
- Build parent links during BFS, then DFS backward to enumerate all shortest paths.
- Stop the BFS at the first layer that contains `endWord`.

**Tags:** #algorithm

---

### 54. Insert/Delete/GetRandom O(1)

**Difficulty:** Medium
**Topics:** design, hashmap, array
**Position:** SWE
**Years:** L3-L5

**Question:** Design a data structure supporting `insert(val)`, `remove(val)`, and `getRandom()` — each in average O(1). All values are distinct.

**Approach:** Array of values + hashmap from value to its index in the array. On remove, swap the target with the last array element, update the swapped element's map entry, then pop. `getRandom` picks a uniform random index.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Array gives O(1) random access; map gives O(1) lookup.
- Swap-with-last lets removal stay O(1).
- Don't forget to update the swapped element's index in the map.

**Tags:** #algorithm

---

### 55. Best Time to Buy and Sell Stock with Cooldown

**Difficulty:** Medium
**Topics:** dp, array
**Position:** SWE
**Years:** L3-L5

**Question:** Given daily stock prices, find the maximum profit. You may do unlimited transactions but cannot buy on the day immediately after a sell (1-day cooldown). Only one share at a time.

**Approach:** State machine DP — `held`, `sold`, `rest` per day. Transitions: `held = max(held, rest - price)`, `sold = held + price`, `rest = max(rest, sold_prev)`. O(n) time, O(1) space.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Three states model the cooldown constraint: held, just-sold, resting.
- Buy transitions from `rest`, not `sold`, enforcing the cooldown day.
- O(n) time, O(1) space with three rolling scalars.

**Tags:** #algorithm

---

### 56. Frog Jump

**Difficulty:** Hard
**Topics:** dp, hashmap
**Position:** SWE
**Years:** L5+

**Question:** A frog starts on stone 0 of a river. Given the positions of stones in ascending order, the frog's first jump is 1 unit. If the last jump was `k`, the next must be `k-1`, `k`, or `k+1`. Can the frog reach the last stone landing only on stones?

**Approach:** Memoized DFS keyed on `(stone_index, last_jump)`, or DP with `dp[stone] = set of reachable last-jump sizes`. For each `k` in `dp[stone]`, try `k-1, k, k+1` and propagate to the matching stone (hashmap from position to index). O(n^2).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- DP state: per stone, the set of jump-sizes that can land there.
- First move is forced to size 1.
- Last stone reachable iff its set is non-empty.

**Tags:** #algorithm

---

### 57. Robot Room Cleaner

**Difficulty:** Hard
**Topics:** dfs, backtracking, design
**Position:** SWE
**Years:** L5+

**Question:** A robot in an unknown grid can `move()`, `turnLeft()`, `turnRight()`, and `clean()`. It can't sense walls except by trying to move. Clean the entire reachable room.

**Approach:** Spiral backtracking DFS. Maintain a set of cleaned `(x,y)` cells and the robot's current direction. At each step, clean, then try each of the 4 directions in a fixed rotation; recurse if the next cell is unvisited and `move()` returns true. After recursion, "go back" by turning 180°, moving, turning 180°. O(cells).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Track absolute coordinates by composing relative moves with direction.
- `goBack` (turn 180, move, turn 180) restores position and facing after recursion.
- Each cell entered once; total moves O(cells).

**Tags:** #algorithm

---

### 58. Concatenated Words

**Difficulty:** Hard
**Topics:** dp, trie, strings, dfs
**Position:** SWE
**Years:** L5+

**Question:** Given a list of distinct words, return all words that are a concatenation of at least two *other* words from the same list.

**Approach:** Sort by length so shorter words enter the dictionary first. For each word, run word-break checking only against words shorter than it. DP `dp[i]` = `s[:i]` segmentable. O(sum(L^2)) with a hashset; faster with a trie.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Sort by length so all candidates for splitting a word are already in the set.
- Reuses word-break DP per candidate.
- Empty `seen` short-circuits — the smallest word can't be a concatenation.

**Tags:** #algorithm

---

### 59. Largest Number

**Difficulty:** Medium
**Topics:** sorting, greedy, strings
**Position:** SWE
**Years:** L3-L5

**Question:** Given a list of non-negative integers, arrange them so that they form the largest possible number, returned as a string (e.g. `[3,30,34,5,9]` → `"9534330"`).

**Approach:** Custom comparator: `a` before `b` iff `a+b > b+a` (string concat). Sort, join, then strip leading zeros (`"00"` → `"0"`). O(n log n * L).

**Python:**
```python
from functools import cmp_to_key

def largest_number(nums: list[int]) -> str:
    strs = [str(x) for x in nums]
    strs.sort(key=cmp_to_key(lambda a, b: -1 if a + b > b + a else (1 if a + b < b + a else 0)))
    out = "".join(strs)
    return "0" if out[0] == "0" else out
```

**TypeScript:**
```typescript
function largestNumber(nums: number[]): string {
  const strs = nums.map(String);
  strs.sort((a, b) => (b + a).localeCompare(a + b));
  const out = strs.join("");
  return out[0] === "0" ? "0" : out;
}
```

**Java:**
```java
public String largestNumber(int[] nums) {
    String[] strs = Arrays.stream(nums).mapToObj(String::valueOf).toArray(String[]::new);
    Arrays.sort(strs, (a, b) -> (b + a).compareTo(a + b));
    String out = String.join("", strs);
    return out.charAt(0) == '0' ? "0" : out;
}
```

**Key points:**
- Pairwise comparator `a+b vs b+a` defines the total order for max concatenation.
- Strip leading zeros only when the entire result is zeros (e.g. all-zero input).
- O(n log n) compares; each compare is O(L) string concat.

**Tags:** #algorithm

---

### 60. Basic Calculator II

**Difficulty:** Medium
**Topics:** stack, strings, recursion, parsing
**Position:** SWE
**Years:** L3-L5

**Question:** Implement a calculator for an expression string containing non-negative integers and `+`, `-`, `*`, `/` (integer division truncating toward zero) and spaces. No parentheses.

**Approach:** Single pass with a stack. Track `prev_op` (init `+`) and current number being built. On operator or end, push/transform based on `prev_op`: `+num`, `-num`, `top*=num`, `top//=num`. Sum the stack. O(n).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- `prev_op` lags the current operator so we know how to integrate the just-built number.
- `*` and `/` fold into the top of stack to respect precedence.
- Integer division must truncate toward zero (use `int(a/b)` not `a // b` in Python for negatives).

**Tags:** #algorithm

---

### 61. Longest Valid Parentheses

**Difficulty:** Hard
**Topics:** stack, dp, strings
**Position:** SWE
**Years:** L5+

**Question:** Given a string containing only `'('` and `')'`, return the length of the longest valid (well-formed) parentheses substring.

**Approach:** Stack of indices with a sentinel `-1`. Push index of `(`; on `)`, pop. If stack empty, push current index as new base. Else update max with `i - stack.top()`. O(n). Alternative: two-pass counter scan in O(1) extra space.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Stack base tracks the index just before the current valid run.
- On unmatched `)`, push its index as the new base.
- O(n) time, O(n) worst-case space.

**Tags:** #algorithm

---

### 62. Maximum Sum of 3 Non-Overlapping Subarrays

**Difficulty:** Hard
**Topics:** dp, sliding-window, array
**Position:** SWE
**Years:** L5+

**Question:** Given an integer array `nums` and integer `k`, find three non-overlapping subarrays of length `k` with maximum total sum. Return the starting indices (lexicographically smallest tuple on ties).

**Approach:** Precompute window sums of length `k`. Build `left[i]` = best window index in `[0..i]` and `right[i]` = best in `[i..n-k]` (preferring smaller index on ties). Iterate middle window `j`; combine `left[j-k]`, `j`, `right[j+k]`. O(n).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Precompute fixed-length window sums in O(n).
- `left` uses `>` and `right` uses `>=` to prefer smaller indices on ties.
- Iterate the middle window; pick best left/right at fixed offsets.

**Tags:** #algorithm

---

## Tips specific to Google

- **Talk while you code.** Silent coding in a Google Doc with no autocomplete reads as "stuck." Narrate your thought process even when you're confident.
- **Always discuss edge cases explicitly** before you start: empty input, single element, duplicates, overflow, negative numbers. Interviewers often grade an extra point just for this.
- **Expect at least one follow-up that breaks your initial solution.** "What if the input doesn't fit in memory?" / "What if 1000 threads call this?" Have a plan for streaming and concurrency.
- **For system design, draw boxes early.** Don't talk for 10 minutes before writing anything. A messy diagram beats a clean monologue.
- **Googleyness is real.** Two strong technical rounds + one weak behavioral round = no offer. Prep 6-8 STAR stories.

## Resources

- LeetCode "Google" company tag (curated public list)
- Cracking the Coding Interview, ch. 11 (Google-style design)
- "System Design Interview" by Alex Xu — volumes 1 and 2
- Google's own SRE book (free online) — useful for SRE/infra rounds
