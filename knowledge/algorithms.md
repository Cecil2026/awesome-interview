# Algorithms (LeetCode Hot 100)

The 100 most-liked LeetCode problems (热题 100), each with an original problem statement, an approach with complexity, and Python / TypeScript / Java solutions. Ordered and grouped to mirror LeetCode's study plan; the heading of each entry carries its LeetCode number (`LC N`).

---

### 1. Two Sum  ·  LC 1  ·  Easy  ·  Hashing

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

**Java:**
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

**Key points:**
- Hash map turns the inner search from O(n) to O(1).
- Store after checking to avoid reusing the same index.
- Works with negatives and duplicates.

---

### 2. Group Anagrams  ·  LC 49  ·  Medium  ·  Hashing

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

**Java:**
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

**Key points:**
- Sorted string is the simplest canonical form.
- A 26-length count vector key avoids sorting.
- Output order is not specified.

---

### 3. Longest Consecutive Sequence  ·  LC 128  ·  Medium  ·  Hashing

**Problem:** Given an unsorted integer array nums, return the length of the longest run of consecutive integers (values differing by exactly 1) that can be formed from its elements, regardless of their order in the array. Duplicates count only once. The array can be empty, and its size may reach up to 1 <= n <= 10^5 with values anywhere in the 32-bit integer range. The required time complexity is O(n).

**Approach:** Put every value into a hash set for O(1) membership tests, then only start counting a streak from a value x whose predecessor x-1 is absent, since such an x is the true start of a sequence. From each start, walk upward while the next value exists, tracking the longest run. Each element is visited at most twice across all streaks, giving O(n) time and O(n) space.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Sorting gives O(n log n); the hash-set trick achieves O(n) as required
- Only begin a count when x-1 is missing, so each sequence is scanned exactly once
- A set deduplicates automatically, so duplicates do not inflate the length
- Handle the empty array by returning 0

---

### 4. Move Zeroes  ·  LC 283  ·  Easy  ·  Two Pointers

**Problem:** Given an integer array nums, rearrange it in place so that every zero is pushed to the end while the relative order of all non-zero elements is preserved. You must not allocate a separate output array, and the operation should minimize the number of writes. The array length satisfies 1 <= n <= 10^4 and values fit in a signed 32-bit integer. Return nothing; mutate nums directly.

**Approach:** Keep an insert pointer marking where the next non-zero value belongs. Scan with a read pointer, and whenever a non-zero is found swap it into the insert slot and advance insert. This packs non-zeros forward in their original order and leaves zeros trailing, running in O(n) time with O(1) extra space.

**Python:**
```python
def move_zeroes(nums: list[int]) -> None:
    insert = 0
    for i in range(len(nums)):
        if nums[i] != 0:
            nums[insert], nums[i] = nums[i], nums[insert]
            insert += 1
```

**TypeScript:**
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

**Java:**
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

**Key points:**
- Two-pointer swap keeps non-zeros stable while moving zeros back
- Do it in place; no auxiliary array is allowed
- Swapping (rather than overwrite-then-fill) avoids a separate zero-filling pass
- When insert == i the swap is a harmless no-op

---

### 5. Container With Most Water  ·  LC 11  ·  Medium  ·  Two Pointers

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
- Width strictly decreases each step.
- Ties can move either pointer.

---

### 6. 3Sum  ·  LC 15  ·  Medium  ·  Two Pointers

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

**Java:**
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

**Key points:**
- Sorting enables both two-pointer and duplicate-skip.
- Skip duplicates at the fixed index and after a match.
- Early break possible when `nums[i] > 0`.

---

### 7. Trapping Rain Water  ·  LC 42  ·  Hard  ·  Two Pointers

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

**Java:**
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

**Key points:**
- Side with smaller bar safely uses its running max.
- Each step processes one bar exactly once.
- Stack-based and prefix/suffix arrays also work.

---

### 8. Longest Substring Without Repeating Characters  ·  LC 3  ·  Medium  ·  Sliding Window

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

**Java:**
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

**Key points:**
- Only jump `l` forward, never backward.
- Map stores most recent index of each char.
- Window invariant: substring `s[l..r]` is unique.

---

### 9. Find All Anagrams in a String  ·  LC 438  ·  Medium  ·  Sliding Window

**Problem:** Given two lowercase strings s and p, return the starting indices of every substring of s that is an anagram of p (a permutation of p's characters), in increasing order. Both strings consist only of lowercase English letters, with 1 <= s.length, p.length <= 3*10^4. If p is longer than s, the answer is empty. The order of indices in the output should follow their position in s.

**Approach:** Maintain a fixed-size sliding window of length |p| over s using a 26-element frequency count, plus a target count for p. As the window slides one character right, increment the entering char and decrement the leaving char, then compare the two count arrays; equality means the current window is an anagram. Each comparison is over a constant 26 buckets, so the whole scan is O(n) time and O(1) extra space (26 counters).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Fixed-length sliding window matches the anagram length exactly
- Frequency arrays of size 26 make the match check O(1)
- Add the entering char and remove the leaving char each step to avoid recomputing
- Record the window's left index (i - len(p) + 1) when counts match

---

### 10. Subarray Sum Equals K  ·  LC 560  ·  Medium  ·  Substring

**Problem:** Given an integer array nums and an integer k, count how many contiguous subarrays have elements summing exactly to k. Elements may be negative, zero, or positive, so the running sum is not monotonic. The array length is 1 <= n <= 2*10^4 and each value and k fit in the range -10^7 to 10^7. Return the total count of qualifying subarrays.

**Approach:** Track the running prefix sum and a hash map from each prefix-sum value to how many times it has occurred. A subarray ending at the current index sums to k exactly when a previous prefix equal to (current prefix - k) exists, so add its occurrence count to the answer. Seeding the map with {0: 1} handles subarrays starting at index 0, giving O(n) time and O(n) space.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Sliding window fails because negatives break the monotonic-sum assumption
- Key identity: count previous prefix sums equal to prefix - k
- Initialize counts[0] = 1 so prefixes exactly equal to k are counted
- Add to the answer before recording the current prefix to avoid using an empty subarray twice

---

### 11. Sliding Window Maximum  ·  LC 239  ·  Hard  ·  Substring

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

**Java:**
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

**Key points:**
- Deque holds indices, not values, for window expiry.
- Maintain decreasing values to keep max at front.
- Amortized O(1) per element.

---

### 12. Minimum Window Substring  ·  LC 76  ·  Hard  ·  Substring

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

**Java:**
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

**Key points:**
- `formed` counts distinct chars whose counts are satisfied.
- Shrink whenever the window is valid to find a smaller answer.
- Strict equality on increment avoids double counting.

---

### 13. Maximum Subarray  ·  LC 53  ·  Medium  ·  Array

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
- All-negative arrays return the single largest element.
- `cur` represents best sum ending at the current index.
- Divide and conquer also works at O(n log n).

---

### 14. Merge Intervals  ·  LC 56  ·  Medium  ·  Array

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

**Java:**
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

**Key points:**
- Sort dominates cost.
- Overlap iff next start <= prev end.
- Take max of ends since intervals may not be nested.

---

### 15. Rotate Array  ·  LC 189  ·  Medium  ·  Array

**Problem:** Given an integer array nums, rotate it to the right by k positions in place, where k is non-negative and may exceed the array length. Every element shifts right by k slots, with elements falling off the end wrapping around to the front. The array length is 1 <= n <= 10^5 and 0 <= k <= 10^5; you should aim for a solution using O(1) extra space. Return nothing; modify nums directly.

**Approach:** First reduce k modulo n so rotations larger than the length wrap correctly. Then reverse the whole array, reverse the first k elements, and reverse the remaining n-k elements; the three reversals compose to a right rotation by k. This runs in O(n) time with O(1) extra space, avoiding an auxiliary copy.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Take k %= n first, since k can exceed n
- Triple-reversal trick achieves rotation with O(1) space
- An extra array is simpler but uses O(n) space
- Reverse all, then reverse the two segments split at index k

---

### 16. Product of Array Except Self  ·  LC 238  ·  Medium  ·  Array

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

**Java:**
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

**Key points:**
- Output array doubles as the prefix buffer.
- Maintain a running suffix product in a single variable.
- Handles zeros naturally without special casing.

---

### 17. First Missing Positive  ·  LC 41  ·  Hard  ·  Array

**Problem:** Given an unsorted integer array nums, find the smallest positive integer (1 or greater) that does not appear in the array. The array may contain duplicates, negatives, and zeros, and its length satisfies 1 <= n <= 10^5 with values in the full 32-bit integer range. You must return the answer in O(n) time using only O(1) extra space beyond the input array.

**Approach:** Use the array itself as a hash table: for each position, repeatedly swap the value v into index v-1 as long as v is in the valid range [1, n] and not already placed. After this cyclic-sort pass every value that can occupy slot i sits at index i-1, so a second scan returns the first index where nums[i] != i+1; if all match, the answer is n+1. This works because the first missing positive must lie in [1, n+1], so only values in that window matter. O(n) time, O(1) space.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Only values in [1, n] can affect the answer, so anything outside that range is ignored.
- The swap loop runs amortized O(n) because each swap puts one number in its final slot.
- Guard against infinite loops by checking nums[nums[i]-1] != nums[i] before swapping (handles duplicates).
- Sorting or a hash set gives the right answer but violates the O(n)-time / O(1)-space requirement.

---

### 18. Set Matrix Zeroes  ·  LC 73  ·  Medium  ·  Matrix

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

**Java:**
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

**Key points:**
- First row/column do double duty as markers.
- Record their own zero status before mutating.
- O(m + n) space variant is simpler if allowed.

---

### 19. Spiral Matrix  ·  LC 54  ·  Medium  ·  Matrix

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

**Java:**
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

**Key points:**
- After traversing a side, contract that bound.
- Two guard checks prevent re-traversal in 1xN or Nx1 cases.
- Layer-based DFS works for square matrices too.

---

### 20. Rotate Image  ·  LC 48  ·  Medium  ·  Matrix

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

**Java:**
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

**Key points:**
- Transpose swaps over the main diagonal.
- Row reverse completes clockwise rotation.
- Counter-clockwise: reverse rows first, then transpose.

---

### 21. Search a 2D Matrix II  ·  LC 240  ·  Medium  ·  Matrix

**Problem:** Given an m x n matrix where every row is sorted in ascending order left-to-right and every column is sorted ascending top-to-bottom, decide whether a given target value exists in the matrix and return a boolean. Dimensions satisfy 1 <= m, n <= 300 and values fit in a signed 32-bit integer. Note the matrix is not globally sorted like a flattened array, so a single binary search over all cells does not apply.

**Approach:** Start at the top-right corner and treat it as a search staircase: if the current value equals the target return true, if it is larger move left (that whole column below is too big), and if it is smaller move down (that whole row to the left is too small). Each comparison eliminates one full row or one full column, so the walk is monotonic and never revisits cells. This exploits the dual sorted order that a plain binary search cannot. O(m + n) time, O(1) space.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Top-right (or bottom-left) is the only corner where the two directions give opposite comparison outcomes.
- Every step discards an entire row or column, bounding the path length to m + n.
- The matrix is not fully sorted, so treating it as one sorted list for binary search is incorrect.
- Guard empty matrix / empty first row before indexing.

---

### 22. Intersection of Two Linked Lists  ·  LC 160  ·  Easy  ·  Linked List

**Problem:** Given the heads of two singly linked lists that may merge and share a common tail, return the node at which they first intersect, or null if they never meet. Intersection is defined by reference identity, not by equal values, and the lists must retain their original structure. Combined length is up to 5 * 10^4 nodes; solve it in O(1) extra space.

**Approach:** Advance two pointers, one per list; whenever a pointer reaches the end, redirect it to the head of the other list. After at most one such switch each pointer has traversed lenA + lenB nodes, so they arrive at the intersection simultaneously (or both reach null together when there is none). The redirection equalizes the differing prefix lengths without measuring them. O(m + n) time, O(1) space.

**Python:**
```python
def getIntersectionNode(headA: "ListNode", headB: "ListNode") -> "ListNode":
    a, b = headA, headB
    while a is not b:
        a = a.next if a else headB
        b = b.next if b else headA
    return a
```

**TypeScript:**
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

**Java:**
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

**Key points:**
- Redirecting to the other head cancels the length difference so both pointers align.
- If there is no intersection both pointers become null at the same step, ending the loop.
- Compare by node identity (is / ===), never by value.
- No need to pre-compute lengths or use a hash set of visited nodes.

---

### 23. Reverse Linked List  ·  LC 206  ·  Easy  ·  Linked List

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

**Java:**
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

**Key points:**
- Save `next` before mutating `cur.next`.
- `prev` becomes the new head when loop ends.
- Recursive variant uses O(n) stack space.

---

### 24. Palindrome Linked List  ·  LC 234  ·  Easy  ·  Linked List

**Problem:** Given the head of a singly linked list, determine whether the sequence of node values reads the same forwards and backwards, returning a boolean. The list holds between 1 and 10^5 nodes with small non-negative values. The target is O(n) time and O(1) extra space, so building a full array or recursion stack is considered suboptimal.

**Approach:** Find the middle with slow/fast pointers, reverse the second half in place, then compare it node-by-node against the front half; equality across the whole shorter half means the list is a palindrome. Splitting at the midpoint lets the two halves be walked in lockstep, and iterating only until the reversed (right) pointer is null correctly handles both even and odd lengths. O(n) time, O(1) space.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Fast/slow pointer lands slow at the second-half start (works for odd and even lengths).
- Reverse the second half in place to compare without extra storage.
- Stopping when the right pointer hits null ignores the odd middle element automatically.
- An array copy or recursion is O(n) space and misses the O(1) requirement.

---

### 25. Linked List Cycle  ·  LC 141  ·  Easy  ·  Linked List

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

**Java:**
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

**Key points:**
- Fast moves twice as fast as slow.
- Meeting implies a cycle exists.
- Set-based detection is O(n) space.

---

### 26. Linked List Cycle II  ·  LC 142  ·  Medium  ·  Linked List

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
- The math: distance head-to-start equals meeting-to-start mod cycle length.
- Works even when start is head itself.
- Two pointer chase costs at most one extra pass.

---

### 27. Merge Two Sorted Lists  ·  LC 21  ·  Easy  ·  Linked List

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

**Java:**
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

**Key points:**
- Dummy head removes special-case for the first node.
- Append the leftover tail in O(1).
- Stable order between equal values.

---

### 28. Add Two Numbers  ·  LC 2  ·  Medium  ·  Linked List

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

**Java:**
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

**Key points:**
- Loop condition includes `carry` for the final digit.
- Either list may end first; treat missing digits as 0.
- Output is also in reverse order.

---

### 29. Remove Nth Node From End of List  ·  LC 19  ·  Medium  ·  Linked List

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

**Java:**
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

**Key points:**
- Dummy node simplifies removing the head.
- Gap of n+1 lands slow at the predecessor.
- Single pass beats length-then-walk.

---

### 30. Swap Nodes in Pairs  ·  LC 24  ·  Medium  ·  Linked List

**Problem:** Given the head of a singly linked list, swap every two adjacent nodes and return the new head, changing the node links rather than just their stored values. If the list has an odd number of nodes, the final lone node stays in place. The list contains 0 to 100 nodes; aim for O(n) time and O(1) space.

**Approach:** Use a dummy node in front of the head so the first pair has a stable predecessor, then iterate while a full pair remains: relink prev -> second -> first -> rest and advance prev to first for the next pair. The dummy removes the special-case handling of the head, and re-wiring pointers (not values) satisfies the problem's structural requirement. O(n) time, O(1) space.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- A dummy head node avoids a separate branch for swapping the first pair.
- The loop condition prev.next && prev.next.next leaves a trailing odd node untouched.
- Reconnect prev.next to the second node before advancing, or the list breaks.
- Swapping values is disallowed by the problem; you must relink the nodes themselves.

---

### 31. Reverse Nodes in k-Group  ·  LC 25  ·  Hard  ·  Linked List

**Problem:** Given the head of a singly linked list, reverse the nodes of the list in consecutive groups of exactly k, and return the modified list's head. If the final group has fewer than k nodes, leave those nodes in their original order. You may not swap the stored values inside nodes; only the node links themselves may be rearranged. The list holds between 1 and 5000 nodes, each value is between 0 and 1000, and 1 <= k <= n.

**Approach:** Use a dummy node and a per-group pointer that always sits just before the group to be reversed. Before reversing, walk k steps to confirm a full group exists (otherwise stop, leaving the tail untouched); then reverse the group's links in place and stitch it back between the previous group and the next group. Because each node is visited a constant number of times, this runs in O(n) time and O(1) extra space.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Pre-check k nodes exist before reversing so an incomplete trailing group stays in original order.
- A dummy head avoids special-casing the first group's connection.
- Track the node that will become the new group tail so you can chain groups correctly.
- Reverse links only — swapping values is disallowed by the problem.

---

### 32. Copy List with Random Pointer  ·  LC 138  ·  Medium  ·  Linked List

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

**Java:**
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

**Key points:**
- Two passes simplify random pointer resolution.
- O(1)-space interleaving variant exists but is trickier.
- Handles null `next` and `random` cleanly.

---

### 33. Sort List  ·  LC 148  ·  Medium  ·  Linked List

**Problem:** Given the head of a singly linked list, return the same list sorted into non-decreasing order by node value. The relative rearrangement must be done by relinking nodes, and an optimal solution should sort in O(n log n) time. The list may contain between 0 and 5 x 10^4 nodes, and each value fits in the 32-bit signed integer range from -10^5 to 10^5.

**Approach:** Apply top-down merge sort tailored to linked lists: split the list into two halves with a slow/fast pointer, recursively sort each half, then merge the two sorted halves by comparing heads and relinking. Merge sort is the natural fit because linked lists lack random access (ruling out efficient quicksort partitioning) yet merging is trivial with pointers. This yields O(n log n) time and O(log n) space from the recursion stack.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Start fast at head.next so the split is balanced and avoids infinite recursion on two-node lists.
- Cut the first half by setting slow.next = None before recursing.
- Merge with a dummy tail to simplify head handling.
- Merge sort beats quicksort here because linked lists have no O(1) random access.

---

### 34. Merge k Sorted Lists  ·  LC 23  ·  Hard  ·  Linked List

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

**Java:**
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

**Key points:**
- Tuple's second element (index) breaks ties so node compare never runs.
- Divide-and-conquer pairwise merge avoids needing a heap.
- Heap variant is simpler to reason about.

---

### 35. LRU Cache  ·  LC 146  ·  Medium  ·  Linked List

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

**Java:**
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

**Key points:**
- JS `Map` and Python `OrderedDict` preserve insertion order.
- Re-insert on access to mark as most recent.
- Evict the oldest entry when over capacity.

---

### 36. Binary Tree Inorder Traversal  ·  LC 94  ·  Easy  ·  Binary Tree

**Problem:** Given the root of a binary tree, return a list of its node values produced by an inorder traversal, meaning left subtree first, then the current node, then the right subtree. The tree contains between 0 and 100 nodes, and each node value lies between -100 and 100. A common follow-up asks for an iterative solution instead of recursion.

**Approach:** Simulate the recursion with an explicit stack: repeatedly push nodes while descending left, then pop a node, record its value, and move to its right child. This reproduces the left-node-right ordering exactly because a node is only recorded once its entire left subtree has been consumed. It runs in O(n) time and O(h) space where h is the tree height (up to O(n) for a skewed tree).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Push all left descendants before recording any value — that enforces the inorder order.
- A node is visited (recorded) only after its left subtree is fully processed.
- Iterative form avoids recursion-depth limits on skewed trees.
- Space is O(h), which is O(n) worst case and O(log n) for balanced trees.

---

### 37. Maximum Depth of Binary Tree  ·  LC 104  ·  Easy  ·  Binary Tree

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

**Java:**
```java
int maxDepth(TreeNode root) {
    if (root == null) return 0;
    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```

**Key points:**
- Empty tree has depth 0.
- BFS would also work counting levels.
- Iterative DFS uses an explicit stack of (node, depth).

---

### 38. Invert Binary Tree  ·  LC 226  ·  Easy  ·  Binary Tree

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

**Java:**
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

**Key points:**
- Post-order swap also works.
- BFS variant iterates with a queue, swapping each.
- Be sure to evaluate before assigning to avoid losing a subtree.

---

### 39. Symmetric Tree  ·  LC 101  ·  Easy  ·  Binary Tree

**Problem:** Given the root of a binary tree, determine whether the tree is a mirror image of itself about its center, returning true if it is symmetric and false otherwise. Symmetry means the left subtree is the reflection of the right subtree, matching in both structure and node values. The tree has between 1 and 1000 nodes, with each value in the range -100 to 100.

**Approach:** Compare the two subtrees pairwise with a helper that checks whether tree a is a mirror of tree b: both empty is symmetric, exactly one empty or unequal values is asymmetric, otherwise recurse on the outer pair (a.left vs b.right) and inner pair (a.right vs b.left). Mirroring requires crossing the children, which is why left is paired with right. This visits each node once for O(n) time and O(h) space for the recursion.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Compare a.left with b.right and a.right with b.left — the cross-pairing is the crux of mirroring.
- Handle the both-null, one-null, and value-mismatch cases explicitly.
- A single-node or empty tree is trivially symmetric.
- Can also be solved iteratively with a queue processing node pairs.

---

### 40. Diameter of Binary Tree  ·  LC 543  ·  Easy  ·  Binary Tree

**Problem:** Given the root of a binary tree, return its diameter, defined as the number of edges on the longest path between any two nodes in the tree. This path may or may not pass through the root, and its length is counted in edges rather than nodes. The tree contains between 1 and 10^4 nodes, and each node value is between -100 and 100.

**Approach:** Run a single post-order DFS that returns the height of each subtree while tracking a running maximum. At every node the longest path passing through it equals the left height plus the right height (in edges), so we update the global best with that sum and return 1 + max(left, right) to the parent. Computing height once per node avoids the O(n^2) blowup of recomputing heights, giving O(n) time and O(h) space.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Diameter through a node = left height + right height, measured in edges.
- Return height to the parent but update a separate global maximum for the answer.
- The longest path need not include the root, so track the max at every node.
- Recomputing heights top-down would be O(n^2); post-order does it in O(n).

---

### 41. Binary Tree Level Order Traversal  ·  LC 102  ·  Medium  ·  Binary Tree

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

**Java:**
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

**Key points:**
- Capture queue length to delimit a level.
- Empty tree yields empty list.
- Works on any branching factor with minor tweaks.

---

### 42. Convert Sorted Array to Binary Search Tree  ·  LC 108  ·  Easy  ·  Binary Tree

**Problem:** Given an integer array sorted in strictly ascending order, construct a height-balanced binary search tree from it, where a height-balanced tree means the depths of the two subtrees of every node differ by at most one. Return the root of any valid such tree. The array length satisfies 1 <= n <= 10^4 and values fit in a 32-bit signed integer.

**Approach:** Because the array is already sorted, the middle element can serve as the root and everything to its left/right forms the left/right subtree, which keeps the tree balanced by construction. Recurse on each half using index bounds instead of slicing to avoid copying. This visits each element once, giving O(n) time and O(log n) auxiliary stack space (plus O(n) for the output tree).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Picking the middle element as root guarantees the height-balanced property for free
- Use lo/hi index bounds rather than array slicing to keep it O(n) and avoid extra allocations
- Any consistent mid choice (lower or upper middle) yields a valid answer

---

### 43. Validate Binary Search Tree  ·  LC 98  ·  Medium  ·  Binary Tree

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

**Java:**
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

**Key points:**
- Strict inequalities enforce uniqueness.
- Bounds passed down, not up.
- In-order traversal alternative: values must be strictly increasing.

---

### 44. Kth Smallest Element in a BST  ·  LC 230  ·  Medium  ·  Binary Tree

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

**Java:**
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

**Key points:**
- In-order on a BST yields sorted order.
- Decrement k after each visit.
- Recursive variant is shorter but uses call stack.

---

### 45. Binary Tree Right Side View  ·  LC 199  ·  Medium  ·  Binary Tree

**Problem:** Given the root of a binary tree, imagine standing on its right side and return the values of the nodes you can see ordered from top to bottom. In other words, for every depth level output the value of its rightmost node. The tree has between 0 and 100 nodes, and node values fit in a 32-bit signed integer.

**Approach:** Do a level-order (breadth-first) traversal, processing the tree one level at a time; the last node dequeued in each level is the one visible from the right. Snapshotting the level size before iterating lets us know exactly where each level ends. Every node is enqueued and dequeued once, so it runs in O(n) time and O(w) space where w is the maximum tree width.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- The rightmost node of each level is the answer for that level
- Capture the level size before the loop so levels don't bleed together
- A DFS that visits right before left and records the first node seen at each new depth also works

---

### 46. Flatten Binary Tree to Linked List  ·  LC 114  ·  Medium  ·  Binary Tree

**Problem:** Given the root of a binary tree, rearrange it in place into a 'linked list': every node's left child must become null and its right child must point to the next node in the tree's preorder traversal order. Modify the tree directly rather than returning a new structure. The number of nodes is in the range 0 to 2000 and node values fit in a 32-bit signed integer.

**Approach:** Use the Morris-style threading trick: for each node that has a left subtree, find the rightmost node of that left subtree (the preorder predecessor of the right subtree), attach the current right subtree there, then move the whole left subtree to the right and clear the left pointer. Advancing along the right pointers processes the entire tree. Each edge is traversed a constant number of times, giving O(n) time and O(1) extra space.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- The rightmost node of the left subtree is where the original right subtree must be reattached
- Threading achieves O(1) space, beating the O(h) recursion-stack approach
- Must null out the left pointer after moving the subtree or the structure stays invalid

---

### 47. Construct Binary Tree from Preorder and Inorder Traversal  ·  LC 105  ·  Medium  ·  Binary Tree

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

**Java:**
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

**Key points:**
- Index map turns inorder search into O(1).
- Consume preorder in order via shared pointer/iterator.
- Inorder bounds delimit subtrees.

---

### 48. Path Sum III  ·  LC 437  ·  Medium  ·  Binary Tree

**Problem:** Given the root of a binary tree and an integer target, count the number of downward paths whose node values sum to the target, where a path must go from a node to one of its descendants (any start and end, not necessarily root-to-leaf) following parent-to-child links. Return the total count of such paths. The tree has 0 to 1000 nodes, node values are in [-10^9, 10^9], and the target is a 32-bit integer.

**Approach:** Track the running prefix sum from the root to the current node and store counts of every prefix sum seen along the current path in a hash map; a path ending at the current node with the target sum exists once for each earlier prefix equal to current - target. Add the current prefix before recursing into children and remove it when backtracking so only ancestors on the active path are counted. Each node is visited once with O(1) map work, giving O(n) time and O(h) space for the map and recursion.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Prefix-sum counts turn an O(n^2) per-node search into a single O(n) pass
- Seed the map with {0: 1} so paths starting at the root are counted
- Must decrement the prefix count on the way up or unrelated branches leak into the count
- Sums can exceed 32 bits (values up to 1e9 times up to 1000 nodes), so use 64-bit accumulation

---

### 49. Lowest Common Ancestor of a Binary Tree  ·  LC 236  ·  Medium  ·  Binary Tree

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

**Java:**
```java
TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    if (root == null || root == p || root == q) return root;
    TreeNode l = lowestCommonAncestor(root.left, p, q);
    TreeNode r = lowestCommonAncestor(root.right, p, q);
    if (l != null && r != null) return root;
    return l != null ? l : r;
}
```

**Key points:**
- Both targets are guaranteed to exist in the tree.
- A node that equals p or q can be its own LCA.
- Single non-null bubble-up returns deeper found node.

---

### 50. Binary Tree Maximum Path Sum  ·  LC 124  ·  Hard  ·  Binary Tree

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

**Java:**
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

**Key points:**
- Negative branches contribute 0 (we can skip them).
- Returned gain is single-branch only (path through parent).
- Global update at each node compares full-bent path.

---

### 51. Number of Islands  ·  LC 200  ·  Medium  ·  Graph

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

**Java:**
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

**Key points:**
- Mutating grid to '0' marks visited without extra memory.
- BFS variant avoids deep recursion stacks.
- Diagonals are not connections in 4-connectivity.

---

### 52. Rotting Oranges  ·  LC 994  ·  Medium  ·  Graph

**Problem:** You are given an m x n grid where each cell is 0 (empty), 1 (a fresh orange), or 2 (a rotten orange). Every minute, any fresh orange that is 4-directionally adjacent to a rotten one becomes rotten. Return the minimum number of minutes until no fresh orange remains, or -1 if some fresh orange can never rot. Grid dimensions satisfy 1 <= m, n <= 10 (cells values are 0, 1, or 2).

**Approach:** Run a multi-source breadth-first search starting from all initially rotten oranges at once, processing the grid one minute (one BFS layer) at a time and counting fresh oranges as they rot. When the queue empties, any remaining fresh oranges are unreachable so the answer is -1; otherwise the number of layers processed is the elapsed time. Every cell is enqueued at most once, giving O(m*n) time and O(m*n) space.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Seed the BFS queue with every rotten orange simultaneously so all rot spreads in parallel
- Track the fresh count to detect unreachable oranges and return -1
- Only increment the minute counter when there is still fresh fruit to rot, so an all-clean grid returns 0
- Process the queue level by level rather than one cell at a time to measure minutes correctly

---

### 53. Course Schedule  ·  LC 207  ·  Medium  ·  Graph

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

**Java:**
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

**Key points:**
- A valid order exists iff no cycle exists.
- Kahn's BFS processes nodes with zero in-degree.
- DFS three-color marking is an alternative.

---

### 54. Implement Trie (Prefix Tree)  ·  LC 208  ·  Medium  ·  Graph

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

**Java:**
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

**Key points:**
- Terminal flag distinguishes word end from prefix.
- Object/dict per node uses memory but reads cleanly.
- Array-of-26 children is faster for fixed alphabet.

---

### 55. Permutations  ·  LC 46  ·  Medium  ·  Backtracking

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

**Java:**
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

**Key points:**
- Track used positions to avoid reusing values.
- Output count is exactly n!.
- Swap-in-place variant saves memory.

---

### 56. Subsets  ·  LC 78  ·  Medium  ·  Backtracking

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

**Java:**
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

**Key points:**
- Include then exclude pattern is cleanest.
- Output size is exactly 2^n.
- Iterative bitmask is another common approach.

---

### 57. Letter Combinations of a Phone Number  ·  LC 17  ·  Medium  ·  Backtracking

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

**Java:**
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

**Key points:**
- Empty input returns empty list, not [""].
- Table maps digits to candidate letters.
- Iterative BFS expansion works equally well.

---

### 58. Combination Sum  ·  LC 39  ·  Medium  ·  Backtracking

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

**Java:**
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

**Key points:**
- Index pointer prevents permutations like [2,3] and [3,2].
- Same index can be reused for unlimited counts.
- Early prune when remain goes negative.

---

### 59. Generate Parentheses  ·  LC 22  ·  Medium  ·  Backtracking

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

**Java:**
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

**Key points:**
- Close only when open count exceeds close count.
- Open while open count below n.
- Result count equals the n-th Catalan number.

---

### 60. Word Search  ·  LC 79  ·  Medium  ·  Backtracking

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

**Java:**
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

**Key points:**
- Mark-and-restore avoids extra visited matrix.
- Early failure when chars don't match.
- Try each cell as the start.

---

### 61. Palindrome Partitioning  ·  LC 131  ·  Medium  ·  Backtracking

**Problem:** Given a string s consisting of lowercase English letters, split it into contiguous substrings so that every piece is a palindrome, and return all possible such partitionings. Each partitioning is a list of the substrings in order, and the full collection of partitionings can be returned in any order. Constraints: 1 <= s.length <= 16, so the exponential number of partitionings is bounded.

**Approach:** Use backtracking: at each starting index, try every possible next cut, and recurse only when the candidate prefix is a palindrome, appending a complete partition when the index reaches the end. A two-pointer palindrome check keeps each test cheap, and pruning non-palindromic prefixes avoids exploring dead branches. This runs in O(n * 2^n) time (up to 2^(n-1) partition points, each producing an O(n) copy) and O(n) extra space for the recursion path.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Only recurse into prefixes that are already palindromes, which prunes the search tree.
- Copy the current path when saving a result; otherwise later pops mutate stored answers.
- With n up to 16 the answer set is exponential, so backtracking is expected rather than avoidable.
- A two-pointer check (or precomputed DP table) verifies palindromes in O(n).

---

### 62. N-Queens  ·  LC 51  ·  Hard  ·  Backtracking

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

**Java:**
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

**Key points:**
- One queen per row; track conflicts by column and two diagonals.
- (r - c) identifies a \\-diagonal; (r + c) identifies a /-diagonal.
- Rebuild board strings only on success.

---

### 63. Search Insert Position  ·  LC 35  ·  Easy  ·  Binary Search

**Problem:** Given a sorted array of distinct integers nums and a target value, return the index where target is found; if it is absent, return the index at which it would be inserted to keep the array sorted. The array is in strictly ascending order. Constraints: 1 <= nums.length <= 10^4, -10^4 <= nums[i], target <= 10^4, and the solution must run in O(log n) time.

**Approach:** Run a binary search for the leftmost position whose value is greater than or equal to target, using a half-open interval [lo, hi). Whenever the midpoint is smaller than target we move lo past it; otherwise the answer is at or before mid, so we shrink hi to mid. When the interval collapses, lo is exactly the insertion (or found) index. This is O(log n) time and O(1) space.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Search for the lower bound (first element >= target) rather than exact equality.
- Initialize hi to len(nums) so an insertion at the end is representable.
- The half-open loop lo < hi naturally converges to a single insertion index.
- O(log n) is required, so a linear scan does not meet the constraint.

---

### 64. Search a 2D Matrix  ·  LC 74  ·  Medium  ·  Binary Search

**Problem:** Given an m x n matrix where each row is sorted in ascending order and the first integer of every row is greater than the last integer of the previous row, determine whether a given target value exists in the matrix, returning true or false. Because of this layout the matrix behaves like one fully sorted sequence read row by row. Constraints: 1 <= m, n <= 100, -10^4 <= matrix[i][j], target <= 10^4, with a required O(log(m*n)) time bound.

**Approach:** Treat the matrix as a single sorted array of length m*n and binary search over indices 0..m*n-1, mapping index k to row k//n and column k%n. The row-ordering guarantees mean this virtual flattening is globally sorted, so standard binary search applies. This achieves the required O(log(m*n)) time with O(1) space.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- The two ordering guarantees make the whole grid equivalent to one sorted array.
- Convert a flat index to coordinates with divmod by the column count n.
- A single binary search beats the O(m + n) staircase walk here.
- Use n (columns) for the index mapping, not m.

---

### 65. Find First and Last Position of Element in Sorted Array  ·  LC 34  ·  Medium  ·  Binary Search

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

**Java:**
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

**Key points:**
- Continue searching after match to find boundary.
- Two independent passes; total O(log n).
- Empty array returns [-1, -1].

---

### 66. Search in Rotated Sorted Array  ·  LC 33  ·  Medium  ·  Binary Search

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

**Java:**
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

**Key points:**
- Determine which side is sorted with a single comparison.
- Inclusive bound checks must match the sorted-side endpoints.
- Works on a non-rotated array as a special case.

---

### 67. Find Minimum in Rotated Sorted Array  ·  LC 153  ·  Medium  ·  Binary Search

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

**Java:**
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

**Key points:**
- Compare to `hi`, not `lo`, to handle non-rotated case.
- Loop ends when `lo == hi`, pointing at minimum.
- Distinct elements assumption avoids worst-case O(n).

---

### 68. Median of Two Sorted Arrays  ·  LC 4  ·  Hard  ·  Binary Search

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

**Java:**
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

**Key points:**
- Always binary-search the shorter array.
- Sentinels handle out-of-range partitions.
- Correct partition gives the median directly.

---

### 69. Valid Parentheses  ·  LC 20  ·  Easy  ·  Stack

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

**Java:**
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

**Key points:**
- Stack must be empty at the end.
- Closing without an open returns false on pop.
- Constant alphabet keeps memory tight.

---

### 70. Min Stack  ·  LC 155  ·  Medium  ·  Stack

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

**Java:**
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

**Key points:**
- Storing min per entry costs O(n) extra space.
- Two-stack variant pushes to min-stack only on new minima.
- All operations remain O(1).

---

### 71. Decode String  ·  LC 394  ·  Medium  ·  Stack

**Problem:** Given an encoded string that uses the pattern k[encoded], where the bracketed content must be repeated exactly k times, return the fully decoded string. Encodings can be nested (for example 3[a2[c]] decodes to accaccacc), k is always a positive integer, and the input contains only digits, letters, and square brackets with no stray whitespace or malformed brackets. Constraints: 1 <= s.length <= 30, 1 <= k <= 300, and the decoded output fits comfortably in memory.

**Approach:** Scan left to right maintaining two stacks: one for repeat counts and one for the string built before each open bracket. On '[' push the current count and accumulated string then reset them; on ']' pop the saved prefix and multiplier and splice the repeated inner string back in. This handles arbitrary nesting because each bracket level is restored exactly when its ']' is reached. It runs in O(N) time and O(N) space where N is the length of the decoded output.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Two stacks (counts and partial strings) capture the state at each nesting level.
- Accumulate multi-digit numbers with num = num*10 + digit before hitting '['.
- On ']' the new current is prev + current*repeat, restoring the outer context.
- An iterative stack avoids recursion depth issues and mirrors the nesting naturally.

---

### 72. Daily Temperatures  ·  LC 739  ·  Medium  ·  Stack

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

**Java:**
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

**Key points:**
- Stack stores indices waiting for a warmer day.
- Pop on strict warmer-than relation.
- Remaining stack indices stay at 0.

---

### 73. Largest Rectangle in Histogram  ·  LC 84  ·  Hard  ·  Stack

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

**Java:**
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

**Key points:**
- Sentinel 0 at the end forces final pops.
- Width spans between previous-smaller and current index.
- Each index pushed/popped at most once.

---

### 74. Kth Largest Element in an Array  ·  LC 215  ·  Medium  ·  Heap

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

**Java:**
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

**Key points:**
- Min-heap of size k keeps the k largest.
- Quickselect averages O(n) but worst O(n^2).
- Built-in nlargest works in Python.

---

### 75. Top K Frequent Elements  ·  LC 347  ·  Medium  ·  Heap

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

**Java:**
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

**Key points:**
- Frequency cannot exceed n, so n+1 buckets suffice.
- Avoid sort by traversing buckets high-to-low.
- Heap of size k is the alternative O(n log k).

---

### 76. Find Median from Data Stream  ·  LC 295  ·  Hard  ·  Heap

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

**Java:**
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

**Key points:**
- Invariant: lo.size == hi.size or lo.size == hi.size + 1.
- Pass through hi to maintain ordering.
- Median is either lo's top or average of both tops.

---

### 77. Best Time to Buy and Sell Stock  ·  LC 121  ·  Easy  ·  Greedy

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

**Java:**
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

**Key points:**
- One pass suffices; no need to scan all pairs.
- Initialize `lo` to a sentinel larger than any price.
- Profit cannot be negative since `lo <= p` always.

---

### 78. Jump Game  ·  LC 55  ·  Medium  ·  Greedy

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

**Java:**
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

**Key points:**
- If a position is past reach, you can't even arrive.
- Greedy avoids DP overhead.
- Equivalent to checking reach >= n - 1 at end.

---

### 79. Jump Game II  ·  LC 45  ·  Medium  ·  Greedy

**Problem:** Given a 0-indexed array nums where each element is the maximum forward jump length from that position, return the minimum number of jumps needed to reach the last index starting from index 0. The problem guarantees that the last index is always reachable. Constraints: 1 <= nums.length <= 10^4 and 0 <= nums[i] <= 1000.

**Approach:** Use a greedy BFS-by-levels: track the farthest index reachable overall and the end of the current jump's reach, and whenever the scan reaches that current end you must spend one more jump and extend the boundary to the farthest seen so far. Each contiguous block of indices reachable with the same number of jumps forms one BFS level, so counting boundary crossings yields the minimum. Iterating only up to the second-to-last index avoids an extra count when already at the goal. This is O(n) time and O(1) space.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Greedy level expansion mirrors BFS on reachable ranges, giving the minimum jumps.
- Stop the loop at length-2 so arriving exactly at the last index does not add a jump.
- farthest tracks the best reach across the current window, not just the current element.
- A jump is counted only when the scan hits the current window boundary.

---

### 80. Partition Labels  ·  LC 763  ·  Medium  ·  Greedy

**Problem:** You are given a lowercase-letter string s. Split it into the maximum number of contiguous pieces such that every distinct letter appears in exactly one piece (no letter spans two pieces). Return the list of piece lengths in left-to-right order. Constraints: 1 <= s.length <= 500 and s contains only lowercase English letters.

**Approach:** First record the last index at which each character occurs. Then sweep left to right, extending the current partition's end to the farthest last-occurrence of any character seen so far; when the running index reaches that end, no character inside can appear later, so we can safely cut here. This greedy cut is optimal because it makes each partition as small as possible while still self-contained. O(n) time, O(1) space (a fixed 26-slot table).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Precomputing each letter's last position is what lets a single pass decide cut points
- A partition can only close once i equals the max last-index of all letters seen in it
- Alphabet is fixed size, so the auxiliary table is O(1) not O(n)

---

### 81. Climbing Stairs  ·  LC 70  ·  Easy  ·  Dynamic Programming

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

**Java:**
```java
int climbStairs(int n) {
    int a = 1, b = 1;
    for (int i = 0; i < n; i++) { int t = a + b; a = b; b = t; }
    return a;
}
```

**Key points:**
- Equivalent to F(n+1).
- Avoid recursion stack; iterate.
- Matrix exponentiation gives O(log n) for huge n.

---

### 82. Pascal's Triangle  ·  LC 118  ·  Easy  ·  Dynamic Programming

**Problem:** Given an integer numRows, build the first numRows rows of Pascal's Triangle and return them as a list of lists. Row 0 is [1]; every subsequent row starts and ends with 1, and each interior value equals the sum of the two values diagonally above it in the previous row. Constraints: 1 <= numRows <= 30.

**Approach:** Construct the triangle row by row: initialize each row filled with 1s (which correctly fixes both endpoints), then overwrite each interior cell with the sum of the two adjacent cells from the already-built previous row. Because every value depends only on the prior row, a straightforward bottom-up build produces all entries directly. O(numRows^2) time and O(numRows^2) space, which is optimal since the output itself has that many elements.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Filling rows with 1 first cleanly handles the boundary 1s at both ends
- Interior cell c = prev[c-1] + prev[c]; only interior indices are recomputed
- Output size is quadratic, so no algorithm can beat O(numRows^2) here

---

### 83. House Robber  ·  LC 198  ·  Medium  ·  Dynamic Programming

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

**Java:**
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

**Key points:**
- Only the last two states matter.
- Choice at each step is take-or-skip.
- Initial states represent empty prefix.

---

### 84. Perfect Squares  ·  LC 279  ·  Medium  ·  Dynamic Programming

**Problem:** Given a positive integer n, return the least number of perfect-square integers (1, 4, 9, 16, ...) that sum exactly to n. For example n = 12 returns 3 (4 + 4 + 4) and n = 13 returns 2 (4 + 9). Constraints: 1 <= n <= 10^4.

**Approach:** By Lagrange's four-square theorem the answer is always 1, 2, 3, or 4, so we just identify which. It is 1 iff n is a perfect square; by Legendre's three-square theorem it is 4 iff n has the form 4^k(8m+7); it is 2 iff some a with n - a^2 also a perfect square exists; otherwise it is 3. Checking these takes a loop up to sqrt(n), giving O(sqrt(n)) time and O(1) space.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Four-square theorem caps the answer at 4, turning this into a case check
- Legendre's 4^k(8m+7) test isolates the answer-4 case in O(log n)
- Naive DP is O(n*sqrt(n)); the number-theory route is far faster

---

### 85. Coin Change  ·  LC 322  ·  Medium  ·  Dynamic Programming

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

**Java:**
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

**Key points:**
- Initialize dp[0] = 0 (no coins for amount 0).
- Use a sentinel (amount + 1) as infinity.
- Coin order doesn't matter since each amount considers all coins.

---

### 86. Word Break  ·  LC 139  ·  Medium  ·  Dynamic Programming

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

**Java:**
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

**Key points:**
- dp[0] true represents empty prefix.
- Break inner loop early to save work.
- BFS / Trie variants improve in some cases.

---

### 87. Longest Increasing Subsequence  ·  LC 300  ·  Medium  ·  Dynamic Programming

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

**Java:**
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

**Key points:**
- `tails[i]` is the smallest tail of any LIS of length i+1.
- Final length is the LIS length (not the actual LIS).
- O(n^2) DP also works for smaller inputs.

---

### 88. Maximum Product Subarray  ·  LC 152  ·  Medium  ·  Dynamic Programming

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
- Swap hi/lo on negative numbers before updating.
- Zero resets both hi and lo to the current element.
- Tracking only `hi` would miss negative-negative flips.

---

### 89. Partition Equal Subset Sum  ·  LC 416  ·  Medium  ·  Dynamic Programming

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

**Java:**
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

**Key points:**
- Equivalent to subset-sum to total/2.
- Odd total cannot split.
- Boolean DP array form is also standard.

---

### 90. Longest Valid Parentheses  ·  LC 32  ·  Hard  ·  Dynamic Programming

**Problem:** Given a string s consisting only of the characters '(' and ')', find the length of the longest contiguous substring that forms a well-formed (properly balanced and nested) sequence of parentheses. For example ")()())" yields 4 for the substring "()()". Constraints: 0 <= s.length <= 3 * 10^4.

**Approach:** Keep a stack of indices seeded with -1 to act as a base boundary. Push the index of each '(' ; on each ')' pop, and if the stack becomes empty push the current index as a new boundary, otherwise the length of the valid run ending here is the current index minus the new stack top. This works because the stack top always holds the index just before the current valid segment. O(n) time, O(n) space.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Seeding the stack with -1 gives a clean base for length arithmetic
- When the stack empties after a pop, the ')' becomes the new boundary marker
- Length is i - stack.top(), not a running counter, which handles resets correctly

---

### 91. Unique Paths  ·  LC 62  ·  Medium  ·  Multi-dim DP

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

**Java:**
```java
int uniquePaths(int m, int n) {
    int[] dp = new int[n];
    Arrays.fill(dp, 1);
    for (int i = 1; i < m; i++)
        for (int j = 1; j < n; j++) dp[j] += dp[j - 1];
    return dp[n - 1];
}
```

**Key points:**
- Closed form: C(m+n-2, m-1).
- Row reuse compresses space.
- First row/col are all 1.

---

### 92. Minimum Path Sum  ·  LC 64  ·  Medium  ·  Multi-dim DP

**Problem:** Given an m x n grid of non-negative integers, find a path from the top-left cell to the bottom-right cell that minimizes the sum of the numbers along the path, where you may move only right or down at each step. Return that minimum sum. Constraints: 1 <= m, n <= 200 and 0 <= grid[i][j] <= 200.

**Approach:** Use dynamic programming where each cell holds the minimum cost to reach it: the first row and first column can only be reached one way (accumulate along them), and every other cell adds its own value to the smaller of the costs from directly above or directly left. Computing in place mutates the grid into the DP table, so no extra array is needed. O(m*n) time and O(1) extra space.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Only right/down moves means each cell depends solely on top and left neighbors
- First row and column are edge cases with a single incoming direction
- Reusing the input grid as the DP table gives O(1) extra space

---

### 93. Longest Palindromic Substring  ·  LC 5  ·  Medium  ·  Multi-dim DP

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
- Two center types cover odd and even length palindromes.
- Manacher's algorithm gets O(n) but is more complex.
- Track best by length difference, not recompute.

---

### 94. Longest Common Subsequence  ·  LC 1143  ·  Medium  ·  Multi-dim DP

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

**Java:**
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

**Key points:**
- Use shorter string as columns to save memory.
- Diagonal from match plus one.
- Doesn't reconstruct the subsequence (would need extra work).

---

### 95. Edit Distance  ·  LC 72  ·  Medium  ·  Multi-dim DP

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

**Java:**
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

**Key points:**
- Three operations correspond to three cells.
- Match copies the diagonal value.
- Row compression keeps O(n) memory.

---

### 96. Single Number  ·  LC 136  ·  Easy  ·  Techniques

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

**Java:**
```java
int singleNumber(int[] nums) {
    int r = 0;
    for (int x : nums) r ^= x;
    return r;
}
```

**Key points:**
- XOR is commutative/associative.
- Hash counts work but use O(n) memory.
- Variant where it appears thrice needs bit-by-bit count mod 3.

---

### 97. Majority Element  ·  LC 169  ·  Easy  ·  Techniques

**Problem:** Given an integer array of length n, return the element that appears more than n/2 times. The majority element is guaranteed to exist, so no validity check is required. Constraints: 1 <= n <= 5*10^4 and each value fits in a 32-bit signed integer.

**Approach:** Use the Boyer-Moore voting algorithm: keep a running candidate and a counter, incrementing when the current value matches the candidate and decrementing otherwise, resetting the candidate whenever the counter hits zero. Because the majority element occupies more than half the array, all cancellations from other elements cannot fully eliminate it, so it survives as the final candidate. O(n) time, O(1) space.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Boyer-Moore voting avoids the O(n) extra space a hash-map count would need
- Works only because the majority is strictly greater than n/2, guaranteeing survival
- Counter reset on zero effectively pairs off and discards non-majority elements
- Sorting and taking the middle also works but costs O(n log n)

---

### 98. Sort Colors  ·  LC 75  ·  Medium  ·  Techniques

**Problem:** Given an array containing only the values 0, 1, and 2 representing red, white, and blue objects, sort it in place so that objects of the same color are grouped and ordered as red, white, blue. You must not use a library sort. Constraints: 1 <= n <= 300 and every element is one of 0, 1, or 2.

**Approach:** Apply the Dutch National Flag algorithm with three pointers: low marks the boundary of settled 0s, high marks the boundary of settled 2s, and mid scans forward. On seeing a 0 swap it to the low region and advance both low and mid; on a 1 just advance mid; on a 2 swap it to the high region and shrink high without advancing mid, since the swapped-in value is still unexamined. This partitions the array in a single pass. O(n) time, O(1) space.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Single pass beats the two-pass counting-sort approach in one traversal
- Do not advance mid after swapping with high — the incoming element is unexamined
- The loop invariant keeps [0,low) as 0s, [low,mid) as 1s, and (high,end] as 2s
- Everything happens in place with only pointer swaps

---

### 99. Next Permutation  ·  LC 31  ·  Medium  ·  Techniques

**Problem:** Given an array of integers representing a permutation, rearrange it in place into the next lexicographically greater permutation. If no greater arrangement exists (the array is in descending order), transform it into the smallest permutation, i.e. sorted ascending. Constraints: 1 <= n <= 100 and each value is between 0 and 100.

**Approach:** Scan from the right to find the first index i where nums[i] < nums[i+1]; this pivot is the rightmost position that can be increased. If it exists, find the rightmost element greater than nums[i] and swap them, which places the smallest possible larger value at the pivot. Finally reverse the suffix after i, turning its descending order into ascending to make it the smallest tail. O(n) time, O(1) space.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- The suffix after the pivot is always non-increasing, so reversing it yields the minimal tail
- Swap with the rightmost element strictly greater than the pivot to keep the suffix sorted
- When no pivot exists the whole array is descending; reversing gives the ascending minimum
- Everything is done in place without generating all permutations

---

### 100. Find the Duplicate Number  ·  LC 287  ·  Medium  ·  Techniques

**Problem:** Given an array of n+1 integers where every value lies in the range 1 to n, exactly one number is repeated (possibly more than once) while all others appear once; return that repeated number. You must not modify the array and must use only constant extra space. Constraints: 1 <= n <= 10^5 and 1 <= nums[i] <= n.

**Approach:** Treat each index as a node pointing to the node given by its value, which forms a linked list that must contain a cycle because the duplicate value makes two indices point to the same node. Use Floyd's tortoise-and-hare: advance a slow pointer one step and a fast pointer two steps until they meet inside the cycle, then reset one pointer to the start and move both one step at a time; their meeting point is the cycle entrance, which equals the duplicate. O(n) time, O(1) space.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Values in [1,n] over n+1 slots guarantee a cycle whose entrance is the duplicate
- Floyd's cycle detection meets the no-modify and O(1)-space constraints that sorting or hashing violate
- The second phase relies on the math that distance from head to entrance equals distance from meeting point to entrance
- Binary search on value range is an alternative O(n log n) approach

---
