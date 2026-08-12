# 算法（LeetCode 热题 100）

LeetCode 点赞最高的 100 道题（热题 100），每道题配有原创题面、带复杂度的思路，以及 Python / TypeScript / Java 三种解法。顺序与分组对齐官方学习计划；每题标题带有其 LeetCode 编号（`LC N`）。

---

### 1. Two Sum  ·  LC 1  ·  简单  ·  哈希

**问题：** 给定数组 `nums` 和整数 `target`，返回两个相加等于 `target` 的元素的下标。恰好存在一个解。2 <= len(nums) <= 10^4，-10^9 <= nums[i], target <= 10^9。

**思路：** 单次遍历，用哈希表存储值到下标的映射；对每个 `x`，检查 `target - x` 是否已出现过。时间 O(n)，空间 O(n)。

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
int[] twoSum(int[] nums, int target) {
    var seen = new HashMap<Integer, Integer>();
    for (int i = 0; i < nums.length; i++) {
        int need = target - nums[i];
        if (seen.containsKey(need)) return new int[]{seen.get(need), i};
        seen.put(nums[i], i);
    }
    return new int[0];
}
```

**要点：**
- 哈希表将内层查找从 O(n) 降到 O(1)。
- 先检查后存储，避免复用同一下标。
- 支持负数和重复元素。

---

### 2. Group Anagrams  ·  LC 49  ·  中等  ·  哈希

**问题：** 将互为字母异位词的字符串分组。1 <= len(strs) <= 10^4。

**思路：** 按规范化键（排序后的字符串或 26 个字母的计数元组）分桶。排序方案时间 O(n * k log k)。

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
List<List<String>> groupAnagrams(String[] strs) {
    var groups = new HashMap<String, List<String>>();
    for (String s : strs) {
        char[] chars = s.toCharArray();
        Arrays.sort(chars);
        String key = new String(chars);
        groups.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
    }
    return new ArrayList<>(groups.values());
}
```

**要点：**
- 排序后字符串是最简单的规范形式。
- 长度为 26 的计数向量键可避免排序。
- 输出顺序未做规定。

---

### 3. Longest Consecutive Sequence  ·  LC 128  ·  中等  ·  哈希

**问题：** 给定一个未排序的数组 `nums`，返回最长连续整数序列（相邻值相差 1）的长度。重复元素只计一次；数组可能为空。要求 O(n) 时间。0 <= n <= 10^5。

**思路：** 把所有值放入哈希集合以实现 O(1) 的成员查询，然后只从前驱 x-1 不存在的值 x 开始计数，因为这样的 x 才是某段序列的真正起点。从每个起点向上遍历，只要下一个值存在就继续，记录最长的一段。所有元素在全部序列中最多被访问两次，因此时间复杂度 O(n)，空间复杂度 O(n)。

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
  const numSet = new Set(nums);
  let best = 0;
  for (const x of numSet) {
    if (!numSet.has(x - 1)) {
      let length = 1;
      while (numSet.has(x + length)) length++;
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
        Set<Integer> numSet = new HashSet<>();
        for (int x : nums) numSet.add(x);
        int best = 0;
        for (int x : numSet) {
            if (!numSet.contains(x - 1)) {
                int length = 1;
                while (numSet.contains(x + length)) length++;
                best = Math.max(best, length);
            }
        }
        return best;
    }
}
```

**要点：**
- 排序做法是 O(n log n)；哈希集合技巧可达到题目要求的 O(n)
- 只在 x-1 缺失时才开始计数，保证每段序列只被扫描一次
- 集合会自动去重，重复元素不会虚增长度
- 注意处理空数组，返回 0

---

### 4. Move Zeroes  ·  LC 283  ·  简单  ·  双指针

**问题：** 原地将 `nums` 中所有 0 移到末尾，同时保持非零元素的相对顺序。直接修改 `nums`。1 <= n <= 10^4。

**思路：** 维护一个 insert 指针，标记下一个非零值应放置的位置。用读指针扫描，每遇到非零元素就与 insert 位置交换并将 insert 前移。这样按原顺序把非零元素压到前面，0 自然留在后面，时间复杂度 O(n)，额外空间 O(1)。

**Python：**
```python
def move_zeroes(nums: list[int]) -> None:
    insert = 0
    for i in range(len(nums)):
        if nums[i] != 0:
            nums[insert], nums[i] = nums[i], nums[insert]
            insert += 1
```

**TypeScript：**
```typescript
function moveZeroes(nums: number[]): void {
  let insert = 0;
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] !== 0) {
      [nums[insert], nums[i]] = [nums[i], nums[insert]];
      insert++;
    }
  }
}
```

**Java：**
```java
class Solution {
    public void moveZeroes(int[] nums) {
        int insert = 0;
        for (int i = 0; i < nums.length; i++) {
            if (nums[i] != 0) {
                int tmp = nums[insert];
                nums[insert] = nums[i];
                nums[i] = tmp;
                insert++;
            }
        }
    }
}
```

**要点：**
- 双指针交换在移动 0 的同时保持非零元素稳定有序
- 必须原地完成，不允许使用辅助数组
- 用交换（而非先覆盖再补零）省去单独的补零遍历
- 当 insert == i 时交换是无害的空操作

---

### 5. Container With Most Water  ·  LC 11  ·  中等  ·  双指针

**问题：** 给定高度数组，选两条线构成容器；使盛水面积最大。2 <= len(height) <= 10^5。

**思路：** 双指针从两端开始；移动较短一侧，因为它决定了面积的上限。时间 O(n)，空间 O(1)。

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
- 移动较高一侧绝不会增加面积。
- 每步宽度严格递减。
- 相等时移动任一指针均可。

---

### 6. 3Sum  ·  LC 15  ·  中等  ·  双指针

**问题：** 返回 `nums` 中所有和为零的去重三元组。3 <= len(nums) <= 3000。

**思路：** 排序；固定一个下标后对其余使用双指针。跳过重复以保持结果唯一。时间 O(n^2)，额外空间 O(1)。

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
List<List<Integer>> threeSum(int[] nums) {
    Arrays.sort(nums);
    var out = new ArrayList<List<Integer>>();
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
- 排序同时支持双指针和跳重。
- 在固定下标和匹配后都需跳过重复。
- 当 `nums[i] > 0` 时可提前 break。

---

### 7. Trapping Rain Water  ·  LC 42  ·  困难  ·  双指针

**问题：** 给定非负高度，计算雨后能接的水。0 <= len(height) <= 2*10^4。

**思路：** 双指针跟踪 left_max 和 right_max；在较低一侧累加亏空。时间 O(n)，空间 O(1)。

**Python：**
```python
def trap(height: list[int]) -> int:
    l, r = 0, len(height) - 1
    lm = rm = total = 0
    while l < r:
        if height[l] < height[r]:
            lm = max(lm, height[l]); total += lm - height[l]; l += 1
        else:
            rm = max(rm, height[r]); total += rm - height[r]; r -= 1
    return total
```

**TypeScript：**
```typescript
function trap(height: number[]): number {
  let l = 0, r = height.length - 1, lm = 0, rm = 0, total = 0;
  while (l < r) {
    if (height[l] < height[r]) {
      lm = Math.max(lm, height[l]); total += lm - height[l]; l++;
    } else {
      rm = Math.max(rm, height[r]); total += rm - height[r]; r--;
    }
  }
  return total;
}
```

**Java：**
```java
int trap(int[] height) {
    int l = 0, r = height.length - 1, lm = 0, rm = 0, total = 0;
    while (l < r) {
        if (height[l] < height[r]) {
            lm = Math.max(lm, height[l]); total += lm - height[l]; l++;
        } else {
            rm = Math.max(rm, height[r]); total += rm - height[r]; r--;
        }
    }
    return total;
}
```

**要点：**
- 较低柱所在侧可安全使用其当前最大值。
- 每步恰好处理一个柱子。
- 栈或前缀/后缀数组方法同样适用。

---

### 8. Longest Substring Without Repeating Characters  ·  LC 3  ·  中等  ·  滑动窗口

**问题：** 找到所有字符都不重复的最长子串的长度。0 <= len(s) <= 5*10^4。

**思路：** 滑动窗口；遇到重复字符时，将左指针推过之前的出现位置。时间 O(n)，空间 O(min(n, 字母表))。

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
    var last = new HashMap<Character, Integer>();
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
- `l` 只前进，不回退。
- 映射存储每个字符最近的下标。
- 窗口不变量：子串 `s[l..r]` 内字符唯一。

---

### 9. Find All Anagrams in a String  ·  LC 438  ·  中等  ·  滑动窗口

**问题：** 给定小写字符串 s 和 p，返回 s 中所有作为 p 的字母异位词的子串的起始下标。1 <= len(s), len(p) <= 3*10^4。

**思路：** 用一个长度为 |p| 的定长滑动窗口在 s 上滑动，配合一个 26 元素的频次数组，并预先统计 p 的目标频次。窗口每向右滑动一格，就把进入的字符计数加一、离开的字符计数减一，然后比较两个频次数组；相等即表示当前窗口是异位词。每次比较只涉及固定的 26 个桶，所以整体扫描时间复杂度 O(n)，额外空间 O(1)（26 个计数器）。

**Python：**
```python
def find_anagrams(s: str, p: str) -> list[int]:
    if len(p) > len(s):
        return []
    need = [0] * 26
    window = [0] * 26
    for c in p:
        need[ord(c) - 97] += 1
    res: list[int] = []
    for i, c in enumerate(s):
        window[ord(c) - 97] += 1
        if i >= len(p):
            window[ord(s[i - len(p)]) - 97] -= 1
        if window == need:
            res.append(i - len(p) + 1)
    return res
```

**TypeScript：**
```typescript
function findAnagrams(s: string, p: string): number[] {
  if (p.length > s.length) return [];
  const need = new Array(26).fill(0);
  const window = new Array(26).fill(0);
  const a = 'a'.charCodeAt(0);
  for (const c of p) need[c.charCodeAt(0) - a]++;
  const res: number[] = [];
  for (let i = 0; i < s.length; i++) {
    window[s.charCodeAt(i) - a]++;
    if (i >= p.length) window[s.charCodeAt(i - p.length) - a]--;
    if (i >= p.length - 1 && need.every((v, j) => v === window[j])) {
      res.push(i - p.length + 1);
    }
  }
  return res;
}
```

**Java：**
```java
class Solution {
    public List<Integer> findAnagrams(String s, String p) {
        List<Integer> res = new ArrayList<>();
        if (p.length() > s.length()) return res;
        int[] need = new int[26];
        int[] window = new int[26];
        for (char c : p.toCharArray()) need[c - 'a']++;
        for (int i = 0; i < s.length(); i++) {
            window[s.charAt(i) - 'a']++;
            if (i >= p.length()) window[s.charAt(i - p.length()) - 'a']--;
            if (i >= p.length() - 1 && Arrays.equals(need, window)) {
                res.add(i - p.length() + 1);
            }
        }
        return res;
    }
}
```

**要点：**
- 定长滑动窗口恰好匹配异位词的长度
- 大小为 26 的频次数组使匹配判断为 O(1)
- 每一步加入进入字符、移除离开字符，避免重新计算
- 计数匹配时记录窗口左端下标（i - len(p) + 1）

---

### 10. Subarray Sum Equals K  ·  LC 560  ·  中等  ·  子串

**问题：** 统计 `nums` 中和恰好等于 `k` 的连续子数组个数。值可以为负（前缀和非单调）。1 <= n <= 2*10^4。

**思路：** 维护运行前缀和，以及一个从每个前缀和值到其出现次数的哈希表。以当前下标结尾的子数组和恰为 k，当且仅当存在等于（当前前缀和 - k）的先前前缀和，此时把它的出现次数累加到答案中。用 {0: 1} 初始化哈希表以处理从下标 0 开始的子数组，时间复杂度 O(n)，空间复杂度 O(n)。

**Python：**
```python
def subarray_sum(nums: list[int], k: int) -> int:
    from collections import defaultdict
    counts: dict[int, int] = defaultdict(int)
    counts[0] = 1
    prefix = 0
    total = 0
    for x in nums:
        prefix += x
        total += counts[prefix - k]
        counts[prefix] += 1
    return total
```

**TypeScript：**
```typescript
function subarraySum(nums: number[], k: number): number {
  const counts = new Map<number, number>();
  counts.set(0, 1);
  let prefix = 0;
  let total = 0;
  for (const x of nums) {
    prefix += x;
    total += counts.get(prefix - k) ?? 0;
    counts.set(prefix, (counts.get(prefix) ?? 0) + 1);
  }
  return total;
}
```

**Java：**
```java
class Solution {
    public int subarraySum(int[] nums, int k) {
        Map<Integer, Integer> counts = new HashMap<>();
        counts.put(0, 1);
        int prefix = 0;
        int total = 0;
        for (int x : nums) {
            prefix += x;
            total += counts.getOrDefault(prefix - k, 0);
            counts.merge(prefix, 1, Integer::sum);
        }
        return total;
    }
}
```

**要点：**
- 滑动窗口不适用，因为负数破坏了和的单调性假设
- 核心等式：统计等于 prefix - k 的先前前缀和数量
- 初始化 counts[0] = 1，使恰好等于 k 的前缀被计入
- 先累加答案再记录当前前缀，避免重复使用空子数组

---

### 11. Sliding Window Maximum  ·  LC 239  ·  困难  ·  子串

**问题：** 对每个大小为 k 的窗口返回最大值。1 <= k <= len(nums) <= 10^5。

**思路：** 单调递减下标的双端队列；队首始终为窗口最大值。时间 O(n)。

**Python：**
```python
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
int[] maxSlidingWindow(int[] nums, int k) {
    var dq = new ArrayDeque<Integer>();
    int[] out = new int[nums.length - k + 1];
    int idx = 0;
    for (int i = 0; i < nums.length; i++) {
        while (!dq.isEmpty() && dq.peekFirst() <= i - k) dq.pollFirst();
        while (!dq.isEmpty() && nums[dq.peekLast()] < nums[i]) dq.pollLast();
        dq.offerLast(i);
        if (i >= k - 1) out[idx++] = nums[dq.peekFirst()];
    }
    return out;
}
```

**要点：**
- 双端队列存下标而非值，便于处理窗口过期。
- 保持值递减以使最大值位于队首。
- 每个元素摊还 O(1)。

---

### 12. Minimum Window Substring  ·  LC 76  ·  困难  ·  子串

**问题：** 找出包含 `t` 所有字符（含重数）的 `s` 的最短子串。无解则返回 `""`。1 <= len(s), len(t) <= 10^5。

**思路：** 用 `need`/`have` 计数和 `formed` 计数器的滑动窗口；窗口合法时收缩。时间 O(|s| + |t|)。

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
String minWindow(String s, String t) {
    if (t.isEmpty() || s.length() < t.length()) return "";
    var need = new HashMap<Character, Integer>();
    for (char c : t.toCharArray()) need.merge(c, 1, Integer::sum);
    var have = new HashMap<Character, Integer>();
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
- `formed` 统计计数已满足的不同字符数。
- 窗口合法时持续收缩以寻找更短答案。
- 增量时严格相等可避免重复计数。

---

### 13. Maximum Subarray  ·  LC 53  ·  中等  ·  普通数组

**问题：** 找到和最大的连续子数组并返回其和。1 <= len(nums) <= 10^5。

**思路：** Kadane 算法：在每个下标，要么延续前面的子数组，要么重新开始。时间 O(n)，空间 O(1)。

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
- 全负数组返回单个最大元素。
- `cur` 表示以当前下标结尾的最大和。
- 分治也可，复杂度 O(n log n)。

---

### 14. Merge Intervals  ·  LC 56  ·  中等  ·  普通数组

**问题：** 合并所有重叠区间。1 <= len(intervals) <= 10^4。

**思路：** 按起点排序；扫描时与上一区间重叠就合并。时间 O(n log n)。

**Python：**
```python
def merge(intervals: list[list[int]]) -> list[list[int]]:
    intervals.sort(key=lambda x: x[0])
    out: list[list[int]] = []
    for iv in intervals:
        if out and iv[0] <= out[-1][1]:
            out[-1][1] = max(out[-1][1], iv[1])
        else:
            out.append(iv)
    return out
```

**TypeScript：**
```typescript
function merge(intervals: number[][]): number[][] {
  intervals.sort((a, b) => a[0] - b[0]);
  const out: number[][] = [];
  for (const iv of intervals) {
    if (out.length && iv[0] <= out[out.length - 1][1]) {
      out[out.length - 1][1] = Math.max(out[out.length - 1][1], iv[1]);
    } else out.push(iv);
  }
  return out;
}
```

**Java：**
```java
int[][] merge(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
    var out = new ArrayList<int[]>();
    for (var iv : intervals) {
        if (!out.isEmpty() && iv[0] <= out.get(out.size() - 1)[1]) {
            out.get(out.size() - 1)[1] = Math.max(out.get(out.size() - 1)[1], iv[1]);
        } else out.add(iv);
    }
    return out.toArray(new int[0][]);
}
```

**要点：**
- 排序占主要开销。
- 重叠当且仅当下一起点 <= 前一终点。
- 取终点的最大值，因为区间未必嵌套。

---

### 15. Rotate Array  ·  LC 189  ·  中等  ·  普通数组

**问题：** 将 `nums` 原地向右旋转 `k` 步；`k` 可能超过 `n`。力求 O(1) 额外空间。1 <= n <= 10^5，0 <= k <= 10^5。

**思路：** 先对 k 取模 n，使超过长度的旋转正确绕回。然后反转整个数组，再反转前 k 个元素，最后反转其余 n-k 个元素；这三次反转组合起来即为向右旋转 k 位。时间复杂度 O(n)，额外空间 O(1)，避免了辅助拷贝。

**Python：**
```python
def rotate(nums: list[int], k: int) -> None:
    n = len(nums)
    k %= n

    def reverse(lo: int, hi: int) -> None:
        while lo < hi:
            nums[lo], nums[hi] = nums[hi], nums[lo]
            lo += 1
            hi -= 1

    reverse(0, n - 1)
    reverse(0, k - 1)
    reverse(k, n - 1)
```

**TypeScript：**
```typescript
function rotate(nums: number[], k: number): void {
  const n = nums.length;
  k %= n;
  const reverse = (lo: number, hi: number): void => {
    while (lo < hi) {
      [nums[lo], nums[hi]] = [nums[hi], nums[lo]];
      lo++;
      hi--;
    }
  };
  reverse(0, n - 1);
  reverse(0, k - 1);
  reverse(k, n - 1);
}
```

**Java：**
```java
class Solution {
    public void rotate(int[] nums, int k) {
        int n = nums.length;
        k %= n;
        reverse(nums, 0, n - 1);
        reverse(nums, 0, k - 1);
        reverse(nums, k, n - 1);
    }

    private void reverse(int[] nums, int lo, int hi) {
        while (lo < hi) {
            int tmp = nums[lo];
            nums[lo] = nums[hi];
            nums[hi] = tmp;
            lo++;
            hi--;
        }
    }
}
```

**要点：**
- 先做 k %= n，因为 k 可能超过 n
- 三次反转技巧以 O(1) 空间实现旋转
- 用额外数组更简单，但需要 O(n) 空间
- 先整体反转，再分别反转以下标 k 为界的两段

---

### 16. Product of Array Except Self  ·  LC 238  ·  中等  ·  普通数组

**问题：** 返回一个数组，使 `out[i]` 等于除 `nums[i]` 外所有元素的乘积。不允许使用除法。O(n) 时间。2 <= len(nums) <= 10^5。

**思路：** 两次扫描，将前缀和后缀积存入输出数组。时间 O(n)，额外空间 O(1)（输出不计）。

**Python：**
```python
def product_except_self(nums: list[int]) -> list[int]:
    n = len(nums)
    out = [1] * n
    for i in range(1, n):
        out[i] = out[i - 1] * nums[i - 1]
    right = 1
    for i in range(n - 1, -1, -1):
        out[i] *= right
        right *= nums[i]
    return out
```

**TypeScript：**
```typescript
function productExceptSelf(nums: number[]): number[] {
  const n = nums.length;
  const out = new Array(n).fill(1);
  for (let i = 1; i < n; i++) out[i] = out[i - 1] * nums[i - 1];
  let right = 1;
  for (let i = n - 1; i >= 0; i--) {
    out[i] *= right;
    right *= nums[i];
  }
  return out;
}
```

**Java：**
```java
int[] productExceptSelf(int[] nums) {
    int n = nums.length;
    int[] out = new int[n];
    out[0] = 1;
    for (int i = 1; i < n; i++) out[i] = out[i - 1] * nums[i - 1];
    int right = 1;
    for (int i = n - 1; i >= 0; i--) {
        out[i] *= right;
        right *= nums[i];
    }
    return out;
}
```

**要点：**
- 输出数组同时充当前缀缓冲区。
- 用单一变量维护正在累积的后缀积。
- 天然处理零，无需特判。

---

### 17. First Missing Positive  ·  LC 41  ·  困难  ·  普通数组

**问题：** 给定一个未排序的数组 `nums`，在 O(n) 时间、O(1) 额外空间内找出最小的缺失正整数。1 <= n <= 10^5。

**思路：** 把数组本身当作哈希表：对每个位置，只要当前值 v 落在有效区间 [1, n] 且尚未归位，就反复把它交换到下标 v-1 处。经过这轮循环排序后，凡是能占据槽位 i 的值都会位于下标 i-1，因此第二次扫描返回第一个满足 nums[i] != i+1 的下标；若全部匹配则答案为 n+1。这样做成立是因为第一个缺失的正整数必然落在 [1, n+1] 内，只有该区间的值才有意义。O(n) time, O(1) space。

**Python：**
```python
def firstMissingPositive(nums: list[int]) -> int:
    n = len(nums)
    for i in range(n):
        while 1 <= nums[i] <= n and nums[nums[i] - 1] != nums[i]:
            j = nums[i] - 1
            nums[i], nums[j] = nums[j], nums[i]
    for i in range(n):
        if nums[i] != i + 1:
            return i + 1
    return n + 1
```

**TypeScript：**
```typescript
function firstMissingPositive(nums: number[]): number {
    const n = nums.length;
    for (let i = 0; i < n; i++) {
        while (nums[i] >= 1 && nums[i] <= n && nums[nums[i] - 1] !== nums[i]) {
            const j = nums[i] - 1;
            [nums[i], nums[j]] = [nums[j], nums[i]];
        }
    }
    for (let i = 0; i < n; i++) {
        if (nums[i] !== i + 1) return i + 1;
    }
    return n + 1;
}
```

**Java：**
```java
int firstMissingPositive(int[] nums) {
    int n = nums.length;
    for (int i = 0; i < n; i++) {
        while (nums[i] >= 1 && nums[i] <= n && nums[nums[i] - 1] != nums[i]) {
            int j = nums[i] - 1;
            int tmp = nums[j];
            nums[j] = nums[i];
            nums[i] = tmp;
        }
    }
    for (int i = 0; i < n; i++) {
        if (nums[i] != i + 1) return i + 1;
    }
    return n + 1;
}
```

**要点：**
- 只有 [1, n] 范围内的值会影响答案，超出该范围的一律忽略。
- 交换循环均摊 O(n)，因为每次交换都会把一个数放到最终位置。
- 交换前检查 nums[nums[i]-1] != nums[i] 以避免死循环（处理重复值）。
- 排序或哈希集合虽能得到正确答案，但违反 O(n) 时间 / O(1) 空间的限制。

---

### 18. Set Matrix Zeroes  ·  LC 73  ·  中等  ·  矩阵

**问题：** 若某单元为 0，将其所在的整行整列原地设为 0。1 <= m, n <= 200。

**思路：** 用第一行/列做标记；单独记录它们自身的原始零状态。时间 O(m*n)，空间 O(1)。

**Python：**
```python
def set_zeroes(matrix: list[list[int]]) -> None:
    m, n = len(matrix), len(matrix[0])
    first_row = any(matrix[0][j] == 0 for j in range(n))
    first_col = any(matrix[i][0] == 0 for i in range(m))
    for i in range(1, m):
        for j in range(1, n):
            if matrix[i][j] == 0:
                matrix[i][0] = 0
                matrix[0][j] = 0
    for i in range(1, m):
        for j in range(1, n):
            if matrix[i][0] == 0 or matrix[0][j] == 0:
                matrix[i][j] = 0
    if first_row:
        for j in range(n): matrix[0][j] = 0
    if first_col:
        for i in range(m): matrix[i][0] = 0
```

**TypeScript：**
```typescript
function setZeroes(matrix: number[][]): void {
  const m = matrix.length, n = matrix[0].length;
  let firstRow = false, firstCol = false;
  for (let j = 0; j < n; j++) if (matrix[0][j] === 0) { firstRow = true; break; }
  for (let i = 0; i < m; i++) if (matrix[i][0] === 0) { firstCol = true; break; }
  for (let i = 1; i < m; i++)
    for (let j = 1; j < n; j++)
      if (matrix[i][j] === 0) { matrix[i][0] = 0; matrix[0][j] = 0; }
  for (let i = 1; i < m; i++)
    for (let j = 1; j < n; j++)
      if (matrix[i][0] === 0 || matrix[0][j] === 0) matrix[i][j] = 0;
  if (firstRow) for (let j = 0; j < n; j++) matrix[0][j] = 0;
  if (firstCol) for (let i = 0; i < m; i++) matrix[i][0] = 0;
}
```

**Java：**
```java
void setZeroes(int[][] matrix) {
    int m = matrix.length, n = matrix[0].length;
    boolean firstRow = false, firstCol = false;
    for (int j = 0; j < n; j++) if (matrix[0][j] == 0) { firstRow = true; break; }
    for (int i = 0; i < m; i++) if (matrix[i][0] == 0) { firstCol = true; break; }
    for (int i = 1; i < m; i++)
        for (int j = 1; j < n; j++)
            if (matrix[i][j] == 0) { matrix[i][0] = 0; matrix[0][j] = 0; }
    for (int i = 1; i < m; i++)
        for (int j = 1; j < n; j++)
            if (matrix[i][0] == 0 || matrix[0][j] == 0) matrix[i][j] = 0;
    if (firstRow) for (int j = 0; j < n; j++) matrix[0][j] = 0;
    if (firstCol) for (int i = 0; i < m; i++) matrix[i][0] = 0;
}
```

**要点：**
- 第一行/列既是数据也是标记。
- 修改前先记录它们自身的零状态。
- 允许 O(m + n) 空间时更简单。

---

### 19. Spiral Matrix  ·  LC 54  ·  中等  ·  矩阵

**问题：** 按螺旋顺序返回所有元素。1 <= m, n <= 10。

**思路：** 跟踪四个边界；逐层向内走。时间 O(m*n)。

**Python：**
```python
def spiral_order(matrix: list[list[int]]) -> list[int]:
    out: list[int] = []
    top, bot = 0, len(matrix) - 1
    left, right = 0, len(matrix[0]) - 1
    while top <= bot and left <= right:
        for j in range(left, right + 1):
            out.append(matrix[top][j])
        top += 1
        for i in range(top, bot + 1):
            out.append(matrix[i][right])
        right -= 1
        if top <= bot:
            for j in range(right, left - 1, -1):
                out.append(matrix[bot][j])
            bot -= 1
        if left <= right:
            for i in range(bot, top - 1, -1):
                out.append(matrix[i][left])
            left += 1
    return out
```

**TypeScript：**
```typescript
function spiralOrder(matrix: number[][]): number[] {
  const out: number[] = [];
  let top = 0, bot = matrix.length - 1, left = 0, right = matrix[0].length - 1;
  while (top <= bot && left <= right) {
    for (let j = left; j <= right; j++) out.push(matrix[top][j]);
    top++;
    for (let i = top; i <= bot; i++) out.push(matrix[i][right]);
    right--;
    if (top <= bot) {
      for (let j = right; j >= left; j--) out.push(matrix[bot][j]);
      bot--;
    }
    if (left <= right) {
      for (let i = bot; i >= top; i--) out.push(matrix[i][left]);
      left++;
    }
  }
  return out;
}
```

**Java：**
```java
List<Integer> spiralOrder(int[][] matrix) {
    var out = new ArrayList<Integer>();
    int top = 0, bot = matrix.length - 1, left = 0, right = matrix[0].length - 1;
    while (top <= bot && left <= right) {
        for (int j = left; j <= right; j++) out.add(matrix[top][j]);
        top++;
        for (int i = top; i <= bot; i++) out.add(matrix[i][right]);
        right--;
        if (top <= bot) {
            for (int j = right; j >= left; j--) out.add(matrix[bot][j]);
            bot--;
        }
        if (left <= right) {
            for (int i = bot; i >= top; i--) out.add(matrix[i][left]);
            left++;
        }
    }
    return out;
}
```

**要点：**
- 走完一条边就收紧该边界。
- 两个守卫判断防止 1xN 或 Nx1 情况下的重复遍历。
- 对于方阵，基于层的 DFS 也行。

---

### 20. Rotate Image  ·  LC 48  ·  中等  ·  矩阵

**问题：** 原地将 n x n 矩阵顺时针旋转 90 度。1 <= n <= 20。

**思路：** 先转置再逐行反转。时间 O(n^2)，空间 O(1)。

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
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];
  for (const row of matrix) row.reverse();
}
```

**Java：**
```java
void rotate(int[][] matrix) {
    int n = matrix.length;
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++) {
            int t = matrix[i][j]; matrix[i][j] = matrix[j][i]; matrix[j][i] = t;
        }
    for (int[] row : matrix)
        for (int l = 0, r = n - 1; l < r; l++, r--) {
            int t = row[l]; row[l] = row[r]; row[r] = t;
        }
}
```

**要点：**
- 转置是关于主对角线的交换。
- 行反转完成顺时针旋转。
- 逆时针：先反转行再转置。

---

### 21. Search a 2D Matrix II  ·  LC 240  ·  中等  ·  矩阵

**问题：** 给定行、列各自升序的矩阵，判断 `target` 是否存在。矩阵并非全局有序，故不能对所有单元格做一次二分查找。1 <= m, n <= 300。

**思路：** 从右上角开始，把它当作搜索阶梯：若当前值等于目标返回 true；若当前值更大则左移（因为它下方整列都更大）；若更小则下移（因为它左侧整行都更小）。每次比较都能排除一整行或一整列，所以路径单调前进且不会重复访问单元格。这利用了行列双重有序的性质，而普通二分查找无法利用。O(m + n) time, O(1) space。

**Python：**
```python
def searchMatrix(matrix: list[list[int]], target: int) -> bool:
    if not matrix or not matrix[0]:
        return False
    row, col = 0, len(matrix[0]) - 1
    while row < len(matrix) and col >= 0:
        v = matrix[row][col]
        if v == target:
            return True
        if v > target:
            col -= 1
        else:
            row += 1
    return False
```

**TypeScript：**
```typescript
function searchMatrix(matrix: number[][], target: number): boolean {
    if (matrix.length === 0 || matrix[0].length === 0) return false;
    let row = 0;
    let col = matrix[0].length - 1;
    while (row < matrix.length && col >= 0) {
        const v = matrix[row][col];
        if (v === target) return true;
        if (v > target) col--;
        else row++;
    }
    return false;
}
```

**Java：**
```java
boolean searchMatrix(int[][] matrix, int target) {
    if (matrix.length == 0 || matrix[0].length == 0) return false;
    int row = 0;
    int col = matrix[0].length - 1;
    while (row < matrix.length && col >= 0) {
        int v = matrix[row][col];
        if (v == target) return true;
        if (v > target) col--;
        else row++;
    }
    return false;
}
```

**要点：**
- 右上角（或左下角）是唯一一个两个移动方向能给出相反比较结果的角。
- 每一步都排除一整行或一整列，把路径长度限制在 m + n 内。
- 矩阵并非完全有序，因此把它当作一个有序列表做二分查找是错误的。
- 索引前先判空矩阵 / 空首行。

---

### 22. Intersection of Two Linked Lists  ·  LC 160  ·  简单  ·  链表

**问题：** 给定两个可能共享公共尾部的单链表头节点，返回它们第一次相交的节点（按引用而非值），若不相交返回 null。总长度最多 5*10^4；O(1) 额外空间。

**思路：** 使用两个指针分别遍历两个链表；每当某个指针到达末尾，就把它重定向到另一个链表的头部。经过至多一次切换后，每个指针都走过了 lenA + lenB 个节点，因此会同时到达相交节点（若不相交则同时到达 null）。这种重定向无需测量长度即可抵消两条链表前缀长度的差异。O(m + n) time, O(1) space。

**Python：**
```python
def getIntersectionNode(headA: "ListNode", headB: "ListNode") -> "ListNode":
    a, b = headA, headB
    while a is not b:
        a = a.next if a else headB
        b = b.next if b else headA
    return a
```

**TypeScript：**
```typescript
function getIntersectionNode(headA: ListNode | null, headB: ListNode | null): ListNode | null {
    let a = headA;
    let b = headB;
    while (a !== b) {
        a = a ? a.next : headB;
        b = b ? b.next : headA;
    }
    return a;
}
```

**Java：**
```java
ListNode getIntersectionNode(ListNode headA, ListNode headB) {
    ListNode a = headA;
    ListNode b = headB;
    while (a != b) {
        a = (a == null) ? headB : a.next;
        b = (b == null) ? headA : b.next;
    }
    return a;
}
```

**要点：**
- 重定向到另一条链表的头部抵消了长度差，使两个指针对齐。
- 若不相交，两个指针会在同一步同时变为 null，从而结束循环。
- 按节点身份比较（is / ===），绝不按值比较。
- 无需预先计算长度，也无需用哈希集合记录访问过的节点。

---

### 23. Reverse Linked List  ·  LC 206  ·  简单  ·  链表

**问题：** 原地反转单链表。0 <= 长度 <= 5000。

**思路：** 遍历时把每个节点的 `next` 指向不断累积的 `prev`。时间 O(n)，空间 O(1)。

**Python：**
```python
class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val = val
        self.next = next

def reverse_list(head: ListNode | None) -> ListNode | None:
    prev = None
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
    int val; ListNode next;
    ListNode(int v) { val = v; }
    ListNode(int v, ListNode n) { val = v; next = n; }
}

ListNode reverseList(ListNode head) {
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
- 改写 `cur.next` 前先保存 `next`。
- 循环结束时 `prev` 即为新头。
- 递归版本会使用 O(n) 栈空间。

---

### 24. Palindrome Linked List  ·  LC 234  ·  简单  ·  链表

**问题：** 判断单链表的值序列是否正读倒读相同。目标 O(n) 时间、O(1) 额外空间。1 <= n <= 10^5。

**思路：** 用快慢指针找到中点，就地反转后半部分，然后将其与前半部分逐节点比较；较短半部分全程相等即说明链表是回文。在中点处切分使两半可以同步遍历，而只迭代到反转后的（右侧）指针为 null，可以正确处理偶数和奇数长度两种情况。O(n) time, O(1) space。

**Python：**
```python
def isPalindrome(head: "ListNode") -> bool:
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    prev = None
    while slow:
        slow.next, prev, slow = prev, slow, slow.next
    left, right = head, prev
    while right:
        if left.val != right.val:
            return False
        left, right = left.next, right.next
    return True
```

**TypeScript：**
```typescript
function isPalindrome(head: ListNode | null): boolean {
    let slow = head;
    let fast = head;
    while (fast && fast.next) {
        slow = slow!.next;
        fast = fast.next.next;
    }
    let prev: ListNode | null = null;
    while (slow) {
        const next = slow.next;
        slow.next = prev;
        prev = slow;
        slow = next;
    }
    let left = head;
    let right = prev;
    while (right) {
        if (left!.val !== right.val) return false;
        left = left!.next;
        right = right.next;
    }
    return true;
}
```

**Java：**
```java
boolean isPalindrome(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    ListNode prev = null;
    while (slow != null) {
        ListNode next = slow.next;
        slow.next = prev;
        prev = slow;
        slow = next;
    }
    ListNode left = head, right = prev;
    while (right != null) {
        if (left.val != right.val) return false;
        left = left.next;
        right = right.next;
    }
    return true;
}
```

**要点：**
- 快慢指针使慢指针停在后半段起点（对奇数和偶数长度都适用）。
- 就地反转后半部分即可在不使用额外存储的情况下比较。
- 当右指针到达 null 时停止，会自动忽略奇数长度的中间元素。
- 数组拷贝或递归是 O(n) 空间，不满足 O(1) 的要求。

---

### 25. Linked List Cycle  ·  LC 141  ·  简单  ·  链表

**问题：** 检测单链表是否有环。0 <= 长度 <= 10^4。

**思路：** Floyd 龟兔算法；相遇则有环。时间 O(n)，空间 O(1)。

**Python：**
```python
def has_cycle(head: ListNode | None) -> bool:
    slow = fast = head
    while fast and fast.next:
        slow = slow.next  # type: ignore
        fast = fast.next.next
        if slow is fast:
            return True
    return False
```

**TypeScript：**
```typescript
function hasCycle(head: ListNode | null): boolean {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow!.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}
```

**Java：**
```java
boolean hasCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) return true;
    }
    return false;
}
```

**要点：**
- fast 的速度是 slow 的两倍。
- 相遇即说明存在环。
- 基于集合的检测需要 O(n) 空间。

---

### 26. Linked List Cycle II  ·  LC 142  ·  中等  ·  链表

**问题：** 如果存在环，返回环的起始节点；否则返回 null。

**思路：** Floyd 算法：检测到相遇后，将一个指针重新放在 head；它们将在环起点相遇。时间 O(n)，空间 O(1)。

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
- 数学原理：从 head 到环起点的距离等于从相遇点到环起点的距离对环长取模的值。
- 即使 head 本身是环起点也适用。
- 二次追赶最多再走一遍。

---

### 27. Merge Two Sorted Lists  ·  LC 21  ·  简单  ·  链表

**问题：** 将两个有序链表合并为一个有序链表。每个长度 0 <= 50。

**思路：** 哑头节点；推进较小的当前节点。时间 O(n + m)，额外空间 O(1)。

**Python：**
```python
def merge_two_lists(a: ListNode | None, b: ListNode | None) -> ListNode | None:
    dummy = ListNode()
    tail = dummy
    while a and b:
        if a.val <= b.val:
            tail.next, a = a, a.next
        else:
            tail.next, b = b, b.next
        tail = tail.next
    tail.next = a or b
    return dummy.next
```

**TypeScript：**
```typescript
function mergeTwoLists(a: ListNode | null, b: ListNode | null): ListNode | null {
  const dummy = new ListNode();
  let tail = dummy;
  while (a && b) {
    if (a.val <= b.val) { tail.next = a; a = a.next; }
    else { tail.next = b; b = b.next; }
    tail = tail.next!;
  }
  tail.next = a ?? b;
  return dummy.next;
}
```

**Java：**
```java
ListNode mergeTwoLists(ListNode a, ListNode b) {
    var dummy = new ListNode(0);
    var tail = dummy;
    while (a != null && b != null) {
        if (a.val <= b.val) { tail.next = a; a = a.next; }
        else { tail.next = b; b = b.next; }
        tail = tail.next;
    }
    tail.next = a != null ? a : b;
    return dummy.next;
}
```

**要点：**
- 哑头节点消除首节点特例。
- 追加剩余尾巴只需 O(1)。
- 相等值保持稳定顺序。

---

### 28. Add Two Numbers  ·  LC 2  ·  中等  ·  链表

**问题：** 两个非空链表以逆序表示非负整数。相加并以链表返回。1 <= len <= 100。

**思路：** 同步走两个链表并维护进位，逐节点构建输出。时间 O(max(n, m))，额外空间 O(1)。

**Python：**
```python
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
ListNode addTwoNumbers(ListNode l1, ListNode l2) {
    var dummy = new ListNode(0);
    var tail = dummy;
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
- 循环条件包含 `carry`，以处理最后一位。
- 任一链表可能先结束；缺失位视为 0。
- 输出也是逆序。

---

### 29. Remove Nth Node From End of List  ·  LC 19  ·  中等  ·  链表

**问题：** 删除链表倒数第 n 个节点并返回头。1 <= n <= 长度 <= 30。

**思路：** 双指针拉开 `n+1` 间距；fast 到达末尾时 slow 位于前驱。时间 O(L)，空间 O(1)。

**Python：**
```python
def remove_nth_from_end(head: ListNode | None, n: int) -> ListNode | None:
    dummy = ListNode(0, head)
    fast = slow = dummy
    for _ in range(n + 1):
        fast = fast.next  # type: ignore
    while fast:
        fast = fast.next
        slow = slow.next  # type: ignore
    slow.next = slow.next.next  # type: ignore
    return dummy.next
```

**TypeScript：**
```typescript
function removeNthFromEnd(head: ListNode | null, n: number): ListNode | null {
  const dummy = new ListNode(0, head);
  let fast: ListNode | null = dummy, slow: ListNode | null = dummy;
  for (let i = 0; i < n + 1; i++) fast = fast!.next;
  while (fast) { fast = fast.next; slow = slow!.next; }
  slow!.next = slow!.next!.next;
  return dummy.next;
}
```

**Java：**
```java
ListNode removeNthFromEnd(ListNode head, int n) {
    var dummy = new ListNode(0, head);
    ListNode fast = dummy, slow = dummy;
    for (int i = 0; i < n + 1; i++) fast = fast.next;
    while (fast != null) { fast = fast.next; slow = slow.next; }
    slow.next = slow.next.next;
    return dummy.next;
}
```

**要点：**
- 哑头节点简化删除头节点的处理。
- 间距 n+1 使 slow 落到前驱。
- 单次遍历优于"先求长度再走"。

---

### 30. Swap Nodes in Pairs  ·  LC 24  ·  中等  ·  链表

**问题：** 两两交换单链表的相邻节点（通过重排链接而非交换值）并返回新头。奇数时最后一个节点保持原位。0 <= n <= 100。

**思路：** 在头节点前设置一个哑节点，使第一对节点也有稳定的前驱，然后在还剩下完整一对时循环：重新链接 prev -> second -> first -> 其余，并把 prev 前移到 first 以处理下一对。哑节点省去了对头节点的特殊处理，而重连指针（而非交换值）满足题目对结构的要求。O(n) time, O(1) space。

**Python：**
```python
def swapPairs(head: "ListNode") -> "ListNode":
    dummy = ListNode(0, head)
    prev = dummy
    while prev.next and prev.next.next:
        first = prev.next
        second = first.next
        first.next = second.next
        second.next = first
        prev.next = second
        prev = first
    return dummy.next
```

**TypeScript：**
```typescript
function swapPairs(head: ListNode | null): ListNode | null {
    const dummy = new ListNode(0, head);
    let prev = dummy;
    while (prev.next && prev.next.next) {
        const first = prev.next;
        const second = first.next;
        first.next = second.next;
        second.next = first;
        prev.next = second;
        prev = first;
    }
    return dummy.next;
}
```

**Java：**
```java
ListNode swapPairs(ListNode head) {
    ListNode dummy = new ListNode(0, head);
    ListNode prev = dummy;
    while (prev.next != null && prev.next.next != null) {
        ListNode first = prev.next;
        ListNode second = first.next;
        first.next = second.next;
        second.next = first;
        prev.next = second;
        prev = first;
    }
    return dummy.next;
}
```

**要点：**
- 哑头节点避免了为交换第一对而单独分支处理。
- 循环条件 prev.next && prev.next.next 保证末尾落单的奇数节点不被处理。
- 前移之前先把 prev.next 重连到第二个节点，否则链表会断裂。
- 题目不允许交换值，必须重新链接节点本身。

---

### 31. Reverse Nodes in k-Group  ·  LC 25  ·  困难  ·  链表

**问题：** 将单链表节点按每 `k` 个一组翻转（通过重排链接）；最后不足 `k` 个的一组保持原样。返回新头。1 <= n <= 5000，1 <= k <= n。

**思路：** 使用哑节点，并维护一个始终指向待翻转组前一个位置的指针。翻转前先走 k 步确认存在完整的一组（否则停止，尾部保持不变），然后就地翻转该组的链接，再将其重新接回前一组与后一组之间。由于每个节点被访问常数次，时间复杂度为 O(n)，额外空间为 O(1)。

**Python：**
```python
def reverseKGroup(head: Optional[ListNode], k: int) -> Optional[ListNode]:
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
            nxt = cur.next
            cur.next = prev
            prev = cur
            cur = nxt
        tmp = group_prev.next
        group_prev.next = kth
        group_prev = tmp
```

**TypeScript：**
```typescript
function reverseKGroup(head: ListNode | null, k: number): ListNode | null {
    const dummy = new ListNode(0, head);
    let groupPrev = dummy;
    while (true) {
        let kth: ListNode | null = groupPrev;
        for (let i = 0; i < k; i++) {
            kth = kth!.next;
            if (!kth) return dummy.next;
        }
        const groupNext = kth!.next;
        let prev = groupNext;
        let cur = groupPrev.next;
        while (cur !== groupNext) {
            const nxt = cur!.next;
            cur!.next = prev;
            prev = cur;
            cur = nxt;
        }
        const tmp = groupPrev.next;
        groupPrev.next = kth;
        groupPrev = tmp!;
    }
}
```

**Java：**
```java
public ListNode reverseKGroup(ListNode head, int k) {
    ListNode dummy = new ListNode(0, head);
    ListNode groupPrev = dummy;
    while (true) {
        ListNode kth = groupPrev;
        for (int i = 0; i < k; i++) {
            kth = kth.next;
            if (kth == null) return dummy.next;
        }
        ListNode groupNext = kth.next;
        ListNode prev = groupNext, cur = groupPrev.next;
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
```

**要点：**
- 翻转前先检查是否存在 k 个节点，保证不足一组的尾部保持原顺序。
- 使用哑头节点避免对第一组连接做特殊处理。
- 记录将成为新组尾部的节点，以便正确串联各组。
- 只翻转链接——题目禁止交换节点的值。

---

### 32. Copy List with Random Pointer  ·  LC 138  ·  中等  ·  链表

**问题：** 深拷贝一个带 `random` 指针（指向任意节点或 null）的链表。0 <= 长度 <= 1000。

**思路：** 一次遍历将原节点哈希到克隆节点；第二次遍历连接 `next`/`random`。时间和空间 O(n)。

**Python：**
```python
class Node:
    def __init__(self, x: int, next: "Node | None" = None, random: "Node | None" = None) -> None:
        self.val = x
        self.next = next
        self.random = random

def copy_random_list(head: Node | None) -> Node | None:
    if not head:
        return None
    m: dict[Node, Node] = {}
    cur = head
    while cur:
        m[cur] = Node(cur.val)
        cur = cur.next
    cur = head
    while cur:
        m[cur].next = m.get(cur.next) if cur.next else None  # type: ignore
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
class Node {
    int val; Node next; Node random;
    Node(int v) { val = v; }
}

Node copyRandomList(Node head) {
    if (head == null) return null;
    var m = new HashMap<Node, Node>();
    for (Node cur = head; cur != null; cur = cur.next) m.put(cur, new Node(cur.val));
    for (Node cur = head; cur != null; cur = cur.next) {
        m.get(cur).next = m.get(cur.next);
        m.get(cur).random = m.get(cur.random);
    }
    return m.get(head);
}
```

**要点：**
- 两次遍历让 random 指针的解析变简单。
- 存在 O(1) 空间的穿插变体，但更难处理。
- 干净地处理空 `next` 和 `random`。

---

### 33. Sort List  ·  LC 148  ·  中等  ·  链表

**问题：** 通过重排节点将单链表排为非递减顺序，O(n log n) 时间。0 <= n <= 5*10^4。

**思路：** 采用适配链表的自顶向下归并排序：用快慢指针将链表分成两半，递归排序每一半，然后通过比较表头并重新链接来合并两个有序半段。归并排序天然契合链表，因为链表缺乏随机访问（使得快速排序的高效分区不可行），而用指针合并却十分简单。时间复杂度 O(n log n)，递归栈带来 O(log n) 空间。

**Python：**
```python
def sortList(head: Optional[ListNode]) -> Optional[ListNode]:
    if not head or not head.next:
        return head
    slow, fast = head, head.next
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    mid = slow.next
    slow.next = None
    left = sortList(head)
    right = sortList(mid)
    dummy = tail = ListNode(0)
    while left and right:
        if left.val <= right.val:
            tail.next = left
            left = left.next
        else:
            tail.next = right
            right = right.next
        tail = tail.next
    tail.next = left or right
    return dummy.next
```

**TypeScript：**
```typescript
function sortList(head: ListNode | null): ListNode | null {
    if (!head || !head.next) return head;
    let slow = head, fast = head.next;
    while (fast && fast.next) {
        slow = slow.next!;
        fast = fast.next.next;
    }
    const mid = slow.next;
    slow.next = null;
    const left = sortList(head);
    const right = sortList(mid);
    const dummy = new ListNode(0);
    let tail = dummy;
    let l = left, r = right;
    while (l && r) {
        if (l.val <= r.val) {
            tail.next = l;
            l = l.next;
        } else {
            tail.next = r;
            r = r.next;
        }
        tail = tail.next;
    }
    tail.next = l ?? r;
    return dummy.next;
}
```

**Java：**
```java
public ListNode sortList(ListNode head) {
    if (head == null || head.next == null) return head;
    ListNode slow = head, fast = head.next;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    ListNode mid = slow.next;
    slow.next = null;
    ListNode left = sortList(head);
    ListNode right = sortList(mid);
    ListNode dummy = new ListNode(0), tail = dummy;
    while (left != null && right != null) {
        if (left.val <= right.val) {
            tail.next = left;
            left = left.next;
        } else {
            tail.next = right;
            right = right.next;
        }
        tail = tail.next;
    }
    tail.next = left != null ? left : right;
    return dummy.next;
}
```

**要点：**
- 让 fast 从 head.next 开始，使切分平衡并避免两节点链表上的无限递归。
- 递归前将 slow.next 置空以切断前半段。
- 使用哑尾节点合并，简化表头处理。
- 归并排序在此优于快速排序，因为链表没有 O(1) 随机访问。

---

### 34. Merge k Sorted Lists  ·  LC 23  ·  困难  ·  链表

**问题：** 将 `k` 个有序链表合并为一个有序链表。总节点数 N。0 <= k <= 10^4。

**思路：** 小顶堆存 (val, idx, node)。弹出最小值，将其 next 入堆。时间 O(N log k)，空间 O(k)。

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
  // simple O(N log k) via divide-and-conquer merges
  if (lists.length === 0) return null;
  let step = 1;
  while (step < lists.length) {
    for (let i = 0; i + step < lists.length; i += step * 2) {
      lists[i] = mergeTwoLists(lists[i], lists[i + step]);
    }
    step *= 2;
  }
  return lists[0];
}
```

**Java：**
```java
ListNode mergeKLists(ListNode[] lists) {
    if (lists.length == 0) return null;
    int step = 1;
    while (step < lists.length) {
        for (int i = 0; i + step < lists.length; i += step * 2) {
            lists[i] = mergeTwoLists(lists[i], lists[i + step]);
        }
        step *= 2;
    }
    return lists[0];
}
```

**要点：**
- 元组的第二个元素（下标）用于打破平局，避免对节点本身做比较。
- 分治两两合并可免去堆。
- 堆方案逻辑更直观。

---

### 35. LRU Cache  ·  LC 146  ·  中等  ·  链表

**问题：** 设计容量为 `cap` 的 O(1) `get(key)` 和 `put(key, value)`。满则淘汰最久未使用项。1 <= cap <= 3000。

**思路：** 哈希表 + 双向链表；键映射到节点，链表按访问时间排序。每个操作 O(1)。

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
class LRUCache {
    private final int cap;
    private final LinkedHashMap<Integer, Integer> m;
    LRUCache(int capacity) {
        this.cap = capacity;
        this.m = new LinkedHashMap<>(capacity, 0.75f, true) {
            protected boolean removeEldestEntry(Map.Entry<Integer, Integer> e) { return size() > cap; }
        };
    }
    int get(int key) { return m.getOrDefault(key, -1); }
    void put(int key, int value) { m.put(key, value); }
}
```

**要点：**
- JS `Map` 和 Python `OrderedDict` 保留插入顺序。
- 访问时重新插入以标记为最近使用。
- 超出容量时淘汰最旧的条目。

---

### 36. Binary Tree Inorder Traversal  ·  LC 94  ·  简单  ·  二叉树

**问题：** 返回二叉树节点值的中序遍历（左、根、右）。0 <= n <= 100。进阶：用迭代实现。

**思路：** 用显式栈模拟递归：不断沿左子节点下降并压栈，然后弹出一个节点、记录其值，再转向它的右子节点。这精确重现了左-中-右的顺序，因为只有当一个节点的整个左子树都被处理完后才会记录它。时间复杂度 O(n)，空间复杂度 O(h)，h 为树高（对退化树最坏为 O(n)）。

**Python：**
```python
def inorderTraversal(root: Optional[TreeNode]) -> list[int]:
    res: list[int] = []
    stack: list[TreeNode] = []
    cur = root
    while cur or stack:
        while cur:
            stack.append(cur)
            cur = cur.left
        cur = stack.pop()
        res.append(cur.val)
        cur = cur.right
    return res
```

**TypeScript：**
```typescript
function inorderTraversal(root: TreeNode | null): number[] {
    const res: number[] = [];
    const stack: TreeNode[] = [];
    let cur = root;
    while (cur || stack.length) {
        while (cur) {
            stack.push(cur);
            cur = cur.left;
        }
        cur = stack.pop()!;
        res.push(cur.val);
        cur = cur.right;
    }
    return res;
}
```

**Java：**
```java
public List<Integer> inorderTraversal(TreeNode root) {
    List<Integer> res = new ArrayList<>();
    Deque<TreeNode> stack = new ArrayDeque<>();
    TreeNode cur = root;
    while (cur != null || !stack.isEmpty()) {
        while (cur != null) {
            stack.push(cur);
            cur = cur.left;
        }
        cur = stack.pop();
        res.add(cur.val);
        cur = cur.right;
    }
    return res;
}
```

**要点：**
- 在记录任何值之前先压入所有左子节点——这保证了中序顺序。
- 只有在左子树完全处理后才访问（记录）该节点。
- 迭代形式避免了退化树上的递归深度限制。
- 空间为 O(h)，最坏情况 O(n)，平衡树时为 O(log n)。

---

### 37. Maximum Depth of Binary Tree  ·  LC 104  ·  简单  ·  二叉树

**问题：** 返回最大深度（根到叶最长路径上的节点数）。0 <= 节点数 <= 10^4。

**思路：** 递归 1 + max(left, right)，基线为 null。时间 O(n)，栈 O(h)。

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
int maxDepth(TreeNode root) {
    if (root == null) return 0;
    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```

**要点：**
- 空树深度为 0。
- BFS 按层数计数也可。
- 迭代 DFS 用显式 (node, depth) 栈。

---

### 38. Invert Binary Tree  ·  LC 226  ·  简单  ·  二叉树

**问题：** 镜像二叉树：交换每个节点的左右子树。0 <= 节点数 <= 100。

**思路：** 递归，在每一层调用中交换左右子树。时间 O(n)，栈 O(h)。

**Python：**
```python
class TreeNode:
    def __init__(self, val: int = 0, left: "TreeNode | None" = None, right: "TreeNode | None" = None) -> None:
        self.val = val
        self.left = left
        self.right = right

def invert_tree(root: TreeNode | None) -> TreeNode | None:
    if root is None:
        return None
    root.left, root.right = invert_tree(root.right), invert_tree(root.left)
    return root
```

**TypeScript：**
```typescript
class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(v = 0, l: TreeNode | null = null, r: TreeNode | null = null) { this.val = v; this.left = l; this.right = r; }
}

function invertTree(root: TreeNode | null): TreeNode | null {
  if (!root) return null;
  const l = invertTree(root.right);
  const r = invertTree(root.left);
  root.left = l; root.right = r;
  return root;
}
```

**Java：**
```java
class TreeNode {
    int val; TreeNode left, right;
    TreeNode(int v) { val = v; }
    TreeNode(int v, TreeNode l, TreeNode r) { val = v; left = l; right = r; }
}

TreeNode invertTree(TreeNode root) {
    if (root == null) return null;
    TreeNode l = invertTree(root.right);
    TreeNode r = invertTree(root.left);
    root.left = l; root.right = r;
    return root;
}
```

**要点：**
- 后序交换也可。
- BFS 变体用队列迭代，每次交换。
- 要先求值再赋值，避免丢失子树。

---

### 39. Symmetric Tree  ·  LC 101  ·  简单  ·  二叉树

**问题：** 判断二叉树是否关于其中心轴镜像对称（左子树在结构和值上是右子树的镜像）。1 <= n <= 1000。

**思路：** 用一个辅助函数成对比较两棵子树，检查树 a 是否为树 b 的镜像：两者皆空则对称，恰好一个为空或值不相等则不对称，否则递归比较外侧一对（a.left 与 b.right）和内侧一对（a.right 与 b.left）。镜像要求交叉比较子节点，这正是左与右配对的原因。每个节点访问一次，时间复杂度 O(n)，递归空间 O(h)。

**Python：**
```python
def isSymmetric(root: Optional[TreeNode]) -> bool:
    def mirror(a: Optional[TreeNode], b: Optional[TreeNode]) -> bool:
        if not a and not b:
            return True
        if not a or not b or a.val != b.val:
            return False
        return mirror(a.left, b.right) and mirror(a.right, b.left)
    return mirror(root.left, root.right) if root else True
```

**TypeScript：**
```typescript
function isSymmetric(root: TreeNode | null): boolean {
    const mirror = (a: TreeNode | null, b: TreeNode | null): boolean => {
        if (!a && !b) return true;
        if (!a || !b || a.val !== b.val) return false;
        return mirror(a.left, b.right) && mirror(a.right, b.left);
    };
    return root ? mirror(root.left, root.right) : true;
}
```

**Java：**
```java
public boolean isSymmetric(TreeNode root) {
    return root == null || mirror(root.left, root.right);
}

private boolean mirror(TreeNode a, TreeNode b) {
    if (a == null && b == null) return true;
    if (a == null || b == null || a.val != b.val) return false;
    return mirror(a.left, b.right) && mirror(a.right, b.left);
}
```

**要点：**
- 比较 a.left 与 b.right、a.right 与 b.left——交叉配对是镜像判断的关键。
- 显式处理都为空、只有一个为空、以及值不匹配三种情况。
- 单节点或空树天然对称。
- 也可用队列成对处理节点来迭代求解。

---

### 40. Diameter of Binary Tree  ·  LC 543  ·  简单  ·  二叉树

**问题：** 返回二叉树的直径——任意两节点间最长路径上的边数（路径不一定经过根）。1 <= n <= 10^4。

**思路：** 执行一次后序 DFS，在返回每棵子树高度的同时维护一个全局最大值。在每个节点处，经过它的最长路径等于左子树高度加右子树高度（以边计），因此用该和更新全局最优值，并向父节点返回 1 + max(左, 右)。每个节点只计算一次高度，避免了重复计算高度导致的 O(n^2) 开销，时间复杂度 O(n)，空间复杂度 O(h)。

**Python：**
```python
def diameterOfBinaryTree(root: Optional[TreeNode]) -> int:
    best = 0
    def depth(node: Optional[TreeNode]) -> int:
        nonlocal best
        if not node:
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
    const depth = (node: TreeNode | null): number => {
        if (!node) return 0;
        const l = depth(node.left);
        const r = depth(node.right);
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

public int diameterOfBinaryTree(TreeNode root) {
    depth(root);
    return best;
}

private int depth(TreeNode node) {
    if (node == null) return 0;
    int l = depth(node.left);
    int r = depth(node.right);
    best = Math.max(best, l + r);
    return 1 + Math.max(l, r);
}
```

**要点：**
- 经过某节点的直径 = 左子树高度 + 右子树高度（以边计）。
- 向父节点返回高度，但用单独的全局最大值记录答案。
- 最长路径不一定经过根节点，故需在每个节点处更新最大值。
- 自顶向下重复计算高度会是 O(n^2)；后序遍历用 O(n) 完成。

---

### 41. Binary Tree Level Order Traversal  ·  LC 102  ·  中等  ·  二叉树

**问题：** 按层级（从上到下）返回节点值。0 <= 节点数 <= 2000。

**思路：** 用队列做 BFS；收集每层的值。时间和空间均 O(n)。

**Python：**
```python
from collections import deque

def level_order(root: TreeNode | None) -> list[list[int]]:
    if not root:
        return []
    out: list[list[int]] = []
    q: deque[TreeNode] = deque([root])
    while q:
        level = []
        for _ in range(len(q)):
            node = q.popleft()
            level.append(node.val)
            if node.left: q.append(node.left)
            if node.right: q.append(node.right)
        out.append(level)
    return out
```

**TypeScript：**
```typescript
function levelOrder(root: TreeNode | null): number[][] {
  if (!root) return [];
  const out: number[][] = [];
  let q: TreeNode[] = [root];
  while (q.length) {
    const level: number[] = [];
    const next: TreeNode[] = [];
    for (const n of q) {
      level.push(n.val);
      if (n.left) next.push(n.left);
      if (n.right) next.push(n.right);
    }
    out.push(level);
    q = next;
  }
  return out;
}
```

**Java：**
```java
List<List<Integer>> levelOrder(TreeNode root) {
    var out = new ArrayList<List<Integer>>();
    if (root == null) return out;
    var q = new ArrayDeque<TreeNode>();
    q.offer(root);
    while (!q.isEmpty()) {
        int size = q.size();
        var level = new ArrayList<Integer>();
        for (int i = 0; i < size; i++) {
            TreeNode n = q.poll();
            level.add(n.val);
            if (n.left != null) q.offer(n.left);
            if (n.right != null) q.offer(n.right);
        }
        out.add(level);
    }
    return out;
}
```

**要点：**
- 用队列长度划分每一层。
- 空树返回空列表。
- 稍作修改即可适配任意分叉度。

---

### 42. Convert Sorted Array to Binary Search Tree  ·  LC 108  ·  简单  ·  二叉树

**问题：** 给定升序数组，构造一棵高度平衡的 BST（子树高度差至多 1）并返回根。任意合法树均可。1 <= n <= 10^4。

**思路：** 由于数组已排序，取中间元素作为根节点，其左右两侧分别构成左右子树，从而在构造上天然保证平衡。用下标边界而非切片递归处理每一半，避免复制。每个元素只访问一次，时间复杂度 O(n)，辅助栈空间 O(log n)（输出树本身另需 O(n)）。

**Python：**
```python
from typing import Optional

class TreeNode:
    def __init__(self, val: int = 0, left: 'Optional[TreeNode]' = None, right: 'Optional[TreeNode]' = None):
        self.val = val
        self.left = left
        self.right = right

def sorted_array_to_bst(nums: list[int]) -> Optional[TreeNode]:
    def build(lo: int, hi: int) -> Optional[TreeNode]:
        if lo > hi:
            return None
        mid = (lo + hi) // 2
        node = TreeNode(nums[mid])
        node.left = build(lo, mid - 1)
        node.right = build(mid + 1, hi)
        return node
    return build(0, len(nums) - 1)
```

**TypeScript：**
```typescript
class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function sortedArrayToBST(nums: number[]): TreeNode | null {
  const build = (lo: number, hi: number): TreeNode | null => {
    if (lo > hi) return null;
    const mid = (lo + hi) >> 1;
    const node = new TreeNode(nums[mid]);
    node.left = build(lo, mid - 1);
    node.right = build(mid + 1, hi);
    return node;
  };
  return build(0, nums.length - 1);
}
```

**Java：**
```java
class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode(int val) { this.val = val; }
}

class Solution {
    public TreeNode sortedArrayToBST(int[] nums) {
        return build(nums, 0, nums.length - 1);
    }

    private TreeNode build(int[] nums, int lo, int hi) {
        if (lo > hi) return null;
        int mid = (lo + hi) >>> 1;
        TreeNode node = new TreeNode(nums[mid]);
        node.left = build(nums, lo, mid - 1);
        node.right = build(nums, mid + 1, hi);
        return node;
    }
}
```

**要点：**
- 取中间元素作为根节点可免费保证高度平衡性质
- 使用 lo/hi 下标边界而非数组切片，保持 O(n) 并避免额外分配
- 任意一致的中点选择（偏左或偏右）都能得到合法答案

---

### 43. Validate Binary Search Tree  ·  LC 98  ·  中等  ·  二叉树

**问题：** 如果二叉树是有效 BST，返回 true。1 <= 节点数 <= 10^4。

**思路：** 带 `(low, high)` 范围的 DFS，每次递归收紧上下界。时间 O(n)，栈 O(h)。

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
boolean isValidBST(TreeNode root) {
    return go(root, Long.MIN_VALUE, Long.MAX_VALUE);
}

boolean go(TreeNode n, long lo, long hi) {
    if (n == null) return true;
    if (n.val <= lo || n.val >= hi) return false;
    return go(n.left, lo, n.val) && go(n.right, n.val, hi);
}
```

**要点：**
- 严格不等式强制唯一性。
- 边界向下传递，而非向上。
- 中序遍历替代方案：值必须严格递增。

---

### 44. Kth Smallest Element in a BST  ·  LC 230  ·  中等  ·  二叉树

**问题：** 返回 BST 中第 k 小的值。1 <= k <= 节点数 <= 10^4。

**思路：** 迭代中序遍历；k 次出栈后停止。时间 O(h + k)，栈 O(h)。

**Python：**
```python
def kth_smallest(root: TreeNode | None, k: int) -> int:
    stack: list[TreeNode] = []
    cur = root
    while cur or stack:
        while cur:
            stack.append(cur)
            cur = cur.left
        cur = stack.pop()
        k -= 1
        if k == 0:
            return cur.val
        cur = cur.right
    return -1
```

**TypeScript：**
```typescript
function kthSmallest(root: TreeNode | null, k: number): number {
  const stack: TreeNode[] = [];
  let cur = root;
  while (cur || stack.length) {
    while (cur) { stack.push(cur); cur = cur.left; }
    cur = stack.pop()!;
    if (--k === 0) return cur.val;
    cur = cur.right;
  }
  return -1;
}
```

**Java：**
```java
int kthSmallest(TreeNode root, int k) {
    var stack = new ArrayDeque<TreeNode>();
    TreeNode cur = root;
    while (cur != null || !stack.isEmpty()) {
        while (cur != null) { stack.push(cur); cur = cur.left; }
        cur = stack.pop();
        if (--k == 0) return cur.val;
        cur = cur.right;
    }
    return -1;
}
```

**要点：**
- BST 中序遍历产生有序序列。
- 每次访问后递减 k。
- 递归版本更短，但使用调用栈。

---

### 45. Binary Tree Right Side View  ·  LC 199  ·  中等  ·  二叉树

**问题：** 返回从右侧看到的二叉树节点值，从上到下（每层最右侧的节点）。0 <= n <= 100。

**思路：** 进行层序（广度优先）遍历，逐层处理；每层最后一个出队的节点即为从右侧可见的节点。在遍历前记录该层的节点数，就能准确知道每一层在何处结束。每个节点入队出队各一次，时间复杂度 O(n)，空间复杂度 O(w)，w 为树的最大宽度。

**Python：**
```python
from typing import Optional
from collections import deque

class TreeNode:
    def __init__(self, val: int = 0, left: 'Optional[TreeNode]' = None, right: 'Optional[TreeNode]' = None):
        self.val = val
        self.left = left
        self.right = right

def right_side_view(root: Optional[TreeNode]) -> list[int]:
    if not root:
        return []
    result: list[int] = []
    queue: deque[TreeNode] = deque([root])
    while queue:
        n = len(queue)
        for i in range(n):
            node = queue.popleft()
            if i == n - 1:
                result.append(node.val)
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
    return result
```

**TypeScript：**
```typescript
class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function rightSideView(root: TreeNode | null): number[] {
  const result: number[] = [];
  if (!root) return result;
  let level: TreeNode[] = [root];
  while (level.length > 0) {
    result.push(level[level.length - 1].val);
    const next: TreeNode[] = [];
    for (const node of level) {
      if (node.left) next.push(node.left);
      if (node.right) next.push(node.right);
    }
    level = next;
  }
  return result;
}
```

**Java：**
```java
import java.util.*;

class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode(int val) { this.val = val; }
}

class Solution {
    public List<Integer> rightSideView(TreeNode root) {
        List<Integer> result = new ArrayList<>();
        if (root == null) return result;
        Queue<TreeNode> queue = new ArrayDeque<>();
        queue.offer(root);
        while (!queue.isEmpty()) {
            int n = queue.size();
            for (int i = 0; i < n; i++) {
                TreeNode node = queue.poll();
                if (i == n - 1) result.add(node.val);
                if (node.left != null) queue.offer(node.left);
                if (node.right != null) queue.offer(node.right);
            }
        }
        return result;
    }
}
```

**要点：**
- 每一层最右侧的节点就是该层的答案
- 在循环前记录层大小，避免不同层混在一起
- 先右后左的 DFS 并记录每个新深度首次遇到的节点也可行

---

### 46. Flatten Binary Tree to Linked List  ·  LC 114  ·  中等  ·  二叉树

**问题：** 将二叉树原地展平为按前序的右倾「链表」：每个左孩子变为 null，每个右孩子指向前序的下一个节点。0 <= n <= 2000。

**思路：** 使用 Morris 式穿线技巧：对每个有左子树的节点，找到其左子树的最右节点（即右子树的前序前驱），把当前右子树接到那里，再将整个左子树移到右侧并清空左指针。沿右指针前进即可处理整棵树。每条边被遍历常数次，时间复杂度 O(n)，额外空间 O(1)。

**Python：**
```python
from typing import Optional

class TreeNode:
    def __init__(self, val: int = 0, left: 'Optional[TreeNode]' = None, right: 'Optional[TreeNode]' = None):
        self.val = val
        self.left = left
        self.right = right

def flatten(root: Optional[TreeNode]) -> None:
    curr = root
    while curr:
        if curr.left:
            prev = curr.left
            while prev.right:
                prev = prev.right
            prev.right = curr.right
            curr.right = curr.left
            curr.left = None
        curr = curr.right
```

**TypeScript：**
```typescript
class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function flatten(root: TreeNode | null): void {
  let curr = root;
  while (curr) {
    if (curr.left) {
      let prev = curr.left;
      while (prev.right) prev = prev.right;
      prev.right = curr.right;
      curr.right = curr.left;
      curr.left = null;
    }
    curr = curr.right;
  }
}
```

**Java：**
```java
class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode(int val) { this.val = val; }
}

class Solution {
    public void flatten(TreeNode root) {
        TreeNode curr = root;
        while (curr != null) {
            if (curr.left != null) {
                TreeNode prev = curr.left;
                while (prev.right != null) prev = prev.right;
                prev.right = curr.right;
                curr.right = curr.left;
                curr.left = null;
            }
            curr = curr.right;
        }
    }
}
```

**要点：**
- 左子树的最右节点是原右子树需要重新接入的位置
- 穿线法实现 O(1) 空间，优于 O(h) 递归栈的做法
- 移动子树后必须将左指针置空，否则结构仍不合法

---

### 47. Construct Binary Tree from Preorder and Inorder Traversal  ·  LC 105  ·  中等  ·  二叉树

**问题：** 由 `preorder` 和 `inorder` 遍历（值唯一）构造二叉树。1 <= 长度 <= 3000。

**思路：** preorder 首元素是根；在 inorder 中定位以拆分大小；递归。借助下标映射可达 O(n)。

**Python：**
```python
def build_tree(preorder: list[int], inorder: list[int]) -> TreeNode | None:
    idx = {v: i for i, v in enumerate(inorder)}
    pre_iter = iter(preorder)
    def go(l: int, r: int) -> TreeNode | None:
        if l > r:
            return None
        v = next(pre_iter)
        node = TreeNode(v)
        m = idx[v]
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
int preIdx = 0;

TreeNode buildTree(int[] preorder, int[] inorder) {
    var idx = new HashMap<Integer, Integer>();
    for (int i = 0; i < inorder.length; i++) idx.put(inorder[i], i);
    return go(preorder, idx, 0, inorder.length - 1);
}

TreeNode go(int[] preorder, Map<Integer, Integer> idx, int l, int r) {
    if (l > r) return null;
    int v = preorder[preIdx++];
    var node = new TreeNode(v);
    int m = idx.get(v);
    node.left = go(preorder, idx, l, m - 1);
    node.right = go(preorder, idx, m + 1, r);
    return node;
}
```

**要点：**
- 下标映射使 inorder 查找降到 O(1)。
- 通过共享指针/迭代器按顺序消费 preorder。
- inorder 边界界定子树范围。

---

### 48. Path Sum III  ·  LC 437  ·  中等  ·  二叉树

**问题：** 统计二叉树中节点值之和等于 `target` 的向下路径（父到子，起点终点任意）数量。0 <= n <= 1000，值范围 [-10^9, 10^9]。

**思路：** 维护从根到当前节点的前缀和，并用哈希表记录当前路径上出现过的每个前缀和的次数；对当前节点，等于 current - target 的每个较早前缀都对应一条以当前节点结尾的合法路径。进入子节点前把当前前缀加入表中，回溯时移除，保证只统计活跃路径上的祖先。每个节点访问一次且哈希操作 O(1)，时间复杂度 O(n)，表与递归空间 O(h)。

**Python：**
```python
from typing import Optional
from collections import defaultdict

class TreeNode:
    def __init__(self, val: int = 0, left: 'Optional[TreeNode]' = None, right: 'Optional[TreeNode]' = None):
        self.val = val
        self.left = left
        self.right = right

def path_sum(root: Optional[TreeNode], target_sum: int) -> int:
    prefix: dict[int, int] = defaultdict(int)
    prefix[0] = 1

    def dfs(node: Optional[TreeNode], curr: int) -> int:
        if not node:
            return 0
        curr += node.val
        count = prefix[curr - target_sum]
        prefix[curr] += 1
        count += dfs(node.left, curr) + dfs(node.right, curr)
        prefix[curr] -= 1
        return count

    return dfs(root, 0)
```

**TypeScript：**
```typescript
class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function pathSum(root: TreeNode | null, targetSum: number): number {
  const prefix = new Map<number, number>();
  prefix.set(0, 1);

  const dfs = (node: TreeNode | null, curr: number): number => {
    if (!node) return 0;
    curr += node.val;
    let count = prefix.get(curr - targetSum) ?? 0;
    prefix.set(curr, (prefix.get(curr) ?? 0) + 1);
    count += dfs(node.left, curr) + dfs(node.right, curr);
    prefix.set(curr, (prefix.get(curr) ?? 0) - 1);
    return count;
  };

  return dfs(root, 0);
}
```

**Java：**
```java
import java.util.*;

class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode(int val) { this.val = val; }
}

class Solution {
    public int pathSum(TreeNode root, int targetSum) {
        Map<Long, Integer> prefix = new HashMap<>();
        prefix.put(0L, 1);
        return dfs(root, 0L, targetSum, prefix);
    }

    private int dfs(TreeNode node, long curr, int targetSum, Map<Long, Integer> prefix) {
        if (node == null) return 0;
        curr += node.val;
        int count = prefix.getOrDefault(curr - targetSum, 0);
        prefix.merge(curr, 1, Integer::sum);
        count += dfs(node.left, curr, targetSum, prefix);
        count += dfs(node.right, curr, targetSum, prefix);
        prefix.merge(curr, -1, Integer::sum);
        return count;
    }
}
```

**要点：**
- 前缀和计数把每个节点 O(n^2) 的搜索降为整体 O(n) 一趟
- 用 {0: 1} 初始化哈希表，以统计从根开始的路径
- 回溯时必须递减前缀计数，否则无关分支会污染结果
- 和可能超过 32 位（值最大 1e9，节点最多 1000），需用 64 位累加

---

### 49. Lowest Common Ancestor of a Binary Tree  ·  LC 236  ·  中等  ·  二叉树

**问题：** 在一般二叉树中找节点 `p` 和 `q` 的 LCA。2 <= 节点数 <= 10^5。

**思路：** 递归；返回非空的子树结果。若两侧都非空，则当前节点是 LCA。时间 O(n)，栈 O(h)。

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
- 题目保证两个目标都在树中。
- 等于 p 或 q 的节点可以是其自身的 LCA。
- 单侧非空的上传给出较深的命中节点。

---

### 50. Binary Tree Maximum Path Sum  ·  LC 124  ·  困难  ·  二叉树

**问题：** 找出任意两个节点之间路径的最大和（允许弯曲）。1 <= 节点数 <= 3*10^4，值可为负。

**思路：** 后序遍历；每个节点返回不分叉的最大增益，同时用分叉路径更新全局最优。时间 O(n)，栈 O(h)。

**Python：**
```python
def max_path_sum(root: TreeNode | None) -> int:
    best = float("-inf")
    def gain(n: TreeNode | None) -> int:
        nonlocal best
        if n is None:
            return 0
        l = max(0, gain(n.left))
        r = max(0, gain(n.right))
        best = max(best, n.val + l + r)
        return n.val + max(l, r)
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
int best = Integer.MIN_VALUE;

int maxPathSum(TreeNode root) {
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
- 负分支贡献按 0 计（可以跳过它们）。
- 返回的增益只包含单分支（用于经父节点的路径）。
- 每个节点的全局更新比较的是完整的弯曲路径。

---

### 51. Number of Islands  ·  LC 200  ·  中等  ·  图论

**问题：** 统计网格中四连通 '1' 组成的岛屿数量。1 <= m, n <= 300。

**思路：** 遍历单元格；每遇 '1' 用 DFS 洪泛标记已访问。时间 O(m*n)。

**Python：**
```python
def num_islands(grid: list[list[str]]) -> int:
    if not grid:
        return 0
    rows, cols = len(grid), len(grid[0])
    def dfs(r: int, c: int) -> None:
        if r < 0 or c < 0 or r >= rows or c >= cols or grid[r][c] != "1":
            return
        grid[r][c] = "0"
        dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1)
    count = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1":
                count += 1
                dfs(r, c)
    return count
```

**TypeScript：**
```typescript
function numIslands(grid: string[][]): number {
  if (!grid.length) return 0;
  const rows = grid.length, cols = grid[0].length;
  const dfs = (r: number, c: number) => {
    if (r < 0 || c < 0 || r >= rows || c >= cols || grid[r][c] !== "1") return;
    grid[r][c] = "0";
    dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1);
  };
  let count = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (grid[r][c] === "1") { count++; dfs(r, c); }
  return count;
}
```

**Java：**
```java
int numIslands(char[][] grid) {
    if (grid.length == 0) return 0;
    int rows = grid.length, cols = grid[0].length, count = 0;
    for (int r = 0; r < rows; r++)
        for (int c = 0; c < cols; c++)
            if (grid[r][c] == '1') { count++; dfs(grid, r, c); }
    return count;
}

void dfs(char[][] grid, int r, int c) {
    if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length || grid[r][c] != '1') return;
    grid[r][c] = '0';
    dfs(grid, r + 1, c); dfs(grid, r - 1, c); dfs(grid, r, c + 1); dfs(grid, r, c - 1);
}
```

**要点：**
- 将网格改为 '0' 表示已访问，无需额外内存。
- BFS 变体可避免深递归栈。
- 4 连通下对角线不算相连。

---

### 52. Rotting Oranges  ·  LC 994  ·  中等  ·  图论

**问题：** 在 m x n 网格中格子为 0（空）、1（新鲜）、2（腐烂），每分钟每个与腐烂橘子四方向相邻的新鲜橘子腐烂。返回直到无新鲜橘子的分钟数，若不可能返回 -1。1 <= m, n <= 10。

**思路：** 从所有初始腐烂的橘子同时开始进行多源广度优先搜索，按分钟（即 BFS 每一层）逐层处理网格，并在新鲜橘子腐烂时计数。当队列清空后仍有新鲜橘子，说明它们不可达，返回 -1；否则处理的层数即为耗时。每个格子最多入队一次，时间复杂度 O(m*n)，空间复杂度 O(m*n)。

**Python：**
```python
from collections import deque

def oranges_rotting(grid: list[list[int]]) -> int:
    rows, cols = len(grid), len(grid[0])
    queue: deque[tuple[int, int]] = deque()
    fresh = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 2:
                queue.append((r, c))
            elif grid[r][c] == 1:
                fresh += 1
    minutes = 0
    while queue and fresh > 0:
        minutes += 1
        for _ in range(len(queue)):
            r, c = queue.popleft()
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1:
                    grid[nr][nc] = 2
                    fresh -= 1
                    queue.append((nr, nc))
    return -1 if fresh > 0 else minutes
```

**TypeScript：**
```typescript
function orangesRotting(grid: number[][]): number {
  const rows = grid.length;
  const cols = grid[0].length;
  let queue: [number, number][] = [];
  let fresh = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 2) queue.push([r, c]);
      else if (grid[r][c] === 1) fresh++;
    }
  }
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let minutes = 0;
  while (queue.length > 0 && fresh > 0) {
    minutes++;
    const next: [number, number][] = [];
    for (const [r, c] of queue) {
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 1) {
          grid[nr][nc] = 2;
          fresh--;
          next.push([nr, nc]);
        }
      }
    }
    queue = next;
  }
  return fresh > 0 ? -1 : minutes;
}
```

**Java：**
```java
import java.util.*;

class Solution {
    public int orangesRotting(int[][] grid) {
        int rows = grid.length;
        int cols = grid[0].length;
        Queue<int[]> queue = new ArrayDeque<>();
        int fresh = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 2) queue.offer(new int[]{r, c});
                else if (grid[r][c] == 1) fresh++;
            }
        }
        int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        int minutes = 0;
        while (!queue.isEmpty() && fresh > 0) {
            minutes++;
            int size = queue.size();
            for (int i = 0; i < size; i++) {
                int[] cell = queue.poll();
                for (int[] d : dirs) {
                    int nr = cell[0] + d[0];
                    int nc = cell[1] + d[1];
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1) {
                        grid[nr][nc] = 2;
                        fresh--;
                        queue.offer(new int[]{nr, nc});
                    }
                }
            }
        }
        return fresh > 0 ? -1 : minutes;
    }
}
```

**要点：**
- 将所有腐烂橘子同时放入 BFS 队列，使腐烂并行扩散
- 跟踪新鲜橘子计数以检测不可达橘子并返回 -1
- 仅当仍有新鲜橘子可腐烂时才增加分钟计数，因此全新鲜为空的网格返回 0
- 按层处理队列而非逐个格子，才能正确计量分钟数

---

### 53. Course Schedule  ·  LC 207  ·  中等  ·  图论

**问题：** 给定先修课程表，判断是否所有课程都能完成。n <= 2000。

**思路：** 通过 Kahn BFS（入度法）检测环。时间 O(V+E)。

**Python：**
```python
from collections import defaultdict, deque

def can_finish(num_courses: int, prerequisites: list[list[int]]) -> bool:
    graph = defaultdict(list)
    indeg = [0] * num_courses
    for a, b in prerequisites:
        graph[b].append(a)
        indeg[a] += 1
    q = deque([i for i in range(num_courses) if indeg[i] == 0])
    done = 0
    while q:
        u = q.popleft()
        done += 1
        for v in graph[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    return done == num_courses
```

**TypeScript：**
```typescript
function canFinish(numCourses: number, prerequisites: number[][]): boolean {
  const graph: number[][] = Array.from({ length: numCourses }, () => []);
  const indeg = new Array(numCourses).fill(0);
  for (const [a, b] of prerequisites) { graph[b].push(a); indeg[a]++; }
  const q: number[] = [];
  for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) q.push(i);
  let done = 0;
  while (q.length) {
    const u = q.shift()!;
    done++;
    for (const v of graph[u]) if (--indeg[v] === 0) q.push(v);
  }
  return done === numCourses;
}
```

**Java：**
```java
boolean canFinish(int numCourses, int[][] prerequisites) {
    List<List<Integer>> graph = new ArrayList<>();
    for (int i = 0; i < numCourses; i++) graph.add(new ArrayList<>());
    int[] indeg = new int[numCourses];
    for (var p : prerequisites) { graph.get(p[1]).add(p[0]); indeg[p[0]]++; }
    var q = new ArrayDeque<Integer>();
    for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) q.offer(i);
    int done = 0;
    while (!q.isEmpty()) {
        int u = q.poll();
        done++;
        for (int v : graph.get(u)) if (--indeg[v] == 0) q.offer(v);
    }
    return done == numCourses;
}
```

**要点：**
- 有效顺序存在当且仅当无环。
- Kahn BFS 处理入度为零的节点。
- DFS 三色标记是替代方案。

---

### 54. Implement Trie (Prefix Tree)  ·  LC 208  ·  中等  ·  图论

**问题：** 实现 trie 的 `insert`、`search` 和 `startsWith`。1 <= 调用数 <= 3*10^4。

**思路：** 每个字符对应嵌套字典和一个终止标志。所有操作 O(L)。

**Python：**
```python
class Trie:
    def __init__(self) -> None:
        self.root: dict = {}

    def insert(self, word: str) -> None:
        node = self.root
        for c in word:
            node = node.setdefault(c, {})
        node["$"] = True

    def search(self, word: str) -> bool:
        node = self._find(word)
        return bool(node and node.get("$"))

    def startsWith(self, prefix: str) -> bool:
        return self._find(prefix) is not None

    def _find(self, s: str) -> dict | None:
        node = self.root
        for c in s:
            if c not in node:
                return None
            node = node[c]
        return node
```

**TypeScript：**
```typescript
class Trie {
  private root: { [k: string]: any } = {};
  insert(word: string): void {
    let node = this.root;
    for (const c of word) { if (!node[c]) node[c] = {}; node = node[c]; }
    node.$ = true;
  }
  search(word: string): boolean {
    const n = this.find(word);
    return !!(n && n.$);
  }
  startsWith(prefix: string): boolean {
    return this.find(prefix) !== null;
  }
  private find(s: string): any {
    let node = this.root;
    for (const c of s) { if (!node[c]) return null; node = node[c]; }
    return node;
  }
}
```

**Java：**
```java
class Trie {
    static class Node {
        Map<Character, Node> children = new HashMap<>();
        boolean end;
    }
    private final Node root = new Node();

    void insert(String word) {
        var node = root;
        for (char c : word.toCharArray()) node = node.children.computeIfAbsent(c, k -> new Node());
        node.end = true;
    }
    boolean search(String word) {
        var n = find(word);
        return n != null && n.end;
    }
    boolean startsWith(String prefix) { return find(prefix) != null; }
    private Node find(String s) {
        var node = root;
        for (char c : s.toCharArray()) {
            node = node.children.get(c);
            if (node == null) return null;
        }
        return node;
    }
}
```

**要点：**
- 终止标志区分词尾和前缀。
- 每节点使用对象/字典占用更多内存但读起来直观。
- 对固定字母表，使用长度 26 的子数组更快。

---

### 55. Permutations  ·  LC 46  ·  中等  ·  回溯

**问题：** 返回互不相同整数的所有排列。1 <= len(nums) <= 6。

**思路：** 借助 used 标志集的回溯。时间 O(n * n!)。

**Python：**
```python
def permute(nums: list[int]) -> list[list[int]]:
    out: list[list[int]] = []
    used = [False] * len(nums)
    path: list[int] = []
    def go() -> None:
        if len(path) == len(nums):
            out.append(path.copy())
            return
        for i, x in enumerate(nums):
            if used[i]:
                continue
            used[i] = True
            path.append(x); go(); path.pop()
            used[i] = False
    go()
    return out
```

**TypeScript：**
```typescript
function permute(nums: number[]): number[][] {
  const out: number[][] = [];
  const used = new Array(nums.length).fill(false);
  const path: number[] = [];
  const go = (): void => {
    if (path.length === nums.length) { out.push([...path]); return; }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      used[i] = true; path.push(nums[i]); go();
      path.pop(); used[i] = false;
    }
  };
  go();
  return out;
}
```

**Java：**
```java
List<List<Integer>> permute(int[] nums) {
    var out = new ArrayList<List<Integer>>();
    boolean[] used = new boolean[nums.length];
    var path = new ArrayList<Integer>();
    go(nums, used, path, out);
    return out;
}

void go(int[] nums, boolean[] used, List<Integer> path, List<List<Integer>> out) {
    if (path.size() == nums.length) { out.add(new ArrayList<>(path)); return; }
    for (int i = 0; i < nums.length; i++) {
        if (used[i]) continue;
        used[i] = true; path.add(nums[i]);
        go(nums, used, path, out);
        path.remove(path.size() - 1); used[i] = false;
    }
}
```

**要点：**
- 跟踪已使用位置以避免重复使用值。
- 输出数量正好是 n!。
- 原地交换变体可节省内存。

---

### 56. Subsets  ·  LC 78  ·  中等  ·  回溯

**问题：** 返回去重整数数组的所有子集。1 <= len(nums) <= 10。

**思路：** 回溯，按选与不选每个元素分支。时间 O(2^n)。

**Python：**
```python
def subsets(nums: list[int]) -> list[list[int]]:
    out: list[list[int]] = []
    path: list[int] = []
    def go(i: int) -> None:
        if i == len(nums):
            out.append(path.copy())
            return
        path.append(nums[i]); go(i + 1); path.pop()
        go(i + 1)
    go(0)
    return out
```

**TypeScript：**
```typescript
function subsets(nums: number[]): number[][] {
  const out: number[][] = [];
  const path: number[] = [];
  const go = (i: number): void => {
    if (i === nums.length) { out.push([...path]); return; }
    path.push(nums[i]); go(i + 1); path.pop();
    go(i + 1);
  };
  go(0);
  return out;
}
```

**Java：**
```java
List<List<Integer>> subsets(int[] nums) {
    var out = new ArrayList<List<Integer>>();
    var path = new ArrayList<Integer>();
    go(nums, 0, path, out);
    return out;
}

void go(int[] nums, int i, List<Integer> path, List<List<Integer>> out) {
    if (i == nums.length) { out.add(new ArrayList<>(path)); return; }
    path.add(nums[i]); go(nums, i + 1, path, out); path.remove(path.size() - 1);
    go(nums, i + 1, path, out);
}
```

**要点：**
- "选-不选"模式最简洁。
- 输出大小恰好 2^n。
- 迭代位掩码是另一种常见方法。

---

### 57. Letter Combinations of a Phone Number  ·  LC 17  ·  中等  ·  回溯

**问题：** 给定数字 2-9，返回它们可能表示的所有字母组合。0 <= len(digits) <= 4。

**思路：** 对每个数字的字母做 DFS。O(3^n * 4^m)，其中 4 字母按键贡献 4^m。

**Python：**
```python
def letter_combinations(digits: str) -> list[str]:
    if not digits:
        return []
    table = {"2": "abc", "3": "def", "4": "ghi", "5": "jkl",
             "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz"}
    out: list[str] = []
    path: list[str] = []
    def go(i: int) -> None:
        if i == len(digits):
            out.append("".join(path)); return
        for c in table[digits[i]]:
            path.append(c); go(i + 1); path.pop()
    go(0)
    return out
```

**TypeScript：**
```typescript
function letterCombinations(digits: string): string[] {
  if (!digits) return [];
  const table: Record<string, string> = { "2": "abc", "3": "def", "4": "ghi", "5": "jkl", "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz" };
  const out: string[] = [];
  const path: string[] = [];
  const go = (i: number): void => {
    if (i === digits.length) { out.push(path.join("")); return; }
    for (const c of table[digits[i]]) { path.push(c); go(i + 1); path.pop(); }
  };
  go(0);
  return out;
}
```

**Java：**
```java
static final String[] TABLE = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};

List<String> letterCombinations(String digits) {
    var out = new ArrayList<String>();
    if (digits.isEmpty()) return out;
    go(digits, 0, new StringBuilder(), out);
    return out;
}

void go(String digits, int i, StringBuilder path, List<String> out) {
    if (i == digits.length()) { out.add(path.toString()); return; }
    for (char c : TABLE[digits.charAt(i) - '0'].toCharArray()) {
        path.append(c);
        go(digits, i + 1, path, out);
        path.deleteCharAt(path.length() - 1);
    }
}
```

**要点：**
- 空输入返回空列表，而不是 [""]。
- 字典将数字映射到候选字母。
- 迭代 BFS 展开同样有效。

---

### 58. Combination Sum  ·  LC 39  ·  中等  ·  回溯

**问题：** 返回所有由互异候选数（每个可无限使用）求和为 target 的去重组合。1 <= len(candidates) <= 30。

**思路：** 回溯，借助下标避免重复排序。最坏 O(2^t)。

**Python：**
```python
def combination_sum(candidates: list[int], target: int) -> list[list[int]]:
    out: list[list[int]] = []
    path: list[int] = []
    def go(i: int, remain: int) -> None:
        if remain == 0:
            out.append(path.copy())
            return
        if remain < 0 or i == len(candidates):
            return
        path.append(candidates[i])
        go(i, remain - candidates[i])
        path.pop()
        go(i + 1, remain)
    go(0, target)
    return out
```

**TypeScript：**
```typescript
function combinationSum(candidates: number[], target: number): number[][] {
  const out: number[][] = [];
  const path: number[] = [];
  const go = (i: number, remain: number): void => {
    if (remain === 0) { out.push([...path]); return; }
    if (remain < 0 || i === candidates.length) return;
    path.push(candidates[i]);
    go(i, remain - candidates[i]);
    path.pop();
    go(i + 1, remain);
  };
  go(0, target);
  return out;
}
```

**Java：**
```java
List<List<Integer>> combinationSum(int[] candidates, int target) {
    var out = new ArrayList<List<Integer>>();
    var path = new ArrayList<Integer>();
    go(candidates, 0, target, path, out);
    return out;
}

void go(int[] c, int i, int remain, List<Integer> path, List<List<Integer>> out) {
    if (remain == 0) { out.add(new ArrayList<>(path)); return; }
    if (remain < 0 || i == c.length) return;
    path.add(c[i]);
    go(c, i, remain - c[i], path, out);
    path.remove(path.size() - 1);
    go(c, i + 1, remain, path, out);
}
```

**要点：**
- 下标指针避免 [2,3] 与 [3,2] 这种排列。
- 同一下标可重复使用以实现无限次数。
- remain 为负时及早剪枝。

---

### 59. Generate Parentheses  ·  LC 22  ·  中等  ·  回溯

**问题：** 生成 n 对括号的所有合法组合。1 <= n <= 8。

**思路：** 回溯并维护已用的开/闭括号计数。O(C(n))（卡特兰数）。

**Python：**
```python
def generate_parenthesis(n: int) -> list[str]:
    out: list[str] = []
    def go(s: str, op: int, cl: int) -> None:
        if len(s) == 2 * n:
            out.append(s); return
        if op < n:
            go(s + "(", op + 1, cl)
        if cl < op:
            go(s + ")", op, cl + 1)
    go("", 0, 0)
    return out
```

**TypeScript：**
```typescript
function generateParenthesis(n: number): string[] {
  const out: string[] = [];
  const go = (s: string, op: number, cl: number): void => {
    if (s.length === 2 * n) { out.push(s); return; }
    if (op < n) go(s + "(", op + 1, cl);
    if (cl < op) go(s + ")", op, cl + 1);
  };
  go("", 0, 0);
  return out;
}
```

**Java：**
```java
List<String> generateParenthesis(int n) {
    var out = new ArrayList<String>();
    go("", 0, 0, n, out);
    return out;
}

void go(String s, int op, int cl, int n, List<String> out) {
    if (s.length() == 2 * n) { out.add(s); return; }
    if (op < n) go(s + "(", op + 1, cl, n, out);
    if (cl < op) go(s + ")", op, cl + 1, n, out);
}
```

**要点：**
- 仅在开括号数大于闭括号数时才关闭。
- 开括号数小于 n 时可继续打开。
- 结果数等于第 n 个卡特兰数。

---

### 60. Word Search  ·  LC 79  ·  中等  ·  回溯

**问题：** 给定二维板和单词，若单词能作为板上的路径（不复用单元）则返回 true。通常 1 <= m, n <= 6。

**思路：** 从每个单元开始 DFS；通过修改板来标记已访问。时间 O(m * n * 4^L)。

**Python：**
```python
def exist(board: list[list[str]], word: str) -> bool:
    rows, cols = len(board), len(board[0])
    def dfs(r: int, c: int, k: int) -> bool:
        if k == len(word):
            return True
        if r < 0 or c < 0 or r >= rows or c >= cols or board[r][c] != word[k]:
            return False
        ch = board[r][c]
        board[r][c] = "#"
        ok = (dfs(r + 1, c, k + 1) or dfs(r - 1, c, k + 1)
              or dfs(r, c + 1, k + 1) or dfs(r, c - 1, k + 1))
        board[r][c] = ch
        return ok
    return any(dfs(r, c, 0) for r in range(rows) for c in range(cols))
```

**TypeScript：**
```typescript
function exist(board: string[][], word: string): boolean {
  const rows = board.length, cols = board[0].length;
  const dfs = (r: number, c: number, k: number): boolean => {
    if (k === word.length) return true;
    if (r < 0 || c < 0 || r >= rows || c >= cols || board[r][c] !== word[k]) return false;
    const ch = board[r][c];
    board[r][c] = "#";
    const ok = dfs(r + 1, c, k + 1) || dfs(r - 1, c, k + 1) || dfs(r, c + 1, k + 1) || dfs(r, c - 1, k + 1);
    board[r][c] = ch;
    return ok;
  };
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (dfs(r, c, 0)) return true;
  return false;
}
```

**Java：**
```java
boolean exist(char[][] board, String word) {
    int rows = board.length, cols = board[0].length;
    for (int r = 0; r < rows; r++)
        for (int c = 0; c < cols; c++)
            if (dfs(board, word, r, c, 0)) return true;
    return false;
}

boolean dfs(char[][] b, String w, int r, int c, int k) {
    if (k == w.length()) return true;
    if (r < 0 || c < 0 || r >= b.length || c >= b[0].length || b[r][c] != w.charAt(k)) return false;
    char ch = b[r][c];
    b[r][c] = '#';
    boolean ok = dfs(b, w, r + 1, c, k + 1) || dfs(b, w, r - 1, c, k + 1)
              || dfs(b, w, r, c + 1, k + 1) || dfs(b, w, r, c - 1, k + 1);
    b[r][c] = ch;
    return ok;
}
```

**要点：**
- 标记-还原避免额外的 visited 矩阵。
- 字符不匹配时及早失败。
- 每个单元都尝试作为起点。

---

### 61. Palindrome Partitioning  ·  LC 131  ·  中等  ·  回溯

**问题：** 将小写字符串 s 切分为若干连续子串，使每个子串都是回文串，并返回所有可能的切分方案（任意顺序）。1 <= len(s) <= 16。

**思路：** 使用回溯：在每个起始下标处尝试所有可能的下一个切点，仅当候选前缀是回文时才递归，当下标到达末尾时记录一个完整方案。双指针的回文判断使每次检测代价很低，而对非回文前缀的剪枝避免了无效分支的探索。时间复杂度 O(n * 2^n)（最多 2^(n-1) 个切点，每个产生 O(n) 的拷贝），递归路径额外空间 O(n)。

**Python：**
```python
def partition(s: str) -> list[list[str]]:
    n = len(s)
    result: list[list[str]] = []
    path: list[str] = []

    def is_pal(lo: int, hi: int) -> bool:
        while lo < hi:
            if s[lo] != s[hi]:
                return False
            lo += 1
            hi -= 1
        return True

    def backtrack(start: int) -> None:
        if start == n:
            result.append(path[:])
            return
        for end in range(start, n):
            if is_pal(start, end):
                path.append(s[start:end + 1])
                backtrack(end + 1)
                path.pop()

    backtrack(0)
    return result
```

**TypeScript：**
```typescript
function partition(s: string): string[][] {
  const n = s.length;
  const result: string[][] = [];
  const path: string[] = [];

  const isPal = (lo: number, hi: number): boolean => {
    while (lo < hi) {
      if (s[lo] !== s[hi]) return false;
      lo++;
      hi--;
    }
    return true;
  };

  const backtrack = (start: number): void => {
    if (start === n) {
      result.push([...path]);
      return;
    }
    for (let end = start; end < n; end++) {
      if (isPal(start, end)) {
        path.push(s.slice(start, end + 1));
        backtrack(end + 1);
        path.pop();
      }
    }
  };

  backtrack(0);
  return result;
}
```

**Java：**
```java
import java.util.ArrayList;
import java.util.List;

class Solution {
    public List<List<String>> partition(String s) {
        List<List<String>> result = new ArrayList<>();
        backtrack(s, 0, new ArrayList<>(), result);
        return result;
    }

    private void backtrack(String s, int start, List<String> path, List<List<String>> result) {
        if (start == s.length()) {
            result.add(new ArrayList<>(path));
            return;
        }
        for (int end = start; end < s.length(); end++) {
            if (isPal(s, start, end)) {
                path.add(s.substring(start, end + 1));
                backtrack(s, end + 1, path, result);
                path.remove(path.size() - 1);
            }
        }
    }

    private boolean isPal(String s, int lo, int hi) {
        while (lo < hi) {
            if (s.charAt(lo) != s.charAt(hi)) return false;
            lo++;
            hi--;
        }
        return true;
    }
}
```

**要点：**
- 只对已是回文的前缀递归，从而剪掉搜索树中的无效分支。
- 保存结果时要拷贝当前路径，否则后续的 pop 会修改已存的答案。
- n 最大为 16 时答案集合是指数级的，因此回溯是预期解法而非可避免的。
- 双指针判断（或预处理 DP 表）可在 O(n) 内验证回文。

---

### 62. N-Queens  ·  LC 51  ·  困难  ·  回溯

**问题：** 在 n x n 棋盘上放置 n 个皇后使其互不攻击。返回所有不同棋局。1 <= n <= 9。

**思路：** 按行回溯，跟踪占用的列和两个对角线。最坏 O(n!)。

**Python：**
```python
def solve_n_queens(n: int) -> list[list[str]]:
    out: list[list[str]] = []
    cols: set[int] = set()
    d1: set[int] = set()
    d2: set[int] = set()
    placement: list[int] = []
    def go(r: int) -> None:
        if r == n:
            board = ["." * c + "Q" + "." * (n - c - 1) for c in placement]
            out.append(board)
            return
        for c in range(n):
            if c in cols or (r - c) in d1 or (r + c) in d2:
                continue
            cols.add(c); d1.add(r - c); d2.add(r + c); placement.append(c)
            go(r + 1)
            placement.pop(); cols.remove(c); d1.remove(r - c); d2.remove(r + c)
    go(0)
    return out
```

**TypeScript：**
```typescript
function solveNQueens(n: number): string[][] {
  const out: string[][] = [];
  const cols = new Set<number>(), d1 = new Set<number>(), d2 = new Set<number>();
  const placement: number[] = [];
  const go = (r: number): void => {
    if (r === n) {
      out.push(placement.map(c => ".".repeat(c) + "Q" + ".".repeat(n - c - 1)));
      return;
    }
    for (let c = 0; c < n; c++) {
      if (cols.has(c) || d1.has(r - c) || d2.has(r + c)) continue;
      cols.add(c); d1.add(r - c); d2.add(r + c); placement.push(c);
      go(r + 1);
      placement.pop(); cols.delete(c); d1.delete(r - c); d2.delete(r + c);
    }
  };
  go(0);
  return out;
}
```

**Java：**
```java
List<List<String>> solveNQueens(int n) {
    var out = new ArrayList<List<String>>();
    var cols = new HashSet<Integer>();
    var d1 = new HashSet<Integer>();
    var d2 = new HashSet<Integer>();
    int[] placement = new int[n];
    go(0, n, cols, d1, d2, placement, out);
    return out;
}

void go(int r, int n, Set<Integer> cols, Set<Integer> d1, Set<Integer> d2, int[] placement, List<List<String>> out) {
    if (r == n) {
        var board = new ArrayList<String>();
        for (int c : placement) board.add(".".repeat(c) + "Q" + ".".repeat(n - c - 1));
        out.add(board);
        return;
    }
    for (int c = 0; c < n; c++) {
        if (cols.contains(c) || d1.contains(r - c) || d2.contains(r + c)) continue;
        cols.add(c); d1.add(r - c); d2.add(r + c); placement[r] = c;
        go(r + 1, n, cols, d1, d2, placement, out);
        cols.remove(c); d1.remove(r - c); d2.remove(r + c);
    }
}
```

**要点：**
- 每行一个皇后；按列和两条对角线跟踪冲突。
- (r - c) 标识 \\ 对角线；(r + c) 标识 / 对角线。
- 仅在成功时再构造棋盘字符串。

---

### 63. Search Insert Position  ·  LC 35  ·  简单  ·  二分查找

**问题：** 给定由不同整数组成的升序数组和目标值 `target`，若存在返回其下标，否则返回插入后仍保持有序的下标。必须在 O(log n) 时间内完成。1 <= n <= 10^4。

**思路：** 使用二分查找定位第一个值大于等于 target 的最左位置，采用左闭右开区间 [lo, hi)。当中点值小于 target 时把 lo 移到其右侧；否则答案在 mid 或其左侧，于是把 hi 收缩到 mid。区间收敛后，lo 恰好是插入（或命中）下标。时间复杂度 O(log n)，空间复杂度 O(1)。

**Python：**
```python
def search_insert(nums: list[int], target: int) -> int:
    lo, hi = 0, len(nums)
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return lo
```

**TypeScript：**
```typescript
function searchInsert(nums: number[], target: number): number {
  let lo = 0;
  let hi = nums.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] < target) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
}
```

**Java：**
```java
class Solution {
    public int searchInsert(int[] nums, int target) {
        int lo = 0, hi = nums.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] < target) {
                lo = mid + 1;
            } else {
                hi = mid;
            }
        }
        return lo;
    }
}
```

**要点：**
- 查找下界（第一个 >= target 的元素）而不是精确相等。
- 将 hi 初始化为 len(nums)，以便能表示末尾插入的情况。
- 左闭右开的 lo < hi 循环会自然收敛到唯一的插入下标。
- 题目要求 O(log n)，因此线性扫描不满足约束。

---

### 64. Search a 2D Matrix  ·  LC 74  ·  中等  ·  二分查找

**问题：** 给定一个矩阵，每行升序且每行第一个值大于上一行最后一个值，判断 `target` 是否存在。它逐行读取时等价于一个整体有序序列。O(log(m*n)) 时间。1 <= m, n <= 100。

**思路：** 将矩阵视为长度为 m*n 的单一有序数组，在下标 0..m*n-1 上进行二分查找，把下标 k 映射到行 k//n 和列 k%n。行间有序的保证使这种虚拟展平在全局上是有序的，因此可直接套用标准二分查找。时间复杂度满足要求的 O(log(m*n))，空间复杂度 O(1)。

**Python：**
```python
def search_matrix(matrix: list[list[int]], target: int) -> bool:
    m, n = len(matrix), len(matrix[0])
    lo, hi = 0, m * n - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        val = matrix[mid // n][mid % n]
        if val == target:
            return True
        if val < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return False
```

**TypeScript：**
```typescript
function searchMatrix(matrix: number[][], target: number): boolean {
  const m = matrix.length;
  const n = matrix[0].length;
  let lo = 0;
  let hi = m * n - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const val = matrix[Math.floor(mid / n)][mid % n];
    if (val === target) return true;
    if (val < target) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return false;
}
```

**Java：**
```java
class Solution {
    public boolean searchMatrix(int[][] matrix, int target) {
        int m = matrix.length, n = matrix[0].length;
        int lo = 0, hi = m * n - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            int val = matrix[mid / n][mid % n];
            if (val == target) return true;
            if (val < target) {
                lo = mid + 1;
            } else {
                hi = mid - 1;
            }
        }
        return false;
    }
}
```

**要点：**
- 两个有序保证使整个网格等价于一个有序数组。
- 用列数 n 做除法和取余，将一维下标转换为坐标。
- 此处单次二分查找优于 O(m + n) 的阶梯遍历。
- 下标映射要用 n（列数），而不是 m。

---

### 65. Find First and Last Position of Element in Sorted Array  ·  LC 34  ·  中等  ·  二分查找

**问题：** 在有序数组中返回 `target` 的起止下标，或 [-1, -1]。0 <= len <= 10^5。

**思路：** 两次二分查找分别求最左和最右匹配。时间 O(log n)。

**Python：**
```python
def search_range(nums: list[int], target: int) -> list[int]:
    def bs(left: bool) -> int:
        lo, hi, idx = 0, len(nums) - 1, -1
        while lo <= hi:
            mid = (lo + hi) // 2
            if nums[mid] == target:
                idx = mid
                if left: hi = mid - 1
                else: lo = mid + 1
            elif nums[mid] < target:
                lo = mid + 1
            else:
                hi = mid - 1
        return idx
    return [bs(True), bs(False)]
```

**TypeScript：**
```typescript
function searchRange(nums: number[], target: number): number[] {
  const bs = (left: boolean): number => {
    let lo = 0, hi = nums.length - 1, idx = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (nums[mid] === target) {
        idx = mid;
        if (left) hi = mid - 1; else lo = mid + 1;
      } else if (nums[mid] < target) lo = mid + 1;
      else hi = mid - 1;
    }
    return idx;
  };
  return [bs(true), bs(false)];
}
```

**Java：**
```java
int[] searchRange(int[] nums, int target) {
    return new int[]{bs(nums, target, true), bs(nums, target, false)};
}

int bs(int[] nums, int target, boolean left) {
    int lo = 0, hi = nums.length - 1, idx = -1;
    while (lo <= hi) {
        int mid = (lo + hi) >>> 1;
        if (nums[mid] == target) {
            idx = mid;
            if (left) hi = mid - 1; else lo = mid + 1;
        } else if (nums[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return idx;
}
```

**要点：**
- 匹配后继续搜索以找边界。
- 两次独立扫描；总计 O(log n)。
- 空数组返回 [-1, -1]。

---

### 66. Search in Rotated Sorted Array  ·  LC 33  ·  中等  ·  二分查找

**问题：** 在去重的旋转有序数组中搜索 `target`。返回下标或 -1。O(log n)。1 <= len(nums) <= 5000。

**思路：** 改良二分查找：总有一半是有序的；判断 target 是否在该半。时间 O(log n)，空间 O(1)。

**Python：**
```python
def search(nums: list[int], target: int) -> int:
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[lo] <= nums[mid]:  # left half sorted
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
- 用单次比较判断哪一侧有序。
- 闭区间检查必须匹配有序侧的端点。
- 未旋转数组作为特例同样适用。

---

### 67. Find Minimum in Rotated Sorted Array  ·  LC 153  ·  中等  ·  二分查找

**问题：** 一个去重的有序数组在未知支点处旋转。找到最小值。O(log n)。1 <= len(nums) <= 5000。

**思路：** 二分查找；比较 `nums[mid]` 和 `nums[hi]` 来判断最小值在哪一边。时间 O(log n)，空间 O(1)。

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
int findMin(int[] nums) {
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
- 比较 `hi` 而不是 `lo`，以处理未旋转的情况。
- 循环结束于 `lo == hi`，即指向最小值。
- 元素唯一的假设避免了最坏 O(n) 的情况。

---

### 68. Median of Two Sorted Arrays  ·  LC 4  ·  困难  ·  二分查找

**问题：** 在 O(log(min(m,n))) 内找出两个有序数组的中位数。0 <= m, n；合并长度 >= 1。

**思路：** 在较短数组上二分搜索一个分割位置，使左半大小合适且 max(left) <= min(right)。O(log min(m,n))。

**Python：**
```python
def find_median_sorted_arrays(a: list[int], b: list[int]) -> float:
    if len(a) > len(b):
        a, b = b, a
    m, n = len(a), len(b)
    total = m + n
    half = (total + 1) // 2
    lo, hi = 0, m
    while lo <= hi:
        i = (lo + hi) // 2
        j = half - i
        a_left = a[i - 1] if i > 0 else float("-inf")
        a_right = a[i] if i < m else float("inf")
        b_left = b[j - 1] if j > 0 else float("-inf")
        b_right = b[j] if j < n else float("inf")
        if a_left <= b_right and b_left <= a_right:
            if total % 2:
                return float(max(a_left, b_left))
            return (max(a_left, b_left) + min(a_right, b_right)) / 2
        if a_left > b_right:
            hi = i - 1
        else:
            lo = i + 1
    return 0.0
```

**TypeScript：**
```typescript
function findMedianSortedArrays(a: number[], b: number[]): number {
  if (a.length > b.length) { [a, b] = [b, a]; }
  const m = a.length, n = b.length;
  const total = m + n;
  const half = (total + 1) >> 1;
  let lo = 0, hi = m;
  while (lo <= hi) {
    const i = (lo + hi) >> 1;
    const j = half - i;
    const aL = i > 0 ? a[i - 1] : -Infinity;
    const aR = i < m ? a[i] : Infinity;
    const bL = j > 0 ? b[j - 1] : -Infinity;
    const bR = j < n ? b[j] : Infinity;
    if (aL <= bR && bL <= aR) {
      if (total % 2) return Math.max(aL, bL);
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
    int m = a.length, n = b.length, total = m + n, half = (total + 1) / 2;
    int lo = 0, hi = m;
    while (lo <= hi) {
        int i = (lo + hi) >>> 1;
        int j = half - i;
        int aL = i > 0 ? a[i - 1] : Integer.MIN_VALUE;
        int aR = i < m ? a[i] : Integer.MAX_VALUE;
        int bL = j > 0 ? b[j - 1] : Integer.MIN_VALUE;
        int bR = j < n ? b[j] : Integer.MAX_VALUE;
        if (aL <= bR && bL <= aR) {
            if (total % 2 == 1) return Math.max(aL, bL);
            return (Math.max(aL, bL) + Math.min(aR, bR)) / 2.0;
        }
        if (aL > bR) hi = i - 1; else lo = i + 1;
    }
    return 0;
}
```

**要点：**
- 始终在较短数组上做二分。
- 用哨兵处理超出范围的分割。
- 正确的分割直接给出中位数。

---

### 69. Valid Parentheses  ·  LC 20  ·  简单  ·  栈

**问题：** 判断由 `()[]{}` 组成的字符串是否正确嵌套配对。1 <= len(s) <= 10^4。

**思路：** 遇到开括号入栈；遇到闭括号弹出并验证是否匹配。时间和空间均 O(n)。

**Python：**
```python
def is_valid(s: str) -> bool:
    pair = {")": "(", "]": "[", "}": "{"}
    stack: list[str] = []
    for c in s:
        if c in pair:
            if not stack or stack.pop() != pair[c]:
                return False
        else:
            stack.append(c)
    return not stack
```

**TypeScript：**
```typescript
function isValid(s: string): boolean {
  const pair: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
  const stack: string[] = [];
  for (const c of s) {
    if (c in pair) {
      if (stack.pop() !== pair[c]) return false;
    } else {
      stack.push(c);
    }
  }
  return stack.length === 0;
}
```

**Java：**
```java
boolean isValid(String s) {
    var stack = new ArrayDeque<Character>();
    for (char c : s.toCharArray()) {
        if (c == '(') stack.push(')');
        else if (c == '[') stack.push(']');
        else if (c == '{') stack.push('}');
        else if (stack.isEmpty() || stack.pop() != c) return false;
    }
    return stack.isEmpty();
}
```

**要点：**
- 最终栈必须为空。
- 没有对应开括号时 pop 返回 false。
- 字符集固定，内存开销很小。

---

### 70. Min Stack  ·  LC 155  ·  中等  ·  栈

**问题：** 在 O(1) 内支持 `push`、`pop`、`top` 和 `getMin`。最多 3*10^4 个操作。

**思路：** 在一个栈上为每个值配对当前最小值。所有操作 O(1)。

**Python：**
```python
class MinStack:
    def __init__(self) -> None:
        self.stack: list[tuple[int, int]] = []

    def push(self, val: int) -> None:
        cur_min = val if not self.stack else min(val, self.stack[-1][1])
        self.stack.append((val, cur_min))

    def pop(self) -> None:
        self.stack.pop()

    def top(self) -> int:
        return self.stack[-1][0]

    def getMin(self) -> int:
        return self.stack[-1][1]
```

**TypeScript：**
```typescript
class MinStack {
  private stack: Array<[number, number]> = [];
  push(val: number): void {
    const m = this.stack.length === 0 ? val : Math.min(val, this.stack[this.stack.length - 1][1]);
    this.stack.push([val, m]);
  }
  pop(): void { this.stack.pop(); }
  top(): number { return this.stack[this.stack.length - 1][0]; }
  getMin(): number { return this.stack[this.stack.length - 1][1]; }
}
```

**Java：**
```java
class MinStack {
    private final Deque<int[]> stack = new ArrayDeque<>();
    void push(int val) {
        int m = stack.isEmpty() ? val : Math.min(val, stack.peek()[1]);
        stack.push(new int[]{val, m});
    }
    void pop() { stack.pop(); }
    int top() { return stack.peek()[0]; }
    int getMin() { return stack.peek()[1]; }
}
```

**要点：**
- 每个条目存最小值需要 O(n) 额外空间。
- 双栈变体仅在出现新最小值时入 min 栈。
- 所有操作保持 O(1)。

---

### 71. Decode String  ·  LC 394  ·  中等  ·  栈

**问题：** 解码使用 k[encoded] 模式的字符串，将方括号内内容重复 `k` 次；编码可嵌套（例如 `3[a2[c]]` -> `accaccacc`）。输入仅含数字、字母和括号。1 <= len(s) <= 30，1 <= k <= 300。

**思路：** 从左到右扫描，维护两个栈：一个存重复次数，一个存每个左括号之前已构建的字符串。遇到 '[' 时压入当前计数和已累积字符串然后重置它们；遇到 ']' 时弹出保存的前缀和倍数，把重复后的内部字符串拼接回去。由于每一层括号在其 ']' 到达时被精确恢复，因此能处理任意嵌套。时间复杂度 O(N)，空间复杂度 O(N)，其中 N 为解码输出的长度。

**Python：**
```python
def decode_string(s: str) -> str:
    count_stack: list[int] = []
    str_stack: list[str] = []
    current = ""
    num = 0
    for ch in s:
        if ch.isdigit():
            num = num * 10 + int(ch)
        elif ch == "[":
            count_stack.append(num)
            str_stack.append(current)
            num = 0
            current = ""
        elif ch == "]":
            prev = str_stack.pop()
            repeat = count_stack.pop()
            current = prev + current * repeat
        else:
            current += ch
    return current
```

**TypeScript：**
```typescript
function decodeString(s: string): string {
  const countStack: number[] = [];
  const strStack: string[] = [];
  let current = "";
  let num = 0;
  for (const ch of s) {
    if (ch >= "0" && ch <= "9") {
      num = num * 10 + (ch.charCodeAt(0) - 48);
    } else if (ch === "[") {
      countStack.push(num);
      strStack.push(current);
      num = 0;
      current = "";
    } else if (ch === "]") {
      const prev = strStack.pop()!;
      const repeat = countStack.pop()!;
      current = prev + current.repeat(repeat);
    } else {
      current += ch;
    }
  }
  return current;
}
```

**Java：**
```java
import java.util.ArrayDeque;
import java.util.Deque;

class Solution {
    public String decodeString(String s) {
        Deque<Integer> countStack = new ArrayDeque<>();
        Deque<StringBuilder> strStack = new ArrayDeque<>();
        StringBuilder current = new StringBuilder();
        int num = 0;
        for (char ch : s.toCharArray()) {
            if (Character.isDigit(ch)) {
                num = num * 10 + (ch - '0');
            } else if (ch == '[') {
                countStack.push(num);
                strStack.push(current);
                num = 0;
                current = new StringBuilder();
            } else if (ch == ']') {
                int repeat = countStack.pop();
                StringBuilder prev = strStack.pop();
                for (int i = 0; i < repeat; i++) {
                    prev.append(current);
                }
                current = prev;
            } else {
                current.append(ch);
            }
        }
        return current.toString();
    }
}
```

**要点：**
- 两个栈（计数栈和部分字符串栈）保存每一层嵌套的状态。
- 在遇到 '[' 前用 num = num*10 + digit 累积多位数字。
- 遇到 ']' 时新的 current 为 prev + current*repeat，从而恢复外层上下文。
- 迭代式栈避免了递归深度问题，并自然地对应嵌套结构。

---

### 72. Daily Temperatures  ·  LC 739  ·  中等  ·  栈

**问题：** 对每一天，返回到更暖一天的间隔天数，否则 0。1 <= len <= 10^5。

**思路：** 单调递减下标栈；遇到更暖的一天就弹出并记录距离。时间 O(n)。

**Python：**
```python
def daily_temperatures(temperatures: list[int]) -> list[int]:
    out = [0] * len(temperatures)
    stack: list[int] = []
    for i, t in enumerate(temperatures):
        while stack and temperatures[stack[-1]] < t:
            j = stack.pop()
            out[j] = i - j
        stack.append(i)
    return out
```

**TypeScript：**
```typescript
function dailyTemperatures(temperatures: number[]): number[] {
  const out = new Array(temperatures.length).fill(0);
  const stack: number[] = [];
  for (let i = 0; i < temperatures.length; i++) {
    while (stack.length && temperatures[stack[stack.length - 1]] < temperatures[i]) {
      const j = stack.pop()!;
      out[j] = i - j;
    }
    stack.push(i);
  }
  return out;
}
```

**Java：**
```java
int[] dailyTemperatures(int[] temperatures) {
    int[] out = new int[temperatures.length];
    var stack = new ArrayDeque<Integer>();
    for (int i = 0; i < temperatures.length; i++) {
        while (!stack.isEmpty() && temperatures[stack.peek()] < temperatures[i]) {
            int j = stack.pop();
            out[j] = i - j;
        }
        stack.push(i);
    }
    return out;
}
```

**要点：**
- 栈存等待更暖一天的下标。
- 严格更大时弹出。
- 留在栈中的下标保持 0。

---

### 73. Largest Rectangle in Histogram  ·  LC 84  ·  困难  ·  栈

**问题：** 给定柱高，找最大矩形面积。1 <= len(heights) <= 10^5。

**思路：** 单调下标栈；遇到更矮的柱子就弹出并计算面积。时间 O(n)。

**Python：**
```python
def largest_rectangle_area(heights: list[int]) -> int:
    stack: list[int] = []
    best = 0
    for i, h in enumerate(heights + [0]):
        while stack and heights[stack[-1]] > h:
            top = stack.pop()
            width = i if not stack else i - stack[-1] - 1
            best = max(best, heights[top] * width)
        stack.append(i)
    return best
```

**TypeScript：**
```typescript
function largestRectangleArea(heights: number[]): number {
  const stack: number[] = [];
  const hs = [...heights, 0];
  let best = 0;
  for (let i = 0; i < hs.length; i++) {
    while (stack.length && heights[stack[stack.length - 1]] > hs[i]) {
      const top = stack.pop()!;
      const width = stack.length === 0 ? i : i - stack[stack.length - 1] - 1;
      best = Math.max(best, heights[top] * width);
    }
    stack.push(i);
  }
  return best;
}
```

**Java：**
```java
int largestRectangleArea(int[] heights) {
    var stack = new ArrayDeque<Integer>();
    int n = heights.length, best = 0;
    for (int i = 0; i <= n; i++) {
        int h = i == n ? 0 : heights[i];
        while (!stack.isEmpty() && heights[stack.peek()] > h) {
            int top = stack.pop();
            int width = stack.isEmpty() ? i : i - stack.peek() - 1;
            best = Math.max(best, heights[top] * width);
        }
        stack.push(i);
    }
    return best;
}
```

**要点：**
- 末尾哨兵 0 强制清空栈。
- 宽度跨越前一个更小值和当前下标之间。
- 每个下标至多入栈和出栈各一次。

---

### 74. Kth Largest Element in an Array  ·  LC 215  ·  中等  ·  堆

**问题：** 在未排序数组中找到第 k 大元素。1 <= k <= len(nums) <= 10^5。

**思路：** 大小为 k 的小顶堆；最终堆顶即答案。时间 O(n log k)。

**Python：**
```python
import heapq

def find_kth_largest(nums: list[int], k: int) -> int:
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
  const up = (i: number) => {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p] > heap[i]) { [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } else break;
    }
  };
  const down = (i: number) => {
    const n = heap.length;
    while (true) {
      const l = 2 * i + 1, r = 2 * i + 2;
      let m = i;
      if (l < n && heap[l] < heap[m]) m = l;
      if (r < n && heap[r] < heap[m]) m = r;
      if (m === i) break;
      [heap[i], heap[m]] = [heap[m], heap[i]]; i = m;
    }
  };
  for (const x of nums) {
    heap.push(x); up(heap.length - 1);
    if (heap.length > k) {
      heap[0] = heap.pop()!; down(0);
    }
  }
  return heap[0];
}
```

**Java：**
```java
int findKthLargest(int[] nums, int k) {
    var heap = new PriorityQueue<Integer>();
    for (int x : nums) {
        heap.offer(x);
        if (heap.size() > k) heap.poll();
    }
    return heap.peek();
}
```

**要点：**
- 大小为 k 的小顶堆维护 k 个最大值。
- 快速选择平均 O(n)，最坏 O(n^2)。
- Python 内置 nlargest 可用。

---

### 75. Top K Frequent Elements  ·  LC 347  ·  中等  ·  堆

**问题：** 返回出现频率最高的 k 个元素。1 <= k <= 不重复元素 <= len(nums) <= 10^5。

**思路：** 按频率（1..n）桶排序；从最高桶向下收集。时间 O(n)。

**Python：**
```python
def top_k_frequent(nums: list[int], k: int) -> list[int]:
    from collections import Counter
    cnt = Counter(nums)
    buckets: list[list[int]] = [[] for _ in range(len(nums) + 1)]
    for x, c in cnt.items():
        buckets[c].append(x)
    out: list[int] = []
    for c in range(len(buckets) - 1, 0, -1):
        for x in buckets[c]:
            out.append(x)
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
  for (const [x, c] of cnt) buckets[c].push(x);
  const out: number[] = [];
  for (let c = buckets.length - 1; c > 0 && out.length < k; c--) {
    for (const x of buckets[c]) {
      out.push(x);
      if (out.length === k) return out;
    }
  }
  return out;
}
```

**Java：**
```java
int[] topKFrequent(int[] nums, int k) {
    var cnt = new HashMap<Integer, Integer>();
    for (int x : nums) cnt.merge(x, 1, Integer::sum);
    List<List<Integer>> buckets = new ArrayList<>();
    for (int i = 0; i <= nums.length; i++) buckets.add(new ArrayList<>());
    for (var e : cnt.entrySet()) buckets.get(e.getValue()).add(e.getKey());
    int[] out = new int[k];
    int idx = 0;
    for (int c = buckets.size() - 1; c > 0 && idx < k; c--)
        for (int x : buckets.get(c)) {
            out[idx++] = x;
            if (idx == k) return out;
        }
    return out;
}
```

**要点：**
- 频率不会超过 n，所以 n+1 个桶足够。
- 从高到低遍历桶可免去排序。
- 大小为 k 的堆是 O(n log k) 的替代方案。

---

### 76. Find Median from Data Stream  ·  LC 295  ·  困难  ·  堆

**问题：** 对持续增长的数据流支持 `addNum(x)` 和 `findMedian()`。最多 5*10^4 个操作。

**思路：** 两个堆：下半的大顶堆，上半的小顶堆；保持大小平衡。添加 O(log n)，中位数 O(1)。

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
            return -self.lo[0]
        return (-self.lo[0] + self.hi[0]) / 2
```

**TypeScript：**
```typescript
class MedianFinder {
  private lo: number[] = []; // max-heap (store negatives)
  private hi: number[] = []; // min-heap
  private up(h: number[], i: number): void {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (h[p] > h[i]) { [h[p], h[i]] = [h[i], h[p]]; i = p; } else break;
    }
  }
  private down(h: number[], i: number): void {
    const n = h.length;
    while (true) {
      const l = 2 * i + 1, r = 2 * i + 2;
      let m = i;
      if (l < n && h[l] < h[m]) m = l;
      if (r < n && h[r] < h[m]) m = r;
      if (m === i) break;
      [h[i], h[m]] = [h[m], h[i]]; i = m;
    }
  }
  private push(h: number[], x: number): void { h.push(x); this.up(h, h.length - 1); }
  private pop(h: number[]): number {
    const top = h[0]; const last = h.pop()!;
    if (h.length) { h[0] = last; this.down(h, 0); }
    return top;
  }
  addNum(num: number): void {
    this.push(this.lo, -num);
    this.push(this.hi, -this.pop(this.lo));
    if (this.hi.length > this.lo.length) this.push(this.lo, -this.pop(this.hi));
  }
  findMedian(): number {
    if (this.lo.length > this.hi.length) return -this.lo[0];
    return (-this.lo[0] + this.hi[0]) / 2;
  }
}
```

**Java：**
```java
class MedianFinder {
    private final PriorityQueue<Integer> lo = new PriorityQueue<>(Comparator.reverseOrder());
    private final PriorityQueue<Integer> hi = new PriorityQueue<>();
    void addNum(int num) {
        lo.offer(num);
        hi.offer(lo.poll());
        if (hi.size() > lo.size()) lo.offer(hi.poll());
    }
    double findMedian() {
        if (lo.size() > hi.size()) return lo.peek();
        return (lo.peek() + hi.peek()) / 2.0;
    }
}
```

**要点：**
- 不变量：lo.size == hi.size 或 lo.size == hi.size + 1。
- 通过 hi 中转以维持有序。
- 中位数要么是 lo 的堆顶，要么是两堆顶的均值。

---

### 77. Best Time to Buy and Sell Stock  ·  LC 121  ·  简单  ·  贪心

**问题：** 给定每日 `prices`，选某天买入并在之后某天卖出以最大化利润。返回最大利润，无利润则返回 0。1 <= len(prices) <= 10^5。

**思路：** 维护当前最小价格；答案是 `price - min_so_far` 的最大值。时间 O(n)，空间 O(1)。

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
int maxProfit(int[] prices) {
    int lo = Integer.MAX_VALUE, best = 0;
    for (int p : prices) {
        if (p < lo) lo = p;
        else if (p - lo > best) best = p - lo;
    }
    return best;
}
```

**要点：**
- 单次遍历足够；无需枚举所有对。
- 将 `lo` 初始化为大于任何价格的哨兵。
- 由于始终有 `lo <= p`，利润不会为负。

---

### 78. Jump Game  ·  LC 55  ·  中等  ·  贪心

**问题：** 每个元素表示最大跳跃长度；判断能否到达末尾。1 <= len(nums) <= 10^4。

**思路：** 贪心：跟踪最远可达下标。时间 O(n)，空间 O(1)。

**Python：**
```python
def can_jump(nums: list[int]) -> bool:
    reach = 0
    for i, x in enumerate(nums):
        if i > reach:
            return False
        reach = max(reach, i + x)
    return True
```

**TypeScript：**
```typescript
function canJump(nums: number[]): boolean {
  let reach = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i > reach) return false;
    if (i + nums[i] > reach) reach = i + nums[i];
  }
  return true;
}
```

**Java：**
```java
boolean canJump(int[] nums) {
    int reach = 0;
    for (int i = 0; i < nums.length; i++) {
        if (i > reach) return false;
        if (i + nums[i] > reach) reach = i + nums[i];
    }
    return true;
}
```

**要点：**
- 若位置超出 reach，根本到不了。
- 贪心避免 DP 开销。
- 等价于结束时检查 reach >= n - 1。

---

### 79. Jump Game II  ·  LC 45  ·  中等  ·  贪心

**问题：** 给定 `nums`，每个元素表示从该下标可向前跳跃的最大长度，返回从下标 0 到达最后一个下标所需的最少跳跃次数（总是可达）。1 <= n <= 10^4，0 <= nums[i] <= 1000。

**思路：** 使用贪心的分层 BFS：跟踪整体可达的最远下标以及当前这一跳所能到达的边界，每当扫描到达当前边界时就必须再花费一次跳跃，并把边界扩展到目前所见的最远处。每个用相同跳跃次数可达的连续下标块构成一个 BFS 层，因此统计边界跨越次数即得最小值。循环只迭代到倒数第二个下标，避免在已到达目标时多计一次。时间复杂度 O(n)，空间复杂度 O(1)。

**Python：**
```python
def jump(nums: list[int]) -> int:
    jumps = 0
    cur_end = 0
    farthest = 0
    for i in range(len(nums) - 1):
        farthest = max(farthest, i + nums[i])
        if i == cur_end:
            jumps += 1
            cur_end = farthest
    return jumps
```

**TypeScript：**
```typescript
function jump(nums: number[]): number {
  let jumps = 0;
  let curEnd = 0;
  let farthest = 0;
  for (let i = 0; i < nums.length - 1; i++) {
    farthest = Math.max(farthest, i + nums[i]);
    if (i === curEnd) {
      jumps++;
      curEnd = farthest;
    }
  }
  return jumps;
}
```

**Java：**
```java
class Solution {
    public int jump(int[] nums) {
        int jumps = 0, curEnd = 0, farthest = 0;
        for (int i = 0; i < nums.length - 1; i++) {
            farthest = Math.max(farthest, i + nums[i]);
            if (i == curEnd) {
                jumps++;
                curEnd = farthest;
            }
        }
        return jumps;
    }
}
```

**要点：**
- 贪心分层扩展等价于在可达区间上做 BFS，从而给出最少跳跃次数。
- 循环在 length-2 处停止，使得恰好到达最后一个下标时不多计一次跳跃。
- farthest 跟踪当前窗口内的最佳可达位置，而不仅是当前元素。
- 只有当扫描到达当前窗口边界时才计一次跳跃。

---

### 80. Partition Labels  ·  LC 763  ·  中等  ·  贪心

**问题：** 将小写字符串 s 划分为尽可能多的连续片段，使每个字母只出现在同一个片段中。按顺序返回各片段长度。1 <= len(s) <= 500。

**思路：** 首先记录每个字符最后一次出现的下标。然后从左到右扫描，把当前片段的结束位置扩展为到目前为止见过的所有字符中最远的最后出现位置；当遍历下标到达该结束位置时，说明片段内的字符都不会在后面再出现，因此可以安全地在此切割。这种贪心切割是最优的，因为它在保证片段自包含的前提下让每个片段尽可能小。O(n) time, O(1) space（固定 26 大小的表）。

**Python：**
```python
def partition_labels(s: str) -> list[int]:
    last = {c: i for i, c in enumerate(s)}
    result: list[int] = []
    start = end = 0
    for i, c in enumerate(s):
        end = max(end, last[c])
        if i == end:
            result.append(end - start + 1)
            start = i + 1
    return result
```

**TypeScript：**
```typescript
function partitionLabels(s: string): number[] {
  const last: Record<string, number> = {};
  for (let i = 0; i < s.length; i++) last[s[i]] = i;
  const result: number[] = [];
  let start = 0;
  let end = 0;
  for (let i = 0; i < s.length; i++) {
    end = Math.max(end, last[s[i]]);
    if (i === end) {
      result.push(end - start + 1);
      start = i + 1;
    }
  }
  return result;
}
```

**Java：**
```java
import java.util.ArrayList;
import java.util.List;

class Solution {
    public List<Integer> partitionLabels(String s) {
        int[] last = new int[26];
        for (int i = 0; i < s.length(); i++) last[s.charAt(i) - 'a'] = i;
        List<Integer> result = new ArrayList<>();
        int start = 0, end = 0;
        for (int i = 0; i < s.length(); i++) {
            end = Math.max(end, last[s.charAt(i) - 'a']);
            if (i == end) {
                result.add(end - start + 1);
                start = i + 1;
            }
        }
        return result;
    }
}
```

**要点：**
- 预先计算每个字母的最后出现位置，才能用一次遍历确定切割点
- 只有当 i 等于片段内所有字母最大的最后出现下标时，片段才能闭合
- 字母表大小固定，所以辅助表是 O(1) 而非 O(n)

---

### 81. Climbing Stairs  ·  LC 70  ·  简单  ·  动态规划

**问题：** 每次走 1 或 2 级到达顶端；求不同走法数。1 <= n <= 45。

**思路：** 斐波那契递推；用两个变量迭代。时间 O(n)，空间 O(1)。

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
  for (let i = 0; i < n; i++) { [a, b] = [b, a + b]; }
  return a;
}
```

**Java：**
```java
int climbStairs(int n) {
    int a = 1, b = 1;
    for (int i = 0; i < n; i++) { int t = a + b; a = b; b = t; }
    return a;
}
```

**要点：**
- 等价于 F(n+1)。
- 避免递归栈；使用迭代。
- 矩阵快速幂可在巨大 n 时降到 O(log n)。

---

### 82. Pascal's Triangle  ·  LC 118  ·  简单  ·  动态规划

**问题：** 返回帕斯卡三角形（杨辉三角）的前 `numRows` 行，每个内部值等于其左上方与右上方两个值之和。1 <= numRows <= 30。

**思路：** 逐行构建三角形：先把每一行初始化为全 1（这正好固定了两端的边界值），然后用已构建的上一行中相邻两个值之和覆盖每个内部单元格。由于每个值只依赖上一行，自底向上的直接构建就能得到所有元素。O(numRows^2) time，O(numRows^2) space，由于输出本身就有这么多元素，这是最优的。

**Python：**
```python
def generate(num_rows: int) -> list[list[int]]:
    triangle: list[list[int]] = []
    for r in range(num_rows):
        row = [1] * (r + 1)
        for c in range(1, r):
            row[c] = triangle[r - 1][c - 1] + triangle[r - 1][c]
        triangle.append(row)
    return triangle
```

**TypeScript：**
```typescript
function generate(numRows: number): number[][] {
  const triangle: number[][] = [];
  for (let r = 0; r < numRows; r++) {
    const row: number[] = new Array(r + 1).fill(1);
    for (let c = 1; c < r; c++) {
      row[c] = triangle[r - 1][c - 1] + triangle[r - 1][c];
    }
    triangle.push(row);
  }
  return triangle;
}
```

**Java：**
```java
import java.util.ArrayList;
import java.util.List;

class Solution {
    public List<List<Integer>> generate(int numRows) {
        List<List<Integer>> triangle = new ArrayList<>();
        for (int r = 0; r < numRows; r++) {
            List<Integer> row = new ArrayList<>();
            for (int c = 0; c <= r; c++) {
                if (c == 0 || c == r) row.add(1);
                else row.add(triangle.get(r - 1).get(c - 1) + triangle.get(r - 1).get(c));
            }
            triangle.add(row);
        }
        return triangle;
    }
}
```

**要点：**
- 先用 1 填充整行，可以干净地处理两端的边界 1
- 内部单元 c = prev[c-1] + prev[c]，只重新计算内部下标
- 输出规模是平方级，所以任何算法都无法优于 O(numRows^2)

---

### 83. House Robber  ·  LC 198  ·  中等  ·  动态规划

**问题：** 在一排房屋中选择不相邻的若干家，最大化总金额。1 <= len(nums) <= 100，0 <= nums[i] <= 400。

**思路：** DP：到 i 的最优 = max(best[i-1], best[i-2] + nums[i])。时间 O(n)，空间 O(1)。

**Python：**
```python
def rob(nums: list[int]) -> int:
    prev1 = prev2 = 0
    for x in nums:
        prev1, prev2 = max(prev1, prev2 + x), prev1
    return prev1
```

**TypeScript：**
```typescript
function rob(nums: number[]): number {
  let prev1 = 0, prev2 = 0;
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
int rob(int[] nums) {
    int prev1 = 0, prev2 = 0;
    for (int x : nums) {
        int cur = Math.max(prev1, prev2 + x);
        prev2 = prev1;
        prev1 = cur;
    }
    return prev1;
}
```

**要点：**
- 只需保留最近两个状态。
- 每步的决策就是取或跳过。
- 初始状态代表空前缀。

---

### 84. Perfect Squares  ·  LC 279  ·  中等  ·  动态规划

**问题：** 给定一个正整数 n，返回和恰好等于 n 所需的完全平方数（1、4、9、16……）的最少个数。例如 n = 12 返回 3（4 + 4 + 4），n = 13 返回 2（4 + 9）。约束：1 <= n <= 10^4。

**思路：** 根据拉格朗日四平方和定理，答案总是 1、2、3 或 4，因此只需判断是哪一种。当 n 是完全平方数时答案为 1；根据勒让德三平方和定理，当 n 形如 4^k(8m+7) 时答案为 4；若存在某个 a 使得 n - a^2 也是完全平方数则答案为 2；否则为 3。这些判断只需一个到 sqrt(n) 的循环，即 O(sqrt(n)) time，O(1) space。

**Python：**
```python
from math import isqrt


def num_squares(n: int) -> int:
    def is_square(x: int) -> bool:
        r = isqrt(x)
        return r * r == x
    if is_square(n):
        return 1
    m = n
    while m % 4 == 0:
        m //= 4
    if m % 8 == 7:
        return 4
    for a in range(1, isqrt(n) + 1):
        if is_square(n - a * a):
            return 2
    return 3
```

**TypeScript：**
```typescript
function numSquares(n: number): number {
  const isSquare = (x: number): boolean => {
    const r = Math.floor(Math.sqrt(x));
    return r * r === x || (r + 1) * (r + 1) === x;
  };
  if (isSquare(n)) return 1;
  let m = n;
  while (m % 4 === 0) m /= 4;
  if (m % 8 === 7) return 4;
  for (let a = 1; a * a <= n; a++) {
    if (isSquare(n - a * a)) return 2;
  }
  return 3;
}
```

**Java：**
```java
class Solution {
    public int numSquares(int n) {
        if (isSquare(n)) return 1;
        int m = n;
        while (m % 4 == 0) m /= 4;
        if (m % 8 == 7) return 4;
        for (int a = 1; a * a <= n; a++) {
            if (isSquare(n - a * a)) return 2;
        }
        return 3;
    }

    private boolean isSquare(int x) {
        int r = (int) Math.sqrt(x);
        return r * r == x || (r + 1) * (r + 1) == x;
    }
}
```

**要点：**
- 四平方和定理把答案上限锁定为 4，从而转化为分类判断
- 勒让德的 4^k(8m+7) 判定能在 O(log n) 内识别出答案为 4 的情况
- 朴素 DP 是 O(n*sqrt(n))；数论方法要快得多

---

### 85. Coin Change  ·  LC 322  ·  中等  ·  动态规划

**问题：** 凑出金额所需最少硬币数；不可能则返回 -1。1 <= len(coins) <= 12，1 <= amount <= 10^4。

**思路：** 自底向上 DP：dp[a] = min(dp[a - c] + 1)。O(amount * len(coins))。

**Python：**
```python
def coin_change(coins: list[int], amount: int) -> int:
    INF = amount + 1
    dp = [0] + [INF] * amount
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a:
                dp[a] = min(dp[a], dp[a - c] + 1)
    return dp[amount] if dp[amount] != INF else -1
```

**TypeScript：**
```typescript
function coinChange(coins: number[], amount: number): number {
  const INF = amount + 1;
  const dp = new Array(amount + 1).fill(INF);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) {
      if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;
    }
  }
  return dp[amount] === INF ? -1 : dp[amount];
}
```

**Java：**
```java
int coinChange(int[] coins, int amount) {
    int INF = amount + 1;
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, INF);
    dp[0] = 0;
    for (int a = 1; a <= amount; a++)
        for (int c : coins)
            if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;
    return dp[amount] == INF ? -1 : dp[amount];
}
```

**要点：**
- 初始化 dp[0] = 0（金额 0 无需硬币）。
- 用哨兵 (amount + 1) 充当无穷大。
- 硬币顺序无关，每个金额都考虑所有硬币。

---

### 86. Word Break  ·  LC 139  ·  中等  ·  动态规划

**问题：** 判断 `s` 能否被切分成字典中的若干空格分隔单词。1 <= len(s) <= 300。

**思路：** dp[i] 为真当存在 j < i 使 dp[j] 且 s[j:i] 在字典中。借助集合查找时间 O(n^2)。

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
      if (dp[j] && words.has(s.slice(j, i))) { dp[i] = true; break; }
    }
  }
  return dp[n];
}
```

**Java：**
```java
boolean wordBreak(String s, List<String> wordDict) {
    var words = new HashSet<>(wordDict);
    int n = s.length();
    boolean[] dp = new boolean[n + 1];
    dp[0] = true;
    for (int i = 1; i <= n; i++)
        for (int j = 0; j < i; j++)
            if (dp[j] && words.contains(s.substring(j, i))) { dp[i] = true; break; }
    return dp[n];
}
```

**要点：**
- dp[0] 为真表示空前缀。
- 内层循环提前 break 可节省工作量。
- BFS / Trie 变体在某些情形下更优。

---

### 87. Longest Increasing Subsequence  ·  LC 300  ·  中等  ·  动态规划

**问题：** 最长严格递增子序列的长度。1 <= len(nums) <= 2500（二分变体可达 10^5）。

**思路：** 耐心排序：维护 `tails` 数组；对每个 x 做二分插入。时间 O(n log n)。

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
    if (lo === tails.length) tails.push(x); else tails[lo] = x;
  }
  return tails.length;
}
```

**Java：**
```java
int lengthOfLIS(int[] nums) {
    var tails = new ArrayList<Integer>();
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
- `tails[i]` 是长度为 i+1 的某个 LIS 的最小尾值。
- 最终长度是 LIS 长度（而非 LIS 本身）。
- 在较小输入上 O(n^2) DP 也适用。

---

### 88. Maximum Product Subarray  ·  LC 152  ·  中等  ·  动态规划

**问题：** 找出乘积最大的连续子数组。1 <= len(nums) <= 2*10^4，结果适合 32 位。

**思路：** 同时跟踪当前最大值和最小值，因为负数会翻转符号。时间 O(n)，空间 O(1)。

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
- 遇到负数时在更新前交换 hi/lo。
- 零会把 hi 和 lo 重置为当前元素。
- 只跟踪 `hi` 会漏掉负负相乘的翻转。

---

### 89. Partition Equal Subset Sum  ·  LC 416  ·  中等  ·  动态规划

**问题：** 判断 nums 是否可划分为两个等和子集。1 <= len(nums) <= 200，sum <= 10000。

**思路：** target = total/2 的 0/1 背包；位集 DP。时间 O(n * target)。

**Python：**
```python
def can_partition(nums: list[int]) -> bool:
    total = sum(nums)
    if total % 2:
        return False
    target = total // 2
    dp = {0}
    for x in nums:
        dp |= {s + x for s in dp if s + x <= target}
        if target in dp:
            return True
    return False
```

**TypeScript：**
```typescript
function canPartition(nums: number[]): boolean {
  const total = nums.reduce((a, b) => a + b, 0);
  if (total % 2) return false;
  const target = total / 2;
  const dp = new Set<number>([0]);
  for (const x of nums) {
    for (const s of [...dp]) {
      if (s + x === target) return true;
      if (s + x < target) dp.add(s + x);
    }
  }
  return dp.has(target);
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
    for (int x : nums)
        for (int s = target; s >= x; s--)
            if (dp[s - x]) dp[s] = true;
    return dp[target];
}
```

**要点：**
- 等价于子集和为 total/2。
- 奇数和不可拆。
- 布尔 DP 数组形式也是常见做法。

---

### 90. Longest Valid Parentheses  ·  LC 32  ·  困难  ·  动态规划

**问题：** 给定由 '(' 和 ')' 组成的字符串，返回最长连续格式正确括号子串的长度（例如 ")()())" -> 4）。0 <= len(s) <= 3*10^4。

**思路：** 维护一个下标栈，初始压入 -1 作为基准边界。遇到 '(' 压入其下标；遇到 ')' 先弹出，如果栈变空则把当前下标作为新边界压入，否则以当前下标减去新的栈顶即为在此结束的有效段长度。之所以成立，是因为栈顶始终保存着当前有效段之前的那个下标。O(n) time，O(n) space。

**Python：**
```python
def longest_valid_parentheses(s: str) -> int:
    stack = [-1]
    best = 0
    for i, c in enumerate(s):
        if c == '(':
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
    if (s[i] === '(') {
      stack.push(i);
    } else {
      stack.pop();
      if (stack.length === 0) {
        stack.push(i);
      } else {
        best = Math.max(best, i - stack[stack.length - 1]);
      }
    }
  }
  return best;
}
```

**Java：**
```java
import java.util.ArrayDeque;
import java.util.Deque;

class Solution {
    public int longestValidParentheses(String s) {
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(-1);
        int best = 0;
        for (int i = 0; i < s.length(); i++) {
            if (s.charAt(i) == '(') {
                stack.push(i);
            } else {
                stack.pop();
                if (stack.isEmpty()) {
                    stack.push(i);
                } else {
                    best = Math.max(best, i - stack.peek());
                }
            }
        }
        return best;
    }
}
```

**要点：**
- 用 -1 初始化栈，为长度计算提供干净的基准
- 弹出后栈变空时，该 ')' 成为新的边界标记
- 长度用 i - 栈顶 计算而非累加计数器，能正确处理重置情形

---

### 91. Unique Paths  ·  LC 62  ·  中等  ·  多维动态规划

**问题：** 在 m x n 网格中从左上到右下、只能向右或向下走的路径数。1 <= m, n <= 100。

**思路：** 用一行 DP；dp[j] += dp[j-1]。时间 O(m*n)，空间 O(n)。

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
  const dp = new Array(n).fill(1);
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) dp[j] += dp[j - 1];
  }
  return dp[n - 1];
}
```

**Java：**
```java
int uniquePaths(int m, int n) {
    int[] dp = new int[n];
    Arrays.fill(dp, 1);
    for (int i = 1; i < m; i++)
        for (int j = 1; j < n; j++) dp[j] += dp[j - 1];
    return dp[n - 1];
}
```

**要点：**
- 闭式：C(m+n-2, m-1)。
- 复用一行可压缩空间。
- 第一行/列全为 1。

---

### 92. Minimum Path Sum  ·  LC 64  ·  中等  ·  多维动态规划

**问题：** 给定 m x n 的非负整数网格，每步只能向右或向下，返回从左上角到右下角的最小路径和。1 <= m, n <= 200，0 <= grid[i][j] <= 200。

**思路：** 使用动态规划，每个单元格保存到达它的最小代价：第一行和第一列只能有一种到达方式（沿途累加），其他每个单元格则把自身值加到正上方与正左方代价中较小的那个上。原地计算把网格本身变成 DP 表，因此不需要额外数组。O(m*n) time，O(1) extra space。

**Python：**
```python
def min_path_sum(grid: list[list[int]]) -> int:
    m, n = len(grid), len(grid[0])
    for i in range(m):
        for j in range(n):
            if i == 0 and j == 0:
                continue
            elif i == 0:
                grid[i][j] += grid[i][j - 1]
            elif j == 0:
                grid[i][j] += grid[i - 1][j]
            else:
                grid[i][j] += min(grid[i - 1][j], grid[i][j - 1])
    return grid[m - 1][n - 1]
```

**TypeScript：**
```typescript
function minPathSum(grid: number[][]): number {
  const m = grid.length;
  const n = grid[0].length;
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (i === 0 && j === 0) continue;
      else if (i === 0) grid[i][j] += grid[i][j - 1];
      else if (j === 0) grid[i][j] += grid[i - 1][j];
      else grid[i][j] += Math.min(grid[i - 1][j], grid[i][j - 1]);
    }
  }
  return grid[m - 1][n - 1];
}
```

**Java：**
```java
class Solution {
    public int minPathSum(int[][] grid) {
        int m = grid.length, n = grid[0].length;
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                if (i == 0 && j == 0) continue;
                else if (i == 0) grid[i][j] += grid[i][j - 1];
                else if (j == 0) grid[i][j] += grid[i - 1][j];
                else grid[i][j] += Math.min(grid[i - 1][j], grid[i][j - 1]);
            }
        }
        return grid[m - 1][n - 1];
    }
}
```

**要点：**
- 只能向右/向下移动，意味着每个单元格只依赖上方和左方邻居
- 第一行和第一列是特例，只有一个入方向
- 复用输入网格作为 DP 表，从而实现 O(1) 额外空间

---

### 93. Longest Palindromic Substring  ·  LC 5  ·  中等  ·  多维动态规划

**问题：** 返回 `s` 中最长的回文子串。1 <= len(s) <= 1000。

**思路：** 围绕每个中心向外扩展（奇偶两种情况）。时间 O(n^2)，空间 O(1)。

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
- 两种中心类型覆盖奇数和偶数长度回文。
- Manacher 算法可达 O(n)，但更复杂。
- 用长度差比较最优解，无需重新计算。

---

### 94. Longest Common Subsequence  ·  LC 1143  ·  中等  ·  多维动态规划

**问题：** 两个字符串的 LCS 长度。1 <= 长度 <= 1000。

**思路：** 二维 DP；匹配则延伸对角线，否则取上、左的最大值。时间 O(m*n)，空间 O(min)。

**Python：**
```python
def longest_common_subsequence(a: str, b: str) -> int:
    if len(a) < len(b):
        a, b = b, a
    prev = [0] * (len(b) + 1)
    for i in range(1, len(a) + 1):
        cur = [0] * (len(b) + 1)
        for j in range(1, len(b) + 1):
            cur[j] = prev[j - 1] + 1 if a[i - 1] == b[j - 1] else max(prev[j], cur[j - 1])
        prev = cur
    return prev[-1]
```

**TypeScript：**
```typescript
function longestCommonSubsequence(a: string, b: string): number {
  if (a.length < b.length) { [a, b] = [b, a]; }
  let prev = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    const cur = new Array(b.length + 1).fill(0);
    for (let j = 1; j <= b.length; j++) {
      cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
    }
    prev = cur;
  }
  return prev[b.length];
}
```

**Java：**
```java
int longestCommonSubsequence(String a, String b) {
    if (a.length() < b.length()) { String t = a; a = b; b = t; }
    int[] prev = new int[b.length() + 1];
    for (int i = 1; i <= a.length(); i++) {
        int[] cur = new int[b.length() + 1];
        for (int j = 1; j <= b.length(); j++) {
            cur[j] = a.charAt(i - 1) == b.charAt(j - 1) ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
        }
        prev = cur;
    }
    return prev[b.length()];
}
```

**要点：**
- 用较短字符串作列以节省内存。
- 匹配则对角线加一。
- 不重构子序列（需额外工作）。

---

### 95. Edit Distance  ·  LC 72  ·  中等  ·  多维动态规划

**问题：** 将 `word1` 转为 `word2` 所需最少插入/删除/替换操作数。0 <= 长度 <= 500。

**思路：** 经典 Levenshtein 二维 DP。时间 O(m*n)，空间 O(n)。

**Python：**
```python
def min_distance(word1: str, word2: str) -> int:
    m, n = len(word1), len(word2)
    prev = list(range(n + 1))
    for i in range(1, m + 1):
        cur = [i] + [0] * n
        for j in range(1, n + 1):
            if word1[i - 1] == word2[j - 1]:
                cur[j] = prev[j - 1]
            else:
                cur[j] = 1 + min(prev[j], cur[j - 1], prev[j - 1])
        prev = cur
    return prev[n]
```

**TypeScript：**
```typescript
function minDistance(word1: string, word2: string): number {
  const m = word1.length, n = word2.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = new Array(n + 1).fill(0);
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      if (word1[i - 1] === word2[j - 1]) cur[j] = prev[j - 1];
      else cur[j] = 1 + Math.min(prev[j], cur[j - 1], prev[j - 1]);
    }
    prev = cur;
  }
  return prev[n];
}
```

**Java：**
```java
int minDistance(String word1, String word2) {
    int m = word1.length(), n = word2.length();
    int[] prev = new int[n + 1];
    for (int j = 0; j <= n; j++) prev[j] = j;
    for (int i = 1; i <= m; i++) {
        int[] cur = new int[n + 1];
        cur[0] = i;
        for (int j = 1; j <= n; j++) {
            if (word1.charAt(i - 1) == word2.charAt(j - 1)) cur[j] = prev[j - 1];
            else cur[j] = 1 + Math.min(prev[j], Math.min(cur[j - 1], prev[j - 1]));
        }
        prev = cur;
    }
    return prev[n];
}
```

**要点：**
- 三种操作对应三个单元。
- 匹配时复制对角线值。
- 行压缩使内存保持 O(n)。

---

### 96. Single Number  ·  LC 136  ·  简单  ·  技巧

**问题：** 除一个元素外其余元素都出现两次；找出那一个。1 <= len(nums) <= 3*10^4。

**思路：** 对所有元素做 XOR；重复部分会抵消。时间 O(n)，空间 O(1)。

**Python：**
```python
def single_number(nums: list[int]) -> int:
    r = 0
    for x in nums:
        r ^= x
    return r
```

**TypeScript：**
```typescript
function singleNumber(nums: number[]): number {
  let r = 0;
  for (const x of nums) r ^= x;
  return r;
}
```

**Java：**
```java
int singleNumber(int[] nums) {
    int r = 0;
    for (int x : nums) r ^= x;
    return r;
}
```

**要点：**
- XOR 满足交换/结合律。
- 哈希计数也可，但需 O(n) 内存。
- 出现三次的变体需对每位做模 3 计数。

---

### 97. Majority Element  ·  LC 169  ·  简单  ·  技巧

**问题：** 返回数组中出现次数超过 n/2 的元素（保证存在）。1 <= n <= 5*10^4。

**思路：** 使用 Boyer-Moore 投票算法：维护一个当前候选值和一个计数器，当前值与候选相同时计数加一，否则减一，计数为零时重置候选。由于多数元素占据了超过一半的位置，其他元素的抵消无法将其完全消除，因此它会作为最终候选存活下来。O(n) time，O(1) space。

**Python：**
```python
def majority_element(nums: list[int]) -> int:
    count = 0
    candidate = 0
    for x in nums:
        if count == 0:
            candidate = x
        count += 1 if x == candidate else -1
    return candidate
```

**TypeScript：**
```typescript
function majorityElement(nums: number[]): number {
    let count = 0;
    let candidate = 0;
    for (const x of nums) {
        if (count === 0) candidate = x;
        count += x === candidate ? 1 : -1;
    }
    return candidate;
}
```

**Java：**
```java
class Solution {
    public int majorityElement(int[] nums) {
        int count = 0, candidate = 0;
        for (int x : nums) {
            if (count == 0) candidate = x;
            count += x == candidate ? 1 : -1;
        }
        return candidate;
    }
}
```

**要点：**
- Boyer-Moore 投票避免了哈希表计数所需的 O(n) 额外空间
- 只有在多数元素严格大于 n/2 时才成立，从而保证其存活
- 计数归零时重置，相当于成对抵消并丢弃非多数元素
- 排序取中位数也可行，但需要 O(n log n)

---

### 98. Sort Colors  ·  LC 75  ·  中等  ·  技巧

**问题：** 给定仅含 0、1、2（红/白/蓝）的数组，不使用库排序函数原地排序。1 <= n <= 300。

**思路：** 使用荷兰国旗算法配合三个指针：low 标记已确定的 0 的边界，high 标记已确定的 2 的边界，mid 向前扫描。遇到 0 时与 low 区域交换并同时前移 low 和 mid；遇到 1 时只前移 mid；遇到 2 时与 high 区域交换并收缩 high，但不前移 mid，因为换进来的值尚未检查。这样一趟即可完成划分。O(n) time，O(1) space。

**Python：**
```python
def sort_colors(nums: list[int]) -> None:
    low, mid, high = 0, 0, len(nums) - 1
    while mid <= high:
        if nums[mid] == 0:
            nums[low], nums[mid] = nums[mid], nums[low]
            low += 1
            mid += 1
        elif nums[mid] == 1:
            mid += 1
        else:
            nums[mid], nums[high] = nums[high], nums[mid]
            high -= 1
```

**TypeScript：**
```typescript
function sortColors(nums: number[]): void {
    let low = 0, mid = 0, high = nums.length - 1;
    while (mid <= high) {
        if (nums[mid] === 0) {
            [nums[low], nums[mid]] = [nums[mid], nums[low]];
            low++;
            mid++;
        } else if (nums[mid] === 1) {
            mid++;
        } else {
            [nums[mid], nums[high]] = [nums[high], nums[mid]];
            high--;
        }
    }
}
```

**Java：**
```java
class Solution {
    public void sortColors(int[] nums) {
        int low = 0, mid = 0, high = nums.length - 1;
        while (mid <= high) {
            if (nums[mid] == 0) {
                int t = nums[low]; nums[low] = nums[mid]; nums[mid] = t;
                low++;
                mid++;
            } else if (nums[mid] == 1) {
                mid++;
            } else {
                int t = nums[mid]; nums[mid] = nums[high]; nums[high] = t;
                high--;
            }
        }
    }
}
```

**要点：**
- 单趟遍历优于两趟计数排序的做法
- 与 high 交换后不要前移 mid，换进来的元素还未检查
- 循环不变式保持 [0,low) 为 0、[low,mid) 为 1、(high,end] 为 2
- 全程原地进行，仅需指针交换

---

### 99. Next Permutation  ·  LC 31  ·  中等  ·  技巧

**问题：** 将整数数组原地重排为下一个字典序更大的排列；若不存在（已降序），则变为最小（升序）。1 <= n <= 100。

**思路：** 从右向左扫描，找到第一个满足 nums[i] < nums[i+1] 的下标 i，这个枢轴是最靠右、可以被增大的位置。若存在，则从右侧找到第一个大于 nums[i] 的元素并交换，这样就把尽可能小的更大值放到了枢轴处。最后反转 i 之后的后缀，把它的降序变为升序，使其成为最小的尾部。O(n) time，O(1) space。

**Python：**
```python
def next_permutation(nums: list[int]) -> None:
    i = len(nums) - 2
    while i >= 0 and nums[i] >= nums[i + 1]:
        i -= 1
    if i >= 0:
        j = len(nums) - 1
        while nums[j] <= nums[i]:
            j -= 1
        nums[i], nums[j] = nums[j], nums[i]
    nums[i + 1:] = reversed(nums[i + 1:])
```

**TypeScript：**
```typescript
function nextPermutation(nums: number[]): void {
    let i = nums.length - 2;
    while (i >= 0 && nums[i] >= nums[i + 1]) i--;
    if (i >= 0) {
        let j = nums.length - 1;
        while (nums[j] <= nums[i]) j--;
        [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    let l = i + 1, r = nums.length - 1;
    while (l < r) {
        [nums[l], nums[r]] = [nums[r], nums[l]];
        l++;
        r--;
    }
}
```

**Java：**
```java
class Solution {
    public void nextPermutation(int[] nums) {
        int i = nums.length - 2;
        while (i >= 0 && nums[i] >= nums[i + 1]) i--;
        if (i >= 0) {
            int j = nums.length - 1;
            while (nums[j] <= nums[i]) j--;
            int t = nums[i]; nums[i] = nums[j]; nums[j] = t;
        }
        int l = i + 1, r = nums.length - 1;
        while (l < r) {
            int t = nums[l]; nums[l] = nums[r]; nums[r] = t;
            l++;
            r--;
        }
    }
}
```

**要点：**
- 枢轴之后的后缀始终是非递增的，因此反转即得到最小尾部
- 与最右侧严格大于枢轴的元素交换，可保持后缀有序
- 当不存在枢轴时整个数组为降序，反转即得到升序最小排列
- 全程原地完成，无需枚举所有排列

---

### 100. Find the Duplicate Number  ·  LC 287  ·  中等  ·  技巧

**问题：** 给定 n+1 个整数，每个均在 [1, n]，恰好有一个值重复；在不修改数组、仅用 O(1) 额外空间的条件下返回它。1 <= n <= 10^5。

**思路：** 把每个下标看作一个节点，指向以其值为下标的节点，这样构成一个链表，由于重复值使两个下标指向同一节点，链表中必然存在环。使用 Floyd 快慢指针：慢指针每次走一步、快指针每次走两步，直到它们在环内相遇；然后将一个指针重置到起点，两个指针每次都走一步，其相遇点即为环的入口，也就是重复的数字。O(n) time，O(1) space。

**Python：**
```python
def find_duplicate(nums: list[int]) -> int:
    slow = nums[0]
    fast = nums[0]
    while True:
        slow = nums[slow]
        fast = nums[nums[fast]]
        if slow == fast:
            break
    slow = nums[0]
    while slow != fast:
        slow = nums[slow]
        fast = nums[fast]
    return slow
```

**TypeScript：**
```typescript
function findDuplicate(nums: number[]): number {
    let slow = nums[0];
    let fast = nums[0];
    do {
        slow = nums[slow];
        fast = nums[nums[fast]];
    } while (slow !== fast);
    slow = nums[0];
    while (slow !== fast) {
        slow = nums[slow];
        fast = nums[fast];
    }
    return slow;
}
```

**Java：**
```java
class Solution {
    public int findDuplicate(int[] nums) {
        int slow = nums[0], fast = nums[0];
        do {
            slow = nums[slow];
            fast = nums[nums[fast]];
        } while (slow != fast);
        slow = nums[0];
        while (slow != fast) {
            slow = nums[slow];
            fast = nums[fast];
        }
        return slow;
    }
}
```

**要点：**
- n+1 个位置上取值范围为 [1,n]，保证存在环，且环入口即为重复值
- Floyd 判环满足不修改数组和 O(1) 空间的约束，而排序或哈希会违反
- 第二阶段依赖于数学结论：起点到入口的距离等于相遇点到入口的距离
- 在值域上二分查找是另一种 O(n log n) 的做法

---
