# 小米（Xiaomi）

```yaml
company: 小米（Xiaomi）—— MIUI/HyperOS、米家 IoT、小米商城电商、智能手机、AIoT
typical_rounds: 2-3 轮技术面 + 1 轮 HR（算法 + 视岗位而定的 Android/嵌入式领域深挖）
focus_areas: 算法、Android 框架内部原理、嵌入式 C/IoT、高并发后端（秒杀）、系统设计
languages_allowed: Java/Kotlin（Android）、C/C++（嵌入式/IoT）、Python；算法轮可用任意主流语言
duration: 每轮 45-60 分钟
notable_quirks:
  - 客户端岗位深挖 Android 框架内部（Activity 生命周期、Binder IPC、Handler/Looper）
  - 设备/固件岗位深挖嵌入式 C 与 RTOS 基础
  - 后端岗位常考秒杀/抢购等高并发系统设计
  - 行为面试考查成本与效率的产品思维（性价比）
  - 软硬件快速发布节奏——看重务实、快速交付的工程师
  - "为发烧而生" 与 "感动人心、价格厚道" 的文化常被提及
sources: LeetCode Discuss（xiaomi 标签）、牛客网、一亩三分地、Glassdoor
```

## 概述

小米的面试在标准算法门槛之上，叠加了针对岗位的领域深挖：客户端面试深挖 Android 框架内部（生命周期、Binder、Handler/Looper、JVM/ART），设备岗位深挖嵌入式 C 与 RTOS，后端岗位深挖以小米商城秒杀/抢购和连接数亿设备的米家 AIoT 平台为核心的高并发设计。候选人常惊讶于这套流程更看重务实、低成本、快速交付的工程能力（"性价比" 思维），而非纯理论深度。客户端要多准备 Android 内部原理，设备岗要多准备嵌入式/RTOS，后端要多准备秒杀 + IoT 遥测系统设计；冷门算法可以少准备——算法门槛是扎实的 LeetCode 中等，而非竞赛级难题。

## 题目

### 1. 两数之和（Two Sum）

**难度：** 简单
**主题：** array, hash-table
**岗位：** Backend SWE
**级别：** L8-L9

**问题：** 给定整数数组 `nums` 和整数 `target`，返回和为 `target` 的两个数的下标。恰好存在一个解，且同一元素不能使用两次。

**思路：** 单次遍历，用哈希表记录 值 → 下标。对每个元素检查 `target - x` 是否已出现；若是则返回两个下标，否则存入当前值。时间 O(n)，空间 O(n)——严格优于 O(n^2) 暴力。

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
  Map<Integer, Integer> seen = new HashMap<>();
  for (int i = 0; i < nums.length; i++) {
    int need = target - nums[i];
    if (seen.containsKey(need)) return new int[] {seen.get(need), i};
    seen.put(nums[i], i);
  }
  return new int[] {};
}
```

**要点：**
- 哈希表把内层查找变为 O(1)，整体 O(n) 时间、O(n) 空间。
- 先检查再存入当前值，避免元素与自身配对。

**常见追问：**
- 返回所有不重复的数对（不止一个）——排序 + 双指针。
- 数组已排序——用双指针 O(1) 额外空间求解。
- 数字可重复且需要计数——用频次表。

**标签：** #algorithm

---

### 2. 买卖股票的最佳时机（Best Time to Buy and Sell Stock）

**难度：** 简单
**主题：** array, dynamic-programming
**岗位：** Backend SWE
**级别：** L8-L9

**问题：** 给定数组 `prices`，`prices[i]` 是第 `i` 天的价格，求一次买入后再卖出的最大利润；无利可图返回 0。

**思路：** 维护至今见过的最低价，以及"今天卖出"的最佳利润。单次遍历，O(n) 时间、O(1) 空间。至今最低价即任意后续卖出的最优买入日。

**Python：**
```python
def max_profit(prices: list[int]) -> int:
    min_price, best = float("inf"), 0
    for p in prices:
        min_price = min(min_price, p)
        best = max(best, p - min_price)
    return best
```

**TypeScript：**
```typescript
function maxProfit(prices: number[]): number {
  let minPrice = Infinity, best = 0;
  for (const p of prices) {
    minPrice = Math.min(minPrice, p);
    best = Math.max(best, p - minPrice);
  }
  return best;
}
```

**Java：**
```java
int maxProfit(int[] prices) {
  int minPrice = Integer.MAX_VALUE, best = 0;
  for (int p : prices) {
    minPrice = Math.min(minPrice, p);
    best = Math.max(best, p - minPrice);
  }
  return best;
}
```

**要点：**
- 单次遍历，O(n) 时间、O(1) 空间，无需嵌套循环。
- 维护至今最低价作为隐式的最优买入日。

**常见追问：**
- 允许无限次交易（买卖股票 II）——累加所有正差值。
- 最多 k 次交易——在 (天数, 交易次数) 上做 DP。
- 加入手续费或冷冻期——状态机 DP。

**标签：** #algorithm

---

### 3. 有效的字母异位词（Valid Anagram）

**难度：** 简单
**主题：** string, hash-table, counting
**岗位：** Backend SWE
**级别：** L8-L9

**问题：** 给定字符串 `s` 和 `t`，判断 `t` 是否为 `s` 的字母异位词（字符及频次相同）。

**思路：** 统计 `s` 的字符频次，再用 `t` 递减；所有计数最终须为零（且长度须相等）。时间 O(n)，固定字母表下空间 O(1)（一般情形为 O(k)）。

**Python：**
```python
from collections import Counter

def is_anagram(s: str, t: str) -> bool:
    return len(s) == len(t) and Counter(s) == Counter(t)
```

**TypeScript：**
```typescript
function isAnagram(s: string, t: string): boolean {
  if (s.length !== t.length) return false;
  const count = new Map<string, number>();
  for (const c of s) count.set(c, (count.get(c) ?? 0) + 1);
  for (const c of t) {
    const n = (count.get(c) ?? 0) - 1;
    if (n < 0) return false;
    count.set(c, n);
  }
  return true;
}
```

**Java：**
```java
boolean isAnagram(String s, String t) {
  if (s.length() != t.length()) return false;
  int[] count = new int[26];
  for (int i = 0; i < s.length(); i++) {
    count[s.charAt(i) - 'a']++;
    count[t.charAt(i) - 'a']--;
  }
  for (int c : count) if (c != 0) return false;
  return true;
}
```

**要点：**
- O(n) 时间；固定 26 字母表下 O(1) 空间。
- 先比长度可快速短路不等的输入。

**常见追问：**
- Unicode 输入——用哈希表替代定长数组。
- 把所有异位词分组——以排序后字符串或计数签名为键。
- 大小写不敏感 / 忽略空格——先归一化。

**标签：** #algorithm

---

### 4. 有效的括号（Valid Parentheses）

**难度：** 简单
**主题：** stack, string
**岗位：** Backend SWE
**级别：** L8-L9

**问题：** 给定只含 `()[]{}` 的字符串，判断括号是否按正确顺序开合。

**思路：** 压入左括号；遇右括号时栈顶须为其匹配左括号。最终栈空即平衡。时间 O(n)，空间 O(n)。

**Python：**
```python
def is_valid(s: str) -> bool:
    pairs = {")": "(", "]": "[", "}": "{"}
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
boolean isValid(String s) {
  Deque<Character> stack = new ArrayDeque<>();
  Map<Character, Character> pairs = Map.of(')', '(', ']', '[', '}', '{');
  for (char c : s.toCharArray()) {
    if (pairs.containsKey(c)) {
      if (stack.isEmpty() || stack.pop() != pairs.get(c)) return false;
    } else {
      stack.push(c);
    }
  }
  return stack.isEmpty();
}
```

**要点：**
- 栈带来 O(n) 时间、O(n) 空间。
- 遇右括号弹栈前先判空。

**常见追问：**
- 返回使其有效所需的最少插入/删除次数。
- 支持嵌套的通用开/闭标记或类 HTML 标签。
- 求最长有效括号子串的长度（DP/栈）。

**标签：** #algorithm

---

### 5. 合并两个有序链表（Merge Two Sorted Lists）

**难度：** 简单
**主题：** linked-list, two-pointer
**岗位：** Backend SWE
**级别：** L8-L9

**问题：** 将两个有序链表通过拼接节点合并为一个有序链表。

**思路：** 哑头，遍历两链表每步取较小节点，最后接上剩余尾部。时间 O(n + m)，空间 O(1)。

**Python：**
```python
class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val, self.next = val, next

def merge_two_lists(a: ListNode | None, b: ListNode | None) -> ListNode | None:
    dummy = tail = ListNode()
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
class ListNode {
  val: number; next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) { this.val = val; this.next = next; }
}

function mergeTwoLists(a: ListNode | null, b: ListNode | null): ListNode | null {
  const dummy = new ListNode();
  let tail = dummy;
  while (a && b) {
    if (a.val <= b.val) { tail.next = a; a = a.next; }
    else { tail.next = b; b = b.next; }
    tail = tail.next;
  }
  tail.next = a ?? b;
  return dummy.next;
}
```

**Java：**
```java
class ListNode { int val; ListNode next; ListNode(int v) { val = v; } }

ListNode mergeTwoLists(ListNode a, ListNode b) {
  ListNode dummy = new ListNode(0), tail = dummy;
  while (a != null && b != null) {
    if (a.val <= b.val) { tail.next = a; a = a.next; }
    else { tail.next = b; b = b.next; }
    tail = tail.next;
  }
  tail.next = (a != null) ? a : b;
  return dummy.next;
}
```

**要点：**
- 哑头免除首节点特判；O(n + m) 时间、O(1) 额外空间。
- 末尾一步接上非空剩余部分。

**常见追问：**
- 合并 k 个有序链表——最小堆或分治。
- 降序合并——翻转比较方向。
- 双向链表——还需修正 `prev` 指针。

**标签：** #algorithm

---

### 6. 最大子数组和（Maximum Subarray）

**难度：** 中等
**主题：** array, dynamic-programming, kadane
**岗位：** Backend SWE
**级别：** L8-L9

**问题：** 求和最大的连续子数组，并返回该和。

**思路：** Kadane 算法——维护"以当前结尾的最佳和"，当其低于当前元素时重置。同时记录全局最大值。时间 O(n)，空间 O(1)。

**Python：**
```python
def max_sub_array(nums: list[int]) -> int:
    best = cur = nums[0]
    for x in nums[1:]:
        cur = max(x, cur + x)
        best = max(best, cur)
    return best
```

**TypeScript：**
```typescript
function maxSubArray(nums: number[]): number {
  let best = nums[0], cur = nums[0];
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
  int best = nums[0], cur = nums[0];
  for (int i = 1; i < nums.length; i++) {
    cur = Math.max(nums[i], cur + nums[i]);
    best = Math.max(best, cur);
  }
  return best;
}
```

**要点：**
- Kadane O(n) 时间、O(1) 空间。
- 以首元素初始化，可正确处理全负数组。

**常见追问：**
- 返回子数组的下标，而不只是和。
- 最大乘积子数组——同时维护最小和最大（符号会翻转）。
- 环形数组变体——普通 Kadane 与"总和 - 最小子数组"结合。

**标签：** #algorithm

---

### 7. 盛最多水的容器（Container With Most Water）

**难度：** 中等
**主题：** array, two-pointer, greedy
**岗位：** Backend SWE
**级别：** L8-L9

**问题：** 给定高度 `height[i]`，选两条线与 x 轴构成容器使盛水最多，返回最大面积。

**思路：** 双指针置于两端；面积为 `min(h[l], h[r]) * (r - l)`。移动较矮一侧，因为它限制了高度。时间 O(n)，空间 O(1)。

**Python：**
```python
def max_area(height: list[int]) -> int:
    l, r, best = 0, len(height) - 1, 0
    while l < r:
        best = max(best, min(height[l], height[r]) * (r - l))
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
    best = Math.max(best, Math.min(height[l], height[r]) * (r - l));
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
    best = Math.max(best, Math.min(height[l], height[r]) * (r - l));
    if (height[l] < height[r]) l++; else r--;
  }
  return best;
}
```

**要点：**
- 双指针扫描 O(n) 时间、O(1) 空间，优于 O(n^2) 暴力。
- 始终移动较矮一侧——较高一侧在与较矮配对时永远无法增大面积。

**常见追问：**
- 接雨水——统计所有柱子上方蓄水量。
- 返回所选两条线的下标。
- 三维版本（接雨水 II）——从边界用最小堆。

**标签：** #algorithm

---

### 8. 三数之和（3Sum）

**难度：** 中等
**主题：** array, two-pointer, sorting
**岗位：** Backend SWE
**级别：** L8-L9

**问题：** 返回 `nums` 中所有和为零的不重复三元组 `[a, b, c]`。

**思路：** 排序后固定每个 `i`，对其余部分用双指针找 `-nums[i]`。在三个位置都跳过重复值。排序 O(n log n)，扫描 O(n^2)，整体 O(n^2) 时间、O(1) 额外空间（不含输出）。

**Python：**
```python
def three_sum(nums: list[int]) -> list[list[int]]:
    nums.sort()
    res: list[list[int]] = []
    for i in range(len(nums) - 2):
        if i > 0 and nums[i] == nums[i - 1]:
            continue
        l, r = i + 1, len(nums) - 1
        while l < r:
            s = nums[i] + nums[l] + nums[r]
            if s < 0:
                l += 1
            elif s > 0:
                r -= 1
            else:
                res.append([nums[i], nums[l], nums[r]])
                l += 1
                r -= 1
                while l < r and nums[l] == nums[l - 1]:
                    l += 1
                while l < r and nums[r] == nums[r + 1]:
                    r -= 1
    return res
```

**TypeScript：**
```typescript
function threeSum(nums: number[]): number[][] {
  nums.sort((a, b) => a - b);
  const res: number[][] = [];
  for (let i = 0; i < nums.length - 2; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue;
    let l = i + 1, r = nums.length - 1;
    while (l < r) {
      const s = nums[i] + nums[l] + nums[r];
      if (s < 0) l++;
      else if (s > 0) r--;
      else {
        res.push([nums[i], nums[l], nums[r]]);
        l++; r--;
        while (l < r && nums[l] === nums[l - 1]) l++;
        while (l < r && nums[r] === nums[r + 1]) r--;
      }
    }
  }
  return res;
}
```

**Java：**
```java
List<List<Integer>> threeSum(int[] nums) {
  Arrays.sort(nums);
  List<List<Integer>> res = new ArrayList<>();
  for (int i = 0; i < nums.length - 2; i++) {
    if (i > 0 && nums[i] == nums[i - 1]) continue;
    int l = i + 1, r = nums.length - 1;
    while (l < r) {
      int s = nums[i] + nums[l] + nums[r];
      if (s < 0) l++;
      else if (s > 0) r--;
      else {
        res.add(Arrays.asList(nums[i], nums[l], nums[r]));
        l++; r--;
        while (l < r && nums[l] == nums[l - 1]) l++;
        while (l < r && nums[r] == nums[r + 1]) r--;
      }
    }
  }
  return res;
}
```

**要点：**
- 排序使双指针扫描成为可能，整体 O(n^2) 时间。
- 在 i、l、r 处跳过重复值以保证三元组唯一。

**常见追问：**
- 最接近的三数之和——记录最接近 target 的和。
- 四数之和——再加一层外循环，O(n^3)。
- 统计和小于 target 的三元组数量，而非等于。

**标签：** #algorithm

---

### 9. 二分查找（Binary Search）

**难度：** 简单
**主题：** binary-search, array
**岗位：** Embedded Engineer
**级别：** L8-L9

**问题：** 给定升序排序数组 `nums` 与 `target`，返回其下标，不存在返回 -1。

**思路：** 维护 `[lo, hi]`，比较中点并每步舍弃一半。用 `lo + (hi - lo) // 2` 避免溢出。时间 O(log n)，空间 O(1)。

**Python：**
```python
def search(nums: list[int], target: int) -> int:
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = lo + (hi - lo) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
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
    const mid = lo + ((hi - lo) >> 1);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1; else hi = mid - 1;
  }
  return -1;
}
```

**Java：**
```java
int search(int[] nums, int target) {
  int lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    int mid = lo + (hi - lo) / 2;
    if (nums[mid] == target) return mid;
    if (nums[mid] < target) lo = mid + 1; else hi = mid - 1;
  }
  return -1;
}
```

**要点：**
- O(log n) 时间、O(1) 空间——每次迭代折半搜索区间。
- `lo + (hi - lo) / 2` 在大边界下避免整型溢出。

**常见追问：**
- 返回最左/最右插入位置（下界/上界）。
- 在旋转有序数组中查找。
- 在单调答案空间上二分（如最小容量）。

**标签：** #algorithm

---

### 10. 搜索旋转排序数组（Search in Rotated Sorted Array）

**难度：** 中等
**主题：** binary-search, array
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 一个有序数组在未知支点处旋转（值各异）。找出 `target` 的下标，不存在返回 -1。

**思路：** 改进的二分：每步必有一半有序。用 `nums[lo] <= nums[mid]` 判断哪半有序，再决定 target 是否落于其中。时间 O(log n)，空间 O(1)。

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
- 即便发生旋转，仍是 O(log n) 时间、O(1) 空间。
- 先识别有序的那一半，再判断 target 是否落在其中。

**常见追问：**
- 允许重复（搜索旋转排序数组 II）——最坏退化为 O(n)。
- 找最小值/旋转支点下标。
- 用二分找任意峰值元素。

**标签：** #algorithm

---

### 11. 无重复字符的最长子串（Longest Substring Without Repeating Characters）

**难度：** 中等
**主题：** string, sliding-window, hash-table
**岗位：** Backend SWE
**级别：** L8-L9

**问题：** 返回 `s` 中不含重复字符的最长子串的长度。

**思路：** 滑动窗口，用映射记录字符最后出现的下标。当重复字符落在窗口内，把左边界跳到其后。时间 O(n)，空间 O(min(n, 字母表))。

**Python：**
```python
def length_of_longest_substring(s: str) -> int:
    last: dict[str, int] = {}
    left = best = 0
    for right, c in enumerate(s):
        if c in last and last[c] >= left:
            left = last[c] + 1
        last[c] = right
        best = max(best, right - left + 1)
    return best
```

**TypeScript：**
```typescript
function lengthOfLongestSubstring(s: string): number {
  const last = new Map<string, number>();
  let left = 0, best = 0;
  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    if (last.has(c) && last.get(c)! >= left) left = last.get(c)! + 1;
    last.set(c, right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}
```

**Java：**
```java
int lengthOfLongestSubstring(String s) {
  Map<Character, Integer> last = new HashMap<>();
  int left = 0, best = 0;
  for (int right = 0; right < s.length(); right++) {
    char c = s.charAt(right);
    if (last.containsKey(c) && last.get(c) >= left) left = last.get(c) + 1;
    last.put(c, right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}
```

**要点：**
- 每个下标进出窗口各一次 → O(n) 时间。
- 最后出现下标表的空间为 O(min(n, 字母表))。

**标签：** #algorithm

---

### 12. 最小覆盖子串（Minimum Window Substring）

**难度：** 困难
**主题：** string, sliding-window, hash-table
**岗位：** Senior SWE
**级别：** L10-L11

**问题：** 给定字符串 `s` 和 `t`，返回 `s` 中包含 `t` 全部字符（含重数）的最小子串，若不存在返回 ""。

**思路：** 扩张右边界并统计所需字符；窗口一旦合法，就在保持合法的前提下从左收缩并记录最优。时间 O(n + m)，空间 O(字母表)。

**Python：**
```python
from collections import Counter

def min_window(s: str, t: str) -> str:
    if not t or not s:
        return ""
    need = Counter(t)
    missing = len(t)
    left = start = 0
    end = float("inf")
    for right, c in enumerate(s):
        if need[c] > 0:
            missing -= 1
        need[c] -= 1
        while missing == 0:
            if right - left < end - start:
                start, end = left, right
            need[s[left]] += 1
            if need[s[left]] > 0:
                missing += 1
            left += 1
    return "" if end == float("inf") else s[start:end + 1]
```

**TypeScript：**
```typescript
function minWindow(s: string, t: string): string {
  if (!s || !t) return "";
  const need = new Map<string, number>();
  for (const c of t) need.set(c, (need.get(c) ?? 0) + 1);
  let missing = t.length, left = 0, start = 0, end = Infinity;
  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    if ((need.get(c) ?? 0) > 0) missing--;
    need.set(c, (need.get(c) ?? 0) - 1);
    while (missing === 0) {
      if (right - left < end - start) { start = left; end = right; }
      const lc = s[left];
      need.set(lc, (need.get(lc) ?? 0) + 1);
      if ((need.get(lc) ?? 0) > 0) missing++;
      left++;
    }
  }
  return end === Infinity ? "" : s.slice(start, end + 1);
}
```

**Java：**
```java
String minWindow(String s, String t) {
  if (s.isEmpty() || t.isEmpty()) return "";
  int[] need = new int[128];
  for (char c : t.toCharArray()) need[c]++;
  int missing = t.length(), left = 0, start = 0, end = -1, best = Integer.MAX_VALUE;
  for (int right = 0; right < s.length(); right++) {
    if (need[s.charAt(right)]-- > 0) missing--;
    while (missing == 0) {
      if (right - left + 1 < best) { best = right - left + 1; start = left; end = right; }
      if (++need[s.charAt(left)] > 0) missing++;
      left++;
    }
  }
  return end == -1 ? "" : s.substring(start, end + 1);
}
```

**要点：**
- 每个字符至多加入和移出一次 → O(n + m) 时间。
- `missing` 计数器避免重扫 need 表来判断合法性。

**标签：** #algorithm

---

### 13. 除自身以外数组的乘积（Product of Array Except Self）

**难度：** 中等
**主题：** array, prefix-product
**岗位：** Backend SWE
**级别：** L8-L9

**问题：** 返回每个元素为其余所有元素乘积的数组，不用除法且 O(n) 完成。

**思路：** 两遍扫描——先从左到右把前缀乘积写入输出，再从右到左用一个滚动变量乘以后缀乘积。时间 O(n)，不含输出空间 O(1)。

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
  const n = nums.length, out = new Array(n).fill(1);
  for (let i = 1; i < n; i++) out[i] = out[i - 1] * nums[i - 1];
  let right = 1;
  for (let i = n - 1; i >= 0; i--) { out[i] *= right; right *= nums[i]; }
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
  for (int i = n - 1; i >= 0; i--) { out[i] *= right; right *= nums[i]; }
  return out;
}
```

**要点：**
- 两次线性扫描带来 O(n) 时间、O(1) 额外空间（不含输出）。
- 前缀放数组、后缀放标量——无需除法。

**标签：** #algorithm

---

### 14. 反转链表（Reverse Linked List）

**难度：** 简单
**主题：** linked-list
**岗位：** Embedded Engineer
**级别：** L8-L9

**问题：** 反转一个单链表并返回新头节点。

**思路：** 迭代翻转每个 `next` 指针，用 `prev` 记录最终成为新头。时间 O(n)，空间 O(1)。

**Python：**
```python
class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val, self.next = val, next

def reverse_list(head: ListNode | None) -> ListNode | None:
    prev = None
    while head:
        head.next, prev, head = prev, head, head.next
    return prev
```

**TypeScript：**
```typescript
class ListNode {
  val: number; next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) { this.val = val; this.next = next; }
}

function reverseList(head: ListNode | null): ListNode | null {
  let prev: ListNode | null = null;
  while (head) {
    const next = head.next;
    head.next = prev;
    prev = head;
    head = next;
  }
  return prev;
}
```

**Java：**
```java
class ListNode { int val; ListNode next; ListNode(int v) { val = v; } }

ListNode reverseList(ListNode head) {
  ListNode prev = null;
  while (head != null) {
    ListNode next = head.next;
    head.next = prev;
    prev = head;
    head = next;
  }
  return prev;
}
```

**要点：**
- 迭代反转 O(n) 时间、O(1) 空间。
- 覆盖指针前先保存 `next`，以免丢失余下部分。

**标签：** #algorithm

---

### 15. 环形链表（Linked List Cycle）

**难度：** 简单
**主题：** linked-list, two-pointer, floyd
**岗位：** Backend SWE
**级别：** L8-L9

**问题：** 判断单链表是否含环。

**思路：** Floyd 龟兔——慢指针走一步、快指针走两步；当且仅当有环时相遇。时间 O(n)，空间 O(1)。

**Python：**
```python
class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val, self.next = val, next

def has_cycle(head: ListNode | None) -> bool:
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
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
- Floyd 双指针判环，O(n) 时间、O(1) 空间。
- `fast`/`fast.next` 为空说明链表终止（无环）。

**标签：** #algorithm

---

### 16. 删除链表的倒数第 N 个节点（Remove Nth Node From End of List）

**难度：** 中等
**主题：** linked-list, two-pointer
**岗位：** Backend SWE
**级别：** L8-L9

**问题：** 删除单链表倒数第 n 个节点并返回头节点。

**思路：** 从哑头出发用双指针；`fast` 先走 n+1 步，再同步移动直到 `fast` 为空。`slow` 恰好停在目标前一个。单次遍历，O(n) 时间、O(1) 空间。

**Python：**
```python
class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val, self.next = val, next

def remove_nth_from_end(head: ListNode | None, n: int) -> ListNode | None:
    dummy = ListNode(0, head)
    fast = slow = dummy
    for _ in range(n + 1):
        fast = fast.next
    while fast:
        fast, slow = fast.next, slow.next
    slow.next = slow.next.next
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
  ListNode dummy = new ListNode(0);
  dummy.next = head;
  ListNode fast = dummy, slow = dummy;
  for (int i = 0; i < n + 1; i++) fast = fast.next;
  while (fast != null) { fast = fast.next; slow = slow.next; }
  slow.next = slow.next.next;
  return dummy.next;
}
```

**要点：**
- 固定 n+1 间隔的单次遍历，O(n) 时间、O(1) 空间。
- 哑头干净地处理删除真正首节点的情形。

**标签：** #algorithm

---

### 17. 合并 K 个升序链表（Merge k Sorted Lists）

**难度：** 困难
**主题：** linked-list, heap, divide-and-conquer
**岗位：** Senior SWE
**级别：** L10-L11

**问题：** 把 `k` 个有序链表合并为一个有序链表。

**思路：** 把每个链表的头按值入最小堆；反复弹出最小者并压入其后继。总节点数为 N 时，时间 O(N log k)，空间 O(k)。

**Python：**
```python
import heapq

class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val, self.next = val, next

def merge_k_lists(lists: list[ListNode | None]) -> ListNode | None:
    heap = [(node.val, i, node) for i, node in enumerate(lists) if node]
    heapq.heapify(heap)
    dummy = tail = ListNode()
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
  const nodes: ListNode[] = [];
  for (const l of lists) { let n = l; while (n) { nodes.push(n); n = n.next; } }
  nodes.sort((a, b) => a.val - b.val);
  const dummy = new ListNode();
  let tail = dummy;
  for (const n of nodes) { tail.next = n; tail = n; }
  tail.next = null;
  return dummy.next;
}
```

**Java：**
```java
ListNode mergeKLists(ListNode[] lists) {
  PriorityQueue<ListNode> pq = new PriorityQueue<>((a, b) -> a.val - b.val);
  for (ListNode l : lists) if (l != null) pq.offer(l);
  ListNode dummy = new ListNode(0), tail = dummy;
  while (!pq.isEmpty()) {
    ListNode node = pq.poll();
    tail.next = node;
    tail = node;
    if (node.next != null) pq.offer(node.next);
  }
  return dummy.next;
}
```

**要点：**
- 大小为 k 的堆带来 O(N log k) 时间、O(k) 空间。
- 分治两两合并也能达到同样的 O(N log k)。

**标签：** #algorithm

---

### 18. 翻转二叉树（Invert Binary Tree）

**难度：** 简单
**主题：** tree, recursion, dfs
**岗位：** Android Engineer
**级别：** L8-L9

**问题：** 翻转二叉树（交换每个节点的左右孩子）。

**思路：** 递归，在每个节点交换孩子。时间 O(n)，空间 O(h)（递归栈）。

**Python：**
```python
class TreeNode:
    def __init__(self, val: int = 0, left=None, right=None) -> None:
        self.val, self.left, self.right = val, left, right

def invert_tree(root: TreeNode | None) -> TreeNode | None:
    if root:
        root.left, root.right = invert_tree(root.right), invert_tree(root.left)
    return root
```

**TypeScript：**
```typescript
class TreeNode {
  val: number; left: TreeNode | null; right: TreeNode | null;
  constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val; this.left = left; this.right = right;
  }
}

function invertTree(root: TreeNode | null): TreeNode | null {
  if (!root) return null;
  [root.left, root.right] = [invertTree(root.right), invertTree(root.left)];
  return root;
}
```

**Java：**
```java
class TreeNode { int val; TreeNode left, right; TreeNode(int v) { val = v; } }

TreeNode invertTree(TreeNode root) {
  if (root == null) return null;
  TreeNode left = invertTree(root.left);
  root.left = invertTree(root.right);
  root.right = left;
  return root;
}
```

**要点：**
- 每个节点访问一次 → O(n) 时间。
- 递归深度为 O(h)，即树高。

**标签：** #algorithm

---

### 19. 二叉树的最大深度（Maximum Depth of Binary Tree）

**难度：** 简单
**主题：** tree, recursion, dfs
**岗位：** Android Engineer
**级别：** L8-L9

**问题：** 返回二叉树的最大深度（最长根到叶路径上的节点数）。

**思路：** 深度 = 1 + max(左深度, 右深度)；空树为 0。时间 O(n)，空间 O(h)。

**Python：**
```python
class TreeNode:
    def __init__(self, val: int = 0, left=None, right=None) -> None:
        self.val, self.left, self.right = val, left, right

def max_depth(root: TreeNode | None) -> int:
    if not root:
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
- O(n) 时间、递归 O(h) 空间。
- 空节点处的平凡基例让递推式简洁。

**标签：** #algorithm

---

### 20. 二叉树的层序遍历（Binary Tree Level Order Traversal）

**难度：** 中等
**主题：** tree, bfs, queue
**岗位：** Android Engineer
**级别：** L8-L9

**问题：** 按层（自顶向下、从左到右）返回节点值，结果为列表的列表。

**思路：** 用队列做 BFS；每轮外层迭代通过快照队列大小来处理一整层。时间 O(n)，空间 O(n)。

**Python：**
```python
from collections import deque

class TreeNode:
    def __init__(self, val: int = 0, left=None, right=None) -> None:
        self.val, self.left, self.right = val, left, right

def level_order(root: TreeNode | None) -> list[list[int]]:
    if not root:
        return []
    res, q = [], deque([root])
    while q:
        level = []
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
  let q: TreeNode[] = [root];
  while (q.length) {
    const level: number[] = [], next: TreeNode[] = [];
    for (const node of q) {
      level.push(node.val);
      if (node.left) next.push(node.left);
      if (node.right) next.push(node.right);
    }
    res.push(level);
    q = next;
  }
  return res;
}
```

**Java：**
```java
List<List<Integer>> levelOrder(TreeNode root) {
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
```

**要点：**
- BFS 每个节点访问一次 → O(n) 时间、O(n) 队列空间。
- 内层循环前先快照层大小，以区分各层。

**标签：** #algorithm

---

### 21. 验证二叉搜索树（Validate Binary Search Tree）

**难度：** 中等
**主题：** tree, dfs, bst
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 判断二叉树是否为合法 BST（左子树严格小、右子树严格大，递归成立）。

**思路：** DFS 携带开区间 `(low, high)`；每个节点须严格落于其中，孩子据此收窄区间。时间 O(n)，空间 O(h)。

**Python：**
```python
class TreeNode:
    def __init__(self, val: int = 0, left=None, right=None) -> None:
        self.val, self.left, self.right = val, left, right

def is_valid_bst(root: TreeNode | None) -> bool:
    def dfs(node, low, high) -> bool:
        if not node:
            return True
        if not (low < node.val < high):
            return False
        return dfs(node.left, low, node.val) and dfs(node.right, node.val, high)
    return dfs(root, float("-inf"), float("inf"))
```

**TypeScript：**
```typescript
function isValidBST(root: TreeNode | null): boolean {
  const dfs = (node: TreeNode | null, low: number, high: number): boolean => {
    if (!node) return true;
    if (node.val <= low || node.val >= high) return false;
    return dfs(node.left, low, node.val) && dfs(node.right, node.val, high);
  };
  return dfs(root, -Infinity, Infinity);
}
```

**Java：**
```java
boolean isValidBST(TreeNode root) {
  return dfs(root, Long.MIN_VALUE, Long.MAX_VALUE);
}

boolean dfs(TreeNode node, long low, long high) {
  if (node == null) return true;
  if (node.val <= low || node.val >= high) return false;
  return dfs(node.left, low, node.val) && dfs(node.right, node.val, high);
}
```

**要点：**
- 传区间的 DFS，O(n) 时间、O(h) 空间。
- 用严格边界与足够宽的初始区间处理极端值。

**标签：** #algorithm

---

### 22. 二叉树的最近公共祖先（Lowest Common Ancestor of a Binary Tree）

**难度：** 中等
**主题：** tree, dfs, recursion
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 给定二叉树和两个节点 `p`、`q`，返回它们的最近公共祖先。

**思路：** DFS：若节点等于 p/q 或在子树中找到则返回该节点。第一个左右都返回非空的节点即为 LCA。时间 O(n)，空间 O(h)。

**Python：**
```python
class TreeNode:
    def __init__(self, val: int = 0, left=None, right=None) -> None:
        self.val, self.left, self.right = val, left, right

def lca(root, p, q):
    if root is None or root is p or root is q:
        return root
    left = lca(root.left, p, q)
    right = lca(root.right, p, q)
    if left and right:
        return root
    return left or right
```

**TypeScript：**
```typescript
function lowestCommonAncestor(root: TreeNode | null, p: TreeNode, q: TreeNode): TreeNode | null {
  if (root === null || root === p || root === q) return root;
  const left = lowestCommonAncestor(root.left, p, q);
  const right = lowestCommonAncestor(root.right, p, q);
  if (left && right) return root;
  return left ?? right;
}
```

**Java：**
```java
TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
  if (root == null || root == p || root == q) return root;
  TreeNode left = lowestCommonAncestor(root.left, p, q);
  TreeNode right = lowestCommonAncestor(root.right, p, q);
  if (left != null && right != null) return root;
  return left != null ? left : right;
}
```

**要点：**
- 单次 DFS → O(n) 时间、O(h) 递归空间。
- 左右都非空说明 p 与 q 在此分叉 → 该节点即 LCA。

**标签：** #algorithm

---

### 23. 二叉树的序列化与反序列化（Serialize and Deserialize Binary Tree）

**难度：** 困难
**主题：** tree, dfs, design
**岗位：** Senior SWE
**级别：** L10-L11

**问题：** 设计二叉树的 `serialize` 与 `deserialize`，使结构能被精确重建。

**思路：** 前序 DFS，对空节点写 `#`；反序列化按同样的流递归消费。两个方向均为 O(n) 时间、O(n) 空间。

**Python：**
```python
class TreeNode:
    def __init__(self, val: int = 0, left=None, right=None) -> None:
        self.val, self.left, self.right = val, left, right

def serialize(root: TreeNode | None) -> str:
    out: list[str] = []
    def dfs(node):
        if not node:
            out.append("#")
            return
        out.append(str(node.val))
        dfs(node.left)
        dfs(node.right)
    dfs(root)
    return ",".join(out)

def deserialize(data: str) -> TreeNode | None:
    vals = iter(data.split(","))
    def build():
        v = next(vals)
        if v == "#":
            return None
        node = TreeNode(int(v))
        node.left = build()
        node.right = build()
        return node
    return build()
```

**TypeScript：**
```typescript
function serialize(root: TreeNode | null): string {
  const out: string[] = [];
  const dfs = (node: TreeNode | null) => {
    if (!node) { out.push("#"); return; }
    out.push(String(node.val));
    dfs(node.left);
    dfs(node.right);
  };
  dfs(root);
  return out.join(",");
}

function deserialize(data: string): TreeNode | null {
  const vals = data.split(",");
  let i = 0;
  const build = (): TreeNode | null => {
    const v = vals[i++];
    if (v === "#") return null;
    const node = new TreeNode(Number(v));
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
  dfsSer(root, sb);
  return sb.toString();
}

void dfsSer(TreeNode node, StringBuilder sb) {
  if (node == null) { sb.append("#,"); return; }
  sb.append(node.val).append(",");
  dfsSer(node.left, sb);
  dfsSer(node.right, sb);
}

private int idx;
TreeNode deserialize(String data) {
  idx = 0;
  return build(data.split(","));
}

TreeNode build(String[] vals) {
  String v = vals[idx++];
  if (v.equals("#")) return null;
  TreeNode node = new TreeNode(Integer.parseInt(v));
  node.left = build(vals);
  node.right = build(vals);
  return node;
}
```

**要点：**
- 带空标记的前序两个方向均为 O(n) 时间、O(n) 空间。
- 以相同前序消费流可无歧义地重建结构。

**标签：** #algorithm

---

### 24. 岛屿数量（Number of Islands）

**难度：** 中等
**主题：** graph, dfs, bfs, matrix
**岗位：** Backend SWE
**级别：** L8-L9

**问题：** 在由 `'1'`/`'0'` 构成的二维网格中，按 4 方向相邻统计 `'1'`（陆地）的连通块数量。

**思路：** 扫描网格；遇到未访问陆地就泛洪（DFS/BFS）淹没整座岛并计数加一。时间 O(行*列)，最坏空间 O(行*列)。

**Python：**
```python
def num_islands(grid: list[list[str]]) -> int:
    if not grid:
        return 0
    rows, cols = len(grid), len(grid[0])
    def sink(r, c):
        if 0 <= r < rows and 0 <= c < cols and grid[r][c] == "1":
            grid[r][c] = "0"
            sink(r + 1, c); sink(r - 1, c); sink(r, c + 1); sink(r, c - 1)
    count = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1":
                count += 1
                sink(r, c)
    return count
```

**TypeScript：**
```typescript
function numIslands(grid: string[][]): number {
  const rows = grid.length, cols = grid[0]?.length ?? 0;
  const sink = (r: number, c: number) => {
    if (r < 0 || c < 0 || r >= rows || c >= cols || grid[r][c] !== "1") return;
    grid[r][c] = "0";
    sink(r + 1, c); sink(r - 1, c); sink(r, c + 1); sink(r, c - 1);
  };
  let count = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (grid[r][c] === "1") { count++; sink(r, c); }
  return count;
}
```

**Java：**
```java
int numIslands(char[][] grid) {
  int rows = grid.length, cols = grid[0].length, count = 0;
  for (int r = 0; r < rows; r++)
    for (int c = 0; c < cols; c++)
      if (grid[r][c] == '1') { count++; sink(grid, r, c); }
  return count;
}

void sink(char[][] grid, int r, int c) {
  if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length || grid[r][c] != '1') return;
  grid[r][c] = '0';
  sink(grid, r + 1, c); sink(grid, r - 1, c); sink(grid, r, c + 1); sink(grid, r, c - 1);
}
```

**要点：**
- 每个格子访问一次 → O(行*列) 时间。
- 递归/队列深度最坏为 O(行*列)（一整座大岛）。

**标签：** #algorithm

---

### 25. 克隆图（Clone Graph）

**难度：** 中等
**主题：** graph, dfs, bfs, hash-table
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 给定连通无向图的一个节点引用，深拷贝整张图；每个节点含值和邻居列表。

**思路：** DFS/BFS 配合 原节点 → 克隆 的映射，避免重复克隆并处理环。时间 O(V + E)，空间 O(V)。

**Python：**
```python
class Node:
    def __init__(self, val: int = 0, neighbors=None) -> None:
        self.val = val
        self.neighbors = neighbors or []

def clone_graph(node: "Node | None") -> "Node | None":
    if not node:
        return None
    clones: dict[Node, Node] = {}
    def dfs(n: Node) -> Node:
        if n in clones:
            return clones[n]
        copy = Node(n.val)
        clones[n] = copy
        copy.neighbors = [dfs(nb) for nb in n.neighbors]
        return copy
    return dfs(node)
```

**TypeScript：**
```typescript
class GNode {
  val: number; neighbors: GNode[];
  constructor(val = 0, neighbors: GNode[] = []) { this.val = val; this.neighbors = neighbors; }
}

function cloneGraph(node: GNode | null): GNode | null {
  if (!node) return null;
  const clones = new Map<GNode, GNode>();
  const dfs = (n: GNode): GNode => {
    if (clones.has(n)) return clones.get(n)!;
    const copy = new GNode(n.val);
    clones.set(n, copy);
    copy.neighbors = n.neighbors.map(dfs);
    return copy;
  };
  return dfs(node);
}
```

**Java：**
```java
class Node { int val; List<Node> neighbors = new ArrayList<>(); Node(int v) { val = v; } }

Node cloneGraph(Node node) {
  if (node == null) return null;
  Map<Node, Node> clones = new HashMap<>();
  return dfs(node, clones);
}

Node dfs(Node n, Map<Node, Node> clones) {
  if (clones.containsKey(n)) return clones.get(n);
  Node copy = new Node(n.val);
  clones.put(n, copy);
  for (Node nb : n.neighbors) copy.neighbors.add(dfs(nb, clones));
  return copy;
}
```

**要点：**
- 每个节点与每条边各访问一次 → O(V + E) 时间。
- 已访问映射（O(V) 空间）防止在环上无限循环。

**标签：** #algorithm

---

### 26. 课程表（Course Schedule）

**难度：** 中等
**主题：** graph, topological-sort, bfs
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 给定 `numCourses` 和先修对 `[a, b]`（b 先于 a），判断能否修完所有课程（即图无环）。

**思路：** Kahn 算法——建入度，把入度为零的节点入队，反复移除。若全部移除则无环。时间 O(V + E)，空间 O(V + E)。

**Python：**
```python
from collections import deque

def can_finish(num_courses: int, prerequisites: list[list[int]]) -> bool:
    graph = [[] for _ in range(num_courses)]
    indeg = [0] * num_courses
    for a, b in prerequisites:
        graph[b].append(a)
        indeg[a] += 1
    q = deque(i for i in range(num_courses) if indeg[i] == 0)
    seen = 0
    while q:
        node = q.popleft()
        seen += 1
        for nxt in graph[node]:
            indeg[nxt] -= 1
            if indeg[nxt] == 0:
                q.append(nxt)
    return seen == num_courses
```

**TypeScript：**
```typescript
function canFinish(numCourses: number, prerequisites: number[][]): boolean {
  const graph: number[][] = Array.from({ length: numCourses }, () => []);
  const indeg = new Array(numCourses).fill(0);
  for (const [a, b] of prerequisites) { graph[b].push(a); indeg[a]++; }
  const q: number[] = [];
  for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) q.push(i);
  let seen = 0;
  while (q.length) {
    const node = q.shift()!;
    seen++;
    for (const nxt of graph[node]) if (--indeg[nxt] === 0) q.push(nxt);
  }
  return seen === numCourses;
}
```

**Java：**
```java
boolean canFinish(int numCourses, int[][] prerequisites) {
  List<List<Integer>> graph = new ArrayList<>();
  for (int i = 0; i < numCourses; i++) graph.add(new ArrayList<>());
  int[] indeg = new int[numCourses];
  for (int[] p : prerequisites) { graph.get(p[1]).add(p[0]); indeg[p[0]]++; }
  Queue<Integer> q = new LinkedList<>();
  for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) q.offer(i);
  int seen = 0;
  while (!q.isEmpty()) {
    int node = q.poll();
    seen++;
    for (int nxt : graph.get(node)) if (--indeg[nxt] == 0) q.offer(nxt);
  }
  return seen == numCourses;
}
```

**要点：**
- Kahn 拓扑排序，O(V + E) 时间与空间。
- 存在环时仍有节点入度大于零，故 `seen < numCourses`。

**标签：** #algorithm

---

### 27. 单词搜索（Word Search）

**难度：** 中等
**主题：** backtracking, dfs, matrix
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 给定字母网格和 `word`，判断能否经相邻（4 方向）格子且不重用格子拼出该词。

**思路：** 从每个格子 DFS 回溯，临时标记已访问格子并在返回时还原。时间 O(行*列*4^L)，词长 L 时递归空间 O(L)。

**Python：**
```python
def exist(board: list[list[str]], word: str) -> bool:
    rows, cols = len(board), len(board[0])
    def dfs(r, c, i) -> bool:
        if i == len(word):
            return True
        if r < 0 or c < 0 or r >= rows or c >= cols or board[r][c] != word[i]:
            return False
        board[r][c] = "#"
        found = (dfs(r + 1, c, i + 1) or dfs(r - 1, c, i + 1) or
                 dfs(r, c + 1, i + 1) or dfs(r, c - 1, i + 1))
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
    if (r < 0 || c < 0 || r >= rows || c >= cols || board[r][c] !== word[i]) return false;
    const tmp = board[r][c];
    board[r][c] = "#";
    const found = dfs(r + 1, c, i + 1) || dfs(r - 1, c, i + 1) ||
                  dfs(r, c + 1, i + 1) || dfs(r, c - 1, i + 1);
    board[r][c] = tmp;
    return found;
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

boolean dfs(char[][] board, String word, int r, int c, int i) {
  if (i == word.length()) return true;
  if (r < 0 || c < 0 || r >= board.length || c >= board[0].length || board[r][c] != word.charAt(i))
    return false;
  char tmp = board[r][c];
  board[r][c] = '#';
  boolean found = dfs(board, word, r + 1, c, i + 1) || dfs(board, word, r - 1, c, i + 1)
               || dfs(board, word, r, c + 1, i + 1) || dfs(board, word, r, c - 1, i + 1);
  board[r][c] = tmp;
  return found;
}
```

**要点：**
- 最坏 O(行*列*4^L) 时间；递归深度 O(L)。
- 临时标记格子防止同一路径内重用。

**标签：** #algorithm

---

### 28. 爬楼梯（Climbing Stairs）

**难度：** 简单
**主题：** dynamic-programming, fibonacci
**岗位：** Embedded Engineer
**级别：** L8-L9

**问题：** 每次可爬 1 或 2 级，爬 `n` 级楼梯有多少种不同方法？

**思路：** 斐波那契递推 `f(n) = f(n-1) + f(n-2)`，用两个滚动变量。时间 O(n)，空间 O(1)。

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
- 滚动变量使其 O(n) 时间、O(1) 空间。
- 本质是斐波那契数列。

**标签：** #algorithm

---

### 29. 零钱兑换（Coin Change）

**难度：** 中等
**主题：** dynamic-programming, unbounded-knapsack
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 给定硬币面额与 `amount`，返回凑成该金额所需的最少硬币数，无法凑成返回 -1。

**思路：** 自底向上 DP，`dp[x]` 为金额 `x` 的最少硬币数，对每个硬币松弛。时间 O(amount * 硬币数)，空间 O(amount)。

**Python：**
```python
def coin_change(coins: list[int], amount: int) -> int:
    dp = [0] + [float("inf")] * amount
    for x in range(1, amount + 1):
        for c in coins:
            if c <= x:
                dp[x] = min(dp[x], dp[x - c] + 1)
    return -1 if dp[amount] == float("inf") else dp[amount]
```

**TypeScript：**
```typescript
function coinChange(coins: number[], amount: number): number {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let x = 1; x <= amount; x++)
    for (const c of coins)
      if (c <= x) dp[x] = Math.min(dp[x], dp[x - c] + 1);
  return dp[amount] === Infinity ? -1 : dp[amount];
}
```

**Java：**
```java
int coinChange(int[] coins, int amount) {
  int[] dp = new int[amount + 1];
  Arrays.fill(dp, amount + 1);
  dp[0] = 0;
  for (int x = 1; x <= amount; x++)
    for (int c : coins)
      if (c <= x) dp[x] = Math.min(dp[x], dp[x - c] + 1);
  return dp[amount] > amount ? -1 : dp[amount];
}
```

**要点：**
- O(amount * 硬币种数) 时间、O(amount) 空间。
- 完全背包：硬币可重复使用，故金额由内向外递推。

**标签：** #algorithm

---

### 30. 最长递增子序列（Longest Increasing Subsequence）

**难度：** 中等
**主题：** dynamic-programming, binary-search
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 返回 `nums` 中最长严格递增子序列的长度。

**思路：** 耐心排序——维护 `tails`，`tails[i]` 为长度 i+1 的递增子序列的最小尾值；对每个值二分查找插入位置。时间 O(n log n)，空间 O(n)。

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
- 二分查找 tails 数组实现 O(n log n) 时间、O(n) 空间。
- O(n^2) 的 DP 更简单但更慢；两者都可提及。

**标签：** #algorithm

---

### 31. 打家劫舍（House Robber）

**难度：** 中等
**主题：** dynamic-programming
**岗位：** Backend SWE
**级别：** L8-L9

**问题：** 给定非负的房屋金额，在不偷相邻两户的前提下最大化总金额。

**思路：** DP `rob(i) = max(跳过 i, value[i] + rob(i-2))`，用两个滚动变量。时间 O(n)，空间 O(1)。

**Python：**
```python
def rob(nums: list[int]) -> int:
    prev = cur = 0
    for x in nums:
        prev, cur = cur, max(cur, prev + x)
    return cur
```

**TypeScript：**
```typescript
function rob(nums: number[]): number {
  let prev = 0, cur = 0;
  for (const x of nums) { const t = Math.max(cur, prev + x); prev = cur; cur = t; }
  return cur;
}
```

**Java：**
```java
int rob(int[] nums) {
  int prev = 0, cur = 0;
  for (int x : nums) { int t = Math.max(cur, prev + x); prev = cur; cur = t; }
  return cur;
}
```

**要点：**
- 两个滚动值实现 O(n) 时间、O(1) 空间。
- 每户要么偷（接 i-2），要么跳过（保留 i-1）。

**标签：** #algorithm

---

### 32. 单词拆分（Word Break）

**难度：** 中等
**主题：** dynamic-programming, string, hash-table
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 给定字符串 `s` 和字典 `wordDict`，判断 `s` 能否拆分为空格分隔的字典单词序列。

**思路：** DP，`dp[i]` 为 `s[:i]` 是否可拆分；对每个 i，检查存在切分点 j 使 `dp[j]` 为真且 `s[j:i]` 在集合中。时间 O(n^2)（再乘以单词长度的查找），空间 O(n)。

**Python：**
```python
def word_break(s: str, word_dict: list[str]) -> bool:
    words = set(word_dict)
    dp = [True] + [False] * len(s)
    for i in range(1, len(s) + 1):
        for j in range(i):
            if dp[j] and s[j:i] in words:
                dp[i] = True
                break
    return dp[len(s)]
```

**TypeScript：**
```typescript
function wordBreak(s: string, wordDict: string[]): boolean {
  const words = new Set(wordDict);
  const dp = new Array(s.length + 1).fill(false);
  dp[0] = true;
  for (let i = 1; i <= s.length; i++) {
    for (let j = 0; j < i; j++) {
      if (dp[j] && words.has(s.slice(j, i))) { dp[i] = true; break; }
    }
  }
  return dp[s.length];
}
```

**Java：**
```java
boolean wordBreak(String s, List<String> wordDict) {
  Set<String> words = new HashSet<>(wordDict);
  boolean[] dp = new boolean[s.length() + 1];
  dp[0] = true;
  for (int i = 1; i <= s.length(); i++) {
    for (int j = 0; j < i; j++) {
      if (dp[j] && words.contains(s.substring(j, i))) { dp[i] = true; break; }
    }
  }
  return dp[s.length()];
}
```

**要点：**
- O(n^2) 次子串检查（集合查找平均 O(L)），O(n) 空间。
- `dp[0] = true` 把空前缀作为可拆分的起点。

**标签：** #algorithm

---

### 33. 无向图中连通分量的数目（Number of Connected Components in an Undirected Graph）

**难度：** 中等
**主题：** union-find, graph, dsu
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 给定标号 `0..n-1` 的 `n` 个节点和边列表，返回连通分量数。

**思路：** 并查集，带路径压缩与按秩合并；初始为 `n` 个分量，每次成功合并减一。近线性时间 O((n + e) α(n))，空间 O(n)。

**Python：**
```python
def count_components(n: int, edges: list[list[int]]) -> int:
    parent = list(range(n))
    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    count = n
    for a, b in edges:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb
            count -= 1
    return count
```

**TypeScript：**
```typescript
function countComponents(n: number, edges: number[][]): number {
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  };
  let count = n;
  for (const [a, b] of edges) {
    const ra = find(a), rb = find(b);
    if (ra !== rb) { parent[ra] = rb; count--; }
  }
  return count;
}
```

**Java：**
```java
int countComponents(int n, int[][] edges) {
  int[] parent = new int[n];
  for (int i = 0; i < n; i++) parent[i] = i;
  int count = n;
  for (int[] e : edges) {
    int ra = find(parent, e[0]), rb = find(parent, e[1]);
    if (ra != rb) { parent[ra] = rb; count--; }
  }
  return count;
}

int find(int[] parent, int x) {
  while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
  return x;
}
```

**要点：**
- 路径压缩使查找近似 O(α(n)) → 整体 O((n + e) α(n)) 时间。
- 分量从 n 开始，每合并两个不同根减一。

**标签：** #algorithm

---

### 34. 编辑距离（Edit Distance）

**难度：** 困难
**主题：** dynamic-programming, string
**岗位：** Senior SWE
**级别：** L10-L11

**问题：** 返回把 `word1` 变为 `word2` 所需的最少插入/删除/替换操作数。

**思路：** 二维 DP，`dp[i][j]` 为前缀的编辑距离；字符相等取对角，否则 1 + min(插入, 删除, 替换)。时间 O(n*m)，空间 O(n*m)（可降至 O(min(n,m))）。

**Python：**
```python
def min_distance(word1: str, word2: str) -> int:
    n, m = len(word1), len(word2)
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        dp[i][0] = i
    for j in range(m + 1):
        dp[0][j] = j
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            if word1[i - 1] == word2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    return dp[n][m]
```

**TypeScript：**
```typescript
function minDistance(word1: string, word2: string): number {
  const n = word1.length, m = word2.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (word1[i - 1] === word2[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[n][m];
}
```

**Java：**
```java
int minDistance(String word1, String word2) {
  int n = word1.length(), m = word2.length();
  int[][] dp = new int[n + 1][m + 1];
  for (int i = 0; i <= n; i++) dp[i][0] = i;
  for (int j = 0; j <= m; j++) dp[0][j] = j;
  for (int i = 1; i <= n; i++) {
    for (int j = 1; j <= m; j++) {
      if (word1.charAt(i - 1) == word2.charAt(j - 1)) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], Math.min(dp[i - 1][j], dp[i][j - 1]));
    }
  }
  return dp[n][m];
}
```

**要点：**
- 经典 O(n*m) 时间、O(n*m) 空间 DP（滚动行可降至 O(min(n,m))）。
- 三个转移分别对应删除、插入、替换。

**标签：** #algorithm

---

### 35. 子集（Subsets）

**难度：** 中等
**主题：** backtracking, bit-manipulation
**岗位：** Backend SWE
**级别：** L8-L9

**问题：** 返回一组互异整数的所有子集（幂集）。

**思路：** 回溯——每个下标选择"包含或跳过"，记录当前子集。时间 O(n * 2^n)，递归空间 O(n) 加输出。

**Python：**
```python
def subsets(nums: list[int]) -> list[list[int]]:
    res: list[list[int]] = []
    def backtrack(start: int, path: list[int]) -> None:
        res.append(path[:])
        for i in range(start, len(nums)):
            path.append(nums[i])
            backtrack(i + 1, path)
            path.pop()
    backtrack(0, [])
    return res
```

**TypeScript：**
```typescript
function subsets(nums: number[]): number[][] {
  const res: number[][] = [];
  const backtrack = (start: number, path: number[]) => {
    res.push([...path]);
    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]);
      backtrack(i + 1, path);
      path.pop();
    }
  };
  backtrack(0, []);
  return res;
}
```

**Java：**
```java
List<List<Integer>> subsets(int[] nums) {
  List<List<Integer>> res = new ArrayList<>();
  backtrack(nums, 0, new ArrayList<>(), res);
  return res;
}

void backtrack(int[] nums, int start, List<Integer> path, List<List<Integer>> res) {
  res.add(new ArrayList<>(path));
  for (int i = start; i < nums.length; i++) {
    path.add(nums[i]);
    backtrack(nums, i + 1, path, res);
    path.remove(path.size() - 1);
  }
}
```

**要点：**
- 2^n 个子集、每个长度至多 n → O(n * 2^n) 时间。
- 用 0..2^n-1 的位掩码是等价的迭代写法。

**标签：** #algorithm

---

### 36. 全排列（Permutations）

**难度：** 中等
**主题：** backtracking
**岗位：** Backend SWE
**级别：** L8-L9

**问题：** 返回一组互异整数的所有排列。

**思路：** 回溯，用 `used` 标记（或原地交换）；每层深度固定一个元素。时间 O(n * n!)，递归空间 O(n) 加输出。

**Python：**
```python
def permute(nums: list[int]) -> list[list[int]]:
    res: list[list[int]] = []
    used = [False] * len(nums)
    def backtrack(path: list[int]) -> None:
        if len(path) == len(nums):
            res.append(path[:])
            return
        for i, x in enumerate(nums):
            if used[i]:
                continue
            used[i] = True
            path.append(x)
            backtrack(path)
            path.pop()
            used[i] = False
    backtrack([])
    return res
```

**TypeScript：**
```typescript
function permute(nums: number[]): number[][] {
  const res: number[][] = [];
  const used = new Array(nums.length).fill(false);
  const backtrack = (path: number[]) => {
    if (path.length === nums.length) { res.push([...path]); return; }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      path.push(nums[i]);
      backtrack(path);
      path.pop();
      used[i] = false;
    }
  };
  backtrack([]);
  return res;
}
```

**Java：**
```java
List<List<Integer>> permute(int[] nums) {
  List<List<Integer>> res = new ArrayList<>();
  backtrack(nums, new boolean[nums.length], new ArrayList<>(), res);
  return res;
}

void backtrack(int[] nums, boolean[] used, List<Integer> path, List<List<Integer>> res) {
  if (path.size() == nums.length) { res.add(new ArrayList<>(path)); return; }
  for (int i = 0; i < nums.length; i++) {
    if (used[i]) continue;
    used[i] = true;
    path.add(nums[i]);
    backtrack(nums, used, path, res);
    path.remove(path.size() - 1);
    used[i] = false;
  }
}
```

**要点：**
- n! 个排列、每个 O(n) 构建 → O(n * n!) 时间。
- `used` 数组保证每个元素在一个排列中只出现一次。

**标签：** #algorithm

---

### 37. 组合总和（Combination Sum）

**难度：** 中等
**主题：** backtracking, dfs
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 给定互异正整数 `candidates` 和 `target`，返回所有和为 target 的不重复组合；每个候选可无限次复用。

**思路：** 回溯，用起始下标避免排列式重复；因允许重复，复用同一下标；当剩余 target 变负时剪枝。最坏时间 O(2^t)，递归空间 O(t)。

**Python：**
```python
def combination_sum(candidates: list[int], target: int) -> list[list[int]]:
    res: list[list[int]] = []
    def backtrack(start: int, remain: int, path: list[int]) -> None:
        if remain == 0:
            res.append(path[:])
            return
        for i in range(start, len(candidates)):
            if candidates[i] <= remain:
                path.append(candidates[i])
                backtrack(i, remain - candidates[i], path)
                path.pop()
    backtrack(0, target, [])
    return res
```

**TypeScript：**
```typescript
function combinationSum(candidates: number[], target: number): number[][] {
  const res: number[][] = [];
  const backtrack = (start: number, remain: number, path: number[]) => {
    if (remain === 0) { res.push([...path]); return; }
    for (let i = start; i < candidates.length; i++) {
      if (candidates[i] <= remain) {
        path.push(candidates[i]);
        backtrack(i, remain - candidates[i], path);
        path.pop();
      }
    }
  };
  backtrack(0, target, []);
  return res;
}
```

**Java：**
```java
List<List<Integer>> combinationSum(int[] candidates, int target) {
  List<List<Integer>> res = new ArrayList<>();
  backtrack(candidates, 0, target, new ArrayList<>(), res);
  return res;
}

void backtrack(int[] cand, int start, int remain, List<Integer> path, List<List<Integer>> res) {
  if (remain == 0) { res.add(new ArrayList<>(path)); return; }
  for (int i = start; i < cand.length; i++) {
    if (cand[i] <= remain) {
      path.add(cand[i]);
      backtrack(cand, i, remain - cand[i], path, res);
      path.remove(path.size() - 1);
    }
  }
}
```

**要点：**
- 最坏指数级 O(2^target)；递归深度 O(target)。
- 传 `i`（而非 `i+1`）允许复用候选；起始下标阻止重复集合。

**标签：** #algorithm

---

### 38. 数组中的第 K 个最大元素（Kth Largest Element in an Array）

**难度：** 中等
**主题：** heap, quickselect, sorting
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 返回无序数组中第 k 大的元素。

**思路：** 维护大小为 k 的最小堆，存放最大的 k 个；堆顶即答案。时间 O(n log k)，空间 O(k)。（快速选择平均 O(n)。）

**Python：**
```python
import heapq

def find_kth_largest(nums: list[int], k: int) -> int:
    heap = nums[:k]
    heapq.heapify(heap)
    for x in nums[k:]:
        if x > heap[0]:
            heapq.heapreplace(heap, x)
    return heap[0]
```

**TypeScript：**
```typescript
function findKthLargest(nums: number[], k: number): number {
  // Simple, correct: sort descending and index. O(n log n).
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
- 大小为 k 的最小堆带来 O(n log k) 时间、O(k) 空间。
- 快速选择平均 O(n)，但无随机支点时最坏 O(n^2)。

**标签：** #algorithm

---

### 39. 前 K 个高频元素（Top K Frequent Elements）

**难度：** 中等
**主题：** heap, hash-table, bucket-sort
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 返回 `nums` 中出现频率最高的 `k` 个元素。

**思路：** 统计频次，再按频次分桶（下标 = 次数）并从高端收集。计数 + 分桶为 O(n) 时间、O(n) 空间。

**Python：**
```python
from collections import Counter

def top_k_frequent(nums: list[int], k: int) -> list[int]:
    freq = Counter(nums)
    buckets: list[list[int]] = [[] for _ in range(len(nums) + 1)]
    for val, c in freq.items():
        buckets[c].append(val)
    res: list[int] = []
    for c in range(len(buckets) - 1, 0, -1):
        for val in buckets[c]:
            res.append(val)
            if len(res) == k:
                return res
    return res
```

**TypeScript：**
```typescript
function topKFrequent(nums: number[], k: number): number[] {
  const freq = new Map<number, number>();
  for (const x of nums) freq.set(x, (freq.get(x) ?? 0) + 1);
  const buckets: number[][] = Array.from({ length: nums.length + 1 }, () => []);
  for (const [val, c] of freq) buckets[c].push(val);
  const res: number[] = [];
  for (let c = buckets.length - 1; c > 0 && res.length < k; c--)
    for (const val of buckets[c]) { res.push(val); if (res.length === k) return res; }
  return res;
}
```

**Java：**
```java
int[] topKFrequent(int[] nums, int k) {
  Map<Integer, Integer> freq = new HashMap<>();
  for (int x : nums) freq.merge(x, 1, Integer::sum);
  List<Integer>[] buckets = new List[nums.length + 1];
  for (var e : freq.entrySet()) {
    int c = e.getValue();
    if (buckets[c] == null) buckets[c] = new ArrayList<>();
    buckets[c].add(e.getKey());
  }
  int[] res = new int[k];
  int idx = 0;
  for (int c = buckets.length - 1; c > 0 && idx < k; c--)
    if (buckets[c] != null)
      for (int val : buckets[c]) { res[idx++] = val; if (idx == k) return res; }
  return res;
}
```

**要点：**
- 按频次桶排序实现 O(n) 时间、O(n) 空间。
- 大小为 k 的堆是 O(n log k) 的替代方案。

**标签：** #algorithm

---

### 40. 合并区间（Merge Intervals）

**难度：** 中等
**主题：** intervals, sorting
**岗位：** Backend SWE
**级别：** L8-L9

**问题：** 给定区间 `[start, end]`，合并所有重叠区间。

**思路：** 按起点排序后扫描——下一个与上一个合并区间重叠时延展，否则追加。时间 O(n log n)（排序主导），空间 O(n)。

**Python：**
```python
def merge(intervals: list[list[int]]) -> list[list[int]]:
    intervals.sort()
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
int[][] merge(int[][] intervals) {
  Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
  List<int[]> out = new ArrayList<>();
  for (int[] iv : intervals) {
    if (!out.isEmpty() && iv[0] <= out.get(out.size() - 1)[1]) {
      out.get(out.size() - 1)[1] = Math.max(out.get(out.size() - 1)[1], iv[1]);
    } else {
      out.add(iv);
    }
  }
  return out.toArray(new int[0][]);
}
```

**要点：**
- 排序主导 → O(n log n) 时间、O(n) 输出空间。
- 排序后一次线性扫描即可合并重叠。

**标签：** #algorithm

---

### 41. 实现前缀树（Implement Trie）

**难度：** 中等
**主题：** trie, design, string
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 实现支持 `insert(word)`、`search(word)`、`startsWith(prefix)` 的前缀树。

**思路：** 每个节点含子链接与词尾标记；按字符遍历/创建。每个操作为 O(L)（词长 L）；空间 O(已插入字符总数)。

**Python：**
```python
class Trie:
    def __init__(self) -> None:
        self.children: dict[str, "Trie"] = {}
        self.is_end = False

    def insert(self, word: str) -> None:
        node = self
        for c in word:
            node = node.children.setdefault(c, Trie())
        node.is_end = True

    def search(self, word: str) -> bool:
        node = self._find(word)
        return node is not None and node.is_end

    def starts_with(self, prefix: str) -> bool:
        return self._find(prefix) is not None

    def _find(self, s: str) -> "Trie | None":
        node = self
        for c in s:
            if c not in node.children:
                return None
            node = node.children[c]
        return node
```

**TypeScript：**
```typescript
class Trie {
  private children: Record<string, Trie> = {};
  private isEnd = false;

  insert(word: string): void {
    let node: Trie = this;
    for (const c of word) {
      if (!node.children[c]) node.children[c] = new Trie();
      node = node.children[c];
    }
    node.isEnd = true;
  }

  search(word: string): boolean {
    const node = this.find(word);
    return node !== null && node.isEnd;
  }

  startsWith(prefix: string): boolean {
    return this.find(prefix) !== null;
  }

  private find(s: string): Trie | null {
    let node: Trie = this;
    for (const c of s) {
      if (!node.children[c]) return null;
      node = node.children[c];
    }
    return node;
  }
}
```

**Java：**
```java
class Trie {
  private final Trie[] children = new Trie[26];
  private boolean isEnd;

  public void insert(String word) {
    Trie node = this;
    for (char c : word.toCharArray()) {
      int i = c - 'a';
      if (node.children[i] == null) node.children[i] = new Trie();
      node = node.children[i];
    }
    node.isEnd = true;
  }

  public boolean search(String word) {
    Trie node = find(word);
    return node != null && node.isEnd;
  }

  public boolean startsWith(String prefix) {
    return find(prefix) != null;
  }

  private Trie find(String s) {
    Trie node = this;
    for (char c : s.toCharArray()) {
      int i = c - 'a';
      if (node.children[i] == null) return null;
      node = node.children[i];
    }
    return node;
  }
}
```

**要点：**
- 每个操作为键长 O(L)，与字典规模无关。
- 最坏空间为 O(已插入单词长度之和)。

**标签：** #algorithm

---

### 42. 只出现一次的数字（Single Number）

**难度：** 简单
**主题：** bit-manipulation, xor
**岗位：** Embedded Engineer
**级别：** L8-L9

**问题：** 每个元素出现两次，仅一个出现一次。在 O(n) 时间、O(1) 空间内找出它。

**思路：** 对所有元素做异或；成对者相消为 0，剩下唯一值。时间 O(n)，空间 O(1)。

**Python：**
```python
from functools import reduce
from operator import xor

def single_number(nums: list[int]) -> int:
    return reduce(xor, nums, 0)
```

**TypeScript：**
```typescript
function singleNumber(nums: number[]): number {
  return nums.reduce((acc, x) => acc ^ x, 0);
}
```

**Java：**
```java
int singleNumber(int[] nums) {
  int acc = 0;
  for (int x : nums) acc ^= x;
  return acc;
}
```

**要点：**
- 异或满足结合律/交换律，重复者相消 → O(n) 时间、O(1) 空间。
- 关键恒等式：`x ^ x = 0`、`x ^ 0 = x`。

**标签：** #algorithm

---

### 43. 智能家居 IoT 事件调度（米家）

**难度：** 中等
**主题：** heap, intervals, greedy
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 米家把自动化事件按 `[start, end]` 时间窗口调度到一组执行 worker 上。给定一天所有事件窗口，求最少 worker 数，使重叠事件不共用 worker（即 IoT 版的"会议室 II"）。

**思路：** 按起点排序；用结束时间的最小堆。对每个事件，若最早结束的 worker 已空闲（`heap[0] <= start`）则复用（弹出）；总是压入当前结束时间。堆的峰值大小即答案。时间 O(n log n)，空间 O(n)。

**Python：**
```python
import heapq

def min_workers(events: list[list[int]]) -> int:
    events.sort()
    heap: list[int] = []
    for start, end in events:
        if heap and heap[0] <= start:
            heapq.heapreplace(heap, end)
        else:
            heapq.heappush(heap, end)
    return len(heap)
```

**TypeScript：**
```typescript
function minWorkers(events: number[][]): number {
  events.sort((a, b) => a[0] - b[0]);
  const heap: number[] = []; // min-heap via re-sort for clarity
  for (const [start, end] of events) {
    if (heap.length && heap[0] <= start) heap.shift();
    heap.push(end);
    heap.sort((a, b) => a - b);
  }
  return heap.length;
}
```

**Java：**
```java
int minWorkers(int[][] events) {
  Arrays.sort(events, (a, b) -> Integer.compare(a[0], b[0]));
  PriorityQueue<Integer> heap = new PriorityQueue<>();
  for (int[] e : events) {
    if (!heap.isEmpty() && heap.peek() <= e[0]) heap.poll();
    heap.offer(e[1]);
  }
  return heap.size();
}
```

**要点：**
- 排序 + 结束时间最小堆，O(n log n) 时间、O(n) 空间。
- 并发重叠的峰值即所需的最少 worker（会议室）数。

**标签：** #algorithm

---

### 44. MIUI 应用启动排序（拓扑排序）

**难度：** 中等
**主题：** graph, topological-sort, bfs
**岗位：** Android Engineer
**级别：** L10-L11

**问题：** MIUI/HyperOS 开机时，系统服务有启动依赖（`[a, b]` 表示 b 须先于 a 启动）。返回任一合法启动顺序，若存在依赖环导致无法启动则返回空列表。

**思路：** Kahn 拓扑排序——算入度，把入度为零的服务入队，输出时递减后继入度。若输出数小于 n，则存在环。时间 O(V + E)，空间 O(V + E)。

**Python：**
```python
from collections import deque

def launch_order(n: int, deps: list[list[int]]) -> list[int]:
    graph = [[] for _ in range(n)]
    indeg = [0] * n
    for a, b in deps:
        graph[b].append(a)
        indeg[a] += 1
    q = deque(i for i in range(n) if indeg[i] == 0)
    order: list[int] = []
    while q:
        node = q.popleft()
        order.append(node)
        for nxt in graph[node]:
            indeg[nxt] -= 1
            if indeg[nxt] == 0:
                q.append(nxt)
    return order if len(order) == n else []
```

**TypeScript：**
```typescript
function launchOrder(n: number, deps: number[][]): number[] {
  const graph: number[][] = Array.from({ length: n }, () => []);
  const indeg = new Array(n).fill(0);
  for (const [a, b] of deps) { graph[b].push(a); indeg[a]++; }
  const q: number[] = [];
  for (let i = 0; i < n; i++) if (indeg[i] === 0) q.push(i);
  const order: number[] = [];
  while (q.length) {
    const node = q.shift()!;
    order.push(node);
    for (const nxt of graph[node]) if (--indeg[nxt] === 0) q.push(nxt);
  }
  return order.length === n ? order : [];
}
```

**Java：**
```java
int[] launchOrder(int n, int[][] deps) {
  List<List<Integer>> graph = new ArrayList<>();
  for (int i = 0; i < n; i++) graph.add(new ArrayList<>());
  int[] indeg = new int[n];
  for (int[] d : deps) { graph.get(d[1]).add(d[0]); indeg[d[0]]++; }
  Queue<Integer> q = new LinkedList<>();
  for (int i = 0; i < n; i++) if (indeg[i] == 0) q.offer(i);
  int[] order = new int[n];
  int idx = 0;
  while (!q.isEmpty()) {
    int node = q.poll();
    order[idx++] = node;
    for (int nxt : graph.get(node)) if (--indeg[nxt] == 0) q.offer(nxt);
  }
  return idx == n ? order : new int[0];
}
```

**要点：**
- Kahn 算法 O(V + E) 时间与空间。
- 依赖环会使队列无法清空 → 输出少于 n。

**标签：** #algorithm

---

### 45. 传感器数据滑动窗口最大值（Sliding-Window Maximum）

**难度：** 困难
**主题：** sliding-window, deque, monotonic-queue
**岗位：** Embedded Engineer
**级别：** L10-L11

**问题：** 小米传感器流式上报读数；对滑过数据流的大小为 `k` 的窗口，报告每个窗口的最大读数（用于尖峰检测）。

**思路：** 单调递减的下标双端队列——压入前先弹出较小的队尾值，当队首滑出窗口时弹出队首。队首始终是窗口最大值。时间 O(n)，空间 O(k)。

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
        if dq[0] == i - k:
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
    if (dq[0] === i - k) dq.shift();
    if (i >= k - 1) out.push(nums[dq[0]]);
  }
  return out;
}
```

**Java：**
```java
int[] maxSlidingWindow(int[] nums, int k) {
  Deque<Integer> dq = new ArrayDeque<>();
  int[] out = new int[nums.length - k + 1];
  int idx = 0;
  for (int i = 0; i < nums.length; i++) {
    while (!dq.isEmpty() && nums[dq.peekLast()] <= nums[i]) dq.pollLast();
    dq.offerLast(i);
    if (dq.peekFirst() == i - k) dq.pollFirst();
    if (i >= k - 1) out[idx++] = nums[dq.peekFirst()];
  }
  return out;
}
```

**要点：**
- 每个下标至多入队、出队各一次 → O(n) 时间、O(k) 空间。
- 双端队列保持单调递减，故队首即窗口最大值。

**标签：** #algorithm

---

### 46. 电池功耗优化（DP）

**难度：** 中等
**主题：** dynamic-programming
**岗位：** Embedded Engineer
**级别：** L10-L11

**问题：** 小米设备可运行后台任务，每个任务有功耗成本和效用值，但调度中相邻两个任务不能同时运行（它们争用同一硬件块）。给定按顺序排列的任务效用值，在"不相邻"约束下最大化总效用。

**思路：** 这是变形的打家劫舍：`best(i) = max(跳过 i, value[i] + best(i-2))`，用两个滚动变量计算。时间 O(n)，空间 O(1)。

**Python：**
```python
def max_utility(values: list[int]) -> int:
    prev = cur = 0
    for v in values:
        prev, cur = cur, max(cur, prev + v)
    return cur
```

**TypeScript：**
```typescript
function maxUtility(values: number[]): number {
  let prev = 0, cur = 0;
  for (const v of values) { const t = Math.max(cur, prev + v); prev = cur; cur = t; }
  return cur;
}
```

**Java：**
```java
int maxUtility(int[] values) {
  int prev = 0, cur = 0;
  for (int v : values) { int t = Math.max(cur, prev + v); prev = cur; cur = t; }
  return cur;
}
```

**要点：**
- 用两个滚动变量的线性 DP → O(n) 时间、O(1) 空间。
- "不相邻"约束恰好对应打家劫舍的递推。

**标签：** #algorithm

---

### 47. 设计米家智能家居 IoT 平台

**难度：** 困难
**主题：** system-design, iot, mqtt, scale
**岗位：** Senior SWE
**级别：** L12+

**问题：** 设计米家后端，连接数亿台智能设备（灯、插座、摄像头、传感器）到手机和云端自动化。

**思路：** 设备通过 MQTT（轻量、发布/订阅、QoS 分级）或自定义 TCP 协议与边缘网关层维持长连接；网关无状态、水平扩展，置于按设备 ID 一致性哈希的连接感知负载均衡之后。设备注册表/影子服务存储"最后已知"和"期望"状态（类似 AWS IoT 设备影子），即使设备离线也能读写状态。命令流：App → 云 → 设备主题；遥测流：设备 → 主题 → 流（Kafka）→ 存储 + 规则引擎。自动化/规则引擎以低延迟评估触发器（"有人移动则开灯"），最好下推到本地中枢以支持离线运行。权衡：MQTT 与 WebSocket（电量、NAT）、亿级规模下的单设备连接成本（保活调优、连接分片）、影子状态的最终/强一致性、区域数据合规（中国与全球）。安全：每设备证书/密钥、TLS、主题级 ACL，使一台被攻陷设备无法订阅其他设备。

**标签：** #system-design

---

### 48. 设计 OTA 固件升级系统

**难度：** 困难
**主题：** system-design, ota, cdn, rollout
**岗位：** Senior SWE
**级别：** L12+

**问题：** 为数千万台内存有限、连接间歇的小米 IoT 设备设计空中（OTA）固件升级。

**思路：** 构建侧：签名的固件构件存于对象存储并经 CDN 分发；元数据服务跟踪设备型号、当前版本与目标版本。设备轮询（或被推送）升级清单，分块可续传下载（range 请求；每块校验和），并采用 A/B（双分区）方案刷写，使失败的刷写回滚到已知良好分区。关键：分级/灰度发布——先发 1% → 监控崩溃/变砖率 → 再放量；带急停开关。差分升级（bsdiff）以在受限设备上节省带宽。权衡：下载洪峰控制（抖动调度、CDN 卸载）、在内存受限 MCU 上校验签名、刷写中途断电（原子分区切换）、老硬件的版本碎片化。升级成功/失败遥测反馈给发布控制器。

**标签：** #system-design

---

### 49. 设计 MIUI 推送通知服务

**难度：** 困难
**主题：** system-design, push, fanout, websocket
**岗位：** Senior SWE
**级别：** L12+

**问题：** 设计向数亿台 Android 设备可靠、低延迟投递消息的推送系统（MIPush）。

**思路：** 设备与连接网关层维持长连接（长连 TCP/MQTT）；路由服务把 设备 token → 当前持有该连接的网关实例（存于 Redis 等快速注册表）。发布方（App）调 API → 消息队列 → 路由 → 网关 → 设备。对离线设备做存储转发并设 TTL，重连时投递。用消息 ID 去重；至少一次投递配合客户端 ack。规模问题：数千万并发 socket 意味着连接分片、心跳/保活调优（电量与存活检测的平衡）、海量重连的惊群（抖动退避）。优先级通道（IM 消息 vs 营销）与每 App 限流。权衡：自建通道 vs FCM（国内 FCM 不可用，故自建通道是必需）、精确一次代价高——优选至少一次 + 幂等客户端。

**标签：** #system-design

---

### 50. 设计小米商城秒杀/抢购系统

**难度：** 困难
**主题：** system-design, high-concurrency, cache, consistency
**岗位：** Senior SWE
**级别：** L12+

**问题：** 设计小米商城的秒杀场景：有限库存（如 10000 台手机）在数秒内被数百万用户抢购且不超卖。

**思路：** 核心难题是极小库存上的极端读写洪峰。分层防护：(1) CDN + 商品页静态缓存；(2) 前端限流（禁用按钮、验证码、排队令牌）；(3) 请求准入——只放行约等于库存量的流量；(4) 在 Redis 中原子扣减库存（用 Lua 脚本做检查并扣减），从而杜绝超卖；(5) 经消息队列（Kafka/RocketMQ）异步创建真实订单——Redis 把守库存，DB 写在队列之后以削峰。以 用户+场次 为键的幂等下单防止重复购买。反作弊：限流、设备指纹、风险评分。权衡：Redis 计数器的强一致 vs DB 持久性（异步对账）、优雅降级（快速"售罄"路径）、开抢前预热缓存。可提及若单 key 成热点则把库存分片到多个 Redis key。

**标签：** #system-design

---

### 51. 设计应用商店 / 短视频推荐流

**难度：** 困难
**主题：** system-design, recommendation, ranking, feed
**岗位：** Senior SWE
**级别：** L12+

**问题：** 为小米应用商店（或短视频界面）设计推荐流，大规模提供个性化排序内容。

**思路：** 两阶段架构：(1) 候选生成——通过协同过滤、embedding 最近邻（ANN 索引）、近期热门等来源，从海量库中检索数百候选；(2) 排序——学习模型用用户特征、物品特征与上下文（时间、设备）对候选打分。经特征存储提供服务（在线低延迟查询、离线训练）。流装配应用业务规则：多样性（不连续展示同类）、新鲜度、已看去重。日志闭环：曝光/点击 → 训练数据 → 周期性重训。权衡：延迟预算（数十毫秒）迫使用 ANN + 缓存特征；新用户/新物品冷启动（回退到热门/基于内容）；探索与利用（注入少量随机以收集信号）。可提及线上 A/B 测试做模型放量。

**标签：** #system-design

---

### 52. 设计设备到云遥测接入

**难度：** 困难
**主题：** system-design, streaming, time-series, kafka
**岗位：** Senior SWE
**级别：** L12+

**问题：** 设计从数百万台小米 IoT 设备接入高吞吐遥测（传感器读数、设备健康）用于监控与分析的管道。

**思路：** 边缘网关接收设备消息并发布到按设备 ID 分区的日志（Kafka）以保证单设备有序。流处理器（Flink/Kafka Streams）做校验、富化与窗口聚合（如 1 分钟汇总）。热路径 → 时序数据库（用于看板/告警）；冷路径 → 对象存储/数据湖用于批量分析与 ML 训练。边缘端的背压处理与批量发送降低连接开销。权衡：单设备有序（按设备分区）vs 吞吐、精确一次 vs 至少一次（幂等 sink）、降采样/保留分层（原始保留 7 天、汇总保留一年）、新设备类型上线时的 schema 演进。异常告警反馈给规则引擎。亿级设备下，可提及采样与边缘预聚合以控制成本。

**标签：** #system-design

---

### 53. 设计分布式缓存

**难度：** 困难
**主题：** system-design, cache, consistent-hashing, replication
**岗位：** Senior SWE
**级别：** L12+

**问题：** 设计供小米后端各服务使用的分布式内存缓存（类 Redis/Memcached）。

**思路：** 用一致性哈希把 key 分区到各节点（虚拟节点保证均衡并在成员变更时最小化重洗）。复制：每个分片有主 + 从用于读扩展与故障切换（异步复制以延迟换持久性）。淘汰策略（LRU/LFU）配合 TTL。客户端或代理路由（智能客户端或 Twemproxy/Redis Cluster 代理）。一致性：旁路缓存最常见（应用读缓存，未命中则读 DB 并回填）；讨论写穿 vs 写回与缓存失效（最难的问题）。处理热 key（复制/本地缓存）、过期惊群（请求合并/互斥/stale-while-revalidate）、缓存穿透（布隆过滤器或缓存空值）。权衡：强一致 vs 最终一致、内存 vs 命中率、故障模式（缓存宕机不可级联——加熔断与对 DB 的限流）。

**标签：** #system-design

---

### 54. 设计实时订单系统

**难度：** 困难
**主题：** system-design, transactions, idempotency, queue
**岗位：** Senior SWE
**级别：** L12+

**问题：** 设计小米商城的订单处理系统，可靠处理下单、支付、库存与履约。

**思路：** 订单服务以"待处理"状态写入订单（幂等键 = 用户 + 购物车令牌，防重复提交）。库存预留原子进行（预留，尚不扣减）。支付为外部异步调用；成功后由事件驱动状态流转（待处理 → 已支付 → 履约中 → 已发货）。各阶段间用消息队列解耦并重试；订单状态机为事实源。跨服务一致性不用分布式锁，而用 Saga 模式配合补偿动作（支付失败/超时则释放库存）。权衡：跨服务精确一次不现实——设计幂等处理 + 去重；订单、库存、支付间的最终一致配合对账任务；超时（自动取消未支付订单以释放预留库存）。可提及 outbox 模式，把事件与 DB 写事务性地一起发布。

**标签：** #system-design

---

### 55. 为什么选择小米？（为发烧而生）

**难度：** 简单
**主题：** behavioral, motivation, fit
**岗位：** Backend SWE
**级别：** L8-L9

**问题：** 你为什么特别想加入小米？哪个产品/团队让你兴奋？

**思路：** 展现与小米身份认同的真实契合："为发烧而生"以及 AIoT + 手机 + 生态战略。要具体——点名一个产品（HyperOS、米家生态、你真正在用的小米手机或可穿戴设备）和一个小米强项的技术领域（超大规模 AIoT、MIUI/Android 深度、高并发电商）。结合你的能力：如"我做过嵌入式固件，想参与出货给数百万人的设备"。避免泛泛的"大公司/待遇好"——小米看重作为产品用户与发烧友的工程师。

**标签：** #behavioral

---

### 56. 成本效率思维（感动人心、价格厚道）

**难度：** 中等
**主题：** behavioral, cost, tradeoffs, ownership
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 讲一次你在紧张的资源或成本约束下交付了出色结果的经历。

**思路：** 小米的核心理念是"感动人心、价格厚道"与高性价比。他们考查你是否为价值优化、而非过度雕琢。用 STAR：选一个遇到约束（算力预算有限、小团队、廉价硬件目标）并做出务实权衡、在削减成本的同时保住用户体验的故事——如通过缓存/批处理把服务器成本降低 X%，或通过优化热路径在更便宜的硬件上交付。量化节省，并说明你接受了怎样的权衡（以及预算变大后会重新考虑什么）。避免过度工程的"豪华方案"故事。

**标签：** #behavioral

---

### 57. 快速发布节奏

**难度：** 中等
**主题：** behavioral, execution, shipping
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 描述一次你必须在硬件发布或固定截止日下快速交付的经历。你如何平衡速度与质量？

**思路：** 小米在紧凑、不可变的发布日上交付软硬件，因此看重既快又不出事的工程师。用 STAR：真实的截止日（一次发布、一场秒杀）、你砍掉了什么 vs 守住了什么（砍掉锦上添花、守住正确性与回滚路径）、如何降风险（特性开关、灰度、监控）、以及结果。展现判断力：你不只是求快——你把风险讲清楚、取得共识、并备好回退方案。信号是务实的优先级排序加安全网，而非逞英雄。

**标签：** #behavioral

---

### 58. 与同事的冲突/分歧

**难度：** 中等
**主题：** behavioral, conflict, collaboration
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 讲一次你在技术决策上与同事或主管强烈分歧的经历。你如何处理？

**思路：** 用 STAR。展现你：(1) 把自我与决策分离，努力理解对方理由；(2) 用数据或小原型而非空谈观点；(3) 在共同目标（用户体验、成本、截止日）上找共识；(4) 一旦决策达成就全力执行——即便不是你的方案（"求同存异、坚决执行"）。以结果和你对对方视角的领悟收尾。避免靠升级"获胜"或事后心怀不满的故事。

**标签：** #behavioral

---

### 59. Android 框架：Activity 生命周期、Binder IPC、Handler/Looper

**难度：** 困难
**主题：** domain-knowledge, android, ipc, concurrency
**岗位：** Android Engineer
**级别：** L10-L11

**问题：** 解释 Android Activity 生命周期、Binder IPC 的工作原理，以及 Handler/Looper/MessageQueue 的作用。为什么不能从后台线程更新 UI？

**思路：** **生命周期**：`onCreate → onStart → onResume`（前台）→ `onPause → onStop → onDestroy`；`onPause`/`onStop` 中释放资源；配置变更（旋转）会销毁并重建 Activity，除非自行处理——讲在 `onSaveInstanceState` 中保存状态。**Binder**：Android 的主要 IPC；内核驱动实现跨进程一次拷贝调用，由 AIDL 生成代理/桩。系统服务（ActivityManager 等）经 Binder 访问；提及每进程的 binder 线程池以及同步 Binder 调用会阻塞。**Handler/Looper**：每个线程可有一个 Looper 循环处理 MessageQueue；主（UI）线程在应用启动时已建好 Looper。Handler 把 Message/Runnable 投递到某线程队列。**UI 线程规则**：Android UI 工具包非线程安全且框架会检查调用线程，故 UI 更新须投递回主线程（经 Handler、`runOnUiThread` 或协程/`LiveData`）。后台工作（网络、磁盘）须放在主线程之外以避免 ANR（约 5 秒）。

**标签：** #domain-knowledge

---

### 60. JVM 内存模型与垃圾回收

**难度：** 困难
**主题：** domain-knowledge, jvm, gc, memory
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 描述 JVM 内存区域、分代 GC 模型，以及你如何诊断内存泄漏或长 GC 停顿。

**思路：** **区域**：堆（年轻代 = Eden + 2 个 Survivor、老年代）、元空间（类元数据，Java 8 起在堆外）、每线程栈、PC 寄存器。**分代 GC**：多数对象朝生夕死 → 年轻代 minor GC 廉价回收（复制存活者）；存活足够多次的对象晋升到老年代，由 major/full GC 回收。提及回收器：Parallel（吞吐）、CMS（已弃用）、G1（分区，平衡停顿与吞吐）、ZGC/Shenandoah（低停顿、并发）。**诊断**：泄漏表现为老年代跨多次 full GC 持续增长直至 OOM——抓堆转储（`jmap`/`-XX:+HeapDumpOnOutOfMemoryError`）并在 MAT 中分析支配树找出被持有引用（如静态集合、未注销监听器、ThreadLocal）。停顿过长则读 GC 日志（`-Xlog:gc`），检查分配率与晋升，调整堆大小/切换到 G1/ZGC。Android 上 ART 不同（AOT + JIT、不同 GC）——若为客户端岗位需指出区别。

**标签：** #domain-knowledge

---

### 61. 嵌入式 C / RTOS 基础

**难度：** 困难
**主题：** domain-knowledge, embedded, rtos, c
**岗位：** Embedded Engineer
**级别：** L10-L11

**问题：** 对于跑在微控制器上的小米 IoT 设备，解释裸机大循环与 RTOS 的区别、`volatile` 的含义，以及如何处理 ISR 与主循环间的共享数据。

**思路：** **大循环 vs RTOS**：裸机用单个 `while(1)` 轮询/处理工作；简单但随功能增长难以满足时序。RTOS（FreeRTOS 等）提供带优先级的任务、调度器（抢占式、按优先级）与原语（信号量、队列、互斥锁），使时间关键工作可抢占后台工作。提及每任务独立栈与有限 RAM 的约束。**`volatile`**：告诉编译器变量可能在正常程序流之外改变（硬件寄存器、ISR 修改的标志），故不得缓存在寄存器或优化掉读取——这是正确性所需，但不提供原子性。**ISR ↔ 主循环共享**：ISR 要短；用 `volatile` 标志，或更好地用无锁环形缓冲/RTOS 队列把数据传出 ISR。对多字节共享数据，短暂关中断或用原子访问以避免撕裂。讨论优先级反转（用优先级继承互斥锁）与避免在 ISR 中阻塞调用。功耗：事件间进入睡眠模式以省电（对 IoT 关键）。

**标签：** #domain-knowledge

---

### 62. 计算机网络：HTTP 与 TCP

**难度：** 中等
**主题：** domain-knowledge, networking, tcp, http
**岗位：** Backend SWE
**级别：** L10-L11

**问题：** 讲一遍小米 App 请求 `https://api.mi.com/...` 时网络层发生的事，涵盖 DNS、TCP 握手、TLS，以及 HTTP/1.1、HTTP/2、HTTP/3 的区别。

**思路：** **DNS**：把 `api.mi.com` 解析为 IP（递归解析器、缓存，可能用 GeoDNS 指向最近区域）。**TCP 握手**：SYN → SYN-ACK → ACK 建立连接；讲三次握手以及 TCP 提供可靠、有序、带拥塞控制的传输（序号、ACK、重传、滑动窗口）。**TLS**：握手协商加密套件与密钥（TLS 1.3 一个 RTT 完成，支持 0-RTT 复用），使 HTTP 负载被加密。**HTTP 版本**：HTTP/1.1 = 每连接一次一个请求（队头阻塞，靠多连接 + keep-alive 缓解）；HTTP/2 = 单 TCP 连接上多路复用流 + 头压缩（HPACK），但在丢包时仍受 TCP 层队头阻塞；HTTP/3 = 跑在 QUIC（基于 UDP）上，按流投递使单流丢包不阻塞其他流，且连接建立更快——在易丢包的移动网络上很有价值。回到主题：对移动 IoT/App 流量，HTTP/3 / QUIC 与连接复用对延迟和电量很重要。

**标签：** #domain-knowledge

---

## 针对小米的专项建议

- **吃透你岗位的领域。** Android 客户端 → 框架内部（生命周期、Binder、Handler/Looper、ART）；设备/固件 → 嵌入式 C、RTOS、功耗；后端 → 高并发（秒杀）、缓存、IoT 遥测。
- **练好秒杀设计。** 秒杀/抢购是小米标志性的系统设计题——准备好讲 Redis 原子扣库存、队列承接下单、防超卖。
- **展现性价比思维。** 务实、重价值的权衡比镀金方案更受认可。
- **做真实用户。** 熟悉 HyperOS/MIUI 与小米生态体现文化契合（"为发烧而生"）。
- **算法门槛是扎实中等。** 多练数组、字符串、树、图、DP 与滑动窗口——而非竞赛级难题。
