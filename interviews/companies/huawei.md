# Huawei (华为)

```yaml
company: Huawei (Carrier Networks, HarmonyOS / Consumer BG, Huawei Cloud, 5G/Wireless, Hardware/Embedded)
typical_rounds: 1 OD/机试 (online coding assessment) + 2-4 technical (技术面) + cross-team (交叉面) + HR/department director (主管面)
focus_areas: C/C++, algorithms (机试), operating systems, TCP/IP networking, embedded/telecom, distributed systems
languages_allowed: C/C++ most common (esp. carrier/embedded); Java/Python/Go for cloud and tooling
duration: 机试 ~150 min (3 problems); each interview round 45-60 min
notable_quirks:
  - 机试 (OD 机试) is a must-pass coding gate — typically 3 algorithm problems in ~150 min, weighted scoring
  - Distinction between OD (外包/Outsourcing Dispatch) and 正编 (regular headcount) roles — different process and treatment
  - Heavy C/C++ pointer and manual memory-management questions; segfault / leak debugging probed
  - OS and networking deep-dives (process vs thread, IPC, TCP three-way handshake, congestion control) common
  - 奋斗者协议 (dedicator agreement) and long-hours culture probed in behavioral
  - Strong telecom / 5G / HarmonyOS distributed domain context in system design
sources: LeetCode Discuss (huawei tag), 牛客网 (NowCoder), 一亩三分地 (1point3acres), Glassdoor
```

## Overview

Huawei's loop is distinctive for its heavy, must-pass 机试 (online coding assessment) — usually three algorithm problems in roughly 150 minutes, and a weak score here often ends the process before any human interview. C/C++ is the dominant language, especially for carrier-network and embedded teams, so expect manual memory management, pointer arithmetic, and segfault/leak debugging alongside standard data-structure problems. Interviewers probe operating-system and TCP/IP networking fundamentals far more than US companies do. System design is grounded in Huawei's domains: telecom billing, 5G base stations, HarmonyOS distributed soft-bus, and carrier-grade high availability. Behavioral rounds explore the 奋斗者 ("dedicator/striver") culture and willingness to work under high pressure.

## Questions

### 1. Two Sum

**Difficulty:** Easy
**Topics:** array, hash-table
**Position:** OD / SWE
**Years:** 13-14 (Junior)

**Question:** Given an integer array `nums` and a target, return the indices of the two numbers that add up to the target. Exactly one solution exists; you may not use the same element twice.

**Approach:** One-pass hash map from value → index. For each element check whether `target - x` was already seen; if so return both indices. Time O(n), space O(n) — a typical 机试 warm-up.

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

**Key points:**
- Single pass with a hash map gives O(n) time and O(n) space versus the O(n^2) brute force.
- Store each value only after checking, so you never pair an element with itself.

**Follow-ups:**
- Return all unique pairs that sum to target (sort + two pointers).
- Input is sorted — solve in O(1) extra space with two pointers.
- 3Sum / 4Sum generalization.
- Stream of numbers — design an `add`/`find` online structure.

**Tags:** #algorithm

---

### 2. Valid Parentheses

**Difficulty:** Easy
**Topics:** string, stack
**Position:** OD / SWE
**Years:** 13-14 (Junior)

**Question:** Given a string of `()[]{}`, determine if the brackets are validly matched and nested.

**Approach:** Push opening brackets onto a stack; on a closing bracket, pop and compare. Valid only if every close matches the top and the stack is empty at the end. Time O(n), space O(n).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Stack models nesting; time and space are both O(n).
- Must check the stack is empty at the end, not just per-character.

**Follow-ups:**
- Return the minimum insertions to make the string valid.
- Longest valid parentheses substring (DP / stack of indices).
- Support arbitrary bracket types defined at runtime.
- Validate with a streaming input and bounded memory.

**Tags:** #algorithm

---

### 3. Reverse Linked List

**Difficulty:** Easy
**Topics:** linked-list, two-pointer
**Position:** OD / SWE
**Years:** 13-14 (Junior)

**Question:** Reverse a singly linked list and return the new head.

**Approach:** Iterate with `prev`/`curr` pointers, flipping each `next` pointer in place. Time O(n), space O(1). A staple of Huawei C/C++ 机试 — interviewers may ask for the recursive variant too.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- In-place pointer flipping is O(n) time, O(1) space.
- Save `next` before overwriting it or you lose the rest of the list.

**Follow-ups:**
- Reverse only nodes between positions m and n.
- Reverse in groups of k (Reverse Nodes in k-Group).
- Do it recursively and discuss the O(n) call-stack space.
- Detect and handle a cycle before reversing.

**Tags:** #algorithm

---

### 4. Merge Two Sorted Lists

**Difficulty:** Easy
**Topics:** linked-list, two-pointer
**Position:** OD / SWE
**Years:** 13-14 (Junior)

**Question:** Merge two sorted linked lists into one sorted list and return its head.

**Approach:** Dummy head, walk both lists splicing the smaller node each step, then attach the remaining tail. Time O(n + m), space O(1).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Dummy head avoids special-casing the first node; O(n + m) time, O(1) space.
- Attach the non-empty remainder in one step instead of looping.

**Follow-ups:**
- Merge k sorted lists with a heap in O(N log k).
- Merge in descending order.
- Merge two sorted arrays in place.
- Make the merge stable when values are equal.

**Tags:** #algorithm

---

### 5. Best Time to Buy and Sell Stock

**Difficulty:** Easy
**Topics:** array, dynamic-programming
**Position:** OD / SWE
**Years:** 13-14 (Junior)

**Question:** Given daily prices, find the maximum profit from one buy and one later sell. Return 0 if no profit is possible.

**Approach:** Track the minimum price so far; at each day compute profit against that minimum and keep the best. Time O(n), space O(1).

**Python:**
```python
def max_profit(prices: list[int]) -> int:
    best, lo = 0, float("inf")
    for p in prices:
        lo = min(lo, p)
        best = max(best, p - lo)
    return best
```

**TypeScript:**
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

**Java:**
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

**Key points:**
- Single pass tracking the running minimum is O(n) time, O(1) space.
- Buy must precede sell, which the running-minimum invariant guarantees.

**Follow-ups:**
- Unlimited transactions (sum every positive delta).
- At most k transactions (DP, O(nk)).
- Add a transaction fee or a cooldown day.
- Return the actual buy/sell day indices.

**Tags:** #algorithm

---

### 6. Binary Search

**Difficulty:** Easy
**Topics:** binary-search, array
**Position:** OD / SWE
**Years:** 13-14 (Junior)

**Question:** Given a sorted array and a target, return its index or -1 if absent.

**Approach:** Maintain `[lo, hi]` bounds, probe the midpoint, halve the range each step. Use `lo + (hi - lo) // 2` to avoid overflow (relevant in C/C++). Time O(log n), space O(1).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Halving the range yields O(log n) time, O(1) space.
- `lo + (hi - lo) / 2` prevents integer overflow that `(lo + hi) / 2` risks in C/C++/Java.

**Follow-ups:**
- Return the leftmost / rightmost insertion point (lower/upper bound).
- Search in a rotated sorted array.
- Search a value in an infinite/unbounded sorted stream.
- Implement it recursively and discuss stack usage.

**Tags:** #algorithm

---

### 7. Maximum Subarray (Kadane)

**Difficulty:** Medium
**Topics:** array, dynamic-programming
**Position:** OD / SWE
**Years:** 13-14 (Junior)

**Question:** Find the contiguous subarray with the largest sum and return that sum.

**Approach:** Kadane's algorithm — keep a running sum; reset it to the current element whenever extending would lower it. Track the global best. Time O(n), space O(1).

**Python:**
```python
def max_sub_array(nums: list[int]) -> int:
    cur = best = nums[0]
    for x in nums[1:]:
        cur = max(x, cur + x)
        best = max(best, cur)
    return best
```

**TypeScript:**
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

**Java:**
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

**Key points:**
- Kadane runs in O(n) time, O(1) space.
- Initialize with the first element so all-negative arrays return the largest single value.

**Follow-ups:**
- Return the subarray bounds, not just the sum.
- Maximum product subarray (track min and max).
- Maximum circular subarray sum.
- Divide-and-conquer O(n log n) variant and why Kadane wins.

**Tags:** #algorithm

---

### 8. Climbing Stairs

**Difficulty:** Easy
**Topics:** dynamic-programming
**Position:** OD / SWE
**Years:** 13-14 (Junior)

**Question:** You can climb 1 or 2 steps at a time. How many distinct ways to reach the top of `n` stairs?

**Approach:** Fibonacci recurrence `f(n) = f(n-1) + f(n-2)`. Roll two variables to avoid an array. Time O(n), space O(1).

**Python:**
```python
def climb_stairs(n: int) -> int:
    a, b = 1, 1
    for _ in range(n):
        a, b = b, a + b
    return a
```

**TypeScript:**
```typescript
function climbStairs(n: number): number {
  let a = 1, b = 1;
  for (let i = 0; i < n; i++) { [a, b] = [b, a + b]; }
  return a;
}
```

**Java:**
```java
int climbStairs(int n) {
  int a = 1, b = 1;
  for (int i = 0; i < n; i++) {
    int t = a + b; a = b; b = t;
  }
  return a;
}
```

**Key points:**
- Rolling two variables gives O(n) time, O(1) space.
- It is Fibonacci; recognizing the recurrence is the whole insight.

**Follow-ups:**
- Steps of size 1, 2, or 3.
- Each step has a cost — minimize total cost (Min Cost Climbing Stairs).
- Count ways modulo 1e9+7 for large n.
- O(log n) via fast matrix exponentiation.

**Tags:** #algorithm

---

### 9. Valid Anagram

**Difficulty:** Easy
**Topics:** string, hash-table, counting
**Position:** OD / SWE
**Years:** 13-14 (Junior)

**Question:** Given two strings, return whether one is an anagram of the other.

**Approach:** Count character frequencies in the first string, decrement with the second, and verify all counts return to zero. Time O(n), space O(1) for a fixed alphabet.

**Python:**
```python
from collections import Counter

def is_anagram(s: str, t: str) -> bool:
    if len(s) != len(t):
        return False
    return Counter(s) == Counter(t)
```

**TypeScript:**
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

**Java:**
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

**Key points:**
- Frequency counting is O(n) time; a 26-slot array is O(1) space.
- Length mismatch is an instant reject.

**Follow-ups:**
- Support full Unicode instead of lowercase a–z.
- Group all anagrams together (see next question).
- Find all anagram start indices of `p` inside `s` (sliding window).
- Compare ignoring case and whitespace.

**Tags:** #algorithm

---

### 10. Group Anagrams

**Difficulty:** Medium
**Topics:** string, hash-table, sorting
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Group a list of words so that anagrams of each other land in the same group.

**Approach:** Use a canonical key per word — sorted letters, or a 26-count signature — and bucket words in a hash map by that key. Time O(n·k log k) with the sorted key (k = word length), space O(n·k).

**Python:**
```python
from collections import defaultdict

def group_anagrams(words: list[str]) -> list[list[str]]:
    groups: dict[str, list[str]] = defaultdict(list)
    for w in words:
        groups["".join(sorted(w))].append(w)
    return list(groups.values())
```

**TypeScript:**
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

**Java:**
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

**Key points:**
- Sorted-letter key costs O(k log k) per word, O(n·k log k) overall.
- A 26-count signature key lowers per-word cost to O(k), giving O(n·k).

**Follow-ups:**
- Use the count-signature key to drop the log factor.
- Stream words and emit groups incrementally.
- Group by anagram class ignoring case and spaces.
- Return groups sorted by size.

**Tags:** #algorithm

---

### 11. Container With Most Water

**Difficulty:** Medium
**Topics:** array, two-pointer, greedy
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Given heights, pick two lines that with the x-axis form a container holding the most water. Return that maximum area.

**Approach:** Two pointers at both ends; area is `min(h[l], h[r]) * (r - l)`. Move the shorter side inward since it limits the area. Time O(n), space O(1).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Two-pointer sweep is O(n) time, O(1) space versus O(n^2) brute force.
- Moving the taller side can never increase area, so always move the shorter one.

**Tags:** #algorithm

---

### 12. 3Sum

**Difficulty:** Medium
**Topics:** array, two-pointer, sorting
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Find all unique triplets in an array that sum to zero.

**Approach:** Sort, then fix one index and run a two-pointer scan on the remainder, skipping duplicates at every level. Time O(n^2), space O(1) excluding output.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Sorting plus two-pointer scans gives O(n^2) time, O(1) extra space.
- Skipping duplicate values at each level is what keeps triplets unique.

**Tags:** #algorithm

---

### 13. Longest Substring Without Repeating Characters

**Difficulty:** Medium
**Topics:** string, sliding-window, hash-table
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Find the length of the longest substring without repeating characters.

**Approach:** Sliding window with a map from char → last index. When a repeat falls inside the window, jump the left bound past it. Time O(n), space O(min(n, alphabet)).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Each index enters and leaves the window once, so it is O(n) time.
- Jumping `start` past the last occurrence avoids re-scanning the window.

**Tags:** #algorithm

---

### 14. Minimum Window Substring

**Difficulty:** Hard
**Topics:** string, sliding-window, hash-table
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Given strings `s` and `t`, return the smallest substring of `s` containing every character of `t` (with multiplicity), or "" if none exists.

**Approach:** Expand a window to satisfy all required counts, then contract from the left while still valid, tracking the smallest valid window. Time O(n + m), space O(alphabet).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Each pointer advances at most n times, giving O(n + m) time.
- `missing` lets you test window validity in O(1) instead of comparing maps.

**Tags:** #algorithm

---

### 15. Product of Array Except Self

**Difficulty:** Medium
**Topics:** array, prefix-product
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Return an array where each element is the product of all others, without division and in O(n).

**Approach:** Two sweeps — store prefix products left-to-right, then multiply by suffix products right-to-left using a running variable. Time O(n), space O(1) extra (output excluded).

**Python:**
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

**TypeScript:**
```typescript
function productExceptSelf(nums: number[]): number[] {
  const n = nums.length, out = new Array(n).fill(1);
  for (let i = 1; i < n; i++) out[i] = out[i - 1] * nums[i - 1];
  let suffix = 1;
  for (let i = n - 1; i >= 0; i--) { out[i] *= suffix; suffix *= nums[i]; }
  return out;
}
```

**Java:**
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

**Key points:**
- Two linear sweeps give O(n) time and O(1) extra space.
- Avoiding division is what makes it robust to zeros in the input.

**Tags:** #algorithm

---

### 16. Search in Rotated Sorted Array

**Difficulty:** Medium
**Topics:** binary-search, array
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** A sorted array was rotated at an unknown pivot. Find a target's index, or -1.

**Approach:** Modified binary search — at each midpoint one half is sorted; check whether the target lies within that sorted half to pick a side. Time O(log n), space O(1).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Still O(log n) time, O(1) space despite the rotation.
- Decide which half is sorted first, then test the target against that half's bounds.

**Tags:** #algorithm

---

### 17. Find First and Last Position of Element

**Difficulty:** Medium
**Topics:** binary-search, array
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** In a sorted array find the first and last index of a target, or `[-1, -1]`.

**Approach:** Two binary searches for the lower and upper bound of the target. Time O(log n), space O(1).

**Python:**
```python
import bisect

def search_range(nums: list[int], target: int) -> list[int]:
    lo = bisect.bisect_left(nums, target)
    if lo == len(nums) or nums[lo] != target:
        return [-1, -1]
    hi = bisect.bisect_right(nums, target) - 1
    return [lo, hi]
```

**TypeScript:**
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

**Java:**
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

**Key points:**
- Two bounded binary searches keep it at O(log n) time, O(1) space.
- Lower and upper bound differ only in how ties move the pointer.

**Tags:** #algorithm

---

### 18. Linked List Cycle

**Difficulty:** Easy
**Topics:** linked-list, two-pointer, floyd
**Position:** OD / SWE
**Years:** 13-14 (Junior)

**Question:** Determine whether a linked list contains a cycle.

**Approach:** Floyd's tortoise and hare — slow advances one, fast advances two; they meet iff a cycle exists. Time O(n), space O(1).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Two-pointer detection is O(n) time, O(1) space — no hash set needed.
- The fast pointer guards `fast` and `fast.next` to avoid null dereferences.

**Tags:** #algorithm

---

### 19. Remove Nth Node From End of List

**Difficulty:** Medium
**Topics:** linked-list, two-pointer
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Remove the nth node from the end of a singly linked list in one pass.

**Approach:** Advance a lead pointer n steps, then move lead and a trailing pointer together until lead reaches the end; the trailing pointer sits just before the target. Use a dummy head for the edge case of removing the head. Time O(n), space O(1).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- A fixed n-gap between two pointers gives a one-pass O(n) solution, O(1) space.
- The dummy head removes the special case of deleting the original head node.

**Tags:** #algorithm

---

### 20. Merge k Sorted Lists

**Difficulty:** Hard
**Topics:** linked-list, heap, divide-and-conquer
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Merge k sorted linked lists into one sorted list.

**Approach:** Min-heap of the current heads; pop the smallest, push its successor, splice onto the result. Time O(N log k) for N total nodes, space O(k).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- A k-sized heap yields O(N log k) time, O(k) space.
- The TypeScript variant collect-and-sorts in O(N log N) when no heap library is handy.

**Tags:** #algorithm

---

### 21. Invert Binary Tree

**Difficulty:** Easy
**Topics:** tree, recursion, dfs
**Position:** OD / SWE
**Years:** 13-14 (Junior)

**Question:** Invert a binary tree (mirror left and right subtrees).

**Approach:** Recursively swap children at each node. Time O(n), space O(h) for the recursion stack.

**Python:**
```python
class TreeNode:
    def __init__(self, val: int = 0, left=None, right=None) -> None:
        self.val, self.left, self.right = val, left, right

def invert_tree(root: TreeNode | None) -> TreeNode | None:
    if root:
        root.left, root.right = invert_tree(root.right), invert_tree(root.left)
    return root
```

**TypeScript:**
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

**Java:**
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

**Key points:**
- Visiting every node once is O(n) time; recursion depth is O(h) space.
- An explicit stack or queue gives the same result iteratively.

**Tags:** #algorithm

---

### 22. Maximum Depth of Binary Tree

**Difficulty:** Easy
**Topics:** tree, dfs, recursion
**Position:** OD / SWE
**Years:** 13-14 (Junior)

**Question:** Return the maximum depth (number of nodes on the longest root-to-leaf path) of a binary tree.

**Approach:** Depth is `1 + max(depth(left), depth(right))`. Time O(n), space O(h).

**Python:**
```python
class TreeNode:
    def __init__(self, val: int = 0, left=None, right=None) -> None:
        self.val, self.left, self.right = val, left, right

def max_depth(root: TreeNode | None) -> int:
    if not root:
        return 0
    return 1 + max(max_depth(root.left), max_depth(root.right))
```

**TypeScript:**
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

**Java:**
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

**Key points:**
- Post-order recursion touches each node once: O(n) time, O(h) space.
- Worst-case skewed tree makes the stack O(n) deep.

**Tags:** #algorithm

---

### 23. Validate Binary Search Tree

**Difficulty:** Medium
**Topics:** tree, dfs, bst
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Determine whether a binary tree is a valid BST.

**Approach:** Recurse carrying an open `(low, high)` interval; each node's value must lie strictly inside, and bounds tighten as you descend. Time O(n), space O(h).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- One bounded DFS pass is O(n) time, O(h) space.
- Per-node comparison alone is insufficient; bounds must propagate from ancestors.

**Tags:** #algorithm

---

### 24. Binary Tree Level Order Traversal

**Difficulty:** Medium
**Topics:** tree, bfs, queue
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Return the node values level by level, top to bottom.

**Approach:** BFS with a queue, processing one full level per outer iteration. Time O(n), space O(n).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- BFS visits each node once: O(n) time, O(n) queue space.
- Snapshotting the queue size per level keeps levels separated.

**Tags:** #algorithm

---

### 25. Lowest Common Ancestor of a Binary Tree

**Difficulty:** Medium
**Topics:** tree, dfs, recursion
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Find the lowest common ancestor of two nodes in a binary tree (not necessarily a BST).

**Approach:** Post-order recursion; a node is the LCA if its two subtrees each contain one of the targets (or it is one target itself). Time O(n), space O(h).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- One post-order pass is O(n) time, O(h) space.
- Returning a non-null from both subtrees pinpoints the split node = LCA.

**Tags:** #algorithm

---

### 26. Number of Islands

**Difficulty:** Medium
**Topics:** graph, dfs, bfs, grid, union-find
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Count connected groups of `'1'` (land) in a 2D grid of `'1'`/`'0'`.

**Approach:** Scan the grid; on each unvisited land cell, flood-fill (DFS/BFS) its whole island and increment the count, sinking visited land to `'0'`. Time O(rows·cols), space O(rows·cols) worst case.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Each cell is visited a constant number of times: O(rows·cols) time.
- Recursion depth (or queue) can reach O(rows·cols) for one giant island.

**Tags:** #algorithm

---

### 27. Rotting Oranges

**Difficulty:** Medium
**Topics:** graph, bfs, grid
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** In a grid of empty/fresh/rotten oranges, each minute rotten oranges rot their 4-neighbors. Return minutes until none are fresh, or -1 if impossible.

**Approach:** Multi-source BFS starting from all rotten oranges simultaneously; count levels (minutes). If fresh oranges remain after BFS, return -1. Time O(rows·cols), space O(rows·cols).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Multi-source BFS processes each cell once: O(rows·cols) time and space.
- Counting fresh oranges lets you detect the unreachable case in O(1).

**Tags:** #algorithm

---

### 28. Course Schedule

**Difficulty:** Medium
**Topics:** graph, topological-sort, bfs
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Given `numCourses` and prerequisite pairs, decide whether all courses can be finished (i.e. the dependency graph is acyclic).

**Approach:** Kahn's algorithm — compute in-degrees, repeatedly remove zero in-degree nodes; if all nodes are removed there is no cycle. Time O(V + E), space O(V + E).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Kahn's topological sort runs in O(V + E) time and space.
- If fewer than `numCourses` nodes are processed, a cycle exists.

**Tags:** #algorithm

---

### 29. Word Search

**Difficulty:** Medium
**Topics:** backtracking, dfs, grid
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Given a grid of letters and a word, return whether the word can be formed by adjacent cells (no cell reused).

**Approach:** DFS backtracking from each cell, marking the cell visited during recursion and restoring it on return. Time O(rows·cols·4^L) worst case, space O(L).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Backtracking explores up to O(rows·cols·4^L) paths; recursion depth is O(L).
- Marking and restoring the cell enforces the no-reuse rule without extra memory.

**Tags:** #algorithm

---

### 30. Combination Sum

**Difficulty:** Medium
**Topics:** backtracking, recursion
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Given distinct positive candidates and a target, return all unique combinations summing to the target; each candidate may be reused.

**Approach:** DFS backtracking; at each step either reuse the current candidate or advance the start index to avoid permutation duplicates. Time O(2^t) worst case, space O(t) recursion depth.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Backtracking explores up to O(2^t) states; depth is O(t) for the path.
- Passing `i` (not `i+1`) allows reuse; advancing the start prevents duplicate sets.

**Tags:** #algorithm

---

### 31. Permutations

**Difficulty:** Medium
**Topics:** backtracking, recursion
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Return all permutations of a list of distinct integers.

**Approach:** Backtracking with a used-set (or in-place swaps); fix one element per level. Time O(n·n!), space O(n).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- There are n! permutations, each O(n) to copy, so O(n·n!) time, O(n) extra space.
- The `used` array prevents reusing an element within one permutation.

**Tags:** #algorithm

---

### 32. Subsets

**Difficulty:** Medium
**Topics:** backtracking, bit-manipulation
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Return all subsets (the power set) of a list of distinct integers.

**Approach:** Backtracking that records the path at every node and branches by include/exclude through increasing start indices. Time O(n·2^n), space O(n).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- There are 2^n subsets, each up to O(n) to copy: O(n·2^n) time.
- An equivalent solution maps each subset to an n-bit mask.

**Tags:** #algorithm

---

### 33. Coin Change

**Difficulty:** Medium
**Topics:** dynamic-programming
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Given coin denominations and an amount, return the fewest coins to make the amount, or -1 if impossible.

**Approach:** Bottom-up DP where `dp[a]` is the min coins for amount `a`; relax over each coin. Time O(amount·coins), space O(amount).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- The DP table costs O(amount·coins) time, O(amount) space.
- Initializing with `amount + 1` acts as infinity so unreachable amounts stay -1.

**Tags:** #algorithm

---

### 34. Longest Increasing Subsequence

**Difficulty:** Medium
**Topics:** dynamic-programming, binary-search
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Find the length of the longest strictly increasing subsequence.

**Approach:** Patience sorting — maintain `tails`, where `tails[i]` is the smallest possible tail of an increasing subsequence of length `i+1`; binary-search the insertion point per element. Time O(n log n), space O(n).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Binary search per element gives O(n log n) time, O(n) space versus O(n^2) DP.
- `tails` is not the actual subsequence but its length equals the answer.

**Tags:** #algorithm

---

### 35. House Robber

**Difficulty:** Medium
**Topics:** dynamic-programming
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Given house values in a row, maximize the loot without robbing two adjacent houses.

**Approach:** DP recurrence `rob(i) = max(rob(i-1), rob(i-2) + nums[i])`, rolled into two variables. Time O(n), space O(1).

**Python:**
```python
def rob(nums: list[int]) -> int:
    prev, cur = 0, 0
    for x in nums:
        prev, cur = cur, max(cur, prev + x)
    return cur
```

**TypeScript:**
```typescript
function rob(nums: number[]): number {
  let prev = 0, cur = 0;
  for (const x of nums) { const t = Math.max(cur, prev + x); prev = cur; cur = t; }
  return cur;
}
```

**Java:**
```java
int rob(int[] nums) {
  int prev = 0, cur = 0;
  for (int x : nums) { int t = Math.max(cur, prev + x); prev = cur; cur = t; }
  return cur;
}
```

**Key points:**
- Rolling two state variables gives O(n) time, O(1) space.
- The choice at each house is rob-and-skip-neighbor vs skip.

**Tags:** #algorithm

---

### 36. Word Break

**Difficulty:** Medium
**Topics:** dynamic-programming, string
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Given a string and a dictionary, decide whether the string can be segmented into a sequence of dictionary words.

**Approach:** DP where `dp[i]` means the prefix of length `i` is segmentable; for each `i` try every split `j` with `dp[j]` true and `s[j:i]` in the set. Time O(n^2) (plus substring cost), space O(n).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- The nested loops give O(n^2) splits, O(n) space.
- A trie or capping inner length by the longest word trims redundant checks.

**Tags:** #algorithm

---

### 37. Merge Intervals

**Difficulty:** Medium
**Topics:** intervals, sorting
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Given intervals, merge all overlapping ones.

**Approach:** Sort by start; sweep, extending the last merged interval's end when the next overlaps, else append a new one. Time O(n log n), space O(n).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Sorting dominates at O(n log n) time; output is O(n) space.
- After sorting, overlap is a simple `start <= last_end` test.

**Tags:** #algorithm

---

### 38. Top K Frequent Elements

**Difficulty:** Medium
**Topics:** heap, hash-table, bucket-sort
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Return the k most frequent elements in an array.

**Approach:** Count frequencies, then bucket-sort by frequency (index = count) and read buckets from the top. Time O(n), space O(n). A heap variant gives O(n log k).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Bucket sort by frequency achieves O(n) time, O(n) space.
- A size-k min-heap is the alternative at O(n log k) time.

**Tags:** #algorithm

---

### 39. Single Number

**Difficulty:** Easy
**Topics:** bit-manipulation, array
**Position:** OD / SWE
**Years:** 13-14 (Junior)

**Question:** Every element appears twice except one. Find the single one in O(n) time and O(1) space.

**Approach:** XOR all elements; pairs cancel to 0, leaving the unique value. Time O(n), space O(1).

**Python:**
```python
from functools import reduce
from operator import xor

def single_number(nums: list[int]) -> int:
    return reduce(xor, nums, 0)
```

**TypeScript:**
```typescript
function singleNumber(nums: number[]): number {
  return nums.reduce((acc, x) => acc ^ x, 0);
}
```

**Java:**
```java
int singleNumber(int[] nums) {
  int acc = 0;
  for (int x : nums) acc ^= x;
  return acc;
}
```

**Key points:**
- XOR is associative and self-inverse, giving O(n) time, O(1) space.
- No hash set or sorting required — pure bit manipulation.

**Tags:** #algorithm

---

### 40. Implement Trie (Prefix Tree)

**Difficulty:** Medium
**Topics:** trie, design, string
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Implement a trie with `insert`, `search`, and `startsWith`.

**Approach:** Each node holds child links and an end-of-word flag; operations walk one node per character. Time O(L) per operation, space O(total characters).

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

**Java:**
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

**Key points:**
- Each operation walks L nodes, so O(L) time; space is O(total inserted characters).
- The end-of-word flag distinguishes a stored word from a mere prefix.

**Tags:** #algorithm

---

### 41. Number of Provinces (Union-Find)

**Difficulty:** Medium
**Topics:** union-find, graph, dsu
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Given an `n x n` adjacency matrix where `isConnected[i][j] == 1` means cities i and j are directly connected, return the number of connected provinces.

**Approach:** Union-Find with path compression and union by rank; union every connected pair, then count distinct roots. Near-linear time O(n^2·α(n)), space O(n).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Path compression makes each op nearly O(1) amortized (α(n)); total O(n^2·α(n)).
- Counting roots after all unions gives the province count in O(n).

**Tags:** #algorithm

---

### 42. Kth Largest Element in an Array

**Difficulty:** Medium
**Topics:** heap, quickselect, sorting
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Return the kth largest element in an unsorted array.

**Approach:** Maintain a size-k min-heap; the root is the answer after processing all elements. Time O(n log k), space O(k). Quickselect gives O(n) average.

**Python:**
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

**TypeScript:**
```typescript
function findKthLargest(nums: number[], k: number): number {
  // O(n log n) sort fallback when no heap library is available.
  return nums.slice().sort((a, b) => b - a)[k - 1];
}
```

**Java:**
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

**Key points:**
- A size-k min-heap is O(n log k) time, O(k) space.
- Quickselect averages O(n) but degrades to O(n^2) on bad pivots.

**Tags:** #algorithm

---

### 43. Base-Station Coverage Merge (Telecom)

**Difficulty:** Medium
**Topics:** intervals, sorting, greedy
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Each base station covers a 1D segment `[start, end]` of a highway. Given all coverage segments, merge them into the minimal set of continuous covered ranges, then report total covered length (used to detect coverage gaps).

**Approach:** This is Merge Intervals in a telecom wrapper. Sort segments by start, sweep merging overlaps, and accumulate the merged lengths. Time O(n log n), space O(n).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Sorting plus a linear sweep is O(n log n) time, O(n) space.
- Gaps appear as breaks between merged ranges — exactly where coverage is missing.

**Tags:** #algorithm

---

### 44. Packet Routing Shortest Path (Dijkstra)

**Difficulty:** Medium
**Topics:** graph, dijkstra, heap, shortest-path
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** A network of `n` routers has links with positive latencies. Find the minimum total latency to route a packet from a source router to every other router; report unreachable routers as infinity.

**Approach:** Single-source shortest path with Dijkstra and a min-heap. Build an adjacency list, relax neighbors, skip stale heap entries. Time O((V + E) log V), space O(V + E).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Dijkstra with a binary heap is O((V + E) log V) time, O(V + E) space.
- Positive weights are required; negative latencies would need Bellman-Ford.

**Tags:** #algorithm

---

### 45. Telecom Signal Task Scheduling (Greedy + Heap)

**Difficulty:** Medium
**Topics:** heap, greedy, intervals
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** A scheduler must run signal-processing tasks, each with a `[start, end]` window. Two tasks cannot run on the same processing unit if their windows overlap. Find the minimum number of processing units needed to run all tasks.

**Approach:** Equivalent to "meeting rooms II". Sort tasks by start; use a min-heap of end times. For each task, free a unit whose end ≤ current start, then assign; the peak heap size is the answer. Time O(n log n), space O(n).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Sorting plus heap operations give O(n log n) time, O(n) space.
- The min-heap's peak size equals the maximum simultaneous overlap = units needed.

**Tags:** #algorithm

---

### 46. 5G Resource-Block Allocation (Interval Scheduling)

**Difficulty:** Medium
**Topics:** greedy, intervals, activity-selection
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** A 5G carrier has one resource block per time slot. Given transmission requests each as `[start, end]`, schedule the maximum number of non-overlapping transmissions on that single block.

**Approach:** Classic activity selection — sort requests by end time, greedily pick each request whose start is ≥ the last chosen end. Time O(n log n), space O(1).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Sorting by end time then greedy selection is O(n log n) time, O(1) extra space.
- Choosing the earliest finishing request leaves the most room for the rest — the exchange-argument proof of optimality.

**Tags:** #algorithm

---

### 47. Design a Telecom Billing System

**Difficulty:** Hard
**Topics:** system-design, billing, streaming, consistency, big-data
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Design a carrier-grade billing system that meters calls, SMS, and data usage for hundreds of millions of subscribers and produces accurate monthly invoices.

**Approach:** Usage events (CDRs — call detail records) stream from network elements into a high-throughput ingestion layer (Kafka). A rating engine applies tariff plans (per-second voice, per-MB data, promotions) to each event and writes priced events to a usage store partitioned by subscriber. An aggregation pipeline rolls usage into billing-cycle buckets; invoicing runs at cycle close. Critical trade-offs: exactly-once vs at-least-once with idempotent dedup on CDR id (double-charging is unacceptable); near-real-time balance for prepaid (low-latency in-memory counters with periodic reconciliation) vs batch for postpaid; auditability (immutable event log, every charge traceable). Discuss late/out-of-order CDRs, tariff versioning, and reconciliation against the network's own counters to catch revenue leakage.

**Tags:** #system-design

---

### 48. Design HarmonyOS Distributed Soft Bus / Cross-Device Data Sync

**Difficulty:** Hard
**Topics:** system-design, distributed, sync, iot
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Design HarmonyOS's distributed soft bus that lets multiple nearby devices (phone, tablet, TV, watch) discover each other and share state/data as if they were one logical device.

**Approach:** Layers: (1) device discovery over multiple transports (BLE, Wi-Fi, NFC) with a unified addressing scheme; (2) a secure session/authentication layer (device certificates, trust ring) so only the user's own devices join; (3) a transport-abstraction "soft bus" that picks the best physical link and hides handoff (e.g., BLE → Wi-Fi Direct as bandwidth needs grow); (4) a distributed data object layer offering eventually-consistent shared state with conflict resolution. Trade-offs: consistency vs availability under intermittent connectivity (favor AP, use CRDTs or last-writer-wins with vector clocks); latency vs power (BLE is low-power but slow); security (every cross-device call must be authenticated and encrypted). Discuss seamless app migration (state serialized and rehydrated on the target device) and partition healing when a device rejoins.

**Tags:** #system-design

---

### 49. Design a 5G Base-Station OTA Firmware Update System

**Difficulty:** Hard
**Topics:** system-design, ota, rollout, reliability, ops
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Design a system to push over-the-air firmware updates to millions of 5G base stations safely, without dropping live carrier traffic.

**Approach:** Central release service stores signed firmware artifacts in object storage behind a CDN; base stations pull (not push) to avoid inbound firewall issues. Staged rollout: canary → small region → progressive waves, with automated health gates (KPIs: dropped-call rate, throughput, error logs) between waves and automatic halt/rollback on regression. Each station applies updates in an A/B partition scheme — write to the inactive slot, verify checksum + signature, atomic switch, watchdog auto-reverts to slot A if the new image fails to come up. Trade-offs: bandwidth vs speed (delta/differential updates to cut payload), maintenance windows vs continuous service (drain traffic to neighbor cells before reboot), and security (signed images, anti-rollback version counters). Discuss idempotent retries for flaky links and a campaign dashboard tracking per-station state.

**Tags:** #system-design

---

### 50. Design a CDN

**Difficulty:** Hard
**Topics:** system-design, cdn, caching, dns, cloud
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Design a content delivery network that serves static assets (and video) to global users with low latency.

**Approach:** Hierarchy of edge PoPs (points of presence) backed by regional mid-tier caches and the origin. Request routing via anycast or DNS-based geo-routing sends users to the nearest healthy edge. Cache strategy: LRU/LFU eviction, TTL plus origin revalidation (ETag / If-None-Match), and cache-key normalization. Cache miss → pull from mid-tier → origin (cache-fill), with request collapsing to prevent a thundering herd on a cold popular object. Trade-offs: consistency vs freshness (TTL tuning, explicit purge/invalidation API), storage cost vs hit ratio, and handling cache stampedes. Discuss large-file/video segment caching (HLS/DASH chunks), signed URLs for access control, and origin shielding to protect the origin during traffic spikes.

**Tags:** #system-design

---

### 51. Design a Distributed Message Queue

**Difficulty:** Hard
**Topics:** system-design, messaging, replication, ordering
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Design a Kafka-like distributed message queue supporting high-throughput publish/subscribe with durability and ordering guarantees.

**Approach:** Topics split into partitions; each partition is an append-only log replicated across brokers with a leader and followers (ISR — in-sync replicas). Producers append to the leader; consumers track their own offsets and pull. Ordering is guaranteed within a partition only. Durability via replication factor and configurable acks (ack=all waits for ISR). Trade-offs: throughput vs durability (acks and fsync policy), ordering vs parallelism (more partitions = more parallelism but only per-partition order), and at-least-once vs exactly-once (idempotent producers + transactional commits). Discuss consumer groups and rebalancing, retention (time/size-based log compaction), back-pressure, and how a leader election (via a coordination service like ZooKeeper/Raft) handles broker failure.

**Tags:** #system-design

---

### 52. Design Huawei Cloud Object Storage (OBS)

**Difficulty:** Hard
**Topics:** system-design, blob-storage, erasure-coding, consistency, cloud
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Design Huawei Cloud OBS — an S3-compatible object storage service.

**Approach:** S3-compatible API front end → metadata service (sharded by bucket+key, strongly consistent within a region via a consensus group) → storage layer using erasure coding (e.g., Reed-Solomon 10+4) striped across nodes/racks/AZs for durability with ~1.4x overhead vs 3x replication. Multipart upload for large objects; lifecycle policies tier cold data to archive storage. Trade-offs: erasure coding (storage-efficient, higher CPU/network on reconstruction) vs replication (simpler, faster reads, costlier); strong vs eventual consistency for cross-region replication (async for DR). Discuss hot-key handling (CDN + read replicas), background scrubbing/repair for bit-rot, signed URLs for access control, and an 11-nines durability target via redundancy and continuous integrity checks.

**Tags:** #system-design

---

### 53. Design a Real-Time IoT Device Management Platform

**Difficulty:** Hard
**Topics:** system-design, iot, mqtt, time-series, big-data, ops
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Design a platform to connect, monitor, and control tens of millions of IoT devices (sensors, smart meters) in real time.

**Approach:** Devices connect over MQTT (lightweight, pub/sub, QoS levels) through a horizontally scaled connection gateway that maintains millions of persistent connections (epoll-based, connection state in a distributed store). Telemetry flows into a stream processor → time-series database (downsampling, retention tiers); commands flow device-bound via per-device topics. A device registry/shadow holds desired vs reported state so control works even when a device is briefly offline (reconciles on reconnect). Trade-offs: MQTT QoS 0/1/2 (delivery guarantee vs overhead), push vs poll for commands, and connection density vs per-connection cost. Discuss firmware OTA (reuse Q49 patterns), authentication (per-device certs), rate limiting against misbehaving fleets, and partitioning telemetry by device id for scale.

**Tags:** #system-design

---

### 54. Design a High-Availability Database for Carrier Networks

**Difficulty:** Hard
**Topics:** system-design, database, replication, consensus
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Design a high-availability database backing carrier subscriber data (HLR/HSS-style) that must meet five-nines (99.999%) availability.

**Approach:** Synchronous replication across nodes within a region using a consensus protocol (Raft/Paxos) so a quorum survives single-node failure with no data loss (RPO=0). Multiple replicas across AZs; automatic leader election on failure keeps writes available within seconds (low RTO). For geo-DR, asynchronous replication to a remote region. Reads scale via follower reads (accepting slight staleness) or read-your-writes routing to the leader. Trade-offs: synchronous (strong consistency, higher write latency) vs asynchronous (faster, risk of data loss), and CAP positioning — carrier data favors CP within a region. Discuss schema for subscriber lookups (sharding by IMSI/subscriber id), connection pooling for massive concurrency, online schema changes without downtime, and rigorous failover drills since five-nines allows only ~5 minutes of downtime per year.

**Tags:** #system-design

---

### 55. Tell me about embracing the 奋斗者 (dedicator) culture

**Difficulty:** Medium
**Topics:** behavioral, culture, dedication
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Huawei is known for its 奋斗者 ("dedicator/striver") culture. Tell me about a time you went well beyond what was expected to deliver a result.

**Approach:** Huawei probes genuine drive without sounding performative. Use STAR: pick a real situation where you took on extra scope or pushed through a hard problem (not just "I worked late"). Show (1) the concrete challenge and stakes, (2) the specific extra effort and ownership you took, (3) that you worked smart, not only hard — you prioritized and made trade-offs, (4) a measurable result and what you learned. Be honest about sustainability; strong candidates show dedication plus judgment, not burnout for its own sake.

**Tags:** #behavioral

---

### 56. Time you delivered under a high-pressure deadline

**Difficulty:** Medium
**Topics:** behavioral, pressure, delivery
**Position:** OD / SWE
**Years:** 15-16 (Senior)

**Question:** Describe a time you had to deliver a critical feature or fix under intense time pressure. How did you handle it?

**Approach:** Show composure and prioritization. STAR: (1) the deadline and why it mattered (customer commitment, launch, outage), (2) how you triaged — scoped to the must-haves, negotiated cut lines, parallelized work, (3) how you kept quality acceptable under pressure (focused testing on the risky paths, clear communication of trade-offs), (4) the outcome and a retro insight. Avoid stories where the crunch was caused by your own poor planning unless you own that lesson explicitly.

**Tags:** #behavioral

---

### 57. Cross-team collaboration in a large organization

**Difficulty:** Medium
**Topics:** behavioral, collaboration, communication
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Huawei is a very large org with many product lines. Tell me about a time you had to align multiple teams with conflicting priorities to ship something.

**Approach:** Show you can navigate scale and ambiguity. STAR: (1) the cross-team dependency and the conflict (different OKRs, ownership gaps), (2) how you built alignment early — shared goals, a clear interface/contract, regular sync, (3) how you escalated constructively when needed (with options, not just complaints), (4) the delivered result and the relationship you preserved for future work. Emphasize empathy for the other team's constraints.

**Tags:** #behavioral

---

### 58. Why Huawei

**Difficulty:** Easy
**Topics:** behavioral, motivation, fit
**Position:** OD / SWE
**Years:** 13-14 (Junior)

**Question:** Why do you want to join Huawei specifically, and which business line interests you?

**Approach:** Be specific and informed. Pick a genuine reason: (1) a technical domain Huawei leads (5G/wireless, HarmonyOS, carrier networks, Huawei Cloud, Ascend AI chips), (2) the scale and hard engineering problems (carrier-grade reliability, global deployment), (3) the chance to work close to hardware/systems. Name a concrete BG/team and tie it to your background. Avoid generic answers ("big company", "good pay"); show you understand Huawei's R&D-heavy, long-term-investment engineering culture.

**Tags:** #behavioral

---

### 59. C/C++ Memory Management and Pointers

**Difficulty:** Hard
**Topics:** domain-knowledge, c-cpp, memory, pointers
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Explain how memory is managed in C/C++. What are common pointer/memory bugs and how do you prevent or debug them?

**Approach:** Cover the memory regions: stack (automatic, LIFO, fast, limited), heap (`malloc`/`free`, `new`/`delete`, manual lifetime), static/global, and code. Key bugs: (1) memory leak — heap freed never; (2) dangling pointer — use after `free`/`delete`; (3) double free; (4) buffer overflow (writing past array bounds — a classic security hole); (5) uninitialized pointer; (6) mismatched `new[]`/`delete[]`. Prevention in modern C++: RAII, smart pointers (`unique_ptr` for sole ownership, `shared_ptr` with reference counting, `weak_ptr` to break cycles), containers over raw arrays, and `const`-correctness. Debugging tools: Valgrind / AddressSanitizer (ASan) for leaks and overflows, static analyzers. Mention that `shared_ptr` cycles still leak (need `weak_ptr`), and that ASan catches use-after-free at runtime. Huawei machine tests and interviews lean heavily on this.

**Tags:** #domain-knowledge

---

### 60. TCP/IP Networking Deep Dive

**Difficulty:** Hard
**Topics:** domain-knowledge, networking, tcp, protocols
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Walk through the TCP three-way handshake and connection teardown, and explain how TCP provides reliability and flow/congestion control.

**Approach:** Handshake: SYN → SYN-ACK → ACK establishes sequence numbers and the connection (3 segments). Teardown: four-way FIN/ACK exchange, with TIME_WAIT on the initiator to absorb stray packets (2·MSL). Reliability: sequence numbers + cumulative ACKs + retransmission on timeout (RTO, computed from RTT estimates) or fast retransmit on 3 duplicate ACKs. Flow control: the receiver advertises a window (rwnd) so a fast sender can't overwhelm a slow receiver. Congestion control: sender-side cwnd with slow start (exponential), congestion avoidance (linear/AIMD), and reaction to loss (CUBIC, BBR). Contrast with UDP (connectionless, no reliability/ordering — used for real-time/VoIP). Be ready to discuss head-of-line blocking, Nagle's algorithm, and why high-RTT links hurt throughput (bandwidth-delay product, window scaling). Huawei carrier/networking roles drill this deeply.

**Tags:** #domain-knowledge

---

### 61. Linux Processes, Threads, and IPC

**Difficulty:** Hard
**Topics:** domain-knowledge, linux, concurrency, ipc
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Explain the difference between a process and a thread in Linux, and compare the main inter-process communication (IPC) mechanisms.

**Approach:** A process has its own address space (created via `fork`, which copies-on-write); threads share the process address space (created via `pthread_create` / `clone` with shared flags) so context switches and communication are cheaper but require synchronization. Threads share heap/globals/file descriptors but have private stacks and registers. IPC mechanisms and trade-offs: pipes/FIFOs (simple byte streams, related or named), message queues (structured, kernel-buffered), shared memory (fastest — no copy — but needs explicit synchronization via semaphores/mutexes), semaphores (signaling/counting), sockets (work across machines too), and signals (async notification, limited payload). Synchronization primitives: mutex, spinlock (busy-wait, good for very short critical sections), condition variable, read-write lock. Discuss race conditions, deadlock (and the four Coffman conditions), and why shared memory + semaphore is the high-performance choice carriers often use. Mention `epoll` for scalable I/O multiplexing.

**Tags:** #domain-knowledge

---

### 62. Operating System Concepts

**Difficulty:** Hard
**Topics:** domain-knowledge, operating-systems, scheduling, memory
**Position:** Senior SWE
**Years:** 17-18 (Expert)

**Question:** Explain virtual memory and paging, and describe how CPU scheduling works in a modern OS.

**Approach:** Virtual memory gives each process a private linear address space mapped to physical frames via page tables; the MMU translates addresses, and a TLB caches recent translations. A page fault triggers loading from disk (demand paging); when memory is full the OS evicts a page using a replacement policy (LRU approximations like the clock algorithm). Benefits: isolation, more apparent memory than physical, and easy sharing (shared libraries). Thrashing happens when the working set exceeds RAM. Scheduling: the scheduler multiplexes the CPU among ready threads — policies include round-robin, priority, and Linux's CFS (Completely Fair Scheduler) which uses a red-black tree keyed by virtual runtime to approximate fair sharing. Discuss preemptive vs cooperative, context-switch cost, real-time scheduling classes (SCHED_FIFO/RR for deterministic latency — relevant for telecom/embedded), and the trade-off between throughput and latency/fairness. Tie back to why embedded/carrier systems often need real-time guarantees.

**Tags:** #domain-knowledge
