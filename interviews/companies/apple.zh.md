# 苹果

```yaml
company: 苹果
typical_rounds: 1 轮 recruiter 沟通 + 1 轮电话面 + 4-6 轮 onsite（团队自定；可能一天打完也可能拆成几天）
focus_areas: 强烈依赖团队——算法 + 系统设计 + 深度领域专长
languages_allowed: iOS 用 Swift/Objective-C，嵌入式用 C/C++，Web 用 JS/TS，ML 用 Python
duration: 每轮 45-60 分钟
notable_quirks:
  - Loop 由招聘团队主导——题目和结构因组而异，差别很大
  - 强领域深挖（如前端考 web perf，音频考信号处理，内核考底层）
  - 隐私和端上计算的理念会被问到
  - 常见"跨职能"轮——与非工程师介绍你的工作
  - 反馈较少，流程长（常 4-8 周）
sources: Glassdoor、LeetCode Discuss（apple 标签）、Blind、levels.fyi
```

## 概述

苹果是 FAANG 中面试与团队相关度最高的。Safari 前端、CoreAudio 和 Siri ML 三个岗位几乎毫无相似之处。本文偏向通用 SWE / 前端角度，覆盖面较广。各团队的共性：期望候选人具备深度领域知识（你应该在*某个方向*是专家）、隐私优先意识、对用户可感知细节的关注，以及偏好能端到端 own 问题的资深工程师。代码质量的门槛很高——打磨很重要。

## 题目

### 1. 三数之和

**难度：** 中等
**主题：** arrays, two-pointer, sorting
**岗位：** SWE
**级别：** ICT3-ICT4

**问题：** 给定数组 `nums`，返回所有满足 `a + b + c == 0` 的不重复三元组 `[a, b, c]`。

**思路：** 排序。固定 `i` 遍历；对每个 `i`，在右侧子数组用双指针 `l, r` 找和为 `-nums[i]` 的两数。三个位置都跳过重复以保证唯一性。O(n²) 时间，O(1) 额外（输出不计）。

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
            if s < 0: l += 1
            elif s > 0: r -= 1
            else:
                out.append([nums[i], nums[l], nums[r]])
                l += 1; r -= 1
                while l < r and nums[l] == nums[l - 1]: l += 1
                while l < r and nums[r] == nums[r + 1]: r -= 1
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
class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
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
}
```

**要点：**
- 排序后既能用双指针扫描，也能方便地跳过重复。
- 在固定下标和每次匹配后都要跳过重复，避免输出重复三元组。
- 当 `nums[i] > 0` 时可以提前 break，剩余元素之和不可能为 0。

**标签：** #algorithm

---

### 2. 除自身以外数组的乘积

**难度：** 中等
**主题：** arrays, prefix-product
**岗位：** SWE
**级别：** ICT3-ICT4

**问题：** 给定整数数组 `nums`，返回数组 `out`，其中 `out[i] = 除 nums[i] 外所有元素的乘积`。不能用除法，O(n)。

**思路：** 两次遍历：第一次 `out[i] = nums[0..i-1] 的乘积`（左积）。第二次从右往左，乘以累计的右积。O(n) 时间，O(1) 额外（输出不计）。注意 0 的处理——朴素除法在含 0 时失效。

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
  const out: number[] = new Array(n).fill(1);
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
class Solution {
    public int[] productExceptSelf(int[] nums) {
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
}
```

**要点：**
- 输出数组本身充当前缀积缓冲区，把额外空间压到 O(1)。
- 第二趟用单个标量维护后缀积。
- 含 0 的情形天然处理，无需特判。

**标签：** #algorithm

---

### 3. 合并两个有序链表

**难度：** 简单
**主题：** linked-list, recursion
**岗位：** SWE
**级别：** ICT3

**问题：** 把两个有序链表合并成一个有序链表。

**思路：** 哑头节点，双指针，谁小接谁，推进，重复。最后接上剩余部分。O(n+m)，O(1)。递归写法：`merge(a, b) = a < b ? a + merge(a.next, b) : b + merge(a, b.next)`——简洁但 O(n+m) 栈深。

**Python：**
```python
class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val = val
        self.next = next

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
  val: number;
  next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) { this.val = val; this.next = next; }
}

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
class ListNode {
    int val; ListNode next;
    ListNode() {}
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}
class Solution {
    public ListNode mergeTwoLists(ListNode a, ListNode b) {
        ListNode dummy = new ListNode(), tail = dummy;
        while (a != null && b != null) {
            if (a.val <= b.val) { tail.next = a; a = a.next; }
            else { tail.next = b; b = b.next; }
            tail = tail.next;
        }
        tail.next = (a != null) ? a : b;
        return dummy.next;
    }
}
```

**要点：**
- 哑头节点消除首节点的特殊处理。
- 一边走空后 O(1) 接上另一边的剩余部分。
- 相等时保持稳定顺序，符合链表语义。

**标签：** #algorithm

---

### 4. 最长回文子串

**难度：** 中等
**主题：** strings, dp, expand-around-center
**岗位：** SWE
**级别：** ICT3-ICT4

**问题：** 给定字符串 `s`，返回最长回文子串。

**思路：** 中心扩展——对每个下标 i，尝试奇长度（中心=i）和偶长度（中心在 i 和 i+1 之间）两种扩张，记录最优。O(n²) 时间，O(1) 空间。Manacher 是 O(n) 但很少要求。注意长度和子串下标的 off-by-one。

**Python：**
```python
def longest_palindrome(s: str) -> str:
    def grow(l: int, r: int) -> tuple[int, int]:
        while l >= 0 and r < len(s) and s[l] == s[r]:
            l -= 1; r += 1
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
class Solution {
    private int bl = 0, br = 0;
    public String longestPalindrome(String s) {
        for (int i = 0; i < s.length(); i++) { grow(s, i, i); grow(s, i, i + 1); }
        return s.substring(bl, br + 1);
    }
    private void grow(String s, int l, int r) {
        while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) { l--; r++; }
        l++; r--;
        if (r - l > br - bl) { bl = l; br = r; }
    }
}
```

**要点：**
- 两种中心类型统一覆盖奇偶长度的回文。
- 用长度差比较记录最优区间，避免反复切片。
- Manacher 可达 O(n)，但常数和代码复杂度通常不值。

**标签：** #algorithm

---

### 5. 实现 strStr() / 查找子串

**难度：** 简单
**主题：** strings, sliding-window, kmp
**岗位：** SWE
**级别：** ICT3

**问题：** 实现 `strStr(haystack, needle)`——返回 `needle` 在 `haystack` 中首次出现的下标，否则 -1。

**思路：** 朴素滑窗 O(n*m)。苹果常追问"做成 O(n+m)"→ KMP 配 failure 函数，或 Rabin-Karp 滚动哈希。准备好讲清 KMP failure 函数的构造。

**Python：**
```python
def str_str(haystack: str, needle: str) -> int:
    if not needle:
        return 0
    lps = [0] * len(needle)
    k = 0
    for i in range(1, len(needle)):
        while k and needle[k] != needle[i]:
            k = lps[k - 1]
        if needle[k] == needle[i]:
            k += 1
        lps[i] = k
    j = 0
    for i, c in enumerate(haystack):
        while j and needle[j] != c:
            j = lps[j - 1]
        if needle[j] == c:
            j += 1
        if j == len(needle):
            return i - j + 1
    return -1
```

**TypeScript：**
```typescript
function strStr(haystack: string, needle: string): number {
  if (!needle) return 0;
  const lps = new Array(needle.length).fill(0);
  let k = 0;
  for (let i = 1; i < needle.length; i++) {
    while (k && needle[k] !== needle[i]) k = lps[k - 1];
    if (needle[k] === needle[i]) k++;
    lps[i] = k;
  }
  let j = 0;
  for (let i = 0; i < haystack.length; i++) {
    while (j && needle[j] !== haystack[i]) j = lps[j - 1];
    if (needle[j] === haystack[i]) j++;
    if (j === needle.length) return i - j + 1;
  }
  return -1;
}
```

**Java：**
```java
class Solution {
    public int strStr(String haystack, String needle) {
        if (needle.isEmpty()) return 0;
        int m = needle.length();
        int[] lps = new int[m];
        for (int i = 1, k = 0; i < m; i++) {
            while (k > 0 && needle.charAt(k) != needle.charAt(i)) k = lps[k - 1];
            if (needle.charAt(k) == needle.charAt(i)) k++;
            lps[i] = k;
        }
        for (int i = 0, j = 0; i < haystack.length(); i++) {
            while (j > 0 && needle.charAt(j) != haystack.charAt(i)) j = lps[j - 1];
            if (needle.charAt(j) == haystack.charAt(i)) j++;
            if (j == m) return i - j + 1;
        }
        return -1;
    }
}
```

**要点：**
- KMP 通过 `lps` 表避免回退 haystack，从而做到 O(n + m)。
- `lps[i]` 是 needle 前 i+1 个字符中最长的"既是真前缀又是真后缀"的长度。
- 空 needle 按约定返回 0，对齐 C 库 `strstr` 的语义。

**标签：** #algorithm

---

### 6. LRU 缓存

**难度：** 中等
**主题：** ood, hashmap, linked-list
**岗位：** SWE
**级别：** ICT3-ICT4

**问题：** 设计 LRU 缓存，`get` 和 `put` 均为 O(1)。

**思路：** 哈希表 `key -> node` + 双向链表（head=最近，tail=最旧）。`get` 时把节点移到头。`put` 溢出时丢尾。苹果可能追问：做成线程安全（按 bucket 加锁，或对 Node 做 CAS）。

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
      const oldest = this.m.keys().next().value as number;
      this.m.delete(oldest);
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
    public int get(int key) { return getOrDefault(key, -1); }
    public void put(int key, int value) { super.put(key, value); }
    @Override
    protected boolean removeEldestEntry(Map.Entry<Integer, Integer> eldest) {
        return size() > cap;
    }
}
```

**要点：**
- Python `OrderedDict` 和 JS `Map` 都保留插入顺序——访问时重插即标记"最新"。
- 淘汰只是弹出最早的 key，O(1)。
- 生产代码常用哈希表 + 自定义双向链表，便于并发场景下保持指针稳定。

**标签：** #algorithm

---

### 7. 二叉树中的最大路径和

**难度：** 困难
**主题：** tree, dp, recursion
**岗位：** SWE
**级别：** ICT4

**问题：** 给定非空二叉树，求最大路径和。路径可起始于任意节点，不一定经过根。

**思路：** DFS 返回"从该节点向下走一条边的最大增益"（max(0, left)、max(0, right)——负值丢弃）。在每个节点，候选完整路径 = `node.val + leftGain + rightGain`；更新全局最大值。给父节点返回 `node.val + max(leftGain, rightGain)`。O(n)。

**Python：**
```python
class TreeNode:
    def __init__(self, val: int = 0, left: "TreeNode | None" = None, right: "TreeNode | None" = None) -> None:
        self.val = val; self.left = left; self.right = right

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
class TreeNode {
    int val; TreeNode left, right;
    TreeNode(int val) { this.val = val; }
}
class Solution {
    private int best = Integer.MIN_VALUE;
    public int maxPathSum(TreeNode root) { gain(root); return best; }
    private int gain(TreeNode n) {
        if (n == null) return 0;
        int l = Math.max(0, gain(n.left));
        int r = Math.max(0, gain(n.right));
        best = Math.max(best, n.val + l + r);
        return n.val + Math.max(l, r);
    }
}
```

**要点：**
- 用 `max(0, ...)` 丢弃负的子树贡献。
- 当前节点的候选最优同时使用左右两侧，但回传给父节点时只取一侧。
- 初始最优为 `-Infinity`，正确处理全负值的树。

**标签：** #algorithm

---

### 8. 零钱兑换

**难度：** 中等
**主题：** dp, greedy
**岗位：** SWE
**级别：** ICT3-ICT4

**问题：** 给定面额和目标金额，返回凑出该金额所需的最少硬币数，或 -1。

**思路：** 自底向上 DP。`dp[i]` = 凑出 `i` 所需最少硬币；`dp[0] = 0`，`dp[i] = min(dp[i - c] + 1)`，c <= i。O(amount * coins)。任意面额下贪心失败（如 [1, 3, 4] 凑 6 → 贪心 4+1+1=3，最优 3+3=2）。

**Python：**
```python
def coin_change(coins: list[int], amount: int) -> int:
    INF = amount + 1
    dp = [0] + [INF] * amount
    for i in range(1, amount + 1):
        for c in coins:
            if c <= i and dp[i - c] + 1 < dp[i]:
                dp[i] = dp[i - c] + 1
    return -1 if dp[amount] == INF else dp[amount]
```

**TypeScript：**
```typescript
function coinChange(coins: number[], amount: number): number {
  const INF = amount + 1;
  const dp = new Array(amount + 1).fill(INF);
  dp[0] = 0;
  for (let i = 1; i <= amount; i++) {
    for (const c of coins) {
      if (c <= i && dp[i - c] + 1 < dp[i]) dp[i] = dp[i - c] + 1;
    }
  }
  return dp[amount] === INF ? -1 : dp[amount];
}
```

**Java：**
```java
import java.util.Arrays;
class Solution {
    public int coinChange(int[] coins, int amount) {
        int inf = amount + 1;
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, inf);
        dp[0] = 0;
        for (int i = 1; i <= amount; i++) {
            for (int c : coins) {
                if (c <= i && dp[i - c] + 1 < dp[i]) dp[i] = dp[i - c] + 1;
            }
        }
        return dp[amount] == inf ? -1 : dp[amount];
    }
}
```

**要点：**
- 哨兵 `amount + 1` 安全，因为答案不可能超过 `amount`（若有 1 元面额则全用 1 元）。
- 外层金额、内层面额是完全背包的经典写法。
- 贪心只在面额规范（如美元）时正确，要先证再用。

**标签：** #algorithm

---

### 9. 设计 Apple Music（或类 Spotify）

**难度：** 困难
**主题：** system-design, cdn, drm, recommendation, offline
**岗位：** 高级 SWE
**级别：** ICT5

**问题：** 设计 Apple Music：流媒体、曲库、推荐、离线模式、无损音频。

**思路：** 音频文件存对象存储 + CDN，多码率（AAC 256kbps、无损 ALAC）。DRM 用 FairPlay。元数据按 track_id 分片；用户曲库（歌单、喜欢）按 user_id 分片。推荐：离线 two-tower embedding 模型 + 端上重排序（贴合苹果的隐私倾向）。离线下载：客户端管理本地缓存 + DRM 许可证刷新。讨论：跨设备同步（CloudKit）、无损流的带宽、如何通过端上个性化来保护隐私。

**标签：** #system-design

---

### 10. 设计 iMessage

**难度：** 困难
**主题：** system-design, e2e-encryption, apns, multi-device
**岗位：** 高级 SWE
**级别：** ICT5

**问题：** 设计 iMessage：端到端加密、多设备投递、降级到 SMS。

**思路：** 每台设备有自己的密钥对，注册到 Apple Push Service。发送方对消息加密 N 次（每个接收方设备一次），通过 APNS 投递。服务端临时存密文直至送达后删除。讨论：身份服务把电话/邮箱映射到设备列表（这是信任锚点，因此有 Contact Key Verification 功能）、大群密钥（sender key 模型）、媒体（类 S3 blob + 每消息密钥）、对方不在 iMessage 时优雅降级到 SMS。

**标签：** #system-design

---

### 11. 设计 iCloud 照片图库

**难度：** 困难
**主题：** system-design, sync, dedup, ml-on-device
**岗位：** 高级 SWE
**级别：** ICT5

**问题：** 设计 iCloud 照片：多设备同步、去重、按内容搜索、单设备编辑全设备同步。

**思路：** 基于内容寻址的 blob 存储（原图 SHA-256）实现跨用户去重（隐私下：哈希含用户级 salt，若真正 E2E 则无跨用户去重）。每用户 CloudKit zone 存元数据。编辑以非破坏性调整（小 JSON）形式叠加在原图上。按内容搜索靠端上 ML（苹果 Photos 使用端上分类——embedding 以加密元数据存储，搜索在本地完成）。多设备同步走 CKShare 增量。讨论带宽（懒拉原图、急拉缩略图）和"优化存储"特性。

**标签：** #system-design

---

### 12. 设计推送通知服务（类 APNS）

**难度：** 困难
**主题：** system-design, push, persistent-connections, fanout
**岗位：** 高级 SWE
**级别：** ICT5

**问题：** 设计 Apple Push Notification Service——一个对全球每台活跃 iOS 设备保持长连接、并投递推送的系统。

**思路：** 边缘层是有状态的连接服务器，每台维持上百万长 TLS 连接（内核调优）。设备约每 20 分钟一次保活（省电）。生产方 App 推送 → 网关 → 路由（device_token → 通过一致性哈希到对应连接服务器）→ 投递。持久队列（Kafka）暂存设备临时离线的消息，超过 TTL 丢弃。讨论：TLS 握手摊销、NAT 保活、优先级分级、同一通知多次发送的去重。

**标签：** #system-design

---

### 13. 设计 Find My（离线查找）

**难度：** 困难
**主题：** system-design, e2e-encryption, ble, privacy
**岗位：** 高级 SWE
**级别：** ICT5

**问题：** 设计苹果 Find My 网络——丢失设备离线时也能定位，且苹果无法知道其位置。

**思路：** 丢失设备发出由公钥派生的、定期轮换的 BLE 信标（私钥保存在物主的其他苹果设备上）。附近 iPhone 检测到后用该公钥加密自己的位置，上传到苹果。物主用私钥查询。苹果无法解密——只有物主能。权衡：服务端只存不透明密文（数据量大）、密钥轮换防止长期追踪、发现者手机无感转发。讨论碰撞抗性、重放攻击、物主设备如何共享私钥链。

**标签：** #system-design

---

### 14. 设计 CDN

**难度：** 困难
**主题：** system-design, cdn, caching, dns
**岗位：** 高级 SWE
**级别：** ICT5

**问题：** 设计类似 Akamai 或苹果边缘缓存的 CDN。覆盖路由、缓存层级和失效。

**思路：** 在主要城市部署边缘 PoP；用户通过 GeoDNS 或 anycast BGP 被路由到最近节点。边缘 → 区域缓存 → 源站（分层以摊销源站压力）。缓存键 = URL + headers (Vary)。失效：purge API → 通过 pub/sub 传播到所有边缘（最终一致，秒级）。缓存未命中时回源；私有内容用签名 URL。讨论：缓存击穿（边缘做请求合并）、TLS 在边缘终结、最后一公里用 HTTP/3 / QUIC。

**标签：** #system-design

---

### 15. 讲一次你纠结于某个细节的经历

**难度：** 中等
**主题：** behavioral, attention-to-detail, craft
**岗位：** SWE
**级别：** ICT3-ICT4

**问题：** 讲一次你深入到一个别人可能忽视的小细节的经历。

**思路：** 苹果重视工艺——挑那种细节真正影响到用户的故事（延迟降低、动画卡顿修复、无人提报的可访问性 bug）。STAR 重点：(1) 别人没注意你注意到了，(2) 你度量了影响（不是"感觉好多了"），(3) 你说服团队为此投入时间。避免"我为了纯粹重写了一切"——那不是工艺，是虚荣。

**标签：** #behavioral

---

### 16. 在速度和质量之间权衡的经历

**难度：** 中等
**主题：** behavioral, tradeoffs, judgment
**岗位：** 高级 SWE
**级别：** ICT5

**问题：** 讲一次你必须在快速发布和高质量交付之间做权衡。你怎么决定？

**思路：** 苹果文化：准备好了再发，不是按排期发。但他们要的是务实，不是完美主义。展示：(1) 你明确定义了底线（P0 vs P2 bug 的标准），(2) 你向 PM/领导沟通了权衡，(3) 你跟进了发布后的收尾以补齐差距。避免"我们为了打磨延期 3 个月"却没有足够的用户影响佐证。

**标签：** #behavioral

---

### 17. 与难合作的跨职能伙伴共事的经历

**难度：** 中等
**主题：** behavioral, cross-functional, conflict
**岗位：** 高级 SWE
**级别：** ICT5

**问题：** 讲一次你与设计师、PM 或其他工程师有过棘手合作关系的经历。你怎么搞定的？

**思路：** 苹果的设计和 PM 职能很强——工程师必须高效协作。展示：(1) 你尝试理解对方的视角（设计语言、用户研究数据），(2) 你找到了共同的指标/目标，(3) 你调整的是*自己的*沟通方式，而不是要求对方变。加分：这段关系后来发展为长期高产的伙伴关系。

**标签：** #behavioral

---

### 18. 你为什么想加入苹果

**难度：** 简单
**主题：** behavioral, motivation, fit
**岗位：** SWE
**级别：** ICT3-ICT5

**问题：** 为什么是苹果，而不是 <Google/Meta/Microsoft>？

**思路：** 别说"股票"或"品牌"。挑一个：(1) 你使用且热爱的具体产品（说清具体什么），(2) 苹果的隐私立场如何契合你的工作价值观，(3) 你在别处做不到的软硬件整合，(4) 团队的具体使命。准备一件具体做过的事来证明你的兴趣（如向 Swift 提交了贡献、做过 iOS App、读过苹果 ML 研究论文）。

**标签：** #behavioral

---

### 19. 前端 / web perf：优化 Largest Contentful Paint

**难度：** 困难
**主题：** web-perf, frontend, lcp
**岗位：** 前端
**级别：** ICT5

**问题：** apple.com 一个营销页在 3G 下 LCP 为 4.5s。如何降到 2.5s 以下？

**思路：** 先识别 LCP 元素（DevTools → Performance → LCP 标记）。常见收益：(1) 用 `<link rel=preload as=image>` + `fetchpriority=high` 预加载 LCP 图，(2) 用 AVIF/WebP + 合理的 `srcset`，(3) 消除阻塞渲染的 CSS——内联关键 CSS，其余 defer，(4) 消除阻塞渲染的 JS——非关键全部 defer，(5) 用 HTTP/2 push 或 103 Early Hints，(6) 服务端渲染首屏 hero，(7) 优化 TTFB（边缘缓存、减少重定向）。用 RUM 实测数据衡量，不只是 lab。提一句 `loading=lazy` *不应* 加在 LCP 图上（反模式）。

**标签：** #domain-knowledge

---

### 20. 端上 ML 与云端 ML 的权衡

**难度：** 中等
**主题：** ml, privacy, mobile, ood
**岗位：** 高级 SWE
**级别：** ICT5

**问题：** 一个新功能需要对用户数据做 ML 推理。应该在端上还是云上跑？讲讲权衡。

**思路：** 苹果偏好端上是文化基调。端上优点：隐私（数据不离开设备）、延迟（无网络往返）、可离线、无服务器成本。缺点：模型体积受限（必须能塞进几十 MB）、无联邦学习时无法在用户间共享学习成果、更新麻烦（必须随 OS 发布）。云端更优的场景：模型太大（LLM）、需要聚合数据、需要明确同意的服务端个性化。讨论混合方案（端上候选生成 + 云端用哈希特征重排），以及上传聚合统计时用差分隐私。

**标签：** #domain-knowledge

---

### 21. 搜索旋转排序数组

**难度：** 中等
**主题：** arrays, binary-search
**岗位：** ICT4
**级别：** ICT3-ICT4

**问题：** 一个升序排序数组在未知位置被旋转。给定目标值，返回其下标，否则 -1。要求 O(log n)。

**思路：** 改造二分查找。每步中 `[l..mid]` 或 `[mid..r]` 必有一半有序——通过比较 `nums[l] <= nums[mid]` 判断。检查目标是否落在有序那一半；在那一半递归，否则在另一半递归。O(log n) 时间，O(1) 空间。注意重复元素（退化到 O(n)）。

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
class Solution {
    public int search(int[] nums, int target) {
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
}
```

**要点：**
- 通过比较端点判断哪一半有序。
- 闭区间比较要和有序那一半的端点匹配（`<= ... <` vs `< ... <=`）。
- 含重复元素时最坏可退化到 O(n)，应使用允许重复的变体。

**标签：** #algorithm

---

### 22. 寻找旋转排序数组中的最小值

**难度：** 中等
**主题：** arrays, binary-search
**岗位：** ICT3
**级别：** ICT3

**问题：** 给定一个元素唯一的旋转排序数组，O(log n) 返回最小元素。

**思路：** 用 `nums[mid]` 与 `nums[r]` 比较的二分。若 `nums[mid] > nums[r]`，最小值在右半（`l = mid+1`）；否则在含 mid 的左半（`r = mid`）。循环至 `l == r`。O(log n)，O(1)。

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
class Solution {
    public int findMin(int[] nums) {
        int lo = 0, hi = nums.length - 1;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (nums[mid] > nums[hi]) lo = mid + 1;
            else hi = mid;
        }
        return nums[lo];
    }
}
```

**要点：**
- 与 `hi`（而不是 `lo`）比较，能正确处理未旋转的情形。
- 循环终止时 `lo == hi`，指向最小值。
- 元素唯一保证比较严格，避免最坏 O(n)。

**标签：** #algorithm

---

### 23. 第一个错误的版本

**难度：** 简单
**主题：** binary-search, api
**岗位：** ICT3
**级别：** ICT3

**问题：** 版本 1..n 中某一个开始变坏，之后全部都坏。给定 `isBadVersion(v)` API，找出第一个坏版本，调用次数尽量少。

**思路：** 经典左边界二分。`l = 1, r = n`；while `l < r`，`mid = l + (r-l)/2`；坏则 `r = mid`，否则 `l = mid+1`。用 `l + (r-l)/2` 防溢出。O(log n) 次调用。

**Python：**
```python
def is_bad_version(v: int) -> bool: ...  # 由系统提供

def first_bad_version(n: int) -> int:
    lo, hi = 1, n
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if is_bad_version(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo
```

**TypeScript：**
```typescript
declare function isBadVersion(v: number): boolean;

function firstBadVersion(n: number): number {
  let lo = 1, hi = n;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (isBadVersion(mid)) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}
```

**Java：**
```java
public class Solution extends VersionControl {
    public int firstBadVersion(int n) {
        int lo = 1, hi = n;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (isBadVersion(mid)) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
}
```

**要点：**
- 用 `lo + (hi - lo) / 2`，在有界整型语言里避免溢出。
- 不变式：`hi` 始终是坏版本（或 `n`），保证边界正确。
- 循环终止时 `lo == hi`，即第一个坏版本。

**标签：** #algorithm

---

### 24. x 的平方根

**难度：** 简单
**主题：** binary-search, math
**岗位：** ICT3
**级别：** ICT3

**问题：** 不用内置 sqrt，计算 `x` 的整数平方根（向下取整）。

**思路：** 在 `[0, x]` 上二分。不变式：找最大的 `k` 满足 `k*k <= x`。`mid = l + (r-l)/2`，将 `mid*mid` 与 `x` 比较（转 long 防溢出）。或用牛顿迭代 `x_{n+1} = (x_n + x/x_n)/2`，二次收敛。O(log x)。

**Python：**
```python
def my_sqrt(x: int) -> int:
    lo, hi, ans = 0, x, 0
    while lo <= hi:
        mid = (lo + hi) // 2
        if mid * mid <= x:
            ans = mid
            lo = mid + 1
        else:
            hi = mid - 1
    return ans
```

**TypeScript：**
```typescript
function mySqrt(x: number): number {
  let lo = 0, hi = x, ans = 0;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (mid * mid <= x) { ans = mid; lo = mid + 1; }
    else hi = mid - 1;
  }
  return ans;
}
```

**Java：**
```java
class Solution {
    public int mySqrt(int x) {
        long lo = 0, hi = x, ans = 0;
        while (lo <= hi) {
            long mid = lo + (hi - lo) / 2;
            if (mid * mid <= x) { ans = mid; lo = mid + 1; }
            else hi = mid - 1;
        }
        return (int) ans;
    }
}
```

**要点：**
- 用 `ans` 记录最近一次合法 `mid`，因为循环结束前会越界一次。
- Java/C++ 中要把 `mid * mid` 转为更宽的类型避免溢出。
- 牛顿迭代收敛极快，但需要小心选择起点。

**标签：** #algorithm

---

### 25. Pow(x, n)

**难度：** 中等
**主题：** math, recursion, bit-manipulation
**岗位：** ICT4
**级别：** ICT3-ICT4

**问题：** 实现 `pow(x, n)`，`x` 为实数，`n` 为整数（可负）。

**思路：** 快速幂（平方法）。若 `n < 0`，取负并对 `x` 取倒数。迭代：当 `n > 0` 时，若 `n & 1` 则结果乘以 `x`；`x` 自乘；`n` 右移。注意 `INT_MIN` 取负——转 long。O(log n) 时间，O(1) 空间。

**Python：**
```python
def my_pow(x: float, n: int) -> float:
    if n < 0:
        x, n = 1 / x, -n
    result = 1.0
    while n > 0:
        if n & 1:
            result *= x
        x *= x
        n >>= 1
    return result
```

**TypeScript：**
```typescript
function myPow(x: number, n: number): number {
  if (n < 0) { x = 1 / x; n = -n; }
  let result = 1;
  while (n > 0) {
    if (n & 1) result *= x;
    x *= x;
    n = Math.floor(n / 2);
  }
  return result;
}
```

**Java：**
```java
class Solution {
    public double myPow(double x, int n) {
        long N = n;
        if (N < 0) { x = 1 / x; N = -N; }
        double result = 1.0;
        while (N > 0) {
            if ((N & 1) == 1) result *= x;
            x *= x;
            N >>= 1;
        }
        return result;
    }
}
```

**要点：**
- 每步把指数减半，乘法次数为 O(log n)。
- 负指数：先对 `x` 取倒数再把 `n` 取正。
- 有界整型语言中处理 `INT_MIN`，先转更宽类型再取负。

**标签：** #algorithm

---

### 26. 盛最多水的容器

**难度：** 中等
**主题：** arrays, two-pointer
**岗位：** ICT3
**级别：** ICT3-ICT4

**问题：** 给定高度数组 `h[i]`，选两个下标组成容器；最大化 `min(h[i], h[j]) * (j - i)`。

**思路：** 双指针放两端。算面积；把较短那一边向内移（移动较高一边宽度变小，高度受限于 min，面积不可能更大）。记录最大。O(n) 时间，O(1) 空间。

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
class Solution {
    public int maxArea(int[] height) {
        int l = 0, r = height.length - 1, best = 0;
        while (l < r) {
            int h = Math.min(height[l], height[r]);
            best = Math.max(best, (r - l) * h);
            if (height[l] < height[r]) l++; else r--;
        }
        return best;
    }
}
```

**要点：**
- 宽度每步必然减小，只有高度增加才能扩大面积。
- 移动较高的一边永远不会让面积增大；只能动较短的一边。
- 高度相等时两边都可以动，结果一样。

**标签：** #algorithm

---

### 27. 四数之和

**难度：** 中等
**主题：** arrays, two-pointer, sorting
**岗位：** ICT4
**级别：** ICT3-ICT4

**问题：** 给定数组 `nums` 和整数 `target`，返回所有不重复的、和为 `target` 的四元组。

**思路：** 排序。两层循环固定 `i, j`；双指针 `l, r` 找剩下两个数。四个位置都跳过重复。最小四数已超 target 时提前终止。O(n^3) 时间，O(1) 额外空间。

**Python：**
```python
def four_sum(nums: list[int], target: int) -> list[list[int]]:
    nums.sort()
    n = len(nums)
    out: list[list[int]] = []
    for i in range(n - 3):
        if i and nums[i] == nums[i - 1]: continue
        for j in range(i + 1, n - 2):
            if j > i + 1 and nums[j] == nums[j - 1]: continue
            l, r, t = j + 1, n - 1, target - nums[i] - nums[j]
            while l < r:
                s = nums[l] + nums[r]
                if s < t: l += 1
                elif s > t: r -= 1
                else:
                    out.append([nums[i], nums[j], nums[l], nums[r]])
                    l += 1; r -= 1
                    while l < r and nums[l] == nums[l - 1]: l += 1
                    while l < r and nums[r] == nums[r + 1]: r -= 1
    return out
```

**TypeScript：**
```typescript
function fourSum(nums: number[], target: number): number[][] {
  nums.sort((a, b) => a - b);
  const n = nums.length, out: number[][] = [];
  for (let i = 0; i < n - 3; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue;
    for (let j = i + 1; j < n - 2; j++) {
      if (j > i + 1 && nums[j] === nums[j - 1]) continue;
      let l = j + 1, r = n - 1, t = target - nums[i] - nums[j];
      while (l < r) {
        const s = nums[l] + nums[r];
        if (s < t) l++;
        else if (s > t) r--;
        else {
          out.push([nums[i], nums[j], nums[l], nums[r]]);
          l++; r--;
          while (l < r && nums[l] === nums[l - 1]) l++;
          while (l < r && nums[r] === nums[r + 1]) r--;
        }
      }
    }
  }
  return out;
}
```

**Java：**
```java
import java.util.*;
class Solution {
    public List<List<Integer>> fourSum(int[] nums, int target) {
        Arrays.sort(nums);
        List<List<Integer>> out = new ArrayList<>();
        int n = nums.length;
        for (int i = 0; i < n - 3; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            for (int j = i + 1; j < n - 2; j++) {
                if (j > i + 1 && nums[j] == nums[j - 1]) continue;
                int l = j + 1, r = n - 1;
                long t = (long) target - nums[i] - nums[j];
                while (l < r) {
                    long s = (long) nums[l] + nums[r];
                    if (s < t) l++;
                    else if (s > t) r--;
                    else {
                        out.add(List.of(nums[i], nums[j], nums[l], nums[r]));
                        l++; r--;
                        while (l < r && nums[l] == nums[l - 1]) l++;
                        while (l < r && nums[r] == nums[r + 1]) r--;
                    }
                }
            }
        }
        return out;
    }
}
```

**要点：**
- 四个位置都要跳过重复，保证结果唯一。
- 双指针把内层一对和的搜索从 O(n^2) 降到 O(n)。
- 当 `nums[i] * 4 > target` 或最小四数和超过 target 时可提前 break。

**标签：** #algorithm

---

### 28. 删除有序数组中的重复项

**难度：** 简单
**主题：** arrays, two-pointer
**岗位：** ICT3
**级别：** ICT3

**问题：** 给定有序数组，原地去重使每个元素只出现一次，返回新长度。

**思路：** 双指针 `write, read`。遍历 `read`；若 `nums[read] != nums[write-1]`，复制到 `nums[write]` 并 write++。返回 `write`。O(n) 时间，O(1) 空间。

**Python：**
```python
def remove_duplicates(nums: list[int]) -> int:
    if not nums:
        return 0
    write = 1
    for read in range(1, len(nums)):
        if nums[read] != nums[write - 1]:
            nums[write] = nums[read]
            write += 1
    return write
```

**TypeScript：**
```typescript
function removeDuplicates(nums: number[]): number {
  if (nums.length === 0) return 0;
  let write = 1;
  for (let read = 1; read < nums.length; read++) {
    if (nums[read] !== nums[write - 1]) {
      nums[write] = nums[read];
      write++;
    }
  }
  return write;
}
```

**Java：**
```java
class Solution {
    public int removeDuplicates(int[] nums) {
        if (nums.length == 0) return 0;
        int write = 1;
        for (int read = 1; read < nums.length; read++) {
            if (nums[read] != nums[write - 1]) nums[write++] = nums[read];
        }
        return write;
    }
}
```

**要点：**
- 有序输入保证重复元素相邻。
- write 指针落后于 read，仅在需要时覆盖写入。
- 返回的是去重后的有效长度；下标 `write` 之后是残留值。

**标签：** #algorithm

---

### 29. 删除链表的倒数第 N 个节点

**难度：** 中等
**主题：** linked-list, two-pointer
**岗位：** ICT3
**级别：** ICT3

**问题：** 一次遍历删除单链表的倒数第 n 个节点。

**思路：** 哑头。让 `fast` 先走 n+1 步。`fast` 与 `slow` 一起走，直到 `fast` 为 null。`slow.next` 即为待删节点；`slow.next = slow.next.next`。O(L) 时间，O(1) 空间。

**Python：**
```python
def remove_nth_from_end(head: ListNode | None, n: int) -> ListNode | None:
    dummy = ListNode(0, head)
    fast: ListNode | None = dummy
    slow: ListNode | None = dummy
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
class Solution {
    public ListNode removeNthFromEnd(ListNode head, int n) {
        ListNode dummy = new ListNode(0, head);
        ListNode fast = dummy, slow = dummy;
        for (int i = 0; i < n + 1; i++) fast = fast.next;
        while (fast != null) { fast = fast.next; slow = slow.next; }
        slow.next = slow.next.next;
        return dummy.next;
    }
}
```

**要点：**
- 哑头简化了删除原头节点的情形。
- 间距 `n + 1` 让 `slow` 落在待删节点的前一个。
- 单次遍历完成，不需要先求长度。

**标签：** #algorithm

---

### 30. 两数相加（链表）

**难度：** 中等
**主题：** linked-list, math
**岗位：** ICT3
**级别：** ICT3-ICT4

**问题：** 两个数以逆序链表存储（每个节点一位数字）。返回它们的和，仍为链表。

**思路：** 同时遍历两个链表并维护进位。每步 `sum = a + b + carry`；新节点值为 `sum % 10`；`carry = sum / 10`。两链表遍历完且 carry 为 0 才停。用哑头。O(max(n, m)) 时间。

**Python：**
```python
def add_two_numbers(l1: ListNode | None, l2: ListNode | None) -> ListNode | None:
    dummy = ListNode()
    tail = dummy
    carry = 0
    while l1 or l2 or carry:
        s = carry + (l1.val if l1 else 0) + (l2.val if l2 else 0)
        carry, digit = divmod(s, 10)
        tail.next = ListNode(digit)
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
class Solution {
    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
        ListNode dummy = new ListNode(), tail = dummy;
        int carry = 0;
        while (l1 != null || l2 != null || carry > 0) {
            int s = carry + (l1 != null ? l1.val : 0) + (l2 != null ? l2.val : 0);
            carry = s / 10;
            tail.next = new ListNode(s % 10, null);
            tail = tail.next;
            if (l1 != null) l1 = l1.next;
            if (l2 != null) l2 = l2.next;
        }
        return dummy.next;
    }
}
```

**要点：**
- 循环条件要带上 `carry`，处理末位进位（如 5 + 5 = 10）。
- 缺失节点视为 0，长度不等自然处理。
- 输出仍然是低位在前的链表。

**标签：** #algorithm

---

### 31. 复制带随机指针的链表

**难度：** 中等
**主题：** linked-list, hashmap
**岗位：** ICT4
**级别：** ICT4

**问题：** 深拷贝一个链表，每个节点除 `next` 外还有 `random` 指针指向任意节点。

**思路：** 用哈希表 `old -> new` 两遍法：第一遍创建克隆，第二遍接 `next` 和 `random`。O(n) 时间，O(n) 空间。O(1) 额外空间法：原地交错克隆（A->A'->B->B'->...），设置 random，再拆分。

**Python：**
```python
class RandomNode:
    def __init__(self, val: int, next: "RandomNode | None" = None, random: "RandomNode | None" = None) -> None:
        self.val = val; self.next = next; self.random = random

def copy_random_list(head: RandomNode | None) -> RandomNode | None:
    if not head:
        return None
    m: dict[RandomNode, RandomNode] = {}
    cur = head
    while cur:
        m[cur] = RandomNode(cur.val)
        cur = cur.next
    cur = head
    while cur:
        m[cur].next = m.get(cur.next) if cur.next else None
        m[cur].random = m.get(cur.random) if cur.random else None
        cur = cur.next
    return m[head]
```

**TypeScript：**
```typescript
class RandomNode {
  val: number;
  next: RandomNode | null;
  random: RandomNode | null;
  constructor(v: number, n: RandomNode | null = null, r: RandomNode | null = null) { this.val = v; this.next = n; this.random = r; }
}

function copyRandomList(head: RandomNode | null): RandomNode | null {
  if (!head) return null;
  const m = new Map<RandomNode, RandomNode>();
  let cur: RandomNode | null = head;
  while (cur) { m.set(cur, new RandomNode(cur.val)); cur = cur.next; }
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
import java.util.*;
class Node {
    int val; Node next, random;
    Node(int val) { this.val = val; }
}
class Solution {
    public Node copyRandomList(Node head) {
        if (head == null) return null;
        Map<Node, Node> m = new HashMap<>();
        for (Node cur = head; cur != null; cur = cur.next) m.put(cur, new Node(cur.val));
        for (Node cur = head; cur != null; cur = cur.next) {
            m.get(cur).next = m.get(cur.next);
            m.get(cur).random = m.get(cur.random);
        }
        return m.get(head);
    }
}
```

**要点：**
- 第一遍创建克隆节点，第二遍通过哈希表接好指针。
- 自然处理 `next` 与 `random` 为 null 的情形。
- O(1) 额外空间的变体把克隆交错插入原链表，最后再拆分。

**标签：** #algorithm

---

### 32. 环形链表

**难度：** 简单
**主题：** linked-list, two-pointer
**岗位：** ICT3
**级别：** ICT3

**问题：** 判断链表是否有环。进阶：返回环的起点。

**思路：** Floyd 龟兔。`slow` 走 1 步，`fast` 走 2 步。相遇即有环。找入口：把一个指针重置到 head，两个都以速度 1 推进，相遇即入口。O(n) 时间，O(1) 空间。

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
class Solution {
    public ListNode detectCycle(ListNode head) {
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
}
```

**要点：**
- 快指针双倍速追赶慢指针，环内必相遇。
- 头到入口的距离与相遇点到入口的距离（模环长）相等。
- 用哈希集要 O(n) 额外空间；Floyd 是 O(1)。

**标签：** #algorithm

---

### 33. 相交链表

**难度：** 简单
**主题：** linked-list, two-pointer
**岗位：** ICT3
**级别：** ICT3

**问题：** 给定两个可能相交的单链表，返回相交节点，或 null。

**思路：** 双指针 `a, b` 从两个头开始。`a` 到末尾后跳到 `headB`；`b` 同理。两者各走 `lenA + lenB`，在交点（或 null）相遇。O(n+m) 时间，O(1) 空间。

**Python：**
```python
def get_intersection_node(headA: ListNode | None, headB: ListNode | None) -> ListNode | None:
    if not headA or not headB:
        return None
    a, b = headA, headB
    while a is not b:
        a = a.next if a else headB
        b = b.next if b else headA
    return a
```

**TypeScript：**
```typescript
function getIntersectionNode(headA: ListNode | null, headB: ListNode | null): ListNode | null {
  if (!headA || !headB) return null;
  let a: ListNode | null = headA, b: ListNode | null = headB;
  while (a !== b) {
    a = a ? a.next : headB;
    b = b ? b.next : headA;
  }
  return a;
}
```

**Java：**
```java
class Solution {
    public ListNode getIntersectionNode(ListNode headA, ListNode headB) {
        if (headA == null || headB == null) return null;
        ListNode a = headA, b = headB;
        while (a != b) {
            a = (a == null) ? headB : a.next;
            b = (b == null) ? headA : b.next;
        }
        return a;
    }
}
```

**要点：**
- 走到空时换头，使两个指针总步数都等于 `lenA + lenB`。
- 它们要么在交点相遇，要么同时变为 `null`。
- 比较节点身份而不是值——允许重复值。

**标签：** #algorithm

---

### 34. 重排链表

**难度：** 中等
**主题：** linked-list, two-pointer
**岗位：** ICT4
**级别：** ICT3-ICT4

**问题：** 给定链表 L0 -> L1 -> ... -> Ln-1 -> Ln，原地重排为 L0 -> Ln -> L1 -> Ln-1 -> ...

**思路：** 三步：(1) 快慢指针找中点，(2) 反转后半段，(3) 两半交替合并。O(n) 时间，O(1) 空间。注意合并后的 null 结尾。

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
        nxt = cur.next; cur.next = prev; prev = cur; cur = nxt
    a, b = head, prev
    while b:
        an, bn = a.next, b.next  # type: ignore
        a.next = b; b.next = an  # type: ignore
        a, b = an, bn
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
class Solution {
    public void reorderList(ListNode head) {
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
}
```

**要点：**
- 反转右半段前先在中点断开。
- 右半段长度小于等于左半段，合并自然终止。
- 全程原地，仅用少量指针，无额外分配。

**标签：** #algorithm

---

### 35. 二叉树层序遍历

**难度：** 中等
**主题：** tree, bfs, queue
**岗位：** ICT3
**级别：** ICT3

**问题：** 返回二叉树的层序遍历，按层组织成列表的列表。

**思路：** 用队列做 BFS。每层记录当前队列大小 `k`，弹出 `k` 个节点放进当层列表，并入队它们的子节点。O(n) 时间，O(w) 空间，w 为最大宽度。

**Python：**
```python
from collections import deque

class TreeNode:
    def __init__(self, val: int = 0, left: "TreeNode | None" = None, right: "TreeNode | None" = None) -> None:
        self.val = val; self.left = left; self.right = right

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
import java.util.*;
class Solution {
    public List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> out = new ArrayList<>();
        if (root == null) return out;
        Deque<TreeNode> q = new ArrayDeque<>();
        q.offer(root);
        while (!q.isEmpty()) {
            int sz = q.size();
            List<Integer> level = new ArrayList<>(sz);
            for (int i = 0; i < sz; i++) {
                TreeNode n = q.poll();
                level.add(n.val);
                if (n.left != null) q.offer(n.left);
                if (n.right != null) q.offer(n.right);
            }
            out.add(level);
        }
        return out;
    }
}
```

**要点：**
- 在每层开始时记录队列大小，作为该层结束的边界。
- 空树返回空列表。
- 这种模式稍作修改即可用于 N 叉树。

**标签：** #algorithm

---

### 36. 二叉树的锯齿形层序遍历

**难度：** 中等
**主题：** tree, bfs, deque
**岗位：** ICT4
**级别：** ICT3-ICT4

**问题：** 同层序遍历，但每一层方向交替（左->右、右->左）。

**思路：** 标准 BFS，每层翻转标志位——要么在追加前反转当层列表，要么用双端队列从前/后端追加。O(n) 时间，O(w) 空间。

**Python：**
```python
from collections import deque

def zigzag_level_order(root: TreeNode | None) -> list[list[int]]:
    if not root:
        return []
    out: list[list[int]] = []
    q: deque[TreeNode] = deque([root])
    ltr = True
    while q:
        level = deque()
        for _ in range(len(q)):
            node = q.popleft()
            if ltr: level.append(node.val)
            else: level.appendleft(node.val)
            if node.left: q.append(node.left)
            if node.right: q.append(node.right)
        out.append(list(level))
        ltr = not ltr
    return out
```

**TypeScript：**
```typescript
function zigzagLevelOrder(root: TreeNode | null): number[][] {
  if (!root) return [];
  const out: number[][] = [];
  let q: TreeNode[] = [root];
  let ltr = true;
  while (q.length) {
    const level: number[] = [];
    const next: TreeNode[] = [];
    for (const n of q) {
      if (ltr) level.push(n.val); else level.unshift(n.val);
      if (n.left) next.push(n.left);
      if (n.right) next.push(n.right);
    }
    out.push(level);
    q = next;
    ltr = !ltr;
  }
  return out;
}
```

**Java：**
```java
import java.util.*;
class Solution {
    public List<List<Integer>> zigzagLevelOrder(TreeNode root) {
        List<List<Integer>> out = new ArrayList<>();
        if (root == null) return out;
        Deque<TreeNode> q = new ArrayDeque<>();
        q.offer(root);
        boolean ltr = true;
        while (!q.isEmpty()) {
            int sz = q.size();
            LinkedList<Integer> level = new LinkedList<>();
            for (int i = 0; i < sz; i++) {
                TreeNode n = q.poll();
                if (ltr) level.addLast(n.val); else level.addFirst(n.val);
                if (n.left != null) q.offer(n.left);
                if (n.right != null) q.offer(n.right);
            }
            out.add(level);
            ltr = !ltr;
        }
        return out;
    }
}
```

**要点：**
- 用方向标志比"事后反转列表"更干净。
- 反向层用双端队列（或 `unshift`）实现 O(1) 前插。
- 子节点始终按左右入队；方向只影响输出顺序。

**标签：** #algorithm

---

### 37. 二叉树的右视图

**难度：** 中等
**主题：** tree, bfs, dfs
**岗位：** ICT4
**级别：** ICT3-ICT4

**问题：** 返回从右侧看二叉树能看到的节点值，自顶向下。

**思路：** BFS 时记录每层最后一个节点。或者按 (root, right, left) DFS，当 depth == result.length 时追加。O(n) 时间，O(h) 空间。

**Python：**
```python
def right_side_view(root: TreeNode | None) -> list[int]:
    out: list[int] = []
    def dfs(node: TreeNode | None, depth: int) -> None:
        if node is None:
            return
        if depth == len(out):
            out.append(node.val)
        dfs(node.right, depth + 1)
        dfs(node.left, depth + 1)
    dfs(root, 0)
    return out
```

**TypeScript：**
```typescript
function rightSideView(root: TreeNode | null): number[] {
  const out: number[] = [];
  const dfs = (n: TreeNode | null, depth: number): void => {
    if (!n) return;
    if (depth === out.length) out.push(n.val);
    dfs(n.right, depth + 1);
    dfs(n.left, depth + 1);
  };
  dfs(root, 0);
  return out;
}
```

**Java：**
```java
import java.util.*;
class Solution {
    private final List<Integer> out = new ArrayList<>();
    public List<Integer> rightSideView(TreeNode root) { dfs(root, 0); return out; }
    private void dfs(TreeNode n, int depth) {
        if (n == null) return;
        if (depth == out.size()) out.add(n.val);
        dfs(n.right, depth + 1);
        dfs(n.left, depth + 1);
    }
}
```

**要点：**
- 先访问右子树，确保每层第一次到达的就是最右节点。
- 仅在 depth 等于当前结果长度时追加，避免同层重复。
- BFS 写法等价，选自己顺手的就行。

**标签：** #algorithm

---

### 38. 填充每个节点的下一个右侧节点指针

**难度：** 中等
**主题：** tree, bfs, linked-list
**岗位：** ICT4
**级别：** ICT4

**问题：** 给定一棵完美二叉树，把每个节点的 `next` 指向同层右兄弟（或 null）。

**思路：** 利用已建立的 `next` 指针逐层遍历：在第 L 层用它们行走；设 `node.left.next = node.right`，`node.right.next = node.next ? node.next.left : null`。O(n) 时间，O(1) 额外空间。

**Python：**
```python
class PerfectNode:
    def __init__(self, val: int = 0, left: "PerfectNode | None" = None,
                 right: "PerfectNode | None" = None, next: "PerfectNode | None" = None) -> None:
        self.val = val; self.left = left; self.right = right; self.next = next

def connect(root: PerfectNode | None) -> PerfectNode | None:
    leftmost = root
    while leftmost and leftmost.left:
        node: PerfectNode | None = leftmost
        while node:
            node.left.next = node.right  # type: ignore
            node.right.next = node.next.left if node.next else None  # type: ignore
            node = node.next
        leftmost = leftmost.left
    return root
```

**TypeScript：**
```typescript
class PerfectNode {
  val: number;
  left: PerfectNode | null;
  right: PerfectNode | null;
  next: PerfectNode | null;
  constructor(v = 0, l: PerfectNode | null = null, r: PerfectNode | null = null, n: PerfectNode | null = null) {
    this.val = v; this.left = l; this.right = r; this.next = n;
  }
}

function connect(root: PerfectNode | null): PerfectNode | null {
  let leftmost = root;
  while (leftmost && leftmost.left) {
    let node: PerfectNode | null = leftmost;
    while (node) {
      node.left!.next = node.right;
      node.right!.next = node.next ? node.next.left : null;
      node = node.next;
    }
    leftmost = leftmost.left;
  }
  return root;
}
```

**Java：**
```java
class Node {
    int val; Node left, right, next;
    Node(int val) { this.val = val; }
}
class Solution {
    public Node connect(Node root) {
        Node leftmost = root;
        while (leftmost != null && leftmost.left != null) {
            for (Node node = leftmost; node != null; node = node.next) {
                node.left.next = node.right;
                node.right.next = (node.next != null) ? node.next.left : null;
            }
            leftmost = leftmost.left;
        }
        return root;
    }
}
```

**要点：**
- 复用已建好的 `next` 作为遍历手段，无需额外队列。
- 两条接线规则覆盖左右子节点。
- O(1) 额外空间，只对完美二叉树有效。

**标签：** #algorithm

---

### 39. 恢复二叉搜索树

**难度：** 困难
**主题：** tree, bst, inorder
**岗位：** ICT5
**级别：** ICT4-ICT5

**问题：** 一棵 BST 中两个节点被错误交换。在不改变结构的前提下恢复。

**思路：** 中序遍历得到本应有序的序列；找出两处下降位置：第一处下降的左值、最后一处下降的右值。交换两者。Morris 遍历 O(1) 额外空间，否则 O(h) 栈。O(n) 时间。

**Python：**
```python
def recover_tree(root: TreeNode | None) -> None:
    first: TreeNode | None = None
    second: TreeNode | None = None
    prev: TreeNode | None = None
    def inorder(node: TreeNode | None) -> None:
        nonlocal first, second, prev
        if node is None:
            return
        inorder(node.left)
        if prev and prev.val > node.val:
            if first is None:
                first = prev
            second = node
        prev = node
        inorder(node.right)
    inorder(root)
    if first and second:
        first.val, second.val = second.val, first.val
```

**TypeScript：**
```typescript
function recoverTree(root: TreeNode | null): void {
  let first: TreeNode | null = null, second: TreeNode | null = null, prev: TreeNode | null = null;
  const inorder = (n: TreeNode | null): void => {
    if (!n) return;
    inorder(n.left);
    if (prev && prev.val > n.val) {
      if (!first) first = prev;
      second = n;
    }
    prev = n;
    inorder(n.right);
  };
  inorder(root);
  if (first && second) {
    const t = (first as TreeNode).val;
    (first as TreeNode).val = (second as TreeNode).val;
    (second as TreeNode).val = t;
  }
}
```

**Java：**
```java
class Solution {
    private TreeNode first, second, prev;
    public void recoverTree(TreeNode root) {
        inorder(root);
        int t = first.val; first.val = second.val; second.val = t;
    }
    private void inorder(TreeNode n) {
        if (n == null) return;
        inorder(n.left);
        if (prev != null && prev.val > n.val) {
            if (first == null) first = prev;
            second = n;
        }
        prev = n;
        inorder(n.right);
    }
}
```

**要点：**
- 两个被错换的节点在中序序列里形成 1 处或 2 处下降。
- `first` 在首次下降时锁定；`second` 持续更新以捕获后一次下降。
- Morris 遍历可去掉递归栈，达到真正的 O(1) 额外空间。

**标签：** #algorithm

---

### 40. BST 中第 K 小的元素

**难度：** 中等
**主题：** tree, bst, inorder
**岗位：** ICT4
**级别：** ICT3-ICT4

**问题：** 返回 BST 中第 k 小的元素。

**思路：** 用栈做迭代中序：把左脊压栈，弹出后 k--；若 k == 0 返回 node.val；进右子树。O(h + k) 时间，O(h) 空间。追问：频繁插入/删除时给节点加子树大小字段，查询 O(h)。

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
import java.util.*;
class Solution {
    public int kthSmallest(TreeNode root, int k) {
        Deque<TreeNode> stack = new ArrayDeque<>();
        TreeNode cur = root;
        while (cur != null || !stack.isEmpty()) {
            while (cur != null) { stack.push(cur); cur = cur.left; }
            cur = stack.pop();
            if (--k == 0) return cur.val;
            cur = cur.right;
        }
        return -1;
    }
}
```

**要点：**
- BST 的中序遍历就是有序输出。
- 迭代写法避免在偏斜树上的递归栈溢出。
- 动态树场景下给节点加子树大小字段，可实现真正的 O(h) 查询。

**标签：** #algorithm

---

### 41. BST 中的中序后继

**难度：** 中等
**主题：** tree, bst
**岗位：** ICT4
**级别：** ICT3-ICT4

**问题：** 给定 BST 节点 `p`，返回它的中序后继（比 p 大的最小节点）。

**思路：** 若 `p.right` 存在，后继是 `p.right` 的最左节点。否则从根向下走：记下最后一次向左走时的节点。O(h) 时间，O(1) 空间。

**Python：**
```python
def inorder_successor(root: TreeNode | None, p: TreeNode) -> TreeNode | None:
    if p.right:
        cur = p.right
        while cur.left:
            cur = cur.left
        return cur
    succ: TreeNode | None = None
    cur = root
    while cur:
        if p.val < cur.val:
            succ = cur
            cur = cur.left
        else:
            cur = cur.right
    return succ
```

**TypeScript：**
```typescript
function inorderSuccessor(root: TreeNode | null, p: TreeNode): TreeNode | null {
  if (p.right) {
    let cur = p.right;
    while (cur.left) cur = cur.left;
    return cur;
  }
  let succ: TreeNode | null = null, cur = root;
  while (cur) {
    if (p.val < cur.val) { succ = cur; cur = cur.left; }
    else cur = cur.right;
  }
  return succ;
}
```

**Java：**
```java
class Solution {
    public TreeNode inorderSuccessor(TreeNode root, TreeNode p) {
        if (p.right != null) {
            TreeNode cur = p.right;
            while (cur.left != null) cur = cur.left;
            return cur;
        }
        TreeNode succ = null, cur = root;
        while (cur != null) {
            if (p.val < cur.val) { succ = cur; cur = cur.left; }
            else cur = cur.right;
        }
        return succ;
    }
}
```

**要点：**
- 两种情形（有右子树 vs 无右子树）覆盖了所有 BST 形态。
- "最后一次向左走"对应的节点就是比 `p` 大的最小祖先。
- 没有父指针时 O(h)；有父指针可做到 O(1)。

**标签：** #algorithm

---

### 42. 相同的树

**难度：** 简单
**主题：** tree, dfs, recursion
**岗位：** ICT3
**级别：** ICT3

**问题：** 判断两棵二叉树结构相同且对应值相等。

**思路：** 递归：均为 null -> true；一个为 null -> false；值不同 -> false；否则递归比较左右子树。O(min(n, m)) 时间，O(h) 栈。

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
class Solution {
    public boolean isSameTree(TreeNode p, TreeNode q) {
        if (p == null && q == null) return true;
        if (p == null || q == null || p.val != q.val) return false;
        return isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
    }
}
```

**要点：**
- 两边都为 null 是成功基底；其中一个为 null 即结构不同。
- 值不同先短路，避免无谓递归。
- 迭代式 BFS 同步遍历是等价做法，且无栈增长。

**标签：** #algorithm

---

### 43. 求根到叶子节点数字之和

**难度：** 中等
**主题：** tree, dfs, recursion
**岗位：** ICT3
**级别：** ICT3-ICT4

**问题：** 每条根到叶的路径代表一个数字（路径上的数位）。返回所有根到叶数字之和。

**思路：** DFS 携带当前累计数 `cur = cur*10 + node.val`。到叶节点时将 `cur` 加入总和。O(n) 时间，O(h) 空间。

**Python：**
```python
def sum_numbers(root: TreeNode | None) -> int:
    def dfs(node: TreeNode | None, cur: int) -> int:
        if node is None:
            return 0
        cur = cur * 10 + node.val
        if not node.left and not node.right:
            return cur
        return dfs(node.left, cur) + dfs(node.right, cur)
    return dfs(root, 0)
```

**TypeScript：**
```typescript
function sumNumbers(root: TreeNode | null): number {
  const dfs = (n: TreeNode | null, cur: number): number => {
    if (!n) return 0;
    cur = cur * 10 + n.val;
    if (!n.left && !n.right) return cur;
    return dfs(n.left, cur) + dfs(n.right, cur);
  };
  return dfs(root, 0);
}
```

**Java：**
```java
class Solution {
    public int sumNumbers(TreeNode root) { return dfs(root, 0); }
    private int dfs(TreeNode n, int cur) {
        if (n == null) return 0;
        cur = cur * 10 + n.val;
        if (n.left == null && n.right == null) return cur;
        return dfs(n.left, cur) + dfs(n.right, cur);
    }
}
```

**要点：**
- 累计数沿递归栈下传，避免共享可变状态。
- 仅在叶节点累加到总和，防止重复计入半路径。
- 空树天然返回 0。

**标签：** #algorithm

---

### 44. 路径总和

**难度：** 简单
**主题：** tree, dfs, recursion
**岗位：** ICT3
**级别：** ICT3

**问题：** 给定二叉树和 `targetSum`，判断是否存在根到叶路径和为 `targetSum`。

**思路：** DFS 从剩余值中减去 `node.val`；到叶节点时检查剩余是否为 0。注意 null 与叶节点的区别：null 不是叶。O(n) 时间，O(h) 空间。

**Python：**
```python
def has_path_sum(root: TreeNode | None, target_sum: int) -> bool:
    if root is None:
        return False
    if not root.left and not root.right:
        return target_sum == root.val
    remaining = target_sum - root.val
    return has_path_sum(root.left, remaining) or has_path_sum(root.right, remaining)
```

**TypeScript：**
```typescript
function hasPathSum(root: TreeNode | null, targetSum: number): boolean {
  if (!root) return false;
  if (!root.left && !root.right) return targetSum === root.val;
  const remaining = targetSum - root.val;
  return hasPathSum(root.left, remaining) || hasPathSum(root.right, remaining);
}
```

**Java：**
```java
class Solution {
    public boolean hasPathSum(TreeNode root, int targetSum) {
        if (root == null) return false;
        if (root.left == null && root.right == null) return targetSum == root.val;
        int remaining = targetSum - root.val;
        return hasPathSum(root.left, remaining) || hasPathSum(root.right, remaining);
    }
}
```

**要点：**
- 路径必须终止于叶节点，单独的 null 子节点不算合法路径。
- 一路下走时做减法，叶节点处做比较。
- 短路 `or` 能尽早砍掉无意义的子树搜索。

**标签：** #algorithm

---

### 45. 将有序数组转换为二叉搜索树

**难度：** 简单
**主题：** tree, bst, recursion, divide-and-conquer
**岗位：** ICT3
**级别：** ICT3

**问题：** 给定升序数组，构建高度平衡的 BST。

**思路：** 递归：取 `mid = (l+r)/2` 为根，递归左半与右半。O(n) 时间，O(log n) 栈。取左中或右中得到不同合法树。

**Python：**
```python
def sorted_array_to_bst(nums: list[int]) -> TreeNode | None:
    def build(l: int, r: int) -> TreeNode | None:
        if l > r:
            return None
        mid = (l + r) // 2
        node = TreeNode(nums[mid])
        node.left = build(l, mid - 1)
        node.right = build(mid + 1, r)
        return node
    return build(0, len(nums) - 1)
```

**TypeScript：**
```typescript
function sortedArrayToBST(nums: number[]): TreeNode | null {
  const build = (l: number, r: number): TreeNode | null => {
    if (l > r) return null;
    const mid = (l + r) >> 1;
    const node = new TreeNode(nums[mid]);
    node.left = build(l, mid - 1);
    node.right = build(mid + 1, r);
    return node;
  };
  return build(0, nums.length - 1);
}
```

**Java：**
```java
class Solution {
    public TreeNode sortedArrayToBST(int[] nums) { return build(nums, 0, nums.length - 1); }
    private TreeNode build(int[] nums, int l, int r) {
        if (l > r) return null;
        int mid = (l + r) >>> 1;
        TreeNode node = new TreeNode(nums[mid]);
        node.left = build(nums, l, mid - 1);
        node.right = build(nums, mid + 1, r);
        return node;
    }
}
```

**要点：**
- 取中点为根可使左右子树规模差不超过 1。
- 有序输入天然保证 BST 性质。
- 左中或右中都能产生合法的高度平衡树。

**标签：** #algorithm

---

### 46. 位 1 的个数

**难度：** 简单
**主题：** bit-manipulation
**岗位：** ICT3
**级别：** ICT3

**问题：** 返回 32 位无符号整数中 1 的个数。

**思路：** Brian Kernighan：`while (n) { n &= n-1; count++; }`——每次去掉最低位的 1。O(popcount) 时间，O(1) 空间。生产代码用内置 `popcount`。

**Python：**
```python
def hamming_weight(n: int) -> int:
    count = 0
    while n:
        n &= n - 1
        count += 1
    return count
```

**TypeScript：**
```typescript
function hammingWeight(n: number): number {
  let count = 0;
  while (n !== 0) {
    n &= n - 1;
    count++;
  }
  return count;
}
```

**Java：**
```java
class Solution {
    public int hammingWeight(int n) {
        int count = 0;
        while (n != 0) { n &= n - 1; count++; }
        return count;
    }
}
```

**要点：**
- `n & (n - 1)` 一次操作清掉最低位的 1。
- 循环次数等于 1 的个数，不是位宽。
- Python 有 `int.bit_count()`；多数编译型语言提供 `popcount` 指令。

**标签：** #algorithm

---

### 47. 比特位计数

**难度：** 简单
**主题：** bit-manipulation, dp
**岗位：** ICT3
**级别：** ICT3-ICT4

**问题：** 给定 n，返回长度为 n+1 的数组 `ans[i]`，其中 `ans[i]` 为 `i` 的二进制 1 的个数。

**思路：** DP：`ans[i] = ans[i >> 1] + (i & 1)`，或 `ans[i] = ans[i & (i-1)] + 1`。O(n) 时间，O(n) 空间（输出）。

**Python：**
```python
def count_bits(n: int) -> list[int]:
    ans = [0] * (n + 1)
    for i in range(1, n + 1):
        ans[i] = ans[i >> 1] + (i & 1)
    return ans
```

**TypeScript：**
```typescript
function countBits(n: number): number[] {
  const ans = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    ans[i] = ans[i >> 1] + (i & 1);
  }
  return ans;
}
```

**Java：**
```java
class Solution {
    public int[] countBits(int n) {
        int[] ans = new int[n + 1];
        for (int i = 1; i <= n; i++) ans[i] = ans[i >> 1] + (i & 1);
        return ans;
    }
}
```

**要点：**
- `i >> 1` 去掉最低位，所以 `bits(i) = bits(i/2) + low_bit(i)`。
- 从 `ans[0] = 0` 向上构建，每项 O(1)。
- 也可用 Kernighan 技巧：`ans[i] = ans[i & (i-1)] + 1`。

**标签：** #algorithm

---

### 48. 只出现一次的数字

**难度：** 简单
**主题：** bit-manipulation, xor
**岗位：** ICT3
**级别：** ICT3

**问题：** 每个元素出现两次，仅有一个出现一次。O(n) 时间、O(1) 空间找到它。

**思路：** 全部 XOR。成对的相消（a ^ a = 0），剩下的就是答案。O(n) 时间，O(1) 空间。追问"每个元素出现三次，仅一个出现一次"→ 按位计数 mod 3，或两变量 XOR 状态机。

**Python：**
```python
def single_number(nums: list[int]) -> int:
    result = 0
    for n in nums:
        result ^= n
    return result
```

**TypeScript：**
```typescript
function singleNumber(nums: number[]): number {
  let result = 0;
  for (const n of nums) result ^= n;
  return result;
}
```

**Java：**
```java
class Solution {
    public int singleNumber(int[] nums) {
        int result = 0;
        for (int n : nums) result ^= n;
        return result;
    }
}
```

**要点：**
- XOR 满足交换律与结合律，顺序无关。
- `a ^ a = 0`、`a ^ 0 = a` 使成对元素自然相消。
- O(1) 空间，无需哈希集或排序。

**标签：** #algorithm

---

### 49. 丢失的数字

**难度：** 简单
**主题：** bit-manipulation, math
**岗位：** ICT3
**级别：** ICT3

**问题：** 数组含 n 个 [0..n] 内互不相同的数，找出缺失的那一个。

**思路：** 把 [0..n] 全部下标与所有元素 XOR；成对相消，剩下缺失值。或用求和公式 `n*(n+1)/2 - sum(nums)`。XOR 无溢出风险。O(n) 时间，O(1) 空间。

**Python：**
```python
def missing_number(nums: list[int]) -> int:
    result = len(nums)
    for i, v in enumerate(nums):
        result ^= i ^ v
    return result
```

**TypeScript：**
```typescript
function missingNumber(nums: number[]): number {
  let result = nums.length;
  for (let i = 0; i < nums.length; i++) {
    result ^= i ^ nums[i];
  }
  return result;
}
```

**Java：**
```java
class Solution {
    public int missingNumber(int[] nums) {
        int result = nums.length;
        for (int i = 0; i < nums.length; i++) result ^= i ^ nums[i];
        return result;
    }
}
```

**要点：**
- 初值取 `n`，把缺失的最高下标也纳入异或，免去额外循环。
- 相比求和公式，XOR 不会有大 `n` 的溢出风险。
- 出现过的数字与其下标相消，剩下的就是缺失值。

**标签：** #algorithm

---

### 50. 找到所有数组中消失的数字

**难度：** 简单
**主题：** arrays, in-place
**岗位：** ICT3
**级别：** ICT3

**问题：** 给定长度为 n、值域 [1..n] 的数组，返回 [1..n] 中未出现的所有数字。O(n) 时间、O(1) 额外空间。

**思路：** 把数组本身当作哈希。对每个 `v = abs(nums[i])`，将 `nums[v-1]` 置为负。最后仍为正值的下标 i+1 即为缺失数字。O(n) 时间，O(1) 额外空间。

**Python：**
```python
def find_disappeared_numbers(nums: list[int]) -> list[int]:
    for v in nums:
        idx = abs(v) - 1
        if nums[idx] > 0:
            nums[idx] = -nums[idx]
    return [i + 1 for i, v in enumerate(nums) if v > 0]
```

**TypeScript：**
```typescript
function findDisappearedNumbers(nums: number[]): number[] {
  for (const v of nums) {
    const idx = Math.abs(v) - 1;
    if (nums[idx] > 0) nums[idx] = -nums[idx];
  }
  const out: number[] = [];
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] > 0) out.push(i + 1);
  }
  return out;
}
```

**Java：**
```java
import java.util.*;
class Solution {
    public List<Integer> findDisappearedNumbers(int[] nums) {
        for (int v : nums) {
            int idx = Math.abs(v) - 1;
            if (nums[idx] > 0) nums[idx] = -nums[idx];
        }
        List<Integer> out = new ArrayList<>();
        for (int i = 0; i < nums.length; i++) {
            if (nums[i] > 0) out.add(i + 1);
        }
        return out;
    }
}
```

**要点：**
- 用对应下标处的"符号位"作为"是否出现过"的标记。
- 取 `abs(v)` 是因为之前的标记可能已经改变符号。
- 会改写输入；如不允许，收集结果后再把符号恢复。

**标签：** #algorithm

---

### 51. 多数元素

**难度：** 简单
**主题：** arrays, voting
**岗位：** ICT3
**级别：** ICT3

**问题：** 找出数组中出现次数超过 n/2 的元素（保证存在）。

**思路：** Boyer-Moore 投票：候选与计数；相同则 +1，否则 -1；归零时换候选。O(n) 时间，O(1) 空间。不变式优雅：若多数存在，最后存活的候选即多数。

**Python：**
```python
def majority_element(nums: list[int]) -> int:
    candidate = 0
    count = 0
    for n in nums:
        if count == 0:
            candidate = n
        count += 1 if n == candidate else -1
    return candidate
```

**TypeScript：**
```typescript
function majorityElement(nums: number[]): number {
  let candidate = 0, count = 0;
  for (const n of nums) {
    if (count === 0) candidate = n;
    count += n === candidate ? 1 : -1;
  }
  return candidate;
}
```

**Java：**
```java
class Solution {
    public int majorityElement(int[] nums) {
        int candidate = 0, count = 0;
        for (int n : nums) {
            if (count == 0) candidate = n;
            count += (n == candidate) ? 1 : -1;
        }
        return candidate;
    }
}
```

**要点：**
- 多数票每次与一个非多数票配对相消，最终多数票仍占多。
- 仅在多数存在的前提下成立；否则需第二趟验证。
- O(1) 额外空间优于哈希计数。

**标签：** #algorithm

---

### 52. 乘积最大子数组

**难度：** 中等
**主题：** arrays, dp
**岗位：** ICT4
**级别：** ICT3-ICT4

**问题：** 找出乘积最大的连续子数组。

**思路：** 同时维护当前 `maxProd` 与 `minProd`（负 * 负可能很大）。每步候选为 `nums[i]`、`maxProd * nums[i]`、`minProd * nums[i]`。更新两者。全局取最大。O(n) 时间，O(1) 空间。

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
class Solution {
    public int maxProduct(int[] nums) {
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
}
```

**要点：**
- 遇到负数先交换 hi/lo，乘法才能正确传递。
- 只维护最大值会漏掉"负 * 负"翻盘的机会。
- 遇 0 时 hi/lo 都会被当前元素重置。

**标签：** #algorithm

---

### 53. 跳跃游戏

**难度：** 中等
**主题：** arrays, greedy
**岗位：** ICT3
**级别：** ICT3-ICT4

**问题：** `nums` 每个元素为从该位置可跳的最大步数。判断能否到达最后一个下标。

**思路：** 贪心：跟踪最远可达下标。遍历 i；若 `i > maxReach`，返回 false；否则 `maxReach = max(maxReach, i + nums[i])`。`maxReach >= n-1` 返回 true。O(n) 时间，O(1) 空间。

**Python：**
```python
def can_jump(nums: list[int]) -> bool:
    max_reach = 0
    for i, jump in enumerate(nums):
        if i > max_reach:
            return False
        max_reach = max(max_reach, i + jump)
    return True
```

**TypeScript：**
```typescript
function canJump(nums: number[]): boolean {
  let maxReach = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i > maxReach) return false;
    maxReach = Math.max(maxReach, i + nums[i]);
  }
  return true;
}
```

**Java：**
```java
class Solution {
    public boolean canJump(int[] nums) {
        int maxReach = 0;
        for (int i = 0; i < nums.length; i++) {
            if (i > maxReach) return false;
            maxReach = Math.max(maxReach, i + nums[i]);
        }
        return true;
    }
}
```

**要点：**
- 任何能到达的下标都能把可达范围扩展到该位置允许的最大值。
- 一旦遇到不可达下标立刻返回 false。
- O(1) 空间，无需 DP 表。

**标签：** #algorithm

---

### 54. 跳跃游戏 II

**难度：** 中等
**主题：** arrays, greedy, bfs
**岗位：** ICT4
**级别：** ICT4

**问题：** 同上但返回到达最后一个下标的最少跳跃数。

**思路：** 按跳跃数贪心 BFS。维护 `currentEnd`（当前跳跃终点）与 `farthest`（下一跳最远）。当 i 到达 `currentEnd` 时跳数 +1，`currentEnd = farthest`。O(n) 时间，O(1) 空间。

**Python：**
```python
def jump(nums: list[int]) -> int:
    jumps = current_end = farthest = 0
    for i in range(len(nums) - 1):
        farthest = max(farthest, i + nums[i])
        if i == current_end:
            jumps += 1
            current_end = farthest
    return jumps
```

**TypeScript：**
```typescript
function jump(nums: number[]): number {
  let jumps = 0, currentEnd = 0, farthest = 0;
  for (let i = 0; i < nums.length - 1; i++) {
    farthest = Math.max(farthest, i + nums[i]);
    if (i === currentEnd) {
      jumps++;
      currentEnd = farthest;
    }
  }
  return jumps;
}
```

**Java：**
```java
class Solution {
    public int jump(int[] nums) {
        int jumps = 0, currentEnd = 0, farthest = 0;
        for (int i = 0; i < nums.length - 1; i++) {
            farthest = Math.max(farthest, i + nums[i]);
            if (i == currentEnd) {
                jumps++;
                currentEnd = farthest;
            }
        }
        return jumps;
    }
}
```

**要点：**
- 每一"层" BFS 对应一次跳跃覆盖的区间。
- 只需遍历到 `len - 2`，因为决定从最后一段起跳后即结束。
- 每步贪心跳到当前可达最远点是最优的。

**标签：** #algorithm

---

### 55. 不同路径

**难度：** 中等
**主题：** dp, combinatorics
**岗位：** ICT3
**级别：** ICT3

**问题：** m x n 网格中机器人只能向右或向下从左上走到右下。有多少条不同路径？

**思路：** DP `dp[i][j] = dp[i-1][j] + dp[i][j-1]`，基底 `dp[0][*] = dp[*][0] = 1`。压成一维 O(n) 空间。数学党：闭式解 C(m+n-2, m-1)。O(mn) 时间。

**Python：**
```python
def unique_paths(m: int, n: int) -> int:
    row = [1] * n
    for _ in range(1, m):
        for j in range(1, n):
            row[j] += row[j - 1]
    return row[-1]
```

**TypeScript：**
```typescript
function uniquePaths(m: number, n: number): number {
  const row = new Array(n).fill(1);
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      row[j] += row[j - 1];
    }
  }
  return row[n - 1];
}
```

**Java：**
```java
class Solution {
    public int uniquePaths(int m, int n) {
        int[] row = new int[n];
        java.util.Arrays.fill(row, 1);
        for (int i = 1; i < m; i++) {
            for (int j = 1; j < n; j++) row[j] += row[j - 1];
        }
        return row[n - 1];
    }
}
```

**要点：**
- 滚动数组把空间从 O(mn) 压到 O(n)。
- 每格只依赖正上方（即更新前的 `row[j]`）与左邻 `row[j-1]`。
- 闭式 C(m+n-2, m-1) 在精度允许时为 O(min(m, n))。

**标签：** #algorithm

---

### 56. 最小路径和

**难度：** 中等
**主题：** dp, grid
**岗位：** ICT3
**级别：** ICT3-ICT4

**问题：** 给定 m x n 非负数网格，求从左上到右下使路径数字之和最小（只能下或右）。

**思路：** DP `dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1])`。原地修改 `grid` 实现 O(1) 额外空间。O(mn) 时间。

**Python：**
```python
def min_path_sum(grid: list[list[int]]) -> int:
    m, n = len(grid), len(grid[0])
    for i in range(m):
        for j in range(n):
            if i == 0 and j == 0: continue
            up = grid[i - 1][j] if i > 0 else float("inf")
            left = grid[i][j - 1] if j > 0 else float("inf")
            grid[i][j] += min(up, left)
    return grid[m - 1][n - 1]
```

**TypeScript：**
```typescript
function minPathSum(grid: number[][]): number {
  const m = grid.length, n = grid[0].length;
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (i === 0 && j === 0) continue;
      const up = i > 0 ? grid[i - 1][j] : Infinity;
      const left = j > 0 ? grid[i][j - 1] : Infinity;
      grid[i][j] += Math.min(up, left);
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
                int up = i > 0 ? grid[i - 1][j] : Integer.MAX_VALUE;
                int left = j > 0 ? grid[i][j - 1] : Integer.MAX_VALUE;
                grid[i][j] += Math.min(up, left);
            }
        }
        return grid[m - 1][n - 1];
    }
}
```

**要点：**
- 原地更新 grid 把额外空间压到 O(1)。
- 对越界邻居用 `Infinity` 哨兵，让 `min` 无需分支。
- O(mn) 已是渐近最优——每格都必须访问一次。

**标签：** #algorithm

---

### 57. 三角形最小路径和

**难度：** 中等
**主题：** dp, bottom-up
**岗位：** ICT4
**级别：** ICT3-ICT4

**问题：** 给定数字三角形，求从顶到底的最小路径和；每步可走向下一行相邻下标。

**思路：** 自底向上 DP。从最后一行开始；对上一层 `dp[j] = triangle[i][j] + min(dp[j], dp[j+1])`。结果为 `dp[0]`。O(n^2) 时间，O(n) 空间。

**Python：**
```python
def minimum_total(triangle: list[list[int]]) -> int:
    dp = triangle[-1][:]
    for i in range(len(triangle) - 2, -1, -1):
        for j in range(len(triangle[i])):
            dp[j] = triangle[i][j] + min(dp[j], dp[j + 1])
    return dp[0]
```

**TypeScript：**
```typescript
function minimumTotal(triangle: number[][]): number {
  const dp = [...triangle[triangle.length - 1]];
  for (let i = triangle.length - 2; i >= 0; i--) {
    for (let j = 0; j < triangle[i].length; j++) {
      dp[j] = triangle[i][j] + Math.min(dp[j], dp[j + 1]);
    }
  }
  return dp[0];
}
```

**Java：**
```java
import java.util.*;
class Solution {
    public int minimumTotal(List<List<Integer>> triangle) {
        int n = triangle.size();
        int[] dp = new int[n + 1];
        for (int i = n - 1; i >= 0; i--) {
            List<Integer> row = triangle.get(i);
            for (int j = 0; j < row.size(); j++) {
                dp[j] = row.get(j) + Math.min(dp[j], dp[j + 1]);
            }
        }
        return dp[0];
    }
}
```

**要点：**
- 自底向上避免向下走时的行宽边界判断。
- 一维 dp 数组足够，因为每格只依赖下一行的两个值。
- 最终结果累积在 `dp[0]`。

**标签：** #algorithm

---

### 58. 单词规律

**难度：** 简单
**主题：** strings, hashmap
**岗位：** ICT3
**级别：** ICT3

**问题：** 给定 `pattern` 和字符串 `s`，判断 `s` 是否符合该规律（字母与空格分隔的单词之间存在双射）。

**思路：** 两个映射：char->word 和 word->char。同步遍历对应位置；任一映射冲突则否。长度不一致则否。O(n) 时间，O(k) 空间。

**Python：**
```python
def word_pattern(pattern: str, s: str) -> bool:
    words = s.split()
    if len(pattern) != len(words):
        return False
    c2w: dict[str, str] = {}
    w2c: dict[str, str] = {}
    for c, w in zip(pattern, words):
        if c in c2w and c2w[c] != w: return False
        if w in w2c and w2c[w] != c: return False
        c2w[c] = w
        w2c[w] = c
    return True
```

**TypeScript：**
```typescript
function wordPattern(pattern: string, s: string): boolean {
  const words = s.split(" ");
  if (pattern.length !== words.length) return false;
  const c2w = new Map<string, string>();
  const w2c = new Map<string, string>();
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i], w = words[i];
    if (c2w.has(c) && c2w.get(c) !== w) return false;
    if (w2c.has(w) && w2c.get(w) !== c) return false;
    c2w.set(c, w);
    w2c.set(w, c);
  }
  return true;
}
```

**Java：**
```java
import java.util.*;
class Solution {
    public boolean wordPattern(String pattern, String s) {
        String[] words = s.split(" ");
        if (pattern.length() != words.length) return false;
        Map<Character, String> c2w = new HashMap<>();
        Map<String, Character> w2c = new HashMap<>();
        for (int i = 0; i < pattern.length(); i++) {
            char c = pattern.charAt(i);
            String w = words[i];
            if (c2w.containsKey(c) && !c2w.get(c).equals(w)) return false;
            if (w2c.containsKey(w) && w2c.get(w) != c) return false;
            c2w.put(c, w);
            w2c.put(w, c);
        }
        return true;
    }
}
```

**要点：**
- 双向映射才能保证双射要求。
- 长度不一致是成本最低的早返回。
- 时间复杂度为两者较长者的 O(n)。

**标签：** #algorithm

---

### 59. 同构字符串

**难度：** 简单
**主题：** strings, hashmap
**岗位：** ICT3
**级别：** ICT3

**问题：** 给定 `s` 和 `t`，判断能否对 `s` 中字符做替换得到 `t`（保持顺序的双射）。

**思路：** 用两个数组/映射分别记录 s 与 t 中每个字符的上次出现下标。每个 i 处两者下标必须一致（同为 -1 或同值）。更新。O(n) 时间，O(1) 空间（固定字母表）。

**Python：**
```python
def is_isomorphic(s: str, t: str) -> bool:
    if len(s) != len(t):
        return False
    s2t: dict[str, str] = {}
    t2s: dict[str, str] = {}
    for a, b in zip(s, t):
        if s2t.get(a, b) != b or t2s.get(b, a) != a:
            return False
        s2t[a] = b
        t2s[b] = a
    return True
```

**TypeScript：**
```typescript
function isIsomorphic(s: string, t: string): boolean {
  if (s.length !== t.length) return false;
  const s2t = new Map<string, string>();
  const t2s = new Map<string, string>();
  for (let i = 0; i < s.length; i++) {
    const a = s[i], b = t[i];
    if ((s2t.has(a) && s2t.get(a) !== b) || (t2s.has(b) && t2s.get(b) !== a)) return false;
    s2t.set(a, b);
    t2s.set(b, a);
  }
  return true;
}
```

**Java：**
```java
import java.util.*;
class Solution {
    public boolean isIsomorphic(String s, String t) {
        if (s.length() != t.length()) return false;
        Map<Character, Character> s2t = new HashMap<>();
        Map<Character, Character> t2s = new HashMap<>();
        for (int i = 0; i < s.length(); i++) {
            char a = s.charAt(i), b = t.charAt(i);
            if (s2t.containsKey(a) && s2t.get(a) != b) return false;
            if (t2s.containsKey(b) && t2s.get(b) != a) return false;
            s2t.put(a, b);
            t2s.put(b, a);
        }
        return true;
    }
}
```

**要点：**
- 双向都得检查，否则两个 `s` 字符可能映射到同一 `t` 字符。
- 用 `get(...)` 配默认值同时处理"未出现"与"匹配"两种情况。
- 先做长度判断，避免部分字符串误判通过。

**标签：** #algorithm

---

### 60. 有效的字母异位词

**难度：** 简单
**主题：** strings, hashmap, sorting
**岗位：** ICT3
**级别：** ICT3

**问题：** 给定 `s` 和 `t`，判断 `t` 是否是 `s` 的字母异位词。

**思路：** 频次计数（小写 ASCII 用大小 26 的数组）。s 加，t 减；最后全为 0 即可。O(n) 时间，O(1) 空间。排序后比较是 O(n log n)。Unicode 用哈希表。

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
class Solution {
    public boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) return false;
        int[] cnt = new int[26];
        for (int i = 0; i < s.length(); i++) {
            cnt[s.charAt(i) - 'a']++;
            cnt[t.charAt(i) - 'a']--;
        }
        for (int c : cnt) if (c != 0) return false;
        return true;
    }
}
```

**要点：**
- 同一趟内做加减，省一次遍历。
- 长度不一致是 O(1) 的早返回。
- 处理 Unicode 时改用以码点为键的哈希表。

**标签：** #algorithm

---

### 61. 无锁有界单生产者单消费者队列

**难度：** 困难
**主题：** concurrency, lock-free, ring-buffer, memory-ordering
**岗位：** ICT5
**级别：** ICT5

**问题：** 实现一个定容 SPSC 队列，无锁，适用于音频线程向实时消费者投递采样的场景。

**思路：** 大小为 N（2 的幂）的环形缓冲；`head`（写者）与 `tail`（读者）为原子下标。生产者检查 `head - tail < N`，写入槽位并以 release 顺序递增 head。消费者检查 `head - tail > 0`，读取槽位并以 release 顺序递增 tail；读取用 acquire。把两个下标按缓存行隔离（避免伪共享）。环绕用 `idx & (N-1)`。

**Python：**
```python
import threading
from typing import TypeVar, Generic

T = TypeVar("T")

class SPSCQueue(Generic[T]):
    def __init__(self, capacity: int) -> None:
        assert capacity & (capacity - 1) == 0, "capacity must be a power of 2"
        self.buf: list[T | None] = [None] * capacity
        self.mask = capacity - 1
        self.head = 0  # 仅生产者写
        self.tail = 0  # 仅消费者写
        self.lock = threading.Lock()  # Python 跨原生代码时 GIL 并不足够

    def push(self, item: T) -> bool:
        with self.lock:
            if self.head - self.tail >= len(self.buf):
                return False
            self.buf[self.head & self.mask] = item
            self.head += 1
            return True

    def pop(self) -> T | None:
        with self.lock:
            if self.head == self.tail:
                return None
            item = self.buf[self.tail & self.mask]
            self.tail += 1
            return item
```

**TypeScript：**
```typescript
class SPSCQueue<T> {
  private buf: (T | undefined)[];
  private mask: number;
  private head = 0;
  private tail = 0;
  constructor(capacity: number) {
    if ((capacity & (capacity - 1)) !== 0) throw new Error("capacity must be a power of 2");
    this.buf = new Array(capacity);
    this.mask = capacity - 1;
  }
  push(item: T): boolean {
    if (this.head - this.tail >= this.buf.length) return false;
    this.buf[this.head & this.mask] = item;
    this.head++;
    return true;
  }
  pop(): T | undefined {
    if (this.head === this.tail) return undefined;
    const item = this.buf[this.tail & this.mask];
    this.tail++;
    return item;
  }
}
```

**Java：**
```java
import java.util.concurrent.atomic.AtomicLong;
class SPSCQueue<T> {
    private final Object[] buf;
    private final int mask;
    private final AtomicLong head = new AtomicLong(0);
    private final AtomicLong tail = new AtomicLong(0);
    public SPSCQueue(int capacity) {
        if ((capacity & (capacity - 1)) != 0) throw new IllegalArgumentException("power of 2");
        this.buf = new Object[capacity];
        this.mask = capacity - 1;
    }
    public boolean push(T item) {
        long h = head.get();
        if (h - tail.get() >= buf.length) return false;
        buf[(int) (h & mask)] = item;
        head.lazySet(h + 1);
        return true;
    }
    @SuppressWarnings("unchecked")
    public T pop() {
        long t = tail.get();
        if (head.get() == t) return null;
        T item = (T) buf[(int) (t & mask)];
        tail.lazySet(t + 1);
        return item;
    }
}
```

**要点：**
- 容量取 2 的幂，可用 `idx & (N-1)` 替代昂贵的取模。
- 真正的 lock-free SPSC 需要 C++ `std::atomic` 的 acquire/release 内存序，Python/JS 原生不支持。
- 把 `head` 与 `tail` 用缓存行隔离，消除伪共享。

**标签：** #algorithm

---

### 62. 缓存友好的矩阵转置

**难度：** 中等
**主题：** arrays, cache, memory-layout
**岗位：** ICT4
**级别：** ICT4-ICT5

**问题：** 对一个大的 N x N 矩阵做原地（或非原地）转置，最小化缓存未命中。

**思路：** 朴素双重循环写（或读）步长为 N，会冲垮缓存。采用分块/tiling：每次转置 B x B 的子块（选 B 使 2 * B * B * sizeof(elem) 能塞进 L1）。每个子块在寄存器内完成内部转置；对角块原地交换。以一些算术换取局部性，实测可提升 3-10 倍。

**Python：**
```python
def transpose_blocked(a: list[list[float]], block: int = 32) -> None:
    n = len(a)
    for ii in range(0, n, block):
        for jj in range(ii, n, block):
            i_max = min(ii + block, n)
            j_max = min(jj + block, n)
            if ii == jj:
                for i in range(ii, i_max):
                    for j in range(i + 1, j_max):
                        a[i][j], a[j][i] = a[j][i], a[i][j]
            else:
                for i in range(ii, i_max):
                    for j in range(jj, j_max):
                        a[i][j], a[j][i] = a[j][i], a[i][j]
```

**TypeScript：**
```typescript
function transposeBlocked(a: number[][], block = 32): void {
  const n = a.length;
  for (let ii = 0; ii < n; ii += block) {
    for (let jj = ii; jj < n; jj += block) {
      const iMax = Math.min(ii + block, n);
      const jMax = Math.min(jj + block, n);
      if (ii === jj) {
        for (let i = ii; i < iMax; i++) {
          for (let j = i + 1; j < jMax; j++) {
            [a[i][j], a[j][i]] = [a[j][i], a[i][j]];
          }
        }
      } else {
        for (let i = ii; i < iMax; i++) {
          for (let j = jj; j < jMax; j++) {
            [a[i][j], a[j][i]] = [a[j][i], a[i][j]];
          }
        }
      }
    }
  }
}
```

**Java：**
```java
class Solution {
    public void transposeBlocked(double[][] a, int block) {
        int n = a.length;
        for (int ii = 0; ii < n; ii += block) {
            for (int jj = ii; jj < n; jj += block) {
                int iMax = Math.min(ii + block, n);
                int jMax = Math.min(jj + block, n);
                if (ii == jj) {
                    for (int i = ii; i < iMax; i++) {
                        for (int j = i + 1; j < jMax; j++) {
                            double t = a[i][j]; a[i][j] = a[j][i]; a[j][i] = t;
                        }
                    }
                } else {
                    for (int i = ii; i < iMax; i++) {
                        for (int j = jj; j < jMax; j++) {
                            double t = a[i][j]; a[i][j] = a[j][i]; a[j][i] = t;
                        }
                    }
                }
            }
        }
    }
}
```

**要点：**
- 按 B x B 子块处理，让每个块的行和列都能装进 L1 缓存。
- 仅遍历 `jj >= ii` 的子块，避免对称的非对角块被重复交换。
- 对角块需块内交换；非对角块与其镜像块互换。

**标签：** #algorithm

---

## 苹果特有的建议

- **搞清楚自己面的是哪个团队。** Loop 归招聘团队主导；内容差异巨大。问 recruiter 该期待什么。
- **要有某方面的深度。** 苹果招专才。挑一个领域（底层性能、图形、ML、前端、嵌入式、音频）做深。通才会被推去和 FAANG 强项硬碰。
- **隐私思维。** 设计系统时默认"数据最小化"、"尽量端上"，但别说教。即使后端岗也会被问隐私题。
- **别贬损苹果其他产品**——哪怕委婉。对平台的认同感是文化的一部分。
- **流程很慢。** 从 onsite 到 offer 可能 4-8 周。其他流程的时间线要相应管理。

## 参考资料

- LeetCode "Apple" 公司标签
- Apple 开发者文档（视团队而定——读 Swift、Combine、Metal 或 Core ML）
- Apple Machine Learning 研究博客
- 《Creative Selection》by Ken Kocienda——苹果内部产品流程
