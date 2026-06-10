# 腾讯

```yaml
company: 腾讯（微信/Weixin、QQ、腾讯游戏、腾讯云、腾讯视频）
typical_rounds: 1 轮 HR 初筛 + 3-5 轮技术面（常按面试官级别：T2.2 → T3.x → T4）+ 交叉面 + HR 终面
focus_areas: C++/分布式系统、网络、游戏后端、大规模社交/消息
languages_allowed: 游戏/基础设施团队强偏好 C++；云相关用 Java/Go；部分 web 岗用 Python/Node
duration: 每轮 45-60 分钟
notable_quirks:
  - 网络深挖常见（TCP 内部、基于 UDP 的协议、内核网络）
  - 游戏后端岗位深挖游戏循环设计、帧同步/状态同步、反作弊
  - 高级岗位会考微信级消息系统设计
  - 行为面试比美国公司轻；重点是协作和跨 BG（事业群）配合
  - 多事业群（WXG、IEG、CSIG、TEG、PCG）——各有各自文化
sources: 一亩三分地、牛客网、LeetCode-cn、niuke.com
```

## 概述

腾讯的面试在基础设施和游戏岗位上偏 C++（腾讯在微信、QQ、王者荣耀、PUBG Mobile、英雄联盟后端等都有庞大的 C++ 团队）。游戏/IM 岗位期望网络知识——TCP 窗口、NAT 穿透、自定义 UDP 协议、丢包处理。系统设计围绕微信量级（10 亿+ MAU）的社交/消息和游戏后端（帧同步、状态同步、匹配）。行为面试比美国公司轻；他们会探查跨事业群（BG）协作的能力，因为腾讯结构上跨 BG 协作本身就难。

## 题目

### 1. 两数相加（链表）

**难度：** 中等
**主题：** linked-list, math
**岗位：** SWE
**级别：** T2-T3

**问题：** 两个非负整数以逆序链表存储（每节点一位数字）。返回它们的和（同样格式的链表）。

**思路：** 同步遍历两个链表，带进位。哑头，结果指针推进。注意：长度不同的链表、最终进位 → 多一个节点。O(max(n, m))。

**Python：**
```python
class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val, self.next = val, next

def add_two_numbers(l1: ListNode | None, l2: ListNode | None) -> ListNode | None:
    dummy = ListNode()
    tail, carry = dummy, 0
    while l1 or l2 or carry:
        s = carry + (l1.val if l1 else 0) + (l2.val if l2 else 0)
        carry, d = divmod(s, 10)
        tail.next = ListNode(d)
        tail = tail.next
        l1, l2 = (l1.next if l1 else None), (l2.next if l2 else None)
    return dummy.next
```

**TypeScript：**
```typescript
class ListNode {
  val: number; next: ListNode | null;
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
    l1 = l1?.next ?? null; l2 = l2?.next ?? null;
  }
  return dummy.next;
}
```

**Java：**
```java
class ListNode {
  int val; ListNode next;
  ListNode(int val) { this.val = val; }
}

ListNode addTwoNumbers(ListNode l1, ListNode l2) {
  ListNode dummy = new ListNode(0), tail = dummy;
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
- 循环条件包含 `carry`，最后一位的进位也能输出一个节点。
- 某条链表先结束时，缺失位按 0 处理。
- 输出本身也是逆序，无需再反转。

**常见追问：**
- 数字高位在头——反转后相加再反转，或用双栈。
- 两个链表形式的数相减——借位而非进位。
- 链表形式相乘。
- 双向链表支持正反遍历。

**常见坑：**
- 两表都结束后忘了最后一个进位节点。
- 把较短表缺失节点当 `null` 错误而不是 0。

**标签：** #algorithm

---

### 2. 字符串相加

**难度：** 简单
**主题：** strings, math
**岗位：** SWE
**级别：** T2-T3

**问题：** 给定两个非负整数字符串，返回其和字符串（不用内置 BigInt）。

**思路：** 双指针从末尾，带进位，追加每位。结果反转。O(max(n, m))。腾讯常用热身题，检验基本正确性。

**Python：**
```python
def add_strings(num1: str, num2: str) -> str:
    i, j, carry = len(num1) - 1, len(num2) - 1, 0
    out: list[str] = []
    while i >= 0 or j >= 0 or carry:
        a = ord(num1[i]) - 48 if i >= 0 else 0
        b = ord(num2[j]) - 48 if j >= 0 else 0
        carry, d = divmod(a + b + carry, 10)
        out.append(chr(d + 48))
        i -= 1
        j -= 1
    return "".join(reversed(out))
```

**TypeScript：**
```typescript
function addStrings(num1: string, num2: string): string {
  let i = num1.length - 1, j = num2.length - 1, carry = 0;
  const out: string[] = [];
  while (i >= 0 || j >= 0 || carry) {
    const a = i >= 0 ? num1.charCodeAt(i) - 48 : 0;
    const b = j >= 0 ? num2.charCodeAt(j) - 48 : 0;
    const s = a + b + carry;
    carry = Math.floor(s / 10);
    out.push(String.fromCharCode((s % 10) + 48));
    i--; j--;
  }
  return out.reverse().join("");
}
```

**Java：**
```java
String addStrings(String num1, String num2) {
  int i = num1.length() - 1, j = num2.length() - 1, carry = 0;
  StringBuilder out = new StringBuilder();
  while (i >= 0 || j >= 0 || carry != 0) {
    int a = i >= 0 ? num1.charAt(i) - '0' : 0;
    int b = j >= 0 ? num2.charAt(j) - '0' : 0;
    int s = a + b + carry;
    carry = s / 10;
    out.append((char) ('0' + s % 10));
    i--; j--;
  }
  return out.reverse().toString();
}
```

**要点：**
- 只要有任一下标或进位剩余就继续循环。
- 用字符编码做算术，避免对每位调用 `parseInt`。
- 先按倒序追加，最后只反转一次。

**常见追问：**
- 不用 big-int 做字符串相乘。
- 任意进制（二进制、十六进制）下的非负整数相加。
- 含小数点的字符串相加。
- 支持负数——转换到减法。

**常见坑：**
- 循环后忘了处理最后进位。
- 逐位用 `Integer.parseInt`——慢且不必要。

**标签：** #algorithm

---

### 3. 环形链表 II

**难度：** 中等
**主题：** linked-list, two-pointer, floyd
**岗位：** SWE
**级别：** T2-T3

**问题：** 给定链表，返回环开始的节点，无环则 null。

**思路：** Floyd 龟兔。慢 + 快指针——相遇后把慢指针重置到 head，两者都走 1 步；它们在环起点再相遇。O(n) 时间，O(1) 空间。数学（2k = k + nL → k - μ = nL - μ）容易绕——准备好讲清楚。

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
- 相遇后，从头到环起点的距离与相遇点到环起点的距离模环长相等。
- 环起点即头节点的情形天然成立，两指针起点一致。
- 相比哈希记录访问节点，O(1) 空间最多再追一圈即可定位环起点。

**常见追问：**
- 仅检测是否有环（Linked List Cycle I）——更简单。
- 求环长。
- 在有向图上用 Floyd 算法找环入口。
- 修复链表：把环上最后一个节点的 `next` 设为 `null`。

**常见坑：**
- 在比较相等之前先让两指针动——可能错过起点的相遇。
- 未动就判 `slow == fast`——平凡成立，算法坍坏。

**标签：** #algorithm

---

### 4. 全排列

**难度：** 中等
**主题：** backtracking, recursion
**岗位：** SWE
**级别：** T2-T3

**问题：** 给定不重复整数数组，返回所有可能的排列。

**思路：** 回溯——当前下标与后续每个下标交换，递归，再换回。或用 `used[]` 布尔数组。O(n * n!)。追问：含重复——先排序，当 `used[i-1]` 为 false 且 `nums[i] == nums[i-1]` 时跳过。

**Python：**
```python
def permute(nums: list[int]) -> list[list[int]]:
    out: list[list[int]] = []
    def go(start: int) -> None:
        if start == len(nums):
            out.append(nums[:])
            return
        for i in range(start, len(nums)):
            nums[start], nums[i] = nums[i], nums[start]
            go(start + 1)
            nums[start], nums[i] = nums[i], nums[start]
    go(0)
    return out
```

**TypeScript：**
```typescript
function permute(nums: number[]): number[][] {
  const out: number[][] = [];
  const go = (start: number): void => {
    if (start === nums.length) { out.push(nums.slice()); return; }
    for (let i = start; i < nums.length; i++) {
      [nums[start], nums[i]] = [nums[i], nums[start]];
      go(start + 1);
      [nums[start], nums[i]] = [nums[i], nums[start]];
    }
  };
  go(0);
  return out;
}
```

**Java：**
```java
List<List<Integer>> permute(int[] nums) {
  List<List<Integer>> out = new ArrayList<>();
  go(nums, 0, out);
  return out;
}

void go(int[] nums, int start, List<List<Integer>> out) {
  if (start == nums.length) {
    List<Integer> snap = new ArrayList<>();
    for (int x : nums) snap.add(x);
    out.add(snap);
    return;
  }
  for (int i = start; i < nums.length; i++) {
    int t = nums[start]; nums[start] = nums[i]; nums[i] = t;
    go(nums, start + 1, out);
    t = nums[start]; nums[start] = nums[i]; nums[i] = t;
  }
}
```

**要点：**
- 原地交换可省去显式 `used[]` 数组。
- 回溯返回前务必还原交换，保持原数组状态。
- 通过 `slice`/`[:]` 拷贝快照，避免后续修改破坏已记录结果。

**常见追问：**
- Permutations II——输入含重复，排序 + 跳过去重。
- Next Permutation——原地变换为下一个字典序。
- 第 k 个排列——阶乘进制，不枚举。
- 带约束的排列（相邻不重复等）。

**常见坑：**
- 忘了在加入输出前拷贝 `nums`——后续交换覆盖结果。
- 交换后还想靠排序去重——不变量丢失。

**标签：** #algorithm

---

### 5. 最大子数组和（Kadane）

**难度：** 简单
**主题：** dp, arrays, greedy
**岗位：** SWE
**级别：** T2-T3

**问题：** 给定整数数组，找出和最大的连续子数组。

**思路：** Kadane：维护 `current = max(num, current + num)`、`best = max(best, current)`。O(n) 时间，O(1) 空间。处理全负数（返回单个最大元素）。追问：同时返回起止下标。

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
- `cur` 表示以当前下标结尾的最大子数组和。
- 两者均初始化为 `nums[0]`，全负数也能返回最大元素。
- 分治写法也能 O(n log n)，但相对小题大做。

**常见追问：**
- 返回实际子数组（start/end 下标），而不仅是和。
- 最大 *乘积* 子数组——负数缘故同时跟踪最大与最小。
- 环形最大子数组。
- 限定至多 k 个元素的最大子数组。

**常见坑：**
- `cur` 与 `best` 初为 0——全负输入出错。
- 从下标 0 开始循环还加了 `nums[0]`——用 `nums[0]` 初始化后从 1 开始。

**标签：** #algorithm

---

### 6. 原地反转字符串

**难度：** 简单
**主题：** strings, two-pointer
**岗位：** SWE
**级别：** T2

**问题：** 原地反转 `char[]`。然后：原地反转句子中的单词顺序（`"the sky is blue"` → `"blue is sky the"`）。

**思路：** 第一部分：双指针交换。第二部分：先整体反转，再逐词反转。O(n) 时间，O(1) 额外空间。腾讯 C++ 经典题——面试官还会问 `std::string` 的 SSO 和 C++11 之前的 COW 语义。

**Python：**
```python
def reverse_words(chars: list[str]) -> None:
    def rev(l: int, r: int) -> None:
        while l < r:
            chars[l], chars[r] = chars[r], chars[l]
            l += 1
            r -= 1
    rev(0, len(chars) - 1)
    l = 0
    for r in range(len(chars) + 1):
        if r == len(chars) or chars[r] == " ":
            rev(l, r - 1)
            l = r + 1
```

**TypeScript：**
```typescript
function reverseWords(chars: string[]): void {
  const rev = (l: number, r: number): void => {
    while (l < r) { [chars[l], chars[r]] = [chars[r], chars[l]]; l++; r--; }
  };
  rev(0, chars.length - 1);
  let l = 0;
  for (let r = 0; r <= chars.length; r++) {
    if (r === chars.length || chars[r] === " ") {
      rev(l, r - 1);
      l = r + 1;
    }
  }
}
```

**Java：**
```java
void reverseWords(char[] chars) {
  rev(chars, 0, chars.length - 1);
  int l = 0;
  for (int r = 0; r <= chars.length; r++) {
    if (r == chars.length || chars[r] == ' ') {
      rev(chars, l, r - 1);
      l = r + 1;
    }
  }
}

void rev(char[] a, int l, int r) {
  while (l < r) { char t = a[l]; a[l++] = a[r]; a[r--] = t; }
}
```

**要点：**
- 先整体反转，再原地反转每个单词即可。
- Python/JS 字符串不可变，输入用可变字符 `list`/`array`。
- 仅用少量下标变量，O(1) 额外空间。

**常见追问：**
- 反转句中单词（LeetCode 151）——压缩多个空格。
- 仅反转元音字母。
- 原地反转句子同时保留末尾标点位置。
- 安全反转 UTF-8 字节串（不能拆多字节字符）。

**常见坑：**
- 面试官要求原地时还用 `s[::-1]`——O(n) 额外空间。
- 只在单个空格上 split，遗漏多空格分隔。

**标签：** #coding

---

### 7. BST 的最近公共祖先

**难度：** 简单
**主题：** tree, bst, recursion
**岗位：** SWE
**级别：** T2-T3

**问题：** 给定 BST 和两个节点 `p`、`q`，求 LCA。

**思路：** BST 性质：若 p、q 都 < root 递归左；都 > 递归右；否则当前即 LCA。O(h) 时间，迭代写法 O(1)。别用通用二叉树的解法过度设计。

**Python：**
```python
class TreeNode:
    def __init__(self, val: int = 0, left: "TreeNode | None" = None, right: "TreeNode | None" = None) -> None:
        self.val, self.left, self.right = val, left, right

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
class TreeNode {
  val: number; left: TreeNode | null; right: TreeNode | null;
  constructor(v = 0, l: TreeNode | null = null, r: TreeNode | null = null) { this.val = v; this.left = l; this.right = r; }
}

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
class TreeNode {
  int val; TreeNode left, right;
  TreeNode(int v) { val = v; }
}

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
- 第一个把 `p`、`q` 分到两侧子树的节点即为 LCA。
- 迭代写法只需 O(1) 额外空间。
- 当前节点等于 `p` 或 `q` 时同样视为 LCA。

**常见追问：**
- 一般二叉树的 LCA（无 BST 性质）——递归 O(n)。
- 节点带父指针的 LCA——类似链表相交的双指针。
- 多个节点的 LCA，不仅两个。
- 批量 LCA 查询——Tarjan 离线算法。

**常见坑：**
- 不确认两个节点是否都在树中——未定义行为。
- 把 BST LCA 当一般二叉树做——BST 性质允许 O(h) 迭代。

**标签：** #algorithm

---

### 8. 最小栈

**难度：** 简单
**主题：** stack, design
**岗位：** SWE
**级别：** T2-T3

**问题：** 设计支持 `push`、`pop`、`top` 和 `getMin` 全部 O(1) 的栈。

**思路：** 两栈：主栈 + min 栈（新值 ≤ 当前 min 时才推 min 栈；pop 同步）。或单栈存 `(value, current_min)` 对。所有操作 O(1)。

**Python：**
```python
class MinStack:
    def __init__(self) -> None:
        self.stk: list[tuple[int, int]] = []  # (value, running_min)

    def push(self, val: int) -> None:
        cur_min = val if not self.stk else min(val, self.stk[-1][1])
        self.stk.append((val, cur_min))

    def pop(self) -> None:
        self.stk.pop()

    def top(self) -> int:
        return self.stk[-1][0]

    def get_min(self) -> int:
        return self.stk[-1][1]
```

**TypeScript：**
```typescript
class MinStack {
  private stk: Array<[number, number]> = [];
  push(val: number): void {
    const m = this.stk.length === 0 ? val : Math.min(val, this.stk[this.stk.length - 1][1]);
    this.stk.push([val, m]);
  }
  pop(): void { this.stk.pop(); }
  top(): number { return this.stk[this.stk.length - 1][0]; }
  getMin(): number { return this.stk[this.stk.length - 1][1]; }
}
```

**Java：**
```java
class MinStack {
  private final Deque<int[]> stk = new ArrayDeque<>();  // {value, runningMin}
  public void push(int val) {
    int m = stk.isEmpty() ? val : Math.min(val, stk.peek()[1]);
    stk.push(new int[]{val, m});
  }
  public void pop() { stk.pop(); }
  public int top() { return stk.peek()[0]; }
  public int getMin() { return stk.peek()[1]; }
}
```

**要点：**
- 每个栈元素自带运行最小值，所有操作均 O(1)。
- 当最小值重复较多时，双栈写法更省空间。
- 是否需要处理空栈取决于题目约定，这里假定调用前非空。

**常见追问：**
- Max Stack（O(1) 取最大）以及 O(log n) 的 `popMax`。
- 双栈实现队列——摊销 O(1) 每操作。
- 滑动窗口最值——单调双端队列。
- 线程安全的 Min Stack——同步或无锁。

**常见坑：**
- 只用单变量保存全局最小值——弹出后错误。
- pop 后访问上一个最小值时越界——始终随条目保存。

**标签：** #coding

---

### 9. 设计微信消息后端

**难度：** 困难
**主题：** system-design, im, websockets, presence, scale
**岗位：** 高级 SWE
**级别：** T3-T4

**问题：** 设计支持 10 亿+ MAU、1:1 聊天、群聊（500 人）和全球在线状态的微信消息后端。

**思路：** 每客户端到最近接入网关一条持久 TCP/MQTT（按 user_id 分片）。消息流：网关 → 路由服务（在在线注册表查接收方网关）→ 接收方网关 → 设备。离线消息持久化到 KV，重连时推送。群聊：在每群路由服务做扇出；500 人这量级可行。在线状态：每区域内存存储，全球用带 TTL 的 gossip（最终一致 OK）。消息热存 7 天 + 冷存 90 天。讨论：端到端加密（腾讯出于中国法律合规历史上不做 E2E——直说）、单聊会话内消息有序（每会话序列号）、多设备同步、超大群（广播群另有设计）。

**常见追问：**
- 多设备同步——手机加电脑同时登录，同一条消息一致抵达。
- 跨设备消息顺序——服务端为每会话下发序列号。
- 超大群（公众号式广播）——推变拉，带游标。
- 离线转在线补拉——流式窗口 vs 全量拉。
- 跨区域国际用户的延迟——anycast 网关还是分区域路由？

**常见坑：**
- 承诺 E2E 加密，但设计实际镜像/归档了消息。
- 大群直接扇出——超过 ~500 人不可扩。

**标签：** #system-design

---

### 10. 设计微信朋友圈

**难度：** 困难
**主题：** system-design, feed, privacy, fanout
**岗位：** 高级 SWE
**级别：** T3-T4

**问题：** 设计微信朋友圈——仅好友可见的信息流，严格隐私控制。

**思路：** 封闭图谱 feed（不同于 Twitter/微博）——只有好友能看到帖子。push/pull 混合（同 News Feed）。关键隐私性质：某帖的评论和点赞仅对*发帖人*的共同好友可见。所以展示帖时，服务端按观看者与评论者是否也是好友过滤——读时通过好友图交集完成（缓存交集结果）。照片放 CDN，URL 带短期签名（无公开可发现 URL）。讨论："三天可见"实现为每帖 TTL 标志、评论/点赞通过 IM 系统（第 9 题）发消息式通知、爆款帖处理（封闭图中少见但可能——重度缓存）。

**常见追问：**
- "仅三天可见"——存 TTL 还是读时过滤？
- 拉黑/解除好友后缓存的 feed 必须立即更新。
- 截图转发照片——加可见水印还是接受泄露？
- 跨区域复制——用户出国后 feed 从哪里提供？
- 好友图交集的读时代价——缓存、预计算，还是两者均有？

**常见坑：**
- 展示了非共同好友的评论——隐私违规，极易被发现。
- 封闭图中也可能有热帖（某个好友很有影响力），需提前预案。

**标签：** #system-design

---

### 11. 设计多人游戏服务器（王者荣耀风格）

**难度：** 困难
**主题：** system-design, gaming, low-latency, state-sync
**岗位：** 高级 SWE
**级别：** T3-T4

**问题：** 设计实时 5v5 MOBA（如王者荣耀）的后端。延迟预算：感知 <100ms。

**思路：** 匹配服务（考虑技术 + 区域 + 组队）→ 游戏服务器分配器（多区域 dedicated 游戏服 K8s 池）。游戏服跑权威模拟。**帧同步（lockstep）**：客户端只发输入（小包），所有客户端跑相同的确定性模拟，所有输入到齐推进一帧。腾讯 MOBA 的选择——带宽极小，输入-only 模型方便反作弊。代价：1 个慢客户端 = 全等。**状态同步**：服务端模拟，发状态 diff——FPS 常用。网络：自定义 UDP 协议（含可靠层）；TCP 不适合游戏流量。讨论：时钟同步（类 NTP）、丢包容忍（重发输入，状态同步要预测）、重连（从最近一帧重放输入）、作弊检测（抽样比赛服务端重放）。

**标签：** #system-design

---

### 12. 设计 QQ / 微信音视频通话

**难度：** 困难
**主题：** system-design, webrtc, sfu, nat-traversal, codecs
**岗位：** 高级 SWE
**级别：** T3-T4

**问题：** 设计微信的语音/视频通话基础设施（1:1 和最多 9 人多方）。

**思路：** 信令走 IM 通道（SDP offer/answer 通过消息）。媒体：WebRTC 风格 + ICE 做 NAT 穿透（STUN/TURN 服务器）。1:1 优先 P2P（延迟低、服务器成本低）。多方：SFU（选择性转发单元）——每客户端上传一路，服务端不转码地转发给其他 N-1 人（延迟低、扩展尚可）。编解码：音频 Opus，视频 H.264/H.265，自适应码率。客户端做回声消除、降噪、抖动缓冲。讨论：TURN 中继成本（许多用户在对称 NAT 后）、区域媒体服务器、网络劣化下的带宽自适应。

**标签：** #system-design

---

### 13. 设计腾讯云对象存储（COS）

**难度：** 困难
**主题：** system-design, blob-storage, replication, consistency
**岗位：** 高级 SWE
**级别：** T3-T4

**问题：** 设计腾讯 COS——S3 兼容 API 的对象存储。

**思路：** 前端 S3 兼容 API → 元数据服务（按 bucket+key 分片）→ 存储层采用纠删码（Reed-Solomon 10+4），跨多节点/机架/AZ。区域内强一致由元数据协调器（Paxos）保证。跨区域异步复制做灾备。讨论：纠删码 vs 3 副本权衡（节省约 50% 存储，但读端 CPU/网络更多）、大对象分片上传、生命周期到冷存储（类 Archive Storage）、热 key 处理（CDN + 副本扇出应对爆量读）。

**标签：** #system-design

---

### 14. 设计直播打赏 / 弹幕系统

**难度：** 困难
**主题：** system-design, real-time, fanout, monetization
**岗位：** 高级 SWE
**级别：** T3-T4

**问题：** 设计腾讯视频 / NOW 直播中的打赏和弹幕系统，让观众在直播中实时送虚拟礼物（含支付）并聊天。

**思路：** 礼物购买：事务化流程（扣用户钱包 → 记录礼物事件 → 广播）。钱包写是一致性关键步骤；其余可最终一致。评论/礼物事件 → 单直播 Kafka topic → 扇出到观众 WebSocket 网关。超热直播（1M+ 同时在线）下，限速 + 采样展示；全部异步入 DB。土豪特效（特殊动画）在广播队列里优先级高。讨论：礼物反欺诈（单用户突然飙量 = 潜在盗刷）、主播分成的税务/合规、流过热时优雅降级（先丢低价值评论）。

**标签：** #system-design

---

### 15. 讲一次你跨团队协作的经历

**难度：** 中等
**主题：** behavioral, collaboration, cross-bg
**岗位：** SWE
**级别：** T2-T3

**问题：** 讲一次你与另一团队或 BG 一起交付项目的经历。难点在哪？

**思路：** 腾讯的 BG 结构让跨团队协作文化上较难——他们查你能不能驾驭。展示：(1) 你提前建立了关系（不是被卡了才升级），(2) 你理解对方优先级（不同 OKR、不同领导），(3) 你提出 win-win 框架，(4) 你们共同交付。提具体摩擦（资源、排期错位）以及你如何化解，会很加分。

**标签：** #behavioral

---

### 16. 主动修了职责外问题的经历

**难度：** 中等
**主题：** behavioral, ownership, initiative
**岗位：** SWE
**级别：** T2-T3

**问题：** 讲一次你发现问题主动修复、且无人要求的经历。

**思路：** 腾讯看重"主动"工程师。展示：(1) 具体问题（生产 bug、技术债、缺少工具），(2) 你没等优先级——用个人或非排期时间，(3) 你确保修复经过 review 并被采纳（不是孤胆牛仔式 commit），(4) 影响：可量化地帮到团队。别挑那种修复其实就是你直接职责的故事。

**标签：** #behavioral

---

### 17. 处理生产事故的经历

**难度：** 中等
**主题：** behavioral, incident-response, ownership
**岗位：** 高级 SWE
**级别：** T3-T4

**问题：** 讲一次你主导的生产事故。发生了什么？你怎么应对？事后做了什么改变？

**思路：** 挑真事故（不是"差点出事"）。展示：(1) 你冷静分流——先缓解、后 RCA，(2) 你期间持续向干系人通报（每 15-30 分钟状态更新），(3) 你做了无指责复盘并产出具体行动项，(4) 你跟进行动项而不是仅记录。量化影响（宕机分钟、影响用户数）和修复后的提升（MTTR 降低 X）。

**标签：** #behavioral

---

### 18. 你为什么想加入腾讯

**难度：** 简单
**主题：** behavioral, motivation, fit
**岗位：** SWE
**级别：** T2-T3

**问题：** 为什么是腾讯？想去哪个 BG/团队？

**思路：** 要具体。别说"大厂"或"股票"。挑：(1) 具体产品（微信生态、你热爱并想参与的某款游戏），(2) 腾讯强势的技术领域（游戏技术、IM、云），(3) BG 文化（IEG 游戏、WXG 微信——风格相当不同）。提腾讯开源贡献（TARS、ncnn 做 ML 推理）能体现你做了功课。

**标签：** #behavioral

---

### 19. TCP 深挖：高 RTT 链路上 TCP 吞吐为何下降？

**难度：** 困难
**主题：** networking, tcp, performance
**岗位：** 高级 SWE
**级别：** T3-T4

**问题：** 跨地域服务（上海 → 美东，200ms RTT）TCP 吞吐远低于可用带宽。为什么？怎么修？

**思路：** 带宽时延积（BDP）：高 RTT 下吞吐 = window_size / RTT。默认 TCP 发送/接收缓冲可能太小——计算：1 Gbps × 0.2s = 200 Mbits = 25 MB BDP，但 Linux 默认发送缓冲约 4MB。修复：(1) 调大 `net.ipv4.tcp_rmem` / `tcp_wmem`，(2) 启用 TCP window scaling（RFC 7323——通常默认开但要检查），(3) 拥塞控制改用 BBR（高 BDP 下比 CUBIC 好），(4) 用并行连接放大有效吞吐，(5) 真正的批量传输考虑 QUIC 或基于 UDP 的协议。测量：`tc`、`ss -i`、`iperf3` 打基线。腾讯就是因为这种场景做了自研传输协议（如跨地域游戏流量）。

**标签：** #domain-knowledge

---

### 20. 实时多人游戏的反作弊

**难度：** 困难
**主题：** gaming, security, anti-cheat
**岗位：** 高级 SWE
**级别：** T3-T4

**问题：** 一款新的 PUBG Mobile 作弊工具广泛流传（自瞄 + 透视）。讲讲你如何架构反作弊以检测和应对。

**思路：** 多层：(1) **服务端权威**——绝不信客户端报告的伤害/位置；服务端做命中判定。透视需要*客户端*渲染本不该有的数据——通过可见性剔除不发送看不到的敌人数据来防。代价：服务端 CPU 更高。(2) **行为检测**——服务端 ML 分析瞄准轨迹、爆头率、反应时间；异常打标，人工或 ML review，影子封号。(3) **客户端完整性**——防篡改（代码混淆、原生 checksum、PC 端内核态反作弊）。检测已知作弊签名。(4) **举报 + 回放**——玩家举报触发服务端回放复审，部分由 ML 完成。(5) **软惩罚**——影子封号（让作弊者互相匹配）优先于硬封号（给作弊作者的迭代信号更少）。讨论假阳性代价（误封诚实玩家对留存灾难性）和反作弊与作弊者的永恒猫鼠游戏。

**标签：** #domain-knowledge

---

### 21. 网络延迟时间

**难度：** 中等
**主题：** graph, dijkstra, shortest-path
**岗位：** T2-3
**级别：** T2-T3

**问题：** 给定 `n` 个节点和带权有向边列表 `(u, v, w)` 表示信号传播时间，求从节点 `k` 出发使所有节点都收到信号的时间。若不可达返回 -1。

**思路：** 单源最短路径 → 带最小堆的 Dijkstra。建邻接表，松弛邻居，入堆。答案为所有节点距离的最大值；存在不可达即返回 -1。O((V + E) log V)。腾讯 IM 路由变体。

**Python：**
```python
import heapq

def network_delay_time(times: list[list[int]], n: int, k: int) -> int:
    graph: dict[int, list[tuple[int, int]]] = {i: [] for i in range(1, n + 1)}
    for u, v, w in times:
        graph[u].append((v, w))
    dist: dict[int, int] = {}
    heap: list[tuple[int, int]] = [(0, k)]
    while heap:
        d, u = heapq.heappop(heap)
        if u in dist:
            continue
        dist[u] = d
        for v, w in graph[u]:
            if v not in dist:
                heapq.heappush(heap, (d + w, v))
    return max(dist.values()) if len(dist) == n else -1
```

**TypeScript：**
```typescript
function networkDelayTime(times: number[][], n: number, k: number): number {
  const graph: Array<Array<[number, number]>> = Array.from({ length: n + 1 }, () => []);
  for (const [u, v, w] of times) graph[u].push([v, w]);
  const dist = new Map<number, number>();
  const heap: Array<[number, number]> = [[0, k]];
  while (heap.length) {
    heap.sort((a, b) => b[0] - a[0]);
    const [d, u] = heap.pop()!;
    if (dist.has(u)) continue;
    dist.set(u, d);
    for (const [v, w] of graph[u]) if (!dist.has(v)) heap.push([d + w, v]);
  }
  return dist.size === n ? Math.max(...dist.values()) : -1;
}
```

**Java：**
```java
int networkDelayTime(int[][] times, int n, int k) {
  List<List<int[]>> graph = new ArrayList<>();
  for (int i = 0; i <= n; i++) graph.add(new ArrayList<>());
  for (int[] e : times) graph.get(e[0]).add(new int[]{e[1], e[2]});
  Map<Integer, Integer> dist = new HashMap<>();
  PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> a[0] - b[0]);
  heap.offer(new int[]{0, k});
  while (!heap.isEmpty()) {
    int[] cur = heap.poll();
    int d = cur[0], u = cur[1];
    if (dist.containsKey(u)) continue;
    dist.put(u, d);
    for (int[] nb : graph.get(u)) if (!dist.containsKey(nb[0])) heap.offer(new int[]{d + nb[1], nb[0]});
  }
  if (dist.size() != n) return -1;
  int ans = 0;
  for (int v : dist.values()) ans = Math.max(ans, v);
  return ans;
}
```

**要点：**
- 弹出的节点若已在 `dist` 中则跳过，保证每个点只确定一次。
- 答案是所有节点最晚的到达时间。
- 不可达节点会让 `dist` 的大小小于 `n`，返回 -1。

**标签：** #algorithm

---

### 22. K 站中转内最便宜的航班

**难度：** 中等
**主题：** graph, bfs, dp, bellman-ford
**岗位：** T2-3
**级别：** T2-T3

**问题：** 给定 `n` 个城市、带权航班、起点 `src`、终点 `dst` 以及最多 `k` 站中转，返回最便宜价格（或 -1）。

**思路：** Bellman-Ford 限制 `k+1` 轮松弛——每轮前拷贝 `dist`，避免同轮多跳。O(k * E)。或 Dijkstra，状态 `(cost, node, stops_used)`，按 stops 剪枝。常见坑：原地修改距离会违反中转限制。

**Python：**
```python
def find_cheapest_price(n: int, flights: list[list[int]], src: int, dst: int, k: int) -> int:
    INF = float("inf")
    dist = [INF] * n
    dist[src] = 0
    for _ in range(k + 1):
        nxt = dist[:]
        for u, v, w in flights:
            if dist[u] + w < nxt[v]:
                nxt[v] = dist[u] + w
        dist = nxt
    return -1 if dist[dst] == INF else int(dist[dst])
```

**TypeScript：**
```typescript
function findCheapestPrice(n: number, flights: number[][], src: number, dst: number, k: number): number {
  let dist = new Array<number>(n).fill(Infinity);
  dist[src] = 0;
  for (let i = 0; i <= k; i++) {
    const next = dist.slice();
    for (const [u, v, w] of flights) {
      if (dist[u] + w < next[v]) next[v] = dist[u] + w;
    }
    dist = next;
  }
  return dist[dst] === Infinity ? -1 : dist[dst];
}
```

**Java：**
```java
int findCheapestPrice(int n, int[][] flights, int src, int dst, int k) {
  int[] dist = new int[n];
  Arrays.fill(dist, Integer.MAX_VALUE);
  dist[src] = 0;
  for (int i = 0; i <= k; i++) {
    int[] next = dist.clone();
    for (int[] f : flights) {
      if (dist[f[0]] != Integer.MAX_VALUE && dist[f[0]] + f[2] < next[f[1]]) {
        next[f[1]] = dist[f[0]] + f[2];
      }
    }
    dist = next;
  }
  return dist[dst] == Integer.MAX_VALUE ? -1 : dist[dst];
}
```

**要点：**
- 每轮基于上一轮快照松弛，确保单轮只走一跳。
- `k + 1` 轮松弛对应最多 `k` 个中转。
- 原地修改 `dist` 会在一轮内累计多跳，违反约束。

**标签：** #algorithm

---

### 23. 概率最大的路径

**难度：** 中等
**主题：** graph, dijkstra, shortest-path
**岗位：** T2-3
**级别：** T2-T3

**问题：** 给定无向图，每条边有成功概率，求 `start` 到 `end` 概率最大的路径。

**思路：** Dijkstra 变体，用最大堆，乘概率（或转 `-log(p)` 化为标准最小代价最短路）。维护 `prob[node]`，松弛 `prob[v] = max(prob[v], prob[u] * w)`。O((V + E) log V)。

**Python：**
```python
import heapq

def max_probability(n: int, edges: list[list[int]], succ_prob: list[float], start: int, end: int) -> float:
    graph: list[list[tuple[int, float]]] = [[] for _ in range(n)]
    for (u, v), p in zip(edges, succ_prob):
        graph[u].append((v, p))
        graph[v].append((u, p))
    best = [0.0] * n
    best[start] = 1.0
    heap: list[tuple[float, int]] = [(-1.0, start)]  # negate for max-heap
    while heap:
        neg, u = heapq.heappop(heap)
        if u == end:
            return -neg
        if -neg < best[u]:
            continue
        for v, p in graph[u]:
            nb = -neg * p
            if nb > best[v]:
                best[v] = nb
                heapq.heappush(heap, (-nb, v))
    return 0.0
```

**TypeScript：**
```typescript
function maxProbability(n: number, edges: number[][], succProb: number[], start: number, end: number): number {
  const graph: Array<Array<[number, number]>> = Array.from({ length: n }, () => []);
  edges.forEach(([u, v], i) => { graph[u].push([v, succProb[i]]); graph[v].push([u, succProb[i]]); });
  const best = new Array(n).fill(0);
  best[start] = 1;
  const heap: Array<[number, number]> = [[1, start]];
  while (heap.length) {
    heap.sort((a, b) => a[0] - b[0]);
    const [p, u] = heap.pop()!;
    if (u === end) return p;
    if (p < best[u]) continue;
    for (const [v, w] of graph[u]) {
      const np = p * w;
      if (np > best[v]) { best[v] = np; heap.push([np, v]); }
    }
  }
  return 0;
}
```

**Java：**
```java
double maxProbability(int n, int[][] edges, double[] succProb, int start, int end) {
  List<List<double[]>> graph = new ArrayList<>();
  for (int i = 0; i < n; i++) graph.add(new ArrayList<>());
  for (int i = 0; i < edges.length; i++) {
    graph.get(edges[i][0]).add(new double[]{edges[i][1], succProb[i]});
    graph.get(edges[i][1]).add(new double[]{edges[i][0], succProb[i]});
  }
  double[] best = new double[n];
  best[start] = 1.0;
  PriorityQueue<double[]> heap = new PriorityQueue<>((a, b) -> Double.compare(b[0], a[0]));
  heap.offer(new double[]{1.0, start});
  while (!heap.isEmpty()) {
    double[] cur = heap.poll();
    double p = cur[0]; int u = (int) cur[1];
    if (u == end) return p;
    if (p < best[u]) continue;
    for (double[] nb : graph.get(u)) {
      double np = p * nb[1];
      if (np > best[(int) nb[0]]) { best[(int) nb[0]] = np; heap.offer(new double[]{np, nb[0]}); }
    }
  }
  return 0.0;
}
```

**要点：**
- 概率取负数即可用最小堆模拟最大堆。
- 概率始终在 [0, 1]，相乘即可，无需对数转换。
- Dijkstra 按最优顺序确定节点，弹出 `end` 时可直接返回。

**标签：** #algorithm

---

### 24. 最低加油次数

**难度：** 困难
**主题：** greedy, heap, dp
**岗位：** T3-1
**级别：** T3-T4

**问题：** 汽车初始油量 `startFuel`，目标位置 `target`。途中加油站 `stations[i] = [position, liters]`。返回到达目标的最少加油次数（或 -1）。

**思路：** 贪心 + 最大堆。尽量往前开；当无法到达下一站/终点时，从已经经过的加油站中弹出油量最多的（弹最大堆顶）加油。计数加一。O(n log n)。也可 DP 按站数转移，但堆解更清晰。

**Python：**
```python
import heapq

def min_refuel_stops(target: int, start_fuel: int, stations: list[list[int]]) -> int:
    heap: list[int] = []  # negated liters
    fuel, i, stops = start_fuel, 0, 0
    while fuel < target:
        while i < len(stations) and stations[i][0] <= fuel:
            heapq.heappush(heap, -stations[i][1])
            i += 1
        if not heap:
            return -1
        fuel += -heapq.heappop(heap)
        stops += 1
    return stops
```

**TypeScript：**
```typescript
function minRefuelStops(target: number, startFuel: number, stations: number[][]): number {
  const heap: number[] = [];  // negated liters
  let fuel = startFuel, i = 0, stops = 0;
  while (fuel < target) {
    while (i < stations.length && stations[i][0] <= fuel) {
      heap.push(-stations[i][1]);
      heap.sort((a, b) => a - b);
      i++;
    }
    if (heap.length === 0) return -1;
    fuel += -heap.shift()!;
    stops++;
  }
  return stops;
}
```

**Java：**
```java
int minRefuelStops(int target, int startFuel, int[][] stations) {
  PriorityQueue<Integer> heap = new PriorityQueue<>(Comparator.reverseOrder());
  long fuel = startFuel;
  int i = 0, stops = 0;
  while (fuel < target) {
    while (i < stations.length && stations[i][0] <= fuel) heap.offer(stations[i++][1]);
    if (heap.isEmpty()) return -1;
    fuel += heap.poll();
    stops++;
  }
  return stops;
}
```

**要点：**
- 把已经经过的加油站当作"油料储备"，没油时再取。
- 每次取储备中油量最多的，使单次加油的行程增量最大化。
- 假设加油站按位置升序；否则先排序。

**标签：** #algorithm

---

### 25. 公交路线

**难度：** 困难
**主题：** graph, bfs
**岗位：** T3-1
**级别：** T3

**问题：** 给定 `routes[i]` 表示第 `i` 路公交所经停的站点，返回从 `source` 到 `target` 最少需要乘几趟公交。

**思路：** 以*公交*而非站点为节点做 BFS。建 `stop → buses[]` 映射。队列保存公交；访问公交即访问其所有站点；每个未访问站点把它经过的其他公交入队。标记公交（不是站点）已访问。O(N * S)，N 为公交数，S 为平均站点数。

**Python：**
```python
from collections import deque, defaultdict

def num_buses_to_destination(routes: list[list[int]], source: int, target: int) -> int:
    if source == target:
        return 0
    stop_to_buses: dict[int, list[int]] = defaultdict(list)
    for i, route in enumerate(routes):
        for s in route:
            stop_to_buses[s].append(i)
    visited_buses: set[int] = set()
    visited_stops: set[int] = {source}
    q: deque[tuple[int, int]] = deque([(source, 0)])
    while q:
        stop, taken = q.popleft()
        for bus in stop_to_buses[stop]:
            if bus in visited_buses:
                continue
            visited_buses.add(bus)
            for nxt in routes[bus]:
                if nxt == target:
                    return taken + 1
                if nxt not in visited_stops:
                    visited_stops.add(nxt)
                    q.append((nxt, taken + 1))
    return -1
```

**TypeScript：**
```typescript
function numBusesToDestination(routes: number[][], source: number, target: number): number {
  if (source === target) return 0;
  const stopToBuses = new Map<number, number[]>();
  routes.forEach((route, i) => route.forEach(s => {
    if (!stopToBuses.has(s)) stopToBuses.set(s, []);
    stopToBuses.get(s)!.push(i);
  }));
  const seenBuses = new Set<number>(), seenStops = new Set<number>([source]);
  const q: Array<[number, number]> = [[source, 0]];
  while (q.length) {
    const [stop, taken] = q.shift()!;
    for (const bus of stopToBuses.get(stop) ?? []) {
      if (seenBuses.has(bus)) continue;
      seenBuses.add(bus);
      for (const nxt of routes[bus]) {
        if (nxt === target) return taken + 1;
        if (!seenStops.has(nxt)) { seenStops.add(nxt); q.push([nxt, taken + 1]); }
      }
    }
  }
  return -1;
}
```

**Java：**
```java
int numBusesToDestination(int[][] routes, int source, int target) {
  if (source == target) return 0;
  Map<Integer, List<Integer>> stopToBuses = new HashMap<>();
  for (int i = 0; i < routes.length; i++)
    for (int s : routes[i]) stopToBuses.computeIfAbsent(s, k -> new ArrayList<>()).add(i);
  Set<Integer> seenBuses = new HashSet<>(), seenStops = new HashSet<>();
  seenStops.add(source);
  Deque<int[]> q = new ArrayDeque<>();
  q.offer(new int[]{source, 0});
  while (!q.isEmpty()) {
    int[] cur = q.poll();
    int stop = cur[0], taken = cur[1];
    for (int bus : stopToBuses.getOrDefault(stop, List.of())) {
      if (!seenBuses.add(bus)) continue;
      for (int nxt : routes[bus]) {
        if (nxt == target) return taken + 1;
        if (seenStops.add(nxt)) q.offer(new int[]{nxt, taken + 1});
      }
    }
  }
  return -1;
}
```

**要点：**
- 标记公交（而非仅站点）避免重复展开整条线路。
- BFS 自然给出最少换乘次数。
- 起点等于终点需特判返回 0。

**标签：** #algorithm

---

### 26. 网络中的关键连接

**难度：** 困难
**主题：** graph, dfs, tarjan, bridges
**岗位：** T3-1
**级别：** T3-T4

**问题：** 给定 `n` 个服务器的无向网络和连接，返回所有关键连接（桥）——移除即会断开某些服务器的连接。

**思路：** Tarjan 求桥 DFS。维护 `disc[u]`（发现时间）和 `low[u]`（可达最浅祖先）。边 `(u, v)` 是桥当且仅当 `low[v] > disc[u]`。跳过父边。O(V + E)。腾讯基础设施/网络岗最爱。

**Python：**
```python
def critical_connections(n: int, connections: list[list[int]]) -> list[list[int]]:
    graph: list[list[int]] = [[] for _ in range(n)]
    for u, v in connections:
        graph[u].append(v)
        graph[v].append(u)
    disc = [-1] * n
    low = [0] * n
    bridges: list[list[int]] = []
    timer = 0
    def dfs(u: int, parent: int) -> None:
        nonlocal timer
        disc[u] = low[u] = timer
        timer += 1
        for v in graph[u]:
            if disc[v] == -1:
                dfs(v, u)
                low[u] = min(low[u], low[v])
                if low[v] > disc[u]:
                    bridges.append([u, v])
            elif v != parent:
                low[u] = min(low[u], disc[v])
    dfs(0, -1)
    return bridges
```

**TypeScript：**
```typescript
function criticalConnections(n: number, connections: number[][]): number[][] {
  const graph: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of connections) { graph[u].push(v); graph[v].push(u); }
  const disc = new Array(n).fill(-1), low = new Array(n).fill(0);
  const bridges: number[][] = [];
  let timer = 0;
  const dfs = (u: number, parent: number): void => {
    disc[u] = low[u] = timer++;
    for (const v of graph[u]) {
      if (disc[v] === -1) {
        dfs(v, u);
        low[u] = Math.min(low[u], low[v]);
        if (low[v] > disc[u]) bridges.push([u, v]);
      } else if (v !== parent) {
        low[u] = Math.min(low[u], disc[v]);
      }
    }
  };
  dfs(0, -1);
  return bridges;
}
```

**Java：**
```java
int timer = 0;
int[] disc, low;
List<List<Integer>> bridges;
List<List<Integer>> graphCC;

List<List<Integer>> criticalConnections(int n, List<List<Integer>> connections) {
  graphCC = new ArrayList<>();
  for (int i = 0; i < n; i++) graphCC.add(new ArrayList<>());
  for (List<Integer> e : connections) { graphCC.get(e.get(0)).add(e.get(1)); graphCC.get(e.get(1)).add(e.get(0)); }
  disc = new int[n]; low = new int[n];
  Arrays.fill(disc, -1);
  bridges = new ArrayList<>();
  dfsBridge(0, -1);
  return bridges;
}

void dfsBridge(int u, int parent) {
  disc[u] = low[u] = timer++;
  for (int v : graphCC.get(u)) {
    if (disc[v] == -1) {
      dfsBridge(v, u);
      low[u] = Math.min(low[u], low[v]);
      if (low[v] > disc[u]) bridges.add(List.of(u, v));
    } else if (v != parent) {
      low[u] = Math.min(low[u], disc[v]);
    }
  }
}
```

**要点：**
- `low[v] > disc[u]` 表示 v 子树无法绕开 (u, v) 这条边回到 u。
- 跳过直接父节点，避免把无向边误判为反向边。
- 图很深时需要改写成迭代版以避免爆栈。

**标签：** #algorithm

---

### 27. 无向图中连通分量的数目

**难度：** 中等
**主题：** graph, union-find, dfs
**岗位：** T2-3
**级别：** T2-T3

**问题：** 给定 `n` 个节点和边列表，返回连通分量数。

**思路：** 并查集 + 路径压缩 + 按秩合并。每条边 → 合并。统计不同根数。O(E α(N)) ≈ O(E)。或从每个未访问节点 DFS/BFS，统计起点数。好友关系特性的基础组件。

**Python：**
```python
def count_components(n: int, edges: list[list[int]]) -> int:
    parent = list(range(n))
    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    comps = n
    for u, v in edges:
        ru, rv = find(u), find(v)
        if ru != rv:
            parent[ru] = rv
            comps -= 1
    return comps
```

**TypeScript：**
```typescript
function countComponents(n: number, edges: number[][]): number {
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  };
  let comps = n;
  for (const [u, v] of edges) {
    const ru = find(u), rv = find(v);
    if (ru !== rv) { parent[ru] = rv; comps--; }
  }
  return comps;
}
```

**Java：**
```java
int[] parentUF;

int countComponents(int n, int[][] edges) {
  parentUF = new int[n];
  for (int i = 0; i < n; i++) parentUF[i] = i;
  int comps = n;
  for (int[] e : edges) {
    int ru = findUF(e[0]), rv = findUF(e[1]);
    if (ru != rv) { parentUF[ru] = rv; comps--; }
  }
  return comps;
}

int findUF(int x) {
  while (parentUF[x] != x) { parentUF[x] = parentUF[parentUF[x]]; x = parentUF[x]; }
  return x;
}
```

**要点：**
- 初始每个点独立，每次成功合并组件数减 1。
- 路径压缩使平均复杂度接近 O(α(n))。
- 按秩合并可选，对极端输入更稳健。

**标签：** #algorithm

---

### 28. 省份数量（朋友圈）

**难度：** 中等
**主题：** graph, union-find, dfs
**岗位：** T2-3
**级别：** T2-T3

**问题：** 给定 `n x n` 邻接矩阵 `isConnected`，`isConnected[i][j] = 1` 表示城市 `i` 与 `j` 直连，返回省份数（连通分量数）。

**思路：** 并查集或按行 DFS：每遇到未访问城市，DFS 所有可达城市，省份数 +1。O(n^2)。微信朋友圈直接对应——腾讯爱这个包装。

**Python：**
```python
def find_circle_num(is_connected: list[list[int]]) -> int:
    n = len(is_connected)
    visited = [False] * n
    def dfs(u: int) -> None:
        visited[u] = True
        for v in range(n):
            if is_connected[u][v] and not visited[v]:
                dfs(v)
    provinces = 0
    for i in range(n):
        if not visited[i]:
            dfs(i)
            provinces += 1
    return provinces
```

**TypeScript：**
```typescript
function findCircleNum(isConnected: number[][]): number {
  const n = isConnected.length;
  const visited = new Array<boolean>(n).fill(false);
  const dfs = (u: number): void => {
    visited[u] = true;
    for (let v = 0; v < n; v++) {
      if (isConnected[u][v] && !visited[v]) dfs(v);
    }
  };
  let provinces = 0;
  for (let i = 0; i < n; i++) {
    if (!visited[i]) { dfs(i); provinces++; }
  }
  return provinces;
}
```

**Java：**
```java
int findCircleNum(int[][] isConnected) {
  int n = isConnected.length;
  boolean[] visited = new boolean[n];
  int provinces = 0;
  for (int i = 0; i < n; i++) {
    if (!visited[i]) { dfsProv(isConnected, visited, i); provinces++; }
  }
  return provinces;
}

void dfsProv(int[][] m, boolean[] visited, int u) {
  visited[u] = true;
  for (int v = 0; v < m.length; v++) {
    if (m[u][v] == 1 && !visited[v]) dfsProv(m, visited, v);
  }
}
```

**要点：**
- 每次 DFS 启动即一个新省份。
- 邻接矩阵对称，无需特别处理反向。
- 流式增量加好友时，并查集写法更合适。

**标签：** #algorithm

---

### 29. 冗余连接

**难度：** 中等
**主题：** graph, union-find, cycle
**岗位：** T2-3
**级别：** T2-T3

**问题：** 一棵 `n` 节点的树被加了多余的一条边，形成环。返回可以删除使其重新成树的边。若有多个，返回出现最晚的那条。

**思路：** 按序处理边，合并端点。首条端点已在同根中的边即答案。O(n α(n))。经典并查集应用。

**Python：**
```python
def find_redundant_connection(edges: list[list[int]]) -> list[int]:
    parent = list(range(len(edges) + 1))
    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    for u, v in edges:
        ru, rv = find(u), find(v)
        if ru == rv:
            return [u, v]
        parent[ru] = rv
    return []
```

**TypeScript：**
```typescript
function findRedundantConnection(edges: number[][]): number[] {
  const parent = Array.from({ length: edges.length + 1 }, (_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  };
  for (const [u, v] of edges) {
    const ru = find(u), rv = find(v);
    if (ru === rv) return [u, v];
    parent[ru] = rv;
  }
  return [];
}
```

**Java：**
```java
int[] parRC;

int[] findRedundantConnection(int[][] edges) {
  parRC = new int[edges.length + 1];
  for (int i = 0; i < parRC.length; i++) parRC[i] = i;
  for (int[] e : edges) {
    int ru = findRC(e[0]), rv = findRC(e[1]);
    if (ru == rv) return e;
    parRC[ru] = rv;
  }
  return new int[0];
}

int findRC(int x) {
  while (parRC[x] != x) { parRC[x] = parRC[parRC[x]]; x = parRC[x]; }
  return x;
}
```

**要点：**
- 按输入顺序处理边，首条成环的边即答案。
- 路径压缩使每次 `find` 近乎常数时间。
- 自然返回出现最晚的成环边，满足题目并列要求。

**标签：** #algorithm

---

### 30. 课程表

**难度：** 中等
**主题：** graph, topological-sort, dfs, bfs
**岗位：** T2-3
**级别：** T2-T3

**问题：** 给定 `numCourses` 和先修对 `[a, b]`（学 `a` 前先学 `b`），判断能否完成全部课程。

**思路：** 有向图环检测。BFS Kahn 算法：算入度，入度为 0 的入队，弹出后邻居入度减一。处理数 = `numCourses` 即无环。或 DFS 三色法（白/灰/黑）。O(V + E)。

**Python：**
```python
from collections import deque

def can_finish(num_courses: int, prerequisites: list[list[int]]) -> bool:
    graph: list[list[int]] = [[] for _ in range(num_courses)]
    indeg = [0] * num_courses
    for a, b in prerequisites:
        graph[b].append(a)
        indeg[a] += 1
    q: deque[int] = deque(i for i in range(num_courses) if indeg[i] == 0)
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
  const indeg = new Array<number>(numCourses).fill(0);
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
  for (int[] p : prerequisites) { graph.get(p[1]).add(p[0]); indeg[p[0]]++; }
  Deque<Integer> q = new ArrayDeque<>();
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
- 存在环时部分节点入度永远不为 0，`done < numCourses`。
- 边 `b -> a` 表示 b 是 a 的先修。
- 同样的骨架可直接输出拓扑序。

**标签：** #algorithm

---

### 31. 课程表 II

**难度：** 中等
**主题：** graph, topological-sort
**岗位：** T2-3
**级别：** T2-T3

**问题：** 与课程表相同，但返回一种可行的修课顺序，无解则空数组。

**思路：** Kahn 拓扑排序：从入度 0 节点 BFS，弹出顺序加入结果。若 `order.size() != numCourses`，存在环 → 返回 `[]`。O(V + E)。说明任意可行序均可，非唯一。

**Python：**
```python
from collections import deque

def find_order(num_courses: int, prerequisites: list[list[int]]) -> list[int]:
    graph: list[list[int]] = [[] for _ in range(num_courses)]
    indeg = [0] * num_courses
    for a, b in prerequisites:
        graph[b].append(a)
        indeg[a] += 1
    q: deque[int] = deque(i for i in range(num_courses) if indeg[i] == 0)
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
  const indeg = new Array<number>(numCourses).fill(0);
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
  for (int[] p : prerequisites) { graph.get(p[1]).add(p[0]); indeg[p[0]]++; }
  Deque<Integer> q = new ArrayDeque<>();
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
- 弹出顺序即为一种合法拓扑序，结果不唯一。
- 仍通过处理节点数判定是否存在环。
- 需要字典序最小时改用优先队列。

**标签：** #algorithm

---

### 32. 火星词典

**难度：** 困难
**主题：** graph, topological-sort, strings
**岗位：** T3-1
**级别：** T3

**问题：** 给定按未知字母序排列的单词列表，推出一个合法字符序。若无解或矛盾（如 `["abc","ab"]`）返回空串。

**思路：** 相邻单词首个不同字符建有向图。拓扑排序。边界：前缀冲突（`["abc","ab"]` 非法）、推得图存在环。O(总字符数)。腾讯爱出——解析 + 拓扑结合。

**Python：**
```python
from collections import defaultdict, deque

def alien_order(words: list[str]) -> str:
    graph: dict[str, set[str]] = defaultdict(set)
    indeg: dict[str, int] = {c: 0 for w in words for c in w}
    for a, b in zip(words, words[1:]):
        for x, y in zip(a, b):
            if x != y:
                if y not in graph[x]:
                    graph[x].add(y)
                    indeg[y] += 1
                break
        else:
            if len(a) > len(b):
                return ""
    q: deque[str] = deque(c for c, d in indeg.items() if d == 0)
    out: list[str] = []
    while q:
        c = q.popleft()
        out.append(c)
        for nxt in graph[c]:
            indeg[nxt] -= 1
            if indeg[nxt] == 0:
                q.append(nxt)
    return "".join(out) if len(out) == len(indeg) else ""
```

**TypeScript：**
```typescript
function alienOrder(words: string[]): string {
  const graph = new Map<string, Set<string>>();
  const indeg = new Map<string, number>();
  for (const w of words) for (const c of w) { if (!indeg.has(c)) { indeg.set(c, 0); graph.set(c, new Set()); } }
  for (let i = 0; i + 1 < words.length; i++) {
    const a = words[i], b = words[i + 1];
    let found = false;
    const m = Math.min(a.length, b.length);
    for (let j = 0; j < m; j++) {
      if (a[j] !== b[j]) {
        if (!graph.get(a[j])!.has(b[j])) { graph.get(a[j])!.add(b[j]); indeg.set(b[j], indeg.get(b[j])! + 1); }
        found = true; break;
      }
    }
    if (!found && a.length > b.length) return "";
  }
  const q: string[] = [];
  indeg.forEach((d, c) => { if (d === 0) q.push(c); });
  const out: string[] = [];
  while (q.length) {
    const c = q.shift()!;
    out.push(c);
    for (const nxt of graph.get(c)!) {
      indeg.set(nxt, indeg.get(nxt)! - 1);
      if (indeg.get(nxt) === 0) q.push(nxt);
    }
  }
  return out.length === indeg.size ? out.join("") : "";
}
```

**Java：**
```java
String alienOrder(String[] words) {
  Map<Character, Set<Character>> graph = new HashMap<>();
  Map<Character, Integer> indeg = new HashMap<>();
  for (String w : words) for (char c : w.toCharArray()) { indeg.putIfAbsent(c, 0); graph.putIfAbsent(c, new HashSet<>()); }
  for (int i = 0; i + 1 < words.length; i++) {
    String a = words[i], b = words[i + 1];
    boolean found = false;
    int m = Math.min(a.length(), b.length());
    for (int j = 0; j < m; j++) {
      if (a.charAt(j) != b.charAt(j)) {
        if (graph.get(a.charAt(j)).add(b.charAt(j))) indeg.merge(b.charAt(j), 1, Integer::sum);
        found = true; break;
      }
    }
    if (!found && a.length() > b.length()) return "";
  }
  Deque<Character> q = new ArrayDeque<>();
  indeg.forEach((c, d) -> { if (d == 0) q.offer(c); });
  StringBuilder out = new StringBuilder();
  while (!q.isEmpty()) {
    char c = q.poll();
    out.append(c);
    for (char nxt : graph.get(c)) if (indeg.merge(nxt, -1, Integer::sum) == 0) q.offer(nxt);
  }
  return out.length() == indeg.size() ? out.toString() : "";
}
```

**要点：**
- 仅相邻两词的首个不同字符产生一条有向边。
- 前缀冲突（`"abc"` 在 `"ab"` 之前）属非法，返回 `""`。
- 派生图中存在环时同样返回 `""`。

**标签：** #algorithm

---

### 33. 石子游戏

**难度：** 中等
**主题：** dp, game-theory, minimax
**岗位：** T2-3
**级别：** T2-T3

**问题：** 偶数长石堆数组。两人轮流拿最左或最右一堆。双方都最优，先手是否必胜？

**思路：** DP `dp[i][j] = max(piles[i] - dp[i+1][j], piles[j] - dp[i][j-1])`，表示当前玩家在 `piles[i..j]` 上能取得的最优分差。答案：`dp[0][n-1] > 0`。O(n^2) 时间/空间。脑筋急转弯答案：偶数 n 且总和为偶时恒为 true，但面试官想看 DP。

**Python：**
```python
def stone_game(piles: list[int]) -> bool:
    n = len(piles)
    dp = [row[:] for row in [[0] * n] * n]
    for i in range(n):
        dp[i][i] = piles[i]
    for length in range(2, n + 1):
        for i in range(n - length + 1):
            j = i + length - 1
            dp[i][j] = max(piles[i] - dp[i + 1][j], piles[j] - dp[i][j - 1])
    return dp[0][n - 1] > 0
```

**TypeScript：**
```typescript
function stoneGame(piles: number[]): boolean {
  const n = piles.length;
  const dp: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) dp[i][i] = piles[i];
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      dp[i][j] = Math.max(piles[i] - dp[i + 1][j], piles[j] - dp[i][j - 1]);
    }
  }
  return dp[0][n - 1] > 0;
}
```

**Java：**
```java
boolean stoneGame(int[] piles) {
  int n = piles.length;
  int[][] dp = new int[n][n];
  for (int i = 0; i < n; i++) dp[i][i] = piles[i];
  for (int len = 2; len <= n; len++) {
    for (int i = 0; i + len - 1 < n; i++) {
      int j = i + len - 1;
      dp[i][j] = Math.max(piles[i] - dp[i + 1][j], piles[j] - dp[i][j - 1]);
    }
  }
  return dp[0][n - 1] > 0;
}
```

**要点：**
- `dp[i][j]` 表示当前先手在该区间上能稳取的最大分差。
- 按区间长度填表，保证子区间已就绪。
- 递推中的减号已经隐含了对手也最优行动。

**标签：** #algorithm

---

### 34. Nim 游戏

**难度：** 简单
**主题：** game-theory, math
**岗位：** T2-3
**级别：** T2-T3

**问题：** `n` 颗石头，每人每轮拿 1、2 或 3 颗，拿到最后一颗者胜。你先手——能否必胜？

**思路：** 必败位为 `n % 4 == 0`。面对 4 的倍数者最优下必败（对手镜像维持你处于 4 的倍数）。O(1)。准备好归纳证明。

**Python：**
```python
def can_win_nim(n: int) -> bool:
    return n % 4 != 0
```

**TypeScript：**
```typescript
function canWinNim(n: number): boolean {
  return n % 4 !== 0;
}
```

**Java：**
```java
boolean canWinNim(int n) {
  return n % 4 != 0;
}
```

**要点：**
- 4 的倍数为必败位，其余皆必胜。
- 镜像策略：对方总用 `4 - 你拿数` 让你始终停留在 4 的倍数。
- 归纳证明：任意非 4 倍数都能一步走到 4 的倍数。

**标签：** #algorithm

---

### 35. 预测赢家

**难度：** 中等
**主题：** dp, game-theory, minimax, recursion
**岗位：** T2-3
**级别：** T2-T3

**问题：** 给定分数数组，两人轮流从两端取数。最优策略下玩家 1 是否能赢或平。

**思路：** 与石子游戏同 DP：`dp[i][j]` = 当前玩家在 `nums[i..j]` 上能取得的最大分差。自顶向下记忆化也可。O(n^2)。答案：`dp[0][n-1] >= 0`。腾讯变体：问如何用 1D 滚动数组优化到 O(n)。

**Python：**
```python
def predict_the_winner(nums: list[int]) -> bool:
    n = len(nums)
    dp = nums[:]  # dp[i] for current j; init j=i
    for i in range(n - 2, -1, -1):
        for j in range(i + 1, n):
            dp[j] = max(nums[i] - dp[j], nums[j] - dp[j - 1])
    return dp[n - 1] >= 0
```

**TypeScript：**
```typescript
function PredictTheWinner(nums: number[]): boolean {
  const n = nums.length;
  const dp = nums.slice();
  for (let i = n - 2; i >= 0; i--) {
    for (let j = i + 1; j < n; j++) {
      dp[j] = Math.max(nums[i] - dp[j], nums[j] - dp[j - 1]);
    }
  }
  return dp[n - 1] >= 0;
}
```

**Java：**
```java
boolean predictTheWinner(int[] nums) {
  int n = nums.length;
  int[] dp = nums.clone();
  for (int i = n - 2; i >= 0; i--) {
    for (int j = i + 1; j < n; j++) {
      dp[j] = Math.max(nums[i] - dp[j], nums[j] - dp[j - 1]);
    }
  }
  return dp[n - 1] >= 0;
}
```

**要点：**
- `dp[i][j]` 仅依赖 `dp[i+1][j]` 与 `dp[i][j-1]`，可压成 1D。
- 初始化 `dp[j] = nums[j]` 表示 `i == j` 的基线。
- 平局也算先手获胜，所以判定 `>= 0`。

**标签：** #algorithm

---

### 36. 我能赢吗

**难度：** 中等
**主题：** dp, game-theory, bitmask, memoization
**岗位：** T3-1
**级别：** T3

**问题：** 数字 1..`maxChoosableInteger`，不放回，两人轮流取；先使累计和 ≥ `desiredTotal` 者胜。判断先手是否必胜。

**思路：** 状压 DP（`maxChoosable ≤ 20`）。记忆化 `state → win/lose`。对每个未选数：若选了立即赢，或对手在新状态必败，则当前胜。边界：总和 < 目标即不可能（返回 false）。O(2^n * n)。

**Python：**
```python
from functools import lru_cache

def can_i_win(max_choosable: int, desired_total: int) -> bool:
    if max_choosable * (max_choosable + 1) // 2 < desired_total:
        return False
    @lru_cache(maxsize=None)
    def win(state: int, remaining: int) -> bool:
        for i in range(1, max_choosable + 1):
            bit = 1 << (i - 1)
            if state & bit:
                continue
            if i >= remaining or not win(state | bit, remaining - i):
                return True
        return False
    return win(0, desired_total)
```

**TypeScript：**
```typescript
function canIWin(maxChoosable: number, desiredTotal: number): boolean {
  if ((maxChoosable * (maxChoosable + 1)) / 2 < desiredTotal) return false;
  const memo = new Map<number, boolean>();
  const win = (state: number, remaining: number): boolean => {
    if (memo.has(state)) return memo.get(state)!;
    for (let i = 1; i <= maxChoosable; i++) {
      const bit = 1 << (i - 1);
      if (state & bit) continue;
      if (i >= remaining || !win(state | bit, remaining - i)) {
        memo.set(state, true); return true;
      }
    }
    memo.set(state, false); return false;
  };
  return win(0, desiredTotal);
}
```

**Java：**
```java
Map<Integer, Boolean> memoCIW;
int maxChoosableCIW;

boolean canIWin(int maxChoosable, int desiredTotal) {
  if (maxChoosable * (maxChoosable + 1) / 2 < desiredTotal) return false;
  memoCIW = new HashMap<>();
  maxChoosableCIW = maxChoosable;
  return winCIW(0, desiredTotal);
}

boolean winCIW(int state, int remaining) {
  if (memoCIW.containsKey(state)) return memoCIW.get(state);
  for (int i = 1; i <= maxChoosableCIW; i++) {
    int bit = 1 << (i - 1);
    if ((state & bit) != 0) continue;
    if (i >= remaining || !winCIW(state | bit, remaining - i)) {
      memoCIW.put(state, true); return true;
    }
  }
  memoCIW.put(state, false); return false;
}
```

**要点：**
- 位掩码表示已选数集合，`n ≤ 20` 时可放入一个 int。
- 仅以 `state` 为键记忆，`remaining` 由 `state` 唯一决定。
- 早返：当所有数之和小于目标时直接判负。

**标签：** #algorithm

---

### 37. 翻转游戏 II

**难度：** 中等
**主题：** game-theory, dp, memoization, sprague-grundy
**岗位：** T3-1
**级别：** T3

**问题：** 由 `+`、`-` 组成的字符串。每次将相邻 `++` 翻成 `--`。判断先手是否必胜。

**思路：** 在字符串状态上递归 + 记忆化。对每个 `++` 位置，翻转后递归对手——对手败则当前胜。可用 Sprague-Grundy 定理（独立连续段 Grundy 数异或）优化到 O(n^2)。无 SG 最坏指数级。

**Python：**
```python
def can_win(s: str) -> bool:
    memo: dict[str, bool] = {}
    def go(state: str) -> bool:
        if state in memo:
            return memo[state]
        for i in range(len(state) - 1):
            if state[i:i + 2] == "++":
                nxt = state[:i] + "--" + state[i + 2:]
                if not go(nxt):
                    memo[state] = True
                    return True
        memo[state] = False
        return False
    return go(s)
```

**TypeScript：**
```typescript
function canWin(s: string): boolean {
  const memo = new Map<string, boolean>();
  const go = (state: string): boolean => {
    if (memo.has(state)) return memo.get(state)!;
    for (let i = 0; i + 1 < state.length; i++) {
      if (state[i] === "+" && state[i + 1] === "+") {
        const nxt = state.slice(0, i) + "--" + state.slice(i + 2);
        if (!go(nxt)) { memo.set(state, true); return true; }
      }
    }
    memo.set(state, false); return false;
  };
  return go(s);
}
```

**Java：**
```java
Map<String, Boolean> memoFG = new HashMap<>();

boolean canWin(String s) {
  if (memoFG.containsKey(s)) return memoFG.get(s);
  for (int i = 0; i + 1 < s.length(); i++) {
    if (s.charAt(i) == '+' && s.charAt(i + 1) == '+') {
      String nxt = s.substring(0, i) + "--" + s.substring(i + 2);
      if (!canWin(nxt)) { memoFG.put(s, true); return true; }
    }
  }
  memoFG.put(s, false); return false;
}
```

**要点：**
- 当前玩家只要能让对手陷入必败态即胜。
- 按字符串状态记忆化，避免重复计算同形局面。
- Grundy 数把独立段压成 O(n^2)，但记忆化版本更直观。

**标签：** #algorithm

---

### 38. 猜数字大小 II

**难度：** 中等
**主题：** dp, minimax, game-theory
**岗位：** T3-1
**级别：** T3

**问题：** 选 1..n 中一数。每次猜 `x` 花 `$x`；猜错被告知大小直到猜中。返回保证胜出所需的最少金额（最坏情况）。

**思路：** Minimax DP。`dp[i][j]` = 区间 `[i, j]` 的最低保证花费。枚举每个 `k` 作猜测：`cost(k) = k + max(dp[i][k-1], dp[k+1][j])`，取 min。O(n^3)。区间 DP，按长度填表。

**Python：**
```python
def get_money_amount(n: int) -> int:
    dp = [[0] * (n + 2) for _ in range(n + 2)]
    for length in range(2, n + 1):
        for i in range(1, n - length + 2):
            j = i + length - 1
            dp[i][j] = min(k + max(dp[i][k - 1], dp[k + 1][j]) for k in range(i, j))
    return dp[1][n]
```

**TypeScript：**
```typescript
function getMoneyAmount(n: number): number {
  const dp: number[][] = Array.from({ length: n + 2 }, () => new Array(n + 2).fill(0));
  for (let len = 2; len <= n; len++) {
    for (let i = 1; i + len - 1 <= n; i++) {
      const j = i + len - 1;
      let best = Infinity;
      for (let k = i; k < j; k++) {
        best = Math.min(best, k + Math.max(dp[i][k - 1], dp[k + 1][j]));
      }
      dp[i][j] = best;
    }
  }
  return dp[1][n];
}
```

**Java：**
```java
int getMoneyAmount(int n) {
  int[][] dp = new int[n + 2][n + 2];
  for (int len = 2; len <= n; len++) {
    for (int i = 1; i + len - 1 <= n; i++) {
      int j = i + len - 1;
      int best = Integer.MAX_VALUE;
      for (int k = i; k < j; k++) {
        best = Math.min(best, k + Math.max(dp[i][k - 1], dp[k + 1][j]));
      }
      dp[i][j] = best;
    }
  }
  return dp[1][n];
}
```

**要点：**
- 最坏情况博弈：对方（隐藏数）总挑代价更高的一侧。
- 按区间长度递增填表，先备齐子区间。
- 下标使用 1-based 以匹配值域 `[1, n]`。

**标签：** #algorithm

---

### 39. 通配符匹配

**难度：** 困难
**主题：** dp, strings
**岗位：** T3-1
**级别：** T3

**问题：** 实现通配符匹配：`?` 匹配任意单字符，`*` 匹配任意序列（含空）。要求整串匹配。

**思路：** 2D DP `dp[i][j]` 表示 `s[0..i)` 与 `p[0..j)` 是否匹配。`*`：`dp[i][j] = dp[i][j-1]（空）|| dp[i-1][j]（延伸）`。`?`：`dp[i][j] = dp[i-1][j-1]`。前导 `*` 时初始化 `dp[0][j]`。O(n*m)。

**Python：**
```python
def is_match_wildcard(s: str, p: str) -> bool:
    n, m = len(s), len(p)
    dp = [[False] * (m + 1) for _ in range(n + 1)]
    dp[0][0] = True
    for j in range(1, m + 1):
        if p[j - 1] == "*":
            dp[0][j] = dp[0][j - 1]
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            if p[j - 1] == "*":
                dp[i][j] = dp[i][j - 1] or dp[i - 1][j]
            elif p[j - 1] == "?" or p[j - 1] == s[i - 1]:
                dp[i][j] = dp[i - 1][j - 1]
    return dp[n][m]
```

**TypeScript：**
```typescript
function isMatchWildcard(s: string, p: string): boolean {
  const n = s.length, m = p.length;
  const dp: boolean[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(false));
  dp[0][0] = true;
  for (let j = 1; j <= m; j++) if (p[j - 1] === "*") dp[0][j] = dp[0][j - 1];
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (p[j - 1] === "*") dp[i][j] = dp[i][j - 1] || dp[i - 1][j];
      else if (p[j - 1] === "?" || p[j - 1] === s[i - 1]) dp[i][j] = dp[i - 1][j - 1];
    }
  }
  return dp[n][m];
}
```

**Java：**
```java
boolean isMatchWildcard(String s, String p) {
  int n = s.length(), m = p.length();
  boolean[][] dp = new boolean[n + 1][m + 1];
  dp[0][0] = true;
  for (int j = 1; j <= m; j++) if (p.charAt(j - 1) == '*') dp[0][j] = dp[0][j - 1];
  for (int i = 1; i <= n; i++) {
    for (int j = 1; j <= m; j++) {
      char pc = p.charAt(j - 1);
      if (pc == '*') dp[i][j] = dp[i][j - 1] || dp[i - 1][j];
      else if (pc == '?' || pc == s.charAt(i - 1)) dp[i][j] = dp[i - 1][j - 1];
    }
  }
  return dp[n][m];
}
```

**要点：**
- `*` 既可匹配空串（`dp[i][j-1]`），也可继续吃字符（`dp[i-1][j]`）。
- 全是 `*` 的前缀需要把 `dp[0][j]` 初始化为 true。
- `?` 恰好匹配一个字符，按字面字符处理即可。

**标签：** #algorithm

---

### 40. 正则表达式匹配

**难度：** 困难
**主题：** dp, strings, recursion
**岗位：** T3-1
**级别：** T3-T4

**问题：** 实现支持 `.`（任意单字符）与 `*`（前一元素的 0 次或多次）的正则匹配。整串匹配。

**思路：** DP `dp[i][j]`。若 `p[j-1] == '*'`：取 0 次（`dp[i][j-2]`）或 1 次及以上且 `s[i-1]` 与 `p[j-2]` 匹配（`dp[i-1][j]`）。否则：字符/点匹配 → `dp[i-1][j-1]`。`a*b*c*` 之类的初始化要细心。O(n*m)。

**Python：**
```python
def is_match_regex(s: str, p: str) -> bool:
    n, m = len(s), len(p)
    dp = [[False] * (m + 1) for _ in range(n + 1)]
    dp[0][0] = True
    for j in range(2, m + 1):
        if p[j - 1] == "*":
            dp[0][j] = dp[0][j - 2]
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            if p[j - 1] == "*":
                dp[i][j] = dp[i][j - 2]
                if p[j - 2] == "." or p[j - 2] == s[i - 1]:
                    dp[i][j] = dp[i][j] or dp[i - 1][j]
            elif p[j - 1] == "." or p[j - 1] == s[i - 1]:
                dp[i][j] = dp[i - 1][j - 1]
    return dp[n][m]
```

**TypeScript：**
```typescript
function isMatchRegex(s: string, p: string): boolean {
  const n = s.length, m = p.length;
  const dp: boolean[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(false));
  dp[0][0] = true;
  for (let j = 2; j <= m; j++) if (p[j - 1] === "*") dp[0][j] = dp[0][j - 2];
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (p[j - 1] === "*") {
        dp[i][j] = dp[i][j - 2];
        if (p[j - 2] === "." || p[j - 2] === s[i - 1]) dp[i][j] = dp[i][j] || dp[i - 1][j];
      } else if (p[j - 1] === "." || p[j - 1] === s[i - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      }
    }
  }
  return dp[n][m];
}
```

**Java：**
```java
boolean isMatchRegex(String s, String p) {
  int n = s.length(), m = p.length();
  boolean[][] dp = new boolean[n + 1][m + 1];
  dp[0][0] = true;
  for (int j = 2; j <= m; j++) if (p.charAt(j - 1) == '*') dp[0][j] = dp[0][j - 2];
  for (int i = 1; i <= n; i++) {
    for (int j = 1; j <= m; j++) {
      char pc = p.charAt(j - 1);
      if (pc == '*') {
        dp[i][j] = dp[i][j - 2];
        char prev = p.charAt(j - 2);
        if (prev == '.' || prev == s.charAt(i - 1)) dp[i][j] = dp[i][j] || dp[i - 1][j];
      } else if (pc == '.' || pc == s.charAt(i - 1)) {
        dp[i][j] = dp[i - 1][j - 1];
      }
    }
  }
  return dp[n][m];
}
```

**要点：**
- `x*` 要么整段忽略（`dp[i][j-2]`），要么再多吃一个字符（`dp[i-1][j]`）。
- 初始化 `dp[0][j]` 以支持 `a*b*c*` 这种空匹配模式。
- `.` 可代替任意单字符，需在 `*` 分支也处理。

**标签：** #algorithm

---

### 41. 最长回文子串

**难度：** 中等
**主题：** strings, dp, two-pointer
**岗位：** T2-3
**级别：** T2-T3

**问题：** 返回 `s` 的最长回文子串。

**思路：** 中心扩展：对每个 i 分别按奇偶长度扩展；维护最长。O(n^2) 时间，O(1) 空间。O(n) — Manacher 算法（面试很少强求但可加分）。别和最长回文*子序列*混淆。

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
int blLP = 0, brLP = 0;

String longestPalindrome(String s) {
  for (int i = 0; i < s.length(); i++) {
    grow(s, i, i);
    grow(s, i, i + 1);
  }
  return s.substring(blLP, brLP + 1);
}

void grow(String s, int l, int r) {
  while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) { l--; r++; }
  l++; r--;
  if (r - l > brLP - blLP) { blLP = l; brLP = r; }
}
```

**要点：**
- 同时尝试奇数中心和偶数中心两种扩展。
- 通过长度比较记录最优起止，避免反复切片。
- Manacher 可达 O(n)，但中心扩展在常见规模下已够用。

**标签：** #algorithm

---

### 42. 最长回文子序列

**难度：** 中等
**主题：** dp, strings
**岗位：** T2-3
**级别：** T2-T3

**问题：** 返回 `s` 中最长回文子序列长度（不必连续）。

**思路：** 区间 DP `dp[i][j]` = `s[i..j]` 上的 LPS 长度。若 `s[i] == s[j]`：`dp[i][j] = dp[i+1][j-1] + 2`，否则：`max(dp[i+1][j], dp[i][j-1])`。按长度填。O(n^2)。技巧：等价于 `s` 与 reverse(`s`) 的 LCS。

**Python：**
```python
def longest_palindrome_subseq(s: str) -> int:
    n = len(s)
    dp = [[0] * n for _ in range(n)]
    for i in range(n):
        dp[i][i] = 1
    for length in range(2, n + 1):
        for i in range(n - length + 1):
            j = i + length - 1
            if s[i] == s[j]:
                dp[i][j] = dp[i + 1][j - 1] + 2
            else:
                dp[i][j] = max(dp[i + 1][j], dp[i][j - 1])
    return dp[0][n - 1]
```

**TypeScript：**
```typescript
function longestPalindromeSubseq(s: string): number {
  const n = s.length;
  const dp: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) dp[i][i] = 1;
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      dp[i][j] = s[i] === s[j] ? dp[i + 1][j - 1] + 2 : Math.max(dp[i + 1][j], dp[i][j - 1]);
    }
  }
  return dp[0][n - 1];
}
```

**Java：**
```java
int longestPalindromeSubseq(String s) {
  int n = s.length();
  int[][] dp = new int[n][n];
  for (int i = 0; i < n; i++) dp[i][i] = 1;
  for (int len = 2; len <= n; len++) {
    for (int i = 0; i + len - 1 < n; i++) {
      int j = i + len - 1;
      dp[i][j] = s.charAt(i) == s.charAt(j)
          ? dp[i + 1][j - 1] + 2
          : Math.max(dp[i + 1][j], dp[i][j - 1]);
    }
  }
  return dp[0][n - 1];
}
```

**要点：**
- 区间 DP 按长度填，保证子区间先就绪。
- 单字符自身是长度 1 的回文，先初始化主对角线。
- 等价于 `s` 与 reverse(`s`) 的 LCS，O(n^2)。

**标签：** #algorithm

---

### 43. 分割回文串

**难度：** 中等
**主题：** backtracking, dp, strings
**岗位：** T2-3
**级别：** T2-T3

**问题：** 将 `s` 划分使每段都是回文。返回所有划分方案。

**思路：** 回溯：在下标 `i`，尝试每个前缀 `s[i..j]`；若回文则从 `j+1` 递归。预处理回文表 `isP[i][j]`（O(n^2)）加速。最坏 O(n * 2^n)（输出指数级）。

**Python：**
```python
def partition(s: str) -> list[list[str]]:
    n = len(s)
    is_p = [[False] * n for _ in range(n)]
    for j in range(n):
        for i in range(j + 1):
            if s[i] == s[j] and (j - i < 2 or is_p[i + 1][j - 1]):
                is_p[i][j] = True
    out: list[list[str]] = []
    path: list[str] = []
    def go(start: int) -> None:
        if start == n:
            out.append(path[:])
            return
        for end in range(start, n):
            if is_p[start][end]:
                path.append(s[start:end + 1])
                go(end + 1)
                path.pop()
    go(0)
    return out
```

**TypeScript：**
```typescript
function partition(s: string): string[][] {
  const n = s.length;
  const isP: boolean[][] = Array.from({ length: n }, () => new Array(n).fill(false));
  for (let j = 0; j < n; j++) {
    for (let i = 0; i <= j; i++) {
      if (s[i] === s[j] && (j - i < 2 || isP[i + 1][j - 1])) isP[i][j] = true;
    }
  }
  const out: string[][] = [];
  const path: string[] = [];
  const go = (start: number): void => {
    if (start === n) { out.push(path.slice()); return; }
    for (let end = start; end < n; end++) {
      if (isP[start][end]) {
        path.push(s.slice(start, end + 1));
        go(end + 1);
        path.pop();
      }
    }
  };
  go(0);
  return out;
}
```

**Java：**
```java
List<List<String>> partition(String s) {
  int n = s.length();
  boolean[][] isP = new boolean[n][n];
  for (int j = 0; j < n; j++) {
    for (int i = 0; i <= j; i++) {
      if (s.charAt(i) == s.charAt(j) && (j - i < 2 || isP[i + 1][j - 1])) isP[i][j] = true;
    }
  }
  List<List<String>> out = new ArrayList<>();
  goPP(s, 0, isP, new ArrayList<>(), out);
  return out;
}

void goPP(String s, int start, boolean[][] isP, List<String> path, List<List<String>> out) {
  if (start == s.length()) { out.add(new ArrayList<>(path)); return; }
  for (int end = start; end < s.length(); end++) {
    if (isP[start][end]) {
      path.add(s.substring(start, end + 1));
      goPP(s, end + 1, isP, path, out);
      path.remove(path.size() - 1);
    }
  }
}
```

**要点：**
- 预处理 `isP` 把回溯里的回文判断降到 O(1)。
- 复用可变 `path`，命中终点时快照入结果。
- 最坏输出指数级（如全相同字符的串）。

**标签：** #algorithm

---

### 44. 单词拆分 II

**难度：** 困难
**主题：** dp, backtracking, memoization, trie
**岗位：** T3-1
**级别：** T3

**问题：** 给定字符串 `s` 和字典，返回所有可以将 `s` 用空格分割为字典词的句子。

**思路：** 后缀上做回溯 + 记忆化（后缀起点 → 句子列表）。每个使前缀是字典词的切点，对后缀递归。按起点缓存结果。Trie 做前缀查找加速扫描。最坏指数（受输出限制）。

**Python：**
```python
from functools import lru_cache

def word_break(s: str, word_dict: list[str]) -> list[str]:
    words = set(word_dict)
    @lru_cache(maxsize=None)
    def go(start: int) -> list[str]:
        if start == len(s):
            return [""]
        result: list[str] = []
        for end in range(start + 1, len(s) + 1):
            w = s[start:end]
            if w in words:
                for rest in go(end):
                    result.append(w if not rest else w + " " + rest)
        return result
    return go(0)
```

**TypeScript：**
```typescript
function wordBreak(s: string, wordDict: string[]): string[] {
  const words = new Set(wordDict);
  const memo = new Map<number, string[]>();
  const go = (start: number): string[] => {
    if (memo.has(start)) return memo.get(start)!;
    if (start === s.length) return [""];
    const result: string[] = [];
    for (let end = start + 1; end <= s.length; end++) {
      const w = s.slice(start, end);
      if (words.has(w)) {
        for (const rest of go(end)) result.push(rest === "" ? w : w + " " + rest);
      }
    }
    memo.set(start, result);
    return result;
  };
  return go(0);
}
```

**Java：**
```java
Map<Integer, List<String>> memoWB;
Set<String> wordsWB;
String sWB;

List<String> wordBreak(String s, List<String> wordDict) {
  memoWB = new HashMap<>();
  wordsWB = new HashSet<>(wordDict);
  sWB = s;
  return goWB(0);
}

List<String> goWB(int start) {
  if (memoWB.containsKey(start)) return memoWB.get(start);
  List<String> result = new ArrayList<>();
  if (start == sWB.length()) { result.add(""); return result; }
  for (int end = start + 1; end <= sWB.length(); end++) {
    String w = sWB.substring(start, end);
    if (wordsWB.contains(w)) {
      for (String rest : goWB(end)) result.add(rest.isEmpty() ? w : w + " " + rest);
    }
  }
  memoWB.put(start, result);
  return result;
}
```

**要点：**
- 按后缀起点记忆化，每个下标只展开一次。
- 用空串作为递归终止标记。
- 字典大时可结合 Trie/最长前缀加速扫描。

**标签：** #algorithm

---

### 45. 连接词

**难度：** 困难
**主题：** dp, trie, strings
**岗位：** T3-1
**级别：** T3

**问题：** 给定不重复字符串数组，返回所有由数组中至少两个其他字符串拼接而成的字符串。

**思路：** 对每个词，用其他词（或所有词，要求 `>=2` 段）跑 Word Break DP。`dp[i]` 表示 `word[0..i)` 可分割。优化：按长度排序，使用增量集合。常见 O(N * L^2)。

**Python：**
```python
def find_all_concatenated_words(words: list[str]) -> list[str]:
    words.sort(key=len)
    seen: set[str] = set()
    out: list[str] = []
    def composable(w: str) -> bool:
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
        if composable(w):
            out.append(w)
        seen.add(w)
    return out
```

**TypeScript：**
```typescript
function findAllConcatenatedWordsInADict(words: string[]): string[] {
  words.sort((a, b) => a.length - b.length);
  const seen = new Set<string>();
  const out: string[] = [];
  const composable = (w: string): boolean => {
    if (seen.size === 0) return false;
    const n = w.length;
    const dp = new Array<boolean>(n + 1).fill(false);
    dp[0] = true;
    for (let i = 1; i <= n; i++) {
      for (let j = 0; j < i; j++) {
        if (dp[j] && seen.has(w.slice(j, i))) { dp[i] = true; break; }
      }
    }
    return dp[n];
  };
  for (const w of words) {
    if (composable(w)) out.push(w);
    seen.add(w);
  }
  return out;
}
```

**Java：**
```java
List<String> findAllConcatenatedWordsInADict(String[] words) {
  Arrays.sort(words, Comparator.comparingInt(String::length));
  Set<String> seen = new HashSet<>();
  List<String> out = new ArrayList<>();
  for (String w : words) {
    if (composableCW(w, seen)) out.add(w);
    seen.add(w);
  }
  return out;
}

boolean composableCW(String w, Set<String> seen) {
  if (seen.isEmpty()) return false;
  int n = w.length();
  boolean[] dp = new boolean[n + 1];
  dp[0] = true;
  for (int i = 1; i <= n; i++) {
    for (int j = 0; j < i; j++) {
      if (dp[j] && seen.contains(w.substring(j, i))) { dp[i] = true; break; }
    }
  }
  return dp[n];
}
```

**要点：**
- 按长度排序使候选字典只含更短的词。
- 当前词尚未加入集合，天然保证至少由两段拼接。
- 总复杂度 O(N * L^2)：每个词在增量集合上做一次 Word Break。

**标签：** #algorithm

---

### 46. 原子的数量

**难度：** 困难
**主题：** stack, parsing, hashmap, strings
**岗位：** T3-1
**级别：** T3

**问题：** 解析化学式如 `"K4(ON(SO3)2)2"`，按字典序输出原子计数：`"K4N2O14S4"`。

**思路：** 哈希表栈。扫描：原子名 + 可选计数 → 加到栈顶 map。`(` → 新建 map 入栈。`)` 后可选计数 → 出栈，计数乘倍数，合并到新栈顶。结束：键排序，拼字符串。

**Python：**
```python
from collections import defaultdict

def count_of_atoms(formula: str) -> str:
    stack: list[defaultdict[str, int]] = [defaultdict(int)]
    i, n = 0, len(formula)
    while i < n:
        c = formula[i]
        if c == "(":
            stack.append(defaultdict(int))
            i += 1
        elif c == ")":
            i += 1
            j = i
            while j < n and formula[j].isdigit():
                j += 1
            mult = int(formula[i:j]) if j > i else 1
            top = stack.pop()
            for k, v in top.items():
                stack[-1][k] += v * mult
            i = j
        else:
            j = i + 1
            while j < n and formula[j].islower():
                j += 1
            name = formula[i:j]
            k = j
            while k < n and formula[k].isdigit():
                k += 1
            cnt = int(formula[j:k]) if k > j else 1
            stack[-1][name] += cnt
            i = k
    return "".join(k + (str(v) if v > 1 else "") for k, v in sorted(stack[0].items()))
```

**TypeScript：**
```typescript
function countOfAtoms(formula: string): string {
  const stack: Array<Map<string, number>> = [new Map()];
  let i = 0;
  const n = formula.length;
  const isDigit = (c: string) => c >= "0" && c <= "9";
  const isLower = (c: string) => c >= "a" && c <= "z";
  while (i < n) {
    const c = formula[i];
    if (c === "(") { stack.push(new Map()); i++; }
    else if (c === ")") {
      i++;
      let j = i;
      while (j < n && isDigit(formula[j])) j++;
      const mult = j > i ? parseInt(formula.slice(i, j), 10) : 1;
      const top = stack.pop()!;
      const cur = stack[stack.length - 1];
      top.forEach((v, k) => cur.set(k, (cur.get(k) ?? 0) + v * mult));
      i = j;
    } else {
      let j = i + 1;
      while (j < n && isLower(formula[j])) j++;
      const name = formula.slice(i, j);
      let k = j;
      while (k < n && isDigit(formula[k])) k++;
      const cnt = k > j ? parseInt(formula.slice(j, k), 10) : 1;
      const cur = stack[stack.length - 1];
      cur.set(name, (cur.get(name) ?? 0) + cnt);
      i = k;
    }
  }
  return [...stack[0].entries()].sort((a, b) => a[0] < b[0] ? -1 : 1)
    .map(([k, v]) => v > 1 ? k + v : k).join("");
}
```

**Java：**
```java
String countOfAtoms(String formula) {
  Deque<Map<String, Integer>> stack = new ArrayDeque<>();
  stack.push(new HashMap<>());
  int i = 0, n = formula.length();
  while (i < n) {
    char c = formula.charAt(i);
    if (c == '(') { stack.push(new HashMap<>()); i++; }
    else if (c == ')') {
      i++;
      int j = i;
      while (j < n && Character.isDigit(formula.charAt(j))) j++;
      int mult = j > i ? Integer.parseInt(formula.substring(i, j)) : 1;
      Map<String, Integer> top = stack.pop();
      Map<String, Integer> cur = stack.peek();
      for (var e : top.entrySet()) cur.merge(e.getKey(), e.getValue() * mult, Integer::sum);
      i = j;
    } else {
      int j = i + 1;
      while (j < n && Character.isLowerCase(formula.charAt(j))) j++;
      String name = formula.substring(i, j);
      int k = j;
      while (k < n && Character.isDigit(formula.charAt(k))) k++;
      int cnt = k > j ? Integer.parseInt(formula.substring(j, k)) : 1;
      stack.peek().merge(name, cnt, Integer::sum);
      i = k;
    }
  }
  StringBuilder out = new StringBuilder();
  new TreeMap<>(stack.peek()).forEach((k, v) -> { out.append(k); if (v > 1) out.append(v); });
  return out.toString();
}
```

**要点：**
- 计数 map 栈与嵌套结构一一对应。
- 原子 token = 一个大写字母后跟若干小写字母。
- 输出按字母序，计数为 1 时省略。

**复杂度：** O(n) 单越解析公式（计数 map 栈最多持有 O(n) 个原子），再加 O(k log k) 对 k 个不同原子排序输出。

**标签：** #algorithm

---

### 47. 基本计算器 II

**难度：** 中等
**主题：** stack, parsing, strings
**岗位：** T2-3
**级别：** T2-T3

**问题：** 求值字符串表达式，含 `+ - * /` 与非负整数（无括号）。整除向零截断。

**思路：** 单次扫描 + 栈。维护当前数字与上一个运算符。遇运算符或末尾时：上一个为 `+` 入栈 num；`-` 入栈 `-num`；`*` 或 `/` 弹栈合并。最终结果为栈中之和。O(n)。带括号变体 → 递归或加栈。

**Python：**
```python
def calculate(s: str) -> int:
    stack: list[int] = []
    num, op = 0, "+"
    for i, c in enumerate(s):
        if c.isdigit():
            num = num * 10 + int(c)
        if (not c.isdigit() and c != " ") or i == len(s) - 1:
            if op == "+":
                stack.append(num)
            elif op == "-":
                stack.append(-num)
            elif op == "*":
                stack.append(stack.pop() * num)
            else:
                top = stack.pop()
                stack.append(int(top / num))  # truncate toward zero
            op, num = c, 0
    return sum(stack)
```

**TypeScript：**
```typescript
function calculate(s: string): number {
  const stack: number[] = [];
  let num = 0, op = "+";
  const isDigit = (c: string) => c >= "0" && c <= "9";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (isDigit(c)) num = num * 10 + (c.charCodeAt(0) - 48);
    if ((!isDigit(c) && c !== " ") || i === s.length - 1) {
      if (op === "+") stack.push(num);
      else if (op === "-") stack.push(-num);
      else if (op === "*") stack.push(stack.pop()! * num);
      else stack.push(Math.trunc(stack.pop()! / num));
      op = c; num = 0;
    }
  }
  return stack.reduce((a, b) => a + b, 0);
}
```

**Java：**
```java
int calculate(String s) {
  Deque<Integer> stack = new ArrayDeque<>();
  int num = 0;
  char op = '+';
  for (int i = 0; i < s.length(); i++) {
    char c = s.charAt(i);
    if (Character.isDigit(c)) num = num * 10 + (c - '0');
    if ((!Character.isDigit(c) && c != ' ') || i == s.length() - 1) {
      if (op == '+') stack.push(num);
      else if (op == '-') stack.push(-num);
      else if (op == '*') stack.push(stack.pop() * num);
      else stack.push(stack.pop() / num);  // truncate toward zero
      op = c; num = 0;
    }
  }
  int sum = 0;
  for (int v : stack) sum += v;
  return sum;
}
```

**要点：**
- 缓存当前数字，遇运算符或末尾再提交。
- `*` 和 `/` 直接改写栈顶，自然体现优先级。
- 整除向零截断——用 `int(a / b)` / `Math.trunc`，不要用向下取整。

**标签：** #algorithm

---

### 48. 字符串解码

**难度：** 中等
**主题：** stack, parsing, recursion, strings
**岗位：** T2-3
**级别：** T2-T3

**问题：** 解码如 `"3[a2[c]]"` → `"accaccacc"`。编码为 `k[string]` 表示 string 重复 k 次，可嵌套。

**思路：** 两个栈：数字栈和字符串栈。遇数字累计；遇 `[` 推当前数字和当前字符串，重置；遇 `]` 弹数字和上层字符串，新当前 = 上层 + 当前 * 数字；遇字母追加。O(输出长度)。

**Python：**
```python
def decode_string(s: str) -> str:
    count_stack: list[int] = []
    str_stack: list[str] = []
    cur, k = "", 0
    for c in s:
        if c.isdigit():
            k = k * 10 + int(c)
        elif c == "[":
            count_stack.append(k)
            str_stack.append(cur)
            cur, k = "", 0
        elif c == "]":
            cur = str_stack.pop() + cur * count_stack.pop()
        else:
            cur += c
    return cur
```

**TypeScript：**
```typescript
function decodeString(s: string): string {
  const countStack: number[] = [];
  const strStack: string[] = [];
  let cur = "", k = 0;
  for (const c of s) {
    if (c >= "0" && c <= "9") k = k * 10 + (c.charCodeAt(0) - 48);
    else if (c === "[") { countStack.push(k); strStack.push(cur); cur = ""; k = 0; }
    else if (c === "]") cur = strStack.pop()! + cur.repeat(countStack.pop()!);
    else cur += c;
  }
  return cur;
}
```

**Java：**
```java
String decodeString(String s) {
  Deque<Integer> countStack = new ArrayDeque<>();
  Deque<StringBuilder> strStack = new ArrayDeque<>();
  StringBuilder cur = new StringBuilder();
  int k = 0;
  for (char c : s.toCharArray()) {
    if (Character.isDigit(c)) k = k * 10 + (c - '0');
    else if (c == '[') { countStack.push(k); strStack.push(cur); cur = new StringBuilder(); k = 0; }
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

**要点：**
- 数字栈和字符串栈分别保存上下文。
- 多位数字必须在遇到 `[` 之前累计完成。
- 每个 `]` 把一层嵌套合并回外层字符串。

**标签：** #algorithm

---

### 49. 迷你解析器（扁平嵌套列表迭代器）

**难度：** 中等
**主题：** stack, parsing, design, strings
**岗位：** T2-3
**级别：** T2-T3

**问题：** 把 `"[123,[456,[789]]]"` 解析成 NestedInteger 结构，或设计懒展开嵌套列表的迭代器。

**思路：** 解析器：基于栈——遇 `[` 新建 NestedInteger 入栈，解析数字（含负号），遇 `,` 或 `]` 提交。迭代器：迭代器栈；`hasNext` 懒剥嵌套；`next` 返回下一个整数。O(总元素数)。

**Python：**
```python
NestedItem = int | list["NestedItem"]

def deserialize(s: str) -> NestedItem:
    if s[0] != "[":
        return int(s)
    stack: list[list[NestedItem]] = []
    cur: list[NestedItem] = []
    num, sign = 0, 1
    has_num = False
    for c in s:
        if c == "[":
            stack.append(cur)
            cur = []
        elif c.isdigit():
            num = num * 10 + int(c)
            has_num = True
        elif c == "-":
            sign = -1
        elif c == "," or c == "]":
            if has_num:
                cur.append(sign * num)
                num, sign, has_num = 0, 1, False
            if c == "]":
                prev = stack.pop()
                prev.append(cur)
                cur = prev
    return cur[0]
```

**TypeScript：**
```typescript
type NestedItem = number | NestedItem[];

function deserialize(s: string): NestedItem {
  if (s[0] !== "[") return parseInt(s, 10);
  const stack: NestedItem[][] = [];
  let cur: NestedItem[] = [];
  let num = 0, sign = 1, hasNum = false;
  const isDigit = (c: string) => c >= "0" && c <= "9";
  for (const c of s) {
    if (c === "[") { stack.push(cur); cur = []; }
    else if (isDigit(c)) { num = num * 10 + (c.charCodeAt(0) - 48); hasNum = true; }
    else if (c === "-") sign = -1;
    else if (c === "," || c === "]") {
      if (hasNum) { cur.push(sign * num); num = 0; sign = 1; hasNum = false; }
      if (c === "]") { const prev = stack.pop()!; prev.push(cur); cur = prev; }
    }
  }
  return cur[0];
}
```

**Java：**
```java
// NestedInteger: holds either a single integer or a list of NestedIntegers.
NestedInteger deserialize(String s) {
  if (s.charAt(0) != '[') return new NestedInteger(Integer.parseInt(s));
  Deque<NestedInteger> stack = new ArrayDeque<>();
  NestedInteger cur = null;
  int num = 0, sign = 1;
  boolean hasNum = false;
  for (int i = 0; i < s.length(); i++) {
    char c = s.charAt(i);
    if (c == '[') { if (cur != null) stack.push(cur); cur = new NestedInteger(); }
    else if (Character.isDigit(c)) { num = num * 10 + (c - '0'); hasNum = true; }
    else if (c == '-') sign = -1;
    else if (c == ',' || c == ']') {
      if (hasNum) { cur.add(new NestedInteger(sign * num)); num = 0; sign = 1; hasNum = false; }
      if (c == ']' && !stack.isEmpty()) { NestedInteger prev = stack.pop(); prev.add(cur); cur = prev; }
    }
  }
  return cur;
}
```

**要点：**
- 单整数输入直接绕过解析器。
- 在 `,` 或 `]` 处提交挂起的数字，可处理末尾数字。
- 栈交换使父列表在 `]` 之后重新成为"当前"。

**标签：** #algorithm

---

### 50. 翻转对

**难度：** 困难
**主题：** merge-sort, bit, divide-and-conquer
**岗位：** T3-1
**级别：** T3

**问题：** 统计满足 `i < j` 且 `nums[i] > 2 * nums[j]` 的对数。

**思路：** 归并排序：合并阶段，对左半每个 `i`，用滑动指针在右半统计满足 `nums[i] > 2*nums[j]` 的 `j`。再正常合并。O(n log n)。另解：在坐标压缩后的值域上用树状数组。

**Python：**
```python
def reverse_pairs(nums: list[int]) -> int:
    def sort(lo: int, hi: int) -> int:
        if lo >= hi:
            return 0
        mid = (lo + hi) // 2
        count = sort(lo, mid) + sort(mid + 1, hi)
        j = mid + 1
        for i in range(lo, mid + 1):
            while j <= hi and nums[i] > 2 * nums[j]:
                j += 1
            count += j - (mid + 1)
        nums[lo:hi + 1] = sorted(nums[lo:hi + 1])
        return count
    return sort(0, len(nums) - 1)
```

**TypeScript：**
```typescript
function reversePairs(nums: number[]): number {
  const sort = (lo: number, hi: number): number => {
    if (lo >= hi) return 0;
    const mid = (lo + hi) >> 1;
    let count = sort(lo, mid) + sort(mid + 1, hi);
    let j = mid + 1;
    for (let i = lo; i <= mid; i++) {
      while (j <= hi && nums[i] > 2 * nums[j]) j++;
      count += j - (mid + 1);
    }
    const merged = nums.slice(lo, hi + 1).sort((a, b) => a - b);
    for (let k = 0; k < merged.length; k++) nums[lo + k] = merged[k];
    return count;
  };
  return sort(0, nums.length - 1);
}
```

**Java：**
```java
int[] numsRP;

int reversePairs(int[] nums) {
  numsRP = nums;
  return sortRP(0, nums.length - 1);
}

int sortRP(int lo, int hi) {
  if (lo >= hi) return 0;
  int mid = (lo + hi) >>> 1;
  int count = sortRP(lo, mid) + sortRP(mid + 1, hi);
  int j = mid + 1;
  for (int i = lo; i <= mid; i++) {
    while (j <= hi && (long) numsRP[i] > 2L * numsRP[j]) j++;
    count += j - (mid + 1);
  }
  int[] merged = Arrays.copyOfRange(numsRP, lo, hi + 1);
  Arrays.sort(merged);
  System.arraycopy(merged, 0, numsRP, lo, merged.length);
  return count;
}
```

**要点：**
- 先在已排好序的左右两半上统计，再合并，指针无需回退。
- 某些语言中 `2 * nums[j]` 可能溢出；JS `Number` 范围内无忧。
- 计数与合并分开，递推式仍为 T(n) = 2T(n/2) + O(n)。

**标签：** #algorithm

---

### 51. 计算右侧小于当前元素的个数

**难度：** 困难
**主题：** bit, merge-sort, segment-tree
**岗位：** T3-1
**级别：** T3

**问题：** 对每个 `nums[i]`，求 `j > i` 且 `nums[j] < nums[i]` 的数量。

**思路：** 带索引归并排序：右半元素被放到左半元素前时，对应左半元素计数加一。或对压缩后的值从右往左用树状数组前缀查询。O(n log n)。

**Python：**
```python
def count_smaller(nums: list[int]) -> list[int]:
    n = len(nums)
    counts = [0] * n
    indices = list(range(n))
    def sort(lo: int, hi: int) -> list[int]:
        if lo >= hi:
            return [indices[lo]] if lo == hi else []
        mid = (lo + hi) // 2
        left = sort(lo, mid)
        right = sort(mid + 1, hi)
        merged: list[int] = []
        i = j = 0
        while i < len(left) or j < len(right):
            if j == len(right) or (i < len(left) and nums[left[i]] <= nums[right[j]]):
                counts[left[i]] += j
                merged.append(left[i])
                i += 1
            else:
                merged.append(right[j])
                j += 1
        for k, idx in enumerate(merged):
            indices[lo + k] = idx
        return merged
    sort(0, n - 1)
    return counts
```

**TypeScript：**
```typescript
function countSmaller(nums: number[]): number[] {
  const n = nums.length;
  const counts = new Array<number>(n).fill(0);
  const indices = Array.from({ length: n }, (_, i) => i);
  const sort = (lo: number, hi: number): number[] => {
    if (lo > hi) return [];
    if (lo === hi) return [indices[lo]];
    const mid = (lo + hi) >> 1;
    const left = sort(lo, mid), right = sort(mid + 1, hi);
    const merged: number[] = [];
    let i = 0, j = 0;
    while (i < left.length || j < right.length) {
      if (j === right.length || (i < left.length && nums[left[i]] <= nums[right[j]])) {
        counts[left[i]] += j;
        merged.push(left[i++]);
      } else merged.push(right[j++]);
    }
    for (let k = 0; k < merged.length; k++) indices[lo + k] = merged[k];
    return merged;
  };
  sort(0, n - 1);
  return counts;
}
```

**Java：**
```java
int[] numsCS;
int[] countsCS;
int[] indicesCS;

List<Integer> countSmaller(int[] nums) {
  int n = nums.length;
  numsCS = nums;
  countsCS = new int[n];
  indicesCS = new int[n];
  for (int i = 0; i < n; i++) indicesCS[i] = i;
  sortCS(0, n - 1);
  List<Integer> out = new ArrayList<>(n);
  for (int c : countsCS) out.add(c);
  return out;
}

int[] sortCS(int lo, int hi) {
  if (lo > hi) return new int[0];
  if (lo == hi) return new int[]{indicesCS[lo]};
  int mid = (lo + hi) >>> 1;
  int[] left = sortCS(lo, mid), right = sortCS(mid + 1, hi);
  int[] merged = new int[left.length + right.length];
  int i = 0, j = 0, k = 0;
  while (i < left.length || j < right.length) {
    if (j == right.length || (i < left.length && numsCS[left[i]] <= numsCS[right[j]])) {
      countsCS[left[i]] += j;
      merged[k++] = left[i++];
    } else merged[k++] = right[j++];
  }
  System.arraycopy(merged, 0, indicesCS, lo, merged.length);
  return merged;
}
```

**要点：**
- 对索引而非数值排序，保证每个元素的计数始终可寻址。
- 取走左侧元素时，`j` 即为已见的更小右侧元素个数。
- 用 `<=` 而非 `<` 处理相等，避免重复计数。

**标签：** #algorithm

---

### 52. 区间和的个数

**难度：** 困难
**主题：** merge-sort, prefix-sum, bit
**岗位：** T3-1
**级别：** T3

**问题：** 统计区间和落在 `[lower, upper]` 内（含两端）的子数组数量。

**思路：** 计算前缀和。要找的是满足 `lower <= prefix[j] - prefix[i] <= upper` 的 `(i, j)` 对。在前缀数组上做归并排序：合并时，对每个左侧下标，用两个滑动指针统计右侧合法下标数。O(n log n)。

**Python：**
```python
def count_range_sum(nums: list[int], lower: int, upper: int) -> int:
    prefix = [0]
    for x in nums:
        prefix.append(prefix[-1] + x)
    def sort(lo: int, hi: int) -> int:
        if hi - lo <= 1:
            return 0
        mid = (lo + hi) // 2
        count = sort(lo, mid) + sort(mid, hi)
        j = k = mid
        for left in prefix[lo:mid]:
            while k < hi and prefix[k] - left < lower:
                k += 1
            while j < hi and prefix[j] - left <= upper:
                j += 1
            count += j - k
        prefix[lo:hi] = sorted(prefix[lo:hi])
        return count
    return sort(0, len(prefix))
```

**TypeScript：**
```typescript
function countRangeSum(nums: number[], lower: number, upper: number): number {
  const prefix: number[] = [0];
  for (const x of nums) prefix.push(prefix[prefix.length - 1] + x);
  const sort = (lo: number, hi: number): number => {
    if (hi - lo <= 1) return 0;
    const mid = (lo + hi) >> 1;
    let count = sort(lo, mid) + sort(mid, hi);
    let j = mid, k = mid;
    for (let i = lo; i < mid; i++) {
      while (k < hi && prefix[k] - prefix[i] < lower) k++;
      while (j < hi && prefix[j] - prefix[i] <= upper) j++;
      count += j - k;
    }
    const merged = prefix.slice(lo, hi).sort((a, b) => a - b);
    for (let i = 0; i < merged.length; i++) prefix[lo + i] = merged[i];
    return count;
  };
  return sort(0, prefix.length);
}
```

**Java：**
```java
long[] prefixCRS;
int lowerCRS, upperCRS;

int countRangeSum(int[] nums, int lower, int upper) {
  int n = nums.length;
  prefixCRS = new long[n + 1];
  for (int i = 0; i < n; i++) prefixCRS[i + 1] = prefixCRS[i] + nums[i];
  lowerCRS = lower; upperCRS = upper;
  return sortCRS(0, prefixCRS.length);
}

int sortCRS(int lo, int hi) {
  if (hi - lo <= 1) return 0;
  int mid = (lo + hi) >>> 1;
  int count = sortCRS(lo, mid) + sortCRS(mid, hi);
  int j = mid, k = mid;
  for (int i = lo; i < mid; i++) {
    while (k < hi && prefixCRS[k] - prefixCRS[i] < lowerCRS) k++;
    while (j < hi && prefixCRS[j] - prefixCRS[i] <= upperCRS) j++;
    count += j - k;
  }
  long[] merged = Arrays.copyOfRange(prefixCRS, lo, hi);
  Arrays.sort(merged);
  System.arraycopy(merged, 0, prefixCRS, lo, merged.length);
  return count;
}
```

**要点：**
- 前缀和把区间和问题转成"前缀对差"。
- 排序后两侧都有序，两个扫描指针只需单向前进。
- 使用 `n + 1` 个前缀，第一段也会被纳入考量。

**标签：** #algorithm

---

### 53. 数据流的中位数

**难度：** 困难
**主题：** heap, design, data-stream
**岗位：** T3-1
**级别：** T3-T4

**问题：** 设计支持 `addNum(int)` 和 `findMedian()` 的类，流式输入。

**思路：** 双堆：`lo`（大顶堆）存较小一半，`hi`（小顶堆）存较大一半。维持 `len(lo) - len(hi) ∈ {0, 1}`。Add：入 lo，弹顶推 hi，若 hi 更大则回弹。Median：取 lo 顶或两顶均值。O(log n) add，O(1) 查询。

**Python：**
```python
import heapq

class MedianFinder:
    def __init__(self) -> None:
        self.lo: list[int] = []  # max-heap via negation
        self.hi: list[int] = []  # min-heap

    def add_num(self, num: int) -> None:
        heapq.heappush(self.lo, -num)
        heapq.heappush(self.hi, -heapq.heappop(self.lo))
        if len(self.hi) > len(self.lo):
            heapq.heappush(self.lo, -heapq.heappop(self.hi))

    def find_median(self) -> float:
        if len(self.lo) > len(self.hi):
            return float(-self.lo[0])
        return (-self.lo[0] + self.hi[0]) / 2
```

**TypeScript：**
```typescript
class MedianFinder {
  private lo: number[] = [];  // max-heap (negate)
  private hi: number[] = [];  // min-heap
  private push(heap: number[], v: number): void {
    heap.push(v); heap.sort((a, b) => a - b);
  }
  addNum(num: number): void {
    this.push(this.lo, -num);
    this.push(this.hi, -this.lo.shift()!);
    if (this.hi.length > this.lo.length) this.push(this.lo, -this.hi.shift()!);
  }
  findMedian(): number {
    return this.lo.length > this.hi.length ? -this.lo[0] : (-this.lo[0] + this.hi[0]) / 2;
  }
}
```

**Java：**
```java
class MedianFinder {
  private final PriorityQueue<Integer> lo = new PriorityQueue<>(Comparator.reverseOrder());
  private final PriorityQueue<Integer> hi = new PriorityQueue<>();

  public void addNum(int num) {
    lo.offer(num);
    hi.offer(lo.poll());
    if (hi.size() > lo.size()) lo.offer(hi.poll());
  }

  public double findMedian() {
    return lo.size() > hi.size() ? lo.peek() : (lo.peek() + hi.peek()) / 2.0;
  }
}
```

**要点：**
- `lo` 始终装较小一半（向上取整 n/2），`hi` 装较大一半。
- 每次插入后通过一次倒堆完成再平衡。
- 奇数个时取 `lo` 顶，偶数个时取两顶均值。

**标签：** #algorithm

---

### 54. 滑动窗口中位数

**难度：** 困难
**主题：** heap, sliding-window, design
**岗位：** T3-1
**级别：** T3-T4

**问题：** 给定数组和窗口大小 `k`，返回每个滑动窗口的中位数。

**思路：** 双堆 + 延迟删除（待删除哈希表）。每步：加入新数；将滑出的数标记删除；清理堆顶将失效项弹出；调整两堆大小。O(n log k)。或用有序多重集合（C++ `multiset`）。

**Python：**
```python
from sortedcontainers import SortedList

def median_sliding_window(nums: list[int], k: int) -> list[float]:
    window = SortedList(nums[:k])
    out: list[float] = []
    def median() -> float:
        if k % 2:
            return float(window[k // 2])
        return (window[k // 2 - 1] + window[k // 2]) / 2
    out.append(median())
    for i in range(k, len(nums)):
        window.remove(nums[i - k])
        window.add(nums[i])
        out.append(median())
    return out
```

**TypeScript：**
```typescript
function medianSlidingWindow(nums: number[], k: number): number[] {
  const window = nums.slice(0, k).sort((a, b) => a - b);
  const out: number[] = [];
  const bisect = (v: number): number => {
    let lo = 0, hi = window.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (window[m] < v) lo = m + 1; else hi = m; }
    return lo;
  };
  const median = (): number =>
    k % 2 ? window[k >> 1] : (window[(k >> 1) - 1] + window[k >> 1]) / 2;
  out.push(median());
  for (let i = k; i < nums.length; i++) {
    window.splice(bisect(nums[i - k]), 1);
    window.splice(bisect(nums[i]), 0, nums[i]);
    out.push(median());
  }
  return out;
}
```

**Java：**
```java
double[] medianSlidingWindow(int[] nums, int k) {
  TreeMap<Integer, Integer> window = new TreeMap<>();
  for (int i = 0; i < k; i++) window.merge(nums[i], 1, Integer::sum);
  int n = nums.length;
  double[] out = new double[n - k + 1];
  out[0] = medianOf(window, k);
  for (int i = k; i < n; i++) {
    int outV = nums[i - k];
    if (window.get(outV) == 1) window.remove(outV); else window.merge(outV, -1, Integer::sum);
    window.merge(nums[i], 1, Integer::sum);
    out[i - k + 1] = medianOf(window, k);
  }
  return out;
}

double medianOf(TreeMap<Integer, Integer> window, int k) {
  int[] mids = k % 2 == 1 ? new int[]{k / 2} : new int[]{k / 2 - 1, k / 2};
  long sum = 0; int seen = 0, idx = 0;
  for (var e : window.entrySet()) {
    int next = seen + e.getValue();
    while (idx < mids.length && mids[idx] < next) { sum += e.getKey(); idx++; }
    seen = next;
    if (idx == mids.length) break;
  }
  return sum / (double) mids.length;
}
```

**要点：**
- 有序多重集合（Python `SortedList`、C++ `multiset`）模型最干净。
- 插入与删除均 O(log k)，按下标取中位数 O(1)。
- 不依赖外部库时，可用双堆 + 延迟删除替代。

**标签：** #algorithm

---

### 55. 最小区间覆盖 K 个有序列表

**难度：** 困难
**主题：** heap, sliding-window
**岗位：** T3-1
**级别：** T3

**问题：** 给定 `k` 个有序列表，求最小区间 `[a, b]`，使每个列表至少有一个元素落在其中。

**思路：** 小顶堆保存每个列表当前一个元素及索引。维护当前堆中最大值。弹出最小；当前区间 `[min, max]`，更优则更新。该列表下推一位——耗尽则停。入新元素，更新 max。O(N log k)。

**Python：**
```python
import heapq

def smallest_range(nums: list[list[int]]) -> list[int]:
    heap: list[tuple[int, int, int]] = []  # (val, list_idx, pos)
    cur_max = float("-inf")
    for i, row in enumerate(nums):
        heapq.heappush(heap, (row[0], i, 0))
        cur_max = max(cur_max, row[0])
    best_lo, best_hi = -10**9, 10**9
    while heap:
        v, i, j = heapq.heappop(heap)
        if cur_max - v < best_hi - best_lo:
            best_lo, best_hi = v, int(cur_max)
        if j + 1 == len(nums[i]):
            return [best_lo, best_hi]
        nxt = nums[i][j + 1]
        cur_max = max(cur_max, nxt)
        heapq.heappush(heap, (nxt, i, j + 1))
    return [best_lo, best_hi]
```

**TypeScript：**
```typescript
function smallestRange(nums: number[][]): number[] {
  const heap: Array<[number, number, number]> = [];
  let curMax = -Infinity;
  nums.forEach((row, i) => { heap.push([row[0], i, 0]); curMax = Math.max(curMax, row[0]); });
  heap.sort((a, b) => a[0] - b[0]);
  let bestLo = -1e9, bestHi = 1e9;
  while (heap.length) {
    const [v, i, j] = heap.shift()!;
    if (curMax - v < bestHi - bestLo) { bestLo = v; bestHi = curMax; }
    if (j + 1 === nums[i].length) return [bestLo, bestHi];
    const nxt = nums[i][j + 1];
    curMax = Math.max(curMax, nxt);
    heap.push([nxt, i, j + 1]);
    heap.sort((a, b) => a[0] - b[0]);
  }
  return [bestLo, bestHi];
}
```

**Java：**
```java
int[] smallestRange(List<List<Integer>> nums) {
  PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> a[0] - b[0]);
  int curMax = Integer.MIN_VALUE;
  for (int i = 0; i < nums.size(); i++) {
    int v = nums.get(i).get(0);
    heap.offer(new int[]{v, i, 0});
    curMax = Math.max(curMax, v);
  }
  int bestLo = 0, bestHi = Integer.MAX_VALUE;
  while (!heap.isEmpty()) {
    int[] cur = heap.poll();
    int v = cur[0], i = cur[1], j = cur[2];
    if ((long) curMax - v < (long) bestHi - bestLo) { bestLo = v; bestHi = curMax; }
    if (j + 1 == nums.get(i).size()) return new int[]{bestLo, bestHi};
    int nxt = nums.get(i).get(j + 1);
    curMax = Math.max(curMax, nxt);
    heap.offer(new int[]{nxt, i, j + 1});
  }
  return new int[]{bestLo, bestHi};
}
```

**要点：**
- 窗口隐式为 `[heap_min, cur_max]`，每个列表恰有一项在内。
- 任意列表耗尽即可终止，因为该列表指针无法继续推进。
- 每次入堆时懒更新 `cur_max`，避免扫描整堆。

**标签：** #algorithm

---

### 56. 只出现一次的数字 II

**难度：** 中等
**主题：** bit-manipulation, math
**岗位：** T2-3
**级别：** T2-T3

**问题：** 每个元素恰好出现三次，仅有一个元素出现一次。O(n) 时间 O(1) 空间找出它。

**思路：** 按位统计模 3，再拼。更巧：两状态计数 `ones`、`twos`。更新 `ones = (ones ^ x) & ~twos; twos = (twos ^ x) & ~ones`。结果在 `ones`。讲清楚状态机。

**Python：**
```python
def single_number(nums: list[int]) -> int:
    ones = twos = 0
    for x in nums:
        ones = (ones ^ x) & ~twos
        twos = (twos ^ x) & ~ones
    return ones
```

**TypeScript：**
```typescript
function singleNumber(nums: number[]): number {
  let ones = 0, twos = 0;
  for (const x of nums) {
    ones = (ones ^ x) & ~twos;
    twos = (twos ^ x) & ~ones;
  }
  return ones;
}
```

**Java：**
```java
int singleNumber(int[] nums) {
  int ones = 0, twos = 0;
  for (int x : nums) {
    ones = (ones ^ x) & ~twos;
    twos = (twos ^ x) & ~ones;
  }
  return ones;
}
```

**要点：**
- 每位在状态 00 -> 01 -> 10 -> 00 间循环，对应见到 0/1/2/3 次 1。
- 处理完后，恰好出现一次的位都留在 `ones` 中。
- 全是位运算，O(n) 时间、O(1) 空间。

**标签：** #algorithm

---

### 57. 只出现一次的数字 III

**难度：** 中等
**主题：** bit-manipulation, xor
**岗位：** T2-3
**级别：** T2-T3

**问题：** 恰好两个元素出现一次，其余出现两次。O(n) 时间 O(1) 空间找出二者。

**思路：** 全 XOR → `x = a ^ b`。取 `x` 任意一位 1（如 `x & -x`），按此位将原数分成两组（该位为 1 与否）。各组 XOR → `a` 与 `b`。两数在该位不同因此一定分入不同组。

**Python：**
```python
def single_number_iii(nums: list[int]) -> list[int]:
    xor_all = 0
    for x in nums:
        xor_all ^= x
    bit = xor_all & -xor_all
    a = b = 0
    for x in nums:
        if x & bit:
            a ^= x
        else:
            b ^= x
    return [a, b]
```

**TypeScript：**
```typescript
function singleNumberIII(nums: number[]): number[] {
  let xorAll = 0;
  for (const x of nums) xorAll ^= x;
  const bit = xorAll & -xorAll;
  let a = 0, b = 0;
  for (const x of nums) {
    if (x & bit) a ^= x;
    else b ^= x;
  }
  return [a, b];
}
```

**Java：**
```java
int[] singleNumberIII(int[] nums) {
  int xorAll = 0;
  for (int x : nums) xorAll ^= x;
  int bit = xorAll & -xorAll;
  int a = 0, b = 0;
  for (int x : nums) {
    if ((x & bit) != 0) a ^= x;
    else b ^= x;
  }
  return new int[]{a, b};
}
```

**要点：**
- `x & -x` 取最低的那个 1（对任意非零整数有效）。
- 两个目标数在该位不同，必然落入不同分组。
- 出现两次的数在各自分组内通过 XOR 互相抵消。

**标签：** #algorithm

---

### 58. 数字范围按位与

**难度：** 中等
**主题：** bit-manipulation, math
**岗位：** T2-3
**级别：** T2-T3

**问题：** 给定 `[m, n]`，返回区间内所有整数按位与的结果。

**思路：** 结果等于 `m` 与 `n` 二进制的公共前缀。同时右移至相等，记移位数；再左移回去。或：当 `m < n`，`n = n & (n - 1)`。O(log n)。

**Python：**
```python
def range_bitwise_and(m: int, n: int) -> int:
    while m < n:
        n &= n - 1
    return n
```

**TypeScript：**
```typescript
function rangeBitwiseAnd(m: number, n: number): number {
  while (m < n) n &= n - 1;
  return n;
}
```

**Java：**
```java
int rangeBitwiseAnd(int m, int n) {
  while (m < n) n &= n - 1;
  return n;
}
```

**要点：**
- `n & (n - 1)` 会清掉 `n` 最低位的 1。
- 反复执行直到 `n <= m`，剩下的即两数的公共高位前缀。
- 每轮去掉一个 1，复杂度 O(log n)。

**标签：** #algorithm

---

### 59. 4 的幂

**难度：** 简单
**主题：** bit-manipulation, math
**岗位：** T2-3
**级别：** T2

**问题：** 给定整数 `n`，判断是否为 4 的幂。

**思路：** `n > 0 && (n & (n-1)) == 0 && (n & 0x55555555) != 0`。前两个条件保证是 2 的幂；掩码保证唯一的 1 在奇数位。O(1)。常见位技巧热身。

**Python：**
```python
def is_power_of_four(n: int) -> bool:
    return n > 0 and (n & (n - 1)) == 0 and (n & 0x55555555) != 0
```

**TypeScript：**
```typescript
function isPowerOfFour(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0 && (n & 0x55555555) !== 0;
}
```

**Java：**
```java
boolean isPowerOfFour(int n) {
  return n > 0 && (n & (n - 1)) == 0 && (n & 0x55555555) != 0;
}
```

**要点：**
- 前两个条件保证 `n` 是正的 2 的幂。
- 掩码 `0x55555555` 只在偶数位（1、4、16…）有 1。
- 三个条件均 O(1)，无循环也无除法。

**标签：** #algorithm

---

### 60. 基于技术的匹配（均衡分队）

**难度：** 困难
**主题：** dp, partition, subset-sum, gaming
**岗位：** T3-1
**级别：** T3-T4

**问题：** 给定 `2n` 个玩家技术评分的数组，分成两个大小为 `n` 的队，使队伍分差的绝对值最小。对应王者荣耀匹配。

**思路：** 限定恰选 `n` 个的子集和 DP。`dp[k][s]` = 能否选出 `k` 个之和为 `s`。填完后在 `k = n` 的可达 `s` 中找最接近 `total / 2`。O(n * total)。规模更大时启发式/近似。可顺势讨论 MMR 方差、排队时长 vs 匹配质量的权衡。

**Python：**
```python
def min_team_diff(skills: list[int]) -> int:
    total = sum(skills)
    n = len(skills) // 2
    # dp[k] = set of sums achievable using exactly k elements
    dp: list[set[int]] = [set() for _ in range(n + 1)]
    dp[0].add(0)
    for s in skills:
        for k in range(n, 0, -1):
            for prev in dp[k - 1]:
                dp[k].add(prev + s)
    best = total
    for s in dp[n]:
        best = min(best, abs(total - 2 * s))
    return best
```

**TypeScript：**
```typescript
function minTeamDiff(skills: number[]): number {
  const total = skills.reduce((a, b) => a + b, 0);
  const n = skills.length / 2;
  const dp: Array<Set<number>> = Array.from({ length: n + 1 }, () => new Set());
  dp[0].add(0);
  for (const s of skills) {
    for (let k = n; k >= 1; k--) {
      for (const prev of dp[k - 1]) dp[k].add(prev + s);
    }
  }
  let best = total;
  for (const s of dp[n]) best = Math.min(best, Math.abs(total - 2 * s));
  return best;
}
```

**Java：**
```java
int minTeamDiff(int[] skills) {
  int total = 0;
  for (int s : skills) total += s;
  int n = skills.length / 2;
  List<Set<Integer>> dp = new ArrayList<>();
  for (int i = 0; i <= n; i++) dp.add(new HashSet<>());
  dp.get(0).add(0);
  for (int s : skills) {
    for (int k = n; k >= 1; k--) {
      Set<Integer> add = new HashSet<>();
      for (int prev : dp.get(k - 1)) add.add(prev + s);
      dp.get(k).addAll(add);
    }
  }
  int best = total;
  for (int s : dp.get(n)) best = Math.min(best, Math.abs(total - 2 * s));
  return best;
}
```

**要点：**
- `k` 倒序遍历，避免同一玩家被重复纳入。
- 最终在 `dp[n]` 中找最接近 `total / 2` 的可达和。
- 数据规模更大时改用位图 DP 或随机化搜索。

**标签：** #algorithm

---

### 61. 游戏服务器拓扑的最小生成树

**难度：** 中等
**主题：** graph, mst, kruskal, prim, union-find
**岗位：** T2-3
**级别：** T2-T3

**问题：** 给定 `n` 台游戏服务器节点和每对之间专线成本，求互联全部节点的最小总成本。

**思路：** Kruskal 求 MST：排序边，并查集逐条加入最便宜的非成环边，共 `n-1` 条。O(E log E)。Prim + 最小堆 O(E log V)——稠密图更优。腾讯基础设施视角：可讨论按延迟加权 vs 按成本加权。

**Python：**
```python
def min_spanning_tree(n: int, edges: list[tuple[int, int, int]]) -> int:
    parent = list(range(n))
    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    edges.sort(key=lambda e: e[2])
    total, used = 0, 0
    for u, v, w in edges:
        ru, rv = find(u), find(v)
        if ru != rv:
            parent[ru] = rv
            total += w
            used += 1
            if used == n - 1:
                break
    return total if used == n - 1 else -1
```

**TypeScript：**
```typescript
function minSpanningTree(n: number, edges: Array<[number, number, number]>): number {
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  };
  edges.sort((a, b) => a[2] - b[2]);
  let total = 0, used = 0;
  for (const [u, v, w] of edges) {
    const ru = find(u), rv = find(v);
    if (ru !== rv) {
      parent[ru] = rv;
      total += w;
      if (++used === n - 1) break;
    }
  }
  return used === n - 1 ? total : -1;
}
```

**Java：**
```java
int[] parMST;

int minSpanningTree(int n, int[][] edges) {
  parMST = new int[n];
  for (int i = 0; i < n; i++) parMST[i] = i;
  Arrays.sort(edges, (a, b) -> a[2] - b[2]);
  int total = 0, used = 0;
  for (int[] e : edges) {
    int ru = findMST(e[0]), rv = findMST(e[1]);
    if (ru != rv) {
      parMST[ru] = rv;
      total += e[2];
      if (++used == n - 1) break;
    }
  }
  return used == n - 1 ? total : -1;
}

int findMST(int x) {
  while (parMST[x] != x) { parMST[x] = parMST[parMST[x]]; x = parMST[x]; }
  return x;
}
```

**要点：**
- 排序边后，每次贪心选择最小且能连通新分量的边。
- 选满 `n - 1` 条边即可提前结束。
- 图不连通时（合并次数不足）返回 -1。

**标签：** #algorithm

---

### 62. 二分图最大匹配（玩家到服务器分配）

**难度：** 困难
**主题：** graph, matching, hungarian, bipartite, dfs
**岗位：** T3-1
**级别：** T3-T4

**问题：** 给定玩家与游戏服务器及兼容性约束（区域、ping 阈值），最大化将玩家分配到服务器的数量（1 玩家 ↔ 1 服务器，容量内）。

**思路：** 用匈牙利算法（Kuhn）做二分匹配：对每个未匹配玩家，沿增广路径 DFS 找未匹配/可增广路径，沿路径切换匹配。O(V * E)。带权最大匹配可用带势函数的匈牙利或最小费用最大流。规模大时讨论 Hopcroft–Karp 的 O(E√V)。

**Python：**
```python
def max_bipartite_matching(num_players: int, num_servers: int, edges: list[tuple[int, int]]) -> int:
    graph: list[list[int]] = [[] for _ in range(num_players)]
    for p, s in edges:
        graph[p].append(s)
    match_to: list[int] = [-1] * num_servers
    def try_assign(p: int, seen: list[bool]) -> bool:
        for s in graph[p]:
            if seen[s]:
                continue
            seen[s] = True
            if match_to[s] == -1 or try_assign(match_to[s], seen):
                match_to[s] = p
                return True
        return False
    matched = 0
    for p in range(num_players):
        seen = [False] * num_servers
        if try_assign(p, seen):
            matched += 1
    return matched
```

**TypeScript：**
```typescript
function maxBipartiteMatching(numPlayers: number, numServers: number, edges: Array<[number, number]>): number {
  const graph: number[][] = Array.from({ length: numPlayers }, () => []);
  for (const [p, s] of edges) graph[p].push(s);
  const matchTo = new Array<number>(numServers).fill(-1);
  const tryAssign = (p: number, seen: boolean[]): boolean => {
    for (const s of graph[p]) {
      if (seen[s]) continue;
      seen[s] = true;
      if (matchTo[s] === -1 || tryAssign(matchTo[s], seen)) {
        matchTo[s] = p;
        return true;
      }
    }
    return false;
  };
  let matched = 0;
  for (let p = 0; p < numPlayers; p++) {
    const seen = new Array<boolean>(numServers).fill(false);
    if (tryAssign(p, seen)) matched++;
  }
  return matched;
}
```

**Java：**
```java
List<List<Integer>> graphBM;
int[] matchTo;

int maxBipartiteMatching(int numPlayers, int numServers, int[][] edges) {
  graphBM = new ArrayList<>();
  for (int i = 0; i < numPlayers; i++) graphBM.add(new ArrayList<>());
  for (int[] e : edges) graphBM.get(e[0]).add(e[1]);
  matchTo = new int[numServers];
  Arrays.fill(matchTo, -1);
  int matched = 0;
  for (int p = 0; p < numPlayers; p++) {
    boolean[] seen = new boolean[numServers];
    if (tryAssign(p, seen)) matched++;
  }
  return matched;
}

boolean tryAssign(int p, boolean[] seen) {
  for (int s : graphBM.get(p)) {
    if (seen[s]) continue;
    seen[s] = true;
    if (matchTo[s] == -1 || tryAssign(matchTo[s], seen)) { matchTo[s] = p; return true; }
  }
  return false;
}
```

**要点：**
- 每名玩家独立重置 `seen`，保证每次增广搜索互不干扰。
- 增广路径：把已匹配的玩家换到其他服务器即可释放当前位置。
- 数据规模极大时改用 Hopcroft-Karp，复杂度降至 O(E sqrt(V))。

**标签：** #algorithm

---

## 腾讯特有的建议

- **C++ 是真加分项。** 许多基础设施/游戏团队优先招 C++。掌握 C++11/14/17 惯用法（移动语义、智能指针、lambda）、STL、内存模型基础。
- **网络深度。** TCP 内部、内核网络、自定义 UDP 协议——游戏/IM 团队常考。
- **搞清楚你投的是哪个 BG。** IEG（游戏）、WXG（微信）、CSIG（云 + B2B）、TEG（基础设施）、PCG（内容）——文化和技术栈差别很大。
- **开源参与有帮助。** 腾讯主导的：TARS（微服务框架）、ncnn（移动端神经网络推理）、Hippy（跨平台框架）。要具体提及。
- **行为面试比美国轻。** 他们查协作和主动性。别过度排练 STAR——自然一些。

## 参考资料

- 腾讯云文档（尤其游戏和 IM 相关服务）
- 牛客网腾讯面经合集
- 《TCP/IP Illustrated》—— Stevens（网络重头戏轮必备）
- 开源：github.com/Tencent/TarsCpp、github.com/Tencent/ncnn、github.com/Tencent/Hippy
- 《Game Engine Architecture》—— Gregory（游戏后端岗）
