# Tencent

```yaml
company: Tencent (WeChat/Weixin, QQ, Tencent Games, Tencent Cloud, Tencent Video)
typical_rounds: 1 HR screen + 3-5 technical (often interviewer tier: T2.2 → T3.x → T4) + cross-team + HR final
focus_areas: C++/distributed systems, networking, gaming backend, social/messaging at scale
languages_allowed: C++ strongly preferred for game/infra teams; Java/Go for cloud; Python/Node for some web roles
duration: 45-60 min per round
notable_quirks:
  - Networking deep-dives common (TCP internals, UDP-based protocols, kernel networking)
  - Game backend roles probe game loop design, lockstep/state sync, anti-cheat
  - WeChat-scale messaging design comes up for senior roles
  - Behavioral lighter than US companies; focus on collaboration and getting along across BGs (business groups)
  - Multiple business groups (WXG, IEG, CSIG, TEG, PCG) — each has its own culture
sources: 1point3acres, NowCoder (牛客网), LeetCode-cn, niuke.com
```

## Overview

Tencent's interview leans C++ for infrastructure and gaming roles (Tencent runs huge C++ shops behind WeChat, QQ, Honor of Kings, PUBG Mobile, League of Legends backends). Networking knowledge — TCP windowing, NAT traversal, custom UDP protocols, packet loss handling — is expected for game/IM roles. System design centers on social/messaging at WeChat scale (1B+ MAU) and gaming backends (lockstep, state sync, matchmaking). Behavioral is lighter than US firms; they probe collaboration across business groups (BGs) since cross-BG work is structurally hard at Tencent.

## Questions

### 1. Add Two Numbers (Linked List)

**Difficulty:** Medium
**Topics:** linked-list, math
**Position:** SWE
**Years:** T2-T3

**Question:** Two non-negative integers stored as reverse-order linked lists (one digit per node). Return their sum as the same kind of list.

**Approach:** Walk both lists together, carry digit forward. Dummy head, advance result pointer. Watch: lists of different length, final carry → extra node. O(max(n, m)).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Loop condition includes `carry` so a final overflow node is emitted.
- Treat missing digits as 0 when one list is shorter.
- Output is also in reverse order — no extra reversal needed.

**Follow-ups:**
- Digits stored most-significant first — reverse, add, reverse back, or use stacks.
- Subtract two numbers in linked-list form — borrow instead of carry.
- Multiply two numbers in list form.
- Use a doubly linked list to support both forward and backward traversal.

**Common Pitfalls:**
- Forgetting the final carry node when both lists end.
- Treating the shorter list's missing nodes as `null` errors instead of 0.

**Tags:** #algorithm

---

### 2. Add Strings

**Difficulty:** Easy
**Topics:** strings, math
**Position:** SWE
**Years:** T2-T3

**Question:** Given two non-negative integers as strings, return their sum as a string (no using built-in BigInt).

**Approach:** Two pointers from end, carry, append digit. Reverse result. O(max(n, m)). Common Tencent warm-up to check basic correctness coding.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Iterate while either index or carry remains.
- Use char code arithmetic to avoid `parseInt` per digit.
- Append digits in reverse, then reverse the buffer once at the end.

**Follow-ups:**
- Multiply strings without using big-int.
- Add two non-negative integers represented in arbitrary base (binary, hex).
- Add two strings that may contain a decimal point.
- Support negative numbers — dispatch to subtract.

**Common Pitfalls:**
- Forgetting to handle the final carry after the loop.
- Using `Integer.parseInt` per digit — slow and unnecessary.

**Tags:** #algorithm

---

### 3. Linked List Cycle II

**Difficulty:** Medium
**Topics:** linked-list, two-pointer, floyd
**Position:** SWE
**Years:** T2-T3

**Question:** Given a linked list, return the node where the cycle begins, or null if no cycle.

**Approach:** Floyd's tortoise and hare. Slow + fast pointers — if they meet, reset slow to head, advance both by 1; they meet at cycle start. O(n) time, O(1) space. The math (2k = k + nL → k - μ = nL - μ) trips people up — be ready to explain.

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
- After meeting, head-to-start equals meeting-to-start modulo cycle length.
- Works when the cycle starts at head — both pointers stay aligned.
- O(1) space beats a visited-set; both pointers chase at most one full loop.

**Follow-ups:**
- Detect cycle existence only (Linked List Cycle I) — simpler.
- Find the length of the cycle.
- Find the cycle entry in a directed graph using Floyd's algorithm.
- Repair the list by setting the last node's `next` to `null`.

**Common Pitfalls:**
- Advancing `slow` and `fast` before checking equality — may miss the meeting at start.
- Using `slow == fast` for the first check before any move — trivially true and breaks the algorithm.

**Tags:** #algorithm

---

### 4. Permutations

**Difficulty:** Medium
**Topics:** backtracking, recursion
**Position:** SWE
**Years:** T2-T3

**Question:** Given a distinct integer array, return all possible permutations.

**Approach:** Backtracking — swap current index with each subsequent index, recurse, swap back. Or use a `used[]` boolean array. O(n * n!). Follow-up: with duplicates — sort and skip when `used[i-1]` is false and `nums[i] == nums[i-1]`.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Swap-in-place avoids an explicit `used[]` array.
- Always undo the swap on the way back to preserve the array.
- Snapshot via `slice`/`[:]` so later mutations don't corrupt outputs.

**Follow-ups:**
- Permutations II — input has duplicates, dedupe via sort + skip.
- Next Permutation — in-place transformation to the next lex order.
- kth permutation — factoradic, no enumeration.
- Permutations with constraints (no two adjacent equal, etc.).

**Common Pitfalls:**
- Forgetting to take a copy of `nums` before adding to output — later swaps overwrite results.
- Sort-based dedupe but the input was mutated by the swap — invariant lost.

**Tags:** #algorithm

---

### 5. Maximum Subarray (Kadane)

**Difficulty:** Easy
**Topics:** dp, arrays, greedy
**Position:** SWE
**Years:** T2-T3

**Question:** Given an integer array, find the contiguous subarray with the largest sum.

**Approach:** Kadane's: track `current = max(num, current + num)`, `best = max(best, current)`. O(n) time, O(1) space. Handle all-negative case (return single max element). Follow-up: also return start/end indices.

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
- `cur` is the best sum ending at the current index.
- Initialize both to `nums[0]` so all-negative arrays still return the max element.
- Divide-and-conquer also works at O(n log n) but is overkill.

**Follow-ups:**
- Return the actual subarray (start/end indices), not just the sum.
- Maximum *product* subarray — track min and max because of negatives.
- Circular maximum subarray.
- Maximum sum subarray with at most k elements.

**Common Pitfalls:**
- Initializing `cur` and `best` to 0 — fails for all-negative input.
- Adding `nums[0]` twice when the loop starts at index 0 — use `nums[0]` as init and start at 1.

**Tags:** #algorithm

---

### 6. Reverse a String In-Place

**Difficulty:** Easy
**Topics:** strings, two-pointer
**Position:** SWE
**Years:** T2

**Question:** Reverse a `char[]` in-place. Then: reverse word order in a sentence in-place (`"the sky is blue"` → `"blue is sky the"`).

**Approach:** Part 1: two pointers swap. Part 2: reverse whole string, then reverse each word. O(n) time, O(1) extra. Tencent C++ classic — interviewers also ask about `std::string` SSO and copy-on-write semantics in pre-C++11.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Reverse the whole buffer first, then reverse each word in place.
- Strings in Python/JS are immutable, so the input is a mutable `list`/`array` of chars.
- O(1) extra space — only index variables are added.

**Follow-ups:**
- Reverse Words in a String (LeetCode 151) — collapse multiple spaces.
- Reverse only the vowels in a string.
- Reverse a sentence in-place but preserve trailing punctuation positions.
- Reverse a string of UTF-8 bytes safely (don't split multi-byte chars).

**Common Pitfalls:**
- Using `s[::-1]` when interviewer asked for in-place — O(n) extra space.
- Splitting on a single space and missing multi-space separators.

**Tags:** #coding

---

### 7. Lowest Common Ancestor of BST

**Difficulty:** Easy
**Topics:** tree, bst, recursion
**Position:** SWE
**Years:** T2-T3

**Question:** Given a BST and two nodes `p` and `q`, find their LCA.

**Approach:** BST property: if both p and q < root, recurse left; if both >, recurse right; else current is LCA. O(h) time, O(1) iterative. Don't over-engineer for general binary tree.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- The first node that splits `p` and `q` across its subtrees is the LCA.
- Iterative form is O(1) extra space.
- Equality (one target equals current) also makes current the LCA.

**Follow-ups:**
- LCA of a general binary tree (no BST property) — recursive O(n).
- LCA when nodes have parent pointers — two-pointer like LL intersection.
- LCA of multiple nodes, not just two.
- LCA queries in batches — Tarjan offline algorithm.

**Common Pitfalls:**
- Confirming both nodes are actually in the tree — if not, return value is undefined.
- Treating BST LCA the same as general binary tree LCA — BST property allows O(h) without recursion.

**Tags:** #algorithm

---

### 8. Min Stack

**Difficulty:** Easy
**Topics:** stack, design
**Position:** SWE
**Years:** T2-T3

**Question:** Design a stack supporting `push`, `pop`, `top`, and `getMin`, all in O(1).

**Approach:** Two stacks: main stack + min stack (push min to min stack only when new value ≤ current min; pop in sync). Or single stack of `(value, current_min)` pairs. O(1) all ops.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Each entry carries the running min so all ops are O(1).
- Alternative two-stack design saves space when many duplicates of min are pushed.
- Empty-stack handling depends on the problem contract; here methods assume non-empty.

**Follow-ups:**
- Max Stack (return max in O(1)) and `popMax` in O(log n).
- Queue using two stacks — amortized O(1) per op.
- Min/Max in a sliding window — monotonic deque.
- Thread-safe Min Stack — synchronize or lock-free.

**Common Pitfalls:**
- Storing only the global min in a separate single variable — wrong after `pop` of the min element.
- Off-by-one when accessing the previous min after a pop — always carry running min per entry.

**Tags:** #coding

---

### 9. Design WeChat Messaging Backend

**Difficulty:** Hard
**Topics:** system-design, im, websockets, presence, scale
**Position:** Senior SWE
**Years:** T3-T4

**Question:** Design WeChat's messaging backend supporting 1B+ MAU, 1:1 chat, group chat (up to 500 members), and global presence.

**Approach:** Persistent TCP/MQTT connection from each client to nearest access gateway (sharded by user_id). Messages flow gateway → routing service (looks up recipient's gateway via online registry) → recipient gateway → device. Offline messages persisted to KV store; pushed on reconnect. Group chat: fan-out at the per-group routing service; for 500 members, that's tractable. Presence: in-memory store per region, gossip globally with TTL'd entries (eventual consistency OK). Persist messages 7 days in hot store + 90 days cold. Discuss: end-to-end encryption (Tencent historically not E2E for compliance with Chinese law — call this out honestly), message ordering within a chat (sequence numbers per chat), multi-device sync, and very large group support (broadcast groups have different design).

**Follow-ups:**
- Multi-device sync — logged in on phone + laptop, same message arrives consistently.
- Message ordering across devices — server-issued sequence per chat.
- Very large groups (broadcast "公众号"-style) — push goes pull, with cursor.
- Offline-to-online catch-up — stream window vs full pull.
- Cross-region latency for international users — anycast gateway or per-region routing?

**Common Pitfalls:**
- Promising E2E encryption when the design actually mirrors / archives messages.
- Naive fan-out for large groups — doesn't scale beyond ~500 members.

**Tags:** #system-design

---

### 10. Design WeChat Moments (朋友圈)

**Difficulty:** Hard
**Topics:** system-design, feed, privacy, fanout
**Position:** Senior SWE
**Years:** T3-T4

**Question:** Design WeChat Moments — friends-only feed where posts are visible only to mutual friends, with strict privacy controls.

**Approach:** Closed-graph feed (unlike Twitter/Weibo) — only mutual friends see posts. Hybrid push/pull as in News Feed. Critical privacy property: comments and likes on a post are visible only to mutual friends of the *poster*. So when displaying a post, server filters comments to those by people the viewer is also friends with — done at read time via friend-graph intersection (cache the intersection result). Photos in CDN with signed short-lived URLs (no public discoverable URL). Discuss: "三天可见" (visible-for-3-days) implemented as a per-post TTL flag, message-style notification on comment/like (via the IM system from Q9), and how to handle a viral post (rare in closed graph, but possible — cache aggressively).

**Follow-ups:**
- "仅三天可见" (3-day visibility) — store as TTL or filter at read?
- Block / un-friend invalidation — cached feed must update immediately.
- Photo URL re-share via screenshot — add visible watermark or accept the leak?
- Cross-region replication — user travels abroad, where is the feed served from?
- Friend-graph intersection cost at read time — cache, precompute, or both?

**Common Pitfalls:**
- Showing comments from non-mutual friends — privacy violation, very visible bug.
- Hot post in a closed graph — still possible if one friend is influential, plan for it.

**Tags:** #system-design

---

### 11. Design a Multiplayer Game Server (Honor of Kings-style)

**Difficulty:** Hard
**Topics:** system-design, gaming, low-latency, state-sync
**Position:** Senior SWE
**Years:** T3-T4

**Question:** Design the backend for a real-time 5v5 MOBA game like Honor of Kings. Latency budget: <100ms perceived.

**Approach:** Matchmaking service (skill + region + party-aware) → game server allocator (Kubernetes pool of dedicated game servers across regions). Game server runs authoritative simulation. **Frame sync (lockstep)**: clients send inputs only (small packets), all clients run identical deterministic simulation in lockstep, advance frame when all inputs received. Tencent's choice for MOBAs — bandwidth tiny, anti-cheat via input-only model. Tradeoff: 1 slow client = everyone waits. **State sync**: server simulates, sends state diffs — used by FPS. Network: custom UDP protocol (with reliability layer); TCP unacceptable for game traffic. Discuss: clock sync (NTP-ish), packet loss tolerance (resend inputs, predict for state-sync), reconnect (replay inputs from last frame), and cheat detection (server-side replay for sample matches).

**Tags:** #system-design

---

### 12. Design QQ / WeChat Voice & Video Call

**Difficulty:** Hard
**Topics:** system-design, webrtc, sfu, nat-traversal, codecs
**Position:** Senior SWE
**Years:** T3-T4

**Question:** Design the voice/video call infrastructure for WeChat (1:1 and multi-party up to 9).

**Approach:** Signaling over the IM channel (SDP offer/answer through messaging). Media: WebRTC-style with ICE for NAT traversal (STUN/TURN servers). For 1:1, P2P preferred (lower latency, less server cost). For multi-party, SFU (Selective Forwarding Unit) — each client uploads one stream, server forwards to N-1 others without transcoding (low latency, scales reasonably). Codecs: Opus audio, H.264/H.265 video, adaptive bitrate. Echo cancellation, noise suppression, jitter buffer on client. Discuss: TURN relay cost (many users behind symmetric NAT), regional media servers, and bandwidth adaptation under network degradation.

**Tags:** #system-design

---

### 13. Design Tencent Cloud Object Storage (COS)

**Difficulty:** Hard
**Topics:** system-design, blob-storage, replication, consistency, cloud
**Position:** Senior SWE
**Years:** T3-T4

**Question:** Design Tencent COS — object storage API-compatible with S3.

**Approach:** Front-end S3-compatible API → metadata service (sharded by bucket+key) → storage layer with erasure coding (Reed-Solomon 10+4) across many nodes/racks/AZs. Strong consistency within a region via metadata coordinator (Paxos). Multi-region async replication for DR. Discuss: erasure coding vs 3x replication trade-offs (~50% storage savings, more CPU/network on read), large object multipart upload, lifecycle to cold storage (Archive Storage equivalent), and how to handle a hot key (CDN + replica fan-out for popular reads).

**Tags:** #system-design

---

### 14. Design a Live Streaming Gift / Bullet-Comment System

**Difficulty:** Hard
**Topics:** system-design, real-time, fanout, monetization, big-data
**Position:** Senior SWE
**Years:** T3-T4

**Question:** Design the gift-sending and bullet-comment system for Tencent Video / NOW Live where viewers can send virtual gifts (with payment) and chat in real-time during a live broadcast.

**Approach:** Gift purchase: transactional flow (debit user wallet → record gift event → broadcast). Wallet write is the consistency-critical step; rest can be eventual. Comment/gift event → per-stream Kafka topic → fan out to viewer WebSocket gateways. On very hot streams (1M+ concurrent), throttle and sample for display; persist all to DB. Big-spender effects (special animations) prioritized in the broadcast queue. Discuss: anti-fraud on gifts (sudden spike from one user = potential card fraud), tax/compliance for streamer revenue share, and graceful degradation when the stream becomes too hot (drop low-value comments first).

**Tags:** #system-design

---

### 15. Tell me about a time you collaborated across teams

**Difficulty:** Medium
**Topics:** behavioral, collaboration, cross-bg
**Position:** SWE
**Years:** T2-T3

**Question:** Tell me about a time you had to work with another team or BG to deliver a project. What was hard about it?

**Approach:** Tencent's BG structure makes cross-team work culturally hard — they probe whether you can navigate it. Show: (1) you built the relationship early (didn't just escalate when blocked), (2) you understood their priorities (different OKRs, different leadership), (3) you proposed a win-win framing, (4) you delivered together. Mentioning specific friction (resource allocation, schedule misalignment) and how you resolved it lands well.

**Tags:** #behavioral

---

### 16. Time you proactively fixed something not in your scope

**Difficulty:** Medium
**Topics:** behavioral, ownership, initiative
**Position:** SWE
**Years:** T2-T3

**Question:** Tell me about a time you noticed a problem and fixed it without being asked.

**Approach:** Tencent values "主动" (proactive) engineers. Show: (1) the specific problem (production bug, tech debt, missing tool), (2) you didn't wait for prioritization — you spent personal time or off-cycle, (3) you made sure your fix was reviewed and adopted (didn't just commit cowboy-style), (4) impact: it helped the team measurably. Don't pick a story where the fix was actually your direct responsibility.

**Tags:** #behavioral

---

### 17. Time you handled a production incident

**Difficulty:** Medium
**Topics:** behavioral, incident-response, ownership, ops
**Position:** Senior SWE
**Years:** T3-T4

**Question:** Walk me through a production incident you led. What happened, how did you respond, and what changed afterward?

**Approach:** Pick a real incident (not a "near miss"). Show: (1) you triaged with cool head — mitigation first, RCA later, (2) you communicated to stakeholders during (status updates every 15-30 min), (3) you ran a blameless retro that produced concrete action items, (4) you followed up on the action items not just filed them. Quantify the impact (downtime minutes, users affected) and the post-fix improvement (MTTR cut by X).

**Tags:** #behavioral

---

### 18. Why Tencent

**Difficulty:** Easy
**Topics:** behavioral, motivation, fit
**Position:** SWE
**Years:** T2-T3

**Question:** Why do you want to join Tencent specifically, and which BG/team?

**Approach:** Show specificity. Don't say "big company" or "stock." Pick: (1) a specific product (WeChat ecosystem, a game you love and want to work on), (2) a technical area Tencent is strong in (game tech, IM, cloud), (3) the BG culture (IEG for games, WXG for WeChat — quite different). Mentioning open-source contributions Tencent has made (TARS, ncnn for ML inference) shows you've done homework.

**Tags:** #behavioral

---

### 19. TCP deep dive: why does TCP throughput drop on a high-RTT link?

**Difficulty:** Hard
**Topics:** networking, tcp, performance
**Position:** Senior SWE
**Years:** T3-T4

**Question:** A service running cross-region (Shanghai → US-East, 200ms RTT) shows TCP throughput much lower than the available bandwidth. Why? How would you fix it?

**Approach:** Bandwidth-Delay Product (BDP): on a high-RTT link, throughput = window_size / RTT. Default TCP send/recv buffers may be too small — calculate: 1 Gbps × 0.2s = 200 Mbits = 25 MB BDP, but default Linux send buffer is ~4MB. Fixes: (1) increase `net.ipv4.tcp_rmem` / `tcp_wmem`, (2) enable TCP window scaling (RFC 7323 — usually on by default but check), (3) switch congestion control algorithm to BBR (better on high-BDP than CUBIC), (4) use parallel connections to multiply effective throughput, (5) for true bulk transfer, consider QUIC or UDP-based protocols. Mention measurement: `tc`, `ss -i`, `iperf3` to baseline. Tencent has built custom transport protocols precisely for this reason (e.g., for cross-region game traffic).

**Tags:** #domain-knowledge

---

### 20. Anti-cheat in a real-time multiplayer game

**Difficulty:** Hard
**Topics:** gaming, security, anti-cheat
**Position:** Senior SWE
**Years:** T3-T4

**Question:** A new PUBG Mobile cheating tool is widespread (aimbot + wallhack). Walk through how you'd architect anti-cheat to detect and respond.

**Approach:** Multi-layered: (1) **Server authority** — never trust client-reported damage/position; server runs hit detection. Wallhack requires the *client* to render data it shouldn't have — fix by not sending data about enemies the player can't see (visibility culling). Trade-off: more server CPU. (2) **Behavioral detection** — server-side ML on aim trajectories, headshot ratios, reaction times; flag outliers for review/shadowban. (3) **Client integrity** — anti-tampering (code obfuscation, native checksums, kernel-mode anti-cheat for PC). Detect known cheat signatures. (4) **Reporting + replay** — player reports trigger server-side replay review, sometimes by ML. (5) **Soft penalties** — shadowban (matchmake cheaters together) before hardban (gives cheat-makers less signal to iterate). Discuss false-positive cost (banning honest players is catastrophic for retention) and the perpetual cat-and-mouse nature.

**Tags:** #domain-knowledge

---

### 21. Network Delay Time

**Difficulty:** Medium
**Topics:** graph, dijkstra, shortest-path
**Position:** T2-3
**Years:** T2-T3

**Question:** Given `n` nodes and a list of weighted directed edges `(u, v, w)` representing a signal travel time, find the time it takes for a signal sent from node `k` to reach all nodes. Return -1 if impossible.

**Approach:** Single-source shortest path → Dijkstra with min-heap. Build adjacency list, relax neighbors, push to heap. Answer is max distance among all nodes; if any node unreachable, return -1. O((V + E) log V). Tencent IM-routing variant.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Skip a popped node if it is already finalized in `dist`.
- Answer is the latest arrival across all nodes.
- Unreachable nodes leave `dist` smaller than `n` → return -1.

**Tags:** #algorithm

---

### 22. Cheapest Flights Within K Stops

**Difficulty:** Medium
**Topics:** graph, bfs, dp, bellman-ford
**Position:** T2-3
**Years:** T2-T3

**Question:** Given `n` cities, weighted flights, source `src`, destination `dst`, and max `k` stops, return the cheapest price (or -1).

**Approach:** Bellman-Ford limited to `k+1` relaxations — copy `dist` before each round to avoid same-round multi-hop. O(k * E). Alternative: Dijkstra with state `(cost, node, stops_used)` and prune by stops. Common pitfall: mutating distances in-place violates the stop constraint.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Snapshot `dist` per round so a relaxation uses values from the previous hop count only.
- `k + 1` relaxation rounds correspond to up to `k` intermediate stops.
- Mutating `dist` in place would over-count hops in a single round.

**Tags:** #algorithm

---

### 23. Path with Maximum Probability

**Difficulty:** Medium
**Topics:** graph, dijkstra, shortest-path
**Position:** T2-3
**Years:** T2-T3

**Question:** Given an undirected graph where each edge has a success probability, find the path from `start` to `end` with the maximum probability of success.

**Approach:** Dijkstra variant with a max-heap, multiplying probabilities (or use `-log(p)` to convert to standard min-cost shortest path). Track `prob[node]`, relax via `prob[v] = max(prob[v], prob[u] * w)`. O((V + E) log V).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Negate probabilities to reuse a min-heap as a max-heap.
- Multiplication keeps numbers in [0, 1]; no log conversion needed.
- Early-return on popping `end` since Dijkstra finalizes nodes in optimal order.

**Tags:** #algorithm

---

### 24. Minimum Number of Refueling Stops

**Difficulty:** Hard
**Topics:** greedy, heap, dp
**Position:** T3-1
**Years:** T3-T4

**Question:** A car starts with `startFuel` and must reach `target`. Stations along the way provide fuel `stations[i] = [position, liters]`. Return the min number of refuels needed (or -1).

**Approach:** Greedy with max-heap. Drive as far as possible; when you can't reach the next station/target, refuel from the most-fuel-providing station you've passed (pop max-heap). Increment refuel count. O(n log n). Elegant alternative: DP on stops, but heap is cleaner.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Treat passed stations as a "fuel reserve" — only consume when stuck.
- Always pick the largest passed reserve to maximize range gained per refuel.
- Stations are assumed sorted by position; if not, sort first.

**Tags:** #algorithm

---

### 25. Bus Routes

**Difficulty:** Hard
**Topics:** graph, bfs
**Position:** T3-1
**Years:** T3

**Question:** Given an array `routes[i]` of bus stops served by bus `i`, return the minimum number of buses to take from `source` to `target`.

**Approach:** BFS over *buses*, not stops. Build `stop → buses[]` map. Queue holds buses; visiting a bus visits all its stops; each unvisited stop enqueues all other buses through it. Mark buses (not stops) visited. O(N * S) where N = buses, S = avg stops.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Marking buses (not just stops) avoids re-expanding entire routes.
- BFS yields the minimum number of bus rides.
- Source == target needs an explicit 0 short-circuit.

**Tags:** #algorithm

---

### 26. Critical Connections in a Network

**Difficulty:** Hard
**Topics:** graph, dfs, tarjan, bridges
**Position:** T3-1
**Years:** T3-T4

**Question:** Given an undirected network of `n` servers and connections, return all critical connections (bridges) — removing which disconnects some server.

**Approach:** Tarjan's bridge-finding DFS. Track `disc[u]` (discovery time) and `low[u]` (lowest reachable ancestor). Edge `(u, v)` is a bridge iff `low[v] > disc[u]`. Skip parent edge. O(V + E). Tencent infra/networking favorite.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- `low[v] > disc[u]` means the subtree at v cannot reach u without using edge (u, v).
- Skip the immediate parent so an undirected edge isn't counted as a back-edge.
- Iterative version is needed for very deep graphs to avoid stack overflow.

**Tags:** #algorithm

---

### 27. Number of Connected Components in an Undirected Graph

**Difficulty:** Medium
**Topics:** graph, union-find, dfs
**Position:** T2-3
**Years:** T2-T3

**Question:** Given `n` nodes and an edge list, return the number of connected components.

**Approach:** Union-Find with path compression + union by rank. Each edge → union. Count distinct roots. O(E α(N)) ≈ O(E). Alternative: DFS/BFS from each unvisited node, count starts. Building block for friend-graph features.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Start with `n` singletons; each successful union reduces the count by 1.
- Path compression keeps amortized cost near O(α(n)).
- Union by rank is optional but useful on adversarial inputs.

**Tags:** #algorithm

---

### 28. Number of Provinces (Friend Circles)

**Difficulty:** Medium
**Topics:** graph, union-find, dfs
**Position:** T2-3
**Years:** T2-T3

**Question:** Given an `n x n` adjacency matrix `isConnected` where `isConnected[i][j] = 1` means city `i` and `j` are directly connected, return the number of provinces (connected components).

**Approach:** Union-find or DFS on rows: for each unvisited city, DFS all reachable cities, increment province count. O(n^2). Direct WeChat friend-circle analog — Tencent loves the framing.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Each DFS launch corresponds to one new province.
- The adjacency matrix is symmetric — no need to handle reverse direction specially.
- Union-find variant fits incremental "add friendship" streaming scenarios better.

**Tags:** #algorithm

---

### 29. Redundant Connection

**Difficulty:** Medium
**Topics:** graph, union-find, cycle
**Position:** T2-3
**Years:** T2-T3

**Question:** A tree of `n` nodes has one extra edge added, forming a cycle. Return the edge that can be removed so the graph is a tree again. If multiple, return the one appearing last.

**Approach:** Process edges in order, union endpoints. The first edge whose endpoints already share a root is the answer. O(n α(n)). Classic union-find application.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Edges are processed in input order so the first cycle-closer is the answer.
- Path compression keeps each `find` near-constant.
- Returning the last cycle-closing edge satisfies the "appearing last" tiebreak naturally.

**Tags:** #algorithm

---

### 30. Course Schedule

**Difficulty:** Medium
**Topics:** graph, topological-sort, dfs, bfs
**Position:** T2-3
**Years:** T2-T3

**Question:** Given `numCourses` and prerequisite pairs `[a, b]` meaning take `b` before `a`, determine if you can finish all courses.

**Approach:** Cycle detection in a directed graph. BFS Kahn's: compute in-degrees, enqueue zeros, pop and decrement neighbors. If processed count = `numCourses`, no cycle. Or DFS with 3-color marking (white/gray/black). O(V + E).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- A cycle leaves some nodes with `indeg > 0` forever — `done < numCourses`.
- Edge `b -> a` means b is a prerequisite of a.
- Same skeleton extends to topological order output.

**Tags:** #algorithm

---

### 31. Course Schedule II

**Difficulty:** Medium
**Topics:** graph, topological-sort
**Position:** T2-3
**Years:** T2-T3

**Question:** Same setup as Course Schedule, but return a valid order to take all courses, or empty array if impossible.

**Approach:** Kahn's topological sort: BFS from in-degree-0 nodes, append to order as popped. If `order.size() != numCourses`, cycle exists → return `[]`. O(V + E). Show you understand it's any valid order, not unique.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Output order tracks Kahn's pop order — any valid topological order is acceptable.
- Cycle detection still piggybacks on the processed-count check.
- Use a priority queue if a lexicographically smallest order is required.

**Tags:** #algorithm

---

### 32. Alien Dictionary

**Difficulty:** Hard
**Topics:** graph, topological-sort, strings
**Position:** T3-1
**Years:** T3

**Question:** Given a list of words sorted lexicographically by an unknown alphabet, derive a valid character order. Return empty string if no valid order or contradiction (e.g., `["abc", "ab"]`).

**Approach:** Build a directed graph from adjacent-word first-differing chars. Topological sort. Edge cases: prefix conflict (`["abc","ab"]` invalid), cycles in derived graph. O(total chars). Tencent loves this one — combines parsing + topo.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Only the first differing character between consecutive words yields an edge.
- Prefix conflict (`"abc"` before `"ab"`) is invalid — detect and return `""`.
- A cycle in the derived graph also yields `""`.

**Tags:** #algorithm

---

### 33. Stone Game

**Difficulty:** Medium
**Topics:** dp, game-theory, minimax
**Position:** T2-3
**Years:** T2-T3

**Question:** Even-length piles array. Two players alternate taking either the leftmost or rightmost pile. Both play optimally. Return true if player 1 wins.

**Approach:** DP `dp[i][j] = max(piles[i] - dp[i+1][j], piles[j] - dp[i][j-1])` representing best score-diff achievable for the current player on `piles[i..j]`. Answer: `dp[0][n-1] > 0`. O(n^2) time/space. Trick answer: always true for even n with even total, but interviewer wants the DP.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- `dp[i][j]` is the maximum score difference the player-to-move can guarantee.
- Fill by interval length so all needed sub-intervals exist first.
- Both players are optimal — the subtractive recurrence already encodes that.

**Tags:** #algorithm

---

### 34. Nim Game

**Difficulty:** Easy
**Topics:** game-theory, math
**Position:** T2-3
**Years:** T2-T3

**Question:** A pile of `n` stones. Players alternate removing 1, 2, or 3 stones. The player taking the last stone wins. You go first — can you always win?

**Approach:** Losing position iff `n % 4 == 0`. Whoever faces a multiple of 4 loses with optimal play (opponent mirrors to keep you at multiples of 4). O(1). Be ready to prove inductively.

**Python:**
```python
def can_win_nim(n: int) -> bool:
    return n % 4 != 0
```

**TypeScript:**
```typescript
function canWinNim(n: number): boolean {
  return n % 4 !== 0;
}
```

**Java:**
```java
boolean canWinNim(int n) {
  return n % 4 != 0;
}
```

**Key points:**
- Multiples of 4 are losing positions; everything else is winning.
- Mirror strategy: opponent always responds with `4 - your_take` to keep you stuck.
- Inductive proof: from any `n % 4 != 0`, you can move to a multiple of 4.

**Tags:** #algorithm

---

### 35. Predict the Winner

**Difficulty:** Medium
**Topics:** dp, game-theory, minimax, recursion
**Position:** T2-3
**Years:** T2-T3

**Question:** Given a score array, two players alternately pick from either end. Return true if player 1 can win or tie with optimal play.

**Approach:** Same DP as Stone Game: `dp[i][j]` = max score-diff current player can achieve on `nums[i..j]`. Top-down memo also works. O(n^2). Answer: `dp[0][n-1] >= 0`. Tencent variant: ask about space optimization to O(n) using 1D rolling.

**Python:**
```python
def predict_the_winner(nums: list[int]) -> bool:
    n = len(nums)
    dp = nums[:]  # dp[i] for current j; init j=i
    for i in range(n - 2, -1, -1):
        for j in range(i + 1, n):
            dp[j] = max(nums[i] - dp[j], nums[j] - dp[j - 1])
    return dp[n - 1] >= 0
```

**TypeScript:**
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

**Java:**
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

**Key points:**
- 1D rolling array works because `dp[i][j]` depends only on `dp[i+1][j]` and `dp[i][j-1]`.
- Initialize `dp[j] = nums[j]` to represent the base case `i == j`.
- Return `>= 0` so ties also count as a player-1 win.

**Tags:** #algorithm

---

### 36. Can I Win

**Difficulty:** Medium
**Topics:** dp, game-theory, bitmask, memoization
**Position:** T3-1
**Years:** T3

**Question:** Numbers 1..`maxChoosableInteger`, no replacement. Players alternate picking; first to push the running total ≥ `desiredTotal` wins. Return true if first player can force a win.

**Approach:** Bitmask DP over chosen-set state (`maxChoosable ≤ 20`). Memo `state → win/lose`. For each unchosen number, if picking it wins immediately OR opponent loses from new state, current player wins. Edge cases: if sum < target → impossible (false). O(2^n * n).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Bitmask captures the set of used numbers — fits within an int for `n ≤ 20`.
- Memoize by `state` alone since `remaining` is uniquely determined by `state`.
- Early-impossible: if total of all numbers < target, no one can win.

**Tags:** #algorithm

---

### 37. Flip Game II

**Difficulty:** Medium
**Topics:** game-theory, dp, memoization, sprague-grundy
**Position:** T3-1
**Years:** T3

**Question:** A string of `+` and `-`. A move flips two consecutive `++` to `--`. Return true if the starting player can guarantee a win.

**Approach:** Recursion + memoization on string state. For each `++` position, flip, recurse opponent — if opponent loses, current wins. Optimize with Sprague-Grundy theorem (XOR of independent runs' Grundy numbers) for O(n^2). Without SG, exponential worst case.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Current player wins iff some move leaves the opponent in a losing state.
- Memoize per string state to avoid recomputing common positions.
- Grundy numbers can collapse runs to O(n^2) but the memoized recursion is simpler.

**Tags:** #algorithm

---

### 38. Guess Number Higher or Lower II

**Difficulty:** Medium
**Topics:** dp, minimax, game-theory
**Position:** T3-1
**Years:** T3

**Question:** Pick a number 1..n. Each guess `x` costs `$x`; you're told higher/lower until correct. Return the minimum money guaranteed to win, assuming worst-case answer placement.

**Approach:** Minimax DP. `dp[i][j]` = min money for range `[i, j]`. Try every `k` as guess: `cost(k) = k + max(dp[i][k-1], dp[k+1][j])`. Take min over k. O(n^3). Interval DP — fill by length.

**Python:**
```python
def get_money_amount(n: int) -> int:
    dp = [[0] * (n + 2) for _ in range(n + 2)]
    for length in range(2, n + 1):
        for i in range(1, n - length + 2):
            j = i + length - 1
            dp[i][j] = min(k + max(dp[i][k - 1], dp[k + 1][j]) for k in range(i, j))
    return dp[1][n]
```

**TypeScript:**
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

**Java:**
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

**Key points:**
- Worst-case minimax: opponent (the hidden number) picks the worse branch.
- Range length ordering ensures sub-ranges are filled first.
- Indices are 1-based to match the value range `[1, n]`.

**Tags:** #algorithm

---

### 39. Wildcard Matching

**Difficulty:** Hard
**Topics:** dp, strings
**Position:** T3-1
**Years:** T3

**Question:** Implement wildcard pattern matching with `?` (any single char) and `*` (any sequence including empty). Return whether the pattern matches the full string.

**Approach:** 2D DP `dp[i][j]` = match `s[0..i)` vs `p[0..j)`. Star: `dp[i][j] = dp[i][j-1] (empty) || dp[i-1][j] (extend)`. Question mark: `dp[i][j] = dp[i-1][j-1]`. Initialize `dp[0][j]` for leading stars. O(n*m).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- `*` means either match nothing (`dp[i][j-1]`) or extend the match (`dp[i-1][j]`).
- Leading `*`-only prefixes must seed `dp[0][j]` to true.
- `?` matches exactly one character — handle like a literal match.

**Tags:** #algorithm

---

### 40. Regular Expression Matching

**Difficulty:** Hard
**Topics:** dp, strings, recursion
**Position:** T3-1
**Years:** T3-T4

**Question:** Implement regex matching with `.` (any single char) and `*` (zero or more of preceding element). Match whole string.

**Approach:** DP `dp[i][j]`. If `p[j-1] == '*'`: zero occurrences (`dp[i][j-2]`) OR one+ if `s[i-1]` matches `p[j-2]` (`dp[i-1][j]`). Else: char/dot match → `dp[i-1][j-1]`. Tricky init for patterns like `a*b*c*`. O(n*m).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- `x*` either skips itself (`dp[i][j-2]`) or matches one more character (`dp[i-1][j]`).
- Initialize `dp[0][j]` for patterns like `a*b*c*` that match empty strings.
- `.` substitutes for any single character — handle inside the `*` branch too.

**Tags:** #algorithm

---

### 41. Longest Palindromic Substring

**Difficulty:** Medium
**Topics:** strings, dp, two-pointer
**Position:** T2-3
**Years:** T2-T3

**Question:** Return the longest palindromic substring of `s`.

**Approach:** Expand-around-center: for each i, expand for odd and even-length palindromes; track longest. O(n^2) time, O(1) space. For O(n) — Manacher's algorithm (interviewer rarely demands but bonus). Don't confuse with longest palindromic *subsequence*.

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

**Key points:**
- Try both odd (single-character center) and even (two-character center) expansions.
- Track best by length comparison, avoiding repeated substring slicing.
- Manacher gets O(n), but expand-around-center is plenty for typical sizes.

**Tags:** #algorithm

---

### 42. Longest Palindromic Subsequence

**Difficulty:** Medium
**Topics:** dp, strings
**Position:** T2-3
**Years:** T2-T3

**Question:** Return the length of the longest palindromic subsequence in `s` (not necessarily contiguous).

**Approach:** Interval DP `dp[i][j]` = LPS length in `s[i..j]`. If `s[i] == s[j]`: `dp[i][j] = dp[i+1][j-1] + 2`. Else: `max(dp[i+1][j], dp[i][j-1])`. Fill by length. O(n^2). Trick: equals LCS of `s` and reverse(`s`).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Interval DP filled by length so subproblems are ready.
- Each character alone is a palindrome of length 1 — seed the diagonal.
- Equivalent to LCS of `s` with its reverse, in O(n^2).

**Tags:** #algorithm

---

### 43. Palindrome Partitioning

**Difficulty:** Medium
**Topics:** backtracking, dp, strings
**Position:** T2-3
**Years:** T2-T3

**Question:** Partition `s` so every substring is a palindrome. Return all such partitions.

**Approach:** Backtracking: at index `i`, try every prefix `s[i..j]`; if palindrome, recurse from `j+1`. Precompute palindrome table `isP[i][j]` in O(n^2) for speedup. Total O(n * 2^n) worst-case (exponential outputs).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Precomputed `isP` makes palindrome checks O(1) during backtracking.
- Use a shared mutable `path` and snapshot it on completion.
- Worst-case exponential output (e.g., string of all same chars).

**Tags:** #algorithm

---

### 44. Word Break II

**Difficulty:** Hard
**Topics:** dp, backtracking, memoization, trie
**Position:** T3-1
**Years:** T3

**Question:** Given string `s` and dictionary, return all sentences where `s` can be space-segmented into dictionary words.

**Approach:** Backtracking + memoization on suffix → list of sentences. For each split point producing a dictionary word prefix, recurse on the suffix. Cache results per starting index. Trie for prefix lookup speeds the prefix scan. Worst case exponential (output-bound).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Memoize by suffix start index so each index is expanded once.
- Empty-rest sentinel `""` signals a clean termination at the end.
- Trie/longest-prefix optimization helps when the dictionary is large.

**Tags:** #algorithm

---

### 45. Concatenated Words

**Difficulty:** Hard
**Topics:** dp, trie, strings
**Position:** T3-1
**Years:** T3

**Question:** Given an array of unique strings, return all strings that are concatenations of at least two other strings in the array.

**Approach:** For each word, run a Word Break DP using the set of all *other* words (or all words, requiring `>=2` segments). `dp[i]` true if `word[0..i)` is a valid segmentation. Optimize: sort by length, use a growing set. O(N * L^2) typical.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Sorting by length lets the dictionary only contain shorter words.
- A concatenated word requires at least two parts, enforced naturally because the word itself isn't in `seen` yet.
- O(N * L^2) total — each word does Word Break against an incremental set.

**Tags:** #algorithm

---

### 46. Number of Atoms

**Difficulty:** Hard
**Topics:** stack, parsing, hashmap, strings
**Position:** T3-1
**Years:** T3

**Question:** Parse a chemical formula like `"K4(ON(SO3)2)2"` and return atom counts in sorted order: `"K4N2O14S4"`.

**Approach:** Stack of hashmaps. Scan: atom name then optional count → add to top map. `(` → push new map. `)` then optional count → pop, multiply counts, merge into new top. End: sort keys, build result string.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Stack of count maps mirrors nested groups exactly.
- An atom token is one uppercase letter followed by zero or more lowercase letters.
- Final output sorts atoms alphabetically and omits the count when it equals 1.

**Complexity:** O(n) single pass to parse the formula (the stack of count maps holds at most O(n) atoms), plus O(k log k) to sort the k distinct atoms for output.

**Tags:** #algorithm

---

### 47. Basic Calculator II

**Difficulty:** Medium
**Topics:** stack, parsing, strings
**Position:** T2-3
**Years:** T2-T3

**Question:** Evaluate a string expression with `+ - * /` and non-negative integers (no parentheses). Integer division truncates toward zero.

**Approach:** Single-pass with a stack. Track current number and previous operator. On operator or end: if prev is `+` push num; `-` push `-num`; `*` or `/` pop and combine. Final result = sum of stack. O(n). Variant with parentheses → recursion or extra stack.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Buffer the current number then commit when an operator or end arrives.
- `*` and `/` mutate the top of the stack (precedence baked in).
- Integer division truncates toward zero — use `int(a / b)` / `Math.trunc`, not floor.

**Tags:** #algorithm

---

### 48. Decode String

**Difficulty:** Medium
**Topics:** stack, parsing, recursion, strings
**Position:** T2-3
**Years:** T2-T3

**Question:** Decode strings like `"3[a2[c]]"` → `"accaccacc"`. Encoded as `k[string]` meaning the string repeated `k` times. Nested allowed.

**Approach:** Two stacks: count stack and string stack. On digit, build number. On `[`, push current count and current string, reset. On `]`, pop count and prev string; new current = prev + current * count. On letter, append. O(output length).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Two stacks keep counts and prefix strings independent.
- Multi-digit numbers must be aggregated before `[` resets them.
- Each `]` collapses one nesting level into the outer string.

**Tags:** #algorithm

---

### 49. Mini Parser (Flatten Nested List Iterator)

**Difficulty:** Medium
**Topics:** stack, parsing, design, strings
**Position:** T2-3
**Years:** T2-T3

**Question:** Parse a string like `"[123,[456,[789]]]"` into a NestedInteger structure, or design an iterator that flattens a nested list lazily.

**Approach:** Parser: stack-based — push new NestedInteger on `[`, parse numbers (possibly negative), commit on `,` or `]`. Iterator: stack of iterators; `hasNext` peels through nesting lazily; `next` returns the next integer. O(total elements).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Single-integer payloads bypass the parser entirely.
- Commit pending number on either `,` or `]` — handles trailing numbers.
- Stack swaps make the parent the "current" list after each `]`.

**Tags:** #algorithm

---

### 50. Reverse Pairs

**Difficulty:** Hard
**Topics:** merge-sort, bit, divide-and-conquer
**Position:** T3-1
**Years:** T3

**Question:** Count pairs `(i, j)` with `i < j` and `nums[i] > 2 * nums[j]`.

**Approach:** Merge sort: during merge, for each `i` in left half, count `j` in right half with `nums[i] > 2*nums[j]` using a moving pointer. Then standard merge. O(n log n). Alternative: BIT over coordinate-compressed values.

**Python:**
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

**TypeScript:**
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

<!-- // unrolled merge omitted for brevity; sort suffices for clarity -->

**Java:**
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

**Key points:**
- Count pairs before merging — both halves are already sorted, so the pointer never goes backward.
- Multiplication can overflow in some languages; in JS it stays safe within `Number` here.
- Splitting count from merge keeps the recurrence T(n) = 2T(n/2) + O(n).

**Tags:** #algorithm

---

### 51. Count of Smaller Numbers After Self

**Difficulty:** Hard
**Topics:** bit, merge-sort, segment-tree
**Position:** T3-1
**Years:** T3

**Question:** For each `nums[i]`, return the count of `nums[j]` with `j > i` and `nums[j] < nums[i]`.

**Approach:** Merge sort with index tracking: when an element from the right half is placed before an element from the left, increment the left element's count. Or BIT over compressed values, processed right-to-left, query prefix. O(n log n).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Sort indices, not values, so each element's count remains addressable.
- When taking a left element, `j` already equals the count of smaller right elements seen.
- `<=` (not `<`) avoids inflating counts due to ties.

**Tags:** #algorithm

---

### 52. Count of Range Sum

**Difficulty:** Hard
**Topics:** merge-sort, prefix-sum, bit
**Position:** T3-1
**Years:** T3

**Question:** Count subarray sums that lie in `[lower, upper]` inclusive.

**Approach:** Compute prefix sums. Need pairs `(i, j)` with `lower <= prefix[j] - prefix[i] <= upper`. Modified merge sort on prefix array: during merge, for each left index, count right indices satisfying the bounds via two moving pointers. O(n log n).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Prefix sums turn range-sum questions into pair-difference questions.
- Both halves are sorted before counting, so the two scan pointers only move forward.
- Use `n + 1` prefixes so the first element of `nums` is also considered.

**Tags:** #algorithm

---

### 53. Find Median from Data Stream

**Difficulty:** Hard
**Topics:** heap, design, data-stream
**Position:** T3-1
**Years:** T3-T4

**Question:** Design a class supporting `addNum(int)` and `findMedian()` over a streaming sequence.

**Approach:** Two heaps: `lo` (max-heap) holds lower half, `hi` (min-heap) holds upper half. Maintain `len(lo) - len(hi) ∈ {0, 1}`. Add: push to lo, move top to hi, rebalance if hi larger. Median: top of lo or average of tops. O(log n) add, O(1) query.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- `lo` always holds the smaller half (size `n/2` ceil), `hi` the larger half.
- Rebalance with a one-element swap after each add.
- Median is the `lo` top when odd, average of both tops when even.

**Tags:** #algorithm

---

### 54. Sliding Window Median

**Difficulty:** Hard
**Topics:** heap, sliding-window, design
**Position:** T3-1
**Years:** T3-T4

**Question:** Given an array and window size `k`, return the median of each sliding window.

**Approach:** Two heaps + lazy deletion (hash map of pending removals). Each step: add new num; mark outgoing num for removal; clean up tops by popping invalidated entries; rebalance heap sizes. O(n log k). Alternative: ordered multiset (C++ `multiset`).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- A sorted multiset (Python `SortedList`, C++ `multiset`) is the cleanest model.
- Insertion + deletion are O(log k); median lookup is O(1) by index.
- Two-heap + lazy deletion variant avoids external libraries when needed.

**Tags:** #algorithm

---

### 55. Smallest Range Covering Elements from K Lists

**Difficulty:** Hard
**Topics:** heap, sliding-window
**Position:** T3-1
**Years:** T3

**Question:** Given `k` sorted lists, find the smallest range `[a, b]` such that at least one element from each list lies within.

**Approach:** Min-heap holding one element per list plus indices. Track current max among heap entries. Pop min; range = `[min, max]`; if best, save. Advance that list — if exhausted, stop. Push new element, update max. O(N log k).

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Window is implicitly `[heap_min, cur_max]` and always contains one item per list.
- Terminate as soon as any list is exhausted — moving its pointer is impossible.
- Update `cur_max` lazily on each push to avoid scanning the heap.

**Tags:** #algorithm

---

### 56. Single Number II

**Difficulty:** Medium
**Topics:** bit-manipulation, math
**Position:** T2-3
**Years:** T2-T3

**Question:** Every element appears exactly three times except one which appears once. Find it in O(n) time, O(1) space.

**Approach:** Bit counting per position mod 3, reassemble. Slicker: two-state counter `ones`, `twos`. Updates: `ones = (ones ^ x) & ~twos; twos = (twos ^ x) & ~ones`. Result in `ones`. Explain the state machine clearly.

**Python:**
```python
def single_number(nums: list[int]) -> int:
    ones = twos = 0
    for x in nums:
        ones = (ones ^ x) & ~twos
        twos = (twos ^ x) & ~ones
    return ones
```

**TypeScript:**
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

**Java:**
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

**Key points:**
- Each bit cycles through states 00 -> 01 -> 10 -> 00 as it sees 0/1/2/3 ones.
- After processing, bits appearing exactly once land in `ones`.
- All arithmetic is bitwise, so this is O(n) time and O(1) space.

**Tags:** #algorithm

---

### 57. Single Number III

**Difficulty:** Medium
**Topics:** bit-manipulation, xor
**Position:** T2-3
**Years:** T2-T3

**Question:** Exactly two elements appear once; all others appear twice. Find both in O(n) time, O(1) space.

**Approach:** XOR all → `x = a ^ b`. Pick any set bit (e.g., `x & -x`) to partition nums into two groups (bit set vs not). XOR each group → `a` and `b`. The two distinct numbers differ in that bit so end up in different groups.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- `x & -x` isolates the lowest set bit (works for any nonzero int).
- The two unique numbers differ in that bit, landing in different XOR groups.
- Duplicates self-cancel within each group via XOR.

**Tags:** #algorithm

---

### 58. Bitwise AND of Numbers Range

**Difficulty:** Medium
**Topics:** bit-manipulation, math
**Position:** T2-3
**Years:** T2-T3

**Question:** Given `[m, n]`, return the bitwise AND of all integers in the range inclusive.

**Approach:** Result = common prefix of `m` and `n` in binary. Right-shift both until equal, counting shifts; then left-shift back. Or: while `m < n`, `n = n & (n - 1)`. O(log n).

**Python:**
```python
def range_bitwise_and(m: int, n: int) -> int:
    while m < n:
        n &= n - 1
    return n
```

**TypeScript:**
```typescript
function rangeBitwiseAnd(m: number, n: number): number {
  while (m < n) n &= n - 1;
  return n;
}
```

**Java:**
```java
int rangeBitwiseAnd(int m, int n) {
  while (m < n) n &= n - 1;
  return n;
}
```

**Key points:**
- `n & (n - 1)` clears the lowest set bit of `n`.
- Repeating until `n <= m` leaves only the common high-bit prefix.
- O(log n) — each iteration removes one set bit.

**Tags:** #algorithm

---

### 59. Power of Four

**Difficulty:** Easy
**Topics:** bit-manipulation, math
**Position:** T2-3
**Years:** T2

**Question:** Given an integer `n`, return true if it is a power of four.

**Approach:** `n > 0 && (n & (n-1)) == 0 && (n & 0x55555555) != 0`. First two ensure power of 2; mask ensures the single bit is in an odd position. O(1). Common bit-trick warm-up.

**Python:**
```python
def is_power_of_four(n: int) -> bool:
    return n > 0 and (n & (n - 1)) == 0 and (n & 0x55555555) != 0
```

**TypeScript:**
```typescript
function isPowerOfFour(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0 && (n & 0x55555555) !== 0;
}
```

**Java:**
```java
boolean isPowerOfFour(int n) {
  return n > 0 && (n & (n - 1)) == 0 && (n & 0x55555555) != 0;
}
```

**Key points:**
- First two checks: `n` is a positive power of 2.
- Mask `0x55555555` has bits only at even positions (1, 4, 16, ...).
- All three conditions are O(1) — no loops or divisions.

**Tags:** #algorithm

---

### 60. Skill-Based Matchmaking (Balanced Team Split)

**Difficulty:** Hard
**Topics:** dp, partition, subset-sum, gaming
**Position:** T3-1
**Years:** T3-T4

**Question:** Given an array of `2n` player skill ratings, split them into two teams of size `n` such that the absolute difference of team skill sums is minimized. This mirrors Honor of Kings matchmaking.

**Approach:** Subset-sum DP constrained to exactly `n` elements. `dp[k][s]` = achievable to pick `k` elements summing to `s`. After filling, find achievable `s` closest to `total / 2` with `k = n`. O(n * total). For larger inputs, heuristic / approximation. Bring up MMR variance, queue time vs match quality trade-off.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Iterate `k` descending so each player contributes to at most one new state per round.
- Final answer is the achievable team-1 sum closest to `total / 2`.
- For larger inputs swap to bit-DP or randomized search for tractability.

**Tags:** #algorithm

---

### 61. Minimum Spanning Tree for Game Server Topology

**Difficulty:** Medium
**Topics:** graph, mst, kruskal, prim, union-find
**Position:** T2-3
**Years:** T2-T3

**Question:** Given `n` game-server nodes and the cost of laying a dedicated link between each pair, return the minimum total cost to interconnect them all.

**Approach:** MST via Kruskal: sort edges, union-find to add cheapest non-cycling edges until `n-1` chosen. O(E log E). Prim with min-heap is O(E log V) — preferable for dense graphs. Tencent infra angle: discuss latency-weighted vs cost-weighted edges.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Sort edges then add the smallest that joins two different components.
- Stop early once `n - 1` edges are committed.
- Return -1 when the graph is disconnected (fewer than `n - 1` valid unions).

**Tags:** #algorithm

---

### 62. Maximum Bipartite Matching (Player-to-Server Assignment)

**Difficulty:** Hard
**Topics:** graph, matching, hungarian, bipartite, dfs
**Position:** T3-1
**Years:** T3-T4

**Question:** Given players and game servers with compatibility constraints (region, ping threshold), assign the maximum number of players to servers (1 player ↔ 1 server within capacity).

**Approach:** Bipartite matching via Hungarian algorithm (Kuhn's): for each unmatched player, DFS through unmatched/augmenting paths, swap matches along the path if augmenting path exists. O(V * E). For weighted maximum matching, Hungarian with potentials or min-cost max-flow. Discuss using Hopcroft–Karp for O(E√V) if scale demands.

**Python:**
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

**TypeScript:**
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

**Java:**
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

**Key points:**
- Reset `seen` per player so each augmenting search is independent.
- Augmenting: bump an existing match if it can shift to another server.
- Hopcroft-Karp shaves to O(E sqrt(V)) for very large bipartite graphs.

**Tags:** #algorithm

---

## Tips specific to Tencent

- **C++ is a real plus.** Many infra/game teams hire C++ first. Know C++11/14/17 idioms (move semantics, smart pointers, lambdas), the STL, and memory model basics.
- **Networking depth.** TCP internals, kernel networking, custom UDP protocols — common interview material for game/IM teams.
- **Know which BG you're applying to.** IEG (games), WXG (WeChat), CSIG (cloud + B2B), TEG (infra), PCG (content) — very different cultures and tech stacks.
- **Open source involvement helps.** Tencent-led: TARS (microservice framework), ncnn (mobile neural network inference), Hippy (cross-platform framework). Mention concretely.
- **Behavioral is lighter than US.** They probe cooperation and proactiveness. Don't over-rehearse STAR — feel natural.

## Resources

- Tencent Cloud documentation (esp. game and IM services)
- 牛客网 (NowCoder) Tencent interview thread
- "TCP/IP Illustrated" — Stevens (essential for networking-heavy rounds)
- Open-source: github.com/Tencent/TarsCpp, github.com/Tencent/ncnn, github.com/Tencent/Hippy
- "Game Engine Architecture" — Gregory (for game backend roles)
