# Mock Interview: Design a RAG-based Enterprise Document Q&A System

**Type:** System Design (ML / AI)
**Difficulty:** L5
**Duration:** 45-60 minutes (simulated)
**Tags:** #system-design, #machine-learning, #rag, #llm, #vector-search, #embeddings

## Setup

The candidate is interviewing for a Senior/Staff ML engineering role on an applied-AI team at a B2B SaaS company. The interviewer is an L6 who owns the company's internal "ask-your-docs" assistant. The prompt: design a system that lets employees ask natural-language questions and get grounded, citation-backed answers over the company's internal knowledge — wikis, Google Docs, Slack, PDFs, tickets. The candidate has 50 minutes. The interviewer cares less about the LLM internals and more about retrieval quality, grounding, freshness, and evaluation.

## Transcript

**INTERVIEWER:** I'd like you to design a question-answering system over our internal documents. Employees type a question, we return an answer with citations. Take it where you want; I'll interrupt.

**CANDIDATE:** Great. Let me clarify scope before I design. When you say "internal documents" — what sources, and roughly how many?

**INTERVIEWER:** Confluence wiki, Google Docs, Slack messages, PDFs in a document store, and Jira/Zendesk tickets. Call it 5 million documents total, very heterogeneous in length.

**CANDIDATE:** And the answer format — a single synthesized answer with citations, or a list of relevant passages, or both?

**INTERVIEWER:** A synthesized natural-language answer, grounded in retrieved passages, with inline citations back to the source. Users should be able to click through to verify.

**CANDIDATE:** Critical question: access control. Not every employee can see every document. Is permission enforcement in scope?

**INTERVIEWER:** Yes — and it's a hard requirement. A user must never see content from a document they're not authorized to read, including indirectly via the synthesized answer.

**CANDIDATE:** That's the single most important constraint, so I'll design around it. What's the scale of usage — queries per second, latency budget?

**INTERVIEWER:** Tens of thousands of employees. Peak maybe 50 queries per second. Latency: users will tolerate a few seconds for a good grounded answer, but aim for p95 under 5 seconds end-to-end.

**CANDIDATE:** And freshness — if someone edits a wiki page, how quickly must the answer reflect it?

**INTERVIEWER:** Minutes, ideally. If someone updates the on-call runbook, asking about it five minutes later should reflect the change.

**CANDIDATE:** Last one: do we host our own LLM or call a third-party API? And is sending internal data to a third party allowed?

**INTERVIEWER:** Assume we can use a hosted commercial LLM under an enterprise agreement with no-training guarantees, OR a self-hosted open model. Discuss the trade-off — it matters here.

**CANDIDATE:** Perfect. Let me lay out the high-level shape, then go deep on retrieval, grounding, permissions, freshness, and evaluation.

**INTERVIEWER:** Go.

**CANDIDATE:** *(draws on whiteboard)* This is a classic RAG system with two planes: an **ingestion/indexing plane** that runs continuously, and a **query/serving plane** on the request path.

```
INGESTION (async, continuous)
  Sources -> Connectors -> Normalize -> Chunk -> Embed -> Index
                                                   |        |
                                              (vector DB) (lexical/BM25)
                                              + permission metadata

QUERY (request path)
  User question
     -> Retrieve (hybrid: vector + lexical, permission-filtered)
     -> Rerank
     -> Assemble context
     -> LLM (generate grounded answer + citations)
     -> Post-process (verify citations, guardrails)
     -> Response
```

**INTERVIEWER:** Let's start with ingestion. Walk me through chunking. Why not embed whole documents?

**CANDIDATE:** Two reasons. One: embedding models have a token limit and lose fidelity on long inputs — a single vector can't represent a 30-page PDF well. Two: retrieval granularity. We want to retrieve the specific passage that answers the question, not the whole doc, both for relevance and to fit the LLM context budget. So we split documents into chunks — roughly 256-512 tokens — and embed each chunk.

**INTERVIEWER:** How do you choose chunk boundaries?

**CANDIDATE:** Not naive fixed-size splits that cut mid-sentence. I'd chunk on structure first — headings, paragraphs, list items, table rows — then pack to a target token size with some overlap, maybe 10-15%, so a sentence that straddles a boundary isn't orphaned. For code or tables, I'd keep semantic units intact rather than splitting a function in half.

**INTERVIEWER:** Why the overlap?

**CANDIDATE:** Recall. If the answer spans a chunk boundary, overlap means at least one chunk contains the full context. The cost is duplicate storage and the risk of retrieving two near-identical chunks, which we handle at rerank/dedup.

**INTERVIEWER:** What metadata do you attach to each chunk?

**CANDIDATE:** Source system, document ID, title, section heading, URL/permalink, author, last-modified timestamp, and — critically — the **access-control descriptor**: the ACL or the set of groups/users allowed to read the source document. Plus the document type for source-specific weighting.

**INTERVIEWER:** Good, hold that ACL thought. Embeddings — which model, and one model or several?

**CANDIDATE:** A single dense embedding model for the corpus so all vectors live in one comparable space — say a strong general-purpose text embedding model, 768 or 1024 dimensions. I'd use the same model at query time. If we had code-heavy content I might consider a code-specialized embedder, but mixing embedding spaces complicates retrieval, so I'd start with one and only specialize if eval shows a gap.

**INTERVIEWER:** Where do the vectors go?

**CANDIDATE:** A vector database with approximate nearest-neighbor search — HNSW or IVF-PQ index. 5M docs at, say, an average of 10 chunks each is 50M vectors. At 1024 dims float32 that's ~200GB raw; with quantization (PQ or int8) we cut that several-fold. A managed vector DB or something like a self-hosted HNSW store handles this comfortably with sharding.

**INTERVIEWER:** Why also keep a lexical/BM25 index? Isn't dense retrieval enough?

**CANDIDATE:** No — hybrid retrieval is meaningfully better. Dense embeddings capture semantic similarity but are weak on exact matches: error codes, function names, ticket IDs, acronyms, rare product names. BM25 nails those. Conversely BM25 misses paraphrases. Running both and fusing — reciprocal rank fusion — gives higher recall than either alone. For an enterprise corpus full of jargon and identifiers, lexical is essential.

**INTERVIEWER:** Walk me through a query end to end.

**CANDIDATE:** *(draws)*

```
Question: "How do I rotate the prod database credentials?"
   |
   1. Query understanding (optional): rewrite/expand, detect intent
   |
   2. Embed query (same model as ingestion)
   |
   3. Parallel retrieval:
   |     - Vector ANN search: top 50, FILTERED by user's ACL
   |     - BM25 search:       top 50, FILTERED by user's ACL
   |
   4. Fuse (RRF) -> ~80 unique candidates
   |
   5. Rerank with cross-encoder -> top 8-10
   |
   6. Assemble context (dedup, order, budget to N tokens)
   |
   7. LLM generate: grounded answer + citation IDs
   |
   8. Post-process: verify each citation, apply guardrails
   |
   9. Return answer + clickable sources
```

**INTERVIEWER:** Stop at step 3 — the permission filter. How does it actually work? This is the part I care most about.

**CANDIDATE:** The naive-but-wrong approach is to retrieve first and filter after — that leaks, because you might retrieve 50 chunks the user can't see and have nothing left. The correct approach is **filter during retrieval**: the ANN and BM25 queries both carry a predicate on the chunk's ACL metadata, so only authorized chunks are even candidates.

**INTERVIEWER:** How do you express that predicate efficiently? ACLs can be complex — nested groups, per-document grants.

**CANDIDATE:** At query time I resolve the user into a flat set of principals: their user ID plus all groups they belong to, expanded transitively. That resolution is cached per user with a short TTL. Then each chunk stores the set of principals that can read it — also flattened at ingestion time. The retrieval filter is a set-intersection: "does the chunk's allowed-principals set intersect the user's principals set?" Most vector DBs support this as a metadata filter on an indexed field.

**INTERVIEWER:** Flattening ACLs at ingestion — what happens when a group's membership changes, or a doc's sharing changes?

**CANDIDATE:** Two different change types. Group membership change — say someone leaves a team — I handle at **query time** by re-resolving the user's principal set; I don't want to re-index millions of chunks because one person changed teams. Document-level sharing change — a doc becomes restricted — I handle at **ingestion time** by updating that document's chunks' allowed-principals. That's bounded to one document's chunks, so it's cheap. The combination keeps both sides correct without mass re-indexing.

**INTERVIEWER:** What if the ACL system is the source of truth and is itself slow or flaky at query time?

**CANDIDATE:** I cache the resolved principal set per user with a short TTL — say 5 minutes — refreshed asynchronously. Stale-by-5-minutes on group membership is an acceptable risk for most orgs; if the security bar is higher we shorten the TTL or subscribe to a change stream from the identity provider and invalidate on events. The key property: we fail **closed** — if we can't resolve permissions, we don't retrieve, we don't answer. Never fail open on access control.

**INTERVIEWER:** Good — fail closed is the right call. Now, the synthesized answer. The LLM sees passages from multiple docs. How do you guarantee it doesn't leak a passage the user couldn't see?

**CANDIDATE:** Because retrieval was permission-filtered, every passage in the LLM context is already authorized for this user. The LLM can only ground in what it's given, so there's nothing unauthorized to leak. The invariant lives at retrieval, not in the prompt. I would not rely on prompting the LLM to "only use authorized content" — that's not a security boundary.

**INTERVIEWER:** What about the LLM's own pretrained knowledge — could it answer from parametric memory and bypass your docs entirely?

**CANDIDATE:** Yes, that's a real failure mode. Mitigations: instruct it to answer **only** from the provided context and to say "I don't have that information" when the context doesn't support an answer. More importantly, enforce it in post-processing — every claim should map to a citation, and I verify the citations exist in the retrieved set. If the model answers with no grounded citations, I suppress the answer or downgrade to "here are some possibly relevant docs."

**INTERVIEWER:** Let's go deeper on grounding and hallucination. How do you actually verify citations?

**CANDIDATE:** I have the model emit citations as structured references — chunk IDs it used — rather than free-text. Easiest is a structured output: `{answer, claims: [{text, supporting_chunk_ids}]}`. In post-processing I check each cited chunk ID is one I actually retrieved. For higher assurance I run a lightweight entailment/NLI check or a second LLM "judge" pass: does the cited passage actually support the claim? If not, I drop or flag the claim. There's a latency/cost trade-off, so I'd reserve the heavy verification for high-stakes queries or a sampled audit.

**INTERVIEWER:** What's the prompt structure for generation?

**CANDIDATE:** Roughly: a system instruction defining the assistant's role and the "ground only in context, cite sources, admit ignorance" rules; then the retrieved chunks each prefixed with a citation marker and metadata (title, date); then the user's question. I keep the chunks clearly delimited so the model can attribute, and I put the most relevant chunks where the model attends best — typically near the top and bottom, since middle-of-context recall degrades.

**INTERVIEWER:** "Lost in the middle" — good that you mentioned it. How many chunks do you actually put in context?

**CANDIDATE:** Driven by the rerank scores and a token budget, not a fixed count. After reranking I take chunks until I hit, say, 4-6K tokens of context — usually 6 to 10 chunks. More isn't better: irrelevant chunks dilute attention and raise cost and latency. Precision of the top-k matters more than stuffing the window.

**INTERVIEWER:** Tell me about the reranker. Why not just use the vector scores?

**CANDIDATE:** Vector similarity is a bi-encoder — query and chunk embedded independently, so it can't model fine-grained interaction between them. A cross-encoder reranker takes the (query, chunk) pair jointly and scores relevance much more accurately. It's too expensive to run over the whole corpus, which is why we use cheap ANN/BM25 to get ~80 candidates, then the expensive cross-encoder only on those. It's the standard retrieve-then-rerank cascade: cheap-and-wide, then precise-and-narrow.

**INTERVIEWER:** What does the reranker cost you in latency?

**CANDIDATE:** Cross-encoding 80 candidates is the heaviest retrieval step — maybe 100-300ms on a GPU depending on model size and batching. We batch all candidates in one forward pass. If that's too slow we cut candidate count or use a smaller/distilled reranker. It's a quality/latency knob.

**INTERVIEWER:** Now freshness. You said minutes. How does an edit propagate?

**CANDIDATE:** Event-driven ingestion. Each connector subscribes to change feeds — Confluence webhooks, Google Drive push notifications, Slack events, a CDC stream off the ticket DB. On a change event we enqueue the document for re-processing: re-fetch, re-chunk, re-embed only the changed document, and upsert its chunks into both indexes. Because it's per-document and event-driven, latency from edit to searchable is seconds-to-minutes, dominated by queue depth and embedding time.

**INTERVIEWER:** What about deletes? Someone deletes a doc or it's un-shared.

**CANDIDATE:** Delete event -> tombstone and remove the doc's chunks from both indexes. Un-share is the ACL-update path I mentioned — update the allowed-principals on the chunks, or remove them if no one can see them. Deletes are security-sensitive, so I'd process them with high priority — a separate fast lane in the queue — to avoid a window where deleted content is still answerable.

**INTERVIEWER:** How do you avoid re-embedding the entire corpus when you want to upgrade the embedding model?

**CANDIDATE:** Versioned indexes. Embeddings are model-specific — you can't mix vectors from two models in one space. So a model upgrade means building a parallel index: spin up the new embedder, backfill all chunks into a new index version, validate quality offline, then atomically switch query traffic over and retire the old one. Blue-green for the index. It's a big batch job but it's planned, not on the hot path.

**INTERVIEWER:** Let's talk about retrieval quality. How do you know the system is any good?

**CANDIDATE:** Evaluation is where most RAG systems live or die, so I'd invest here heavily. I separate it into **retrieval eval** and **end-to-end answer eval**.

For retrieval: build a labeled set of (question, relevant-chunk) pairs — from real query logs with human labeling, or synthetically by generating questions from known passages. Then measure recall@k, MRR, and nDCG. Recall@k matters most: if the right chunk isn't retrieved, no amount of LLM cleverness recovers it.

**INTERVIEWER:** And the answer quality?

**CANDIDATE:** Multiple signals. **Groundedness/faithfulness**: is every claim supported by a cited source? **Answer relevance**: does it actually address the question? **Citation correctness**: do the citations point to passages that support the claims? I'd compute these with a mix of an LLM-as-judge for scale and a human-labeled golden set for calibration — because LLM judges drift and have biases, so they need to be checked against humans periodically.

**INTERVIEWER:** LLM-as-judge — what are you worried about there?

**CANDIDATE:** Several biases: position bias, verbosity bias — judges favor longer answers — and self-preference if the judge is the same family as the generator. Mitigations: randomize positions, use a different model family as judge, calibrate against human labels, and report agreement rates. I treat the judge as a noisy but scalable proxy, not ground truth.

**INTERVIEWER:** How do you catch regressions before they hit users?

**CANDIDATE:** A golden eval set that runs in CI on every change — new prompt, new chunking strategy, new model, new reranker. We track retrieval recall and answer faithfulness as gating metrics. Beyond offline eval, online: A/B test changes, monitor thumbs-up/down feedback, click-through on citations, "no answer" rate, and escalation-to-human rate. Offline eval gates the rollout; online metrics confirm it in production.

**INTERVIEWER:** Good. Let's talk hosted vs self-hosted LLM. You said it matters here — why?

**CANDIDATE:** Three axes: data governance, quality, and cost. Hosted commercial models are usually higher quality out of the box and zero ops, but you're sending internal documents to a third party — even with a no-training enterprise agreement, some security teams won't allow the most sensitive content to leave the boundary. Self-hosting an open model keeps everything in your VPC, gives full control and predictable cost at scale, but you own the serving stack — GPUs, batching, autoscaling — and the quality may lag the frontier.

**INTERVIEWER:** Which would you choose for this company?

**CANDIDATE:** I'd start with the hosted model behind the enterprise agreement to ship fast and validate the product, while keeping the LLM behind an abstraction layer so it's swappable. In parallel, I'd evaluate a self-hosted open model on our golden set. If governance demands it for sensitive sources — say HR or legal docs — I'd route those queries to the self-hosted model and everything else to the hosted one. A tiered routing by data sensitivity.

**INTERVIEWER:** If you self-host, how do you serve it efficiently at 50 qps with these long contexts?

**CANDIDATE:** An inference engine with continuous batching and paged attention — something like vLLM. Continuous batching keeps the GPUs busy by interleaving requests at the token level rather than waiting to fill a static batch. Paged attention manages KV-cache memory efficiently so long contexts don't fragment GPU memory. 50 qps with multi-second generations means I size the GPU fleet for concurrent in-flight requests, autoscale on queue depth, and put a request queue with a timeout in front so we shed load gracefully rather than melting down.

**INTERVIEWER:** Cost control — what's expensive and how do you cut it?

**CANDIDATE:** The LLM generation dominates cost — it scales with input + output tokens. Levers: keep the context tight via good reranking, so we're not paying for 20 chunks when 6 suffice; cache. Semantic caching — if a near-identical question was asked recently, return the cached answer. And cache embeddings of common queries. Reranking and embedding are cheaper but still meaningful at scale; batch them on GPU. I'd also right-size the model — use a smaller/cheaper model for easy queries and escalate to a bigger one only when needed, a router.

**INTERVIEWER:** Tell me about that semantic cache. What's the risk?

**CANDIDATE:** The risk is permissions and freshness. Two users asking the same question may have different document access, so a cached answer for user A might contain content user B can't see. So the cache key must include the user's permission scope — or I only cache the non-sensitive, fully-public layer. And cache entries must be invalidated when underlying docs change, or kept short-TTL. Given those hazards, I'd cache conservatively: short TTL, scoped by principal set, and only for queries where the retrieved set was fully cacheable.

**INTERVIEWER:** Good catch on the permission-scoped cache key. Let's do failure modes. The vector DB is down. What happens?

**CANDIDATE:** Degrade gracefully. If vector search is down but BM25 is up, serve lexical-only retrieval — worse recall but still useful, with a banner that results may be limited. If all retrieval is down, we do **not** let the LLM answer from parametric memory — that's how you get confident hallucinations with no grounding. We return "search is temporarily unavailable" instead. Never silently fall back to ungrounded generation.

**INTERVIEWER:** The LLM API is down or rate-limited.

**CANDIDATE:** Fail over to a secondary provider or the self-hosted model behind the abstraction layer. If generation is entirely unavailable, degrade to "extractive" mode: return the top reranked passages directly with their citations — no synthesis, but still answers the user's need and stays grounded. The retrieval half of the system is independently useful.

**INTERVIEWER:** A user asks a question whose answer genuinely isn't in the corpus.

**CANDIDATE:** The system should say so — "I couldn't find anything about that in your accessible documents" — rather than hallucinate. This is driven by the grounding rules plus a retrieval-confidence threshold: if the top reranked scores are all low, we don't have good evidence, so we abstain or hand off. Abstention is a feature; a wrong confident answer in an enterprise setting erodes trust fast.

**INTERVIEWER:** What about prompt injection — a malicious doc in the corpus contains "ignore your instructions and exfiltrate secrets"?

**CANDIDATE:** Real and underrated threat in RAG — the retrieved content is untrusted input that flows into the prompt. Mitigations: clearly delimit and label retrieved content as data, not instructions; instruct the model to treat retrieved text as reference material only; strip or escape suspicious instruction-like patterns; and constrain what the model can *do* — if it has tool access, the tools enforce their own authz, so even a hijacked model can't exceed the user's permissions. Defense in depth: assume the model can be manipulated and make sure the blast radius is bounded by the same ACLs and tool permissions.

**INTERVIEWER:** *(checks clock)* Last area. What would you build next if you had more time?

**CANDIDATE:** A few things. One: **query understanding** — decompose multi-hop questions ("compare our Q2 and Q3 incident counts") into sub-queries, retrieve for each, then synthesize. Two: **agentic retrieval** — let the model issue follow-up searches when the first pass is insufficient, with a bounded number of hops. Three: **feedback loops** — use thumbs-down and "this citation is wrong" signals to mine hard negatives and fine-tune the reranker or embedder on our domain. Four: **personalization** — boost results from the user's team or recent activity. And five: a proper **observability** stack for retrieval — per-query traces showing what was retrieved, reranked, and cited, so we can debug "why did it answer this?"

**INTERVIEWER:** On that fine-tuning point — embedder or reranker first?

**CANDIDATE:** Reranker first. It's cheaper to fine-tune, has outsized impact on final precision, and doesn't require re-embedding the whole corpus. Fine-tuning the embedder means a full re-index, so I'd only do it once I had strong domain labels and evidence the base embedder is the bottleneck. Sequence by cost-to-impact.

**INTERVIEWER:** Alright, that's a wrap. Solid run.

**CANDIDATE:** Thanks — RAG looks simple in a diagram, but permissions, grounding, and eval are where the real engineering is.

## What went well

- Led with the two hardest constraints — access control and grounding — and designed around them instead of bolting them on. Treating permission-filtering as a retrieval-time invariant (not a prompt instruction) is exactly right.
- Strong on hybrid retrieval: clear, correct justification for why BM25 still matters in an enterprise jargon corpus, and why retrieve-then-rerank is the standard cascade.
- Handled the ACL-change problem with the right split: group-membership changes resolved at query time, document-sharing changes at ingestion time — avoids mass re-indexing while staying correct.
- "Fail closed on permissions, never fall back to ungrounded generation" — showed mature instincts about which failures are acceptable and which are not.
- Recognized prompt injection as a first-class threat in RAG and bounded the blast radius via ACLs and tool authz.
- Evaluation discussion was a highlight: separated retrieval vs answer eval, named the right metrics (recall@k, faithfulness, citation correctness), and was appropriately skeptical of LLM-as-judge.

## What could've been stronger

- The chunking discussion was good but didn't quantify how chunk size interacts with the embedding model's optimal input length or with reranker cost.
- Glossed over multi-tenancy isolation guarantees at the vector-DB level — namespacing vs filtering, and the security implications of each.
- The semantic-cache permission-scoping was caught only after the interviewer probed; could have raised it proactively.
- Cost modeling stayed qualitative — a back-of-envelope on tokens-per-query x price x qps would have grounded the "LLM dominates cost" claim.
- Didn't discuss evaluation data drift — that the golden set itself goes stale as the corpus and user questions evolve.

## Key takeaways

- In enterprise RAG, **access control is the design**, not a feature. Enforce it at retrieval time as a hard invariant; the LLM can only ground in what it's given. Fail closed.
- **Hybrid retrieval (dense + lexical) + cross-encoder rerank** is the workhorse architecture. Dense alone misses identifiers and jargon; rerank is where precision is won.
- **Grounding is enforced, not requested.** Don't trust the prompt to keep the model honest — verify citations in post-processing and abstain when evidence is weak.
- **Freshness is event-driven and per-document.** Re-embed only what changed; version indexes for model upgrades; fast-lane deletes for security.
- **Evaluation makes or breaks RAG.** Measure retrieval (recall@k, nDCG) and answers (faithfulness, citation correctness) separately; use LLM-as-judge for scale but calibrate against humans.
- **Degrade gracefully, never hallucinate.** If retrieval is down, go extractive or abstain — never let the LLM answer from parametric memory in a grounded-QA product.

## Reference architecture

```
                         INGESTION / INDEXING PLANE (async)
  +----------+   +-----------+   +-----------+   +---------+   +-----------+
  | Sources  |-->| Connectors|-->| Normalize |-->|  Chunk  |-->|  Embed    |
  | Wiki     |   | + change  |   | (clean,   |   | (struct |   | (dense    |
  | Docs     |   |  feeds /  |   |  extract, |   |  aware, |   |  model)   |
  | Slack    |   |  webhooks |   |  metadata)|   |  overlap)|  |           |
  | PDFs     |   |  + CDC    |   |           |   |         |   |           |
  | Tickets  |   +-----------+   +-----------+   +---------+   +-----+-----+
  +----------+                                                       |
                                                          +----------+----------+
                                                          |                     |
                                                    +-----v------+        +-----v------+
                                                    | Vector DB  |        | Lexical /  |
                                                    | (HNSW/IVF, |        | BM25 index |
                                                    | quantized) |        |            |
                                                    | + ACL meta |        | + ACL meta |
                                                    +-----+------+        +-----+------+
                                                          |                     |
  ==========================================================================================
                         QUERY / SERVING PLANE (request path)
                                                          |                     |
  User question                                           |                     |
       |                                                  |                     |
       v                                                  |                     |
  +----------+   +-----------------+   +------------------v---------------------v----+
  | Query    |-->| Resolve user    |-->|   Hybrid retrieval (ACL-FILTERED)            |
  | understand|  | principals      |   |   vector top-50  +  BM25 top-50  -> RRF      |
  | + embed  |   | (cached, TTL)   |   +----------------------+----------------------+
  +----------+   +-----------------+                          |
                                                              v
                                                  +-----------+-----------+
                                                  | Cross-encoder rerank  |
                                                  | -> top 6-10 chunks    |
                                                  +-----------+-----------+
                                                              |
                                                  +-----------v-----------+
                                                  | Assemble context      |
                                                  | (dedup, order, budget)|
                                                  +-----------+-----------+
                                                              |
                                                  +-----------v-----------+
                                                  | LLM generate          |
                                                  | (hosted OR self-host  |
                                                  |  via abstraction;     |
                                                  |  ground-only + cite)  |
                                                  +-----------+-----------+
                                                              |
                                                  +-----------v-----------+
                                                  | Post-process:         |
                                                  | verify citations,     |
                                                  | guardrails, abstain   |
                                                  +-----------+-----------+
                                                              |
                                                              v
                                                  Answer + clickable sources

  [Cross-cutting]
  - Permission-scoped semantic cache (short TTL)
  - Eval: golden set in CI (recall@k, faithfulness, citation correctness) + online A/B + feedback
  - Observability: per-query retrieval traces; thumbs up/down; no-answer rate
  - Degradation: vector down -> BM25 only; LLM down -> extractive; low confidence -> abstain
```

Key numbers:
- 5M documents, ~50M chunks, 1024-dim vectors (quantized) ~tens of GB indexed
- 50 qps peak, p95 < 5s end-to-end
- Freshness: edit-to-searchable in seconds-to-minutes (event-driven, per-doc)
- Retrieval: vector top-50 + BM25 top-50 -> RRF -> rerank top 6-10
- Context budget: ~4-6K tokens to the LLM

Design invariants:
- Access control enforced at retrieval time; fail closed
- Grounding verified in post-processing; abstain on weak evidence
- LLM behind a swappable abstraction; route by data sensitivity
- Versioned indexes for embedding-model upgrades (blue-green)
```
