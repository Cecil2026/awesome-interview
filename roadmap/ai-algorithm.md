# AI / ML Engineer Interview Roadmap (8-week plan)

## Who this is for

Software engineer with 2-5 years of experience pivoting into (or leveling up in) AI/ML engineering roles — the kind that sit between research and production: building LLM-powered features, RAG pipelines, model-serving infrastructure, and evaluation harnesses. You can code fluently and have shipped services, but interviews here add a second axis on top of the standard SWE bar: applied ML fundamentals, LLM/system fluency, and ML-system design. This is a starter roadmap — a solid skeleton meant to be expanded, not an exhaustive syllabus.

## Time commitment

- Weekday: 1.5-2 hours
- Weekend: 5-7 hours
- Total: ~90-110 hours over 8 weeks

## Prerequisites

- Fluent in Python (you can write a class, a generator, and use `numpy`/`pandas` without docs)
- Comfortable with the standard SWE algorithm bar (arrays, hashing, trees, graphs) — this roadmap does not re-teach it
- Basic linear algebra and probability (vectors, matrices, dot products, conditional probability, expectation)
- You've called at least one ML model or LLM API from code

## What this loop tests (and this plan targets)

1. **Coding** — the usual algorithm gate, plus occasional array/matrix and data-manipulation problems.
2. **ML fundamentals** — bias/variance, overfitting, regularization, evaluation metrics, the intuition behind common models.
3. **ML / LLM system design** — "design a recommendation system", "design a RAG-based Q&A service", "how would you serve and evaluate this model at scale".
4. **Behavioral** — ownership, ambiguity, and how you reason about model risk and failure.

## The plan

### Week 1: ML fundamentals refresher

**Focus:** rebuild the vocabulary interviewers probe in the first 10 minutes.

- [ ] Bias-variance tradeoff, overfitting vs underfitting, and the fixes (regularization, more data, simpler model, cross-validation)
- [ ] Supervised vs unsupervised vs self-supervised; classification vs regression
- [ ] Train/validation/test splits, data leakage, and why a leaked feature ruins everything
- [ ] Read: a concise refresher on gradient descent and the role of the learning rate

**Milestone:** explain bias-variance and one concrete way you'd diagnose overfitting from a learning curve, out loud, in 3 minutes.

### Week 2: Evaluation metrics and model intuition

**Focus:** metrics are the single most common "do you actually understand ML" filter.

- [ ] Precision, recall, F1, ROC-AUC, PR-AUC — and when each is the wrong choice (class imbalance!)
- [ ] Regression metrics (MAE, RMSE, R²) and what each penalizes
- [ ] Intuition (not derivations) for logistic regression, decision trees, gradient boosting, and k-means
- [ ] Confusion matrix reasoning: pick the metric that matches the business cost of each error type

**Milestone:** given a fraud-detection scenario with 0.1% positives, argue which metric you optimize and why accuracy is a trap.

### Week 3: Deep learning and transformers

**Focus:** enough architecture fluency to reason about modern models.

- [ ] Neural net basics: layers, activations, backprop at an intuition level, vanishing/exploding gradients
- [ ] The attention mechanism and the transformer block — what self-attention computes and why it scales
- [ ] Embeddings: what a vector representation is and why semantic similarity ≈ cosine distance
- [ ] Tokenization, context windows, and what "parameters" actually count

**Milestone:** explain self-attention to a non-ML engineer in 5 minutes without hand-waving the QKV part.

### Week 4: LLMs in practice

**Focus:** the applied layer most AI-engineer roles actually build on.

- [ ] Prompting patterns, few-shot, and why structured output/function-calling matters in production
- [ ] Fine-tuning vs RAG vs prompting — the cost/latency/freshness tradeoff and when each wins
- [ ] Hallucination: why it happens and the mitigations (grounding, retrieval, verification, constrained decoding)
- [ ] Temperature, top-p, and other decoding knobs

**Milestone:** decide fine-tune vs RAG vs prompt for three scenarios and defend each choice.

### Week 5: Retrieval-Augmented Generation (RAG)

**Focus:** the single most-asked AI-engineer system-design topic.

- [ ] The RAG pipeline: chunk → embed → index (vector DB) → retrieve → rerank → generate
- [ ] Chunking strategies and why chunk size/overlap changes answer quality
- [ ] Vector search: approximate nearest neighbor (HNSW/IVF), and hybrid (keyword + vector) retrieval
- [ ] Evaluation: retrieval quality (recall@k) vs generation quality, and why you must measure both

**Milestone:** whiteboard a RAG-based internal-docs Q&A system end to end, including how you'd evaluate it.

### Week 6: ML system design

**Focus:** the differentiator round — designing ML systems, not just models.

- [ ] The template: requirements → data → features → model → serving → evaluation → monitoring
- [ ] Training/serving skew, feature stores, and offline vs online features
- [ ] Batch vs real-time inference; model serving, batching, and latency/throughput tradeoffs
- [ ] Monitoring: data drift, concept drift, and how you know a live model has degraded
- [ ] Practice: design a recommendation system and a content-moderation system

**Milestone:** run one 45-minute ML-system-design mock and get feedback on structure and depth.

### Week 7: MLOps and production concerns

**Focus:** show you can ship and operate, not just prototype.

- [ ] Experiment tracking, model versioning, and reproducibility
- [ ] CI/CD for models, canary/shadow deployment, and rollback
- [ ] A/B testing a model change and reading the result honestly
- [ ] Cost: GPU economics, caching LLM responses, and when a smaller model is the right call

**Milestone:** sketch how you'd safely roll out a new model version to 1% of traffic and decide go/no-go.

### Week 8: Mock loops and behavioral

**Focus:** integrate everything under interview conditions.

- [ ] 2 full ML-system-design mocks (45 min each), different domains
- [ ] 1 ML-fundamentals rapid-fire round (metrics, tradeoffs, model intuition)
- [ ] Prepare 6-8 STAR stories, including one about a model/experiment that failed and what you learned
- [ ] Prepare your questions for the interviewer about their ML stack and evaluation culture

**Milestone:** clean mock loop — a system design, a fundamentals round, and a behavioral — with written self-feedback.

## Related material in this repo

- Knowledge bank: [knowledge/ai.md](../knowledge/ai.md) — AI/ML Q&A
- Knowledge bank: [knowledge/system-design.md](../knowledge/system-design.md) — scenario walkthroughs
- Behavioral: [behavioral/README.md](../behavioral/README.md) — STAR and principles
- Checklist: [roadmap/checklist.md](checklist.md) — the pre-interview readiness list
