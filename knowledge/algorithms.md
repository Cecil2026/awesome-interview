# Algorithms (LeetCode)

100 classic interview problems with Python and TypeScript solutions.

Difficulty mix: ~35 Easy, ~50 Medium, ~15 Hard. Topics span arrays, strings, two-pointers, sliding window, hashing, linked lists, trees, graphs, DP, backtracking, greedy, heap/priority queue, bit manipulation, stack/queue, binary search, intervals, and tries.

---

### 1. Two Sum  ·  Easy  ·  Array / Hashing

**Problem:** Given an array `nums` and an integer `target`, return indices of the two numbers that add up to `target`. Exactly one solution exists. 2 <= len(nums) <= 10^4, -10^9 <= nums[i], target <= 10^9.

**Approach:** Single pass with a hash map from value to index; for each `x`, check if `target - x` was seen. O(n) time, O(n) space.

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

**Key points:**
- Hash map turns the inner search from O(n) to O(1).
- Store after checking to avoid reusing the same index.
- Works with negatives and duplicates.

---

### 2. Best Time to Buy and Sell Stock  ·  Easy  ·  Array / DP

**Problem:** Given daily `prices`, choose one day to buy and a later day to sell to maximize profit. Return max profit or 0 if none. 1 <= len(prices) <= 10^5.

**Approach:** Track running minimum price; the answer is the max of `price - min_so_far`. O(n) time, O(1) space.

**Python:**
```python
def max_profit(prices: list[int]) -> int:
    lo = float("inf")
    best = 0
    for p in prices:
        lo = min(lo, p)
        best = max(best, p - lo)
    return best
```

**TypeScript:**
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

**Key points:**
- One pass suffices; no need to scan all pairs.
- Initialize `lo` to a sentinel larger than any price.
- Profit cannot be negative since `lo <= p` always.

---

### 3. Contains Duplicate  ·  Easy  ·  Array / Hashing

**Problem:** Return true if any value appears at least twice in `nums`. 1 <= len(nums) <= 10^5.

**Approach:** Insert into a set; duplicate detection is O(1). O(n) time, O(n) space.

**Python:**
```python
def contains_duplicate(nums: list[int]) -> bool:
    return len(set(nums)) != len(nums)
```

**TypeScript:**
```typescript
function containsDuplicate(nums: number[]): boolean {
  return new Set(nums).size !== nums.length;
}
```

**Key points:**
- Set size comparison is the shortest correct solution.
- Early-return loop variant saves time on large inputs with early dups.
- Sorting works but is O(n log n).

---

### 4. Product of Array Except Self  ·  Medium  ·  Array / Prefix

**Problem:** Return an array where `out[i]` is the product of all elements except `nums[i]`. No division allowed. O(n) time. 2 <= len(nums) <= 10^5.

**Approach:** Two sweeps storing prefix then suffix products into the output array. O(n) time, O(1) extra space (output not counted).

**Python:**
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

**TypeScript:**
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

**Key points:**
- Output array doubles as the prefix buffer.
- Maintain a running suffix product in a single variable.
- Handles zeros naturally without special casing.

---

### 5. Maximum Subarray  ·  Medium  ·  Array / DP

**Problem:** Find the contiguous subarray with the largest sum and return that sum. 1 <= len(nums) <= 10^5.

**Approach:** Kadane's: at each index, either extend the previous subarray or start fresh. O(n) time, O(1) space.

**Python:**
```python
def max_subarray(nums: list[int]) -> int:
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

**Key points:**
- All-negative arrays return the single largest element.
- `cur` represents best sum ending at the current index.
- Divide and conquer also works at O(n log n).

---

### 6. Maximum Product Subarray  ·  Medium  ·  Array / DP

**Problem:** Find the contiguous subarray with the largest product. 1 <= len(nums) <= 2*10^4, fits 32-bit.

**Approach:** Track both running max and min since a negative can flip sign. O(n) time, O(1) space.

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

**Key points:**
- Swap hi/lo on negative numbers before updating.
- Zero resets both hi and lo to the current element.
- Tracking only `hi` would miss negative-negative flips.

---

### 7. Find Minimum in Rotated Sorted Array  ·  Medium  ·  Binary Search

**Problem:** A sorted unique array was rotated at an unknown pivot. Find the minimum. O(log n). 1 <= len(nums) <= 5000.

**Approach:** Binary search; compare `nums[mid]` to `nums[hi]` to decide which side holds the min. O(log n) time, O(1) space.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Compare to `hi`, not `lo`, to handle non-rotated case.
- Loop ends when `lo == hi`, pointing at minimum.
- Distinct elements assumption avoids worst-case O(n).

---

### 8. Search in Rotated Sorted Array  ·  Medium  ·  Binary Search

**Problem:** Search for `target` in a rotated sorted array of unique ints. Return index or -1. O(log n). 1 <= len(nums) <= 5000.

**Approach:** Modified binary search: one half is always sorted; check if target lies in it. O(log n) time, O(1) space.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Determine which side is sorted with a single comparison.
- Inclusive bound checks must match the sorted-side endpoints.
- Works on a non-rotated array as a special case.

---

### 9. 3Sum  ·  Medium  ·  Two Pointers

**Problem:** Return all unique triplets in `nums` that sum to zero. 3 <= len(nums) <= 3000.

**Approach:** Sort; fix one index then two-pointer the rest. Skip duplicates to keep results unique. O(n^2) time, O(1) extra.

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

**Key points:**
- Sorting enables both two-pointer and duplicate-skip.
- Skip duplicates at the fixed index and after a match.
- Early break possible when `nums[i] > 0`.

---

### 10. Container With Most Water  ·  Medium  ·  Two Pointers

**Problem:** Given heights, choose two lines forming a container; maximize water area. 2 <= len(height) <= 10^5.

**Approach:** Two pointers from ends; move the shorter side inward since it limits the area. O(n) time, O(1) space.

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

**Key points:**
- Moving the taller side can never increase area.
- Width strictly decreases each step.
- Ties can move either pointer.

---

### 11. Valid Anagram  ·  Easy  ·  Hashing

**Problem:** Return true if `t` is an anagram of `s`. Lowercase English letters. 1 <= len <= 5*10^4.

**Approach:** Count letter frequencies and compare. O(n) time, O(1) space (26 letters).

**Python:**
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

**TypeScript:**
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

**Key points:**
- Single combined pass increments and decrements.
- Length check is a cheap early-out.
- For Unicode, use a hash map instead of fixed array.

---

### 12. Group Anagrams  ·  Medium  ·  Hashing

**Problem:** Group strings that are anagrams of each other. 1 <= len(strs) <= 10^4.

**Approach:** Bucket by a canonical key (sorted string or 26-count tuple). O(n * k log k) time with sorting.

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

**Key points:**
- Sorted string is the simplest canonical form.
- A 26-length count vector key avoids sorting.
- Output order is not specified.

---

### 13. Valid Parentheses  ·  Easy  ·  Stack

**Problem:** Determine if a string of `()[]{}` is properly nested and matched. 1 <= len(s) <= 10^4.

**Approach:** Push opens; on close, pop and verify match. O(n) time and space.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Stack must be empty at the end.
- Closing without an open returns false on pop.
- Constant alphabet keeps memory tight.

---

### 14. Valid Palindrome  ·  Easy  ·  Two Pointers

**Problem:** Return true if `s` reads the same forwards and backwards considering only alphanumerics and ignoring case. 1 <= len(s) <= 2*10^5.

**Approach:** Two pointers; skip non-alphanumerics and compare lowercased characters. O(n) time, O(1) space.

**Python:**
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

**TypeScript:**
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

**Key points:**
- In-place comparison avoids building a filtered copy.
- Inner skips must keep `l < r` to avoid overshoot.
- Lowercasing on the fly is fine for ASCII.

---

### 15. Longest Substring Without Repeating Characters  ·  Medium  ·  Sliding Window

**Problem:** Find the length of the longest substring with all distinct characters. 0 <= len(s) <= 5*10^4.

**Approach:** Sliding window; on duplicate, advance left past the previous occurrence. O(n) time, O(min(n, alphabet)) space.

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

**Key points:**
- Only jump `l` forward, never backward.
- Map stores most recent index of each char.
- Window invariant: substring `s[l..r]` is unique.

---

### 16. Longest Repeating Character Replacement  ·  Medium  ·  Sliding Window

**Problem:** Given `s` and `k`, replace at most `k` characters to maximize a substring of one repeating letter. Return that length. 1 <= len(s) <= 10^5.

**Approach:** Sliding window tracking max single-letter count; shrink when `(window_len - max_count) > k`. O(n) time.

**Python:**
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

**TypeScript:**
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

**Key points:**
- `maxCnt` is monotonically updated, no need to recompute on shrink.
- Window grows by 1 each iteration; shrinks at most once.
- Assumes uppercase A-Z; adapt range for general input.

---

### 17. Minimum Window Substring  ·  Hard  ·  Sliding Window

**Problem:** Find the shortest substring of `s` containing all characters of `t` (with multiplicity). Return `""` if impossible. 1 <= len(s), len(t) <= 10^5.

**Approach:** Sliding window with a `need`/`have` count and a `formed` counter; shrink when valid. O(|s| + |t|) time.

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

**Key points:**
- `formed` counts distinct chars whose counts are satisfied.
- Shrink whenever the window is valid to find a smaller answer.
- Strict equality on increment avoids double counting.

---

### 18. Longest Palindromic Substring  ·  Medium  ·  Two Pointers

**Problem:** Return the longest palindromic substring of `s`. 1 <= len(s) <= 1000.

**Approach:** Expand around each center (odd and even). O(n^2) time, O(1) space.

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

**Key points:**
- Two center types cover odd and even length palindromes.
- Manacher's algorithm gets O(n) but is more complex.
- Track best by length difference, not recompute.

---

### 19. Palindromic Substrings  ·  Medium  ·  Two Pointers

**Problem:** Count the number of palindromic substrings in `s`. 1 <= len(s) <= 1000.

**Approach:** Expand around each center; count each successful expansion. O(n^2) time, O(1) space.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Each expansion step represents one palindrome.
- Both odd and even centers needed.
- DP table works too but uses O(n^2) memory.

---

### 20. Encode and Decode Strings  ·  Medium  ·  Design / String

**Problem:** Design encode/decode of a list of arbitrary strings into one string and back. Characters can be any Unicode.

**Approach:** Length-prefix each string with a delimiter. Encode: "len#str". Decode: read length, slice. O(total) time.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Length prefix avoids ambiguity with any delimiter.
- `#` is safe because the length parses up to it.
- Works on empty strings and unicode.

---

### 21. Reverse Linked List  ·  Easy  ·  Linked List

**Problem:** Reverse a singly linked list in place. 0 <= length <= 5000.

**Approach:** Iterate, repointing `next` to a running `prev`. O(n) time, O(1) space.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Save `next` before mutating `cur.next`.
- `prev` becomes the new head when loop ends.
- Recursive variant uses O(n) stack space.

---

### 22. Merge Two Sorted Lists  ·  Easy  ·  Linked List

**Problem:** Merge two sorted linked lists into one sorted list. 0 <= length of each <= 50.

**Approach:** Dummy head; advance whichever current node is smaller. O(n + m) time, O(1) extra.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Dummy head removes special-case for the first node.
- Append the leftover tail in O(1).
- Stable order between equal values.

---

### 23. Merge K Sorted Lists  ·  Hard  ·  Heap

**Problem:** Merge `k` sorted linked lists into one sorted list. Total nodes N. 0 <= k <= 10^4.

**Approach:** Min-heap of (val, idx, node). Pop smallest, push its next. O(N log k) time, O(k) space.

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

**Key points:**
- Tuple's second element (index) breaks ties so node compare never runs.
- Divide-and-conquer pairwise merge avoids needing a heap.
- Heap variant is simpler to reason about.

---

### 24. Remove Nth Node From End of List  ·  Medium  ·  Linked List

**Problem:** Remove the n-th node from end and return head. 1 <= n <= length <= 30.

**Approach:** Two pointers with `n+1` gap; when fast reaches end, slow is at predecessor. O(L) time, O(1) space.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Dummy node simplifies removing the head.
- Gap of n+1 lands slow at the predecessor.
- Single pass beats length-then-walk.

---

### 25. Reorder List  ·  Medium  ·  Linked List

**Problem:** Reorder `L0 -> L1 -> ... -> Ln-1 -> Ln` to `L0 -> Ln -> L1 -> Ln-1 -> L2 -> ...` in place. 1 <= length <= 5*10^4.

**Approach:** Find midpoint with slow/fast, reverse the second half, then merge the two halves. O(n) time, O(1) space.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Split into two halves before reversing the right half.
- Merge interleaves nodes from both halves.
- In-place: no allocations beyond pointers.

---

### 26. Linked List Cycle  ·  Easy  ·  Linked List

**Problem:** Detect if a singly linked list has a cycle. 0 <= length <= 10^4.

**Approach:** Floyd's tortoise and hare; if they meet, there is a cycle. O(n) time, O(1) space.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Fast moves twice as fast as slow.
- Meeting implies a cycle exists.
- Set-based detection is O(n) space.

---

### 27. Linked List Cycle II  ·  Medium  ·  Linked List

**Problem:** If a cycle exists, return the node where it starts; otherwise null.

**Approach:** Floyd's algorithm: detect meeting, then restart one pointer at head; they meet at the cycle start. O(n) time, O(1) space.

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

**Key points:**
- The math: distance head-to-start equals meeting-to-start mod cycle length.
- Works even when start is head itself.
- Two pointer chase costs at most one extra pass.

---

### 28. Copy List with Random Pointer  ·  Medium  ·  Linked List / Hashing

**Problem:** Deep-copy a linked list whose nodes also have a `random` pointer to any node or null. 0 <= length <= 1000.

**Approach:** Hash original->clone in one pass; wire `next`/`random` in a second pass. O(n) time and space.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Two passes simplify random pointer resolution.
- O(1)-space interleaving variant exists but is trickier.
- Handles null `next` and `random` cleanly.

---

### 29. Add Two Numbers  ·  Medium  ·  Linked List / Math

**Problem:** Two non-empty linked lists represent non-negative integers in reverse order. Add them and return the sum as a list. 1 <= len <= 100.

**Approach:** Walk both lists with a carry, building output node-by-node. O(max(n, m)) time, O(1) extra.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Loop condition includes `carry` for the final digit.
- Either list may end first; treat missing digits as 0.
- Output is also in reverse order.

---

### 30. LRU Cache  ·  Medium  ·  Design / Linked List

**Problem:** Design `get(key)` and `put(key, value)` in O(1) with capacity `cap`. Evict least recently used when full. 1 <= cap <= 3000.

**Approach:** Hash map + doubly linked list; map keys to nodes, list orders by recency. O(1) per op.

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

**Key points:**
- JS `Map` and Python `OrderedDict` preserve insertion order.
- Re-insert on access to mark as most recent.
- Evict the oldest entry when over capacity.

---

### 31. Invert Binary Tree  ·  Easy  ·  Tree

**Problem:** Mirror a binary tree: swap left and right for every node. 0 <= nodes <= 100.

**Approach:** Recurse, swap children at each call. O(n) time, O(h) stack.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Post-order swap also works.
- BFS variant iterates with a queue, swapping each.
- Be sure to evaluate before assigning to avoid losing a subtree.

---

### 32. Maximum Depth of Binary Tree  ·  Easy  ·  Tree

**Problem:** Return the maximum depth (number of nodes along longest root-to-leaf path). 0 <= nodes <= 10^4.

**Approach:** Recursive 1 + max(left, right) with null base case. O(n) time, O(h) stack.

**Python:**
```python
def max_depth(root: TreeNode | None) -> int:
    if root is None:
        return 0
    return 1 + max(max_depth(root.left), max_depth(root.right))
```

**TypeScript:**
```typescript
function maxDepth(root: TreeNode | null): number {
  if (!root) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```

**Key points:**
- Empty tree has depth 0.
- BFS would also work counting levels.
- Iterative DFS uses an explicit stack of (node, depth).

---

### 33. Same Tree  ·  Easy  ·  Tree

**Problem:** Determine whether two binary trees are structurally identical with the same values. 0 <= nodes <= 100.

**Approach:** Recurse comparing roots and recursing into corresponding subtrees. O(n) time, O(h) stack.

**Python:**
```python
def is_same_tree(p: TreeNode | None, q: TreeNode | None) -> bool:
    if p is None and q is None:
        return True
    if p is None or q is None or p.val != q.val:
        return False
    return is_same_tree(p.left, q.left) and is_same_tree(p.right, q.right)
```

**TypeScript:**
```typescript
function isSameTree(p: TreeNode | null, q: TreeNode | null): boolean {
  if (!p && !q) return true;
  if (!p || !q || p.val !== q.val) return false;
  return isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
}
```

**Key points:**
- Both null is true; one null is false.
- Short-circuit on value mismatch.
- BFS lockstep traversal also works.

---

### 34. Subtree of Another Tree  ·  Easy  ·  Tree

**Problem:** Return true if `subRoot` matches any subtree of `root`. 1 <= nodes(root) <= 2000.

**Approach:** Recurse `root`; at each node check `is_same_tree` with `subRoot`. O(n*m) time.

**Python:**
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

**TypeScript:**
```typescript
function isSubtree(root: TreeNode | null, sub: TreeNode | null): boolean {
  if (!sub) return true;
  if (!root) return false;
  if (isSameTree(root, sub)) return true;
  return isSubtree(root.left, sub) || isSubtree(root.right, sub);
}
```

**Key points:**
- Empty `sub` is trivially a subtree.
- Worst case touches every node once per candidate.
- KMP on serialized trees gives O(n+m).

---

### 35. Lowest Common Ancestor of a BST  ·  Medium  ·  Tree / BST

**Problem:** Given a BST and two nodes, return their LCA. All values unique. 2 <= nodes <= 10^5.

**Approach:** Walk from root; descend by comparing both values to current. O(h) time, O(1) space.

**Python:**
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

**TypeScript:**
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

**Key points:**
- The split point is the LCA.
- BST property avoids visiting whole tree.
- Equal-side path means current is ancestor of itself or descendant.

---

### 36. Lowest Common Ancestor of a Binary Tree  ·  Medium  ·  Tree

**Problem:** Find LCA of nodes `p` and `q` in a general binary tree. 2 <= nodes <= 10^5.

**Approach:** Recurse; return non-null subtree result. If both sides return non-null, current node is LCA. O(n) time, O(h) stack.

**Python:**
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

**TypeScript:**
```typescript
function lowestCommonAncestor(root: TreeNode | null, p: TreeNode, q: TreeNode): TreeNode | null {
  if (!root || root === p || root === q) return root;
  const l = lowestCommonAncestor(root.left, p, q);
  const r = lowestCommonAncestor(root.right, p, q);
  if (l && r) return root;
  return l ?? r;
}
```

**Key points:**
- Both targets are guaranteed to exist in the tree.
- A node that equals p or q can be its own LCA.
- Single non-null bubble-up returns deeper found node.

---

### 37. Binary Tree Level Order Traversal  ·  Medium  ·  Tree / BFS

**Problem:** Return values level by level, top to bottom. 0 <= nodes <= 2000.

**Approach:** BFS with a queue; collect each level's values. O(n) time and space.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Capture queue length to delimit a level.
- Empty tree yields empty list.
- Works on any branching factor with minor tweaks.

---

### 38. Validate Binary Search Tree  ·  Medium  ·  Tree / BST

**Problem:** Return true if a binary tree is a valid BST. 1 <= nodes <= 10^4.

**Approach:** DFS with `(low, high)` bounds tightened on each recursion. O(n) time, O(h) stack.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Strict inequalities enforce uniqueness.
- Bounds passed down, not up.
- In-order traversal alternative: values must be strictly increasing.

---

### 39. Kth Smallest Element in a BST  ·  Medium  ·  Tree / BST

**Problem:** Return the k-th smallest value in a BST. 1 <= k <= nodes <= 10^4.

**Approach:** Iterative in-order traversal; stop after k pops. O(h + k) time, O(h) stack.

**Python:**
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

**TypeScript:**
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

**Key points:**
- In-order on a BST yields sorted order.
- Decrement k after each visit.
- Recursive variant is shorter but uses call stack.

---

### 40. Construct Binary Tree from Preorder and Inorder  ·  Medium  ·  Tree

**Problem:** Build a tree from `preorder` and `inorder` traversals with unique values. 1 <= length <= 3000.

**Approach:** First preorder element is root; locate it in inorder to split sizes; recurse. O(n) time with index map.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Index map turns inorder search into O(1).
- Consume preorder in order via shared pointer/iterator.
- Inorder bounds delimit subtrees.

---

### 41. Binary Tree Maximum Path Sum  ·  Hard  ·  Tree / DP

**Problem:** Find the maximum sum of any path between any two nodes (path bends allowed). 1 <= nodes <= 3*10^4, values can be negative.

**Approach:** Post-order; each node returns max gain ignoring branching, while updating global best with branching. O(n) time, O(h) stack.

**Python:**
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

**Key points:**
- Negative branches contribute 0 (we can skip them).
- Returned gain is single-branch only (path through parent).
- Global update at each node compares full-bent path.

---

### 42. Serialize and Deserialize Binary Tree  ·  Hard  ·  Tree / Design

**Problem:** Encode any binary tree to a string and decode it back. -1000 <= node.val <= 1000.

**Approach:** Pre-order DFS with `#` for nulls; deserialize via queue. O(n) both ways.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Sentinel `#` resolves ambiguity for missing children.
- Pre-order recovery uses a shared cursor/iterator.
- BFS-based serialization is also valid.

---

### 43. Number of Islands  ·  Medium  ·  Graph / DFS

**Problem:** Count islands (groups of connected '1's, 4-directional) in a grid. 1 <= m, n <= 300.

**Approach:** Iterate cells; on each '1' DFS-flood-fill to mark visited. O(m*n) time.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Mutating grid to '0' marks visited without extra memory.
- BFS variant avoids deep recursion stacks.
- Diagonals are not connections in 4-connectivity.

---

### 44. Clone Graph  ·  Medium  ·  Graph / DFS

**Problem:** Deep copy a connected undirected graph given a node reference. 0 <= nodes <= 100.

**Approach:** DFS with a map from original to clone to avoid revisiting. O(V+E) time and space.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Memoize clones before recursing into neighbors.
- Handles cycles via the seen map.
- BFS variant works the same way using a queue.

---

### 45. Pacific Atlantic Water Flow  ·  Medium  ·  Graph / BFS

**Problem:** In an m x n height grid, return cells from which water can flow to both Pacific (top/left edges) and Atlantic (bottom/right edges). 1 <= m, n <= 200.

**Approach:** BFS/DFS inward from each ocean's borders; intersect reachable sets. O(m*n) time.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Reverse the flow: search from oceans inward.
- Visit only cells with non-decreasing height.
- Intersection gives bi-ocean reachable cells.

---

### 46. Course Schedule  ·  Medium  ·  Graph / Topo

**Problem:** Given prerequisites, determine if all courses can be finished. n <= 2000.

**Approach:** Detect a cycle via Kahn's BFS (in-degree). O(V+E) time.

**Python:**
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

**TypeScript:**
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

**Key points:**
- A valid order exists iff no cycle exists.
- Kahn's BFS processes nodes with zero in-degree.
- DFS three-color marking is an alternative.

---

### 47. Course Schedule II  ·  Medium  ·  Graph / Topo

**Problem:** Return a valid course order; empty if impossible. n <= 2000.

**Approach:** Topological sort via Kahn's; record the dequeue order. O(V+E).

**Python:**
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

**TypeScript:**
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

**Key points:**
- Same structure as Course Schedule plus recording.
- Multiple valid orders are possible.
- Empty return signals cycle.

---

### 48. Number of Connected Components  ·  Medium  ·  Union-Find

**Problem:** Given n nodes and undirected edges, return the number of connected components. 1 <= n <= 2000.

**Approach:** Union-Find with path compression and union by size. ~O((n + e) * a(n)).

**Python:**
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

**TypeScript:**
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

**Key points:**
- Each successful union reduces component count by 1.
- Path compression keeps trees shallow.
- DFS over adjacency list is an alternative.

---

### 49. Graph Valid Tree  ·  Medium  ·  Union-Find

**Problem:** Given n nodes and undirected edges, determine if they form a tree. 1 <= n <= 2000.

**Approach:** Tree iff exactly n-1 edges and no cycle; Union-Find detects cycle. O((n + e) * a(n)).

**Python:**
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

**TypeScript:**
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

**Key points:**
- Edge count check enforces connectivity for acyclic graphs.
- Cycle detection via find-on-both-endpoints.
- Equivalent: BFS to check single component without revisits.

---

### 50. Word Ladder  ·  Hard  ·  Graph / BFS

**Problem:** Transform `beginWord` to `endWord` one letter at a time using words from `wordList`. Return shortest length or 0. 1 <= len(words) <= 5000.

**Approach:** BFS treating each word as a node; neighbors are one-letter substitutions present in the set. O(N * L^2).

**Python:**
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

**TypeScript:**
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

**Key points:**
- Removing from the set marks visited cheaply.
- Bidirectional BFS roughly squares-roots the work.
- Each substitution generates `26 * L` candidates.

---

### 51. Alien Dictionary  ·  Hard  ·  Graph / Topo

**Problem:** Given a sorted list of words from an alien language, derive a possible alphabet order. Return "" if impossible. 1 <= len(words) <= 100.

**Approach:** Compare adjacent words to add edges between first differing chars; topo sort. O(C) where C = total chars.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Invalid case: longer prefix word follows its shorter form.
- Only the first differing character yields an edge.
- Topo sort failure indicates a contradiction.

---

### 52. Climbing Stairs  ·  Easy  ·  DP

**Problem:** Reach the top in 1 or 2 steps; count distinct ways. 1 <= n <= 45.

**Approach:** Fibonacci recurrence; iterate with two variables. O(n) time, O(1) space.

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

**Key points:**
- Equivalent to F(n+1).
- Avoid recursion stack; iterate.
- Matrix exponentiation gives O(log n) for huge n.

---

### 53. House Robber  ·  Medium  ·  DP

**Problem:** Maximize sum from a row of houses without picking two adjacent. 1 <= len(nums) <= 100, 0 <= nums[i] <= 400.

**Approach:** DP: best up to i = max(best[i-1], best[i-2] + nums[i]). O(n) time, O(1) space.

**Python:**
```python
def rob(nums: list[int]) -> int:
    prev1 = prev2 = 0
    for x in nums:
        prev1, prev2 = max(prev1, prev2 + x), prev1
    return prev1
```

**TypeScript:**
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

**Key points:**
- Only the last two states matter.
- Choice at each step is take-or-skip.
- Initial states represent empty prefix.

---

### 54. House Robber II  ·  Medium  ·  DP

**Problem:** Same as House Robber but houses are arranged in a circle. 1 <= len(nums) <= 100.

**Approach:** Run linear robber twice: excluding first or excluding last; take max. O(n) time.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Circular constraint means first and last are adjacent.
- Either skip first or skip last, then linear DP.
- Handle the singleton case explicitly.

---

### 55. Coin Change  ·  Medium  ·  DP

**Problem:** Fewest coins to make amount; -1 if impossible. 1 <= len(coins) <= 12, 1 <= amount <= 10^4.

**Approach:** Bottom-up DP: dp[a] = min(dp[a - c] + 1). O(amount * len(coins)).

**Python:**
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

**TypeScript:**
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

**Key points:**
- Initialize dp[0] = 0 (no coins for amount 0).
- Use a sentinel (amount + 1) as infinity.
- Coin order doesn't matter since each amount considers all coins.

---

### 56. Longest Increasing Subsequence  ·  Medium  ·  DP / Binary Search

**Problem:** Length of the longest strictly increasing subsequence. 1 <= len(nums) <= 2500 (or 10^5 for binary search variant).

**Approach:** Patience sort: maintain `tails` array; for each x, binary-search-insert. O(n log n) time.

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
      if (tails[mid] < x) lo = mid + 1; else hi = mid;
    }
    if (lo === tails.length) tails.push(x); else tails[lo] = x;
  }
  return tails.length;
}
```

**Key points:**
- `tails[i]` is the smallest tail of any LIS of length i+1.
- Final length is the LIS length (not the actual LIS).
- O(n^2) DP also works for smaller inputs.

---

### 57. Word Break  ·  Medium  ·  DP

**Problem:** Determine whether `s` can be segmented into space-separated dictionary words. 1 <= len(s) <= 300.

**Approach:** dp[i] = true if some j < i has dp[j] and s[j:i] in dict. O(n^2) time with set lookup.

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
      if (dp[j] && words.has(s.slice(j, i))) { dp[i] = true; break; }
    }
  }
  return dp[n];
}
```

**Key points:**
- dp[0] true represents empty prefix.
- Break inner loop early to save work.
- BFS / Trie variants improve in some cases.

---

### 58. Combination Sum  ·  Medium  ·  Backtracking

**Problem:** Return all unique combinations of distinct candidates summing to target; each can be used unlimited times. 1 <= len(candidates) <= 30.

**Approach:** Backtrack with an index to avoid duplicate orderings. O(2^t) worst case.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Index pointer prevents permutations like [2,3] and [3,2].
- Same index can be reused for unlimited counts.
- Early prune when remain goes negative.

---

### 59. Decode Ways  ·  Medium  ·  DP

**Problem:** Count decodings of a digit string where 'A'->1 ... 'Z'->26. 1 <= len(s) <= 100.

**Approach:** DP: dp[i] = dp[i-1] if s[i-1] != '0' plus dp[i-2] if s[i-2:i] in '10'..'26'. O(n) time, O(1) space.

**Python:**
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

**TypeScript:**
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

**Key points:**
- '0' alone cannot decode.
- Leading '0' returns 0.
- Two interpretations possible: 1-digit and 2-digit.

---

### 60. Unique Paths  ·  Medium  ·  DP / Combinatorics

**Problem:** Count paths from top-left to bottom-right of m x n grid moving only right or down. 1 <= m, n <= 100.

**Approach:** DP with a single row; dp[j] += dp[j-1]. O(m*n) time, O(n) space.

**Python:**
```python
def unique_paths(m: int, n: int) -> int:
    dp = [1] * n
    for _ in range(1, m):
        for j in range(1, n):
            dp[j] += dp[j - 1]
    return dp[-1]
```

**TypeScript:**
```typescript
function uniquePaths(m: number, n: number): number {
  const dp = new Array(n).fill(1);
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) dp[j] += dp[j - 1];
  }
  return dp[n - 1];
}
```

**Key points:**
- Closed form: C(m+n-2, m-1).
- Row reuse compresses space.
- First row/col are all 1.

---

### 61. Jump Game  ·  Medium  ·  Greedy

**Problem:** Each element gives max jump length; can you reach the last index? 1 <= len(nums) <= 10^4.

**Approach:** Greedy: track farthest reachable index. O(n) time, O(1) space.

**Python:**
```python
def can_jump(nums: list[int]) -> bool:
    reach = 0
    for i, x in enumerate(nums):
        if i > reach:
            return False
        reach = max(reach, i + x)
    return True
```

**TypeScript:**
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

**Key points:**
- If a position is past reach, you can't even arrive.
- Greedy avoids DP overhead.
- Equivalent to checking reach >= n - 1 at end.

---

### 62. Edit Distance  ·  Hard  ·  DP

**Problem:** Minimum insert/delete/replace operations to convert `word1` to `word2`. 0 <= lens <= 500.

**Approach:** Classic Levenshtein 2D DP. O(m*n) time, O(n) space.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Three operations correspond to three cells.
- Match copies the diagonal value.
- Row compression keeps O(n) memory.

---

### 63. Longest Common Subsequence  ·  Medium  ·  DP

**Problem:** Length of the LCS between two strings. 1 <= lens <= 1000.

**Approach:** 2D DP; match extends diagonal else max of (up, left). O(m*n) time, O(min) space.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Use shorter string as columns to save memory.
- Diagonal from match plus one.
- Doesn't reconstruct the subsequence (would need extra work).

---

### 64. Partition Equal Subset Sum  ·  Medium  ·  DP / Knapsack

**Problem:** Decide if nums can be split into two equal-sum subsets. 1 <= len(nums) <= 200, sum <= 10000.

**Approach:** 0/1 knapsack for target = total/2; bitset DP. O(n * target) time.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Equivalent to subset-sum to total/2.
- Odd total cannot split.
- Boolean DP array form is also standard.

---

### 65. Subsets  ·  Medium  ·  Backtracking

**Problem:** Return all subsets of a unique-int array. 1 <= len(nums) <= 10.

**Approach:** Backtrack including/excluding each element. O(2^n) time.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Include then exclude pattern is cleanest.
- Output size is exactly 2^n.
- Iterative bitmask is another common approach.

---

### 66. Permutations  ·  Medium  ·  Backtracking

**Problem:** Return all permutations of distinct integers. 1 <= len(nums) <= 6.

**Approach:** Backtracking with a used-flag set. O(n * n!) time.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Track used positions to avoid reusing values.
- Output count is exactly n!.
- Swap-in-place variant saves memory.

---

### 67. Word Search  ·  Medium  ·  Backtracking

**Problem:** Given a 2D board and a word, return true if word exists as a path in the board (no cell reuse). 1 <= m, n <= 6 typically.

**Approach:** DFS from each cell; mark visited by mutating board. O(m * n * 4^L) time.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Mark-and-restore avoids extra visited matrix.
- Early failure when chars don't match.
- Try each cell as the start.

---

### 68. N-Queens  ·  Hard  ·  Backtracking

**Problem:** Place n queens on an n x n board so none attack each other. Return all distinct boards. 1 <= n <= 9.

**Approach:** Backtrack row by row tracking used columns and diagonals. O(n!) worst.

**Python:**
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

**TypeScript:**
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

**Key points:**
- One queen per row; track conflicts by column and two diagonals.
- (r - c) identifies a \\-diagonal; (r + c) identifies a /-diagonal.
- Rebuild board strings only on success.

---

### 69. Generate Parentheses  ·  Medium  ·  Backtracking

**Problem:** Generate all combinations of n pairs of well-formed parentheses. 1 <= n <= 8.

**Approach:** Backtrack maintaining counts of open/close used. O(C(n)) Catalan.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Close only when open count exceeds close count.
- Open while open count below n.
- Result count equals the n-th Catalan number.

---

### 70. Letter Combinations of a Phone Number  ·  Medium  ·  Backtracking

**Problem:** Given digits 2-9, return all letter combinations they could represent. 0 <= len(digits) <= 4.

**Approach:** DFS over each digit's letters. O(3^n * 4^m) where 4-letter buttons contribute 4^m.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Empty input returns empty list, not [""].
- Table maps digits to candidate letters.
- Iterative BFS expansion works equally well.

---

### 71. Sum of Two Integers  ·  Medium  ·  Bit Manipulation

**Problem:** Return a + b without using + or -. -1000 <= a, b <= 1000.

**Approach:** Bitwise XOR for sum without carry; AND << 1 for carry; iterate until no carry. O(log max).

**Python:**
```python
def get_sum(a: int, b: int) -> int:
    MASK = 0xFFFFFFFF
    INT_MAX = 0x7FFFFFFF
    while b != 0:
        a, b = (a ^ b) & MASK, ((a & b) << 1) & MASK
    return a if a <= INT_MAX else ~(a ^ MASK)
```

**TypeScript:**
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

**Key points:**
- XOR is addition modulo 2 per bit.
- AND then shift carries to the next position.
- Python needs mask for fixed-width semantics.

---

### 72. Number of 1 Bits  ·  Easy  ·  Bit Manipulation

**Problem:** Count set bits in an unsigned 32-bit integer. 0 <= n <= 2^32 - 1.

**Approach:** Brian Kernighan: `n &= n - 1` clears the lowest set bit. O(set bits).

**Python:**
```python
def hamming_weight(n: int) -> int:
    c = 0
    while n:
        n &= n - 1
        c += 1
    return c
```

**TypeScript:**
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

**Key points:**
- Loop runs once per set bit.
- Built-ins (bin/popcount) also work.
- JS bitwise ops treat numbers as 32-bit signed.

---

### 73. Counting Bits  ·  Easy  ·  DP / Bit Manipulation

**Problem:** For i in [0, n], return an array of popcount(i). 0 <= n <= 10^5.

**Approach:** dp[i] = dp[i >> 1] + (i & 1). O(n) time.

**Python:**
```python
def count_bits(n: int) -> list[int]:
    dp = [0] * (n + 1)
    for i in range(1, n + 1):
        dp[i] = dp[i >> 1] + (i & 1)
    return dp
```

**TypeScript:**
```typescript
function countBits(n: number): number[] {
  const dp = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) dp[i] = dp[i >> 1] + (i & 1);
  return dp;
}
```

**Key points:**
- i >> 1 removes the lowest bit.
- (i & 1) tells whether the lowest bit was set.
- O(n log n) per-element popcount also valid.

---

### 74. Missing Number  ·  Easy  ·  Bit Manipulation / Math

**Problem:** An array contains n distinct numbers from [0, n] with one missing. Return it. 1 <= n <= 10^4.

**Approach:** XOR indices with values; the missing index/value survives. O(n) time, O(1) space.

**Python:**
```python
def missing_number(nums: list[int]) -> int:
    x = len(nums)
    for i, v in enumerate(nums):
        x ^= i ^ v
    return x
```

**TypeScript:**
```typescript
function missingNumber(nums: number[]): number {
  let x = nums.length;
  for (let i = 0; i < nums.length; i++) x ^= i ^ nums[i];
  return x;
}
```

**Key points:**
- XOR of duplicates cancels to 0.
- Sum formula (n*(n+1)/2 - sum) also works.
- Starting x with n covers the upper bound.

---

### 75. Reverse Bits  ·  Easy  ·  Bit Manipulation

**Problem:** Reverse bits of a 32-bit unsigned integer. Input always 32 bits wide.

**Approach:** Shift result left and OR low bit of input; iterate 32 times. O(1) time.

**Python:**
```python
def reverse_bits(n: int) -> int:
    r = 0
    for _ in range(32):
        r = (r << 1) | (n & 1)
        n >>= 1
    return r
```

**TypeScript:**
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

**Key points:**
- Use unsigned right shift in TS to avoid sign extension.
- Final `>>> 0` converts to unsigned 32-bit.
- Divide-and-conquer swap halves is O(log w).

---

### 76. Single Number  ·  Easy  ·  Bit Manipulation

**Problem:** Every element except one appears twice; find the one. 1 <= len(nums) <= 3*10^4.

**Approach:** XOR all elements; duplicates cancel. O(n) time, O(1) space.

**Python:**
```python
def single_number(nums: list[int]) -> int:
    r = 0
    for x in nums:
        r ^= x
    return r
```

**TypeScript:**
```typescript
function singleNumber(nums: number[]): number {
  let r = 0;
  for (const x of nums) r ^= x;
  return r;
}
```

**Key points:**
- XOR is commutative/associative.
- Hash counts work but use O(n) memory.
- Variant where it appears thrice needs bit-by-bit count mod 3.

---

### 77. Insert Interval  ·  Medium  ·  Intervals

**Problem:** Insert `newInterval` into non-overlapping sorted intervals; merge as needed. 0 <= len(intervals) <= 10^4.

**Approach:** Three-phase scan: before, overlapping (merge), after. O(n) time.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Mutating newInterval during merge is convenient.
- Sorted input enables single pass.
- Three loops keep logic clean.

---

### 78. Merge Intervals  ·  Medium  ·  Intervals

**Problem:** Merge all overlapping intervals. 1 <= len(intervals) <= 10^4.

**Approach:** Sort by start; sweep merging current with previous when overlap. O(n log n) time.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Sort dominates cost.
- Overlap iff next start <= prev end.
- Take max of ends since intervals may not be nested.

---

### 79. Non-overlapping Intervals  ·  Medium  ·  Greedy

**Problem:** Minimum removals so remaining intervals don't overlap. 1 <= len(intervals) <= 10^5.

**Approach:** Sort by end; greedily keep intervals whose start >= last kept end. O(n log n).

**Python:**
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

**TypeScript:**
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

**Key points:**
- Earliest-end greedy maximizes future room.
- Equivalent to activity selection.
- Removals = total - kept.

---

### 80. Meeting Rooms  ·  Easy  ·  Intervals

**Problem:** Decide if a person can attend all meetings (no overlap). 0 <= len(intervals) <= 10^4.

**Approach:** Sort by start; check each adjacent pair. O(n log n) time.

**Python:**
```python
def can_attend_meetings(intervals: list[list[int]]) -> bool:
    intervals.sort(key=lambda x: x[0])
    for i in range(1, len(intervals)):
        if intervals[i][0] < intervals[i - 1][1]:
            return False
    return True
```

**TypeScript:**
```typescript
function canAttendMeetings(intervals: number[][]): boolean {
  intervals.sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i][0] < intervals[i - 1][1]) return false;
  }
  return true;
}
```

**Key points:**
- Strict less-than treats touching as non-overlap.
- Sort then linear sweep.
- Empty list returns true.

---

### 81. Meeting Rooms II  ·  Medium  ·  Heap / Intervals

**Problem:** Minimum number of conference rooms needed. 1 <= len(intervals) <= 10^4.

**Approach:** Sort by start; min-heap of ongoing end times; reuse a room when its end <= current start. O(n log n).

**Python:**
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

**TypeScript:**
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

**Key points:**
- Heap size equals concurrent meetings.
- Sweep-line counting (start/end events) is an alternative.
- Reuse only when earliest end <= current start.

---

### 82. Rotate Image  ·  Medium  ·  Matrix

**Problem:** Rotate an n x n matrix 90 degrees clockwise in place. 1 <= n <= 20.

**Approach:** Transpose then reverse each row. O(n^2) time, O(1) space.

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
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];
  for (const row of matrix) row.reverse();
}
```

**Key points:**
- Transpose swaps over the main diagonal.
- Row reverse completes clockwise rotation.
- Counter-clockwise: reverse rows first, then transpose.

---

### 83. Spiral Matrix  ·  Medium  ·  Matrix

**Problem:** Return all elements in spiral order. 1 <= m, n <= 10.

**Approach:** Track four bounds; walk inward layer by layer. O(m*n) time.

**Python:**
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

**TypeScript:**
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

**Key points:**
- After traversing a side, contract that bound.
- Two guard checks prevent re-traversal in 1xN or Nx1 cases.
- Layer-based DFS works for square matrices too.

---

### 84. Set Matrix Zeroes  ·  Medium  ·  Matrix

**Problem:** If a cell is 0, set its entire row and column to 0 in place. 1 <= m, n <= 200.

**Approach:** Use the first row/column as markers; track their original zero status separately. O(m*n) time, O(1) space.

**Python:**
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

**TypeScript:**
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

**Key points:**
- First row/column do double duty as markers.
- Record their own zero status before mutating.
- O(m + n) space variant is simpler if allowed.

---

### 85. Word Search II  ·  Hard  ·  Trie / DFS

**Problem:** Given a board and list of words, return all words found on the board. 1 <= board cells <= 12*12, 1 <= len(words) <= 3*10^4.

**Approach:** Build a trie of words; DFS from each cell pruning by trie. O(cells * 4^L).

**Python:**
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

**TypeScript:**
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

**Key points:**
- Trie prunes paths that can't lead to any word.
- Remove word marker after matching to avoid dupes.
- Cleanup empty trie branches accelerates later searches.

---

### 86. Implement Trie  ·  Medium  ·  Trie / Design

**Problem:** Implement `insert`, `search`, and `startsWith` for a trie. 1 <= calls <= 3*10^4.

**Approach:** Nested map per character with a terminal flag. All ops O(L).

**Python:**
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

**TypeScript:**
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

**Key points:**
- Terminal flag distinguishes word end from prefix.
- Object/dict per node uses memory but reads cleanly.
- Array-of-26 children is faster for fixed alphabet.

---

### 87. Design Add and Search Words Data Structure  ·  Medium  ·  Trie / DFS

**Problem:** Support `addWord(w)` and `search(w)` where `.` matches any letter. 1 <= calls <= 10^4.

**Approach:** Trie with DFS on `.` that branches to all children. O(L) add, O(26^d * L) worst search.

**Python:**
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

**TypeScript:**
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

**Key points:**
- `.` requires branching through all children.
- Skip the `$` terminal key during traversal.
- Add is plain trie insertion.

---

### 88. Top K Frequent Elements  ·  Medium  ·  Heap / Bucket

**Problem:** Return the k most frequent elements. 1 <= k <= unique <= len(nums) <= 10^5.

**Approach:** Bucket sort by frequency (1..n); collect from highest bucket. O(n) time.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Frequency cannot exceed n, so n+1 buckets suffice.
- Avoid sort by traversing buckets high-to-low.
- Heap of size k is the alternative O(n log k).

---

### 89. Kth Largest Element in an Array  ·  Medium  ·  Heap / Quickselect

**Problem:** Find the kth largest element in an unsorted array. 1 <= k <= len(nums) <= 10^5.

**Approach:** Min-heap of size k; final root is answer. O(n log k) time.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Min-heap of size k keeps the k largest.
- Quickselect averages O(n) but worst O(n^2).
- Built-in nlargest works in Python.

---

### 90. Find Median from Data Stream  ·  Hard  ·  Heap / Design

**Problem:** Support `addNum(x)` and `findMedian()` over a growing stream. Up to 5*10^4 ops.

**Approach:** Two heaps: max-heap of lower half, min-heap of upper half; balance sizes. O(log n) add, O(1) median.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Invariant: lo.size == hi.size or lo.size == hi.size + 1.
- Pass through hi to maintain ordering.
- Median is either lo's top or average of both tops.

---

### 91. Task Scheduler  ·  Medium  ·  Greedy / Heap

**Problem:** Given tasks and cooldown n, return least time slots needed (idle counts). 1 <= len(tasks) <= 10^4.

**Approach:** Frame formula: (max_count - 1) * (n + 1) + ties; take max with len(tasks). O(n) time.

**Python:**
```python
def least_interval(tasks: list[str], n: int) -> int:
    from collections import Counter
    cnt = Counter(tasks)
    mx = max(cnt.values())
    ties = sum(1 for v in cnt.values() if v == mx)
    return max(len(tasks), (mx - 1) * (n + 1) + ties)
```

**TypeScript:**
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

**Key points:**
- The most frequent task pins the layout.
- Ties fill the final frame.
- Result is at least the number of tasks.

---

### 92. Trapping Rain Water  ·  Hard  ·  Two Pointers

**Problem:** Given non-negative heights, compute water trapped after rain. 0 <= len(height) <= 2*10^4.

**Approach:** Two pointers tracking left_max and right_max; add deficit at the lower side. O(n) time, O(1) space.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Side with smaller bar safely uses its running max.
- Each step processes one bar exactly once.
- Stack-based and prefix/suffix arrays also work.

---

### 93. Sliding Window Maximum  ·  Hard  ·  Deque

**Problem:** For each window of size k, return its max. 1 <= k <= len(nums) <= 10^5.

**Approach:** Monotonic deque of indices in decreasing order; front is always the window max. O(n) time.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Deque holds indices, not values, for window expiry.
- Maintain decreasing values to keep max at front.
- Amortized O(1) per element.

---

### 94. Largest Rectangle in Histogram  ·  Hard  ·  Stack

**Problem:** Given bar heights, find the area of the largest rectangle. 1 <= len(heights) <= 10^5.

**Approach:** Monotonic stack of indices; when a shorter bar appears, pop and compute area. O(n) time.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Sentinel 0 at the end forces final pops.
- Width spans between previous-smaller and current index.
- Each index pushed/popped at most once.

---

### 95. Daily Temperatures  ·  Medium  ·  Stack

**Problem:** For each day, return how many days until a warmer temperature, or 0. 1 <= len <= 10^5.

**Approach:** Monotonic decreasing stack of indices; on a warmer day, pop and record distance. O(n).

**Python:**
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

**TypeScript:**
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

**Key points:**
- Stack stores indices waiting for a warmer day.
- Pop on strict warmer-than relation.
- Remaining stack indices stay at 0.

---

### 96. Min Stack  ·  Medium  ·  Stack / Design

**Problem:** Support `push`, `pop`, `top`, and `getMin` all in O(1). Up to 3*10^4 ops.

**Approach:** Pair each value with the current minimum on a single stack. O(1) all ops.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Storing min per entry costs O(n) extra space.
- Two-stack variant pushes to min-stack only on new minima.
- All operations remain O(1).

---

### 97. Evaluate Reverse Polish Notation  ·  Medium  ·  Stack

**Problem:** Evaluate a postfix expression with `+ - * /` (integer division toward zero). 1 <= len(tokens) <= 10^4.

**Approach:** Stack of operands; on operator, pop two and push result. O(n) time.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Order matters: second pop is the left operand.
- Truncate toward zero (not floor) for negative quotients.
- Final stack has exactly one element.

---

### 98. Largest Number  ·  Medium  ·  Greedy / Sort

**Problem:** Arrange non-negative ints into the largest possible concatenated number. 1 <= len <= 100, 0 <= nums[i] <= 10^9.

**Approach:** Sort by custom comparator: `a + b > b + a`. O(n log n) time.

**Python:**
```python
from functools import cmp_to_key

def largest_number(nums: list[int]) -> str:
    arr = [str(x) for x in nums]
    arr.sort(key=cmp_to_key(lambda a, b: -1 if a + b > b + a else 1))
    res = "".join(arr)
    return "0" if res[0] == "0" else res
```

**TypeScript:**
```typescript
function largestNumber(nums: number[]): string {
  const arr = nums.map(String);
  arr.sort((a, b) => (b + a).localeCompare(a + b));
  const res = arr.join("");
  return res[0] === "0" ? "0" : res;
}
```

**Key points:**
- Comparator compares concatenations, not values.
- If sorted result starts with '0', the answer is "0".
- String length differences are handled by concat comparison.

---

### 99. Find First and Last Position of Element in Sorted Array  ·  Medium  ·  Binary Search

**Problem:** Return start and end indices of `target` in a sorted array, or [-1, -1]. 0 <= len <= 10^5.

**Approach:** Two binary searches for leftmost and rightmost match. O(log n) time.

**Python:**
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

**TypeScript:**
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

**Key points:**
- Continue searching after match to find boundary.
- Two independent passes; total O(log n).
- Empty array returns [-1, -1].

---

### 100. Median of Two Sorted Arrays  ·  Hard  ·  Binary Search

**Problem:** Find the median of two sorted arrays in O(log(min(m,n))). 0 <= m, n; combined len >= 1.

**Approach:** Binary search the partition of the smaller array such that left halves have correct size and max(left) <= min(right). O(log min(m,n)).

**Python:**
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

**TypeScript:**
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

**Key points:**
- Always binary-search the shorter array.
- Sentinels handle out-of-range partitions.
- Correct partition gives the median directly.

---
