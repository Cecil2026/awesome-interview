# System Design Rubric V1

A practical, level-aware scorecard for grading (your own or someone else's) system design rounds. Use it after a mock interview, while reading a transcript, or as a checklist mid-round to spot what you forgot.

The rubric has **8 dimensions** scored 0–5 each (40 points total). Levels map to thresholds, not absolute scores — at higher levels the bar moves up on *every* dimension, not just the total.

## How to use

1. Run or read a 45–60 minute system design round end-to-end.
2. Score each dimension 0–5 using the descriptors below. Don't average — be honest about weak spots.
3. Compare the total + per-dimension profile to the [Level mapping](#level-mapping).
4. Pick the **lowest two** dimensions. Those are your next study targets.

Do this for every mock and every transcript you read. The diff between rounds matters more than the absolute score.

## The 8 dimensions

### 1. Requirements & Scope

Did the candidate carve out a tractable problem before building anything?

| Score | Behavior |
| --- | --- |
| 0 | Jumped straight to a diagram. |
| 1 | Asked one or two questions, did not separate functional vs non-functional. |
| 2 | Listed functional requirements, ignored constraints (consistency, latency, multi-region). |
| 3 | Clean functional + non-functional split, explicit out-of-scope items. |
| 4 | Prioritized must-have vs nice-to-have, surfaced ambiguity, sized down when the prompt was too broad. |
| 5 | Reframed an underspecified prompt into a sharper one and got the interviewer to agree. |

### 2. Scale Estimation

Numbers, not adjectives.

| Score | Behavior |
| --- | --- |
| 0 | No numbers at all. |
| 1 | One vague number ("a lot of users"). |
| 2 | DAU + QPS only. |
| 3 | QPS (read/write), storage/year, bandwidth, peak vs average. |
| 4 | Above + per-shard load, hot-key estimate, growth over 3–5 years. |
| 5 | Numbers drove a concrete design decision the interviewer could see ("at 40K reads/sec one Postgres won't cut it, so..."). |

### 3. High-Level Architecture

Can a reader rebuild the system from the diagram?

| Score | Behavior |
| --- | --- |
| 0 | No diagram or one giant blob. |
| 1 | Boxes drawn, arrows missing or ambiguous. |
| 2 | Client → API → DB happy path only. |
| 3 | Distinct read path vs write path, async path called out. |
| 4 | Component responsibilities are crisp, API surface explicit (resource + verb + auth). |
| 5 | Diagram survives the entire round — deep dives extend it without redrawing. |

### 4. Data Model & Storage

The hardest place to bluff.

| Score | Behavior |
| --- | --- |
| 0 | "We'll use a database." |
| 1 | Picked SQL or NoSQL without justification. |
| 2 | Schema sketched, primary key chosen. |
| 3 | Indexes called out, access patterns drive the schema, justification for SQL vs NoSQL vs blob vs cache. |
| 4 | Sharding key + rebalance story, hot-shard mitigation, secondary index strategy. |
| 5 | Discussed write amplification, GC/compaction behavior, or a concrete failure mode of the chosen store. |

### 5. Scalability & Performance

Where reads and writes actually land at peak.

| Score | Behavior |
| --- | --- |
| 0 | "Add more servers." |
| 1 | Single-layer cache mentioned, no eviction or invalidation story. |
| 2 | Cache + replicas, no CDN, no async pipeline. |
| 3 | CDN/edge, read replicas, async write fanout, queue between hot paths. |
| 4 | Cache invalidation strategy (TTL vs explicit), thundering-herd mitigation, back-pressure under load. |
| 5 | Identified the actual bottleneck for the modeled load and matched the tool to it (not "Redis everywhere"). |

### 6. Reliability & Trade-offs

Words like "eventual consistency" should be backed by what breaks if it isn't.

| Score | Behavior |
| --- | --- |
| 0 | Did not mention failure. |
| 1 | "Replication" mentioned without a consistency model. |
| 2 | CAP referenced abstractly. |
| 3 | Named consistency model (strong / read-your-writes / eventual) per data class, justified the choice. |
| 4 | Failure scenarios walked through (node loss, partition, region down) with concrete behavior. |
| 5 | Trade-off owned out loud: "we lose X to get Y; the product can absorb X because Z." |

### 7. Deep Dives

The "are you actually senior" signal.

| Score | Behavior |
| --- | --- |
| 0 | Stayed at box-level the whole hour. |
| 1 | One deep-dive attempted but hand-wavy. |
| 2 | One component drilled to algorithm/protocol level (consistent hashing, leader election, OT/CRDT, token bucket, etc.). |
| 3 | Above + an alternative was considered and rejected with reason. |
| 4 | Two distinct deep dives, both production-grade. |
| 5 | Deep dive surfaced something the interviewer hadn't planned to test on. |

### 8. Operational Concerns

The stuff that decides if it survives Monday.

| Score | Behavior |
| --- | --- |
| 0 | Never mentioned. |
| 1 | "We'd have monitoring." |
| 2 | Named SLIs (latency, error rate) for the critical path. |
| 3 | Deploy + rollback strategy, on-call surface (paging signals). |
| 4 | Abuse/security (rate limiting, authz boundaries), data lifecycle (PII, deletion, retention). |
| 5 | Incident-style narrative: "if X breaks at 3 a.m., the page fires on Y and the runbook is Z." |

## Level mapping

Use total **and** the per-dimension profile. A 35 with two zeros is still a no-hire signal.

| Level | Total | Required floors | Typical profile |
| --- | --- | --- | --- |
| L3 / E3 / new-grad | 18–24 | Dimensions 1–4 each ≥ 3 | Clean basics, one deep dive optional, operational mostly hand-waved. |
| L4 / SDE II | 24–30 | Dimensions 1–6 each ≥ 3, at least one ≥ 4 | Solid basics, one real deep dive, trade-offs articulated. |
| L5 / Senior | 30–35 | Every dimension ≥ 3, two ≥ 4 | Two deep dives, named consistency models, owned trade-offs, ops mentioned. |
| L6 / Staff | 34+ | Every dimension ≥ 4, at least one 5 | Deep dives feel like running production, novel insight, operational maturity. |

## Common red flags (any one drops the round by a level)

- Started drawing before scoping requirements.
- Numbers never used to justify a design choice.
- Said "eventual consistency" without naming what breaks if it isn't.
- One database for every data class, regardless of access pattern.
- Cache added without an invalidation story.
- Sharding key chosen with no hot-key analysis.
- No failure scenario walked through.
- No deep dive past the box level.
- "We'd add monitoring" with no SLI named.
- Answered interviewer pushback by repeating the original answer louder.

## Applied to existing transcripts

| Mock | Where the rubric bites hardest |
| --- | --- |
| [system-design-url-shortener.md](./system-design-url-shortener.md) | Dimensions 2 (scale → 100:1 read/write drove design), 4 (base62 counter vs hash trade-off), 5 (read-path caching). |
| [system-design-chat-app.md](./system-design-chat-app.md) | Dimensions 3 (read vs write path split), 6 (delivery guarantees + ordering), 7 (presence / fanout deep dive). |
| [system-design-rate-limiter.md](./system-design-rate-limiter.md) | Dimensions 4 (Redis data layout), 5 (hot-key, sync vs async decrement), 7 (token bucket vs sliding window). |

## Self-scoring tips

- Score immediately after the round; memory decays fast.
- Don't grade on intent — only on what was actually said or drawn.
- Re-record yourself; the gap between what you *thought* you said and what you said is where the points are.
- Keep a rolling per-dimension scorecard across mocks. Three sessions stuck at 2 on the same dimension = that's your blocker.

## Changelog

- **V1 (2026-06):** initial 8-dimension rubric.
