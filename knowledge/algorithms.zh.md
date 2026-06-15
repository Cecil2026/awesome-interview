# 算法（LeetCode）

100 道经典面试题，配有 Python 和 TypeScript 解法。

难度分布：约 35 道简单、约 50 道中等、约 15 道困难。主题涵盖数组、字符串、双指针、滑动窗口、哈希、链表、树、图、DP、回溯、贪心、堆/优先队列、位运算、栈/队列、二分查找、区间和 trie。

---

### 1. Two Sum  ·  简单  ·  数组 / 哈希

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

### 2. Best Time to Buy and Sell Stock  ·  简单  ·  数组 / DP

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

### 3. Contains Duplicate  ·  简单  ·  数组 / 哈希

**问题：** 如果 `nums` 中存在至少出现两次的值，返回 true。1 <= len(nums) <= 10^5。

**思路：** 插入到集合中；重复检测是 O(1)。时间 O(n)，空间 O(n)。

**Python：**
```python
def contains_duplicate(nums: list[int]) -> bool:
    return len(set(nums)) != len(nums)
```

**TypeScript：**
```typescript
function containsDuplicate(nums: number[]): boolean {
  return new Set(nums).size !== nums.length;
}
```

**Java：**
```java
boolean containsDuplicate(int[] nums) {
    var seen = new HashSet<Integer>();
    for (int x : nums) if (!seen.add(x)) return true;
    return false;
}
```

**要点：**
- 集合大小比较是最简洁的正确解法。
- 早返回循环变体在大输入早期出现重复时更省时。
- 排序也可以，但是 O(n log n)。

---

### 4. Product of Array Except Self  ·  中等  ·  数组 / 前缀

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

### 5. Maximum Subarray  ·  中等  ·  数组 / DP

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

### 6. Maximum Product Subarray  ·  中等  ·  数组 / DP

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

### 7. Find Minimum in Rotated Sorted Array  ·  中等  ·  二分查找

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

### 8. Search in Rotated Sorted Array  ·  中等  ·  二分查找

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

### 9. 3Sum  ·  中等  ·  双指针

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

### 10. Container With Most Water  ·  中等  ·  双指针

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

### 11. Valid Anagram  ·  简单  ·  哈希

**问题：** 如果 `t` 是 `s` 的字母异位词，返回 true。小写英文字母。1 <= len <= 5*10^4。

**思路：** 统计字母频率并比较。时间 O(n)，空间 O(1)（26 个字母）。

**Python：**
```python
def is_anagram(s: str, t: str) -> bool:
    if len(s) != len(t):
        return False
    cnt = [0] * 26
    for a, b in zip(s, t):
        cnt[ord(a) - 97] += 1
        cnt[ord(b) - 97] -= 1
    return all(c == 0 for c in cnt)
```

**TypeScript：**
```typescript
function isAnagram(s: string, t: string): boolean {
  if (s.length !== t.length) return false;
  const cnt = new Array(26).fill(0);
  for (let i = 0; i < s.length; i++) {
    cnt[s.charCodeAt(i) - 97]++;
    cnt[t.charCodeAt(i) - 97]--;
  }
  return cnt.every(c => c === 0);
}
```

**Java：**
```java
boolean isAnagram(String s, String t) {
    if (s.length() != t.length()) return false;
    int[] cnt = new int[26];
    for (int i = 0; i < s.length(); i++) {
        cnt[s.charAt(i) - 'a']++;
        cnt[t.charAt(i) - 'a']--;
    }
    for (int c : cnt) if (c != 0) return false;
    return true;
}
```

**要点：**
- 单次合并遍历中既递增又递减。
- 长度检查是廉价的提前退出。
- 对 Unicode 字符集，改用哈希表替代固定数组。

---

### 12. Group Anagrams  ·  中等  ·  哈希

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

### 13. Valid Parentheses  ·  简单  ·  栈

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

### 14. Valid Palindrome  ·  简单  ·  双指针

**问题：** 只考虑字母数字字符并忽略大小写，判断 `s` 是否正反读相同。1 <= len(s) <= 2*10^5。

**思路：** 双指针；跳过非字母数字，比较小写化字符。时间 O(n)，空间 O(1)。

**Python：**
```python
def is_palindrome(s: str) -> bool:
    l, r = 0, len(s) - 1
    while l < r:
        while l < r and not s[l].isalnum():
            l += 1
        while l < r and not s[r].isalnum():
            r -= 1
        if s[l].lower() != s[r].lower():
            return False
        l += 1
        r -= 1
    return True
```

**TypeScript：**
```typescript
function isPalindrome(s: string): boolean {
  const ok = (c: string) => /[a-z0-9]/i.test(c);
  let l = 0, r = s.length - 1;
  while (l < r) {
    while (l < r && !ok(s[l])) l++;
    while (l < r && !ok(s[r])) r--;
    if (s[l].toLowerCase() !== s[r].toLowerCase()) return false;
    l++; r--;
  }
  return true;
}
```

**Java：**
```java
boolean isPalindrome(String s) {
    int l = 0, r = s.length() - 1;
    while (l < r) {
        while (l < r && !Character.isLetterOrDigit(s.charAt(l))) l++;
        while (l < r && !Character.isLetterOrDigit(s.charAt(r))) r--;
        if (Character.toLowerCase(s.charAt(l)) != Character.toLowerCase(s.charAt(r))) return false;
        l++; r--;
    }
    return true;
}
```

**要点：**
- 原地比较避免构建过滤后的副本。
- 内层跳过必须保持 `l < r`，避免越界。
- ASCII 情况下，边遍历边小写化即可。

---

### 15. Longest Substring Without Repeating Characters  ·  中等  ·  滑动窗口

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

### 16. Longest Repeating Character Replacement  ·  中等  ·  滑动窗口

**问题：** 给定 `s` 和 `k`，最多替换 `k` 个字符以最大化一个重复字母的子串。返回该长度。1 <= len(s) <= 10^5。

**思路：** 滑动窗口跟踪单字母最大计数；当 `(window_len - max_count) > k` 时收缩。时间 O(n)。

**Python：**
```python
def character_replacement(s: str, k: int) -> int:
    cnt = [0] * 26
    l = best = max_cnt = 0
    for r, c in enumerate(s):
        cnt[ord(c) - 65] += 1
        max_cnt = max(max_cnt, cnt[ord(c) - 65])
        if (r - l + 1) - max_cnt > k:
            cnt[ord(s[l]) - 65] -= 1
            l += 1
        best = max(best, r - l + 1)
    return best
```

**TypeScript：**
```typescript
function characterReplacement(s: string, k: number): number {
  const cnt = new Array(26).fill(0);
  let l = 0, best = 0, maxCnt = 0;
  for (let r = 0; r < s.length; r++) {
    const i = s.charCodeAt(r) - 65;
    cnt[i]++;
    maxCnt = Math.max(maxCnt, cnt[i]);
    if (r - l + 1 - maxCnt > k) {
      cnt[s.charCodeAt(l) - 65]--;
      l++;
    }
    best = Math.max(best, r - l + 1);
  }
  return best;
}
```

**Java：**
```java
int characterReplacement(String s, int k) {
    int[] cnt = new int[26];
    int l = 0, best = 0, maxCnt = 0;
    for (int r = 0; r < s.length(); r++) {
        int i = s.charAt(r) - 'A';
        cnt[i]++;
        maxCnt = Math.max(maxCnt, cnt[i]);
        if (r - l + 1 - maxCnt > k) {
            cnt[s.charAt(l) - 'A']--;
            l++;
        }
        best = Math.max(best, r - l + 1);
    }
    return best;
}
```

**要点：**
- `maxCnt` 单调更新，收缩时无需重新计算。
- 每次迭代窗口增长 1；最多收缩一次。
- 默认大写 A-Z；通用输入需调整范围。

---

### 17. Minimum Window Substring  ·  困难  ·  滑动窗口

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

### 18. Longest Palindromic Substring  ·  中等  ·  双指针

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

### 19. Palindromic Substrings  ·  中等  ·  双指针

**问题：** 统计 `s` 中回文子串的数量。1 <= len(s) <= 1000。

**思路：** 围绕每个中心扩展；每次成功扩展计 1。时间 O(n^2)，空间 O(1)。

**Python：**
```python
def count_substrings(s: str) -> int:
    def cnt(l: int, r: int) -> int:
        c = 0
        while l >= 0 and r < len(s) and s[l] == s[r]:
            c += 1
            l -= 1
            r += 1
        return c
    return sum(cnt(i, i) + cnt(i, i + 1) for i in range(len(s)))
```

**TypeScript：**
```typescript
function countSubstrings(s: string): number {
  const cnt = (l: number, r: number): number => {
    let c = 0;
    while (l >= 0 && r < s.length && s[l] === s[r]) { c++; l--; r++; }
    return c;
  };
  let total = 0;
  for (let i = 0; i < s.length; i++) total += cnt(i, i) + cnt(i, i + 1);
  return total;
}
```

**Java：**
```java
int countSubstrings(String s) {
    int total = 0;
    for (int i = 0; i < s.length(); i++) total += cnt(s, i, i) + cnt(s, i, i + 1);
    return total;
}

int cnt(String s, int l, int r) {
    int c = 0;
    while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) { c++; l--; r++; }
    return c;
}
```

**要点：**
- 每一次扩展就代表一个回文。
- 奇偶两种中心都要考虑。
- DP 表也可，但占用 O(n^2) 内存。

---

### 20. Encode and Decode Strings  ·  中等  ·  设计 / 字符串

**问题：** 设计将任意字符串列表编码为一个字符串再解码回来的方案。字符可为任意 Unicode。

**思路：** 在每个字符串前加上长度前缀和分隔符。编码：`"len#str"`。解码：读出长度后切片。时间 O(total)。

**Python：**
```python
def encode(strs: list[str]) -> str:
    return "".join(f"{len(s)}#{s}" for s in strs)

def decode(s: str) -> list[str]:
    out: list[str] = []
    i = 0
    while i < len(s):
        j = s.index("#", i)
        n = int(s[i:j])
        out.append(s[j + 1:j + 1 + n])
        i = j + 1 + n
    return out
```

**TypeScript：**
```typescript
function encode(strs: string[]): string {
  return strs.map(s => `${s.length}#${s}`).join("");
}

function decode(s: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < s.length) {
    const j = s.indexOf("#", i);
    const n = parseInt(s.slice(i, j), 10);
    out.push(s.slice(j + 1, j + 1 + n));
    i = j + 1 + n;
  }
  return out;
}
```

**Java：**
```java
String encode(List<String> strs) {
    var sb = new StringBuilder();
    for (String s : strs) sb.append(s.length()).append('#').append(s);
    return sb.toString();
}

List<String> decode(String s) {
    var out = new ArrayList<String>();
    int i = 0;
    while (i < s.length()) {
        int j = s.indexOf('#', i);
        int n = Integer.parseInt(s.substring(i, j));
        out.add(s.substring(j + 1, j + 1 + n));
        i = j + 1 + n;
    }
    return out;
}
```

**要点：**
- 长度前缀避免任何分隔符的歧义。
- `#` 安全，因为长度解析到它为止。
- 支持空字符串和 Unicode。

---

### 21. Reverse Linked List  ·  简单  ·  链表

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

### 22. Merge Two Sorted Lists  ·  简单  ·  链表

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

### 23. Merge K Sorted Lists  ·  困难  ·  堆

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

### 24. Remove Nth Node From End of List  ·  中等  ·  链表

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

### 25. Reorder List  ·  中等  ·  链表

**问题：** 将 `L0 -> L1 -> ... -> Ln-1 -> Ln` 原地重排为 `L0 -> Ln -> L1 -> Ln-1 -> L2 -> ...`。1 <= 长度 <= 5*10^4。

**思路：** 用 slow/fast 找中点，反转后半段，再合并两段。时间 O(n)，空间 O(1)。

**Python：**
```python
def reorder_list(head: ListNode | None) -> None:
    if not head or not head.next:
        return
    slow, fast = head, head
    while fast and fast.next:
        slow = slow.next  # type: ignore
        fast = fast.next.next
    prev, cur = None, slow.next  # type: ignore
    slow.next = None  # type: ignore
    while cur:
        nxt = cur.next
        cur.next = prev
        prev = cur
        cur = nxt
    a, b = head, prev
    while b:
        a_nxt, b_nxt = a.next, b.next  # type: ignore
        a.next = b  # type: ignore
        b.next = a_nxt
        a, b = a_nxt, b_nxt
```

**TypeScript：**
```typescript
function reorderList(head: ListNode | null): void {
  if (!head || !head.next) return;
  let slow = head, fast: ListNode | null = head;
  while (fast && fast.next) { slow = slow.next!; fast = fast.next.next; }
  let prev: ListNode | null = null, cur: ListNode | null = slow.next;
  slow.next = null;
  while (cur) { const nx: ListNode | null = cur.next; cur.next = prev; prev = cur; cur = nx; }
  let a: ListNode | null = head, b = prev;
  while (b) {
    const an: ListNode | null = a!.next, bn: ListNode | null = b.next;
    a!.next = b; b.next = an;
    a = an; b = bn;
  }
}
```

**Java：**
```java
void reorderList(ListNode head) {
    if (head == null || head.next == null) return;
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) { slow = slow.next; fast = fast.next.next; }
    ListNode prev = null, cur = slow.next;
    slow.next = null;
    while (cur != null) { ListNode nx = cur.next; cur.next = prev; prev = cur; cur = nx; }
    ListNode a = head, b = prev;
    while (b != null) {
        ListNode an = a.next, bn = b.next;
        a.next = b; b.next = an;
        a = an; b = bn;
    }
}
```

**要点：**
- 反转右半段前先把两段切开。
- 合并时交替来自两段的节点。
- 原地操作：除指针外不分配额外空间。

---

### 26. Linked List Cycle  ·  简单  ·  链表

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

### 27. Linked List Cycle II  ·  中等  ·  链表

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

### 28. Copy List with Random Pointer  ·  中等  ·  链表 / 哈希

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

### 29. Add Two Numbers  ·  中等  ·  链表 / 数学

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

### 30. LRU Cache  ·  中等  ·  设计 / 链表

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

### 31. Invert Binary Tree  ·  简单  ·  树

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

### 32. Maximum Depth of Binary Tree  ·  简单  ·  树

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

### 33. Same Tree  ·  简单  ·  树

**问题：** 判断两棵二叉树是否结构相同且值相同。0 <= 节点数 <= 100。

**思路：** 递归比较根并递归到对应子树。时间 O(n)，栈 O(h)。

**Python：**
```python
def is_same_tree(p: TreeNode | None, q: TreeNode | None) -> bool:
    if p is None and q is None:
        return True
    if p is None or q is None or p.val != q.val:
        return False
    return is_same_tree(p.left, q.left) and is_same_tree(p.right, q.right)
```

**TypeScript：**
```typescript
function isSameTree(p: TreeNode | null, q: TreeNode | null): boolean {
  if (!p && !q) return true;
  if (!p || !q || p.val !== q.val) return false;
  return isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
}
```

**Java：**
```java
boolean isSameTree(TreeNode p, TreeNode q) {
    if (p == null && q == null) return true;
    if (p == null || q == null || p.val != q.val) return false;
    return isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
}
```

**要点：**
- 都为空返回 true；一个为空返回 false。
- 值不匹配立即短路。
- BFS 同步遍历也可。

---

### 34. Subtree of Another Tree  ·  简单  ·  树

**问题：** 如果 `subRoot` 匹配 `root` 的任何子树，返回 true。1 <= nodes(root) <= 2000。

**思路：** 递归 `root`；在每个节点用 `is_same_tree` 与 `subRoot` 比较。时间 O(n*m)。

**Python：**
```python
def is_subtree(root: TreeNode | None, sub: TreeNode | None) -> bool:
    if sub is None:
        return True
    if root is None:
        return False
    if is_same_tree(root, sub):
        return True
    return is_subtree(root.left, sub) or is_subtree(root.right, sub)
```

**TypeScript：**
```typescript
function isSubtree(root: TreeNode | null, sub: TreeNode | null): boolean {
  if (!sub) return true;
  if (!root) return false;
  if (isSameTree(root, sub)) return true;
  return isSubtree(root.left, sub) || isSubtree(root.right, sub);
}
```

**Java：**
```java
boolean isSubtree(TreeNode root, TreeNode sub) {
    if (sub == null) return true;
    if (root == null) return false;
    if (isSameTree(root, sub)) return true;
    return isSubtree(root.left, sub) || isSubtree(root.right, sub);
}
```

**要点：**
- 空 `sub` 平凡地是子树。
- 最坏情况每个候选点都访问全部节点一次。
- 对序列化后的树跑 KMP 可达 O(n+m)。

---

### 35. Lowest Common Ancestor of a BST  ·  中等  ·  树 / BST

**问题：** 给定 BST 和两个节点，返回它们的 LCA。值唯一。2 <= 节点数 <= 10^5。

**思路：** 从根向下走；将两个值与当前节点比较以决定方向。时间 O(h)，空间 O(1)。

**Python：**
```python
def lowest_common_ancestor_bst(root: TreeNode, p: TreeNode, q: TreeNode) -> TreeNode:
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
function lowestCommonAncestorBST(root: TreeNode, p: TreeNode, q: TreeNode): TreeNode {
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
TreeNode lowestCommonAncestorBST(TreeNode root, TreeNode p, TreeNode q) {
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
- 分叉点即为 LCA。
- BST 性质避免遍历整棵树。
- 同向路径意味着当前节点是自身或后代的祖先。

---

### 36. Lowest Common Ancestor of a Binary Tree  ·  中等  ·  树

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

### 37. Binary Tree Level Order Traversal  ·  中等  ·  树 / BFS

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

### 38. Validate Binary Search Tree  ·  中等  ·  树 / BST

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

### 39. Kth Smallest Element in a BST  ·  中等  ·  树 / BST

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

### 40. Construct Binary Tree from Preorder and Inorder  ·  中等  ·  树

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

### 41. Binary Tree Maximum Path Sum  ·  困难  ·  树 / DP

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

### 42. Serialize and Deserialize Binary Tree  ·  困难  ·  树 / 设计

**问题：** 将任意二叉树编码成字符串并解码回来。-1000 <= node.val <= 1000。

**思路：** 前序 DFS，用 `#` 表示空节点；反序列化通过队列。两端时间 O(n)。

**Python：**
```python
def serialize(root: TreeNode | None) -> str:
    parts: list[str] = []
    def go(n: TreeNode | None) -> None:
        if n is None:
            parts.append("#")
            return
        parts.append(str(n.val))
        go(n.left)
        go(n.right)
    go(root)
    return ",".join(parts)

def deserialize(data: str) -> TreeNode | None:
    it = iter(data.split(","))
    def go() -> TreeNode | None:
        v = next(it)
        if v == "#":
            return None
        n = TreeNode(int(v))
        n.left = go()
        n.right = go()
        return n
    return go()
```

**TypeScript：**
```typescript
function serialize(root: TreeNode | null): string {
  const parts: string[] = [];
  const go = (n: TreeNode | null) => {
    if (!n) { parts.push("#"); return; }
    parts.push(String(n.val));
    go(n.left); go(n.right);
  };
  go(root);
  return parts.join(",");
}

function deserialize(data: string): TreeNode | null {
  const toks = data.split(",");
  let i = 0;
  const go = (): TreeNode | null => {
    const v = toks[i++];
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
String serialize(TreeNode root) {
    var sb = new StringBuilder();
    serGo(root, sb);
    return sb.toString();
}

void serGo(TreeNode n, StringBuilder sb) {
    if (n == null) { sb.append("#,"); return; }
    sb.append(n.val).append(',');
    serGo(n.left, sb); serGo(n.right, sb);
}

int desIdx = 0;
TreeNode deserialize(String data) {
    String[] toks = data.split(",");
    return desGo(toks);
}

TreeNode desGo(String[] toks) {
    String v = toks[desIdx++];
    if (v.equals("#")) return null;
    var n = new TreeNode(Integer.parseInt(v));
    n.left = desGo(toks); n.right = desGo(toks);
    return n;
}
```

**要点：**
- 哨兵 `#` 解决空子节点的歧义。
- 前序恢复使用共享游标/迭代器。
- 基于 BFS 的序列化同样有效。

---

### 43. Number of Islands  ·  中等  ·  图 / DFS

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

### 44. Clone Graph  ·  中等  ·  图 / DFS

**问题：** 给定一个连通无向图的某节点引用，深拷贝该图。0 <= 节点数 <= 100。

**思路：** DFS，用原节点到克隆节点的映射避免重复访问。时间和空间 O(V+E)。

**Python：**
```python
class GraphNode:
    def __init__(self, val: int = 0, neighbors: "list[GraphNode] | None" = None) -> None:
        self.val = val
        self.neighbors = neighbors or []

def clone_graph(node: GraphNode | None) -> GraphNode | None:
    if node is None:
        return None
    seen: dict[GraphNode, GraphNode] = {}
    def dfs(n: GraphNode) -> GraphNode:
        if n in seen:
            return seen[n]
        copy = GraphNode(n.val)
        seen[n] = copy
        copy.neighbors = [dfs(x) for x in n.neighbors]
        return copy
    return dfs(node)
```

**TypeScript：**
```typescript
class GNode {
  val: number;
  neighbors: GNode[];
  constructor(v = 0, n: GNode[] = []) { this.val = v; this.neighbors = n; }
}

function cloneGraph(node: GNode | null): GNode | null {
  if (!node) return null;
  const seen = new Map<GNode, GNode>();
  const dfs = (n: GNode): GNode => {
    if (seen.has(n)) return seen.get(n)!;
    const c = new GNode(n.val);
    seen.set(n, c);
    c.neighbors = n.neighbors.map(dfs);
    return c;
  };
  return dfs(node);
}
```

**Java：**
```java
class GraphNode {
    int val; List<GraphNode> neighbors = new ArrayList<>();
    GraphNode(int v) { val = v; }
}

GraphNode cloneGraph(GraphNode node) {
    if (node == null) return null;
    var seen = new HashMap<GraphNode, GraphNode>();
    return dfs(node, seen);
}

GraphNode dfs(GraphNode n, Map<GraphNode, GraphNode> seen) {
    if (seen.containsKey(n)) return seen.get(n);
    var copy = new GraphNode(n.val);
    seen.put(n, copy);
    for (GraphNode x : n.neighbors) copy.neighbors.add(dfs(x, seen));
    return copy;
}
```

**要点：**
- 递归进入邻居前先把克隆放入 memo。
- 通过 seen 映射处理环。
- BFS 变体配合队列同样有效。

---

### 45. Pacific Atlantic Water Flow  ·  中等  ·  图 / BFS

**问题：** 在 m x n 高度网格中，返回水可以同时流到太平洋（上/左边界）和大西洋（下/右边界）的单元格。1 <= m, n <= 200。

**思路：** 从每个海洋的边界向内做 BFS/DFS；取两个可达集合的交集。时间 O(m*n)。

**Python：**
```python
def pacific_atlantic(heights: list[list[int]]) -> list[list[int]]:
    if not heights:
        return []
    m, n = len(heights), len(heights[0])
    pac: set[tuple[int, int]] = set()
    atl: set[tuple[int, int]] = set()
    def dfs(r: int, c: int, visited: set[tuple[int, int]], prev: int) -> None:
        if (r, c) in visited or r < 0 or c < 0 or r >= m or c >= n or heights[r][c] < prev:
            return
        visited.add((r, c))
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            dfs(r + dr, c + dc, visited, heights[r][c])
    for i in range(m):
        dfs(i, 0, pac, heights[i][0])
        dfs(i, n - 1, atl, heights[i][n - 1])
    for j in range(n):
        dfs(0, j, pac, heights[0][j])
        dfs(m - 1, j, atl, heights[m - 1][j])
    return [list(p) for p in pac & atl]
```

**TypeScript：**
```typescript
function pacificAtlantic(heights: number[][]): number[][] {
  if (!heights.length) return [];
  const m = heights.length, n = heights[0].length;
  const pac = Array.from({ length: m }, () => new Array(n).fill(false));
  const atl = Array.from({ length: m }, () => new Array(n).fill(false));
  const dfs = (r: number, c: number, v: boolean[][], prev: number): void => {
    if (r < 0 || c < 0 || r >= m || c >= n || v[r][c] || heights[r][c] < prev) return;
    v[r][c] = true;
    dfs(r + 1, c, v, heights[r][c]); dfs(r - 1, c, v, heights[r][c]);
    dfs(r, c + 1, v, heights[r][c]); dfs(r, c - 1, v, heights[r][c]);
  };
  for (let i = 0; i < m; i++) { dfs(i, 0, pac, heights[i][0]); dfs(i, n - 1, atl, heights[i][n - 1]); }
  for (let j = 0; j < n; j++) { dfs(0, j, pac, heights[0][j]); dfs(m - 1, j, atl, heights[m - 1][j]); }
  const out: number[][] = [];
  for (let r = 0; r < m; r++)
    for (let c = 0; c < n; c++)
      if (pac[r][c] && atl[r][c]) out.push([r, c]);
  return out;
}
```

**Java：**
```java
int[][] DIRS = {{1,0},{-1,0},{0,1},{0,-1}};

List<List<Integer>> pacificAtlantic(int[][] heights) {
    var out = new ArrayList<List<Integer>>();
    if (heights.length == 0) return out;
    int m = heights.length, n = heights[0].length;
    boolean[][] pac = new boolean[m][n], atl = new boolean[m][n];
    for (int i = 0; i < m; i++) { dfs(heights, pac, i, 0, heights[i][0]); dfs(heights, atl, i, n - 1, heights[i][n - 1]); }
    for (int j = 0; j < n; j++) { dfs(heights, pac, 0, j, heights[0][j]); dfs(heights, atl, m - 1, j, heights[m - 1][j]); }
    for (int r = 0; r < m; r++)
        for (int c = 0; c < n; c++)
            if (pac[r][c] && atl[r][c]) out.add(List.of(r, c));
    return out;
}

void dfs(int[][] h, boolean[][] v, int r, int c, int prev) {
    if (r < 0 || c < 0 || r >= h.length || c >= h[0].length || v[r][c] || h[r][c] < prev) return;
    v[r][c] = true;
    for (var d : DIRS) dfs(h, v, r + d[0], c + d[1], h[r][c]);
}
```

**要点：**
- 反向流动：从海洋向内搜索。
- 只访问高度不递减的单元格。
- 求交集获得双洋可达的单元格。

---

### 46. Course Schedule  ·  中等  ·  图 / 拓扑

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

### 47. Course Schedule II  ·  中等  ·  图 / 拓扑

**问题：** 返回一个有效的课程顺序；若不可能返回空数组。n <= 2000。

**思路：** Kahn 拓扑排序；记录出队顺序。时间 O(V+E)。

**Python：**
```python
def find_order(num_courses: int, prerequisites: list[list[int]]) -> list[int]:
    graph = defaultdict(list)
    indeg = [0] * num_courses
    for a, b in prerequisites:
        graph[b].append(a)
        indeg[a] += 1
    q = deque([i for i in range(num_courses) if indeg[i] == 0])
    order: list[int] = []
    while q:
        u = q.popleft()
        order.append(u)
        for v in graph[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    return order if len(order) == num_courses else []
```

**TypeScript：**
```typescript
function findOrder(numCourses: number, prerequisites: number[][]): number[] {
  const graph: number[][] = Array.from({ length: numCourses }, () => []);
  const indeg = new Array(numCourses).fill(0);
  for (const [a, b] of prerequisites) { graph[b].push(a); indeg[a]++; }
  const q: number[] = [];
  for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) q.push(i);
  const order: number[] = [];
  while (q.length) {
    const u = q.shift()!;
    order.push(u);
    for (const v of graph[u]) if (--indeg[v] === 0) q.push(v);
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
    for (var p : prerequisites) { graph.get(p[1]).add(p[0]); indeg[p[0]]++; }
    var q = new ArrayDeque<Integer>();
    for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) q.offer(i);
    int[] order = new int[numCourses];
    int idx = 0;
    while (!q.isEmpty()) {
        int u = q.poll();
        order[idx++] = u;
        for (int v : graph.get(u)) if (--indeg[v] == 0) q.offer(v);
    }
    return idx == numCourses ? order : new int[0];
}
```

**要点：**
- 与 Course Schedule 结构一致，外加记录。
- 可能存在多个有效顺序。
- 返回空表示存在环。

---

### 48. Number of Connected Components  ·  中等  ·  并查集

**问题：** 给定 n 个节点和无向边，返回连通分量数。1 <= n <= 2000。

**思路：** 带路径压缩和按规模合并的并查集。~O((n + e) * a(n))。

**Python：**
```python
def count_components(n: int, edges: list[list[int]]) -> int:
    parent = list(range(n))
    size = [1] * n
    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    def union(a: int, b: int) -> bool:
        ra, rb = find(a), find(b)
        if ra == rb:
            return False
        if size[ra] < size[rb]:
            ra, rb = rb, ra
        parent[rb] = ra
        size[ra] += size[rb]
        return True
    comps = n
    for a, b in edges:
        if union(a, b):
            comps -= 1
    return comps
```

**TypeScript：**
```typescript
function countComponents(n: number, edges: number[][]): number {
  const parent = Array.from({ length: n }, (_, i) => i);
  const size = new Array(n).fill(1);
  const find = (x: number): number => {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  };
  const union = (a: number, b: number): boolean => {
    let ra = find(a), rb = find(b);
    if (ra === rb) return false;
    if (size[ra] < size[rb]) [ra, rb] = [rb, ra];
    parent[rb] = ra; size[ra] += size[rb];
    return true;
  };
  let comps = n;
  for (const [a, b] of edges) if (union(a, b)) comps--;
  return comps;
}
```

**Java：**
```java
int[] parent, size;

int countComponents(int n, int[][] edges) {
    parent = new int[n]; size = new int[n];
    for (int i = 0; i < n; i++) { parent[i] = i; size[i] = 1; }
    int comps = n;
    for (var e : edges) if (union(e[0], e[1])) comps--;
    return comps;
}

int find(int x) {
    while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
}

boolean union(int a, int b) {
    int ra = find(a), rb = find(b);
    if (ra == rb) return false;
    if (size[ra] < size[rb]) { int t = ra; ra = rb; rb = t; }
    parent[rb] = ra; size[ra] += size[rb];
    return true;
}
```

**要点：**
- 每次成功 union 使分量数减 1。
- 路径压缩保持树扁平。
- 基于邻接表的 DFS 是替代方案。

---

### 49. Graph Valid Tree  ·  中等  ·  并查集

**问题：** 给定 n 个节点和无向边，判断它们是否构成一棵树。1 <= n <= 2000。

**思路：** 树等价于恰好 n-1 条边且无环；并查集检测环。O((n + e) * a(n))。

**Python：**
```python
def valid_tree(n: int, edges: list[list[int]]) -> bool:
    if len(edges) != n - 1:
        return False
    parent = list(range(n))
    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    for a, b in edges:
        ra, rb = find(a), find(b)
        if ra == rb:
            return False
        parent[ra] = rb
    return True
```

**TypeScript：**
```typescript
function validTree(n: number, edges: number[][]): boolean {
  if (edges.length !== n - 1) return false;
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  };
  for (const [a, b] of edges) {
    const ra = find(a), rb = find(b);
    if (ra === rb) return false;
    parent[ra] = rb;
  }
  return true;
}
```

**Java：**
```java
int[] parent;

boolean validTree(int n, int[][] edges) {
    if (edges.length != n - 1) return false;
    parent = new int[n];
    for (int i = 0; i < n; i++) parent[i] = i;
    for (var e : edges) {
        int ra = find(e[0]), rb = find(e[1]);
        if (ra == rb) return false;
        parent[ra] = rb;
    }
    return true;
}

int find(int x) {
    while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
}
```

**要点：**
- 边数检查为无环图强制了连通性。
- 通过对两个端点 find 来检测环。
- 等价方案：BFS 检查只有单一分量且无重复访问。

---

### 50. Word Ladder  ·  困难  ·  图 / BFS

**问题：** 用 `wordList` 中的词，每次改一个字母，将 `beginWord` 变到 `endWord`。返回最短长度，否则 0。1 <= len(words) <= 5000。

**思路：** BFS 将每个词视为节点；邻居是在词集中的单字母替换。O(N * L^2)。

**Python：**
```python
def ladder_length(begin_word: str, end_word: str, word_list: list[str]) -> int:
    words = set(word_list)
    if end_word not in words:
        return 0
    q: deque[tuple[str, int]] = deque([(begin_word, 1)])
    while q:
        w, d = q.popleft()
        if w == end_word:
            return d
        for i in range(len(w)):
            for ch in "abcdefghijklmnopqrstuvwxyz":
                nw = w[:i] + ch + w[i + 1:]
                if nw in words:
                    words.remove(nw)
                    q.append((nw, d + 1))
    return 0
```

**TypeScript：**
```typescript
function ladderLength(beginWord: string, endWord: string, wordList: string[]): number {
  const words = new Set(wordList);
  if (!words.has(endWord)) return 0;
  const q: Array<[string, number]> = [[beginWord, 1]];
  while (q.length) {
    const [w, d] = q.shift()!;
    if (w === endWord) return d;
    for (let i = 0; i < w.length; i++) {
      for (let c = 97; c <= 122; c++) {
        const nw = w.slice(0, i) + String.fromCharCode(c) + w.slice(i + 1);
        if (words.has(nw)) { words.delete(nw); q.push([nw, d + 1]); }
      }
    }
  }
  return 0;
}
```

**Java：**
```java
int ladderLength(String beginWord, String endWord, List<String> wordList) {
    var words = new HashSet<>(wordList);
    if (!words.contains(endWord)) return 0;
    var q = new ArrayDeque<String>();
    q.offer(beginWord);
    int d = 1;
    while (!q.isEmpty()) {
        int size = q.size();
        for (int s = 0; s < size; s++) {
            String w = q.poll();
            if (w.equals(endWord)) return d;
            char[] arr = w.toCharArray();
            for (int i = 0; i < arr.length; i++) {
                char old = arr[i];
                for (char c = 'a'; c <= 'z'; c++) {
                    arr[i] = c;
                    String nw = new String(arr);
                    if (words.remove(nw)) q.offer(nw);
                }
                arr[i] = old;
            }
        }
        d++;
    }
    return 0;
}
```

**要点：**
- 从集合中移除等同于廉价地标记已访问。
- 双向 BFS 可将工作量大致开方。
- 每次替换产生 `26 * L` 个候选。

---

### 51. Alien Dictionary  ·  困难  ·  图 / 拓扑

**问题：** 给定外星语言按字典序排列的单词列表，推导一个可能的字母表顺序。无解返回 ""。1 <= len(words) <= 100。

**思路：** 比较相邻单词在第一个不同字符间添加边；拓扑排序。O(C)，C 为总字符数。

**Python：**
```python
def alien_order(words: list[str]) -> str:
    graph: dict[str, set[str]] = {c: set() for w in words for c in w}
    indeg: dict[str, int] = {c: 0 for c in graph}
    for a, b in zip(words, words[1:]):
        if len(a) > len(b) and a.startswith(b):
            return ""
        for x, y in zip(a, b):
            if x != y:
                if y not in graph[x]:
                    graph[x].add(y)
                    indeg[y] += 1
                break
    q = deque([c for c in indeg if indeg[c] == 0])
    out: list[str] = []
    while q:
        c = q.popleft()
        out.append(c)
        for n in graph[c]:
            indeg[n] -= 1
            if indeg[n] == 0:
                q.append(n)
    return "".join(out) if len(out) == len(indeg) else ""
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
    if (a.length > b.length && a.startsWith(b)) return "";
    const n = Math.min(a.length, b.length);
    for (let j = 0; j < n; j++) {
      if (a[j] !== b[j]) {
        if (!graph.get(a[j])!.has(b[j])) {
          graph.get(a[j])!.add(b[j]);
          indeg.set(b[j], indeg.get(b[j])! + 1);
        }
        break;
      }
    }
  }
  const q: string[] = [];
  for (const [c, d] of indeg) if (d === 0) q.push(c);
  const out: string[] = [];
  while (q.length) {
    const c = q.shift()!;
    out.push(c);
    for (const n of graph.get(c)!) {
      indeg.set(n, indeg.get(n)! - 1);
      if (indeg.get(n) === 0) q.push(n);
    }
  }
  return out.length === indeg.size ? out.join("") : "";
}
```

**Java：**
```java
String alienOrder(String[] words) {
    var graph = new HashMap<Character, Set<Character>>();
    var indeg = new HashMap<Character, Integer>();
    for (String w : words) for (char c : w.toCharArray()) {
        graph.putIfAbsent(c, new HashSet<>());
        indeg.putIfAbsent(c, 0);
    }
    for (int i = 0; i + 1 < words.length; i++) {
        String a = words[i], b = words[i + 1];
        if (a.length() > b.length() && a.startsWith(b)) return "";
        int n = Math.min(a.length(), b.length());
        for (int j = 0; j < n; j++) {
            if (a.charAt(j) != b.charAt(j)) {
                if (graph.get(a.charAt(j)).add(b.charAt(j))) indeg.merge(b.charAt(j), 1, Integer::sum);
                break;
            }
        }
    }
    var q = new ArrayDeque<Character>();
    for (var e : indeg.entrySet()) if (e.getValue() == 0) q.offer(e.getKey());
    var sb = new StringBuilder();
    while (!q.isEmpty()) {
        char c = q.poll();
        sb.append(c);
        for (char nx : graph.get(c)) if (indeg.merge(nx, -1, Integer::sum) == 0) q.offer(nx);
    }
    return sb.length() == indeg.size() ? sb.toString() : "";
}
```

**要点：**
- 非法情形：较长前缀词排在其短形式之后。
- 只有第一个不同字符产生一条边。
- 拓扑排序失败说明存在矛盾。

---

### 52. Climbing Stairs  ·  简单  ·  DP

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

### 53. House Robber  ·  中等  ·  DP

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

### 54. House Robber II  ·  中等  ·  DP

**问题：** 与 House Robber 相同，但房屋排成一圈。1 <= len(nums) <= 100。

**思路：** 跑两次线性 robber：排除首家或排除末家；取最大。时间 O(n)。

**Python：**
```python
def rob_circle(nums: list[int]) -> int:
    def line(a: list[int]) -> int:
        p1 = p2 = 0
        for x in a:
            p1, p2 = max(p1, p2 + x), p1
        return p1
    if len(nums) == 1:
        return nums[0]
    return max(line(nums[1:]), line(nums[:-1]))
```

**TypeScript：**
```typescript
function robCircle(nums: number[]): number {
  const line = (a: number[]): number => {
    let p1 = 0, p2 = 0;
    for (const x of a) { const c = Math.max(p1, p2 + x); p2 = p1; p1 = c; }
    return p1;
  };
  if (nums.length === 1) return nums[0];
  return Math.max(line(nums.slice(1)), line(nums.slice(0, -1)));
}
```

**Java：**
```java
int robCircle(int[] nums) {
    if (nums.length == 1) return nums[0];
    return Math.max(line(nums, 1, nums.length - 1), line(nums, 0, nums.length - 2));
}

int line(int[] nums, int lo, int hi) {
    int p1 = 0, p2 = 0;
    for (int i = lo; i <= hi; i++) {
        int cur = Math.max(p1, p2 + nums[i]);
        p2 = p1; p1 = cur;
    }
    return p1;
}
```

**要点：**
- 环形约束意味着首尾相邻。
- 要么跳过首家、要么跳过末家，然后线性 DP。
- 单元素情形需显式处理。

---

### 55. Coin Change  ·  中等  ·  DP

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

### 56. Longest Increasing Subsequence  ·  中等  ·  DP / 二分查找

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

### 57. Word Break  ·  中等  ·  DP

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

### 58. Combination Sum  ·  中等  ·  回溯

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

### 59. Decode Ways  ·  中等  ·  DP

**问题：** 计算数字串的解码数，其中 'A'->1 ... 'Z'->26。1 <= len(s) <= 100。

**思路：** DP：dp[i] = (s[i-1] != '0' 时的 dp[i-1]) + (s[i-2:i] 在 '10'..'26' 时的 dp[i-2])。时间 O(n)，空间 O(1)。

**Python：**
```python
def num_decodings(s: str) -> int:
    if not s or s[0] == "0":
        return 0
    prev1 = prev2 = 1
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
  let prev1 = 1, prev2 = 1;
  for (let i = 1; i < s.length; i++) {
    let cur = 0;
    if (s[i] !== "0") cur += prev1;
    const two = parseInt(s.slice(i - 1, i + 1), 10);
    if (two >= 10 && two <= 26) cur += prev2;
    prev2 = prev1; prev1 = cur;
  }
  return prev1;
}
```

**Java：**
```java
int numDecodings(String s) {
    if (s.isEmpty() || s.charAt(0) == '0') return 0;
    int prev1 = 1, prev2 = 1;
    for (int i = 1; i < s.length(); i++) {
        int cur = 0;
        if (s.charAt(i) != '0') cur += prev1;
        int two = Integer.parseInt(s.substring(i - 1, i + 1));
        if (two >= 10 && two <= 26) cur += prev2;
        prev2 = prev1; prev1 = cur;
    }
    return prev1;
}
```

**要点：**
- 单独的 '0' 不能解码。
- 前导 '0' 返回 0。
- 可能存在两种解释：单字符和双字符。

---

### 60. Unique Paths  ·  中等  ·  DP / 组合数学

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

### 61. Jump Game  ·  中等  ·  贪心

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

### 62. Edit Distance  ·  困难  ·  DP

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

### 63. Longest Common Subsequence  ·  中等  ·  DP

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

### 64. Partition Equal Subset Sum  ·  中等  ·  DP / 背包

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

### 65. Subsets  ·  中等  ·  回溯

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

### 66. Permutations  ·  中等  ·  回溯

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

### 67. Word Search  ·  中等  ·  回溯

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

### 68. N-Queens  ·  困难  ·  回溯

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

### 69. Generate Parentheses  ·  中等  ·  回溯

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

### 70. Letter Combinations of a Phone Number  ·  中等  ·  回溯

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

### 71. Sum of Two Integers  ·  中等  ·  位运算

**问题：** 不使用 + 或 - 实现 a + b。-1000 <= a, b <= 1000。

**思路：** XOR 计算无进位和；AND << 1 计算进位；直到无进位为止。O(log max)。

**Python：**
```python
def get_sum(a: int, b: int) -> int:
    MASK = 0xFFFFFFFF
    INT_MAX = 0x7FFFFFFF
    while b != 0:
        a, b = (a ^ b) & MASK, ((a & b) << 1) & MASK
    return a if a <= INT_MAX else ~(a ^ MASK)
```

**TypeScript：**
```typescript
function getSum(a: number, b: number): number {
  while (b !== 0) {
    const c = (a & b) << 1;
    a = a ^ b;
    b = c;
  }
  return a;
}
```

**Java：**
```java
int getSum(int a, int b) {
    while (b != 0) {
        int c = (a & b) << 1;
        a = a ^ b;
        b = c;
    }
    return a;
}
```

**要点：**
- XOR 是按位的模 2 加法。
- AND 后左移把进位传到下一位。
- Python 需用掩码模拟定长语义。

---

### 72. Number of 1 Bits  ·  简单  ·  位运算

**问题：** 计算无符号 32 位整数中置位的个数。0 <= n <= 2^32 - 1。

**思路：** Brian Kernighan：`n &= n - 1` 清除最低置位。O(置位数)。

**Python：**
```python
def hamming_weight(n: int) -> int:
    c = 0
    while n:
        n &= n - 1
        c += 1
    return c
```

**TypeScript：**
```typescript
function hammingWeight(n: number): number {
  let c = 0;
  while (n !== 0) {
    n &= n - 1;
    c++;
  }
  return c;
}
```

**Java：**
```java
int hammingWeight(int n) {
    int c = 0;
    while (n != 0) {
        n &= n - 1;
        c++;
    }
    return c;
}
```

**要点：**
- 循环次数等于置位数。
- 内建函数（bin/popcount）也可用。
- JS 位运算把数当作 32 位有符号处理。

---

### 73. Counting Bits  ·  简单  ·  DP / 位运算

**问题：** 对 i 在 [0, n]，返回 popcount(i) 数组。0 <= n <= 10^5。

**思路：** dp[i] = dp[i >> 1] + (i & 1)。时间 O(n)。

**Python：**
```python
def count_bits(n: int) -> list[int]:
    dp = [0] * (n + 1)
    for i in range(1, n + 1):
        dp[i] = dp[i >> 1] + (i & 1)
    return dp
```

**TypeScript：**
```typescript
function countBits(n: number): number[] {
  const dp = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) dp[i] = dp[i >> 1] + (i & 1);
  return dp;
}
```

**Java：**
```java
int[] countBits(int n) {
    int[] dp = new int[n + 1];
    for (int i = 1; i <= n; i++) dp[i] = dp[i >> 1] + (i & 1);
    return dp;
}
```

**要点：**
- i >> 1 去掉最低位。
- (i & 1) 告诉你最低位是否为 1。
- 对每个元素直接做 popcount 的 O(n log n) 也可。

---

### 74. Missing Number  ·  简单  ·  位运算 / 数学

**问题：** 数组包含 [0, n] 中 n 个不同的数，缺失其中一个。返回它。1 <= n <= 10^4。

**思路：** 把下标与值依次 XOR；缺失的下标/值会保留下来。时间 O(n)，空间 O(1)。

**Python：**
```python
def missing_number(nums: list[int]) -> int:
    x = len(nums)
    for i, v in enumerate(nums):
        x ^= i ^ v
    return x
```

**TypeScript：**
```typescript
function missingNumber(nums: number[]): number {
  let x = nums.length;
  for (let i = 0; i < nums.length; i++) x ^= i ^ nums[i];
  return x;
}
```

**Java：**
```java
int missingNumber(int[] nums) {
    int x = nums.length;
    for (int i = 0; i < nums.length; i++) x ^= i ^ nums[i];
    return x;
}
```

**要点：**
- 重复值 XOR 抵消为 0。
- 求和公式 (n*(n+1)/2 - sum) 也可。
- 初值 x = n 覆盖了上界。

---

### 75. Reverse Bits  ·  简单  ·  位运算

**问题：** 反转 32 位无符号整数的位。输入始终为 32 位宽。

**思路：** 结果左移，OR 上输入的最低位；循环 32 次。时间 O(1)。

**Python：**
```python
def reverse_bits(n: int) -> int:
    r = 0
    for _ in range(32):
        r = (r << 1) | (n & 1)
        n >>= 1
    return r
```

**TypeScript：**
```typescript
function reverseBits(n: number): number {
  let r = 0;
  for (let i = 0; i < 32; i++) {
    r = (r << 1) | (n & 1);
    n = n >>> 1;
  }
  return r >>> 0;
}
```

**Java：**
```java
int reverseBits(int n) {
    int r = 0;
    for (int i = 0; i < 32; i++) {
        r = (r << 1) | (n & 1);
        n >>>= 1;
    }
    return r;
}
```

**要点：**
- TS 中使用无符号右移避免符号扩展。
- 末尾 `>>> 0` 转为无符号 32 位。
- 分治交换两半为 O(log w)。

---

### 76. Single Number  ·  简单  ·  位运算

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

### 77. Insert Interval  ·  中等  ·  区间

**问题：** 将 `newInterval` 插入不重叠的有序区间列表，必要时合并。0 <= len(intervals) <= 10^4。

**思路：** 三阶段扫描：之前、重叠（合并）、之后。时间 O(n)。

**Python：**
```python
def insert(intervals: list[list[int]], new_interval: list[int]) -> list[list[int]]:
    out: list[list[int]] = []
    i, n = 0, len(intervals)
    while i < n and intervals[i][1] < new_interval[0]:
        out.append(intervals[i]); i += 1
    while i < n and intervals[i][0] <= new_interval[1]:
        new_interval[0] = min(new_interval[0], intervals[i][0])
        new_interval[1] = max(new_interval[1], intervals[i][1])
        i += 1
    out.append(new_interval)
    while i < n:
        out.append(intervals[i]); i += 1
    return out
```

**TypeScript：**
```typescript
function insert(intervals: number[][], newInterval: number[]): number[][] {
  const out: number[][] = [];
  let i = 0;
  while (i < intervals.length && intervals[i][1] < newInterval[0]) out.push(intervals[i++]);
  while (i < intervals.length && intervals[i][0] <= newInterval[1]) {
    newInterval[0] = Math.min(newInterval[0], intervals[i][0]);
    newInterval[1] = Math.max(newInterval[1], intervals[i][1]);
    i++;
  }
  out.push(newInterval);
  while (i < intervals.length) out.push(intervals[i++]);
  return out;
}
```

**Java：**
```java
int[][] insert(int[][] intervals, int[] newInterval) {
    var out = new ArrayList<int[]>();
    int i = 0, n = intervals.length;
    while (i < n && intervals[i][1] < newInterval[0]) out.add(intervals[i++]);
    while (i < n && intervals[i][0] <= newInterval[1]) {
        newInterval[0] = Math.min(newInterval[0], intervals[i][0]);
        newInterval[1] = Math.max(newInterval[1], intervals[i][1]);
        i++;
    }
    out.add(newInterval);
    while (i < n) out.add(intervals[i++]);
    return out.toArray(new int[0][]);
}
```

**要点：**
- 合并时直接修改 newInterval 很方便。
- 输入有序使得单次扫描可行。
- 三段循环让逻辑清晰。

---

### 78. Merge Intervals  ·  中等  ·  区间

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

### 79. Non-overlapping Intervals  ·  中等  ·  贪心

**问题：** 最少删除多少区间使剩余区间不重叠。1 <= len(intervals) <= 10^5。

**思路：** 按终点排序；贪心保留起点 >= 最后保留终点的区间。时间 O(n log n)。

**Python：**
```python
def erase_overlap_intervals(intervals: list[list[int]]) -> int:
    intervals.sort(key=lambda x: x[1])
    end = float("-inf")
    removed = 0
    for s, e in intervals:
        if s >= end:
            end = e
        else:
            removed += 1
    return removed
```

**TypeScript：**
```typescript
function eraseOverlapIntervals(intervals: number[][]): number {
  intervals.sort((a, b) => a[1] - b[1]);
  let end = -Infinity, removed = 0;
  for (const [s, e] of intervals) {
    if (s >= end) end = e;
    else removed++;
  }
  return removed;
}
```

**Java：**
```java
int eraseOverlapIntervals(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> a[1] - b[1]);
    int end = Integer.MIN_VALUE, removed = 0;
    for (var iv : intervals) {
        if (iv[0] >= end) end = iv[1];
        else removed++;
    }
    return removed;
}
```

**要点：**
- 最早结束的贪心给未来留最多空间。
- 等价于活动选择问题。
- 删除数 = 总数 - 保留数。

---

### 80. Meeting Rooms  ·  简单  ·  区间

**问题：** 判断一个人是否能参加所有会议（不重叠）。0 <= len(intervals) <= 10^4。

**思路：** 按起点排序；检查每对相邻区间。时间 O(n log n)。

**Python：**
```python
def can_attend_meetings(intervals: list[list[int]]) -> bool:
    intervals.sort(key=lambda x: x[0])
    for i in range(1, len(intervals)):
        if intervals[i][0] < intervals[i - 1][1]:
            return False
    return True
```

**TypeScript：**
```typescript
function canAttendMeetings(intervals: number[][]): boolean {
  intervals.sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i][0] < intervals[i - 1][1]) return false;
  }
  return true;
}
```

**Java：**
```java
boolean canAttendMeetings(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
    for (int i = 1; i < intervals.length; i++)
        if (intervals[i][0] < intervals[i - 1][1]) return false;
    return true;
}
```

**要点：**
- 严格小于把端点相邻视为不重叠。
- 先排序再线性扫描。
- 空列表返回 true。

---

### 81. Meeting Rooms II  ·  中等  ·  堆 / 区间

**问题：** 需要的最少会议室数量。1 <= len(intervals) <= 10^4。

**思路：** 按起点排序；用小顶堆维护进行中的结束时间；当堆顶 end <= 当前 start 时复用房间。时间 O(n log n)。

**Python：**
```python
import heapq

def min_meeting_rooms(intervals: list[list[int]]) -> int:
    intervals.sort(key=lambda x: x[0])
    heap: list[int] = []
    for s, e in intervals:
        if heap and heap[0] <= s:
            heapq.heappop(heap)
        heapq.heappush(heap, e)
    return len(heap)
```

**TypeScript：**
```typescript
function minMeetingRooms(intervals: number[][]): number {
  intervals.sort((a, b) => a[0] - b[0]);
  const heap: number[] = [];
  const swap = (i: number, j: number) => { [heap[i], heap[j]] = [heap[j], heap[i]]; };
  const push = (x: number) => {
    heap.push(x);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p] > heap[i]) { swap(p, i); i = p; } else break;
    }
  };
  const pop = (): number => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      while (true) {
        const l = 2 * i + 1, r = 2 * i + 2;
        let m = i;
        if (l < heap.length && heap[l] < heap[m]) m = l;
        if (r < heap.length && heap[r] < heap[m]) m = r;
        if (m === i) break;
        swap(i, m); i = m;
      }
    }
    return top;
  };
  for (const [s, e] of intervals) {
    if (heap.length && heap[0] <= s) pop();
    push(e);
  }
  return heap.length;
}
```

**Java：**
```java
int minMeetingRooms(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
    var heap = new PriorityQueue<Integer>();
    for (var iv : intervals) {
        if (!heap.isEmpty() && heap.peek() <= iv[0]) heap.poll();
        heap.offer(iv[1]);
    }
    return heap.size();
}
```

**要点：**
- 堆大小等于同时进行的会议数。
- 扫描线计数（start/end 事件）是另一种方案。
- 仅当最早结束 <= 当前开始时才复用。

---

### 82. Rotate Image  ·  中等  ·  矩阵

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

### 83. Spiral Matrix  ·  中等  ·  矩阵

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

### 84. Set Matrix Zeroes  ·  中等  ·  矩阵

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

### 85. Word Search II  ·  困难  ·  Trie / DFS

**问题：** 给定板和词表，返回板上能找到的所有词。1 <= 板单元数 <= 12*12，1 <= len(words) <= 3*10^4。

**思路：** 用词构建 trie；从每个单元 DFS 并用 trie 剪枝。时间 O(单元数 * 4^L)。

**Python：**
```python
def find_words(board: list[list[str]], words: list[str]) -> list[str]:
    root: dict = {}
    for w in words:
        node = root
        for c in w:
            node = node.setdefault(c, {})
        node["$"] = w
    rows, cols = len(board), len(board[0])
    out: list[str] = []
    def dfs(r: int, c: int, node: dict) -> None:
        ch = board[r][c]
        nxt = node.get(ch)
        if nxt is None:
            return
        if "$" in nxt:
            out.append(nxt["$"]); del nxt["$"]
        board[r][c] = "#"
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and board[nr][nc] != "#":
                dfs(nr, nc, nxt)
        board[r][c] = ch
        if not nxt:
            del node[ch]
    for r in range(rows):
        for c in range(cols):
            dfs(r, c, root)
    return out
```

**TypeScript：**
```typescript
function findWords(board: string[][], words: string[]): string[] {
  type Node = { [k: string]: any; $?: string };
  const root: Node = {};
  for (const w of words) {
    let node: Node = root;
    for (const c of w) { if (!node[c]) node[c] = {}; node = node[c]; }
    node.$ = w;
  }
  const rows = board.length, cols = board[0].length;
  const out: string[] = [];
  const dfs = (r: number, c: number, node: Node): void => {
    const ch = board[r][c];
    const nxt = node[ch];
    if (!nxt) return;
    if (nxt.$) { out.push(nxt.$); delete nxt.$; }
    board[r][c] = "#";
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nc >= 0 && nr < rows && nc < cols && board[nr][nc] !== "#") dfs(nr, nc, nxt);
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
static class TrieNode {
    Map<Character, TrieNode> children = new HashMap<>();
    String word;
}

List<String> findWords(char[][] board, String[] words) {
    var root = new TrieNode();
    for (String w : words) {
        var node = root;
        for (char c : w.toCharArray()) node = node.children.computeIfAbsent(c, k -> new TrieNode());
        node.word = w;
    }
    var out = new ArrayList<String>();
    for (int r = 0; r < board.length; r++)
        for (int c = 0; c < board[0].length; c++) dfs(board, r, c, root, out);
    return out;
}

void dfs(char[][] b, int r, int c, TrieNode node, List<String> out) {
    if (r < 0 || c < 0 || r >= b.length || c >= b[0].length || b[r][c] == '#') return;
    char ch = b[r][c];
    var nxt = node.children.get(ch);
    if (nxt == null) return;
    if (nxt.word != null) { out.add(nxt.word); nxt.word = null; }
    b[r][c] = '#';
    dfs(b, r + 1, c, nxt, out); dfs(b, r - 1, c, nxt, out);
    dfs(b, r, c + 1, nxt, out); dfs(b, r, c - 1, nxt, out);
    b[r][c] = ch;
    if (nxt.children.isEmpty()) node.children.remove(ch);
}
```

**要点：**
- Trie 剪枝那些不可能到达任何词的路径。
- 匹配后移除单词标记以避免重复。
- 清理空 trie 分支可加速后续搜索。

---

### 86. Implement Trie  ·  中等  ·  Trie / 设计

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

### 87. Design Add and Search Words Data Structure  ·  中等  ·  Trie / DFS

**问题：** 支持 `addWord(w)` 和 `search(w)`，其中 `.` 匹配任意字母。1 <= 调用数 <= 10^4。

**思路：** Trie 加上对 `.` 分支到所有子节点的 DFS。添加 O(L)，搜索最坏 O(26^d * L)。

**Python：**
```python
class WordDictionary:
    def __init__(self) -> None:
        self.root: dict = {}

    def addWord(self, word: str) -> None:
        node = self.root
        for c in word:
            node = node.setdefault(c, {})
        node["$"] = True

    def search(self, word: str) -> bool:
        def dfs(node: dict, i: int) -> bool:
            if i == len(word):
                return "$" in node
            c = word[i]
            if c == ".":
                return any(k != "$" and dfs(node[k], i + 1) for k in node)
            return c in node and dfs(node[c], i + 1)
        return dfs(self.root, 0)
```

**TypeScript：**
```typescript
class WordDictionary {
  private root: { [k: string]: any } = {};
  addWord(word: string): void {
    let node = this.root;
    for (const c of word) { if (!node[c]) node[c] = {}; node = node[c]; }
    node.$ = true;
  }
  search(word: string): boolean {
    const dfs = (node: any, i: number): boolean => {
      if (i === word.length) return !!node.$;
      const c = word[i];
      if (c === ".") {
        for (const k of Object.keys(node)) if (k !== "$" && dfs(node[k], i + 1)) return true;
        return false;
      }
      return !!node[c] && dfs(node[c], i + 1);
    };
    return dfs(this.root, 0);
  }
}
```

**Java：**
```java
class WordDictionary {
    static class Node {
        Map<Character, Node> children = new HashMap<>();
        boolean end;
    }
    private final Node root = new Node();

    void addWord(String word) {
        var node = root;
        for (char c : word.toCharArray()) node = node.children.computeIfAbsent(c, k -> new Node());
        node.end = true;
    }
    boolean search(String word) { return dfs(root, word, 0); }
    private boolean dfs(Node node, String word, int i) {
        if (i == word.length()) return node.end;
        char c = word.charAt(i);
        if (c == '.') {
            for (var child : node.children.values()) if (dfs(child, word, i + 1)) return true;
            return false;
        }
        var nxt = node.children.get(c);
        return nxt != null && dfs(nxt, word, i + 1);
    }
}
```

**要点：**
- `.` 需要在所有子节点上分支。
- 遍历时跳过 `$` 终止键。
- 添加就是普通的 trie 插入。

---

### 88. Top K Frequent Elements  ·  中等  ·  堆 / 桶

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

### 89. Kth Largest Element in an Array  ·  中等  ·  堆 / 快速选择

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

### 90. Find Median from Data Stream  ·  困难  ·  堆 / 设计

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

### 91. Task Scheduler  ·  中等  ·  贪心 / 堆

**问题：** 给定任务列表和冷却时间 n，返回所需的最少时间槽数（空闲也计）。1 <= len(tasks) <= 10^4。

**思路：** 框架公式：(max_count - 1) * (n + 1) + ties；取与 len(tasks) 的较大值。时间 O(n)。

**Python：**
```python
def least_interval(tasks: list[str], n: int) -> int:
    from collections import Counter
    cnt = Counter(tasks)
    mx = max(cnt.values())
    ties = sum(1 for v in cnt.values() if v == mx)
    return max(len(tasks), (mx - 1) * (n + 1) + ties)
```

**TypeScript：**
```typescript
function leastInterval(tasks: string[], n: number): number {
  const cnt = new Map<string, number>();
  for (const t of tasks) cnt.set(t, (cnt.get(t) ?? 0) + 1);
  let mx = 0, ties = 0;
  for (const v of cnt.values()) if (v > mx) mx = v;
  for (const v of cnt.values()) if (v === mx) ties++;
  return Math.max(tasks.length, (mx - 1) * (n + 1) + ties);
}
```

**Java：**
```java
int leastInterval(char[] tasks, int n) {
    int[] cnt = new int[26];
    for (char t : tasks) cnt[t - 'A']++;
    int mx = 0, ties = 0;
    for (int v : cnt) if (v > mx) mx = v;
    for (int v : cnt) if (v == mx) ties++;
    return Math.max(tasks.length, (mx - 1) * (n + 1) + ties);
}
```

**要点：**
- 最频繁的任务决定整体布局。
- 并列项填入最后一个框架。
- 结果至少为任务总数。

---

### 92. Trapping Rain Water  ·  困难  ·  双指针

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

### 93. Sliding Window Maximum  ·  困难  ·  双端队列

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

### 94. Largest Rectangle in Histogram  ·  困难  ·  栈

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

### 95. Daily Temperatures  ·  中等  ·  栈

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

### 96. Min Stack  ·  中等  ·  栈 / 设计

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

### 97. Evaluate Reverse Polish Notation  ·  中等  ·  栈

**问题：** 求值后缀表达式，包含 `+ - * /`（整除向零截断）。1 <= len(tokens) <= 10^4。

**思路：** 操作数栈；遇到运算符就弹出两个并压回结果。时间 O(n)。

**Python：**
```python
def eval_rpn(tokens: list[str]) -> int:
    stack: list[int] = []
    for t in tokens:
        if t in "+-*/":
            b = stack.pop(); a = stack.pop()
            if t == "+": stack.append(a + b)
            elif t == "-": stack.append(a - b)
            elif t == "*": stack.append(a * b)
            else: stack.append(int(a / b))
        else:
            stack.append(int(t))
    return stack[0]
```

**TypeScript：**
```typescript
function evalRPN(tokens: string[]): number {
  const stack: number[] = [];
  for (const t of tokens) {
    if (t === "+" || t === "-" || t === "*" || t === "/") {
      const b = stack.pop()!, a = stack.pop()!;
      let r = 0;
      if (t === "+") r = a + b;
      else if (t === "-") r = a - b;
      else if (t === "*") r = a * b;
      else r = Math.trunc(a / b);
      stack.push(r);
    } else stack.push(parseInt(t, 10));
  }
  return stack[0];
}
```

**Java：**
```java
int evalRPN(String[] tokens) {
    var stack = new ArrayDeque<Integer>();
    for (String t : tokens) {
        switch (t) {
            case "+", "-", "*", "/" -> {
                int b = stack.pop(), a = stack.pop();
                stack.push(switch (t) {
                    case "+" -> a + b;
                    case "-" -> a - b;
                    case "*" -> a * b;
                    default -> a / b;
                });
            }
            default -> stack.push(Integer.parseInt(t));
        }
    }
    return stack.peek();
}
```

**要点：**
- 顺序要紧：第二次弹出的是左操作数。
- 对负商需向零截断（而非向下取整）。
- 最终栈恰好剩一个元素。

---

### 98. Largest Number  ·  中等  ·  贪心 / 排序

**问题：** 将非负整数排成最大的拼接数字。1 <= len <= 100，0 <= nums[i] <= 10^9。

**思路：** 用自定义比较器排序：`a + b > b + a`。时间 O(n log n)。

**Python：**
```python
from functools import cmp_to_key

def largest_number(nums: list[int]) -> str:
    arr = [str(x) for x in nums]
    arr.sort(key=cmp_to_key(lambda a, b: -1 if a + b > b + a else 1))
    res = "".join(arr)
    return "0" if res[0] == "0" else res
```

**TypeScript：**
```typescript
function largestNumber(nums: number[]): string {
  const arr = nums.map(String);
  arr.sort((a, b) => (b + a).localeCompare(a + b));
  const res = arr.join("");
  return res[0] === "0" ? "0" : res;
}
```

**Java：**
```java
String largestNumber(int[] nums) {
    String[] arr = new String[nums.length];
    for (int i = 0; i < nums.length; i++) arr[i] = String.valueOf(nums[i]);
    Arrays.sort(arr, (a, b) -> (b + a).compareTo(a + b));
    var sb = new StringBuilder();
    for (String s : arr) sb.append(s);
    return sb.charAt(0) == '0' ? "0" : sb.toString();
}
```

**要点：**
- 比较器比较拼接结果，而非数值。
- 若排序结果以 '0' 开头，答案就是 "0"。
- 拼接比较自然处理字符串长度差异。

---

### 99. Find First and Last Position of Element in Sorted Array  ·  中等  ·  二分查找

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

### 100. Median of Two Sorted Arrays  ·  困难  ·  二分查找

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
