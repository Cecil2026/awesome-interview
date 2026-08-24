# Software Architect Interview Roadmap (8-week plan)

## Who this is for

Senior engineers (5+ years) targeting Software Architect, Staff/Principal Engineer, or Technical Lead roles where the loop is dominated by system design, architecture tradeoffs, and cross-cutting concerns — not by algorithm puzzles. You have shipped and operated production systems, but you have rarely had to defend a whole-system design end to end, articulate tradeoffs to a skeptical panel, or reason about reliability, security, and cost as first-class concerns. The coding bar is real but secondary; the bar that decides the loop is "can this person own the architecture of a system and the decisions behind it."

## Time commitment

- Weekdays: 1.5-2 hours
- Weekends: 5-6 hours
- Total: ~90-110 hours over 8 weeks

## Prerequisites

- 5+ years building backend or fullstack systems; you have designed at least one non-trivial service
- You have operated something in production — on-call, incidents, capacity, rollbacks
- You can read and write SQL, and reason about an EXPLAIN plan at a high level
- You understand HTTP, TLS, and the request/response lifecycle
- You are fluent enough in one backend language to write a small algorithm without a reference

## The plan

### Week 1: Architecture foundations and styles

**Focus:** build a shared vocabulary of architectural styles and be able to say *when* each one wins.

**Theory**
- [ ] Read: *Fundamentals of Software Architecture* (Richards & Ford) — architecture styles and characteristics
- [ ] Write a one-pager: for each style (modular monolith, microservices, event-driven), the forces that favor it and the ones that kill it

**Milestone (weekend)**
- Given a green-field product, argue for a starting architecture in 5 minutes and name the two signals that would make you split it later.

**In this repo this week**

| Goal | Where to practice / look it up |
| --- | --- |
| Monolith / microservices / modular monolith, coupling & cohesion | [knowledge/architecture.md](../knowledge/architecture.md) — Q1-Q9 |
| DDD: bounded contexts, aggregates, ubiquitous language | [knowledge/architecture.md](../knowledge/architecture.md) — Q5 |
| Event-driven, CQRS, event sourcing, saga | [knowledge/architecture.md](../knowledge/architecture.md) — Q2-Q6 |
| Light coding upkeep | [knowledge/algorithms.md](../knowledge/algorithms.md) — 3-4 easy/medium |

### Week 2: Data-intensive systems and storage

**Focus:** pick the right data store for a workload and defend the choice against alternatives.

**Theory**
- [ ] Read: *Designing Data-Intensive Applications* (DDIA) — chapters 1-3, 5-7
- [ ] Write a one-pager: a decision tree for OLTP vs OLAP vs KV vs document vs graph, with a real example per branch

**Milestone (weekend)**
- Choose a store for three different workloads (high-write telemetry, transactional orders, social graph) and defend each in under 3 minutes.

**In this repo this week**

| Goal | Where to practice / look it up |
| --- | --- |
| SQL vs NoSQL decision matrix | [knowledge/architecture.md](../knowledge/architecture.md) — Q20 |
| Indexes, transactions, isolation, N+1 | [knowledge/backend.md](../knowledge/backend.md) — Q7-Q17 |
| Replication, partitioning, sharding, rebalancing | [knowledge/distributed.md](../knowledge/distributed.md); [architecture.md](../knowledge/architecture.md) Q15-Q16 |
| Batch / streaming / warehousing tradeoffs | [knowledge/big-data.md](../knowledge/big-data.md) |
| Light coding upkeep | [knowledge/algorithms.md](../knowledge/algorithms.md) — 3-4 problems |

### Week 3: Distributed systems and consistency

**Focus:** the vocabulary and tradeoffs of coordination. You will not implement Raft, but you must reason about failure precisely.

**Theory**
- [ ] Read: DDIA chapters 8-9 (trouble with distributed systems, consistency and consensus)
- [ ] Learn: quorum reads/writes (W + R > N), leader election, replication lag, read-your-writes

**Milestone (weekend)**
- Explain CAP accurately in three sentences with a CP and an AP example, then walk through how a saga recovers from a partial failure.

**In this repo this week**

| Goal | Where to practice / look it up |
| --- | --- |
| CAP & PACELC in practice | [knowledge/architecture.md](../knowledge/architecture.md) — Q11; [distributed.md](../knowledge/distributed.md) |
| Consistency models (strong / eventual / causal) | [knowledge/architecture.md](../knowledge/architecture.md) — Q12-Q13; [distributed.md](../knowledge/distributed.md) |
| Distributed transactions: 2PC vs sagas | [knowledge/architecture.md](../knowledge/architecture.md) — Q14; [distributed.md](../knowledge/distributed.md) |
| Idempotency, exactly-once, dedup | [knowledge/backend.md](../knowledge/backend.md) — Q2; [distributed.md](../knowledge/distributed.md) |
| Light coding upkeep | [knowledge/algorithms.md](../knowledge/algorithms.md) — 3-4 problems |

### Week 4: Scalability, caching, and resilience

**Focus:** the patterns that keep a system up and fast under load and under partial failure.

**Theory**
- [ ] Learn: cache-aside vs read-through vs write-through vs write-behind, and the failure mode of each
- [ ] Write a one-pager: the failure-isolation toolkit (timeouts, retries with jitter, circuit breakers, bulkheads, load shedding)

**Milestone (weekend)**
- Take a design that falls over at 10x traffic and describe, in order, the four changes you would make and what each buys you.

**In this repo this week**

| Goal | Where to practice / look it up |
| --- | --- |
| Load balancing, stateless vs stateful, horizontal scaling | [knowledge/architecture.md](../knowledge/architecture.md) — Q8-Q10 |
| Caching layers & invalidation | [knowledge/architecture.md](../knowledge/architecture.md) — Q17; [backend.md](../knowledge/backend.md) Q16-Q17 |
| Circuit breaker, timeouts, retries, backoff, jitter | [knowledge/architecture.md](../knowledge/architecture.md) — Q18-Q19 |
| Rate limiting & backpressure | [knowledge/backend.md](../knowledge/backend.md) — Q4; [system-design.md](../knowledge/system-design.md) |
| Light coding upkeep | [knowledge/algorithms.md](../knowledge/algorithms.md) — 3-4 problems |

### Week 5: The classic system designs

**Focus:** rehearse canonical designs end to end until the structure is reflex.

**The designs (one per session, ~3 hours each)**
- [ ] URL shortener — requirements, API, encoding, scaling, caching, analytics
- [ ] Chat system — ordering, delivery receipts, presence, push, fan-out
- [ ] News feed — fan-out on read vs write, the celebrity problem, ranking
- [ ] Rate limiter — algorithms, distributed enforcement, where to run it
- [ ] A data-heavy design of your choice (metrics pipeline, search, or feature store)

**Each design must produce**
- [ ] A whiteboard-style architecture diagram
- [ ] A one-page write-up: requirements → estimation → API → data model → architecture → 1-2 deep dives → bottlenecks

**Milestone (weekend)**
- Whiteboard one design end to end in 45 minutes, including capacity estimation, then self-score against the rubric.

**In this repo this week**

| Goal | Where to practice / look it up |
| --- | --- |
| Worked design walkthroughs | [mock-interviews/](../mock-interviews/) — URL shortener, chat app, rate limiter, RAG Q&A |
| Scenario question bank | [knowledge/system-design.md](../knowledge/system-design.md) |
| Scoring yourself like an interviewer | [system-design-rubric](../mock-interviews/system-design-rubric.md) |
| Light coding upkeep | [knowledge/algorithms.md](../knowledge/algorithms.md) — 3-4 problems |

### Week 6: Cross-cutting concerns — security, observability, delivery, cost

**Focus:** the concerns that separate an architect from a strong senior engineer — the ones that never fit in the happy path.

**Theory**
- [ ] Learn: an error-budget conversation — how SLOs drive release decisions
- [ ] Write a one-pager: the security architecture checklist you would apply to any new service (identity, secrets, network, data-at-rest/in-transit, audit)

**Milestone (weekend)**
- For one of last week's designs, add the operational layer: SLOs, rollout strategy, the top three failure alerts, and a rough monthly cost driver.

**In this repo this week**

| Goal | Where to practice / look it up |
| --- | --- |
| AuthN vs AuthZ, OAuth 2.0 / OIDC architecture | [knowledge/architecture.md](../knowledge/architecture.md) — Q21-Q22; [backend.md](../knowledge/backend.md) Q5-Q6 |
| Observability: logs vs metrics vs traces, SLI/SLO/SLA | [knowledge/architecture.md](../knowledge/architecture.md) — Q24-Q25; [devops.md](../knowledge/devops.md) |
| Deployment: blue/green, canary, rolling | [knowledge/architecture.md](../knowledge/architecture.md) — Q23; [devops.md](../knowledge/devops.md) |
| Cost, capacity, and multi-tenancy tradeoffs | [knowledge/system-design.md](../knowledge/system-design.md); [devops.md](../knowledge/devops.md) |
| Light coding upkeep | [knowledge/algorithms.md](../knowledge/algorithms.md) — 3-4 problems |

### Week 7: Architecture communication and decision-making

**Focus:** the soft-but-decisive skills — articulating tradeoffs, writing decisions down, driving migrations, and aligning stakeholders.

**Theory**
- [ ] Learn: ADRs (architecture decision records), the C4 model for diagrams, and RFC-driven decision making
- [ ] Learn: migration strategies — strangler fig, branch-by-abstraction, dual-write and backfill
- [ ] Write two ADRs for real decisions you have made, in the "context / decision / consequences" format

**Milestone (weekend)**
- Present a past architecture decision as an ADR in 5 minutes: the alternatives, the tradeoff, and how you would migrate. Run one behavioral mock covering influence-without-authority.

**In this repo this week**

| Goal | Where to practice / look it up |
| --- | --- |
| Tradeoff articulation & pattern recall | [knowledge/architecture.md](../knowledge/architecture.md) — full bank, timed |
| STAR stories: influence, conflict, ambiguity, failure | [behavioral/README.md](../behavioral/README.md); [star-questions](../behavioral/star-questions.md) |
| Leadership-style behavioral | [behavioral/amazon-leadership-principles.md](../behavioral/amazon-leadership-principles.md); [mock: leadership conflict](../mock-interviews/behavioral-leadership-conflict.md) |
| Light coding upkeep | [knowledge/algorithms.md](../knowledge/algorithms.md) — 2-3 problems |

### Week 8: Mock loops and weak-area review

**Focus:** simulate the real loop. Find the gaps. Close them.

**Milestone (weekend)**
- Complete one full mock loop (design + deep dive + behavioral) and pass yourself on each round. Where you fail, spend two extra days on that specific gap before the real interview.

**In this repo this week**

| Goal | Where to practice / look it up |
| --- | --- |
| Full architecture / system-design mocks | [mock-interviews/](../mock-interviews/) + [rubric](../mock-interviews/system-design-rubric.md) |
| Unseen scenario practice | [knowledge/system-design.md](../knowledge/system-design.md); [architecture.md](../knowledge/architecture.md) |
| Coding refresh (a lighter but real bar) | [knowledge/algorithms.md](../knowledge/algorithms.md) — 1 timed problem/day |
| Behavioral mock | [behavioral/README.md](../behavioral/README.md) + [amazon-leadership-principles.md](../behavioral/amazon-leadership-principles.md) |
| Target-company banks | [interviews/companies/](../interviews/companies/) |
| Readiness checklist | [checklist.md](checklist.md) |

## Final week checklist

- [ ] Architecture design mock (45 min, unseen prompt, talk out loud)
- [ ] Deep-dive mock on one component (data model, failure modes, scaling)
- [ ] Behavioral mock (30 min, influence / conflict / failure)
- [ ] Confirm the format with your recruiter (rounds, length, whether coding is included)
- [ ] Re-read your DDIA and architecture notes one last time
- [ ] Re-read your best five STAR stories and two ADRs
- [ ] Prepare five thoughtful questions for each interviewer type
- [ ] Test hardware: camera, mic, screen share, whiteboard/diagram tool
- [ ] Sleep eight hours the night before — non-negotiable

## If you have less time

**Compressed 4-week version:**

- Week 1 = original weeks 1+2 condensed. Architecture styles + DDIA chapters 1-3, 5-7.
- Week 2 = original weeks 3+4 condensed. Consistency, transactions, caching, resilience.
- Week 3 = original weeks 5+6 condensed. Three canonical designs + cross-cutting concerns.
- Week 4 = original weeks 7+8 condensed. ADRs, one full mock loop, finalize STAR stories.

## If you have more time

- Read *Fundamentals of Software Architecture* and *Software Architecture: The Hard Parts* end to end.
- Design and write up a real migration you would run at your current company — including the ADR, the rollout, and the rollback plan.
- Study three public postmortems (Cloudflare, GitHub, AWS all publish detailed ones) and extract the architectural decision each one indicts.
- Read five engineering blogs from the team you want to join; note the tradeoffs they made and be ready to reference them.
- Build a small reference architecture (an event-driven service with an outbox, idempotent consumers, and observability) so your examples come from your own hands, not a book.
