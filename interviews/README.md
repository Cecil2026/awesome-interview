# Company Interview Experiences

A curated collection of real, publicly discussed interview questions for major tech companies. Each file is a quick-reference prep sheet covering coding, system design, behavioral, and domain questions that recur on Glassdoor, LeetCode Discuss, levels.fyi Blind, and engineering interview prep forums.

These are **not insider leaks** — every question here has appeared in public interview reports. The value is curation: 20 high-signal questions per company, calibrated to that company's actual interview style.

## Companies

| Company | Focus Areas | File |
|---|---|---|
| Google | Algorithms at scale, distributed systems, Googleyness | [google.md](./companies/google.md) |
| Meta (Facebook) | Arrays/trees/graphs, product sense, impact-driven behavioral | [meta.md](./companies/meta.md) |
| Amazon | OOD, Leadership Principles, scalable services | [amazon.md](./companies/amazon.md) |
| Microsoft | Classic CS fundamentals, Azure-flavored design, growth mindset | [microsoft.md](./companies/microsoft.md) |
| Apple | Team-specific (frontend/embedded/ML), privacy emphasis | [apple.md](./companies/apple.md) |
| ByteDance | DP/graph/math, video & recommendation systems | [bytedance.md](./companies/bytedance.md) |
| Alibaba | Java middleware, e-commerce/payment at scale, six values | [alibaba.md](./companies/alibaba.md) |
| Tencent | C++/distributed, gaming/social backend, collaboration culture | [tencent.md](./companies/tencent.md) |

## Conventions

### Difficulty calibration

Each question is tagged with a difficulty derived from how candidates report the question in public forums. The scale is roughly aligned to LeetCode:

- **Easy** — Solvable in 10-15 minutes by a prepared candidate. One key insight or a well-known pattern.
- **Medium** — 20-35 minutes. Requires combining 2-3 patterns, or a non-obvious data structure choice, or careful edge-case handling. Most onsite coding rounds land here.
- **Hard** — 35-45+ minutes. Either a tough algorithmic insight (advanced DP, tricky graph), a multi-layered system design, or a behavioral question that probes deep multi-stakeholder conflict.

For system design and behavioral, Easy/Medium/Hard roughly maps to L3-L4 / L5 / L6+ scope.

### Topic tags

The `Topics:` line uses lowercase comma-separated tags. Common ones:

- **Algorithms:** `arrays`, `strings`, `hashmap`, `two-pointer`, `sliding-window`, `binary-search`, `linked-list`, `tree`, `bst`, `graph`, `bfs`, `dfs`, `dp`, `greedy`, `backtracking`, `trie`, `heap`, `union-find`, `bit-manipulation`, `math`, `recursion`, `divide-and-conquer`
- **System design:** `system-design`, `sharding`, `consistent-hashing`, `caching`, `cdn`, `load-balancing`, `queue`, `pub-sub`, `consensus`, `replication`, `rate-limiting`, `feed-ranking`
- **Behavioral:** `behavioral`, `conflict`, `leadership`, `failure`, `ownership`, `ambiguity`, `mentorship`
- **Domain:** `ood`, `concurrency`, `web-perf`, `recommendation`, `payments`, `gaming-backend`

### Position & level tags

- **Position:** SWE, Senior SWE, Frontend, Backend, SRE, TPM, EM
- **Years:** L3-L4 (entry/mid), L5 (senior), L6+ (staff+)

These are guidance — most algorithm questions get reused across levels with the bar shifting on depth of analysis, edge cases, and follow-ups.

### Question tags

At the end of each question, a single `#` tag classifies it:

- `#algorithm` — classic coding/algorithm question
- `#coding` — coding question that's more about engineering judgment than algorithmic insight (e.g., string parsing, OOD)
- `#system-design` — design a system end-to-end
- `#behavioral` — STAR-format soft-skills question
- `#domain-knowledge` — role-specific (web perf, payments, ML, etc.)

## How to use this collection

1. **Pick the company** you're interviewing at and skim the header block for round structure and quirks.
2. **Filter by difficulty + topic** for the time you have. If you have a week, focus on Medium algorithm + 2-3 system designs.
3. **Don't memorize the "Approach"** — use it as a checkpoint. If your solution differs but achieves the same complexity, you're fine.
4. **Practice behavioral out loud.** The STAR hints assume you'll fill in your own real stories.

## Contributing

Copy [_template.md](./_template.md), fill it out for the company/round you interviewed at, and open a PR. Keep questions to ones that are already discussed publicly — do not post anything covered by an NDA.
