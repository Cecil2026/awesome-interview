# 华为（Huawei）

```yaml
company: 华为（运营商网络、HarmonyOS / 消费者 BG、华为云、5G/无线、硬件/嵌入式）
typical_rounds: 1 轮 OD/机试（在线编程测评）+ 2-4 轮技术面 + 交叉面 + HR/部门主管面
focus_areas: C/C++、算法（机试）、操作系统、TCP/IP 网络、嵌入式/电信、分布式系统
languages_allowed: C/C++ 最常见（尤其运营商/嵌入式）；云与工具链用 Java/Python/Go
duration: 机试约 150 分钟（3 道题）；每轮面试 45-60 分钟
notable_quirks:
  - 机试（OD 机试）是必过的编程门槛——通常 150 分钟 3 道算法题，按权重计分
  - OD（外包派遣）与正编岗位有区别——流程和待遇不同
  - 大量 C/C++ 指针与手动内存管理题；会考 segfault / 内存泄漏调试
  - 操作系统与网络深挖（进程 vs 线程、IPC、TCP 三次握手、拥塞控制）常见
  - 行为面会探查"奋斗者协议"与长工时文化
  - 系统设计带有强烈的电信 / 5G / HarmonyOS 分布式领域背景
sources: LeetCode Discuss（huawei 标签）、牛客网、一亩三分地、Glassdoor
```

## 概述

华为面试最显著的特点是分量很重、必须通过的机试（在线编程测评）——通常 150 分钟内 3 道算法题，这一关分数不佳往往会在任何真人面试之前就终止流程。C/C++ 是主导语言，尤其在运营商网络和嵌入式团队，因此除了标准数据结构题外，还要准备手动内存管理、指针运算以及 segfault/内存泄漏调试。面试官对操作系统和 TCP/IP 网络基础的深挖远超美国公司。系统设计扎根于华为的业务领域：电信计费、5G 基站、HarmonyOS 分布式软总线、运营商级高可用。行为面会探查"奋斗者"文化以及高压下工作的意愿。

## 题目

### 1. 两数之和（Two Sum）

**难度：** 简单
**主题：** array, hash-table
**岗位：** OD / SWE
**级别：** 13-14（初级）

**问题：** 给定整数数组 `nums` 和目标值，返回相加等于目标值的两个数的下标。恰好存在一个解；同一元素不可使用两次。

**思路：** 一次遍历，维护"值 → 下标"哈希表。对每个元素检查 `target - x` 是否已出现；若出现则返回两个下标。时间 O(n)，空间 O(n)——典型的机试热身题。

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
    if (seen.containsKey(need)) return new int[] { seen.get(need), i };
    seen.put(nums[i], i);
  }
  return new int[0];
}
```

**要点：**
- 单次遍历加哈希表，时间 O(n)、空间 O(n)，优于 O(n^2) 暴力。
- 检查之后再存入当前值，避免把元素与自身配对。

**追问：**
- 返回所有相加等于目标值的不重复数对（排序 + 双指针）。
- 输入已排序——用双指针 O(1) 额外空间求解。
- 3Sum / 4Sum 的推广。
- 数字流——设计在线的 `add`/`find` 结构。

**标签：** #algorithm

---

### 2. 有效的括号（Valid Parentheses）

**难度：** 简单
**主题：** string, stack
**岗位：** OD / SWE
**级别：** 13-14（初级）

**问题：** 给定只含 `()[]{}` 的字符串，判断括号是否有效匹配且正确嵌套。

**思路：** 左括号入栈；遇到右括号则弹出比较。只有当每个右括号都匹配栈顶、且最终栈为空时才有效。时间 O(n)，空间 O(n)。

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
  Map<Character, Character> pairs = Map.of(')', '(', ']', '[', '}', '{');
  Deque<Character> stack = new ArrayDeque<>();
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
- 栈刻画嵌套关系，时间和空间均为 O(n)。
- 最后必须检查栈为空，而不仅是逐字符匹配。

**追问：**
- 返回使字符串有效所需的最少插入数。
- 最长有效括号子串（DP / 下标栈）。
- 支持运行时定义的任意括号类型。
- 流式输入、内存受限下做校验。

**标签：** #algorithm

---

### 3. 反转链表（Reverse Linked List）

**难度：** 简单
**主题：** linked-list, two-pointer
**岗位：** OD / SWE
**级别：** 13-14（初级）

**问题：** 反转单链表并返回新的头节点。

**思路：** 用 `prev`/`curr` 指针遍历，原地翻转每个 `next`。时间 O(n)，空间 O(1)。这是华为 C/C++ 机试的常客——面试官也可能要求递归写法。

**Python：**
```python
class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val, self.next = val, next

def reverse_list(head: ListNode | None) -> ListNode | None:
    prev = None
    while head:
        nxt = head.next
        head.next = prev
        prev = head
        head = nxt
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
    const nxt = head.next;
    head.next = prev;
    prev = head;
    head = nxt;
  }
  return prev;
}
```

**Java：**
```java
class ListNode {
  int val; ListNode next;
  ListNode(int val) { this.val = val; }
}

ListNode reverseList(ListNode head) {
  ListNode prev = null;
  while (head != null) {
    ListNode nxt = head.next;
    head.next = prev;
    prev = head;
    head = nxt;
  }
  return prev;
}
```

**要点：**
- 原地翻转指针，时间 O(n)、空间 O(1)。
- 覆盖 `next` 前要先保存它，否则会丢失链表余下部分。

**追问：**
- 只反转位置 m 到 n 之间的节点。
- 每 k 个一组反转（k 个一组翻转链表）。
- 用递归实现，并讨论 O(n) 调用栈空间。
- 反转前先检测并处理是否存在环。

**标签：** #algorithm

---

### 4. 合并两个有序链表（Merge Two Sorted Lists）

**难度：** 简单
**主题：** linked-list, two-pointer
**岗位：** OD / SWE
**级别：** 13-14（初级）

**问题：** 合并两个有序链表为一个有序链表并返回头节点。

**思路：** 用哑头，遍历两链表每步拼接较小节点，最后接上剩余部分。时间 O(n + m)，空间 O(1)。

**Python：**
```python
class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val, self.next = val, next

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
class ListNode {
  int val; ListNode next;
  ListNode(int val) { this.val = val; }
}

ListNode mergeTwoLists(ListNode a, ListNode b) {
  ListNode dummy = new ListNode(0), tail = dummy;
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
- 哑头免去对首节点的特判；时间 O(n + m)、空间 O(1)。
- 用一步接上非空的剩余部分，无需继续循环。

**追问：**
- 用堆合并 k 个有序链表，O(N log k)。
- 按降序合并。
- 原地合并两个有序数组。
- 值相等时保持合并稳定性。

**标签：** #algorithm

---

### 5. 买卖股票的最佳时机（Best Time to Buy and Sell Stock）

**难度：** 简单
**主题：** array, dynamic-programming
**岗位：** OD / SWE
**级别：** 13-14（初级）

**问题：** 给定每日价格，求一次买入、之后卖出的最大利润；无利润则返回 0。

**思路：** 维护至今的最低价；每天用当前价减去最低价求利润并取最优。时间 O(n)，空间 O(1)。

**Python：**
```python
def max_profit(prices: list[int]) -> int:
    best, lo = 0, float("inf")
    for p in prices:
        lo = min(lo, p)
        best = max(best, p - lo)
    return best
```

**TypeScript：**
```typescript
function maxProfit(prices: number[]): number {
  let best = 0, lo = Infinity;
  for (const p of prices) {
    lo = Math.min(lo, p);
    best = Math.max(best, p - lo);
  }
  return best;
}
```

**Java：**
```java
int maxProfit(int[] prices) {
  int best = 0, lo = Integer.MAX_VALUE;
  for (int p : prices) {
    lo = Math.min(lo, p);
    best = Math.max(best, p - lo);
  }
  return best;
}
```

**要点：**
- 单次遍历追踪运行最小值，时间 O(n)、空间 O(1)。
- 买必须在卖之前，而"运行最小值"不变式恰好保证了这一点。

**追问：**
- 无限次交易（累加所有正的差值）。
- 至多 k 次交易（DP，O(nk)）。
- 加入手续费或冷冻期。
- 返回实际的买入/卖出日下标。

**标签：** #algorithm

---

### 6. 二分查找（Binary Search）

**难度：** 简单
**主题：** binary-search, array
**岗位：** OD / SWE
**级别：** 13-14（初级）

**问题：** 给定有序数组和目标值，返回其下标，不存在则返回 -1。

**思路：** 维护 `[lo, hi]` 边界，探测中点，每步将范围减半。用 `lo + (hi - lo) // 2` 避免溢出（C/C++ 中尤为重要）。时间 O(log n)，空间 O(1)。

**Python：**
```python
def binary_search(nums: list[int], target: int) -> int:
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
function binarySearch(nums: number[], target: number): number {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}
```

**Java：**
```java
int binarySearch(int[] nums, int target) {
  int lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    int mid = lo + (hi - lo) / 2;
    if (nums[mid] == target) return mid;
    if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}
```

**要点：**
- 每步减半范围，时间 O(log n)、空间 O(1)。
- `lo + (hi - lo) / 2` 可避免 `(lo + hi) / 2` 在 C/C++/Java 中的整数溢出。

**追问：**
- 返回最左/最右插入位置（下界/上界）。
- 在旋转有序数组中查找。
- 在无限/无界有序流中查找某值。
- 用递归实现并讨论栈使用。

**标签：** #algorithm

---

### 7. 最大子数组和（Kadane）

**难度：** 中等
**主题：** array, dynamic-programming
**岗位：** OD / SWE
**级别：** 13-14（初级）

**问题：** 找出和最大的连续子数组并返回该和。

**思路：** Kadane 算法——维护运行和；当延续会使其变小时就重置为当前元素。同时记录全局最优。时间 O(n)，空间 O(1)。

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
- Kadane 时间 O(n)、空间 O(1)。
- 用首元素初始化，使全负数组也能返回最大的单个值。

**追问：**
- 返回子数组边界，而不仅是和。
- 最大乘积子数组（同时追踪最小、最大）。
- 最大环形子数组和。
- 分治 O(n log n) 解法以及为何 Kadane 更优。

**标签：** #algorithm

---

### 8. 爬楼梯（Climbing Stairs）

**难度：** 简单
**主题：** dynamic-programming
**岗位：** OD / SWE
**级别：** 13-14（初级）

**问题：** 每次可爬 1 或 2 级台阶。爬 `n` 级有多少种不同方法？

**思路：** 斐波那契递推 `f(n) = f(n-1) + f(n-2)`。滚动两个变量避免数组。时间 O(n)，空间 O(1)。

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
  for (int i = 0; i < n; i++) {
    int t = a + b; a = b; b = t;
  }
  return a;
}
```

**要点：**
- 滚动两个变量，时间 O(n)、空间 O(1)。
- 本质是斐波那契；识别出递推即是全部要点。

**追问：**
- 每步可走 1、2 或 3 级。
- 每级有代价——最小化总代价（最小花费爬楼梯）。
- 对大 n 取模 1e9+7 计数。
- 用矩阵快速幂做到 O(log n)。

**标签：** #algorithm

---

### 9. 有效的字母异位词（Valid Anagram）

**难度：** 简单
**主题：** string, hash-table, counting
**岗位：** OD / SWE
**级别：** 13-14（初级）

**问题：** 给定两个字符串，判断其中一个是否是另一个的字母异位词。

**思路：** 统计第一个串的字符频次，用第二个串递减，验证所有计数归零。时间 O(n)，固定字母表下空间 O(1)。

**Python：**
```python
from collections import Counter

def is_anagram(s: str, t: str) -> bool:
    if len(s) != len(t):
        return False
    return Counter(s) == Counter(t)
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
- 频次统计时间 O(n)；26 槽数组空间 O(1)。
- 长度不等可立即否定。

**追问：**
- 支持完整 Unicode，而非仅小写 a–z。
- 把所有异位词分组（见下一题）。
- 在 `s` 中找出 `p` 的所有异位词起始下标（滑动窗口）。
- 忽略大小写与空白做比较。

**标签：** #algorithm

---

### 10. 字母异位词分组（Group Anagrams）

**难度：** 中等
**主题：** string, hash-table, sorting
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 将单词列表分组，使互为异位词的单词落入同一组。

**思路：** 为每个单词生成规范化键——排序后的字母，或 26 位计数签名——按该键在哈希表中分桶。用排序键时时间 O(n·k log k)（k 为词长），空间 O(n·k)。

**Python：**
```python
from collections import defaultdict

def group_anagrams(words: list[str]) -> list[list[str]]:
    groups: dict[str, list[str]] = defaultdict(list)
    for w in words:
        groups["".join(sorted(w))].append(w)
    return list(groups.values())
```

**TypeScript：**
```typescript
function groupAnagrams(words: string[]): string[][] {
  const groups = new Map<string, string[]>();
  for (const w of words) {
    const key = [...w].sort().join("");
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(w);
  }
  return [...groups.values()];
}
```

**Java：**
```java
List<List<String>> groupAnagrams(String[] words) {
  Map<String, List<String>> groups = new HashMap<>();
  for (String w : words) {
    char[] c = w.toCharArray();
    Arrays.sort(c);
    groups.computeIfAbsent(new String(c), k -> new ArrayList<>()).add(w);
  }
  return new ArrayList<>(groups.values());
}
```

**要点：**
- 排序键每词 O(k log k)，总体 O(n·k log k)。
- 用计数签名键可把每词成本降到 O(k)，总体 O(n·k)。

**追问：**
- 改用计数签名键去掉 log 因子。
- 流式处理单词并增量输出分组。
- 忽略大小写与空格按异位词类分组。
- 按组大小排序返回。

**标签：** #algorithm

---

### 11. 盛最多水的容器（Container With Most Water）

**难度：** 中等
**主题：** array, two-pointer, greedy
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 给定高度数组，选两条线与 x 轴构成容器使盛水最多，返回最大面积。

**思路：** 双指针位于两端；面积为 `min(h[l], h[r]) * (r - l)`。每次移动较矮的一侧，因为它限制了面积。时间 O(n)，空间 O(1)。

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
- 双指针扫描时间 O(n)、空间 O(1)，优于 O(n^2) 暴力。
- 移动较高一侧绝不会增大面积，因此总是移动较矮一侧。

**标签：** #algorithm

---

### 12. 三数之和（3Sum）

**难度：** 中等
**主题：** array, two-pointer, sorting
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 找出数组中所有和为零的不重复三元组。

**思路：** 排序后固定一个下标，对其余部分做双指针扫描，并在每层跳过重复。时间 O(n^2)，除输出外空间 O(1)。

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
- 排序加双指针扫描时间 O(n^2)、额外空间 O(1)。
- 在每层跳过重复值是保证三元组不重复的关键。

**标签：** #algorithm

---

### 13. 无重复字符的最长子串（Longest Substring Without Repeating Characters）

**难度：** 中等
**主题：** string, sliding-window, hash-table
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 求无重复字符的最长子串长度。

**思路：** 滑动窗口加"字符 → 最后下标"映射。当重复落在窗口内时，把左边界跳到其之后。时间 O(n)，空间 O(min(n, 字母表))。

**Python：**
```python
def length_of_longest_substring(s: str) -> int:
    last: dict[str, int] = {}
    start = best = 0
    for i, c in enumerate(s):
        if c in last and last[c] >= start:
            start = last[c] + 1
        last[c] = i
        best = max(best, i - start + 1)
    return best
```

**TypeScript：**
```typescript
function lengthOfLongestSubstring(s: string): number {
  const last = new Map<string, number>();
  let start = 0, best = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (last.has(c) && last.get(c)! >= start) start = last.get(c)! + 1;
    last.set(c, i);
    best = Math.max(best, i - start + 1);
  }
  return best;
}
```

**Java：**
```java
int lengthOfLongestSubstring(String s) {
  Map<Character, Integer> last = new HashMap<>();
  int start = 0, best = 0;
  for (int i = 0; i < s.length(); i++) {
    char c = s.charAt(i);
    if (last.containsKey(c) && last.get(c) >= start) start = last.get(c) + 1;
    last.put(c, i);
    best = Math.max(best, i - start + 1);
  }
  return best;
}
```

**要点：**
- 每个下标进出窗口各一次，时间 O(n)。
- 将 `start` 跳过上次出现位置，避免重新扫描窗口。

**标签：** #algorithm

---

### 14. 最小覆盖子串（Minimum Window Substring）

**难度：** 困难
**主题：** string, sliding-window, hash-table
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 给定字符串 `s` 和 `t`，返回 `s` 中包含 `t` 全部字符（含重数）的最小子串，不存在则返回 ""。

**思路：** 扩张窗口直到满足全部所需计数，再从左收缩同时保持有效，并记录最小有效窗口。时间 O(n + m)，空间 O(字母表)。

**Python：**
```python
from collections import Counter

def min_window(s: str, t: str) -> str:
    if not t or not s:
        return ""
    need = Counter(t)
    missing = len(t)
    start = end = 0
    left = 0
    for right, c in enumerate(s, 1):
        if need[c] > 0:
            missing -= 1
        need[c] -= 1
        while missing == 0:
            if end == 0 or right - left < end - start:
                start, end = left, right
            need[s[left]] += 1
            if need[s[left]] > 0:
                missing += 1
            left += 1
    return s[start:end]
```

**TypeScript：**
```typescript
function minWindow(s: string, t: string): string {
  if (!s || !t) return "";
  const need = new Map<string, number>();
  for (const c of t) need.set(c, (need.get(c) ?? 0) + 1);
  let missing = t.length, left = 0, start = 0, end = 0;
  for (let right = 1; right <= s.length; right++) {
    const c = s[right - 1];
    if ((need.get(c) ?? 0) > 0) missing--;
    need.set(c, (need.get(c) ?? 0) - 1);
    while (missing === 0) {
      if (end === 0 || right - left < end - start) { start = left; end = right; }
      const lc = s[left];
      need.set(lc, (need.get(lc) ?? 0) + 1);
      if ((need.get(lc) ?? 0) > 0) missing++;
      left++;
    }
  }
  return s.slice(start, end);
}
```

**Java：**
```java
String minWindow(String s, String t) {
  if (s.isEmpty() || t.isEmpty()) return "";
  int[] need = new int[128];
  for (char c : t.toCharArray()) need[c]++;
  int missing = t.length(), left = 0, start = 0, end = 0;
  for (int right = 1; right <= s.length(); right++) {
    char c = s.charAt(right - 1);
    if (need[c]-- > 0) missing--;
    while (missing == 0) {
      if (end == 0 || right - left < end - start) { start = left; end = right; }
      char lc = s.charAt(left);
      if (++need[lc] > 0) missing++;
      left++;
    }
  }
  return s.substring(start, end);
}
```

**要点：**
- 两个指针各至多前进 n 次，时间 O(n + m)。
- `missing` 让窗口有效性判断为 O(1)，无需逐一比较映射。

**标签：** #algorithm

---

### 15. 除自身以外数组的乘积（Product of Array Except Self）

**难度：** 中等
**主题：** array, prefix-product
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 返回一个数组，其中每个元素是其余所有元素之积，不用除法且 O(n)。

**思路：** 两次遍历——先从左到右存前缀积，再从右到左用一个运行变量乘上后缀积。时间 O(n)，额外空间 O(1)（不计输出）。

**Python：**
```python
def product_except_self(nums: list[int]) -> list[int]:
    n = len(nums)
    out = [1] * n
    for i in range(1, n):
        out[i] = out[i - 1] * nums[i - 1]
    suffix = 1
    for i in range(n - 1, -1, -1):
        out[i] *= suffix
        suffix *= nums[i]
    return out
```

**TypeScript：**
```typescript
function productExceptSelf(nums: number[]): number[] {
  const n = nums.length, out = new Array(n).fill(1);
  for (let i = 1; i < n; i++) out[i] = out[i - 1] * nums[i - 1];
  let suffix = 1;
  for (let i = n - 1; i >= 0; i--) { out[i] *= suffix; suffix *= nums[i]; }
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
  int suffix = 1;
  for (int i = n - 1; i >= 0; i--) { out[i] *= suffix; suffix *= nums[i]; }
  return out;
}
```

**要点：**
- 两次线性遍历，时间 O(n)、额外空间 O(1)。
- 不用除法，使其对输入中的零也稳健。

**标签：** #algorithm

---

### 16. 搜索旋转排序数组（Search in Rotated Sorted Array）

**难度：** 中等
**主题：** binary-search, array
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 一个有序数组在未知支点处被旋转。找目标值下标，不存在则返回 -1。

**思路：** 改进的二分查找——每个中点处必有一半是有序的；判断目标是否落在那半有序区间内来选择方向。时间 O(log n)，空间 O(1)。

**Python：**
```python
def search(nums: list[int], target: int) -> int:
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = lo + (hi - lo) // 2
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
    const mid = lo + ((hi - lo) >> 1);
    if (nums[mid] === target) return mid;
    if (nums[lo] <= nums[mid]) {
      if (nums[lo] <= target && target < nums[mid]) hi = mid - 1; else lo = mid + 1;
    } else {
      if (nums[mid] < target && target <= nums[hi]) lo = mid + 1; else hi = mid - 1;
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
    int mid = lo + (hi - lo) / 2;
    if (nums[mid] == target) return mid;
    if (nums[lo] <= nums[mid]) {
      if (nums[lo] <= target && target < nums[mid]) hi = mid - 1; else lo = mid + 1;
    } else {
      if (nums[mid] < target && target <= nums[hi]) lo = mid + 1; else hi = mid - 1;
    }
  }
  return -1;
}
```

**要点：**
- 尽管发生旋转，仍是 O(log n) 时间、O(1) 空间。
- 先判断哪半有序，再用该半的边界检验目标。

**标签：** #algorithm

---

### 17. 在排序数组中查找元素的首末位置（Find First and Last Position of Element）

**难度：** 中等
**主题：** binary-search, array
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 在有序数组中找目标的首、末下标，不存在则返回 `[-1, -1]`。

**思路：** 两次二分查找分别求目标的下界与上界。时间 O(log n)，空间 O(1)。

**Python：**
```python
import bisect

def search_range(nums: list[int], target: int) -> list[int]:
    lo = bisect.bisect_left(nums, target)
    if lo == len(nums) or nums[lo] != target:
        return [-1, -1]
    hi = bisect.bisect_right(nums, target) - 1
    return [lo, hi]
```

**TypeScript：**
```typescript
function searchRange(nums: number[], target: number): number[] {
  const bound = (left: boolean): number => {
    let lo = 0, hi = nums.length, res = -1;
    while (lo < hi) {
      const mid = lo + ((hi - lo) >> 1);
      if (nums[mid] < target || (!left && nums[mid] === target)) lo = mid + 1;
      else hi = mid;
      if (nums[mid] === target) res = mid;
    }
    return res;
  };
  return [bound(true), bound(false)];
}
```

**Java：**
```java
int[] searchRange(int[] nums, int target) {
  int first = bound(nums, target, true);
  if (first == -1) return new int[] { -1, -1 };
  return new int[] { first, bound(nums, target, false) };
}

int bound(int[] nums, int target, boolean left) {
  int lo = 0, hi = nums.length - 1, res = -1;
  while (lo <= hi) {
    int mid = lo + (hi - lo) / 2;
    if (nums[mid] == target) { res = mid; if (left) hi = mid - 1; else lo = mid + 1; }
    else if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return res;
}
```

**要点：**
- 两次有界二分，时间 O(log n)、空间 O(1)。
- 下界与上界仅在相等时指针移动方向不同。

**标签：** #algorithm

---

### 18. 环形链表（Linked List Cycle）

**难度：** 简单
**主题：** linked-list, two-pointer, floyd
**岗位：** OD / SWE
**级别：** 13-14（初级）

**问题：** 判断链表是否存在环。

**思路：** Floyd 龟兔指针——慢指针每次走一步，快指针每次两步；当且仅当有环时二者相遇。时间 O(n)，空间 O(1)。

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
class ListNode {
  val: number; next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) { this.val = val; this.next = next; }
}

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
class ListNode {
  int val; ListNode next;
  ListNode(int val) { this.val = val; }
}

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
- 双指针检测时间 O(n)、空间 O(1)，无需哈希集合。
- 快指针守住 `fast` 与 `fast.next`，避免空指针解引用。

**标签：** #algorithm

---

### 19. 删除链表的倒数第 N 个节点（Remove Nth Node From End of List）

**难度：** 中等
**主题：** linked-list, two-pointer
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 一趟遍历删除单链表的倒数第 n 个节点。

**思路：** 前导指针先走 n 步，然后前导与尾随指针同步前进，直到前导到末尾；此时尾随指针恰在目标节点前。用哑头处理删除头节点的边界。时间 O(n)，空间 O(1)。

**Python：**
```python
class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val, self.next = val, next

def remove_nth_from_end(head: ListNode | None, n: int) -> ListNode | None:
    dummy = ListNode(0, head)
    lead = lag = dummy
    for _ in range(n):
        lead = lead.next
    while lead.next:
        lead = lead.next
        lag = lag.next
    lag.next = lag.next.next
    return dummy.next
```

**TypeScript：**
```typescript
class ListNode {
  val: number; next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) { this.val = val; this.next = next; }
}

function removeNthFromEnd(head: ListNode | null, n: number): ListNode | null {
  const dummy = new ListNode(0, head);
  let lead: ListNode | null = dummy, lag: ListNode = dummy;
  for (let i = 0; i < n; i++) lead = lead!.next;
  while (lead!.next) { lead = lead!.next; lag = lag.next!; }
  lag.next = lag.next!.next;
  return dummy.next;
}
```

**Java：**
```java
class ListNode {
  int val; ListNode next;
  ListNode(int val) { this.val = val; }
  ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

ListNode removeNthFromEnd(ListNode head, int n) {
  ListNode dummy = new ListNode(0, head), lead = dummy, lag = dummy;
  for (int i = 0; i < n; i++) lead = lead.next;
  while (lead.next != null) { lead = lead.next; lag = lag.next; }
  lag.next = lag.next.next;
  return dummy.next;
}
```

**要点：**
- 两指针固定 n 间隔，实现一趟 O(n) 解法、O(1) 空间。
- 哑头消除了删除原头节点的特例。

**标签：** #algorithm

---

### 20. 合并 K 个有序链表（Merge k Sorted Lists）

**难度：** 困难
**主题：** linked-list, heap, divide-and-conquer
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 将 k 个有序链表合并为一个有序链表。

**思路：** 用当前各表头组成最小堆；弹出最小者，推入其后继，拼接到结果。总节点数为 N 时时间 O(N log k)，空间 O(k)。

**Python：**
```python
import heapq

class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val, self.next = val, next

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
  const nodes: ListNode[] = [];
  for (const l of lists) { let c = l; while (c) { nodes.push(c); c = c.next; } }
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
class ListNode {
  int val; ListNode next;
  ListNode(int val) { this.val = val; }
}

ListNode mergeKLists(ListNode[] lists) {
  PriorityQueue<ListNode> pq = new PriorityQueue<>((a, b) -> a.val - b.val);
  for (ListNode l : lists) if (l != null) pq.add(l);
  ListNode dummy = new ListNode(0), tail = dummy;
  while (!pq.isEmpty()) {
    ListNode node = pq.poll();
    tail.next = node;
    tail = node;
    if (node.next != null) pq.add(node.next);
  }
  return dummy.next;
}
```

**要点：**
- k 大小的堆给出 O(N log k) 时间、O(k) 空间。
- 无堆库时，TypeScript 版收集后排序为 O(N log N)。

**标签：** #algorithm

---

### 21. 翻转二叉树（Invert Binary Tree）

**难度：** 简单
**主题：** tree, recursion, dfs
**岗位：** OD / SWE
**级别：** 13-14（初级）

**问题：** 翻转二叉树（镜像左右子树）。

**思路：** 在每个节点递归交换左右孩子。时间 O(n)，递归栈空间 O(h)。

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
  if (root) {
    const l = invertTree(root.left);
    root.left = invertTree(root.right);
    root.right = l;
  }
  return root;
}
```

**Java：**
```java
class TreeNode {
  int val; TreeNode left, right;
  TreeNode(int val) { this.val = val; }
}

TreeNode invertTree(TreeNode root) {
  if (root != null) {
    TreeNode l = invertTree(root.right);
    root.right = invertTree(root.left);
    root.left = l;
  }
  return root;
}
```

**要点：**
- 每个节点访问一次，时间 O(n)；递归深度 O(h) 空间。
- 用显式栈或队列可得到相同结果的迭代写法。

**标签：** #algorithm

---

### 22. 二叉树的最大深度（Maximum Depth of Binary Tree）

**难度：** 简单
**主题：** tree, dfs, recursion
**岗位：** OD / SWE
**级别：** 13-14（初级）

**问题：** 返回二叉树的最大深度（最长根到叶路径上的节点数）。

**思路：** 深度为 `1 + max(深度(左), 深度(右))`。时间 O(n)，空间 O(h)。

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
class TreeNode {
  val: number; left: TreeNode | null; right: TreeNode | null;
  constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val; this.left = left; this.right = right;
  }
}

function maxDepth(root: TreeNode | null): number {
  if (!root) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```

**Java：**
```java
class TreeNode {
  int val; TreeNode left, right;
  TreeNode(int val) { this.val = val; }
}

int maxDepth(TreeNode root) {
  if (root == null) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```

**要点：**
- 后序递归每个节点访问一次：时间 O(n)、空间 O(h)。
- 最坏情况斜树会使栈深度达到 O(n)。

**标签：** #algorithm

---

### 23. 验证二叉搜索树（Validate Binary Search Tree）

**难度：** 中等
**主题：** tree, dfs, bst
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 判断一棵二叉树是否为合法的 BST。

**思路：** 递归时携带开区间 `(low, high)`；每个节点值须严格落在区间内，向下递归时收紧边界。时间 O(n)，空间 O(h)。

**Python：**
```python
class TreeNode:
    def __init__(self, val: int = 0, left=None, right=None) -> None:
        self.val, self.left, self.right = val, left, right

def is_valid_bst(root: TreeNode | None) -> bool:
    def check(node, lo, hi):
        if not node:
            return True
        if not (lo < node.val < hi):
            return False
        return check(node.left, lo, node.val) and check(node.right, node.val, hi)
    return check(root, float("-inf"), float("inf"))
```

**TypeScript：**
```typescript
class TreeNode {
  val: number; left: TreeNode | null; right: TreeNode | null;
  constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val; this.left = left; this.right = right;
  }
}

function isValidBST(root: TreeNode | null): boolean {
  const check = (n: TreeNode | null, lo: number, hi: number): boolean => {
    if (!n) return true;
    if (n.val <= lo || n.val >= hi) return false;
    return check(n.left, lo, n.val) && check(n.right, n.val, hi);
  };
  return check(root, -Infinity, Infinity);
}
```

**Java：**
```java
class TreeNode {
  int val; TreeNode left, right;
  TreeNode(int val) { this.val = val; }
}

boolean isValidBST(TreeNode root) {
  return check(root, Long.MIN_VALUE, Long.MAX_VALUE);
}

boolean check(TreeNode n, long lo, long hi) {
  if (n == null) return true;
  if (n.val <= lo || n.val >= hi) return false;
  return check(n.left, lo, n.val) && check(n.right, n.val, hi);
}
```

**要点：**
- 一次有界 DFS 遍历，时间 O(n)、空间 O(h)。
- 仅做逐节点比较不够，边界必须自祖先向下传播。

**标签：** #algorithm

---

### 24. 二叉树的层序遍历（Binary Tree Level Order Traversal）

**难度：** 中等
**主题：** tree, bfs, queue
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 自顶向下逐层返回节点值。

**思路：** 用队列做 BFS，每轮外循环处理完整的一层。时间 O(n)，空间 O(n)。

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
            n = q.popleft()
            level.append(n.val)
            if n.left:
                q.append(n.left)
            if n.right:
                q.append(n.right)
        res.append(level)
    return res
```

**TypeScript：**
```typescript
class TreeNode {
  val: number; left: TreeNode | null; right: TreeNode | null;
  constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val; this.left = left; this.right = right;
  }
}

function levelOrder(root: TreeNode | null): number[][] {
  if (!root) return [];
  const res: number[][] = [];
  let q: TreeNode[] = [root];
  while (q.length) {
    const level: number[] = [], next: TreeNode[] = [];
    for (const n of q) {
      level.push(n.val);
      if (n.left) next.push(n.left);
      if (n.right) next.push(n.right);
    }
    res.push(level);
    q = next;
  }
  return res;
}
```

**Java：**
```java
class TreeNode {
  int val; TreeNode left, right;
  TreeNode(int val) { this.val = val; }
}

List<List<Integer>> levelOrder(TreeNode root) {
  List<List<Integer>> res = new ArrayList<>();
  if (root == null) return res;
  Queue<TreeNode> q = new LinkedList<>();
  q.add(root);
  while (!q.isEmpty()) {
    int size = q.size();
    List<Integer> level = new ArrayList<>();
    for (int i = 0; i < size; i++) {
      TreeNode n = q.poll();
      level.add(n.val);
      if (n.left != null) q.add(n.left);
      if (n.right != null) q.add(n.right);
    }
    res.add(level);
  }
  return res;
}
```

**要点：**
- BFS 每个节点访问一次：时间 O(n)、队列空间 O(n)。
- 每层快照队列大小可将各层区分开。

**标签：** #algorithm

---

### 25. 二叉树的最近公共祖先（Lowest Common Ancestor of a Binary Tree）

**难度：** 中等
**主题：** tree, dfs, recursion
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 在二叉树（不一定是 BST）中找两个节点的最近公共祖先。

**思路：** 后序递归；若某节点的两个子树各自包含一个目标（或它本身就是目标），则它即为 LCA。时间 O(n)，空间 O(h)。

**Python：**
```python
class TreeNode:
    def __init__(self, val: int = 0, left=None, right=None) -> None:
        self.val, self.left, self.right = val, left, right

def lowest_common_ancestor(root, p, q):
    if root is None or root is p or root is q:
        return root
    left = lowest_common_ancestor(root.left, p, q)
    right = lowest_common_ancestor(root.right, p, q)
    if left and right:
        return root
    return left or right
```

**TypeScript：**
```typescript
class TreeNode {
  val: number; left: TreeNode | null; right: TreeNode | null;
  constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val; this.left = left; this.right = right;
  }
}

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
class TreeNode {
  int val; TreeNode left, right;
  TreeNode(int val) { this.val = val; }
}

TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
  if (root == null || root == p || root == q) return root;
  TreeNode left = lowestCommonAncestor(root.left, p, q);
  TreeNode right = lowestCommonAncestor(root.right, p, q);
  if (left != null && right != null) return root;
  return left != null ? left : right;
}
```

**要点：**
- 一次后序遍历，时间 O(n)、空间 O(h)。
- 两个子树都返回非空即定位到分叉节点 = LCA。

**标签：** #algorithm

---

### 26. 岛屿数量（Number of Islands）

**难度：** 中等
**主题：** graph, dfs, bfs, grid, union-find
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 统计由 `'1'`（陆地）组成的连通块数量，网格由 `'1'`/`'0'` 构成。

**思路：** 扫描网格；遇到未访问的陆地格就用洪水填充（DFS/BFS）整座岛并计数，把访问过的陆地沉为 `'0'`。时间 O(行·列)，最坏空间 O(行·列)。

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
  const sink = (r: number, c: number): void => {
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

void sink(char[][] g, int r, int c) {
  if (r < 0 || c < 0 || r >= g.length || c >= g[0].length || g[r][c] != '1') return;
  g[r][c] = '0';
  sink(g, r + 1, c); sink(g, r - 1, c); sink(g, r, c + 1); sink(g, r, c - 1);
}
```

**要点：**
- 每个格子被访问常数次：时间 O(行·列)。
- 单个超大岛时递归深度（或队列）可达 O(行·列)。

**标签：** #algorithm

---

### 27. 腐烂的橘子（Rotting Oranges）

**难度：** 中等
**主题：** graph, bfs, grid
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 网格含空/新鲜/腐烂橘子，每分钟腐烂橘子使其上下左右 4 个邻居腐烂。返回直到无新鲜橘子的分钟数，不可能则返回 -1。

**思路：** 从所有腐烂橘子同时出发做多源 BFS；统计层数（分钟）。若 BFS 后仍有新鲜橘子则返回 -1。时间 O(行·列)，空间 O(行·列)。

**Python：**
```python
from collections import deque

def oranges_rotting(grid: list[list[int]]) -> int:
    rows, cols = len(grid), len(grid[0])
    q = deque()
    fresh = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 2:
                q.append((r, c))
            elif grid[r][c] == 1:
                fresh += 1
    minutes = 0
    while q and fresh:
        minutes += 1
        for _ in range(len(q)):
            r, c = q.popleft()
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1:
                    grid[nr][nc] = 2
                    fresh -= 1
                    q.append((nr, nc))
    return minutes if fresh == 0 else -1
```

**TypeScript：**
```typescript
function orangesRotting(grid: number[][]): number {
  const rows = grid.length, cols = grid[0].length;
  let q: [number, number][] = [], fresh = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 2) q.push([r, c]);
      else if (grid[r][c] === 1) fresh++;
    }
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let minutes = 0;
  while (q.length && fresh) {
    minutes++;
    const next: [number, number][] = [];
    for (const [r, c] of q)
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nc >= 0 && nr < rows && nc < cols && grid[nr][nc] === 1) {
          grid[nr][nc] = 2; fresh--; next.push([nr, nc]);
        }
      }
    q = next;
  }
  return fresh === 0 ? minutes : -1;
}
```

**Java：**
```java
int orangesRotting(int[][] grid) {
  int rows = grid.length, cols = grid[0].length, fresh = 0;
  Queue<int[]> q = new LinkedList<>();
  for (int r = 0; r < rows; r++)
    for (int c = 0; c < cols; c++) {
      if (grid[r][c] == 2) q.add(new int[] { r, c });
      else if (grid[r][c] == 1) fresh++;
    }
  int[][] dirs = { { 1, 0 }, { -1, 0 }, { 0, 1 }, { 0, -1 } };
  int minutes = 0;
  while (!q.isEmpty() && fresh > 0) {
    minutes++;
    for (int i = q.size(); i > 0; i--) {
      int[] cell = q.poll();
      for (int[] d : dirs) {
        int nr = cell[0] + d[0], nc = cell[1] + d[1];
        if (nr >= 0 && nc >= 0 && nr < rows && nc < cols && grid[nr][nc] == 1) {
          grid[nr][nc] = 2; fresh--; q.add(new int[] { nr, nc });
        }
      }
    }
  }
  return fresh == 0 ? minutes : -1;
}
```

**要点：**
- 多源 BFS 每个格子处理一次：时间和空间均为 O(行·列)。
- 统计新鲜橘子数可 O(1) 检测不可达情形。

**标签：** #algorithm

---

### 28. 课程表（Course Schedule）

**难度：** 中等
**主题：** graph, topological-sort, bfs
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 给定 `numCourses` 及先修课对，判断能否修完所有课程（即依赖图无环）。

**思路：** Kahn 算法——计算入度，反复移除入度为 0 的节点；若全部移除则无环。时间 O(V + E)，空间 O(V + E)。

**Python：**
```python
from collections import deque

def can_finish(num_courses: int, prerequisites: list[list[int]]) -> bool:
    graph = [[] for _ in range(num_courses)]
    indeg = [0] * num_courses
    for course, pre in prerequisites:
        graph[pre].append(course)
        indeg[course] += 1
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
  for (const [course, pre] of prerequisites) { graph[pre].push(course); indeg[course]++; }
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
  for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) q.add(i);
  int seen = 0;
  while (!q.isEmpty()) {
    int node = q.poll();
    seen++;
    for (int nxt : graph.get(node)) if (--indeg[nxt] == 0) q.add(nxt);
  }
  return seen == numCourses;
}
```

**要点：**
- Kahn 拓扑排序时间 O(V + E)、空间 O(V + E)。
- 若处理的节点少于 `numCourses`，说明存在环。

**标签：** #algorithm

---

### 29. 单词搜索（Word Search）

**难度：** 中等
**主题：** backtracking, dfs, grid
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 给定字母网格和一个单词，判断能否由相邻格子（不重复使用同一格）拼出该单词。

**思路：** 从每个格子做 DFS 回溯，递归期间标记格子已访问，返回时还原。最坏时间 O(行·列·4^L)，空间 O(L)。

**Python：**
```python
def exist(board: list[list[str]], word: str) -> bool:
    rows, cols = len(board), len(board[0])

    def dfs(r, c, i):
        if i == len(word):
            return True
        if r < 0 or c < 0 or r >= rows or c >= cols or board[r][c] != word[i]:
            return False
        tmp, board[r][c] = board[r][c], "#"
        found = (dfs(r + 1, c, i + 1) or dfs(r - 1, c, i + 1) or
                 dfs(r, c + 1, i + 1) or dfs(r, c - 1, i + 1))
        board[r][c] = tmp
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

boolean dfs(char[][] b, String w, int r, int c, int i) {
  if (i == w.length()) return true;
  if (r < 0 || c < 0 || r >= b.length || c >= b[0].length || b[r][c] != w.charAt(i)) return false;
  char tmp = b[r][c];
  b[r][c] = '#';
  boolean found = dfs(b, w, r + 1, c, i + 1) || dfs(b, w, r - 1, c, i + 1) ||
                  dfs(b, w, r, c + 1, i + 1) || dfs(b, w, r, c - 1, i + 1);
  b[r][c] = tmp;
  return found;
}
```

**要点：**
- 回溯最多探索 O(行·列·4^L) 条路径；递归深度 O(L)。
- 标记并还原格子，无需额外内存即可保证不重复使用。

**标签：** #algorithm

---

### 30. 组合总和（Combination Sum）

**难度：** 中等
**主题：** backtracking, recursion
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 给定互异正整数候选和目标值，返回所有和为目标值的不重复组合；每个候选可重复使用。

**思路：** DFS 回溯；每步可重复使用当前候选，或前移起始下标以避免排列重复。最坏时间 O(2^t)，递归深度空间 O(t)。

**Python：**
```python
def combination_sum(candidates: list[int], target: int) -> list[list[int]]:
    res: list[list[int]] = []

    def dfs(start, remain, path):
        if remain == 0:
            res.append(path[:])
            return
        for i in range(start, len(candidates)):
            if candidates[i] <= remain:
                path.append(candidates[i])
                dfs(i, remain - candidates[i], path)
                path.pop()

    dfs(0, target, [])
    return res
```

**TypeScript：**
```typescript
function combinationSum(candidates: number[], target: number): number[][] {
  const res: number[][] = [];
  const dfs = (start: number, remain: number, path: number[]): void => {
    if (remain === 0) { res.push([...path]); return; }
    for (let i = start; i < candidates.length; i++) {
      if (candidates[i] <= remain) {
        path.push(candidates[i]);
        dfs(i, remain - candidates[i], path);
        path.pop();
      }
    }
  };
  dfs(0, target, []);
  return res;
}
```

**Java：**
```java
List<List<Integer>> combinationSum(int[] candidates, int target) {
  List<List<Integer>> res = new ArrayList<>();
  dfs(candidates, 0, target, new ArrayList<>(), res);
  return res;
}

void dfs(int[] cand, int start, int remain, List<Integer> path, List<List<Integer>> res) {
  if (remain == 0) { res.add(new ArrayList<>(path)); return; }
  for (int i = start; i < cand.length; i++) {
    if (cand[i] <= remain) {
      path.add(cand[i]);
      dfs(cand, i, remain - cand[i], path, res);
      path.remove(path.size() - 1);
    }
  }
}
```

**要点：**
- 回溯最多探索 O(2^t) 个状态；路径深度 O(t)。
- 传入 `i`（而非 `i+1`）允许重复使用；前移起始下标避免重复集合。

**标签：** #algorithm

---

### 31. 全排列（Permutations）

**难度：** 中等
**主题：** backtracking, recursion
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 返回一组互异整数的所有排列。

**思路：** 用 used 标记（或原地交换）回溯；每层固定一个元素。时间 O(n·n!)，空间 O(n)。

**Python：**
```python
def permute(nums: list[int]) -> list[list[int]]:
    res: list[list[int]] = []

    def dfs(path, used):
        if len(path) == len(nums):
            res.append(path[:])
            return
        for i, x in enumerate(nums):
            if not used[i]:
                used[i] = True
                path.append(x)
                dfs(path, used)
                path.pop()
                used[i] = False

    dfs([], [False] * len(nums))
    return res
```

**TypeScript：**
```typescript
function permute(nums: number[]): number[][] {
  const res: number[][] = [];
  const used = new Array(nums.length).fill(false);
  const dfs = (path: number[]): void => {
    if (path.length === nums.length) { res.push([...path]); return; }
    for (let i = 0; i < nums.length; i++) {
      if (!used[i]) {
        used[i] = true; path.push(nums[i]);
        dfs(path);
        path.pop(); used[i] = false;
      }
    }
  };
  dfs([]);
  return res;
}
```

**Java：**
```java
List<List<Integer>> permute(int[] nums) {
  List<List<Integer>> res = new ArrayList<>();
  dfs(nums, new boolean[nums.length], new ArrayList<>(), res);
  return res;
}

void dfs(int[] nums, boolean[] used, List<Integer> path, List<List<Integer>> res) {
  if (path.size() == nums.length) { res.add(new ArrayList<>(path)); return; }
  for (int i = 0; i < nums.length; i++) {
    if (!used[i]) {
      used[i] = true; path.add(nums[i]);
      dfs(nums, used, path, res);
      path.remove(path.size() - 1); used[i] = false;
    }
  }
}
```

**要点：**
- 共有 n! 个排列，每个复制 O(n)，故时间 O(n·n!)、额外空间 O(n)。
- `used` 数组防止在一个排列内重复使用某元素。

**标签：** #algorithm

---

### 32. 子集（Subsets）

**难度：** 中等
**主题：** backtracking, bit-manipulation
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 返回一组互异整数的所有子集（幂集）。

**思路：** 回溯在每个节点记录当前路径，并通过递增起始下标在"选/不选"间分支。时间 O(n·2^n)，空间 O(n)。

**Python：**
```python
def subsets(nums: list[int]) -> list[list[int]]:
    res: list[list[int]] = []

    def dfs(start, path):
        res.append(path[:])
        for i in range(start, len(nums)):
            path.append(nums[i])
            dfs(i + 1, path)
            path.pop()

    dfs(0, [])
    return res
```

**TypeScript：**
```typescript
function subsets(nums: number[]): number[][] {
  const res: number[][] = [];
  const dfs = (start: number, path: number[]): void => {
    res.push([...path]);
    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]);
      dfs(i + 1, path);
      path.pop();
    }
  };
  dfs(0, []);
  return res;
}
```

**Java：**
```java
List<List<Integer>> subsets(int[] nums) {
  List<List<Integer>> res = new ArrayList<>();
  dfs(nums, 0, new ArrayList<>(), res);
  return res;
}

void dfs(int[] nums, int start, List<Integer> path, List<List<Integer>> res) {
  res.add(new ArrayList<>(path));
  for (int i = start; i < nums.length; i++) {
    path.add(nums[i]);
    dfs(nums, i + 1, path, res);
    path.remove(path.size() - 1);
  }
}
```

**要点：**
- 共有 2^n 个子集，每个复制至多 O(n)：时间 O(n·2^n)。
- 等价做法是把每个子集映射为一个 n 位掩码。

**标签：** #algorithm

---

### 33. 零钱兑换（Coin Change）

**难度：** 中等
**主题：** dynamic-programming
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 给定硬币面额和金额，返回凑出该金额的最少硬币数，不可能则返回 -1。

**思路：** 自底向上 DP，`dp[a]` 为金额 `a` 的最少硬币数；对每个硬币做松弛。时间 O(金额·硬币数)，空间 O(金额)。

**Python：**
```python
def coin_change(coins: list[int], amount: int) -> int:
    dp = [amount + 1] * (amount + 1)
    dp[0] = 0
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a:
                dp[a] = min(dp[a], dp[a - c] + 1)
    return dp[amount] if dp[amount] <= amount else -1
```

**TypeScript：**
```typescript
function coinChange(coins: number[], amount: number): number {
  const dp = new Array(amount + 1).fill(amount + 1);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++)
    for (const c of coins)
      if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
  return dp[amount] <= amount ? dp[amount] : -1;
}
```

**Java：**
```java
int coinChange(int[] coins, int amount) {
  int[] dp = new int[amount + 1];
  Arrays.fill(dp, amount + 1);
  dp[0] = 0;
  for (int a = 1; a <= amount; a++)
    for (int c : coins)
      if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
  return dp[amount] <= amount ? dp[amount] : -1;
}
```

**要点：**
- DP 表时间 O(金额·硬币数)、空间 O(金额)。
- 用 `amount + 1` 初始化充当无穷大，使不可达金额保持 -1。

**标签：** #algorithm

---

### 34. 最长递增子序列（Longest Increasing Subsequence）

**难度：** 中等
**主题：** dynamic-programming, binary-search
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 求最长严格递增子序列的长度。

**思路：** 耐心排序——维护 `tails`，`tails[i]` 为长度 `i+1` 的递增子序列可能的最小尾值；对每个元素二分查找插入位置。时间 O(n log n)，空间 O(n)。

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
    tails[lo] = x;
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
- 每个元素二分查找，时间 O(n log n)、空间 O(n)，优于 O(n^2) DP。
- `tails` 并非真正的子序列，但其长度等于答案。

**标签：** #algorithm

---

### 35. 打家劫舍（House Robber）

**难度：** 中等
**主题：** dynamic-programming
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 给定一排房屋的金额，在不偷相邻两户的前提下最大化收益。

**思路：** DP 递推 `rob(i) = max(rob(i-1), rob(i-2) + nums[i])`，滚动为两个变量。时间 O(n)，空间 O(1)。

**Python：**
```python
def rob(nums: list[int]) -> int:
    prev, cur = 0, 0
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
- 滚动两个状态变量，时间 O(n)、空间 O(1)。
- 每户的选择是"偷并跳过邻居"还是"跳过"。

**标签：** #algorithm

---

### 36. 单词拆分（Word Break）

**难度：** 中等
**主题：** dynamic-programming, string
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 给定字符串和字典，判断字符串能否切分为字典中单词的序列。

**思路：** DP，`dp[i]` 表示长度为 `i` 的前缀可切分；对每个 `i` 尝试每个切点 `j`，要求 `dp[j]` 为真且 `s[j:i]` 在集合中。时间 O(n^2)（外加子串成本），空间 O(n)。

**Python：**
```python
def word_break(s: str, word_dict: list[str]) -> bool:
    words = set(word_dict)
    dp = [False] * (len(s) + 1)
    dp[0] = True
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
  for (let i = 1; i <= s.length; i++)
    for (let j = 0; j < i; j++)
      if (dp[j] && words.has(s.slice(j, i))) { dp[i] = true; break; }
  return dp[s.length];
}
```

**Java：**
```java
boolean wordBreak(String s, List<String> wordDict) {
  Set<String> words = new HashSet<>(wordDict);
  boolean[] dp = new boolean[s.length() + 1];
  dp[0] = true;
  for (int i = 1; i <= s.length(); i++)
    for (int j = 0; j < i; j++)
      if (dp[j] && words.contains(s.substring(j, i))) { dp[i] = true; break; }
  return dp[s.length()];
}
```

**要点：**
- 嵌套循环给出 O(n^2) 个切分、O(n) 空间。
- 用字典树或以最长单词长度限制内层，可削减冗余检查。

**标签：** #algorithm

---

### 37. 合并区间（Merge Intervals）

**难度：** 中等
**主题：** intervals, sorting
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 给定若干区间，合并所有重叠的区间。

**思路：** 按起点排序；扫描时若下一区间与上一已合并区间重叠则扩展其终点，否则新增。时间 O(n log n)，空间 O(n)。

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
    const last = out[out.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else out.push([s, e]);
  }
  return out;
}
```

**Java：**
```java
int[][] merge(int[][] intervals) {
  Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
  List<int[]> out = new ArrayList<>();
  for (int[] iv : intervals) {
    if (!out.isEmpty() && iv[0] <= out.get(out.size() - 1)[1])
      out.get(out.size() - 1)[1] = Math.max(out.get(out.size() - 1)[1], iv[1]);
    else out.add(iv);
  }
  return out.toArray(new int[0][]);
}
```

**要点：**
- 排序占主导，时间 O(n log n)；输出 O(n) 空间。
- 排序后，重叠就是简单的 `start <= last_end` 判断。

**标签：** #algorithm

---

### 38. 前 K 个高频元素（Top K Frequent Elements）

**难度：** 中等
**主题：** heap, hash-table, bucket-sort
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 返回数组中出现频率最高的 k 个元素。

**思路：** 统计频次，再按频率桶排序（下标 = 计数），从高到低读取桶。时间 O(n)，空间 O(n)。堆解法为 O(n log k)。

**Python：**
```python
from collections import Counter

def top_k_frequent(nums: list[int], k: int) -> list[int]:
    counts = Counter(nums)
    buckets: list[list[int]] = [[] for _ in range(len(nums) + 1)]
    for val, freq in counts.items():
        buckets[freq].append(val)
    res: list[int] = []
    for freq in range(len(buckets) - 1, 0, -1):
        for val in buckets[freq]:
            res.append(val)
            if len(res) == k:
                return res
    return res
```

**TypeScript：**
```typescript
function topKFrequent(nums: number[], k: number): number[] {
  const counts = new Map<number, number>();
  for (const x of nums) counts.set(x, (counts.get(x) ?? 0) + 1);
  const buckets: number[][] = Array.from({ length: nums.length + 1 }, () => []);
  for (const [val, freq] of counts) buckets[freq].push(val);
  const res: number[] = [];
  for (let f = buckets.length - 1; f > 0 && res.length < k; f--)
    for (const val of buckets[f]) { res.push(val); if (res.length === k) return res; }
  return res;
}
```

**Java：**
```java
int[] topKFrequent(int[] nums, int k) {
  Map<Integer, Integer> counts = new HashMap<>();
  for (int x : nums) counts.merge(x, 1, Integer::sum);
  List<Integer>[] buckets = new List[nums.length + 1];
  for (var e : counts.entrySet()) {
    int f = e.getValue();
    if (buckets[f] == null) buckets[f] = new ArrayList<>();
    buckets[f].add(e.getKey());
  }
  int[] res = new int[k];
  int idx = 0;
  for (int f = buckets.length - 1; f > 0 && idx < k; f--)
    if (buckets[f] != null)
      for (int val : buckets[f]) { if (idx == k) break; res[idx++] = val; }
  return res;
}
```

**要点：**
- 按频率桶排序，时间 O(n)、空间 O(n)。
- 替代方案是大小为 k 的最小堆，时间 O(n log k)。

**标签：** #algorithm

---

### 39. 只出现一次的数字（Single Number）

**难度：** 简单
**主题：** bit-manipulation, array
**岗位：** OD / SWE
**级别：** 13-14（初级）

**问题：** 除一个元素外其余都出现两次。在 O(n) 时间、O(1) 空间内找出那个唯一的数。

**思路：** 对所有元素求 XOR；成对的相消为 0，留下唯一值。时间 O(n)，空间 O(1)。

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
- XOR 满足结合律且自反，时间 O(n)、空间 O(1)。
- 无需哈希集合或排序——纯位运算。

**标签：** #algorithm

---

### 40. 实现 Trie（前缀树）（Implement Trie）

**难度：** 中等
**主题：** trie, design, string
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 实现带 `insert`、`search`、`startsWith` 的字典树。

**思路：** 每个节点持有子链接和词尾标记；操作时每字符走一个节点。每次操作时间 O(L)，空间 O(总字符数)。

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

    def _find(self, prefix: str) -> "Trie | None":
        node = self
        for c in prefix:
            if c not in node.children:
                return None
            node = node.children[c]
        return node

    def search(self, word: str) -> bool:
        node = self._find(word)
        return node is not None and node.end

    def starts_with(self, prefix: str) -> bool:
        return self._find(prefix) is not None
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

  private find(prefix: string): Trie | null {
    let node: Trie = this;
    for (const c of prefix) {
      const next = node.children.get(c);
      if (!next) return null;
      node = next;
    }
    return node;
  }

  search(word: string): boolean {
    const node = this.find(word);
    return node !== null && node.end;
  }

  startsWith(prefix: string): boolean {
    return this.find(prefix) !== null;
  }
}
```

**Java：**
```java
class Trie {
  private final Map<Character, Trie> children = new HashMap<>();
  private boolean end = false;

  void insert(String word) {
    Trie node = this;
    for (char c : word.toCharArray())
      node = node.children.computeIfAbsent(c, k -> new Trie());
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

  boolean search(String word) {
    Trie node = find(word);
    return node != null && node.end;
  }

  boolean startsWith(String prefix) {
    return find(prefix) != null;
  }
}
```

**要点：**
- 每次操作走 L 个节点，时间 O(L)；空间 O(插入的总字符数)。
- 词尾标记区分"存储的单词"与"仅是前缀"。

**标签：** #algorithm

---

### 41. 省份数量（并查集）（Number of Provinces）

**难度：** 中等
**主题：** union-find, graph, dsu
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 给定 `n x n` 邻接矩阵，`isConnected[i][j] == 1` 表示城市 i 与 j 直接相连，返回连通省份的数量。

**思路：** 带路径压缩与按秩合并的并查集；对每对相连城市做合并，再统计不同的根。近线性时间 O(n^2·α(n))，空间 O(n)。

**Python：**
```python
def find_circle_num(is_connected: list[list[int]]) -> int:
    n = len(is_connected)
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a, b):
        parent[find(a)] = find(b)

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
  const union = (a: number, b: number): void => { parent[find(a)] = find(b); };
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      if (isConnected[i][j]) union(i, j);
  let count = 0;
  for (let i = 0; i < n; i++) if (find(i) === i) count++;
  return count;
}
```

**Java：**
```java
int findCircleNum(int[][] isConnected) {
  int n = isConnected.length;
  int[] parent = new int[n];
  for (int i = 0; i < n; i++) parent[i] = i;
  for (int i = 0; i < n; i++)
    for (int j = i + 1; j < n; j++)
      if (isConnected[i][j] == 1) parent[find(parent, i)] = find(parent, j);
  int count = 0;
  for (int i = 0; i < n; i++) if (find(parent, i) == i) count++;
  return count;
}

int find(int[] parent, int x) {
  while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
  return x;
}
```

**要点：**
- 路径压缩使每次操作近 O(1) 摊还（α(n)）；总体 O(n^2·α(n))。
- 合并全部完成后统计根即得省份数，耗时 O(n)。

**标签：** #algorithm

---

### 42. 数组中的第 K 个最大元素（Kth Largest Element in an Array）

**难度：** 中等
**主题：** heap, quickselect, sorting
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 返回未排序数组中第 k 大的元素。

**思路：** 维护大小为 k 的最小堆；处理完所有元素后堆顶即为答案。时间 O(n log k)，空间 O(k)。快速选择平均 O(n)。

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
  // O(n log n) sort fallback when no heap library is available.
  return nums.slice().sort((a, b) => b - a)[k - 1];
}
```

**Java：**
```java
int findKthLargest(int[] nums, int k) {
  PriorityQueue<Integer> heap = new PriorityQueue<>();
  for (int x : nums) {
    heap.add(x);
    if (heap.size() > k) heap.poll();
  }
  return heap.peek();
}
```

**要点：**
- 大小为 k 的最小堆，时间 O(n log k)、空间 O(k)。
- 快速选择平均 O(n)，但坏支点会退化到 O(n^2)。

**标签：** #algorithm

---

### 43. 基站覆盖合并（电信）（Base-Station Coverage Merge）

**难度：** 中等
**主题：** intervals, sorting, greedy
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 每个基站覆盖一条公路的一维区段 `[start, end]`。给定所有覆盖区段，将其合并为最少的连续覆盖范围集合，并报告总覆盖长度（用于检测覆盖空隙）。

**思路：** 这是合并区间的电信包装。按起点排序区段，扫描合并重叠，并累加合并后的长度。时间 O(n log n)，空间 O(n)。

**Python：**
```python
def covered_ranges(segments: list[list[int]]) -> tuple[list[list[int]], int]:
    segments.sort()
    merged: list[list[int]] = []
    for s, e in segments:
        if merged and s <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], e)
        else:
            merged.append([s, e])
    total = sum(e - s for s, e in merged)
    return merged, total
```

**TypeScript：**
```typescript
function coveredRanges(segments: number[][]): { merged: number[][]; total: number } {
  segments.sort((a, b) => a[0] - b[0]);
  const merged: number[][] = [];
  for (const [s, e] of segments) {
    const last = merged[merged.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else merged.push([s, e]);
  }
  const total = merged.reduce((sum, [s, e]) => sum + (e - s), 0);
  return { merged, total };
}
```

**Java：**
```java
int coveredLength(int[][] segments) {
  Arrays.sort(segments, (a, b) -> a[0] - b[0]);
  int total = 0, curStart = 0, curEnd = -1;
  for (int[] seg : segments) {
    if (seg[0] > curEnd) {
      if (curEnd >= curStart) total += curEnd - curStart;
      curStart = seg[0]; curEnd = seg[1];
    } else {
      curEnd = Math.max(curEnd, seg[1]);
    }
  }
  if (curEnd >= curStart) total += curEnd - curStart;
  return total;
}
```

**要点：**
- 排序加一次线性扫描，时间 O(n log n)、空间 O(n)。
- 空隙表现为合并范围之间的断裂——正是覆盖缺失之处。

**标签：** #algorithm

---

### 44. 数据包路由最短路径（Dijkstra）（Packet Routing Shortest Path）

**难度：** 中等
**主题：** graph, dijkstra, heap, shortest-path
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 由 `n` 个路由器组成的网络，链路有正时延。求一个数据包从源路由器到每个其他路由器的最小总时延；不可达的路由器报告为无穷大。

**思路：** 用 Dijkstra 加最小堆做单源最短路径。建邻接表，松弛邻居，跳过过期的堆条目。时间 O((V + E) log V)，空间 O(V + E)。

**Python：**
```python
import heapq

def shortest_latencies(n: int, links: list[tuple[int, int, int]], src: int) -> list[float]:
    graph: list[list[tuple[int, int]]] = [[] for _ in range(n)]
    for u, v, w in links:
        graph[u].append((v, w))
        graph[v].append((u, w))
    dist = [float("inf")] * n
    dist[src] = 0
    heap = [(0, src)]
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]:
            continue
        for v, w in graph[u]:
            if d + w < dist[v]:
                dist[v] = d + w
                heapq.heappush(heap, (dist[v], v))
    return dist
```

**TypeScript：**
```typescript
function shortestLatencies(n: number, links: [number, number, number][], src: number): number[] {
  const graph: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of links) { graph[u].push([v, w]); graph[v].push([u, w]); }
  const dist = new Array(n).fill(Infinity);
  dist[src] = 0;
  // Simple array-based priority queue (fine for interview clarity).
  const heap: [number, number][] = [[0, src]];
  while (heap.length) {
    heap.sort((a, b) => a[0] - b[0]);
    const [d, u] = heap.shift()!;
    if (d > dist[u]) continue;
    for (const [v, w] of graph[u])
      if (d + w < dist[v]) { dist[v] = d + w; heap.push([dist[v], v]); }
  }
  return dist;
}
```

**Java：**
```java
int[] shortestLatencies(int n, int[][] links, int src) {
  List<int[]>[] graph = new List[n];
  for (int i = 0; i < n; i++) graph[i] = new ArrayList<>();
  for (int[] l : links) { graph[l[0]].add(new int[] { l[1], l[2] }); graph[l[1]].add(new int[] { l[0], l[2] }); }
  int[] dist = new int[n];
  Arrays.fill(dist, Integer.MAX_VALUE);
  dist[src] = 0;
  PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
  pq.add(new int[] { 0, src });
  while (!pq.isEmpty()) {
    int[] top = pq.poll();
    int d = top[0], u = top[1];
    if (d > dist[u]) continue;
    for (int[] e : graph[u])
      if (d + e[1] < dist[e[0]]) { dist[e[0]] = d + e[1]; pq.add(new int[] { dist[e[0]], e[0] }); }
  }
  return dist;
}
```

**要点：**
- 带二叉堆的 Dijkstra，时间 O((V + E) log V)、空间 O(V + E)。
- 要求权重为正；存在负时延则需 Bellman-Ford。

**标签：** #algorithm

---

### 45. 电信信号任务调度（贪心 + 堆）（Telecom Signal Task Scheduling）

**难度：** 中等
**主题：** heap, greedy, intervals
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 调度器需运行信号处理任务，每个任务有 `[start, end]` 时间窗。若两个任务时间窗重叠则不能在同一处理单元上运行。求运行全部任务所需的最少处理单元数。

**思路：** 等价于"会议室 II"。按起点排序任务；用结束时间的最小堆。对每个任务，释放结束时间 ≤ 当前起点的单元，再分配；堆的峰值大小即为答案。时间 O(n log n)，空间 O(n)。

**Python：**
```python
import heapq

def min_units(tasks: list[list[int]]) -> int:
    tasks.sort()
    ends: list[int] = []
    for start, end in tasks:
        if ends and ends[0] <= start:
            heapq.heapreplace(ends, end)
        else:
            heapq.heappush(ends, end)
    return len(ends)
```

**TypeScript：**
```typescript
function minUnits(tasks: number[][]): number {
  tasks.sort((a, b) => a[0] - b[0]);
  const ends: number[] = []; // min-heap emulated; kept sorted for clarity
  for (const [start, end] of tasks) {
    ends.sort((a, b) => a - b);
    if (ends.length && ends[0] <= start) ends[0] = end;
    else ends.push(end);
  }
  return ends.length;
}
```

**Java：**
```java
int minUnits(int[][] tasks) {
  Arrays.sort(tasks, (a, b) -> a[0] - b[0]);
  PriorityQueue<Integer> ends = new PriorityQueue<>();
  for (int[] t : tasks) {
    if (!ends.isEmpty() && ends.peek() <= t[0]) ends.poll();
    ends.add(t[1]);
  }
  return ends.size();
}
```

**要点：**
- 排序加堆操作，时间 O(n log n)、空间 O(n)。
- 最小堆的峰值大小等于最大同时重叠数 = 所需单元数。

**标签：** #algorithm

---

### 46. 5G 资源块分配（区间调度）（5G Resource-Block Allocation）

**难度：** 中等
**主题：** greedy, intervals, activity-selection
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 一个 5G 载波每个时隙仅有一个资源块。给定若干传输请求，每个为 `[start, end]`，在该单一资源块上调度最多数量的互不重叠传输。

**思路：** 经典活动选择——按结束时间排序请求，贪心选取每个起点 ≥ 上一所选结束时间的请求。时间 O(n log n)，空间 O(1)。

**Python：**
```python
def max_transmissions(requests: list[list[int]]) -> int:
    requests.sort(key=lambda r: r[1])
    count, last_end = 0, float("-inf")
    for start, end in requests:
        if start >= last_end:
            count += 1
            last_end = end
    return count
```

**TypeScript：**
```typescript
function maxTransmissions(requests: number[][]): number {
  requests.sort((a, b) => a[1] - b[1]);
  let count = 0, lastEnd = -Infinity;
  for (const [start, end] of requests) {
    if (start >= lastEnd) { count++; lastEnd = end; }
  }
  return count;
}
```

**Java：**
```java
int maxTransmissions(int[][] requests) {
  Arrays.sort(requests, (a, b) -> a[1] - b[1]);
  int count = 0, lastEnd = Integer.MIN_VALUE;
  for (int[] r : requests) {
    if (r[0] >= lastEnd) { count++; lastEnd = r[1]; }
  }
  return count;
}
```

**要点：**
- 按结束时间排序再贪心选取，时间 O(n log n)、额外空间 O(1)。
- 选最早结束的请求为其余留出最多空间——这正是其最优性的交换论证。

**标签：** #algorithm

---

### 47. 设计电信计费系统

**难度：** 困难
**主题：** system-design, billing, streaming, consistency
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 为数亿用户设计一个运营商级计费系统，计量通话、短信、流量使用并生成准确的月度账单。

**思路：** 使用事件（CDR——话单详单）从网元流入高吞吐摄入层（Kafka）。计费引擎对每个事件应用资费方案（按秒语音、按 MB 流量、促销）并将已定价事件写入按用户分区的用量存储。聚合管道把用量汇总到计费周期桶；周期结束时出账。关键权衡：精确一次 vs 至少一次加上对 CDR id 的幂等去重（重复扣费不可接受）；预付费的近实时余额（低延迟内存计数器加周期性对账）vs 后付费的批处理；可审计性（不可变事件日志，每笔扣费可追溯）。讨论迟到/乱序 CDR、资费版本管理，以及与网络自身计数器对账以发现收入流失。

**标签：** #system-design

---

### 48. 设计 HarmonyOS 分布式软总线 / 跨设备数据同步

**难度：** 困难
**主题：** system-design, distributed, sync, iot
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 设计 HarmonyOS 的分布式软总线，让多台附近设备（手机、平板、电视、手表）互相发现并共享状态/数据，仿佛是同一个逻辑设备。

**思路：** 分层：(1) 多传输（BLE、Wi-Fi、NFC）的设备发现，统一寻址；(2) 安全的会话/认证层（设备证书、信任环），只有用户自己的设备能加入；(3) 传输抽象的"软总线"，自动选择最优物理链路并隐藏切换（如随带宽需求增长从 BLE → Wi-Fi Direct）；(4) 分布式数据对象层，提供最终一致的共享状态及冲突解决。权衡：间歇连接下的一致性 vs 可用性（偏 AP，用 CRDT 或带向量时钟的最后写入获胜）；延迟 vs 功耗（BLE 低功耗但慢）；安全（每次跨设备调用都须认证并加密）。讨论无缝应用迁移（状态序列化并在目标设备重建）以及设备重新加入时的分区愈合。

**标签：** #system-design

---

### 49. 设计 5G 基站 OTA 固件升级系统

**难度：** 困难
**主题：** system-design, ota, rollout, reliability
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 设计一个系统，将空中（OTA）固件升级安全地推送到数百万个 5G 基站，且不中断在网运营商流量。

**思路：** 中央发布服务把已签名固件构件存于对象存储并经 CDN 分发；基站采取拉取（而非推送）以规避入站防火墙问题。分阶段灰度：金丝雀 → 小范围区域 → 渐进波次，波次之间设自动健康门禁（KPI：掉话率、吞吐、错误日志），出现回退则自动暂停/回滚。每个基站采用 A/B 分区方案——写入非活动槽位，校验校验和+签名，原子切换，看门狗在新镜像无法启动时自动回退到 A 槽。权衡：带宽 vs 速度（差分/增量升级减小载荷）、维护窗口 vs 持续服务（重启前把流量疏导到邻区）、安全（签名镜像、防回滚版本计数器）。讨论不稳定链路的幂等重试以及跟踪各基站状态的灰度看板。

**标签：** #system-design

---

### 50. 设计 CDN

**难度：** 困难
**主题：** system-design, cdn, caching, dns
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 设计一个内容分发网络，以低延迟向全球用户提供静态资源（及视频）。

**思路：** 边缘 PoP（接入点）层级，后接区域中间层缓存和源站。请求路由通过 anycast 或基于 DNS 的地理路由，把用户引导到最近的健康边缘。缓存策略：LRU/LFU 淘汰、TTL 加源站再校验（ETag / If-None-Match）、缓存键归一化。缓存未命中 → 从中间层 → 源站拉取（回源填充），并用请求合并防止冷门热点对象引发惊群。权衡：一致性 vs 新鲜度（TTL 调优、显式清除/失效 API）、存储成本 vs 命中率、缓存踩踏处理。讨论大文件/视频分片缓存（HLS/DASH 切片）、访问控制的签名 URL，以及流量峰值时保护源站的源站护盾。

**标签：** #system-design

---

### 51. 设计分布式消息队列

**难度：** 困难
**主题：** system-design, messaging, replication, ordering
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 设计一个类 Kafka 的分布式消息队列，支持高吞吐发布/订阅，并提供持久化与顺序保证。

**思路：** 主题拆分为分区；每个分区是仅追加日志，跨 broker 复制，含一个 leader 和若干 follower（ISR——同步副本集）。生产者追加到 leader；消费者跟踪自己的偏移量并拉取。仅保证分区内顺序。持久化通过复制因子和可配置的 acks（acks=all 等待 ISR）。权衡：吞吐 vs 持久化（acks 与 fsync 策略）、顺序 vs 并行（分区越多并行越高，但仅分区内有序）、至少一次 vs 精确一次（幂等生产者 + 事务提交）。讨论消费者组与再平衡、保留策略（按时间/大小的日志压缩）、背压，以及 leader 选举（经 ZooKeeper/Raft 等协调服务）如何处理 broker 故障。

**标签：** #system-design

---

### 52. 设计华为云对象存储（OBS）

**难度：** 困难
**主题：** system-design, blob-storage, erasure-coding, consistency
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 设计华为云 OBS——一个兼容 S3 的对象存储服务。

**思路：** 兼容 S3 的 API 前端 → 元数据服务（按 bucket+key 分片，区域内经共识组强一致）→ 存储层使用纠删码（如 Reed-Solomon 10+4）跨节点/机架/可用区条带化，以约 1.4 倍开销（相对 3 倍复制）获得持久性。大对象用分段上传；生命周期策略把冷数据降级到归档存储。权衡：纠删码（省存储，重构时 CPU/网络更高）vs 复制（更简单、读更快、成本更高）；跨区域复制的强一致 vs 最终一致（容灾用异步）。讨论热点键处理（CDN + 读副本）、应对位腐的后台巡检/修复、访问控制的签名 URL，以及通过冗余与持续完整性校验达成 11 个 9 的持久性目标。

**标签：** #system-design

---

### 53. 设计实时物联网设备管理平台

**难度：** 困难
**主题：** system-design, iot, mqtt, time-series
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 设计一个平台，实时连接、监控并控制数千万台物联网设备（传感器、智能电表）。

**思路：** 设备经 MQTT（轻量、发布/订阅、QoS 等级）通过横向扩展的连接网关接入，网关维持数百万长连接（基于 epoll，连接状态存于分布式存储）。遥测数据流入流处理器 → 时序数据库（降采样、分级保留）；命令经按设备主题下行到设备。设备注册表/影子保存期望态 vs 上报态，使控制在设备短暂离线时仍可工作（重连时对账）。权衡：MQTT QoS 0/1/2（投递保证 vs 开销）、命令的推 vs 拉、连接密度 vs 单连接成本。讨论固件 OTA（复用第 49 题模式）、认证（每设备证书）、对异常设备群的限流，以及按设备 id 对遥测分区以扩展。

**标签：** #system-design

---

### 54. 设计运营商网络的高可用数据库

**难度：** 困难
**主题：** system-design, database, replication, consensus
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 设计一个支撑运营商用户数据（类 HLR/HSS）的高可用数据库，须满足五个 9（99.999%）可用性。

**思路：** 区域内用共识协议（Raft/Paxos）做同步复制，使多数派在单节点故障下存活且无数据丢失（RPO=0）。跨可用区多副本；故障时自动 leader 选举，在数秒内保持写可用（低 RTO）。异地容灾用异步复制到远端区域。读扩展通过 follower 读（接受轻微陈旧）或读己之写路由到 leader。权衡：同步（强一致、写延迟高）vs 异步（更快、有丢数据风险），以及 CAP 取舍——运营商数据在区域内偏 CP。讨论用户查询的表设计（按 IMSI/用户 id 分片）、海量并发的连接池、不停机的在线变更，以及严格的故障切换演练（五个 9 每年仅允许约 5 分钟停机）。

**标签：** #system-design

---

### 55. 谈谈拥抱"奋斗者"文化

**难度：** 中等
**主题：** behavioral, culture, dedication
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 华为以"奋斗者"文化著称。讲一次你远超预期去拿到结果的经历。

**思路：** 华为探查真实的内驱力，又不想听到表演式回答。用 STAR：选一个你主动承担更多范围或攻克难题的真实情形（而不只是"我加了班"）。展示：(1) 具体挑战与利害，(2) 你额外付出的努力与担当，(3) 你是聪明地干而非只是埋头苦干——你做了优先级和取舍，(4) 可量化的结果及所学。对可持续性要诚实；优秀候选人展现的是奉献加判断力，而非为加班而加班。

**标签：** #behavioral

---

### 56. 在高压期限下交付的经历

**难度：** 中等
**主题：** behavioral, pressure, delivery
**岗位：** OD / SWE
**级别：** 15-16（高级）

**问题：** 描述一次你必须在极大时间压力下交付关键功能或修复的经历。你如何应对？

**思路：** 展现镇定与优先级排序。STAR：(1) 期限及其重要性（客户承诺、发布、故障），(2) 你如何分诊——收敛到必做项、协商砍掉的范围、并行推进，(3) 你如何在压力下保持可接受的质量（聚焦测试高风险路径、清晰沟通取舍），(4) 结果及复盘洞见。除非你明确反思教训，否则避免选择因自身规划不善而导致紧张的故事。

**标签：** #behavioral

---

### 57. 大型组织中的跨团队协作

**难度：** 中等
**主题：** behavioral, collaboration, communication
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 华为是有众多产品线的大型组织。讲一次你必须协调多个优先级冲突的团队来交付某事的经历。

**思路：** 展示你能驾驭规模与模糊。STAR：(1) 跨团队依赖与冲突（不同 OKR、归属不清），(2) 你如何及早建立一致——共同目标、清晰接口/契约、定期同步，(3) 必要时如何建设性地升级（带方案而非只是抱怨），(4) 交付结果及为日后合作保留的关系。强调对对方约束的同理心。

**标签：** #behavioral

---

### 58. 为什么选择华为

**难度：** 简单
**主题：** behavioral, motivation, fit
**岗位：** OD / SWE
**级别：** 13-14（初级）

**问题：** 你为什么特别想加入华为，对哪条业务线感兴趣？

**思路：** 要具体且有备而来。选一个真实理由：(1) 华为领先的技术领域（5G/无线、HarmonyOS、运营商网络、华为云、昇腾 AI 芯片），(2) 规模与硬核工程问题（运营商级可靠性、全球部署），(3) 贴近硬件/系统工作的机会。说出具体 BG/团队并与你的背景关联。避免泛泛而谈（"大公司""薪资好"）；展现你理解华为重研发、长期投入的工程文化。

**标签：** #behavioral

---

### 59. C/C++ 内存管理与指针

**难度：** 困难
**主题：** domain-knowledge, c-cpp, memory, pointers
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 解释 C/C++ 中内存如何管理。常见的指针/内存 bug 有哪些，如何预防或调试？

**思路：** 覆盖内存区域：栈（自动、LIFO、快、有限）、堆（`malloc`/`free`、`new`/`delete`、手动生命周期）、静态/全局、代码段。关键 bug：(1) 内存泄漏——堆已分配但从不释放；(2) 悬垂指针——`free`/`delete` 后仍使用；(3) 双重释放；(4) 缓冲区溢出（越界写——经典安全漏洞）；(5) 未初始化指针；(6) `new[]`/`delete[]` 不匹配。现代 C++ 中的预防：RAII、智能指针（`unique_ptr` 独占所有权、`shared_ptr` 引用计数、`weak_ptr` 打破循环）、用容器替代裸数组、`const` 正确性。调试工具：Valgrind / AddressSanitizer (ASan) 检测泄漏与溢出、静态分析器。提及 `shared_ptr` 循环仍会泄漏（需 `weak_ptr`），以及 ASan 在运行时捕获 use-after-free。华为机试和面试在此考查很重。

**标签：** #domain-knowledge

---

### 60. TCP/IP 网络深挖

**难度：** 困难
**主题：** domain-knowledge, networking, tcp, protocols
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 讲解 TCP 三次握手与连接拆除，并解释 TCP 如何提供可靠性与流量/拥塞控制。

**思路：** 握手：SYN → SYN-ACK → ACK 建立序列号与连接（3 个报文段）。拆除：四次 FIN/ACK，发起方进入 TIME_WAIT 以吸收游离报文（2·MSL）。可靠性：序列号 + 累计 ACK + 超时重传（RTO，由 RTT 估计得出）或收到 3 个重复 ACK 时快速重传。流量控制：接收方通告窗口（rwnd），使快速发送方不会压垮慢速接收方。拥塞控制：发送侧 cwnd，含慢启动（指数）、拥塞避免（线性/AIMD）以及对丢包的反应（CUBIC、BBR）。对比 UDP（无连接、无可靠性/顺序——用于实时/VoIP）。准备讨论队头阻塞、Nagle 算法，以及高 RTT 链路为何损害吞吐（带宽时延积、窗口缩放）。华为运营商/网络岗位对此深挖。

**标签：** #domain-knowledge

---

### 61. Linux 进程、线程与 IPC

**难度：** 困难
**主题：** domain-knowledge, linux, concurrency, ipc
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 解释 Linux 中进程与线程的区别，并比较主要的进程间通信（IPC）机制。

**思路：** 进程有独立地址空间（经 `fork` 创建，写时复制）；线程共享进程地址空间（经 `pthread_create` / 带共享标志的 `clone` 创建），故上下文切换与通信更廉价但需同步。线程共享堆/全局/文件描述符，但各有私有栈与寄存器。IPC 机制及权衡：管道/FIFO（简单字节流，相关或命名）、消息队列（结构化、内核缓冲）、共享内存（最快——无拷贝——但需经信号量/互斥量显式同步）、信号量（信号/计数）、套接字（也可跨机）、信号（异步通知、载荷有限）。同步原语：互斥量、自旋锁（忙等，适合极短临界区）、条件变量、读写锁。讨论竞态、死锁（及 Coffman 四条件），以及为何共享内存 + 信号量是运营商常用的高性能选择。提及用于可扩展 I/O 多路复用的 `epoll`。

**标签：** #domain-knowledge

---

### 62. 操作系统概念

**难度：** 困难
**主题：** domain-knowledge, operating-systems, scheduling, memory
**岗位：** Senior SWE
**级别：** 17-18（专家）

**问题：** 解释虚拟内存与分页，并描述现代操作系统中的 CPU 调度如何工作。

**思路：** 虚拟内存给每个进程一个私有线性地址空间，经页表映射到物理帧；MMU 完成地址转换，TLB 缓存近期转换。缺页触发从磁盘加载（按需分页）；内存满时 OS 用替换策略（如时钟算法等 LRU 近似）淘汰页。好处：隔离、看似多于物理的内存、易于共享（共享库）。当工作集超过 RAM 时发生抖动。调度：调度器在就绪线程间复用 CPU——策略包括轮转、优先级，以及 Linux 的 CFS（完全公平调度器），它用按虚拟运行时间为键的红黑树近似公平共享。讨论抢占式 vs 协作式、上下文切换成本、实时调度类（SCHED_FIFO/RR 用于确定性延迟——与电信/嵌入式相关），以及吞吐与延迟/公平性的权衡。回到嵌入式/运营商系统为何常需实时保证。

**标签：** #domain-knowledge
